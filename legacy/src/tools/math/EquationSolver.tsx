"use client";

import { useState } from "react";
import { MathOperations, XCircle } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type Polynomial = [number, number, number];
type TokenKind =
  | "number"
  | "x"
  | "plus"
  | "minus"
  | "multiply"
  | "divide"
  | "power"
  | "left"
  | "right"
  | "end";
type EquationErrorCode =
  | "empty"
  | "limit"
  | "equals"
  | "unexpected"
  | "number"
  | "parenthesis"
  | "exponent"
  | "degree"
  | "division-variable"
  | "division-zero"
  | "non-finite";

interface Token {
  kind: TokenKind;
  value?: number;
  position: number;
}

type EquationSolution =
  | {
      kind: "solution";
      equationType: "linear" | "quadratic" | "constant";
      rootCase: "zero" | "one" | "two" | "infinite";
      roots: number[];
      coefficients: Polynomial;
      discriminant: number | null;
    }
  | {
      kind: "error";
      code: EquationErrorCode;
    };

class EquationParseError extends Error {
  code: EquationErrorCode;

  constructor(code: EquationErrorCode) {
    super(code);
    this.name = "EquationParseError";
    this.code = code;
  }
}

function clean(value: number): number {
  if (!Number.isFinite(value)) {
    throw new EquationParseError("non-finite");
  }
  return Object.is(value, -0) ? 0 : value;
}

function add(left: Polynomial, right: Polynomial): Polynomial {
  return [
    clean(left[0] + right[0]),
    clean(left[1] + right[1]),
    clean(left[2] + right[2]),
  ];
}

function subtract(left: Polynomial, right: Polynomial): Polynomial {
  return [
    clean(left[0] - right[0]),
    clean(left[1] - right[1]),
    clean(left[2] - right[2]),
  ];
}

function scale(value: Polynomial, factor: number): Polynomial {
  return [
    clean(value[0] * factor),
    clean(value[1] * factor),
    clean(value[2] * factor),
  ];
}

function multiply(left: Polynomial, right: Polynomial): Polynomial {
  const coefficients = [0, 0, 0, 0, 0];
  for (let leftIndex = 0; leftIndex <= 2; leftIndex += 1) {
    for (let rightIndex = 0; rightIndex <= 2; rightIndex += 1) {
      coefficients[leftIndex + rightIndex] +=
        left[leftIndex] * right[rightIndex];
    }
  }

  if (coefficients[3] !== 0 || coefficients[4] !== 0) {
    throw new EquationParseError("degree");
  }

  return [
    clean(coefficients[0]),
    clean(coefficients[1]),
    clean(coefficients[2]),
  ];
}

function divide(numerator: Polynomial, denominator: Polynomial): Polynomial {
  if (denominator[1] !== 0 || denominator[2] !== 0) {
    throw new EquationParseError("division-variable");
  }
  if (denominator[0] === 0) {
    throw new EquationParseError("division-zero");
  }
  return scale(numerator, 1 / denominator[0]);
}

function tokenize(raw: string): Token[] {
  const source = raw
    .replace(/[−–]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/²/g, "^2");
  const tokens: Token[] = [];
  let position = 0;

  while (position < source.length) {
    const character = source[position];
    if (/\s/.test(character)) {
      position += 1;
      continue;
    }

    const numberMatch = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(source.slice(position));
    if (numberMatch) {
      const value = Number(numberMatch[0]);
      if (!Number.isFinite(value)) {
        throw new EquationParseError("number");
      }
      tokens.push({ kind: "number", value, position });
      if (tokens.length > 256) throw new EquationParseError("limit");
      position += numberMatch[0].length;
      continue;
    }

    if (character === "x" || character === "X") {
      tokens.push({ kind: "x", position });
      if (tokens.length > 256) throw new EquationParseError("limit");
      position += 1;
      continue;
    }

    const symbols: Record<string, TokenKind> = {
      "+": "plus",
      "-": "minus",
      "*": "multiply",
      "/": "divide",
      "^": "power",
      "(": "left",
      ")": "right",
    };
    const kind = symbols[character];
    if (!kind) throw new EquationParseError("unexpected");
    tokens.push({ kind, position });
    if (tokens.length > 256) throw new EquationParseError("limit");
    position += 1;
  }

  tokens.push({ kind: "end", position: source.length });
  return tokens;
}

