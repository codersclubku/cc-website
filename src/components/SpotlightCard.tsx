import React, { useRef, useEffect } from 'react';
import { subscribePointer } from './cursor/pointerStore';
import type { PointerState } from './cursor/pointerStore';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isHoveredRef = useRef<boolean>(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || typeof window === 'undefined') return;

    const el = containerRef.current;
    if (!el) return;

    const handlePointerEnter = () => {
      isHoveredRef.current = true;
      el.style.setProperty('--spotlight-opacity', '1');
    };

    const handlePointerLeave = () => {
      isHoveredRef.current = false;
      el.style.setProperty('--spotlight-opacity', '0');
    };

    el.addEventListener('pointerenter', handlePointerEnter, { passive: true });
    el.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    const unsubscribe = subscribePointer((state: PointerState) => {
      if (!isHoveredRef.current || !el || !state.isInWindow) return;
      const rect = el.getBoundingClientRect();
      const x = state.x - rect.left;
      const y = state.y - rect.top;
      el.style.setProperty('--mx', `${x.toFixed(1)}px`);
      el.style.setProperty('--my', `${y.toFixed(1)}px`);
    });

    return () => {
      el.removeEventListener('pointerenter', handlePointerEnter);
      el.removeEventListener('pointerleave', handlePointerLeave);
      unsubscribe();
    };
  }, [prefersReduced]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`.trim()}
      style={
        {
          '--mx': '0px',
          '--my': '0px',
          '--spotlight-opacity': '0',
          '--spotlight-color': spotlightColor || 'var(--accent)',
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
        style={{
          background:
            'radial-gradient(350px circle at var(--mx) var(--my), var(--spotlight-color), transparent 80%)',
          mixBlendMode: 'screen',
          opacity: 'calc(var(--spotlight-opacity) * var(--spotlight-alpha, 0.16))',
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
};
