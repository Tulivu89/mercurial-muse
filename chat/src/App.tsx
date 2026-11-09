import { useCallback, useEffect, useRef, useState } from 'react';
import { EMOTIONS, readChatFile, type Chat } from '../../core/chat/index.js';
import { importCardFile, newWorld, recordById, type World } from '../../core/records/index.js';
import { initialConnection, reconnect, type Connection } from '../../kit/src/connection';
import { Drop, Wordmark } from '../../kit/src/Mark';
import { useTheme } from '../../kit/src/theme';
import { downloadJson, imageDataUrl, newId, readFileBytes, readJsonFile } from '../../kit/src/util';
import { listWorlds, putWorld } from '../../kit/src/worlds';
import { ChatView } from './ChatView';
import { HOUSE_WORLD_ID, houseWorld } from './errata';
import { Home, type Status } from './Home';
import { SettingsView } from './SettingsView';
import { readSettings, writeSettings, type Settings } from './settings';
import {
  allPortraits, deleteChat, deletePortrait, getSent, listChats, makeBackup, portraitOwner, portraitSets, putChat, putPortrait, putSent, restoreBackup,
  type PortraitSet, type Sent,
} from './store';

const IMPORTS_WORLD_ID = 'inkwyrm-imports';
const SEEDED_KEY = 'inkwyrm.chat.seeded';

type View = { name: 'home' } | { name: 'settings' } | { name: 'chat'; id: string };
function viewFromHash(): View {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'settings') return { name: 'settings' };
  if (hash.startsWith('chat/') && hash.length > 5) return { name: 'chat', id: decodeURIComponent(hash.slice(5)) };
  return { name: 'home' };
}
const hashFor = (view: View) => (view.name === 'chat' ? `#/chat/${encodeURIComponent(view.id)}` : view.name === 'settings' ? '#/settings' : '#/');

// The world a chat plays in: the character's own, plus the persona and scenario when they were
// picked from another world. A persona made once serves every chat.
export function worldFor(worlds: World[], chat: Chat): World | null {
  const world = worlds.find((entry) => entry.id === chat.worldId);
  if (!world) return null;
  const borrowed = [chat.personaId, chat.scenarioId].flatMap((id) => {
    if (!id || recordById(world, id)) return [];
    const found = worlds.flatMap((entry) => entry.records).find((record) => record.id === id);
    return found ? [{ ...found, groupIds: [], parentId: null }] : [];
  });
  return borrowed.length ? { ...world, records: [...world.records, ...borrowed] } : world;
}

