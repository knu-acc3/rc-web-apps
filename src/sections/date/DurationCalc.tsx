"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { CopyButton } from "@/ui/copy-button";
import { Textarea } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { formatDuration, sumDurations } from "./lib/engine";
import { BigResult } from "./ui";

const T = {
  ru: {
    label: "Промежутки времени — по одному в строке",
    hint: "Например: 1:30:00, 45 мин, 2ч 15м, −0:20. Минус в начале строки вычитает.",
    bare: "Число без единиц —",
    min: "минуты",
    sec: "секунды",
    hour: "часы",
    total: "Итого",
    bad: (lines: string) => `Не удалось разобрать строки: ${lines}`,
    hours: "в часах",
    minutes: "в минутах",
    seconds: "в секундах",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    label: "Durations — one per line",
    hint: "E.g. 1:30:00, 45 min, 2h 15m, −0:20. A leading minus subtracts.",
    bare: "Plain numbers are",
    min: "minutes",
    sec: "seconds",
    hour: "hours",
    total: "Total",
    bad: (lines: string) => `Could not read lines: ${lines}`,
    hours: "in hours",
    minutes: "in minutes",
    seconds: "in seconds",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const EXAMPLE = "1:30:00\n45 мин\n2ч 15м\n-0:20:00";
const EXAMPLE_EN = "1:30:00\n45 min\n2h 15m\n-0:20:00";

export default function DurationCalc({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(locale === "ru" ? EXAMPLE : EXAMPLE_EN);
  const [bare, setBare] = useState<"min" | "sec" | "hour">("min");
  const lines = text.split("\n");
  const { total, bad } = sumDurations(lines, bare);
  const hasInput = lines.some((l) => l.trim());
  const shown = formatDuration(total);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-t`} className="text-sm font-medium text-fg-2">
            {t.label}
          </label>
          <Textarea id={`${id}-t`} rows={8} value={text} onChange={(e) => setText(e.target.value)} className="min-h-48 text-base" />
          <p className="text-[13px] text-fg-3">{t.hint}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-fg-3">
            {t.bare}
            <Segmented
              label={t.bare}
              size="sm"
              value={bare}
              onChange={setBare}
              options={[
                { value: "min", label: t.min },
                { value: "sec", label: t.sec },
                { value: "hour", label: t.hour },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-[10px] bg-surface-2 p-4">
          <BigResult caption={t.total} value={hasInput ? shown : "—"} />
          {hasInput && <CopyButton value={shown} label={t.copy} copiedLabel={t.copied} variant="ghost" />}
          {hasInput && (
            <dl className="grid w-full grid-cols-3 gap-2 text-center text-[13px]">
              <div>
                <dt className="text-fg-3">{t.hours}</dt>
                <dd className="tabular font-semibold text-fg">{formatNumber(locale, total / 3600, { maximumFractionDigits: 3 })}</dd>
              </div>
              <div>
                <dt className="text-fg-3">{t.minutes}</dt>
                <dd className="tabular font-semibold text-fg">{formatNumber(locale, total / 60, { maximumFractionDigits: 2 })}</dd>
              </div>
              <div>
                <dt className="text-fg-3">{t.seconds}</dt>
                <dd className="tabular font-semibold text-fg">{formatNumber(locale, total)}</dd>
              </div>
            </dl>
          )}
          {bad.length > 0 && <p className="text-center text-sm text-err">{t.bad(bad.map((i) => i + 1).join(", "))}</p>}
        </div>
      </Panel>
    </div>
  );
}
