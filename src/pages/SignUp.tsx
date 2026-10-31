import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth, isProfileComplete } from '../context/AuthContext';
import { signUpSchema, sanitizeRedirectPath } from '../lib/validation';
import type { SignUpFormData } from '../lib/validation';
import { Alert } from '../components/Alert';
import { HairlineGrid } from '../components/HairlineGrid';
import { GOOGLE_SIGNIN_ENABLED } from '../config/features';

export const SignUp: React.FC = () => {
  const { user, profile, isAdmin, consentState, loading, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawReturnUrl = searchParams.get('returnUrl') || searchParams.get('returnTo');
  const returnUrl = sanitizeRedirectPath(rawReturnUrl, '/account');

  // If user is already authenticated or becomes authenticated via OAuth, redirect accordingly
  useEffect(() => {
    if (loading || !user) return;

    if (isAdmin && !profile) {
      navigate('/admin', { replace: true });
    } else if (!isProfileComplete(profile) || consentState !== 'ACTIVE') {
      navigate(`/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
    } else {
      navigate(returnUrl, { replace: true });
    }
  }, [user, profile, isAdmin, consentState, loading, navigate, returnUrl]);

  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    websiteUrl: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);

  const validateField = (field: keyof SignUpFormData, value: any) => {
    const singleFieldSchema = signUpSchema.pick({ [field]: true } as any);
    const result = singleFieldSchema.safeParse({ [field]: value });
    if (!result.success) {
      setErrors((prev) => ({ ...prev, [field]: result.error.issues[0]?.message || 'Invalid input' }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name as keyof SignUpFormData, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name as keyof SignUpFormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = signUpSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === 'string') {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setTouched(Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {}));

      const firstErrKey = Object.keys(fieldErrors)[0];
      const el = document.getElementById(`signup-${firstErrKey}`);
      el?.focus();
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(formData);
    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.error || 'Account registration failed.');
      return;
    }

    if (result.requiresVerification) {
      setVerificationPending(true);
    } else {
      navigate(`/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
    }
  };

  const handleGoogleAuth = async () => {
    setServerError(null);
    setIsSubmitting(true);
    const result = await signInWithGoogle(returnUrl);
    setIsSubmitting(false);
    if (!result.success) {
      setServerError(result.error || 'Google authentication failed.');
    }
  };

  if (verificationPending) {
    return (
      <HairlineGrid>
        <div className="hairline-row w-full px-6 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="max-w-lg w-full bg-[var(--surface)] border border-[var(--border)] p-8 rounded-sm flex flex-col gap-5 text-left">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="font-display font-extrabold text-2xl uppercase tracking-tight text-[var(--text-strong)] m-0">
              Verify your email
            </h1>
            <p className="text-sm text-[var(--text)] leading-relaxed m-0">
              A verification link was sent to <strong className="text-[var(--text-strong)]">{formData.email}</strong>. Please check your inbox and confirm your address to continue to your student profile setup.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link to={`/signin?returnUrl=${encodeURIComponent(returnUrl)}`} className="cc-btn cc-btn--primary min-h-[44px] text-xs font-mono font-bold">
                Go to Sign In
              </Link>
              <Link to="/privacy-policy" className="cc-btn cc-btn--secondary min-h-[44px] text-xs font-mono font-semibold">
                Read Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </HairlineGrid>
    );
  }

  return (
    <HairlineGrid>
      <div data-cursor-native className="hairline-row w-full px-4 sm:px-6 py-12 flex justify-center">
        <div className="max-w-xl w-full flex flex-col gap-6 text-left">
          <div className="flex flex-col gap-2 pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-semibold">
                Step 1 of 2
              </span>
              <span className="text-[var(--text-muted)] text-xs font-mono">•</span>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                Kishkinda University Coders Club
              </span>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[var(--text-strong)] m-0">
              Create your account
            </h1>
            <p className="text-sm text-[var(--text-muted)] m-0">
              Enter your email and create a password. You will complete your student academic profile in Step 2.
            </p>
          </div>

          {serverError && (
            <Alert type="error" title="Registration failed" message={serverError} />
          )}

          {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
            <div
              className="p-4 bg-[var(--color-danger-soft)] border border-[var(--color-danger-border)] rounded-sm text-xs font-mono text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] flex flex-col gap-1"
              role="alert"
              aria-live="polite"
            >
              <span className="font-bold">Please correct the following fields before proceeding:</span>
              <ul className="list-disc pl-4 space-y-0.5 m-0">
                {Object.entries(errors).map(([f, msg]) => (
                  <li key={f}>
                    <a href={`#signup-${f}`} className="underline hover:text-white">
                      {msg}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {GOOGLE_SIGNIN_ENABLED ? (
            <>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
                className="w-full min-h-[44px] px-4 py-2 border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--text-strong)] text-sm font-mono font-semibold rounded-sm flex items-center justify-center gap-3 transition-colors"
              >
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-[1px] bg-[var(--border)]" />
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">or email</span>
                <div className="flex-1 h-[1px] bg-[var(--border)]" />
              </div>
            </>
          ) : (
            <Alert
              type="info"
              message="Google Sign-In is temporarily unavailable. Please use your email and password to access your account."
            />
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="signup-websiteUrl">Do not fill this</label>
              <input
                type="text"
                id="signup-websiteUrl"
                name="websiteUrl"
                tabIndex={-1}
                autoComplete="off"
                value={formData.websiteUrl}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-email" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                Email Address <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">*</span>
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@kishkinda.edu.in"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
                className="cc-input w-full min-h-[44px] px-3.5 bg-[var(--surface)] text-[var(--text-strong)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] text-sm"
              />
              {errors.email && (
                <span id="signup-email-error" className="text-xs text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] font-mono">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-password" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                Password <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">*</span>
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'signup-password-error' : undefined}
                  className="cc-input w-full min-h-[44px] pl-3.5 pr-12 bg-[var(--surface)] text-[var(--text-strong)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-strong)] p-1.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                Minimum 8 characters. Password managers and paste allowed.
              </span>
              {errors.password && (
                <span id="signup-password-error" className="text-xs text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] font-mono">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="p-3.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-sm text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              By creating an account, you agree to Kishkinda University Coders Club's{' '}
              <Link to="/terms" target="_blank" className="text-[var(--link)] hover:text-[var(--link-hover)] underline">
                Terms of Service
              </Link>{' '}
              and acknowledge our{' '}
              <Link to="/privacy-policy" target="_blank" className="text-[var(--link)] hover:text-[var(--link-hover)] underline">
                Privacy Policy
              </Link>. You will complete your academic profile and privacy consent in Step 2.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="cc-btn cc-btn--primary min-h-[48px] w-full text-sm font-mono font-bold uppercase tracking-wider"
            >
              {isSubmitting ? 'Creating account...' : 'Continue to Profile (Step 2) →'}
            </button>
          </form>

          <div className="text-xs font-mono text-[var(--text-muted)] text-center pt-2">
            Already have an account?{' '}
            <Link to={`/signin?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-[var(--link)] hover:text-[var(--link-hover)] underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </HairlineGrid>
  );
};
