import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowUpRight, ArrowUp, Phone } from 'lucide-react';
import { Logo } from './Logo';
import { KULogo } from './KULogo';
import { GithubIcon, InstagramIcon } from './SocialIcons';
import { SITE_CONSTANTS } from '../content/site';
import { PEOPLE_GROUPS, formatPhoneHref, formatPhoneDisplay } from '../content/people';

export const Footer: React.FC = () => {
  const president = PEOPLE_GROUPS.flatMap((g) => g.members).find((m) => m.id === 'pres-vittala');
  const vp = PEOPLE_GROUPS.flatMap((g) => g.members).find((m) => m.id === 'vp-abhiram');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[var(--bg-brand)] text-[var(--on-brand)] border-t border-[var(--border)] pt-12 pb-8 sm:pt-16 sm:pb-12" role="contentinfo">
      <div className="w-full px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#5A189A]">
          <div className="md:col-span-4 flex flex-col items-start gap-4">
            <Logo variant="stacked" onBrand={true} />
            <p className="text-sm text-[var(--on-brand-muted)] max-w-sm mt-2 leading-relaxed">
              {SITE_CONSTANTS.descriptor}
            </p>
            <div className="text-xs font-mono text-[var(--on-brand-muted)] uppercase tracking-wider">
              {SITE_CONSTANTS.university}
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--on-brand-muted)]">
              Navigation
            </span>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              <li>
                <Link to="/" className="text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/team" className="text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4">
                  Team
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4">
                  Feedback
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-xs text-[var(--on-brand-muted)] hover:text-white underline underline-offset-4">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-xs text-[var(--on-brand-muted)] hover:text-white underline underline-offset-4">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--on-brand-muted)]">
              Contact
            </span>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono text-[var(--on-brand-muted)]">
                  T Vittala, President
                </span>
                {president?.phone && (
                  <a
                    href={formatPhoneHref(president.phone)}
                    className="inline-flex items-center gap-2 text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4"
                  >
                    <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="font-mono text-xs sm:text-sm">{formatPhoneDisplay(president.phone)}</span>
                  </a>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono text-[var(--on-brand-muted)]">
                  D V N S Abhiram, Vice President
                </span>
                {vp?.phone && (
                  <a
                    href={formatPhoneHref(vp.phone)}
                    className="inline-flex items-center gap-2 text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4"
                  >
                    <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="font-mono text-xs sm:text-sm">{formatPhoneDisplay(vp.phone)}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--on-brand-muted)]">
              Connect
            </span>
            <div className="flex flex-col gap-3">
              <a
                href={`mailto:${SITE_CONSTANTS.email}`}
                data-cursor="copy"
                data-copy-text={SITE_CONSTANTS.email}
                className="inline-flex items-center gap-2 text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4"
              >
                <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="font-mono text-xs sm:text-sm break-all">{SITE_CONSTANTS.email}</span>
              </a>

              <a
                href={SITE_CONSTANTS.githubOrgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4"
              >
                <GithubIcon className="w-4 h-4 shrink-0" />
                <span className="font-mono text-xs sm:text-sm">GitHub / {SITE_CONSTANTS.githubOrg}</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>

              <a
                href={SITE_CONSTANTS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--on-brand)] hover:text-white underline underline-offset-4"
              >
                <InstagramIcon className="w-4 h-4 shrink-0" />
                <span className="font-mono text-xs sm:text-sm">Instagram / {SITE_CONSTANTS.instagram}</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* University Affiliation & Copyright Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <KULogo className="h-14 w-auto shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--on-brand-muted)]">
                Affiliated with
              </span>
              <a
                href={SITE_CONSTANTS.universityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-semibold text-white hover:text-[var(--on-brand)] inline-flex items-center gap-1 underline underline-offset-4"
              >
                <span>{SITE_CONSTANTS.university}</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-mono text-[var(--on-brand-muted)]">
            <span>© 2026 Coders Club. All rights reserved.</span>
            <div className="flex items-center gap-3">
              <Link to="/privacy-policy" className="hover:text-white underline underline-offset-2">
                Privacy
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-white underline underline-offset-2">
                Terms
              </Link>
            </div>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-[var(--on-brand)] hover:text-white underline underline-offset-2 cursor-pointer bg-transparent border-0 p-0"
              aria-label="Back to top of page"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
