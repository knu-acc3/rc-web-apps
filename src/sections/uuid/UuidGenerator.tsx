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
import { Checkbox, Field, Input, Select, Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { formatUuid, ObjectIdGenerator, TimeUuidGenerator, UlidGenerator, uuidV4 } from "./engine";

export type GenKind = "v4" | "v7" | "v1" | "v6" | "ulid" | "objectid";

const T = {
  ru: {
    generate: "Сгенерировать",
    count: "Количество",
    kind: "Тип идентификатора",
    upper: "ЗАГЛАВНЫЕ буквы",
    braces: "В фигурных скобках {…}",
    dashes: "Без дефисов",
    urn: "С префиксом urn:uuid:",
    monotonic: "Монотонно в пределах миллисекунды",
    result: "Результат",
    first: "Ваш идентификатор",
    list: ["идентификатор", "идентификатора", "идентификаторов"],
    max: "не больше 10 000",
    copy: "Копировать",
    copied: "Скопировано",
    waiting: "Генерируется в браузере…",
    json: "JSON",
  },
  en: {
    generate: "Generate",
    count: "How many",
    kind: "ID type",
    upper: "UPPERCASE",
    braces: "Wrapped in braces {…}",
    dashes: "No dashes",
    urn: "urn:uuid: prefix",
    monotonic: "Monotonic within a millisecond",
    result: "Result",
    first: "Your ID",
    list: ["ID", "IDs"],
    max: "up to 10,000",
    copy: "Copy",
    copied: "Copied",
    waiting: "Generating in your browser…",
    json: "JSON",
  },
} as const;

const KIND_LABEL: Record<GenKind, string> = {
  v4: "UUID v4",
  v7: "UUID v7",
  v1: "UUID v1",
  v6: "UUID v6",
  ulid: "ULID",
  objectid: "ObjectId",
};

export interface UuidGeneratorProps {
  locale: Locale;
  kind?: GenKind;
  count?: number;
  /** Show a type selector with these kinds (bulk page). */
  kinds?: GenKind[];
  upper?: boolean;
  braces?: boolean;
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

export default function UuidGenerator({ locale, kind: kind0 = "v4", count: count0 = 1, kinds, upper: upper0 = false, braces: braces0 = false }: UuidGeneratorProps) {
  const t = T[locale];
  const id = useId();
  const [kind, setKind] = useState<GenKind>(kind0);
  const [countText, setCountText] = useState(String(count0));
  const [upper, setUpper] = useState(upper0);
  const [braces, setBraces] = useState(braces0);
  const [noDashes, setNoDashes] = useState(false);
  const [urn, setUrn] = useState(false);
  const [monotonic, setMonotonic] = useState(true);
  const [ids, setIds] = useState<string[] | null>(null);

  const count = Math.min(10000, Math.max(1, Math.floor(Number(countText.replace(/\s/g, "")) || 1)));
  const isUuid = kind !== "ulid" && kind !== "objectid";

  // First generation happens in the browser after mount (never on the server).
  const first = useRef({ kind: kind0, count: count0 });
  useEffect(() => {
    const timer = setTimeout(() => setIds(generate(first.current.kind, first.current.count, true)), 0);
    return () => clearTimeout(timer);
  }, []);

  const regen = (k = kind, n = count, m = monotonic) => setIds(generate(k, n, m));

  const shown = useMemo(() => {
    if (!ids) return null;
    if (!isUuid) return ids;
    return ids.map((u) => formatUuid(u, { upper, braces, dashes: !noDashes, urn }));
  }, [ids, isUuid, upper, braces, noDashes, urn]);

  const text = shown ? shown.join("\n") : "";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 rounded-[10px] bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-fg-2">{t.first}</div>
            <output className="block min-h-8 font-mono text-lg font-semibold break-all text-fg sm:text-xl" aria-live="polite">
              {shown ? shown[0] : <span className="text-base font-normal text-fg-3">{t.waiting}</span>}
            </output>
          </div>
          <div className="flex shrink-0 gap-2">
            <CopyButton value={shown?.[0] ?? ""} label={t.copy} copiedLabel={t.copied} />
            <Button variant="primary" size="sm" onClick={() => regen()}>
              <RefreshCw aria-hidden />
              {t.generate}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kinds && kinds.length > 1 && (
            <Field label={t.kind} htmlFor={`${id}-k`}>
              <Select
                id={`${id}-k`}
                value={kind}
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
            </Field>
          )}
          <Field label={t.count} htmlFor={`${id}-n`} hint={t.max}>
            <Input
              id={`${id}-n`}
              inputMode="numeric"
              value={countText}
              onChange={(e) => setCountText(e.target.value)}
              onBlur={() => {
                setCountText(String(count));
                regen(kind, count);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCountText(String(count));
                  regen(kind, count);
                }
              }}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {isUuid ? (
            <>
              <Checkbox label={t.upper} checked={upper} onChange={(e) => setUpper(e.target.checked)} />
              <Checkbox label={t.braces} checked={braces} disabled={urn} onChange={(e) => setBraces(e.target.checked)} />
              <Checkbox label={t.dashes} checked={noDashes} onChange={(e) => setNoDashes(e.target.checked)} />
              <Checkbox label={t.urn} checked={urn} onChange={(e) => setUrn(e.target.checked)} />
            </>
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
          value={text}
          title={`${formatNumber(locale, shown.length)} ${plural(locale, shown.length, t.list)}`}
          filename={`${kind}-${shown.length}.txt`}
          labels={outputLabels(locale)}
          minRows={Math.min(14, shown.length)}
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
