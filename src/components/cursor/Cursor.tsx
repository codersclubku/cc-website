import React, { useEffect, useRef, useState } from 'react';
import { subscribePointer } from './pointerStore';
import type { PointerState } from './pointerStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './cursor.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export const Cursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    let ringX = -1000;
    let ringY = -1000;
    let targetX = -1000;
    let targetY = -1000;
    let currentVariant = 'default';
    let currentLabel = '';
    let isHidden = false;
    let isTabHidden = false;
    let isSelecting = false;
    let isDown = false;
    let clickTimeout: ReturnType<typeof setTimeout> | null = null;
    let copyTimeout: ReturnType<typeof setTimeout> | null = null;

    const handshakeTimer = setTimeout(() => {
      document.documentElement.classList.add('cc-cursor-ready');
    }, 100);

    const updateVisibility = () => {
      const hideAll = isHidden || isTabHidden || isSelecting;
      if (ringRef.current) {
        ringRef.current.dataset.hidden = hideAll ? 'true' : 'false';
      }
      if (dotRef.current) {
        const hideDot = hideAll || (currentVariant !== 'default' && currentVariant !== 'text');
        dotRef.current.dataset.hidden = hideDot ? 'true' : 'false';
      }
    };

    const handlePointerOver = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest(
        '[data-cursor], [data-cursor-native], a, button, input, textarea, select, table, [role="dialog"], [role="menu"], p, blockquote'
      );

      if (!target) {
        currentVariant = 'default';
        currentLabel = '';
        if (ringRef.current) {
          ringRef.current.dataset.variant = 'default';
        }
        if (labelRef.current) labelRef.current.textContent = '';
        isHidden = false;
        updateVisibility();
        return;
      }

      if (
        target.hasAttribute('data-cursor-native') ||
        target.closest('[data-cursor-native]') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TABLE' ||
        target.getAttribute('role') === 'dialog' ||
        target.getAttribute('role') === 'menu'
      ) {
        isHidden = true;
        updateVisibility();
        return;
      }

      isHidden = false;
      const explicitVariant = target.getAttribute('data-cursor');
      const explicitLabel = target.getAttribute('data-cursor-label');

      if (explicitVariant) {
        if (explicitVariant === 'hidden') {
          isHidden = true;
          updateVisibility();
          return;
        }
        currentVariant = explicitVariant;
        currentLabel =
          explicitLabel ||
          (explicitVariant === 'view'
            ? 'VIEW'
            : explicitVariant === 'team-card'
            ? 'VIEW'
            : explicitVariant === 'register'
            ? 'REGISTER'
            : explicitVariant === 'expand'
            ? 'EXPAND'
            : explicitVariant === 'drag'
            ? 'DRAG'
            : explicitVariant === 'external'
            ? '↗'
            : explicitVariant === 'copy'
            ? 'COPY'
            : '');
      } else if (target.tagName === 'A') {
        const anchor = target as HTMLAnchorElement;
        const isExternal =
          anchor.target === '_blank' ||
          (anchor.origin && anchor.origin !== window.location.origin) ||
          anchor.href.startsWith('mailto:');
        if (isExternal) {
          currentVariant = 'external';
          currentLabel = '↗';
        } else {
          currentVariant = 'link';
          currentLabel = '';
        }
      } else if (target.tagName === 'BUTTON' || target.classList.contains('cc-btn')) {
        currentVariant = 'button';
        currentLabel = '';
      } else if (target.tagName === 'P' || target.tagName === 'BLOCKQUOTE') {
        currentVariant = 'text';
        currentLabel = '';
      } else {
        currentVariant = 'default';
        currentLabel = '';
      }

      if (ringRef.current) {
        ringRef.current.dataset.variant = currentVariant;
      }
      if (labelRef.current) {
        labelRef.current.textContent = currentLabel;
      }
      updateVisibility();
    };

    const handlePointerOut = (e: PointerEvent) => {
      const related = e.relatedTarget as Element | null;
      if (!related || related === document.documentElement) {
        currentVariant = 'default';
        currentLabel = '';
        if (ringRef.current) ringRef.current.dataset.variant = 'default';
        if (labelRef.current) labelRef.current.textContent = '';
        updateVisibility();
      }
    };

    const handleDocumentClick = (e: MouseEvent) => {
      const copyTarget = (e.target as Element | null)?.closest('[data-cursor="copy"]');
      if (copyTarget) {
        const copyText =
          copyTarget.getAttribute('data-copy-text') ||
          copyTarget.textContent?.trim() ||
          '';
        if (copyText && navigator.clipboard) {
          navigator.clipboard.writeText(copyText).catch(() => {});
          if (labelRef.current) {
            labelRef.current.textContent = 'COPIED';
          }
          if (liveRef.current) {
            liveRef.current.textContent = `Copied ${copyText} to clipboard`;
          }
          if (copyTimeout) clearTimeout(copyTimeout);
          copyTimeout = setTimeout(() => {
            if (labelRef.current && currentVariant === 'copy') {
              labelRef.current.textContent = 'COPY';
            }
          }, 1200);
        }
      }

      if (prefersReduced) return;
      const burstTarget = (e.target as Element | null)?.closest('.cc-btn--primary, [data-hero-click]');
      if (burstTarget) {
        const bx = e.clientX;
        const by = e.clientY;
        const newParticles: Particle[] = Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * Math.PI) / 3;
          return {
            id: Date.now() + i,
            x: bx,
            y: by,
            dx: Math.cos(angle) * 18,
            dy: Math.sin(angle) * 18,
          };
        });
        setParticles((prev) => [...prev.slice(-12), ...newParticles]);
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
        }, 360);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isTabHidden = true;
        updateVisibility();
      }
    };

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      isSelecting = Boolean(sel && sel.type === 'Range' && sel.toString().length > 0);
      updateVisibility();
    };

    const unsubscribe = subscribePointer((state: PointerState) => {
      if (!document.documentElement.classList.contains('cc-cursor-ready')) {
        document.documentElement.classList.add('cc-cursor-ready');
      }
      targetX = state.x;
      targetY = state.y;

      if (isTabHidden && state.isMoving) {
        isTabHidden = false;
        updateVisibility();
      }

      if (!state.isInWindow) {
        isHidden = true;
        updateVisibility();
        return;
      }

      if (isHidden && !isSelecting && !isTabHidden) {
        isHidden = false;
        updateVisibility();
      }

      if (ringX < -500) {
        ringX = targetX;
        ringY = targetY;
      } else {
        const lerp = prefersReduced ? 1 : 0.18;
        ringX += (targetX - ringX) * lerp;
        ringY += (targetY - ringY) * lerp;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX - 2}px, ${targetY - 2}px, 0)`;
      }

      if (ringRef.current) {
        const scale = isDown ? 0.85 : 1;
        if (currentVariant === 'team-card') {
          ringRef.current.style.transform = `translate3d(${ringX + 16}px, ${ringY + 16}px, 0) scale(${scale})`;
        } else {
          const rect = ringRef.current.getBoundingClientRect();
          const halfW = rect.width / 2 || 12;
          const halfH = rect.height / 2 || 12;
          ringRef.current.style.transform = `translate3d(${ringX - halfW}px, ${ringY - halfH}px, 0) scale(${scale})`;
        }
      }
    });

    const handlePointerDown = () => {
      isDown = true;
      if (clickTimeout) clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        isDown = false;
      }, 120);
    };

    const handlePointerUp = () => {
      isDown = false;
    };

    document.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('pointerout', handlePointerOut, { passive: true });
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      clearTimeout(handshakeTimer);
      if (clickTimeout) clearTimeout(clickTimeout);
      if (copyTimeout) clearTimeout(copyTimeout);
      document.documentElement.classList.remove('cc-cursor-ready');
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectionchange', handleSelectionChange);
      unsubscribe();
    };
  }, [prefersReduced]);

  return (
    <>
      <div ref={dotRef} className="cc-cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cc-cursor-ring" aria-hidden="true">
        <span ref={labelRef} className="cc-cursor-label" />
      </div>
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      {particles.map((p) => (
        <span
          key={p.id}
          className="cc-cursor-burst-particle"
          style={
            {
              '--px': `${p.x}px`,
              '--py': `${p.y}px`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        />
      ))}
    </>
  );
};
