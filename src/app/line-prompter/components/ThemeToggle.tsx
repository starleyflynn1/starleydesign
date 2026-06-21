import { MoonIcon, SunIcon } from './Icons';
import type { Theme } from '../lib/theme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLight ? (
        <MoonIcon className="theme-toggle-icon" width={20} height={20} />
      ) : (
        <SunIcon className="theme-toggle-icon" width={20} height={20} />
      )}
    </button>
  );
}
