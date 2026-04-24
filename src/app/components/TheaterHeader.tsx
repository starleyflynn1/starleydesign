import { useState } from 'react';
import { Theater, Moon, Sun, Menu, X, Search } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { StylePicker } from './StylePicker';

interface TheaterHeaderProps {
  onSearchClick: () => void;
}

export function TheaterHeader({ onSearchClick }: TheaterHeaderProps) {
  const { mode, toggleMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Stage', href: '#stage' },
    { label: 'Script', href: '#script' },
    { label: 'Director', href: '#director' },
    { label: 'Backstage', href: '#backstage' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Theater className="w-8 h-8 text-velvet" />
            <h1 className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>The Designed Stage</h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm hover:text-spotlight transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-spotlight transition-all group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={onSearchClick}
              className="p-2 hover:bg-spotlight/10 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <StylePicker />

            <button
              onClick={toggleMode}
              className="p-2 hover:bg-spotlight/10 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-spotlight/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block py-2 px-4 hover:bg-spotlight/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-spotlight/20 bg-gradient-to-r from-velvet/10 via-transparent to-spotlight/10">
        <div className="container mx-auto px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="px-2 py-1 bg-velvet/20 text-velvet rounded">LIVE</div>
          <span>Opening Night: "The Design Technologist" — May 2026 • Box Office: Open for Collaborative Innovation & Engineering Roles</span>
        </div>
      </div>
    </header>
  );
}
