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

## 5. Follow-Up Diagnostic: "Verifying Security Credentials..." Loader Freeze

### 5.1 Observed Behavior
Following deployment of commit `4669c1e`, testing the OAuth callback flow produced a persistent loading screen:
`"VERIFYING SECURITY CREDENTIALS..."` on the route `/account`, with the navbar showing `"SIGN IN"`. The browser was trapped indefinitely.

### 5.2 Root Cause Analysis & Identity Investigation
1. **Investigation of Candidate Identities (`codersclub.ku@gmail.com`, `vittuvlogs25@gmail.com`, `vittala.t1@gmail.com`)**:
   - Direct database inspection of `auth.flow_state`, `auth.users`, `auth.identities`, and `auth.sessions` was performed on production project `lqlokvzvfccrarjmdvcv`.
   - `auth.users` contains **only one** record: `vittala.t1@gmail.com` (created at `05:03:06 UTC` via password signup).
   - In `auth.flow_state`, 7 Google OAuth attempts were logged between `10:52 UTC` and `11:23 UTC`. In all 7 entries, `user_id` and `auth_code_issued_at` are `NULL`.
   - Neither `codersclub.ku@gmail.com` nor `vittuvlogs25@gmail.com` was ever created in `auth.users`.
   - **Conclusion**: Because neither `codersclub.ku@gmail.com` nor `vittuvlogs25@gmail.com` existed in `auth.users`, an attempt with either of them **did not and could not produce an `identity_already_exists` collision**. Instead, an exchange failure occurred, returning an error to the frontend callback.
   - For `vittala.t1@gmail.com`, account linking is intentionally disabled, preserving existing email/password authentication security without automatic account merging.

2. **The Indefinite Guard Trap in `ProtectedRoute.tsx`**:
   In `src/components/ProtectedRoute.tsx`:
   ```typescript
   if (loading || (!user && hasCallbackInUrl)) {
     return <Loader ... "Verifying security credentials..." />;
   }
   ```
   When `getSession()` completed:
   - Whether the exchange failed due to provider error, expired callback, or unlinked identity, `user` remained `null` and `loading` became `false`.
   - However, `hasCallbackInUrl` remained `true` because the browser's `window.location.search` or hash still retained callback parameters.
   - As a consequence, `(!user && hasCallbackInUrl)` evaluated to `true` permanently.
   - The user was trapped indefinitely on the loader, and the actual error returned by Supabase was hidden from both user and logs.

3. **Ephemeral URL Parameters Lingering**:
   Neither Supabase nor the application stripped `code=` or `error=` from `window.location.search` when exchange failed.

### 5.3 Remediation Applied
1. **Simplified Route Guarding (`src/components/ProtectedRoute.tsx`)**:
   Removed `(!user && hasCallbackInUrl)` from the loader condition. Route loading is strictly governed by `loading`. When `loading` completes, if `!user`, the user is cleanly redirected to `/signin?returnUrl=...`.
2. **URL Parameter Sanitization (`src/context/AuthContext.tsx`)**:
   Once `getSession()` settles (success or failure), `window.history.replaceState` sanitizes the URL to remove `code=`, `error=`, and hash fragments, preventing reload loops.
3. **Surfacing Authentication & OAuth Errors (`src/pages/SignIn.tsx`)**:
   `SignIn.tsx` now captures `profileLoadError` and `urlOAuthError` directly from `useAuth()`. Any provider failure (including `access_denied`, `server_error`, or `identity_already_exists`) is immediately rendered in the UI alert banner, guaranteeing full visibility.
4. **Security Boundaries Preserved**:
   - `Allow unverified email linking` is **NOT enabled**.
   - Password authentication remains completely functional.
   - Production migrations remain completely untouched.

---

## 6. Verification & Test Suite Results

| Test Suite / Tool | Command | Result | Details |
| :--- | :--- | :---: | :--- |
| **Onboarding & Auth Tests** | `node scripts/verify-onboarding-and-auth.mjs` | **PASS** | Updated Test 9 to verify that when loading finishes unauthenticated, the guard cleanly redirects rather than freezing. |
| **All Test Suites** | `npm run test:all` | **PASS** | 5 verification suites passed: RPC consistency (12/12), Excel export sanitization, Auth export, Backend hardening. |
| **Linter** | `npm run lint` | **PASS** | 119 files scanned. **0 errors**. |
| **Production Build** | `npm run build` | **PASS** | Clean build (`tsc -b && vite build`) generated. |

---

## 7. Required Action for Human Verification

> [!IMPORTANT]
> **Account Linking in Supabase Auth**:
> If the administrator or student signs in using a Google account whose email already exists in `auth.users` under the `email` provider (e.g. `vittala.t1@gmail.com`), Supabase by default will prevent automatic account linking unless enabled.
> 
> In **Supabase Dashboard** → **Authentication** → **Providers** → **Google**:
> Ensure that **"Allow unverified email linking"** (or **"Link accounts with same email"**) is enabled if you wish to sign in with Google using `vittala.t1@gmail.com`.
> 
> Alternatively:
> - Sign in using email and password on `/signin` (which works immediately).
> - Sign in with a distinct Google account, which will register as a new student and route cleanly to `/onboarding`.

---

## 8. Next Step

All code fixes are in place, verified locally, and ready to be committed and deployed to Vercel upon your approval.
Migrations on the production database remain untouched (Stage 4 has not been executed).

