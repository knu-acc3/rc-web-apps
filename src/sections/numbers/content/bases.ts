import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { convertInt, divisionSteps, expansionTerms } from "../bases";
import { superscript } from "../scientific";

type B = 2 | 8 | 10 | 16;

const NAME: Record<B, { gen: string; acc: string; nom: string; en: string; short: string; prefix: string; digits: string }> = {
  2: { gen: "двоичной", acc: "двоичную", nom: "двоичная", en: "binary", short: "bin", prefix: "0b", digits: "0, 1" },
  8: { gen: "восьмеричной", acc: "восьмеричную", nom: "восьмеричная", en: "octal", short: "oct", prefix: "0o", digits: "0–7" },
  10: { gen: "десятичной", acc: "десятичную", nom: "десятичная", en: "decimal", short: "dec", prefix: "—", digits: "0–9" },
  16: { gen: "шестнадцатеричной", acc: "шестнадцатеричную", nom: "шестнадцатеричная", en: "hexadecimal", short: "hex", prefix: "0x", digits: "0–9, A–F" },
};

const SUB: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
const sub = (b: number) => String(b).split("").map((c) => SUB[c]).join("");

const PAIRS: { slug: string; from: B; to: B; value: string }[] = [
  { slug: "binary-to-decimal", from: 2, to: 10, value: "101010" },
  { slug: "decimal-to-binary", from: 10, to: 2, value: "42" },
  { slug: "hex-to-decimal", from: 16, to: 10, value: "FF" },
  { slug: "decimal-to-hex", from: 10, to: 16, value: "255" },
  { slug: "binary-to-hex", from: 2, to: 16, value: "11010110" },
  { slug: "hex-to-binary", from: 16, to: 2, value: "D6" },
  { slug: "octal-to-decimal", from: 8, to: 10, value: "777" },
  { slug: "decimal-to-octal", from: 10, to: 8, value: "511" },
  { slug: "binary-to-octal", from: 2, to: 8, value: "101110" },
  { slug: "octal-to-binary", from: 8, to: 2, value: "56" },
  { slug: "hex-to-octal", from: 16, to: 8, value: "1FF" },
  { slug: "octal-to-hex", from: 8, to: 16, value: "777" },
];

const TABLE_VALUES = [...Array.from({ length: 17 }, (_, i) => i), 20, 32, 50, 64, 100, 127, 128, 255, 256, 1000, 1024, 4096, 65535];

