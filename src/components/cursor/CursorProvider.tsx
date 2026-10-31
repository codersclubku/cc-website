import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getCursorSetting } from './cursorSettings';
import { CursorErrorBoundary } from './ErrorBoundary';
import { useGlobalMagnetic } from './useMagnetic';
import { Cursor } from './Cursor';

const MagneticManager: React.FC = () => {
  useGlobalMagnetic();
  return null;
};

const DISABLED_EXACT_ROUTES = new Set([
  '/register',
  '/contact',
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/account',
]);

function isRouteAllowed(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return false;
  if (DISABLED_EXACT_ROUTES.has(pathname)) return false;
  if (pathname.endsWith('/register')) return false;
  return true;
}

export const CursorProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [canMount, setCanMount] = useState(false);
  const [idleReady, setIdleReady] = useState(true);

  useEffect(() => {
    let cancelIdle: () => void = () => {};

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const id = (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => {
          setIdleReady(true);
        });
        cancelIdle = () => {
          if ('cancelIdleCallback' in window) {
            (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
          }
        };
      } else {
        const timer = setTimeout(() => {
          setIdleReady(true);
        }, 200);
        cancelIdle = () => clearTimeout(timer);
      }
    }

    return () => cancelIdle();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fineMedia = window.matchMedia('(pointer: fine)');
    const hoverMedia = window.matchMedia('(hover: hover)');
    const forcedColorsMedia = window.matchMedia('(forced-colors: active)');

    const evaluateGates = () => {
      const fine = fineMedia.matches;
      const hover = hoverMedia.matches;
      const forced = forcedColorsMedia.matches;
      const userOn = getCursorSetting();
      const routeOk = isRouteAllowed(location.pathname);

      setCanMount(fine && hover && !forced && userOn && routeOk);
    };

    evaluateGates();

    fineMedia.addEventListener('change', evaluateGates);
    hoverMedia.addEventListener('change', evaluateGates);
    forcedColorsMedia.addEventListener('change', evaluateGates);

    const handleToggle = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      const fine = fineMedia.matches;
      const hover = hoverMedia.matches;
      const forced = forcedColorsMedia.matches;
      const routeOk = isRouteAllowed(location.pathname);
      const userOn = typeof detail === 'boolean' ? detail : getCursorSetting();
      setCanMount(fine && hover && !forced && userOn && routeOk);
    };

    window.addEventListener('cc-cursor-toggle', handleToggle);

    return () => {
      fineMedia.removeEventListener('change', evaluateGates);
      hoverMedia.removeEventListener('change', evaluateGates);
      forcedColorsMedia.removeEventListener('change', evaluateGates);
      window.removeEventListener('cc-cursor-toggle', handleToggle);
    };
  }, [location.pathname]);

  return (
    <>
      {children}
      {canMount && idleReady && (
        <CursorErrorBoundary>
          <MagneticManager />
          <Cursor />
        </CursorErrorBoundary>
      )}
    </>
  );
};
