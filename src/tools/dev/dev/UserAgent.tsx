"use client";

import { useEffect, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Field, Textarea } from "@/ui/field";
import { Badge, Panel } from "@/ui/panel";
import { ScrollRow } from "@/ui/scroll-row";
import { detectBot, type BotKind } from "./data/bots";
import { UA_EXAMPLES } from "./data/ua-examples";

const T = {
  ru: {
    ua: "Строка User-Agent",
    examples: "Примеры",
    browser: "Браузер",
    engine: "Движок",
    os: "ОС",
    device: "Устройство",
    cpu: "Процессор",
    desktop: "компьютер",
    bot: "Бот",
    kinds: { search: "поисковый робот", social: "превью для соцсетей и мессенджеров", seo: "SEO-сервис", ai: "ИИ-краулер", headless: "автоматизированный браузер", http: "HTTP-клиент / скрипт", monitor: "мониторинг" } as Record<BotKind, string>,
    notBot: "похоже на обычный браузер",
    spoof: "User-Agent легко подделать — окончательно бота определяют по IP и обратному DNS.",
    yours: "Ваш браузер",
    yoursHint: "Строка User-Agent и Client Hints вашего браузера — показаны отдельно и не смешиваются с вставленной строкой.",
    hints: "Client Hints",
    notSupported: "не поддерживаются этим браузером",
    loading: "Загрузка…",
    use: "Разобрать эту строку",
  },
  en: {
    ua: "User-Agent string",
    examples: "Examples",
    browser: "Browser",
    engine: "Engine",
    os: "OS",
    device: "Device",
    cpu: "CPU",
    desktop: "desktop",
    bot: "Bot",
    kinds: { search: "search engine crawler", social: "social / messenger preview", seo: "SEO service", ai: "AI crawler", headless: "automated browser", http: "HTTP client / script", monitor: "monitoring" } as Record<BotKind, string>,
    notBot: "looks like a regular browser",
    spoof: "User-Agent strings are easy to fake — real bot checks use IP and reverse DNS.",
    yours: "Your browser",
    yoursHint: "Your browser's User-Agent and Client Hints — shown separately and never mixed into the pasted string.",
    hints: "Client Hints",
    notSupported: "not supported by this browser",
    loading: "Loading…",
    use: "Parse this string",
  },
} as const;


interface Parsed {
  browser: string;
  engine: string;
  os: string;
  device: string;
  cpu: string;
}

type Parser = (ua: string) => Parsed;

function useParser(): Parser | null {
  const [p, setP] = useState<Parser | null>(null);
  useEffect(() => {
    let alive = true;
    import("ua-parser-js").then((m) => {
      const UAParser = (m.default ?? m) as unknown as new (ua?: string) => { getResult(): { browser: { name?: string; version?: string }; engine: { name?: string; version?: string }; os: { name?: string; version?: string }; device: { vendor?: string; model?: string; type?: string }; cpu: { architecture?: string } } };
      const fn: Parser = (ua) => {
        const r = new UAParser(ua).getResult();
        const j = (...a: (string | undefined)[]) => a.filter(Boolean).join(" ");
        return { browser: j(r.browser.name, r.browser.version), engine: j(r.engine.name, r.engine.version), os: j(r.os.name, r.os.version), device: j(r.device.vendor, r.device.model, r.device.type ? `(${r.device.type})` : undefined), cpu: r.cpu.architecture ?? "" };
      };
      if (alive) setP(() => fn);
    });
    return () => {
      alive = false;
    };
  }, []);
  return p;
}

interface Mine {
  ua: string;
  hints?: Record<string, string>;
}

