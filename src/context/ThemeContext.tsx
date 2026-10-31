import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleNextMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem('cc-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      let activeTheme: 'light' | 'dark';
      if (mode === 'system') {
        activeTheme = mediaQuery.matches ? 'dark' : 'light';
        root.setAttribute('data-theme', activeTheme);
        try {
          localStorage.setItem('cc-theme', 'system');
        } catch {
        }
      } else {
        activeTheme = mode;
        root.setAttribute('data-theme', mode);
        try {
          localStorage.setItem('cc-theme', mode);
        } catch {
        }
      }

      root.style.colorScheme = activeTheme;
      setResolvedTheme(activeTheme);

      const meta = document.getElementById('theme-color-meta');
      if (meta) {
        meta.setAttribute('content', activeTheme === 'dark' ? '#10002B' : '#FAF8FC');
      }
    };

    updateTheme();

    const handleSystemChange = () => {
      if (mode === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const toggleNextMode = () => {
    const modes: ThemeMode[] = ['system', 'light', 'dark'];
    const nextIdx = (modes.indexOf(mode) + 1) % modes.length;
    setModeState(modes[nextIdx]);
  };

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode, toggleNextMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
