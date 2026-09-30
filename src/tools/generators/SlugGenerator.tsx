"use client";

import { useState } from "react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";

type Separator = "-" | "_" | ".";
type CharacterMode = "latin" | "unicode";

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
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
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterateBasicCyrillic(value: string) {
  return [...value]
    .map((character) => CYRILLIC_TO_LATIN[character] ?? character)
    .join("");
}

function removeTrailingSeparator(value: string, separator: Separator) {
  let result = value;
  while (result.endsWith(separator)) {
    result = result.slice(0, -separator.length);
  }
  return result;
}

function createSlug(
  text: string,
  separator: Separator,
  characterMode: CharacterMode,
  maxLength: number,
) {
  let normalized = text.normalize("NFKC").toLowerCase();
  if (characterMode === "latin") {
    normalized = transliterateBasicCyrillic(normalized)
      .normalize("NFKD")
      .replace(/\p{M}+/gu, "");
    normalized = normalized.replace(/[^a-z0-9]+/g, separator);
  } else {
    normalized = normalized.replace(/[^\p{L}\p{N}]+/gu, separator);
  }

  normalized = removeTrailingSeparator(normalized, separator);
  while (normalized.startsWith(separator)) {
    normalized = normalized.slice(separator.length);
  }

  const limited = [...normalized].slice(0, maxLength).join("");
  return removeTrailingSeparator(limited, separator);
}

export default function SlugGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [text, setText] = useState("");
  const [separator, setSeparator] = useState<Separator>("-");
  const [characterMode, setCharacterMode] = useState<CharacterMode>("latin");
  const [maxLength, setMaxLength] = useState("80");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const clearResult = () => {
    setSlug("");
    setError("");
    setCopied(false);
  };

  const generate = () => {
    const parsedLength = Number(maxLength);
    if (!text.trim()) {
      setError(
        isEn
          ? "Enter text to create a slug."
          : "Введите текст, чтобы создать slug.",
      );
      return;
    }
    if (
      !Number.isInteger(parsedLength) ||
      parsedLength < 10 ||
      parsedLength > 200
    ) {
      setError(
        isEn
          ? "Maximum length must be a whole number from 10 to 200."
          : "Максимальная длина должна быть целым числом от 10 до 200.",
      );
      return;
    }

    const nextSlug = createSlug(text, separator, characterMode, parsedLength);
    if (!nextSlug) {
      setError(
        isEn
          ? "No supported letters or digits remain after normalization."
          : "После нормализации не осталось поддерживаемых букв или цифр.",
      );
      return;
    }

    setSlug(nextSlug);
    setError("");
    setCopied(false);
  };

  const copySlug = async () => {
    const success = await copyText(slug);
    if (!success) {
      setError(
        isEn
          ? "Clipboard access was denied."
          : "Браузер запретил доступ к буферу обмена.",
      );
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="slug-source">
          {isEn ? "Text for the slug" : "Текст для slug"}
        </Label>
        <Textarea
          id="slug-source"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            clearResult();
          }}
          className="mt-1.5 min-h-28 resize-y"
          placeholder={
            isEn ? "Enter a title or phrase" : "Введите заголовок или фразу"
          }
        />

        <ToolPrimaryAction type="button" className="mt-4" onClick={generate}>
          {isEn ? "Generate slug" : "Создать slug"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the text" : "Проверьте текст"}
            description={error}
            className="mt-5"
          />
        ) : slug ? (
          <ToolResult
            status="success"
            title={isEn ? "Generated slug" : "Готовый slug"}
            className="mt-5"
            actions={
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void copySlug()}
              >
                {copied
                  ? isEn
                    ? "Copied"
                    : "Скопировано"
                  : isEn
                    ? "Copy"
                    : "Копировать"}
              </Button>
            }
          >
            <p className="break-all font-mono text-2xl font-black leading-tight text-[var(--color-text)] sm:text-3xl">
              {slug}
            </p>
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "The generated slug will appear here."
                : "Созданный slug появится здесь."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Slug settings" : "Настройки slug"}
          description={
            isEn
              ? "Separator, character handling and maximum length"
              : "Разделитель, обработка символов и максимальная длина"
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="min-w-0">
              <Label htmlFor="slug-separator">
                {isEn ? "Separator" : "Разделитель"}
              </Label>
              <select
                id="slug-separator"
                value={separator}
                onChange={(event) => {
                  setSeparator(event.target.value as Separator);
                  clearResult();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="-">{isEn ? "Hyphen (-)" : "Дефис (-)"}</option>
                <option value="_">
                  {isEn ? "Underscore (_)" : "Подчёркивание (_)"}
                </option>
                <option value=".">{isEn ? "Dot (.)" : "Точка (.)"}</option>
              </select>
            </div>

            <div className="min-w-0">
              <Label htmlFor="slug-character-mode">
                {isEn ? "Characters" : "Символы"}
              </Label>
              <select
                id="slug-character-mode"
                value={characterMode}
                onChange={(event) => {
                  setCharacterMode(event.target.value as CharacterMode);
                  clearResult();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="latin">
                  {isEn ? "Latin transliteration" : "Латинская транслитерация"}
                </option>
                <option value="unicode">
                  {isEn ? "Keep Unicode" : "Сохранить Unicode"}
                </option>
              </select>
            </div>

            <div className="min-w-0">
              <Label htmlFor="slug-max-length">
                {isEn ? "Maximum length" : "Максимальная длина"}
              </Label>
              <input
                id="slug-max-length"
                type="number"
                inputMode="numeric"
                min={10}
                max={200}
                step={1}
                value={maxLength}
                onChange={(event) => {
                  setMaxLength(event.target.value);
                  clearResult();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              />
            </div>
          </div>
        </AdvancedSettings>

        <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "The default is lowercase Latin with hyphens. Basic Cyrillic transliteration is a practical mapping, not a language-specific standard. Latin mode removes unsupported scripts; Unicode mode preserves Unicode letters and digits."
            : "По умолчанию используется нижний регистр, латиница и дефисы. Базовая транслитерация кириллицы — практическое соответствие, а не языковой стандарт. Латинский режим удаляет неподдерживаемые письменности; Unicode-режим сохраняет буквы и цифры Unicode."}
        </p>
      </section>
    </div>
  );
}
