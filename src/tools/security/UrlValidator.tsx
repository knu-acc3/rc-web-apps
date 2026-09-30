"use client";

import { useState } from "react";
import {
  CheckCircle,
  LinkSimple,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type UrlErrorCode = "empty" | "malformed" | "scheme" | "host";

type UrlValidation =
  | {
      valid: true;
      normalized: string;
      scheme: "http" | "https";
      host: string;
      port: string;
      path: string;
      query: string;
      fragment: string;
      hasCredentials: boolean;
    }
  | {
      valid: false;
      error: UrlErrorCode;
      detectedScheme?: string;
    };

function validateUrl(input: string): UrlValidation {
  const value = input.trim();
  if (!value) return { valid: false, error: "empty" };

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { valid: false, error: "malformed" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      error: "scheme",
      detectedScheme: parsed.protocol.replace(/:$/, ""),
    };
  }

  if (!parsed.hostname) return { valid: false, error: "host" };

  return {
    valid: true,
    normalized: parsed.href,
    scheme: parsed.protocol === "https:" ? "https" : "http",
    host: parsed.hostname,
    port: parsed.port,
    path: parsed.pathname || "/",
    query: parsed.search,
    fragment: parsed.hash,
    hasCredentials: Boolean(parsed.username || parsed.password),
  };
}

function errorMessage(
  result: Extract<UrlValidation, { valid: false }>,
  isEn: boolean,
): string {
  if (result.error === "empty") {
    return isEn ? "Enter an absolute URL." : "Введите абсолютный URL.";
  }
  if (result.error === "malformed") {
    return isEn
      ? "The value cannot be parsed as an absolute URL. Include http:// or https://."
      : "Значение нельзя разобрать как абсолютный URL. Укажите http:// или https://.";
  }
  if (result.error === "scheme") {
    const suffix = result.detectedScheme
      ? " (" + result.detectedScheme + ")"
      : "";
    return isEn
      ? "Unsupported scheme" +
          suffix +
          ". This validator accepts only http and https."
      : "Неподдерживаемая схема" +
          suffix +
          ". Валидатор принимает только http и https.";
  }
  return isEn
    ? "A valid http/https URL must include a host."
    : "Корректный http/https URL должен содержать хост.";
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-all font-mono text-sm text-[var(--color-text)]">
        {value || "—"}
      </dd>
    </div>
  );
}

export default function UrlValidator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [result, setResult] = useState<UrlValidation | null>(null);

  return (
    <div
      data-security-tool="url-validator"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn ? "Validate and parse a URL" : "Проверьте и разберите URL"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Enter one absolute http or https URL."
            : "Введите один абсолютный URL со схемой http или https."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(validateUrl(input));
          }}
        >
          <Label htmlFor="url-validator-input">URL</Label>
          <Input
            id="url-validator-input"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoComplete="url"
            spellCheck={false}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setResult(null);
            }}
            placeholder="https://host.tld/path"
            className="mt-2 font-mono"
          />

          <ToolPrimaryAction
            type="submit"
            disabled={!input.trim()}
            className="mt-4"
            leadingIcon={<LinkSimple size={20} weight="bold" />}
          >
            {isEn ? "Validate URL" : "Проверить URL"}
          </ToolPrimaryAction>
        </form>
      </section>

      {result ? (
        <section
          aria-live="polite"
          data-url-result=""
          data-url-valid={String(result.valid)}
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
                      {isEn ? "Valid URL" : "Корректный URL"}
                    </h2>
                    <p
                      data-url-normalized={result.normalized}
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
                      ? "Copy normalized URL"
                      : "Скопировать нормализованный URL"
                  }
                  className="shrink-0"
                />
              </div>

              {result.hasCredentials ? (
                <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-warning-soft)] p-3 text-sm leading-relaxed text-[var(--color-text)]">
                  <Warning
                    size={18}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-[var(--color-warning)]"
                    aria-hidden="true"
                  />
                  <span>
                    {isEn
                      ? "This URL contains embedded credentials. Avoid sharing it or using it in logs."
                      : "URL содержит встроенные учётные данные. Не публикуйте его и не записывайте в логи."}
                  </span>
                </div>
              ) : null}

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <Detail
                  label={isEn ? "Scheme" : "Схема"}
                  value={result.scheme}
                />
                <Detail label={isEn ? "Host" : "Хост"} value={result.host} />
                <Detail
                  label={isEn ? "Port" : "Порт"}
                  value={
                    result.port ||
                    (result.scheme === "https"
                      ? "443 (default)"
                      : "80 (default)")
                  }
                />
                <Detail label={isEn ? "Path" : "Путь"} value={result.path} />
                <Detail
                  label={isEn ? "Query" : "Параметры"}
                  value={result.query}
                />
                <Detail
                  label={isEn ? "Fragment" : "Фрагмент"}
                  value={result.fragment}
                />
              </dl>
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
                  {isEn ? "Invalid URL" : "Некорректный URL"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {errorMessage(result, isEn)}
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
            ? "Browser parser, http/https only, no network request"
            : "Парсер браузера, только http/https, без сетевого запроса"
        }
      >
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "The browser URL parser checks and normalizes syntax without opening the address. Availability, ownership, safety and reputation are not tested."
            : "URL-парсер браузера проверяет и нормализует синтаксис, не открывая адрес. Доступность, владелец, безопасность и репутация не проверяются."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
