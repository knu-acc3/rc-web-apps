"use client";

import { useCallback, useState } from "react";
import {
  CalendarBlank,
  CheckCircle,
  IdentificationCard,
  Info,
  XCircle,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

const FIRST_WEIGHTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const SECOND_WEIGHTS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2] as const;
const ALLOWED_IIN_CHARACTERS = /^[\d\s-]+$/u;

interface ChecksumResult {
  valid: boolean;
  expected: number | null;
  actual: number;
  cycle: 1 | 2;
}

interface LegacyCode {
  century: number;
  sexEn: "male" | "female";
  sexRu: "мужской" | "женский";
}

interface LegacyInterpretation {
  codeRecognized: boolean;
  dateValid: boolean;
  date?: string;
  code?: LegacyCode;
}

interface IinResult {
  digits: string;
  charactersValid: boolean;
  lengthValid: boolean;
  checksum?: ChecksumResult;
  legacy?: LegacyInterpretation;
  valid: boolean;
}

const LEGACY_CODES: Readonly<Record<string, LegacyCode>> = {
  "1": { century: 1800, sexEn: "male", sexRu: "мужской" },
  "2": { century: 1800, sexEn: "female", sexRu: "женский" },
  "3": { century: 1900, sexEn: "male", sexRu: "мужской" },
  "4": { century: 1900, sexEn: "female", sexRu: "женский" },
  "5": { century: 2000, sexEn: "male", sexRu: "мужской" },
  "6": { century: 2000, sexEn: "female", sexRu: "женский" },
};

function weightedRemainder(digits: number[], weights: readonly number[]) {
  return (
    digits.reduce((sum, digit, index) => sum + digit * weights[index], 0) % 11
  );
}

function inspectChecksum(digits: string): ChecksumResult {
  const body = Array.from(digits.slice(0, 11), Number);
  const actual = Number(digits[11]);
  const first = weightedRemainder(body, FIRST_WEIGHTS);

  if (first !== 10) {
    return { valid: actual === first, expected: first, actual, cycle: 1 };
  }

  const second = weightedRemainder(body, SECOND_WEIGHTS);
  const expected = second === 10 ? null : second;
  return {
    valid: expected !== null && actual === expected,
    expected,
    actual,
    cycle: 2,
  };
}

function isRealDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function inspectLegacyComponents(digits: string): LegacyInterpretation {
  const code = LEGACY_CODES[digits[6]];
  if (!code) return { codeRecognized: false, dateValid: false };

  const year = code.century + Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const day = Number(digits.slice(4, 6));
  const dateValid = isRealDate(year, month, day);

  return {
    codeRecognized: true,
    dateValid,
    date: dateValid
      ? `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`
      : undefined,
    code,
  };
}

function inspectIin(input: string): IinResult {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/gu, "");
  const charactersValid =
    Boolean(trimmed) && ALLOWED_IIN_CHARACTERS.test(trimmed);
  const lengthValid = digits.length === 12;

  if (!charactersValid || !lengthValid) {
    return {
      digits,
      charactersValid,
      lengthValid,
      valid: false,
    };
  }

  const checksum = inspectChecksum(digits);
  return {
    digits,
    charactersValid,
    lengthValid,
    checksum,
    legacy: inspectLegacyComponents(digits),
    valid: checksum.valid,
  };
}

