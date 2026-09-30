"use client";

import { useState } from "react";
import { Check, Copy, MagnifyingGlass } from "@phosphor-icons/react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type Category =
  "all" | "arrows" | "math" | "currency" | "marks" | "technical" | "shapes";
type SearchScope = "all" | "name" | "code";
type CopyFormat = "symbol" | "unicode" | "html";

interface SymbolEntry {
  symbol: string;
  category: Exclude<Category, "all">;
  nameEn: string;
  nameRu: string;
}

const SYMBOLS: readonly SymbolEntry[] = [
  {
    symbol: "←",
    category: "arrows",
    nameEn: "Left arrow",
    nameRu: "Стрелка влево",
  },
  {
    symbol: "↑",
    category: "arrows",
    nameEn: "Up arrow",
    nameRu: "Стрелка вверх",
  },
  {
    symbol: "→",
    category: "arrows",
    nameEn: "Right arrow",
    nameRu: "Стрелка вправо",
  },
  {
    symbol: "↓",
    category: "arrows",
    nameEn: "Down arrow",
    nameRu: "Стрелка вниз",
  },
  {
    symbol: "↔",
    category: "arrows",
    nameEn: "Left-right arrow",
    nameRu: "Стрелка влево-вправо",
  },
  {
    symbol: "↕",
    category: "arrows",
    nameEn: "Up-down arrow",
    nameRu: "Стрелка вверх-вниз",
  },
  {
    symbol: "↩",
    category: "arrows",
    nameEn: "Left arrow with hook",
    nameRu: "Стрелка влево с крюком",
  },
  {
    symbol: "↪",
    category: "arrows",
    nameEn: "Right arrow with hook",
    nameRu: "Стрелка вправо с крюком",
  },
  {
    symbol: "⇒",
    category: "arrows",
    nameEn: "Right double arrow",
    nameRu: "Двойная стрелка вправо",
  },
  {
    symbol: "⇔",
    category: "arrows",
    nameEn: "Left-right double arrow",
    nameRu: "Двойная стрелка в обе стороны",
  },

  { symbol: "±", category: "math", nameEn: "Plus-minus", nameRu: "Плюс-минус" },
  {
    symbol: "×",
    category: "math",
    nameEn: "Multiplication sign",
    nameRu: "Знак умножения",
  },
  {
    symbol: "÷",
    category: "math",
    nameEn: "Division sign",
    nameRu: "Знак деления",
  },
  {
    symbol: "≈",
    category: "math",
    nameEn: "Approximately equal",
    nameRu: "Приблизительно равно",
  },
  { symbol: "≠", category: "math", nameEn: "Not equal", nameRu: "Не равно" },
  {
    symbol: "≤",
    category: "math",
    nameEn: "Less than or equal",
    nameRu: "Меньше или равно",
  },
  {
    symbol: "≥",
    category: "math",
    nameEn: "Greater than or equal",
    nameRu: "Больше или равно",
  },
  {
    symbol: "∞",
    category: "math",
    nameEn: "Infinity",
    nameRu: "Бесконечность",
  },
  {
    symbol: "√",
    category: "math",
    nameEn: "Square root",
    nameRu: "Квадратный корень",
  },
  { symbol: "∑", category: "math", nameEn: "Summation", nameRu: "Сумма" },

  {
    symbol: "$",
    category: "currency",
    nameEn: "Dollar sign",
    nameRu: "Знак доллара",
  },
  {
    symbol: "€",
    category: "currency",
    nameEn: "Euro sign",
    nameRu: "Знак евро",
  },
  {
    symbol: "£",
    category: "currency",
    nameEn: "Pound sign",
    nameRu: "Знак фунта",
  },
  {
    symbol: "¥",
    category: "currency",
    nameEn: "Yen sign",
    nameRu: "Знак йены",
  },
  {
    symbol: "₽",
    category: "currency",
    nameEn: "Ruble sign",
    nameRu: "Знак рубля",
  },
  {
    symbol: "₹",
    category: "currency",
    nameEn: "Rupee sign",
    nameRu: "Знак рупии",
  },
  {
    symbol: "₩",
    category: "currency",
    nameEn: "Won sign",
    nameRu: "Знак воны",
  },
  {
    symbol: "₿",
    category: "currency",
    nameEn: "Bitcoin sign",
    nameRu: "Знак биткоина",
  },
  {
    symbol: "¢",
    category: "currency",
    nameEn: "Cent sign",
    nameRu: "Знак цента",
  },

  {
    symbol: "©",
    category: "marks",
    nameEn: "Copyright sign",
    nameRu: "Знак авторского права",
  },
  {
    symbol: "®",
    category: "marks",
    nameEn: "Registered sign",
    nameRu: "Знак регистрации",
  },
  {
    symbol: "™",
    category: "marks",
    nameEn: "Trademark sign",
    nameRu: "Знак товарной марки",
  },
  {
    symbol: "§",
    category: "marks",
    nameEn: "Section sign",
    nameRu: "Знак параграфа",
  },
  {
    symbol: "¶",
    category: "marks",
    nameEn: "Paragraph sign",
    nameRu: "Знак абзаца",
  },
  { symbol: "•", category: "marks", nameEn: "Bullet", nameRu: "Маркер списка" },
  { symbol: "…", category: "marks", nameEn: "Ellipsis", nameRu: "Многоточие" },
  { symbol: "—", category: "marks", nameEn: "Em dash", nameRu: "Длинное тире" },
  { symbol: "–", category: "marks", nameEn: "En dash", nameRu: "Среднее тире" },
  {
    symbol: "†",
    category: "marks",
    nameEn: "Dagger",
    nameRu: "Крестик-сноска",
  },

  {
    symbol: "✓",
    category: "technical",
    nameEn: "Check mark",
    nameRu: "Галочка",
  },
  {
    symbol: "✔",
    category: "technical",
    nameEn: "Heavy check mark",
    nameRu: "Жирная галочка",
  },
  {
    symbol: "✕",
    category: "technical",
    nameEn: "Multiplication X",
    nameRu: "Крестик умножения",
  },
  {
    symbol: "✖",
    category: "technical",
    nameEn: "Heavy multiplication X",
    nameRu: "Жирный крестик",
  },
  {
    symbol: "★",
    category: "technical",
    nameEn: "Black star",
    nameRu: "Закрашенная звезда",
  },
  {
    symbol: "☆",
    category: "technical",
    nameEn: "White star",
    nameRu: "Контурная звезда",
  },
  {
    symbol: "♥",
    category: "technical",
    nameEn: "Black heart",
    nameRu: "Закрашенное сердце",
  },
  {
    symbol: "♡",
    category: "technical",
    nameEn: "White heart",
    nameRu: "Контурное сердце",
  },
  {
    symbol: "⌘",
    category: "technical",
    nameEn: "Command key",
    nameRu: "Клавиша Command",
  },
  {
    symbol: "⏎",
    category: "technical",
    nameEn: "Return symbol",
    nameRu: "Символ возврата",
  },

  {
    symbol: "○",
    category: "shapes",
    nameEn: "White circle",
    nameRu: "Контурный круг",
  },
  {
    symbol: "●",
    category: "shapes",
    nameEn: "Black circle",
    nameRu: "Закрашенный круг",
  },
  {
    symbol: "□",
    category: "shapes",
    nameEn: "White square",
    nameRu: "Контурный квадрат",
  },
  {
    symbol: "■",
    category: "shapes",
    nameEn: "Black square",
    nameRu: "Закрашенный квадрат",
  },
  {
    symbol: "△",
    category: "shapes",
    nameEn: "White up triangle",
    nameRu: "Контурный треугольник вверх",
  },
  {
    symbol: "▲",
    category: "shapes",
    nameEn: "Black up triangle",
    nameRu: "Закрашенный треугольник вверх",
  },
  {
    symbol: "▽",
    category: "shapes",
    nameEn: "White down triangle",
    nameRu: "Контурный треугольник вниз",
  },
  {
    symbol: "▼",
    category: "shapes",
    nameEn: "Black down triangle",
    nameRu: "Закрашенный треугольник вниз",
  },
  {
    symbol: "◇",
    category: "shapes",
    nameEn: "White diamond",
    nameRu: "Контурный ромб",
  },
  {
    symbol: "◆",
    category: "shapes",
    nameEn: "Black diamond",
    nameRu: "Закрашенный ромб",
  },
];

