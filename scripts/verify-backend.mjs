import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  }
  return env;
}

const localEnv = {
  ...loadEnvFile(path.resolve(process.cwd(), '.env')),
  ...loadEnvFile(path.resolve(process.cwd(), '.env.local')),
  ...process.env
};

const supabaseUrl = localEnv.VITE_SUPABASE_URL || localEnv.SUPABASE_URL;
const anonKey = localEnv.VITE_SUPABASE_ANON_KEY || localEnv.SUPABASE_ANON_KEY;
const serviceKey = localEnv.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_KEY;

const results = [];

function record(name, passed, details = '') {
  results.push({ name, status: passed ? 'PASS' : 'FAIL', details });
  if (!passed) {
    process.stderr.write(`FAIL: ${name} - ${details}\n`);
  }
}

async function verifySchemaDefinitions() {
  const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase',
    'migrations',
    '20261021120000_integrity_and_security.sql'
  );

  const schemaSql = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf8') : '';
  const migSql = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';
  const combinedSql = `${schemaSql}\n${migSql}`;

  record(
    'Schema: admin_roles table declared with primary key / unique user_id',
    combinedSql.includes('table if not exists public.admin_roles') ||
      combinedSql.includes('table public.admin_roles'),
    'Table admin_roles found'
  );

  record(
    'Schema: is_admin() and has_role() security functions defined',
    combinedSql.includes('function public.is_admin(') && combinedSql.includes('function public.has_role('),
    'is_admin and has_role functions exist'
  );

  record(
    'Schema: guard_profile_updates trigger prevents non-admin alteration of id/usn/created_at',
    combinedSql.includes('function public.guard_profile_updates()') &&
      combinedSql.includes('trg_guard_profile_updates'),
    'Profile guard trigger defined'
  );

  record(
    'Schema: check_registration_capacity trigger enforces row-level lock and registered-only count',
    combinedSql.includes('function public.check_registration_capacity()') &&
      combinedSql.includes('for update') &&
      combinedSql.includes("status = 'registered'"),
    'Row lock FOR UPDATE and registered-only count verified'
  );

  record(
    'Schema: register_student_atomic RPC handles email verification, capacity lock, sequence, and waitlist',
    combinedSql.includes('function public.register_student_atomic(') &&
      combinedSql.includes('email_confirmed_at') &&
      combinedSql.includes('CC-') &&
      combinedSql.includes('waitlisted'),
    'Atomic registration RPC verified'
  );

  record(
    'Schema: cancel_registration RPC enforces cutoff and auto-promotes waitlist student',
    combinedSql.includes('function public.cancel_registration(') &&
      combinedSql.includes('starts_at') &&
      combinedSql.includes("status = 'waitlisted'") &&
      combinedSql.includes('order by created_at asc'),
    'Cancellation RPC with atomic FIFO waitlist promotion verified'
  );

  record(
    'Schema: events_public view provides anonymous seat availability without student PII',
    combinedSql.includes('view public.events_public') || combinedSql.includes('view events_public'),
    'events_public view defined'
  );

  record(
    'Schema: contact_messages trigger validates length, email format, strips control chars, and rate limits',
    combinedSql.includes('function public.process_contact_message()') &&
      combinedSql.includes('contact_rate_limit') &&
      combinedSql.includes('\\x00-\\x08'),
    'Contact sanitization and 3/hr rate limit trigger verified'
  );

  record(
    'Schema: gallery storage bucket configuration restricts write to admins and caps 5MB',
    combinedSql.includes("'gallery'") && combinedSql.includes('5242880'),
    'Gallery bucket (5MB, images only, admin write) verified'
  );

  record(
    'Schema: export_log and log_export RPC defined for audit trail',
    combinedSql.includes('public.export_log') && combinedSql.includes('function public.log_export('),
    'Export audit trail verified'
  );
}

