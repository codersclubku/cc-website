/**
 * scripts/verify-supabase-staging.mjs
 * 
 * Full Automated Adversarial Database Security & Invariant Verification Suite
 * Executed against an isolated Supabase Staging environment.
 * 
 * Target: staging project vtmyxjodfhdixhpoxcoj
 * Production boundary: lqlokvzvfccrarjmdvcv (NEVER CONTACT)
 */

import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

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

const stagingEnv = {
  ...loadEnvFile(path.resolve(process.cwd(), '.env.staging.local')),
  ...process.env
};

const PROD_PROJECT_REF = 'lqlokvzvfccrarjmdvcv';

const rawStagingUrl = stagingEnv.STAGING_SUPABASE_URL;
const stagingUrl = rawStagingUrl ? rawStagingUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '') : rawStagingUrl;
const serviceKey = stagingEnv.STAGING_SERVICE_ROLE_KEY;
const anonKey = stagingEnv.STAGING_ANON_KEY;

if (!stagingUrl || !serviceKey || !anonKey) {
  console.log('--------------------------------------------------------------------------------');
  console.log('STAGING DATABASE INTEGRATION TEST SUITE');
  console.log('--------------------------------------------------------------------------------');
  console.log('Missing required explicit staging environment configuration:');
  console.log(`  - STAGING_SUPABASE_URL:     ${stagingUrl ? 'PRESENT' : 'MISSING'}`);
  console.log(`  - STAGING_SERVICE_ROLE_KEY: ${serviceKey ? 'PRESENT' : 'MISSING'}`);
  console.log(`  - STAGING_ANON_KEY:         ${anonKey ? 'PRESENT' : 'MISSING'}`);
  console.log('\nSafety invariant: Fails closed. Fallback to production or default env is prohibited.');
  process.exit(1);
}

// Safety Guard: Block execution if production project is supplied in any casing
if (stagingUrl.toLowerCase().includes(PROD_PROJECT_REF.toLowerCase())) {
  console.error('\nCRITICAL SECURITY VIOLATION: Execution blocked!');
  console.error('The provided URL matches the production Supabase project identifier.');
  console.error('This script must NEVER be executed against production.');
  process.exit(1);
}

console.log('================================================================================');
console.log('  SUPABASE STAGING FULL ADVERSARIAL SECURITY VERIFICATION SUITE');
console.log('================================================================================');
console.log(`Target Staging Database: ${stagingUrl}`);
console.log(`Production Guard:       ${PROD_PROJECT_REF} strictly blocked and untouched\n`);

