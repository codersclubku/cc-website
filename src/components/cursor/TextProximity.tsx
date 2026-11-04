import React, { useRef, useEffect } from 'react';
import { subscribePointer } from './pointerStore';
import type { PointerState } from './pointerStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface TextProximityProps {
  text: string;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

export const TextProximity: React.FC<TextProximityProps> = ({
  text,
  className = '',
  id,
  style,
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const container = containerRef.current;
    if (!container) return;

    let charRects: { x: number; y: number }[] = [];

    const measureChars = () => {
      charRects = charRefs.current.map((el) => {
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      });
    };

    measureChars();
    window.addEventListener('resize', measureChars, { passive: true });
    window.addEventListener('scroll', measureChars, { passive: true });

    const radius = 140;

    const unsubscribe = subscribePointer((state: PointerState) => {
      if (!container || !state.isInWindow) {
        charRefs.current.forEach((el) => {
          if (el) {
            el.style.fontWeight = '700';
            el.style.fontVariationSettings = "'wght' 700";
          }
        });
        return;
      }

      const containerRect = container.getBoundingClientRect();
      if (
        state.x < containerRect.left - radius ||
        state.x > containerRect.right + radius ||
        state.y < containerRect.top - radius ||
        state.y > containerRect.bottom + radius
      ) {
        charRefs.current.forEach((el) => {
          if (el && el.style.fontWeight !== '700') {
            el.style.fontWeight = '700';
            el.style.fontVariationSettings = "'wght' 700";
          }
        });
        return;
      }

      charRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = charRects[index];
        if (!rect) return;

        const dist = Math.hypot(state.x - rect.x, state.y - rect.y);
        if (dist < radius) {
          const factor = 1 - dist / radius;
          const weight = Math.round(500 + factor * 300);
          el.style.fontWeight = `${weight}`;
          el.style.fontVariationSettings = `'wght' ${weight}`;
        } else if (el.style.fontWeight !== '700') {
          el.style.fontWeight = '700';
          el.style.fontVariationSettings = "'wght' 700";
        }
      });
    });

    const chars = charRefs.current;

    return () => {
      unsubscribe();
      window.removeEventListener('resize', measureChars);
      window.removeEventListener('scroll', measureChars);
      chars.forEach((el) => {
        if (el) {
          el.style.fontWeight = '';
          el.style.fontVariationSettings = '';
        }
      });
    };
  }, [text, prefersReduced]);

  if (prefersReduced) {
    return (
      <h1 id={id} className={className} style={style}>
        {text}
      </h1>
    );
  }

  const words = text.split(' ');

  let globalIndex = 0;

  return (
    <h1 id={id} ref={containerRef} className={className} style={style}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-block">
        {words.map((word, wordIdx) => {
          const chars = Array.from(word);
          return (
            <span key={wordIdx} className="inline-block whitespace-nowrap">
              {chars.map((char) => {
                const currentIndex = globalIndex++;
                return (
                  <span
                    key={currentIndex}
                    ref={(el) => {
                      charRefs.current[currentIndex] = el;
                    }}
                    style={{
                      display: 'inline-block',
                      fontWeight: 700,
                      fontVariationSettings: "'wght' 700",
                      transition: 'font-weight 0.1s ease-out',
                    }}
                  >
                    {char}
                  </span>
                );
              })}
              {wordIdx < words.length - 1 && (
                <span className="inline-block">&nbsp;</span>
              )}
            </span>
          );
        })}
      </span>
    </h1>
  );
};
