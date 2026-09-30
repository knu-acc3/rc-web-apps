"use client";

import { Pipette } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";
import { href, type Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Panel } from "@/ui/panel";
import { contrastRatio, formatRatio, nearestNamed, parseColor, readableTextColor, toHex, WHITE } from "./lib/color";
import { colorFromHsva, hsvaFromColor, nudgeSV, withAlpha, withHue, type Hsva } from "./lib/picker-state";
import { ChannelSlider, sliderKey } from "./ui/ChannelSlider";
import { ColorField, CHECKER_STYLE } from "./ui/ColorField";
import { FormatList } from "./ui/FormatList";
import { useFeature } from "./ui/hooks";

const T = {
  ru: {
    area: "Насыщенность и яркость",
    areaText: (s: number, v: number) => `Насыщенность ${s} %, яркость ${v} %`,
    hue: "Оттенок",
    alpha: "Прозрачность (альфа)",
    input: "Или введите цвет: HEX, RGB, HSL, OKLCH, название",
    eyedropperTitle: "Взять цвет с экрана (пипетка)",
    nearest: "Ближайший именованный цвет CSS",
    exact: "точное совпадение",
    onWhite: "с белым",
    copyHex: "Копировать HEX",
    copied: "Скопировано",
  },
  en: {
    area: "Saturation and brightness",
    areaText: (s: number, v: number) => `Saturation ${s}%, brightness ${v}%`,
    hue: "Hue",
    alpha: "Opacity (alpha)",
    input: "Or type a color: HEX, RGB, HSL, OKLCH, name",
    eyedropperTitle: "Pick a color from the screen (eyedropper)",
    nearest: "Nearest CSS named color",
    exact: "exact match",
    onWhite: "on white",
    copyHex: "Copy HEX",
    copied: "Copied",
  },
} as const;

const HUE_BG = "linear-gradient(to right, #f00 0%, #ff0 16.66%, #0f0 33.33%, #0ff 50%, #00f 66.66%, #f0f 83.33%, #f00 100%)";

interface EyeDropperCtor {
  new (): { open(): Promise<{ sRGBHex: string }> };
}

export interface PickerProps {
  locale: Locale;
  initial?: string;
}

export default function ColorPicker({ locale, initial = "#3B82F6" }: PickerProps) {
  const t = T[locale];
  const [hsva, setHsva] = useState<Hsva>(() => hsvaFromColor(parseColor(initial) ?? { r: 0.23, g: 0.51, b: 0.96, alpha: 1 }));
  const [text, setText] = useState(() => initial);
  const color = colorFromHsva(hsva);
  const canEyedrop = useFeature(() => "EyeDropper" in window);

  function update(next: Hsva) {
    setHsva(next);
    setText(toHex(colorFromHsva(next)));
  }
  function onText(v: string) {
    setText(v);
    const c = parseColor(v);
    if (c) setHsva((prev) => hsvaFromColor(c, prev));
  }
  async function eyedrop() {
    const Ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
    if (!Ctor) return;
    try {
      const r = await new Ctor().open();
      onText(r.sRGBHex.toUpperCase());
    } catch {
      // user cancelled
    }
  }

  const opaque = { ...color, alpha: 1 };
  const hex = toHex(color);
  const near = nearestNamed(color, 1)[0];
  const fg = readableTextColor(color);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <Panel className="flex flex-col gap-3 p-4 sm:p-5">
        <SVArea hsva={hsva} onChange={update} label={t.area} valueText={t.areaText(Math.round(hsva.s * 100), Math.round(hsva.v * 100))} />
        <ChannelSlider
          label={t.hue}
          value={hsva.h}
          min={0}
          max={360}
          step={1}
          bigStep={15}
          onChange={(h) => update(withHue(hsva, h))}
          background={HUE_BG}
          thumbColor={`hsl(${hsva.h} 100% 50%)`}
          valueText={`${Math.round(hsva.h)}°`}
        />
        <ChannelSlider
          label={t.alpha}
          value={Math.round(hsva.a * 100)}
          min={0}
          max={100}
          step={1}
          bigStep={10}
          onChange={(a) => update(withAlpha(hsva, a / 100))}
          background={`linear-gradient(to right, transparent, ${toHex(opaque)})`}
          checker
          thumbColor={hex}
          valueText={`${Math.round(hsva.a * 100)} %`}
        />
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="overflow-hidden">
          <div style={CHECKER_STYLE}>
            <div className="flex min-h-36 flex-col justify-between gap-3 p-4 sm:min-h-44 sm:p-5" style={{ background: hex, color: fg }}>
              <span className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">{hex}</span>
              <div className="flex items-end justify-between gap-2">
                <span className="text-sm">
                  {formatRatio(contrastRatio(opaque, WHITE))}:1 {t.onWhite}
                </span>
                <CopyButton value={hex} label={t.copyHex} copiedLabel={t.copied} variant="secondary" size="sm" />
              </div>
            </div>
          </div>
          <div className="flex items-end gap-2 border-t border-line p-4">
            <ColorField label={t.input} value={text} onChange={onText} locale={locale} className="flex-1" />
            {canEyedrop && (
              <Button variant="outline" size="icon" onClick={eyedrop} aria-label={t.eyedropperTitle} title={t.eyedropperTitle}>
                <Pipette />
              </Button>
            )}
          </div>
        </Panel>
        <Panel className="p-2">
          <FormatList color={color} locale={locale} formats={["rgb", "hsl", "oklch", "hwb", "hsv", "cmyk", "lab", "lch", "oklab", "p3"]} />
          <p className="px-3 pt-1 pb-1.5 text-xs text-fg-3">
            {t.nearest}:{" "}
            <Link href={href(locale, ["color", near.name])} className="text-accent underline underline-offset-2">
              {near.name}
            </Link>
            {near.distance < 1e-6 ? ` (${t.exact})` : ` (${near.hex})`}
          </p>
        </Panel>
      </div>
    </div>
  );
}

/** 2D saturation (x) / value (y) area — pointer drag + arrow keys. */
function SVArea({ hsva, onChange, label, valueText }: { hsva: Hsva; onChange: (x: Hsva) => void; label: string; valueText: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  function fromPointer(e: PointerEvent) {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return;
    const s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const v = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    onChange({ ...hsva, s, v });
  }

  return (
    <div
      ref={boxRef}
      className="relative aspect-[4/3] w-full touch-none overflow-hidden rounded-[10px] border border-line select-none"
      style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsva.h} 100% 50%))` }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        thumbRef.current?.focus();
        fromPointer(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e);
      }}
    >
      <div
        ref={thumbRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsva.s * 100)}
        aria-valuetext={valueText}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.1 : 0.01;
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            onChange(nudgeSV(hsva, e.key === "ArrowRight" ? step : -step, 0));
          } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(nudgeSV(hsva, 0, e.key === "ArrowUp" ? step : -step));
          } else if (e.key === "PageUp" || e.key === "PageDown" || e.key === "Home" || e.key === "End") {
            const v = sliderKey(e, hsva.v * 100, 0, 100, 1, 10);
            if (v !== null) {
              e.preventDefault();
              onChange({ ...hsva, v: v / 100 });
            }
          }
        }}
        className="absolute size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.35),0_1px_3px_rgb(0_0_0/0.3)]"
        style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%`, background: toHex({ ...colorFromHsva(hsva), alpha: 1 }) }}
      />
    </div>
  );
}
