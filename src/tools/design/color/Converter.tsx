"use client";

import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import { type Locale } from "@/i18n/config";
import { href } from "@/i18n/config";
import { ButtonLink } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Panel } from "@/ui/panel";
import { readableTextColor, toHex } from "./lib/color";
import { CONV_LABEL, bareHint, formatAs, parseAs, type ConvFormat } from "./lib/convert";
import { ColorField, CHECKER_STYLE } from "./ui/ColorField";
import { FormatList } from "./ui/FormatList";

const T = {
  ru: {
    input: (f: string) => `Цвет в формате ${f}`,
    hint: "Подойдёт и #hex, rgb(), hsl(), oklch() или название",
    result: (f: string) => `Результат в ${f}`,
    empty: "Введите цвет",
    reverse: "Обратный перевод",
    all: "Этот цвет во всех форматах",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    input: (f: string) => `Color in ${f}`,
    hint: "#hex, rgb(), hsl(), oklch() or a name work too",
    result: (f: string) => `Result in ${f}`,
    empty: "Enter a color",
    reverse: "Reverse conversion",
    all: "This color in every format",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

export interface ConverterProps {
  locale: Locale;
  from: ConvFormat;
  to: ConvFormat;
  sample: string;
  /** Slug of the reverse pair page, if it exists. */
  reverse?: string;
}

export default function ColorConverter({ locale, from, to, sample, reverse }: ConverterProps) {
  const t = T[locale];
  const [text, setText] = useState(sample);
  const color = parseAs(text, from);
  const out = color ? formatAs(color, to) : "";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <ColorField label={t.input(CONV_LABEL[from])} value={text} onChange={setText} locale={locale} bare={bareHint(from)} size="lg" hint={t.hint} />
          {reverse ? (
            <ButtonLink href={href(locale, [reverse])} variant="tonal" size="icon" aria-label={t.reverse} title={t.reverse} className="mx-auto max-md:rotate-90 md:mb-7">
              <ArrowLeftRight />
            </ButtonLink>
          ) : (
            <span className="hidden md:block md:w-10" />
          )}
          <div className="flex min-w-0 flex-col gap-1.5 md:mb-7">
            <div className="text-sm font-medium text-fg-2">{t.result(CONV_LABEL[to])}</div>
            <div className="flex min-h-12 items-center gap-2 rounded-[1rem] bg-surface-2 py-1 pr-1.5 pl-4">
              <output className="min-w-0 flex-1 font-mono text-lg font-semibold break-words text-fg [overflow-wrap:anywhere] sm:text-xl" aria-live="polite">
                {out || <span className="text-base font-normal text-fg-3">{t.empty}</span>}
              </output>
              <CopyButton value={out} label={t.copy} copiedLabel={t.copied} size="md" variant="primary" compact />
            </div>
          </div>
        </div>
      </Panel>

      {color && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Panel className="overflow-hidden">
            <div className="relative h-full min-h-40" style={CHECKER_STYLE}>
              <div className="absolute inset-0 flex items-end p-4" style={{ background: toHex(color) }}>
                <span className="font-mono text-xl font-semibold" style={{ color: readableTextColor(color) }}>
                  {toHex(color)}
                </span>
              </div>
            </div>
          </Panel>
          <Panel className="p-2 sm:p-3">
            <h2 className="px-3 pt-1 pb-2 text-sm font-semibold text-fg-2">{t.all}</h2>
            <FormatList color={color} locale={locale} />
          </Panel>
        </div>
      )}
    </div>
  );
}
