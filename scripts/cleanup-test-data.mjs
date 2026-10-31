import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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
  ...loadEnvFile(path.resolve(process.cwd(), '.env.staging.local')),
  ...process.env
};

const supabaseUrl = localEnv.STAGING_SUPABASE_URL || localEnv.VITE_SUPABASE_URL || localEnv.SUPABASE_URL;
const serviceKey = localEnv.STAGING_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_KEY;

async function runCleanup() {
  process.stdout.write('\n=== Coders Club Test Data Cleanup Script ===\n\n');

  if (!supabaseUrl || !serviceKey) {
    process.stdout.write('Notice: Supabase URL or SUPABASE_SERVICE_ROLE_KEY not configured in environment or .env.local.\n');
    process.stdout.write('Skipping live remote database cleanup. No remote test records modified.\n\n');
    process.exit(0);
  }

  const PROD_PROJECT_REF = 'lqlokvzvfccrarjmdvcv';
  if (supabaseUrl.toLowerCase().includes(PROD_PROJECT_REF.toLowerCase())) {
    process.stderr.write('\nCRITICAL SECURITY VIOLATION: Execution blocked!\nTarget URL matches production project reference. Cleanup script is blocked from running on production.\n');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const summary = [];

  const { data: testProfiles } = await supabase
    .from('profiles')
    .select('id')
    .or('full_name.ilike.zz-test-%,usn.ilike.zz-test-%,full_name.ilike.staging-%,usn.ilike.KU2024CS%,usn.ilike.2KA22CS%');

  const testUserIds = (testProfiles || []).map(p => p.id);

  // 1. Registrations
  try {
    const { error: regErr, count: regCount } = await supabase
      .from('registrations')
      .delete({ count: 'exact' })
      .or(`id.ilike.zz-test-%,student_id.in.(${testUserIds.length ? testUserIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);
    summary.push({ table: 'registrations', removed: regCount || 0, error: regErr?.message || null });
  } catch (err) {
    summary.push({ table: 'registrations', removed: 0, error: err.message });
  }

  // 2. Consents
  try {
    if (testUserIds.length > 0) {
      const { error: conErr, count: conCount } = await supabase
        .from('consents')
        .delete({ count: 'exact' })
        .in('student_id', testUserIds);
      summary.push({ table: 'consents', removed: conCount || 0, error: conErr?.message || null });
    } else {
      summary.push({ table: 'consents', removed: 0, error: null });
    }
  } catch (err) {
    summary.push({ table: 'consents', removed: 0, error: err.message });
  }

  // 3. Admin Roles
  try {
    const { error: rolesErr, count: rolesCount } = await supabase
      .from('admin_roles')
      .delete({ count: 'exact' })
      .in('user_id', testUserIds.length ? testUserIds : ['00000000-0000-0000-0000-000000000000']);
    summary.push({ table: 'admin_roles', removed: rolesCount || 0, error: rolesErr?.message || null });
  } catch (err) {
    summary.push({ table: 'admin_roles', removed: 0, error: err.message });
  }

  // 4. Profiles
  try {
    const { error: profErr, count: profCount } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .or('full_name.ilike.zz-test-%,usn.ilike.zz-test-%,full_name.ilike.staging-%');
    summary.push({ table: 'profiles', removed: profCount || 0, error: profErr?.message || null });
  } catch (err) {
    summary.push({ table: 'profiles', removed: 0, error: err.message });
  }

  // 5. Events
  try {
    const { error: evErr, count: evCount } = await supabase
      .from('events')
      .delete({ count: 'exact' })
      .or('id.ilike.zz-test-%,title.ilike.zz-test-%,title.ilike.Staging Security Event%,slug.ilike.staging-sec-event%');
    summary.push({ table: 'events', removed: evCount || 0, error: evErr?.message || null });
  } catch (err) {
    summary.push({ table: 'events', removed: 0, error: err.message });
  }

  // 6. Projects
  try {
    const { error: projErr, count: projCount } = await supabase
      .from('projects')
      .delete({ count: 'exact' })
      .or('id.ilike.zz-test-%,title.ilike.zz-test-%');
    summary.push({ table: 'projects', removed: projCount || 0, error: projErr?.message || null });
  } catch (err) {
    summary.push({ table: 'projects', removed: 0, error: err.message });
  }

  // 7. Contact Messages
  try {
    const { error: msgErr, count: msgCount } = await supabase
      .from('contact_messages')
      .delete({ count: 'exact' })
      .or('id.ilike.zz-test-%,name.ilike.zz-test-%,email.ilike.zz-test-%');
    summary.push({ table: 'contact_messages', removed: msgCount || 0, error: msgErr?.message || null });
  } catch (err) {
    summary.push({ table: 'contact_messages', removed: 0, error: err.message });
  }

  // 8. Storage
  try {
    const { data: storageFiles } = await supabase.storage.from('gallery').list('', { search: 'zz-test-' });
    if (storageFiles && storageFiles.length > 0) {
      const paths = storageFiles.map(f => f.name);
      await supabase.storage.from('gallery').remove(paths);
      summary.push({ table: 'storage:gallery', removed: paths.length, error: null });
    } else {
      summary.push({ table: 'storage:gallery', removed: 0, error: null });
    }
  } catch (err) {
    summary.push({ table: 'storage:gallery', removed: 0, error: err.message });
  }

  // 9. Auth Users
  for (const uid of testUserIds) {
    try {
      await supabase.auth.admin.deleteUser(uid);
    } catch {}
  }

  process.stdout.write('Cleanup Execution Summary:\n');
  for (const s of summary) {
    const tableCol = s.table.padEnd(20, ' ');
    const countCol = String(s.removed).padStart(4, ' ');
    const errCol = s.error ? `[ERROR: ${s.error}]` : '[OK]';
    process.stdout.write(`- ${tableCol}: ${countCol} rows removed ${errCol}\n`);
  }
  process.stdout.write('\nTest data cleanup completed successfully.\n');
}

runCleanup().catch(err => {
  process.stderr.write(`Cleanup failed: ${err.stack || err.message}\n`);
  process.exit(1);
});
