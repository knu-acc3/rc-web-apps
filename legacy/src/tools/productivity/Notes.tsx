"use client";

import { useEffect, useState } from "react";
import { FloppyDisk, Trash } from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import { useDirtyBeforeUnload } from "@/src/hooks/useDirtyBeforeUnload";

export const NOTES_STORAGE_KEY = "ulti-notes";
export const NOTES_STORAGE_VERSION = 2;
export const NOTES_MAX_CHARACTERS = 100_000;

const NOTES_MAX_SERIALIZED_CHARACTERS = NOTES_MAX_CHARACTERS * 8 + 2_048;

export type StoredNoteParseResult =
  | { kind: "empty"; content: ""; savedAt: null }
  | { kind: "valid"; content: string; savedAt: string | null }
  | { kind: "migrated"; content: string; savedAt: string | null }
  | { kind: "malformed" }
  | { kind: "unsupported-version" }
  | { kind: "too-large" };

export type NoteStorageFailureReason =
  "quota" | "security" | "unavailable" | "unknown" | "too-large";

export interface NoteStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type NoteStorageReadResult =
  | { ok: true; value: StoredNoteParseResult }
  | { ok: false; reason: Exclude<NoteStorageFailureReason, "too-large"> };

export type NoteStorageWriteResult =
  | { ok: true; savedAt: string }
  | { ok: false; reason: NoteStorageFailureReason };

type NoteIssue = NoteStorageFailureReason | "malformed" | "unsupported-version";

export type StoredNoteProtectionIssue = NoteIssue;

export function requiresStoredNoteReplacementConfirmation(
  issue: string | null,
): issue is StoredNoteProtectionIssue {
  return (
    issue === "malformed" ||
    issue === "unsupported-version" ||
    issue === "too-large" ||
    issue === "quota" ||
    issue === "security" ||
    issue === "unavailable" ||
    issue === "unknown"
  );
}

export type NoteSaveDisposition =
  "write" | "confirm-replacement" | "reject-too-large";

export function getNoteSaveDisposition(
  loadIssue: string | null,
  characterCount: number,
): NoteSaveDisposition {
  if (characterCount > NOTES_MAX_CHARACTERS) {
    return "reject-too-large";
  }

  return requiresStoredNoteReplacementConfirmation(loadIssue)
    ? "confirm-replacement"
    : "write";
}

interface NoteEditorState {
  loadStatus: "loading" | "ready";
  note: string;
  savedNote: string;
  hasStoredNote: boolean;
  savedAt: string | null;
  needsMigration: boolean;
  loadIssue: NoteIssue | null;
  operationIssue: NoteStorageFailureReason | null;
  lastAction: "saved" | "cleared" | null;
}

