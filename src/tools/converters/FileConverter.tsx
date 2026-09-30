"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DownloadSimple, FileZip, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { convertDetectedFile } from "@/src/lib/file-conversion/convert-file";
import {
  detectFile,
  estimateOutputSize,
  getLimitError,
  OUTPUT_FORMATS,
  OUTPUT_LABELS,
  recommendedFormat,
  ZIP_RESULT_LIMIT,
} from "@/src/lib/file-conversion/formats";
import { cancelMediaConversion } from "@/src/lib/file-conversion/media-engine";
import type { ConversionFormat, ConversionJob, FileCategory } from "@/src/lib/file-conversion/types";
import { downloadBlob } from "@/src/utils/exportHelpers";
import { ConverterDropzone } from "@/src/components/file-converter/ConverterDropzone";
import { ConversionQueue } from "@/src/components/file-converter/ConversionQueue";

const categories: Exclude<FileCategory, "unknown">[] = ["image", "audio", "video", "pdf"];
let jobSequence = 0;

function categoryName(category: Exclude<FileCategory, "unknown">, isEn: boolean) {
  const labels = {
    image: isEn ? "Images" : "Изображения",
    audio: isEn ? "Audio" : "Аудио",
    video: isEn ? "Video" : "Видео",
    pdf: "PDF",
  };
  return labels[category];
}

