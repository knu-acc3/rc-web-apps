"use client";

import { Download, Eraser, Loader2, MapPin } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatDate, formatNumber, plural } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Select } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { Notice, Panel } from "@/ui/panel";
import { stripPngMetadata, stripWebpMetadata } from "./lib/container";
import { IMAGE_ACCEPT } from "./lib/detect";
import { stripJpegMetadata } from "./lib/jpeg";
import { processFile, toBlob } from "./lib/run";
import { baseName, prepareFile, type Prepared } from "./lib/source";
import { sameFormat } from "./ui/format";
import { useEngine } from "./ui/hooks";
import { errorText, S } from "./ui/strings";
import { downloadZip } from "./ui/useBatch";
import { useWorkspace } from "./ui/useWorkspace";
import { RestoringPlaceholder, WorkspaceBar } from "./ui/Workspace";

const T = {
  ru: {
    file: "Файл",
    tags: ["тег", "тега", "тегов"],
    noMeta: "Метаданных не найдено",
    gps: "Координаты GPS",
    noGps: "GPS-координат нет",
    decimal: "Десятичные градусы",
    dms: "Градусы, минуты, секунды",
    altitude: "Высота",
    remove: "Удалить метаданные",
    removeAll: "Удалить у всех (ZIP)",
    lossless: "Без перекодирования: удалены EXIF, XMP, IPTC и комментарии, цветовой профиль и пиксели не тронуты",
    reencoded: "Этот формат нельзя очистить без перекодирования — файл пересохранён без метаданных",
    summary: "Главное",
    all: "Все теги",
    camera: "Камера",
    lens: "Объектив",
    taken: "Дата съёмки",
    exposure: "Выдержка",
    aperture: "Диафрагма",
    iso: "ISO",
    focal: "Фокусное расстояние",
    size: "Размер в пикселях",
    software: "Программа",
    copyright: "Автор / права",
    reading: "Чтение метаданных…",
    group: {
      ifd0: "Основные (IFD0)",
      exif: "EXIF",
      gps: "GPS",
      interop: "Interop",
      ifd1: "Миниатюра (IFD1)",
      iptc: "IPTC",
      xmp: "XMP",
      icc: "ICC-профиль",
      jfif: "JFIF",
      ihdr: "PNG (IHDR)",
    } as Record<string, string>,
  },
  en: {
    file: "File",
    tags: ["tag", "tags"],
    noMeta: "No metadata found",
    gps: "GPS coordinates",
    noGps: "No GPS coordinates",
    decimal: "Decimal degrees",
    dms: "Degrees, minutes, seconds",
    altitude: "Altitude",
    remove: "Remove metadata",
    removeAll: "Remove from all (ZIP)",
    lossless: "No re-encoding: EXIF, XMP, IPTC and comments removed; the colour profile and pixels are untouched",
    reencoded: "This format can't be cleaned without re-encoding — the file was re-saved without metadata",
    summary: "Summary",
    all: "All tags",
    camera: "Camera",
    lens: "Lens",
    taken: "Taken",
    exposure: "Exposure",
    aperture: "Aperture",
    iso: "ISO",
    focal: "Focal length",
    size: "Pixel size",
    software: "Software",
    copyright: "Artist / copyright",
    reading: "Reading metadata…",
    group: {
      ifd0: "Main (IFD0)",
      exif: "EXIF",
      gps: "GPS",
      interop: "Interop",
      ifd1: "Thumbnail (IFD1)",
      iptc: "IPTC",
      xmp: "XMP",
      icc: "ICC profile",
      jfif: "JFIF",
      ihdr: "PNG (IHDR)",
    } as Record<string, string>,
  },
} as const;

type Tags = Record<string, Record<string, unknown>>;

interface Item {
  prepared: Prepared;
  tags: Tags | null;
  gps: { latitude: number; longitude: number; altitude?: number } | null;
  error?: unknown;
}

