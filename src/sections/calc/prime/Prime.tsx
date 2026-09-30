"use client";

import { Download } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { downloadText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Field, Input } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../types";
import { factorText, fmtBig } from "../bigint/format";
import { DETERMINISTIC_LIMIT, factorize, isPrime, nextPrime, prevPrime, sieve } from "../bigint/nt";
import { CalcGrid, Explain, ResultMain, Stack, SubHeading, ToolActions } from "../kit/ui";
import { useQueryState } from "../kit/url-state";

const T = {
  ru: {
    mode: "Режим",
    check: "Проверить число",
    list: "Список простых до N",
    n: "Натуральное число",
    nHint: "До 300 цифр",
    limit: "Найти все простые числа до",
    limitHint: "Не больше 10 000 000",
    prime: "Простое число",
    composite: "Составное число",
    neither: "Ни простое, ни составное",
    onlyDiv: "делится только на 1 и на само себя",
    factors: (f: string) => `= ${f}`,
    factoring: "раскладываем на множители…",
    prev: "Предыдущее простое",
    next: "Следующее простое",
    digits: "Цифр в числе",
    method: "Метод проверки",
    det: "Миллер — Рабин, детерминированный",
    prob: "Миллер — Рабин, 25 оснований (вероятность ошибки < 10⁻¹⁵)",
    enter: "Введите натуральное число",
    bad: "Введите целое неотрицательное число, до 300 цифр",
    count: (n: string) => `Простых чисел до ${n}`,
    largest: "Наибольшее из них",
    computing: "Считаем…",
    first: (k: number) => `Первые ${k}`,
    download: "Скачать все (.txt)",
  },
  en: {
    mode: "Mode",
    check: "Check a number",
    list: "Primes up to N",
    n: "Natural number",
    nHint: "Up to 300 digits",
    limit: "List all primes up to",
    limitHint: "At most 10,000,000",
    prime: "Prime number",
    composite: "Composite number",
    neither: "Neither prime nor composite",
    onlyDiv: "divisible only by 1 and itself",
    factors: (f: string) => `= ${f}`,
    factoring: "factoring…",
    prev: "Previous prime",
    next: "Next prime",
    digits: "Digits",
    method: "Test",
    det: "Deterministic Miller–Rabin",
    prob: "Miller–Rabin with 25 bases (error probability < 10⁻¹⁵)",
    enter: "Enter a natural number",
    bad: "Enter a non-negative whole number up to 300 digits",
    count: (n: string) => `Primes up to ${n}`,
    largest: "Largest of them",
    computing: "Computing…",
    first: (k: number) => `First ${k}`,
    download: "Download all (.txt)",
  },
} as const;

const SYNC_FACTOR = 10n ** 15n;
const SYNC_SIEVE = 200_000;

interface SieveResult {
  limit: number;
  count: number;
  head: number[];
  last: number | null;
}

function useWorker(onMessage: (d: unknown) => void) {
  const ref = useRef<Worker | null>(null);
  const cb = useRef(onMessage);
  useEffect(() => {
    cb.current = onMessage;
  });
  useEffect(() => () => ref.current?.terminate(), []);
  return (msg: object) => {
    if (!ref.current) {
      ref.current = new Worker(new URL("./prime.worker.ts", import.meta.url), { type: "module" });
      ref.current.onmessage = (e) => cb.current(e.data);
    }
    ref.current.postMessage(msg);
  };
}

