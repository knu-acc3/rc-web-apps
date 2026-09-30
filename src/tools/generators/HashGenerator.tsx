"use client";

import { useRef, useState } from "react";
import { Fingerprint, UploadSimple, X } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";

type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512" | "CRC32";
type OutputEncoding = "hex" | "base64";

type HashResult = {
  algorithm: HashAlgorithm;
  encoding: OutputEncoding;
  value: string;
  sourceLabel: string;
  byteLength: number;
  throughputMBs?: number;
};

const MAX_FILE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB streaming

const HASH_ALGORITHMS: Array<{
  value: HashAlgorithm;
  label: string;
  legacy: boolean;
}> = [
  { value: "SHA-256", label: "SHA-256", legacy: false },
  { value: "SHA-384", label: "SHA-384", legacy: false },
  { value: "SHA-512", label: "SHA-512", legacy: false },
  {
    value: "SHA-1",
    label: "SHA-1 · legacy integrity only",
    legacy: true,
  },
  {
    value: "MD5",
    label: "MD5 · legacy integrity only",
    legacy: true,
  },
  {
    value: "CRC32",
    label: "CRC32 · legacy checksum",
    legacy: true,
  },
];

const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
  9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
  16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];

const MD5_CONSTANTS = Array.from({ length: 64 }, (_, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000),
);

function rotateLeft(value: number, shift: number): number {
  return (value << shift) | (value >>> (32 - shift));
}

function md5Digest(input: Uint8Array): Uint8Array {
  const paddingLength = (56 - ((input.length + 1) % 64) + 64) % 64;
  const totalLength = input.length + 1 + paddingLength + 8;
  const message = new Uint8Array(totalLength);
  message.set(input);
  message[input.length] = 0x80;

  let bitLength = BigInt(input.length) * 8n;
  for (let index = 0; index < 8; index += 1) {
    message[totalLength - 8 + index] = Number(bitLength & 0xffn);
    bitLength >>= 8n;
  }

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < totalLength; offset += 64) {
    const view = new DataView(message.buffer, message.byteOffset + offset, 64);
    const words = Array.from({ length: 16 }, (_, index) =>
      view.getUint32(index * 4, true),
    );
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let index = 0; index < 64; index += 1) {
      let mixed: number;
      let wordIndex: number;

      if (index < 16) {
        mixed = (b & c) | (~b & d);
        wordIndex = index;
      } else if (index < 32) {
        mixed = (d & b) | (~d & c);
        wordIndex = (5 * index + 1) % 16;
      } else if (index < 48) {
        mixed = b ^ c ^ d;
        wordIndex = (3 * index + 5) % 16;
      } else {
        mixed = c ^ (b | ~d);
        wordIndex = (7 * index) % 16;
      }

      const previousD = d;
      d = c;
      c = b;
      const sum = (a + mixed + MD5_CONSTANTS[index] + words[wordIndex]) >>> 0;
      b = (b + rotateLeft(sum, MD5_SHIFTS[index])) >>> 0;
      a = previousD;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const digest = new Uint8Array(16);
  const digestView = new DataView(digest.buffer);
  digestView.setUint32(0, a0, true);
  digestView.setUint32(4, b0, true);
  digestView.setUint32(8, c0, true);
  digestView.setUint32(12, d0, true);
  return digest;
}

const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC32_TABLE[i] = c;
}

function crc32Digest(input: Uint8Array): Uint8Array {
  let crc = 0xffffffff;
  for (let i = 0; i < input.length; i++) {
    crc = CRC32_TABLE[(crc ^ input[i]) & 0xff] ^ (crc >>> 8);
  }
  const val = (crc ^ 0xffffffff) >>> 0;
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, val, false);
  return out;
}

async function digestBytes(
  algorithm: HashAlgorithm,
  input: Uint8Array,
): Promise<Uint8Array> {
  if (algorithm === "MD5") return md5Digest(input);
  if (algorithm === "CRC32") return crc32Digest(input);

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto unavailable");
  const stableBuffer = Uint8Array.from(input).buffer;
  const digest = await subtle.digest(algorithm, stableBuffer);
  return new Uint8Array(digest);
}

