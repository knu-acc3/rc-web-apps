"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId, useState, type CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/button";
import { Field, Input, Select, Textarea } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { ScrollRow } from "@/ui/scroll-row";
import { areaNames, DEFAULT_GRID, gridCss, gridHtml, gridItem, gridItemDecls, validateAreas, type GridItem, type GridState } from "./lib/layout";
import { CodePanel, NumberSlider, Stage } from "./ui/kit";

const T = {
  ru: {
    container: "Сетка",
    columns: "grid-template-columns",
    rows: "grid-template-rows",
    areas: "grid-template-areas — по строке на ряд, «.» — пустая ячейка",
    areasError: {
      rows: "В каждой строке должно быть одинаковое число ячеек",
      shape: (n: string) => `Область «${n}» должна быть прямоугольником`,
      name: (n: string) => `Недопустимое имя области «${n}»`,
    },
    gap: "Отступ gap",
    justify: "justify-items",
    align: "align-items",
    add: "Добавить элемент",
    remove: "Удалить выбранный элемент",
    item: (n: number) => `Элемент ${n}`,
    selected: (n: number) => `Настройки элемента ${n}`,
    label: "Текст",
    area: "grid-area",
    none: "— нет —",
    column: "grid-column",
    row: "grid-row",
    items: "Элементы",
  },
  en: {
    container: "Grid",
    columns: "grid-template-columns",
    rows: "grid-template-rows",
    areas: "grid-template-areas — one line per row, “.” is an empty cell",
    areasError: {
      rows: "Every row must have the same number of cells",
      shape: (n: string) => `Area “${n}” must be a rectangle`,
      name: (n: string) => `Invalid area name “${n}”`,
    },
    gap: "Gap",
    justify: "justify-items",
    align: "align-items",
    add: "Add item",
    remove: "Remove the selected item",
    item: (n: number) => `Item ${n}`,
    selected: (n: number) => `Item ${n} settings`,
    label: "Text",
    area: "grid-area",
    none: "— none —",
    column: "grid-column",
    row: "grid-row",
    items: "Items",
  },
} as const;

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6"];
const COLUMN_PRESETS = ["repeat(3, 1fr)", "repeat(12, 1fr)", "repeat(auto-fit, minmax(160px, 1fr))", "200px 1fr", "1fr 2fr", "1fr min(60ch, 100%) 1fr"];

const toText = (areas: string[][]) => areas.map((r) => r.join(" ")).join("\n");
const fromText = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
    .map((l) => l.split(/\s+/));

