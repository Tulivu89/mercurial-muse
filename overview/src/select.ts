// What the Overview shows, chosen from what this browser holds (docs/front-page/README.md,
// implementation.md *Dashboard selection*). Pure: the stores' reads come in, the panels go out.
//
// Each store is read on its own and can fail on its own: a failed read is never an empty
// library. Nothing here writes, and nothing here calls a model.
import { homeKey, homesOf, messageText, roomsOf, whereabouts, type Chat, type HomeRef, type Life } from '../../core/chat/index.js';
import { KIND_NAMES, type World } from '../../core/records/index.js';
import { chatWithHref, homeHref, hrefFor, type NavigationV1, type Target } from '../../kit/src/activity';
import { EXAMPLE_ADVENTURES, EXAMPLE_HOMES, EXAMPLE_WORLDS, HOUSE_WORLD_ID, IMPORTS_WORLD_ID, type ExampleAdventure, type ExampleWorld } from './examples';
import { ERRATA_ID } from '../../kit/src/included';
import { characterKey, collectionCharacters, EMPTY_COLLECTION, type Collection, type Member } from '../../kit/src/collection';

export type Read<T> = { state: 'loading' } | { state: 'ready'; value: T } | { state: 'error'; message: string };

// What a save says about itself, without opening it.
export interface SaveSummary { id: string; name: string; moduleName: string; place: string; stamp: string; turns: number; updatedAt: number }
// Per world, per record: drafts waiting and lines settled with Errata.
export type Authoring = Record<string, Record<string, { drafts: number; settled: number }>>;

export interface Library {
  worlds: Read<World[]>;
  chats: Read<Chat[]>;
  saves: Read<SaveSummary[]>;
  authoring: Read<Authoring>;
  navigation: NavigationV1;
  // Errata as she comes with the site, for a browser where Chat hasn't put her in yet.
  house: World;
  collection?: Collection;
  // Each character's own day, for who is where at home. Absent or unread, everyone is on their
  // card's own clock.
  lives?: Read<Record<string, Life>>;
  // The device's time, for where the people of a home are now.
  now?: number;
}

export interface ContinueItem { label: string; title: string; detail: string; href: string; action: string }
export interface CharacterCard { key: string; name: string; line: string; world: string; tag: 'Recent chat' | 'Included' | 'Favorite' | 'In your collection'; excerpt: string; href: string; action: string; owner?: string; member?: Member }
export interface WorldCard {
  key: string; name: string; premise: string; tag: 'Last worked on' | 'Your world' | 'Included'; href: string; action: string;
  detail: string;
  // The world itself, for a personal world's map cover; absent for an example.
  world?: World;
  example?: ExampleWorld;
}
export interface HomeCard {
  key: string; name: string; world: string; line: string; tag: 'Last visited' | 'Your home' | 'Included';
  // Who is in, and what each is doing, a few at most.
  people: { name: string; says: string }[];
  more: number;
  href: string; action: string;
  // Where the home's pictures are kept, and its rooms' slots in order, for a cover.
  owner?: string; slots?: string[];
}
export type AdventureCard =
  | { kind: 'save'; tag: 'Your last adventure' | 'Last saved'; name: string; moduleName: string; place: string; stamp: string; turns: number; href: string }
  | { kind: 'example'; example: ExampleAdventure };

export interface Overview {
  // A first visit: nothing personal in any store that could be read.
  first: boolean;
  continueWith: ContinueItem | null;
  characters: CharacterCard[];
  worlds: WorldCard[];
  homes: HomeCard[];
  adventure: AdventureCard | null;
  // Stores that failed, by name, so the page can say which and offer Retry.
  failed: string[];
  loading: boolean;
}

const ready = <T,>(read: Read<T>): T | null => (read.state === 'ready' ? read.value : null);
// The author's own worlds: everything but Errata's house and Chat's imported cards. A copy of an
// example the author brought in counts: they chose to have it.
// A household is for Chat: its house is under Homes, and it is never a world to play.
const isPersonal = (world: World) => world.id !== HOUSE_WORLD_ID && world.id !== IMPORTS_WORLD_ID && world.use !== 'household';
const plural = (count: number, one: string) => `${count} ${one}${count === 1 ? '' : 's'}`;

