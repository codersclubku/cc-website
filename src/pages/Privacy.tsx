import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, FileText, Lock, UserCheck, RefreshCw, Trash2 } from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';

export const Privacy: React.FC = () => {
  return (
    <HairlineGrid>
      <div className="hairline-row w-full px-6 sm:px-12 lg:px-20 py-12 sm:py-16 text-left max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Digital Personal Data Protection Act, 2023
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Student Data Privacy Notice
          </h1>
          <p className="text-sm font-mono text-[var(--text-muted)] m-0">
            Notice Version 1.0 (October 2026) • Kishkinda University
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[var(--accent)]" />
            1. Data Fiduciary & Identity
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            This notice is issued by <strong>Coders Club</strong> under the authority of <strong>Kishkinda University</strong>, Ballari, Karnataka. The club functions as a recognized academic and technical student body governed by university regulations.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--accent)]" />
            2. Personal Data Items Collected
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            We collect only essential data items required for university student verification and club event operations:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans">
            <li><strong>Full Name:</strong> For tickets, certificates, and attendance rosters.</li>
            <li><strong>University Email Address:</strong> For login, account verification, and official event notifications.</li>
            <li><strong>University Seat Number (USN):</strong> Unique academic identifier to prevent duplicate bookings and verify student enrollment.</li>
            <li><strong>Department, Year, and Semester:</strong> To ensure eligibility and balance cohort capacity.</li>
            <li><strong>Event Records & Check-in Timestamps:</strong> To track participation and verify on-ground attendance.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--accent)]" />
            3. Purpose of Processing
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Your data is processed strictly for:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1 m-0 font-sans">
            <li>Managing workshop, seminar, and hackathon registrations with atomic capacity enforcement.</li>
            <li>Generating QR-code event entry tickets.</li>
            <li>Verifying in-person attendance during club sessions.</li>
            <li>Compiling academic reporting summaries and attendance spreadsheets for university administration.</li>
          </ul>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0 font-semibold text-[var(--text-strong)]">
            We never sell, rent, commercialize, or share your data with external third parties or advertisers.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            4. Recipients of Personal Data
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Access to student personal records is restricted exclusively to:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1 m-0 font-sans">
            <li>Designated Coders Club faculty coordinators and authorized student office-bearers via role-based access control.</li>
            <li>Kishkinda University academic affairs and department heads upon official record requests.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[var(--accent)]" />
            5. Retention Period
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Personal data is retained during your active university enrollment period and for up to three years post-graduation to satisfy academic audit requirements, after which it is archived or securely erased.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[var(--accent)]" />
            6. Your Rights: Access, Correction, Withdrawal & Deletion
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            Under Section 11 of the Digital Personal Data Protection Act, 2023, you have the following rights:
          </p>
          <ul className="list-disc pl-5 text-sm text-[var(--text)] space-y-1.5 m-0 font-sans">
            <li><strong>Right to Access & Correction:</strong> Review and update your department, year, and semester anytime in your <Link to="/account" className="text-[var(--link)] underline">Account settings</Link>.</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent at any time from your account page.</li>
            <li><strong>Right to Erasure / Account Deletion:</strong> Request full deletion of your profile and personal details directly from your account page. Past event counts are preserved anonymously.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-sm">
          <h2 className="text-base font-bold font-body text-[var(--text-strong)] m-0 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[var(--accent)]" />
            7. Data Protection Officer & Grievance Redressal
          </h2>
          <p className="text-sm text-[var(--text)] leading-relaxed m-0">
            For questions, data access requests, or privacy grievances, reach out directly to the club leadership:
          </p>
          <div className="flex flex-col gap-1 text-xs font-mono text-[var(--text-strong)]">
            <span>Faculty Coordinator & Student Secretariat</span>
            <span>Coders Club, Kishkinda University</span>
            <a
              href="mailto:codersclub.ku@gmail.com"
              className="text-[var(--link)] hover:text-[var(--link-hover)] underline"
            >
              codersclub.ku@gmail.com
            </a>
          </div>
        </section>

        <div className="pt-4 border-t border-[var(--border)] flex flex-wrap gap-4 items-center justify-between">
          <Link to="/" className="cc-btn cc-btn--secondary min-h-[44px] text-xs font-mono font-semibold">
            Back to Home
          </Link>
          <Link to="/signup" className="cc-btn cc-btn--primary min-h-[44px] text-xs font-mono font-bold">
            Create Student Account
          </Link>
        </div>
      </div>
    </HairlineGrid>
  );
};
