// The title screen (saved games, a new game, importing) and the game itself.
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import bogwaterRaw from '../../modules/abernys-bogwater.json';
import abernysRaw from '../../modules/abernys-port-covenant.json';
import { loadModule, readSaveFile, sceneOf, startSave, type PraxisModule, type Save } from '../engine';
import { LAUNCH_KEY, readLaunches, withoutLaunch, type Launched } from '../../../core/convert/launch';
import { ConnectForm, initialConnection, reconnect, type Connection } from './Connect';
import { Play } from './Play';
import { readJsonFile } from './files';
import { usePrefs } from './prefs';
import { InkMark } from '../../../kit/src/Mark';
import { SiteHeader } from '../../../kit/src/SiteHeader';
import { THEME_NAMES, useTheme, type Theme } from '../../../kit/src/theme';
import { deleteSave, listSaves, moduleKey, openSave, putModule, putSave, type SaveRecord } from './storage';

type Screen =
  | { kind: 'home' }
  | { kind: 'play'; id: string; name: string; module: PraxisModule; save: Save };

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `s${Date.now()}${Math.random().toString(16).slice(2)}`;
}

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [saves, setSaves] = useState<SaveRecord[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [storageNote, setStorageNote] = useState('');
  const [connection, setConnection] = useState<Connection>(initialConnection);
  const [prefs, setPrefs] = usePrefs();
  const [theme, setTheme] = useTheme();

  const refresh = useCallback(async () => {
    try { setSaves(await listSaves()); } catch (error) { setStorageNote(error instanceof Error ? error.message : 'Saved games are unavailable.'); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  // A key remembered on this device connects by itself.
  useEffect(() => { void reconnect(connection).then(setConnection); }, []);

  async function begin(module: PraxisModule, save: Save, name: string, id = newId()) {
    try { await putModule(module); } catch { setStorageNote('This browser is not keeping saves. Export your game to keep it.'); }
    setErrors([]);
    setScreen({ kind: 'play', id, name, module, save });
  }

  function newGame(raw: unknown) {
    const loaded = loadModule(raw);
    if (!loaded.ok) { setErrors(loaded.errors); return; }
    void begin(loaded.module, startSave(loaded.module, Math.floor(Math.random() * 2 ** 31)), loaded.module.name);
  }

  // Worlds sent from the Studio with "Play in the adventure". One named in the address starts
  // straight away.
  const [launches, setLaunches] = useState<Launched[]>(() => { try { return readLaunches(window.localStorage.getItem(LAUNCH_KEY)); } catch { return []; } });
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('launch');
    if (!id) return;
    window.history.replaceState(null, '', window.location.pathname);
    const sent = launches.find((entry) => entry.id === id);
    if (sent) newGame(sent.module);
    else setErrors(['That world is not in this browser any more. Send it again from the Studio.']);
  }, []);
  function forget(id: string) {
    const next = withoutLaunch(launches, id);
    setLaunches(next);
    try { window.localStorage.setItem(LAUNCH_KEY, JSON.stringify(next)); } catch { /* nothing to keep it in */ }
  }

  async function onModuleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const read = await readJsonFile(file);
    if (!read.ok) { setErrors([read.error]); return; }
    newGame(read.data);
  }

  async function onSaveFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const read = await readJsonFile(file);
    if (!read.ok) { setErrors([read.error]); return; }
    const parsed = readSaveFile(read.data);
    if (!parsed.ok) { setErrors(parsed.errors); return; }
    void begin(parsed.module, parsed.save, parsed.name);
  }

  async function resume(record: SaveRecord) {
    const opened = await openSave(record);
    if (!opened.ok) { setErrors(opened.errors); return; }
    void begin(opened.module, opened.save, record.name, record.id);
  }

  async function remove(record: SaveRecord) {
    if (!window.confirm(`Delete "${record.name}" from this browser? Export it first if you want to keep it.`)) return;
    await deleteSave(record.id).catch(() => undefined);
    void refresh();
  }

  // Autosave. Kept stable so Play's effect runs once per change, not once per render.
  const playing = screen.kind === 'play' ? screen : null;
  const target = useRef(playing);
  target.current = playing;
  const persist = useCallback((save: Save) => {
    const current = target.current;
    if (!current) return;
    const scene = sceneOf(current.module, save);
    putSave({
      id: current.id,
      name: current.name,
      moduleKey: moduleKey(current.module),
      moduleName: current.module.name,
      updatedAt: Date.now(),
      place: scene.place.name,
      stamp: scene.stamp,
      turns: save.turns.length,
      save,
    }).catch(() => setStorageNote('This browser is not keeping saves. Export your game to keep it.'));
  }, []);

  if (playing) {
    return (
      <Play
        key={playing.id}
        module={playing.module}
        initial={playing.save}
        name={playing.name}
        connection={connection}
        setConnection={setConnection}
        prefs={prefs}
        setPrefs={setPrefs}
        theme={theme}
        setTheme={setTheme}
        onChange={persist}
        onClose={() => { setScreen({ kind: 'home' }); void refresh(); }}
      />
    );
  }

  // One seal a screen: the game played last, or the first thing on offer when there is none.
  const lead = saves.length ? 'save' : launches.length ? 'launch' : 'new';

  return (
    <>
      <SiteHeader side="adventure" homeLabel="Inkwyrm Adventure" settingsHref="#settings" />
      <main className="home">
        <header className="home-head">
          <InkMark name="dragon" size={64} title="Inkwyrm Adventure" land />
          <div>
            <h1 className="wordmark ink-write">Your adventures</h1>
            <p className="tagline">A roleplay where the story is yours and the facts are kept.</p>
          </div>
        </header>

        {storageNote && <p className="notice warn">{storageNote}</p>}
        {!connection.connected && <p className="notice">No narrator connected yet. <a href="#settings">Connect one under Settings</a>, below, with your own key.</p>}

        {errors.length > 0 && (
          <section aria-live="polite" className="card pad">
            <p className="name">That could not be loaded</p>
            <ul className="errors">{errors.map((line) => <li key={line}>{line}</li>)}</ul>
          </section>
        )}

        {saves.length > 0 && (
          <section>
            <h2>Continue</h2>
            <div className="card clip">
              {saves.map((record, index) => (
                <div key={record.id} className="save-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="name">{record.name}</p>
                    <p className="meta">{record.place} · {record.stamp} · {record.turns} {record.turns === 1 ? 'turn' : 'turns'}</p>
                    <p className="meta">Saved {new Date(record.updatedAt).toLocaleString()}</p>
                  </div>
                  <button type="button" className={index === 0 ? 'btn seal' : 'btn'} onClick={() => void resume(record)}>Continue</button>
                  <button type="button" className="btn quiet" aria-label={`Delete ${record.name}`} onClick={() => void remove(record)}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {launches.length > 0 && (
          <section>
            <h2>From the Studio</h2>
            <div className="card clip">
              {launches.map((entry, index) => (
                <div key={entry.id} className="save-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="name">{entry.name}</p>
                    <p className="meta">Sent {new Date(entry.at).toLocaleString()}</p>
                  </div>
                  <button type="button" className={lead === 'launch' && index === 0 ? 'btn seal' : 'btn'} onClick={() => newGame(entry.module)}>Play</button>
                  <button type="button" className="btn quiet" aria-label={`Remove ${entry.name}`} onClick={() => forget(entry.id)}>Remove</button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2>New game</h2>
          <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button type="button" className={lead === 'new' ? 'btn seal wide' : 'btn wide'} style={{ minHeight: 52, justifyContent: 'flex-start' }} onClick={() => newGame(bogwaterRaw)}>Abernys: Bogwater</button>
            <button type="button" className="btn wide" style={{ minHeight: 52, justifyContent: 'flex-start' }} onClick={() => newGame(abernysRaw)}>Abernys: Port Covenant</button>
            <label className="file-pick">
              <span className="meta">Or a module file</span>
              <input type="file" accept="application/json,.json" onChange={(event) => void onModuleFile(event)} />
            </label>
          </div>
        </section>

        <section>
          <h2>Import a save</h2>
          <div className="card pad">
            <p className="meta" style={{ lineHeight: 1.45 }}>Saves live in this browser. Clearing its site data deletes them, so export the ones you want to keep.</p>
            <label className="file-pick">
              <span className="meta">A .save.json file (or an older .praxis.json)</span>
              <input type="file" accept="application/json,.json" onChange={(event) => void onSaveFile(event)} />
            </label>
          </div>
        </section>

        {/* Settings is down the page here, as it is under the prompt in play. */}
        <section id="settings">
          <h2>Settings</h2>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="lr stack">
              <span className="name">Look</span>
              <div className="seg" role="group" aria-label="Look">
                {(['paper', 'night', 'auto'] as Theme[]).map((option) => <button key={option} type="button" aria-pressed={theme === option} onClick={() => setTheme(option)}>{THEME_NAMES[option]}</button>)}
              </div>
              <span className="meta" style={{ lineHeight: 1.45 }}>Paper by day, ink by night. The same choice holds in Chat and the Studio.</span>
            </div>
          </div>
          <div className="card clip"><ConnectForm connection={connection} onChange={setConnection} /></div>
        </section>

        <p className="version">{__PRAXIS_VERSION__}</p>
      </main>
    </>
  );
}
