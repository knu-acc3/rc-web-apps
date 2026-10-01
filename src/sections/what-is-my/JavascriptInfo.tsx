"use client";

import { Check, X } from "lucide-react";
import type { ToolProps } from "../types";
import { detectEs, ES_FEATURES, esLevel } from "./lib/features";
import { jsEngine } from "./lib/ua";
import { detectUa, useDetected } from "./lib/probe";
import { COMMON, Facts, Hero, Pending, Stack } from "./ui/kit";

const T = {
  ru: {
    label: "JavaScript в вашем браузере",
    yes: "Да, JavaScript включён",
    no: "Нет, JavaScript отключён",
    noscript: "Инструкции, как включить JavaScript в Chrome, Firefox, Safari, Edge и Яндекс Браузере, — ниже на странице.",
    sub: (engine: string | null, level: string | null) => [engine ? `движок ${engine}` : null, level ? `поддержка до ${level}` : null].filter(Boolean).join(" · "),
    engine: "JavaScript-движок",
    browser: "Браузер",
    level: "Версия ECMAScript (полная поддержка)",
    count: "Проверенные возможности языка",
    of: "из",
    wasm: "WebAssembly",
    table: "Возможности ECMAScript",
    edition: "Редакция",
    feature: "Возможность",
    support: "Есть",
    newer: "новее",
  },
  en: {
    label: "JavaScript in your browser",
    yes: "Yes, JavaScript is enabled",
    no: "No, JavaScript is disabled",
    noscript: "Instructions for enabling JavaScript in Chrome, Firefox, Safari and Edge are further down this page.",
    sub: (engine: string | null, level: string | null) => [engine ? `${engine} engine` : null, level ? `supports up to ${level}` : null].filter(Boolean).join(" · "),
    engine: "JavaScript engine",
    browser: "Browser",
    level: "ECMAScript version (full support)",
    count: "Language features checked",
    of: "of",
    wasm: "WebAssembly",
    table: "ECMAScript features",
    edition: "Edition",
    feature: "Feature",
    support: "Supported",
    newer: "newer",
  },
} as const;

interface JsData {
  es: Record<string, boolean>;
  level: number | null;
  wasm: boolean;
}

function detectJs(): JsData {
  const es = detectEs();
  return { es, level: esLevel(ES_FEATURES, es), wasm: typeof WebAssembly === "object" };
}

export default function JavascriptInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const d = useDetected(detectJs);
  const u = useDetected(detectUa);
  const engine = u ? jsEngine(u.parsed.engine?.name) : null;
  const level = d?.level ? `ES${d.level}` : null;
  const ok = d ? Object.values(d.es).filter(Boolean).length : 0;
  return (
    <Stack>
      {/* With scripts off, the placeholder is hidden and the <noscript> answer shows instead. */}
      <noscript>
        <style>{".wim-js-pending{display:none}"}</style>
      </noscript>
      <Hero
        locale={locale}
        label={t.label}
        value={
          d ? (
            <span className="text-ok">{t.yes}</span>
          ) : (
            <>
              <span className="wim-js-pending text-fg-3">{c.detecting}</span>
              <noscript>
                <span className="text-err">{t.no}</span>
              </noscript>
            </>
          )
        }
        sub={d ? t.sub(engine, level) || undefined : undefined}
        noscript={t.noscript}
      />
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.engine, v: u ? (engine ?? c.unknown) : null },
          { k: t.browser, v: u ? [u.browser.name, u.browser.version].filter(Boolean).join(" ") || c.unknown : null },
          { k: t.level, v: d ? (level ?? c.unknown) : null },
          { k: t.count, v: d ? `${ok} ${t.of} ${ES_FEATURES.length}` : null },
          { k: t.wasm, v: d ? (d.wasm ? c.supported : c.notSupported) : null },
        ]}
      />
      <section>
        <h2 className="mb-2.5 text-base font-semibold text-fg">{t.table}</h2>
        <div tabIndex={0} className="tbl">
          <table>
            <thead>
              <tr>
                <th scope="col">{t.edition}</th>
                <th scope="col">{t.feature}</th>
                <th scope="col">{t.support}</th>
              </tr>
            </thead>
            <tbody>
              {ES_FEATURES.map((f) => (
                <tr key={f.id}>
                  <td className="whitespace-nowrap">{f.year ? `ES${f.year}` : `ES2026+ (${t.newer})`}</td>
                  <td className="font-mono text-[0.8125rem]">{f.name}</td>
                  <td>
                    {d ? (
                      d.es[f.id] ? (
                        <span className="inline-flex items-center gap-1 text-ok">
                          <Check className="size-4" aria-hidden /> {c.yes}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-fg-3">
                          <X className="size-4" aria-hidden /> {c.no}
                        </span>
                      )
                    ) : (
                      <Pending locale={locale} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Stack>
  );
}
