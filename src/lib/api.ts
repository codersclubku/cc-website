import { supabase, isSupabaseConfigured } from './supabase';
import type { RegistrationFormData, ContactFormData } from './validation';
import { PEOPLE_GROUPS, getDefaultResponsibilities } from '../content/people';
import type { PeopleGroup, Person } from '../content/people';

export interface DbEvent {
  id: string;
  slug: string;
  title: string;
  type: string;
  short_description: string;
  description: string;
  agenda: { time: string; session: string; speaker?: string }[];
  prerequisites: string[];
  venue: string;
  starts_at: string;
  ends_at: string;
  eligibility: string;
  coordinator_name: string;
  registration_opens_at?: string | null;
  registration_deadline: string;
  capacity?: number | null;
  allow_waitlist?: boolean;
  status: 'draft' | 'published' | 'closed';
  created_at: string;
  registrations_count?: number;
  seats_left?: number | null;
  waitlist_count?: number;
}

export interface StudentProfile {
  id: string;
  full_name: string;
  usn: string;
  department: string;
  year: string;
  semester: string;
  created_at: string;
  updated_at: string;
  email?: string;
  email_verified?: boolean;
}

export interface DbStudentRegistration {
  id: string;
  event_id: string;
  student_id: string;
  confirmation_id: string;
  status: 'registered' | 'cancelled' | 'waitlisted';
  checked_in_at?: string | null;
  created_at: string;
  event_title?: string;
  starts_at?: string;
  ends_at?: string;
  venue?: string;
  waitlist_position?: number;
  profile?: StudentProfile;
}

export interface DbRegistration {
  id: string;
  event_id: string;
  confirmation_id: string;
  full_name: string;
  email: string;
  department: string;
  year: string;
  university_reg_no: string;
  consent: boolean;
  consent_at: string;
  checked_in: boolean;
  checked_in_at?: string | null;
  created_at: string;
  event_title?: string;
}

export interface DbTeamMember {
  id: string;
  name: string;
  role: string;
  department?: string | null;
  year?: string | null;
  photo?: string | null;
  email?: string | null;
  linkedin?: string | null;
  github?: string | null;
  group: string;
  display_order: number;
  responsibilities?: string[] | null;
  bio?: string | null;
  skills?: string[] | null;
  designation?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbAnnouncement {
  id: string;
  title: string;
  body: string;
  published_at: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

export interface DbProject {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: 'Planned' | 'In progress' | 'Live' | 'Archived';
  tech_stack: string[];
  repo_url: string;
  demo_url?: string | null;
  how_to_contribute?: string | null;
  published: boolean;
  created_at: string;
}

export interface DbGalleryItem {
  id: string;
  image_path: string;
  caption?: string | null;
  alt_text: string;
  event_id?: string | null;
  published: boolean;
  created_at: string;
  description?: string | null;
  category?: string | null;
  date?: string | null;
  location?: string | null;
  full_image_path?: string | null;
}

export interface DbContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  handled: boolean;
  handled_at?: string | null;
  created_at: string;
}

export interface ExportLogRow {
  id: string;
  admin_id: string;
  filters: Record<string, unknown>;
  row_count: number;
  created_at: string;
  admin_email?: string;
}

export interface RegistrationResult {
  success: boolean;
  code: string;
  status?: 'registered' | 'waitlisted';
  message: string;
  registration_id?: string;
  confirmation_id?: string;
  event_title?: string;
  starts_at?: string;
  ends_at?: string;
  venue?: string;
  waitlist_position?: number;
}

export function mapApiError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const msg = typeof error === 'string' ? error : error.message || '';
  const code = error.code || '';

  if (msg.includes('EVENT_FULL') || code === 'EVENT_FULL') {
    return 'This event has reached maximum capacity.';
  }
  if (msg.includes('EVENT_CLOSED') || code === 'EVENT_CLOSED') {
    return 'Registration for this event has closed.';
  }
  if (msg.includes('EVENT_NOT_AVAILABLE') || msg.includes('EVENT_NOT_PUBLISHED')) {
    return 'This event is currently not available for registration.';
  }
  if (msg.includes('EVENT_NOT_YET_OPEN') || msg.includes('NOT_YET_OPEN')) {
    return 'Registration for this event has not opened yet.';
  }
  if (msg.includes('ALREADY_REGISTERED') || code === 'ALREADY_REGISTERED') {
    return 'You are already registered for this event.';
  }
  if (msg.includes('ALREADY_WAITLISTED') || code === 'ALREADY_WAITLISTED') {
    return 'You are currently on the waitlist for this event.';
  }
  if (msg.includes('EMAIL_NOT_VERIFIED') || code === 'EMAIL_NOT_VERIFIED') {
    return 'Please verify your email address before registering for events.';
  }
  if (msg.includes('CUTOFF_PASSED') || code === 'CUTOFF_PASSED') {
    return 'Cancellation cutoff has passed. Events cannot be cancelled after their start time.';
  }
  if (msg.includes('RATE_LIMIT_EXCEEDED') || code === 'RATE_LIMIT_EXCEEDED') {
    return 'Too many messages sent. Please wait an hour before submitting again.';
  }
  if (msg.includes('CANNOT_CHANGE_USN')) {
    return 'USN cannot be modified after registration.';
  }
  if (msg.includes('CANNOT_CHANGE_ID') || msg.includes('CANNOT_CHANGE_CREATED_AT')) {
    return 'System fields cannot be modified.';
  }
  if (code === '23505' || msg.includes('duplicate key value')) {
    return 'A record with this information already exists.';
  }
  if (code === '42501' || msg.includes('permission denied') || msg.includes('UNAUTHORIZED')) {
    return 'You do not have permission to perform this action.';
  }
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
    return 'Network connection error. Please check your internet connection.';
  }
  if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('timed out')) {
    return 'Request timed out. Please try again.';
  }
  return msg || 'An unexpected error occurred. Please try again.';
}

export class ApiError extends Error {
  readonly code: string;
  constructor(message: string, code: string = 'UNKNOWN') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export type ProfileQueryResult =
  | { status: 'FOUND'; profile: StudentProfile }
  | { status: 'NOT_FOUND' }
  | { status: 'ERROR'; error: string };

export type ConsentStatusResult =
  | { status: 'ACTIVE' }
  | { status: 'MISSING' }
  | { status: 'ERROR'; message: string };

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 300
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 1) throw err;
    await new Promise((r) => setTimeout(r, delayMs));
    return retryWithBackoff(fn, retries - 1, delayMs * 2);
  }
}

const mockEvents: DbEvent[] = [
  {
    id: 'mock-ev-1',
    slug: 'git-foundations',
    title: 'Hands-on Git & GitHub Workshop',
    type: 'Workshop',
    short_description: 'Master version control, branches, pull requests, and collaborative workflows.',
    description: 'A comprehensive 3-hour practical session on Git fundamentals, resolving merge conflicts, and contributing to open-source repositories.',
    agenda: [
      { time: '10:00 AM', session: 'Introduction & CLI Setup', speaker: 'Student Coordinator' },
      { time: '11:00 AM', session: 'Branching & Rebasing Masterclass', speaker: 'Core Lead' },
      { time: '12:00 PM', session: 'Live Collaborative Pull Requests', speaker: 'Faculty Mentor' }
    ],
    prerequisites: ['Git installed on laptop', 'GitHub account created'],
    venue: 'CSE Department Lab 3, Campus Ballari',
    starts_at: '2026-11-05T10:00:00+05:30',
    ends_at: '2026-11-05T13:00:00+05:30',
    eligibility: 'All Kishkinda University students',
    coordinator_name: 'V Chinmai Dhyan',
    registration_opens_at: '2026-10-01T00:00:00+05:30',
    registration_deadline: '2026-11-04T18:00:00+05:30',
    capacity: 60,
    status: 'published',
    created_at: '2026-10-01T00:00:00Z',
    registrations_count: 14,
    seats_left: 46,
    waitlist_count: 0
  }
];

