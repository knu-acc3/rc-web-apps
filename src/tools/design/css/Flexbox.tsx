"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId, useState, type CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/button";
import { Field, Input, Select, Switch } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Panel } from "@/ui/panel";
import { DEFAULT_FLEX, flexCss, flexHtml, flexItem, type FlexItem, type FlexState } from "./lib/layout";
import { CodePanel, NumberSlider, Stage } from "./ui/kit";

const T = {
  ru: {
    container: "Контейнер",
    direction: "flex-direction",
    wrap: "flex-wrap",
    justify: "justify-content",
    alignItems: "align-items",
    alignContent: "align-content",
    gap: "Отступ gap",
    items: "Элементы",
    item: (n: number) => `Элемент ${n}`,
    add: "Добавить элемент",
    remove: "Удалить выбранный элемент",
    selected: (n: number) => `Настройки элемента ${n}`,
    grow: "flex-grow",
    shrink: "flex-shrink",
    basis: "flex-basis",
    order: "order",
    alignSelf: "align-self",
    push: "Прижать к концу (margin-inline-start: auto)",
    label: "Текст",
  },
  en: {
    container: "Container",
    direction: "flex-direction",
    wrap: "flex-wrap",
    justify: "justify-content",
    alignItems: "align-items",
    alignContent: "align-content",
    gap: "Gap",
    items: "Items",
    item: (n: number) => `Item ${n}`,
    add: "Add item",
    remove: "Remove the selected item",
    selected: (n: number) => `Item ${n} settings`,
    grow: "flex-grow",
    shrink: "flex-shrink",
    basis: "flex-basis",
    order: "order",
    alignSelf: "align-self",
    push: "Push to the end (margin-inline-start: auto)",
    label: "Text",
  },
} as const;

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6"];

