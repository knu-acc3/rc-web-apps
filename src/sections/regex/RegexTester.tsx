"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { useHydrated, useLiveTask, useWorkerClient } from "@/sections/code/kit/hooks";
import { outputLabels } from "@/sections/code/kit/labels";
import { JobTimeout } from "@/sections/code/kit/worker-client";
import { cn } from "@/lib/cn";
import { CodeOutput } from "@/ui/code-output";
import { CopyButton } from "@/ui/copy-button";
import { Input } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { Tabs } from "@/ui/tabs";
import type { Match, MatchResult } from "./engine";
import { exportRegex, type Lang, type Warning } from "./exporters";

const FLAGS = ["g", "i", "m", "s", "u", "v", "y", "d"] as const;
type Flag = (typeof FLAGS)[number];

const T = {
  ru: {
    pattern: "Регулярное выражение",
    flagsLabel: "Флаги",
    flag: { g: "g — все совпадения", i: "i — без учёта регистра", m: "m — ^ и $ для каждой строки", s: "s — точка захватывает перевод строки", u: "u — Unicode (\\p{…}, эмодзи)", v: "v — Unicode-множества (новее u)", y: "y — «липкий» поиск с lastIndex", d: "d — позиции групп (indices)" },
    unsupported: "не поддерживается этим браузером",
    uv: "Флаги u и v нельзя включить вместе",
    text: "Тестовая строка",
    tabs: { matches: "Совпадения", replace: "Замена", code: "Код" },
    tabsLabel: "Режим",
    found: ["совпадение", "совпадения", "совпадений"],
    none: "Совпадений нет",
    capped: (n: string) => `Показаны первые ${n} совпадений`,
    previewCut: "Подсветка показана для начала текста",
    timeout: "Выражение выполняется слишком долго (больше 1,5 с) — вероятно, катастрофический перебор вроде (a+)+$. Поиск остановлен, страница не зависла.",
    error: "Ошибка в выражении",
    idx: "#",
    pos: "Позиция",
    value: "Совпадение",
    group: "Группа",
    replacement: "Замена",
    replaceHint: "$1, $2 — группы, $<имя> — именованная группа, $& — всё совпадение, $$ — знак $",
    result: "Результат замены",
    lang: "Язык",
    warn: {
      "py-unicode-props": "Модуль re в Python не знает \\p{…} — используйте пакет regex или классы вроде [а-яА-Я].",
      "py-lookbehind": "В Python ретроспективная проверка (?<=…) должна иметь фиксированную длину.",
      "go-lookaround": "Go (RE2) не поддерживает опережающие и ретроспективные проверки (?=, ?!, ?<=, ?<!).",
      "go-backref": "Go (RE2) не поддерживает обратные ссылки \\1 и \\k<…>.",
      sticky: "У флага y нет прямого аналога — используйте поиск с начальной позиции.",
      "flag-v": "Флаг v есть только в JavaScript; синтаксис множеств нужно переписать.",
      "java-unicode-escape": "Java не понимает \\u{…} — используйте \\x{…}.",
      "cs-unicode-escape": ".NET не понимает \\u{…} — для символов вне BMP используйте суррогатные пары.",
    } as Record<Warning, string>,
    empty: "(пусто)",
  },
  en: {
    pattern: "Regular expression",
    flagsLabel: "Flags",
    flag: { g: "g — all matches", i: "i — case-insensitive", m: "m — ^ and $ per line", s: "s — dot matches newlines", u: "u — Unicode (\\p{…}, emoji)", v: "v — Unicode sets (newer u)", y: "y — sticky search from lastIndex", d: "d — group indices" },
    unsupported: "not supported by this browser",
    uv: "The u and v flags can't be combined",
    text: "Test string",
    tabs: { matches: "Matches", replace: "Replace", code: "Code" },
    tabsLabel: "Mode",
    found: ["match", "matches"],
    none: "No matches",
    capped: (n: string) => `Showing the first ${n} matches`,
    previewCut: "Highlighting is shown for the beginning of the text",
    timeout: "The expression runs too long (over 1.5 s) — probably catastrophic backtracking like (a+)+$. The search was stopped and the page stays responsive.",
    error: "Invalid expression",
    idx: "#",
    pos: "Index",
    value: "Match",
    group: "Group",
    replacement: "Replacement",
    replaceHint: "$1, $2 — groups, $<name> — named group, $& — whole match, $$ — a literal $",
    result: "Result",
    lang: "Language",
    warn: {
      "py-unicode-props": "Python's re doesn't support \\p{…} — use the regex package or explicit classes.",
      "py-lookbehind": "Python lookbehind (?<=…) must be fixed-width.",
      "go-lookaround": "Go (RE2) doesn't support lookahead or lookbehind (?=, ?!, ?<=, ?<!).",
      "go-backref": "Go (RE2) doesn't support backreferences \\1 and \\k<…>.",
      sticky: "The y flag has no direct equivalent — search from a start position instead.",
      "flag-v": "The v flag exists only in JavaScript; rewrite set syntax.",
      "java-unicode-escape": "Java doesn't understand \\u{…} — use \\x{…}.",
      "cs-unicode-escape": ".NET doesn't understand \\u{…} — use surrogate pairs for characters outside the BMP.",
    } as Record<Warning, string>,
    empty: "(empty)",
  },
} as const;

