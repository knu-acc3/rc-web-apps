"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CodeOutput } from "@/ui/code-output";
import { Field, Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Tabs } from "@/ui/tabs";
import { parseColor } from "../lib/color";
import { ColorField } from "../ui/ColorField";
import { SwatchStrip } from "../ui/SwatchStrip";
import { anchorStep, generateShades, SHADE_STEPS, shadesCss, shadesTailwind3, shadesTailwind4 } from "./lib/shades";

const T = {
  ru: {
    base: "Исходный цвет",
    name: "Имя цвета в коде",
    note: (step: number) => `Исходный цвет стал шагом ${step}; остальные подобраны по кривой светлоты Tailwind v4 для этого тона.`,
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать",
    code: "Код шкалы",
    invalid: "Введите цвет",
  },
  en: {
    base: "Base color",
    name: "Color name in code",
    note: (step: number) => `Your color became step ${step}; the others follow the Tailwind v4 lightness curve for this hue.`,
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    code: "Scale code",
    invalid: "Enter a color",
  },
} as const;

type Fmt = "css" | "tw4" | "tw3";

export default function ShadesGenerator({ locale, base: base0 = "#3B82F6" }: { locale: Locale; base?: string }) {
  const t = T[locale];
  const id = useId();
  const [base, setBase] = useState(base0);
  const [name, setName] = useState("brand");
  const [fmt, setFmt] = useState<Fmt>("tw4");
  const c = parseColor(base);
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "brand";
  const shades = c ? generateShades(c) : null;
  const exact = c ? SHADE_STEPS[anchorStep(c)] : null;
  const code = !shades ? "" : fmt === "css" ? shadesCss(slug, shades) : fmt === "tw4" ? shadesTailwind4(slug, shades) : shadesTailwind3(slug, shades);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <ColorField label={t.base} value={base} onChange={setBase} locale={locale} size="lg" />
          <Field label={t.name} htmlFor={`${id}-n`}>
            <Input id={`${id}-n`} value={name} onChange={(e) => setName(e.target.value)} size="lg" className="font-mono" autoComplete="off" spellCheck={false} />
          </Field>
        </div>
      </Panel>
      {shades ? (
        <>
          <div>
            <SwatchStrip items={shades.map((s) => ({ color: s.color, caption: String(s.step) }))} copyLabel={t.copy} copiedLabel={t.copied} tall className="max-sm:grid-flow-row max-sm:grid-cols-4" />
            {exact && <p className="mt-2 text-sm text-fg-3">{t.note(exact)}</p>}
          </div>
          <div className="flex flex-col gap-3">
            <Tabs
              label={t.code}
              value={fmt}
              onChange={setFmt}
              items={[
                { value: "tw4", label: "Tailwind v4 @theme" },
                { value: "css", label: "CSS" },
                { value: "tw3", label: "Tailwind v3" },
              ]}
            />
            <CodeOutput value={code} filename={fmt === "tw3" ? "colors.js" : "colors.css"} labels={{ copy: t.copy, copied: t.copied, download: t.download }} minRows={13} />
          </div>
        </>
      ) : (
        <p className="text-fg-3">{t.invalid}</p>
      )}
    </div>
  );
}