function writingDetail(authoring: Authoring | null, worldId: string, recordId?: string): string {
  const counts = authoring?.[worldId];
  if (!counts) return '';
  const pick = recordId ? [counts[recordId]].filter(Boolean) : Object.values(counts);
  const drafts = pick.reduce((sum, entry) => sum + (entry?.drafts ?? 0), 0);
  const settled = pick.reduce((sum, entry) => sum + (entry?.settled ?? 0), 0);
  return [drafts ? `${plural(drafts, 'draft')} waiting` : '', settled ? `${settled} settled` : ''].filter(Boolean).join(' · ');
}

function lastExcerpt(chat: Chat): string {
  for (let index = chat.messages.length - 1; index >= 0; index -= 1) {
    const text = messageText(chat.messages[index]!).replace(/[*_]/g, '').replace(/\s+/g, ' ').trim();
    if (text) return text.length > 140 ? `${text.slice(0, 137).trimEnd()}…` : text;
  }
  return '';
}

// A schedule line as a visitor reads it: the macros filled in, the player as "you".
const said = (text: string, name: string) => text.replace(/\{\{user\}\}|\$u(?:ser)?\b/gi, 'you').replace(/\{\{char\}\}|\$c(?:ontact)?\b/gi, name).trim();

function homeCard(home: HomeRef, tag: HomeCard['tag'], lives: Record<string, Life>, now: number, href: string, action: string): HomeCard {
  const people = whereabouts(home, lives, now);
  return {
    key: homeKey(home.world.id, home.scenario.id), name: home.scenario.name, world: home.world.name, line: home.scenario.line || home.world.premise.trim(), tag,
    people: people.slice(0, 3).map((entry) => ({ name: entry.record.name, says: entry.hidden ? 'Somewhere private' : [entry.room || 'Out', said(entry.doing, entry.record.name)].filter(Boolean).join(' · ') })),
    more: Math.max(0, people.length - 3), href, action,
    owner: `${home.world.id}:${home.scenario.id}`, slots: (roomsOf(home.scenario)?.members ?? []).map((member) => `room:${member.id}`),
  };
}

// The newest place someone intentionally went that still exists. A target whose store failed is
// skipped without being forgotten.
function resolve(target: Target, library: Library): ContinueItem | null {
  const worlds = ready(library.worlds);
  if (target.kind === 'chat') {
    const chat = ready(library.chats)?.find((entry) => entry.id === target.chatId);
    const member = chat ? library.collection?.members[characterKey(chat.worldId, chat.characterId)] : undefined;
    if (member && member.state !== 'active') return null;
    return chat ? { label: 'Continue', title: chat.characterName || 'Your chat', detail: lastExcerpt(chat) || 'Your last conversation', href: hrefFor(target), action: 'Continue chat' } : null;
  }
  if (target.kind === 'adventure') {
    const save = ready(library.saves)?.find((entry) => entry.id === target.saveId);
    return save ? { label: 'Continue', title: save.name, detail: [save.place, save.stamp].filter(Boolean).join(' · ') || save.moduleName, href: hrefFor(target), action: 'Continue adventure' } : null;
  }
  if (target.kind === 'home') {
    const home = homesOf(worlds ?? []).find((entry) => entry.world.id === target.worldId && entry.scenario.id === target.scenarioId);
    if (!home) return null;
    const first = whereabouts(home, ready(library.lives ?? { state: 'loading' }) ?? {}, library.now ?? Date.now()).find((entry) => !entry.hidden && entry.doing);
    return { label: 'Continue', title: home.scenario.name, detail: first ? `${first.record.name}: ${said(first.doing, first.record.name)}` : home.world.name, href: hrefFor(target), action: 'Open home' };
  }
  const world = worlds?.find((entry) => entry.id === target.worldId);
  if (!world) return null;
  const record = target.recordId ? world.records.find((entry) => entry.id === target.recordId) : undefined;
  const at = record ? { ...target } : { kind: 'studio' as const, worldId: world.id };
  const detail = [record ? `${KIND_NAMES[record.kind].one} in ${world.name}` : world.name, writingDetail(ready(library.authoring), world.id, record?.id)].filter(Boolean).join(' · ');
  return { label: 'Continue', title: record?.name ?? world.name, detail, href: hrefFor(at), action: 'Continue writing' };
}

