"use client";

import { Delete, Trash2 } from "lucide-react";
import { useId, useRef } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../types";
import { calculate, errorText, type Angle } from "../expr/parser";
import { fmtN } from "../kit/fmt";
import { tidy } from "../kit/math";
import { toInput } from "../kit/num";
import { useStored } from "../kit/storage";
import { Explain, Stack, SubHeading, ToolActions } from "../kit/ui";
import { useQueryState } from "../kit/url-state";

const T = {
  ru: {
    expr: "Выражение",
    placeholder: "Например: 2π × sin(30) + √16",
    angle: "Единицы углов",
    deg: "DEG",
    rad: "RAD",
    degTitle: "Градусы",
    radTitle: "Радианы",
    result: "Результат",
    history: "История",
    clearHistory: "Очистить историю",
    empty: "Здесь появятся ваши вычисления",
    copy: "Копировать",
    copied: "Скопировано",
    keys: "Клавиатура калькулятора",
    back: "Стереть символ",
    clear: "Очистить",
    equals: "Вычислить и сохранить в историю",
    hint: "Можно печатать с клавиатуры: Enter — вычислить, Esc — очистить.",
  },
  en: {
    expr: "Expression",
    placeholder: "For example: 2π × sin(30) + √16",
    angle: "Angle unit",
    deg: "DEG",
    rad: "RAD",
    degTitle: "Degrees",
    radTitle: "Radians",
    result: "Result",
    history: "History",
    clearHistory: "Clear history",
    empty: "Your calculations will appear here",
    copy: "Copy",
    copied: "Copied",
    keys: "Calculator keypad",
    back: "Delete a character",
    clear: "Clear",
    equals: "Calculate and save to history",
    hint: "Type on your keyboard: Enter to calculate, Esc to clear.",
  },
} as const;

interface Entry {
  e: string;
  r: string;
}
const isHistory = (x: unknown): x is Entry[] => Array.isArray(x) && x.every((i) => i && typeof i.e === "string" && typeof i.r === "string");
const EMPTY: Entry[] = [];

type Key = { label: string; insert?: string; action?: "back" | "clear" | "eq" | "ans"; tone?: "fn" | "op" | "num" | "eq"; aria?: string };

