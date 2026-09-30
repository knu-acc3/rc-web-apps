"use client";

import { useCallback, useState } from "react";
import { CheckCircle, CreditCard, Info, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

const ALLOWED_CARD_CHARACTERS = /^[\d\s-]+$/u;

interface NetworkMatch {
  name: string;
  range: string;
}

interface CardCheckResult {
  validInput: boolean;
  kind: "bin" | "pan" | "invalid";
  digitCount: number;
  network?: NetworkMatch;
  luhnValid?: boolean;
  messageEn: string;
  messageRu: string;
}

function prefixInRange(
  digits: string,
  length: number,
  minimum: number,
  maximum: number,
) {
  if (digits.length < length) return false;
  const prefix = Number(digits.slice(0, length));
  return prefix >= minimum && prefix <= maximum;
}

function detectNetwork(digits: string): NetworkMatch | undefined {
  if (digits.startsWith("4")) return { name: "Visa", range: "4" };

  if (prefixInRange(digits, 2, 51, 55)) {
    return { name: "Mastercard", range: "51–55" };
  }
  if (prefixInRange(digits, 4, 2221, 2720)) {
    return { name: "Mastercard", range: "2221–2720" };
  }

  if (digits.startsWith("34") || digits.startsWith("37")) {
    return { name: "American Express", range: "34 or 37" };
  }
  if (prefixInRange(digits, 4, 3528, 3589)) {
    return { name: "JCB", range: "3528–3589" };
  }
  if (prefixInRange(digits, 4, 2200, 2204)) {
    return { name: "Mir", range: "2200–2204" };
  }

  const isDiscover =
    digits.startsWith("6011") ||
    digits.startsWith("65") ||
    prefixInRange(digits, 3, 644, 649) ||
    prefixInRange(digits, 6, 622126, 622925);
  if (isDiscover) {
    return {
      name: "Discover",
      range: digits.startsWith("6011")
        ? "6011"
        : digits.startsWith("65")
          ? "65"
          : prefixInRange(digits, 3, 644, 649)
            ? "644–649"
            : "622126–622925",
    };
  }

  if (digits.startsWith("62")) {
    return { name: "UnionPay", range: "62" };
  }

  const isDiners =
    prefixInRange(digits, 3, 300, 305) ||
    digits.startsWith("36") ||
    digits.startsWith("38") ||
    digits.startsWith("39");
  if (isDiners) {
    return {
      name: "Diners Club",
      range: prefixInRange(digits, 3, 300, 305) ? "300–305" : "36, 38, or 39",
    };
  }

  return undefined;
}

function passesLuhn(digits: string) {
  let sum = 0;
  let doubleNext = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleNext) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleNext = !doubleNext;
  }

  return sum % 10 === 0;
}

function inspectCardInput(input: string): CardCheckResult {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/gu, "");

  if (!trimmed) {
    return {
      validInput: false,
      kind: "invalid",
      digitCount: 0,
      messageEn: "Enter a 6–8 digit BIN/IIN or a complete card number.",
      messageRu: "Введите BIN/IIN из 6–8 цифр или полный номер карты.",
    };
  }
  if (!ALLOWED_CARD_CHARACTERS.test(trimmed)) {
    return {
      validInput: false,
      kind: "invalid",
      digitCount: digits.length,
      messageEn: "Use digits, spaces, and hyphens only.",
      messageRu: "Используйте только цифры, пробелы и дефисы.",
    };
  }

  if (digits.length >= 6 && digits.length <= 8) {
    return {
      validInput: true,
      kind: "bin",
      digitCount: digits.length,
      network: detectNetwork(digits),
      messageEn: "Prefix range checked. Luhn needs a complete card number.",
      messageRu:
        "Диапазон префикса проверен. Для Luhn нужен полный номер карты.",
    };
  }

  if (digits.length >= 13 && digits.length <= 19) {
    return {
      validInput: true,
      kind: "pan",
      digitCount: digits.length,
      network: detectNetwork(digits),
      luhnValid: passesLuhn(digits),
      messageEn:
        "The full number was checked locally and discarded from the input.",
      messageRu: "Полный номер проверен локально и удалён из поля ввода.",
    };
  }

  return {
    validInput: false,
    kind: "invalid",
    digitCount: digits.length,
    messageEn:
      "Use 6–8 digits for a BIN/IIN, or 13–19 digits for a full card number.",
    messageRu:
      "Для BIN/IIN нужно 6–8 цифр, для полного номера карты — 13–19 цифр.",
  };
}

