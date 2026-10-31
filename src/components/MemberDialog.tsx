import React, { useEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Phone,
  Copy, 
  Check, 
  Globe,
  GraduationCap,
  Calendar,
  Briefcase,
  ListChecks
} from 'lucide-react';
import { GithubIcon, LinkedinIcon, InstagramIcon } from './SocialIcons';
import { motion, AnimatePresence } from 'motion/react';
import { PEOPLE_GROUPS, getDefaultResponsibilities, formatPhoneHref, formatPhoneDisplay } from '../content/people';
import type { Person } from '../content/people';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { HalftoneAvatar } from './halftone/HalftoneAvatar';

interface MemberDialogProps {
  member: Person | null;
  groupMembers: Person[];
  onClose: () => void;
  onNavigate: (member: Person) => void;
  triggerRect?: DOMRect | null;
}

export const MemberDialog: React.FC<MemberDialogProps> = ({
  member,
  groupMembers,
  onClose,
  onNavigate,
  triggerRect,
}) => {
  const [copiedType, setCopiedType] = useState<'email' | 'phone' | null>(null);
  const [photoErrorMap, setPhotoErrorMap] = useState<Record<string, boolean>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState<number>(0);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');
  const [portraitMode, setPortraitMode] = useState<'halftone' | 'photo'>(() => {
    try {
      const saved = sessionStorage.getItem('cc-team-portrait-mode');
      if (saved === 'photo' || saved === 'halftone') return saved;
    } catch {
    }
    return 'halftone';
  });

  const handleToggleMode = (mode: 'halftone' | 'photo') => {
    setPortraitMode(mode);
    try {
      sessionStorage.setItem('cc-team-portrait-mode', mode);
    } catch {
    }
  };

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const summaryId = useId();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!member) return;

    const previousTitle = document.title;
    document.title = `${member.name} - Team`;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const mainEl = document.getElementById('main-content');
    if (mainEl) mainEl.setAttribute('inert', '');

    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    return () => {
      document.title = previousTitle;
      document.body.style.overflow = originalOverflow;
      if (mainEl) mainEl.removeAttribute('inert');
      clearTimeout(timer);
    };
  }, [member]);

  const currentIndex = member ? groupMembers.findIndex((m) => m.id === member.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < groupMembers.length - 1;

  const goToPrev = () => {
    if (hasPrev) {
      const prevMember = groupMembers[currentIndex - 1];
      onNavigate(prevMember);
      setLiveAnnouncement(`Viewing ${prevMember.name}, ${prevMember.role}`);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      const nextMember = groupMembers[currentIndex + 1];
      onNavigate(nextMember);
      setLiveAnnouncement(`Viewing ${nextMember.name}, ${nextMember.role}`);
    }
  };

  const navRef = useRef({ goToPrev, goToNext, onClose });
  useEffect(() => {
    navRef.current = { goToPrev, goToNext, onClose };
  });

  useEffect(() => {
    if (!member) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        navRef.current.onClose();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navRef.current.goToPrev();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navRef.current.goToNext();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [member]);

  const copyToClipboard = async (text: string, type: 'email' | 'phone') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setLiveAnnouncement(type === 'email' ? 'Copied email to clipboard' : 'Copied phone number to clipboard');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      setLiveAnnouncement('Unable to copy to clipboard');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
    setTouchDelta(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.targetTouches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) {
      setTouchDelta(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchDelta > 90) {
      onClose();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  if (!member) return null;

  const matchedPerson = PEOPLE_GROUPS.flatMap((g) => g.members).find(
    (p) => p.id === member.id || p.name.trim().toLowerCase() === member.name.trim().toLowerCase()
  );

  const memberEmail = member.email || matchedPerson?.email;
  const memberPhone = member.phone || matchedPerson?.phone;
  const memberResponsibilities = 
    (member.responsibilities && member.responsibilities.length > 0)
      ? member.responsibilities
      : (matchedPerson?.responsibilities && matchedPerson.responsibilities.length > 0)
      ? matchedPerson.responsibilities
      : getDefaultResponsibilities(member.role, member.group);

  const isFaculty = member.group === 'Faculty coordinators' || member.role.toLowerCase().includes('faculty');
  const showContactBlock = isFaculty 
    ? Boolean(memberEmail || memberPhone) 
    : Boolean((member.showContact ?? matchedPerson?.showContact) && (memberEmail || memberPhone));

  const hasLinks = Boolean(member.github || member.linkedin || member.instagram || member.website);


  const initialMotion = prefersReduced
    ? { opacity: 0 }
    : triggerRect
    ? {
        opacity: 0,
        scale: 0.85,
        y: triggerRect.top > window.innerHeight / 2 ? 30 : -30,
      }
    : { opacity: 0, scale: 0.95, y: 20 };

  return createPortal(
    <div
      data-cursor-native
      className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-6"
    >
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveAnnouncement}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-sm"
        aria-hidden="true"
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={summaryId}
        initial={initialMotion}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
        style={{
          transform: touchDelta > 0 ? `translateY(${touchDelta}px)` : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full md:max-w-[760px] max-h-[90dvh] md:max-h-[85dvh] bg-[var(--surface-1)] border-t md:border border-[var(--border)] rounded-t-2xl md:rounded-md shadow-5 flex flex-col overflow-hidden text-left pixel-step-corner"
      >
        <div className="md:hidden pt-3 pb-1 flex justify-center shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-[var(--border-strong)] rounded-full opacity-60" aria-hidden="true" />
        </div>

        <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-[var(--surface-1)]/95 backdrop-blur-md border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              {member.group}
            </span>
            <span className="text-[var(--text-subtle)] text-xs font-mono" aria-hidden="true">/</span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {currentIndex + 1} of {groupMembers.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToPrev}
              disabled={!hasPrev}
              aria-label="Previous member in group"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={goToNext}
              disabled={!hasNext}
              aria-label="Next member in group"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={member.id}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -8 }}
              transition={{ duration: 0.16 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
            >
              <div className="md:col-span-5 flex flex-col gap-4">
                <div className="w-full max-w-[260px] mx-auto md:mx-0 flex flex-col gap-2">
                  {member.photo && portraitMode === 'photo' && !photoErrorMap[member.id] ? (
                    <div className="w-full aspect-[4/5] rounded-sm overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] shadow-1 relative">
                      <img
                        src={member.photo}
                        alt={member.name}
                        onError={() => setPhotoErrorMap((prev) => ({ ...prev, [member.id]: true }))}
                        loading="lazy"
                        width="300"
                        height="375"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <HalftoneAvatar
                      id={member.id}
                      name={member.name}
                      photo={member.photo}
                      focalX={member.focalX}
                      focalY={member.focalY}
                      sizeMode="hero"
                      active={true}
                    />
                  )}

                  {member.photo && !photoErrorMap[member.id] && (
                    <div
                      role="group"
                      aria-label="Portrait display mode"
                      className="flex items-center justify-center p-0.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm text-xs font-mono"
                    >
                      <button
                        type="button"
                        aria-pressed={portraitMode === 'halftone'}
                        onClick={() => handleToggleMode('halftone')}
                        className={`flex-1 py-1 px-2 rounded-xs transition-colors ${
                          portraitMode === 'halftone'
                            ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        Halftone
                      </button>
                      <button
                        type="button"
                        aria-pressed={portraitMode === 'photo'}
                        onClick={() => handleToggleMode('photo')}
                        className={`flex-1 py-1 px-2 rounded-xs transition-colors ${
                          portraitMode === 'photo'
                            ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        Photo
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <h2
                    id={titleId}
                    className="text-xl sm:text-2xl font-bold text-[var(--text)] m-0 leading-tight"
                  >
                    {member.name}
                  </h2>
                  <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] mt-0.5">
                    {member.role}
                  </div>
                  {member.designation && member.designation !== member.role && (
                    <div className="text-xs text-[var(--text-muted)] font-mono">
                      {member.designation}
                    </div>
                  )}
                </div>

                {hasLinks && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
                    {member.github && (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name}'s GitHub profile`}
                        className="min-h-[44px] min-w-[44px] px-3 py-2 inline-flex items-center gap-1.5 rounded-sm border border-[var(--border)] text-xs font-mono text-[var(--text)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                      >
                        <GithubIcon className="w-4 h-4" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name}'s LinkedIn profile`}
                        className="min-h-[44px] min-w-[44px] px-3 py-2 inline-flex items-center gap-1.5 rounded-sm border border-[var(--border)] text-xs font-mono text-[var(--text)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                      >
                        <LinkedinIcon className="w-4 h-4" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {member.instagram && (
                      <a
                        href={member.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name}'s Instagram profile`}
                        className="min-h-[44px] min-w-[44px] px-3 py-2 inline-flex items-center gap-1.5 rounded-sm border border-[var(--border)] text-xs font-mono text-[var(--text)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                      >
                        <InstagramIcon className="w-4 h-4" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {member.website && (
                      <a
                        href={member.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name}'s personal website`}
                        className="min-h-[44px] min-w-[44px] px-3 py-2 inline-flex items-center gap-1.5 rounded-sm border border-[var(--border)] text-xs font-mono text-[var(--text)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-7 flex flex-col gap-5 text-left">
                <div id={summaryId} className="flex flex-col gap-2 p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm">
                  {member.department && (
                    <div className="flex items-center gap-2 text-xs font-sans text-[var(--text)]">
                      <GraduationCap className="w-4 h-4 text-[var(--accent)] shrink-0" aria-hidden="true" />
                      <span>{member.department}</span>
                    </div>
                  )}

                  {member.year && (
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                      <Calendar className="w-4 h-4 text-[var(--accent)] shrink-0" aria-hidden="true" />
                      <span>{member.year}{member.semester ? ` · ${member.semester}` : ''}</span>
                    </div>
                  )}

                  {member.joinedYear && (
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                      <Briefcase className="w-4 h-4 text-[var(--accent)] shrink-0" aria-hidden="true" />
                      <span>Member since {member.joinedYear}</span>
                    </div>
                  )}
                </div>

                {member.bio && (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                      Bio
                    </span>
                    <p className="text-sm font-sans text-[var(--text)] leading-relaxed m-0">
                      {member.bio}
                    </p>
                  </div>
                )}

                {memberResponsibilities && memberResponsibilities.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" aria-hidden="true" />
                      Tasks & Activities
                    </span>
                    <ul className="flex flex-col gap-2 p-0 m-0 list-none">
                      {memberResponsibilities.map((resp, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-xs font-sans text-[var(--text)] leading-relaxed bg-[var(--surface-2)]/60 p-2.5 rounded-sm border border-[var(--border)]"
                        >
                          <span className="font-mono text-xs text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold px-1.5 py-0.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-xs shrink-0 mt-0.5">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {member.skills && member.skills.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                      Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xs text-xs font-mono text-[var(--text)]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {showContactBlock && Boolean(memberEmail || memberPhone) && (
                  <div className="flex flex-col gap-3 pt-3 border-t border-[var(--border)]">
                    <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                      Contact
                    </span>

                    <div className="flex flex-col gap-2.5">
                      {memberEmail && (
                        <div className="p-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" aria-hidden="true" />
                            <a
                              href={`mailto:${memberEmail}`}
                              className="text-xs font-mono font-medium text-[var(--link)] hover:text-[var(--link-hover)] truncate underline underline-offset-2"
                              aria-label={`Email ${memberEmail}`}
                            >
                              {memberEmail}
                            </a>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={`mailto:${memberEmail}`}
                              className="min-h-[44px] px-2.5 inline-flex items-center justify-center rounded-xs border border-[var(--border)] text-xs font-mono font-semibold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] hover:bg-[var(--surface-1)] transition-colors no-underline"
                            >
                              Email
                            </a>

                            <button
                              type="button"
                              onClick={() => copyToClipboard(memberEmail, 'email')}
                              aria-label="Copy email"
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xs border border-[var(--border)] text-xs text-[var(--text)] hover:bg-[var(--surface-1)] transition-colors"
                            >
                              {copiedType === 'email' ? (
                                <Check className="w-3.5 h-3.5 text-[var(--success-strong)]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {memberPhone && (
                        <div className="p-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Phone className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" aria-hidden="true" />
                            <a
                              href={formatPhoneHref(memberPhone)}
                              className="text-xs font-mono font-medium text-[var(--link)] hover:text-[var(--link-hover)] truncate underline underline-offset-2"
                              aria-label={`Call ${formatPhoneDisplay(memberPhone)}`}
                            >
                              {formatPhoneDisplay(memberPhone)}
                            </a>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={formatPhoneHref(memberPhone)}
                              className="min-h-[44px] px-2.5 inline-flex items-center justify-center rounded-xs border border-[var(--border)] text-xs font-mono font-semibold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] hover:bg-[var(--surface-1)] transition-colors no-underline"
                            >
                              Call
                            </a>

                            <button
                              type="button"
                              onClick={() => copyToClipboard(formatPhoneDisplay(memberPhone), 'phone')}
                              aria-label="Copy phone number"
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xs border border-[var(--border)] text-xs text-[var(--text)] hover:bg-[var(--surface-1)] transition-colors"
                            >
                              {copiedType === 'phone' ? (
                                <Check className="w-3.5 h-3.5 text-[var(--success-strong)]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