const enName = (b: B) => NAME[b].en;
const capEn = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function method(from: B, to: B, value: string, locale: Locale): string[] {
  const dec = convertInt(value, from, 10);
  const result = convertInt(value, from, to);
  const ru = locale === "ru";
  const grouping = (from === 2 && (to === 16 || to === 8)) || (to === 2 && (from === 16 || from === 8));
  if (grouping) {
    const n = from === 16 || to === 16 ? 4 : 3;
    return ru
      ? [
          `Основание ${from === 2 ? to : from} — это 2${superscript(n)}, поэтому каждой ${from === 2 ? NAME[to].nom.replace("ая", "ой") : NAME[from].nom.replace("ая", "ой")} цифре соответствует ровно ${n} бита. Считать через десятичную систему не нужно.`,
          from === 2
            ? `Разбейте двоичное число на группы по ${n} бита справа налево (слева допишите нули) и замените каждую группу одной цифрой: ${value}${sub(2)} = ${result}${sub(to)}.`
            : `Замените каждую цифру группой из ${n} бит: ${value}${sub(from)} = ${result}${sub(2)}.`,
        ]
      : [
          `Base ${from === 2 ? to : from} is 2${superscript(n)}, so every ${enName(from === 2 ? to : from)} digit maps to exactly ${n} bits — no need to go through decimal.`,
          from === 2
            ? `Split the binary number into groups of ${n} bits from the right (pad with zeros on the left) and replace each group with one digit: ${value}${sub(2)} = ${result}${sub(to)}.`
            : `Replace each digit with its ${n}-bit group: ${value}${sub(from)} = ${result}${sub(2)}.`,
        ];
  }
  if (to === 10) {
    const terms = expansionTerms(value, from);
    const expr = terms.map((t) => `${t.digit}×${from}${superscript(t.power)}`).join(" + ");
    return ru
      ? [
          `Каждая цифра умножается на основание ${from} в степени, равной её позиции справа (начиная с нуля), затем результаты складываются.`,
          `Пример: ${value}${sub(from)} = ${expr} = ${dec}${sub(10)}.`,
        ]
      : [`Multiply each digit by ${from} raised to its position from the right (starting at zero) and add the results.`, `Example: ${value}${sub(from)} = ${expr} = ${dec}${sub(10)}.`];
  }
  if (from === 10) {
    const steps = divisionSteps(BigInt(value), to);
    const chain = steps.map((s) => `${s.n} ÷ ${to} = ${s.q} (${ru ? "остаток" : "remainder"} ${to === 16 && s.r > 9 ? `${s.r} = ${s.r.toString(16).toUpperCase()}` : s.r})`).join("; ");
    return ru
      ? [`Делите число на ${to} с остатком, пока частное не станет равным нулю. Остатки, записанные в обратном порядке, и есть ответ.`, `Пример: ${chain}. Читаем остатки снизу вверх: ${value}${sub(10)} = ${result}${sub(to)}.`]
      : [`Divide the number by ${to} repeatedly, keeping the remainders, until the quotient is zero. The remainders in reverse order form the answer.`, `Example: ${chain}. Reading the remainders bottom-up: ${value}${sub(10)} = ${result}${sub(to)}.`];
  }
  // hex ↔ octal: via binary
  const bin = convertInt(value, from, 2);
  return ru
    ? [
        `Удобнее всего перейти через двоичную систему: каждая ${from === 16 ? "шестнадцатеричная цифра даёт 4 бита" : "восьмеричная цифра даёт 3 бита"}, затем биты перегруппировываются по ${to === 8 ? "3" : "4"}.`,
        `Пример: ${value}${sub(from)} = ${bin}${sub(2)} = ${result}${sub(to)} (в десятичной — ${dec}).`,
      ]
    : [
        `The easiest route is through binary: each ${from === 16 ? "hex digit gives 4 bits" : "octal digit gives 3 bits"}, then regroup the bits by ${to === 8 ? "3" : "4"}.`,
        `Example: ${value}${sub(from)} = ${bin}${sub(2)} = ${result}${sub(to)} (${dec} in decimal).`,
      ];
}

