"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { Field, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { ResultTiles, plainSpaces, type Tile } from "../ui";
import { FOOT_RANGE, SHOE_SYSTEMS, footFrom, sizeIn, sizeOptions, type ShoeGroup, type ShoeSystem } from "./engine";
import { GROUP_LABEL, SYSTEM_LABEL, shoeLabel } from "./format";

const T = {
  ru: {
    group: "Таблица",
    system: "Система",
    size: "Размер",
    foot: "Длина стопы, см",
    footTile: "Длина стопы",
    usOther: { men: "женский", women: "мужской" },
    range: (a: string, b: string) => `Введите длину стопы от ${a} до ${b} см`,
    note: "Ориентир по длине стопы: у брендов размеры отличаются на ½–1 номер. Российский размер указан как EU − 1 — так в большинстве таблиц, но некоторые бренды пишут RU = EU.",
    noteKids: "Для детской обуви добавьте к длине стопы запас 1–1,5 см. В России детские размеры совпадают с европейскими.",
    cm: "см",
  },
  en: {
    group: "Chart",
    system: "System",
    size: "Size",
    foot: "Foot length, cm",
    footTile: "Foot length",
    usOther: { men: "women's", women: "men's" },
    range: (a: string, b: string) => `Enter a foot length from ${a} to ${b} cm`,
    note: "A guide based on foot length: brands differ by ½–1 size. The Russian size is shown as EU − 1, as in most charts, but some brands label RU = EU.",
    noteKids: "For kids' shoes add 1–1.5 cm of room to the foot length. Russian children's sizes match EU.",
    cm: "cm",
  },
} as const;

const GROUPS: ShoeGroup[] = ["men", "women", "kids"];
const DEFAULT_EU: Record<ShoeGroup, number> = { men: 42, women: 38, kids: 25 };

interface Props {
  locale: Locale;
  group?: ShoeGroup;
  system?: ShoeSystem;
  value?: number;
}

export default function ShoeSize({ locale, group: g0 = "men", system: s0 = "eu", value = 42 }: Props) {
  const t = T[locale];
  const id = useId();
  const [group, setGroup] = useState<ShoeGroup>(g0);
  const [system, setSystem] = useState<ShoeSystem>(s0);
  const [foot, setFoot] = useState(() => footFrom(s0, value, g0));
  const [cmText, setCmText] = useState(() => plainSpaces(formatNumber(locale, footFrom(s0, value, g0), { maximumFractionDigits: 1 })));

  const [lo, hi] = FOOT_RANGE[group];
  const cmNum = parseNumber(cmText);
  const cmOk = cmNum !== null && cmNum >= lo && cmNum <= hi;
  const f = system === "cm" ? (cmOk ? cmNum : null) : foot;
  const n1 = (v: number) => plainSpaces(formatNumber(locale, v, { maximumFractionDigits: 1 }));

  function changeGroup(next: ShoeGroup) {
    const [a, b] = FOOT_RANGE[next];
    const keep = f !== null && f >= a && f <= b ? f : footFrom("eu", DEFAULT_EU[next], next);
    setGroup(next);
    setFoot(keep);
    setCmText(n1(keep));
  }

  function changeSystem(next: ShoeSystem) {
    if (f !== null) {
      setFoot(f);
      setCmText(n1(f));
    }
    setSystem(next);
  }

  const tiles: Tile[] = [];
  if (f !== null) {
    for (const s of SHOE_SYSTEMS) {
      if (s === system || s === "cm") continue;
      if (group === "kids" && s === "ru" && system === "eu") continue;
      const v = sizeIn(s, f, group);
      const hint =
        s === "us" && group !== "kids"
          ? `${t.usOther[group]}: ${shoeLabel(locale, "us", sizeIn("us", f, group === "men" ? "women" : "men"), group)}`
          : undefined;
      tiles.push({ label: SYSTEM_LABEL[locale][s], value: shoeLabel(locale, s, v, group), hint });
    }
    if (system !== "cm") tiles.push({ label: t.footTile, value: `${n1(f)} ${t.cm}`, hint: `Mondopoint ${shoeLabel(locale, "cm", sizeIn("cm", f, group), group)}` });
  }

  const options = system === "cm" ? [] : sizeOptions(system, group);
  const current = system === "cm" ? 0 : sizeIn(system, foot, group);

  return (
    <Panel className="p-4 sm:p-6">
      <Segmented
        size="sm"
        label={t.group}
        value={group}
        onChange={changeGroup}
        options={GROUPS.map((x) => ({ value: x, label: GROUP_LABEL[locale][x] }))}
      />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <Field label={t.system} htmlFor={`${id}-s`}>
          <Select id={`${id}-s`} value={system} onChange={(e) => changeSystem(e.target.value as ShoeSystem)} size="lg">
            {SHOE_SYSTEMS.map((s) => (
              <option key={s} value={s}>
                {SYSTEM_LABEL[locale][s]}
              </option>
            ))}
          </Select>
        </Field>
        {system === "cm" ? (
          <Field label={t.foot} htmlFor={`${id}-v`} error={cmText.trim() && !cmOk ? t.range(n1(lo), n1(hi)) : undefined}>
            <Input
              id={`${id}-v`}
              inputMode="decimal"
              autoComplete="off"
              value={cmText}
              onChange={(e) => setCmText(e.target.value)}
              aria-invalid={!!cmText.trim() && !cmOk}
              size="lg"
              className="tabular"
            />
          </Field>
        ) : (
          <Field label={t.size} htmlFor={`${id}-v`}>
            <Select id={`${id}-v`} value={String(current)} onChange={(e) => setFoot(footFrom(system, Number(e.target.value), group))} size="lg">
              {options.map((v) => (
                <option key={v} value={String(v)}>
                  {shoeLabel(locale, system, v, group)}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <div className="mt-5" aria-live="polite">
        {tiles.length > 0 && <ResultTiles items={tiles} />}
      </div>
      <p className="mt-4 text-sm text-fg-3">{group === "kids" ? t.noteKids : t.note}</p>
    </Panel>
  );
}
