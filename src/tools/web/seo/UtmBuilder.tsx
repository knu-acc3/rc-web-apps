"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input } from "@/ui/field";
import { buildUtm, parseUtm, utmWarnings, UTM_KEYS, type UtmKey, type UtmParams } from "./lib/utm";
import { Issues, Split } from "./ui/kit";
import { ChipChoice } from "@/ui/chip-choice";

export type UtmPreset = "" | "yandex" | "google" | "vk" | "telegram" | "email";

const PRESETS: Record<Exclude<UtmPreset, "">, UtmParams> = {
  yandex: { utm_source: "yandex", utm_medium: "cpc", utm_campaign: "{campaign_id}", utm_content: "{ad_id}", utm_term: "{keyword}" },
  google: { utm_source: "google", utm_medium: "cpc", utm_campaign: "{campaignid}", utm_content: "{creative}", utm_term: "{keyword}" },
  vk: { utm_source: "vk", utm_medium: "cpc", utm_campaign: "" },
  telegram: { utm_source: "telegram", utm_medium: "social", utm_campaign: "" },
  email: { utm_source: "newsletter", utm_medium: "email", utm_campaign: "" },
};

const LABEL: Record<UtmKey, Record<Locale, [string, string]>> = {
  utm_source: { ru: ["utm_source — источник", "yandex, google, vk, newsletter"], en: ["utm_source — source", "google, newsletter, facebook"] },
  utm_medium: { ru: ["utm_medium — тип трафика", "cpc, email, social, banner"], en: ["utm_medium — medium", "cpc, email, social, banner"] },
  utm_campaign: { ru: ["utm_campaign — кампания", "autumn_sale"], en: ["utm_campaign — campaign", "autumn_sale"] },
  utm_term: { ru: ["utm_term — ключевое слово", "{keyword}"], en: ["utm_term — keyword", "{keyword}"] },
  utm_content: { ru: ["utm_content — объявление", "banner_red"], en: ["utm_content — ad content", "banner_red"] },
};

const T = {
  ru: {
    url: "Ссылка на страницу",
    preset: "Шаблон",
    presets: { "": "Свои значения", yandex: "Яндекс Директ", google: "Google Ads", vk: "VK Реклама", telegram: "Telegram", email: "Email-рассылка" } as Record<UtmPreset, string>,
    result: "Ссылка с UTM-метками",
    copy: "Копировать",
    copied: "Скопировано",
    empty: "Вставьте ссылку и заполните хотя бы utm_source — здесь появится готовая ссылка",
    warn: {
      upper: "Используйте строчные буквы: для аналитики Google и Метрики «Google» и «google» — разные источники",
      spaces: "Пробелы в метках превратятся в %20 — лучше заменить их на _ или -",
      noScheme: "Ссылка без https:// — добавьте протокол, иначе ссылка может не открыться",
      gclid: "В ссылке уже есть gclid/yclid/fbclid — это идентификатор конкретного клика, удалите его перед публикацией",
    },
    macro: "Значения в фигурных скобках — макросы рекламной системы: при клике она подставит номер кампании, объявления или ключевую фразу.",
  },
  en: {
    url: "Page URL",
    preset: "Template",
    presets: { "": "Custom", yandex: "Yandex Direct", google: "Google Ads", vk: "VK Ads", telegram: "Telegram", email: "Email newsletter" } as Record<UtmPreset, string>,
    result: "Link with UTM parameters",
    copy: "Copy",
    copied: "Copied",
    empty: "Paste a link and fill in at least utm_source — the tagged link appears here",
    warn: {
      upper: "Use lower case: analytics treats “Google” and “google” as different sources",
      spaces: "Spaces become %20 — better replace them with _ or -",
      noScheme: "The link has no https:// — add the protocol or it may not open",
      gclid: "The link already contains gclid/yclid/fbclid — that's a single click's ID, remove it before publishing",
    },
    macro: "Values in curly braces are ad-platform macros: on click the platform fills in the campaign, ad or keyword.",
  },
} as const;

export default function UtmBuilder({ locale, preset: initial = "" }: { locale: Locale; preset?: UtmPreset }) {
  const t = T[locale];
  const id = useId();
  const [url, setUrl] = useState("");
  const [preset, setPreset] = useState<UtmPreset>(initial);
  const [p, setP] = useState<UtmParams>(initial ? PRESETS[initial] : {});

  function onUrl(v: string) {
    setUrl(v);
    const found = parseUtm(v);
    if (Object.keys(found).length) setP((o) => ({ ...o, ...found }));
  }

  const result = p.utm_source?.trim() && url.trim() ? buildUtm(url, p) : "";
  const warnings = utmWarnings(url, p).map((w) => t.warn[w]);
  const hasMacro = Object.values(p).some((x) => x && /\{[^}]+\}/.test(x));

  return (
    <Split
      input={
        <>
          <Field label={t.url} htmlFor={`${id}-u`}>
            <Input id={`${id}-u`} value={url} onChange={(e) => onUrl(e.target.value)} size="lg" className="font-mono" inputMode="url" placeholder="https://example.com/landing" spellCheck={false} autoComplete="off" />
          </Field>
          <div role="group" aria-labelledby={`${id}-p`} className="flex flex-col gap-2">
            <span id={`${id}-p`} className="text-sm font-medium text-fg-2">
              {t.preset}
            </span>
            <ChipChoice
              layout="wrap"
              label={t.preset}
              value={preset}
              onChange={(v) => {
                setPreset(v);
                if (v) setP({ ...PRESETS[v], utm_campaign: PRESETS[v].utm_campaign || p.utm_campaign });
              }}
              options={(Object.keys(t.presets) as UtmPreset[]).map((k) => ({ value: k, label: t.presets[k] }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {UTM_KEYS.map((k) => (
              <Field key={k} label={LABEL[k][locale][0]} htmlFor={`${id}-${k}`}>
                <Input id={`${id}-${k}`} value={p[k] ?? ""} onChange={(e) => setP((o) => ({ ...o, [k]: e.target.value }))} placeholder={LABEL[k][locale][1]} className="font-mono" spellCheck={false} autoComplete="off" />
              </Field>
            ))}
          </div>
          {hasMacro && <p className="text-sm text-fg-3">{t.macro}</p>}
        </>
      }
    >
      <section aria-live="polite" className="min-w-0 rounded-[1.25rem] bg-accent-soft p-5 sm:p-6">
        <h2 className="text-sm font-medium text-fg-2">{t.result}</h2>
        <p className={result ? "mt-2 font-mono text-lg break-all text-fg select-all" : "mt-2 text-[0.9375rem] text-fg-3"}>{result || t.empty}</p>
        {result && <CopyButton value={result} label={t.copy} copiedLabel={t.copied} variant="primary" size="md" showLabel className="mt-4" />}
      </section>
      <Issues items={warnings} />
    </Split>
  );
}
