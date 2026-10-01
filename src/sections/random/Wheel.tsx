"use client";

import { ChevronDown, RotateCcw, Shuffle, Undo2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Field, Switch, Textarea } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { pickWeighted, randomFloat, randomInt, shuffle } from "./lib/rng";
import { prefersReducedMotion, readStored, removeStored, writeStored } from "./lib/storage";
import { easeOutQuart, mod360, sectorsFromWeights, targetRotation, winnerAt } from "./lib/wheel";
import { HistoryPanel, parseLines, pushHistory } from "./ui/shared";
import { EntryTable, WheelPointer, WheelSvg, type WheelEntry } from "./ui/wheel-parts";

export interface WheelProps {
  locale: Locale;
  /** Preset slug; also separates the saved list of each preset page. */
  preset?: string;
  entries: Record<Locale, string[]>;
  /** Optional fixed colours per entry (index-aligned). */
  colors?: (string | null)[];
}

const MAX_ENTRIES = 100;
const MAX_LABEL = 80;

const T = {
  ru: {
    spin: "Крутить колесо",
    spinning: "Крутится…",
    result: "Выпало",
    idle: "Нажмите «Крутить колесо»",
    entries: "Варианты — по одному на строку",
    entryForms: ["вариант", "варианта", "вариантов"],
    needTwo: "Добавьте хотя бы два варианта",
    shuffle: "Перемешать",
    reset: "Сбросить список",
    resetPreset: "Исходный список",
    restore: "Вернуть",
    remove: "Убрать с колеса",
    autoRemove: "Убирать выпавший вариант",
    weights: "Веса и цвета",
    history: "История",
    clear: "Очистить",
    empty: "Здесь появятся результаты вращений",
    saved: "Список сохраняется в этом браузере.",
    limit: `Не больше ${MAX_ENTRIES} вариантов`,
  },
  en: {
    spin: "Spin the wheel",
    spinning: "Spinning…",
    result: "Result",
    idle: "Press “Spin the wheel”",
    entries: "Entries — one per line",
    entryForms: ["entry", "entries"],
    needTwo: "Add at least two entries",
    shuffle: "Shuffle",
    reset: "Reset list",
    resetPreset: "Original list",
    restore: "Bring back",
    remove: "Remove from wheel",
    autoRemove: "Remove the winner",
    weights: "Weights & colours",
    history: "History",
    clear: "Clear",
    empty: "Spin results will appear here",
    saved: "The list is saved in this browser.",
    limit: `Up to ${MAX_ENTRIES} entries`,
  },
} as const;

type Stored = { label: string; weight: number; color?: string }[];

