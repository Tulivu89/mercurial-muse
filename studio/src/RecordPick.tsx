// Choosing records in a world that may hold hundreds of them: one picker for every place the
// Studio asks for a person, a place, a thing or a group. A button shows the choice; tapping it
// opens a sheet with a search box, the records picked lately in this world, then every record by
// kind, A to Z. A place shows the places it sits inside, so two rooms called "Back room" can be
// told apart. RecordMulti is the same sheet for a list: the choices as chips, and Add.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { KIND_NAMES, RECORD_KINDS, type RecordKind, type StoryRecord, type World } from '../../core/records/index.js';
import { Sheet } from '../../kit/src/Sheet';

export interface PickOption {
  id: string;
  name: string;
  kind: RecordKind;
  // The places it sits inside, nearest first: "Morwen's island, Fenmire".
  within: string;
}

// The sorting key: case and a leading "The" or "A" don't count.
export const sortKey = (name: string) => name.toLocaleLowerCase().replace(/^(the|a|an)\s+/, '');
export const byName = <T extends { name: string }>(a: T, b: T) => sortKey(a.name).localeCompare(sortKey(b.name));

// The places a record sits inside, nearest first, at most `depth` of them.
export function withinOf(world: World, record: StoryRecord, depth = 2): string {
  const names: string[] = [];
  const seen = new Set([record.id]);
  let parent = record.parentId ? world.records.find((entry) => entry.id === record.parentId) : undefined;
  while (parent && !seen.has(parent.id) && names.length < depth) {
    names.push(parent.name);
    seen.add(parent.id);
    parent = parent.parentId ? world.records.find((entry) => entry.id === parent!.parentId) : undefined;
  }
  return names.join(', ');
}

export function pickOptions(world: World, kinds: readonly RecordKind[], only?: (record: StoryRecord) => boolean): PickOption[] {
  return world.records
    .filter((record) => kinds.includes(record.kind) && (!only || only(record)))
    .map((record) => ({ id: record.id, name: record.name, kind: record.kind, within: record.kind === 'place' ? withinOf(world, record) : '' }))
    .sort(byName);
}

// What was picked lately, per world, newest first. A convenience: it may be missing.
const RECENT = 6;
const recentKey = (worldId: string) => `inkwyrm.studio.recent.${worldId}`;
function readRecent(worldId: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(recentKey(worldId)) ?? '[]');
    return Array.isArray(raw) ? raw.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch { return []; }
}
function noteRecent(worldId: string, id: string) {
  try { localStorage.setItem(recentKey(worldId), JSON.stringify([id, ...readRecent(worldId).filter((entry) => entry !== id)].slice(0, 20))); } catch { /* not kept */ }
}

