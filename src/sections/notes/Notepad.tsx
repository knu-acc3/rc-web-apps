"use client";

import { Download, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatDate } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { downloadText } from "@/lib/clipboard";
import { Button, buttonClass } from "@/ui/button";
import { Select } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { loadMarkdownRenderer, type MarkdownRenderer } from "../text/lib/markdown";
import { lastWriteFailed } from "../text/lib/storage";
import { graphemeCount, wordCount } from "../text/lib/textOps";
import { MD_PROSE } from "../text/markdownProse";
import { countLabel, FileOpenButton, TX } from "../text/shared";
import { createNote, deleteNote, importNotes, noteTitle, saveNote, useNotes, type Note } from "./notesStore";

const T = {
  ru: {
    notes: "Заметки",
    newNote: "Новая заметка",
    untitled: "Без названия",
    empty: "Заметок пока нет",
    editor: "Текст заметки",
    placeholder: "Начните писать — заметка сохранится автоматически…",
    view: "Режим",
    edit: "Текст",
    preview: "Markdown",
    image: "изображение",
    loading: "Загрузка…",
    saved: "Сохранено в этом браузере",
    notSaved: "Не удалось сохранить: хранилище браузера недоступно или заполнено",
    del: "Удалить",
    confirm: "Удалить заметку?",
    all: "Все (.json)",
    choose: "Выбрать заметку",
    imported: (n: number) => `Импортировано заметок: ${n}`,
    updated: "изменено",
  },
  en: {
    notes: "Notes",
    newNote: "New note",
    untitled: "Untitled",
    empty: "No notes yet",
    editor: "Note text",
    placeholder: "Start typing — the note saves automatically…",
    view: "Mode",
    edit: "Text",
    preview: "Markdown",
    image: "image",
    loading: "Loading…",
    saved: "Saved in this browser",
    notSaved: "Couldn’t save: browser storage is unavailable or full",
    del: "Delete",
    confirm: "Delete this note?",
    all: "All (.json)",
    choose: "Choose a note",
    imported: (n: number) => `Notes imported: ${n}`,
    updated: "edited",
  },
} as const;

function fileName(title: string, ext: string) {
  const base = title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").trim().slice(0, 60) || "note";
  return `${base}.${ext}`;
}

