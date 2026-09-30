/**
 * AppDatabase: Typed client-side storage engine built on native IndexedDB.
 * Provides resilient persistence for tool drafts, calculation history, and
 * temporary binary blobs (Blob Vault) with automatic TTL eviction and Safari Private mode fallback.
 */

export interface ToolDraft<T = unknown> {
  toolSlug: string;
  state: T;
  updatedAt: number;
  isDirty: boolean;
}

export interface ToolHistoryItem<T = unknown> {
  id?: number;
  toolSlug: string;
  timestamp: number;
  summary: string;
  data: T;
}

export interface BlobVaultEntry {
  id: string;
  blob: Blob;
  mimeType: string;
  name: string;
  createdAt: number;
  expiresAt: number;
}

const DB_NAME = 'rc_web_app_db';
const DB_VERSION = 1;
const STORE_DRAFTS = 'tool_drafts';
const STORE_HISTORY = 'tool_history';
const STORE_BLOB_VAULT = 'blob_vault';

const DEFAULT_BLOB_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class MemoryStorageFallback {
  private drafts = new Map<string, ToolDraft>();
  private history = new Map<string, ToolHistoryItem[]>();
  private blobs = new Map<string, BlobVaultEntry>();

  saveDraft(slug: string, state: unknown): void {
    this.drafts.set(slug, {
      toolSlug: slug,
      state,
      updatedAt: Date.now(),
      isDirty: true,
    });
  }

  getDraft<T>(slug: string): ToolDraft<T> | null {
    return (this.drafts.get(slug) as ToolDraft<T>) || null;
  }

  deleteDraft(slug: string): void {
    this.drafts.delete(slug);
  }

  addHistory(slug: string, summary: string, data: unknown, limit = 30): void {
    const list = this.history.get(slug) || [];
    list.unshift({
      id: Date.now(),
      toolSlug: slug,
      timestamp: Date.now(),
      summary,
      data,
    });
    if (list.length > limit) list.splice(limit);
    this.history.set(slug, list);
  }

  getHistory<T>(slug: string, limit = 30): ToolHistoryItem<T>[] {
    const list = (this.history.get(slug) as ToolHistoryItem<T>[]) || [];
    return list.slice(0, limit);
  }

  clearHistory(slug: string): void {
    this.history.delete(slug);
  }

  storeBlob(id: string, entry: BlobVaultEntry): void {
    this.blobs.set(id, entry);
  }

  getBlob(id: string): BlobVaultEntry | null {
    const entry = this.blobs.get(id);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.blobs.delete(id);
      return null;
    }
    return entry;
  }

  deleteBlob(id: string): void {
    this.blobs.delete(id);
  }
}

const memoryFallback = new MemoryStorageFallback();

function isIndexedDbAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!window.indexedDB;
  } catch {
    return false;
  }
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      return reject(new Error('IndexedDB unavailable'));
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
          db.createObjectStore(STORE_DRAFTS, { keyPath: 'toolSlug' });
        }

        if (!db.objectStoreNames.contains(STORE_HISTORY)) {
          const histStore = db.createObjectStore(STORE_HISTORY, { keyPath: 'id', autoIncrement: true });
          histStore.createIndex('by_slug', 'toolSlug', { unique: false });
          histStore.createIndex('by_timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_BLOB_VAULT)) {
          const vaultStore = db.createObjectStore(STORE_BLOB_VAULT, { keyPath: 'id' });
          vaultStore.createIndex('by_expiresAt', 'expiresAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    } catch (err) {
      dbPromise = null;
      reject(err);
    }
  });

  return dbPromise;
}

