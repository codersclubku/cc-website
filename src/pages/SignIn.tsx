import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth, isProfileComplete } from '../context/AuthContext';
import { signInSchema } from '../lib/validation';
import type { SignInFormData } from '../lib/validation';
import { Alert } from '../components/Alert';
import { HairlineGrid } from '../components/HairlineGrid';

export const SignIn: React.FC = () => {
  const { user, profile, isAdmin, consentState, loading, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawReturnUrl = searchParams.get('returnUrl') || searchParams.get('returnTo');
  const returnUrl = (rawReturnUrl && rawReturnUrl !== '/signin' && rawReturnUrl !== '/signup') ? rawReturnUrl : '/account';

  const hashError = typeof window !== 'undefined' && window.location.hash
    ? new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash).get('error_description')
    : null;
  const urlOAuthError = searchParams.get('error_description') || searchParams.get('error') || hashError;

  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // If user is already authenticated or becomes authenticated via OAuth, redirect accordingly
  useEffect(() => {
    if (loading || !user) return;

    if (isAdmin && !profile) {
      navigate('/admin', { replace: true });
    } else if (!isProfileComplete(profile) || consentState !== 'ACTIVE') {
      navigate('/onboarding', { replace: true });
    } else {
      navigate(returnUrl, { replace: true });
    }
  }, [user, profile, isAdmin, consentState, loading, navigate, returnUrl]);

  // Capture OAuth callback error descriptions if redirected back with errors
  useEffect(() => {
    if (urlOAuthError) {
      const decoded = decodeURIComponent(urlOAuthError.replace(/\+/g, ' '));
      if (decoded.includes('already exists') || decoded.includes('identity_already_exists')) {
        setAuthError('An account with this email address already exists. Please sign in using your email and password.');
      } else {
        setAuthError(decoded);
      }
    }
  }, [urlOAuthError]);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const validateField = (field: keyof SignInFormData, value: string) => {
    const singleFieldSchema = signInSchema.pick({ [field]: true } as any);
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
      validateField(name as keyof SignInFormData, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name as keyof SignInFormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setAuthError(null);

    const validation = signInSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === 'string') {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setTouched({ email: true, password: true });
      const firstField = Object.keys(fieldErrors)[0];
      const el = document.getElementById(`signin-${firstField}`);
      el?.focus();
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(formData.email, formData.password);
    setIsSubmitting(false);

    if (!result.success) {
      const nextCount = failCount + 1;
      setFailCount(nextCount);
      if (nextCount >= 5) {
        setLockoutSeconds(60);
        setFailCount(0);
        setAuthError('Too many failed login attempts. Please wait 60 seconds before trying again.');
      } else {
        setAuthError(result.error || 'Email or password is incorrect.');
      }
      return;
    }

    setFailCount(0);
    navigate(returnUrl, { replace: true });
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    const result = await signInWithGoogle(returnUrl);
    setIsSubmitting(false);
    if (!result.success) {
      setAuthError(result.error || 'Google authentication failed.');
    }
  };

  return (
    <HairlineGrid>
      <div data-cursor-native className="hairline-row w-full px-4 sm:px-6 py-16 flex justify-center">
        <div className="max-w-md w-full flex flex-col gap-6 text-left">
          <div className="flex flex-col gap-2 pb-2 border-b border-[var(--border)]">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Kishkinda University Coders Club
            </span>
            <h1 className="font-display font-extrabold text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
              Sign in to your account
            </h1>
            <p className="text-sm text-[var(--text-muted)] m-0">
              Access your registered events, QR tickets, and profile settings.
            </p>
          </div>

          {authError && (
            <Alert type="error" title="Sign in failed" message={authError} />
          )}

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

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signin-email" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                Email Address
              </label>
              <input
                id="signin-email"
                name="email"
                type="email"
                autoComplete="username"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'signin-email-error' : undefined}
                className="cc-input w-full min-h-[44px] px-3.5 bg-[var(--surface)] text-[var(--text-strong)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] text-sm"
              />
              {errors.email && (
                <span id="signin-email-error" className="text-xs text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] font-mono">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="signin-password" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="signin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'signin-password-error' : undefined}
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
              {errors.password && (
                <span id="signin-password-error" className="text-xs text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] font-mono">
                  {errors.password}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || lockoutSeconds > 0}
              aria-busy={isSubmitting}
              className="cc-btn cc-btn--primary min-h-[48px] w-full text-sm font-mono font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {isSubmitting
                ? 'Signing in...'
                : lockoutSeconds > 0
                ? `Locked out (${lockoutSeconds}s)`
                : 'Sign in'}
            </button>
          </form>

          <div className="text-xs font-mono text-[var(--text-muted)] text-center pt-2 flex flex-col gap-2">
            <div>
              New student at Kishkinda?{' '}
              <Link to={`/signup?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-[var(--link)] hover:text-[var(--link-hover)] underline">
                Create an account
              </Link>
            </div>
            <div>
              Club Coordinator or Admin?{' '}
              <Link to="/admin/login" className="text-[var(--text-muted)] hover:text-[var(--text-strong)] underline">
                Admin portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HairlineGrid>
  );
};
