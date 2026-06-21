import React, { useEffect, useState } from 'react';
import { StagePage } from './pages/StagePage';
import { SHOWS } from './data/shows';
import { BOOKING_SHOWS } from './data/booking-shows';
import { BOOKING_STEPS } from './data/booking-steps';
import { buildUpcomingPerformances } from './lib/performances';
import { Performance } from './data/types';

type HomeView = 'home' | 'booking' | 'seating' | 'calendar' | 'prompter';

export interface HomeStageHostProps {
  currentView: HomeView;
  bookingStep: number;
  initialBookingShow?: string;
  confirmExitNavigation?: (href: string) => boolean;
  runSpotlightTransition?: (navigate: () => void) => void;
  setCurrentView: (view: HomeView) => void;
  setBookingStep: (step: number) => void;
}

export function HomeStageHost({
  currentView,
  bookingStep,
  initialBookingShow,
  confirmExitNavigation,
  runSpotlightTransition,
  setCurrentView,
  setBookingStep,
}: HomeStageHostProps) {
  const [performances, setPerformances] = useState<Performance[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setPerformances(buildUpcomingPerformances());
      return;
    }
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      setPerformances(buildUpcomingPerformances());
    };

    if ('requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: IdleRequestCallback) => number })
        .requestIdleCallback(() => run());
      return () => {
        cancelled = true;
        (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(run, 0);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <StagePage
      shows={SHOWS}
      bookingShows={BOOKING_SHOWS}
      bookingSteps={BOOKING_STEPS}
      performances={performances}
      currentView={currentView}
      bookingStep={bookingStep}
      initialBookingShow={initialBookingShow}
      confirmExitNavigation={confirmExitNavigation}
      runSpotlightTransition={runSpotlightTransition}
      setCurrentView={setCurrentView}
      setBookingStep={setBookingStep}
    />
  );
}
