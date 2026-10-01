"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { wsAppend, wsClear, wsFileId, wsLoad, wsPendingCount, wsPurgeExpired, wsSync } from "../../shared/workspace";

const noSubscribe = () => () => {};

function accepts(file: File, accept?: string): boolean {
  if (!accept) return true;
  const rules = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return rules.some((r) => (r.startsWith(".") ? name.endsWith(r) : r.endsWith("/*") ? type.startsWith(r.slice(0, -1)) : type === r));
}

/**
 * Keeps a photo tool's files in the tab's workspace so the next photo tool can pick them up.
 *  - "sync" (batch tools, collage, GIF): the stored set follows the tool exactly (add / remove / clear);
 *  - "append" (single-image editors): opened files are added, nothing is removed; the restored file is the selected one.
 * After mount an empty tool gets the stored photos back (`restore`). `settled` = false while the tool is still loading
 * files, so a half-loaded list never overwrites the stored one.
 */
export function useWorkspace({
  files,
  mode,
  restore,
  settled = true,
  accept,
}: {
  files: readonly File[];
  mode: "sync" | "append";
  restore: (files: File[], selected: number) => void;
  settled?: boolean;
  accept?: string;
}) {
  // Read after hydration only (the server has no sessionStorage).
  const pending = useSyncExternalStore(noSubscribe, wsPendingCount, () => 0);
  const [done, setDone] = useState(false);
  const [restored, setRestored] = useState(0);
  const ready = useRef(false);
  const started = useRef(false);
  const alive = useRef(true);
  const filesRef = useRef(files);
  const restoreRef = useRef(restore);
  useEffect(() => {
    filesRef.current = files;
    restoreRef.current = restore;
  });

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Restore once, after mount, into an empty tool.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void wsPurgeExpired();
    const load = filesRef.current.length || !wsPendingCount() ? Promise.resolve(null) : wsLoad();
    void load.then((r) => {
      if (!alive.current) return;
      const list = r ? r.files.filter((f) => accepts(f, accept)) : [];
      if (r && list.length && !filesRef.current.length) {
        const sel = Math.max(0, list.indexOf(r.files[r.selected]));
        restoreRef.current(list, sel);
        setRestored(mode === "append" ? 1 : list.length);
      }
      ready.current = true;
      setDone(true);
    });
  }, [accept, mode]);

  // Follow the tool's files.
  const key = files.map(wsFileId).join(",");
  useEffect(() => {
    if (!ready.current || !settled) return;
    if (mode === "sync") void wsSync(filesRef.current);
    else for (const f of filesRef.current) void wsAppend(f);
  }, [key, settled, mode, done]);

  const startOver = useCallback(() => {
    void wsClear();
    setRestored(0);
  }, []);

  return {
    /** The stored photos are being read: show a placeholder instead of the drop zone. */
    restoring: pending > 0 && !done && !files.length,
    /** How many photos came from the previous tool (0 when none or after "Start over"). */
    restored: files.length ? restored : 0,
    startOver,
  };
}
