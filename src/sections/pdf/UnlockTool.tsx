"use client";

import { LockOpen } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";

const T = {
  ru: {
    intro: "Если файл просит пароль при открытии, введите его выше. Файлы, которые открываются без пароля, но запрещают печать или копирование, разблокируются сразу.",
    go: "Снять пароль",
    done: "Шифрование и ограничения сняты — файл открывается без пароля в любой программе.",
  },
  en: {
    intro: "If the file asks for a password when opened, enter it above. Files that open without a password but block printing or copying are unlocked right away.",
    go: "Remove password",
    done: "Encryption and restrictions removed — the file opens without a password in any app.",
  },
} as const;

export default function UnlockTool({ locale }: { locale: Locale }) {
  const t = T[locale];
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const file = pdf.ready[0] ?? null;

  async function unlock() {
    if (!file) return;
    setResult(null);
    const out = await job.start((ctx) => workerJob({ type: "unlock", source: { bytes: file.bytes!.slice(0), password: file.password } }, ctx));
    if (out) setResult([{ name: `${baseName(file.name)}-unlocked.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {pdf.files.length > 0 && !result && <p className="max-w-3xl text-sm text-fg-3">{t.intro}</p>}
      {file && (
        <>
          <PrimaryButton disabled={job.running} onClick={unlock}>
            <LockOpen aria-hidden />
            {t.go}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
          {result && (
            <ResultCard
              locale={locale}
              items={result}
              notice={t.done}
              onReset={() => {
                setResult(null);
                pdf.clear();
                job.reset();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
