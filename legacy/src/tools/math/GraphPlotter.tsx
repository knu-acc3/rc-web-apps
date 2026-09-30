"use client";

import { useId, useMemo, useState } from "react";
import {
  Function as FunctionIcon,
  Sparkle,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { useLanguage } from "@/src/i18n/LanguageContext";

type Operator = "+" | "-" | "*" | "/" | "^" | "(" | ")";
type Token =
  | { type: "number"; value: number }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: Operator }
  | { type: "end" };

type Evaluator = (x: number) => number;

export interface GraphPoint {
  x: number;
  y: number | null;
}

interface PlotConfig {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showGrid: boolean;
}

interface PlotModel {
  expression: string;
  points: GraphPoint[];
  config: PlotConfig;
}

const FUNCTIONS: Readonly<Record<string, (value: number) => number>> =
  Object.freeze({
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    sqrt: Math.sqrt,
    abs: Math.abs,
    ln: Math.log,
    log: Math.log,
    log10: Math.log10,
    exp: Math.exp,
  });

const NUMBER_PATTERN = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i;
const IDENTIFIER_PATTERN = /^[a-z]+/i;
const MAX_TOKENS = 256;

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;

  while (position < expression.length) {
    const character = expression[position];
    if (/\s/.test(character)) {
      position += 1;
      continue;
    }

    if ("+-*/^()".includes(character)) {
      tokens.push({ type: "operator", value: character as Operator });
      position += 1;
    } else {
      const remaining = expression.slice(position);
      const numberMatch = remaining.match(NUMBER_PATTERN);
      if (numberMatch) {
        const value = Number(numberMatch[0]);
        if (!Number.isFinite(value)) throw new Error("invalid-number");
        tokens.push({ type: "number", value });
        position += numberMatch[0].length;
      } else {
        const identifierMatch = remaining.match(IDENTIFIER_PATTERN);
        if (!identifierMatch) throw new Error("unsupported-character");
        tokens.push({
          type: "identifier",
          value: identifierMatch[0].toLowerCase(),
        });
        position += identifierMatch[0].length;
      }
    }

    if (tokens.length > MAX_TOKENS) throw new Error("too-complex");
  }

  tokens.push({ type: "end" });
  return tokens;
}

class ExpressionParser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Evaluator {
    const evaluator = this.parseAddSubtract();
    if (this.peek().type !== "end") throw new Error("unexpected-token");
    return evaluator;
  }

  private peek() {
    return this.tokens[this.index];
  }

  private take() {
    const token = this.tokens[this.index];
    this.index += 1;
    return token;
  }

  private matchOperator(operator: Operator) {
    const token = this.peek();
    if (token.type !== "operator" || token.value !== operator) return false;
    this.index += 1;
    return true;
  }

  private expectOperator(operator: Operator) {
    if (!this.matchOperator(operator)) throw new Error("missing-parenthesis");
  }

  private parseAddSubtract(): Evaluator {
    let left = this.parseMultiplyDivide();

    while (true) {
      const token = this.peek();
      if (
        token.type !== "operator" ||
        (token.value !== "+" && token.value !== "-")
      ) {
        return left;
      }
      this.take();
      const right = this.parseMultiplyDivide();
      const previous = left;
      left =
        token.value === "+"
          ? (x) => previous(x) + right(x)
          : (x) => previous(x) - right(x);
    }
  }

  private parseMultiplyDivide(): Evaluator {
    let left = this.parseUnary();

    while (true) {
      const token = this.peek();
      if (
        token.type !== "operator" ||
        (token.value !== "*" && token.value !== "/")
      ) {
        return left;
      }
      this.take();
      const right = this.parseUnary();
      const previous = left;
      left =
        token.value === "*"
          ? (x) => previous(x) * right(x)
          : (x) => previous(x) / right(x);
    }
  }

  private parseUnary(): Evaluator {
    if (this.matchOperator("+")) return this.parseUnary();
    if (this.matchOperator("-")) {
      const inner = this.parseUnary();
      return (x) => -inner(x);
    }
    return this.parsePower();
  }

  private parsePower(): Evaluator {
    const base = this.parsePrimary();
    if (!this.matchOperator("^")) return base;
    const exponent = this.parseUnary();
    return (x) => Math.pow(base(x), exponent(x));
  }

  private parsePrimary(): Evaluator {
    const token = this.take();

    if (token.type === "number") return () => token.value;

    if (token.type === "operator" && token.value === "(") {
      const inner = this.parseAddSubtract();
      this.expectOperator(")");
      return inner;
    }

    if (token.type !== "identifier") throw new Error("missing-value");
    if (token.value === "x") return (x) => x;
    if (token.value === "pi") return () => Math.PI;
    if (token.value === "e") return () => Math.E;

    const mathFunction = FUNCTIONS[token.value];
    if (!mathFunction) throw new Error("unknown-identifier");
    this.expectOperator("(");
    const argument = this.parseAddSubtract();
    this.expectOperator(")");
    return (x) => mathFunction(argument(x));
  }
}

