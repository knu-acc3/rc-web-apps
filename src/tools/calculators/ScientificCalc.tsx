"use client";

import { useCallback, useEffect, useState } from "react";
import { Calculator } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";

type AngleMode = "DEG" | "RAD";

type TokenKind =
  "number" | "identifier" | "operator" | "leftParen" | "rightParen";

interface Token {
  kind: TokenKind;
  value: string;
}

interface Evaluation {
  expression: string;
  value: number;
  formatted: string;
  error: string;
}

interface HistoryEntry {
  expression: string;
  result: string;
}

const MAIN_KEYS = [
  "C",
  "⌫",
  "/",
  "*",
  "7",
  "8",
  "9",
  "-",
  "4",
  "5",
  "6",
  "+",
  "1",
  "2",
  "3",
  "%",
  "0",
  ".",
  "(",
  ")",
];

const SCIENTIFIC_KEYS = [
  { label: "sin", value: "sin(" },
  { label: "cos", value: "cos(" },
  { label: "tan", value: "tan(" },
  { label: "asin", value: "asin(" },
  { label: "acos", value: "acos(" },
  { label: "atan", value: "atan(" },
  { label: "√", value: "sqrt(" },
  { label: "ln", value: "ln(" },
  { label: "log₁₀", value: "log(" },
  { label: "exp", value: "exp(" },
  { label: "|x|", value: "abs(" },
  { label: "xʸ", value: "^" },
  { label: "x!", value: "!" },
  { label: "π", value: "pi" },
  { label: "e", value: "e" },
  { label: "Ans", value: "ans" },
];

function tokenize(expression: string): Token[] {
  const normalizedExpression = expression
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
  const tokens: Token[] = [];
  let index = 0;

  while (index < normalizedExpression.length) {
    const character = normalizedExpression[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    const remaining = normalizedExpression.slice(index);
    const numberMatch = remaining.match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    if (numberMatch) {
      tokens.push({ kind: "number", value: numberMatch[0] });
      index += numberMatch[0].length;
      continue;
    }

    const identifierMatch = remaining.match(/^[a-z]+/i);
    if (identifierMatch) {
      tokens.push({
        kind: "identifier",
        value: identifierMatch[0].toLowerCase(),
      });
      index += identifierMatch[0].length;
      continue;
    }

    if ("+-*/^!%".includes(character)) {
      tokens.push({ kind: "operator", value: character });
      index += 1;
      continue;
    }

    if (character === "(") {
      tokens.push({ kind: "leftParen", value: character });
      index += 1;
      continue;
    }

    if (character === ")") {
      tokens.push({ kind: "rightParen", value: character });
      index += 1;
      continue;
    }

    throw new Error("invalid-token");
  }

  return tokens;
}

function factorial(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 170) {
    throw new Error("factorial-domain");
  }
  let result = 1;
  for (let current = 2; current <= value; current += 1) {
    result *= current;
  }
  return result;
}

