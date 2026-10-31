import React, { useState, useEffect, useRef } from 'react';
import {
  SlidersHorizontal,
  X,
  Sun,
  Moon,
  Laptop,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import type { ThemeMode } from '../context/ThemeContext';
import { getCursorSetting, setCursorSetting } from './cursor/cursorSettings';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface SettingsMenuProps {
  className?: string;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cursorEnabled, setCursorEnabled] = useState<boolean>(getCursorSetting);
  const { mode, setMode } = useTheme();
  const prefersReduced = useReducedMotion();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      if (typeof detail === 'boolean') {
        setCursorEnabled(detail);
      } else {
        setCursorEnabled(getCursorSetting());
      }
    };

    window.addEventListener('cc-cursor-toggle', handleToggle);
    return () => window.removeEventListener('cc-cursor-toggle', handleToggle);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleCursor = () => {
    const next = !cursorEnabled;
    setCursorEnabled(next);
    setCursorSetting(next);
  };

  const handleResetDefaults = () => {
    setMode('system');
    setCursorEnabled(true);
    setCursorSetting(true);
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { mode: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
    { mode: 'system', label: 'System', icon: <Laptop className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className={`relative ${className}`.trim()} ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        id="settings-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="settings-menu-panel"
        aria-label="Settings and preferences"
        title="Settings & Preferences"
        data-magnetic
        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text)] border border-[var(--border)] rounded-sm bg-transparent hover:bg-[var(--surface)] hover:text-[var(--text-strong)] transition-all hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus cursor-pointer shrink-0"
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="settings-menu-panel"
            role="dialog"
            aria-label="Site settings"
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 sm:w-88 bg-[var(--surface)] border border-[var(--border)] rounded-sm shadow-2xl p-4 z-[150] flex flex-col gap-4 text-left backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-strong)]">
                  Preferences
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close settings"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-raised)] rounded-sm transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Color Theme
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--bg)] border border-[var(--border)] rounded-sm">
                {themeOptions.map((opt) => {
                  const isActive = mode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => setMode(opt.mode)}
                      className={`min-h-[44px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-sm text-xs font-mono transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[var(--accent)] text-[#10002B] font-bold shadow-sm'
                          : 'text-[var(--text)] hover:text-[var(--text-strong)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-[var(--bg)] border border-[var(--border)] rounded-sm">
              <div className="flex flex-col gap-0.5 max-w-[200px]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span className="text-xs font-mono font-bold text-[var(--text-strong)]">
                    Cursor Effects
                  </span>
                </div>
                <span className="text-xs font-sans text-[var(--text-muted)] leading-tight">
                  Follower ring, magnetic pull & card reactive tilt
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={cursorEnabled}
                onClick={toggleCursor}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${
                  cursorEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    cursorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>


            <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs font-mono text-[var(--text-muted)]">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="min-h-[44px] inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-strong)] underline underline-offset-2 cursor-pointer transition-colors bg-transparent border-0 p-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset defaults</span>
              </button>
              <span>CODERS CLUB</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
