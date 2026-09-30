"use client";

import { ChevronDown, Eye, EyeOff, Plus, X } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Select, Textarea } from "@/ui/field";
import { Notice, Panel, PanelHeader } from "@/ui/panel";
import { drawSecretSanta, SANTA_MAX, SANTA_MIN, type SantaError } from "./lib/santa";
import { parseLines } from "./shared";

export interface SecretSantaProps {
  locale: Locale;
}

const T = {
  ru: {
    people: "Участники — по одному на строку",
    personForms: ["участник", "участника", "участников"],
    exclusions: "Исключения",
    exclusionsHint: "Пары, которые не должны дарить подарки друг другу (например, супруги).",
    first: "Первый участник",
    second: "Второй участник",
    add: "Добавить пару",
    removePair: "Убрать пару",
    draw: "Провести жеребьёвку",
    redraw: "Провести заново",
    result: "Результат жеребьёвки",
    whose: "Чей результат показать",
    choose: "Выберите участника",
    message: (giver: string, receiver: string) => `${giver}, ты даришь подарок: ${receiver}`,
    showAll: "Показать всех",
    hideAll: "Скрыть",
    copyAll: "Копировать всё",
    copy: "Копировать сообщение",
    copied: "Скопировано",
    idle: "Впишите участников и нажмите «Провести жеребьёвку». Каждый получит одного получателя, никто не вытянет сам себя.",
    stale: "Список участников изменился — проведите жеребьёвку заново.",
    duplicate: (n: string) => `Имя «${n}» встречается дважды — сделайте имена различимыми (например, добавьте фамилию).`,
    tooMany: `Не больше ${SANTA_MAX} участников`,
    errors: {
      few: `Нужно хотя бы ${SANTA_MIN} участника`,
      noRecipient: (n: string) => `Из-за исключений ${n} не может дарить никому. Уберите одну из пар с этим участником.`,
      noGiver: (n: string) => `Из-за исключений никто не может дарить подарок участнику ${n}. Уберите одну из пар.`,
      impossible: "С такими исключениями распределить подарки невозможно: кому-то не хватает допустимых получателей. Уберите часть пар.",
      tooConstrained: "Исключений слишком много, чтобы провести честную жеребьёвку. Уберите часть пар.",
    },
    arrow: "→",
  },
  en: {
    people: "Participants — one per line",
    personForms: ["participant", "participants"],
    exclusions: "Exclusions",
    exclusionsHint: "Pairs who must not give gifts to each other (for example, partners).",
    first: "First person",
    second: "Second person",
    add: "Add pair",
    removePair: "Remove pair",
    draw: "Draw names",
    redraw: "Draw again",
    result: "Draw result",
    whose: "Show the result for",
    choose: "Choose a participant",
    message: (giver: string, receiver: string) => `${giver}, you're giving a gift to: ${receiver}`,
    showAll: "Show all",
    hideAll: "Hide",
    copyAll: "Copy all",
    copy: "Copy message",
    copied: "Copied",
    idle: "Enter the participants and press “Draw names”. Everyone gets exactly one person, and nobody draws themselves.",
    stale: "The participant list has changed — draw again.",
    duplicate: (n: string) => `“${n}” appears twice — make the names distinct (add a surname, for example).`,
    tooMany: `Up to ${SANTA_MAX} participants`,
    errors: {
      few: `You need at least ${SANTA_MIN} participants`,
      noRecipient: (n: string) => `Because of the exclusions ${n} can't give to anyone. Remove one of their pairs.`,
      noGiver: (n: string) => `Because of the exclusions nobody can give a gift to ${n}. Remove one of the pairs.`,
      impossible: "These exclusions make a valid draw impossible: someone runs out of allowed recipients. Remove some pairs.",
      tooConstrained: "There are too many exclusions for a fair draw. Remove some pairs.",
    },
    arrow: "→",
  },
} as const;

const DEFAULT: Record<Locale, string[]> = {
  ru: ["Аня", "Борис", "Вика", "Гоша", "Дина", "Ерлан"],
  en: ["Anna", "Ben", "Chloe", "Dan", "Ella", "Felix"],
};

