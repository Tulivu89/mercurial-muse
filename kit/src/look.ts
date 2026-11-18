// Looks (docs/looks.md): a skin the site wears over Wet Ink. A world can name one (world.look),
// and while someone is inside that world the header, controls and story take it. The player's
// own choice wins: follow the world, keep Wet Ink everywhere, or wear one look everywhere.
// The look rides on <html data-look>, beside data-theme (paper or night), and only redefines
// the tokens of ink.css and the shared parts in looks.css.
import { useEffect, useState } from 'react';
import { WORLD_LOOKS, type WorldLook } from '../../core/records/schema';
import { applyTheme, readTheme } from './theme';

export type LookChoice = 'world' | 'ink' | WorldLook;
export const LOOK_KEY = 'inkwyrm.look';
export const LOOK_NAMES: Record<LookChoice, string> = {
  world: 'Follow the world',
  ink: 'Wet Ink everywhere',
  feed: 'Live Feed',
  outrun: 'Outrun',
  phosphor: 'Phosphor',
  halcyon: 'Halcyon',
};
export const WORLD_LOOK_NAMES: Record<WorldLook, string> = { feed: 'Live Feed', outrun: 'Outrun', phosphor: 'Phosphor', halcyon: 'Halcyon' };
export const WORLD_LOOK_NOTES: Record<WorldLook, string> = {
  feed: 'A live broadcast: navy-black, magenta to act, cyan for the player.',
  outrun: 'Synthwave: violet-black, chrome headings, and a level meter in the Send button.',
  phosphor: 'A terminal: mono type, amber and green, replies as a transcript.',
  halcyon: 'Glass and clipped corners, rose-gold and ice. Has a day version.',
};
// Looks with no day version: they bring night with them (theme.ts).
const DARK: WorldLook[] = ['feed', 'outrun', 'phosphor'];
const CHOICES: LookChoice[] = ['world', 'ink', ...WORLD_LOOKS];

// Each look's faces, loaded from Google Fonts the first time the look is worn.
const FONTS: Record<WorldLook, string> = {
  feed: 'family=Chakra+Petch:wght@600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600',
  outrun: 'family=Orbitron:wght@600;800&family=Chakra+Petch:wght@400;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400',
  phosphor: 'family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@700',
  halcyon: 'family=Syncopate:wght@700&family=Instrument+Sans:ital,wght@0,400;0,600;1,400',
};

export function readLook(): LookChoice {
  try {
    const stored = localStorage.getItem(LOOK_KEY) as LookChoice | null;
    return stored && CHOICES.includes(stored) ? stored : 'world';
  } catch {
    return 'world';
  }
}

// What the site wears: the player's look if they chose one, the world's if they follow it.
export function resolveLook(choice: LookChoice, worldLook?: WorldLook | null): WorldLook | null {
  if (choice === 'ink') return null;
  if (choice === 'world') return worldLook ?? null;
  return choice;
}

function loadFonts(look: WorldLook) {
  if (typeof document === 'undefined' || document.getElementById(`look-fonts-${look}`)) return;
  const link = document.createElement('link');
  link.id = `look-fonts-${look}`;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${FONTS[look]}&display=swap`;
  document.head.appendChild(link);
}

export function applyLook(look: WorldLook | null) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (look) { loadFonts(look); root.dataset.look = look; } else delete root.dataset.look;
  if (look && DARK.includes(look)) root.dataset.lookDark = 'true'; else delete root.dataset.lookDark;
  applyTheme(readTheme());
}

// The player's choice, kept on this device, and the look it gives with the world in view.
export function useLook(worldLook?: WorldLook | null): [LookChoice, (choice: LookChoice) => void] {
  const [choice, setChoice] = useState<LookChoice>(readLook);
  useEffect(() => {
    try { localStorage.setItem(LOOK_KEY, choice); } catch { /* private browsing: the choice lasts this visit */ }
  }, [choice]);
  useEffect(() => { applyLook(resolveLook(choice, worldLook)); }, [choice, worldLook]);
  return [choice, setChoice];
}
