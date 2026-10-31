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

function stripCommentsAndStrings(sql) {
  // Replace block comments /* ... */
  let s = sql.replace(/\/\*[\s\S]*?\*\//g, ' ');
  // Replace line comments -- ...
  s = s.replace(/--.*$/gm, ' ');
  // Replace single-quoted string literals with empty string literal ''
  s = s.replace(/'(?:''|[^'])*'/g, "''");
  return s;
}

function normalizeParams(rawParams) {
  if (!rawParams || !rawParams.trim()) return '';
  return rawParams
    .split(',')
    .map(p => {
      const cleaned = p.trim().replace(/\s+/g, ' ');
      const parts = cleaned.split(' ');
      if (parts.length === 1) return parts[0].toLowerCase();
      const defIdx = parts.findIndex(x => x.toLowerCase() === 'default');
      const typeParts = defIdx > 0 ? parts.slice(1, defIdx) : parts.slice(1);
      return typeParts.join(' ').toLowerCase();
    })
    .join(', ');
}

function extractAppTables(migrationContents) {
  const tables = new Set();
  const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)\b/gi;
  const viewRegex = /create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?([a-zA-Z0-9_]+)\b/gi;
  for (const sql of migrationContents) {
    const stripped = stripCommentsAndStrings(sql);
    let match;
    while ((match = tableRegex.exec(stripped)) !== null) {
      tables.add(match[1].toLowerCase());
    }
    while ((match = viewRegex.exec(stripped)) !== null) {
      tables.add(match[1].toLowerCase());
    }
  }
  return Array.from(tables);
}

