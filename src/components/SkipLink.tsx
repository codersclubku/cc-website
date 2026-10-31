import React from 'react';

export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[400] focus:px-4 focus:py-3 focus:bg-accent focus:text-on-accent focus:font-mono focus:font-semibold focus:text-sm focus:rounded-sm focus:outline focus:outline-2 focus:outline-focus focus:outline-offset-2 focus:no-underline"
    >
      Skip to main content
    </a>
  );
};
