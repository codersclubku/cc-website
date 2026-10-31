import React from 'react';

interface HairlineGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * HairlineGrid Component
 * Full-width modern grid container that spans across the entire screen,
 * reducing dead space on modern widescreen and high-res displays.
 */
export const HairlineGrid: React.FC<HairlineGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative w-full border-b border-[var(--border)] ${className}`}>
      {children}
    </div>
  );
};

export const HairlineDivider: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`w-full h-[1px] bg-[var(--border)] ${className}`} aria-hidden="true" />;
};
