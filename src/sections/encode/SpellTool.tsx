"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { KIT_T } from "@/sections/code/kit/labels";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { spell, type Spelling } from "./lib/phonetic";

const T = {
  ru: { input: "Текст для диктовки", nato: "По буквам (NATO)", russian: "По буквам" },
  en: { input: "Text to spell out", nato: "Spelled out (NATO)", russian: "Spelled out (Russian)" },
} as const;

export default function SpellTool({ locale, alphabet, sample }: { locale: Locale; alphabet: Spelling; sample: { ru: string; en: string } }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(sample[locale]);
  const out = useMemo(() => spell(text, alphabet), [text, alphabet]);
  return (
    <Panel className="p-4 sm:p-6">
      <Field label={t.input} htmlFor={`${id}-in`}>
        <Input id={`${id}-in`} size="lg" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" spellCheck={false} />
      </Field>
      <div className="mt-4 flex flex-col gap-2 rounded-[0.625rem] bg-surface-2 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium text-fg-2">{alphabet === "nato" ? t.nato : t.russian}</div>
          <output className="mt-1 block text-xl font-semibold break-words text-fg" aria-live="polite">
            {out}
          </output>
        </div>
        <CopyButton value={out} label={KIT_T[locale].copy} copiedLabel={KIT_T[locale].copied} variant="outline" className="self-start" />
      </div>
    </Panel>
  );
}
