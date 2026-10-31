import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resetPasswordSchema } from '../lib/validation';
import { Alert } from '../components/Alert';
import { HairlineGrid } from '../components/HairlineGrid';

export const ResetPassword: React.FC = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = resetPasswordSchema.safeParse({ password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    const res = await updatePassword(password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to update password. Recovery link may have expired.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      navigate('/signin', { replace: true });
    }, 2000);
  };

  return (
    <HairlineGrid>
      <div data-cursor-native className="hairline-row w-full px-4 sm:px-6 py-16 flex justify-center">
        <div className="max-w-md w-full flex flex-col gap-6 text-left">
          <div className="flex flex-col gap-2 pb-2 border-b border-[var(--border)]">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Security
            </span>
            <h1 className="font-display font-extrabold text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
              Set new password
            </h1>
            <p className="text-sm text-[var(--text-muted)] m-0">
              Create a secure password with at least 8 characters for your account.
            </p>
          </div>

          {error && <Alert type="error" title="Password update failed" message={error} />}

          {success ? (
            <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm text-[var(--text-strong)] leading-relaxed m-0 font-medium">
                Your password has been updated successfully. Redirecting you to Sign In...
              </p>
              <Link to="/signin" className="cc-btn cc-btn--primary min-h-[44px] text-xs font-mono font-bold self-start mt-2">
                Sign In Now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-password" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="reset-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'reset-password-error' : undefined}
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
                {error && (
                  <span id="reset-password-error" className="text-xs text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] font-mono">
                    {error}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="cc-btn cc-btn--primary min-h-[48px] w-full text-sm font-mono font-bold uppercase tracking-wider"
              >
                {isSubmitting ? 'Updating password...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </HairlineGrid>
  );
};
