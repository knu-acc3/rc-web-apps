"use client";

import { ChevronDown, ChevronUp, FileText, KeyRound, Loader2, X } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { S, pagesCount } from "./strings";
import type { PdfFile, PdfFiles } from "./use-pdf-files";

const PDF_ACCEPT = ".pdf,application/pdf";

/** Password form for an encrypted file. */
function PasswordRow({ locale, file, onUnlock }: { locale: Locale; file: PdfFile; onUnlock: (pw: string) => void }) {
  const t = S[locale];
  const id = useId();
  const [pw, setPw] = useState("");
  return (
    <form
      className="mt-2 flex flex-wrap items-end gap-2"
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
        <Input id={id} type="password" size="sm" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} aria-invalid={file.wrongPassword || undefined} placeholder={t.passwordLabel} />
      </div>
      <Button type="submit" size="sm" variant="primary" disabled={!pw}>
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

function FileRow({
  locale,
  file,
  index,
  total,
  pdf,
  extra,
  reorder,
}: {
  locale: Locale;
  file: PdfFile;
  index: number;
  total: number;
  pdf: PdfFiles;
  extra?: ReactNode;
  reorder: boolean;
}) {
  const t = S[locale];
  return (
    <li className="px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[0.5rem] bg-err-soft text-err" aria-hidden>
          {file.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-medium text-fg" title={file.name}>
            {reorder && <span className="tabular mr-1.5 text-fg-3">{index + 1}.</span>}
            {file.name}
          </p>
          <p className="text-sm text-fg-3">
            {formatBytes(locale, file.size)}
            {file.status === "ready" && ` · ${pagesCount(locale, file.pages)}`}
            {file.status === "loading" && ` · ${t.loading}`}
            {file.status === "error" && <span className="text-err"> · {t.invalid}</span>}
          </p>
        </div>
        {reorder && total > 1 && (
          <div className="flex shrink-0 gap-0.5">
            <Button size="icon-sm" variant="ghost" aria-label={`${t.moveUp}: ${file.name}`} title={t.moveUp} disabled={index === 0} onClick={() => pdf.move(file.id, -1)}>
              <ChevronUp />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label={`${t.moveDown}: ${file.name}`} title={t.moveDown} disabled={index === total - 1} onClick={() => pdf.move(file.id, 1)}>
              <ChevronDown />
            </Button>
          </div>
        )}
        <Button size="icon-sm" variant="ghost" aria-label={`${t.remove}: ${file.name}`} title={t.remove} onClick={() => pdf.remove(file.id)}>
          <X />
        </Button>
      </div>
      {file.status === "password" && <PasswordRow locale={locale} file={file} onUnlock={(pw) => pdf.unlock(file.id, pw)} />}
      {extra}
    </li>
  );
}

/**
 * Dropzone + list of opened PDFs (page counts, reordering, password prompts).
 * With no files it shows a large dropzone; afterwards a compact one.
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
  if (!pdf.files.length) {
    return <Dropzone onFiles={pdf.add} accept={PDF_ACCEPT} multiple={multiple} title={multiple ? t.dropPdfs : t.dropPdf} hint={t.dropHint} disabled={disabled} />;
  }
  return (
    <Panel className="overflow-hidden">
      <ul className="divide-y divide-line">
        {pdf.files.map((f, i) => (
          <FileRow key={f.id} locale={locale} file={f} index={i} total={pdf.files.length} pdf={pdf} reorder={multiple} extra={renderExtra?.(f, i)} />
        ))}
      </ul>
      <div className="border-t border-line p-2">
        <Dropzone onFiles={pdf.add} accept={PDF_ACCEPT} multiple={multiple} compact title={multiple ? t.addMore : t.replace} disabled={disabled} className="min-h-14! flex-row! py-2!" />
      </div>
    </Panel>
  );
}
