"use client";

import { ArrowLeftRight, Download } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { downloadText } from "@/lib/clipboard";
import { Button, buttonClass } from "@/ui/button";
import { Checkbox } from "@/ui/field";
import { Panel, PanelHeader } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import type { DiffMode, DiffOptions, DiffResult } from "./lib/diff";
import { countLabel, InputPanel, MoreOptions, OptionsBar, TwoPane, useDebounced } from "./ui/shared";

const T = {
  ru: {
    a: "Исходный текст",
    b: "Изменённый текст",
    mode: "Сравнивать",
    lines: "По строкам",
    words: "По словам",
    chars: "По символам",
    view: "Вид",
    unified: "Одной колонкой",
    split: "Две колонки",
    ignoreCase: "Без учёта регистра",
    ignoreWs: "Игнорировать пробелы",
    swap: "Поменять местами",
    result: "Различия",
    patch: "Скачать .diff",
    same: "Тексты совпадают",
    computing: "Сравниваю…",
    added: "Добавлено",
    removed: "Удалено",
    unitLines: ["строка", "строки", "строк"],
    unitWords: ["слово", "слова", "слов"],
    unitChars: ["символ", "символа", "символов"],
    sampleA: "Транслитерация — это передача букв\nодного алфавита буквами другого.\nНапример, «Щукин» → «Shchukin».\nСтандартов несколько.",
    sampleB: "Транслитерация — это запись букв\nодного алфавита буквами другого.\nНапример, «Щукин» → «Shchukin».\nСтандартов несколько: ICAO, ГОСТ, BGN.\nИ у каждого свои правила.",
  },
  en: {
    a: "Original text",
    b: "Changed text",
    mode: "Compare",
    lines: "By lines",
    words: "By words",
    chars: "By characters",
    view: "View",
    unified: "Unified",
    split: "Side by side",
    ignoreCase: "Ignore case",
    ignoreWs: "Ignore whitespace",
    swap: "Swap texts",
    result: "Differences",
    patch: "Download .diff",
    same: "The texts are identical",
    computing: "Comparing…",
    added: "Added",
    removed: "Removed",
    unitLines: ["line", "lines"],
    unitWords: ["word", "words"],
    unitChars: ["character", "characters"],
    sampleA: "Transliteration is the conversion of letters\nfrom one alphabet into another.\nFor example, “Щукин” → “Shchukin”.\nThere are several standards.",
    sampleB: "Transliteration is the mapping of letters\nfrom one alphabet into another.\nFor example, “Щукин” → “Shchukin”.\nThere are several standards: ICAO, GOST, BGN.\nEach has its own rules.",
  },
} as const;

type Msg = { id: number; res?: DiffResult; error?: string };

