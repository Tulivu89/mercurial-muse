import { useCallback, useEffect, useRef, useState } from 'react';
import { EMOTIONS, careAt, homeOf, lifeKey, lifeNow, needsText, newChat, newLife, postSlot, readChatFile, type Chat, type Life, type Post, readSillyTavernChat, withSillyTavernTurns } from '../../core/chat/index.js';
import { importCardFile, newRecord, newWorld, putRecord, recordById, removeRecord, type StoryRecord, type World } from '../../core/records/index.js';
import { initialConnection, reconnect, type Connection } from '../../kit/src/connection';
import { SiteHeader } from '../../kit/src/SiteHeader';
import { characterKey, initializeCollection, loadCollection, memberFor, patchMember, saveCollection } from '../../kit/src/collection';
import { animationSlot, portraitSource, posterSlot, readImageAsset, readImageDataUrl } from '../../kit/src/media';
import { recordActivity } from '../../kit/src/activity';
import { useTheme } from '../../kit/src/theme';
import { useLook } from '../../kit/src/look';
import { downloadJson, newId, readFileBytes, readJsonFile } from '../../kit/src/util';
import { deleteWorld, listWorlds, putWorld } from '../../kit/src/worlds';
import { HOUSE_VERSION, HOUSE_WORLD_ID, INCLUDED_WORLDS, RETIRED_HOUSE_ID, loadIncluded, loadResort } from '../../kit/src/included';
import { ChatView } from './ChatView';
import { Home, type Status } from './Home';
import { House, type HouseAt } from './House';
import { postingFor } from './posting';
import { SettingsView } from './SettingsView';
import { You, defaultPersona, personasOf, type PersonaRef } from './You';
import { readSettings, writeSettings, type Settings } from './settings';
import {
  displayPortraits, deleteChat, deletePortrait, deletePost, getSent, listChats, listLives, listPosts, makeBackup, putLife, portraitOwner, portraitSets, putChat, putPortrait, putPost, putSent, restoreBackup,
  type PortraitSet, type Sent,
} from './store';

const IMPORTS_WORLD_ID = 'inkwyrm-imports';
// Chat's own shelf: where imported cards, characters made here and personas live. It is for Chat,
// never an adventure.
const shelf = (name: string): World => ({ ...newWorld(IMPORTS_WORLD_ID, name, Date.now()), use: 'household' });
const SEEDED_KEY = 'inkwyrm.chat.seeded';