export function compileExpression(expression: string): Evaluator {
  const normalized = expression.trim();
  if (!normalized) throw new Error("empty-expression");
  if (normalized.length > 200) throw new Error("too-complex");
  return new ExpressionParser(tokenize(normalized)).parse();
}

export function sampleExpression(
  expression: string,
  xMin: number,
  xMax: number,
  sampleCount = 600,
): GraphPoint[] {
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) {
    throw new Error("invalid-range");
  }
  const evaluator = compileExpression(expression);
  const count = Math.max(2, Math.min(2_000, Math.floor(sampleCount)));

  return Array.from({ length: count + 1 }, (_, index) => {
    const x = xMin + ((xMax - xMin) * index) / count;
    try {
      const value = evaluator(x);
      return { x, y: Number.isFinite(value) ? value : null };
    } catch {
      return { x, y: null };
    }
  });
}

function niceTicks(minimum: number, maximum: number, target: number) {
  const roughStep = (maximum - minimum) / target;
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / power;
  const factor =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = factor * power;
  const start = Math.ceil(minimum / step) * step;
  const ticks: number[] = [];

  for (let value = start; value <= maximum + step * 0.001; value += step) {
    ticks.push(Math.abs(value) < step * 1e-10 ? 0 : value);
    if (ticks.length > 30) break;
  }
  return ticks;
}

function formatTick(value: number) {
  const absolute = Math.abs(value);
  if (absolute !== 0 && (absolute >= 100_000 || absolute < 0.001)) {
    return value.toExponential(1);
  }
  return String(Number(value.toFixed(4)));
}

const SVG_WIDTH = 500;
const SVG_HEIGHT = 280;
const PLOT_LEFT = 42;
const PLOT_RIGHT = 16;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 32;

function graphGeometry(model: PlotModel) {
  const { xMin, xMax, yMin, yMax } = model.config;
  const plotWidth = SVG_WIDTH - PLOT_LEFT - PLOT_RIGHT;
  const plotHeight = SVG_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
  const xToSvg = (x: number) =>
    PLOT_LEFT + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const yToSvg = (y: number) =>
    PLOT_TOP + ((yMax - y) / (yMax - yMin)) * plotHeight;
  const expandedMinimum = yMin - (yMax - yMin) * 3;
  const expandedMaximum = yMax + (yMax - yMin) * 3;
  let path = "";
  let previousY: number | null = null;
  let drawing = false;

  for (const point of model.points) {
    if (
      point.y === null ||
      point.y < expandedMinimum ||
      point.y > expandedMaximum
    ) {
      drawing = false;
      previousY = null;
      continue;
    }

    const svgX = xToSvg(point.x);
    const svgY = yToSvg(point.y);
    const discontinuity =
      previousY !== null && Math.abs(svgY - previousY) > plotHeight * 1.25;
    path += `${!drawing || discontinuity ? "M" : "L"}${svgX.toFixed(2)} ${svgY.toFixed(2)} `;
    drawing = true;
    previousY = svgY;
  }

  return {
    path: path.trim(),
    xTicks: niceTicks(xMin, xMax, 7),
    yTicks: niceTicks(yMin, yMax, 6),
    xToSvg,
    yToSvg,
    plotWidth,
    plotHeight,
  };
}

function parseRangeValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

interface FunctionPreset {
  label: string;
  expr: string;
  xMin?: string;
  xMax?: string;
  yMin?: string;
  yMax?: string;
}

const PRESETS: FunctionPreset[] = [
  { label: "sin(x)", expr: "sin(x)", xMin: "-6.28", xMax: "6.28", yMin: "-1.5", yMax: "1.5" },
  { label: "cos(x)", expr: "cos(x)", xMin: "-6.28", xMax: "6.28", yMin: "-1.5", yMax: "1.5" },
  { label: "x² - 4", expr: "x^2 - 4", xMin: "-5", xMax: "5", yMin: "-6", yMax: "15" },
  { label: "x³ - 3x", expr: "x^3 - 3*x", xMin: "-3", xMax: "3", yMin: "-4", yMax: "4" },
  { label: "1 / x", expr: "1/x", xMin: "-5", xMax: "5", yMin: "-5", yMax: "5" },
  { label: "sqrt(x)", expr: "sqrt(x)", xMin: "0", xMax: "16", yMin: "-1", yMax: "5" },
  { label: "abs(x)", expr: "abs(x)", xMin: "-5", xMax: "5", yMin: "-1", yMax: "6" },
];

