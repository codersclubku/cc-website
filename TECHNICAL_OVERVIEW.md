# Technical Overview: Coders Club Web Platform & Administrative System

---

## 1. Project Summary

The **Coders Club Public Website & Administrative Platform** (`cc-website`) is the official digital web platform and management system for **Coders Club**, a student-run technical community at **Kishkinda University**. The platform serves a dual purpose: it acts as a public-facing portal for university students to discover open-source software projects, browse upcoming workshops, view campus photographic records, and sign up for technical hackathons; simultaneously, it provides an internal administrative dashboard for faculty coordinators and student club leads to manage student registries, verify event attendance via on-site check-in codes, track feedback, broadcast campus announcements, and export audited student rosters.

The platform operates online under canonical production deployment `https://codersclubku.vercel.app` and institutional alias `codersclub.kishkindauniversity.edu.in` (referenced in [`src/content/site.ts`](file:///c:/CC%20Website/src/content/site.ts), [`public/robots.txt`](file:///c:/CC%20Website/public/robots.txt), and [`public/.well-known/security.txt`](file:///c:/CC%20Website/public/.well-known/security.txt)). It was engineered to run with zero external setup overhead: when external cloud services are offline or unconfigured, the frontend automatically falls back to an internal resilient mock layer, enabling instant offline development, visual testing, and design evaluation.

---

## 2. Tech Stack

| Technology | Category | Version | Role in Project | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **React** | Frontend UI Library | `^19.3.1` | Core component architecture and reactive DOM rendering | [`package.json`](file:///c:/CC%20Website/package.json#L19) |
| **React DOM** | DOM Renderer | `^19.3.1` | Browser DOM mount and hydration target | [`package.json`](file:///c:/CC%20Website/package.json#L20) |
| **TypeScript** | Language & Compiler | `~6.0.3` | Static typing, interface definitions, and compile-time verification | [`package.json`](file:///c:/CC%20Website/package.json#L32) |
| **Vite** | Build Tool & Dev Server | `^8.3.4` | Hot Module Replacement (HMR), dev server, and Rollup production bundler | [`package.json`](file:///c:/CC%20Website/package.json#L33) |
| **React Router DOM** | Client-Side Routing | `^7.18.4` | Declarative SPA page routing, parameter parsing, and protected layouts | [`package.json`](file:///c:/CC%20Website/package.json#L21) |
| **Tailwind CSS** | Styling Framework | `^3.4.19` | Utility-first responsive CSS styling with custom theme variable mapping | [`package.json`](file:///c:/CC%20Website/package.json#L22) |
| **PostCSS** | CSS Processing | `^8.5.31` | Post-processing pipeline for Tailwind and CSS transforms | [`package.json`](file:///c:/CC%20Website/package.json#L18) |
| **Autoprefixer** | CSS Tooling | `^10.6.1` | Automated vendor prefixing across browser targets | [`package.json`](file:///c:/CC%20Website/package.json#L14) |
| **Motion (`motion`)** | Motion & Animation | `^14.4.0` | Route transitions, hover physics, and reduced-motion compliant UI motion | [`package.json`](file:///c:/CC%20Website/package.json#L17) |
| **Lucide React** | Icon System | `^1.60.0` | Accessible SVG iconography across navigation, badges, and admin actions | [`package.json`](file:///c:/CC%20Website/package.json#L16) |
| **ExcelJS** | Spreadsheet Engine | `^4.4.0` | Client-side multi-sheet `.xlsx` generation with formula-injection defenses | [`package.json`](file:///c:/CC%20Website/package.json#L15) |
| **Zod** | Validation Library | `^4.6.7` | Type-safe schema declaration and runtime input validation for forms/APIs | [`package.json`](file:///c:/CC%20Website/package.json#L23) |
| **Supabase JS Client** | BaaS / Database Client | `^2.118.0` | PostgreSQL client, authentication sessions, and storage bucket access | [`package.json`](file:///c:/CC%20Website/package.json#L13) |
| **Oxlint** | Code Quality / Linting | `^1.88.0` | High-performance Rust-based linter for React and TypeScript | [`package.json`](file:///c:/CC%20Website/package.json#L31) |
| **@axe-core/react** | Accessibility Scanner | `^4.14.0` | Dev-mode runtime accessibility monitoring and console warning reports | [`package.json`](file:///c:/CC%20Website/package.json#L26) |
| **Web Vitals** | Performance Telemetry | `^6.2.3` | Real-user Core Web Vitals monitoring (CLS, INP, LCP, FCP, TTFB) in dev mode | [`package.json`](file:///c:/CC%20Website/package.json#L34) |
| **Raleway** | Typography (Display/Body) | Google Fonts CDN | Primary typeface for headings, navigational labels, body paragraphs | [`index.html`](file:///c:/CC%20Website/index.html#L25-L30) |
| **JetBrains Mono** | Typography (Monospace) | Google Fonts CDN | Monospace typeface for USNs, confirmation codes, dates, and buttons | [`index.html`](file:///c:/CC%20Website/index.html#L25-L30) |
| **Vercel** | Hosting & Edge Headers | Edge Platform | Production SPA routing rewrites and strict HTTP security headers | [`vercel.json`](file:///c:/CC%20Website/vercel.json#L1-L43) |

---

## 3. Project Structure

```
CC Website/
├── .github/
│   └── dependabot.yml           # Automated weekly npm dependency update configuration
├── data/
│   └── feedback.json            # Local JSON persistent datastore for the feedback API
├── docs/
│   ├── QA.md                    # Verification matrix covering linter, builds, and CDP tests
│   └── qa/                      # Headless Chromium visual captures across all 24 routes
├── public/
│   ├── .well-known/
│   │   └── security.txt         # RFC 9116 security vulnerability disclosure policy
│   ├── assets/
│   │   ├── campus/              # Multi-resolution WebP and JPEG campus hero imagery
│   │   └── kishkinda-logo.png   # Kishkinda University institutional crest
│   ├── _redirects               # SPA rewrite rule for Netlify and Cloudflare Pages
│   ├── favicon.svg              # Vector brand favicon with light/dark media variants
│   └── robots.txt               # Search engine crawler crawl rules and sitemap pointer
├── scripts/
│   ├── audit-routes.mjs         # Headless browser route traversal and CDP verification
│   ├── compute-contrast.mjs     # Color contrast calculation script for WCAG 2.1 AA audits
│   ├── make-admin.mjs           # CLI script to grant admin roles via Supabase service key
│   ├── verify-backend.mjs       # Audit script for PostgreSQL RLS policies and procedures
│   └── verify-excel.mjs         # Verification script for ExcelJS generation and sanitization
├── src/
│   ├── main.tsx                 # Application entry point mounting React root and dev monitors
│   ├── App.tsx                  # Top-level route declarations, layout wrappers, and providers
│   ├── index.css                # Global Tailwind directives and CSS custom properties
│   ├── assets/                  # Bundled static image assets (hero artwork)
│   ├── components/              # 37 reusable presentation and UI building blocks
│   │   ├── cursor/              # Custom magnetic cursor system and proximity interactions
│   │   ├── feedback/            # Floating modal, drawer, and feedback submission components
│   │   ├── halftone/            # Algorithmic halftone portrait canvas rendering
│   │   ├── Header.tsx           # Global top navigation bar with theme and auth controls
│   │   ├── Footer.tsx           # Institutional footer, social links, and legal disclosures
│   │   ├── BottomTabBar.tsx     # Mobile-first floating navigation tab bar (<768px)
│   │   ├── Button.tsx           # Standardized button component with focus ring styles
│   │   ├── QrTicket.tsx         # Ticket generator rendering attendee confirmation codes
│   │   └── ProtectedRoute.tsx   # Route gate redirecting unauthenticated users to /signin
│   ├── content/                 # Static content registries and institutional metadata
│   │   ├── copy.ts              # Hero copy, principles, and FAQ string declarations
│   │   ├── people.ts            # Faculty coordinators, office bearers, and team directory
│   │   └── site.ts              # Club constants, social links, and university URLs
│   ├── context/                 # Application-wide React Context state providers
│   │   ├── AuthContext.tsx      # Supabase authentication session and profile state
│   │   └── ThemeContext.tsx     # Theme switcher syncing light/dark mode and localStorage
│   ├── hooks/                   # Custom reusable React hooks
│   │   └── useReducedMotion.ts  # Media query listener respecting prefers-reduced-motion
│   ├── lib/                     # Core business logic, APIs, and client utility routines
│   │   ├── api.ts               # Supabase queries, atomic RPC calls, and mock fallbacks
│   │   ├── excelExport.ts       # Multi-sheet Excel workbook generator using ExcelJS
│   │   ├── feedbackApi.ts       # Client API client for feedback submission and retrieval
│   │   ├── supabase.ts          # Supabase client instantiation and connection validation
│   │   └── validation.ts        # Zod validation schemas and formula sanitization helpers
│   ├── pages/                   # Public and student-facing view components
│   │   ├── Home.tsx             # Landing page with hero carousel, stats, and spotlight cards
│   │   ├── Events.tsx           # Filterable workshop, hackathon, and demo day catalog
│   │   ├── EventDetail.tsx      # Comprehensive event briefing with live seat counters
│   │   ├── Register.tsx         # Multi-step event registration wizard
│   │   ├── Projects.tsx         # Student open-source software portfolio
│   │   ├── Team.tsx             # Member directory featuring algorithmic halftone portraits
│   │   ├── Account.tsx          # Student dashboard showing active registration passes
│   │   └── admin/               # 11 administrative dashboard views
│   │       ├── AdminLayout.tsx  # Admin navigation shell with role verification
│   │       ├── AdminCheckIn.tsx # Live on-site attendee check-in and QR ticket scanner
│   │       └── AdminFeedback.tsx# Feedback review table, filters, and status updater
│   └── server/                  # Local development server middleware
│       ├── feedbackMiddleware.ts# Express/Connect middleware for feedback REST endpoints
│       └── feedbackVitePlugin.ts# Vite plugin bridging HTTP middleware into dev server
├── supabase/
│   ├── schema.sql               # Consolidated database schema, RLS policies, and triggers
│   └── migrations/              # Database migration scripts tracking schema changes
├── .env.example                 # Example environment variable template (no secrets)
├── .gitignore                   # Version control ignore rules for artifacts, env, and node_modules
├── .oxlintrc.json               # Oxlint configuration enforcing React and TypeScript rules
├── package.json                 # Project manifest declaring dependencies and build scripts
├── tailwind.config.js           # Tailwind CSS configuration mapping custom CSS variables
├── tsconfig.app.json            # Strict TypeScript compiler options for the application
├── vercel.json                  # Production hosting configuration and HTTP security headers
└── vite.config.ts               # Vite configuration injecting plugins and CSP headers
```

### Key Entry Points
- **HTML Entry**: [`index.html`](file:///c:/CC%20Website/index.html) — Sets up the HTML5 viewport, dark mode inline script (to prevent flash-of-unstyled-content), preconnects to Google Fonts, and mounts `<div id="root">`.
- **Application Bootstrapper**: [`src/main.tsx`](file:///c:/CC%20Website/src/main.tsx) — Initializes React 19 `createRoot`, attaches `@axe-core/react` and `web-vitals` in development mode, and mounts `App`.
- **Routing Hub**: [`src/App.tsx`](file:///c:/CC%20Website/src/App.tsx) — Configures `BrowserRouter`, wraps providers (`ThemeProvider`, `AuthProvider`, `CursorProvider`), and declares code-split lazy routes.
- **Build & Dev Gateway**: [`vite.config.ts`](file:///c:/CC%20Website/vite.config.ts) — Configures Vite plugins (React, Feedback middleware) and enforces local HTTP security response headers.
- **Database Engine**: [`supabase/schema.sql`](file:///c:/CC%20Website/supabase/schema.sql) — Initializes PostgreSQL tables, RLS policies, security triggers, and atomic booking procedures.

---

## 4. Architecture & How It Works

### 4.1 Page Load and Request Flow
1. **Initial Request**: The user's browser requests the root URL. The hosting provider (Vercel or Netlify) serves [`index.html`](file:///c:/CC%20Website/index.html) along with strict HTTP security headers (CSP, HSTS, X-Frame-Options) defined in [`vercel.json`](file:///c:/CC%20Website/vercel.json).
2. **Immediate Theme Resolution**: An inline script in [`index.html`](file:///c:/CC%20Website/index.html#L32-L48) evaluates `localStorage.getItem('cc-theme')` or falls back to `prefers-color-scheme`. It applies the `data-theme` attribute to `<html>` prior to stylesheet execution, eliminating screen flicker.
3. **Module Loading & Code Splitting**: [`src/main.tsx`](file:///c:/CC%20Website/src/main.tsx) executes and mounts [`src/App.tsx`](file:///c:/CC%20Website/src/App.tsx). All route components are wrapped in `React.lazy()` dynamic imports. The browser downloads only the minimal vendor/core bundle, fetching page chunks on demand.
4. **Context Initialization**: `ThemeProvider` and `AuthProvider` initialize simultaneously. `AuthProvider` reads the current session token from Supabase via `supabase.auth.getSession()` ([`src/context/AuthContext.tsx`](file:///c:/CC%20Website/src/context/AuthContext.tsx#L70)). If an authenticated session is detected, it queries user roles via `checkIsAdmin` and retrieves the student record via `fetchStudentProfile`.
5. **Data Hydration & Fallback Shield**: Components call data functions in [`src/lib/api.ts`](file:///c:/CC%20Website/src/lib/api.ts). If Supabase credentials are missing or the cloud service is unreachable, `api.ts` gracefully resolves simulated mock data, preventing application crashes.

### 4.2 Architecture Diagram

```
[ User Browser ]
       │
       ▼
[ Reverse Proxy / CDN (Vercel / Netlify / Vite Dev Server) ]
       │  (Enforces CSP, HSTS, X-Frame-Options, SPA Rewrites)
       ▼
[ index.html -> src/main.tsx -> src/App.tsx ]
       │
       ├── ThemeProvider (Manages 'cc-theme' & DOM data-theme attribute)
       ├── AuthProvider  (Manages AuthUser, StudentProfile, Role Validation)
       ├── CursorProvider (Physics-driven magnetic cursor & proximity store)
       └── ErrorBoundary (Top-level failure isolation shield)
             │
             ├── PublicLayout (Header, SkipLink, Footer, BottomTabBar, FloatingReportButton)
             │     └── Lazy Routes: Home, Events, Projects, Team, Gallery, etc.
             │
             └── AdminLayout (Role Guard -> is_admin() validation)
                   └── Admin Lazy Routes: Dashboard, Check-In, Students, Export, Feedback
                         │
                         ▼
             [ Data Abstraction Layer: src/lib/api.ts ]
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[ Live Cloud Mode ]              [ Resilient Fallback Mode ]
Supabase PostgreSQL & Auth       Local In-Memory Mock Data
- Stored Procedures (Atomic RPC)  - Default Events, Projects, FAQs
- Row Level Security (RLS)       - Local Feedback Store (data/feedback.json)
- Row Locks (FOR UPDATE)
```

### 4.3 Component & State Hierarchy
- **`ErrorBoundary`** ([`src/components/ErrorBoundary.tsx`](file:///c:/CC%20Website/src/components/ErrorBoundary.tsx)): Isolates runtime crashes, presenting actionable diagnostic screens.
- **`ThemeProvider`** ([`src/context/ThemeContext.tsx`](file:///c:/CC%20Website/src/context/ThemeContext.tsx)): Broadcasts theme state (`light` | `dark`) and provides a reactive toggle.
- **`AuthProvider`** ([`src/context/AuthContext.tsx`](file:///c:/CC%20Website/src/context/AuthContext.tsx)): Handles sign-up, sign-in, password reset, profile refresh, and account deletion.
- **`PublicLayout` vs `AdminLayout`**: Public routes share header, footer, bottom navigation bar, and feedback triggers; admin routes are isolated within a dedicated sidebar layout guarded by `checkIsAdmin()` verification.

---

## 5. Key Features & Pages

The application defines 31 distinct route paths in [`src/App.tsx`](file:///c:/CC%20Website/src/App.tsx):

### 5.1 Public & Student Routes
1. **Home (`/`)** ([`src/pages/Home.tsx`](file:///c:/CC%20Website/src/pages/Home.tsx)): Features hero carousel ([`HeroSlideshow.tsx`](file:///c:/CC%20Website/src/components/HeroSlideshow.tsx)), dynamic club statistics counter ([`NumberTicker.tsx`](file:///c:/CC%20Website/src/components/NumberTicker.tsx)), spotlight feature cards ([`SpotlightCard.tsx`](file:///c:/CC%20Website/src/components/SpotlightCard.tsx)), and upcoming event teasers.
2. **About (`/about`)** ([`src/pages/About.tsx`](file:///c:/CC%20Website/src/pages/About.tsx)): Displays club mission, vision, guiding principles, weekly schedule, and expandable accordion FAQs ([`Accordion.tsx`](file:///c:/CC%20Website/src/components/Accordion.tsx)).
3. **Events Catalog (`/events`)** ([`src/pages/Events.tsx`](file:///c:/CC%20Website/src/pages/Events.tsx)): Lists workshops, hackathons, and demo days with search and filter tabs (Upcoming vs. Past).
4. **Event Details (`/events/:slug`)** ([`src/pages/EventDetail.tsx`](file:///c:/CC%20Website/src/pages/EventDetail.tsx)): Comprehensive event briefing with prerequisites, time schedule, venue, live seat indicators, and calendar export (`.ics`).
5. **Event Registration (`/register` & `/events/:slug/register`)** ([`src/pages/Register.tsx`](file:///c:/CC%20Website/src/pages/Register.tsx)): Booking flow checking student authentication, seat capacity limits, and duplicate bookings.
6. **Projects Catalog (`/projects`)** ([`src/pages/Projects.tsx`](file:///c:/CC%20Website/src/pages/Projects.tsx)): Displays student open-source software portfolio with status badges (In Progress, Planned, Live) and tech stack pills.
7. **Project Details (`/projects/:slug`)** ([`src/pages/ProjectDetail.tsx`](file:///c:/CC%20Website/src/pages/ProjectDetail.tsx)): Deep-dive documentation for projects, showcasing architecture details, contribution guidelines, and direct GitHub links.
8. **Team Directory (`/team`)** ([`src/pages/Team.tsx`](file:///c:/CC%20Website/src/pages/Team.tsx)): Directory of faculty coordinators, office bearers, and technical leads with interactive halftone particle avatars ([`HalftoneAvatar.tsx`](file:///c:/CC%20Website/src/components/halftone/HalftoneAvatar.tsx)) and detailed member modal dialogs ([`MemberDialog.tsx`](file:///c:/CC%20Website/src/components/MemberDialog.tsx)).
9. **Gallery (`/gallery`)** ([`src/pages/Gallery.tsx`](file:///c:/CC%20Website/src/pages/Gallery.tsx)): Photographic record of university technical sessions with interactive lightbox image modal.
10. **Contact (`/contact`)** ([`src/pages/Contact.tsx`](file:///c:/CC%20Website/src/pages/Contact.tsx)): Public contact form protected by client/server Zod validation, rate limiting, and a honeypot field.
11. **Feedback System (`/feedback`)** ([`src/pages/Feedback.tsx`](file:///c:/CC%20Website/src/pages/Feedback.tsx)): Multi-channel student feedback and bug reporting form with live character counters, screenshot previews, and device diagnostics collection.
12. **Privacy Notice (`/privacy`)** ([`src/pages/Privacy.tsx`](file:///c:/CC%20Website/src/pages/Privacy.tsx)): Explains student data governance, consent recording, and account removal procedures.
13. **Sign Up (`/signup`)** ([`src/pages/SignUp.tsx`](file:///c:/CC%20Website/src/pages/SignUp.tsx)): Student onboarding validating university email domains, USN format, weak passwords, and privacy consent.
14. **Sign In (`/signin`)** ([`src/pages/SignIn.tsx`](file:///c:/CC%20Website/src/pages/SignIn.tsx)): Authenticates students via email/password or Google OAuth.
15. **Forgot Password (`/forgot-password`)** ([`src/pages/ForgotPassword.tsx`](file:///c:/CC%20Website/src/pages/ForgotPassword.tsx)): Password recovery form issuing reset tokens.
16. **Reset Password (`/reset-password`)** ([`src/pages/ResetPassword.tsx`](file:///c:/CC%20Website/src/pages/ResetPassword.tsx)): Allows users with a valid recovery token to establish a new password.
17. **Student Account (`/account`)** ([`src/pages/Account.tsx`](file:///c:/CC%20Website/src/pages/Account.tsx)): Protected student portal displaying personal USN details, booked event passes, waitlist status, and digital QR admission tickets ([`QrTicket.tsx`](file:///c:/CC%20Website/src/components/QrTicket.tsx)).
18. **Admin Login (`/admin/login`)** ([`src/pages/admin/AdminLogin.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminLogin.tsx)): Dedicated administrator authentication gateway.
19. **Not Found (`*`)** ([`src/pages/NotFound.tsx`](file:///c:/CC%20Website/src/pages/NotFound.tsx)): Accessible 404 page offering navigation recovery links.

### 5.2 Administrative Management Routes (`/admin/*`)
20. **Admin Dashboard (`/admin`)** ([`src/pages/admin/AdminDashboard.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminDashboard.tsx)): Overview of key metrics (active students, event bookings, unread messages).
21. **Students Directory (`/admin/students`)** ([`src/pages/admin/AdminStudents.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminStudents.tsx)): Roster search, department filtering, profile inspection, and multi-sheet Excel export.
22. **Team Management (`/admin/team`)** ([`src/pages/admin/AdminTeam.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminTeam.tsx)): CRUD operations for faculty coordinators, leads, and club organizers.
23. **Events Management (`/admin/events`)** ([`src/pages/admin/AdminEvents.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminEvents.tsx)): Event creation, capacity definition, venue configuration, and cancellation cutoffs.
24. **Registrations Roster (`/admin/registrations`)** ([`src/pages/admin/AdminRegistrations.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminRegistrations.tsx)): Complete registry of student bookings, waitlist orders, and attendance statuses.
25. **Event Check-In (`/admin/check-in`)** ([`src/pages/admin/AdminCheckIn.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminCheckIn.tsx)): On-site check-in console allowing manual code input or automated QR scanning.
26. **Announcements (`/admin/announcements`)** ([`src/pages/admin/AdminAnnouncements.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminAnnouncements.tsx)): Broadcast publisher with pinned priority flags and target audience filters.
27. **Projects Management (`/admin/projects`)** ([`src/pages/admin/AdminProjects.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminProjects.tsx)): Editor for student projects catalog.
28. **Gallery Uploads (`/admin/gallery`)** ([`src/pages/admin/AdminGallery.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminGallery.tsx)): Image uploader with 5MB file-size limits and preview generation.
29. **Messages Console (`/admin/messages`)** ([`src/pages/admin/AdminMessages.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminMessages.tsx)): Viewer for student inquiries submitted via the contact form.
30. **Feedback Administration (`/admin/feedback`)** ([`src/pages/admin/AdminFeedback.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminFeedback.tsx)): Internal issue tracker for bug submissions, severity assignment, status progression, and notes.

---

## 6. Design System & UI Implementation

### 6.1 Styling Architecture
The design system combines **Tailwind CSS** utility classes with CSS custom properties defined in [`src/index.css`](file:///c:/CC%20Website/src/index.css) and [`src/styles/fonts.css`](file:///c:/CC%20Website/src/styles/fonts.css). This architecture enables instant dark/light theme switching by altering CSS variables on the `:root` element without re-rendering the component tree.

### 6.2 Color Palette

| Token Role | Light Mode Value | Dark Mode Value | Usage Context |
| :--- | :--- | :--- | :--- |
| **`--bg`** | `#FAF8FC` | `#10002B` | Root page background |
| **`--bg-brand`** | `#240046` | `#240046` | Hero surfaces and brand accents |
| **`--surface-1`** | `#FFFFFF` | `#240046` | Primary card and container surfaces |
| **`--surface-2`** | `#F5EEFA` | `#3C096C` | Raised surfaces and interactive chips |
| **`--surface-3`** | `#EAE0F5` | `#4C0F7E` | Sunken backgrounds and inset wells |
| **`--border`** | `#E0AAFF` | `#5A189A` | Standard border lines |
| **`--border-strong`** | `#7B2CBF` | `#9D4EDD` | Emphasized dividers and input borders |
| **`--text`** | `#240046` | `#ECE5F4` | Primary body and heading typography |
| **`--text-muted`** | `#5A4A72` | `#C4B7D6` | Secondary labels and metadata |
| **`--primary`** | `#5A189A` | `#C77DFF` | Primary action buttons and links |
| **`--accent`** | `#C9A7F5` | `#E0AAFF` | Badges, spotlight glows, and focus rings |
| **`--color-success`** | `#4ADE80` (Text: `#15803D`) | `#4ADE80` | Confirmed bookings and successful actions |
| **`--color-danger`** | `#F87171` (Text: `#B91C1C`) | `#F87171` | Validation errors and cancellations |
| **`--color-warning`** | `#FB923C` (Text: `#C2410C`) | `#FB923C` | Closing deadlines and waitlist alerts |
| **`--color-info`** | `#38BDF8` (Text: `#0369A1`) | `#38BDF8` | In-progress projects and tips |

### 6.3 Typography
- **Headings & Body Text**: **Raleway** (weights 400, 500, 600, 700) is used for narrative copy, page titles, and explanatory paragraphs.
- **Machine & Technical Text**: **JetBrains Mono** is used for student USNs, confirmation codes (`CC-YYYY-NNNN`), timestamps, badges, status counters, and button CTAs ([`GLOSSARY.md`](file:///c:/CC%20Website/GLOSSARY.md#L69-L70)).

### 6.4 Responsive Breakpoints & Mobile Optimization
The site adheres to Tailwind CSS standard breakpoints:
- `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- On mobile screens (`<768px`), the desktop navigation collapses, and an app-like floating bottom navigation bar ([`src/components/BottomTabBar.tsx`](file:///c:/CC%20Website/src/components/BottomTabBar.tsx)) mounts at the base of the screen, with safe-area insets (`env(safe-area-inset-bottom)`) applied to prevent overlaps.

---

## 7. Data, APIs & Integrations

### 7.1 Data Sources
1. **Static Content**: Club constants, leadership rosters, guiding principles, and FAQ items are managed in TypeScript content registries:
   - [`src/content/people.ts`](file:///c:/CC%20Website/src/content/people.ts) — Faculty sponsors, executive office bearers, web masters, and organizers.
   - [`src/content/site.ts`](file:///c:/CC%20Website/src/content/site.ts) — Official contact channels, social handles, and university links.
   - [`src/content/copy.ts`](file:///c:/CC%20Website/src/content/copy.ts) — Platform microcopy, mission statements, and FAQ entries.
2. **Cloud Database (Supabase PostgreSQL)**: Active student accounts, workshop entries, bookings, and audit records reside in PostgreSQL.
3. **Local Development API**: A Vite dev server middleware plugin ([`src/server/feedbackMiddleware.ts`](file:///c:/CC%20Website/src/server/feedbackMiddleware.ts)) exposes a RESTful endpoint (`/api/feedback`) writing to [`data/feedback.json`](file:///c:/CC%20Website/data/feedback.json).

### 7.2 Database Schema & Models
Declared in [`supabase/schema.sql`](file:///c:/CC%20Website/supabase/schema.sql):

```
┌──────────────────┐       1:N       ┌─────────────────────┐
│  public.events   │────────────────<│ public.registrations │
│ (id, title, max) │                 │(id, code, status)   │
└──────────────────┘                 └─────────────────────┘
                                                │ N:1
┌──────────────────┐       1:1                  ▼
│   auth.users     │───────────────-[ public.profiles ]
│(Supabase Auth Id)│                 │(id, usn, dept, year)│
└──────────────────┘                 └─────────────────────┘
         │ 1:1
         ▼
┌──────────────────┐
│public.admin_roles│
│ (user_id, role)  │
└──────────────────┘
```

- **`profiles`**: Enforces unique University Student Numbers (`usn`), student departments, and academic years. Protected by a trigger (`trg_guard_profile_updates`) that blocks non-administrators from tampering with USNs or IDs.
- **`events`**: Workshop and hackathon schedules, capacity caps, venue descriptions, and cancellation cutoffs.
- **`events_public` (SQL View)**: Exposes public seat metrics (`capacity`, `registered_count`, `spots_left`) without leaking personal student identities.
- **`registrations`**: Student event bookings with unique confirmation codes (`CC-YYYY-NNNN`).
- **`admin_roles`**: Administrative permissions (`admin`), checked via `SECURITY DEFINER` functions `is_admin()` and `has_role()`.
- **`consents`**: Audit logs of privacy policy acceptance versions.
- **`export_log`**: Administrative audit trail tracking timestamps, operator IDs, row counts, and filters used during student roster exports.
- **`contact_messages` & `contact_rate_limit`**: Public contact form storage backed by hourly per-email rate limiting.
- **`feedback`**: Issue tracking records with severity, categories, diagnostics, and coordinator notes.

### 7.3 Third-Party Integrations
- **Supabase Cloud**: Authentication sessions (email/password and Google OAuth), PostgreSQL database queries, and `gallery` storage bucket.
- **Google Fonts CDN**: Preconnected delivery of Raleway and JetBrains Mono typefaces.
- **No external analytics or marketing pixels**: The codebase does not load Google Analytics, Facebook Pixel, or third-party trackers, respecting user privacy.

---

## 8. Performance, SEO & Accessibility

### 8.1 Performance Optimizations
- **Route-Level Code Splitting**: All pages are code-split via `React.lazy()` and rendered within a `<Suspense>` boundary in [`src/App.tsx`](file:///c:/CC%20Website/src/App.tsx#L17-L50), minimizing initial JavaScript bundle size.
- **On-Demand Dynamic Imports**: The heavyweight Excel export library is dynamically fetched only when requested (`const ExcelJS = await import('exceljs')` in [`src/lib/excelExport.ts`](file:///c:/CC%20Website/src/lib/excelExport.ts#L44)).
- **Responsive WebP Images**: Campus background images in [`public/assets/campus/`](file:///c:/CC%20Website/public/assets/campus/) are pre-rendered in WebP format at 1600w and 2400w variants to reduce network bandwidth.
- **Asset Preconnecting**: Preconnect tags for `fonts.googleapis.com` and `fonts.gstatic.com` in [`index.html`](file:///c:/CC%20Website/index.html#L20-L21) accelerate font stylesheet downloads.
- **Telemetric Monitoring**: [`web-vitals`](file:///c:/CC%20Website/src/main.tsx#L11-L17) measures CLS, INP, LCP, FCP, and TTFB in development mode.

### 8.2 Search Engine Optimization (SEO)
- **Metadata**: [`index.html`](file:///c:/CC%20Website/index.html#L9-L15) defines descriptive `<title>`, `<meta name="description">`, and Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`).
- **Crawler Directives**: [`public/robots.txt`](file:///c:/CC%20Website/public/robots.txt) disallows search engines from indexing administrative, account, and API routes (`/admin/`, `/account/`, `/api/`, `/reset-password`).
- **Missing SEO Elements**:
  - `sitemap.xml`: Referenced in `robots.txt` (`Sitemap: https://codersclub.kishkindauniversity.edu.in/sitemap.xml`), but the physical file is not found in the codebase.
  - Twitter Card meta tags (`twitter:card`, `twitter:title`, `twitter:image`) are not declared.
  - Canonical link tags (`<link rel="canonical" ... />`) are missing from `index.html`.

### 8.3 Accessibility (A11y)
- **Skip Link Navigation**: [`src/components/SkipLink.tsx`](file:///c:/CC%20Website/src/components/SkipLink.tsx) provides a keyboard-focusable shortcut that jumps focus directly to `<main id="main-content">`.
- **Motion Reduction**: [`src/hooks/useReducedMotion.ts`](file:///c:/CC%20Website/src/hooks/useReducedMotion.ts) queries `prefers-reduced-motion: reduce`. When detected, transitions in `App.tsx` and Framer Motion components drop opacity changes and translation animations.
- **Automated Dev Auditing**: [`@axe-core/react`](file:///c:/CC%20Website/src/main.tsx#L7-L9) audits the live DOM 1,000ms after render in development mode, logging violations directly to the developer console.
- **Contrast Ratios**: Verified via [`scripts/compute-contrast.mjs`](file:///c:/CC%20Website/scripts/compute-contrast.mjs); all body text exceeds WCAG AA 4.5:1, reaching up to 16.82:1 in light mode and 16.16:1 in dark mode.

---

## 9. Build, Deployment & Dev Workflow

### 9.1 Local Setup and Scripts
The project requires **Node.js v18+** (Node 20+ recommended) and **npm v9+**.

```bash
# 1. Clone the project and navigate to the root directory
cd "CC Website"

# 2. Install dependencies
npm install

# 3. Launch local development server (runs at http://localhost:5173)
npm run dev

# 4. Execute Oxlint static analysis
npm run lint

# 5. Type-check TypeScript and build production bundle
npm run build

# 6. Preview the production build locally
npm run preview
```

### 9.2 Build Process & Deployment
- **Bundler**: Vite compiles TypeScript and packages assets into the `dist/` directory using Rollup.
- **Hosting Platforms**:
  - **Vercel**: Managed via [`vercel.json`](file:///c:/CC%20Website/vercel.json), which establishes client-side SPA routing rewrites to `/index.html` and injects production HTTP security headers.
  - **Netlify & Cloudflare Pages**: Supported via [`public/_redirects`](file:///c:/CC%20Website/public/_redirects) with wildcard rewrite rules (`/*  /index.html  200`).
- **CI/CD & Maintenance**:
  - Automated dependency audits are configured in [`.github/dependabot.yml`](file:///c:/CC%20Website/.github/dependabot.yml) with weekly schedules for npm packages.
  - GitHub Actions workflow files (`.github/workflows/`) are **not found in codebase**.

### 9.3 Environment Variables
All environment configuration keys are declared in [`.env.example`](file:///c:/CC%20Website/.env.example):
- `VITE_SUPABASE_URL`: Public Supabase API project endpoint.
- `VITE_SUPABASE_ANON_KEY`: Public anonymous Supabase key for client-side queries.
- `VITE_ALLOWED_EMAIL_DOMAIN`: University email domain restriction (e.g. `kishkindauniversity.edu.in`).
- `VITE_SITE_URL`: Production domain URL used for CORS verification.
- `SUPABASE_SERVICE_ROLE_KEY`: Privileged secret key used exclusively by administrative backend verification scripts (never exposed to client bundles).
- `FEEDBACK_ADMIN_KEY`: Optional secret key required to access administrative feedback endpoints.

### 9.4 Version Control
The project maintains a comprehensive [`.gitignore`](file:///c:/CC%20Website/.gitignore) excluding `node_modules`, `dist`, logs, editor workspaces, and all local environment files (`.env`, `.env.*`, `*.local`). Note: A `.git` metadata directory was **not found in the workspace root**.

---

## 10. Challenges, Strengths & Future Scope

### 10.1 Five Technical Strengths
1. **Zero-Setup Offline Resilience**: The data architecture in [`src/lib/api.ts`](file:///c:/CC%20Website/src/lib/api.ts) contains self-healing mock layers that automatically engage whenever Supabase credentials are missing, allowing instant local testing without backend dependencies.
2. **Atomic Concurrency Protection**: Event registration and waitlist handling are implemented via PostgreSQL stored procedures (`register_student_atomic` and `cancel_registration`) utilizing exclusive row-level locks (`FOR UPDATE`), preventing overbooking race conditions.
3. **Defense-in-Depth Injection Hardening**: All inputs undergo multi-stage sanitization: Zod regex filters out HTML tags, `sanitizeExcelValue` escapes DDE formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`), and PostgreSQL triggers prevent unauthorized profile alteration.
4. **Comprehensive Accessibility Engineering**: Integrates a skip link, reduced-motion adaptations, visible focus tokens, high WCAG contrast (>14:1 for core text), and dev-time automated accessibility auditing with `@axe-core/react`.
5. **Multi-Platform Deployment & Strict Security Headers**: Pre-configured deployment manifests for both Vercel (`vercel.json`) and Netlify (`public/_redirects`) apply full Content Security Policy, HSTS, and frame isolation headers.

### 10.2 Four Limitations & Areas to Improve
1. **Missing Dynamic `sitemap.xml`**: While `robots.txt` points search engines to `sitemap.xml`, the actual XML file is missing from `public/`.
2. **Absence of CI/CD Automated Pipelines**: No continuous integration workflows (e.g., GitHub Actions in `.github/workflows/`) are set up to automatically trigger `npm run lint` and `npm run build` on pull requests.
3. **No Automated Turnstile / CAPTCHA on Public Forms**: While forms utilize honeypot fields (`websiteUrl`) and IP rate limiting, they lack automated cryptographic challenge systems (such as Cloudflare Turnstile) to mitigate advanced automated spam bots.
4. **In-Memory Rate Limiting in Local Dev Middleware**: The rate limiting map in [`src/server/feedbackMiddleware.ts`](file:///c:/CC%20Website/src/server/feedbackMiddleware.ts) uses local Node.js process memory (`new Map()`), which resets upon server restarts.

### 10.3 Realistic Future Enhancements
1. **Automated XML Sitemap Generation**: Implement a post-build script that traverses `src/App.tsx` routes and public events to generate a fresh `public/sitemap.xml` file during `npm run build`.
2. **CI/CD Workflow Automation**: Add a `.github/workflows/ci.yml` action to enforce Oxlint checks, TypeScript compilation, and Edge CDP route audits on every repository push.
3. **Cloudflare Turnstile Integration**: Embed lightweight privacy-preserving CAPTCHA verification on the public registration and contact forms.
4. **Push Notification Support**: Introduce Web Push notifications or automated transactional emails (via Resend or Supabase Edge Functions) to alert students when promoted from waitlists to confirmed seats.

### 10.4 Five Interesting Technical Facts
1. **311 Workspace Files**: The workspace contains 311 files across source code, configuration, static images, and documentation (excluding `node_modules`, `dist`, and `graphify-out`).
2. **31,755 Lines of Code & Configuration**: The codebase spans 31,755 lines across TypeScript, JavaScript, CSS, HTML, SQL, and JSON files.
3. **Zero Dangerous React Escape Hatches**: A strict codebase audit reveals zero uses of `dangerouslySetInnerHTML`, `eval()`, or unescaped `innerHTML`.
4. **37 Modular React Components**: The component catalog houses 37 modular components, ranging from custom magnetic cursor physics to algorithmic halftone canvas particle rendering.
5. **Headless DevTools Protocol Route Verification**: The test suite includes [`scripts/audit-routes.mjs`](file:///c:/CC%20Website/scripts/audit-routes.mjs), which spins up a headless Chromium/Edge instance via WebSocket CDP to traverse and capture full-page screenshots of all routes with zero console errors.

---

## 11. Security Standards & Practices

### 11.1 Security Audit Matrix

| Security Area | Item | Status | Evidence & Implementation Details |
| :--- | :--- | :---: | :--- |
| **HTTPS / TLS** | Enforced HSTS Header | ✅ | Configured in [`vite.config.ts`](file:///c:/CC%20Website/vite.config.ts#L7) and [`vercel.json`](file:///c:/CC%20Website/vercel.json#L18): `Strict-Transport-Security: max-age=31536000; includeSubDomains`. |
| | Mixed Content Prevention | ✅ | All remote assets load strictly over HTTPS (`https://fonts.googleapis.com`, `https://*.supabase.co`). |
| **Security Headers** | Content-Security-Policy | ✅ | Strict CSP in [`vite.config.ts`](file:///c:/CC%20Website/vite.config.ts#L6) & [`vercel.json`](file:///c:/CC%20Website/vercel.json#L14) restricting scripts, styles, frames (`frame-ancestors 'none'`), and objects (`object-src 'none'`). |
| | Clickjacking Prevention | ✅ | `X-Frame-Options: DENY` declared in both [`vite.config.ts`](file:///c:/CC%20Website/vite.config.ts#L9) and [`vercel.json`](file:///c:/CC%20Website/vercel.json#L26). |
| | MIME Sniffing Defense | ✅ | `X-Content-Type-Options: nosniff` declared in [`vite.config.ts`](file:///c:/CC%20Website/vite.config.ts#L8) and [`vercel.json`](file:///c:/CC%20Website/vercel.json#L22). |
| | Referrer Policy | ✅ | `Referrer-Policy: strict-origin-when-cross-origin` in [`vite.config.ts`](file:///c:/CC%20Website/vite.config.ts#L10) and [`vercel.json`](file:///c:/CC%20Website/vercel.json#L30). |
| | Permissions Policy | ✅ | Blocks sensitive device features (`camera=(), microphone=(), geolocation=(), payment=()`) in [`vite.config.ts`](file:///c:/CC%20Website/vite.config.ts#L11). |
| | Cross-Origin Isolation | ✅ | `Cross-Origin-Opener-Policy: same-origin` in [`vite.config.ts`](file:///c:/CC%20Website/vite.config.ts#L12) and [`vercel.json`](file:///c:/CC%20Website/vercel.json#L38). |
| **Input Handling** | Client Input Validation | ✅ | Zod schemas enforce string length, regex patterns, and type boundaries in [`src/lib/validation.ts`](file:///c:/CC%20Website/src/lib/validation.ts) and [`src/lib/feedbackValidation.ts`](file:///c:/CC%20Website/src/lib/feedbackValidation.ts). |
| | Server-Side Validation | ✅ | Backend validation in [`src/server/feedbackMiddleware.ts`](file:///c:/CC%20Website/src/server/feedbackMiddleware.ts#L5) and PostgreSQL database constraints in [`supabase/schema.sql`](file:///c:/CC%20Website/supabase/schema.sql). |
| | Cross-Site Scripting (XSS) | ✅ | Angle brackets and HTML tags rejected via `noHtmlRegex = /^[^<>]*$/` in [`src/lib/validation.ts`](file:///c:/CC%20Website/src/lib/validation.ts#L3); zero instances of `dangerouslySetInnerHTML`. |
| | Spreadsheet Injection | ✅ | `sanitizeExcelValue` in [`src/lib/validation.ts`](file:///c:/CC%20Website/src/lib/validation.ts#L195-L208) prepends `'` to inputs starting with `=+\-@\t\r` to neutralize formula execution. |
| **Authentication** | Password Security | ✅ | Enforces 8-character minimum and verifies against common password dictionary via `isCommonPassword` in [`src/lib/validation.ts`](file:///c:/CC%20Website/src/lib/validation.ts#L5-L26). |
| | User Enumeration Defense | ✅ | Standardized generic messages (`"Email or password is incorrect"` and `"If an account exists..."`) in [`src/context/AuthContext.tsx`](file:///c:/CC%20Website/src/context/AuthContext.tsx#L35-L36). |
| | Protected Student Routes | ✅ | `<ProtectedRoute>` in [`src/components/ProtectedRoute.tsx`](file:///c:/CC%20Website/src/components/ProtectedRoute.tsx) gates access to student account portals. |
| | Role-Based Authorization | ✅ | Admin access governed by `admin_roles` table and PostgreSQL `SECURITY DEFINER` functions `is_admin()` in [`supabase/schema.sql`](file:///c:/CC%20Website/supabase/schema.sql#L12-L25). |
| | Profile Immutability | ✅ | PostgreSQL trigger `trg_guard_profile_updates` in [`supabase/schema.sql`](file:///c:/CC%20Website/supabase/schema.sql#L82) blocks students from altering USNs or profile primary keys. |
| **Bot / Spam Defense** | Honeypot Anti-Spam | ✅ | Hidden `websiteUrl` field with max length 0 rejects automated bot submissions in [`src/lib/validation.ts`](file:///c:/CC%20Website/src/lib/validation.ts#L111). |
| | Rate Limiting | ⚠️ | Feedback API limits IPs to 3 submissions/hr ([`src/server/feedbackMiddleware.ts`](file:///c:/CC%20Website/src/server/feedbackMiddleware.ts#L20)); database limits contact messages to 3/hr; CAPTCHA verification is **missing**. |
| | Timing Attack Mitigation | ✅ | Administrative key comparison utilizes `crypto.timingSafeEqual` in [`src/server/feedbackMiddleware.ts`](file:///c:/CC%20Website/src/server/feedbackMiddleware.ts#L110). |
| **Secrets Management** | Environment Variables | ✅ | Client reads only `VITE_` prefixed variables; `.env` excluded from git in [`.gitignore`](file:///c:/CC%20Website/.gitignore#L14-L16); no committed secrets found in codebase. |
| **Dependencies** | Dependency Auditing | ✅ | Lockfile present ([`package-lock.json`](file:///c:/CC%20Website/package-lock.json)); automated dependency updates tracked in [`.github/dependabot.yml`](file:///c:/CC%20Website/.github/dependabot.yml). |
| **Third-Party CDNs** | Subresource Integrity | ⚠️ | Google Fonts loaded from trusted CDN in [`index.html`](file:///c:/CC%20Website/index.html#L27-L30), but SRI `integrity` checksum attributes are **missing**. |
| **Cookies / Storage** | Storage & Tracking | ✅ | Uses `localStorage` solely for functional preferences (`cc-theme`); no advertising or tracking cookies; Cookie Banner: **Not applicable** (functional storage only). |
| | Security Disclosure | ✅ | Published RFC 9116 security policy in [`public/.well-known/security.txt`](file:///c:/CC%20Website/public/.well-known/security.txt). |
| **Error Handling** | Information Leakage Defense | ✅ | Raw database errors mapped to user-friendly messages via `mapApiError` in [`src/lib/api.ts`](file:///c:/CC%20Website/src/lib/api.ts#L167); React errors isolated by [`ErrorBoundary.tsx`](file:///c:/CC%20Website/src/components/ErrorBoundary.tsx). |

### 11.2 OWASP Top 10 (2021) Mapping

| OWASP Category | Relevance | Implementation & Code Evidence |
| :--- | :--- | :--- |
| **A01:2021 – Broken Access Control** | High | Enforced via PostgreSQL Row Level Security (RLS) on all 12 tables and `SECURITY DEFINER` helper functions (`is_admin()`, `has_role()`) in [`supabase/schema.sql`](file:///c:/CC%20Website/supabase/schema.sql). |
| **A02:2021 – Cryptographic Failures** | Medium | HSTS enabled for 1 year with `includeSubDomains`. Authentication handled via Supabase Auth (bcrypt/Argon2 password hashing). |
| **A03:2021 – Injection** | High | SQL injection mitigated via parameterized Supabase client queries and stored procedures. Formula injection mitigated via `sanitizeExcelValue` in [`src/lib/validation.ts`](file:///c:/CC%20Website/src/lib/validation.ts). |
| **A04:2021 – Insecure Design** | Medium | Multi-layer event capacity locking (`FOR UPDATE`) in `register_student_atomic` prevents overbooking. Honeypot anti-spam fields on all public forms. |
| **A05:2021 – Security Misconfiguration** | High | Complete HTTP security header configuration (CSP, X-Frame-Options, X-Content-Type-Options) in both [`vite.config.ts`](file:///c:/CC%20Website/vite.config.ts) and [`vercel.json`](file:///c:/CC%20Website/vercel.json). |
| **A07:2021 – Identification & Auth Failures** | High | Weak password blocking via `isCommonPassword` dictionary in [`src/lib/validation.ts`](file:///c:/CC%20Website/src/lib/validation.ts). Generic error messages mitigate user enumeration attacks in [`src/context/AuthContext.tsx`](file:///c:/CC%20Website/src/context/AuthContext.tsx). |
| **A09:2021 – Security Logging & Monitoring** | Medium | Student roster exports recorded in `export_log` table via `log_export` stored procedure. Development errors monitored via React ErrorBoundary. |

### 11.3 Top 5 Recommended Security Improvements
1. **Cryptographic CAPTCHA Integration**: Introduce Cloudflare Turnstile or hCaptcha on public registration and contact forms to supplement the current honeypot protection.
2. **Subresource Integrity (SRI) Checksums**: Add `integrity` and `crossorigin` attributes to external font links loaded within [`index.html`](file:///c:/CC%20Website/index.html).
3. **Automated CI/CD Vulnerability Scanning**: Incorporate `npm audit` or Snyk scanning into a GitHub Actions pipeline to prevent known CVEs from entering production.
4. **Persistent Distributed Rate Limiting**: Migrate local dev in-memory rate limiting (`feedbackMiddleware.ts`) to Redis or Supabase Edge Functions for production deployment.
5. **Session Inactivity Timeouts**: Add explicit idle session timeouts for authenticated administrators in [`src/pages/admin/AdminLayout.tsx`](file:///c:/CC%20Website/src/pages/admin/AdminLayout.tsx).

---

## 12. Design Standards & Guidelines Followed

### 12.1 Design Audit Matrix

| Design Standard Area | Status | Evidence & Implementation Details |
| :--- | :---: | :--- |
| **Design Tokens** | ✅ | Full design token scale (colors, spacing `--space-1` to `--space-32`, radii `--radius-xs` to `--radius-full`, elevations `--shadow-1` to `--shadow-5`) defined in [`src/index.css`](file:///c:/CC%20Website/src/index.css#L7-L192) and extended in [`tailwind.config.js`](file:///c:/CC%20Website/tailwind.config.js#L10-L122). |
| **Typography System** | ✅ | Clear dual-font role hierarchy documented in [`GLOSSARY.md`](file:///c:/CC%20Website/GLOSSARY.md#L69-L70): Raleway for editorial copy; JetBrains Mono for data, timestamps, buttons, and badges. |
| **Color & Contrast** | ✅ | WCAG 2.1 AA audited via [`scripts/compute-contrast.mjs`](file:///c:/CC%20Website/scripts/compute-contrast.mjs): Light mode body text achieves 16.82:1; dark mode body text achieves 16.16:1; all semantic buttons exceed the 4.5:1 standard. |
| **Theme Switching** | ✅ | Light and dark themes supported via `data-theme` attribute and CSS custom properties; preference synced with system settings and cached in `localStorage`. |
| **Layout System** | ✅ | Flexbox and CSS Grid layout structures with standard max-width container (`--container: 75rem`), consistent spacing scale, and mobile-first responsive utilities. |
| **Responsive Design** | ✅ | Viewport meta configured in [`index.html`](file:///c:/CC%20Website/index.html#L5) with `viewport-fit=cover`. Desktop navigation converts to a dedicated bottom navigation bar on mobile viewports (<768px). |
| **Accessible Landmarks** | ✅ | Strict semantic HTML5 landmarks throughout: `<header>`, `<main id="main-content">`, `<footer>`, `<nav>`, and `<dialog>`. |
| **Keyboard Accessibility** | ✅ | Direct keyboard skip link in [`src/components/SkipLink.tsx`](file:///c:/CC%20Website/src/components/SkipLink.tsx), accessible tabIndex configurations, and prominent `focus-visible` styling tokens across all interactive elements. |
| **Motion Guidelines** | ✅ | Respects user accessibility preferences via [`src/hooks/useReducedMotion.ts`](file:///c:/CC%20Website/src/hooks/useReducedMotion.ts), gracefully suppressing animations when `prefers-reduced-motion` is active. |
| **Component Consistency** | ✅ | Standardized, reusable components ([`Button.tsx`](file:///c:/CC%20Website/src/components/Button.tsx), [`Badge.tsx`](file:///c:/CC%20Website/src/components/Badge.tsx), [`Alert.tsx`](file:///c:/CC%20Website/src/components/Alert.tsx), [`EmptyState.tsx`](file:///c:/CC%20Website/src/components/EmptyState.tsx), [`Loader.tsx`](file:///c:/CC%20Website/src/components/Loader.tsx)) ensure consistent interactive states (hover, focus, disabled). |
| **Core Web Vitals** | ✅ | WebP responsive images, explicit image dimensions, font preloading, and dynamic code splitting to optimize CLS, LCP, and INP metrics. |
| **Brand Consistency** | ✅ | Cohesive brand violet palette (`#240046`, `#5A189A`, `#C9A7F5`) paired with official Kishkinda University institutional logo components ([`Logo.tsx`](file:///c:/CC%20Website/src/components/Logo.tsx), [`KULogo.tsx`](file:///c:/CC%20Website/src/components/KULogo.tsx)). |
| **Code Quality Standards** | ✅ | Oxlint static analysis rules configured in [`.oxlintrc.json`](file:///c:/CC%20Website/.oxlintrc.json); strict TypeScript checking enabled in [`tsconfig.app.json`](file:///c:/CC%20Website/tsconfig.app.json). |

### 12.2 Standards Compliance Summary

| Recognized Industry Standard | Status | Code Evidence & Technical Justification |
| :--- | :---: | :--- |
| **WCAG 2.1 AA** | ✅ | Contrast ratios computed via `scripts/compute-contrast.mjs` exceed 4.5:1; skip link implemented; semantic landmarks and form labeling in place. |
| **Mobile-First Responsive Design** | ✅ | Fluid Tailwind breakpoint layout with dedicated mobile bottom tab navigation bar and viewport-fit padding. |
| **Semantic HTML5** | ✅ | Pages structured using `<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`, `<article>`, and `<time dateTime="...">`. |
| **Core Web Vitals Readiness** | ✅ | Font preloading, dynamic code splitting, responsive WebP image sets, and real-user monitoring via `web-vitals`. |
| **OWASP Top 10 Awareness** | ✅ | Multi-tier input validation, injection defenses, strict HTTP security headers, and PostgreSQL Row Level Security. |

### 12.3 Top 5 Recommended Design & Accessibility Improvements
1. **Visible Touch Target Expansion**: Expand select small mobile links to meet the minimum 44x44px touch target guideline across all device viewports.
2. **Automated XML Sitemap**: Generate a dynamic `sitemap.xml` file during production build to complete search engine crawler indexing.
3. **Screen Reader Announcement for Dynamic Filters**: Add `aria-live="polite"` regions to the event and project filter bars to announce search result counts to screen reader users.
4. **Enhanced High-Contrast Focus Indicator**: Introduce a double-ring high-contrast focus indicator for dark mode navigation elements to assist low-vision keyboard navigators.
5. **Breadcrumb Navigation**: Introduce accessible breadcrumbs (`<nav aria-label="Breadcrumb">`) across nested routes such as `/events/:slug` and `/projects/:slug`.

---

## Key Numbers

| Metric | Measured Value | Scope & Verification Source |
| :--- | :--- | :--- |
| **Total Registered Routes / Pages** | **31 Routes** | 20 public/account routes + 11 administrative dashboard views in [`src/App.tsx`](file:///c:/CC%20Website/src/App.tsx) |
| **Reusable UI Components** | **37 Components** | Reusable components located in [`src/components/`](file:///c:/CC%20Website/src/components/) |
| **Total Dependencies** | **20 Packages** | 11 production dependencies + 9 developer dependencies in [`package.json`](file:///c:/CC%20Website/package.json) |
| **Workspace Files** | **311 Files** | Project files excluding `node_modules`, `dist`, `graphify-out`, and `.git` |
| **Total Lines of Code & Config** | **31,755 Lines** | Lines across `.ts`, `.tsx`, `.js`, `.mjs`, `.css`, `.html`, `.sql`, and `.json` |
| **Language Breakdown** | **TypeScript**: 93 files (.tsx: 72, .ts: 21)<br>**JavaScript**: 24 files (.mjs: 21, .js: 3)<br>**Styles**: 3 files (.css)<br>**Database**: 6 files (.sql)<br>**Markup & Config**: 24 files (.json: 8, .html: 1, .md: 15) | File extension grouping across workspace |

