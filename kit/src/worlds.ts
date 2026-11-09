// Worlds live in this browser's IndexedDB. Nothing goes to the server; a world file is the backup.
// The Studio writes them and Chat reads them from the same store.
import { parseWorld, type World } from '../../core/records/index.js';

const DB_NAME = 'inkwyrm-studio';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('This browser cannot store worlds.')); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('worlds')) request.result.createObjectStore('worlds', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open your worlds.'));
  });
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction('worlds', mode);
      const request = work(transaction.objectStore('worlds'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error ?? new Error('Saving failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Saving was interrupted.'));
    });
  } finally {
    db.close();
  }
}

// Worlds that no longer read as worlds are left out rather than breaking the list.
export async function listWorlds(): Promise<World[]> {
  const raw = await run<unknown[]>('readonly', (store) => store.getAll() as IDBRequest<unknown[]>);
  return raw.flatMap((entry) => {
    const read = parseWorld(entry);
    return read.ok ? [read.world] : [];
  }).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function putWorld(world: World): Promise<IDBValidKey> {
  return run('readwrite', (store) => store.put(world));
}

export function deleteWorld(id: string): Promise<undefined> {
  return run('readwrite', (store) => store.delete(id));
}
