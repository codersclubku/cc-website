import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Share2, Users, Calendar, Clock, MapPin, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';
import { Badge } from '../components/Badge';
import { fetchEventBySlug, fetchEventById } from '../lib/api';
import type { DbEvent } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { COPY } from '../content/copy';

export const EventDetail: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { user } = useAuth();

  useEffect(() => {
    let active = true;

    async function load(showSpinner = true) {
      if (showSpinner) setLoading(true);
      try {
        let ev: DbEvent | null = null;
        if (slug) ev = await fetchEventBySlug(slug);
        else if (id) ev = await fetchEventById(id);
        if (active) {
          setEvent(ev);
          setNowMs(Date.now());
        }
      } finally {
        if (active && showSpinner) setLoading(false);
      }
    }

    load(true);

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        load(false);
      }
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        load(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [slug, id]);

  const eventMetrics = useMemo(() => {
    if (!event) return null;
    const startsAt = new Date(event.starts_at);
    const endsAt = new Date(event.ends_at);
    const deadline = new Date(event.registration_deadline);
    const isClosed = nowMs > deadline.getTime();
    const hoursUntilDeadline = (deadline.getTime() - nowMs) / (1000 * 60 * 60);
    const isClosingSoon = !isClosed && hoursUntilDeadline > 0 && hoursUntilDeadline <= 24;

    const currentCount = event.registrations_count || 0;
    const isFull = event.capacity ? currentCount >= event.capacity : false;
    const seatsRemaining = event.capacity ? Math.max(0, event.capacity - currentCount) : null;
    const waitlistCount = event.waitlist_count || 0;

    return {
      startsAt,
      endsAt,
      deadline,
      isClosed,
      isClosingSoon,
      isFull,
      currentCount,
      seatsRemaining,
      waitlistCount
    };
  }, [event, nowMs]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  if (loading) {
    return (
      <HairlineGrid>
        <section className="hairline-row p-8 sm:p-16 bg-[var(--bg)] min-h-[40vh] flex items-center justify-center">
          <div className="font-mono text-sm text-[var(--text-muted)] uppercase tracking-wider">
            Loading event...
          </div>
        </section>
      </HairlineGrid>
    );
  }

  if (!event) {
    return (
      <HairlineGrid>
        <section className="hairline-row p-8 sm:p-16 bg-[var(--bg)] text-left flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-[var(--text)] m-0">Event not found</h1>
          <p className="text-sm text-[var(--text-muted)] m-0">The requested event could not be found or has not been published.</p>
          <Link to="/events" className="cc-btn cc-btn--primary min-h-[40px] px-4 text-xs font-mono self-start">
            Back to events
          </Link>
        </section>
      </HairlineGrid>
    );
  }

  const { isClosed, isClosingSoon, isFull, seatsRemaining, waitlistCount } = eventMetrics!;
  const registerUrl = `/events/${event.slug || event.id}/register`;
  const signinUrl = `/signin?returnTo=${encodeURIComponent(registerUrl)}`;

  return (
    <HairlineGrid>
      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-8 sm:py-12 bg-[var(--bg)] text-left" aria-labelledby="event-title">
        <div className="flex flex-col gap-6 w-full">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <Link to="/" className="hover:text-[var(--text)] underline underline-offset-2">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/events" className="hover:text-[var(--text)] underline underline-offset-2">
              Events
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--text)] font-semibold" aria-current="page">
              {event.title}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge variant="open" label={event.type} />
            {isClosed ? (
              <Badge variant="closed" label="Registration closed" />
            ) : isFull ? (
              <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-[var(--warning-surface)] border border-[var(--warning-border)] text-[var(--warning-text)] rounded-sm">
                Waitlist Active ({waitlistCount} queued)
              </span>
            ) : isClosingSoon ? (
              <Badge variant="closing-soon" label="Closing soon" />
            ) : (
              <Badge variant="open" label="Registration open" />
            )}

            {seatsRemaining !== null && !isClosed && (
              <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-[var(--surface-1)] border border-[var(--border)] rounded-sm text-[var(--text)] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                <span>{isFull ? '0 seats available' : `${seatsRemaining} seats left`}</span>
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h1
              id="event-title"
              className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text)] leading-tight m-0"
            >
              {event.title}
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed m-0 max-w-[65ch]">
              {event.short_description}
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                <span>Date & Time</span>
              </span>
              <span className="text-sm font-semibold text-[var(--text)]">
                {new Date(event.starts_at).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {new Date(event.starts_at).toLocaleTimeString('en-IN', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })} - {new Date(event.ends_at).toLocaleTimeString('en-IN', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })} IST
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                <span>Venue</span>
              </span>
              <span className="text-sm font-semibold text-[var(--text)]">
                {event.venue}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Kishkinda University Campus
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                <span>Eligibility</span>
              </span>
              <span className="text-sm font-semibold text-[var(--text)]">
                {event.eligibility}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                All branch students eligible
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                <span>Deadline</span>
              </span>
              <span className="text-sm font-semibold text-[var(--text)]">
                {new Date(event.registration_deadline).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {new Date(event.registration_deadline).toLocaleTimeString('en-IN', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })} IST
              </span>
            </div>
          </div>

          {isFull && !isClosed && (
            <div className="p-4 bg-[var(--warning-surface)] border border-[var(--warning-border)] rounded-md flex items-start gap-3 text-xs font-mono text-[var(--warning-text)]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Capacity Reached:</strong> This event is at full capacity. You may register to join the priority waitlist. If an attendee cancels, waitlisted students are automatically promoted in order.
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isClosed ? (
              <button disabled className="cc-btn cc-btn--secondary min-h-[44px] px-6 text-sm font-mono opacity-50 cursor-not-allowed">
                <span>{COPY.status.closed.label}</span>
              </button>
            ) : user ? (
              <Link
                to={registerUrl}
                data-magnetic
                className="cc-btn cc-btn--primary min-h-[44px] px-6 text-sm font-mono font-semibold"
              >
                <span>{isFull ? 'Join Priority Waitlist' : COPY.actions.registerForEvent}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link to={signinUrl} data-magnetic className="cc-btn cc-btn--primary min-h-[44px] px-6 text-sm font-mono font-semibold">
                <span>{COPY.actions.signInToRegister}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}

            <button
              type="button"
              onClick={handleShare}
              data-magnetic
              className="cc-btn cc-btn--secondary min-h-[44px] px-4 text-sm font-mono flex items-center gap-2"
              title="Copy event link"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedShare ? 'Link copied!' : 'Share'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-3 max-w-[65ch] pt-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] m-0">
              Overview
            </h2>
            <div className="text-sm sm:text-base text-[var(--text)] leading-relaxed space-y-4 whitespace-pre-line text-left">
              {event.description}
            </div>
          </div>

          {event.agenda && event.agenda.length > 0 && (
            <div className="flex flex-col gap-4 max-w-[65ch]">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] m-0">
                Schedule & sessions
              </h2>
              <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-md bg-[var(--surface-1)] shadow-1 overflow-hidden">
                {event.agenda.map((item, idx) => (
                  <div key={idx} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] shrink-0 sm:w-36">
                      {item.time}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text)] flex-1">
                      {item.session}
                    </span>
                    {item.speaker && (
                      <span className="text-xs text-[var(--text-muted)] sm:text-right">
                        {item.speaker}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.prerequisites && event.prerequisites.length > 0 && (
            <div className="flex flex-col gap-4 max-w-[65ch]">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] m-0">
                Prerequisites & requirements
              </h2>
              <ul className="flex flex-col gap-2 list-none p-0 m-0">
                {event.prerequisites.map((req, idx) => (
                  <li key={idx} className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-sm text-[var(--text)] flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-1 pt-4 border-t border-[var(--border)] max-w-[65ch]">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Event Coordinator
            </span>
            <span className="text-sm font-bold text-[var(--text)]">
              {event.coordinator_name}
            </span>
          </div>
        </div>
      </section>

      <aside
        aria-label="Registration action bar"
        className="md:hidden fixed inset-x-0 bottom-0 z-[150] h-[72px] bg-[var(--surface-1)] border-t border-[var(--border-strong)] px-4 flex items-center justify-between shadow-4 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex flex-col">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Seats status</span>
          <span className="text-xs font-semibold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-mono">
            {isClosed ? 'Closed' : isFull ? `Full (${waitlistCount} waitlisted)` : seatsRemaining !== null ? `${seatsRemaining} seats left` : 'Seats available'}
          </span>
        </div>

        {isClosed ? (
          <button disabled className="cc-btn cc-btn--secondary min-h-[44px] px-5 text-xs font-mono opacity-50 cursor-not-allowed">
            Closed
          </button>
        ) : user ? (
          <Link
            to={registerUrl}
            className="cc-btn cc-btn--primary min-h-[44px] px-5 text-xs font-mono font-semibold"
          >
            {isFull ? 'Join Waitlist' : COPY.actions.registerForEvent}
          </Link>
        ) : (
          <Link
            to={signinUrl}
            className="cc-btn cc-btn--primary min-h-[44px] px-5 text-xs font-mono font-semibold"
          >
            {COPY.actions.signInToRegister}
          </Link>
        )}
      </aside>
    </HairlineGrid>
  );
};
