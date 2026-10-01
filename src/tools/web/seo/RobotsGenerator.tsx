"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Input, Select, Switch, Textarea } from "@/ui/field";
import { buildRobots, type Preset } from "./lib/presets";
import { parseRobots } from "./lib/robots";
import { lintText } from "./content/robots-text";
import { Issues, Output } from "./ui/kit";

const NAMES: Record<Preset, Record<Locale, string>> = {
  basic: { ru: "Открыть весь сайт", en: "Allow everything" },
  wordpress: { ru: "WordPress", en: "WordPress" },
  bitrix: { ru: "1С-Битрикс", en: "1C-Bitrix" },
  opencart: { ru: "OpenCart", en: "OpenCart" },
  joomla: { ru: "Joomla 4/5", en: "Joomla 4/5" },
  modx: { ru: "MODX Revolution", en: "MODX Revolution" },
  disallowAll: { ru: "Закрыть весь сайт", en: "Block the whole site" },
};

const T = {
  ru: {
    preset: "Шаблон",
    sitemap: "Адрес sitemap.xml",
    ai: "Закрыть от AI-ботов (GPTBot, ClaudeBot, Google-Extended и др.)",
    extra: "Дополнительно закрыть",
    extraHint: "По одному пути на строку, например /cart/ или /*?sort=; можно писать Allow: /путь",
    out: "robots.txt",
    ok: "Ошибок не найдено. Положите файл в корень сайта: https://ваш-сайт/robots.txt",
  },
  en: {
    preset: "Template",
    sitemap: "sitemap.xml URL",
    ai: "Block AI crawlers (GPTBot, ClaudeBot, Google-Extended and more)",
    extra: "Also block",
    extraHint: "One path per line, e.g. /cart/ or /*?sort=; you can write Allow: /path",
    out: "robots.txt",
    ok: "No problems found. Put the file at the site root: https://your-site/robots.txt",
  },
} as const;

export default function RobotsGenerator({ locale, preset: initial = "basic", blockAi = false }: { locale: Locale; preset?: Preset; blockAi?: boolean }) {
  const t = T[locale];
  const id = useId();
  const [preset, setPreset] = useState<Preset>(initial);
  const [sitemap, setSitemap] = useState("");
  const [ai, setAi] = useState(blockAi);
  const [extra, setExtra] = useState("");

  const text = buildRobots({ preset, sitemap, blockAi: ai, extra });
  const lint = parseRobots(text).lint.filter((l) => !(preset === "disallowAll" && l.code === "blockAll"));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.preset} htmlFor={`${id}-p`}>
          <Select id={`${id}-p`} value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
            {(Object.keys(NAMES) as Preset[]).map((p) => (
              <option key={p} value={p}>
                {NAMES[p][locale]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.sitemap} htmlFor={`${id}-s`}>
          <Input id={`${id}-s`} value={sitemap} onChange={(e) => setSitemap(e.target.value)} placeholder="https://example.com/sitemap.xml" inputMode="url" className="font-mono" spellCheck={false} autoComplete="off" />
        </Field>
      </div>

      <Output locale={locale} value={text} title={t.out} filename="robots.txt" rows={Math.min(24, Math.max(8, text.split("\n").length))} />

      <div aria-live="polite">{lint.length ? <Issues items={lint.map((l) => lintText(locale, l))} /> : <Issues tone="ok" items={[t.ok]} />}</div>

      <div className="flex flex-col gap-4">
        <Switch label={t.ai} checked={ai} onChange={(e) => setAi(e.target.checked)} />
        <Field label={t.extra} htmlFor={`${id}-e`} hint={t.extraHint}>
          <Textarea id={`${id}-e`} value={extra} onChange={(e) => setExtra(e.target.value)} rows={3} className="font-mono text-sm" spellCheck={false} placeholder={"/cart/\n/*?sort="} />
        </Field>
      </div>
    </div>
  );
}
