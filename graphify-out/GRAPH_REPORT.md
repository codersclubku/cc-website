# Graph Report - CC Website  (2026-10-31)

## Corpus Check
- 167 files · ~653,022 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .css 3, .example 2, (none) 2)

## Summary
- 1241 nodes · 2582 edges · 80 communities (71 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9927d349`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 3. Comprehensive Migration Safety Review (11 Files)
- useReducedMotion
- Home.tsx
- lucide-react
- MemberDialog.tsx
- package.json
- Technical Overview: Coders Club Web Platform & Administrative System
- verify-backend.mjs
- AdminStudents.tsx
- Register.tsx
- Staging Deployment & Verification Runbook
- Phase 13 — Production Release Readiness Review Report
- CursorProvider.tsx
- api.ts
- Skeleton.tsx
- Phase 14 — Production Deployment Runbook
- Architectural & Legal Analysis: Handling of Students Under 18 Under the DPDP Act 2023
- Home.tsx
- 2. Categorized Findings & Verifications
- ref_node_fs
- Phase 14 — Deployment Preflight & Reconciliation Report
- ref_child_process
- motion.ts
- compute-contrast.mjs
- .oxlintrc.json
- verify-halftone.mjs
- capture-team-page.mjs
- events.ts
- @supabase/supabase-js
- verify-feedback-ui.mjs
- ref_child_process
- postcss.config.js
- ref_path
- run-axe.mjs
- verify-halftone.mjs
- capture-team-page.mjs
- verify-team-dialog.mjs
- verify-team-dialog.mjs
- verify-onboarding-and-auth.mjs
- tsconfig.json
- vercel.json
- preview-link.md
- run
- generate-function-inventory.mjs
- verify-rpc-consistency.mjs
- pointerStore.ts
- verify-excel.mjs
- verify-full-regression.mjs
- useReducedMotion
- Phase 15 — Stage 3: Google OAuth Production Diagnostic & Remediation Report
- CursorProvider.tsx
- Google OAuth Production Verification & Launch Readiness Report
- AdminTableSkeleton
- 2. Stage-by-Stage Execution Record
- useReducedMotion
- Phase 16.1 — Security Claims Verification & Production Readiness Reconciliation Report
- ErrorBoundary
- AdminRegistrations.tsx
- SettingsMenu.tsx
- ProtectedRoute
- Phase 16 — Comprehensive Codebase Audit & Quality Stabilization Report (Reconciled & Corrected)
- 2. Key Audit Qualifications & Reconciliations
- 1. Item-by-Item Verification & Correction Matrix
- Legal Pages Implementation & Verification Report
- dependencies
- Skeleton.tsx
- AuthProvider
- EmptyState
- devDependencies
- AdminGallery.tsx
- scripts
- FeedbackModal.tsx
- Gallery.tsx
- AdminAnnouncements.tsx
- MockStorage
- PublicLayout
- Button.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 77 edges
2. `lucide-react` - 48 edges
3. `useReducedMotion()` - 47 edges
4. `App()` - 44 edges
5. `HairlineGrid()` - 43 edges
6. `useAuth()` - 40 edges
7. `react-router-dom` - 33 edges
8. `Alert()` - 30 edges
9. `Badge()` - 21 edges
10. `EmptyState()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `4. Legal Pages & URL Verification` --references--> `ProtectedRoute()`  [INFERRED]
  docs/GOOGLE_OAUTH_LAUNCH_READINESS.md → src/components/ProtectedRoute.tsx
- `FINDING-AUTH-01: Mandatory Student Onboarding Route Protection` --references--> `ProtectedRoute()`  [INFERRED]
  docs/PHASE_13_FINDINGS.md → src/components/ProtectedRoute.tsx
- `2. Audit Scope` --references--> `ProtectedRoute()`  [INFERRED]
  docs/PHASE_13_RELEASE_READINESS_REPORT.md → src/components/ProtectedRoute.tsx
- `6.2 Bypass Analysis` --references--> `ProtectedRoute()`  [INFERRED]
  docs/PHASE_13_RELEASE_READINESS_REPORT.md → src/components/ProtectedRoute.tsx
- `Root Cause 2: Premature Route Preemption in `ProtectedRoute.tsx`` --references--> `ProtectedRoute()`  [INFERRED]
  docs/PHASE_15_OAUTH_DIAGNOSTIC_REPORT.md → src/components/ProtectedRoute.tsx

## Import Cycles
- None detected.

## Communities (80 total, 9 thin omitted)

### Community 0 - "3. Comprehensive Migration Safety Review (11 Files)"
Cohesion: 0.07
Nodes (28): 1.1 Root Cause Analysis, 1.2 Remediated Read-Only Inspection Command, 1. Resolution of Phase 14 Inspection Failure, 2.1 Database Engine & Schemas, 2.2 Installed Extensions, 2.3 Public Tables & Views, 2.4 Existing Public Functions & Hardening Posture, 2.5 Row Counts & Pre-existing User Data (+20 more)

### Community 1 - "useReducedMotion"
Cohesion: 0.11
Nodes (35): About, Account, AdminAnnouncements, AdminCheckIn, AdminDashboard, AdminEvents, AdminFeedback, AdminGallery (+27 more)

### Community 2 - "Home.tsx"
Cohesion: 0.06
Nodes (53): vite, @vitejs/plugin-react, FeedbackStatusBadge(), FeedbackTypeBadge(), StatusBadgeProps, TypeBadgeProps, FeedbackForm(), FeedbackFormProps (+45 more)

### Community 3 - "lucide-react"
Cohesion: 0.08
Nodes (57): D. Route Registration & Access Verification, 2.1 Security & Auth Findings, lucide-react, react-router-dom, zod, Alert(), AlertProps, AlertType (+49 more)

### Community 4 - "MemberDialog.tsx"
Cohesion: 0.08
Nodes (49): Footer(), getInitials(), HalftoneAvatar(), HalftoneAvatarProps, parseColor(), smoothstep(), computeDotRadius(), createRng() (+41 more)

### Community 5 - "package.json"
Cohesion: 0.12
Nodes (16): name, overrides, uuid, private, type, version, autoprefixer, @axe-core/react (+8 more)

### Community 6 - "Technical Overview: Coders Club Web Platform & Administrative System"
Cohesion: 0.05
Nodes (39): 10.1 Five Technical Strengths, 10.2 Four Limitations & Areas to Improve, 10.3 Realistic Future Enhancements, 10.4 Five Interesting Technical Facts, 10. Challenges, Strengths & Future Scope, 11.1 Security Audit Matrix, 11.2 OWASP Top 10 (2021) Mapping, 11.3 Top 5 Recommended Security Improvements (+31 more)

### Community 7 - "verify-backend.mjs"
Cohesion: 0.25
Nodes (12): __dirname, extractAppTables(), __filename, localEnv, normalizeParams(), record(), results, run() (+4 more)

### Community 8 - "AdminStudents.tsx"
Cohesion: 0.07
Nodes (28): 1.1 Prerequisites, 1.2 Installation, 1.3 Quality Checks & Production Build, 1. Quickstart & Zero-Setup Run, 2. Environment Configuration, 3.1 Initial Setup, 3.2 Database Schema Overview, 3.3 Atomic Stored Procedures (+20 more)

### Community 9 - "Register.tsx"
Cohesion: 0.15
Nodes (25): QrTicket(), QrTicketProps, fetchEventById(), fetchEventBySlug(), fetchStudentRegistrations(), downloadIcsFile(), escapeText(), foldLine() (+17 more)

### Community 10 - "Staging Deployment & Verification Runbook"
Cohesion: 0.10
Nodes (19): 1. Provisioning a Supabase Staging Project, 2.1 Required Credentials, 2.2 Configuring Locally Without Exposing Secrets, 2. Environment Variables & Secret Handling, 3.1 Migration Sequence (8 Files), 3.2 Step 1: Link the Staging Project, 3.3 Step 2: Check Remote Migration Status, 3.4 Step 3: Apply Migrations (+11 more)

### Community 11 - "Phase 13 — Production Release Readiness Review Report"
Cohesion: 0.07
Nodes (26): 10.1 Accepted Non-Critical Risks, 10.2 Production Deployment Prerequisites, 10. Remaining Risks & Pre-Deployment Prerequisites, 11. Production Deployment Decision, 1. Executive Summary, 2. Audit Scope, 3.1 Migrations (`supabase/migrations/`), 3.2 Frontend Architecture & Components (+18 more)

### Community 12 - "CursorProvider.tsx"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 13 - "api.ts"
Cohesion: 0.08
Nodes (31): adminCheckInAttendee(), adminCheckInAttendeeByCodeOrUsn(), ApiError, cancelRegistration(), cancelStudentRegistration(), completeStudentOnboardingApi(), ConsentStatusResult, DbRegistration (+23 more)

### Community 14 - "Skeleton.tsx"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 15 - "Phase 14 — Production Deployment Runbook"
Cohesion: 0.07
Nodes (28): 10. Production Isolation Verification, 1. Pre-Deployment Checklist, 2. Required Approvals & Stakeholder Sign-Off, 3.1 Verify Clean Environment `[READ-ONLY]`, 3.2 Add Authorized Production Artifacts `[MUTATING - LOCAL GIT]`, 3.3 Commit and Push to Main `[MUTATING - REMOTE GIT]`, 3. Git Staging & Commit Procedure, 4.1 Step 1: Preflight Verification `[READ-ONLY]` (+20 more)

### Community 16 - "Architectural & Legal Analysis: Handling of Students Under 18 Under the DPDP Act 2023"
Cohesion: 0.06
Nodes (33): 10. Implementation and Rollout Plan (Upon User Approval), 11. Conclusion, 1. Executive Summary, 2.1 When and What Personal Data is Collected, 2.2 Inability to Distinguish Users Under 18, 2. Existing Implementation Findings, 3.1 Statutory Framework, 3.2 The Higher Education Conundrum (+25 more)

### Community 17 - "Home.tsx"
Cohesion: 0.10
Nodes (37): Accordion(), Badge(), BadgeProps, BadgeVariant, HeroSlideshow(), StaggerGrid(), StaggerGridProps, StaggerItem() (+29 more)

### Community 18 - "2. Categorized Findings & Verifications"
Cohesion: 0.08
Nodes (24): 1. Finding Severity Classification, 2.1 Database, Schema & Migration Integrity, 2.2 Authentication, Student Onboarding & Privacy (DPDP Act), 2.3 Event Workflows & Concurrency, 2.4 Administrative Authorization & Audit Logging, 2.5 Frontend, Environment & Dependencies, 2. Categorized Findings & Verifications, 3. Summary of Findings by Status (+16 more)

### Community 19 - "ref_node_fs"
Cohesion: 0.15
Nodes (5): @supabase/supabase-js, localEnv, localEnv, targetEmail, supabase

### Community 20 - "Phase 14 — Deployment Preflight & Reconciliation Report"
Cohesion: 0.08
Nodes (24): 1. Executive Summary, 2. Preflight Verification Status Matrix, 3.1 Migration File Inventory & SHA256 Checksums, 3.2 Reconciliation Findings, 3. Task 1: Migration History Reconciliation, 4.1 Sensitive File Audit, 4.2 Precise List of Files to Commit, 4. Task 2: Git Integrity & Staging Manifest (+16 more)

### Community 21 - "ref_child_process"
Cohesion: 0.22
Nodes (6): edgeProc, pageTarget, pending, results, userDataDir, ws

### Community 22 - "motion.ts"
Cohesion: 0.22
Nodes (6): edgeProc, pageTarget, pending, results, userDataDir, ws

### Community 23 - "compute-contrast.mjs"
Cohesion: 0.25
Nodes (7): 1. Identity & Naming, 2. Navigation & Information Architecture, 3. Roles & Hierarchy, 4. Status Labels & Tooltips, 5. Standard Action Verbs (Microcopy), 6. Formatting Conventions, Coders Club Kishkinda University — Brand & UX Glossary

### Community 24 - ".oxlintrc.json"
Cohesion: 0.25
Nodes (5): inner, svgContent, distDir, mimeTypes, server

### Community 25 - "verify-halftone.mjs"
Cohesion: 0.29
Nodes (6): 1. Executive Summary, 2. Route Navigation & CDP Audit Matrix, 3. Excel Export & Security Hardening Verification, 4. Backend Integrity & Security Definer Functions, Coders Club Web Platform & Supabase Backend, Quality Assurance & Verification Report

### Community 26 - "capture-team-page.mjs"
Cohesion: 0.43
Nodes (6): contrastRatio(), darkTokens, getLuminance(), lightTokens, parseHex(), sRgbToLinear()

### Community 27 - "events.ts"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 28 - "@supabase/supabase-js"
Cohesion: 0.33
Nodes (5): adminClient, recordTest(), runAdversarialSuite(), stagingEnv, testResults

### Community 29 - "verify-feedback-ui.mjs"
Cohesion: 0.40
Nodes (3): distDir, mimeTypes, server

### Community 30 - "ref_child_process"
Cohesion: 0.40
Nodes (3): distDir, mimeTypes, server

### Community 31 - "postcss.config.js"
Cohesion: 0.40
Nodes (3): distDir, mimeTypes, server

### Community 32 - "ref_path"
Cohesion: 0.40
Nodes (3): files, publicLogoDir, _svgContent

### Community 33 - "run-axe.mjs"
Cohesion: 0.40
Nodes (4): axeSource, distDir, mimeTypes, server

### Community 34 - "verify-halftone.mjs"
Cohesion: 0.40
Nodes (4): distDir, mimeTypes, outDir, server

### Community 35 - "capture-team-page.mjs"
Cohesion: 0.50
Nodes (3): distDir, mimeTypes, server

### Community 36 - "verify-team-dialog.mjs"
Cohesion: 0.50
Nodes (3): distDir, mimeTypes, server

### Community 37 - "verify-team-dialog.mjs"
Cohesion: 0.50
Nodes (3): distDir, mimeTypes, server

### Community 38 - "verify-onboarding-and-auth.mjs"
Cohesion: 0.07
Nodes (21): adminMissingProf, adminReg, completeProf, DEPARTMENTS, event1, eventWithWaitlist, failingStorage, impReg (+13 more)

### Community 44 - "run"
Cohesion: 0.33
Nodes (3): exceljs, assert(), run()

### Community 45 - "generate-function-inventory.mjs"
Cohesion: 0.22
Nodes (9): inventory, migrationFiles, migrationsDir, normalizeParams(), parseFunctionsFromSql(), schemaFile, schemaFns, schemaMap (+1 more)

### Community 46 - "verify-rpc-consistency.mjs"
Cohesion: 0.22
Nodes (8): API_FILE, apiSource, EXPECTED_RPCS, frontendCalls, migrationFiles, MIGRATIONS_DIR, onboardingFnMatch, ROOT_DIR

### Community 47 - "pointerStore.ts"
Cohesion: 0.19
Nodes (15): initPointerStore(), loop(), onPointerDown(), onPointerMove(), onPointerUp(), onWindowEnter(), onWindowLeave(), PointerState (+7 more)

### Community 48 - "verify-excel.mjs"
Cohesion: 0.32
Nodes (6): __dirname, __filename, record(), results, run(), sanitizeExcelValue()

### Community 50 - "useReducedMotion"
Cohesion: 0.20
Nodes (12): motion, react, AccordionItem, AccordionProps, Header(), Logo(), LogoProps, NumberTicker() (+4 more)

### Community 51 - "Phase 15 — Stage 3: Google OAuth Production Diagnostic & Remediation Report"
Cohesion: 0.12
Nodes (16): 1.1 Observed Behavior, 1. Executive Summary & Observed Defect, 2. Deep Dive Root Cause Analysis, 3.1 Supabase Configuration (`lqlokvzvfccrarjmdvcv`), 3. Configuration & Infrastructure Audit, 5.1 Observed Behavior, 5.2 Root Cause Analysis & Identity Investigation, 5.3 Remediation Applied (+8 more)

### Community 52 - "CursorProvider.tsx"
Cohesion: 0.17
Nodes (10): Cursor(), Particle, CursorProvider(), DISABLED_EXACT_ROUTES, isRouteAllowed(), MagneticManager(), CursorErrorBoundary, Props (+2 more)

### Community 53 - "Google OAuth Production Verification & Launch Readiness Report"
Cohesion: 0.11
Nodes (17): 1. Executive Summary, 2. Google OAuth Scopes Audit, 3. Google OAuth Configuration Checklist, 4. Legal Pages & URL Verification, 5. Technical Verification & Test Evidence, 6. Disclosed Operational Reality & Legal Limitations, 7. Exact Google Cloud Console Submission Steps, 8. Blockers Assessment & Final Launch Verdict (+9 more)

### Community 54 - "AdminTableSkeleton"
Cohesion: 0.44
Nodes (8): adminGetAllEvents(), adminGetDashboardStats(), adminGetExportLogs(), ExportLogRow, AdminCheckIn(), loadEvents(), AdminDashboard(), load()

### Community 55 - "2. Stage-by-Stage Execution Record"
Cohesion: 0.17
Nodes (11): 1. Executive Summary, 2. Stage-by-Stage Execution Record, 3. Smoke Testing & Verification Guide, 4. Operational Maintenance & Sign-Off, Phase 15 — Production Deployment Report, Stage 1: Git Working Tree Preparation & Local Verification, Stage 2: Production Vercel Deployment & Environment Wiring, Stage 3: Google OAuth Configuration & Token Exchange Hardening (+3 more)

### Community 56 - "useReducedMotion"
Cohesion: 0.21
Nodes (9): BRAILLE_CHARS, BrailleOrbitIllustration(), useMagnetic(), EmptyStateProps, HERO_SLIDES, HeroSlide, HeroSlideshowProps, SieveIllustration() (+1 more)

### Community 57 - "Phase 16.1 — Security Claims Verification & Production Readiness Reconciliation Report"
Cohesion: 0.10
Nodes (20): 1.1 Implementation Locus, 1.2 Bypass Feasibility, 1.3 Server-Side Enforcement (GoTrue), 1.4 Reconciliation Summary, 1. Authentication Security & Credential Stuffing Reconciliation, 2.1 Table & View Inventory, 2.2 Applied Migrations, 2.3 Functions, Permissions & Triggers (+12 more)

### Community 58 - "ErrorBoundary"
Cohesion: 0.22
Nodes (3): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState

### Community 59 - "AdminRegistrations.tsx"
Cohesion: 0.35
Nodes (10): adminDeleteStudent(), adminGetAllRegistrations(), adminGetAllRegistrationsDetailed(), adminGetAllStudents(), adminLogExport(), AdminRegistrations(), load(), AdminStudents() (+2 more)

### Community 60 - "SettingsMenu.tsx"
Cohesion: 0.31
Nodes (8): getCursorSetting(), setCursorSetting(), SettingsMenu(), SettingsMenuProps, ThemeContext, ThemeContextType, ThemeMode, useTheme()

### Community 61 - "ProtectedRoute"
Cohesion: 0.20
Nodes (10): 4.1 `src/context/AuthContext.tsx`, 4.2 `src/components/ProtectedRoute.tsx`, 4.3 `src/pages/SignIn.tsx` & `src/pages/SignUp.tsx`, 4.4 `src/lib/api.ts`, 4. Remediation Implemented, Loader(), LoaderProps, snakeOrder (+2 more)

### Community 62 - "Phase 16 — Comprehensive Codebase Audit & Quality Stabilization Report (Reconciled & Corrected)"
Cohesion: 0.14
Nodes (13): 1. Executive Summary & Repository Health Assessment, 2.2 Frontend & Reliability Findings, 2. Categorized Findings & Vulnerability Matrix, 3. Authentication & Authorization Review, 4.1 Database Table & View Inventory, 4.2 Migration Synchronization Status, 4.3 Detailed PostgreSQL Function Definition Comparison (18 Functions), 4. Backend & Database Security Reconciliation (+5 more)

### Community 63 - "2. Key Audit Qualifications & Reconciliations"
Cohesion: 0.14
Nodes (13): 1. Test Execution Matrix Summary, 2.1 Authentication & Credential Stuffing Claims, 2.2 Generic Authentication Error Messages, 2.3 Asynchronous Session Restoration (`getSession()`), 2.4 Table & RLS Inventory Reconciliation, 2.5 Migration & Function Parity Reconciliation, 2.6 Staging Versus Production Test Delineation, 2.7 Transitive Dependency Advisory (`minimatch`) (+5 more)

### Community 64 - "1. Item-by-Item Verification & Correction Matrix"
Cohesion: 0.15
Nodes (12): 1. Item-by-Item Verification & Correction Matrix, 2. Updated Deliverables Summary, 3. Final Overall Assessment, Check 1: Supabase Auth Rate-Limit Documentation vs. Production Configuration, Check 2: Generic Authentication Error Messages & Account Enumeration, Check 3: Asynchronous Execution of `supabase.auth.getSession()`, Check 4: Full PostgreSQL Function Definition Comparison (18 Functions), Check 5: Production Supabase Auth Settings (Dashboard Inspection) (+4 more)

### Community 65 - "Legal Pages Implementation & Verification Report"
Cohesion: 0.10
Nodes (19): 1. Executive Summary, 2.1 Table: `public.contact_messages`, 2.2 Table: `public.feedback`, 2. In-Depth Inspection Findings: Contact Messages & Feedback Records, 3.1 What is Automatically and Atomically Deleted, 3.2 What Remains After Account Deletion, 3. Account Deletion: Database Atomicity vs. Retained Information, 4.1 Section 6 of Privacy Policy (`src/pages/PrivacyPolicy.tsx`) (+11 more)

### Community 67 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, autoprefixer, exceljs, lucide-react, motion, postcss, react, react-dom (+4 more)

### Community 68 - "Skeleton.tsx"
Cohesion: 0.33
Nodes (9): AdminTableSkeleton(), GalleryCardSkeleton(), ProjectCardSkeleton(), Skeleton(), SkeletonProps, TeamCardSkeleton(), adminDeleteEvent(), adminSaveEvent() (+1 more)

### Community 69 - "AuthProvider"
Cohesion: 0.35
Nodes (11): AuthProvider(), loadData(), ThemeProvider(), checkConsentStatus(), checkIsAdmin(), fetchStudentProfile(), 4.1 Page Load and Request Flow, 4.2 Architecture Diagram (+3 more)

### Community 70 - "EmptyState"
Cohesion: 0.31
Nodes (9): EmptyState(), adminDeleteProject(), adminGetAllProjects(), adminGetContactMessages(), adminMarkMessageHandled(), adminSaveProject(), DbContactMessage, AdminMessages() (+1 more)

### Community 71 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, @axe-core/react, oxlint, @types/node, @types/react, @types/react-dom, typescript, vite (+2 more)

### Community 72 - "AdminGallery.tsx"
Cohesion: 0.38
Nodes (9): adminDeleteGalleryItem(), adminGetAllGallery(), adminSaveGalleryItem(), adminUploadGalleryImage(), DbGalleryItem, getInitialMockGalleryItems(), saveMockGalleryItems(), AdminGallery() (+1 more)

### Community 73 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test:all, test:auth, test:rpc

### Community 74 - "FeedbackModal.tsx"
Cohesion: 0.47
Nodes (4): react-dom, FeedbackModal(), FeedbackModalProps, FloatingReportButton()

### Community 75 - "Gallery.tsx"
Cohesion: 0.60
Nodes (5): TiltCard(), fetchGalleryItems(), Gallery(), load(), getFullResSrc()

### Community 76 - "AdminAnnouncements.tsx"
Cohesion: 0.53
Nodes (5): adminDeleteAnnouncement(), adminGetAllAnnouncements(), adminSaveAnnouncement(), DbAnnouncement, AdminAnnouncements()

### Community 78 - "PublicLayout"
Cohesion: 0.50
Nodes (3): PublicLayout(), BottomTabBar(), SkipLink()

## Knowledge Gaps
- **10 isolated node(s):** `autoprefixer`, `postcss`, `tailwindcss`, `@axe-core/react`, `@types/node` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 605 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProtectedRoute()` connect `ProtectedRoute` to `useReducedMotion`, `lucide-react`, `Phase 13 — Production Release Readiness Review Report`, `Architectural & Legal Analysis: Handling of Students Under 18 Under the DPDP Act 2023`, `2. Categorized Findings & Verifications`, `Phase 15 — Stage 3: Google OAuth Production Diagnostic & Remediation Report`, `Google OAuth Production Verification & Launch Readiness Report`, `Phase 16 — Comprehensive Codebase Audit & Quality Stabilization Report (Reconciled & Corrected)`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `postcss`, `tailwindcss` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `3. Comprehensive Migration Safety Review (11 Files)` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Why does `react` connect `useReducedMotion` to `useReducedMotion`, `Home.tsx`, `lucide-react`, `MemberDialog.tsx`, `package.json`, `Register.tsx`, `Home.tsx`, `pointerStore.ts`, `CursorProvider.tsx`, `AdminTableSkeleton`, `useReducedMotion`, `ErrorBoundary`, `AdminRegistrations.tsx`, `SettingsMenu.tsx`, `ProtectedRoute`, `main.tsx`, `Skeleton.tsx`, `EmptyState`, `AdminGallery.tsx`, `FeedbackModal.tsx`, `Gallery.tsx`, `AdminAnnouncements.tsx`, `PublicLayout`, `Button.tsx`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Should `useReducedMotion` be split into smaller, more focused modules?**
  _Cohesion score 0.10952380952380952 - nodes in this community are weakly interconnected._
- **Why does `@supabase/supabase-js` connect `ref_node_fs` to `api.ts`, `@supabase/supabase-js`, `package.json`, `verify-backend.mjs`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `Home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05970149253731343 - nodes in this community are weakly interconnected._