const mockProfiles: StudentProfile[] = [
  {
    id: 'mock-student-1',
    full_name: 'Aditi Sharma',
    usn: 'KU2024CS001',
    department: 'Computer Science and Engineering',
    year: '2nd Year',
    semester: '3rd Semester',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    email: 'aditi.sharma@kishkindauniversity.edu.in',
    email_verified: true
  },
  {
    id: 'mock-student-2',
    full_name: 'Rahul Verma',
    usn: 'KU2023AI014',
    department: 'Artificial Intelligence & Data Science',
    year: '3rd Year',
    semester: '5th Semester',
    created_at: '2026-08-05T12:00:00Z',
    updated_at: '2026-08-05T12:00:00Z',
    email: 'rahul.verma@kishkindauniversity.edu.in',
    email_verified: true
  }
];

function getInitialMockTeamMembers(): DbTeamMember[] {
  const origList: DbTeamMember[] = PEOPLE_GROUPS.flatMap((group, groupIdx) =>
    group.members.map((member, memberIdx) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      department: member.department || null,
      year: member.year || member.designation || null,
      photo: member.photo || null,
      email: member.email || null,
      linkedin: member.linkedin || null,
      github: member.github || null,
      group: group.groupName,
      display_order: (groupIdx + 1) * 100 + memberIdx,
      responsibilities: member.responsibilities || getDefaultResponsibilities(member.role, group.groupName),
      bio: member.bio || null,
      skills: member.skills || null,
      designation: member.designation || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  );

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('cc-mock-team-members');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((m: DbTeamMember) => {
            const matched = origList.find((orig) => orig.id === m.id || orig.name.trim().toLowerCase() === m.name.trim().toLowerCase());
            return {
              ...m,
              display_order: matched ? matched.display_order : m.display_order,
              email: m.email || matched?.email || null,
              responsibilities: (m.responsibilities && m.responsibilities.length > 0)
                ? m.responsibilities
                : (matched?.responsibilities || getDefaultResponsibilities(m.role, m.group)),
              bio: m.bio || matched?.bio || null,
              skills: m.skills || matched?.skills || null,
              designation: m.designation || matched?.designation || null,
            };
          });
          const parsedIds = new Set(parsed.map((p: DbTeamMember) => p.id));
          const parsedNames = new Set(parsed.map((p: DbTeamMember) => p.name?.trim().toLowerCase()));
          const missingOrig = origList.filter((orig) => !parsedIds.has(orig.id) && !parsedNames.has(orig.name?.trim().toLowerCase()));
          const combined = [...mapped, ...missingOrig];
          combined.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
          saveMockTeamMembers(combined);
          return combined;
        }
      }
    } catch {}
  }
  return origList;
}

function saveMockTeamMembers(members: DbTeamMember[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('cc-mock-team-members', JSON.stringify(members));
    } catch {}
  }
}

let mockTeamMembers: DbTeamMember[] = getInitialMockTeamMembers();

function getInitialMockGalleryItems(): DbGalleryItem[] {
  const defaults: DbGalleryItem[] = [
    {
      id: 'gal-campus-01',
      image_path: '/assets/campus/campus-01.webp',
      full_image_path: '/assets/campus/campus-01-1600w.webp',
      caption: 'Academic Block',
      alt_text: 'Academic Block facade and central courtyard',
      description: 'Academic block housing lecture halls and faculty offices around the central courtyard.',
      category: 'Campus',
      date: 'October 2026',
      published: true,
      created_at: '2026-10-01T10:00:00Z'
    },
    {
      id: 'gal-campus-02',
      image_path: '/assets/campus/campus-02.webp',
      full_image_path: '/assets/campus/campus-02-1600w.webp',
      caption: 'Computing Laboratory',
      alt_text: 'Computer Science and Engineering laboratory',
      description: 'Computing lab with dual-monitor workstations used for practical sessions.',
      category: 'Laboratory',
      date: 'October 2026',
      published: true,
      created_at: '2026-10-02T10:00:00Z'
    },
    {
      id: 'gal-campus-03',
      image_path: '/assets/campus/campus-03.webp',
      full_image_path: '/assets/campus/campus-03-1600w.webp',
      caption: 'Central Library',
      alt_text: 'University central library exterior and study halls',
      description: 'Central library with reading areas and reference sections for technical studies.',
      category: 'Library',
      date: 'October 2026',
      published: true,
      created_at: '2026-10-03T10:00:00Z'
    },
    {
      id: 'gal-campus-04',
      image_path: '/assets/campus/campus-04.webp',
      full_image_path: '/assets/campus/campus-04-1600w.webp',
      caption: 'Auditorium & Seminar Hall',
      alt_text: 'Main campus auditorium and conference center',
      description: 'Auditorium facility equipped for technical presentations, workshops, and guest lectures.',
      category: 'Auditorium',
      date: 'October 2026',
      published: true,
      created_at: '2026-10-04T10:00:00Z'
    },
    {
      id: 'gal-campus-05',
      image_path: '/assets/campus/campus-05.webp',
      full_image_path: '/assets/campus/campus-05-1600w.webp',
      caption: 'Engineering Wing',
      alt_text: 'Engineering complex and technology center',
      description: 'Engineering complex dedicated to departmental laboratories and design workshops.',
      category: 'Engineering',
      date: 'October 2026',
      published: true,
      created_at: '2026-10-05T10:00:00Z'
    },
    {
      id: 'gal-campus-06',
      image_path: '/assets/campus/campus-06.webp',
      full_image_path: '/assets/campus/campus-06-1600w.webp',
      caption: 'Innovation Center',
      alt_text: 'Innovation and research incubation facility',
      description: 'Innovation center supporting hands-on prototyping and collaborative project development.',
      category: 'Innovation',
      date: 'October 2026',
      published: true,
      created_at: '2026-10-06T10:00:00Z'
    },
    {
      id: 'gal-campus-07',
      image_path: '/assets/campus/campus-07.webp',
      caption: 'Smart Lecture Hall',
      alt_text: 'Interactive multimedia classroom and lecture hall',
      description: 'Smart lecture hall configured with audio-visual equipment for interactive teaching.',
      category: 'Classroom',
      date: 'October 2026',
      published: true,
      created_at: '2026-10-07T10:00:00Z'
    },
    {
      id: 'gal-campus-08',
      image_path: '/assets/campus/campus-08.webp',
      caption: 'Campus Grounds & Walkway',
      alt_text: 'Tree-lined walkway and landscaped university grounds',
      description: 'Landscaped grounds and paved pathways connecting academic buildings across the campus.',
      category: 'Campus',
      date: 'October 2026',
      published: true,
      created_at: '2026-10-08T10:00:00Z'
    }
  ];

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('cc-mock-gallery-items');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => {
            const def = defaults.find((d) => d.id === item.id);
            return def ? { ...def, ...item } : item;
          });
        }
      }
    } catch {}
  }
  return defaults;
}

function saveMockGalleryItems(items: DbGalleryItem[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('cc-mock-gallery-items', JSON.stringify(items));
    } catch {}
  }
}

