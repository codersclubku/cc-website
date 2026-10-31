import React, { useState, useEffect } from 'react';
import { adminGetAllAnnouncements, adminSaveAnnouncement, adminDeleteAnnouncement } from '../../lib/api';
import type { DbAnnouncement } from '../../lib/api';
import { EmptyState } from '../../components/EmptyState';
import { AdminTableSkeleton } from '../../components/Skeleton';

export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<DbAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const loadAnnouncements = async () => {
    setLoading(true);
    const list = await adminGetAllAnnouncements();
    setAnnouncements(list);
    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    await adminSaveAnnouncement({
      title: title.trim(),
      body: body.trim(),
      status: 'published',
      published_at: new Date().toISOString(),
    });

    setTitle('');
    setBody('');
    loadAnnouncements();
  };

  const handleDelete = async (id: string) => {
    await adminDeleteAnnouncement(id);
    loadAnnouncements();
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="pb-3 border-b border-[var(--border)]">
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
          Broadcasts
        </span>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
          Club Announcements
        </h1>
      </div>

      {/* Create Announcement Form */}
      <form onSubmit={handleCreate} className="p-5 sm:p-6 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col gap-4 max-w-2xl">
        <h2 className="text-base font-bold font-body text-[var(--text-strong)] m-0">
          Post an Announcement
        </h2>

        <div className="cc-field">
          <label htmlFor="ann-title">Title</label>
          <input
            type="text"
            id="ann-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="cc-input"
            placeholder="e.g. Weekly Session Venue Change"
          />
        </div>

        <div className="cc-field">
          <label htmlFor="ann-body">Announcement Text</label>
          <textarea
            id="ann-body"
            rows={3}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="cc-textarea"
            placeholder="Write announcement details..."
          />
        </div>

        <button type="submit" className="cc-btn cc-btn--primary cc-btn--sm self-start">
          Publish Announcement
        </button>
      </form>

      {/* Announcements List */}
      {loading ? (
        <AdminTableSkeleton rows={3} />
      ) : announcements.length === 0 ? (
        <EmptyState
          title="No announcements published"
          description="Announcements will appear across the site once published."
          illustration="orbit"
        />
      ) : (
        <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-sm bg-[var(--surface)]">
          {announcements.map((ann) => (
            <div key={ann.id} className="p-4 sm:p-6 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-base font-bold font-body text-[var(--text-strong)]">
                  {ann.title}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Published {new Date(ann.published_at).toLocaleString('en-IN')}
                </span>
                <p className="text-sm text-[var(--text)] font-body leading-relaxed m-0 mt-2">
                  {ann.body}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(ann.id)}
                className="text-[var(--error-fg)] hover:underline text-xs font-mono p-1 shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