const INCLUDED_HOME_WORLDS = new Set(EXAMPLE_HOMES.map((home) => home.worldId));

export function selectOverview(library: Library): Overview {
  const worlds = ready(library.worlds);
  const chats = ready(library.chats);
  const saves = ready(library.saves);
  const authoring = ready(library.authoring);
  const failed = [
    library.worlds.state === 'error' ? 'worlds' : '', library.chats.state === 'error' ? 'chats' : '',
    library.saves.state === 'error' ? 'saved games' : '', library.authoring.state === 'error' ? 'drafts' : '',
  ].filter(Boolean);
  const loading = [library.worlds, library.chats, library.saves].some((read) => read.state === 'loading');

  // Continue: the newest intentional open that resolves.
  let continueWith: ContinueItem | null = null;
  for (const entry of library.navigation.recent) {
    continueWith = resolve(entry.target, library);
    if (continueWith) break;
  }

  // The same curated membership used by Chat. World NPCs never fill this panel by accident.
  const cards: CharacterCard[] = [];
  const curated = library.collection ?? EMPTY_COLLECTION;
  const house = worlds?.find((entry) => entry.id === HOUSE_WORLD_ID) ?? library.house;
  const available = [...(worlds ?? [])];
  // A fresh visitor can meet the bundled muse before Chat has seeded her. Once a collection
  // exists, a missing stored house is a deletion, not permission to advertise a broken target.
  if (!curated.initialized && !available.some((world) => world.id === house.id)) available.push(house);
  // Recent chats first; then the house's Errata, who is the site's face; then the rest as Chat orders them.
  const rank = (entry: { world: World; record: { id: string }; chat?: unknown }) => (entry.chat ? 0 : entry.world.id === HOUSE_WORLD_ID && entry.record.id === ERRATA_ID ? 1 : 2);
  const listed = [...collectionCharacters(available, chats ?? [], curated)].sort((a, b) => rank(a) - rank(b));
  for (const { world, record, member, chat } of listed.slice(0, 3)) {
    const key = `${world.id}/${record.id}`;
    cards.push({
      key, name: record.name, line: record.line, world: world.name, owner: `${world.id}:${record.id}`, member,
      tag: member.favorite ? 'Favorite' : chat ? 'Recent chat' : world.id === HOUSE_WORLD_ID ? 'Included' : 'In your collection',
      excerpt: chat ? lastExcerpt(chat) : '', href: chat ? hrefFor({ kind: 'chat', chatId: chat.id }) : chatWithHref(world.id, record.id), action: chat ? `Continue with ${record.name}` : `Meet ${record.name}`,
    });
  }

  // Worlds: the one last worked on, then the newest of the author's own, then the examples.
  const personal = (worlds ?? []).filter(isPersonal).sort((a, b) => b.updatedAt - a.updatedAt);
  const studioRecent = library.navigation.recent.find((entry) => entry.target.kind === 'studio' && personal.some((world) => world.id === (entry.target as { worldId: string }).worldId))?.target as Extract<Target, { kind: 'studio' }> | undefined;
  const lead = studioRecent ? personal.find((world) => world.id === studioRecent.worldId) : undefined;
  const ordered = lead ? [lead, ...personal.filter((world) => world.id !== lead.id)] : personal;
  const worldCards: WorldCard[] = ordered.slice(0, 2).map((world) => {
    const isLead = world.id === lead?.id;
    const record = isLead && studioRecent?.recordId ? world.records.find((entry) => entry.id === studioRecent.recordId) : undefined;
    // Drafts waiting send the author back to Errata's door on the record that has them.
    const waiting = authoring?.[world.id] ? Object.entries(authoring[world.id]).find(([, counts]) => counts.drafts > 0)?.[0] : undefined;
    const at: Target = record
      ? { kind: 'studio', worldId: world.id, recordId: record.id, ...(studioRecent?.door ? { door: studioRecent.door } : {}) }
      : waiting && world.records.some((entry) => entry.id === waiting) ? { kind: 'studio', worldId: world.id, recordId: waiting, door: 'errata' } : { kind: 'studio', worldId: world.id };
    const name = (id?: string) => world.records.find((entry) => entry.id === id)?.name;
    const where = at.recordId ? name(at.recordId) : undefined;
    const counts = writingDetail(authoring, world.id, at.recordId);
    return {
      key: world.id, name: world.name, premise: world.premise.trim(), tag: isLead ? 'Last worked on' : 'Your world', world,
      href: hrefFor(at), action: where ? 'Continue writing' : 'Open in the Studio',
      detail: [where ? `${where}` : `${plural(world.records.length, 'record')}`, counts].filter(Boolean).join(' · '),
    };
  });
  for (const example of EXAMPLE_WORLDS) {
    if (worldCards.length >= 2) break;
    if (worldCards.some((card) => card.key === example.worldId)) continue;
    worldCards.push({ key: example.worldId, name: example.name, premise: example.line, tag: 'Included', href: example.href, action: 'Look inside', detail: example.note, example });
  }

  // Homes: the one last visited, then the rest of this browser's, then what comes with the site.
  // A first visit sees the resort's house before Chat has put it in; after that, a home that is
  // not here is offered from Chat's own list, which is where it is brought in.
  const lives = ready(library.lives ?? { state: 'loading' }) ?? {};
  const now = library.now ?? Date.now();
  const here = homesOf(worlds ?? []);
  const visited = library.navigation.recent.map((entry) => entry.target).find((target): target is Extract<Target, { kind: 'home' }> => target.kind === 'home' && here.some((home) => home.world.id === target.worldId && home.scenario.id === target.scenarioId));
  const byUse = [...here].sort((a, b) => Number(b.world.id === visited?.worldId && b.scenario.id === visited?.scenarioId) - Number(a.world.id === visited?.worldId && a.scenario.id === visited?.scenarioId) || b.world.updatedAt - a.world.updatedAt);
  const homeCards: HomeCard[] = byUse.slice(0, 2).map((home) => homeCard(
    home, visited && home.world.id === visited.worldId && home.scenario.id === visited.scenarioId ? 'Last visited' : INCLUDED_HOME_WORLDS.has(home.world.id) ? 'Included' : 'Your home',
    lives, now, homeHref(home.world.id, home.scenario.id), 'Open home',
  ));
  for (const example of EXAMPLE_HOMES) {
    if (homeCards.length >= 2) break;
    if (here.some((home) => home.world.id === example.worldId)) continue;
    const bundled = !curated.initialized && example.worldId === library.house.id ? homesOf([library.house]).find((home) => home.scenario.id === example.scenarioId) : undefined;
    homeCards.push(bundled
      ? homeCard(bundled, 'Included', lives, now, homeHref(example.worldId, example.scenarioId), 'Open home')
      : { key: homeKey(example.worldId, example.scenarioId), name: example.name, world: example.world, line: example.line, tag: 'Included', people: [{ name: example.who, says: 'Not in this browser yet' }], more: 0, href: '/chat/#/home', action: 'Bring it in from Homes' });
  }

  // Adventure: the save last opened, else the newest save, else an included opening.
  const savesByDate = [...(saves ?? [])].sort((a, b) => b.updatedAt - a.updatedAt);
  const opened = library.navigation.recent.map((entry) => entry.target).find((target): target is Extract<Target, { kind: 'adventure' }> => target.kind === 'adventure' && savesByDate.some((save) => save.id === target.saveId));
  const save = opened ? savesByDate.find((entry) => entry.id === opened.saveId) : savesByDate[0];
  const adventure: AdventureCard | null = save
    ? { kind: 'save', tag: opened ? 'Your last adventure' : 'Last saved', name: save.name, moduleName: save.moduleName, place: save.place, stamp: save.stamp, turns: save.turns, href: hrefFor({ kind: 'adventure', saveId: save.id }) }
    : library.saves.state === 'error' ? null : { kind: 'example', example: EXAMPLE_ADVENTURES[0] };

  const first = !continueWith && !(chats?.length) && !(saves?.length) && !personal.length;
  return { first, continueWith, characters: cards, worlds: worldCards, homes: homeCards, adventure, failed, loading };
}
