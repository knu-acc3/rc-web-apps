"use client";

import { CircleCheck, CircleX, Loader2, X } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { useWorkerClient } from "@/tools/dev/shared/hooks";
import { cryptoRng } from "@/tools/dev/shared/random";
import { isCancelled } from "@/tools/dev/shared/worker-client";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select, Textarea } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import type { KdfId } from "./lib/algorithms";
import type { PbkdfHash } from "./lib/kdf";

const T = {
  ru: {
    modes: { hash: "Создать хэш", verify: "Проверить пароль" },
    mode: "Режим",
    password: "Пароль",
    hash: "Хэш для проверки",
    run: "Создать хэш",
    check: "Проверить",
    working: "Вычисляется…",
    cancel: "Отменить",
    result: "Хэш",
    ok: "Пароль подходит",
    bad: "Пароль не подходит",
    cost: "Cost",
    memory: "Память, МиБ",
    iterations: "Итерации",
    parallelism: "Потоки",
    ln: "N = 2^",
    r: "r",
    p: "p",
    hashFn: "Хэш",
    time: (ms: string) => `за ${ms} мс`,
    note: "Пароль и хэш обрабатываются только в вашем браузере. Для рабочих систем хэш должен создаваться на сервере — здесь удобно проверить формат и параметры.",
  },
  en: {
    modes: { hash: "Create hash", verify: "Verify password" },
    mode: "Mode",
    password: "Password",
    hash: "Hash to verify",
    run: "Create hash",
    check: "Verify",
    working: "Computing…",
    cancel: "Cancel",
    result: "Hash",
    ok: "Password matches",
    bad: "Password does not match",
    cost: "Cost",
    memory: "Memory, MiB",
    iterations: "Iterations",
    parallelism: "Lanes",
    ln: "N = 2^",
    r: "r",
    p: "p",
    hashFn: "Hash",
    time: (ms: string) => `in ${ms} ms`,
    note: "The password and hash are processed only in your browser. Production hashes belong on the server — use this to check formats and parameters.",
  },
} as const;

const DEFAULT_HASH: Record<KdfId, string> = {
  bcrypt: "$2b$10$",
  argon2: "$argon2id$v=19$m=19456,t=2,p=1$",
  scrypt: "$scrypt$ln=17,r=8,p=1$",
  pbkdf2: "$pbkdf2-sha256$i=600000,l=32$",
};

