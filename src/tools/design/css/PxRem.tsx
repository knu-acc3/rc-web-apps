"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { parseNumber } from "@/i18n/format";
import { copyText } from "@/lib/clipboard";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { convertUnit, CSS_UNITS, fmtUnit, type CssUnit, type UnitContext } from "./lib/units";

const T = {
  ru: {
    value: "Значение",
    unit: "Единица",
    to: "Перевести в",
    root: "Шрифт html",
    parent: "Шрифт родителя (em, %)",
    viewport: "Ширина экрана (vw)",
    all: "Во всех единицах",
    invalid: "Введите число",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    value: "Value",
    unit: "Unit",
    to: "Convert to",
    root: "html font size",
    parent: "Parent font (em, %)",
    viewport: "Viewport width (vw)",
    all: "In every unit",
    invalid: "Enter a number",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

export default function PxRemConverter({ locale, from: from0 = "px", to: to0 = "rem", value: value0 = 24 }: { locale: Locale; from?: CssUnit; to?: CssUnit; value?: number }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(String(value0));
  const [from, setFrom] = useState<CssUnit>(from0);
  const [to, setTo] = useState<CssUnit>(to0);
  const [ctx, setCtx] = useState<UnitContext>({ root: 16, parent: 16, viewport: 1440 });
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const n = parseNumber(text);
  const main = n === null ? "" : fmtUnit(convertUnit(n, from, to, ctx), to);
  const setCtxNum = (k: keyof UnitContext, x: number | null) => {
    if (x !== null && x > 0) setCtx((c) => ({ ...c, [k]: x }));
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-5 p-4 sm:p-5">
        <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="flex min-w-0 items-end gap-2">
            <Field label={t.value} htmlFor={`${id}-v`} className="flex-1">
              <Input id={`${id}-v`} inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} size="lg" className="tabular" aria-invalid={text.trim() !== "" && n === null} autoComplete="off" />
            </Field>
            <Field label={t.unit} htmlFor={`${id}-u`}>
              <Select id={`${id}-u`} value={from} onChange={(e) => setFrom(e.target.value as CssUnit)} size="lg">
                {CSS_UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-2">{t.to}</span>
            <Segmented label={t.to} value={to} onChange={setTo} size="sm" options={CSS_UNITS.map((u) => ({ value: u, label: u }))} />
            <div className="flex min-h-14 items-center justify-between gap-2 rounded-[1rem] bg-surface-2 py-1.5 pr-2 pl-4">
              <output className="tabular min-w-0 font-mono text-2xl font-bold break-words [overflow-wrap:anywhere] text-fg sm:text-3xl" aria-live="polite">
                {main || <span className="text-base font-normal text-fg-3">{t.invalid}</span>}
              </output>
              <CopyButton value={main} label={t.copy} copiedLabel={t.copied} size="md" variant="primary" compact />
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["root", "parent"] as const).map((k) => (
            <Field key={k} label={t[k]} htmlFor={`${id}-${k}`}>
              <NumberInput id={`${id}-${k}`} value={ctx[k]} min={1} max={200} decimals={2} suffix="px" onChange={(x) => setCtxNum(k, x)} size="sm" locale={locale} />
            </Field>
          ))}
          <Field label={t.viewport} htmlFor={`${id}-viewport`}>
            <NumberInput id={`${id}-viewport`} value={ctx.viewport} min={1} max={10000} step={10} suffix="px" stepper={false} onChange={(x) => setCtxNum("viewport", x)} size="sm" locale={locale} />
          </Field>
        </div>
      </Panel>

      {n !== null && (
        <Panel className="p-2 sm:p-3">
          <h2 className="px-3 pt-1 pb-2 text-sm font-semibold text-fg-2">{t.all}</h2>
          <ul className="grid gap-1 sm:grid-cols-3 lg:grid-cols-5">
            {CSS_UNITS.filter((u) => u !== from).map((u) => {
              const v = fmtUnit(convertUnit(n, from, u, ctx), u);
              return (
                <li key={u}>
                  <button
                    type="button"
                    className={`group flex min-h-11 w-full items-center justify-between gap-2 rounded-[0.75rem] px-3 py-2 text-left transition-colors duration-150 hover:bg-surface-2 active:bg-surface-3 ${copied === u ? "bg-ok-soft" : ""}`}
                    onClick={async () => {
                      if (await copyText(v)) {
                        setCopied(u);
                        if (timer.current) clearTimeout(timer.current);
                        timer.current = setTimeout(() => setCopied(null), 1200);
                      }
                    }}
                    title={`${t.copy} ${v}`}
                  >
                    <code className="tabular font-mono text-[0.9375rem] text-fg">{v}</code>
                    <span className={copied === u ? "text-ok" : "text-fg-3 opacity-40 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"}>
                      {copied === u ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                      <span className="sr-only">{copied === u ? t.copied : t.copy}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
