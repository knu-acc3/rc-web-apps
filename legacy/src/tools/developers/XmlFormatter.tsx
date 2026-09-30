"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowsInLineHorizontal,
  BracketsCurly,
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

type Operation = "format" | "minify";
type IndentOption = "2" | "4" | "tab";

interface XmlError {
  message: string;
  line?: number;
}

const MAX_INPUT_BYTES = 500 * 1024;

class XmlProcessingError extends Error {
  line?: number;

  constructor(message: string, line?: number) {
    super(message);
    this.name = "XmlProcessingError";
    this.line = line;
  }
}

function getByteSize(value: string): number {
  return new TextEncoder().encode(value).length;
}

function declarationFrom(source: string): string {
  return source.trimStart().match(/^<\?xml\s[^?]*\?>/i)?.[0] ?? "";
}

function parseXml(source: string, isEn: boolean): XMLDocument {
  if (/<!DOCTYPE\b/i.test(source)) {
    throw new XmlProcessingError(
      isEn
        ? "DTD and external entity declarations are not supported."
        : "DTD и объявления внешних сущностей не поддерживаются.",
    );
  }
  const document = new DOMParser().parseFromString(source, "application/xml");
  const parserError = document.getElementsByTagName("parsererror")[0];
  if (parserError) {
    const details = parserError.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const lineMatch = details.match(
      /(?:line|строк\w*)\s*(?:number)?\s*[:=]?\s*(\d+)/i,
    );
    throw new XmlProcessingError(
      isEn ? "XML could not be parsed." : "Не удалось разобрать XML.",
      lineMatch ? Number.parseInt(lineMatch[1], 10) : undefined,
    );
  }
  if (!document.documentElement) {
    throw new XmlProcessingError(
      isEn ? "XML has no root element." : "В XML нет корневого элемента.",
    );
  }
  return document;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function renderElement(
  element: Element,
  depth: number,
  indent: string,
): string {
  const prefix = indent.repeat(depth);
  const attributes = Array.from(element.attributes)
    .map(
      (attribute) => ` ${attribute.name}="${escapeAttribute(attribute.value)}"`,
    )
    .join("");
  const open = `<${element.tagName}${attributes}>`;
  const close = `</${element.tagName}>`;
  const children = Array.from(element.childNodes);
  if (children.length === 0)
    return `${prefix}<${element.tagName}${attributes}/>`;

  const hasElementChildren = children.some((child) => child.nodeType === 1);
  const hasSignificantText = children.some(
    (child) => child.nodeType === 3 && Boolean(child.nodeValue?.trim()),
  );
  const serializer = new XMLSerializer();

  if (hasElementChildren && hasSignificantText) {
    return `${prefix}${serializer.serializeToString(element)}`;
  }
  if (!hasElementChildren) {
    return `${prefix}${open}${children.map((child) => serializer.serializeToString(child)).join("")}${close}`;
  }

  const renderedChildren = children
    .filter((child) => child.nodeType !== 3 || Boolean(child.nodeValue?.trim()))
    .map((child) => {
      if (child.nodeType === 1)
        return renderElement(child as Element, depth + 1, indent);
      return `${indent.repeat(depth + 1)}${serializer.serializeToString(child)}`;
    });
  return [`${prefix}${open}`, ...renderedChildren, `${prefix}${close}`].join(
    "\n",
  );
}

function formatXml(
  document: XMLDocument,
  source: string,
  indent: string,
): string {
  const serializer = new XMLSerializer();
  const lines: string[] = [];
  const declaration = declarationFrom(source);
  if (declaration) lines.push(declaration);

  for (const child of Array.from(document.childNodes)) {
    if (child.nodeType === 1)
      lines.push(renderElement(child as Element, 0, indent));
    else if (child.nodeType !== 3 && child.nodeType !== 10) {
      lines.push(serializer.serializeToString(child));
    }
  }
  return lines.join("\n").trim();
}

function removeFormattingWhitespace(node: Node): void {
  const children = Array.from(node.childNodes);
  const hasElementChildren = children.some((child) => child.nodeType === 1);
  const hasSignificantText = children.some(
    (child) => child.nodeType === 3 && Boolean(child.nodeValue?.trim()),
  );
  if (hasElementChildren && !hasSignificantText) {
    for (const child of children) {
      if (child.nodeType === 3 && !child.nodeValue?.trim())
        node.removeChild(child);
    }
  }
  for (const child of Array.from(node.childNodes))
    removeFormattingWhitespace(child);
}

function minifyXml(document: XMLDocument, source: string): string {
  removeFormattingWhitespace(document);
  const serialized = new XMLSerializer().serializeToString(document).trim();
  const declaration = declarationFrom(source);
  if (!declaration || serialized.startsWith("<?xml")) return serialized;
  return `${declaration}${serialized}`;
}

export default function XmlFormatter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [operation, setOperation] = useState<Operation>("format");
  const [indentOption, setIndentOption] = useState<IndentOption>("2");
  const [autoProcess, setAutoProcess] = useState(false);
  const [error, setError] = useState<XmlError | null>(null);
  const { pasteText, pasting } = useClipboardPaste();

  const processXml = useCallback(() => {
    if (!input.trim()) {
      setError({
        message: isEn ? "Paste XML first." : "Сначала вставьте XML.",
      });
      return;
    }
    if (getByteSize(input) > MAX_INPUT_BYTES) {
      setError({
        message: isEn
          ? "Input exceeds the 500 KB limit."
          : "Размер ввода превышает 500 КБ.",
      });
      setOutput("");
      return;
    }

    try {
      const document = parseXml(input, isEn);
      const indent =
        indentOption === "tab" ? "\t" : " ".repeat(Number(indentOption));
      setOutput(
        operation === "format"
          ? formatXml(document, input, indent)
          : minifyXml(document, input),
      );
      setError(null);
    } catch (caught) {
      const xmlError =
        caught instanceof XmlProcessingError
          ? caught
          : new XmlProcessingError(
              isEn ? "XML processing failed." : "Не удалось обработать XML.",
            );
      setError({ message: xmlError.message, line: xmlError.line });
      setOutput("");
    }
  }, [indentOption, input, isEn, operation]);

  useEffect(() => {
    if (!autoProcess || !input.trim()) return;
    const timer = window.setTimeout(processXml, 350);
    return () => window.clearTimeout(timer);
  }, [autoProcess, input, processXml]);

  const pasteInput = useCallback(async () => {
    const value = await pasteText();
    if (value !== null) {
      setInput(value);
      setError(null);
    }
  }, [pasteText]);

  const clear = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
  }, []);

  const download = useCallback(() => {
    if (!output) return;
    downloadBlob(
      new Blob([output], { type: "application/xml;charset=utf-8" }),
      operation === "format" ? "formatted.xml" : "minified.xml",
    );
  }, [operation, output]);

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="p-4 sm:p-6">
        <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-end">
          <label className="block text-sm font-semibold">
            <span className="mb-1.5 block text-[var(--color-text-muted)]">
              {isEn ? "Operation" : "Операция"}
            </span>
            <select
              value={operation}
              onChange={(event) => {
                setOperation(event.target.value as Operation);
                setError(null);
              }}
              className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 font-semibold"
            >
              <option value="format">
                {isEn ? "Format XML" : "Форматировать XML"}
              </option>
              <option value="minify">
                {isEn ? "Minify XML" : "Минифицировать XML"}
              </option>
            </select>
          </label>
          <p className="text-sm text-[var(--color-text-muted)]">
            {isEn
              ? "Paste one XML document, process it, then copy the result."
              : "Вставьте один XML-документ, обработайте и скопируйте результат."}
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
              <span className="text-sm font-bold">XML</span>
            </div>
            <Textarea
              rows={15}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setError(null);
              }}
              placeholder={isEn ? "Paste XML" : "Вставьте XML"}
              spellCheck={false}
              className="min-h-64 resize-y font-mono text-sm leading-relaxed"
              aria-label={isEn ? "XML input" : "Ввод XML"}
            />
          </div>
          <div>
            <div className="mb-2 flex min-h-11 items-center justify-between gap-2">
              <span className="text-sm font-bold">
                {isEn ? "Result" : "Результат"}
              </span>
              <CopyButton text={output} />
            </div>
            <Textarea
              rows={15}
              value={output}
              readOnly
              placeholder={
                isEn ? "Result appears here" : "Результат появится здесь"
              }
              spellCheck={false}
              className="min-h-64 resize-y bg-[var(--color-surface-muted)] font-mono text-sm leading-relaxed"
              aria-label={isEn ? "Processed XML" : "Обработанный XML"}
            />
          </div>
        </div>

        <Button
          size="lg"
          onClick={processXml}
          disabled={!input.trim()}
          className="tool-primary-action mt-4 w-full gap-2 sm:w-auto sm:min-w-56"
        >
          {operation === "format" ? (
            <BracketsCurly size={18} />
          ) : (
            <ArrowsInLineHorizontal size={18} />
          )}
          {operation === "format"
            ? isEn
              ? "Format XML"
              : "Форматировать XML"
            : isEn
              ? "Minify XML"
              : "Минифицировать XML"}
        </Button>

        <AdvancedSettings
          title={isEn ? "Input and output options" : "Ввод и результат"}
          description={
            isEn
              ? "Indentation, auto-process and files"
              : "Отступы, автообработка и файлы"
          }
          className="mt-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input
                type="checkbox"
                checked={autoProcess}
                onChange={(event) => setAutoProcess(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              {isEn ? "Process while typing" : "Обрабатывать при вводе"}
            </label>
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <span>{isEn ? "Indentation" : "Отступ"}</span>
              <select
                value={indentOption}
                onChange={(event) =>
                  setIndentOption(event.target.value as IndentOption)
                }
                disabled={operation === "minify"}
                className="h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 disabled:opacity-50"
              >
                <option value="2">{isEn ? "2 spaces" : "2 пробела"}</option>
                <option value="4">{isEn ? "4 spaces" : "4 пробела"}</option>
                <option value="tab">Tab</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={pasteInput}
              disabled={pasting}
              className="min-h-11"
            >
              <ClipboardText size={16} />
              {pasting
                ? isEn
                  ? "Pasting…"
                  : "Вставка…"
                : isEn
                  ? "Paste XML"
                  : "Вставить XML"}
            </Button>
            <Button
              variant="outline"
              onClick={download}
              disabled={!output}
              className="min-h-11"
            >
              <DownloadSimple size={16} />
              {isEn ? "Download XML" : "Скачать XML"}
            </Button>
            <Button
              variant="outline"
              onClick={clear}
              disabled={!input && !output}
              className="min-h-11 text-[var(--color-danger)]"
            >
              <TrashSimple size={16} />
              {isEn ? "Clear" : "Очистить"}
            </Button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Parsing uses the browser XML parser. DTD and external entities are rejected. Mixed-content elements remain inline so meaningful text spacing is not reformatted."
              : "Разбор выполняет XML-парсер браузера. DTD и внешние сущности отклоняются. Элементы со смешанным содержимым остаются в одной строке, чтобы не менять значимые пробелы."}
          </p>
        </AdvancedSettings>
      </Card>
    </div>
  );
}
