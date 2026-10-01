"use client";

import { useId } from "react";
import { CopyButton } from "@/ui/copy-button";
import { ScrollRow } from "@/ui/scroll-row";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../../types";
import type { Q } from "../algebra/rational";
import { CalcGrid, DataTable, Explain, InlineSelect, NumField, NumSlider, OptionsRow, ResultMain, Stack, SubHeading, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { decimalText, parseDecimal, ROUND_MODES, roundDecimals, roundSignificant, roundTo, type RoundMode } from "../numbers/engines";

const KINDS = ["decimals", "significant", "step"] as const;
const STEP_PRESETS = ["0.01", "0.1", "0.5", "1", "5", "10", "50", "100", "1000"] as const;
type Kind = (typeof KINDS)[number];

const T = {
  ru: {
    number: "Число",
    kind: "Как округлять",
    kinds: { decimals: "До знаков после запятой", significant: "До значащих цифр", step: "До разряда или шага" } satisfies Record<Kind, string>,
    decimals: "Знаков после запятой",
    significant: "Значащих цифр",
    step: "Шаг",
    method: "Правило",
    methods: {
      "half-up": "математическое (0,5 — от нуля)",
      "half-even": "банковское (0,5 — к чётному)",
      "half-down": "0,5 — к нулю",
      floor: "вниз (к −∞)",
      ceil: "вверх (к +∞)",
      trunc: "отбросить дробную часть",
    } satisfies Record<RoundMode, string>,
    result: "Результат",
    enter: "Введите число",
    bad: "Введите число, например 2,675",
    table: "Округление до разных знаков",
    places: "Знаков",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    number: "Number",
    kind: "Round to",
    kinds: { decimals: "Decimal places", significant: "Significant figures", step: "Nearest 10, 100 or any step" } satisfies Record<Kind, string>,
    decimals: "Decimal places",
    significant: "Significant figures",
    step: "Step",
    method: "Rule",
    methods: {
      "half-up": "half up (away from zero)",
      "half-even": "banker's (half to even)",
      "half-down": "half towards zero",
      floor: "down (floor)",
      ceil: "up (ceiling)",
      trunc: "truncate",
    } satisfies Record<RoundMode, string>,
    result: "Result",
    enter: "Enter a number",
    bad: "Enter a number such as 2.675",
    table: "Rounded to different places",
    places: "Places",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

export default function Rounding({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const sep = ru ? "," : ".";
  const q = useQueryState({ x: ru ? "2,675" : "2.675", k: "decimals", d: "2", s: "3", st: "10", r: "half-up" }, { enums: { k: KINDS, r: ROUND_MODES } });
  const kind = q.v.k as Kind;
  const mode = q.v.r as RoundMode;
  const x = parseDecimal(q.v.x);
  const d = /^\d{1,2}$/.test(q.v.d.trim()) ? Number(q.v.d) : null;
  const s = /^\d{1,2}$/.test(q.v.s.trim()) && Number(q.v.s) > 0 ? Number(q.v.s) : null;
  const st = parseDecimal(q.v.st);
  const stepOk = st !== null && st.n > 0n;
  let r: Q | null = null;
  if (x) {
    if (kind === "decimals" && d !== null) r = roundDecimals(x, d, mode);
    if (kind === "significant" && s !== null) r = roundSignificant(x, s, mode);
    if (kind === "step" && stepOk) r = roundTo(x, st!, mode);
  }
  const text = r ? decimalText(r, sep) : null;
  const pretty = (v: string) => {
    const [i, f] = v.split(sep);
    const neg = i.startsWith("-");
    const grouped = (neg ? i.slice(1) : i).replace(/\B(?=(\d{3})+(?!\d))/g, ru ? " " : ",");
    return `${neg ? "−" : ""}${grouped}${f !== undefined ? sep + f : ""}`;
  };

  return (
    <Stack>
      <CalcGrid
        inputs={
          <>
            <NumField id={`${id}-x`} label={t.number} value={q.v.x} onChange={(v) => q.set({ x: v })} error={q.v.x.trim() && !x ? t.bad : undefined} size="lg" />
            <Segmented label={t.kind} fill value={kind} onChange={(k) => q.set({ k })} options={KINDS.map((k) => ({ value: k, label: t.kinds[k] }))} wrap />
            {kind === "decimals" && <NumSlider id={`${id}-d`} locale={locale} label={t.decimals} value={q.v.d} onChange={(v) => q.set({ d: v })} min={0} max={10} error={d === null && q.v.d.trim() ? "0–99" : undefined} />}
            {kind === "significant" && <NumSlider id={`${id}-s`} locale={locale} label={t.significant} value={q.v.s} onChange={(v) => q.set({ s: v })} min={1} max={15} error={s === null && q.v.s.trim() ? "1–99" : undefined} />}
            {kind === "step" && (
              <div className="flex flex-col gap-2">
                <NumField id={`${id}-st`} label={t.step} value={q.v.st} onChange={(v) => q.set({ st: v })} error={q.v.st.trim() && !stepOk ? t.bad : undefined} />
                <ScrollRow label={t.step} rowClassName="gap-2">
                  {STEP_PRESETS.map((p) => {
                    const v = ru ? p.replace(".", ",") : p;
                    return (
                      <button key={p} type="button" className="chip shrink-0 tabular" aria-pressed={q.v.st.trim() === v} onClick={() => q.set({ st: v })}>
                        {ru ? v.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : v.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </button>
                    );
                  })}
                </ScrollRow>
              </div>
            )}
            <OptionsRow>
              <InlineSelect id={`${id}-r`} label={t.method} value={mode} onChange={(v) => q.set({ r: v })} options={ROUND_MODES.map((m) => ({ value: m, label: t.methods[m] }))} />
            </OptionsRow>
          </>
        }
        result={
          <ResultMain
            label={t.result}
            value={text ? <span className="break-all">{pretty(text)}</span> : "—"}
            sub={text ? t.methods[mode] : x ? undefined : t.enter}
            actions={
              <ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl}>
                {text && <CopyButton value={text} label={t.copy} copiedLabel={t.copied} variant="elevated" />}
              </ToolActions>
            }
          />
        }
      />
      {x && (
        <section>
          <SubHeading>{t.table}</SubHeading>
          <DataTable
            caption={t.table}
            head={[t.places, ...(["half-up", "half-even", "floor", "ceil"] as const).map((m) => t.methods[m])]}
            rows={[0, 1, 2, 3, 4, 5, 6].map((p) => [String(p), ...(["half-up", "half-even", "floor", "ceil"] as const).map((m) => pretty(decimalText(roundDecimals(x, p, m), sep)))])}
          />
        </section>
      )}
      {ru ? (
        <Explain
          locale={locale}
          formula={["2,675 → 2,68 (математическое)", "2,5 → 2 и 3,5 → 4 (банковское)", "123 456 → 120 000 (2 значащие цифры)", "1 234 → 1 200 (до сотен)"]}
          notes={[
            "Число обрабатывается как точная десятичная запись, без двоичной погрешности: 1,005 округляется до 1,01, а не до 1,00, как в некоторых программах.",
            "Математическое округление отводит половину от нуля (−2,5 → −3). Банковское округляет половину к ближайшему чётному и не накапливает смещение при суммировании многих значений.",
            "Округление «вниз» и «вверх» — к меньшему и большему целому шагу (floor и ceil), «отбросить» — просто убирает лишние цифры.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["2.675 → 2.68 (half up)", "2.5 → 2 and 3.5 → 4 (banker's)", "123,456 → 120,000 (2 significant figures)", "1,234 → 1,200 (nearest hundred)"]}
          notes={[
            "The number is handled as an exact decimal, without binary floating-point error: 1.005 rounds to 1.01, not 1.00 as in some software.",
            "Half up rounds halves away from zero (−2.5 → −3). Banker's rounding sends halves to the nearest even digit and avoids bias when many values are summed.",
            "Down and up round to the lower and higher step (floor and ceiling); truncate simply drops the extra digits.",
          ]}
        />
      )}
    </Stack>
  );
}
