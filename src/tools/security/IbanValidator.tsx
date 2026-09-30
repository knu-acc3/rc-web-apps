"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { useLanguage } from "@/src/i18n/LanguageContext";

const IBAN_LENGTHS: Readonly<Record<string, number>> = Object.freeze({
  AD: 24,
  AE: 23,
  AL: 28,
  AT: 20,
  AZ: 28,
  BA: 20,
  BE: 16,
  BG: 22,
  BH: 22,
  BR: 29,
  BY: 28,
  CH: 21,
  CR: 22,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  DO: 28,
  EE: 20,
  EG: 29,
  ES: 24,
  FI: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GE: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  GT: 28,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IQ: 23,
  IS: 26,
  IT: 27,
  JO: 30,
  KW: 30,
  KZ: 20,
  LB: 28,
  LC: 32,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  LY: 25,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MN: 20,
  MR: 27,
  MT: 31,
  MU: 30,
  NL: 18,
  NO: 15,
  PK: 24,
  PL: 28,
  PS: 29,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  SA: 24,
  SC: 31,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  ST: 25,
  SV: 28,
  TL: 23,
  TN: 24,
  TR: 26,
  UA: 29,
  VA: 22,
  VG: 24,
  XK: 20,
});

const IBAN_STRUCTURE = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;

export interface IbanValidationResult {
  normalized: string;
  formatted: string;
  countryCode: string;
  expectedLength: number | null;
  structureValid: boolean;
  generalLengthValid: boolean;
  countryLengthValid: boolean;
  checksumRemainder: number | null;
  checksumValid: boolean;
  valid: boolean;
}

export function normalizeIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function formatIban(value: string) {
  return value.match(/.{1,4}/g)?.join(" ") ?? "";
}

export function ibanMod97(value: string) {
  const rearranged = `${value.slice(4)}${value.slice(0, 4)}`;
  let remainder = 0;

  for (const character of rearranged) {
    const code = character.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      remainder = (remainder * 10 + code - 48) % 97;
      continue;
    }

    const letterValue = code - 55;
    remainder = (remainder * 100 + letterValue) % 97;
  }

  return remainder;
}

export function validateIban(value: string): IbanValidationResult {
  const normalized = normalizeIban(value);
  const countryCode = normalized.slice(0, 2);
  const expectedLength = IBAN_LENGTHS[countryCode] ?? null;
  const structureValid = IBAN_STRUCTURE.test(normalized);
  const generalLengthValid = normalized.length >= 15 && normalized.length <= 34;
  const countryLengthValid =
    expectedLength !== null && normalized.length === expectedLength;
  const checksumRemainder =
    structureValid && generalLengthValid ? ibanMod97(normalized) : null;
  const checksumValid = checksumRemainder === 1;

  return {
    normalized,
    formatted: formatIban(normalized),
    countryCode,
    expectedLength,
    structureValid,
    generalLengthValid,
    countryLengthValid,
    checksumRemainder,
    checksumValid,
    valid:
      structureValid &&
      generalLengthValid &&
      countryLengthValid &&
      checksumValid,
  };
}

