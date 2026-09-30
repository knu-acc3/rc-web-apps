"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { CopyButton } from "@/ui/copy-button";
import { Panel } from "@/ui/panel";
import type { ToolProps } from "../types";
import { physicalSize, resolutionName } from "./lib/screen";
import { tzOffsetMinutes, utcLabel } from "./lib/tz";
import { detectUa, nav, screenStore, useDetected, viewportStore } from "./lib/probe";
import { COMMON, dims, Pending } from "./ui";

const T = {
  ru: {
    title: "Отчёт о вашей системе",
    copyAll: "Скопировать отчёт",
    browser: "Браузер",
    os: "Система",
    device: "Тип устройства",
    screen: "Экран",
    viewport: "Окно браузера",
    timezone: "Часовой пояс",
    language: "Язык",
    cpu: "Логических процессоров",
    memory: "Память (по данным браузера)",
    bits: "Разрядность",
    cookies: "Cookie",
    js: "JavaScript",
    types: { mobile: "Смартфон", tablet: "Планшет", desktop: "Компьютер", smarttv: "Телевизор", console: "Игровая приставка", wearable: "Носимое устройство", xr: "VR/AR-гарнитура", embedded: "Встроенное устройство" },
    enabled: "включены",
    disabled: "выключены",
    jsOn: "включён",
    gb: "ГБ",
    bits64: (n: number) => `${n} бит`,
  },
  en: {
    title: "Your system report",
    copyAll: "Copy report",
    browser: "Browser",
    os: "System",
    device: "Device type",
    screen: "Screen",
    viewport: "Browser window",
    timezone: "Time zone",
    language: "Language",
    cpu: "Logical processors",
    memory: "Memory (browser-reported)",
    bits: "Bitness",
    cookies: "Cookies",
    js: "JavaScript",
    types: { mobile: "Smartphone", tablet: "Tablet", desktop: "Desktop or laptop", smarttv: "Smart TV", console: "Game console", wearable: "Wearable", xr: "VR/AR headset", embedded: "Embedded device" },
    enabled: "enabled",
    disabled: "disabled",
    jsOn: "enabled",
    gb: "GB",
    bits64: (n: number) => `${n}-bit`,
  },
} as const;

interface Misc {
  zone: string;
  offset: number;
  language: string;
  cores: number;
  memory: number | null;
  cookies: boolean;
}

function detectMisc(): Misc {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  let offset = -new Date().getTimezoneOffset();
  try {
    offset = tzOffsetMinutes(zone, new Date());
  } catch {
    /* keep the Date offset */
  }
  const mem = nav().deviceMemory;
  return {
    zone,
    offset,
    language: navigator.language || "",
    cores: navigator.hardwareConcurrency || 0,
    memory: typeof mem === "number" && mem > 0 ? mem : null,
    cookies: navigator.cookieEnabled,
  };
}

function Item({ locale, label, value, slug }: { locale: Locale; label: string; value: string | null; slug: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 border-b border-line py-3">
      <dt>
        <Link href={`/${locale}/${slug}`} className="text-[13px] text-fg-3 hover:text-accent">
          {label}
        </Link>
      </dt>
      <dd className="text-[17px] font-semibold break-words text-fg">{value ?? <Pending locale={locale} />}</dd>
    </div>
  );
}

export default function Summary({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const u = useDetected(detectUa);
  const m = useDetected(detectMisc);
  const s = useSyncExternalStore(screenStore.subscribe, screenStore.getSnapshot, screenStore.getServerSnapshot);
  const v = useSyncExternalStore(viewportStore.subscribe, viewportStore.getSnapshot, viewportStore.getServerSnapshot);
  const phys = s ? physicalSize(s.cssW, s.cssH, s.dpr) : null;
  const rn = phys ? resolutionName(phys.w, phys.h) : null;

  const items: { slug: string; label: string; value: string | null }[] = [
    { slug: "what-is-my-browser", label: t.browser, value: u ? [u.browser.name, u.browser.version].filter(Boolean).join(" ") || c.unknown : null },
    { slug: "what-is-my-os", label: t.os, value: u ? (u.os.label ?? c.unknown) : null },
    { slug: "what-is-my-device", label: t.device, value: u ? t.types[u.deviceType] : null },
    { slug: "32-or-64-bit", label: t.bits, value: u ? (u.bitness.os ? t.bits64(u.bitness.os) : c.unknown) : null },
    {
      slug: "screen-resolution",
      label: t.screen,
      value: phys && rn && s ? `${dims(phys.w, phys.h)} (${rn.name}), DPR ${formatNumber(locale, s.dpr, { maximumFractionDigits: 3 })}` : null,
    },
    { slug: "viewport-size", label: t.viewport, value: v ? dims(v.innerW, v.innerH) : null },
    { slug: "what-is-my-timezone", label: t.timezone, value: m ? `${m.zone} (${utcLabel(m.offset)})` : null },
    { slug: "browser-language", label: t.language, value: m ? m.language || c.unknown : null },
    { slug: "cpu-cores", label: t.cpu, value: m ? (m.cores ? String(m.cores) : c.notAvailable) : null },
    { slug: "how-much-ram", label: t.memory, value: m ? (m.memory ? `${m.memory === 8 || m.memory >= 32 ? "≥" : "≈"} ${formatNumber(locale, m.memory)} ${t.gb}` : c.notAvailable) : null },
    { slug: "are-cookies-enabled", label: t.cookies, value: m ? (m.cookies ? t.enabled : t.disabled) : null },
    { slug: "is-javascript-enabled", label: t.js, value: m ? t.jsOn : null },
  ];
  const ready = items.every((x) => x.value !== null);
  const report = ready ? items.map((x) => `${x.label}: ${x.value}`).join("\n") : "";

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-2 sm:px-7">
        <h2 className="text-lg font-semibold text-fg">{t.title}</h2>
        <CopyButton value={report} label={t.copyAll} copiedLabel={c.copied} variant="primary" size="md" />
      </div>
      {/* The viewport row changes on resize, so the list is not a live region. */}
      <dl className="grid px-5 pb-2 sm:grid-cols-2 sm:gap-x-10 sm:px-7">
        {items.map((x) => (
          <Item key={x.slug} locale={locale} label={x.label} value={x.value} slug={x.slug} />
        ))}
      </dl>
      <p className="px-5 py-3 text-[13px] text-fg-3 sm:px-7">{c.local}</p>
      <noscript>
        <p className="border-t border-line bg-warn-soft px-5 py-3 text-sm text-warn sm:px-7">{c.noscript}</p>
      </noscript>
    </Panel>
  );
}
