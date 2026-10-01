"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Checkbox, Field, Input } from "@/ui/field";
import { replaceText, type ReplaceRequest, type ReplaceResult } from "./lib/replace";
import { InlineSelect, InputPanel, MoreOptions, OptionsBar, OutputPanel, TwoPane, useDebounced } from "./ui/shared";

const T = {
  ru: {
    find: "Найти",
    replace: "Заменить на",
    regex: "Регулярное выражение",
    caseSensitive: "Учитывать регистр",
    wholeWord: "Слово целиком",
    multiline: "^ и $ — начало и конец строки (флаг m)",
    dotAll: "Точка захватывает перенос (флаг s)",
    all: "Заменить все",
    escapes: "Понимать \\n и \\t в замене",
    presets: "Быстрые замены",
    matches: ["совпадение", "совпадения", "совпадений"],
    found: "Найдено",
    timeout: "Выражение выполняется дольше 2 секунд и было остановлено. Проверьте его на катастрофический возврат (например, (a+)+).",
    invalid: "Ошибка в регулярном выражении",
    working: "Выполняется…",
    groupsHint: "В замене доступны $1, $2…, $<имя> и $& (всё совпадение).",
    sample: "Москва — столица России.  Алматы —   крупнейший город Казахстана.\n\n\nАстана, Алматы и Шымкент — города республиканского значения.",
    p1: "Двойные пробелы → один",
    p2: "Переносы строк → пробел",
    p3: "Удалить пустые строки",
    p4: "Пробелы по краям строк",
    p5: "Табуляция → 4 пробела",
    p6: "Удалить цифры",
  },
  en: {
    find: "Find",
    replace: "Replace with",
    regex: "Regular expression",
    caseSensitive: "Match case",
    wholeWord: "Whole word",
    multiline: "^ and $ match line starts/ends (m flag)",
    dotAll: "Dot matches line breaks (s flag)",
    all: "Replace all",
    escapes: "Interpret \\n and \\t in replacement",
    presets: "Quick replacements",
    matches: ["match", "matches"],
    found: "Found",
    timeout: "The expression ran for more than 2 seconds and was stopped. Check it for catastrophic backtracking (e.g. (a+)+).",
    invalid: "Invalid regular expression",
    working: "Working…",
    groupsHint: "Use $1, $2…, $<name> and $& (whole match) in the replacement.",
    sample: "London is the capital of England.  Paris is   the capital of France.\n\n\nBerlin, Madrid and Rome are capitals too.",
    p1: "Double spaces → one",
    p2: "Line breaks → space",
    p3: "Remove empty lines",
    p4: "Trim line edges",
    p5: "Tab → 4 spaces",
    p6: "Remove digits",
  },
} as const;

type Flags = Omit<ReplaceRequest, "text" | "find" | "replace">;

const PRESETS: { key: "p1" | "p2" | "p3" | "p4" | "p5" | "p6"; find: string; replace: string }[] = [
  { key: "p1", find: "[ \\t]{2,}", replace: " " },
  { key: "p2", find: "[ \\t]*\\n\\s*", replace: " " },
  { key: "p3", find: "^[ \\t]*\\n", replace: "" },
  { key: "p4", find: "^[ \\t]+|[ \\t]+$", replace: "" },
  { key: "p5", find: "\\t", replace: "    " },
  { key: "p6", find: "\\d+", replace: "" },
];

const TIMEOUT_MS = 2000;

export interface FindReplaceProps {
  locale: Locale;
  find?: string;
  replace?: string;
  regex?: boolean;
}