function dms(v: number, pos: string, neg: string) {
  const a = Math.abs(v);
  const d = Math.floor(a);
  const mFull = (a - d) * 60;
  const m = Math.floor(mFull);
  const s = (mFull - m) * 60;
  return `${d}°${String(m).padStart(2, "0")}′${s.toFixed(2).padStart(5, "0")}″${v >= 0 ? pos : neg}`;
}

function show(locale: Locale, v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? "—" : formatDate(locale, v, { dateStyle: "long", timeStyle: "medium" });
  if (typeof v === "number") return formatNumber(locale, v, { maximumFractionDigits: 6 });
  if (v instanceof Uint8Array || ArrayBuffer.isView(v)) return `[${(v as Uint8Array).length} B]`;
  if (Array.isArray(v)) return v.length > 12 ? `[${v.length}]` : v.map((x) => show(locale, x)).join(", ");
  if (typeof v === "object") return JSON.stringify(v).slice(0, 200);
  const s = String(v);
  return s.length > 300 ? `${s.slice(0, 300)}…` : s;
}

async function readMeta(p: Prepared): Promise<Pick<Item, "tags" | "gps">> {
  const exifr = (await import("exifr")).default;
  const opts = {
    tiff: true,
    exif: true,
    gps: true,
    interop: true,
    ifd1: true,
    iptc: true,
    xmp: true,
    icc: true,
    jfif: true,
    ihdr: true,
    makerNote: false,
    userComment: true,
    mergeOutput: false,
    translateValues: true,
    reviveValues: true,
    sanitize: true,
  };
  let tags: Tags | null = null;
  try {
    tags = ((await exifr.parse(p.file, opts)) as Tags | undefined) ?? null;
  } catch {
    tags = null;
  }
  let gps: Item["gps"] = null;
  const g = tags?.gps as { latitude?: number; longitude?: number; GPSAltitude?: number } | undefined;
  if (g && typeof g.latitude === "number" && typeof g.longitude === "number" && Number.isFinite(g.latitude))
    gps = { latitude: g.latitude, longitude: g.longitude, altitude: g.GPSAltitude };
  else if (g) {
    try {
      const c = await exifr.gps(p.file);
      if (c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude)) gps = { latitude: c.latitude, longitude: c.longitude, altitude: g.GPSAltitude };
    } catch {
      /* no usable coordinates */
    }
  }
  return { tags, gps };
}

/** Remove metadata; lossless for JPEG, PNG and WebP. */
async function strip(p: Prepared, run: () => Promise<Blob>): Promise<{ blob: Blob; lossless: boolean }> {
  if (p.format === "jpg" || p.format === "png" || p.format === "webp") {
    const b = new Uint8Array(await p.file.arrayBuffer());
    const out = p.format === "jpg" ? stripJpegMetadata(b).bytes : p.format === "png" ? stripPngMetadata(b).bytes : stripWebpMetadata(b).bytes;
    return { blob: new Blob([out as BlobPart], { type: p.file.type || (p.format === "jpg" ? "image/jpeg" : `image/${p.format}`) }), lossless: true };
  }
  return { blob: await run(), lossless: false };
}

