# Coders Club Public Website & Administrative Platform

The official web platform and administrative system for **Coders Club**, a premier student-run technical community at **Kishkinda University**.

Built with **React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, ExcelJS, and Supabase (PostgreSQL with Row Level Security)**.

---

## 1. Quickstart & Zero-Setup Run

### 1.1 Prerequisites
- **Node.js** v18+ (tested on Node 20+)
- **npm** v9+

### 1.2 Installation
```bash
# Clone the repository and enter directory
cd "CC Website"

# Install dependencies
npm install

# Start development server
npm run dev
```

The application runs at `http://localhost:5173`. When Supabase credentials are not configured, the application operates in resilient mock fallback mode with simulated event, project, and announcement data so development and visual auditing work out of the box.

### 1.3 Quality Checks & Production Build
```bash
# Lint with Oxlint
npm run lint

# TypeScript verification and production bundle build
npm run build

# Preview production build
npm run preview
```

---

## 2. Environment Configuration

Create a `.env.local` file in the workspace root:

```bash
# Public frontend credentials
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>

# Optional email domain restriction (leave empty to allow all university emails)
VITE_ALLOWED_EMAIL_DOMAIN=kishkindauniversity.edu.in

# Service role key (used ONLY by server-side scripts in scripts/, never in client src/)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>
```