class PolynomialParser {
  private readonly tokens: Token[];
  private index = 0;
  private depth = 0;
  private lastFactorKind: "number" | "x" | "group" | "power" = "number";

  constructor(source: string) {
    this.tokens = tokenize(source);
  }

  parse(): Polynomial {
    const value = this.parseAddition();
    if (this.current().kind !== "end") {
      throw new EquationParseError(
        this.current().kind === "right" ? "parenthesis" : "unexpected",
      );
    }
    return value;
  }

  private current(): Token {
    return this.tokens[this.index];
  }

  private take(kind: TokenKind): boolean {
    if (this.current().kind !== kind) return false;
    this.index += 1;
    return true;
  }

  private parseAddition(): Polynomial {
    let value = this.parseMultiplication();
    while (this.current().kind === "plus" || this.current().kind === "minus") {
      const operation = this.current().kind;
      this.index += 1;
      const right = this.parseMultiplication();
      value = operation === "plus" ? add(value, right) : subtract(value, right);
    }
    return value;
  }

  private parseMultiplication(): Polynomial {
    let value = this.parseUnary();
    let leftKind = this.lastFactorKind;

    while (true) {
      if (this.take("multiply")) {
        value = multiply(value, this.parseUnary());
        leftKind = this.lastFactorKind;
        continue;
      }
      if (this.take("divide")) {
        value = divide(value, this.parseUnary());
        leftKind = this.lastFactorKind;
        continue;
      }
      if (this.canImplicitlyMultiply(leftKind, this.current().kind)) {
        value = multiply(value, this.parseUnary());
        leftKind = this.lastFactorKind;
        continue;
      }
      return value;
    }
  }

  private canImplicitlyMultiply(
    left: "number" | "x" | "group" | "power",
    right: TokenKind,
  ): boolean {
    if (left === "number") return right === "x" || right === "left";
    if (left === "x") return right === "left";
    return right === "x" || right === "left";
  }

  private parseUnary(): Polynomial {
    if (this.take("plus")) return this.parseUnary();
    if (this.take("minus")) return scale(this.parseUnary(), -1);
    return this.parsePower();
  }

  private parsePower(): Polynomial {
    const base = this.parsePrimary();
    if (!this.take("power")) return base;

    const exponent = this.current();
    if (
      exponent.kind !== "number" ||
      exponent.value === undefined ||
      exponent.value !== 2
    ) {
      throw new EquationParseError("exponent");
    }
    this.index += 1;
    this.lastFactorKind = "power";
    return multiply(base, base);
  }

  private parsePrimary(): Polynomial {
    const token = this.current();
    if (token.kind === "number" && token.value !== undefined) {
      this.index += 1;
      this.lastFactorKind = "number";
      return [token.value, 0, 0];
    }
    if (token.kind === "x") {
      this.index += 1;
      this.lastFactorKind = "x";
      return [0, 1, 0];
    }
    if (this.take("left")) {
      this.depth += 1;
      if (this.depth > 64) throw new EquationParseError("limit");
      const value = this.parseAddition();
      if (!this.take("right")) {
        throw new EquationParseError("parenthesis");
      }
      this.depth -= 1;
      this.lastFactorKind = "group";
      return value;
    }
    throw new EquationParseError(
      token.kind === "right" ? "parenthesis" : "unexpected",
    );
  }
}

