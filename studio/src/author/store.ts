// Drafts waiting under their fields, kept in this browser in a database of the Studio's own,
// `inkwyrm-author`, apart from the worlds (docs/bids/worldbuilding/decision.md, *The data*). A
// world's file never carries them; talks and drafts get their own export in W2.
//
// Where the browser has no IndexedDB (tests, some private windows), drafts live in memory for as
// long as the page is open.
import type { Message } from '../../../core/narration/formats.js';
import type { PartTally } from './prompts';
import type { Target } from './shapes';

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
const DB_VERSION = 1;
const memory = new Map<string, Draft>();

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts', { keyPath: 'id' }).createIndex('record', ['worldId', 'recordId']);
    };
    request.onsuccess = () => resolve(request.result);
    // A browser that refuses storage still drafts; the drafts just don't outlast the page.
    request.onerror = () => resolve(null);
  });
}

async function withStore<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction('drafts', mode);
      const request = work(transaction.objectStore('drafts'));
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

// Tests start from nothing.
export function forgetDraftsInMemory(): void {
  memory.clear();
}
