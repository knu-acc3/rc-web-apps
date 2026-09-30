import type { Locale } from "@/i18n/config";
import type { QA, ToolDef, VariantDef } from "@/registry/types";
import { nf, tt } from "../shared";
import { heightFor, megapixels, physicalSize, resolutionName, roundEven, widthFor } from "../screen/engine";
import { ratioLabel } from "../screen/text";
import { RATIOS, type RatioDef } from "./data";

const lbl = (r: RatioDef) => `${r.w}:${r.h}`;
const x = (w: number, h: number) => `${w} × ${h}`;
/** Three representative resolutions (small, common, large). */
const sample = (r: RatioDef) => {
  const n = r.res.length;
  const pick = n <= 4 ? r.res.slice(0, 3) : [r.res[1], r.res[Math.floor(n / 2)], r.res[n - 1]];
  return pick.map(([w, h]) => x(w, h)).join(", ");
};
/** Append the longest tail that keeps a meta description within 160 characters. */
const fit = (base: string, ...tails: string[]) => base + (tails.find((t) => base.length + t.length <= 160) ?? "");

function ratioVariant(r: RatioDef): VariantDef {
  const dec = r.w / r.h;
  const [ex1, ex2] = [r.res[Math.min(1, r.res.length - 1)], r.res[Math.min(3, r.res.length - 1)]];
  const main = r.res.find(([w, h]) => w === 1920 || w === 1080 || h === 1080) ?? r.res[Math.floor(r.res.length / 2)];
  const refW = r.h > r.w ? 1080 : 1920;
  const refH = heightFor(r.w, r.h, refW);
  const t = (l: Locale) => ({
    title: tt(l, `Соотношение сторон ${lbl(r)}: разрешения и калькулятор`, `${lbl(r)} aspect ratio: resolutions and calculator`),
    h1: tt(l, `Соотношение сторон ${lbl(r)}`, `${lbl(r)} aspect ratio`),
    description: fit(
      tt(l, `${lbl(r)} (${nf(l, dec, 3)}:1) — ${r.short.ru}. Разрешения: ${sample(r)}.`, `${lbl(r)} (${nf(l, dec, 3)}:1) is ${r.short.en}. Resolutions: ${sample(r)}.`),
      tt(l, " Калькулятор второй стороны с округлением до чётного.", " Missing-side calculator with even rounding."),
      tt(l, " Калькулятор второй стороны.", " Missing-side calculator."),
    ),
    lead: tt(
      l,
      `${lbl(r)} = ${nf(l, dec, 4)}:1. Например, ${x(ex1[0], ex1[1])} и ${x(ex2[0], ex2[1])}.`,
      `${lbl(r)} = ${nf(l, dec, 4)}:1 — for example ${x(ex1[0], ex1[1])} and ${x(ex2[0], ex2[1])}.`,
    ),
  });
  const [w27, h27] = physicalSize(r.w, r.h, 27);
  const faq = (l: Locale): QA[] => {
    const out: QA[] = [
      {
        q: tt(l, `Как посчитать высоту для ${lbl(r)}?`, `How do I calculate the height for ${lbl(r)}?`),
        a: tt(
          l,
          `Высота = ширина × ${r.h} / ${r.w}. Для ширины ${refW}: ${refW} × ${r.h} / ${r.w} = ${nf(l, refH, 3)}${Number.isInteger(refH) ? "" : `, для видео округляют до чётного — ${roundEven(refH)}`}.`,
          `Height = width × ${r.h} / ${r.w}. For a width of ${refW}: ${refW} × ${r.h} / ${r.w} = ${nf(l, refH, 3)}${Number.isInteger(refH) ? "" : `; for video round to even — ${roundEven(refH)}`}.`,
        ),
      },
      {
        q: tt(l, `Какие разрешения имеют соотношение ${lbl(r)}?`, `Which resolutions are ${lbl(r)}?`),
        a: tt(l, `${r.res.map(([w, h]) => x(w, h)).join(", ")}. ${r.uses.ru}`, `${r.res.map(([w, h]) => x(w, h)).join(", ")}. ${r.uses.en}`),
      },
    ];
    if (r.slug === "21-9")
      out.push({
        q: tt(l, "Почему 2560 × 1080 — не ровно 21:9?", "Why isn't 2560 × 1080 exactly 21:9?"),
        a: tt(
          l,
          "Экран сочетает высоту Full HD (1080) и ширину QHD (2560), поэтому точная пропорция — 64:27 = 2,370:1, а «21:9» (2,333:1) — округлённое маркетинговое название.",
          "The panel combines the Full HD height (1080) with the QHD width (2560), so the exact ratio is 64:27 = 2.370:1, and “21:9” (2.333:1) is a rounded marketing name.",
        ),
      });
    else
      out.push({
        q: tt(l, `Какого размера экран ${lbl(r)} с диагональю 27″?`, `How big is a 27″ ${lbl(r)} screen?`),
        a: tt(
          l,
          `${nf(l, w27 * 2.54, 1)} × ${nf(l, h27 * 2.54, 1)} см (${nf(l, w27, 1)} × ${nf(l, h27, 1)}″). Ширина = диагональ × ${r.w} / √(${r.w}² + ${r.h}²).`,
          `${nf(l, w27 * 2.54, 1)} × ${nf(l, h27 * 2.54, 1)} cm (${nf(l, w27, 1)} × ${nf(l, h27, 1)}″). Width = diagonal × ${r.w} / √(${r.w}² + ${r.h}²).`,
        ),
      });
    return out;
  };
  const ru = t("ru");
  const en = t("en");
  return {
    slug: r.slug,
    name: { ru: lbl(r), en: lbl(r) },
    title: { ru: ru.title, en: en.title },
    h1: { ru: ru.h1, en: en.h1 },
    description: { ru: ru.description, en: en.description },
    lead: { ru: ru.lead, en: en.lead },
    props: { w: main[0], h: main[1], scale: r.h > r.w ? 720 : 1280 },
    keywords: { ru: [`${lbl(r)} разрешение`, `соотношение ${lbl(r)}`, `${lbl(r)} калькулятор`], en: [`${lbl(r)} resolutions`, `${lbl(r)} calculator`, `${lbl(r)} aspect ratio`] },
    blocks: (l) => [
      {
        type: "facts",
        title: tt(l, `${lbl(r)} в цифрах`, `${lbl(r)} in numbers`),
        rows: [
          [tt(l, "Десятичная запись", "Decimal"), `${nf(l, dec, 4)}:1`],
          [tt(l, "Обратная пропорция", "Rotated"), `${r.h}:${r.w}`],
          [tt(l, `Высота при ширине ${refW}`, `Height at width ${refW}`), nf(l, refH, 3)],
          [tt(l, `Ширина при высоте 1080`, "Width at height 1080"), nf(l, widthFor(r.w, r.h, 1080), 3)],
          [tt(l, "Экран 27″ этого формата", "27″ screen of this ratio"), `${nf(l, w27 * 2.54, 1)} × ${nf(l, h27 * 2.54, 1)} ${tt(l, "см", "cm")}`],
        ],
      },
      {
        type: "table",
        title: tt(l, `Разрешения ${lbl(r)}`, `${lbl(r)} resolutions`),
        head: [tt(l, "Разрешение", "Resolution"), tt(l, "Название", "Name"), tt(l, "Точная пропорция", "Exact ratio"), tt(l, "Мегапиксели", "Megapixels")],
        rows: r.res.map(([w, h]) => [x(w, h), resolutionName(w, h) ?? "—", ratioLabel(l, w, h), nf(l, megapixels(w, h), 2)]),
      },
      { type: "text", title: tt(l, `Где используется ${lbl(r)}`, `Where ${lbl(r)} is used`), paragraphs: [r.uses[l]] },
    ],
    faq: { ru: faq("ru"), en: faq("en") },
  };
}

