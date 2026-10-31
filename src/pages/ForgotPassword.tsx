import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { forgotPasswordSchema } from '../lib/validation';
import { HairlineGrid } from '../components/HairlineGrid';

export const ForgotPassword: React.FC = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    await requestPasswordReset(email);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <HairlineGrid>
      <div data-cursor-native className="hairline-row w-full px-4 sm:px-6 py-16 flex justify-center">
        <div className="max-w-md w-full flex flex-col gap-6 text-left">
          <Link
            to="/signin"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-strong)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>

          <div className="flex flex-col gap-2 pb-2 border-b border-[var(--border)]">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Security
            </span>
            <h1 className="font-display font-extrabold text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
              Reset password
            </h1>
            <p className="text-sm text-[var(--text-muted)] m-0">
              Enter your registered email address to receive a secure recovery link.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm text-[var(--text-strong)] leading-relaxed m-0 font-medium">
                If an account exists for this email address, a password reset link has been sent. Please check your inbox and spam folder.
              </p>
              <Link to="/signin" className="cc-btn cc-btn--primary min-h-[44px] text-xs font-mono font-bold self-start mt-2">
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="forgot-email" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'forgot-email-error' : undefined}
                  className="cc-input w-full min-h-[44px] px-3.5 bg-[var(--surface)] text-[var(--text-strong)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] text-sm"
                />
                {error && (
                  <span id="forgot-email-error" className="text-xs text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] font-mono">
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
                {isSubmitting ? 'Sending link...' : 'Send reset instructions'}
              </button>
            </form>
          )}
        </div>
      </div>
    </HairlineGrid>
  );
};
