import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HairlineGrid } from '../../components/HairlineGrid';
import { Alert } from '../../components/Alert';
import { KULogo } from '../../components/KULogo';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setError(null);

    if (!email.trim() || !password) {
      setError('Email or password is incorrect.');
      return;
    }

    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);

    if (!res.success) {
      const next = failCount + 1;
      setFailCount(next);
      if (next >= 5) {
        setLockoutSeconds(60);
        setFailCount(0);
        setError('Too many failed administrative login attempts. Please wait 60 seconds.');
      } else {
        setError(res.error || 'Email or password is incorrect.');
      }
    } else {
      setFailCount(0);
      navigate('/admin');
    }
  };

  return (
    <HairlineGrid>
      <section className="hairline-row p-6 sm:p-16 min-h-[60vh] flex flex-col items-center justify-center bg-[var(--bg)]" aria-labelledby="login-heading">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Link to="/" className="text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-2 inline-flex items-center gap-1 self-start">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to home</span>
            </Link>

            <div className="flex items-center gap-3 my-2 pt-2 border-t border-[var(--border)]">
              <KULogo className="h-10 w-auto shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                  Kishkinda University
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Faculty & Coordinator Portal
                </span>
              </div>
            </div>

            <h1 id="login-heading" className="font-display font-extrabold text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
              Admin Login
            </h1>
            <p className="text-xs text-[var(--text-muted)] m-0">
              Sign in with your authorized Coders Club coordinator credentials.
            </p>
          </div>

          {error && (
            <Alert
              type="error"
              title="Authentication failure"
              message={error}
            />
          )}

          <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-sm">
            <div className="cc-field">
              <label htmlFor="admin-email">Email address</label>
              <input
                type="email"
                id="admin-email"
                autoComplete="email"
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cc-input"
                placeholder="coordinator@codersclub.ku"
                required
              />
            </div>

            <div className="cc-field">
              <label htmlFor="admin-password">Password</label>
              <input
                type="password"
                id="admin-password"
                autoComplete="current-password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cc-input"
                placeholder="••••••••••••"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || lockoutSeconds > 0}
                className="cc-btn cc-btn--primary min-h-[44px] w-full text-sm font-mono font-semibold disabled:opacity-50"
              >
                {loading
                  ? 'Authenticating...'
                  : lockoutSeconds > 0
                  ? `Locked out (${lockoutSeconds}s)`
                  : 'Sign in to admin'}
              </button>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Admin accounts are provisioned via backend database roles.
              </span>
            </div>
          </form>
        </div>
      </section>
    </HairlineGrid>
  );
};
