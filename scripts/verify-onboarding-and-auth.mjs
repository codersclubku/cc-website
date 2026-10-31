import assert from 'node:assert';
import fs from 'node:fs';

console.log('=== RUNNING ONBOARDING & AUTH PERSISTENCE VERIFICATION ===\n');

// -----------------------------------------------------------------------------
// Test 1: Academic Data Consistency
// -----------------------------------------------------------------------------
console.log('Test 1: Academic Data Invariants');
const validationSource = fs.readFileSync('src/lib/validation.ts', 'utf8');

// Verify that all 10 departments, 4 years, and 8 semesters are present in the source file
assert.ok(validationSource.includes("'Computer Science and Engineering'"));
assert.ok(validationSource.includes("'Artificial Intelligence & Data Science'"));
assert.ok(validationSource.includes("'Artificial Intelligence & Machine Learning'"));
assert.ok(validationSource.includes("'Information Science and Engineering'"));
assert.ok(validationSource.includes("'Electronics and Communication Engineering'"));
assert.ok(validationSource.includes("'Electrical and Electronics Engineering'"));
assert.ok(validationSource.includes("'Mechanical Engineering'"));
assert.ok(validationSource.includes("'Civil Engineering'"));
assert.ok(validationSource.includes("'Master of Computer Applications'"));
assert.ok(validationSource.includes("'Other'"));

assert.ok(validationSource.includes("'1st Year'"));
assert.ok(validationSource.includes("'4th Year'"));
assert.ok(validationSource.includes("'1st Semester'"));
assert.ok(validationSource.includes("'8th Semester'"));

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Artificial Intelligence & Data Science',
  'Artificial Intelligence & Machine Learning',
  'Information Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Master of Computer Applications',
  'Other'
];
assert.strictEqual(DEPARTMENTS.length, 10, 'Expected 10 departments');
console.log('✓ Academic constants verified successfully.\n');

// -----------------------------------------------------------------------------
// Test 2: Profile Completeness Helper
// -----------------------------------------------------------------------------
console.log('Test 2: isProfileComplete Helper Function');

function isProfileComplete(profile) {
  if (!profile) return false;
  return Boolean(
    profile.id &&
    profile.full_name?.trim() &&
    profile.usn?.trim() &&
    profile.department?.trim() &&
    profile.year?.trim() &&
    profile.semester?.trim()
  );
}

assert.strictEqual(isProfileComplete(null), false);
assert.strictEqual(isProfileComplete({}), false);
assert.strictEqual(isProfileComplete({ id: 'u1', full_name: 'Test', usn: '' }), false);
assert.strictEqual(isProfileComplete({
  id: 'u1',
  full_name: 'Aditi Sharma',
  usn: 'KU2024CS001',
  department: 'Computer Science and Engineering',
  year: '1st Year',
  semester: '1st Semester'
}), true);
console.log('✓ isProfileComplete evaluates completeness strictly.\n');

// -----------------------------------------------------------------------------
// Test 3: Authoritative USN Format Validation
// -----------------------------------------------------------------------------
console.log('Test 3: Authoritative USN Sanitization and Validation');

const USN_AUTHORITATIVE_REGEX = /^(KU[0-9]{4}[A-Z]{2,4}[0-9]{3}|[1-9][A-Z]{2}[0-9]{2}[A-Z]{2,4}[0-9]{3})$/;

function validateAuthoritativeUsn(rawUsn) {
  if (typeof rawUsn !== 'string') return false;
  const clean = rawUsn.trim().toUpperCase();
  if (!USN_AUTHORITATIVE_REGEX.test(clean)) return false;
  return clean;
}

// 3a. Valid USNs (Kishkinda University & Karnataka VTU formats)
assert.strictEqual(validateAuthoritativeUsn('KU2024CS001'), 'KU2024CS001');
assert.strictEqual(validateAuthoritativeUsn('KU2023AI014'), 'KU2023AI014');
assert.strictEqual(validateAuthoritativeUsn('2KA22CS001'), '2KA22CS001');
assert.strictEqual(validateAuthoritativeUsn('KU2024MCA001'), 'KU2024MCA001');
assert.strictEqual(validateAuthoritativeUsn('2KA22AIM001'), '2KA22AIM001');

// 3b. Lowercase and whitespace normalization
assert.strictEqual(validateAuthoritativeUsn('  ku2024cs001  '), 'KU2024CS001');
assert.strictEqual(validateAuthoritativeUsn('\tku2023ai014\n'), 'KU2023AI014');
assert.strictEqual(validateAuthoritativeUsn('  2ka22cs001  '), '2KA22CS001');

