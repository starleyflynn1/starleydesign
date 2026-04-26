import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Theater, MapPin, Grid3X3, Calendar, User, CreditCard, Settings, X } from 'lucide-react';

interface Action {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  badge?: string;
}

interface GlobalUsherProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (action: Action) => void;
}

const mockActions: Action[] = [
  { id: '1', title: 'Hamilton', category: 'Current Productions', icon: Theater, badge: 'Selling Fast' },
  { id: '2', title: 'The Phantom of the Opera', category: 'Current Productions', icon: Theater },
  { id: '3', title: 'Wicked', category: 'Current Productions', icon: Theater, badge: 'Starting Soon' },
  { id: '4', title: 'Les Misérables', category: 'Coming Soon', icon: Calendar },
  { id: '5', title: 'The Lion King', category: 'Coming Soon', icon: Calendar },
  { id: '6', title: 'My Tickets', category: 'Account', icon: CreditCard },
  { id: '7', title: 'Venue Information', category: 'Venue Info', icon: MapPin },
  { id: '8', title: 'Seating Chart', category: 'Venue Info', icon: Grid3X3 },
  { id: '9', title: 'Account Settings', category: 'Account', icon: User },
  { id: '10', title: 'Preferences', category: 'Account', icon: Settings },
];

export function GlobalUsher({ isOpen, onClose, onSelect }: GlobalUsherProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const filteredActions = query
    ? mockActions.filter(
        (action) =>
          action.title.toLowerCase().includes(query.toLowerCase()) ||
          action.category.toLowerCase().includes(query.toLowerCase())
      )
    : mockActions;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        onSelect(filteredActions[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      '[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const focusableElements = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1);
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first || !panel.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (!active || active === last || !panel.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="usher-overlay-wrap">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="usher-backdrop"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="usher-panel"
            ref={panelRef}
            style={{
              boxShadow: '0 0 40px rgba(212, 175, 55, 0.3), 0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={trapFocus}
            role="dialog"
            aria-modal="true"
            aria-label="Global Usher command palette"
          >
            <div className="usher-search-wrap">
              <div className="usher-search-row">
                <Search className="icon-md-spotlight" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search shows, venues, or your account..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="usher-input"
                />
                <button
                  onClick={onClose}
                  className="usher-close-btn"
                  aria-label="Close"
                >
                  <X className="icon-md-muted" />
                </button>
              </div>
            </div>

            <div className="usher-results">
              {filteredActions.length === 0 ? (
                <div className="usher-no-results">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="usher-group-list">
                  {Object.entries(
                    filteredActions.reduce((acc, action) => {
                      if (!acc[action.category]) acc[action.category] = [];
                      acc[action.category].push(action);
                      return acc;
                    }, {} as Record<string, Action[]>)
                  ).map(([category, actions]) => (
                    <div key={category}>
                      <div className="usher-group-label">
                        {category}
                      </div>
                      {actions.map((action) => {
                        const globalIndex = filteredActions.indexOf(action);
                        const isSelected = globalIndex === selectedIndex;
                        const Icon = action.icon;

                        return (
                          <button
                            key={action.id}
                            onClick={() => {
                              onSelect(action);
                              onClose();
                            }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`usher-action-btn ${
                              isSelected
                                ? 'usher-action-selected'
                                : 'usher-action-hover'
                            }`}
                            style={
                              isSelected
                                ? {
                                    boxShadow: 'inset 0 0 20px rgba(212, 175, 55, 0.1)',
                                  }
                                : {}
                            }
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                isSelected ? 'icon-md-spotlight' : 'icon-md-muted'
                              }`}
                            />
                            <span className="usher-action-title">{action.title}</span>
                            {action.badge && (
                              <span className="usher-badge">
                                {action.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="usher-footer">
              <div className="usher-footer-keys">
                <div className="usher-footer-keygroup">
                  <kbd className="usher-kbd">↑</kbd>
                  <kbd className="usher-kbd">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="usher-footer-keygroup">
                  <kbd className="usher-kbd">↵</kbd>
                  <span>Select</span>
                </div>
              </div>
              <div className="usher-footer-keygroup">
                <kbd className="usher-kbd">ESC</kbd>
                <span>Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
