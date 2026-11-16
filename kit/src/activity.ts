// What was last opened, across the site (docs/front-page/implementation.md, *Navigation state*):
// a short list of the places someone intentionally went, newest first, so the Overview can offer
// one exact Continue. Kept in this browser as `inkwyrm.navigation.v1`.
//
// An entry is written only after its destination really opened. Background saves, reconnects
// and the Overview's own reads never write here. It holds identifiers only: never keys,
// transcripts or model requests.

export type Target =
  | { kind: 'chat'; chatId: string }
  | { kind: 'adventure'; saveId: string }
  // A Home in Chat: a scenario with rooms, by its world and its own id.
  | { kind: 'home'; worldId: string; scenarioId: string }
  | { kind: 'studio'; worldId: string; recordId?: string; door?: string };

export interface Activity { target: Target; openedAt: number }

export interface NavigationV1 { version: 1; recent: Activity[] }

export const NAVIGATION_KEY = 'inkwyrm.navigation.v1';
export const MOST_RECENT = 20;

const text = (value: unknown, most = 200): value is string => typeof value === 'string' && value.length > 0 && value.length <= most;

function readTarget(raw: unknown): Target | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  if (value.kind === 'chat' && text(value.chatId)) return { kind: 'chat', chatId: value.chatId };
  if (value.kind === 'adventure' && text(value.saveId)) return { kind: 'adventure', saveId: value.saveId };
  if (value.kind === 'home' && text(value.worldId) && text(value.scenarioId)) return { kind: 'home', worldId: value.worldId, scenarioId: value.scenarioId };
  if (value.kind === 'studio' && text(value.worldId)) {
    return {
      kind: 'studio', worldId: value.worldId,
      ...(text(value.recordId) ? { recordId: value.recordId } : {}),
      ...(text(value.door, 40) ? { door: value.door } : {}),
    };
  }
  return null;
}

// Whatever was stored, read safely: anything malformed is dropped, never the whole list.
export function readNavigation(raw: string | null): NavigationV1 {
  let parsed: unknown = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
  const list = parsed && typeof parsed === 'object' && Array.isArray((parsed as { recent?: unknown }).recent) ? (parsed as { recent: unknown[] }).recent : [];
  const recent: Activity[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const target = readTarget((entry as { target?: unknown }).target);
    const openedAt = (entry as { openedAt?: unknown }).openedAt;
    if (!target || typeof openedAt !== 'number' || !Number.isFinite(openedAt) || openedAt <= 0) continue;
    recent.push({ target, openedAt });
  }
  recent.sort((a, b) => b.openedAt - a.openedAt);
  return { version: 1, recent: dedupe(recent).slice(0, MOST_RECENT) };
}

// One entry per place: a chat, a save, a home, a world (the record and door are where in it).
export const sameTarget = (a: Target, b: Target) =>
  a.kind === b.kind && (a.kind === 'chat' ? a.chatId === (b as typeof a).chatId : a.kind === 'adventure' ? a.saveId === (b as typeof a).saveId
    : a.kind === 'home' ? a.worldId === (b as typeof a).worldId && a.scenarioId === (b as typeof a).scenarioId : a.worldId === (b as typeof a).worldId);

function dedupe(list: Activity[]): Activity[] {
  const kept: Activity[] = [];
  for (const entry of list) if (!kept.some((existing) => sameTarget(existing.target, entry.target))) kept.push(entry);
  return kept;
}

export function withActivity(navigation: NavigationV1, target: Target, openedAt: number): NavigationV1 {
  return { version: 1, recent: [{ target, openedAt }, ...navigation.recent.filter((entry) => !sameTarget(entry.target, target))].slice(0, MOST_RECENT) };
}

export function loadNavigation(): NavigationV1 {
  try { return readNavigation(window.localStorage.getItem(NAVIGATION_KEY)); } catch { return { version: 1, recent: [] }; }
}

// Called by a side once a destination has really opened.
export function recordActivity(target: Target, openedAt = Date.now()): void {
  try {
    const next = withActivity(loadNavigation(), target, openedAt);
    window.localStorage.setItem(NAVIGATION_KEY, JSON.stringify(next));
  } catch { /* a browser that keeps nothing simply has no Continue */ }
}

// The addresses each side reads. The Studio's follow `studio/src/route.ts`.
export const hrefFor = (target: Target): string => {
  if (target.kind === 'chat') return `/chat/#/chat/${encodeURIComponent(target.chatId)}`;
  if (target.kind === 'adventure') return `/?save=${encodeURIComponent(target.saveId)}`;
  if (target.kind === 'home') return homeHref(target.worldId, target.scenarioId);
  const asked = new URLSearchParams();
  if (target.recordId) asked.set('rec', target.recordId);
  if (target.recordId && target.door) asked.set('door', target.door);
  const query = asked.toString();
  return `/studio/#/w/${encodeURIComponent(target.worldId)}${query ? `?${query}` : ''}`;
};

export const homeHref = (worldId: string, scenarioId: string) => `/chat/#/home/${encodeURIComponent(worldId)}/${encodeURIComponent(scenarioId)}`;
export const chatWithHref = (worldId: string, recordId: string) => `/chat/#/with/${encodeURIComponent(worldId)}/${encodeURIComponent(recordId)}`;