let mockGalleryItems: DbGalleryItem[] = getInitialMockGalleryItems();
const mockStudentRegistrations: DbStudentRegistration[] = [];
const mockAnnouncements: DbAnnouncement[] = [];
const mockContactMessages: DbContactMessage[] = [];
const mockExportLogs: ExportLogRow[] = [];
const mockProjects: DbProject[] = [
  {
    id: 'mock-proj-1',
    slug: 'campus-companion',
    title: 'Campus Companion Portal',
    summary: 'A student-built interactive mobile-first resource navigation portal for Kishkinda University students.',
    status: 'In progress',
    tech_stack: ['React', 'TypeScript', 'Tailwind CSS', 'Supabase'],
    repo_url: 'https://github.com/codersclub-ku/campus-companion',
    demo_url: 'https://campus.kishkindauniversity.edu.in',
    how_to_contribute: 'Clone repo, check open issues tagged good-first-issue, and submit PR to develop branch.',
    published: true,
    created_at: '2026-09-01T10:00:00Z'
  }
];
let mockSeq = 100;

export async function fetchPublishedEvents(): Promise<DbEvent[]> {
  if (isSupabaseConfigured && supabase) {
    const { data: viewData, error: viewError } = await supabase
      .from('events_public')
      .select('*')
      .order('starts_at', { ascending: true });

    if (!viewError && viewData) {
      return viewData as DbEvent[];
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('starts_at', { ascending: true });

    if (error) return [];
    return (data || []).map((e: any) => ({
      ...e,
      registrations_count: 0,
      seats_left: e.capacity,
      waitlist_count: 0
    }));
  }
  return mockEvents.filter((e) => e.status === 'published').map((e) => {
    const regCount = mockStudentRegistrations.filter((r) => r.event_id === e.id && r.status === 'registered').length;
    const waitCount = mockStudentRegistrations.filter((r) => r.event_id === e.id && r.status === 'waitlisted').length;
    return {
      ...e,
      registrations_count: regCount,
      seats_left: e.capacity ? Math.max(0, e.capacity - regCount) : null,
      waitlist_count: waitCount
    };
  });
}

export async function fetchEventBySlug(slug: string): Promise<DbEvent | null> {
  if (isSupabaseConfigured && supabase) {
    const { data: viewData, error: viewError } = await supabase
      .from('events_public')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!viewError && viewData) return viewData as DbEvent;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      registrations_count: 0,
      seats_left: data.capacity,
      waitlist_count: 0
    } as DbEvent;
  }
  const found = mockEvents.find((e) => e.slug === slug && e.status === 'published');
  if (!found) return null;
  const regCount = mockStudentRegistrations.filter((r) => r.event_id === found.id && r.status === 'registered').length;
  const waitCount = mockStudentRegistrations.filter((r) => r.event_id === found.id && r.status === 'waitlisted').length;
  return {
    ...found,
    registrations_count: regCount,
    seats_left: found.capacity ? Math.max(0, found.capacity - regCount) : null,
    waitlist_count: waitCount
  };
}

export async function fetchEventById(id: string): Promise<DbEvent | null> {
  if (isSupabaseConfigured && supabase) {
    const { data: viewData, error: viewError } = await supabase
      .from('events_public')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!viewError && viewData) return viewData as DbEvent;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      registrations_count: 0,
      seats_left: data.capacity,
      waitlist_count: 0
    } as DbEvent;
  }
  const found = mockEvents.find((e) => e.id === id);
  if (!found) return null;
  const regCount = mockStudentRegistrations.filter((r) => r.event_id === found.id && r.status === 'registered').length;
  const waitCount = mockStudentRegistrations.filter((r) => r.event_id === found.id && r.status === 'waitlisted').length;
  return {
    ...found,
    registrations_count: regCount,
    seats_left: found.capacity ? Math.max(0, found.capacity - regCount) : null,
    waitlist_count: waitCount
  };
}

export async function fetchStudentProfile(
  userId: string,
  userEmail?: string,
  emailVerified?: boolean
): Promise<ProfileQueryResult> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { status: 'ERROR', error: mapApiError(error) };
    }

    if (!data) {
      return { status: 'NOT_FOUND' };
    }

    return {
      status: 'FOUND',
      profile: {
        ...data,
        email: userEmail,
        email_verified: emailVerified
      } as StudentProfile
    };
  }

  const found = mockProfiles.find((p) => p.id === userId);
  if (found) {
    return {
      status: 'FOUND',
      profile: {
        ...found,
        email: userEmail || found.email,
        email_verified: emailVerified ?? found.email_verified
      }
    };
  }

  try {
    const sessionRaw = localStorage.getItem('cc-mock-auth-session');
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (parsed?.profile && parsed.profile.id === userId) {
        return { status: 'FOUND', profile: parsed.profile };
      }
    }
  } catch {}

  return { status: 'NOT_FOUND' };
}

export async function checkConsentStatus(
  studentId: string,
  version: string = 'v1.0-2026'
): Promise<ConsentStatusResult> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('consents')
      .select('id')
      .eq('student_id', studentId)
      .eq('notice_version', version)
      .is('withdrawn_at', null)
      .is('superseded_at', null)
      .maybeSingle();

    if (error) {
      // Resilient fallback if table does not yet have superseded_at column (pre-migration state)
      if (error.code === '42703' || error.message?.includes('superseded_at')) {
        const fallback = await supabase
          .from('consents')
          .select('id')
          .eq('student_id', studentId)
          .eq('notice_version', version)
          .is('withdrawn_at', null)
          .maybeSingle();

        if (!fallback.error) {
          return fallback.data ? { status: 'ACTIVE' } : { status: 'MISSING' };
        }
      }
      return { status: 'ERROR', message: mapApiError(error) };
    }

    return data ? { status: 'ACTIVE' } : { status: 'MISSING' };
  }

  try {
    const raw = localStorage.getItem('cc-mock-consents');
    if (!raw) return { status: 'MISSING' };
    const consents = JSON.parse(raw);
    const entry = consents[studentId];
    if (entry && !entry.withdrawn_at && entry.version === version) {
      return { status: 'ACTIVE' };
    }
    return { status: 'MISSING' };
  } catch (err: any) {
    return { status: 'ERROR', message: 'Failed to read local storage consent record: ' + err.message };
  }
}

export async function completeStudentOnboardingApi(data: {
  fullName: string;
  usn: string;
  department: string;
  year: string;
  semester: string;
  consentAccepted: boolean;
  version?: string;
}): Promise<StudentProfile> {
  if (isSupabaseConfigured && supabase) {
    const { data: result, error } = await supabase.rpc('complete_student_onboarding', {
      p_full_name:    data.fullName,
      p_usn:          data.usn,
      p_department:   data.department,
      p_year:         data.year,
      p_semester:     data.semester,
      p_consent:      data.consentAccepted,
      p_version:      data.version || 'v1.0-2026'
    });

    if (error) {
      throw new ApiError(mapApiError(error), error.code || 'UNKNOWN');
    }

    const profileData = (result && typeof result === 'object' && 'profile' in (result as any))
      ? (result as any).profile
      : result;

    return profileData as StudentProfile;
  }

  // Two-Phase Atomic Mock Persistence
  if (!data.consentAccepted) {
    throw new ApiError('Explicit privacy notice acceptance is required to register a student profile.', 'CONSENT_REQUIRED');
  }

  let currentUid = 'mock-student-1';
  try {
    const sessionRaw = localStorage.getItem('cc-mock-auth-session');
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (parsed?.user?.id) currentUid = parsed.user.id;
    }
  } catch {}

  const existingIdx = mockProfiles.findIndex((p) => p.id === currentUid);
  const stagedProfile: StudentProfile = {
    id: currentUid,
    full_name: data.fullName.trim(),
    usn: data.usn.toUpperCase().trim(),
    department: data.department,
    year: data.year,
    semester: data.semester,
    created_at: existingIdx >= 0 ? mockProfiles[existingIdx].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email: existingIdx >= 0 ? mockProfiles[existingIdx].email : 'student@kishkindauniversity.edu.in',
    email_verified: true
  };

  // Phase 1: Test JSON and prepare localStorage payload
  let stagedConsents: Record<string, any> = {};
  try {
    const rawConsents = localStorage.getItem('cc-mock-consents');
    if (rawConsents) stagedConsents = JSON.parse(rawConsents);
  } catch (parseErr: any) {
    throw new ApiError('Corrupted local storage mock consent data: ' + parseErr.message, 'STORAGE_PARSE_ERROR');
  }

  stagedConsents[currentUid] = {
    version: data.version || 'v1.0-2026',
    accepted_at: new Date().toISOString(),
    withdrawn_at: null
  };

  // Phase 2: Atomic Storage Write before memory mutation
  try {
    localStorage.setItem('cc-mock-consents', JSON.stringify(stagedConsents));
    const sessionRaw = localStorage.getItem('cc-mock-auth-session');
    if (sessionRaw) {
      const sessionParsed = JSON.parse(sessionRaw);
      sessionParsed.profile = stagedProfile;
      localStorage.setItem('cc-mock-auth-session', JSON.stringify(sessionParsed));
    }
  } catch (storageErr: any) {
    throw new ApiError(
      'Storage quota exceeded or storage unavailable: ' + storageErr.message,
      'STORAGE_ERROR'
    );
  }

  // Memory mutation committed only after storage succeeds
  if (existingIdx >= 0) {
    mockProfiles[existingIdx] = stagedProfile;
  } else {
    mockProfiles.push(stagedProfile);
  }

  return stagedProfile;
}

