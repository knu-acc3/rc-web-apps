"use client";

import { CircleCheck, CircleX, X } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { CodeEditor } from "@/tools/dev/shared/CodeEditor";
import { useLiveTask, useWorkerClient } from "@/tools/dev/shared/hooks";
import { Opt, OptionsRow, Pane } from "@/tools/dev/shared/Pane";
import { isCancelled } from "@/tools/dev/shared/worker-client";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { ALGO_BY_ID, type AlgoId } from "./lib/algorithms";
import { digestMatches, formatDigest, type OutFormat } from "./lib/digest";
import { decodeInput, INPUT_ENC_LABEL, type InputEncoding } from "./lib/input";

const T = {
  ru: {
    modes: { text: "Текст", files: "Файлы" },
    mode: "Источник",
    input: "Текст",
    placeholder: "Введите или вставьте текст — хэш считается сразу",
    inputEnc: "Ввод",
    key: "Секретный ключ",
    keyEnc: "Ключ",
    out: "Формат",
    bits: "Длина",
    bitsUnit: "бит",
    expected: "Сверить с",
    expectedPh: "ожидаемый хэш",
    match: "совпадает",
    mismatch: "не совпадает",
    empty: "пустая строка",
    drop: "Перетащите файлы или нажмите, чтобы выбрать",
    dropHint: "Файлы читаются частями прямо в браузере — подойдут и файлы в несколько гигабайт",
    cancel: "Отменить",
    cancelled: "отменено",
    waiting: "в очереди",
    copyAll: "Копировать список",
    copy: "Копировать",
    copied: "Скопировано",
    fmt: { hex: "hex", HEX: "HEX", base64: "Base64", base64url: "Base64url" },
  },
  en: {
    modes: { text: "Text", files: "Files" },
    mode: "Source",
    input: "Text",
    placeholder: "Type or paste text — the hash updates instantly",
    inputEnc: "Input",
    key: "Secret key",
    keyEnc: "Key",
    out: "Format",
    bits: "Length",
    bitsUnit: "bits",
    expected: "Compare with",
    expectedPh: "expected hash",
    match: "match",
    mismatch: "no match",
    empty: "empty string",
    drop: "Drop files or click to choose",
    dropHint: "Files are read in chunks right in your browser — multi-gigabyte files work too",
    cancel: "Cancel",
    cancelled: "cancelled",
    waiting: "queued",
    copyAll: "Copy list",
    copy: "Copy",
    copied: "Copied",
    fmt: { hex: "hex", HEX: "HEX", base64: "Base64", base64url: "Base64url" },
  },
} as const;

const newWorker = () => new Worker(new URL("./lib/hash.worker.ts", import.meta.url), { type: "module" });

export interface HashToolProps {
  locale: Locale;
  algo: AlgoId;
  hmac?: boolean;
  sample?: string;
}

