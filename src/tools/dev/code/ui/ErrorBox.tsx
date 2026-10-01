"use client";

import { Crosshair } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { positionLabel } from "@/tools/dev/shared/labels";
import { useWorkerClient } from "@/tools/dev/shared/hooks";
import { JobError, JobTimeout } from "@/tools/dev/shared/worker-client";
import { Button } from "@/ui/button";
import { Notice } from "@/ui/panel";
import type { CodeFail } from "../lib/langs";
import { CODE_T, excerpt, revealInEditor } from "../content/text";

export function useCodeWorker() {
  return useWorkerClient(() => new Worker(new URL("../lib/code.worker.ts", import.meta.url), { type: "module" }));
}

/** Normalizes a worker error into a CodeFail (or a timeout marker). */
export function failOf(error: unknown): CodeFail | null {
  if (!error) return null;
  if (error instanceof JobTimeout) return { code: "timeout" };
  if (error instanceof JobError) return (error.data as CodeFail | undefined) ?? { code: "syntax", detail: error.message };
  return { code: "syntax", detail: String((error as Error)?.message ?? error) };
}

/** Error with its position, the source line with a caret and a "show in editor" action. */
export function ErrorBox({ locale, fail, text, editorId, title }: { locale: Locale; fail: CodeFail; text: string; editorId: string; title?: string }) {
  const t = CODE_T[locale];
  if (fail.code === "timeout") return <Notice tone="err">{t.timeout}</Notice>;
  const ex = fail.line ? excerpt(text, fail.line, fail.col) : null;
  // for JSON the detail is the offending character, already visible under the caret
  const detail = fail.detail === "jsonc" ? t.jsoncHint : fail.code.startsWith("json-") ? undefined : fail.detail;
  return (
    <Notice tone="err" className="flex min-w-0 flex-col gap-2 motion-safe:animate-[menu-in_0.2s_ease-out]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[0.9375rem] font-semibold">
          {title ?? t.errors[fail.code] ?? t.errors.syntax}
          {fail.line ? <span className="font-normal"> — {positionLabel(locale, fail.line, fail.col)}</span> : null}
        </div>
        {fail.line ? (
          <Button variant="elevated" size="sm" onClick={() => revealInEditor(editorId, text, fail.line!, fail.col)}>
            <Crosshair aria-hidden />
            {t.showInEditor}
          </Button>
        ) : null}
      </div>
      {title && t.errors[fail.code] ? <div>{t.errors[fail.code]}</div> : null}
      {detail ? <div className="break-words text-fg-2">{detail}</div> : null}
      {ex ? (
        <pre className="max-w-full overflow-x-auto rounded-[0.75rem] bg-surface px-3 py-2 font-mono text-[0.8125rem] leading-snug text-fg">
          {ex.src}
          {ex.caret ? `\n${ex.caret}` : ""}
        </pre>
      ) : null}
    </Notice>
  );
}
