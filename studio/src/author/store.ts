// Drafts waiting under their fields, kept in this browser in a database of the Studio's own,
// `inkwyrm-author`, apart from the worlds (docs/bids/worldbuilding/decision.md, *The data*). A
// world's file never carries them; talks and drafts get their own export in W2.
//
// Where the browser has no IndexedDB (tests, some private windows), drafts live in memory for as
// long as the page is open.
import type { Message } from '../../../core/narration/formats.js';
import type { PartTally } from './prompts';
import type { Target } from './shapes';
import { talkId, type Talk } from './talk';

export interface Draft {
  id: string;
  worldId: string;
  recordId: string;
  target: Target;
  // The field as it was when the draft was made. Keep compares it with the field now.
  base: string;
  text: string;
  state: 'ready' | 'needs' | 'unfinished';
  question?: string;
  fault?: string;
  calls: 1 | 2;
  model: string;
  at: number;
  // What was sent, for What this sends.
  sent: Message[];
  parts: PartTally[];
  tokens: number;
}

const DB_NAME = 'inkwyrm-author';
const DB_VERSION = 2;
const memory = new Map<string, Draft>();
const memoryTalks = new Map<string, Talk>();

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      const drafts = db.objectStoreNames.contains('drafts') ? request.transaction!.objectStore('drafts') : db.createObjectStore('drafts', { keyPath: 'id' });
      if (!drafts.indexNames.contains('record')) drafts.createIndex('record', ['worldId', 'recordId']);
      if (!drafts.indexNames.contains('world')) drafts.createIndex('world', 'worldId');
      // Version 2: Errata's talks, one per record.
      if (!db.objectStoreNames.contains('talks')) db.createObjectStore('talks', { keyPath: 'id' }).createIndex('world', 'worldId');
    };
    request.onsuccess = () => resolve(request.result);
    // A browser that refuses storage still drafts; the drafts just don't outlast the page.
    request.onerror = () => resolve(null);
  });
}

async function withStore<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>, name: 'drafts' | 'talks' = 'drafts'): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(name, mode);
      const request = work(transaction.objectStore(name));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error ?? new Error('The draft was not saved.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Saving the draft was interrupted.'));
    });
  } finally {
    db.close();
  }
}

export async function draftsFor(worldId: string, recordId: string): Promise<Draft[]> {
  const stored = await withStore<Draft[]>('readonly', (store) => store.index('record').getAll([worldId, recordId]) as IDBRequest<Draft[]>);
  const list = stored ?? [...memory.values()].filter((draft) => draft.worldId === worldId && draft.recordId === recordId);
  return list.sort((a, b) => a.at - b.at);
}

export async function putDraft(draft: Draft): Promise<void> {
  memory.set(draft.id, draft);
  await withStore('readwrite', (store) => store.put(draft));
}

export async function deleteDraft(id: string): Promise<void> {
  memory.delete(id);
  await withStore('readwrite', (store) => store.delete(id));
}

export async function draftsInWorld(worldId: string): Promise<Draft[]> {
  const stored = await withStore<Draft[]>('readonly', (store) => store.index('world').getAll(worldId) as IDBRequest<Draft[]>);
  return stored ?? [...memory.values()].filter((draft) => draft.worldId === worldId);
}

export async function getTalk(worldId: string, recordId: string): Promise<Talk | null> {
  const id = talkId(worldId, recordId);
  const stored = await withStore<Talk | undefined>('readonly', (store) => store.get(id) as IDBRequest<Talk | undefined>, 'talks');
  return stored ?? memoryTalks.get(id) ?? null;
}

export async function putTalk(talk: Talk): Promise<void> {
  memoryTalks.set(talk.id, talk);
  await withStore('readwrite', (store) => store.put(talk), 'talks');
}

export async function talksInWorld(worldId: string): Promise<Talk[]> {
  const stored = await withStore<Talk[]>('readonly', (store) => store.index('world').getAll(worldId) as IDBRequest<Talk[]>, 'talks');
  return stored ?? [...memoryTalks.values()].filter((talk) => talk.worldId === worldId);
}

// --- Export talks (the owner's answer, Nov 12): a world's talks and waiting drafts in a file of
// their own, `<world>.talks.json`. The world's own export never carries them.

export const TALKS_FORMAT = 'inkwyrm-talks/1';
export interface TalksFile { format: typeof TALKS_FORMAT; worldId: string; worldName: string; talks: Talk[]; drafts: Draft[] }

export async function exportTalks(worldId: string, worldName: string): Promise<TalksFile> {
  const [talks, drafts] = await Promise.all([talksInWorld(worldId), draftsInWorld(worldId)]);
  return { format: TALKS_FORMAT, worldId, worldName, talks, drafts };
}

// Brings a talks file back beside the world it came from. What's already here is kept, never
// overwritten. Says how many came in, or why none did.
export async function importTalks(raw: unknown, worldId: string): Promise<{ ok: true; talks: number; drafts: number } | { ok: false; reason: string }> {
  const file = raw as Partial<TalksFile> | null;
  if (!file || file.format !== TALKS_FORMAT || !Array.isArray(file.talks) || !Array.isArray(file.drafts)) return { ok: false, reason: 'This is not a talks file from the Studio.' };
  if (file.worldId !== worldId) return { ok: false, reason: `These talks belong to ${file.worldName || 'another world'}. Open them inside that world.` };
  const [talks, drafts] = await Promise.all([talksInWorld(worldId), draftsInWorld(worldId)]);
  const haveTalks = new Set(talks.map((talk) => talk.id));
  const haveDrafts = new Set(drafts.map((draft) => draft.id));
  let addedTalks = 0;
  let addedDrafts = 0;
  for (const talk of file.talks) {
    if (!talk || typeof talk.id !== 'string' || haveTalks.has(talk.id) || talk.worldId !== worldId) continue;
    await putTalk({ ...talk, turns: talk.turns ?? [], rounds: talk.rounds ?? [], settled: talk.settled ?? [], asked: talk.asked ?? [] });
    addedTalks += 1;
  }
  for (const draft of file.drafts) {
    if (!draft || typeof draft.id !== 'string' || haveDrafts.has(draft.id) || draft.worldId !== worldId) continue;
    await putDraft(draft);
    addedDrafts += 1;
  }
  return { ok: true, talks: addedTalks, drafts: addedDrafts };
}

// Tests start from nothing.
export function forgetDraftsInMemory(): void {
  memory.clear();
  memoryTalks.clear();
}
