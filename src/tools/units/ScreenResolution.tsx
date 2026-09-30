"use client";

import { useCallback, useEffect, useState } from "react";
import { Monitor } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Card } from "@/src/components/ui/card";
import { useLanguage } from "@/src/i18n/LanguageContext";

export const SCREEN_SNAPSHOT_LIMITS = {
  minimumCssDimension: 1,
  maximumCssDimension: 100_000,
  minimumDevicePixelRatio: 0.1,
  maximumDevicePixelRatio: 100,
} as const;

export interface ExactResolutionClass {
  readonly width: number;
  readonly height: number;
  readonly name: string;
}

export const EXACT_RESOLUTION_CLASSES: readonly ExactResolutionClass[] = [
  { width: 1280, height: 720, name: "HD (720p)" },
  { width: 1920, height: 1080, name: "Full HD (1080p)" },
  { width: 2560, height: 1440, name: "QHD (1440p)" },
  { width: 3840, height: 2160, name: "4K UHD" },
  { width: 5120, height: 2880, name: "5K" },
  { width: 7680, height: 4320, name: "8K UHD" },
] as const;

export interface BrowserDisplayInput {
  readonly screenWidth: number;
  readonly screenHeight: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly devicePixelRatio: number;
  readonly availableWidth?: number;
  readonly availableHeight?: number;
  readonly colorDepth?: number;
  readonly pixelDepth?: number;
}

export interface ScreenGridMetrics {
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: string;
  readonly megapixels: number;
}

export interface BrowserDisplaySnapshot {
  readonly screen: ScreenGridMetrics & {
    readonly exactClass: ExactResolutionClass | null;
  };
  readonly viewport: ScreenGridMetrics;
  readonly devicePixelRatio: number;
  readonly estimatedPhysicalScreen: readonly [width: number, height: number];
  readonly estimatedPhysicalViewport: readonly [width: number, height: number];
  readonly raw: {
    readonly availableWidth: number | null;
    readonly availableHeight: number | null;
    readonly colorDepth: number | null;
    readonly pixelDepth: number | null;
  };
}

interface ScreenSuccess {
  readonly status: "success";
  readonly snapshot: BrowserDisplaySnapshot;
}

interface ScreenError {
  readonly status: "error";
  readonly message: string;
}

type ScreenSubmission = ScreenSuccess | ScreenError | null;

function isValidCssDimension(value: number): boolean {
  return (
    Number.isSafeInteger(value) &&
    value >= SCREEN_SNAPSHOT_LIMITS.minimumCssDimension &&
    value <= SCREEN_SNAPSHOT_LIMITS.maximumCssDimension
  );
}

function isValidDevicePixelRatio(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= SCREEN_SNAPSHOT_LIMITS.minimumDevicePixelRatio &&
    value <= SCREEN_SNAPSHOT_LIMITS.maximumDevicePixelRatio
  );
}

function optionalInteger(
  value: number | undefined,
  minimum: number,
  maximum: number,
): number | null {
  return value !== undefined &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : null;
}

export function greatestCommonDivisor(a: number, b: number): number | null {
  if (
    !Number.isSafeInteger(a) ||
    !Number.isSafeInteger(b) ||
    a <= 0 ||
    b <= 0
  ) {
    return null;
  }

  let left = a;
  let right = b;
  while (right !== 0) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }
  return left;
}

export function calculateScreenGridMetrics(
  width: number,
  height: number,
): ScreenGridMetrics | null {
  if (!isValidCssDimension(width) || !isValidCssDimension(height)) return null;
  const divisor = greatestCommonDivisor(width, height);
  if (divisor === null) return null;

  return {
    width,
    height,
    aspectRatio: `${width / divisor}:${height / divisor}`,
    megapixels: (width * height) / 1_000_000,
  };
}

