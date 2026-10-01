import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { parseScientific, SI_PREFIXES, superscript, toEngineering, toScientific } from "../lib/scientific";

const EXAMPLES: { v: string; ru: string; en: string }[] = [
  { v: "299792458", ru: "Скорость света, м/с", en: "Speed of light, m/s" },
  { v: "6.02214076e23", ru: "Число Авогадро, моль⁻¹", en: "Avogadro constant, mol⁻¹" },
  { v: "1.602176634e-19", ru: "Заряд электрона, Кл", en: "Elementary charge, C" },
  { v: "149597870700", ru: "Астрономическая единица, м", en: "Astronomical unit, m" },
  { v: "0.000001", ru: "Один микрометр в метрах", en: "One micrometre in metres" },
  { v: "5.972e24", ru: "Масса Земли, кг (прибл.)", en: "Mass of the Earth, kg (approx.)" },
];

function examplesTable(locale: Locale): Block {
  const dec = (s: string) => (locale === "ru" ? s.replace(".", ",") : s).replace("-", "−");
  return {
    type: "table",
    title: locale === "ru" ? "Примеры чисел в стандартном виде" : "Examples in scientific notation",
    head: locale === "ru" ? ["Величина", "Стандартный вид", "Инженерная запись", "E-нотация"] : ["Quantity", "Scientific", "Engineering", "E notation"],
    rows: EXAMPLES.map((e) => {
      const x = parseScientific(e.v)!;
      const s = toScientific(x);
      const g = toEngineering(x);
      return [e[locale], `${dec(s.mantissa)} × 10${superscript(s.exponent)}`, `${dec(g.mantissa)} × 10${superscript(g.exponent)}`, `${s.mantissa}e${s.exponent}`];
    }),
  };
}

function prefixTable(locale: Locale): Block {
  const rows = Object.entries(SI_PREFIXES)
    .map(([e, p]) => [Number(e), p] as const)
    .filter(([e]) => e !== 0 && Math.abs(e) <= 24)
    .sort((a, b) => b[0] - a[0])
    .map(([e, p]) => [locale === "ru" ? `${p.ru} (${p.ruSym})` : `${p.en} (${p.sym})`, `10${superscript(e)}`]);
  return { type: "table", title: locale === "ru" ? "Приставки СИ и степени десяти" : "SI prefixes and powers of ten", head: locale === "ru" ? ["Приставка", "Множитель"] : ["Prefix", "Factor"], rows };
}

export const scientificTool: ToolDef = {
  slug: "scientific-notation",
  component: "numbers/scientific-notation",
  icon: "Superscript",
  name: { ru: "Стандартный вид числа", en: "Scientific notation" },
  title: { ru: "Стандартный вид числа онлайн — научная и E-нотация", en: "Scientific Notation Converter — E and Engineering Notation" },
  h1: { ru: "Стандартный вид числа", en: "Scientific notation converter" },
  description: {
    ru: "Перевод числа в стандартный вид a × 10ⁿ и обратно: E-нотация, инженерная запись с приставками СИ, округление до значащих цифр. Точно, без ошибок округления.",
    en: "Convert numbers to scientific notation a × 10ⁿ and back: E notation, engineering notation with SI prefixes and rounding to significant figures — exact digits.",
  },
  lead: {
    ru: "Введите число в любом виде — 0,000123, 1,2e-5 или 3×10^8 — и получите все формы записи сразу.",
    en: "Type a number in any form — 0.000123, 1.2e-5 or 3×10^8 — and get every notation instantly.",
  },
  keywords: {
    ru: ["стандартный вид числа", "научная запись", "экспоненциальная запись", "e-нотация", "значащие цифры"],
    en: ["scientific notation", "e notation", "engineering notation", "significant figures", "standard form"],
  },
  howTo: {
    ru: [
      "Введите число: обычное (0,000123), в E-нотации (1,23e-4) или со степенью (1,23×10^-4, 1,23·10⁻⁴).",
      "При необходимости выберите количество значащих цифр для округления.",
      "Скопируйте нужную форму: стандартный вид, E-нотацию для Excel и кода, инженерную запись или LaTeX.",
    ],
    en: [
      "Type a number: plain (0.000123), E notation (1.23e-4) or a power of ten (1.23×10^-4, 1.23·10⁻⁴).",
      "Optionally choose how many significant figures to round to.",
      "Copy the form you need: scientific, E notation for spreadsheets and code, engineering or LaTeX.",
    ],
  },
  faq: {
    ru: [
      { q: "Что такое стандартный вид числа?", a: "Запись a × 10ⁿ, где 1 ≤ |a| < 10, а n — целое число (порядок). Например, 0,000123 = 1,23 × 10⁻⁴, а 5 400 000 = 5,4 × 10⁶." },
      { q: "Чем инженерная запись отличается от стандартного вида?", a: "В инженерной записи показатель степени кратен трём, а мантисса лежит от 1 до 1000: 12 345 = 12,345 × 10³. Так число сразу соответствует приставке СИ — кило, мега, милли, микро." },
      { q: "Что означает запись 1,5E+06?", a: "Это E-нотация, которую используют калькуляторы, Excel и языки программирования: E означает «умножить на 10 в степени». 1,5E+06 = 1,5 × 10⁶ = 1 500 000." },
      { q: "Как округлить до значащих цифр?", a: "Выберите нужное число значащих цифр: 123 456 при трёх значащих — 1,23 × 10⁵. Округление выполняется по цифрам, без погрешностей двоичной арифметики." },
    ],
    en: [
      { q: "What is scientific notation?", a: "A number written as a × 10ⁿ where 1 ≤ |a| < 10 and n is an integer. For example, 0.000123 = 1.23 × 10⁻⁴ and 5,400,000 = 5.4 × 10⁶." },
      { q: "How is engineering notation different?", a: "The exponent is always a multiple of three and the mantissa is between 1 and 1000: 12,345 = 12.345 × 10³. That lines up with SI prefixes such as kilo, mega, milli and micro." },
      { q: "What does 1.5E+06 mean?", a: "It is E notation used by calculators, spreadsheets and programming languages: E means “times ten to the power of”. 1.5E+06 = 1.5 × 10⁶ = 1,500,000." },
      { q: "How does rounding to significant figures work?", a: "Pick the number of significant figures: 123,456 to three figures is 1.23 × 10⁵. Rounding is done on the decimal digits, so there are no binary floating-point errors." },
    ],
  },
  about: {
    ru: [
      "Стандартный вид удобен для очень больших и очень маленьких величин: расстояний в астрономии, масс атомов, ёмкостей и токов в электронике. Порядок числа (показатель степени) сразу показывает его масштаб.",
      "Конвертер хранит все цифры числа точно, поэтому 0,1 остаётся 1 × 10⁻¹, а длинные числа не теряют младших разрядов. Результат можно скопировать в формате для Word (с «×10»), для Excel и кода (1e-4) или для LaTeX.",
    ],
    en: [
      "Scientific notation keeps very large and very small quantities readable — astronomical distances, atomic masses, capacitances and currents. The exponent tells you the order of magnitude at a glance.",
      "The converter keeps every digit exact, so 0.1 stays 1 × 10⁻¹ and long numbers never lose their last digits. Copy the result as text with ×10, as E notation for spreadsheets and code, or as LaTeX.",
    ],
  },
  blocks: (locale) => [examplesTable(locale), prefixTable(locale)],
};
