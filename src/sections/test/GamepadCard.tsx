"use client";

import { Crosshair, Vibrate } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Badge, Panel } from "@/ui/panel";
import { driftVerdict, STANDARD_BUTTONS, stickMagnitude, type DriftVerdict } from "./lib/input-stats";

export interface PadSnap {
  index: number;
  id: string;
  standard: boolean;
  buttons: { pressed: boolean; value: number }[];
  axes: number[];
  ever: boolean[];
  vibration: boolean;
}

export interface DriftResult {
  measuring: boolean;
  sticks: number[];
}

const T = {
  ru: {
    pad: "Геймпад",
    standard: "стандартная раскладка",
    nonStandard: "нестандартная раскладка — кнопки показаны номерами",
    buttons: "Кнопки",
    axes: "Оси",
    left: "Левый стик",
    right: "Правый стик",
    stick: (n: number) => `Стик ${n}`,
    triggers: "Курки",
    deflection: "отклонение",
    vibrate: "Вибрация",
    noVibration: "вибрация не поддерживается браузером",
    drift: "Проверить дрифт",
    driftRun: "Не трогайте стики… 3 с",
    driftVerdict: { none: "дрифта нет", minor: "небольшое смещение", drift: "дрифт!" } satisfies Record<DriftVerdict, string>,
  },
  en: {
    pad: "Gamepad",
    standard: "standard mapping",
    nonStandard: "non-standard mapping — buttons are shown by number",
    buttons: "Buttons",
    axes: "Axes",
    left: "Left stick",
    right: "Right stick",
    stick: (n: number) => `Stick ${n}`,
    triggers: "Triggers",
    deflection: "deflection",
    vibrate: "Rumble",
    noVibration: "rumble isn't supported by this browser",
    drift: "Check drift",
    driftRun: "Don't touch the sticks… 3 s",
    driftVerdict: { none: "no drift", minor: "slight offset", drift: "drift!" } satisfies Record<DriftVerdict, string>,
  },
} as const;

function Stick({ x, y, label, sub }: { x: number; y: number; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg viewBox="-50 -50 100 100" className="size-28" aria-hidden>
        <circle r="46" className="fill-surface-2 stroke-line-strong" strokeWidth="2" />
        <circle r="4.6" className="fill-none stroke-line-strong" strokeDasharray="2 2" />
        <line x1="-46" x2="46" className="stroke-line" />
        <line y1="-46" y2="46" className="stroke-line" />
        <circle cx={x * 40} cy={y * 40} r="9" className="fill-accent" />
      </svg>
      <span className="text-sm font-medium text-fg">{label}</span>
      <span className="tabular text-xs text-fg-3">{sub}</span>
    </div>
  );
}

export function GamepadCard({
  locale,
  pad,
  drift,
  onRumble,
  onDrift,
}: {
  locale: Locale;
  pad: PadSnap;
  drift: DriftResult | undefined;
  onRumble: () => void;
  onDrift: () => void;
}) {
  const t = T[locale];
  const f = (n: number, d = 2) => formatNumber(locale, n, { minimumFractionDigits: d, maximumFractionDigits: d });
  const sticks: [number, number][] = [];
  for (let i = 0; i + 1 < pad.axes.length && sticks.length < 2; i += 2) sticks.push([pad.axes[i], pad.axes[i + 1]]);
  const label = (i: number) => (pad.standard && STANDARD_BUTTONS[i] ? STANDARD_BUTTONS[i] : null);
  const triggers = pad.standard ? [6, 7].filter((i) => pad.buttons[i]) : [];

  return (
    <Panel className="flex flex-col gap-5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-fg" title={pad.id}>
            {t.pad} {pad.index + 1}: {pad.id}
          </h2>
          <p className="text-sm text-fg-3">
            {pad.standard ? t.standard : t.nonStandard} · {pad.buttons.length} / {pad.axes.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onDrift} disabled={drift?.measuring}>
            <Crosshair aria-hidden />
            {drift?.measuring ? t.driftRun : t.drift}
          </Button>
          <Button size="sm" variant="outline" onClick={onRumble} disabled={!pad.vibration} title={pad.vibration ? undefined : t.noVibration}>
            <Vibrate aria-hidden />
            {t.vibrate}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-10">
        {sticks.map(([x, y], i) => {
          const mag = stickMagnitude(x, y);
          const d = drift && !drift.measuring ? drift.sticks[i] : undefined;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <Stick x={x} y={y} label={pad.standard ? (i === 0 ? t.left : t.right) : t.stick(i + 1)} sub={`x ${f(x)} · y ${f(y)} · ${t.deflection} ${f(mag)}`} />
              {d !== undefined && (
                <Badge tone={driftVerdict(d) === "none" ? "ok" : driftVerdict(d) === "minor" ? "warn" : "err"}>
                  {t.driftVerdict[driftVerdict(d)]} · {f(d, 3)}
                </Badge>
              )}
            </div>
          );
        })}
        {triggers.length > 0 && (
          <div className="flex items-end gap-4 self-center">
            {triggers.map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="relative h-24 w-7 overflow-hidden rounded-[6px] bg-surface-2" aria-hidden>
                  <div className="absolute inset-x-0 bottom-0 bg-accent" style={{ height: `${pad.buttons[i].value * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-fg">{label(i)?.[0]}</span>
                <span className="tabular text-xs text-fg-3">{f(pad.buttons[i].value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-fg-2">{t.buttons}</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-1.5">
          {pad.buttons.map((b, i) => {
            const l = label(i);
            return (
              <div
                key={i}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center overflow-hidden rounded-[8px] border text-center leading-tight",
                  b.pressed ? "border-accent bg-accent text-accent-fg" : pad.ever[i] ? "border-ok/50 bg-ok-soft text-ok" : "border-line bg-surface-2 text-fg-2",
                )}
              >
                {!b.pressed && b.value > 0.01 && <span className="absolute inset-x-0 bottom-0 bg-accent/30" style={{ height: `${b.value * 100}%` }} aria-hidden />}
                <span className="relative text-sm font-semibold">{l ? l[0] : i}</span>
                <span className="relative text-[11px] opacity-80">{l ? l[1] : `#${i}`}</span>
              </div>
            );
          })}
        </div>
      </div>

      {pad.axes.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-fg-2">{t.axes}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {pad.axes.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-14 shrink-0 font-mono text-fg-3">axis {i}</span>
                <div className="relative h-2 flex-1 rounded-full bg-surface-2" aria-hidden>
                  <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                  <span
                    className="absolute inset-y-0 rounded-full bg-accent"
                    style={a >= 0 ? { left: "50%", width: `${a * 50}%` } : { right: "50%", width: `${-a * 50}%` }}
                  />
                </div>
                <span className="tabular w-14 shrink-0 text-right text-fg">{f(a)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
