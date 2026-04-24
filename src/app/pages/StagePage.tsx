import React from 'react';
import { Theater, Sparkles } from 'lucide-react';
import { ShowCard } from '../components/ShowCard';
import { SeatingChart } from '../components/SeatingChart';
import { BookingProgress } from '../components/BookingProgress';
import { PerformanceCalendar } from '../components/PerformanceCalendar';

interface Show {
  title: string;
  image: string;
  date: string;
  scope: string;
  stack: string;
  impact: string;
  role: string;
}

interface BookingStep {
  number: number;
  title: string;
  description: string;
}

interface Performance {
  date: Date;
  times: { time: string; type: 'matinee' | 'evening'; available: number }[];
}

interface StagePageProps {
  shows: Show[];
  bookingSteps: BookingStep[];
  performances: Performance[];
  currentView: 'home' | 'booking' | 'seating' | 'calendar';
  bookingStep: number;
  setCurrentView: (view: 'home' | 'booking' | 'seating' | 'calendar') => void;
  setBookingStep: (step: number) => void;
}

export function StagePage({
  shows,
  bookingSteps,
  performances,
  currentView,
  bookingStep,
  setCurrentView,
  setBookingStep,
}: StagePageProps) {
  return (
    <main className="app-main">
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

      <section id="now-playing" className="section-stack">
        <div className="section-header-row">
          <h3 className="section-title">
            Now Playing
          </h3>
          <button className="link-button">View All</button>
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

      <section className="component-panel">
        <div className="panel-header">
          <h3 className="section-title">
            Design System Components
          </h3>
          <div className="segment-control">
            <button
              onClick={() => setCurrentView('calendar')}
              className={`segment-btn ${
                currentView === 'calendar' ? 'segment-btn-active' : ''
              }`}
            >
              Calendar
            </button>
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
          </div>
        </div>

        {currentView === 'calendar' && (
          <PerformanceCalendar
            performances={performances}
            onSelectPerformance={(date, time, type) => {
              console.log('Selected performance:', { date, time, type });
              setCurrentView('seating');
            }}
          />
        )}

        {currentView === 'booking' && (
          <div className="booking-view">
            <BookingProgress currentStep={bookingStep} steps={bookingSteps} />
            <div className="booking-nav">
              <button
                onClick={() => setBookingStep(Math.max(1, bookingStep - 1))}
                disabled={bookingStep === 1}
                className="btn-prev"
              >
                Previous
              </button>
              <button
                onClick={() => setBookingStep(Math.min(4, bookingStep + 1))}
                disabled={bookingStep === 4}
                className="btn-next"
              >
                Next Step
              </button>
            </div>
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
              <h4 className="spotlight-text">Seating Charts</h4>
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
              <h4 className="spotlight-text">Show Cards</h4>
              <p className="feature-copy">
                Rich media cards with badges, ratings, and theater-specific metadata
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
