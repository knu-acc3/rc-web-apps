"use client";

import { useCallback, useMemo, useState } from "react";
import { DownloadSimple, TextAlignLeft } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { useClipboardPaste } from "@/src/hooks/useClipboardPaste";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { downloadBlob } from "@/src/utils/exportHelpers";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";

const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN",
  "FULL JOIN", "CROSS JOIN", "OUTER JOIN", "NATURAL JOIN", "ON", "USING", "AND",
  "OR", "NOT", "IN", "EXISTS", "BETWEEN", "LIKE", "ILIKE", "IS NULL", "IS NOT NULL",
  "ORDER BY", "GROUP BY", "HAVING", "LIMIT", "OFFSET", "FETCH", "UNION", "UNION ALL",
  "INTERSECT", "EXCEPT", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
  "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "CREATE INDEX", "DROP INDEX", "CREATE VIEW",
  "WITH", "AS", "DISTINCT", "ALL", "ANY", "SOME", "COUNT", "SUM", "AVG", "MIN", "MAX",
  "CASE", "WHEN", "THEN", "ELSE", "END", "ASC", "DESC", "NULL", "TRUE", "FALSE",
  "PRIMARY KEY", "FOREIGN KEY", "REFERENCES", "INDEX", "INTO", "OVER", "PARTITION BY",
  "WINDOW", "CAST", "COALESCE", "NULLIF", "CURRENT_DATE", "CURRENT_TIMESTAMP", "INTERVAL",
  "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION", "RETURNING",
];

const NEWLINE_BEFORE = [
  "SELECT", "FROM", "WHERE", "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN",
  "CROSS JOIN", "OUTER JOIN", "ORDER BY", "GROUP BY", "HAVING", "LIMIT", "OFFSET", "FETCH",
  "UNION", "UNION ALL", "INTERSECT", "EXCEPT", "INSERT INTO", "UPDATE", "SET", "DELETE FROM",
  "VALUES", "AND", "OR", "WITH", "WINDOW", "RETURNING",
];

type KeywordCase = "upper" | "lower" | "preserve";
type Mode = "format" | "minify";

function applyCase(value: string, keywordCase: KeywordCase): string {
  if (keywordCase === "upper") return value.toUpperCase();
  if (keywordCase === "lower") return value.toLowerCase();
  return value;
}

function formatSql(
  sql: string,
  options: { indent: number; keywordCase: KeywordCase },
): string {
  if (!sql.trim()) return "";
  const indent = " ".repeat(options.indent);
  let formatted = sql.trim().replace(/\s+/g, " ");
  const strings: string[] = [];
  formatted = formatted.replace(/'([^'\\]|\\.)*'/g, (match) => {
    strings.push(match);
    return `__SQL_STRING__${strings.length - 1}__SQL_STRING__`;
  });

  [...SQL_KEYWORDS]
    .sort((a, b) => b.length - a.length)
    .forEach((keyword) => {
      const expression = new RegExp(`\\b${keyword.replace(/\s+/g, "\\s+")}\\b`, "gi");
      formatted = formatted.replace(expression, applyCase(keyword, options.keywordCase));
    });

  [...NEWLINE_BEFORE]
    .sort((a, b) => b.length - a.length)
    .forEach((keyword) => {
      const cased = applyCase(keyword, options.keywordCase);
      const expression = new RegExp(`\\s+${cased.replace(/\s+/g, "\\s+")}\\b`, "g");
      formatted = formatted.replace(expression, `\n${cased}`);
    });

  const result: string[] = [];
  let level = 0;
  formatted.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    const upper = line.toUpperCase();
    const nested = /^(AND|OR|ON|USING)\b/.test(upper) ? 1 : 0;
    result.push(indent.repeat(Math.max(0, level + nested)) + line);
    level += (line.match(/\(/g) ?? []).length - (line.match(/\)/g) ?? []).length;
    level = Math.max(0, level);
  });

  return result
    .join("\n")
    .replace(/__SQL_STRING__(\d+)__SQL_STRING__/g, (_, index: string) =>
      strings[Number(index)] ?? "",
    );
}

function minifySql(sql: string, stripComments: boolean): string {
  if (!sql.trim()) return "";
  let result = sql;
  if (stripComments) {
    result = result.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  }
  return result
    .replace(/\s+/g, " ")
    .replace(/\s*([,()=<>])\s*/g, "$1")
    .replace(/,(\S)/g, ", $1")
    .trim();
}

const MAX_INPUT_BYTES = 500 * 1024;
const byteSize = (value: string) => new TextEncoder().encode(value).length;

