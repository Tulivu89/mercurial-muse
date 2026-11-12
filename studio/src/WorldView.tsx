import { useMemo, useState, type ChangeEvent } from 'react';
import {
  KIND_NAMES, RECORD_KINDS, importCardFile, newRecord, putRecord, recordById, removeRecord,
  type RecordKind, type StoryRecord, type World,
} from '../../core/records/index.js';
import { ContextPanel } from './ContextPanel';
import { RecordEditor } from './RecordEditor';
import { WorldSettings } from './WorldSettings';
import { WorldRules } from './WorldRules';
import { changedCount } from '../../core/rules/index.js';
import { checkWorld } from '../../core/convert/index.js';
import { downloadJson, fileSafe, newId, readFileBytes } from '../../kit/src/util';
import { byName, matchScore, pickOptions } from './RecordPick';

type Status = { text: string; bad?: boolean } | null;
type Order = 'name' | 'added';

// Places as a tree, each level A to Z or in the order added. A place inside one that is gone, or
// inside itself, is a top-level place.
function placesInOrder(world: World, order: Order): { record: StoryRecord; depth: number }[] {
  const places = world.records.filter((record) => record.kind === 'place');
  const ids = new Set(places.map((place) => place.id));
  const children = new Map<string | null, StoryRecord[]>();
  for (const place of places) {
    const parent = place.parentId && ids.has(place.parentId) ? place.parentId : null;
    children.set(parent, [...(children.get(parent) ?? []), place]);
  }
  if (order === 'name') for (const list of children.values()) list.sort(byName);
  const out: { record: StoryRecord; depth: number }[] = [];
  const seen = new Set<string>();
  const walk = (parentId: string | null, depth: number) => {
    for (const place of children.get(parentId) ?? []) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      out.push({ record: place, depth });
      walk(place.id, depth + 1);
    }
  };
  walk(null, 0);
  for (const place of places) if (!seen.has(place.id)) out.push({ record: place, depth: 0 });
  return out;
}

// The list's own settings, per world, in this browser only: the order, and which kinds are folded.
const prefsKey = (worldId: string) => `inkwyrm.studio.list.${worldId}`;
function readPrefs(worldId: string): { order: Order; folded: RecordKind[] } {
  try {
    const raw = JSON.parse(localStorage.getItem(prefsKey(worldId)) ?? '{}');
    return { order: raw.order === 'added' ? 'added' : 'name', folded: Array.isArray(raw.folded) ? raw.folded.filter((kind: unknown) => RECORD_KINDS.includes(kind as RecordKind)) : [] };
  } catch { return { order: 'name', folded: [] }; }
}
function keepPrefs(worldId: string, prefs: { order: Order; folded: RecordKind[] }) {
  try { localStorage.setItem(prefsKey(worldId), JSON.stringify(prefs)); } catch { /* not kept */ }
}

