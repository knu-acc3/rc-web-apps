"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Checkbox } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { detectLang, isReversible, reverseTransliterate, slugify, STANDARD_IDS, transliterate, type LangOption, type StandardId } from "./lib/translit";
import { InlineSelect, InputPanel, OptionsBar, OutputPanel, TwoPane } from "./ui/shared";

const NAMES: Record<StandardId, { ru: string; en: string }> = {
  icao: { ru: "Загранпаспорт (ICAO Doc 9303)", en: "Passport (ICAO Doc 9303)" },
  "gost-a": { ru: "ГОСТ 7.79-2000, система А (ISO 9)", en: "GOST 7.79-2000 System A (ISO 9)" },
  "gost-b": { ru: "ГОСТ 7.79-2000, система Б", en: "GOST 7.79-2000 System B" },
  bgn: { ru: "BGN/PCGN", en: "BGN/PCGN" },
  scientific: { ru: "Научная транслитерация", en: "Scientific (scholarly)" },
  informal: { ru: "Транслит как в чатах", en: "Informal chat translit" },
  "kazakh-2021": { ru: "Казахская латиница 2021", en: "Kazakh Latin alphabet 2021" },
  "ukrainian-2010": { ru: "Украинский стандарт 2010", en: "Ukrainian national system 2010" },
};

const T = {
  ru: {
    standard: "Стандарт",
    direction: "Направление",
    toLat: "Кириллица → латиница",
    toCyr: "Латиница → кириллица",
    lang: "Язык текста",
    auto: "определить",
    ru: "русский",
    uk: "украинский",
    kk: "казахский",
    detected: "Определён язык",
    sep: "Разделитель",
    maxLen: "Макс. длина",
    noLimit: "без ограничения",
    lower: "строчные буквы",
    slugOut: "Адрес (slug)",
    samples: {
      ru: "Щукин Юрий Подъячев, ул. Вишнёвая, 15",
      uk: "Київ, Згурівка, Знам'янка, Єнакієве",
      kk: "Қазақстан, Өскемен, Ақтөбе, Шымкент",
      slug: "Как выбрать ноутбук в 2025 году: 10 советов",
    },
  },
  en: {
    standard: "Standard",
    direction: "Direction",
    toLat: "Cyrillic → Latin",
    toCyr: "Latin → Cyrillic",
    lang: "Text language",
    auto: "auto-detect",
    ru: "Russian",
    uk: "Ukrainian",
    kk: "Kazakh",
    detected: "Detected language",
    sep: "Separator",
    maxLen: "Max length",
    noLimit: "no limit",
    lower: "lowercase",
    slugOut: "URL slug",
    samples: {
      ru: "Щукин Юрий Подъячев, ул. Вишнёвая, 15",
      uk: "Київ, Згурівка, Знам'янка, Єнакієве",
      kk: "Қазақстан, Өскемен, Ақтөбе, Шымкент",
      slug: "Как выбрать ноутбук в 2025 году: 10 советов",
    },
  },
} as const;

export interface TransliterationProps {
  locale: Locale;
  standard?: StandardId;
  mode?: "translit" | "slug";
}

export default function Transliteration({ locale, standard: std0 = "icao", mode = "translit" }: TransliterationProps) {
  const t = T[locale];
  const id = useId();
  const initial = mode === "slug" ? t.samples.slug : std0 === "kazakh-2021" ? t.samples.kk : std0 === "ukrainian-2010" ? t.samples.uk : t.samples.ru;
  const [text, setText] = useState<string>(initial);
  const [std, setStd] = useState<StandardId>(std0);
  const [dir, setDir] = useState<"to-lat" | "to-cyr">("to-lat");
  const [lang, setLang] = useState<LangOption>("auto");
  const [sep, setSep] = useState<"-" | "_">("-");
  const [maxLen, setMaxLen] = useState<"0" | "40" | "60" | "80">("0");
  const [lower, setLower] = useState(true);
  const reversible = isReversible(std);
  const effectiveDir = reversible ? dir : "to-lat";

  const out = useMemo(() => {
    if (mode === "slug") return text.split("\n").map((l) => slugify(l, { lang, separator: sep, maxLength: Number(maxLen), lowercase: lower })).join("\n");
    return effectiveDir === "to-cyr" ? reverseTransliterate(text, std) : transliterate(text, std, { lang });
  }, [text, std, effectiveDir, lang, mode, sep, maxLen, lower]);

  const detected = lang === "auto" && effectiveDir === "to-lat" ? detectLang(text) : null;

  return (
    <div className="flex flex-col gap-4">
      <OptionsBar>
        {mode === "translit" && (
          <InlineSelect id={`${id}-std`} label={t.standard} value={std} onChange={setStd} options={STANDARD_IDS.map((s) => ({ value: s, label: NAMES[s][locale] }))} />
        )}
        {mode === "translit" && reversible && (
          <Segmented
            label={t.direction}
            value={dir}
            onChange={setDir}
            size="sm"
            options={[
              { value: "to-lat", label: t.toLat },
              { value: "to-cyr", label: t.toCyr },
            ]}
          />
        )}
        {effectiveDir === "to-lat" && (
          <InlineSelect
            id={`${id}-lang`}
            label={t.lang}
            value={lang}
            onChange={setLang}
            options={(["auto", "ru", "uk", "kk"] as const).map((v) => ({ value: v, label: t[v] }))}
          />
        )}
        {detected && text && (
          <span className="text-sm text-fg-3">
            {t.detected}: {t[detected]}
          </span>
        )}
        {mode === "slug" && (
          <>
            <InlineSelect
              id={`${id}-sep`}
              label={t.sep}
              value={sep}
              onChange={setSep}
              options={[
                { value: "-", label: "-" },
                { value: "_", label: "_" },
              ]}
            />
            <InlineSelect
              id={`${id}-max`}
              label={t.maxLen}
              value={maxLen}
              onChange={setMaxLen}
              options={[
                { value: "0", label: t.noLimit },
                { value: "40", label: "40" },
                { value: "60", label: "60" },
                { value: "80", label: "80" },
              ]}
            />
            <Checkbox label={t.lower} checked={lower} onChange={(e) => setLower(e.target.checked)} />
          </>
        )}
      </OptionsBar>
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} />
        <OutputPanel locale={locale} value={out} filename={mode === "slug" ? "slug.txt" : "translit.txt"} title={mode === "slug" ? t.slugOut : undefined} />
      </TwoPane>
    </div>
  );
}
