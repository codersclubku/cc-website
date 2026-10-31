import React from 'react';
import { Link } from 'react-router-dom';
import { SieveIllustration } from './SieveIllustration';
import { BrailleOrbitIllustration } from './BrailleOrbitIllustration';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  illustration?: React.ReactNode | 'sieve' | 'orbit';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  actionLabel,
  actionHref,
  onAction,
  illustration = 'sieve',
  className = '',
}) => {
  const renderIllustration = () => {
    if (!illustration) return null;
    if (illustration === 'sieve') return <SieveIllustration />;
    if (illustration === 'orbit') return <BrailleOrbitIllustration />;
    return illustration;
  };

  const label = actionText || actionLabel;

  return (
    <div
      className={`p-8 sm:p-12 border border-[var(--border)] rounded-sm bg-[var(--surface)] text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden ${className}`}
    >
      <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[var(--accent)]" aria-hidden="true" />

      <div className="flex flex-col gap-4 max-w-[52ch]">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl sm:text-2xl font-semibold text-[var(--text-strong)] m-0">
            {title}
          </h3>
          <p className="text-sm text-[var(--text-muted)] m-0 leading-relaxed">
            {description}
          </p>
        </div>

        {label && onAction && (
          <div className="mt-2">
            <button type="button" onClick={onAction} className="cc-btn cc-btn--secondary">
              {label}
            </button>
          </div>
        )}

        {label && actionHref && !onAction && (
          <div className="mt-2">
            {actionHref.startsWith('http') || actionHref.startsWith('mailto:') ? (
              <a href={actionHref} className="cc-btn cc-btn--secondary">
                {label}
              </a>
            ) : (
              <Link to={actionHref} className="cc-btn cc-btn--secondary">
                {label}
              </Link>
            )}
          </div>
        )}
      </div>

      {illustration && (
        <div className="cc-empty-illustration shrink-0 self-center md:self-auto">
          {renderIllustration()}
        </div>
      )}
    </div>
  );
};
