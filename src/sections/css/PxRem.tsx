"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { parseNumber } from "@/i18n/format";
import { copyText } from "@/lib/clipboard";
import { CopyButton } from "@/ui/copy-button";
import { Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { convertUnit, CSS_UNITS, fmtUnit, type CssUnit, type UnitContext } from "./lib/units";

const T = {
  ru: {
    value: "Значение",
    unit: "Единица",
    to: "Перевести в",
    root: "Базовый размер шрифта (html), px",
    parent: "Шрифт родителя (для em и %), px",
    viewport: "Ширина экрана (для vw), px",
    all: "Во всех единицах",
    invalid: "Введите число",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    value: "Value",
    unit: "Unit",
    to: "Convert to",
    root: "Root font size (html), px",
    parent: "Parent font size (for em and %), px",
    viewport: "Viewport width (for vw), px",
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
  const setCtxNum = (k: keyof UnitContext, v: string) => {
    const x = parseNumber(v);
    if (x !== null && x > 0) setCtx((c) => ({ ...c, [k]: x }));
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-v`} className="text-sm font-medium text-fg-2">
                {t.value}
              </label>
              <Input id={`${id}-v`} inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} size="lg" className="tabular" aria-invalid={text.trim() !== "" && n === null} autoComplete="off" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-u`} className="text-sm font-medium text-fg-2">
                {t.unit}
              </label>
              <Select id={`${id}-u`} value={from} onChange={(e) => setFrom(e.target.value as CssUnit)} size="lg">
                {CSS_UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <label htmlFor={`${id}-t`} className="text-sm font-medium text-fg-2">
                {t.to}
              </label>
              <Select id={`${id}-t`} value={to} onChange={(e) => setTo(e.target.value as CssUnit)} size="sm" className="w-24">
                {CSS_UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
            </div>
            <div className="flex min-h-12 items-center justify-between gap-2 rounded-[0.5rem] bg-surface-2 px-3">
              <output className="tabular min-w-0 font-mono text-2xl font-bold break-words [overflow-wrap:anywhere] text-fg" aria-live="polite">
                {main || <span className="text-base font-normal text-fg-3">{t.invalid}</span>}
              </output>
              <CopyButton value={main} label={t.copy} copiedLabel={t.copied} size="sm" variant="ghost" />
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 border-t border-line pt-3 sm:grid-cols-3">
          {(["root", "parent", "viewport"] as const).map((k) => (
            <div key={k} className="flex flex-col gap-1">
              <label htmlFor={`${id}-${k}`} className="text-xs text-fg-3">
                {t[k]}
              </label>
              <Input id={`${id}-${k}`} inputMode="decimal" defaultValue={ctx[k]} onChange={(e) => setCtxNum(k, e.target.value)} size="sm" className="tabular" />
            </div>
          ))}
        </div>
      </Panel>

      {n !== null && (
        <Panel className="p-2">
          <h2 className="px-3 pt-1 pb-2 text-sm font-semibold text-fg-2">{t.all}</h2>
          <ul className="grid sm:grid-cols-3">
            {CSS_UNITS.filter((u) => u !== from).map((u) => {
              const v = fmtUnit(convertUnit(n, from, u, ctx), u);
              return (
                <li key={u}>
                  <button
                    type="button"
                    className="group flex w-full items-center justify-between gap-2 rounded-[0.5rem] px-3 py-2 text-left hover:bg-surface-2"
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
                    <span className={copied === u ? "text-ok" : "text-fg-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}>
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
