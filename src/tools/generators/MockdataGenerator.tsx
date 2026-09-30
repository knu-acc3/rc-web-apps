"use client";

import { useState } from "react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { escapeCsvCellForSpreadsheet } from "@/src/utils/exportHelpers";

type OutputFormat = "json" | "csv";
type FieldKey =
  "id" | "label" | "email" | "username" | "active" | "score" | "created_at";
type RowValue = string | number | boolean;
type DataRow = Record<string, RowValue>;

interface FieldOption {
  key: FieldKey;
  labelEn: string;
  labelRu: string;
}

const FIELD_OPTIONS: readonly FieldOption[] = [
  { key: "id", labelEn: "Row ID", labelRu: "ID строки" },
  { key: "label", labelEn: "Synthetic label", labelRu: "Синтетическая метка" },
  { key: "email", labelEn: "Placeholder email", labelRu: "Тестовый email" },
  { key: "username", labelEn: "Username", labelRu: "Логин" },
  { key: "active", labelEn: "Active status", labelRu: "Статус активности" },
  { key: "score", labelEn: "Score 0–100", labelRu: "Оценка 0–100" },
  { key: "created_at", labelEn: "Created date", labelRu: "Дата создания" },
];

const DAY_MS = 86_400_000;
const DATE_START = Date.UTC(2024, 0, 1);
const DATE_DAYS = 730;

function hashSeed(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function secureUnit() {
  const words = new Uint32Array(2);
  globalThis.crypto.getRandomValues(words);
  return (
    (Math.floor(words[0] / 32) * 67_108_864 + Math.floor(words[1] / 64)) /
    9_007_199_254_740_992
  );
}

function createRandom(seed: string) {
  if (seed.trim()) return seededRandom(hashSeed(seed.trim()));
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    return secureUnit;
  }
  return Math.random;
}

function createRow(
  index: number,
  fields: readonly FieldKey[],
  random: () => number,
  isEn: boolean,
): DataRow {
  const sequence = String(index + 1).padStart(3, "0");
  const row: DataRow = {};

  for (const field of fields) {
    if (field === "id") row.id = "row_" + sequence;
    if (field === "label") {
      row.label = isEn
        ? "Synthetic User " + sequence
        : "Синтетический пользователь " + sequence;
    }
    if (field === "email") row.email = "user" + sequence + "@demo.invalid";
    if (field === "username") row.username = "test_user_" + sequence;
    if (field === "active") row.active = random() >= 0.5;
    if (field === "score") row.score = Math.floor(random() * 101);
    if (field === "created_at") {
      const dayOffset = Math.floor(random() * DATE_DAYS);
      row.created_at = new Date(DATE_START + dayOffset * DAY_MS).toISOString();
    }
  }

  return row;
}

function escapeCsvCell(value: RowValue) {
  return escapeCsvCellForSpreadsheet(value);
}

function toCsv(rows: readonly DataRow[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvCell(row[header])).join(","),
    ),
  ];
  return lines.join("\r\n");
}

function downloadText(value: string, format: OutputFormat) {
  const mime =
    format === "json"
      ? "application/json;charset=utf-8"
      : "text/csv;charset=utf-8";
  const prefix = format === "csv" ? "\uFEFF" : "";
  const url = URL.createObjectURL(new Blob([prefix + value], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "synthetic-data." + format;
  link.click();
  URL.revokeObjectURL(url);
}

export default function MockdataGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [count, setCount] = useState("10");
  const [fields, setFields] = useState<FieldKey[]>([
    "id",
    "label",
    "email",
    "active",
  ]);
  const [format, setFormat] = useState<OutputFormat>("json");
  const [seed, setSeed] = useState("");
  const [rows, setRows] = useState<DataRow[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const output =
    format === "json" ? JSON.stringify(rows, null, 2) : toCsv(rows);

  const generate = () => {
    const parsedCount = Number(count);
    if (
      !Number.isInteger(parsedCount) ||
      parsedCount < 1 ||
      parsedCount > 200
    ) {
      setError(
        isEn
          ? "Row count must be a whole number from 1 to 200."
          : "Количество строк должно быть целым числом от 1 до 200.",
      );
      return;
    }
    if (fields.length === 0) {
      setError(
        isEn ? "Select at least one field." : "Выберите хотя бы одно поле.",
      );
      return;
    }

    const random = createRandom(seed);
    setRows(
      Array.from({ length: parsedCount }, (_, index) =>
        createRow(index, fields, random, isEn),
      ),
    );
    setError("");
    setCopied(false);
    setCopyFailed(false);
  };

  const toggleField = (field: FieldKey) => {
    setFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field],
    );
    setRows([]);
    setError("");
  };

  const copyOutput = async () => {
    const success = await copyText(output);
    setCopyFailed(!success);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-56">
          <Label htmlFor="mockdata-count">
            {isEn ? "Number of rows" : "Количество строк"}
          </Label>
          <Input
            id="mockdata-count"
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            step={1}
            value={count}
            onChange={(event) => setCount(event.target.value)}
            className="mt-1.5 h-12"
          />
        </div>

        <ToolPrimaryAction type="button" className="mt-4" onClick={generate}>
          {isEn
            ? "Generate synthetic dataset"
            : "Создать синтетический набор данных"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the settings" : "Проверьте настройки"}
            description={error}
            className="mt-5"
          />
        ) : rows.length > 0 ? (
          <ToolResult
            status="success"
            title={
              isEn
                ? rows.length + " synthetic rows"
                : "Синтетических строк: " + rows.length
            }
            description={format.toUpperCase()}
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
                  variant="secondary"
                  size="md"
                  onClick={() => downloadText(output, format)}
                >
                  {isEn ? "Download" : "Скачать"}
                </Button>
              </>
            }
          >
            <pre className="max-h-96 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 font-mono text-sm leading-6 text-[var(--color-text)]">
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
                ? "The generated dataset will appear here."
                : "Созданный набор данных появится здесь."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Dataset settings" : "Настройки набора"}
          description={
            isEn
              ? "Fields, JSON or CSV, and an optional repeatable seed"
              : "Поля, JSON или CSV и необязательный повторяемый seed"
          }
        >
          <fieldset>
            <legend className="text-sm font-semibold text-[var(--color-text)]">
              {isEn ? "Fields" : "Поля"}
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {FIELD_OPTIONS.map((field) => (
                <label
                  key={field.key}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium hover:bg-[var(--color-surface-muted)]"
                >
                  <input
                    type="checkbox"
                    checked={fields.includes(field.key)}
                    onChange={() => toggleField(field.key)}
                    className="h-5 w-5 accent-[var(--color-primary)]"
                  />
                  {isEn ? field.labelEn : field.labelRu}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="mockdata-format">
                {isEn ? "Output format" : "Формат вывода"}
              </Label>
              <select
                id="mockdata-format"
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as OutputFormat)
                }
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="mockdata-seed">
                {isEn ? "Repeatable seed (optional)" : "Повторяемый seed"}
              </Label>
              <Input
                id="mockdata-seed"
                value={seed}
                onChange={(event) => {
                  setSeed(event.target.value);
                  setRows([]);
                }}
                className="mt-1.5 h-11"
                autoComplete="off"
              />
            </div>
          </div>
        </AdvancedSettings>

        <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "All rows are synthetic. Placeholder emails use the reserved .invalid domain and cannot receive mail. No national IDs, phone numbers, addresses or location defaults are generated."
            : "Все строки синтетические. Тестовые email используют зарезервированный домен .invalid и не принимают почту. Национальные ID, телефоны, адреса и местоположение не создаются."}
        </p>
      </section>
    </div>
  );
}
