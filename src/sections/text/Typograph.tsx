"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Checkbox, Switch } from "@/ui/field";
import { Panel, PanelHeader } from "@/ui/panel";
import { toHtmlEntities, typograph, type TypoLang } from "./lib/typograph";
import { InputPanel, MoreOptions, OutputPanel, TwoPane } from "./ui/shared";

const T = {
  ru: {
    quotes: "Кавычки",
    dashes: "Тире",
    nbsp: "Неразрывные пробелы",
    digits: "Разряды в числах",
    symbols: "Символы (… © ² ×)",
    spaces: "Лишние пробелы",
    entities: "HTML-мнемоники (&nbsp; &laquo;)",
    visible: "Показать неразрывные пробелы",
    preview: "Как это выглядит",
    legend: "· — неразрывный пробел, ⸱ — узкий неразрывный",
    sample: {
      ru: 'Как говорил А. С. Пушкин - "Привычка свыше нам дана". В 2024 году тираж составил 1500000 экземпляров - это на 20 % больше, чем в 2020-2023 годах... Площадь - 45 м2, цена - 12000000 тенге. Он сказал: "Это "лучший" вариант" и т. д.',
      en: 'She said "it\'s the \'best\' option" - and it was... The 1990-2000 decade saw 15" screens (c) 2024.',
    },
  },
  en: {
    quotes: "Quotes",
    dashes: "Dashes",
    nbsp: "Non-breaking spaces",
    digits: "Digit grouping",
    symbols: "Symbols (… © ² ×)",
    spaces: "Extra spaces",
    entities: "HTML entities (&nbsp; &ldquo;)",
    visible: "Show non-breaking spaces",
    preview: "Preview",
    legend: "· — non-breaking space, ⸱ — narrow non-breaking space",
    sample: {
      ru: 'Как говорил А. С. Пушкин - "Привычка свыше нам дана". В 2024 году тираж составил 1500000 экземпляров - это на 20 % больше, чем в 2020-2023 годах... Площадь - 45 м2.',
      en: 'She said "it\'s the \'best\' option" - and it was... The 1990-2000 decade saw 15" screens (c) 2024. Don\'t forget the \'90s.',
    },
  },
} as const;

export default function Typograph({ locale, lang = "ru" }: { locale: Locale; lang?: TypoLang }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState<string>(t.sample[lang]);
  const [o, setO] = useState({ quotes: true, dashes: true, nbsp: true, digits: true, symbols: true, spaces: true });
  const [entities, setEntities] = useState(false);
  const [visible, setVisible] = useState(true);
  const out = useMemo(() => typograph(text, { lang, ...o }), [text, lang, o]);
  const flag = (k: keyof typeof o) => (e: React.ChangeEvent<HTMLInputElement>) => setO((p) => ({ ...p, [k]: e.target.checked }));

  return (
    <div className="flex flex-col gap-4">
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} />
        <OutputPanel locale={locale} value={entities ? toHtmlEntities(out) : out} filename={entities ? "typograph.html" : "typograph.txt"} />
      </TwoPane>
      <Panel>
        <PanelHeader title={t.preview} actions={<Switch label={t.visible} checked={visible} onChange={(e) => setVisible(e.target.checked)} className="text-sm" />} />
        <div className="px-4 py-3 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-fg" lang={lang}>
          {visible
            ? out.split(/( | )/).map((part, i) =>
                part === " " ? (
                  <span key={i} className="text-accent" title="U+00A0">
                    ·
                  </span>
                ) : part === " " ? (
                  <span key={i} className="text-accent" title="U+202F">
                    ⸱
                  </span>
                ) : (
                  part
                ),
              )
            : out}
        </div>
        {visible && <p className="border-t border-line px-4 py-2 text-[0.8125rem] text-fg-3">{t.legend}</p>}
      </Panel>
      <MoreOptions locale={locale}>
        <Checkbox label={t.entities} checked={entities} onChange={(e) => setEntities(e.target.checked)} />
        <Checkbox label={t.quotes} checked={o.quotes} onChange={flag("quotes")} />
        <Checkbox label={t.dashes} checked={o.dashes} onChange={flag("dashes")} />
        <Checkbox label={t.nbsp} checked={o.nbsp} onChange={flag("nbsp")} />
        {lang === "ru" && <Checkbox label={t.digits} checked={o.digits} onChange={flag("digits")} />}
        <Checkbox label={t.symbols} checked={o.symbols} onChange={flag("symbols")} />
        <Checkbox label={t.spaces} checked={o.spaces} onChange={flag("spaces")} />
      </MoreOptions>
    </div>
  );
}
