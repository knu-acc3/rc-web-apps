"use client";

import { useId } from "react";
import { Tabs } from "@/ui/tabs";
import type { ToolProps } from "../../types";
import { fmtBig } from "../bigint/format";
import { multichoose, multiset, nCr, nPr, withRepetition } from "../bigint/nt";
import { field } from "../kit/num";
import { CalcGrid, Explain, FieldRow, NumField, ResultMain, Stack, ToolActions } from "../kit/ui";
import { useQueryState } from "../kit/url-state";

const KINDS = ["ncr", "npr", "rep-perm", "rep-comb", "multiset"] as const;
type Kind = (typeof KINDS)[number];

const T = {
  ru: {
    kind: "Что посчитать",
    kinds: { ncr: "Сочетания C(n, k)", npr: "Размещения A(n, k)", "rep-perm": "Размещения с повторениями", "rep-comb": "Сочетания с повторениями", multiset: "Перестановки с повторениями" } satisfies Record<Kind, string>,
    n: "Всего элементов n",
    k: "Выбираем k",
    counts: "Сколько раз повторяется каждый элемент",
    countsHint: "Через пробел: для слова «МАМА» — 2 2",
    label: "Количество способов",
    enter: "Введите n и k",
    kGtN: "k не может быть больше n",
    digits: (d: number) => `${d} цифр`,
    desc: {
      ncr: "Порядок не важен, элементы не повторяются: сколько способов выбрать 5 карт из 52",
      npr: "Порядок важен, без повторений: сколько способов раздать 3 призовых места 10 участникам",
      "rep-perm": "Порядок важен, элементы могут повторяться: сколько 4-значных PIN-кодов из 10 цифр",
      "rep-comb": "Порядок не важен, повторы разрешены: сколько способов купить 3 пирожных из 5 видов",
      multiset: "Сколько разных слов можно составить из букв с повторами",
    } satisfies Record<Kind, string>,
  },
  en: {
    kind: "What to count",
    kinds: { ncr: "Combinations C(n, k)", npr: "Permutations P(n, k)", "rep-perm": "Permutations with repetition", "rep-comb": "Combinations with repetition", multiset: "Multiset permutations" } satisfies Record<Kind, string>,
    n: "Total items n",
    k: "Choose k",
    counts: "How many times each item repeats",
    countsHint: "Separated by spaces: for 'MAMA' — 2 2",
    label: "Number of ways",
    enter: "Enter n and k",
    kGtN: "k cannot exceed n",
    digits: (d: number) => `${d} digits`,
    desc: {
      ncr: "Order does not matter, no repeats: ways to choose 5 cards out of 52",
      npr: "Order matters, no repeats: ways to award 3 podium places among 10 runners",
      "rep-perm": "Order matters, repeats allowed: number of 4-digit PINs from 10 digits",
      "rep-comb": "Order does not matter, repeats allowed: ways to buy 3 cakes from 5 kinds",
      multiset: "Number of distinct words from letters with repeats",
    } satisfies Record<Kind, string>,
  },
} as const;

export default function Combinatorics({ locale, kind = "ncr" }: ToolProps<{ kind?: Kind }>) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ t: kind, n: "52", k: "5", c: "1 4 4 2" }, { enums: { t: KINDS } });
  const k = q.v.t as Kind;
  const N = field(locale, q.v.n, { min: 0, max: 100000, int: true });
  const K = field(locale, q.v.k, { min: 0, max: 100000, int: true });
  const counts = q.v.c.split(/[\s,;]+/).filter(Boolean).map(Number);
  const countsOk = counts.length > 0 && counts.every((x) => Number.isInteger(x) && x >= 0) && counts.reduce((a, b) => a + b, 0) <= 5000;

  let value: bigint | null = null;
  let formula = "";
  let err: string | undefined;
  const n = N.value;
  const r = K.value;
  if (k === "multiset") {
    if (countsOk) {
      value = multiset(counts);
      const total = counts.reduce((a, b) => a + b, 0);
      formula = `${total}! / (${counts.map((c) => `${c}!`).join(" · ")})`;
    }
  } else if (n !== null && r !== null) {
    if ((k === "ncr" || k === "npr") && r > n) err = t.kGtN;
    else if (k === "ncr") {
      value = nCr(n, r);
      formula = `C(${n}, ${r}) = ${n}! / (${r}! · ${n - r}!)`;
    } else if (k === "npr") {
      value = nPr(n, r);
      formula = `A(${n}, ${r}) = ${n}! / ${n - r}!`;
    } else if (k === "rep-perm") {
      if (r <= 20000) {
        value = withRepetition(n, r);
        formula = `${n}^${r}`;
      }
    } else {
      value = multichoose(n, r);
      formula = `C(${n} + ${r} − 1, ${r}) = C(${n + r - 1}, ${r})`;
    }
  }
  const text = value !== null ? value.toString() : null;

  return (
    <Stack>
      <div className="flex flex-col gap-4">
        <Tabs label={t.kind} value={k} onChange={(v) => q.set({ t: v })} items={KINDS.map((x) => ({ value: x, label: t.kinds[x] }))} />
        <CalcGrid
          inputs={
            <>
              {k === "multiset" ? (
                <NumField id={`${id}-c`} label={t.counts} hint={t.countsHint} value={q.v.c} onChange={(c) => q.set({ c })} inputMode="text" size="lg" />
              ) : (
                <FieldRow>
                  <NumField id={`${id}-n`} label={t.n} value={q.v.n} onChange={(v) => q.set({ n: v })} error={N.message} inputMode="numeric" size="lg" />
                  <NumField id={`${id}-k`} label={t.k} value={q.v.k} onChange={(v) => q.set({ k: v })} error={K.message ?? err} inputMode="numeric" size="lg" />
                </FieldRow>
              )}
              <p className="text-[13px] text-fg-3">{t.desc[k]}</p>
            </>
          }
          result={
            <ResultMain
              label={t.label}
              value={<span className="break-all">{text ? (text.length <= 60 ? fmtBig(locale, value!) : `${text.slice(0, 40)}…`) : "—"}</span>}
              sub={formula ? `${formula}${text && text.length > 15 ? ` · ${t.digits(text.length)}` : ""}` : (err ?? t.enter)}
              actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
            />
          }
        />
      </div>
      {text && text.length > 60 && <p className="tabular max-h-60 overflow-y-auto rounded-[12px] border border-line bg-surface p-4 font-mono text-sm break-all text-fg-2">{text}</p>}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Сочетания: C(n, k) = n! / (k! · (n − k)!)", "Размещения: A(n, k) = n! / (n − k)!", "С повторениями: nᵏ и C(n + k − 1, k)", "Перестановки с повторениями: n! / (k₁! · k₂! · …)"]}
          notes={["Если порядок важен (пароль, места на пьедестале) — это размещения; если не важен (набор карт, состав команды) — сочетания.", "Все значения считаются точно, целыми числами любой длины."]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Combinations: C(n, k) = n! / (k! · (n − k)!)", "Permutations: P(n, k) = n! / (n − k)!", "With repetition: nᵏ and C(n + k − 1, k)", "Multiset permutations: n! / (k₁! · k₂! · …)"]}
          notes={["If order matters (a password, podium places) use permutations; if not (a hand of cards, a team) use combinations.", "All values are exact integers of any length."]}
        />
      )}
    </Stack>
  );
}
