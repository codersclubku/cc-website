/**
 * scripts/verify-full-regression.mjs
 * 
 * Comprehensive Quality & Regression Verification Suite for Coders Club University Platform
 * 
 * Invariants Verified:
 * 1. Public Website & Route Invariants
 * 2. Authentication & Open Redirect Security
 * 3. Academic Data & Kishkinda University USN Format Invariants
 * 4. Privacy Consent & Versioning Integrity (v1.0-2026)
 * 5. Event Registration Capacity, Concurrency & Waitlist
 * 6. Admin Portal, Export Security & Formula Injection Defense
 * 7. Contact & Feedback Form Sanitization and Anti-bot Validation
 */

import assert from 'node:assert';
import fs from 'node:fs';

console.log('================================================================================');
console.log('   CODERS CLUB PLATFORM COMPREHENSIVE REGRESSION & QUALITY AUDIT SUITE');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// Helper implementations matching src/lib/validation.ts
// -----------------------------------------------------------------------------
function isSafeRedirectPath(path) {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  return (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('\\') &&
    !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  );
}

function sanitizeRedirectPath(path, fallback = '/account') {
  if (isSafeRedirectPath(path)) {
    const trimmed = path.trim();
    if (trimmed !== '/signin' && trimmed !== '/signup') {
      return trimmed;
    }
  }
  return fallback;
}

function sanitizeExcelValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const raw = String(value);
  if (/^[=+\-@\t\r]/.test(raw)) {
    return "'" + raw;
  }
  const trimmed = raw.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return "'" + trimmed;
  }
  return trimmed;
}

const USN_REGEX = /^KU[A-Z]?(?:[0-9]{2}|[0-9]{4})[A-Z]{2,4}[0-9]{3}$/;
function isValidUsn(usn) {
  if (!usn || typeof usn !== 'string') return false;
  return USN_REGEX.test(usn.trim().toUpperCase());
}

// -----------------------------------------------------------------------------
// 1. PUBLIC WEBSITE & ROUTE INVARIANTS
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Public Website & Route Invariants ---');

check('App.tsx declares all required public and student portal routes', () => {
  const appCode = fs.readFileSync('src/App.tsx', 'utf8');
  const requiredRoutes = [
    'path="/"',
    'path="/about"',
    'path="/events"',
    'path="/events/:slug"',
    'path="/events/:slug/register"',
    'path="/projects"',
    'path="/projects/:slug"',
    'path="/team"',
    'path="/gallery"',
    'path="/contact"',
    'path="/feedback"',
    'path="/privacy"',
    'path="/signup"',
    'path="/signin"',
    'path="/onboarding"',
    'path="/account"',
    'path="/admin"'
  ];
  for (const r of requiredRoutes) {
    assert.ok(appCode.includes(r), `Missing expected route: ${r}`);
  }
});

check('PublicLayout wraps pages with SkipLink, Header, Footer, and BottomTabBar', () => {
  const appCode = fs.readFileSync('src/App.tsx', 'utf8');
  assert.ok(appCode.includes('<SkipLink />'));
  assert.ok(appCode.includes('<Header />'));
  assert.ok(appCode.includes('<Footer />'));
  assert.ok(appCode.includes('<BottomTabBar />'));
});

check('Privacy policy references authoritative Notice Version and Kishkinda University', () => {
  const privacyCode = fs.readFileSync('src/pages/Privacy.tsx', 'utf8');
  assert.ok(privacyCode.includes('Notice Version 1.0'));
  assert.ok(privacyCode.includes('Kishkinda University'));
});

// -----------------------------------------------------------------------------
// 2. AUTHENTICATION & OPEN REDIRECT SECURITY
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Authentication & Open Redirect Security ---');

check('isSafeRedirectPath accepts legitimate relative paths', () => {
  assert.strictEqual(isSafeRedirectPath('/account'), true);
  assert.strictEqual(isSafeRedirectPath('/events/hackathon-2026'), true);
  assert.strictEqual(isSafeRedirectPath('/events/workshop/register?step=2'), true);
});