export function findExactResolutionClass(
  width: number,
  height: number,
): ExactResolutionClass | null {
  if (!isValidCssDimension(width) || !isValidCssDimension(height)) return null;
  const landscapeWidth = Math.max(width, height);
  const landscapeHeight = Math.min(width, height);
  return (
    EXACT_RESOLUTION_CLASSES.find(
      (entry) =>
        entry.width === landscapeWidth && entry.height === landscapeHeight,
    ) ?? null
  );
}

export function estimatePhysicalPixelGrid(
  width: number,
  height: number,
  devicePixelRatio: number,
): readonly [width: number, height: number] | null {
  if (
    !isValidCssDimension(width) ||
    !isValidCssDimension(height) ||
    !isValidDevicePixelRatio(devicePixelRatio)
  ) {
    return null;
  }
  return [
    Math.round(width * devicePixelRatio),
    Math.round(height * devicePixelRatio),
  ];
}

export function calculateBrowserDisplaySnapshot(
  input: BrowserDisplayInput,
): BrowserDisplaySnapshot | null {
  const screen = calculateScreenGridMetrics(
    input.screenWidth,
    input.screenHeight,
  );
  const viewport = calculateScreenGridMetrics(
    input.viewportWidth,
    input.viewportHeight,
  );
  const estimatedPhysicalScreen = estimatePhysicalPixelGrid(
    input.screenWidth,
    input.screenHeight,
    input.devicePixelRatio,
  );
  const estimatedPhysicalViewport = estimatePhysicalPixelGrid(
    input.viewportWidth,
    input.viewportHeight,
    input.devicePixelRatio,
  );

  if (
    !screen ||
    !viewport ||
    !estimatedPhysicalScreen ||
    !estimatedPhysicalViewport ||
    !isValidDevicePixelRatio(input.devicePixelRatio)
  ) {
    return null;
  }

  return {
    screen: {
      ...screen,
      exactClass: findExactResolutionClass(screen.width, screen.height),
    },
    viewport,
    devicePixelRatio: input.devicePixelRatio,
    estimatedPhysicalScreen,
    estimatedPhysicalViewport,
    raw: {
      availableWidth: optionalInteger(
        input.availableWidth,
        SCREEN_SNAPSHOT_LIMITS.minimumCssDimension,
        SCREEN_SNAPSHOT_LIMITS.maximumCssDimension,
      ),
      availableHeight: optionalInteger(
        input.availableHeight,
        SCREEN_SNAPSHOT_LIMITS.minimumCssDimension,
        SCREEN_SNAPSHOT_LIMITS.maximumCssDimension,
      ),
      colorDepth: optionalInteger(input.colorDepth, 1, 128),
      pixelDepth: optionalInteger(input.pixelDepth, 1, 128),
    },
  };
}

/** Reads browser values only when called; importing this module is SSR-safe. */
export function readBrowserDisplayInput(): BrowserDisplayInput | null {
  if (typeof window === "undefined" || !window.screen) return null;

  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    availableWidth: window.screen.availWidth,
    availableHeight: window.screen.availHeight,
    colorDepth: window.screen.colorDepth,
    pixelDepth: window.screen.pixelDepth,
  };
}

export function formatScreenNumber(value: number): string {
  return value.toFixed(4).replace(/\.?0+$/, "");
}

