"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Checkbox, Field, Textarea } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { ColorField } from "@/sections/color/ui/ColorField";
import { parseShadow, shadowCss, shadowValue, type ShadowKind, type ShadowLayer } from "./lib/shadow";
import type { Length } from "./lib/tokens";
import { CodePanel, NumberSlider, Stage } from "./ui/kit";

const T = {
  ru: {
    layer: (n: number) => `Слой ${n}`,
    layers: "Слои тени",
    add: "Добавить слой",
    duplicate: "Дублировать слой",
    remove: "Удалить слой",
    x: "Смещение по X",
    y: "Смещение по Y",
    blur: "Размытие",
    spread: "Растяжение",
    color: "Цвет тени",
    inset: "Внутренняя (inset)",
    paste: "Вставить свой CSS",
    pasteHint: "Любые единицы (px, em, rem, %…) и цвета (rgb, hsl, oklch, HEX, названия)",
    pasteError: (e: string) => `Не удалось разобрать: ${e}`,
    box: "Цвет блока",
    text: "Текст",
    sample: "Тень",
    preview: "Превью",
  },
  en: {
    layer: (n: number) => `Layer ${n}`,
    layers: "Shadow layers",
    add: "Add layer",
    duplicate: "Duplicate layer",
    remove: "Remove layer",
    x: "Offset X",
    y: "Offset Y",
    blur: "Blur",
    spread: "Spread",
    color: "Shadow color",
    inset: "Inset",
    paste: "Paste your CSS",
    pasteHint: "Any units (px, em, rem, %…) and colors (rgb, hsl, oklch, HEX, names)",
    pasteError: (e: string) => `Can't parse: ${e}`,
    box: "Box color",
    text: "Text",
    sample: "Shadow",
    preview: "Preview",
  },
} as const;

export interface ShadowEditorProps {
  locale: Locale;
  kind: ShadowKind;
  /** Initial CSS value, e.g. "0 4px 6px -1px rgb(0 0 0 / 0.1)" */
  value: string;
  /** Fixed preview background */
  surface?: string;
  /** Box color (box-shadow) */
  box?: string;
  /** Text color (text-shadow) */
  color?: string;
}

const setLen = (l: Length, value: number): Length => ({ value, unit: value === 0 ? "" : l.unit || "px" });

export default function ShadowEditor({ locale, kind, value, surface, box = "#FFFFFF", color = "#111827" }: ShadowEditorProps) {
  const t = T[locale];
  const id = useId();
  const [layers, setLayers] = useState<ShadowLayer[]>(() => parseShadow(value, kind).layers);
  const [sel, setSel] = useState(() => layers[0]?.id ?? 0);
  const [paste, setPaste] = useState("");
  const [boxColor, setBoxColor] = useState(box);
  const [textColor, setTextColor] = useState(color);
  const pasted = paste.trim() ? parseShadow(paste, kind) : null;
  const layer = layers.find((l) => l.id === sel) ?? layers[0];
  const nextId = Math.max(0, ...layers.map((l) => l.id)) + 1;
  const css = shadowValue(layers, kind);

  const update = (patch: Partial<ShadowLayer>) => setLayers((ls) => ls.map((l) => (l.id === layer?.id ? { ...l, ...patch } : l)));
  const unitOf = (l: Length) => l.unit || "px";
  const tw = `${kind === "box" ? "shadow" : "text-shadow"}-[${css.replace(/\s*,\s*/g, ",").replace(/ /g, "_")}]`;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Stage locale={locale} surface={surface} minHeight={320}>
          {kind === "box" ? (
            <div className="size-40 rounded-[16px] sm:size-48" style={{ background: boxColor, boxShadow: css }} role="img" aria-label={t.preview} />
          ) : (
            <p className="text-center text-6xl font-extrabold tracking-tight break-all sm:text-7xl" style={{ color: textColor, textShadow: css }}>
              {t.sample}
            </p>
          )}
        </Stage>

        <Panel className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t.layers}>
            {layers.map((l, i) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={l.id === layer?.id}
                onClick={() => setSel(l.id)}
                className={cn("chip h-8! px-3! text-[13px]!", l.id === layer?.id && "border-accent! text-accent!")}
              >
                {t.layer(i + 1)}
              </button>
            ))}
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={t.add}
              title={t.add}
              onClick={() => {
                setLayers((ls) => [...ls, { id: nextId, inset: false, x: { value: 0, unit: "" }, y: { value: 4, unit: "px" }, blur: { value: 12, unit: "px" }, spread: { value: 0, unit: "" }, color: "rgb(0 0 0 / 0.2)" }]);
                setSel(nextId);
              }}
            >
              <Plus />
            </Button>
          </div>

          {layer && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberSlider label={t.x} value={layer.x.value} min={-100} max={100} unit={unitOf(layer.x)} onChange={(v) => update({ x: setLen(layer.x, v) })} />
                <NumberSlider label={t.y} value={layer.y.value} min={-100} max={100} unit={unitOf(layer.y)} onChange={(v) => update({ y: setLen(layer.y, v) })} />
                <NumberSlider label={t.blur} value={layer.blur.value} min={0} max={150} unit={unitOf(layer.blur)} onChange={(v) => update({ blur: setLen(layer.blur, Math.max(0, v)) })} />
                {kind === "box" && <NumberSlider label={t.spread} value={layer.spread.value} min={-60} max={60} unit={unitOf(layer.spread)} onChange={(v) => update({ spread: setLen(layer.spread, v) })} />}
              </div>
              <ColorField label={t.color} value={layer.color} onChange={(v) => update({ color: v })} locale={locale} size="sm" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                {kind === "box" ? <Checkbox label={t.inset} checked={layer.inset} onChange={(e) => update({ inset: e.target.checked })} /> : <span />}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLayers((ls) => [...ls, { ...layer, id: nextId }]);
                      setSel(nextId);
                    }}
                  >
                    <Copy aria-hidden />
                    {t.duplicate}
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={t.remove} title={t.remove} onClick={() => setLayers((ls) => ls.filter((l) => l.id !== layer.id))}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </>
          )}
          <div className="border-t border-line pt-3">
            {kind === "box" ? (
              <ColorField label={t.box} value={boxColor} onChange={setBoxColor} locale={locale} size="sm" />
            ) : (
              <ColorField label={t.text} value={textColor} onChange={setTextColor} locale={locale} size="sm" />
            )}
          </div>
        </Panel>
      </div>

      <CodePanel
        locale={locale}
        tabs={[
          { id: "css", label: "CSS", code: shadowCss(layers, kind), filename: `${kind}-shadow.css` },
          { id: "tw", label: "Tailwind", code: tw },
        ]}
      />

      <Field label={t.paste} htmlFor={`${id}-paste`} hint={pasted?.error ? undefined : t.pasteHint} error={pasted?.error ? t.pasteError(pasted.error) : undefined}>
        <Textarea
          id={`${id}-paste`}
          rows={2}
          className="min-h-16!"
          value={paste}
          placeholder={kind === "box" ? "box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 #fff;" : "text-shadow: 1px 1px 2px hsl(0 0% 0% / 50%);"}
          onChange={(e) => {
            setPaste(e.target.value);
            const r = parseShadow(e.target.value, kind);
            if (e.target.value.trim() && !r.error) {
              setLayers(r.layers);
              setSel(r.layers[0]?.id ?? 0);
            }
          }}
        />
      </Field>
    </div>
  );
}