export default function Prime({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ m: "check", n: "97", l: "100" }, { enums: { m: ["check", "list"] } });
  const mode = q.v.m as "check" | "list";
  const [asyncFactors, setAsyncFactors] = useState<{ n: string; f: [string, number][] } | null>(null);
  const [asyncSieve, setAsyncSieve] = useState<SieveResult | null>(null);
  const post = useWorker((d) => {
    const data = d as { type: string; n?: string; factors?: [string, number][]; text?: string | null; limit?: number } & SieveResult;
    if (data.type === "factor") setAsyncFactors({ n: data.n!, f: data.factors! });
    else if (data.text) downloadText(data.text, `primes-to-${data.limit}.txt`);
    else setAsyncSieve({ limit: data.limit, count: data.count, head: data.head, last: data.last });
  });

  const raw = q.v.n.replace(/[\s  ]/g, "");
  const valid = /^\d{1,300}$/.test(raw);
  const n = valid ? BigInt(raw) : null;
  const prime = n !== null ? isPrime(n) : null;
  const bigFactor = n !== null && !prime && n >= SYNC_FACTOR;
  const factors = n !== null && !prime && n > 1n ? (bigFactor ? (asyncFactors?.n === raw ? asyncFactors.f.map(([p, k]) => [BigInt(p), k] as [bigint, number]) : null) : factorize(n)) : null;

  useEffect(() => {
    if (mode === "check" && bigFactor) post({ id: 1, type: "factor", n: raw });
    // post is stable in behaviour
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, bigFactor, raw]);

  const limitRaw = q.v.l.replace(/[\s  ]/g, "");
  const limit = /^\d{1,8}$/.test(limitRaw) && Number(limitRaw) <= 10_000_000 ? Number(limitRaw) : null;
  const syncList = limit !== null && limit <= SYNC_SIEVE ? sieve(limit) : null;
  const list: SieveResult | null = syncList ? { limit: limit!, count: syncList.length, head: syncList.slice(0, 1000), last: syncList[syncList.length - 1] ?? null } : asyncSieve?.limit === limit ? asyncSieve : null;

  useEffect(() => {
    if (mode === "list" && limit !== null && limit > SYNC_SIEVE) post({ id: 2, type: "sieve", limit, full: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, limit]);

  const small = n !== null && raw.length <= 40;
  const inputs = (
    <>
      <Segmented
        label={t.mode}
        value={mode}
        onChange={(m) => q.set({ m })}
        options={[
          { value: "check", label: t.check },
          { value: "list", label: t.list },
        ]}
      />
      {mode === "check" ? (
        <Field label={t.n} htmlFor={`${id}-n`} hint={t.nHint} error={q.v.n.trim() && !valid ? t.bad : undefined}>
          <Input id={`${id}-n`} value={q.v.n} onChange={(e) => q.set({ n: e.target.value })} size="lg" inputMode="numeric" className="tabular" autoComplete="off" />
        </Field>
      ) : (
        <Field label={t.limit} htmlFor={`${id}-l`} hint={t.limitHint}>
          <Input id={`${id}-l`} value={q.v.l} onChange={(e) => q.set({ l: e.target.value })} size="lg" inputMode="numeric" className="tabular" autoComplete="off" />
        </Field>
      )}
    </>
  );

  const result =
    mode === "check" ? (
      <ResultMain
        label={n !== null ? fmtBig(locale, n) : t.n}
        value={prime === null ? "—" : n! < 2n ? t.neither : prime ? t.prime : t.composite}
        sub={prime === null ? (q.v.n.trim() ? t.bad : t.enter) : prime ? t.onlyDiv : n! < 2n ? undefined : factors ? t.factors(factorText(factors)) : t.factoring}
        rows={
          n !== null
            ? [
                ...(small && n > 2n ? [{ label: t.prev, value: fmtBig(locale, prevPrime(n)!) }] : []),
                ...(small ? [{ label: t.next, value: fmtBig(locale, nextPrime(n)) }] : []),
                { label: t.digits, value: String(raw.replace(/^0+(?=\d)/, "").length) },
                { label: t.method, value: n < DETERMINISTIC_LIMIT ? t.det : t.prob },
              ]
            : undefined
        }
        actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
      />
    ) : (
      <ResultMain
        label={limit !== null ? t.count(fmtBig(locale, BigInt(limit))) : t.limit}
        value={list ? fmtBig(locale, BigInt(list.count)) : limit !== null ? "…" : "—"}
        sub={list?.last ? `${t.largest}: ${fmtBig(locale, BigInt(list.last))}` : limit !== null ? t.computing : t.limitHint}
        actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
      />
    );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {mode === "list" && list && list.count > 0 && (
        <section>
          <SubHeading
            aside={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (syncList) downloadText(syncList.join("\n"), `primes-to-${limit}.txt`);
                  else if (limit !== null) post({ id: 3, type: "sieve", limit, full: true });
                }}
              >
                <Download aria-hidden />
                {t.download}
              </Button>
            }
          >
            {t.first(Math.min(1000, list.count))}
          </SubHeading>
          <p className="tabular max-h-72 overflow-y-auto rounded-[12px] border border-line bg-surface p-4 text-sm leading-relaxed text-fg-2">{list.head.join(", ")}</p>
        </section>
      )}
      <PrimeExplain locale={locale} />
    </Stack>
  );
}

function PrimeExplain({ locale }: { locale: Locale }) {
  return locale === "ru" ? (
    <Explain
      locale={locale}
      formula={["n − 1 = 2ˢ · d,  aᵈ ≡ 1 или a^(2ʳ·d) ≡ −1 (mod n)", "Основания 2, 3, 5, …, 37 — точный ответ для n < 3,3·10²⁴", "Решето Эратосфена для списка до N"]}
      notes={[
        "Тест Миллера — Рабина с 12 первыми простыми основаниями даёт гарантированно верный ответ для всех чисел меньше 3,3·10²⁴ — в том числе для всех 64-битных. Для больших чисел используется 25 оснований: вероятность ошибки меньше 10⁻¹⁵.",
        "Составные числа раскладываются на множители делением на малые простые и методом ро-Полларда; для больших чисел расчёт идёт в фоновом потоке и не блокирует страницу.",
        "Число 1 не является ни простым, ни составным.",
      ]}
    />
  ) : (
    <Explain
      locale={locale}
      formula={["n − 1 = 2ˢ · d,  aᵈ ≡ 1 or a^(2ʳ·d) ≡ −1 (mod n)", "Bases 2, 3, 5, …, 37 — exact for n < 3.3·10²⁴", "Sieve of Eratosthenes for the list up to N"]}
      notes={[
        "Miller–Rabin with the first 12 prime bases is guaranteed correct for every number below 3.3·10²⁴, including all 64-bit numbers. Larger numbers use 25 bases, with an error probability below 10⁻¹⁵.",
        "Composite numbers are factored by trial division and Pollard's rho; large numbers are processed in a background thread so the page stays responsive.",
        "The number 1 is neither prime nor composite.",
      ]}
    />
  );
}
