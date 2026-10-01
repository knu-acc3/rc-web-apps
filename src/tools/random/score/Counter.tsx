"use client";

import { Hash, Maximize, Minus, Plus, RotateCcw, Tally5, Trash2, Undo2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { usePersistentState } from "@/lib/persist";
import { Button, IconButton } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Switch } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Kbd, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { StageLayer, typingTarget, useStage } from "@/ui/stage";
import { clampCounter, countStep, digitsScale, percentOf, tallyView, total } from "./lib/score";
import { isTally, MAX_COUNTERS, type CounterView, type Tally } from "./lib/state";
import { useSound } from "./ui/sound";
import { TallyMarks } from "./ui/TallyMarks";

export type CounterPreset = "single" | "people" | "votes" | "beads";
const PRESETS: CounterPreset[] = ["single", "people", "votes", "beads"];

const T = {
  ru: {
    title: "Что считаем",
    titlePh: { single: "Например, гости", people: "Например, выставка", votes: "Например, выборы старосты", beads: "Например, утреннее правило" },
    items: { single: [""], people: ["Вошли", "Вышли"], votes: ["Вариант 1", "Вариант 2", "Вариант 3"], beads: [""] },
    itemPh: (n: number) => `Счётчик ${n}`,
    add: (n: number) => `Добавить ${n}`,
    sub: (n: number) => `Отнять ${n}`,
    addCounter: "Ещё счётчик",
    remove: "Удалить счётчик",
    undo: "Отменить",
    reset: "Сбросить",
    full: "На весь экран",
    step: "Шаг",
    view: "Вид",
    views: { number: "Число", tally: "Палочки" },
    goal: "Цель",
    goalPh: "Без цели",
    loop: "После цели — заново",
    laps: "Кругов",
    sound: "Звук",
    total: "Всего",
    inside: "Сейчас внутри",
    copy: "Копировать итог",
    copied: "Скопировано",
    reached: "Цель достигнута",
    plusKeys: "плюс",
    minusKeys: "минус",
    rowKeys: "плюс к счётчику",
    stage: "Счётчик на весь экран",
    close: "Закрыть",
    tapHint: "Нажмите в любом месте экрана",
  },
  en: {
    title: "What are you counting",
    titlePh: { single: "E.g. guests", people: "E.g. the exhibition", votes: "E.g. class rep vote", beads: "E.g. morning prayer" },
    items: { single: [""], people: ["In", "Out"], votes: ["Option 1", "Option 2", "Option 3"], beads: [""] },
    itemPh: (n: number) => `Counter ${n}`,
    add: (n: number) => `Add ${n}`,
    sub: (n: number) => `Subtract ${n}`,
    addCounter: "Add counter",
    remove: "Remove counter",
    undo: "Undo",
    reset: "Reset",
    full: "Full screen",
    step: "Step",
    view: "View",
    views: { number: "Number", tally: "Tally marks" },
    goal: "Goal",
    goalPh: "No goal",
    loop: "Start over after the goal",
    laps: "Laps",
    sound: "Sound",
    total: "Total",
    inside: "Inside now",
    copy: "Copy result",
    copied: "Copied",
    reached: "Goal reached",
    plusKeys: "plus",
    minusKeys: "minus",
    rowKeys: "add to counter",
    stage: "Full-screen counter",
    close: "Close",
    tapHint: "Tap anywhere on the screen",
  },
} as const;

type View = CounterView;

const STEPS = [1, 2, 5, 10] as const;
const MAX_ITEMS = MAX_COUNTERS;
const MAX_GOAL = 1_000_000;
/** Above this a list row shows only digits: the small marks would not fit. */
const ROW_TALLY_MAX = 100;

const fresh = (preset: CounterPreset, locale: Locale): Tally => ({
  title: "",
  items: T[locale].items[preset].map((name) => ({ name, value: 0 })),
  step: 1,
  goal: preset === "beads" ? 33 : null,
  loop: preset === "beads",
  laps: 0,
  sound: false,
  active: 0,
});

