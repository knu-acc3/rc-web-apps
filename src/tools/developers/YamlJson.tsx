"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowsLeftRight,
  ClipboardText,
  DownloadSimple,
  TrashSimple,
} from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import { useClipboardPaste } from "@/src/hooks/useClipboardPaste";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { downloadBlob } from "@/src/utils/exportHelpers";

type Direction = "yaml-json" | "json-yaml";

interface ConversionError {
  message: string;
  line?: number;
}

const MAX_INPUT_BYTES = 500 * 1024;

class YamlSubsetError extends Error {
  line?: number;

  constructor(message: string, line?: number) {
    super(message);
    this.name = "YamlSubsetError";
    this.line = line;
  }
}

function getByteSize(value: string): number {
  return new TextEncoder().encode(value).length;
}

function stripInlineComment(value: string): string {
  let quote: "single" | "double" | null = null;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote === "double") {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        quote = null;
      }
      continue;
    }
    if (quote === "single") {
      if (character === "'" && value[index + 1] === "'") {
        index += 1;
      } else if (character === "'") {
        quote = null;
      }
      continue;
    }
    if (character === '"') quote = "double";
    else if (character === "'") quote = "single";
    else if (
      character === "#" &&
      (index === 0 || /\s/.test(value[index - 1]))
    ) {
      return value.slice(0, index).trimEnd();
    }
  }
  return value;
}

function splitInline(value: string): string[] {
  const parts: string[] = [];
  let buffer = "";
  let quote: "single" | "double" | null = null;
  let depth = 0;
  let escaped = false;

  for (const character of value) {
    if (quote === "double") {
      buffer += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quote = null;
      continue;
    }
    if (quote === "single") {
      buffer += character;
      if (character === "'") quote = null;
      continue;
    }
    if (character === '"') quote = "double";
    else if (character === "'") quote = "single";
    else if (character === "[" || character === "{") depth += 1;
    else if (character === "]" || character === "}") depth -= 1;

    if (character === "," && depth === 0) {
      parts.push(buffer.trim());
      buffer = "";
    } else {
      buffer += character;
    }
  }
  if (buffer.trim()) parts.push(buffer.trim());
  return parts;
}

function validateYamlSubset(source: string): void {
  const lines = source.split("\n");
  let documentMarkerSeen = false;
  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const raw = lines[index];
    const trimmed = stripInlineComment(raw).trim();
    if (!trimmed) continue;
    if (raw.includes("\t")) {
      throw new YamlSubsetError(
        "Tabs in indentation are not supported.",
        lineNumber,
      );
    }
    if (trimmed === "---") {
      if (
        documentMarkerSeen ||
        lines.slice(0, index).some((line) => stripInlineComment(line).trim())
      ) {
        throw new YamlSubsetError(
          "Multiple YAML documents are not supported.",
          lineNumber,
        );
      }
      documentMarkerSeen = true;
      continue;
    }
    if (trimmed === "..." || trimmed.startsWith("%")) {
      throw new YamlSubsetError(
        "YAML directives and document endings are not supported.",
        lineNumber,
      );
    }
    if (/^(?:\?|<<\s*:)/.test(trimmed)) {
      throw new YamlSubsetError(
        "Complex and merged keys are not supported.",
        lineNumber,
      );
    }
    if (/(?:^|:\s*|-\s*)[|>][+-]?\s*$/.test(trimmed)) {
      throw new YamlSubsetError(
        "Multiline block scalars are not supported.",
        lineNumber,
      );
    }
    if (/(?:^|\s)[&*!][\w-]+/.test(trimmed)) {
      throw new YamlSubsetError(
        "Anchors, aliases, and custom tags are not supported.",
        lineNumber,
      );
    }
  }
}

