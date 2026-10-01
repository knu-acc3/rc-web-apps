"use client";

import { Link2 } from "lucide-react";
import { useCallback, useId, useMemo, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { Presentable } from "@/ui/fullscreen";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { fmtDateLong, localYmd, parseYmd } from "@/tools/time/calendar/lib/dates";
import { useNow } from "@/tools/time/time/lib/use-now";
import { nextTarget, splitMs, yearProgress, type CountdownSpec } from "./lib/next";

export interface CountdownProps {
  locale: Locale;
  /** Event countdown (Russian texts); without it the tool is a custom countdown driven by the URL hash. */
  event?: CountdownSpec;
  /** Same event with English texts. */
  eventEn?: CountdownSpec;
}

const T = {
  ru: {
    units: [
      ["день", "дня", "дней"],
      ["час", "часа", "часов"],
      ["минута", "минуты", "минут"],
      ["секунда", "секунды", "секунд"],
    ],
    today: (n: string) => `Сегодня — ${n}!`,
    now: (n: string) => `${n} — прямо сейчас!`,
    passed: (n: string) => `${n} уже наступил — прошло`,
    yearDone: (p: string) => `Прошло ${p} % года`,
    expected: "Ожидаемая дата: окончательно её объявляет духовное управление мусульман.",
    date: "Дата",
    time: "Время",
    title: "Название (необязательно)",
    titlePh: "Например: отпуск",
    share: "Ссылка на этот отсчёт",
    copy: "Копировать ссылку",
    copied: "Скопировано",
    pick: "Выберите дату, до которой считать время.",
    to: (s: string) => `до: ${s}`,
    none: "Дата события пока неизвестна.",
    at: "в",
  },
  en: {
    units: [
      ["day", "days"],
      ["hour", "hours"],
      ["minute", "minutes"],
      ["second", "seconds"],
    ],
    today: (n: string) => `Today is ${n}!`,
    now: (n: string) => `${n} — right now!`,
    passed: (n: string) => `${n} has arrived — time since`,
    yearDone: (p: string) => `${p}% of the year has passed`,
    expected: "Expected date: the final date is announced by religious authorities.",
    date: "Date",
    time: "Time",
    title: "Title (optional)",
    titlePh: "e.g. Vacation",
    share: "Link to this countdown",
    copy: "Copy link",
    copied: "Copied",
    pick: "Pick a date to count down to.",
    to: (s: string) => `until: ${s}`,
    none: "The date of this event is not known yet.",
    at: "at",
  },
} as const;

/* ───────────── URL hash state (custom countdown) ───────────── */

function subscribeHash(f: () => void) {
  window.addEventListener("hashchange", f);
  window.addEventListener("countdown-hash", f);
  return () => {
    window.removeEventListener("hashchange", f);
    window.removeEventListener("countdown-hash", f);
  };
}
const readHash = () => window.location.hash;
const serverHash = () => "";

function parseHash(h: string): { date: string; time: string; title: string } {
  const p = new URLSearchParams(h.replace(/^#/, ""));
  return { date: p.get("date") ?? "", time: p.get("time") ?? "00:00", title: p.get("title") ?? "" };
}
function writeHash(v: { date: string; time: string; title: string }) {
  const p = new URLSearchParams();
  if (v.date) p.set("date", v.date);
  if (v.time && v.time !== "00:00") p.set("time", v.time);
  if (v.title) p.set("title", v.title);
  const s = p.toString();
  history.replaceState(null, "", s ? `#${s}` : window.location.pathname + window.location.search);
  window.dispatchEvent(new Event("countdown-hash"));
}

export default function Countdown({ locale, event: eventRu, eventEn }: CountdownProps) {
  const event = locale === "en" && eventEn ? eventEn : eventRu;
  const t = T[locale];
  const id = useId();
  const now = useNow();
  const hash = useSyncExternalStore(subscribeHash, readHash, serverHash);
  const custom = parseHash(hash);
  const spec: CountdownSpec | null = useMemo(() => {
    if (event) return event;
    if (!parseYmd(custom.date)) return null;
    return { name: custom.title, to: custom.title, dates: [custom.date], time: custom.time, once: true };
  }, [event, custom.date, custom.time, custom.title]);

  const target = spec && now !== null ? nextTarget(spec, now) : null;
  const diff = target && now !== null ? (target.state === "after" ? now - target.start : target.start - now) : 0;
  const parts = splitMs(diff);
  const setCustom = useCallback((patch: Partial<typeof custom>) => writeHash({ ...custom, ...patch }), [custom]);

  const unitWord = (i: number, v: number) => plural(locale, v, t.units[i]);
  const values = [parts.d, parts.h, parts.m, parts.s];
  const label = spec?.name || "";

  const dateText = target && now !== null ? (() => {
    const d = new Date(target.start);
    const ymd = localYmd(d);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${fmtDateLong(locale, ymd)}, ${hh}:${mm}`;
  })() : "";

  return (
    <div className="flex flex-col gap-4">
      {!event && (
        <Panel className="grid gap-3 p-4 sm:grid-cols-[auto_auto_1fr] sm:items-end sm:p-5">
          <Field label={t.date} htmlFor={`${id}-d`}>
            <Input id={`${id}-d`} type="date" value={custom.date} onChange={(e) => setCustom({ date: e.target.value })} className="sm:w-44" />
          </Field>
          <Field label={t.time} htmlFor={`${id}-t`}>
            <Input id={`${id}-t`} type="time" value={custom.time} onChange={(e) => setCustom({ time: e.target.value || "00:00" })} className="sm:w-32" />
          </Field>
          <Field label={t.title} htmlFor={`${id}-n`}>
            <Input id={`${id}-n`} value={custom.title} placeholder={t.titlePh} maxLength={80} onChange={(e) => setCustom({ title: e.target.value })} />
          </Field>
        </Panel>
      )}

      <Presentable locale={locale} className="rounded-[0.75rem] border border-line bg-surface flex flex-col items-center gap-5 px-4 py-8 text-center sm:py-10" fullClassName="rounded-none border-0 [&_.cd-grid]:max-w-[min(96vw,180vh)] [&_.cd-num]:text-[min(12vw,20vh)]!">
        {spec && label && <p className="text-lg font-semibold text-fg-2">{event ? spec.to.charAt(0).toUpperCase() + spec.to.slice(1) : t.to(label)}</p>}
        {!spec ? (
          <p className="text-lg text-fg-3">{event ? t.none : t.pick}</p>
        ) : target?.state === "during" ? (
          <p className="text-3xl font-bold text-accent sm:text-5xl">{spec.moments ? t.now(label) : t.today(label)}</p>
        ) : (
          <>
            {target?.state === "after" && <p className="text-lg font-semibold text-accent">{t.passed(label)}</p>}
            <div className="cd-grid grid w-full max-w-2xl grid-cols-4 gap-2 sm:gap-4">
              {values.map((v, i) => (
                <div key={i} className={cn("flex flex-col items-center rounded-[0.75rem] bg-surface-2 px-1 py-3 sm:py-5", i === 0 && "bg-accent-soft")}>
                  <span className={cn("cd-num tabular font-bold leading-none tracking-tight text-fg", i === 0 ? "text-[min(11vw,4.5rem)] text-accent" : "text-[min(9vw,3.5rem)]")}>
                    {target ? (i === 0 ? formatNumber(locale, v) : String(v).padStart(2, "0")) : "—"}
                  </span>
                  <span className="mt-1.5 text-[0.75rem] text-fg-3 sm:text-sm">{target ? unitWord(i, v) : t.units[i][locale === "ru" ? 2 : 1]}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <p className="min-h-6 text-[0.9375rem] text-fg-2">{dateText}</p>
        {spec?.yearProgress && now !== null && (
          <div className="w-full max-w-md">
            <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
              <div className="h-full rounded-full bg-accent" style={{ width: `${yearProgress(now) * 100}%` }} />
            </div>
            <p className="mt-1.5 text-sm text-fg-3">{t.yearDone(formatNumber(locale, yearProgress(now) * 100, { maximumFractionDigits: 1 }))}</p>
          </div>
        )}
        {spec?.expected && <p className="max-w-xl text-[0.8125rem] text-fg-3">{t.expected}</p>}
      </Presentable>

      {!event && custom.date && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-fg-3">
          <Link2 className="size-4" aria-hidden />
          {t.share}
          <CopyButton value={() => window.location.href} label={t.copy} copiedLabel={t.copied} variant="ghost" />
        </div>
      )}
    </div>
  );
}
