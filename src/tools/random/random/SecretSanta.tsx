"use client";

import { Eye, EyeOff, Gift, Plus, X } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { Button, IconButton } from "@/ui/button";
import { Fold } from "@/ui/fold";
import { CopyButton } from "@/ui/copy-button";
import { Field, Select, Textarea } from "@/ui/field";
import { Notice, Panel, PanelHeader } from "@/ui/panel";
import { drawSecretSanta, SANTA_MAX, SANTA_MIN, type SantaError } from "./lib/santa";
import { parseLines } from "./ui/shared";

export interface SecretSantaProps {
  locale: Locale;
}

const T = {
  ru: {
    people: "Имена — по одному на строку",
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
    idle: "Нажмите «Провести жеребьёвку»",
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
    people: "Names — one per line",
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
    idle: "Press “Draw names”",
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <Field label={t.people} htmlFor={`${id}-p`} aside={<span className="tabular shrink-0 whitespace-nowrap text-[0.8125rem] text-fg-3">{count(locale, names.length, t.personForms)}</span>}>
          <Textarea id={`${id}-p`} value={text} rows={7} onChange={(e) => setText(e.target.value)} className="font-sans! text-[0.9375rem]!" />
        </Field>

        <Fold variant="inline" title={`${t.exclusions}${validPairs.length > 0 ? ` (${validPairs.length})` : ""}`} className="-ml-2">
          <div className="flex flex-col gap-3 pl-2">
            <p className="text-sm text-fg-3">{t.exclusionsHint}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              {(
                [
                  [t.first, a, setA, "a"],
                  [t.second, b, setB, "b"],
                ] as const
              ).map(([label, value, set, key]) => (
                <Field key={key} label={label} htmlFor={`${id}-${key}`}>
                  <Select id={`${id}-${key}`} value={value} onChange={(e) => set(e.target.value)}>
                    <option value="">—</option>
                    {names.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
              ))}
              <Button variant="tonal" onClick={addPair} disabled={!a || !b || a === b} className="col-span-2 sm:col-span-1">
                <Plus aria-hidden />
                {t.add}
              </Button>
            </div>
            {validPairs.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {validPairs.map(([x, y]) => (
                  <li key={`${x}|${y}`} className="chip is-on gap-1 py-0.5 pr-1">
                    {x} ✕ {y}
                    <IconButton size="sm" label={`${t.removePair}: ${x}, ${y}`} icon={<X aria-hidden />} onClick={() => setPairs(validPairs.filter((p) => p[0] !== x || p[1] !== y))} className="text-inherit!" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Fold>

        <Button variant="filled" size="xl" onClick={draw} className="w-full sm:w-auto sm:self-start sm:min-w-64">
          <Gift aria-hidden />
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
              <Button variant="text" size="sm" onClick={() => setAll((v) => !v)}>
                {all ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                {all ? t.hideAll : t.showAll}
              </Button>
            )
          }
        />
        <div className="flex flex-col gap-4 px-4 py-4">
          {!result && <p className="py-6 text-center text-sm text-fg-3">{t.idle}</p>}
          {stale && <Notice tone="warn">{t.stale}</Notice>}
          {result && !stale && (
            <>
              <Field label={t.whose} htmlFor={`${id}-who`}>
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
                  <div key={who} className="flex flex-col gap-3 rounded-[1rem] bg-accent-container px-4 py-4 text-on-accent-container motion-safe:animate-[menu-in_0.3s_ease-out] sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xl font-semibold break-words">{message(whoIndex)}</p>
                    <CopyButton value={message(whoIndex)} label={t.copy} copiedLabel={t.copied} />
                  </div>
                )}
              </div>
              {all && (
                <div className="flex flex-col gap-2">
                  <ol className="flex flex-col gap-1 text-[0.9375rem] text-fg">
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