class ExpressionParser {
  private index = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly angleMode: AngleMode,
    private readonly answer: number,
  ) {}

  parse(): number {
    const value = this.parseExpression();
    if (this.index !== this.tokens.length) throw new Error("unexpected-token");
    if (!Number.isFinite(value)) throw new Error("non-finite");
    return value;
  }

  private current(): Token | undefined {
    return this.tokens[this.index];
  }

  private take(kind: TokenKind, value?: string): boolean {
    const token = this.current();
    if (!token || token.kind !== kind) return false;
    if (value !== undefined && token.value !== value) return false;
    this.index += 1;
    return true;
  }

  private parseExpression(): number {
    let value = this.parseTerm();
    while (true) {
      if (this.take("operator", "+")) value += this.parseTerm();
      else if (this.take("operator", "-")) value -= this.parseTerm();
      else return value;
    }
  }

  private parseTerm(): number {
    let value = this.parseUnary();
    while (true) {
      if (this.take("operator", "*")) value *= this.parseUnary();
      else if (this.take("operator", "/")) value /= this.parseUnary();
      else return value;
    }
  }

  private parseUnary(): number {
    if (this.take("operator", "+")) return this.parseUnary();
    if (this.take("operator", "-")) return -this.parseUnary();
    return this.parsePower();
  }

  private parsePower(): number {
    const value = this.parsePostfix();
    if (this.take("operator", "^")) {
      return value ** this.parseUnary();
    }
    return value;
  }

  private parsePostfix(): number {
    let value = this.parsePrimary();
    while (true) {
      if (this.take("operator", "!")) value = factorial(value);
      else if (this.take("operator", "%")) value /= 100;
      else return value;
    }
  }

  private parsePrimary(): number {
    const token = this.current();
    if (!token) throw new Error("missing-value");

    if (token.kind === "number") {
      this.index += 1;
      return Number(token.value);
    }

    if (token.kind === "identifier") {
      this.index += 1;
      if (token.value === "pi") return Math.PI;
      if (token.value === "e") return Math.E;
      if (token.value === "ans") return this.answer;

      if (!this.take("leftParen")) throw new Error("missing-parenthesis");
      const argument = this.parseExpression();
      if (!this.take("rightParen")) throw new Error("missing-parenthesis");
      return this.applyFunction(token.value, argument);
    }

    if (this.take("leftParen")) {
      const value = this.parseExpression();
      if (!this.take("rightParen")) throw new Error("missing-parenthesis");
      return value;
    }

    throw new Error("missing-value");
  }

  private applyFunction(name: string, value: number): number {
    const toRadians = (input: number): number =>
      this.angleMode === "DEG" ? (input * Math.PI) / 180 : input;
    const fromRadians = (input: number): number =>
      this.angleMode === "DEG" ? (input * 180) / Math.PI : input;

    if (name === "sin") return Math.sin(toRadians(value));
    if (name === "cos") {
      if (this.angleMode === "DEG") {
        const rem = Math.abs((Math.abs(value) - 90) % 180);
        if (rem < 1e-9 || Math.abs(rem - 180) < 1e-9) {
          return 0;
        }
      }
      return Math.cos(toRadians(value));
    }
    if (name === "tan") {
      if (this.angleMode === "DEG") {
        const rem = Math.abs((Math.abs(value) - 90) % 180);
        if (rem < 1e-9 || Math.abs(rem - 180) < 1e-9) {
          throw new Error("Математическая неопределенность: tan(90°) не существует.");
        }
      }
      return Math.tan(toRadians(value));
    }
    if (name === "asin") return fromRadians(Math.asin(value));
    if (name === "acos") return fromRadians(Math.acos(value));
    if (name === "atan") return fromRadians(Math.atan(value));
    if (name === "sqrt") return Math.sqrt(value);
    if (name === "ln") return Math.log(value);
    if (name === "log") return Math.log10(value);
    if (name === "exp") return Math.exp(value);
    if (name === "abs") return Math.abs(value);
    throw new Error("unknown-function");
  }
}

function evaluateExpression(
  expression: string,
  angleMode: AngleMode,
  answer: number,
): number {
  const tokens = tokenize(expression);
  if (!tokens.length) throw new Error("empty");
  return new ExpressionParser(tokens, angleMode, answer).parse();
}

function formatResult(value: number): string {
  if (Object.is(value, -0) || Math.abs(value) < 1e-14) return "0";
  const absolute = Math.abs(value);
  if (absolute >= 1e12 || absolute < 1e-10) {
    return value.toExponential(10).replace(/\.?0+e/, "e");
  }
  return Number.parseFloat(value.toPrecision(12)).toString();
}