const CAP = 5000;
const PREVIEW_CHARS = 30000;
const PREVIEW_MARKS = 1500;

function supports(flag: string): boolean {
  try {
    new RegExp("", flag);
    return true;
  } catch {
    return false;
  }
}

export interface RegexTesterProps {
  locale: Locale;
  pattern?: string;
  flags?: string;
  text?: string;
  replacement?: string;
}

export default function RegexTester({ locale, pattern: p0 = "(?<user>[\\w.+-]+)@(?<domain>[\\w-]+\\.[\\w.]+)", flags: f0 = "gi", text: t0 = "", replacement: r0 = "$<user> at $<domain>" }: RegexTesterProps) {
  const t = T[locale];
  const id = useId();
  const hydrated = useHydrated();
  const [pattern, setPattern] = useState(p0);
  const [flags, setFlags] = useState(f0);
  const [text, setText] = useState(t0 || (locale === "ru" ? "Пишите на info@example.com или sales@company.kz — ответим в течение дня." : "Write to info@example.com or sales@company.io — we reply within a day."));
  const [tab, setTab] = useState<"matches" | "replace" | "code">("matches");
  const [replacement, setReplacement] = useState(r0);
  const [lang, setLang] = useState<Lang>("js");
  const client = useWorkerClient(() => new Worker(new URL("./regex.worker.ts", import.meta.url), { type: "module" }));
  const replacer = useWorkerClient(() => new Worker(new URL("./regex.worker.ts", import.meta.url), { type: "module" }));

  const syntax = useMemo(() => {
    try {
      new RegExp(pattern, flags);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, [pattern, flags]);

  const key = `${flags}\u0000${pattern}\u0000${text}`;
  const live = useLiveTask<MatchResult>(key, syntax ? null : () => client.run<MatchResult>("match", { pattern, flags, text, cap: CAP }, { timeoutMs: 1500 }), 150);
  const rep = useLiveTask<string>(`${key}\u0000${replacement}`, syntax || tab !== "replace" ? null : () => replacer.run<string>("replace", { pattern, flags, text, replacement }, { timeoutMs: 1500 }), 200);
  const res = live.value ?? live.stale;
  const timedOut = live.error instanceof JobTimeout || rep.error instanceof JobTimeout;

  const toggle = (f: Flag) => {
    let next = flags.includes(f) ? flags.replace(f, "") : flags + f;
    if (f === "u" && !flags.includes("u")) next = next.replace("v", "");
    if (f === "v" && !flags.includes("v")) next = next.replace("u", "");
    setFlags(FLAGS.filter((x) => next.includes(x)).join(""));
  };

  const exported = useMemo(() => {
    if (syntax || tab !== "code") return null;
    const find = exportRegex(lang, pattern, flags);
    const repl = replacement ? exportRegex(lang, pattern, flags, replacement) : null;
    return { find, repl, warnings: [...new Set([...find.warnings, ...(repl?.warnings ?? [])])] };
  }, [syntax, tab, lang, pattern, flags, replacement]);
  const count = res?.matches.length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-6">
        <label htmlFor={`${id}-p`} className="text-sm font-medium text-fg-2">
          {t.pattern}
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="font-mono text-2xl text-fg-3" aria-hidden>
            /
          </span>
          <Input id={`${id}-p`} size="lg" value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono text-lg!" spellCheck={false} autoComplete="off" autoCapitalize="off" aria-invalid={!!syntax} />
          <span className="font-mono text-2xl text-fg-3" aria-hidden>
            /{flags}
          </span>
          <CopyButton value={`/${pattern}/${flags}`} size="icon" variant="outline" className="h-12! w-12! shrink-0" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t.flagsLabel}>
          {FLAGS.map((f) => {
            const ok = !hydrated || supports(f);
            const on = flags.includes(f);
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                disabled={!ok}
                title={ok ? t.flag[f] : `${t.flag[f]} — ${t.unsupported}`}
                onClick={() => toggle(f)}
                className={cn("h-8 min-w-9 rounded-[0.4375rem] border px-2.5 font-mono text-sm transition-colors duration-150 disabled:opacity-40", on ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-2 hover:border-line-strong hover:text-fg")}
              >
                {f}
              </button>
            );
          })}
        </div>
        {syntax && (
          <Notice tone="err" className="mt-3">
            {t.error}: {syntax}
          </Notice>
        )}
        {timedOut && (
          <Notice tone="warn" className="mt-3">
            {t.timeout}
          </Notice>
        )}
      </Panel>

      <CodeEditor id={`${id}-t`} locale={locale} label={t.text} value={text} onChange={setText} rows={6} wrap fileAccept=".txt,.log,.csv,.json,text/*" />

      <Tabs label={t.tabsLabel} value={tab} onChange={setTab} items={(["matches", "replace", "code"] as const).map((v) => ({ value: v, label: t.tabs[v] }))} />

      {tab === "matches" && (
        <>
          <p className="text-sm font-medium text-fg-2" aria-live="polite">
            {syntax || timedOut ? "" : count ? `${formatNumber(locale, count)} ${plural(locale, count, t.found)}${res?.capped ? ` · ${t.capped(formatNumber(locale, CAP))}` : ""}` : res ? t.none : ""}
          </p>
          {!syntax && res && <Highlight text={text} matches={res.matches} empty={t.empty} cut={t.previewCut} dim={live.pending} />}
          {!syntax && res && res.matches.length > 0 && <MatchTable locale={locale} matches={res.matches} />}
        </>
      )}

      {tab === "replace" && (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-r`} className="text-sm font-medium text-fg-2">
              {t.replacement}
            </label>
            <Input id={`${id}-r`} value={replacement} onChange={(e) => setReplacement(e.target.value)} className="font-mono" spellCheck={false} autoComplete="off" />
            <p className="text-[0.8125rem] text-fg-3">{t.replaceHint}</p>
          </div>
          <CodeOutput value={rep.value ?? rep.stale ?? ""} title={t.result} labels={outputLabels(locale)} minRows={6} />
        </>
      )}

      {tab === "code" && exported && (
        <>
          <Segmented
            label={t.lang}
            value={lang}
            onChange={setLang}
            options={[
              { value: "js", label: "JavaScript" },
              { value: "python", label: "Python" },
              { value: "php", label: "PHP" },
              { value: "java", label: "Java" },
              { value: "go", label: "Go" },
              { value: "csharp", label: "C#" },
            ]}
          />
          <CodeOutput value={exported.find.code} title={t.tabs.matches} labels={outputLabels(locale)} minRows={7} />
          {exported.repl && <CodeOutput value={exported.repl.code} title={t.tabs.replace} labels={outputLabels(locale)} minRows={5} />}
          {exported.warnings.map((w) => (
            <Notice key={w} tone="warn">
              {t.warn[w]}
            </Notice>
          ))}
        </>
      )}
    </div>
  );
}

function Highlight({ text, matches, empty, cut, dim }: { text: string; matches: Match[]; empty: string; cut: string; dim: boolean }) {
  const shown = text.slice(0, PREVIEW_CHARS);
  const nodes: ReactNode[] = [];
  let pos = 0;
  let k = 0;
  for (let i = 0; i < matches.length && i < PREVIEW_MARKS; i++) {
    const m = matches[i];
    if (m.index >= shown.length) break;
    if (m.index > pos) nodes.push(shown.slice(pos, m.index));
    if (m.index < pos) continue;
    if (m.end === m.index) nodes.push(<mark key={k++} className="mx-px inline-block h-[1.1em] w-0.5 translate-y-0.5 rounded-sm bg-accent" aria-label="∅" />);
    else nodes.push(<mark key={k++} className={cn("rounded-[0.1875rem] px-px text-fg", i % 2 ? "bg-warn-soft" : "bg-accent-soft")}>{shown.slice(m.index, Math.min(m.end, shown.length))}</mark>);
    pos = Math.min(m.end, shown.length);
  }
  if (pos < shown.length) nodes.push(shown.slice(pos));
  return (
    <div className={cn("rounded-[0.75rem] border border-line bg-surface", dim && "opacity-70")}>
      <div className="max-h-[50vh] overflow-auto px-3 py-2.5 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-fg">{text ? nodes : <span className="text-fg-3">{empty}</span>}</div>
      {text.length > PREVIEW_CHARS && <p className="border-t border-line px-3 py-1.5 text-[0.8125rem] text-fg-3">{cut}</p>}
    </div>
  );
}

function MatchTable({ locale, matches }: { locale: Locale; matches: Match[] }) {
  const t = T[locale];
  const groupCount = Math.max(0, ...matches.slice(0, 200).map((m) => m.groups.length));
  const names = matches[0]?.named ? Object.keys(matches[0].named) : [];
  return (
    <div tabIndex={0} className="tbl">
      <table>
        <thead>
          <tr>
            <th scope="col">{t.idx}</th>
            <th scope="col">{t.pos}</th>
            <th scope="col">{t.value}</th>
            {Array.from({ length: Math.min(groupCount, 9) }, (_, i) => (
              <th key={i} scope="col">
                ${i + 1}
              </th>
            ))}
            {names.map((n) => (
              <th key={n} scope="col">
                {`<${n}>`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono text-[0.8125rem]">
          {matches.slice(0, 200).map((m, i) => (
            <tr key={i}>
              <td className="text-fg-3">{i + 1}</td>
              <td className="text-fg-2">
                {m.index}–{m.end}
              </td>
              <td className="max-w-[16rem] break-all">{m.text || "∅"}</td>
              {Array.from({ length: Math.min(groupCount, 9) }, (_, g) => (
                <td key={g} className="max-w-[12rem] break-all">
                  {m.groups[g] ?? <span className="text-fg-3">—</span>}
                  {m.spans?.[g] && <span className="block text-fg-3">{m.spans[g]!.join("–")}</span>}
                </td>
              ))}
              {names.map((n) => (
                <td key={n} className="max-w-[12rem] break-all">
                  {m.named?.[n] ?? <span className="text-fg-3">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
