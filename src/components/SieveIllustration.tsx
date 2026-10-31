import React, { useRef, useState, useCallback } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export const SieveIllustration: React.FC<{ className?: string }> = ({ className = "" }) => {
  const containerRef = useRef<SVGSVGElement | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number }>({ x: 100, y: 75 });
  const prefersReduced = useReducedMotion();

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (prefersReduced || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 200;
      const y = ((e.clientY - rect.top) / rect.height) * 150;
      setPointer({ x, y });
    },
    [prefersReduced]
  );

  const handlePointerLeave = useCallback(() => {
    setPointer({ x: 100, y: 75 });
  }, []);

  const dx = (pointer.x - 100) * 0.15;
  const dy = (pointer.y - 75) * 0.15;

  return (
    <svg
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      viewBox="0 0 200 150"
      className={`w-36 h-28 stroke-[var(--accent)] text-[var(--border)] overflow-visible ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <g strokeWidth="0.75" opacity="0.6">
        <line x1="20" y1="20" x2="180" y2="20" />
        <line x1="20" y1="50" x2="180" y2="50" />
        <line x1="20" y1="80" x2="180" y2="80" />
        <line x1="20" y1="110" x2="180" y2="110" />
        <line x1="20" y1="140" x2="180" y2="140" />

        <line x1="20" y1="20" x2="20" y2="140" />
        <line x1="60" y1="20" x2="60" y2="140" />
        <line x1="100" y1="20" x2="100" y2="140" />
        <line x1="140" y1="20" x2="140" y2="140" />
        <line x1="180" y1="20" x2="180" y2="140" />
      </g>

      <g strokeWidth="1.2" stroke="var(--accent)">
        <path
          d={`M 20 80 Q ${100 + dx} ${80 + dy} 180 80`}
          className="transition-[d] duration-75"
        />
        <path
          d={`M 100 20 Q ${100 + dx} ${75 + dy} 100 140`}
          className="transition-[d] duration-75"
        />
        <path
          d={`M 20 20 Q ${100 + dx} ${75 + dy} 180 140`}
          strokeDasharray="3 3"
          className="transition-[d] duration-75"
        />
      </g>

      <rect
        x={100 + dx - 3}
        y={75 + dy - 3}
        width="6"
        height="6"
        fill="var(--accent)"
        className="transition-transform duration-75"
      />
    </svg>
  );
};
