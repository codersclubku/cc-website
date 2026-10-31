import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, ArrowUpRight, Phone } from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';
import { HalftoneAvatar } from '../components/halftone/HalftoneAvatar';
import { PEOPLE_GROUPS, formatPhoneHref, formatPhoneDisplay } from '../content/people';
import type { Person, PeopleGroup } from '../content/people';
import { fetchTeamGroups } from '../lib/api';

const MemberDialog = lazy(() =>
  import('../components/MemberDialog').then((m) => ({ default: m.MemberDialog }))
);

export const Team: React.FC = () => {
  const [searchParams] = useSearchParams();
  const memberParam = searchParams.get('member');

  const [groups, setGroups] = useState<PeopleGroup[]>(() => PEOPLE_GROUPS);

  let initialPerson: Person | null = null;
  let initialGroup: Person[] = [];
  if (memberParam) {
    for (const group of groups) {
      const found = group.members.find((m) => m.id === memberParam);
      if (found) {
        initialPerson = found;
        initialGroup = group.members;
        break;
      }
    }
  }

  const [selectedMember, setSelectedMember] = useState<Person | null>(() => initialPerson);
  const [selectedGroup, setSelectedGroup] = useState<Person[]>(() => initialGroup);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const originatingButtonRef = useRef<HTMLButtonElement | null>(null);
  const preloadedRef = useRef(false);

  useEffect(() => {
    let active = true;
    fetchTeamGroups().then((data) => {
      if (active && data && data.length > 0) {
        setGroups(data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);
  const totalTeams = groups.length;
  const facultyGroup = groups.find((g) => g.id === 'faculty-coordinators');
  const facultyCount = facultyGroup?.members.length || 0;

  const preloadDialog = () => {
    if (!preloadedRef.current) {
      preloadedRef.current = true;
      import('../components/MemberDialog');
    }
  };

  useEffect(() => {
    if (memberParam && !initialPerson) {
      const url = new URL(window.location.href);
      url.searchParams.delete('member');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  }, [memberParam, initialPerson]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const memberParam = params.get('member');
      if (!memberParam) {
        setSelectedMember(null);
        if (originatingButtonRef.current) {
          originatingButtonRef.current.focus();
        }
      } else {
        for (const group of groups) {
          const found = group.members.find((m) => m.id === memberParam);
          if (found) {
            setSelectedMember(found);
            setSelectedGroup(group.members);
            break;
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [groups]);

  const handleOpenMember = (person: Person, groupMembers: Person[], btnEl: HTMLButtonElement) => {
    originatingButtonRef.current = btnEl;
    setTriggerRect(btnEl.getBoundingClientRect());
    setSelectedMember(person);
    setSelectedGroup(groupMembers);

    const url = new URL(window.location.href);
    url.searchParams.set('member', person.id);
    window.history.pushState({ memberId: person.id }, '', url.toString());
  };

  const handleCloseDialog = () => {
    setSelectedMember(null);
    setTriggerRect(null);

    const url = new URL(window.location.href);
    url.searchParams.delete('member');
    window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));

    if (originatingButtonRef.current) {
      originatingButtonRef.current.focus();
    }
  };

  const handleNavigateMember = (nextMember: Person) => {
    setSelectedMember(nextMember);
    const url = new URL(window.location.href);
    url.searchParams.set('member', nextMember.id);
    window.history.replaceState({ memberId: nextMember.id }, '', url.toString());

    const nextBtn = document.querySelector<HTMLButtonElement>(`[data-member-id="${nextMember.id}"]`);
    if (nextBtn) {
      originatingButtonRef.current = nextBtn;
    }
  };

  return (
    <HairlineGrid>
      <div className="w-full bg-[var(--bg)] text-left">
        <section
          className="hairline-row w-full px-4 sm:px-8 lg:px-16 pt-10 sm:pt-14 pb-8 sm:pb-10"
          aria-labelledby="team-heading"
        >
          <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                Directory
              </span>
              <h1
                id="team-heading"
                className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-tight m-0"
              >
                Team
              </h1>
              <p className="text-base sm:text-lg text-[var(--text-muted)] mt-1 max-w-2xl m-0 leading-relaxed">
                The students and faculty coordinators directing Coders Club at Kishkinda University.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl">
              <div className="p-3.5 sm:p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm flex flex-col gap-1 text-left shadow-1">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[var(--text)]">
                  {totalMembers}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
                  Members
                </span>
              </div>
              <div className="p-3.5 sm:p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm flex flex-col gap-1 text-left shadow-1">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[var(--primary)] dark:text-[var(--accent-on-dark)]">
                  {totalTeams}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
                  Teams
                </span>
              </div>
              <div className="p-3.5 sm:p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm flex flex-col gap-1 text-left shadow-1">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[var(--text)]">
                  {facultyCount}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
                  Coordinators
                </span>
              </div>
            </div>
          </div>
        </section>

        <nav
          aria-label="Quick jump to team sections"
          className="w-full px-4 sm:px-8 lg:px-16 py-3.5 border-b border-[var(--border)] bg-[var(--surface-1)]/90 backdrop-blur-md md:sticky md:top-16 z-30"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mr-1 shrink-0">
              Jump to:
            </span>
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(group.id);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', `#${group.id}`);
                  }
                }}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)] text-xs font-mono font-medium text-[var(--text)] transition-colors no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)] cursor-pointer"
              >
                <span>{group.groupName}</span>
                <span className="text-xs text-[var(--on-accent)] dark:text-[var(--accent-on-dark)] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-soft)]">
                  {group.members.length}
                </span>
              </a>
            ))}
          </div>
        </nav>

        <div
          onPointerEnter={preloadDialog}
          onFocusCapture={preloadDialog}
          className="w-full px-4 sm:px-8 lg:px-16 flex flex-col"
        >
          {groups.map((group: PeopleGroup, groupIndex: number) => {
            return (
              <section
                key={group.id}
                id={group.id}
                className="w-full py-12 sm:py-16 border-b border-[var(--border)] last:border-b-0 scroll-mt-24 sm:scroll-mt-28"
                aria-labelledby={`heading-${group.id}`}
              >
                <div className="flex flex-col gap-1.5 mb-6 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                      {String(groupIndex + 1).padStart(2, '0')} / {String(groups.length).padStart(2, '0')} · {group.members.length} {group.members.length === 1 ? 'MEMBER' : 'MEMBERS'}
                    </span>
                  </div>

                  <h2
                    id={`heading-${group.id}`}
                    className="text-2xl sm:text-3xl font-bold text-[var(--text)] m-0 leading-tight"
                  >
                    {group.groupName}
                  </h2>

                  {group.description && (
                    <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl m-0">
                      {group.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-6 w-full">
                  {group.members.map((person: Person) => {
                    const showEmailGlyph = Boolean(person.email);
                    const subRole = person.year || person.designation;
                    const isDuplicateRole = Boolean(
                      subRole && subRole.trim().toLowerCase() === person.role.trim().toLowerCase()
                    );

                    return (
                      <button
                        key={person.id}
                        type="button"
                        data-member-id={person.id}
                        data-cursor="team-card"
                        onClick={(e) => handleOpenMember(person, group.members, e.currentTarget)}
                        aria-label={`View details for ${person.name}, ${person.role}`}
                        className="w-full h-full p-2.5 sm:p-3.5 md:p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col justify-between gap-2.5 sm:gap-3.5 md:gap-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-2 active:translate-y-0 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 group cursor-pointer min-w-0"
                      >
                        <div className="w-full flex flex-col gap-2.5 sm:gap-3.5 md:gap-4 min-w-0">
                          <HalftoneAvatar
                            id={person.id}
                            name={person.name}
                            photo={person.photo}
                            focalX={person.focalX}
                            focalY={person.focalY}
                            sizeMode="card"
                          />

                          <div className="flex flex-col gap-0.5 sm:gap-1 text-left min-w-0">
                            <h3 className="text-[14px] sm:text-base md:text-lg font-semibold text-[var(--text)] m-0 leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                              {person.name}
                            </h3>

                            <div className="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] mt-0.5 truncate">
                              {person.role}
                            </div>

                            {subRole && !isDuplicateRole && (
                              <div className="text-[11px] sm:text-xs text-[var(--text-muted)] font-mono mt-0.5 truncate">
                                {subRole}
                              </div>
                            )}

                            {Boolean(person.phone && (person.id === 'pres-vittala' || person.id === 'vp-abhiram')) && (
                              <a
                                href={formatPhoneHref(person.phone!)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Call ${person.name}`}
                                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-[var(--text-muted)] hover:text-[var(--accent)] font-mono mt-0.5 truncate no-underline"
                              >
                                <Phone className="w-3 h-3 text-[var(--accent)] shrink-0" aria-hidden="true" />
                                <span className="truncate">{formatPhoneDisplay(person.phone!)}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="pt-1.5 sm:pt-3 border-t border-[var(--border)] flex items-center justify-between w-full min-w-0">
                          <div className="flex items-center gap-0.5 min-w-0">
                            {showEmailGlyph && (
                              <a
                                href={`mailto:${person.email}`}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Email ${person.name}`}
                                className="min-h-[44px] min-w-[44px] -ml-2.5 flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--accent)] transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                              </a>
                            )}
                            {Boolean(person.phone && (person.id === 'pres-vittala' || person.id === 'vp-abhiram')) && (
                              <a
                                href={formatPhoneHref(person.phone!)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Call ${person.name}`}
                                className={`min-h-[44px] min-w-[44px] ${showEmailGlyph ? '' : '-ml-2.5'} flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--accent)] transition-colors`}
                              >
                                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                              </a>
                            )}
                            {!showEmailGlyph && !(person.phone && (person.id === 'pres-vittala' || person.id === 'vp-abhiram')) && (
                              <div className="min-h-[44px] w-1" />
                            )}
                          </div>

                          <div className="min-h-[44px] -mr-2.5 px-2.5 flex items-center gap-1 text-[11px] sm:text-xs font-mono font-medium text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors shrink-0">
                            <span>Details</span>
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <Suspense fallback={null}>
        {selectedMember && (
          <MemberDialog
            member={selectedMember}
            groupMembers={selectedGroup}
            onClose={handleCloseDialog}
            onNavigate={handleNavigateMember}
            triggerRect={triggerRect}
          />
        )}
      </Suspense>
    </HairlineGrid>
  );
};