function parseYamlSubset(source: string): unknown {
  validateYamlSubset(source);
  const lines = source.split("\n");
  let index = 0;

  const cleanLine = (line: string) => stripInlineComment(line);
  const getIndent = (line: string) => line.match(/^ */)?.[0].length ?? 0;
  const skipEmpty = () => {
    while (index < lines.length && !cleanLine(lines[index]).trim()) index += 1;
  };

  const parseScalar = (rawValue: string): unknown => {
    const value = rawValue.trim();
    if (value === "" || value === "~" || value === "null") return null;
    if (value === "true") return true;
    if (value === "false") return false;
    if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
    if (/^-?(?:\d+\.\d+|\d+(?:\.\d+)?[eE][+-]?\d+)$/.test(value)) {
      return Number.parseFloat(value);
    }
    if (value.startsWith('"')) {
      if (!value.endsWith('"'))
        throw new YamlSubsetError("Unclosed quoted string.", index + 1);
      try {
        return JSON.parse(value);
      } catch {
        throw new YamlSubsetError("Invalid double-quoted string.", index + 1);
      }
    }
    if (value.startsWith("'")) {
      if (!value.endsWith("'"))
        throw new YamlSubsetError("Unclosed quoted string.", index + 1);
      return value.slice(1, -1).replace(/''/g, "'");
    }
    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      return inner ? splitInline(inner).map(parseScalar) : [];
    }
    if (value.startsWith("{") && value.endsWith("}")) {
      const inner = value.slice(1, -1).trim();
      if (!inner) return {};
      const object: Record<string, unknown> = {};
      for (const part of splitInline(inner)) {
        const colon = part.indexOf(":");
        if (colon < 1)
          throw new YamlSubsetError("Invalid inline mapping.", index + 1);
        object[String(parseScalar(part.slice(0, colon)))] = parseScalar(
          part.slice(colon + 1),
        );
      }
      return object;
    }
    return value;
  };

  const parseBlock = (baseIndent: number): unknown => {
    skipEmpty();
    if (index >= lines.length) return null;
    const firstValue = cleanLine(lines[index]).trim();
    const startsAsArray = firstValue.startsWith("-");

    if (!startsAsArray && firstValue.indexOf(":") < 1) {
      index += 1;
      return parseScalar(firstValue);
    }

    if (startsAsArray) {
      const result: unknown[] = [];
      while (index < lines.length) {
        skipEmpty();
        if (index >= lines.length) break;
        const line = cleanLine(lines[index]);
        const indent = getIndent(line);
        const trimmed = line.trim();
        if (indent < baseIndent) break;
        if (indent !== baseIndent || !trimmed.startsWith("-")) break;
        index += 1;
        const afterDash = trimmed.slice(1).trim();
        if (!afterDash) {
          skipEmpty();
          result.push(
            index < lines.length && getIndent(lines[index]) > baseIndent
              ? parseBlock(getIndent(lines[index]))
              : null,
          );
          continue;
        }

        const colon = afterDash.indexOf(":");
        if (colon > 0) {
          const object: Record<string, unknown> = {};
          const key = String(parseScalar(afterDash.slice(0, colon)));
          const rest = afterDash.slice(colon + 1).trim();
          if (rest) object[key] = parseScalar(rest);
          else {
            skipEmpty();
            object[key] =
              index < lines.length && getIndent(lines[index]) > baseIndent
                ? parseBlock(getIndent(lines[index]))
                : null;
          }

          skipEmpty();
          while (index < lines.length && getIndent(lines[index]) > baseIndent) {
            const childLine = cleanLine(lines[index]);
            const childIndent = getIndent(childLine);
            const childText = childLine.trim();
            const childColon = childText.indexOf(":");
            if (childColon < 1 || childText.startsWith("-")) break;
            const childKey = String(
              parseScalar(childText.slice(0, childColon)),
            );
            const childRest = childText.slice(childColon + 1).trim();
            index += 1;
            if (childRest) object[childKey] = parseScalar(childRest);
            else {
              skipEmpty();
              object[childKey] =
                index < lines.length && getIndent(lines[index]) > childIndent
                  ? parseBlock(getIndent(lines[index]))
                  : null;
            }
            skipEmpty();
          }
          result.push(object);
        } else {
          result.push(parseScalar(afterDash));
        }
      }
      return result;
    }

    const result: Record<string, unknown> = {};
    while (index < lines.length) {
      skipEmpty();
      if (index >= lines.length) break;
      const line = cleanLine(lines[index]);
      const indent = getIndent(line);
      const trimmed = line.trim();
      if (indent < baseIndent) break;
      if (indent !== baseIndent || trimmed.startsWith("-")) break;
      const colon = trimmed.indexOf(":");
      if (colon < 1) break;
      const key = String(parseScalar(trimmed.slice(0, colon)));
      const rest = trimmed.slice(colon + 1).trim();
      index += 1;
      if (rest) result[key] = parseScalar(rest);
      else {
        skipEmpty();
        result[key] =
          index < lines.length && getIndent(lines[index]) > baseIndent
            ? parseBlock(getIndent(lines[index]))
            : null;
      }
    }
    return result;
  };

  skipEmpty();
  if (cleanLine(lines[index] ?? "").trim() === "---") {
    index += 1;
    skipEmpty();
  }
  if (index >= lines.length) return null;
  const result = parseBlock(getIndent(lines[index]));
  skipEmpty();
  if (index < lines.length) {
    throw new YamlSubsetError(
      "Could not parse this line in the supported YAML subset.",
      index + 1,
    );
  }
  return result;
}

