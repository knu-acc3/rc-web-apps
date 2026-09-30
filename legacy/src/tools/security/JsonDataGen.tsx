"use client";

import { useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { escapeCsvCellForSpreadsheet } from "@/src/utils/exportHelpers";
import { cn } from "@/src/lib/cn";

type OutputFormat = "json" | "csv";
type FieldKey =
  "id" | "label" | "email" | "username" | "active" | "score" | "created_at";

type SyntheticValue = string | number | boolean;
type SyntheticRow = Record<string, SyntheticValue>;

const MAX_ROWS = 200;
const DEFAULT_FIELDS: FieldKey[] = ["id", "label", "email", "active"];
const FIELD_KEYS: FieldKey[] = [
  "id",
  "label",
  "email",
  "username",
  "active",
  "score",
  "created_at",
];

function paddedIndex(index: number) {
  return String(index + 1).padStart(3, "0");
}

function valueForField(field: FieldKey, index: number): SyntheticValue {
  const sequence = paddedIndex(index);

  if (field === "id") return `row_${sequence}`;
  if (field === "label") return `Synthetic record ${sequence}`;
  if (field === "email") return `user${sequence}@demo.invalid`;
  if (field === "username") return `test_user_${sequence}`;
  if (field === "active") return index % 2 === 0;
  if (field === "score") return (index * 17 + 31) % 101;

  return new Date(Date.UTC(2024, 0, 1 + index)).toISOString();
}

export function createSyntheticRows(
  count: number,
  fields: FieldKey[],
): SyntheticRow[] {
  return Array.from({ length: count }, (_, index) => {
    const row: SyntheticRow = {};
    for (const field of fields) row[field] = valueForField(field, index);
    return row;
  });
}

function escapeCsvCell(value: SyntheticValue) {
  return escapeCsvCellForSpreadsheet(value);
}

export function rowsToCsv(rows: SyntheticRow[], fields: FieldKey[]) {
  const header = fields.join(",");
  const body = rows.map((row) =>
    fields.map((field) => escapeCsvCell(row[field])).join(","),
  );
  return [header, ...body].join("\r\n");
}

export function formatSyntheticRows(
  rows: SyntheticRow[],
  fields: FieldKey[],
  format: OutputFormat,
) {
  return format === "json"
    ? JSON.stringify(rows, null, 2)
    : rowsToCsv(rows, fields);
}

export default function JsonDataGen() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [count, setCount] = useState("10");
  const [format, setFormat] = useState<OutputFormat>("json");
  const [fields, setFields] = useState<FieldKey[]>(DEFAULT_FIELDS);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const invalidate = () => {
    setOutput("");
    setError("");
    setCopied(false);
    setCopyFailed(false);
  };

  const generate = () => {
    const parsedCount = Number(count);
    if (
      !Number.isInteger(parsedCount) ||
      parsedCount < 1 ||
      parsedCount > MAX_ROWS
    ) {
      setOutput("");
      setError(
        isEn
          ? `Enter a whole number from 1 to ${MAX_ROWS}.`
          : `Введите целое число от 1 до ${MAX_ROWS}.`,
      );
      return;
    }

    if (fields.length === 0) {
      setOutput("");
      setError(
        isEn
          ? "Select at least one field in advanced settings."
          : "Выберите хотя бы одно поле в расширенных настройках.",
      );
      return;
    }

    const rows = createSyntheticRows(parsedCount, fields);
    setOutput(formatSyntheticRows(rows, fields, format));
    setError("");
    setCopied(false);
    setCopyFailed(false);
  };

  const toggleField = (field: FieldKey) => {
    setFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : FIELD_KEYS.filter((item) => [...current, field].includes(item)),
    );
    invalidate();
  };

  const copyOutput = async () => {
    const success = await copyText(output);
    setCopyFailed(!success);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  const downloadOutput = () => {
    if (!output) return;
    const isCsv = format === "csv";
    const blob = new Blob([isCsv ? `\ufeff${output}` : output], {
      type: isCsv ? "text/csv;charset=utf-8" : "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `synthetic-data.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const fieldLabels: Record<FieldKey, [string, string]> = {
    id: ["Идентификатор", "ID"],
    label: ["Название записи", "Record label"],
    email: ["Тестовый email (.invalid)", "Test email (.invalid)"],
    username: ["Имя пользователя", "Username"],
    active: ["Активность", "Active status"],
    score: ["Оценка 0–100", "Score 0–100"],
    created_at: ["Дата создания", "Created date"],
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <p className="text-sm leading-6 text-[var(--color-text-muted)]">
          {isEn
            ? "Create fictional test rows. Email addresses always use the reserved .invalid domain."
            : "Создайте вымышленные тестовые строки. Email всегда использует зарезервированный домен .invalid."}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <Label htmlFor="synthetic-row-count">
              {isEn ? "Number of rows" : "Количество строк"}
            </Label>
            <Input
              id="synthetic-row-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_ROWS}
              value={count}
              onChange={(event) => {
                setCount(event.target.value);
                invalidate();
              }}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label id="synthetic-format-label">
              {isEn ? "Output format" : "Формат результата"}
            </Label>
            <div
              role="radiogroup"
              aria-labelledby="synthetic-format-label"
              className="mt-1.5 grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-1"
            >
              {(["json", "csv"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={format === value}
                  onClick={() => {
                    setFormat(value);
                    invalidate();
                  }}
                  className={cn(
                    "min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]",
                    format === value
                      ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ToolPrimaryAction type="button" className="mt-4" onClick={generate}>
          {isEn ? "Generate test data" : "Создать тестовые данные"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the settings" : "Проверьте настройки"}
            description={error}
            className="mt-5"
          />
        ) : output ? (
          <ToolResult
            status="success"
            title={isEn ? "Data is ready" : "Данные готовы"}
            description={
              isEn
                ? `${count} synthetic rows in ${format.toUpperCase()}`
                : `${count} синтетических строк в ${format.toUpperCase()}`
            }
            className="mt-5"
            actions={
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => void copyOutput()}
                >
                  {copied
                    ? isEn
                      ? "Copied"
                      : "Скопировано"
                    : isEn
                      ? "Copy"
                      : "Копировать"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={downloadOutput}
                >
                  <DownloadSimple size={18} aria-hidden="true" />
                  {isEn ? "Download" : "Скачать"}
                </Button>
              </>
            }
          >
            <pre className="max-h-80 overflow-auto whitespace-pre font-mono text-sm leading-6 text-[var(--color-text)]">
              {output}
            </pre>
            {copyFailed ? (
              <p
                role="alert"
                className="mt-2 text-sm text-[var(--color-danger)]"
              >
                {isEn
                  ? "Clipboard access was denied."
                  : "Браузер запретил доступ к буферу обмена."}
              </p>
            ) : null}
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "Generated JSON or CSV will appear here."
                : "Здесь появится готовый JSON или CSV."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Fields" : "Поля результата"}
          description={
            isEn
              ? "Keep only the fields your test needs"
              : "Оставьте только нужные для теста поля"
          }
        >
          <div className="grid gap-1 sm:grid-cols-2">
            {FIELD_KEYS.map((field) => (
              <label
                key={field}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              >
                <input
                  type="checkbox"
                  checked={fields.includes(field)}
                  onChange={() => toggleField(field)}
                  className="h-5 w-5 shrink-0 accent-[var(--color-primary)]"
                />
                <span>{fieldLabels[field][isEn ? 1 : 0]}</span>
              </label>
            ))}
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
