import { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';
import { CheckIcon } from './AppIcons';
import { useTheme } from '../contexts/ThemeContext';
import { themeConfigs, THEMES } from '../contexts/theme-config';

export interface StylePickerProps {
  onThemeSelected?: () => void;
  onOpenChange?: (open: boolean) => void;
  onEscape?: () => void;
}

export function StylePicker({ onThemeSelected, onOpenChange, onEscape }: StylePickerProps) {
  const { currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const menuFocusable = rootRef.current?.querySelectorAll<HTMLElement>(
      '.style-picker-menu button:not([disabled]), .style-picker-menu [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = menuFocusable?.[0];
    firstFocusable?.focus();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!rootRef.current?.contains(target)) setIsOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        onEscape?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = rootRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      } else {
        triggerRef.current?.focus();
      }
    };
  }, [isOpen, onEscape]);

  return (
    <div className="style-picker-root" ref={rootRef}>
      <div>
        <button
          type="button"
          className="style-picker-trigger"
          aria-label="Select theme"
          title="Select theme"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls="style-picker-menu"
          onClick={() => setIsOpen((prev) => !prev)}
          ref={triggerRef}
        >
          <Palette className="w-5 h-5" />
        </button>
      </div>
      {isOpen && (
        <div id="style-picker-menu" className="style-picker-menu" role="menu" aria-label="Theme Style">
          <div className="style-picker-menu-label">Theme Style</div>
          <div className="style-picker-menu-separator" aria-hidden="true"></div>
          {Object.values(THEMES).map((themeName) => {
            const config = themeConfigs[themeName];
            const isActive = currentTheme === themeName;

            return (
              <button
                key={themeName}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setTheme(themeName);
                  setIsOpen(false);
                  onThemeSelected?.();
                }}
                className="style-picker-item"
              >
                <div className="style-picker-item-row">
                  <div className="style-picker-swatch-row">
                    <div
                      className="style-picker-swatch"
                      style={{ backgroundColor: config.colors.primary }}
                    />
                    <div
                      className="style-picker-swatch"
                      style={{ backgroundColor: config.colors.accent }}
                    />
                  </div>
                  <div className="style-picker-copy">
                    <div className="style-picker-title">{config.displayName}</div>
                    <div className="style-picker-description">{config.description}</div>
                  </div>
                  {isActive && <CheckIcon className="style-picker-check" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
