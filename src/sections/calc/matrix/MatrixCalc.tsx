"use client";

import { useId, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Textarea } from "@/ui/field";
import type { ToolProps } from "../../types";
import { det, eigenvalues, inverse, madd, mmul, rank, rref, scale, transpose, type M } from "../algebra/matrix";
import { complexText, num } from "../algebra/poly";
import { parseQ, toNumber, toText, type Q } from "../algebra/rational";
import { Advanced, Explain, InlineSelect, InlineToggle, OptionsRow, ResultMain, SelectField, Stack, ToolActions } from "../kit/ui";
import { useQueryState } from "../kit/url-state";

export const MATRIX_OPS = ["det", "inverse", "multiply", "add", "subtract", "scalar", "transpose", "rank", "rref", "eigen"] as const;
export type MatrixOp = (typeof MATRIX_OPS)[number];
const TWO = new Set<MatrixOp>(["multiply", "add", "subtract"]);
const SQUARE = new Set<MatrixOp>(["det", "inverse", "eigen"]);
const SIZES = ["1", "2", "3", "4", "5", "6"] as const;

const T = {
  ru: {
    op: "Операция",
    ops: { det: "Определитель det A", inverse: "Обратная матрица A⁻¹", multiply: "Умножение A × B", add: "Сложение A + B", subtract: "Вычитание A − B", scalar: "Умножение на число k·A", transpose: "Транспонирование Aᵀ", rank: "Ранг матрицы", rref: "Ступенчатый вид (метод Гаусса)", eigen: "Собственные значения" } satisfies Record<MatrixOp, string>,
    rows: "Строк",
    cols: "Столбцов",
    size: "Размер",
    cell: (m: string, i: number, j: number) => `${m}, строка ${i}, столбец ${j}`,
    k: "Число k",
    paste: "Вставить матрицу из текста",
    pasteHint: "Строки — с новой строки, числа — через пробел, табуляцию или «;»",
    pasteTo: (m: string) => `Матрица ${m}`,
    result: "Результат",
    enter: "Заполните матрицу",
    bad: "Проверьте ячейки: допустимы числа и дроби вида 1/2",
    dims: "Размеры матриц не подходят для этой операции",
    square: "Нужна квадратная матрица",
    eigenSize: "Собственные значения считаются для матриц 2×2 и 3×3",
    singular: "Определитель равен нулю — обратной матрицы не существует",
    show: "Показывать",
    fractions: "дроби",
    decimals: "десятичные",
    steps: "Преобразования строк",
    charPoly: "Характеристический многочлен",
  },
  en: {
    op: "Operation",
    ops: { det: "Determinant det A", inverse: "Inverse A⁻¹", multiply: "Multiply A × B", add: "Add A + B", subtract: "Subtract A − B", scalar: "Scalar k·A", transpose: "Transpose Aᵀ", rank: "Rank", rref: "Row echelon form (Gauss)", eigen: "Eigenvalues" } satisfies Record<MatrixOp, string>,
    rows: "Rows",
    cols: "Columns",
    size: "Size",
    cell: (m: string, i: number, j: number) => `${m}, row ${i}, column ${j}`,
    k: "Number k",
    paste: "Paste a matrix as text",
    pasteHint: "One row per line, numbers separated by spaces, tabs or ';'",
    pasteTo: (m: string) => `Matrix ${m}`,
    result: "Result",
    enter: "Fill in the matrix",
    bad: "Check the cells: numbers and fractions like 1/2 are allowed",
    dims: "The matrix sizes do not fit this operation",
    square: "A square matrix is required",
    eigenSize: "Eigenvalues are computed for 2×2 and 3×3 matrices",
    singular: "The determinant is zero — the inverse does not exist",
    show: "Show",
    fractions: "fractions",
    decimals: "decimals",
    steps: "Row operations",
    charPoly: "Characteristic polynomial",
  },
} as const;

/* URL encoding: cells separated by "_", rows by "~". */
const decodeGrid = (s: string, r: number, c: number): string[][] => {
  const rows = s.split("~");
  return Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => rows[i]?.split("_")[j] ?? ""));
};
const encodeGrid = (g: string[][]) => g.map((r) => r.map((x) => x.replace(/[_~]/g, "")).join("_")).join("~");

