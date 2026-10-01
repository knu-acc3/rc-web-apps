"use client";

import type { ToolProps } from "../../types";
import type { BitnessInfo as Bitness } from "./lib/ua";
import { detectUa, useDetected } from "./lib/probe";
import { COMMON, Facts, Hero, Hint, sourceLabel, Stack } from "./ui/kit";

const T = {
  ru: {
    label: "Разрядность вашей системы",
    os: "Операционная система",
    browser: "Браузер",
    arch: "Архитектура процессора",
    token: "Признак в User-Agent / platform",
    bit: (n: number) => `${n}-битная`,
    browserBit: (n: number) => `${n}-битный`,
    osValue: (n: number) => `${n}-битная система`,
    sub: (b: Bitness) => [b.browser ? `браузер ${b.browser}-битный` : null, archName(b, "ru")].filter(Boolean).join(" · "),
    unknownValue: "Браузер не сообщает",
    wow: "У вас 32-битный браузер на 64-битной Windows. Установите 64-битную версию: она быстрее, стабильнее и получает больше защитных механизмов.",
    unknownHint:
      "Этот браузер не раскрывает разрядность. Посмотрите в системе: Windows — «Параметры → Система → О системе → Тип системы»; Android — в приложениях вроде CPU-Z или в «Настройки → О телефоне»; Linux — команда uname -m.",
    mac: "Все версии macOS начиная с 10.15 Catalina и все iOS начиная с 11 — только 64-битные. Браузеры на Mac с Apple Silicon по-прежнему пишут «Intel» в User-Agent, поэтому архитектура не указана.",
  },
  en: {
    label: "Your system bitness",
    os: "Operating system",
    browser: "Browser",
    arch: "CPU architecture",
    token: "User-Agent / platform token",
    bit: (n: number) => `${n}-bit`,
    browserBit: (n: number) => `${n}-bit`,
    osValue: (n: number) => `${n}-bit system`,
    sub: (b: Bitness) => [b.browser ? `${b.browser}-bit browser` : null, archName(b, "en")].filter(Boolean).join(" · "),
    unknownValue: "Not reported by the browser",
    wow: "You're running a 32-bit browser on 64-bit Windows. Install the 64-bit build: it's faster, more stable and gets more security hardening.",
    unknownHint:
      "This browser doesn't reveal bitness. Check the system: Windows — Settings → System → About → System type; Android — an app like CPU-Z or Settings → About phone; Linux — run uname -m.",
    mac: "Every macOS since 10.15 Catalina and every iOS since 11 is 64-bit only. Browsers on Apple Silicon Macs still say “Intel” in the User-Agent, so the architecture is not shown.",
  },
} as const;

function archName(b: Bitness, locale: "ru" | "en"): string | null {
  if (!b.arch) return null;
  if (b.arch === "x86") return b.os === 64 ? "x86-64 (Intel / AMD)" : "x86 (Intel / AMD)";
  return b.os === 64 ? "ARM64" : locale === "ru" ? "ARM (32-бит)" : "ARM (32-bit)";
}

export default function BitnessInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const u = useDetected(detectUa);
  const b = u?.bitness;
  return (
    <Stack>
      <Hero
        locale={locale}
        label={t.label}
        value={b ? (b.os ? t.osValue(b.os) : t.unknownValue) : null}
        sub={b ? t.sub(b) || undefined : undefined}
        copy={b?.os ? [t.osValue(b.os), t.sub(b)].filter(Boolean).join(", ") : undefined}
      />
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.os, v: b ? (b.os ? t.bit(b.os) : c.unknown) : null },
          { k: t.browser, v: b ? (b.browser ? t.browserBit(b.browser) : c.unknown) : null },
          { k: t.arch, v: b ? (archName(b, locale) ?? c.unknown) : null },
          { k: c.source, v: b ? sourceLabel(c, b.source) : null },
          ...(b?.token ? [{ k: t.token, v: b.token, mono: true }] : []),
        ]}
      />
      {b && b.os === 64 && b.browser === 32 ? <Hint tone="warn">{t.wow}</Hint> : null}
      {b && !b.os ? <Hint>{t.unknownHint}</Hint> : null}
      {u && b?.source === "platform" && /Mac/.test(u.ua) && !/iPhone|iPad/.test(u.ua) ? <Hint>{t.mac}</Hint> : null}
    </Stack>
  );
}
