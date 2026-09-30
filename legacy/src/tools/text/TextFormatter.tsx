"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  Copy,
  Check,
  MagicWand,
  ArrowsClockwise,
  ChartBar,
  Quotes,
  Table,
  TextAa,
  ListBullets,
  FunnelSimple,
  Warning,
  Shuffle,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { escapeCsvCellForSpreadsheet } from "@/src/utils/exportHelpers";
import { Card } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { AdvancedSettings } from "@/src/components/tool";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { cn } from "@/src/lib/cn";
import { cryptoRandomInt, cryptoShuffle } from "@/src/lib/cryptoRandom";
import { writeClipboardText } from "@/src/utils/clipboard";

// ============================================================
// Pipeline operations (chip-based, applied in order)
// ============================================================

interface Operation {
  id: string;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  fn: (text: string) => string;
}

const operations: Operation[] = [
  {
    id: "trim-lines",
    label: "Убрать пробелы по краям строк",
    labelEn: "Trim line whitespace",
    description: "Удаляет начальные и конечные пробелы в каждой строке",
    descriptionEn: "Removes leading and trailing spaces from each line",
    fn: (text) =>
      text
        .split("\n")
        .map((l) => l.trim())
        .join("\n"),
  },
  {
    id: "remove-extra-spaces",
    label: "Убрать лишние пробелы",
    labelEn: "Remove extra spaces",
    description: "Сжимает несколько пробелов подряд в один",
    descriptionEn: "Compresses multiple consecutive spaces into one",
    fn: (text) => text.replace(/[ \t]+/g, " "),
  },
  {
    id: "remove-empty-lines",
    label: "Удалить пустые строки",
    labelEn: "Remove empty lines",
    description:
      "Убирает строки, содержащие только пробелы или полностью пустые",
    descriptionEn: "Removes lines that are empty or contain only whitespace",
    fn: (text) =>
      text
        .split("\n")
        .filter((l) => l.trim().length > 0)
        .join("\n"),
  },
  {
    id: "collapse-blank-lines",
    label: "Схлопнуть пустые строки",
    labelEn: "Collapse blank runs",
    description: "Несколько пустых строк подряд → одна",
    descriptionEn: "Multiple blank lines in a row → one",
    fn: (text) => text.replace(/\n{3,}/g, "\n\n"),
  },
  {
    id: "remove-duplicate-lines",
    label: "Удалить дубликаты строк",
    labelEn: "Remove duplicate lines",
    description: "Оставляет только уникальные строки (первые вхождения)",
    descriptionEn: "Keeps only unique lines (first occurrences)",
    fn: (text) => {
      const seen = new Set<string>();
      return text
        .split("\n")
        .filter((l) => {
          const key = l.trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .join("\n");
    },
  },
  {
    id: "tabs-to-spaces",
    label: "Табы → пробелы",
    labelEn: "Tabs → spaces",
    description: "Заменяет символы табуляции на пробелы (2 пробела)",
    descriptionEn: "Replaces tab characters with spaces (2 spaces)",
    fn: (text) => text.replace(/\t/g, "  "),
  },
  {
    id: "spaces-to-tabs",
    label: "Пробелы → табы",
    labelEn: "Spaces → tabs",
    description: "Заменяет двойные пробелы на символы табуляции",
    descriptionEn: "Replaces double spaces with tab characters",
    fn: (text) => text.replace(/  /g, "\t"),
  },
  {
    id: "normalize-crlf",
    label: "Концы строк → LF",
    labelEn: "Line endings → LF",
    description: "CRLF и CR заменяются на LF (Unix-стиль)",
    descriptionEn: "CRLF and CR become LF (Unix style)",
    fn: (text) => text.replace(/\r\n?/g, "\n"),
  },
  {
    id: "join-lines",
    label: "Объединить в одну строку",
    labelEn: "Join into one line",
    description: "Удаляет все переносы строк — текст становится одной строкой",
    descriptionEn: "Removes all line breaks — text becomes one line",
    fn: (text) => text.replace(/\n+/g, " ").trim(),
  },
  {
    id: "one-sentence-per-line",
    label: "Каждое предложение на новой строке",
    labelEn: "One sentence per line",
    description: "Разбивает текст по предложениям (. ! ?)",
    descriptionEn: "Splits text by sentences (. ! ?)",
    fn: (text) => text.replace(/([.!?])\s+/g, "$1\n").trim(),
  },
  {
    id: "remove-punctuation",
    label: "Удалить знаки пунктуации",
    labelEn: "Remove punctuation",
    description: "Убирает точки, запятые, тире и прочие знаки",
    descriptionEn: "Removes periods, commas, dashes and other marks",
    fn: (text) => text.replace(/[.,!?;:'"()\-–—[\]{}/\\|@#$%^&*+=~`<>]/g, ""),
  },
  {
    id: "remove-numbers",
    label: "Удалить цифры",
    labelEn: "Remove digits",
    description: "Удаляет все цифры из текста",
    descriptionEn: "Removes all digits from text",
    fn: (text) => text.replace(/\d/g, ""),
  },
  {
    id: "remove-special-chars",
    label: "Удалить спецсимволы",
    labelEn: "Remove special chars",
    description: "Оставляет только буквы, цифры и пробелы",
    descriptionEn: "Keeps only letters, digits and spaces",
    fn: (text) => text.replace(/[^a-zA-Zа-яёА-ЯЁ0-9\s\n]/g, ""),
  },
  {
    id: "normalize-unicode",
    label: "Нормализовать Unicode (NFKC)",
    labelEn: "Normalize Unicode (NFKC)",
    description: "Приводит Unicode-символы к нормальной форме",
    descriptionEn: "Normalizes Unicode characters to canonical form",
    fn: (text) => text.normalize("NFKC"),
  },
  {
    id: "lowercase",
    label: "Строчные буквы",
    labelEn: "Lowercase",
    description: "Преобразует весь текст в нижний регистр",
    descriptionEn: "Converts all text to lowercase",
    fn: (text) => text.toLowerCase(),
  },
  {
    id: "uppercase",
    label: "ЗАГЛАВНЫЕ БУКВЫ",
    labelEn: "UPPERCASE",
    description: "Преобразует весь текст в верхний регистр",
    descriptionEn: "Converts all text to uppercase",
    fn: (text) => text.toUpperCase(),
  },
  {
    id: "capitalize",
    label: "Первая буква заглавная",
    labelEn: "Capitalize first letter",
    description: "Делает заглавной первую букву каждого предложения",
    descriptionEn: "Capitalizes the first letter of each sentence",
    fn: (text) =>
      text.replace(
        /(^|[.!?]\s+)([a-zа-яё])/g,
        (_, sep, ch) => sep + ch.toUpperCase(),
      ),
  },
  {
    id: "add-line-numbers",
    label: "Пронумеровать строки",
    labelEn: "Number lines",
    description: "Добавляет порядковый номер в начало каждой строки",
    descriptionEn: "Adds a sequential number at the beginning of each line",
    fn: (text) =>
      text
        .split("\n")
        .map((l, i) => `${i + 1}. ${l}`)
        .join("\n"),
  },
  {
    id: "sort-lines-asc",
    label: "Сортировать строки (А→Я)",
    labelEn: "Sort lines (A→Z)",
    description: "Сортирует строки по алфавиту",
    descriptionEn: "Sorts lines alphabetically",
    fn: (text) =>
      text
        .split("\n")
        .sort((a, b) => a.localeCompare(b, "ru"))
        .join("\n"),
  },
  {
    id: "sort-lines-desc",
    label: "Сортировать строки (Я→А)",
    labelEn: "Sort lines (Z→A)",
    description: "Сортирует строки по алфавиту в обратном порядке",
    descriptionEn: "Sorts lines alphabetically in reverse order",
    fn: (text) =>
      text
        .split("\n")
        .sort((a, b) => b.localeCompare(a, "ru"))
        .join("\n"),
  },
  {
    id: "reverse-lines",
    label: "Перевернуть порядок строк",
    labelEn: "Reverse line order",
    description: "Меняет порядок строк на обратный",
    descriptionEn: "Reverses the order of lines",
    fn: (text) => text.split("\n").reverse().join("\n"),
  },
  {
    id: "shuffle-lines",
    label: "Перемешать строки",
    labelEn: "Shuffle lines",
    description: "Случайно перемешивает строки текста (crypto-rng)",
    descriptionEn: "Randomly shuffles lines of text (crypto-rng)",
    fn: (text) => cryptoShuffle(text.split("\n")).join("\n"),
  },
  {
    id: "title-case",
    label: "Title Case",
    labelEn: "Title Case",
    description: "Делает первую букву каждого слова заглавной",
    descriptionEn: "Capitalizes the first letter of each word",
    fn: (text) => text.replace(/\b\w/g, (c) => c.toUpperCase()),
  },
  {
    id: "camel-case",
    label: "camelCase",
    labelEn: "camelCase",
    description: "Форматирует как camelCase (для переменных)",
    descriptionEn: "Formats as camelCase (for variables)",
    fn: (text) => {
      const words = text
        .trim()
        .split(/[\s_\-./\\]+/)
        .filter(Boolean);
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
        )
        .join("");
    },
  },
  {
    id: "pascal-case",
    label: "PascalCase",
    labelEn: "PascalCase",
    description: "Форматирует как PascalCase (для классов)",
    descriptionEn: "Formats as PascalCase (for classes)",
    fn: (text) => {
      const words = text
        .trim()
        .split(/[\s_\-./\\]+/)
        .filter(Boolean);
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    },
  },
  {
    id: "snake-case",
    label: "snake_case",
    labelEn: "snake_case",
    description: "Форматирует как snake_case (для Python/SQL)",
    descriptionEn: "Formats as snake_case (for Python/SQL)",
    fn: (text) =>
      text
        .trim()
        .replace(/[\s\-./\\]+/g, "_")
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .toLowerCase(),
  },
  {
    id: "kebab-case",
    label: "kebab-case",
    labelEn: "kebab-case",
    description: "Форматирует как kebab-case (для CSS/URL)",
    descriptionEn: "Formats as kebab-case (for CSS/URLs)",
    fn: (text) =>
      text
        .trim()
        .replace(/[\s_./\\]+/g, "-")
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase(),
  },
  {
    id: "screaming-snake",
    label: "SCREAMING_SNAKE",
    labelEn: "SCREAMING_SNAKE",
    description: "Форматирует как SCREAMING_SNAKE_CASE (для констант)",
    descriptionEn: "Formats as SCREAMING_SNAKE_CASE (for constants)",
    fn: (text) =>
      text
        .trim()
        .replace(/[\s\-./\\]+/g, "_")
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .toUpperCase(),
  },
  {
    id: "wrap-80",
    label: "Перенос на 80 символов",
    labelEn: "Wrap at 80 chars",
    description: "Переносит строки длиннее 80 символов по словам",
    descriptionEn: "Wraps lines longer than 80 characters at word boundaries",
    fn: (text) => wrapText(text, 80),
  },
];

// Группировка операций
const operationGroups = [
  {
    label: "Пробелы и переносы",
    labelEn: "Spaces & line breaks",
    ids: [
      "trim-lines",
      "remove-extra-spaces",
      "remove-empty-lines",
      "collapse-blank-lines",
      "normalize-crlf",
      "tabs-to-spaces",
      "spaces-to-tabs",
      "join-lines",
      "one-sentence-per-line",
    ],
  },
  {
    label: "Дубликаты и символы",
    labelEn: "Duplicates & characters",
    ids: [
      "remove-duplicate-lines",
      "remove-punctuation",
      "remove-numbers",
      "remove-special-chars",
      "normalize-unicode",
    ],
  },
  {
    label: "Регистр",
    labelEn: "Case",
    ids: ["lowercase", "uppercase", "capitalize"],
  },
  {
    label: "Порядок строк",
    labelEn: "Line order",
    ids: [
      "add-line-numbers",
      "sort-lines-asc",
      "sort-lines-desc",
      "reverse-lines",
      "shuffle-lines",
    ],
  },
  {
    label: "Форматирование для кода",
    labelEn: "Code formatting",
    ids: [
      "title-case",
      "camel-case",
      "pascal-case",
      "snake-case",
      "kebab-case",
      "screaming-snake",
      "wrap-80",
    ],
  },
];

// Быстрые пресеты
const presets = [
  {
    label: "Очистка текста",
    labelEn: "Clean text",
    description: "Убрать лишние пробелы, пустые строки и пронормализовать",
    descriptionEn: "Remove extra spaces, empty lines and normalize",
    ops: [
      "trim-lines",
      "remove-extra-spaces",
      "remove-empty-lines",
      "normalize-unicode",
    ],
  },
  {
    label: "Список строк",
    labelEn: "Line list",
    description: "Убрать пустые строки, дубликаты, отсортировать",
    descriptionEn: "Remove empty lines, duplicates, sort",
    ops: [
      "trim-lines",
      "remove-empty-lines",
      "remove-duplicate-lines",
      "sort-lines-asc",
    ],
  },
  {
    label: "Код / Данные",
    labelEn: "Code / Data",
    description: "Нормализовать отступы, убрать пустые строки",
    descriptionEn: "Normalize indentation, remove empty lines",
    ops: ["trim-lines", "tabs-to-spaces", "remove-empty-lines"],
  },
  {
    label: "Минимизировать",
    labelEn: "Minimize",
    description: "Объединить всё в одну строку без лишних пробелов",
    descriptionEn: "Join everything into one line without extra spaces",
    ops: ["trim-lines", "remove-extra-spaces", "join-lines"],
  },
  {
    label: "Только для слов",
    labelEn: "Words only",
    description: "Удалить цифры и спецсимволы, нормализовать регистр",
    descriptionEn: "Remove digits and special chars, lowercase",
    ops: [
      "lowercase",
      "remove-numbers",
      "remove-special-chars",
      "remove-extra-spaces",
      "trim-lines",
    ],
  },
];

// ============================================================
// Helpers — wrap, smart quotes, csv, frequency
// ============================================================

function wrapText(text: string, width: number): string {
  if (width <= 0) return text;
  return text
    .split("\n")
    .map((line) => {
      if (line.length <= width) return line;
      const words = line.split(" ");
      const result: string[] = [];
      let current = "";
      for (const word of words) {
        if ((current + (current ? " " : "") + word).length <= width) {
          current = current ? current + " " + word : word;
        } else {
          if (current) result.push(current);
          current = word;
        }
      }
      if (current) result.push(current);
      return result.join("\n");
    })
    .join("\n");
}

function unwrapParagraphs(text: string): string {
  // Treat blank-line-separated blocks as paragraphs; merge inner line breaks.
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function indentLines(text: string, n: number, useTabs: boolean): string {
  if (n <= 0) return text;
  const pad = useTabs ? "\t".repeat(n) : " ".repeat(n);
  return text
    .split("\n")
    .map((l) => pad + l)
    .join("\n");
}

function outdentLines(text: string, n: number): string {
  if (n <= 0) return text;
  const re = new RegExp(`^( {1,${n}}|\\t)`);
  return text
    .split("\n")
    .map((l) => l.replace(re, ""))
    .join("\n");
}

function smartToStraight(text: string): string {
  return text
    .replace(/[“”„«»]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/…/g, "...")
    .replace(/[–—]/g, "-");
}

function straightToSmart(text: string, ru: boolean): string {
  // Convert apostrophes/quotes contextually.
  let out = text;
  // Apostrophe inside word
  out = out.replace(/(\w)'(\w)/g, "$1’$2");
  // Opening / closing single quotes
  out = out.replace(/(^|[\s(\[{])'/g, "$1‘");
  out = out.replace(/'/g, "’");
  // Double quotes — alternating
  let open = true;
  out = out.replace(/"/g, () => {
    const ch = ru ? (open ? "«" : "»") : open ? "“" : "”";
    open = !open;
    return ch;
  });
  out = out.replace(/---/g, "—").replace(/--/g, "–");
  out = out.replace(/\.\.\./g, "…");
  return out;
}

interface ParsedCsv {
  rows: string[][];
  delimiter: string;
}

function parseCsv(text: string, delimiter: string): ParsedCsv {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(cell);
        cell = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return { rows, delimiter };
}

function csvCellOut(cell: string, delimiter: string): string {
  return escapeCsvCellForSpreadsheet(cell, delimiter);
}

function buildCsv(rows: string[][], delimiter: string): string {
  return rows
    .map((r) => r.map((c) => csvCellOut(c, delimiter)).join(delimiter))
    .join("\n");
}

interface FreqEntry {
  token: string;
  count: number;
}

function tokenFrequency(tokens: string[]): FreqEntry[] {
  const map = new Map<string, number>();
  for (const t of tokens) map.set(t, (map.get(t) ?? 0) + 1);
  return Array.from(map.entries())
    .map(([token, count]) => ({ token, count }))
    .sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));
}

interface DetailedStats {
  chars: number;
  charsNoSpace: number;
  words: number;
  uniqueWords: number;
  lines: number;
  nonEmptyLines: number;
  sentences: number;
  paragraphs: number;
  avgWordLen: number;
  longestWord: string;
  longestLineLen: number;
  readingMinutes: number;
  speakingMinutes: number;
}

function detailedStats(text: string): DetailedStats {
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const wordsArr = text.trim() ? text.trim().split(/\s+/) : [];
  const words = wordsArr.length;
  const uniqueWords = new Set(
    wordsArr.map((w) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "")),
  ).size;
  const lines = text.split("\n").length;
  const nonEmptyLines = text
    .split("\n")
    .filter((l) => l.trim().length > 0).length;
  const sentences =
    (text.match(/[^.!?…]+[.!?…]+(?:\s|$)/g) ?? []).length ||
    (text.trim() ? 1 : 0);
  const paragraphs = text.trim()
    ? text
        .replace(/\r\n?/g, "\n")
        .split(/\n\s*\n+/)
        .filter((p) => p.trim()).length
    : 0;
  const totalLetters = wordsArr.reduce(
    (acc, w) => acc + w.replace(/[^\p{L}\p{N}]/gu, "").length,
    0,
  );
  const avgWordLen = words ? totalLetters / words : 0;
  const longestWord = wordsArr.reduce(
    (a, b) => (b.length > a.length ? b : a),
    "",
  );
  const longestLineLen = text
    .split("\n")
    .reduce((m, l) => Math.max(m, l.length), 0);
  const readingMinutes = words / 220;
  const speakingMinutes = words / 130;
  return {
    chars,
    charsNoSpace,
    words,
    uniqueWords,
    lines,
    nonEmptyLines,
    sentences,
    paragraphs,
    avgWordLen,
    longestWord,
    longestLineLen,
    readingMinutes,
    speakingMinutes,
  };
}

function fmtMinutes(min: number, isEn: boolean): string {
  if (min <= 0) return isEn ? "0 sec" : "0 сек";
  const totalSec = Math.round(min * 60);
  if (totalSec < 60) return isEn ? `${totalSec} sec` : `${totalSec} сек`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (s === 0) return isEn ? `${m} min` : `${m} мин`;
  return isEn ? `${m} min ${s} sec` : `${m} мин ${s} сек`;
}

// ============================================================
// Component
// ============================================================

type TabKey = "pipeline" | "find" | "lines" | "markdown" | "stats" | "csv";

export default function TextFormatterTool() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [selectedOps, setSelectedOps] = useState<string[]>([
    "trim-lines",
    "remove-extra-spaces",
    "collapse-blank-lines",
    "normalize-crlf",
  ]);
  const [copied, setCopied] = useState(false);
  const [livePreview, setLivePreview] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("pipeline");

  // ===== Find/Replace state =====
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [caseInsensitive, setCaseInsensitive] = useState(false);
  const [globalReplace, setGlobalReplace] = useState(true);
  const [multilineRegex, setMultilineRegex] = useState(false);

  // ===== Line tools state =====
  const [tabWidth, setTabWidth] = useState(4);
  const [wrapWidth, setWrapWidth] = useState(80);
  const [indentN, setIndentN] = useState(2);
  const [prefixText, setPrefixText] = useState("");
  const [suffixText, setSuffixText] = useState("");
  const [surroundOpen, setSurroundOpen] = useState('"');
  const [surroundClose, setSurroundClose] = useState('"');
  const [randomLineCount, setRandomLineCount] = useState(5);

  // ===== Markdown state =====
  const [mdNumStart, setMdNumStart] = useState(1);
  const [mdTableHeader, setMdTableHeader] = useState("Column");

  // ===== Quote style =====
  const [quoteStyleRu, setQuoteStyleRu] = useState(true);

  // ===== CSV state =====
  const [csvDelimiter, setCsvDelimiter] = useState<"\t" | "," | ";" | "|">(",");
  const [csvColumns, setCsvColumns] = useState("1,2");
  const [csvOutDelimiter, setCsvOutDelimiter] = useState<
    "\t" | "," | ";" | "|"
  >(",");

  // ===== Frequency mode =====
  const [freqMode, setFreqMode] = useState<"word" | "char" | "line">("word");

  const applyOps = useCallback((text: string, ops: string[]) => {
    let result = text;
    for (const opId of ops) {
      const op = operations.find((o) => o.id === opId);
      if (op) result = op.fn(result);
    }
    return result;
  }, []);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleProcess = useCallback(() => {
    setActiveTab("pipeline");
    setOutput(applyOps(input, selectedOps));
  }, [input, selectedOps, applyOps]);

  const handleInputChange = useCallback(
    (val: string) => {
      setInput(val);
      if (livePreview && activeTab === "pipeline") {
        setOutput(applyOps(val, selectedOps));
      } else if (activeTab === "pipeline") {
        setOutput("");
      }
    },
    [livePreview, activeTab, selectedOps, applyOps],
  );

  const handleOpsChange = useCallback(
    (ops: string[]) => {
      setSelectedOps(ops);
      if (livePreview && input && activeTab === "pipeline") {
        setOutput(applyOps(input, ops));
      } else if (activeTab === "pipeline") {
        setOutput("");
      }
    },
    [livePreview, input, activeTab, applyOps],
  );

  const handlePreset = useCallback(
    (ops: string[]) => {
      setSelectedOps(ops);
      setOutput("");
    },
    [],
  );

  const handleCopy = useCallback(async (text: string) => {
    if (!text) return;
    const ok = await writeClipboardText(text);
    if (!ok) return;
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  // ===== Find/Replace logic =====

  const findReplaceResult = useMemo<{
    text: string;
    count: number;
    error: string | null;
  }>(() => {
    if (!input || !findText) return { text: input, count: 0, error: null };
    try {
      if (useRegex) {
        let flags = "";
        if (globalReplace) flags += "g";
        if (caseInsensitive) flags += "i";
        if (multilineRegex) flags += "m";
        const re = new RegExp(findText, flags);
        let count = 0;
        const result = input.replace(re, (...args) => {
          count++;
          // arg structure: (match, p1, p2, ..., offset, string, groups?)
          let repl = replaceText;
          // Support $1..$9 and $& (whole match) referencing capture groups.
          repl = repl.replace(/\$([1-9]|&)/g, (_m, ref: string) => {
            if (ref === "&") return String(args[0]);
            const idx = parseInt(ref, 10);
            const cap = args[idx];
            return typeof cap === "string" ? cap : "";
          });
          return repl;
        });
        return { text: result, count, error: null };
      } else {
        // Literal mode.
        const needle = findText;
        if (!needle) return { text: input, count: 0, error: null };
        if (caseInsensitive) {
          const re = new RegExp(
            needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            globalReplace ? "gi" : "i",
          );
          let count = 0;
          const result = input.replace(re, () => {
            count++;
            return replaceText;
          });
          return { text: result, count, error: null };
        }
        if (globalReplace) {
          const parts = input.split(needle);
          return {
            text: parts.join(replaceText),
            count: parts.length - 1,
            error: null,
          };
        }
        const idx = input.indexOf(needle);
        if (idx === -1) return { text: input, count: 0, error: null };
        return {
          text:
            input.slice(0, idx) +
            replaceText +
            input.slice(idx + needle.length),
          count: 1,
          error: null,
        };
      }
    } catch (e) {
      return {
        text: input,
        count: 0,
        error: e instanceof Error ? e.message : "Invalid pattern",
      };
    }
  }, [
    input,
    findText,
    replaceText,
    useRegex,
    caseInsensitive,
    globalReplace,
    multilineRegex,
  ]);

  const regexError = findReplaceResult.error;

  // ===== Statistics =====

  const stats = useMemo(() => detailedStats(input), [input]);

  // ===== Frequency =====

  const frequency = useMemo<FreqEntry[]>(() => {
    if (!input) return [];
    if (freqMode === "char") {
      const chars = Array.from(input)
        .filter((c) => /\S/.test(c))
        .map((c) => c.toLowerCase());
      return tokenFrequency(chars).slice(0, 30);
    }
    if (freqMode === "line") {
      const lines = input
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      return tokenFrequency(lines).slice(0, 30);
    }
    const words = input
      .toLowerCase()
      .split(/[^\p{L}\p{N}-]+/u)
      .map((w) => w.replace(/^-+|-+$/g, ""))
      .filter((w) => w.length > 0);
    return tokenFrequency(words).slice(0, 30);
  }, [input, freqMode]);

  const maxFreq = frequency.length > 0 ? frequency[0].count : 0;

  // ===== Pipeline display stats =====

  // ===== Line tools handlers =====

  const lineToolsApply = useCallback(
    (fn: (t: string) => string) => {
      setOutput(fn(input));
    },
    [input],
  );

  const csvParsed = useMemo<ParsedCsv | null>(() => {
    if (activeTab !== "csv" || !input) return null;
    return parseCsv(input, csvDelimiter);
  }, [activeTab, input, csvDelimiter]);

  const csvOutput = useMemo(() => {
    if (!csvParsed) return "";
    const cols = csvColumns
      .split(/[,\s]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n) && n >= 1)
      .map((n) => n - 1);
    if (cols.length === 0) return buildCsv(csvParsed.rows, csvOutDelimiter);
    const newRows = csvParsed.rows.map((r) => cols.map((c) => r[c] ?? ""));
    return buildCsv(newRows, csvOutDelimiter);
  }, [csvParsed, csvColumns, csvOutDelimiter]);

  const displayedOutput =
    activeTab === "csv"
      ? csvOutput
      : activeTab === "find"
        ? findReplaceResult.text
        : output;
  const outStats = useMemo(
    () => detailedStats(displayedOutput),
    [displayedOutput],
  );

  // ===== Render =====

  const tabs: {
    id: TabKey;
    label: string;
    labelEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "pipeline",
      label: "Конвейер",
      labelEn: "Pipeline",
      icon: <MagicWand size={14} />,
    },
    {
      id: "find",
      label: "Найти и заменить",
      labelEn: "Find / Replace",
      icon: <FunnelSimple size={14} />,
    },
    {
      id: "lines",
      label: "Строки",
      labelEn: "Line tools",
      icon: <TextAa size={14} />,
    },
    {
      id: "markdown",
      label: "Markdown",
      labelEn: "Markdown",
      icon: <ListBullets size={14} />,
    },
    {
      id: "stats",
      label: "Статистика",
      labelEn: "Stats & freq",
      icon: <ChartBar size={14} />,
    },
    {
      id: "csv",
      label: "CSV/Кавычки",
      labelEn: "CSV / Quotes",
      icon: <Table size={14} />,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="md:col-start-1 md:row-start-1">
          <div className="mb-2 flex min-h-11 items-center text-sm font-medium">
            {isEn ? "Source text" : "Исходный текст"}
          </div>
          <Textarea
            rows={12}
            placeholder={
              isEn
                ? "Paste text to process..."
                : "Вставьте текст для обработки..."
            }
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            className="font-mono text-sm"
          />
        </section>

        <div className="md:col-span-2 md:row-start-2">
          <ToolPrimaryAction
            type="button"
            onClick={handleProcess}
            disabled={!input || selectedOps.length === 0}
            leadingIcon={<MagicWand size={20} weight="fill" />}
          >
            {isEn ? "Format" : "Форматировать"}
          </ToolPrimaryAction>
        </div>

        <section
          className="md:col-start-2 md:row-start-1"
          aria-live="polite"
        >
          <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
            <div className="text-sm font-medium">
              {isEn ? "Result" : "Результат"}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void handleCopy(displayedOutput)}
              disabled={!displayedOutput}
              className={cn("shrink-0", copied && "text-[var(--color-success)]")}
              title={copied ? (isEn ? "Copied" : "Скопировано") : isEn ? "Copy result" : "Копировать результат"}
              aria-label={copied ? (isEn ? "Copied" : "Скопировано") : isEn ? "Copy result" : "Копировать результат"}
            >
              {copied ? <Check size={18} weight="bold" /> : <Copy size={18} />}
            </Button>
          </div>
          <Textarea
            rows={12}
            placeholder={
              isEn
                ? "Result will appear here..."
                : "Результат появится здесь..."
            }
            value={displayedOutput}
            readOnly
            className="font-mono text-sm"
          />
        </section>
      </div>

      <AdvancedSettings
        title={isEn ? "Tools and settings" : "Инструменты и настройки"}
        description={
          isEn
            ? "Operations, find and replace, line tools, Markdown, statistics and CSV"
            : "Операции, поиск и замена, строки, Markdown, статистика и CSV"
        }
        className="mt-4 [&_button]:min-h-11 [&_label]:min-h-11 [&_select]:min-h-11 [&_input:not([type=checkbox]):not([type=radio])]:min-h-11"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {displayedOutput && (
            <Button
              variant="secondary"
              onClick={() => {
                setInput(displayedOutput);
                setOutput("");
                setActiveTab("pipeline");
              }}
            >
              <ArrowsClockwise size={16} />
              {isEn ? "Result → input" : "Результат → вход"}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setInput("");
              setOutput("");
            }}
          >
            {isEn ? "Clear" : "Очистить"}
          </Button>
          {activeTab === "pipeline" && (
            <label className="ml-auto flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-primary)]"
                checked={livePreview}
                onChange={(e) => setLivePreview(e.target.checked)}
              />
              {isEn ? "Auto-preview" : "Авто-превью"}
            </label>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabKey)}
        >
          <TabsList className="w-full justify-start gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                {t.icon}
                <span>{isEn ? t.labelEn : t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ============== PIPELINE TAB ============== */}
          <TabsContent value="pipeline">
            <div className="mb-4">
              <div className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
                {isEn ? "Quick presets:" : "Быстрые пресеты:"}
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => handlePreset(preset.ops)}
                    title={isEn ? preset.descriptionEn : preset.description}
                    className="inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)]"
                  >
                    {isEn ? preset.labelEn : preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2">
              <div className="text-sm font-semibold">
                {isEn
                  ? `Operations (${selectedOps.length} selected — applied in order)`
                  : `Операции (${selectedOps.length} выбрано — применяются по порядку)`}
              </div>
            </div>

            {operationGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {isEn ? group.labelEn : group.label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.ids.map((id) => {
                    const op = operations.find((o) => o.id === id)!;
                    const isSelected = selectedOps.includes(id);
                    return (
                      <button
                        type="button"
                        key={id}
                        title={isEn ? op.descriptionEn : op.description}
                        onClick={() => {
                          const newOps = isSelected
                            ? selectedOps.filter((o) => o !== id)
                            : [...selectedOps, id];
                          handleOpsChange(newOps);
                        }}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-semibold transition-colors",
                          isSelected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                            : "border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                        )}
                      >
                        {isSelected && <Check size={12} weight="bold" />}
                        {isEn ? op.labelEn : op.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {selectedOps.length === 0 && (
              <Card
                className="p-3"
                style={{
                  background:
                    "color-mix(in oklab, var(--color-primary) 6%, transparent)",
                }}
              >
                <div className="text-sm text-[var(--color-text-muted)]">
                  {isEn
                    ? "Select at least one operation from the list above"
                    : "Выберите хотя бы одну операцию из списка выше"}
                </div>
              </Card>
            )}

            {selectedOps.length > 0 && (
              <Card
                className="mt-2 p-3"
                style={{
                  background:
                    "color-mix(in oklab, var(--color-primary) 4%, transparent)",
                  borderColor:
                    "color-mix(in oklab, var(--color-primary) 12%, transparent)",
                }}
              >
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
                  {isEn ? "Apply order: " : "Порядок применения: "}
                </span>
                <span className="text-xs text-[var(--color-primary)]">
                  {selectedOps
                    .map((id) => {
                      const op = operations.find((o) => o.id === id);
                      return isEn ? op?.labelEn : op?.label;
                    })
                    .join(" → ")}
                </span>
              </Card>
            )}
          </TabsContent>

          {/* ============== FIND / REPLACE TAB ============== */}
          <TabsContent value="find">
            <Card className="p-4">
              <div className="mb-3 text-sm font-semibold">
                {isEn ? "Find & replace" : "Найти и заменить"}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
                    {isEn ? "Find" : "Найти"}
                  </div>
                  <Input
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    placeholder={
                      useRegex
                        ? "\\b(\\w+)@(\\w+\\.\\w+)\\b"
                        : isEn
                          ? "text to find"
                          : "текст для поиска"
                    }
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
                    {isEn
                      ? "Replace with ($1, $2, $& for groups)"
                      : "Заменить на ($1, $2, $& — группы)"}
                  </div>
                  <Input
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder={
                      useRegex ? "$1 [at] $2" : isEn ? "replacement" : "замена"
                    }
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-primary)]"
                    checked={useRegex}
                    onChange={(e) => setUseRegex(e.target.checked)}
                  />
                  {isEn ? "Regex" : "Регулярка"}
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-primary)]"
                    checked={caseInsensitive}
                    onChange={(e) => setCaseInsensitive(e.target.checked)}
                  />
                  {isEn ? "Case-insensitive" : "Без учёта регистра"}
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-primary)]"
                    checked={globalReplace}
                    onChange={(e) => setGlobalReplace(e.target.checked)}
                  />
                  {isEn ? "Replace all" : "Заменить все"}
                </label>
                {useRegex && (
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--color-primary)]"
                      checked={multilineRegex}
                      onChange={(e) => setMultilineRegex(e.target.checked)}
                    />
                    {isEn ? "Multiline (^ $ per line)" : "Многострочный режим"}
                  </label>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {regexError ? (
                  <Badge variant="danger">
                    <Warning size={12} weight="fill" />
                    {regexError}
                  </Badge>
                ) : (
                  <Badge
                    variant={
                      findReplaceResult.count > 0 ? "success" : "neutral"
                    }
                  >
                    {isEn
                      ? `${findReplaceResult.count} replacement${findReplaceResult.count === 1 ? "" : "s"}`
                      : `Замен: ${findReplaceResult.count}`}
                  </Badge>
                )}
                {useRegex && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {isEn
                      ? "Tip: use \\n for newline, \\s for whitespace, $1 to reference first group."
                      : "Совет: \\n — перенос, \\s — пробел, $1 — первая группа."}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
                  {isEn ? "Quick patterns:" : "Быстрые шаблоны:"}
                </span>
                {[
                  {
                    lbl: "email",
                    f: "\\b[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}\\b",
                    r: "[email]",
                    reg: true,
                  },
                  { lbl: "url", f: "https?://\\S+", r: "[link]", reg: true },
                  { lbl: "  →  spaces", f: " {2,}", r: " ", reg: true },
                  { lbl: "trailing ws", f: " +$", r: "", reg: true, ml: true },
                  { lbl: "digits", f: "\\d+", r: "#", reg: true },
                ].map((p) => (
                  <button
                    key={p.lbl}
                    type="button"
                    onClick={() => {
                      setUseRegex(p.reg);
                      if (p.ml) setMultilineRegex(true);
                      setFindText(p.f);
                      setReplaceText(p.r);
                    }}
                    className="h-11 rounded-md border border-[var(--color-border)] px-3 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]"
                  >
                    {p.lbl}
                  </button>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ============== LINE TOOLS TAB ============== */}
          <TabsContent value="lines">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Wrap / unwrap */}
              <Card className="p-4">
                <div className="mb-2 text-sm font-semibold">
                  {isEn ? "Wrap & indent" : "Перенос и отступ"}
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Width" : "Ширина"}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={wrapWidth}
                      onChange={(e) =>
                        setWrapWidth(
                          Math.max(
                            1,
                            Math.min(500, Number(e.target.value) || 80),
                          ),
                        )
                      }
                      className="w-24 text-xs"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => wrapText(t, wrapWidth))
                    }
                    disabled={!input}
                  >
                    {isEn ? "Hard wrap" : "Жёсткий перенос"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => lineToolsApply(unwrapParagraphs)}
                    disabled={!input}
                  >
                    {isEn ? "Unwrap paragraphs" : "Развернуть абзацы"}
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div>
                    <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Indent N" : "Отступ N"}
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={32}
                      value={indentN}
                      onChange={(e) =>
                        setIndentN(
                          Math.max(
                            0,
                            Math.min(32, Number(e.target.value) || 0),
                          ),
                        )
                      }
                      className="w-24 text-xs"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => indentLines(t, indentN, false))
                    }
                    disabled={!input}
                  >
                    {isEn ? "Indent spaces" : "Отступ пробелами"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => indentLines(t, indentN, true))
                    }
                    disabled={!input}
                  >
                    {isEn ? "Indent tabs" : "Отступ табами"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => outdentLines(t, indentN))
                    }
                    disabled={!input}
                  >
                    {isEn ? "Outdent" : "Убрать отступ"}
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div>
                    <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Tab width" : "Ширина таба"}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={16}
                      value={tabWidth}
                      onChange={(e) =>
                        setTabWidth(
                          Math.max(
                            1,
                            Math.min(16, Number(e.target.value) || 4),
                          ),
                        )
                      }
                      className="w-24 text-xs"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) =>
                        t.replace(/\t/g, " ".repeat(tabWidth)),
                      )
                    }
                    disabled={!input}
                  >
                    {isEn ? "Tab → spaces" : "Таб → пробелы"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) =>
                        t
                          .split("\n")
                          .map((l) =>
                            l.replace(new RegExp(`^( {${tabWidth}})+`), (m) =>
                              "\t".repeat(m.length / tabWidth),
                            ),
                          )
                          .join("\n"),
                      )
                    }
                    disabled={!input}
                  >
                    {isEn ? "Spaces → tab" : "Пробелы → таб"}
                  </Button>
                </div>
              </Card>

              {/* Prefix / Suffix / Surround */}
              <Card className="p-4">
                <div className="mb-2 text-sm font-semibold">
                  {isEn
                    ? "Prefix / suffix / surround"
                    : "Префикс/суффикс/обернуть"}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Prefix" : "Префикс"}
                    </div>
                    <Input
                      value={prefixText}
                      onChange={(e) => setPrefixText(e.target.value)}
                      placeholder="> "
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Suffix" : "Суффикс"}
                    </div>
                    <Input
                      value={suffixText}
                      onChange={(e) => setSuffixText(e.target.value)}
                      placeholder=";"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    lineToolsApply((t) =>
                      t
                        .split("\n")
                        .map((l) => prefixText + l + suffixText)
                        .join("\n"),
                    )
                  }
                  disabled={!input}
                >
                  {isEn ? "Apply to each line" : "К каждой строке"}
                </Button>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div>
                    <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Open" : "Открыть"}
                    </div>
                    <Input
                      value={surroundOpen}
                      onChange={(e) => setSurroundOpen(e.target.value)}
                      placeholder='"'
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Close" : "Закрыть"}
                    </div>
                    <Input
                      value={surroundClose}
                      onChange={(e) => setSurroundClose(e.target.value)}
                      placeholder='"'
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { o: '"', c: '"', lbl: '" "' },
                    { o: "'", c: "'", lbl: "' '" },
                    { o: "(", c: ")", lbl: "( )" },
                    { o: "[", c: "]", lbl: "[ ]" },
                    { o: "`", c: "`", lbl: "` `" },
                    { o: "<", c: ">", lbl: "< >" },
                  ].map((p) => (
                    <button
                      key={p.lbl}
                      type="button"
                      onClick={() => {
                        setSurroundOpen(p.o);
                        setSurroundClose(p.c);
                      }}
                      className="h-11 rounded-md border border-[var(--color-border)] px-3 font-mono text-xs text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]"
                    >
                      {p.lbl}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    lineToolsApply((t) =>
                      t
                        .split("\n")
                        .map((l) =>
                          l.length ? surroundOpen + l + surroundClose : l,
                        )
                        .join("\n"),
                    )
                  }
                  disabled={!input}
                >
                  {isEn ? "Surround each line" : "Обернуть каждую строку"}
                </Button>
              </Card>

              {/* Dedupe / random subset */}
              <Card className="p-4">
                <div className="mb-2 text-sm font-semibold">
                  {isEn ? "Dedupe & random lines" : "Дедуп и случайные строки"}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => {
                        const seen = new Set<string>();
                        return t
                          .split("\n")
                          .filter((l) => {
                            if (seen.has(l)) return false;
                            seen.add(l);
                            return true;
                          })
                          .join("\n");
                      })
                    }
                    disabled={!input}
                  >
                    {isEn ? "Dedupe (preserve order)" : "Дедуп (порядок)"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) =>
                        Array.from(new Set(t.split("\n")))
                          .sort((a, b) => a.localeCompare(b, "ru"))
                          .join("\n"),
                      )
                    }
                    disabled={!input}
                  >
                    {isEn ? "Dedupe + sort" : "Дедуп + сортировка"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => {
                        const lines = t.split("\n");
                        const map = new Map<string, number>();
                        for (const l of lines)
                          map.set(l, (map.get(l) ?? 0) + 1);
                        return Array.from(map.entries())
                          .filter(([, c]) => c > 1)
                          .map(([l]) => l)
                          .join("\n");
                      })
                    }
                    disabled={!input}
                  >
                    {isEn ? "Show only duplicates" : "Только дубликаты"}
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div>
                    <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Number of random lines" : "Количество случайных строк"}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={10000}
                      value={randomLineCount}
                      onChange={(e) =>
                        setRandomLineCount(
                          Math.max(
                            1,
                            Math.min(10000, Number(e.target.value) || 1),
                          ),
                        )
                      }
                      className="w-24 text-xs"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => {
                        const lines = t
                          .split("\n")
                          .filter((l) => l.trim().length > 0);
                        const n = Math.min(randomLineCount, lines.length);
                        const out: string[] = [];
                        const pool = lines.slice();
                        for (let i = 0; i < n; i++) {
                          const idx = cryptoRandomInt(pool.length);
                          out.push(pool[idx]);
                          pool.splice(idx, 1);
                        }
                        return out.join("\n");
                      })
                    }
                    disabled={!input}
                  >
                    <Shuffle size={14} />
                    {isEn ? "Choose random lines" : "Выбрать случайные строки"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) =>
                        cryptoShuffle(t.split("\n")).join("\n"),
                      )
                    }
                    disabled={!input}
                  >
                    <Shuffle size={14} />
                    {isEn ? "Shuffle all" : "Перемешать все"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => t.split("\n").reverse().join("\n"))
                    }
                    disabled={!input}
                  >
                    {isEn ? "Reverse order" : "Перевернуть"}
                  </Button>
                </div>
              </Card>

              {/* Quick whitespace ops */}
              <Card className="p-4">
                <div className="mb-2 text-sm font-semibold">
                  {isEn ? "Quick fixes" : "Быстрые исправления"}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) =>
                        t
                          .split("\n")
                          .map((l) => l.trim())
                          .join("\n"),
                      )
                    }
                    disabled={!input}
                  >
                    {isEn ? "Trim lines" : "Trim строк"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => t.replace(/[ \t]+$/gm, ""))
                    }
                    disabled={!input}
                  >
                    {isEn ? "Strip trailing ws" : "Убрать хвостовые пробелы"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => t.replace(/[ \t]+/g, " "))
                    }
                    disabled={!input}
                  >
                    {isEn ? "Collapse spaces" : "Схлопнуть пробелы"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => t.replace(/\n{3,}/g, "\n\n"))
                    }
                    disabled={!input}
                  >
                    {isEn ? "Collapse blank lines" : "Схлопнуть пустые строки"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => t.replace(/\r\n?/g, "\n"))
                    }
                    disabled={!input}
                  >
                    LF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => t.replace(/\r\n?|\n/g, "\r\n"))
                    }
                    disabled={!input}
                  >
                    CRLF
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ============== MARKDOWN TAB ============== */}
          <TabsContent value="markdown">
            <Card className="p-4">
              <div className="mb-3 text-sm font-semibold">
                {isEn
                  ? "Convert lines to markdown"
                  : "Превратить строки в Markdown"}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    lineToolsApply((t) =>
                      t
                        .split("\n")
                        .map((l) => (l.trim() ? `- ${l}` : ""))
                        .join("\n"),
                    )
                  }
                  disabled={!input}
                >
                  {isEn ? "Bullet list (-)" : "Маркированный список (-)"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    lineToolsApply((t) =>
                      t
                        .split("\n")
                        .map((l) => (l.trim() ? `* ${l}` : ""))
                        .join("\n"),
                    )
                  }
                  disabled={!input}
                >
                  {isEn ? "Bullet list (*)" : "Список со звёздочками (*)"}
                </Button>
                <div className="flex items-end gap-2">
                  <div>
                    <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Start" : "С числа"}
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={9999}
                      value={mdNumStart}
                      onChange={(e) =>
                        setMdNumStart(
                          Math.max(
                            0,
                            Math.min(9999, Number(e.target.value) || 1),
                          ),
                        )
                      }
                      className="w-20 text-xs"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => {
                        let n = mdNumStart;
                        return t
                          .split("\n")
                          .map((l) => (l.trim() ? `${n++}. ${l}` : ""))
                          .join("\n");
                      })
                    }
                    disabled={!input}
                  >
                    {isEn ? "Numbered list" : "Нумерованный список"}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    lineToolsApply((t) =>
                      t
                        .split("\n")
                        .map((l) => (l.trim() ? `> ${l}` : ">"))
                        .join("\n"),
                    )
                  }
                  disabled={!input}
                >
                  {isEn ? "Blockquote (>)" : "Цитата (>)"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => lineToolsApply((t) => "```\n" + t + "\n```")}
                  disabled={!input}
                >
                  {isEn ? "Wrap as code block" : "Обернуть в код"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    lineToolsApply((t) =>
                      t
                        .split("\n")
                        .map((l) => (l.trim() ? `- [ ] ${l}` : ""))
                        .join("\n"),
                    )
                  }
                  disabled={!input}
                >
                  {isEn ? "Task list" : "Список задач"}
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-2">
                <div>
                  <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                    {isEn
                      ? "Header for single-column table"
                      : "Заголовок для таблицы из одного столбца"}
                  </div>
                  <Input
                    value={mdTableHeader}
                    onChange={(e) => setMdTableHeader(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    lineToolsApply((t) => {
                      const lines = t
                        .split("\n")
                        .filter((l) => l.trim().length > 0);
                      const header = mdTableHeader || "Column";
                      return [
                        `| ${header} |`,
                        `| --- |`,
                        ...lines.map((l) => `| ${l} |`),
                      ].join("\n");
                    })
                  }
                  disabled={!input}
                >
                  {isEn ? "Lines → table column" : "Строки → столбец таблицы"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    lineToolsApply((t) => {
                      // Convert tab/pipe-separated rows into a markdown table.
                      const rows = t
                        .split("\n")
                        .filter((l) => l.trim().length > 0)
                        .map((l) =>
                          l
                            .split(/\t|\|/)
                            .map((c) => c.trim())
                            .filter(Boolean),
                        );
                      if (rows.length === 0) return "";
                      const widths = Math.max(...rows.map((r) => r.length));
                      const norm = rows.map((r) => {
                        const out = r.slice();
                        while (out.length < widths) out.push("");
                        return out;
                      });
                      const [head, ...rest] = norm;
                      const sep = head.map(() => "---");
                      return [head, sep, ...rest]
                        .map((r) => `| ${r.join(" | ")} |`)
                        .join("\n");
                    })
                  }
                  disabled={!input}
                >
                  {isEn ? "CSV/TSV → MD table" : "CSV/TSV → таблица MD"}
                </Button>
              </div>

              <div className="mt-4">
                <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                  {isEn
                    ? "Wrap each line in markdown formatting:"
                    : "Обернуть каждую строку в форматирование:"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { lbl: "**bold**", wrap: "**" },
                    { lbl: "*italic*", wrap: "*" },
                    { lbl: "`code`", wrap: "`" },
                    { lbl: "~~strike~~", wrap: "~~" },
                  ].map((m) => (
                    <Button
                      key={m.lbl}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        lineToolsApply((t) =>
                          t
                            .split("\n")
                            .map((l) =>
                              l.trim() ? `${m.wrap}${l}${m.wrap}` : l,
                            )
                            .join("\n"),
                        )
                      }
                      disabled={!input}
                    >
                      {m.lbl}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ============== STATS / FREQUENCY TAB ============== */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Card className="p-4">
                <div className="mb-3 text-sm font-semibold">
                  {isEn ? "Source statistics" : "Статистика исходного текста"}
                </div>
                <StatGrid stats={stats} isEn={isEn} />
              </Card>
              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {isEn ? "Result statistics" : "Статистика результата"}
                  </div>
                  {!displayedOutput && (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {isEn ? "No result yet" : "Нет результата"}
                    </span>
                  )}
                </div>
                <StatGrid stats={outStats} isEn={isEn} muted={!displayedOutput} />
              </Card>
            </div>

            <Card className="mt-3 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">
                  {isEn ? "Frequency histogram" : "Частотный анализ"}
                </div>
                <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1">
                  {(["word", "char", "line"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFreqMode(m)}
                      className={cn(
                        "rounded-[var(--radius-sm)] px-3 py-1 text-xs font-semibold transition-colors",
                        freqMode === m
                          ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-soft)]"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                      )}
                    >
                      {m === "word"
                        ? isEn
                          ? "Words"
                          : "Слова"
                        : m === "char"
                          ? isEn
                            ? "Chars"
                            : "Символы"
                          : isEn
                            ? "Lines"
                            : "Строки"}
                    </button>
                  ))}
                </div>
              </div>
              {frequency.length === 0 ? (
                <div className="text-sm text-[var(--color-text-muted)]">
                  {isEn
                    ? "Paste text to see frequency."
                    : "Вставьте текст, чтобы увидеть частоту."}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {frequency.map((e) => (
                    <div key={e.token} className="flex items-center gap-3">
                      <span
                        className="w-32 truncate font-mono text-xs text-[var(--color-text)]"
                        title={e.token}
                      >
                        {freqMode === "char" && e.token === " "
                          ? "␠"
                          : e.token || "∅"}
                      </span>
                      <div className="flex-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${maxFreq > 0 ? (e.count / maxFreq) * 100 : 0}%`,
                            background:
                              "linear-gradient(90deg, var(--color-primary), color-mix(in oklab, var(--color-primary) 60%, var(--color-success)))",
                          }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono text-xs tabular-nums text-[var(--color-text-muted)]">
                        {e.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ============== CSV / QUOTES TAB ============== */}
          <TabsContent value="csv">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Card className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Quotes size={16} />
                  <div className="text-sm font-semibold">
                    {isEn ? "Smart quotes" : "Типографские кавычки"}
                  </div>
                </div>
                <div className="mb-3 flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="qstyle"
                      className="h-4 w-4 accent-[var(--color-primary)]"
                      checked={quoteStyleRu}
                      onChange={() => setQuoteStyleRu(true)}
                    />
                    {isEn ? "Russian «…»" : "Русские «…»"}
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="qstyle"
                      className="h-4 w-4 accent-[var(--color-primary)]"
                      checked={!quoteStyleRu}
                      onChange={() => setQuoteStyleRu(false)}
                    />
                    {isEn ? "English “…”" : "Английские “…”"}
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) => straightToSmart(t, quoteStyleRu))
                    }
                    disabled={!input}
                  >
                    {isEn ? "Straight → smart" : "Прямые → типографские"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => lineToolsApply(smartToStraight)}
                    disabled={!input}
                  >
                    {isEn ? "Smart → straight" : "Типографские → прямые"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lineToolsApply((t) =>
                        t.replace(/[«»“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'"),
                      )
                    }
                    disabled={!input}
                  >
                    {isEn ? "Normalize quotes" : "Нормализовать кавычки"}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                  {isEn
                    ? "Converts plain \" and ' into typographic quotes (paired). Also handles -- → en-dash, --- → em-dash, … and reverse."
                    : "Превращает обычные \" и ' в типографские (парные). Также: -- → тире, --- → длинное тире, … и обратно."}
                </p>
              </Card>

              <Card className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Table size={16} />
                  <div className="text-sm font-semibold">
                    {isEn ? "CSV / TSV column tool" : "CSV / TSV — столбцы"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Input delimiter" : "Разделитель входа"}
                    </div>
                    <select
                      value={csvDelimiter}
                      onChange={(e) =>
                        setCsvDelimiter(
                          e.target.value as "," | ";" | "\t" | "|",
                        )
                      }
                      className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs"
                    >
                      <option value=",">
                        {isEn ? "Comma (,)" : "Запятая (,)"}
                      </option>
                      <option value=";">
                        {isEn ? "Semicolon (;)" : "Точка с запятой (;)"}
                      </option>
                      <option value={"\t"}>{isEn ? "Tab" : "Табуляция"}</option>
                      <option value="|">
                        {isEn ? "Pipe (|)" : "Pipe (|)"}
                      </option>
                    </select>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Output delimiter" : "Разделитель выхода"}
                    </div>
                    <select
                      value={csvOutDelimiter}
                      onChange={(e) =>
                        setCsvOutDelimiter(
                          e.target.value as "," | ";" | "\t" | "|",
                        )
                      }
                      className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs"
                    >
                      <option value=",">
                        {isEn ? "Comma (,)" : "Запятая (,)"}
                      </option>
                      <option value=";">
                        {isEn ? "Semicolon (;)" : "Точка с запятой (;)"}
                      </option>
                      <option value={"\t"}>{isEn ? "Tab" : "Табуляция"}</option>
                      <option value="|">
                        {isEn ? "Pipe (|)" : "Pipe (|)"}
                      </option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 text-xs text-[var(--color-text-muted)]">
                    {isEn
                      ? "Columns to keep (1-based, comma-separated). Leave empty to keep all."
                      : "Какие столбцы оставить (от 1, через запятую). Пусто — все."}
                  </div>
                  <Input
                    value={csvColumns}
                    onChange={(e) => setCsvColumns(e.target.value)}
                    placeholder="1,2"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {csvParsed && (
                    <>
                      <Badge variant="primary">
                        {isEn
                          ? `${csvParsed.rows.length} rows × ${csvParsed.rows[0]?.length ?? 0} cols`
                          : `${csvParsed.rows.length} строк × ${csvParsed.rows[0]?.length ?? 0} столбцов`}
                      </Badge>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {isEn
                          ? "Result auto-updates above."
                          : "Результат обновляется автоматически."}
                      </span>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </AdvancedSettings>
    </div>
  );
}

// ============================================================
// Stat grid sub-component (kept in same file)
// ============================================================

interface StatGridProps {
  stats: DetailedStats;
  isEn: boolean;
  muted?: boolean;
}

function StatGrid({ stats, isEn, muted }: StatGridProps) {
  const items: { label: string; labelEn: string; value: string }[] = [
    {
      label: "Символов",
      labelEn: "Chars",
      value: stats.chars.toLocaleString(),
    },
    {
      label: "Без пробелов",
      labelEn: "No spaces",
      value: stats.charsNoSpace.toLocaleString(),
    },
    { label: "Слов", labelEn: "Words", value: stats.words.toLocaleString() },
    {
      label: "Уникальных слов",
      labelEn: "Unique words",
      value: stats.uniqueWords.toLocaleString(),
    },
    { label: "Строк", labelEn: "Lines", value: stats.lines.toLocaleString() },
    {
      label: "Непустых строк",
      labelEn: "Non-empty",
      value: stats.nonEmptyLines.toLocaleString(),
    },
    {
      label: "Предложений",
      labelEn: "Sentences",
      value: stats.sentences.toLocaleString(),
    },
    {
      label: "Абзацев",
      labelEn: "Paragraphs",
      value: stats.paragraphs.toLocaleString(),
    },
    {
      label: "Сред. слова",
      labelEn: "Avg word",
      value: stats.avgWordLen ? stats.avgWordLen.toFixed(2) : "0",
    },
    {
      label: "Макс. строка",
      labelEn: "Longest line",
      value: stats.longestLineLen.toString(),
    },
    {
      label: "Чтение",
      labelEn: "Reading",
      value: fmtMinutes(stats.readingMinutes, isEn),
    },
    {
      label: "Произнести",
      labelEn: "Speaking",
      value: fmtMinutes(stats.speakingMinutes, isEn),
    },
  ];
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-3",
        muted && "opacity-50",
      )}
    >
      {items.map((it) => (
        <div
          key={it.labelEn}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-3 py-2"
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {isEn ? it.labelEn : it.label}
          </div>
          <div className="font-mono text-sm tabular-nums text-[var(--color-text)]">
            {it.value}
          </div>
        </div>
      ))}
      {stats.longestWord && (
        <div className="col-span-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-3 py-2 sm:col-span-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {isEn ? "Longest word" : "Самое длинное слово"}
          </div>
          <div
            className="truncate font-mono text-sm text-[var(--color-text)]"
            title={stats.longestWord}
          >
            {stats.longestWord}{" "}
            <span className="text-[var(--color-text-muted)]">
              ({stats.longestWord.length})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
