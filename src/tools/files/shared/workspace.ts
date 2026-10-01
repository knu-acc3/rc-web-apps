/**
 * Photo hand-off between tools of one browser tab. Every tool page is a full page load, so the files a person opened
 * live here between pages: IndexedDB database "rc-workspace" (the bytes) + a small sessionStorage record (the order
 * and the selected file, read synchronously). Nothing leaves the device.
 *
 * - `ws` — a random id of this tab (sessionStorage), so two tabs never mix their photos;
 * - records untouched for 6 hours are deleted; at most 60 files / 300 MB are kept (the rest is simply not stored);
 * - every failure (no IndexedDB, private mode, quota) silently means "no hand-off".
 *
 * Pure helpers (planSync, expired, fitCap) are unit-tested; the IndexedDB layer below them is kept thin.
 */

type WsKind = "original" | "result";

interface WsRecord {
  ws: string;
  id: string;
  order: number;
  name: string;
  type: string;
  lastModified: number;
  bytes: ArrayBuffer;
  savedAt: number;
  kind: WsKind;
}

/** What sessionStorage remembers about the stored set (the authoritative order). */
interface WsMeta {
  ids: string[];
  sizes: number[];
  selected: number;
  kind: WsKind;
}

export const WS_DB = "rc-workspace";
const STORE = "files";
const META_KEY = "rc-ws-meta";
const ID_KEY = "rc-ws-id";
export const WS_TTL = 6 * 60 * 60 * 1000;
export const WS_MAX_FILES = 60;
export const WS_MAX_BYTES = 300 * 1024 * 1024;
/** Records older than this are rewritten with a fresh `savedAt` when they are read. */
const TOUCH_AFTER = 60 * 60 * 1000;

/* ───────────── pure helpers ───────────── */

/** What to write and delete to turn the stored list of ids into `next`. */
export function planSync(stored: readonly string[], next: readonly string[]): { add: string[]; remove: string[]; same: boolean } {
  const have = new Set(stored);
  const want = new Set(next);
  const add = next.filter((id, i) => !have.has(id) && next.indexOf(id) === i);
  const remove = stored.filter((id) => !want.has(id));
  const same = stored.length === next.length && stored.every((id, i) => id === next[i]);
  return { add, remove, same };
}

/** A record nobody touched for `ttl` ms (or dated in the far future — a clock that jumped). */
export function expired(savedAt: number, now: number, ttl = WS_TTL): boolean {
  return !(savedAt > 0) || now - savedAt > ttl || savedAt - now > ttl;
}

/** How many leading files fit the cap (count and total bytes). */
export function fitCap(sizes: readonly number[], maxFiles = WS_MAX_FILES, maxBytes = WS_MAX_BYTES): number {
  let total = 0;
  let n = 0;
  for (const s of sizes) {
    if (n >= maxFiles || total + s > maxBytes) break;
    total += s;
    n++;
  }
  return n;
}

/* ───────────── sessionStorage: tab id and meta ───────────── */

