# Graph Report - CC Website  (2026-10-30)

## Corpus Check
- 135 files · ~585,067 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .css 3, .example 1)

## Summary
- 817 nodes · 2062 edges · 36 communities (30 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- react
- useReducedMotion
- Home.tsx
- package.json
- Home.tsx
- package.json
- Technical Overview: Coders Club Web Platform & Administrative System
- HalftoneAvatar.tsx
- AdminStudents.tsx
- Register.tsx
- HalftoneAvatar.tsx
- api.ts
- CursorProvider.tsx
- Skeleton.tsx
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
4. `App()` - 42 edges
5. `HairlineGrid()` - 39 edges
6. `useAuth()` - 37 edges
7. `react-router-dom` - 31 edges
8. `Alert()` - 28 edges
9. `Badge()` - 21 edges
10. `EmptyState()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Key Entry Points` --references--> `CursorProvider()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/components/cursor/CursorProvider.tsx
- `11.1 Security Audit Matrix` --references--> `mapApiError()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/lib/api.ts
- `11.2 OWASP Top 10 (2021) Mapping` --references--> `isCommonPassword()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/lib/validation.ts
- `4.3 Component & State Hierarchy` --references--> `AdminLayout()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/pages/admin/AdminLayout.tsx
- `4.3 Component & State Hierarchy` --references--> `PublicLayout()`  [INFERRED]
  TECHNICAL_OVERVIEW.md → src/App.tsx

## Import Cycles
- None detected.

## Communities (36 total, 6 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (56): motion, react, AccordionItem, AccordionProps, BottomTabBar(), Button, ButtonProps, Cursor() (+48 more)

### Community 1 - "useReducedMotion"
Cohesion: 0.05
Nodes (55): react-dom, About, Account, AdminAnnouncements, AdminCheckIn, AdminDashboard, AdminEvents, AdminFeedback (+47 more)

### Community 2 - "Home.tsx"
Cohesion: 0.06
Nodes (53): vite, @vitejs/plugin-react, FeedbackStatusBadge(), FeedbackTypeBadge(), StatusBadgeProps, TypeBadgeProps, FeedbackForm(), FeedbackFormProps (+45 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (65): lucide-react, react-router-dom, Alert(), AlertProps, AlertType, HairlineGrid(), HairlineGridProps, KULogo() (+57 more)

### Community 4 - "Home.tsx"
Cohesion: 0.10
Nodes (34): Accordion(), Badge(), BadgeProps, BadgeVariant, TextProximity(), HeroSlideshow(), StaggerGrid(), StaggerGridProps (+26 more)

### Community 5 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, autoprefixer, exceljs, lucide-react, motion, postcss, react, react-dom (+36 more)

### Community 6 - "Technical Overview: Coders Club Web Platform & Administrative System"
Cohesion: 0.06
Nodes (35): 10.1 Five Technical Strengths, 10.2 Four Limitations & Areas to Improve, 10.3 Realistic Future Enhancements, 10.4 Five Interesting Technical Facts, 10. Challenges, Strengths & Future Scope, 12.1 Design Audit Matrix, 12.2 Standards Compliance Summary, 12.3 Top 5 Recommended Design & Accessibility Improvements (+27 more)

### Community 7 - "HalftoneAvatar.tsx"
Cohesion: 0.07
Nodes (22): exceljs, @supabase/supabase-js, localEnv, localEnv, targetEmail, supabase, assert(), run() (+14 more)

### Community 8 - "AdminStudents.tsx"
Cohesion: 0.07
Nodes (27): 1.1 Prerequisites, 1.2 Installation, 1.3 Quality Checks & Production Build, 1. Quickstart & Zero-Setup Run, 2. Environment Configuration, 3.1 Initial Setup, 3.2 Database Schema Overview, 3.3 Atomic Stored Procedures (+19 more)

### Community 9 - "Register.tsx"
Cohesion: 0.12
Nodes (31): QrTicket(), QrTicketProps, fetchEventById(), fetchEventBySlug(), fetchPublishedEvents(), fetchStudentRegistrations(), registerForEvent(), registerStudentForEvent() (+23 more)

### Community 10 - "HalftoneAvatar.tsx"
Cohesion: 0.11
Nodes (36): Footer(), getInitials(), HalftoneAvatar(), HalftoneAvatarProps, parseColor(), smoothstep(), computeDotRadius(), createRng() (+28 more)

### Community 11 - "api.ts"
Cohesion: 0.06
Nodes (75): BRAILLE_CHARS, BrailleOrbitIllustration(), EmptyState(), EmptyStateProps, SieveIllustration(), AdminTableSkeleton(), GalleryCardSkeleton(), ProjectCardSkeleton() (+67 more)

### Community 12 - "CursorProvider.tsx"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 14 - "Skeleton.tsx"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 323 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `useReducedMotion`, `Home.tsx`, `package.json`, `Home.tsx`, `package.json`, `Register.tsx`, `HalftoneAvatar.tsx`, `api.ts`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `postcss`, `tailwindcss` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.05280437756497948 - nodes in this community are weakly interconnected._
- **Why does `Technical Overview: Coders Club Web Platform & Administrative System` connect `Technical Overview: Coders Club Web Platform & Administrative System` to `useReducedMotion`, `package.json`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `useReducedMotion` be split into smaller, more focused modules?**
  _Cohesion score 0.05413469735720375 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `package.json` to `react`, `useReducedMotion`, `Home.tsx`, `Home.tsx`, `package.json`, `Register.tsx`, `HalftoneAvatar.tsx`, `api.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `Home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05970149253731343 - nodes in this community are weakly interconnected._