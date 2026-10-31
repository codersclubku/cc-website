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
  ...process.env
};

const targetEmail = (process.argv[2] || '').trim().toLowerCase();

async function run() {
  process.stdout.write('\n=== Coders Club Admin Bootstrap Script ===\n\n');

  if (!targetEmail) {
    process.stdout.write('Usage: node scripts/make-admin.mjs <user-email>\n\n');
    process.stdout.write('Alternatively, run the following SQL directly in your Supabase SQL Editor:\n');
    process.stdout.write('-------------------------------------------------------------------------\n');
    process.stdout.write("INSERT INTO public.admin_roles (user_id, role)\n");
    process.stdout.write("SELECT id, 'admin'\n");
    process.stdout.write("FROM auth.users\n");
    process.stdout.write("WHERE lower(email) = lower('<user-email>')\n");
    process.stdout.write("ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;\n");
    process.stdout.write('-------------------------------------------------------------------------\n\n');
    process.exit(1);
  }

  process.stdout.write(`Target Email: ${targetEmail}\n`);

  const supabaseUrl = localEnv.VITE_SUPABASE_URL || localEnv.SUPABASE_URL;
  const serviceKey = localEnv.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    process.stdout.write('\nNotice: SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL not present in environment.\n');
    process.stdout.write('To promote this user manually, execute this SQL in the Supabase Dashboard SQL Editor:\n\n');
    process.stdout.write(`INSERT INTO public.admin_roles (user_id, role)\nSELECT id, 'admin'\nFROM auth.users\nWHERE lower(email) = '${targetEmail}'\nON CONFLICT (user_id) DO UPDATE SET role = 'admin';\n\n`);
    process.exit(0);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: usersData, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) {
    throw new Error(`Failed to list users from auth.admin: ${userErr.message}`);
  }

  const match = usersData.users.find(u => (u.email || '').toLowerCase() === targetEmail);
  if (!match) {
    process.stderr.write(`Error: No auth user found with email "${targetEmail}".\n`);
    process.stderr.write('Make sure the user has signed up through the website or auth portal first.\n');
    process.exit(1);
  }

  const { error: insertErr } = await supabase
    .from('admin_roles')
    .upsert({ user_id: match.id, role: 'admin' }, { onConflict: 'user_id' });

  if (insertErr) {
    throw new Error(`Failed to upsert admin_roles: ${insertErr.message}`);
  }

  process.stdout.write(`SUCCESS: Granted 'admin' role to user ID: ${match.id} (${targetEmail})\n\n`);
}

run().catch(err => {
  process.stderr.write(`Admin bootstrap failed: ${err.message}\n`);
  process.exit(1);
});
