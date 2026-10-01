"use client";

import { formatBytes, formatNumber } from "@/i18n/format";
import type { ToolProps } from "../../types";
import { detectUa, nav, useDetected } from "./lib/probe";
import { COMMON, Facts, Hero, Hint, Stack } from "./ui/kit";

const T = {
  ru: {
    label: "Оперативная память по данным браузера",
    gb: "ГБ",
    sub: "приблизительно: браузер округляет объём до степени двойки",
    na: "Браузер не сообщает",
    api: "navigator.deviceMemory",
    heap: "Лимит памяти JavaScript на вкладку",
    used: "Занято JavaScript на этой вкладке",
    browser: "Браузер",
    notChromium:
      "navigator.deviceMemory есть только в браузерах на Chromium (Chrome, Edge, Opera, Яндекс Браузер, Samsung Internet). Firefox и Safari не раскрывают объём памяти. Проверить его можно в системе: Windows — Диспетчер задач → Производительность → Память; macOS — меню Apple → «Об этом Mac»; Android — «Настройки → О телефоне».",
    cap: (v: string) =>
      `${v} ГБ — верхняя граница, которую сообщает Chrome, поэтому реальной памяти может быть больше. Точный объём — в Диспетчере задач или «Об этом Mac».`,
    heapNote: "Лимит JavaScript — это не объём ОЗУ, а максимум, который браузер выделяет одной вкладке (только Chromium).",
  },
  en: {
    label: "RAM as reported by the browser",
    gb: "GB",
    sub: "approximate: the browser rounds the amount to a power of two",
    na: "Not reported by the browser",
    api: "navigator.deviceMemory",
    heap: "JavaScript memory limit per tab",
    used: "JavaScript memory used on this tab",
    browser: "Browser",
    notChromium:
      "navigator.deviceMemory exists only in Chromium browsers (Chrome, Edge, Opera, Samsung Internet). Firefox and Safari don't reveal memory size. Check it in the OS: Windows — Task Manager → Performance → Memory; macOS — Apple menu → About This Mac; Android — Settings → About phone.",
    cap: (v: string) =>
      `${v} GB is the upper limit Chrome reports, so your device may have more. The exact amount is in Task Manager or About This Mac.`,
    heapNote: "The JavaScript limit is not your RAM — it's the maximum the browser gives a single tab (Chromium only).",
  },
} as const;

interface MemData {
  device: number | null;
  heapLimit: number | null;
  heapUsed: number | null;
}

function detectMemory(): MemData {
  const dm = nav().deviceMemory;
  const pm = (performance as Performance & { memory?: { jsHeapSizeLimit?: number; usedJSHeapSize?: number } }).memory;
  return {
    device: typeof dm === "number" && dm > 0 ? dm : null,
    heapLimit: typeof pm?.jsHeapSizeLimit === "number" ? pm.jsHeapSizeLimit : null,
    heapUsed: typeof pm?.usedJSHeapSize === "number" ? pm.usedJSHeapSize : null,
  };
}

export default function MemoryInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const m = useDetected(detectMemory);
  const u = useDetected(detectUa);
  const gb = m?.device ? formatNumber(locale, m.device, { maximumFractionDigits: 2 }) : null;
  // 8 GB is the classic Chrome cap, 32 GB the cap of newer desktop versions.
  const capped = !!m?.device && (m.device === 8 || m.device >= 32);
  return (
    <Stack>
      <Hero
        locale={locale}
        label={t.label}
        value={m ? (gb ? `${capped ? "≥" : "≈"} ${gb} ${t.gb}` : t.na) : null}
        sub={gb ? t.sub : undefined}
        copy={gb ? `${gb} ${t.gb}` : undefined}
      />
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.api, v: m ? (m.device !== null ? String(m.device) : "undefined") : null, mono: true },
          { k: t.browser, v: u ? (u.browser.name ?? c.unknown) : null },
          ...(m?.heapLimit ? [{ k: t.heap, v: formatBytes(locale, m.heapLimit) }] : []),
          ...(m?.heapUsed ? [{ k: t.used, v: formatBytes(locale, m.heapUsed) }] : []),
        ]}
      />
      {m && m.device === null ? <Hint>{t.notChromium}</Hint> : null}
      {capped && gb ? <Hint>{t.cap(gb)}</Hint> : null}
      {m?.heapLimit ? <Hint>{t.heapNote}</Hint> : null}
    </Stack>
  );
}
