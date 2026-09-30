"use client";

import { useState } from "react";
import { Bank, Copy } from "@phosphor-icons/react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type ValidationError = "empty" | "length" | "country" | "format" | "checksum";

interface ValidationResult {
  normalized: string;
  valid: boolean;
  error: ValidationError | null;
  bankCode: string;
  accountNumber: string;
}

function normalizeIban(value: string) {
  return value.toUpperCase().replace(/[\s-]+/g, "");
}

function mod97(value: string) {
  let remainder = 0;
  for (const character of value.slice(4) + value.slice(0, 4)) {
    const digits =
      character >= "A" && character <= "Z"
        ? String(character.charCodeAt(0) - 55)
        : character;
    for (const digit of digits) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder;
}

function validateKzIban(value: string): ValidationResult {
  const normalized = normalizeIban(value);
  const base = {
    normalized,
    bankCode: normalized.slice(4, 7),
    accountNumber: normalized.slice(7),
  };

  if (!normalized) return { ...base, valid: false, error: "empty" };
  if (normalized.length !== 20) {
    return { ...base, valid: false, error: "length" };
  }
  if (!normalized.startsWith("KZ")) {
    return { ...base, valid: false, error: "country" };
  }
  if (!/^KZ\d{5}[A-Z0-9]{13}$/.test(normalized)) {
    return { ...base, valid: false, error: "format" };
  }
  if (mod97(normalized) !== 1) {
    return { ...base, valid: false, error: "checksum" };
  }
  return { ...base, valid: true, error: null };
}

export default function KzIbanValidator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const errorText = (error: ValidationError) => {
    const messages: Record<ValidationError, [string, string]> = {
      empty: ["Введите IBAN.", "Enter an IBAN."],
      length: [
        "Казахстанский IBAN должен содержать ровно 20 символов.",
        "A Kazakhstan IBAN must contain exactly 20 characters.",
      ],
      country: [
        "Казахстанский IBAN должен начинаться с KZ.",
        "A Kazakhstan IBAN must start with KZ.",
      ],
      format: [
        "Ожидается KZ, две контрольные цифры, трёхзначный код банка и 13 буквенно-цифровых символов счёта.",
        "Expected KZ, two check digits, a three-digit bank code, and 13 alphanumeric account characters.",
      ],
      checksum: [
        "Контрольная сумма MOD-97 не совпадает.",
        "The MOD-97 checksum does not match.",
      ],
    };
    return messages[error][isEn ? 1 : 0];
  };

  const validate = () => {
    setResult(validateKzIban(value));
    setCopied(false);
    setCopyFailed(false);
  };

  const copyIban = async () => {
    if (!result) return;
    const success = await copyText(result.normalized);
    setCopyFailed(!success);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="kz-iban-input">
          {isEn ? "Kazakhstan IBAN" : "IBAN Казахстана"}
        </Label>
        <Input
          id="kz-iban-input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setResult(null);
            setCopied(false);
            setCopyFailed(false);
          }}
          placeholder={isEn ? "KZ + 18 characters" : "KZ + 18 символов"}
          autoComplete="off"
          spellCheck={false}
          className="mt-1.5 h-12 font-mono text-base uppercase"
        />

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          onClick={validate}
          disabled={!value.trim()}
          leadingIcon={<Bank size={20} aria-hidden="true" />}
        >
          {isEn ? "Validate Kazakhstan IBAN" : "Проверить IBAN Казахстана"}
        </ToolPrimaryAction>

        {result ? (
          result.valid ? (
            <ToolResult
              status="success"
              title={isEn ? "Checksum is valid" : "Контрольная сумма корректна"}
              description={
                isEn
                  ? "The format and MOD-97 checksum are valid. This does not confirm that the account exists or is active."
                  : "Формат и контрольная сумма MOD-97 корректны. Это не подтверждает существование или активность счёта."
              }
              className="mt-5"
              actions={
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void copyIban()}
                >
                  <Copy size={18} aria-hidden="true" />
                  {copied
                    ? isEn
                      ? "Copied"
                      : "Скопировано"
                    : isEn
                      ? "Copy"
                      : "Копировать"}
                </Button>
              }
            >
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-[var(--color-text-muted)]">IBAN</dt>
                  <dd className="mt-1 break-all font-mono font-bold">
                    {result.normalized}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--color-text-muted)]">
                    {isEn ? "Bank code" : "Код банка"}
                  </dt>
                  <dd className="mt-1 font-mono font-bold">
                    {result.bankCode}
                  </dd>
                </div>
                <div className="min-w-0 sm:col-span-2">
                  <dt className="text-[var(--color-text-muted)]">
                    {isEn
                      ? "Internal account identifier"
                      : "Внутрибанковский номер счёта"}
                  </dt>
                  <dd className="mt-1 break-all font-mono font-bold">
                    {result.accountNumber}
                  </dd>
                </div>
              </dl>
              {copyFailed ? (
                <p
                  role="alert"
                  className="mt-3 text-sm text-[var(--color-danger)]"
                >
                  {isEn
                    ? "Clipboard access was denied."
                    : "Браузер запретил доступ к буферу обмена."}
                </p>
              ) : null}
            </ToolResult>
          ) : (
            <ToolResult
              status="error"
              title={isEn ? "IBAN is invalid" : "IBAN некорректен"}
              description={errorText(result.error ?? "format")}
              className="mt-5"
            />
          )
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "Enter 20 characters and run the local check."
                : "Введите 20 символов и запустите локальную проверку."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={
            isEn ? "Kazakhstan IBAN structure" : "Структура IBAN Казахстана"
          }
          description={
            isEn
              ? "What the local check verifies"
              : "Что проверяет локальный алгоритм"
          }
        >
          <ol className="grid gap-2 text-sm text-[var(--color-text-muted)]">
            <li>
              <strong className="text-[var(--color-text)]">KZ</strong> —{" "}
              {isEn ? "country code" : "код страны"}
            </li>
            <li>
              <strong className="text-[var(--color-text)]">
                {isEn ? "2 digits" : "2 цифры"}
              </strong>{" "}
              — {isEn ? "MOD-97 check digits" : "контрольные цифры MOD-97"}
            </li>
            <li>
              <strong className="text-[var(--color-text)]">
                {isEn ? "3 digits" : "3 цифры"}
              </strong>{" "}
              — {isEn ? "bank code" : "код банка"}
            </li>
            <li>
              <strong className="text-[var(--color-text)]">
                {isEn ? "13 characters" : "13 символов"}
              </strong>{" "}
              —{" "}
              {isEn
                ? "internal account identifier"
                : "внутрибанковский номер счёта"}
            </li>
          </ol>
          <a
            href="https://nationalbank.kz/file/download/5466"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            {isEn
              ? "National Bank format description"
              : "Описание формата Национального Банка"}
          </a>
        </AdvancedSettings>
      </section>
    </div>
  );
}
