"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatNumber } from "@/i18n/format";
import { downloadBlob, downloadText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { buildDocx, pageParagraphs, toMarkdown, toPlainText, type PageText, type TextItemLike } from "./engine/text";
import { FilePanel } from "./ui/FilePanel";
import { JobStatus, baseName } from "./ui/Result";
import { pagesCount } from "./ui/strings";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";

export type TextFormat = "txt" | "md" | "docx";

const T = {
  ru: {
    format: "Формат",
    formats: { txt: "Текст (.txt)", md: "Markdown (.md)", docx: "Word (.docx)" },
    reading: (i: number, n: number) => `Страница ${i} из ${n}`,
    stats: (pages: number, chars: number, words: number) => `${pagesCount("ru", pages)} · ${count("ru", words, ["слово", "слова", "слов"])} · ${formatNumber("ru", chars)} знаков`,
    download: (f: string) => `Скачать ${f}`,
    copy: "Копировать",
    copied: "Скопировано",
    page: (n: number) => `Страница ${n}`,
    noText: "В этом PDF нет текстового слоя — похоже, это скан или картинки. Здесь текст извлекается без распознавания (OCR), поэтому из сканов его получить нельзя.",
    honest: "Сохраняется только текст по абзацам: вёрстка, таблицы, картинки и шрифты не переносятся.",
    label: "Извлечённый текст",
  },
  en: {
    format: "Format",
    formats: { txt: "Text (.txt)", md: "Markdown (.md)", docx: "Word (.docx)" },
    reading: (i: number, n: number) => `Page ${i} of ${n}`,
    stats: (pages: number, chars: number, words: number) => `${pagesCount("en", pages)} · ${count("en", words, ["word", "words"])} · ${formatNumber("en", chars)} characters`,
    download: (f: string) => `Download ${f}`,
    copy: "Copy",
    copied: "Copied",
    page: (n: number) => `Page ${n}`,
    noText: "This PDF has no text layer — it looks like a scan or images. Text is extracted here without recognition (OCR), so scans yield nothing.",
    honest: "Only the text is kept, paragraph by paragraph: layout, tables, images and fonts are not carried over.",
    label: "Extracted text",
  },
} as const;

export default function ToTextTool({ locale, format: format0 = "txt" }: { locale: Locale; format?: TextFormat }) {
  const t = T[locale];
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const [format, setFormat] = useState<TextFormat>(format0);
  const [pages, setPages] = useState<{ file: string; pages: PageText[] } | null>(null);
  const file = pdf.ready[0] ?? null;
  const { start } = job;

  // Extract as soon as a file is open: reading text is cheap enough to do right away.
  useEffect(() => {
    const doc = file?.doc;
    if (!doc || !file) return;
    let live = true;
    void start(async (ctx) => {
      const out: PageText[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        if (!live || ctx.signal.aborted) throw Object.assign(new Error("cancelled"), { code: "cancelled" });
        ctx.progress((i - 1) / doc.numPages, t.reading(i, doc.numPages));
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        out.push(pageParagraphs(tc.items as TextItemLike[]));
        page.cleanup();
      }
      return out;
    }).then((r) => {
      if (live && r) setPages({ file: file.id, pages: r });
    });
    return () => {
      live = false;
    };
  }, [file, start, t]);

  const current = pages && file && pages.file === file.id ? pages.pages : null;
  const plain = current ? toPlainText(current) : "";
  const shown = current ? (format === "md" ? toMarkdown(current, t.page) : plain) : "";
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;

  async function download() {
    if (!current || !file) return;
    const base = baseName(file.name);
    if (format === "docx") {
      const JSZip = (await import("jszip")).default;
      const blob = await buildDocx<Blob>(new JSZip(), current, "blob");
      downloadBlob(blob, `${base}.docx`);
    } else {
      downloadText(shown, `${base}.${format}`, format === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} />
      <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
      {current && !plain && <Notice tone="warn">{t.noText}</Notice>}
      {current && plain && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented label={t.format} value={format} onChange={setFormat} options={(["txt", "md", "docx"] as const).map((f) => ({ value: f, label: t.formats[f] }))} />
            <div className="flex gap-2">
              <CopyButton value={shown} label={t.copy} copiedLabel={t.copied} size="md" variant="outline" />
              <Button variant="primary" onClick={download}>
                <Download aria-hidden />
                {t.download(format.toUpperCase())}
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-[12px] border border-line bg-surface">
            <p className="tabular border-b border-line px-4 py-2 text-sm text-fg-2" aria-live="polite">
              {t.stats(current.length, plain.length, words)}
            </p>
            <textarea readOnly value={shown} aria-label={t.label} rows={16} spellCheck={false} className="block min-h-72 w-full resize-y bg-transparent px-4 py-3 text-[15px] leading-relaxed text-fg focus:outline-none" />
          </div>
          <p className="text-sm text-fg-3">{t.honest}</p>
        </>
      )}
    </div>
  );
}