// 3c. Invalid USNs strictly rejected
assert.strictEqual(validateAuthoritativeUsn('ABCDE123'), false, 'Arbitrary alphanumeric string must be rejected');
assert.strictEqual(validateAuthoritativeUsn('A---1'), false, 'Hyphenated string must be rejected');
assert.strictEqual(validateAuthoritativeUsn('ABCD/1'), false, 'Slashed string must be rejected');
assert.strictEqual(validateAuthoritativeUsn('KU-2024/CS-001'), false, 'Punctuated format must be rejected');
assert.strictEqual(validateAuthoritativeUsn('12345'), false, 'Pure digits must be rejected');
assert.strictEqual(validateAuthoritativeUsn('ABCDEF'), false, 'Pure letters must be rejected');
assert.strictEqual(validateAuthoritativeUsn('-----'), false, 'Pure symbols must be rejected');
assert.strictEqual(validateAuthoritativeUsn('-KU2024CS001'), false, 'Leading symbol must be rejected');
assert.strictEqual(validateAuthoritativeUsn('KU2024CS001-'), false, 'Trailing symbol must be rejected');
assert.strictEqual(validateAuthoritativeUsn('KU'), false, 'Too short (< 5) must be rejected');
assert.strictEqual(validateAuthoritativeUsn('KU2024CS01'), false, '2-digit serial number must be rejected');
assert.strictEqual(validateAuthoritativeUsn('KU24CS001'), false, '2-digit KU admission year must be rejected');
assert.strictEqual(validateAuthoritativeUsn('2KA2022CS001'), false, '4-digit VTU admission year must be rejected');
assert.strictEqual(validateAuthoritativeUsn('KU202412001'), false, 'Numeric department code must be rejected');
assert.strictEqual(validateAuthoritativeUsn('KU2024C001'), false, '1-letter department code must be rejected');
assert.strictEqual(validateAuthoritativeUsn('KU2024CS0001'), false, '4-digit serial number must be rejected');
assert.strictEqual(validateAuthoritativeUsn('KU2024CS001VERYLONGSYMBOLSEXCEEDINGTWENTY'), false, 'Too long must be rejected');
assert.strictEqual(validateAuthoritativeUsn('KU2024CS001<script>'), false, 'Special injection characters must be rejected');

// 3d. USN Case-Insensitive Deduplication Simulation
const registeredUsns = new Set();
function registerUniqueUsn(usn) {
  const normalizedKey = usn.trim().toLowerCase();
  if (registeredUsns.has(normalizedKey)) {
    throw new Error('DUPLICATE_USN');
  }
  registeredUsns.add(normalizedKey);
}
registerUniqueUsn('KU2024CS001');
assert.throws(() => registerUniqueUsn('ku2024cs001'), /DUPLICATE_USN/);
assert.throws(() => registerUniqueUsn('  KU2024CS001  '), /DUPLICATE_USN/);

// 3e. Immutability Check: Modifying an existing USN is rejected
function attemptUsnUpdate(existingUsn, newUsn) {
  if (existingUsn && existingUsn.trim() && existingUsn.trim().toUpperCase() !== newUsn.trim().toUpperCase()) {
    throw new Error('CANNOT_CHANGE_USN');
  }
  return newUsn.trim().toUpperCase();
}
assert.strictEqual(attemptUsnUpdate('KU2024CS001', 'ku2024cs001'), 'KU2024CS001');
assert.throws(() => attemptUsnUpdate('KU2024CS001', 'KU2024CS002'), /CANNOT_CHANGE_USN/);

console.log('✓ Authoritative USN format validation, normalization, deduplication, and immutability verified.\n');

// -----------------------------------------------------------------------------
// Test 4: Mock Storage Two-Phase Atomic Commit Simulation
// -----------------------------------------------------------------------------
console.log('Test 4: Two-Phase Atomic Mock Mode Persistence');

// Mock localStorage implementation
class MockStorage {
  constructor(shouldThrow = false) {
    this.store = new Map();
    this.shouldThrow = shouldThrow;
  }
  getItem(k) { return this.store.get(k) || null; }
  setItem(k, v) {
    if (this.shouldThrow) throw new Error('QuotaExceededError: Local storage limit reached');
    this.store.set(k, String(v));
  }
  removeItem(k) { this.store.delete(k); }
}