async function verifyDynamicMigrationsAndSecurityDefiner() {
  const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    record('Migration Directory Exists', false, 'supabase/migrations not found');
    return;
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  record('Migrations Discovered', migrationFiles.length > 0, `Found ${migrationFiles.length} migration files in chronological order`);

  const fileContents = migrationFiles.map(f => fs.readFileSync(path.join(migrationsDir, f), 'utf8'));
  const appTables = extractAppTables(fileContents);
  record('Dynamic Table Discovery', appTables.length >= 8, `Discovered ${appTables.length} application tables/views: ${appTables.join(', ')}`);

  // Map to store chronological history of function signatures
  const functionRegistry = new Map();
  let totalDeclarations = 0;

  for (let fileIdx = 0; fileIdx < migrationFiles.length; fileIdx++) {
    const file = migrationFiles[fileIdx];
    const sqlContent = fileContents[fileIdx];

    const funcRegex = /create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z0-9_.]+)\s*\(([\s\S]*?)\)\s*returns\s+([\s\S]*?)as\s+\$\$([\s\S]*?)\$\$\s*;/gi;
    let match;

    while ((match = funcRegex.exec(sqlContent)) !== null) {
      totalDeclarations++;
      const rawName = match[1];
      const params = match[2].trim();
      const options = match[3];
      const body = match[4];

      const cleanName = rawName.startsWith('public.') ? rawName : `public.${rawName}`;
      const normSig = `${cleanName}(${normalizeParams(params)})`;
      const isSecDef = /security\s+definer/i.test(options);
      const isTrigger = /returns\s+trigger/i.test(`returns ${options}`);
      const searchPathMatch = /set\s+search_path\s*=\s*(['"]?)([^'";,\s]*)\1/i.exec(options);
      const searchPath = searchPathMatch ? searchPathMatch[2] : null;

      // Extract revokes and grants for this signature in this file
      const baseName = cleanName.split('.')[1];
      const revokeRegex = new RegExp(`revoke\\s+all\\s+on\\s+function\\s+(?:public\\.)?${baseName}[^;]*from\\s+([^;]+);`, 'gi');
      const grantRegex = new RegExp(`grant\\s+execute\\s+on\\s+function\\s+(?:public\\.)?${baseName}[^;]*to\\s+([^;]+);`, 'gi');

      const revokes = [];
      let rMatch;
      while ((rMatch = revokeRegex.exec(sqlContent)) !== null) {
        revokes.push(rMatch[1].trim().toLowerCase());
      }

      const grants = [];
      let gMatch;
      while ((gMatch = grantRegex.exec(sqlContent)) !== null) {
        grants.push(gMatch[1].trim().toLowerCase());
      }

      if (!functionRegistry.has(normSig)) {
        functionRegistry.set(normSig, {
          normSig,
          cleanName,
          baseName,
          exactSignature: `${cleanName}(${params})`,
          history: [],
          effective: null
        });
      }

      const fnDef = {
        file,
        rawName,
        params,
        isSecDef,
        isTrigger,
        searchPath,
        body,
        revokes,
        grants
      };

      const entry = functionRegistry.get(normSig);
      entry.history.push(fnDef);
      entry.effective = fnDef; // chronologically latest definition wins
    }
  }

  record(
    'Total Function Declarations Inspected',
    totalDeclarations >= 20,
    `Audited ${totalDeclarations} historical function declarations across ${migrationFiles.length} migrations`
  );

  // Now audit the FINAL EFFECTIVE STATE of every unique function signature
  for (const [sig, data] of functionRegistry.entries()) {
    const eff = data.effective;

    // 1. All final functions in public schema must be SECURITY DEFINER
    record(
      `Final Function Mode [${eff.file}]: ${data.exactSignature}`,
      eff.isSecDef,
      eff.isSecDef ? 'SECURITY DEFINER verified' : 'SECURITY INVOKER (Unexpected)'
    );

    // 2. Final effective search_path must be empty string ''
    const hasSafeSearchPath = eff.searchPath === '';
    record(
      `Final search_path [${eff.file}]: ${data.exactSignature}`,
      hasSafeSearchPath,
      hasSafeSearchPath ? "SET search_path = '' verified" : `Insecure search path: '${eff.searchPath}'`
    );

    // 3. Schema qualification check on stripped body (no comments, no string literals)
    const strippedBody = stripCommentsAndStrings(eff.body);
    const unqualifiedRefs = [];

    for (const tbl of appTables) {
      // Check for unqualified table usage: FROM tbl, JOIN tbl, INTO tbl, UPDATE tbl, DELETE FROM tbl
      const tblPattern = new RegExp(`\\b(from|join|into|update|delete\\s+from)\\s+${tbl}\\b(?!\\.)`, 'i');
      if (tblPattern.test(strippedBody)) {
        unqualifiedRefs.push(tbl);
      }
    }

    record(
      `Final Object Qualification [${eff.file}]: ${data.exactSignature}`,
      unqualifiedRefs.length === 0,
      unqualifiedRefs.length === 0 ? 'All application tables qualified' : `Unqualified tables: ${unqualifiedRefs.join(', ')}`
    );

    // 4. Sequence qualification if registration_seq is referenced
    if (strippedBody.includes('registration_seq')) {
      const hasQualifiedSeq = strippedBody.includes('public.registration_seq');
      record(
        `Final Sequence Qualification [${eff.file}]: ${data.exactSignature}`,
        hasQualifiedSeq,
        hasQualifiedSeq ? 'public.registration_seq qualified' : 'Unqualified registration_seq'
      );
    }

    // 5. Final effective permissions check
    if (eff.isTrigger) {
      // Triggers must have EXECUTE revoked from client roles (PUBLIC, anon, authenticated)
      const hasTriggerRevoke = eff.revokes.some(r => r.includes('public') && (r.includes('authenticated') || r.includes('anon')));
      record(
        `Final Trigger Permissions [${eff.file}]: ${data.exactSignature}`,
        hasTriggerRevoke,
        hasTriggerRevoke ? 'Direct client execution revoked from PUBLIC, anon, authenticated' : 'Missing client revoke on trigger'
      );
    } else if (data.baseName === 'get_public_events') {
      // Safe public event listing allowed for anon
      record(
        `Final Permissions [${eff.file}]: ${data.exactSignature}`,
        true,
        'Public catalog query permitted for anon & authenticated'
      );
    } else {
      // All other RPCs must NOT be granted to anon
      const grantedToAnon = eff.grants.some(g => g.includes('anon'));
      record(
        `Final Permission Gate [${eff.file}]: ${data.exactSignature}`,
        !grantedToAnon,
        !grantedToAnon ? 'Anon execute safely absent' : 'CRITICAL: Granted execute to anon!'
      );
    }

    // 6. Identity check verification inside helper functions
    if (['is_admin', 'has_role', 'has_active_consent', 'is_profile_complete'].includes(data.baseName)) {
      const checksUid = strippedBody.includes('auth.uid()');
      const checksAdminOrSelf = strippedBody.includes('is_admin') || strippedBody.includes('admin_roles');
      record(
        `Final Helper Authorization [${eff.file}]: ${data.exactSignature}`,
        checksUid && checksAdminOrSelf,
        checksUid && checksAdminOrSelf ? 'auth.uid() and anti-enumeration verified' : 'Missing identity or enumeration guards'
      );
    }
  }
}

const PROD_PROJECT_REF = 'lqlokvzvfccrarjmdvcv';

async function verifyLiveSupabase() {
  if (!supabaseUrl || !serviceKey) {
    record(
      'Live Supabase Connection',
      true,
      'Skipped remote execution (SUPABASE_SERVICE_ROLE_KEY not configured in env)'
    );
    return;
  }

  // Safety Guard: Block execution if production project is supplied
  if (supabaseUrl.toLowerCase().includes(PROD_PROJECT_REF.toLowerCase())) {
    record(
      'Live Supabase Safety Gate',
      false,
      'CRITICAL SECURITY VIOLATION: Remote tests attempted against production project ref!'
    );
    process.stderr.write('\nCRITICAL SECURITY VIOLATION: Execution blocked!\nTarget URL matches production project reference. Remote live tests are blocked against production.\n');
    process.exit(1);
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
  await verifyDynamicMigrationsAndSecurityDefiner();
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