export default function FileConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [adding, setAdding] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejections, setRejections] = useState<string[]>([]);
  const jobsRef = useRef(jobs);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeControllerRef = useRef<AbortController | null>(null);
  const activeJobRef = useRef<string | null>(null);
  const cancelledRef = useRef(new Set<string>());

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    const root = rootRef.current;
    root?.setAttribute("data-file-converter-ready", "true");
    return () => root?.removeAttribute("data-file-converter-ready");
  }, []);

  useEffect(() => () => {
    activeControllerRef.current?.abort();
    cancelMediaConversion();
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setAdding(true);
    const additions: ConversionJob[] = [];
    const errors: string[] = [];
    for (const file of files) {
      try {
        const detected = await detectFile(file);
        const limitError = getLimitError(detected, isEn);
        const outputFormat = recommendedFormat(detected);
        if (limitError || !outputFormat) {
          errors.push(limitError || (isEn ? `${file.name}: unsupported file type.` : `${file.name}: тип файла не поддерживается.`));
          continue;
        }
        additions.push({
          id: `conversion-${Date.now()}-${++jobSequence}`,
          detected,
          outputFormat,
          status: "ready",
          progress: 0,
          estimatedSize: estimateOutputSize(detected, outputFormat),
          result: null,
          error: null,
          warning: detected.animated && outputFormat !== "webp" && outputFormat !== "gif"
            ? (isEn ? "A static output keeps the first animation frame." : "В статичный формат попадёт первый кадр анимации.")
            : detected.category === "video"
              ? (isEn ? "Browser conversion may take longer than the video duration." : "Конвертация в браузере может идти дольше длительности видео.")
              : null,
        });
      } catch {
        errors.push(isEn ? `${file.name}: the file is damaged or cannot be read.` : `${file.name}: файл повреждён или не читается.`);
      }
    }
    if (additions.length > 0) setJobs((current) => [...current, ...additions]);
    setRejections(errors);
    if (errors.length > 0) toast.error(isEn ? `${errors.length} file(s) could not be added` : `Не удалось добавить файлов: ${errors.length}`);
    setAdding(false);
  }, [isEn]);

  const setFormat = useCallback((id: string, format: ConversionFormat) => {
    setJobs((current) => current.map((job) => job.id === id ? {
      ...job,
      outputFormat: format,
      status: "ready",
      progress: 0,
      result: null,
      error: null,
      estimatedSize: estimateOutputSize(job.detected, format),
      warning: job.detected.animated && format !== "webp" && format !== "gif"
        ? (isEn ? "A static output keeps the first animation frame." : "В статичный формат попадёт первый кадр анимации.")
        : job.warning,
    } : job));
  }, [isEn]);

  const convertAll = useCallback(async () => {
    if (processing) return;
    setProcessing(true);
    cancelledRef.current.clear();
    const queue = jobsRef.current.filter((job) => job.status !== "done" && job.detected.category !== "unknown");
    for (const queued of queue) {
      if (cancelledRef.current.has(queued.id)) continue;
      const controller = new AbortController();
      activeControllerRef.current = controller;
      activeJobRef.current = queued.id;
      setJobs((current) => current.map((job) => job.id === queued.id ? { ...job, status: "processing", progress: 0, error: null } : job));
      try {
        const latest = jobsRef.current.find((job) => job.id === queued.id) ?? queued;
        const result = await convertDetectedFile(latest.detected, latest.outputFormat, {
          signal: controller.signal,
          onProgress: (progress) => setJobs((current) => current.map((job) => job.id === queued.id ? { ...job, progress } : job)),
        });
        if (controller.signal.aborted || cancelledRef.current.has(queued.id)) {
          setJobs((current) => current.map((job) => job.id === queued.id ? { ...job, status: "cancelled", progress: 0 } : job));
        } else {
          setJobs((current) => current.map((job) => job.id === queued.id ? { ...job, status: "done", progress: 1, result, estimatedSize: result.blob.size } : job));
        }
      } catch (error) {
        const cancelled = controller.signal.aborted || cancelledRef.current.has(queued.id);
        const message = error instanceof Error ? error.message : String(error);
        setJobs((current) => current.map((job) => job.id === queued.id ? {
          ...job,
          status: cancelled ? "cancelled" : "error",
          error: cancelled ? null : (isEn ? `Conversion failed: ${message}` : `Не удалось конвертировать: ${message}`),
          progress: 0,
        } : job));
      }
    }
    activeControllerRef.current = null;
    activeJobRef.current = null;
    setProcessing(false);
  }, [isEn, processing]);

  const cancelJob = useCallback((id: string) => {
    cancelledRef.current.add(id);
    if (activeJobRef.current === id) {
      activeControllerRef.current?.abort();
      const job = jobsRef.current.find((entry) => entry.id === id);
      if (job?.detected.category === "audio" || job?.detected.category === "video") cancelMediaConversion();
    }
  }, []);

  const downloadJob = useCallback((job: ConversionJob) => {
    if (job.result) downloadBlob(job.result.blob, job.result.fileName);
  }, []);

  const doneJobs = jobs.filter((job) => job.status === "done" && job.result);
  const totalOriginal = jobs.reduce((sum, job) => sum + job.detected.file.size, 0);
  const totalExpected = jobs.reduce((sum, job) => sum + (job.result?.blob.size ?? job.estimatedSize ?? 0), 0);
  const allReady = jobs.length > 0 && doneJobs.length === jobs.length;
  const canZip = doneJobs.reduce((sum, job) => sum + (job.result?.blob.size ?? 0), 0) <= ZIP_RESULT_LIMIT;

  const downloadAll = useCallback(async () => {
    const finished = jobsRef.current.filter((job) => job.status === "done" && job.result);
    const total = finished.reduce((sum, job) => sum + job.result!.blob.size, 0);
    if (finished.length === 1) {
      downloadBlob(finished[0].result!.blob, finished[0].result!.fileName);
      return;
    }
    if (total <= ZIP_RESULT_LIMIT) {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const used = new Set<string>();
      for (const job of finished) {
        let name = job.result!.fileName;
        let suffix = 2;
        while (used.has(name)) name = `${name.replace(/(\.[^.]+)?$/, "")}-${suffix++}${name.match(/\.[^.]+$/)?.[0] ?? ""}`;
        used.add(name);
        zip.file(name, job.result!.blob);
      }
      downloadBlob(await zip.generateAsync({ type: "blob", compression: "DEFLATE" }), "converted-files.zip");
      return;
    }
    finished.forEach(downloadJob);
    toast.info(isEn ? "The result is over 500 MB, so files are downloaded separately." : "Результат больше 500 МБ — файлы скачиваются отдельно.");
  }, [downloadJob, isEn]);

  const savings = totalOriginal > 0 ? Math.round((1 - totalExpected / totalOriginal) * 100) : 0;
  const bulkOptions = useMemo(() => categories.flatMap((category) => OUTPUT_FORMATS[category].map((format) => ({ category, format }))), []);

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-6xl space-y-4">
      <ConverterDropzone compact={jobs.length > 0} disabled={adding || processing} isEn={isEn} onFiles={(files) => void addFiles(files)} />

      {rejections.length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/35 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]" role="alert">
          <div className="font-bold">{isEn ? "Some files were not added" : "Некоторые файлы не добавлены"}</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">{rejections.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul>
        </div>
      )}

      {jobs.length > 0 && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-bold">{isEn ? `${jobs.length} file(s)` : `${jobs.length} файл(ов)`}</div>
            <div className="flex flex-col gap-2 xs:flex-row">
              <Select onValueChange={(value) => {
                const [category, format] = value.split(":") as [Exclude<FileCategory, "unknown">, ConversionFormat];
                setJobs((current) => current.map((job) => job.detected.category === category && job.status !== "processing" ? {
                  ...job, outputFormat: format, status: "ready", result: null, error: null, progress: 0,
                  estimatedSize: estimateOutputSize(job.detected, format),
                } : job));
              }} disabled={processing}>
                <SelectTrigger className="w-full xs:w-64" aria-label={isEn ? "Change output format in bulk" : "Изменить формат массово"}>
                  <SelectValue placeholder={isEn ? "Change format in bulk" : "Изменить формат массово"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectGroup key={category}>
                      <SelectLabel>{categoryName(category, isEn)}</SelectLabel>
                      {bulkOptions.filter((option) => option.category === category).map((option) => (
                        <SelectItem key={`${category}:${option.format}`} value={`${category}:${option.format}`}>
                          {categoryName(category, isEn)} → {OUTPUT_LABELS[option.format]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" onClick={() => { setJobs([]); setRejections([]); }} disabled={processing}>
                <Trash size={18} /> {isEn ? "Clear" : "Очистить"}
              </Button>
            </div>
          </div>

          <ConversionQueue jobs={jobs} isEn={isEn} onCancel={cancelJob} onDownload={downloadJob} onFormat={setFormat} onRemove={(id) => setJobs((current) => current.filter((job) => job.id !== id))} />

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[var(--color-text-muted)]">
                {isEn ? "Original" : "Исходный размер"}: <strong className="text-[var(--color-text)]">{(totalOriginal / 1024 / 1024).toFixed(1)} MB</strong>
              </span>
              <span className="text-[var(--color-text-muted)]">
                {allReady ? (isEn ? "Result" : "Результат") : (isEn ? "Estimated result" : "Ожидаемый результат")}: <strong className="text-[var(--color-text)]">{(totalExpected / 1024 / 1024).toFixed(1)} MB</strong>
                {savings > 0 && <span className="ml-2 font-bold text-[var(--color-success)]">−{savings}%</span>}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                size="lg"
                className="h-11 w-auto min-w-[200px] px-6 shadow-sm"
                onClick={() => void (allReady ? downloadAll() : convertAll())}
                disabled={!allReady && (processing || jobs.every((job) => job.status === "error"))}
              >
                {allReady && (doneJobs.length > 1 && canZip ? <FileZip size={21} /> : <DownloadSimple size={21} />)}
                {allReady
                  ? doneJobs.length > 1 && canZip
                    ? (isEn ? `Download ZIP (${doneJobs.length})` : `Скачать ZIP (${doneJobs.length})`)
                    : (isEn ? "Download result" : "Скачать результат")
                  : processing
                    ? (isEn ? "Converting one by one…" : "Последовательная конвертация…")
                    : (isEn ? `Convert all (${jobs.length})` : `Конвертировать всё (${jobs.length})`)}
              </Button>
            </div>
          </Card>

          <AdvancedSettings
            title={isEn ? "Local processing details" : "Как обрабатываются файлы"}
            description={isEn ? "Limits, privacy and browser performance" : "Лимиты, приватность и скорость браузера"}
          >
            <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
              <li>{isEn ? "Images and PDF: up to 250 MB; audio: 500 MB; video: 1 GB." : "Изображения и PDF: до 250 МБ; аудио: 500 МБ; видео: 1 ГБ."}</li>
              <li>{isEn ? "Files are processed sequentially and never uploaded." : "Файлы обрабатываются по очереди и не загружаются на сервер."}</li>
              <li>{isEn ? "Media conversion starts FFmpeg only when an audio or video file is processed." : "FFmpeg загружается только при обработке аудио или видео."}</li>
            </ul>
          </AdvancedSettings>
        </>
      )}
    </div>
  );
}