function pairVariant(p: (typeof PAIRS)[number]): VariantDef {
  const { from, to, value } = p;
  const result = convertInt(value, from, to);
  const ex = `${value}${sub(from)} = ${result}${sub(to)}`;
  const nf = NAME[from];
  const nt = NAME[to];
  const faq: Record<Locale, QA[]> = {
    ru: [
      { q: `Как перевести число из ${nf.gen} системы в ${nt.acc}?`, a: method(from, to, value, "ru").join(" ") },
      {
        q: `Сколько будет ${convertInt("255", 10, from)}${sub(from)} в ${nt.gen} системе?`,
        a: `${convertInt("255", 10, from)}${sub(from)} = ${convertInt("255", 10, to)}${sub(to)}. Это максимальное значение одного байта (255 в десятичной).`,
      },
      { q: "Можно ли переводить дробные и отрицательные числа?", a: "Да. Дробную часть отделяйте точкой или запятой — бесконечные дроби показываются с периодом. Для отрицательных чисел можно включить дополнительный код на 8, 16, 32 или 64 бита." },
    ],
    en: [
      { q: `How do you convert ${enName(from)} to ${enName(to)}?`, a: method(from, to, value, "en").join(" ") },
      {
        q: `What is ${convertInt("255", 10, from)}${sub(from)} in ${enName(to)}?`,
        a: `${convertInt("255", 10, from)}${sub(from)} = ${convertInt("255", 10, to)}${sub(to)} — the largest value of a single byte (255 in decimal).`,
      },
      { q: "Does it handle fractions and negative numbers?", a: "Yes. Use a point or comma for the fraction — repeating fractions are shown with their period. For negative numbers you can switch on 8-, 16-, 32- or 64-bit two's complement." },
    ],
  };
  return {
    slug: p.slug,
    name: { ru: `Из ${nf.gen} в ${nt.acc}`, en: `${capEn(nf.en)} to ${nt.en}` },
    title: { ru: `Перевод из ${nf.gen} в ${nt.acc} систему онлайн`, en: `${capEn(enName(from))} to ${enName(to)} converter — with steps` },
    h1: { ru: `Из ${nf.gen} в ${nt.acc} систему`, en: `${capEn(enName(from))} to ${enName(to)}` },
    description: {
      ru: `Перевод чисел из ${nf.gen} системы счисления в ${nt.acc} онлайн: ${ex}. Решение по шагам, таблица значений, дроби и числа любой длины.`,
      en: `Convert ${enName(from)} to ${enName(to)} online: ${ex}. Step-by-step solution, a lookup table from 0 to 65535, fractions and numbers of any length.`,
    },
    lead: { ru: `Пример: ${ex}`, en: `Example: ${ex}` },
    props: { from, to, value },
    keywords: { ru: [`${nf.nom} в ${nt.acc}`, `перевод ${nf.short} ${nt.short}`], en: [`${enName(from)} to ${enName(to)}`, `${nf.short} to ${nt.short}`] },
    blocks: (locale): Block[] => {
      const ru = locale === "ru";
      const showDec = from !== 10 && to !== 10;
      return [
        {
          type: "facts",
          title: ru ? "Коротко" : "Quick facts",
          rows: ru
            ? [
                [`Цифры ${nf.gen} системы`, nf.digits],
                [`Цифры ${nt.gen} системы`, nt.digits],
                ["Пример", ex],
                ["Префикс в программировании", `${nf.prefix.replace("—", "без префикса")} → ${nt.prefix.replace("—", "без префикса")}`],
              ]
            : [
                [`${capEn(enName(from))} digits`, nf.digits],
                [`${capEn(enName(to))} digits`, nt.digits],
                ["Example", ex],
                ["Prefix in code", `${nf.prefix.replace("—", "none")} → ${nt.prefix.replace("—", "none")}`],
              ],
        },
        {
          type: "table",
          title: ru ? `Таблица: ${nf.nom} → ${nt.nom}` : `${capEn(enName(from))} to ${enName(to)} table`,
          head: [ru ? `${capEn(nf.nom)} (${from})` : `${capEn(enName(from))} (${from})`, ru ? `${capEn(nt.nom)} (${to})` : `${capEn(enName(to))} (${to})`, ...(showDec ? [ru ? "Десятичная" : "Decimal"] : [])],
          rows: TABLE_VALUES.map((v) => [convertInt(String(v), 10, from), convertInt(String(v), 10, to), ...(showDec ? [String(v)] : [])]),
          mono: true,
        },
        { type: "text", title: ru ? "Как перевести" : "How to convert", paragraphs: method(from, to, value, locale) },
      ];
    },
    faq,
  };
}

