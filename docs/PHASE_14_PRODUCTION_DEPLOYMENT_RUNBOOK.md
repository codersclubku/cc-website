# Phase 14 — Production Deployment Runbook

**Project**: Coders Club University Website & Backend  
**Production Project ID**: `lqlokvzvfccrarjmdvcv`  
**Production URL**: `https://lqlokvzvfccrarjmdvcv.supabase.co`  
**Production Domain**: `https://codersclubku.vercel.app/`  
**Document Classification**: Restricted Operations Runbook  
**Target Audience**: Lead Engineer, University Club Coordinator, Database Administrator  

---

> [!CAUTION]
> **Controlled Deployment Mandate**:
> Every command in this runbook is explicitly tagged with `[READ-ONLY]` or `[MUTATING]`. 
> Do **NOT** execute any mutating command without written authorization from the University Club Coordinator and Lead Engineer.

---

## 1. Pre-Deployment Checklist

Before initiating production deployment, confirm that each of the following conditions is satisfied:

- [ ] **Phase 12 Adversarial Audit Verified**: 56/56 checks passed on isolated staging (`vtmyxjodfhdixhpoxcoj`).
- [ ] **Phase 13 Release Review Verified**: Codebase and schema classified as READY WITH CONDITIONS.
- [ ] **Zero Uncommitted Secrets**: Repository `.gitignore` verified to block `.env`, `.env.*`, and `*.local`.
- [ ] **Local Regression Suites Passing**: `npm run test:all` (58/58 PASS), `npm run lint` (0 errors), `npm run build` (PASS).
- [ ] **Maintenance Window Scheduled**: 30-minute operational window with designated rollback point.
- [ ] **Production Access Credentials Secure**: Production database password, Supabase service-role key, and Vercel project admin access stored securely in team password manager.

---

## 2. Required Approvals & Stakeholder Sign-Off

| Role | Name | Responsibilities | Sign-Off Status |
| :--- | :--- | :--- | :---: |
| **Lead Developer** | Technical Lead | Code integrity, migration sequence, test evidence | Pending Review |
| **Club Coordinator** | University Coordinator | Administrative authorization, user access approval | Pending Review |
| **Faculty Advisor** | Faculty In-Charge | DPDP Act 2023 privacy compliance sign-off | Pending Review |

---

## 3. Git Staging & Commit Procedure

### 3.1 Verify Clean Environment `[READ-ONLY]`
Confirm that no untracked secrets or temporary directories are exposed:

```bash
# PowerShell [READ-ONLY]
git status
git check-ignore -v .env.staging.local
```
Expected output: `.env.staging.local` must report as ignored.

### 3.2 Add Authorized Production Artifacts `[MUTATING - LOCAL GIT]`
Stage exclusively the required migration files, application components, and verification suites. Do **NOT** run `git add .` blindly.

```bash
# PowerShell [MUTATING - LOCAL GIT]
# 1. Core Application & Onboarding
git add src/App.tsx src/components/ProtectedRoute.tsx src/context/AuthContext.tsx src/pages/Onboarding.tsx src/pages/Register.tsx src/pages/SignIn.tsx src/pages/SignUp.tsx src/pages/admin/AdminEvents.tsx src/lib/api.ts src/lib/validation.ts

# 2. Database Migrations & Consolidated Schema
git add supabase/migrations/20261020000000_base_schema.sql supabase/migrations/20261031000000_profile_and_consent_invariants.sql supabase/migrations/20261031020000_security_definer_and_helper_hardening.sql supabase/migrations/20261031030000_profile_and_consent_forward_hardening.sql supabase/migrations/20261031040000_role_permissions_and_service_role_grants.sql supabase/migrations/20261031050000_fix_coalesce_in_hardened_functions.sql supabase/migrations/20261031060000_fix_trim_in_hardened_functions.sql supabase/schema.sql

# 3. Environment Templates & Documentation
git add .env.example .env.staging.example .gitignore README.md TECHNICAL_OVERVIEW.md package.json docs/STAGING_DEPLOYMENT.md docs/PHASE_13_FINDINGS.md docs/PHASE_13_RELEASE_READINESS_REPORT.md docs/PHASE_14_PRODUCTION_DEPLOYMENT_RUNBOOK.md docs/PHASE_14_DEPLOYMENT_PREFLIGHT_REPORT.md

# 4. Verification & QA Tools
git add scripts/audit-routes.mjs scripts/cleanup-test-data.mjs scripts/generate-function-inventory.mjs scripts/verify-backend.mjs scripts/verify-onboarding-and-auth.mjs scripts/verify-rpc-consistency.mjs scripts/verify-staging-catalog.sql scripts/verify-supabase-staging.mjs docs/qa/
```