export default function Scientific({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const inputRef = useRef<HTMLInputElement>(null);
  const q = useQueryState({ e: "2π × sin(30) + √16", a: "deg" }, { enums: { a: ["deg", "rad"] } });
  const [history, setHistory] = useStored<Entry[]>("calc:scientific-history", EMPTY, isHistory);
  const angle = q.v.a as Angle;
  const expr = q.v.e;

  let value: number | null = null;
  let error: string | null = null;
  if (expr.trim()) {
    try {
      value = tidy(calculate(expr, { decimalComma: ru, angle }));
      if (!Number.isFinite(value)) {
        error = ru ? "Результат слишком большой" : "The result is too large";
        value = null;
      }
    } catch (err) {
      error = errorText(locale, err, expr);
    }
  }
  const shown = value !== null ? fmtN(locale, value, 10) : null;

  function insert(text: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? expr.length;
    const end = el?.selectionEnd ?? expr.length;
    const next = expr.slice(0, start) + text + expr.slice(end);
    q.set({ e: next });
    const caret = start + text.length;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }

  function back() {
    const el = inputRef.current;
    const start = el?.selectionStart ?? expr.length;
    const end = el?.selectionEnd ?? expr.length;
    if (start === end && start === 0) return;
    const from = start === end ? start - 1 : start;
    q.set({ e: expr.slice(0, from) + expr.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(from, from);
    });
  }

  function commit() {
    if (value === null || !shown) return;
    setHistory([{ e: expr, r: shown }, ...history.filter((h) => h.e !== expr)].slice(0, 30));
    q.set({ e: toInput(locale, value).replace(/\s/g, "") });
  }

  const dec = ru ? "," : ".";
  const K: Key[][] = [
    [
      { label: "sin", insert: "sin(", tone: "fn" },
      { label: "cos", insert: "cos(", tone: "fn" },
      { label: "tan", insert: "tan(", tone: "fn" },
      { label: "(", insert: "(", tone: "op" },
      { label: ")", insert: ")", tone: "op" },
    ],
    [
      { label: "sin⁻¹", insert: "asin(", tone: "fn", aria: "asin" },
      { label: "cos⁻¹", insert: "acos(", tone: "fn", aria: "acos" },
      { label: "tan⁻¹", insert: "atan(", tone: "fn", aria: "atan" },
      { label: "π", insert: "π", tone: "fn" },
      { label: "e", insert: "e", tone: "fn" },
    ],
    [
      { label: "ln", insert: "ln(", tone: "fn" },
      { label: "log", insert: "log(", tone: "fn" },
      { label: "√", insert: "√(", tone: "fn" },
      { label: "xʸ", insert: "^", tone: "fn", aria: "^" },
      { label: "n!", insert: "!", tone: "fn", aria: "!" },
    ],
    [
      { label: "7", insert: "7", tone: "num" },
      { label: "8", insert: "8", tone: "num" },
      { label: "9", insert: "9", tone: "num" },
      { label: "÷", insert: "÷", tone: "op" },
      { label: "⌫", action: "back", tone: "op", aria: t.back },
    ],
    [
      { label: "4", insert: "4", tone: "num" },
      { label: "5", insert: "5", tone: "num" },
      { label: "6", insert: "6", tone: "num" },
      { label: "×", insert: "×", tone: "op" },
      { label: "AC", action: "clear", tone: "op", aria: t.clear },
    ],
    [
      { label: "1", insert: "1", tone: "num" },
      { label: "2", insert: "2", tone: "num" },
      { label: "3", insert: "3", tone: "num" },
      { label: "−", insert: "−", tone: "op" },
      { label: "%", insert: "%", tone: "op" },
    ],
    [
      { label: "0", insert: "0", tone: "num" },
      { label: dec, insert: dec, tone: "num" },
      { label: "x²", insert: "²", tone: "fn", aria: "²" },
      { label: "+", insert: "+", tone: "op" },
      { label: "=", action: "eq", tone: "eq", aria: t.equals },
    ],
  ];

  function press(k: Key) {
    if (k.action === "back") back();
    else if (k.action === "clear") q.set({ e: "" });
    else if (k.action === "eq") commit();
    else if (k.insert) insert(k.insert);
  }

  return (
    <Stack>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
        <section
          className="flex min-w-0 flex-col gap-3 rounded-[0.75rem] border border-line bg-surface p-4 sm:p-5"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              q.set({ e: "" });
            }
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={`${id}-e`} className="text-sm font-medium text-fg-2">
              {t.expr}
            </label>
            <Segmented
              size="sm"
              label={t.angle}
              value={angle}
              onChange={(a) => q.set({ a })}
              options={[
                { value: "deg", label: t.deg, title: t.degTitle },
                { value: "rad", label: t.rad, title: t.radTitle },
              ]}
            />
          </div>
          <input
            ref={inputRef}
            id={`${id}-e`}
            value={expr}
            onChange={(e) => q.set({ e: e.target.value })}
            placeholder={t.placeholder}
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            aria-invalid={!!error}
            aria-describedby={`${id}-err`}
            className="control h-12 font-mono text-lg"
          />
          <div className="min-h-[4.75rem] rounded-[0.625rem] bg-accent-soft px-4 py-3">
            <div className="text-[0.8125rem] text-fg-2">{t.result}</div>
            <div className="flex items-center justify-between gap-2">
              <output aria-live="polite" className="tabular min-w-0 break-all text-3xl font-bold tracking-tight text-fg">
                {shown ?? "—"}
              </output>
              {shown && <CopyButton value={shown.replace(/[  ]/g, " ")} label={t.copy} copiedLabel={t.copied} variant="ghost" size="icon-sm" />}
            </div>
            <p id={`${id}-err`} className="min-h-5 text-sm text-err">
              {error}
            </p>
          </div>
          <div role="group" aria-label={t.keys} className="grid grid-cols-5 gap-1.5">
            {K.flat().map((k) => (
              <button
                key={k.label}
                type="button"
                onClick={() => press(k)}
                aria-label={k.aria}
                className={cn(
                  "h-11 rounded-[0.5rem] text-[0.9375rem] font-medium transition-colors duration-100 active:scale-[0.97] sm:h-12",
                  k.tone === "num" && "bg-surface-2 text-fg hover:bg-line",
                  k.tone === "op" && "bg-surface-2 text-fg-2 hover:bg-line hover:text-fg",
                  k.tone === "fn" && "border border-line bg-surface text-fg-2 hover:border-line-strong hover:text-fg",
                  k.tone === "eq" && "bg-accent text-accent-fg hover:bg-accent-hover",
                )}
              >
                {k.action === "back" ? <Delete className="mx-auto size-[1.125rem]" aria-hidden /> : k.label}
              </button>
            ))}
          </div>
          <p className="text-[0.8125rem] text-fg-3">{t.hint}</p>
          <ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />
        </section>
        <section className="min-w-0">
          <SubHeading
            aside={
              history.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setHistory(null)}>
                  <Trash2 aria-hidden />
                  {t.clearHistory}
                </Button>
              )
            }
          >
            {t.history}
          </SubHeading>
          {history.length === 0 ? (
            <p className="text-sm text-fg-3">{t.empty}</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-[0.75rem] border border-line bg-surface">
              {history.map((h, i) => (
                <li key={i}>
                  <button type="button" className="block w-full px-4 py-2.5 text-left hover:bg-surface-2" onClick={() => q.set({ e: h.e })}>
                    <span className="block truncate font-mono text-[0.8125rem] text-fg-3">{h.e}</span>
                    <span className="tabular block font-semibold text-fg">= {h.r}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {ru ? (
        <Explain
          locale={locale}
          formula={["Приоритет: скобки → функции → ^ → × ÷ → + −", "2^3^2 = 2^9 = 512, −2^2 = −4", "2π = 2 × π, 3(1 + 2) = 9"]}
          notes={[
            "Десятичный разделитель — запятая или точка; аргументы функций разделяются точкой с запятой: log(8; 2) = 3.",
            "log — десятичный логарифм, ln — натуральный, log(x; b) — по основанию b. Функции: sin, cos, tan, cot, asin, acos, atan, sinh, cosh, tanh, sqrt (√), cbrt, abs, exp, round, floor, ceil, nroot(x; n).",
            "В режиме DEG углы в градусах (sin 30 = 0,5), в режиме RAD — в радианах (sin(π/6) = 0,5). % делит число на 100, ! — факториал.",
            "История хранится только в этом браузере. Выражение — в ссылке на страницу, ей можно поделиться.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Order: parentheses → functions → ^ → × ÷ → + −", "2^3^2 = 2^9 = 512, −2^2 = −4", "2π = 2 × π, 3(1 + 2) = 9"]}
          notes={[
            "Use a decimal point; separate function arguments with commas: log(8, 2) = 3.",
            "log is base 10, ln is natural, log(x, b) uses base b. Functions: sin, cos, tan, cot, asin, acos, atan, sinh, cosh, tanh, sqrt (√), cbrt, abs, exp, round, floor, ceil, nroot(x, n).",
            "DEG mode uses degrees (sin 30 = 0.5), RAD uses radians (sin(π/6) = 0.5). % divides by 100 and ! is the factorial.",
            "History is stored only in this browser. The expression is kept in the page link so you can share it.",
          ]}
        />
      )}
    </Stack>
  );
}
