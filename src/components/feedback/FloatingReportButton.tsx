import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

export const FloatingReportButton: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  const isHidden =
    pathname === '/' ||
    pathname === '/feedback' ||
    pathname.startsWith('/admin');

  if (isHidden) {
    return null;
  }

  return (
    <>
      <div className="fixed z-[130] right-4 sm:right-6 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+12px)] md:bottom-6">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label="Open report and feedback dialog"
          className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-strong)] border border-[var(--border-strong)] rounded-full shadow-4 hover:shadow-5 flex items-center gap-2 transition-all cursor-pointer font-mono text-xs font-bold active:scale-95"
        >
          <MessageSquarePlus className="w-4 h-4 text-[var(--primary)] dark:text-[var(--accent-on-dark)] shrink-0" />
          <span className="hidden xs:inline sm:inline">Report</span>
        </button>
      </div>

      <FeedbackModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialRoute={pathname}
      />
    </>
  );
};
