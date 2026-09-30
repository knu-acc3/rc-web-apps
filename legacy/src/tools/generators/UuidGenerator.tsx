"use client";

import { useState } from "react";
import { ArrowsClockwise, Check } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

function fallbackUuidV4(cryptoObject: Crypto): string {
  const bytes = new Uint8Array(16);
  cryptoObject.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function createUuidV4(): string {
  const cryptoObject = globalThis.crypto;
  if (!cryptoObject?.getRandomValues) {
    throw new Error("Web Crypto unavailable");
  }

  return typeof cryptoObject.randomUUID === "function"
    ? cryptoObject.randomUUID()
    : fallbackUuidV4(cryptoObject);
}

function formatUuid(uuid: string, uppercase: boolean, braces: boolean): string {
  const formatted = uppercase ? uuid.toUpperCase() : uuid.toLowerCase();
  return braces ? "{" + formatted + "}" : formatted;
}

function uuidSignature(
  countInput: string,
  uppercase: boolean,
  braces: boolean,
): string {
  const parsedCount = Number(countInput);
  return JSON.stringify([
    Number.isFinite(parsedCount) ? parsedCount : countInput.trim(),
    uppercase,
    braces,
  ]);
}

export default function UuidGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [countInput, setCountInput] = useState("1");
  const [uppercase, setUppercase] = useState(false);
  const [braces, setBraces] = useState(false);
  const [uuids, setUuids] = useState<string[] | null>(null);
  const [resultSignature, setResultSignature] = useState<string | null>(null);
  const [error, setError] = useState("");

  const currentSignature = uuidSignature(countInput, uppercase, braces);
  const visibleUuids = resultSignature === currentSignature ? uuids : null;

  const generateUuids = () => {
    const count = Number(countInput);

    if (!Number.isInteger(count) || count < 1 || count > 100) {
      setError(
        isEn
          ? "Quantity must be a whole number from 1 to 100."
          : "Количество должно быть целым числом от 1 до 100.",
      );
      setUuids(null);
      setResultSignature(null);
      return;
    }

    try {
      const generated = Array.from({ length: count }, () =>
        formatUuid(createUuidV4(), uppercase, braces),
      );
      const normalizedSignature = uuidSignature(
        String(count),
        uppercase,
        braces,
      );

      setCountInput(String(count));
      setUuids(generated);
      setResultSignature(normalizedSignature);
      setError("");
    } catch {
      setError(
        isEn
          ? "UUID generation is unavailable in this browser."
          : "Генерация UUID недоступна в этом браузере.",
      );
      setUuids(null);
      setResultSignature(null);
    }
  };

  const toggleUppercase = () => {
    setUppercase((current) => !current);
    setError("");
  };

  const toggleBraces = () => {
    setBraces((current) => !current);
    setError("");
  };

  return (
    <div data-generator-tool="uuid" className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {isEn ? "Generate a UUID v4" : "Создайте UUID v4"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Create a random version 4 identifier with the browser Web Crypto API."
              : "Создайте случайный идентификатор версии 4 с помощью браузерного Web Crypto API."}
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 text-sm font-medium text-[var(--color-danger)]"
          >
            {error}
          </p>
        ) : null}

        <ToolPrimaryAction
          type="button"
          onClick={generateUuids}
          className="mt-5"
          leadingIcon={<ArrowsClockwise size={20} weight="bold" />}
        >
          {isEn ? "Generate UUID v4" : "Создать UUID v4"}
        </ToolPrimaryAction>
      </section>

      {visibleUuids ? (
        <section
          aria-live="polite"
          data-uuid-result=""
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                UUID v4
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {isEn
                  ? visibleUuids.length === 1
                    ? "One random identifier"
                    : visibleUuids.length + " random identifiers"
                  : visibleUuids.length === 1
                    ? "Один случайный идентификатор"
                    : "Случайных идентификаторов: " + visibleUuids.length}
              </p>
            </div>
            {visibleUuids.length > 1 ? (
              <CopyButton
                text={visibleUuids.join("\n")}
                size="medium"
                tooltip={isEn ? "Copy all UUIDs" : "Скопировать все UUID"}
                className="shrink-0"
              />
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            {visibleUuids.map((uuid, index) => (
              <div
                key={uuid + "-" + index}
                className="flex min-w-0 items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3"
              >
                <code className="min-w-0 flex-1 break-all text-lg font-bold leading-relaxed text-[var(--color-text)] sm:text-xl">
                  {uuid}
                </code>
                <CopyButton
                  text={uuid}
                  size="medium"
                  tooltip={isEn ? "Copy UUID" : "Скопировать UUID"}
                  className="shrink-0"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <AdvancedSettings
        title={isEn ? "Output options" : "Параметры результата"}
        description={
          isEn
            ? "Quantity, letter case and braces"
            : "Количество, регистр букв и фигурные скобки"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="uuid-count" className="text-sm font-semibold">
              {isEn ? "Quantity" : "Количество"}
            </Label>
            <Input
              id="uuid-count"
              type="number"
              min={1}
              max={100}
              step={1}
              value={countInput}
              onChange={(event) => {
                setCountInput(event.target.value);
                setError("");
              }}
              inputMode="numeric"
              className="mt-2 h-12"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {isEn ? "Formatting" : "Форматирование"}
            </p>
            <div className="mt-2 grid gap-2">
              <Button
                type="button"
                variant={uppercase ? "soft" : "outline"}
                aria-pressed={uppercase}
                onClick={toggleUppercase}
                className="min-h-11 justify-start"
              >
                {uppercase ? (
                  <Check size={18} weight="bold" aria-hidden="true" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="size-[18px] rounded-sm border border-[var(--color-border-strong)]"
                  />
                )}
                {isEn ? "Uppercase letters" : "Прописные буквы"}
              </Button>
              <Button
                type="button"
                variant={braces ? "soft" : "outline"}
                aria-pressed={braces}
                onClick={toggleBraces}
                className="min-h-11 justify-start"
              >
                {braces ? (
                  <Check size={18} weight="bold" aria-hidden="true" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="size-[18px] rounded-sm border border-[var(--color-border-strong)]"
                  />
                )}
                {isEn ? "Wrap in braces" : "Добавить фигурные скобки"}
              </Button>
            </div>
          </div>
        </div>
      </AdvancedSettings>
    </div>
  );
}
