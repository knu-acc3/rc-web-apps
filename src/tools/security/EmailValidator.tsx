"use client";

import { useState } from "react";
import { CheckCircle, EnvelopeSimple, XCircle } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type EmailErrorCode =
  | "empty"
  | "separator"
  | "unicode-local"
  | "local-length"
  | "local-syntax"
  | "domain-syntax"
  | "domain-length"
  | "total-length";

type EmailValidation =
  | {
      valid: true;
      normalized: string;
      localPart: string;
      unicodeDomain: string;
      asciiDomain: string;
      localBytes: number;
      totalBytes: number;
    }
  | {
      valid: false;
      error: EmailErrorCode;
    };

const DOT_ATOM =
  /^[A-Za-z0-9!#$%&'*+/=?^_{}\x60|~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_{}\x60|~-]+)*$/;
const ASCII_DOMAIN_LABEL = /^[A-Za-z0-9-]+$/;

function normalizeDomain(domain: string): string | null {
  if (!domain) return null;
  if (/^\[(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\]$/.test(domain)) {
    return domain;
  }
  if (domain.endsWith(".") || /[\s/@\\?#:[\]]/.test(domain)) {
    return null;
  }

  try {
    const parsed = new URL("http://" + domain);
    if (
      !parsed.hostname ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function validateEmail(input: string): EmailValidation {
  const value = input.trim();
  if (!value) return { valid: false, error: "empty" };

  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@") || at === value.length - 1) {
    return { valid: false, error: "separator" };
  }

  const localPart = value.slice(0, at);
  const unicodeDomain = value.slice(at + 1);

  if (/[^\x00-\x7F]/.test(localPart)) {
    return { valid: false, error: "unicode-local" };
  }

  const localBytes = new TextEncoder().encode(localPart).length;
  if (localBytes > 64) return { valid: false, error: "local-length" };
  if (!DOT_ATOM.test(localPart)) {
    return { valid: false, error: "local-syntax" };
  }

  const asciiDomain = normalizeDomain(unicodeDomain);
  if (!asciiDomain) return { valid: false, error: "domain-syntax" };

  const isIpLiteral = /^\[(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\]$/.test(asciiDomain);
  if (!isIpLiteral) {
    const labels = asciiDomain.split(".");
    if (
      asciiDomain.length > 253 ||
      labels.some(
        (label) =>
          label.length === 0 ||
          label.length > 63 ||
          !ASCII_DOMAIN_LABEL.test(label) ||
          label.startsWith("-") ||
          label.endsWith("-"),
      )
    ) {
      return {
        valid: false,
        error: asciiDomain.length > 253 ? "domain-length" : "domain-syntax",
      };
    }
  }

  const normalized = localPart + "@" + asciiDomain;
  const totalBytes = new TextEncoder().encode(normalized).length;
  if (totalBytes > 254) {
    return { valid: false, error: "total-length" };
  }

  return {
    valid: true,
    normalized,
    localPart,
    unicodeDomain,
    asciiDomain,
    localBytes,
    totalBytes,
  };
}

function errorMessage(code: EmailErrorCode, isEn: boolean): string {
  const messages: Record<EmailErrorCode, { en: string; ru: string }> = {
    empty: {
      en: "Enter an email address.",
      ru: "Введите email-адрес.",
    },
    separator: {
      en: "Use exactly one @ with text on both sides.",
      ru: "Используйте ровно один знак @ и текст с обеих сторон.",
    },
    "unicode-local": {
      en: "Internationalized local parts are not supported by this syntax check.",
      ru: "Эта проверка синтаксиса не поддерживает международные символы до знака @.",
    },
    "local-length": {
      en: "The local part before @ exceeds 64 bytes.",
      ru: "Часть адреса до знака @ превышает 64 байта.",
    },
    "local-syntax": {
      en: "The local part must use common dot-atom syntax without leading, trailing or repeated dots.",
      ru: "Часть до знака @ должна использовать обычный dot-atom синтаксис без начальной, конечной или повторяющейся точки.",
    },
    "domain-syntax": {
      en: "The domain is malformed. Labels may contain letters, digits and internal hyphens.",
      ru: "Домен записан некорректно. Метки могут содержать буквы, цифры и дефисы внутри.",
    },
    "domain-length": {
      en: "The normalized domain exceeds DNS length limits.",
      ru: "Нормализованный домен превышает ограничения длины DNS.",
    },
    "total-length": {
      en: "The normalized email address exceeds 254 bytes.",
      ru: "Нормализованный email-адрес превышает 254 байта.",
    },
  };

  return isEn ? messages[code].en : messages[code].ru;
}

export default function EmailValidator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [result, setResult] = useState<EmailValidation | null>(null);

  return (
    <div
      data-security-tool="email-validator"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn ? "Check email syntax" : "Проверьте синтаксис email"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Checks one address for common syntax and length limits."
            : "Проверяет один адрес по распространённому синтаксису и ограничениям длины."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(validateEmail(input));
          }}
        >
          <Label htmlFor="email-validator-input">
            {isEn ? "Email address" : "Email-адрес"}
          </Label>
          <Input
            id="email-validator-input"
            type="text"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setResult(null);
            }}
            placeholder="user@domain.tld"
            className="mt-2 font-mono"
          />

          <ToolPrimaryAction
            type="submit"
            disabled={!input.trim()}
            className="mt-4"
            leadingIcon={<EnvelopeSimple size={20} weight="bold" />}
          >
            {isEn ? "Validate email" : "Проверить email"}
          </ToolPrimaryAction>
        </form>
      </section>

      {result ? (
        <section
          aria-live="polite"
          data-email-result=""
          data-email-valid={String(result.valid)}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          {result.valid ? (
            <>
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <CheckCircle
                    size={24}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-[var(--color-success)]"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[var(--color-success)]">
                      {isEn
                        ? "Valid supported syntax"
                        : "Поддерживаемый синтаксис корректен"}
                    </h2>
                    <p
                      data-email-normalized={result.normalized}
                      className="mt-1 break-all font-mono text-sm"
                    >
                      {result.normalized}
                    </p>
                  </div>
                </div>
                <CopyButton
                  text={result.normalized}
                  size="medium"
                  tooltip={
                    isEn
                      ? "Copy normalized email"
                      : "Скопировать нормализованный email"
                  }
                  className="shrink-0"
                />
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {isEn ? "Local part" : "Часть до @"}
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm">
                    {result.localPart}
                  </dd>
                  <dd className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {result.localBytes}/64 {isEn ? "bytes" : "байт"}
                  </dd>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {isEn ? "Domain" : "Домен"}
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm">
                    {result.asciiDomain}
                  </dd>
                  {result.unicodeDomain.toLowerCase() !== result.asciiDomain ? (
                    <dd className="mt-1 break-all text-xs text-[var(--color-text-muted)]">
                      {result.unicodeDomain}
                    </dd>
                  ) : null}
                </div>
              </dl>

              <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                {result.totalBytes}/254{" "}
                {isEn
                  ? "bytes in the normalized address"
                  : "байт в нормализованном адресе"}
              </p>
            </>
          ) : (
            <div role="alert" className="flex items-start gap-3">
              <XCircle
                size={24}
                weight="fill"
                className="mt-0.5 shrink-0 text-[var(--color-danger)]"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-lg font-bold text-[var(--color-danger)]">
                  {isEn
                    ? "Invalid email syntax"
                    : "Некорректный синтаксис email"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {errorMessage(result.error, isEn)}
                </p>
              </div>
            </div>
          )}
        </section>
      ) : null}

      <AdvancedSettings
        title={isEn ? "Validation scope" : "Границы проверки"}
        description={
          isEn
            ? "Syntax and length only"
            : "Только синтаксис и ограничения длины"
        }
      >
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Unicode domains are normalized to ASCII with the browser URL parser. The local part supports common ASCII dot-atom syntax, not quoted or internationalized forms. Domain, mailbox and delivery-route existence are not checked."
            : "Unicode-домены нормализуются в ASCII через URL-парсер браузера. Для части до @ поддерживается распространённый ASCII dot-atom синтаксис без кавычек и международных форм. Существование домена, ящика и маршрута доставки не проверяется."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
