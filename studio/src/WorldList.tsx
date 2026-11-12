// The record list, one level at a time (docs/bids/ui/decision.md): the world's own page, with
// each kind and its count and the world's pages under them; then a kind; then inside a place.
// Every row carries the record's line, because at a few hundred records a name alone is not
// enough to tell two people apart. Find crosses every kind at once.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { KIND_NAMES, RECORD_KINDS, type RecordKind, type StoryRecord, type World } from '../../core/records/index.js';
import { changedCount } from '../../core/rules/index.js';
import { downloadJson, fileSafe } from '../../kit/src/util';
import { byName } from './RecordPick';
import { findRecords } from './find';
import type { Route } from './route';

export type Order = 'name' | 'added';
type Status = { text: string; bad?: boolean } | null;

// The list's own settings, per world, in this browser only: the order, and what was opened lately.
// They are never part of a world file.
export interface ListPrefs { order: Order; lately: string[] }
const LATELY = 6;
const prefsKey = (worldId: string) => `inkwyrm.studio.list.${worldId}`;
export function readList(worldId: string): ListPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(prefsKey(worldId)) ?? '{}');
    return { order: raw.order === 'added' ? 'added' : 'name', lately: Array.isArray(raw.lately) ? raw.lately.filter((entry: unknown): entry is string => typeof entry === 'string').slice(0, LATELY) : [] };
  } catch { return { order: 'name', lately: [] }; }
}
export function keepList(worldId: string, prefs: ListPrefs): ListPrefs {
  try { localStorage.setItem(prefsKey(worldId), JSON.stringify(prefs)); } catch { /* not kept */ }
  return prefs;
}
export const withOpened = (prefs: ListPrefs, recordId: string): ListPrefs => ({ ...prefs, lately: [recordId, ...prefs.lately.filter((entry) => entry !== recordId)].slice(0, LATELY) });

// Places by the place they are inside. One inside a place that is gone, or inside itself, counts
// as a top place, so nothing can drop out of the list.
function placeTree(world: World): Map<string | null, StoryRecord[]> {
  const places = world.records.filter((record) => record.kind === 'place');
  const ids = new Set(places.map((place) => place.id));
  const children = new Map<string | null, StoryRecord[]>();
  for (const place of places) {
    const parent = place.parentId && ids.has(place.parentId) ? place.parentId : null;
    children.set(parent, [...(children.get(parent) ?? []), place]);
  }
  const reached = new Set<string>();
  const walk = (parentId: string | null) => {
    for (const place of children.get(parentId) ?? []) {
      if (reached.has(place.id)) continue;
      reached.add(place.id);
      walk(place.id);
    }
  };
  walk(null);
  const loose = places.filter((place) => !reached.has(place.id));
  if (loose.length) {
    for (const [parent, list] of children) if (parent !== null) children.set(parent, list.filter((place) => reached.has(place.id)));
    children.set(null, [...(children.get(null) ?? []), ...loose]);
  }
  return children;
}

// The places a place sits inside, outermost first.
function trailOf(world: World, placeId: string): StoryRecord[] {
  const out: StoryRecord[] = [];
  const seen = new Set<string>();
  let at = world.records.find((record) => record.id === placeId);
  while (at?.parentId && !seen.has(at.id)) {
    seen.add(at.id);
    at = world.records.find((record) => record.id === at!.parentId && record.kind === 'place');
    if (at) out.unshift(at);
  }
  return out;
}

const aOrAn = (word: string) => `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word.toLowerCase()}`;

// A row: the name, a second line under it, and room for one more control beside it. The name is
// what a screen reader calls it; the second line is its description.
function Row({ name, says, current, mark, onOpen, children }: { name: string; says?: string; current?: boolean; mark?: string; onOpen: () => void; children?: ReactNode }) {
  const id = useId();
  return (
    <div className="row-pair">
      <button type="button" className="item" aria-current={current || undefined} aria-labelledby={`${id}-n`} aria-describedby={says ? `${id}-s` : undefined} onClick={onOpen}>
        <span className="item-text">
          <span id={`${id}-n`} className="item-name">{name}</span>
          {says && <small id={`${id}-s`}>{says}</small>}
        </span>
        {mark && <small className="flag">{mark}</small>}
      </button>
      {children}
    </div>
  );
}