export default function GridGenerator({ locale, recipe }: { locale: Locale; recipe?: GridState }) {
  const t = T[locale];
  const id = useId();
  const [s, setS] = useState<GridState>(() => recipe ?? DEFAULT_GRID);
  const [areasText, setAreasText] = useState(() => toText((recipe ?? DEFAULT_GRID).areas));
  const [sel, setSel] = useState<number>(() => (recipe ?? DEFAULT_GRID).items[0]?.id ?? 0);
  const set = (patch: Partial<GridState>) => setS((x) => ({ ...x, ...patch }));
  const item = s.items.find((x) => x.id === sel);
  const index = s.items.findIndex((x) => x.id === sel);
  const setItem = (patch: Partial<GridItem>) => setS((x) => ({ ...x, items: x.items.map((it) => (it.id === sel ? { ...it, ...patch } : it)) }));
  const nextId = Math.max(0, ...s.items.map((x) => x.id)) + 1;
  const check = validateAreas(fromText(areasText));
  const areasError = check.ok ? null : check.error === "rows" ? t.areasError.rows : check.error === "shape" ? t.areasError.shape(check.name ?? "") : t.areasError.name(check.name ?? "");
  const names = areaNames(s.areas);

  const container: CSSProperties = {
    display: "grid",
    gridTemplateColumns: s.columns || undefined,
    gridTemplateRows: s.rows || undefined,
    gridTemplateAreas: s.areas.length && check.ok ? s.areas.map((r) => `"${r.join(" ")}"`).join(" ") : undefined,
    gap: s.gap,
    justifyItems: s.justifyItems,
    alignItems: s.alignItems,
    minHeight: 240,
    width: "100%",
  };

  const itemStyle = (it: GridItem): CSSProperties => {
    const d = gridItemDecls(it, s.areas);
    const style: CSSProperties = {};
    for (const decl of d) {
      const [prop, val] = decl.replace(/;$/, "").split(/:\s*/);
      if (prop === "grid-area") style.gridArea = val;
      if (prop === "grid-column") style.gridColumn = val;
      if (prop === "grid-row") style.gridRow = val;
    }
    return style;
  };

  return (
    <div className="flex flex-col gap-4">
      <Stage locale={locale} minHeight={280} switcher={false} className="[&>div]:items-stretch [&>div]:p-3!">
        <div style={container} className="rounded-[0.625rem] border-2 border-dashed border-zinc-300 bg-white p-2">
          {s.items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setSel(it.id)}
              aria-pressed={it.id === sel}
              aria-label={t.item(i + 1)}
              className={cn("min-h-12 min-w-0 rounded-[0.5rem] px-3 py-2 text-left text-sm font-medium break-words text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97]", it.id === sel && "ring-3 ring-zinc-900 ring-offset-2")}
              style={{ background: COLORS[i % COLORS.length], ...itemStyle(it) }}
            >
              {it.label}
            </button>
          ))}
        </div>
      </Stage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="flex flex-col gap-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-fg">{t.container}</h2>
          <Field label={<code className="text-[0.8125rem]">{t.columns}</code>} htmlFor={`${id}-c`}>
            <Input id={`${id}-c`} value={s.columns} onChange={(e) => set({ columns: e.target.value })} className="font-mono" size="sm" autoComplete="off" />
            <ScrollRow label={t.columns} rowClassName="gap-1.5">
              {COLUMN_PRESETS.map((p) => (
                <button key={p} type="button" aria-pressed={s.columns === p} onClick={() => set({ columns: p })} className="chip shrink-0 font-mono text-[0.8125rem]!">
                  {p}
                </button>
              ))}
            </ScrollRow>
          </Field>
          <Field label={<code className="text-[0.8125rem]">{t.rows}</code>} htmlFor={`${id}-r`}>
            <Input id={`${id}-r`} value={s.rows} onChange={(e) => set({ rows: e.target.value })} className="font-mono" size="sm" placeholder="auto 1fr auto" autoComplete="off" />
          </Field>
          <Field label={t.areas} htmlFor={`${id}-ar`} error={areasError ?? undefined}>
            <Textarea
              id={`${id}-ar`}
              rows={3}
              className="min-h-20! max-sm:text-base"
              value={areasText}
              placeholder={"header header\nsidebar main"}
              onChange={(e) => {
                setAreasText(e.target.value);
                const a = fromText(e.target.value);
                if (validateAreas(a).ok) set({ areas: a });
              }}
            />
          </Field>
          <NumberSlider label={t.gap} value={s.gap} min={0} max={64} onChange={(v) => set({ gap: Math.max(0, v) })} unit="px" />
          <div className="grid grid-cols-2 gap-3">
            <Field label={<code className="text-[0.8125rem]">{t.justify}</code>} htmlFor={`${id}-ji`}>
              <Select id={`${id}-ji`} value={s.justifyItems} onChange={(e) => set({ justifyItems: e.target.value as GridState["justifyItems"] })} size="sm">
                {["stretch", "start", "end", "center"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label={<code className="text-[0.8125rem]">{t.align}</code>} htmlFor={`${id}-ai`}>
              <Select id={`${id}-ai`} value={s.alignItems} onChange={(e) => set({ alignItems: e.target.value as GridState["alignItems"] })} size="sm">
                {["stretch", "start", "end", "center"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
          </div>
        </Panel>

        <Panel className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-fg">{item ? t.selected(index + 1) : t.items}</h2>
            <div className="flex gap-1">
              <IconButton
                variant="tonal"
                label={t.add}
                icon={<Plus aria-hidden />}
                disabled={s.items.length >= 24}
                onClick={() => {
                  setS((x) => ({ ...x, items: [...x.items, gridItem(nextId, String(x.items.length + 1))] }));
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
              {names.length > 0 && (
                <Field label={<code className="text-[0.8125rem]">{t.area}</code>} htmlFor={`${id}-ga`}>
                  <Select id={`${id}-ga`} value={item.area} onChange={(e) => setItem({ area: e.target.value })} size="sm">
                    <option value="">{t.none}</option>
                    {names.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label={<code className="text-[0.8125rem]">{t.column}</code>} htmlFor={`${id}-gc`}>
                  <Input id={`${id}-gc`} value={item.column} onChange={(e) => setItem({ column: e.target.value })} placeholder="span 2" className="font-mono" size="sm" disabled={!!item.area && names.includes(item.area)} />
                </Field>
                <Field label={<code className="text-[0.8125rem]">{t.row}</code>} htmlFor={`${id}-gr`}>
                  <Input id={`${id}-gr`} value={item.row} onChange={(e) => setItem({ row: e.target.value })} placeholder="1 / 3" className="font-mono" size="sm" disabled={!!item.area && names.includes(item.area)} />
                </Field>
              </div>
            </>
          )}
        </Panel>
      </div>

      <CodePanel
        locale={locale}
        tabs={[
          { id: "css", label: "CSS", code: gridCss(s), filename: "grid.css" },
          { id: "html", label: "HTML", code: gridHtml(s), filename: "grid.html" },
        ]}
      />
    </div>
  );
}
