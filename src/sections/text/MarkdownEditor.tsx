"use client";

import { Bold, Code, Download, Heading2, Italic, Link2, List, ListChecks, Quote, RotateCcw, Strikethrough, Table } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { downloadText } from "@/lib/clipboard";
import { buttonClass } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Segmented } from "@/ui/segmented";
import { htmlDocument, loadMarkdownRenderer, type MarkdownRenderer } from "./lib/markdown";
import { lastWriteFailed, useStoredString, writeKey } from "./lib/storage";
import { graphemeCount, wordCount } from "./lib/textOps";
import { MD_PROSE } from "./markdownProse";
import { countLabel, FileOpenButton, TX } from "./shared";

const KEY = "md-editor:draft:v1";

const T = {
  ru: {
    editor: "Редактор Markdown",
    preview: "Предпросмотр",
    view: "Вид",
    split: "Рядом",
    edit: "Текст",
    show: "Просмотр",
    md: ".md",
    html: ".html",
    copyHtml: "Копировать HTML",
    copied: "HTML скопирован",
    reset: "Вернуть пример",
    saved: "Черновик сохраняется в этом браузере",
    notSaved: "Не удалось сохранить черновик: хранилище браузера недоступно",
    image: "изображение",
    loading: "Загрузка…",
    tools: "Форматирование",
    bold: "Жирный",
    italic: "Курсив",
    strike: "Зачёркнутый",
    heading: "Заголовок",
    link: "Ссылка",
    list: "Список",
    task: "Список задач",
    code: "Код",
    quote: "Цитата",
    table: "Таблица",
    linkText: "текст ссылки",
    sample: `# Заголовок документа

Обычный абзац с **жирным**, *курсивом*, ~~зачёркнутым~~ и \`кодом\`.
Ссылка: [пример](https://example.com).

## Список дел

- [x] Написать черновик
- [ ] Проверить опечатки
- [ ] Отправить

> Цитата: Markdown превращается в HTML прямо в браузере.

| Команда | Что делает |
|---|---|
| \`**текст**\` | жирный |
| \`*текст*\` | курсив |

\`\`\`js
console.log("Привет, Markdown!");
\`\`\`

---

1. Первый пункт
2. Второй пункт`,
  },
  en: {
    editor: "Markdown editor",
    preview: "Preview",
    view: "View",
    split: "Split",
    edit: "Editor",
    show: "Preview",
    md: ".md",
    html: ".html",
    copyHtml: "Copy HTML",
    copied: "HTML copied",
    reset: "Restore example",
    saved: "The draft is saved in this browser",
    notSaved: "Couldn’t save the draft: browser storage is unavailable",
    image: "image",
    loading: "Loading…",
    tools: "Formatting",
    bold: "Bold",
    italic: "Italic",
    strike: "Strikethrough",
    heading: "Heading",
    link: "Link",
    list: "List",
    task: "Task list",
    code: "Code",
    quote: "Quote",
    table: "Table",
    linkText: "link text",
    sample: `# Document title

A paragraph with **bold**, *italic*, ~~strikethrough~~ and \`code\`.
A link: [example](https://example.com).

## To-do

- [x] Write a draft
- [ ] Proofread
- [ ] Send

> A quote: Markdown is converted to HTML right in your browser.

| Syntax | Result |
|---|---|
| \`**text**\` | bold |
| \`*text*\` | italic |

\`\`\`js
console.log("Hello, Markdown!");
\`\`\`

---

1. First item
2. Second item`,
  },
} as const;

type Action = { key: string; icon: typeof Bold; label: keyof (typeof T)["ru"]; wrap?: [string, string]; line?: string; block?: string };
const ACTIONS: Action[] = [
  { key: "b", icon: Bold, label: "bold", wrap: ["**", "**"] },
  { key: "i", icon: Italic, label: "italic", wrap: ["*", "*"] },
  { key: "s", icon: Strikethrough, label: "strike", wrap: ["~~", "~~"] },
  { key: "h", icon: Heading2, label: "heading", line: "## " },
  { key: "l", icon: Link2, label: "link", wrap: ["[", "](https://)"] },
  { key: "u", icon: List, label: "list", line: "- " },
  { key: "t", icon: ListChecks, label: "task", line: "- [ ] " },
  { key: "c", icon: Code, label: "code", wrap: ["`", "`"] },
  { key: "q", icon: Quote, label: "quote", line: "> " },
  { key: "tb", icon: Table, label: "table", block: "\n| A | B |\n|---|---|\n| 1 | 2 |\n" },
];

const noopSubscribe = () => () => {};