export function WorldList({ world, route, go, prefs, onPrefs, flagged, checks, contextSays, status, onAdd, onImportCard }: {
  world: World;
  route: Route;
  go: (patch: Partial<Route>) => void;
  prefs: ListPrefs;
  onPrefs: (prefs: ListPrefs) => void;
  // Records the Checks page has something to say about.
  flagged: ReadonlySet<string>;
  checks: number;
  contextSays: string;
  status: Status;
  onAdd: (kind: RecordKind, parentId: string | null) => void;
  onImportCard: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [query, setQuery] = useState('');
  const found = useMemo(() => (query.trim() ? findRecords(world, query) : null), [world, query]);
  const tree = useMemo(() => placeTree(world), [world]);
  const inside = route.kind === 'place' && route.inside ? world.records.find((record) => record.id === route.inside && record.kind === 'place') : undefined;
  const open = (id: string) => go({ rec: id, page: null, door: null });
  const sorted = (entries: StoryRecord[]) => (prefs.order === 'name' ? [...entries].sort(byName) : entries);
  const says = (record: StoryRecord) => record.line || (record.kind === 'group' && record.groupKind !== 'other' ? record.groupKind : '');

  // The list scrolls on its own beside the page on a wide screen. Going in starts at the top;
  // coming back out returns to the row that was left.
  const rail = useRef<HTMLElement>(null);
  const level = `${route.kind ?? ''}:${inside?.id ?? ''}`;
  const depth = !route.kind ? 0 : !inside ? 1 : 2 + trailOf(world, inside.id).length;
  const seen = useRef(new Map<string, number>());
  const last = useRef({ level, depth });
  useEffect(() => {
    const el = rail.current;
    if (!el) return undefined;
    const onScroll = () => { seen.current.set(last.current.level, el.scrollTop); };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  useLayoutEffect(() => {
    if (last.current.level === level) return;
    const up = depth < last.current.depth;
    last.current = { level, depth };
    if (rail.current) rail.current.scrollTop = up ? seen.current.get(level) ?? 0 : 0;
  }, [level, depth]);

  const find = (
    <div className="find">
      <input className="input" type="search" aria-label="Find a record" placeholder={`Find among ${world.records.length} records`} value={query} onChange={(event) => setQuery(event.target.value)} />
      {route.kind && !found && (
        <select className="input pick" aria-label="Order" value={prefs.order} onChange={(event) => onPrefs({ ...prefs, order: event.target.value as Order })}>
          <option value="name">A to Z</option>
          <option value="added">As added</option>
        </select>
      )}
    </div>
  );

  const results = found && (
    <section className="kind" aria-label="Found">
      {found.length === 0 && <p className="empty">Nothing called that.</p>}
      {found.map((entry) => (
        <Row key={entry.id} name={entry.name} current={route.rec === entry.id} mark={flagged.has(entry.id) ? 'to check' : undefined} onOpen={() => open(entry.id)}
          says={[KIND_NAMES[entry.kind].one, entry.within && `in ${entry.within}`, entry.why].filter(Boolean).join(' · ')} />
      ))}
    </section>
  );

  let body: ReactNode;
  if (!route.kind) {
    const lately = prefs.lately.map((id) => world.records.find((record) => record.id === id)).filter((record): record is StoryRecord => Boolean(record));
    const changed = changedCount(world.rules);
    body = (
      <>
        <h2 className="rail-title">{world.name}</h2>
        {find}
        {results ?? (
          <>
            {lately.length > 0 && (
              <section className="lately" aria-label="Lately">
                <h3 className="rail-label">Lately</h3>
                <div className="chips">
                  {lately.map((record) => <button type="button" key={record.id} className="btn small quiet" aria-current={route.rec === record.id || undefined} onClick={() => open(record.id)}>{record.name}</button>)}
                </div>
              </section>
            )}
            <section className="kind" aria-label="Records">
              <h3 className="rail-label">Records</h3>
              {RECORD_KINDS.map((kind) => {
                const count = world.records.filter((record) => record.kind === kind).length;
                return (
                  <div key={kind} className="row-pair">
                    <button type="button" className="item" aria-label={`${KIND_NAMES[kind].many}: ${count}`} onClick={() => go({ kind, inside: null })}>
                      <span className="item-text"><span className="item-name">{KIND_NAMES[kind].many}</span></span>
                      <small>{count}</small>
                      <span className="chev" aria-hidden="true">›</span>
                    </button>
                    <button type="button" className="btn small quiet" onClick={() => onAdd(kind, null)} aria-label={`Add ${aOrAn(KIND_NAMES[kind].one)}`}>Add</button>
                  </div>
                );
              })}
            </section>
            <section className="kind" aria-label="The world">
              <h3 className="rail-label">The world</h3>
              <button type="button" className="item" aria-current={(!route.rec && route.page === 'about') || undefined} onClick={() => go({ page: 'about', rec: null, door: null })}>
                <span className="item-name">About</span>
                <small>Premise, conditions, play</small>
              </button>
              <button type="button" className="item" aria-current={(!route.rec && route.page === 'rules') || undefined} onClick={() => go({ page: 'rules', rec: null, door: null, part: null })}>
                <span className="item-name">Rules</span>
                <small>{changed ? `${changed} changed` : 'Standard'}</small>
              </button>
              <button type="button" className="item" aria-current={(!route.rec && route.page === 'checks') || undefined} onClick={() => go({ page: 'checks', rec: null, door: null })}>
                <span className="item-name">Checks</span>
                <small>{checks ? `${checks} to look at` : 'All clear'}</small>
              </button>
              <button type="button" className="item below-wide" onClick={() => go({ door: 'context' })}>
                <span className="item-name">In context now</span>
                <small>{contextSays}</small>
              </button>
            </section>
            <div className="row">
              <button type="button" className="btn small quiet" onClick={() => downloadJson(`${fileSafe(world.name)}.world.json`, world)}>Export</button>
              <span className="btn small quiet file-btn">
                Import a card
                <input type="file" accept="application/json,.json,image/png,.png" aria-label="Import a card" onChange={onImportCard} />
              </span>
            </div>
          </>
        )}
      </>
    );
  } else {
    const kind = route.kind;
    const names = KIND_NAMES[kind];
    const entries = kind === 'place' ? sorted(tree.get(inside?.id ?? null) ?? []) : sorted(world.records.filter((record) => record.kind === kind));
    const trail = inside ? trailOf(world, inside.id) : [];
    const parent = trail.at(-1);
    const total = world.records.filter((record) => record.kind === kind).length;
    body = (
      <>
        <button type="button" className="btn small quiet up" onClick={() => (inside ? go({ inside: parent?.id ?? null }) : go({ kind: null, inside: null }))}>
          ‹ {inside ? parent?.name ?? names.many : world.name}
        </button>
        {inside && (
          <nav className="trail" aria-label={`Where ${inside.name} is`}>
            <button type="button" onClick={() => go({ inside: null })}>{names.many}</button>
            {trail.map((place) => <span key={place.id}><span aria-hidden="true"> › </span><button type="button" onClick={() => go({ inside: place.id })}>{place.name}</button></span>)}
          </nav>
        )}
        <div className="kind-head">
          <h2 className="rail-title">{inside ? inside.name : names.many} <small>{inside ? `${entries.length} inside` : total}</small></h2>
          <span className="row">
            {inside && <button type="button" className="btn small quiet" aria-current={route.rec === inside.id || undefined} onClick={() => open(inside.id)}>Open</button>}
            <button type="button" className="btn small quiet" onClick={() => onAdd(kind, inside?.id ?? null)} aria-label={inside ? `Add a place inside ${inside.name}` : `Add ${aOrAn(names.one)}`}>Add</button>
          </span>
        </div>
        {find}
        {results ?? (
          <section className="kind" aria-label={inside ? `Inside ${inside.name}` : names.many}>
            {entries.length === 0 && <p className="empty">{inside ? 'Nothing inside it yet.' : 'None yet.'}</p>}
            {entries.map((entry) => {
              const within = kind === 'place' ? (tree.get(entry.id) ?? []).length : 0;
              return (
                <Row key={entry.id} name={entry.name} says={says(entry)} current={route.rec === entry.id} mark={flagged.has(entry.id) ? 'to check' : undefined} onOpen={() => open(entry.id)}>
                  {within > 0 && <button type="button" className="btn small quiet into" aria-label={`Inside ${entry.name}: ${within} ${within === 1 ? 'place' : 'places'}`} onClick={() => go({ inside: entry.id })}>{within} inside ›</button>}
                </Row>
              );
            })}
          </section>
        )}
      </>
    );
  }

  return (
    <nav className="rail" aria-label={`${world.name}: records`} ref={rail}>
      {body}
      {status && <p className={`status${status.bad ? ' bad' : ''}`} role="status">{status.text}</p>}
    </nav>
  );
}
