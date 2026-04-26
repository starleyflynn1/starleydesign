import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { GlobalUsher } from './components/GlobalUsher';
import { TheaterHeader } from './components/TheaterHeader';
import { Theater } from 'lucide-react';
import { StagePage } from './pages/StagePage';
import { ScriptPage } from './pages/ScriptPage';
import { DirectorPage } from './pages/DirectorPage';
import { BackstagePage } from './pages/BackstagePage';
import { SHOWS } from './data/shows';
import { BOOKING_SHOWS, BOOKING_SHOWS_CATEGORY } from './data/booking-shows';
import { BOOKING_STEPS } from './data/booking-steps';
import { buildUpcomingPerformances } from './lib/performances';
import { resolveUsherDestination } from './lib/usher-routing';

export default function App() {
  const [isUsherOpen, setIsUsherOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'booking' | 'seating' | 'calendar'>('home');
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingShowOverride, setBookingShowOverride] = useState<string | undefined>(undefined);
  const resumeUrl = '/Starley-F-Resume.pdf';

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const currentPage = normalizedPath === '/script'
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
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') return;

    const syncViewWithHash = () => {
      const hash = window.location.hash;
      if (hash === '#seating-chart' || hash === '#seating') {
        setCurrentView('seating');
        return;
      }
      if (hash === '#booking-flow' || hash === '#booking') {
        setCurrentView('booking');
        return;
      }
      if (hash === '#calendar') {
        setCurrentView('calendar');
        return;
      }
      setCurrentView('home');
    };

    syncViewWithHash();
    window.addEventListener('hashchange', syncViewWithHash);
    return () => window.removeEventListener('hashchange', syncViewWithHash);
  }, []);

  const performances = useMemo(() => buildUpcomingPerformances(), []);
  const bookingShowTitles = useMemo(() => new Set(BOOKING_SHOWS.map((show) => show.title)), []);
  const hideFooterForBooking = currentPage === 'home' && currentView !== 'home';

  return (
    <ThemeProvider>
      <div className="app-root">
        <TheaterHeader onSearchClick={() => setIsUsherOpen(true)} />

      <GlobalUsher
        isOpen={isUsherOpen}
        onClose={() => setIsUsherOpen(false)}
        onSelect={(action) => {
          if (bookingShowTitles.has(action.title)) {
            setBookingShowOverride(action.title);
            setBookingStep(1);
            setCurrentView('booking');
            if (typeof window !== 'undefined') {
              const bookingUrl = `/?bookingCategory=${encodeURIComponent(
                BOOKING_SHOWS_CATEGORY
              )}&bookingShow=${encodeURIComponent(action.title)}#booking-flow`;
              window.history.replaceState(null, '', bookingUrl);
              requestAnimationFrame(() => {
                document.getElementById('booking-flow')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              });
            }
            return;
          }

          const destination = resolveUsherDestination(action);
          if (destination) {
            window.location.assign(destination);
          } else {
            console.log('Selected:', action);
          }
        }}
      />

      {currentPage === 'home' && (
        <StagePage
          shows={SHOWS}
          bookingShows={BOOKING_SHOWS}
          bookingSteps={BOOKING_STEPS}
          performances={performances}
          currentView={currentView}
          bookingStep={bookingStep}
          initialBookingShow={
            bookingShowOverride ??
            (bookingCategoryFromQuery === BOOKING_SHOWS_CATEGORY ? bookingShowFromQuery : undefined)
          }
          setCurrentView={setCurrentView}
          setBookingStep={setBookingStep}
        />
      )}

      {currentPage === 'script' && <ScriptPage resumeUrl={resumeUrl} />}
      {currentPage === 'director' && <DirectorPage />}
      {currentPage === 'backstage' && <BackstagePage />}

      {!hideFooterForBooking && (
        <footer className="app-footer">
          <div className="app-footer-inner">
            <div className="app-footer-row">
              <div className="footer-brand">
                <Theater className="icon-md-velvet" />
                <span className="footer-copy">
                  © 2026 The Designed Stage. Theater Design System by Starley Flynn.
                </span>
              </div>
              <div className="footer-links">
                <a href="/#stage" className="footer-link">
                  Stage
                </a>
                <a href="/script" className="footer-link">
                  Script
                </a>
                <a href="/director" className="footer-link">
                  Director
                </a>
                <a href="/backstage" className="footer-link">
                  Backstage
                </a>
                <a href="/backstage#accessibility-motion-control" className="footer-link">
                  Accessibility
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
    </ThemeProvider>
  );
}