// How well a record matches what was typed: the start of its name first, then a word in it, then
// anywhere in its name or the places it is in.
export function matchScore(option: PickOption, query: string): number {
  const name = option.name.toLocaleLowerCase();
  if (name.startsWith(query) || sortKey(option.name).startsWith(query)) return 3;
  if (name.split(/[\s'’-]+/).some((word) => word.startsWith(query))) return 2;
  if (name.includes(query)) return 1;
  if (option.within.toLocaleLowerCase().includes(query)) return 0.5;
  return 0;
}

type Row = { option: PickOption | null; group: string };

function PickerSheet({ world, title, options, chosen, multi, none, onPick, onClose }: {
  world: World;
  title: string;
  options: PickOption[];
  chosen: readonly string[];
  multi: boolean;
  // The words for picking nothing, when nothing is allowed.
  none?: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => { search.current?.focus(); }, []);

  const rows = useMemo((): Row[] => {
    const typed = query.trim().toLocaleLowerCase();
    if (typed) {
      return options.map((option) => ({ option, rank: matchScore(option, typed) })).filter((entry) => entry.rank > 0)
        .sort((a, b) => b.rank - a.rank || byName(a.option, b.option)).map(({ option }) => ({ option, group: '' }));
    }
    const out: Row[] = none ? [{ option: null, group: '' }] : [];
    const byId = new Map(options.map((option) => [option.id, option]));
    const recent = options.length > 12 ? readRecent(world.id).map((id) => byId.get(id)).filter((option): option is PickOption => Boolean(option)).slice(0, RECENT) : [];
    out.push(...recent.map((option) => ({ option, group: 'Lately' })));
    const kinds = RECORD_KINDS.filter((kind) => options.some((option) => option.kind === kind));
    for (const kind of kinds) out.push(...options.filter((option) => option.kind === kind).map((option) => ({ option, group: kinds.length > 1 || recent.length ? KIND_NAMES[kind].many : '' })));
    return out;
  }, [options, query, none, world.id]);

  // It opens on the current choice, and on the best match once something is typed.
  const [active, setActive] = useState(() => (multi ? 0 : Math.max(0, rows.findIndex((row) => row.option && chosen.includes(row.option.id)))));

  useEffect(() => { list.current?.querySelector<HTMLElement>(`[data-row="${active}"]`)?.scrollIntoView?.({ block: 'nearest' }); }, [active]);

  const pick = (row: Row | undefined) => {
    if (!row) return;
    if (row.option) noteRecent(world.id, row.option.id);
    onPick(row.option?.id ?? '');
    if (!multi) onClose();
  };
  const keys = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); setActive((at) => Math.min(rows.length - 1, at + 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((at) => Math.max(0, at - 1)); }
    else if (event.key === 'Enter') { event.preventDefault(); pick(rows[Math.min(active, rows.length - 1)]); }
  };

  return (
    <Sheet title={title} onClose={onClose} closeLabel={multi ? 'Done' : 'Close'} onKeyDown={keys}>
      <input
        ref={search} className="input" type="search" placeholder={`Search ${options.length} by name`} aria-label={`${title}: search`}
        aria-controls="pick-list" aria-activedescendant={rows.length ? `pick-row-${active}` : undefined} value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }}
      />
      <div className="pick-list" id="pick-list" role="listbox" aria-multiselectable={multi} ref={list}>
        {rows.length === 0 && <p className="empty">Nothing called that.</p>}
        {rows.map((row, index) => {
          const heading = row.group && row.group !== rows[index - 1]?.group ? <p className="pick-group">{row.group}</p> : null;
          const picked = row.option ? chosen.includes(row.option.id) : !chosen.length;
          return (
            <div key={`${row.group}-${row.option?.id ?? 'none'}`}>
              {heading}
              <div
                id={`pick-row-${index}`} data-row={index} role="option" aria-selected={picked} className={`pick-row${index === active ? ' active' : ''}`}
                onMouseMove={() => setActive(index)} onClick={() => pick(row)}
              >
                <span className="pick-tick" aria-hidden="true">{picked ? '✓' : ''}</span>
                <span className="grow">
                  {row.option ? row.option.name : none}
                  {row.option?.within && <small> in {row.option.within}</small>}
                </span>
                {query && row.option && <small className="pick-kind">{KIND_NAMES[row.option.kind].one}</small>}
              </div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

// One record, or none when `none` gives the words for it.
export function RecordPick({ world, value, onChange, label, kinds, only, none, className = '' }: {
  world: World;
  value: string;
  onChange: (id: string) => void;
  label: string;
  kinds: readonly RecordKind[];
  only?: (record: StoryRecord) => boolean;
  none?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const options = useMemo(() => pickOptions(world, kinds, only), [world, kinds, only]);
  const current = world.records.find((record) => record.id === value);
  const shown = !value ? none ?? 'Pick one' : current ? current.name : `Gone: ${value}`;
  const within = current?.kind === 'place' ? withinOf(world, current, 1) : '';
  return (
    <>
      <button ref={button} type="button" className={`input pick-button ${className}`} aria-label={`${label}: ${shown}`} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span className="grow">{shown}{within && <small> in {within}</small>}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <PickerSheet
          world={world} title={label} options={options} chosen={value ? [value] : []} multi={false} none={none}
          onPick={(id) => { if (id !== value) onChange(id); }} onClose={() => { setOpen(false); button.current?.focus(); }}
        />
      )}
    </>
  );
}

// Several records: chips to remove, and Add to open the sheet.
export function RecordMulti({ world, values, onChange, label, kinds, only, empty = 'None yet.' }: {
  world: World;
  values: readonly string[];
  onChange: (ids: string[]) => void;
  label: string;
  kinds: readonly RecordKind[];
  only?: (record: StoryRecord) => boolean;
  empty?: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const options = useMemo(() => pickOptions(world, kinds, only), [world, kinds, only]);
  const name = (id: string) => world.records.find((record) => record.id === id)?.name ?? `Gone: ${id}`;
  return (
    <div className="chips" role="group" aria-label={label}>
      {values.length === 0 && <span className="hint">{empty}</span>}
      {[...values].sort((a, b) => sortKey(name(a)).localeCompare(sortKey(name(b)))).map((id) => (
        <span key={id} className="chip">
          {name(id)}
          <button type="button" className="chip-x" aria-label={`Take ${name(id)} off ${label.toLowerCase()}`} onClick={() => onChange(values.filter((entry) => entry !== id))}>×</button>
        </span>
      ))}
      <button ref={button} type="button" className="btn small quiet" aria-haspopup="dialog" onClick={() => setOpen(true)} disabled={!options.length}>{values.length ? 'Change' : 'Add'}</button>
      {open && (
        <PickerSheet
          world={world} title={label} options={options} chosen={values} multi
          onPick={(id) => onChange(values.includes(id) ? values.filter((entry) => entry !== id) : [...values, id])}
          onClose={() => { setOpen(false); button.current?.focus(); }}
        />
      )}
    </div>
  );
}

// Whose state a condition reads: the player's (or "their own"), the world's, or a named person's,
// picked from the people of the world.
export function WhosePick({ world, value, onChange, label, self = 'The player’s' }: {
  world: World;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  label: string;
  self?: string;
}) {
  const mode = !value ? 'self' : value === 'world' ? 'world' : 'person';
  const first = pickOptions(world, ['character'])[0]?.id;
  return (
    <>
      <select className="input pick" aria-label={label} value={mode} onChange={(event) => onChange(event.target.value === 'self' ? undefined : event.target.value === 'world' ? 'world' : first)}>
        <option value="self">{self}</option>
        <option value="world">The world&rsquo;s</option>
        <option value="person" disabled={!first}>Someone&rsquo;s</option>
      </select>
      {mode === 'person' && <RecordPick world={world} label={`${label}: who`} kinds={['character']} value={value ?? ''} onChange={(id) => onChange(id || undefined)} className="pick" />}
    </>
  );
}
