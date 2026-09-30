"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type EscapeMode = "code-point" | "utf16-units";

type CuratedEntry = {
  codePoint: number;
  name: string;
  aliases?: readonly string[];
};

type ScalarResult = {
  kind: "scalar";
  codePoint: number;
  character: string;
  name: string | null;
};

type LookupState =
  | { kind: "empty" }
  | ScalarResult
  | { kind: "matches"; matches: CuratedEntry[] }
  | { kind: "error"; messageEn: string; messageRu: string };

const CURATED_NAMES: readonly CuratedEntry[] = [
  { codePoint: 0x0020, name: "SPACE", aliases: ["blank"] },
  { codePoint: 0x0026, name: "AMPERSAND" },
  { codePoint: 0x003c, name: "LESS-THAN SIGN" },
  { codePoint: 0x003e, name: "GREATER-THAN SIGN" },
  { codePoint: 0x00a9, name: "COPYRIGHT SIGN" },
  { codePoint: 0x00ae, name: "REGISTERED SIGN" },
  { codePoint: 0x00b0, name: "DEGREE SIGN" },
  { codePoint: 0x00b1, name: "PLUS-MINUS SIGN" },
  { codePoint: 0x00d7, name: "MULTIPLICATION SIGN" },
  { codePoint: 0x00f7, name: "DIVISION SIGN" },
  {
    codePoint: 0x03a9,
    name: "GREEK CAPITAL LETTER OMEGA",
    aliases: ["omega"],
  },
  {
    codePoint: 0x03c0,
    name: "GREEK SMALL LETTER PI",
    aliases: ["pi"],
  },
  {
    codePoint: 0x0416,
    name: "CYRILLIC CAPITAL LETTER ZHE",
    aliases: ["zhe"],
  },
  { codePoint: 0x20ac, name: "EURO SIGN" },
  { codePoint: 0x2122, name: "TRADE MARK SIGN" },
  { codePoint: 0x2190, name: "LEFTWARDS ARROW", aliases: ["left arrow"] },
  { codePoint: 0x2191, name: "UPWARDS ARROW", aliases: ["up arrow"] },
  { codePoint: 0x2192, name: "RIGHTWARDS ARROW", aliases: ["right arrow"] },
  { codePoint: 0x2193, name: "DOWNWARDS ARROW", aliases: ["down arrow"] },
  { codePoint: 0x221e, name: "INFINITY" },
  { codePoint: 0x2260, name: "NOT EQUAL TO" },
  { codePoint: 0x2264, name: "LESS-THAN OR EQUAL TO" },
  { codePoint: 0x2265, name: "GREATER-THAN OR EQUAL TO" },
  { codePoint: 0x2600, name: "BLACK SUN WITH RAYS", aliases: ["sun"] },
  { codePoint: 0x2605, name: "BLACK STAR", aliases: ["star"] },
  { codePoint: 0x2665, name: "BLACK HEART SUIT" },
  { codePoint: 0x2713, name: "CHECK MARK" },
  { codePoint: 0x2717, name: "BALLOT X" },
  { codePoint: 0x2764, name: "HEAVY BLACK HEART", aliases: ["heart"] },
  { codePoint: 0x1f30d, name: "EARTH GLOBE EUROPE-AFRICA" },
  { codePoint: 0x1f389, name: "PARTY POPPER" },
  { codePoint: 0x1f44d, name: "THUMBS UP SIGN", aliases: ["thumbs up"] },
  { codePoint: 0x1f4a1, name: "ELECTRIC LIGHT BULB", aliases: ["light bulb"] },
  { codePoint: 0x1f525, name: "FIRE" },
  { codePoint: 0x1f600, name: "GRINNING FACE" },
  { codePoint: 0x1f602, name: "FACE WITH TEARS OF JOY" },
  { codePoint: 0x1f680, name: "ROCKET" },
  { codePoint: 0x1f914, name: "THINKING FACE" },
];

