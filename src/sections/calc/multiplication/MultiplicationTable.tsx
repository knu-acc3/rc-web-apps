"use client";

import { Check, Printer, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Input } from "@/ui/field";
import { Tabs } from "@/ui/tabs";
import type { ToolProps } from "../../types";
import { Explain, InlineSelect, InlineToggle, OptionsRow, Stack } from "../kit/ui";
import { useQueryState } from "../kit/url-state";
import { tableTip } from "./tips";

const VIEWS = ["one", "grid", "practice"] as const;
type View = (typeof VIEWS)[number];
const NUMS = Array.from({ length: 19 }, (_, i) => String(i + 2));

const T = {
  ru: {
    views: { one: "Таблица на число", grid: "Вся таблица", practice: "Тренажёр" } satisfies Record<View, string>,
    viewLabel: "Режим",
    number: "Таблица на",
    upTo: "До",
    print: "Распечатать",
    title: (n: string) => `Таблица умножения на ${n}`,
    gridTitle: (m: number) => `Таблица умножения ${m} × ${m}`,
    practiceOn: "Тренировать",
    all: "все от 2 до 9",
    start: "Начать",
    next: "Следующий пример",
    answer: "Ваш ответ",
    check: "Проверить",
    right: "Верно!",
    wrong: (v: number) => `Неверно, правильный ответ — ${v}`,
    score: (c: number, t: number) => `Верно ${c} из ${t}`,
    practiceHint: "Enter — проверить и перейти к следующему примеру.",
    tip: "Как запомнить",
  },
  en: {
    views: { one: "Times table", grid: "Full chart", practice: "Practice" } satisfies Record<View, string>,
    viewLabel: "Mode",
    number: "Table of",
    upTo: "Up to",
    print: "Print",
    title: (n: string) => `${n} times table`,
    gridTitle: (m: number) => `Multiplication chart ${m} × ${m}`,
    practiceOn: "Practise",
    all: "all from 2 to 9",
    start: "Start",
    next: "Next question",
    answer: "Your answer",
    check: "Check",
    right: "Correct!",
    wrong: (v: number) => `Not quite — the answer is ${v}`,
    score: (c: number, t: number) => `${c} of ${t} correct`,
    practiceHint: "Press Enter to check and move on.",
    tip: "How to remember",
  },
} as const;

/** Uniform random integer in [0, max) using crypto.getRandomValues with rejection sampling. */
function randInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