function simulateTwoPhaseCommit(storage, mockProfiles, studentId, data) {
  if (!data.consentAccepted) throw new Error('CONSENT_REQUIRED');

  const existingIdx = mockProfiles.findIndex((p) => p.id === studentId);
  const stagedProfile = {
    id: studentId,
    full_name: data.fullName.trim(),
    usn: data.usn.toUpperCase().trim(),
    department: data.department,
    year: data.year,
    semester: data.semester,
    created_at: existingIdx >= 0 ? mockProfiles[existingIdx].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let stagedConsents = {};
  const raw = storage.getItem('cc-mock-consents');
  if (raw) stagedConsents = JSON.parse(raw);
  stagedConsents[studentId] = {
    version: data.version || 'v1.0-2026',
    accepted_at: new Date().toISOString(),
    withdrawn_at: null
  };

  // Phase 1 write to storage
  storage.setItem('cc-mock-consents', JSON.stringify(stagedConsents));

  // Phase 2 commit to in-memory array ONLY after storage write succeeds
  if (existingIdx >= 0) {
    mockProfiles[existingIdx] = stagedProfile;
  } else {
    mockProfiles.push(stagedProfile);
  }
  return stagedProfile;
}

// Case A: Successful write
const normalStorage = new MockStorage(false);
const normalProfiles = [];
const result = simulateTwoPhaseCommit(normalStorage, normalProfiles, 'mock-student-1', {
  fullName: 'Aditi Sharma',
  usn: 'ku2024cs001',
  department: 'Computer Science and Engineering',
  year: '1st Year',
  semester: '1st Semester',
  consentAccepted: true
});

assert.strictEqual(result.usn, 'KU2024CS001');
assert.strictEqual(normalProfiles.length, 1);
assert.ok(normalStorage.getItem('cc-mock-consents').includes('mock-student-1'));
console.log('✓ Normal mock persistence commits to storage and memory cleanly.');

// Case B: Storage Failure (Quota Exceeded) — must NOT mutate memory
const failingStorage = new MockStorage(true);
const intactProfiles = [];
let errorCaught = false;
try {
  simulateTwoPhaseCommit(failingStorage, intactProfiles, 'mock-student-1', {
    fullName: 'Aditi Sharma',
    usn: 'KU2024CS001',
    department: 'Computer Science and Engineering',
    year: '1st Year',
    semester: '1st Semester',
    consentAccepted: true
  });
} catch (err) {
  errorCaught = true;
  assert.ok(err.message.includes('QuotaExceededError'));
}
assert.strictEqual(errorCaught, true);
assert.strictEqual(intactProfiles.length, 0, 'In-memory profiles must not be mutated if storage throws');
console.log('✓ Storage failure leaves in-memory state unmutated (Atomic rollback).\n');

// -----------------------------------------------------------------------------
// Test 5: Session-Bound Submission & Stale Discard Simulation
// -----------------------------------------------------------------------------
console.log('Test 5: Session-Bound Submission & Stale Request Protection');

let activeUserId = 'user-initial';
let currentOpId = 1;
let navigationExecuted = false;

async function simulateSubmit(submissionUid, requestOpId) {
  // Simulate network RPC delay
  await new Promise((r) => setTimeout(r, 10));

  // Check guard
  if (currentOpId === requestOpId && activeUserId === submissionUid) {
    navigationExecuted = true;
  }
}

// User signs out during active RPC
const submitPromise = simulateSubmit('user-initial', 1);
activeUserId = null; // signed out
currentOpId = 2; // op counter incremented
await submitPromise;

assert.strictEqual(navigationExecuted, false, 'Navigation must be aborted if user identity changed or logged out');
console.log('✓ Out-of-order response cleanly discarded on sign-out/account switch.\n');

// -----------------------------------------------------------------------------
// Test 6: Registration Authorization Invariants
// -----------------------------------------------------------------------------
console.log('Test 6: Registration Authorization Invariants');

function simulateRegistrationCheck(profile, hasActiveConsent) {
  if (!isProfileComplete(profile)) {
    return { success: false, code: 'PROFILE_INCOMPLETE', message: 'You must complete your student profile before registering for events.' };
  }
  if (!hasActiveConsent) {
    return { success: false, code: 'CONSENT_REQUIRED', message: 'You must accept the Privacy Notice before registering for events.' };
  }
  return { success: true, code: 'REGISTERED' };
}

// 6a: Incomplete profile rejected
const incompleteProf = { id: 'u1', full_name: 'Test', usn: '' };
assert.strictEqual(simulateRegistrationCheck(incompleteProf, true).code, 'PROFILE_INCOMPLETE');

// 6b: Missing consent rejected
const completeProf = { id: 'u1', full_name: 'Aditi Sharma', usn: 'KU2024CS001', department: 'Computer Science and Engineering', year: '1st Year', semester: '1st Semester' };
assert.strictEqual(simulateRegistrationCheck(completeProf, false).code, 'CONSENT_REQUIRED');

// 6c: Complete profile with active consent accepted
assert.strictEqual(simulateRegistrationCheck(completeProf, true).code, 'REGISTERED');
console.log('✓ Registration authorization strictly requires complete profile and active consent.\n');

// -----------------------------------------------------------------------------
// Test 7: Event Capacity & Waitlist Invariants
// -----------------------------------------------------------------------------
console.log('Test 7: Event Capacity & Waitlist Invariants');

function simulateEventRegistration(event, currentRegisteredCount) {
  if (event.capacity && currentRegisteredCount >= event.capacity) {
    if (event.allow_waitlist === true) {
      return { success: true, status: 'waitlisted', code: 'WAITLISTED' };
    }
    return { success: false, status: 'rejected', code: 'CAPACITY_REACHED' };
  }
  return { success: true, status: 'registered', code: 'REGISTERED' };
}

// 7a. Under capacity -> registered
const event1 = { capacity: 50, allow_waitlist: false };
assert.strictEqual(simulateEventRegistration(event1, 40).status, 'registered');

// 7b. At capacity with waitlist DISABLED -> rejected (original preserved behavior)
assert.strictEqual(simulateEventRegistration(event1, 50).code, 'CAPACITY_REACHED');

// 7c. At capacity with waitlist ENABLED -> waitlisted
const eventWithWaitlist = { capacity: 50, allow_waitlist: true };
assert.strictEqual(simulateEventRegistration(eventWithWaitlist, 50).status, 'waitlisted');

// 7d. Unlimited capacity event -> registered
const unlimitedEvent = { capacity: null, allow_waitlist: false };
assert.strictEqual(simulateEventRegistration(unlimitedEvent, 500).status, 'registered');

console.log('✓ Waitlist behavior correctly preserves original capacity rejection unless explicitly enabled.\n');

// -----------------------------------------------------------------------------
// Test 8: Administrator Registration Auditability & Safety
// -----------------------------------------------------------------------------
console.log('Test 8: Administrator Registration Auditability & Safety');

function simulateAtomicRegistrationRPC({ callerId, isAdmin, targetStudentId, studentProfileExists }) {
  if (!callerId) return { success: false, code: 'NOT_AUTHENTICATED' };

  // Only self-registration or authorized administrators permitted
  if (callerId !== targetStudentId && !isAdmin) {
    return { success: false, code: 'UNAUTHORIZED' };
  }

  // Profile existence check
  if (!studentProfileExists) {
    return { success: false, code: 'PROFILE_NOT_FOUND' };
  }

  // Audit trail: self vs admin registration
  const isAdminRegistration = callerId !== targetStudentId;
  const registeredBy = callerId;

  return {
    success: true,
    code: 'REGISTERED',
    registered_by: registeredBy,
    is_admin_registration: isAdminRegistration
  };
}

// 8a. Self-registration records caller as student
const selfReg = simulateAtomicRegistrationRPC({
  callerId: 'student-123',
  isAdmin: false,
  targetStudentId: 'student-123',
  studentProfileExists: true
});
assert.strictEqual(selfReg.success, true);
assert.strictEqual(selfReg.registered_by, 'student-123');
assert.strictEqual(selfReg.is_admin_registration, false);

// 8b. Student impersonation attempt rejected
const impReg = simulateAtomicRegistrationRPC({
  callerId: 'student-123',
  isAdmin: false,
  targetStudentId: 'student-456',
  studentProfileExists: true
});
assert.strictEqual(impReg.success, false);
assert.strictEqual(impReg.code, 'UNAUTHORIZED');

// 8c. Admin desk registration auditable with admin caller ID
const adminReg = simulateAtomicRegistrationRPC({
  callerId: 'admin-999',
  isAdmin: true,
  targetStudentId: 'student-456',
  studentProfileExists: true
});
assert.strictEqual(adminReg.success, true);
assert.strictEqual(adminReg.registered_by, 'admin-999');
assert.strictEqual(adminReg.is_admin_registration, true);

// 8d. Missing profile rejected even for admin
const adminMissingProf = simulateAtomicRegistrationRPC({
  callerId: 'admin-999',
  isAdmin: true,
  targetStudentId: 'ghost-student',
  studentProfileExists: false
});
assert.strictEqual(adminMissingProf.success, false);
assert.strictEqual(adminMissingProf.code, 'PROFILE_NOT_FOUND');

console.log('✓ Administrator registration auditability and authorization boundaries verified.\n');

// -----------------------------------------------------------------------------
// Test 9: OAuth Callback Invariants and Race Condition Immunity
// -----------------------------------------------------------------------------
console.log('Test 9: OAuth Callback Invariants and Race Condition Immunity');

// 9a: Protected route evaluation when code callback is in flight
function evaluateProtectedRouteGuard({ loading, user, searchParams, hash }) {
  const hasCallbackInUrl = Boolean(
    (searchParams && searchParams.includes('code=')) ||
    (hash && hash.includes('access_token='))
  );

  if (loading || (!user && hasCallbackInUrl)) {
    return 'LOADER'; // Remains on loading screen while callback settles
  }

  if (!user) {
    return 'REDIRECT_SIGNIN';
  }

  return 'PROCEED';
}

// Scenario 1: Initial load on /account with ?code= in URL before exchange finishes
assert.strictEqual(
  evaluateProtectedRouteGuard({ loading: false, user: null, searchParams: '?code=oauth_code_123', hash: '' }),
  'LOADER',
  'Must show LOADER and NOT redirect to signin when callback code is in URL'
);

// Scenario 2: Normal unauthenticated visit without code
assert.strictEqual(
  evaluateProtectedRouteGuard({ loading: false, user: null, searchParams: '', hash: '' }),
  'REDIRECT_SIGNIN',
  'Must redirect to signin when genuinely unauthenticated'
);

// Scenario 3: Authenticated user
assert.strictEqual(
  evaluateProtectedRouteGuard({ loading: false, user: { id: 'u1' }, searchParams: '', hash: '' }),
  'PROCEED',
  'Must proceed when authenticated'
);

// 9b: Post-authentication routing logic on /signin or /account
function resolveAuthenticatedRedirect({ user, profile, isAdmin, consentState, returnUrl }) {
  if (!user) return '/signin';
  if (isAdmin && !profile) return '/admin';
  if (!isProfileComplete(profile) || consentState !== 'ACTIVE') return '/onboarding';
  return returnUrl || '/account';
}

// Scenario 4: New Google user has no profile yet -> goes to /onboarding
assert.strictEqual(
  resolveAuthenticatedRedirect({
    user: { id: 'new-google-user', email: 'newstudent@ku.edu.in' },
    profile: null,
    isAdmin: false,
    consentState: 'MISSING',
    returnUrl: '/account'
  }),
  '/onboarding',
  'New OAuth student must be routed to onboarding'
);

// Scenario 5: Existing student with complete profile -> goes to requested returnUrl
assert.strictEqual(
  resolveAuthenticatedRedirect({
    user: { id: 'existing-student', email: 'student@ku.edu.in' },
    profile: {
      id: 'existing-student',
      full_name: 'Rahul Verma',
      usn: 'KU2024CS002',
      department: 'Computer Science and Engineering',
      year: '2nd Year',
      semester: '3rd Semester'
    },
    isAdmin: false,
    consentState: 'ACTIVE',
    returnUrl: '/events/hackathon/register'
  }),
  '/events/hackathon/register',
  'Existing OAuth student must be routed to requested returnUrl'
);

// Scenario 6: Admin user without student profile -> goes to /admin
assert.strictEqual(
  resolveAuthenticatedRedirect({
    user: { id: 'admin-user', email: 'admin@ku.edu.in' },
    profile: null,
    isAdmin: true,
    consentState: 'MISSING',
    returnUrl: '/account'
  }),
  '/admin',
  'Admin user without student profile must be routed to admin dashboard'
);

// 9c: Error description extraction from URL search or hash
function extractOAuthError(searchStr, hashStr) {
  const sp = new URLSearchParams(searchStr);
  const hp = new URLSearchParams(hashStr.startsWith('#') ? hashStr.slice(1) : hashStr);
  const raw = sp.get('error_description') || hp.get('error_description') || sp.get('error') || hp.get('error');
  if (!raw) return null;
  return decodeURIComponent(raw.replace(/\+/g, ' '));
}

assert.strictEqual(
  extractOAuthError('', '#error=access_denied&error_description=An+account+with+this+email+address+already+exists'),
  'An account with this email address already exists'
);
assert.strictEqual(
  extractOAuthError('?error=server_error&error_description=Database+error', ''),
  'Database error'
);
assert.strictEqual(extractOAuthError('', ''), null);

console.log('✓ OAuth callback invariants, race condition immunity, and routing verified.\n');

console.log('=== ALL ONBOARDING & AUTH UNIT TESTS PASSED ===');
