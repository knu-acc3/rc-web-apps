"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Segmented } from "@/ui/segmented";
import { convertLayout, detectDirection, type LayoutDirection } from "./lib/layout";
import { InputPanel, OutputPanel, TwoPane } from "./ui/shared";

const T = {
  ru: {
    dir: "Направление",
    auto: "Автоматически",
    "en-ru": "EN → RU (ghbdtn → привет)",
    "ru-en": "RU → EN (руддщ → hello)",
    detected: "Определено",
    samples: { "en-ru": "Ghbdtn? rfr ltkf& Z yt gthtrk.xbk hfcrkflre", "ru-en": "Руддщб цщкдв! Ш ащкпще ещ ыцшеср дфнщгею" },
    input: "Текст в неправильной раскладке",
  },
  en: {
    dir: "Direction",
    auto: "Auto-detect",
    "en-ru": "EN → RU (ghbdtn → привет)",
    "ru-en": "RU → EN (руддщ → hello)",
    detected: "Detected",
    samples: { "en-ru": "Ghbdtn? rfr ltkf& Z yt gthtrk.xbk hfcrkflre", "ru-en": "Руддщб цщкдв! Ш ащкпще ещ ыцшеср дфнщгею" },
    input: "Text typed in the wrong layout",
  },
} as const;

export default function LayoutFixer({ locale, direction = "auto" }: { locale: Locale; direction?: LayoutDirection | "auto" }) {
  const t = T[locale];
  const id = useId();
  const [dir, setDir] = useState<LayoutDirection | "auto">(direction);
  const [text, setText] = useState<string>(t.samples[direction === "ru-en" ? "ru-en" : "en-ru"]);
  const effective = dir === "auto" ? detectDirection(text) : dir;
  const out = useMemo(() => convertLayout(text, effective), [text, effective]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label={t.dir}
          value={dir}
          onChange={setDir}
          wrap
          options={[
            { value: "auto", label: t.auto },
            { value: "en-ru", label: t["en-ru"] },
            { value: "ru-en", label: t["ru-en"] },
          ]}
        />
        {dir === "auto" && text && (
          <span className="text-sm text-fg-3">
            {t.detected}: {effective === "en-ru" ? "EN → RU" : "RU → EN"}
          </span>
        )}
      </div>
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} label={t.input} />
        <OutputPanel locale={locale} value={out} filename="fixed-layout.txt" />
      </TwoPane>
    </div>
  );
}