export async function upsertStudentProfile(profileData: Partial<StudentProfile> & { id: string }): Promise<StudentProfile | null> {
  if (isSupabaseConfigured && supabase) {
    const updatePayload: Record<string, any> = {
      id: profileData.id,
      full_name: profileData.full_name,
      department: profileData.department,
      year: profileData.year,
      semester: profileData.semester,
      updated_at: new Date().toISOString()
    };
    if (profileData.usn) {
      updatePayload.usn = profileData.usn.toUpperCase().trim();
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(updatePayload)
      .select()
      .single();

    if (error) {
      throw new ApiError(mapApiError(error), error.code || 'UNKNOWN');
    }
    return data as StudentProfile;
  }

  const idx = mockProfiles.findIndex((p) => p.id === profileData.id);
  const updated: StudentProfile = {
    id: profileData.id,
    full_name: profileData.full_name || 'Student',
    usn: profileData.usn?.toUpperCase() || (idx >= 0 ? mockProfiles[idx].usn : 'KU2024CS000'),
    department: profileData.department || 'Computer Science and Engineering',
    year: profileData.year || '1st Year',
    semester: profileData.semester || '1st Semester',
    created_at: idx >= 0 ? mockProfiles[idx].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email: profileData.email || (idx >= 0 ? mockProfiles[idx].email : 'student@kishkindauniversity.edu.in'),
    email_verified: true
  };

  if (idx >= 0) {
    mockProfiles[idx] = updated;
  } else {
    mockProfiles.push(updated);
  }
  return updated;
}

export async function recordConsent(
  studentId: string,
  version: string = 'v1.0-2026',
  _purpose?: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('record_consent_idempotent', {
      p_student_id: studentId,
      p_version:    version
    });

    if (error) {
      return { success: false, error: mapApiError(error) };
    }
    return { success: true };
  }

  try {
    const raw = localStorage.getItem('cc-mock-consents') || '{}';
    const consents = JSON.parse(raw);
    consents[studentId] = {
      version,
      accepted_at: new Date().toISOString(),
      withdrawn_at: null
    };
    localStorage.setItem('cc-mock-consents', JSON.stringify(consents));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'Storage error: ' + err.message };
  }
}

export async function withdrawConsent(studentId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('withdraw_consent_atomic', {
      p_version: 'v1.0-2026'
    });

    if (!error) {
      return Boolean(data);
    }

    const { error: updateError } = await supabase
      .from('consents')
      .update({ withdrawn_at: new Date().toISOString() })
      .eq('student_id', studentId)
      .is('withdrawn_at', null)
      .is('superseded_at', null);

    return !updateError;
  }

  try {
    const raw = localStorage.getItem('cc-mock-consents');
    if (raw) {
      const consents = JSON.parse(raw);
      if (consents[studentId]) {
        consents[studentId].withdrawn_at = new Date().toISOString();
        localStorage.setItem('cc-mock-consents', JSON.stringify(consents));
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function registerStudentForEvent(eventId: string, studentId: string): Promise<RegistrationResult> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('register_student_atomic', {
      p_event_id: eventId,
      p_student_id: studentId
    });

    if (error) {
      return {
        success: false,
        code: error.code || 'ERROR',
        message: mapApiError(error)
      };
    }
    return data as RegistrationResult;
  }

  // Mock Mode: Authoritatively verify profile completeness and privacy consent
  const profile = mockProfiles.find((p) => p.id === studentId);
  if (!profile || !profile.full_name?.trim() || !profile.usn?.trim() || !profile.department?.trim() || !profile.year?.trim() || !profile.semester?.trim()) {
    return {
      success: false,
      code: 'PROFILE_INCOMPLETE',
      message: 'You must complete your student profile before registering for events.'
    };
  }

  const rawConsents = localStorage.getItem('cc-mock-consents');
  let consentActive = false;
  if (rawConsents) {
    try {
      const parsed = JSON.parse(rawConsents);
      const userConsent = parsed[studentId];
      if (userConsent && !userConsent.withdrawn_at) {
        consentActive = true;
      }
    } catch {}
  }
  if (!consentActive) {
    return {
      success: false,
      code: 'CONSENT_REQUIRED',
      message: 'You must accept the Privacy Notice before registering for events.'
    };
  }

  const event = mockEvents.find((e) => e.id === eventId);
  if (!event || event.status !== 'published') {
    return { success: false, code: 'EVENT_NOT_AVAILABLE', message: 'Event is not available for registration.' };
  }

  if (new Date() > new Date(event.registration_deadline)) {
    return { success: false, code: 'EVENT_CLOSED', message: 'Registration for this event has closed.' };
  }

  const existing = mockStudentRegistrations.find(
    (r) => r.event_id === eventId && r.student_id === studentId
  );
  if (existing) {
    if (existing.status === 'registered') {
      return {
        success: false,
        code: 'ALREADY_REGISTERED',
        status: 'registered',
        message: 'You are already registered for this event.',
        confirmation_id: existing.confirmation_id
      };
    }
    if (existing.status === 'waitlisted') {
      return {
        success: true,
        code: 'ALREADY_WAITLISTED',
        status: 'waitlisted',
        message: 'You are currently on the waitlist for this event.',
        confirmation_id: existing.confirmation_id
      };
    }
    if (existing.status === 'cancelled') {
      const activeCount = mockStudentRegistrations.filter((r) => r.event_id === eventId && r.status === 'registered').length;
      if (event.capacity && activeCount >= event.capacity) {
        if (event.allow_waitlist === true) {
          existing.status = 'waitlisted';
          return {
            success: true,
            code: 'WAITLISTED',
            status: 'waitlisted',
            message: 'Event capacity is full. You have been placed on the waitlist.',
            confirmation_id: existing.confirmation_id
          };
        }
        return {
          success: false,
          code: 'CAPACITY_REACHED',
          message: 'This event has reached full capacity.'
        };
      }
      existing.status = 'registered';
      return {
        success: true,
        code: 'REGISTRATION_REACTIVATED',
        status: 'registered',
        message: 'Registration confirmed',
        confirmation_id: existing.confirmation_id,
        event_title: event.title
      };
    }
  }

  const activeCount = mockStudentRegistrations.filter((r) => r.event_id === eventId && r.status === 'registered').length;
  const isFull = event.capacity ? activeCount >= event.capacity : false;

  if (isFull) {
    if (event.allow_waitlist !== true) {
      return {
        success: false,
        code: 'CAPACITY_REACHED',
        message: 'This event has reached full capacity.'
      };
    }
  }

  const status: 'registered' | 'waitlisted' = isFull ? 'waitlisted' : 'registered';

  mockSeq += 1;
  const yearStr = new Date().getFullYear();
  const confId = `CC-${yearStr}-${String(mockSeq).padStart(4, '0')}`;

  const newReg: DbStudentRegistration = {
    id: `reg-${Date.now()}`,
    event_id: eventId,
    student_id: studentId,
    confirmation_id: confId,
    status,
    created_at: new Date().toISOString(),
    event_title: event.title,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    venue: event.venue,
    profile: profile || undefined
  };

  mockStudentRegistrations.push(newReg);

  if (status === 'waitlisted') {
    const waitlistPos = mockStudentRegistrations.filter((r) => r.event_id === eventId && r.status === 'waitlisted').length;
    return {
      success: true,
      code: 'WAITLISTED',
      status: 'waitlisted',
      message: 'Event capacity is full. You have been placed on the waitlist.',
      registration_id: newReg.id,
      confirmation_id: confId,
      event_title: event.title,
      waitlist_position: waitlistPos
    };
  }

  return {
    success: true,
    code: 'REGISTERED',
    status: 'registered',
    message: 'Successfully registered for event.',
    registration_id: newReg.id,
    confirmation_id: confId,
    event_title: event.title,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    venue: event.venue
  };
}

export async function cancelRegistration(registrationId: string): Promise<{ success: boolean; code?: string; message: string }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('cancel_registration', {
      p_registration_id: registrationId
    });

    if (error) {
      return { success: false, code: error.code || 'ERROR', message: mapApiError(error) };
    }
    return data;
  }

  const reg = mockStudentRegistrations.find((r) => r.id === registrationId);
  if (!reg) {
    return { success: false, code: 'NOT_FOUND', message: 'Registration record not found.' };
  }
  reg.status = 'cancelled';
  const waitlisted = mockStudentRegistrations.find((r) => r.event_id === reg.event_id && r.status === 'waitlisted');
  if (waitlisted) {
    waitlisted.status = 'registered';
  }
  return { success: true, code: 'CANCELLED', message: 'Registration cancelled successfully.' };
}