function yamlScalar(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean" || typeof value === "number")
    return String(value);
  const text = String(value);
  if (
    !text ||
    /^(?:true|false|null|~|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)$/.test(text) ||
    /^[\-?:,\[\]{}#&*!|>'"%@`]/.test(text) ||
    /[:#\n]|^\s|\s$/.test(text)
  ) {
    return JSON.stringify(text);
  }
  return text;
}

function yamlKey(value: string): string {
  return /^[A-Za-z0-9_.-]+$/.test(value) ? value : JSON.stringify(value);
}

function toYaml(value: unknown, depth = 0): string {
  const indent = "  ".repeat(depth);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${indent}[]`;
    return value
      .map((item) =>
        item !== null && typeof item === "object"
          ? `${indent}-\n${toYaml(item, depth + 1)}`
          : `${indent}- ${yamlScalar(item)}`,
      )
      .join("\n");
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return `${indent}{}`;
    return entries
      .map(([key, item]) =>
        item !== null && typeof item === "object"
          ? `${indent}${yamlKey(key)}:\n${toYaml(item, depth + 1)}`
          : `${indent}${yamlKey(key)}: ${yamlScalar(item)}`,
      )
      .join("\n");
  }
  return `${indent}${yamlScalar(value)}`;
}

function jsonErrorLine(source: string, error: unknown): number | undefined {
  const message = error instanceof Error ? error.message : "";
  const match = message.match(/position\s+(\d+)/i);
  if (!match) return undefined;
  return source.slice(0, Number.parseInt(match[1], 10)).split("\n").length;
}

export default function YamlJson() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [direction, setDirection] = useState<Direction>("yaml-json");
  const [yaml, setYaml] = useState("");
  const [json, setJson] = useState("");
  const [jsonIndent, setJsonIndent] = useState<2 | 4>(2);
  const [autoConvert, setAutoConvert] = useState(false);
  const [error, setError] = useState<ConversionError | null>(null);
  const { pasteText, pasting } = useClipboardPaste();

  const sourceValue = direction === "yaml-json" ? yaml : json;
  const resultValue = direction === "yaml-json" ? json : yaml;
  const sourceLabel = direction === "yaml-json" ? "YAML" : "JSON";
  const resultLabel = direction === "yaml-json" ? "JSON" : "YAML";

  const setSourceValue = useCallback(
    (value: string) => {
      if (direction === "yaml-json") setYaml(value);
      else setJson(value);
      setError(null);
    },
    [direction],
  );

  const convert = useCallback(() => {
    if (!sourceValue.trim()) {
      setError({
        message: isEn
          ? `Paste ${sourceLabel} first.`
          : `Сначала вставьте ${sourceLabel}.`,
      });
      return;
    }
    if (getByteSize(sourceValue) > MAX_INPUT_BYTES) {
      setError({
        message: isEn
          ? "Input exceeds the 500 KB limit."
          : "Размер ввода превышает 500 КБ.",
      });
      return;
    }

    try {
      if (direction === "yaml-json") {
        setJson(JSON.stringify(parseYamlSubset(yaml), null, jsonIndent));
      } else {
        setYaml(toYaml(JSON.parse(json)));
      }
      setError(null);
    } catch (caught) {
      if (caught instanceof YamlSubsetError) {
        setError({
          message: isEn ? caught.message : `Ошибка YAML: ${caught.message}`,
          line: caught.line,
        });
      } else {
        const message =
          caught instanceof Error ? caught.message : "Invalid JSON";
        setError({
          message: isEn ? `JSON error: ${message}` : `Ошибка JSON: ${message}`,
          line: jsonErrorLine(json, caught),
        });
      }
    }
  }, [direction, isEn, json, jsonIndent, sourceLabel, sourceValue, yaml]);

  useEffect(() => {
    if (!autoConvert || !sourceValue.trim()) return;
    const timer = window.setTimeout(convert, 350);
    return () => window.clearTimeout(timer);
  }, [autoConvert, convert, sourceValue]);

  const pasteSource = useCallback(async () => {
    const value = await pasteText();
    if (value !== null) setSourceValue(value);
  }, [pasteText, setSourceValue]);

  const clear = useCallback(() => {
    setYaml("");
    setJson("");
    setError(null);
  }, []);

  const downloadResult = useCallback(() => {
    if (!resultValue) return;
    const isJson = direction === "yaml-json";
    downloadBlob(
      new Blob([resultValue], {
        type: isJson
          ? "application/json;charset=utf-8"
          : "application/x-yaml;charset=utf-8",
      }),
      isJson ? "converted.json" : "converted.yaml",
    );
  }, [direction, resultValue]);

  const directionLabel = useMemo(
    () => (direction === "yaml-json" ? "YAML → JSON" : "JSON → YAML"),
    [direction],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="p-4 sm:p-6">
        <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-end">
          <label className="block text-sm font-semibold">
            <span className="mb-1.5 block text-[var(--color-text-muted)]">
              {isEn ? "Direction" : "Направление"}
            </span>
            <select
              value={direction}
              onChange={(event) => {
                setDirection(event.target.value as Direction);
                setError(null);
              }}
              className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 font-semibold"
            >
              <option value="yaml-json">YAML → JSON</option>
              <option value="json-yaml">JSON → YAML</option>
            </select>
          </label>
          <p className="text-sm text-[var(--color-text-muted)]">
            {isEn
              ? `Paste ${sourceLabel}, convert it, then copy ${resultLabel}.`
              : `Вставьте ${sourceLabel}, преобразуйте и скопируйте ${resultLabel}.`}
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
          >
            <div className="font-semibold">{error.message}</div>
            {error.line ? (
              <div className="mt-1 text-xs">
                {isEn ? "Line" : "Строка"}: {error.line}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 flex min-h-11 items-center justify-between gap-2">
              <span className="text-sm font-bold">{sourceLabel}</span>
            </div>
            <Textarea
              rows={15}
              value={sourceValue}
              onChange={(event) => setSourceValue(event.target.value)}
              placeholder={
                isEn ? `Paste ${sourceLabel}` : `Вставьте ${sourceLabel}`
              }
              spellCheck={false}
              className="min-h-64 resize-y font-mono text-sm leading-relaxed"
              aria-label={isEn ? `${sourceLabel} input` : `Ввод ${sourceLabel}`}
            />
          </div>
          <div>
            <div className="mb-2 flex min-h-11 items-center justify-between gap-2">
              <span className="text-sm font-bold">{resultLabel}</span>
              <CopyButton text={resultValue} />
            </div>
            <Textarea
              rows={15}
              value={resultValue}
              readOnly
              placeholder={
                isEn ? "Result appears here" : "Результат появится здесь"
              }
              spellCheck={false}
              className="min-h-64 resize-y bg-[var(--color-surface-muted)] font-mono text-sm leading-relaxed"
              aria-label={
                isEn ? `${resultLabel} result` : `Результат ${resultLabel}`
              }
            />
          </div>
        </div>

        <Button
          size="lg"
          onClick={convert}
          disabled={!sourceValue.trim()}
          className="tool-primary-action mt-4 w-full gap-2 sm:w-auto sm:min-w-56"
        >
          {direction === "yaml-json" ? (
            <ArrowRight size={18} />
          ) : (
            <ArrowsLeftRight size={18} />
          )}
          {isEn
            ? `Convert ${directionLabel}`
            : `Преобразовать ${directionLabel}`}
        </Button>

        <AdvancedSettings
          title={isEn ? "Input and export options" : "Ввод и экспорт"}
          description={
            isEn
              ? "Paste, auto-convert, indentation and files"
              : "Вставка, автообработка, отступы и файлы"
          }
          className="mt-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input
                type="checkbox"
                checked={autoConvert}
                onChange={(event) => setAutoConvert(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              {isEn ? "Convert while typing" : "Преобразовывать при вводе"}
            </label>
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <span>{isEn ? "JSON indentation" : "Отступ JSON"}</span>
              <select
                value={jsonIndent}
                onChange={(event) =>
                  setJsonIndent(Number(event.target.value) as 2 | 4)
                }
                className="h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2"
              >
                <option value={2}>2</option>
                <option value={4}>4</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={pasteSource}
              disabled={pasting}
              className="min-h-11"
            >
              <ClipboardText size={16} />
              {pasting
                ? isEn
                  ? "Pasting…"
                  : "Вставка…"
                : isEn
                  ? `Paste ${sourceLabel}`
                  : `Вставить ${sourceLabel}`}
            </Button>
            <Button
              variant="outline"
              onClick={downloadResult}
              disabled={!resultValue}
              className="min-h-11"
            >
              <DownloadSimple size={16} />
              {isEn ? `Download ${resultLabel}` : `Скачать ${resultLabel}`}
            </Button>
            <Button
              variant="outline"
              onClick={clear}
              disabled={!yaml && !json}
              className="min-h-11 text-[var(--color-danger)]"
            >
              <TrashSimple size={16} />
              {isEn ? "Clear" : "Очистить"}
            </Button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "YAML support is intentionally limited to mappings, lists, scalars, comments, and simple inline collections. Anchors, aliases, tags, multiline block scalars, directives, and multiple documents return an explicit error."
              : "Поддерживается ограниченное подмножество YAML: объекты, списки, скаляры, комментарии и простые inline-коллекции. Anchors, aliases, tags, многострочные блоки, directives и несколько документов возвращают явную ошибку."}
          </p>
        </AdvancedSettings>
      </Card>
    </div>
  );
}
