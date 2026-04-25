import React from 'react';
import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { ThemeName, Mode, themeConfigs, ThemeConfig } from './theme-config';

interface ThemeContextValue {
  currentTheme: ThemeName;
  mode: Mode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  motionEnabled: boolean;
  toggleMotion: () => void;
  reduceMotionEnabled: boolean;
  toggleReduceMotion: () => void;
  themeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'theater-theme';
const MODE_STORAGE_KEY = 'theater-mode';
const REDUCE_MOTION_STORAGE_KEY = 'theater-reduce-motion';

type TransitionKind = 'spotlight' | 'crt' | 'atmospheric' | 'default';

interface ViewTransitionLike {
  ready: Promise<void>;
  finished: Promise<void>;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return (stored as ThemeName) || 'archive';
    }
    return 'archive';
  });

  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MODE_STORAGE_KEY);
      if (stored) return stored as Mode;

      const storedTheme = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeName) || 'archive';
      return themeConfigs[storedTheme].defaultMode;
    }
    return themeConfigs.archive.defaultMode;
  });
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(REDUCE_MOTION_STORAGE_KEY);
      if (stored !== null) return stored === 'true';
      // Auto-detect OS/browser reduced-motion preference for first-time users.
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  const getTransitionKind = useCallback((theme: ThemeName): TransitionKind => {
    if (theme === 'stage' || theme === 'neon') return 'spotlight';
    if (theme === 'terminal' || theme === 'blueprint') return 'crt';
    if (theme === 'coastal') return 'atmospheric';
    return 'default';
  }, []);

  const applyRootTheme = useCallback((theme: ThemeName, currentMode: Mode) => {
    const root = document.documentElement;
    Object.keys(themeConfigs).forEach((themeName) => {
      root.classList.remove(`theme-${themeName}`);
    });
    root.classList.add(`theme-${theme}`);
    if (currentMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const runThemeTransition = useCallback(
    (nextTheme: ThemeName, nextMode: Mode) => {
      if (typeof window === 'undefined') return;
      const root = document.documentElement;
      const kind = getTransitionKind(nextTheme);
      const shouldReduceMotion = reduceMotionEnabled;
      const x = lastPointerRef.current?.x ?? window.innerWidth / 2;
      const y = lastPointerRef.current?.y ?? window.innerHeight / 2;

      const animateRootFallback = () => {
        if (kind === 'spotlight') {
          const maxX = Math.max(x, window.innerWidth - x);
          const maxY = Math.max(y, window.innerHeight - y);
          const radius = Math.hypot(maxX, maxY);
          root.animate(
            {
              clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
              filter: ['brightness(1.4) contrast(1.2) saturate(1.28)', 'brightness(1) contrast(1) saturate(1)'],
            },
            {
              duration: 1800,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }
          );
          return;
        }

        if (kind === 'crt') {
          root.animate(
            [
              { filter: 'brightness(1.7) contrast(1.55) saturate(1.2)', transform: 'skewX(2.4deg) translateX(2px)', opacity: 0.5 },
              { filter: 'brightness(0.62) contrast(1.65) saturate(0.86)', transform: 'skewX(-1.6deg) translateX(-2px)', opacity: 0.85 },
              { filter: 'brightness(1) contrast(1)', transform: 'skewX(0deg)', opacity: 1 },
            ],
            {
              duration: 800,
              easing: 'steps(2, end)',
            }
          );
          return;
        }

        if (kind === 'atmospheric') {
          root.animate(
            [
              { filter: 'blur(18px) saturate(0.45) contrast(1.1)', opacity: 0.35 },
              { filter: 'blur(6px) saturate(0.72) contrast(1.04)', opacity: 0.74 },
              { filter: 'blur(0px) saturate(1)', opacity: 1 },
            ],
            {
              duration: 1280,
              easing: 'ease-out',
            }
          );
          return;
        }

        root.animate(
          [{ opacity: 0.5, filter: 'saturate(0.8) contrast(1.08)' }, { opacity: 1, filter: 'saturate(1) contrast(1)' }],
          { duration: 920, easing: 'ease-out' }
        );
      };

      const applyState = () => {
        flushSync(() => {
          setCurrentTheme(nextTheme);
          setModeState(nextMode);
        });
        applyRootTheme(nextTheme, nextMode);
      };
      if (shouldReduceMotion) {
        applyState();
        return;
      }
      // Deterministic path: always use one animation mechanism.
      applyState();
      animateRootFallback();
    },
    [applyRootTheme, getTransitionKind, reduceMotionEnabled]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePointerDown = (event: PointerEvent) => {
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    applyRootTheme(currentTheme, mode);

    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    localStorage.setItem(REDUCE_MOTION_STORAGE_KEY, String(reduceMotionEnabled));
  }, [currentTheme, mode, reduceMotionEnabled, applyRootTheme]);

  const setTheme = (theme: ThemeName) => {
    runThemeTransition(theme, themeConfigs[theme].defaultMode);
  };

  const setMode = (newMode: Mode) => {
    runThemeTransition(currentTheme, newMode);
  };

  const toggleMode = () => {
    runThemeTransition(currentTheme, mode === 'light' ? 'dark' : 'light');
  };
  const toggleReduceMotion = () => {
    setReduceMotionEnabled((prev) => !prev);
  };
  const toggleMotion = () => {
    setReduceMotionEnabled((prev) => !prev);
  };

  const value: ThemeContextValue = {
    currentTheme,
    mode,
    setTheme,
    setMode,
    toggleMode,
    motionEnabled: !reduceMotionEnabled,
    toggleMotion,
    reduceMotionEnabled,
    toggleReduceMotion,
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