export const baseTool: ToolDef = {
  slug: "number-base-converter",
  seoAlt: { ru: "калькулятор систем счисления", en: "number base calculator" },
  component: "numbers/base-converter",
  icon: "Binary",
  popular: true,
  name: { ru: "Системы счисления", en: "Number base converter" },
  title: { ru: "Перевод систем счисления онлайн — от 2 до 36", en: "Number Base Converter — Binary, Octal, Decimal, Hex" },
  h1: { ru: "Перевод систем счисления", en: "Number base converter" },
  description: {
    ru: "Перевод чисел между системами счисления с основанием от 2 до 36: двоичная, восьмеричная, десятичная, шестнадцатеричная. Дроби, дополнительный код, решение по шагам.",
    en: "Convert numbers between bases 2 to 36: binary, octal, decimal and hex. Exact big-number math, fractions with repeating digits, two's complement and steps.",
  },
  lead: {
    ru: "Введите число и выберите системы — результат во всех основных системах появится сразу.",
    en: "Enter a number and choose the bases — the result in every common base appears instantly.",
  },
  keywords: {
    ru: ["системы счисления", "перевод систем счисления", "двоичная система", "шестнадцатеричная", "дополнительный код"],
    en: ["base converter", "binary converter", "hex converter", "radix", "two's complement"],
  },
  howTo: {
    ru: [
      "Введите число. Префиксы 0x, 0b и 0o распознаются автоматически в любом режиме.",
      "Выберите исходную систему и систему, в которую нужно перевести (от 2 до 36).",
      "Для отрицательных чисел включите дополнительный код на 8, 16, 32 или 64 бита.",
      "Откройте «Решение по шагам», чтобы увидеть деление с остатком или разложение по степеням.",
    ],
    en: [
      "Type a number. 0x, 0b and 0o prefixes are recognised in any mode.",
      "Choose the source and target bases (2 to 36).",
      "For negative integers switch on 8-, 16-, 32- or 64-bit two's complement.",
      "Open the step-by-step solution to see the division or positional expansion.",
    ],
  },
  faq: {
    ru: [
      { q: "Как перевести дробное число?", a: "Дробная часть переводится умножением на новое основание. Если дробь в новой системе бесконечна, конвертер находит период и выделяет его чертой: 0,1₁₀ = 0,0(0011)₂. Если период слишком длинный, показываются первые знаки." },
      { q: "Что такое дополнительный код?", a: "Способ хранить отрицательные целые числа в компьютере: −x записывается как 2ⁿ − x. Например, −5 в 8 битах — 11111011 (FB). Если ввести двоичную или шестнадцатеричную комбинацию, конвертер покажет её знаковое значение." },
      { q: "Как вводить шестнадцатеричные числа?", a: "Цифры A–F можно писать строчными или заглавными, с префиксом 0x или без него. Пробелы и подчёркивания между группами цифр игнорируются." },
      { q: "Есть ли ограничение на длину числа?", a: "До 4096 цифр. Вычисления выполняются с BigInt без потери точности — даже 64-битные и более длинные числа переводятся точно." },
    ],
    en: [
      { q: "How are fractions converted?", a: "The fractional part is multiplied by the new base digit by digit. When the result repeats forever, the converter detects the period and marks it with a bar: 0.1₁₀ = 0.0(0011)₂." },
      { q: "What is two's complement?", a: "The way computers store negative integers: −x is stored as 2ⁿ − x. For example, −5 in 8 bits is 11111011 (FB). Enter a binary or hex pattern and the tool shows its signed value." },
      { q: "Do I need the 0x prefix?", a: "No. Prefixes 0x, 0b and 0o are optional and recognised in any mode — paste 0xFF into decimal mode and it is read as hex. Spaces and underscores between digit groups are ignored." },
      { q: "How long can the number be?", a: "Up to 4,096 digits. All arithmetic uses BigInt, so 64-bit values and longer numbers convert exactly." },
    ],
  },
  about: {
    ru: [
      "В позиционной системе с основанием b каждая цифра умножается на b в степени своей позиции. Двоичная система лежит в основе компьютеров, шестнадцатеричная — компактная запись байтов (цвета, адреса памяти), восьмеричная встречается в правах доступа Unix (chmod 755).",
      "Конвертер работает с основаниями от 2 до 36 (цифры 0–9 и буквы A–Z), переводит дробные части с поиском периода, показывает дополнительный код и решение по шагам. Всё считается в браузере.",
    ],
    en: [
      "In a positional system with base b each digit is multiplied by b to the power of its position. Binary is how computers work, hexadecimal is a compact way to write bytes (colours, memory addresses), and octal still appears in Unix file permissions (chmod 755).",
      "The converter supports bases 2 to 36 (digits 0–9 and letters A–Z), converts fractions with period detection, shows two's complement and a step-by-step solution. Everything runs in your browser.",
    ],
  },
  variants: {
    title: { ru: "Популярные переводы", en: "Popular conversions" },
    list: () => PAIRS.map(pairVariant),
  },
};
