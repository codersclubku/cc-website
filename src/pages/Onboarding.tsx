import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth, isProfileComplete } from '../context/AuthContext';
import { DEPARTMENTS, ACADEMIC_YEARS, SEMESTERS, isValidUsn, sanitizeRedirectPath } from '../lib/validation';
import { Alert } from '../components/Alert';
import { HairlineGrid } from '../components/HairlineGrid';
import { ShieldCheck, LogOut, ExternalLink, Check } from 'lucide-react';
import { z } from 'zod';

const onboardingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name cannot exceed 100 characters.'),
  usn: z
    .string()
    .trim()
    .toUpperCase()
    .refine(isValidUsn, {
      message: 'USN must follow Kishkinda University format (e.g. KUB24CSE198).'
    }),
  department: z.string().refine((val) => (DEPARTMENTS as readonly string[]).includes(val), {
    message: 'Please select a valid department.'
  }),
  year: z.string().refine((val) => (ACADEMIC_YEARS as readonly string[]).includes(val), {
    message: 'Please select a valid academic year.'
  }),
  semester: z.string().refine((val) => (SEMESTERS as readonly string[]).includes(val), {
    message: 'Please select a valid semester.'
  }),
  consentAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must review and accept the Privacy Notice to complete registration.'
  })
});

export const Onboarding: React.FC = () => {
  const { user, profile, isAdmin, consentState, completeOnboarding, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawReturnUrl = searchParams.get('returnUrl') || searchParams.get('returnTo');
  const returnUrl = sanitizeRedirectPath(rawReturnUrl, '/account');
  const isMountedRef = useRef(true);

  const [formData, setFormData] = useState({
    fullName: '',
    usn: '',
    department: '',
    year: '',
    semester: '',
    consentAccepted: false
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Prefill Google metadata safely once user or profile is available
  useEffect(() => {
    if (!hasPrefilled && (user || profile)) {
      const initialName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        '';

      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || initialName,
        usn: prev.usn || profile?.usn || '',
        department: prev.department || profile?.department || '',
        year: prev.year || profile?.year || '',
        semester: prev.semester || profile?.semester || ''
      }));
      setHasPrefilled(true);
    }
  }, [user, profile, hasPrefilled]);

  // Route evaluation performed after all hooks
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (isProfileComplete(profile) && consentState === 'ACTIVE') {
    return <Navigate to={returnUrl} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const submissionUid = user.id;

    setServerError(null);
    setFormErrors({});

    const result = onboardingSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const res = await completeOnboarding({
      fullName:        formData.fullName,
      usn:             formData.usn,
      department:      formData.department,
      year:            formData.year,
      semester:        formData.semester,
      consentAccepted: formData.consentAccepted
    });

    // Guard: Only update state and navigate if component is mounted AND same user is active
    if (!isMountedRef.current) return;

    if (res.success) {
      if (user?.id === submissionUid) {
        navigate(returnUrl, { replace: true });
      }
    } else {
      setServerError(res.error || 'Failed to complete registration.');
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin', { replace: true });
  };

  return (
    <HairlineGrid className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-sm p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--border)]">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-semibold">
              Step 2 of 2
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-strong)] mt-1 font-display uppercase">
              Complete Your Student Profile
            </h1>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--color-danger-strong)] transition-colors p-2 rounded"
            title="Sign out and cancel"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {serverError && (
          <div className="mb-6">
            <Alert variant="danger" title="Registration Error">
              {serverError}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Read-Only Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)] rounded-sm font-mono text-sm cursor-not-allowed select-none opacity-80"
            />
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-xs font-mono uppercase tracking-wider text-[var(--text-strong)] font-semibold">
              Full Name <span className="text-[var(--color-danger-strong)]">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-strong)] rounded-sm font-sans text-sm outline-none transition-colors"
              placeholder="e.g. Ramesh Kumar"
            />
            {formErrors.fullName && (
              <span className="text-xs text-[var(--color-danger-strong)] font-mono">{formErrors.fullName}</span>
            )}
          </div>

          {/* University Seat Number (USN) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="usn" className="text-xs font-mono uppercase tracking-wider text-[var(--text-strong)] font-semibold">
              University Seat Number (USN) <span className="text-[var(--color-danger-strong)]">*</span>
            </label>
            <input
              id="usn"
              type="text"
              required
              value={formData.usn}
              onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-strong)] rounded-sm font-mono text-sm uppercase outline-none transition-colors"
              placeholder="e.g. 2KA22CS001"
            />
            {formErrors.usn && (
              <span className="text-xs text-[var(--color-danger-strong)] font-mono">{formErrors.usn}</span>
            )}
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="department" className="text-xs font-mono uppercase tracking-wider text-[var(--text-strong)] font-semibold">
              Department <span className="text-[var(--color-danger-strong)]">*</span>
            </label>
            <select
              id="department"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-strong)] rounded-sm font-sans text-sm outline-none transition-colors"
            >
              <option value="" disabled>Select department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {formErrors.department && (
              <span className="text-xs text-[var(--color-danger-strong)] font-mono">{formErrors.department}</span>
            )}
          </div>

          {/* Academic Year and Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="year" className="text-xs font-mono uppercase tracking-wider text-[var(--text-strong)] font-semibold">
                Academic Year <span className="text-[var(--color-danger-strong)]">*</span>
              </label>
              <select
                id="year"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-strong)] rounded-sm font-sans text-sm outline-none transition-colors"
              >
                <option value="" disabled>Select year</option>
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {formErrors.year && (
                <span className="text-xs text-[var(--color-danger-strong)] font-mono">{formErrors.year}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="semester" className="text-xs font-mono uppercase tracking-wider text-[var(--text-strong)] font-semibold">
                Semester <span className="text-[var(--color-danger-strong)]">*</span>
              </label>
              <select
                id="semester"
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-strong)] rounded-sm font-sans text-sm outline-none transition-colors"
              >
                <option value="" disabled>Select semester</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {formErrors.semester && (
                <span className="text-xs text-[var(--color-danger-strong)] font-mono">{formErrors.semester}</span>
              )}
            </div>
          </div>

          {/* Privacy Notice Agreement: Standards-Compliant Accessible Checkbox */}
          <div className="p-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="font-mono text-xs uppercase tracking-wider font-bold">
                Privacy Notice Agreement (Notice v1.0-2026)
              </span>
            </div>
            <p className="text-xs text-[var(--text)] leading-relaxed m-0 font-sans">
              Your name, email address, USN, and department are processed in accordance with the Digital Personal Data Protection Act, 2023 for student event registration, QR attendance verification, and club records under Kishkinda University policy.
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
              <Link
                to="/privacy-policy"
                target="_blank"
                className="text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] inline-flex items-center gap-1 underline"
              >
                <span>Read full Privacy Notice</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input
                id="consentAccepted"
                type="checkbox"
                checked={formData.consentAccepted}
                onChange={(e) => setFormData({ ...formData, consentAccepted: e.target.checked })}
                className="sr-only"
              />
              <label
                htmlFor="consentAccepted"
                className="flex items-start gap-2.5 cursor-pointer select-none group"
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${
                    formData.consentAccepted
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                      : 'border-[var(--border)] bg-[var(--surface)] group-hover:border-[var(--accent)]'
                  }`}
                >
                  {formData.consentAccepted && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-xs text-[var(--text-strong)] leading-normal font-sans">
                  I have read, understood, and agree to the Kishkinda University Coders Club Privacy Notice. <span className="text-[var(--color-danger-strong)]">*</span>
                </span>
              </label>
            </div>
            {formErrors.consentAccepted && (
              <span className="text-xs text-[var(--color-danger-strong)] font-mono">{formErrors.consentAccepted}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="cc-btn cc-btn--primary min-h-[44px] w-full font-mono text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Saving Profile & Persisting Consent...' : 'Complete Profile & Continue'}
          </button>
        </form>
      </div>
    </HairlineGrid>
  );
};
