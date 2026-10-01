"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { downloadText } from "@/lib/clipboard";
import { outputLabels } from "@/sections/code/kit/labels";
import { Button } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { CopyButton } from "@/ui/copy-button";
import { Input, Select, Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { formatUuid, ObjectIdGenerator, TimeUuidGenerator, UlidGenerator, uuidV4, type UuidFormat } from "./lib/engine";

export type GenKind = "v4" | "v7" | "v1" | "v6" | "ulid" | "objectid";
export type FormatId = "std" | "upper" | "braces" | "braces-upper" | "nodash" | "urn";

const FORMATS: Record<FormatId, UuidFormat> = {
  std: {},
  upper: { upper: true },
  braces: { braces: true },
  "braces-upper": { braces: true, upper: true },
  nodash: { dashes: false },
  urn: { urn: true },
};

const T = {
  ru: {
    generate: "Новый",
    count: "Количество",
    kind: "Тип",
    format: "Формат",
    formats: { std: "xxxxxxxx-xxxx-…", upper: "ЗАГЛАВНЫЕ", braces: "{в скобках}", "braces-upper": "{ЗАГЛАВНЫЕ В СКОБКАХ}", nodash: "без дефисов", urn: "urn:uuid:…" },
    monotonic: "Монотонно",
    list: ["идентификатор", "идентификатора", "идентификаторов"],
    copy: "Копировать",
    copied: "Скопировано",
    waiting: "…",
    json: "JSON",
  },
  en: {
    generate: "New",
    count: "Count",
    kind: "Type",
    format: "Format",
    formats: { std: "xxxxxxxx-xxxx-…", upper: "UPPERCASE", braces: "{braces}", "braces-upper": "{UPPERCASE BRACES}", nodash: "no dashes", urn: "urn:uuid:…" },
    monotonic: "Monotonic",
    list: ["ID", "IDs"],
    copy: "Copy",
    copied: "Copied",
    waiting: "…",
    json: "JSON",
  },
} as const;

const KIND_LABEL: Record<GenKind, string> = { v4: "UUID v4", v7: "UUID v7", v1: "UUID v1", v6: "UUID v6", ulid: "ULID", objectid: "ObjectId" };

export interface UuidGeneratorProps {
  locale: Locale;
  kind?: GenKind;
  count?: number;
  /** Show a type selector with these kinds (bulk page). */
  kinds?: GenKind[];
  format?: FormatId;
  /** Label above the main value */
  label?: string;
}

function generate(kind: GenKind, count: number, monotonic: boolean): string[] {
  const out: string[] = new Array(count);
  const now = Date.now();
  if (kind === "v4") for (let i = 0; i < count; i++) out[i] = uuidV4();
  else if (kind === "ulid") {
    const g = new UlidGenerator();
    for (let i = 0; i < count; i++) out[i] = g.next(now, monotonic);
  } else if (kind === "objectid") {
    const g = new ObjectIdGenerator();
    for (let i = 0; i < count; i++) out[i] = g.next(now);
  } else {
    const g = new TimeUuidGenerator();
    for (let i = 0; i < count; i++) out[i] = kind === "v7" ? g.v7(now) : kind === "v6" ? g.v6(now) : g.v1(now);
  }
  return out;
}

export default function UuidGenerator({ locale, kind: kind0 = "v4", count: count0 = 1, kinds, format: format0 = "std", label }: UuidGeneratorProps) {
  const t = T[locale];
  const id = useId();
  const [kind, setKind] = useState<GenKind>(kind0);
  const [countText, setCountText] = useState(String(count0));
  const [format, setFormat] = useState<FormatId>(format0);
  const [monotonic, setMonotonic] = useState(true);
  const [ids, setIds] = useState<string[] | null>(null);

  const count = Math.min(10000, Math.max(1, Math.floor(Number(countText.replace(/\s/g, "")) || 1)));
  const isUuid = kind !== "ulid" && kind !== "objectid";

  // Generated in the browser after mount — never on the server.
  const first = useRef({ kind: kind0, count: count0 });
  useEffect(() => {
    const timer = setTimeout(() => setIds(generate(first.current.kind, first.current.count, true)), 0);
    return () => clearTimeout(timer);
  }, []);

  const regen = (k = kind, n = count, m = monotonic) => setIds(generate(k, n, m));
  const commitCount = () => {
    setCountText(String(count));
    regen(kind, count);
  };

  const shown = useMemo(() => (!ids ? null : isUuid ? ids.map((u) => formatUuid(u, FORMATS[format])) : ids), [ids, isUuid, format]);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-6">
        <div className="text-sm font-medium text-fg-2">{label ?? KIND_LABEL[kind]}</div>
        <output className="mt-1 block min-h-9 font-mono text-xl font-semibold tracking-tight break-all text-fg sm:text-[1.625rem]" aria-live="polite">
          {shown ? shown[0] : t.waiting}
        </output>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={() => regen()}>
            <RefreshCw aria-hidden />
            {t.generate}
          </Button>
          <CopyButton value={shown?.[0] ?? ""} label={t.copy} copiedLabel={t.copied} size="md" variant="outline" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-4 text-sm text-fg-2">
          {kinds && kinds.length > 1 && (
            <label className="flex items-center gap-2">
              {t.kind}
              <Select
                value={kind}
                size="sm"
                className="w-36"
                onChange={(e) => {
                  const k = e.target.value as GenKind;
                  setKind(k);
                  regen(k);
                }}
              >
                {kinds.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <label className="flex items-center gap-2" htmlFor={`${id}-n`}>
            {t.count}
            <Input
              id={`${id}-n`}
              size="sm"
              inputMode="numeric"
              className="w-24"
              value={countText}
              onChange={(e) => setCountText(e.target.value)}
              onBlur={commitCount}
              onKeyDown={(e) => e.key === "Enter" && commitCount()}
            />
          </label>
          {isUuid ? (
            <label className="flex items-center gap-2">
              {t.format}
              <Select value={format} size="sm" className="w-52" onChange={(e) => setFormat(e.target.value as FormatId)}>
                {(Object.keys(FORMATS) as FormatId[]).map((f) => (
                  <option key={f} value={f}>
                    {t.formats[f]}
                  </option>
                ))}
              </Select>
            </label>
          ) : kind === "ulid" ? (
            <Switch
              label={t.monotonic}
              checked={monotonic}
              onChange={(e) => {
                setMonotonic(e.target.checked);
                regen(kind, count, e.target.checked);
              }}
            />
          ) : null}
        </div>
      </Panel>

      {shown && shown.length > 1 && (
        <CodeOutput
          value={shown.join("\n")}
          title={`${formatNumber(locale, shown.length)} ${plural(locale, shown.length, t.list)}`}
          filename={`${kind}-${shown.length}.txt`}
          labels={outputLabels(locale)}
          minRows={Math.min(12, shown.length)}
          extraActions={
            <Button variant="ghost" size="sm" onClick={() => downloadText(JSON.stringify(shown, null, 2), `${kind}-${shown.length}.json`, "application/json")}>
              {t.json}
            </Button>
          }
        />
      )}
    </div>
  );
}
