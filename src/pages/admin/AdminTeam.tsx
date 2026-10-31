import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Mail, X, AlertTriangle, UploadCloud } from 'lucide-react';
import { adminGetTeamMembers, adminSaveTeamMember, adminDeleteTeamMember } from '../../lib/api';
import type { DbTeamMember } from '../../lib/api';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { AdminTableSkeleton } from '../../components/Skeleton';
import { Alert } from '../../components/Alert';
import { GithubIcon, LinkedinIcon } from '../../components/SocialIcons';

export const AdminTeam: React.FC = () => {
  const [members, setMembers] = useState<DbTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbTeamMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    department: '',
    year: '',
    group: 'Core Team',
    email: '',
    linkedin: '',
    github: '',
    display_order: 100
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    const list = await adminGetTeamMembers();
    setMembers(list);
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const openNewModal = () => {
    setFormData({
      id: '',
      name: '',
      role: '',
      department: '',
      year: '',
      group: 'Core Team',
      email: '',
      linkedin: '',
      github: '',
      display_order: 100
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setError(null);
    setModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.');
      return;
    }

    setError(null);
    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Name is required.');
      return;
    }

    if (!formData.role.trim()) {
      setError('Role is required.');
      return;
    }

    if (!formData.department.trim()) {
      setError('Department is required.');
      return;
    }

    if (!formData.year.trim()) {
      setError('Year / Designation is required.');
      return;
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const res = await adminSaveTeamMember(
      {
        id: formData.id || undefined,
        name: formData.name.trim(),
        role: formData.role.trim(),
        department: formData.department.trim(),
        year: formData.year.trim(),
        group: formData.group.trim(),
        email: formData.email.trim() || null,
        linkedin: formData.linkedin.trim() || null,
        github: formData.github.trim() || null,
        display_order: Number(formData.display_order) || 100,
        photo: photoPreview && !photoFile ? photoPreview : null
      },
      photoFile || undefined
    );

    setIsSaving(false);

    if (res.success) {
      setSuccess(`Team member "${formData.name.trim()}" saved successfully.`);
      setModalOpen(false);
      loadMembers();
    } else {
      setError(res.message || 'Failed to save team member.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    const ok = await adminDeleteTeamMember(deleteTarget.id);
    setIsDeleting(false);

    if (ok) {
      setSuccess(`Removed team member "${deleteTarget.name}".`);
      setDeleteTarget(null);
      loadMembers();
    } else {
      setError('Failed to delete team member. Server permissions or connection error.');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
            Directory
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Team Management
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 m-0">
            Add or remove student coordinators, leads, and faculty mentors. Changes reflect live on the public team page.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Team Member</span>
        </button>
      </div>

      {error && (
        <Alert variant="danger" title="Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="info" title="Success" onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {loading ? (
        <AdminTableSkeleton rows={6} />
      ) : members.length === 0 ? (
        <EmptyState
          title="No team members yet"
          description="Click 'Add Team Member' above to create the first member in the club directory."
        />
      ) : (
        <div className="overflow-x-auto border border-[var(--border)] rounded-md bg-[var(--surface)] shadow-1">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role & Group</th>
                <th className="py-3 px-4 hidden md:table-cell">Department / Year</th>
                <th className="py-3 px-4 hidden lg:table-cell">Contact & Links</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-body">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--surface-raised)]/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm overflow-hidden border border-[var(--border)] bg-[var(--surface-raised)] shrink-0 flex items-center justify-center font-mono text-xs font-bold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">
                        {m.photo ? (
                          <img
                            src={m.photo}
                            alt={m.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          m.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[var(--text-strong)] truncate">
                          {m.name}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">
                          Order: {m.display_order}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="font-medium text-[var(--text)]">
                        {m.role}
                      </span>
                      <Badge variant="neutral" label={m.group} />
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-[var(--text-muted)]">
                    <div className="flex flex-col">
                      <span>{m.department || '—'}</span>
                      <span className="text-xs font-mono text-[var(--text-subtle)]">{m.year || ''}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      {m.email && (
                        <a
                          href={`mailto:${m.email}`}
                          className="hover:text-[var(--accent)] transition-colors"
                          title={m.email}
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {m.github && (
                        <a
                          href={m.github}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-[var(--accent)] transition-colors"
                          title="GitHub Profile"
                        >
                          <GithubIcon className="w-4 h-4" />
                        </a>
                      )}
                      {m.linkedin && (
                        <a
                          href={m.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-[var(--accent)] transition-colors"
                          title="LinkedIn Profile"
                        >
                          <LinkedinIcon className="w-4 h-4" />
                        </a>
                      )}
                      {!m.email && !m.github && !m.linkedin && (
                        <span className="font-mono text-xs text-[var(--text-subtle)]">None</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(m)}
                      className="p-1.5 rounded-sm border border-[var(--border)] hover:border-[var(--color-danger-border)] hover:bg-[var(--color-danger-soft)] text-[var(--text-muted)] hover:text-[var(--color-danger-strong)] dark:hover:text-[var(--color-danger)] transition-colors"
                      title="Remove Member"
                      aria-label={`Remove ${m.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-md shadow-2 max-w-xl w-full p-6 text-left my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h2 className="text-lg font-bold text-[var(--text-strong)] m-0">
                Add Team Member
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-strong)] rounded-xs"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Full Name <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Aditi Sharma"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-sm px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] outline-hidden font-body"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Role <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. President / AI Lead"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-sm px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] outline-hidden font-body"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Department <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Computer Science & Eng."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-sm px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] outline-hidden font-body"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Year / Designation <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g. 3rd Year or Assistant Professor"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-sm px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] outline-hidden font-body"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Group Section
                  </label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-sm px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] outline-hidden font-body"
                  >
                    <option value="Core Team">Core Team</option>
                    <option value="Faculty coordinators">Faculty Coordinators</option>
                    <option value="Mentors">Mentors</option>
                    <option value="Technical Leads">Technical Leads</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 100 })}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-sm px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] outline-hidden font-body"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  Photo Upload (JPEG, PNG, WebP &le; 5MB)
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-sm bg-[var(--surface)] cursor-pointer text-xs font-mono text-[var(--text)] transition-colors">
                    <UploadCloud className="w-4 h-4 text-[var(--accent)]" />
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  {photoFile && (
                    <span className="text-xs font-mono text-[var(--text-muted)] truncate max-w-xs">
                      {photoFile.name} ({(photoFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                {photoPreview && (
                  <div className="mt-2 w-16 h-16 rounded-sm border border-[var(--border)] overflow-hidden bg-black/20">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--border)]">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@kishkindauniversity.edu.in"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-sm px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] outline-hidden font-body"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    LinkedIn (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-sm px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] outline-hidden font-body"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    GitHub (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-sm px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] outline-hidden font-body"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)] mt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono"
                >
                  {isSaving ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-md shadow-2 max-w-md w-full p-6 text-left">
            <div className="flex items-center gap-3 text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] mb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-[var(--text-strong)] m-0">
                Confirm Member Removal
              </h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Are you sure you want to remove <strong className="text-[var(--text)]">{deleteTarget.name}</strong> ({deleteTarget.role})? This will permanently delete their directory entry and stored photo.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="cc-btn cc-btn--danger cc-btn--sm text-xs font-mono font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