export default function Counter({ locale, preset: presetProp = "single" }: { locale: Locale; preset?: string }) {
  const t = T[locale];
  const preset: CounterPreset = (PRESETS as string[]).includes(presetProp) ? (presetProp as CounterPreset) : "single";
  const [s, setS] = usePersistentState<Tally>(`counter:v1:${preset}`, fresh(preset, locale), isTally);
  const [past, setPast] = useState<Tally[]>([]);
  const [flash, setFlash] = useState(0);
  const stage = useStage();
  const { play: playSound } = useSound();

  const single = s.items.length === 1;
  const active = Math.min(s.active, s.items.length - 1);
  const sum = total(s.items.map((i) => i.value));
  const showPercent = preset === "votes" && !single;
  const view: View = s.view ?? "number";

  const commit = (next: Tally) => {
    setPast((p) => [...p.slice(-199), s]);
    setS(next);
  };
  const undo = () => {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast((p) => p.slice(0, -1));
    setS(prev);
  };

  const bump = (index: number, delta: number) => {
    const items = s.items.slice();
    const it = items[index];
    if (!it) return;
    let laps = s.laps;
    let reached = false;
    if (single) {
      const r = countStep(it.value, s.laps, delta, s.goal, s.loop);
      items[index] = { ...it, value: r.value };
      laps = r.laps;
      reached = r.reached;
    } else {
      items[index] = { ...it, value: clampCounter(it.value + delta) };
    }
    if (items[index].value === it.value && laps === s.laps) return;
    try {
      navigator.vibrate?.(reached ? [60, 40, 60] : 10);
    } catch {
      // not supported
    }
    if (s.sound) playSound(reached ? "goal" : "tick");
    if (reached) setFlash((f) => f + 1);
    commit({ ...s, items, laps, active: index });
  };
  const reset = () => commit({ ...s, items: s.items.map((i) => ({ ...i, value: 0 })), laps: 0 });
  const addItem = () => {
    if (s.items.length >= MAX_ITEMS) return;
    commit({ ...s, items: [...s.items, { name: "", value: 0 }], active: s.items.length });
  };
  const removeItem = (index: number) => {
    if (s.items.length <= 1) return;
    commit({ ...s, items: s.items.filter((_, i) => i !== index), active: 0 });
  };
  const rename = (index: number, name: string) => setS({ ...s, items: s.items.map((it, i) => (i === index ? { ...it, name } : it)) });

  const nameOf = (i: number) => s.items[i].name.trim() || t.itemPh(i + 1);
  const resultText = () => {
    const head = s.title.trim() ? `${s.title.trim()}\n` : "";
    if (single) return `${head}${s.items[0].value}${s.laps ? ` (${t.laps.toLowerCase()}: ${s.laps})` : ""}`;
    const rows = s.items.map((it, i) => `${nameOf(i)}: ${it.value}${showPercent ? ` (${percentOf(it.value, sum)} %)` : ""}`);
    const tail = preset === "people" && s.items.length === 2 ? `${t.inside}: ${Math.max(0, s.items[0].value - s.items[1].value)}` : `${t.total}: ${sum}`;
    return `${head}${rows.join("\n")}\n${tail}`;
  };

  // Space / Enter / ↑ / + add, ↓ / − subtract, 1–9 add to that counter, Z undo, F full screen.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyRef.current = (e) => {
      if (e.altKey || typingTarget(e)) return;
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if ((e.key === " " || e.key === "Enter") && target?.closest("button, a, [role=radio]") && !stage.open) return;
      let fn: (() => void) | null = null;
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp" || e.key === "+" || e.key === "=") fn = () => bump(active, s.step);
      else if (e.key === "ArrowDown" || e.key === "-") fn = () => bump(active, -s.step);
      else if (/^Digit[1-9]$/.test(e.code) && !single) {
        const i = Number(e.code.slice(5)) - 1;
        if (i < s.items.length) fn = () => bump(i, e.shiftKey ? -s.step : s.step);
      } else if (e.code === "KeyZ") fn = undo;
      else if (e.code === "KeyF" && !stage.open) fn = stage.enter;
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = s.items[0].value;
  const tv = tallyView(value);
  const goalShare = single && s.goal ? Math.min(1, Math.max(0, value / s.goal)) : 0;
  const bigNumber = (cls: string, style?: CSSProperties) => (
    <span
      key={flash}
      className={cn("inline-block tabular-nums font-bold leading-none tracking-tight", flash > 0 && "motion-safe:animate-[pop_0.5s_ease-out]", cls)}
      style={{ ["--k" as string]: digitsScale(value), ...style }}
    >
      {value}
    </span>
  );
  /** The single counter as tally marks (with the number under them) or, past 500 or below 0, digits first. */
  const tallyDisplay = (big: boolean) => (
    <div key={flash} className={cn("flex w-full flex-col items-center", big ? "gap-[3vmin]" : "gap-3", flash > 0 && "motion-safe:animate-[pop_0.5s_ease-out]")}>
      {tv.digits && bigNumber(big ? "[font-size:calc(min(30vh,24vw)*var(--k))]" : "text-fg [font-size:calc(min(24cqw,8rem)*var(--k))]")}
      {(!tv.digits || tv.marks > 0) && <TallyMarks count={tv.marks} size={big ? "full" : "md"} label={String(value)} className={big ? "max-w-[94vw]" : undefined} />}
      {!tv.digits && <span className={cn("tabular-nums font-bold leading-none", big ? "text-white/70 [font-size:clamp(1.5rem,6vmin,4rem)]" : "text-3xl text-fg-2")}>{value}</span>}
    </div>
  );

  const goalLine = (s.goal || s.laps > 0) && (
    <div className="flex w-full max-w-sm flex-col items-center gap-1.5">
      {s.goal ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={s.goal} aria-valuenow={Math.min(value, s.goal)} aria-label={t.goal}>
          <div className={cn("h-full rounded-full transition-[width] duration-200", goalShare >= 1 ? "bg-ok" : "bg-accent")} style={{ width: `${goalShare * 100}%` }} />
        </div>
      ) : null}
      <span className="tabular-nums text-sm text-fg-2">
        {s.goal ? `${Math.min(value, s.goal)} / ${s.goal}` : ""}
        {s.goal && s.laps > 0 ? " · " : ""}
        {s.laps > 0 ? `${t.laps}: ${s.laps}` : ""}
        {s.goal && !s.loop && value >= s.goal ? ` · ${t.reached}` : ""}
      </span>
    </div>
  );

  const viewSwitch = (
    <Field label={t.view}>
      <Segmented
        label={t.view}
        value={view}
        onChange={(v) => setS({ ...s, view: v })}
        options={[
          { value: "number", label: t.views.number, icon: <Hash className="size-4 shrink-0" aria-hidden /> },
          { value: "tally", label: t.views.tally, icon: <Tally5 className="size-4 shrink-0" aria-hidden /> },
        ]}
      />
    </Field>
  );
  const stepSwitch = (
    <Field label={t.step}>
      <Segmented label={t.step} value={String(s.step)} onChange={(v) => setS({ ...s, step: Number(v) })} options={STEPS.map((n) => ({ value: String(n), label: String(n) }))} />
    </Field>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={t.title}
          placeholder={t.titlePh[preset]}
          value={s.title}
          maxLength={60}
          onChange={(e) => setS({ ...s, title: e.target.value })}
          className="min-w-0 flex-1 basis-40 font-semibold"
        />
        <div className="flex items-center gap-1">
          <IconButton label={t.undo} icon={<Undo2 aria-hidden />} onClick={undo} disabled={past.length === 0} />
          <IconButton label={t.reset} icon={<RotateCcw aria-hidden />} onClick={reset} />
          <IconButton label={t.sound} icon={s.sound ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />} selected={s.sound} onClick={() => setS({ ...s, sound: !s.sound })} />
          <Button variant="tonal" onClick={stage.enter} title={t.full}>
            <Maximize aria-hidden />
            <span className="max-sm:sr-only">{t.full}</span>
          </Button>
        </div>
      </div>

      {single ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:items-start">
          <Panel className="@container flex flex-col gap-3 p-3 [--tally-cross:var(--accent)] sm:p-4">
            <div className="flex min-h-[38cqw] flex-col items-center justify-center gap-3 py-2 sm:min-h-[16rem] sm:py-6">
              {view === "tally" ? tallyDisplay(false) : bigNumber("text-fg [font-size:calc(min(34cqw,12rem)*var(--k))]")}
              {goalLine}
            </div>
            <div className="grid grid-cols-[1fr_3fr] gap-2">
              <Button size="lg" variant="tonal" onClick={() => bump(0, -s.step)} aria-label={t.sub(s.step)} className="h-20 text-2xl sm:h-24">
                <Minus className="size-7!" aria-hidden />
              </Button>
              <Button size="lg" variant="filled" onClick={() => bump(0, s.step)} aria-label={t.add(s.step)} className="h-20 text-3xl font-bold sm:h-24">
                <Plus className="size-8!" aria-hidden />
                {s.step > 1 && <span className="tabular-nums">{s.step}</span>}
              </Button>
            </div>
          </Panel>

          <div className="flex flex-wrap items-end gap-x-5 gap-y-4 lg:flex-col lg:items-stretch">
            {viewSwitch}
            {stepSwitch}
            <Field label={t.goal} htmlFor="counter-goal" className="w-44">
              <NumberInput id="counter-goal" locale={locale} min={1} max={MAX_GOAL} placeholder={t.goalPh} value={s.goal} onChange={(g) => setS({ ...s, goal: g && g > 0 ? g : null })} />
            </Field>
            {preset === "beads" && (
              <div className="flex flex-wrap gap-1.5">
                {[33, 99, 100, 108].map((g) => (
                  <button key={g} type="button" className="chip tabular-nums" aria-pressed={s.goal === g} onClick={() => setS({ ...s, goal: g })}>
                    {g}
                  </button>
                ))}
              </div>
            )}
            {s.goal ? <Switch label={t.loop} checked={s.loop} onChange={(e) => setS({ ...s, loop: e.target.checked })} /> : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outlined" onClick={addItem}>
                <Plus aria-hidden />
                {t.addCounter}
              </Button>
              <CopyButton value={resultText} label={t.copy} copiedLabel={t.copied} variant="ghost" compact />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="grid gap-2 xl:grid-cols-2">
            {s.items.map((it, i) => {
              const pct = percentOf(it.value, sum);
              const marks = view === "tally" && it.value > 0 && it.value <= ROW_TALLY_MAX;
              return (
                <li
                  key={i}
                  className={cn("relative overflow-hidden rounded-[1rem] bg-surface-2 p-1.5 [--tally-cross:var(--accent)] sm:p-2", i === active && "ring-2 ring-accent")}
                  onFocusCapture={() => s.active !== i && setS({ ...s, active: i })}
                >
                  {showPercent && <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 bg-accent/10 transition-[width] duration-200" style={{ width: `${pct}%` }} />}
                  <div className="relative flex items-center gap-1.5 sm:gap-2">
                    <span className="hidden w-5 shrink-0 text-center text-sm text-fg-3 sm:block">{i < 9 ? i + 1 : ""}</span>
                    <input
                      value={it.name}
                      onChange={(e) => rename(i, e.target.value)}
                      placeholder={t.itemPh(i + 1)}
                      aria-label={t.itemPh(i + 1)}
                      maxLength={40}
                      className="min-w-0 flex-1 rounded-[0.5rem] bg-transparent px-1.5 py-1.5 font-medium outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    {showPercent && <span className="tabular-nums w-12 shrink-0 text-right text-sm text-fg-2 max-[379px]:hidden">{pct} %</span>}
                    <IconButton label={`${nameOf(i)}: ${t.sub(s.step)}`} icon={<Minus aria-hidden />} variant="outlined" onClick={() => bump(i, -s.step)} />
                    <span className="tabular-nums min-w-10 text-center text-2xl font-bold">{it.value}</span>
                    <IconButton label={`${nameOf(i)}: ${t.add(s.step)}`} icon={<Plus aria-hidden />} variant="filled" onClick={() => bump(i, s.step)} />
                    <IconButton label={`${t.remove}: ${nameOf(i)}`} icon={<Trash2 aria-hidden />} size="sm" onClick={() => removeItem(i)} className="text-fg-3" />
                  </div>
                  {marks && <TallyMarks count={it.value} size="sm" label={String(it.value)} className="relative px-2 pb-1 pt-1.5 text-fg" />}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <Button variant="outlined" onClick={addItem} disabled={s.items.length >= MAX_ITEMS}>
              <Plus aria-hidden />
              {t.addCounter}
            </Button>
            <span className="tabular-nums text-[0.9375rem] text-fg-2">
              {preset === "people" && s.items.length === 2 ? (
                <>
                  {t.inside}: <b className="text-lg text-fg">{Math.max(0, s.items[0].value - s.items[1].value)}</b>
                </>
              ) : (
                <>
                  {t.total}: <b className="text-lg text-fg">{sum}</b>
                </>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3 pt-2">
            {viewSwitch}
            {stepSwitch}
            <CopyButton value={resultText} label={t.copy} copiedLabel={t.copied} variant="ghost" compact className="mb-0.5" />
          </div>
        </div>
      )}

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-3 pointer-coarse:hidden">
        <span>
          <Kbd>Space</Kbd> <Kbd>↑</Kbd> {t.plusKeys}
        </span>
        <span>
          <Kbd>↓</Kbd> {t.minusKeys}
        </span>
        {!single && (
          <span>
            <Kbd>1</Kbd>–<Kbd>9</Kbd> {t.rowKeys}
          </span>
        )}
        <span>
          <Kbd>Z</Kbd> {t.undo.toLowerCase()}
        </span>
        <span>
          <Kbd>F</Kbd> {t.full.toLowerCase()}
        </span>
      </p>

      <StageLayer
        stage={stage}
        label={t.stage}
        closeLabel={t.close}
        dark
        className="bg-[#0b0d10] text-white [--tally-cross:#ffcf24]"
        onClick={single ? () => bump(0, s.step) : undefined}
        bar={
          <>
            <button type="button" onClick={() => bump(active, -s.step)} aria-label={t.sub(s.step)} title={t.sub(s.step)} className="flex size-10 items-center justify-center rounded-full hover:bg-black/10">
              <Minus className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={undo} disabled={past.length === 0} aria-label={t.undo} title={t.undo} className="flex size-10 items-center justify-center rounded-full hover:bg-black/10 disabled:opacity-40">
              <Undo2 className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={reset} aria-label={t.reset} title={t.reset} className="flex size-10 items-center justify-center rounded-full hover:bg-black/10">
              <RotateCcw className="size-5" aria-hidden />
            </button>
          </>
        }
      >
        {stage.open &&
          (single ? (
            <div className="flex size-full cursor-pointer flex-col items-center justify-center gap-[3vmin] px-4 pt-14">
              {s.title.trim() && <span className="max-w-full truncate text-center font-semibold text-white/80 [font-size:clamp(1.25rem,5vmin,4rem)]">{s.title.trim()}</span>}
              {view === "tally" ? tallyDisplay(true) : bigNumber("[font-size:calc(min(55vh,32vw)*var(--k))]")}
              {s.goal ? (
                <span className="tabular-nums text-white/70 [font-size:clamp(1rem,4vmin,3rem)]">
                  {Math.min(value, s.goal)} / {s.goal}
                  {s.laps > 0 ? ` · ${t.laps}: ${s.laps}` : ""}
                </span>
              ) : s.laps > 0 ? (
                <span className="tabular-nums text-white/70 [font-size:clamp(1rem,4vmin,3rem)]">
                  {t.laps}: {s.laps}
                </span>
              ) : null}
              {value === 0 && <span className="text-white/45 [font-size:clamp(0.875rem,2.5vmin,1.5rem)]">{t.tapHint}</span>}
            </div>
          ) : (
            <div
              className="grid size-full auto-rows-fr gap-[1.5vmin] p-[1.5vmin] pt-16"
              style={{ gridTemplateColumns: `repeat(${s.items.length <= 2 ? s.items.length : s.items.length <= 4 ? 2 : s.items.length <= 9 ? 3 : 4}, minmax(0, 1fr))` }}
            >
              {s.items.map((it, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => bump(i, s.step)}
                  aria-label={`${nameOf(i)}: ${it.value}. ${t.add(s.step)}`}
                  className="flex min-h-0 flex-col items-center justify-center gap-[3cqh] overflow-hidden rounded-[1rem] bg-white/[0.07] px-2 transition-colors [container-type:size] hover:bg-white/[0.11] active:bg-white/15"
                >
                  <span className="max-w-full truncate font-semibold leading-tight text-white/80 [font-size:clamp(0.75rem,min(8cqw,11cqh),3rem)]">{nameOf(i)}</span>
                  <span className="tabular-nums font-bold leading-none [font-size:calc(min(42cqw,50cqh)*var(--k))]" style={{ ["--k" as string]: digitsScale(it.value) }}>
                    {it.value}
                  </span>
                  {showPercent && <span className="tabular-nums leading-tight text-white/60 [font-size:clamp(0.75rem,min(6cqw,8cqh),2rem)]">{percentOf(it.value, sum)} %</span>}
                </button>
              ))}
            </div>
          ))}
      </StageLayer>
    </div>
  );
}