function randomId(bytes = 8): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function tabId(): string | null {
  try {
    let id = sessionStorage.getItem(ID_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function readMeta(): WsMeta | null {
  try {
    const raw = sessionStorage.getItem(META_KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as Partial<WsMeta>;
    if (!Array.isArray(m.ids) || !m.ids.every((x) => typeof x === "string")) return null;
    const sizes = Array.isArray(m.sizes) && m.sizes.length === m.ids.length ? m.sizes.map((x) => Number(x) || 0) : m.ids.map(() => 0);
    return { ids: m.ids, sizes, selected: Number(m.selected) || 0, kind: m.kind === "result" ? "result" : "original" };
  } catch {
    return null;
  }
}

function writeMeta(m: WsMeta | null) {
  try {
    if (!m || !m.ids.length) sessionStorage.removeItem(META_KEY);
    else sessionStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    // storage blocked: no hand-off
  }
}

/** Files waiting for the next tool in this tab (synchronous, no IndexedDB). */
export function wsPendingCount(): number {
  return readMeta()?.ids.length ?? 0;
}

/** Remember which stored file is on screen (a single-image tool restores that one). */
export function wsSelect(index: number) {
  const m = readMeta();
  if (m && index >= 0 && index < m.ids.length && m.selected !== index) writeMeta({ ...m, selected: index });
}

/* ───────────── file identity ───────────── */

const known = new WeakMap<File, string>();

/** Stable id of a File object for this page (restored files keep the id they were stored under). */
export function wsFileId(f: File): string {
  let id = known.get(f);
  if (!id) {
    id = randomId(6);
    known.set(f, id);
  }
  return id;
}

/* ───────────── IndexedDB (thin layer) ───────────── */

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    let done = false;
    const finish = (db: IDBDatabase | null) => {
      if (done) {
        db?.close();
        return;
      }
      done = true;
      if (!db) dbPromise = null;
      resolve(db);
    };
    const timer = setTimeout(() => finish(null), 4000);
    try {
      if (typeof indexedDB === "undefined") return finish(null);
      const req = indexedDB.open(WS_DB, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: ["ws", "id"] });
        store.createIndex("savedAt", "savedAt");
      };
      req.onsuccess = () => {
        clearTimeout(timer);
        const db = req.result;
        // "Delete all site data" deletes the database: let it go instead of blocking.
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        finish(db);
      };
      req.onerror = req.onblocked = () => {
        clearTimeout(timer);
        finish(null);
      };
    } catch {
      clearTimeout(timer);
      finish(null);
    }
  });
  return dbPromise;
}

const commit = (tx: IDBTransaction) =>
  new Promise<void>((ok, bad) => {
    tx.oncomplete = () => ok();
    tx.onerror = tx.onabort = () => bad(tx.error ?? new Error("abort"));
  });

const range = (ws: string) => IDBKeyRange.bound([ws, ""], [ws, "￿"]);

/** One operation at a time, in call order (a quick add + remove must not interleave). */
let chain: Promise<unknown> = Promise.resolve();
function queue<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  const run = () => fn().catch(() => fallback);
  const p = chain.then(run, run);
  chain = p;
  return p;
}

async function toRecords(ws: string, files: readonly File[], ids: readonly string[], kind: WsKind, now: number, offset = 0): Promise<WsRecord[]> {
  const out: WsRecord[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    out.push({ ws, id: ids[i], order: offset + i, name: f.name, type: f.type, lastModified: f.lastModified, bytes: await f.arrayBuffer(), savedAt: now, kind });
  }
  return out;
}

/** Delete records nobody touched for 6 hours (any tab). */
export function wsPurgeExpired(now = Date.now()): Promise<void> {
  return queue(async () => {
    const db = await openDb();
    if (!db) return;
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.index("savedAt").openKeyCursor(IDBKeyRange.upperBound(now - WS_TTL));
    req.onsuccess = () => {
      const c = req.result;
      if (!c) return;
      store.delete(c.primaryKey);
      c.continue();
    };
    await commit(tx);
  }, undefined);
}

/** The files stored by this tab, in order, or null when there are none. */
export function wsLoad(): Promise<{ files: File[]; selected: number; kind: WsKind } | null> {
  return queue(async () => {
    const meta = readMeta();
    const ws = tabId();
    if (!meta || !ws) return null;
    const db = await openDb();
    if (!db) return null;
    const now = Date.now();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    let rows: WsRecord[] = [];
    const req = store.getAll(range(ws));
    // Puts go in the success callback itself: the transaction is guaranteed to be active there.
    req.onsuccess = () => {
      rows = (req.result as WsRecord[]).filter((r) => !expired(r.savedAt, now));
      // Still in use: keep it alive for another 6 hours.
      for (const r of rows) if (now - r.savedAt > TOUCH_AFTER) store.put({ ...r, savedAt: now });
    };
    await commit(tx);
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ids = meta.ids.filter((id) => byId.has(id));
    if (!ids.length) {
      writeMeta(null);
      return null;
    }
    const files = ids.map((id) => {
      const r = byId.get(id)!;
      const f = new File([r.bytes], r.name, { type: r.type, lastModified: r.lastModified });
      known.set(f, id);
      return f;
    });
    const selected = Math.max(0, ids.indexOf(meta.ids[meta.selected] ?? ""));
    if (ids.length !== meta.ids.length) writeMeta({ ...meta, ids, sizes: files.map((f) => f.size), selected });
    return { files, selected, kind: meta.kind };
  }, null);
}

