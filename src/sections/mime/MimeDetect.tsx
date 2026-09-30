"use client";

import Link from "@/ui/link";
import { useCallback, useState } from "react";
import { href, type Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Badge } from "@/ui/panel";
import { hexPreview, sniff, type Detected } from "./sniff";

interface Result {
  key: string;
  name: string;
  size: number;
  claimedExt: string;
  browserType: string;
  hex: string;
  det: Detected | null;
}

const T = {
  ru: {
    drop: "Перетащите файлы или нажмите, чтобы выбрать",
    hint: "Файлы не загружаются на сервер: читаются только первые и последние 64 КБ прямо в браузере",
    unknown: "Формат не распознан",
    unknownHint: "Сигнатура не похожа ни на один известный формат. Это может быть зашифрованный или повреждённый файл либо редкий формат.",
    detected: "Определено по содержимому",
    browser: "Тип от браузера (по расширению)",
    none: "не указан",
    ext: "Расширение",
    match: "расширение совпадает",
    mismatch: "расширение не совпадает",
    noExt: "без расширения",
    maybe: "похоже на",
    first: "Первые байты",
    clear: "Очистить",
    more: "Подробнее о формате",
    medium: "по контейнеру — точный подтип может отличаться",
  },
  en: {
    drop: "Drop files here or click to choose",
    hint: "Nothing is uploaded: only the first and last 64 KB are read, right in your browser",
    unknown: "Format not recognised",
    unknownHint: "The signature doesn't match any known format. The file may be encrypted, damaged or in a rare format.",
    detected: "Detected from content",
    browser: "Browser type (from the extension)",
    none: "none",
    ext: "Extension",
    match: "extension matches",
    mismatch: "extension doesn't match",
    noExt: "no extension",
    maybe: "looks like",
    first: "First bytes",
    clear: "Clear",
    more: "About this format",
    medium: "by container — the exact subtype may differ",
  },
} as const;

const CHUNK = 65536;

export default function MimeDetect({ locale, known }: { locale: Locale; known: string[] }) {
  const t = T[locale];
  const [results, setResults] = useState<Result[]>([]);
  const knownSet = new Set(known);

  const onFiles = useCallback(async (files: File[]) => {
    const out: Result[] = [];
    for (const f of files) {
      const head = new Uint8Array(await f.slice(0, CHUNK).arrayBuffer());
      const tail = f.size > CHUNK ? new Uint8Array(await f.slice(Math.max(CHUNK, f.size - CHUNK)).arrayBuffer()) : undefined;
      const dot = f.name.lastIndexOf(".");
      out.push({
        key: `${f.name}-${f.size}-${f.lastModified}`,
        name: f.name,
        size: f.size,
        claimedExt: dot > 0 ? f.name.slice(dot + 1).toLowerCase() : "",
        browserType: f.type,
        hex: hexPreview(head),
        det: sniff(head, tail),
      });
    }
    setResults((prev) => [...out, ...prev].slice(0, 30));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Dropzone onFiles={onFiles} multiple title={t.drop} hint={t.hint} />
      {results.length > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setResults([])}>
            {t.clear}
          </Button>
        </div>
      )}
      <ul className="flex flex-col gap-3" aria-live="polite">
        {results.map((r) => {
          const d = r.det;
          const all = d ? [d.ext, ...(d.alt ?? [])] : [];
          const matches = !!d && !!r.claimedExt && (all.includes(r.claimedExt) || (r.claimedExt === "jpeg" && d.ext === "jpg") || (r.claimedExt === "tiff" && d.ext === "tif"));
          return (
            <li key={r.key} className="rounded-[12px] border border-line bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="min-w-0 font-medium break-all text-fg">{r.name}</span>
                <span className="text-sm text-fg-3">{formatBytes(locale, r.size)}</span>
              </div>
              {d ? (
                <div className="mt-2">
                  <div className="text-[13px] text-fg-3">{t.detected}</div>
                  <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-xl font-semibold text-fg">{d.name[locale === "ru" ? 0 : 1]}</span>
                    <span className="font-mono text-sm break-all text-fg-2">{d.mime}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone="accent">.{d.ext}</Badge>
                    {r.claimedExt ? <Badge tone={matches ? "ok" : "warn"}>{matches ? t.match : `${t.mismatch}: .${r.claimedExt}`}</Badge> : <Badge>{t.noExt}</Badge>}
                    {d.confidence === "medium" && <span className="text-[13px] text-fg-3">{t.medium}</span>}
                    {knownSet.has(d.ext) && (
                      <Link href={href(locale, ["mime", d.ext])} className="text-sm text-accent hover:underline">
                        {t.more}
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="text-lg font-semibold text-fg">{t.unknown}</div>
                  <p className="text-sm text-fg-2">{t.unknownHint}</p>
                </div>
              )}
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[13px] text-fg-3">{t.browser}</dt>
                  <dd className="font-mono break-all text-fg-2">{r.browserType || t.none}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-fg-3">{t.first}</dt>
                  <dd className="font-mono break-all text-fg-2">{r.hex}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
