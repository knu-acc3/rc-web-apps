"use client";

import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import { CheckCircle, Circle, Plus, Trash } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface TodoStorageEnvelope {
  version: typeof TODO_SCHEMA_VERSION;
  items: TodoItem[];
}

export interface TodoStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type TodoFilter = "all" | "active" | "completed";
export type TodoStorageNotice =
  | "ready"
  | "saved"
  | "migrated"
  | "invalid"
  | "unsupported"
  | "blocked"
  | "writeError"
  | "cleared";

export interface TodoDecodeResult {
  items: TodoItem[];
  notice: "ready" | "migrated" | "invalid" | "unsupported";
  needsMigration: boolean;
}

export interface TodoLoadResult {
  items: TodoItem[];
  notice: TodoStorageNotice;
  needsMigration: boolean;
}

export interface TodoState {
  items: TodoItem[];
  revision: number;
}

export type TodoAction =
  | { type: "hydrate"; items: TodoItem[] }
  | { type: "add"; item: TodoItem }
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string }
  | { type: "clearCompleted" }
  | { type: "clearAll" };

export const TODO_SCHEMA_VERSION = 1 as const;
export const TODO_STORAGE_KEY = "utools-todos-v3";
export const TODO_LEGACY_STORAGE_KEY = "utools-todos-v2";
export const TODO_LIMITS = {
  maximumItems: 500,
  maximumTextLength: 200,
  maximumIdLength: 128,
} as const;

const TODO_SEGMENTER =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeTodoText(value: string): string | null {
  const normalized = value.trim().normalize("NFC");
  const characters = splitTodoCharacters(normalized);
  return characters.length > 0 &&
    characters.length <= TODO_LIMITS.maximumTextLength
    ? normalized
    : null;
}

export function splitTodoCharacters(value: string): string[] {
  const normalized = value.normalize("NFC");
  if (!TODO_SEGMENTER) return Array.from(normalized);
  return Array.from(
    TODO_SEGMENTER.segment(normalized),
    ({ segment }) => segment,
  );
}

export function createTodoId(
  timestampMs: number,
  sequence: number,
  randomUuid?: () => string,
): string {
  if (
    !Number.isSafeInteger(timestampMs) ||
    timestampMs < 0 ||
    !Number.isSafeInteger(sequence) ||
    sequence < 0
  ) {
    throw new RangeError("Todo ID inputs must be non-negative safe integers.");
  }

  if (randomUuid) {
    try {
      const uuid = randomUuid();
      if (
        typeof uuid === "string" &&
        uuid.length > 0 &&
        uuid.length <= TODO_LIMITS.maximumIdLength
      ) {
        return uuid;
      }
    } catch {
      // The deterministic timestamp/sequence fallback remains available.
    }
  }

  return `todo-${timestampMs.toString(36)}-${sequence.toString(36)}`;
}

function migrationId(index: number): string {
  return `migrated-${index.toString(36)}`;
}

export function sanitizeTodoItems(
  input: readonly unknown[],
  migrationTimestampMs: number,
): TodoItem[] {
  void migrationTimestampMs;
  const usedIds = new Set<string>();
  const result: TodoItem[] = [];

  for (let index = 0; index < input.length; index += 1) {
    if (result.length >= TODO_LIMITS.maximumItems) break;
    const candidate = input[index];
    if (!isRecord(candidate) || typeof candidate.text !== "string") continue;

    const trimmed = candidate.text.trim().normalize("NFC");
    if (!trimmed) continue;
    const text = splitTodoCharacters(trimmed)
      .slice(0, TODO_LIMITS.maximumTextLength)
      .join("");

    let id = "";
    if (
      typeof candidate.id === "string" &&
      candidate.id.length > 0 &&
      candidate.id.length <= TODO_LIMITS.maximumIdLength &&
      /^[A-Za-z0-9_-]+$/.test(candidate.id)
    ) {
      id = candidate.id;
    } else if (
      typeof candidate.id === "number" &&
      Number.isSafeInteger(candidate.id) &&
      candidate.id >= 0
    ) {
      id = `legacy-${candidate.id}`;
    } else {
      id = migrationId(index);
    }

    if (usedIds.has(id)) {
      const base = migrationId(index);
      let suffix = 0;
      id = base;
      while (usedIds.has(id)) {
        suffix += 1;
        id = `${base}-${suffix.toString(36)}`;
      }
    }
    usedIds.add(id);

    const createdAt =
      typeof candidate.createdAt === "number" &&
      Number.isSafeInteger(candidate.createdAt) &&
      candidate.createdAt >= 0
        ? candidate.createdAt
        : index;

    result.push({
      id,
      text,
      completed: candidate.completed === true,
      createdAt,
    });
  }

  return result;
}