export default function PasswordHash({ locale, kind }: { locale: Locale; kind: KdfId }) {
  const t = T[locale];
  const id = useId();
  const client = useWorkerClient(() => new Worker(new URL("./lib/hash.worker.ts", import.meta.url), { type: "module" }));
  const [mode, setMode] = useState<"hash" | "verify">("hash");
  const [password, setPassword] = useState("");
  const [encoded, setEncoded] = useState("");
  const [cost, setCost] = useState(10);
  const [memMiB, setMemMiB] = useState(19);
  const [iters, setIters] = useState(kind === "pbkdf2" ? 600000 : 2);
  const [lanes, setLanes] = useState(1);
  const [ln, setLn] = useState(17);
  const [r, setR] = useState(8);
  const [p, setP] = useState(1);
  const [pbHash, setPbHash] = useState<PbkdfHash>("sha256");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ hash?: string; ok?: boolean; ms: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setOut(null);
    const t0 = performance.now();
    try {
      if (mode === "hash") {
        const salt = cryptoRng(16);
        const hash = await client.run<string>("kdf", {
          kind,
          op: "hash",
          password,
          salt,
          cost,
          argon: { memory: memMiB * 1024, iterations: iters, parallelism: lanes, length: 32 },
          scrypt: { ln, r, p, length: 32 },
          pbkdf2: { hash: pbHash, iterations: iters, length: 32 },
        });
        setOut({ hash, ms: performance.now() - t0 });
      } else {
        const ok = await client.run<boolean>("kdf", { kind, op: "verify", password, encoded });
        setOut({ ok, ms: performance.now() - t0 });
      }
    } catch (e) {
      if (!isCancelled(e)) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const num = (v: string, min: number, max: number) => Math.min(max, Math.max(min, Math.floor(Number(v) || min)));
  const param = (label: string, value: number, set: (n: number) => void, min: number, max: number, w = "w-20") => (
    <label className="flex items-center gap-2">
      {label}
      <Input size="sm" inputMode="numeric" className={w} value={String(value)} onChange={(e) => set(num(e.target.value, min, max))} />
    </label>
  );

  return (
    <Panel className="p-4 sm:p-6">
      <Segmented
        label={t.mode}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setOut(null);
          setError(null);
        }}
        options={[
          { value: "hash", label: t.modes.hash },
          { value: "verify", label: t.modes.verify },
        ]}
        size="sm"
        className="mb-4"
      />
      <Field label={t.password} htmlFor={`${id}-pw`}>
        <Input id={`${id}-pw`} size="lg" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" spellCheck={false} className="font-mono" />
      </Field>
      {mode === "verify" && (
        <Field className="mt-3" label={t.hash} htmlFor={`${id}-h`}>
          <Textarea id={`${id}-h`} value={encoded} onChange={(e) => setEncoded(e.target.value)} rows={2} placeholder={DEFAULT_HASH[kind] + "…"} className="min-h-0!" />
        </Field>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={run} disabled={busy || (mode === "verify" && !encoded.trim())}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {busy ? t.working : mode === "hash" ? t.run : t.check}
        </Button>
        {busy && (
          <Button variant="ghost" onClick={() => client.cancel()}>
            <X aria-hidden />
            {t.cancel}
          </Button>
        )}
      </div>

      <div aria-live="polite">
        {out?.hash && (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-fg-2">
                {t.result} <span className="text-fg-3">· {t.time(formatNumber(locale, Math.round(out.ms)))}</span>
              </div>
              <output className="mt-1 block font-mono text-lg font-semibold break-all text-fg">{out.hash}</output>
            </div>
            <CopyButton value={out.hash} size="md" variant="outline" className="self-start sm:self-auto" />
          </div>
        )}
        {out?.ok !== undefined && (
          <p className={`mt-5 flex items-center gap-2 text-xl font-semibold ${out.ok ? "text-ok" : "text-err"}`}>
            {out.ok ? <CircleCheck className="size-6" aria-hidden /> : <CircleX className="size-6" aria-hidden />}
            {out.ok ? t.ok : t.bad}
          </p>
        )}
        {error && (
          <Notice tone="err" className="mt-4">
            {error}
          </Notice>
        )}
      </div>

      {mode === "hash" && (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-4 text-sm text-fg-2">
          {kind === "bcrypt" && param(t.cost, cost, setCost, 4, 15, "w-16")}
          {kind === "argon2" && (
            <>
              {param(t.memory, memMiB, setMemMiB, 1, 1024)}
              {param(t.iterations, iters, setIters, 1, 20, "w-16")}
              {param(t.parallelism, lanes, setLanes, 1, 8, "w-16")}
            </>
          )}
          {kind === "scrypt" && (
            <>
              {param(t.ln, ln, setLn, 1, 20, "w-16")}
              {param(t.r, r, setR, 1, 32, "w-16")}
              {param(t.p, p, setP, 1, 16, "w-16")}
            </>
          )}
          {kind === "pbkdf2" && (
            <>
              <label className="flex items-center gap-2">
                {t.hashFn}
                <Select value={pbHash} size="sm" className="w-32" onChange={(e) => setPbHash(e.target.value as PbkdfHash)}>
                  <option value="sha256">SHA-256</option>
                  <option value="sha512">SHA-512</option>
                  <option value="sha1">SHA-1</option>
                </Select>
              </label>
              {param(t.iterations, iters, setIters, 1, 10_000_000, "w-28")}
            </>
          )}
        </div>
      )}
      <p className="mt-4 text-[0.8125rem] text-fg-3">{t.note}</p>
    </Panel>
  );
}