export default function FindReplace({ locale, find: find0, replace: replace0 = "", regex: regex0 = false }: FindReplaceProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState<string>(t.sample);
  const [find, setFind] = useState(find0 ?? (locale === "ru" ? "Алматы" : "capital"));
  const [replacement, setReplacement] = useState(replace0 || (locale === "ru" ? "Алма-Ата" : "main city"));
  const [flags, setFlags] = useState<Flags>({ regex: regex0, caseSensitive: false, wholeWord: false, multiline: true, dotAll: false, all: true, escapes: false });
  const set = (k: keyof Flags) => (e: React.ChangeEvent<HTMLInputElement>) => setFlags((f) => ({ ...f, [k]: e.target.checked }));

  const req: ReplaceRequest = useMemo(() => ({ text, find, replace: replacement, ...flags }), [text, find, replacement, flags]);
  // Literal search is linear-time and runs right here; regular expressions run in a worker.
  const direct = useMemo<ReplaceResult | null>(() => (flags.regex ? null : replaceText(req)), [flags.regex, req]);
  const debouncedReq = useDebounced(req, 200);
  const [workerRes, setWorkerRes] = useState<{ req: ReplaceRequest; res: ReplaceResult | "timeout" } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!debouncedReq.regex) return;
    const myId = ++seq.current;
    const r = debouncedReq;
    if (!workerRef.current) workerRef.current = new Worker(new URL("./lib/replace.worker.ts", import.meta.url), { type: "module" });
    const w = workerRef.current;
    // A runaway expression can't be interrupted inside the worker, so the worker is terminated.
    const timer = setTimeout(() => {
      w.terminate();
      if (workerRef.current === w) workerRef.current = null;
      setWorkerRes({ req: r, res: "timeout" });
    }, TIMEOUT_MS);
    const onMsg = (e: MessageEvent<{ id: number; res: ReplaceResult }>) => {
      if (e.data.id !== myId) return;
      clearTimeout(timer);
      setWorkerRes({ req: r, res: e.data.res });
    };
    w.addEventListener("message", onMsg);
    w.postMessage({ id: myId, req: debouncedReq });
    return () => {
      clearTimeout(timer);
      w.removeEventListener("message", onMsg);
    };
  }, [debouncedReq]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const pending = flags.regex && (debouncedReq !== req || workerRes?.req !== debouncedReq);
  const res: ReplaceResult | "timeout" | null = flags.regex ? (workerRes?.res ?? null) : direct;
  const output = res && res !== "timeout" && res.ok ? res.text : res === null ? text : "";
  const status =
    res === "timeout" ? (
      <span className="text-err">{t.timeout}</span>
    ) : res && !res.ok ? (
      <span className="text-err">
        {t.invalid}: {res.error}
      </span>
    ) : res && res.ok ? (
      `${t.found}: ${formatNumber(locale, res.count)} ${plural(locale, res.count, t.matches)}`
    ) : null;
  const statusText =
    res === "timeout" ? t.timeout : res && !res.ok ? `${t.invalid}: ${res.error}` : res && res.ok ? `${t.found}: ${formatNumber(locale, res.count)} ${plural(locale, res.count, t.matches)}` : "";
  // Screen readers hear the count once the user pauses, not on every keystroke.
  const announce = useDebounced(pending ? "" : statusText, 700);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.find} htmlFor={`${id}-f`}>
          <Input id={`${id}-f`} value={find} onChange={(e) => setFind(e.target.value)} className={cn(flags.regex && "font-mono")} autoComplete="off" spellCheck={false} />
        </Field>
        <Field label={t.replace} htmlFor={`${id}-r`} hint={flags.regex ? t.groupsHint : undefined}>
          <Input id={`${id}-r`} value={replacement} onChange={(e) => setReplacement(e.target.value)} className={cn(flags.regex && "font-mono")} autoComplete="off" spellCheck={false} />
        </Field>
      </div>
      <OptionsBar>
        <Checkbox label={t.caseSensitive} checked={flags.caseSensitive} onChange={set("caseSensitive")} />
        <Checkbox label={t.wholeWord} checked={flags.wholeWord} onChange={set("wholeWord")} />
        <Checkbox label={t.regex} checked={flags.regex} onChange={set("regex")} />
      </OptionsBar>
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} />
        <OutputPanel locale={locale} value={output} filename="replaced.txt" />
      </TwoPane>
      <p className="tabular min-h-5 text-sm text-fg-2">{pending ? t.working : status}</p>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
      <MoreOptions locale={locale}>
        <Checkbox label={t.all} checked={flags.all} onChange={set("all")} />
        <Checkbox label={t.escapes} checked={flags.escapes} onChange={set("escapes")} />
        {flags.regex && <Checkbox label={t.multiline} checked={flags.multiline} onChange={set("multiline")} />}
        {flags.regex && <Checkbox label={t.dotAll} checked={flags.dotAll} onChange={set("dotAll")} />}
        <InlineSelect
          id={`${id}-preset`}
          label={t.presets}
          value={"" as string}
          onChange={(key) => {
            const p = PRESETS.find((x) => x.key === key);
            if (!p) return;
            setFind(p.find);
            setReplacement(p.replace);
            setFlags((f) => ({ ...f, regex: true, multiline: true, all: true, wholeWord: false }));
          }}
          options={[{ value: "", label: "—" }, ...PRESETS.map((p) => ({ value: p.key as string, label: t[p.key] }))]}
        />
      </MoreOptions>
    </div>
  );
}
