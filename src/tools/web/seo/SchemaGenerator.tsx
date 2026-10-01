"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { buildSchema, missing, SCHEMA_TYPES, scriptTag, type SchemaType } from "./lib/jsonld";
import { SCHEMA_FIELDS, SCHEMA_NAME } from "./content/schema-fields";
import { FieldGrid, Issues, More, Output, Split, type Fields } from "./ui/kit";
import { ChipChoice } from "@/ui/chip-choice";

const T = {
  ru: {
    type: "Тип разметки",
    more: "Дополнительные поля",
    out: "JSON-LD для вставки в <head> или <body>",
    missing: (f: string) => `Для расширенного результата Google нужно заполнить: ${f}`,
    or: " или ",
    ok: "Обязательные поля заполнены. Проверьте разметку в Rich Results Test от Google перед публикацией.",
  },
  en: {
    type: "Markup type",
    more: "More fields",
    out: "JSON-LD for <head> or <body>",
    missing: (f: string) => `Google requires these for a rich result: ${f}`,
    or: " or ",
    ok: "Required fields are filled in. Validate the markup in Google's Rich Results Test before publishing.",
  },
} as const;

/** Local UTC offset like "+05:00" for event and article dates. */
function localOffset(): string {
  const m = -new Date().getTimezoneOffset();
  const s = m >= 0 ? "+" : "-";
  const a = Math.abs(m);
  return `${s}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

export default function SchemaGenerator({ locale, type: initial = "article" }: { locale: Locale; type?: SchemaType }) {
  const t = T[locale];
  const id = useId();
  const [type, setType] = useState<SchemaType>(initial);
  const [all, setAll] = useState<Partial<Record<SchemaType, Fields>>>({});
  const f = all[type] ?? {};
  const set = (k: string, v: string) => setAll((o) => ({ ...o, [type]: { ...(o[type] ?? {}), [k]: v } }));

  const specs = SCHEMA_FIELDS[type];
  const labelOf = (k: string) => specs.find((s) => s.key === k)?.label[locale].replace(/\s*[—(].*$/, "") ?? k;
  const miss = missing(type, f);
  const touched = Object.values(f).some((x) => x.trim());
  const code = touched ? scriptTag(buildSchema(type, f, typeof window === "undefined" ? "+00:00" : localOffset())) : "";

  return (
    <div className="flex flex-col gap-4">
      <ChipChoice label={t.type} value={type} onChange={setType} options={SCHEMA_TYPES.map((s) => ({ value: s, label: SCHEMA_NAME[s][locale] }))} />
      <Split
        input={
          <>
            <FieldGrid specs={specs.filter((s) => !s.more)} f={f} set={set} locale={locale} id={`${id}-${type}`} />
            {specs.some((s) => s.more) && (
              <More label={t.more}>
                <FieldGrid specs={specs.filter((s) => s.more)} f={f} set={set} locale={locale} id={`${id}-${type}-m`} />
              </More>
            )}
          </>
        }
      >
        <div aria-live="polite">{touched && (miss.length ? <Issues items={[t.missing(miss.map((alts) => alts.map(labelOf).join(t.or)).join(", "))]} /> : <Issues tone="ok" items={[t.ok]} />)}</div>
        <Output locale={locale} value={code} title={t.out} rows={18} />
      </Split>
    </div>
  );
}
