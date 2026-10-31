import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Calendar, MapPin, Users } from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';
import { Badge } from '../components/Badge';
import { Accordion } from '../components/Accordion';
import { KULogo } from '../components/KULogo';
import { HeroSlideshow } from '../components/HeroSlideshow';
import { SpotlightCard } from '../components/SpotlightCard';
import { NumberTicker } from '../components/NumberTicker';
import { StaggerGrid, StaggerItem } from '../components/ScrollReveal';
import { EventCardSkeleton } from '../components/Skeleton';
import { STATS, WHAT_WE_DO, FAQ_ITEMS } from '../content/site';
import { fetchPublishedEvents } from '../lib/api';
import type { DbEvent } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { COPY } from '../content/copy';
import { TextProximity } from '../components/cursor/TextProximity';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => new Date());

  useEffect(() => {
    async function load() {
      try {
        const list = await fetchPublishedEvents();
        setEvents(list);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const upcomingEvents = events.filter((e) => new Date(e.ends_at) >= now);
  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : (events.length > 0 ? events[0] : null);

  const nextEventSeatsRemaining = nextEvent && nextEvent.capacity
    ? Math.max(0, nextEvent.capacity - (nextEvent.registrations_count || 0))
    : null;

  return (
    <HairlineGrid>
      <section
        className="hairline-row w-full bg-[var(--bg)] relative overflow-hidden"
        aria-labelledby="hero-title"
      >
        <HeroSlideshow />

        <div className="relative z-20 w-full px-4 sm:px-8 lg:px-16 py-8 sm:py-16 lg:py-20 flex items-center min-h-[380px] sm:min-h-[440px] lg:min-h-[580px]">
          <div className="w-full lg:max-w-[48%] flex flex-col items-start justify-center gap-5 text-left">
            <div className="flex items-center gap-2.5">
              <KULogo className="h-6 w-auto shrink-0" fetchPriority="high" loading="eager" />
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                Kishkinda University
              </span>
              <span className="text-[var(--border)]" aria-hidden="true">•</span>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                Technical Community
              </span>
            </div>

            <TextProximity
              text="A student-run technical community that builds real software"
              id="hero-title"
              className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-[1.15] m-0"
            />

            <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed max-w-2xl m-0">
              We build, document, and maintain public software while training members to lead future batches at Kishkinda University.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full sm:w-auto">
              <Link
                to="/events"
                data-magnetic
                className="cc-btn cc-btn--primary min-h-[44px] px-6 text-sm font-mono font-semibold"
              >
                <span>{COPY.actions.seeEvents}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <Link
                to="/about"
                data-magnetic
                className="cc-btn cc-btn--secondary min-h-[44px] px-6 text-sm font-mono font-semibold"
              >
                <span>Learn about club</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--surface-1)] text-left" aria-labelledby="next-event-heading">
        <div className="w-full flex flex-col gap-6">
          <div className="flex items-end justify-between border-b border-[var(--border)] pb-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                01 / NEXT EVENT
              </span>
              <h2 id="next-event-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text)] mt-1 m-0">
                Next upcoming event
              </h2>
            </div>
            <Link
              to="/events"
              className="inline-flex items-center gap-1 font-mono text-xs sm:text-sm text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-4"
            >
              <span>All events</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="max-w-2xl">
              <EventCardSkeleton />
            </div>
          ) : nextEvent ? (
            <div data-cursor="view" className="p-6 sm:p-8 bg-[var(--surface-2)] border border-[var(--border)] rounded-md shadow-2 max-w-4xl flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="open" label={nextEvent.type} />
                {nextEventSeatsRemaining !== null && (
                  <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-[var(--surface-1)] border border-[var(--border)] rounded-sm text-[var(--text)] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                    <span>{nextEventSeatsRemaining} seats left</span>
                  </span>
                )}
                <span className="text-xs font-mono text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                  <time dateTime={nextEvent.starts_at}>
                    {new Date(nextEvent.starts_at).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })} IST
                  </time>
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)] m-0">
                  {nextEvent.title}
                </h3>
                <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed m-0 max-w-2xl">
                  {nextEvent.short_description}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-subtle)]">
                <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                <span>{nextEvent.venue}</span>
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center gap-3">
                <Link
                  to={`/events/${nextEvent.slug || nextEvent.id}`}
                  data-magnetic
                  className="cc-btn cc-btn--primary min-h-[44px] px-6 text-sm font-mono font-semibold"
                >
                  <span>View event details</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to={`/events/${nextEvent.slug || nextEvent.id}/register`}
                  data-cursor="register"
                  data-magnetic
                  className="cc-btn cc-btn--secondary min-h-[44px] px-6 text-sm font-mono font-semibold"
                >
                  <span>Register for event</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-left">
              <p className="text-sm text-[var(--text-muted)] font-mono m-0">
                {COPY.empty.noUpcomingEvents.description}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--bg)] text-left" aria-labelledby="what-we-do-title">
        <div className="w-full flex flex-col gap-6">
          <div className="border-b border-[var(--border)] pb-4">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              02 / THE WORK
            </span>
            <h2 id="what-we-do-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text)] mt-1 m-0">
              What we do
            </h2>
          </div>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHAT_WE_DO.map((item, idx) => (
              <StaggerItem key={item.id}>
                <SpotlightCard className="p-6 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col justify-between gap-4 text-left h-full">
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-xs text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                      0{idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-[var(--text)] m-0">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed m-0">
                      {item.description}
                    </p>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--surface-1)] text-left" aria-labelledby="stats-title">
        <div className="w-full flex flex-col gap-6">
          <div className="border-b border-[var(--border)] pb-4">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              03 / COMMUNITY METRICS
            </span>
            <h2 id="stats-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--text)] mt-1 m-0">
              Community impact
            </h2>
          </div>

          <div className="w-full border border-[var(--border)] rounded-md grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)] bg-[var(--surface-1)] shadow-1">
            {STATS.map((stat) => {
              const numMatch = stat.value.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)([^0-9]*)$/);
              return (
                <div key={stat.id} className="p-6 sm:p-8 flex flex-col justify-center text-left">
                  <div className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-[var(--text)]">
                    {numMatch ? (
                      <NumberTicker
                        prefix={numMatch[1]}
                        value={parseFloat(numMatch[2])}
                        suffix={numMatch[3]}
                      />
                    ) : (
                      stat.value
                    )}
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold mt-2">
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-12 sm:py-16 bg-[var(--surface-2)] text-left" aria-labelledby="join-cta-title">
        <div className="w-full flex flex-col items-start gap-4 max-w-4xl">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
            Student Membership
          </span>
          <h2 id="join-cta-title" className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text)] m-0">
            Join the club directly with your USN
          </h2>
          <p className="text-base text-[var(--text-muted)] leading-relaxed m-0">
            Any Kishkinda University student can activate club membership immediately with their academic profile. Once signed in, you can register for any workshop, hackathon, or demo day in one click.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            {user ? (
              <Link to="/events" className="cc-btn cc-btn--primary min-h-[44px] px-6 text-sm font-mono font-semibold">
                Explore upcoming events
              </Link>
            ) : (
              <>
                <Link to="/signup" className="cc-btn cc-btn--primary min-h-[44px] px-6 text-sm font-mono font-semibold">
                  Create student account
                </Link>
                <Link to="/signin" className="cc-btn cc-btn--secondary min-h-[44px] px-6 text-sm font-mono font-semibold">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-12 sm:py-16 bg-[var(--bg)] text-left" aria-labelledby="faq-title">
        <div className="w-full flex flex-col gap-6 max-w-4xl">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              FAQ
            </span>
            <h2 id="faq-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-1 m-0">
              Frequently asked questions
            </h2>
          </div>

          <Accordion
            items={FAQ_ITEMS.map((item, idx) => ({
              id: `faq-${idx}`,
              question: item.question,
              answer: item.answer,
            }))}
          />
        </div>
      </section>
    </HairlineGrid>
  );
};
