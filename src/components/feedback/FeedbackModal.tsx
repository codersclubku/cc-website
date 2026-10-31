import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { FeedbackForm } from './FeedbackForm';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoute?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  initialRoute
}) => {
  const prefersReduced = useReducedMotion();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-xs"
            aria-hidden="true"
          />

          <motion.div
            ref={modalRef}
            initial={prefersReduced ? { opacity: 0 } : { y: '100%', opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { y: '100%', opacity: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-2xl bg-[var(--surface-1)] border-t sm:border border-[var(--border-strong)] rounded-t-xl sm:rounded-sm shadow-5 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden focus:outline-none"
          >
            <div className="sm:hidden w-12 h-1 bg-[var(--border-strong)] rounded-full mx-auto mt-3 mb-1" aria-hidden="true" />

            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--surface-2)]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                  Platform Feedback
                </span>
                <h2 id="feedback-modal-title" className="text-lg sm:text-xl font-bold font-sans text-[var(--text-strong)] m-0">
                  Send Feedback or Report Issue
                </h2>
              </div>

              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-1)] transition-colors cursor-pointer"
                aria-label="Close feedback dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <FeedbackForm
                initialRoute={initialRoute}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
