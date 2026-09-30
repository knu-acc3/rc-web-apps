"use client";

import { Download, GripVertical, ListPlus, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { downloadText } from "@/lib/clipboard";
import { Button, buttonClass } from "@/ui/button";
import { Input, Select } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { lastWriteFailed } from "../text/lib/storage";
import { countLabel, FileOpenButton, MoreOptions } from "../text/shared";
import { templateItems, TEMPLATES, type TemplateId } from "./templates";
import { createList, deleteList, moveItem, newId, readItems, readLists, useTodo, writeItems, writeLists, type TodoItem } from "./todoStore";

const T = {
  ru: {
    add: "Добавить",
    newTask: "Новая задача",
    placeholder: "Что нужно сделать?",
    due: "Срок",
    list: "Список",
    newList: "Новый список",
    listName: "Название списка",
    defaultName: "Мои дела",
    newListName: "Новый список",
    all: "Все",
    active: "Активные",
    done: "Выполненные",
    filter: "Показать",
    clearDone: "Удалить выполненные",
    deleteList: "Удалить список",
    confirmDelete: "Точно удалить список?",
    empty: "Задач пока нет — добавьте первую.",
    nothing: "Здесь пусто.",
    progress: (d: number, n: number) => `Выполнено ${d} из ${n}`,
    move: (t: string) => `Переместить «${t}»: стрелки вверх и вниз`,
    moved: (i: number, n: number) => `Перемещено на позицию ${i} из ${n}`,
    remove: (t: string) => `Удалить «${t}»`,
    doneLabel: (t: string) => `Выполнено: ${t}`,
    edit: (t: string) => `Текст задачи: ${t}`,
    dueLabel: (t: string) => `Срок для «${t}»`,
    overdue: "просрочено",
    today: "сегодня",
    saved: "Списки сохраняются только в этом браузере.",
    notSaved: "Не удалось сохранить: хранилище браузера недоступно или заполнено.",
    template: "Шаблон",
    useTemplate: "Создать список из шаблона",
    items: ["пункт", "пункта", "пунктов"],
    tasks: ["задача", "задачи", "задач"],
    imported: (n: number) => `Добавлено задач: ${n}`,
  },
  en: {
    add: "Add",
    newTask: "New task",
    placeholder: "What needs to be done?",
    due: "Due",
    list: "List",
    newList: "New list",
    listName: "List name",
    defaultName: "My tasks",
    newListName: "New list",
    all: "All",
    active: "Active",
    done: "Done",
    filter: "Show",
    clearDone: "Clear completed",
    deleteList: "Delete list",
    confirmDelete: "Really delete the list?",
    empty: "No tasks yet — add the first one.",
    nothing: "Nothing here.",
    progress: (d: number, n: number) => `${d} of ${n} done`,
    move: (t: string) => `Move “${t}”: use the up and down arrows`,
    moved: (i: number, n: number) => `Moved to position ${i} of ${n}`,
    remove: (t: string) => `Delete “${t}”`,
    doneLabel: (t: string) => `Done: ${t}`,
    edit: (t: string) => `Task text: ${t}`,
    dueLabel: (t: string) => `Due date for “${t}”`,
    overdue: "overdue",
    today: "today",
    saved: "Lists are saved in this browser only.",
    notSaved: "Couldn’t save: browser storage is unavailable or full.",
    template: "Template",
    useTemplate: "Create a list from the template",
    items: ["item", "items"],
    tasks: ["task", "tasks"],
    imported: (n: number) => `Tasks added: ${n}`,
  },
} as const;

type Filter = "all" | "active" | "done";

function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function TodoList({ locale, template }: { locale: Locale; template?: TemplateId }) {
  const t = T[locale];
  const id = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const data = useTodo(activeId);
  const [draft, setDraft] = useState("");
  const [draftDue, setDraftDue] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [today, setToday] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [drag, setDrag] = useState<{ id: string; over: number } | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());

  // The date is read on the client after mount (never during server render).
  useEffect(() => {
    const timer = setTimeout(() => setToday(localDate(new Date())), 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!confirmDel) return;
    const timer = setTimeout(() => setConfirmDel(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmDel]);

  const lists = data?.lists ?? [];
  const listId = data?.listId ?? null;
  const items = data?.items ?? [];
  const list = lists.find((l) => l.id === listId);

  /** Ensure a list exists and return its id (the first task creates "My tasks"). */
  const ensureList = () => {
    if (listId) return listId;
    const nid = createList(t.defaultName);
    setActiveId(nid);
    return nid;
  };
  const update = (fn: (items: TodoItem[]) => TodoItem[]) => {
    const lid = ensureList();
    writeItems(lid, fn(readItems(lid)));
  };

  function add() {
    const text = draft.trim();
    if (!text) return;
    update((xs) => [...xs, { id: newId(), text, done: false, due: draftDue }]);
    setDraft("");
    setDraftDue("");
  }

  function move(itemId: string, delta: number) {
    const from = items.findIndex((i) => i.id === itemId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= items.length) return;
    update((xs) => moveItem(xs, from, to));
    setAnnounce(t.moved(to + 1, items.length));
  }

  function pointerTarget(clientY: number): number {
    let target = items.length;
    for (let i = 0; i < items.length; i++) {
      const el = rows.current.get(items[i].id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientY < r.top + r.height / 2) {
        target = i;
        break;
      }
    }
    return target;
  }

  const shown = items.filter((i) => (filter === "all" ? true : filter === "done" ? i.done : !i.done));
  const doneCount = items.filter((i) => i.done).length;
  const tpl = template ? TEMPLATES[template][locale] : null;

  function exportMd() {
    const md = `# ${list?.name ?? t.defaultName}\n\n${items.map((i) => `- [${i.done ? "x" : " "}] ${i.text}${i.due ? ` (${t.due}: ${i.due})` : ""}`).join("\n")}\n`;
    downloadText(md, `${(list?.name ?? "todo").slice(0, 60)}.md`, "text/markdown;charset=utf-8");
  }

  function onImport(content: string, name: string) {
    let texts: string[] = [];
    if (/\.json$/i.test(name)) {
      try {
        const data = JSON.parse(content) as unknown;
        const arr = Array.isArray(data) ? data : Array.isArray((data as { items?: unknown }).items) ? (data as { items: unknown[] }).items : [];
        texts = arr.map((x) => (typeof x === "string" ? x : typeof (x as { text?: unknown }).text === "string" ? (x as { text: string }).text : "")).filter(Boolean);
      } catch {
        texts = [];
      }
    } else {
      texts = content
        .split(/\r\n|\r|\n/)
        .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])?\s*(?:\[[ xX]\]\s*)?/, "").trim())
        .filter((l) => l && !l.startsWith("#"));
    }
    if (!texts.length) return;
    update((xs) => [...xs, ...texts.map((text) => ({ id: newId(), text, done: false, due: "" }))]);
    setAnnounce(t.imported(texts.length));
  }

  return (
    <div className="flex flex-col gap-4">
      {tpl && (
        <Notice className="flex flex-wrap items-center justify-between gap-3">
          <span>
            {t.template}: <strong className="text-fg">{tpl.name}</strong> · {countLabel(locale, templateItems(template!, locale).length, t.items)}
          </span>
          <Button size="sm" variant="primary" onClick={() => setActiveId(createList(tpl.name, templateItems(template!, locale)))}>
            <ListPlus aria-hidden />
            {t.useTemplate}
          </Button>
        </Notice>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {lists.length > 1 ? (
          <Select aria-label={t.list} value={listId ?? ""} onChange={(e) => setActiveId(e.target.value)} size="sm" className="min-w-0 flex-1 sm:max-w-72">
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        ) : (
          <h2 className="mr-auto min-w-0 truncate text-lg font-semibold text-fg">{list?.name ?? t.defaultName}</h2>
        )}
        <Button size="sm" variant="ghost" onClick={() => setActiveId(createList(t.newListName))}>
          <Plus aria-hidden />
          {t.newList}
        </Button>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label htmlFor={`${id}-new`} className="sr-only">
          {t.newTask}
        </label>
        <Input id={`${id}-new`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.placeholder} size="lg" className="min-w-0 flex-1 basis-60 text-base! font-normal!" autoComplete="off" />
        <label htmlFor={`${id}-due`} className="sr-only">
          {t.due}
        </label>
        <Input id={`${id}-due`} type="date" value={draftDue} onChange={(e) => setDraftDue(e.target.value)} size="lg" className="w-44 text-base! font-normal!" title={t.due} />
        <Button type="submit" variant="primary" size="lg" disabled={!draft.trim()}>
          <Plus aria-hidden />
          {t.add}
        </Button>
      </form>

      <div className="rounded-[12px] border border-line bg-surface">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-fg-3">{t.empty}</p>
        ) : shown.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-fg-3">{t.nothing}</p>
        ) : (
          <ul>
            {shown.map((item) => {
              const idx = items.indexOf(item);
              const overdue = !!today && !!item.due && !item.done && item.due < today;
              return (
                <li
                  key={item.id}
                  ref={(el) => {
                    if (el) rows.current.set(item.id, el);
                    else rows.current.delete(item.id);
                  }}
                  className={cn(
                    "group flex items-center gap-2 border-b border-line px-2 py-1.5 last:border-b-0",
                    drag?.id === item.id && "bg-surface-2",
                    drag && drag.over === idx && drag.id !== item.id && "shadow-[inset_0_2px_0_var(--accent)]",
                  )}
                >
                  <button
                    type="button"
                    aria-label={t.move(item.text)}
                    title={t.move(item.text)}
                    className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-[6px] text-fg-3 hover:bg-surface-2 hover:text-fg active:cursor-grabbing"
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                        if (filter === "all") move(item.id, e.key === "ArrowUp" ? -1 : 1);
                      }
                    }}
                    onPointerDown={(e) => {
                      if (filter !== "all") return;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setDrag({ id: item.id, over: idx });
                    }}
                    onPointerMove={(e) => {
                      if (drag?.id === item.id) setDrag({ id: item.id, over: pointerTarget(e.clientY) });
                    }}
                    onPointerUp={() => {
                      if (drag?.id === item.id) {
                        const to = drag.over > idx ? drag.over - 1 : drag.over;
                        if (to !== idx) {
                          update((xs) => moveItem(xs, idx, to));
                          setAnnounce(t.moved(to + 1, items.length));
                        }
                      }
                      setDrag(null);
                    }}
                    onPointerCancel={() => setDrag(null)}
                  >
                    <GripVertical className="size-4" aria-hidden />
                  </button>
                  <input
                    type="checkbox"
                    checked={item.done}
                    aria-label={t.doneLabel(item.text)}
                    onChange={(e) => update((xs) => xs.map((x) => (x.id === item.id ? { ...x, done: e.target.checked } : x)))}
                    className="size-[18px] shrink-0 cursor-pointer accent-[var(--accent)]"
                  />
                  <input
                    value={item.text}
                    aria-label={t.edit(item.text)}
                    onChange={(e) => update((xs) => xs.map((x) => (x.id === item.id ? { ...x, text: e.target.value } : x)))}
                    className={cn(
                      "min-w-0 flex-1 rounded-[6px] bg-transparent px-2 py-1.5 text-[15px] focus:bg-surface-2 focus:outline-none",
                      item.done ? "text-fg-3 line-through" : "text-fg",
                    )}
                  />
                  <input
                    type="date"
                    value={item.due}
                    aria-label={t.dueLabel(item.text)}
                    onChange={(e) => update((xs) => xs.map((x) => (x.id === item.id ? { ...x, due: e.target.value } : x)))}
                    className={cn(
                      "hidden w-36 shrink-0 rounded-[6px] bg-transparent px-1.5 py-1 text-[13px] sm:block",
                      item.due ? (overdue ? "text-err" : "text-fg-2") : "text-fg-3 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100",
                    )}
                  />
                  {overdue && <span className="shrink-0 text-[12px] text-err sm:hidden">{t.overdue}</span>}
                  <button
                    type="button"
                    aria-label={t.remove(item.text)}
                    title={t.remove(item.text)}
                    onClick={() => update((xs) => xs.filter((x) => x.id !== item.id))}
                    className="flex size-8 shrink-0 items-center justify-center rounded-[6px] text-fg-3 opacity-60 hover:bg-err-soft hover:text-err hover:opacity-100 focus:opacity-100"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Segmented
          label={t.filter}
          value={filter}
          onChange={setFilter}
          size="sm"
          options={[
            { value: "all", label: t.all },
            { value: "active", label: t.active },
            { value: "done", label: t.done },
          ]}
        />
        <span className="tabular text-fg-2">{t.progress(doneCount, items.length)}</span>
        {doneCount > 0 && (
          <button type="button" className={buttonClass("ghost", "sm")} onClick={() => update((xs) => xs.filter((x) => !x.done))}>
            {t.clearDone}
          </button>
        )}
        <span className="sr-only" aria-live="polite">
          {announce}
        </span>
      </div>

      <MoreOptions locale={locale}>
        {list && (
          <label className="flex items-center gap-2">
            <span className="text-fg-2">{t.listName}</span>
            <Input
              value={list.name}
              onChange={(e) => writeLists(readLists().map((l) => (l.id === list.id ? { ...l, name: e.target.value } : l)))}
              size="sm"
              className="w-56"
            />
          </label>
        )}
        <FileOpenButton locale={locale} accept=".txt,.md,.json,text/plain,text/markdown,application/json" onText={onImport} />
        <button type="button" className={buttonClass("ghost", "sm")} disabled={!items.length} onClick={exportMd}>
          <Download aria-hidden />
          .md
        </button>
        <button
          type="button"
          className={buttonClass("ghost", "sm")}
          disabled={!items.length}
          onClick={() => downloadText(JSON.stringify({ name: list?.name, items }, null, 2), `${(list?.name ?? "todo").slice(0, 60)}.json`, "application/json;charset=utf-8")}
        >
          <Download aria-hidden />
          .json
        </button>
        {list && (
          <button
            type="button"
            className={buttonClass(confirmDel ? "danger" : "ghost", "sm")}
            onClick={() => {
              if (!confirmDel) return setConfirmDel(true);
              deleteList(list.id);
              setActiveId(null);
              setConfirmDel(false);
            }}
          >
            {confirmDel ? t.confirmDelete : t.deleteList}
          </button>
        )}
        <p className="w-full text-[13px] text-fg-3">{lastWriteFailed() ? t.notSaved : t.saved}</p>
      </MoreOptions>
      <p className="sr-only">{countLabel(locale, items.length, t.tasks)}</p>
    </div>
  );
}
