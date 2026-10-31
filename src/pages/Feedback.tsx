import React, { useEffect } from 'react';
import { HairlineGrid } from '../components/HairlineGrid';
import { FeedbackForm } from '../components/feedback/FeedbackForm';

export const Feedback: React.FC = () => {
  useEffect(() => {
    document.title = 'Feedback & Reports | Coders Club';
  }, []);

  return (
    <HairlineGrid>
      <section
        className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--bg)] text-left"
        aria-labelledby="feedback-page-heading"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 w-full">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                Student & Member Voice
              </span>
              <h1
                id="feedback-page-heading"
                className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[var(--text-strong)] mt-2"
              >
                Feedback & Bug Reports
              </h1>
            </div>

            <p className="text-base text-[var(--text-muted)] font-body leading-relaxed">
              Help us improve Coders Club platforms, workshops, and student initiatives. Submit bug reports, suggestions, or official complaints directly to club leadership and faculty mentors.
            </p>

            <div className="p-4 sm:p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm flex flex-col gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] font-bold">
                Review Policy
              </span>
              <p className="text-xs font-body text-[var(--text-muted)] leading-relaxed m-0">
                All submissions are logged with reference IDs and tracked by the President, Vice President, and Faculty Coordinators. Bug reports capture diagnostic details to aid rapid resolution.
              </p>
              <div className="pt-2 border-t border-[var(--border)] flex flex-wrap gap-2 text-[11px] font-mono text-[var(--text-subtle)]">
                <span>• Bug investigations within 48h</span>
                <span>• Anonymous option for issues</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm shadow-2">
              <FeedbackForm />
            </div>
          </div>
        </div>
      </section>
    </HairlineGrid>
  );
};
