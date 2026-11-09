// Paper by day, ink by night (docs/brand.md), or whatever the device is set to. One choice for
// the whole site.
import { useEffect, useState } from 'react';

export type Theme = 'auto' | 'paper' | 'night';
export const THEME_KEY = 'inkwyrm.theme';
export const THEME_NAMES: Record<Theme, string> = { auto: 'Match device', paper: 'Paper', night: 'Night' };

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'paper' || stored === 'night' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

export function applyTheme(theme: Theme) {
  const night = theme === 'night' || (theme === 'auto' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = night ? 'night' : 'paper';
}

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* private browsing: the choice lasts this visit */ }
  }, [theme]);
  return [theme, setTheme];
}
