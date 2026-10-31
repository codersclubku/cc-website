import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ items, className = '' }) => {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);
  const prefersReduced = useReducedMotion();

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className={`divide-y divide-[var(--border)] border border-[var(--border)] rounded-sm bg-[var(--surface)] ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        const headingId = `faq-heading-${item.id}`;
        const panelId = `faq-panel-${item.id}`;

        return (
          <div key={item.id} className="transition-colors">
            <h3>
              <button
                type="button"
                id={headingId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(item.id)}
                className="w-full min-h-[52px] px-5 py-4 flex items-center justify-between text-left text-base font-semibold text-[var(--text-strong)] hover:text-[var(--accent)] hover:bg-[var(--surface-raised)] transition-colors cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
              >
                <span className="pr-4">{item.question}</span>
                <motion.span
                  className="text-[var(--accent)] shrink-0"
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: prefersReduced ? 0 : 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 stroke-[2]" aria-hidden="true" />
                </motion.span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={headingId}
                  initial={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={prefersReduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                  exit={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-[var(--text)]">
                    <p className="m-0 max-w-none text-left">{item.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
