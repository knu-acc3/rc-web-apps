"use client";

import { useState } from "react";
import { ArrowSquareOut, MagnifyingGlass } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

const CURATED_OUI_DATABASE: Readonly<Record<string, string>> = {
  "00:00:0C": "Cisco Systems, Inc",
  "00:05:69": "VMware, Inc.",
  "00:0C:29": "VMware, Inc.",
  "00:0C:42": "Routerboard.com",
  "00:11:32": "Synology Incorporated",
  "00:15:5D": "Microsoft Corporation",
  "00:16:3E": "Xensource, Inc.",
  "00:1A:11": "Google, Inc.",
  "00:1B:63": "Apple, Inc.",
  "00:1C:42": "Parallels, Inc.",
  "00:1C:43": "Samsung Electronics Co.,Ltd",
  "00:1D:0F": "TP-LINK TECHNOLOGIES CO.,LTD.",
  "00:25:9E": "HUAWEI TECHNOLOGIES CO.,LTD",
  "00:50:56": "VMware, Inc.",
  "00:E0:4C": "REALTEK SEMICONDUCTOR CORP.",
  "08:00:27": "PCS Systemtechnik GmbH",
  "14:CC:20": "TP-LINK TECHNOLOGIES CO.,LTD.",
  "24:0A:C4": "Espressif Inc.",
  "3C:5A:B4": "Google, Inc.",
  "B8:27:EB": "Raspberry Pi Foundation",
  "B8:69:F4": "Routerboard.com",
  "DC:A6:32": "Raspberry Pi Trading Ltd",
  "F0:18:98": "Apple, Inc.",
};

const CURATED_OUI_REVIEW_DATE = "2026-07-11";
const CURATED_OUI_COUNT = Object.keys(CURATED_OUI_DATABASE).length;

export type MacTransmission = "unicast" | "multicast";
export type MacAdministration = "universal" | "local";
export type MacVendorLookup = "matched" | "not-listed" | "local-address";

export interface MacAnalysis {
  normalized: string;
  compact: string;
  bytes: number[];
  oui: string;
  firstOctetBinary: string;
  transmission: MacTransmission;
  administration: MacAdministration;
  vendor: string | null;
  vendorLookup: MacVendorLookup;
}

export type MacInspection =
  | { valid: true; analysis: MacAnalysis }
  | { valid: false; error: "empty" | "format" };

export function normalizeMacAddress(input: string): string | null {
  const value = input.trim();
  let compact: string;

  if (/^[0-9a-f]{12}$/i.test(value)) {
    compact = value;
  } else if (/^[0-9a-f]{2}(?::[0-9a-f]{2}){5}$/i.test(value)) {
    compact = value.replaceAll(":", "");
  } else if (/^[0-9a-f]{2}(?:-[0-9a-f]{2}){5}$/i.test(value)) {
    compact = value.replaceAll("-", "");
  } else if (/^[0-9a-f]{2}(?: [0-9a-f]{2}){5}$/i.test(value)) {
    compact = value.replaceAll(" ", "");
  } else if (/^[0-9a-f]{4}(?:\.[0-9a-f]{4}){2}$/i.test(value)) {
    compact = value.replaceAll(".", "");
  } else {
    return null;
  }

  return compact.toUpperCase().match(/.{2}/g)?.join(":") ?? null;
}

export function inspectMacAddress(input: string): MacInspection {
  if (!input.trim()) return { valid: false, error: "empty" };

  const normalized = normalizeMacAddress(input);
  if (!normalized) return { valid: false, error: "format" };

  const compact = normalized.replaceAll(":", "");
  const bytes =
    compact.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? [];
  const firstOctet = bytes[0];
  const transmission: MacTransmission =
    (firstOctet & 0b00000001) === 0 ? "unicast" : "multicast";
  const administration: MacAdministration =
    (firstOctet & 0b00000010) === 0 ? "universal" : "local";
  const oui = normalized.slice(0, 8);
  const vendor =
    administration === "universal" ? (CURATED_OUI_DATABASE[oui] ?? null) : null;

  return {
    valid: true,
    analysis: {
      normalized,
      compact,
      bytes,
      oui,
      firstOctetBinary: firstOctet.toString(2).padStart(8, "0"),
      transmission,
      administration,
      vendor,
      vendorLookup:
        administration === "local"
          ? "local-address"
          : vendor
            ? "matched"
            : "not-listed",
    },
  };
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-words font-mono text-sm text-[var(--color-text)]">
        {value}
      </dd>
    </div>
  );
}

