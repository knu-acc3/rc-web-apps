"use client";

import { useState } from "react";
import { Copy, MapPin } from "@phosphor-icons/react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type PostalKind = "legacy" | "building";

interface PostalResult {
  normalized: string;
  kind: PostalKind | null;
  valid: boolean;
}

function validatePostalCode(value: string): PostalResult {
  const normalized = value.toUpperCase().replace(/[\s-]+/g, "");
  if (/^\d{6}$/.test(normalized)) {
    return { normalized, kind: "legacy", valid: true };
  }
  if (/^[A-Z]\d{2}[A-Z0-9]{4}$/.test(normalized)) {
    return { normalized, kind: "building", valid: true };
  }
  return { normalized, kind: null, valid: false };
}

export default function KzPostalCode() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [value, setValue] = useState("");
  const [result, setResult] = useState<PostalResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const check = () => {
    setResult(validatePostalCode(value));
    setCopied(false);
    setCopyFailed(false);
  };

  const copyCode = async () => {
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
        <Label htmlFor="kz-postal-input">
          {isEn ? "Kazakhstan postal code" : "Почтовый индекс Казахстана"}
        </Label>
        <Input
          id="kz-postal-input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setResult(null);
            setCopied(false);
            setCopyFailed(false);
          }}
          placeholder={
            isEn
              ? "6 digits or 7 building-index characters"
              : "6 цифр или 7 символов индекса строения"
          }
          autoComplete="postal-code"
          spellCheck={false}
          className="mt-1.5 h-12 font-mono text-base uppercase"
        />

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          onClick={check}
          disabled={!value.trim()}
          leadingIcon={<MapPin size={20} aria-hidden="true" />}
        >
          {isEn ? "Check postal-code format" : "Проверить формат индекса"}
        </ToolPrimaryAction>

        {result ? (
          result.valid ? (
            <ToolResult
              status="success"
              title={isEn ? "Format is valid" : "Формат корректен"}
              description={
                result.kind === "legacy"
                  ? isEn
                    ? "This is the legacy six-digit format. The check does not confirm that the code is assigned to a specific address."
                    : "Это старый шестизначный формат. Проверка не подтверждает, что индекс присвоен конкретному адресу."
                  : isEn
                    ? "This is the seven-character building-index format. The check does not confirm that the building exists."
                    : "Это семисимвольный формат индекса строения. Проверка не подтверждает существование здания."
              }
              className="mt-5"
              actions={
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void copyCode()}
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
              <p className="break-all font-mono text-2xl font-black">
                {result.normalized}
              </p>
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
              title={isEn ? "Format is invalid" : "Некорректный формат"}
              description={
                isEn
                  ? "Enter either six digits or a seven-character building index: one Latin letter, two digits, then four letters or digits."
                  : "Введите шесть цифр либо семисимвольный индекс строения: одна латинская буква, две цифры и ещё четыре буквы или цифры."
              }
              className="mt-5"
            />
          )
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "The local check recognizes both Kazakhstan postal-code formats."
                : "Локальная проверка распознаёт оба формата почтовых индексов Казахстана."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Postal-code formats" : "Форматы почтовых индексов"}
          description={
            isEn
              ? "Legacy codes and building indexes"
              : "Старые индексы и индексы строений"
          }
        >
          <div className="grid gap-3 text-sm text-[var(--color-text-muted)]">
            <p>
              <strong className="text-[var(--color-text)]">
                {isEn ? "Six digits:" : "Шесть цифр:"}
              </strong>{" "}
              {isEn
                ? "the legacy locality/post-office format."
                : "старый формат населённого пункта или отделения."}
            </p>
            <p>
              <strong className="text-[var(--color-text)]">
                {isEn ? "Seven characters:" : "Семь символов:"}
              </strong>{" "}
              {isEn
                ? "a building-specific index introduced alongside legacy codes."
                : "индекс конкретного строения, используемый вместе со старыми индексами."}
            </p>
            <p>
              {isEn
                ? "Use the official KazPost search to confirm the code for a real address."
                : "Для подтверждения индекса реального адреса используйте официальный поиск Казпочты."}
            </p>
          </div>
          <a
            href="https://post.kz/postcode"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            {isEn
              ? "Open KazPost postcode search"
              : "Открыть поиск индекса Казпочты"}
          </a>
        </AdvancedSettings>
      </section>
    </div>
  );
}