export async function cancelStudentRegistration(eventId: string, studentId: string): Promise<{ success: boolean; message: string }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('cancel_registration_atomic', {
      p_event_id: eventId,
      p_student_id: studentId
    });

    if (error) {
      return { success: false, message: mapApiError(error) };
    }
    return data;
  }

  const reg = mockStudentRegistrations.find(
    (r) => r.event_id === eventId && r.student_id === studentId
  );
  if (!reg) {
    return { success: false, message: 'Registration record not found.' };
  }
  return cancelRegistration(reg.id);
}

export async function fetchStudentRegistrations(studentId: string): Promise<DbStudentRegistration[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('registrations')
      .select('*, events(title, starts_at, ends_at, venue)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      event_id: r.event_id,
      student_id: r.student_id,
      confirmation_id: r.confirmation_id,
      status: r.status,
      checked_in_at: r.checked_in_at,
      created_at: r.created_at,
      event_title: r.events?.title,
      starts_at: r.events?.starts_at,
      ends_at: r.events?.ends_at,
      venue: r.events?.venue
    }));
  }

  return mockStudentRegistrations
    .filter((r) => r.student_id === studentId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function deleteStudentAccount(studentId: string): Promise<{ success: boolean; message: string }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('delete_student_account', {
      p_student_id: studentId
    });

    if (error) {
      return { success: false, message: mapApiError(error) };
    }
    return data;
  }

  const pIdx = mockProfiles.findIndex((p) => p.id === studentId);
  if (pIdx >= 0) mockProfiles.splice(pIdx, 1);
  const remainingRegs = mockStudentRegistrations.filter((r) => r.student_id !== studentId);
  mockStudentRegistrations.length = 0;
  mockStudentRegistrations.push(...remainingRegs);

  return { success: true, message: 'Account deleted successfully.' };
}

export async function adminGetAllStudents(): Promise<StudentProfile[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as StudentProfile[];
  }
  return mockProfiles;
}

export async function adminDeleteStudent(studentId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('admin_delete_student', {
      p_student_id: studentId
    });
    return !error && Boolean(data?.success);
  }
  const idx = mockProfiles.findIndex((p) => p.id === studentId);
  if (idx >= 0) {
    mockProfiles.splice(idx, 1);
    const remainingRegs = mockStudentRegistrations.filter((r) => r.student_id !== studentId);
    mockStudentRegistrations.length = 0;
    mockStudentRegistrations.push(...remainingRegs);
    return true;
  }
  return false;
}

export async function adminGetAllRegistrationsDetailed(eventId?: string): Promise<DbStudentRegistration[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('registrations')
      .select('*, events(title, starts_at, ends_at, venue), profiles(id, full_name, usn, department, year, semester)')
      .order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;
    if (error || !data) {
      return [];
    }

    return data.map((r: any) => ({
      id: r.id,
      event_id: r.event_id,
      student_id: r.student_id,
      confirmation_id: r.confirmation_id,
      status: r.status,
      checked_in_at: r.checked_in_at,
      created_at: r.created_at,
      event_title: r.events?.title,
      starts_at: r.events?.starts_at,
      ends_at: r.events?.ends_at,
      venue: r.events?.venue,
      profile: r.profiles ? {
        id: r.profiles.id,
        full_name: r.profiles.full_name,
        usn: r.profiles.usn,
        department: r.profiles.department,
        year: r.profiles.year,
        semester: r.profiles.semester,
        created_at: r.created_at,
        updated_at: r.created_at
      } : undefined
    }));
  }

  let list = mockStudentRegistrations;
  if (eventId) {
    list = list.filter((r) => r.event_id === eventId);
  }
  return list.map((r) => ({
    ...r,
    profile: r.profile || mockProfiles.find((p) => p.id === r.student_id),
    event_title: r.event_title || mockEvents.find((e) => e.id === r.event_id)?.title
  }));
}

