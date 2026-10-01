"use client";

import { Crown, Users } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { linkHere, listHash, useSharedList } from "@/lib/share-link";
import { Field, Switch, Textarea } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { ShareLink } from "@/ui/share-link";
import { Panel, PanelHeader } from "@/ui/panel";
import { shuffle } from "./lib/rng";
import { splitIntoTeams, type Team } from "./lib/teams";
import { parseLines } from "./ui/shared";

export interface TeamsProps {
  locale: Locale;
  teams?: number;
}

const MAX_PEOPLE = 500;

const T = {
  ru: {
    people: "Имена — по одному на строку",
    personForms: ["участник", "участника", "участников"],
    teamForms: ["команда", "команды", "команд"],
    humanForms: ["человек", "человека", "человек"],
    teams: "Количество команд",
    captains: "Выбрать капитанов",
    names: "Дать командам названия",
    split: "Разделить на команды",
    team: "Команда",
    captain: "капитан",
    idle: "Нажмите «Разделить на команды»",
    few: "Участников должно быть не меньше, чем команд",
    copy: "Копировать",
    copied: "Скопировано",
    result: "Команды",
    by: "по",
    and: "и",
    teamNames: ["Красные", "Синие", "Зелёные", "Жёлтые", "Оранжевые", "Фиолетовые", "Белые", "Чёрные", "Серебряные", "Золотые", "Молнии", "Кометы", "Тигры", "Волки", "Соколы", "Медведи", "Драконы", "Акулы", "Барсы", "Орлы"],
  },
  en: {
    people: "Names — one per line",
    personForms: ["participant", "participants"],
    teamForms: ["team", "teams"],
    humanForms: ["person", "people"],
    teams: "Number of teams",
    captains: "Pick captains",
    names: "Give teams names",
    split: "Split into teams",
    team: "Team",
    captain: "captain",
    idle: "Press “Split into teams”",
    few: "You need at least as many participants as teams",
    copy: "Copy",
    copied: "Copied",
    result: "Teams",
    by: "of",
    and: "and",
    teamNames: ["Reds", "Blues", "Greens", "Yellows", "Oranges", "Purples", "Whites", "Blacks", "Silvers", "Golds", "Lightning", "Comets", "Tigers", "Wolves", "Falcons", "Bears", "Dragons", "Sharks", "Panthers", "Eagles"],
  },
} as const;

const DEFAULT: Record<Locale, string[]> = {
  ru: ["Алексей", "Мария", "Дмитрий", "Айгерим", "Иван", "Ольга", "Нурлан", "Екатерина", "Сергей", "Анна", "Тимур", "Полина"],
  en: ["Alex", "Maria", "Daniel", "Sophie", "James", "Olivia", "Liam", "Emma", "Noah", "Grace", "Oscar", "Lily"],
};

export default function Teams({ locale, teams: teams0 = 2 }: TeamsProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(DEFAULT[locale].join("\n"));
  const [teamCount, setTeamCount] = useState(teams0);
  const [captains, setCaptains] = useState(false);
  const [named, setNamed] = useState(false);
  const [result, setResult] = useState<{ teams: Team<string>[]; names: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const people = parseLines(text, MAX_PEOPLE);
  useSharedList("p", MAX_PEOPLE, 200, (xs) => setText(xs.join("\n")));

  function split() {
    if (people.length < teamCount) {
      setError(t.few);
      setResult(null);
      return;
    }
    setError(null);
    const names = named ? shuffle(t.teamNames).slice(0, teamCount) : Array.from({ length: teamCount }, (_, i) => `${t.team} ${i + 1}`);
    setResult({ teams: splitIntoTeams(people, teamCount, captains), names });
  }

  const title = (i: number) => (result && named ? `${t.team} «${result.names[i]}»`.replace("«", locale === "ru" ? "«" : "“").replace("»", locale === "ru" ? "»" : "”") : result?.names[i] ?? "");

  const summary = (() => {
    const n = people.length;
    const k = teamCount;
    if (n < k || k < 1) return "";
    const lo = Math.floor(n / k);
    const extra = n % k;
    const sizes =
      extra === 0
        ? `${t.by} ${count(locale, lo, t.humanForms)}`
        : `${extra} ${t.by} ${lo + 1} ${t.and} ${k - extra} ${t.by} ${count(locale, lo, t.humanForms)}`;
    return `${count(locale, n, t.personForms)} → ${count(locale, k, t.teamForms)} ${sizes}`;
  })();

  const asText = result
    ? result.teams
        .map((tm, i) => `${title(i)}:\n${tm.members.map((m, j) => `${j + 1}. ${m}${j === tm.captain ? ` (${t.captain})` : ""}`).join("\n")}`)
        .join("\n\n")
    : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <Field label={t.people} htmlFor={`${id}-p`} aside={<span className="tabular shrink-0 whitespace-nowrap text-[0.8125rem] text-fg-3">{count(locale, people.length, t.personForms)}</span>}>
          <Textarea id={`${id}-p`} value={text} rows={8} onChange={(e) => setText(e.target.value)} className="font-sans! text-[0.9375rem]!" />
        </Field>
        <Field label={t.teams} htmlFor={`${id}-k`} className="w-44">
          <NumberInput id={`${id}-k`} locale={locale} min={2} max={20} value={teamCount} onChange={(v) => v !== null && setTeamCount(v)} />
        </Field>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Switch label={t.captains} checked={captains} onChange={(e) => setCaptains(e.target.checked)} />
          <Switch label={t.names} checked={named} onChange={(e) => setNamed(e.target.checked)} />
        </div>
        {summary && <p className="tabular text-sm text-fg-2">{summary}</p>}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="filled" size="xl" onClick={split} className="w-full sm:w-auto sm:min-w-64">
            <Users aria-hidden />
            {t.split}
          </Button>
          <ShareLink locale={locale} url={() => linkHere({ hash: listHash("p", people) })} className="self-center sm:ml-auto" />
        </div>
        {error && (
          <p className="text-sm text-err" role="alert">
            {error}
          </p>
        )}
      </Panel>

      <Panel>
        <PanelHeader title={t.result} actions={result && <CopyButton value={asText} label={t.copy} copiedLabel={t.copied} variant="ghost" />} />
        {!result && <p className="px-4 py-10 text-center text-sm text-fg-3">{t.idle}</p>}
        <div aria-live="polite">
          {result && (
            <ul key={result.names.join("|") + result.teams[0]?.members.join("|")} className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))] gap-3 p-4 motion-safe:animate-[menu-in_0.25s_ease-out]">
              {result.teams.map((tm, i) => (
                <li key={i} className="rounded-[1rem] bg-surface-2 p-3">
                  <h3 className="mb-2 flex items-baseline justify-between gap-2 font-semibold text-fg">
                    <span className="min-w-0 break-words">{title(i)}</span>
                    <span className="tabular shrink-0 text-[0.8125rem] font-normal text-fg-3">{count(locale, tm.members.length, t.humanForms)}</span>
                  </h3>
                  <ol className="flex flex-col gap-1 text-[0.9375rem] text-fg">
                    {tm.members.map((m, j) => (
                      <li key={j} className="flex items-center gap-2 break-words">
                        <span className="tabular w-5 shrink-0 text-right text-[0.8125rem] text-fg-3">{j + 1}.</span>
                        <span className="min-w-0">{m}</span>
                        {j === tm.captain && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[0.75rem] font-medium text-accent">
                            <Crown className="size-3" aria-hidden />
                            {t.captain}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  );
}

