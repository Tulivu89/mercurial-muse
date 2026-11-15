import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { KIND_NAMES, RECORD_KINDS, newWorld, parseWorld, type World } from '../../core/records/index.js';
import { InkMark } from '../../kit/src/Mark';
import { Sheet } from '../../kit/src/Sheet';
import { SiteHeader } from '../../kit/src/SiteHeader';
import { ConnectForm } from '../../kit/src/Connect';
import { initialConnection, reconnect, type Connection } from '../../kit/src/connection';
import { THEME_NAMES, useTheme, type Theme } from '../../kit/src/theme';
import { WorldView } from './WorldView';
import { NOWHERE, navigate, useRoute } from './route';
import { deleteWorld, listWorlds, putWorld } from '../../kit/src/worlds';
import { RESORT_NAME, RESORT_WORLD_ID, loadResort } from '../../kit/src/included';
import { ago, newId, readJsonFile } from '../../kit/src/util';
import { isModule, moduleToWorld } from '../../core/convert/index.js';
import { AuthorProvider, authorFor, readHelperPrefs, saveHelperPrefs, type HelperPrefs } from './author/context';
import type { Generate } from './author/run';

// `generate` stands in for the model in tests.
export function App({ generate }: { generate?: Generate } = {}) {
  const [worlds, setWorlds] = useState<World[] | null>(null);
  // Which world is open is in the address (route.ts), so Back leaves a world the way it came in.
  const route = useRoute();
  const [status, setStatus] = useState<{ text: string; bad?: boolean } | null>(null);
  const [theme, setTheme] = useTheme();
  const [settings, setSettings] = useState(false);
  // One connection for the Studio: Settings changes it, and every Draft button calls through it.
  const [connection, setConnection] = useState<Connection>(initialConnection);
  useEffect(() => { void reconnect(connection).then(setConnection).catch(() => undefined); }, []);
  const [helper, setHelper] = useState<HelperPrefs>(readHelperPrefs);
  const changeHelper = (next: HelperPrefs) => { saveHelperPrefs(next); setHelper(next); };
  const author = useMemo(() => authorFor(connection, () => setSettings(true), generate, helper), [connection, generate, helper]);
  const writes = useRef(new Set<Promise<unknown>>());
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
    for (const world of batch) { const write = putWorld(world); writes.current.add(write); void write.catch((error: Error) => { if (!pending.current.has(world.id) || pending.current.get(world.id)!.updatedAt <= world.updatedAt) pending.current.set(world.id, world); setStatus({ text: `Not saved: ${error.message}`, bad: true }); }).finally(() => writes.current.delete(write)); }
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

  const open = worlds?.find((world) => world.id === route.worldId) ?? null;
  // An address for a world this browser doesn't have, from an old link or another device.
  useEffect(() => {
    if (!worlds || !route.worldId || open) return undefined;
    const wait = setTimeout(() => { setStatus({ text: 'That world is not in this browser. Open its world file to bring it here.', bad: true }); navigate(NOWHERE, true); }, 400);
    return () => clearTimeout(wait);
  }, [worlds, route.worldId, open]);

  const remove = async (world: World) => {
    if (!window.confirm(`Delete ${world.name} from this browser? Export it first if you want to keep a copy.`)) return;
    pending.current.delete(world.id);
    await deleteWorld(world.id).catch(() => undefined);
    setWorlds((list) => (list ?? []).filter((existing) => existing.id !== world.id));
    navigate(NOWHERE, true);
    setStatus({ text: `Deleted ${world.name}.` });
  };

  return (
    <AuthorProvider value={author}>
      <SiteHeader onOverview={async () => { flush(); await Promise.all([...writes.current]); }} side="studio" homeLabel="Inkwyrm Studio, your worlds" onHome={() => { flush(); navigate(NOWHERE); }} onSettings={() => setSettings(true)} />
      {open
        ? <WorldView key={open.id} world={open} onChange={save} onDelete={() => void remove(open)} onStatus={setStatus} status={status} />
        : <Home worlds={worlds} status={status} onOpen={(id) => { setStatus(null); navigate({ ...NOWHERE, worldId: id }); }} onCreate={(world) => { save(world); navigate({ ...NOWHERE, worldId: world.id, page: world.records.length ? null : 'about' }); }} onStatus={setStatus} />}
      {settings && <Settings theme={theme} onTheme={setTheme} connection={connection} onConnection={setConnection} helper={helper} onHelper={changeHelper} onClose={() => setSettings(false)} />}
    </AuthorProvider>
  );
}

