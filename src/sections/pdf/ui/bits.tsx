"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { runPdfJob } from "../engine/client";
import type { Job as PdfJob, JobResult } from "../engine/jobs";
import type { JobContext } from "./use-job";

/** Run a worker job wired to a useJob context (progress + cancel). */
export function workerJob(job: PdfJob, ctx: JobContext): Promise<JobResult> {
  return runPdfJob(job, { onProgress: (p) => ctx.progress(p), signal: ctx.signal });
}

/** The one quiet row of secondary options. */
export function OptionsRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-end gap-x-4 gap-y-3", className)}>{children}</div>;
}

/** The main action of a tool: large, full-width on phones. */
export function PrimaryButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <Button variant="primary" size="lg" className="w-full sm:w-auto sm:min-w-56 sm:self-start" disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}

/** Small uppercase-free caption above a control group. */
export function Caption({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium text-fg-2">{children}</span>;
}