// `with` is a character to start a chat with, from the Studio's *Chat with* or the Overview:
// `#/with/<world>/<record>`. It opens the new-chat sheet and creates nothing by itself.
// A chat remembers the place it was opened from, so Back returns there (Home, most of all).
type Place = { name: 'home'; with?: { worldId: string; recordId: string } } | { name: 'conversations' } | { name: 'character'; worldId: string; recordId: string } | { name: 'house'; at?: HouseAt } | { name: 'you' } | { name: 'settings' };
type View = Place | { name: 'chat'; id: string; back?: Place };
export function viewFromHash(hashText = window.location.hash): View {
  const hash = hashText.replace(/^#\/?/, '');
  if (hash === 'conversations') return { name: 'conversations' };
  const character = /^character\/([^/]+)\/([^/?]+)$/.exec(hash);
  if (character) { try { return { name: 'character', worldId: decodeURIComponent(character[1]!), recordId: decodeURIComponent(character[2]!) }; } catch { return { name: 'home' }; } }
  if (hash === 'settings') return { name: 'settings' };
  if (hash === 'you') return { name: 'you' };
  const asked = /^with\/([^/]+)\/([^/?]+)$/.exec(hash);
  if (asked) {
    try { return { name: 'home', with: { worldId: decodeURIComponent(asked[1]), recordId: decodeURIComponent(asked[2]) } }; } catch { return { name: 'home' }; }
  }
  // Home: the list of homes, one home, or one home's posts.
  if (hash === 'home') return { name: 'house' };
  const house = /^home\/([^/]+)\/([^/?]+)(\/posts)?$/.exec(hash);
  if (house) { try { return { name: 'house', at: { worldId: decodeURIComponent(house[1]!), scenarioId: decodeURIComponent(house[2]!), ...(house[3] ? { tab: 'posts' as const } : {}) } }; } catch { return { name: 'house' }; } }
  if (hash.startsWith('chat/') && hash.length > 5) { try { return { name: 'chat', id: decodeURIComponent(hash.slice(5)) }; } catch { return { name: 'home' }; } }
  return { name: 'home' };
}
const hashFor = (view: View) => {
  if (view.name === 'character') return `#/character/${encodeURIComponent(view.worldId)}/${encodeURIComponent(view.recordId)}`;
  if (view.name === 'conversations') return '#/conversations';
  if (view.name === 'chat') return `#/chat/${encodeURIComponent(view.id)}`;
  if (view.name === 'settings') return '#/settings';
  if (view.name === 'you') return '#/you';
  if (view.name === 'house') return view.at ? `#/home/${encodeURIComponent(view.at.worldId)}/${encodeURIComponent(view.at.scenarioId)}${view.at.tab === 'posts' ? '/posts' : ''}` : '#/home';
  return '#/';
};

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
  const [readTick, setReadTick] = useState(0);
  const [worldsReady, setWorldsReady] = useState(false);
  const [chatsReady, setChatsReady] = useState(false);
  const writes = useRef(new Set<Promise<unknown>>());
  const [worlds, setWorlds] = useState<World[] | null>(null);
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [portraits, setPortraits] = useState<Record<string, PortraitSet>>({});
  const [lives, setLives] = useState<Record<string, Life>>({});
  const [posts, setPosts] = useState<Post[]>([]);
  // The posts as they stand this instant, for a run of comments that each read the last.
  const postsNow = useRef<Post[]>([]);
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
    // The address says where; what a chat was opened from, or who Home was looking at, is kept.
    const onHash = () => setView((now) => { const next = viewFromHash(); return hashFor(next) === hashFor(now) ? now : next; });
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    setWorldsReady(false); setChatsReady(false);
    void (async () => {
      try {
        let list = await listWorlds();
        // The house comes with the site: the dragon's resort, put in once. Delete it and it
        // stays gone (Home offers it again). When the bundled house changes, this browser's copy
        // is replaced by it: the world file is the source, not the copy. The older mascot world
        // it replaced is taken out.
        let seeded = 0;
        try { seeded = Number(localStorage.getItem(SEEDED_KEY)) || 0; } catch { /* storage blocked */ }
        if (seeded < HOUSE_VERSION) {
          if (list.some((world) => world.id === RETIRED_HOUSE_ID)) {
            await deleteWorld(RETIRED_HOUSE_ID);
            list = list.filter((world) => world.id !== RETIRED_HOUSE_ID);
          }
          const had = list.some((world) => world.id === HOUSE_WORLD_ID);
          if (!seeded || had) {
            const house = await loadResort(Date.now());
            await putWorld(house);
            list = [...list.filter((world) => world.id !== HOUSE_WORLD_ID), house];
          }
        }
        try { localStorage.setItem(SEEDED_KEY, String(HOUSE_VERSION)); } catch { /* storage blocked */ }
        // The site's own households, and Chat's shelf of imported cards, were made before a world
        // said what it is for. Each is marked in place, so nothing arranged in it is lost.
        const chatOnly = new Set<string>([IMPORTS_WORLD_ID, ...INCLUDED_WORLDS.map((entry) => entry.id)]);
        for (const world of list.filter((entry) => chatOnly.has(entry.id) && entry.use === undefined)) {
          const marked = { ...world, use: 'household' as const };
          await putWorld(marked);
          list = list.map((entry) => (entry.id === marked.id ? marked : entry));
        }
        setWorlds(list);
        setWorldsReady(true);
      } catch (error) {
        // No storage at all: the house still works for this visit.
        if (worlds === null) setWorlds(await loadResort(Date.now()).then((house) => [house]).catch(() => []));
        fail(error);
      }
      listChats().then((list) => { setChats(list); setChatsReady(true); }).catch((error) => { if (chats === null) setChats([]); fail(error); });
      displayPortraits().then((all) => setPortraits(portraitSets(all))).catch(() => undefined);
      listLives().then(setLives).catch(() => undefined);
      listPosts().then((list) => { postsNow.current = list; setPosts(list); }).catch(() => undefined);
    })();
    void reconnect(initialConnection()).then(setConnection).catch(fail);
  }, [readTick]);

  useEffect(() => { writeSettings(settings); }, [settings]);
  useEffect(() => {
    if (!worldsReady || !chatsReady || !worlds || !chats) return;
    const current = loadCollection();
    if (!current.initialized) { try { saveCollection(initializeCollection(current, worlds, chats)); } catch (error) { fail(error); } }
  }, [worldsReady, chatsReady, worlds, chats]);

  // Saves shortly after the last change, so typing a draft doesn't write on every key.
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const batch = [...pending.current.values()];
    pending.current.clear();
    for (const chat of batch) { const write = putChat(chat); writes.current.add(write); void write.catch((error: Error) => { if (!pending.current.has(chat.id) || pending.current.get(chat.id)!.updatedAt <= chat.updatedAt) pending.current.set(chat.id, chat); setStatus({ text: `Not saved: ${error.message}`, bad: true }); }).finally(() => writes.current.delete(write)); }
  }, []);
  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => { window.removeEventListener('pagehide', flush); flush(); };
  }, [flush]);

  const beforeOverview = async () => { flush(); await Promise.all([...writes.current]); };

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
  const savePost = (post: Post) => {
    postsNow.current = [post, ...postsNow.current.filter((entry) => entry.id !== post.id)].sort((a, b) => b.madeAt - a.madeAt);
    setPosts(postsNow.current);
    putPost(post).catch(fail);
  };
  const removePost = (post: Post) => {
    postsNow.current = postsNow.current.filter((entry) => entry.id !== post.id);
    setPosts(postsNow.current);
    deletePost(post.id).catch(fail);
    deletePortrait(portraitOwner(post.worldId, post.characterId), postSlot(post.id)).catch(() => undefined);
  };
  const saveWorld = (world: World) => { setWorlds((list) => (list ?? []).map((entry) => (entry.id === world.id ? world : entry))); putWorld(world).catch(fail); };
  // A chat reads its character's life, and what it changes there goes back to the life.
  const withLife = (chat: Chat, life: Life): Chat => ({ ...chat, clock: life.clock, relationship: life.relationship, pins: life.pins });
  const saveChat = (next: Chat, life: Life | null) => {
    if (life && (next.clock !== life.clock || next.relationship !== life.relationship || next.pins !== life.pins)) saveLife({ ...life, clock: next.clock, relationship: next.relationship, pins: next.pins });
    save(next);
  };
  // From Home into a chat: the one already going in that house, or a new one as your usual self.
  // Back from it returns to the house.
  const chatFrom = (world: World, record: StoryRecord, scenario: StoryRecord) => {
    const back: Place = { name: 'house', at: { worldId: world.id, scenarioId: scenario.id, who: record.id } };
    const existing = chats?.find((chat) => chat.worldId === world.id && chat.characterId === record.id && chat.scenarioId === scenario.id);
    if (existing) { go({ name: 'chat', id: existing.id, back }); return; }
    const life = lifeOf(world.id, record);
    const greeting = record.greetings[0] ?? null;
    const usual = defaultPersona(worlds ?? [], settings);
    const chat = withLife(newChat({ id: newId(), worldId: world.id, characterId: record.id, characterName: record.name, personaId: usual?.record.id ?? null, scenarioId: scenario.id, userName: usual?.record.name ?? (settings.userName || 'User'), relationship: life.relationship, style: 'roleplay', responseLength: 'unspecified', greeting }, newId, Date.now()), life);
    save(chat, true);
    go({ name: 'chat', id: chat.id, back });
  };

  const openId = view.name === 'chat' ? view.id : null;
  const open = chats?.find((chat) => chat.id === openId) ?? null;
  // The world in view wears its look (kit/src/look.ts): a chat's, a character's or a home's.
  const viewWorldId = open?.worldId ?? (view.name === 'character' ? view.worldId : view.name === 'house' ? view.at?.worldId : view.name === 'home' ? view.with?.worldId : undefined);
  const [look, setLook] = useLook(worlds?.find((world) => world.id === viewWorldId)?.look);
  // A chat that really opened is what the Overview's Continue offers.
  useEffect(() => {
    if (!open) return;
    recordActivity({ kind: 'chat', chatId: open.id });
    const world = worlds?.find((w) => w.id === open.worldId); const record = world?.records.find((r) => r.id === open.characterId);
    const current = loadCollection();
    if (world && record && memberFor(current, world, record, chats ?? [])) { try { saveCollection(patchMember(current, world.id, record.id, { ...(memberFor(current, world, record, chats ?? [])!), lastChatId: open.id })); } catch (error) { fail(error); } }
  }, [open?.id]);
  // A home that really opened, too.
  const houseAt = view.name === 'house' ? view.at : undefined;
  const houseOpen = !!houseAt && !!worlds?.some((world) => world.id === houseAt.worldId && world.records.some((record) => record.id === houseAt.scenarioId));
  useEffect(() => { if (houseAt && houseOpen) recordActivity({ kind: 'home', worldId: houseAt.worldId, scenarioId: houseAt.scenarioId }); }, [houseAt?.worldId, houseAt?.scenarioId, houseOpen]);
  useEffect(() => {
    if (!openId || openId in sent) return;
    getSent(openId).then((record) => setSent((all) => ({ ...all, [openId]: record ?? null }))).catch(() => undefined);
  }, [openId]);

  const setPortrait = async (owner: string, slot: string, file: File | null) => {
    try {
      // A room is seen large; a figure or a face is not.
      const image = file ? await readImageAsset(file, slot.startsWith('room:') || slot.startsWith('layer:') ? 1600 : slot.startsWith('post:') ? 1200 : slot.startsWith('fig:') ? 900 : 640) : null;
      const data = image?.data;
      if (image) await putPortrait(owner, slot, image.data, image); else await deletePortrait(owner, slot);
      setPortraits((all) => {
        const next = { ...(all[owner] ?? {}) };
        delete next[posterSlot(slot)]; delete next[animationSlot(slot)];
        if (data && image) { next[slot] = portraitSource(`${owner}:${slot}`, newId()); next[posterSlot(slot)] = image.poster; next[animationSlot(slot)] = String(image.animated); } else delete next[slot];
        return { ...all, [owner]: next };
      });
    } catch (error) { fail(error); }
  };

  // A world that comes with the site (the dragon's resort, HOG Wild), put in this browser once on
  // request, with its chat characters in the collection.
  const bringIncluded = async (id: string) => {
    if (!worldsReady) { fail(new Error('Your worlds could not be read yet. Retry the library before bringing in a world.')); return; }
    try {
      const brought = await loadIncluded(id, Date.now());
      await putWorld(brought);
      setWorlds([...(worlds ?? []).filter((world) => world.id !== brought.id), brought]);
      let collection = loadCollection();
      for (const record of brought.records.filter((entry) => entry.kind === 'character' && entry.chatListed)) collection = patchMember(collection, brought.id, record.id, { state: 'active' });
      saveCollection(collection);
    } catch (error) { fail(error); }
  };
  const missingIncluded = worldsReady ? INCLUDED_WORLDS.filter((entry) => !worlds?.some((world) => world.id === entry.id)) : [];

  const createCharacter = async (name: string) => {
    if (!worldsReady) throw new Error('Retry the library before creating a character.');
    const target = worlds?.find((world) => world.id === IMPORTS_WORLD_ID) ?? shelf('Your characters');
    const record = { ...newRecord('character', newId(), name, newId), chatListed: true };
    const world = { ...target, records: [...target.records, record], updatedAt: Date.now() };
    await putWorld(world); setWorlds([world, ...(worlds ?? []).filter((w) => w.id !== world.id)]);
    try { saveCollection(patchMember(loadCollection(), world.id, record.id, { state: 'active' })); } catch (error) { fail(error); }
    await beforeOverview(); window.location.assign(`/studio/#/w/${encodeURIComponent(world.id)}?rec=${encodeURIComponent(record.id)}`);
  };

  // Personas are records; ones made here live beside imported cards, where the Studio can edit them.
  const createPersona = async (name: string): Promise<PersonaRef> => {
    if (!worldsReady) throw new Error('Your worlds could not be read yet. Retry the library before making a persona.');
    const target = worlds?.find((world) => world.id === IMPORTS_WORLD_ID) ?? shelf('Your characters');
    const record = newRecord('persona', newId(), name, newId);
    const world = putRecord(target, record, Date.now());
    await putWorld(world);
    setWorlds([world, ...(worlds ?? []).filter((entry) => entry.id !== world.id)]);
    return { world, record };
  };
  const savePersona = (worldId: string, record: StoryRecord) => { const world = worlds?.find((entry) => entry.id === worldId); if (world) saveWorld(putRecord(world, record, Date.now())); };
  const deletePersona = (worldId: string, record: StoryRecord) => {
    const world = worlds?.find((entry) => entry.id === worldId);
    if (!world) return;
    saveWorld(removeRecord(world, record.id, Date.now()));
    deletePortrait(portraitOwner(worldId, record.id), 'avatar').catch(() => undefined);
  };

  const importCharacter = async (file: File) => {
    if (!worldsReady) { fail(new Error('Your worlds could not be read yet. Retry the library before importing a character.')); return; }
    try {
      const list = worlds ?? [];
      const target = list.find((world) => world.id === IMPORTS_WORLD_ID) ?? shelf('Imported');
      const read = importCardFile(target, await readFileBytes(file), newId, Date.now());
      if (!read.ok) { setStatus({ text: read.errors.join(' '), bad: true }); return; }
      const { world: importedWorld, recordId, kind, notes, images } = read.result;
      const world = kind === 'character' ? { ...importedWorld, records: importedWorld.records.map((r) => r.id === recordId ? { ...r, chatListed: true } : r) } : importedWorld;
      await putWorld(world);
      setWorlds([world, ...list.filter((entry) => entry.id !== world.id)]);
      const owner = portraitOwner(world.id, recordId);
      const pictures: PortraitSet = {};
      if (images?.avatar) pictures.avatar = images.avatar;
      for (const [slot, data] of Object.entries(images?.emotions ?? {})) if ((EMOTIONS as readonly string[]).includes(slot)) pictures[slot] = data;
      // A PNG card is its own avatar.
      if (read.fromPng && !pictures.avatar) pictures.avatar = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); }).catch(() => '');
      for (const [slot, data] of Object.entries(pictures)) if (data) {
        const image = await readImageDataUrl(data).catch(() => null);
        await putPortrait(owner, slot, data, image ?? {});
        if (image) { pictures[slot] = portraitSource(`${owner}:${slot}`, newId()); pictures[posterSlot(slot)] = image.poster; pictures[animationSlot(slot)] = String(image.animated); }
      }
      if (Object.keys(pictures).length) setPortraits((all) => ({ ...all, [owner]: { ...(all[owner] ?? {}), ...pictures } }));
      if (kind === 'character') { try { saveCollection(patchMember(loadCollection(), world.id, recordId, { state: 'active' })); } catch (error) { fail(error); } }
      const name = recordById(world, recordId)?.name ?? 'the card';
      const what = kind === 'character' ? `Brought in ${name}.` : kind === 'persona' ? `Brought in ${name} as a persona. It is under You, and a new chat can start as them.` : `Brought in the scenario ${name}. Pick it when you start a chat.`;
      setStatus({ text: [what, ...notes].join(' ') });
    } catch (error) { fail(error); }
  };

  const importChat = async (file: File) => {
    try {
      const text = await file.text();
      let raw: unknown;
      try { raw = JSON.parse(text); } catch { raw = undefined; }
      // Not one of ours: a SillyTavern chat file, bound to the character of the same name.
      if (raw === undefined || file.name.toLowerCase().endsWith('.jsonl')) { importSillyTavern(text); return; }
      const read = readChatFile(raw);
      if (!read.ok) { setStatus({ text: read.errors.join(' '), bad: true }); return; }
      const chat = chats?.some((existing) => existing.id === read.chat.id) ? { ...read.chat, id: newId() } : read.chat;
      save({ ...chat, updatedAt: Date.now() }, true);
      setStatus({ text: `Brought in the chat with ${chat.characterName || 'a character'}.` });
    } catch (error) { fail(error); }
  };

  const importSillyTavern = (text: string) => {
    const read = readSillyTavernChat(text);
    if (!read.ok) { setStatus({ text: read.error, bad: true }); return; }
    const name = read.characterName.trim().toLowerCase();
    const found = (worlds ?? []).flatMap((world) => world.records.filter((record) => record.kind === 'character' && record.name.trim().toLowerCase() === name).map((record) => ({ world, record })))
      .sort((a, b) => Number(b.record.chatListed ?? false) - Number(a.record.chatListed ?? false))[0];
    if (!found) { setStatus({ text: `There is no character called ${read.characterName || 'that'} here yet. Import their card first, then the chat.`, bad: true }); return; }
    const now = Date.now();
    const base = newChat({ id: newId(), worldId: found.world.id, characterId: found.record.id, characterName: found.record.name, personaId: null, scenarioId: null, userName: read.userName || settings.userName || 'User', relationship: 'stranger', style: 'roleplay', responseLength: 'unspecified', greeting: null }, newId, now);
    const chat = withSillyTavernTurns(base, read.turns, newId, now);
    save(chat, true);
    setStatus({ text: `Brought in ${read.turns.length} message${read.turns.length === 1 ? '' : 's'} with ${found.record.name} from SillyTavern.` });
  };

  const backup = async () => {
    try { await beforeOverview(); downloadJson(`inkwyrm-backup-${new Date().toISOString().slice(0, 10)}.json`, await makeBackup(Date.now())); } catch (error) { fail(error); }
  };
  const restore = async (file: File) => {
    try {
      const counts = await restoreBackup(await readJsonFile(file));
      setWorlds(await listWorlds());
      setChats(await listChats());
      setPortraits(portraitSets(await displayPortraits()));
      setLives(await listLives().catch(() => ({})));
      await listPosts().then((list) => { postsNow.current = list; setPosts(list); }).catch(() => undefined);
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

  const posting = postingFor({
    worlds: worlds ?? [], chats: chats ?? [], latest: () => postsNow.current, connection, settings, lifeOf,
    worldFor: (chat) => (worlds ? worldFor(worlds, chat) : null), savePost, removePost,
  });
  // Rebuilt with `posts`, so a new post or comment redraws whoever shows the feed.
  void posts;
  const personas = personasOf(worlds ?? []);

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
        onBack={() => { flush(); go(view.back ?? { name: 'home' }); }}
        onOverview={beforeOverview}
        onDelete={() => void remove(open)}
        onSettings={() => go({ name: 'settings' })}
        life={life} onLife={saveLife}
        home={character && openWorld ? homeOf(openWorld, character) : null}
        onHome={(at) => { flush(); go({ name: 'house', at }); }}
        posting={posting} allPortraits={portraits} onPicture={(owner, slot, file) => void setPortrait(owner, slot, file)}
        personas={personas}
        otherChats={chats ?? []}
        onBranch={(branched) => { flush(); save(branched, true); go({ name: 'chat', id: branched.id, back: view.back }); setStatus({ text: `A branch of the chat with ${branched.characterName}, up to the message you picked. The first chat is as it was.` }); }}
      />
    );
  }

  return (
    <>
      <SiteHeader onOverview={beforeOverview} side="chat" homeLabel="Inkwyrm Chat, your chats" onHome={() => go({ name: 'home' })} onSettings={() => go(view.name === 'settings' ? { name: 'home' } : { name: 'settings' })} />
      <nav className="local-nav" aria-label="Chat">
        <button type="button" aria-current={view.name === 'home' || view.name === 'character' || undefined} onClick={() => go({ name: 'home' })}>Collection</button>
        <button type="button" aria-current={view.name === 'conversations' || undefined} onClick={() => go({ name: 'conversations' })}>Conversations</button>
        <button type="button" aria-current={view.name === 'house' || undefined} onClick={() => go({ name: 'house' })}>Homes</button>
        <button type="button" aria-current={view.name === 'you' || undefined} onClick={() => go({ name: 'you' })}>You</button>
        {view.name === 'settings' && <button type="button" aria-current="true" onClick={() => go({ name: 'home' })}>Settings · Done</button>}
      </nav>
      {view.name === 'house' ? (
        <House
          worlds={worlds ?? []} chats={chats ?? []} portraits={portraits} lives={lives} userName={settings.userName}
          onLife={saveLife} onWorld={saveWorld} onPicture={(owner, slot, file) => void setPortrait(owner, slot, file)} onChat={chatFrom}
          bringable={missingIncluded} onBring={(id) => void bringIncluded(id)}
          at={view.at ?? null} onGo={(at) => go({ name: 'house', ...(at ? { at } : {}) })} posting={posting}
        />
      ) : view.name === 'you' ? (
        <You
          worlds={worlds} portraits={portraits} settings={settings} status={status} onSettings={setSettings}
          onCreate={createPersona} onSave={savePersona} onDelete={deletePersona}
          onPicture={(owner, slot, file) => void setPortrait(owner, slot, file)} onImport={(file) => void importCharacter(file)}
        />
      ) : view.name === 'settings' ? (
        <SettingsView
          connection={connection} onConnection={setConnection} settings={settings} onSettings={setSettings} theme={theme} onTheme={setTheme} look={look} onLook={setLook}
          worlds={worlds ?? []} portraits={portraits} onPortrait={(owner, slot, file) => void setPortrait(owner, slot, file)}
          onBackup={() => void backup()} onRestore={(file) => void restore(file)} onImportChat={(file) => void importChat(file)} status={status}
        />
      ) : (
        <>
          {!connection.connected && worlds !== null && (
            <p className="status" style={{ margin: '12px clamp(12px, 3vw, 28px) 0' }}>No model connected yet. <button type="button" className="link" onClick={() => go({ name: 'settings' })}>Connect one under Settings</button> with your own key.</p>
          )}
          <Home
            key={view.name === 'character' ? characterKey(view.worldId, view.recordId) : 'collection'}
            worlds={worlds} chats={chats} portraits={portraits} status={status} userName={settings.userName} persona={settings.persona}
            onRetry={!worldsReady || !chatsReady ? () => { setStatus(null); setReadTick((n) => n + 1); } : undefined}
            mode={view.name === 'conversations' ? 'conversations' : 'collection'}
            profile={view.name === 'character' ? { worldId: view.worldId, recordId: view.recordId } : undefined}
            onPortrait={(owner, slot, file) => void setPortrait(owner, slot, file)} onCreate={worldsReady ? createCharacter : undefined} onBackup={() => void backup()}
            bringable={missingIncluded} onBring={(id) => void bringIncluded(id)}
            startWith={view.name === 'home' ? view.with ?? null : null}
            onStartWithDone={(found) => {
              window.history.replaceState(null, '', `${window.location.pathname}#/`);
              setView({ name: 'home' });
              if (!found) setStatus({ text: 'That character is not in this browser. Open their world in the Studio, or import their card here.', bad: true });
            }}
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
