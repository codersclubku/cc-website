# Graph Report - CC Website  (2026-10-23)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 703 nodes · 1819 edges · 45 communities (38 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- react
- App.tsx
- Home.tsx
- package.json
- Home.tsx
- package.json
- verify-backend.mjs
- MemberDialog.tsx
- HalftoneAvatar.tsx
- compilerOptions
- HalftoneAvatar.tsx
- compilerOptions
- CursorProvider.tsx
- compilerOptions
- SettingsMenu.tsx
- subscribePointer
- AuthContext.tsx
- AdminDashboard.tsx
- Quality Assurance & Verification Report
- compute-contrast.mjs
- .oxlintrc.json
- ref_child_process
- motion.ts
- compute-contrast.mjs
- .oxlintrc.json
- verify-halftone.mjs
- capture-team-page.mjs
- events.ts
- tsconfig.json
- vercel.json
- tailwind.config.js
- postcss.config.js
- postcss.config.js
- run-axe.mjs
- verify-halftone.mjs
- capture-team-page.mjs
- verify-team-dialog.mjs
- events.ts
- Button.tsx
- tsconfig.json
- vercel.json
- preview-link.md
- postcss.config.js

## God Nodes (most connected - your core abstractions)
1. `react` - 72 edges
2. `useReducedMotion()` - 45 edges
3. `lucide-react` - 41 edges
4. `App()` - 39 edges
5. `HairlineGrid()` - 37 edges
6. `useAuth()` - 35 edges
7. `react-router-dom` - 30 edges
8. `Alert()` - 28 edges
9. `Badge()` - 21 edges
10. `EmptyState()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `PublicLayout()` --calls--> `ErrorBoundary`  [EXTRACTED]
  src/App.tsx → src/components/ErrorBoundary.tsx
- `ExportDataset` --references--> `DbStudentRegistration`  [EXTRACTED]
  src/lib/excelExport.ts → src/lib/api.ts
- `AuthContextType` --references--> `StudentProfile`  [EXTRACTED]
  src/context/AuthContext.tsx → src/lib/api.ts
- `MemberDialogProps` --references--> `Person`  [EXTRACTED]
  src/components/MemberDialog.tsx → src/content/people.ts
- `CursorProvider()` --calls--> `CursorErrorBoundary`  [EXTRACTED]
  src/components/cursor/CursorProvider.tsx → src/components/cursor/ErrorBoundary.tsx

## Import Cycles
- None detected.

## Communities (45 total, 7 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (84): lucide-react, react, react-router-dom, About, Account, AdminCheckIn, AdminDashboard, AdminLayout (+76 more)

### Community 1 - "App.tsx"
Cohesion: 0.05
Nodes (77): motion, PublicLayout(), Accordion(), AccordionItem, AccordionProps, Badge(), BottomTabBar(), Cursor() (+69 more)

### Community 2 - "Home.tsx"
Cohesion: 0.08
Nodes (45): AdminTeam, Footer(), KULogo(), KULogoProps, MemberDialog(), MemberDialogProps, GithubIcon(), InstagramIcon() (+37 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (22): exceljs, @supabase/supabase-js, localEnv, localEnv, targetEmail, supabase, assert(), run() (+14 more)

### Community 4 - "Home.tsx"
Cohesion: 0.09
Nodes (28): AuthProvider(), adminCheckInAttendee(), adminCheckInAttendeeByCodeOrUsn(), cancelRegistration(), cancelStudentRegistration(), checkIsAdmin(), DbRegistration, deleteStudentAccount() (+20 more)

### Community 5 - "package.json"
Cohesion: 0.16
Nodes (21): fetchEventById(), fetchEventBySlug(), downloadIcsFile(), escapeText(), foldLine(), formatUtcDate(), generateIcsContent(), addOfflineSyncResult() (+13 more)

### Community 6 - "verify-backend.mjs"
Cohesion: 0.09
Nodes (22): 1.1 Prerequisites, 1.2 Installation, 1.3 Quality Checks & Production Build, 1. Quickstart & Zero-Setup Run, 2. Environment Configuration, 3.1 Initial Setup, 3.2 Database Schema Overview, 3.3 Atomic Stored Procedures (+14 more)

### Community 7 - "MemberDialog.tsx"
Cohesion: 0.17
Nodes (20): getInitials(), HalftoneAvatar(), HalftoneAvatarProps, parseColor(), smoothstep(), computeDotRadius(), createRng(), fieldCache (+12 more)

### Community 8 - "HalftoneAvatar.tsx"
Cohesion: 0.17
Nodes (19): AdminStudents, adminDeleteStudent(), adminGetAllRegistrations(), adminGetAllRegistrationsDetailed(), adminGetAllStudents(), adminLogExport(), exportRegistrationsToCsv(), StudentProfile (+11 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 10 - "HalftoneAvatar.tsx"
Cohesion: 0.12
Nodes (16): name, private, type, version, autoprefixer, @axe-core/react, eslint-plugin-jsx-a11y, oxlint (+8 more)

### Community 11 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 12 - "CursorProvider.tsx"
Cohesion: 0.23
Nodes (10): AdminMessages, BRAILLE_CHARS, BrailleOrbitIllustration(), EmptyState(), EmptyStateProps, SieveIllustration(), adminGetContactMessages(), adminMarkMessageHandled() (+2 more)

### Community 13 - "compilerOptions"
Cohesion: 0.17
Nodes (12): dependencies, autoprefixer, exceljs, lucide-react, motion, postcss, react, react-dom (+4 more)

### Community 14 - "SettingsMenu.tsx"
Cohesion: 0.29
Nodes (10): AdminEvents, AdminTableSkeleton(), GalleryCardSkeleton(), ProjectCardSkeleton(), Skeleton(), SkeletonProps, TeamCardSkeleton(), adminDeleteEvent() (+2 more)

### Community 15 - "subscribePointer"
Cohesion: 0.18
Nodes (11): devDependencies, @axe-core/react, eslint-plugin-jsx-a11y, oxlint, @types/node, @types/react, @types/react-dom, typescript (+3 more)

### Community 16 - "AuthContext.tsx"
Cohesion: 0.33
Nodes (10): AdminGallery, adminDeleteGalleryItem(), adminGetAllGallery(), adminSaveGalleryItem(), adminUploadGalleryImage(), DbGalleryItem, getInitialMockGalleryItems(), saveMockGalleryItems() (+2 more)

### Community 17 - "AdminDashboard.tsx"
Cohesion: 0.22
Nodes (6): edgeProc, pageTarget, pending, results, userDataDir, ws

### Community 18 - "Quality Assurance & Verification Report"
Cohesion: 0.22
Nodes (6): edgeProc, pageTarget, pending, results, userDataDir, ws

### Community 19 - "compute-contrast.mjs"
Cohesion: 0.44
Nodes (8): adminGetAllEvents(), adminGetDashboardStats(), adminGetExportLogs(), ExportLogRow, AdminCheckIn(), loadEvents(), AdminDashboard(), load()

### Community 20 - ".oxlintrc.json"
Cohesion: 0.25
Nodes (7): 1. Identity & Naming, 2. Navigation & Information Architecture, 3. Roles & Hierarchy, 4. Status Labels & Tooltips, 5. Standard Action Verbs (Microcopy), 6. Formatting Conventions, Coders Club Kishkinda University — Brand & UX Glossary

### Community 21 - "ref_child_process"
Cohesion: 0.25
Nodes (5): inner, svgContent, distDir, mimeTypes, server

### Community 22 - "motion.ts"
Cohesion: 0.25
Nodes (3): CursorErrorBoundary, Props, State

### Community 23 - "compute-contrast.mjs"
Cohesion: 0.25
Nodes (7): easeOutBase, easeOutFast, easeOutSlow, fadeInUpVariants, fadeInVariants, springTransition, staggerContainer

### Community 24 - ".oxlintrc.json"
Cohesion: 0.29
Nodes (6): 1. Executive Summary, 2. Route Navigation & CDP Audit Matrix, 3. Excel Export & Security Hardening Verification, 4. Backend Integrity & Security Definer Functions, Coders Club Web Platform & Supabase Backend, Quality Assurance & Verification Report

### Community 25 - "verify-halftone.mjs"
Cohesion: 0.43
Nodes (6): contrastRatio(), darkTokens, getLuminance(), lightTokens, parseHex(), sRgbToLinear()

### Community 26 - "capture-team-page.mjs"
Cohesion: 0.43
Nodes (6): AdminAnnouncements, adminDeleteAnnouncement(), adminGetAllAnnouncements(), adminSaveAnnouncement(), DbAnnouncement, AdminAnnouncements()

### Community 27 - "events.ts"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 28 - "tsconfig.json"
Cohesion: 0.53
Nodes (5): AdminProjects, adminDeleteProject(), adminGetAllProjects(), adminSaveProject(), AdminProjects()

### Community 29 - "vercel.json"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 30 - "tailwind.config.js"
Cohesion: 0.40
Nodes (3): distDir, mimeTypes, server

### Community 31 - "postcss.config.js"
Cohesion: 0.40
Nodes (3): distDir, mimeTypes, server

### Community 32 - "postcss.config.js"
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

### Community 37 - "events.ts"
Cohesion: 0.50
Nodes (3): ClubEvent, PAST_EVENTS, UPCOMING_EVENTS

## Knowledge Gaps
- **11 isolated node(s):** `autoprefixer`, `@axe-core/react`, `eslint-plugin-jsx-a11y`, `oxlint`, `postcss` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 279 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `App.tsx`, `Home.tsx`, `Button.tsx`, `MemberDialog.tsx`, `HalftoneAvatar.tsx`, `HalftoneAvatar.tsx`, `CursorProvider.tsx`, `SettingsMenu.tsx`, `AuthContext.tsx`, `compute-contrast.mjs`, `motion.ts`, `capture-team-page.mjs`, `tsconfig.json`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `@axe-core/react`, `eslint-plugin-jsx-a11y` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.0514269158336955 - nodes in this community are weakly interconnected._
- **Why does `@supabase/supabase-js` connect `package.json` to `HalftoneAvatar.tsx`, `Home.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05044736341138397 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `App.tsx`, `Home.tsx`, `HalftoneAvatar.tsx`, `HalftoneAvatar.tsx`, `CursorProvider.tsx`, `SettingsMenu.tsx`, `AuthContext.tsx`, `compute-contrast.mjs`, `tsconfig.json`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `Home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07811447811447811 - nodes in this community are weakly interconnected._