# Graph Report - CC Website  (2026-10-31)

## Corpus Check
- 149 files · ~620,601 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .css 3, .example 2, (none) 2)

## Summary
- 919 nodes · 2223 edges · 53 communities (47 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df02c257`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CursorProvider.tsx
- useReducedMotion
- Home.tsx
- lucide-react
- MemberDialog.tsx
- package.json
- Technical Overview: Coders Club Web Platform & Administrative System
- verify-backend.mjs
- AdminStudents.tsx
- calendar.ts
- Staging Deployment & Verification Runbook
- AdminStudents.tsx
- CursorProvider.tsx
- api.ts
- Skeleton.tsx
- AdminDashboard.tsx
- dependencies
- react
- AdminTableSkeleton
- ref_node_fs
- AdminGallery.tsx
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
- excelExport.ts
- generate-function-inventory.mjs
- verify-rpc-consistency.mjs
- devDependencies
- verify-excel.mjs
- AdminTeam.tsx
- scripts
- Projects.tsx
- main.tsx

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
- `Key Entry Points` --references--> `CursorProvider()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/components/cursor/CursorProvider.tsx
- `11.1 Security Audit Matrix` --references--> `mapApiError()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/lib/api.ts
- `11.2 OWASP Top 10 (2021) Mapping` --references--> `isCommonPassword()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/lib/validation.ts
- `4.3 Component & State Hierarchy` --references--> `PublicLayout()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/App.tsx
- `Key Entry Points` --references--> `App()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/App.tsx

## Import Cycles
- None detected.

## Communities (53 total, 6 thin omitted)

### Community 0 - "CursorProvider.tsx"
Cohesion: 0.13
Nodes (15): CursorProvider(), DISABLED_EXACT_ROUTES, isRouteAllowed(), MagneticManager(), getCursorSetting(), setCursorSetting(), CursorErrorBoundary, Props (+7 more)

### Community 1 - "useReducedMotion"
Cohesion: 0.05
Nodes (61): About, Account, AdminAnnouncements, AdminCheckIn, AdminDashboard, AdminEvents, AdminFeedback, AdminGallery (+53 more)

### Community 2 - "Home.tsx"
Cohesion: 0.05
Nodes (57): vite, @vitejs/plugin-react, zod, FeedbackStatusBadge(), FeedbackTypeBadge(), StatusBadgeProps, TypeBadgeProps, FeedbackForm() (+49 more)

### Community 3 - "lucide-react"
Cohesion: 0.06
Nodes (74): lucide-react, react-router-dom, Alert(), AlertProps, AlertType, HairlineGrid(), HairlineGridProps, QrTicket() (+66 more)

### Community 4 - "MemberDialog.tsx"
Cohesion: 0.12
Nodes (34): Footer(), getInitials(), HalftoneAvatar(), HalftoneAvatarProps, parseColor(), smoothstep(), computeDotRadius(), createRng() (+26 more)

### Community 5 - "package.json"
Cohesion: 0.12
Nodes (16): name, overrides, uuid, private, type, version, autoprefixer, @axe-core/react (+8 more)

### Community 6 - "Technical Overview: Coders Club Web Platform & Administrative System"
Cohesion: 0.06
Nodes (35): 10.1 Five Technical Strengths, 10.2 Four Limitations & Areas to Improve, 10.3 Realistic Future Enhancements, 10.4 Five Interesting Technical Facts, 10. Challenges, Strengths & Future Scope, 12.1 Design Audit Matrix, 12.2 Standards Compliance Summary, 12.3 Top 5 Recommended Design & Accessibility Improvements (+27 more)

### Community 7 - "verify-backend.mjs"
Cohesion: 0.25
Nodes (12): __dirname, extractAppTables(), __filename, localEnv, normalizeParams(), record(), results, run() (+4 more)

### Community 8 - "AdminStudents.tsx"
Cohesion: 0.07
Nodes (28): 1.1 Prerequisites, 1.2 Installation, 1.3 Quality Checks & Production Build, 1. Quickstart & Zero-Setup Run, 2. Environment Configuration, 3.1 Initial Setup, 3.2 Database Schema Overview, 3.3 Atomic Stored Procedures (+20 more)

### Community 9 - "calendar.ts"
Cohesion: 0.60
Nodes (5): downloadIcsFile(), escapeText(), foldLine(), formatUtcDate(), generateIcsContent()

### Community 10 - "Staging Deployment & Verification Runbook"
Cohesion: 0.10
Nodes (19): 1. Provisioning a Supabase Staging Project, 2.1 Required Credentials, 2.2 Configuring Locally Without Exposing Secrets, 2. Environment Variables & Secret Handling, 3.1 Migration Sequence (8 Files), 3.2 Step 1: Link the Staging Project, 3.3 Step 2: Check Remote Migration Status, 3.4 Step 3: Apply Migrations (+11 more)

### Community 11 - "AdminStudents.tsx"
Cohesion: 0.38
Nodes (9): adminDeleteStudent(), adminGetAllRegistrations(), adminGetAllRegistrationsDetailed(), adminGetAllStudents(), adminLogExport(), AdminRegistrations(), load(), AdminStudents() (+1 more)

### Community 12 - "CursorProvider.tsx"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 13 - "api.ts"
Cohesion: 0.08
Nodes (33): adminCheckInAttendee(), adminCheckInAttendeeByCodeOrUsn(), adminDeleteAnnouncement(), adminGetAllAnnouncements(), adminSaveAnnouncement(), ApiError, cancelRegistration(), cancelStudentRegistration() (+25 more)

### Community 14 - "Skeleton.tsx"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 15 - "AdminDashboard.tsx"
Cohesion: 0.40
Nodes (9): StatCard(), adminGetAllEvents(), adminGetDashboardStats(), adminGetExportLogs(), ExportLogRow, AdminCheckIn(), loadEvents(), AdminDashboard() (+1 more)

### Community 16 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, autoprefixer, exceljs, lucide-react, motion, postcss, react, react-dom (+4 more)

### Community 17 - "react"
Cohesion: 0.05
Nodes (76): motion, react, Accordion(), AccordionItem, AccordionProps, BRAILLE_CHARS, BrailleOrbitIllustration(), Button (+68 more)

### Community 18 - "AdminTableSkeleton"
Cohesion: 0.33
Nodes (8): AdminTableSkeleton(), adminDeleteEvent(), adminGetContactMessages(), adminMarkMessageHandled(), adminSaveEvent(), DbContactMessage, AdminEvents(), AdminMessages()

### Community 19 - "ref_node_fs"
Cohesion: 0.15
Nodes (5): @supabase/supabase-js, localEnv, localEnv, targetEmail, supabase

### Community 20 - "AdminGallery.tsx"
Cohesion: 0.38
Nodes (9): adminDeleteGalleryItem(), adminGetAllGallery(), adminSaveGalleryItem(), adminUploadGalleryImage(), DbGalleryItem, getInitialMockGalleryItems(), saveMockGalleryItems(), AdminGallery() (+1 more)

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

### Community 44 - "excelExport.ts"
Cohesion: 0.19
Nodes (8): exceljs, assert(), run(), applySheetStyles(), ExportFilters, formatISTDate(), generateCodersClubExcel(), sanitizeExcelValue()

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

### Community 49 - "AdminTeam.tsx"
Cohesion: 0.42
Nodes (8): LinkedinIcon(), adminDeleteTeamMember(), adminGetTeamMembers(), adminSaveTeamMember(), DbTeamMember, getInitialMockTeamMembers(), saveMockTeamMembers(), AdminTeam()

### Community 50 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test:all, test:auth, test:rpc

### Community 51 - "Projects.tsx"
Cohesion: 0.21
Nodes (16): Badge(), BadgeProps, BadgeVariant, GithubIcon(), PROJECTS, adminDeleteProject(), adminGetAllProjects(), adminSaveProject() (+8 more)

## Knowledge Gaps
- **10 isolated node(s):** `autoprefixer`, `postcss`, `tailwindcss`, `@axe-core/react`, `@types/node` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 391 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `CursorProvider.tsx`, `useReducedMotion`, `Home.tsx`, `lucide-react`, `MemberDialog.tsx`, `package.json`, `AdminStudents.tsx`, `api.ts`, `AdminDashboard.tsx`, `AdminTeam.tsx`, `AdminTableSkeleton`, `Projects.tsx`, `main.tsx`, `AdminGallery.tsx`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `postcss`, `tailwindcss` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CursorProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Why does `@supabase/supabase-js` connect `ref_node_fs` to `api.ts`, `@supabase/supabase-js`, `package.json`, `verify-backend.mjs`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `useReducedMotion` be split into smaller, more focused modules?**
  _Cohesion score 0.0547945205479452 - nodes in this community are weakly interconnected._
- **Why does `Technical Overview: Coders Club Web Platform & Administrative System` connect `Technical Overview: Coders Club Web Platform & Administrative System` to `useReducedMotion`, `lucide-react`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `Home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._