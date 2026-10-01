"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { Field, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
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

  return (
    <Panel className="p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Field label={t.system} htmlFor={`${id}-s`}>
          <Select id={`${id}-s`} value={system} onChange={(e) => changeSystem(e.target.value as RingSystem)} size="lg">
            {RING_SYSTEMS.map((k) => (
              <option key={k} value={k}>
                {t.labels[k]}
              </option>
            ))}
          </Select>
        </Field>
        {system === "uk" ? (
          <Field label={t.value} htmlFor={`${id}-v`}>
            <Select id={`${id}-v`} value={String(ukIdx)} onChange={(e) => setUkIdx(Number(e.target.value))} size="lg">
              {uk.map((o) => (
                <option key={o.index} value={String(o.index)}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label={t.value} htmlFor={`${id}-v`} error={error ?? undefined}>
            <Input
              id={`${id}-v`}
              inputMode="decimal"
              autoComplete="off"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-invalid={!!error}
              size="lg"
              className="tabular"
            />
          </Field>
        )}
      </div>

      <div className="mt-5" aria-live="polite">
        {s && (
          <>
            <ResultTiles items={tiles} />
            <p className="tabular mt-3 text-sm text-fg-2">
              {t.diameter} {n(s.d, 2)} {t.mm} · {t.circ} {n(s.c, 1)} {t.mm}
            </p>
          </>
        )}
      </div>
      <p className="mt-4 text-sm text-fg-3">{t.note}</p>
    </Panel>
  );
}
