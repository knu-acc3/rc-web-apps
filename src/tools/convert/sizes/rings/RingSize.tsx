"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { Field, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { ScrollRow } from "@/ui/scroll-row";
import { SliderField } from "@/ui/slider-field";
import { ResultTiles, plainSpaces, type Tile } from "../ui/kit";
import { DIAMETER_RANGE, RING_SYSTEMS, diameterFrom, diameterToJp, diameterToUs, ringSizes, ukIndexFromCirc, ukOptions, type RingSystem } from "./engine";

const T = {
  ru: {
    system: "Что вы знаете",
    value: "Значение",
    labels: { ru: "RU", us: "US", uk: "UK", eu: "EU (ISO)", jp: "JP", d: "Диаметр, мм", c: "Окружность, мм" },
    tiles: { ru: "RU", us: "US", uk: "UK", eu: "EU", jp: "JP" },
    invalid: "Введите число",
    range: "Вне диапазона колец (диаметр 12–25 мм)",
    diameter: "Диаметр",
    circ: "окружность",
    mm: "мм",
    note: "Если размер между значениями — берите больший, особенно для широких колец (от 6 мм).",
  },
  en: {
    system: "What you know",
    value: "Value",
    labels: { ru: "RU", us: "US", uk: "UK", eu: "EU (ISO)", jp: "JP", d: "Diameter, mm", c: "Circumference, mm" },
    tiles: { ru: "RU", us: "US", uk: "UK", eu: "EU", jp: "JP" },
    invalid: "Enter a number",
    range: "Outside the ring range (12–25 mm diameter)",
    diameter: "Diameter",
    circ: "circumference",
    mm: "mm",
    note: "If you're between sizes, go up — especially for wide bands (6 mm and more).",
  },
} as const;

type SizeKey = "ru" | "us" | "uk" | "eu" | "jp";
const SIZE_KEYS: SizeKey[] = ["ru", "us", "uk", "eu", "jp"];

export default function RingSize({ locale, system: s0 = "ru", value = 17 }: { locale: Locale; system?: RingSystem; value?: number }) {
  const t = T[locale];
  const id = useId();
  const n = (v: number, d: number) => plainSpaces(formatNumber(locale, v, { maximumFractionDigits: d }));
  const [system, setSystem] = useState<RingSystem>(s0);
  const [text, setText] = useState(() => (s0 === "uk" ? "" : n(value, 2)));
  const [ukIdx, setUkIdx] = useState(() => (s0 === "uk" ? value : Math.round(ukIndexFromCirc(Math.PI * diameterFrom(s0, value)) * 2) / 2));
  const uk = useMemo(() => ukOptions(), []);

  const parsed = system === "uk" ? ukIdx : parseNumber(text);
  const d = parsed === null ? null : diameterFrom(system, parsed);
  const error = system !== "uk" && text.trim() === "" ? null : parsed === null ? t.invalid : d! < DIAMETER_RANGE[0] || d! > DIAMETER_RANGE[1] ? t.range : null;
  const s = d !== null && !error ? ringSizes(d) : null;

  function changeSystem(next: RingSystem) {
    if (s) {
      if (next === "uk") setUkIdx(Math.round(ukIndexFromCirc(s.c) * 2) / 2);
      else {
        const v = next === "d" || next === "ru" ? s.d : next === "c" || next === "eu" ? s.c : next === "us" ? diameterToUs(s.d) : diameterToJp(s.d);
        setText(n(v, next === "c" || next === "eu" ? 1 : 2));
      }
    }
    setSystem(next);
  }

  const show: SizeKey[] = SIZE_KEYS.filter((k) => k !== system).slice(0, 4);
  const fmt = (k: SizeKey) => (!s ? "—" : k === "uk" ? s.uk : k === "ru" ? n(s.ru, 1) : k === "us" ? n(s.us, 2) : String(s[k]));
  const tiles: Tile[] = show.map((k) => ({ label: t.tiles[k], value: fmt(k) }));

  // Slider range of the chosen system, from the diameter range of rings.
  const [d0, d1] = DIAMETER_RANGE;
  const range: Record<Exclude<RingSystem, "uk">, [number, number, number, number]> = {
    ru: [d0, d1, 0.5, 1],
    d: [d0, d1, 0.1, 2],
    c: [38, 78, 0.5, 1],
    eu: [38, 78, 1, 1],
    us: [1, 16, 0.25, 2],
    jp: [1, 37, 1, 0],
  };

  return (
    <Panel className="p-4 sm:p-6">
      <div className="mb-1 text-sm font-medium text-fg-2">{t.system}</div>
      <ScrollRow label={t.system} role="radiogroup" rowClassName="gap-1.5">
        {RING_SYSTEMS.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={k === system} onClick={() => changeSystem(k)} className="chip">
            {t.labels[k]}
          </button>
        ))}
      </ScrollRow>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        {system === "uk" ? (
          <Field label={t.value} htmlFor={`${id}-v`}>
            <Select id={`${id}-v`} value={String(ukIdx)} onChange={(e) => setUkIdx(Number(e.target.value))} size="lg" fit="selected" className="self-start">
              {uk.map((o) => (
                <option key={o.index} value={String(o.index)}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <SliderField
            id={`${id}-v`}
            label={t.labels[system]}
            value={text}
            onChange={setText}
            parse={(x) => parseNumber(x)}
            format={(v) => n(v, range[system][3])}
            min={range[system][0]}
            max={range[system][1]}
            step={range[system][2]}
            error={error ?? undefined}
          />
        )}

        <div className="min-w-0" aria-live="polite">
          {s && (
            <>
              <ResultTiles items={tiles} />
              <p className="tabular mt-3 text-sm text-fg-2">
                {t.diameter} {n(s.d, 2)} {t.mm} · {t.circ} {n(s.c, 1)} {t.mm}
              </p>
            </>
          )}
        </div>
      </div>
      <p className="mt-5 text-sm text-fg-3">{t.note}</p>
    </Panel>
  );
}
