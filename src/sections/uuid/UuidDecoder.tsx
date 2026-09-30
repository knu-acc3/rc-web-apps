"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatDate, formatNumber } from "@/i18n/format";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { useHydrated } from "@/sections/code/kit/hooks";
import { Badge } from "@/ui/panel";
import { decodeId, type IdInfo } from "./engine";

const T = {
  ru: {
    input: "Идентификаторы (по одному в строке)",
    placeholder: "Вставьте UUID, ULID или ObjectId",
    value: "Значение",
    type: "Тип",
    details: "Расшифровка",
    valid: "корректный",
    invalid: "некорректный",
    version: "версия",
    variant: { ncs: "вариант NCS (устаревший)", rfc: "вариант RFC 9562", microsoft: "вариант Microsoft (устаревший)", future: "зарезервированный вариант" },
    nil: "Nil UUID — все биты нулевые",
    max: "Max UUID — все биты единичные",
    time: "Время (UTC)",
    local: "Местное время",
    clock: "clock sequence",
    node: "узел",
    randomNode: "случайный (бит multicast)",
    macNode: "похоже на MAC-адрес",
    counter: "счётчик",
    nanoid: "21 символ из алфавита NanoID — похоже на NanoID; время и другие данные в нём не хранятся",
    empty: "пустая строка",
    format: "не похоже на UUID, ULID или ObjectId",
    overflow: "первый символ ULID должен быть 0–7 (иначе время больше 2⁴⁸ мс)",
    v4: "полностью случайный (122 случайных бита)",
    v3: "из MD5 пространства имён и имени — время не хранится",
    v5: "из SHA-1 пространства имён и имени — время не хранится",
    v8: "пользовательский формат (v8) — содержимое определяет приложение",
    v2: "DCE Security (v2) — редко используется",
    unknown: "неизвестная версия",
    sub: "доли мс (×100 нс)",
  },
  en: {
    input: "IDs (one per line)",
    placeholder: "Paste a UUID, ULID or ObjectId",
    value: "Value",
    type: "Type",
    details: "Decoded",
    valid: "valid",
    invalid: "invalid",
    version: "version",
    variant: { ncs: "NCS variant (legacy)", rfc: "RFC 9562 variant", microsoft: "Microsoft variant (legacy)", future: "reserved variant" },
    nil: "Nil UUID — all bits zero",
    max: "Max UUID — all bits one",
    time: "Time (UTC)",
    local: "Local time",
    clock: "clock sequence",
    node: "node",
    randomNode: "random (multicast bit set)",
    macNode: "looks like a MAC address",
    counter: "counter",
    nanoid: "21 characters of the NanoID alphabet — likely a NanoID; it carries no time or other data",
    empty: "empty line",
    format: "doesn't look like a UUID, ULID or ObjectId",
    overflow: "a ULID must start with 0–7 (otherwise the time exceeds 2⁴⁸ ms)",
    v4: "fully random (122 random bits)",
    v3: "MD5 of namespace + name — no time stored",
    v5: "SHA-1 of namespace + name — no time stored",
    v8: "custom format (v8) — layout defined by the application",
    v2: "DCE Security (v2) — rarely used",
    unknown: "unknown version",
    sub: "sub-ms (×100 ns)",
  },
} as const;

const SAMPLE = [
  "017F22E2-79B0-7CC3-98C4-DC0C0C07398F",
  "C232AB00-9414-11EC-B3C8-9F6BDECED846",
  "2ed6657d-e927-568b-95e1-2665a8aea6a2",
  "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "507f1f77bcf86cd799439011",
].join("\n");

function typeLabel(info: IdInfo, locale: Locale): string {
  const t = T[locale];
  switch (info.type) {
    case "uuid":
      return info.special ? `${info.special === "nil" ? "Nil" : "Max"} UUID` : `UUID v${info.version}`;
    case "ulid":
      return "ULID";
    case "objectid":
      return "ObjectId";
    case "nanoid":
      return "NanoID?";
    default:
      return t.invalid;
  }
}

export default function UuidDecoder({ locale, sample = SAMPLE }: { locale: Locale; sample?: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(sample);
  const hydrated = useHydrated();
  const rows = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 500)
        .map((line) => ({ line, info: decodeId(line) })),
    [text],
  );

  const details = (info: IdInfo): string[] => {
    const out: string[] = [];
    const time = (ms: number) => {
      const d = new Date(ms);
      if (Number.isNaN(d.getTime())) return;
      out.push(`${t.time}: ${d.toISOString()}`);
      if (hydrated) out.push(`${t.local}: ${formatDate(locale, d, { dateStyle: "long", timeStyle: "medium" })}`);
    };
    if (info.type === "uuid") {
      if (info.special) return [info.special === "nil" ? t.nil : t.max];
      out.push(`${t.version} ${info.version}, ${t.variant[info.variant]}`);
      if (info.variant === "rfc") {
        if (info.version === 4) out.push(t.v4);
        else if (info.version === 3) out.push(t.v3);
        else if (info.version === 5) out.push(t.v5);
        else if (info.version === 8) out.push(t.v8);
        else if (info.version === 2) out.push(t.v2);
        else if (![1, 6, 7].includes(info.version)) out.push(t.unknown);
      }
      if (info.ms !== undefined) time(info.ms);
      if (info.subMs) out.push(`${t.sub}: ${formatNumber(locale, info.subMs)}`);
      if (info.clockSeq !== undefined) out.push(`${t.clock}: ${info.clockSeq}`);
      if (info.node) out.push(`${t.node}: ${info.node} — ${info.randomNode ? t.randomNode : t.macNode}`);
    } else if (info.type === "ulid") time(info.ms);
    else if (info.type === "objectid") {
      time(info.ms);
      out.push(`${t.counter}: ${formatNumber(locale, info.counter)}`);
    } else if (info.type === "nanoid") out.push(t.nanoid);
    else out.push(info.reason === "empty" ? t.empty : info.reason === "ulid-overflow" ? t.overflow : t.format);
    return out;
  };

  return (
    <div className="flex flex-col gap-4">
      <CodeEditor id={`${id}-in`} locale={locale} label={t.input} value={text} onChange={setText} placeholder={t.placeholder} rows={6} sample={SAMPLE} />
      {rows.length > 0 && (
        <div tabIndex={0} className="tbl" aria-live="polite">
          <table>
            <thead>
              <tr>
                <th scope="col">{t.value}</th>
                <th scope="col">{t.type}</th>
                <th scope="col">{t.details}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ line, info }, i) => (
                <tr key={i}>
                  <td className="max-w-[16rem] font-mono text-[0.8125rem] break-all">{line}</td>
                  <td className="whitespace-nowrap">
                    <Badge tone={info.type === "invalid" ? "err" : info.type === "nanoid" ? "warn" : "ok"}>{typeLabel(info, locale)}</Badge>
                  </td>
                  <td className="text-[0.8125rem]">
                    {details(info).map((d, j) => (
                      <div key={j}>{d}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