const adminClient = createClient(stagingUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const testResults = [];

function recordTest(section, testId, description, expected, actual, passed, evidence = '') {
  testResults.push({
    section,
    testId,
    description,
    expected,
    actual,
    status: passed ? 'PASS' : 'FAIL',
    evidence
  });
  const symbol = passed ? '✓' : '✗';
  console.log(`${symbol} [${testId}] ${description}: ${passed ? 'PASS' : 'FAIL'}`);
  if (!passed) {
    console.error(`    Expected: ${expected}`);
    console.error(`    Actual:   ${actual}`);
    console.error(`    Evidence: ${evidence}`);
  }
}

async function runAdversarialSuite() {
  const runId = Date.now();
  const testStudentEmailA = `staging-adv-student-a-${runId}@kishkindauniversity.edu.in`;
  const testStudentEmailB = `staging-adv-student-b-${runId}@kishkindauniversity.edu.in`;
  const testStudentEmailC = `staging-adv-student-c-${runId}@kishkindauniversity.edu.in`;
  const testAdminEmail = `staging-adv-admin-${runId}@kishkindauniversity.edu.in`;
  const testContactEmail = `staging-contact-${runId}@example.com`;
  const testPassword = `KishkindaAdv#${runId}!`;

  let studentAId = null;
  let studentBId = null;
  let studentCId = null;
  let adminId = null;
  let createdEventId = null;

  try {
    console.log('--- Provisioning Disposable Test Identities & Sessions ---');

    // 1. Create Student A
    const { data: userAData, error: errA } = await adminClient.auth.admin.createUser({
      email: testStudentEmailA,
      password: testPassword,
      email_confirm: true
    });
    assert.ok(!errA && userAData?.user, `Failed to create Student A: ${errA?.message}`);
    studentAId = userAData.user.id;

    // 2. Create Student B
    const { data: userBData, error: errB } = await adminClient.auth.admin.createUser({
      email: testStudentEmailB,
      password: testPassword,
      email_confirm: true
    });
    assert.ok(!errB && userBData?.user, `Failed to create Student B: ${errB?.message}`);
    studentBId = userBData.user.id;

    // 3. Create Student C
    const { data: userCData, error: errC } = await adminClient.auth.admin.createUser({
      email: testStudentEmailC,
      password: testPassword,
      email_confirm: true
    });
    assert.ok(!errC && userCData?.user, `Failed to create Student C: ${errC?.message}`);
    studentCId = userCData.user.id;

    // 4. Create Admin User
    const { data: adminUserData, error: errAdmin } = await adminClient.auth.admin.createUser({
      email: testAdminEmail,
      password: testPassword,
      email_confirm: true
    });
    assert.ok(!errAdmin && adminUserData?.user, `Failed to create Admin: ${errAdmin?.message}`);
    adminId = adminUserData.user.id;

    // Grant admin role
    const { error: roleErr } = await adminClient
      .from('admin_roles')
      .insert({ user_id: adminId, role: 'admin' });
    assert.ok(!roleErr, `Failed to assign admin role: ${roleErr?.message}`);

    // Create client connections via public anon key
    const studentClientA = createClient(stagingUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { error: loginAErr } = await studentClientA.auth.signInWithPassword({
      email: testStudentEmailA,
      password: testPassword
    });
    assert.ok(!loginAErr, `Student A login failed: ${loginAErr?.message}`);

    const studentClientB = createClient(stagingUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { error: loginBErr } = await studentClientB.auth.signInWithPassword({
      email: testStudentEmailB,
      password: testPassword
    });
    assert.ok(!loginBErr, `Student B login failed: ${loginBErr?.message}`);

    const studentClientC = createClient(stagingUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { error: loginCErr } = await studentClientC.auth.signInWithPassword({
      email: testStudentEmailC,
      password: testPassword
    });
    assert.ok(!loginCErr, `Student C login failed: ${loginCErr?.message}`);

    const adminAuthClient = createClient(stagingUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { error: loginAdminErr } = await adminAuthClient.auth.signInWithPassword({
      email: testAdminEmail,
      password: testPassword
    });
    assert.ok(!loginAdminErr, `Admin login failed: ${loginAdminErr?.message}`);

    const unauthClient = createClient(stagingUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('✓ Test identities provisioned and authenticated via anon gateway.\n');

    // Onboard Student A and Student B with authoritative USNs
    const validUsnA = `KU2024CS${String(runId).slice(-3)}`;
    const validUsnB = `2KA22CS${String(runId + 1).slice(-3)}`;

    const { data: onbSuccessA, error: onbErrA } = await studentClientA.rpc('complete_student_onboarding', {
      p_full_name: 'Staging Student A',
      p_usn: validUsnA,
      p_department: 'Computer Science and Engineering',
      p_year: '2nd Year',
      p_semester: '3rd Semester',
      p_consent: true,
      p_version: 'v1.0-2026'
    });
    assert.ok(!onbErrA && onbSuccessA, `Student A onboarding failed: ${onbErrA?.message}`);

    const { data: onbSuccessB, error: onbErrB } = await studentClientB.rpc('complete_student_onboarding', {
      p_full_name: 'Staging Student B',
      p_usn: validUsnB,
      p_department: 'Computer Science and Engineering',
      p_year: '1st Year',
      p_semester: '1st Semester',
      p_consent: true,
      p_version: 'v1.0-2026'
    });
    assert.ok(!onbErrB && onbSuccessB, `Student B onboarding failed: ${onbErrB?.message}`);

    // =========================================================================
    // SECTION 1: AUTHENTICATION AND IDENTITY
    // =========================================================================
    console.log('--- SECTION 1: Authentication & Identity ---');

    // 1a. Unauthenticated access to profiles
    const { data: unauthProfiles, error: unauthProfErr } = await unauthClient.from('profiles').select('*');
    const profSuppressed = (!unauthProfErr && (unauthProfiles?.length ?? 0) === 0) || Boolean(unauthProfErr);
    recordTest(
      'Authentication & Identity',
      'AUTH-01',
      'Unauthenticated SELECT on profiles table',
      '0 rows returned or access denied',
      unauthProfErr ? `Denied: ${unauthProfErr.message}` : `${unauthProfiles?.length ?? 0} rows`,
      profSuppressed,
      'Suppressed by RLS Profiles policy'
    );

    // 1b. Unauthenticated access to registrations
    const { data: unauthRegs, error: unauthRegsErr } = await unauthClient.from('registrations').select('*');
    const regsSuppressed = (!unauthRegsErr && (unauthRegs?.length ?? 0) === 0) || Boolean(unauthRegsErr);
    recordTest(
      'Authentication & Identity',
      'AUTH-02',
      'Unauthenticated SELECT on registrations table',
      '0 rows returned or access denied',
      unauthRegsErr ? `Denied: ${unauthRegsErr.message}` : `${unauthRegs?.length ?? 0} rows`,
      regsSuppressed,
      'Suppressed by RLS Registrations policy'
    );

    // 1c. Unauthenticated access to admin_roles
    const { data: unauthRoles, error: unauthRolesErr } = await unauthClient.from('admin_roles').select('*');
    const rolesSuppressed = (!unauthRolesErr && (unauthRoles?.length ?? 0) === 0) || Boolean(unauthRolesErr);
    recordTest(
      'Authentication & Identity',
      'AUTH-03',
      'Unauthenticated SELECT on admin_roles table',
      '0 rows returned or access denied',
      unauthRolesErr ? `Denied: ${unauthRolesErr.message}` : `${unauthRoles?.length ?? 0} rows`,
      rolesSuppressed,
      'Suppressed by RLS Admin Roles policy'
    );

    // 1d. Unauthenticated access to consents
    const { data: unauthConsents, error: unauthConsentsErr } = await unauthClient.from('consents').select('*');
    const consentsSuppressed = (!unauthConsentsErr && (unauthConsents?.length ?? 0) === 0) || Boolean(unauthConsentsErr);
    recordTest(
      'Authentication & Identity',
      'AUTH-04',
      'Unauthenticated SELECT on consents table',
      '0 rows returned or access denied',
      unauthConsentsErr ? `Denied: ${unauthConsentsErr.message}` : `${unauthConsents?.length ?? 0} rows`,
      consentsSuppressed,
      'Suppressed by RLS Consents policy'
    );

    // 1e. Unauthenticated call to register_student_atomic
    const { data: unauthRegRpc, error: unauthRegErr } = await unauthClient.rpc('register_student_atomic', {
      p_event_id: '00000000-0000-0000-0000-000000000000',
      p_student_id: '00000000-0000-0000-0000-000000000000'
    });
    const regBlocked = Boolean(unauthRegErr) || (unauthRegRpc?.success === false && unauthRegRpc?.code === 'NOT_AUTHENTICATED');
    recordTest(
      'Authentication & Identity',
      'AUTH-05',
      'Unauthenticated call to register_student_atomic RPC',
      'Denied by PostgREST or returns code: NOT_AUTHENTICATED',
      unauthRegErr ? `PostgREST denial: ${unauthRegErr.message}` : `code: ${unauthRegRpc?.code}`,
      regBlocked,
      'Enforced by DAC execute revoking & auth.uid() check'
    );

    // 1f. Unauthenticated call to withdraw_consent_atomic
    const { error: unauthWithdrawErr } = await unauthClient.rpc('withdraw_consent_atomic', {
      p_version: 'v1.0-2026'
    });
    const withdrawBlocked = Boolean(unauthWithdrawErr && (unauthWithdrawErr.message.includes('NOT_AUTHENTICATED') || unauthWithdrawErr.message.includes('permission denied')));
    recordTest(
      'Authentication & Identity',
      'AUTH-06',
      'Unauthenticated call to withdraw_consent_atomic RPC',
      'Permission denied or Exception NOT_AUTHENTICATED',
      unauthWithdrawErr ? unauthWithdrawErr.message : 'No error',
      withdrawBlocked,
      'Enforced by DAC execute scoping & auth.uid() check'
    );

    // 1g. Student A attempts to impersonate Student B in register_student_atomic
    const { data: impRegAttempt } = await studentClientA.rpc('register_student_atomic', {
      p_event_id: '00000000-0000-0000-0000-000000000000',
      p_student_id: studentBId
    });
    recordTest(
      'Authentication & Identity',
      'AUTH-07',
      'Cross-student impersonation attempt in register_student_atomic',
      'code: FORBIDDEN',
      `code: ${impRegAttempt?.code}`,
      impRegAttempt?.success === false && impRegAttempt?.code === 'FORBIDDEN',
      'Enforced by caller_id vs p_student_id invariant'
    );

    // 1h. Student A attempts to delete Student B account via delete_student_account
    const { data: delOtherRes } = await studentClientA.rpc('delete_student_account', {
      p_student_id: studentBId
    });
    recordTest(
      'Authentication & Identity',
      'AUTH-08',
      'Cross-student account deletion attempt via delete_student_account',
      'code: UNAUTHORIZED',
      delOtherRes ? `code: ${delOtherRes.code}` : 'No response',
      delOtherRes?.success === false && delOtherRes?.code === 'UNAUTHORIZED',
      'Enforced by auth.uid() identity check'
    );

    // =========================================================================
    // SECTION 2: PROFILE SECURITY AND IMMUTABILITY
    // =========================================================================
    console.log('\n--- SECTION 2: Profile Security & Immutability ---');

    // 2a. Student A reads own profile
    const { data: aOwnProfile, error: aOwnErr } = await studentClientA
      .from('profiles')
      .select('*')
      .eq('id', studentAId)
      .single();
    recordTest(
      'Profile Security',
      'PROF-01',
      'Student reads own profile',
      'Exact profile record returned',
      aOwnProfile ? `id: ${aOwnProfile.id}` : `Error: ${aOwnErr?.message}`,
      aOwnProfile?.id === studentAId,
      'Authorized under owner RLS policy'
    );

    // 2b. Student A reads Student B profile
    const { data: bProfileRows } = await studentClientA
      .from('profiles')
      .select('*')
      .eq('id', studentBId);
    recordTest(
      'Profile Security',
      'PROF-02',
      'Cross-student profile read attempt',
      '0 rows returned',
      `${bProfileRows?.length ?? 0} rows`,
      (bProfileRows?.length ?? 0) === 0,
      'Suppressed by RLS'
    );

    // 2c. Student A updates Student B profile
    const { error: bUpdateErr } = await studentClientA
      .from('profiles')
      .update({ full_name: 'Hacked Student B' })
      .eq('id', studentBId);
    const { data: bVerifyRow } = await adminClient.from('profiles').select('full_name').eq('id', studentBId).single();
    recordTest(
      'Profile Security',
      'PROF-03',
      'Cross-student profile update attempt',
      '0 rows updated, name untouched',
      `Name: ${bVerifyRow?.full_name}`,
      !bUpdateErr && bVerifyRow?.full_name === 'Staging Student B',
      'Suppressed by RLS'
    );

    // 2d. Student A attempts to change USN after onboarding
    const { error: usnChangeErr } = await studentClientA
      .from('profiles')
      .update({ usn: 'KU2024CS999' })
      .eq('id', studentAId);
    recordTest(
      'Profile Security',
      'PROF-04',
      'Student attempts to modify assigned USN',
      'Exception CANNOT_CHANGE_USN',
      usnChangeErr ? usnChangeErr.message : 'No error',
      Boolean(usnChangeErr && usnChangeErr.message.includes('CANNOT_CHANGE_USN')),
      'Enforced by trg_guard_profile_updates'
    );

    // 2e. Student A attempts to modify profile primary key ID
    const { error: idChangeErr } = await studentClientA
      .from('profiles')
      .update({ id: studentBId })
      .eq('id', studentAId);
    recordTest(
      'Profile Security',
      'PROF-05',
      'Student attempts to modify profile primary key ID',
      'Exception CANNOT_CHANGE_ID',
      idChangeErr ? idChangeErr.message : 'No error',
      Boolean(idChangeErr && idChangeErr.message.includes('CANNOT_CHANGE_ID')),
      'Enforced by trg_guard_profile_updates'
    );

    // 2f. Student A attempts to modify profile created_at timestamp
    const { error: createdAtChangeErr } = await studentClientA
      .from('profiles')
      .update({ created_at: new Date('2020-01-01').toISOString() })
      .eq('id', studentAId);
    recordTest(
      'Profile Security',
      'PROF-06',
      'Student attempts to backdate profile created_at',
      'Exception CANNOT_CHANGE_CREATED_AT',
      createdAtChangeErr ? createdAtChangeErr.message : 'No error',
      Boolean(createdAtChangeErr && createdAtChangeErr.message.includes('CANNOT_CHANGE_CREATED_AT')),
      'Enforced by trg_guard_profile_updates'
    );

    // 2g. Student attempts onboarding with whitespace-only full_name
    const { error: whitespaceNameErr } = await studentClientA.rpc('complete_student_onboarding', {
      p_full_name: '   ',
      p_usn: `KU2024CS${String(runId + 9).slice(-3)}`,
      p_department: 'Computer Science and Engineering',
      p_year: '1st Year',
      p_semester: '1st Semester',
      p_consent: true,
      p_version: 'v1.0-2026'
    });
    recordTest(
      'Profile Security',
      'PROF-07',
      'Student attempts onboarding with whitespace-only full_name',
      'Exception INVALID_NAME',
      whitespaceNameErr ? whitespaceNameErr.message : 'No error',
      Boolean(whitespaceNameErr && whitespaceNameErr.message.includes('INVALID_NAME')),
      'Enforced by complete_student_onboarding validation'
    );

    // 2h. Student attempts direct profile update with whitespace-only department
    const { error: whitespaceDeptErr } = await studentClientA
      .from('profiles')
      .update({ department: '   ' })
      .eq('id', studentAId);
    recordTest(
      'Profile Security',
      'PROF-08',
      'Student attempts to update profile with whitespace-only department',
      'Rejected by check constraint chk_profiles_department',
      whitespaceDeptErr ? whitespaceDeptErr.message : 'No error',
      Boolean(whitespaceDeptErr && whitespaceDeptErr.message.includes('chk_profiles_department')),
      'Enforced by database CHECK constraint'
    );

    // Ensure Student A profile remains valid and pristine for downstream tests
    await adminClient.from('profiles').update({
      full_name: 'Staging Student A',
      department: 'Computer Science and Engineering',
      year: '2nd Year',
      semester: '3rd Semester'
    }).eq('id', studentAId);

    // =========================================================================
    // SECTION 3: CONSENT SECURITY AND PRIVACY
    // =========================================================================
    console.log('\n--- SECTION 3: Consent Security & Privacy ---');

    // 3a. Student A reads own consent
    const { data: aConsentRows, error: aConsentErr } = await studentClientA
      .from('consents')
      .select('*')
      .eq('student_id', studentAId);
    recordTest(
      'Consent Security',
      'CONS-01',
      'Student reads own consent records',
      '>= 1 consent row returned',
      `${aConsentRows?.length ?? 0} rows`,
      !aConsentErr && (aConsentRows?.length ?? 0) > 0,
      'Authorized under owner RLS'
    );

    // 3b. Student A reads Student B consent
    const { data: bConsentRows } = await studentClientA
      .from('consents')
      .select('*')
      .eq('student_id', studentBId);
    recordTest(
      'Consent Security',
      'CONS-02',
      'Cross-student consent read attempt',
      '0 rows returned',
      `${bConsentRows?.length ?? 0} rows`,
      (bConsentRows?.length ?? 0) === 0,
      'Suppressed by RLS'
    );

    // 3c. Direct PostgREST INSERT into public.consents
    const { error: directInsertErr } = await studentClientA
      .from('consents')
      .insert({
        student_id: studentAId,
        notice_version: 'v1.0-2026',
        purpose: 'Hacked direct consent',
        accepted_at: new Date().toISOString()
      });
    recordTest(
      'Consent Security',
      'CONS-03',
      'Direct PostgREST INSERT into public.consents table',
      'HTTP 403 / SQLSTATE 42501 (permission denied)',
      directInsertErr ? `${directInsertErr.code}: ${directInsertErr.message}` : 'No error',
      Boolean(directInsertErr && (directInsertErr.code === '42501' || directInsertErr.message.includes('permission denied'))),
      'DAC privileges revoked from authenticated role'
    );

    // 3d. Direct PostgREST UPDATE into public.consents
    const { error: directUpdateErr } = await studentClientA
      .from('consents')
      .update({ accepted_at: new Date('2020-01-01').toISOString() })
      .eq('student_id', studentAId);
    recordTest(
      'Consent Security',
      'CONS-04',
      'Direct PostgREST UPDATE on public.consents table',
      'HTTP 403 / SQLSTATE 42501 (permission denied)',
      directUpdateErr ? `${directUpdateErr.code}: ${directUpdateErr.message}` : 'No error',
      Boolean(directUpdateErr && (directUpdateErr.code === '42501' || directUpdateErr.message.includes('permission denied'))),
      'DAC privileges revoked from authenticated role'
    );

    // 3e. Direct PostgREST DELETE into public.consents
    const { error: directDeleteErr } = await studentClientA
      .from('consents')
      .delete()
      .eq('student_id', studentAId);
    recordTest(
      'Consent Security',
      'CONS-05',
      'Direct PostgREST DELETE on public.consents table',
      'HTTP 403 / SQLSTATE 42501 (permission denied)',
      directDeleteErr ? `${directDeleteErr.code}: ${directDeleteErr.message}` : 'No error',
      Boolean(directDeleteErr && (directDeleteErr.code === '42501' || directDeleteErr.message.includes('permission denied'))),
      'DAC privileges revoked from authenticated role'
    );

    // 3f. Student A calls record_consent_idempotent with Student B UUID
    const { error: crossConsentErr } = await studentClientA.rpc('record_consent_idempotent', {
      p_student_id: studentBId,
      p_version: 'v1.0-2026'
    });
    recordTest(
      'Consent Security',
      'CONS-06',
      'Cross-student consent submission via record_consent_idempotent',
      'Exception UNAUTHORIZED',
      crossConsentErr ? crossConsentErr.message : 'No error',
      Boolean(crossConsentErr && crossConsentErr.message.includes('UNAUTHORIZED')),
      'Enforced by auth.uid() check'
    );

    // 3g. Student A calls record_consent_idempotent with invalid version
    const { error: invalidVerErr } = await studentClientA.rpc('record_consent_idempotent', {
      p_student_id: studentAId,
      p_version: 'invalid_unsupported_version'
    });
    recordTest(
      'Consent Security',
      'CONS-07',
      'Consent submission with invalid notice version',
      'Exception INVALID_VERSION',
      invalidVerErr ? invalidVerErr.message : 'No error',
      Boolean(invalidVerErr && invalidVerErr.message.includes('INVALID_VERSION')),
      'Enforced by canonical version validation'
    );

    // 3h. Repeated consent submission (Idempotency invariant)
    const { error: idempErr1 } = await studentClientA.rpc('record_consent_idempotent', {
      p_student_id: studentAId,
      p_version: 'v1.0-2026'
    });
    const { error: idempErr2 } = await studentClientA.rpc('record_consent_idempotent', {
      p_student_id: studentAId,
      p_version: 'v1.0-2026'
    });
    const { data: aConsentList } = await adminClient.from('consents').select('*').eq('student_id', studentAId).is('withdrawn_at', null);
    recordTest(
      'Consent Security',
      'CONS-08',
      'Repeated consent submission idempotency',
      'Exactly 1 active consent record',
      `${aConsentList?.length ?? 0} active rows`,
      !idempErr1 && !idempErr2 && aConsentList?.length === 1,
      'Maintained via ON CONFLICT DO UPDATE'
    );

    // 3i. Student A withdraws consent
    const { data: withdrawResult } = await studentClientA.rpc('withdraw_consent_atomic', {
      p_version: 'v1.0-2026'
    });
    const { data: bConsentCheck } = await adminClient.from('consents').select('withdrawn_at').eq('student_id', studentBId).single();
    recordTest(
      'Consent Security',
      'CONS-09',
      'Student consent withdrawal & cross-user non-interference',
      'Student A withdrawn, Student B untouched',
      `withdrawResult=${withdrawResult}, studentB withdrawn_at=${bConsentCheck?.withdrawn_at}`,
      withdrawResult === true && bConsentCheck?.withdrawn_at === null,
      'Identity strictly scoped to auth.uid()'
    );

    // 3j. Verify consent timestamps remain consistent (accepted_at <= withdrawn_at)
    const { data: withdrawnRow } = await adminClient.from('consents').select('*').eq('student_id', studentAId).not('withdrawn_at', 'is', null).single();
    const timestampsValid = withdrawnRow && new Date(withdrawnRow.accepted_at) <= new Date(withdrawnRow.withdrawn_at);
    recordTest(
      'Consent Security',
      'CONS-10',
      'Consent timestamp ordering consistency (accepted_at <= withdrawn_at)',
      'accepted_at <= withdrawn_at',
      withdrawnRow ? `accepted: ${withdrawnRow.accepted_at}, withdrawn: ${withdrawnRow.withdrawn_at}` : 'No row',
      Boolean(timestampsValid),
      'Enforced by check constraint and atomic routine'
    );

    // Restore consent for Student A
    await studentClientA.rpc('record_consent_idempotent', {
      p_student_id: studentAId,
      p_version: 'v1.0-2026'
    });

    // =========================================================================
    // SECTION 4: HELPER FUNCTION AUTHORIZATION
    // =========================================================================
    console.log('\n--- SECTION 4: Helper Function Authorization ---');

    // 4a. Student A calls has_active_consent with Student B ID
    const { error: checkBConsentErr } = await studentClientA.rpc('has_active_consent', {
      p_student_id: studentBId,
      p_version: 'v1.0-2026'
    });
    recordTest(
      'Helper Authorization',
      'HELP-01',
      'Student A inspects has_active_consent of Student B',
      'Exception UNAUTHORIZED',
      checkBConsentErr ? checkBConsentErr.message : 'No error',
      Boolean(checkBConsentErr && checkBConsentErr.message.includes('UNAUTHORIZED')),
      'Enforced by auth.uid() check'
    );

    // 4b. Student A calls is_profile_complete with Student B ID
    const { error: checkBProfileErr } = await studentClientA.rpc('is_profile_complete', {
      p_student_id: studentBId
    });
    recordTest(
      'Helper Authorization',
      'HELP-02',
      'Student A inspects is_profile_complete of Student B',
      'Exception UNAUTHORIZED',
      checkBProfileErr ? checkBProfileErr.message : 'No error',
      Boolean(checkBProfileErr && checkBProfileErr.message.includes('UNAUTHORIZED')),
      'Enforced by auth.uid() check'
    );

    // 4c. Unauthenticated caller invokes is_admin
    const { error: unauthAdminErr } = await unauthClient.rpc('is_admin');
    recordTest(
      'Helper Authorization',
      'HELP-03',
      'Unauthenticated caller invokes is_admin',
      'Permission denied at PostgREST boundary',
      unauthAdminErr ? unauthAdminErr.message : 'No error',
      Boolean(unauthAdminErr),
      'REVOKE EXECUTE FROM anon/public enforced'
    );

    // 4d. Student A inspects adminId via is_admin
    const { error: aCheckOtherAdminErr } = await studentClientA.rpc('is_admin', {
      check_user_id: adminId
    });
    recordTest(
      'Helper Authorization',
      'HELP-04',
      'Student checks arbitrary user admin status via is_admin',
      'Exception UNAUTHORIZED',
      aCheckOtherAdminErr ? aCheckOtherAdminErr.message : 'No error',
      Boolean(aCheckOtherAdminErr && aCheckOtherAdminErr.message.includes('UNAUTHORIZED')),
      'Non-admin callers cannot query arbitrary user IDs'
    );

    // 4e. Administrator executes authorized helper checks
    const { data: adminCheckB, error: adminCheckBErr } = await adminAuthClient.rpc('has_active_consent', {
      p_student_id: studentBId,
      p_version: 'v1.0-2026'
    });
    const { data: adminCompB, error: adminCompBErr } = await adminAuthClient.rpc('is_profile_complete', {
      p_student_id: studentBId
    });
    const { data: adminSelfStatus, error: adminSelfErr } = await adminAuthClient.rpc('is_admin', {
      check_user_id: adminId
    });
    recordTest(
      'Helper Authorization',
      'HELP-05',
      'Administrator executes administrative helper queries',
      'All helper checks succeed',
      `consent=${adminCheckB}, complete=${adminCompB}, is_admin=${adminSelfStatus}`,
      !adminCheckBErr && !adminCompBErr && !adminSelfErr && adminSelfStatus === true,
      'Authorized via public.is_admin()'
    );

    // =========================================================================
    // SECTION 5: REGISTRATION AUTHORIZATION AND CAPACITY INVARIANTS
    // =========================================================================
    console.log('\n--- SECTION 5: Registration Authorization & Capacity Invariants ---');

    // Create a capacity-limited test event (capacity = 1, allow_waitlist = false)
    const { data: testEvent, error: evErr } = await adminClient
      .from('events')
      .insert({
        title: `Staging Security Event ${runId}`,
        slug: `staging-adv-event-${runId}`,
        type: 'Workshop',
        short_description: 'Adversarial security test event',
        description: 'Testing capacity locks, desk registration, and waitlists',
        coordinator_name: 'Dr. Test Coordinator',
        venue: 'Security Lab 101',
        starts_at: new Date(Date.now() + 86400000).toISOString(),
        ends_at: new Date(Date.now() + 172800000).toISOString(),
        registration_deadline: new Date(Date.now() + 86400000).toISOString(),
        capacity: 1,
        allow_waitlist: false,
        status: 'published'
      })
      .select()
      .single();
    assert.ok(!evErr && testEvent, `Failed to create test event: ${evErr?.message}`);
    createdEventId = testEvent.id;

    // 5a. Student A attempts to register Student B
    const { data: impRegRes } = await studentClientA.rpc('register_student_atomic', {
      p_event_id: testEvent.id,
      p_student_id: studentBId
    });
    recordTest(
      'Registration Security',
      'REG-01',
      'Student A attempts to register Student B',
      'code: FORBIDDEN',
      `code: ${impRegRes?.code}`,
      impRegRes?.success === false && impRegRes?.code === 'FORBIDDEN',
      'Cross-student registration prohibited'
    );

    // 5b. Student A attempts registration without active consent
    await studentClientA.rpc('withdraw_consent_atomic', { p_version: 'v1.0-2026' });
    const { data: noConsentReg } = await studentClientA.rpc('register_student_atomic', {
      p_event_id: testEvent.id,
      p_student_id: studentAId
    });
    recordTest(
      'Registration Security',
      'REG-02',
      'Registration attempt without active consent',
      'code: CONSENT_REQUIRED',
      `code: ${noConsentReg?.code}`,
      noConsentReg?.success === false && noConsentReg?.code === 'CONSENT_REQUIRED',
      'Enforced by has_active_consent check'
    );

    // Restore consent for Student A
    await studentClientA.rpc('record_consent_idempotent', { p_student_id: studentAId, p_version: 'v1.0-2026' });

    // 5c. Student C (incomplete profile) attempts registration
    const { data: incompRegRes } = await studentClientC.rpc('register_student_atomic', {
      p_event_id: testEvent.id,
      p_student_id: studentCId
    });
    recordTest(
      'Registration Security',
      'REG-03',
      'Registration attempt with incomplete profile',
      'code: PROFILE_INCOMPLETE',
      `code: ${incompRegRes?.code}`,
      incompRegRes?.success === false && incompRegRes?.code === 'PROFILE_INCOMPLETE',
      'Enforced by is_profile_complete check'
    );

    // 5d. Authorized self-registration under capacity
    const { data: regSuccessA } = await studentClientA.rpc('register_student_atomic', {
      p_event_id: testEvent.id,
      p_student_id: studentAId
    });
    recordTest(
      'Registration Security',
      'REG-04',
      'Authorized student self-registration under capacity',
      'status: registered, registered_by: studentAId',
      `status: ${regSuccessA?.status}, by: ${regSuccessA?.registered_by}`,
      regSuccessA?.success === true && regSuccessA?.status === 'registered' && regSuccessA?.registered_by === studentAId,
      'Atomic sequence & capacity lock succeeded'
    );

    // 5e. Duplicate registration attempt by same student
    const { data: dupRegRes } = await studentClientA.rpc('register_student_atomic', {
      p_event_id: testEvent.id,
      p_student_id: studentAId
    });
    recordTest(
      'Registration Security',
      'REG-05',
      'Duplicate registration attempt by same student for same event',
      'code: ALREADY_REGISTERED',
      `code: ${dupRegRes?.code}`,
      dupRegRes?.success === false && dupRegRes?.code === 'ALREADY_REGISTERED',
      'Prevented duplicate attendee insertion'
    );

    // 5f. Capacity reached without waitlist
    const { data: regFullB } = await studentClientB.rpc('register_student_atomic', {
      p_event_id: testEvent.id,
      p_student_id: studentBId
    });
    recordTest(
      'Registration Security',
      'REG-06',
      'Registration attempt when capacity full and waitlist disabled',
      'code: CAPACITY_REACHED',
      `code: ${regFullB?.code}`,
      regFullB?.success === false && regFullB?.code === 'CAPACITY_REACHED',
      'Strict capacity limit enforced'
    );

    // 5g. Capacity reached with waitlist enabled -> Waitlist placement
    await adminClient.from('events').update({ allow_waitlist: true }).eq('id', testEvent.id);
    const { data: regWaitlistB } = await studentClientB.rpc('register_student_atomic', {
      p_event_id: testEvent.id,
      p_student_id: studentBId
    });
    recordTest(
      'Registration Security',
      'REG-07',
      'Registration attempt when capacity full and waitlist enabled',
      'status: waitlisted',
      `status: ${regWaitlistB?.status}, pos: ${regWaitlistB?.waitlist_position}`,
      regWaitlistB?.success === true && regWaitlistB?.status === 'waitlisted',
      'Ordered waitlist positioning assigned'
    );

    // 5h. Admin desk registration before student consent
    // Complete Student C profile
    const { error: insProfileCErr } = await adminClient.from('profiles').insert({
      id: studentCId,
      full_name: 'Staging Student C',
      usn: `KU2024CS${String(runId + 2).slice(-3)}`,
      department: 'Computer Science and Engineering',
      year: '1st Year',
      semester: '1st Semester'
    });
    assert.ok(!insProfileCErr, `Failed to insert Student C profile: ${insProfileCErr?.message}`);

    const { data: deskRegNoConsent } = await adminAuthClient.rpc('register_student_atomic', {
      p_event_id: testEvent.id,
      p_student_id: studentCId
    });
    recordTest(
      'Registration Security',
      'REG-08',
      'Admin desk registration attempt without student consent',
      'code: CONSENT_REQUIRED',
      `code: ${deskRegNoConsent?.code}`,
      deskRegNoConsent?.success === false && deskRegNoConsent?.code === 'CONSENT_REQUIRED',
      'Consent invariant enforced even for administrators'
    );

    // Student C records consent
    await studentClientC.rpc('record_consent_idempotent', {
      p_student_id: studentCId,
      p_version: 'v1.0-2026'
    });

    // 5i. Admin desk registration with active student consent
    const { data: deskRegSuccess } = await adminAuthClient.rpc('register_student_atomic', {
      p_event_id: testEvent.id,
      p_student_id: studentCId
    });
    const { data: deskRegRow } = await adminClient
      .from('registrations')
      .select('registered_by, student_id')
      .eq('event_id', testEvent.id)
      .eq('student_id', studentCId)
      .single();
    recordTest(
      'Registration Security',
      'REG-09',
      'Authorized administrator desk registration with active consent',
      'registered_by = adminId, is_admin_registration = true',
      `by: ${deskRegRow?.registered_by}, isAdmin: ${deskRegSuccess?.is_admin_registration}`,
      deskRegSuccess?.success === true && deskRegRow?.registered_by === adminId && deskRegSuccess?.is_admin_registration === true,
      'Audit trail recorded'
    );

    // 5j. Non-admin direct PostgREST INSERT into registrations table
    const { error: directRegInsertErr } = await studentClientA
      .from('registrations')
      .insert({
        event_id: testEvent.id,
        student_id: studentAId,
        confirmation_id: `KU-CC-${runId}-TAMPER`,
        status: 'registered'
      });
    recordTest(
      'Registration Security',
      'REG-10',
      'Direct PostgREST INSERT into registrations table (bypassing atomic RPC)',
      'Rejected by RLS or trigger',
      directRegInsertErr ? `${directRegInsertErr.code}: ${directRegInsertErr.message}` : 'No error',
      Boolean(directRegInsertErr),
      'Direct client insert prohibited'
    );

    // 5k. Capacity invariant check: Registered attendees never exceed event capacity
    const { data: regCountRows } = await adminClient
      .from('registrations')
      .select('id, status')
      .eq('event_id', testEvent.id)
      .eq('status', 'registered');
    recordTest(
      'Registration Security',
      'REG-11',
      'Capacity invariant: registered attendees <= event capacity (1)',
      'Exact count: 1',
      `Count: ${regCountRows?.length}`,
      regCountRows?.length === 1,
      'Strict capacity enforcement confirmed'
    );

    // =========================================================================
    // SECTION 6: CONTACT AND FEEDBACK SECURITY
    // =========================================================================
    console.log('\n--- SECTION 6: Contact & Feedback Security ---');

    // 6a. Valid contact message submission via public anon client
    const { error: contactInsertErr } = await unauthClient
      .from('contact_messages')
      .insert({
        name: '  Security Tester  ',
        email: `  ${testContactEmail.toUpperCase()}  `,
        message: 'This is a valid test contact message for staging security audit.'
      });
    recordTest(
      'Contact Security',
      'CONT-01',
      'Valid contact message submission via anon client',
      'Submission succeeds',
      contactInsertErr ? contactInsertErr.message : 'SUCCESS',
      !contactInsertErr,
      'Authorized under public submit policy'
    );

    // 6b. Contact message sanitization verification (trimmed & lowercased)
    const { data: sanitizedMsg } = await adminClient
      .from('contact_messages')
      .select('*')
      .eq('email', testContactEmail.toLowerCase())
      .single();
    const isSanitized = sanitizedMsg && sanitizedMsg.name === 'Security Tester' && sanitizedMsg.email === testContactEmail.toLowerCase();
    recordTest(
      'Contact Security',
      'CONT-02',
      'Contact message sanitization via trg_process_contact_message',
      'name trimmed, email trimmed and lowercased',
      sanitizedMsg ? `name: "${sanitizedMsg.name}", email: "${sanitizedMsg.email}"` : 'Not found',
      Boolean(isSanitized),
      'Enforced by trg_process_contact_message'
    );

    // 6c. Malformed contact message: empty name
    const { error: emptyNameErr } = await unauthClient
      .from('contact_messages')
      .insert({
        name: '   ',
        email: 'tester@example.com',
        message: 'Valid message content'
      });
    recordTest(
      'Contact Security',
      'CONT-03',
      'Contact submission with empty/whitespace name',
      'Rejected by policy CHECK constraint',
      emptyNameErr ? emptyNameErr.message : 'No error',
      Boolean(emptyNameErr),
      'Enforced by RLS WITH CHECK'
    );

    // 6d. Malformed contact message: short message (< 5 characters)
    const { error: shortMsgErr } = await unauthClient
      .from('contact_messages')
      .insert({
        name: 'Valid Name',
        email: 'tester@example.com',
        message: 'Hi'
      });
    recordTest(
      'Contact Security',
      'CONT-04',
      'Contact submission with short message (< 5 characters)',
      'Rejected by policy CHECK constraint',
      shortMsgErr ? shortMsgErr.message : 'No error',
      Boolean(shortMsgErr),
      'Enforced by RLS WITH CHECK'
    );

    // 6e. Oversized contact message payload (> 2000 characters)
    const oversizedPayload = 'A'.repeat(2005);
    const { error: oversizedErr } = await unauthClient
      .from('contact_messages')
      .insert({
        name: 'Valid Name',
        email: 'tester@example.com',
        message: oversizedPayload
      });
    recordTest(
      'Contact Security',
      'CONT-05',
      'Contact submission with oversized message (> 2000 characters)',
      'Rejected by policy CHECK constraint',
      oversizedErr ? oversizedErr.message : 'No error',
      Boolean(oversizedErr),
      'Enforced by RLS WITH CHECK'
    );

    // 6f. Unauthorized read of contact_messages by anon client
    const { data: unauthContactRows, error: unauthContactErr } = await unauthClient.from('contact_messages').select('*');
    const contactReadBlocked = (!unauthContactErr && (unauthContactRows?.length ?? 0) === 0) || Boolean(unauthContactErr);
    recordTest(
      'Contact Security',
      'CONT-06',
      'Unauthenticated read of contact_messages table',
      '0 rows returned or access denied',
      unauthContactErr ? `Denied: ${unauthContactErr.message}` : `${unauthContactRows?.length ?? 0} rows`,
      contactReadBlocked,
      'Suppressed by RLS (no SELECT policy for public)'
    );

    // 6g. Unauthorized read of contact_messages by authenticated student
    const { data: studentContactRows, error: studentContactErr } = await studentClientA.from('contact_messages').select('*');
    const studentContactBlocked = (!studentContactErr && (studentContactRows?.length ?? 0) === 0) || Boolean(studentContactErr);
    recordTest(
      'Contact Security',
      'CONT-07',
      'Authenticated student read of contact_messages table',
      '0 rows returned or access denied',
      studentContactErr ? `Denied: ${studentContactErr.message}` : `${studentContactRows?.length ?? 0} rows`,
      studentContactBlocked,
      'Suppressed by RLS (no SELECT policy for students)'
    );

    // 6h. Unauthorized modification of contact_messages
    if (sanitizedMsg?.id) {
      const { error: contactMutErr } = await studentClientA
        .from('contact_messages')
        .update({ handled: true })
        .eq('id', sanitizedMsg.id);
      const { data: verifyHandled } = await adminClient.from('contact_messages').select('handled').eq('id', sanitizedMsg.id).single();
      recordTest(
        'Contact Security',
        'CONT-08',
        'Student unauthorized modification of contact_messages',
        '0 rows updated, handled remains false',
        `handled: ${verifyHandled?.handled}`,
        !contactMutErr && verifyHandled?.handled === false,
        'Suppressed by RLS (no UPDATE policy for students)'
      );
    }

    // =========================================================================
    // SECTION 7: ADMIN AND EXPORT SECURITY
    // =========================================================================
    console.log('\n--- SECTION 7: Admin & Export Security ---');

    // 7a. Student A invocation of admin-only log_export RPC
    const { error: studentExportErr } = await studentClientA.rpc('log_export', {
      p_filters: { department: 'Computer Science and Engineering' },
      p_row_count: 10
    });
    recordTest(
      'Admin & Export Security',
      'ADM-01',
      'Non-admin student invocation of log_export RPC',
      'Exception UNAUTHORIZED: Only administrators can log exports',
      studentExportErr ? studentExportErr.message : 'No error',
      Boolean(studentExportErr && studentExportErr.message.includes('UNAUTHORIZED')),
      'Enforced by public.is_admin() inside log_export'
    );

    // 7b. Student A invocation of admin_delete_student
    const { data: studentAdminDelRes } = await studentClientA.rpc('admin_delete_student', {
      p_student_id: studentBId
    });
    recordTest(
      'Admin & Export Security',
      'ADM-02',
      'Non-admin student invocation of admin_delete_student RPC',
      'code: UNAUTHORIZED',
      studentAdminDelRes ? `code: ${studentAdminDelRes.code}` : 'No response',
      studentAdminDelRes?.success === false && studentAdminDelRes?.code === 'UNAUTHORIZED',
      'Enforced by public.is_admin() inside admin_delete_student'
    );

    // 7c. Student A attempt to read export_log
    const { data: studentAuditRows, error: studentAuditErr } = await studentClientA.from('export_log').select('*');
    const auditReadBlocked = (!studentAuditErr && (studentAuditRows?.length ?? 0) === 0) || Boolean(studentAuditErr);
    recordTest(
      'Admin & Export Security',
      'ADM-03',
      'Student read attempt on export_log table',
      '0 rows returned or access denied',
      studentAuditErr ? `Denied: ${studentAuditErr.message}` : `${studentAuditRows?.length ?? 0} rows`,
      auditReadBlocked,
      'Suppressed by RLS'
    );

    // 7d. Student A attempt to self-escalate role in admin_roles table
    const { error: escalateErr } = await studentClientA
      .from('admin_roles')
      .insert({ user_id: studentAId, role: 'admin' });
    recordTest(
      'Admin & Export Security',
      'ADM-04',
      'Student privilege escalation attempt via admin_roles INSERT',
      'Rejected by RLS',
      escalateErr ? `${escalateErr.code}: ${escalateErr.message}` : 'No error',
      Boolean(escalateErr),
      'Protected by admin-only RLS policy'
    );

    // 7e. Authorized administrator invocation of log_export
    const { data: adminExportRes, error: adminExportErr } = await adminAuthClient.rpc('log_export', {
      p_filters: { test_run_id: runId },
      p_row_count: 3
    });
    recordTest(
      'Admin & Export Security',
      'ADM-05',
      'Administrator invocation of log_export RPC',
      'Returns success: true',
      adminExportRes ? JSON.stringify(adminExportRes) : `Error: ${adminExportErr?.message}`,
      adminExportRes?.success === true,
      'Authorized under public.is_admin()'
    );

    // 7f. Authorized administrator read of export_log
    const { data: adminAuditRows, error: adminAuditErr } = await adminAuthClient
      .from('export_log')
      .select('*')
      .contains('filters', { test_run_id: runId });
    recordTest(
      'Admin & Export Security',
      'ADM-06',
      'Administrator read of export_log table',
      '>= 1 audit log record returned',
      `${adminAuditRows?.length ?? 0} rows`,
      !adminAuditErr && (adminAuditRows?.length ?? 0) >= 1,
      'Authorized under admin RLS policy'
    );

    console.log('\n================================================================================');
    console.log('  ADVERSARIAL SECURITY VERIFICATION SUMMARY');
    console.log('================================================================================');

    const passedCount = testResults.filter(t => t.status === 'PASS').length;
    const failedCount = testResults.filter(t => t.status === 'FAIL').length;
    console.log(`Total Adversarial Checks Executed: ${testResults.length}`);
    console.log(`PASS:                             ${passedCount}`);
    console.log(`FAIL:                             ${failedCount}`);
    console.log(`NOT RUN:                          0`);

    if (failedCount > 0) {
      console.error('\nFAILED TESTS DETECTED:');
      for (const t of testResults.filter(t => t.status === 'FAIL')) {
        console.error(`- [${t.testId}] ${t.description} (Expected: ${t.expected}, Actual: ${t.actual})`);
      }
      process.exitCode = 1;
    } else {
      console.log('\n✓ ALL ADVERSARIAL SECURITY SCENARIOS PASSED WITH ZERO FAILURES.');
    }

  } finally {
    console.log('\n[DESTRUCTIVE TEST OPERATION] Cleaning up only records created by this test run:');
    try {
      if (createdEventId) {
        console.log(`  - Deleting registrations for test event: ${createdEventId}`);
        await adminClient.from('registrations').delete().eq('event_id', createdEventId);
        console.log(`  - Deleting test event: ${createdEventId}`);
        await adminClient.from('events').delete().eq('id', createdEventId);
      }
      console.log(`  - Deleting test contact messages matching email: ${testContactEmail.toLowerCase()}`);
      await adminClient.from('contact_messages').delete().eq('email', testContactEmail.toLowerCase());

      console.log(`  - Deleting test export logs matching runId: ${runId}`);
      await adminClient.from('export_log').delete().contains('filters', { test_run_id: runId });

      const testUserIds = [studentAId, studentBId, studentCId, adminId].filter(Boolean);
      if (testUserIds.length > 0) {
        console.log(`  - Deleting consents for disposable test students: ${testUserIds.join(', ')}`);
        await adminClient.from('consents').delete().in('student_id', testUserIds);
        console.log(`  - Deleting profiles for disposable test students: ${testUserIds.join(', ')}`);
        await adminClient.from('profiles').delete().in('id', testUserIds);
        console.log(`  - Deleting admin roles for test admin: ${adminId}`);
        if (adminId) await adminClient.from('admin_roles').delete().eq('user_id', adminId);
        for (const uid of testUserIds) {
          console.log(`  - Deleting auth user: ${uid}`);
          await adminClient.auth.admin.deleteUser(uid);
        }
      }
      console.log('✓ Cleanup of test artifacts complete. Staging database is pristine.\n');
    } catch (cleanupErr) {
      console.error('Warning during artifact cleanup:', cleanupErr?.message);
    }
  }
}

runAdversarialSuite().catch((err) => {
  console.error('\nSTAGING TEST RUNNER ERROR:', err);
  process.exit(1);
});
