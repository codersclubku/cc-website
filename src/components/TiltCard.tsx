import React, { useRef, useEffect } from 'react';
import { subscribePointer } from './cursor/pointerStore';
import type { PointerState } from './cursor/pointerStore';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number;
  perspective?: number;
  className?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  maxTilt = 5,
  perspective = 900,
  className = '',
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isHoveredRef = useRef<boolean>(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || typeof window === 'undefined') return;

    const el = cardRef.current;
    if (!el) return;

    const handlePointerEnter = () => {
      isHoveredRef.current = true;
      el.style.transition = 'transform 0.1s ease-out';
    };

    const handlePointerLeave = () => {
      isHoveredRef.current = false;
      el.style.transition = 'transform 0.4s cubic-bezier(0.2, 0, 0, 1)';
      el.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    el.addEventListener('pointerenter', handlePointerEnter, { passive: true });
    el.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    const unsubscribe = subscribePointer((state: PointerState) => {
      if (!isHoveredRef.current || !el || !state.isInWindow) return;
      const rect = el.getBoundingClientRect();
      const px = (state.x - rect.left) / rect.width - 0.5;
      const py = (state.y - rect.top) / rect.height - 0.5;
      const rotateX = (-py * maxTilt).toFixed(2);
      const rotateY = (px * maxTilt).toFixed(2);
      el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    });

    return () => {
      el.removeEventListener('pointerenter', handlePointerEnter);
      el.removeEventListener('pointerleave', handlePointerLeave);
      unsubscribe();
    };
  }, [maxTilt, prefersReduced]);

  return (
    <div
      style={{ perspective: `${perspective}px` }}
      className={`relative ${className}`.trim()}
    >
      <div
        ref={cardRef}
        style={{
          transform: 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};
