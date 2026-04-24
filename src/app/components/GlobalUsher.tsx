import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Theater, MapPin, Calendar, User, CreditCard, Settings, X } from 'lucide-react';

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
  { id: '8', title: 'Seating Charts', category: 'Venue Info', icon: MapPin },
  { id: '9', title: 'Account Settings', category: 'Account', icon: User },
  { id: '10', title: 'Preferences', category: 'Account', icon: Settings },
];

export function GlobalUsher({ isOpen, onClose, onSelect }: GlobalUsherProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-stage-base/90 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-2xl mx-4 bg-stage-depth rounded-xl shadow-2xl overflow-hidden"
            style={{
              boxShadow: '0 0 40px rgba(212, 175, 55, 0.3), 0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-spotlight/20 p-4">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-spotlight" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search shows, venues, or your account..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                  style={{ fontFamily: 'var(--font-display)' }}
                />
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-spotlight/10 rounded-md transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {filteredActions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="py-2">
                  {Object.entries(
                    filteredActions.reduce((acc, action) => {
                      if (!acc[action.category]) acc[action.category] = [];
                      acc[action.category].push(action);
                      return acc;
                    }, {} as Record<string, Action[]>)
                  ).map(([category, actions]) => (
                    <div key={category}>
                      <div className="px-4 py-2 text-xs text-spotlight/70 uppercase tracking-wider">
                        {category}
                      </div>
                      {actions.map((action, index) => {
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
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-spotlight/20 to-transparent border-l-2 border-spotlight shadow-lg'
                                : 'hover:bg-spotlight/5'
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
                                isSelected ? 'text-spotlight' : 'text-muted-foreground'
                              }`}
                            />
                            <span className="flex-1 text-left">{action.title}</span>
                            {action.badge && (
                              <span className="px-2 py-1 text-xs bg-accent-primary/20 text-accent-primary rounded-md border border-accent-primary/30">
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

            <div className="border-t border-spotlight/20 px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-intermission-gray rounded text-spotlight">↑</kbd>
                  <kbd className="px-2 py-1 bg-intermission-gray rounded text-spotlight">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-intermission-gray rounded text-spotlight">↵</kbd>
                  <span>Select</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-intermission-gray rounded text-spotlight">ESC</kbd>
                <span>Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
