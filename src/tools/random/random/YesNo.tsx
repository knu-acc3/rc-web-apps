"use client";

import { useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Presentable } from "@/ui/fullscreen";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Field, Input, Switch } from "@/ui/field";
import { randomInt } from "./lib/rng";
import { HistoryPanel, pushHistory } from "./ui/shared";

export interface YesNoProps {
  locale: Locale;
  maybe?: boolean;
}

type Answer = "yes" | "no" | "maybe";

const T = {
  ru: {
    question: "Ваш вопрос (необязательно)",
    placeholder: "Например: идти ли сегодня в кино?",
    ask: "Получить ответ",
    maybe: "Добавить вариант «Может быть»",
    answers: { yes: "Да", no: "Нет", maybe: "Может быть" },
    idle: "Нажмите кнопку",
    history: "История ответов",
    clear: "Очистить",
    empty: "Здесь появятся ответы",
  },
  en: {
    question: "Your question (optional)",
    placeholder: "For example: should I go to the cinema tonight?",
    ask: "Get an answer",
    maybe: "Add “Maybe”",
    answers: { yes: "Yes", no: "No", maybe: "Maybe" },
    idle: "Press the button",
    history: "Answer history",
    clear: "Clear",
    empty: "Answers will appear here",
  },
} as const;

const TONE: Record<Answer, string> = { yes: "bg-ok-soft text-ok", no: "bg-err-soft text-err", maybe: "bg-warn-soft text-warn" };

export default function YesNo({ locale, maybe: maybe0 = false }: YesNoProps) {
  const t = T[locale];
  const id = useId();
  const [question, setQuestion] = useState("");
  const [maybe, setMaybe] = useState(maybe0);
  const [answer, setAnswer] = useState<{ a: Answer; n: number } | null>(null);
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  const hid = useRef(0);

  function ask() {
    const options: Answer[] = maybe ? ["yes", "no", "maybe"] : ["yes", "no"];
    const a = options[randomInt(options.length)];
    const n = hid.current++;
    setAnswer({ a, n });
    const q = question.trim();
    setHistory((h) => pushHistory(h, { id: n, text: q ? `${q} — ${t.answers[a]}` : t.answers[a] }));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,1fr)] lg:items-start">
      <Presentable locale={locale} className="panel flex flex-col items-center gap-5 p-4 pt-14 sm:p-6 sm:pt-14" fullClassName="rounded-none shadow-none">
        <Field label={t.question} htmlFor={`${id}-q`} className="w-full">
          <Input
            id={`${id}-q`}
            value={question}
            placeholder={t.placeholder}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask();
            }}
            autoComplete="off"
            size="lg"
            className="font-normal!"
          />
        </Field>
        <div
          aria-live="polite"
          className={cn(
            "fs-big flex min-h-36 w-full items-center justify-center rounded-[1.25rem] text-6xl font-bold tracking-tight transition-colors duration-150 sm:min-h-48 sm:text-8xl",
            answer ? TONE[answer.a] : "bg-surface-2 text-fg-3",
          )}
        >
          {answer ? <span key={answer.n} className="motion-safe:animate-[menu-in_0.35s_ease-out]">{t.answers[answer.a]}</span> : <span className="text-base font-normal tracking-normal">{t.idle}</span>}
        </div>
        <Button variant="filled" size="xl" onClick={ask} className="w-full sm:w-auto sm:min-w-64">
          {t.ask}
        </Button>
        <Switch label={t.maybe} checked={maybe} onChange={(e) => setMaybe(e.target.checked)} />
      </Presentable>
      <HistoryPanel title={t.history} items={history} onClear={() => setHistory([])} clearLabel={t.clear} emptyLabel={t.empty} />
    </div>
  );
}
