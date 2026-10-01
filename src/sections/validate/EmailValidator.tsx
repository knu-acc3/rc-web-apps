"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { checkEmail, ERRORS, type EmailIssue } from "./lib/email";
import { BigInput, Details, Problems, Verdict, type Row } from "./ui/kit";

const T = {
  ru: {
    label: "Адрес электронной почты",
    valid: "Адрес записан правильно",
    validWarn: "Адрес допустим, но необычен",
    invalid: "Адрес записан с ошибкой",
    local: "Имя (до @)",
    domain: "Домен",
    ascii: "Домен в punycode",
    didYouMean: "Возможно, вы имели в виду",
    fix: "Исправить",
    issues: {
      empty: "Введите адрес",
      "no-at": "Нет символа @",
      "local-empty": "Перед @ ничего нет",
      "local-long": "Часть до @ длиннее 64 байт",
      "local-dot": "Точка в начале или в конце имени либо две точки подряд",
      "local-chars": "Недопустимые символы в имени (например, пробел, скобки, запятая или @ без кавычек)",
      "local-quoted": "Имя в кавычках допустимо по RFC 5322, но многие сайты и почтовые сервисы такие адреса не принимают",
      "local-unicode": "Имя с не-латинскими буквами (RFC 6531): работает только на серверах с поддержкой SMTPUTF8",
      "domain-empty": "После @ нет домена",
      "domain-long": "Домен длиннее 253 символов",
      "domain-no-dot": "В домене нет точки — у реальных адресов есть зона, например .ru или .kz",
      "domain-label": "Недопустимые символы в домене — разрешены буквы, цифры и дефис",
      "domain-label-long": "Часть домена между точками длиннее 63 символов",
      "domain-hyphen": "Часть домена начинается или заканчивается дефисом",
      "tld-numeric": "Зона домена состоит из цифр — IP-адрес в адресе почты пишут только в квадратных скобках: user@[192.0.2.1]",
      "tld-short": "Зона домена из одной буквы не существует",
      "ip-literal": "IP-адрес вместо домена допустим по стандарту, но почти нигде не принимается",
      "ip-bad": "Неверный IP-адрес в квадратных скобках",
      idn: "Кириллический домен: при отправке он автоматически переводится в punycode",
      "total-long": "Адрес длиннее 254 символов",
      spaces: "В адресе есть пробелы",
    } as Record<EmailIssue, string>,
    note: "Проверяется только запись адреса. Существует ли почтовый ящик, по одной записи узнать нельзя — для этого нужно отправить письмо. Сетевых запросов инструмент не делает.",
  },
  en: {
    label: "Email address",
    valid: "The address is written correctly",
    validWarn: "The address is allowed but unusual",
    invalid: "The address has an error",
    local: "Local part (before @)",
    domain: "Domain",
    ascii: "Domain in punycode",
    didYouMean: "Did you mean",
    fix: "Fix",
    issues: {
      empty: "Enter an address",
      "no-at": "There is no @",
      "local-empty": "Nothing before the @",
      "local-long": "The part before @ is longer than 64 bytes",
      "local-dot": "A dot at the start or end of the local part, or two dots in a row",
      "local-chars": "Illegal characters in the local part (e.g. a space, parentheses, comma or an unquoted @)",
      "local-quoted": "A quoted local part is allowed by RFC 5322, but many sites and mail services reject it",
      "local-unicode": "Non-Latin letters in the local part (RFC 6531) work only with SMTPUTF8 servers",
      "domain-empty": "No domain after the @",
      "domain-long": "The domain is longer than 253 characters",
      "domain-no-dot": "The domain has no dot — real addresses have a TLD like .com",
      "domain-label": "Illegal characters in the domain — letters, digits and hyphens only",
      "domain-label-long": "A domain label is longer than 63 characters",
      "domain-hyphen": "A domain label starts or ends with a hyphen",
      "tld-numeric": "The top-level domain is numeric — IP addresses must be in brackets: user@[192.0.2.1]",
      "tld-short": "One-letter top-level domains don't exist",
      "ip-literal": "An IP address instead of a domain is allowed by the standard but rarely accepted",
      "ip-bad": "Invalid IP address in brackets",
      idn: "Internationalised domain: it is converted to punycode when sending",
      "total-long": "The address is longer than 254 characters",
      spaces: "The address contains spaces",
    } as Record<EmailIssue, string>,
    note: "Only the syntax is checked. Whether the mailbox exists can't be known from the address alone — only by sending a message. The tool makes no network requests.",
  },
} as const;

export default function EmailValidator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState("ivan.petrov@gmial.com");
  const r = checkEmail(text);
  const empty = r.issues[0] === "empty";
  const errors = r.issues.filter((i) => ERRORS.has(i));
  const notes = r.issues.filter((i) => !ERRORS.has(i));
  const rows: Row[] = [];
  if (r.local) rows.push({ label: t.local, value: r.local, mono: true });
  if (r.domain) rows.push({ label: t.domain, value: r.domain, mono: true });
  if (r.asciiDomain) rows.push({ label: t.ascii, value: r.asciiDomain, mono: true });

  return (
    <div className="flex flex-col gap-4">
      <BigInput id={`${id}-e`} label={t.label} value={text} onChange={setText} inputMode="email" placeholder="name@example.com" invalid={!empty && !r.valid} />
      {!empty && (
        <Verdict tone={!r.valid ? "err" : notes.length ? "warn" : "ok"} title={!r.valid ? t.invalid : notes.length ? t.validWarn : t.valid}>
          <Problems items={[...errors, ...notes].map((i) => t.issues[i])} />
          {r.suggestion && (
            <div className="flex flex-wrap items-center gap-2">
              <span>
                {t.didYouMean} <span className="font-mono font-semibold text-fg">{`${r.local}@${r.suggestion}`}</span>?
              </span>
              <Button size="sm" variant="outline" onClick={() => setText(`${r.local}@${r.suggestion}`)}>
                {t.fix}
              </Button>
            </div>
          )}
        </Verdict>
      )}
      <Details rows={rows} locale={locale} />
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