export default function HashTool({ locale, algo, hmac = false, sample = "" }: HashToolProps) {
  const t = T[locale];
  const id = useId();
  const def = ALGO_BY_ID.get(algo)!;
  const [mode, setMode] = useState<"text" | "files">("text");
  const [text, setText] = useState(sample);
  const [enc, setEnc] = useState<InputEncoding>("utf8");
  const [key, setKey] = useState(hmac ? "key" : "");
  const [keyEnc, setKeyEnc] = useState<InputEncoding>("utf8");
  const [bits, setBits] = useState(def.bits);
  const [fmt, setFmt] = useState<OutFormat>("hex");
  const [expected, setExpected] = useState("");
  const client = useWorkerClient(newWorker);

  const data = decodeInput(text, enc);
  const keyBytes = hmac ? decodeInput(key, keyEnc) : null;
  const keyError = keyBytes && "error" in keyBytes ? keyBytes.error : null;
  const inputError = "error" in data ? data.error : keyError;
  const bitsOpt = def.bitsOptions ? bits : undefined;
  const keyArg = keyBytes && "bytes" in keyBytes ? keyBytes.bytes : undefined;

  const live = useLiveTask<string>(
    `${algo}|${bits}|${enc}|${hmac ? `${keyEnc}|${key}` : ""}|${text}`,
    inputError || mode !== "text" ? null : () => client.run<string>("text", { algo, bits: bitsOpt, key: keyArg, data: "bytes" in data ? data.bytes : new Uint8Array() }),
    100,
  );
  const hex = live.value ?? "";
  const shown = formatDigest(hex || live.stale || "", fmt);
  const verdict = mode === "text" && expected.trim() && hex ? digestMatches(hex, expected) : null;
  const title = hmac ? `HMAC-${def.name.replace(/ \(.*\)$/, "")}` : def.name;

  const encOpts = (Object.keys(INPUT_ENC_LABEL[locale]) as InputEncoding[]).map((v) => ({ value: v, label: INPUT_ENC_LABEL[locale][v] }));
  const digest = inputError ? "" : formatDigest(hex, fmt);

  return (
    <Panel className="flex flex-col gap-4 p-4 sm:p-6">
      <Segmented label={t.mode} value={mode} onChange={setMode} options={[{ value: "text", label: t.modes.text }, { value: "files", label: t.modes.files }]} className="self-start" />

      {hmac && (
        <Field label={t.key} htmlFor={`${id}-key`} error={keyError ?? undefined} aside={<Segmented size="sm" label={t.keyEnc} value={keyEnc} onChange={setKeyEnc} options={encOpts} />}>
          <Input id={`${id}-key`} value={key} onChange={(e) => setKey(e.target.value)} className="font-mono" spellCheck={false} autoComplete="off" aria-invalid={!!keyError} />
        </Field>
      )}

      {mode === "text" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <CodeEditor id={`${id}-in`} locale={locale} label={t.input} value={text} onChange={setText} placeholder={t.placeholder} rows={6} wrap invalid={"error" in data} />
            {"error" in data && <Notice tone="err">{data.error}</Notice>}
          </div>
          <Pane
            title={
              <>
                {title}
                {text === "" && !inputError ? <span className="font-normal text-fg-3"> · {t.empty}</span> : null}
              </>
            }
            actions={<CopyButton value={digest} label={t.copy} copiedLabel={t.copied} variant="secondary" compact />}
            footer={
              verdict !== null ? (
                <span className={cn("flex items-center gap-1.5 text-sm font-semibold", verdict ? "text-ok" : "text-err")} aria-live="polite">
                  {verdict ? <CircleCheck className="size-4" aria-hidden /> : <CircleX className="size-4" aria-hidden />}
                  {verdict ? t.match : t.mismatch}
                </span>
              ) : undefined
            }
          >
            <output className={cn("block flex-1 px-4 py-4 font-mono text-xl font-semibold break-all sm:text-2xl", live.pending ? "text-fg-3" : verdict === true ? "text-ok" : verdict === false ? "text-err" : "text-fg")} aria-live="polite">
              {inputError ? "—" : shown}
            </output>
          </Pane>
        </div>
      ) : (
        <FileHasher locale={locale} algo={algo} bits={bitsOpt} hmacKey={keyArg} fmt={fmt} expected={expected} />
      )}

      <OptionsRow>
        {mode === "text" && (
          <Opt label={t.inputEnc} group>
            <Segmented size="sm" label={t.inputEnc} value={enc} onChange={setEnc} options={encOpts} />
          </Opt>
        )}
        <Opt label={t.out} group>
          <Segmented size="sm" label={t.out} value={fmt} onChange={setFmt} options={(Object.keys(t.fmt) as OutFormat[]).map((v) => ({ value: v, label: t.fmt[v] }))} />
        </Opt>
        {def.bitsOptions && (
          <Opt label={t.bits} group>
            <Segmented size="sm" label={t.bits} value={String(bits)} onChange={(v) => setBits(Number(v))} options={def.bitsOptions.map((b) => ({ value: String(b), label: `${b} ${t.bitsUnit}` }))} />
          </Opt>
        )}
        <div className="flex min-w-0 flex-1 basis-72 items-center gap-2">
          <label htmlFor={`${id}-exp`} className="shrink-0">
            {t.expected}
          </label>
          <Input id={`${id}-exp`} size="sm" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder={t.expectedPh} className="min-w-0 flex-1 font-mono" spellCheck={false} autoComplete="off" />
        </div>
      </OptionsRow>
    </Panel>
  );
}

