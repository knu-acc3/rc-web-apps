"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Select, Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { processFile, toBlob } from "../engine/run";
import { baseName } from "../engine/source";
import type { Fill, Op, OutFormat } from "../engine/types";
import { BatchWorkspace } from "../ui/BatchWorkspace";
import { ColorField, RangeField } from "../ui/controls";
import { DEFAULT_QUALITY, LOSSY, OUT_LABEL, sameFormat } from "../ui/format";
import { LiveStage } from "../ui/LiveStage";
import { S } from "../ui/strings";
import { useBatch, type Runner } from "../ui/useBatch";

type Mode = "round" | "border" | "square";

const T = {
  ru: {
    radius: "Радиус скругления",
    corners: "Углы",
    transparent: "Прозрачные (PNG/WebP)",
    filled: "Цветом (JPG)",
    cornerColor: "Цвет углов",
    width: "Толщина рамки",
    unit: "Единицы",
    roundPctHint: "100 % — половина короткой стороны: квадрат станет кругом, прямоугольник — «таблеткой»",
    pct: "% короткой стороны",
    px: "px",
    color: "Цвет рамки",
    inside: "Сохранить размер (рамка внутри)",
    ratio: "Формат",
    fill: "Поля",
    blur: "Размытое фото",
    solid: "Цвет",
    fillColor: "Цвет полей",
    output: "Формат файла",
    auto: "Авто",
  },
  en: {
    radius: "Corner radius",
    corners: "Corners",
    transparent: "Transparent (PNG/WebP)",
    filled: "Colour (JPG)",
    cornerColor: "Corner colour",
    width: "Border width",
    unit: "Units",
    roundPctHint: "100% is half the shorter side: a square becomes a circle, a rectangle a pill",
    pct: "% of short side",
    px: "px",
    color: "Border colour",
    inside: "Keep size (border inside)",
    ratio: "Shape",
    fill: "Padding",
    blur: "Blurred photo",
    solid: "Colour",
    fillColor: "Padding colour",
    output: "File format",
    auto: "Auto",
  },
} as const;

const RATIOS: { value: string; r: [number, number] }[] = [
  { value: "1:1", r: [1, 1] },
  { value: "4:5", r: [4, 5] },
  { value: "9:16", r: [9, 16] },
  { value: "16:9", r: [16, 9] },
];