export function WorldView({ world, onChange, onDelete, onStatus, status }: {
  world: World;
  onChange: (world: World) => void;
  onDelete: () => void;
  onStatus: (status: Status) => void;
  status: Status;
}) {
  const [selected, setSelected] = useState<string | 'world' | 'rules' | 'checks' | null>(world.records.length ? null : 'world');
  const problems = useMemo(() => checkWorld(world), [world]);
  const [query, setQuery] = useState('');
  const [prefs, setPrefs] = useState(() => readPrefs(world.id));
  const changePrefs = (next: typeof prefs) => { setPrefs(next); keepPrefs(world.id, next); };
  const found = useMemo(() => {
    const typed = query.trim().toLocaleLowerCase();
    if (!typed) return null;
    return pickOptions(world, RECORD_KINDS).map((option) => ({ option, rank: matchScore(option, typed) })).filter((entry) => entry.rank > 0)
      .sort((a, b) => b.rank - a.rank || byName(a.option, b.option)).slice(0, 60).map((entry) => entry.option);
  }, [world, query]);
  const record = selected && selected !== 'world' && selected !== 'rules' && selected !== 'checks' ? recordById(world, selected) : undefined;

  const add = (kind: RecordKind) => {
    const fresh = newRecord(kind, newId(), `New ${KIND_NAMES[kind].one.toLowerCase()}`, newId);
    if (kind === 'place' && record?.kind === 'place') fresh.parentId = record.id;
    onChange(putRecord(world, fresh, Date.now()));
    setSelected(fresh.id);
  };

  const importCard = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = importCardFile(world, await readFileBytes(file), newId, Date.now());
      if (!imported.ok) { onStatus({ text: imported.errors.join(' '), bad: true }); return; }
      onChange(imported.result.world);
      setSelected(imported.result.recordId);
      const name = recordById(imported.result.world, imported.result.recordId)?.name ?? 'the character';
      onStatus({ text: [`Brought in ${name}.`, ...imported.result.notes].join(' ') });
    } catch (error) {
      onStatus({ text: (error as Error).message, bad: true });
    }
  };

  const listFor = (kind: RecordKind): { record: StoryRecord; depth: number }[] => {
    if (kind === 'place') return placesInOrder(world, prefs.order);
    const entries = world.records.filter((entry) => entry.kind === kind);
    return (prefs.order === 'name' ? [...entries].sort(byName) : entries).map((entry) => ({ record: entry, depth: 0 }));
  };

  return (
    <div className={`world${selected ? ' open' : ''}`}>
      <nav className="rail" aria-label={`${world.name}: records`}>
        <button type="button" className="item" aria-current={selected === 'world'} onClick={() => setSelected('world')}>
          <h2>{world.name}</h2>
        </button>
        <button type="button" className="item" aria-current={selected === 'rules'} onClick={() => setSelected('rules')}>
          <span>Rules</span>
          <small>{changedCount(world.rules) ? `${changedCount(world.rules)} changed` : 'Standard'}</small>
        </button>
        <button type="button" className="item" aria-current={selected === 'checks'} onClick={() => setSelected('checks')}>
          <span>Checks</span>
          <small>{problems.length ? `${problems.length} to look at` : 'All clear'}</small>
        </button>
        <div className="row">
          <button type="button" className="btn small quiet" onClick={() => downloadJson(`${fileSafe(world.name)}.world.json`, world)}>Export</button>
          <span className="btn small quiet file-btn">
            Import a card
            <input type="file" accept="application/json,.json,image/png,.png" aria-label="Import a card" onChange={(event) => void importCard(event)} />
          </span>
        </div>
        {status && <p className={`status${status.bad ? ' bad' : ''}`} role="status">{status.text}</p>}
        <div className="find">
          <input className="input" type="search" aria-label="Find a record" placeholder={`Find among ${world.records.length} records`} value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="input pick" aria-label="Order" value={prefs.order} onChange={(event) => changePrefs({ ...prefs, order: event.target.value as Order })}>
            <option value="name">A to Z</option>
            <option value="added">As added</option>
          </select>
        </div>
        {found ? (
          <section className="kind" aria-label="Found">
            {found.length === 0 && <p className="empty">Nothing called that.</p>}
            {found.map((option) => (
              <button type="button" key={option.id} className="item" aria-current={selected === option.id} onClick={() => setSelected(option.id)}>
                <span>{option.name}</span>
                <small>{KIND_NAMES[option.kind].one}{option.within ? ` · in ${option.within}` : ''}</small>
              </button>
            ))}
          </section>
        ) : RECORD_KINDS.map((kind) => {
          const entries = listFor(kind);
          const folded = prefs.folded.includes(kind);
          return (
            <section key={kind} className="kind" aria-label={KIND_NAMES[kind].many}>
              <div className="kind-head">
                <button type="button" className="kind-fold" aria-expanded={!folded} onClick={() => changePrefs({ ...prefs, folded: folded ? prefs.folded.filter((entry) => entry !== kind) : [...prefs.folded, kind] })}>
                  <span aria-hidden="true">{folded ? '▸' : '▾'}</span>
                  <h3>{KIND_NAMES[kind].many}</h3>
                  <small>{entries.length || ''}</small>
                </button>
                <button type="button" className="btn small quiet" onClick={() => add(kind)} aria-label={`Add a ${KIND_NAMES[kind].one.toLowerCase()}`}>Add</button>
              </div>
              {!folded && entries.length === 0 && <p className="empty">None yet.</p>}
              {!folded && entries.map(({ record: entry, depth }) => (
                <button type="button" key={entry.id} className="item" aria-current={selected === entry.id} style={{ paddingLeft: 10 + depth * 16 }} onClick={() => setSelected(entry.id)}>
                  <span>{entry.name}</span>
                  {kind === 'group' && entry.groupKind !== 'other' && <small>{entry.groupKind}</small>}
                </button>
              ))}
            </section>
          );
        })}
      </nav>

      <main className="editor ink-settle" key={String(selected)}>
        <button type="button" className="btn small quiet back" onClick={() => setSelected(null)}>Back to {world.name}</button>
        {selected === 'world' && <WorldSettings world={world} onChange={onChange} onDelete={onDelete} />}
        {selected === 'rules' && <WorldRules world={world} onChange={onChange} />}
        {selected === 'checks' && (
          <>
            <h1 className="ink-write">Checks</h1>
            <p className="lede">What would trip the adventure or lose the narrator, found before anyone plays: stops that are not real places, more than four people in one place over forty days, a When with no condition, routes that end nowhere, and rules that point at something gone.</p>
            {problems.length === 0 && <p className="status" role="status">All clear.</p>}
            {problems.map((problem, index) => (
              <div key={index} className="card">
                <div className="card-head">
                  <b className="grow">{problem.where}</b>
                  {problem.recordId && <button type="button" className="btn small quiet" onClick={() => setSelected(problem.recordId)}>Open</button>}
                </div>
                <p className="part">{problem.text}</p>
              </div>
            ))}
          </>
        )}
        {record && (
          <RecordEditor
            key={record.id}
            world={world}
            record={record}
            onChange={(next) => onChange(putRecord(world, next, Date.now()))}
            onWorld={onChange}
            onDelete={() => {
              if (!window.confirm(`Delete ${record.name}?`)) return;
              onChange(removeRecord(world, record.id, Date.now()));
              setSelected(null);
            }}
          />
        )}
        {!selected && <p className="hint">Pick something on the left, or add a place or a character to start.</p>}
      </main>

      <ContextPanel world={world} focusId={record?.id ?? null} />
    </div>
  );
}
