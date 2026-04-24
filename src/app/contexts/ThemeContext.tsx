import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeName, Mode, themeConfigs, ThemeConfig } from './theme-config';

interface ThemeContextValue {
  currentTheme: ThemeName;
  mode: Mode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  themeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'theater-theme';
const MODE_STORAGE_KEY = 'theater-mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return (stored as ThemeName) || 'stage';
    }
    return 'stage';
  });

  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MODE_STORAGE_KEY);
      return (stored as Mode) || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    Object.keys(themeConfigs).forEach((theme) => {
      root.classList.remove(`theme-${theme}`);
    });

    root.classList.add(`theme-${currentTheme}`);

    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [currentTheme, mode]);

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
  };

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const value: ThemeContextValue = {
    currentTheme,
    mode,
    setTheme,
    setMode,
    toggleMode,
    themeConfig: themeConfigs[currentTheme],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
