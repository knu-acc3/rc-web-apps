"use client";

import { Download, RefreshCw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { downloadText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { outputLabels } from "@/tools/dev/shared/labels";
import { Button } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { CopyButton } from "@/ui/copy-button";
import { Field, Select, Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { ScrollRow } from "@/ui/scroll-row";
import { SliderField } from "@/ui/slider-field";
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
    generate: "Сгенерировать",
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
    generate: "Generate",
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

  const parsedCount = Number(countText.replace(/\s/g, ""));
  const count = Math.min(10000, Math.max(1, Math.floor(parsedCount) || 1));
  const isUuid = kind !== "ulid" && kind !== "objectid";

  // Generated in the browser after mount — never on the server.
  const first = useRef({ kind: kind0, count: count0 });
  useEffect(() => {
    const timer = setTimeout(() => setIds(generate(first.current.kind, first.current.count, true)), 0);
    return () => clearTimeout(timer);
  }, []);

  const regen = (k = kind, n = count, m = monotonic) => setIds(generate(k, n, m));

  // A new count (typed or dragged) regenerates the list once the value settles.
  const lastCount = useRef(count0);
  useEffect(() => {
    if (count === lastCount.current) return;
    const timer = setTimeout(() => {
      lastCount.current = count;
      setIds(generate(kind, count, monotonic));
    }, 150);
    return () => clearTimeout(timer);
  }, [count, kind, monotonic]);

  const shown = useMemo(() => (!ids ? null : isUuid ? ids.map((u) => formatUuid(u, FORMATS[format])) : ids), [ids, isUuid, format]);

  return (
    <div className={cn("grid items-start gap-4", shown && shown.length > 1 && "xl:grid-cols-2")}>
      <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
        {kinds && kinds.length > 1 && (
          <ScrollRow label={t.kind} role="radiogroup" rowClassName="gap-2">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={k === kind}
                className="chip shrink-0"
                onClick={() => {
                  setKind(k);
                  regen(k);
                }}
              >
                {KIND_LABEL[k]}
              </button>
            ))}
          </ScrollRow>
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium text-fg-2">{label ?? KIND_LABEL[kind]}</div>
          <output key={shown?.[0]} className="mt-1 block min-h-10 font-mono text-2xl font-semibold tracking-tight break-all text-fg motion-safe:animate-[menu-in_0.25s_ease-out] sm:text-3xl" aria-live="polite">
            {shown ? shown[0] : t.waiting}
          </output>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="filled" size="lg" onClick={() => regen()}>
            <RefreshCw aria-hidden />
            {t.generate}
          </Button>
          <CopyButton value={shown?.[0] ?? ""} label={t.copy} copiedLabel={t.copied} size="md" variant="secondary" className="h-12! px-6!" />
        </div>

        <div className="grid items-end gap-x-6 gap-y-4 sm:grid-cols-2">
          <SliderField
            id={`${id}-n`}
            label={t.count}
            value={countText}
            onChange={setCountText}
            parse={(v) => {
              const n = Number(v.replace(/\s/g, ""));
              return Number.isFinite(n) && v.trim() ? n : null;
            }}
            format={(n) => String(Math.round(n))}
            min={1}
            max={10000}
            scale="log"
            inputMode="numeric"
          />
          {isUuid ? (
            <Field label={t.format} htmlFor={`${id}-f`}>
              <Select id={`${id}-f`} value={format} onChange={(e) => setFormat(e.target.value as FormatId)}>
                {(Object.keys(FORMATS) as FormatId[]).map((f) => (
                  <option key={f} value={f}>
                    {t.formats[f]}
                  </option>
                ))}
              </Select>
            </Field>
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
          minRows={Math.min(14, shown.length)}
          extraActions={
            <Button variant="text" size="sm" onClick={() => downloadText(JSON.stringify(shown, null, 2), `${kind}-${shown.length}.json`, "application/json")}>
              <Download aria-hidden />
              {t.json}
            </Button>
          }
        />
      )}
    </div>
  );
}
