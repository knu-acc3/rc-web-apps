"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { Field } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { readPngDpi, readPngHeader, setPngDpi } from "./lib/container";
import { jpegDisplaySize, readJfifDensity, setJpegDpi } from "./lib/jpeg";
import { baseName, type Prepared } from "./lib/source";
import { BatchWorkspace } from "./ui/BatchWorkspace";
import { NumberField } from "./ui/controls";
import { useBatch, type Runner } from "./ui/useBatch";

const T = {
  ru: {
    dpi: "Новое значение DPI",
    presets: "Частые значения",
    was: "было",
    none: "не задано",
    print: "При печати",
    cm: "см",
    inch: ["дюйм", "дюйма", "дюймов", "дюйма"],
    note: "Пиксели не изменились — поменялась только запись о плотности печати",
    lossless: "Без перекодирования",
    pngAccept: "Только JPG и PNG · файлы не покидают устройство",
  },
  en: {
    dpi: "New DPI value",
    presets: "Common values",
    was: "was",
    none: "not set",
    print: "Prints at",
    cm: "cm",
    inch: ["in", "in"],
    note: "Pixels didn't change — only the print density record did",
    lossless: "No re-encoding",
    pngAccept: "JPG and PNG only · files never leave your device",
  },
} as const;

const PRESETS = [72, 96, 150, 300, 600] as const;

async function readInfo(p: Prepared): Promise<{ dpi: number | null; w: number; h: number }> {
  const b = new Uint8Array(await p.file.arrayBuffer());
  if (p.format === "jpg") {
    const d = readJfifDensity(b);
    const s = jpegDisplaySize(b) ?? { width: 0, height: 0 };
    const dpi = d && d.unit !== "none" ? (d.unit === "dpcm" ? Math.round(d.x * 2.54) : d.x) : null;
    return { dpi, w: s.width, h: s.height };
  }
  if (p.format === "png") {
    const h = readPngHeader(b);
    return { dpi: readPngDpi(b)?.x ?? null, w: h?.width ?? 0, h: h?.height ?? 0 };
  }
  throw new Error("DPI_UNSUPPORTED");
}

export default function Dpi({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [dpi, setDpi] = useState<number | null>(300);
  const [info, setInfo] = useState<Record<string, { dpi: number | null; w: number; h: number }>>({});
  const value = dpi ?? 300;

  const runner: Runner = async (p) => {
    if (p.format !== "jpg" && p.format !== "png") throw new Error("DPI_UNSUPPORTED");
    const b = new Uint8Array(await p.file.arrayBuffer());
    const before = await readInfo(p);
    setInfo((x) => ({ ...x, [p.id]: before }));
    const out = p.format === "jpg" ? setJpegDpi(b, value) : setPngDpi(b, value);
    const ext = p.file.name.match(/\.([^.]+)$/)?.[1] ?? p.format;
    return {
      blob: new Blob([out as BlobPart], { type: p.format === "jpg" ? "image/jpeg" : "image/png" }),
      name: `${baseName(p.file.name)}-${value}dpi.${ext}`,
      width: before.w,
      height: before.h,
      meta: { lossless: true },
    };
  };
  const batch = useBatch({ runner, settingsKey: String(value), delay: 250 });

  const options = (
    <>
      <NumberField label={t.dpi} value={dpi} onChange={setDpi} min={1} max={2400} suffix="dpi" className="w-40" />
      <Field label={t.presets}>
        <Segmented
          wrap
          label={t.presets}
          value={PRESETS.includes(value as (typeof PRESETS)[number]) ? String(value) : ""}
          onChange={(v) => setDpi(Number(v))}
          options={PRESETS.map((d) => ({ value: String(d), label: String(d) }))}
        />
      </Field>
    </>
  );

  const cm = (px: number) => formatNumber(locale, (px / value) * 2.54, { maximumFractionDigits: 1 });
  const inch = (px: number) => formatNumber(locale, px / value, { maximumFractionDigits: 2 });

  return (
    <BatchWorkspace
      locale={locale}
      batch={batch}
      options={options}
      compare={false}
      zipName={`images-${value}dpi.zip`}
      accept="image/jpeg,image/png,.jpg,.jpeg,.jfif,.png"
      dropHint={t.pngAccept}
      stat={(it, r) => (
        <p className="tabular text-2xl font-semibold tracking-tight text-fg">
          {value} dpi · {cm(r.width)} × {cm(r.height)} {t.cm}{" "}
          <span className="text-base font-normal text-fg-3">
            ({inch(r.width)} × {inch(r.height)} {plural(locale, Math.round((r.height / value) * 100) / 100, t.inch)}; {t.was}{" "}
            {info[it.prepared?.id ?? ""]?.dpi ?? t.none})
          </span>
        </p>
      )}
      extra={(it) => (it.result ? <p className="text-[0.8125rem] text-ok">{t.note}</p> : null)}
    />
  );
}
