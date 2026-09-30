"use client";

import { useCallback, useState } from "react";
import { CheckCircle, Phone, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

const ALLOWED_PHONE_CHARACTERS = /^[+\d\s().-]+$/u;

interface FormatResult {
  valid: boolean;
  digitCount: number;
  messageEn: string;
  messageRu: string;
  international?: string;
  national?: string;
  e164?: string;
}

function invalidResult(
  digitCount: number,
  messageEn: string,
  messageRu: string,
): FormatResult {
  return { valid: false, digitCount, messageEn, messageRu };
}

function formatKzPhone(input: string): FormatResult {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/gu, "");

  if (!trimmed) {
    return invalidResult(0, "Enter a phone number.", "Введите номер телефона.");
  }
  if (!ALLOWED_PHONE_CHARACTERS.test(trimmed)) {
    return invalidResult(
      digits.length,
      "Use digits and standard phone separators only.",
      "Используйте только цифры и стандартные разделители номера.",
    );
  }

  const plusCount = (trimmed.match(/\+/gu) ?? []).length;
  if (plusCount > 1 || (plusCount === 1 && !trimmed.startsWith("+"))) {
    return invalidResult(
      digits.length,
      "The plus sign is allowed only once, at the beginning.",
      "Знак плюса допустим только один раз в начале.",
    );
  }

  let body: string | null = null;
  if (plusCount === 1) {
    if (digits.length === 11 && digits.startsWith("7")) body = digits.slice(1);
  } else if (digits.length === 10) {
    body = digits;
  } else if (
    digits.length === 11 &&
    (digits.startsWith("7") || digits.startsWith("8"))
  ) {
    body = digits.slice(1);
  }

  if (!body) {
    return invalidResult(
      digits.length,
      "Use +7 followed by 10 digits, 8 followed by 10 digits, or 10 national digits.",
      "Введите +7 и 10 цифр, 8 и 10 цифр либо 10 национальных цифр.",
    );
  }

  const grouped = `${body.slice(0, 3)} ${body.slice(3, 6)} ${body.slice(6, 8)} ${body.slice(8)}`;
  return {
    valid: true,
    digitCount: 11,
    international: `+7 ${grouped}`,
    national: `8 ${grouped}`,
    e164: `+7${body}`,
    messageEn: "The input was normalized by length and +7 / 8 trunk rules.",
    messageRu: "Ввод нормализован по длине и правилам префиксов +7 / 8.",
  };
}

export default function KzPhoneFormatter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<FormatResult | null>(null);

  const clearResult = useCallback(() => setResult(null), []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Phone size={22} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn
                ? "Kazakhstan phone formatter"
                : "Форматирование телефона Казахстана"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Normalizes +7, trunk-prefix 8, or a 10-digit national number."
                : "Нормализует +7, национальный префикс 8 или номер из 10 цифр."}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="kz-phone-formatter-input">
            {isEn ? "Phone number" : "Номер телефона"}
          </Label>
          <Input
            id="kz-phone-formatter-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={40}
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              clearResult();
            }}
            placeholder={
              isEn ? "Enter a Kazakhstan number" : "Введите номер Казахстана"
            }
            className="mt-2 h-12 font-mono text-base"
          />
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!phone.trim()}
          onClick={() => setResult(formatKzPhone(phone))}
          leadingIcon={<Phone size={20} aria-hidden="true" />}
        >
          {isEn ? "Format number" : "Форматировать номер"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Normalization limits" : "Границы нормализации"}
          description={
            isEn
              ? "Accepted prefixes and what formatting cannot prove"
              : "Допустимые префиксы и ограничения форматирования"
          }
        >
          <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "Accepted forms are +7 followed by 10 digits, trunk-prefix 8 followed by 10 digits, or exactly 10 national digits. Common visual separators are removed."
                : "Принимаются +7 и 10 цифр, национальный префикс 8 и 10 цифр либо ровно 10 национальных цифр. Обычные визуальные разделители удаляются."}
            </p>
            <p>
              {isEn
                ? "The formatter does not validate number allocation, reachability, mobile status, prefix ownership, or operator."
                : "Форматтер не проверяет выдачу, доступность, мобильный статус, принадлежность префикса или оператора."}
            </p>
          </div>
        </AdvancedSettings>
      </Card>

      {result ? (
        <Card
          className="p-4 sm:p-5"
          aria-live="polite"
          aria-labelledby="kz-phone-formatter-result-title"
        >
          <div className="flex items-start gap-3">
            <div
              className={
                result.valid
                  ? "flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]"
                  : "flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
              }
            >
              {result.valid ? (
                <CheckCircle size={24} weight="fill" aria-hidden="true" />
              ) : (
                <XCircle size={24} weight="fill" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="kz-phone-formatter-result-title" className="font-bold">
                {result.valid
                  ? isEn
                    ? "Number formatted"
                    : "Номер отформатирован"
                  : isEn
                    ? "Cannot format this input"
                    : "Не удалось отформатировать ввод"}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {isEn ? result.messageEn : result.messageRu}
              </p>
            </div>
          </div>

          {result.valid &&
          result.international &&
          result.e164 &&
          result.national ? (
            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    {isEn ? "International" : "Международный формат"}
                  </p>
                  <p className="mt-1 break-all font-mono text-lg font-bold">
                    {result.international}
                  </p>
                </div>
                <CopyButton
                  text={result.international}
                  size="medium"
                  tooltip={isEn ? "Copy formatted number" : "Копировать номер"}
                />
              </div>
              <div className="mt-3 grid gap-2 border-t border-[var(--color-border-subtle)] pt-3 text-sm sm:grid-cols-2">
                <p className="min-w-0 break-all">
                  <span className="text-[var(--color-text-muted)]">
                    E.164:{" "}
                  </span>
                  <span className="font-mono font-semibold">{result.e164}</span>
                </p>
                <p className="min-w-0 break-all">
                  <span className="text-[var(--color-text-muted)]">
                    {isEn ? "National: " : "Национальный: "}
                  </span>
                  <span className="font-mono font-semibold">
                    {result.national}
                  </span>
                </p>
              </div>
            </div>
          ) : null}

          <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Formatting confirms only the input shape. It does not confirm that the number is allocated, reachable, mobile, or linked to an operator."
              : "Форматирование подтверждает только форму ввода. Оно не подтверждает, что номер выдан, доступен, является мобильным или относится к оператору."}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