function encodeDigest(digest: Uint8Array, encoding: OutputEncoding): string {
  if (encoding === "hex") {
    return Array.from(digest, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  const binary = Array.from(digest, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  return btoa(binary);
}

function formatBytes(value: number): string {
  if (value < 1024) return value + " B";
  if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " KB";
  return (value / (1024 * 1024)).toFixed(1) + " MB";
}

function hashSignature(
  text: string,
  file: File | null,
  fileVersion: number,
  algorithm: HashAlgorithm,
  encoding: OutputEncoding,
): string {
  return JSON.stringify([
    file
      ? ["file", file.name, file.size, file.lastModified, fileVersion]
      : ["text", text],
    algorithm,
    encoding,
  ]);
}

export default function HashGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileVersion, setFileVersion] = useState(0);
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [encoding, setEncoding] = useState<OutputEncoding>("hex");
  const [result, setResult] = useState<HashResult | null>(null);
  const [resultSignature, setResultSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileProgress, setFileProgress] = useState(0);
  const [fileThroughput, setFileThroughput] = useState<number | null>(null);

  // Batch states
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchCalculating, setBatchCalculating] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchResults, setBatchResults] = useState<Array<{ name: string; hash: string }>>([]);

  const currentSignature = hashSignature(
    text,
    file,
    fileVersion,
    algorithm,
    encoding,
  );
  const visibleResult = resultSignature === currentSignature ? result : null;
  const algorithmMeta =
    HASH_ALGORITHMS.find((item) => item.value === algorithm) ??
    HASH_ALGORITHMS[0];

  const generateHash = async () => {
    const requestedSignature = currentSignature;
    setLoading(true);
    setError("");
    setFileProgress(0);
    setFileThroughput(null);

    try {
      if (
        file &&
        (algorithm === "MD5" || algorithm === "SHA-256" || algorithm === "CRC32") &&
        typeof window !== "undefined" &&
        typeof Worker !== "undefined"
      ) {
        const worker = new Worker(new URL("../../workers/hash.worker.ts", import.meta.url), { type: "module" });
        const taskId = `hash_${Date.now()}`;
        const hexHash = await new Promise<string>((resolve, reject) => {
          worker.onmessage = (e) => {
            if (e.data.type === "HASH_PROGRESS") {
              setFileProgress(e.data.progress);
              setFileThroughput(e.data.throughputMBs);
            } else if (e.data.taskId === taskId) {
              if (e.data.success && e.data.result) {
                setFileThroughput(e.data.result.throughputMBs);
                resolve(e.data.result.hash);
              } else {
                reject(new Error(e.data.error || "Hash failed"));
              }
              worker.terminate();
            }
          };
          worker.onerror = (err) => {
            worker.terminate();
            reject(err);
          };
          worker.postMessage({
            taskId,
            algorithm,
            streamOrBlob: file,
            chunkSize: 2 * 1024 * 1024,
          });
        });

        const digestBytesArray = new Uint8Array(
          (hexHash.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)),
        );
        const value = encodeDigest(digestBytesArray, encoding);
        setResult({
          algorithm,
          encoding,
          value,
          sourceLabel: file.name,
          byteLength: file.size,
          throughputMBs: fileThroughput ?? undefined,
        });
        setResultSignature(requestedSignature);
      } else {
        const bytes = file
          ? new Uint8Array(await file.arrayBuffer())
          : new TextEncoder().encode(text);
        const digest = await digestBytes(algorithm, bytes);
        const value = encodeDigest(digest, encoding);

        setResult({
          algorithm,
          encoding,
          value,
          sourceLabel: file ? file.name : isEn ? "Text input" : "Введённый текст",
          byteLength: bytes.byteLength,
        });
        setResultSignature(requestedSignature);
      }
    } catch {
      setResult(null);
      setResultSignature(null);
      setError(
        isEn
          ? "The hash could not be calculated in this browser."
          : "Не удалось вычислить хеш в этом браузере.",
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateBatchHashes = async () => {
    if (batchFiles.length === 0) return;
    setBatchCalculating(true);
    setBatchProgress(0);
    const results: Array<{ name: string; hash: string }> = [];

    try {
      for (let i = 0; i < batchFiles.length; i++) {
        const f = batchFiles[i];
        let hash = "";

        if (
          (algorithm === "MD5" || algorithm === "SHA-256" || algorithm === "CRC32") &&
          typeof window !== "undefined" &&
          typeof Worker !== "undefined"
        ) {
          const worker = new Worker(new URL("../../workers/hash.worker.ts", import.meta.url), { type: "module" });
          const taskId = `batch_${i}_${Date.now()}`;
          hash = await new Promise<string>((resolve, reject) => {
            worker.onmessage = (e) => {
              if (e.data.taskId === taskId) {
                if (e.data.success && e.data.result) resolve(e.data.result.hash);
                else reject(new Error(e.data.error));
                worker.terminate();
              }
            };
            worker.onerror = (err) => {
              worker.terminate();
              reject(err);
            };
            worker.postMessage({ taskId, algorithm, streamOrBlob: f, chunkSize: 2 * 1024 * 1024 });
          });
        } else {
          const bytes = new Uint8Array(await f.arrayBuffer());
          const digest = await digestBytes(algorithm, bytes);
          hash = encodeDigest(digest, "hex");
        }

        results.push({ name: f.name, hash });
        setBatchProgress(Math.round(((i + 1) / batchFiles.length) * 100));
      }
      setBatchResults(results);
    } catch {
      // ignore
    } finally {
      setBatchCalculating(false);
    }
  };

  const exportBatchChecksums = () => {
    if (batchResults.length === 0) return;
    const content = batchResults.map((r) => `${r.hash}  ${r.name}`).join("\n") + "\n";
    const filename =
      algorithm === "SHA-256"
        ? "checksums.sha256"
        : algorithm === "MD5"
          ? "MD5SUMS"
          : `checksums.${algorithm.toLowerCase()}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const selectFile = (selected: File | null) => {
    if (!selected) return;

    if (selected.size > MAX_FILE_BYTES) {
      setError(
        isEn
          ? "Choose a file no larger than 4 GB."
          : "Выберите файл размером не более 4 ГБ.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selected);
    setFileVersion((current) => current + 1);
    setError("");
  };

  const removeFile = () => {
    setFile(null);
    setFileVersion((current) => current + 1);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div data-generator-tool="hash" className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {isEn
              ? "Generate " + algorithm + " hash"
              : "Создайте хеш " + algorithm}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Enter text and calculate one deterministic message digest."
              : "Введите текст и вычислите один детерминированный дайджест сообщения."}
          </p>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void generateHash();
          }}
        >
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Label htmlFor="hash-text" className="text-sm font-semibold">
              {file
                ? isEn
                  ? "File selected"
                  : "Выбран файл"
                : isEn
                  ? "Text"
                  : "Текст"}
            </Label>
            <span className="shrink-0 text-xs font-semibold text-[var(--color-text-muted)]">
              {algorithm} · {encoding.toUpperCase()}
            </span>
          </div>
          <Textarea
            id="hash-text"
            value={file ? "" : text}
            onChange={(event) => {
              setText(event.target.value);
              setError("");
            }}
            disabled={Boolean(file)}
            placeholder={
              file ? file.name : isEn ? "Enter text" : "Введите текст"
            }
            className="mt-2 min-h-36"
          />
          <p className="mt-2 break-all text-sm text-[var(--color-text-muted)]">
            {file
              ? file.name + " · " + formatBytes(file.size)
              : isEn
                ? "Text is encoded as UTF-8. An empty value has a valid hash."
                : "Текст кодируется в UTF-8. Пустое значение тоже имеет корректный хеш."}
          </p>

          {loading && file && fileProgress > 0 ? (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                <span>{isEn ? "Streaming chunk hash…" : "Потоковое вычисление хеша…"}</span>
                <span>{fileProgress}% {fileThroughput ? `(${fileThroughput} MB/s)` : ""}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                <div className="h-full bg-[var(--color-primary)] transition-all duration-150" style={{ width: `${fileProgress}%` }} />
              </div>
            </div>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mt-4 text-sm font-medium text-[var(--color-danger)]"
            >
              {error}
            </p>
          ) : null}

          <ToolPrimaryAction
            type="submit"
            loading={loading}
            loadingLabel={isEn ? "Calculating…" : "Вычисление…"}
            className="mt-4"
            leadingIcon={<Fingerprint size={20} weight="bold" />}
          >
            {isEn ? "Generate hash" : "Создать хеш"}
          </ToolPrimaryAction>
        </form>
      </section>

      {visibleResult ? (
        <section
          aria-live="polite"
          data-hash-result=""
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                {visibleResult.algorithm}{" "}
                {visibleResult.encoding === "hex" ? "HEX" : "Base64"}
              </h2>
              <p className="mt-1 break-all text-sm text-[var(--color-text-muted)]">
                {visibleResult.sourceLabel} ·{" "}
                {formatBytes(visibleResult.byteLength)}
                {visibleResult.throughputMBs ? ` · ${visibleResult.throughputMBs} MB/s` : ""}
              </p>
            </div>
            <CopyButton
              text={visibleResult.value}
              size="medium"
              tooltip={isEn ? "Copy hash" : "Скопировать хеш"}
              className="shrink-0"
            />
          </div>

          <code className="mt-4 block break-all rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-lg font-bold leading-relaxed text-[var(--color-text)] sm:text-xl">
            {visibleResult.value}
          </code>

          {algorithmMeta.legacy ? (
            <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm leading-relaxed text-[var(--color-danger)]">
              {isEn
                ? "Legacy integrity only. Known collision attacks make this algorithm unsuitable for security decisions."
                : "Только для совместимости и проверки целостности. Известные атаки на коллизии делают этот алгоритм непригодным для решений по безопасности."}
            </p>
          ) : null}

          <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "A hash is not encryption. Fast general-purpose hashes are not suitable for storing passwords."
              : "Хеш не является шифрованием. Быстрые хеш-функции общего назначения не подходят для хранения паролей."}
          </p>
        </section>
      ) : null}

      <AdvancedSettings
        title={isEn ? "Hash options" : "Параметры хеша"}
        description={
          isEn
            ? "Algorithm, output encoding and local file input"
            : "Алгоритм, кодировка результата и локальный файл"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="hash-algorithm" className="text-sm font-semibold">
              {isEn ? "Algorithm" : "Алгоритм"}
            </Label>
            <select
              id="hash-algorithm"
              value={algorithm}
              onChange={(event) => {
                setAlgorithm(event.target.value as HashAlgorithm);
                setError("");
              }}
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] sm:text-sm"
            >
              {HASH_ALGORITHMS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="hash-encoding" className="text-sm font-semibold">
              {isEn ? "Output encoding" : "Кодировка результата"}
            </Label>
            <select
              id="hash-encoding"
              value={encoding}
              onChange={(event) => {
                setEncoding(event.target.value as OutputEncoding);
                setError("");
              }}
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] sm:text-sm"
            >
              <option value="hex">HEX</option>
              <option value="base64">Base64</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="hash-file" className="text-sm font-semibold">
            {isEn ? "Hash a local file" : "Хешировать локальный файл"}
          </Label>
          <Input
            ref={fileInputRef}
            id="hash-file"
            type="file"
            data-file-paste-target="true"
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            className="mt-2 h-12 cursor-pointer file:mr-3"
          />
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Up to 4 GB. The file stays in this browser and streams in 2–4 MB chunks without locking the UI."
              : "До 4 ГБ. Файл остаётся в браузере и считывается потоковыми чанками по 2–4 МБ без зависания интерфейса."}
          </p>

          {file ? (
            <div className="mt-3 flex min-w-0 flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="break-all text-sm font-semibold text-[var(--color-text)]">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {formatBytes(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={removeFile}
                className="min-h-11 shrink-0"
              >
                <X size={18} aria-hidden="true" />
                {isEn ? "Remove file" : "Убрать файл"}
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <UploadSimple size={18} aria-hidden="true" />
              {isEn
                ? "Selecting a file temporarily replaces the text source."
                : "Выбранный файл временно заменяет текстовый источник."}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-[var(--color-border)] pt-4">
          <Label className="text-sm font-semibold">
            {isEn ? "Batch Checksum Export" : "Пакетный расчёт контрольных сумм"}
          </Label>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {isEn
              ? "Select multiple files to compute checksums in parallel and export checksums.sha256 or MD5SUMS."
              : "Выберите несколько файлов для пакетного расчёта и экспорта в checksums.sha256 или MD5SUMS."}
          </p>
          <Input
            type="file"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setBatchFiles(files);
              setBatchResults([]);
            }}
            className="mt-2 h-11 cursor-pointer"
          />
          {batchFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>{isEn ? `${batchFiles.length} files selected` : `Выбрано файлов: ${batchFiles.length}`}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={calculateBatchHashes}
                  disabled={batchCalculating}
                >
                  {batchCalculating
                    ? (isEn ? `Calculating… ${batchProgress}%` : `Вычисление… ${batchProgress}%`)
                    : (isEn ? "Calculate all" : "Вычислить все")}
                </Button>
              </div>
              {batchResults.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="max-h-32 overflow-y-auto rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-2 font-mono text-[11px]">
                    {batchResults.map((r) => (
                      <div key={r.name} className="truncate">
                        <span className="text-[var(--color-primary)]">{r.hash.slice(0, 16)}…</span> {r.name}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={exportBatchChecksums}
                    className="w-full"
                  >
                    {isEn
                      ? `Export ${algorithm === "MD5" ? "MD5SUMS" : "checksums." + algorithm.toLowerCase()}`
                      : `Экспорт в ${algorithm === "MD5" ? "MD5SUMS" : "checksums." + algorithm.toLowerCase()}`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </AdvancedSettings>
    </div>
  );
}
