import React from 'react';
import { Bug, Sparkles, AlertCircle, HelpCircle, Clock, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import type { FeedbackType, FeedbackStatus } from '../../types/feedback';

interface TypeBadgeProps {
  type: FeedbackType;
  className?: string;
}

export const FeedbackTypeBadge: React.FC<TypeBadgeProps> = ({ type, className = '' }) => {
  switch (type) {
    case 'bug':
      return (
        <span
          className={`inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-mono font-semibold tracking-wider uppercase border rounded-xs select-none bg-[var(--color-danger-soft)] text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] border-[var(--color-danger-border)] ${className}`}
        >
          <Bug className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
          <span>Bug</span>
        </span>
      );
    case 'suggestion':
      return (
        <span
          className={`inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-mono font-semibold tracking-wider uppercase border rounded-xs select-none bg-[#FDE047]/15 text-[#854d0e] dark:text-[#FDE047] border-[#FDE047]/40 ${className}`}
        >
          <Sparkles className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
          <span>Suggestion</span>
        </span>
      );
    case 'issue':
      return (
        <span
          className={`inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-mono font-semibold tracking-wider uppercase border rounded-xs select-none bg-[var(--color-warning-soft)] text-[var(--color-warning-strong)] dark:text-[var(--color-warning)] border-[var(--color-warning-border)] ${className}`}
        >
          <AlertCircle className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
          <span>Issue</span>
        </span>
      );
    case 'other':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-mono font-semibold tracking-wider uppercase border rounded-xs select-none bg-[var(--surface-3)] text-[var(--text-muted)] dark:text-[var(--accent-on-dark)] border-[var(--border)] ${className}`}
        >
          <HelpCircle className="w-3.5 h-3.5 stroke-[2]" aria-hidden="true" />
          <span>Other</span>
        </span>
      );
  }
};

interface StatusBadgeProps {
  status: FeedbackStatus;
  className?: string;
}

export const FeedbackStatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'new':
      return (
        <span
          className={`inline-flex items-center gap-1.5 h-6 px-2 text-xs font-mono font-medium tracking-wider uppercase border rounded-xs select-none bg-[var(--color-info-soft)] text-[var(--color-info-strong)] dark:text-[var(--color-info)] border-[var(--color-info-border)] ${className}`}
        >
          <Inbox className="w-3 h-3 stroke-[2]" aria-hidden="true" />
          <span>New</span>
        </span>
      );
    case 'in-review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 h-6 px-2 text-xs font-mono font-medium tracking-wider uppercase border rounded-xs select-none bg-[var(--color-warning-soft)] text-[var(--color-warning-strong)] dark:text-[var(--color-warning)] border-[var(--color-warning-border)] ${className}`}
        >
          <Clock className="w-3 h-3 stroke-[2]" aria-hidden="true" />
          <span>In Review</span>
        </span>
      );
    case 'resolved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 h-6 px-2 text-xs font-mono font-medium tracking-wider uppercase border rounded-xs select-none bg-[var(--color-success-soft)] text-[var(--color-success-strong)] dark:text-[var(--color-success)] border-[var(--color-success-border)] ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 stroke-[2]" aria-hidden="true" />
          <span>Resolved</span>
        </span>
      );
    case 'rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 h-6 px-2 text-xs font-mono font-medium tracking-wider uppercase border rounded-xs select-none bg-[var(--surface-3)] text-[var(--text-disabled)] border-[var(--border)] ${className}`}
        >
          <XCircle className="w-3 h-3 stroke-[2]" aria-hidden="true" />
          <span>Rejected</span>
        </span>
      );
  }
};
