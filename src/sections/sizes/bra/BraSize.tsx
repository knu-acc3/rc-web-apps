"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { parseNumber } from "@/i18n/format";
import { Field, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { BANDS, EU_CUPS, braFromMeasure, braSize, cupDiff, sisterSizes, type EuCup } from "./engine";

const T = {
  ru: {
    under: "Под грудью, см",
    bust: "Грудь, см",
    yourSize: "Ваш размер (RU / EU)",
    pick: "Или выберите размер",
    band: "Пояс",
    cup: "Чашка",
    sisters: "Сестринские размеры",
    invalid: "Проверьте мерки: обхват груди должен быть больше обхвата под грудью, пояс — от 58 до 112 см, разница — от 10 до 27 см.",
    range: (u: string, b: string) => `Под грудью ${u} см, грудь ${b} см`,
  },
  en: {
    under: "Underbust, cm",
    bust: "Bust, cm",
    yourSize: "Your size (EU / RU)",
    pick: "Or pick a size",
    band: "Band",
    cup: "Cup",
    sisters: "Sister sizes",
    invalid: "Check the numbers: bust must exceed underbust, underbust 58–112 cm, difference 10–27 cm.",
    range: (u: string, b: string) => `Underbust ${u} cm, bust ${b} cm`,
  },
} as const;

/** Representative measurements for a size (used when a size is picked). */
const measuresFor = (band: number, cup: EuCup) => ({ under: String(band), bust: String(band + cupDiff(cup)[0] + 1) });

export default function BraSize({ locale, band = 75, cup = "B" }: { locale: Locale; band?: number; cup?: EuCup }) {
  const t = T[locale];
  const id = useId();
  const [under, setUnder] = useState(() => measuresFor(band, cup).under);
  const [bust, setBust] = useState(() => measuresFor(band, cup).bust);

  const u = parseNumber(under);
  const b = parseNumber(bust);
  const res = u !== null && b !== null ? braFromMeasure(u, b) : null;
  const s = res ? braSize(res.band, res.cup) : null;
  const touched = under.trim() !== "" && bust.trim() !== "";

  function pick(nb: number, nc: EuCup) {
    const m = measuresFor(nb, nc);
    setUnder(m.under);
    setBust(m.bust);
  }

  return (
    <Panel className="p-4 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.under} htmlFor={`${id}-u`}>
            <Input id={`${id}-u`} inputMode="decimal" autoComplete="off" value={under} onChange={(e) => setUnder(e.target.value)} size="lg" className="tabular" />
          </Field>
          <Field label={t.bust} htmlFor={`${id}-b`}>
            <Input id={`${id}-b`} inputMode="decimal" autoComplete="off" value={bust} onChange={(e) => setBust(e.target.value)} size="lg" className="tabular" />
          </Field>
        </div>
        <div className="min-w-0" aria-live="polite">
          {s ? (
            <>
              <div className="text-sm text-fg-2">{t.yourSize}</div>
              <div className="tabular text-4xl font-semibold tracking-tight text-fg sm:text-5xl">{s.eu}</div>
              <div className="tabular mt-1 text-[0.9375rem] text-fg-2">
                UK {s.uk} · US {s.us} · FR {s.fr}
              </div>
            </>
          ) : (
            touched && <p className="text-sm text-err">{t.invalid}</p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-sm">
        <span className="text-fg-3">{t.pick}</span>
        <label htmlFor={`${id}-pb`} className="sr-only">
          {t.band}
        </label>
        <Select id={`${id}-pb`} value={String(res?.band ?? band)} onChange={(e) => pick(Number(e.target.value), res?.cup ?? cup)} size="sm" className="w-20">
          {BANDS.map((x) => (
            <option key={x} value={String(x)}>
              {x}
            </option>
          ))}
        </Select>
        <label htmlFor={`${id}-pc`} className="sr-only">
          {t.cup}
        </label>
        <Select id={`${id}-pc`} value={res?.cup ?? cup} onChange={(e) => pick(res?.band ?? band, e.target.value as EuCup)} size="sm" className="w-20">
          {EU_CUPS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </Select>
        {s && (
          <span className="tabular ml-auto text-fg-3">
            {t.range(`${s.underbust[0]}–${s.underbust[1]}`, `${s.bust[0]}–${s.bust[1]}`)}
            {sisterSizes(s.band, s.cup).length > 0 && ` · ${t.sisters}: ${sisterSizes(s.band, s.cup).map((x) => `${x.band}${x.cup}`).join(", ")}`}
          </span>
        )}
      </div>
    </Panel>
  );
}