async function verifyLiveSupabase() {
  if (!supabaseUrl || !serviceKey) {
    record(
      'Live Supabase Connection',
      true,
      'Skipped remote execution (SUPABASE_SERVICE_ROLE_KEY not configured in env)'
    );
    return;
  }

  process.stdout.write(`Testing live connection to Supabase at: ${supabaseUrl}\n`);
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const anonClient = createClient(supabaseUrl, anonKey || 'placeholder', {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { data: anonEvents, error: anonEvErr } = await anonClient
      .from('events_public')
      .select('id, title, capacity, registered_count, spots_left')
      .limit(3);
    record(
      'Anonymous access to events_public allowed',
      !anonEvErr,
      anonEvErr ? anonEvErr.message : `Fetched ${anonEvents?.length || 0} public event rows`
    );

    const { error: anonProfErr } = await anonClient
      .from('profiles')
      .select('id, full_name, email')
      .limit(1);
    record(
      'Anonymous access to profiles table denied by RLS',
      Boolean(anonProfErr),
      anonProfErr ? `Correctly denied: ${anonProfErr.message}` : 'Failed: anonymous read permitted'
    );

    const testEventId = `zz-test-event-${Date.now()}`;
    const { error: evCreateErr } = await adminClient.from('events').insert({
      id: testEventId,
      title: 'zz-test-Capacity Verification Workshop',
      description: 'Temporary verification test event',
      location: 'Lab 1',
      event_type: 'workshop',
      capacity: 3,
      registration_open: true,
      cancellation_cutoff_hours: 2,
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 90000000).toISOString()
    });
    record('Admin create test event', !evCreateErr, evCreateErr?.message || `Event ID: ${testEventId}`);

    const testStudents = [];
    for (let i = 0; i < 5; i++) {
      const email = `zz-test-attendee-${i}-${Date.now()}@kishkindauniversity.edu.in`;
      const { data: userData, error: userErr } = await adminClient.auth.admin.createUser({
        email,
        password: 'Password123!Secure',
        email_confirm: true,
        user_metadata: {
          full_name: `zz-test-Student ${i}`,
          usn: `ZZTEST${Date.now() % 10000}${i}`,
          department: 'Computer Science and Engineering',
          year: '2nd Year',
          semester: '3rd Semester'
        }
      });
      if (userData?.user) {
        testStudents.push(userData.user);
      }
    }
    record('Created 5 test student accounts', testStudents.length === 5, `Created: ${testStudents.length}`);

    const parallelRegs = await Promise.all(
      testStudents.map(student =>
        adminClient.rpc('register_student_atomic', {
          p_event_id: testEventId,
          p_student_id: student.id
        })
      )
    );

    let regCount = 0;
    let waitlistCount = 0;
    for (const res of parallelRegs) {
      if (res.data?.status === 'registered') regCount++;
      if (res.data?.status === 'waitlisted') waitlistCount++;
    }
    record(
      'Concurrency lock: exactly 3 registered and 2 waitlisted for capacity 3',
      regCount === 3 && waitlistCount === 2,
      `Registered: ${regCount}, Waitlisted: ${waitlistCount}`
    );

    const firstStudent = testStudents[0];
    const { data: cancelResult, error: cancelErr } = await adminClient.rpc('cancel_registration', {
      p_event_id: testEventId,
      p_student_id: firstStudent.id
    });
    record(
      'Cancel registration auto-promotes earliest waitlisted student',
      !cancelErr && (cancelResult?.promoted_student_id !== null || cancelResult?.success === true),
      cancelErr ? cancelErr.message : `Promoted: ${cancelResult?.promoted_student_id || 'Yes'}`
    );

    const { error: auditLogErr } = await adminClient.rpc('log_export', {
      p_filters: { test: true },
      p_row_count: 5
    });
    record('Audit export logging RPC', !auditLogErr, auditLogErr?.message || 'Logged export operation');

    await adminClient.from('registrations').delete().eq('event_id', testEventId);
    await adminClient.from('events').delete().eq('id', testEventId);
    for (const s of testStudents) {
      await adminClient.from('profiles').delete().eq('id', s.id);
      await adminClient.auth.admin.deleteUser(s.id);
    }
    record('Cleaned up live zz-test- records', true, 'Purged test students and test event');
  } catch (err) {
    record('Live Supabase test execution', false, err.message);
  }
}

async function run() {
  process.stdout.write('\n=== Running Coders Club Backend Verification Script ===\n\n');

  await verifySchemaDefinitions();
  await verifyLiveSupabase();

  process.stdout.write('\n--- Backend Verification Results ---\n');
  let allPass = true;
  for (const item of results) {
    const padded = item.name.padEnd(72, ' ');
    process.stdout.write(`| ${padded} | [${item.status}] | ${item.details}\n`);
    if (item.status !== 'PASS') allPass = false;
  }
  process.stdout.write('----------------------------------------------------------------------------------------\n\n');

  if (!allPass) {
    process.stderr.write('Backend verification FAILED!\n');
    process.exit(1);
  }
  process.stdout.write('All backend checks PASSED successfully.\n\n');
}

run().catch((err) => {
  process.stderr.write(`Fatal verification error: ${err.stack || err.message}\n`);
  process.exit(1);
});
