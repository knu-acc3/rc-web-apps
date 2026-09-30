"use client";

import { CircleCheck, TriangleAlert, X } from "lucide-react";
import Link from "@/ui/link";
import { useState, type ReactNode } from "react";
import { href, type Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Panel } from "@/ui/panel";
import { saveCalibration } from "./calibration";
import { CardMatcher } from "./CardMatcher";
import type { CalibrationState } from "./use-calibration";

const T = {
  ru: {
    pending: "Размеры рассчитаны для стандартного экрана 96 ppi. Для точного масштаба откалибруйте экран по банковской карте.",
    notCalibrated: "Экран не откалиброван — размеры приблизительные.",
    notCalibratedHint: "Сейчас используется стандарт 96 ppi; у телефонов, ноутбуков и HiDPI-мониторов настоящий масштаб другой.",
    calibrate: "Откалибровать",
    recalibrate: "Перекалибровать",
    other: "Другие способы",
    card: "по банковской карте",
    diagonal: "по диагонали экрана",
    calibrated: "Экран откалиброван",
    mm: "1 мм",
    px: "пикс.",
    zoom: (a: string, b: string) =>
      `Масштаб браузера или экран изменились после калибровки (devicePixelRatio ${a} → ${b}). Размеры пересчитаны автоматически; если окно перенесено на другой монитор — откалибруйте заново.`,
    close: "Закрыть калибровку",
    title: "Калибровка по банковской карте",
  },
  en: {
    pending: "Sizes are computed for a standard 96 ppi screen. Calibrate with a bank card for an exact scale.",
    notCalibrated: "Screen not calibrated — sizes are approximate.",
    notCalibratedHint: "The 96 ppi standard is used for now; phones, laptops and HiDPI monitors have a different real scale.",
    calibrate: "Calibrate",
    recalibrate: "Recalibrate",
    other: "Other methods",
    card: "with a bank card",
    diagonal: "by screen diagonal",
    calibrated: "Screen calibrated",
    mm: "1 mm",
    px: "px",
    zoom: (a: string, b: string) =>
      `Browser zoom or display changed since calibration (devicePixelRatio ${a} → ${b}). Sizes were adjusted automatically; if the window moved to another monitor, calibrate again.`,
    close: "Close calibration",
    title: "Calibrate with a bank card",
  },
} as const;

/** Compact calibration status shown above every actual-size tool, with an inline card calibrator. */
export function CalibrationBar({ locale, state, hideLink = false }: { locale: Locale; state: CalibrationState; hideLink?: boolean }) {
  const t = T[locale];
  const [open, setOpen] = useState(false);
  const nf = (n: number, d = 2) => formatNumber(locale, n, { maximumFractionDigits: d });
  const link = hideLink ? null : (
    <Link href={href(locale, ["actual-size", "calibrate"])} className="text-sm font-medium text-accent underline underline-offset-2">
      {t.other}
    </Link>
  );

  let bar: ReactNode;
  if (!state.ready) {
    bar = <div className="min-h-[52px] rounded-[10px] bg-surface-2 px-4 py-3 text-sm text-fg-2">{t.pending}</div>;
  } else if (!state.calibrated) {
    bar = (
      <div className="flex flex-col gap-2 rounded-[10px] bg-warn-soft px-4 py-3 text-sm text-warn sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <strong className="font-semibold">{t.notCalibrated}</strong> <span className="text-fg-2">{t.notCalibratedHint}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button variant="primary" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {t.calibrate}
          </Button>
          {link}
        </div>
      </div>
    );
  } else {
    const method = state.cal?.method === "diagonal" ? t.diagonal : t.card;
    bar = (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 rounded-[10px] bg-surface-2 px-4 py-2.5 text-sm text-fg-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <CircleCheck className="size-4 shrink-0 text-ok" aria-hidden />
            <span>
              {t.calibrated} {method} · {t.mm} = {nf(state.pxPerMm)} {t.px}
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {t.recalibrate}
            </Button>
            {link}
          </div>
        </div>
        {state.zoomChanged && state.dprAtCalibration && (
          <p className="rounded-[10px] bg-warn-soft px-4 py-2.5 text-sm text-warn">{t.zoom(nf(state.dprAtCalibration), nf(state.dpr))}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {bar}
      {open && state.ready && (
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-fg">{t.title}</h2>
            <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label={t.close} title={t.close}>
              <X />
            </Button>
          </div>
          <CardMatcher
            locale={locale}
            initial={state.pxPerMm}
            onSave={(v) => {
              const ok = saveCalibration(v, "card") !== null;
              if (ok) setOpen(false);
              return ok;
            }}
          />
        </Panel>
      )}
    </div>
  );
}
