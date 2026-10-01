"use client";

import { RotateCcw, Shuffle } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { TYPING_TEXTS, type TypingLang } from "./data/typing-texts";
import { useStoredNumber, writeStored } from "./lib/client";
import { randomIndex } from "./lib/secure-random";
import { EMPTY_TALLY, stateRuns, tallyInput, typingResult, TYPING_DURATIONS, type KeystrokeTally, type TypingMode, type TypingResult } from "./lib/typing-stats";

/** Enough text for a very fast typist (15 characters per second). */
const MAX_CPS = 15;
/** Results faster than this or shorter runs are not stored as a personal best. */
const MAX_HUMAN_WPM = 250;
const MIN_RECORD_MS = 3000;
/** Characters rendered after the caret (the box shows about five lines). */
const AHEAD_CHARS = 600;

const T = {
  ru: {
    lang: "Язык текста",
    langs: { ru: "Русский", en: "English" },
    mode: "Режим",
    min: (m: number) => `${m} мин`,
    whole: "Весь текст",
    input: "Поле для ввода текста",
    placeholder: "Начните печатать здесь — таймер запустится с первой буквы",
    left: "осталось",
    elapsed: "прошло",
    wpm: "WPM",
    cpm: "зн/мин",
    acc: "точность",
    again: "Ещё раз",
    other: "Другой текст",
    best: "Рекорд",
    newBest: "Новый рекорд!",
    notRecord: "Слишком быстро или слишком коротко — в рекорды не идёт",
    big: "знаков в минуту",
    small: "слов в минуту (WPM)",
    accuracy: "точность",
    errors: (n: number) => `${n} ${plural("ru", n, ["ошибка", "ошибки", "ошибок"])}`,
    uncorrected: (n: number) => `${n} не ${plural("ru", n, ["исправлена", "исправлены", "исправлено"])}`,
    chars: (n: number) => `${n} ${plural("ru", n, ["верный символ", "верных символа", "верных символов"])}`,
    time: (s: string) => `за ${s} с`,
    summary: (cpm: string, wpm: string, acc: string) => `${cpm} знаков в минуту (${wpm} WPM), точность ${acc} %`,
  },
  en: {
    lang: "Text language",
    langs: { ru: "Русский", en: "English" },
    mode: "Mode",
    min: (m: number) => `${m} min`,
    whole: "Full text",
    input: "Typing input",
    placeholder: "Start typing here — the timer starts with your first letter",
    left: "left",
    elapsed: "elapsed",
    wpm: "WPM",
    cpm: "CPM",
    acc: "accuracy",
    again: "Try again",
    other: "Another text",
    best: "Best",
    newBest: "New personal best!",
    notRecord: "Too fast or too short to count as a record",
    big: "words per minute",
    small: "characters per minute",
    accuracy: "accuracy",
    errors: (n: number) => `${n} ${n === 1 ? "mistake" : "mistakes"}`,
    uncorrected: (n: number) => `${n} not corrected`,
    chars: (n: number) => `${n} correct ${n === 1 ? "character" : "characters"}`,
    time: (s: string) => `in ${s} s`,
    summary: (cpm: string, wpm: string, acc: string) => `${wpm} WPM (${cpm} characters per minute), ${acc}% accuracy`,
  },
} as const;

function buildTarget(lang: TypingLang, mode: TypingMode, seed: number): string {
  const texts = TYPING_TEXTS[lang];
  const first = seed % texts.length;
  if (mode === 0) return texts[first];
  const need = mode * MAX_CPS;
  const parts: string[] = [];
  let len = 0;
  for (let i = 0; len < need; i++) {
    const s = texts[(first + i) % texts.length];
    parts.push(s);
    len += s.length + 1;
  }
  return parts.join(" ");
}

type Phase = "ready" | "running" | "done";