export function App() {
  const [worlds, setWorlds] = useState<World[] | null>(null);
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [portraits, setPortraits] = useState<Record<string, PortraitSet>>({});
  const [connection, setConnection] = useState<Connection>(initialConnection);
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [theme, setTheme] = useTheme();
  const [view, setView] = useState<View>(viewFromHash);
  const [status, setStatus] = useState<Status>(null);
  const [sent, setSent] = useState<Record<string, Sent | null>>({});
  const pending = useRef(new Map<string, Chat>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fail = (error: unknown) => setStatus({ text: error instanceof Error ? error.message : 'Something went wrong.', bad: true });
  const go = useCallback((next: View) => { window.location.hash = hashFor(next); setView(next); setStatus(null); }, []);

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        let list = await listWorlds();
        // Errata comes with the site. She is put in once; delete her world and she stays gone.
        let seeded = false;
        try { seeded = localStorage.getItem(SEEDED_KEY) === '1'; } catch { /* storage blocked */ }
        if (!seeded && !list.some((world) => world.id === HOUSE_WORLD_ID)) {
          const house = houseWorld(Date.now());
          await putWorld(house);
          list = [...list, house];
        }
        try { localStorage.setItem(SEEDED_KEY, '1'); } catch { /* storage blocked */ }
        setWorlds(list);
      } catch (error) {
        // No storage at all: Errata still works for this visit.
        setWorlds([houseWorld(Date.now())]);
        fail(error);
      }
      listChats().then(setChats).catch(() => setChats([]));
      allPortraits().then((all) => setPortraits(portraitSets(all))).catch(() => undefined);
    })();
    void reconnect(initialConnection()).then(setConnection);
  }, []);

  useEffect(() => { writeSettings(settings); }, [settings]);

  // Saves shortly after the last change, so typing a draft doesn't write on every key.
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const batch = [...pending.current.values()];
    pending.current.clear();
    for (const chat of batch) putChat(chat).catch((error: Error) => setStatus({ text: `Not saved: ${error.message}`, bad: true }));
  }, []);
  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => { window.removeEventListener('pagehide', flush); flush(); };
  }, [flush]);

  const save = useCallback((chat: Chat, now = false) => {
    setChats((list) => [chat, ...(list ?? []).filter((existing) => existing.id !== chat.id)].sort((a, b) => b.updatedAt - a.updatedAt));
    pending.current.set(chat.id, chat);
    if (timer.current) clearTimeout(timer.current);
    if (now) flush(); else timer.current = setTimeout(flush, 400);
  }, [flush]);

  const openId = view.name === 'chat' ? view.id : null;
  const open = chats?.find((chat) => chat.id === openId) ?? null;
  useEffect(() => {
    if (!openId || openId in sent) return;
    getSent(openId).then((record) => setSent((all) => ({ ...all, [openId]: record ?? null }))).catch(() => undefined);
  }, [openId]);

  const setPortrait = async (owner: string, slot: string, file: File | null) => {
    try {
      const data = file ? await imageDataUrl(file) : null;
      if (data) await putPortrait(owner, slot, data); else await deletePortrait(owner, slot);
      setPortraits((all) => {
        const next = { ...(all[owner] ?? {}) };
        if (data) next[slot] = data; else delete next[slot];
        return { ...all, [owner]: next };
      });
    } catch (error) { fail(error); }
  };

  const importCharacter = async (file: File) => {
    try {
      const list = worlds ?? [];
      const target = list.find((world) => world.id === IMPORTS_WORLD_ID) ?? newWorld(IMPORTS_WORLD_ID, 'Imported', Date.now());
      const read = importCardFile(target, await readFileBytes(file), newId, Date.now());
      if (!read.ok) { setStatus({ text: read.errors.join(' '), bad: true }); return; }
      const { world, recordId, kind, notes, images } = read.result;
      await putWorld(world);
      setWorlds([world, ...list.filter((entry) => entry.id !== world.id)]);
      const owner = portraitOwner(world.id, recordId);
      const pictures: PortraitSet = {};
      if (images?.avatar) pictures.avatar = images.avatar;
      for (const [slot, data] of Object.entries(images?.emotions ?? {})) if ((EMOTIONS as readonly string[]).includes(slot)) pictures[slot] = data;
      // A PNG card is its own avatar.
      if (read.fromPng && !pictures.avatar) pictures.avatar = await imageDataUrl(file).catch(() => '');
      for (const [slot, data] of Object.entries(pictures)) if (data) await putPortrait(owner, slot, data);
      if (Object.keys(pictures).length) setPortraits((all) => ({ ...all, [owner]: { ...(all[owner] ?? {}), ...pictures } }));
      const name = recordById(world, recordId)?.name ?? 'the card';
      const what = kind === 'character' ? `Brought in ${name}.` : kind === 'persona' ? `Brought in ${name} as a persona. Pick it when you start a chat.` : `Brought in the scenario ${name}. Pick it when you start a chat.`;
      setStatus({ text: [what, ...notes].join(' ') });
    } catch (error) { fail(error); }
  };

  const importChat = async (file: File) => {
    try {
      const read = readChatFile(await readJsonFile(file));
      if (!read.ok) { setStatus({ text: read.errors.join(' '), bad: true }); return; }
      const chat = chats?.some((existing) => existing.id === read.chat.id) ? { ...read.chat, id: newId() } : read.chat;
      save({ ...chat, updatedAt: Date.now() }, true);
      setStatus({ text: `Brought in the chat with ${chat.characterName || 'a character'}.` });
    } catch (error) { fail(error); }
  };

  const backup = async () => {
    try { flush(); downloadJson(`inkwyrm-backup-${new Date().toISOString().slice(0, 10)}.json`, await makeBackup(Date.now())); } catch (error) { fail(error); }
  };
  const restore = async (file: File) => {
    try {
      const counts = await restoreBackup(await readJsonFile(file));
      setWorlds(await listWorlds());
      setChats(await listChats());
      setPortraits(portraitSets(await allPortraits()));
      setStatus({ text: `Restored ${counts.worlds} world${counts.worlds === 1 ? '' : 's'}, ${counts.chats} chat${counts.chats === 1 ? '' : 's'} and ${counts.portraits} portrait${counts.portraits === 1 ? '' : 's'}.` });
    } catch (error) { fail(error); }
  };

  const remove = async (chat: Chat) => {
    if (!window.confirm(`Delete this chat with ${chat.characterName || 'this character'}? Export it first if you want to keep a copy.`)) return;
    pending.current.delete(chat.id);
    await deleteChat(chat.id).catch(() => undefined);
    setChats((list) => (list ?? []).filter((existing) => existing.id !== chat.id));
    go({ name: 'home' });
  };

  if (view.name === 'chat') {
    if (!open) {
      return (
        <main className="home">
          <p className="hint">{chats === null ? 'Opening the chat…' : 'That chat is not in this browser.'}</p>
          {chats !== null && <button type="button" className="btn" onClick={() => go({ name: 'home' })}>Back to your chats</button>}
        </main>
      );
    }
    return (
      <ChatView
        key={open.id}
        chat={open}
        world={worlds ? worldFor(worlds, open) : null}
        connection={connection}
        settings={settings}
        portraits={portraits[portraitOwner(open.worldId, open.characterId)]}
        sent={sent[open.id] ?? null}
        onChange={save}
        onSent={(record) => { setSent((all) => ({ ...all, [record.chatId]: record })); putSent(record).catch(() => undefined); }}
        onBack={() => { flush(); go({ name: 'home' }); }}
        onDelete={() => void remove(open)}
        onSettings={() => go({ name: 'settings' })}
      />
    );
  }

  return (
    <>
      <header className="bar">
        <button type="button" className="brand" onClick={() => go({ name: 'home' })} aria-label="Inkwyrm Chat, your chats">
          <Drop size={34} chat />
          <Wordmark />
          <span className="side">Chat</span>
        </button>
        <div className="bar-actions">
          <button type="button" className="btn quiet" aria-current={view.name === 'settings'} onClick={() => go(view.name === 'settings' ? { name: 'home' } : { name: 'settings' })}>{view.name === 'settings' ? 'Done' : 'Settings'}</button>
          <a className="btn quiet" href="/studio/">Studio</a>
          <a className="btn quiet" href="/">Adventure</a>
        </div>
      </header>
      {view.name === 'settings' ? (
        <SettingsView
          connection={connection} onConnection={setConnection} settings={settings} onSettings={setSettings} theme={theme} onTheme={setTheme}
          worlds={worlds ?? []} portraits={portraits} onPortrait={(owner, slot, file) => void setPortrait(owner, slot, file)}
          onBackup={() => void backup()} onRestore={(file) => void restore(file)} onImportChat={(file) => void importChat(file)} status={status}
        />
      ) : (
        <>
          {!connection.connected && worlds !== null && (
            <p className="status" style={{ margin: '12px clamp(12px, 3vw, 28px) 0' }}>No model connected yet. <button type="button" className="link" onClick={() => go({ name: 'settings' })}>Connect one under Settings</button> with your own key.</p>
          )}
          <Home
            worlds={worlds} chats={chats} portraits={portraits} status={status} userName={settings.userName}
            onOpen={(id) => go({ name: 'chat', id })}
            onStart={(chat) => { setSettings((now) => ({ ...now, userName: chat.personaId ? now.userName : chat.userName })); save(chat, true); go({ name: 'chat', id: chat.id }); }}
            onImport={(file) => void importCharacter(file)}
          />
        </>
      )}
    </>
  );
}
