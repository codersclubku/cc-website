import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { checkIsAdmin, fetchStudentProfile, upsertStudentProfile, recordConsent, withdrawConsent, deleteStudentAccount } from '../lib/api';
import type { StudentProfile } from '../lib/api';
import type { SignUpFormData } from '../lib/validation';

export interface AuthUser {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: StudentProfile | null;
  isAdmin: boolean;
  loading: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpFormData) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
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

  const isEmailVerified = Boolean(user?.email_confirmed_at);

  const loadProfileAndAdmin = async (userId: string, email?: string) => {
    try {
      const [adminStatus, userProfile] = await Promise.all([
        checkIsAdmin(userId),
        fetchStudentProfile(userId)
      ]);
      setIsAdmin(adminStatus);
      if (userProfile) {
        setProfile({ ...userProfile, email: email || userProfile.email });
      } else {
        setProfile(null);
      }
    } catch {
      setIsAdmin(false);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email,
              email_confirmed_at: session.user.email_confirmed_at
            };
            setUser(authUser);
            await loadProfileAndAdmin(authUser.id, authUser.email);
          }
        } catch {
        } finally {
          if (mounted) setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user && mounted) {
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email,
              email_confirmed_at: session.user.email_confirmed_at
            };
            setUser(authUser);
            await loadProfileAndAdmin(authUser.id, authUser.email);
          } else if (mounted) {
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
          }
          if (mounted) setLoading(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      } else if (import.meta.env.DEV) {
        const mockAuth = localStorage.getItem('cc-mock-auth-session');
        if (mockAuth) {
          try {
            const parsed = JSON.parse(mockAuth);
            setUser(parsed.user);
            setProfile(parsed.profile);
            setIsAdmin(Boolean(parsed.isAdmin));
          } catch {
          }
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    await loadProfileAndAdmin(user.id, user.email);
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
          email_confirmed_at: data.user.email_confirmed_at
        };
        setUser(authUser);
        await loadProfileAndAdmin(authUser.id, authUser.email);
        return { success: true };
      } catch {
        return { success: false, error: GENERIC_AUTH_ERROR };
      }
    }

    if (!import.meta.env.DEV) {
      return { success: false, error: GENERIC_AUTH_ERROR };
    }

    if (cleanEmail === 'admin@codersclub.ku' && password === 'admin123') {
      const mockUser: AuthUser = { id: 'mock-admin-user', email: cleanEmail, email_confirmed_at: new Date().toISOString() };
      setUser(mockUser);
      setIsAdmin(true);
      setProfile(null);
      localStorage.setItem('cc-mock-auth-session', JSON.stringify({ user: mockUser, profile: null, isAdmin: true }));
      return { success: true };
    }

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
      setUser(mockUser);
      setProfile(mockProfile);
      setIsAdmin(false);
      localStorage.setItem('cc-mock-auth-session', JSON.stringify({ user: mockUser, profile: mockProfile, isAdmin: false }));
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
              usn: data.usn.toUpperCase().trim()
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

        const authUser: AuthUser = {
          id: userId,
          email: cleanEmail,
          email_confirmed_at: authData.user.email_confirmed_at
        };
        setUser(authUser);
        await loadProfileAndAdmin(userId, cleanEmail);

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

    const mockId = `mock-${Date.now()}`;
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

    setUser(mockUser);
    setProfile(newProfile);
    setIsAdmin(false);
    localStorage.setItem('cc-mock-auth-session', JSON.stringify({ user: mockUser, profile: newProfile, isAdmin: false }));

    return { success: true, requiresVerification: false };
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const allowedDomain = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/account',
          queryParams: allowedDomain ? { hd: allowedDomain } : undefined
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    return signIn('student@kishkindauniversity.edu.in', 'password123');
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('cc-mock-auth-session');
    localStorage.removeItem('cc-mock-admin-auth');
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
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
          redirectTo: window.location.origin + '/reset-password'
        });
      } catch {
      }
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
    return withdrawConsent(user.id);
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
        isEmailVerified,
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
