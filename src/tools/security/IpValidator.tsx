"use client";

import { useState } from "react";
import { CheckCircle, MagnifyingGlass, XCircle } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

type IpCategory =
  | "unspecified"
  | "loopback"
  | "private"
  | "link-local"
  | "unique-local"
  | "multicast"
  | "documentation"
  | "mapped"
  | "broadcast"
  | "other";

interface ParsedIpv4 {
  version: "IPv4";
  normalized: string;
  octets: number[];
  numeric: number;
  category: IpCategory;
}

interface ParsedIpv6 {
  version: "IPv6";
  normalized: string;
  expanded: string;
  groups: number[];
  numeric: bigint;
  category: IpCategory;
  mappedIpv4: string | null;
  embeddedIpv4: string | null;
}

type ParsedIp = ParsedIpv4 | ParsedIpv6;

interface CidrDetails {
  prefix: number;
  network: string;
  lastAddress: string;
  totalAddresses: string;
}

type IpErrorCode =
  "empty" | "syntax" | "cidr-disabled" | "cidr-format" | "cidr-range";

type IpValidation =
  | {
      valid: true;
      parsed: ParsedIp;
      cidr: CidrDetails | null;
      copyValue: string;
    }
  | {
      valid: false;
      error: IpErrorCode;
      versionHint: "IPv4" | "IPv6" | null;
    };

function parseIpv4(address: string): ParsedIpv4 | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;

  const octets: number[] = [];
  for (const part of parts) {
    if (!/^(?:0|[1-9]\d{0,2})$/.test(part)) return null;
    const value = Number(part);
    if (value > 255) return null;
    octets.push(value);
  }

  const numeric = octets.reduce((total, octet) => total * 256 + octet, 0);

  return {
    version: "IPv4",
    normalized: octets.join("."),
    octets,
    numeric,
    category: ipv4Category(octets),
  };
}

function ipv4Category(octets: number[]): IpCategory {
  const [a, b, c, d] = octets;
  if (a === 0 && b === 0 && c === 0 && d === 0) return "unspecified";
  if (a === 127) return "loopback";
  if (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  ) {
    return "private";
  }
  if (a === 169 && b === 254) return "link-local";
  if (a >= 224 && a <= 239) return "multicast";
  if (
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  ) {
    return "documentation";
  }
  if (a === 255 && b === 255 && c === 255 && d === 255) {
    return "broadcast";
  }
  return "other";
}

