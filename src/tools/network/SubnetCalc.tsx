"use client";

import { useState, type FormEvent } from "react";
import { Calculator } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

export const SUBNET_MAX_USABLE_HOSTS = 4_294_967_294n;
export const SUBNET_IPV4_MAX_VALUE = 0xffff_ffffn;

export interface ParsedSubnetIpv4 {
  address: string;
  value: bigint;
}

export interface TraditionalSubnetCalculation {
  requiredUsableHosts: bigint;
  prefix: number;
  mask: string;
  totalAddresses: bigint;
  usableCapacity: bigint;
  startingAddress: string | null;
  isStartAligned: boolean | null;
  network: string | null;
  broadcast: string | null;
  firstHost: string | null;
  lastHost: string | null;
}

type SubnetErrorField = "hosts" | "start";

interface SubnetValidationError {
  field: SubnetErrorField;
  message: string;
}

export function parseRequiredUsableHosts(input: string): bigint | null {
  const normalized = input.trim();
  if (normalized.length > 10) return null;
  if (!/^[1-9]\d*$/.test(normalized)) return null;

  const value = BigInt(normalized);
  if (value < 1n || value > SUBNET_MAX_USABLE_HOSTS) return null;
  return value;
}

export function parseStrictSubnetIpv4(input: string): ParsedSubnetIpv4 | null {
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

  let value = 0n;
  for (const octet of octets) {
    value = (value << 8n) | BigInt(octet);
  }
  return { address: octets.join("."), value };
}

export function subnetUint32ToIpv4(value: bigint): string {
  if (value < 0n || value > SUBNET_IPV4_MAX_VALUE) {
    throw new RangeError("IPv4 value must be an unsigned 32-bit integer.");
  }

  return [24n, 16n, 8n, 0n]
    .map((shift) => Number((value >> shift) & 0xffn))
    .join(".");
}

export function traditionalSubnetMask(prefix: number): bigint {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 30) {
    throw new RangeError("Traditional subnet prefix must be from 0 to 30.");
  }
  if (prefix === 0) return 0n;

  return (SUBNET_IPV4_MAX_VALUE << BigInt(32 - prefix)) & SUBNET_IPV4_MAX_VALUE;
}

export function calculateSmallestTraditionalSubnet(
  requiredUsableHosts: bigint,
  startingIpv4: string | null = null,
): TraditionalSubnetCalculation {
  if (
    requiredUsableHosts < 1n ||
    requiredUsableHosts > SUBNET_MAX_USABLE_HOSTS
  ) {
    throw new RangeError(
      "Required hosts are outside the supported IPv4 range.",
    );
  }

  let hostBits = 2;
  while (hostBits < 32 && (1n << BigInt(hostBits)) - 2n < requiredUsableHosts) {
    hostBits += 1;
  }

  const prefix = 32 - hostBits;
  const totalAddresses = 1n << BigInt(hostBits);
  const usableCapacity = totalAddresses - 2n;
  const maskValue = traditionalSubnetMask(prefix);
  const normalizedStart = startingIpv4?.trim() ?? "";

  if (!normalizedStart) {
    return {
      requiredUsableHosts,
      prefix,
      mask: subnetUint32ToIpv4(maskValue),
      totalAddresses,
      usableCapacity,
      startingAddress: null,
      isStartAligned: null,
      network: null,
      broadcast: null,
      firstHost: null,
      lastHost: null,
    };
  }

  const parsedStart = parseStrictSubnetIpv4(normalizedStart);
  if (!parsedStart) {
    throw new RangeError("Starting IPv4 address is invalid.");
  }

  const networkValue = parsedStart.value & maskValue;
  const broadcastValue = networkValue + totalAddresses - 1n;

  return {
    requiredUsableHosts,
    prefix,
    mask: subnetUint32ToIpv4(maskValue),
    totalAddresses,
    usableCapacity,
    startingAddress: parsedStart.address,
    isStartAligned: parsedStart.value === networkValue,
    network: subnetUint32ToIpv4(networkValue),
    broadcast: subnetUint32ToIpv4(broadcastValue),
    firstHost: subnetUint32ToIpv4(networkValue + 1n),
    lastHost: subnetUint32ToIpv4(broadcastValue - 1n),
  };
}

