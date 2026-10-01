import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";

function aspectTable(locale: Locale): Block {
  const ru = locale === "ru";
  const rows: [string, string, string][] = [
    ["16 : 9", "1920 × 1080", "3840 × 2160"],
    ["4 : 3", "1024 × 768", "1600 × 1200"],
    ["3 : 2", "1500 × 1000", "6000 × 4000"],
    ["21 : 9", "2560 × 1080", "3440 × 1440"],
    ["1 : 1", "1080 × 1080", "2048 × 2048"],
    ["9 : 16", "1080 × 1920", "720 × 1280"],
  ];
  return { type: "table", title: ru ? "Популярные соотношения сторон" : "Common aspect ratios", head: ru ? ["Соотношение", "Пример", "Пример"] : ["Ratio", "Example", "Example"], rows };
}

export const ratioTool: ToolDef = {
  slug: "ratio-calculator",
  component: "calc/ratio",
  icon: "SplitSquareHorizontal",
  name: { ru: "Калькулятор соотношений", en: "Ratio calculator" },
  title: { ru: "Калькулятор соотношений — упростить и разделить в отношении", en: "Ratio calculator — simplify, scale and split" },
  h1: { ru: "Калькулятор соотношений", en: "Ratio calculator" },
  description: {
    ru: "Упростите соотношение (1,5 : 2,25 = 2 : 3), разделите сумму в заданном отношении так, чтобы доли сходились до копейки, или масштабируйте пропорции — например 16 : 9.",
    en: "Simplify a ratio (1.5 : 2.25 = 2 : 3), split an amount in a given ratio so the shares add up to the cent, or scale proportions such as 16 : 9.",
  },
  lead: {
    ru: "1,5 : 2,25 = 2 : 3; 100 000 ₸ в отношении 2 : 3 — это 40 000 и 60 000 ₸.",
    en: "1.5 : 2.25 = 2 : 3; 100,000 split 2 : 3 is 40,000 and 60,000.",
  },
  keywords: {
    ru: ["соотношение", "упростить отношение", "разделить в отношении", "пропорция сторон", "калькулятор отношений"],
    en: ["ratio calculator", "simplify ratio", "divide in a ratio", "aspect ratio calculator"],
  },
  props: {},
  howTo: {
    ru: ["Введите соотношение через двоеточие — можно с дробными частями.", "Выберите действие: упростить, разделить сумму или масштабировать.", "Результат появится сразу."],
    en: ["Enter the ratio with colons — decimal parts are fine.", "Choose: simplify, split an amount or scale.", "The result appears instantly."],
  },
  about: {
    ru: [
      "Соотношение показывает, сколько частей приходится на каждую величину. Упростить его — значит сократить на общий делитель: 12 : 18 : 30 = 2 : 3 : 5. Дробные части сначала приводятся к целым.",
      "При делении суммы в отношении доли округляются до сотых, но всегда складываются ровно в исходную сумму: 100 на три равные части — 33,34 + 33,33 + 33,33.",
    ],
    en: [
      "A ratio shows how many parts each quantity gets. Simplifying divides by the common divisor: 12 : 18 : 30 = 2 : 3 : 5. Decimal parts are converted to whole numbers first.",
      "When an amount is split in a ratio, the shares are rounded to cents but always add up to exactly the original: 100 in three equal parts is 33.34 + 33.33 + 33.33.",
    ],
  },
  faq: {
    ru: [
      { q: "Как упростить соотношение?", a: "Разделите все части на их наибольший общий делитель: 24 : 36 → НОД 12 → 2 : 3. Если части дробные, сначала умножьте их на 10, 100 и т. д." },
      { q: "Как разделить сумму в отношении?", a: "Сложите части соотношения, разделите сумму на это число и умножьте на каждую часть: 50 000 в отношении 1 : 4 — это 10 000 и 40 000." },
      { q: "Как найти высоту по ширине и пропорции 16 : 9?", a: "Высота = ширина × 9 / 16: при ширине 1280 это 720." },
    ],
    en: [
      { q: "How do I simplify a ratio?", a: "Divide all parts by their greatest common divisor: 24 : 36 → GCD 12 → 2 : 3. With decimals, multiply by 10, 100 and so on first." },
      { q: "How do I split an amount in a ratio?", a: "Add up the parts, divide the amount by that sum and multiply by each part: 50,000 in 1 : 4 is 10,000 and 40,000." },
      { q: "How do I get the height from a 16 : 9 width?", a: "Height = width × 9 / 16: a width of 1280 gives 720." },
    ],
  },
  related: ["proportion-calculator", "fraction-calculator", "percentage-calculator", "gcd-lcm-calculator"],
  blocks: (locale) => [aspectTable(locale)],
};
