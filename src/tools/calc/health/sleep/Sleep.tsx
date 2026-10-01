"use client";

import { useId } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Field, Input } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../../types";
import { useMinuteClock } from "../../shared/clock";
import { field } from "../../shared/num";
import { Advanced, CalcGrid, Disclaimer, Explain, NumSlider, ResultMain, SliderRow, Stack, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { bedtimesFor, hm, hm12, parseHm, wakeTimesFor, type SleepOption } from "../lib/sleep";

const MODES = ["wake", "bed", "now"] as const;
type Mode = (typeof MODES)[number];

const T = {
  ru: {
    mode: "Режим",
    wake: "Проснуться в",
    bed: "Лечь в",
    now: "Лечь сейчас",
    wakeAt: "Во сколько нужно встать",
    bedAt: "Во сколько ложитесь",
    settings: "Длина цикла и время засыпания",
    cycle: "Длина цикла",
    fall: "Время на засыпание",
    labelWake: "Ложитесь спать в",
    labelBed: "Просыпайтесь в",
    labelNow: "Если лечь сейчас, вставайте в",
    sub: (c: number, s: string) => `${c} ${plural("ru", c, ["цикл", "цикла", "циклов"])} — ${s} сна`,
    alt: (c: number, s: string) => `${c} ${plural("ru", c, ["цикл", "цикла", "циклов"])} · ${s}`,
    nowIs: (t: string) => `сейчас ${t}`,
    waiting: "Определяем текущее время…",
    enter: "Укажите время",
    h: "ч",
    m: "мин",
  },
  en: {
    mode: "Mode",
    wake: "Wake up at",
    bed: "Go to bed at",
    now: "Sleep now",
    wakeAt: "Time to wake up",
    bedAt: "Bedtime",
    settings: "Cycle length and time to fall asleep",
    cycle: "Cycle length",
    fall: "Time to fall asleep",
    labelWake: "Go to bed at",
    labelBed: "Wake up at",
    labelNow: "If you go to bed now, wake up at",
    sub: (c: number, s: string) => `${c} ${c === 1 ? "cycle" : "cycles"} — ${s} of sleep`,
    alt: (c: number, s: string) => `${c} ${c === 1 ? "cycle" : "cycles"} · ${s}`,
    nowIs: (t: string) => `it is ${t} now`,
    waiting: "Reading the current time…",
    enter: "Enter a time",
    h: "h",
    m: "min",
  },
} as const;

function dur(locale: Locale, min: number): string {
  const t = T[locale];
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ${t.h} ${m} ${t.m}` : `${h} ${t.h}`;
}

export default function Sleep({ locale, mode = "wake", time = "07:00" }: ToolProps<{ mode?: Mode; time?: string }>) {
  const t = T[locale];
  const id = useId();
  const minute = useMinuteClock();
  const q = useQueryState({ m: mode, t: time, c: "90", f: "15" }, { enums: { m: MODES } });
  const m = q.v.m as Mode;
  const C = field(locale, q.v.c, { min: 60, max: 120, int: true });
  const F = field(locale, q.v.f, { min: 0, max: 90, int: true });
  const clock = (x: number) => (locale === "ru" ? hm(x) : hm12(x));
  const at = parseHm(q.v.t);
  const nowLocal = minute !== null ? (() => {
    const d = new Date(minute * 60_000);
    return d.getHours() * 60 + d.getMinutes();
  })() : null;

  let opts: SleepOption[] | null = null;
  if (C.value !== null && F.value !== null) {
    if (m === "wake" && at !== null) opts = bedtimesFor(at, C.value, F.value, [5, 6, 4, 3]);
    if (m === "bed" && at !== null) opts = wakeTimesFor(at, C.value, F.value, [5, 6, 4, 3]);
    if (m === "now" && nowLocal !== null) opts = wakeTimesFor(nowLocal, C.value, F.value, [5, 6, 4, 3]);
  }
  const main = opts?.[0];
  const label = m === "wake" ? t.labelWake : m === "bed" ? t.labelBed : t.labelNow;
  const sub = main ? `${t.sub(main.cycles, dur(locale, main.sleep))}${m === "now" && nowLocal !== null ? `; ${t.nowIs(clock(nowLocal))}` : ""}` : m === "now" ? t.waiting : t.enter;

  const inputs = (
    <>
      <Segmented
        label={t.mode}
        fill
        value={m}
        onChange={(v) => q.set({ m: v })}
        options={[
          { value: "wake", label: t.wake },
          { value: "bed", label: t.bed },
          { value: "now", label: t.now },
        ]}
      />
      {m !== "now" && (
        <Field label={m === "wake" ? t.wakeAt : t.bedAt} htmlFor={`${id}-t`}>
          <Input id={`${id}-t`} type="time" size="lg" value={q.v.t} onChange={(e) => q.set({ t: e.target.value })} className="tabular" />
        </Field>
      )}
      <Advanced title={t.settings} open={q.v.c !== "90" || q.v.f !== "15"}>
        <SliderRow>
          <NumSlider id={`${id}-c`} locale={locale} label={t.cycle} value={q.v.c} onChange={(c) => q.set({ c })} suffix={t.m} error={C.message} min={60} max={120} step={5} />
          <NumSlider id={`${id}-f`} locale={locale} label={t.fall} value={q.v.f} onChange={(f) => q.set({ f })} suffix={t.m} error={F.message} min={0} max={60} />
        </SliderRow>
      </Advanced>
    </>
  );

  return (
    <Stack>
      <CalcGrid
        inputs={inputs}
        result={
          <ResultMain
            label={label}
            value={main ? clock(main.time) : "—"}
            sub={sub}
            rows={opts?.slice(1).map((o) => ({ label: t.alt(o.cycles, dur(locale, o.sleep)), value: clock(o.time) }))}
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          />
        }
      />
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Лечь = подъём − N × 90 мин − время на засыпание", "Подъём = отбой + время на засыпание + N × 90 мин"]}
          notes={[
            "Сон состоит из циклов примерно по 90 минут (у разных людей — от 80 до 110). Проснуться в конце цикла, в фазе лёгкого сна, обычно легче, чем посреди глубокого сна.",
            "Взрослым рекомендуется спать не меньше 7 часов (рекомендации AASM и NSF: 7–9 часов). Поэтому основной вариант — 5 циклов (7,5 часа), 6 циклов — если есть возможность выспаться.",
            "В среднем человек засыпает за 10–20 минут; калькулятор по умолчанию добавляет 15. Если засыпаете дольше, измените этот параметр.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Bedtime = wake-up − N × 90 min − time to fall asleep", "Wake-up = bedtime + time to fall asleep + N × 90 min"]}
          notes={[
            "Sleep runs in cycles of about 90 minutes (80–110 for different people). Waking at the end of a cycle, in light sleep, usually feels easier than waking from deep sleep.",
            "Adults should sleep at least 7 hours (AASM and NSF: 7–9 hours), so the main suggestion is 5 cycles (7.5 hours), or 6 cycles if you can.",
            "Most people fall asleep in 10–20 minutes; the calculator adds 15 by default. Change it if you take longer.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
