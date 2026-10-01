import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { fmtMoney } from "../../shared/fmt";
import { addVat, extractVat } from "../lib/money";

const AMOUNTS = [100, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000];

function vatTable(locale: Locale, rate: number, cur: "KZT" | "RUB", titleRu: string, titleEn: string): Block {
  const ru = locale === "ru";
  const m = (v: number) => fmtMoney(locale, v, cur);
  return {
    type: "table",
    title: ru ? titleRu : titleEn,
    head: ru ? ["Сумма", `+ НДС ${rate} %`, "С НДС", `НДС в сумме`, "Без НДС"] : ["Amount", `+ ${rate}% VAT`, "With VAT", "VAT included", "Without VAT"],
    rows: AMOUNTS.map((a) => {
      const add = addVat(a, rate);
      const ex = extractVat(a, rate);
      return [m(a), m(add.vat), m(add.gross), m(ex.vat), m(ex.net)];
    }),
  };
}

function variants(): VariantDef[] {
  return [
    {
      slug: "kazakhstan",
      name: { ru: "НДС в Казахстане (16 %)", en: "Kazakhstan VAT (16%)" },
      title: { ru: "Калькулятор НДС 16 % для Казахстана — выделить и начислить", en: "Kazakhstan VAT calculator 16% — add or extract VAT" },
      h1: { ru: "Калькулятор НДС 16 % (Казахстан, 2026)", en: "Kazakhstan VAT calculator (16%, 2026)" },
      description: {
        ru: "НДС в Казахстане с 1 января 2026 года — 16 % вместо 12 %. Начислите НДС на сумму или выделите его: в 116 000 ₸ содержится 16 000 ₸ НДС. Таблица сумм.",
        en: "Kazakhstan's VAT rate is 16% from 1 January 2026 (12% before). Add VAT or extract it: 116,000 ₸ includes 16,000 ₸ of VAT. Table of common amounts.",
      },
      lead: { ru: "С 2026 года НДС в Казахстане — 16 %: 100 000 ₸ + НДС = 116 000 ₸; НДС в сумме = сумма × 16 / 116.", en: "From 2026 Kazakhstan VAT is 16%: 100,000 ₸ + VAT = 116,000 ₸; VAT included = amount × 16 / 116." },
      props: { preset: "kz-2026" },
      keywords: { ru: ["НДС 16%", "НДС Казахстан 2026", "выделить НДС 16", "ставка НДС РК"], en: ["kazakhstan vat 16%", "vat kazakhstan 2026"] },
      blocks: (locale) => [
        vatTable(locale, 16, "KZT", "НДС 16 % для типичных сумм", "16% VAT on common amounts"),
        {
          type: "facts",
          title: locale === "ru" ? "Ставки НДС в Казахстане" : "VAT rates in Kazakhstan",
          rows:
            locale === "ru"
              ? [
                  ["С 1 января 2026 года", "16 % (новый Налоговый кодекс)"],
                  ["До конца 2025 года", "12 %"],
                  ["Выделить НДС 16 %", "Сумма × 16 / 116"],
                  ["Выделить НДС 12 %", "Сумма × 12 / 112"],
                ]
              : [
                  ["From 1 January 2026", "16% (new Tax Code)"],
                  ["Until the end of 2025", "12%"],
                  ["Extract 16% VAT", "Amount × 16 / 116"],
                  ["Extract 12% VAT", "Amount × 12 / 112"],
                ],
        },
      ],
      faq: {
        ru: [
          { q: "Какая ставка НДС в Казахстане в 2026 году?", a: "Базовая ставка — 16 % с 1 января 2026 года по новому Налоговому кодексу; до этого была 12 %. Для отдельных товаров и операций предусмотрены льготы — проверяйте ставку для своей операции." },
          { q: "Как выделить НДС 16 % из суммы?", a: "Умножьте сумму на 16 и разделите на 116. Например, в 58 000 ₸ содержится 58 000 × 16 / 116 = 8 000 ₸ НДС, а без НДС — 50 000 ₸." },
          { q: "Как начислить НДС 16 %?", a: "Умножьте сумму без НДС на 1,16: 250 000 ₸ + НДС = 290 000 ₸, из них 40 000 ₸ — налог." },
        ],
        en: [
          { q: "What is the VAT rate in Kazakhstan in 2026?", a: "The standard rate is 16% from 1 January 2026 under the new Tax Code; it was 12% before. Some goods and transactions have special rates — check the rate for yours." },
          { q: "How do I extract 16% VAT from an amount?", a: "Multiply by 16 and divide by 116. For example, 58,000 ₸ includes 58,000 × 16 / 116 = 8,000 ₸ of VAT, and 50,000 ₸ without it." },
          { q: "How do I add 16% VAT?", a: "Multiply the net amount by 1.16: 250,000 ₸ + VAT = 290,000 ₸, of which 40,000 ₸ is tax." },
        ],
      },
    },
    {
      slug: "russia",
      name: { ru: "НДС в России (22 %)", en: "Russia VAT (22%)" },
      title: { ru: "Калькулятор НДС 22 % для России — выделить и начислить", en: "Russia VAT calculator 22% — add or extract VAT" },
      h1: { ru: "Калькулятор НДС 22 % (Россия, 2026)", en: "Russia VAT calculator (22%, 2026)" },
      description: {
        ru: "НДС в России с 2026 года — 22 % (было 20 %), льготная ставка — 10 %. Начислите или выделите НДС: в 122 000 ₽ содержится 22 000 ₽ налога. Таблица сумм.",
        en: "Russia's standard VAT is 22% from 2026 (20% before), with a 10% reduced rate. Add or extract VAT: 122,000 ₽ includes 22,000 ₽ of tax. Table of amounts.",
      },
      lead: { ru: "С 2026 года основная ставка НДС в России — 22 %: 100 000 ₽ + НДС = 122 000 ₽; НДС в сумме = сумма × 22 / 122.", en: "From 2026 Russia's standard VAT is 22%: 100,000 ₽ + VAT = 122,000 ₽; VAT included = amount × 22 / 122." },
      props: { preset: "ru-2026" },
      keywords: { ru: ["НДС 22%", "НДС 2026 Россия", "выделить НДС 22", "НДС 20%"], en: ["russia vat 22%", "vat russia 2026"] },
      blocks: (locale) => [
        vatTable(locale, 22, "RUB", "НДС 22 % для типичных сумм", "22% VAT on common amounts"),
        {
          type: "facts",
          title: locale === "ru" ? "Ставки НДС в России" : "VAT rates in Russia",
          rows:
            locale === "ru"
              ? [
                  ["С 1 января 2026 года", "22 % — основная ставка"],
                  ["До конца 2025 года", "20 %"],
                  ["Льготная ставка", "10 % (отдельные продукты, детские и медицинские товары)"],
                  ["Выделить НДС 22 %", "Сумма × 22 / 122"],
                ]
              : [
                  ["From 1 January 2026", "22% — standard rate"],
                  ["Until the end of 2025", "20%"],
                  ["Reduced rate", "10% (some food, children's and medical goods)"],
                  ["Extract 22% VAT", "Amount × 22 / 122"],
                ],
        },
      ],
      faq: {
        ru: [
          { q: "Какая ставка НДС в России в 2026 году?", a: "Основная ставка — 22 % с 1 января 2026 года (до этого 20 %). Льготная ставка 10 % сохранилась для отдельных продовольственных, детских и медицинских товаров." },
          { q: "Как выделить НДС 22 %?", a: "Умножьте сумму на 22 и разделите на 122. В 61 000 ₽ содержится 11 000 ₽ НДС, без налога — 50 000 ₽." },
          { q: "Как выделить НДС 20 % из старых документов?", a: "Выберите ставку «Россия до 2026 — 20 %»: НДС = сумма × 20 / 120, то есть 1/6 суммы." },
        ],
        en: [
          { q: "What is the VAT rate in Russia in 2026?", a: "The standard rate is 22% from 1 January 2026 (20% before). The 10% reduced rate still applies to some food, children's and medical goods." },
          { q: "How do I extract 22% VAT?", a: "Multiply by 22 and divide by 122. 61,000 ₽ includes 11,000 ₽ of VAT; without it, 50,000 ₽." },
          { q: "How do I extract 20% VAT from older invoices?", a: "Choose 'Russia before 2026 — 20%': VAT = amount × 20 / 120, i.e. one sixth of the amount." },
        ],
      },
    },
  ];
}

