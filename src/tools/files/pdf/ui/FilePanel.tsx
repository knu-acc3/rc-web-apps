"use client";

import { ChevronDown, ChevronUp, FilePlus2, FileText, FileUp, KeyRound, Loader2, RotateCw, Trash2, X } from "lucide-react";
import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { S, pagesCount } from "./strings";
import { Thumb } from "./Thumb";
import type { PdfFile, PdfFiles } from "./use-pdf-files";

const PDF_ACCEPT = ".pdf,application/pdf";
const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

/** Password form for an encrypted file. */
function PasswordRow({ locale, file, onUnlock }: { locale: Locale; file: PdfFile; onUnlock: (pw: string) => void }) {
  const t = S[locale];
  const id = useId();
  const [pw, setPw] = useState("");
  return (
    <form
      className="mt-2 flex flex-wrap items-end gap-2 sm:pl-[3.25rem]"
      onSubmit={(e) => {
        e.preventDefault();
        if (pw) onUnlock(pw);
      }}
    >
      <div className="min-w-0 flex-1 basis-48">
        <label htmlFor={id} className="mb-1 flex items-center gap-1.5 text-sm font-medium text-fg-2">
          <KeyRound className="size-4" aria-hidden />
          {t.passwordNeeded}
        </label>
        <Input id={id} type="password" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} aria-invalid={file.wrongPassword || undefined} placeholder={t.passwordLabel} />
      </div>
      <Button type="submit" variant="filled" disabled={!pw}>
        {t.unlock}
      </Button>
      {file.wrongPassword && (
        <p className="basis-full text-sm text-err" role="alert">
          {t.passwordWrong}
        </p>
      )}
    </form>
  );
}

function FileRow({ locale, file, index, total, pdf, extra, multiple }: { locale: Locale; file: PdfFile; index: number; total: number; pdf: PdfFiles; extra?: ReactNode; multiple: boolean }) {
  const t = S[locale];
  return (
    <li className="rounded-[1rem] px-2 py-2 sm:px-3">
      <div className="flex items-center gap-3">
        {file.status === "ready" && file.thumbs ? (
          <Thumb thumbs={file.thumbs} index={0} className="size-10 shrink-0 rounded-[0.5rem]" />
        ) : (
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-[0.75rem]", file.status === "error" ? "bg-err-soft text-err" : "bg-accent-container text-on-accent-container")} aria-hidden>
            {file.status === "loading" ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-semibold text-fg" title={file.name}>
            {multiple && total > 1 && <span className="tabular mr-1.5 text-fg-3">{index + 1}.</span>}
            {file.name}
          </p>
          <p className="tabular truncate text-sm text-fg-3" aria-live="polite">
            {formatBytes(locale, file.size)}
            {file.status === "ready" && ` · ${pagesCount(locale, file.pages)}`}
            {file.status === "loading" && ` · ${t.loading}`}
          </p>
        </div>
        {multiple && total > 1 && (
          <div className="flex shrink-0">
            <IconButton size="sm" label={`${t.moveUp}: ${file.name}`} title={t.moveUp} icon={<ChevronUp aria-hidden />} disabled={index === 0} onClick={() => pdf.move(file.id, -1)} />
            <IconButton size="sm" label={`${t.moveDown}: ${file.name}`} title={t.moveDown} icon={<ChevronDown aria-hidden />} disabled={index === total - 1} onClick={() => pdf.move(file.id, 1)} />
          </div>
        )}
        {multiple && <IconButton size="sm" label={`${t.remove}: ${file.name}`} title={t.remove} icon={<X aria-hidden />} onClick={() => pdf.remove(file.id)} />}
      </div>
      {file.status === "error" && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 sm:pl-[3.25rem]" role="alert">
          <p className="text-sm text-err">{file.error === "engine" ? t.engine : t.invalid}</p>
          {file.error === "engine" && (
            <Button size="sm" variant="tonal" onClick={() => pdf.retry(file.id)}>
              <RotateCw aria-hidden />
              {t.retry}
            </Button>
          )}
        </div>
      )}
      {file.status === "password" && <PasswordRow locale={locale} file={file} onUnlock={(pw) => pdf.unlock(file.id, pw)} />}
      {extra}
    </li>
  );
}

/**
 * Before a file is chosen: a large dropzone (choosing it starts loading pdf.js).
 * Afterwards: one card with the files (page counts, order, passwords, errors)
 * and two plain buttons — "add more"/"another file" and "clear"; files can
 * still be dropped onto the card.
 */
export function FilePanel({
  locale,
  pdf,
  multiple = false,
  renderExtra,
  disabled,
}: {
  locale: Locale;
  pdf: PdfFiles;
  multiple?: boolean;
  /** Extra controls under a file row (e.g. page range for merge). */
  renderExtra?: (f: PdfFile, index: number) => ReactNode;
  disabled?: boolean;
}) {
  const t = S[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [over, setOver] = useState(false);

  if (!pdf.files.length) {
    return (
      // Reaching for the picker is the moment to fetch pdf.js: it is ready by the time a file is chosen.
      <div onPointerDownCapture={pdf.warm} onDragEnterCapture={pdf.warm} onFocusCapture={pdf.warm}>
        <Dropzone onFiles={pdf.add} accept={PDF_ACCEPT} multiple={multiple} title={multiple ? t.dropPdfs : t.dropPdf} hint={t.dropHint} disabled={disabled} locale={locale} />
      </div>
    );
  }

  const take = (list: FileList | null | undefined) => {
    const files = Array.from(list ?? []).filter(isPdf);
    if (files.length && !disabled) pdf.add(files);
  };

  return (
    <Panel
      className={cn("flex flex-col gap-1 p-2 transition-[background-color,box-shadow] duration-150", over && "bg-accent-soft ring-2 ring-accent")}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current++;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (hasFiles(e)) e.preventDefault();
      }}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setOver(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        take(e.dataTransfer.files);
      }}
    >
      <ul className="flex flex-col gap-1">
        {pdf.files.map((f, i) => (
          <FileRow key={f.id} locale={locale} file={f} index={i} total={pdf.files.length} pdf={pdf} multiple={multiple} extra={renderExtra?.(f, i)} />
        ))}
      </ul>
      <div className="flex flex-wrap gap-1 px-1 pt-1 pb-1">
        <Button variant="tonal" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
          {multiple ? <FilePlus2 aria-hidden /> : <FileUp aria-hidden />}
          {multiple ? t.addMore : t.replace}
        </Button>
        <Button variant="text" size="sm" disabled={disabled} onClick={pdf.clear}>
          {multiple ? <Trash2 aria-hidden /> : <X aria-hidden />}
          {multiple ? t.clearAll : t.close}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={PDF_ACCEPT}
        multiple={multiple}
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
    </Panel>
  );
}
