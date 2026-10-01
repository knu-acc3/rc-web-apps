"use client";

import { formatNumber, plural } from "@/i18n/format";
import type { ToolProps } from "../../types";
import { detectUa, useDetected } from "./lib/probe";
import { COMMON, Facts, Hero, Hint, Stack } from "./ui/kit";

const T = {
  ru: {
    label: "Логических процессоров (потоков) у вашего устройства",
    forms: ["логический процессор", "логических процессора", "логических процессоров"],
    cores: "navigator.hardwareConcurrency",
    arch: "Архитектура",
    bits: "Разрядность системы",
    physical: "Физические ядра",
    physicalValue: "браузеры не сообщают",
    browser: "Браузер",
    sub: "это потоки: при Hyper-Threading / SMT их вдвое больше, чем физических ядер",
    webkit:
      "Safari ограничивает значение, которое видят сайты (на Mac — обычно не больше 8), поэтому оно может быть меньше реального числа потоков.",
    firefox:
      "Если в Firefox включена защита privacy.resistFingerprinting (или это Tor Browser), вместо реального числа показывается фиксированное маленькое значение.",
    none: "Браузер не сообщает число процессоров (navigator.hardwareConcurrency недоступен).",
  },
  en: {
    label: "Logical processors (threads) on your device",
    forms: ["logical processor", "logical processors"],
    cores: "navigator.hardwareConcurrency",
    arch: "Architecture",
    bits: "System bitness",
    physical: "Physical cores",
    physicalValue: "not exposed by browsers",
    browser: "Browser",
    sub: "these are threads: with Hyper-Threading / SMT there are twice as many as physical cores",
    webkit: "Safari caps the value websites see (on a Mac typically at 8), so it can be lower than the real number of threads.",
    firefox: "If privacy.resistFingerprinting is on in Firefox (or this is Tor Browser), a fixed small number is reported instead of the real one.",
    none: "The browser doesn't report the processor count (navigator.hardwareConcurrency is unavailable).",
  },
} as const;

const detectCores = () => (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency > 0 ? navigator.hardwareConcurrency : 0);

export default function CpuInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const n = useDetected(detectCores);
  const u = useDetected(detectUa);
  const b = u?.bitness;
  const arch = b?.arch ? (b.arch === "arm" ? (b.os === 32 ? "ARM (32)" : "ARM64") : b.os === 32 ? "x86" : "x86-64") : null;
  const engine = u?.parsed.engine?.name;
  return (
    <Stack>
      <Hero
        locale={locale}
        label={t.label}
        value={n === null ? null : n > 0 ? formatNumber(locale, n) : c.notAvailable}
        sub={n ? `${plural(locale, n, t.forms)} — ${t.sub}` : undefined}
        copy={n ? `${n} ${plural(locale, n, t.forms)}` : undefined}
      />
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.cores, v: n === null ? null : n > 0 ? String(n) : c.notAvailable, mono: true },
          { k: t.physical, v: t.physicalValue },
          { k: t.arch, v: u ? (arch ?? c.unknown) : null },
          { k: t.bits, v: u ? (b?.os ? (locale === "ru" ? `${b.os} бит` : `${b.os}-bit`) : c.unknown) : null },
          { k: t.browser, v: u ? (u.browser.name ?? c.unknown) : null },
        ]}
      />
      {n === 0 ? <Hint>{t.none}</Hint> : null}
      {engine === "WebKit" ? <Hint>{t.webkit}</Hint> : null}
      {engine === "Gecko" ? <Hint>{t.firefox}</Hint> : null}
    </Stack>
  );
}
