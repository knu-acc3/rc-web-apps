"use client";

import type { ToolProps } from "../types";
import { jsEngine, isReducedUa, realBrands } from "./lib/ua";
import { detectUa, useDetected } from "./lib/probe";
import { COMMON, Facts, Hero, Hint, sourceLabel, Stack } from "./ui";

const T = {
  ru: {
    label: "Ваш браузер",
    fullVersion: "Полная версия",
    name: "Браузер",
    version: "Версия",
    engine: "Движок отрисовки",
    js: "JavaScript-движок",
    os: "Операционная система",
    mobile: "Мобильная версия",
    brands: "Бренды в Client Hints",
    reduced:
      "Строка User-Agent этого браузера «заморожена» (версия вида 138.0.0.0), поэтому полная версия взята из Client Hints — они точнее.",
    uaOnly: "Браузер не поддерживает Client Hints (так ведут себя Firefox и Safari), поэтому данные взяты из строки User-Agent.",
    on: "на",
  },
  en: {
    label: "Your browser",
    fullVersion: "Full version",
    name: "Browser",
    version: "Version",
    engine: "Rendering engine",
    js: "JavaScript engine",
    os: "Operating system",
    mobile: "Mobile version",
    brands: "Client Hints brands",
    reduced: "This browser's User-Agent string is frozen (a version like 138.0.0.0), so the full version comes from Client Hints, which are more precise.",
    uaOnly: "This browser doesn't support Client Hints (Firefox and Safari don't), so the data comes from the User-Agent string.",
    on: "on",
  },
} as const;

export default function BrowserInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const u = useDetected(detectUa);
  const b = u?.browser;
  const engineName = u?.parsed.engine?.name ?? null;
  // Blink's version equals the Chromium version; prefer the full one from hints.
  const chromium = realBrands(u?.hints).find((x) => x.brand === "Chromium")?.version;
  const engineVer = engineName === "Blink" ? (chromium ?? u?.browser.major ?? null) : (u?.parsed.engine?.version ?? null);
  const engine = engineName ? `${engineName}${engineVer ? ` ${engineVer}` : ""}` : null;
  const title = b?.name ? `${b.name}${b.major ? ` ${b.major}` : ""}` : null;

  const copy = u && b?.name ? `${b.name} ${b.version ?? ""}`.trim() + (engine ? ` (${engine})` : "") + (u.os.label ? ` ${t.on} ${u.os.label}` : "") : undefined;

  return (
    <Stack>
      <Hero
        locale={locale}
        label={t.label}
        value={
          u ? (
            title ? (
              <>
                {title}
                {u.os.label ? <span className="font-semibold text-fg-3"> {t.on} {u.os.label}</span> : null}
              </>
            ) : (
              c.unknown
            )
          ) : null
        }
        sub={b?.version ? `${t.fullVersion}: ${b.version}` : undefined}
        copy={copy}
      />
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.name, v: u ? (b?.name ?? c.unknown) : null },
          { k: t.version, v: u ? (b?.version ?? c.unknown) : null, mono: true },
          { k: t.engine, v: u ? (engine ?? c.unknown) : null },
          { k: t.js, v: u ? (jsEngine(engineName) ?? c.unknown) : null },
          { k: t.os, v: u ? (u.os.label ?? c.unknown) : null },
          { k: t.mobile, v: u ? (u.deviceType === "mobile" || u.hints?.mobile ? c.yes : c.no) : null },
          { k: c.source, v: u ? sourceLabel(c, b?.source ?? null) : null },
          ...(u?.hints ? [{ k: t.brands, v: realBrands(u.hints).map((x) => `${x.brand} ${x.version}`).join(", ") || "—", mono: true }] : []),
        ]}
      />
      {u && (u.hints ? isReducedUa(u.ua) && <Hint>{t.reduced}</Hint> : <Hint>{t.uaOnly}</Hint>)}
    </Stack>
  );
}