export default function ScientificCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [expression, setExpression] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [lastAnswer, setLastAnswer] = useState(0);
  const [angleMode, setAngleMode] = useState<AngleMode>("DEG");
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const hasFreshEvaluation =
    evaluation !== null && evaluation.expression === expression;

  const append = useCallback((value: string) => {
    setExpression((current) => (current + value).slice(0, 2000));
  }, []);

  const backspace = useCallback(() => {
    setExpression((current) => current.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    setExpression("");
    setEvaluation(null);
  }, []);

  const calculate = useCallback(() => {
    const currentExpression = expression.trim();
    if (!currentExpression) return;

    try {
      const value = evaluateExpression(
        currentExpression,
        angleMode,
        lastAnswer,
      );
      const formatted = formatResult(value);
      setEvaluation({
        expression,
        value,
        formatted,
        error: "",
      });
      setLastAnswer(value);
      setHistory((current) =>
        [
          { expression: currentExpression, result: formatted },
          ...current,
        ].slice(0, 10),
      );
    } catch {
      setEvaluation({
        expression,
        value: Number.NaN,
        formatted: "",
        error: isEn
          ? "Check the expression and function domains."
          : "Проверьте выражение и области допустимых значений функций.",
      });
    }
  }, [angleMode, expression, isEn, lastAnswer]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return;
      }

      if (/^[0-9.+\-*/^()%!]$/.test(event.key)) {
        event.preventDefault();
        append(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculate();
      } else if (event.key === "Escape") {
        event.preventDefault();
        clear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [append, backspace, calculate, clear]);

  const handleMainKey = (key: string) => {
    if (key === "C") clear();
    else if (key === "⌫") backspace();
    else append(key);
  };

  const addToMemory = (direction: 1 | -1) => {
    if (!Number.isFinite(lastAnswer)) return;
    setMemory((current) => current + direction * lastAnswer);
  };

  return (
    <div data-tool-width="compact" className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <Card className="p-4 sm:p-5">
        <Input
          id="scientific-expression"
          value={expression}
          onChange={(event) => setExpression(event.target.value.slice(0, 2000))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              calculate();
            } else if (event.key === "Escape") {
              event.preventDefault();
              clear();
            }
          }}
          placeholder={isEn ? "Enter an expression" : "Введите выражение"}
          aria-label={isEn ? "Expression" : "Выражение"}
          className="h-14 text-right font-mono text-xl"
          autoComplete="off"
          autoFocus
        />

        <section
          className="mt-3 min-h-24 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-right"
          aria-live="polite"
        >
          <div className="mb-1 flex min-h-11 items-center justify-between gap-3">
            <span className="text-sm text-[var(--color-text-muted)]">
              {isEn ? "Result" : "Результат"}
            </span>
            {hasFreshEvaluation && !evaluation.error ? (
              <CopyButton text={evaluation.formatted} size="medium" />
            ) : null}
          </div>
          <p className="break-all font-mono text-3xl font-bold">
            {hasFreshEvaluation
              ? evaluation.error || evaluation.formatted
              : "0"}
          </p>
        </section>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {MAIN_KEYS.map((key) => (
            <Button
              key={key}
              type="button"
              variant={
                key === "C"
                  ? "soft"
                  : ["+", "-", "*", "/"].includes(key)
                    ? "outline"
                    : "ghost"
              }
              onClick={() => handleMainKey(key)}
              className="min-h-12 text-lg"
              aria-label={
                key === "⌫"
                  ? isEn
                    ? "Backspace"
                    : "Удалить символ"
                  : undefined
              }
            >
              {key === "*" ? "×" : key === "/" ? "÷" : key}
            </Button>
          ))}
        </div>

        <div className="mt-3">
          <ToolPrimaryAction
            type="button"
            onClick={calculate}
            disabled={!expression.trim()}
            leadingIcon={<Calculator size={22} />}
          >
            =
          </ToolPrimaryAction>
        </div>
      </Card>

      <AdvancedSettings
        title={isEn ? "Scientific functions" : "Научные функции"}
        description={
          isEn
            ? "Trigonometry, constants, memory, history and syntax"
            : "Тригонометрия, константы, память, история и синтаксис"
        }
      >
        <div className="space-y-5 [&_button]:min-h-11 [&_select]:min-h-11">
          <label className="block text-sm">
            <span className="mb-1.5 block">
              {isEn ? "Angle mode" : "Угловой режим"}
            </span>
            <select
              value={angleMode}
              onChange={(event) => {
                setAngleMode(event.target.value as AngleMode);
                setEvaluation(null);
              }}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:max-w-xs"
            >
              <option value="DEG">{isEn ? "Degrees" : "Градусы"}</option>
              <option value="RAD">{isEn ? "Radians" : "Радианы"}</option>
            </select>
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">
              {isEn ? "Functions and constants" : "Функции и константы"}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {SCIENTIFIC_KEYS.map((key) => (
                <Button
                  key={key.label}
                  type="button"
                  variant="outline"
                  onClick={() => append(key.value)}
                  className="px-2 font-mono text-sm"
                >
                  {key.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">
                {isEn ? "Memory" : "Память"}
              </p>
              <span className="font-mono text-sm">{formatResult(memory)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMemory(0)}
              >
                MC
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => append(formatResult(memory))}
              >
                MR
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => addToMemory(1)}
              >
                M+
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => addToMemory(-1)}
              >
                M−
              </Button>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "Supported operators: +, −, ×, ÷, ^, postfix % and !. Percent divides the preceding value by 100; it is not contextual percent addition."
                : "Операторы: +, −, ×, ÷, ^, постфиксные % и !. Процент делит предыдущее значение на 100 и не является контекстным прибавлением процента."}
            </p>
            <p className="mt-2">
              {isEn
                ? "Implicit multiplication is not supported: write 2*pi, not 2pi. Factorial accepts integers from 0 to 170. Keyboard: Enter calculates, Escape clears."
                : "Неявное умножение не поддерживается: пишите 2*pi, а не 2pi. Факториал принимает целые от 0 до 170. Клавиатура: Enter считает, Escape очищает."}
            </p>
          </div>

          <div>
            <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
              <p className="text-sm font-medium">
                {isEn ? "History" : "История"}
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setHistory([])}
                disabled={!history.length}
              >
                {isEn ? "Clear" : "Очистить"}
              </Button>
            </div>
            {history.length ? (
              <div className="space-y-2">
                {history.map((item, index) => (
                  <Button
                    key={item.expression + "-" + String(index)}
                    type="button"
                    variant="outline"
                    onClick={() => setExpression(item.expression)}
                    className="flex h-auto w-full justify-between whitespace-normal py-2 text-left"
                  >
                    <span className="min-w-0 break-all font-mono text-sm">
                      {item.expression}
                    </span>
                    <span className="shrink-0 font-mono font-semibold">
                      = {item.result}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                {isEn ? "No calculations yet." : "Расчётов пока нет."}
              </p>
            )}
          </div>
        </div>
      </AdvancedSettings>
    </div>
  );
}
