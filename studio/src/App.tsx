import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { KIND_NAMES, RECORD_KINDS, newWorld, parseWorld, type World } from '../../core/records/index.js';
import { Drop, Wordmark } from '../../kit/src/Mark';
import { THEME_NAMES, useTheme, type Theme } from '../../kit/src/theme';
import { WorldView } from './WorldView';
import { deleteWorld, listWorlds, putWorld } from '../../kit/src/worlds';
import { ago, newId, readJsonFile } from '../../kit/src/util';
import { isModule, moduleToWorld } from '../../core/convert/index.js';

export function App() {
  const [worlds, setWorlds] = useState<World[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; bad?: boolean } | null>(null);
  const [theme, setTheme] = useTheme();
  const pending = useRef(new Map<string, World>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listWorlds().then(setWorlds).catch((error: Error) => { setWorlds([]); setStatus({ text: error.message, bad: true }); });
  }, []);

  // Saves shortly after the last change, so typing doesn't write on every key.
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const batch = [...pending.current.values()];
    pending.current.clear();
    for (const world of batch) putWorld(world).catch((error: Error) => setStatus({ text: `Not saved: ${error.message}`, bad: true }));
  }, []);
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    return () => { window.removeEventListener('pagehide', onHide); flush(); };
  }, [flush]);

  const save = useCallback((world: World) => {
    const stamped = { ...world, updatedAt: Date.now() };
    setWorlds((list) => [stamped, ...(list ?? []).filter((existing) => existing.id !== stamped.id)]);
    pending.current.set(stamped.id, stamped);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 400);
  }, [flush]);

  const open = worlds?.find((world) => world.id === openId) ?? null;

  const remove = async (world: World) => {
    if (!window.confirm(`Delete ${world.name} from this browser? Export it first if you want to keep a copy.`)) return;
    pending.current.delete(world.id);
    await deleteWorld(world.id).catch(() => undefined);
    setWorlds((list) => (list ?? []).filter((existing) => existing.id !== world.id));
    setOpenId(null);
    setStatus({ text: `Deleted ${world.name}.` });
  };

  return (
    <>
      <header className="bar">
        <button type="button" className="brand" onClick={() => { flush(); setOpenId(null); }} aria-label="Inkwyrm Studio, your worlds">
          <Drop size={34} />
          <Wordmark />
          <span className="side">Studio</span>
        </button>
        <div className="bar-actions">
          <label className="sr" htmlFor="theme">Theme</label>
          <select id="theme" className="input" style={{ width: 'auto' }} value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>
            {(Object.keys(THEME_NAMES) as Theme[]).map((option) => <option key={option} value={option}>{THEME_NAMES[option]}</option>)}
          </select>
          <a className="btn quiet" href="/chat/">Chat</a>
          <a className="btn quiet" href="/">Adventure</a>
        </div>
      </header>
      {open
        ? <WorldView key={open.id} world={open} onChange={save} onDelete={() => void remove(open)} onStatus={setStatus} status={status} />
        : <Home worlds={worlds} status={status} onOpen={(id) => { setStatus(null); setOpenId(id); }} onCreate={(world) => { save(world); setOpenId(world.id); }} onStatus={setStatus} />}
    </>
  );
}