const FEATURED = new Set([
  "→",
  "←",
  "✓",
  "©",
  "™",
  "•",
  "…",
  "—",
  "±",
  "∞",
  "€",
  "★",
]);

function codePointHex(symbol: string) {
  return symbol.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0");
}

function copyValue(entry: SymbolEntry, format: CopyFormat) {
  const hex = codePointHex(entry.symbol);
  if (format === "unicode") return "U+" + hex;
  if (format === "html") return "&#x" + hex + ";";
  return entry.symbol;
}

function categoryLabel(category: Category, isEn: boolean) {
  const labels: Record<Category, [string, string]> = {
    all: ["Все категории", "All categories"],
    arrows: ["Стрелки", "Arrows"],
    math: ["Математика", "Math"],
    currency: ["Валюты", "Currency"],
    marks: ["Текстовые знаки", "Text marks"],
    technical: ["Полезные знаки", "Useful marks"],
    shapes: ["Фигуры", "Shapes"],
  };
  return labels[category][isEn ? 1 : 0];
}

export default function SymbolCatalog() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [scope, setScope] = useState<SearchScope>("all");
  const [format, setFormat] = useState<CopyFormat>("symbol");
  const [copiedSymbol, setCopiedSymbol] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const categoryEntries = SYMBOLS.filter(
    (entry) => category === "all" || entry.category === category,
  );
  const matchedEntries = categoryEntries.filter((entry) => {
    if (!normalizedQuery) return true;
    const hex = codePointHex(entry.symbol).toLowerCase();
    const names = (entry.nameEn + " " + entry.nameRu).toLowerCase();
    if (scope === "name") return names.includes(normalizedQuery);
    if (scope === "code") {
      return (
        entry.symbol === query.trim() ||
        hex.includes(normalizedQuery.replace(/^(u\+|0x|#x)/, ""))
      );
    }
    return (
      entry.symbol === query.trim() ||
      names.includes(normalizedQuery) ||
      categoryLabel(entry.category, isEn)
        .toLowerCase()
        .includes(normalizedQuery) ||
      hex.includes(normalizedQuery.replace(/^(u\+|0x|#x)/, ""))
    );
  });
  const visibleEntries = normalizedQuery
    ? matchedEntries.slice(0, 24)
    : category === "all"
      ? categoryEntries
          .filter((entry) => FEATURED.has(entry.symbol))
          .slice(0, 12)
      : categoryEntries.slice(0, 12);

  const handleCopy = async (entry: SymbolEntry) => {
    const success = await copyText(copyValue(entry, format));
    setCopyFailed(!success);
    if (!success) return;
    setCopiedSymbol(entry.symbol);
    window.setTimeout(() => setCopiedSymbol(""), 1_500);
  };

  const resultMessage = normalizedQuery
    ? matchedEntries.length === 0
      ? isEn
        ? "No matching symbols"
        : "Совпадений нет"
      : isEn
        ? matchedEntries.length +
          " matches; showing up to " +
          Math.min(24, matchedEntries.length)
        : "Найдено: " +
          matchedEntries.length +
          "; показано до " +
          Math.min(24, matchedEntries.length)
    : isEn
      ? `Search ${SYMBOLS.length} curated symbols or choose from the compact useful set`
      : `Поиск по ${SYMBOLS.length} отобранным символам или выбор из компактного набора`;

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="symbol-search">
          {isEn ? "Find a symbol" : "Найти символ"}
        </Label>
        <div className="relative mt-1.5">
          <MagnifyingGlass
            size={19}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          />
          <Input
            id="symbol-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCopiedSymbol("");
              setCopyFailed(false);
            }}
            placeholder={
              isEn
                ? "Name, symbol or Unicode code"
                : "Название, знак или Unicode-код"
            }
            className="h-12 pl-10 text-base"
            autoComplete="off"
          />
        </div>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Search settings" : "Настройки поиска"}
          description={
            isEn
              ? "Category, search field and copy format"
              : "Категория, область поиска и формат копирования"
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="min-w-0">
              <Label htmlFor="symbol-category">
                {isEn ? "Category" : "Категория"}
              </Label>
              <select
                id="symbol-category"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as Category);
                  setCopiedSymbol("");
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                {(
                  [
                    "all",
                    "arrows",
                    "math",
                    "currency",
                    "marks",
                    "technical",
                    "shapes",
                  ] as const
                ).map((value) => (
                  <option key={value} value={value}>
                    {categoryLabel(value, isEn)}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <Label htmlFor="symbol-scope">
                {isEn ? "Search in" : "Искать в"}
              </Label>
              <select
                id="symbol-scope"
                value={scope}
                onChange={(event) =>
                  setScope(event.target.value as SearchScope)
                }
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="all">{isEn ? "Everything" : "Везде"}</option>
                <option value="name">
                  {isEn ? "Names only" : "Только названия"}
                </option>
                <option value="code">
                  {isEn ? "Code point only" : "Только код"}
                </option>
              </select>
            </div>

            <div className="min-w-0">
              <Label htmlFor="symbol-copy-format">
                {isEn ? "Copy format" : "Формат копирования"}
              </Label>
              <select
                id="symbol-copy-format"
                value={format}
                onChange={(event) => {
                  setFormat(event.target.value as CopyFormat);
                  setCopiedSymbol("");
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="symbol">{isEn ? "Symbol" : "Символ"}</option>
                <option value="unicode">Unicode (U+)</option>
                <option value="html">HTML entity</option>
              </select>
            </div>
          </div>
        </AdvancedSettings>

        <div className="mt-4 flex min-h-11 items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
          <p
            aria-live="polite"
            className="text-sm text-[var(--color-text-muted)]"
          >
            {resultMessage}
          </p>
          {normalizedQuery && matchedEntries.length > 24 ? (
            <span className="shrink-0 text-xs font-semibold text-[var(--color-text-subtle)]">
              24 max
            </span>
          ) : null}
        </div>

        {visibleEntries.length > 0 ? (
          <ul className="divide-y divide-[var(--color-border)]">
            {visibleEntries.map((entry) => {
              const hex = codePointHex(entry.symbol);
              const copied = copiedSymbol === entry.symbol;
              return (
                <li key={entry.symbol}>
                  <button
                    type="button"
                    onClick={() => void handleCopy(entry)}
                    aria-label={
                      (isEn ? "Copy " : "Копировать ") +
                      copyValue(entry, format)
                    }
                    className="flex min-h-14 w-full min-w-0 items-center gap-3 py-2.5 text-left transition-colors hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary-ring)]"
                  >
                    <span
                      className="w-12 shrink-0 text-center text-2xl font-semibold text-[var(--color-text)]"
                      aria-hidden="true"
                    >
                      {entry.symbol}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[var(--color-text)]">
                        {isEn ? entry.nameEn : entry.nameRu}
                      </span>
                      <span className="mt-0.5 block font-mono text-xs text-[var(--color-text-muted)]">
                        U+{hex}
                      </span>
                    </span>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--color-text-muted)]">
                      {copied ? (
                        <Check size={19} weight="bold" aria-hidden="true" />
                      ) : (
                        <Copy size={19} aria-hidden="true" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            {isEn
              ? "Try another name, symbol or code point."
              : "Попробуйте другое название, знак или код."}
          </div>
        )}

        {copyFailed ? (
          <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
            {isEn
              ? "Clipboard access was denied."
              : "Браузер запретил доступ к буферу обмена."}
          </p>
        ) : null}

        <p className="mt-4 border-t border-[var(--color-border-subtle)] pt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "Curated reference of " +
              SYMBOLS.length +
              " commonly used Unicode symbols across 6 categories. This is not a complete Unicode database."
            : "Кураторский справочник из " +
              SYMBOLS.length +
              " часто используемых Unicode-символов в 6 категориях. Это не полная база Unicode."}
        </p>
      </section>
    </div>
  );
}
