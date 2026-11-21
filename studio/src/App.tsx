import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent, type FormEvent } from 'react';
import { KIND_NAMES, RECORD_KINDS, newRecord, newWorld, parseWorld, putRecord, type World } from '../../core/records/index.js';
import { homesOf } from '../../core/chat/home.js';
import { PageHead } from '../../kit/src/PageHead';
import { SettingsPage, isSettingsTab, type SettingsTab } from '../../kit/src/settings/SettingsPage';
import { SiteHeader } from '../../kit/src/SiteHeader';
import { initialConnection, reconnect, type Connection } from '../../kit/src/connection';
import { useTheme } from '../../kit/src/theme';
import { useLook } from '../../kit/src/look';
import { WorldView } from './WorldView';
import { NOWHERE, navigate, useRoute, type Route } from './route';
import { deleteWorld, listWorlds, putWorld } from '../../kit/src/worlds';
import { INCLUDED_WORLDS, includedWorld, loadIncluded } from '../../kit/src/included';
import { ago, newId, readJsonFile } from '../../kit/src/util';
import { isModule, moduleToWorld } from '../../core/convert/index.js';
import { AuthorProvider, authorFor, readHelperPrefs, saveHelperPrefs, type HelperPrefs } from './author/context';
import type { Generate } from './author/run';

// The site's Settings page, open in the Studio at `#/settings` or `#/settings/<tab>`.
const onHash = (changed: () => void) => { window.addEventListener('hashchange', changed); return () => window.removeEventListener('hashchange', changed); };
function useSettingsAddress(): SettingsTab | null {
  const hash = useSyncExternalStore(onHash, () => window.location.hash, () => '');
  const found = /^#\/settings(?:\/([a-z]+))?$/.exec(hash);
  if (!found) return null;
  return isSettingsTab(found[1]) ? found[1] : 'studio';
}

// `generate` stands in for the model in tests.
export function App({ generate }: { generate?: Generate } = {}) {
  const [worlds, setWorlds] = useState<World[] | null>(null);
  // Which world is open is in the address (route.ts), so Back leaves a world the way it came in.
  const route = useRoute();
  const [status, setStatus] = useState<{ text: string; bad?: boolean } | null>(null);
  const [theme, setTheme] = useTheme();
  const settingsTab = useSettingsAddress();
  // Settings' Done goes back to the page the gear was pressed on.
  const beforeSettings = useRef('#/');
  const openSettings = useCallback((tab: SettingsTab = 'studio') => {
    if (!/^#\/settings/.test(window.location.hash)) beforeSettings.current = window.location.hash || '#/';
    window.location.hash = tab === 'studio' ? '#/settings' : `#/settings/${tab}`;
  }, []);
  const closeSettings = () => { window.location.hash = beforeSettings.current; };
  // One connection for the Studio: Settings changes it, and every Draft button calls through it.
  const [connection, setConnection] = useState<Connection>(initialConnection);
  useEffect(() => { void reconnect(connection).then(setConnection).catch(() => undefined); }, []);
  const [helper, setHelper] = useState<HelperPrefs>(readHelperPrefs);
  const changeHelper = (next: HelperPrefs) => { saveHelperPrefs(next); setHelper(next); };
  const author = useMemo(() => authorFor(connection, () => openSettings('model'), generate, helper), [connection, generate, helper]);
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
  // An open world wears its look (kit/src/look.ts), so its author sees it as players will.
  const [look, setLook] = useLook(open?.look);
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
      <SiteHeader onOverview={async () => { flush(); await Promise.all([...writes.current]); }} side="studio" homeLabel="Inkwyrm Studio, your worlds" onHome={() => { flush(); navigate(NOWHERE); }} settingsOpen={settingsTab !== null} onSettings={() => (settingsTab ? closeSettings() : openSettings())} />
      {settingsTab ? (
        <main>
          <SettingsPage
            side="studio" tab={settingsTab} onTab={openSettings} onDone={closeSettings}
            theme={theme} onTheme={setTheme} look={look} onLook={setLook} connection={connection} onConnection={setConnection}
            studio={{ helper, onHelper: changeHelper }}
          />
        </main>
      ) : open
        ? <WorldView key={open.id} world={open} onChange={save} onDelete={() => void remove(open)} onStatus={setStatus} status={status} />
        : <Home worlds={worlds} status={status} onOpen={(id) => { setStatus(null); navigate({ ...NOWHERE, worldId: id }); }} onCreate={(world, at) => { save(world); navigate({ ...NOWHERE, worldId: world.id, page: world.records.length ? null : 'about', ...at }); }} onStatus={setStatus} />}
    </AuthorProvider>
  );
}

