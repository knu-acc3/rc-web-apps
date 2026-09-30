"use client";

import { useState } from "react";
import { GridFour, XCircle } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

const MAX_DIMENSION = 4;
const PIVOT_EPSILON = 1e-12;

type MatrixOperation = "determinant" | "inverse" | "add" | "multiply";
type MatrixErrorCode =
  "invalid-a" | "invalid-b" | "square" | "singular" | "range";
type NumericMatrix = number[][];
type InputMatrix = string[][];

type MatrixResult =
  | {
      kind: "scalar";
      operation: "determinant";
      value: number;
    }
  | {
      kind: "matrix";
      operation: Exclude<MatrixOperation, "determinant">;
      value: NumericMatrix;
    }
  | {
      kind: "error";
      code: MatrixErrorCode;
    };

class MatrixCalculationError extends Error {
  code: MatrixErrorCode;

  constructor(code: MatrixErrorCode) {
    super(code);
    this.name = "MatrixCalculationError";
    this.code = code;
  }
}

function createInputMatrix(): InputMatrix {
  return Array.from({ length: MAX_DIMENSION }, () =>
    Array.from({ length: MAX_DIMENSION }, () => ""),
  );
}

function readMatrix(
  source: InputMatrix,
  rows: number,
  columns: number,
  errorCode: MatrixErrorCode,
): NumericMatrix {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => {
      const raw = source[row][column].trim();
      if (!raw) throw new MatrixCalculationError(errorCode);
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        throw new MatrixCalculationError(errorCode);
      }
      return value;
    }),
  );
}

function determinant(source: NumericMatrix): number {
  const matrix = source.map((row) => row.slice());
  const rowScales = matrix.map((row) =>
    Math.max(...row.map((value) => Math.abs(value))),
  );
  let result = 1;

  for (let column = 0; column < matrix.length; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < matrix.length; row += 1) {
      const candidateRatio =
        rowScales[row] === 0
          ? 0
          : Math.abs(matrix[row][column]) / rowScales[row];
      const pivotRatio =
        rowScales[pivotRow] === 0
          ? 0
          : Math.abs(matrix[pivotRow][column]) / rowScales[pivotRow];
      if (candidateRatio > pivotRatio) {
        pivotRow = row;
      }
    }

    const pivotRatio =
      rowScales[pivotRow] === 0
        ? 0
        : Math.abs(matrix[pivotRow][column]) / rowScales[pivotRow];
    if (pivotRatio <= PIVOT_EPSILON) return 0;
    if (pivotRow !== column) {
      [matrix[pivotRow], matrix[column]] = [matrix[column], matrix[pivotRow]];
      [rowScales[pivotRow], rowScales[column]] = [
        rowScales[column],
        rowScales[pivotRow],
      ];
      result *= -1;
    }

    const pivot = matrix[column][column];
    result *= pivot;
    for (let row = column + 1; row < matrix.length; row += 1) {
      const factor = matrix[row][column] / pivot;
      for (
        let targetColumn = column + 1;
        targetColumn < matrix.length;
        targetColumn += 1
      ) {
        matrix[row][targetColumn] -= factor * matrix[column][targetColumn];
      }
    }
  }

  return result;
}

function inverse(source: NumericMatrix): NumericMatrix {
  const size = source.length;
  const rowScales = source.map((row) =>
    Math.max(...row.map((value) => Math.abs(value))),
  );
  const augmented = source.map((row, rowIndex) => [
    ...row,
    ...Array.from({ length: size }, (_, columnIndex) =>
      rowIndex === columnIndex ? 1 : 0,
    ),
  ]);

  for (let column = 0; column < size; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < size; row += 1) {
      const candidateRatio =
        rowScales[row] === 0
          ? 0
          : Math.abs(augmented[row][column]) / rowScales[row];
      const pivotRatio =
        rowScales[pivotRow] === 0
          ? 0
          : Math.abs(augmented[pivotRow][column]) / rowScales[pivotRow];
      if (candidateRatio > pivotRatio) {
        pivotRow = row;
      }
    }

    const pivotRatio =
      rowScales[pivotRow] === 0
        ? 0
        : Math.abs(augmented[pivotRow][column]) / rowScales[pivotRow];
    if (pivotRatio <= PIVOT_EPSILON) {
      throw new MatrixCalculationError("singular");
    }
    if (pivotRow !== column) {
      [augmented[pivotRow], augmented[column]] = [
        augmented[column],
        augmented[pivotRow],
      ];
      [rowScales[pivotRow], rowScales[column]] = [
        rowScales[column],
        rowScales[pivotRow],
      ];
    }

    const pivot = augmented[column][column];
    for (let index = 0; index < size * 2; index += 1) {
      augmented[column][index] /= pivot;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let index = 0; index < size * 2; index += 1) {
        augmented[row][index] -= factor * augmented[column][index];
      }
    }
  }

  return augmented.map((row) => row.slice(size));
}

