# Phase 16 — Final Quality & Regression Test Report (Reconciled & Corrected)

**Platform:** Coders Club University Web Platform  
**Target Institution:** Kishkinda University  
**Audit Scope:** Full Application Stack (Frontend, Auth, Routing, Staging DB, Accessibility, Production Catalog)  
**Date:** October 31, 2026 (Phase 16.2 Final Accuracy Corrections)  
**Final Assessment:** **VERIFIED WITH LIMITATIONS**

---

## 1. Test Execution Matrix Summary

| Test Domain | Suites Executed | Scope / Target | Total Checks | PASS | FAIL | QUALIFIED |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Academic & Onboarding Persistence** | `scripts/verify-onboarding-and-auth.mjs` | In-Memory Unit | 9 Invariant Groups | 9 | 0 | 0 |
| **RPC & Migration Consistency** | `scripts/verify-rpc-consistency.mjs` | Static AST Audit | 12 RPC Signatures | 12 | 0 | 0 |
| **Excel Export & Formula Sanitization** | `scripts/verify-excel.mjs` | In-Memory ExcelJS | 13 Assertions | 13 | 0 | 0 |
| **Auth Concurrency & Data Isolation** | `scripts/verify-auth-export.mjs` | In-Memory Unit | 8 Assertions | 8 | 0 | 0 |
| **Backend & Schema Security Definitions** | `scripts/verify-backend.mjs` | Static Schema Audit | 38 Schema Checks | 38 | 0 | 0 |
| **Comprehensive Regression Suite** | `scripts/verify-full-regression.mjs` | Static File & Route Audit | 15 Check Groups | 15 | 0 | 0 |
| **Adversarial Database Security** | `scripts/verify-supabase-staging.mjs` | **Staging Environment Only** | 56 Live Attack Scenarios | 56 | 0 | 0 |
| **Live Production Catalog Verification** | `npx supabase db query --linked` | **Production Read-Only** | 12 Migrations, 14 Tables | 14 | 0 | 0 |
| **Function Definition Parity (MD5)** | `pg_get_functiondef(oid)` query | Staging vs Production | 18 PostgreSQL Functions | 17 match | 0 | 1 differs (Mig 12) |
| **Production Auth Rate Limits & CAPTCHA**| Supabase Dashboard Inspection | Production (`lqlokvzvfccrarjmdvcv`) | Rate limits (8 settings verified; CAPTCHA unverified) | 8 verified | 0 | **VERIFIED — DASHBOARD CONFIGURATION INSPECTED** |
| **Color Contrast Verification** | `scripts/compute-contrast.mjs` | WCAG SC 1.4.3 / 1.4.6 | 38 Color Pairs | 38 | 0 | 0 (Contrast only) |
| **TypeScript Strict Validation** | `npx tsc --noEmit` | Whole Project | Full Project Build | PASS | 0 | 0 |
| **Static Code Quality & Linter** | `npm run lint` (`oxlint`) | 119 Source Files | Full Source Lint | PASS | 0 | 0 (17 info notices) |
| **Production Production Build** | `npm run build` (`vite build`) | Client Bundle | 2,576 Modules | PASS | 0 | 0 |

---

## 2. Key Audit Qualifications & Reconciliations

### 2.1 Authentication & Credential Stuffing Claims
- **Reported Claim**: "Client-side brute force lockout (60-second cooldown after 5 failed attempts) protects against credential stuffing."
- **Reconciled Fact**: The 60-second cooldown in `SignIn.tsx` and `AdminLogin.tsx` is stored in volatile React component state (`useState(0)`). It is a **client-side UX throttle** against accidental rapid clicks by human users. It is component-local and can be bypassed by refreshing the page or submitting direct API requests. It provides zero protection against automated credential stuffing targeting Supabase Auth REST endpoints (`/auth/v1/token`).
- **Enforcement Locus**: Protection against credential stuffing and brute force is enforced by Supabase Auth (GoTrue) server-side IP rate limits.
- **Production Dashboard Verification**: Direct inspection of the production Supabase Dashboard (`Authentication -> Rate Limits`) confirms configured live values:
  - Email sending: **2 emails/hour**
  - SMS sending: **30 SMS/hour**
  - Token refreshes: **150 requests/5 min/IP**
  - Token verifications: **30 requests/5 min/IP**
  - Anonymous sign-ins: **30 requests/hour/IP**
  - Sign-ups and sign-ins: **30 requests/5 min/IP**
  - Web3 sign-ups and sign-ins: **30 requests/5 min/IP**
  - Minimum email interval per user: **60 seconds**