const INITIAL_EDITOR_STATE: NoteEditorState = {
  loadStatus: "loading",
  note: "",
  savedNote: "",
  hasStoredNote: false,
  savedAt: null,
  needsMigration: false,
  loadIssue: null,
  operationIssue: null,
  lastAction: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSavedAt(value: unknown): string | null {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "number" && (!Number.isFinite(value) || value < 0))
  ) {
    return null;
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function resultForMigratedContent(
  content: string,
  savedAt: string | null,
): StoredNoteParseResult {
  if (content.length > NOTES_MAX_CHARACTERS) {
    return { kind: "too-large" };
  }

  return { kind: "migrated", content, savedAt };
}

function migrateLegacyNoteList(
  value: unknown[],
  raw: string,
): StoredNoteParseResult {
  if (value.length === 0) {
    return { kind: "migrated", content: "", savedAt: null };
  }

  const parts: string[] = [];
  let newestTimestamp: number | null = null;
  let hasUnrecognizedItem = false;

  for (const item of value) {
    if (!isRecord(item)) {
      hasUnrecognizedItem = true;
      continue;
    }

    const title = typeof item.title === "string" ? item.title.trim() : "";
    const content = typeof item.content === "string" ? item.content : "";

    if (typeof item.title !== "string" && typeof item.content !== "string") {
      hasUnrecognizedItem = true;
      continue;
    }

    if (title && content) {
      parts.push(`${title}\n${content}`);
    } else {
      parts.push(title || content);
    }

    if (
      typeof item.updatedAt === "number" &&
      Number.isFinite(item.updatedAt) &&
      item.updatedAt >= 0 &&
      (newestTimestamp === null || item.updatedAt > newestTimestamp)
    ) {
      newestTimestamp = item.updatedAt;
    }
  }

  if (hasUnrecognizedItem || parts.length === 0) {
    return resultForMigratedContent(raw, null);
  }

  return resultForMigratedContent(
    parts.join("\n\n---\n\n"),
    normalizeSavedAt(newestTimestamp),
  );
}

/**
 * Parses the current versioned payload and the historical note formats without
 * changing storage. Legacy collections are combined so their text is not lost.
 */
export function parseStoredNote(raw: string | null): StoredNoteParseResult {
  if (raw === null || raw === "") {
    return { kind: "empty", content: "", savedAt: null };
  }

  if (raw.length > NOTES_MAX_SERIALIZED_CHARACTERS) {
    return { kind: "too-large" };
  }

  let decoded: unknown;

  try {
    decoded = JSON.parse(raw);
  } catch {
    return resultForMigratedContent(raw, null);
  }

  if (typeof decoded === "string") {
    return resultForMigratedContent(decoded, null);
  }

  if (Array.isArray(decoded)) {
    return migrateLegacyNoteList(decoded, raw);
  }

  if (!isRecord(decoded)) {
    return resultForMigratedContent(raw, null);
  }

  if (decoded.version === NOTES_STORAGE_VERSION) {
    if (typeof decoded.content !== "string") {
      return { kind: "malformed" };
    }

    if (decoded.content.length > NOTES_MAX_CHARACTERS) {
      return { kind: "too-large" };
    }

    return {
      kind: "valid",
      content: decoded.content,
      savedAt: normalizeSavedAt(decoded.savedAt),
    };
  }

  if (decoded.version !== undefined && decoded.version !== 1) {
    return { kind: "unsupported-version" };
  }

  const legacyContent =
    typeof decoded.text === "string"
      ? decoded.text
      : typeof decoded.content === "string"
        ? decoded.content
        : null;

  if (legacyContent === null) {
    const hasKnownLegacyField =
      decoded.version === 1 ||
      "text" in decoded ||
      "content" in decoded ||
      "savedAt" in decoded ||
      "updatedAt" in decoded;

    return hasKnownLegacyField
      ? { kind: "malformed" }
      : resultForMigratedContent(raw, null);
  }

  return resultForMigratedContent(
    legacyContent,
    normalizeSavedAt(decoded.savedAt ?? decoded.updatedAt),
  );
}

export function serializeStoredNote(
  content: string,
  savedAtMilliseconds: number,
): string {
  return JSON.stringify({
    version: NOTES_STORAGE_VERSION,
    content,
    savedAt: new Date(savedAtMilliseconds).toISOString(),
  });
}

export function classifyNoteStorageError(
  error: unknown,
): Exclude<NoteStorageFailureReason, "too-large"> {
  const name =
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string"
      ? error.name
      : "";

  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return "quota";
  }

  if (name === "SecurityError") {
    return "security";
  }

  return "unknown";
}

export function readStoredNote(
  storage: Pick<NoteStorageLike, "getItem">,
): NoteStorageReadResult {
  try {
    return {
      ok: true,
      value: parseStoredNote(storage.getItem(NOTES_STORAGE_KEY)),
    };
  } catch (error) {
    return { ok: false, reason: classifyNoteStorageError(error) };
  }
}

