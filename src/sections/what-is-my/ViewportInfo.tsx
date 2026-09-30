"use client";

import { useSyncExternalStore } from "react";
import { formatNumber } from "@/i18n/format";
import type { ToolProps } from "../types";
import { breakpoint } from "./lib/screen";
import { viewportStore } from "./lib/probe";
import { COMMON, dims, Facts, Hero, Stack } from "./ui";

const T = {
  ru: {
    label: "Размер окна браузера (viewport)",
    unit: "CSS-пикселей",
    inner: "window.innerWidth × innerHeight",
    client: "Без полос прокрутки (clientWidth × clientHeight)",
    scrollbar: "Ширина полосы прокрутки",
    visual: "Видимая область (visualViewport)",
    zoom: "масштаб",
    outer: "Окно целиком (outerWidth × outerHeight)",
    device: "В физических пикселях",
    tw: "Брейкпоинт Tailwind CSS",
    bs: "Брейкпоинт Bootstrap",
    orient: "Ориентация окна",
    landscape: "альбомная (ширина больше высоты)",
    portrait: "портретная (высота больше ширины)",
    tip: "Измените размер окна или поверните телефон — значения обновятся сразу.",
  },
  en: {
    label: "Browser window size (viewport)",
    unit: "CSS pixels",
    inner: "window.innerWidth × innerHeight",
    client: "Without scrollbars (clientWidth × clientHeight)",
    scrollbar: "Scrollbar width",
    visual: "Visible area (visualViewport)",
    zoom: "zoom",
    outer: "Whole window (outerWidth × outerHeight)",
    device: "In physical pixels",
    tw: "Tailwind CSS breakpoint",
    bs: "Bootstrap breakpoint",
    orient: "Window orientation",
    landscape: "landscape (wider than tall)",
    portrait: "portrait (taller than wide)",
    tip: "Resize the window or rotate your phone — the values update instantly.",
  },
} as const;

export default function ViewportInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const v = useSyncExternalStore(viewportStore.subscribe, viewportStore.getSnapshot, viewportStore.getServerSnapshot);
  const n = (x: number) => formatNumber(locale, x, { maximumFractionDigits: 2 });
  return (
    <Stack>
      {/* Ticking value: deliberately no aria-live. */}
      <Hero
        locale={locale}
        live={false}
        label={t.label}
        value={v ? dims(v.innerW, v.innerH) : null}
        sub={v ? `${t.unit} · Tailwind: ${breakpoint(v.innerW, "tailwind")} · Bootstrap: ${breakpoint(v.innerW, "bootstrap")}` : undefined}
        copy={v ? `${v.innerW}x${v.innerH}` : undefined}
      >
        <p className="mt-3 text-sm text-fg-3">{t.tip}</p>
      </Hero>
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.inner, v: v ? dims(v.innerW, v.innerH) : null },
          { k: t.client, v: v ? dims(v.clientW, v.clientH) : null },
          { k: t.scrollbar, v: v ? `${Math.max(0, v.innerW - v.clientW)} px` : null },
          { k: t.visual, v: v ? (v.vv ? `${n(v.vv.w)} × ${n(v.vv.h)}, ${t.zoom} ${n(v.vv.scale)}` : c.notAvailable) : null },
          { k: t.outer, v: v ? dims(v.outerW, v.outerH) : null },
          { k: t.device, v: v ? `${dims(Math.round(v.innerW * v.dpr), Math.round(v.innerH * v.dpr))} (DPR ${n(v.dpr)})` : null },
          { k: t.tw, v: v ? breakpoint(v.innerW, "tailwind") : null, mono: true },
          { k: t.bs, v: v ? breakpoint(v.innerW, "bootstrap") : null, mono: true },
          { k: t.orient, v: v ? (v.innerW >= v.innerH ? t.landscape : t.portrait) : null },
        ]}
      />
    </Stack>
  );
}
