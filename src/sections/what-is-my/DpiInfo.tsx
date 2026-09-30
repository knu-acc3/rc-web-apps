"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { formatDate, formatNumber, parseNumber } from "@/i18n/format";
import type { ToolProps } from "../types";
import { Field, Input } from "@/ui/field";
import {
  CALIBRATION_DPR_KEY,
  CALIBRATION_KEY,
  dotPitchMm,
  logicalDpi,
  parseCalibration,
  parseCalibrationDpr,
  physicalSize,
  ppiFromCalibration,
  ppiFromDiagonal,
  sizeFromPpi,
} from "./lib/screen";
import { liveStore, screenStore } from "./lib/probe";
import { COMMON, dims, Facts, Hero, Hint, Stack } from "./ui";

const T = {
  ru: {
    calibrated: "Плотность пикселей вашего экрана (по калибровке)",
    fromDiagonal: "Плотность пикселей вашего экрана (по диагонали)",
    logical: "Логический DPI (масштаб системы)",
    logicalSub: "это 96 × Device Pixel Ratio — не физическая плотность матрицы",
    calibratedSub: (date: string, method: string) => `калибровка ${method} от ${date}`,
    card: "по банковской карте",
    diag: "по диагонали",
    diagonal: "Диагональ экрана, дюймы",
    diagonalHint: "Например, 15,6 для ноутбука или 27 для монитора — PPI посчитается сразу",
    invalid: "Введите число от 1 до 200",
    logicalRow: "Логический DPI (96 × DPR)",
    scale: "Масштаб в системе",
    physical: "Физическое разрешение",
    ppiCal: "PPI по калибровке",
    notCal: "нет калибровки",
    estDiag: "Диагональ по калибровке",
    ppiDiag: "PPI по введённой диагонали",
    pitch: "Размер пикселя (dot pitch)",
    mm: "мм",
    inch: "″",
    calibrateText:
      "Физическую плотность браузер не знает. Откалибруйте экран банковской картой в инструменте «Реальный размер» на этом сайте — после калибровки здесь автоматически появятся настоящий PPI и диагональ.",
  },
  en: {
    calibrated: "Your screen's pixel density (calibrated)",
    fromDiagonal: "Your screen's pixel density (from diagonal)",
    logical: "Logical DPI (system scaling)",
    logicalSub: "this is 96 × Device Pixel Ratio — not the physical density of the panel",
    calibratedSub: (date: string, method: string) => `calibrated ${method} on ${date}`,
    card: "with a bank card",
    diag: "by diagonal",
    diagonal: "Screen diagonal, inches",
    diagonalHint: "For example 15.6 for a laptop or 27 for a monitor — PPI is calculated instantly",
    invalid: "Enter a number from 1 to 200",
    logicalRow: "Logical DPI (96 × DPR)",
    scale: "System scaling",
    physical: "Physical resolution",
    ppiCal: "PPI from calibration",
    notCal: "not calibrated",
    estDiag: "Diagonal from calibration",
    ppiDiag: "PPI from the entered diagonal",
    pitch: "Pixel size (dot pitch)",
    mm: "mm",
    inch: "″",
    calibrateText:
      "The browser doesn't know the physical density. Calibrate the screen with a bank card in this site's Actual size tool — after that the real PPI and diagonal appear here automatically.",
  },
} as const;

function readCalibration(): { cal: string | null; dpr: string | null } {
  try {
    return { cal: localStorage.getItem(CALIBRATION_KEY), dpr: localStorage.getItem(CALIBRATION_DPR_KEY) };
  } catch {
    return { cal: null, dpr: null };
  }
}

function subscribeStorage(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  window.addEventListener("focus", cb);
  window.addEventListener("actual-size:calibration-change", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("focus", cb);
    window.removeEventListener("actual-size:calibration-change", cb);
  };
}

const calibrationStore = liveStore(readCalibration, subscribeStorage);

export default function DpiInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const id = useId();
  const [diagText, setDiagText] = useState("");
  const s = useSyncExternalStore(screenStore.subscribe, screenStore.getSnapshot, screenStore.getServerSnapshot);
  const calRaw = useSyncExternalStore(calibrationStore.subscribe, calibrationStore.getSnapshot, calibrationStore.getServerSnapshot);
  const cal = parseCalibration(calRaw?.cal);
  // Physical PPI does not depend on later zoom when the DPR at calibration time is known.
  const calDpr = cal ? parseCalibrationDpr(calRaw?.dpr, cal.at) : null;
  const n = (x: number, d = 0) => formatNumber(locale, x, { maximumFractionDigits: d });

  const phys = s ? physicalSize(s.cssW, s.cssH, s.dpr) : null;
  const logical = s ? logicalDpi(s.dpr) : null;
  const ppiCal = s && cal ? ppiFromCalibration(cal.pxPerMm, calDpr ?? s.dpr) : null;
  const diag = parseNumber(diagText);
  const diagOk = diag !== null && diag >= 1 && diag <= 200;
  const ppiDiag = phys && diagOk ? ppiFromDiagonal(phys.w, phys.h, diag) : null;
  const estSize = phys && ppiCal ? sizeFromPpi(phys.w, phys.h, ppiCal) : null;
  const best = ppiCal ?? ppiDiag;

  const label = ppiCal ? t.calibrated : ppiDiag ? t.fromDiagonal : t.logical;
  const value = !s ? null : best ? `${n(best)} PPI` : `${n(logical ?? 96)} dpi`;
  const calMethod = cal?.method === "card" ? t.card : t.diag;
  const calDate = cal && cal.at > 0 ? formatDate(locale, new Date(cal.at), { day: "numeric", month: "long", year: "numeric" }) : null;
  const sub = ppiCal ? (calDate ? t.calibratedSub(calDate, calMethod) : calMethod) : ppiDiag ? undefined : t.logicalSub;

  return (
    <Stack>
      <Hero locale={locale} label={label} value={value} sub={sub} copy={value ?? undefined}>
        <Field
          className="mt-5 max-w-xs"
          label={t.diagonal}
          htmlFor={`${id}-d`}
          hint={t.diagonalHint}
          error={diagText.trim() && !diagOk ? t.invalid : undefined}
        >
          <Input
            id={`${id}-d`}
            inputMode="decimal"
            autoComplete="off"
            value={diagText}
            onChange={(e) => setDiagText(e.target.value)}
            aria-invalid={!!diagText.trim() && !diagOk}
            className="tabular"
          />
        </Field>
      </Hero>
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.logicalRow, v: s ? `${n(logical ?? 96, 1)} dpi` : null },
          { k: t.scale, v: s ? `${n(s.dpr * 100)}${locale === "ru" ? " %" : "%"}` : null },
          { k: t.physical, v: phys ? dims(phys.w, phys.h) : null },
          { k: t.ppiCal, v: s ? (ppiCal ? `${n(ppiCal, 1)} PPI` : t.notCal) : null },
          ...(estSize ? [{ k: t.estDiag, v: `${n(estSize.diagonal, 1)}${t.inch} (${n(estSize.width * 25.4 / 10, 1)} × ${n(estSize.height * 25.4 / 10, 1)} ${locale === "ru" ? "см" : "cm"})` }] : []),
          ...(ppiDiag ? [{ k: t.ppiDiag, v: `${n(ppiDiag, 1)} PPI` }] : []),
          ...(best ? [{ k: t.pitch, v: `${n(dotPitchMm(best), 3)} ${t.mm}` }] : []),
        ]}
      />
      {!cal ? <Hint>{t.calibrateText}</Hint> : null}
    </Stack>
  );
}
