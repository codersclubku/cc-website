import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  checkIsAdmin,
  fetchStudentProfile,
  upsertStudentProfile,
  completeStudentOnboardingApi,
  recordConsent,
  checkConsentStatus,
  withdrawConsent,
  deleteStudentAccount
} from '../lib/api';
import type { StudentProfile, ProfileQueryResult, ConsentStatusResult } from '../lib/api';
import type { SignUpFormData } from '../lib/validation';

export interface AuthUser {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, any>;
}

export type ConsentState = 'ACTIVE' | 'MISSING' | 'ERROR' | 'LOADING';

export function isProfileComplete(profile: StudentProfile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.id &&
    profile.full_name?.trim() &&
    profile.usn?.trim() &&
    profile.department?.trim() &&
    profile.year?.trim() &&
    profile.semester?.trim()
  );
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: StudentProfile | null;
  isAdmin: boolean;
  loading: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  profileLoadError: string | null;
  consentState: ConsentState;
  acceptConsent: () => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (data: {
    fullName: string;
    usn: string;
    department: string;
    year: string;
    semester: string;
    consentAccepted: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpFormData) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  signInWithGoogle: (returnPath?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<StudentProfile>) => Promise<{ success: boolean; error?: string }>;
  withdrawNoticeConsent: () => Promise<boolean>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GENERIC_AUTH_ERROR = 'Email or password is incorrect.';
const GENERIC_RESET_CONFIRMATION = 'If an account exists for this email address, a password reset link has been sent.';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [consentState, setConsentState] = useState<ConsentState>('LOADING');

  const authOpRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // ---------------------------------------------------------------------------
  // 1. Authoritative Auth State & Session Initialization
  // ---------------------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;

    if (!isSupabaseConfigured || !supabase) {
      if (import.meta.env.DEV) {
        const mockAuth = localStorage.getItem('cc-mock-auth-session');
        if (mockAuth) {
          try {
            const parsed = JSON.parse(mockAuth);
            setUser(parsed.user);
            setProfile(parsed.profile);
            setIsAdmin(Boolean(parsed.isAdmin));
            activeUserIdRef.current = parsed.user?.id || null;
          } catch {}
        }
      }
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    // Inspect URL for OAuth parameters or errors
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
    );
    const oauthError =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error');

    if (oauthError) {
      setProfileLoadError(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
    }

    const hasCallbackInUrl = Boolean(
      searchParams.get('code') ||
      hashParams.get('access_token')
    );

    // 1. Subscribe to subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        authOpRef.current++;
        activeUserIdRef.current = null;
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setProfileLoadError(null);
        setConsentState('MISSING');
        setLoading(false);
      } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          email_confirmed_at: session.user.email_confirmed_at,
          user_metadata: session.user.user_metadata
        };
        activeUserIdRef.current = authUser.id;
        setUser(authUser);
      } else if (event === 'INITIAL_SESSION' && !session?.user && !hasCallbackInUrl) {
        // Only mark unauthenticated if there is no pending OAuth code in URL
        authOpRef.current++;
        activeUserIdRef.current = null;
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setProfileLoadError(null);
        setConsentState('MISSING');
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') {
        if (session?.user && session.user.id === activeUserIdRef.current) {
          setUser((prev) =>
            prev ? { ...prev, email_confirmed_at: session.user.email_confirmed_at, user_metadata: session.user.user_metadata } : null
          );
        }
      }
    });

    // 2. Authoritative getSession() to guarantee PKCE code exchange finishes before ending loading
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mountedRef.current) return;

      if (error) {
        setProfileLoadError(error.message);
      }

      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          email_confirmed_at: session.user.email_confirmed_at,
          user_metadata: session.user.user_metadata
        };
        activeUserIdRef.current = authUser.id;
        setUser(authUser);
      } else {
        authOpRef.current++;
        activeUserIdRef.current = null;
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setConsentState('MISSING');
        setLoading(false);
      }
    }).catch((err) => {
      if (!mountedRef.current) return;
      setProfileLoadError(err?.message || 'Authentication initialization error');
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Decoupled Asynchronous Database Loader (Runs when user.id changes)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsAdmin(false);
      setProfileLoadError(null);
      setConsentState('MISSING');
      setLoading(false);
      return;
    }

    const currentUserId = user.id;
    const currentOp = ++authOpRef.current;
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const [adminStatus, profResult, consentResult]: [boolean, ProfileQueryResult, ConsentStatusResult] = await Promise.all([
          checkIsAdmin(currentUserId),
          fetchStudentProfile(currentUserId, user?.email, Boolean(user?.email_confirmed_at)),
          checkConsentStatus(currentUserId, 'v1.0-2026')
        ]);

        if (isCancelled || !mountedRef.current || authOpRef.current !== currentOp || activeUserIdRef.current !== currentUserId) {
          return;
        }

        setIsAdmin(adminStatus);

        if (profResult.status === 'FOUND') {
          if (profResult.profile.id !== currentUserId) {
            throw new Error('Security assertion failed: profile identity mismatch');
          }
          setProfile(profResult.profile);
          setProfileLoadError(null);
        } else if (profResult.status === 'NOT_FOUND') {
          setProfile(null);
          setProfileLoadError(null);
        } else {
          setProfile(null);
          setProfileLoadError(profResult.error);
        }

        if (consentResult.status === 'ACTIVE') {
          setConsentState('ACTIVE');
        } else if (consentResult.status === 'MISSING') {
          setConsentState('MISSING');
        } else {
          setConsentState('ERROR');
        }
      } catch (err: any) {
        if (!isCancelled && mountedRef.current && authOpRef.current === currentOp) {
          setProfile(null);
          setProfileLoadError(err?.message || 'Failed to authenticate student profile');
          setConsentState('ERROR');
        }
      } finally {
        if (!isCancelled && mountedRef.current && authOpRef.current === currentOp) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  // ---------------------------------------------------------------------------
  // 3. User Actions (Guarded against stale async states and session invalidation)
  // ---------------------------------------------------------------------------

  const completeOnboarding = async (data: {
    fullName: string;
    usn: string;
    department: string;
    year: string;
    semester: string;
    consentAccepted: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'You must be signed in to complete onboarding.' };
    if (!data.consentAccepted) return { success: false, error: 'Explicit privacy notice acceptance is required.' };

    const submissionUid = user.id;
    const currentOp = ++authOpRef.current;

    try {
      const savedProfile = await completeStudentOnboardingApi({
        fullName:        data.fullName.trim(),
        usn:             data.usn.toUpperCase().trim(),
        department:      data.department,
        year:            data.year,
        semester:        data.semester,
        consentAccepted: data.consentAccepted,
        version:         'v1.0-2026'
      });

      if (savedProfile.id !== submissionUid) {
        throw new Error('Security assertion failed: returned profile ID mismatch');
      }

      if (mountedRef.current && authOpRef.current === currentOp && activeUserIdRef.current === submissionUid) {
        setProfile({
          ...savedProfile,
          email: user.email,
          email_verified: Boolean(user.email_confirmed_at)
        });
        setConsentState('ACTIVE');
        setProfileLoadError(null);
      }

      return { success: true };
    } catch (err: any) {
      const isDuplicate = err?.code === '23505' || err?.message?.includes('already registered') || err?.message?.includes('already exists');
      return {
        success: false,
        error: isDuplicate
          ? 'This USN is already registered to another account. Please contact the club coordinator at codersclub.ku@gmail.com.'
          : err?.message || 'Failed to complete registration. Please try again.'
      };
    }
  };

  const acceptConsent = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not signed in.' };
    const res = await recordConsent(user.id, 'v1.0-2026');
    if (res.success) {
      setConsentState('ACTIVE');
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to record consent.' };
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    const currentOp = ++authOpRef.current;
    const currentUid = user.id;

    try {
      const [adminStatus, profResult, consentResult] = await Promise.all([
        checkIsAdmin(currentUid),
        fetchStudentProfile(currentUid, user.email, Boolean(user.email_confirmed_at)),
        checkConsentStatus(currentUid, 'v1.0-2026')
      ]);

      if (!mountedRef.current || authOpRef.current !== currentOp || activeUserIdRef.current !== currentUid) {
        return;
      }

      setIsAdmin(adminStatus);
      if (profResult.status === 'FOUND') {
        setProfile(profResult.profile);
        setProfileLoadError(null);
      } else if (profResult.status === 'ERROR') {
        setProfileLoadError(profResult.error);
      }
      setConsentState(consentResult.status);
    } catch {}
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (error || !data.user) {
          return { success: false, error: GENERIC_AUTH_ERROR };
        }

        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
          user_metadata: data.user.user_metadata
        };
        activeUserIdRef.current = authUser.id;
        setUser(authUser);
        return { success: true };
      } catch {
        return { success: false, error: GENERIC_AUTH_ERROR };
      }
    }

    if (!import.meta.env.DEV) {
      return { success: false, error: GENERIC_AUTH_ERROR };
    }

    // Mock Mode Administrator
    if (cleanEmail === 'admin@codersclub.ku' && password === 'admin123') {
      const mockUser: AuthUser = { id: 'mock-admin-user', email: cleanEmail, email_confirmed_at: new Date().toISOString() };
      activeUserIdRef.current = mockUser.id;
      setUser(mockUser);
      setIsAdmin(true);
      setProfile(null);
      setConsentState('ACTIVE');
      localStorage.setItem('cc-mock-auth-session', JSON.stringify({ user: mockUser, profile: null, isAdmin: true }));
      return { success: true };
    }

    // Mock Mode Student
    if (password.length >= 8) {
      const mockUser: AuthUser = {
        id: 'mock-student-1',
        email: cleanEmail,
        email_confirmed_at: new Date().toISOString()
      };
      const mockProfile: StudentProfile = {
        id: 'mock-student-1',
        full_name: 'Aditi Sharma',
        usn: 'KU2024CS001',
        department: 'Computer Science and Engineering',
        year: '2nd Year',
        semester: '3rd Semester',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email: cleanEmail,
        email_verified: true
      };
      activeUserIdRef.current = mockUser.id;
      setUser(mockUser);
      setProfile(mockProfile);
      setIsAdmin(false);
      setConsentState('ACTIVE');

      localStorage.setItem('cc-mock-auth-session', JSON.stringify({ user: mockUser, profile: mockProfile, isAdmin: false }));
      const consents = JSON.parse(localStorage.getItem('cc-mock-consents') || '{}');
      consents[mockUser.id] = { version: 'v1.0-2026', accepted_at: new Date().toISOString(), withdrawn_at: null };
      localStorage.setItem('cc-mock-consents', JSON.stringify(consents));

      return { success: true };
    }

    return { success: false, error: GENERIC_AUTH_ERROR };
  };

  const signUp = async (data: SignUpFormData): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const allowedDomain = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN;

    if (allowedDomain && !cleanEmail.endsWith(`@${allowedDomain}`) && !cleanEmail.endsWith(`.${allowedDomain}`)) {
      return {
        success: false,
        error: `Please use your university email ending with @${allowedDomain}`
      };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              usn: data.usn.toUpperCase().trim(),
              department: data.department,
              year: data.year,
              semester: data.semester
            }
          }
        });

        if (authErr || !authData.user) {
          return {
            success: false,
            error: authErr?.message || 'Could not create account. Please verify your details.'
          };
        }

        const userId = authData.user.id;

        // Attempt initial profile & consent upsert if session is active
        try {
          if (authData.session) {
            await upsertStudentProfile({
              id: userId,
              full_name: data.fullName,
              usn: data.usn.toUpperCase().trim(),
              department: data.department,
              year: data.year,
              semester: data.semester,
              email: cleanEmail,
              email_verified: Boolean(authData.user.email_confirmed_at)
            });

            await recordConsent(
              userId,
              'v1.0-2026',
              'Student event registration, attendance verification, and club records under Kishkinda University policy.'
            );
          }
        } catch {
          // If session was inactive (pending verification), the user will complete or load on first sign-in
        }

        const authUser: AuthUser = {
          id: userId,
          email: cleanEmail,
          email_confirmed_at: authData.user.email_confirmed_at
        };
        activeUserIdRef.current = authUser.id;
        setUser(authUser);

        return {
          success: true,
          requiresVerification: !authData.user.email_confirmed_at
        };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Failed to complete registration.'
        };
      }
    }

    // Mock Mode Signup
    const mockId = 'mock-student-1';
    const mockUser: AuthUser = { id: mockId, email: cleanEmail, email_confirmed_at: new Date().toISOString() };
    const newProfile: StudentProfile = {
      id: mockId,
      full_name: data.fullName,
      usn: data.usn.toUpperCase().trim(),
      department: data.department,
      year: data.year,
      semester: data.semester,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email: cleanEmail,
      email_verified: true
    };

    activeUserIdRef.current = mockId;
    setUser(mockUser);
    setProfile(newProfile);
    setIsAdmin(false);
    setConsentState('ACTIVE');

    localStorage.setItem('cc-mock-auth-session', JSON.stringify({ user: mockUser, profile: newProfile, isAdmin: false }));
    const consents = JSON.parse(localStorage.getItem('cc-mock-consents') || '{}');
    consents[mockId] = { version: 'v1.0-2026', accepted_at: new Date().toISOString(), withdrawn_at: null };
    localStorage.setItem('cc-mock-consents', JSON.stringify(consents));

    return { success: true, requiresVerification: false };
  };

  const signInWithGoogle = async (returnPath?: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const allowedDomain = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN;
      const targetUrl = returnPath
        ? `${window.location.origin}${returnPath.startsWith('/') ? returnPath : `/${returnPath}`}`
        : `${window.location.origin}/account`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: targetUrl,
          queryParams: allowedDomain ? { hd: allowedDomain } : undefined
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    return signIn('student@kishkindauniversity.edu.in', 'password123');
  };

  const signOut = async () => {
    authOpRef.current++;
    activeUserIdRef.current = null;
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setConsentState('MISSING');
    setProfileLoadError(null);

    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('cc-mock-auth-session');
    localStorage.removeItem('cc-mock-admin-auth');
  };

  const resendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.email) return { success: false, error: 'No active email found.' };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    return { success: true };
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`
        });
      } catch {}
    }
    return { success: true, message: GENERIC_RESET_CONFIRMATION };
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    return { success: true };
  };

  const updateProfile = async (data: Partial<StudentProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not logged in.' };
    try {
      const updated = await upsertStudentProfile({
        ...data,
        id: user.id
      });
      setProfile(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Profile update failed.' };
    }
  };

  const withdrawNoticeConsent = async (): Promise<boolean> => {
    if (!user) return false;
    const success = await withdrawConsent(user.id);
    if (success) {
      setConsentState('MISSING');
    }
    return success;
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated.' };
    try {
      const res = await deleteStudentAccount(user.id);
      if (res.success) {
        await signOut();
        return { success: true };
      }
      return { success: false, error: res.message };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Account deletion failed.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        isLoading: loading,
        isEmailVerified: Boolean(user?.email_confirmed_at),
        isProfileComplete: isProfileComplete(profile),
        profileLoadError,
        consentState,
        acceptConsent,
        completeOnboarding,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
        resendVerificationEmail,
        requestPasswordReset,
        updatePassword,
        updateProfile,
        withdrawNoticeConsent,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