### 3.3 Commit and Push to Main `[MUTATING - REMOTE GIT]`
```bash
# PowerShell [MUTATING - REMOTE GIT]
git commit -m "feat(release): Phase 14 production readiness deployment baseline"
git push origin main
```

---

## 4. Production Database Migration Sequence

### 4.1 Step 1: Preflight Verification `[READ-ONLY]`
Confirm target project reference and verify zero migrations currently applied to production:

```bash
# PowerShell [READ-ONLY]
npx supabase migration list --project-ref lqlokvzvfccrarjmdvcv
```
*Expected Result*: All 11 migrations report `local: <timestamp>`, `remote: ""`.

### 4.2 Step 2: Link Production Project `[MUTATING - CLI STATE]`
Authenticate the Supabase CLI with the production project:

```bash
# PowerShell [MUTATING - CLI STATE]
npx supabase link --project-ref lqlokvzvfccrarjmdvcv
```
When prompted, provide the **production database password** securely.

### 4.3 Step 3: Apply Sequential Migrations `[MUTATING - PRODUCTION DATABASE]`
Deploy the full 11-migration chain to production:

```bash
# PowerShell [MUTATING - PRODUCTION DATABASE]
npx supabase db push
```

> [!CAUTION]
> **Never Run `db reset` on Production**:
> `npx supabase db reset` drops the entire database. Only `npx supabase db push` is permitted.

### 4.4 Step 4: Verify Migration History `[READ-ONLY]`
Confirm that all 11 migrations report `Remote: Yes`:

```bash
# PowerShell [READ-ONLY]
npx supabase migration list --linked
```
*Expected Result*: Exactly 11 rows displayed with matching local and remote timestamps.

### 4.5 Step 5: Execute Catalog Integrity Inspection `[READ-ONLY]`
Verify function hardening, search paths, and RLS policies on production:

```bash
# PowerShell [READ-ONLY]
npx supabase db query --linked -f scripts/verify-staging-catalog.sql
```
*Verification Invariants*:
- 18 functions report `is_security_definer = true` and `search_path = ''`.
- 14 tables report `RLS Active`.
- Direct student `INSERT` on `consents` and `registrations` is denied.

---

## 5. Google OAuth & Auth Configuration Procedure

