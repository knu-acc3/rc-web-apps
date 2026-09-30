"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { CopyButton } from "@/ui/copy-button";
import { Input, Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { num } from "./content/text";
import { parseDecimalInput } from "./parse";
import { BAR, parseRoman, partText, ROMAN_MAX, romanGlyphs, romanParts, toRoman, VINCULUM_MAX, type RomanIssue } from "./roman";

export interface RomanConverterProps {
  locale: Locale;
  value?: number;
}

const T = {
  ru: {
    input: "Число или римская запись",
    placeholder: "2024 или MMXXIV",
    vinculum: "Числа больше 3999 (винкулум)",
    lower: "Строчными",
    insert: "Буква с чертой",
    copy: "Копировать",
    copied: "Скопировано",
    fix: "Исправить на",
    invalid: "Введите целое число или римские цифры I, V, X, L, C, D, M.",
    natural: "Римскими цифрами записывают только натуральные числа — от 1: нуля и отрицательных чисел в этой системе нет.",
    rangeStd: `Стандартная запись — до 3999. Включите винкулум, чтобы записать число до ${formatNumber("ru", VINCULUM_MAX)}.`,
    rangeVinc: `С винкулумом записываются числа до ${formatNumber("ru", VINCULUM_MAX)}.`,
    chars: (c: string) => `Недопустимые символы: ${c}. Используются только I, V, X, L, C, D, M.`,
    barHint: "Черта над буквой умножает её на 1000",
    clock: "На циферблатах часов 4 часто пишут как IIII — это традиция, а не стандартная запись.",
    issue(i: RomanIssue, canonical: string, value: number): string {
      const fix = `Правильно: ${canonical} = ${formatNumber("ru", value)}.`;
      switch (i.kind) {
        case "repeat":
          return `${i.letter} повторяется ${i.count} ${plural("ru", i.count, ["раз", "раза", "раз"])} подряд — больше трёх нельзя. ${fix}`;
        case "repeat-five":
          return `V, L и D не повторяются: ${i.letter}${i.letter} пишется одной буквой. ${fix}`;
        case "bad-subtract":
          return `Пара ${i.pair} недопустима: I вычитают только из V и X, X — из L и C, C — из D и M. ${fix}`;
        case "order":
          return `Символы стоят в неправильном порядке. ${fix}`;
        case "too-big":
          return `Число больше ${formatNumber("ru", VINCULUM_MAX)} — его нельзя записать даже с винкулумом.`;
      }
    },
  },
  en: {
    input: "Number or Roman numeral",
    placeholder: "2024 or MMXXIV",
    vinculum: "Numbers above 3,999 (vinculum)",
    lower: "Lowercase",
    insert: "Overlined letter",
    copy: "Copy",
    copied: "Copied",
    fix: "Replace with",
    invalid: "Enter a whole number or the Roman letters I, V, X, L, C, D, M.",
    natural: "Roman numerals only express natural numbers from 1 — the system has no zero or negative numbers.",
    rangeStd: `Standard notation goes up to 3,999. Turn on vinculum for numbers up to ${formatNumber("en", VINCULUM_MAX)}.`,
    rangeVinc: `With vinculum the limit is ${formatNumber("en", VINCULUM_MAX)}.`,
    chars: (c: string) => `Invalid characters: ${c}. Only I, V, X, L, C, D and M are used.`,
    barHint: "A bar over a letter multiplies it by 1,000",
    clock: "Clock faces often show 4 as IIII — a tradition, not the standard form.",
    issue(i: RomanIssue, canonical: string, value: number): string {
      const fix = `Correct form: ${canonical} = ${formatNumber("en", value)}.`;
      switch (i.kind) {
        case "repeat":
          return `${i.letter} appears ${i.count} times in a row — at most three are allowed. ${fix}`;
        case "repeat-five":
          return `V, L and D never repeat: ${i.letter}${i.letter} is a single letter. ${fix}`;
        case "bad-subtract":
          return `${i.pair} is not a valid pair: I is subtracted only from V and X, X from L and C, C from D and M. ${fix}`;
        case "order":
          return `The symbols are in the wrong order. ${fix}`;
        case "too-big":
          return `The number is larger than ${formatNumber("en", VINCULUM_MAX)} and can't be written even with vinculum.`;
      }
    },
  },
} as const;

const BAR_LETTERS = ["I", "V", "X", "L", "C", "D", "M"];

export function Numeral({ text, lower = false, className }: { text: string; lower?: boolean; className?: string }) {
  return (
    <span className={cn("font-serif tracking-[0.04em]", className)}>
      {romanGlyphs(text).map((g, i) => (
        <span key={i} className={g.barred ? "overline decoration-2" : undefined}>
          {lower ? g.ch.toLowerCase() : g.ch}
        </span>
      ))}
    </span>
  );
}

type Outcome =
  | { kind: "empty" }
  | { kind: "error"; message: string; fix?: string; clock?: boolean }
  | { kind: "toRoman"; n: number; roman: string }
  | { kind: "toArabic"; n: number; roman: string };

function evaluate(text: string, vinculum: boolean, t: (typeof T)[Locale]): Outcome {
  const s = text.trim();
  if (!s) return { kind: "empty" };
  if (/^[−–+-]?[\d\s .,']+$/.test(s)) {
    const d = parseDecimalInput(s);
    if (!d || /[1-9]/.test(d.frac)) return { kind: "error", message: t.invalid };
    if (d.neg || d.int === 0n) return { kind: "error", message: t.natural };
    if (d.int > BigInt(vinculum ? VINCULUM_MAX : ROMAN_MAX)) return { kind: "error", message: vinculum ? t.rangeVinc : t.rangeStd };
    const n = Number(d.int);
    return { kind: "toRoman", n, roman: toRoman(n, vinculum) };
  }
  const p = parseRoman(s);
  if (p.ok) return { kind: "toArabic", n: p.value, roman: p.canonical };
  if (p.error === "chars") return { kind: "error", message: /\d/.test(s) ? t.invalid : t.chars(p.chars) };
  if (p.error === "noncanonical") return { kind: "error", message: t.issue(p.issue, p.canonical || "—", p.value), fix: p.canonical || undefined, clock: p.issue.kind === "repeat" && p.value === 4 };
  return { kind: "empty" };
}

export default function RomanConverter({ locale, value = 2024 }: RomanConverterProps) {
  const t = T[locale];
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const [text, setText] = useState(String(value));
  const [vinculum, setVinculum] = useState(value > ROMAN_MAX);
  const [lower, setLower] = useState(false);

  // Restore the caret after inserting an overlined letter.
  useEffect(() => {
    const el = inputRef.current;
    if (caret.current === null || !el) return;
    el.focus();
    el.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  }, [text]);

  const out = evaluate(text, vinculum, t);
  const ok = out.kind === "toRoman" || out.kind === "toArabic";
  const parts = ok ? romanParts(out.n, true) : [];
  const romanText = ok ? (lower ? out.roman.toLowerCase() : out.roman) : "";

  function insertBar(letter: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    caret.current = start + 2;
    setText(text.slice(0, start) + letter + BAR + text.slice(end));
  }

  return (
    <Panel className="p-4 sm:p-6">
      <label htmlFor={`${id}-in`} className="text-sm font-medium text-fg-2">
        {t.input}
      </label>
      <Input
        ref={inputRef}
        id={`${id}-in`}
        size="lg"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder={t.placeholder}
        className="mt-1.5 h-14! text-2xl! tabular"
        value={text}
        aria-invalid={out.kind === "error"}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="mt-5 min-h-24" aria-live="polite">
        {out.kind === "error" ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-[15px] text-err">{out.message}</p>
            {out.clock && <p className="text-sm text-fg-3">{t.clock}</p>}
            {out.fix && (
              <button type="button" className="text-sm font-medium text-accent hover:underline" onClick={() => setText(out.fix!)}>
                {t.fix} <Numeral text={out.fix} />
              </button>
            )}
          </div>
        ) : ok ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="text-5xl leading-tight font-semibold break-all text-fg sm:text-6xl">
                {out.kind === "toRoman" ? <Numeral text={out.roman} lower={lower} /> : <span className="tabular">{num(out.n, locale)}</span>}
              </div>
              <p className="mt-2 text-[15px] text-fg-2">
                {parts.length > 1 || out.kind === "toArabic" ? (
                  <>
                    {out.kind === "toArabic" && (
                      <>
                        <Numeral text={out.roman} lower={lower} /> ={" "}
                      </>
                    )}
                    {parts.map((p, i) => (
                      <span key={i}>
                        {i > 0 && " + "}
                        <Numeral text={partText(p)} lower={lower} className="text-fg" /> <span className="tabular text-fg-3">({num(p.value, locale)})</span>
                      </span>
                    ))}
                  </>
                ) : (
                  <span className="tabular">
                    {num(out.n, locale)} = <Numeral text={out.roman} lower={lower} />
                  </span>
                )}
              </p>
            </div>
            <CopyButton value={out.kind === "toRoman" ? romanText : String(out.n)} label={t.copy} copiedLabel={t.copied} className="self-start sm:self-end" />
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-fg-2">
        <Switch label={t.vinculum} checked={vinculum} onChange={(e) => setVinculum(e.target.checked)} className="text-sm!" />
        <Switch label={t.lower} checked={lower} onChange={(e) => setLower(e.target.checked)} className="text-sm!" />
        {vinculum && (
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t.insert}>
            {BAR_LETTERS.map((l) => (
              <button
                key={l}
                type="button"
                title={`${t.insert} ${l} (×1000)`}
                aria-label={`${t.insert} ${l}`}
                onClick={() => insertBar(l)}
                className="h-8 min-w-8 rounded-[6px] px-1.5 text-fg-2 hover:bg-surface-2 hover:text-fg"
              >
                <Numeral text={l + BAR} />
              </button>
            ))}
            <span className="text-[13px] text-fg-3">{t.barHint}</span>
          </div>
        )}
      </div>
    </Panel>
  );
}
