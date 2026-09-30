"use client";

import { CircleCheck, CircleX, X } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber } from "@/i18n/format";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { useLiveTask, useWorkerClient } from "@/sections/code/kit/hooks";
import { isCancelled } from "@/sections/code/kit/worker-client";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { Tabs } from "@/ui/tabs";
import { ALGO_BY_ID, type AlgoId } from "./algorithms";
import { digestMatches, formatDigest, type OutFormat } from "./engine";
import { decodeInput, INPUT_ENC_LABEL, type InputEncoding } from "./input";

const T = {
  ru: {
    modes: { text: "Текст", files: "Файлы" },
    mode: "Что хэшировать",
    input: "Текст для хэширования",
    placeholder: "Введите или вставьте текст",
    inputEnc: "Ввод как",
    key: "Секретный ключ HMAC",
    keyEnc: "Ключ как",
    out: "Формат",
    bits: "Длина хэша",
    bitsUnit: "бит",
    result: "Хэш",
    expected: "Сравнить с ожидаемым хэшем",
    expectedPh: "Вставьте хэш (hex или Base64)",
    match: "Совпадает",
    mismatch: "Не совпадает",
    empty: "Хэш пустой строки",
    drop: "Перетащите файлы сюда или нажмите, чтобы выбрать",
    dropHint: "Файлы читаются по частям прямо в браузере — подойдут и файлы в несколько гигабайт",
    cancel: "Отменить",
    cancelled: "Отменено",
    file: "Файл",
    size: "Размер",
    working: "Вычисляется…",
    waiting: "В очереди",
    copy: "Копировать",
    copied: "Скопировано",
    fmt: { hex: "hex", HEX: "HEX", base64: "Base64", base64url: "Base64url" },
  },
  en: {
    modes: { text: "Text", files: "Files" },
    mode: "What to hash",
    input: "Text to hash",
    placeholder: "Type or paste text",
    inputEnc: "Input as",
    key: "HMAC secret key",
    keyEnc: "Key as",
    out: "Format",
    bits: "Digest length",
    bitsUnit: "bits",
    result: "Hash",
    expected: "Compare with an expected hash",
    expectedPh: "Paste a hash (hex or Base64)",
    match: "Match",
    mismatch: "No match",
    empty: "Hash of an empty string",
    drop: "Drop files here or click to choose",
    dropHint: "Files are read in chunks right in your browser — multi-gigabyte files work too",
    cancel: "Cancel",
    cancelled: "Cancelled",
    file: "File",
    size: "Size",
    working: "Computing…",
    waiting: "Queued",
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
  const inputError = "error" in data ? data.error : keyBytes && "error" in keyBytes ? keyBytes.error : null;

  const jobKey = `${algo}|${bits}|${enc}|${hmac ? `${keyEnc}|${key}` : ""}|${text}`;
  const live = useLiveTask<string>(
    jobKey,
    inputError
      ? null
      : () =>
          client.run<string>("text", {
            algo,
            bits: def.bitsOptions ? bits : undefined,
            key: keyBytes && "bytes" in keyBytes ? keyBytes.bytes : undefined,
            data: "bytes" in data ? data.bytes : new Uint8Array(),
          }),
    120,
  );
  const hex = live.value ?? "";
  const shown = formatDigest(hex || live.stale || "", fmt);
  const verdict = expected.trim() && hex ? digestMatches(hex, expected) : null;

  const formatOptions = (Object.keys(t.fmt) as OutFormat[]).map((v) => ({ value: v, label: t.fmt[v] }));
  const encOptions = (Object.keys(INPUT_ENC_LABEL[locale]) as InputEncoding[]).map((v) => ({ value: v, label: INPUT_ENC_LABEL[locale][v] }));

  return (
    <div className="flex flex-col gap-4">
      <Tabs label={t.mode} value={mode} onChange={setMode} items={[{ value: "text", label: t.modes.text }, { value: "files", label: t.modes.files }]} />

      {hmac && (
        <Panel className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label={t.key} htmlFor={`${id}-key`} error={keyBytes && "error" in keyBytes ? keyBytes.error : undefined}>
            <Input id={`${id}-key`} value={key} onChange={(e) => setKey(e.target.value)} className="font-mono" spellCheck={false} autoComplete="off" aria-invalid={!!(keyBytes && "error" in keyBytes)} />
          </Field>
          <Segmented label={t.keyEnc} value={keyEnc} onChange={setKeyEnc} options={encOptions} size="sm" />
        </Panel>
      )}

      {mode === "text" ? (
        <>
          <CodeEditor
            id={`${id}-in`}
            locale={locale}
            label={t.input}
            value={text}
            onChange={setText}
            placeholder={t.placeholder}
            rows={6}
            wrap
            invalid={"error" in data}
            actions={<Segmented label={t.inputEnc} value={enc} onChange={setEnc} options={encOptions} size="sm" />}
          />
          {"error" in data && <Notice tone="err">{data.error}</Notice>}
        </>
      ) : (
        <FileHasher locale={locale} algo={algo} bits={def.bitsOptions ? bits : undefined} hmacKey={keyBytes && "bytes" in keyBytes ? keyBytes.bytes : undefined} fmt={fmt} expected={expected} />
      )}

      <Panel className="p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-2" id={`${id}-fmt`}>
              {t.out}
            </span>
            <Segmented label={t.out} value={fmt} onChange={setFmt} options={formatOptions} size="sm" />
          </div>
          {def.bitsOptions && (
            <Field label={t.bits} htmlFor={`${id}-bits`}>
              <Select id={`${id}-bits`} value={String(bits)} onChange={(e) => setBits(Number(e.target.value))} size="sm">
                {def.bitsOptions.map((b) => (
                  <option key={b} value={b}>
                    {b} {t.bitsUnit}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        {mode === "text" && (
          <div className="mt-4 flex flex-col gap-3 rounded-[10px] bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-fg-2">
                {hmac ? `HMAC-${def.name}` : def.name}
                {text === "" && !inputError ? ` · ${t.empty}` : ""}
              </div>
              <output className={`block min-h-7 font-mono text-[15px] font-semibold break-all sm:text-base ${live.pending ? "text-fg-3" : "text-fg"}`} aria-live="polite">
                {inputError ? "—" : shown}
              </output>
            </div>
            <CopyButton value={inputError ? "" : formatDigest(hex, fmt)} label={t.copy} copiedLabel={t.copied} className="shrink-0" />
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label={t.expected} htmlFor={`${id}-exp`}>
            <Input id={`${id}-exp`} value={expected} onChange={(e) => setExpected(e.target.value)} placeholder={t.expectedPh} className="font-mono" spellCheck={false} autoComplete="off" />
          </Field>
          {mode === "text" && verdict !== null && (
            <p className={`flex h-10 items-center gap-1.5 font-semibold ${verdict ? "text-ok" : "text-err"}`} aria-live="polite">
              {verdict ? <CircleCheck className="size-5" aria-hidden /> : <CircleX className="size-5" aria-hidden />}
              {verdict ? t.match : t.mismatch}
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}

interface Row {
  file: File;
  digest?: string;
  state: "wait" | "run" | "done" | "cancel" | "error";
  done: number;
  error?: string;
}

export function FileHasher({ locale, algo, bits, hmacKey, fmt, expected }: { locale: Locale; algo: AlgoId; bits?: number; hmacKey?: Uint8Array; fmt: OutFormat; expected: string }) {
  const t = T[locale];
  const client = useWorkerClient(newWorker);
  const [rows, setRows] = useState<Row[]>([]);
  const busy = rows.some((r) => r.state === "run" || r.state === "wait");

  async function start(files: File[]) {
    const list: Row[] = files.map((file) => ({ file, state: "wait", done: 0 }));
    setRows(list);
    try {
      const out = await client.run<(string | null)[]>(
        "files",
        { algo, bits, key: hmacKey, files },
        {
          onProgress: (_v, info) => {
            const inf = info as { index: number; done: number; digest?: string };
            setRows((prev) => prev.map((r, i) => (i < inf.index ? r : i === inf.index ? { ...r, state: inf.digest ? "done" : "run", done: inf.done, digest: inf.digest ?? r.digest } : r)));
          },
        },
      );
      setRows((prev) => prev.map((r, i) => ({ ...r, state: "done", digest: out[i] ?? undefined, done: r.file.size })));
    } catch (e) {
      if (isCancelled(e)) setRows((prev) => prev.map((r) => (r.state === "done" ? r : { ...r, state: "cancel" })));
      else setRows((prev) => prev.map((r) => (r.state === "done" ? r : { ...r, state: "error", error: e instanceof Error ? e.message : String(e) })));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Dropzone multiple onFiles={start} title={t.drop} hint={t.dropHint} compact={rows.length > 0} />
      {rows.length > 0 && (
        <Panel>
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <span className="text-sm font-semibold text-fg">
              {t.file}: {formatNumber(locale, rows.length)}
            </span>
            {busy && (
              <Button size="sm" variant="ghost" onClick={() => client.cancel()}>
                <X aria-hidden />
                {t.cancel}
              </Button>
            )}
          </div>
          <ul className="divide-y divide-line">
            {rows.map((r, i) => {
              const d = r.digest ? formatDigest(r.digest, fmt) : "";
              const ok = expected.trim() && r.digest ? digestMatches(r.digest, expected) : null;
              const pct = r.file.size ? Math.round((r.done / r.file.size) * 100) : 100;
              return (
                <li key={i} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium text-fg">{r.file.name}</span>
                    <span className="shrink-0 text-fg-3">{formatBytes(locale, r.file.size)}</span>
                  </div>
                  {r.state === "done" && d ? (
                    <div className="flex items-center justify-between gap-2">
                      <code className={`min-w-0 font-mono text-[13px] break-all ${ok === null ? "text-fg" : ok ? "text-ok" : "text-err"}`}>{d}</code>
                      <CopyButton value={d} label={t.copy} copiedLabel={t.copied} size="icon-sm" variant="ghost" />
                    </div>
                  ) : r.state === "run" ? (
                    <div className="flex items-center gap-2">
                      <progress className="h-1.5 w-full accent-[var(--accent)]" max={100} value={pct} aria-label={r.file.name} />
                      <span className="tabular w-10 text-right text-[13px] text-fg-3">{pct}%</span>
                    </div>
                  ) : (
                    <span className={`text-[13px] ${r.state === "error" ? "text-err" : "text-fg-3"}`}>{r.state === "wait" ? t.waiting : r.state === "cancel" ? t.cancelled : r.error}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
