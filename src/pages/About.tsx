import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ArrowRight, Mail } from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';
import { ABOUT_CONTENT, SITE_CONSTANTS } from '../content/site';
import { FACULTY_COORDINATORS_HEADING, PEOPLE_GROUPS } from '../content/people';
import { KULogo } from '../components/KULogo';
import { SpotlightCard } from '../components/SpotlightCard';
import { useAuth } from '../context/AuthContext';
import { HeroSlideshow } from '../components/HeroSlideshow';

export const About: React.FC = () => {
  const { user } = useAuth();
  const facultyGroup = PEOPLE_GROUPS.find((g) => g.id === 'faculty-coordinators');

  return (
    <HairlineGrid>
      <section className="hairline-row w-full bg-[var(--bg)] relative overflow-hidden text-left" aria-labelledby="about-heading">
        <HeroSlideshow
          slideIndex={0}
          widthClass="lg:w-[40%]"
          fadeSpan="30%"
          mobileReducedOpacity
          showDots={false}
          ariaLabel="Kishkinda University Campus"
        />

        <div className="relative z-20 w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14">
          <div className="w-full lg:max-w-[58%] flex flex-col items-start gap-4">
            <span className="eyebrow-marker font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Identity & Vision
            </span>
            <h1
              id="about-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-tight m-0"
            >
              About
            </h1>

            <p className="text-base sm:text-lg font-medium text-[var(--text)] leading-relaxed m-0 mt-1 max-w-[65ch]">
              {ABOUT_CONTENT.mission}
            </p>

            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed m-0 max-w-[65ch]">
              {ABOUT_CONTENT.vision}
            </p>

            <div className="mt-6 p-6 sm:p-8 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
              <KULogo className="h-14 w-auto shrink-0" />
              <div className="flex flex-col gap-1 text-left">
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                  Official Affiliation
                </span>
                <div className="text-lg font-bold text-[var(--text)]">
                  {SITE_CONSTANTS.university}, Ballari
                </div>
                <p className="text-sm text-[var(--text-muted)] m-0 leading-relaxed max-w-2xl">
                  Coders Club is a student-run technical community established under the Department of Computer Science & Engineering at Kishkinda University.
                </p>
                <a
                  href={SITE_CONSTANTS.universityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-4 mt-2 inline-flex items-center gap-1 font-semibold"
                >
                  <span>Visit {SITE_CONSTANTS.university} website</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--surface-1)] text-left" aria-labelledby="principles-heading">
        <div className="w-full flex flex-col gap-6">
          <div className="border-b border-[var(--border)] pb-4">
            <span className="eyebrow-marker font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Standards
            </span>
            <h2 id="principles-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-1 m-0">
              Guiding principles
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {ABOUT_CONTENT.principles.map((p, idx) => (
              <SpotlightCard
                key={p.title}
                className="p-6 bg-[var(--surface-2)] border border-[var(--border)] rounded-md shadow-1 flex flex-col gap-3 text-left h-full"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">
                    0{idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text)] m-0">
                    {p.title}
                  </h3>
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed m-0">
                  {p.description}
                </p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--bg)] text-left" aria-labelledby="goals-heading">
        <div className="w-full flex flex-col gap-6">
          <div className="border-b border-[var(--border)] pb-4">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Objectives
            </span>
            <h2 id="goals-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-1 m-0">
              Goals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
            {ABOUT_CONTENT.goals.map((goal) => (
              <div
                key={goal}
                className="flex items-start gap-4 p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 text-sm sm:text-base text-[var(--text)]"
              >
                <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{goal}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--surface-2)] text-left" aria-labelledby="weekly-heading">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Format
            </span>
            <h2 id="weekly-heading" className="text-2xl sm:text-3xl font-bold text-[var(--text)] m-0">
              What we do each week
            </h2>
            <div className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)]">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              <span>{ABOUT_CONTENT.weeklySession.duration}</span>
            </div>

            <ol className="flex flex-col gap-2.5 list-none p-0 m-0 mt-2">
              {ABOUT_CONTENT.weeklySession.structure.map((item, i) => (
                <li
                  key={item}
                  className="p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 text-sm sm:text-base text-[var(--text)] flex items-center gap-3"
                >
                  <span className="font-mono text-xs text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                    [0{i + 1}]
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-4">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Milestones
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] m-0">
              Semester schedule
            </h2>
            <div className="text-sm font-mono text-[var(--text-muted)]">
              Key calendar events across the semester
            </div>

            <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mt-2">
              {ABOUT_CONTENT.activities.map((act) => (
                <li
                  key={act}
                  className="p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 text-sm sm:text-base text-[var(--text)] flex items-center gap-3"
                >
                  <span className="w-2 h-2 bg-[var(--accent)] shrink-0 rounded-xs" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--bg)] text-left" aria-labelledby="leadership-heading">
        <div className="w-full flex flex-col gap-6">
          <div className="border-b border-[var(--border)] pb-4">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Governance
            </span>
            <h2 id="leadership-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-1 m-0">
              Leadership structure & faculty coordinators
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[var(--text-muted)] mt-1">
              Faculty Coordinators: {FACULTY_COORDINATORS_HEADING}
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-[var(--text)] m-0">
              Faculty Coordinators
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
              {facultyGroup?.members.map((member) => (
                <div key={member.id} className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-md flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-[var(--text)]">
                      {member.name}
                    </div>
                    <div className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] mt-1 font-semibold">
                      {member.role}
                    </div>
                    {member.department && (
                      <div className="text-xs text-[var(--text-muted)] font-sans mt-1">
                        {member.department}
                      </div>
                    )}
                  </div>
                  {member.email && (
                    <div className="pt-2 border-t border-[var(--border)] flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" aria-hidden="true" />
                      <a
                        href={`mailto:${member.email}`}
                        className="text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-2 truncate"
                        aria-label={`Email ${member.name} at ${member.email}`}
                      >
                        {member.email}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <span className="text-xs text-[var(--text-muted)]">
                Student committee includes President, Vice President, Secretary, Joint Secretary, Treasurer, Web Masters, and Organisers.
              </span>
              <Link
                to="/team"
                className="text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-4 shrink-0 font-semibold inline-flex items-center gap-1"
              >
                <span>View team directory</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-12 sm:py-16 bg-[var(--surface-2)] text-left" aria-labelledby="howtojoin-heading">
        <div className="w-full max-w-4xl flex flex-col items-start gap-4">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
            Direct Membership
          </span>
          <h2 id="howtojoin-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] m-0">
            Join the club directly
          </h2>
          <p className="text-base text-[var(--text-muted)] leading-relaxed m-0 max-w-[65ch]">
            {ABOUT_CONTENT.howToJoin}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {user ? (
              <Link to="/events" className="cc-btn cc-btn--primary min-h-[44px] px-6 text-sm font-mono font-semibold">
                <span>Browse upcoming events</span>
              </Link>
            ) : (
              <>
                <Link to="/signup" className="cc-btn cc-btn--primary min-h-[44px] px-6 text-sm font-mono font-semibold">
                  <span>Create student account</span>
                </Link>
                <Link to="/signin" className="cc-btn cc-btn--secondary min-h-[44px] px-6 text-sm font-mono font-semibold">
                  <span>Sign in</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </HairlineGrid>
  );
};