export async function adminCheckInAttendeeByCodeOrUsn(query: string, eventId?: string): Promise<{
  success: boolean;
  message: string;
  already_checked_in?: boolean;
  attendee?: {
    name: string;
    department: string;
    year: string;
    reg_no: string;
    confirmation_id: string;
    event_title?: string;
  };
}> {
  const clean = query.trim().toUpperCase();
  if (isSupabaseConfigured && supabase) {
    if (eventId) {
      const { data, error } = await supabase.rpc('check_in_attendee', {
        p_event_id: eventId,
        p_query: clean
      });

      if (!error && data) {
        return {
          success: data.success,
          message: data.message,
          already_checked_in: data.already_checked_in,
          attendee: data.attendee ? {
            name: data.attendee.name,
            department: data.attendee.department,
            year: data.attendee.year,
            reg_no: data.attendee.usn,
            confirmation_id: data.attendee.confirmation_id,
            event_title: data.attendee.event_title
          } : undefined
        };
      }
    }

    let regQuery = supabase
      .from('registrations')
      .select('*, events(title), profiles(full_name, usn, department, year)')
      .or(`confirmation_id.eq.${clean},student_id.in.(select id from profiles where upper(usn)='${clean}')`);

    if (eventId) {
      regQuery = regQuery.eq('event_id', eventId);
    }

    const { data: reg, error } = await regQuery
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !reg) {
      return { success: false, message: 'No registration found for that ID or USN.' };
    }

    if (reg.status === 'cancelled') {
      return { success: false, message: 'Registration was cancelled and is invalid for entry.' };
    }
    if (reg.status === 'waitlisted') {
      return { success: false, message: 'Attendee is on waitlist and has not been approved.' };
    }

    if (reg.checked_in_at) {
      return {
        success: true,
        already_checked_in: true,
        message: `Already checked in at ${new Date(reg.checked_in_at).toLocaleTimeString()}`,
        attendee: {
          name: reg.profiles?.full_name || 'Student',
          department: reg.profiles?.department || 'N/A',
          year: reg.profiles?.year || 'N/A',
          reg_no: reg.profiles?.usn || 'N/A',
          confirmation_id: reg.confirmation_id,
          event_title: reg.events?.title
        }
      };
    }

    const now = new Date().toISOString();
    await supabase.from('registrations').update({ checked_in_at: now }).eq('id', reg.id);

    return {
      success: true,
      message: 'Check-in verified successfully.',
      attendee: {
        name: reg.profiles?.full_name || 'Student',
        department: reg.profiles?.department || 'N/A',
        year: reg.profiles?.year || 'N/A',
        reg_no: reg.profiles?.usn || 'N/A',
        confirmation_id: reg.confirmation_id,
        event_title: reg.events?.title
      }
    };
  }

  const found = mockStudentRegistrations.find(
    (r) => (eventId ? r.event_id === eventId : true) &&
      (r.confirmation_id.toUpperCase() === clean || r.profile?.usn.toUpperCase() === clean)
  );

  if (!found) {
    return { success: false, message: 'Registration record not found.' };
  }

  if (found.status === 'cancelled') {
    return { success: false, message: 'Registration was cancelled and is invalid for entry.' };
  }
  if (found.status === 'waitlisted') {
    return { success: false, message: 'Attendee is on waitlist and has not been approved.' };
  }

  const profile = found.profile || mockProfiles.find((p) => p.id === found.student_id);

  if (found.checked_in_at) {
    return {
      success: true,
      already_checked_in: true,
      message: `Already checked in at ${new Date(found.checked_in_at).toLocaleTimeString()}`,
      attendee: {
        name: profile?.full_name || 'Student',
        department: profile?.department || 'N/A',
        year: profile?.year || 'N/A',
        reg_no: profile?.usn || 'N/A',
        confirmation_id: found.confirmation_id,
        event_title: found.event_title
      }
    };
  }

  found.checked_in_at = new Date().toISOString();

  return {
    success: true,
    message: 'Check-in verified successfully.',
    attendee: {
      name: profile?.full_name || 'Student',
      department: profile?.department || 'N/A',
      year: profile?.year || 'N/A',
      reg_no: profile?.usn || 'N/A',
      confirmation_id: found.confirmation_id,
      event_title: found.event_title
    }
  };
}

export async function adminLogExport(adminId: string, filters: Record<string, unknown>, rowCount: number): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('log_export', {
      p_filters: filters,
      p_row_count: rowCount
    });
    return !error;
  }

  mockExportLogs.unshift({
    id: `log-${Date.now()}`,
    admin_id: adminId,
    filters,
    row_count: rowCount,
    created_at: new Date().toISOString(),
    admin_email: 'admin@codersclub.ku'
  });
  return true;
}

export async function adminGetExportLogs(): Promise<ExportLogRow[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('export_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data as ExportLogRow[];
  }
  return mockExportLogs;
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    return Boolean(adminRole);
  }
  return true;
}

export async function adminGetDashboardStats() {
  const events = await adminGetAllEvents();
  const registrations = await adminGetAllRegistrationsDetailed();
  const students = await adminGetAllStudents();
  const messages = await adminGetContactMessages();

  return {
    totalEvents: events.length,
    publishedEvents: events.filter((e) => e.status === 'published').length,
    totalRegistrations: registrations.filter((r) => r.status === 'registered').length,
    totalStudents: students.length,
    unhandledMessages: messages.filter((m) => !m.handled).length
  };
}

export async function adminGetAllEvents(): Promise<DbEvent[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('events')
      .select('*, registrations(count)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((e: any) => ({
      ...e,
      registrations_count: e.registrations?.[0]?.count || 0
    }));
  }
  return mockEvents.map((e) => ({
    ...e,
    registrations_count: mockStudentRegistrations.filter((r) => r.event_id === e.id && r.status === 'registered').length
  }));
}

export async function adminSaveEvent(eventData: Partial<DbEvent>): Promise<{ success: boolean; data?: DbEvent; message?: string }> {
  if (isSupabaseConfigured && supabase) {
    const payload = {
      title: eventData.title,
      slug: eventData.slug,
      type: eventData.type,
      short_description: eventData.short_description,
      description: eventData.description,
      agenda: eventData.agenda || [],
      prerequisites: eventData.prerequisites || [],
      venue: eventData.venue,
      starts_at: eventData.starts_at,
      ends_at: eventData.ends_at,
      eligibility: eventData.eligibility || 'Kishkinda University students',
      coordinator_name: eventData.coordinator_name,
      registration_opens_at: eventData.registration_opens_at || null,
      registration_deadline: eventData.registration_deadline,
      capacity: eventData.capacity ? Number(eventData.capacity) : null,
      allow_waitlist: Boolean(eventData.allow_waitlist),
      status: eventData.status || 'draft'
    };

    if (eventData.id) {
      const { data, error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', eventData.id)
        .select()
        .single();

      if (error) return { success: false, message: mapApiError(error) };
      return { success: true, data };
    }

    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select()
      .single();

    if (error) return { success: false, message: mapApiError(error) };
    return { success: true, data };
  }

  if (eventData.id) {
    const idx = mockEvents.findIndex((e) => e.id === eventData.id);
    if (idx >= 0) {
      mockEvents[idx] = { ...mockEvents[idx], ...eventData } as DbEvent;
      return { success: true, data: mockEvents[idx] };
    }
  }

  const newEvent: DbEvent = {
    id: `ev-${Date.now()}`,
    slug: eventData.slug || `event-${Date.now()}`,
    title: eventData.title || 'New Event',
    type: eventData.type || 'Workshop',
    short_description: eventData.short_description || '',
    description: eventData.description || '',
    agenda: eventData.agenda || [],
    prerequisites: eventData.prerequisites || [],
    venue: eventData.venue || 'Campus Auditorium',
    starts_at: eventData.starts_at || new Date().toISOString(),
    ends_at: eventData.ends_at || new Date().toISOString(),
    eligibility: eventData.eligibility || 'Kishkinda University students',
    coordinator_name: eventData.coordinator_name || 'Coders Club',
    registration_opens_at: eventData.registration_opens_at || new Date().toISOString(),
    registration_deadline: eventData.registration_deadline || new Date().toISOString(),
    capacity: eventData.capacity || null,
    allow_waitlist: Boolean(eventData.allow_waitlist),
    status: eventData.status || 'draft',
    created_at: new Date().toISOString()
  };
  mockEvents.push(newEvent);
  return { success: true, data: newEvent };
}

export async function adminDeleteEvent(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    return !error;
  }
  const idx = mockEvents.findIndex((e) => e.id === id);
  if (idx >= 0) {
    mockEvents.splice(idx, 1);
    return true;
  }
  return false;
}

export async function adminGetAllRegistrations(eventId?: string): Promise<DbRegistration[]> {
  const detailed = await adminGetAllRegistrationsDetailed(eventId);
  return detailed.map((r) => ({
    id: r.id,
    event_id: r.event_id,
    confirmation_id: r.confirmation_id,
    full_name: r.profile?.full_name || 'Unknown Student',
    email: r.profile?.email || '',
    department: r.profile?.department || '',
    year: r.profile?.year || '',
    university_reg_no: r.profile?.usn || '',
    consent: true,
    consent_at: r.created_at,
    checked_in: Boolean(r.checked_in_at),
    checked_in_at: r.checked_in_at,
    created_at: r.created_at,
    event_title: r.event_title
  }));
}

