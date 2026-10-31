import React from 'react';
import { NumberTicker } from './NumberTicker';

interface StatCardProps {
  value: string;
  unit?: string;
  label: string;
  isConfirmed?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  unit,
  label,
  isConfirmed = true,
  className = '',
}) => {
  const numericMatch = value.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)([^0-9]*)$/);

  const renderValue = () => {
    if (numericMatch && isConfirmed) {
      const prefix = numericMatch[1];
      const num = parseFloat(numericMatch[2]);
      const suffix = numericMatch[3];
      const decimalPlaces = numericMatch[2].includes('.')
        ? numericMatch[2].split('.')[1].length
        : 0;

      return (
        <NumberTicker
          value={num}
          prefix={prefix}
          suffix={suffix}
          decimalPlaces={decimalPlaces}
        />
      );
    }
    return value;
  };

  return (
    <div
      className={`p-6 sm:p-8 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col justify-between gap-4 text-left relative transition-all duration-200 hover:border-[var(--border-strong)] ${className}`}
    >
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-mono text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] ${
              !isConfirmed ? 'text-xl sm:text-2xl' : ''
            }`}
          >
            {renderValue()}
          </span>
          {unit && (
            <span className="font-mono text-sm sm:text-base text-[var(--text-muted)] lowercase">
              {unit}
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--border)]">
        <span className="label text-[var(--text-muted)]">
          {label}
        </span>
      </div>
    </div>
  );
};