- **Status**: **`VERIFIED — DASHBOARD CONFIGURATION INSPECTED`**.
- **Important Inherent Limitations**: The dashboard screenshot verifies configured dashboard settings only. It does not prove the effectiveness of all abuse-prevention mechanisms or guarantee that every authentication attack (such as low-and-slow distributed credential stuffing across rotating residential IPs) is mitigated. Furthermore, CAPTCHA / Bot Protection resides under a distinct configuration section and remains **NOT VERIFIED**. Generic authentication error messages reduce account-enumeration information disclosure but do not prove constant-time execution.

### 2.2 Generic Authentication Error Messages
- **Reported Claim**: Generic error messages are constant-time.
- **Reconciled Fact**: The frontend displays a generic error message (`Email or password is incorrect.`) to **reduce account-enumeration information disclosure**. It does **not** provide constant-time execution guarantees against side-channel timing analysis.

### 2.3 Asynchronous Session Restoration (`getSession()`)
- **Reported Claim**: `getSession()` executes synchronously during initial load.
- **Reconciled Fact**: `supabase.auth.getSession()` is **asynchronous** and returns a Promise. AuthContext initializes `loading: true` so that all protected route guards and UI components wait for session restoration before evaluating authentication status, preventing premature redirect loops.

### 2.4 Table & RLS Inventory Reconciliation
- **Reported Claim**: "8 RLS-enabled tables."
- **Reconciled Fact**: Direct live queries against both staging and production confirm **14 BASE TABLES and 1 VIEW** in schema `public`. All 14 base tables have `relrowsecurity: true` (RLS enabled). Table list: `_backfill_quarantined_accounts`, `admin_roles`, `announcements`, `consents`, `contact_messages`, `contact_rate_limit`, `events`, `export_log`, `feedback`, `gallery_items`, `profiles`, `projects`, `registrations`, `team_members`, and view `events_public`.

### 2.5 Migration & Function Parity Reconciliation
- **Production (`lqlokvzvfccrarjmdvcv`)**: Exactly 12 migrations applied (100% sync with repository migration files).
- **Staging (`vtmyxjodfhdixhpoxcoj`)**: 11 migrations applied; migration `20261031070000_kishkinda_usn_format.sql` is pending on staging.
- **Function Definitions**: 17 of 18 functions have 100% identical cryptographic hashes (`md5(pg_get_functiondef(oid))`). Exactly one function differs: `complete_student_onboarding`, where production enforces the official Kishkinda University USN regex pattern introduced in Migration 12.

### 2.6 Staging Versus Production Test Delineation
- **Adversarial Security Suite (56 checks)**: Executed exclusively against the isolated **Staging project** (`vtmyxjodfhdixhpoxcoj`). The test suite contains an explicit gate halting execution if targeted against production.
- **Production Verification**: Confirmed via safe, read-only SQL queries via the Supabase Management API (`npx supabase db query --linked --project-ref lqlokvzvfccrarjmdvcv`), proving catalog, RLS, function, ACL, trigger, and constraint parity.

### 2.7 Transitive Dependency Advisory (`minimatch`)
- **Reported Issue**: GHSA-g3hv-75wg-m249 (`minimatch <11.0.1` via `exceljs -> archiver -> glob`).
- **Verified Status**: `minimatch` is a Node.js dependency of `archiver` and `unzipper`. In Vite client distribution, `exceljs` specifies `"browser": "./dist/exceljs.min.js"`. `minimatch` is **not bundled into client code** (`dist/` contains 0 instances). No user input reaches any glob matching code.

### 2.8 Accessibility Scope
- **Reported Claim**: Complete WCAG Compliance.
- **Reconciled Scope**: Verified for **WCAG 2.1 Success Criteria 1.4.3 & 1.4.6 (Color Contrast)** across 38 design token pairs in Light and Dark modes. Full end-to-end WCAG compliance (assistive technology certification, screen reader audits) remains an ongoing operational practice.

---

## 3. Final Recommendation & Assessment

### Rating: **VERIFIED WITH LIMITATIONS**

The Coders Club University application is functionally stable, structurally sound, and production-deployed with zero regressions. All critical invariants (Kishkinda USN compliance, atomic registration concurrency locks, SECURITY DEFINER search path isolation, and open redirect defenses) are verified. The rating is designated **VERIFIED WITH LIMITATIONS** to accurately reflect that while server-side rate limits are confirmed via dashboard inspection (30 req/5 min/IP), CAPTCHA remains unverified, configured settings do not guarantee mitigation against all distributed attacks, staging is one migration behind production, and accessibility is contrast-verified rather than comprehensively certified.