export async function adminCheckInAttendee(confirmationId: string, eventId?: string): Promise<{ success: boolean; message: string; attendee?: any }> {
  return adminCheckInAttendeeByCodeOrUsn(confirmationId, eventId);
}

export async function registerForEvent(
  eventId: string,
  formData: RegistrationFormData
): Promise<RegistrationResult> {
  if (formData.websiteUrl && formData.websiteUrl.length > 0) {
    return {
      success: false,
      code: 'BOT_DETECTED',
      message: 'Invalid submission request.'
    };
  }

  return registerStudentForEvent(eventId, 'mock-student-1');
}

export async function fetchPublishedAnnouncements(): Promise<DbAnnouncement[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) return [];
    return (data as DbAnnouncement[]) || [];
  }
  return mockAnnouncements.filter((a) => a.status === 'published');
}

export async function fetchGalleryItems(): Promise<DbGalleryItem[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) return [];
    if (data && data.length > 0) return data as DbGalleryItem[];
  }
  return getInitialMockGalleryItems().filter((g) => g.published);
}

export async function submitContactMessage(formData: ContactFormData): Promise<{ success: boolean; message: string }> {
  if (formData.websiteUrl && formData.websiteUrl.length > 0) {
    return { success: false, message: 'Invalid submission.' };
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('contact_messages').insert({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      message: formData.message.trim()
    });

    if (error) {
      return { success: false, message: mapApiError(error) };
    }
    return { success: true, message: 'Your message has been sent to the coordinator.' };
  }

  mockContactMessages.push({
    id: `msg-${Date.now()}`,
    name: formData.name,
    email: formData.email,
    message: formData.message,
    handled: false,
    created_at: new Date().toISOString()
  });

  return { success: true, message: 'Your message has been sent to the coordinator.' };
}

export async function adminGetContactMessages(): Promise<DbContactMessage[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data as DbContactMessage[]) || [];
  }
  return [...mockContactMessages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function adminMarkMessageHandled(id: string, handled: boolean): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('contact_messages')
      .update({ handled, handled_at: handled ? new Date().toISOString() : null })
      .eq('id', id);
    return !error;
  }
  const msg = mockContactMessages.find((m) => m.id === id);
  if (msg) {
    msg.handled = handled;
    msg.handled_at = handled ? new Date().toISOString() : null;
    return true;
  }
  return false;
}

export async function adminGetAllAnnouncements(): Promise<DbAnnouncement[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data as DbAnnouncement[]) || [];
  }
  return mockAnnouncements;
}

export async function adminSaveAnnouncement(ann: Partial<DbAnnouncement>): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    if (ann.id) {
      const { error } = await supabase.from('announcements').update(ann).eq('id', ann.id);
      return !error;
    }
    const { error } = await supabase.from('announcements').insert(ann);
    return !error;
  }
  if (ann.id) {
    const idx = mockAnnouncements.findIndex((a) => a.id === ann.id);
    if (idx >= 0) {
      mockAnnouncements[idx] = { ...mockAnnouncements[idx], ...ann } as DbAnnouncement;
      return true;
    }
  }
  mockAnnouncements.push({
    id: `ann-${Date.now()}`,
    title: ann.title || 'Untitled',
    body: ann.body || '',
    published_at: ann.published_at || new Date().toISOString(),
    status: ann.status || 'published',
    created_at: new Date().toISOString()
  });
  return true;
}

export async function adminDeleteAnnouncement(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    return !error;
  }
  const idx = mockAnnouncements.findIndex((a) => a.id === id);
  if (idx >= 0) {
    mockAnnouncements.splice(idx, 1);
    return true;
  }
  return false;
}

export async function adminGetAllGallery(): Promise<DbGalleryItem[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    if (data && data.length > 0) return data as DbGalleryItem[];
  }
  return getInitialMockGalleryItems();
}

export async function adminUploadGalleryImage(file: File): Promise<{ success: boolean; path?: string; message?: string }> {
  if (file.size > 5242880) {
    return { success: false, message: 'Image size exceeds maximum limit of 5 MB.' };
  }

  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };

  const safeExt = mimeMap[file.type];
  if (!safeExt) {
    return { success: false, message: 'Invalid image format. Allowed formats: JPEG, PNG, WebP.' };
  }

  if (isSupabaseConfigured && supabase) {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const cleanFileName = `gallery-${Date.now()}-${hex}.${safeExt}`;
    const { data, error } = await supabase.storage.from('gallery').upload(cleanFileName, file, {
      cacheControl: '3600',
      upsert: false
    });

    if (error) {
      return { success: false, message: mapApiError(error) };
    }

    const { data: pubData } = supabase.storage.from('gallery').getPublicUrl(data.path);
    return { success: true, path: pubData.publicUrl };
  }

  return { success: true, path: URL.createObjectURL(file) };
}

export async function adminSaveGalleryItem(item: Partial<DbGalleryItem>): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('gallery_items').insert(item);
    if (!error) return true;
  }
  mockGalleryItems = getInitialMockGalleryItems();
  mockGalleryItems.unshift({
    id: `gal-${Date.now()}`,
    image_path: item.image_path || '',
    caption: item.caption || '',
    alt_text: item.alt_text || 'Coders Club photo',
    published: item.published !== undefined ? item.published : true,
    created_at: new Date().toISOString()
  });
  saveMockGalleryItems(mockGalleryItems);
  return true;
}

export async function adminDeleteGalleryItem(id: string, imagePath?: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    if (imagePath && imagePath.includes('/gallery/')) {
      const fileName = imagePath.split('/gallery/').pop()?.split('?')[0];
      if (fileName) {
        await supabase.storage.from('gallery').remove([fileName]);
      }
    }
    const { error } = await supabase.from('gallery_items').delete().eq('id', id);
    if (!error) return true;
  }
  mockGalleryItems = getInitialMockGalleryItems();
  const idx = mockGalleryItems.findIndex((g) => g.id === id);
  if (idx >= 0) {
    mockGalleryItems.splice(idx, 1);
    saveMockGalleryItems(mockGalleryItems);
    return true;
  }
  return false;
}

export async function fetchPublishedProjects(): Promise<DbProject[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as DbProject[];
    }
  }
  return mockProjects.filter((p) => p.published);
}

export async function fetchProjectBySlug(slug: string): Promise<DbProject | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (!error && data) {
      return data as DbProject;
    }
  }
  const found = mockProjects.find((p) => p.slug === slug && p.published);
  return found || null;
}

export async function adminGetAllProjects(): Promise<DbProject[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as DbProject[];
    }
  }
  return mockProjects;
}

export async function adminSaveProject(project: Partial<DbProject>): Promise<{ success: boolean; data?: DbProject; message?: string }> {
  if (isSupabaseConfigured && supabase) {
    const payload = {
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      status: project.status || 'In progress',
      tech_stack: project.tech_stack || [],
      repo_url: project.repo_url,
      demo_url: project.demo_url || null,
      how_to_contribute: project.how_to_contribute || null,
      published: project.published !== undefined ? project.published : true
    };

    if (project.id) {
      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', project.id)
        .select()
        .single();

      if (error) return { success: false, message: mapApiError(error) };
      return { success: true, data };
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();

    if (error) return { success: false, message: mapApiError(error) };
    return { success: true, data };
  }

  if (project.id) {
    const idx = mockProjects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      mockProjects[idx] = { ...mockProjects[idx], ...project } as DbProject;
      return { success: true, data: mockProjects[idx] };
    }
  }

  const newProj: DbProject = {
    id: `proj-${Date.now()}`,
    slug: project.slug || `project-${Date.now()}`,
    title: project.title || 'New Project',
    summary: project.summary || '',
    status: project.status || 'In progress',
    tech_stack: project.tech_stack || [],
    repo_url: project.repo_url || '',
    demo_url: project.demo_url || null,
    how_to_contribute: project.how_to_contribute || null,
    published: project.published !== undefined ? project.published : true,
    created_at: new Date().toISOString()
  };
  mockProjects.push(newProj);
  return { success: true, data: newProj };
}

