"use client";

import { useState, type FormEvent } from "react";
import { Network } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

export const IPV4_UINT32_MAX = 0xffff_ffffn;

export type Ipv4Classification =
  "private" | "link-local" | "loopback" | "other";

export type Ipv4UsageMode = "traditional" | "point-to-point" | "single-host";

export interface ParsedIpv4 {
  address: string;
  octets: readonly [number, number, number, number];
  value: bigint;
}

export interface ParsedIpv4Cidr extends ParsedIpv4 {
  prefix: number;
  normalizedCidr: string;
}

export interface Ipv4CidrCalculation {
  address: string;
  normalizedCidr: string;
  prefix: number;
  classification: Ipv4Classification;
  usageMode: Ipv4UsageMode;
  mask: string;
  network: string;
  broadcast: string;
  usableStart: string;
  usableEnd: string;
  totalAddresses: bigint;
  usableCount: bigint;
  addressValue: bigint;
  maskValue: bigint;
  networkValue: bigint;
  broadcastValue: bigint;
  addressBinary: string;
  maskBinary: string;
  networkBinary: string;
  broadcastBinary: string;
}

export function parseStrictIpv4(input: string): ParsedIpv4 | null {
  const normalized = input.trim();
  const parts = normalized.split(".");
  if (parts.length !== 4) return null;

  const octets: number[] = [];
  for (const part of parts) {
    if (!/^(?:0|[1-9]\d{0,2})$/.test(part)) return null;
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
    octets.push(octet);
  }

  const tuple = octets as [number, number, number, number];
  const value = tuple.reduce(
    (result, octet) => (result << 8n) | BigInt(octet),
    0n,
  );
  const address = tuple.join(".");
  return { address, octets: tuple, value };
}

export function parseStrictIpv4Cidr(input: string): ParsedIpv4Cidr | null {
  const normalized = input.trim();
  const match = normalized.match(/^(.+)\/(0|[1-9]|[12]\d|3[0-2])$/);
  if (!match) return null;
  if (match[1] !== match[1].trim()) return null;

  const parsedAddress = parseStrictIpv4(match[1]);
  if (!parsedAddress) return null;

  const prefix = Number(match[2]);
  return {
    ...parsedAddress,
    prefix,
    normalizedCidr: `${parsedAddress.address}/${prefix}`,
  };
}

export function ipv4Uint32ToString(value: bigint): string {
  if (value < 0n || value > IPV4_UINT32_MAX) {
    throw new RangeError("IPv4 value must be an unsigned 32-bit integer.");
  }

  return [24n, 16n, 8n, 0n]
    .map((shift) => Number((value >> shift) & 0xffn))
    .join(".");
}

export function ipv4MaskFromPrefix(prefix: number): bigint {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new RangeError("IPv4 prefix must be a whole number from 0 to 32.");
  }
  if (prefix === 0) return 0n;

  const hostBits = BigInt(32 - prefix);
  return (IPV4_UINT32_MAX << hostBits) & IPV4_UINT32_MAX;
}

export function ipv4Uint32ToBinary(value: bigint): string {
  if (value < 0n || value > IPV4_UINT32_MAX) {
    throw new RangeError("IPv4 value must be an unsigned 32-bit integer.");
  }

  return value.toString(2).padStart(32, "0").match(/.{8}/g)!.join(".");
}

export function classifyIpv4(value: bigint): Ipv4Classification {
  if (value < 0n || value > IPV4_UINT32_MAX) {
    throw new RangeError("IPv4 value must be an unsigned 32-bit integer.");
  }

  const first = Number((value >> 24n) & 0xffn);
  const second = Number((value >> 16n) & 0xffn);

  if (first === 127) return "loopback";
  if (first === 169 && second === 254) return "link-local";
  if (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  ) {
    return "private";
  }
  return "other";
}

