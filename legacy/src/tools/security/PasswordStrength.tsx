"use client";

import { useState } from "react";
import {
  CheckCircle,
  Eye,
  EyeSlash,
  ShieldCheck,
  XCircle,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

const COMMON_PASSWORDS = new Set([
  "123456",
  "12345678",
  "123456789",
  "password",
  "password1",
  "qwerty",
  "qwerty123",
  "admin",
  "letmein",
  "welcome",
  "abc123",
  "iloveyou",
]);

const OBVIOUS_SEQUENCES = [
  "012345",
  "123456",
  "234567",
  "345678",
  "456789",
  "987654",
  "abcdef",
  "qwerty",
  "asdfgh",
];

interface PasswordAnalysis {
  score: number;
  length: number;
  variety: number;
  isCommon: boolean;
  hasObviousPattern: boolean;
  checks: {
    length12: boolean;
    length16: boolean;
    composition: boolean;
    unique: boolean;
    patternFree: boolean;
  };
}

function analyzePassword(password: string): PasswordAnalysis {
  const length = Array.from(password).length;
  const lower = password.toLocaleLowerCase();
  const isCommon = COMMON_PASSWORDS.has(lower);
  const hasObviousPattern =
    /(.)\1{2,}/u.test(password) ||
    OBVIOUS_SEQUENCES.some((sequence) => lower.includes(sequence));
  const variety = [
    /\p{Ll}/u.test(password),
    /\p{Lu}/u.test(password),
    /\p{N}/u.test(password),
    /[^\p{L}\p{N}\s]/u.test(password),
  ].filter(Boolean).length;
  const composition = variety >= 3 || length >= 20;

  let score =
    length >= 20
      ? 4
      : length >= 16
        ? 3
        : length >= 12
          ? 2
          : length >= 8
            ? 1
            : 0;

  if (length >= 12 && variety >= 3) score = Math.min(4, score + 1);
  if (hasObviousPattern) score = Math.max(0, score - 1);
  if (isCommon) score = 0;

  return {
    score,
    length,
    variety,
    isCommon,
    hasObviousPattern,
    checks: {
      length12: length >= 12,
      length16: length >= 16,
      composition,
      unique: !isCommon,
      patternFree: !hasObviousPattern,
    },
  };
}

export default function PasswordStrength() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<PasswordAnalysis | null>(null);

  const labels = isEn
    ? ["Very weak", "Weak", "Fair", "Strong", "Very strong"]
    : ["Очень слабый", "Слабый", "Средний", "Надёжный", "Очень надёжный"];
  const levelColors = [
    "var(--color-danger)",
    "var(--color-danger)",
    "var(--color-warning)",
    "var(--color-success)",
    "var(--color-success)",
  ];

  const criteria = result
    ? [
        {
          passed: result.checks.length12,
          label: isEn ? "At least 12 characters" : "Не менее 12 символов",
        },
        {
          passed: result.checks.length16,
          label: isEn ? "16 or more is better" : "16 и более — предпочтительно",
        },
        {
          passed: result.checks.composition,
          label: isEn
            ? "Three character types or a 20+ character passphrase"
            : "Три типа символов или фраза длиной от 20 символов",
        },
        {
          passed: result.checks.unique,
          label: isEn
            ? "Not in the short common-password list"
            : "Нет в кратком списке распространённых паролей",
        },
        {
          passed: result.checks.patternFree,
          label: isEn
            ? "No obvious sequence or triple repetition"
            : "Нет очевидной последовательности или тройного повтора",
        },
      ]
    : [];

  return (
    <div
      data-security-tool="password-strength"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn ? "Estimate password strength" : "Оцените надёжность пароля"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Check length, character variety, common passwords and obvious patterns."
            : "Проверьте длину, разнообразие символов, распространённость и очевидные шаблоны."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (password) setResult(analyzePassword(password));
          }}
        >
          <Label htmlFor="password-strength-input">
            {isEn ? "Password" : "Пароль"}
          </Label>
          <div className="mt-2 flex min-w-0 gap-2">
            <Input
              id="password-strength-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setResult(null);
              }}
              placeholder={isEn ? "Enter a password" : "Введите пароль"}
              className="min-w-0 flex-1 font-mono"
              autoComplete="new-password"
              autoCapitalize="none"
              spellCheck={false}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={
                showPassword
                  ? isEn
                    ? "Hide password"
                    : "Скрыть пароль"
                  : isEn
                    ? "Show password"
                    : "Показать пароль"
              }
              className="shrink-0"
            >
              {showPassword ? (
                <EyeSlash size={20} aria-hidden="true" />
              ) : (
                <Eye size={20} aria-hidden="true" />
              )}
            </Button>
          </div>

          <ToolPrimaryAction
            type="submit"
            disabled={!password}
            className="mt-4"
            leadingIcon={<ShieldCheck size={20} weight="bold" />}
          >
            {isEn ? "Check strength" : "Проверить надёжность"}
          </ToolPrimaryAction>
        </form>
      </section>

      {result ? (
        <section
          aria-live="polite"
          data-password-result=""
          data-password-score={result.score}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={26}
              weight="fill"
              className="mt-0.5 shrink-0"
              style={{ color: levelColors[result.score] }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <h2
                className="text-lg font-bold"
                style={{ color: levelColors[result.score] }}
              >
                {labels[result.score]}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {result.length} {isEn ? "characters" : "символов"} ·{" "}
                {result.variety} {isEn ? "character types" : "типа символов"}
              </p>
            </div>
          </div>

          <div
            className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full"
              style={{
                width: String((result.score + 1) * 20) + "%",
                backgroundColor: levelColors[result.score],
              }}
            />
          </div>

          <ul className="mt-4 grid gap-2">
            {criteria.map((criterion) => (
              <li
                key={criterion.label}
                className="flex items-start gap-2 text-sm leading-relaxed"
              >
                {criterion.passed ? (
                  <CheckCircle
                    size={18}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-[var(--color-success)]"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    size={18}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-[var(--color-danger)]"
                    aria-hidden="true"
                  />
                )}
                <span>{criterion.label}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AdvancedSettings
        title={isEn ? "About this estimate" : "О границах оценки"}
        description={
          isEn
            ? "Local heuristic, not a security guarantee"
            : "Локальная эвристика, а не гарантия безопасности"
        }
      >
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "The check runs locally in this browser. The password is not logged or included in the result. Use a unique password for every service and store it in a trusted password manager."
            : "Проверка выполняется локально в браузере. Пароль не записывается и не включается в результат. Используйте уникальный пароль для каждого сервиса и храните его в надёжном менеджере паролей."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
