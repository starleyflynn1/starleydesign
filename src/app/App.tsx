import React from 'react';
import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { GlobalUsher } from './components/GlobalUsher';
import { TheaterHeader } from './components/TheaterHeader';
import { Theater } from 'lucide-react';
import { StagePage } from './pages/StagePage';
import { ScriptPage } from './pages/ScriptPage';
import { DirectorPage } from './pages/DirectorPage';
import { BackstagePage } from './pages/BackstagePage';

export default function App() {
  const [isUsherOpen, setIsUsherOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'booking' | 'seating' | 'calendar'>('home');
  const [bookingStep, setBookingStep] = useState(1);
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

  const shows = [
    {
    title: 'The Design System',
    image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400', 
    date: '2026',
    scope: 'User Experience Architecture',
    stack: 'React · TypeScript · Figma', 
    impact: 'Current Run', 
    role: 'Interaction Designer' 
    },
    {
    title: 'Salesforce',
    image: 'https://images.unsplash.com/photo-1721553710744-e02e98f2cbfb?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
    date: '2022 — 2026',
    scope: 'Digital Campus at Scale',
    stack: 'Javascript · GraphQL · Java', 
    impact: 'Architectual Design', 
    role: 'Senior Member of Technical Staff' 
    },
    {
    title: 'Google',
    image: 'https://images.unsplash.com/photo-1593940256067-fb4acd831804?q=80&w=776&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
    date: '2021 — 2022',
    scope: 'Lead Management Engine',
    stack: 'Javascript · LWC · Java', 
    impact: 'High Performance Delivery', 
    role: 'Application Engineer' 
    },
    {
    title: 'BFA Theater',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
    date: '2004 — 2026',
    scope: 'Collaborative Production',
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
      <div className="app-root">
        <TheaterHeader onSearchClick={() => setIsUsherOpen(true)} />

      <GlobalUsher
        isOpen={isUsherOpen}
        onClose={() => setIsUsherOpen(false)}
        onSelect={(action) => {
          const routeByTitle: Record<string, string> = {
            'My Tickets': '/backstage#transactional-ux-data-schemas',
            'Account Settings': '/backstage#global-theming-persistence',
            Preferences: '/backstage#accessibility-motion-control',
          };

          const destination = routeByTitle[action.title];
          if (destination) {
            window.location.assign(destination);
          } else {
            console.log('Selected:', action);
          }
        }}
      />

      {currentPage === 'home' && (
        <StagePage
          shows={shows}
          bookingSteps={bookingSteps}
          performances={performances}
          currentView={currentView}
          bookingStep={bookingStep}
          setCurrentView={setCurrentView}
          setBookingStep={setBookingStep}
        />
      )}

      {currentPage === 'script' && <ScriptPage resumeUrl={resumeUrl} />}
      {currentPage === 'director' && <DirectorPage />}
      {currentPage === 'backstage' && <BackstagePage />}

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
              <a href="#" className="footer-link">
                Technical Specs
              </a>
              <a href="#" className="footer-link">
                Backstage
              </a>
              <a href="#" className="footer-link">
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