export default function TextCompare({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [a, setA] = useState<string>(t.sampleA);
  const [b, setB] = useState<string>(t.sampleB);
  const [mode, setMode] = useState<DiffMode>("lines");
  const [view, setView] = useState<"unified" | "split">("split");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWs, setIgnoreWs] = useState(false);
  const [result, setResult] = useState<{ key: string; res?: DiffResult; error?: string } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const busy = useRef(false);
  const seq = useRef(0);

  const opts: DiffOptions = { mode, ignoreCase, ignoreWhitespace: ignoreWs, locale };
  const job = useDebounced(JSON.stringify({ a, b, opts }), 250);

  useEffect(() => {
    const { a: ja, b: jb, opts: jo } = JSON.parse(job) as { a: string; b: string; opts: DiffOptions };
    // A still-running diff of a huge text is abandoned: restart the worker.
    if (busy.current && workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (!workerRef.current) workerRef.current = new Worker(new URL("./lib/diff.worker.ts", import.meta.url), { type: "module" });
    const w = workerRef.current;
    const myId = ++seq.current;
    const onMsg = (e: MessageEvent<Msg>) => {
      if (e.data.id !== myId) return;
      busy.current = false;
      setResult({ key: job, res: e.data.res, error: e.data.error });
    };
    w.addEventListener("message", onMsg);
    busy.current = true;
    w.postMessage({ id: myId, a: ja, b: jb, opts: jo });
    return () => w.removeEventListener("message", onMsg);
  }, [job]);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
    },
    [],
  );

  const res = result?.res;
  const unit = mode === "lines" ? t.unitLines : mode === "words" ? t.unitWords : t.unitChars;
  const identical = res && res.added === 0 && res.removed === 0;
  const stale = result?.key !== job;

  return (
    <div className="flex flex-col gap-4">
      <TwoPane>
        <InputPanel id={`${id}-a`} locale={locale} value={a} onChange={setA} label={t.a} rows={8} mono />
        <InputPanel id={`${id}-b`} locale={locale} value={b} onChange={setB} label={t.b} rows={8} mono />
      </TwoPane>
      <OptionsBar>
        <Segmented
          label={t.mode}
          value={mode}
          onChange={setMode}
          size="sm"
          options={[
            { value: "lines", label: t.lines },
            { value: "words", label: t.words },
            { value: "chars", label: t.chars },
          ]}
        />
        {mode === "lines" && (
          <Segmented
            label={t.view}
            value={view}
            onChange={setView}
            size="sm"
            options={[
              { value: "split", label: t.split },
              { value: "unified", label: t.unified },
            ]}
          />
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={t.swap}
          title={t.swap}
          onClick={() => {
            setA(b);
            setB(a);
          }}
        >
          <ArrowLeftRight aria-hidden />
        </Button>
      </OptionsBar>

      <Panel className={cn(stale && "opacity-70")}>
        <PanelHeader
          title={t.result}
          actions={
            mode === "lines" && res?.patch ? (
              <button type="button" className={buttonClass("ghost", "sm")} onClick={() => downloadText(res.patch, "changes.diff", "text/x-diff;charset=utf-8")}>
                <Download aria-hidden />
                <span className="max-sm:sr-only">{t.patch}</span>
              </button>
            ) : null
          }
        />
        <p className="tabular border-b border-line px-4 py-2 text-sm" aria-live="polite">
          {!res ? (
            <span className="text-fg-3">{result?.error ?? t.computing}</span>
          ) : identical ? (
            <span className="text-ok">{t.same}</span>
          ) : (
            <>
              <span className="text-ok">
                {t.added}: {countLabel(locale, res.added, unit)}
              </span>
              <span className="mx-2 text-fg-3">·</span>
              <span className="text-err">
                {t.removed}: {countLabel(locale, res.removed, unit)}
              </span>
            </>
          )}
        </p>
        {res && !identical && <DiffView res={res} mode={mode} view={view} />}
      </Panel>
      <MoreOptions locale={locale}>
        <Checkbox label={t.ignoreCase} checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} />
        {mode === "lines" && <Checkbox label={t.ignoreWs} checked={ignoreWs} onChange={(e) => setIgnoreWs(e.target.checked)} />}
      </MoreOptions>
    </div>
  );
}

function DiffView({ res, mode, view }: { res: DiffResult; mode: DiffMode; view: "unified" | "split" }) {
  if (mode === "lines" && view === "split") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[0.8125rem] leading-relaxed">
          <tbody>
            {res.rows.map((r, i) => (
              <tr key={i} className="align-top">
                <td className="w-10 select-none border-r border-line px-2 text-right text-fg-3">{r.leftNo ?? ""}</td>
                <td className={cn("w-1/2 px-2 whitespace-pre-wrap [overflow-wrap:anywhere]", (r.kind === "removed" || r.kind === "changed") && "bg-err-soft text-err")}>
                  {r.left ?? ""}
                </td>
                <td className="w-10 select-none border-x border-line px-2 text-right text-fg-3">{r.rightNo ?? ""}</td>
                <td className={cn("w-1/2 px-2 whitespace-pre-wrap [overflow-wrap:anywhere]", (r.kind === "added" || r.kind === "changed") && "bg-ok-soft text-ok")}>{r.right ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (mode === "lines") {
    return (
      <div className="overflow-x-auto px-2 py-2 font-mono text-[0.8125rem] leading-relaxed">
        {res.parts.flatMap((p, i) =>
          p.value.split("\n").map((line, k) => (
            <div key={`${i}-${k}`} className={cn("px-2 whitespace-pre-wrap [overflow-wrap:anywhere]", p.added && "bg-ok-soft text-ok", p.removed && "bg-err-soft text-err")}>
              <span className="select-none" aria-hidden>
                {p.added ? "+ " : p.removed ? "− " : "  "}
              </span>
              {p.added ? <ins className="no-underline">{line}</ins> : p.removed ? <del className="no-underline">{line}</del> : line}
            </div>
          )),
        )}
      </div>
    );
  }
  return (
    <div className="px-4 py-3 text-[0.9375rem] leading-relaxed whitespace-pre-wrap break-words text-fg">
      {res.parts.map((p, i) =>
        p.added ? (
          <ins key={i} className="rounded-[0.1875rem] bg-ok-soft text-ok no-underline">
            {p.value}
          </ins>
        ) : p.removed ? (
          <del key={i} className="rounded-[0.1875rem] bg-err-soft text-err">
            {p.value}
          </del>
        ) : (
          <span key={i}>{p.value}</span>
        ),
      )}
    </div>
  );
}
