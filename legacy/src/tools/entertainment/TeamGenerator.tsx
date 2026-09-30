"use client";

import { useState } from "react";
import { Shuffle, Users, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";

type TeamErrorCode =
  | "participants-min"
  | "participants-count"
  | "participant-length"
  | "teams-invalid"
  | "teams-range";

type TeamResult =
  | {
      kind: "success";
      teams: string[][];
      participantCount: number;
      smallestTeam: number;
      largestTeam: number;
    }
  | {
      kind: "error";
      code: TeamErrorCode;
      participantCount: number;
    };

class TeamInputError extends Error {
  code: TeamErrorCode;
  participantCount: number;

  constructor(code: TeamErrorCode, participantCount = 0) {
    super(code);
    this.name = "TeamInputError";
    this.code = code;
    this.participantCount = participantCount;
  }
}

type RandomIntSource = (maxExclusive: number) => number;

const MAX_PARTICIPANTS = 200;
const MAX_PARTICIPANT_LENGTH = 100;
const MAX_TEXT_LENGTH = 20_000;
const UINT32_RANGE = 0x1_0000_0000;
const INTEGER_VALUE = /^\d+$/;

export function unbiasedRandomInt(maxExclusive: number): number {
  if (
    !Number.isSafeInteger(maxExclusive) ||
    maxExclusive <= 0 ||
    maxExclusive > UINT32_RANGE
  ) {
    throw new RangeError("maxExclusive is outside the supported range");
  }

  const cryptoSource =
    typeof globalThis === "undefined" ? undefined : globalThis.crypto;
  if (cryptoSource?.getRandomValues) {
    const acceptedRange = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
    const buffer = new Uint32Array(1);

    do {
      cryptoSource.getRandomValues(buffer);
    } while (buffer[0] >= acceptedRange);

    return buffer[0] % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

function normalizeParticipants(value: string, deduplicate: boolean): string[] {
  const participants = value
    .split(/\r?\n/)
    .map((participant) => participant.trim())
    .filter(Boolean);

  if (participants.length > MAX_PARTICIPANTS) {
    throw new TeamInputError("participants-count", participants.length);
  }
  if (
    participants.some(
      (participant) => participant.length > MAX_PARTICIPANT_LENGTH,
    )
  ) {
    throw new TeamInputError("participant-length", participants.length);
  }

  const validParticipants = deduplicate
    ? Array.from(new Set(participants))
    : participants;
  if (validParticipants.length < 2) {
    throw new TeamInputError("participants-min", validParticipants.length);
  }
  return validParticipants;
}

export function buildRandomTeams(
  participants: readonly string[],
  teamCount: number,
  randomInt: RandomIntSource = unbiasedRandomInt,
): string[][] {
  const shuffled = participants.slice();

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    if (!Number.isInteger(swapIndex) || swapIndex < 0 || swapIndex > index) {
      throw new RangeError("randomInt returned an invalid index");
    }
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  const teams = Array.from({ length: teamCount }, () => [] as string[]);
  shuffled.forEach((participant, index) => {
    teams[index % teamCount].push(participant);
  });
  return teams;
}

function generateTeams(
  participantInput: string,
  teamCountInput: string,
  deduplicate: boolean,
): TeamResult {
  try {
    const participants = normalizeParticipants(participantInput, deduplicate);
    const trimmedTeamCount = teamCountInput.trim();
    if (!INTEGER_VALUE.test(trimmedTeamCount)) {
      throw new TeamInputError("teams-invalid", participants.length);
    }

    const teamCount = Number(trimmedTeamCount);
    if (!Number.isSafeInteger(teamCount)) {
      throw new TeamInputError("teams-invalid", participants.length);
    }
    if (teamCount < 2 || teamCount > participants.length) {
      throw new TeamInputError("teams-range", participants.length);
    }

    const teams = buildRandomTeams(participants, teamCount);
    const sizes = teams.map((team) => team.length);
    return {
      kind: "success",
      teams,
      participantCount: participants.length,
      smallestTeam: Math.min(...sizes),
      largestTeam: Math.max(...sizes),
    };
  } catch (caught) {
    if (caught instanceof TeamInputError) {
      return {
        kind: "error",
        code: caught.code,
        participantCount: caught.participantCount,
      };
    }
    return {
      kind: "error",
      code: "teams-invalid",
      participantCount: 0,
    };
  }
}

function errorMessage(
  result: Extract<TeamResult, { kind: "error" }>,
  isEn: boolean,
): string {
  if (result.code === "participants-min") {
    return isEn
      ? "Enter at least two valid participants. Empty lines are ignored."
      : "Введите минимум двух участников. Пустые строки игнорируются.";
  }
  if (result.code === "participants-count") {
    return isEn
      ? "The list can contain up to 200 non-empty participants."
      : "В списке может быть не больше 200 непустых участников.";
  }
  if (result.code === "participant-length") {
    return isEn
      ? "Each participant name can contain up to 100 characters."
      : "Имя каждого участника может содержать не больше 100 символов.";
  }
  if (result.code === "teams-invalid") {
    return isEn
      ? "Enter a valid whole number of teams."
      : "Введите корректное целое количество команд.";
  }

  return isEn
    ? "Team count must be from 2 to " +
        Math.max(2, result.participantCount) +
        " for this list."
    : "Количество команд для этого списка должно быть от 2 до " +
        Math.max(2, result.participantCount) +
        ".";
}

function teamName(index: number, isEn: boolean): string {
  return (isEn ? "Team " : "Команда ") + (index + 1);
}

export default function TeamGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [participantInput, setParticipantInput] = useState("");
  const [teamCount, setTeamCount] = useState("2");
  const [deduplicate, setDeduplicate] = useState(false);
  const [result, setResult] = useState<TeamResult | null>(null);

  return (
    <div
      data-entertainment-tool="team-generator"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn
            ? "Split participants into teams"
            : "Разделите участников на команды"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Add one participant per line and choose the number of teams. Empty lines are ignored."
            : "Добавьте по одному участнику на строку и укажите количество команд. Пустые строки игнорируются."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(generateTeams(participantInput, teamCount, deduplicate));
          }}
        >
          <div>
            <Label htmlFor="team-participants">
              {isEn
                ? "Participants — one per line"
                : "Участники — по одному на строку"}
            </Label>
            <Textarea
              id="team-participants"
              value={participantInput}
              onChange={(event) => {
                setParticipantInput(event.target.value);
                setResult(null);
              }}
              maxLength={MAX_TEXT_LENGTH}
              rows={7}
              autoFocus
              spellCheck={false}
              className="mt-2"
              placeholder={
                isEn ? "One participant per line" : "Один участник на строку"
              }
            />
          </div>

          <div className="mt-4 max-w-xs">
            <Label htmlFor="team-count">
              {isEn ? "Number of teams" : "Количество команд"}
            </Label>
            <Input
              id="team-count"
              value={teamCount}
              onChange={(event) => {
                setTeamCount(event.target.value);
                setResult(null);
              }}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              maxLength={3}
              className="mt-2 font-mono"
            />
          </div>

          <ToolPrimaryAction
            type="submit"
            className="mt-4"
            leadingIcon={<Shuffle size={20} weight="bold" />}
          >
            {isEn ? "Generate teams" : "Сформировать команды"}
          </ToolPrimaryAction>
        </form>

        {result ? (
          result.kind === "error" ? (
            <section
              aria-live="polite"
              data-team-result=""
              data-team-status="error"
              role="alert"
              className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-surface-muted)] p-4"
            >
              <div className="flex items-start gap-3">
                <XCircle
                  size={24}
                  weight="fill"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[var(--color-danger)]"
                />
                <div>
                  <h3 className="font-bold text-[var(--color-danger)]">
                    {isEn ? "Check the input" : "Проверьте данные"}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {errorMessage(result, isEn)}
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section
              aria-live="polite"
              data-team-result=""
              data-team-status="success"
              data-team-count={result.teams.length}
              data-team-participants={result.participantCount}
              data-team-size-min={result.smallestTeam}
              data-team-size-max={result.largestTeam}
              className="mt-4"
            >
              <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-primary)]/30 bg-[var(--color-surface-muted)] p-4">
                <Users
                  size={25}
                  weight="fill"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[var(--color-primary)]"
                />
                <div>
                  <h3 className="font-bold text-[var(--color-text)]">
                    {isEn ? "Teams are ready" : "Команды готовы"}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {isEn
                      ? result.participantCount +
                        " participants · " +
                        result.teams.length +
                        " teams · " +
                        result.smallestTeam +
                        "–" +
                        result.largestTeam +
                        " per team"
                      : result.participantCount +
                        " участников · " +
                        result.teams.length +
                        " команд · по " +
                        result.smallestTeam +
                        "–" +
                        result.largestTeam}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {result.teams.map((team, teamIndex) => (
                  <section
                    key={teamIndex}
                    data-team-index={teamIndex}
                    className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                  >
                    <h4 className="font-bold text-[var(--color-text)]">
                      {teamName(teamIndex, isEn)}
                    </h4>
                    <ol className="mt-2 space-y-1.5">
                      {team.map((participant, participantIndex) => (
                        <li
                          key={participantIndex}
                          data-team-member=""
                          className="break-words text-sm leading-relaxed text-[var(--color-text-muted)]"
                        >
                          {participant}
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            </section>
          )
        ) : null}
      </section>

      <AdvancedSettings
        title={isEn ? "Duplicate handling" : "Обработка дублей"}
        description={
          isEn
            ? "Optionally remove exact repeated names"
            : "Необязательное удаление точных повторов"
        }
      >
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-2.5">
          <input
            type="checkbox"
            checked={deduplicate}
            onChange={(event) => {
              setDeduplicate(event.target.checked);
              setResult(null);
            }}
            className="size-5 shrink-0 accent-[var(--color-primary)]"
          />
          <span className="text-sm font-semibold text-[var(--color-text)]">
            {isEn
              ? "Remove exact duplicates before shuffling"
              : "Удалять точные дубли перед перемешиванием"}
          </span>
        </label>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Off by default: repeated lines are treated as separate participants. Matching is exact after trimming spaces."
            : "По умолчанию выключено: повторяющиеся строки считаются отдельными участниками. Совпадение проверяется после удаления пробелов по краям."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
