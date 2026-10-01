"use client";

import { useSyncExternalStore } from "react";
import {
  adjustForZoom,
  DEFAULT_PX_PER_MM,
  parseCalibration,
  parseDprRecord,
  readRaw,
  subscribeCalibration,
  zoomChanged,
  type Calibration,
} from "./calibration";

export interface CalibrationState {
  /** false during SSR and hydration: render neutral UI. */
  ready: boolean;
  cal: Calibration | null;
  /** Effective CSS px per mm to draw with (stored value corrected for zoom, or the 96 dpi estimate). */
  pxPerMm: number;
  calibrated: boolean;
  dpr: number;
  dprAtCalibration: number | null;
  /** devicePixelRatio differs from the one at calibration time (browser zoom or another display). */
  zoomChanged: boolean;
}

const SERVER: CalibrationState = {
  ready: false,
  cal: null,
  pxPerMm: DEFAULT_PX_PER_MM,
  calibrated: false,
  dpr: 1,
  dprAtCalibration: null,
  zoomChanged: false,
};

let cacheKey = "";
let cacheVal: CalibrationState = SERVER;

function getSnapshot(): CalibrationState {
  const raw = readRaw();
  const dpr = window.devicePixelRatio || 1;
  const key = `${raw.cal}|${raw.dpr}|${dpr}`;
  if (key === cacheKey) return cacheVal;
  const cal = parseCalibration(raw.cal);
  const dprAt = cal ? parseDprRecord(raw.dpr, cal.at) : null;
  const changed = zoomChanged(dprAt, dpr);
  cacheKey = key;
  cacheVal = {
    ready: true,
    cal,
    pxPerMm: cal ? (changed && dprAt ? adjustForZoom(cal.pxPerMm, dprAt, dpr) : cal.pxPerMm) : DEFAULT_PX_PER_MM,
    calibrated: !!cal,
    dpr,
    dprAtCalibration: dprAt,
    zoomChanged: changed,
  };
  return cacheVal;
}

const getServerSnapshot = () => SERVER;

/** Current screen calibration (SSR-safe: the server and hydration pass use the 96 dpi estimate). */
export function useCalibration(): CalibrationState {
  return useSyncExternalStore(subscribeCalibration, getSnapshot, getServerSnapshot);
}