export default function SecretSanta({ locale }: SecretSantaProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(DEFAULT[locale].join("\n"));
  const [pairs, setPairs] = useState<[string, string][]>([]);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [showEx, setShowEx] = useState(false);
  const [result, setResult] = useState<{ names: string[]; to: number[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [who, setWho] = useState("");
  const [all, setAll] = useState(false);

  const names = parseLines(text, SANTA_MAX + 1);
  const dup = names.find((n, i) => names.indexOf(n) !== i);
  const validPairs = pairs.filter(([x, y]) => names.includes(x) && names.includes(y));
  const stale = !!result && result.names.join("\n") !== names.join("\n");

  function explain(e: SantaError, person?: number): string {
    const p = person !== undefined ? names[person] : "";
    if (e === "noRecipient") return t.errors.noRecipient(p);
    if (e === "noGiver") return t.errors.noGiver(p);
    return t.errors[e];
  }

  function draw() {
    setAll(false);
    setWho("");
    if (names.length > SANTA_MAX) return setError(t.tooMany);
    if (dup) return setError(t.duplicate(dup));
    const ex = validPairs.map(([x, y]) => [names.indexOf(x), names.indexOf(y)] as const);
    const r = drawSecretSanta(names.length, ex);
    if (!r.ok) {
      setResult(null);
      setError(explain(r.error, r.person));
      return;
    }
    setError(null);
    setResult({ names: names.slice(), to: r.assignment });
  }

  function addPair() {
    if (!a || !b || a === b) return;
    if (validPairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return;
    setPairs([...validPairs, [a, b]]);
    setA("");
    setB("");
  }

  const message = (g: number) => (result ? t.message(result.names[g], result.names[result.to[g]]) : "");
  const whoIndex = result ? result.names.indexOf(who) : -1;
  const allText = result ? result.names.map((_, g) => message(g)).join("\n") : "";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <Field label={t.people} htmlFor={`${id}-p`} aside={<span className="tabular text-[13px] text-fg-3">{count(locale, names.length, t.personForms)}</span>}>
          <Textarea id={`${id}-p`} value={text} rows={7} onChange={(e) => setText(e.target.value)} className="font-sans! text-[15px]!" />
        </Field>

        <div>
          <Button variant="ghost" size="sm" onClick={() => setShowEx((v) => !v)} aria-expanded={showEx} aria-controls={`${id}-ex`} className="-ml-2">
            <ChevronDown aria-hidden className={cn("transition-transform duration-150", showEx && "rotate-180")} />
            {t.exclusions}
            {validPairs.length > 0 && ` (${validPairs.length})`}
          </Button>
          {showEx && (
            <div id={`${id}-ex`} className="mt-2 flex flex-col gap-3">
              <p className="text-sm text-fg-3">{t.exclusionsHint}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                {(
                  [
                    [t.first, a, setA, "a"],
                    [t.second, b, setB, "b"],
                  ] as const
                ).map(([label, value, set, key]) => (
                  <Field key={key} label={label} htmlFor={`${id}-${key}`}>
                    <Select id={`${id}-${key}`} value={value} onChange={(e) => set(e.target.value)} size="sm">
                      <option value="">—</option>
                      {names.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ))}
                <Button variant="outline" size="sm" onClick={addPair} disabled={!a || !b || a === b} className="col-span-2 h-9! sm:col-span-1">
                  <Plus aria-hidden />
                  {t.add}
                </Button>
              </div>
              {validPairs.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {validPairs.map(([x, y]) => (
                    <li key={`${x}|${y}`} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 py-0.5 pr-1 pl-3 text-sm text-fg">
                      {x} ✕ {y}
                      <button
                        type="button"
                        onClick={() => setPairs(validPairs.filter((p) => p[0] !== x || p[1] !== y))}
                        aria-label={`${t.removePair}: ${x}, ${y}`}
                        className="rounded-full p-1 text-fg-3 hover:bg-line hover:text-fg"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <Button variant="primary" size="lg" onClick={draw} className="w-full sm:w-auto sm:self-start sm:min-w-56">
          {result ? t.redraw : t.draw}
        </Button>
        {error && <Notice tone="err">{error}</Notice>}
      </Panel>

      <Panel>
        <PanelHeader
          title={t.result}
          actions={
            result &&
            !stale && (
              <Button variant="ghost" size="sm" onClick={() => setAll((v) => !v)}>
                {all ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                {all ? t.hideAll : t.showAll}
              </Button>
            )
          }
        />
        <div className="flex flex-col gap-4 px-4 py-4">
          {!result && <p className="text-sm text-fg-3">{t.idle}</p>}
          {stale && <Notice tone="warn">{t.stale}</Notice>}
          {result && !stale && (
            <>
              <Field label={t.whose} htmlFor={`${id}-who`} className="sm:max-w-xs">
                <Select id={`${id}-who`} value={who} onChange={(e) => setWho(e.target.value)}>
                  <option value="">{t.choose}</option>
                  {result.names.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
              <div aria-live="polite" className="min-h-8">
                {whoIndex >= 0 && (
                  <div className="flex flex-col gap-3 rounded-[10px] bg-accent-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xl font-semibold break-words text-fg">{message(whoIndex)}</p>
                    <CopyButton value={message(whoIndex)} label={t.copy} copiedLabel={t.copied} />
                  </div>
                )}
              </div>
              {all && (
                <div className="flex flex-col gap-2">
                  <ol className="flex flex-col gap-1 text-[15px] text-fg">
                    {result.names.map((n, g) => (
                      <li key={n} className="break-words">
                        {n} <span className="text-fg-3">{t.arrow}</span> {result.names[result.to[g]]}
                      </li>
                    ))}
                  </ol>
                  <CopyButton value={allText} label={t.copyAll} copiedLabel={t.copied} variant="outline" className="self-start" />
                </div>
              )}
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
