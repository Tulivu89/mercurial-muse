// Personal Chat curation. Character identity and canon remain in the world; these choices
// never reach a model. Overview uses the same membership reader as Chat.
import { useMemo, useSyncExternalStore } from 'react';
import type { World, StoryRecord } from '../../core/records/index.js';

export const COLLECTION_KEY = 'inkwyrm.chat.collection.v1';
const CHANGED = 'inkwyrm-collection-change';
export type Membership = 'active' | 'archived' | 'hidden';
export type ImageMotion = 'still' | 'selected' | 'visible';
export interface Member {
  state: Membership;
  favorite: boolean;
  shelves: string[];
  order: number;
  fit: 'cover' | 'contain';
  x: number;
  y: number;
  lastChatId?: string;
}
export interface Collection {
  version: 1;
  initialized: boolean;
  title: string;
  members: Record<string, Member>;
  shelves: { id: string; name: string }[];
  display: {
    size: 'comfortable' | 'compact' | 'large';
    layout: 'gallery' | 'list';
    sort: 'manual' | 'name' | 'recent';
    motion: ImageMotion;
    shelf: string;
    descriptions: boolean;
    worlds: boolean;
  };
}
export interface ChatRef {
  id: string;
  worldId: string;
  characterId: string;
  updatedAt: number;
}
export const characterKey = (worldId: string, recordId: string) => JSON.stringify([worldId, recordId]);
export const EMPTY_COLLECTION: Collection = {
  version: 1,
  initialized: false,
  title: 'Your collection',
  members: {},
  shelves: [],
  display: {
    size: 'comfortable',
    layout: 'gallery',
    sort: 'manual',
    motion: 'selected',
    shelf: 'all',
    descriptions: true,
    worlds: true,
  },
};
export const freshMember = (order = 0): Member => ({
  state: 'active',
  favorite: false,
  shelves: [],
  order,
  fit: 'cover',
  x: 50,
  y: 35,
});
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const clamp = (v: unknown, fallback: number, max = 100) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, v)) : fallback;

export function parseCollection(raw: unknown): Collection {
  const top = object(raw);
  if (top.version !== 1) return EMPTY_COLLECTION;
  const shelves = (Array.isArray(top.shelves) ? top.shelves : [])
    .slice(0, 100)
    .flatMap((v) => {
      const entry = object(v);
      return typeof entry.id === 'string' &&
        entry.id.length <= 100 &&
        typeof entry.name === 'string' &&
        entry.name.trim()
        ? [{ id: entry.id, name: entry.name.trim().slice(0, 80) }]
        : [];
    })
    .filter((s, i, all) => all.findIndex((e) => e.id === s.id) === i);
  const members: Record<string, Member> = {};
  for (const [key, value] of Object.entries(object(top.members)).slice(0, 10000)) {
    let ids: unknown;
    try {
      ids = JSON.parse(key);
    } catch {
      continue;
    }
    if (
      !Array.isArray(ids) ||
      ids.length !== 2 ||
      !ids.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 200)
    )
      continue;
    const m = object(value);
    members[key] = {
      state: m.state === 'hidden' || m.state === 'archived' ? m.state : 'active',
      favorite: m.favorite === true,
      shelves: Array.isArray(m.shelves)
        ? [
            ...new Set(
              m.shelves.filter(
                (id): id is string => typeof id === 'string' && shelves.some((s) => s.id === id),
              ),
            ),
          ]
        : [],
      order: clamp(m.order, 0, 100000),
      fit: m.fit === 'contain' ? 'contain' : 'cover',
      x: clamp(m.x, 50),
      y: clamp(m.y, 35),
      ...(typeof m.lastChatId === 'string' && m.lastChatId.length <= 200 ? { lastChatId: m.lastChatId } : {}),
    };
  }
  const d = object(top.display);
  return {
    version: 1,
    initialized: top.initialized === true,
    title:
      typeof top.title === 'string' && top.title.trim() ? top.title.trim().slice(0, 80) : 'Your collection',
    members,
    shelves,
    display: {
      size: d.size === 'compact' || d.size === 'large' ? d.size : 'comfortable',
      layout: d.layout === 'list' ? 'list' : 'gallery',
      sort: d.sort === 'name' || d.sort === 'recent' ? d.sort : 'manual',
      motion: d.motion === 'still' || d.motion === 'visible' ? d.motion : 'selected',
      shelf:
        typeof d.shelf === 'string' &&
        ['all', 'favorites', 'archived', ...shelves.map((s) => s.id)].includes(d.shelf)
          ? d.shelf
          : 'all',
      descriptions: d.descriptions !== false,
      worlds: d.worlds !== false,
    },
  };
}