function solveEquation(input: string): EquationSolution {
  const value = input.trim();
  if (!value) return { kind: "error", code: "empty" };
  if (value.length > 512) return { kind: "error", code: "limit" };

  const sides = value.split("=");
  if (sides.length !== 2 || !sides[0].trim() || !sides[1].trim()) {
    return { kind: "error", code: "equals" };
  }

  try {
    const left = new PolynomialParser(sides[0]).parse();
    const right = new PolynomialParser(sides[1]).parse();
    const coefficients = subtract(left, right);
    const [constant, linear, quadratic] = coefficients;

    if (quadratic === 0 && linear === 0) {
      return {
        kind: "solution",
        equationType: "constant",
        rootCase: constant === 0 ? "infinite" : "zero",
        roots: [],
        coefficients,
        discriminant: null,
      };
    }

    if (quadratic === 0) {
      return {
        kind: "solution",
        equationType: "linear",
        rootCase: "one",
        roots: [clean(-constant / linear)],
        coefficients,
        discriminant: null,
      };
    }

    const coefficientScale = Math.max(
      Math.abs(quadratic),
      Math.abs(linear),
      Math.abs(constant),
    );
    const normalizedQuadratic = quadratic / coefficientScale;
    const normalizedLinear = linear / coefficientScale;
    const normalizedConstant = constant / coefficientScale;
    const rawNormalizedDiscriminant =
      normalizedLinear * normalizedLinear -
      4 * normalizedQuadratic * normalizedConstant;
    const discriminantTolerance =
      Number.EPSILON *
      64 *
      Math.max(
        1,
        Math.abs(normalizedLinear * normalizedLinear) +
          Math.abs(4 * normalizedQuadratic * normalizedConstant),
      );
    const normalizedDiscriminant =
      Math.abs(rawNormalizedDiscriminant) <= discriminantTolerance
        ? 0
        : rawNormalizedDiscriminant;
    const discriminant = clean(
      normalizedDiscriminant * coefficientScale * coefficientScale,
    );

    if (normalizedDiscriminant < 0) {
      return {
        kind: "solution",
        equationType: "quadratic",
        rootCase: "zero",
        roots: [],
        coefficients,
        discriminant,
      };
    }
    if (normalizedDiscriminant === 0) {
      return {
        kind: "solution",
        equationType: "quadratic",
        rootCase: "one",
        roots: [clean(-normalizedLinear / (2 * normalizedQuadratic))],
        coefficients,
        discriminant,
      };
    }

    const squareRoot = Math.sqrt(normalizedDiscriminant);
    const sign = normalizedLinear >= 0 ? 1 : -1;
    const q = -0.5 * (normalizedLinear + sign * squareRoot);
    const roots = [
      clean(q / normalizedQuadratic),
      clean(
        q === 0
          ? -normalizedLinear / (2 * normalizedQuadratic)
          : normalizedConstant / q,
      ),
    ].sort((first, second) => first - second);

    return {
      kind: "solution",
      equationType: "quadratic",
      rootCase: "two",
      roots,
      coefficients,
      discriminant,
    };
  } catch (caught) {
    return {
      kind: "error",
      code: caught instanceof EquationParseError ? caught.code : "unexpected",
    };
  }
}

function formatNumber(value: number): string {
  if (Object.is(value, -0) || value === 0) return "0";
  return Number(value.toPrecision(12)).toString();
}

function errorMessage(code: EquationErrorCode, isEn: boolean): string {
  const messages: Record<EquationErrorCode, { en: string; ru: string }> = {
    empty: { en: "Enter an equation.", ru: "Введите уравнение." },
    limit: {
      en: "The equation exceeds the 512-character, 256-token or 64-level nesting limit.",
      ru: "Уравнение превышает лимит: 512 символов, 256 токенов или 64 уровня вложенности.",
    },
    equals: {
      en: "Use exactly one equals sign with an expression on both sides.",
      ru: "Используйте ровно один знак равенства и выражения с обеих сторон.",
    },
    unexpected: {
      en: "The expression is malformed or contains an unsupported symbol.",
      ru: "Выражение записано некорректно или содержит неподдерживаемый символ.",
    },
    number: {
      en: "A numeric literal is invalid or too large.",
      ru: "Число записано некорректно или слишком велико.",
    },
    parenthesis: {
      en: "Parentheses are not balanced.",
      ru: "Скобки не сбалансированы.",
    },
    exponent: {
      en: "Only the exponent ^2 is supported.",
      ru: "Поддерживается только степень ^2.",
    },
    degree: {
      en: "The expression does not reduce to a linear or quadratic polynomial.",
      ru: "Выражение не сводится к линейному или квадратному многочлену.",
    },
    "division-variable": {
      en: "Division is supported only by a non-zero numeric constant.",
      ru: "Деление поддерживается только на ненулевую числовую константу.",
    },
    "division-zero": {
      en: "Division by zero is undefined.",
      ru: "Деление на ноль не определено.",
    },
    "non-finite": {
      en: "The calculation exceeded the finite numeric range.",
      ru: "Результат вышел за конечный числовой диапазон.",
    },
  };
  return isEn ? messages[code].en : messages[code].ru;
}

