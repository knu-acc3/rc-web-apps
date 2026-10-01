"use client";

import type { Locale } from "@/i18n/config";
import { Panel } from "@/ui/panel";
import type { ToolProps } from "../types";
import { detectUa, nav, useDetected } from "./lib/probe";
import { COMMON, Facts, Hint, Pending, Stack } from "./ui/kit";

type Signal = "on" | "off" | "unsupported";

const T = {
  ru: {
    gpc: "Global Privacy Control (GPC)",
    dnt: "Do Not Track (DNT)",
    state: { on: "Включён", off: "Выключен", unsupported: "Не поддерживается" } satisfies Record<Signal, string>,
    gpcSub: "сигнал «не продавать и не передавать мои данные»",
    dntSub: "устаревший запрос «не отслеживать»",
    navDnt: "navigator.doNotTrack",
    winDnt: "window.doNotTrack",
    navGpc: "navigator.globalPrivacyControl",
    browser: "Браузер",
    gpcOff:
      "Чтобы включить GPC: в Firefox — «Настройки → Приватность и защита → Сообщать сайтам, чтобы они не продавали и не передавали мои данные»; в Brave и DuckDuckGo он включён по умолчанию; в Chrome и Edge — только через расширения (например, Privacy Badger).",
    dntOnly: "DNT включён, но это устаревший сигнал: большинство сайтов его игнорирует, а Safari и Firefox убрали эту настройку. Надёжнее включить GPC.",
  },
  en: {
    gpc: "Global Privacy Control (GPC)",
    dnt: "Do Not Track (DNT)",
    state: { on: "On", off: "Off", unsupported: "Not supported" } satisfies Record<Signal, string>,
    gpcSub: "a “do not sell or share my data” signal",
    dntSub: "the deprecated “do not track me” request",
    navDnt: "navigator.doNotTrack",
    winDnt: "window.doNotTrack",
    navGpc: "navigator.globalPrivacyControl",
    browser: "Browser",
    gpcOff:
      "To turn on GPC: in Firefox — Settings → Privacy & Security → Tell websites not to sell or share my data; Brave and DuckDuckGo send it by default; Chrome and Edge only via extensions (for example, Privacy Badger).",
    dntOnly: "DNT is on, but it's deprecated: most sites ignore it, and Safari and Firefox removed the setting. GPC is the more meaningful signal.",
  },
} as const;

interface Signals {
  dnt: Signal;
  gpc: Signal;
  rawNav: string;
  rawWin: string;
  rawGpc: string;
}

const show = (v: unknown) => (v === undefined ? "undefined" : v === null ? "null" : typeof v === "string" ? `"${v}"` : String(v));

function detectSignals(): Signals {
  const n = nav();
  const w = window as Window & { doNotTrack?: string | null };
  // null means "supported, but not set" (Chrome); a missing property means the browser dropped DNT (Safari).
  const no = n as unknown as Record<string, unknown>;
  const wo = w as unknown as Record<string, unknown>;
  const inNav = "doNotTrack" in no;
  const inWin = "doNotTrack" in wo;
  const inMs = "msDoNotTrack" in no;
  const raw = inNav ? no.doNotTrack : inWin ? wo.doNotTrack : inMs ? no.msDoNotTrack : undefined;
  const dnt: Signal = raw === "1" || raw === "yes" ? "on" : inNav || inWin || inMs ? "off" : "unsupported";
  const g = n.globalPrivacyControl;
  const gpc: Signal = g === true ? "on" : g === false ? "off" : "unsupported";
  return { dnt, gpc, rawNav: show(n.doNotTrack), rawWin: show(w.doNotTrack), rawGpc: show(g) };
}

function Big({ locale, title, sub, state }: { locale: Locale; title: string; sub: string; state: Signal | null }) {
  const t = T[locale];
  const tone = state === "on" ? "text-ok" : state === "off" ? "text-fg" : "text-fg-3";
  return (
    <div className="rounded-[0.625rem] bg-surface-2 px-4 py-3">
      <p className="text-sm font-medium text-fg-2">{title}</p>
      <p className={`mt-1 text-2xl font-bold sm:text-3xl ${tone}`}>{state ? t.state[state] : <Pending locale={locale} />}</p>
      <p className="mt-1 text-sm text-fg-3">{sub}</p>
    </div>
  );
}

export default function PrivacySignals({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const d = useDetected(detectSignals);
  const u = useDetected(detectUa);
  return (
    <Stack>
      <Panel className="p-4 sm:p-5">
        <div aria-live="polite" className="grid gap-3 sm:grid-cols-2">
          <Big locale={locale} title={t.gpc} sub={t.gpcSub} state={d?.gpc ?? null} />
          <Big locale={locale} title={t.dnt} sub={t.dntSub} state={d?.dnt ?? null} />
        </div>
        <noscript>
          <p className="mt-3 rounded-[0.625rem] bg-warn-soft px-4 py-3 text-sm text-warn">{c.noscript}</p>
        </noscript>
      </Panel>
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.navGpc, v: d ? d.rawGpc : null, mono: true },
          { k: t.navDnt, v: d ? d.rawNav : null, mono: true },
          { k: t.winDnt, v: d ? d.rawWin : null, mono: true },
          { k: t.browser, v: u ? [u.browser.name, u.browser.major].filter(Boolean).join(" ") || c.unknown : null },
        ]}
      />
      {d && d.gpc !== "on" ? <Hint>{t.gpcOff}</Hint> : null}
      {d && d.dnt === "on" && d.gpc !== "on" ? <Hint>{t.dntOnly}</Hint> : null}
    </Stack>
  );
}
