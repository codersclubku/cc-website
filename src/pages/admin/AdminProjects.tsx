import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, ExternalLink, Check, X } from 'lucide-react';
import { adminGetAllProjects, adminSaveProject, adminDeleteProject } from '../../lib/api';
import type { DbProject } from '../../lib/api';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { AdminTableSkeleton } from '../../components/Skeleton';
import { Alert } from '../../components/Alert';
import { GithubIcon } from '../../components/SocialIcons';

export const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbProject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    slug: '',
    title: '',
    summary: '',
    status: 'In progress' as DbProject['status'],
    tech_stack: '',
    repo_url: '',
    demo_url: '',
    how_to_contribute: '',
    published: true
  });

  const loadProjects = async () => {
    setLoading(true);
    const list = await adminGetAllProjects();
    setProjects(list);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openNewModal = () => {
    setFormData({
      id: '',
      slug: '',
      title: '',
      summary: '',
      status: 'In progress',
      tech_stack: 'React, TypeScript, Tailwind CSS',
      repo_url: 'https://github.com/codersclub-ku/',
      demo_url: '',
      how_to_contribute: '',
      published: true
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: DbProject) => {
    setFormData({
      id: p.id,
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      status: p.status,
      tech_stack: p.tech_stack.join(', '),
      repo_url: p.repo_url,
      demo_url: p.demo_url || '',
      how_to_contribute: p.how_to_contribute || '',
      published: p.published
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim() || !formData.summary.trim() || !formData.repo_url.trim()) {
      setError('Title, slug, summary, and repo URL are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const techArray = formData.tech_stack
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await adminSaveProject({
      id: formData.id || undefined,
      slug: formData.slug.trim().toLowerCase(),
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      status: formData.status,
      tech_stack: techArray,
      repo_url: formData.repo_url.trim(),
      demo_url: formData.demo_url.trim() || null,
      how_to_contribute: formData.how_to_contribute.trim() || null,
      published: formData.published
    });

    setIsSaving(false);
    if (res.success) {
      setSuccess(formData.id ? 'Project updated successfully.' : 'Project created successfully.');
      setModalOpen(false);
      loadProjects();
    } else {
      setError(res.message || 'Failed to save project.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const ok = await adminDeleteProject(deleteTarget.id);
    setIsDeleting(false);
    if (ok) {
      setSuccess('Project deleted.');
      setDeleteTarget(null);
      loadProjects();
    } else {
      setError('Failed to delete project.');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
            Engineering Catalog
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Open Source Projects
          </h1>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {success && (
        <Alert variant="success" onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <AdminTableSkeleton />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects configured"
          description="Create your first open-source project to display in the student catalog."
          actionLabel="Create Project"
          onAction={openNewModal}
        />
      ) : (
        <div className="overflow-x-auto border border-[var(--border)] rounded-sm bg-[var(--surface-1)]">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-strong)] uppercase">
                <th className="py-3 px-4">Title & Slug</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tech Stack</th>
                <th className="py-3 px-4">Links</th>
                <th className="py-3 px-4">Published</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--surface-sunken)] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-sans font-bold text-sm text-[var(--text-strong)]">
                      {p.title}
                    </div>
                    <div className="text-[var(--text-muted)] text-[11px]">
                      /{p.slug}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={p.status === 'Live' ? 'confirmed' : 'in-progress'} label={p.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {p.tech_stack.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-[var(--bg)] border border-[var(--border)] rounded-sm text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="text-[var(--link)] hover:underline flex items-center gap-1">
                        <GithubIcon className="w-3.5 h-3.5" />
                        <span>Repo</span>
                      </a>
                      {p.demo_url && (
                        <a href={p.demo_url} target="_blank" rel="noopener noreferrer" className="text-[var(--link)] hover:underline flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Demo</span>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {p.published ? (
                      <span className="text-[var(--success-strong)] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Published</span>
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)] flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        <span>Draft</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-raised)] rounded-sm"
                        title="Edit project"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 text-[var(--danger-text)] hover:bg-[var(--danger-surface)] rounded-sm"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-2 max-w-xl w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text-strong)] m-0">
                {formData.id ? 'Edit Project' : 'New Open Source Project'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[var(--text-muted)] uppercase">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-sm text-[var(--text-strong)] font-sans text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[var(--text-muted)] uppercase">Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-sm text-[var(--text-strong)]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[var(--text-muted)] uppercase">Summary *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-sm text-[var(--text-strong)] font-sans text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[var(--text-muted)] uppercase">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-sm text-[var(--text-strong)]"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In progress">In progress</option>
                    <option value="Live">Live</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[var(--text-muted)] uppercase">Tech Stack (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tech_stack}
                    onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                    className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-sm text-[var(--text-strong)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[var(--text-muted)] uppercase">GitHub Repo URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.repo_url}
                    onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
                    className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-sm text-[var(--text-strong)]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[var(--text-muted)] uppercase">Demo URL (optional)</label>
                  <input
                    type="url"
                    value={formData.demo_url}
                    onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                    className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-sm text-[var(--text-strong)]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[var(--text-muted)] uppercase">How to Contribute (optional)</label>
                <textarea
                  rows={2}
                  value={formData.how_to_contribute}
                  onChange={(e) => setFormData({ ...formData, how_to_contribute: e.target.value })}
                  className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-sm text-[var(--text-strong)] font-sans text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="proj-published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-4 h-4 accent-[var(--accent)]"
                />
                <label htmlFor="proj-published" className="text-xs text-[var(--text-strong)] cursor-pointer">
                  Publish project in public catalog
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="cc-btn cc-btn--secondary cc-btn--sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="cc-btn cc-btn--primary cc-btn--sm"
                >
                  {isSaving ? 'Saving...' : formData.id ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-2 max-w-md w-full p-6 flex flex-col gap-4 text-left">
            <h2 className="text-lg font-bold text-[var(--danger-text)] m-0">
              Delete Project
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono leading-relaxed m-0">
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="cc-btn cc-btn--secondary cc-btn--sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="cc-btn cc-btn--danger cc-btn--sm"
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
