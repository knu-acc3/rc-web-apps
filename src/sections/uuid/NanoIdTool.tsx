"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, formatSmart, plural } from "@/i18n/format";
import { outputLabels } from "@/sections/code/kit/labels";
import { Button } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select, Slider } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { entropyBits, log10IdsForCollision, NANOID_ALPHABETS, nanoid } from "./engine";

type Preset = keyof typeof NANOID_ALPHABETS | "custom";

const T = {
  ru: {
    alphabet: "Алфавит",
    presets: {
      default: "Стандартный NanoID (A–Z, a–z, 0–9, _ -)",
      alphanumeric: "Буквы и цифры",
      numbers: "Только цифры",
      lowercase: "Строчные буквы и цифры",
      hex: "Шестнадцатеричный (0–9, a–f)",
      nolookalikes: "Без похожих символов (нет 0/O, 1/l/I)",
      custom: "Свой алфавит",
    },
    customLabel: "Символы алфавита",
    length: "Длина",
    count: "Количество",
    rate: "Скорость генерации, ID в час",
    generate: "Сгенерировать",
    id: "Ваш NanoID",
    waiting: "Генерируется в браузере…",
    badAlphabet: "Нужно от 2 до 256 разных символов",
    entropy: "Энтропия",
    bits: ["бит", "бита", "бит"],
    symbols: ["символ", "символа", "символов"],
    risk1: "Вероятность хотя бы одной коллизии достигнет 1 % примерно после",
    ids: ["идентификатора", "идентификаторов", "идентификаторов"],
    at: "При",
    perHour: "ID в час это случится через",
    units: { sec: ["секунду", "секунды", "секунд"], min: ["минуту", "минуты", "минут"], hour: ["час", "часа", "часов"], day: ["день", "дня", "дней"], year: ["год", "года", "лет"] },
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    alphabet: "Alphabet",
    presets: {
      default: "Default NanoID (A–Z, a–z, 0–9, _ -)",
      alphanumeric: "Letters and digits",
      numbers: "Digits only",
      lowercase: "Lowercase letters and digits",
      hex: "Hexadecimal (0–9, a–f)",
      nolookalikes: "No look-alikes (no 0/O, 1/l/I)",
      custom: "Custom alphabet",
    },
    customLabel: "Alphabet characters",
    length: "Length",
    count: "How many",
    rate: "Generation rate, IDs per hour",
    generate: "Generate",
    id: "Your NanoID",
    waiting: "Generating in your browser…",
    badAlphabet: "Use 2 to 256 distinct characters",
    entropy: "Entropy",
    bits: ["bit", "bits"],
    symbols: ["symbol", "symbols"],
    risk1: "The probability of at least one collision reaches 1% after about",
    ids: ["ID", "IDs"],
    at: "At",
    perHour: "IDs per hour that takes",
    units: { sec: ["second", "seconds"], min: ["minute", "minutes"], hour: ["hour", "hours"], day: ["day", "days"], year: ["year", "years"] },
    copy: "Copy",
    copied: "Copied",
  },
} as const;

function bigNumber(locale: Locale, log10: number): string {
  if (log10 < 15) return formatNumber(locale, Math.round(10 ** log10));
  const e = Math.floor(log10);
  const m = 10 ** (log10 - e);
  return `${formatNumber(locale, m, { maximumFractionDigits: 1 })}×10${String(e).replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)])}`;
}

