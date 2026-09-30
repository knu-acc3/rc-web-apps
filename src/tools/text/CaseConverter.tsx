"use client";

import { useMemo, useState } from "react";
import { ArrowsCounterClockwise, Check, Copy, Sparkle } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { useClipboardPaste } from "@/src/hooks/useClipboardPaste";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";

type CaseType =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot"
  | "path"
  | "header"
  | "alternating"
  | "inverse"
  | "reverse"
  | "slug";

const CASE_OPTIONS: Array<{
  value: CaseType;
  ru: string;
  en: string;
}> = [
  { value: "upper", ru: "ВЕРХНИЙ РЕГИСТР", en: "UPPER CASE" },
  { value: "lower", ru: "нижний регистр", en: "lower case" },
  { value: "title", ru: "Каждое Слово", en: "Title Case" },
  { value: "sentence", ru: "Как в предложении", en: "Sentence case" },
  { value: "camel", ru: "camelCase", en: "camelCase" },
  { value: "pascal", ru: "PascalCase", en: "PascalCase" },
  { value: "snake", ru: "snake_case", en: "snake_case" },
  { value: "kebab", ru: "kebab-case", en: "kebab-case" },
  { value: "constant", ru: "CONSTANT_CASE", en: "CONSTANT_CASE" },
  { value: "dot", ru: "dot.case", en: "dot.case" },
  { value: "path", ru: "path/case", en: "path/case" },
  { value: "header", ru: "Http-Header-Case", en: "Http-Header-Case" },
  { value: "alternating", ru: "ЧеРеДоВаНиЕ", en: "aLtErNaTiNg" },
  { value: "inverse", ru: "Инверсия регистра", en: "Inverse case" },
  { value: "reverse", ru: "Развернуть текст", en: "Reverse text" },
  { value: "slug", ru: "URL slug", en: "URL slug" },
];

const POPULAR_CASES: Array<{ value: CaseType; ru: string; en: string }> = [
  { value: "upper", ru: "ВЕРХНИЙ", en: "UPPER" },
  { value: "lower", ru: "нижний", en: "lower" },
  { value: "title", ru: "Заглавные Слова", en: "Title Case" },
  { value: "sentence", ru: "Как в предложении", en: "Sentence" },
  { value: "camel", ru: "camelCase", en: "camelCase" },
  { value: "snake", ru: "snake_case", en: "snake_case" },
  { value: "kebab", ru: "kebab-case", en: "kebab-case" },
];

function splitWords(text: string): string[] {
  return text
    .replace(/([a-zа-яё])([A-ZА-ЯЁ])/g, "$1 $2")
    .replace(/[_\-./\\]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function slugify(text: string): string {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  return text
    .toLowerCase()
    .split("")
    .map((character) => map[character] ?? character)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function convertCase(text: string, type: CaseType): string {
  if (!text.trim()) return "";
  switch (type) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.toLowerCase().replace(/(^|\s)\S/g, (value) => value.toUpperCase());
    case "sentence":
      return text
        .toLowerCase()
        .replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (value) => value.toUpperCase());
    case "camel":
      return splitWords(text)
        .map((word, index) =>
          index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join("");
    case "pascal":
      return splitWords(text)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
    case "snake":
      return splitWords(text).map((word) => word.toLowerCase()).join("_");
    case "kebab":
      return splitWords(text).map((word) => word.toLowerCase()).join("-");
    case "constant":
      return splitWords(text).map((word) => word.toUpperCase()).join("_");
    case "dot":
      return splitWords(text).map((word) => word.toLowerCase()).join(".");
    case "path":
      return splitWords(text).map((word) => word.toLowerCase()).join("/");
    case "header":
      return splitWords(text)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("-");
    case "alternating":
      return Array.from(text)
        .map((character, index) =>
          index % 2 === 0 ? character.toLowerCase() : character.toUpperCase(),
        )
        .join("");
    case "inverse":
      return Array.from(text)
        .map((character) =>
          character === character.toUpperCase()
            ? character.toLowerCase()
            : character.toUpperCase(),
        )
        .join("");
    case "reverse":
      return Array.from(text).reverse().join("");
    case "slug":
      return slugify(text);
  }
}

export default function CaseConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState(
    isEn
      ? "Modern and fast online text case converter"
      : "Быстрый и удобный конвертер регистра текста онлайн",
  );
  const [caseType, setCaseType] = useState<CaseType>("upper");
  const [copied, setCopied] = useState(false);
  const { pasteText, pasting } = useClipboardPaste();

  const activeLabel = CASE_OPTIONS.find((option) => option.value === caseType);
  const result = useMemo(() => {
    return input.trim() ? convertCase(input, caseType) : "";
  }, [input, caseType]);

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* 1-Click Quick Preset Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-[var(--color-primary)]" />
          {isEn ? "Quick style:" : "Быстрый стиль:"}
        </span>
        {POPULAR_CASES.map((option) => {
          const isActive = caseType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setCaseType(option.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
              )}
            >
              {isEn ? option.en : option.ru}
            </button>
          );
        })}
      </div>

      <Card className="p-4 sm:p-5">
        <Label htmlFor="case-input" className="mb-1.5 block text-sm font-semibold">
          {isEn ? "Source text" : "Исходный текст"}
        </Label>
        <Textarea
          id="case-input"
          rows={5}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isEn ? "Enter text to change its case" : "Введите текст для изменения регистра"}
          className="mb-4 text-base font-sans"
        />

        <Label className="mb-1.5 block text-sm font-semibold">
          {isEn ? "All case styles" : "Все стили регистра"}
        </Label>
        <Select
          value={caseType}
          onValueChange={(value) => setCaseType(value as CaseType)}
        >
          <SelectTrigger aria-label={isEn ? "Case style" : "Стиль регистра"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CASE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {isEn ? option.en : option.ru}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-4">
          <ToolPrimaryAction
            type="button"
            fullWidthOnMobile={false}
            className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
            onClick={() => void handleCopy()}
            disabled={!result}
            leadingIcon={copied ? <Check size={20} /> : <Copy size={20} />}
          >
            {copied
              ? (isEn ? "Copied!" : "Скопировано!")
              : (isEn ? "Copy result" : "Копировать результат")}
          </ToolPrimaryAction>
        </div>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Input actions" : "Действия с текстом"}
          description={isEn ? "Paste or clear" : "Вставить или очистить"}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const pasted = await pasteText();
                if (pasted !== null) setInput(pasted);
              }}
              disabled={pasting}
            >
              {isEn ? "Paste text" : "Вставить текст"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setInput("");
              }}
              disabled={!input}
            >
              <ArrowsCounterClockwise size={18} />
              {isEn ? "Clear" : "Очистить"}
            </Button>
          </div>
        </AdvancedSettings>
      </Card>

      {result ? (
        <Card className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{isEn ? "Result" : "Результат"}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {isEn ? activeLabel?.en : activeLabel?.ru}
              </div>
            </div>
            <CopyButton
              text={result}
              size="medium"
              tooltip={isEn ? "Copy result" : "Копировать результат"}
            />
          </div>
          <Textarea
            rows={6}
            value={result}
            readOnly
            aria-label={isEn ? "Converted text" : "Преобразованный текст"}
            className="bg-[var(--color-surface-muted)] text-base font-sans"
          />
        </Card>
      ) : null}
    </div>
  );
}