function printHtml(title: string, body: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
    body{font-family:system-ui,sans-serif;margin:24px;color:#111}
    h1{font-size:22px;margin:0 0 16px}
    table{border-collapse:collapse}
    td,th{border:1px solid #999;padding:6px 10px;text-align:center;font-size:16px;font-variant-numeric:tabular-nums}
    th{background:#eee}
    .rows td{text-align:left;font-size:20px;border:0;padding:4px 24px 4px 0}
  </style></head><body><h1>${title}</h1>${body}</body></html>`;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  };
  document.body.appendChild(frame);
}

export default function MultiplicationTable({ locale, n = 7 }: ToolProps<{ n?: number }>) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ v: "one", n: String(n), m: "10", p: String(n) }, { enums: { v: VIEWS, n: NUMS, m: ["10", "20"], p: ["all", ...NUMS] } });
  const view = q.v.v as View;
  const num = Number(q.v.n);
  const max = Number(q.v.m);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [quiz, setQuiz] = useState<{ a: number; b: number } | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; value: number } | null>(null);
  const [score, setScore] = useState({ c: 0, t: 0 });
  const answerRef = useRef<HTMLInputElement>(null);

  function newQuestion() {
    const pool = q.v.p === "all" ? [2, 3, 4, 5, 6, 7, 8, 9] : [Number(q.v.p)];
    setQuiz({ a: pool[randInt(pool.length)], b: 1 + randInt(10) });
    setAnswer("");
    setFeedback(null);
    requestAnimationFrame(() => answerRef.current?.focus());
  }
  function check() {
    if (!quiz) return;
    if (feedback) {
      newQuestion();
      return;
    }
    const v = Number(answer.trim());
    const ok = v === quiz.a * quiz.b;
    setFeedback({ ok, value: quiz.a * quiz.b });
    setScore((s) => ({ c: s.c + (ok ? 1 : 0), t: s.t + 1 }));
  }

  const oneRows = Array.from({ length: max }, (_, i) => i + 1);
  const gridN = max === 20 ? 20 : 10;

  function print() {
    if (view === "grid") {
      const head = `<tr><th>×</th>${Array.from({ length: gridN }, (_, j) => `<th>${j + 1}</th>`).join("")}</tr>`;
      const rows = Array.from({ length: gridN }, (_, i) => `<tr><th>${i + 1}</th>${Array.from({ length: gridN }, (_, j) => `<td>${(i + 1) * (j + 1)}</td>`).join("")}</tr>`).join("");
      printHtml(t.gridTitle(gridN), `<table>${head}${rows}</table>`);
    } else {
      const rows = oneRows.map((i) => `<tr><td>${num} × ${i} = ${num * i}</td></tr>`).join("");
      printHtml(t.title(String(num)), `<table class="rows">${rows}</table>`);
    }
  }

  return (
    <Stack>
      <div className="flex flex-col gap-4">
        <Tabs label={t.viewLabel} value={view} onChange={(v) => q.set({ v })} items={VIEWS.map((v) => ({ value: v, label: t.views[v] }))} />
        {view !== "practice" && (
          <OptionsRow>
            {view === "one" && <InlineSelect id={`${id}-n`} label={t.number} value={q.v.n} onChange={(v) => q.set({ n: v })} options={NUMS.map((x) => ({ value: x, label: x }))} />}
            <InlineToggle
              label={t.upTo}
              showLabel
              value={q.v.m as "10" | "20"}
              onChange={(m) => q.set({ m })}
              options={[
                { value: "10", label: "10" },
                { value: "20", label: "20" },
              ]}
            />
            <Button variant="outline" size="sm" onClick={print}>
              <Printer aria-hidden />
              {t.print}
            </Button>
          </OptionsRow>
        )}

        {view === "one" && (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section aria-label={t.title(q.v.n)} className={cn("grid gap-x-8 rounded-[0.75rem] bg-accent-soft p-5 sm:p-6", max === 20 && "sm:grid-cols-2")}>
              {oneRows.map((i) => (
                <p key={i} className="tabular py-1 text-2xl font-semibold text-fg sm:text-[1.75rem]">
                  <span className="text-fg-2">
                    {num} × {i} =
                  </span>{" "}
                  {num * i}
                </p>
              ))}
            </section>
            <section className="rounded-[0.75rem] border border-line bg-surface p-5">
              <h2 className="text-base font-semibold text-fg">{t.tip}</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-fg-2">{tableTip(locale, num)}</p>
            </section>
          </div>
        )}

        {view === "grid" && (
          <div tabIndex={0} className="tbl" onMouseLeave={() => setHover(null)}>
            <table className="text-center">
              <caption className="sr-only">{t.gridTitle(gridN)}</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-center">
                    ×
                  </th>
                  {Array.from({ length: gridN }, (_, j) => (
                    <th key={j} scope="col" className={cn("text-center", hover?.[1] === j + 1 && "bg-accent-soft! text-accent")}>
                      {j + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: gridN }, (_, i) => (
                  <tr key={i}>
                    <th scope="row" className={cn("text-center", hover?.[0] === i + 1 && "bg-accent-soft! text-accent")}>
                      {i + 1}
                    </th>
                    {Array.from({ length: gridN }, (_, j) => (
                      <td
                        key={j}
                        onMouseEnter={() => setHover([i + 1, j + 1])}
                        className={cn("tabular px-2! text-center", hover && (hover[0] === i + 1 || hover[1] === j + 1) && "bg-accent-soft", hover?.[0] === i + 1 && hover?.[1] === j + 1 && "font-bold text-accent")}
                      >
                        {(i + 1) * (j + 1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === "practice" && (
          <section className="flex flex-col items-center gap-4 rounded-[0.75rem] bg-accent-soft p-6 text-center sm:p-8">
            <OptionsRow className="justify-center">
              <InlineSelect id={`${id}-p`} label={t.practiceOn} value={q.v.p} onChange={(p) => q.set({ p })} options={[{ value: "all", label: t.all }, ...NUMS.map((x) => ({ value: x, label: `× ${x}` }))]} />
            </OptionsRow>
            {quiz ? (
              <>
                <p className="tabular text-5xl font-bold tracking-tight text-fg">
                  {quiz.a} × {quiz.b} = ?
                </p>
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    check();
                  }}
                >
                  <label htmlFor={`${id}-ans`} className="sr-only">
                    {t.answer}
                  </label>
                  <Input ref={answerRef} id={`${id}-ans`} value={answer} onChange={(e) => setAnswer(e.target.value)} inputMode="numeric" autoComplete="off" size="lg" className="tabular w-32 text-center" disabled={!!feedback} />
                  <Button type="submit" variant="primary" size="lg">
                    {feedback ? t.next : t.check}
                  </Button>
                </form>
                <p aria-live="polite" className={cn("min-h-6 text-base font-medium", feedback?.ok ? "text-ok" : "text-err")}>
                  {feedback && (
                    <span className="inline-flex items-center gap-1.5">
                      {feedback.ok ? <Check className="size-5" aria-hidden /> : <X className="size-5" aria-hidden />}
                      {feedback.ok ? t.right : t.wrong(feedback.value)}
                    </span>
                  )}
                </p>
                <p className="text-sm text-fg-2">{t.score(score.c, score.t)}</p>
              </>
            ) : (
              <Button variant="primary" size="lg" onClick={newQuestion}>
                {t.start}
              </Button>
            )}
            <p className="text-[0.8125rem] text-fg-3">{t.practiceHint}</p>
          </section>
        )}
      </div>
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["a × b = b × a — от перестановки множителей произведение не меняется"]}
          notes={[
            "Благодаря переместительному закону в таблице 10 × 10 нужно запомнить не 100 примеров, а 55 — остальные повторяются.",
            "Тренажёр задаёт примеры в случайном порядке и считает верные ответы. Кнопка «Распечатать» печатает только таблицу, без элементов сайта.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["a × b = b × a — swapping the factors does not change the product"]}
          notes={[
            "Because order does not matter, the 10 × 10 chart has only 55 distinct facts to learn instead of 100.",
            "Practice mode asks questions in random order and keeps score. Print outputs just the table, without the rest of the page.",
          ]}
        />
      )}
    </Stack>
  );
}
