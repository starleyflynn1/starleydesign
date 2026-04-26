import React, { useEffect, useMemo, useState } from 'react';
import { Info, Theater, Sparkles } from 'lucide-react';
import { ShowCard } from '../components/ShowCard';
import { SeatingChart } from '../components/SeatingChart';
import { BookingProgress } from '../components/BookingProgress';
import { PerformanceCalendar } from '../components/PerformanceCalendar';
import { BookingStep, Performance, Show } from '../data/types';

interface StagePageProps {
  shows: Show[];
  bookingShows: Show[];
  bookingSteps: BookingStep[];
  performances: Performance[];
  currentView: 'home' | 'booking' | 'seating' | 'calendar';
  bookingStep: number;
  initialBookingShow?: string;
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
  setCurrentView,
  setBookingStep,
}: StagePageProps) {
  const isBookingOnlyMode = currentView !== 'home';
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
  const [bookingTicketCount, setBookingTicketCount] = useState(2);
  const [suggestRequestKey, setSuggestRequestKey] = useState(0);
  const [resetRequestKey, setResetRequestKey] = useState(0);

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

  const goToNextStep = () => {
    if (!canAdvanceFromStep) return;
    if (bookingStep === 4) {
      setTotalPaid(seatBalanceDue);
    }
    setBookingStep(Math.min(bookingSteps.length, bookingStep + 1));
  };

  return (
    <main className={`app-main ${isBookingOnlyMode ? 'app-main-booking' : ''}`}>
      {!isBookingOnlyMode && (
      <section id="stage" className="hero-section">
        <div className="hero-badge">
          <Sparkles className="icon-sm" />
          <span>Theater Design System</span>
        </div>
        <h2 className="main-header-title hero-title">
          The Designed Stage
        </h2>
        <p className="hero-subtitle">Where Performance Theater Meets the Technical Stack</p>
        <p className="hero-description"><span><span>A technical showcase of a Design System engineered for complex state management and high-fidelity interaction—featuring a command-driven "Global Usher," accessible spacial mapping, and seamless booking flows.</span></span></p>

        <div className="hero-shortcut-wrap">
          <kbd className="hero-shortcut">
            <span className="spotlight-text">⌘ K</span> to open Global Usher
          </kbd>
        </div>
      </section>
      )}

      {!isBookingOnlyMode && (
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
              onClick={() => setCurrentView('calendar')}
            />
          ))}
        </div>
      </section>
      )}

      <section
        id="booking-flow"
        className={`component-panel ${isBookingOnlyMode ? 'component-panel-booking' : ''}`}
      >
        <div className="panel-header">
          <h3 className="section-title">
            Design System Components
          </h3>
          <div className="segment-control">
            <button
              onClick={() => setCurrentView('booking')}
              className={`segment-btn ${
                currentView === 'booking' ? 'segment-btn-active' : ''
              }`}
            >
              Booking Flow
            </button>
            <button
              onClick={() => setCurrentView('seating')}
              className={`segment-btn ${
                currentView === 'seating' ? 'segment-btn-active' : ''
              }`}
            >
              Seating Chart
            </button>
            <button
              onClick={() => setCurrentView('calendar')}
              className={`segment-btn ${
                currentView === 'calendar' ? 'segment-btn-active' : ''
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        {currentView === 'calendar' && (
          <PerformanceCalendar
            performances={performances}
            onSelectPerformance={(date, time, type) => {
              console.log('Selected performance:', { date, time, type });
              if (typeof window !== 'undefined') {
                window.location.assign('/backstage#recursive-component-logic');
                return;
              }
              setCurrentView('seating');
            }}
          />
        )}

        {currentView === 'booking' && (
          <div className="booking-view booking-view-no-scroll">
            <BookingProgress currentStep={bookingStep} steps={bookingProgressSteps} />
            <div className="booking-step-panel booking-step-panel-scroll">
              {bookingStep === 1 && (
                <div className="booking-step-content booking-step-content-seat">
                  <h4 className="booking-step-heading">Step 1: Select Show</h4>
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
                  <h4 className="booking-step-heading">Step 2: Select Date &amp; Time</h4>
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
                      setSelectedPerformance({
                        date,
                        time,
                        type,
                      });
                    }}
                  />
                </div>
              )}

              {bookingStep === 3 && (
                <div className="booking-step-content">
                  <h4 className="booking-step-heading">Step 3: Select Seats</h4>
                  <div className="booking-seat-layout">
                    <div className="booking-seat-main">
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
                          className="seating-suggest-btn booking-seat-sidebar-btn booking-seat-sidebar-suggest"
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
                      <div className="booking-seat-sidebar-title">Selected Seats</div>
                      <div className={`booking-seat-sidebar-list ${selectedSeatIds.length > 0 ? 'booking-seat-sidebar-list-selected' : ''}`}>
                        {selectedSeatIds.length > 0 ? selectedSeatIds.join(', ') : 'None selected'}
                      </div>
                      <div className="booking-seat-sidebar-total">
                        <span>Total</span>
                        <strong>${selectedSeatTotal.toFixed(2)}</strong>
                      </div>
                    </aside>
                  </div>
                </div>
              )}

              {bookingStep === 4 && (
                <div className="booking-step-content">
                  <h4 className="booking-step-heading">Step 4: Payment Details</h4>
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
                    <Info className="booking-mock-note-icon" aria-hidden="true" />
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
                      <h4 className="booking-step-heading">Step 5: Booking Review</h4>
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
                  onClick={() => setBookingStep(Math.max(1, bookingStep - 1))}
                  disabled={bookingStep === 1}
                  className="btn-prev"
                >
                  Previous
                </button>
                <button
                  onClick={goToNextStep}
                  disabled={!canAdvanceFromStep}
                  className="btn-next"
                >
                  Next Step
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'seating' && (
          <SeatingChart
            section="Orchestra"
            onSeatSelect={(seats) => {
              console.log('Selected seats:', seats);
            }}
          />
        )}
      </section>

      {!isBookingOnlyMode && (
      <section className="feature-banner">
        <div className="feature-banner-inner">
          <Theater className="icon-xl" />
          <h3 className="section-title">
            Theater Design System Features
          </h3>
          <div className="feature-grid">
            <div className="feature-item">
              <h4 className="spotlight-text">Global Usher (⌘K)</h4>
              <p className="feature-copy">
                Keyboard-first command palette with spotlight animations and theater-themed states
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Seating Chart</h4>
              <p className="feature-copy">
                Interactive seat selection with VIP, accessible, and real-time availability states
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Booking Progress</h4>
              <p className="feature-copy">
                4-step checkout flow with visual progress indicators and gold spotlight accents
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Performance Calendar</h4>
              <p className="feature-copy">
                Custom date picker with matinee vs. evening shows and live availability
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Dark Mode Toggle</h4>
              <p className="feature-copy">
                Low-glare UI optimized for checking on phones in dim theaters
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Motion Pause</h4>
              <p className="feature-copy">
                Static mode for sensitive viewers, silencing background transitions and ambient animations.
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Theme Toggles</h4>
              <p className="feature-copy">
                Dynamic environment presets that transition the Stage between high-visibility utility and ambient, atmospheric environments.
              </p>
            </div>
            <div className="feature-item">
              <h4 className="spotlight-text">Show Cards</h4>
              <p className="feature-copy">
                Modular media components designed for high-density theater metadata and production specs.
              </p>
            </div>
          </div>
        </div>
      </section>
      )}
    </main>
  );
}
