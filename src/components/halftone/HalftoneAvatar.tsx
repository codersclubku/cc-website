import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  getHalftoneField,
  sampleBilinear,
  computeDotRadius,
} from './halftoneData';
import type { HalftoneField } from './halftoneData';
import { registerHalftoneInstance, requestHalftoneTick } from './halftoneLoop';
import { subscribePointer } from '../cursor/pointerStore';
import type { PointerState } from '../cursor/pointerStore';

export interface HalftoneAvatarProps {
  id: string;
  name: string;
  photo?: string;
  focalX?: number;
  focalY?: number;
  sizeMode?: 'card' | 'hero';
  active?: boolean;
  className?: string;
}

function getInitials(name: string): string {
  const cleaned = name.replace(/^(Mr\.|Mrs\.|Dr\.|Prof\.)\s*/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function parseColor(str: string, fallback: [number, number, number, number]): [number, number, number, number] {
  const s = str.trim();
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    const a = hex.length >= 8 ? (parseInt(hex.slice(6, 8), 16) || 255) / 255 : 1;
    return [r, g, b, a];
  }
  const match = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\)/i);
  if (match) {
    return [
      parseInt(match[1], 10),
      parseInt(match[2], 10),
      parseInt(match[3], 10),
      match[4] !== undefined ? parseFloat(match[4]) : 1,
    ];
  }
  return fallback;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export const HalftoneAvatar: React.FC<HalftoneAvatarProps> = ({
  id,
  name,
  photo,
  focalX = 0.5,
  focalY = 0.35,
  sizeMode = 'card',
  active = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initials = getInitials(name);

  const [, setPhotoRevision] = useState<number>(0);
  const field = getHalftoneField(id, photo, focalX, focalY);
  const fieldRef = useRef<HalftoneField>(field);

  useEffect(() => {
    fieldRef.current = field;
  }, [field]);

  const isVisibleRef = useRef<boolean>(false);
  const hasEnteredRef = useRef<boolean>(false);
  const revealStartTimeRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);
  const isFocusedRef = useRef<boolean>(false);
  const hoverMixRef = useRef<number>(active ? 1 : 0);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const rippleRef = useRef<{ x: number; y: number; startTime: number } | null>(null);
  const focusPulseTimeRef = useRef<number>(0);

  const gridRef = useRef<{
    cols: number;
    rows: number;
    count: number;
    width: number;
    height: number;
    stepX: number;
    stepY: number;
    dotSpacing: number;
    rMin: number;
    rMax: number;
    scales: Float32Array;
    scaleVels: Float32Array;
    offsetsX: Float32Array;
    offsetsY: Float32Array;
    velsX: Float32Array;
    velsY: Float32Array;
    strengths: Float32Array;
    baseRadii: Float32Array;
    posX: Float32Array;
    posY: Float32Array;
  } | null>(null);

  const colorsRef = useRef<{
    dot: [number, number, number, number];
    dim: [number, number, number, number];
    accent: [number, number, number, number];
    surface: string;
    isDark: boolean;
  }>({
    dot: [60, 9, 108, 1],
    dim: [60, 9, 108, 0.25],
    accent: [123, 44, 191, 1],
    surface: '#F7F2FA',
    isDark: false,
  });

  const prefersReducedRef = useRef<boolean>(false);

  const readTokens = useCallback(() => {
    const el = canvasRef.current || containerRef.current;
    if (!el) return;
    const computed = getComputedStyle(el);

    const dotStr = computed.getPropertyValue('--halftone-dot') || '#3C096C';
    const dimStr = computed.getPropertyValue('--halftone-dim') || 'rgba(60, 9, 108, 0.25)';
    const accentStr = computed.getPropertyValue('--halftone-accent') || '#7B2CBF';
    const surfaceStr = computed.getPropertyValue('--halftone-surface') || '#F7F2FA';

    const rootTheme = document.documentElement.getAttribute('data-theme');
    const isDark =
      rootTheme === 'dark' ||
      (!rootTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

    colorsRef.current = {
      dot: parseColor(dotStr, isDark ? [224, 170, 255, 1] : [60, 9, 108, 1]),
      dim: parseColor(dimStr, isDark ? [224, 170, 255, 0.3] : [60, 9, 108, 0.25]),
      accent: parseColor(accentStr, isDark ? [199, 125, 255, 1] : [123, 44, 191, 1]),
      surface: surfaceStr.trim() || (isDark ? '#1A0033' : '#F7F2FA'),
      isDark,
    };

    if (gridRef.current && fieldRef.current) {
      const g = gridRef.current;
      for (let i = 0; i < g.count; i++) {
        g.baseRadii[i] = computeDotRadius(
          g.strengths[i],
          Boolean(fieldRef.current.isPhoto),
          isDark,
          g.rMin,
          g.rMax
        );
      }
    }
  }, []);

  const buildGrid = useCallback(
    (w: number, h: number) => {
      const cols = Math.max(14, Math.round(w / (sizeMode === 'hero' ? 10 : 11)));
      const rows = Math.round(cols * 1.25);
      const count = cols * rows;

      const stepX = w / cols;
      const stepY = h / rows;
      const dotSpacing = (stepX + stepY) / 2;
      const rMin = 0.7;
      const rMax = 0.46 * dotSpacing;

      const scales = new Float32Array(count).fill(1);
      const scaleVels = new Float32Array(count);
      const offsetsX = new Float32Array(count);
      const offsetsY = new Float32Array(count);
      const velsX = new Float32Array(count);
      const velsY = new Float32Array(count);
      const strengths = new Float32Array(count);
      const baseRadii = new Float32Array(count);
      const posX = new Float32Array(count);
      const posY = new Float32Array(count);

      const curField = fieldRef.current;
      const isDark = colorsRef.current.isDark;

      for (let r = 0; r < rows; r++) {
        const v = (r + 0.5) / rows;
        const cy = (r + 0.5) * stepY;
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const u = (c + 0.5) / cols;
          const cx = (c + 0.5) * stepX;

          posX[idx] = cx;
          posY[idx] = cy;

          const strength = sampleBilinear(curField, u, v);
          strengths[idx] = strength;
          baseRadii[idx] = computeDotRadius(
            strength,
            Boolean(curField.isPhoto),
            isDark,
            rMin,
            rMax
          );
        }
      }

      gridRef.current = {
        cols,
        rows,
        count,
        width: w,
        height: h,
        stepX,
        stepY,
        dotSpacing,
        rMin,
        rMax,
        scales,
        scaleVels,
        offsetsX,
        offsetsY,
        velsX,
        velsY,
        strengths,
        baseRadii,
        posX,
        posY,
      };
    },
    [sizeMode]
  );

  const drawFrame = useCallback(
    (now: number): boolean => {
      const canvas = canvasRef.current;
      const grid = gridRef.current;
      if (!canvas || !grid) return false;

      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const { count, width, height, rows, posX, posY, baseRadii, strengths, scales, scaleVels, offsetsX, offsetsY, velsX, velsY } = grid;
      const { dot, dim, accent, surface } = colorsRef.current;
      const prefersReduced = prefersReducedRef.current;

      let needsNext = false;

      const hoverTarget = active || isHoveredRef.current || isFocusedRef.current ? 1 : 0;
      const hoverDiff = hoverTarget - hoverMixRef.current;
      if (Math.abs(hoverDiff) > 0.005) {
        hoverMixRef.current += hoverDiff * 0.16;
        needsNext = true;
      } else {
        hoverMixRef.current = hoverTarget;
      }
      const hoverMix = hoverMixRef.current;

      let revealProgress = 1;
      if (!prefersReduced && revealStartTimeRef.current > 0) {
        const elapsed = now - revealStartTimeRef.current;
        if (elapsed < 500) {
          revealProgress = elapsed / 500;
          needsNext = true;
        } else {
          revealStartTimeRef.current = 0;
        }
      }

      let ripple = rippleRef.current;
      let rippleRadius = 0;
      let rippleElapsed = 0;
      if (ripple && !prefersReduced) {
        rippleElapsed = now - ripple.startTime;
        if (rippleElapsed < 400) {
          rippleRadius = (rippleElapsed / 400) * (Math.max(width, height) * 1.2);
          needsNext = true;
        } else {
          rippleRef.current = null;
          ripple = null;
        }
      }

      let pulseInfluence = 0;
      if (isFocusedRef.current && focusPulseTimeRef.current > 0 && !prefersReduced) {
        const pulseElapsed = now - focusPulseTimeRef.current;
        if (pulseElapsed < 600) {
          pulseInfluence = Math.sin((pulseElapsed / 600) * Math.PI) * 0.4;
          needsNext = true;
        } else {
          focusPulseTimeRef.current = 0;
        }
      }

      ctx.save();
      ctx.fillStyle = surface;
      ctx.fillRect(0, 0, width, height);

      const influenceRadius = width * 0.28;
      const pointer = pointerPosRef.current;
      const hasPointer = Boolean(pointer && isHoveredRef.current && !prefersReduced);

      for (let i = 0; i < count; i++) {
        const cx = posX[i];
        const cy = posY[i];
        const str = strengths[i];
        const isSubject = str > 0.15;

        let dotInf = 0;
        let angle = 0;

        if (hasPointer && pointer) {
          const dx = cx - pointer.x;
          const dy = cy - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < influenceRadius) {
            dotInf = 1 - smoothstep(0, influenceRadius, dist);
            angle = Math.atan2(dy, dx);
          }
        }

        if (pulseInfluence > 0) {
          const dxCenter = cx - width / 2;
          const dyCenter = cy - height / 2;
          const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
          if (distCenter < width * 0.45) {
            const infCenter = (1 - distCenter / (width * 0.45)) * pulseInfluence;
            dotInf = Math.max(dotInf, infCenter);
          }
        }

        let ripInf = 0;
        if (ripple) {
          const dxRip = cx - ripple.x;
          const dyRip = cy - ripple.y;
          const distRip = Math.sqrt(dxRip * dxRip + dyRip * dyRip);
          const waveDist = Math.abs(distRip - rippleRadius);
          const waveWidth = width * 0.22;
          if (waveDist < waveWidth) {
            ripInf = (1 - waveDist / waveWidth) * (1 - rippleElapsed / 400);
            dotInf = Math.max(dotInf, ripInf);
          }
        }

        let targetScale = 1;
        let targetOffX = 0;
        let targetOffY = 0;

        if (!prefersReduced) {
          targetScale = 1 + dotInf * (isSubject ? 0.9 : 1.6);
          targetOffX = Math.cos(angle) * (dotInf * 6);
          targetOffY = Math.sin(angle) * (dotInf * 6);

          scaleVels[i] = (scaleVels[i] + (targetScale - scales[i]) * 0.14) * 0.8;
          scales[i] += scaleVels[i];

          velsX[i] = (velsX[i] + (targetOffX - offsetsX[i]) * 0.14) * 0.8;
          offsetsX[i] += velsX[i];

          velsY[i] = (velsY[i] + (targetOffY - offsetsY[i]) * 0.14) * 0.8;
          offsetsY[i] += velsY[i];

          if (
            Math.abs(scales[i] - targetScale) > 0.005 ||
            Math.abs(scaleVels[i]) > 0.005 ||
            Math.abs(offsetsX[i] - targetOffX) > 0.005 ||
            Math.abs(velsX[i]) > 0.005 ||
            Math.abs(offsetsY[i] - targetOffY) > 0.005 ||
            Math.abs(velsY[i]) > 0.005
          ) {
            needsNext = true;
          }
        } else {
          scales[i] = 1;
          offsetsX[i] = 0;
          offsetsY[i] = 0;
        }

        let dotReveal = 1;
        if (revealStartTimeRef.current > 0 && !prefersReduced) {
          const rowIdx = Math.floor(i / grid.cols);
          const rowDelay = (rowIdx / rows) * 0.5;
          dotReveal = Math.max(0, Math.min(1, (revealProgress - rowDelay) / 0.5));
        }

        const effectiveScale = scales[i] * dotReveal;
        if (effectiveScale <= 0.02) continue;

        const baseColor = isSubject ? dot : dim;
        const mixWeight = Math.min(1, hoverMix * 0.85 + dotInf * 0.15);

        const r = Math.round(baseColor[0] + (accent[0] - baseColor[0]) * mixWeight);
        const g = Math.round(baseColor[1] + (accent[1] - baseColor[1]) * mixWeight);
        const b = Math.round(baseColor[2] + (accent[2] - baseColor[2]) * mixWeight);
        const a = baseColor[3] + (accent[3] - baseColor[3]) * mixWeight;

        const radius = Math.max(0.4, baseRadii[i] * effectiveScale);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx + offsetsX[i], cy + offsetsY[i], radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      return needsNext;
    },
    [active]
  );

  useEffect(() => {
    prefersReducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedRef.current = e.matches;
      requestHalftoneTick();
    };
    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    let unmounted = false;
    getHalftoneField(id, photo, focalX, focalY, () => {
      if (!unmounted) {
        setPhotoRevision((r) => r + 1);
        requestHalftoneTick();
      }
    });
    return () => {
      unmounted = true;
    };
  }, [id, photo, focalX, focalY]);

  useEffect(() => {
    readTokens();
    const observer = new MutationObserver(() => {
      readTokens();
      requestHalftoneTick();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style', 'class'],
    });

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSchemeChange = () => {
      readTokens();
      requestHalftoneTick();
    };
    darkQuery.addEventListener('change', handleSchemeChange);

    return () => {
      observer.disconnect();
      darkQuery.removeEventListener('change', handleSchemeChange);
    };
  }, [readTokens]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w <= 0 || h <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      buildGrid(w, h);
      drawFrame(performance.now());
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(canvas);
    resize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [buildGrid, drawFrame]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisibleRef.current = entry.isIntersecting;
          if (entry.isIntersecting && !hasEnteredRef.current) {
            hasEnteredRef.current = true;
            if (!prefersReducedRef.current) {
              revealStartTimeRef.current = performance.now();
            }
            requestHalftoneTick();
          }
        }
      },
      { threshold: 0.05 }
    );

    io.observe(container);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const unregister = registerHalftoneInstance({
      tick: drawFrame,
      isVisible: () => isVisibleRef.current,
    });
    return unregister;
  }, [drawFrame]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const parentButton = container.closest('button');
    const targetElement = parentButton || container;

    const handlePointerEnter = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      isHoveredRef.current = true;
      const rect = canvas.getBoundingClientRect();
      pointerPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      requestHalftoneTick();
    };

    const handlePointerLeave = () => {
      isHoveredRef.current = false;
      pointerPosRef.current = null;
      requestHalftoneTick();
    };

    const handleFocusIn = () => {
      isFocusedRef.current = true;
      focusPulseTimeRef.current = performance.now();
      requestHalftoneTick();
    };

    const handleFocusOut = () => {
      isFocusedRef.current = false;
      requestHalftoneTick();
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      rippleRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        startTime: performance.now(),
      };
      requestHalftoneTick();
    };

    targetElement.addEventListener('pointerenter', handlePointerEnter as EventListener, { passive: true });
    targetElement.addEventListener('pointerleave', handlePointerLeave as EventListener, { passive: true });
    targetElement.addEventListener('focusin', handleFocusIn as EventListener);
    targetElement.addEventListener('focusout', handleFocusOut as EventListener);
    targetElement.addEventListener('click', handleClick as EventListener);

    const unsubscribe = subscribePointer((state: PointerState) => {
      if (!isHoveredRef.current || !state.isInWindow) return;
      const rect = canvas.getBoundingClientRect();
      pointerPosRef.current = { x: state.x - rect.left, y: state.y - rect.top };
      requestHalftoneTick();
    });

    return () => {
      targetElement.removeEventListener('pointerenter', handlePointerEnter as EventListener);
      targetElement.removeEventListener('pointerleave', handlePointerLeave as EventListener);
      targetElement.removeEventListener('focusin', handleFocusIn as EventListener);
      targetElement.removeEventListener('focusout', handleFocusOut as EventListener);
      targetElement.removeEventListener('click', handleClick as EventListener);
      unsubscribe();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[4/5] ${sizeMode === 'hero' ? '' : 'max-h-[220px] md:max-h-none'} overflow-hidden border border-[var(--border)] bg-[var(--halftone-surface)] rounded-sm pixel-step-corner select-none ${className}`.trim()}
    >
      <div
        aria-hidden="true"
        className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 px-1.5 py-0.5 border border-[var(--border)] bg-[var(--halftone-surface)] text-[var(--text)] font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.08em] uppercase rounded-xs select-none pointer-events-none shadow-xs"
      >
        {initials}
      </div>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="halftone-canvas w-full h-full block pointer-events-none object-cover object-top"
      />

      <div
        aria-hidden="true"
        className="halftone-forced-monogram hidden absolute inset-0 flex flex-col items-center justify-center font-mono text-3xl font-bold select-none text-[CanvasText] bg-[Canvas] z-20"
      >
        <span>{initials}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[CanvasText] mt-2">
          Coders Club
        </span>
      </div>
    </div>
  );
};
