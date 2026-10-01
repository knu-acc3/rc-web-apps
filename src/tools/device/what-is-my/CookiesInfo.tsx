"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { formatBytes } from "@/i18n/format";
import { Button } from "@/ui/button";
import type { ToolProps } from "../../types";
import { storageWorks, useDetected } from "./lib/probe";
import { COMMON, Facts, Hero, Hint, Stack, YesNo } from "./ui/kit";

const T = {
  ru: {
    label: "Файлы cookie в вашем браузере",
    enabled: "Cookie включены",
    blocked: "Cookie заблокированы",
    blockedSite: "Cookie заблокированы для этого сайта",
    sub: "тестовый cookie записан, прочитан и сразу удалён",
    subBlocked: "тестовый cookie не удалось записать",
    flag: "navigator.cookieEnabled",
    test: "Запись и чтение тестового cookie",
    local: "localStorage",
    session: "sessionStorage",
    idb: "IndexedDB",
    quota: "Место для данных сайта",
    quotaValue: (used: string, total: string) => `занято ${used} из ${total}`,
    persisted: "Постоянное хранилище",
    persistedYes: "да (браузер не удалит данные сам)",
    persistedNo: "нет (при нехватке места данные могут быть удалены)",
    again: "Проверить снова",
    blockedHint:
      "Cookie отключены. Во многих сайтах перестанут работать вход, корзина и настройки. Как включить их в вашем браузере — в инструкции ниже.",
    storageHint: "Cookie работают, но локальное хранилище недоступно — так бывает в приватном режиме некоторых браузеров или при запрете «данных сайтов».",
  },
  en: {
    label: "Cookies in your browser",
    enabled: "Cookies are enabled",
    blocked: "Cookies are blocked",
    blockedSite: "Cookies are blocked for this site",
    sub: "a test cookie was written, read back and deleted",
    subBlocked: "a test cookie could not be written",
    flag: "navigator.cookieEnabled",
    test: "Test cookie write & read",
    local: "localStorage",
    session: "sessionStorage",
    idb: "IndexedDB",
    quota: "Storage available to sites",
    quotaValue: (used: string, total: string) => `${used} used of ${total}`,
    persisted: "Persistent storage",
    persistedYes: "yes (the browser won't evict data on its own)",
    persistedNo: "no (data may be evicted when space runs low)",
    again: "Test again",
    blockedHint: "Cookies are off. Sign-in, shopping carts and preferences will break on many sites. See the instructions below to enable them in your browser.",
    storageHint: "Cookies work, but local storage is unavailable — this happens in some browsers' private mode or when “site data” is blocked.",
  },
} as const;

interface StorageData {
  flag: boolean;
  cookie: boolean;
  local: boolean;
  session: boolean;
  idb: boolean | null;
  usage: number | null;
  quota: number | null;
  persisted: boolean | null;
}

function testCookie(): boolean {
  try {
    const name = "wim_cookie_test";
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=1; path=/; max-age=60; SameSite=Lax${secure}`;
    const ok = document.cookie.split(/;\s*/).includes(`${name}=1`);
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secure}`;
    return ok;
  } catch {
    return false;
  }
}

function testIdb(): Promise<boolean | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(false);
  const name = "wim-idb-test";
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: boolean | null) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    const timer = setTimeout(() => done(null), 3000);
    try {
      const req = indexedDB.open(name, 1);
      req.onsuccess = () => {
        clearTimeout(timer);
        req.result.close();
        indexedDB.deleteDatabase(name);
        done(true);
      };
      req.onerror = () => {
        clearTimeout(timer);
        done(false);
      };
    } catch {
      clearTimeout(timer);
      done(false);
    }
  });
}

async function detectStorage(): Promise<StorageData> {
  const flag = navigator.cookieEnabled;
  const cookie = testCookie();
  const idb = await testIdb();
  let usage: number | null = null;
  let quota: number | null = null;
  let persisted: boolean | null = null;
  try {
    const est = await navigator.storage?.estimate?.();
    usage = est?.usage ?? null;
    quota = est?.quota ?? null;
    persisted = (await navigator.storage?.persisted?.()) ?? null;
  } catch {
    /* StorageManager unavailable */
  }
  return { flag, cookie, local: storageWorks("localStorage"), session: storageWorks("sessionStorage"), idb, usage, quota, persisted };
}

export default function CookiesInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const [nonce, setNonce] = useState(0);
  const d = useDetected(detectStorage, nonce);
  const status = d ? (d.cookie ? t.enabled : d.flag ? t.blockedSite : t.blocked) : null;
  return (
    <Stack>
      <Hero
        locale={locale}
        label={t.label}
        value={status ? <span className={d?.cookie ? "text-ok" : "text-err"}>{status}</span> : null}
        sub={d ? (d.cookie ? t.sub : t.subBlocked) : undefined}
      >
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setNonce((x) => x + 1)} disabled={!d}>
          <RefreshCw aria-hidden />
          {t.again}
        </Button>
      </Hero>
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.flag, v: d ? <YesNo locale={locale} value={d.flag} yes="true" no="false" /> : null },
          { k: t.test, v: d ? <YesNo locale={locale} value={d.cookie} /> : null },
          { k: t.local, v: d ? <YesNo locale={locale} value={d.local} /> : null },
          { k: t.session, v: d ? <YesNo locale={locale} value={d.session} /> : null },
          { k: t.idb, v: d ? (d.idb === null ? c.unknown : <YesNo locale={locale} value={d.idb} />) : null },
          { k: t.quota, v: d ? (d.quota ? t.quotaValue(formatBytes(locale, d.usage ?? 0), formatBytes(locale, d.quota)) : c.notAvailable) : null },
          { k: t.persisted, v: d ? (d.persisted === null ? c.notAvailable : d.persisted ? t.persistedYes : t.persistedNo) : null },
        ]}
      />
      {d && !d.cookie ? <Hint tone="warn">{t.blockedHint}</Hint> : null}
      {d && d.cookie && (!d.local || d.idb === false) ? <Hint>{t.storageHint}</Hint> : null}
    </Stack>
  );
}
