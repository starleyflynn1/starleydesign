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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseColorToRgb = (color: string): [number, number, number] | null => {
  const value = color.trim().toLowerCase();
  if (!value) return null;

  if (value.startsWith('#')) {
    if (value.length === 4) {
      const r = parseInt(`${value[1]}${value[1]}`, 16);
      const g = parseInt(`${value[2]}${value[2]}`, 16);
      const b = parseInt(`${value[3]}${value[3]}`, 16);
      return [r, g, b];
    }
    if (value.length === 7) {
      const r = parseInt(value.slice(1, 3), 16);
      const g = parseInt(value.slice(3, 5), 16);
      const b = parseInt(value.slice(5, 7), 16);
      return [r, g, b];
    }
    return null;
  }

  const rgbMatch = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (!rgbMatch) return null;
  return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
};

const srgbToLinear = (channel: number) => {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
};

const calculateRelativeLuminance = (rgb: [number, number, number]) => {
  const [r, g, b] = rgb;
  const linearR = srgbToLinear(r);
  const linearG = srgbToLinear(g);
  const linearB = srgbToLinear(b);
  return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
};

const contrastRatio = (a: [number, number, number], b: [number, number, number]) => {
  const l1 = calculateRelativeLuminance(a);
  const l2 = calculateRelativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const mixRgb = (
  source: [number, number, number],
  target: [number, number, number],
  factor: number
): [number, number, number] => {
  const f = clamp(factor, 0, 1);
  return [
    Math.round(source[0] + (target[0] - source[0]) * f),
    Math.round(source[1] + (target[1] - source[1]) * f),
    Math.round(source[2] + (target[2] - source[2]) * f),
  ];
};

const rgbToCss = ([r, g, b]: [number, number, number]) => `rgb(${r} ${g} ${b})`;

const themeStyleLoaders: Record<ThemeName, () => Promise<unknown>> = {
  archive: () => import('../../styles/themes/archive.css'),
  stage: () => import('../../styles/themes/stage.css'),
  blueprint: () => import('../../styles/themes/blueprint.css'),
  coastal: () => import('../../styles/themes/coastal.css'),
  neon: () => import('../../styles/themes/neon.css'),
  terminal: () => import('../../styles/themes/terminal.css'),
};

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
      if (stored) return stored as Mode;

      const storedTheme = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeName) || 'stage';
      return themeConfigs[storedTheme].defaultMode;
    }
    return themeConfigs.stage.defaultMode;
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
  // Start empty: all theme styles (including Stage) are loaded via dynamic imports.
  // Marking Stage as preloaded prevents its CSS chunk from ever being requested.
  const loadedThemeStylesRef = useRef<Set<ThemeName>>(new Set());
  const hasRunInitialGuardrailsRef = useRef(false);

  const ensureThemeStylesLoaded = useCallback(async (theme: ThemeName) => {
    if (loadedThemeStylesRef.current.has(theme)) return;
    await themeStyleLoaders[theme]();
    loadedThemeStylesRef.current.add(theme);
  }, []);

  const getTransitionKind = useCallback((theme: ThemeName): TransitionKind => {
    if (theme === 'stage' || theme === 'neon' || theme === 'archive') return 'spotlight';
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

  const resolveVariableRgb = useCallback((variableName: string): [number, number, number] | null => {
    const resolved = window.getComputedStyle(document.documentElement).getPropertyValue(variableName);
    return parseColorToRgb(resolved);
  }, []);

  const applySemanticContrastGuardrails = useCallback(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    // Preserve Stage's art-directed palette: do not runtime-adjust primary/accent tokens.
    if (currentTheme === 'stage' || root.classList.contains('theme-stage')) {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
      return;
    }

    // Reset previous runtime overrides so we always calculate from theme defaults.
    root.style.removeProperty('--primary');
    root.style.removeProperty('--accent');

    const backgroundRgb = resolveVariableRgb('--background');
    const primaryRgb = resolveVariableRgb('--primary');
    const accentRgb = resolveVariableRgb('--accent');
    if (!backgroundRgb || !primaryRgb || !accentRgb) return;

    const adjustTokenForContrast = (tokenRgb: [number, number, number]) => {
      const minTextContrast = 4.5;
      const initialContrast = contrastRatio(tokenRgb, backgroundRgb);
      if (initialContrast >= minTextContrast) return tokenRgb;

      const backgroundLuminance = calculateRelativeLuminance(backgroundRgb);
      const target = backgroundLuminance > 0.45 ? ([0, 0, 0] as [number, number, number]) : ([255, 255, 255] as [number, number, number]);

      let best = tokenRgb;
      let bestContrast = initialContrast;
      for (let i = 1; i <= 18; i += 1) {
        const factor = i * 0.055;
        const candidate = mixRgb(tokenRgb, target, factor);
        const candidateContrast = contrastRatio(candidate, backgroundRgb);
        if (candidateContrast > bestContrast) {
          best = candidate;
          bestContrast = candidateContrast;
        }
        if (candidateContrast >= minTextContrast) break;
      }
      return best;
    };

    const adjustedPrimary = adjustTokenForContrast(primaryRgb);
    const adjustedAccent = adjustTokenForContrast(accentRgb);

    root.style.setProperty('--primary', rgbToCss(adjustedPrimary));
    root.style.setProperty('--accent', rgbToCss(adjustedAccent));
  }, [currentTheme, resolveVariableRgb]);

  const runThemeTransition = useCallback(
    (nextTheme: ThemeName, nextMode: Mode) => {
      if (typeof window === 'undefined') return;
      const root = document.documentElement;
      const kind = getTransitionKind(nextTheme);
      const shouldReduceMotion = reduceMotionEnabled;
      const x = lastPointerRef.current?.x ?? window.innerWidth / 2;
      const y = lastPointerRef.current?.y ?? window.innerHeight / 2;
      const startScrollX = window.scrollX;
      const startScrollY = window.scrollY;

      const resolveThemeBackgroundLuminance = (theme: ThemeName, currentMode: Mode) => {
        const probe = document.createElement('div');
        probe.classList.add(`theme-${theme}`);
        if (currentMode === 'dark') probe.classList.add('dark');
        probe.style.position = 'fixed';
        probe.style.inset = '0';
        probe.style.opacity = '0';
        probe.style.pointerEvents = 'none';
        probe.style.visibility = 'hidden';
        probe.style.background = 'var(--background)';
        document.body.appendChild(probe);

        const resolvedColor = window.getComputedStyle(probe).backgroundColor;
        document.body.removeChild(probe);

        const rgb = parseColorToRgb(resolvedColor);
        return rgb ? calculateRelativeLuminance(rgb) : null;
      };

      const applyLuminosityCap = (fromLuminance: number | null, toLuminance: number | null) => {
        if (fromLuminance === null || toLuminance === null) return;
        const delta = Math.abs(toLuminance - fromLuminance);
        if (delta < 0.2) return;

        // When switching from dark to bright themes, briefly darken the viewport.
        // When switching from bright to dark themes, briefly brighten it.
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '9999';
        overlay.style.background = toLuminance > fromLuminance ? '#000000' : '#ffffff';
        overlay.style.opacity = String(clamp(delta * 0.55, 0.12, 0.32));
        document.body.appendChild(overlay);

        const animation = overlay.animate(
          [{ opacity: overlay.style.opacity }, { opacity: '0' }],
          {
            duration: Math.round(520 + delta * 900),
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }
        );

        animation.finished
          .catch(() => undefined)
          .finally(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          });
      };

      const fromLuminance = resolveThemeBackgroundLuminance(currentTheme, mode);
      const toLuminance = resolveThemeBackgroundLuminance(nextTheme, nextMode);

      const restoreScrollPosition = () => {
        window.scrollTo({ left: startScrollX, top: startScrollY, behavior: 'auto' });
      };

      const animateRootFallback = () => {
        if (kind === 'spotlight') {
          const maxX = Math.max(x, window.innerWidth - x);
          const maxY = Math.max(y, window.innerHeight - y);
          const radius = Math.hypot(maxX, maxY);
          root.animate(
            [
              {
                clipPath: `circle(0px at ${x}px ${y}px)`,
                filter: 'brightness(1.12) contrast(1.06) saturate(1.08) blur(2.2px)',
              },
              {
                clipPath: `circle(${Math.round(radius * 0.9)}px at ${x}px ${y}px)`,
                filter: 'brightness(1.04) contrast(1.02) saturate(1.03) blur(1.2px)',
                offset: 0.68,
              },
              {
                clipPath: `circle(${Math.round(radius * 1.16)}px at ${x}px ${y}px)`,
                filter: 'brightness(1.01) contrast(1.005) saturate(1.01) blur(0.5px)',
                offset: 0.9,
              },
              {
                clipPath: `circle(${Math.round(radius * 1.42)}px at ${x}px ${y}px)`,
                filter: 'brightness(1) contrast(1) saturate(1) blur(0px)',
              },
            ],
            {
              duration: 1750,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }
          );
          return;
        }

        if (kind === 'crt') {
          root.animate(
            [
              { transform: 'translateX(3px)', filter: 'contrast(1.06)' },
              { transform: 'translateX(-3px)', filter: 'contrast(1.1)' },
              { transform: 'translateX(1px)', filter: 'contrast(1.03)' },
              { transform: 'translateX(0px)', filter: 'contrast(1)' },
            ],
            {
              duration: 520,
              easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            }
          );
          // Prevent viewport jump during CRT transition.
          requestAnimationFrame(() => requestAnimationFrame(restoreScrollPosition));
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
          [{ opacity: 0.72, filter: 'saturate(0.92) contrast(1.03)' }, { opacity: 1, filter: 'saturate(1) contrast(1)' }],
          { duration: 700, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
        );
      };

      const applyState = () => {
        flushSync(() => {
          setCurrentTheme(nextTheme);
          setModeState(nextMode);
        });
        ensureThemeStylesLoaded(nextTheme)
          .catch(() => undefined)
          .finally(() => {
            applyRootTheme(nextTheme, nextMode);
            applySemanticContrastGuardrails();
          });
        if (kind === 'crt') {
          requestAnimationFrame(() => restoreScrollPosition());
        }
      };
      if (shouldReduceMotion) {
        applyState();
        return;
      }
      // Deterministic path: always use one animation mechanism.
      applyState();
      applyLuminosityCap(fromLuminance, toLuminance);
      animateRootFallback();
    },
    [applyRootTheme, applySemanticContrastGuardrails, currentTheme, ensureThemeStylesLoaded, getTransitionKind, mode, reduceMotionEnabled]
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
    let cancelled = false;
    ensureThemeStylesLoaded(currentTheme)
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
        applyRootTheme(currentTheme, mode);
        const runGuardrails = () => {
          if (cancelled) return;
          applySemanticContrastGuardrails();
        };
        const schedule = () => {
          if ('requestIdleCallback' in window) {
            (window as Window & { requestIdleCallback: (cb: IdleRequestCallback) => number }).requestIdleCallback(
              () => runGuardrails()
            );
          } else {
            window.setTimeout(runGuardrails, 0);
          }
        };

        if (!hasRunInitialGuardrailsRef.current) {
          hasRunInitialGuardrailsRef.current = true;
          window.setTimeout(schedule, 1800);
          return;
        }
        schedule();
      });

    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    localStorage.setItem(REDUCE_MOTION_STORAGE_KEY, String(reduceMotionEnabled));
    return () => {
      cancelled = true;
    };
  }, [currentTheme, mode, reduceMotionEnabled, applyRootTheme, applySemanticContrastGuardrails, ensureThemeStylesLoaded]);

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
