import React from 'react';
import { flushSync, createPortal } from 'react-dom';
import { Suspense, lazy, useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { TheaterHeader } from './components/TheaterHeader';
import { TheaterIcon } from './components/AppIcons';
import { BOOKING_SHOWS_CATEGORY, BOOKING_STEP_COUNT } from './data/booking-constants';
import { readHomeViewFromLocation } from './lib/home-view';
import { BOOKING_SHOW_TITLES, resolveUsherDestination } from './lib/usher-routing';

const HomeStageHost = lazy(() =>
  import('./HomeStageHost').then((module) => ({ default: module.HomeStageHost }))
);
const ScriptPage = lazy(() => import('./pages/ScriptPage').then((module) => ({ default: module.ScriptPage })));
const DirectorPage = lazy(() => import('./pages/DirectorPage').then((module) => ({ default: module.DirectorPage })));
const BackstagePage = lazy(() => import('./pages/BackstagePage').then((module) => ({ default: module.BackstagePage })));
const GlobalUsher = lazy(() =>
  import('./components/GlobalUsher').then((module) => ({ default: module.GlobalUsher }))
);
export default function App() {
  const [isUsherOpen, setIsUsherOpen] = useState(false);
  const [currentView, setCurrentView] = useState(readHomeViewFromLocation);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingShowOverride, setBookingShowOverride] = useState<string | undefined>(undefined);
  const [isExitBookingDialogOpen, setIsExitBookingDialogOpen] = useState(false);
  const [pendingExitHref, setPendingExitHref] = useState<string | null>(null);
  const [exitDialogAnchorTop, setExitDialogAnchorTop] = useState<number | null>(null);
  const isPageTransitioningRef = useRef(false);
  /** Snapshot scroll when exit confirmation opens — restore in layout effect to avoid jump from scroll lock. */
  const exitDialogScrollYRef = useRef(0);
  const resumeUrl = '/Starley-F-Resume.pdf';

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const currentPage =
    normalizedPath === '/script'
      ? 'script'
      : normalizedPath === '/director'
        ? 'director'
        : normalizedPath === '/backstage'
          ? 'backstage'
          : 'home';
  const bookingShowFromQuery =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('bookingShow') ?? undefined
      : undefined;
  const bookingCategoryFromQuery =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('bookingCategory') ?? undefined
      : undefined;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsUsherOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') return;
    if (window.location.hash) return;

    // Default entry section for the main page.
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#stage`);
    setCurrentView('home');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') return;

    const syncViewWithHash = () => {
      setCurrentView(readHomeViewFromLocation());
    };

    syncViewWithHash();
    window.addEventListener('hashchange', syncViewWithHash);
    return () => window.removeEventListener('hashchange', syncViewWithHash);
  }, []);

  useEffect(() => {
    if (currentPage !== 'home' || typeof window === 'undefined') return;
    const prefetchHome = () => {
      void import('./HomeStageHost');
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const idleId = w.requestIdleCallback(prefetchHome, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(idleId);
    }
    const timeoutId = globalThis.setTimeout(prefetchHome, 1200);
    return () => globalThis.clearTimeout(timeoutId);
  }, [currentPage]);
  const isBookingFlowActive = currentPage === 'home' && currentView === 'booking';
  const hideFooterForBooking = currentPage === 'home' && currentView === 'booking';
  const runUsherSpotlightTransition = useCallback((navigate: () => void) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      navigate();
      return;
    }

    const reduceMotionSetting = localStorage.getItem('theater-reduce-motion') === 'true';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotionSetting || prefersReducedMotion) {
      navigate();
      return;
    }

    const overlay = document.createElement('div');
    const originX = Math.round(window.innerWidth / 2);
    const originY = Math.round(window.innerHeight * 0.2);
    const radius = Math.hypot(Math.max(originX, window.innerWidth - originX), Math.max(originY, window.innerHeight - originY));
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';
    overlay.style.background = `radial-gradient(circle at ${originX}px ${originY}px, color-mix(in oklab, var(--spotlight) 34%, transparent) 0%, color-mix(in oklab, var(--spotlight) 14%, transparent) 42%, transparent 70%)`;
    overlay.style.clipPath = `circle(0px at ${originX}px ${originY}px)`;
    overlay.style.opacity = '0.92';
    document.body.appendChild(overlay);

    const reveal = overlay.animate(
      [
        { clipPath: `circle(0px at ${originX}px ${originY}px)`, opacity: 0.98, filter: 'blur(3.6px) saturate(1.12) brightness(1.08)' },
        {
          clipPath: `circle(${Math.round(radius * 0.28)}px at ${originX}px ${originY}px)`,
          opacity: 0.93,
          filter: 'blur(2.8px) saturate(1.1) brightness(1.06)',
          offset: 0.24,
        },
        {
          clipPath: `circle(${Math.round(radius * 0.78)}px at ${originX}px ${originY}px)`,
          opacity: 0.76,
          filter: 'blur(1.5px) saturate(1.05) brightness(1.03)',
          offset: 0.62,
        },
        { clipPath: `circle(${Math.round(radius * 1.28)}px at ${originX}px ${originY}px)`, opacity: 0, filter: 'blur(0px) saturate(1) brightness(1)' },
      ],
      {
        duration: 2400,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      }
    );

    window.setTimeout(() => {
      navigate();
    }, 420);

    reveal.finished
      .catch(() => undefined)
      .finally(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      });
  }, []);

  const exitBookingFlow = useCallback(
    (href?: string | null) => {
      const execute = () => {
        setBookingStep(1);
        setBookingShowOverride(undefined);

        if (typeof window === 'undefined') return;
        if (!href || href === '/#stage') {
          /** Keep viewport position: URL #stage + layout updates can trigger anchor scroll or scroll anchoring. */
          const prevScrollY = window.scrollY;
          setCurrentView('home');
          window.history.replaceState(null, '', '/#stage');
          const restoreScroll = () => {
            window.scrollTo({ top: prevScrollY, left: 0, behavior: 'auto' });
          };
          queueMicrotask(restoreScroll);
          requestAnimationFrame(() => {
            restoreScroll();
            requestAnimationFrame(restoreScroll);
          });
          return;
        }
        if (href.includes('#seating')) {
          flushSync(() => {
            setCurrentView('seating');
          });
          window.history.replaceState(null, '', '/#seating');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              document.getElementById('booking-flow')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            });
          });
          return;
        }
        if (href.includes('#calendar')) {
          flushSync(() => {
            setCurrentView('calendar');
          });
          window.history.replaceState(null, '', '/#calendar');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              document.getElementById('booking-flow')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            });
          });
          return;
        }
        setCurrentView('home');
        window.location.assign(href);
      };

      if (typeof window === 'undefined') {
        execute();
        return;
      }
      const isBookingExitToStage = isBookingFlowActive && (!href || href === '/#stage');
      if (isBookingExitToStage) {
        execute();
        return;
      }
      runUsherSpotlightTransition(execute);
    },
    [isBookingFlowActive, runUsherSpotlightTransition]
  );
  const confirmExitBooking = useCallback(
    (href: string) => {
      if (!isBookingFlowActive) return true;
      if (bookingStep >= BOOKING_STEP_COUNT) return true;
      if (href.includes('#booking-flow') || href.includes('#booking')) {
        return true;
      }
      if (typeof window !== 'undefined') {
        exitDialogScrollYRef.current = window.scrollY;
      }
      setPendingExitHref(href);
      setIsExitBookingDialogOpen(true);
      return false;
    },
    [bookingStep, isBookingFlowActive]
  );
  const handleConfirmExitBooking = useCallback(() => {
    const href = pendingExitHref;
    setIsExitBookingDialogOpen(false);
    setPendingExitHref(null);
    exitBookingFlow(href);
  }, [exitBookingFlow, pendingExitHref]);
  const handleCancelExitBooking = useCallback(() => {
    setIsExitBookingDialogOpen(false);
    setPendingExitHref(null);
  }, []);
  useEffect(() => {
    if (!isBookingFlowActive) return;

    const handleEscapeExit = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isUsherOpen || isExitBookingDialogOpen) return;
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      if (confirmExitBooking('/#stage')) {
        exitBookingFlow('/#stage');
      }
    };

    window.addEventListener('keydown', handleEscapeExit);
    return () => window.removeEventListener('keydown', handleEscapeExit);
  }, [confirmExitBooking, exitBookingFlow, isBookingFlowActive, isExitBookingDialogOpen, isUsherOpen]);
  useEffect(() => {
    if (!isExitBookingDialogOpen) return;

    const handleEscapeCloseDialog = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      handleCancelExitBooking();
    };

    window.addEventListener('keydown', handleEscapeCloseDialog);
    return () => window.removeEventListener('keydown', handleEscapeCloseDialog);
  }, [handleCancelExitBooking, isExitBookingDialogOpen]);
  useEffect(() => {
    if (!isExitBookingDialogOpen || typeof window === 'undefined') {
      setExitDialogAnchorTop(null);
      return;
    }

    const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobileViewport) {
      setExitDialogAnchorTop(null);
      return;
    }

    let anchorRaf = 0;
    const updateExitDialogAnchor = () => {
      cancelAnimationFrame(anchorRaf);
      anchorRaf = requestAnimationFrame(() => {
        anchorRaf = 0;
        const bookingFlow = document.getElementById('booking-flow');
        const header = document.querySelector('.theater-header') as HTMLElement | null;
        const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
        const bookingFlowRect = bookingFlow?.getBoundingClientRect();
        const viewportPadding = 16;
        const estimatedDialogHeight = 232;
        const visibleFlowTop = bookingFlowRect
          ? Math.max(bookingFlowRect.top, headerBottom + viewportPadding)
          : headerBottom + viewportPadding;
        const visibleFlowBottom = bookingFlowRect
          ? Math.min(bookingFlowRect.bottom, window.innerHeight - viewportPadding)
          : window.innerHeight - viewportPadding;
        const visibleFlowHeight = Math.max(0, visibleFlowBottom - visibleFlowTop);
        const centeredWithinFlow = visibleFlowTop + Math.max(0, (visibleFlowHeight - estimatedDialogHeight) / 2);
        const fallbackTop = Math.max(headerBottom + 28, 112);
        const maxTop = Math.max(viewportPadding, window.innerHeight - estimatedDialogHeight - viewportPadding);
        const anchoredTop = visibleFlowHeight > 0 ? centeredWithinFlow : fallbackTop;

        setExitDialogAnchorTop(Math.round(Math.max(fallbackTop, Math.min(anchoredTop, maxTop))));
      });
    };

    updateExitDialogAnchor();
    window.addEventListener('scroll', updateExitDialogAnchor, { passive: true });
    window.addEventListener('resize', updateExitDialogAnchor);
    return () => {
      cancelAnimationFrame(anchorRaf);
      window.removeEventListener('scroll', updateExitDialogAnchor);
      window.removeEventListener('resize', updateExitDialogAnchor);
    };
  }, [isExitBookingDialogOpen]);
  useLayoutEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    if (!isExitBookingDialogOpen) return;

    const html = document.documentElement;
    const body = document.body;
    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);

    const previousOverflow = body.style.overflow;
    const previousTouchAction = body.style.touchAction;
    const previousPaddingRight = body.style.paddingRight;

    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const y = exitDialogScrollYRef.current;
    window.scrollTo({ top: y, left: 0, behavior: 'auto' });

    return () => {
      body.style.overflow = previousOverflow;
      body.style.touchAction = previousTouchAction;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isExitBookingDialogOpen]);

  const runThemeMatchedPageTransition = useCallback((destination: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    if (isPageTransitioningRef.current) return;
    isPageTransitioningRef.current = true;

    const reduceMotionSetting = localStorage.getItem('theater-reduce-motion') === 'true';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotionSetting || prefersReducedMotion) {
      window.location.assign(destination);
      return;
    }

    const root = document.documentElement;
    const navigate = () => window.location.assign(destination);
    const isDarkMode = root.classList.contains('dark');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isDarkMode) {
      // Dark-mode transitions should fade toward black to avoid a bright flash.
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '9999';
      overlay.style.background = '#05070d';
      overlay.style.opacity = '0';
      document.body.appendChild(overlay);

      overlay.animate(
        [
          { opacity: 0 },
          { opacity: isMobile ? 0.5 : 0.42 },
        ],
        {
          duration: isMobile ? 220 : 180,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          fill: 'forwards',
        }
      );
      root.animate(
        [
          { filter: 'blur(0px) contrast(1)', opacity: 1 },
          { filter: 'blur(4px) contrast(0.98)', opacity: 0.9 },
        ],
        {
          duration: isMobile ? 220 : 180,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          fill: 'forwards',
        }
      );
      window.setTimeout(navigate, isMobile ? 130 : 110);
      return;
    }

    // Use one consistent cross-theme transition to avoid flash/jitter
    // from effect switching across routes and devices.
    root.animate(
      [
        { filter: 'blur(0px) saturate(1) contrast(1)', opacity: 1, transform: 'scale(1)' },
        { filter: 'blur(14px) saturate(0.92) contrast(1.02)', opacity: 0.56, transform: 'scale(0.992)' },
      ],
      {
        duration: 220,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        fill: 'forwards',
      }
    );
    window.setTimeout(navigate, 130);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const normalizePath = (value: string) => value.replace(/\/+$/, '') || '/';
    const isAppPagePath = (value: string) =>
      value === '/' || value === '/script' || value === '/director' || value === '/backstage';

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      const targetPath = normalizePath(url.pathname);
      const currentPath = normalizePath(window.location.pathname);
      if (!isAppPagePath(targetPath)) return;
      if (targetPath === currentPath) {
        if (url.hash === '#stage') {
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          if (isExitBookingDialogOpen) {
            event.preventDefault();
            return;
          }
          /**
           * Same-path links do not run confirmExitBooking below; without preventDefault the browser
           * performs the default hash navigation and scrolls to #stage (often smoothly).
           */
          if (isBookingFlowActive) {
            if (!confirmExitBooking('/#stage')) {
              event.preventDefault();
              return;
            }
            event.preventDefault();
            exitBookingFlow('/#stage');
            return;
          }
        }
        return;
      }

      const destination = `${targetPath}${url.search}${url.hash}`;
      if (!confirmExitBooking(destination)) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      runThemeMatchedPageTransition(destination);
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [
    confirmExitBooking,
    exitBookingFlow,
    isBookingFlowActive,
    isExitBookingDialogOpen,
    runThemeMatchedPageTransition,
  ]);

  return (
    <ThemeProvider>
      <div className={`app-root ${hideFooterForBooking ? '' : 'app-root--has-footer'}`}>
        <TheaterHeader onSearchClick={() => setIsUsherOpen(true)} onNavigate={confirmExitBooking} />

      <Suspense fallback={null}>
        {isUsherOpen && (
          <GlobalUsher
            isOpen={isUsherOpen}
            onClose={() => setIsUsherOpen(false)}
            onSelect={(action) => {
              if (BOOKING_SHOW_TITLES.has(action.title)) {
                runUsherSpotlightTransition(() => {
                  if (typeof window !== 'undefined') {
                    const bookingUrl = `/?bookingCategory=${encodeURIComponent(
                      BOOKING_SHOWS_CATEGORY
                    )}&bookingShow=${encodeURIComponent(action.title)}#booking-flow`;
                    window.history.replaceState(null, '', bookingUrl);
                    flushSync(() => {
                      setBookingShowOverride(action.title);
                      setBookingStep(1);
                      setCurrentView('booking');
                    });
                    requestAnimationFrame(() => {
                      document.getElementById('booking-flow')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    });
                  } else {
                    setBookingShowOverride(action.title);
                    setBookingStep(1);
                    setCurrentView('booking');
                  }
                });
                return;
              }

              const destination = resolveUsherDestination(action);
              if (destination && destination.startsWith('/#')) {
                runUsherSpotlightTransition(() => {
                  const hash = destination.slice(1);
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', destination);
                    flushSync(() => {
                      if (hash === '#seating-chart' || hash === '#seating') {
                        setCurrentView('seating');
                      } else if (hash === '#booking-flow' || hash === '#booking') {
                        setCurrentView('booking');
                      } else if (hash === '#calendar') {
                        setCurrentView('calendar');
                      } else {
                        setCurrentView('home');
                      }
                    });
                    requestAnimationFrame(() => {
                      const usePanelTop =
                        hash === '#seating-chart' || hash === '#seating' || hash === '#calendar';
                      const target = usePanelTop
                        ? document.getElementById('booking-flow')
                        : document.querySelector(hash);
                      target?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    });
                  } else {
                    if (hash === '#seating-chart' || hash === '#seating') {
                      setCurrentView('seating');
                    } else if (hash === '#booking-flow' || hash === '#booking') {
                      setCurrentView('booking');
                    } else if (hash === '#calendar') {
                      setCurrentView('calendar');
                    } else {
                      setCurrentView('home');
                    }
                  }
                });
              } else if (destination) {
                runUsherSpotlightTransition(() => {
                  window.location.assign(destination);
                });
              } else {
                console.log('Selected:', action);
              }
            }}
          />
        )}
      </Suspense>
      {typeof document !== 'undefined' &&
        isExitBookingDialogOpen &&
        createPortal(
          <div
            className="booking-exit-dialog-wrap"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-booking-title"
          >
            <button
              className="booking-exit-dialog-backdrop"
              type="button"
              aria-label="Close exit booking dialog"
              onClick={handleCancelExitBooking}
            />
            <div
              className="booking-exit-dialog-card"
              style={
                exitDialogAnchorTop !== null
                  ? ({
                      position: 'fixed',
                      top: `${exitDialogAnchorTop}px`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 'calc(100% - 1.5rem)',
                      maxWidth: '24rem',
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <h2 id="exit-booking-title" className="booking-exit-dialog-title">
                Exit Booking?
              </h2>
              <p className="booking-exit-dialog-copy">
                Your current booking progress will be cleared.
              </p>
              <div className="booking-exit-dialog-actions">
                <button type="button" className="booking-exit-dialog-btn booking-exit-dialog-btn-secondary" onClick={handleCancelExitBooking}>
                  Stay
                </button>
                <button type="button" className="booking-exit-dialog-btn booking-exit-dialog-btn-primary" onClick={handleConfirmExitBooking}>
                  Exit
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {currentPage === 'home' && (
        <Suspense fallback={null}>
          <HomeStageHost
            currentView={currentView}
            bookingStep={bookingStep}
            initialBookingShow={
              bookingShowOverride ??
              (bookingCategoryFromQuery === BOOKING_SHOWS_CATEGORY ? bookingShowFromQuery : undefined)
            }
            confirmExitNavigation={confirmExitBooking}
            runSpotlightTransition={runUsherSpotlightTransition}
            setCurrentView={setCurrentView}
            setBookingStep={setBookingStep}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        {currentPage === 'script' && <ScriptPage resumeUrl={resumeUrl} />}
        {currentPage === 'director' && <DirectorPage />}
        {currentPage === 'backstage' && <BackstagePage />}
      </Suspense>

      <footer
        className={`app-footer ${hideFooterForBooking ? 'app-footer--collapsed' : ''}`}
        aria-hidden={hideFooterForBooking}
      >
        <div className="app-footer-inner">
          <div className="app-footer-row">
            <div className="footer-brand">
              <TheaterIcon className="icon-md-velvet" />
              <p className="footer-copy">
                <span className="footer-copy-lead">© 2026 Starley Flynn</span>
              </p>
            </div>
            <div className="footer-links">
              <a href="/#stage" className="footer-link" tabIndex={hideFooterForBooking ? -1 : undefined}>
                Stage
              </a>
              <a href="/script" className="footer-link" tabIndex={hideFooterForBooking ? -1 : undefined}>
                Script
              </a>
              <a href="/backstage" className="footer-link" tabIndex={hideFooterForBooking ? -1 : undefined}>
                Backstage
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </ThemeProvider>
  );
}