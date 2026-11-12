import { useCallback, useEffect, useRef, useState } from 'react';
import { EMOTIONS, careAt, lifeKey, lifeNow, needsText, newChat, newLife, readChatFile, type Chat, type Life } from '../../core/chat/index.js';
import { importCardFile, newWorld, recordById, type StoryRecord, type World } from '../../core/records/index.js';
import { initialConnection, reconnect, type Connection } from '../../kit/src/connection';
import { SiteHeader } from '../../kit/src/SiteHeader';
import { useTheme } from '../../kit/src/theme';
import { downloadJson, imageDataUrl, newId, readFileBytes, readJsonFile } from '../../kit/src/util';
import { listWorlds, putWorld } from '../../kit/src/worlds';
import { ChatView } from './ChatView';
import { HOUSE_VERSION, HOUSE_WORLD_ID, houseWorld, refreshHouse } from './errata';
import { Home, type Status } from './Home';
import { House } from './House';
import { SettingsView } from './SettingsView';
import { readSettings, writeSettings, type Settings } from './settings';
import {
  allPortraits, deleteChat, deletePortrait, getSent, listChats, listLives, makeBackup, putLife, portraitOwner, portraitSets, putChat, putPortrait, putSent, restoreBackup,
  type PortraitSet, type Sent,
} from './store';

const IMPORTS_WORLD_ID = 'inkwyrm-imports';
const SEEDED_KEY = 'inkwyrm.chat.seeded';