export default function TypingTest({ locale, seconds = 60 }: { locale: Locale; seconds?: number }) {
  const t = T[locale];
  const id = useId();
  const initialMode: TypingMode = seconds === 0 || (TYPING_DURATIONS as readonly number[]).includes(seconds) ? (seconds as TypingMode) : 60;
  const [lang, setLang] = useState<TypingLang>(locale);
  const [mode, setMode] = useState<TypingMode>(initialMode);
  // deterministic first text per mode, so the server-rendered page shows a real text
  const [seed, setSeed] = useState(() => [0, 60, 180, 300].indexOf(initialMode) * 3);
  const [input, setInput] = useState("");
  const [tally, setTally] = useState<KeystrokeTally>(EMPTY_TALLY);
  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<(TypingResult & { record: boolean; plausible: boolean }) | null>(null);
  const target = useMemo(() => buildTarget(lang, mode, seed), [lang, mode, seed]);
  const bestKey = `test.typing.best.${lang}.${mode}`;
  const best = useStoredNumber(bestKey);

  const run = useRef({ start: 0, timer: 0, input: "", tally: EMPTY_TALLY });
  const boxRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const r = run.current;
    return () => window.clearInterval(r.timer);
  }, []);

  // keep the caret line visible inside the text box
  useLayoutEffect(() => {
    const box = boxRef.current;
    const caret = caretRef.current;
    if (!box || !caret) return;
    // the box is the caret's offsetParent (position: relative); scroll by whole lines,
    // keeping one already-typed line above the caret line
    const cs = getComputedStyle(box);
    const lineH = parseFloat(cs.lineHeight) || caret.offsetHeight;
    const line = Math.max(0, Math.round((caret.offsetTop - parseFloat(cs.paddingTop)) / lineH));
    box.scrollTop = Math.max(0, line - 1) * lineH;
  }, [input, target]);

  function finish() {
    const r = run.current;
    window.clearInterval(r.timer);
    const actual = performance.now() - r.start;
    const ms = mode > 0 ? Math.min(actual, mode * 1000) : actual;
    const res = typingResult(r.input, target, r.tally, ms);
    const wpmRounded = Math.round(res.wpm);
    // pasted or machine input would store absurd records; human records are well below 250 WPM
    const plausible = ms >= MIN_RECORD_MS && res.wpm <= MAX_HUMAN_WPM;
    const record = plausible && res.correct > 0 && (best === null || wpmRounded > best);
    if (record) writeStored(bestKey, String(wpmRounded));
    setElapsed(ms);
    setResult({ ...res, record, plausible });
    setPhase("done");
  }

  function onChange(value: string) {
    if (phase === "done") return;
    const next = value.replace(/\r?\n/g, " ").slice(0, target.length);
    const r = run.current;
    if (phase === "ready") {
      if (!next) return;
      r.start = performance.now();
      setPhase("running");
      r.timer = window.setInterval(() => {
        const el = performance.now() - r.start;
        if (mode > 0 && el >= mode * 1000) finish();
        else setElapsed(el);
      }, 200);
    }
    const nextTally = tallyInput(r.tally, r.input, next, target);
    r.input = next;
    r.tally = nextTally;
    setInput(next);
    setTally(nextTally);
    if (next.length >= target.length) finish();
  }

  function reset(next?: { lang?: TypingLang; mode?: TypingMode; seed?: number }) {
    const r = run.current;
    window.clearInterval(r.timer);
    r.input = "";
    r.tally = EMPTY_TALLY;
    if (next?.lang) setLang(next.lang);
    if (next?.mode !== undefined) setMode(next.mode);
    if (next?.seed !== undefined) setSeed(next.seed);
    setInput("");
    setTally(EMPTY_TALLY);
    setPhase("ready");
    setElapsed(0);
    setResult(null);
    // the textarea is re-enabled on the next render; put the caret back for the user
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const runs = stateRuns(input, target);
  const live = typingResult(input, target, tally, elapsed);
  // speed over the first seconds is too noisy to show
  const showLive = phase !== "ready" && elapsed >= 2000;
  const nf = (n: number, d = 0) => formatNumber(locale, n, { maximumFractionDigits: d, minimumFractionDigits: d });
  const clock = Math.round(mode > 0 ? Math.max(0, mode - elapsed / 1000) : elapsed / 1000);
  const clockText = `${Math.floor(clock / 60)}:${String(clock % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          size="sm"
          label={t.lang}
          value={lang}
          onChange={(l) => reset({ lang: l })}
          options={[
            { value: "ru", label: t.langs.ru },
            { value: "en", label: t.langs.en },
          ]}
        />
        <Segmented
          size="sm"
          label={t.mode}
          value={String(mode)}
          onChange={(m) => reset({ mode: Number(m) as TypingMode })}
          options={[...TYPING_DURATIONS.map((s) => ({ value: String(s), label: t.min(s / 60) })), { value: "0", label: t.whole }]}
        />
        <span className="flex-1" />
        <span className="text-sm text-fg-2">
          {t.best}: <span className="tabular font-semibold text-fg">{best !== null ? `${best} WPM` : "—"}</span>
        </span>
      </div>

      <div className="panel flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-surface-2 px-4 py-2.5 text-sm whitespace-nowrap text-fg-2 tabular sm:px-5">
          <span>
            <span className="text-xl font-bold text-fg">{clockText}</span> {mode > 0 ? t.left : t.elapsed}
          </span>
          <span className="flex gap-3 sm:gap-4">
            <span>
              <span className="font-semibold text-fg">{showLive ? nf(live.cpm) : "—"}</span> {t.cpm}
            </span>
            <span className="max-sm:sr-only">
              <span className="font-semibold text-fg">{showLive ? nf(live.wpm) : "—"}</span> {t.wpm}
            </span>
            <span>
              <span className="font-semibold text-fg">{phase === "ready" ? "—" : `${nf(live.accuracy)} %`}</span> {t.acc}
            </span>
          </span>
        </div>
        <div
          ref={boxRef}
          lang={lang}
          className="relative max-h-[calc(8em+1.5rem)] overflow-hidden px-4 py-3 text-lg leading-[1.6] tracking-[0.01em] sm:px-5 sm:text-xl lg:text-2xl"
          onClick={() => inputRef.current?.focus()}
        >
          {runs.before.map((r, i) => (
            <span key={i} className={r.state === "ok" ? "text-fg" : "rounded-[0.1875rem] bg-err-soft text-err underline decoration-err decoration-2 underline-offset-4"}>
              {r.text}
            </span>
          ))}
          {runs.caret && (
            <span ref={caretRef} className={cn("rounded-[0.1875rem] text-fg-3", phase !== "done" && "bg-accent-soft text-fg underline decoration-accent decoration-2 underline-offset-4")}>
              {runs.caret}
            </span>
          )}
          {/* only a few visible lines ahead of the caret are needed */}
          <span className="text-fg-3">{runs.after.slice(0, AHEAD_CHARS)}</span>
        </div>
      </div>

      <label htmlFor={`${id}-in`} className="sr-only">
        {t.input}
      </label>
      <textarea
        ref={inputRef}
        id={`${id}-in`}
        value={input}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        disabled={phase === "done"}
        placeholder={t.placeholder}
        lang={lang}
        rows={3}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="control min-h-24 resize-none py-2.5 text-lg leading-relaxed"
      />

      <div aria-live="polite">
        {phase === "done" && result && (
          <div className="flex flex-col gap-3 rounded-[1.25rem] bg-accent-soft p-5 motion-safe:animate-[menu-in_200ms_ease-out] sm:p-6">
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <div className="tabular text-5xl font-bold tracking-tight text-fg">{nf(locale === "ru" ? result.cpm : result.wpm)}</div>
                <div className="text-sm text-fg-2">{t.big}</div>
              </div>
              <div>
                <div className="tabular text-3xl font-semibold text-fg">{nf(locale === "ru" ? result.wpm : result.cpm)}</div>
                <div className="text-sm text-fg-2">{t.small}</div>
              </div>
              <div>
                <div className={cn("tabular text-3xl font-semibold", result.accuracy >= 95 ? "text-ok" : result.accuracy >= 90 ? "text-fg" : "text-warn")}>{nf(result.accuracy, 1)} %</div>
                <div className="text-sm text-fg-2">{t.accuracy}</div>
              </div>
              {result.record && <Badge tone="ok">{t.newBest}</Badge>}
              {!result.plausible && result.correct > 0 && <Badge tone="warn">{t.notRecord}</Badge>}
            </div>
            <p className="text-sm text-fg-2">
              {t.chars(result.correct)} {t.time(nf(result.elapsedMs / 1000, 1))} · {t.errors(result.errors)}
              {result.uncorrected > 0 && ` (${t.uncorrected(result.uncorrected)})`}
            </p>
            <p className="sr-only">{t.summary(nf(result.cpm), nf(result.wpm), nf(result.accuracy, 1))}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={phase === "done" ? "filled" : "tonal"} size="lg" onClick={() => reset()}>
          <RotateCcw aria-hidden />
          {t.again}
        </Button>
        <Button variant="text" size="lg" onClick={() => reset({ seed: randomIndex(TYPING_TEXTS[lang].length) })}>
          <Shuffle aria-hidden />
          {t.other}
        </Button>
      </div>
    </div>
  );
}