export default function MarkdownEditor({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const stored = useStoredString(KEY);
  const text = stored ?? t.sample;
  const [view, setView] = useState<"split" | "edit" | "show">("split");
  const [renderer, setRenderer] = useState<MarkdownRenderer | null>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    let alive = true;
    loadMarkdownRenderer(t.image).then((r) => {
      if (alive) setRenderer(r);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf.current);
    };
  }, [t.image]);

  const html = useMemo(() => (renderer ? renderer.preview(text) : ""), [renderer, text]);
  const setText = (v: string) => writeKey(KEY, v);

  function apply(a: Action) {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = text.slice(s, e);
    let next: string;
    let cs: number;
    let ce: number;
    if (a.wrap) {
      const inner = sel || (a.label === "link" ? t.linkText : "");
      next = text.slice(0, s) + a.wrap[0] + inner + a.wrap[1] + text.slice(e);
      cs = s + a.wrap[0].length;
      ce = cs + inner.length;
    } else if (a.line) {
      const ls = text.lastIndexOf("\n", s - 1) + 1;
      const block = text.slice(ls, e).split("\n").map((l) => a.line + l).join("\n");
      next = text.slice(0, ls) + block + text.slice(e);
      cs = ls;
      ce = ls + block.length;
    } else {
      next = text.slice(0, e) + a.block + text.slice(e);
      cs = ce = e + a.block!.length;
    }
    setText(next);
    raf.current = requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cs, ce);
    });
  }

  const exportHtml = () => (renderer ? renderer.exportHtml(text) : "");
  const title = (text.match(/^#\s+(.+)$/m)?.[1] ?? "document").trim();
  // Word segmentation (Intl.Segmenter) can differ between the server's ICU and the browser's, so counts render after hydration.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const stats = hydrated ? `${countLabel(locale, wordCount(text, locale), TX[locale].words)} · ${countLabel(locale, graphemeCount(text), TX[locale].chars)}` : " ";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="toolbar" aria-label={t.tools} className="flex flex-wrap items-center gap-0.5">
          {ACTIONS.map((a) => (
            <button key={a.key} type="button" className={buttonClass("ghost", "icon-sm")} title={t[a.label] as string} aria-label={t[a.label] as string} onClick={() => apply(a)} disabled={view === "show"}>
              <a.icon aria-hidden />
            </button>
          ))}
        </div>
        <Segmented
          label={t.view}
          value={view}
          onChange={setView}
          size="sm"
          options={[
            { value: "split", label: t.split },
            { value: "edit", label: t.edit },
            { value: "show", label: t.show },
          ]}
        />
      </div>

      <div className={cn("grid gap-4", view === "split" && "lg:grid-cols-2")}>
        {view !== "show" && (
          <div className="flex min-w-0 flex-col overflow-hidden rounded-[12px] border border-line bg-surface">
            <label htmlFor={`${id}-md`} className="border-b border-line px-3 py-2 text-sm font-semibold text-fg">
              {t.editor}
            </label>
            <textarea
              ref={ta}
              id={`${id}-md`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              rows={22}
              className="min-h-80 w-full flex-1 resize-y bg-transparent px-3 py-2.5 font-mono text-sm leading-relaxed text-fg focus:outline-none"
            />
          </div>
        )}
        {view !== "edit" && (
          <section aria-label={t.preview} className="min-w-0 overflow-hidden rounded-[12px] border border-line bg-surface">
            <div className="border-b border-line px-3 py-2 text-sm font-semibold text-fg">{t.preview}</div>
            {renderer ? (
              <div className={cn(MD_PROSE, "max-h-[40rem] overflow-auto px-4 py-3")} dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="px-4 py-3 text-sm text-fg-3">{t.loading}</p>
            )}
          </section>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="tabular mr-auto text-fg-3">
          {stats} · {lastWriteFailed() ? <span className="text-warn">{t.notSaved}</span> : t.saved}
        </span>
        <FileOpenButton locale={locale} accept=".md,.markdown,.txt,text/markdown,text/plain" onText={(v) => setText(v)} />
        <button type="button" className={buttonClass("ghost", "sm")} onClick={() => writeKey(KEY, null)} disabled={stored === null}>
          <RotateCcw aria-hidden />
          <span className="max-sm:sr-only">{t.reset}</span>
        </button>
        <button type="button" className={buttonClass("ghost", "sm")} onClick={() => downloadText(text, `${title.slice(0, 60) || "document"}.md`, "text/markdown;charset=utf-8")}>
          <Download aria-hidden />
          {t.md}
        </button>
        <button
          type="button"
          className={buttonClass("ghost", "sm")}
          disabled={!renderer}
          onClick={() => downloadText(htmlDocument(exportHtml(), title, locale), `${title.slice(0, 60) || "document"}.html`, "text/html;charset=utf-8")}
        >
          <Download aria-hidden />
          {t.html}
        </button>
        <CopyButton value={exportHtml} label={t.copyHtml} copiedLabel={t.copied} variant="secondary" />
      </div>
    </div>
  );
}
