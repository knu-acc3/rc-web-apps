"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, formatSmart, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { outputLabels } from "@/tools/dev/shared/labels";
import { Opt } from "@/tools/dev/shared/Pane";
import { Button } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Panel } from "@/ui/panel";
import { ScrollRow } from "@/ui/scroll-row";
import { SliderField } from "@/ui/slider-field";
import { entropyBits, log10IdsForCollision, NANOID_ALPHABETS, nanoid } from "./lib/engine";

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
    generate: "Сгенерировать",
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
    generate: "Generate",
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

  // A new alphabet, length or count (typed or dragged) regenerates once the value settles.
  const settled = useRef(`${alphabet}|${size0}|1`);
  useEffect(() => {
    const key = `${alphabet}|${size}|${count}`;
    if (key === settled.current) return;
    const timer = setTimeout(() => {
      settled.current = key;
      const cs = [...alphabet];
      if (cs.length < 2 || cs.length > 256 || new Set(cs).size !== cs.length) return;
      setIds(Array.from({ length: count }, () => nanoid(alphabet, size)));
    }, 150);
    return () => clearTimeout(timer);
  }, [alphabet, size, count]);

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

  const parseInt10 = (v: string) => {
    const n = Number(v.replace(/\s/g, ""));
    return v.trim() && Number.isFinite(n) ? n : null;
  };

  return (
    <div className={cn("grid items-start gap-4", ids && ids.length > 1 && "xl:grid-cols-2")}>
      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="flex flex-col gap-5 p-4 sm:p-6">
          <div className="min-w-0">
            <div className="text-sm font-medium text-fg-2">NanoID</div>
            <output key={ids?.[0]} className="mt-1 block min-h-10 font-mono text-2xl font-semibold tracking-tight break-all text-fg motion-safe:animate-[menu-in_0.25s_ease-out] sm:text-3xl" aria-live="polite">
              {ids?.[0] ?? "…"}
            </output>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="filled" size="lg" onClick={() => gen()} disabled={!valid}>
              <RefreshCw aria-hidden />
              {t.generate}
            </Button>
            <CopyButton value={ids?.[0] ?? ""} label={t.copy} copiedLabel={t.copied} size="md" variant="secondary" className="h-12! px-6!" />
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-sm font-medium text-fg-2">{t.alphabet}</span>
            <ScrollRow label={t.alphabet} role="radiogroup" rowClassName="gap-2">
              {(Object.keys(t.presets) as Preset[]).map((p) => (
                <button key={p} type="button" role="radio" aria-checked={p === preset} className="chip shrink-0 font-mono" onClick={() => setPreset(p)}>
                  {t.presets[p]}
                </button>
              ))}
            </ScrollRow>
          </div>
          {preset === "custom" && (
            <Field label={t.customLabel} htmlFor={`${id}-c`} error={!valid ? t.badAlphabet : undefined}>
              <Input id={`${id}-c`} value={custom} onChange={(e) => setCustom(e.target.value)} className="font-mono" spellCheck={false} aria-invalid={!valid} />
            </Field>
          )}
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <SliderField id={`${id}-l`} label={t.length} value={sizeText} onChange={setSizeText} parse={parseInt10} format={(n) => String(Math.round(n))} min={2} max={64} inputMode="numeric" />
            <SliderField id={`${id}-n`} label={t.count} value={countText} onChange={setCountText} parse={parseInt10} format={(n) => String(Math.round(n))} min={1} max={10000} scale="log" inputMode="numeric" />
          </div>
        </Panel>

        {stats && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-1 text-sm text-fg-2">
            <span>
              {formatNumber(locale, stats.bits, { maximumFractionDigits: 1 })} {plural(locale, Math.round(stats.bits), t.bits)} ·{" "}
              {t.risk(bigNumber(locale, stats.lg), plural(locale, stats.lg < 15 ? Math.round(10 ** stats.lg) : 5, t.ids))},
            </span>
            <span>{t.time(formatNumber(locale, rate), duration)}</span>
            <Opt label={t.rate} htmlFor={`${id}-r`} className="text-fg-3">
              <NumberInput id={`${id}-r`} size="sm" locale={locale} stepper={false} min={1} max={1e12} value={rate} onChange={(v) => setRateText(v === null ? "" : String(v))} className="w-36" />
            </Opt>
          </div>
        )}
      </div>

      {ids && ids.length > 1 && <CodeOutput value={ids.join("\n")} title="NanoID" filename={`nanoid-${ids.length}.txt`} labels={outputLabels(locale)} minRows={Math.min(14, ids.length)} />}
    </div>
  );
}