export default function UserAgent({ locale, sample }: { locale: Locale; sample: string }) {
  const t = T[locale];
  const id = useId();
  const [ua, setUa] = useState(sample);
  const parser = useParser();
  const [mine, setMine] = useState<Mine | null>(null);

  useEffect(() => {
    let alive = true;
    const nav = navigator as Navigator & { userAgentData?: { brands: { brand: string; version: string }[]; platform: string; mobile: boolean; getHighEntropyValues(k: string[]): Promise<Record<string, unknown>> } };
    const base: Mine = { ua: navigator.userAgent };
    const d = nav.userAgentData;
    if (!d) {
      Promise.resolve().then(() => alive && setMine(base));
    } else {
      d.getHighEntropyValues(["platformVersion", "architecture", "model", "fullVersionList", "bitness"]).then(
        (h) => {
          if (!alive) return;
          const list = (h.fullVersionList as { brand: string; version: string }[] | undefined) ?? d.brands;
          setMine({
            ...base,
            hints: {
              brands: list.filter((b) => !/Not.?A.?Brand/i.test(b.brand)).map((b) => `${b.brand} ${b.version}`).join(", "),
              platform: [d.platform, h.platformVersion].filter(Boolean).join(" "),
              mobile: String(d.mobile),
              ...(h.model ? { model: String(h.model) } : {}),
              ...(h.architecture ? { architecture: `${h.architecture}${h.bitness ? ` ${h.bitness}-bit` : ""}` } : {}),
            },
          });
        },
        () => alive && setMine(base),
      );
    }
    return () => {
      alive = false;
    };
  }, []);

  const res = parser && ua.trim() ? parser(ua.trim()) : null;
  const bot = ua.trim() ? detectBot(ua.trim()) : null;

  const table = (p: Parsed | null) =>
    p && (
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[9rem_1fr]">
        {(
          [
            [t.browser, p.browser],
            [t.engine, p.engine],
            [t.os, p.os],
            [t.device, p.device || t.desktop],
            [t.cpu, p.cpu],
          ] as [string, string][]
        )
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-sm text-fg-3">{k}</dt>
              <dd className="font-medium text-fg">{v}</dd>
            </div>
          ))}
      </dl>
    );

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Panel className="min-w-0 p-4 sm:p-6">
        <Field label={t.ua} htmlFor={`${id}-ua`}>
          <Textarea id={`${id}-ua`} value={ua} onChange={(e) => setUa(e.target.value)} rows={3} className="min-h-0!" />
        </Field>
        <ScrollRow label={t.examples} className="mt-2" rowClassName="gap-2">
          {UA_EXAMPLES.map(([n, v]) => (
            <button key={n} type="button" aria-pressed={ua.trim() === v} className="chip shrink-0" onClick={() => setUa(v)}>
              {n}
            </button>
          ))}
        </ScrollRow>
        {ua.trim() && (
          <div className="mt-5 flex flex-col gap-4" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              {bot ? <Badge tone="warn" className="text-sm!">{`${t.bot}: ${bot.name} — ${t.kinds[bot.kind]}`}</Badge> : <Badge tone="ok" className="text-sm!">{t.notBot}</Badge>}
            </div>
            {res ? table(res) : <p className="text-sm text-fg-3">{t.loading}</p>}
            {bot && <p className="text-[0.8125rem] text-fg-3">{t.spoof}</p>}
          </div>
        )}
      </Panel>

      <Panel className="min-w-0 p-4 sm:p-6">
        <h2 className="text-base font-semibold text-fg">{t.yours}</h2>
        <p className="mt-1 text-[0.8125rem] text-fg-3">{t.yoursHint}</p>
        {mine && (
          <>
            <code className="mt-3 block rounded-[1rem] bg-surface-2 px-4 py-3 font-mono text-[0.8125rem] break-all text-fg">{mine.ua}</code>
            <div className="mt-3">{parser && table(parser(mine.ua))}</div>
            <div className="mt-3 text-sm">
              <span className="text-fg-3">{t.hints}: </span>
              {mine.hints ? (
                <span className="text-fg">
                  {Object.entries(mine.hints)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </span>
              ) : (
                <span className="text-fg-2">{t.notSupported}</span>
              )}
            </div>
            <Button variant="tonal" size="sm" className="mt-4" onClick={() => setUa(mine.ua)}>
              {t.use}
            </Button>
          </>
        )}
      </Panel>
    </div>
  );
}
