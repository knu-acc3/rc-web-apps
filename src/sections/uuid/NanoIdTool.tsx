"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, formatSmart, plural } from "@/i18n/format";
import { outputLabels } from "@/sections/code/kit/labels";
import { Button } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { entropyBits, log10IdsForCollision, NANOID_ALPHABETS, nanoid } from "./engine";

type Preset = keyof typeof NANOID_ALPHABETS | "custom";
type Unit = "sec" | "min" | "hour" | "day" | "year";

const T = {
  ru: {
    alphabet: "Алфавит",
    presets: { default: "A–Z a–z 0–9 _ -", alphanumeric: "A–Z a–z 0–9", numbers: "0–9", lowercase: "a–z 0–9", hex: "0–9 a–f", nolookalikes: "без похожих символов", custom: "свой" },
    customLabel: "Символы алфавита",
    length: "Длина",
    count: "Количество",
    rate: "ID в час",
    generate: "Новый",
    badAlphabet: "Нужно от 2 до 256 разных символов",
    bits: ["бит", "бита", "бит"],
    risk: (n: string, ids: string) => `Риск коллизии 1 % — после ${n} ${ids}`,
    time: (rate: string, d: string) => `при ${rate} ID в час это ≈ ${d}`,
    ids: ["идентификатора", "идентификаторов", "идентификаторов"],
    units: { sec: ["секунда", "секунды", "секунд"], min: ["минута", "минуты", "минут"], hour: ["час", "часа", "часов"], day: ["день", "дня", "дней"], year: ["год", "года", "лет"] },
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    alphabet: "Alphabet",
    presets: { default: "A–Z a–z 0–9 _ -", alphanumeric: "A–Z a–z 0–9", numbers: "0–9", lowercase: "a–z 0–9", hex: "0–9 a–f", nolookalikes: "no look-alikes", custom: "custom" },
    customLabel: "Alphabet characters",
    length: "Length",
    count: "Count",
    rate: "IDs per hour",
    generate: "New",
    badAlphabet: "Use 2 to 256 distinct characters",
    bits: ["bit", "bits"],
    risk: (n: string, ids: string) => `1% collision risk after ${n} ${ids}`,
    time: (rate: string, d: string) => `at ${rate} IDs per hour that is ≈ ${d}`,
    ids: ["ID", "IDs"],
    units: { sec: ["second", "seconds"], min: ["minute", "minutes"], hour: ["hour", "hours"], day: ["day", "days"], year: ["year", "years"] },
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function bigNumber(locale: Locale, log10: number): string {
  if (log10 < 15) return formatNumber(locale, Math.round(10 ** log10));
  const e = Math.floor(log10);
  return `${formatNumber(locale, 10 ** (log10 - e), { maximumFractionDigits: 1 })}×10${String(e).replace(/\d/g, (d) => SUP[Number(d)])}`;
}

export default function NanoIdTool({ locale, preset: preset0 = "default", size: size0 = 21 }: { locale: Locale; preset?: Preset; size?: number }) {
  const t = T[locale];
  const id = useId();
  const [preset, setPreset] = useState<Preset>(preset0);
  const [custom, setCustom] = useState("0123456789ABCDEF");
  const [sizeText, setSizeText] = useState(String(size0));
  const [countText, setCountText] = useState("1");
  const [rateText, setRateText] = useState("1000");
  const [ids, setIds] = useState<string[] | null>(null);

  const alphabet = preset === "custom" ? custom : NANOID_ALPHABETS[preset];
  const chars = [...alphabet];
  const valid = chars.length >= 2 && chars.length <= 256 && new Set(chars).size === chars.length;
  const size = Math.min(256, Math.max(2, Math.floor(Number(sizeText) || size0)));
  const count = Math.min(10000, Math.max(1, Math.floor(Number(countText) || 1)));
  const rate = Math.max(1, Number(rateText.replace(/\s/g, "")) || 1);

  const gen = (a = alphabet, s = size, n = count) => {
    const cs = [...a];
    if (cs.length < 2 || cs.length > 256 || new Set(cs).size !== cs.length) return;
    setIds(Array.from({ length: n }, () => nanoid(a, s)));
  };

  const first = useRef({ a: alphabet, s: size0 });
  useEffect(() => {
    const timer = setTimeout(() => setIds([nanoid(first.current.a, first.current.s)]), 0);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    if (!valid) return null;
    const lg = log10IdsForCollision(chars.length, size, 0.01);
    const hours = 10 ** (lg - Math.log10(rate));
    let unit: Unit = "hour";
    let value = hours;
    if (hours < 1 / 60) [unit, value] = ["sec", hours * 3600];
    else if (hours < 1) [unit, value] = ["min", hours * 60];
    else if (hours >= 24 * 365) [unit, value] = ["year", hours / (24 * 365.25)];
    else if (hours >= 48) [unit, value] = ["day", hours / 24];
    return { lg, bits: entropyBits(chars.length, size), unit, value };
  }, [valid, chars.length, size, rate]);

  let duration = "";
  if (stats) {
    const v = stats.value >= 10 ? Math.round(stats.value) : Number(stats.value.toPrecision(2));
    duration = stats.value >= 1e15 ? `${bigNumber(locale, Math.log10(stats.value))} ${plural(locale, 5, t.units[stats.unit])}` : `${formatSmart(locale, v)} ${plural(locale, v, t.units[stats.unit])}`;
  }

  const commit = () => gen();

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-6">
        <div className="text-sm font-medium text-fg-2">NanoID</div>
        <output className="mt-1 block min-h-9 font-mono text-xl font-semibold tracking-tight break-all text-fg sm:text-[1.625rem]" aria-live="polite">
          {ids?.[0] ?? "…"}
        </output>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={() => gen()} disabled={!valid}>
            <RefreshCw aria-hidden />
            {t.generate}
          </Button>
          <CopyButton value={ids?.[0] ?? ""} label={t.copy} copiedLabel={t.copied} size="md" variant="outline" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-4 text-sm text-fg-2">
          <label className="flex items-center gap-2">
            {t.alphabet}
            <Select
              value={preset}
              size="sm"
              className="w-48"
              onChange={(e) => {
                const p = e.target.value as Preset;
                setPreset(p);
                gen(p === "custom" ? custom : NANOID_ALPHABETS[p]);
              }}
            >
              {(Object.keys(t.presets) as Preset[]).map((p) => (
                <option key={p} value={p}>
                  {t.presets[p]}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2" htmlFor={`${id}-l`}>
            {t.length}
            <Input id={`${id}-l`} size="sm" inputMode="numeric" className="w-16" value={sizeText} onChange={(e) => setSizeText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />
          </label>
          <label className="flex items-center gap-2" htmlFor={`${id}-n`}>
            {t.count}
            <Input id={`${id}-n`} size="sm" inputMode="numeric" className="w-20" value={countText} onChange={(e) => setCountText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />
          </label>
        </div>
        {preset === "custom" && (
          <Field className="mt-3" label={t.customLabel} htmlFor={`${id}-c`} error={!valid ? t.badAlphabet : undefined}>
            <Input id={`${id}-c`} value={custom} onChange={(e) => setCustom(e.target.value)} onBlur={commit} className="font-mono" spellCheck={false} aria-invalid={!valid} />
          </Field>
        )}
      </Panel>

      {stats && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-1 text-sm text-fg-2">
          <span>
            {formatNumber(locale, stats.bits, { maximumFractionDigits: 1 })} {plural(locale, Math.round(stats.bits), t.bits)} ·{" "}
            {t.risk(bigNumber(locale, stats.lg), plural(locale, stats.lg < 15 ? Math.round(10 ** stats.lg) : 5, t.ids))},
          </span>
          <span>{t.time(formatNumber(locale, rate), duration)}</span>
          <label className="flex items-center gap-2 text-fg-3" htmlFor={`${id}-r`}>
            ({t.rate}
            <Input id={`${id}-r`} size="sm" inputMode="numeric" className="w-24" value={rateText} onChange={(e) => setRateText(e.target.value)} />)
          </label>
        </div>
      )}

      {ids && ids.length > 1 && <CodeOutput value={ids.join("\n")} title="NanoID" filename={`nanoid-${ids.length}.txt`} labels={outputLabels(locale)} />}
    </div>
  );
}