const CURATED_BY_CODE_POINT = new Map(
  CURATED_NAMES.map((entry) => [entry.codePoint, entry]),
);

function isUnicodeScalar(codePoint: number): boolean {
  return (
    Number.isInteger(codePoint) &&
    codePoint >= 0 &&
    codePoint <= 0x10ffff &&
    !(codePoint >= 0xd800 && codePoint <= 0xdfff)
  );
}

function formatCodePoint(codePoint: number): string {
  return "U+" + codePoint.toString(16).toUpperCase().padStart(4, "0");
}

function scalarFromCodePoint(codePoint: number): LookupState {
  if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
    return {
      kind: "error",
      messageEn:
        "U+D800–U+DFFF are surrogate code points, not Unicode scalar values.",
      messageRu:
        "U+D800–U+DFFF — суррогатные кодовые позиции, а не скалярные значения Unicode.",
    };
  }

  if (!isUnicodeScalar(codePoint)) {
    return {
      kind: "error",
      messageEn: "A Unicode scalar must be between U+0000 and U+10FFFF.",
      messageRu:
        "Скалярное значение Unicode должно быть в диапазоне U+0000–U+10FFFF.",
    };
  }

  return {
    kind: "scalar",
    codePoint,
    character: String.fromCodePoint(codePoint),
    name: CURATED_BY_CODE_POINT.get(codePoint)?.name ?? null,
  };
}

function normalizeName(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ");
}

function searchCuratedNames(query: string): CuratedEntry[] {
  const normalized = normalizeName(query);
  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length === 0) return [];

  return CURATED_NAMES.filter((entry) => {
    const searchable = normalizeName(
      [entry.name, ...(entry.aliases ?? [])].join(" "),
    );
    return tokens.every((token) => searchable.includes(token));
  })
    .sort((left, right) => {
      const leftStarts = left.name.startsWith(normalized);
      const rightStarts = right.name.startsWith(normalized);
      if (leftStarts !== rightStarts) return leftStarts ? -1 : 1;
      return left.codePoint - right.codePoint;
    })
    .slice(0, 8);
}

function resolveLookup(query: string): LookupState {
  if (query.length === 0) return { kind: "empty" };

  const trimmed = query.trim();
  if (/^U\+/i.test(trimmed)) {
    const codeMatch = trimmed.match(/^U\+([0-9A-F]{1,6})$/i);
    if (!codeMatch) {
      return {
        kind: "error",
        messageEn: "Use U+ followed by one to six hexadecimal digits.",
        messageRu: "После U+ укажите от одной до шести шестнадцатеричных цифр.",
      };
    }
    return scalarFromCodePoint(Number.parseInt(codeMatch[1], 16));
  }

  const scalars = Array.from(query);
  if (scalars.length === 1) {
    const codePoint = scalars[0].codePointAt(0);
    return scalarFromCodePoint(codePoint ?? -1);
  }

  const looksLikeName = /^[\p{L}\p{N}\s_-]+$/u.test(trimmed);
  if (looksLikeName && trimmed.length >= 2) {
    const matches = searchCuratedNames(trimmed);
    if (matches.length > 0) return { kind: "matches", matches };
    return {
      kind: "error",
      messageEn:
        "No match in the curated name index. Scalar conversion still works for any valid character or U+ code.",
      messageRu:
        "В кратком индексе имён совпадений нет. Преобразование работает для любого корректного символа или кода U+.",
    };
  }

  return {
    kind: "error",
    messageEn:
      "This input contains " +
      scalars.length +
      " Unicode code points. Enter exactly one scalar value.",
    messageRu:
      "Ввод содержит " +
      scalars.length +
      " кодовых позиций Unicode. Введите ровно одно скалярное значение.",
  };
}

function utf8Bytes(character: string): string {
  return Array.from(new TextEncoder().encode(character), (byte) =>
    byte.toString(16).toUpperCase().padStart(2, "0"),
  ).join(" ");
}