export function calculateIpv4Cidr(parsed: ParsedIpv4Cidr): Ipv4CidrCalculation {
  const maskValue = ipv4MaskFromPrefix(parsed.prefix);
  const wildcardValue = IPV4_UINT32_MAX ^ maskValue;
  const networkValue = parsed.value & maskValue;
  const broadcastValue = networkValue | wildcardValue;
  const totalAddresses = 1n << BigInt(32 - parsed.prefix);

  let usageMode: Ipv4UsageMode;
  let usableStartValue: bigint;
  let usableEndValue: bigint;
  let usableCount: bigint;

  if (parsed.prefix === 32) {
    usageMode = "single-host";
    usableStartValue = parsed.value;
    usableEndValue = parsed.value;
    usableCount = 1n;
  } else if (parsed.prefix === 31) {
    usageMode = "point-to-point";
    usableStartValue = networkValue;
    usableEndValue = broadcastValue;
    usableCount = 2n;
  } else {
    usageMode = "traditional";
    usableStartValue = networkValue + 1n;
    usableEndValue = broadcastValue - 1n;
    usableCount = totalAddresses - 2n;
  }

  return {
    address: parsed.address,
    normalizedCidr: parsed.normalizedCidr,
    prefix: parsed.prefix,
    classification: classifyIpv4(parsed.value),
    usageMode,
    mask: ipv4Uint32ToString(maskValue),
    network: ipv4Uint32ToString(networkValue),
    broadcast: ipv4Uint32ToString(broadcastValue),
    usableStart: ipv4Uint32ToString(usableStartValue),
    usableEnd: ipv4Uint32ToString(usableEndValue),
    totalAddresses,
    usableCount,
    addressValue: parsed.value,
    maskValue,
    networkValue,
    broadcastValue,
    addressBinary: ipv4Uint32ToBinary(parsed.value),
    maskBinary: ipv4Uint32ToBinary(maskValue),
    networkBinary: ipv4Uint32ToBinary(networkValue),
    broadcastBinary: ipv4Uint32ToBinary(broadcastValue),
  };
}

function formatBigInt(value: bigint, isEn: boolean): string {
  return value.toLocaleString(isEn ? "en-US" : "ru-RU");
}

function classificationLabel(
  classification: Ipv4Classification,
  isEn: boolean,
): string {
  const labels: Record<Ipv4Classification, readonly [string, string]> = {
    private: ["Private (RFC 1918)", "Частный (RFC 1918)"],
    "link-local": ["Link-local", "Локальный для канала"],
    loopback: ["Loopback", "Loopback"],
    other: ["Other IPv4", "Другой IPv4"],
  };
  return labels[classification][isEn ? 0 : 1];
}

function usageDescription(mode: Ipv4UsageMode, isEn: boolean): string {
  if (mode === "point-to-point") {
    return isEn
      ? "RFC 3021 point-to-point subnet: both addresses are endpoints."
      : "Point-to-point подсеть RFC 3021: оба адреса являются конечными точками.";
  }
  if (mode === "single-host") {
    return isEn
      ? "A /32 identifies one host address."
      : "Префикс /32 определяет один адрес хоста.";
  }
  return isEn
    ? "The conventional usable range excludes the network and broadcast addresses."
    : "Обычный доступный диапазон не включает адрес сети и broadcast.";
}

function ResultValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]/40 p-3.5">
      <dt className="text-xs font-semibold text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1.5 break-all font-mono text-sm font-bold tabular-nums text-[var(--color-text)]">
        {value}
      </dd>
    </div>
  );
}

function RawValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-[var(--color-border-subtle)] py-2.5 last:border-b-0">
      <dt className="text-xs font-semibold text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-all font-mono text-xs tabular-nums text-[var(--color-text)] sm:text-sm">
        {value}
      </dd>
    </div>
  );
}