function addMatrices(left: NumericMatrix, right: NumericMatrix): NumericMatrix {
  return left.map((row, rowIndex) =>
    row.map((value, columnIndex) => value + right[rowIndex][columnIndex]),
  );
}

function multiplyMatrices(
  left: NumericMatrix,
  right: NumericMatrix,
): NumericMatrix {
  return Array.from({ length: left.length }, (_, row) =>
    Array.from({ length: right[0].length }, (_, column) => {
      let value = 0;
      for (let index = 0; index < right.length; index += 1) {
        value += left[row][index] * right[index][column];
      }
      return value;
    }),
  );
}

function ensureFiniteMatrix(matrix: NumericMatrix): NumericMatrix {
  if (matrix.some((row) => row.some((value) => !Number.isFinite(value)))) {
    throw new MatrixCalculationError("range");
  }
  return matrix;
}

function ensureFiniteScalar(value: number): number {
  if (!Number.isFinite(value)) {
    throw new MatrixCalculationError("range");
  }
  return value;
}

function formatNumber(value: number): string {
  if (Object.is(value, -0) || value === 0) return "0";
  return Number(value.toPrecision(12)).toString();
}

function serializeMatrix(matrix: NumericMatrix): string {
  return matrix.map((row) => row.map(formatNumber).join("\t")).join("\n");
}

function MatrixInputGrid({
  label,
  prefix,
  matrix,
  rows,
  columns,
  isEn,
  onChange,
}: {
  label: string;
  prefix: string;
  matrix: InputMatrix;
  rows: number;
  columns: number;
  isEn: boolean;
  onChange: (row: number, column: number, value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[var(--color-text)]">{label}</p>
      <div
        role="group"
        aria-label={label}
        className="mt-2 grid gap-2"
        style={{
          gridTemplateColumns: "repeat(" + columns + ", minmax(0, 1fr))",
        }}
      >
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: columns }, (_, column) => (
            <Input
              key={prefix + "-" + row + "-" + column}
              id={prefix + "-" + row + "-" + column}
              value={matrix[row][column]}
              onChange={(event) => onChange(row, column, event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              aria-label={
                label +
                ", " +
                (isEn ? "row " : "строка ") +
                (row + 1) +
                ", " +
                (isEn ? "column " : "столбец ") +
                (column + 1)
              }
              className="min-w-0 px-2 text-center font-mono"
            />
          )),
        )}
      </div>
    </div>
  );
}

function ResultMatrix({ matrix }: { matrix: NumericMatrix }) {
  const columns = matrix[0]?.length ?? 1;
  return (
    <div
      className="mt-4 grid gap-2"
      style={{
        gridTemplateColumns: "repeat(" + columns + ", minmax(0, 1fr))",
      }}
    >
      {matrix.flatMap((row, rowIndex) =>
        row.map((value, columnIndex) => (
          <code
            key={rowIndex + "-" + columnIndex}
            className="min-w-0 break-all rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-center text-sm font-semibold"
          >
            {formatNumber(value)}
          </code>
        )),
      )}
    </div>
  );
}

function errorMessage(code: MatrixErrorCode, isEn: boolean): string {
  const messages: Record<MatrixErrorCode, { en: string; ru: string }> = {
    "invalid-a": {
      en: "Every visible cell in matrix A must contain a finite number.",
      ru: "Каждая видимая ячейка матрицы A должна содержать конечное число.",
    },
    "invalid-b": {
      en: "Every visible cell in matrix B must contain a finite number.",
      ru: "Каждая видимая ячейка матрицы B должна содержать конечное число.",
    },
    square: {
      en: "Determinant and inverse require a square matrix A.",
      ru: "Для определителя и обратной матрицы матрица A должна быть квадратной.",
    },
    singular: {
      en: "Matrix A is singular and has no inverse.",
      ru: "Матрица A вырождена и не имеет обратной матрицы.",
    },
    range: {
      en: "The result exceeds the finite numeric range.",
      ru: "Результат выходит за конечный числовой диапазон.",
    },
  };
  return isEn ? messages[code].en : messages[code].ru;
}

