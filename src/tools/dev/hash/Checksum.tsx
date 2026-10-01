"use client";

import { CircleCheck, CircleHelp, CircleX, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { CodeEditor } from "@/tools/dev/shared/CodeEditor";
import { useWorkerClient } from "@/tools/dev/shared/hooks";
import { Opt, OptionsRow } from "@/tools/dev/shared/Pane";
import { isCancelled } from "@/tools/dev/shared/worker-client";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { ALGO_BY_ID, ALGOS, algosForHexLength, type AlgoId } from "./lib/algorithms";
import { algoFromTag, parseSums, type SumEntry } from "./lib/digest";

const T = {
  ru: {
    drop: "Перетащите файлы для проверки",
    dropHint: "Файлы не загружаются на сервер — хэш считается в браузере",
    expected: "Ожидаемый хэш или список SHA256SUMS / MD5SUMS",
    placeholder: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  file.iso",
    algo: "Алгоритм",
    auto: "Определить по длине",
    ok: "совпадает",
    bad: "не совпадает",
    missing: "нет в списке",
    computed: "вычислен",
    cancel: "Отменить",
    cancelled: "отменено",
    waiting: "в очереди",
    summary: (ok: number, all: number) => `Совпало: ${ok} из ${all}`,
  },
  en: {
    drop: "Drop files to verify",
    dropHint: "Files are never uploaded — hashes are computed in your browser",
    expected: "Expected hash or a SHA256SUMS / MD5SUMS list",
    placeholder: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  file.iso",
    algo: "Algorithm",
    auto: "Detect by length",
    ok: "match",
    bad: "no match",
    missing: "not in the list",
    computed: "computed",
    cancel: "Cancel",
    cancelled: "cancelled",
    waiting: "queued",
    summary: (ok: number, all: number) => `Matched: ${ok} of ${all}`,
  },
} as const;

interface Row {
  file: File;
  algo: AlgoId | null;
  expected?: string;
  digest?: string;
  state: "wait" | "run" | "done" | "cancel" | "error";
  done: number;
  error?: string;
}

const baseName = (p: string) => p.replace(/^.*[\\/]/, "");

function plan(file: File, entries: SumEntry[], forced: AlgoId | "auto"): { algo: AlgoId | null; expected?: string } {
  const byName = entries.find((e) => e.file && baseName(e.file) === file.name);
  const single = entries.length === 1 && !entries[0].file ? entries[0] : undefined;
  const e = byName ?? single ?? (entries.length === 1 ? entries[0] : undefined);
  if (forced !== "auto") return { algo: forced, expected: e?.hash };
  if (!e) return { algo: entries.length ? null : "sha256" };
  return { algo: algoFromTag(e.algo) ?? algosForHexLength(e.hash.length)[0] ?? null, expected: e.hash };
}

export default function Checksum({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const client = useWorkerClient(() => new Worker(new URL("./lib/hash.worker.ts", import.meta.url), { type: "module" }));
  const [text, setText] = useState("");
  const [forced, setForced] = useState<AlgoId | "auto">("auto");
  const [rows, setRows] = useState<Row[]>([]);
  const entries = useMemo(() => parseSums(text), [text]);
  const busy = rows.some((r) => r.state === "run" || r.state === "wait");

  async function start(files: File[]) {
    const planned: Row[] = files.map((file) => ({ file, ...plan(file, entries, forced), state: "wait", done: 0 }));
    setRows(planned);
    try {
      const out = await client.run<(string | null)[]>(
        "files",
        { algo: "sha256", files, algos: planned.map((r) => r.algo) },
        {
          onProgress: (_v, info) => {
            const inf = info as { index: number; done: number; digest?: string };
            setRows((prev) => prev.map((r, i) => (i !== inf.index ? r : { ...r, state: inf.digest ? "done" : "run", done: inf.done, digest: inf.digest ?? r.digest })));
          },
        },
      );
      setRows((prev) => prev.map((r, i) => ({ ...r, state: "done", digest: out[i] ?? undefined })));
    } catch (e) {
      const c = isCancelled(e);
      setRows((prev) => prev.map((r) => (r.state === "done" ? r : { ...r, state: c ? "cancel" : "error", error: c ? undefined : String(e) })));
    }
  }

  const done = rows.filter((r) => r.state === "done" && r.expected);
  const matched = done.filter((r) => r.digest === r.expected).length;

  return (
    <Panel className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3">
          <CodeEditor id={`${id}-exp`} locale={locale} label={t.expected} value={text} onChange={setText} placeholder={t.placeholder} rows={4} fileAccept=".sha256,.sha512,.sha1,.md5,.txt,.sum,text/plain" maxFileBytes={2 * 1024 * 1024} />
          <OptionsRow>
            <Opt label={t.algo}>
              <Select value={forced} size="sm" onChange={(e) => setForced(e.target.value as AlgoId | "auto")}>
            <option value="auto">{t.auto}</option>
            {ALGOS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
              </Select>
            </Opt>
          </OptionsRow>
        </div>
        <Dropzone multiple onFiles={start} title={t.drop} hint={t.dropHint} locale={locale} compact={rows.length > 0} />
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {done.length > 0 && !busy && (
            <p className={cn("flex items-center gap-2 rounded-[1rem] px-4 py-3 text-xl font-bold motion-safe:animate-[menu-in_0.2s_ease-out]", matched === done.length ? "bg-ok-soft text-ok" : "bg-err-soft text-err")} aria-live="polite">
              {matched === done.length ? <CircleCheck className="size-6 shrink-0" aria-hidden /> : <CircleX className="size-6 shrink-0" aria-hidden />}
              {t.summary(matched, done.length)}
            </p>
          )}
          <ul className="flex flex-col gap-1.5">
            {rows.map((r, i) => {
              const verdict = r.state !== "done" ? null : !r.expected ? "none" : r.digest === r.expected ? "ok" : "bad";
              return (
                <li key={i} className="flex flex-col gap-1 rounded-[1rem] bg-surface-2 px-4 py-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-fg-2">{r.file.name}</span>
                    <span className="shrink-0 text-[0.8125rem] text-fg-3">
                      {r.algo ? ALGO_BY_ID.get(r.algo)?.name : ""} · {formatBytes(locale, r.file.size)}
                    </span>
                  </div>
                  {r.state === "run" ? (
                    <progress className="h-1.5 w-full overflow-hidden rounded-full accent-[var(--accent)]" max={100} value={r.file.size ? Math.round((r.done / r.file.size) * 100) : 100} aria-label={r.file.name} />
                  ) : r.state === "done" ? (
                    <div className={`flex items-center gap-1.5 text-sm ${verdict === "ok" ? "text-ok" : verdict === "bad" ? "text-err" : "text-fg-3"}`}>
                      {verdict === "ok" ? <CircleCheck className="size-4 shrink-0" aria-hidden /> : verdict === "bad" ? <CircleX className="size-4 shrink-0" aria-hidden /> : <CircleHelp className="size-4 shrink-0" aria-hidden />}
                      <span className="font-semibold">{verdict === "ok" ? t.ok : verdict === "bad" ? t.bad : r.algo ? t.computed : t.missing}</span>
                      {r.digest && <code className="min-w-0 font-mono text-[0.8125rem] break-all text-fg">{r.digest}</code>}
                    </div>
                  ) : (
                    <span className="text-[0.8125rem] text-fg-3">{r.state === "wait" ? t.waiting : r.state === "cancel" ? t.cancelled : r.error}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {busy && (
            <div className="flex justify-end">
              <Button size="sm" variant="outlined" onClick={() => client.cancel()}>
                <X aria-hidden />
                {t.cancel}
              </Button>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