function Choice<V extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: V; options: readonly V[]; onChange: (v: V) => void }) {
  return (
    <Field label={<code className="text-[0.8125rem]">{label}</code>} htmlFor={id}>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value as V)} size="sm">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export default function FlexboxGenerator({ locale, recipe }: { locale: Locale; recipe?: FlexState }) {
  const t = T[locale];
  const id = useId();
  const [s, setS] = useState<FlexState>(() => recipe ?? DEFAULT_FLEX);
  const [sel, setSel] = useState<number>(() => (recipe ?? DEFAULT_FLEX).items[0]?.id ?? 0);
  const set = (patch: Partial<FlexState>) => setS((x) => ({ ...x, ...patch }));
  const item = s.items.find((x) => x.id === sel);
  const index = s.items.findIndex((x) => x.id === sel);
  const setItem = (patch: Partial<FlexItem>) => setS((x) => ({ ...x, items: x.items.map((it) => (it.id === sel ? { ...it, ...patch } : it)) }));
  const nextId = Math.max(0, ...s.items.map((x) => x.id)) + 1;

  const container: CSSProperties = {
    display: "flex",
    flexDirection: s.direction,
    flexWrap: s.wrap,
    justifyContent: s.justify,
    alignItems: s.alignItems,
    alignContent: s.wrap !== "nowrap" && s.alignContent !== "normal" ? s.alignContent : undefined,
    gap: s.gap,
    minHeight: s.minHeight || 220,
    width: "100%",
  };

  return (
    <div className="flex flex-col gap-4">
      <Stage locale={locale} minHeight={260} switcher={false} className="[&>div]:items-stretch [&>div]:p-3!">
        <div style={container} className="rounded-[0.625rem] border-2 border-dashed border-zinc-300 bg-white p-2">
          {s.items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setSel(it.id)}
              aria-pressed={it.id === sel}
              aria-label={t.item(i + 1)}
              className={cn("min-h-12 min-w-12 rounded-[0.5rem] px-3 py-2 text-left text-sm font-medium text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97]", it.id === sel && "ring-3 ring-zinc-900 ring-offset-2")}
              style={{
                background: COLORS[i % COLORS.length],
                flexGrow: it.grow,
                flexShrink: it.shrink,
                flexBasis: it.basis,
                order: it.order,
                alignSelf: it.alignSelf === "auto" ? undefined : it.alignSelf,
                marginInlineStart: it.push ? "auto" : undefined,
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      </Stage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="flex flex-col gap-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-fg">{t.container}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Choice id={`${id}-d`} label={t.direction} value={s.direction} options={["row", "row-reverse", "column", "column-reverse"] as const} onChange={(v) => set({ direction: v })} />
            <Choice id={`${id}-w`} label={t.wrap} value={s.wrap} options={["nowrap", "wrap", "wrap-reverse"] as const} onChange={(v) => set({ wrap: v })} />
            <Choice id={`${id}-j`} label={t.justify} value={s.justify} options={["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"] as const} onChange={(v) => set({ justify: v })} />
            <Choice id={`${id}-a`} label={t.alignItems} value={s.alignItems} options={["stretch", "flex-start", "flex-end", "center", "baseline"] as const} onChange={(v) => set({ alignItems: v })} />
            {s.wrap !== "nowrap" && (
              <Choice id={`${id}-ac`} label={t.alignContent} value={s.alignContent} options={["normal", "flex-start", "flex-end", "center", "space-between", "space-around", "stretch"] as const} onChange={(v) => set({ alignContent: v })} />
            )}
          </div>
          <NumberSlider label={t.gap} value={s.gap} min={0} max={64} onChange={(v) => set({ gap: Math.max(0, v) })} unit="px" />
        </Panel>

        <Panel className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-fg">{item ? t.selected(index + 1) : t.items}</h2>
            <div className="flex gap-1">
              <IconButton
                variant="tonal"
                label={t.add}
                icon={<Plus aria-hidden />}
                disabled={s.items.length >= 12}
                onClick={() => {
                  setS((x) => ({ ...x, items: [...x.items, flexItem(nextId, String(x.items.length + 1))] }));
                  setSel(nextId);
                }}
              />
              <IconButton
                label={t.remove}
                icon={<Trash2 aria-hidden />}
                disabled={!item || s.items.length <= 1}
                onClick={() => {
                  const rest = s.items.filter((x) => x.id !== sel);
                  set({ items: rest });
                  setSel(rest[Math.max(0, index - 1)]?.id ?? 0);
                }}
              />
            </div>
          </div>
          {item && (
            <>
              <Field label={t.label} htmlFor={`${id}-l`}>
                <Input id={`${id}-l`} value={item.label} onChange={(e) => setItem({ label: e.target.value })} size="sm" />
              </Field>
              <div className="grid grid-cols-1 gap-3 min-[26rem]:grid-cols-3">
                <Field label={<code className="text-[0.8125rem]">{t.grow}</code>} htmlFor={`${id}-g`}>
                  <NumberInput id={`${id}-g`} value={item.grow} min={0} max={99} onChange={(v) => setItem({ grow: Math.max(0, v ?? 0) })} size="sm" />
                </Field>
                <Field label={<code className="text-[0.8125rem]">{t.shrink}</code>} htmlFor={`${id}-s`}>
                  <NumberInput id={`${id}-s`} value={item.shrink} min={0} max={99} onChange={(v) => setItem({ shrink: Math.max(0, v ?? 0) })} size="sm" />
                </Field>
                <Field label={<code className="text-[0.8125rem]">{t.order}</code>} htmlFor={`${id}-o`}>
                  <NumberInput id={`${id}-o`} value={item.order} min={-99} max={99} onChange={(v) => setItem({ order: v ?? 0 })} size="sm" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={<code className="text-[0.8125rem]">{t.basis}</code>} htmlFor={`${id}-b`}>
                  <Input id={`${id}-b`} value={item.basis} onChange={(e) => setItem({ basis: e.target.value.trim() || "auto" })} size="sm" className="font-mono" />
                </Field>
                <Choice id={`${id}-as`} label={t.alignSelf} value={item.alignSelf} options={["auto", "flex-start", "flex-end", "center", "stretch", "baseline"] as const} onChange={(v) => setItem({ alignSelf: v })} />
              </div>
              <Switch label={t.push} checked={item.push} onChange={(e) => setItem({ push: e.target.checked })} />
            </>
          )}
        </Panel>
      </div>

      <CodePanel
        locale={locale}
        tabs={[
          { id: "css", label: "CSS", code: flexCss(s), filename: "flexbox.css" },
          { id: "html", label: "HTML", code: flexHtml(s), filename: "flexbox.html" },
        ]}
      />
    </div>
  );
}
