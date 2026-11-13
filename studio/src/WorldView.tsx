// One world, open (docs/bids/ui/decision.md). Three things: the list, a page, and a door. A phone
// shows one at a time; from 900 px the list sits beside the page; from 1200 px a door sits beside
// both, and it is In context now until another is opened. Where you are is in the address, so
// the browser's Back goes back.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  KIND_NAMES, RECORD_KINDS, importCardFile, newRecord, putRecord, recordById, removeRecord,
  type RecordKind, type World,
} from '../../core/records/index.js';
import { useMoment } from './ContextPanel';
import { DoorPane, DoorRows, doorsFor } from './Doors';
import { RecordEditor } from './RecordEditor';
import { ErrataDoor, errataSays } from './ErrataDoor';
import { useAuthor } from './author/context';
import { useDrafts } from './author/useDrafts';
import { useTalk } from './author/useTalk';
import { recordActivity } from '../../kit/src/activity';
import { WorldSettings } from './WorldSettings';
import { WorldRules } from './WorldRules';
import { MapPage } from './MapPage';
import { WorldList, keepList, readList, withOpened, type ListPrefs } from './WorldList';
import { checkWorld } from '../../core/convert/index.js';
import { newId, readFileBytes } from '../../kit/src/util';
import { NOWHERE, formatRoute, navigate, useRoute, type Door, type Route } from './route';

type Status = { text: string; bad?: boolean } | null;

// How much room there is: 0 a phone, 1 the list beside the page, 2 a door beside both.
function room(): 0 | 1 | 2 {
  if (typeof window.matchMedia !== 'function') return 0;
  return window.matchMedia('(min-width: 1200px)').matches ? 2 : window.matchMedia('(min-width: 900px)').matches ? 1 : 0;
}

