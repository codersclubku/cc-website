import React, { useState, useEffect } from 'react';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { adminGetAllEvents, adminSaveEvent, adminDeleteEvent } from '../../lib/api';
import type { DbEvent } from '../../lib/api';
import { Badge } from '../../components/Badge';
import { AdminTableSkeleton } from '../../components/Skeleton';
import { Alert } from '../../components/Alert';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<DbEvent> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadEvents = async () => {
    const list = await adminGetAllEvents();
    setEvents(list);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    adminGetAllEvents().then((list) => {
      if (active) {
        setEvents(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleOpenCreate = () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    const dayAfter = new Date(Date.now() + 172800000).toISOString().slice(0, 16);
    setEditingEvent({
      title: '',
      slug: '',
      type: 'Workshop',
      short_description: '',
      description: '',
      venue: 'Lab 304, Department of CSE, Kishkinda University',
      eligibility: 'All Kishkinda University students',
      coordinator_name: 'T Vittala',
      starts_at: tomorrow,
      ends_at: dayAfter,
      registration_deadline: tomorrow,
      capacity: 60,
      status: 'draft',
      agenda: [],
      prerequisites: [],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (ev: DbEvent) => {
    setEditingEvent({
      ...ev,
      starts_at: ev.starts_at ? new Date(ev.starts_at).toISOString().slice(0, 16) : '',
      ends_at: ev.ends_at ? new Date(ev.ends_at).toISOString().slice(0, 16) : '',
      registration_deadline: ev.registration_deadline ? new Date(ev.registration_deadline).toISOString().slice(0, 16) : '',
      registration_opens_at: ev.registration_opens_at ? new Date(ev.registration_opens_at).toISOString().slice(0, 16) : '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.title?.trim()) {
      setErrorMsg('Event title is required.');
      return;
    }

    const slug = editingEvent.slug?.trim() || editingEvent.title.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const res = await adminSaveEvent({
      ...editingEvent,
      slug,
      starts_at: new Date(editingEvent.starts_at || Date.now()).toISOString(),
      ends_at: new Date(editingEvent.ends_at || Date.now()).toISOString(),
      registration_deadline: new Date(editingEvent.registration_deadline || Date.now()).toISOString(),
      registration_opens_at: editingEvent.registration_opens_at ? new Date(editingEvent.registration_opens_at).toISOString() : null,
    });

    if (!res.success) {
      setErrorMsg(res.message || 'Failed to save event.');
      return;
    }

    setModalOpen(false);
    setEditingEvent(null);
    loadEvents();
  };

  const handleDelete = async (id: string) => {
    const success = await adminDeleteEvent(id);
    if (success) {
      setConfirmDeleteId(null);
      loadEvents();
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
            Management
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Events Management
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Event</span>
        </button>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={5} />
      ) : events.length === 0 ? (
        <div className="p-8 border border-[var(--border)] rounded-sm bg-[var(--surface)] text-left flex flex-col gap-3">
          <div className="text-sm font-semibold text-[var(--text-strong)]">No events found</div>
          <div className="text-xs text-[var(--text-muted)]">
            Create an event to allow university students to sign up and participate.
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="cc-btn cc-btn--primary cc-btn--sm self-start"
          >
            Create first event
          </button>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-sm bg-[var(--surface)] overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--surface-raised)] border-b border-[var(--border-strong)] text-[var(--text-strong)] font-semibold">
                <tr>
                  <th className="p-3">Title & Slug</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Event Date</th>
                  <th className="p-3">Deadline</th>
                  <th className="p-3 text-right">Registrations</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-[var(--text-strong)] font-body text-sm">
                        {ev.title}
                      </div>
                      <div className="text-[var(--text-muted)] font-mono text-[11px]">{ev.slug}</div>
                    </td>
                    <td className="p-3 text-[var(--text-muted)]">{ev.type}</td>
                    <td className="p-3">
                      <Badge
                        variant={ev.status === 'published' ? 'open' : ev.status === 'closed' ? 'closed' : 'neutral'}
                        label={ev.status}
                      />
                    </td>
                    <td className="p-3 text-[var(--text-muted)]">
                      {new Date(ev.starts_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3 text-[var(--text-muted)]">
                      {new Date(ev.registration_deadline).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3 text-right font-bold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">
                      {ev.registrations_count || 0}
                      {ev.capacity ? ` / ${ev.capacity}` : ''}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ev)}
                          className="px-2 py-1 text-xs font-mono border border-[var(--border)] rounded-sm hover:bg-[var(--surface-raised)]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(ev.id)}
                          className="px-2 py-1 text-xs font-mono text-[var(--error-fg)] border border-[var(--border)] rounded-sm hover:bg-[var(--error-bg)]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (< 1024px) */}
          <div className="lg:hidden divide-y divide-[var(--border)]">
            {events.map((ev) => (
              <div key={ev.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={ev.status === 'published' ? 'open' : ev.status === 'closed' ? 'closed' : 'neutral'}
                    label={ev.status}
                  />
                  <span className="font-mono text-xs font-bold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">
                    {ev.registrations_count || 0} registrations
                  </span>
                </div>

                <div className="text-base font-bold text-[var(--text-strong)] font-body">
                  {ev.title}
                </div>

                <div className="text-xs font-mono text-[var(--text-muted)]">
                  {new Date(ev.starts_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })} • {ev.venue}
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(ev)}
                    className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono"
                  >
                    Edit Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(ev.id)}
                    className="px-3 py-1.5 text-xs font-mono text-[var(--error-fg)] hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {modalOpen && editingEvent && (
        <div className="fixed inset-0 z-[250] bg-[var(--scrim)] flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] bg-[var(--bg)] border-2 border-[var(--border-strong)] rounded-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-raised)]">
              <h2 className="text-base font-bold font-body text-[var(--text-strong)] m-0">
                {editingEvent.id ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex flex-col gap-4 text-xs font-mono">
              {errorMsg && (
                <Alert type="error" title="Validation error" message={errorMsg} />
              )}

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[var(--text-strong)]">Event Title *</label>
                <input
                  type="text"
                  required
                  value={editingEvent.title || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="cc-input font-body text-sm"
                  placeholder="e.g. Git Foundations & First Pull Request"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[var(--text-strong)]">URL Slug</label>
                  <input
                    type="text"
                    value={editingEvent.slug || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, slug: e.target.value })}
                    className="cc-input"
                    placeholder="git-foundations"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[var(--text-strong)]">Status</label>
                  <select
                    value={editingEvent.status || 'draft'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as any })}
                    className="cc-select"
                  >
                    <option value="draft">Draft (hidden from public)</option>
                    <option value="published">Published (live for registrations)</option>
                    <option value="closed">Closed (archived)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[var(--text-strong)]">Event Type</label>
                  <input
                    type="text"
                    value={editingEvent.type || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value })}
                    className="cc-input"
                    placeholder="Workshop / Hackathon"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[var(--text-strong)]">Capacity (seats limit)</label>
                  <input
                    type="number"
                    value={editingEvent.capacity || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, capacity: e.target.value ? parseInt(e.target.value) : null })}
                    className="cc-input"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[var(--text-strong)]">Venue Location</label>
                <input
                  type="text"
                  value={editingEvent.venue || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                  className="cc-input font-body text-sm"
                  placeholder="e.g. Lab 304, CSE Department"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[var(--text-strong)]">Event Starts At</label>
                  <input
                    type="datetime-local"
                    value={editingEvent.starts_at || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, starts_at: e.target.value })}
                    className="cc-input font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[var(--text-strong)]">Event Ends At</label>
                  <input
                    type="datetime-local"
                    value={editingEvent.ends_at || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, ends_at: e.target.value })}
                    className="cc-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[var(--text-strong)]">Registration Opens At</label>
                  <input
                    type="datetime-local"
                    value={editingEvent.registration_opens_at || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, registration_opens_at: e.target.value })}
                    className="cc-input font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[var(--text-strong)]">Registration Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editingEvent.registration_deadline || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, registration_deadline: e.target.value })}
                    className="cc-input font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[var(--text-strong)]">Short Summary</label>
                <input
                  type="text"
                  value={editingEvent.short_description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, short_description: e.target.value })}
                  className="cc-input font-body text-sm"
                  placeholder="One sentence description"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[var(--text-strong)]">Full Description</label>
                <textarea
                  rows={4}
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="cc-textarea font-body text-sm"
                  placeholder="Full agenda and details..."
                />
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="cc-btn cc-btn--secondary cc-btn--sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cc-btn cc-btn--primary cc-btn--sm font-bold"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG (Destructive action confirmation) */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] bg-[var(--scrim)] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg)] border-2 border-[var(--error-fg)] rounded-sm p-6 flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3 text-[var(--danger-text)]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold font-sans m-0">Delete this event?</h3>
            </div>
            <p className="text-sm text-[var(--text)] m-0 leading-relaxed">
              Are you sure you want to delete this event? All associated student registrations and check-in records will be permanently removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="cc-btn cc-btn--secondary cc-btn--sm font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                className="cc-btn cc-btn--danger cc-btn--sm font-mono font-bold"
              >
                Delete event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
