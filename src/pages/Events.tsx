import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';
import { Badge } from '../components/Badge';
import { SpotlightCard } from '../components/SpotlightCard';
import { EmptyState } from '../components/EmptyState';
import { StaggerGrid, StaggerItem } from '../components/ScrollReveal';
import { EventCardSkeleton } from '../components/Skeleton';
import { fetchPublishedEvents } from '../lib/api';
import type { DbEvent } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { COPY } from '../content/copy';

export const Events: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const list = await fetchPublishedEvents();
        if (active) {
          setEvents(list);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const upcoming = events
      .filter((e) => new Date(e.ends_at).getTime() >= nowMs)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    const past = events
      .filter((e) => new Date(e.ends_at).getTime() < nowMs)
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events, nowMs]);

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <HairlineGrid>
      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--bg)]" aria-labelledby="events-heading">
        <div className="flex flex-col gap-6 w-full text-left">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Workshops & Hackathons
            </span>
            <h1
              id="events-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-tight m-0"
            >
              Events
            </h1>
            <p className="text-base text-[var(--text-muted)] mt-2">
              Technical workshops, hackathons, and demo days organized by Coders Club for Kishkinda University students.
            </p>

            <div className="mt-4 p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              {user ? (
                <div className="flex items-center gap-2 text-[var(--success-text)]">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success-strong)] shrink-0" />
                  <span>
                    Signed in as <strong>{profile?.usn || profile?.full_name || user.email}</strong>. 1-click event registration is active for your account.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
                  <span className="text-[var(--text)]">
                    Kishkinda University students: Sign in to activate 1-click registration for all events.
                  </span>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
                    <Link to="/signin" className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono font-semibold text-center justify-center">
                      Sign in to register
                    </Link>
                    <Link to="/signup" className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono font-semibold text-center justify-center">
                      Create student account
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-[var(--border)] pt-2" role="tablist" aria-label="Event timeframes">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'upcoming'}
              aria-controls="events-tabpanel"
              id="tab-upcoming"
              onClick={() => setActiveTab('upcoming')}
              className={`min-h-[44px] px-5 text-sm font-mono font-semibold transition-colors border-b-2 -mb-[1px] cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'border-[var(--accent)] text-[var(--text)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'past'}
              aria-controls="events-tabpanel"
              id="tab-past"
              onClick={() => setActiveTab('past')}
              className={`min-h-[44px] px-5 text-sm font-mono font-semibold transition-colors border-b-2 -mb-[1px] cursor-pointer ${
                activeTab === 'past'
                  ? 'border-[var(--accent)] text-[var(--text)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Past ({pastEvents.length})
            </button>
          </div>

          <div
            id="events-tabpanel"
            role="tabpanel"
            aria-labelledby={activeTab === 'upcoming' ? 'tab-upcoming' : 'tab-past'}
            className="pt-2"
          >
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EventCardSkeleton />
                <EventCardSkeleton />
                <EventCardSkeleton />
              </div>
            ) : displayedEvents.length === 0 ? (
              <EmptyState
                title={activeTab === 'upcoming' ? COPY.empty.noUpcomingEvents.title : COPY.empty.noPastEvents.title}
                description={
                  activeTab === 'upcoming'
                    ? COPY.empty.noUpcomingEvents.description
                    : COPY.empty.noPastEvents.description
                }
                actionText={activeTab === 'upcoming' ? 'Contact coordinators' : 'See upcoming events'}
                actionHref={activeTab === 'upcoming' ? '/contact' : '/events'}
              />
            ) : (
              <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedEvents.map((ev) => {
                  const startsAt = new Date(ev.starts_at);
                  const deadline = new Date(ev.registration_deadline);
                  const isClosed = nowMs > deadline.getTime();
                  const hoursUntilDeadline = (deadline.getTime() - nowMs) / (1000 * 60 * 60);
                  const isClosingSoon = !isClosed && hoursUntilDeadline > 0 && hoursUntilDeadline <= 24;

                  return (
                    <StaggerItem key={ev.id}>
                      <SpotlightCard className="p-6 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col justify-between gap-5 hover:border-[var(--accent)] transition-colors text-left h-full">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="open" label={ev.type} />
                            {isClosingSoon && <Badge variant="closing-soon" label={COPY.status.closingSoon.label} title={COPY.status.closingSoon.tooltip} />}
                            {isClosed && <Badge variant="closed" label={COPY.status.closed.label} title={COPY.status.closed.tooltip} />}
                          </div>

                          <h3 className="text-xl font-bold font-sans text-[var(--text)] m-0">
                            {ev.title}
                          </h3>

                          <div className="flex flex-col gap-1 text-xs font-mono pt-1">
                            <div className="flex items-center gap-1.5 text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" aria-hidden="true" />
                              <time dateTime={ev.starts_at}>
                                {startsAt.toLocaleDateString('en-IN', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </time>
                            </div>

                            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>
                                {startsAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })} IST
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>{ev.venue}</span>
                            </div>
                          </div>

                          <p className="text-xs text-[var(--text-muted)] leading-relaxed m-0 line-clamp-2 mt-1">
                            {ev.short_description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-2">
                          <Link
                            to={`/events/${ev.slug || ev.id}`}
                            className="text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-4 inline-flex items-center gap-1 font-semibold"
                          >
                            <span>View event details</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>

                          {!isClosed && (
                            <Link
                              to={`/events/${ev.slug || ev.id}/register`}
                              className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono font-semibold"
                            >
                              <span>{COPY.actions.registerForEvent}</span>
                            </Link>
                          )}
                        </div>
                      </SpotlightCard>
                    </StaggerItem>
                  );
                })}
              </StaggerGrid>
            )}
          </div>
        </div>
      </section>
    </HairlineGrid>
  );
};
