"use client";

import { useMemo, useSyncExternalStore } from "react";
import { readKey, subscribeStorage, writeKey } from "../text/lib/storage";

const LISTS = "todo:v1:lists";
const ITEMS = (listId: string) => `todo:v1:items:${listId}`;

interface TodoList {
  id: string;
  name: string;
}
export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  /** Local date "YYYY-MM-DD" or "" */
  due: string;
}

function parse<T>(raw: string | null, check: (x: unknown) => x is T): T[] {
  try {
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter(check) : [];
  } catch {
    return [];
  }
}
const isList = (x: unknown): x is TodoList => !!x && typeof (x as TodoList).id === "string" && typeof (x as TodoList).name === "string";
const isItem = (x: unknown): x is TodoItem => !!x && typeof (x as TodoItem).id === "string" && typeof (x as TodoItem).text === "string";

export function newId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function readLists(): TodoList[] {
  return parse(readKey(LISTS), isList);
}
export function writeLists(lists: TodoList[]): void {
  writeKey(LISTS, JSON.stringify(lists));
}
export function readItems(listId: string): TodoItem[] {
  return parse(readKey(ITEMS(listId)), isItem).map((i) => ({ ...i, done: !!i.done, due: typeof i.due === "string" ? i.due : "" }));
}
export function writeItems(listId: string, items: TodoItem[]): void {
  writeKey(ITEMS(listId), JSON.stringify(items));
}

export function createList(name: string, items: string[] = []): string {
  const id = newId();
  writeItems(
    id,
    items.map((text) => ({ id: newId(), text, done: false, due: "" })),
  );
  writeLists([...readLists(), { id, name }]);
  return id;
}

export function deleteList(id: string): void {
  writeLists(readLists().filter((l) => l.id !== id));
  writeKey(ITEMS(id), null);
}

/** Lists and the items of the active list, reactive to this and other tabs. */
export function useTodo(activeId: string | null): { lists: TodoList[]; listId: string | null; items: TodoItem[] } | null {
  const snap = useSyncExternalStore(
    subscribeStorage,
    () => {
      const listsRaw = readKey(LISTS) ?? "";
      const lists = parse(listsRaw || null, isList);
      const id = lists.find((l) => l.id === activeId)?.id ?? lists[0]?.id ?? "";
      return `${listsRaw}\u0000${id}\u0000${id ? (readKey(ITEMS(id)) ?? "") : ""}`;
    },
    () => null,
  );
  return useMemo(() => {
    if (snap === null) return null;
    const [listsRaw, id, itemsRaw] = snap.split("\u0000");
    const items = parse(itemsRaw || null, isItem).map((i) => ({ ...i, done: !!i.done, due: typeof i.due === "string" ? i.due : "" }));
    return { lists: parse(listsRaw || null, isList), listId: id || null, items };
  }, [snap]);
}

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const a = arr.slice();
  const [x] = a.splice(from, 1);
  a.splice(Math.max(0, Math.min(a.length, to)), 0, x);
  return a;
}