export default function MatrixCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [operation, setOperation] = useState<MatrixOperation>("determinant");
  const [rowsA, setRowsA] = useState(2);
  const [columnsA, setColumnsA] = useState(2);
  const [columnsB, setColumnsB] = useState(2);
  const [matrixA, setMatrixA] = useState<InputMatrix>(createInputMatrix);
  const [matrixB, setMatrixB] = useState<InputMatrix>(createInputMatrix);
  const [result, setResult] = useState<MatrixResult | null>(null);

  const updateCell = (
    target: "a" | "b",
    row: number,
    column: number,
    value: string,
  ) => {
    const setter = target === "a" ? setMatrixA : setMatrixB;
    setter((current) =>
      current.map((currentRow, rowIndex) =>
        rowIndex === row
          ? currentRow.map((cell, columnIndex) =>
              columnIndex === column ? value : cell,
            )
          : currentRow,
      ),
    );
    setResult(null);
  };

  const calculate = () => {
    try {
      const left = readMatrix(matrixA, rowsA, columnsA, "invalid-a");

      if (operation === "determinant" || operation === "inverse") {
        if (rowsA !== columnsA) {
          throw new MatrixCalculationError("square");
        }
        if (operation === "determinant") {
          setResult({
            kind: "scalar",
            operation,
            value: ensureFiniteScalar(determinant(left)),
          });
        } else {
          setResult({
            kind: "matrix",
            operation,
            value: ensureFiniteMatrix(inverse(left)),
          });
        }
        return;
      }

      if (operation === "add") {
        const right = readMatrix(matrixB, rowsA, columnsA, "invalid-b");
        setResult({
          kind: "matrix",
          operation,
          value: ensureFiniteMatrix(addMatrices(left, right)),
        });
        return;
      }

      const right = readMatrix(matrixB, columnsA, columnsB, "invalid-b");
      setResult({
        kind: "matrix",
        operation,
        value: ensureFiniteMatrix(multiplyMatrices(left, right)),
      });
    } catch (caught) {
      setResult({
        kind: "error",
        code:
          caught instanceof MatrixCalculationError ? caught.code : "invalid-a",
      });
    }
  };

  const operationLabels: Record<MatrixOperation, { en: string; ru: string }> = {
    determinant: { en: "Determinant", ru: "Определитель" },
    inverse: { en: "Inverse", ru: "Обратная матрица" },
    add: { en: "A + B", ru: "A + B" },
    multiply: { en: "A × B", ru: "A × B" },
  };
  const resultText =
    result?.kind === "scalar"
      ? "det(A) = " + formatNumber(result.value)
      : result?.kind === "matrix"
        ? serializeMatrix(result.value)
        : "";

  return (
    <div data-math-tool="matrix-calc" className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn ? "Calculate with matrix A" : "Выполните расчёт с матрицей A"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Choose an operation and fill the compact 2 × 2 workspace."
            : "Выберите операцию и заполните компактную рабочую область 2 × 2."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            calculate();
          }}
        >
          <Label htmlFor="matrix-operation">
            {isEn ? "Operation" : "Операция"}
          </Label>
          <select
            id="matrix-operation"
            value={operation}
            onChange={(event) => {
              setOperation(event.target.value as MatrixOperation);
              setResult(null);
            }}
            className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] sm:text-sm"
          >
            {(Object.keys(operationLabels) as MatrixOperation[]).map(
              (value) => (
                <option key={value} value={value}>
                  {isEn ? operationLabels[value].en : operationLabels[value].ru}
                </option>
              ),
            )}
          </select>
          {operation === "add" || operation === "multiply" ? (
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {isEn
                ? "Matrix B is available in Advanced below the main action."
                : "Матрица B находится в расширенных настройках ниже основного действия."}
            </p>
          ) : null}

          <div className="mt-4">
            <MatrixInputGrid
              label={isEn ? "Matrix A" : "Матрица A"}
              prefix="matrix-a"
              matrix={matrixA}
              rows={rowsA}
              columns={columnsA}
              isEn={isEn}
              onChange={(row, column, value) =>
                updateCell("a", row, column, value)
              }
            />
          </div>

          <ToolPrimaryAction
            type="submit"
            className="mt-4"
            leadingIcon={<GridFour size={20} weight="bold" />}
          >
            {isEn ? "Calculate matrix" : "Рассчитать матрицу"}
          </ToolPrimaryAction>
        </form>
      </section>

      {result ? (
        result.kind === "error" ? (
          <section
            aria-live="polite"
            data-matrix-result=""
            data-matrix-status="error"
            role="alert"
            className="rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 bg-[var(--color-surface)] p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <XCircle
                size={24}
                weight="fill"
                className="mt-0.5 shrink-0 text-[var(--color-danger)]"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-lg font-bold text-[var(--color-danger)]">
                  {isEn ? "Cannot calculate" : "Не удалось выполнить расчёт"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {errorMessage(result.code, isEn)}
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section
            aria-live="polite"
            data-matrix-result=""
            data-matrix-status={result.operation}
            data-matrix-value={resultText}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  {isEn ? "Result" : "Результат"} ·{" "}
                  {isEn
                    ? operationLabels[result.operation].en
                    : operationLabels[result.operation].ru}
                </h2>
                {result.kind === "scalar" ? (
                  <p className="mt-2 break-all font-mono text-2xl font-bold text-[var(--color-primary)]">
                    {formatNumber(result.value)}
                  </p>
                ) : null}
              </div>
              <CopyButton
                text={resultText}
                size="medium"
                tooltip={isEn ? "Copy result" : "Скопировать результат"}
                className="shrink-0"
              />
            </div>
            {result.kind === "matrix" ? (
              <ResultMatrix matrix={result.value} />
            ) : null}
          </section>
        )
      ) : null}

      <AdvancedSettings
        title={isEn ? "Dimensions and matrix B" : "Размеры и матрица B"}
        description={
          isEn ? "Matrices from 1 × 1 to 4 × 4" : "Матрицы от 1 × 1 до 4 × 4"
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="matrix-rows-a">
              {isEn ? "Rows in A" : "Строки A"}
            </Label>
            <select
              id="matrix-rows-a"
              value={rowsA}
              onChange={(event) => {
                setRowsA(Number(event.target.value));
                setResult(null);
              }}
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base sm:text-sm"
            >
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="matrix-columns-a">
              {isEn ? "Columns in A" : "Столбцы A"}
            </Label>
            <select
              id="matrix-columns-a"
              value={columnsA}
              onChange={(event) => {
                setColumnsA(Number(event.target.value));
                setResult(null);
              }}
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base sm:text-sm"
            >
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          {operation === "multiply" ? (
            <div>
              <Label htmlFor="matrix-columns-b">
                {isEn ? "Columns in B" : "Столбцы B"}
              </Label>
              <select
                id="matrix-columns-b"
                value={columnsB}
                onChange={(event) => {
                  setColumnsB(Number(event.target.value));
                  setResult(null);
                }}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base sm:text-sm"
              >
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {operation === "add" || operation === "multiply" ? (
          <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
            <MatrixInputGrid
              label={
                operation === "multiply"
                  ? (isEn ? "Matrix B" : "Матрица B") +
                    " (" +
                    columnsA +
                    " × " +
                    columnsB +
                    ")"
                  : (isEn ? "Matrix B" : "Матрица B") +
                    " (" +
                    rowsA +
                    " × " +
                    columnsA +
                    ")"
              }
              prefix="matrix-b"
              matrix={matrixB}
              rows={operation === "multiply" ? columnsA : rowsA}
              columns={operation === "multiply" ? columnsB : columnsA}
              isEn={isEn}
              onChange={(row, column, value) =>
                updateCell("b", row, column, value)
              }
            />
          </div>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Determinant and inverse require equal rows and columns in A."
              : "Для определителя и обратной матрицы число строк и столбцов A должно совпадать."}
          </p>
        )}
      </AdvancedSettings>
    </div>
  );
}