> **Security Note**: Never commit `.env` or `.env.local` to version control. The repository `.gitignore` automatically excludes all local environment files while tracking [`.env.example`](file:///c:/CC%20Website/.env.example).

---

## 3. Database Architecture & Migrations

The database is built on PostgreSQL with strict Row Level Security (RLS) and atomic `SECURITY DEFINER` stored procedures.

### 3.1 Initial Setup
1. In the Supabase Project Dashboard, navigate to **SQL Editor**.
2. Run the consolidated schema in [`supabase/schema.sql`](file:///c:/CC%20Website/supabase/schema.sql).
3. For migrations on an existing instance, execute [`supabase/migrations/20261021120000_integrity_and_security.sql`](file:///c:/CC%20Website/supabase/migrations/20261021120000_integrity_and_security.sql).

### 3.2 Database Schema Overview
- **`profiles`**: Student accounts linked to `auth.users(id)`. Protected by `trg_guard_profile_updates` preventing non-admin alteration of student USN, ID, or join timestamp.
- **`admin_roles`**: Administrative roles (`admin`, `coordinator`, `organizer`). Enforced via `is_admin()` and `has_role()` security functions.
- **`events`**: Technical workshops, hackathons, and demo days with capacity limits, registration deadlines, and cancellation cutoffs.
- **`events_public`**: Anonymous view exposing event seat availability (`capacity`, `registered_count`, `spots_left`) without leaking student registration records or personal data.
- **`registrations`**: Student event bookings with unique confirmation codes (`CC-YYYY-NNNN`).
- **`projects`**: Open-source and campus project catalog with live demos and repository links.
- **`announcements`**: Broadcast messages with pinned priority flags and target audience filters.
- **`contact_messages` & `contact_rate_limit`**: Public contact form submissions with automated control character stripping and strict 3-message/hour rate limiting per email.
- **`export_log`**: Administrative audit trail logging timestamp, operator UID, filters, and row counts for every student roster export.
- **Storage Bucket `gallery`**: Media bucket capped at 5MB per file, restricted to image MIME types, public read, admin-only write.

### 3.3 Atomic Stored Procedures
- `register_student_atomic(p_event_id, p_student_id)`: Enforces row-level lock (`FOR UPDATE`) on capacity, rejects unverified emails, detects duplicate bookings, reactivates previous cancellations, assigns sequential confirmation IDs, and gracefully places overflow attendees on the waitlist.
- `cancel_registration(p_registration_id)`: Enforces cancellation cutoff deadlines, sets status to `cancelled`, and atomically promotes the earliest waitlisted student (`ORDER BY created_at ASC LIMIT 1 FOR UPDATE`) to `registered`.
- `check_in_attendee(p_event_id, p_query)`: Scoped event-day check-in verifying admin credentials, rejecting cancelled/waitlisted records, recording check-in timestamps, and idempotently confirming repeat scans.
- `log_export(p_filters, p_row_count)`: Logs student roster export activity to `export_log`.

---

## 4. Bootstrapping Administrators

Administrators are managed via `admin_roles`.

### 4.1 CLI Bootstrap Script
To grant admin privileges to an existing student or coordinator account:

```bash
node scripts/make-admin.mjs coordinator@kishkindauniversity.edu.in
```

### 4.2 SQL Dashboard Fallback
Run the following query directly in the Supabase SQL Editor:

```sql
insert into public.admin_roles (user_id, role)
select id, 'admin'
from auth.users
where lower(email) = lower('coordinator@kishkindauniversity.edu.in')
on conflict (user_id) do update set role = 'admin';
```

---

## 5. Content Maintenance & Team Roster

### 5.1 Team & Leadership Roster
Team member profiles and faculty coordinators are defined in [`src/content/people.ts`](file:///c:/CC%20Website/src/content/people.ts).

To update member details or add new members:
```typescript
{
  id: "lead-name",
  name: "Student Name",
  role: "Technical Lead",
  group: "Core Members",
  year: "3rd Year CSE"
}
```

### 5.2 Club Information & Guiding Principles
Club constants, guiding principles, weekly schedule breakdowns, statistics, and FAQs are maintained in [`src/content/site.ts`](file:///c:/CC%20Website/src/content/site.ts).

---

## 6. Verification & Audit Scripts

Plain linear Node scripts output PASS/FAIL verification tables with zero external test runners:

| Script | Purpose |
| :--- | :--- |
| `node scripts/verify-excel.mjs` | Audits multi-sheet Excel generation, column headers, row counts, and formula injection sanitization (`=`, `+`, `-`, `@`, `\t`, `\r`). |
| `node scripts/verify-backend.mjs` | Audits schema integrity, RLS policies, security triggers, registration atomicity, waitlist promotion, and audit logging. |
| `node scripts/cleanup-test-data.mjs` | Safely purges all records prefixed with `zz-test-` across all tables and storage buckets. |
| `node scripts/audit-routes.mjs` | Audits all 24 application routes via headless Microsoft Edge CDP, capturing full-page screenshots and verifying 0 console errors and 0 network failures. |

---

## 7. Deployment & SPA Routing

### 7.1 Netlify & Cloudflare Pages
SPA routing is handled via [`public/_redirects`](file:///c:/CC%20Website/public/_redirects):
```
/*    /index.html   200
```

### 7.2 Vercel
Configured via [`vercel.json`](file:///c:/CC%20Website/vercel.json) with SPA rewrites and security response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).

### 7.3 Supabase Authentication URLs
In **Supabase Dashboard** -> **Authentication** -> **URL Configuration**:
- **Site URL**: `https://your-domain.com`
- **Redirect URLs**:
  - `https://your-domain.com/signin`
  - `https://your-domain.com/account`
  - `https://your-domain.com/admin/login`
  - `http://localhost:5173/**` (for local development)

---

## 8. Member Photo Guidance

When adding portrait photographs for members in `src/content/people.ts`:
- **Consent**: Use only photos of members who explicitly agreed to publication.
- **Composition & Framing**: Crop with the face in the upper half (recommended focal center at `focalX = 0.5`, `focalY = 0.35`).
- **Resolution**: Minimum 400x500 pixels (aspect ratio 4:5).
- **Hosting & CORS**: Use same-origin assets (e.g., in `public/members/`) or cloud storage with CORS enabled (`crossOrigin="anonymous"`).

---

## 9. Feedback system

The feedback system provides a multi-channel mechanism for students and members to submit bug reports, suggestions, issues, and general inquiries.

### 9.1 Entry Points
- **Full Route**: `/feedback` provides a comprehensive single-column form with live diagnostics and character counters.
- **Floating Report Button**: Positioned above the bottom navigation bar on all non-home pages with safe-area offset; opens the reusable modal / mobile bottom sheet.
- **Mobile More Menu**: Direct item inside the More bottom sheet navigation.
- **Site Footer**: Accessible link under the Navigation group.

### 9.2 API Endpoints
- `POST /api/feedback`: Submits feedback with server-side validation, sanitization of HTML/angle brackets, rate limiting (3 requests/hour/IP), honeypot anti-spam check, and client/server MIME and 3 MB image size validation.
- `GET /api/feedback`: Retrieves all submissions (admin only).
- `PATCH /api/feedback/:id`: Updates report status (`new`, `in-review`, `resolved`, `rejected`) and appends coordinator internal notes.

### 9.3 Environment Variables
- `FEEDBACK_ADMIN_KEY`: Optional administrative secret key. When defined, administrative API requests must provide matching `x-admin-key` header.

### 9.4 Role-Based Administration
- **Route**: `/admin/feedback`
- **Authorized Roles**: President, Vice President, and Faculty Coordinators (`vittala.t1@gmail.com`, `dvnsabhiram071@gmail.com`, `vannurswamy@kishkindauniversity.edu.in`, `anusha@kishkindauniversity.edu.in`).
- **Features**: Counts summary (New, In Review, Resolved), filter chips by type and status, full text search, card view on mobile, detail bottom sheet with screenshot previews, diagnostics, mailto reply trigger, and note editor.