function Home({ worlds, status, onOpen, onCreate, onStatus }: {
  worlds: World[] | null;
  status: { text: string; bad?: boolean } | null;
  onOpen: (id: string) => void;
  onCreate: (world: World) => void;
  onStatus: (status: { text: string; bad?: boolean } | null) => void;
}) {
  const [name, setName] = useState('');
  const now = Date.now();

  const create = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onCreate(newWorld(newId(), name.trim(), Date.now()));
    setName('');
  };

  const openFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const raw = await readJsonFile(file);
      // An adventure module opens as a world too.
      if (isModule(raw)) { bringIn(raw); return; }
      const read = parseWorld(raw);
      if (!read.ok) { onStatus({ text: read.errors.join(' '), bad: true }); return; }
      const taken = worlds?.some((world) => world.id === read.world.id);
      const world = taken ? { ...read.world, id: newId(), name: `${read.world.name} (copy)` } : read.world;
      onCreate(world);
      onStatus({ text: `Opened ${world.name}.` });
    } catch (error) {
      onStatus({ text: (error as Error).message, bad: true });
    }
  };

  const bringIn = (raw: unknown) => {
    const read = moduleToWorld(raw, Date.now());
    if (!read.ok) { onStatus({ text: read.errors.join(' '), bad: true }); return; }
    const taken = worlds?.some((world) => world.id === read.world.id);
    const world = taken ? { ...read.world, id: newId(), name: `${read.world.name} (copy)` } : read.world;
    onCreate(world);
    onStatus({ text: [`Brought in ${world.name}: ${read.notes.join(' ')}`, 'It goes back out as the same module, with whatever you change.'].join(' ') });
  };
  // The adventure's own modules, fetched only when asked for.
  const bringModule = async (which: 'bogwater' | 'port-covenant') => {
    try {
      const loaded = which === 'bogwater' ? await import('../../adventure/modules/abernys-bogwater.json') : await import('../../adventure/modules/abernys-port-covenant.json');
      bringIn(loaded.default);
    } catch (error) {
      onStatus({ text: (error as Error).message, bad: true });
    }
  };

  return (
    <main className="home">
      <div className="row" style={{ alignItems: 'flex-start', gap: 20 }}>
        <Drop size={72} title="Inkwyrm" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: '1 1 300px' }}>
          <h1>Your worlds</h1>
          <p className="lede">Make a world once: its places, its people, what they want and what they won&rsquo;t say. Every part says when it reaches the model.</p>
        </div>
      </div>
      {status && <p className={`status${status.bad ? ' bad' : ''}`} role="status">{status.text}</p>}
      <form className="row" onSubmit={create}>
        <label className="field grow">
          <span>New world</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Its name, such as Low Tide" />
        </label>
        <button type="submit" className="btn primary" style={{ alignSelf: 'flex-end' }} disabled={!name.trim()}>Make it</button>
        <span className="btn file-btn" style={{ alignSelf: 'flex-end' }}>
          Open a world or module file
          <input type="file" accept="application/json,.json" aria-label="Open a world or module file" onChange={(event) => void openFile(event)} />
        </span>
      </form>
      <div className="row">
        <span className="hint">Or bring in one of the adventure&rsquo;s:</span>
        <button type="button" className="btn small quiet" onClick={() => void bringModule('bogwater')}>Abernys: Bogwater</button>
        <button type="button" className="btn small quiet" onClick={() => void bringModule('port-covenant')}>Abernys: Port Covenant</button>
      </div>
      {worlds === null && <p className="hint">Opening your worlds…</p>}
      {worlds?.length === 0 && <p className="hint">No worlds in this browser yet. Make one above, or open a world file.</p>}
      {!!worlds?.length && (
        <div className="worlds">
          {worlds.map((world) => {
            const counts = RECORD_KINDS.map((kind) => [kind, world.records.filter((record) => record.kind === kind).length] as const).filter(([, count]) => count);
            return (
              <button type="button" key={world.id} className="world-card" onClick={() => onOpen(world.id)}>
                <h2>{world.name}</h2>
                {world.premise && <p>{world.premise.length > 140 ? `${world.premise.slice(0, 140)}…` : world.premise}</p>}
                <p>{counts.length ? counts.map(([kind, count]) => `${count} ${(count === 1 ? KIND_NAMES[kind].one : KIND_NAMES[kind].many).toLowerCase()}`).join(' · ') : 'Empty'} · {ago(world.updatedAt, now)}</p>
              </button>
            );
          })}
        </div>
      )}
      <p className="hint">Worlds are kept in this browser only. Export one from inside it to keep a copy or move it to another device.</p>
    </main>
  );
}