export function decodeTodoStorage(
  raw: string,
  migrationTimestampMs: number,
): TodoDecodeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { items: [], notice: "invalid", needsMigration: false };
  }

  if (Array.isArray(parsed)) {
    return {
      items: sanitizeTodoItems(parsed, migrationTimestampMs),
      notice: "migrated",
      needsMigration: true,
    };
  }

  if (!isRecord(parsed)) {
    return { items: [], notice: "invalid", needsMigration: false };
  }

  if (parsed.version !== TODO_SCHEMA_VERSION) {
    return { items: [], notice: "unsupported", needsMigration: false };
  }
  if (!Array.isArray(parsed.items)) {
    return { items: [], notice: "invalid", needsMigration: false };
  }

  const items = sanitizeTodoItems(parsed.items, migrationTimestampMs);
  const isCanonical =
    parsed.items.length <= TODO_LIMITS.maximumItems &&
    JSON.stringify(parsed.items) === JSON.stringify(items);
  return {
    items,
    notice: isCanonical ? "ready" : "migrated",
    needsMigration: !isCanonical,
  };
}

export function loadTodoStorage(
  storage: TodoStorageLike,
  migrationTimestampMs: number,
): TodoLoadResult {
  try {
    const current = storage.getItem(TODO_STORAGE_KEY);
    if (current !== null) {
      return decodeTodoStorage(current, migrationTimestampMs);
    }

    const legacy = storage.getItem(TODO_LEGACY_STORAGE_KEY);
    if (legacy === null) {
      return { items: [], notice: "ready", needsMigration: false };
    }

    const decoded = decodeTodoStorage(legacy, migrationTimestampMs);
    if (decoded.notice === "ready") {
      return { ...decoded, notice: "migrated", needsMigration: true };
    }
    return decoded;
  } catch {
    return { items: [], notice: "blocked", needsMigration: false };
  }
}