export default function SqlFormatter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("format");
  const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [stripComments, setStripComments] = useState(true);
  const [sizeError, setSizeError] = useState(false);
  const [processedSignature, setProcessedSignature] = useState("");
  const { pasteText, pasting } = useClipboardPaste();

  const signature = [input, mode, keywordCase, indent, stripComments].join("|");
  const hasFreshOutput = processedSignature === signature;

  const run = useCallback(() => {
    if (!input.trim()) return;
    if (byteSize(input) > MAX_INPUT_BYTES) {
      setSizeError(true);
      setOutput("");
      return;
    }
    setSizeError(false);
    setOutput(
      mode === "format"
        ? formatSql(input, { indent, keywordCase })
        : minifySql(input, stripComments),
    );
    setProcessedSignature(signature);
  }, [indent, input, keywordCase, mode, signature, stripComments]);

  const download = () => {
    if (!output || !hasFreshOutput) return;
    downloadBlob(
      new Blob([output], { type: "application/sql;charset=utf-8" }),
      mode === "format" ? "formatted.sql" : "minified.sql",
    );
  };

  const stats = useMemo(() => {
    if (!hasFreshOutput) return null;
    return {
      before: byteSize(input),
      after: byteSize(output),
      lines: output.split("\n").length,
    };
  }, [hasFreshOutput, input, output]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3">
      <Card className="p-4 sm:p-5">
        <div
          className="mb-4 grid grid-cols-2 gap-2 sm:max-w-md"
          role="radiogroup"
          aria-label={isEn ? "SQL action" : "Действие с SQL"}
        >
          <Button
            type="button"
            variant={mode === "format" ? "soft" : "outline"}
            role="radio"
            aria-checked={mode === "format"}
            onClick={() => setMode("format")}
          >
            {isEn ? "Format" : "Форматировать"}
          </Button>
          <Button
            type="button"
            variant={mode === "minify" ? "soft" : "outline"}
            role="radio"
            aria-checked={mode === "minify"}
            onClick={() => setMode("minify")}
          >
            {isEn ? "Minify" : "Минифицировать"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="md:col-start-1 md:row-start-1">
            <Label htmlFor="sql-input" className="mb-2 flex min-h-11 items-center text-sm">
              {isEn ? "SQL query" : "SQL-запрос"}
            </Label>
            <Textarea
              id="sql-input"
              rows={13}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={isEn ? "Paste SQL here" : "Вставьте SQL сюда"}
              className="tool-short-landscape-editor min-h-64 font-mono text-sm md:min-h-80"
              spellCheck={false}
            />
          </section>

          <div className="md:col-span-2 md:row-start-2">
            <ToolPrimaryAction
              type="button"
              onClick={run}
              disabled={!input.trim()}
              leadingIcon={<TextAlignLeft size={20} />}
            >
              {mode === "format"
                ? isEn
                  ? "Format SQL"
                  : "Форматировать SQL"
                : isEn
                  ? "Minify SQL"
                  : "Минифицировать SQL"}
            </ToolPrimaryAction>
          </div>

          <section className="md:col-start-2 md:row-start-1" aria-live="polite">
            <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
              <span className="text-sm font-medium">{isEn ? "Result" : "Результат"}</span>
              <CopyButton text={hasFreshOutput ? output : ""} size="medium" />
            </div>
            <Textarea
              rows={13}
              value={hasFreshOutput ? output : ""}
              readOnly
              placeholder={isEn ? "Result appears here" : "Здесь появится результат"}
              className="tool-short-landscape-editor min-h-64 bg-[var(--color-surface-muted)] font-mono text-sm md:min-h-80"
              spellCheck={false}
            />
          </section>
        </div>

        {sizeError && (
          <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
            {isEn ? "Input is larger than 500 KB." : "Размер SQL превышает 500 КБ."}
          </p>
        )}
      </Card>

      <AdvancedSettings
        title={isEn ? "More SQL options" : "Дополнительные настройки"}
        description={isEn ? "Keywords, indentation and file actions" : "Регистр, отступы и действия с файлом"}
      >
        <div className="space-y-4">
          {mode === "format" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="sql-keyword-case" className="mb-1.5 block text-sm">
                  {isEn ? "Keyword case" : "Регистр ключевых слов"}
                </Label>
                <select
                  id="sql-keyword-case"
                  value={keywordCase}
                  onChange={(event) => setKeywordCase(event.target.value as KeywordCase)}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                >
                  <option value="upper">UPPER</option>
                  <option value="lower">lower</option>
                  <option value="preserve">{isEn ? "Keep original" : "Сохранить"}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="sql-indent" className="mb-1.5 block text-sm">{isEn ? "Indent" : "Отступ"}</Label>
                <select
                  id="sql-indent"
                  value={indent}
                  onChange={(event) => setIndent(Number(event.target.value) as 2 | 4)}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                >
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                </select>
              </div>
            </div>
          ) : (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={stripComments}
                onChange={(event) => setStripComments(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Remove comments" : "Удалить комментарии"}
            </label>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const value = await pasteText();
                if (value !== null) setInput(value);
              }}
              disabled={pasting}
            >
              {isEn ? "Paste" : "Вставить"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setInput("");
                setOutput("");
                setProcessedSignature("");
                setSizeError(false);
              }}
            >
              {isEn ? "Clear" : "Очистить"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!hasFreshOutput) return;
                setInput(output);
                setProcessedSignature("");
              }}
              disabled={!hasFreshOutput}
            >
              {isEn ? "Result to input" : "Результат во вход"}
            </Button>
            <Button type="button" variant="outline" onClick={download} disabled={!hasFreshOutput}>
              <DownloadSimple size={18} /> .sql
            </Button>
          </div>

          {stats && (
            <p className="text-sm text-[var(--color-text-muted)]">
              {stats.lines} {isEn ? "lines" : "строк"} · {stats.before} → {stats.after} {isEn ? "bytes" : "байт"}
            </p>
          )}
        </div>
      </AdvancedSettings>
    </div>
  );
}
