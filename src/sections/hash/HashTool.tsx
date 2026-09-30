"use client";

import { CircleCheck, CircleX, X } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { useLiveTask, useWorkerClient } from "@/sections/code/kit/hooks";
import { isCancelled } from "@/sections/code/kit/worker-client";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { ALGO_BY_ID, type AlgoId } from "./algorithms";
import { digestMatches, formatDigest, type OutFormat } from "./engine";
import { decodeInput, INPUT_ENC_LABEL, type InputEncoding } from "./input";

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

const newWorker = () => new Worker(new URL("./hash.worker.ts", import.meta.url), { type: "module" });

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

  const encOptions = (Object.keys(INPUT_ENC_LABEL[locale]) as InputEncoding[]).map((v) => (
    <option key={v} value={v}>
      {INPUT_ENC_LABEL[locale][v]}
    </option>
  ));

  return (
    <Panel className="p-4 sm:p-6">
      <Segmented label={t.mode} value={mode} onChange={setMode} options={[{ value: "text", label: t.modes.text }, { value: "files", label: t.modes.files }]} size="sm" className="mb-4" />

      {hmac && (
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_9rem] sm:items-end">
          <Field label={t.key} htmlFor={`${id}-key`} error={keyError ?? undefined}>
            <Input id={`${id}-key`} value={key} onChange={(e) => setKey(e.target.value)} className="font-mono" spellCheck={false} autoComplete="off" aria-invalid={!!keyError} />
          </Field>
          <Select aria-label={t.keyEnc} value={keyEnc} onChange={(e) => setKeyEnc(e.target.value as InputEncoding)}>
            {encOptions}
          </Select>
        </div>
      )}

      {mode === "text" ? (
        <>
          <CodeEditor id={`${id}-in`} locale={locale} label={t.input} value={text} onChange={setText} placeholder={t.placeholder} rows={5} wrap invalid={"error" in data} />
          {"error" in data && (
            <Notice tone="err" className="mt-2">
              {data.error}
            </Notice>
          )}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-fg-2">
                {title}
                {text === "" && !inputError ? <span className="text-fg-3"> · {t.empty}</span> : null}
              </div>
              <output className={`mt-1 block min-h-8 font-mono text-lg font-semibold break-all sm:text-xl ${live.pending ? "text-fg-3" : "text-fg"}`} aria-live="polite">
                {inputError ? "—" : shown}
              </output>
            </div>
            <CopyButton value={inputError ? "" : formatDigest(hex, fmt)} label={t.copy} copiedLabel={t.copied} size="md" variant="outline" className="self-start sm:self-auto" />
          </div>
        </>
      ) : (
        <FileHasher locale={locale} algo={algo} bits={bitsOpt} hmacKey={keyArg} fmt={fmt} expected={expected} />
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-4 text-sm text-fg-2">
        {mode === "text" && (
          <label className="flex items-center gap-2">
            {t.inputEnc}
            <Select value={enc} size="sm" className="w-36" onChange={(e) => setEnc(e.target.value as InputEncoding)}>
              {encOptions}
            </Select>
          </label>
        )}
        <label className="flex items-center gap-2">
          {t.out}
          <Select value={fmt} size="sm" className="w-32" onChange={(e) => setFmt(e.target.value as OutFormat)}>
            {(Object.keys(t.fmt) as OutFormat[]).map((v) => (
              <option key={v} value={v}>
                {t.fmt[v]}
              </option>
            ))}
          </Select>
        </label>
        {def.bitsOptions && (
          <label className="flex items-center gap-2">
            {t.bits}
            <Select value={String(bits)} size="sm" className="w-28" onChange={(e) => setBits(Number(e.target.value))}>
              {def.bitsOptions.map((b) => (
                <option key={b} value={b}>
                  {b} {t.bitsUnit}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label className="flex min-w-0 flex-1 items-center gap-2" htmlFor={`${id}-exp`}>
          <span className="shrink-0">{t.expected}</span>
          <Input id={`${id}-exp`} size="sm" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder={t.expectedPh} className="min-w-40 font-mono" spellCheck={false} autoComplete="off" />
        </label>
        {verdict !== null && (
          <span className={`flex items-center gap-1 font-semibold ${verdict ? "text-ok" : "text-err"}`} aria-live="polite">
            {verdict ? <CircleCheck className="size-4" aria-hidden /> : <CircleX className="size-4" aria-hidden />}
            {verdict ? t.match : t.mismatch}
          </span>
        )}
      </div>
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
      <Dropzone multiple onFiles={start} title={t.drop} hint={t.dropHint} compact={rows.length > 0} />
      {rows.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border border-line">
          <ul className="divide-y divide-line" aria-live="polite">
            {rows.map((r, i) => {
              const ok = expected.trim() && r.digest ? digestMatches(r.digest, expected) : null;
              const pct = r.file.size ? Math.round((r.done / r.file.size) * 100) : 100;
              return (
                <li key={i} className="flex flex-col gap-1 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-fg-2">{r.file.name}</span>
                    <span className="shrink-0 text-[13px] text-fg-3">{formatBytes(locale, r.file.size)}</span>
                  </div>
                  {r.state === "done" && r.digest ? (
                    <code className={`flex items-center gap-1.5 font-mono text-[15px] font-semibold break-all ${ok === null ? "text-fg" : ok ? "text-ok" : "text-err"}`}>
                      {ok !== null && (ok ? <CircleCheck className="size-4 shrink-0" aria-label={t.match} /> : <CircleX className="size-4 shrink-0" aria-label={t.mismatch} />)}
                      {formatDigest(r.digest, fmt)}
                    </code>
                  ) : r.state === "run" ? (
                    <progress className="h-1.5 w-full accent-[var(--accent)]" max={100} value={pct} aria-label={r.file.name} />
                  ) : (
                    <span className={`text-[13px] ${r.state === "error" ? "text-err" : "text-fg-3"}`}>{r.state === "wait" ? t.waiting : r.state === "cancel" ? t.cancelled : r.error}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end gap-1 border-t border-line bg-surface-2 px-2 py-1.5">
            {busy ? (
              <Button size="sm" variant="ghost" onClick={() => client.cancel()}>
                <X aria-hidden />
                {t.cancel}
              </Button>
            ) : (
              <CopyButton value={list} label={t.copyAll} copiedLabel={t.copied} variant="ghost" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
