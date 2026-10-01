"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { KIT_T } from "@/tools/dev/shared/labels";
import { Pane } from "@/tools/dev/shared/Pane";
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
      <Pane className="mt-4" title={alphabet === "nato" ? t.nato : t.russian} actions={<CopyButton value={out} label={KIT_T[locale].copy} copiedLabel={KIT_T[locale].copied} variant="secondary" compact />}>
        <output className="block min-h-16 px-4 py-3 text-xl leading-relaxed font-semibold break-words text-fg sm:text-2xl" aria-live="polite">
          {out}
        </output>
      </Pane>
    </Panel>
  );
}