function formatBigInt(value: bigint, isEn: boolean): string {
  return value.toLocaleString(isEn ? "en-US" : "ru-RU");
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

export default function SubnetCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [hostsInput, setHostsInput] = useState("");
  const [startingIpv4, setStartingIpv4] = useState("");
  const [result, setResult] = useState<TraditionalSubnetCalculation | null>(
    null,
  );
  const [validationError, setValidationError] =
    useState<SubnetValidationError | null>(null);

  const clearResult = () => {
    setResult(null);
    setValidationError(null);
  };

  const calculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hostsInput.trim()) {
      setResult(null);
      setValidationError({
        field: "hosts",
        message: isEn
          ? "Enter the required number of usable hosts."
          : "Укажите необходимое количество доступных хостов.",
      });
      return;
    }

    const requiredHosts = parseRequiredUsableHosts(hostsInput);
    if (requiredHosts === null) {
      setResult(null);
      setValidationError({
        field: "hosts",
        message: isEn
          ? "Enter a whole number from 1 to 4,294,967,294 without separators or leading zeros."
          : "Введите целое число от 1 до 4 294 967 294 без разделителей и ведущих нулей.",
      });
      return;
    }

    const normalizedStart = startingIpv4.trim();
    if (normalizedStart && !parseStrictSubnetIpv4(normalizedStart)) {
      setResult(null);
      setValidationError({
        field: "start",
        message: isEn
          ? "Enter exactly four decimal octets from 0 to 255 without leading zeros."
          : "Введите ровно четыре десятичных октета от 0 до 255 без ведущих нулей.",
      });
      return;
    }

    setResult(
      calculateSmallestTraditionalSubnet(
        requiredHosts,
        normalizedStart || null,
      ),
    );
    setValidationError(null);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <form onSubmit={calculate} noValidate>
          <div className="max-w-md">
            <Label htmlFor="subnet-required-hosts">
              {isEn ? "Required usable hosts" : "Необходимое количество хостов"}
            </Label>
            <Input
              id="subnet-required-hosts"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              spellCheck={false}
              value={hostsInput}
              aria-invalid={validationError?.field === "hosts"}
              aria-describedby="subnet-required-hosts-hint"
              onChange={(event) => {
                setHostsInput(event.target.value);
                clearResult();
              }}
              className="mt-1.5 h-12 font-mono text-base tabular-nums"
            />
            <p
              id="subnet-required-hosts-hint"
              className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]"
            >
              {isEn
                ? "Whole number from 1 to 4,294,967,294. Network and broadcast addresses are reserved."
                : "Целое число от 1 до 4 294 967 294. Адреса сети и broadcast резервируются."}
            </p>
          </div>

          <ToolPrimaryAction
            type="submit"
            className="mt-5"
            leadingIcon={
              <Calculator size={20} weight="bold" aria-hidden="true" />
            }
          >
            {isEn ? "Calculate subnet" : "Рассчитать подсеть"}
          </ToolPrimaryAction>

          {validationError ? (
            <ToolResult
              status="error"
              title={isEn ? "Check the input" : "Проверьте ввод"}
              description={validationError.message}
              className="mt-5"
            />
          ) : null}

          {result ? (
            <ToolResult
              status="success"
              title={
                isEn
                  ? `Smallest subnet: /${result.prefix}`
                  : `Минимальная подсеть: /${result.prefix}`
              }
              description={
                isEn
                  ? "Traditional IPv4 capacity reserves the network and broadcast addresses and never uses a prefix longer than /30."
                  : "Обычная ёмкость IPv4 резервирует адреса сети и broadcast и не использует префикс длиннее /30."
              }
              className="mt-5"
            >
              <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
                <ResultValue
                  label={isEn ? "Prefix" : "Префикс"}
                  value={`/${result.prefix}`}
                />
                <ResultValue
                  label={isEn ? "Subnet mask" : "Маска подсети"}
                  value={result.mask}
                />
                <ResultValue
                  label={isEn ? "Total addresses" : "Всего адресов"}
                  value={formatBigInt(result.totalAddresses, isEn)}
                />
                <ResultValue
                  label={isEn ? "Usable capacity" : "Доступная ёмкость"}
                  value={formatBigInt(result.usableCapacity, isEn)}
                />

                {result.network ? (
                  <>
                    <ResultValue
                      label={isEn ? "Containing network" : "Содержащая сеть"}
                      value={`${result.network}/${result.prefix}`}
                    />
                    <ResultValue label="Broadcast" value={result.broadcast!} />
                    <div className="sm:col-span-2">
                      <ResultValue
                        label={isEn ? "Usable range" : "Доступный диапазон"}
                        value={`${result.firstHost} – ${result.lastHost}`}
                      />
                    </div>
                  </>
                ) : null}
              </dl>

              {result.startingAddress ? (
                <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
                  {result.isStartAligned
                    ? isEn
                      ? `The starting address ${result.startingAddress} is already aligned to the network boundary.`
                      : `Начальный адрес ${result.startingAddress} уже совпадает с границей сети.`
                    : isEn
                      ? `The starting address ${result.startingAddress} is not aligned; its containing network was normalized to ${result.network}/${result.prefix}.`
                      : `Начальный адрес ${result.startingAddress} не выровнен; содержащая сеть нормализована до ${result.network}/${result.prefix}.`}
                </p>
              ) : null}
            </ToolResult>
          ) : null}

          <AdvancedSettings
            className="mt-5"
            title={isEn ? "Advanced settings" : "Расширенные настройки"}
            description={
              isEn
                ? "Optional IPv4 address for a containing network range"
                : "Необязательный IPv4-адрес для диапазона содержащей сети"
            }
          >
            <div className="max-w-md">
              <Label htmlFor="subnet-starting-ipv4">
                {isEn
                  ? "Starting IPv4 (optional)"
                  : "Начальный IPv4 (необязательно)"}
              </Label>
              <Input
                id="subnet-starting-ipv4"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                value={startingIpv4}
                placeholder="IPv4"
                aria-invalid={validationError?.field === "start"}
                aria-describedby="subnet-starting-ipv4-hint"
                onChange={(event) => {
                  setStartingIpv4(event.target.value);
                  clearResult();
                }}
                className="mt-1.5 h-12 font-mono text-base"
              />
              <p
                id="subnet-starting-ipv4-hint"
                className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]"
              >
                {isEn
                  ? "Any valid IPv4 address is accepted. A non-aligned address is normalized to its containing network and broadcast range."
                  : "Допустим любой корректный IPv4-адрес. Невыровненный адрес нормализуется до содержащей сети и broadcast-диапазона."}
              </p>
            </div>
          </AdvancedSettings>
        </form>
      </section>
    </div>
  );
}
