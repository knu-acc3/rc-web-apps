"use client";

import { plural } from "@/i18n/format";
import type { ToolProps } from "../../types";
import { CopyButton } from "@/ui/copy-button";
import { Panel } from "@/ui/panel";
import { isReducedUa } from "./lib/ua";
import { detectUa, useDetected } from "./lib/probe";
import { COMMON, Facts, Hint, Stack, YesNo } from "./ui/kit";

const T = {
  ru: {
    label: "Ваш User-Agent",
    parsed: "Что содержит строка",
    browser: "Браузер",
    engine: "Движок",
    os: "ОС (по строке)",
    device: "Устройство",
    cpu: "Архитектура процессора",
    reduced: "Сокращённый (замороженный) UA",
    length: "Длина строки",
    chars: ["символ", "символа", "символов"],
    hints: "Client Hints (navigator.userAgentData)",
    noHints: "Этот браузер не поддерживает User-Agent Client Hints — так ведут себя Firefox и Safari. Всё, что сайт знает о браузере, — строка выше.",
    notInUa: "не указано",
  },
  en: {
    label: "Your User-Agent",
    parsed: "What the string contains",
    browser: "Browser",
    engine: "Engine",
    os: "OS (from the string)",
    device: "Device",
    cpu: "CPU architecture",
    reduced: "Reduced (frozen) UA",
    length: "String length",
    chars: ["character", "characters"],
    hints: "Client Hints (navigator.userAgentData)",
    noHints: "This browser doesn't support User-Agent Client Hints (Firefox and Safari don't). The string above is everything a site learns about the browser.",
    notInUa: "not specified",
  },
} as const;

const join = (...xs: (string | undefined | null)[]) => xs.filter(Boolean).join(" ");

export default function UserAgentInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const u = useDetected(detectUa);
  const p = u?.parsed;
  return (
    <Stack>
      <Panel className="px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <p className="pt-1 text-sm text-fg-3">{t.label}</p>
          {u ? <CopyButton value={u.ua} label={c.copy} copiedLabel={c.copied} size="sm" variant="ghost" className="-mr-2 -mt-1" compact /> : null}
        </div>
        <p aria-live="polite" className="mt-2 min-h-14 font-mono text-lg leading-relaxed break-words [overflow-wrap:anywhere] text-fg sm:text-xl">
          {u ? u.ua || "—" : <span className="font-sans text-fg-3">{c.detecting}</span>}
        </p>
        <noscript>
          <p className="mt-4 rounded-[0.625rem] bg-warn-soft px-4 py-3 text-sm text-warn">{c.noscript}</p>
        </noscript>
      </Panel>
      <Facts
        locale={locale}
        title={t.parsed}
        rows={[
          { k: t.browser, v: p ? join(p.browser?.name, p.browser?.version) || t.notInUa : null },
          { k: t.engine, v: p ? join(p.engine?.name, p.engine?.version) || t.notInUa : null },
          { k: t.os, v: p ? join(p.os?.name, p.os?.version) || t.notInUa : null },
          { k: t.device, v: p ? join(p.device?.vendor, p.device?.model, p.device?.type ? `(${p.device.type})` : null) || t.notInUa : null },
          { k: t.cpu, v: p ? (p.cpu?.architecture ?? t.notInUa) : null },
          { k: t.reduced, v: u ? <YesNo locale={locale} value={isReducedUa(u.ua)} /> : null },
          { k: t.length, v: u ? `${u.ua.length} ${plural(locale, u.ua.length, t.chars)}` : null },
        ]}
      />
      {u?.hintsRaw ? (
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-fg-2 hover:text-fg">{t.hints}</summary>
          <pre className="mt-2 overflow-x-auto rounded-[0.625rem] bg-surface-2 px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-fg">
            {JSON.stringify(u.hintsRaw, null, 2)}
          </pre>
        </details>
      ) : u ? (
        <Hint>{t.noHints}</Hint>
      ) : null}
    </Stack>
  );
}
