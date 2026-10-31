# Google Sign-In Temporary Shutdown Notice & Runbook

**Document Version:** 1.0.0  
**Effective Date:** October 31, 2026  
**Status:** Active (Temporary Suspension)  
**Applicability:** Coders Club Platform (`codersclubku.vercel.app`)

---

## 1. Executive Summary & Root Cause

Google Trust & Safety rejected our OAuth 2.0 production verification application because the Coders Club platform is hosted on a generic shared staging domain:
```
codersclubku.vercel.app
```
Google OAuth verification policies require verification of domain ownership via Google Search Console. Because `vercel.app` is owned and controlled by Vercel Inc. rather than Kishkinda University / Coders Club, domain ownership cannot be validated under Google Search Console for production OAuth verification.

Until a university-owned custom domain (e.g., `codersclub.kishkindauniversity.edu.in` or `codersclubku.in`) is acquired and verified, Google Sign-In is temporarily disabled in the user interface.

Students and administrators authenticate exclusively using **email and password credentials**.

---

## 2. Changes Implemented in the User Interface

### 2.1 UI Modifications
1. **Central Feature Toggle (`src/config/features.ts`)**:
   - Introduced `export const GOOGLE_SIGNIN_ENABLED = false;` as the single authoritative source of truth.
2. **Sign In Page (`src/pages/SignIn.tsx`)**:
   - The "Continue with Google" button and the `"or email"` divider are hidden when `GOOGLE_SIGNIN_ENABLED` is `false`.
   - In their place, a prominent and accessible notice is displayed:
     > **Notice:** "Google Sign-In is temporarily unavailable. Please use your email and password to access your account."
   - Rendered using the system `<Alert type="info" ... />` component to adhere to design tokens, dark/light theme switching, and WCAG accessibility guidelines (`role="status"`).
3. **Sign Up Page (`src/pages/SignUp.tsx`)**:
   - The "Continue with Google" button and the `"or email"` divider are hidden when `GOOGLE_SIGNIN_ENABLED` is `false`.
   - The identical professional notice is displayed directly above the student registration form.
4. **Other Authentication Screens**:
   - Password reset (`/forgot-password`), recovery update (`/reset-password`), and administrative login (`/admin/login`) continue using their dedicated email workflows with zero UI changes.
   - No broken buttons, empty dividers, or layout shifts exist.

---

## 3. Preservation of OAuth Infrastructure

**No OAuth configuration, secrets, or provider settings were deleted or modified.**

Specifically:
- **Supabase Google Provider:** Enabled and configured in the Supabase project dashboard.
- **Google OAuth Client ID & Secret:** Maintained securely in Supabase Auth provider settings and Google Cloud Console.
- **Environment Variables:** All `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and domain variables remain unchanged.
- **`AuthContext.tsx` Implementation:** The `signInWithGoogle` method remains fully defined, functional, and linked in context.
- **Session Listener & Token Refresh:** The Supabase authentication listener and local token refresh routines continue operating without disruption.

---

## 4. Preservation of Existing Google-Authenticated Users

Protecting students who previously created accounts or registered for events via Google OAuth is a strict priority:
- **Zero Account Deletions:** No student accounts, records, or profile rows have been removed or altered.
- **Active Sessions Maintained:** Existing active JWT sessions (stored in local storage or browser cookies) remain 100% valid. Existing users are **not forced to sign out**.
- **Student Profile & Consent Invariants:** Student onboarding statuses, DPDP Act 2023 consent records (`v1.0-2026`), event registrations, and QR tickets for existing users remain fully accessible.
- **Password Access for Google Users:** Students who previously authenticated via Google can establish a password using the standard **"Forgot password?"** flow (`/forgot-password`). Once a password is created, Supabase links the email credentials, allowing instant email/password login.

---

## 5. Email/Password Authentication Status

Email and password authentication is the primary authentication path and is fully functional:
- **Student Sign-Up (`/signup`)**: Validates full name, university email, authoritative USN format (`KU24...` / `KUB24...`), department, year, semester, and password strength (rejecting common passwords).
- **Student Sign-In (`/signin`)**: Secure login with lockout rate limiting after 5 consecutive failed attempts.
- **Password Recovery (`/forgot-password` & `/reset-password`)**: Delivers password recovery emails with secure single-use recovery links.
- **Coordinator & Admin Login (`/admin/login`)**: Direct coordinator authentication with rate limiting and role verification.

---

## 6. Steps to Restore Google Sign-In (Re-Enable Runbook)

Once a custom domain is acquired, follow these exact steps to reactivate Google Sign-In:

### Step 1: Custom Domain & DNS Setup
1. Point the custom domain (e.g. `codersclub.kishkindauniversity.edu.in` or `codersclubku.in`) to the Vercel production deployment.
2. Complete SSL certificate issuance in Vercel.

### Step 2: Google Search Console Domain Verification
1. Open [Google Search Console](https://search.google.com/search-console).
2. Add the custom domain as a Domain property or URL Prefix property.
3. Verify domain ownership using the DNS TXT record method.

### Step 3: Google Cloud Console Configuration
1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Navigate to **APIs & Services > OAuth consent screen**:
   - Add the verified domain to **Authorized domains** (e.g. `kishkindauniversity.edu.in` or `codersclubku.in`).
   - Add the App Homepage, Privacy Policy, and Terms of Service URLs using the new custom domain.
   - Submit for Google OAuth Verification.
3. Navigate to **APIs & Services > Credentials > OAuth 2.0 Client IDs**:
   - In **Authorized JavaScript origins**, add: `https://<your-custom-domain>`.
   - In **Authorized redirect URIs**, ensure the Supabase callback URL is retained:
     `https://<supabase-project-id>.supabase.co/auth/v1/callback`

### Step 4: Supabase Authentication Configuration
1. Open the [Supabase Dashboard](https://supabase.com/dashboard) for the project.
2. Navigate to **Authentication > URL Configuration**:
   - Set **Site URL** to `https://<your-custom-domain>`.
   - In **Redirect URLs**, add `https://<your-custom-domain>/**` and `https://<your-custom-domain>/account`.

### Step 5: Frontend Toggle Re-Activation
1. Open `src/config/features.ts`.
2. Toggle the flag back to `true`:
   ```typescript
   export const GOOGLE_SIGNIN_ENABLED = true;
   ```
3. Run verification tests:
   ```bash
   npm run lint
   npm run test:all
   npm run build
   ```
4. Deploy the updated build to production.