All steps in this section are performed in the [Supabase Production Dashboard](https://supabase.com/dashboard/project/lqlokvzvfccrarjmdvcv).

### 5.1 Google Cloud Platform Console Configuration `[MUTATING - GCP]`
1. Navigate to **GCP Console** -> **APIs & Services** -> **Credentials**.
2. Edit the production OAuth 2.0 Client ID.
3. Configure:
   - **Authorized JavaScript origins**:
     - `https://codersclubku.vercel.app`
   - **Authorized redirect URIs**:
     - `https://lqlokvzvfccrarjmdvcv.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret.

### 5.2 Supabase Authentication Provider Setup `[MUTATING - SUPABASE]`
1. In Supabase Dashboard, go to **Authentication** -> **Providers**.
2. Select **Google** and toggle to **Enabled**.
3. Paste the **Client ID** and **Client Secret**.
4. Click **Save**.

### 5.3 Supabase URL Configuration `[MUTATING - SUPABASE]`
1. In Supabase Dashboard, go to **Authentication** -> **URL Configuration**.
2. Set **Site URL**:
   ```text
   https://codersclubku.vercel.app
   ```
3. In **Redirect URLs**, add:
   ```text
   https://codersclubku.vercel.app/**
   https://codersclubku.vercel.app/account
   ```
4. Click **Save**.

---

## 6. Vercel Production Environment Configuration

In the [Vercel Dashboard](https://vercel.com/) under Project Settings -> **Environment Variables**, configure the following production secrets:

| Variable | Target Value | Environment | Sensitivity |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://lqlokvzvfccrarjmdvcv.supabase.co` | Production | Public / Client |
| `VITE_SUPABASE_ANON_KEY` | `<production-anon-key>` | Production | Public / Client |
| `VITE_SITE_URL` | `https://codersclubku.vercel.app` | Production | Public / Client |
| `VITE_ALLOWED_EMAIL_DOMAIN` | `kishkindauniversity.edu.in` *(or leave empty for open student email)* | Production | Public / Client |

> [!WARNING]
> Never set `SUPABASE_SERVICE_ROLE_KEY` as a `VITE_` prefixed variable. Service role keys must NEVER be accessible to client browser bundles.

---

## 7. Initial Administrator Provisioning Procedure

Administrative roles are enforced by `public.admin_roles` and cannot be self-assigned via the client.

### Step 7.1: Coordinator First Login `[MUTATING - AUTH]`
1. Have the University Club Coordinator visit `https://codersclubku.vercel.app/signin`.
2. Sign in using their authorized university Google account.
3. This creates an authoritative record in `auth.users`.

### Step 7.2: Obtain User UUID `[READ-ONLY]`
In the Supabase Dashboard, navigate to **Authentication** -> **Users** and locate the coordinator's record. Copy their `User UID` (e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

### Step 7.3: Assign Administrator Role `[MUTATING - SQL]`
In the Supabase Dashboard **SQL Editor**, execute the single seed statement:

```sql
-- MUTATING: Assign initial super-administrator role
INSERT INTO public.admin_roles (user_id, role)
VALUES ('<coordinator-user-uuid>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Step 7.4: Validate Admin Privileges `[READ-ONLY]`
Have the coordinator navigate to:
```text
https://codersclubku.vercel.app/admin
```
Confirm the Admin Dashboard loads with access to Students, Events, Registrations, Check-in, and Feedback.

---

## 8. Post-Deployment Smoke Verification

Execute the following verification checklist against the live production deployment:

| Check | Action | Expected Result | Verified |
| :---: | :--- | :--- | :---: |
| 1 | Visit `https://codersclubku.vercel.app/` | Home page renders with 0 console errors | [ ] |
| 2 | Visit `https://codersclubku.vercel.app/events` | Published events list rendered from `events_public` | [ ] |
| 3 | Click "Sign In with Google" | Google consent screen displays; redirects to `/account` or `/onboarding` | [ ] |
| 4 | New Student Journey | Redirected to `/onboarding`; prefilled name; enters USN; accepts notice; submits | [ ] |
| 5 | USN Format Validation | Rejects invalid USN (`INVALID123`); accepts `KU2024CS001` or `2KA22CS001` | [ ] |
| 6 | USN Immutability | Subsequent profile edits block modification of USN | [ ] |
| 7 | Event Registration | Single-click registration issues QR pass with confirmation ID (`CC-YYYY-XXXX`) | [ ] |
| 8 | Duplicate Registration | Re-clicking registration displays existing QR ticket without creating duplicate | [ ] |
| 9 | Admin Portal Login | Non-admin redirected to `/admin/login`; Admin loads `/admin` dashboard | [ ] |
| 10 | Security Headers | `curl -I https://codersclubku.vercel.app/` reports HSTS, CSP, X-Frame-Options: DENY | [ ] |

---

## 9. Rollback & Incident Response Procedure

If an unexpected blocking issue occurs during deployment:

### 9.1 Scenario A: Frontend Routing or Client Defect
1. In the Vercel Dashboard, go to **Deployments**.
2. Locate the previous stable deployment.
3. Click **Instant Rollback**.
4. Traffic is instantly restored to the previous build within 5 seconds.

### 9.2 Scenario B: Database Schema Failure
Since all 11 migrations are 100% additive and non-destructive:
1. Roll back the client frontend deployment in Vercel to preserve user access.
2. In Supabase Dashboard, review error logs under **Database** -> **Postgres Logs**.
3. Formulate a forward remediation migration (e.g. `20261031070000_hotfix.sql`).
4. Validate the remediation on staging first: `node scripts/verify-supabase-staging.mjs`.
5. Deploy the forward migration: `npx supabase db push`.
6. **Rule**: Never run `db reset` on production.

---

## 10. Production Isolation Verification

Throughout this entire preparation phase:
- Target staging project: `vtmyxjodfhdixhpoxcoj`
- Production project reference: `lqlokvzvfccrarjmdvcv`
- Status: **0 migrations applied, 0 mutations executed, 100% isolated**.