export default function Decorate({ locale, mode }: { locale: Locale; mode: Mode }) {
  const t = T[locale];
  const s = S(locale);
  const id = useId();
  const [radius, setRadius] = useState(12);
  const [rUnit, setRUnit] = useState<"%" | "px">("%");
  const [cornerKind, setCornerKind] = useState<"transparent" | "color">("transparent");
  const [cornerColor, setCornerColor] = useState("#FFFFFF");
  const [bw, setBw] = useState(4);
  const [unit, setUnit] = useState<"%" | "px">("%");
  const [bColor, setBColor] = useState("#FFFFFF");
  const [inside, setInside] = useState(false);
  const [ratio, setRatio] = useState("1:1");
  const [fillKind, setFillKind] = useState<"blur" | "color">("blur");
  const [fillColor, setFillColor] = useState("#FFFFFF");
  const [out, setOut] = useState<"auto" | OutFormat>("auto");

  let ops: Op[];
  if (mode === "round") {
    const fill: Fill = cornerKind === "transparent" ? { kind: "transparent" } : { kind: "color", color: cornerColor };
    ops = [{ t: "round", radius, unit: rUnit, fill }];
  } else if (mode === "border") {
    ops = [{ t: "border", width: bw, unit, color: bColor, inside }];
  } else {
    const r = RATIOS.find((x) => x.value === ratio)!.r;
    ops = [{ t: "pad", ratio: r, fill: fillKind === "blur" ? { kind: "blur" } : { kind: "color", color: fillColor } }];
  }
  const key = JSON.stringify({ ops, out });

  const pickFormat = (src: Parameters<typeof sameFormat>[0]): OutFormat => {
    if (out !== "auto") return out;
    const same = sameFormat(src);
    if (mode === "round" && cornerKind === "transparent" && same === "jpg") return "png";
    return same;
  };

  const runner: Runner = async (p, ctx) => {
    const fmt = pickFormat(p.format);
    const r = await processFile(
      ctx.engine,
      p,
      ops,
      { format: fmt, quality: LOSSY.has(fmt) ? Math.max(88, DEFAULT_QUALITY[fmt]) : 100, background: mode === "round" ? cornerColor : "#FFFFFF" },
      { signal: ctx.signal, onProgress: ctx.onProgress },
    );
    const suffix = mode === "round" ? "rounded" : mode === "border" ? "border" : "square";
    return { blob: toBlob(r), name: `${baseName(p.file.name)}-${suffix}.${r.ext}`, width: r.width, height: r.height };
  };
  const batch = useBatch({ runner, settingsKey: key, delay: 500 });

  const options =
    mode === "round" ? (
      <>
        <div className="min-w-52 flex-1">
          <RangeField label={t.radius} value={radius} onChange={setRadius} min={0} max={rUnit === "%" ? 100 : 1000} unit={rUnit} locale={locale} />
        </div>
        <Field label={t.corners}>
          <Segmented
            wrap
            label={t.corners}
            value={cornerKind}
            onChange={setCornerKind}
            options={[
              { value: "transparent", label: t.transparent },
              { value: "color", label: t.filled },
            ]}
          />
        </Field>
      </>
    ) : mode === "border" ? (
      <>
        <div className="min-w-52 flex-1">
          <RangeField
            label={t.width}
            value={bw}
            onChange={setBw}
            min={0}
            max={unit === "%" ? 25 : 300}
            step={unit === "%" ? 0.5 : 1}
            unit={unit === "%" ? "%" : "px"}
            locale={locale}
          />
        </div>
        <ColorField label={t.color} value={bColor} onChange={setBColor} locale={locale} className="w-48" />
      </>
    ) : (
      <>
        <Field label={t.ratio}>
          <Segmented wrap label={t.ratio} value={ratio} onChange={setRatio} options={RATIOS.map((x) => ({ value: x.value, label: x.value }))} />
        </Field>
        <Field label={t.fill}>
          <Segmented
            wrap
            label={t.fill}
            value={fillKind}
            onChange={setFillKind}
            options={[
              { value: "blur", label: t.blur },
              { value: "color", label: t.solid },
            ]}
          />
        </Field>
        {fillKind === "color" && <ColorField label={t.fillColor} value={fillColor} onChange={setFillColor} locale={locale} className="w-48" />}
      </>
    );

  const more = (
    <>
      {mode === "round" && (
        <Field label={t.unit} hint={rUnit === "%" ? t.roundPctHint : undefined}>
          <Segmented
            wrap
            label={t.unit}
            value={rUnit}
            onChange={(u) => {
              setRUnit(u);
              setRadius(u === "%" ? 12 : 60);
            }}
            options={[
              { value: "%", label: "%" },
              { value: "px", label: t.px },
            ]}
          />
        </Field>
      )}
      {mode === "round" && cornerKind === "color" && <ColorField label={t.cornerColor} value={cornerColor} onChange={setCornerColor} locale={locale} />}
      {mode === "border" && (
        <>
          <Field label={t.unit}>
            <Segmented
              wrap
              label={t.unit}
              value={unit}
              onChange={(u) => {
                setUnit(u);
                setBw(u === "%" ? 4 : 40);
              }}
              options={[
                { value: "%", label: t.pct },
                { value: "px", label: t.px },
              ]}
            />
          </Field>
          <Switch label={t.inside} checked={inside} onChange={(e) => setInside(e.target.checked)} />
        </>
      )}
      <Field label={t.output} htmlFor={`${id}-out`}>
        <Select id={`${id}-out`} value={out} onChange={(e) => setOut(e.target.value as "auto" | OutFormat)}>
          <option value="auto">{mode === "round" ? t.auto : s.sameFormat}</option>
          {(["jpg", "png", "webp"] as const).map((f) => (
            <option key={f} value={f}>
              {OUT_LABEL[f]}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );

  return (
    <BatchWorkspace
      locale={locale}
      batch={batch}
      options={options}
      more={more}
      zipName={`${mode}-images.zip`}
      stage={(it) => <LiveStage locale={locale} prepared={it.prepared} ops={ops} />}
    />
  );
}
