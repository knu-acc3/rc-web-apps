"use client";

import { useMemo, useSyncExternalStore } from "react";
import { readKey, subscribeStorage, writeKey } from "../text/lib/storage";

/** Notes live in localStorage: one key for the ordered id list, one key per note. */
const INDEX = "notepad:v1:index";
const NOTE = (id: string) => `notepad:v1:note:${id}`;

export interface Note {
  id: string;
  text: string;
  created: number;
  updated: number;
}

function parseIds(raw: string | null): string[] {
  try {
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function parseNote(id: string, raw: string | null): Note | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Note>;
    return { id, text: typeof v.text === "string" ? v.text : "", created: Number(v.created) || 0, updated: Number(v.updated) || 0 };
  } catch {
    return null;
  }
}

/** Snapshot = index + every note's raw JSON joined; a primitive string keeps useSyncExternalStore stable. */
function snapshot(): string {
  const idx = readKey(INDEX);
  const ids = parseIds(idx);
  return [idx ?? "", ...ids.map((id) => readKey(NOTE(id)) ?? "")].join("\u0000");
}

export function useNotes(): Note[] | null {
  const snap = useSyncExternalStore(subscribeStorage, snapshot, () => null);
  return useMemo(() => {
    if (snap === null) return null;
    const [idx, ...raws] = snap.split("\u0000");
    const ids = parseIds(idx || null);
    return ids.map((id, i) => parseNote(id, raws[i] ?? null)).filter((n): n is Note => n !== null);
  }, [snap]);
}

function newId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function createNote(text = ""): string {
  const id = newId();
  const now = Date.now();
  writeKey(NOTE(id), JSON.stringify({ text, created: now, updated: now }));
  writeKey(INDEX, JSON.stringify([id, ...parseIds(readKey(INDEX))]));
  return id;
}

export function saveNote(note: Note, text: string): void {
  writeKey(NOTE(note.id), JSON.stringify({ text, created: note.created, updated: Date.now() }));
}

export function deleteNote(id: string): void {
  writeKey(INDEX, JSON.stringify(parseIds(readKey(INDEX)).filter((x) => x !== id)));
  writeKey(NOTE(id), null);
}

/** Import several notes at once (e.g. from a JSON backup), newest first. */
export function importNotes(items: { text: string; created?: number; updated?: number }[]): number {
  const ids: string[] = [];
  const now = Date.now();
  for (const it of items) {
    if (typeof it.text !== "string") continue;
    const id = newId();
    writeKey(NOTE(id), JSON.stringify({ text: it.text, created: it.created ?? now, updated: it.updated ?? now }));
    ids.push(id);
  }
  writeKey(INDEX, JSON.stringify([...ids, ...parseIds(readKey(INDEX))]));
  return ids.length;
}

/** First non-empty line, without Markdown heading marks. */
export function noteTitle(text: string, fallback: string): string {
  const line = text.split("\n").find((l) => l.trim()) ?? "";
  const t = line.replace(/^#+\s*/, "").trim();
  return t ? (t.length > 60 ? `${t.slice(0, 60)}…` : t) : fallback;
}
