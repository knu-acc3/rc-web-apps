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

interface PhoneResult {
  valid: boolean;
  normalized?: string;
  digitCount: number;
  messageEn: string;
  messageRu: string;
}

const ALLOWED_PHONE_CHARACTERS = /^[+\d\s().-]+$/u;

function invalidResult(
  digitCount: number,
  messageEn: string,
  messageRu: string,
): PhoneResult {
  return { valid: false, digitCount, messageEn, messageRu };
}

function inspectPhone(input: string): PhoneResult {
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
  if (plusCount !== 1 || !trimmed.startsWith("+")) {
    return invalidResult(
      digits.length,
      "An international E.164 number must begin with one + sign.",
      "Международный номер E.164 должен начинаться с одного знака +.",
    );
  }
  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) {
    return invalidResult(
      digits.length,
      "E.164 structure requires 8–15 digits and cannot start with 0.",
      "Структура E.164 требует 8–15 цифр и не может начинаться с 0.",
    );
  }

  return {
    valid: true,
    normalized: `+${digits}`,
    digitCount: digits.length,
    messageEn: "The input matches the basic international E.164 structure.",
    messageRu: "Ввод соответствует базовой международной структуре E.164.",
  };
}

export default function PhoneValidator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<PhoneResult | null>(null);

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
                ? "International phone check"
                : "Проверка международного телефона"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Checks an explicit international E.164 structure — not whether the number exists."
                : "Проверяет явную международную структуру E.164 — но не существование номера."}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="phone-validator-input">
            {isEn
              ? "International phone number"
              : "Международный номер телефона"}
          </Label>
          <Input
            id="phone-validator-input"
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
              isEn
                ? "Enter a number beginning with +"
                : "Введите номер, начинающийся с +"
            }
            className="mt-2 h-12 font-mono text-base"
          />
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!phone.trim()}
          onClick={() => setResult(inspectPhone(phone))}
          leadingIcon={<Phone size={20} aria-hidden="true" />}
        >
          {isEn ? "Check structure" : "Проверить структуру"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Local check limits" : "Границы локальной проверки"}
          description={
            isEn
              ? "Accepted syntax and what the result cannot prove"
              : "Допустимый синтаксис и ограничения результата"
          }
        >
          <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "The input must begin with + and contain 8–15 digits. Spaces, parentheses, dots, and hyphens are removed from the normalized result."
                : "Ввод должен начинаться со знака + и содержать 8–15 цифр. Пробелы, скобки, точки и дефисы удаляются из нормализованного результата."}
            </p>
            <p>
              {isEn
                ? "No country, numbering plan, operator, subscriber, allocation, or reachability is inferred."
                : "Страна, план нумерации, оператор, абонент, выдача и доступность номера не определяются."}
            </p>
          </div>
        </AdvancedSettings>
      </Card>

      {result ? (
        <Card
          className="p-4 sm:p-5"
          aria-live="polite"
          aria-labelledby="phone-validator-result-title"
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
              <h2 id="phone-validator-result-title" className="font-bold">
                {result.valid
                  ? isEn
                    ? "Structure looks correct"
                    : "Структура выглядит корректно"
                  : isEn
                    ? "Structure does not match"
                    : "Структура не соответствует"}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {isEn ? result.messageEn : result.messageRu}
              </p>
            </div>
          </div>

          {result.normalized ? (
            <div className="mt-4 flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                  E.164
                </p>
                <p className="mt-1 break-all font-mono text-base font-bold">
                  {result.normalized}
                </p>
              </div>
              <CopyButton
                text={result.normalized}
                size="medium"
                tooltip={isEn ? "Copy result" : "Копировать результат"}
              />
            </div>
          ) : null}

          <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "This local structure check cannot confirm allocation, reachability, owner, operator, or existence."
              : "Локальная проверка структуры не подтверждает выдачу, доступность, владельца, оператора или существование номера."}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