export async function adminDeleteProject(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    return !error;
  }
  const idx = mockProjects.findIndex((p) => p.id === id);
  if (idx >= 0) {
    mockProjects.splice(idx, 1);
    return true;
  }
  return false;
}

export async function fetchTeamGroups(): Promise<PeopleGroup[]> {
  const allOrigMembers = PEOPLE_GROUPS.flatMap((g) => g.members);

  const mapMemberToPerson = (m: DbTeamMember): Person => {
    const matchedOrig = allOrigMembers.find(
      (p) => p.id === m.id || p.name.trim().toLowerCase() === m.name.trim().toLowerCase()
    );
    const responsibilities =
      (m.responsibilities && m.responsibilities.length > 0)
        ? m.responsibilities
        : (matchedOrig?.responsibilities && matchedOrig.responsibilities.length > 0)
        ? matchedOrig.responsibilities
        : getDefaultResponsibilities(m.role, m.group);

    return {
      id: m.id,
      name: m.name,
      role: m.role,
      group: m.group,
      order: m.display_order,
      department: m.department || matchedOrig?.department || undefined,
      year: m.year || matchedOrig?.year || undefined,
      designation: m.designation || matchedOrig?.designation || undefined,
      bio: m.bio || matchedOrig?.bio || undefined,
      responsibilities,
      skills: m.skills || matchedOrig?.skills || undefined,
      photo: m.photo || matchedOrig?.photo || undefined,
      email: m.email || matchedOrig?.email || undefined,
      phone: matchedOrig?.phone || undefined,
      linkedin: m.linkedin || matchedOrig?.linkedin || undefined,
      github: m.github || matchedOrig?.github || undefined,
      showContact: Boolean(m.email || matchedOrig?.email)
    };
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      const groupsMap = new Map<string, DbTeamMember[]>();
      for (const item of data) {
        const grp = item.group || 'Core Team';
        if (!groupsMap.has(grp)) {
          groupsMap.set(grp, []);
        }
        groupsMap.get(grp)!.push(item);
      }

      const result: PeopleGroup[] = [];
      for (const [groupName, members] of groupsMap.entries()) {
        members.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        const id = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const matchedOrig = PEOPLE_GROUPS.find((g) => g.groupName.toLowerCase() === groupName.toLowerCase() || g.id === id);
        result.push({
          id,
          groupName,
          eyebrow: matchedOrig?.eyebrow || 'Team',
          description: matchedOrig?.description,
          members: members.map(mapMemberToPerson)
        });
      }
      return result;
    }
  }

  const mockList = getInitialMockTeamMembers();
  const groupsMap = new Map<string, DbTeamMember[]>();
  for (const item of mockList) {
    const grp = item.group || 'Core Team';
    if (!groupsMap.has(grp)) {
      groupsMap.set(grp, []);
    }
    groupsMap.get(grp)!.push(item);
  }

  const result: PeopleGroup[] = [];
  for (const [groupName, members] of groupsMap.entries()) {
    members.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const id = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const matchedOrig = PEOPLE_GROUPS.find((g) => g.groupName.toLowerCase() === groupName.toLowerCase() || g.id === id);
    result.push({
      id,
      groupName,
      eyebrow: matchedOrig?.eyebrow || 'Team',
      description: matchedOrig?.description,
      members: members.map(mapMemberToPerson)
    });
  }
  return result;
}

export async function adminGetTeamMembers(): Promise<DbTeamMember[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && data) {
      return data as DbTeamMember[];
    }
  }
  mockTeamMembers = getInitialMockTeamMembers();
  return [...mockTeamMembers];
}

export async function adminSaveTeamMember(
  memberData: Omit<DbTeamMember, 'id' | 'created_at' | 'updated_at'> & { id?: string },
  photoFile?: File
): Promise<{ success: boolean; data?: DbTeamMember; message?: string }> {
  if (isSupabaseConfigured && supabase) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, message: 'Unauthorized: Admin authentication required' };
    }

    const { data: adminCheck } = await supabase.rpc('is_admin', { check_user_id: user.id });
    if (!adminCheck) {
      return { success: false, message: 'Forbidden: Insufficient privileges' };
    }

    let photoUrl = memberData.photo || null;

    if (photoFile) {
      const ext = photoFile.name.split('.').pop() || 'png';
      const fileName = `team_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('team-photos')
        .upload(filePath, photoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return { success: false, message: `Photo upload failed: ${uploadError.message}` };
      }

      const { data: publicUrlData } = supabase.storage
        .from('team-photos')
        .getPublicUrl(filePath);

      photoUrl = publicUrlData.publicUrl;
    }

    const payload = {
      name: memberData.name.trim(),
      role: memberData.role.trim(),
      department: memberData.department?.trim() || null,
      year: memberData.year?.trim() || null,
      photo: photoUrl,
      email: memberData.email?.trim() || null,
      linkedin: memberData.linkedin?.trim() || null,
      github: memberData.github?.trim() || null,
      group: memberData.group?.trim() || 'Core Team',
      display_order: Number(memberData.display_order) || 100,
      updated_at: new Date().toISOString()
    };

    if (memberData.id) {
      const { data, error } = await supabase
        .from('team_members')
        .update(payload)
        .eq('id', memberData.id)
        .select()
        .single();

      if (error) return { success: false, message: error.message };
      return { success: true, data };
    }

    const { data, error } = await supabase
      .from('team_members')
      .insert(payload)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data };
  }

  let photoUrl = memberData.photo || null;
  if (photoFile) {
    photoUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(photoFile);
    });
  }

  mockTeamMembers = getInitialMockTeamMembers();

  if (memberData.id) {
    const idx = mockTeamMembers.findIndex((m) => m.id === memberData.id);
    if (idx >= 0) {
      mockTeamMembers[idx] = {
        ...mockTeamMembers[idx],
        ...memberData,
        photo: photoUrl,
        updated_at: new Date().toISOString()
      };
      saveMockTeamMembers(mockTeamMembers);
      return { success: true, data: mockTeamMembers[idx] };
    }
  }

  const newMember: DbTeamMember = {
    id: `tm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: memberData.name.trim(),
    role: memberData.role.trim(),
    department: memberData.department?.trim() || null,
    year: memberData.year?.trim() || null,
    photo: photoUrl,
    email: memberData.email?.trim() || null,
    linkedin: memberData.linkedin?.trim() || null,
    github: memberData.github?.trim() || null,
    group: memberData.group?.trim() || 'Core Team',
    display_order: Number(memberData.display_order) || 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockTeamMembers.push(newMember);
  saveMockTeamMembers(mockTeamMembers);
  return { success: true, data: newMember };
}

export async function adminDeleteTeamMember(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return false;
    }

    const { data: adminCheck } = await supabase.rpc('is_admin', { check_user_id: user.id });
    if (!adminCheck) {
      return false;
    }

    const { data: member } = await supabase
      .from('team_members')
      .select('photo')
      .eq('id', id)
      .single();

    if (member?.photo && member.photo.includes('/team-photos/')) {
      const parts = member.photo.split('/team-photos/');
      if (parts[1]) {
        const path = parts[1].split('?')[0];
        await supabase.storage.from('team-photos').remove([path]);
      }
    }

    const { error } = await supabase.from('team_members').delete().eq('id', id);
    return !error;
  }

  mockTeamMembers = getInitialMockTeamMembers();
  const idx = mockTeamMembers.findIndex((m) => m.id === id);
  if (idx >= 0) {
    mockTeamMembers.splice(idx, 1);
    saveMockTeamMembers(mockTeamMembers);
    return true;
  }
  return false;
}