let temporary: string | undefined;
const snapshot = () => {
  if (temporary !== undefined) return temporary;
  try {
    return localStorage.getItem(COLLECTION_KEY) ?? '';
  } catch {
    return '';
  }
};
export function loadCollection(): Collection {
  try {
    return parseCollection(JSON.parse(snapshot() || 'null'));
  } catch {
    return EMPTY_COLLECTION;
  }
}
export function saveCollection(value: Collection): void {
  const raw = JSON.stringify(parseCollection(value));
  let error = false;
  try {
    localStorage.setItem(COLLECTION_KEY, raw);
    temporary = undefined;
  } catch {
    temporary = raw;
    error = true;
  }
  window.dispatchEvent(new Event(CHANGED));
  if (error)
    throw new Error(
      'Collection changes are kept for this visit only. This browser could not save them; export a backup before leaving.',
    );
}
const subscribe = (listener: () => void) => {
  window.addEventListener(CHANGED, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(CHANGED, listener);
    window.removeEventListener('storage', listener);
  };
};
export function useCollection(): Collection {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '');
  return useMemo(() => {
    try {
      return parseCollection(JSON.parse(raw || 'null'));
    } catch {
      return EMPTY_COLLECTION;
    }
  }, [raw]);
}

export function memberFor(
  collection: Collection,
  world: World,
  record: StoryRecord,
  chats: readonly ChatRef[] = [],
): Member | null {
  const saved = collection.members[characterKey(world.id, record.id)];
  if (saved) return saved;
  if (
    record.chatListed === true ||
    world.id === 'inkwyrm-imports' ||
    (!collection.initialized &&
      chats.some((chat) => chat.worldId === world.id && chat.characterId === record.id))
  )
    return freshMember();
  return null;
}
// Run once after both successful library reads; later one-off chats do not re-enroll NPCs.
export function initializeCollection(
  collection: Collection,
  worlds: readonly World[],
  chats: readonly ChatRef[],
): Collection {
  if (collection.initialized) return collection;
  const members = { ...collection.members };
  let order = Object.keys(members).length;
  for (const world of worlds)
    for (const record of world.records.filter((r) => r.kind === 'character')) {
      const key = characterKey(world.id, record.id);
      if (!members[key] && memberFor(collection, world, record, chats)) members[key] = freshMember(order++);
    }
  return { ...collection, initialized: true, members };
}
export function patchMember(
  collection: Collection,
  worldId: string,
  recordId: string,
  patch: Partial<Member>,
): Collection {
  const key = characterKey(worldId, recordId);
  return {
    ...collection,
    members: {
      ...collection.members,
      [key]: { ...freshMember(Object.keys(collection.members).length), ...collection.members[key], ...patch },
    },
  };
}
export function latestChat<T extends ChatRef>(
  chats: readonly T[],
  worldId: string,
  recordId: string,
  member?: Member | null,
): T | undefined {
  const own = chats.filter((chat) => chat.worldId === worldId && chat.characterId === recordId);
  return (
    own.find((chat) => chat.id === member?.lastChatId) ??
    [...own].sort((a, b) => b.updatedAt - a.updatedAt)[0]
  );
}
export function collectionCharacters<T extends ChatRef>(
  worlds: readonly World[],
  chats: readonly T[],
  collection: Collection,
) {
  return worlds
    .flatMap((world) =>
      world.records
        .filter((record) => record.kind === 'character')
        .flatMap((record) => {
          const member = memberFor(collection, world, record, chats);
          return member?.state === 'active'
            ? [{ world, record, member, chat: latestChat(chats, world.id, record.id, member) }]
            : [];
        }),
    )
    .sort((a, b) => {
      if (collection.display.sort === 'name') return a.record.name.localeCompare(b.record.name);
      if (collection.display.sort === 'recent')
        return (
          (b.chat?.updatedAt ?? 0) - (a.chat?.updatedAt ?? 0) || a.record.name.localeCompare(b.record.name)
        );
      return (
        Number(b.member.favorite) - Number(a.member.favorite) ||
        a.member.order - b.member.order ||
        a.record.name.localeCompare(b.record.name)
      );
    });
}
