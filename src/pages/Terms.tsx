import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Calendar,
  Layers,
  HelpCircle,
  Scale,
  RefreshCw,
  Mail
} from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';
import { SITE_CONSTANTS } from '../content/site';

export const Terms: React.FC = () => {
  useEffect(() => {
    document.title = 'Terms of Service | Coders Club';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Terms of Service for Coders Club at Kishkinda University. Rules, responsibilities, and guidelines for students using our platform and attending technical events.'
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
              <Scale className="w-3.5 h-3.5" aria-hidden="true" />
              Community &amp; Platform Guidelines
            </span>
            <span className="inline-flex items-center px-2.5 py-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded text-xs font-mono text-[var(--text-muted)] font-semibold">
              Terms v1.0
            </span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Terms of Service
          </h1>

          <p className="text-sm font-mono text-[var(--text-muted)] m-0">
            Last Updated: October 31, 2026 • Kishkinda University, Ballari, Karnataka
          </p>

          <div className="p-3.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-muted)] leading-relaxed">
            <strong className="text-[var(--text-strong)]">Notice &amp; Disclaimer:</strong> These Terms of Service establish practical operational guidelines for students participating in Coders Club activities and digital platforms at Kishkinda University. They are drafted to set clear community and academic expectations rather than as formal legal advice.
          </div>
        </div>

        {/* 1. Acceptance of Terms */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            1. Acceptance of Terms
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            By visiting the <strong>Coders Club</strong> website (<code>codersclubku.vercel.app</code>), signing in with your Google account or email credentials, registering for club workshops, hackathons, and technical sessions, or using any related online services, you agree to comply with and be bound by these <strong>Terms of Service</strong> and our <Link to="/privacy-policy" className="text-[var(--link)] underline">Privacy Policy</Link>.
          </p>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            If you do not agree with any part of these terms, you should not access or use this website or register for club activities.
          </p>
        </section>

        {/* 2. About Coders Club */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            2. About Coders Club
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Coders Club is a recognized student-run technical community established under the Department of Computer Science &amp; Engineering at <strong>Kishkinda University</strong>, Ballari, Karnataka.
          </p>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Our purpose is to promote hands-on software development, open-source collaboration, practical engineering workshops, peer mentoring, and hackathons for Kishkinda University students. The club operates under the authority and academic governance of the university.
          </p>
        </section>

        {/* 3. Eligibility & Account Responsibilities */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            3. Eligibility &amp; Account Responsibilities
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Student accounts, event reservations, QR tickets, and participant records are intended for currently enrolled students of Kishkinda University.
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans leading-relaxed">
            <li>
              <strong>Enrolment-Based Eligibility:</strong> Eligibility is determined solely by active enrollment at Kishkinda University. While undergraduate university programs primarily comprise adult students, admitted students who are under 18 years of age participate under standard university academic enrollment. The platform does not collect birth dates, verify ages, or implement parental consent mechanisms.
            </li>
            <li>
              <strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials. You must immediately notify us of any unauthorized access to your account.
            </li>
            <li>
              <strong>Accurate Identity:</strong> You must represent yourself honestly. Impersonating another student, faculty member, or club administrator is strictly prohibited.
            </li>
            <li>
              <strong>One Student, One Account:</strong> Each student may maintain only one active account linked to their genuine university credentials. Creating duplicate or dummy accounts to bypass event seat limits is prohibited.
            </li>
          </ul>
        </section>

        {/* 4. Student Account Information & Onboarding */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            4. Student Account Information &amp; Onboarding
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            When you sign in using Google OAuth or direct email sign-up, you must complete the onboarding procedure before accessing event registration or certificate services.
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans leading-relaxed">
            <li>
              <strong>University Seat Number (USN):</strong> You agree to provide your official Kishkinda University USN (e.g., <code>KUB24CSE198</code>). The USN is unique to your academic record and is used to verify on-ground attendance and ticket validity.
            </li>
            <li>
              <strong>Academic Department &amp; Semester:</strong> You agree to maintain accurate department, year, and semester information in your profile so workshop seats and prerequisite materials can be properly planned.
            </li>
            <li>
              <strong>Updates:</strong> You can update your department, year, and semester at any time from your account page as you advance in your academic degree.
            </li>
          </ul>
        </section>

        {/* 5. Acceptable Use */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            5. Acceptable Use Guidelines
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            We strive to foster an inclusive, supportive, and respectful technical environment. You agree to:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans leading-relaxed">
            <li>Engage respectfully with fellow students, workshop presenters, peer mentors, and faculty coordinators.</li>
            <li>Register only for events that you genuinely plan to attend in person on campus.</li>
            <li>Promptly cancel your event registration through your student dashboard if you cannot attend, allowing students on the waitlist to take your place.</li>
            <li>Use club code repositories, sample templates, and project materials for constructive learning and development.</li>
            <li>Submit constructive bug reports and genuine feature requests through the feedback system.</li>
          </ul>
        </section>

        {/* 6. Prohibited Activities */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] shrink-0" aria-hidden="true" />
            6. Prohibited Activities
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            You agree not to engage in any of the following activities:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans leading-relaxed">
            <li>
              <strong>Security Probing &amp; Exploits:</strong> Attempting to probe, scan, or test the vulnerability of the website, APIs, or database, or attempting to breach authentication or Row Level Security policies.
            </li>
            <li>
              <strong>Automated Abuse:</strong> Using bots, automated scrapers, spiders, or scripts to bulk-register for events or overload our infrastructure.
            </li>
            <li>
              <strong>Ticket Fraud:</strong> Forging, altering, duplicating, or transferring event QR confirmation codes, or falsely marking attendance.
            </li>
            <li>
              <strong>Harassment &amp; Malicious Content:</strong> Submitting abusive, defamatory, harassing, or obscene messages through the contact form, feedback tool, or club collaboration channels.
            </li>
            <li>
              <strong>Academic Dishonesty:</strong> Submitting work created by others without attribution during club hackathons, code challenges, or showcase competitions.
            </li>
          </ul>
        </section>

        {/* 7. Website Content and Intellectual Property */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            7. Website Content &amp; Intellectual Property
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Our approach to intellectual property balances open source principles with brand protection:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans leading-relaxed">
            <li>
              <strong>Open Source Code:</strong> Software created and published by Coders Club on our GitHub organization (<a href={SITE_CONSTANTS.githubOrgUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--link)] underline">github.com/{SITE_CONSTANTS.githubOrg}</a>) is licensed under the open-source licenses specified in each individual repository (such as the MIT License). You are free to inspect, fork, and contribute in accordance with those licenses.
            </li>
            <li>
              <strong>Branding &amp; Assets:</strong> The Coders Club logo, website design, text copy, graphic illustrations, and Kishkinda University institutional marks remain the property of Coders Club and Kishkinda University. You may not reproduce club branding for commercial ventures without explicit written permission.
            </li>
            <li>
              <strong>Student Contributions:</strong> When submitting code contributions to club repositories, you retain ownership of your code while granting the club the right to distribute it under the repository&rsquo;s designated open-source license.
            </li>
          </ul>
        </section>

        {/* 8. Events and Participation */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            8. Events, Capacity &amp; Participation
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Participation in club workshops and hackathons is subject to the following rules:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans leading-relaxed">
            <li>
              <strong>Atomic Capacity:</strong> Event seat allocation is subject to classroom and computer lab limits. Confirmations are handled automatically on a verified first-come, first-served basis with automated waitlists.
            </li>
            <li>
              <strong>Check-In Verification:</strong> Event entry passes (QR tickets) are non-transferable and must be presented at the venue alongside your university student ID card.
            </li>
            <li>
              <strong>Schedule Adjustments:</strong> Club event schedules, room locations, or speaker lineups may be updated due to university exams, academic schedule adjustments, or logistical circumstances. Registered students will receive advance notice via email or website announcements.
            </li>
          </ul>
        </section>

        {/* 9. Account Suspension or Termination */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            9. Account Suspension &amp; Termination
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            We reserve the right to suspend or terminate student account privileges if a user repeatedly breaches these Terms, engages in malicious activities, or violates the Kishkinda University Student Code of Conduct.
          </p>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            You may also delete your student account voluntarily at any time by visiting <Link to="/account" className="text-[var(--link)] underline">Account Settings &rarr; Privacy</Link>. Deletion is immediate and permanently removes your login credentials, academic profile, consent records, and event tickets. As disclosed in the Privacy Policy, standalone contact form inquiries and feedback tickets submitted prior to deletion are not linked by database foreign keys and are not automatically removed.
          </p>
        </section>

        {/* 10. Website Availability & Disclaimers */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            10. Website Availability &amp; Disclaimers
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            The Coders Club platform, event ticketing tools, and offline queuing features are provided on an <strong>&ldquo;as is&rdquo;</strong> and <strong>&ldquo;as available&rdquo;</strong> basis.
          </p>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            As a student-run technical initiative, while we apply rigorous engineering practices and testing, we do not warrant that the website will be entirely uninterrupted, error-free, or compatible with all devices and networks. Coders Club and Kishkinda University disclaim all implied warranties to the fullest extent permitted by law.
          </p>
        </section>

        {/* 11. Changes to Terms */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg sm:text-xl font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            11. Changes to Terms
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            We may revise these Terms of Service as new features are launched or university guidelines change. Any updates will be published on this page with an updated &ldquo;Last Updated&rdquo; date. Your continued access to the platform following posted changes constitutes your agreement to the updated Terms.
          </p>
        </section>

        {/* 12. Governing Regulations & Contact Information */}
        <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col gap-3">
          <h2 className="text-base font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
            12. Contact Information &amp; Governance
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            These Terms are governed by the regulations of Kishkinda University and applicable Indian laws. If you have questions regarding these terms, please contact:
          </p>
          <div className="flex flex-col gap-1.5 text-xs font-mono text-[var(--text-strong)] mt-1">
            <span><strong>Organization:</strong> Coders Club, Kishkinda University</span>
            <span><strong>Supervising Department:</strong> Department of Computer Science &amp; Engineering</span>
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
            <Link to="/privacy-policy" className="cc-btn cc-btn--secondary min-h-[44px] text-xs font-mono font-semibold">
              Privacy Policy &rarr;
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

export default Terms;