export default function GraphPlotter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const clipId = useId().replace(/:/g, "");

  const [expression, setExpression] = useState(PRESETS[0].expr);
  const [xMin, setXMin] = useState(PRESETS[0].xMin || "-10");
  const [xMax, setXMax] = useState(PRESETS[0].xMax || "10");
  const [yMin, setYMin] = useState(PRESETS[0].yMin || "-10");
  const [yMax, setYMax] = useState(PRESETS[0].yMax || "10");
  const [showGrid, setShowGrid] = useState(true);

  const model = useMemo<PlotModel | null>(() => {
    const parsedXMin = parseRangeValue(xMin);
    const parsedXMax = parseRangeValue(xMax);
    const parsedYMin = parseRangeValue(yMin);
    const parsedYMax = parseRangeValue(yMax);

    if (
      parsedXMin === null ||
      parsedXMax === null ||
      parsedYMin === null ||
      parsedYMax === null ||
      parsedXMin >= parsedXMax ||
      parsedYMin >= parsedYMax
    ) {
      return null;
    }

    try {
      const points = sampleExpression(expression, parsedXMin, parsedXMax);
      if (!points.some((p) => p.y !== null)) return null;
      return {
        expression: expression.trim(),
        points,
        config: {
          xMin: parsedXMin,
          xMax: parsedXMax,
          yMin: parsedYMin,
          yMax: parsedYMax,
          showGrid,
        },
      };
    } catch {
      return null;
    }
  }, [expression, showGrid, xMax, xMin, yMax, yMin]);

  const geometry = useMemo(
    () => (model ? graphGeometry(model) : null),
    [model],
  );

  const applyPreset = (p: FunctionPreset) => {
    setExpression(p.expr);
    if (p.xMin) setXMin(p.xMin);
    if (p.xMax) setXMax(p.xMax);
    if (p.yMin) setYMin(p.yMin);
    if (p.yMax) setYMax(p.yMax);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* 1-Click Function Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Functions:" : "Функции:"}
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(p)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
              expression === p.expr
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
            )}
          >
            {p.label}
          </button>
        ))}
        {expression && (
          <button
            type="button"
            onClick={() => setExpression("")}
            className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-red-500"
          >
            <Trash size={14} />
            {isEn ? "Clear" : "Очистить"}
          </button>
        )}
      </div>

      <Card className="p-4 sm:p-5">
        {/* Function Input Row */}
        <div>
          <Label htmlFor="graph-expression" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            f(x)
          </Label>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-[var(--color-text-muted)]">
                y =
              </span>
              <Input
                id="graph-expression"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder={isEn ? "sin(x) or x^2 - 4" : "sin(x) или x^2 - 4"}
                autoComplete="off"
                spellCheck={false}
                className="h-11 pl-11 font-mono text-base font-semibold"
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            {isEn
              ? "Supported operators: + − * / ^ ( ). Functions: sin, cos, tan, sqrt, abs, ln, log10, exp, pi, e."
              : "Операторы: + − * / ^ ( ). Функции: sin, cos, tan, sqrt, abs, ln, log10, exp, pi, e."}
          </p>

          <Button
            type="button"
            data-tool-primary-action=""
            size="md"
            className="mt-3 h-10 px-5 min-w-[160px] w-auto"
            onClick={() => {}}
          >
            <FunctionIcon size={18} />
            {isEn ? "Plot function" : "Построить график"}
          </Button>
        </div>

        <AdvancedSettings
          className="mt-4"
          defaultOpen={true}
          title={isEn ? "Axes range and grid" : "Диапазон осей и сетка"}
          description={isEn ? "Visible range for x and y axes" : "Видимый диапазон для осей x и y"}
        >
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            <span>{isEn ? "Bounds" : "Границы осей"}</span>
            <label className="flex cursor-pointer items-center gap-1.5 select-none font-normal lowercase">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="size-4 rounded accent-[var(--color-primary)]"
              />
              <span className="text-xs text-[var(--color-text)]">
                {isEn ? "Show grid" : "Сетка"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div>
              <Label htmlFor="graph-x-min" className="text-[11px] text-[var(--color-text-muted)]">
                X min
              </Label>
              <Input
                id="graph-x-min"
                type="number"
                value={xMin}
                onChange={(e) => setXMin(e.target.value)}
                className="mt-1 h-9 font-mono text-xs"
              />
            </div>
            <div>
              <Label htmlFor="graph-x-max" className="text-[11px] text-[var(--color-text-muted)]">
                X max
              </Label>
              <Input
                id="graph-x-max"
                type="number"
                value={xMax}
                onChange={(e) => setXMax(e.target.value)}
                className="mt-1 h-9 font-mono text-xs"
              />
            </div>
            <div>
              <Label htmlFor="graph-y-min" className="text-[11px] text-[var(--color-text-muted)]">
                Y min
              </Label>
              <Input
                id="graph-y-min"
                type="number"
                value={yMin}
                onChange={(e) => setYMin(e.target.value)}
                className="mt-1 h-9 font-mono text-xs"
              />
            </div>
            <div>
              <Label htmlFor="graph-y-max" className="text-[11px] text-[var(--color-text-muted)]">
                Y max
              </Label>
              <Input
                id="graph-y-max"
                type="number"
                value={yMax}
                onChange={(e) => setYMax(e.target.value)}
                className="mt-1 h-9 font-mono text-xs"
              />
            </div>
          </div>
        </AdvancedSettings>

        {/* Rendered SVG Plot */}
        <div className="mt-5 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-2 sm:p-3">
          {model && geometry ? (
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="block aspect-[5/3] w-full select-none"
              role="img"
              aria-label={`Graph of ${model.expression}`}
            >
              <defs>
                <clipPath id={clipId}>
                  <rect
                    x={PLOT_LEFT}
                    y={PLOT_TOP}
                    width={geometry.plotWidth}
                    height={geometry.plotHeight}
                  />
                </clipPath>
              </defs>

              {/* Grid Lines */}
              {model.config.showGrid &&
                geometry.xTicks.map((tick) => (
                  <line
                    key={`x-grid-${tick}`}
                    x1={geometry.xToSvg(tick)}
                    x2={geometry.xToSvg(tick)}
                    y1={PLOT_TOP}
                    y2={SVG_HEIGHT - PLOT_BOTTOM}
                    stroke="var(--color-border)"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />
                ))}
              {model.config.showGrid &&
                geometry.yTicks.map((tick) => (
                  <line
                    key={`y-grid-${tick}`}
                    x1={PLOT_LEFT}
                    x2={SVG_WIDTH - PLOT_RIGHT}
                    y1={geometry.yToSvg(tick)}
                    y2={geometry.yToSvg(tick)}
                    stroke="var(--color-border)"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />
                ))}

              {/* Axis lines (x=0, y=0) */}
              {model.config.xMin <= 0 && model.config.xMax >= 0 && (
                <line
                  x1={geometry.xToSvg(0)}
                  x2={geometry.xToSvg(0)}
                  y1={PLOT_TOP}
                  y2={SVG_HEIGHT - PLOT_BOTTOM}
                  stroke="var(--color-text-muted)"
                  strokeWidth="1.5"
                />
              )}
              {model.config.yMin <= 0 && model.config.yMax >= 0 && (
                <line
                  x1={PLOT_LEFT}
                  x2={SVG_WIDTH - PLOT_RIGHT}
                  y1={geometry.yToSvg(0)}
                  y2={geometry.yToSvg(0)}
                  stroke="var(--color-text-muted)"
                  strokeWidth="1.5"
                />
              )}

              {/* Tick labels */}
              {geometry.xTicks.map((tick) => (
                <text
                  key={`x-label-${tick}`}
                  x={geometry.xToSvg(tick)}
                  y={SVG_HEIGHT - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="var(--color-text-muted)"
                >
                  {formatTick(tick)}
                </text>
              ))}
              {geometry.yTicks.map((tick) => (
                <text
                  key={`y-label-${tick}`}
                  x={PLOT_LEFT - 6}
                  y={geometry.yToSvg(tick) + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="var(--color-text-muted)"
                >
                  {formatTick(tick)}
                </text>
              ))}

              {/* Curve Path */}
              <path
                d={geometry.path}
                clipPath={`url(#${clipId})`}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <div className="flex aspect-[5/3] w-full items-center justify-center text-center text-sm text-[var(--color-text-muted)]">
              {expression
                ? isEn
                  ? "Check expression syntax or axis range"
                  : "Проверьте синтаксис функции или диапазон осей"
                : isEn
                  ? "Enter a function or select one from presets above"
                  : "Введите функцию или выберите из готовых выше"}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
