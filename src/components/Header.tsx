import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, User, LogOut, Ticket, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';
import { SettingsMenu } from './SettingsMenu';
import { useAuth } from '../context/AuthContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const Header: React.FC = () => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const pathname = location.pathname;
  const isEventDetailOrRegister = pathname.startsWith('/events/') || pathname === '/register';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 8);

      if (window.innerWidth < 768) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 64) {
          setIsHeaderVisible(false);
        } else {
          setIsHeaderVisible(true);
        }
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setUserDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && userDropdownOpen) {
        setUserDropdownOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'Team', path: '/team' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleSignOut = async () => {
    await signOut();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <header
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        backgroundColor: 'rgba(20, 0, 40, 0.6)',
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
      }}
      className={`sticky top-0 z-[100] min-h-[4rem] h-[calc(4rem+env(safe-area-inset-top))] w-full border-b border-[var(--border)] transition-[transform,background-color,backdrop-filter,border-color] duration-200 backdrop-blur-xl ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
      } ${
        isScrolled ? 'shadow-1' : ''
      }`}
    >
      <div className="relative w-full h-full px-4 sm:px-8 lg:px-16 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] flex items-center justify-between">
        <div className="flex items-center gap-3 z-10">
          {isEventDetailOrRegister && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back to previous page"
              className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-sm border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Logo variant="horizontal" />
        </div>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2 absolute left-1/2 -translate-x-1/2" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isCurrentActive = link.path === '/' ? pathname === '/' : pathname.startsWith(link.path);

            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  `relative min-h-[44px] px-3.5 py-2 flex items-center text-sm font-medium font-sans no-underline rounded-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)] group ${
                    isActive
                      ? 'text-[var(--text)] font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`
                }
              >
                <span>{link.name}</span>

                {isCurrentActive && !prefersReduced && (
                  <motion.div
                    layoutId="active-tubelight-glow"
                    className="absolute bottom-1 inset-x-2 h-[2px] bg-[var(--accent)] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {!isCurrentActive && (
                  <span
                    className="absolute bottom-1 inset-x-3 h-[1px] bg-[var(--accent)] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center pointer-events-none"
                    aria-hidden="true"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 z-10">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
                aria-haspopup="menu"
                className="min-h-[44px] px-3 flex items-center gap-2 text-xs font-mono font-semibold text-[var(--text)] border border-[var(--border)] rounded-sm bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center font-bold text-xs">
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline-block max-w-[100px] truncate">{profile?.full_name?.split(' ')[0] || 'Student'}</span>
                <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-52 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm shadow-3 py-1.5 z-[150] flex flex-col text-left"
                    role="menu"
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                      <span className="text-xs font-mono text-[var(--text-muted)] block truncate">
                        Signed in as
                      </span>
                      <span className="text-xs font-mono font-bold text-[var(--text)] block truncate">
                        {user.email}
                      </span>
                    </div>

                    <Link
                      to="/account"
                      role="menuitem"
                      onClick={() => setUserDropdownOpen(false)}
                      className="px-3 py-2 text-xs font-mono text-[var(--text)] hover:bg-[var(--surface-2)] flex items-center gap-2 no-underline"
                    >
                      <User className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Account Settings</span>
                    </Link>

                    <Link
                      to="/account"
                      role="menuitem"
                      onClick={() => setUserDropdownOpen(false)}
                      className="px-3 py-2 text-xs font-mono text-[var(--text)] hover:bg-[var(--surface-2)] flex items-center gap-2 no-underline"
                    >
                      <Ticket className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>My Registrations</span>
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-xs font-mono text-[var(--danger-text)] hover:bg-[var(--danger-bg)] flex items-center gap-2 border-t border-[var(--border)] mt-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/signin"
              data-magnetic
              className="min-h-[44px] px-4 hidden sm:flex items-center justify-center font-mono font-bold text-xs uppercase rounded-sm bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all no-underline"
            >
              Sign in
            </Link>
          )}

          <SettingsMenu />
        </div>
      </div>
    </header>
  );
};