export default function Notepad({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const notes = useNotes();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [confirmDel, setConfirmDel] = useState(false);
  const [renderer, setRenderer] = useState<MarkdownRenderer | null>(null);
  const [message, setMessage] = useState("");

  const active: Note | undefined = notes?.find((n) => n.id === activeId) ?? notes?.[0];

  useEffect(() => {
    if (mode !== "preview" || renderer) return;
    let alive = true;
    loadMarkdownRenderer(t.image).then((r) => {
      if (alive) setRenderer(r);
    });
    return () => {
      alive = false;
    };
  }, [mode, renderer, t.image]);

  useEffect(() => {
    if (!confirmDel) return;
    const timer = setTimeout(() => setConfirmDel(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmDel]);

  const text = active?.text ?? "";
  const html = useMemo(() => (mode === "preview" && renderer ? renderer.preview(text) : ""), [mode, renderer, text]);

  function onChange(v: string) {
    if (active) saveNote(active, v);
    else setActiveId(createNote(v));
  }

  function onImport(content: string, name: string) {
    if (/\.json$/i.test(name)) {
      try {
        const data = JSON.parse(content) as unknown;
        const list = Array.isArray(data) ? data : [];
        const n = importNotes(list.filter((x): x is { text: string } => !!x && typeof (x as { text?: unknown }).text === "string"));
        setMessage(t.imported(n));
        return;
      } catch {
        // not a notes backup: import as plain text below
      }
    }
    setActiveId(createNote(content));
    setMode("edit");
  }

  const title = active ? noteTitle(active.text, t.untitled) : t.untitled;
  const list = notes ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Notes list: sidebar on desktop, select on mobile */}
      <aside className="hidden min-w-0 flex-col gap-2 lg:flex" aria-label={t.notes}>
        <Button variant="primary" onClick={() => setActiveId(createNote(""))} className="w-full">
          <Plus aria-hidden />
          {t.newNote}
        </Button>
        {list.length === 0 ? (
          <p className="px-1 py-2 text-sm text-fg-3">{t.empty}</p>
        ) : (
          <ul className="flex max-h-[34rem] flex-col gap-1 overflow-y-auto">
            {list.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(n.id);
                    setConfirmDel(false);
                  }}
                  aria-current={n.id === active?.id ? "true" : undefined}
                  className={cn(
                    "flex w-full flex-col items-start rounded-[8px] px-3 py-2 text-left transition-colors duration-150",
                    n.id === active?.id ? "bg-accent-soft text-accent" : "text-fg hover:bg-surface-2",
                  )}
                >
                  <span className="w-full truncate text-sm font-medium">{noteTitle(n.text, t.untitled)}</span>
                  <span className="text-[12px] text-fg-3">{formatDate(locale, new Date(n.updated), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 lg:hidden">
          {list.length > 0 && (
            <Select aria-label={t.choose} value={active?.id ?? ""} onChange={(e) => setActiveId(e.target.value)} size="sm" className="min-w-0 flex-1">
              {list.map((n) => (
                <option key={n.id} value={n.id}>
                  {noteTitle(n.text, t.untitled)}
                </option>
              ))}
            </Select>
          )}
          <Button variant="primary" size="sm" onClick={() => setActiveId(createNote(""))}>
            <Plus aria-hidden />
            {t.newNote}
          </Button>
        </div>

        <div className="flex min-w-0 flex-col overflow-hidden rounded-[12px] border border-line bg-surface">
          <div className="flex min-h-11 items-center justify-between gap-2 border-b border-line px-3 py-1.5">
            <label htmlFor={`${id}-note`} className="min-w-0 truncate text-sm font-semibold text-fg">
              {active ? title : t.editor}
            </label>
            <Segmented
              label={t.view}
              value={mode}
              onChange={setMode}
              size="sm"
              options={[
                { value: "edit", label: t.edit },
                { value: "preview", label: t.preview },
              ]}
            />
          </div>
          {mode === "edit" ? (
            <textarea
              id={`${id}-note`}
              value={text}
              onChange={(e) => onChange(e.target.value)}
              placeholder={t.placeholder}
              rows={20}
              className="min-h-96 w-full resize-y bg-transparent px-4 py-3 text-[16px] leading-relaxed text-fg placeholder:text-fg-3 focus:outline-none"
            />
          ) : renderer ? (
            <div className={cn(MD_PROSE, "min-h-96 px-4 py-3")} dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="min-h-96 px-4 py-3 text-sm text-fg-3">{t.loading}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="tabular mr-auto text-fg-3">
            {countLabel(locale, wordCount(text, locale), TX[locale].words)} · {countLabel(locale, graphemeCount(text), TX[locale].chars)}
            {" · "}
            {lastWriteFailed() ? <span className="text-warn">{t.notSaved}</span> : t.saved}
            {message && <span className="ml-2 text-ok">{message}</span>}
          </span>
          <FileOpenButton locale={locale} accept=".txt,.md,.markdown,.json,text/plain,text/markdown,application/json" onText={onImport} />
          <button type="button" className={buttonClass("ghost", "sm")} disabled={!text} onClick={() => downloadText(text, fileName(title, "txt"))}>
            <Download aria-hidden />
            .txt
          </button>
          <button type="button" className={buttonClass("ghost", "sm")} disabled={!text} onClick={() => downloadText(text, fileName(title, "md"), "text/markdown;charset=utf-8")}>
            <Download aria-hidden />
            .md
          </button>
          <button
            type="button"
            className={buttonClass("ghost", "sm")}
            disabled={!list.length}
            onClick={() =>
              downloadText(
                JSON.stringify(list.map(({ text: tx, created, updated }) => ({ text: tx, created, updated })), null, 2),
                "notes.json",
                "application/json;charset=utf-8",
              )
            }
          >
            <Download aria-hidden />
            {t.all}
          </button>
          {active && (
            <button
              type="button"
              className={buttonClass(confirmDel ? "danger" : "ghost", "sm")}
              onClick={() => {
                if (!confirmDel) return setConfirmDel(true);
                deleteNote(active.id);
                setActiveId(null);
                setConfirmDel(false);
              }}
            >
              <Trash2 aria-hidden />
              {confirmDel ? t.confirm : t.del}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