export default function ScreenResolution() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [submission, setSubmission] = useState<ScreenSubmission>(null);

  const detectDisplay = useCallback(() => {
    try {
      const input = readBrowserDisplayInput();
      const snapshot = input ? calculateBrowserDisplaySnapshot(input) : null;
      if (!snapshot) {
        setSubmission({
          status: "error",
          message: isEn
            ? "The browser did not provide valid display values."
            : "Браузер не предоставил корректные данные об экране.",
        });
        return;
      }
      setSubmission({ status: "success", snapshot });
    } catch {
      setSubmission({
        status: "error",
        message: isEn
          ? "The browser display snapshot could not be read."
          : "Не удалось прочитать данные об экране из браузера.",
      });
    }
  }, [isEn]);

  useEffect(() => {
    const timer = setTimeout(() => {
      detectDisplay();
    }, 0);
    return () => clearTimeout(timer);
  }, [detectDisplay]);

  const snapshot =
    submission?.status === "success" ? submission.snapshot : null;
  const formatMegapixels = (value: number) =>
    value.toLocaleString(isEn ? "en-US" : "ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  const rawValue = (value: number | null, suffix = "") =>
    value === null ? "—" : `${value}${suffix}`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <Card className="p-4 sm:p-5">
        <p className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Press the button to take a one-time snapshot of the CSS screen, viewport and device pixel ratio reported by this browser."
            : "Нажмите кнопку, чтобы один раз прочитать CSS-размер экрана, область просмотра и коэффициент пикселей, которые сообщает браузер."}
        </p>

        <div className="mt-4">
          <ToolPrimaryAction
            type="button"
            fullWidthOnMobile={false}
            className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
            onClick={detectDisplay}
            leadingIcon={<Monitor size={20} aria-hidden="true" />}
          >
            {isEn ? "Read display data" : "Считать данные экрана"}
          </ToolPrimaryAction>
        </div>

        <ToolResult
          className="mt-5"
          status={submission?.status ?? "idle"}
          title={
            submission?.status === "success"
              ? isEn
                ? "Browser display snapshot"
                : "Снимок данных браузера"
              : submission?.status === "error"
                ? isEn
                  ? "Display values unavailable"
                  : "Данные экрана недоступны"
                : isEn
                  ? "No snapshot yet"
                  : "Снимка пока нет"
          }
          description={
            submission?.status === "error"
              ? submission.message
              : submission?.status === "success"
                ? isEn
                  ? "These are browser-reported CSS values, not verified hardware specifications."
                  : "Это CSS-значения от браузера, а не проверенные характеристики матрицы."
                : isEn
                  ? "Run the check to see the values available to this page."
                  : "Запустите проверку, чтобы увидеть доступные странице значения."
          }
        >
          {snapshot ? (
            <div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4 text-center">
                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                  {isEn
                    ? "Reported screen size"
                    : "Размер экрана по данным браузера"}
                </p>
                <p className="mt-1 break-words font-mono text-3xl font-bold text-[var(--color-text)] sm:text-4xl">
                  {snapshot.screen.width} × {snapshot.screen.height}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  CSS px
                </p>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                  <dt className="text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Aspect ratio" : "Соотношение сторон"}
                  </dt>
                  <dd className="mt-1 font-mono text-lg font-semibold">
                    {snapshot.screen.aspectRatio}
                  </dd>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                  <dt className="text-xs text-[var(--color-text-muted)]">
                    {isEn ? "CSS megapixels" : "Мегапиксели CSS"}
                  </dt>
                  <dd className="mt-1 font-mono text-lg font-semibold">
                    {formatMegapixels(snapshot.screen.megapixels)} MP
                  </dd>
                </div>
                {snapshot.screen.exactClass ? (
                  <div className="col-span-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 sm:col-span-1">
                    <dt className="text-xs text-[var(--color-text-muted)]">
                      {isEn
                        ? "Exact curated match"
                        : "Точное совпадение справочника"}
                    </dt>
                    <dd className="mt-1 text-lg font-semibold">
                      {snapshot.screen.exactClass.name}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm">
                <p className="font-medium text-[var(--color-text)]">
                  {isEn
                    ? "Viewport at snapshot time"
                    : "Область просмотра в момент снимка"}
                </p>
                <p className="mt-1 text-[var(--color-text-muted)]">
                  <span className="font-mono text-[var(--color-text)]">
                    {snapshot.viewport.width} × {snapshot.viewport.height} CSS
                    px
                  </span>
                  {` · ${snapshot.viewport.aspectRatio} · ${formatMegapixels(snapshot.viewport.megapixels)} MP`}
                </p>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {isEn
                  ? "Browser zoom, operating-system scaling, browser chrome and the active monitor in a multi-monitor setup can change these values."
                  : "Масштаб браузера и системы, панели браузера и активный монитор в системе с несколькими экранами могут менять эти значения."}
              </p>
            </div>
          ) : null}
        </ToolResult>
      </Card>

      <AdvancedSettings
        title={isEn ? "Raw browser values" : "Исходные значения браузера"}
        description={
          isEn
            ? "Available work area, pixel ratio and cautious grid estimates"
            : "Доступная область, коэффициент пикселей и осторожная оценка сетки"
        }
      >
        {snapshot ? (
          <div>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                <dt className="text-xs text-[var(--color-text-muted)]">
                  screen.width × screen.height
                </dt>
                <dd className="mt-1 break-words font-mono text-sm">
                  {snapshot.screen.width} × {snapshot.screen.height}
                </dd>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                <dt className="text-xs text-[var(--color-text-muted)]">
                  screen.availWidth × screen.availHeight
                </dt>
                <dd className="mt-1 break-words font-mono text-sm">
                  {rawValue(snapshot.raw.availableWidth)} ×{" "}
                  {rawValue(snapshot.raw.availableHeight)}
                </dd>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                <dt className="text-xs text-[var(--color-text-muted)]">
                  window.innerWidth × window.innerHeight
                </dt>
                <dd className="mt-1 break-words font-mono text-sm">
                  {snapshot.viewport.width} × {snapshot.viewport.height}
                </dd>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                <dt className="text-xs text-[var(--color-text-muted)]">
                  window.devicePixelRatio
                </dt>
                <dd className="mt-1 break-words font-mono text-sm">
                  {formatScreenNumber(snapshot.devicePixelRatio)}
                </dd>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                <dt className="text-xs text-[var(--color-text-muted)]">
                  screen.colorDepth
                </dt>
                <dd className="mt-1 break-words font-mono text-sm">
                  {rawValue(snapshot.raw.colorDepth, " bit")}
                </dd>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                <dt className="text-xs text-[var(--color-text-muted)]">
                  screen.pixelDepth
                </dt>
                <dd className="mt-1 break-words font-mono text-sm">
                  {rawValue(snapshot.raw.pixelDepth, " bit")}
                </dd>
              </div>
            </dl>

            <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
              <p>
                {isEn
                  ? "Estimated screen backing grid"
                  : "Оценка внутренней сетки экрана"}
                :{" "}
                <span className="font-mono font-semibold text-[var(--color-text)]">
                  ≈ {snapshot.estimatedPhysicalScreen[0]} ×{" "}
                  {snapshot.estimatedPhysicalScreen[1]} px
                </span>
              </p>
              <p className="mt-1">
                {isEn
                  ? "Estimated viewport backing grid"
                  : "Оценка внутренней сетки области"}
                :{" "}
                <span className="font-mono font-semibold text-[var(--color-text)]">
                  ≈ {snapshot.estimatedPhysicalViewport[0]} ×{" "}
                  {snapshot.estimatedPhysicalViewport[1]} px
                </span>
              </p>
              <p className="mt-2">
                {isEn
                  ? "Method: CSS dimensions multiplied by devicePixelRatio and rounded. This is a browser backing-grid estimate, not proof of the panel's native pixel count or physical density."
                  : "Метод: CSS-размеры умножаются на devicePixelRatio и округляются. Это оценка внутренней сетки браузера, а не подтверждение нативного числа пикселей или физической плотности матрицы."}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Run the primary check first. Raw values are captured only when you press the button and are not monitored in the background."
              : "Сначала запустите основную проверку. Исходные значения читаются только по нажатию кнопки и не отслеживаются в фоне."}
          </p>
        )}
      </AdvancedSettings>
    </div>
  );
}
