import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, Shield, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchStudentRegistrations, cancelStudentRegistration } from '../lib/api';
import type { DbStudentRegistration } from '../lib/api';
import { DEPARTMENTS, ACADEMIC_YEARS, SEMESTERS, profileUpdateSchema, resetPasswordSchema } from '../lib/validation';
import { Alert } from '../components/Alert';
import { QrTicket } from '../components/QrTicket';
import { HairlineGrid } from '../components/HairlineGrid';

export const Account: React.FC = () => {
  const {
    user,
    profile,
    isEmailVerified,
    refreshProfile,
    resendVerificationEmail,
    updateProfile,
    updatePassword,
    withdrawNoticeConsent,
    deleteAccount,
    signOut
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'registrations' | 'profile' | 'security' | 'privacy'>('registrations');
  const [registrations, setRegistrations] = useState<DbStudentRegistration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(true);

  const [editProfile, setEditProfile] = useState({
    fullName: profile?.full_name || '',
    department: profile?.department || DEPARTMENTS[0],
    year: profile?.year || ACADEMIC_YEARS[0],
    semester: profile?.semester || SEMESTERS[0]
  });

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditProfile({
        fullName: profile.full_name,
        department: profile.department,
        year: profile.year,
        semester: profile.semester
      });
    }
  }, [profile]);

  useEffect(() => {
    async function loadRegs() {
      if (user?.id) {
        setLoadingRegs(true);
        const list = await fetchStudentRegistrations(user.id);
        setRegistrations(list);
        setLoadingRegs(false);
      }
    }
    loadRegs();
  }, [user?.id]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    setResendMessage(null);
    const res = await resendVerificationEmail();
    if (res.success) {
      setResendMessage('Verification email sent! Check your inbox.');
      setResendCooldown(60);
    } else {
      setResendMessage(res.error || 'Failed to resend email. Try again later.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileErrors({});

    const val = profileUpdateSchema.safeParse(editProfile);
    if (!val.success) {
      const errs: Record<string, string> = {};
      val.error.issues.forEach((iss) => {
        const p = iss.path[0];
        if (typeof p === 'string') errs[p] = iss.message;
      });
      setProfileErrors(errs);
      return;
    }

    setIsUpdatingProfile(true);
    const res = await updateProfile({
      full_name: editProfile.fullName,
      department: editProfile.department,
      year: editProfile.year,
      semester: editProfile.semester
    });
    setIsUpdatingProfile(false);

    if (res.success) {
      setProfileSuccess('Profile updated successfully.');
      await refreshProfile();
    } else {
      setProfileErrors({ form: res.error || 'Profile update failed.' });
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    const val = resetPasswordSchema.safeParse({ password: newPassword });
    if (!val.success) {
      setPasswordError(val.error.issues[0]?.message || 'Invalid password.');
      return;
    }

    setIsUpdatingPassword(true);
    const res = await updatePassword(newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordSuccess('Password changed successfully.');
      setNewPassword('');
    } else {
      setPasswordError(res.error || 'Password update failed.');
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!user?.id) return;
    setIsCancelling(true);
    const res = await cancelStudentRegistration(eventId, user.id);
    setIsCancelling(false);
    setCancelTargetId(null);
    if (res.success) {
      const list = await fetchStudentRegistrations(user.id);
      setRegistrations(list);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    await deleteAccount();
    setIsDeleting(false);
  };

  return (
    <HairlineGrid>
      <div data-cursor-native className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 text-left max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
              Kishkinda University Student Portal
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[var(--text-strong)] m-0">
              {profile?.full_name || 'Student Account'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
              <span>USN: <strong className="text-[var(--text-strong)]">{profile?.usn || 'N/A'}</strong></span>
              <span>•</span>
              <span>{user?.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="cc-btn cc-btn--secondary cc-btn--sm self-start sm:self-auto text-xs font-mono flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>

        <div className="p-5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-bold">
                Direct Club Member • Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text)] m-0 leading-relaxed">
              Your student account gives you direct membership in Coders Club. You can register for all technical workshops, hackathons, and sessions in 1 click without contacting coordinators.
            </p>
          </div>
          <Link
            to="/events"
            className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono font-bold uppercase tracking-wider shrink-0 self-start sm:self-auto"
          >
            Explore Events
          </Link>
        </div>

        {!isEmailVerified && (
          <div className="p-4 bg-[var(--color-warning-soft)] border border-[var(--color-warning-border)] rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[var(--color-warning-strong)] dark:text-[var(--color-warning)]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--color-warning-strong)] dark:text-[var(--color-warning)]" />
              <span>
                Email address pending verification. Verify your email to ensure you receive automatic notifications.
              </span>
            </div>
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendCooldown > 0}
              className="px-3 py-1.5 bg-[var(--color-warning-soft)] hover:opacity-80 text-[var(--color-warning-strong)] dark:text-[var(--color-warning)] border border-[var(--color-warning-border)] rounded-xs font-mono text-xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
              {resendCooldown > 0 ? `Resend link (${resendCooldown}s)` : 'Resend verification link'}
            </button>
          </div>
        )}

        {resendMessage && (
          <Alert type="info" title="Verification notification" message={resendMessage} />
        )}

        <div className="flex border-b border-[var(--border)] gap-2 overflow-x-auto" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'registrations'}
            onClick={() => setActiveTab('registrations')}
            className={`min-h-[44px] px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'registrations'
                ? 'border-[var(--accent)] text-[var(--text-strong)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-strong)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>My registrations ({registrations.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            className={`min-h-[44px] px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-[var(--accent)] text-[var(--text-strong)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-strong)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
            className={`min-h-[44px] px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-[var(--accent)] text-[var(--text-strong)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-strong)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'privacy'}
            onClick={() => setActiveTab('privacy')}
            className={`min-h-[44px] px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'border-[var(--accent)] text-[var(--text-strong)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-strong)]'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Privacy & Deletion</span>
          </button>
        </div>

        {activeTab === 'registrations' && (
          <div className="flex flex-col gap-6">
            {loadingRegs ? (
              <div className="p-8 border border-[var(--border)] rounded-sm bg-[var(--surface)] text-xs font-mono text-[var(--text-muted)] text-center">
                Loading your event passes...
              </div>
            ) : registrations.length === 0 ? (
              <div className="p-10 border border-[var(--border)] rounded-sm bg-[var(--surface)] flex flex-col items-center justify-center gap-4 text-center">
                <Calendar className="w-10 h-10 text-[var(--text-muted)]" />
                <div className="flex flex-col gap-1">
                  <h3 className="font-display font-extrabold text-lg uppercase text-[var(--text-strong)] m-0">
                    No active registrations
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] m-0">
                    You have not registered for any upcoming club events yet.
                  </p>
                </div>
                <Link to="/events" className="cc-btn cc-btn--primary min-h-[44px] text-xs font-mono font-bold mt-2">
                  Browse Upcoming Events
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {registrations.map((reg) => (
                  <div key={reg.id} className="flex flex-col gap-3">
                    <QrTicket
                      confirmationId={reg.confirmation_id}
                      eventTitle={reg.event_title || 'Club Event'}
                      startsAt={reg.starts_at}
                      venue={reg.venue}
                      studentName={profile?.full_name}
                      usn={profile?.usn}
                      status={reg.status}
                      checkedInAt={reg.checked_in_at}
                    />

                    {reg.status === 'registered' && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setCancelTargetId(reg.event_id)}
                          className="text-xs font-mono text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] hover:opacity-80 underline"
                        >
                          Cancel my registration
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {cancelTargetId && (
          <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--border)] p-6 rounded-sm flex flex-col gap-4 text-left">
              <h3 className="font-display font-extrabold text-xl uppercase tracking-tight text-[var(--text-strong)] m-0">
                Cancel Registration?
              </h3>
              <p className="text-sm text-[var(--text)] leading-relaxed m-0">
                Are you sure you want to cancel your event registration? Your ticket pass will be voided and your seat will be released to fellow students.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelTargetId(null)}
                  className="cc-btn cc-btn--secondary min-h-[44px] text-xs font-mono"
                >
                  Keep ticket
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => handleCancelRegistration(cancelTargetId)}
                  className="cc-btn cc-btn--danger min-h-[44px] text-xs font-mono font-bold"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} noValidate className="max-w-xl flex flex-col gap-5">
            {profileSuccess && (
              <Alert type="success" title="Success" message={profileSuccess} />
            )}
            {profileErrors.form && (
              <Alert type="error" title="Error" message={profileErrors.form} />
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="prof-name" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                Full Name
              </label>
              <input
                id="prof-name"
                name="fullName"
                type="text"
                value={editProfile.fullName}
                onChange={(e) => setEditProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                className="cc-input w-full min-h-[44px] px-3.5 bg-[var(--surface)] text-[var(--text-strong)] border border-[var(--border)] rounded-sm text-sm"
              />
              {profileErrors.fullName && (
                <span className="text-xs text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] font-mono">{profileErrors.fullName}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="prof-usn" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                University Seat Number (USN)
              </label>
              <input
                id="prof-usn"
                type="text"
                disabled
                value={profile?.usn || ''}
                className="cc-input w-full min-h-[44px] px-3.5 bg-[var(--surface-raised)] opacity-70 text-[var(--text-strong)] border border-[var(--border)] rounded-sm font-mono text-sm cursor-not-allowed uppercase"
              />
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                USN is verified and locked to your academic identity. Contact club coordinator to request a correction.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="prof-dept" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                Department
              </label>
              <select
                id="prof-dept"
                value={editProfile.department}
                onChange={(e) => setEditProfile((prev) => ({ ...prev, department: e.target.value }))}
                className="cc-input w-full min-h-[44px] px-3.5 bg-[var(--surface)] text-[var(--text-strong)] border border-[var(--border)] rounded-sm text-sm"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-year" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                  Academic Year
                </label>
                <select
                  id="prof-year"
                  value={editProfile.year}
                  onChange={(e) => setEditProfile((prev) => ({ ...prev, year: e.target.value }))}
                  className="cc-input w-full min-h-[44px] px-3.5 bg-[var(--surface)] text-[var(--text-strong)] border border-[var(--border)] rounded-sm text-sm"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-sem" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                  Semester
                </label>
                <select
                  id="prof-sem"
                  value={editProfile.semester}
                  onChange={(e) => setEditProfile((prev) => ({ ...prev, semester: e.target.value }))}
                  className="cc-input w-full min-h-[44px] px-3.5 bg-[var(--surface)] text-[var(--text-strong)] border border-[var(--border)] rounded-sm text-sm"
                >
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="cc-btn cc-btn--primary min-h-[44px] w-full text-xs font-mono font-bold uppercase tracking-wider"
            >
              {isUpdatingProfile ? 'Saving profile...' : 'Save Profile Changes'}
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleSavePassword} noValidate className="max-w-md flex flex-col gap-5">
            {passwordSuccess && (
              <Alert type="success" title="Success" message={passwordSuccess} />
            )}
            {passwordError && (
              <Alert type="error" title="Error" message={passwordError} />
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="change-password" className="text-xs font-mono font-semibold text-[var(--text-strong)] uppercase">
                New Password
              </label>
              <input
                id="change-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="cc-input w-full min-h-[44px] px-3.5 bg-[var(--surface)] text-[var(--text-strong)] border border-[var(--border)] rounded-sm text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword || !newPassword}
              className="cc-btn cc-btn--primary min-h-[44px] w-full text-xs font-mono font-bold uppercase tracking-wider"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        {activeTab === 'privacy' && (
          <div className="max-w-xl flex flex-col gap-6">
            <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col gap-3">
              <h3 className="font-display font-extrabold text-lg uppercase text-[var(--text-strong)] m-0">
                Consent Management
              </h3>
              <p className="text-xs text-[var(--text)] leading-relaxed m-0">
                Your data is processed in accordance with the Digital Personal Data Protection Act, 2023. You can review the notice terms anytime.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/privacy-policy" target="_blank" className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono">
                  View Privacy Notice
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await withdrawNoticeConsent();
                    alert('Consent withdrawal recorded.');
                  }}
                  className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono"
                >
                  Withdraw Consent
                </button>
              </div>
            </div>

            <div className="p-6 bg-[var(--color-danger-soft)] border border-[var(--color-danger-border)] rounded-sm flex flex-col gap-3 text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">
              <h3 className="font-display font-extrabold text-lg uppercase text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] m-0 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]" />
                Delete Student Account
              </h3>
              <p className="text-xs leading-relaxed m-0 text-[var(--text)]">
                Permanently delete your student profile, event tickets, and consent logs from Coders Club. Past event headcount is preserved as anonymous statistics. This action cannot be reversed.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="cc-btn cc-btn--danger min-h-[44px] self-start text-xs font-mono font-bold"
              >
                Request Account Deletion
              </button>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--color-danger-border)] p-6 rounded-sm flex flex-col gap-4 text-left">
              <h3 className="font-display font-extrabold text-xl uppercase tracking-tight text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] m-0">
                Confirm Account Deletion
              </h3>
              <p className="text-xs text-[var(--text)] leading-relaxed m-0">
                Please type <strong className="font-mono text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">DELETE</strong> to confirm permanent deletion of your profile and data.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="cc-input w-full min-h-[44px] px-3.5 bg-[var(--surface-raised)] text-[var(--text-strong)] border border-[var(--border)] rounded-sm font-mono text-sm"
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="cc-btn cc-btn--secondary min-h-[44px] text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  onClick={handleDeleteAccount}
                  className="cc-btn cc-btn--danger min-h-[44px] text-xs font-mono font-bold"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HairlineGrid>
  );
};