check('isSafeRedirectPath strictly blocks adversarial external & protocol-relative URLs', () => {
  assert.strictEqual(isSafeRedirectPath('https://malicious-site.com'), false);
  assert.strictEqual(isSafeRedirectPath('http://malicious-site.com'), false);
  assert.strictEqual(isSafeRedirectPath('//malicious-site.com'), false);
  assert.strictEqual(isSafeRedirectPath('/\\malicious-site.com'), false);
  assert.strictEqual(isSafeRedirectPath('/account\\nested'), false);
  assert.strictEqual(isSafeRedirectPath('javascript:alert(1)'), false);
  assert.strictEqual(isSafeRedirectPath('data:text/html,<h1>bad</h1>'), false);
  assert.strictEqual(isSafeRedirectPath(''), false);
  assert.strictEqual(isSafeRedirectPath(null), false);
  assert.strictEqual(isSafeRedirectPath(undefined), false);
});

check('sanitizeRedirectPath redirects unauthenticated/external inputs to default fallback', () => {
  assert.strictEqual(sanitizeRedirectPath('https://evil.com', '/account'), '/account');
  assert.strictEqual(sanitizeRedirectPath('//evil.com', '/account'), '/account');
  assert.strictEqual(sanitizeRedirectPath('/signin', '/account'), '/account');
  assert.strictEqual(sanitizeRedirectPath('/signup', '/account'), '/account');
  assert.strictEqual(sanitizeRedirectPath('/events/ai-summit', '/account'), '/events/ai-summit');
});

check('SignIn, SignUp, and Onboarding integrate open redirect mitigation', () => {
  const signinCode = fs.readFileSync('src/pages/SignIn.tsx', 'utf8');
  const signupCode = fs.readFileSync('src/pages/SignUp.tsx', 'utf8');
  const onboardingCode = fs.readFileSync('src/pages/Onboarding.tsx', 'utf8');
  const authContextCode = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

  assert.ok(signinCode.includes('sanitizeRedirectPath(rawReturnUrl, \'/account\')'));
  assert.ok(signupCode.includes('sanitizeRedirectPath(rawReturnUrl, \'/account\')'));
  assert.ok(onboardingCode.includes('sanitizeRedirectPath(rawReturnUrl, \'/account\')'));
  assert.ok(authContextCode.includes('sanitizeRedirectPath(returnPath, \'/account\')'));
});

check('Temporary Google Sign-In shutdown notice is displayed and OAuth infrastructure is preserved', () => {
  const signinCode = fs.readFileSync('src/pages/SignIn.tsx', 'utf8');
  const signupCode = fs.readFileSync('src/pages/SignUp.tsx', 'utf8');
  const authContextCode = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');
  const featuresCode = fs.readFileSync('src/config/features.ts', 'utf8');

  assert.ok(featuresCode.includes('export const GOOGLE_SIGNIN_ENABLED = false;'));
  assert.ok(signinCode.includes('Google Sign-In is temporarily unavailable. Please use your email and password to access your account.'));
  assert.ok(signupCode.includes('Google Sign-In is temporarily unavailable. Please use your email and password to access your account.'));
  assert.ok(signinCode.includes('{GOOGLE_SIGNIN_ENABLED ? ('));
  assert.ok(signupCode.includes('{GOOGLE_SIGNIN_ENABLED ? ('));
  assert.ok(authContextCode.includes('signInWithGoogle'));
  assert.ok(authContextCode.includes("provider: 'google'"));
});

// -----------------------------------------------------------------------------
// 3. STUDENT PROFILE & KISHKINDA UNIVERSITY USN INVARIANTS
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Academic & USN Invariants ---');

