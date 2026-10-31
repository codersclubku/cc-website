# Phase 15 — Stage 3: Google OAuth Production Diagnostic & Remediation Report

**Timestamp**: 2026-10-31T16:45:00+05:30  
**Environment**: Production (`https://codersclubku.vercel.app/`)  
**Production Supabase Project**: `lqlokvzvfccrarjmdvcv` (Region: `ap-south-1`)  
**Status**: **FIX IMPLEMENTED & REGRESSION TESTED — AWAITING HUMAN APPROVAL TO PUSH**  
**Classification**: **ROOT CAUSE IDENTIFIED & FIX IMPLEMENTED**

---

## 1. Executive Summary & Observed Defect

### 1.1 Observed Behavior
When a user initiates Google Sign-In at `https://codersclubku.vercel.app/signin`:
1. The Google account selector screen is displayed successfully.
2. The user selects their Google account and authorizes the application.
3. Upon returning to the website, the browser redirects back to `https://codersclubku.vercel.app/signin`.
4. The user is not signed in and remains on the sign-in form.

---

## 2. Deep Dive Root Cause Analysis

Through step-by-step diagnostic simulation of the Supabase GoTrue lifecycle and React route guarding, **three interacting root causes** were identified:

### Root Cause 1: Asynchronous Race Condition in `AuthContext.tsx` during Session Initialization
- **Mechanism**:
  - In `AuthContext.tsx`, session initialization relied solely on the `supabase.auth.onAuthStateChange` subscription listener.
  - In `@supabase/supabase-js` v2 / `gotrue-js`, registering `onAuthStateChange` **immediately and synchronously emits an `INITIAL_SESSION` event** reflecting the *pre-existing* session in localStorage.
  - When returning from Google OAuth (via PKCE flow with `?code=...` in the URL), localStorage has no session yet because the user was not previously logged in.
  - Therefore, `onAuthStateChange` fired `event = 'INITIAL_SESSION'` with `session = null` within milliseconds.
  - In `AuthContext.tsx`, line 114:
    ```typescript
    if (event === 'SIGNED_OUT' || !session?.user) {
      ...
      setLoading(false); // <-- Premature transition while PKCE exchange was still in flight!
    }
    ```
  - This immediately set `loading = false` while `gotrue-js`'s asynchronous HTTP network call (`_exchangeCodeForSession`) was still flying over the wire to Supabase.

### Root Cause 2: Premature Route Preemption in `ProtectedRoute.tsx`
- **Mechanism**:
  - In `signInWithGoogle()`, the redirect target was configured as `${window.location.origin}/account`.
  - When Google redirected back to `https://codersclubku.vercel.app/account?code=...`, the route `/account` was rendered, which is wrapped in `<ProtectedRoute requireStudentPortalAccess>`.
  - Because `loading` had transitioned to `false` (due to Root Cause 1) while `user` was still `null`, `ProtectedRoute.tsx` evaluated:
    ```typescript
    // 1. Authentication Gate
    if (!user) {
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/signin?returnUrl=${returnUrl}`} replace />;
    }
    ```
  - `ProtectedRoute` immediately executed `<Navigate to="/signin?returnUrl=..." replace />`.
  - This forcefully navigated the browser to `/signin`, replacing the URL and aborting/preempting the pending authentication callback context.

### Root Cause 3: Lack of Authenticated User Redirection on `SignIn.tsx` and `SignUp.tsx`
- **Mechanism**:
  - `SignIn.tsx` and `SignUp.tsx` did not have an effect listening to `user` state.
  - Even if the background PKCE code exchange subsequently completed in `localStorage` and emitted `SIGNED_IN`, the browser was already stranded on `/signin`.
  - `SignIn.tsx` simply remained rendered on the login form without redirecting the user to `/onboarding` (for new students) or `/account` (for existing users).
  - Furthermore, `SignIn.tsx` and `SignUp.tsx` lacked URL error parameter extraction (`error_description` in query string or hash), meaning any provider-side OAuth rejection was silently swallowed.

---

## 3. Configuration & Infrastructure Audit

### 3.1 Supabase Configuration (`lqlokvzvfccrarjmdvcv`)
- **VITE_SUPABASE_URL**: `https://lqlokvzvfccrarjmdvcv.supabase.co` (Verified embedded in production bundle).
- **VITE_SUPABASE_ANON_KEY**: Standard publishable key `sb_publishable_tX0rvPvn8zhlSacjva9fAA_S2Ptdqbo` (Decoded & verified via `/auth/v1/settings`: HTTP 200).
- **External Providers**: Verified `external.google: true`, `disable_signup: false`.
- **Google OAuth Client ID**: `508974561917-37spp9ehh1429f2drhk9p36shg51rvnu.apps.googleusercontent.com`.
- **Redirect URI to Supabase**: `https://lqlokvzvfccrarjmdvcv.supabase.co/auth/v1/callback` (Verified 302 redirect from Supabase `/auth/v1/authorize`).