function parseIpv6(address: string): ParsedIpv6 | null {
  let working = address.toLowerCase();
  let embeddedIpv4: string | null = null;

  if (working.includes(".")) {
    const lastColon = working.lastIndexOf(":");
    if (lastColon < 0) return null;

    const parsedIpv4 = parseIpv4(working.slice(lastColon + 1));
    if (!parsedIpv4) return null;
    embeddedIpv4 = parsedIpv4.normalized;

    const high = parsedIpv4.octets[0] * 256 + parsedIpv4.octets[1];
    const low = parsedIpv4.octets[2] * 256 + parsedIpv4.octets[3];
    working =
      working.slice(0, lastColon) +
      ":" +
      high.toString(16) +
      ":" +
      low.toString(16);
  }

  const compressionIndex = working.indexOf("::");
  if (
    compressionIndex >= 0 &&
    working.indexOf("::", compressionIndex + 2) >= 0
  ) {
    return null;
  }

  const halves = compressionIndex >= 0 ? working.split("::") : [working];
  const left = halves[0] ? halves[0].split(":") : [];
  const right = compressionIndex >= 0 && halves[1] ? halves[1].split(":") : [];
  const allParts = left.concat(right);

  if (allParts.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) {
    return null;
  }

  const parsedParts = allParts.map((part) => Number.parseInt(part, 16));
  let groups: number[];

  if (compressionIndex >= 0) {
    const missing = 8 - parsedParts.length;
    if (missing < 1) return null;
    groups = [
      ...parsedParts.slice(0, left.length),
      ...Array.from({ length: missing }, () => 0),
      ...parsedParts.slice(left.length),
    ];
  } else {
    if (parsedParts.length !== 8) return null;
    groups = parsedParts;
  }

  if (groups.length !== 8) return null;

  const mapped =
    groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;
  const mappedIpv4 = mapped
    ? [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join(
        ".",
      )
    : null;

  let numeric = 0n;
  for (const group of groups) {
    numeric = (numeric << 16n) | BigInt(group);
  }

  return {
    version: "IPv6",
    normalized: compressIpv6(groups),
    expanded: groups
      .map((group) => group.toString(16).padStart(4, "0"))
      .join(":"),
    groups,
    numeric,
    category: ipv6Category(groups, mapped),
    mappedIpv4,
    embeddedIpv4,
  };
}

function ipv6Category(groups: number[], mapped: boolean): IpCategory {
  if (mapped) return "mapped";
  if (groups.every((group) => group === 0)) return "unspecified";
  if (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1) {
    return "loopback";
  }
  if ((groups[0] & 0xffc0) === 0xfe80) return "link-local";
  if ((groups[0] & 0xfe00) === 0xfc00) return "unique-local";
  if ((groups[0] & 0xff00) === 0xff00) return "multicast";
  if (groups[0] === 0x2001 && groups[1] === 0x0db8) {
    return "documentation";
  }
  return "other";
}

function compressIpv6(groups: number[]): string {
  let bestStart = -1;
  let bestLength = 0;
  let index = 0;

  while (index < groups.length) {
    if (groups[index] !== 0) {
      index += 1;
      continue;
    }

    let end = index;
    while (end < groups.length && groups[end] === 0) end += 1;
    const length = end - index;
    if (length > bestLength) {
      bestStart = index;
      bestLength = length;
    }
    index = end;
  }

  const hex = groups.map((group) => group.toString(16));
  if (bestLength < 2) return hex.join(":");

  const left = hex.slice(0, bestStart).join(":");
  const right = hex.slice(bestStart + bestLength).join(":");
  return left + "::" + right;
}

function parseIp(address: string): ParsedIp | null {
  return address.includes(":") ? parseIpv6(address) : parseIpv4(address);
}

function numberToIpv4(value: number): string {
  return [
    Math.floor(value / 16777216) % 256,
    Math.floor(value / 65536) % 256,
    Math.floor(value / 256) % 256,
    value % 256,
  ].join(".");
}

function bigintToIpv6(value: bigint): string {
  const groups = Array.from({ length: 8 }, (_, index) => {
    const shift = BigInt((7 - index) * 16);
    return Number((value >> shift) & 0xffffn);
  });
  return compressIpv6(groups);
}

function calculateCidr(parsed: ParsedIp, prefix: number): CidrDetails {
  const bitLength = parsed.version === "IPv4" ? 32 : 128;
  const hostBits = bitLength - prefix;

  if (parsed.version === "IPv4") {
    const blockSize = 2 ** hostBits;
    const network = Math.floor(parsed.numeric / blockSize) * blockSize;
    const last = network + blockSize - 1;
    return {
      prefix,
      network: numberToIpv4(network) + "/" + prefix,
      lastAddress: numberToIpv4(last),
      totalAddresses: String(blockSize),
    };
  }

  const hostMask = hostBits === 0 ? 0n : (1n << BigInt(hostBits)) - 1n;
  const allBits = (1n << 128n) - 1n;
  const network = parsed.numeric & (allBits ^ hostMask);
  const last = network | hostMask;

  return {
    prefix,
    network: bigintToIpv6(network) + "/" + prefix,
    lastAddress: bigintToIpv6(last),
    totalAddresses: hostBits <= 52 ? String(2 ** hostBits) : "2^" + hostBits,
  };
}

function validateIp(input: string, allowCidr: boolean): IpValidation {
  const value = input.trim();
  if (!value) {
    return { valid: false, error: "empty", versionHint: null };
  }

  const parts = value.split("/");
  if (parts.length > 2 || !parts[0]) {
    return {
      valid: false,
      error: "cidr-format",
      versionHint: value.includes(":") ? "IPv6" : "IPv4",
    };
  }

  const address = parts[0];
  const prefixText = parts[1];
  const versionHint = address.includes(":") ? "IPv6" : "IPv4";

  if (prefixText !== undefined && !allowCidr) {
    return { valid: false, error: "cidr-disabled", versionHint };
  }

  const parsed = parseIp(address);
  if (!parsed) {
    return { valid: false, error: "syntax", versionHint };
  }

  if (prefixText === undefined) {
    return {
      valid: true,
      parsed,
      cidr: null,
      copyValue: parsed.normalized,
    };
  }

  if (!/^\d{1,3}$/.test(prefixText)) {
    return { valid: false, error: "cidr-format", versionHint };
  }

  const prefix = Number(prefixText);
  const maxPrefix = parsed.version === "IPv4" ? 32 : 128;
  if (prefix > maxPrefix) {
    return { valid: false, error: "cidr-range", versionHint };
  }

  return {
    valid: true,
    parsed,
    cidr: calculateCidr(parsed, prefix),
    copyValue: parsed.normalized + "/" + prefix,
  };
}

function categoryLabel(category: IpCategory, isEn: boolean): string {
  const labels: Record<IpCategory, { en: string; ru: string }> = {
    unspecified: { en: "Unspecified", ru: "Неопределённый" },
    loopback: { en: "Loopback", ru: "Loopback" },
    private: { en: "Private range", ru: "Частный диапазон" },
    "link-local": { en: "Link-local", ru: "Канальный адрес" },
    "unique-local": { en: "Unique local", ru: "Уникальный локальный" },
    multicast: { en: "Multicast", ru: "Многоадресный" },
    documentation: { en: "Documentation range", ru: "Диапазон документации" },
    mapped: { en: "IPv4-mapped IPv6", ru: "IPv4-mapped IPv6" },
    broadcast: { en: "Limited broadcast", ru: "Ограниченный broadcast" },
    other: { en: "Other range", ru: "Другой диапазон" },
  };
  return isEn ? labels[category].en : labels[category].ru;
}

function errorMessage(
  result: Extract<IpValidation, { valid: false }>,
  isEn: boolean,
): string {
  if (result.error === "empty") {
    return isEn
      ? "Enter an IPv4 or IPv6 address."
      : "Введите адрес IPv4 или IPv6.";
  }
  if (result.error === "cidr-disabled") {
    return isEn
      ? "CIDR suffix detected. Enable CIDR in Advanced or remove the suffix."
      : "Обнаружен суффикс CIDR. Включите CIDR в расширенных настройках или удалите суффикс.";
  }
  if (result.error === "cidr-format") {
    return isEn
      ? "CIDR must contain one slash followed by a decimal prefix length."
      : "CIDR должен содержать один слеш и десятичную длину префикса.";
  }
  if (result.error === "cidr-range") {
    return isEn
      ? result.versionHint + " prefix is outside the supported range."
      : "Префикс " +
          result.versionHint +
          " находится вне допустимого диапазона.";
  }
  return isEn
    ? "The address is not valid " + result.versionHint + " syntax."
    : "Адрес не соответствует синтаксису " + result.versionHint + ".";
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-all font-mono text-sm text-[var(--color-text)]">
        {value}
      </dd>
    </div>
  );
}