export function writeStoredNote(
  storage: Pick<NoteStorageLike, "setItem">,
  content: string,
  savedAtMilliseconds: number,
): NoteStorageWriteResult {
  if (content.length > NOTES_MAX_CHARACTERS) {
    return { ok: false, reason: "too-large" };
  }

  let serialized: string;

  try {
    serialized = serializeStoredNote(content, savedAtMilliseconds);
  } catch {
    return { ok: false, reason: "unknown" };
  }

  try {
    storage.setItem(NOTES_STORAGE_KEY, serialized);
    return {
      ok: true,
      savedAt: new Date(savedAtMilliseconds).toISOString(),
    };
  } catch (error) {
    return { ok: false, reason: classifyNoteStorageError(error) };
  }
}

export function clearStoredNote(
  storage: Pick<NoteStorageLike, "removeItem">,
): { ok: true } | { ok: false; reason: NoteStorageFailureReason } {
  try {
    storage.removeItem(NOTES_STORAGE_KEY);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: classifyNoteStorageError(error) };
  }
}

function getBrowserStorage():
  | { ok: true; storage: Storage }
  | { ok: false; reason: NoteStorageFailureReason } {
  if (typeof window === "undefined") {
    return { ok: false, reason: "unavailable" };
  }

  try {
    return { ok: true, storage: window.localStorage };
  } catch (error) {
    return { ok: false, reason: classifyNoteStorageError(error) };
  }
}

function issueMessage(
  issue: NoteIssue,
  isEn: boolean,
  isLoadIssue: boolean,
): string {
  if (issue === "too-large") {
    if (isLoadIssue) {
      return isEn
        ? "The existing stored data is too large to load safely. It is still unchanged and hidden from the editor. Clear it or explicitly confirm replacement with the text above."
        : "Существующие данные слишком велики для безопасной загрузки. Они не изменены и не показаны в редакторе. Очистите их или явно подтвердите замену текстом выше.";
    }

    return isEn
      ? `The note is larger than the ${NOTES_MAX_CHARACTERS.toLocaleString("en-US")}-character limit. Shorten it before saving.`
      : `Заметка превышает лимит в ${NOTES_MAX_CHARACTERS.toLocaleString("ru-RU")} символов. Сократите её перед сохранением.`;
  }

  if (issue === "quota") {
    if (isLoadIssue) {
      return isEn
        ? "The existing storage could not be read because the browser reported a quota error. Data, if present, is unchanged and hidden. Clear it or explicitly confirm replacement with the text above."
        : "Существующее хранилище не удалось прочитать из-за ошибки квоты браузера. Данные, если они есть, не изменены и не показаны. Очистите их или явно подтвердите замену текстом выше.";
    }

    return isEn
      ? "Browser storage is full. The existing saved note was not replaced."
      : "Хранилище браузера заполнено. Ранее сохранённая заметка не была заменена.";
  }

  if (issue === "security") {
    if (isLoadIssue) {
      return isEn
        ? "The browser blocked reading the existing storage. Data, if present, is unchanged and hidden. Clear it or explicitly confirm replacement with the text above."
        : "Браузер заблокировал чтение существующего хранилища. Данные, если они есть, не изменены и не показаны. Очистите их или явно подтвердите замену текстом выше.";
    }

    return isEn
      ? "This browser has blocked access to local storage."
      : "Браузер заблокировал доступ к локальному хранилищу.";
  }

  if (issue === "unavailable") {
    if (isLoadIssue) {
      return isEn
        ? "The existing local storage could not be accessed. Data, if present, is unchanged and hidden. Clear it or explicitly confirm replacement with the text above."
        : "Не удалось получить доступ к существующему локальному хранилищу. Данные, если они есть, не изменены и не показаны. Очистите их или явно подтвердите замену текстом выше.";
    }

    return isEn
      ? "Local browser storage is unavailable."
      : "Локальное хранилище браузера недоступно.";
  }

  if (issue === "malformed") {
    return isEn
      ? "The existing stored data could not be read. It is unchanged and hidden from the editor. Clear it or explicitly confirm replacement with the text above."
      : "Существующие данные не удалось прочитать. Они не изменены и не показаны в редакторе. Очистите их или явно подтвердите замену текстом выше.";
  }

  if (issue === "unsupported-version") {
    return isEn
      ? "The existing stored data uses a newer unsupported format. It is unchanged and hidden from the editor. Clear it or explicitly confirm replacement with the text above."
      : "Существующие данные используют более новый неподдерживаемый формат. Они не изменены и не показаны в редакторе. Очистите их или явно подтвердите замену текстом выше.";
  }

  if (isLoadIssue) {
    return isEn
      ? "The existing storage could not be read. Data, if present, is unchanged and hidden. Clear it or explicitly confirm replacement with the text above."
      : "Существующее хранилище не удалось прочитать. Данные, если они есть, не изменены и не показаны. Очистите их или явно подтвердите замену текстом выше.";
  }

  return isEn
    ? "The note could not be saved because browser storage failed."
    : "Не удалось сохранить заметку из-за ошибки хранилища браузера.";
}

