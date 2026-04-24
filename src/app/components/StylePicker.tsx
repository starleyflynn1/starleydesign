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
          className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
          aria-label="Select theme"
        >
          <Palette className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Theme Style</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.values(THEMES).map((themeName) => {
          const config = themeConfigs[themeName];
          const isActive = currentTheme === themeName;

          return (
            <DropdownMenuItem
              key={themeName}
              onClick={() => setTheme(themeName)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex gap-1">
                  <div
                    className="w-3 h-3 rounded-full border border-border"
                    style={{ backgroundColor: config.colors.primary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-border"
                    style={{ backgroundColor: config.colors.accent }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{config.displayName}</div>
                  <div className="text-xs text-muted-foreground">{config.description}</div>
                </div>
                {isActive && <Check className="w-4 h-4 text-primary" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
