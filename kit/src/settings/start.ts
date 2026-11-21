// Start here (phase F4): where opening the site takes this browser. The front page by default;
// someone who only chats can land in Chat. Only an arrival from outside is sent on, so the
// header's own link to the front page always reaches it.
import { ADDRESS } from '../addresses';

export type StartPlace = 'front' | 'chat' | 'adventure' | 'studio';
export const START_KEY = 'inkwyrm.start';
export const START_NAMES: Record<StartPlace, string> = { front: 'The front page', chat: 'Chat', adventure: 'The adventure', studio: 'The Studio' };
const PLACES = Object.keys(START_NAMES) as StartPlace[];

export function readStart(): StartPlace {
  try {
    const stored = window.localStorage.getItem(START_KEY) as StartPlace | null;
    return stored && PLACES.includes(stored) ? stored : 'front';
  } catch {
    return 'front';
  }
}

export function saveStart(place: StartPlace): void {
  try {
    if (place === 'front') window.localStorage.removeItem(START_KEY); else window.localStorage.setItem(START_KEY, place);
  } catch { /* the front page it is */ }
}

// Where an arrival at the root goes instead of the front page, or null to stay. Only a bare root
// with no address of its own, reached from outside the site.
export function startRedirect(place: StartPlace, location: { pathname: string; search: string; hash: string; origin: string }, referrer: string): string | null {
  if (place === 'front' || location.pathname !== '/' || location.search || location.hash) return null;
  let fromHere = false;
  try { fromHere = Boolean(referrer) && new URL(referrer).origin === location.origin; } catch { /* an unreadable referrer is from outside */ }
  if (fromHere) return null;
  return ADDRESS[place];
}
