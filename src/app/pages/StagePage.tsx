import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { InfoIcon, TheaterIcon } from '../components/AppIcons';
import { ShowCard } from '../components/ShowCard';
import { BookingStep, Performance, Show } from '../data/types';

const SeatingChart = lazy(() =>
  import('../components/SeatingChart').then((module) => ({ default: module.SeatingChart }))
);
const BookingProgress = lazy(() =>
  import('../components/BookingProgress').then((module) => ({ default: module.BookingProgress }))
);
const PerformanceCalendar = lazy(() =>
  import('../components/PerformanceCalendar').then((module) => ({ default: module.PerformanceCalendar }))
);

interface StagePageProps {
  shows: Show[];
  bookingShows: Show[];
  bookingSteps: BookingStep[];
  performances: Performance[];
  currentView: 'home' | 'booking' | 'seating' | 'calendar';
  bookingStep: number;
  initialBookingShow?: string;
  confirmExitNavigation?: (href: string) => boolean;
  runSpotlightTransition?: (navigate: () => void) => void;
  setCurrentView: (view: 'home' | 'booking' | 'seating' | 'calendar') => void;
  setBookingStep: (step: number) => void;
}

export function StagePage({
  shows,
  bookingShows,
  bookingSteps,
  performances,
  currentView,
  bookingStep,
  initialBookingShow,
  confirmExitNavigation,
  runSpotlightTransition = (navigate) => {
    navigate();
  },
  setCurrentView,
  setBookingStep,
}: StagePageProps) {
  const bookingStepPanelRef = useRef<HTMLDivElement | null>(null);
  const stagePinchTargetRef = useRef<HTMLDivElement | null>(null);
  const stagePinchStartDistanceRef = useRef<number | null>(null);
  const stagePinchStartScaleRef = useRef(1);
  const isStagePinchingRef = useRef(false);
  const gestureStartScaleRef = useRef(1);
  const [stageScale, setStageScale] = useState(1);
  const stageScaleRef = useRef(stageScale);
  useEffect(() => {
    stageScaleRef.current = stageScale;
  }, [stageScale]);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = () => setIsMobileViewport(mq.matches);
    mq.addEventListener('change', onChange);
    setIsMobileViewport(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const isComponentFocusMode = currentView === 'booking';
  const isBookingNoScrollMode = currentView === 'booking';
  const showTitles = useMemo(() => bookingShows.map((show) => show.title), [bookingShows]);
  const defaultBookingShow =
    initialBookingShow && showTitles.includes(initialBookingShow)
      ? initialBookingShow
      : bookingShows[0]?.title ?? '';
  const [selectedShowTitle, setSelectedShowTitle] = useState(defaultBookingShow);
  const [selectedPerformance, setSelectedPerformance] = useState<{
    date: Date;
    time: string;
    type: 'matinee' | 'evening';
  } | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [selectedSeatTotal, setSelectedSeatTotal] = useState(0);
  const [seatBalanceDue, setSeatBalanceDue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [nextStepHint, setNextStepHint] = useState<string | null>(null);
  const nextStepHintTimeoutRef = useRef<number | null>(null);
  const [bookingTicketCount, setBookingTicketCount] = useState(2);
  const [suggestRequestKey, setSuggestRequestKey] = useState(0);
  const [resetRequestKey, setResetRequestKey] = useState(0);
  /** Defer main-tab SeatingChart chunk until idle so it is not chained right after the entry script (Lighthouse critical path). */
  const [deferredSeatingTabReady, setDeferredSeatingTabReady] = useState(false);

  useEffect(() => {
    if (currentView !== 'seating') {
      setDeferredSeatingTabReady(false);
      return;
    }
    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setDeferredSeatingTabReady(true);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(markReady, { timeout: 2000 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const timeoutId = window.setTimeout(markReady, 1);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [currentView]);

  useEffect(() => {
    if (initialBookingShow && showTitles.includes(initialBookingShow)) {
      setSelectedShowTitle(initialBookingShow);
      setBookingStep(1);
      setCurrentView('booking');
    }
  }, [initialBookingShow, setBookingStep, setCurrentView, showTitles]);

  useEffect(() => {
    setSelectedPerformance(null);
    setSelectedSeatIds([]);
    setSelectedSeatTotal(0);
    setSeatBalanceDue(0);
    setTotalPaid(0);
    setBookingTicketCount(2);
    setSuggestRequestKey(0);
    setResetRequestKey(0);
  }, [selectedShowTitle]);
  useEffect(() => {
    return () => {
      if (nextStepHintTimeoutRef.current) {
        window.clearTimeout(nextStepHintTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (bookingStep !== 3 || selectedSeatIds.length === 0) return;
    setNextStepHint(null);
    if (nextStepHintTimeoutRef.current) {
      window.clearTimeout(nextStepHintTimeoutRef.current);
      nextStepHintTimeoutRef.current = null;
    }
  }, [bookingStep, selectedSeatIds.length]);

  const canAdvanceFromStep =
    bookingStep === 1
      ? Boolean(selectedShowTitle)
      : bookingStep === 2
      ? Boolean(selectedPerformance)
      : bookingStep === 3
      ? selectedSeatIds.length > 0
      : bookingStep === 4;

  const selectedShow = bookingShows.find((show) => show.title === selectedShowTitle);
  const bookingProgressSteps = useMemo(() => {
    const formattedDateTime = selectedPerformance
      ? `${selectedPerformance.date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}, ${selectedPerformance.time}`
      : 'Select date & time';
    const paymentCompleted = seatBalanceDue > 0 && totalPaid >= seatBalanceDue;
    const seatSummary =
      selectedSeatIds.length > 0
        ? `${selectedSeatIds.length} Seat${selectedSeatIds.length === 1 ? '' : 's'} Selected`
        : 'Select seats';

    return bookingSteps.map((step) => {
      if (step.number === 1) {
        return {
          ...step,
          description: selectedShowTitle ? selectedShowTitle : 'Select production',
        };
      }
      if (step.number === 2) {
        return {
          ...step,
          description: formattedDateTime,
        };
      }
      if (step.number === 3) {
        return {
          ...step,
          description: seatSummary,
        };
      }
      if (step.number === 4) {
        return {
          ...step,
          description: paymentCompleted
            ? 'Paid in full'
            : seatBalanceDue > 0
            ? `$${seatBalanceDue.toFixed(2)} due`
            : 'Mock checkout',
        };
      }
      if (step.number === 5) {
        return {
          ...step,
          description: 'Enjoy the show!',
        };
      }
      return step;
    });
  }, [bookingSteps, seatBalanceDue, selectedPerformance, selectedSeatIds.length, selectedShowTitle, totalPaid]);
  const bookingCalendarPerformances = useMemo(() => {
    if (!selectedShow) return performances;
    const isComingSoon = selectedShow.date.toLowerCase().includes('coming soon');
    if (!isComingSoon) return performances;
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    minDate.setDate(minDate.getDate() + 21);
    return performances.filter((performance) => performance.date.getTime() >= minDate.getTime());
  }, [performances, selectedShow]);
  const firstBookingPerformanceDate = bookingCalendarPerformances[0]?.date ?? null;
  const showNextStepHint = (message: string) => {
    setNextStepHint(message);
    if (nextStepHintTimeoutRef.current) {
      window.clearTimeout(nextStepHintTimeoutRef.current);
    }
    nextStepHintTimeoutRef.current = window.setTimeout(() => {
      setNextStepHint(null);
      nextStepHintTimeoutRef.current = null;
    }, 2200);
  };

  const repositionBookingStepViewport = () => {
    if (typeof window === 'undefined') return;
    requestAnimationFrame(() => {
      document.getElementById('booking-flow')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      bookingStepPanelRef.current?.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  };
  const goToNextStep = () => {
    if (!canAdvanceFromStep) {
      if (bookingStep === 1) showNextStepHint('Select a show to continue.');
      else if (bookingStep === 2) showNextStepHint('Choose a date and time to continue.');
      else if (bookingStep === 3) showNextStepHint('Select at least one seat to continue.');
      else showNextStepHint('Complete the required action to continue.');
      return;
    }
    if (bookingStep === 4) {
      setTotalPaid(seatBalanceDue);
    }
    setBookingStep(Math.min(bookingSteps.length, bookingStep + 1));
    repositionBookingStepViewport();
  };
  const goToPreviousStep = () => {
    setBookingStep(Math.max(1, bookingStep - 1));
    repositionBookingStepViewport();
  };
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return null;
    const first = touches[0];
    const second = touches[1];
    const deltaX = second.clientX - first.clientX;
    const deltaY = second.clientY - first.clientY;
    return Math.hypot(deltaX, deltaY);
  };
  useEffect(() => {
    const target = stagePinchTargetRef.current;
    if (!target || !isMobileViewport) return;

    const handleNativeTouchStart = (event: TouchEvent) => {
      if (event.touches.length < 2) {
        stagePinchStartDistanceRef.current = null;
        isStagePinchingRef.current = false;
        return;
      }
      const distance = getTouchDistance(event.touches);
      if (!distance) return;
      stagePinchStartDistanceRef.current = distance;
      stagePinchStartScaleRef.current = stageScaleRef.current;
      isStagePinchingRef.current = true;
      event.preventDefault();
    };

    const handleNativeTouchMove = (event: TouchEvent) => {
      const startDistance = stagePinchStartDistanceRef.current;
      if (!startDistance || event.touches.length < 2) return;
      const nextDistance = getTouchDistance(event.touches);
      if (!nextDistance) return;
      event.preventDefault();
      const ratio = nextDistance / startDistance;
      const nextScale = stagePinchStartScaleRef.current * ratio;
      setStageScale(Math.max(0.68, Math.min(1.12, nextScale)));
    };

    const handleNativeTouchEnd = () => {
      stagePinchStartDistanceRef.current = null;
      isStagePinchingRef.current = false;
    };

    // iOS Safari exposes pinch zoom as GestureEvents.
    const handleGestureStart = (event: Event) => {
      const gesture = event as Event & { scale?: number; preventDefault: () => void };
      gestureStartScaleRef.current = stageScaleRef.current;
      gesture.preventDefault();
    };

    const handleGestureChange = (event: Event) => {
      const gesture = event as Event & { scale?: number; preventDefault: () => void };
      const scaleDelta = typeof gesture.scale === 'number' ? gesture.scale : 1;
      const nextScale = gestureStartScaleRef.current * scaleDelta;
      setStageScale(Math.max(0.68, Math.min(1.12, nextScale)));
      gesture.preventDefault();
    };

    target.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    target.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    target.addEventListener('touchend', handleNativeTouchEnd);
    target.addEventListener('touchcancel', handleNativeTouchEnd);
    target.addEventListener('gesturestart', handleGestureStart as EventListener, { passive: false });
    target.addEventListener('gesturechange', handleGestureChange as EventListener, { passive: false });
    return () => {
      target.removeEventListener('touchstart', handleNativeTouchStart);
      target.removeEventListener('touchmove', handleNativeTouchMove);
      target.removeEventListener('touchend', handleNativeTouchEnd);
      target.removeEventListener('touchcancel', handleNativeTouchEnd);
      target.removeEventListener('gesturestart', handleGestureStart as EventListener);
      target.removeEventListener('gesturechange', handleGestureChange as EventListener);
    };
  }, [isMobileViewport]);
  const handleComponentTabChange = (
    view: 'booking' | 'seating' | 'calendar', 
    e?: React.MouseEvent // Add the event parameter
  ) => {
    if (e) e.preventDefault(); // Stop the scroll-to-top behavior
  
    if (currentView === 'booking' && view !== 'booking' && confirmExitNavigation) {
      const destination = view === 'seating' ? '/#seating' : '/#calendar';
      if (!confirmExitNavigation(destination)) return;
    }

    const applyView = () => {
      setCurrentView(view);
      if (typeof window === 'undefined') return;
      if (view === 'seating') {
        window.history.replaceState(null, '', '/#seating');
        queueMicrotask(() => {
          requestAnimationFrame(() => {
            document.getElementById('booking-flow')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          });
        });
      } else if (view === 'calendar') {
        window.history.replaceState(null, '', '/#calendar');
        queueMicrotask(() => {
          requestAnimationFrame(() => {
            document.getElementById('booking-flow')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          });
        });
      } else if (view === 'booking') {
        window.history.replaceState(null, '', '/#booking-flow');
      }
    };

    if (view === currentView) {
      applyView();
      return;
    }

    runSpotlightTransition(applyView);
  };

  return (
    <main className={`app-main ${isBookingNoScrollMode ? 'app-main-booking' : ''}`}>
  {!isComponentFocusMode && (
    <section id="stage" className="hero-section">
      <div
        ref={stagePinchTargetRef}
        style={{
          transform: `scale(${stageScale})`,
          transformOrigin: 'top center',
          transition: stagePinchStartDistanceRef.current ? 'none' : 'transform 160ms ease-out',
          touchAction: isMobileViewport ? 'pan-x pan-y' : undefined,
        }}
      >
        <div className="main-header-branding">
          <span className="presenter-credit">Starley Flynn presents</span>
          <h2 className="main-header-title hero-title">
            The Designed Stage
          </h2>
        </div>

        <p className="hero-subtitle">Where Performance Theater Meets Systems Architecture</p>
        <p className="hero-description">
          <span>
            <span>
              A design system for complex state-driven interactions. Powered by 
              a command-driven &quot;Global Usher&quot; that bridges accessible 
              spatial navigation with a seamless booking flow.
            </span>
          </span>
        </p>

        <div className="hero-shortcut-wrap">
          <kbd className="hero-shortcut">
            <span className="spotlight-text">⌘ K</span> to open Global Usher
          </kbd>
        </div>
      </div>
    </section>
  )}
      {!isComponentFocusMode && (
      <section id="now-playing" className="section-stack">
        <div className="section-header-row">
          <h3 className="section-title">
            Now Playing
          </h3>
        </div>

        <div className="shows-grid">
          {shows.map((show) => (
            <ShowCard
              key={show.title}
              {...show}
              priority
              scriptHref={
                show.title === 'The Design System'
                  ? '/script#technical-documentation'
                  : show.title === 'Salesforce'
                    ? '/script#education-cloud-design-doc'
                    : show.title === 'Google'
                      ? '/script#google-engineering-process'
                      : '/script'
              }
              onClick={() => setCurrentView('calendar')}
            />
          ))}
        </div>
      </section>
      )}

      <section
        id="booking-flow"
        className={`component-panel ${isBookingNoScrollMode ? 'component-panel-booking' : ''}`}
      >
        <div className="panel-header">
          <h2 className="section-title">
            Design System Components
          </h2>
          <div className="segment-control">
            <button
              onClick={() => handleComponentTabChange('booking')}
              className={`segment-btn ${
                currentView === 'booking' ? 'segment-btn-active' : ''
              }`}
            >
              Booking Flow
            </button>
            <button
              onClick={() => handleComponentTabChange('seating')}
              className={`segment-btn ${
                currentView === 'seating' ? 'segment-btn-active' : ''
              }`}
            >
              Seating Chart
            </button>
            <button
              onClick={() => handleComponentTabChange('calendar')}
              className={`segment-btn ${
                currentView === 'calendar' ? 'segment-btn-active' : ''
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        {currentView === 'calendar' && (
          <Suspense fallback={null}>
            <PerformanceCalendar
              performances={performances}
              onSelectPerformance={() => {
                if (typeof window !== 'undefined') {
                  window.location.assign('/backstage#recursive-component-logic');
                }
              }}
            />
          </Suspense>
        )}

        {currentView === 'booking' && (
          <div className="booking-view booking-view-no-scroll">
            <div className="booking-flow-header">
              <Suspense fallback={null}>
                <BookingProgress currentStep={bookingStep} steps={bookingProgressSteps} />
              </Suspense>
              {bookingStep < bookingSteps.length && nextStepHint && (
                <p className="booking-next-hint-banner" role="status" aria-live="polite">
                  {nextStepHint}
                </p>
              )}
            </div>
            <div ref={bookingStepPanelRef} className="booking-step-panel booking-step-panel-scroll">
              {bookingStep === 1 && (
                <div className="booking-step-content booking-step-content-seat">
                  <h3 className="booking-step-heading">Step 1: Select Show</h3>
                  <p className="booking-step-copy">Choose a performance to begin your reservation.</p>
                  <label className="booking-field-label" htmlFor="booking-show-select">
                    Production
                  </label>
                  <select
                    id="booking-show-select"
                    className="booking-show-select"
                    value={selectedShowTitle}
                    onChange={(event) => setSelectedShowTitle(event.target.value)}
                  >
                    {bookingShows.map((show) => (
                      <option key={show.title} value={show.title}>
                        {show.title}
                      </option>
                    ))}
                  </select>
                  {selectedShow && (
                    <div className="booking-show-summary">
                      <div className="booking-show-title">{selectedShow.title}</div>
                      <div className="booking-show-meta">
                        {selectedShow.scope} · {selectedShow.date}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {bookingStep === 2 && (
                <div className="booking-step-content booking-step-calendar">
                  <h3 className="booking-step-heading">Step 2: Select Date &amp; Time</h3>
                  <Suspense fallback={null}>
                    <PerformanceCalendar
                      performances={bookingCalendarPerformances}
                      interactionHint="Select this performance time for booking."
                      initialSelectedDate={firstBookingPerformanceDate}
                      onSelectPerformance={(date, time, type) => {
                        const dayPerformances = bookingCalendarPerformances.find(
                          (performance) =>
                            performance.date.getDate() === date.getDate() &&
                            performance.date.getMonth() === date.getMonth() &&
                            performance.date.getFullYear() === date.getFullYear()
                        );
                        const slot = dayPerformances?.times.find(
                          (performance) => performance.time === time && performance.type === type
                        );
                        if (!slot) return;
                        setSelectedPerformance({
                          date,
                          time,
                          type,
                        });
                      }}
                    />
                  </Suspense>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="booking-step-content">
                  <h3 className="booking-step-heading">Step 3: Select Seats</h3>
                  <div className="booking-seat-layout">
                    <div className="booking-seat-main">
                      <Suspense fallback={null}>
                        <SeatingChart
                          section="Orchestra"
                          onSeatSelect={(seats) => {
                            const total = seats.reduce((sum, seat) => sum + (seat.price ?? 0), 0);
                            setSelectedSeatIds(seats.map((seat) => seat.id));
                            setSelectedSeatTotal(total);
                            setSeatBalanceDue(total);
                          }}
                          hideTools
                          hideSummary
                          compactMode
                          hideQuickControls
                          ticketCount={bookingTicketCount}
                          onTicketCountChange={setBookingTicketCount}
                          suggestRequestKey={suggestRequestKey}
                          resetRequestKey={resetRequestKey}
                        />
                      </Suspense>
                    </div>
                    <aside className="booking-seat-sidebar">
                      <div className="booking-seat-sidebar-controls">
                        <label className="seating-ticket-count-label booking-seat-ticket-row">
                          Tickets
                          <select
                            value={bookingTicketCount}
                            onChange={(event) => setBookingTicketCount(Number(event.target.value))}
                            className="seating-ticket-count-select booking-seat-ticket-select"
                          >
                            {[1, 2, 3, 4, 5, 6].map((count) => (
                              <option key={count} value={count}>
                                {count}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          className="seating-suggest-btn show-card-btn booking-seat-sidebar-btn"
                          type="button"
                          onClick={() => setSuggestRequestKey((prev) => prev + 1)}
                        >
                          Suggest Best Seats
                        </button>
                        <button
                          className="seating-reset-btn booking-seat-sidebar-btn booking-seat-sidebar-reset"
                          type="button"
                          onClick={() => setResetRequestKey((prev) => prev + 1)}
                        >
                          Reset
                        </button>
                      </div>
                      <div className="booking-seat-sidebar-output">
                        <div className="booking-seat-sidebar-title">Selected Seats</div>
                        <div className={`booking-seat-sidebar-list ${selectedSeatIds.length > 0 ? 'booking-seat-sidebar-list-selected' : ''}`}>
                          {selectedSeatIds.length > 0 ? selectedSeatIds.join(', ') : 'None selected'}
                        </div>
                        <div className="booking-seat-sidebar-total">
                          <span>Total</span>
                          <strong>${selectedSeatTotal.toFixed(2)}</strong>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              )}

              {bookingStep === 4 && (
                <div className="booking-step-content">
                  <h3 className="booking-step-heading">Step 4: Payment Details</h3>
                  <div className="booking-payment-balance">
                    <span>Total to Pay</span>
                    <strong>${seatBalanceDue.toFixed(2)}</strong>
                  </div>
                  <div className="booking-payment-form">
                    <label className="booking-field-label" htmlFor="booking-email">Email</label>
                    <input id="booking-email" className="booking-field" disabled value="jane.doe@example.com" readOnly />
                    <label className="booking-field-label" htmlFor="booking-card-name">Name on card</label>
                    <input id="booking-card-name" className="booking-field" disabled value="Jane Doe" readOnly />
                    <label className="booking-field-label" htmlFor="booking-card-number">Card number</label>
                    <input id="booking-card-number" className="booking-field" disabled value="•••• •••• •••• 4242" readOnly />
                    <div className="booking-field-row">
                      <div>
                        <label className="booking-field-label" htmlFor="booking-expiry">Expiry</label>
                        <input id="booking-expiry" className="booking-field" disabled value="09/29" readOnly />
                      </div>
                      <div>
                        <label className="booking-field-label" htmlFor="booking-cvc">CVC</label>
                        <input id="booking-cvc" className="booking-field" disabled value="•••" readOnly />
                      </div>
                    </div>
                  </div>
                  <p className="booking-mock-note">
                    <InfoIcon className="booking-mock-note-icon" aria-hidden="true" />
                    Payment details shown here are for demo purposes.
                  </p>
                </div>
              )}

              {bookingStep === 5 && (
                <div className="booking-step-content booking-step-content-confirmation">
                  <div className="booking-confetti" aria-hidden="true">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <span
                        key={`confetti-${index}`}
                        className="booking-confetti-piece"
                        style={{
                          left: `${6 + (index % 9) * 10}%`,
                          animationDelay: `${index * 70}ms`,
                          animationDuration: `${3000 + (index % 5) * 440}ms`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="booking-confirmation-summary">
                    <div className="booking-confirmation-header">
                      <h3 className="booking-step-heading">Step 5: Booking Review</h3>
                    </div>
                    <div className="booking-summary-row">
                      <span>Show</span>
                      <strong>{selectedShowTitle || 'Not selected'}</strong>
                    </div>
                    <div className="booking-summary-row">
                      <span>Date &amp; Time</span>
                      <strong>
                        {selectedPerformance
                          ? `${selectedPerformance.date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}, ${selectedPerformance.time}`
                          : 'Not selected'}
                      </strong>
                    </div>
                    <div className="booking-summary-row">
                      <span>Seats</span>
                      <strong>{selectedSeatIds.length > 0 ? selectedSeatIds.join(', ') : 'Not selected'}</strong>
                    </div>
                    <div className="booking-summary-row booking-summary-row-order-total">
                      <span>Total Paid</span>
                      <strong>${totalPaid.toFixed(2)}</strong>
                    </div>
                    <p className="booking-confirmation-note">
                      A confirmation email with your receipt and ticket delivery details will be sent shortly.
                    </p>
                  </div>
                </div>
              )}
            </div>
            {bookingStep < bookingSteps.length && (
              <div className="booking-nav">
                <button
                  onClick={goToPreviousStep}
                  disabled={bookingStep === 1}
                  className="btn-prev"
                >
                  Previous
                </button>
                <button
                  onClick={goToNextStep}
                  aria-disabled={!canAdvanceFromStep}
                  className={`btn-next ${!canAdvanceFromStep ? 'btn-next-disabled' : ''}`}
                >
                  Next Step
                </button>
              </div>
            )}
            <p className="booking-exit-hint booking-exit-hint-footer" aria-live="polite">
              Press Esc to exit booking
            </p>
          </div>
        )}

        {currentView === 'seating' && (
          <div id="seating">
            <div id="seating-chart">
              {deferredSeatingTabReady ? (
                <Suspense fallback={null}>
                  <SeatingChart section="Orchestra" onSeatSelect={() => {}} />
                </Suspense>
              ) : (
                <div
                  className="seating-chart-deferred-placeholder"
                  aria-busy="true"
                  aria-label="Loading seating chart"
                />
              )}
            </div>
          </div>
        )}
      </section>

      {!isComponentFocusMode && (
      <section className="feature-banner">
        <div className="feature-banner-inner">
          <TheaterIcon className="icon-xl" />
          <h3 className="section-title">
            Theater Design System Features
          </h3>
          <div className="feature-grid">
            <div className="feature-item">
              <h4 className="spotlight-text">Global Usher (⌘K)</h4>
              <p className="feature-copy">
                An atmospheric, keyboard-first command palette that utilizes spotlight transitions and theater-themed state
                management to navigate complex inventory.
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">The Interactive House</h4>
              <p className="feature-copy">
                A spatial seating engine architected to support real-time state synchronization for VIP, accessible, and
                standard inventory, engineered for high-integrity UX.
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">The 5-Act Checkout</h4>
              <p className="feature-copy">
                A narrative booking journey that utilizes visual progress indicators to transform a standard transaction into
                a guided performance.
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Performance Calendar</h4>
              <p className="feature-copy">
                A custom temporal interface engineered for precision concurrency management between matinee and evening show
                availability.
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Dark Mode: &quot;The Blackout&quot;</h4>
              <p className="feature-copy">
                A low-glare optimization engine calibrated for discreet device usage in light-sensitive environments,
                reducing visual noise without sacrificing clarity.
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Motion Pause: &quot;Static Stage&quot;</h4>
              <p className="feature-copy">
                A global override that silences ambient animations and background transitions, providing a static environment
                for viewers with motion sensitivity.
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Atmospheric Presets</h4>
              <p className="feature-copy">
                Dynamic environment toggles that transition the UI between high-visibility utility and immersive
                &quot;Misty&quot; or &quot;Midnight&quot; states.
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Production Show Cards</h4>
              <p className="feature-copy">
                Modular data primitives designed to harmonize high-density metadata with a premium aesthetic finish.
              </p>
            </div>
          </div>
        </div>
      </section>
      )}
    </main>
  );
}
