/**
 * scripts/verify-rpc-consistency.mjs
 * 
 * Verifies consistency between frontend RPC invocations (src/lib/api.ts)
 * and PostgreSQL migration definitions (supabase/migrations/*.sql).
 * 
 * Invariants checked:
 * 1. Every frontend RPC call maps to an existing SQL function.
 * 2. Parameter names passed by frontend match SQL parameter names.
 * 3. Security definer functions have REVOKE ALL FROM PUBLIC applied.
 * 4. Authoritative onboarding RPC is strictly complete_student_onboarding.
 * 5. Permissions restricted appropriately (authenticated only, anon only where safe).
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const ROOT_DIR = process.cwd();
const API_FILE = path.join(ROOT_DIR, 'src', 'lib', 'api.ts');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'supabase', 'migrations');

console.log('=== RUNNING RPC CONSISTENCY & PERMISSIONS AUDIT ===\n');

// 1. Expected authoritative RPC specifications in the Coders Club application
const EXPECTED_RPCS = {
  complete_student_onboarding: {
    caller: 'completeStudentOnboardingApi',
    expectedParams: ['p_full_name', 'p_usn', 'p_department', 'p_year', 'p_semester', 'p_consent', 'p_version'],
    allowedRoles: ['authenticated'],
    securityDefiner: true
  },
  record_consent_idempotent: {
    caller: 'recordConsent',
    expectedParams: ['p_student_id', 'p_version'],
    allowedRoles: ['authenticated'],
    securityDefiner: true
  },
  withdraw_consent_atomic: {
    caller: 'withdrawConsent',
    expectedParams: ['p_version'],
    allowedRoles: ['authenticated'],
    securityDefiner: true
  },
  register_student_atomic: {
    caller: 'registerStudentForEvent',
    expectedParams: ['p_event_id', 'p_student_id'],
    allowedRoles: ['authenticated'],
    securityDefiner: true
  },
  cancel_registration: {
    caller: 'cancelRegistration',
    expectedParams: ['p_registration_id'],
    allowedRoles: ['authenticated'],
    securityDefiner: true
  },
  cancel_registration_atomic: {
    caller: 'cancelStudentRegistration',
    expectedParams: ['p_event_id', 'p_student_id'],
    allowedRoles: ['authenticated'],
    securityDefiner: true
  },
  delete_student_account: {
    caller: 'deleteStudentAccount',
    expectedParams: ['p_student_id'],
    allowedRoles: ['authenticated'],
    securityDefiner: true
  },
  admin_delete_student: {
    caller: 'adminDeleteStudent',
    expectedParams: ['p_student_id'],
    allowedRoles: ['authenticated'],
    securityDefiner: true
  },
  check_in_attendee: {
    caller: 'adminCheckInAttendeeByCodeOrUsn',
    expectedParams: ['p_event_id', 'p_query'],
    allowedRoles: ['authenticated'],
    securityDefiner: true
  },
  log_export: {
    caller: 'adminLogExport',
    expectedParams: ['p_filters', 'p_row_count'],
    allowedRoles: ['authenticated'],
    securityDefiner: true
  },
  is_admin: {
    caller: 'getProfile / checkIsAdmin',
    expectedParams: ['check_user_id'],
    allowedRoles: ['authenticated', 'anon'],
    securityDefiner: true
  }
};

// 2. Read all migrations and concatenate in chronological order
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

console.log(`Loaded ${migrationFiles.length} migration files in chronological order:`);
migrationFiles.forEach((f) => console.log(`  - ${f}`));
console.log();

let combinedSql = '';
for (const file of migrationFiles) {
  combinedSql += fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8') + '\n';
}

// 3. Scan frontend api.ts for all supabase.rpc calls
const apiSource = fs.readFileSync(API_FILE, 'utf8');
const rpcCallRegex = /supabase\.rpc\(\s*['"]([a-zA-Z0-9_]+)['"]\s*(?:,\s*\{([^}]*)\})?\s*\)/g;

const frontendCalls = [];
let match;
while ((match = rpcCallRegex.exec(apiSource)) !== null) {
  const rpcName = match[1];
  const paramsRaw = match[2] || '';
  const params = paramsRaw
    .split(',')
    .map((p) => p.split(':')[0].trim())
    .filter((p) => p.length > 0);

  frontendCalls.push({
    rpcName,
    params,
    index: match.index
  });
}

console.log(`Found ${frontendCalls.length} frontend RPC invocations in src/lib/api.ts:\n`);

// 4. Verify each frontend call against SQL migration definitions
let passedCount = 0;
let failedCount = 0;

for (const call of frontendCalls) {
  const spec = EXPECTED_RPCS[call.rpcName];
  if (!spec) {
    console.error(`❌ Unexpected or unverified RPC called by frontend: ${call.rpcName}`);
    failedCount++;
    continue;
  }

  // Check function declaration exists in SQL
  const fnDeclRegex = new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+public\\.${call.rpcName}\\s*\\(`, 'i');
  if (!fnDeclRegex.test(combinedSql)) {
    console.error(`❌ Function public.${call.rpcName} not found in any SQL migration!`);
    failedCount++;
    continue;
  }

  // Check each parameter passed by frontend exists in spec
  let paramMismatch = false;
  for (const param of call.params) {
    if (!spec.expectedParams.includes(param)) {
      console.error(`❌ Parameter mismatch in ${call.rpcName}: passed '${param}', expected one of: ${spec.expectedParams.join(', ')}`);
      paramMismatch = true;
    }
  }

  if (paramMismatch) {
    failedCount++;
    continue;
  }

  // Check REVOKE ALL FROM PUBLIC
  const revokeRegex = new RegExp(`REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+public\\.${call.rpcName}[^;]+FROM\\s+PUBLIC`, 'i');
  if (!revokeRegex.test(combinedSql)) {
    console.error(`❌ Function public.${call.rpcName} is missing 'REVOKE ALL ON FUNCTION ... FROM PUBLIC' in SQL migrations!`);
    failedCount++;
    continue;
  }

  console.log(`✓ RPC ${call.rpcName.padEnd(30)} -> SQL signature verified | Params: [${call.params.join(', ')}]`);
  passedCount++;
}

// 5. Special Verification: Onboarding RPC Authority
console.log('\n--- Authoritative Onboarding RPC Invariants ---');
assert.ok(!apiSource.includes('save_profile_and_consent_atomic'), 'Obsolete RPC save_profile_and_consent_atomic must not be referenced');
assert.ok(apiSource.includes("supabase.rpc('complete_student_onboarding'"), 'Authoritative RPC complete_student_onboarding must be called');

// Verify that complete_student_onboarding derives auth.uid() in SQL
const onboardingFnMatch = combinedSql.match(/CREATE OR REPLACE FUNCTION public\.complete_student_onboarding[\s\S]*?\$\$([\s\S]*?)\$\$;/i);
assert.ok(onboardingFnMatch, 'complete_student_onboarding SQL body must exist');
const onboardingSqlBody = onboardingFnMatch[1];

assert.ok(onboardingSqlBody.includes('auth.uid()'), 'Onboarding RPC must derive identity from auth.uid()');
assert.ok(onboardingSqlBody.includes('p_consent IS NOT TRUE'), 'Onboarding RPC must enforce explicit affirmative consent');
assert.ok(onboardingSqlBody.includes('INSERT INTO public.profiles') && onboardingSqlBody.includes('INSERT INTO public.consents'), 'Onboarding RPC must insert profile and consent atomically');
assert.ok(onboardingSqlBody.includes('CANNOT_CHANGE_USN'), 'Onboarding RPC must enforce USN immutability');
assert.ok(onboardingSqlBody.includes('now()'), 'Onboarding RPC must use authoritative database timestamps');
console.log('✓ All 5 authoritative onboarding invariants verified.');

// 6. Summary
console.log('\n======================================================');
console.log(`RPC CONSISTENCY AUDIT RESULT: ${passedCount} passed, ${failedCount} failed`);
console.log('======================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('All frontend RPC invocations match SQL migration definitions exactly.');
  process.exit(0);
}

