"use client";

import { useSyncExternalStore } from "react";
import { formatNumber } from "@/i18n/format";
import type { ToolProps } from "../types";
import { aspectRatio, physicalSize, resolutionName } from "./lib/screen";
import { screenStore } from "./lib/probe";
import { COMMON, dims, Facts, Hero, Hint, Stack, YesNo } from "./ui";

const T = {
  ru: {
    label: "Разрешение вашего экрана (физические пиксели)",
    physical: "Физическое разрешение",
    css: "Логическое разрешение (CSS-пиксели)",
    dpr: "Device Pixel Ratio (масштаб)",
    avail: "Доступная область (без панели задач)",
    depth: "Глубина цвета",
    bits: "бит",
    hdr: "HDR-режим экрана",
    gamut: "Цветовой охват",
    orientation: "Ориентация",
    ratio: "Соотношение сторон",
    multi: "Несколько мониторов",
    approx: "≈",
    rounded: "округлено: браузер сообщает размер экрана целым числом CSS-пикселей",
    class: "класс",
    landscape: "альбомная",
    portrait: "портретная",
    scaled: (css: string, phys: string, pct: string) =>
      `Браузер видит экран как ${css} CSS-пикселей — именно это число многие сайты ошибочно называют разрешением. С масштабом ${pct} ваша матрица на самом деле ${phys}.`,
    zoom: "Масштаб страницы в браузере тоже меняет Device Pixel Ratio. Если цифры странные, нажмите Ctrl+0 (⌘+0 на Mac) и посмотрите снова.",
    colors: (n: string) => `${n} цветов`,
    millions: "млн",
    billions: "млрд",
  },
  en: {
    label: "Your screen resolution (physical pixels)",
    physical: "Physical resolution",
    css: "Logical resolution (CSS pixels)",
    dpr: "Device Pixel Ratio (scale)",
    avail: "Available area (without taskbar)",
    depth: "Color depth",
    bits: "bit",
    hdr: "HDR display mode",
    gamut: "Color gamut",
    orientation: "Orientation",
    ratio: "Aspect ratio",
    multi: "Multiple monitors",
    approx: "≈",
    rounded: "rounded: browsers report the screen size as whole CSS pixels",
    class: "class",
    landscape: "landscape",
    portrait: "portrait",
    scaled: (css: string, phys: string, pct: string) =>
      `The browser sees the screen as ${css} CSS pixels — the number many sites wrongly call your resolution. At ${pct} scaling your panel is actually ${phys}.`,
    zoom: "Browser page zoom changes the Device Pixel Ratio too. If the numbers look odd, press Ctrl+0 (⌘+0 on a Mac) and check again.",
    colors: (n: string) => `${n} colors`,
    millions: "million",
    billions: "billion",
  },
} as const;

const GAMUT = { srgb: "sRGB", p3: "Display P3", rec2020: "Rec. 2020" } as const;

export default function ScreenInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const s = useSyncExternalStore(screenStore.subscribe, screenStore.getSnapshot, screenStore.getServerSnapshot);
  const phys = s ? physicalSize(s.cssW, s.cssH, s.dpr) : null;
  const name = phys ? resolutionName(phys.w, phys.h) : null;
  const ar = phys ? aspectRatio(phys.w, phys.h) : null;
  const pct = s ? `${formatNumber(locale, Math.round(s.dpr * 100))}${locale === "ru" ? " %" : "%"}` : "";
  const colors = s ? 2 ** Math.min(s.colorDepth, 30) : 0;
  const colorsText = colors >= 1e9 ? `${formatNumber(locale, colors / 1e9, { maximumFractionDigits: 1 })} ${t.billions}` : `${formatNumber(locale, colors / 1e6, { maximumFractionDigits: 1 })} ${t.millions}`;
  const physText = phys ? dims(phys.w, phys.h) : null;
  const nameText = name ? `${name.exact ? "" : `${t.class} `}${name.name}${name.alias ? ` (${name.alias})` : ""}` : "";

  return (
    <Stack>
      <Hero
        locale={locale}
        label={t.label}
        value={physText ? `${phys?.approx ? `${t.approx} ` : ""}${physText}` : null}
        sub={name && ar ? `${nameText} · ${ar.common ?? ar.exact}` : undefined}
        copy={phys ? `${phys.w}x${phys.h}` : undefined}
      />
      {s && phys && s.dpr !== 1 ? <Hint>{t.scaled(dims(s.cssW, s.cssH), dims(phys.w, phys.h), pct)}</Hint> : null}
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.physical, v: phys ? `${physText}${phys.approx ? ` (${t.rounded})` : ""}` : null },
          { k: t.css, v: s ? dims(s.cssW, s.cssH) : null },
          { k: t.dpr, v: s ? `${formatNumber(locale, s.dpr, { maximumFractionDigits: 4 })} (${pct})` : null },
          { k: t.avail, v: s ? dims(s.availW, s.availH) : null },
          { k: t.ratio, v: ar ? (ar.common && ar.common !== ar.exact ? `${ar.common} (${ar.exact})` : ar.exact) : null },
          { k: t.depth, v: s ? `${s.colorDepth} ${t.bits} — ${t.colors(colorsText)}` : null },
          { k: t.hdr, v: s ? <YesNo locale={locale} value={s.hdr} /> : null },
          { k: t.gamut, v: s ? (s.gamut ? GAMUT[s.gamut] : c.unknown) : null },
          {
            k: t.orientation,
            v: s ? `${(s.orientation ?? (s.cssW >= s.cssH ? "landscape" : "portrait")).startsWith("landscape") ? t.landscape : t.portrait}${s.angle !== null ? `, ${s.angle}°` : ""}` : null,
          },
          ...(s?.extended !== null && s?.extended !== undefined ? [{ k: t.multi, v: <YesNo locale={locale} value={s.extended} /> }] : []),
        ]}
      />
      <Hint>{t.zoom}</Hint>
    </Stack>
  );
}
