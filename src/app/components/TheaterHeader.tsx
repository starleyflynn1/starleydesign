import { useState } from 'react';
import { Theater, Moon, Sun, Menu, X, Search, Play, Pause } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { StylePicker } from './StylePicker';

interface TheaterHeaderProps {
  onSearchClick: () => void;
}

export function TheaterHeader({ onSearchClick }: TheaterHeaderProps) {
  const { mode, toggleMode, motionEnabled, toggleMotion } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Stage', href: '/#stage' },
    { label: 'Script', href: '/script' },
    { label: 'Director', href: '/director' },
    { label: 'Backstage', href: '/backstage' },
  ];

  return (
    <header className="theater-header">
      <div className="theater-header-container">
        <div className="theater-header-row">
          <div className="theater-brand">
            <Theater className="theater-brand-icon" />
            <h1 className="theater-brand-title">The Designed Stage</h1>
          </div>

          <nav className="theater-nav-desktop">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="theater-nav-link group"
              >
                {item.label}
                <span className="theater-nav-link-underline"></span>
              </a>
            ))}
          </nav>

          <div className="theater-actions">
            <div className="theater-action-stack-desktop">
              <button
                onClick={onSearchClick}
                className="theater-icon-btn"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <StylePicker />

              <button
                onClick={toggleMode}
                className="theater-icon-btn"
                aria-label="Toggle dark mode"
              >
                {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleMotion}
                className="theater-icon-btn"
                aria-label={motionEnabled ? 'Reduce motion' : 'Enable animations'}
                aria-pressed={motionEnabled}
                title={motionEnabled ? 'Reduce motion' : 'Enable animations'}
                type="button"
              >
                {motionEnabled ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={onSearchClick}
              className="theater-mobile-search-btn"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="theater-mobile-menu-btn"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="theater-mobile-controls">
          <StylePicker />
          <button
            onClick={toggleMode}
            className="theater-icon-btn"
            aria-label="Toggle dark mode"
          >
            {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleMotion}
            className="theater-icon-btn"
            aria-label={motionEnabled ? 'Reduce motion' : 'Enable animations'}
            aria-pressed={motionEnabled}
            title={motionEnabled ? 'Reduce motion' : 'Enable animations'}
            type="button"
          >
            {motionEnabled ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="theater-nav-mobile">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="theater-nav-mobile-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="theater-marquee">
        <div className="theater-marquee-inner">
          <div className="theater-live-pill theater-live-pill-flash">LIVE</div>
          <div className="banner-container">
            <span className={`banner-text ${!motionEnabled ? 'banner-text-static' : ''}`}>
              Opening Night: "The Design Technologist" — May 2026 • Box Office: Open for Collaborative Innovation & Engineering Roles
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
