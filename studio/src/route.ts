// Where the Studio is, kept in the address after the #, so the browser's Back walks back through
// what was opened, and a link from Chat can open one record:
// `#/w/<world>?kind=character&in=<place>&rec=<record>&door=rules`.
import { useMemo, useSyncExternalStore } from 'react';
import { RECORD_KINDS, type RecordKind } from '../../core/records/index.js';

// The jobs a record's page opens onto (docs/bids/ui/decision.md).
export const DOORS = ['day', 'rules', 'adventure', 'chat', 'context'] as const;
export type Door = (typeof DOORS)[number];
export const PAGES = ['about', 'rules', 'checks'] as const;
export type Page = (typeof PAGES)[number];

export interface Route {
  worldId: string | null;
  // The list's level: a kind, and for places the place it is inside.
  kind: RecordKind | null;
  inside: string | null;
  // What is open beside or over the list: one of the world's own pages, or a record.
  page: Page | null;
  rec: string | null;
  door: Door | null;
  // The part of World › Rules that is open.
  part: string | null;
}

export const NOWHERE: Route = { worldId: null, kind: null, inside: null, page: null, rec: null, door: null, part: null };

const oneOf = <T extends string>(list: readonly T[], value: string | null): T | null => (value && (list as readonly string[]).includes(value) ? (value as T) : null);

export function parseRoute(hash: string): Route {
  const found = /^#\/w\/([^?]+)(?:\?(.*))?$/.exec(hash);
  if (!found) return NOWHERE;
  let worldId: string;
  try { worldId = decodeURIComponent(found[1]!); } catch { return NOWHERE; }
  const asked = new URLSearchParams(found[2] ?? '');
  const rec = asked.get('rec');
  return {
    worldId,
    kind: oneOf(RECORD_KINDS, asked.get('kind')),
    inside: asked.get('in'),
    page: rec ? null : oneOf(PAGES, asked.get('page')),
    rec,
    door: oneOf(DOORS, asked.get('door')),
    part: asked.get('part'),
  };
}

export function formatRoute(route: Route): string {
  if (!route.worldId) return '';
  const asked = new URLSearchParams();
  if (route.kind) asked.set('kind', route.kind);
  if (route.kind === 'place' && route.inside) asked.set('in', route.inside);
  if (route.rec) asked.set('rec', route.rec); else if (route.page) asked.set('page', route.page);
  if (route.door) asked.set('door', route.door);
  if (route.page === 'rules' && !route.rec && route.part) asked.set('part', route.part);
  const rest = asked.toString();
  return `#/w/${encodeURIComponent(route.worldId)}${rest ? `?${rest}` : ''}`;
}

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  window.addEventListener('hashchange', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
    window.removeEventListener('hashchange', listener);
  };
}

// Going somewhere adds a step for Back to undo. `replace` changes the address without one.
export function navigate(route: Route, replace = false) {
  const hash = formatRoute(route);
  if (hash === window.location.hash) return;
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  if (replace) window.history.replaceState(null, '', url); else window.history.pushState(null, '', url);
  for (const listener of [...listeners]) listener();
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  return useMemo(() => parseRoute(hash), [hash]);
}