function utf16Units(character: string): number[] {
  return Array.from({ length: character.length }, (_, index) =>
    character.charCodeAt(index),
  );
}

function formatUtf16(character: string): string {
  return utf16Units(character)
    .map((unit) => unit.toString(16).toUpperCase().padStart(4, "0"))
    .join(" ");
}

function formatJavaScriptEscape(
  codePoint: number,
  character: string,
  mode: EscapeMode,
): string {
  if (mode === "utf16-units") {
    return utf16Units(character)
      .map((unit) => "\\u" + unit.toString(16).toUpperCase().padStart(4, "0"))
      .join("");
  }

  const hex = codePoint.toString(16).toUpperCase();
  return codePoint <= 0xffff
    ? "\\u" + hex.padStart(4, "0")
    : "\\u{" + hex + "}";
}

function hasVisibleGlyph(character: string): boolean {
  return !/[\p{C}\p{Z}]/u.test(character);
}

export default function UnicodeLookup() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [query, setQuery] = useState("");
  const [escapeMode, setEscapeMode] = useState<EscapeMode>("code-point");
  const lookup = resolveLookup(query);

  const scalar = lookup.kind === "scalar" ? lookup : null;
  const codePointLabel = scalar ? formatCodePoint(scalar.codePoint) : "";
  const jsEscape = scalar
    ? formatJavaScriptEscape(scalar.codePoint, scalar.character, escapeMode)
    : "";

  return (
    <div
      data-symbol-tool="unicode-lookup"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {isEn
              ? "Look up one Unicode scalar"
              : "Найдите одно скалярное значение Unicode"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Enter one character, a U+ code, or a name from the curated index."
              : "Введите один символ, код U+ или имя из краткого индекса."}
          </p>
        </div>

        <Label
          htmlFor="unicode-search"
          className="mt-5 block text-sm font-semibold"
        >
          {isEn
            ? "Symbol, U+ code, or Unicode name"
            : "Символ, код U+ или имя Unicode"}
        </Label>
        <div className="relative mt-2">
          <MagnifyingGlass
            size={20}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <Input
            id="unicode-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={lookup.kind === "error"}
            aria-describedby="unicode-search-help"
            placeholder={
              isEn ? "Character, U+code, or name" : "Символ, U+код или имя"
            }
            className="h-12 pl-11 text-lg"
          />
        </div>
        <p
          id="unicode-search-help"
          className="mt-2 text-sm text-[var(--color-text-muted)]"
        >
          {isEn
            ? "One scalar only. Combined emoji and decomposed graphemes contain multiple code points."
            : "Только одно скалярное значение. Составные эмодзи и разложенные графемы содержат несколько кодовых позиций."}
        </p>
      </section>

      <div aria-live="polite">
        {lookup.kind === "empty" ? (
          <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
            {isEn
              ? "The encoding details will appear as you type."
              : "Данные кодировки появятся по мере ввода."}
          </p>
        ) : lookup.kind === "error" ? (
          <p
            role="alert"
            className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4 text-sm font-medium leading-relaxed text-[var(--color-danger)]"
          >
            {isEn ? lookup.messageEn : lookup.messageRu}
          </p>
        ) : lookup.kind === "matches" ? (
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              {isEn ? "Curated name matches" : "Совпадения в кратком индексе"}
            </h2>
            <div className="mt-3 grid gap-2">
              {lookup.matches.map((entry) => {
                const character = String.fromCodePoint(entry.codePoint);
                return (
                  <button
                    key={entry.codePoint}
                    type="button"
                    onClick={() => setQuery(formatCodePoint(entry.codePoint))}
                    className="flex min-h-14 min-w-0 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-left hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] text-2xl">
                      {hasVisibleGlyph(character)
                        ? character
                        : formatCodePoint(entry.codePoint)}
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-bold text-[var(--color-text)]">
                        {entry.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-xs text-[var(--color-text-muted)]">
                        {formatCodePoint(entry.codePoint)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : scalar ? (
          <section
            data-unicode-result=""
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-5xl">
                {hasVisibleGlyph(scalar.character)
                  ? scalar.character
                  : codePointLabel}
              </div>
              <div className="min-w-0">
                <p
                  data-unicode-code-point={codePointLabel}
                  className="font-mono text-2xl font-black text-[var(--color-text)]"
                >
                  {codePointLabel}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-[var(--color-text-muted)]">
                  {scalar.name ??
                    (isEn
                      ? "Name not available in the curated index"
                      : "Имени нет в кратком индексе")}
                </p>
              </div>
            </div>

            <dl className="mt-5 divide-y divide-[var(--color-border-subtle)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <div className="grid min-w-0 gap-1 p-3 sm:grid-cols-[140px_1fr] sm:items-center">
                <dt className="text-sm font-semibold text-[var(--color-text-muted)]">
                  UTF-8
                </dt>
                <dd
                  data-unicode-utf8={utf8Bytes(scalar.character)}
                  className="break-all font-mono text-base font-bold text-[var(--color-text)]"
                >
                  {utf8Bytes(scalar.character)}
                </dd>
              </div>
              <div className="grid min-w-0 gap-1 p-3 sm:grid-cols-[140px_1fr] sm:items-center">
                <dt className="text-sm font-semibold text-[var(--color-text-muted)]">
                  UTF-16
                </dt>
                <dd
                  data-unicode-utf16={formatUtf16(scalar.character)}
                  className="break-all font-mono text-base font-bold text-[var(--color-text)]"
                >
                  {formatUtf16(scalar.character)}
                </dd>
              </div>
              <div className="grid min-w-0 gap-1 p-3 sm:grid-cols-[140px_1fr] sm:items-center">
                <dt className="text-sm font-semibold text-[var(--color-text-muted)]">
                  HTML
                </dt>
                <dd
                  data-unicode-html={
                    "&#x" + scalar.codePoint.toString(16).toUpperCase() + ";"
                  }
                  className="break-all font-mono text-base font-bold text-[var(--color-text)]"
                >
                  {"&#x" + scalar.codePoint.toString(16).toUpperCase() + ";"}
                </dd>
              </div>
              <div className="grid min-w-0 gap-1 p-3 sm:grid-cols-[140px_1fr] sm:items-center">
                <dt className="text-sm font-semibold text-[var(--color-text-muted)]">
                  JavaScript
                </dt>
                <dd
                  data-unicode-js={jsEscape}
                  className="break-all font-mono text-base font-bold text-[var(--color-text)]"
                >
                  {jsEscape}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>

      <AdvancedSettings
        title={isEn ? "Escape format" : "Формат escape-последовательности"}
        description={
          isEn
            ? "Choose the JavaScript representation"
            : "Выберите представление JavaScript"
        }
      >
        <Label htmlFor="unicode-js-mode" className="text-sm font-semibold">
          {isEn ? "JavaScript escape" : "Escape JavaScript"}
        </Label>
        <select
          id="unicode-js-mode"
          value={escapeMode}
          onChange={(event) => setEscapeMode(event.target.value as EscapeMode)}
          className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] sm:text-sm"
        >
          <option value="code-point">
            {isEn ? "Unicode code point" : "Кодовая позиция Unicode"}
          </option>
          <option value="utf16-units">
            {isEn ? "UTF-16 code units" : "Кодовые единицы UTF-16"}
          </option>
        </select>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Encoding calculations support every valid Unicode scalar. Name search intentionally covers only the curated index shown by this tool."
            : "Расчёты кодировок поддерживают любое корректное скалярное значение Unicode. Поиск по имени намеренно ограничен кратким индексом этого инструмента."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