export default function BinValidator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CardCheckResult | null>(null);

  const clearResult = useCallback(() => setResult(null), []);

  const check = useCallback(() => {
    const nextResult = inspectCardInput(input);
    setResult(nextResult);

    const digitCount = input.replace(/\D/gu, "").length;
    if (digitCount > 8) setInput("");
  }, [input]);

  const passed =
    result?.kind === "bin"
      ? result.validInput
      : result?.kind === "pan"
        ? Boolean(result.luhnValid)
        : false;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <CreditCard size={23} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn ? "Card BIN / IIN check" : "Проверка карточного BIN / IIN"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Checks public payment-network ranges; Luhn runs only for a complete card number."
                : "Проверяет публичные диапазоны платёжных сетей; Luhn запускается только для полного номера карты."}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="card-bin-validator-input">
            {isEn
              ? "BIN / IIN or full card number"
              : "BIN / IIN или полный номер карты"}
          </Label>
          <Input
            id="card-bin-validator-input"
            inputMode="numeric"
            autoComplete="off"
            maxLength={32}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              clearResult();
            }}
            placeholder={
              isEn ? "Enter 6–8 or 13–19 digits" : "Введите 6–8 или 13–19 цифр"
            }
            className="mt-2 h-12 font-mono text-base tracking-wider"
          />
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!input.trim()}
          onClick={check}
          leadingIcon={<CreditCard size={20} aria-hidden="true" />}
        >
          {isEn ? "Check BIN / checksum" : "Проверить BIN / сумму"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Algorithm and privacy" : "Алгоритм и приватность"}
          description={
            isEn
              ? "Prefix ranges, Luhn scope, and PAN handling"
              : "Диапазоны, область Luhn и обработка PAN"
          }
        >
          <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "For 6–8 digits, only built-in public payment-network prefix ranges are compared. Luhn is not run without a complete card number."
                : "Для 6–8 цифр сравниваются только встроенные публичные диапазоны платёжных сетей. Без полного номера карты Luhn не запускается."}
            </p>
            <p>
              {isEn
                ? "For 13–19 digits, Luhn runs locally and the input is immediately cleared. No PAN is placed in the result or persisted; no issuer or country database is queried."
                : "Для 13–19 цифр Luhn выполняется локально, после чего поле сразу очищается. PAN не попадает в результат и не сохраняется; база эмитентов или стран не запрашивается."}
            </p>
          </div>
        </AdvancedSettings>
      </Card>

      {result ? (
        <Card
          className="p-4 sm:p-5"
          aria-live="polite"
          aria-labelledby="card-bin-validator-result-title"
        >
          <div className="flex items-start gap-3">
            <div
              className={
                passed
                  ? "flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]"
                  : "flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
              }
            >
              {passed ? (
                <CheckCircle size={24} weight="fill" aria-hidden="true" />
              ) : (
                <XCircle size={24} weight="fill" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="card-bin-validator-result-title" className="font-bold">
                {result.kind === "bin"
                  ? isEn
                    ? "BIN / IIN prefix checked"
                    : "Префикс BIN / IIN проверен"
                  : result.kind === "pan"
                    ? result.luhnValid
                      ? isEn
                        ? "Luhn checksum passes"
                        : "Контрольная сумма Luhn пройдена"
                      : isEn
                        ? "Luhn checksum fails"
                        : "Ошибка контрольной суммы Luhn"
                    : isEn
                      ? "Input length is not supported"
                      : "Длина ввода не поддерживается"}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {isEn ? result.messageEn : result.messageRu}
              </p>
            </div>
          </div>

          {result.validInput ? (
            <div className="mt-4 grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                  {isEn ? "Payment network range" : "Диапазон платёжной сети"}
                </p>
                <p className="mt-1 text-sm font-bold">
                  {result.network
                    ? `${result.network.name} · ${result.network.range}`
                    : isEn
                      ? "Not recognized by built-in ranges"
                      : "Не распознан встроенными диапазонами"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                  {result.kind === "pan"
                    ? "Luhn"
                    : isEn
                      ? "Digits received"
                      : "Получено цифр"}
                </p>
                <p className="mt-1 text-sm font-bold">
                  {result.kind === "pan"
                    ? result.luhnValid
                      ? isEn
                        ? "Passed"
                        : "Пройдена"
                      : isEn
                        ? "Failed"
                        : "Не пройдена"
                    : result.digitCount}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
            <Info size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              {isEn
                ? "No online BIN database is queried, so issuer and country are not claimed. A passing prefix or Luhn check does not prove that a card exists, is active, or is safe. Full card numbers are not shown in the result or saved by this tool."
                : "Онлайн-база BIN не запрашивается, поэтому эмитент и страна не заявляются. Совпадение диапазона или Luhn не доказывает, что карта существует, активна или безопасна. Полные номера карт не показываются в результате и не сохраняются инструментом."}
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