export default function NanoIdTool({ locale, preset: preset0 = "default", size: size0 = 21 }: { locale: Locale; preset?: Preset; size?: number }) {
  const t = T[locale];
  const id = useId();
  const [preset, setPreset] = useState<Preset>(preset0);
  const [custom, setCustom] = useState("0123456789ABCDEF");
  const [size, setSize] = useState(size0);
  const [countText, setCountText] = useState("10");
  const [rateText, setRateText] = useState("1000");
  const [ids, setIds] = useState<string[] | null>(null);

  const alphabet = preset === "custom" ? custom : NANOID_ALPHABETS[preset];
  const chars = [...alphabet];
  const valid = chars.length >= 2 && chars.length <= 256 && new Set(chars).size === chars.length;
  const count = Math.min(10000, Math.max(1, Math.floor(Number(countText) || 1)));
  const rate = Math.max(1, Number(rateText.replace(/\s/g, "")) || 1);

  const gen = (a = alphabet, s = size, n = count) => {
    const cs = [...a];
    if (cs.length < 2 || cs.length > 256 || new Set(cs).size !== cs.length) return;
    setIds(Array.from({ length: n }, () => nanoid(a, s)));
  };

  const first = useRef({ a: alphabet, s: size0 });
  useEffect(() => {
    const timer = setTimeout(() => setIds(Array.from({ length: 10 }, () => nanoid(first.current.a, first.current.s))), 0);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    if (!valid) return null;
    const lg = log10IdsForCollision(chars.length, size, 0.01);
    const hours = 10 ** (lg - Math.log10(rate));
    let unit: keyof (typeof T)["ru"]["units"] = "hour";
    let value = hours;
    if (hours < 1 / 60) {
      unit = "sec";
      value = hours * 3600;
    } else if (hours < 1) {
      unit = "min";
      value = hours * 60;
    } else if (hours >= 24 * 365) {
      unit = "year";
      value = hours / (24 * 365.25);
    } else if (hours >= 48) {
      unit = "day";
      value = hours / 24;
    }
    return { lg, bits: entropyBits(chars.length, size), unit, value };
  }, [valid, chars.length, size, rate]);

  const durationText = stats
    ? stats.value >= 1e15
      ? `${bigNumber(locale, Math.log10(stats.value))} ${plural(locale, 5, t.units[stats.unit])}`
      : `${formatSmart(locale, stats.value >= 10 ? Math.round(stats.value) : Number(stats.value.toPrecision(2)))} ${plural(locale, stats.value >= 10 ? Math.round(stats.value) : stats.value, t.units[stats.unit])}`
    : "";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 rounded-[10px] bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-fg-2">{t.id}</div>
            <output className="block min-h-8 font-mono text-lg font-semibold break-all text-fg sm:text-xl" aria-live="polite">
              {ids ? ids[0] : <span className="text-base font-normal text-fg-3">{t.waiting}</span>}
            </output>
          </div>
          <div className="flex shrink-0 gap-2">
            <CopyButton value={ids?.[0] ?? ""} label={t.copy} copiedLabel={t.copied} />
            <Button variant="primary" size="sm" onClick={() => gen()} disabled={!valid}>
              <RefreshCw aria-hidden />
              {t.generate}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label={t.alphabet} htmlFor={`${id}-a`}>
            <Select
              id={`${id}-a`}
              value={preset}
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
          </Field>
          {preset === "custom" ? (
            <Field label={t.customLabel} htmlFor={`${id}-c`} error={!valid ? t.badAlphabet : undefined}>
              <Input id={`${id}-c`} value={custom} onChange={(e) => setCustom(e.target.value)} onBlur={() => gen()} className="font-mono" spellCheck={false} aria-invalid={!valid} />
            </Field>
          ) : (
            <Field label={t.customLabel} htmlFor={`${id}-c`}>
              <Input id={`${id}-c`} value={alphabet} readOnly className="font-mono" />
            </Field>
          )}
          <Field label={`${t.length}: ${size}`} htmlFor={`${id}-l`}>
            <Slider
              id={`${id}-l`}
              min={2}
              max={64}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              onPointerUp={() => gen()}
              onKeyUp={() => gen()}
            />
          </Field>
          <Field label={t.count} htmlFor={`${id}-n`}>
            <Input id={`${id}-n`} inputMode="numeric" value={countText} onChange={(e) => setCountText(e.target.value)} onBlur={() => gen()} />
          </Field>
        </div>
      </Panel>

      {stats && (
        <Panel className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_16rem] sm:items-end">
            <div className="text-[15px] text-fg-2">
              <p>
                {t.entropy}: <strong className="text-fg">{formatNumber(locale, stats.bits, { maximumFractionDigits: 1 })} {plural(locale, Math.round(stats.bits), t.bits)}</strong> ({chars.length} {plural(locale, chars.length, t.symbols)} × {size}).
              </p>
              <p className="mt-1">
                {t.risk1} <strong className="text-fg">{bigNumber(locale, stats.lg)}</strong> {plural(locale, stats.lg < 15 ? Math.round(10 ** stats.lg) : 5, t.ids)}.
              </p>
              <p className="mt-1">
                {t.at} {formatNumber(locale, rate)} {t.perHour} <strong className="text-fg">≈ {durationText}</strong>.
              </p>
            </div>
            <Field label={t.rate} htmlFor={`${id}-r`}>
              <Input id={`${id}-r`} inputMode="numeric" value={rateText} onChange={(e) => setRateText(e.target.value)} />
            </Field>
          </div>
        </Panel>
      )}

      {ids && ids.length > 1 && <CodeOutput value={ids.join("\n")} title="NanoID" filename={`nanoid-${ids.length}.txt`} labels={outputLabels(locale)} />}
    </div>
  );
}
