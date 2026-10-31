import { useEffect, useRef } from 'react';
import { subscribePointer } from './pointerStore';
import type { PointerState } from './pointerStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(
  radius = 72,
  pullStrength = 0.25,
  maxDisplacement = 8
) {
  const ref = useRef<T | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced || typeof window === 'undefined') return;

    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (el.closest('form') || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
      return;
    }

    let isNear = false;

    const unsubscribe = subscribePointer((state: PointerState) => {
      if (!state.isInWindow || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
        if (isNear) {
          isNear = false;
          el.style.transform = 'translate3d(0px, 0px, 0px)';
          el.style.transition = 'transform 0.35s cubic-bezier(0.2, 0, 0, 1)';
        }
        return;
      }

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dist = Math.hypot(state.x - centerX, state.y - centerY);

      if (dist < radius) {
        isNear = true;
        const dx = (state.x - centerX) * pullStrength;
        const dy = (state.y - centerY) * pullStrength;

        const clampedDist = Math.hypot(dx, dy);
        let finalDx = dx;
        let finalDy = dy;
        if (clampedDist > maxDisplacement) {
          const ratio = maxDisplacement / clampedDist;
          finalDx = dx * ratio;
          finalDy = dy * ratio;
        }

        el.style.transition = 'transform 0.1s ease-out';
        el.style.transform = `translate3d(${finalDx.toFixed(2)}px, ${finalDy.toFixed(2)}px, 0px)`;
      } else if (isNear) {
        isNear = false;
        el.style.transition = 'transform 0.35s cubic-bezier(0.2, 0, 0, 1)';
        el.style.transform = 'translate3d(0px, 0px, 0px)';
      }
    });

    return () => {
      unsubscribe();
      if (el) {
        el.style.transform = '';
        el.style.transition = '';
      }
    };
  }, [radius, pullStrength, maxDisplacement, prefersReduced]);

  return ref;
}

export function useGlobalMagnetic() {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const radius = 72;
    const pullStrength = 0.25;
    const maxDisplacement = 8;
    let activeElement: HTMLElement | null = null;

    const unsubscribe = subscribePointer((state: PointerState) => {
      if (!state.isInWindow) {
        if (activeElement) {
          activeElement.style.transition = 'transform 0.35s cubic-bezier(0.2, 0, 0, 1)';
          activeElement.style.transform = 'translate3d(0px, 0px, 0px)';
          activeElement = null;
        }
        return;
      }

      const elements = document.querySelectorAll<HTMLElement>('[data-magnetic]');
      let foundElement: HTMLElement | null = null;
      let minDistance = radius;
      let targetDx = 0;
      let targetDy = 0;

      elements.forEach((el) => {
        if (el.closest('form') || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
          return;
        }
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(state.x - centerX, state.y - centerY);

        if (dist < minDistance) {
          minDistance = dist;
          foundElement = el;
          const dx = (state.x - centerX) * pullStrength;
          const dy = (state.y - centerY) * pullStrength;
          const clampedDist = Math.hypot(dx, dy);
          if (clampedDist > maxDisplacement) {
            const ratio = maxDisplacement / clampedDist;
            targetDx = dx * ratio;
            targetDy = dy * ratio;
          } else {
            targetDx = dx;
            targetDy = dy;
          }
        }
      });

      if (foundElement) {
        const targetEl = foundElement as HTMLElement;
        if (activeElement && activeElement !== targetEl) {
          activeElement.style.transition = 'transform 0.35s cubic-bezier(0.2, 0, 0, 1)';
          activeElement.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        activeElement = targetEl;
        targetEl.style.transition = 'transform 0.1s ease-out';
        targetEl.style.transform = `translate3d(${targetDx.toFixed(2)}px, ${targetDy.toFixed(2)}px, 0px)`;
      } else if (activeElement) {
        activeElement.style.transition = 'transform 0.35s cubic-bezier(0.2, 0, 0, 1)';
        activeElement.style.transform = 'translate3d(0px, 0px, 0px)';
        activeElement = null;
      }
    });

    return () => {
      unsubscribe();
      if (activeElement) {
        activeElement.style.transform = '';
        activeElement.style.transition = '';
      }
    };
  }, [prefersReduced]);
}
