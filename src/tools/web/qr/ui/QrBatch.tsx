"use client";

import { Download } from "lucide-react";
import { useId, useRef, useState } from "react";
import { encode } from "uqr";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Field, Select, Switch, Textarea } from "@/ui/field";
import { Dropzone } from "@/ui/dropzone";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { parseTable, safeName, uniqueNames } from "../lib/csv";
import { contrastCheck, encodeQr, fileSlug, qrPng, qrSvg, type Ecc } from "../lib/qr";
import type { LookState } from "./kit";

const MAX_ROWS = 2000;

const T = {
  ru: {
    input: "Данные: одна строка — один QR-код, или таблица CSV",
    drop: "Или перетащите файл CSV / TXT",
    dropHint: "Разделитель (запятая, точка с запятой, табуляция) определяется сам",
    header: "Первая строка — заголовки",
    content: "Содержимое кода",
    name: "Имя файла",
    byNumber: "По номеру строки",
    col: (i: number, h?: string) => (h ? `${h} (столбец ${i + 1})` : `Столбец ${i + 1}`),
    format: "Формат",
    make: (n: number) => `Скачать ZIP · ${formatNumber("ru", n)} ${plural("ru", n, ["код", "кода", "кодов"])}`,
    cancel: "Отменить",
    progress: (a: number, b: number) => `Готово ${formatNumber("ru", a)} из ${formatNumber("ru", b)}`,
    done: (n: number, skipped: number) => `Архив готов: ${formatNumber("ru", n)} ${plural("ru", n, ["код", "кода", "кодов"])}${skipped ? `, пропущено ${formatNumber("ru", skipped)} — список в errors.txt` : ""}`,
    limit: `Обрабатываются первые ${formatNumber("ru", MAX_ROWS)} строк`,
    contrast: "Исправьте цвета: модули должны быть заметно темнее фона",
    tooLong: "слишком много данных для QR-кода",
  },
  en: {
    input: "Data: one line per QR code, or a CSV table",
    drop: "Or drop a CSV / TXT file",
    dropHint: "The delimiter (comma, semicolon, tab) is detected automatically",
    header: "First row is a header",
    content: "Code content",
    name: "File name",
    byNumber: "Row number",
    col: (i: number, h?: string) => (h ? `${h} (column ${i + 1})` : `Column ${i + 1}`),
    format: "Format",
    make: (n: number) => `Download ZIP · ${formatNumber("en", n)} ${plural("en", n, ["code", "codes"])}`,
    cancel: "Cancel",
    progress: (a: number, b: number) => `Done ${formatNumber("en", a)} of ${formatNumber("en", b)}`,
    done: (n: number, skipped: number) => `Archive ready: ${formatNumber("en", n)} ${plural("en", n, ["code", "codes"])}${skipped ? `, ${formatNumber("en", skipped)} skipped — see errors.txt` : ""}`,
    limit: `Only the first ${formatNumber("en", MAX_ROWS)} rows are processed`,
    contrast: "Fix the colours: modules must be clearly darker than the background",
    tooLong: "too much data for a QR code",
  },
} as const;

type Status = { kind: "idle" } | { kind: "run"; done: number; total: number } | { kind: "done"; count: number; skipped: number };

