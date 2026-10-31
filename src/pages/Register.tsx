import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, MapPin, Download, ArrowLeft, AlertCircle, CheckCircle2, User, WifiOff, RefreshCw, MailWarning, Clock3 } from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { QrTicket } from '../components/QrTicket';
import { fetchPublishedEvents, fetchEventBySlug, fetchEventById, registerStudentForEvent, fetchStudentRegistrations } from '../lib/api';
import type { DbEvent, RegistrationResult, DbStudentRegistration } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { downloadIcsFile } from '../lib/calendar';
import {
  addToOfflineQueue,
  isEventQueuedOffline,
  replayOfflineQueue,
  getOfflineSyncResults
} from '../lib/offlineQueue';

export const Register: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const { user, profile, isEmailVerified, resendVerificationEmail } = useAuth();
  const location = useLocation();

  const [event, setEvent] = useState<DbEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [existingReg, setExistingReg] = useState<DbStudentRegistration | null>(null);
  const [queuedOffline, setQueuedOffline] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());

  const metrics = useMemo(() => {
    if (!event) return null;
    const startsAt = new Date(event.starts_at);
    const deadline = new Date(event.registration_deadline);
    const isClosed = nowMs > deadline.getTime();
    const currentCount = event.registrations_count || 0;
    const isFull = event.capacity ? currentCount >= event.capacity : false;
    const seatsRemaining = event.capacity ? Math.max(0, event.capacity - currentCount) : null;
    const waitlistCount = event.waitlist_count || 0;
    return { startsAt, deadline, isClosed, isFull, currentCount, seatsRemaining, waitlistCount };
  }, [event, nowMs]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      if (user?.id) {
        const syncResults = await replayOfflineQueue(registerStudentForEvent, user.id);
        if (syncResults.length > 0) {
          const matching = syncResults.find((r) => event && r.eventId === event.id);
          if (matching) {
            setQueuedOffline(false);
            if (matching.status === 'registered' || matching.status === 'waitlisted') {
              setResult({
                success: true,
                code: matching.status === 'waitlisted' ? 'WAITLISTED' : 'REGISTERED',
                status: matching.status,
                message: matching.message,
                confirmation_id: matching.confirmationId
              });
              setSyncSummary(`Synced while returning online: ${matching.message}`);
            } else {
              setServerError(`Offline sync failed: ${matching.message}`);
            }
          }
        }
      }
    };

    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const pastResults = getOfflineSyncResults();
    if (event && pastResults.length > 0) {
      const match = pastResults.find((r) => r.eventId === event.id);
      if (match) {
        setSyncSummary(`Previous offline sync result: ${match.message} (${new Date(match.syncedAt).toLocaleTimeString()})`);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id, event]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        let ev: DbEvent | null = null;
        if (slug) {
          ev = await fetchEventBySlug(slug);
        } else if (id) {
          ev = await fetchEventById(id);
        } else {
          const list = await fetchPublishedEvents();
          if (list.length > 0) ev = list[0];
        }

        if (active && ev) {
          setEvent(ev);
          if (user?.id) {
            const myRegs = await fetchStudentRegistrations(user.id);
            const found = myRegs.find((r) => r.event_id === ev!.id && r.status !== 'cancelled');
            if (found) {
              setExistingReg(found);
            }
            if (isEventQueuedOffline(ev.id, user.id)) {
              setQueuedOffline(true);
            }
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug, id, user?.id]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendMessage(null);
    const res = await resendVerificationEmail();
    if (res.success) {
      setResendMessage('Verification email sent! Check your inbox.');
      setResendCooldown(60);
    } else {
      setResendMessage(res.error || 'Failed to resend email.');
    }
  };

  const handleConfirmRegistration = async () => {
    if (!event || !user?.id) return;
    setServerError(null);

    if (isOffline) {
      addToOfflineQueue({
        eventId: event.id,
        studentId: user.id,
        eventTitle: event.title,
        queuedAt: new Date().toISOString()
      });
      setQueuedOffline(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerStudentForEvent(event.id, user.id);
      setIsSubmitting(false);

      if (!res.success) {
        if ((res.code === 'ALREADY_REGISTERED' || res.code === 'ALREADY_WAITLISTED') && res.confirmation_id) {
          setExistingReg({
            id: res.confirmation_id,
            event_id: event.id,
            student_id: user.id,
            confirmation_id: res.confirmation_id,
            status: res.code === 'ALREADY_WAITLISTED' ? 'waitlisted' : 'registered',
            created_at: new Date().toISOString(),
            event_title: event.title,
            starts_at: event.starts_at,
            ends_at: event.ends_at,
            venue: event.venue
          });
        }
        setServerError(res.message);
        return;
      }

      setResult(res);
    } catch {
      setIsSubmitting(false);
      setServerError('An unexpected error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <HairlineGrid>
        <div className="hairline-row w-full px-6 py-16 flex items-center justify-center min-h-[40vh]">
          <span className="font-mono text-sm text-[var(--text-muted)] uppercase tracking-wider">
            Loading registration details...
          </span>
        </div>
      </HairlineGrid>
    );
  }

  if (!event) {
    return (
      <HairlineGrid>
        <div className="hairline-row w-full px-6 py-16 flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="w-10 h-10 text-[var(--text-muted)]" />
          <h1 className="font-display font-extrabold text-2xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Event unavailable
          </h1>
          <p className="text-sm text-[var(--text)] m-0">
            No active event was found for registration.
          </p>
          <Link to="/events" className="cc-btn cc-btn--primary min-h-[44px] text-xs font-mono font-bold mt-2">
            Back to events
          </Link>
        </div>
      </HairlineGrid>
    );
  }

  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname);
    return (
      <HairlineGrid>
        <div data-cursor-native className="hairline-row w-full px-4 sm:px-6 py-16 flex justify-center">
          <div className="max-w-lg w-full bg-[var(--surface-1)] border border-[var(--border)] p-8 rounded-md shadow-2 flex flex-col gap-5 text-left">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Kishkinda University Student Sign In
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
              Sign in to register
            </h1>
            <p className="text-sm text-[var(--text)] leading-relaxed m-0">
              Registrations for <strong>{event.title}</strong> are reserved for verified students of Kishkinda University. Sign in or create an account to register in one click with your saved academic profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <Link
                to={`/signin?returnTo=${returnUrl}`}
                className="cc-btn cc-btn--primary min-h-[48px] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center"
              >
                Sign in to register
              </Link>
              <Link
                to={`/signup?returnTo=${returnUrl}`}
                className="cc-btn cc-btn--secondary min-h-[48px] text-xs font-mono font-semibold uppercase tracking-wider flex items-center justify-center"
              >
                Create student account
              </Link>
            </div>
          </div>
        </div>
      </HairlineGrid>
    );
  }

  const { startsAt, isClosed, isFull, seatsRemaining, waitlistCount } = metrics || {
    startsAt: new Date(event.starts_at),
    isClosed: false,
    isFull: false,
    seatsRemaining: null,
    waitlistCount: 0
  };

  return (
    <HairlineGrid>
      <div data-cursor-native className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 text-left max-w-4xl mx-auto flex flex-col gap-8">
        <Link
          to={`/events/${event.slug || event.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-strong)] self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to event details</span>
        </Link>

        <div className="flex flex-col gap-2 pb-4 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="open" label={event.type} />
            {isClosed ? (
              <Badge variant="closed" label="Registration closed" />
            ) : isFull ? (
              <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-[var(--warning-surface)] border border-[var(--warning-border)] text-[var(--warning-text)] rounded-sm">
                Waitlist Active ({waitlistCount} queued)
              </span>
            ) : seatsRemaining !== null ? (
              <Badge variant="open" label={`${seatsRemaining} seats left`} />
            ) : (
              <Badge variant="open" label="Seats available" />
            )}
            {isOffline && (
              <span className="px-2 py-0.5 text-xs font-mono bg-[var(--color-warning-soft)] text-[var(--color-warning-strong)] dark:text-[var(--color-warning)] border border-[var(--color-warning-border)] rounded-xs flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                <span>Offline Mode</span>
              </span>
            )}
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--text-muted)] pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{startsAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{startsAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })} IST</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{event.venue}</span>
            </div>
          </div>
        </div>

        {syncSummary && (
          <Alert variant="info" onDismiss={() => setSyncSummary(null)}>
            {syncSummary}
          </Alert>
        )}

        {queuedOffline && (
          <div className="p-4 bg-[var(--color-warning-soft)] border border-[var(--color-warning-border)] rounded-md flex flex-col gap-2 text-xs font-mono text-[var(--color-warning-strong)] dark:text-[var(--color-warning)]">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[var(--color-warning-strong)] dark:text-[var(--color-warning)] animate-spin" />
              <span className="font-bold">Queued Offline - Pending Sync</span>
            </div>
            <p className="m-0 leading-relaxed">
              Your registration request for <strong>{event.title}</strong> has been saved locally on this device. It carries an idempotency token and will automatically transmit to the university server as soon as internet connectivity returns.
            </p>
          </div>
        )}

        {existingReg && (
          <div className="flex flex-col gap-4">
            <div className={`p-4 border rounded-md flex items-center gap-2 text-xs font-mono ${
              existingReg.status === 'waitlisted'
                ? 'bg-[var(--warning-surface)] border-[var(--warning-border)] text-[var(--warning-text)]'
                : 'bg-[var(--success-surface)] border-[var(--success-border)] text-[var(--success-text)]'
            }`}>
              {existingReg.status === 'waitlisted' ? (
                <>
                  <Clock3 className="w-4 h-4 shrink-0" />
                  <span>You are on the priority waitlist for this event. Confirmation ID: <strong>{existingReg.confirmation_id}</strong>.</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>You are registered for this event! Here is your official entry pass.</span>
                </>
              )}
            </div>

            <QrTicket
              confirmationId={existingReg.confirmation_id}
              eventTitle={event.title}
              startsAt={event.starts_at}
              venue={event.venue}
              studentName={profile?.full_name}
              usn={profile?.usn}
              status={existingReg.status}
              checkedInAt={existingReg.checked_in_at}
            />

            <div className="flex items-center gap-3 pt-2">
              {existingReg.status === 'registered' && (
                <button
                  type="button"
                  onClick={() =>
                    downloadIcsFile({
                      title: event.title,
                      description: event.short_description,
                      venue: event.venue,
                      startsAt: event.starts_at,
                      endsAt: event.ends_at,
                      confirmationId: existingReg.confirmation_id
                    })
                  }
                  className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Add to Calendar (.ics)</span>
                </button>
              )}
              <Link to="/account" className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono">
                Manage in Account
              </Link>
            </div>
          </div>
        )}

        {!existingReg && result && (
          <div className="flex flex-col gap-4">
            <div className={`p-4 border rounded-md flex items-center gap-2 text-xs font-mono ${
              result.status === 'waitlisted'
                ? 'bg-[var(--warning-surface)] border-[var(--warning-border)] text-[var(--warning-text)]'
                : 'bg-[var(--success-surface)] border-[var(--success-border)] text-[var(--success-text)]'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {result.status === 'waitlisted'
                  ? `Waitlist entry confirmed! You are placed at position #${result.waitlist_position || 1}.`
                  : 'Registration confirmed successfully!'}
              </span>
            </div>

            <QrTicket
              confirmationId={result.confirmation_id || 'CONFIRMED'}
              eventTitle={event.title}
              startsAt={event.starts_at}
              venue={event.venue}
              studentName={profile?.full_name}
              usn={profile?.usn}
              status={result.status || 'registered'}
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  downloadIcsFile({
                    title: event.title,
                    description: event.short_description,
                    venue: event.venue,
                    startsAt: event.starts_at,
                    endsAt: event.ends_at,
                    confirmationId: result.confirmation_id
                  })
                }
                className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Add to Calendar (.ics)</span>
              </button>
              <Link to="/account" className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono">
                View in My Registrations
              </Link>
            </div>
          </div>
        )}

        {!existingReg && !result && (
          <div className="flex flex-col gap-6">
            {!isEmailVerified && (
              <div className="p-5 bg-[var(--danger-surface)] border-2 border-[var(--danger-border)] rounded-md flex flex-col gap-3 text-left">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--danger-text)]">
                  <MailWarning className="w-5 h-5 shrink-0" />
                  <span>Email Verification Required to Register</span>
                </div>
                <p className="text-xs text-[var(--text-strong)] leading-relaxed m-0 font-mono">
                  Event registration requires a confirmed email address to deliver your digital QR pass. Please verify your email <strong>{user.email}</strong> to activate event entry.
                </p>

                {resendMessage && (
                  <div className="p-2.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-strong)]">
                    {resendMessage}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="cc-btn cc-btn--primary min-h-[42px] px-4 text-xs font-mono font-bold"
                  >
                    {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : 'Resend Verification Email'}
                  </button>
                  <Link
                    to="/account"
                    className="cc-btn cc-btn--secondary min-h-[42px] px-4 text-xs font-mono"
                  >
                    Manage Account
                  </Link>
                </div>
              </div>
            )}

            {serverError && (
              <Alert variant="danger" onDismiss={() => setServerError(null)}>
                {serverError}
              </Alert>
            )}

            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col gap-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--accent)]" />
                <span>1-Click Student Registration</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-[var(--text-muted)] border-y border-[var(--border)] py-4">
                <div>
                  <span className="block text-[11px] uppercase">Student Name:</span>
                  <span className="text-sm font-bold text-[var(--text-strong)] font-sans">{profile?.full_name || user.email}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase">University USN:</span>
                  <span className="text-sm font-bold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">{profile?.usn || 'Profile Pending'}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase">Department:</span>
                  <span className="text-sm text-[var(--text-strong)]">{profile?.department || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase">Year & Semester:</span>
                  <span className="text-sm text-[var(--text-strong)]">{profile?.year || '1st Year'} • {profile?.semester || '1st Semester'}</span>
                </div>
              </div>

              {isFull && !isClosed && (
                <div className="p-3 bg-[var(--warning-surface)] border border-[var(--warning-border)] rounded-sm text-xs font-mono text-[var(--warning-text)] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    This event is currently full. Submitting this form will register you for the <strong>Priority Waitlist</strong>. If a confirmed attendee cancels, waitlisted students are automatically promoted.
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                <span className="text-xs text-[var(--text-muted)]">
                  By clicking below, you confirm your attendance and agree to abide by the event guidelines.
                </span>

                <button
                  type="button"
                  onClick={handleConfirmRegistration}
                  disabled={isSubmitting || isClosed || (!isEmailVerified && !isOffline)}
                  className={`cc-btn min-h-[48px] px-8 text-xs font-mono font-bold uppercase tracking-wider shrink-0 ${
                    isFull ? 'cc-btn--secondary' : 'cc-btn--primary'
                  }`}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : !isEmailVerified && !isOffline
                    ? 'Verify Email to Register'
                    : isOffline
                    ? 'Queue Offline'
                    : isFull
                    ? 'Confirm Waitlist Spot'
                    : 'Confirm 1-Click Registration'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HairlineGrid>
  );
};
