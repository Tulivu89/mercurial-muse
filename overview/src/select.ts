// What the Overview shows, chosen from what this browser holds (docs/front-page/README.md,
// implementation.md *Dashboard selection*). Pure: the stores' reads come in, the panels go out.
//
// Each store is read on its own and can fail on its own: a failed read is never an empty
// library. Nothing here writes, and nothing here calls a model.
import { messageText, type Chat } from '../../core/chat/index.js';
import { KIND_NAMES, type World } from '../../core/records/index.js';
import { chatWithHref, hrefFor, type NavigationV1, type Target } from '../../kit/src/activity';
import { EXAMPLE_ADVENTURES, EXAMPLE_WORLDS, HOUSE_WORLD_ID, IMPORTS_WORLD_ID, type ExampleAdventure, type ExampleWorld } from './examples';

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
}

export interface ContinueItem { label: string; title: string; detail: string; href: string; action: string }
export interface CharacterCard { key: string; name: string; line: string; world: string; tag: 'Recent chat' | 'Included'; excerpt: string; href: string; action: string }
export interface WorldCard {
  key: string; name: string; premise: string; tag: 'Last worked on' | 'Your world' | 'Included'; href: string; action: string;
  detail: string;
  // The world itself, for a personal world's map cover; absent for an example.
  world?: World;
  example?: ExampleWorld;
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
  adventure: AdventureCard | null;
  // Stores that failed, by name, so the page can say which and offer Retry.
  failed: string[];
  loading: boolean;
}

const ready = <T,>(read: Read<T>): T | null => (read.state === 'ready' ? read.value : null);
// The author's own worlds: everything but Errata's house and Chat's imported cards. A copy of an
// example the author brought in counts: they chose to have it.
const isPersonal = (world: World) => world.id !== HOUSE_WORLD_ID && world.id !== IMPORTS_WORLD_ID;
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

// The newest place someone intentionally went that still exists. A target whose store failed is
// skipped without being forgotten.
function resolve(target: Target, library: Library): ContinueItem | null {
  const worlds = ready(library.worlds);
  if (target.kind === 'chat') {
    const chat = ready(library.chats)?.find((entry) => entry.id === target.chatId);
    return chat ? { label: 'Continue', title: chat.characterName || 'Your chat', detail: lastExcerpt(chat) || 'Your last conversation', href: hrefFor(target), action: 'Continue chat' } : null;
  }
  if (target.kind === 'adventure') {
    const save = ready(library.saves)?.find((entry) => entry.id === target.saveId);
    return save ? { label: 'Continue', title: save.name, detail: [save.place, save.stamp].filter(Boolean).join(' · ') || save.moduleName, href: hrefFor(target), action: 'Continue adventure' } : null;
  }
  const world = worlds?.find((entry) => entry.id === target.worldId);
  if (!world) return null;
  const record = target.recordId ? world.records.find((entry) => entry.id === target.recordId) : undefined;
  const at = record ? { ...target } : { kind: 'studio' as const, worldId: world.id };
  const detail = [record ? `${KIND_NAMES[record.kind].one} in ${world.name}` : world.name, writingDetail(ready(library.authoring), world.id, record?.id)].filter(Boolean).join(' · ');
  return { label: 'Continue', title: record?.name ?? world.name, detail, href: hrefFor(at), action: 'Continue writing' };
}

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

  // Characters: recent chats' characters first, one card each, then Errata as included.
  const cards: CharacterCard[] = [];
  const recentChats = [...(chats ?? [])].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const chat of recentChats) {
    const key = `${chat.worldId}/${chat.characterId}`;
    if (cards.some((card) => card.key === key) || cards.length >= 3) continue;
    const world = worlds?.find((entry) => entry.id === chat.worldId);
    const record = world?.records.find((entry) => entry.id === chat.characterId);
    cards.push({
      key, name: chat.characterName || record?.name || 'Character', line: record?.line ?? '', world: world?.name ?? '',
      tag: 'Recent chat', excerpt: lastExcerpt(chat), href: hrefFor({ kind: 'chat', chatId: chat.id }), action: `Continue with ${chat.characterName || 'them'}`,
    });
  }
  const house = worlds?.find((entry) => entry.id === HOUSE_WORLD_ID) ?? library.house;
  const errata = house.records.find((record) => record.kind === 'character');
  if (errata && cards.length < 3 && !cards.some((card) => card.key === `${house.id}/${errata.id}`)) {
    cards.push({ key: `${house.id}/${errata.id}`, name: errata.name, line: errata.line, world: 'Comes with Inkwyrm', tag: 'Included', excerpt: '', href: chatWithHref(house.id, errata.id), action: `Meet ${errata.name}` });
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

  // Adventure: the save last opened, else the newest save, else an included opening.
  const savesByDate = [...(saves ?? [])].sort((a, b) => b.updatedAt - a.updatedAt);
  const opened = library.navigation.recent.map((entry) => entry.target).find((target): target is Extract<Target, { kind: 'adventure' }> => target.kind === 'adventure' && savesByDate.some((save) => save.id === target.saveId));
  const save = opened ? savesByDate.find((entry) => entry.id === opened.saveId) : savesByDate[0];
  const adventure: AdventureCard | null = save
    ? { kind: 'save', tag: opened ? 'Your last adventure' : 'Last saved', name: save.name, moduleName: save.moduleName, place: save.place, stamp: save.stamp, turns: save.turns, href: hrefFor({ kind: 'adventure', saveId: save.id }) }
    : library.saves.state === 'error' ? null : { kind: 'example', example: EXAMPLE_ADVENTURES[0] };

  const first = !continueWith && !(chats?.length) && !(saves?.length) && !personal.length;
  return { first, continueWith, characters: cards, worlds: worldCards, adventure, failed, loading };
}