export default function IbanValidator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [result, setResult] = useState<IbanValidationResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const invalidate = () => {
    setResult(null);
    setError("");
    setCopied(false);
    setCopyFailed(false);
  };

  const validate = () => {
    if (!normalizeIban(input)) {
      setResult(null);
      setError(isEn ? "Enter an IBAN." : "Введите IBAN.");
      return;
    }

    setResult(validateIban(input));
    setError("");
    setCopied(false);
    setCopyFailed(false);
  };

  const copyNormalized = async () => {
    if (!result) return;
    const success = await copyText(result.formatted);
    setCopyFailed(!success);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  const resultDescription = () => {
    if (!result) return "";
    if (result.valid) {
      return isEn
        ? "The format, country length and MOD-97 checksum are correct. This does not confirm that the bank or account exists."
        : "Формат, длина страны и контрольная сумма MOD-97 корректны. Это не подтверждает существование банка или счёта.";
    }
    if (!result.structureValid) {
      return isEn
        ? "Use two country letters, two check digits, then Latin letters or digits only."
        : "Нужны две буквы страны, две контрольные цифры, затем только латинские буквы или цифры.";
    }
    if (!result.generalLengthValid) {
      return isEn
        ? "An IBAN must contain 15 to 34 characters."
        : "IBAN должен содержать от 15 до 34 символов.";
    }
    if (result.expectedLength === null) {
      return isEn
        ? "This country prefix is not in the supported IBAN length table."
        : "Этого кода страны нет в поддерживаемой таблице длин IBAN.";
    }
    if (!result.countryLengthValid) {
      return isEn
        ? `${result.countryCode} IBAN must contain ${result.expectedLength} characters.`
        : `IBAN с кодом ${result.countryCode} должен содержать ${result.expectedLength} символов.`;
    }
    return isEn
      ? "The checksum does not satisfy MOD-97 = 1."
      : "Контрольная сумма не соответствует MOD-97 = 1.";
  };

  const checks = result
    ? [
        {
          key: "format",
          passed: result.structureValid && result.generalLengthValid,
          label: isEn
            ? "IBAN character format and total length"
            : "Формат символов и общая длина",
        },
        {
          key: "country-length",
          passed: result.countryLengthValid,
          label:
            result.expectedLength === null
              ? isEn
                ? `Country format: ${result.countryCode || "—"} is not supported`
                : `Формат страны: ${result.countryCode || "—"} не поддерживается`
              : isEn
                ? `${result.countryCode} length: ${result.normalized.length} / ${result.expectedLength}`
                : `Длина ${result.countryCode}: ${result.normalized.length} / ${result.expectedLength}`,
        },
        {
          key: "checksum",
          passed: result.checksumValid,
          label: `MOD-97: ${result.checksumRemainder ?? "—"}`,
        },
      ]
    : [];

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="iban-input">IBAN</Label>
        <Input
          id="iban-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            invalidate();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") validate();
          }}
          placeholder={isEn ? "Enter IBAN" : "Введите IBAN"}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="mt-1.5 font-mono uppercase tracking-wide"
        />
        <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "Spaces are removed automatically."
            : "Пробелы удаляются автоматически."}
        </p>

        <ToolPrimaryAction type="button" className="mt-4" onClick={validate}>
          {isEn ? "Validate IBAN" : "Проверить IBAN"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "IBAN is required" : "Нужен IBAN"}
            description={error}
            className="mt-5"
          />
        ) : result ? (
          <ToolResult
            status={result.valid ? "success" : "error"}
            title={
              result.valid
                ? isEn
                  ? "IBAN is structurally valid"
                  : "Структура IBAN корректна"
                : isEn
                  ? "IBAN is invalid"
                  : "IBAN некорректен"
            }
            description={resultDescription()}
            className="mt-5"
            actions={
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void copyNormalized()}
              >
                {copied
                  ? isEn
                    ? "Copied"
                    : "Скопировано"
                  : isEn
                    ? "Copy IBAN"
                    : "Копировать"}
              </Button>
            }
          >
            <p className="break-all rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-3 font-mono text-base font-bold tracking-wider text-[var(--color-text)] sm:text-lg">
              {result.formatted}
            </p>
            <div className="mt-3 grid gap-2">
              {checks.map((check) => (
                <div
                  key={check.key}
                  className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-2"
                >
                  {check.passed ? (
                    <CheckCircle
                      size={20}
                      weight="fill"
                      className="shrink-0 text-[var(--color-success)]"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      size={20}
                      weight="fill"
                      className="shrink-0 text-[var(--color-danger)]"
                      aria-hidden="true"
                    />
                  )}
                  <span className="min-w-0 text-sm font-medium text-[var(--color-text)]">
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
            {copyFailed ? (
              <p
                role="alert"
                className="mt-2 text-sm text-[var(--color-danger)]"
              >
                {isEn
                  ? "Clipboard access was denied."
                  : "Браузер запретил доступ к буферу обмена."}
              </p>
            ) : null}
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "Format, registered country length and MOD-97 will be checked here."
                : "Здесь будут проверены формат, длина страны и MOD-97."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "What is checked" : "Что проверяется"}
          description={
            isEn
              ? "Country length, character format and MOD-97"
              : "Длина страны, формат символов и MOD-97"
          }
        >
          <div className="space-y-2 text-sm leading-6 text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "The normalized value is compared with the supported country-length table, then its checksum must satisfy MOD-97 = 1."
                : "Нормализованное значение сравнивается с поддерживаемой таблицей длин по странам, затем контрольная сумма должна соответствовать MOD-97 = 1."}
            </p>
            <p>
              {isEn
                ? "This is a structural check only. It does not confirm that the bank or account exists."
                : "Это только структурная проверка. Она не подтверждает существование банка или счёта."}
            </p>
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