export default function MacLookup() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [result, setResult] = useState<MacInspection | null>(null);
  const analysis = result?.valid ? result.analysis : null;

  const transmissionLabel = analysis
    ? analysis.transmission === "unicast"
      ? isEn
        ? "Unicast (individual)"
        : "Unicast (индивидуальный)"
      : isEn
        ? "Multicast (group)"
        : "Multicast (групповой)"
    : "";
  const administrationLabel = analysis
    ? analysis.administration === "universal"
      ? isEn
        ? "Universally administered"
        : "Универсально назначенный"
      : isEn
        ? "Locally administered"
        : "Локально назначенный"
    : "";
  const vendorLabel = analysis
    ? (analysis.vendor ??
      (analysis.vendorLookup === "local-address"
        ? isEn
          ? "Not looked up for a locally administered address"
          : "Не определяется для локально назначенного адреса"
        : isEn
          ? "No exact match in the local curated list"
          : "Нет точного совпадения в локальном списке"))
    : "";

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn ? "Inspect a MAC address" : "Разберите MAC-адрес"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Accepts compact, colon, hyphen, dotted or space-separated notation and processes it locally."
            : "Поддерживает слитную запись, двоеточия, дефисы, точки или пробелы и обрабатывает адрес локально."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(inspectMacAddress(input));
          }}
        >
          <Label htmlFor="mac-lookup-input">
            {isEn ? "MAC address" : "MAC-адрес"}
          </Label>
          <Input
            id="mac-lookup-input"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            value={input}
            aria-invalid={result?.valid === false || undefined}
            onChange={(event) => {
              setInput(event.target.value);
              setResult(null);
            }}
            placeholder={isEn ? "MAC address" : "MAC-адрес"}
            className="mt-2 h-12 font-mono uppercase"
          />

          <ToolPrimaryAction
            type="submit"
            className="mt-4"
            leadingIcon={
              <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
            }
          >
            {isEn ? "Inspect MAC" : "Разобрать MAC"}
          </ToolPrimaryAction>
        </form>

        {result ? (
          <ToolResult
            status={result.valid ? "success" : "error"}
            title={
              result.valid
                ? isEn
                  ? "MAC address parsed"
                  : "MAC-адрес разобран"
                : isEn
                  ? "Invalid MAC address"
                  : "Некорректный MAC-адрес"
            }
            description={
              result.valid
                ? isEn
                  ? "Syntax and the two low-order address bits were interpreted locally."
                  : "Синтаксис и два младших бита адреса интерпретированы локально."
                : result.error === "empty"
                  ? isEn
                    ? "Enter a MAC address."
                    : "Введите MAC-адрес."
                  : isEn
                    ? "Use exactly 12 hexadecimal digits in one supported notation."
                    : "Используйте ровно 12 шестнадцатеричных цифр в одном поддерживаемом формате."
            }
            className="mt-5"
            data-mac-valid={String(result.valid)}
          >
            {analysis ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                <Detail
                  label={isEn ? "Normalized address" : "Нормализованный адрес"}
                  value={analysis.normalized}
                />
                <Detail label="OUI" value={analysis.oui} />
                <Detail
                  label={isEn ? "Address type" : "Тип адреса"}
                  value={transmissionLabel}
                />
                <Detail
                  label={isEn ? "Administration" : "Назначение"}
                  value={administrationLabel}
                />
                <div className="min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {isEn ? "Vendor" : "Производитель"}
                  </dt>
                  <dd className="mt-1 break-words text-sm text-[var(--color-text)]">
                    {vendorLabel}
                  </dd>
                </div>
              </dl>
            ) : null}
          </ToolResult>
        ) : null}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Bits and data coverage" : "Биты и покрытие данных"}
          description={
            isEn
              ? "How classification works and what the local vendor list covers"
              : "Как работает классификация и что покрывает локальный список"
          }
        >
          <div className="space-y-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {analysis ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3">
                <p className="font-semibold text-[var(--color-text)]">
                  {isEn ? "Current first octet" : "Текущий первый октет"}:{" "}
                  <span className="font-mono">{analysis.firstOctetBinary}</span>
                </p>
                <p className="mt-1">
                  I/G = {analysis.transmission === "unicast" ? "0" : "1"}; U/L ={" "}
                  {analysis.administration === "universal" ? "0" : "1"}.
                </p>
              </div>
            ) : null}
            <div>
              <h3 className="font-semibold text-[var(--color-text)]">
                {isEn ? "Address bits" : "Биты адреса"}
              </h3>
              <p className="mt-1">
                {isEn
                  ? "Bit 0 of the first octet is I/G: 0 means an individual (unicast) address, 1 means a group (multicast) address. Bit 1 is U/L: 0 means universally administered, 1 means locally administered."
                  : "Бит 0 первого октета — I/G: 0 означает индивидуальный (unicast), 1 — групповой (multicast) адрес. Бит 1 — U/L: 0 означает универсальное, 1 — локальное назначение."}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-text)]">
                {isEn ? "Vendor data limits" : "Ограничения данных"}
              </h3>
              <p className="mt-1">
                {isEn
                  ? `The app contains ${CURATED_OUI_COUNT} exact 24-bit prefixes, reviewed on ${CURATED_OUI_REVIEW_DATE}. This is a small curated subset, not a complete or authoritative IEEE registry. Unknown means only that the prefix is absent from this local list. No network request is made.`
                  : `В приложении хранится ${CURATED_OUI_COUNT} точных 24-битных префиксов; список проверен ${CURATED_OUI_REVIEW_DATE}. Это небольшая локальная подборка, а не полный или официальный реестр IEEE. Неизвестный производитель означает лишь отсутствие префикса в этом списке. Сетевой запрос не выполняется.`}
              </p>
              <a
                href="https://standards-oui.ieee.org/oui/oui.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                {isEn ? "IEEE public OUI listing" : "Публичный список OUI IEEE"}
                <ArrowSquareOut size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
