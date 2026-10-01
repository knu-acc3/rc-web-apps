"use client";

import { Plus, X } from "lucide-react";
import { useId } from "react";
import { Button } from "@/ui/button";
import { Input, Select } from "@/ui/field";
import type { ToolProps } from "../../../types";
import { CURRENCIES, CURRENCY_SYMBOL, fmtMoney, fmtPct, isCurrency, type Currency } from "../../shared/fmt";
import { readNum } from "../../shared/num";
import { Explain, OptionsRow, ResultMain, Stack, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { PACK_UNITS, unitPrice, type PackUnit } from "../lib/money";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    items: "Товары для сравнения",
    name: "Название",
    price: "Цена",
    qty: "Количество",
    unit: "Единица",
    units: { g: "г", kg: "кг", ml: "мл", l: "л", pcs: "шт." } satisfies Record<PackUnit, string>,
    per: { kg: "за кг", l: "за литр", pcs: "за штуку" },
    per100: { kg: "за 100 г", l: "за 100 мл", pcs: "" },
    add: "Добавить товар",
    remove: "Удалить",
    best: "Выгоднее всего",
    sub: (name: string, save: string) => `${name}; дешевле самого дорогого на ${save}`,
    subOne: (name: string) => name,
    more: (p: string) => `дороже на ${p}`,
    cheapest: "самый выгодный",
    mixed: "Товары в разных единицах (вес, объём, штуки) сравниваются только внутри своей группы.",
    enter: "Введите цену и количество хотя бы для одного товара",
    item: (n: number) => `Товар ${n}`,
  },
  en: {
    items: "Items to compare",
    name: "Name",
    price: "Price",
    qty: "Quantity",
    unit: "Unit",
    units: { g: "g", kg: "kg", ml: "ml", l: "l", pcs: "pcs" } satisfies Record<PackUnit, string>,
    per: { kg: "per kg", l: "per litre", pcs: "per item" },
    per100: { kg: "per 100 g", l: "per 100 ml", pcs: "" },
    add: "Add item",
    remove: "Remove",
    best: "Best value",
    sub: (name: string, save: string) => `${name}; ${save} cheaper than the most expensive`,
    subOne: (name: string) => name,
    more: (p: string) => `${p} more expensive`,
    cheapest: "best value",
    mixed: "Items in different units (weight, volume, pieces) are only compared within their group.",
    enter: "Enter the price and quantity of at least one item",
    item: (n: number) => `Item ${n}`,
  },
} as const;

interface Item {
  name: string;
  price: string;
  qty: string;
  unit: PackUnit;
}

const SEP_ITEM = "|";
const SEP_FIELD = "~";
const clean = (s: string) => s.replace(/[|~]/g, " ");

function decode(s: string): Item[] {
  return s
    .split(SEP_ITEM)
    .filter(Boolean)
    .slice(0, 12)
    .map((chunk) => {
      const [price = "", qty = "", unit = "g", ...name] = chunk.split(SEP_FIELD);
      return { price, qty, unit: (PACK_UNITS as readonly string[]).includes(unit) ? (unit as PackUnit) : "g", name: name.join(" ") };
    });
}

function encode(items: Item[]): string {
  return items.map((i) => [clean(i.price), clean(i.qty), i.unit, clean(i.name)].join(SEP_FIELD)).join(SEP_ITEM);
}

