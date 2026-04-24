import { Palette, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { themeConfigs, THEMES } from '../contexts/theme-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function StylePicker() {
  const { currentTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="style-picker-trigger"
          aria-label="Select theme"
        >
          <Palette className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="style-picker-menu">
        <DropdownMenuLabel>Theme Style</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.values(THEMES).map((themeName) => {
          const config = themeConfigs[themeName];
          const isActive = currentTheme === themeName;

          return (
            <DropdownMenuItem
              key={themeName}
              onClick={() => setTheme(themeName)}
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
                {isActive && <Check className="style-picker-check" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
