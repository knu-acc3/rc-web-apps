"use client";

import { LockOpen } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";
import { Workspace } from "./ui/Workspace";

const T = {
  ru: {
    intro: "Если файл просит пароль при открытии, введите его выше; запреты на печать и копирование снимаются без пароля.",
    go: "Снять пароль",
    done: "Шифрование и ограничения сняты — файл открывается без пароля в любой программе.",
  },
  en: {
    intro: "If the file asks for a password when opened, enter it above; print and copy restrictions are removed without one.",
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

  const files = <FilePanel locale={locale} pdf={pdf} disabled={job.running} />;
  if (!file) {
    return (
      <div className="flex flex-col gap-4">
        {files}
        {pdf.files.length > 0 && <p className="text-sm text-fg-3">{t.intro}</p>}
      </div>
    );
  }
  return (
    <Workspace
      files={files}
      action={
        <>
          <PrimaryButton disabled={job.running} done={!!result} onClick={unlock}>
            <LockOpen aria-hidden />
            {t.go}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
        </>
      }
      result={
        result && (
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
        )
      }
    />
  );
}