/** Make the stored set exactly `files` (a batch tool after add / remove / clear). */
export function wsSync(files: readonly File[]): Promise<void> {
  return queue(async () => {
    const meta = readMeta() ?? { ids: [], sizes: [], selected: 0, kind: "original" as WsKind };
    const keep = files.slice(0, fitCap(files.map((f) => f.size)));
    const next = keep.map(wsFileId);
    const plan = planSync(meta.ids, next);
    if (plan.same) return;
    const ws = tabId();
    if (!ws) return;
    if (!next.length) {
      writeMeta(null);
      await clearRecords(ws);
      return;
    }
    const db = await openDb();
    if (!db) return;
    const adding = keep.filter((f) => plan.add.includes(wsFileId(f)));
    const records = await toRecords(ws, adding, adding.map(wsFileId), "original", Date.now(), meta.ids.length);
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const id of plan.remove) store.delete([ws, id]);
    for (const r of records) store.put(r);
    try {
      await commit(tx);
    } catch {
      // quota or a closed database: nothing can be handed on
      writeMeta(null);
      await clearRecords(ws);
      return;
    }
    const kind: WsKind = plan.add.length || plan.remove.length ? "original" : meta.kind;
    writeMeta({ ids: next, sizes: keep.map((f) => f.size), selected: Math.min(meta.selected, next.length - 1), kind });
  }, undefined);
}

/** Add one file to the set (a single-image tool never shrinks it) and select it. */
export function wsAppend(file: File): Promise<void> {
  return queue(async () => {
    const meta = readMeta() ?? { ids: [], sizes: [], selected: 0, kind: "original" as WsKind };
    const id = wsFileId(file);
    const at = meta.ids.indexOf(id);
    if (at >= 0) {
      if (meta.selected !== at) writeMeta({ ...meta, selected: at });
      return;
    }
    if (fitCap([...meta.sizes, file.size]) <= meta.ids.length) return;
    const ws = tabId();
    const db = ws ? await openDb() : null;
    if (!ws || !db) return;
    const [rec] = await toRecords(ws, [file], [id], "original", Date.now(), meta.ids.length);
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(rec);
    await commit(tx);
    writeMeta({ ids: [...meta.ids, id], sizes: [...meta.sizes, file.size], selected: meta.ids.length, kind: "original" });
  }, undefined);
}

/** Replace the whole set (the results handed to the next tool). Resolves to false when nothing could be stored. */
export function wsReplace(files: readonly File[], kind: WsKind = "result"): Promise<boolean> {
  return queue(async () => {
    const ws = tabId();
    if (!ws) return false;
    const keep = files.slice(0, fitCap(files.map((f) => f.size)));
    const db = await openDb();
    if (!db || !keep.length) return false;
    const ids = keep.map(wsFileId);
    const records = await toRecords(ws, keep, ids, kind, Date.now());
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.delete(range(ws));
    for (const r of records) store.put(r);
    try {
      await commit(tx);
    } catch {
      writeMeta(null);
      await clearRecords(ws);
      return false;
    }
    writeMeta({ ids, sizes: keep.map((f) => f.size), selected: 0, kind });
    return true;
  }, false);
}

async function clearRecords(ws: string) {
  const db = await openDb();
  if (!db) return;
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(range(ws));
  await commit(tx).catch(() => {});
}

/** Forget this tab's photos ("Start over"). */
export function wsClear(): Promise<void> {
  writeMeta(null);
  return queue(async () => {
    const ws = tabId();
    if (ws) await clearRecords(ws);
  }, undefined);
}