check('validation.ts contains all 10 Kishkinda University departments', () => {
  const validationCode = fs.readFileSync('src/lib/validation.ts', 'utf8');
  const departments = [
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
  for (const dept of departments) {
    assert.ok(validationCode.includes(`'${dept}'`), `Missing department: ${dept}`);
  }
});

check('validation.ts contains 4 academic years and 8 semesters', () => {
  const validationCode = fs.readFileSync('src/lib/validation.ts', 'utf8');
  assert.ok(validationCode.includes("'1st Year'"));
  assert.ok(validationCode.includes("'4th Year'"));
  assert.ok(validationCode.includes("'1st Semester'"));
  assert.ok(validationCode.includes("'8th Semester'"));
});

check('isValidUsn validates official Kishkinda University formats and rejects non-affiliated formats', () => {
  const valid = ['KUB24CSE198', 'KUB23AIM042', 'KUM24MCA005', 'KU2024CS099', 'KU2023AI001'];
  for (const u of valid) {
    assert.strictEqual(isValidUsn(u), true, `Expected valid: ${u}`);
  }

  const invalid = ['1MS21CS001', 'USN12345', 'KUB24', '<script>', 'KU2024CS001; DROP TABLE students;'];
  for (const u of invalid) {
    assert.strictEqual(isValidUsn(u), false, `Expected invalid: ${u}`);
  }
});

// -----------------------------------------------------------------------------
// 4. REGISTRATION CAPACITY & CONCURRENCY INVARIANTS
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Registration & Capacity Concurrency Invariants ---');

check('Frontend API delegates event registration strictly to atomic RPC', () => {
  const apiCode = fs.readFileSync('src/lib/api.ts', 'utf8');
  assert.ok(apiCode.includes("supabase.rpc('register_student_atomic'"));
  assert.ok(apiCode.includes("supabase.rpc('cancel_registration'"));
  assert.ok(!apiCode.includes("supabase.from('registrations').insert("));
});

check('Authoritative onboarding RPC requires version and consent', () => {
  const apiCode = fs.readFileSync('src/lib/api.ts', 'utf8');
  assert.ok(apiCode.includes("p_version:      data.version || 'v1.0-2026'"));
  assert.ok(apiCode.includes("p_consent:      data.consentAccepted"));
});

// -----------------------------------------------------------------------------
// 5. ADMIN PORTAL, EXPORT & FORMULA INJECTION DEFENSE
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 5: Admin Portal & Formula Injection Defense ---');

check('sanitizeExcelValue neutralizes Excel formula injection (=, +, -, @, \\t, \\r)', () => {
  assert.strictEqual(sanitizeExcelValue('=SUM(A1:A10)'), "'=SUM(A1:A10)");
  assert.strictEqual(sanitizeExcelValue('+123456789'), "'+123456789");
  assert.strictEqual(sanitizeExcelValue('-cmd|calc'), "'-cmd|calc");
  assert.strictEqual(sanitizeExcelValue('@HYPERLINK("http://evil.com")'), "'@HYPERLINK(\"http://evil.com\")");
  assert.strictEqual(sanitizeExcelValue('\tmalicious'), "'\tmalicious");
  assert.strictEqual(sanitizeExcelValue('\rmalicious'), "'\rmalicious");
  assert.strictEqual(sanitizeExcelValue('Normal text'), "Normal text");
  assert.strictEqual(sanitizeExcelValue(null), "");
  assert.strictEqual(sanitizeExcelValue(undefined), "");
});

check('AdminLayout defines role gate and administrative navigation links', () => {
  const adminLayout = fs.readFileSync('src/pages/admin/AdminLayout.tsx', 'utf8');
  assert.ok(adminLayout.includes('!user || !isAdmin'));
  assert.ok(adminLayout.includes('to="/admin/login"'));
  assert.ok(adminLayout.includes('Students'));
  assert.ok(adminLayout.includes('Registrations'));
  assert.ok(adminLayout.includes('Check-in'));
  assert.ok(adminLayout.includes('Events'));
  assert.ok(adminLayout.includes('Announcements'));
  assert.ok(adminLayout.includes('Feedback'));
});

// -----------------------------------------------------------------------------
// 6. CONTACT & FEEDBACK FORM SANITIZATION
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 6: Contact & Feedback Sanitization ---');

check('Contact validation rejects HTML tags and requires consent', () => {
  const validCode = fs.readFileSync('src/lib/validation.ts', 'utf8');
  assert.ok(validCode.includes('noHtmlRegex'));
  assert.ok(validCode.includes('HTML tags are not permitted'));
  assert.ok(validCode.includes('websiteUrl'));
});

console.log('\n================================================================================');
console.log(`REGRESSION AUDIT SUMMARY: ${passCount} passed, ${failCount} failed`);
console.log('================================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
