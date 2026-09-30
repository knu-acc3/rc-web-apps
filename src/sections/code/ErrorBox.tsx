"use client";

import { Crosshair } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { positionLabel } from "@/sections/code/kit/labels";
import { useWorkerClient } from "@/sections/code/kit/hooks";
import { JobError, JobTimeout } from "@/sections/code/kit/worker-client";
import { buttonClass } from "@/ui/button";
import type { CodeFail } from "./langs";
import { CODE_T, excerpt, revealInEditor } from "./text";

export function useCodeWorker() {
  return useWorkerClient(() => new Worker(new URL("./code.worker.ts", import.meta.url), { type: "module" }));
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
  if (fail.code === "timeout") return <div className="rounded-[0.625rem] bg-err-soft px-4 py-3 text-sm text-err">{t.timeout}</div>;
  const ex = fail.line ? excerpt(text, fail.line, fail.col) : null;
  // for JSON the detail is the offending character, already visible under the caret
  const detail = fail.detail === "jsonc" ? t.jsoncHint : fail.code.startsWith("json-") ? undefined : fail.detail;
  return (
    <div className="flex flex-col gap-2 rounded-[0.625rem] bg-err-soft px-4 py-3 text-sm text-err">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">
          {title ?? t.errors[fail.code] ?? t.errors.syntax}
          {fail.line ? <span className="font-normal"> — {positionLabel(locale, fail.line, fail.col)}</span> : null}
        </div>
        {fail.line ? (
          <button type="button" className={buttonClass("ghost", "sm")} onClick={() => revealInEditor(editorId, text, fail.line!, fail.col)}>
            <Crosshair aria-hidden />
            {t.showInEditor}
          </button>
        ) : null}
      </div>
      {title && t.errors[fail.code] ? <div>{t.errors[fail.code]}</div> : null}
      {detail ? <div className="break-words text-fg-2">{detail}</div> : null}
      {ex ? (
        <pre className="overflow-x-auto rounded-[0.5rem] bg-surface px-3 py-2 font-mono text-[0.8125rem] leading-snug text-fg">
          {ex.src}
          {ex.caret ? `\n${ex.caret}` : ""}
        </pre>
      ) : null}
    </div>
  );
}