export const ratioTool: ToolDef = {
  slug: "aspect-ratio-calculator",
  component: "sizes/ratio",
  icon: "RectangleHorizontal",
  name: { ru: "Соотношение сторон", en: "Aspect ratio" },
  title: { ru: "Калькулятор соотношения сторон: 16:9, 4:3, 21:9 и другие", en: "Aspect ratio calculator: 16:9, 4:3, 21:9 and more" },
  h1: { ru: "Калькулятор соотношения сторон", en: "Aspect ratio calculator" },
  description: {
    ru: "Калькулятор соотношения сторон: сокращает 1920 × 1080 до 16:9, считает вторую сторону по пропорции и округляет до чётного для видео. 1366 × 768 ≈ 16:9, 2560 × 1080 = 64:27.",
    en: "Aspect ratio calculator: reduces 1920 × 1080 to 16:9, finds the missing side and rounds to even numbers for video. 1366 × 768 ≈ 16:9, 2560 × 1080 = 64:27.",
  },
  lead: {
    ru: "Введите ширину и высоту — получите пропорцию; задайте новую ширину — калькулятор найдёт высоту с тем же соотношением.",
    en: "Enter a width and height to get the ratio; enter a new width to get the matching height.",
  },
  keywords: {
    ru: ["соотношение сторон", "калькулятор пропорций", "16:9 калькулятор", "aspect ratio"],
    en: ["aspect ratio calculator", "16:9 calculator", "resize keep aspect ratio", "resolution ratio"],
  },
  props: { w: 1920, h: 1080, scale: 1366 },
  howTo: {
    ru: [
      "Введите ширину и высоту в пикселях — например, 1920 и 1080.",
      "Калькулятор сократит пропорцию через НОД и подскажет ближайшую стандартную.",
      "Введите новую ширину — высота с тем же соотношением посчитается автоматически.",
      "Для видео включите округление до чётного: кодеки H.264 и H.265 требуют чётных размеров.",
    ],
    en: [
      "Enter a width and height in pixels — for example 1920 and 1080.",
      "The calculator reduces the ratio by the GCD and names the nearest standard one.",
      "Type a new width — the height with the same ratio is calculated instantly.",
      "For video, turn on even rounding: H.264 and H.265 need even dimensions.",
    ],
  },
  faq: {
    ru: [
      { q: "Как посчитать соотношение сторон?", a: "Разделите ширину и высоту на их наибольший общий делитель: у 1920 и 1080 НОД = 120, получается 16:9." },
      { q: "Почему 1366 × 768 — не ровно 16:9?", a: "Точная пропорция — 683:384 (1,7786), у 16:9 — 1,7778. Разница 0,05%, поэтому такие экраны продают как 16:9: 768 × 16 / 9 = 1365,33, и ширину округлили до 1366." },
      { q: "Что значит 21:9?", a: "Это маркетинговое название ультрашироких экранов. Реальные пропорции другие: 2560 × 1080 — 64:27 (2,37:1), 3440 × 1440 — 43:18 (2,39:1)." },
      { q: "Зачем округлять до чётного?", a: "Видеокодеки с цветовой субдискретизацией 4:2:0 (H.264, H.265) требуют чётную ширину и высоту. Например, 16:9 при ширине 1366 даёт 768,375 → 768." },
    ],
    en: [
      { q: "How do I calculate an aspect ratio?", a: "Divide the width and height by their greatest common divisor: for 1920 and 1080 the GCD is 120, giving 16:9." },
      { q: "Why isn't 1366 × 768 exactly 16:9?", a: "Its exact ratio is 683:384 (1.7786) versus 1.7778 for 16:9. The 0.05% difference is why such screens are sold as 16:9: 768 × 16 / 9 = 1365.33, rounded up to 1366." },
      { q: "What does 21:9 mean?", a: "It's a marketing name for ultrawide screens. The real ratios differ: 2560 × 1080 is 64:27 (2.37:1) and 3440 × 1440 is 43:18 (2.39:1)." },
      { q: "Why round to even numbers?", a: "Video codecs with 4:2:0 chroma subsampling (H.264, H.265) need even width and height. For example, 16:9 at a width of 1366 gives 768.375 → 768." },
    ],
  },
  about: {
    ru: [
      "Соотношение сторон — это отношение ширины к высоте, записанное целыми числами. Калькулятор делит обе стороны на наибольший общий делитель и сравнивает результат со стандартными форматами: 16:9, 16:10, 4:3, 3:2, 21:9, 32:9 и другими, отмечая «≈», если совпадение неточное.",
      "Для масштабирования используется формула высота = ширина × H / W. Дробный результат можно округлить до целого или до чётного числа — второе нужно для видео.",
    ],
    en: [
      "An aspect ratio is the width-to-height relation written in whole numbers. The calculator divides both sides by their greatest common divisor and compares the result with standard formats — 16:9, 16:10, 4:3, 3:2, 21:9, 32:9 and others — marking inexact matches with “≈”.",
      "Scaling uses height = width × H / W. A fractional result can be rounded to a whole or an even number — the latter is needed for video.",
    ],
  },
  related: [],
  variants: { title: { ru: "Популярные пропорции", en: "Popular ratios" }, list: () => RATIOS.map(ratioVariant) },
  blocks: (l) => [
    {
      type: "table",
      title: tt(l, "Стандартные соотношения сторон", "Standard aspect ratios"),
      head: [tt(l, "Пропорция", "Ratio"), tt(l, "Десятичная", "Decimal"), tt(l, "Пример", "Example"), tt(l, "Где используется", "Used for")],
      rows: RATIOS.map((r) => [lbl(r), `${nf(l, r.w / r.h, 3)}:1`, x(r.res[Math.min(3, r.res.length - 1)][0], r.res[Math.min(3, r.res.length - 1)][1]), r.short[l]]),
    },
  ],
};
