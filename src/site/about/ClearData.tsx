"use client";

import { Check, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Notice, Panel } from "@/ui/panel";
import { WS_DB, wsPendingCount } from "@/tools/files/shared/workspace";

const T = {
  ru: {
    title: "Данные этого сайта на вашем устройстве",
    items: (n: number, size: string) => (n ? `Сохранено настроек и записей: ${n} (${size})` : "Сайт ничего не хранит на этом устройстве"),
    cache: (n: number) => (n ? `Сохранённых страниц для работы без интернета: ${n}` : ""),
    photos: (n: number) => (n ? `Фото, открытых в фото-инструментах этой вкладки: ${n}` : ""),
    what: "Это заметки, списки дел, счётчики, табло, избранное, недавние инструменты, настройки (тема, яркость, форматы) и фото, которые вы открыли в фото-инструментах.",
    clear: "Удалить все данные сайта",
    sure: "Точно удалить? Заметки и счётчики не восстановить",
    done: "Удалено. Страница работает как при первом открытии.",
  },
  en: {
    title: "This site's data on your device",
    items: (n: number, size: string) => (n ? `Saved settings and records: ${n} (${size})` : "The site stores nothing on this device"),
    cache: (n: number) => (n ? `Pages saved for offline use: ${n}` : ""),
    photos: (n: number) => (n ? `Photos opened in this tab's photo tools: ${n}` : ""),
    what: "These are notes, to-do lists, counters, scoreboards, favourites, recent tools, settings (theme, brightness, formats) and the photos you opened in the photo tools.",
    clear: "Delete all site data",
    sure: "Delete for sure? Notes and counters can't be restored",
    done: "Deleted. The site works as on your first visit.",
  },
} as const;

interface Usage {
  items: number;
  bytes: number;
  cached: number;
  photos: number;
}

async function measure(): Promise<Usage> {
  let items = 0;
  let bytes = 0;
  try {
    items = localStorage.length;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? "";
      bytes += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2;
    }
  } catch {
    // storage blocked
  }
  let cached = 0;
  try {
    if ("caches" in window) for (const name of await caches.keys()) cached += (await (await caches.open(name)).keys()).length;
  } catch {
    // no Cache Storage
  }
  return { items, bytes, cached, photos: wsPendingCount() };
}

const deleteDb = (name: string) =>
  new Promise((ok) => {
    try {
      const r = indexedDB.deleteDatabase(name);
      r.onsuccess = r.onerror = r.onblocked = () => ok(null);
    } catch {
      ok(null);
    }
  });

/** Wipes everything the site keeps in this browser: localStorage, sessionStorage, IndexedDB and offline copies. */
async function wipe() {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // storage blocked
  }
  // Photos kept between photo tools are deleted by name: Firefox before 126 has no indexedDB.databases().
  const names = new Set<string>([WS_DB]);
  try {
    for (const d of (await indexedDB.databases?.()) ?? []) if (d.name) names.add(d.name);
  } catch {
    // no list of databases
  }
  await Promise.all([...names].map(deleteDb));
  try {
    if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  } catch {
    // no Cache Storage
  }
}

export default function ClearData({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [usage, setUsage] = useState<Usage | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let live = true;
    void measure().then((u) => live && setUsage(u));
    return () => {
      live = false;
    };
  }, []);

  return (
    <Panel className="flex flex-col gap-3 p-4">
      <h2 className="text-lg font-semibold">{t.title}</h2>
      {usage && (
        <div className="flex flex-col gap-1 text-[0.9375rem] text-fg-2">
          <p>{t.items(usage.items, formatBytes(locale, usage.bytes))}</p>
          {usage.photos > 0 && <p>{t.photos(usage.photos)}</p>}
          {usage.cached > 0 && <p>{t.cache(usage.cached)}</p>}
        </div>
      )}
      <p className="text-sm text-fg-3">{t.what}</p>
      {done ? (
        <Notice tone="ok" className="flex items-center gap-2">
          <Check className="size-4" aria-hidden />
          {t.done}
        </Notice>
      ) : (
        <Button
          variant={confirm ? "danger" : "outline"}
          className="self-start"
          disabled={!!usage && usage.items === 0 && usage.cached === 0 && usage.photos === 0}
          onClick={async () => {
            if (!confirm) {
              setConfirm(true);
              return;
            }
            await wipe();
            setDone(true);
            setUsage(await measure());
          }}
        >
          <Trash2 aria-hidden />
          {confirm ? t.sure : t.clear}
        </Button>
      )}
    </Panel>
  );
}