export default function EquationSolver() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [result, setResult] = useState<EquationSolution | null>(null);

  const answer =
    result?.kind === "solution"
      ? result.rootCase === "infinite"
        ? isEn
          ? "Infinitely many solutions"
          : "Бесконечно много решений"
        : result.roots.length > 0
          ? result.roots
              .map(
                (root, index) =>
                  (result.roots.length > 1 ? "x" + (index + 1) : "x") +
                  " = " +
                  formatNumber(root),
              )
              .join(", ")
          : isEn
            ? "No real roots"
            : "Нет действительных корней"
      : "";

  return (
    <div
      data-math-tool="equation-solver"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn
            ? "Solve one equation in x"
            : "Решите одно уравнение относительно x"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Supports expressions that reduce to a linear or quadratic polynomial."
            : "Поддерживаются выражения, сводимые к линейному или квадратному многочлену."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(solveEquation(input));
          }}
        >
          <Label htmlFor="equation-input">
            {isEn ? "Equation" : "Уравнение"}
          </Label>
          <Input
            id="equation-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setResult(null);
            }}
            placeholder={
              isEn ? "Enter an equation in x" : "Введите уравнение с x"
            }
            className="mt-2 font-mono"
            autoCapitalize="none"
            spellCheck={false}
          />

          <ToolPrimaryAction
            type="submit"
            disabled={!input.trim()}
            className="mt-4"
            leadingIcon={<MathOperations size={20} weight="bold" />}
          >
            {isEn ? "Solve equation" : "Решить уравнение"}
          </ToolPrimaryAction>
        </form>
      </section>

      {result ? (
        result.kind === "error" ? (
          <section
            aria-live="polite"
            data-equation-result=""
            data-equation-status="error"
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
                  {isEn
                    ? "Cannot solve this input"
                    : "Не удалось решить уравнение"}
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
            data-equation-result=""
            data-equation-status={result.rootCase}
            data-equation-roots={result.roots.map(formatNumber).join(",")}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  {result.rootCase === "two"
                    ? isEn
                      ? "Two real roots"
                      : "Два действительных корня"
                    : result.rootCase === "one"
                      ? isEn
                        ? "One real root"
                        : "Один действительный корень"
                      : result.rootCase === "infinite"
                        ? isEn
                          ? "Identity"
                          : "Тождество"
                        : isEn
                          ? "No real roots"
                          : "Нет действительных корней"}
                </h2>
                <p className="mt-2 break-all font-mono text-xl font-bold text-[var(--color-primary)]">
                  {answer}
                </p>
              </div>
              <CopyButton
                text={answer}
                size="medium"
                tooltip={isEn ? "Copy answer" : "Скопировать ответ"}
                className="shrink-0"
              />
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Reduced form" : "Приведённая форма"}
                </dt>
                <dd className="mt-1 font-mono text-sm">
                  {formatNumber(result.coefficients[2])}x² +{" "}
                  {formatNumber(result.coefficients[1])}x +{" "}
                  {formatNumber(result.coefficients[0])} = 0
                </dd>
              </div>
              {result.discriminant !== null ? (
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {isEn ? "Discriminant" : "Дискриминант"}
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-semibold">
                    {formatNumber(result.discriminant)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        )
      ) : null}

      <AdvancedSettings
        title={isEn ? "Supported syntax" : "Поддерживаемый синтаксис"}
        description={
          isEn
            ? "Operators, implicit multiplication and solver limits"
            : "Операторы, неявное умножение и ограничения решателя"
        }
      >
        <div className="space-y-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <p>
            {isEn
              ? "Use numbers, x, +, −, *, /, parentheses and the exponent ^2. A coefficient next to x or parentheses is treated as multiplication."
              : "Используйте числа, x, +, −, *, /, скобки и степень ^2. Коэффициент рядом с x или скобками считается умножением."}
          </p>
          <p>
            {isEn
              ? "The expression must reduce to degree 2 or lower. Division is allowed only by a non-zero numeric constant. Only real roots are reported; functions and other variables are not supported."
              : "Выражение должно сводиться к степени не выше 2. Делить можно только на ненулевую числовую константу. Выводятся только действительные корни; функции и другие переменные не поддерживаются."}
          </p>
        </div>
      </AdvancedSettings>
    </div>
  );
}
