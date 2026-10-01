"use client";

import { CircleCheck, CircleX, X } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { useWorkerClient } from "@/tools/dev/shared/hooks";
import { Opt, OptionsRow, Pane } from "@/tools/dev/shared/Pane";
import { cryptoRng } from "@/tools/dev/shared/random";
import { isCancelled } from "@/tools/dev/shared/worker-client";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Textarea } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
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

  const param = (key: string, label: string, value: number, set: (n: number) => void, min: number, max: number, step = 1, w = "w-36") => (
    <Opt label={label} htmlFor={`${id}-${key}`}>
      <NumberInput id={`${id}-${key}`} size="sm" locale={locale} value={value} onChange={(v) => v !== null && set(v)} min={min} max={max} step={step} className={w} />
    </Opt>
  );

  return (
    <Panel className="flex flex-col gap-4 p-4 sm:p-6">
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
        className="self-start"
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Field label={t.password} htmlFor={`${id}-pw`}>
            <Input id={`${id}-pw`} size="lg" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" spellCheck={false} className="font-mono" />
          </Field>
          {mode === "verify" && (
            <Field label={t.hash} htmlFor={`${id}-h`}>
              <Textarea id={`${id}-h`} value={encoded} onChange={(e) => setEncoded(e.target.value)} rows={2} placeholder={DEFAULT_HASH[kind] + "…"} className="min-h-0!" />
            </Field>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="filled" size="lg" onClick={run} loading={busy} disabled={mode === "verify" && !encoded.trim()}>
              {busy ? t.working : mode === "hash" ? t.run : t.check}
            </Button>
            {busy && (
              <Button variant="outlined" size="lg" onClick={() => client.cancel()}>
                <X aria-hidden />
                {t.cancel}
              </Button>
            )}
          </div>
          {mode === "hash" && (
            <OptionsRow>
              {kind === "bcrypt" && param("cost", t.cost, cost, setCost, 4, 15)}
              {kind === "argon2" && (
                <>
                  {param("mem", t.memory, memMiB, setMemMiB, 1, 1024, 1, "w-40")}
                  {param("it", t.iterations, iters, setIters, 1, 20)}
                  {param("lanes", t.parallelism, lanes, setLanes, 1, 8)}
                </>
              )}
              {kind === "scrypt" && (
                <>
                  {param("ln", t.ln, ln, setLn, 1, 20)}
                  {param("r", t.r, r, setR, 1, 32)}
                  {param("p", t.p, p, setP, 1, 16)}
                </>
              )}
              {kind === "pbkdf2" && (
                <>
                  <Opt label={t.hashFn} group>
                    <Segmented
                      size="sm"
                      label={t.hashFn}
                      value={pbHash}
                      onChange={setPbHash}
                      options={[
                        { value: "sha256", label: "SHA-256" },
                        { value: "sha512", label: "SHA-512" },
                        { value: "sha1", label: "SHA-1" },
                      ]}
                    />
                  </Opt>
                  {param("it", t.iterations, iters, setIters, 1, 10_000_000, 100_000, "w-48")}
                </>
              )}
            </OptionsRow>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3" aria-live="polite">
          {out?.hash && (
            <Pane
              className="motion-safe:animate-[menu-in_0.2s_ease-out]"
              title={
                <>
                  {t.result} <span className="font-normal text-fg-3">· {t.time(formatNumber(locale, Math.round(out.ms)))}</span>
                </>
              }
              actions={<CopyButton value={out.hash} variant="secondary" compact />}
            >
              <output className="block px-4 py-4 font-mono text-lg font-semibold break-all text-fg sm:text-xl">{out.hash}</output>
            </Pane>
          )}
          {out?.ok !== undefined && (
            <p className={cn("flex items-center gap-2.5 rounded-[1.25rem] px-5 py-5 text-2xl font-bold motion-safe:animate-[menu-in_0.2s_ease-out]", out.ok ? "bg-ok-soft text-ok" : "bg-err-soft text-err")}>
              {out.ok ? <CircleCheck className="size-8 shrink-0" aria-hidden /> : <CircleX className="size-8 shrink-0" aria-hidden />}
              {out.ok ? t.ok : t.bad}
            </p>
          )}
          {error && <Notice tone="err">{error}</Notice>}
        </div>
      </div>
      <p className="text-[0.8125rem] text-fg-3">{t.note}</p>
    </Panel>
  );
}