export default function UnitPrice({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const defCur: Currency = ru ? "KZT" : "USD";
  const defaults: Item[] = ru
    ? [
        { name: "Пачка 450 г", price: "890", qty: "450", unit: "g" },
        { name: "Пачка 900 г", price: "1 590", qty: "900", unit: "g" },
        { name: "Упаковка 2 кг", price: "3 290", qty: "2", unit: "kg" },
      ]
    : [
        { name: "Small box", price: "3.49", qty: "12", unit: "pcs" },
        { name: "Family pack", price: "8.99", qty: "36", unit: "pcs" },
        { name: "Bulk", price: "21.50", qty: "96", unit: "pcs" },
      ];
  const q = useQueryState({ l: encode(defaults), c: defCur }, { enums: { c: CURRENCIES } });
  const cur = isCurrency(q.v.c) ? q.v.c : defCur;
  const sym = CURRENCY_SYMBOL[cur];
  const items = decode(q.v.l);
  const money = (v: number) => fmtMoney(locale, v, cur);

  const computed = items.map((it, i) => {
    const p = readNum(locale, it.price, { min: 0 });
    const n = readNum(locale, it.qty, { gt: 0 });
    const up = p.value !== null && n.value !== null ? unitPrice(p.value, n.value, it.unit) : null;
    return { ...it, index: i, up, bad: !!(p.error || n.error) };
  });
  const valid = computed.filter((c) => c.up);
  const bases = [...new Set(valid.map((c) => c.up!.base))];
  const mainBase = bases.length ? bases.sort((a, b) => valid.filter((c) => c.up!.base === b).length - valid.filter((c) => c.up!.base === a).length)[0] : null;
  const group = valid.filter((c) => c.up!.base === mainBase);
  const best = group.length ? group.reduce((a, b) => (b.up!.perBase < a.up!.perBase ? b : a)) : null;
  const worst = group.length ? group.reduce((a, b) => (b.up!.perBase > a.up!.perBase ? b : a)) : null;

  const set = (i: number, patch: Partial<Item>) => q.set({ l: encode(items.map((x, j) => (j === i ? { ...x, ...patch } : x))) });
  const perText = (base: "kg" | "l" | "pcs") => t.per[base];
  const label = (c: (typeof computed)[number]) => c.name.trim() || t.item(c.index + 1);

  return (
    <Stack>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-6">
        <section className="flex min-w-0 flex-col gap-3 rounded-[0.75rem] border border-line bg-surface p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-fg-2">{t.items}</h2>
          <ul className="flex flex-col gap-3">
            {computed.map((c, i) => (
              <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-b border-line pb-3 last:border-b-0 last:pb-0">
                <div className="grid min-w-0 grid-cols-2 gap-2 min-[520px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
                  <label className="col-span-2 min-w-0 min-[520px]:col-span-1">
                    <span className="sr-only">{`${t.name} ${i + 1}`}</span>
                    <Input value={c.name} onChange={(e) => set(i, { name: e.target.value })} placeholder={t.item(i + 1)} autoComplete="off" />
                  </label>
                  <label className="relative min-w-0">
                    <span className="sr-only">{`${t.price} ${i + 1}`}</span>
                    <Input value={c.price} onChange={(e) => set(i, { price: e.target.value })} inputMode="decimal" aria-invalid={c.bad} placeholder={t.price} className="tabular pr-7" autoComplete="off" />
                    <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-fg-3">
                      {sym}
                    </span>
                  </label>
                  <label className="min-w-0">
                    <span className="sr-only">{`${t.qty} ${i + 1}`}</span>
                    <Input value={c.qty} onChange={(e) => set(i, { qty: e.target.value })} inputMode="decimal" aria-invalid={c.bad} placeholder={t.qty} className="tabular" autoComplete="off" />
                  </label>
                  <label className="min-w-0">
                    <span className="sr-only">{`${t.unit} ${i + 1}`}</span>
                    <Select value={c.unit} onChange={(e) => set(i, { unit: e.target.value as PackUnit })}>
                      {PACK_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {t.units[u]}
                        </option>
                      ))}
                    </Select>
                  </label>
                  {c.up && (
                    <p className="tabular col-span-2 text-[0.8125rem] text-fg-3 min-[520px]:col-span-4">
                      <span className={best && c.index === best.index ? "font-semibold text-ok" : "text-fg-2"}>
                        {money(c.up.perBase)} {perText(c.up.base)}
                      </span>
                      {c.up.base !== "pcs" && ` · ${money(c.up.perBase / 10)} ${t.per100[c.up.base]}`}
                      {best && c.up.base === mainBase && (c.index === best.index ? ` · ${t.cheapest}` : ` · ${t.more(fmtPct(locale, (c.up.perBase / best.up!.perBase - 1) * 100, 1))}`)}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => q.set({ l: encode(items.filter((_, j) => j !== i)) })} aria-label={`${t.remove}: ${label(c)}`} title={t.remove} disabled={items.length <= 1}>
                  <X aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => q.set({ l: encode([...items, { name: "", price: "", qty: "", unit: items[items.length - 1]?.unit ?? "g" }]) })} disabled={items.length >= 12}>
              <Plus aria-hidden />
              {t.add}
            </Button>
            <OptionsRow>
              <CurrencySelect id={`${id}-c`} locale={locale} value={cur} onChange={(c) => q.set({ c })} />
            </OptionsRow>
          </div>
        </section>
        <div className="lg:sticky lg:top-20">
          <ResultMain
            label={t.best}
            value={best ? `${money(best.up!.perBase)} ${perText(best.up!.base)}` : "—"}
            sub={best ? (worst && worst.index !== best.index ? t.sub(label(best), fmtPct(locale, (1 - best.up!.perBase / worst.up!.perBase) * 100, 1)) : t.subOne(label(best))) : t.enter}
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          >
            {bases.length > 1 && <p className="mt-3 text-[0.8125rem] text-fg-2">{t.mixed}</p>}
          </ResultMain>
        </div>
      </div>
      {ru ? (
        <Explain
          locale={locale}
          formula={["Цена за кг = Цена / Вес в граммах × 1000", "Цена за литр = Цена / Объём в мл × 1000", "Переплата = Цена за единицу / Лучшая цена − 1"]}
          notes={["Граммы и килограммы приводятся к цене за килограмм, миллилитры и литры — к цене за литр, штуки сравниваются поштучно.", "Выгоднее тот товар, у которого ниже цена за единицу, — даже если сама упаковка дороже."]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Price per kg = Price / grams × 1000", "Price per litre = Price / ml × 1000", "Extra cost = Unit price / Best unit price − 1"]}
          notes={["Grams and kilograms are converted to a price per kilogram, millilitres and litres to a price per litre, pieces are compared per item.", "The better deal is the one with the lower unit price, even if the pack itself costs more."]}
        />
      )}
    </Stack>
  );
}
