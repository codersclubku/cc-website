import React, { useState } from 'react';
import { NavLink, Outlet, Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, QrCode, Bell, MessageSquare, Image, LogOut, Menu, X, ArrowUpRight, GraduationCap, FolderGit2, Contact, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ErrorBoundary } from '../../components/ErrorBoundary';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReduced = useReducedMotion();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center font-mono text-sm text-[var(--text-muted)]">
        Verifying administrator credentials...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const adminNav = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Students', path: '/admin/students', icon: GraduationCap },
    { name: 'Team', path: '/admin/team', icon: Contact },
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: 'Registrations', path: '/admin/registrations', icon: Users },
    { name: 'Check-in', path: '/admin/check-in', icon: QrCode },
    { name: 'Announcements', path: '/admin/announcements', icon: Bell },
    { name: 'Projects', path: '/admin/projects', icon: FolderGit2 },
    { name: 'Gallery', path: '/admin/gallery', icon: Image },
    { name: 'Messages', path: '/admin/messages', icon: MessageSquare },
    { name: 'Feedback', path: '/admin/feedback', icon: MessageSquarePlus },
  ];

  return (
    <div data-cursor-native className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-body overflow-x-clip">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-[120] h-14 w-full bg-[var(--bg)] border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo variant="horizontal" />
          <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono font-semibold bg-[var(--surface-raised)] border border-[var(--border)] rounded-sm text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">
            ADMIN
          </span>
        </div>

        {/* Desktop Admin Nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Admin navigation">
          {adminNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs font-mono font-semibold flex items-center gap-1.5 rounded-sm transition-colors ${
                  isActive
                    ? 'bg-[var(--surface-raised)] text-[var(--text-strong)] border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--surface)]'
                }`
              }
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User & Sign Out */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline"
            title="Open public website in new tab"
          >
            <span>Public site</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono"
            aria-label="Sign out of administrator area"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center border border-[var(--border)] rounded-sm"
            aria-label={mobileNavOpen ? 'Close admin navigation' : 'Open admin navigation'}
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 bottom-0 z-[110] bg-[var(--bg)] border-b border-[var(--border)] flex flex-col p-4 overflow-y-auto">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] px-3 mb-2">
            Admin Sections
          </span>
          <div className="flex flex-col gap-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `min-h-[48px] px-4 flex items-center gap-3 text-sm font-mono font-medium rounded-sm border ${
                    isActive
                      ? 'bg-[var(--surface-raised)] border-[var(--accent)] text-[var(--text-strong)]'
                      : 'border-transparent text-[var(--text)] hover:bg-[var(--surface)]'
                  }`
                }
              >
                <item.icon className="w-4 h-4 text-[var(--accent)]" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-[var(--border)] flex flex-col gap-3">
            <Link
              to="/"
              target="_blank"
              className="text-xs font-mono text-[var(--link)] underline"
            >
              Open public site →
            </Link>
          </div>
        </div>
      )}

      {/* Admin Content Area */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="w-full"
          >
            <ErrorBoundary title="Admin Panel Error">
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
