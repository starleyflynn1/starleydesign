import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { GlobalUsher } from './components/GlobalUsher';
import { TheaterHeader } from './components/TheaterHeader';
import { ShowCard } from './components/ShowCard';
import { SeatingChart } from './components/SeatingChart';
import { BookingProgress } from './components/BookingProgress';
import { PerformanceCalendar } from './components/PerformanceCalendar';
import { Theater, Sparkles } from 'lucide-react';

export default function App() {
  const [isUsherOpen, setIsUsherOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'booking' | 'seating' | 'calendar'>('home');
  const [bookingStep, setBookingStep] = useState(1);

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

  const shows = [
    {
    title: 'The Design System',
    image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400', 
    date: '2026',
    scope: 'Global Scale // 100k+ Users',
    stack: 'React · TypeScript · Figma', 
    impact: 'Live Demo', 
    role: 'Interaction Designer' 
    },
    {
    title: 'Salesforce Education Cloud',
    image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400', 
    date: '2022 — 2026',
    scope: 'Global Scale // 100k+ Users',
    stack: 'Javascript · LWC · GraphQL · Java', 
    impact: 'Architectual Design', 
    role: 'Senior Member of Technical Staff' 
    },
    {
    title: 'Google Cloud Marketing',
    image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400', 
    date: '2021 — 2022',
    scope: 'Lead Management Engine',
    stack: 'Javascript · LWC · Java', 
    impact: 'Exceeds Expectations', 
    role: 'Application Engineer' 
    },
    {
    title: 'BFA Theater',
    image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400', 
    date: '2004 — 2026',
    scope: 'Ensemble Collaboration & Live Production',
    stack: 'Narrative & User Psychology', 
    impact: 'Foundational Empathy', 
    role: 'The Origin Story' 
    },
  ];

  const bookingSteps = [
    { number: 1, title: 'Select Seats', description: 'Choose your seats' },
    { number: 2, title: 'Add-ons', description: 'Parking & concessions' },
    { number: 3, title: 'Payment', description: 'Secure checkout' },
    { number: 4, title: 'Confirmation', description: 'Get your tickets' },
  ];

  const performances = [
    {
      date: new Date(2026, 3, 25),
      times: [
        { time: '2:00 PM', type: 'matinee' as const, available: 45 },
        { time: '7:30 PM', type: 'evening' as const, available: 23 },
      ],
    },
    {
      date: new Date(2026, 3, 26),
      times: [
        { time: '2:00 PM', type: 'matinee' as const, available: 12 },
        { time: '7:30 PM', type: 'evening' as const, available: 0 },
      ],
    },
    {
      date: new Date(2026, 3, 27),
      times: [{ time: '7:30 PM', type: 'evening' as const, available: 67 }],
    },
  ];

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <TheaterHeader onSearchClick={() => setIsUsherOpen(true)} />

      <GlobalUsher
        isOpen={isUsherOpen}
        onClose={() => setIsUsherOpen(false)}
        onSelect={(action) => {
          console.log('Selected:', action);
        }}
      />

      <main className="container mx-auto px-4 py-8 space-y-12">
        <section className="text-center py-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-velvet/10 border border-velvet/30 rounded-full text-sm text-velvet mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Theater Design System</span>
          </div>
          <h2
            className="main-header-title"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            The Designed Stage
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Where Performance Theater Meets the Technical Stack</p>
          <p className="text-m text-muted-foreground max-w-2xl mx-auto"><span className=""><span className="">A technical showcase of a Design System engineered for complex state management and high-fidelity interaction—featuring a command-driven "Global Usher," accessible spacial mapping, and seamless booking flows.</span></span></p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <kbd className="px-3 py-2 bg-card border border-spotlight/30 rounded-lg text-sm">
              <span className="text-spotlight">⌘ K</span> to open Global Usher
            </kbd>
          </div>
        </section>

        <section id="now-playing" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
              Now Playing
            </h3>
            <button className="text-sm text-spotlight hover:underline">View All</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shows.map((show) => (
              <ShowCard
                key={show.title}
                {...show}
                onClick={() => setCurrentView('calendar')}
              />
            ))}
          </div>
        </section>

        <section className="bg-card rounded-2xl p-8 border border-spotlight/20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
              Design System Components
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'calendar'
                    ? 'bg-spotlight text-stage-black'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setCurrentView('booking')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'booking'
                    ? 'bg-spotlight text-stage-black'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                Booking Flow
              </button>
              <button
                onClick={() => setCurrentView('seating')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'seating'
                    ? 'bg-spotlight text-stage-black'
                    : 'bg-secondary hover:bg-secondary/80'
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
            <div className="space-y-8">
              <BookingProgress currentStep={bookingStep} steps={bookingSteps} />
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setBookingStep(Math.max(1, bookingStep - 1))}
                  disabled={bookingStep === 1}
                  className="px-6 py-2 border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setBookingStep(Math.min(4, bookingStep + 1))}
                  disabled={bookingStep === 4}
                  className="px-6 py-2 bg-velvet hover:bg-velvet/80 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

        <section className="bg-gradient-to-r from-velvet/10 via-transparent to-spotlight/10 rounded-2xl p-8 border border-spotlight/20">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Theater className="w-16 h-16 mx-auto text-spotlight" />
            <h3 className="text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
              Theater Design System Features
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-left pt-6">
              <div className="space-y-2">
                <h4 className="text-spotlight">Global Usher (⌘K)</h4>
                <p className="text-sm text-muted-foreground">
                  Keyboard-first command palette with spotlight animations and theater-themed states
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-spotlight">Seating Charts</h4>
                <p className="text-sm text-muted-foreground">
                  Interactive seat selection with VIP, accessible, and real-time availability states
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-spotlight">Booking Progress</h4>
                <p className="text-sm text-muted-foreground">
                  4-step checkout flow with visual progress indicators and gold spotlight accents
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-spotlight">Performance Calendar</h4>
                <p className="text-sm text-muted-foreground">
                  Custom date picker with matinee vs. evening shows and live availability
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-spotlight">Dark Mode Toggle</h4>
                <p className="text-sm text-muted-foreground">
                  Low-glare UI optimized for checking on phones in dim theaters
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-spotlight">Show Cards</h4>
                <p className="text-sm text-muted-foreground">
                  Rich media cards with badges, ratings, and theater-specific metadata
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Theater className="w-6 h-6 text-velvet" />
              <span className="text-sm text-muted-foreground">
                © 2026 The Designed Stage. Theater Design System by Starley Flynn.
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-spotlight transition-colors">
                Technical Specs
              </a>
              <a href="#" className="hover:text-spotlight transition-colors">
                Backstage
              </a>
              <a href="#" className="hover:text-spotlight transition-colors">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </ThemeProvider>
  );
}