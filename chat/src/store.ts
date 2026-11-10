// Chats live in this browser's IndexedDB, beside the Studio's worlds and never on the server.
// Portraits (an avatar and up to 24 emotion pictures per character) are kept here too, since
// records hold no images. A chat file or a Back up everything file is the backup.
import { BACKUP_FORMAT, parseChat, parseLife, type Chat, type Life } from '../../core/chat/index.js';
import { parseWorld, type World } from '../../core/records/index.js';
import { listWorlds, putWorld } from '../../kit/src/worlds';

const DB_NAME = 'inkwyrm-chat';
const DB_VERSION = 2;
const STORES = ['chats', 'portraits', 'sent', 'lives'] as const;
type Store = (typeof STORES)[number];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('This browser cannot store chats.')); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('chats')) db.createObjectStore('chats', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('portraits')) db.createObjectStore('portraits', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('sent')) db.createObjectStore('sent', { keyPath: 'chatId' });
      if (!db.objectStoreNames.contains('lives')) db.createObjectStore('lives', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open your chats.'));
  });
}

async function run<T>(store: Store, mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(store, mode);
      const request = work(transaction.objectStore(store));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error ?? new Error('Saving failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Saving was interrupted.'));
    });
  } finally {
    db.close();
  }
}

// Chats that no longer read as chats are left out rather than breaking the list.
export async function listChats(): Promise<Chat[]> {
  const raw = await run<unknown[]>('chats', 'readonly', (store) => store.getAll() as IDBRequest<unknown[]>);
  return raw.flatMap((entry) => { const read = parseChat(entry); return read.ok ? [read.chat] : []; }).sort((a, b) => b.updatedAt - a.updatedAt);
}
export const putChat = (chat: Chat) => run('chats', 'readwrite', (store) => store.put(chat));
export async function deleteChat(id: string): Promise<void> {
  await run('chats', 'readwrite', (store) => store.delete(id));
  await run('sent', 'readwrite', (store) => store.delete(id)).catch(() => undefined);
}

// --- Lives: a character's day (Home), one per character on this device.

export async function listLives(): Promise<Record<string, Life>> {
  const raw = await run<unknown[]>('lives', 'readonly', (store) => store.getAll() as IDBRequest<unknown[]>);
  const out: Record<string, Life> = {};
  for (const entry of raw) { const life = parseLife(entry); if (life) out[life.key] = life; }
  return out;
}
export const putLife = (life: Life) => run('lives', 'readwrite', (store) => store.put(life));

// Home keeps its pictures beside the portraits: a room's picture and layers under the scenario,
// a character's figures under the character.
export const roomSlot = (memberId: string) => `room:${memberId}`;
export const layerSlot = (memberId: string, layerId: string) => `layer:${memberId}:${layerId}`;
export const figureSlot = (figureId: string) => `fig:${figureId}`;

// --- Portraits. A character's pictures, by slot: "avatar" or one of the 24 emotions.

export interface Portrait { key: string; owner: string; slot: string; data: string }
export type PortraitSet = Record<string, string>;
export const portraitOwner = (worldId: string, recordId: string) => `${worldId}:${recordId}`;

export async function allPortraits(): Promise<Portrait[]> {
  return run<Portrait[]>('portraits', 'readonly', (store) => store.getAll() as IDBRequest<Portrait[]>);
}
export function portraitSets(portraits: Portrait[]): Record<string, PortraitSet> {
  const sets: Record<string, PortraitSet> = {};
  for (const portrait of portraits) (sets[portrait.owner] ??= {})[portrait.slot] = portrait.data;
  return sets;
}
export const putPortrait = (owner: string, slot: string, data: string) => run('portraits', 'readwrite', (store) => store.put({ key: `${owner}:${slot}`, owner, slot, data }));
export const deletePortrait = (owner: string, slot: string) => run('portraits', 'readwrite', (store) => store.delete(`${owner}:${slot}`));

// --- What was sent for a chat's last reply, kept so it is still there after a reload.

export interface Sent {
  chatId: string;
  at: number;
  profile: string;
  request: unknown;
  parts: { label: string; tokens: number }[];
  tokens: number;
  notes: string[];
  reply: string;
  diagnostics: unknown;
  error?: string;
}
export const putSent = (sent: Sent) => run('sent', 'readwrite', (store) => store.put(sent));
export const getSent = (chatId: string) => run<Sent | undefined>('sent', 'readonly', (store) => store.get(chatId) as IDBRequest<Sent | undefined>);

// --- Back up everything: every world, chat and portrait in this browser, as one file.

export interface Backup { format: typeof BACKUP_FORMAT; at: number; worlds: World[]; chats: Chat[]; portraits: Portrait[]; lives?: Life[] }

export async function makeBackup(now: number): Promise<Backup> {
  return { format: BACKUP_FORMAT, at: now, worlds: await listWorlds(), chats: await listChats(), portraits: await allPortraits(), lives: Object.values(await listLives()) };
}

// Puts a backup's contents into this browser. Anything with the same id is replaced.
export async function restoreBackup(raw: unknown): Promise<{ worlds: number; chats: number; portraits: number }> {
  const top = raw && typeof raw === 'object' ? raw as Partial<Backup> : {};
  if (top.format !== BACKUP_FORMAT) throw new Error('This is not a Back up everything file from Inkwyrm.');
  const counts = { worlds: 0, chats: 0, portraits: 0 };
  for (const entry of Array.isArray(top.worlds) ? top.worlds : []) {
    const read = parseWorld(entry);
    if (read.ok) { await putWorld(read.world); counts.worlds += 1; }
  }
  for (const entry of Array.isArray(top.chats) ? top.chats : []) {
    const read = parseChat(entry);
    if (read.ok) { await putChat(read.chat); counts.chats += 1; }
  }
  for (const entry of Array.isArray(top.portraits) ? top.portraits : []) {
    if (entry && typeof entry.owner === 'string' && typeof entry.slot === 'string' && typeof entry.data === 'string' && entry.data.startsWith('data:image/')) {
      await putPortrait(entry.owner, entry.slot, entry.data);
      counts.portraits += 1;
    }
  }
  for (const entry of Array.isArray(top.lives) ? top.lives : []) { const life = parseLife(entry); if (life) await putLife(life); }
  return counts;
}