function CheckRow({
  passed,
  label,
  value,
}: {
  passed: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--color-border-subtle)] py-3 last:border-b-0">
      {passed ? (
        <CheckCircle
          size={20}
          weight="fill"
          className="mt-0.5 shrink-0 text-[var(--color-success)]"
          aria-hidden="true"
        />
      ) : (
        <XCircle
          size={20}
          weight="fill"
          className="mt-0.5 shrink-0 text-[var(--color-danger)]"
          aria-hidden="true"
        />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 break-words text-sm text-[var(--color-text-muted)]">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function IinValidator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [iin, setIin] = useState("");
  const [result, setResult] = useState<IinResult | null>(null);

  const clearResult = useCallback(() => setResult(null), []);

  const checksumValue = result?.checksum
    ? result.checksum.valid
      ? isEn
        ? `Passed on calculation cycle ${result.checksum.cycle}`
        : `Пройдена на ${result.checksum.cycle}-м цикле расчёта`
      : result.checksum.expected === null
        ? isEn
          ? "The two-cycle algorithm produced no valid check digit"
          : "Двухэтапный алгоритм не дал допустимой контрольной цифры"
        : isEn
          ? `Expected ${result.checksum.expected}, received ${result.checksum.actual}`
          : `Ожидалась цифра ${result.checksum.expected}, получена ${result.checksum.actual}`
    : isEn
      ? "Available after a 12-digit input"
      : "Доступна после ввода 12 цифр";

  const legacyValue = result?.legacy
    ? result.legacy.codeRecognized &&
      result.legacy.dateValid &&
      result.legacy.code
      ? isEn
        ? `${result.legacy.date}; ${result.legacy.code.sexEn}; ${result.legacy.code.century}s code range`
        : `${result.legacy.date}; ${result.legacy.code.sexRu}; код диапазона ${result.legacy.code.century}-х`
      : result.legacy.codeRecognized
        ? isEn
          ? "The first six digits do not form a calendar date under the historical interpretation"
          : "Первые шесть цифр не образуют календарную дату в исторической интерпретации"
        : isEn
          ? "The seventh digit is outside the historical 1–6 code range"
          : "Седьмая цифра вне исторического диапазона кодов 1–6"
    : isEn
      ? "Available after a 12-digit input"
      : "Доступна после ввода 12 цифр";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <IdentificationCard size={23} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn ? "Kazakhstan IIN check" : "Проверка ИИН Казахстана"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Checks 12 digits and the official two-cycle checksum locally."
                : "Локально проверяет 12 цифр и двухэтапную контрольную сумму."}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="iin-validator-input">ИИН / IIN</Label>
          <Input
            id="iin-validator-input"
            inputMode="numeric"
            autoComplete="off"
            maxLength={20}
            value={iin}
            onChange={(event) => {
              setIin(event.target.value);
              clearResult();
            }}
            placeholder={isEn ? "Enter 12 digits" : "Введите 12 цифр"}
            className="mt-2 h-12 font-mono text-base tracking-wider"
          />
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!iin.trim()}
          onClick={() => setResult(inspectIin(iin))}
          leadingIcon={<IdentificationCard size={20} aria-hidden="true" />}
        >
          {isEn ? "Check IIN" : "Проверить ИИН"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Algorithm and limits" : "Алгоритм и ограничения"}
          description={
            isEn
              ? "Two checksum cycles and historical components"
              : "Два цикла контрольной суммы и исторические компоненты"
          }
        >
          <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "The first checksum cycle uses weights 1–11. If its remainder is 10, the second cycle uses 3–11, 1, 2. A second remainder of 10 is invalid."
                : "Первый цикл контрольной суммы использует веса 1–11. Если остаток равен 10, второй цикл использует 3–11, 1, 2. Повторный остаток 10 недопустим."}
            </p>
            <p>
              {isEn
                ? "The tool checks only local syntax and checksum. Historical date/century/sex decoding is informational and no state registry or identity is queried."
                : "Инструмент проверяет только локальный формат и контрольную сумму. Историческая расшифровка даты, века и пола справочная; государственный реестр и личность не проверяются."}
            </p>
          </div>
        </AdvancedSettings>
      </Card>

      {result ? (
        <Card
          className="p-4 sm:p-5"
          aria-live="polite"
          aria-labelledby="iin-validator-result-title"
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
            <div className="min-w-0">
              <h2 id="iin-validator-result-title" className="font-bold">
                {result.valid
                  ? isEn
                    ? "Format and checksum pass"
                    : "Формат и контрольная сумма пройдены"
                  : isEn
                    ? "Format or checksum failed"
                    : "Ошибка формата или контрольной суммы"}
              </h2>
              <p className="mt-1 break-all font-mono text-sm text-[var(--color-text-muted)]">
                {result.digits || "—"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <CheckRow
              passed={result.charactersValid && result.lengthValid}
              label={isEn ? "Format" : "Формат"}
              value={
                result.charactersValid && result.lengthValid
                  ? isEn
                    ? "Exactly 12 digits"
                    : "Ровно 12 цифр"
                  : !result.charactersValid
                    ? isEn
                      ? "Only digits, spaces and hyphens are accepted"
                      : "Допустимы только цифры, пробелы и дефисы"
                    : isEn
                      ? `Found ${result.digits.length} digits instead of 12`
                      : `Найдено цифр: ${result.digits.length}, требуется 12`
              }
            />
            <CheckRow
              passed={Boolean(result.checksum?.valid)}
              label={isEn ? "Checksum" : "Контрольная сумма"}
              value={checksumValue}
            />
          </div>

          {result.lengthValid && result.charactersValid ? (
            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
              <div className="flex items-start gap-3">
                <CalendarBlank
                  size={20}
                  className="mt-0.5 shrink-0 text-[var(--color-text-muted)]"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {isEn
                      ? "Historical date / century / sex interpretation"
                      : "Историческая интерпретация даты / века / пола"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {legacyValue}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
            <Info size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              {isEn
                ? "This does not query the state registry and cannot confirm a person or identity. Under current Kazakhstan guidance, IIN digits are technical; the historical date/century/sex interpretation is informational and does not determine the result."
                : "Инструмент не обращается к государственному реестру и не подтверждает человека или личность. По актуальному разъяснению Казахстана цифры ИИН имеют техническое значение; историческая интерпретация даты, века и пола справочная и не определяет результат."}
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