function editorStateFromReadResult(
  readResult: NoteStorageReadResult,
): NoteEditorState {
  if (!readResult.ok) {
    return {
      ...INITIAL_EDITOR_STATE,
      loadStatus: "ready",
      loadIssue: readResult.reason,
    };
  }

  const parsed = readResult.value;

  if (
    parsed.kind === "malformed" ||
    parsed.kind === "unsupported-version" ||
    parsed.kind === "too-large"
  ) {
    return {
      ...INITIAL_EDITOR_STATE,
      loadStatus: "ready",
      loadIssue: parsed.kind,
    };
  }

  return {
    ...INITIAL_EDITOR_STATE,
    loadStatus: "ready",
    note: parsed.content,
    savedNote: parsed.content,
    hasStoredNote: parsed.kind === "valid",
    savedAt: parsed.savedAt,
    needsMigration: parsed.kind === "migrated",
  };
}

export default function Notes() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [editor, setEditor] = useState<NoteEditorState>(INITIAL_EDITOR_STATE);
  const [clearPending, setClearPending] = useState(false);
  const [replacementPending, setReplacementPending] = useState(false);

  const isDirty =
    editor.loadStatus === "ready" &&
    (editor.note !== editor.savedNote || editor.needsMigration);
  const isTooLarge = editor.note.length > NOTES_MAX_CHARACTERS;

  useDirtyBeforeUnload(
    isDirty,
    isEn
      ? "This note has unsaved changes."
      : "В этой заметке есть несохранённые изменения.",
  );

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const storageAccess = getBrowserStorage();
      const nextState = storageAccess.ok
        ? editorStateFromReadResult(readStoredNote(storageAccess.storage))
        : {
            ...INITIAL_EDITOR_STATE,
            loadStatus: "ready" as const,
            loadIssue: storageAccess.reason,
          };

      if (!cancelled) {
        setEditor(nextState);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const saveCurrentNote = () => {
    if (isTooLarge) {
      setEditor((current) => ({
        ...current,
        operationIssue: "too-large",
        lastAction: null,
      }));
      return;
    }

    const storageAccess = getBrowserStorage();
    if (!storageAccess.ok) {
      setEditor((current) => ({
        ...current,
        operationIssue: storageAccess.reason,
        lastAction: null,
      }));
      return;
    }

    const writeResult = writeStoredNote(
      storageAccess.storage,
      editor.note,
      Date.now(),
    );

    if (!writeResult.ok) {
      setEditor((current) => ({
        ...current,
        operationIssue: writeResult.reason,
        lastAction: null,
      }));
      return;
    }

    setEditor((current) => ({
      ...current,
      savedNote: current.note,
      hasStoredNote: true,
      savedAt: writeResult.savedAt,
      needsMigration: false,
      loadIssue: null,
      operationIssue: null,
      lastAction: "saved",
    }));
    setClearPending(false);
    setReplacementPending(false);
  };

  const handleSave = () => {
    const disposition = getNoteSaveDisposition(
      editor.loadIssue,
      editor.note.length,
    );

    if (disposition === "reject-too-large") {
      setEditor((current) => ({
        ...current,
        operationIssue: "too-large",
        lastAction: null,
      }));
      return;
    }

    if (disposition === "confirm-replacement") {
      setReplacementPending(true);
      setClearPending(false);
      return;
    }

    saveCurrentNote();
  };

  const handleClear = () => {
    const storageAccess = getBrowserStorage();
    if (!storageAccess.ok) {
      setEditor((current) => ({
        ...current,
        operationIssue: storageAccess.reason,
        lastAction: null,
      }));
      return;
    }

    const clearResult = clearStoredNote(storageAccess.storage);
    if (!clearResult.ok) {
      setEditor((current) => ({
        ...current,
        operationIssue: clearResult.reason,
        lastAction: null,
      }));
      return;
    }

    setEditor({
      ...INITIAL_EDITOR_STATE,
      loadStatus: "ready",
      lastAction: "cleared",
    });
    setClearPending(false);
    setReplacementPending(false);
  };

  let resultStatus: "idle" | "loading" | "success" | "error" | "empty";
  let resultTitle: string;
  let resultDescription: string;

  const activeIssue =
    (isTooLarge ? "too-large" : null) ??
    editor.operationIssue ??
    editor.loadIssue;
  const activeIssueIsLoadIssue =
    !isTooLarge && editor.operationIssue === null && editor.loadIssue !== null;
  const protectedStoredPayload = requiresStoredNoteReplacementConfirmation(
    editor.loadIssue,
  );

  if (editor.loadStatus === "loading") {
    resultStatus = "loading";
    resultTitle = isEn ? "Loading saved note" : "Загрузка заметки";
    resultDescription = isEn
      ? "Reading this browser's local storage."
      : "Чтение локального хранилища этого браузера.";
  } else if (activeIssue) {
    resultStatus = "error";
    resultTitle =
      activeIssueIsLoadIssue && protectedStoredPayload
        ? isEn
          ? "Stored data protected"
          : "Сохранённые данные защищены"
        : isEn
          ? "Storage error"
          : "Ошибка хранилища";
    resultDescription = issueMessage(activeIssue, isEn, activeIssueIsLoadIssue);
  } else if (editor.needsMigration) {
    resultStatus = "idle";
    resultTitle = isEn ? "Older note format loaded" : "Загружен старый формат";
    resultDescription = isEn
      ? "Review the combined text, then save it to finish the migration."
      : "Проверьте объединённый текст и сохраните его, чтобы завершить перенос.";
  } else if (isDirty) {
    resultStatus = "idle";
    resultTitle = isEn ? "Unsaved changes" : "Есть несохранённые изменения";
    resultDescription = isEn
      ? "Use Save note when you are ready. Changes are not saved automatically."
      : "Когда будете готовы, нажмите «Сохранить заметку». Автосохранения нет.";
  } else if (editor.hasStoredNote) {
    resultStatus = "success";
    resultTitle = isEn ? "Note saved" : "Заметка сохранена";
    resultDescription =
      editor.lastAction === "saved"
        ? isEn
          ? "The current text is stored in this browser."
          : "Текущий текст сохранён в этом браузере."
        : isEn
          ? "The saved text was loaded from this browser."
          : "Сохранённый текст загружен из этого браузера.";
  } else {
    resultStatus = "empty";
    resultTitle =
      editor.lastAction === "cleared"
        ? isEn
          ? "Stored note cleared"
          : "Сохранённая заметка удалена"
        : isEn
          ? "Nothing saved yet"
          : "Пока ничего не сохранено";
    resultDescription = isEn
      ? "Enter text above and save it explicitly."
      : "Введите текст выше и сохраните его вручную.";
  }

  const formattedSavedAt = editor.savedAt
    ? new Date(editor.savedAt).toLocaleString(isEn ? "en-US" : "ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-4 sm:p-6">
        <label
          htmlFor="notes-content"
          className="text-sm font-semibold text-[var(--color-text)]"
        >
          {isEn ? "Note" : "Заметка"}
        </label>
        <Textarea
          id="notes-content"
          value={editor.note}
          onChange={(event) => {
            setEditor((current) => ({
              ...current,
              note: event.target.value,
              operationIssue: null,
              lastAction: null,
            }));
            setClearPending(false);
            setReplacementPending(false);
          }}
          disabled={editor.loadStatus === "loading"}
          aria-invalid={isTooLarge || undefined}
          aria-describedby="notes-character-count"
          rows={14}
          placeholder={
            isEn ? "Write your note here…" : "Введите текст заметки…"
          }
          className="mt-2 min-h-72 resize-y text-base leading-relaxed"
        />

        <div
          id="notes-character-count"
          className={`mt-2 text-right text-xs ${isTooLarge ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"}`}
        >
          {editor.note.length.toLocaleString(isEn ? "en-US" : "ru-RU")} /{" "}
          {NOTES_MAX_CHARACTERS.toLocaleString(isEn ? "en-US" : "ru-RU")}{" "}
          {isEn ? "characters" : "символов"}
        </div>

        <ToolPrimaryAction
          type="button"
          onClick={handleSave}
          disabled={editor.loadStatus === "loading"}
          className="mt-5"
          leadingIcon={
            <FloppyDisk size={20} weight="bold" aria-hidden="true" />
          }
        >
          {isEn ? "Save note" : "Сохранить заметку"}
        </ToolPrimaryAction>

        {replacementPending && protectedStoredPayload ? (
          <div
            className="mt-4 rounded-[var(--radius-md)] border border-[color-mix(in_oklab,var(--color-danger)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_6%,transparent)] p-3"
            role="alert"
          >
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {isEn
                ? "Replace the protected stored data?"
                : "Заменить защищённые сохранённые данные?"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "The hidden existing data will be permanently discarded. Only the text currently shown in the editor will be saved. This cannot be undone."
                : "Скрытые существующие данные будут безвозвратно удалены. Сохранится только текст, который сейчас показан в редакторе. Действие нельзя отменить."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="danger" onClick={saveCurrentNote}>
                {isEn ? "Replace and save" : "Заменить и сохранить"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReplacementPending(false)}
              >
                {isEn ? "Cancel" : "Отмена"}
              </Button>
            </div>
          </div>
        ) : null}

        <ToolResult
          status={resultStatus}
          title={resultTitle}
          description={resultDescription}
          className="mt-5"
        >
          {formattedSavedAt && !activeIssue ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              {isEn ? "Saved at" : "Время сохранения"}: {formattedSavedAt}
            </p>
          ) : null}
        </ToolResult>

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Advanced settings" : "Расширенные настройки"}
          description={
            isEn
              ? "Local storage information and clearing"
              : "Информация о локальном хранении и очистка"
          }
        >
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "The note is stored only in this browser profile. It is not synchronized or permanent and may disappear when site data is cleared, a private session ends, or storage is blocked."
              : "Заметка хранится только в профиле этого браузера. Она не синхронизируется, не является постоянной и может исчезнуть при очистке данных сайта, завершении приватного сеанса или блокировке хранилища."}
          </p>

          {!clearPending ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={editor.loadStatus === "loading"}
              onClick={() => {
                setClearPending(true);
                setReplacementPending(false);
              }}
            >
              <Trash size={18} aria-hidden="true" />
              {isEn ? "Clear stored note" : "Удалить сохранённую заметку"}
            </Button>
          ) : (
            <div className="mt-4 rounded-[var(--radius-md)] border border-[color-mix(in_oklab,var(--color-danger)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_6%,transparent)] p-3">
              <p className="text-sm text-[var(--color-text)]">
                {isEn
                  ? "This also clears the current editor. This action cannot be undone."
                  : "Текущий текст в редакторе тоже будет удалён. Действие нельзя отменить."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="danger" onClick={handleClear}>
                  {isEn ? "Confirm clearing" : "Подтвердить удаление"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setClearPending(false)}
                >
                  {isEn ? "Cancel" : "Отмена"}
                </Button>
              </div>
            </div>
          )}
        </AdvancedSettings>
      </Card>
    </div>
  );
}
