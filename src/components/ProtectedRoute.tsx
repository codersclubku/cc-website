import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, isProfileComplete } from '../context/AuthContext';
import { Loader } from './Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStudentPortalAccess?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireStudentPortalAccess = false
}) => {
  const { user, profile, isAdmin, consentState, profileLoadError, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8">
        <Loader variant="snake" delayMs={100} />
        <span className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
          Verifying security credentials...
        </span>
      </div>
    );
  }

  // 1. Authentication Gate
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?returnUrl=${returnUrl}`} replace />;
  }

  // 2. Admin Portal Route Gate
  if (requireAdmin) {
    if (!isAdmin) {
      return <Navigate to="/admin/login" replace />;
    }
    return <>{children}</>;
  }

  // 3. Admin User Accessing Student Portal without a Student Profile
  if (isAdmin && !profile) {
    return <Navigate to="/admin" replace />;
  }

  // 4. Student Portal Route Gate (requires complete profile + active consent)
  if (requireStudentPortalAccess) {
    // If backend query failed with an unexpected error, render error screen rather than redirecting
    if (profileLoadError || consentState === 'ERROR') {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-lg font-bold text-[var(--text-strong)] font-display uppercase tracking-tight">
            Unable to Verify Student Account
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md font-sans leading-relaxed">
            {profileLoadError || 'A network error occurred while verifying your student account and privacy consent. Please check your connection and try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="cc-btn cc-btn--primary font-mono text-xs uppercase px-4 py-2 mt-2"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    const hasProfile = isProfileComplete(profile);
    const hasConsent = consentState === 'ACTIVE';

    if (!hasProfile || !hasConsent) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
};