function Home({ worlds, status, onOpen, onCreate, onStatus }: {
  worlds: World[] | null;
  status: { text: string; bad?: boolean } | null;
  onOpen: (id: string) => void;
  // `at`: where in the new world to open, when not its first page.
  onCreate: (world: World, at?: Partial<Route>) => void;
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

  // A household: a world made for Chat, started with the house its people live in. It opens on
  // that house's Home door, where the rooms and the residents are set.
  const [house, setHouse] = useState('');
  const createHousehold = (event: FormEvent) => {
    event.preventDefault();
    if (!house.trim()) return;
    const room = { id: newId(), name: 'Main room', text: '', lock: null, layers: [] };
    const scenario = { ...newRecord('scenario', newId(), house.trim(), newId), sets: [{ id: newId(), title: 'Rooms', reach: 'here' as const, active: room.id, members: [room] }] };
    const world = putRecord({ ...newWorld(newId(), house.trim(), Date.now()), use: 'household' as const }, scenario, Date.now());
    onCreate(world, { rec: scenario.id, door: 'home', page: null });
    setHouse('');
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
  // The site's own world files, such as the dragon's resort and HOG Wild: opened as they are, no
  // module in between.
  const bringIncluded = async (id: string, again = false) => {
    try {
      const brought = await loadIncluded(id, Date.now());
      const taken = worlds?.some((world) => world.id === brought.id);
      if (taken && again) { onOpen(brought.id); return; }
      const world = taken ? { ...brought, id: newId(), name: `${brought.name} (copy)` } : brought;
      onCreate(world);
      onStatus({ text: includedWorld(id)?.household ? `Opened ${world.name}. Its people can be met in Chat, and its Home is in Chat's Home.` : `Opened ${world.name}. Play it from its world page: Play in the adventure.` });
    } catch (error) {
      onStatus({ text: (error as Error).message, bad: true });
    }
  };
  // `#/bring/<id>` from the Overview: open the example, bringing it in only if it isn't here.
  useEffect(() => {
    if (worlds === null) return;
    const asked = /^#\/bring\/([\w-]+)$/.exec(window.location.hash)?.[1];
    if (!asked || !includedWorld(asked)) return;
    window.history.replaceState(null, '', `${window.location.pathname}#/`);
    void bringIncluded(asked, true);
  }, [worlds === null]);

  return (
    <main className="home">
      <PageHead mark="nib" eyebrow="Studio" title="Your worlds" lede={<>Make a world once: its places, its people, what they want and what they won&rsquo;t say. Every part says when it reaches the model.</>} />
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
      <form className="row" onSubmit={createHousehold}>
        <label className="field grow">
          <span>New household</span>
          <input value={house} onChange={(event) => setHouse(event.target.value)} placeholder="The house's name, such as Number Nine" />
        </label>
        <button type="submit" className="btn" style={{ alignSelf: 'flex-end' }} disabled={!house.trim()}>Make a home</button>
        <span className="hint" style={{ flex: '1 1 260px', alignSelf: 'flex-end' }}>A household is for Chat: people to talk to and the home they live in, with rooms. It shows under Homes in Chat.</span>
      </form>
      <div className="row">
        <span className="hint">Or bring in the site&rsquo;s own:</span>
        {INCLUDED_WORLDS.map((entry) => <button key={entry.id} type="button" className="btn small quiet" onClick={() => void bringIncluded(entry.id)} title={entry.who}>{entry.name}</button>)}
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
                {world.use === 'household' && <p className="world-use"><span className="chip line">Household</span> {homesOf([world]).length ? `Home: ${homesOf([world]).map((home) => home.scenario.name).join(', ')}` : 'For Chat'}</p>}
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