function parseGrid(g: string[][]): { m: M | null; bad: boolean } {
  let bad = false;
  const m = g.map((r) =>
    r.map((x) => {
      if (x.trim() === "") return parseQ("0")!;
      const v = parseQ(x);
      if (!v) bad = true;
      return v ?? parseQ("0")!;
    }),
  );
  return { m: bad ? null : m, bad };
}

function MatrixView({ m, decimals, locale }: { m: M; decimals: boolean; locale: Locale }) {
  const cell = (x: Q) => (decimals ? num(locale, toNumber(x), 6) : toText(x));
  return (
    <div className="inline-grid max-w-full overflow-x-auto rounded-[0.375rem] border-x-2 border-fg px-2 py-1 text-lg" style={{ gridTemplateColumns: `repeat(${m[0]?.length ?? 1}, minmax(0, auto))` }}>
      {m.flatMap((r, i) =>
        r.map((x, j) => (
          <span key={`${i}-${j}`} className="tabular px-2 py-0.5 text-right">
            {cell(x)}
          </span>
        )),
      )}
    </div>
  );
}

function GridInput({ id, name, grid, onChange, locale }: { id: string; name: string; grid: string[][]; onChange: (g: string[][]) => void; locale: Locale }) {
  const t = T[locale];
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 1}, minmax(0, 4.5rem))` }}>
      {grid.flatMap((r, i) =>
        r.map((v, j) => (
          <input
            key={`${i}-${j}`}
            id={`${id}-${name}-${i}-${j}`}
            aria-label={t.cell(name, i + 1, j + 1)}
            value={v}
            placeholder="0"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={v.trim() !== "" && !parseQ(v)}
            onChange={(e) => onChange(grid.map((row, a) => row.map((x, b) => (a === i && b === j ? e.target.value : x))))}
            className="control tabular h-10 px-1.5 text-center"
          />
        )),
      )}
    </div>
  );
}

export default function MatrixCalc({ locale, op = "det" }: ToolProps<{ op?: MatrixOp }>) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState(
    { o: op, ra: "3", ca: "3", rb: "3", cb: "3", a: "2_-3_1~2_0_-1~1_4_5", b: "1_0_0~0_1_0~0_0_1", k: "2", d: "f" },
    { enums: { o: MATRIX_OPS, ra: SIZES, ca: SIZES, rb: SIZES, cb: SIZES, d: ["f", "d"] } },
  );
  const o = q.v.o as MatrixOp;
  const decimals = q.v.d === "d";
  const square = SQUARE.has(o);
  const ra = Number(q.v.ra);
  const ca = square ? ra : Number(q.v.ca);
  const rb = o === "multiply" ? ca : ra;
  const cb = o === "multiply" ? Number(q.v.cb) : ca;
  const gridA = decodeGrid(q.v.a, ra, ca);
  const gridB = decodeGrid(q.v.b, rb, cb);
  const A = parseGrid(gridA);
  const B = parseGrid(gridB);
  const K = parseQ(q.v.k);

  let value: ReactNode = "—";
  let sub: string = t.enter;
  let steps: string[] = [];
  let rows: { label: string; value: string }[] | undefined;
  if (A.bad || (TWO.has(o) && B.bad)) sub = t.bad;
  else if (A.m) {
    const a = A.m;
    const show = (m: M) => <MatrixView m={m} decimals={decimals} locale={locale} />;
    if (o === "det") {
      const d = det(a)!;
      value = decimals ? num(locale, toNumber(d)) : toText(d);
      sub = d.d !== 1n ? `≈ ${num(locale, toNumber(d))}` : `${ra}×${ra}`;
    } else if (o === "inverse") {
      const inv = inverse(a);
      if (inv) {
        value = show(inv);
        sub = `det A = ${toText(det(a)!)}`;
      } else sub = t.singular;
    } else if (o === "transpose") {
      value = show(transpose(a));
      sub = `${ca}×${ra}`;
    } else if (o === "rank") {
      value = String(rank(a));
      sub = `${ra}×${ca}`;
    } else if (o === "rref") {
      const r = rref(a);
      value = show(r.R);
      sub = `rank = ${r.rank}`;
      steps = r.ops;
    } else if (o === "scalar") {
      if (K) {
        value = show(scale(a, K));
        sub = `k = ${toText(K)}`;
      }
    } else if (o === "eigen") {
      if (ra !== 2 && ra !== 3) sub = t.eigenSize;
      else {
        const e = eigenvalues(a)!;
        value = e.roots.map((z, i) => `λ${"₁₂₃"[i]} = ${complexText(locale, z, 4)}`).join(", ");
        sub = `${t.charPoly}: ${e.charPoly.map((c, i) => ({ c, p: e.charPoly.length - 1 - i })).filter((x) => Math.abs(x.c) > 1e-12).map(({ c, p }, i) => `${i === 0 ? (c < 0 ? "−" : "") : c < 0 ? " − " : " + "}${Math.abs(c) === 1 && p > 0 ? "" : num(locale, Math.abs(c), 4)}${p > 0 ? `λ${p > 1 ? (p === 2 ? "²" : "³") : ""}` : ""}`).join("")}`;
        rows = e.roots.map((z, i) => ({ label: `λ${"₁₂₃"[i]}`, value: complexText(locale, z, 6) }));
      }
    } else if (B.m) {
      const r = o === "multiply" ? mmul(a, B.m) : madd(a, B.m, o === "subtract");
      if (r) {
        value = show(r);
        sub = `${r.length}×${r[0].length}`;
      } else sub = t.dims;
    }
  }

  const setGrid = (key: "a" | "b", g: string[][]) => q.set({ [key]: encodeGrid(g) } as never);
  const sizeOpts = SIZES.map((s) => ({ value: s, label: s }));

  const pasteArea = (key: "a" | "b", name: string) => (
    <label className="flex flex-col gap-1 text-sm text-fg-2">
      {t.pasteTo(name)}
      <Textarea
        rows={3}
        className="min-h-20!"
        placeholder={"1 2 3\n4 5 6\n7 8 10"}
        onChange={(e) => {
          const rowsT = e.target.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 6);
          if (!rowsT.length) return;
          const cells = rowsT.map((l) => l.split(/[\s;]+/).filter(Boolean).slice(0, 6));
          const r = cells.length;
          const c = Math.max(...cells.map((x) => x.length));
          const g = Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => cells[i][j] ?? ""));
          q.set(key === "a" ? { a: encodeGrid(g), ra: String(r), ca: String(c) } : { b: encodeGrid(g), rb: String(r), cb: String(c) });
        }}
      />
    </label>
  );

  return (
    <Stack>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6">
        <section className="flex min-w-0 flex-col gap-4 rounded-[0.75rem] border border-line bg-surface p-4 sm:p-5">
          <SelectField id={`${id}-o`} label={t.op} value={o} onChange={(v) => q.set({ o: v })} options={MATRIX_OPS.map((x) => ({ value: x, label: t.ops[x] }))} />
          <div className="flex flex-col gap-2">
            <OptionsRow>
              <span className="text-sm font-semibold text-fg">A</span>
              <InlineSelect id={`${id}-ra`} label={square ? t.size : t.rows} value={q.v.ra} onChange={(v) => q.set({ ra: v })} options={sizeOpts} />
              {!square && <InlineSelect id={`${id}-ca`} label={t.cols} value={q.v.ca} onChange={(v) => q.set({ ca: v })} options={sizeOpts} />}
            </OptionsRow>
            <div className="overflow-x-auto pb-1">
              <GridInput id={id} name="A" grid={gridA} onChange={(g) => setGrid("a", g)} locale={locale} />
            </div>
          </div>
          {TWO.has(o) && (
            <div className="flex flex-col gap-2">
              <OptionsRow>
                <span className="text-sm font-semibold text-fg">B</span>
                {o === "multiply" ? (
                  <>
                    <span className="text-[0.8125rem] text-fg-3">
                      {t.rows}: {rb}
                    </span>
                    <InlineSelect id={`${id}-cb`} label={t.cols} value={q.v.cb} onChange={(v) => q.set({ cb: v })} options={sizeOpts} />
                  </>
                ) : (
                  <span className="text-[0.8125rem] text-fg-3">
                    {ra}×{ca}
                  </span>
                )}
              </OptionsRow>
              <div className="overflow-x-auto pb-1">
                <GridInput id={id} name="B" grid={gridB} onChange={(g) => setGrid("b", g)} locale={locale} />
              </div>
            </div>
          )}
          {o === "scalar" && (
            <label className="flex max-w-40 flex-col gap-1.5 text-sm font-medium text-fg-2">
              {t.k}
              <input value={q.v.k} onChange={(e) => q.set({ k: e.target.value })} className="control tabular h-10" inputMode="text" aria-invalid={!K} />
            </label>
          )}
          <OptionsRow>
            <InlineToggle
              label={t.show}
              showLabel
              value={q.v.d as "f" | "d"}
              onChange={(d) => q.set({ d })}
              options={[
                { value: "f", label: t.fractions },
                { value: "d", label: t.decimals },
              ]}
            />
          </OptionsRow>
          <Advanced title={t.paste}>
            <p className="text-[0.8125rem] text-fg-3">{t.pasteHint}</p>
            {pasteArea("a", "A")}
            {TWO.has(o) && pasteArea("b", "B")}
          </Advanced>
        </section>
        <ResultMain label={t.ops[o]} value={<div tabIndex={0} className={cn("overflow-x-auto", typeof value === "string" && "whitespace-normal")}>{value}</div>} sub={sub} rows={rows} size="md" actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />} />
      </div>
      {steps.length > 0 && <Explain locale={locale} title={t.steps} formula={steps.slice(0, 60)} />}
      <MatrixTheory locale={locale} op={o} />
    </Stack>
  );
}

function MatrixTheory({ locale, op }: { locale: Locale; op: MatrixOp }) {
  const ru = locale === "ru";
  const formula: Partial<Record<MatrixOp, string[]>> = {
    det: ["det [a b; c d] = a·d − b·c", ru ? "n×n: приведение к треугольному виду, det = произведение диагонали" : "n×n: reduce to triangular form, det = product of the diagonal"],
    inverse: ["A⁻¹ = adj(A) / det A", ru ? "[A | E] → [E | A⁻¹] методом Гаусса — Жордана" : "[A | I] → [I | A⁻¹] by Gauss–Jordan elimination"],
    multiply: ["(A·B)ᵢⱼ = Σₖ aᵢₖ · bₖⱼ", ru ? "число столбцов A = число строк B" : "columns of A = rows of B"],
    eigen: ["det(A − λE) = 0"],
    rref: [ru ? "элементарные преобразования строк: перестановка, умножение на число, прибавление строки" : "elementary row operations: swap, scale, add a multiple of a row"],
    rank: [ru ? "ранг = число ненулевых строк в ступенчатом виде" : "rank = number of non-zero rows in echelon form"],
  };
  return (
    <Explain
      locale={locale}
      formula={formula[op] ?? ["(A ± B)ᵢⱼ = aᵢⱼ ± bᵢⱼ", "(Aᵀ)ᵢⱼ = aⱼᵢ", "(k·A)ᵢⱼ = k·aᵢⱼ"]}
      notes={
        ru
          ? [
              "Вычисления точные — в обыкновенных дробях, без погрешностей округления; переключатель показывает результат десятичными дробями.",
              "В ячейки можно вводить целые числа, десятичные (0,5) и дроби (1/3); пустая ячейка считается нулём. Размер матриц — до 6×6.",
              "Собственные значения ищутся как корни характеристического многочлена; для матриц 2×2 и 3×3 показываются и комплексные значения.",
            ]
          : [
              "The arithmetic is exact — in fractions, without rounding errors; the toggle shows decimals instead.",
              "Cells accept integers, decimals (0.5) and fractions (1/3); an empty cell counts as zero. Matrices up to 6×6.",
              "Eigenvalues are the roots of the characteristic polynomial; complex values are shown for 2×2 and 3×3 matrices.",
            ]
      }
    />
  );
}