export default function IpValidator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [allowCidr, setAllowCidr] = useState(false);
  const [result, setResult] = useState<IpValidation | null>(null);

  return (
    <div
      data-security-tool="ip-validator"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn ? "Validate an IP address" : "Проверьте IP-адрес"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Supports canonical IPv4 and IPv6, including compressed and IPv4-mapped IPv6 forms."
            : "Поддерживает канонический IPv4 и IPv6, включая сжатую и IPv4-mapped формы IPv6."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(validateIp(input, allowCidr));
          }}
        >
          <Label htmlFor="ip-validator-input">
            {isEn ? "IPv4 or IPv6" : "IPv4 или IPv6"}
          </Label>
          <Input
            id="ip-validator-input"
            type="text"
            inputMode="text"
            autoCapitalize="none"
            spellCheck={false}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setResult(null);
            }}
            placeholder="2001:db8::1"
            className="mt-2 font-mono"
          />
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {allowCidr
              ? isEn
                ? "CIDR is enabled: append /0–32 for IPv4 or /0–128 for IPv6."
                : "CIDR включён: добавьте /0–32 для IPv4 или /0–128 для IPv6."
              : isEn
                ? "Need a CIDR prefix? Enable it in Advanced."
                : "Нужен префикс CIDR? Включите его в расширенных настройках."}
          </p>

          <ToolPrimaryAction
            type="submit"
            disabled={!input.trim()}
            className="mt-4"
            leadingIcon={<MagnifyingGlass size={20} weight="bold" />}
          >
            {isEn ? "Validate IP" : "Проверить IP"}
          </ToolPrimaryAction>
        </form>
      </section>

      {result ? (
        <section
          aria-live="polite"
          data-ip-result=""
          data-ip-valid={String(result.valid)}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          {result.valid ? (
            <>
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <CheckCircle
                    size={24}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-[var(--color-success)]"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[var(--color-success)]">
                      {isEn ? "Valid " : "Корректный "}
                      {result.parsed.version}
                    </h2>
                    <p
                      data-ip-normalized={result.copyValue}
                      className="mt-1 break-all font-mono text-sm"
                    >
                      {result.copyValue}
                    </p>
                  </div>
                </div>
                <CopyButton
                  text={result.copyValue}
                  size="medium"
                  tooltip={
                    isEn
                      ? "Copy normalized address"
                      : "Скопировать нормализованный адрес"
                  }
                  className="shrink-0"
                />
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <Detail
                  label={isEn ? "Version" : "Версия"}
                  value={result.parsed.version}
                />
                <Detail
                  label={isEn ? "Range type" : "Тип диапазона"}
                  value={categoryLabel(result.parsed.category, isEn)}
                />
                {result.parsed.version === "IPv6" ? (
                  <>
                    <Detail
                      label={isEn ? "Expanded form" : "Полная форма"}
                      value={result.parsed.expanded}
                    />
                    {result.parsed.mappedIpv4 ? (
                      <Detail
                        label="Mapped IPv4"
                        value={result.parsed.mappedIpv4}
                      />
                    ) : result.parsed.embeddedIpv4 ? (
                      <Detail
                        label={isEn ? "Embedded IPv4" : "Встроенный IPv4"}
                        value={result.parsed.embeddedIpv4}
                      />
                    ) : null}
                  </>
                ) : null}
              </dl>

              {result.cidr ? (
                <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">
                    CIDR /{result.cidr.prefix}
                  </h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Detail
                      label={isEn ? "Network" : "Сеть"}
                      value={result.cidr.network}
                    />
                    <Detail
                      label={isEn ? "Last address" : "Последний адрес"}
                      value={result.cidr.lastAddress}
                    />
                    <Detail
                      label={isEn ? "Total addresses" : "Всего адресов"}
                      value={result.cidr.totalAddresses}
                    />
                  </dl>
                </div>
              ) : null}
            </>
          ) : (
            <div role="alert" className="flex items-start gap-3">
              <XCircle
                size={24}
                weight="fill"
                className="mt-0.5 shrink-0 text-[var(--color-danger)]"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-lg font-bold text-[var(--color-danger)]">
                  {isEn ? "Invalid IP address" : "Некорректный IP-адрес"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {errorMessage(result, isEn)}
                </p>
              </div>
            </div>
          )}

          <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "This checks address syntax and numeric ranges only. It does not determine location, owner, reachability or reputation."
              : "Проверяются только синтаксис адреса и числовые диапазоны. Местоположение, владелец, доступность и репутация не определяются."}
          </p>
        </section>
      ) : null}

      <AdvancedSettings
        title={isEn ? "CIDR validation" : "Проверка CIDR"}
        description={
          isEn
            ? "Optional network prefix and calculated address range"
            : "Необязательный сетевой префикс и рассчитанный диапазон адресов"
        }
      >
        <button
          type="button"
          role="switch"
          aria-checked={allowCidr}
          onClick={() => {
            setAllowCidr((current) => !current);
            setResult(null);
          }}
          className="flex min-h-11 w-full items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-left transition-colors hover:bg-[var(--color-surface-muted)]"
        >
          <span>
            <span className="block text-sm font-semibold text-[var(--color-text)]">
              {isEn ? "Allow CIDR suffix" : "Разрешить суффикс CIDR"}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Validates the prefix and calculates the network and final address."
                : "Проверяет префикс и рассчитывает сеть и последний адрес."}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              allowCidr
                ? "bg-[var(--color-primary)]"
                : "bg-[var(--color-border-strong)]",
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
                allowCidr ? "translate-x-6" : "translate-x-1",
              )}
            />
          </span>
        </button>
      </AdvancedSettings>
    </div>
  );
}
