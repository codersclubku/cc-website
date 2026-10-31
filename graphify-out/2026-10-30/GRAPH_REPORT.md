# Graph Report - CC Website  (2026-10-28)

## Corpus Check
- 134 files · ~579,217 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .css 3, .example 1)

## Summary
- 772 nodes · 2001 edges · 40 communities (34 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- react
- useReducedMotion
- Home.tsx
- package.json
- Home.tsx
- package.json
- HalftoneAvatar.tsx
- AdminStudents.tsx
- Register.tsx
- HalftoneAvatar.tsx
- api.ts
- CursorProvider.tsx
- compilerOptions
- Skeleton.tsx
- AuthContext.tsx
- EmptyState
- AdminDashboard.tsx
- Coders Club Kishkinda University — Brand & UX Glossary
- ref_child_process
- motion.ts
- compute-contrast.mjs
- .oxlintrc.json
- verify-halftone.mjs
- capture-team-page.mjs
- events.ts
- verify-feedback-ui.mjs
- ref_child_process
- postcss.config.js
- ref_path
- run-axe.mjs
- verify-halftone.mjs
- capture-team-page.mjs
- verify-team-dialog.mjs
- verify-team-dialog.mjs
- tsconfig.json
- vercel.json
- preview-link.md

## God Nodes (most connected - your core abstractions)
1. `react` - 75 edges
2. `useReducedMotion()` - 47 edges
3. `lucide-react` - 46 edges
4. `App()` - 41 edges
5. `HairlineGrid()` - 39 edges
6. `useAuth()` - 37 edges
7. `react-router-dom` - 31 edges
8. `Alert()` - 28 edges
9. `Badge()` - 21 edges
10. `EmptyState()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `NotFound()` --calls--> `HairlineGrid()`  [EXTRACTED]
  src/pages/NotFound.tsx → src/components/HairlineGrid.tsx
- `PublicLayout()` --calls--> `BottomTabBar()`  [EXTRACTED]
  src/App.tsx → src/components/BottomTabBar.tsx
- `PublicLayout()` --calls--> `Footer()`  [EXTRACTED]
  src/App.tsx → src/components/Footer.tsx
- `PublicLayout()` --calls--> `Header()`  [EXTRACTED]
  src/App.tsx → src/components/Header.tsx
- `PublicLayout()` --calls--> `useReducedMotion()`  [EXTRACTED]
  src/App.tsx → src/hooks/useReducedMotion.ts

## Import Cycles
- None detected.

## Communities (40 total, 6 thin omitted)

### Community 0 - "react"
Cohesion: 0.06
Nodes (49): motion, AccordionItem, AccordionProps, BottomTabBar(), Cursor(), Particle, CursorProvider(), DISABLED_EXACT_ROUTES (+41 more)

### Community 1 - "useReducedMotion"
Cohesion: 0.06
Nodes (48): react-dom, About, Account, AdminAnnouncements, AdminCheckIn, AdminDashboard, AdminEvents, AdminFeedback (+40 more)

### Community 2 - "Home.tsx"
Cohesion: 0.06
Nodes (52): vite, @vitejs/plugin-react, FeedbackStatusBadge(), FeedbackTypeBadge(), StatusBadgeProps, TypeBadgeProps, FeedbackForm(), FeedbackFormProps (+44 more)

### Community 3 - "package.json"
Cohesion: 0.08
Nodes (61): lucide-react, react, react-router-dom, Alert(), AlertProps, AlertType, Badge(), BadgeProps (+53 more)

### Community 4 - "Home.tsx"
Cohesion: 0.09
Nodes (40): Accordion(), HERO_SLIDES, HeroSlide, HeroSlideshow(), HeroSlideshowProps, StaggerGrid(), StaggerGridProps, StaggerItem() (+32 more)

### Community 5 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, autoprefixer, exceljs, lucide-react, motion, postcss, react, react-dom (+36 more)

### Community 7 - "HalftoneAvatar.tsx"
Cohesion: 0.07
Nodes (22): exceljs, @supabase/supabase-js, localEnv, localEnv, targetEmail, supabase, assert(), run() (+14 more)

### Community 8 - "AdminStudents.tsx"
Cohesion: 0.07
Nodes (27): 1.1 Prerequisites, 1.2 Installation, 1.3 Quality Checks & Production Build, 1. Quickstart & Zero-Setup Run, 2. Environment Configuration, 3.1 Initial Setup, 3.2 Database Schema Overview, 3.3 Atomic Stored Procedures (+19 more)

### Community 9 - "Register.tsx"
Cohesion: 0.15
Nodes (23): fetchEventById(), fetchEventBySlug(), fetchStudentRegistrations(), downloadIcsFile(), escapeText(), foldLine(), formatUtcDate(), generateIcsContent() (+15 more)

### Community 10 - "HalftoneAvatar.tsx"
Cohesion: 0.11
Nodes (35): Footer(), getInitials(), HalftoneAvatar(), HalftoneAvatarProps, parseColor(), smoothstep(), computeDotRadius(), createRng() (+27 more)

### Community 11 - "api.ts"
Cohesion: 0.09
Nodes (29): adminCheckInAttendee(), adminCheckInAttendeeByCodeOrUsn(), adminDeleteEvent(), adminDeleteProject(), adminGetAllProjects(), adminSaveEvent(), adminSaveProject(), cancelRegistration() (+21 more)

### Community 12 - "CursorProvider.tsx"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 13 - "compilerOptions"
Cohesion: 0.22
Nodes (11): AuthContext, AuthContextType, AuthProvider(), AuthUser, checkIsAdmin(), fetchStudentProfile(), recordConsent(), withdrawConsent() (+3 more)

### Community 14 - "Skeleton.tsx"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 16 - "AuthContext.tsx"
Cohesion: 0.44
Nodes (8): adminGetAllEvents(), adminGetDashboardStats(), adminGetExportLogs(), ExportLogRow, AdminCheckIn(), loadEvents(), AdminDashboard(), load()

### Community 17 - "EmptyState"
Cohesion: 0.18
Nodes (15): BRAILLE_CHARS, BrailleOrbitIllustration(), EmptyState(), EmptyStateProps, SieveIllustration(), AdminTableSkeleton(), adminDeleteAnnouncement(), adminGetAllAnnouncements() (+7 more)

### Community 19 - "AdminDashboard.tsx"
Cohesion: 0.38
Nodes (9): adminDeleteGalleryItem(), adminGetAllGallery(), adminSaveGalleryItem(), adminUploadGalleryImage(), DbGalleryItem, getInitialMockGalleryItems(), saveMockGalleryItems(), AdminGallery() (+1 more)

### Community 20 - "Coders Club Kishkinda University — Brand & UX Glossary"
Cohesion: 0.19
Nodes (16): adminDeleteStudent(), adminGetAllRegistrations(), adminGetAllRegistrationsDetailed(), adminGetAllStudents(), adminLogExport(), StudentProfile, applySheetStyles(), ExportDataset (+8 more)

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

## Knowledge Gaps
- **10 isolated node(s):** `autoprefixer`, `postcss`, `tailwindcss`, `@axe-core/react`, `@types/node` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 294 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `package.json` to `react`, `useReducedMotion`, `Home.tsx`, `Home.tsx`, `package.json`, `HalftoneAvatar.tsx`, `compilerOptions`, `AuthContext.tsx`, `EmptyState`, `AdminDashboard.tsx`, `Coders Club Kishkinda University — Brand & UX Glossary`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `postcss`, `tailwindcss` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.05997778600518327 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `package.json` to `react`, `useReducedMotion`, `Home.tsx`, `Home.tsx`, `package.json`, `HalftoneAvatar.tsx`, `AuthContext.tsx`, `EmptyState`, `AdminDashboard.tsx`, `Coders Club Kishkinda University — Brand & UX Glossary`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `useReducedMotion` be split into smaller, more focused modules?**
  _Cohesion score 0.057539682539682536 - nodes in this community are weakly interconnected._
- **Why does `@supabase/supabase-js` connect `HalftoneAvatar.tsx` to `compilerOptions`, `package.json`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Should `Home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06153846153846154 - nodes in this community are weakly interconnected._