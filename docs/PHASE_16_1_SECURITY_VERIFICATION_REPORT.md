# Phase 16.1 — Security Claims Verification & Production Readiness Reconciliation Report

**Platform:** Coders Club University Web Platform  
**Target Institution:** Kishkinda University  
**Auditor:** Automated Agentic Verification Engine  
**Date:** October 31, 2026  
**Final Assessment:** **`VERIFIED WITH LIMITATIONS`**

---

## 1. Authentication Security & Credential Stuffing Reconciliation

### 1.1 Implementation Locus
The 60-second cooldown after 5 failed login attempts is implemented exclusively on the client side in two React components:
1. [`src/pages/SignIn.tsx`](file:///c:/CC%20Website/src/pages/SignIn.tsx#L32-L33) (lines 32–33, 61–67, 124–133)
2. [`src/pages/admin/AdminLogin.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminLogin.tsx#L14-L15) (lines 14–15, 19–25, 42–50)

Both components manage lockout using local, component-level React state:
```tsx
const [failCount, setFailCount] = useState(0);
const [lockoutSeconds, setLockoutSeconds] = useState(0);
```

### 1.2 Bypass Feasibility
The client-side cooldown **can be completely bypassed** with minimal effort:
- **Browser Refresh**: Simply pressing `F5` or navigating away and returning resets `failCount` and `lockoutSeconds` to 0.
- **Incognito / Storage Clearance**: The state is volatile and not stored in localStorage or cookies; opening a new tab or clearing memory resets it.
- **Direct HTTP Requests**: Automated attackers do not interact with React DOM elements. Any automated credential stuffing or dictionary attack issues direct HTTP POST requests to the Supabase Auth endpoint:
  ```http
  POST https://lqlokvzvfccrarjmdvcv.supabase.co/auth/v1/token?grant_type=password
  Content-Type: application/json
  apikey: <anon_key>

  {"email":"victim@kishkindauniversity.edu.in","password":"password123"}
  ```
  These requests bypass the React frontend entirely.

### 1.3 Server-Side Enforcement (GoTrue)
True protection against credential stuffing, brute force, and account enumeration is enforced solely at the Supabase Auth (GoTrue) server tier:
- **IP Rate Limits**: Supabase GoTrue applies default rate limiting (30 requests/minute per IP address on `/auth/v1/token`).
- **Timing-Safe Responses**: The frontend maps authentication failures to a constant generic string (`Email or password is incorrect.`), preventing user enumeration.
- **Supabase Dashboard Controls**: Production administrators can configure CAPTCHA (hCaptcha / Turnstile) and adjust rate limits in the Supabase Management Console (`Authentication -> Protection -> Rate Limits`).

### 1.4 Reconciliation Summary
The claim in the earlier report that "Client-side brute force lockout (60-second cooldown after 5 failed attempts) protects against credential stuffing" was **inaccurate and misleading**. It is a **client-side UX throttle** designed to prevent accidental multiple submissions by human users. It has been reclassified as such across all audit documentation.

---

## 2. Database Inventory Reconciliation (Staging vs. Production)

Live, read-only SQL queries were executed against both the linked Staging project (`vtmyxjodfhdixhpoxcoj`) and the live Production project (`lqlokvzvfccrarjmdvcv`) via `npx supabase db query --linked`.

### 2.1 Table & View Inventory

The public schema contains **14 BASE TABLES and 1 VIEW** across both environments (not 8 tables as previously stated):

| Database Object Name | Object Type | Staging (`vtmyxjodfhdixhpoxcoj`) | Production (`lqlokvzvfccrarjmdvcv`) | RLS Enabled (`relrowsecurity`) | Forced (`relforcerowsecurity`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `_backfill_quarantined_accounts` | BASE TABLE | Present | Present | `true` | `false` |
| `admin_roles` | BASE TABLE | Present | Present | `true` | `false` |
| `announcements` | BASE TABLE | Present | Present | `true` | `false` |
| `consents` | BASE TABLE | Present | Present | `true` | `false` |
| `contact_messages` | BASE TABLE | Present | Present | `true` | `false` |
| `contact_rate_limit` | BASE TABLE | Present | Present | `true` | `false` |
| `events` | BASE TABLE | Present | Present | `true` | `false` |
| `export_log` | BASE TABLE | Present | Present | `true` | `false` |
| `feedback` | BASE TABLE | Present | Present | `true` | `false` |
| `gallery_items` | BASE TABLE | Present | Present | `true` | `false` |
| `profiles` | BASE TABLE | Present | Present | `true` | `false` |
| `projects` | BASE TABLE | Present | Present | `true` | `false` |
| `registrations` | BASE TABLE | Present | Present | `true` | `false` |
| `team_members` | BASE TABLE | Present | Present | `true` | `false` |
| `events_public` | VIEW | Present | Present | View | View |

- **RLS Status**: 100% of base tables have `relrowsecurity: true`. None have `relforcerowsecurity: true`, which is standard for Supabase configurations where the `service_role` and table owners can bypass RLS during migrations.

### 2.2 Applied Migrations

| Migration Version | Description | Local Repo | Staging Status | Production Status | Parity Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `20261020000000` | Base schema & public tables | Yes | Applied | Applied | Match |
| `20261021000000` | Student accounts & export log | Yes | Applied | Applied | Match |
| `20261021120000` | Integrity & security hardening | Yes | Applied | Applied | Match |
| `20261023000000` | Team members table | Yes | Applied | Applied | Match |
| `20261028000000` | Feedback table | Yes | Applied | Applied | Match |
| `20261031000000` | Profile & consent invariants | Yes | Applied | Applied | Match |
| `20261031020000` | Security definer & helper hardening | Yes | Applied | Applied | Match |
| `20261031030000` | Forward profile & consent hardening | Yes | Applied | Applied | Match |
| `20261031040000` | Role permissions & grants | Yes | Applied | Applied | Match |
| `20261031050000` | Fix coalesce in hardened functions | Yes | Applied | Applied | Match |
| `20261031060000` | Fix trim in hardened functions | Yes | Applied | Applied | Match |
| `20261031070000` | Kishkinda University USN format | Yes | **PENDING** | **Applied** | **Staging is 1 migration behind** |

**Root Cause of Difference**: Migration `20261031070000` was deployed directly to Production during Phase 15 to enforce the official Kishkinda University USN format (e.g. `KUB24CSE198`). Staging was kept in a frozen test state and was not pushed. Consequently, production contains the updated USN format check constraint, whereas staging retains the pre-migration-12 pattern.

### 2.3 Functions, Permissions & Triggers
- **Functions**: Exactly 18 functions exist on both Staging and Production.
- **SECURITY DEFINER & Search Path**: All 18 functions are `SECURITY DEFINER` and have `SET search_path = ''` (`proconfig = ["search_path=\"\""]`), preventing search_path hijacking attacks.
- **Function ACLs**: 100% parity across all 18 functions. Internal trigger functions have execution revoked from all roles except `postgres`. RPCs are granted to `authenticated` and `service_role` only. Anonymous access is revoked from all RPCs except `get_public_events`.
- **Triggers**: Exactly 4 triggers on 3 tables (`contact_messages`, `profiles`, `registrations`) are identical on both Staging and Production.
- **RLS Policies**: Exactly 26 RLS policies exist on both Staging and Production with matching expressions.

---

## 3. Production Versus Staging Security Testing

The testing performed in Phase 16 has been carefully reconciled to distinguish staging tests from production verification:

1. **Adversarial Security Test Suite (`scripts/verify-supabase-staging.mjs`)**:
   - **Target**: Executed **EXCLUSIVELY against Staging** (`vtmyxjodfhdixhpoxcoj`).
   - **Production Isolation Guard**: The script contains a mandatory safety gate:
     ```js
     if (supabaseUrl.toLowerCase().includes(PROD_PROJECT_REF.toLowerCase())) {
       process.stderr.write('CRITICAL SECURITY VIOLATION: Remote tests attempted against production!\n');
       process.exit(1);
     }
     ```
   - **Findings**: All 56 adversarial attack checks passed on Staging (bypassing capacity, cross-student updates, USN mutation, unauthenticated reads). **Zero adversarial tests were run against Production**.
2. **Production Database Verification**:
   - In Phase 16.1, safe **read-only SQL introspection queries** were executed directly against Production (`lqlokvzvfccrarjmdvcv`) via `npx supabase db query --linked --project-ref lqlokvzvfccrarjmdvcv`.
   - **Verified on Production**: All 12 migrations applied, all 14 tables have RLS enabled, all 18 functions have empty search paths and revoked anon privileges, all 4 triggers and 26 RLS policies match.

---

## 4. Google OAuth PKCE Verification

The Google OAuth implementation was reviewed and verified across all key requirements:

1. **Authorization Code Exchange (PKCE)**:
   - Supabase client initialized with `detectSessionInUrl: true` and `persistSession: true`.
   - `AuthContext.tsx` invokes `supabase.auth.getSession()` on mount. Supabase Auth handles the PKCE authorization code exchange (`/auth/v1/token?grant_type=pkce`) and populates session tokens.
2. **Callback Error Handling**:
   - URL search parameters and hash fragments are inspected for `error` and `error_description`.
   - Errors are decoded and rendered in user-friendly alerts. If an identity conflict occurs (e.g. email already registered via password), `SignIn.tsx` specifically informs the user: `"An account with this email address already exists. Please sign in using your email and password."`
3. **Session Restoration & Race Condition Defense**:
   - Cleaned ephemeral query parameters via `window.history.replaceState({}, document.title, window.location.pathname)`.
   - Operations are tagged with `authOpRef.current` and `mountedRef.current` counters to discard stale or out-of-order asynchronous responses.
4. **Open Redirect Defense**:
   - In `src/lib/validation.ts`, `isSafeRedirectPath` and `sanitizeRedirectPath` enforce that all redirect paths start with a single `/`, do not start with `//` or `/\\`, do not contain backslashes, and do not contain protocol schemes.
   - External return paths (e.g. `https://evil.com` or `//evil.com`) are sanitized to `/account`.

---

## 5. Transitive Dependency Advisory (`minimatch`)

The npm audit advisory regarding `minimatch <11.0.1` (GHSA-g3hv-75wg-m249) was investigated through the physical dependency graph and build artifacts:

### 5.1 Dependency Path
```
cc-website (root)
└── exceljs@4.4.0
    ├── archiver@5.3.2
    │   ├── archiver-utils@2.1.0 -> glob@7.2.3 -> minimatch@3.1.5
    │   ├── zip-stream@4.1.1 -> archiver-utils@3.0.4 -> glob@7.2.3 -> minimatch@3.1.5
    │   └── readdir-glob@1.1.3 -> minimatch@5.1.9
    └── unzipper@0.10.14
        └── fstream@1.0.12 -> rimraf@2.7.1 -> glob@7.2.3 -> minimatch@3.1.5
```

### 5.2 Technical Evidence & Bundle Inspection
1. **Not Bundled in Client Application**: In `node_modules/exceljs/package.json`, the `"browser"` entry point is defined as `"./dist/exceljs.min.js"`. When Vite bundles `exceljs`, it resolves this pre-compiled browser distribution.
2. **Bundle Content Verification**: Inspection of `node_modules/exceljs/dist/exceljs.min.js` and the production output directory `dist/` confirms **zero instances of `minimatch` or `readdir-glob`**.
3. **Exploitability**: The vulnerability in `minimatch` involves Denial of Service through globparts amplification when compiling untrusted user glob patterns. Because `minimatch` is never loaded into the client bundle and no server-side Node.js process runs `exceljs` on user input, this advisory represents **zero runtime risk** to the application.
4. **Remediation Recommendation**: `exceljs@4.4.0` is the latest available release. Forcing an update via `npm audit fix --force` would downgrade `exceljs` to `4.1.1` (a breaking change). Overriding `minimatch` across Node toolchains is unnecessary and risks breaking CLI scripts.

---

## 6. Accessibility Scope & Contrast Audit Reconciliation

The audit verified 38 design token color pairs across Light and Dark modes against WCAG 2.1 contrast formulas via [`scripts/compute-contrast.mjs`](file:///c:/CC%20Website/scripts/compute-contrast.mjs).

### Reconciled Finding
- **Verified Scope**: **Color Contrast Only** (WCAG 2.1 Success Criteria 1.4.3 Level AA and 1.4.6 Level AAA). All 38 color token pairs meet or exceed target ratios (ranging from 4.75:1 to 16.82:1 for body text).
- **Qualification**: This is **not a proof of complete WCAG compliance**. Complete WCAG 2.1 Level AA certification requires additional evaluations including screen reader testing (NVDA, JAWS, VoiceOver), keyboard focus order, aria-live region announcements, and non-text visual indicators.

---

## 7. Final Assessment & Next Steps

### Verdict: **`VERIFIED WITH LIMITATIONS`**

#### Summary of Qualifications:
1. **Credential Stuffing**: Handled by Supabase Auth (GoTrue) IP rate limits; the frontend 60s cooldown is a UX throttle.
2. **Staging vs. Production Sync**: Production has all 12 migrations applied. Staging has 11 applied (migration 12 pending).
3. **Adversarial Testing**: The 56 live adversarial scenarios were executed on Staging. Production security was verified through safe read-only SQL introspection.
4. **Dependency Advisory**: `minimatch` is confirmed absent from production client bundles.
5. **Accessibility**: Formally verified for color contrast standards; complete assistive technology testing is recommended as part of routine ongoing QA.

All functionality, OAuth flows, and production security postures are stable and operational. Awaiting explicit user approval before performing any git commits, pushes, or deployments.