type View = { name: 'home' } | { name: 'house' } | { name: 'settings' } | { name: 'chat'; id: string };
function viewFromHash(): View {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'settings') return { name: 'settings' };
  if (hash === 'home') return { name: 'house' };
  if (hash.startsWith('chat/') && hash.length > 5) return { name: 'chat', id: decodeURIComponent(hash.slice(5)) };
  return { name: 'home' };
}
const hashFor = (view: View) => (view.name === 'chat' ? `#/chat/${encodeURIComponent(view.id)}` : view.name === 'settings' ? '#/settings' : view.name === 'house' ? '#/home' : '#/');

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
  const [lives, setLives] = useState<Record<string, Life>>({});
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
        let seeded = 0;
        try { seeded = Number(localStorage.getItem(SEEDED_KEY)) || 0; } catch { /* storage blocked */ }
        const stored = list.find((world) => world.id === HOUSE_WORLD_ID);
        if (!seeded && !stored) {
          const house = houseWorld(Date.now());
          await putWorld(house);
          list = [...list, house];
        } else if (seeded < HOUSE_VERSION && stored) {
          // Her bundled record has changed since this browser took it.
          const house = refreshHouse(stored, Date.now());
          await putWorld(house);
          list = list.map((world) => (world.id === HOUSE_WORLD_ID ? house : world));
        }
        try { localStorage.setItem(SEEDED_KEY, String(HOUSE_VERSION)); } catch { /* storage blocked */ }
        setWorlds(list);
      } catch (error) {
        // No storage at all: Errata still works for this visit.
        setWorlds([houseWorld(Date.now())]);
        fail(error);
      }
      listChats().then(setChats).catch(() => setChats([]));
      allPortraits().then((all) => setPortraits(portraitSets(all))).catch(() => undefined);
      listLives().then(setLives).catch(() => undefined);
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

  // A character has one life on this device: one clock, one relationship, one set of pins and
  // needs, shared by Home and every chat with them. Until Home or a chat changes it, it is read
  // from their latest chat, so chats from before Home carry on as they were.
  const lifeOf = (worldId: string, record: StoryRecord): Life => {
    const kept = lives[lifeKey(worldId, record.id)];
    if (kept) return kept;
    const latest = chats?.find((chat) => chat.worldId === worldId && chat.characterId === record.id);
    const fresh = newLife(worldId, record, Date.now());
    return latest ? { ...fresh, clock: latest.clock, relationship: latest.relationship, pins: latest.pins } : fresh;
  };
  const saveLife = (life: Life) => { setLives((all) => ({ ...all, [life.key]: life })); putLife(life).catch(fail); };
  const saveWorld = (world: World) => { setWorlds((list) => (list ?? []).map((entry) => (entry.id === world.id ? world : entry))); putWorld(world).catch(fail); };
  // A chat reads its character's life, and what it changes there goes back to the life.
  const withLife = (chat: Chat, life: Life): Chat => ({ ...chat, clock: life.clock, relationship: life.relationship, pins: life.pins });
  const saveChat = (next: Chat, life: Life | null) => {
    if (life && (next.clock !== life.clock || next.relationship !== life.relationship || next.pins !== life.pins)) saveLife({ ...life, clock: next.clock, relationship: next.relationship, pins: next.pins });
    save(next);
  };
  const chatFrom = (world: World, record: StoryRecord, scenario: StoryRecord) => {
    const existing = chats?.find((chat) => chat.worldId === world.id && chat.characterId === record.id && chat.scenarioId === scenario.id);
    if (existing) { go({ name: 'chat', id: existing.id }); return; }
    const life = lifeOf(world.id, record);
    const greeting = record.greetings[0] ?? null;
    const chat = withLife(newChat({ id: newId(), worldId: world.id, characterId: record.id, characterName: record.name, personaId: null, scenarioId: scenario.id, userName: settings.userName || 'User', relationship: life.relationship, style: 'roleplay', responseLength: 'unspecified', greeting }, newId, Date.now()), life);
    save(chat, true);
    go({ name: 'chat', id: chat.id });
  };

  const openId = view.name === 'chat' ? view.id : null;
  const open = chats?.find((chat) => chat.id === openId) ?? null;
  useEffect(() => {
    if (!openId || openId in sent) return;
    getSent(openId).then((record) => setSent((all) => ({ ...all, [openId]: record ?? null }))).catch(() => undefined);
  }, [openId]);

  const setPortrait = async (owner: string, slot: string, file: File | null) => {
    try {
      // A room is seen large; a figure or a face is not.
      const data = file ? await imageDataUrl(file, slot.startsWith('room:') || slot.startsWith('layer:') ? 1600 : slot.startsWith('fig:') ? 900 : 512) : null;
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
    const openWorld = worlds ? worldFor(worlds, open) : null;
    const character = openWorld ? recordById(openWorld, open.characterId) : undefined;
    const life = character ? lifeOf(open.worldId, character) : null;
    // Needs are sent once they are being kept in Home; until then nothing about them reaches the model.
    const kept = !!life && !!character && Object.keys(life.levels).length > 0;
    const needs = kept ? needsText(character!, careAt(character!, life!, lifeNow(life!, Date.now())), open.userName, lifeNow(life!, Date.now())) : undefined;
    return (
      <ChatView
        key={open.id}
        chat={life ? withLife(open, life) : open}
        needs={needs}
        world={openWorld}
        connection={connection}
        settings={settings}
        portraits={portraits[portraitOwner(open.worldId, open.characterId)]}
        sent={sent[open.id] ?? null}
        onChange={(next) => saveChat(next, life)}
        onSent={(record) => { setSent((all) => ({ ...all, [record.chatId]: record })); putSent(record).catch(() => undefined); }}
        onBack={() => { flush(); go({ name: 'home' }); }}
        onDelete={() => void remove(open)}
        onSettings={() => go({ name: 'settings' })}
      />
    );
  }

  return (
    <>
      <SiteHeader side="chat" homeLabel="Inkwyrm Chat, your chats" onHome={() => go({ name: 'home' })} onSettings={() => go(view.name === 'settings' ? { name: 'home' } : { name: 'settings' })} />
      <nav className="local-nav" aria-label="Chat">
        <button type="button" aria-current={view.name === 'home' || undefined} onClick={() => go({ name: 'home' })}>Chats</button>
        <button type="button" aria-current={view.name === 'house' || undefined} onClick={() => go({ name: 'house' })}>Home</button>
        {view.name === 'settings' && <button type="button" aria-current="true" onClick={() => go({ name: 'home' })}>Settings · Done</button>}
      </nav>
      {view.name === 'house' ? (
        <House
          worlds={worlds ?? []} chats={chats ?? []} portraits={portraits} lives={lives} userName={settings.userName}
          onLife={saveLife} onWorld={saveWorld} onPicture={(owner, slot, file) => void setPortrait(owner, slot, file)} onChat={chatFrom}
        />
      ) : view.name === 'settings' ? (
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
            onStart={(chat) => {
              setSettings((now) => ({ ...now, userName: chat.personaId ? now.userName : chat.userName }));
              // What a new chat is set to becomes how things stand with the character.
              const record = worlds?.find((world) => world.id === chat.worldId)?.records.find((entry) => entry.id === chat.characterId);
              if (record) saveLife({ ...lifeOf(chat.worldId, record), clock: chat.clock, relationship: chat.relationship });
              save(chat, true);
              go({ name: 'chat', id: chat.id });
            }}
            onImport={(file) => void importCharacter(file)}
          />
        </>
      )}
    </>
  );
}