export default function Exif({ locale }: { locale: Locale }) {
  const t = T[locale];
  const s = S(locale);
  const id = useId();
  const getEngine = useEngine();
  const [items, setItems] = useState<Item[]>([]);
  const [sel, setSel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ lossless: boolean; size: number } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const cur = items[sel];
  // The photos stay in the tab's workspace for the next photo tool (and come back from the previous one).
  const ws = useWorkspace({
    files: items.map((i) => i.prepared.file),
    mode: "sync",
    accept: IMAGE_ACCEPT,
    settled: !loading,
    restore: (files) => void add(files),
  });

  async function add(files: File[]) {
    setLoading(true);
    setError(null);
    const next: Item[] = [];
    for (const f of files) {
      try {
        const prepared = await prepareFile(f);
        next.push({ prepared, ...(await readMeta(prepared)) });
      } catch (e) {
        setError(e);
      }
    }
    setItems((xs) => [...xs, ...next]);
    if (!items.length) setSel(0);
    setLoading(false);
  }

  const reencode = (p: Prepared) => async () => {
    const fmt = sameFormat(p.format);
    const r = await processFile(getEngine(), p, [], { format: fmt, quality: 92, background: "#FFFFFF" });
    return toBlob(r);
  };
  const outName = (p: Prepared, blob: Blob) => {
    const ext =
      p.format === "jpg" || p.format === "png" || p.format === "webp"
        ? (p.file.name.match(/\.([^.]+)$/)?.[1] ?? p.format)
        : (blob.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png");
    return `${baseName(p.file.name)}-clean.${ext}`;
  };

  async function removeOne() {
    if (!cur) return;
    setBusy(true);
    setError(null);
    try {
      const { blob, lossless } = await strip(cur.prepared, reencode(cur.prepared));
      downloadBlob(blob, outName(cur.prepared, blob));
      setDone({ lossless, size: blob.size });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function removeAll() {
    setBusy(true);
    setError(null);
    try {
      const out: { name: string; blob: Blob }[] = [];
      for (const it of items) {
        const { blob } = await strip(it.prepared, reencode(it.prepared));
        out.push({ name: outName(it.prepared, blob), blob });
      }
      await downloadZip(out, "clean-images.zip");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <div className="flex flex-col gap-3">
        {ws.restoring || loading ? (
          <RestoringPlaceholder locale={locale} text={ws.restoring ? undefined : t.reading} />
        ) : (
          <Dropzone onFiles={add} accept={IMAGE_ACCEPT} multiple title={s.dropMany} hint={s.dropHint} locale={locale} />
        )}
        {error ? <Notice tone="err">{errorText(locale, error)}</Notice> : null}
      </div>
    );
  }

  const tags = cur?.tags ?? {};
  const flat: Record<string, unknown> = Object.assign({}, ...Object.values(tags).filter((x) => x && typeof x === "object"));
  const count = Object.values(tags).reduce((n, g) => n + (g && typeof g === "object" ? Object.keys(g).length : 0), 0);
  const pick = (...keys: string[]) => keys.map((k) => flat[k]).find((v) => v !== undefined && v !== null && v !== "");
  const exposure = pick("ExposureTime");
  const summary: [string, string][] = (
    [
      [t.camera, [pick("Make"), pick("Model")].filter(Boolean).join(" ")],
      [t.lens, pick("LensModel", "Lens")],
      [t.taken, pick("DateTimeOriginal", "CreateDate", "DateCreated", "ModifyDate")],
      [t.exposure, typeof exposure === "number" ? (exposure < 1 ? `1/${Math.round(1 / exposure)} s` : `${exposure} s`) : exposure],
      [t.aperture, typeof pick("FNumber") === "number" ? `f/${pick("FNumber")}` : undefined],
      [t.iso, pick("ISO")],
      [t.focal, typeof pick("FocalLength") === "number" ? `${pick("FocalLength")} mm` : undefined],
      [t.size, pick("ExifImageWidth", "ImageWidth") ? `${pick("ExifImageWidth", "ImageWidth")} × ${pick("ExifImageHeight", "ImageHeight")}` : undefined],
      [t.software, pick("Software", "CreatorTool")],
      [
        t.copyright,
        [pick("Artist", "Creator", "creator"), pick("Copyright", "Rights")]
          .filter(Boolean)
          .map((x) => show(locale, x))
          .join(" · "),
      ],
    ] as [string, unknown][]
  )
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, show(locale, v)]);

  return (
    <div className="flex flex-col gap-4">
      <WorkspaceBar
        locale={locale}
        count={ws.restored}
        onStartOver={() => {
          ws.startOver();
          setItems([]);
          setSel(0);
          setDone(null);
        }}
      />
      {items.length > 1 && (
        <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <Field label={t.file} htmlFor={`${id}-f`} className="min-w-0 flex-1">
            <Select
              id={`${id}-f`}
              value={String(sel)}
              onChange={(e) => {
                setSel(Number(e.target.value));
                setDone(null);
              }}
            >
              {items.map((it, i) => (
                <option key={it.prepared.id} value={i}>
                  {it.prepared.file.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="tonal" onClick={removeAll} disabled={busy}>
            <Download aria-hidden />
            {t.removeAll}
          </Button>
        </Panel>
      )}

      <Panel className="flex flex-col gap-5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite" className="min-w-0">
            <p className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              {count ? `${count} ${plural(locale, count, t.tags)}` : t.noMeta}
            </p>
            <p className="truncate text-sm text-fg-3">
              {cur.prepared.file.name} · {formatBytes(locale, cur.prepared.file.size)}
            </p>
          </div>
          <Button variant="filled" size="lg" onClick={removeOne} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Eraser aria-hidden />}
            {t.remove}
          </Button>
        </div>
        {done && (
          <Notice tone="ok">
            {done.lossless ? t.lossless : t.reencoded} · {formatBytes(locale, done.size)}
          </Notice>
        )}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <section className="flex flex-col gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-fg">
              <MapPin className="size-4 text-accent" aria-hidden />
              {t.gps}
            </h2>
            {cur.gps ? (
              <dl className="grid gap-3 rounded-[1rem] bg-surface-2 p-4 text-sm">
                <div>
                  <dt className="text-fg-3">{t.decimal}</dt>
                  <dd className="flex flex-wrap items-center gap-1 break-all font-mono text-fg">
                    {cur.gps.latitude.toFixed(6)}, {cur.gps.longitude.toFixed(6)}
                    <CopyButton
                      value={`${cur.gps.latitude.toFixed(6)}, ${cur.gps.longitude.toFixed(6)}`}
                      size="icon-sm"
                      variant="ghost"
                      label={locale === "ru" ? "Копировать" : "Copy"}
                      copiedLabel={locale === "ru" ? "Скопировано" : "Copied"}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-3">{t.dms}</dt>
                  <dd className="break-all font-mono text-fg">
                    {dms(cur.gps.latitude, "N", "S")} {dms(cur.gps.longitude, "E", "W")}
                  </dd>
                </div>
                {typeof cur.gps.altitude === "number" && (
                  <div>
                    <dt className="text-fg-3">{t.altitude}</dt>
                    <dd className="text-fg">{formatNumber(locale, cur.gps.altitude, { maximumFractionDigits: 1 })} m</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-fg-3">{t.noGps}</p>
            )}
          </section>
          {summary.length > 0 && (
            <section className="flex min-w-0 flex-col gap-2">
              <h2 className="text-sm font-semibold text-fg">{t.summary}</h2>
              <dl className="grid gap-x-6 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {summary.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-line py-1.5">
                    <dt className="shrink-0 text-fg-3">{k}</dt>
                    <dd className="min-w-0 break-words text-right text-fg">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </Panel>

      {count > 0 && (
        <Fold title={`${t.all} (${count})`} bodyClassName="flex flex-col gap-4 px-2 pb-3 pt-1 sm:px-3">
          {Object.entries(tags).map(([group, values]) =>
            values && typeof values === "object" && Object.keys(values).length ? (
              <section key={group} className="flex min-w-0 flex-col gap-1">
                <h3 className="px-2 text-[0.8125rem] font-semibold text-fg-2">{t.group[group] ?? group}</h3>
                <div tabIndex={0} className="tbl rounded-none! bg-transparent! shadow-none!">
                  <table>
                    <tbody>
                      {Object.entries(values).map(([k, v]) => (
                        <tr key={k}>
                          <td className="w-1/3 font-mono text-[0.8125rem] text-fg-2">{k}</td>
                          <td className="break-all">{show(locale, v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null,
          )}
        </Fold>
      )}

      {error ? <Notice tone="err">{errorText(locale, error)}</Notice> : null}
      <Dropzone onFiles={add} accept={IMAGE_ACCEPT} multiple compact title={s.addMore} locale={locale} />
    </div>
  );
}
