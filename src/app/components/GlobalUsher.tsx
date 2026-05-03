import React, { useEffect, useMemo, useState, useRef, useId } from 'react';
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
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  const filteredActions = useMemo(
    () => (query
      ? mockActions.filter(
          (action) =>
            action.title.toLowerCase().includes(query.toLowerCase()) ||
            action.category.toLowerCase().includes(query.toLowerCase())
        )
      : mockActions),
    [query]
  );

  /** Preserve filter order while grouping for display (Object.entries order ≠ flat list order). */
  const groupedFilteredActions = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, Action[]>();
    for (const action of filteredActions) {
      if (!map.has(action.category)) {
        map.set(action.category, []);
        order.push(action.category);
      }
      map.get(action.category)!.push(action);
    }
    return order.map((category) => [category, map.get(category)!] as const);
  }, [filteredActions]);
  const orderedActions = useMemo(
    () => groupedFilteredActions.flatMap(([, actions]) => actions),
    [groupedFilteredActions]
  );
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedActionId(orderedActions[0]?.id ?? null);
  }, [query, orderedActions]);

  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    if (!selectedActionId) return;
    const id = selectedActionId;
    // Defer scroll measurement until after layout so we don't force sync layout mid-render.
    const raf = requestAnimationFrame(() => {
      const activeAction = panel.querySelector<HTMLElement>(`[data-usher-id="${id}"]`);
      activeAction?.scrollIntoView({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen, selectedActionId]);

  const moveSelection = (delta: number) => {
    const len = orderedActions.length;
    if (len === 0) return;
    const currentIndex = selectedActionId
      ? orderedActions.findIndex((action) => action.id === selectedActionId)
      : -1;
    const baseIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (baseIndex + delta + len) % len;
    setSelectedActionId(orderedActions[nextIndex].id);
  };

  const confirmSelection = () => {
    const action = orderedActions.find((candidate) => candidate.id === selectedActionId)
      ?? orderedActions[0];
    if (!action) return;
    onSelect(action);
    onClose();
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSelectedActionId(orderedActions[0]?.id ?? null);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSelectedActionId(orderedActions[orderedActions.length - 1]?.id ?? null);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      confirmSelection();
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
            onKeyDownCapture={(e) => {
              if (
                e.key === 'ArrowDown' ||
                e.key === 'ArrowUp' ||
                e.key === 'Enter' ||
                e.key === 'Escape' ||
                e.key === 'Home' ||
                e.key === 'End'
              ) {
                handleListKeyDown(e);
              }
            }}
            onKeyDown={trapFocus}
            role="dialog"
            aria-modal="true"
            aria-label="Global Usher command palette"
          >
            <div className="usher-search-wrap">
              <div className="usher-search-row">
                <Search className="icon-md-spotlight" aria-hidden />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search shows, venues, or your account..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="usher-input"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls={listboxId}
                  aria-expanded={filteredActions.length > 0}
                  aria-activedescendant={
                    selectedActionId && filteredActions.some((a) => a.id === selectedActionId)
                      ? `${baseId}-option-${selectedActionId}`
                      : undefined
                  }
                  aria-haspopup="listbox"
                />
                <button
                  onClick={onClose}
                  className="usher-close-btn"
                  aria-label="Close"
                >
                  <X className="icon-md-muted" aria-hidden />
                </button>
              </div>
            </div>

            <div className="usher-results">
              {filteredActions.length === 0 ? (
                <div className="usher-no-results" role="status" aria-live="polite">
                  No results found for &quot;{query}&quot;
                </div>
              ) : (
                <div
                  className="usher-group-list"
                  id={listboxId}
                  role="listbox"
                  aria-label="Suggestions"
                >
                  {groupedFilteredActions.map(([category, actions], groupIndex) => {
                    const categoryHeadingId = `${baseId}-cat-${groupIndex}`;
                    return (
                      <div key={category} role="group" aria-labelledby={categoryHeadingId}>
                        <div id={categoryHeadingId} className="usher-group-label">
                          {category}
                        </div>
                        {actions.map((action) => {
                          const isSelected = action.id === selectedActionId;
                          const Icon = action.icon;
                          const optionLabel = action.badge
                            ? `${action.category}, ${action.title}, ${action.badge}`
                            : `${action.category}, ${action.title}`;

                          return (
                            <div
                              key={action.id}
                              role="option"
                              id={`${baseId}-option-${action.id}`}
                              aria-selected={isSelected}
                              aria-label={optionLabel}
                              tabIndex={-1}
                              onClick={() => {
                                onSelect(action);
                                onClose();
                              }}
                              onMouseEnter={() => setSelectedActionId(action.id)}
                              className={`usher-action-btn ${
                                isSelected
                                  ? 'usher-action-selected'
                                  : 'usher-action-hover'
                              }`}
                              data-usher-id={action.id}
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
                                aria-hidden
                              />
                              <span className="usher-action-title" aria-hidden="true">
                                {action.title}
                              </span>
                              {action.badge && (
                                <span className="usher-badge" aria-hidden="true">
                                  {action.badge}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="usher-footer">
              <div className="usher-footer-keys">
                <div className="usher-footer-keygroup">
                  <kbd className="usher-kbd" aria-label="Up arrow">
                    <span aria-hidden>↑</span>
                  </kbd>
                  <kbd className="usher-kbd" aria-label="Down arrow">
                    <span aria-hidden>↓</span>
                  </kbd>
                  <span className="usher-footer-hint">Navigate</span>
                </div>
                <div className="usher-footer-keygroup">
                  <kbd className="usher-kbd" aria-label="Enter">
                    <span aria-hidden>↵</span>
                  </kbd>
                  <span className="usher-footer-hint">Select</span>
                </div>
              </div>
              <div className="usher-footer-keygroup">
                <kbd className="usher-kbd" aria-label="Escape">
                  <span aria-hidden>ESC</span>
                </kbd>
                <span className="usher-footer-hint">Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
