import React from 'react';
import { Check, Clock, Users, X, Activity, GitBranch, Lock, CalendarClock, Tag } from 'lucide-react';

export type BadgeVariant = 
  | 'neutral' 
  | 'accent' 
  | 'open' 
  | 'closing-soon' 
  | 'full' 
  | 'closed' 
  | 'cancelled'
  | 'in-progress'
  | 'planned'
  | 'confirmed';

interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  className?: string;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', label, className = '', title }) => {
  const getStylesAndIcon = () => {
    switch (variant) {
      case 'open':
        return {
          classes: 'bg-[var(--color-success-soft)] text-[var(--color-success-strong)] dark:text-[var(--color-success)] border-[var(--color-success-border)] cc-badge--pulse',
          icon: <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case 'confirmed':
        return {
          classes: 'bg-[var(--color-success-soft)] text-[var(--color-success-strong)] dark:text-[var(--color-success)] border-[var(--color-success-border)] cc-badge--pulse',
          icon: <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case 'closing-soon':
        return {
          classes: 'bg-[var(--color-warning-soft)] text-[var(--color-warning-strong)] dark:text-[var(--color-warning)] border-[var(--color-warning-border)] cc-badge--pulse',
          icon: <Clock className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case 'full':
        return {
          classes: 'bg-[var(--color-danger-soft)] text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] border-[var(--color-danger-border)]',
          icon: <Users className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case 'cancelled':
        return {
          classes: 'bg-[var(--color-danger-soft)] text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] border-[var(--color-danger-border)]',
          icon: <X className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case 'in-progress':
        return {
          classes: 'bg-[var(--color-info-soft)] text-[var(--color-info-strong)] dark:text-[var(--color-info)] border-[var(--color-info-border)]',
          icon: <Activity className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case 'accent':
        return {
          classes: 'bg-[var(--accent-soft)] text-[var(--on-accent)] dark:text-[var(--accent-on-dark)] border-[var(--border-strong)]',
          icon: <GitBranch className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case 'closed':
        return {
          classes: 'bg-[var(--surface-3)] text-[var(--text-muted)] border-[var(--border)]',
          icon: <Lock className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case 'planned':
        return {
          classes: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]',
          icon: <CalendarClock className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case 'neutral':
      default:
        return {
          classes: 'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)]',
          icon: <Tag className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
    }
  };

  const { classes, icon } = getStylesAndIcon();

  return (
    <span
      title={title || label}
      className={`inline-flex items-center gap-1.5 h-6 px-2 text-xs font-mono font-medium tracking-wider uppercase border rounded-xs select-none ${classes} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
