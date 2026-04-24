export const THEMES = {
  stage: 'stage',
  blueprint: 'blueprint',
  coastal: 'coastal',
  neon: 'neon',
  terminal: 'terminal',
  archive: 'archive',
} as const;

export type ThemeName = keyof typeof THEMES;

export const MODES = {
  light: 'light',
  dark: 'dark',
} as const;

export type Mode = keyof typeof MODES;

export interface ThemeConfig {
  name: ThemeName;
  displayName: string;
  description: string;
  radius: {
    button: string;
    card: string;
    input: string;
  };
  colors: {
    primary: string;
    accent: string;
  };
}

export const themeConfigs: Record<ThemeName, ThemeConfig> = {
  stage: {
    name: 'stage',
    displayName: 'Stage',
    description: 'Red/Gold/Velvet - Classic theater elegance',
    radius: {
      button: 'rounded-lg',
      card: 'rounded-2xl',
      input: 'rounded-md',
    },
    colors: {
      primary: '#c41e3a',
      accent: '#d4af37',
    },
  },
  blueprint: {
    name: 'blueprint',
    displayName: 'Blueprint',
    description: 'Blue/Grid/Mono - Architectural precision',
    radius: {
      button: 'rounded-sm',
      card: 'rounded-lg',
      input: 'rounded-sm',
    },
    colors: {
      primary: '#2563eb',
      accent: '#3b82f6',
    },
  },
  coastal: {
    name: 'coastal',
    displayName: 'Coastal',
    description: 'Sage/Slate/Soft - Organic and calming',
    radius: {
      button: 'rounded-2xl',
      card: 'rounded-3xl',
      input: 'rounded-2xl',
    },
    colors: {
      primary: '#6b8e7f',
      accent: '#88a89d',
    },
  },
  neon: {
    name: 'neon',
    displayName: 'Neon',
    description: 'Cyber-cyan/Magenta - Cyberpunk aesthetics',
    radius: {
      button: 'rounded-none',
      card: 'rounded-none',
      input: 'rounded-none',
    },
    colors: {
      primary: '#00ffff',
      accent: '#ff00ff',
    },
  },
  terminal: {
    name: 'terminal',
    displayName: 'Terminal',
    description: 'Matrix-green/Mono - Developer console',
    radius: {
      button: 'rounded-md',
      card: 'rounded-lg',
      input: 'rounded',
    },
    colors: {
      primary: '#00ff41',
      accent: '#39ff14',
    },
  },
  archive: {
    name: 'archive',
    displayName: 'Archive',
    description: 'Ink-black/Aged-parchment - Vintage library',
    radius: {
      button: 'rounded-xl',
      card: 'rounded-2xl',
      input: 'rounded-lg',
    },
    colors: {
      primary: '#2b2b2b',
      accent: '#8b7355',
    },
  },
};
