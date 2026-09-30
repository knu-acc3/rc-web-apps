"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { Checkbox } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { parseColor, toHex } from "@/sections/color/lib/color";
import { ColorField } from "@/sections/color/ui/ColorField";
import { DEFAULT_GLASS, glassCss, type GlassSettings } from "./lib/shapes";
import { CodePanel, NumberSlider } from "./ui/kit";

const T = {
  ru: {
    blur: "Размытие фона",
    opacity: "Непрозрачность подложки",
    saturate: "Насыщенность фона",
    border: "Яркость рамки",
    radius: "Скругление",
    shadow: "Тень",
    tint: "Цвет стекла",
    title: "Стеклянная карточка",
    text: "Фон за карточкой размыт с помощью backdrop-filter.",
  },
  en: {
    blur: "Background blur",
    opacity: "Tint opacity",
    saturate: "Background saturation",
    border: "Border brightness",
    radius: "Corner radius",
    shadow: "Shadow",
    tint: "Glass color",
    title: "Glass card",
    text: "The background behind the card is blurred with backdrop-filter.",
  },
} as const;

export default function GlassGenerator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [g, setG] = useState<GlassSettings>(DEFAULT_GLASS);
  const [tint, setTint] = useState(DEFAULT_GLASS.tint);
  const set = (patch: Partial<GlassSettings>) => setG((x) => ({ ...x, ...patch }));
  const tintHex = (() => {
    const c = parseColor(tint);
    return c ? toHex({ ...c, alpha: 1 }) : g.tint;
  })();
  const settings = { ...g, tint: tintHex };
  const hexRgb = tintHex.slice(1).match(/../g)!.map((x) => parseInt(x, 16)).join(" ");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div
          className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-[12px] border border-line p-6"
          style={{ background: "radial-gradient(circle at 20% 30%, #f472b6 0 18%, transparent 19%), radial-gradient(circle at 80% 70%, #38bdf8 0 22%, transparent 23%), radial-gradient(circle at 70% 20%, #facc15 0 12%, transparent 13%), linear-gradient(135deg, #6366f1, #a855f7)" }}
        >
          <div
            className="w-full max-w-xs p-6 text-white"
            style={{
              background: `rgb(${hexRgb} / ${settings.opacity})`,
              WebkitBackdropFilter: `blur(${settings.blur}px) saturate(${settings.saturate}%)`,
              backdropFilter: `blur(${settings.blur}px) saturate(${settings.saturate}%)`,
              border: settings.border > 0 ? `1px solid rgb(255 255 255 / ${settings.border})` : undefined,
              borderRadius: settings.radius,
              boxShadow: settings.shadow ? "0 8px 32px rgb(0 0 0 / 0.18)" : undefined,
            }}
          >
            <div className="text-lg font-semibold">{t.title}</div>
            <p className="mt-1 text-sm opacity-90">{t.text}</p>
          </div>
        </div>
        <Panel className="flex flex-col gap-3 p-4">
          <NumberSlider label={t.blur} value={g.blur} min={0} max={40} unit="px" onChange={(v) => set({ blur: Math.max(0, v) })} />
          <NumberSlider label={t.opacity} value={Math.round(g.opacity * 100)} min={0} max={100} unit="%" onChange={(v) => set({ opacity: Math.min(1, Math.max(0, v / 100)) })} />
          <NumberSlider label={t.saturate} value={g.saturate} min={50} max={250} unit="%" onChange={(v) => set({ saturate: Math.max(0, v) })} />
          <NumberSlider label={t.border} value={Math.round(g.border * 100)} min={0} max={100} unit="%" onChange={(v) => set({ border: Math.min(1, Math.max(0, v / 100)) })} />
          <NumberSlider label={t.radius} value={g.radius} min={0} max={48} unit="px" onChange={(v) => set({ radius: Math.max(0, v) })} />
          <ColorField label={t.tint} value={tint} onChange={setTint} locale={locale} size="sm" />
          <Checkbox label={t.shadow} checked={g.shadow} onChange={(e) => set({ shadow: e.target.checked })} />
        </Panel>
      </div>
      <CodePanel locale={locale} tabs={[{ id: "css", label: "CSS", code: glassCss(settings), filename: "glass.css" }]} />
    </div>
  );
}
