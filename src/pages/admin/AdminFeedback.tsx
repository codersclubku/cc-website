import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  ExternalLink,
  Mail,
  Save,
  CheckCircle2,
  Clock,
  Inbox,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { FeedbackTypeBadge, FeedbackStatusBadge } from '../../components/feedback/FeedbackBadge';
import { EmptyState } from '../../components/EmptyState';
import { AdminTableSkeleton } from '../../components/Skeleton';
import {
  getFeedbackList,
  updateFeedbackItem,
  isAuthorizedFeedbackAdmin
} from '../../lib/feedbackApi';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type {
  FeedbackRecord,
  FeedbackStatus
} from '../../types/feedback';

export const AdminFeedback: React.FC = () => {
  const { user } = useAuth();
  const prefersReduced = useReducedMotion();

  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FeedbackRecord | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [editStatus, setEditStatus] = useState<FeedbackStatus>('new');
  const [editNote, setEditNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const isAuthorized = isAuthorizedFeedbackAdmin(user?.email);

  const loadData = async () => {
    setLoading(true);
    const data = await getFeedbackList();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDetail = (item: FeedbackRecord) => {
    setSelectedItem(item);
    setEditStatus(item.status);
    setEditNote(item.internalNote || '');
    setUpdateSuccess(false);
  };

  const closeDetail = () => {
    setSelectedItem(null);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setIsUpdating(true);
    setUpdateSuccess(false);

    const res = await updateFeedbackItem(selectedItem.id, {
      status: editStatus,
      internalNote: editNote.trim() || null
    });

    if (res.success && res.record) {
      setSelectedItem(res.record);
      setItems((prev) =>
        prev.map((it) => (it.id === res.record!.id ? res.record! : it))
      );
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    }
    setIsUpdating(false);
  };

  const counts = useMemo(() => {
    return {
      newCount: items.filter((i) => i.status === 'new').length,
      inReviewCount: items.filter((i) => i.status === 'in-review').length,
      resolvedCount: items.filter((i) => i.status === 'resolved').length,
      total: items.length
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesRef = item.referenceId.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesEmail = (item.email || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesRef && !matchesDesc && !matchesName && !matchesEmail) {
          return false;
        }
      }
      return true;
    });
  }, [items, typeFilter, statusFilter, searchQuery]);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm text-center">
        <AlertTriangle className="w-12 h-12 text-[var(--color-warning)] mb-3" />
        <h2 className="text-xl font-bold font-sans text-[var(--text-strong)] m-0">
          Access Restricted
        </h2>
        <p className="text-sm font-body text-[var(--text-muted)] max-w-md mt-2">
          The feedback review portal is reserved exclusively for the President, Vice President, and Faculty Coordinators.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
            Quality & Operations
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Feedback & Bug Reports
          </h1>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="cc-btn cc-btn--secondary cc-btn--sm self-start sm:self-center text-xs font-mono"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm flex flex-col gap-1">
          <span className="text-xs font-mono uppercase text-[var(--text-muted)] tracking-wider">
            Total Reports
          </span>
          <span className="text-2xl font-bold font-sans text-[var(--text-strong)]">
            {counts.total}
          </span>
        </div>

        <div className="p-4 bg-[var(--surface-1)] border border-[var(--color-info-border)] rounded-sm flex flex-col gap-1">
          <span className="text-xs font-mono uppercase text-[var(--color-info-strong)] dark:text-[var(--color-info)] tracking-wider flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5" />
            <span>New</span>
          </span>
          <span className="text-2xl font-bold font-sans text-[var(--color-info-strong)] dark:text-[var(--color-info)]">
            {counts.newCount}
          </span>
        </div>

        <div className="p-4 bg-[var(--surface-1)] border border-[var(--color-warning-border)] rounded-sm flex flex-col gap-1">
          <span className="text-xs font-mono uppercase text-[var(--color-warning-strong)] dark:text-[var(--color-warning)] tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>In Review</span>
          </span>
          <span className="text-2xl font-bold font-sans text-[var(--color-warning-strong)] dark:text-[var(--color-warning)]">
            {counts.inReviewCount}
          </span>
        </div>

        <div className="p-4 bg-[var(--surface-1)] border border-[var(--color-success-border)] rounded-sm flex flex-col gap-1">
          <span className="text-xs font-mono uppercase text-[var(--color-success-strong)] dark:text-[var(--color-success)] tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved</span>
          </span>
          <span className="text-2xl font-bold font-sans text-[var(--color-success-strong)] dark:text-[var(--color-success)]">
            {counts.resolvedCount}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, ref ID, description, or submitter..."
            className="w-full min-h-[44px] pl-10 pr-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm text-sm font-body text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-[var(--text-muted)] mr-1">Type:</span>
            {['all', 'bug', 'suggestion', 'issue', 'other'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`min-h-[36px] px-2.5 py-1 text-xs font-mono rounded-xs border capitalize transition-colors cursor-pointer ${
                  typeFilter === t
                    ? 'bg-[var(--surface-3)] text-[var(--text-strong)] font-bold border-[var(--border-strong)]'
                    : 'bg-[var(--surface-1)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-[var(--text-muted)] mr-1">Status:</span>
            {['all', 'new', 'in-review', 'resolved', 'rejected'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`min-h-[36px] px-2.5 py-1 text-xs font-mono rounded-xs border capitalize transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'bg-[var(--surface-3)] text-[var(--text-strong)] font-bold border-[var(--border-strong)]'
                    : 'bg-[var(--surface-1)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={4} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No feedback reports found"
          description={
            searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try modifying your filter parameters or search terms.'
              : 'Feedback submitted by students and members will appear here.'
          }
          illustration="orbit"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => openDetail(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openDetail(item);
                }
              }}
              className="p-4 sm:p-5 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-sm transition-all cursor-pointer shadow-1 flex flex-col gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FeedbackTypeBadge type={item.type} />
                  <FeedbackStatusBadge status={item.status} />
                  <span className="text-xs font-mono text-[var(--text-subtle)]">
                    {item.referenceId}
                  </span>
                </div>

                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold font-sans text-[var(--text-strong)] m-0">
                  {item.title}
                </h3>
                <p className="text-sm font-body text-[var(--text-muted)] line-clamp-2 mt-1 mb-0 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-xs font-mono text-[var(--text-subtle)]">
                <div className="flex items-center gap-3">
                  <span>
                    {item.anonymous
                      ? 'Anonymous Submitter'
                      : item.name || item.email || 'Student'}
                  </span>
                  {item.replyRequested && !item.anonymous && (
                    <span className="px-1.5 py-0.5 rounded-xs bg-[var(--color-info-soft)] text-[var(--color-info-strong)] dark:text-[var(--color-info)] font-semibold">
                      Reply Wanted
                    </span>
                  )}
                </div>

                {item.severity && (
                  <span className="text-[var(--text-muted)]">
                    Severity: {item.severity}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <div
            className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-detail-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={closeDetail}
              className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-xs"
              aria-hidden="true"
            />

            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { y: '100%', opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { y: '100%', opacity: 1 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-2xl bg-[var(--surface-1)] border-t sm:border border-[var(--border-strong)] rounded-t-xl sm:rounded-sm shadow-5 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden focus:outline-none"
            >
              <div className="sm:hidden w-12 h-1 bg-[var(--border-strong)] rounded-full mx-auto mt-3 mb-1" aria-hidden="true" />

              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--surface-2)]">
                <div className="flex flex-col min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <FeedbackTypeBadge type={selectedItem.type} />
                    <span className="font-mono text-xs text-[var(--text-subtle)] font-bold">
                      {selectedItem.referenceId}
                    </span>
                  </div>
                  <h2
                    id="feedback-detail-title"
                    className="text-base sm:text-lg font-bold font-sans text-[var(--text-strong)] truncate mt-1 m-0"
                  >
                    {selectedItem.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeDetail}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-strong)] cursor-pointer"
                  aria-label="Close detail modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                    Description
                  </span>
                  <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm text-sm font-body text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                    {selectedItem.description}
                  </div>
                </div>

                {selectedItem.type === 'bug' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm">
                    {selectedItem.page && (
                      <div className="flex flex-col">
                        <span className="text-xs font-mono uppercase text-[var(--text-muted)]">Reported Page</span>
                        <span className="text-sm font-mono text-[var(--text-strong)] break-all">{selectedItem.page}</span>
                      </div>
                    )}
                    {selectedItem.severity && (
                      <div className="flex flex-col">
                        <span className="text-xs font-mono uppercase text-[var(--text-muted)]">Severity</span>
                        <span className="text-sm font-semibold text-[var(--text-strong)]">{selectedItem.severity}</span>
                      </div>
                    )}
                    {selectedItem.stepsToReproduce && (
                      <div className="sm:col-span-2 flex flex-col gap-1 pt-2 border-t border-[var(--border)]">
                        <span className="text-xs font-mono uppercase text-[var(--text-muted)]">Steps to Reproduce</span>
                        <span className="text-xs font-body text-[var(--text)] whitespace-pre-wrap">{selectedItem.stepsToReproduce}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedItem.screenshotUrl && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                        Attached Screenshot
                      </span>
                      <a
                        href={selectedItem.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-[var(--link)] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Open full size</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <img
                      src={selectedItem.screenshotUrl}
                      alt="User uploaded screenshot"
                      className="max-h-60 w-auto object-contain rounded-xs border border-[var(--border)] bg-black/5"
                    />
                  </div>
                )}

                <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                    Submitter Information
                  </span>
                  {selectedItem.anonymous ? (
                    <span className="text-sm font-body text-[var(--text-muted)]">
                      Submitted anonymously. Submitter identity and IP address were withheld.
                    </span>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[var(--text-strong)]">
                          {selectedItem.name || 'Anonymous student'}
                        </span>
                        {selectedItem.email && (
                          <span className="text-xs font-mono text-[var(--text-subtle)]">
                            {selectedItem.email}
                          </span>
                        )}
                      </div>

                      {selectedItem.replyRequested && selectedItem.email && (
                        <a
                          href={`mailto:${selectedItem.email}?subject=Coders%20Club%20Feedback%20Update%20[${selectedItem.referenceId}]`}
                          className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono inline-flex items-center gap-1.5 no-underline shrink-0"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Reply via Email</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {selectedItem.meta && (
                  <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm flex flex-col gap-2 text-xs font-mono text-[var(--text-subtle)]">
                    <span className="uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                      Captured Diagnostics
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedItem.meta.viewport && (
                        <div>Viewport: {selectedItem.meta.viewport}</div>
                      )}
                      {selectedItem.meta.theme && (
                        <div>Theme: {selectedItem.meta.theme}</div>
                      )}
                      {selectedItem.meta.route && (
                        <div className="sm:col-span-2">Route: {selectedItem.meta.route}</div>
                      )}
                      {selectedItem.meta.userAgent && (
                        <div className="sm:col-span-2 text-[11px] truncate" title={selectedItem.meta.userAgent}>
                          UA: {selectedItem.meta.userAgent}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-strong)] rounded-sm flex flex-col gap-3 shadow-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-strong)] font-bold">
                      Coordinator Actions
                    </span>
                    {updateSuccess && (
                      <span className="text-xs font-mono text-[var(--color-success-strong)] dark:text-[var(--color-success)] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Saved successfully</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <label htmlFor="edit-status" className="text-xs font-mono text-[var(--text-muted)] shrink-0">
                      Change Status:
                    </label>
                    <select
                      id="edit-status"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as FeedbackStatus)}
                      className="min-h-[44px] px-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm text-sm font-mono text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] cursor-pointer"
                    >
                      <option value="new">New</option>
                      <option value="in-review">In Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-internal-note" className="text-xs font-mono text-[var(--text-muted)]">
                      Internal Coordinator Note:
                    </label>
                    <textarea
                      id="edit-internal-note"
                      rows={2}
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Add private investigation notes or resolution details for club leadership..."
                      className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm text-sm font-body text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] resize-y"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="cc-btn cc-btn--primary min-h-[44px] text-xs font-mono justify-center"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isUpdating ? 'Saving Changes...' : 'Save Status & Notes'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
