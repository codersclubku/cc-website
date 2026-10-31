import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { AdminTableSkeleton } from '../../components/Skeleton';
import { adminGetContactMessages, adminMarkMessageHandled } from '../../lib/api';
import type { DbContactMessage } from '../../lib/api';

export const AdminMessages: React.FC = () => {
  const [messages, setMessages] = useState<DbContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    const list = await adminGetContactMessages();
    setMessages(list);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    adminGetContactMessages().then((list) => {
      if (active) {
        setMessages(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    await adminMarkMessageHandled(id, !current);
    loadMessages();
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
            Inquiries
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Contact Messages
          </h1>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">
          {messages.filter((m) => !m.handled).length} unhandled messages
        </span>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={4} />
      ) : messages.length === 0 ? (
        <EmptyState
          title="No messages received"
          description="Public messages sent from the Contact page will appear here."
          illustration="orbit"
        />
      ) : (
        <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-sm bg-[var(--surface)]">
          {messages.map((msg) => (
            <div key={msg.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-body text-[var(--text-strong)]">
                    {msg.name}
                  </span>
                  <span className="text-xs font-mono text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] underline">
                    {msg.email}
                  </span>
                </div>

                <div className="text-xs font-mono text-[var(--text-muted)]">
                  Received on {new Date(msg.created_at).toLocaleString('en-IN')}
                </div>

                <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-sm text-sm text-[var(--text)] font-body leading-relaxed whitespace-pre-line mt-1">
                  {msg.message}
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleToggle(msg.id, msg.handled)}
                  className={`cc-btn cc-btn--sm text-xs font-mono flex items-center gap-1.5 ${
                    msg.handled ? 'cc-btn--secondary' : 'cc-btn--primary'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{msg.handled ? 'Mark Unhandled' : 'Mark Handled'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