export default function QrBatch({ locale, look, ecc }: { locale: Locale; look: LookState; ecc: Ecc }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState("");
  const [header, setHeader] = useState(false);
  const [col, setCol] = useState(0);
  const [nameCol, setNameCol] = useState(-1);
  const [format, setFormat] = useState<"png" | "svg">("png");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const cancel = useRef(false);

  const all = parseTable(text);
  const width = all.reduce((m, r) => Math.max(m, r.length), 0);
  const head = header && width > 1 ? all[0] : undefined;
  const rows = (head ? all.slice(1) : all).slice(0, MAX_ROWS);
  const total = head ? all.length - 1 : all.length;
  const contentCol = Math.min(col, Math.max(0, width - 1));
  const items = rows.map((r) => (width > 1 ? (r[contentCol] ?? "") : r.join(",")).trim()).filter(Boolean);
  const contrast = contrastCheck(look.fg, look.bg);

  async function readFile(f: File) {
    setText(await f.text());
    setStatus({ kind: "idle" });
  }

  async function run() {
    cancel.current = false;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const list = rows.filter((r) => (width > 1 ? (r[contentCol] ?? "") : r.join(",")).trim());
    const base = list.map((r, i) => {
      const content = (width > 1 ? (r[contentCol] ?? "") : r.join(",")).trim();
      const n = String(i + 1).padStart(String(list.length).length, "0");
      return nameCol >= 0 && width > 1 ? safeName(r[nameCol] ?? "", `qr-${n}`) : `${n}-${fileSlug(content)}`;
    });
    const names = uniqueNames(base);
    const errors: string[] = [];
    let count = 0;
    setStatus({ kind: "run", done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      if (cancel.current) {
        setStatus({ kind: "idle" });
        return;
      }
      const content = (width > 1 ? (list[i][contentCol] ?? "") : list[i].join(",")).trim();
      const m = encodeQr(encode, content, ecc);
      if (!m) {
        errors.push(`${i + 1}\t${names[i]}\t${t.tooLong}`);
      } else if (format === "svg") {
        zip.file(`${names[i]}.svg`, qrSvg(m, look));
        count++;
      } else {
        zip.file(`${names[i]}.png`, await qrPng(m, look, 1024));
        count++;
      }
      if (i % 20 === 19) {
        setStatus({ kind: "run", done: i + 1, total: list.length });
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    if (errors.length) zip.file("errors.txt", errors.join("\n"));
    const blob = await zip.generateAsync({ type: "blob" });
    if (cancel.current) {
      setStatus({ kind: "idle" });
      return;
    }
    downloadBlob(blob, "qr-codes.zip");
    setStatus({ kind: "done", count, skipped: errors.length });
  }

  const running = status.kind === "run";

  return (
    <div className="flex flex-col gap-4">
      <Field label={t.input} htmlFor={`${id}-text`}>
        <Textarea
          id={`${id}-text`}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setStatus({ kind: "idle" });
          }}
          rows={8}
          className="font-mono text-sm"
          placeholder={"https://example.com/1\nhttps://example.com/2\nhttps://example.com/3"}
          spellCheck={false}
        />
      </Field>
      <Dropzone locale={locale} compact accept=".csv,.txt,text/csv,text/plain" onFiles={(fs) => fs[0] && readFile(fs[0])} title={t.drop} hint={t.dropHint} />

      {width > 1 && (
        <div className="flex flex-wrap items-end gap-4">
          <Field label={t.content} htmlFor={`${id}-col`}>
            <Select id={`${id}-col`} value={String(contentCol)} onChange={(e) => setCol(Number(e.target.value))}>
              {Array.from({ length: width }, (_, i) => (
                <option key={i} value={i}>
                  {t.col(i, head?.[i])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.name} htmlFor={`${id}-name`}>
            <Select id={`${id}-name`} value={String(nameCol)} onChange={(e) => setNameCol(Number(e.target.value))}>
              <option value={-1}>{t.byNumber}</option>
              {Array.from({ length: width }, (_, i) => (
                <option key={i} value={i}>
                  {t.col(i, head?.[i])}
                </option>
              ))}
            </Select>
          </Field>
          <Switch label={t.header} checked={header} onChange={(e) => setHeader(e.target.checked)} className="pb-0.5" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Segmented<"png" | "svg">
          size="lg"
          label={t.format}
          value={format}
          onChange={setFormat}
          options={[
            { value: "png", label: "PNG" },
            { value: "svg", label: "SVG" },
          ]}
        />
        {running ? (
          <Button variant="outlined" size="lg" onClick={() => (cancel.current = true)}>
            {t.cancel}
          </Button>
        ) : (
          <Button variant="filled" size="lg" onClick={run} disabled={!items.length || !!contrast.issue}>
            <Download aria-hidden />
            {t.make(items.length)}
          </Button>
        )}
      </div>

      {running && (
        <div className="flex flex-col gap-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={status.total} aria-valuenow={status.done}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${status.total ? (status.done / status.total) * 100 : 0}%` }} />
          </div>
          <span className="text-sm text-fg-3">{t.progress(status.done, status.total)}</span>
        </div>
      )}
      <div aria-live="polite" className="flex flex-col gap-2 empty:hidden">
        {status.kind === "done" && <Notice tone={status.skipped ? "warn" : "ok"}>{t.done(status.count, status.skipped)}</Notice>}
        {total > MAX_ROWS && <Notice tone="warn">{t.limit}</Notice>}
        {contrast.issue && <Notice tone="err">{t.contrast}</Notice>}
      </div>
    </div>
  );
}
