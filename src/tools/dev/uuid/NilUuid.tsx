"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { CopyButton } from "@/ui/copy-button";
import { Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { formatUuid, MAX_UUID, NIL_UUID } from "./lib/engine";

const T = {
  ru: { nil: "Nil UUID (все биты — нули)", max: "Max UUID (все биты — единицы)", upper: "ЗАГЛАВНЫЕ буквы", braces: "В фигурных скобках", urn: "С префиксом urn:uuid:", copy: "Копировать", copied: "Скопировано" },
  en: { nil: "Nil UUID (all bits zero)", max: "Max UUID (all bits one)", upper: "UPPERCASE", braces: "Wrapped in braces", urn: "urn:uuid: prefix", copy: "Copy", copied: "Copied" },
} as const;

export default function NilUuid({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [upper, setUpper] = useState(false);
  const [braces, setBraces] = useState(false);
  const [urn, setUrn] = useState(false);
  const rows: [string, string][] = [
    [t.nil, formatUuid(NIL_UUID, { upper, braces, urn })],
    [t.max, formatUuid(MAX_UUID, { upper, braces, urn })],
  ];
  return (
    <Panel className="p-4 sm:p-6">
      <div className="flex flex-col gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-2 rounded-[1rem] bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[0.8125rem] font-medium text-fg-2">{label}</div>
              <div className="font-mono text-xl font-semibold break-all text-fg sm:text-2xl">{value}</div>
            </div>
            <CopyButton value={value} label={t.copy} copiedLabel={t.copied} size="md" className="self-start sm:self-auto" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <Switch label={t.upper} checked={upper} onChange={(e) => setUpper(e.target.checked)} />
        <Switch label={t.braces} checked={braces} disabled={urn} onChange={(e) => setBraces(e.target.checked)} />
        <Switch label={t.urn} checked={urn} onChange={(e) => setUrn(e.target.checked)} />
      </div>
    </Panel>
  );
}