export const vatTool: ToolDef = {
  slug: "vat-calculator",
  component: "finance/vat",
  icon: "ReceiptText",
  popular: true,
  name: { ru: "Калькулятор НДС", en: "VAT calculator" },
  title: { ru: "Калькулятор НДС онлайн — выделить и начислить НДС", en: "VAT calculator — add or remove VAT online" },
  h1: { ru: "Калькулятор НДС", en: "VAT calculator" },
  description: {
    ru: "Начислите НДС на сумму или выделите его из суммы: ставки Казахстана (12 %, с 2026 года 16 %), России (20 %, с 2026 года 22 %, льготная 10 %) или своя ставка.",
    en: "Add VAT to an amount or extract it: Kazakhstan rates (12%, 16% from 2026), Russian rates (20%, 22% from 2026, 10% reduced) or your own rate.",
  },
  lead: {
    ru: "100 000 ₸ + НДС 16 % = 116 000 ₸, а в сумме 116 000 ₸ содержится 16 000 ₸ НДС.",
    en: "100,000 + 16% VAT = 116,000, and 116,000 includes 16,000 of VAT.",
  },
  keywords: {
    ru: ["калькулятор НДС", "выделить НДС", "начислить НДС", "НДС 16%", "НДС 12%", "НДС 20%", "НДС 22%", "сумма без НДС"],
    en: ["vat calculator", "add vat", "remove vat", "extract vat", "vat 16%", "vat 20%"],
  },
  props: { preset: "kz-2026" },
  howTo: {
    ru: [
      "Выберите действие: начислить НДС на сумму без налога или выделить НДС из суммы с налогом.",
      "Введите сумму — можно с пробелами и запятой: «1 250 000,50».",
      "Выберите ставку: Казахстан или Россия до и после 2026 года, льготную или свою.",
      "Сумма с НДС, сам налог и сумма без НДС пересчитываются сразу.",
    ],
    en: [
      "Choose whether to add VAT to a net amount or extract VAT from a gross amount.",
      "Enter the amount — separators are fine: 1,250,000.50.",
      "Pick the rate: Kazakhstan or Russia before and after 2026, the reduced rate or your own.",
      "The gross amount, the VAT and the net amount update instantly.",
    ],
  },
  about: {
    ru: [
      "Начислить НДС просто: умножьте сумму на 1 + ставка/100. Выделить сложнее — налог уже внутри суммы, поэтому его доля равна ставка / (100 + ставка): при 16 % это 16/116, при 12 % — 12/112, при 22 % — 22/122.",
      "В 2026 году ставки изменились в обеих странах: в Казахстане по новому Налоговому кодексу НДС вырос с 12 % до 16 %, в России основная ставка — 22 % вместо 20 %. Калькулятор хранит обе ставки, чтобы можно было пересчитать документы прошлых лет.",
      "Суммы округляются до тиынов или копеек. Льготные и нулевые ставки для отдельных товаров, экспорта и спецрежимов проверяйте по законодательству своей страны.",
    ],
    en: [
      "Adding VAT is simple: multiply by 1 + rate/100. Extracting it is different because the tax is already inside the amount, so its share is rate / (100 + rate): 16/116 at 16%, 12/112 at 12%, 22/122 at 22%.",
      "In 2026 the rates changed in both countries: Kazakhstan's new Tax Code raised VAT from 12% to 16%, and Russia's standard rate went from 20% to 22%. Both old and new rates are kept so you can recalculate older documents.",
      "Amounts are rounded to cents. Check reduced and zero rates for specific goods, exports and special regimes in your country's law.",
    ],
  },
  faq: {
    ru: [
      { q: "Как выделить НДС из суммы?", a: "Умножьте сумму на ставку и разделите на (100 + ставка). При ставке 16 %: 116 000 × 16 / 116 = 16 000 ₸ НДС, без налога — 100 000 ₸." },
      { q: "Как начислить НДС на сумму?", a: "Умножьте сумму без НДС на (1 + ставка / 100). При 16 %: 100 000 × 1,16 = 116 000 ₸." },
      { q: "Почему нельзя просто вычесть 16 % из суммы с НДС?", a: "Потому что НДС начислялся на сумму без налога. 16 % от 116 000 — это 18 560, а сам налог в этой сумме — 16 000." },
      { q: "Какие ставки НДС действуют в 2026 году?", a: "В Казахстане — 16 % (до 2026 года — 12 %), в России — 22 % (до 2026 года — 20 %) и льготная 10 %. Уточняйте ставку для своей операции." },
    ],
    en: [
      { q: "How do I extract VAT from an amount?", a: "Multiply by the rate and divide by (100 + rate). At 16%: 116,000 × 16 / 116 = 16,000 of VAT, 100,000 without it." },
      { q: "How do I add VAT?", a: "Multiply the net amount by (1 + rate / 100). At 16%: 100,000 × 1.16 = 116,000." },
      { q: "Why can't I just subtract 16% from the gross amount?", a: "Because VAT was charged on the net amount. 16% of 116,000 is 18,560, while the tax included is 16,000." },
      { q: "Which VAT rates apply in 2026?", a: "Kazakhstan: 16% (12% before 2026). Russia: 22% (20% before 2026) and a 10% reduced rate. Check the rate for your transaction." },
    ],
  },
  related: ["percentage-calculator/add-percent", "discount-calculator", "markup-margin-calculator", "kazakhstan-salary-calculator", "loan-calculator"],
  variants: { title: { ru: "НДС по странам", en: "VAT by country" }, list: variants },
};