interface Row {
  file: File;
  digest?: string;
  state: "wait" | "run" | "done" | "cancel" | "error";
  done: number;
  error?: string;
}

function FileHasher({ locale, algo, bits, hmacKey, fmt, expected }: { locale: Locale; algo: AlgoId; bits?: number; hmacKey?: Uint8Array; fmt: OutFormat; expected: string }) {
  const t = T[locale];
  const client = useWorkerClient(newWorker);
  const [rows, setRows] = useState<Row[]>([]);
  const busy = rows.some((r) => r.state === "run" || r.state === "wait");

  async function start(files: File[]) {
    setRows(files.map((file) => ({ file, state: "wait", done: 0 })));
    try {
      const out = await client.run<(string | null)[]>(
        "files",
        { algo, bits, key: hmacKey, files },
        {
          onProgress: (_v, info) => {
            const inf = info as { index: number; done: number; digest?: string };
            setRows((prev) => prev.map((r, i) => (i !== inf.index ? r : { ...r, state: inf.digest ? "done" : "run", done: inf.done, digest: inf.digest ?? r.digest })));
          },
        },
      );
      setRows((prev) => prev.map((r, i) => ({ ...r, state: "done", digest: out[i] ?? undefined, done: r.file.size })));
    } catch (e) {
      const cancelled = isCancelled(e);
      setRows((prev) => prev.map((r) => (r.state === "done" ? r : { ...r, state: cancelled ? "cancel" : "error", error: cancelled ? undefined : e instanceof Error ? e.message : String(e) })));
    }
  }

  const list = rows
    .filter((r) => r.digest)
    .map((r) => `${formatDigest(r.digest!, fmt)}  ${r.file.name}`)
    .join("\n");

  return (
    <div className="flex flex-col gap-3">
      <Dropzone multiple onFiles={start} title={t.drop} hint={t.dropHint} locale={locale} compact={rows.length > 0} />
      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-col gap-1.5" aria-live="polite">
            {rows.map((r, i) => {
              const ok = expected.trim() && r.digest ? digestMatches(r.digest, expected) : null;
              const pct = r.file.size ? Math.round((r.done / r.file.size) * 100) : 100;
              return (
                <li key={i} className="flex flex-col gap-1 rounded-[1rem] bg-surface-2 px-4 py-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-fg-2">{r.file.name}</span>
                    <span className="shrink-0 text-[0.8125rem] text-fg-3">{formatBytes(locale, r.file.size)}</span>
                  </div>
                  {r.state === "done" && r.digest ? (
                    <code className={`flex items-center gap-1.5 font-mono text-[0.9375rem] font-semibold break-all ${ok === null ? "text-fg" : ok ? "text-ok" : "text-err"}`}>
                      {ok !== null && (ok ? <CircleCheck className="size-4 shrink-0" aria-label={t.match} /> : <CircleX className="size-4 shrink-0" aria-label={t.mismatch} />)}
                      {formatDigest(r.digest, fmt)}
                    </code>
                  ) : r.state === "run" ? (
                    <progress className="h-1.5 w-full overflow-hidden rounded-full accent-[var(--accent)]" max={100} value={pct} aria-label={r.file.name} />
                  ) : (
                    <span className={`text-[0.8125rem] ${r.state === "error" ? "text-err" : "text-fg-3"}`}>{r.state === "wait" ? t.waiting : r.state === "cancel" ? t.cancelled : r.error}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end gap-2">
            {busy ? (
              <Button size="sm" variant="outlined" onClick={() => client.cancel()}>
                <X aria-hidden />
                {t.cancel}
              </Button>
            ) : (
              <CopyButton value={list} label={t.copyAll} copiedLabel={t.copied} variant="secondary" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
