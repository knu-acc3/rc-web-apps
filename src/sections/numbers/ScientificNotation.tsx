"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CopyButton } from "@/ui/copy-button";
import { Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { groupThousands } from "./lib/parse";
import { isZero, magnitude, parseScientific, SI_PREFIXES, superscript, toEngineering, toPlain, toScientific, type Notation } from "./lib/scientific";
import { Details } from "./ui/ui-bits";

export interface ScientificNotationProps {
  locale: Locale;
  value?: string;
}

const T = {
  ru: {
    number: "Число",
    placeholder: "0,000123 · 6,022e23 · 3×10^8",
    sig: "Значащих цифр",
    all: "все",
    sep: "Разделитель",
    e: "E-нотация",
    excel: "Excel / калькулятор",
    eng: "Инженерная запись",
    prefix: "Приставка СИ",
    plain: "Обычная запись",
    latex: "LaTeX",
    order: (n: number, d: number) => `Порядок числа: ${String(n).replace("-", "−")} · значащих цифр: ${d}`,
    tooLong: "слишком длинно для обычной записи",
    invalid: "Не удалось распознать число. Примеры: 1234,5 · 1,2e-5 · 3×10^8 · 6,02·10²³",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    number: "Number",
    placeholder: "0.000123 · 6.022e23 · 3×10^8",
    sig: "Significant figures",
    all: "all",
    sep: "Decimal mark",
    e: "E notation",
    excel: "Excel / calculator",
    eng: "Engineering notation",
    prefix: "SI prefix",
    plain: "Standard form",
    latex: "LaTeX",
    order: (n: number, d: number) => `Order of magnitude: ${String(n).replace("-", "−")} · significant digits: ${d}`,
    tooLong: "too long to write out",
    invalid: "Couldn't read the number. Examples: 1234.5 · 1.2e-5 · 3×10^8 · 6.02·10²³",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const SIGS = ["auto", "1", "2", "3", "4", "5", "6", "8", "10", "12", "15"] as const;
type Sig = (typeof SIGS)[number];

export default function ScientificNotation({ locale, value = "0.000123" }: ScientificNotationProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(() => (locale === "ru" ? value.replace(".", ",") : value));
  const [sig, setSig] = useState<Sig>("auto");
  const [sep, setSep] = useState<"," | ".">(locale === "ru" ? "," : ".");

  const x = text.trim() ? parseScientific(text) : null;
  const error = text.trim() && !x ? t.invalid : null;
  const s = sig === "auto" ? null : Number(sig);
  const dec = (m: string) => (sep === "," ? m.replace(".", ",") : m).replace("-", "−");
  const times = (n: Notation) => (x && isZero(x) ? dec(n.mantissa) : `${dec(n.mantissa)} × 10${superscript(n.exponent)}`);

  let main = "";
  let rows: { key: string; label: string; value: string; view?: string; mono?: boolean }[] = [];
  if (x) {
    const sci = toScientific(x, s);
    const eng = toEngineering(x, s);
    main = times(sci);
    const rounded = sig === "auto" ? x : parseScientific(`${sci.mantissa}e${sci.exponent}`)!;
    const plainRaw = toPlain(rounded);
    const plain =
      plainRaw === null
        ? ""
        : (() => {
            const neg = plainRaw.startsWith("-");
            const [i, f] = plainRaw.replace("-", "").split(".");
            return (neg ? "−" : "") + groupThousands(i, sep === "," ? " " : ",") + (f ? sep + f : "");
          })();
    const pref = SI_PREFIXES[eng.exponent];
    rows = [
      { key: "e", label: t.e, value: `${sci.mantissa}e${sci.exponent}`, mono: true },
      { key: "x", label: t.excel, value: `${sci.mantissa}E${sci.exponent < 0 ? "-" : "+"}${String(Math.abs(sci.exponent)).padStart(2, "0")}`, mono: true },
      { key: "eng", label: pref?.sym ? `${t.eng} · ${locale === "ru" ? `${pref.ru} (${pref.ruSym})` : `${pref.en} (${pref.sym})`}` : t.eng, value: times(eng) },
      { key: "plain", label: t.plain, value: plain, view: plain || t.tooLong },
      { key: "tex", label: t.latex, value: `${sci.mantissa} \\times 10^{${sci.exponent}}`, mono: true },
    ];
  }

  return (
    <Panel className="p-4 sm:p-6">
      <label htmlFor={`${id}-n`} className="text-sm font-medium text-fg-2">
        {t.number}
      </label>
      <Input
        id={`${id}-n`}
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        size="lg"
        className="mt-1.5 h-14! text-2xl! tabular"
        placeholder={t.placeholder}
        value={text}
        aria-invalid={!!error}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="mt-5 min-h-16" aria-live="polite">
        {error ? (
          <p className="text-[0.9375rem] text-err">{error}</p>
        ) : x ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="tabular text-4xl leading-tight font-semibold break-words [overflow-wrap:anywhere] text-fg sm:text-5xl">{main}</p>
              <p className="mt-1 text-sm text-fg-3">{t.order(magnitude(x), isZero(x) ? 1 : x.digits.length)}</p>
            </div>
            <CopyButton value={main} label={t.copy} copiedLabel={t.copied} className="shrink-0 self-start" />
          </div>
        ) : null}
      </div>

      {rows.length > 0 && (
        <div className="mt-3">
          <Details rows={rows.map((r) => ({ ...r, view: r.view ?? r.value }))} label={t.copy} copiedLabel={t.copied} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <label htmlFor={`${id}-s`} className="text-sm text-fg-2">
            {t.sig}
          </label>
          <Select id={`${id}-s`} size="sm" className="w-20" value={sig} onChange={(e) => setSig(e.target.value as Sig)}>
            {SIGS.map((v) => (
              <option key={v} value={v}>
                {v === "auto" ? t.all : v}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <span className="text-sm text-fg-2" aria-hidden>
            {t.sep}
          </span>
          <Segmented size="sm" label={t.sep} value={sep} onChange={setSep} options={[{ value: ",", label: "1,5" }, { value: ".", label: "1.5" }]} />
        </div>
      </div>
    </Panel>
  );
}
