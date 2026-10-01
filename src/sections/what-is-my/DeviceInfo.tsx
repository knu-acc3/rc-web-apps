"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import type { ToolProps } from "../types";
import type { DeviceType } from "./lib/ua";
import { detectUa, pointerStore, screenStore, useDetected, type UaSnapshot } from "./lib/probe";
import { COMMON, dims, Facts, Hero, Hint, Stack, YesNo } from "./ui/kit";

const TYPES: Record<Locale, Record<DeviceType, string>> = {
  ru: {
    mobile: "Смартфон",
    tablet: "Планшет",
    desktop: "Компьютер или ноутбук",
    smarttv: "Смарт-телевизор",
    console: "Игровая приставка",
    wearable: "Носимое устройство",
    xr: "VR/AR-гарнитура",
    embedded: "Встроенное устройство",
  },
  en: {
    mobile: "Smartphone",
    tablet: "Tablet",
    desktop: "Desktop or laptop",
    smarttv: "Smart TV",
    console: "Game console",
    wearable: "Wearable",
    xr: "VR/AR headset",
    embedded: "Embedded device",
  },
};

const T = {
  ru: {
    label: "Ваше устройство",
    type: "Тип устройства",
    vendor: "Производитель",
    model: "Модель",
    os: "Система",
    touch: "Сенсорный экран",
    points: ["точка касания", "точки касания", "точек касания"],
    pointer: "Основной указатель",
    anyPointer: "Все указатели",
    hover: "Наведение курсора (hover)",
    screen: "Экран в CSS-пикселях",
    fine: "точный — мышь, тачпад или стилус",
    coarse: "грубый — палец",
    none: "нет указателя",
    mouse: "мышь / тачпад",
    finger: "палец",
    hidden: "не сообщается браузером",
    modelNote:
      "Браузеры на компьютерах не сообщают производителя и модель. На Android Chrome передаёт модель через Client Hints, а iPhone и iPad называют только тип устройства — без поколения.",
  },
  en: {
    label: "Your device",
    type: "Device type",
    vendor: "Vendor",
    model: "Model",
    os: "System",
    touch: "Touch screen",
    points: ["touch point", "touch points"],
    pointer: "Primary pointer",
    anyPointer: "All pointers",
    hover: "Hover capability",
    screen: "Screen in CSS pixels",
    fine: "fine — mouse, touchpad or stylus",
    coarse: "coarse — finger",
    none: "no pointer",
    mouse: "mouse / touchpad",
    finger: "finger",
    hidden: "not reported by the browser",
    modelNote:
      "Desktop browsers never report the vendor or model. On Android, Chrome sends the model through Client Hints; iPhone and iPad only reveal the device type, not the generation.",
  },
} as const;

function model(u: UaSnapshot): { vendor: string | null; model: string | null } {
  const hm = u.hints?.model?.trim();
  const pm = u.parsed.device?.model && u.parsed.device.model !== "K" ? u.parsed.device.model : null;
  return { vendor: u.parsed.device?.vendor ?? null, model: hm || pm || null };
}

export default function DeviceInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const u = useDetected(detectUa);
  const p = useSyncExternalStore(pointerStore.subscribe, pointerStore.getSnapshot, pointerStore.getServerSnapshot);
  const s = useSyncExternalStore(screenStore.subscribe, screenStore.getSnapshot, screenStore.getServerSnapshot);
  const m = u ? model(u) : null;
  const type = u ? TYPES[locale][u.deviceType] : null;
  const named = m && (m.vendor || m.model) ? [m.vendor, m.model].filter(Boolean).join(" ") : null;
  const pointerText = !p ? null : p.pointer === "fine" ? t.fine : p.pointer === "coarse" ? t.coarse : p.pointer === "none" ? t.none : c.unknown;
  return (
    <Stack>
      <Hero
        locale={locale}
        label={t.label}
        value={type}
        sub={named ?? undefined}
        copy={type ? [type, named].filter(Boolean).join(" — ") : undefined}
      />
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.type, v: type },
          { k: t.vendor, v: m ? (m.vendor ?? t.hidden) : null },
          { k: t.model, v: m ? (m.model ?? t.hidden) : null },
          { k: t.os, v: u ? (u.os.label ?? c.unknown) : null },
          {
            k: t.touch,
            v: p ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <YesNo locale={locale} value={p.maxTouchPoints > 0} />
                {p.maxTouchPoints > 0 ? `${formatNumber(locale, p.maxTouchPoints)} ${plural(locale, p.maxTouchPoints, t.points)}` : null}
              </span>
            ) : null,
          },
          { k: t.pointer, v: pointerText },
          { k: t.anyPointer, v: p ? p.anyPointer.map((x) => (x === "fine" ? t.mouse : t.finger)).join(", ") || "—" : null },
          { k: t.hover, v: p ? <YesNo locale={locale} value={p.hover} /> : null },
          { k: t.screen, v: s ? `${dims(s.cssW, s.cssH)}, DPR ${formatNumber(locale, s.dpr, { maximumFractionDigits: 3 })}` : null },
        ]}
      />
      {u && u.deviceType === "desktop" ? <Hint>{t.modelNote}</Hint> : null}
    </Stack>
  );
}