export const AppDatabase = {
  async saveDraft<T>(toolSlug: string, state: T): Promise<void> {
    try {
      const db = await getDb();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readwrite');
        const store = tx.objectStore(STORE_DRAFTS);
        const record: ToolDraft<T> = {
          toolSlug,
          state,
          updatedAt: Date.now(),
          isDirty: true,
        };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      memoryFallback.saveDraft(toolSlug, state);
    }
  },

  async getDraft<T>(toolSlug: string): Promise<ToolDraft<T> | null> {
    try {
      const db = await getDb();
      return new Promise<ToolDraft<T> | null>((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readonly');
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.get(toolSlug);
        req.onsuccess = () => resolve((req.result as ToolDraft<T>) || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return memoryFallback.getDraft<T>(toolSlug);
    }
  },

  async deleteDraft(toolSlug: string): Promise<void> {
    try {
      const db = await getDb();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readwrite');
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.delete(toolSlug);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      memoryFallback.deleteDraft(toolSlug);
    }
  },

  async addHistory<T>(toolSlug: string, summary: string, data: T, maxItems = 30): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction(STORE_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_HISTORY);
      const index = store.index('by_slug');

      // Add new item
      const item: ToolHistoryItem<T> = {
        toolSlug,
        timestamp: Date.now(),
        summary,
        data,
      };
      store.add(item);

      // Prune beyond limit
      const req = index.getAll(IDBKeyRange.only(toolSlug));
      req.onsuccess = () => {
        const records = (req.result as ToolHistoryItem<T>[]).sort((a, b) => b.timestamp - a.timestamp);
        if (records.length > maxItems) {
          const toDelete = records.slice(maxItems);
          for (const extra of toDelete) {
            if (extra.id !== undefined) {
              store.delete(extra.id);
            }
          }
        }
      };
    } catch {
      memoryFallback.addHistory(toolSlug, summary, data, maxItems);
    }
  },

  async getHistory<T>(toolSlug: string, limit = 30): Promise<ToolHistoryItem<T>[]> {
    try {
      const db = await getDb();
      return new Promise<ToolHistoryItem<T>[]>((resolve, reject) => {
        const tx = db.transaction(STORE_HISTORY, 'readonly');
        const store = tx.objectStore(STORE_HISTORY);
        const index = store.index('by_slug');
        const req = index.getAll(IDBKeyRange.only(toolSlug));
        req.onsuccess = () => {
          const records = (req.result as ToolHistoryItem<T>[]).sort((a, b) => b.timestamp - a.timestamp);
          resolve(records.slice(0, limit));
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return memoryFallback.getHistory<T>(toolSlug, limit);
    }
  },

  async clearHistory(toolSlug: string): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction(STORE_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_HISTORY);
      const index = store.index('by_slug');
      const req = index.getAllKeys(IDBKeyRange.only(toolSlug));
      req.onsuccess = () => {
        for (const key of req.result) {
          store.delete(key);
        }
      };
    } catch {
      memoryFallback.clearHistory(toolSlug);
    }
  },

  async storeBlob(
    blobOrBuffer: Blob | ArrayBuffer,
    metadata: { mimeType?: string; name?: string; ttlMs?: number } = {},
  ): Promise<string> {
    const id = `blob_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const mimeType = metadata.mimeType || (blobOrBuffer instanceof Blob ? blobOrBuffer.type : 'application/octet-stream');
    const name = metadata.name || 'unnamed_file';
    const ttl = metadata.ttlMs ?? DEFAULT_BLOB_TTL_MS;
    const blob = blobOrBuffer instanceof Blob ? blobOrBuffer : new Blob([blobOrBuffer], { type: mimeType });

    const entry: BlobVaultEntry = {
      id,
      blob,
      mimeType,
      name,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    try {
      const db = await getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_BLOB_VAULT, 'readwrite');
        const store = tx.objectStore(STORE_BLOB_VAULT);
        const req = store.put(entry);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      memoryFallback.storeBlob(id, entry);
    }

    return id;
  },

  async getBlob(id: string): Promise<{ blob: Blob; mimeType: string; name: string } | null> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_BLOB_VAULT, 'readonly');
        const store = tx.objectStore(STORE_BLOB_VAULT);
        const req = store.get(id);
        req.onsuccess = () => {
          const result = req.result as BlobVaultEntry | undefined;
          if (!result) return resolve(null);
          if (Date.now() > result.expiresAt) {
            // Expired: prune in background
            AppDatabase.deleteBlob(id).catch(() => {});
            return resolve(null);
          }
          resolve({ blob: result.blob, mimeType: result.mimeType, name: result.name });
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const fallback = memoryFallback.getBlob(id);
      if (!fallback) return null;
      return { blob: fallback.blob, mimeType: fallback.mimeType, name: fallback.name };
    }
  },

  async deleteBlob(id: string): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction(STORE_BLOB_VAULT, 'readwrite');
      tx.objectStore(STORE_BLOB_VAULT).delete(id);
    } catch {
      memoryFallback.deleteBlob(id);
    }
  },

  async purgeExpiredBlobs(): Promise<number> {
    try {
      const db = await getDb();
      const tx = db.transaction(STORE_BLOB_VAULT, 'readwrite');
      const store = tx.objectStore(STORE_BLOB_VAULT);
      const index = store.index('by_expiresAt');
      const range = IDBKeyRange.upperBound(Date.now());
      let deleted = 0;

      return new Promise<number>((resolve) => {
        const req = index.openCursor(range);
        req.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            cursor.delete();
            deleted += 1;
            cursor.continue();
          } else {
            resolve(deleted);
          }
        };
        req.onerror = () => resolve(deleted);
      });
    } catch {
      return 0;
    }
  },
};
