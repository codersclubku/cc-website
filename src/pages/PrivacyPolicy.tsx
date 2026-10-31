import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Lock,
  UserCheck,
  RefreshCw,
  Trash2,
  Mail,
  ExternalLink,
  Server,
  KeyRound,
  Cookie,
  AlertTriangle,
  Scale,
  CheckCircle2
} from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';
import { SITE_CONSTANTS } from '../content/site';

export const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy Policy | Coders Club';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Privacy Policy for Coders Club at Kishkinda University. Understand how we collect, process, and protect student data under the DPDP Act 2023.'
      );
    }
  }, []);

  return (
    <HairlineGrid>
      <div className="hairline-row w-full px-6 sm:px-12 lg:px-20 py-12 sm:py-16 text-left max-w-4xl mx-auto flex flex-col gap-10">
        {/* Document Header */}
        <div className="flex flex-col gap-3 pb-6 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded text-xs font-mono text-[var(--accent)] font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              DPDP Act 2023 & Student Data Governance
            </span>
            <span className="inline-flex items-center px-2.5 py-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded text-xs font-mono text-[var(--text-muted)] font-semibold">
              Notice Version 1.0 (v1.0-2026)
            </span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Privacy Policy
          </h1>

          <p className="text-sm font-mono text-[var(--text-muted)] m-0">
            Last Updated: October 31, 2026 • Kishkinda University, Ballari, Karnataka
          </p>

          <div className="p-3.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-muted)] leading-relaxed">
            <strong className="text-[var(--text-strong)]">Notice &amp; Disclaimer:</strong> This privacy policy describes the actual technical and administrative data practices of the Coders Club platform and is drafted to address relevant principles of India&rsquo;s Digital Personal Data Protection Act, 2023 (DPDP Act 2023) and Google API Services User Data Policy guidelines. It reflects our software architecture and operational practices and does not constitute formal legal certification or advice.
          </div>
        </div>

        {/* 1. Introduction and Purpose */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            1. Introduction & Purpose
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            This Privacy Policy explains how <strong>Coders Club</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;the club&rdquo;), a recognized student-run technical community operating under the Department of Computer Science &amp; Engineering at <strong>Kishkinda University</strong>, Ballari, Karnataka, collects, uses, stores, and protects personal data when you visit our website (<code>codersclubku.vercel.app</code>) or use our student services.
          </p>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Our platform enables Kishkinda University students to register for hands-on technical workshops, seminars, and hackathons, receive digital entry tickets, track project contributions, and voice feedback. This policy is drafted to address relevant provisions of the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act 2023, India)</strong> and university student data guidelines, explaining our data handling practices clearly and transparently.
          </p>
        </section>

        {/* 2. Information Collected */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            2. Information We Collect
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            We follow the principle of data minimisation, collecting only the essential information needed to verify student eligibility and operate club activities:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col gap-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-strong)] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                Google Account Authentication
              </span>
              <p className="text-xs text-[var(--text)] leading-relaxed m-0">
                When you choose to sign in with Google OAuth 2.0, Google provides:
              </p>
              <ul className="list-disc pl-4 text-xs text-[var(--text)] space-y-1 m-0">
                <li><strong>Email address:</strong> Used as your unique account login identifier.</li>
                <li><strong>Profile name:</strong> Used to prefill your student onboarding form.</li>
                <li><strong>Avatar image URL:</strong> Used optionally for account navigation display.</li>
              </ul>
              <p className="text-[11px] font-mono text-[var(--text-muted)] m-0 pt-1 border-t border-[var(--border)]">
                Note: Google does not provide your USN, branch, or semester. We request only standard identity scopes and never access your Google password, Google Drive, Gmail, or device contacts.
              </p>
            </div>

            <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col gap-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-strong)] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                Student Academic Profile
              </span>
              <p className="text-xs text-[var(--text)] leading-relaxed m-0">
                During onboarding or direct sign-up, you provide the following academic details:
              </p>
              <ul className="list-disc pl-4 text-xs text-[var(--text)] space-y-1 m-0">
                <li><strong>Full Name:</strong> Printed on event tickets and participation certificates.</li>
                <li><strong>University Seat Number (USN):</strong> Formatted (e.g., <code>KUB24CSE198</code>) to prevent duplicate bookings and verify Kishkinda University enrollment.</li>
                <li><strong>Department / Branch:</strong> To verify cohort requirements.</li>
                <li><strong>Academic Year &amp; Semester:</strong> (1st&ndash;4th Year, 1st&ndash;8th Semester) to balance workshop seating.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col gap-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-strong)] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                Event Registrations &amp; Attendance
              </span>
              <p className="text-xs text-[var(--text)] leading-relaxed m-0">
                When you register for workshops or hackathons, we record:
              </p>
              <ul className="list-disc pl-4 text-xs text-[var(--text)] space-y-1 m-0">
                <li>Registration status (confirmed, waitlisted, or cancelled).</li>
                <li>Unique QR-code confirmation ID for venue admission.</li>
                <li>Physical check-in timestamp recorded by student coordinators at the venue.</li>
              </ul>
            </div>

            <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col gap-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-strong)] flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                Inquiries &amp; Bug Reports
              </span>
              <p className="text-xs text-[var(--text)] leading-relaxed m-0">
                If you contact us or report an issue through our feedback system:
              </p>
              <ul className="list-disc pl-4 text-xs text-[var(--text)] space-y-1 m-0">
                <li>Contact form: Name, email address, and inquiry message.</li>
                <li>Feedback form: Title, description, severity, and optional email.</li>
                <li>Bug diagnostics: Browser user-agent and operating system details included to reproduce and resolve technical glitches.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. How Information is Used */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            3. How Your Information is Used
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Your personal information is processed exclusively for non-commercial, academic, and club administrative purposes:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans leading-relaxed">
            <li>Authenticating your student account and verifying active enrollment at Kishkinda University.</li>
            <li>Enforcing event capacity limits, managing automated waitlists, and issuing QR-code entry passes.</li>
            <li>Recording attendance at club sessions for participation certificates and internal club records.</li>
            <li>Compiling academic reporting summaries and attendance rosters requested by Kishkinda University academic affairs.</li>
            <li>Delivering important transactional notifications (account verification, password reset links, and event confirmations).</li>
            <li>Investigating and resolving technical issues reported through the website feedback tool.</li>
          </ul>
          <div className="p-4 bg-[var(--surface-raised)] border-l-2 border-[var(--accent)] rounded-r-sm text-xs font-mono text-[var(--text-strong)] leading-relaxed">
            <strong>Non-Commercialization Practice:</strong> We do not sell, rent, commercialize, or share student personal data with advertisers, third-party marketing companies, or data brokers.
          </div>
        </section>

        {/* 4. Third-Party Service Providers */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <Server className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            4. Third-Party Service Providers
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            We use carefully selected cloud infrastructure providers to host and secure our platform:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans leading-relaxed">
            <li>
              <strong>Supabase Inc.:</strong> Provides our PostgreSQL database, authentication services, and row-level security. Student data is stored in Supabase cloud facilities with encrypted storage at rest.
            </li>
            <li>
              <strong>Google Identity Services:</strong> Provides OAuth 2.0 authentication for students signing in via Google. Usage conforms to the Google API Services User Data Policy.
            </li>
            <li>
              <strong>Vercel Inc.:</strong> Provides static application hosting and edge content delivery network (CDN) routing.
            </li>
            <li>
              <strong>Google Fonts:</strong> Delivers typography stylesheets (JetBrains Mono &amp; Raleway). No personal student profile data is transmitted to font servers.
            </li>
          </ul>
        </section>

        {/* 5. Data Storage, Security & Access Controls */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            5. Data Storage &amp; Security Controls
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            We implement multi-layered technical safeguards to protect student records:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans leading-relaxed">
            <li>
              <strong>Row Level Security (RLS):</strong> Our database enforces strict PostgreSQL Row Level Security. Authenticated students can access only their own profile and registration records.
            </li>
            <li>
              <strong>Role-Based Administrative Boundaries:</strong> Administrative permissions are restricted to designated student coordinators and faculty advisors via verified role checks (<code>admin_roles</code>).
            </li>
            <li>
              <strong>Export Audit Logging:</strong> Any administrative export of attendee lists or student records is logged with administrator IDs, filters, and timestamps in an audit log (<code>export_log</code>).
            </li>
            <li>
              <strong>Encryption in Transit:</strong> All web traffic is strictly encrypted using HTTPS/TLS with modern cipher suites and Strict-Transport-Security (HSTS) headers.
            </li>
            <li>
              <strong>Hardened Search Paths:</strong> Sensitive database functions operate with locked search paths (<code>set search_path = ''</code>) to protect against privilege escalation.
            </li>
          </ul>
          <p className="text-xs font-mono text-[var(--text-muted)] m-0">
            We accurately state our architectural controls and make no unsupported assertions regarding proprietary third-party enterprise certifications.
          </p>
        </section>

        {/* 6. Data Retention and Deletion */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <Trash2 className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            6. Data Retention, Self-Service Deletion &amp; Retained Unlinked Records
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            We retain student personal information during active university enrollment and for academic audit purposes. We uphold your statutory rights under Section 11 of the DPDP Act 2023 through the following mechanisms:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans leading-relaxed">
            <li>
              <strong>Right to Access &amp; Correction:</strong> You can view and update your department, year, and semester at any time via your <Link to="/account" className="text-[var(--link)] underline">Student Account</Link>.
            </li>
            <li>
              <strong>Right to Withdraw Consent:</strong> You can withdraw your privacy consent at any time from your account page. Withdrawing consent pauses your ability to register for new events while leaving past verified tickets intact.
            </li>
            <li>
              <strong>Right to Erasure / Immediate Account Deletion:</strong> You can permanently delete your student account directly from <Link to="/account" className="text-[var(--link)] underline">Account Settings &rarr; Privacy</Link>. Executing account deletion initiates an atomic backend database transaction that immediately and permanently deletes:
              <ul className="list-circle pl-5 mt-1 space-y-1 text-xs text-[var(--text)]">
                <li>Your Supabase authentication identity and credentials (<code>auth.users</code>).</li>
                <li>Your student academic profile (<code>public.profiles</code>).</li>
                <li>Your individual event registrations and QR confirmation tickets (<code>public.registrations</code>).</li>
                <li>Your consent history records (<code>public.consents</code>).</li>
                <li>Your administrative role privileges if assigned (<code>public.admin_roles</code>).</li>
              </ul>
              Client session tokens stored in browser <code>localStorage</code> are immediately cleared upon deletion. Past event headcounts are preserved solely as anonymous aggregate numbers.
            </li>
          </ul>

          <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col gap-2.5 mt-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-strong)] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              Disclosure: Personal Information Retained After Account Deletion
            </span>
            <p className="text-xs text-[var(--text)] leading-relaxed m-0">
              Certain communications and diagnostic records are <strong>not linked through foreign keys</strong> to your student account and are <strong>not automatically deleted</strong> when you delete your account:
            </p>
            <ul className="list-disc pl-5 text-xs text-[var(--text)] space-y-2 m-0 font-sans leading-relaxed">
              <li>
                <strong>Contact Form Inquiries (<code>public.contact_messages</code>):</strong> If you submitted a message through the Contact page, the database retains your <em>Name</em>, <em>Email address</em>, <em>Message text</em>, handling status, and submission timestamp. These records are retained as standalone support records to track community inquiries and are accessible only to authorized club coordinators and faculty advisors via the administrative portal (<code>/admin/messages</code>).
              </li>
              <li>
                <strong>Feedback &amp; Bug Reports (<code>public.feedback</code>):</strong> If you submitted feedback or a bug report, the database retains the ticket title, description, category, severity, page route, optional steps to reproduce, optional screenshot URL, optional submitter name and email (if you did not choose anonymous mode), reply request preference, and diagnostic technical metadata (browser user-agent, viewport screen resolution, active theme, and route timestamp). These records are retained to diagnose software defects and maintain platform stability, accessible only to authorized club administrators (<code>/admin/feedback</code>).
              </li>
              <li>
                <strong>Absence of Automated Deletion or Expiration Schedule:</strong> The current codebase <strong>does not implement an automated data expiration cron, automated retention schedule, or user-facing deletion workflow</strong> for contact messages or feedback items. Backend APIs for feedback support only read, create, and status update operations (<code>GET</code>, <code>POST</code>, <code>PATCH</code>), with no automated purge mechanism. These records remain in administrative database tables until manually removed by a database administrator.
              </li>
            </ul>
          </div>
        </section>

        {/* 7. Cookies and Authentication Sessions */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <Cookie className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            7. Cookies &amp; Local Storage Sessions
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            We do not use advertising or tracking cookies. We utilize browser storage strictly for functional platform features:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans leading-relaxed">
            <li>
              <strong>Authentication Session (<code>localStorage</code>):</strong> Supabase stores cryptographic session tokens to keep you logged in and enable secure token refresh.
            </li>
            <li>
              <strong>Theme Preference (<code>cc-theme</code>):</strong> Remembers your dark or light mode preference.
            </li>
            <li>
              <strong>Offline Registration Queue (<code>cc_offline_registration_queue</code>):</strong> Temporarily queues event registrations locally if campus network connectivity drops, syncing automatically when connectivity returns.
            </li>
          </ul>
        </section>

        {/* 8. Third-Party Links */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <ExternalLink className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            8. Third-Party Links &amp; External Repositories
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Our website links to external platforms, including our GitHub organization (<a href={SITE_CONSTANTS.githubOrgUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--link)] underline">github.com/{SITE_CONSTANTS.githubOrg}</a>), Instagram (<a href={SITE_CONSTANTS.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--link)] underline">{SITE_CONSTANTS.instagram}</a>), and the official Kishkinda University website (<a href={SITE_CONSTANTS.universityUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--link)] underline">{SITE_CONSTANTS.university}</a>). We are not responsible for the privacy policies or practices of external third-party websites.
          </p>
        </section>

        {/* 9. Age Eligibility & Children's Privacy */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            9. Age Eligibility, Children&rsquo;s Privacy &amp; Statutory Distinctions
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            To provide clear transparency regarding student age eligibility and statutory frameworks, we outline the following distinctions:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-2 m-0 font-sans leading-relaxed">
            <li>
              <strong>Intended Audience:</strong> The Coders Club website and student services are designed exclusively for students actively enrolled in collegiate engineering and technology degree programs at <strong>Kishkinda University</strong>, Ballari.
            </li>
            <li>
              <strong>DPDP Act 2023 Statutory Definition:</strong> Under Section 2(f) of India&rsquo;s Digital Personal Data Protection Act, 2023, a <em>&ldquo;child&rdquo;</em> is legally defined as an individual who has not completed eighteen (18) years of age.
            </li>
            <li>
              <strong>Actual Platform Implementation &amp; Codebase Practice:</strong> The platform does <strong>not collect dates of birth, birth years, or user ages</strong> during registration or onboarding. The software does <strong>not perform age verification</strong>, does <strong>not determine whether an enrolled student is over or under 18</strong>, and does <strong>not implement verifiable parental consent mechanisms</strong> or guardian authorization workflows.
            </li>
            <li>
              <strong>Enrolment-Based Qualification:</strong> Account creation, event ticketing, and club participation are governed solely by possessing valid university academic credentials (university email, valid Kishkinda University USN formatted as <code>KUB24CSE198</code>, department, and semester). Any student admitted to the university (including first-year collegiate students who may be 17 years of age) participates under the standard collegiate onboarding workflow without age gating.
            </li>
          </ul>
          <p className="text-xs font-mono text-[var(--text-muted)] m-0">
            Notice: This section documents the actual software architecture and registration mechanisms of the website. It is an operational description and does not constitute formal legal advice or certification.
          </p>
        </section>

        {/* 10. Changes to This Policy */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            10. Changes to This Privacy Policy
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            We may update this policy periodically to reflect operational changes, university policy revisions, or legal requirements. Updated versions will be posted on this page with a revised &ldquo;Last Updated&rdquo; date. If substantial modifications are made, active users will be prompted to review and renew consent upon their next login.
          </p>
        </section>

        {/* 11. Data Fiduciary & Grievance Redressal */}
        <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col gap-3">
          <h2 className="text-base font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2">
            <Scale className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
            11. Data Fiduciary &amp; Grievance Redressal
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            For questions, data access requests, or privacy grievances, please contact the club secretariat and faculty leadership:
          </p>
          <div className="flex flex-col gap-1.5 text-xs font-mono text-[var(--text-strong)] mt-1">
            <span><strong>Data Fiduciary:</strong> Coders Club, Kishkinda University</span>
            <span><strong>Department:</strong> Department of Computer Science &amp; Engineering</span>
            <span><strong>Campus Address:</strong> Kishkinda University, Ballari, Karnataka 583101, India</span>
            <span>
              <strong>Official Email:</strong>{' '}
              <a
                href={`mailto:${SITE_CONSTANTS.email}`}
                className="text-[var(--link)] hover:text-[var(--link-hover)] underline font-bold"
              >
                {SITE_CONSTANTS.email}
              </a>
            </span>
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-[var(--border)] flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <Link to="/" className="cc-btn cc-btn--secondary min-h-[44px] text-xs font-mono font-semibold">
              &larr; Back to Home
            </Link>
            <Link to="/terms" className="cc-btn cc-btn--secondary min-h-[44px] text-xs font-mono font-semibold">
              Terms of Service &rarr;
            </Link>
          </div>
          <Link to="/signup" className="cc-btn cc-btn--primary min-h-[44px] text-xs font-mono font-bold">
            Create Student Account
          </Link>
        </div>
      </div>
    </HairlineGrid>
  );
};

export default PrivacyPolicy;