---

## 4. Remediation Implemented

The following targeted, non-breaking modifications were implemented across 5 files:

### 4.1 `src/context/AuthContext.tsx`
1. **Awaited Authoritative Session**: Added `supabase.auth.getSession()` on mount to guarantee that `initializePromise` (which performs the PKCE exchange or hash token extraction) settles before terminating the initial `loading` state.
2. **Race-Condition Guarded Event Listener**: `INITIAL_SESSION` with `session = null` no longer clears loading if an OAuth callback (`code` in search or `access_token` in hash) is present in the URL.
3. **URL Error Extraction**: Added automatic extraction of OAuth `error_description` / `error` from URL search parameters and hash fragments into `profileLoadError`.
4. **Flexible `signInWithGoogle`**: Updated signature to `signInWithGoogle(returnPath?: string)` allowing dynamic return routing (e.g., directly to the event registration URL after login).

### 4.2 `src/components/ProtectedRoute.tsx`
1. **Callback In-Flight Protection**: Added check `hasCallbackInUrl`. If `code=` or `access_token=` is in the URL, `ProtectedRoute` preserves the loading screen and refuses to bounce the user to `/signin` while credentials are being exchanged.

### 4.3 `src/pages/SignIn.tsx` & `src/pages/SignUp.tsx`
1. **Automatic Navigation for Authenticated Users**: Added `useEffect` listening to `user`:
   - If user is an admin without profile → redirects to `/admin`.
   - If user is a student with incomplete profile or missing consent → redirects to `/onboarding`.
   - If user has completed profile → redirects to `returnUrl` (default `/account`).
2. **Error Banner Surface**: Added URL error parameter listener to surface OAuth errors (such as email conflicts) directly in the UI alert banner.
3. **Clean OAuth Trigger**: Passed `returnUrl` to `signInWithGoogle(returnUrl)` and removed the conflicting synchronous `navigate` call.

### 4.4 `src/lib/api.ts`
1. **Resilient `checkConsentStatus`**: Added safe fallback if table `consents` is queried on a database where column `superseded_at` has not yet been migrated (prevents spurious `ERROR` status during preflight inspection).

---

## 5. Verification & Test Suite Results

| Test Suite / Tool | Command | Result | Details |
| :--- | :--- | :---: | :--- |
| **Onboarding & Auth Tests** | `node scripts/verify-onboarding-and-auth.mjs` | **PASS** | Added Test 9 verifying OAuth callback invariants, race condition immunity, and post-auth routing logic. |
| **All Test Suites** | `npm run test:all` | **PASS** | 5 verification suites passed: RPC consistency (12/12), Excel export sanitization, Auth export, Backend hardening. |
| **Linter** | `npm run lint` | **PASS** | 119 files scanned. **0 errors**. |
| **Production Build** | `npm run build` | **PASS** | Clean build (`tsc -b && vite build`) generated in 2.70s. |

---

## 6. Required Action for Human Verification

> [!IMPORTANT]
> **Account Linking in Supabase Auth**:
> If the administrator or student signs in using a Google account whose email already exists in `auth.users` under the `email` provider (e.g. `vittala.t1@gmail.com`), Supabase by default will prevent automatic account linking unless enabled.
> 
> In **Supabase Dashboard** → **Authentication** → **Providers** → **Google**:
> Ensure that **"Allow unverified email linking"** or manual account linking is enabled if administrators intend to sign in interchangeably via both password and Google OAuth with the same email address.
> 
> For new students signing in with Google for the first time, account creation is fully enabled and will route them directly to `/onboarding`.

---

## 7. Next Step

All code fixes are in place, verified locally, and ready to be committed and deployed to Vercel upon your approval.
Migrations on the production database remain untouched (Stage 4 has not been executed).

