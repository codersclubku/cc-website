import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Users, MoreHorizontal, X, Sun, Moon, Laptop, Info, Image, Mail, LogOut, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const BottomTabBar: React.FC = () => {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const { user, profile, signOut } = useAuth();
  const prefersReduced = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);

  const pathname = location.pathname;
  const isHiddenRoute = pathname.startsWith('/events/') || pathname === '/register' || pathname.startsWith('/admin');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && moreOpen) {
        setMoreOpen(false);
        moreBtnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moreOpen]);

  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        sheetRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [moreOpen]);

  if (isHiddenRoute) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    setMoreOpen(false);
    navigate('/');
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home, end: true },
    { name: 'Events', path: '/events', icon: Calendar, end: false },
    { name: 'Team', path: '/team', icon: Users, end: false },
    { name: 'Gallery', path: '/gallery', icon: Image, end: false },
  ];

  return (
    <>
      <nav
        aria-label="Mobile primary navigation"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--surface-1) 60%, transparent)',
          WebkitBackdropFilter: 'blur(24px)',
          backdropFilter: 'blur(24px)',
        }}
        className="md:hidden fixed inset-x-0 bottom-0 z-[140] backdrop-blur-xl border-t border-[var(--border)] shadow-4 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {navItems.map((item) => {
            const isActive = item.end ? pathname === item.path : pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                aria-current={isActive ? 'page' : undefined}
                className={({ isActive: matchActive }) =>
                  `flex flex-col items-center justify-center min-h-[44px] py-1 text-center transition-colors no-underline select-none ${
                    matchActive || isActive
                      ? 'text-[var(--primary)] dark:text-[var(--accent-on-dark)] font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mb-0.5" aria-hidden="true" />
                <span className="text-xs font-mono leading-none tracking-tight">
                  {item.name}
                </span>
              </NavLink>
            );
          })}

          <button
            ref={moreBtnRef}
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="Open more menu"
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 text-center transition-colors cursor-pointer no-underline select-none ${
              moreOpen || ['/about', '/gallery', '/contact', '/feedback', '/account'].some((p) => pathname.startsWith(p))
                ? 'text-[var(--primary)] dark:text-[var(--accent-on-dark)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" aria-hidden="true" />
            <span className="text-xs font-mono leading-none tracking-tight">
              More
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <div className="md:hidden fixed inset-0 z-[200] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-xs"
              aria-hidden="true"
            />

            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-more-title"
              tabIndex={-1}
              initial={prefersReduced ? { opacity: 0 } : { y: '100%' }}
              animate={{ y: 0, opacity: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { y: '100%' }}
              transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
              className="relative w-full bg-[var(--surface-1)] border-t border-[var(--border-strong)] rounded-t-xl p-5 shadow-5 max-h-[85vh] overflow-y-auto focus:outline-none pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            >
              <div className="w-12 h-1 bg-[var(--border-strong)] rounded-full mx-auto mb-4" aria-hidden="true" />

              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <h2 id="mobile-more-title" className="text-base font-bold font-sans text-[var(--text)] m-0">
                  More destinations
                </h2>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1 py-3 border-b border-[var(--border)]">
                <Link
                  to="/about"
                  onClick={() => setMoreOpen(false)}
                  className="min-h-[44px] px-3 flex items-center gap-3 rounded-sm text-sm font-sans font-medium text-[var(--text)] hover:bg-[var(--surface-2)] no-underline"
                >
                  <Info className="w-4 h-4 text-[var(--accent)]" />
                  <span>About</span>
                </Link>
                <Link
                  to="/gallery"
                  onClick={() => setMoreOpen(false)}
                  className="min-h-[44px] px-3 flex items-center gap-3 rounded-sm text-sm font-sans font-medium text-[var(--text)] hover:bg-[var(--surface-2)] no-underline"
                >
                  <Image className="w-4 h-4 text-[var(--accent)]" />
                  <span>Gallery</span>
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMoreOpen(false)}
                  className="min-h-[44px] px-3 flex items-center gap-3 rounded-sm text-sm font-sans font-medium text-[var(--text)] hover:bg-[var(--surface-2)] no-underline"
                >
                  <Mail className="w-4 h-4 text-[var(--accent)]" />
                  <span>Contact</span>
                </Link>
                <Link
                  to="/feedback"
                  onClick={() => setMoreOpen(false)}
                  className="min-h-[44px] px-3 flex items-center gap-3 rounded-sm text-sm font-sans font-medium text-[var(--text)] hover:bg-[var(--surface-2)] no-underline"
                >
                  <MessageSquarePlus className="w-4 h-4 text-[var(--accent)]" />
                  <span>Feedback</span>
                </Link>
              </div>

              <div className="py-4 border-b border-[var(--border)] flex flex-col gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Appearance
                </span>
                <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm" role="radiogroup" aria-label="Theme selection">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={mode === 'light'}
                    onClick={() => setMode('light')}
                    className={`min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-mono font-medium rounded-xs transition-colors cursor-pointer ${
                      mode === 'light'
                        ? 'bg-[var(--surface-1)] text-[var(--primary)] dark:text-[var(--accent-on-dark)] shadow-1 font-semibold'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={mode === 'dark'}
                    onClick={() => setMode('dark')}
                    className={`min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-mono font-medium rounded-xs transition-colors cursor-pointer ${
                      mode === 'dark'
                        ? 'bg-[var(--surface-1)] text-[var(--primary)] dark:text-[var(--accent-on-dark)] shadow-1 font-semibold'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={mode === 'system'}
                    onClick={() => setMode('system')}
                    className={`min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-mono font-medium rounded-xs transition-colors cursor-pointer ${
                      mode === 'system'
                        ? 'bg-[var(--surface-1)] text-[var(--primary)] dark:text-[var(--accent-on-dark)] shadow-1 font-semibold'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>System</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-[var(--text-muted)] uppercase">Signed in as</span>
                        <span className="text-sm font-semibold text-[var(--text)]">
                          {profile?.full_name || 'Student Member'}
                        </span>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setMoreOpen(false)}
                        className="cc-btn cc-btn--secondary min-h-[44px] text-xs font-mono no-underline"
                      >
                        Account
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="min-h-[44px] px-3 flex items-center justify-center gap-2 rounded-sm border border-[var(--border)] text-xs font-mono font-semibold text-[var(--danger-text)] hover:bg-[var(--danger-bg)] cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/signin"
                      onClick={() => setMoreOpen(false)}
                      className="cc-btn cc-btn--primary min-h-[44px] text-xs font-mono font-bold uppercase no-underline"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMoreOpen(false)}
                      className="cc-btn cc-btn--secondary min-h-[44px] text-xs font-mono font-bold uppercase no-underline"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