// The page's own scroll. Going further in starts at the top; coming back out returns to where
// you were, whether by the Studio's own way back or the browser's.
function useKeepScroll(key: string, depth: number) {
  const seen = useRef(new Map<string, number>());
  const last = useRef({ key, depth });
  useEffect(() => {
    const onScroll = () => { seen.current.set(last.current.key, window.scrollY); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useLayoutEffect(() => {
    if (last.current.key === key) return;
    const up = depth < last.current.depth;
    last.current = { key, depth };
    window.scrollTo(0, up ? seen.current.get(key) ?? 0 : 0);
  }, [key, depth]);
}

export function WorldView({ world, onChange, onDelete, onStatus, status }: {
  world: World;
  onChange: (world: World) => void;
  onDelete: () => void;
  onStatus: (status: Status) => void;
  status: Status;
}) {
  const route = useRoute();
  const here: Route = route.worldId === world.id ? route : { ...NOWHERE, worldId: world.id };
  const go = (patch: Partial<Route>) => navigate({ ...here, ...patch });

  const record = here.rec ? recordById(world, here.rec) : undefined;
  const page = here.rec ? null : here.page;
  const problems = useMemo(() => checkWorld(world), [world]);
  const flagged = useMemo(() => new Set(problems.flatMap((problem) => (problem.recordId ? [problem.recordId] : []))), [problems]);
  const moment = useMoment(world, record?.id ?? null);
  // Drafts and Errata's talk belong to the record open, shared by its page and its door.
  const author = useAuthor();
  const drafts = useDrafts(world, record, author);
  const talk = useTalk(world, record, author, drafts);
  const errataName = author?.plain ? 'Helper' : 'Errata';
  const doors = record ? doorsFor(world, record, moment, author ? { label: errataName, says: errataSays(talk.talk, drafts) } : null) : [];
  const door: Door | null = here.door === 'context' ? 'context' : record && doors.some((entry) => entry.id === here.door) ? here.door : null;

  // A record that really opened, with the door it opened on, is what the Overview's Continue offers.
  useEffect(() => { if (record) recordActivity({ kind: 'studio', worldId: world.id, recordId: record.id, ...(door && door !== 'context' ? { door } : {}) }); }, [world.id, record?.id, door]);

  const [prefs, setPrefs] = useState<ListPrefs>(() => readList(world.id));
  const changePrefs = (next: ListPrefs) => setPrefs(keepList(world.id, next));
  useEffect(() => { if (record) setPrefs((now) => keepList(world.id, withOpened(now, record.id))); }, [record?.id]);

  // Which of the three the page's scroll belongs to depends on how many are showing.
  const space = room();
  const listKey = `list:${here.kind ?? ''}:${here.inside ?? ''}`;
  const pageKey = `page:${here.rec ?? page ?? ''}:${here.part ?? ''}`;
  const atPage = Boolean(here.rec || page);
  const onDoor = door && space < 2;
  useKeepScroll(
    onDoor ? `door:${here.rec ?? ''}:${door}` : atPage || space > 0 ? pageKey : listKey,
    onDoor ? 30 : atPage ? (here.part ? 21 : 20) : space > 0 ? 10 : !here.kind ? 0 : !here.inside ? 1 : 2,
  );

  const add = (kind: RecordKind, parentId: string | null) => {
    const fresh = newRecord(kind, newId(), `New ${KIND_NAMES[kind].one.toLowerCase()}`, newId);
    if (kind === 'place' && parentId) fresh.parentId = parentId;
    onChange(putRecord(world, fresh, Date.now()));
    go({ kind, inside: kind === 'place' ? parentId : null, rec: fresh.id, page: null, door: null });
  };

  const importCard = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = importCardFile(world, await readFileBytes(file), newId, Date.now());
      if (!imported.ok) { onStatus({ text: imported.errors.join(' '), bad: true }); return; }
      onChange(imported.result.world);
      go({ rec: imported.result.recordId, page: null, door: null });
      const name = recordById(imported.result.world, imported.result.recordId)?.name ?? 'the character';
      onStatus({ text: [`Brought in ${name}.`, ...imported.result.notes].join(' ') });
    } catch (error) {
      onStatus({ text: (error as Error).message, bad: true });
    }
  };

  const inside = here.kind === 'place' && here.inside ? recordById(world, here.inside) : undefined;
  const listName = inside?.name ?? (here.kind ? KIND_NAMES[here.kind].many : world.name);
  const counts = RECORD_KINDS.map((kind) => [kind, world.records.filter((entry) => entry.kind === kind).length] as const).filter(([, count]) => count);
  const lately = prefs.lately.flatMap((id) => { const found = recordById(world, id); return found ? [found] : []; });

  return (
    <div className={`world${door ? ' at-door' : atPage ? ' at-page' : ''}`}>
      <WorldList
        world={world} route={here} go={go} prefs={prefs} onPrefs={changePrefs} flagged={flagged} checks={problems.length}
        contextSays={moment.says} status={status} onAdd={add} onImportCard={(event) => void importCard(event)}
      />

      <main className="editor ink-settle" key={formatRoute({ ...here, kind: null, inside: null, door: null, part: null, sheet: null })}>
        {atPage && !(page === 'rules' && here.part) && <button type="button" className="btn small quiet back" onClick={() => go({ rec: null, page: null, door: null, part: null, sheet: null })}>‹ {listName}</button>}
        {page === 'about' && <WorldSettings world={world} onChange={onChange} onDelete={onDelete} />}
        {page === 'rules' && <WorldRules world={world} onChange={onChange} part={here.part} onPart={(part) => go({ part })} />}
        {page === 'map' && <MapPage world={world} route={here} go={go} onChange={onChange} />}
        {page === 'checks' && (
          <>
            <h1 className="ink-write">Checks</h1>
            <p className="lede">What would trip the adventure or lose the narrator, found before anyone plays: stops that are not real places, more than four people in one place over forty days, a When with no condition, and rules that point at something gone.</p>
            {problems.length === 0 && <p className="status" role="status">All clear.</p>}
            {problems.map((problem, index) => (
              <div key={index} className="card">
                <div className="card-head">
                  <b className="grow">{problem.where}</b>
                  {problem.recordId && <button type="button" className="btn small quiet" onClick={() => go({ rec: problem.recordId, page: null, door: null })}>Open</button>}
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
            drafts={drafts}
            onChange={(next) => onChange(putRecord(world, next, Date.now()))}
            onDelete={() => {
              if (!window.confirm(`Delete ${record.name}?`)) return;
              onChange(removeRecord(world, record.id, Date.now()));
              go({ rec: null, page: null, door: null });
            }}
            doors={<DoorRows record={record} doors={doors} open={door ?? (space === 2 ? 'context' : null)} onOpen={(next) => go({ door: next })} />}
          />
        )}
        {here.rec && !record && <p className="status" role="status">That record is not in {world.name} any more.</p>}
        {!atPage && (
          <>
            <h1 className="ink-write">{world.name}</h1>
            <p className="lede">{world.premise || 'No premise yet. Write one under About: it goes with every turn.'}</p>
            <p className="hint">{counts.length ? counts.map(([kind, count]) => `${count} ${(count === 1 ? KIND_NAMES[kind].one : KIND_NAMES[kind].many).toLowerCase()}`).join(' · ') : 'Nothing in it yet. Add a place or a character from the list.'}</p>
            {lately.length > 0 && (
              <section className="kind" aria-label="Opened lately">
                <h2 className="sub">Opened lately</h2>
                {lately.map((entry) => (
                  <button type="button" key={entry.id} className="item" onClick={() => go({ rec: entry.id, page: null, door: null })}>
                    <span className="item-text"><span className="item-name">{entry.name}</span>{entry.line && <small>{entry.line}</small>}</span>
                    <small>{KIND_NAMES[entry.kind].one}</small>
                  </button>
                ))}
              </section>
            )}
          </>
        )}
      </main>

      <DoorPane
        world={world} record={record} door={door} moment={moment} backTo={record?.name ?? (page ? page[0]!.toUpperCase() + page.slice(1) : listName)}
        onClose={() => go({ door: null })}
        onChange={(next) => onChange(putRecord(world, next, Date.now()))}
        onWorld={onChange}
        errata={record ? { title: errataName, body: <ErrataDoor world={world} record={record} talk={talk} drafts={drafts} onChange={(next) => onChange(putRecord(world, next, Date.now()))} /> } : undefined}
      />
    </div>
  );
}
