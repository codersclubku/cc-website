# Graph Report - CC Website  (2026-10-31)

## Corpus Check
- 151 files · ~624,664 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .css 3, .example 2, (none) 2)

## Summary
- 971 nodes · 2276 edges · 55 communities (49 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df02c257`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SettingsMenu.tsx
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
- NumberTicker.tsx
- dependencies
- Home.tsx
- 2. Categorized Findings & Verifications
- ref_node_fs
- subscribePointer
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
- devDependencies
- verify-excel.mjs
- useReducedMotion
- scripts
- pointerStore.ts
- react
- CursorErrorBoundary
- Button.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 76 edges
2. `lucide-react` - 47 edges
3. `useReducedMotion()` - 47 edges
4. `App()` - 43 edges
5. `HairlineGrid()` - 41 edges
6. `useAuth()` - 39 edges
7. `react-router-dom` - 32 edges
8. `Alert()` - 30 edges
9. `Badge()` - 21 edges
10. `EmptyState()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `FINDING-AUTH-01: Mandatory Student Onboarding Route Protection` --references--> `ProtectedRoute()`  [INFERRED]
  docs/PHASE_13_FINDINGS.md → src/components/ProtectedRoute.tsx
- `2. Audit Scope` --references--> `ProtectedRoute()`  [INFERRED]
  docs/PHASE_13_RELEASE_READINESS_REPORT.md → src/components/ProtectedRoute.tsx
- `6.2 Bypass Analysis` --references--> `ProtectedRoute()`  [INFERRED]
  docs/PHASE_13_RELEASE_READINESS_REPORT.md → src/components/ProtectedRoute.tsx
- `Key Entry Points` --references--> `CursorProvider()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/components/cursor/CursorProvider.tsx
- `4.3 Component & State Hierarchy` --references--> `AuthProvider()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/context/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (55 total, 6 thin omitted)

### Community 0 - "SettingsMenu.tsx"
Cohesion: 0.29
Nodes (8): getCursorSetting(), setCursorSetting(), SettingsMenu(), SettingsMenuProps, ThemeContext, ThemeContextType, ThemeMode, useTheme()

### Community 1 - "useReducedMotion"
Cohesion: 0.06
Nodes (50): About, Account, AdminAnnouncements, AdminCheckIn, AdminDashboard, AdminEvents, AdminFeedback, AdminGallery (+42 more)

### Community 2 - "Home.tsx"
Cohesion: 0.06
Nodes (53): vite, @vitejs/plugin-react, FeedbackStatusBadge(), FeedbackTypeBadge(), StatusBadgeProps, TypeBadgeProps, FeedbackForm(), FeedbackFormProps (+45 more)

### Community 3 - "lucide-react"
Cohesion: 0.07
Nodes (63): lucide-react, react-router-dom, Alert(), AlertProps, AlertType, HairlineGrid(), HairlineGridProps, KULogo() (+55 more)

### Community 4 - "MemberDialog.tsx"
Cohesion: 0.10
Nodes (43): Footer(), getInitials(), HalftoneAvatar(), HalftoneAvatarProps, parseColor(), smoothstep(), computeDotRadius(), createRng() (+35 more)

### Community 5 - "package.json"
Cohesion: 0.11
Nodes (17): name, overrides, uuid, private, type, version, autoprefixer, @axe-core/react (+9 more)

### Community 6 - "Technical Overview: Coders Club Web Platform & Administrative System"
Cohesion: 0.05
Nodes (37): 10.1 Five Technical Strengths, 10.2 Four Limitations & Areas to Improve, 10.3 Realistic Future Enhancements, 10.4 Five Interesting Technical Facts, 10. Challenges, Strengths & Future Scope, 12.1 Design Audit Matrix, 12.2 Standards Compliance Summary, 12.3 Top 5 Recommended Design & Accessibility Improvements (+29 more)

### Community 7 - "verify-backend.mjs"
Cohesion: 0.25
Nodes (12): __dirname, extractAppTables(), __filename, localEnv, normalizeParams(), record(), results, run() (+4 more)

### Community 8 - "AdminStudents.tsx"
Cohesion: 0.07
Nodes (28): 1.1 Prerequisites, 1.2 Installation, 1.3 Quality Checks & Production Build, 1. Quickstart & Zero-Setup Run, 2. Environment Configuration, 3.1 Initial Setup, 3.2 Database Schema Overview, 3.3 Atomic Stored Procedures (+20 more)

### Community 9 - "Register.tsx"
Cohesion: 0.14
Nodes (27): QrTicket(), QrTicketProps, isProfileComplete(), fetchEventById(), fetchEventBySlug(), fetchStudentRegistrations(), RegistrationResult, downloadIcsFile() (+19 more)

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
Cohesion: 0.05
Nodes (81): AdminTableSkeleton(), GalleryCardSkeleton(), ProjectCardSkeleton(), Skeleton(), SkeletonProps, TeamCardSkeleton(), AuthContext, AuthContextType (+73 more)

### Community 14 - "Skeleton.tsx"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 15 - "NumberTicker.tsx"
Cohesion: 0.47
Nodes (4): NumberTicker(), NumberTickerProps, StatCard(), StatCardProps

### Community 16 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, autoprefixer, exceljs, lucide-react, motion, postcss, react, react-dom (+4 more)

### Community 17 - "Home.tsx"
Cohesion: 0.11
Nodes (35): Accordion(), Badge(), BadgeProps, BadgeVariant, HeroSlideshow(), StaggerGrid(), StaggerGridProps, StaggerItem() (+27 more)

### Community 18 - "2. Categorized Findings & Verifications"
Cohesion: 0.08
Nodes (24): 1. Finding Severity Classification, 2.1 Database, Schema & Migration Integrity, 2.2 Authentication, Student Onboarding & Privacy (DPDP Act), 2.3 Event Workflows & Concurrency, 2.4 Administrative Authorization & Audit Logging, 2.5 Frontend, Environment & Dependencies, 2. Categorized Findings & Verifications, 3. Summary of Findings by Status (+16 more)

### Community 19 - "ref_node_fs"
Cohesion: 0.15
Nodes (5): @supabase/supabase-js, localEnv, localEnv, targetEmail, supabase

### Community 20 - "subscribePointer"
Cohesion: 0.20
Nodes (13): Cursor(), Particle, CursorProvider(), DISABLED_EXACT_ROUTES, isRouteAllowed(), MagneticManager(), PointerState, subscribePointer() (+5 more)

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
Cohesion: 0.22
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
Nodes (3): files, publicLogoDir, svgContent

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
Cohesion: 0.06
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

### Community 47 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, @axe-core/react, oxlint, @types/node, @types/react, @types/react-dom, typescript, vite (+2 more)

### Community 48 - "verify-excel.mjs"
Cohesion: 0.32
Nodes (6): __dirname, __filename, record(), results, run(), sanitizeExcelValue()

### Community 49 - "useReducedMotion"
Cohesion: 0.25
Nodes (12): BRAILLE_CHARS, BrailleOrbitIllustration(), EmptyState(), EmptyStateProps, SieveIllustration(), TiltCard(), TiltCardProps, useReducedMotion() (+4 more)

### Community 50 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test:all, test:auth, test:rpc

### Community 51 - "pointerStore.ts"
Cohesion: 0.27
Nodes (10): initPointerStore(), loop(), onPointerDown(), onPointerMove(), onPointerUp(), onWindowEnter(), onWindowLeave(), startLoop() (+2 more)

### Community 52 - "react"
Cohesion: 0.18
Nodes (13): motion, react, react-dom, AccordionItem, AccordionProps, FeedbackModalProps, Header(), HERO_SLIDES (+5 more)

### Community 53 - "CursorErrorBoundary"
Cohesion: 0.25
Nodes (3): CursorErrorBoundary, Props, State

## Knowledge Gaps
- **10 isolated node(s):** `autoprefixer`, `postcss`, `tailwindcss`, `@axe-core/react`, `@types/node` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 425 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SettingsMenu.tsx`, `useReducedMotion`, `Home.tsx`, `lucide-react`, `MemberDialog.tsx`, `package.json`, `Register.tsx`, `api.ts`, `NumberTicker.tsx`, `Home.tsx`, `useReducedMotion`, `subscribePointer`, `CursorErrorBoundary`, `Button.tsx`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `postcss`, `tailwindcss` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useReducedMotion` be split into smaller, more focused modules?**
  _Cohesion score 0.057692307692307696 - nodes in this community are weakly interconnected._
- **Why does `ProtectedRoute()` connect `useReducedMotion` to `lucide-react`, `Register.tsx`, `2. Categorized Findings & Verifications`, `Phase 13 — Production Release Readiness Review Report`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `Home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05970149253731343 - nodes in this community are weakly interconnected._
- **Why does `@supabase/supabase-js` connect `ref_node_fs` to `api.ts`, `@supabase/supabase-js`, `package.json`, `verify-backend.mjs`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.06974789915966387 - nodes in this community are weakly interconnected._