export default function IpCalculator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Ipv4CidrCalculation | null>(null);
  const [error, setError] = useState("");

  const calculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) {
      setResult(null);
      setError(
        isEn
          ? "Enter an IPv4 address and CIDR prefix."
          : "Введите IPv4-адрес и префикс CIDR.",
      );
      return;
    }

    const parsed = parseStrictIpv4Cidr(input);
    if (!parsed) {
      setResult(null);
      setError(
        isEn
          ? "Use four decimal octets from 0 to 255 and a prefix from 0 to 32. Multi-digit values cannot start with zero."
          : "Используйте четыре десятичных октета от 0 до 255 и префикс от 0 до 32. Многозначные числа не могут начинаться с нуля.",
      );
      return;
    }

    setResult(calculateIpv4Cidr(parsed));
    setError("");
  };

  const rangeLabel = result
    ? result.usageMode === "point-to-point"
      ? isEn
        ? "RFC 3021 endpoints"
        : "Конечные точки RFC 3021"
      : result.usageMode === "single-host"
        ? isEn
          ? "Host"
          : "Хост"
        : isEn
          ? "Usable range"
          : "Доступный диапазон"
    : "";

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <form onSubmit={calculate} noValidate>
          <div className="max-w-lg">
            <Label htmlFor="ip-calculator-cidr">IPv4/CIDR</Label>
            <Input
              id="ip-calculator-cidr"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              value={input}
              placeholder="IPv4/CIDR"
              aria-invalid={Boolean(error)}
              aria-describedby="ip-calculator-hint"
              onChange={(event) => {
                setInput(event.target.value);
                setResult(null);
                setError("");
              }}
              className="mt-1.5 h-12 font-mono text-base"
            />
            <p
              id="ip-calculator-hint"
              className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]"
            >
              {isEn
                ? "Exactly four decimal octets and one prefix from 0 to 32. Leading-zero and partial forms are rejected."
                : "Ровно четыре десятичных октета и один префикс от 0 до 32. Формы с ведущими нулями и частичный ввод отклоняются."}
            </p>
          </div>

          <ToolPrimaryAction
            type="submit"
            className="mt-5"
            leadingIcon={<Network size={20} weight="bold" aria-hidden="true" />}
          >
            {isEn ? "Calculate network" : "Рассчитать сеть"}
          </ToolPrimaryAction>

          {error ? (
            <ToolResult
              status="error"
              title={isEn ? "Check IPv4/CIDR" : "Проверьте IPv4/CIDR"}
              description={error}
              className="mt-5"
            />
          ) : null}

          {result ? (
            <ToolResult
              status="success"
              title={result.normalizedCidr}
              description={usageDescription(result.usageMode, isEn)}
              className="mt-5"
            >
              <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
                <ResultValue
                  label={
                    isEn ? "Normalized IP/CIDR" : "Нормализованный IP/CIDR"
                  }
                  value={result.normalizedCidr}
                />
                <ResultValue
                  label={isEn ? "Subnet mask" : "Маска подсети"}
                  value={result.mask}
                />
                <ResultValue
                  label={isEn ? "Network" : "Сеть"}
                  value={result.network}
                />
                <ResultValue label="Broadcast" value={result.broadcast} />
                <ResultValue
                  label={isEn ? "Total addresses" : "Всего адресов"}
                  value={formatBigInt(result.totalAddresses, isEn)}
                />
                <ResultValue
                  label={
                    result.usageMode === "point-to-point"
                      ? isEn
                        ? "Endpoint count"
                        : "Количество точек"
                      : isEn
                        ? "Usable count"
                        : "Доступно адресов"
                  }
                  value={formatBigInt(result.usableCount, isEn)}
                />
                <ResultValue
                  label={rangeLabel}
                  value={
                    result.usableStart === result.usableEnd
                      ? result.usableStart
                      : `${result.usableStart} – ${result.usableEnd}`
                  }
                />
                <ResultValue
                  label={isEn ? "Classification" : "Классификация"}
                  value={classificationLabel(result.classification, isEn)}
                />
              </dl>
            </ToolResult>
          ) : null}

          <AdvancedSettings
            className="mt-5"
            title={isEn ? "Advanced details" : "Расширенные сведения"}
            description={
              isEn
                ? "Raw unsigned values, binary form and special-prefix rules"
                : "Беззнаковые числа, двоичный вид и правила специальных префиксов"
            }
          >
            {result ? (
              <div className="grid min-w-0 gap-x-5 sm:grid-cols-2">
                <dl className="min-w-0">
                  <RawValue
                    label={isEn ? "IP as uint32" : "IP как uint32"}
                    value={result.addressValue.toString()}
                  />
                  <RawValue
                    label={isEn ? "Mask as uint32" : "Маска как uint32"}
                    value={result.maskValue.toString()}
                  />
                  <RawValue
                    label={isEn ? "Network as uint32" : "Сеть как uint32"}
                    value={result.networkValue.toString()}
                  />
                  <RawValue
                    label={
                      isEn ? "Broadcast as uint32" : "Broadcast как uint32"
                    }
                    value={result.broadcastValue.toString()}
                  />
                </dl>
                <dl className="min-w-0">
                  <RawValue
                    label={isEn ? "IP binary" : "IP двоичный"}
                    value={result.addressBinary}
                  />
                  <RawValue
                    label={isEn ? "Mask binary" : "Маска двоичная"}
                    value={result.maskBinary}
                  />
                  <RawValue
                    label={isEn ? "Network binary" : "Сеть двоичная"}
                    value={result.networkBinary}
                  />
                  <RawValue
                    label={isEn ? "Broadcast binary" : "Broadcast двоичный"}
                    value={result.broadcastBinary}
                  />
                </dl>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                {isEn
                  ? "Calculate a network to see its unsigned 32-bit and binary values."
                  : "Рассчитайте сеть, чтобы увидеть её беззнаковые 32-битные и двоичные значения."}
              </p>
            )}

            <div className="mt-4 space-y-2 border-t border-[var(--color-border-subtle)] pt-4 text-sm leading-6 text-[var(--color-text-muted)]">
              <p>
                {isEn
                  ? "/31 follows RFC 3021 for point-to-point links: both addresses are endpoints, not a traditional host range."
                  : "/31 следует RFC 3021 для point-to-point соединений: оба адреса являются конечными точками, а не обычным диапазоном хостов."}
              </p>
              <p>
                {isEn
                  ? "/32 represents one host address; its network and broadcast values are identical to that address."
                  : "/32 представляет один адрес хоста; значения сети и broadcast совпадают с этим адресом."}
              </p>
            </div>
          </AdvancedSettings>
        </form>
      </section>
    </div>
  );
}
