import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon, MenuIcon, MoonIcon, PauseIcon, PlayIcon, SearchIcon, SunIcon, TheaterIcon } from './AppIcons';
import { useTheme } from '../contexts/ThemeContext';
import { StylePicker } from './StylePicker';

interface TheaterHeaderProps {
  onSearchClick: () => void;
  onNavigate?: (href: string) => boolean;
}

export function TheaterHeader({ onSearchClick, onNavigate }: TheaterHeaderProps) {
  const { mode, toggleMode, motionEnabled, toggleMotion } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileStylePickerOpen, setIsMobileStylePickerOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const isCurrentDestination = useCallback((href: string) => {
    if (typeof window === 'undefined') return false;
    const current = new URL(window.location.href);
    const target = new URL(href, window.location.origin);
    const normalizePath = (value: string) => value.replace(/\/+$/, '') || '/';
    return (
      normalizePath(current.pathname) === normalizePath(target.pathname)
      && (current.hash || '') === (target.hash || '')
    );
  }, []);
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const menuEl = mobileMenuRef.current;
    const focusable = menuEl?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusable?.[0];
    const lastFocusable = focusable?.[focusable.length - 1];
    const previouslyFocused = document.activeElement as HTMLElement | null;
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileMenu();
        return;
      }
      if (event.key !== 'Tab' || !firstFocusable || !lastFocusable) return;
      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (isMobileStylePickerOpen) return;
      const target = event.target as Node;
      if (mobileMenuRef.current?.contains(target)) return;
      if (mobileMenuButtonRef.current?.contains(target)) return;
      closeMobileMenu();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      } else {
        mobileMenuButtonRef.current?.focus();
      }
    };
  }, [closeMobileMenu, isMobileMenuOpen, isMobileStylePickerOpen]);
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isCurrentDestination(href)) {
      event.preventDefault();
      closeMobileMenu();
      return;
    }
    if (!onNavigate) return;
    const shouldNavigate = onNavigate(href);
    if (!shouldNavigate) {
      event.preventDefault();
    }
  };

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
            <TheaterIcon className="theater-brand-icon" />
            <h1 className="theater-brand-title">The Designed Stage</h1>
          </div>

          <nav className="theater-nav-desktop">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="theater-nav-link group"
                onClick={(event) => handleNavClick(event, item.href)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="theater-actions">
            <div className="theater-action-stack-desktop">
              <button
                onClick={onSearchClick}
                className="theater-icon-btn"
                aria-label="Search"
                type="button"
              >
                <SearchIcon className="w-5 h-5" />
              </button>

              <StylePicker />

              <button
                onClick={() => {
                  toggleMode();
                  closeMobileMenu();
                }}
                className="theater-icon-btn"
                aria-label="Toggle dark mode"
                type="button"
              >
                {mode === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {
                  toggleMotion();
                  closeMobileMenu();
                }}
                className="theater-icon-btn"
                aria-label={motionEnabled ? 'Reduce motion' : 'Enable animations'}
                aria-pressed={motionEnabled}
                title={motionEnabled ? 'Reduce motion' : 'Enable animations'}
                type="button"
              >
                {motionEnabled ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={onSearchClick}
              className="theater-mobile-search-btn"
              aria-label="Search"
              type="button"
            >
              <SearchIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="theater-mobile-menu-btn"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="theater-mobile-menu"
              type="button"
              ref={mobileMenuButtonRef}
            >
              {isMobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div id="theater-mobile-menu" className="theater-nav-mobile" ref={mobileMenuRef}>
            <div className="theater-nav-mobile-controls">
              <StylePicker
                onOpenChange={setIsMobileStylePickerOpen}
                onThemeSelected={() => {
                  setIsMobileStylePickerOpen(false);
                  closeMobileMenu();
                }}
                onEscape={() => {
                  setIsMobileStylePickerOpen(false);
                  closeMobileMenu();
                }}
              />
              <button
                onClick={toggleMode}
                className="theater-icon-btn"
                aria-label="Toggle dark mode"
                type="button"
              >
                {mode === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleMotion}
                className="theater-icon-btn"
                aria-label={motionEnabled ? 'Reduce motion' : 'Enable animations'}
                aria-pressed={motionEnabled}
                title={motionEnabled ? 'Reduce motion' : 'Enable animations'}
                type="button"
              >
                {motionEnabled ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
              </button>
            </div>
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="theater-nav-mobile-link"
                onClick={(event) => {
                  handleNavClick(event, item.href);
                  closeMobileMenu();
                }}
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
