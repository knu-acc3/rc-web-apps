"use client";

import { useCallback, useState } from "react";
import { Code, LockSimple } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";

type Direction = "encode" | "decode";
type EntityStyle = "named" | "decimal" | "hex";

const BASIC_NAMED_ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const SAFE_NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
};

function numericEntity(
  codePoint: number,
  style: Exclude<EntityStyle, "named">,
) {
  return style === "hex"
    ? `&#x${codePoint.toString(16).toUpperCase()};`
    : `&#${codePoint};`;
}

function encodeHtml(text: string, style: EntityStyle, encodeNonAscii: boolean) {
  let encoded = "";

  for (const character of text) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) continue;

    const namedEntity = BASIC_NAMED_ENTITIES[character];
    if (namedEntity) {
      encoded +=
        style === "named" ? namedEntity : numericEntity(codePoint, style);
      continue;
    }

    if (encodeNonAscii && codePoint > 0x7f) {
      encoded += numericEntity(codePoint, style === "hex" ? "hex" : "decimal");
      continue;
    }

    encoded += character;
  }

  return encoded;
}

function isUnicodeScalar(codePoint: number) {
  return (
    Number.isInteger(codePoint) &&
    codePoint > 0 &&
    codePoint <= 0x10ffff &&
    (codePoint < 0xd800 || codePoint > 0xdfff)
  );
}

/**
 * Decodes a deliberately small, deterministic entity grammar in one pass.
 * The result is plain text and is never parsed or inserted as HTML.
 */
function decodeHtmlEntities(text: string) {
  return text.replace(
    /&(?:#x([0-9a-fA-F]{1,6})|#([0-9]{1,7})|([a-zA-Z][a-zA-Z0-9]+));/g,
    (
      entity,
      hex: string | undefined,
      decimal: string | undefined,
      name: string | undefined,
    ) => {
      if (name) return SAFE_NAMED_ENTITIES[name] ?? entity;

      const codePoint = Number.parseInt(hex ?? decimal ?? "", hex ? 16 : 10);
      return isUnicodeScalar(codePoint)
        ? String.fromCodePoint(codePoint)
        : entity;
    },
  );
}

export default function HtmlEncoder() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [direction, setDirection] = useState<Direction>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [entityStyle, setEntityStyle] = useState<EntityStyle>("named");
  const [encodeNonAscii, setEncodeNonAscii] = useState(false);

  const invalidateResult = useCallback(() => {
    setHasRun(false);
    setOutput("");
  }, []);

  const chooseDirection = useCallback(
    (nextDirection: Direction) => {
      setDirection(nextDirection);
      invalidateResult();
    },
    [invalidateResult],
  );

  const transform = useCallback(() => {
    setOutput(
      direction === "encode"
        ? encodeHtml(input, entityStyle, encodeNonAscii)
        : decodeHtmlEntities(input),
    );
    setHasRun(true);
  }, [direction, encodeNonAscii, entityStyle, input]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Code size={22} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn ? "HTML entities" : "HTML-сущности"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Escape HTML-sensitive characters or turn entities back into plain text."
                : "Экранируйте чувствительные к HTML символы или верните сущности в обычный текст."}
            </p>
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">
            {isEn ? "Direction" : "Направление"}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["encode", isEn ? "Encode" : "Кодировать"],
                ["decode", isEn ? "Decode" : "Декодировать"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={direction === value}
                onClick={() => chooseDirection(value)}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] border px-3 text-sm font-semibold transition-colors",
                  direction === value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <Label htmlFor="html-entity-input">
            {direction === "encode"
              ? isEn
                ? "Text or markup"
                : "Текст или разметка"
              : isEn
                ? "HTML entities"
                : "HTML-сущности"}
          </Label>
          <Textarea
            id="html-entity-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              invalidateResult();
            }}
            placeholder={
              direction === "encode"
                ? isEn
                  ? "Enter text to escape"
                  : "Введите текст для экранирования"
                : isEn
                  ? "Enter entities to decode"
                  : "Введите сущности для декодирования"
            }
            className="mt-2 min-h-44 resize-y font-mono text-sm leading-relaxed"
            spellCheck={false}
          />
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          onClick={transform}
          disabled={input.length === 0}
          leadingIcon={<Code size={20} aria-hidden="true" />}
        >
          {direction === "encode"
            ? isEn
              ? "Encode HTML"
              : "Кодировать HTML"
            : isEn
              ? "Decode entities"
              : "Декодировать сущности"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Advanced settings" : "Дополнительные настройки"}
          description={
            direction === "encode"
              ? isEn
                ? "Entity format and non-ASCII characters"
                : "Формат сущностей и не-ASCII символы"
              : isEn
                ? "Safe decoding rules"
                : "Правила безопасного декодирования"
          }
        >
          {direction === "encode" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="html-entity-style">
                  {isEn ? "Entity format" : "Формат сущностей"}
                </Label>
                <Select
                  value={entityStyle}
                  onValueChange={(value) => {
                    setEntityStyle(value as EntityStyle);
                    invalidateResult();
                  }}
                >
                  <SelectTrigger id="html-entity-style" className="mt-2 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="named">
                      {isEn ? "Named" : "Именованные"}
                    </SelectItem>
                    <SelectItem value="decimal">
                      {isEn ? "Decimal numeric" : "Числовые десятичные"}
                    </SelectItem>
                    <SelectItem value="hex">
                      {isEn ? "Hex numeric" : "Числовые шестнадцатеричные"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={encodeNonAscii}
                  onChange={(event) => {
                    setEncodeNonAscii(event.target.checked);
                    invalidateResult();
                  }}
                  className="size-5 accent-[var(--color-primary)]"
                />
                <span>
                  {isEn
                    ? "Encode non-ASCII characters"
                    : "Кодировать не-ASCII символы"}
                </span>
              </label>
            </div>
          ) : (
            <div className="flex items-start gap-3 text-sm text-[var(--color-text-muted)]">
              <LockSimple
                size={20}
                className="mt-0.5 shrink-0 text-[var(--color-success)]"
                aria-hidden="true"
              />
              <p>
                {isEn
                  ? "Only semicolon-terminated numeric entities and the basic named entities are decoded. Unknown or invalid sequences remain unchanged. The result stays plain text."
                  : "Декодируются только числовые сущности с точкой с запятой и базовые именованные сущности. Неизвестные и некорректные последовательности остаются без изменений. Результат остаётся обычным текстом."}
              </p>
            </div>
          )}
        </AdvancedSettings>
      </Card>

      {hasRun ? (
        <Card
          className="p-4 sm:p-5"
          aria-live="polite"
          aria-labelledby="html-entity-result-title"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 id="html-entity-result-title" className="font-bold">
                {isEn ? "Result" : "Результат"}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                {direction === "decode"
                  ? isEn
                    ? "Plain text — never rendered as HTML"
                    : "Обычный текст — никогда не выводится как HTML"
                  : isEn
                    ? "Ready to paste into HTML"
                    : "Готово для вставки в HTML"}
              </p>
            </div>
            <CopyButton
              text={output}
              size="medium"
              tooltip={isEn ? "Copy result" : "Копировать результат"}
            />
          </div>
          <Textarea
            value={output}
            readOnly
            aria-label={isEn ? "Conversion result" : "Результат преобразования"}
            className="mt-3 min-h-40 resize-y bg-[var(--color-surface-muted)]/50 font-mono text-sm leading-relaxed"
            spellCheck={false}
          />
        </Card>
      ) : null}
    </div>
  );
}