function isStored(v: unknown): v is Stored {
  return (
    Array.isArray(v) &&
    v.length <= MAX_ENTRIES &&
    v.every(
      (x) =>
        !!x &&
        typeof x === "object" &&
        typeof (x as Stored[number]).label === "string" &&
        typeof (x as Stored[number]).weight === "number" &&
        (x as Stored[number]).weight > 0 &&
        (x as Stored[number]).weight <= 1000 &&
        ((x as Stored[number]).color === undefined || /^#[0-9a-f]{6}$/i.test(String((x as Stored[number]).color))),
    )
  );
}

function fromLabels(labels: readonly string[], colors?: (string | null)[]): WheelEntry[] {
  return labels.slice(0, MAX_ENTRIES).map((label, i) => ({ id: i, label: label.slice(0, MAX_LABEL), weight: 1, color: colors?.[i] ?? undefined }));
}

export default function Wheel({ locale, preset, entries: presetEntries, colors }: WheelProps) {
  const t = T[locale];
  const id = useId();
  const initial = useMemo(() => fromLabels(presetEntries[locale] ?? [], colors), [presetEntries, locale, colors]);
  const storageKey = `random:wheel:v1:${preset ?? "main"}:${locale}`;

  const [entries, setEntries] = useState<WheelEntry[]>(initial);
  const [text, setText] = useState(() => initial.map((e) => e.label).join("\n"));
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ id: number; label: string } | null>(null);
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  const [removed, setRemoved] = useState<WheelEntry[]>([]);
  const [autoRemove, setAutoRemove] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextId = useRef(initial.length);
  const historyId = useRef(0);
  const rotation = useRef(0);
  const raf = useRef<number | null>(null);
  const rotor = useRef<HTMLDivElement>(null);

  const weights = useMemo(() => entries.map((e) => Math.round(e.weight * 100)), [entries]);
  const sectors = useMemo(() => (entries.length ? sectorsFromWeights(weights) : []), [entries.length, weights]);

  // Restore the saved list for this page (browser only).
  useEffect(() => {
    const saved = readStored(storageKey, isStored);
    if (!saved || saved.length === 0) return;
    const list = saved.map((s, i) => ({ id: i, label: s.label.slice(0, MAX_LABEL), weight: s.weight, color: s.color }));
    nextId.current = list.length;
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage is only available after mount */
    setEntries(list);
    setText(list.map((e) => e.label).join("\n"));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey]);

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    },
    [],
  );

  function commit(list: WheelEntry[], syncText = true) {
    setEntries(list);
    if (syncText) setText(list.map((e) => e.label).join("\n"));
    writeStored(
      storageKey,
      list.map(({ label, weight, color }) => (color ? { label, weight, color } : { label, weight })),
    );
  }

  function onText(value: string) {
    setText(value);
    setError(null);
    const labels = parseLines(value, MAX_ENTRIES).map((l) => l.slice(0, MAX_LABEL));
    // Keep weights/colours: exact label matches first, then entries at the same position.
    const used = new Set<number>();
    const matched: (WheelEntry | null)[] = labels.map((label) => {
      const e = entries.find((x) => x.label === label && !used.has(x.id));
      if (e) used.add(e.id);
      return e ?? null;
    });
    const list = labels.map((label, i) => {
      const m = matched[i];
      if (m) return m;
      const old = entries[i];
      if (old && !used.has(old.id)) {
        used.add(old.id);
        return { ...old, label };
      }
      return { id: nextId.current++, label, weight: 1 };
    });
    commit(list, false);
  }

  function spin() {
    if (spinning) return;
    setError(null);
    let list = entries;
    if (autoRemove && result) {
      const gone = list.find((e) => e.id === result.id);
      if (gone) {
        list = list.filter((e) => e.id !== result.id);
        setRemoved((r) => [...r, gone]);
        commit(list);
      }
    }
    if (list.length < 2) {
      setError(t.needTwo);
      setResult(null);
      return;
    }
    const w = list.map((e) => Math.round(e.weight * 100));
    const secs = sectorsFromWeights(w);
    // 1) choose the winner with the cryptographic generator (weighted, exact)
    const winner = pickWeighted(w);
    // 2) choose a uniformly random stopping point inside the winner's sector
    const reduced = prefersReducedMotion();
    const from = rotation.current;
    const to = targetRotation(from, secs[winner], randomFloat(), reduced ? 0 : 5 + randomInt(3));
    const duration = reduced ? 0 : 4500 + randomInt(1500);
    const winnerEntry = list[winner];
    setResult(null);

    const apply = (deg: number) => {
      rotation.current = deg;
      if (rotor.current) rotor.current.style.transform = `rotate(${deg}deg)`;
    };
    const finish = () => {
      raf.current = null;
      const final = mod360(to);
      apply(final);
      if (process.env.NODE_ENV !== "production" && winnerAt(secs, final) !== winner) console.error("wheel: pointer/winner mismatch");
      setSpinning(false);
      setResult({ id: winnerEntry.id, label: winnerEntry.label });
      setHistory((h) => pushHistory(h, { id: historyId.current++, text: winnerEntry.label }));
    };
    if (duration === 0) {
      finish();
      return;
    }
    setSpinning(true);
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      apply(from + (to - from) * easeOutQuart(p));
      if (p < 1) raf.current = requestAnimationFrame(step);
      else finish();
    };
    raf.current = requestAnimationFrame(step);
  }

  function removeWinner() {
    if (!result) return;
    const gone = entries.find((e) => e.id === result.id);
    if (!gone) return;
    setRemoved((r) => [...r, gone]);
    commit(entries.filter((e) => e.id !== result.id));
    setResult(null);
  }

  function restoreRemoved() {
    commit([...entries, ...removed].slice(0, MAX_ENTRIES));
    setRemoved([]);
  }

  function resetList() {
    removeStored(storageKey);
    setEntries(initial);
    setText(initial.map((e) => e.label).join("\n"));
    nextId.current = initial.length;
    setRemoved([]);
    setResult(null);
    setError(null);
  }

  const winnerStillThere = !!result && entries.some((e) => e.id === result.id);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <Panel className="flex flex-col items-center gap-4 p-4 sm:p-5">
        <div className="relative mt-3 aspect-square w-full max-w-[27.5rem]">
          <WheelPointer />
          {/* The wheel surface is a mouse shortcut; the button below is the accessible control. */}
          {/* Clip the rotating square so its corners never create page overflow. */}
          <div className="size-full overflow-hidden rounded-full">
            <div ref={rotor} className="size-full cursor-pointer will-change-transform" onClick={spin} aria-hidden>
              <WheelSvg entries={entries} sectors={sectors} />
            </div>
          </div>
        </div>
        <Button variant="primary" size="lg" onClick={spin} disabled={spinning || entries.length < 2} className="w-full sm:w-auto sm:min-w-60">
          {spinning ? t.spinning : t.spin}
        </Button>
        <div className="flex min-h-[5.25rem] w-full flex-col items-center justify-center gap-1 rounded-[0.625rem] bg-surface-2 px-4 py-3 text-center">
          <div className="text-[0.8125rem] font-medium text-fg-2">{t.result}</div>
          <div aria-live="polite" className="min-h-8 text-2xl font-semibold break-words text-fg">
            {result && !spinning ? result.label : ""}
          </div>
          {!result && !spinning && !error && <div className="text-sm text-fg-3">{t.idle}</div>}
          {error && (
            <p className="text-sm text-err" role="alert">
              {error}
            </p>
          )}
          {winnerStillThere && !spinning && (
            <Button variant="ghost" size="sm" onClick={removeWinner}>
              {t.remove}
            </Button>
          )}
        </div>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="flex flex-col gap-3 p-4 sm:p-5">
          <Field
            label={t.entries}
            htmlFor={`${id}-list`}
            aside={<span className="tabular text-[0.8125rem] text-fg-3">{count(locale, entries.length, t.entryForms)}</span>}
            hint={`${t.limit}. ${t.saved}`}
          >
            <Textarea
              id={`${id}-list`}
              value={text}
              readOnly={spinning}
              rows={8}
              onChange={(e) => onText(e.target.value)}
              className="font-sans! text-[0.9375rem]!"
            />
          </Field>
          <Switch label={t.autoRemove} checked={autoRemove} onChange={(e) => setAutoRemove(e.target.checked)} />
          {/* One quiet row of secondary actions. */}
          <div className="-ml-2 flex flex-wrap gap-1">
            <Button size="sm" variant="ghost" onClick={() => commit(shuffle(entries))} disabled={spinning || entries.length < 2}>
              <Shuffle aria-hidden />
              {t.shuffle}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetList} disabled={spinning}>
              <RotateCcw aria-hidden />
              {preset ? t.resetPreset : t.reset}
            </Button>
            {removed.length > 0 && (
              <Button size="sm" variant="ghost" onClick={restoreRemoved} disabled={spinning}>
                <Undo2 aria-hidden />
                {t.restore} ({removed.length})
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable} aria-controls={`${id}-table`}>
              <ChevronDown aria-hidden className={cn("transition-transform duration-150", showTable && "rotate-180")} />
              {t.weights}
            </Button>
          </div>
          {showTable && (
            <div id={`${id}-table`}>
              <EntryTable
                locale={locale}
                entries={entries}
                disabled={spinning}
                onWeight={(eid, w) => commit(entries.map((e) => (e.id === eid ? { ...e, weight: w } : e)), false)}
                onColor={(eid, c) => commit(entries.map((e) => (e.id === eid ? { ...e, color: c } : e)), false)}
              />
            </div>
          )}
        </Panel>
        <HistoryPanel
          title={t.history}
          items={history}
          onClear={() => setHistory([])}
          clearLabel={t.clear}
          emptyLabel={t.empty}
        />
      </div>
    </div>
  );
}
