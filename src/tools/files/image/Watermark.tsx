"use client";

import { ImagePlus } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Field, Input, Select, Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { detectFormat } from "./lib/detect";
import { processFile, toBlob } from "./lib/run";
import { baseName, rasterizeSvg, readHead } from "./lib/source";
import type { Op, Pos9, WatermarkSpec } from "./lib/types";
import { BatchWorkspace } from "./ui/BatchWorkspace";
import { ColorField, RangeField } from "./ui/controls";
import { FONTS, fontCss } from "./ui/fonts";
import { DEFAULT_QUALITY, LOSSY, resolveOut } from "./ui/format";
import { useBitmap } from "./ui/hooks";
import { LiveStage } from "./ui/LiveStage";
import { PositionPicker } from "./ui/PositionPicker";
import { errorText } from "./ui/strings";
import { useBatch, type Runner } from "./ui/useBatch";

const T = {
  ru: {
    kind: "Водяной знак",
    text: "Текст",
    logo: "Логотип",
    textValue: "Текст знака",
    placeholder: "© Ваше имя",
    choose: "Выбрать логотип (PNG, SVG…)",
    change: "Заменить логотип",
    position: "Положение",
    opacity: "Прозрачность",
    size: "Размер, % ширины фото",
    font: "Шрифт",
    color: "Цвет",
    bold: "Жирный",
    shadow: "Тень",
    rotate: "Поворот",
    margin: "Отступ от края",
    gap: "Интервал между повторами",
    defaultText: "© Моё фото",
  },
  en: {
    kind: "Watermark",
    text: "Text",
    logo: "Logo",
    textValue: "Watermark text",
    placeholder: "© Your name",
    choose: "Choose a logo (PNG, SVG…)",
    change: "Replace logo",
    position: "Position",
    opacity: "Opacity",
    size: "Size, % of photo width",
    font: "Font",
    color: "Colour",
    bold: "Bold",
    shadow: "Shadow",
    rotate: "Rotation",
    margin: "Margin from the edge",
    gap: "Spacing between repeats",
    defaultText: "© My photo",
  },
} as const;

export default function Watermark({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<"text" | "image">("text");
  const [text, setText] = useState<string>(t.defaultText);
  const [font, setFont] = useState("arial");
  const [color, setColor] = useState("#FFFFFF");
  const [bold, setBold] = useState(true);
  const [shadow, setShadow] = useState(true);
  const [size, setSize] = useState(5);
  const [opacity, setOpacity] = useState(70);
  const [position, setPosition] = useState<Pos9 | "tile">("br");
  const [rotate, setRotate] = useState(0);
  const [margin, setMargin] = useState(3);
  const [gap, setGap] = useState(80);
  const [logo, setLogo] = useBitmap();
  const [logoKey, setLogoKey] = useState(0);
  const [logoError, setLogoError] = useState<unknown>(null);

  const wm: WatermarkSpec = {
    kind,
    text,
    font: fontCss(font),
    color,
    bold,
    shadow,
    asset: kind === "image" ? "logo" : undefined,
    size: kind === "image" ? size * 3 : size,
    opacity,
    position,
    margin,
    rotate: position === "tile" && rotate === 0 ? -30 : rotate,
    gap,
  };
  const ops: Op[] = [{ t: "watermark", wm }];
  const assets = useMemo(() => (logo ? { logo } : undefined), [logo]);
  const active = kind === "text" ? text.trim().length > 0 : !!logo;
  const key = JSON.stringify({ ops, logoKey });

  const runner: Runner = async (p, ctx) => {
    const fmt = resolveOut("same", p.format);
    const r = await processFile(
      ctx.engine,
      p,
      active ? ops : [],
      { format: fmt, quality: LOSSY.has(fmt) ? Math.max(88, DEFAULT_QUALITY[fmt]) : 100, background: "#FFFFFF" },
      { signal: ctx.signal, onProgress: ctx.onProgress, assets },
    );
    return { blob: toBlob(r), name: `${baseName(p.file.name)}-watermark.${r.ext}`, width: r.width, height: r.height };
  };
  const batch = useBatch({ runner, settingsKey: key, delay: 600 });

  async function pickLogo(f: File | undefined) {
    if (!f) return;
    setLogoError(null);
    try {
      const fmt = detectFormat(await readHead(f, 4096));
      const bmp = fmt === "svg" ? (await rasterizeSvg(await f.text(), 1024)).bitmap : await createImageBitmap(f);
      setLogo(bmp);
      setLogoKey((k) => k + 1);
      setKind("image");
    } catch (e) {
      setLogoError(e instanceof Error && e.message ? e : new Error("DECODE_FAILED"));
    }
  }

  const options = (
    <>
      <Segmented
        fill
        label={t.kind}
        value={kind}
        onChange={setKind}
        options={[
          { value: "text", label: t.text },
          { value: "image", label: t.logo },
        ]}
      />
      {kind === "text" ? (
        <Field label={t.textValue} htmlFor={`${id}-txt`}>
          <Input id={`${id}-txt`} value={text} placeholder={t.placeholder} onChange={(e) => setText(e.target.value)} maxLength={120} />
        </Field>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Button variant="tonal" onClick={() => fileRef.current?.click()}>
            <ImagePlus aria-hidden />
            {logo ? t.change : t.choose}
          </Button>
          {logoError ? (
            <p className="text-sm text-err" role="alert">
              {errorText(locale, logoError)}
            </p>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.svg"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              pickLogo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      )}
      <PositionPicker label={t.position} value={position} onChange={setPosition} locale={locale} />
      <RangeField label={t.opacity} value={opacity} onChange={setOpacity} min={5} max={100} unit="%" locale={locale} />
    </>
  );

  const more = (
    <>
      <RangeField label={t.size} value={size} onChange={setSize} min={1} max={30} step={0.5} unit="%" locale={locale} />
      {kind === "text" && (
        <>
          <Field label={t.font} htmlFor={`${id}-font`}>
            <Select id={`${id}-font`} value={font} onChange={(e) => setFont(e.target.value)}>
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
          <ColorField label={t.color} value={color} onChange={setColor} locale={locale} />
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Switch label={t.bold} checked={bold} onChange={(e) => setBold(e.target.checked)} />
            <Switch label={t.shadow} checked={shadow} onChange={(e) => setShadow(e.target.checked)} />
          </div>
        </>
      )}
      <RangeField label={t.rotate} value={rotate} onChange={setRotate} min={-90} max={90} unit="°" locale={locale} />
      {position === "tile" ? (
        <RangeField label={t.gap} value={gap} onChange={setGap} min={20} max={300} unit="%" locale={locale} />
      ) : (
        <RangeField label={t.margin} value={margin} onChange={setMargin} min={0} max={20} step={0.5} unit="%" locale={locale} />
      )}
    </>
  );

  return (
    <BatchWorkspace
      self="watermark"
      locale={locale}
      batch={batch}
      options={options}
      more={more}
      zipName="watermarked-images.zip"
      stage={(it) => <LiveStage locale={locale} prepared={it.prepared} ops={active ? ops : []} assets={assets} />}
    />
  );
}