export function writeTodoStorage(
  storage: TodoStorageLike,
  items: readonly TodoItem[],
): boolean {
  try {
    const envelope: TodoStorageEnvelope = {
      version: TODO_SCHEMA_VERSION,
      items: items.slice(0, TODO_LIMITS.maximumItems),
    };
    storage.setItem(TODO_STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function clearTodoStorage(storage: TodoStorageLike): boolean {
  let currentSnapshot: string | null = null;
  let legacySnapshot: string | null = null;

  try {
    currentSnapshot = storage.getItem(TODO_STORAGE_KEY);
    legacySnapshot = storage.getItem(TODO_LEGACY_STORAGE_KEY);

    storage.removeItem(TODO_LEGACY_STORAGE_KEY);
    storage.removeItem(TODO_STORAGE_KEY);
    return true;
  } catch {
    try {
      if (currentSnapshot !== null) {
        storage.setItem(TODO_STORAGE_KEY, currentSnapshot);
      }
      if (legacySnapshot !== null) {
        storage.setItem(TODO_LEGACY_STORAGE_KEY, legacySnapshot);
      }
    } catch {
      // Best-effort rollback: the caller keeps the in-memory list unchanged.
    }
    return false;
  }
}

export function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case "hydrate":
      return { items: action.items, revision: 0 };
    case "add":
      if (state.items.length >= TODO_LIMITS.maximumItems) return state;
      return {
        items: [action.item, ...state.items],
        revision: state.revision + 1,
      };
    case "toggle": {
      let changed = false;
      const items = state.items.map((item) => {
        if (item.id !== action.id) return item;
        changed = true;
        return { ...item, completed: !item.completed };
      });
      return changed ? { items, revision: state.revision + 1 } : state;
    }
    case "delete": {
      const items = state.items.filter((item) => item.id !== action.id);
      return items.length === state.items.length
        ? state
        : { items, revision: state.revision + 1 };
    }
    case "clearCompleted": {
      const items = state.items.filter((item) => !item.completed);
      return items.length === state.items.length
        ? state
        : { items, revision: state.revision + 1 };
    }
    case "clearAll":
      return state.items.length === 0
        ? state
        : { items: [], revision: state.revision + 1 };
  }
}

export default function TodoList() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [state, dispatch] = useReducer(todoReducer, {
    items: [],
    revision: 0,
  });
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [loaded, setLoaded] = useState(false);
  const [storageNotice, setStorageNotice] =
    useState<TodoStorageNotice>("ready");
  const [pendingClear, setPendingClear] = useState<"completed" | "all" | null>(
    null,
  );
  const idSequenceRef = useRef(0);
  const skipNextPersistenceRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let storage: Storage | null = null;
      let loadedState: TodoLoadResult;
      try {
        storage = window.localStorage;
        loadedState = loadTodoStorage(storage, Date.now());
      } catch {
        loadedState = {
          items: [],
          notice: "blocked",
          needsMigration: false,
        };
      }
      dispatch({ type: "hydrate", items: loadedState.items });
      setLoaded(true);

      if (loadedState.needsMigration) {
        const migrated =
          storage !== null && writeTodoStorage(storage, loadedState.items);
        setStorageNotice(migrated ? "migrated" : "writeError");
      } else {
        setStorageNotice(loadedState.notice);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded || state.revision === 0) return;
    if (skipNextPersistenceRef.current) {
      skipNextPersistenceRef.current = false;
      return;
    }

    const snapshot = state.items;
    const timer = window.setTimeout(() => {
      let saved = false;
      try {
        saved = writeTodoStorage(window.localStorage, snapshot);
      } catch {
        saved = false;
      }
      setStorageNotice(saved ? "saved" : "writeError");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loaded, state.items, state.revision]);

  const activeCount = state.items.filter((item) => !item.completed).length;
  const completedCount = state.items.length - activeCount;
  const filteredItems = state.items.filter((item) => {
    if (filter === "active") return !item.completed;
    if (filter === "completed") return item.completed;
    return true;
  });

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = normalizeTodoText(input);
    if (!text) {
      setInputError(
        isEn
          ? `Enter 1–${TODO_LIMITS.maximumTextLength} characters.`
          : `Введите от 1 до ${TODO_LIMITS.maximumTextLength} символов.`,
      );
      return;
    }
    if (state.items.length >= TODO_LIMITS.maximumItems) {
      setInputError(
        isEn
          ? `The list is limited to ${TODO_LIMITS.maximumItems} tasks.`
          : `В списке может быть не больше ${TODO_LIMITS.maximumItems} задач.`,
      );
      return;
    }

    const timestamp = Date.now();
    idSequenceRef.current += 1;
    const randomUuid =
      typeof window.crypto?.randomUUID === "function"
        ? () => window.crypto.randomUUID()
        : undefined;
    const id = createTodoId(timestamp, idSequenceRef.current, randomUuid);
    dispatch({
      type: "add",
      item: { id, text, completed: false, createdAt: timestamp },
    });
    setInput("");
    setInputError(null);
    setPendingClear(null);
  };

  const confirmClearCompleted = () => {
    if (pendingClear !== "completed") {
      setPendingClear("completed");
      return;
    }
    dispatch({ type: "clearCompleted" });
    setPendingClear(null);
    if (filter === "completed") setFilter("all");
  };

  const confirmClearAll = () => {
    if (pendingClear !== "all") {
      setPendingClear("all");
      return;
    }

    let cleared = false;
    try {
      cleared = clearTodoStorage(window.localStorage);
    } catch {
      cleared = false;
    }

    if (!cleared) {
      skipNextPersistenceRef.current = false;
      setStorageNotice("writeError");
      setPendingClear(null);
      return;
    }

    skipNextPersistenceRef.current = state.items.length > 0;
    dispatch({ type: "clearAll" });
    setStorageNotice("cleared");
    setPendingClear(null);
    setFilter("all");
  };

  const noticeCopy = () => {
    const copy: Record<TodoStorageNotice, { en: string; ru: string }> = {
      ready: {
        en: "Tasks are stored only in this browser after a change.",
        ru: "После изменения задачи сохраняются только в этом браузере.",
      },
      saved: {
        en: "Saved in this browser.",
        ru: "Сохранено в этом браузере.",
      },
      migrated: {
        en: "Older tasks were validated and migrated to schema version 1.",
        ru: "Старые задачи проверены и перенесены в схему версии 1.",
      },
      invalid: {
        en: "Malformed stored data was ignored. Adding a task will replace it with a valid list.",
        ru: "Повреждённые сохранённые данные проигнорированы. Новая задача заменит их корректным списком.",
      },
      unsupported: {
        en: "A newer or unknown storage version was not loaded. New changes will replace it.",
        ru: "Новая или неизвестная версия хранилища не загружена. Новые изменения заменят её.",
      },
      blocked: {
        en: "Browser storage is blocked. Tasks work in memory but may disappear after reload.",
        ru: "Хранилище браузера заблокировано. Задачи доступны в памяти, но могут исчезнуть после перезагрузки.",
      },
      writeError: {
        en: "Could not save: browser storage may be blocked or full. Current tasks remain in memory.",
        ru: "Не удалось сохранить: хранилище браузера может быть заблокировано или заполнено. Текущие задачи остаются в памяти.",
      },
      cleared: {
        en: "Tasks and this tool’s stored data were cleared.",
        ru: "Задачи и сохранённые данные этого инструмента удалены.",
      },
    };
    return isEn ? copy[storageNotice].en : copy[storageNotice].ru;
  };

  const hasStorageError = [
    "invalid",
    "unsupported",
    "blocked",
    "writeError",
  ].includes(storageNotice);

  return (
    <form onSubmit={addTask} className="mx-auto w-full max-w-3xl" noValidate>
      <Card className="p-4 sm:p-5">
        <div>
          <Label htmlFor="todo-task" className="mb-1.5 block text-sm">
            {isEn ? "Task" : "Задача"}
          </Label>
          <Input
            id="todo-task"
            type="text"
            value={input}
            disabled={!loaded}
            onChange={(event) => {
              setInput(event.target.value);
              setInputError(null);
            }}
            placeholder={isEn ? "What needs to be done?" : "Что нужно сделать?"}
            className={cn(
              "h-12 text-base",
              inputError ? "border-[var(--color-danger)]/60" : undefined,
            )}
            aria-invalid={Boolean(inputError)}
            aria-describedby="todo-task-hint"
            autoComplete="off"
          />
          <p
            id="todo-task-hint"
            className={cn(
              "mt-1.5 text-xs",
              inputError
                ? "text-[var(--color-danger)]"
                : "text-[var(--color-text-muted)]",
            )}
          >
            {inputError ??
              (isEn
                ? `Up to ${TODO_LIMITS.maximumTextLength} characters.`
                : `Не больше ${TODO_LIMITS.maximumTextLength} символов.`)}
          </p>
        </div>

        <ToolPrimaryAction
          type="submit"
          className="mt-4"
          disabled={!loaded}
          leadingIcon={<Plus size={20} weight="bold" aria-hidden="true" />}
        >
          {isEn ? "Add task" : "Добавить задачу"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "List and storage" : "Список и хранилище"}
          description={
            isEn
              ? `${activeCount} active · ${completedCount} completed`
              : `${activeCount} активных · ${completedCount} выполненных`
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium">
                {isEn ? "Show tasks" : "Показывать задачи"}
              </span>
              <select
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value as TodoFilter);
                  setPendingClear(null);
                }}
                className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:max-w-xs"
              >
                <option value="all">
                  {isEn
                    ? `All (${state.items.length})`
                    : `Все (${state.items.length})`}
                </option>
                <option value="active">
                  {isEn
                    ? `Active (${activeCount})`
                    : `Активные (${activeCount})`}
                </option>
                <option value="completed">
                  {isEn
                    ? `Completed (${completedCount})`
                    : `Выполненные (${completedCount})`}
                </option>
              </select>
            </label>

            <Button
              type="button"
              variant="outline"
              disabled={completedCount === 0}
              onClick={confirmClearCompleted}
              className={cn(
                "min-h-11",
                pendingClear === "completed"
                  ? "border-[var(--color-danger)] text-[var(--color-danger)]"
                  : undefined,
              )}
            >
              <Trash size={18} aria-hidden="true" />
              {pendingClear === "completed"
                ? isEn
                  ? "Confirm clear completed"
                  : "Подтвердить удаление выполненных"
                : isEn
                  ? "Clear completed"
                  : "Удалить выполненные"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={confirmClearAll}
              className={cn(
                "min-h-11",
                pendingClear === "all"
                  ? "border-[var(--color-danger)] text-[var(--color-danger)]"
                  : undefined,
              )}
            >
              <Trash size={18} aria-hidden="true" />
              {pendingClear === "all"
                ? isEn
                  ? "Confirm clear all data"
                  : "Подтвердить удаление всех данных"
                : isEn
                  ? "Clear all tasks and storage"
                  : "Удалить все задачи и данные"}
            </Button>
          </div>

          {pendingClear ? (
            <p className="mt-3 text-sm text-[var(--color-danger)]" role="alert">
              {isEn
                ? "This cannot be undone. Press the same button again to confirm."
                : "Это действие нельзя отменить. Нажмите ту же кнопку ещё раз для подтверждения."}
            </p>
          ) : null}

          <p
            className={cn(
              "mt-4 rounded-[var(--radius-md)] border p-3 text-sm leading-relaxed",
              hasStorageError
                ? "border-[var(--color-danger)]/30 text-[var(--color-danger)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)]",
            )}
            role={hasStorageError ? "alert" : "status"}
          >
            {noticeCopy()}
          </p>
        </AdvancedSettings>

        <ToolResult
          className="mt-5"
          status={
            !loaded
              ? "loading"
              : hasStorageError && state.items.length === 0
                ? "error"
                : filteredItems.length === 0
                  ? "empty"
                  : "success"
          }
          title={
            !loaded
              ? isEn
                ? "Loading tasks"
                : "Загрузка задач"
              : isEn
                ? `Tasks (${filteredItems.length})`
                : `Задачи (${filteredItems.length})`
          }
          description={
            !loaded
              ? isEn
                ? "Reading this browser’s saved list."
                : "Читаем сохранённый в этом браузере список."
              : filteredItems.length === 0
                ? state.items.length === 0
                  ? isEn
                    ? "No tasks yet."
                    : "Задач пока нет."
                  : isEn
                    ? "No tasks match this filter."
                    : "Для этого фильтра задач нет."
                : isEn
                  ? "Complete or delete tasks with the controls in each row."
                  : "Отмечайте выполнение или удаляйте задачи кнопками в строке."
          }
        >
          {filteredItems.length > 0 ? (
            <ul className="divide-y divide-[var(--color-border-subtle)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
              {filteredItems.map((item) => (
                <li
                  key={item.id}
                  className="flex min-w-0 items-start gap-2 px-2 py-2 sm:px-3"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    aria-label={
                      item.completed
                        ? isEn
                          ? `Mark “${item.text}” active`
                          : `Вернуть задачу «${item.text}» в активные`
                        : isEn
                          ? `Mark “${item.text}” completed`
                          : `Отметить задачу «${item.text}» выполненной`
                    }
                    aria-pressed={item.completed}
                    onClick={() => {
                      dispatch({ type: "toggle", id: item.id });
                      setPendingClear(null);
                    }}
                  >
                    {item.completed ? (
                      <CheckCircle
                        size={22}
                        weight="fill"
                        className="text-[var(--color-success)]"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle size={22} aria-hidden="true" />
                    )}
                  </Button>

                  <p
                    className={cn(
                      "min-w-0 flex-1 break-words py-2.5 text-sm leading-relaxed text-[var(--color-text)]",
                      item.completed
                        ? "text-[var(--color-text-muted)] line-through"
                        : undefined,
                    )}
                  >
                    {item.text}
                  </p>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                    aria-label={
                      isEn
                        ? `Delete “${item.text}”`
                        : `Удалить задачу «${item.text}»`
                    }
                    onClick={() => {
                      dispatch({ type: "delete", id: item.id });
                      setPendingClear(null);
                    }}
                  >
                    <Trash size={20} aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </ToolResult>
      </Card>
    </form>
  );
}