// One Settings for the site: the look, and the model key that Chat and the adventure already
// share (kit/src/connection.ts).
function Settings({ theme, onTheme, connection, onConnection, helper, onHelper, onClose }: { theme: Theme; onTheme: (theme: Theme) => void; connection: Connection; onConnection: (connection: Connection) => void; helper: HelperPrefs; onHelper: (helper: HelperPrefs) => void; onClose: () => void }) {
  return (
    <Sheet title="Settings" onClose={onClose}>
      <label className="field">
        <span>Look</span>
        <select value={theme} onChange={(event) => onTheme(event.target.value as Theme)}>
          {(Object.keys(THEME_NAMES) as Theme[]).map((option) => <option key={option} value={option}>{THEME_NAMES[option]}</option>)}
        </select>
      </label>
      <h3 className="sub">Your model</h3>
      <p className="hint">One key for the adventure, Chat and the Studio. It is kept on this device if you ask, and goes with each request; the site&rsquo;s server never stores it. In the Studio it writes drafts: nothing it writes changes a record until you keep it.</p>
      <ConnectForm connection={connection} onChange={onConnection} />
      <h3 className="sub">The Studio&rsquo;s helper</h3>
      <label className="field">
        <span>Model for drafts and Errata</span>
        {connection.models.length > 1 ? (
          <select value={helper.model} onChange={(event) => onHelper({ ...helper, model: event.target.value })}>
            <option value="">The same as play{connection.model ? ` (${connection.model})` : ''}</option>
            {connection.models.filter((model) => model !== connection.model).map((model) => <option key={model} value={model}>{model}</option>)}
          </select>
        ) : (
          <input value={helper.model} placeholder={connection.model ? `The same as play (${connection.model})` : 'The same as play'} onChange={(event) => onHelper({ ...helper, model: event.target.value.trim() })} />
        )}
      </label>
      <p className="hint">A strong instruction model can help you build while a favourite story model plays. It uses the same provider and key.</p>
      <label className="check">
        <input type="checkbox" checked={helper.plain} onChange={(event) => onHelper({ ...helper, plain: event.target.checked })} />
        <span>Plain voice: the helper without Errata&rsquo;s manner</span>
      </label>
    </Sheet>
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

  // `again`: open the copy this browser already has instead of making another (the Overview's
  // examples, which only ever ask to look).
  const bringIn = (raw: unknown, again = false) => {
    const read = moduleToWorld(raw, Date.now());
    if (!read.ok) { onStatus({ text: read.errors.join(' '), bad: true }); return; }
    const taken = worlds?.some((world) => world.id === read.world.id);
    if (taken && again) { onOpen(read.world.id); return; }
    const world = taken ? { ...read.world, id: newId(), name: `${read.world.name} (copy)` } : read.world;
    onCreate(world);
    onStatus({ text: [`Brought in ${world.name}: ${read.notes.join(' ')}`, 'It goes back out as the same module, with whatever you change.'].join(' ') });
  };
  // The adventure's own modules, fetched only when asked for.
  const bringModule = async (which: 'bogwater' | 'port-covenant', again = false) => {
    try {
      const loaded = which === 'bogwater' ? await import('../../adventure/modules/abernys-bogwater.json') : await import('../../adventure/modules/abernys-port-covenant.json');
      bringIn(loaded.default, again);
    } catch (error) {
      onStatus({ text: (error as Error).message, bad: true });
    }
  };
  // The site's own world files, such as the dragon's resort: opened as they are, no module in between.
  const bringResort = async (again = false) => {
    try {
      const resort = await loadResort(Date.now());
      const taken = worlds?.some((world) => world.id === RESORT_WORLD_ID);
      if (taken && again) { onOpen(RESORT_WORLD_ID); return; }
      const world = taken ? { ...resort, id: newId(), name: `${resort.name} (copy)` } : resort;
      onCreate(world);
      onStatus({ text: `Opened ${world.name}. Its three can be met in Chat, and its Home is in Chat's Home.` });
    } catch (error) {
      onStatus({ text: (error as Error).message, bad: true });
    }
  };
  // `#/bring/bogwater` from the Overview: open the example, bringing it in only if it isn't here.
  useEffect(() => {
    if (worlds === null) return;
    const asked = /^#\/bring\/(bogwater|port-covenant|dragons-resort)$/.exec(window.location.hash)?.[1] as 'bogwater' | 'port-covenant' | 'dragons-resort' | undefined;
    if (!asked) return;
    window.history.replaceState(null, '', `${window.location.pathname}#/`);
    void (asked === 'dragons-resort' ? bringResort(true) : bringModule(asked, true));
  }, [worlds === null]);

  return (
    <main className="home">
      <div className="row" style={{ alignItems: 'flex-start', gap: 20 }}>
        <InkMark name="nib" size={72} title="Inkwyrm Studio" land />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: '1 1 300px' }}>
          <h1 className="ink-write">Your worlds</h1>
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
      <div className="row">
        <span className="hint">Or the site&rsquo;s own:</span>
        <button type="button" className="btn small quiet" onClick={() => void bringResort()}>{RESORT_NAME}</button>
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
