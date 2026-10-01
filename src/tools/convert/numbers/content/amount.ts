import type { Locale } from "@/i18n/config";
import type { QA, ToolDef, VariantDef } from "@/registry/types";
import { amountEn, amountRu, CURRENCIES, moneyNumeric, parseMoney, type CurrencyDef, type Money } from "../lib/amount";
import { ruPlural } from "../lib/words-ru";
import { fit } from "./text";

const EXAMPLES = ["1", "2", "5", "21", "22.22", "100", "1000", "1500.50", "21000", "2000000", "1234567.89"];

const money = (s: string): Money => {
  const p = parseMoney(s);
  if (!p.ok) throw new Error(s);
  return p.money;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Currency-specific notes (only facts that are certain). */
const NOTES: Record<string, { ru: string[]; en: string[] }> = {
  RUB: {
    ru: [
      "1 рубль = 100 копеек. Код валюты — RUB (643), знак — ₽.",
      "В платёжных поручениях и счетах сумму прописью обычно пишут с заглавной буквы, а копейки — цифрами: «Одна тысяча двести рублей 50 копеек».",
    ],
    en: ["1 ruble = 100 kopecks. ISO code RUB (643), sign ₽.", "Russian invoices usually spell the rubles out and give kopecks as two digits: «Одна тысяча двести рублей 50 копеек»."],
  },
  KZT: {
    ru: [
      "1 тенге = 100 тиынов. Код валюты — KZT (398), знак — ₸.",
      "Слово «тенге» не склоняется: один тенге, два тенге, сто тенге. «Тиын» по словарю склоняется (тиына, тиынов), хотя в казахстанских документах часто пишут «00 тиын» без окончания.",
    ],
    en: ["1 tenge = 100 tiyn. ISO code KZT (398), sign ₸.", "In Russian the word «тенге» never changes form; «тиын» follows regular declension (тиына, тиынов)."],
  },
  USD: {
    ru: ["1 доллар США = 100 центов. Код валюты — USD (840).", "В договорах на русском обычно пишут «долларов США», чтобы не спутать с другими долларами (канадским, австралийским)."],
    en: ["1 US dollar = 100 cents. ISO code USD (840).", "On US cheques the cents are often written as a fraction: “One hundred and 00/100 dollars”."],
  },
  EUR: {
    ru: ["1 евро = 100 центов. Код валюты — EUR (978).", "Слово «евро» не склоняется: один евро, два евро, пять евро; «цент» склоняется как обычное существительное."],
    en: ["1 euro = 100 cents. ISO code EUR (978).", "In English the plural “euros” is standard in everyday use; EU legal texts often keep “euro” unchanged."],
  },
  CNY: {
    ru: ["1 юань = 100 фэней (или 10 цзяо). Код валюты — CNY (156).", "Официальное название валюты — жэньминьби, счётная единица — юань."],
    en: ["1 yuan = 100 fen (or 10 jiao). ISO code CNY (156).", "The currency is officially called renminbi; the yuan is its unit of account."],
  },
  BYN: {
    ru: ["1 белорусский рубль = 100 копеек. Код валюты — BYN (933).", "Прилагательное согласуется с числом: один белорусский рубль, два белорусских рубля, пять белорусских рублей."],
    en: ["1 Belarusian ruble = 100 kopecks. ISO code BYN (933).", "In Russian the adjective agrees with the number: один белорусский рубль, два белорусских рубля."],
  },
  UAH: {
    ru: ["1 гривна = 100 копеек. Код валюты — UAH (980), знак — ₴.", "«Гривна» — женского рода, поэтому: одна гривна, две гривны, двадцать одна гривна, пять гривен."],
    en: ["1 hryvnia = 100 kopiykas. ISO code UAH (980), sign ₴.", "In Russian «гривна» is feminine: одна гривна, две гривны, пять гривен."],
  },
  GBP: {
    ru: ["1 фунт стерлингов = 100 пенсов. Код валюты — GBP (826), знак — £.", "В документах пишут полное название: один фунт стерлингов, два фунта стерлингов, пять фунтов стерлингов."],
    en: ["1 pound sterling = 100 pence. ISO code GBP (826), sign £.", "One penny, two pence: the singular is “penny”, the plural “pence”."],
  },
};

function currencyVariant(c: CurrencyDef): VariantDef {
  const m1234 = money("1234.56");
  const exRu = amountRu(m1234, c, { minor: "digits", wrap: "none", capitalize: true });
  const exEn = amountEn(m1234, c, { minor: "words", wrap: "none", capitalize: true });
  const f = c.ru.major.forms;
  const mf = c.ru.minor.forms;
  const mpl = c.ru.minorPl;
  const indecl = f[0] === f[1] && f[1] === f[2];
  const agreement = indecl
    ? `«${cap(f[0])}» не склоняется: один ${f[0]}, два ${f[0]}, пять ${f[0]}.`
    : `1, 21, 101 — ${f[0]}; 2–4, 22–24 — ${f[1]}; 0, 5–20, 25–30 — ${f[2]}.`;
  const faq: Record<Locale, QA[]> = {
    ru: [
      { q: `Как написать сумму прописью ${c.ru.inName}?`, a: `Целую часть пишут словами, затем название валюты${indecl ? "" : ` в нужной форме (${f[0]}, ${f[1]}, ${f[2]})`}, затем ${mpl} — цифрами или словами. Пример: 1 234,56 — «${exRu}».` },
      { q: `Как склоняется «${f[0]}» с числами?`, a: `${agreement} ${cap(mpl)}: 1 — ${mf[0]}, 2 — ${mf[1]}, 5 — ${mf[2]}${c.ru.minor.gender === "f" ? " (одна, две — женский род)" : ""}.` },
      { q: `Нужно ли писать ${mpl} прописью?`, a: `Обычно нет: в счетах и платёжках ${mpl} указывают двумя цифрами — «${amountRu(money("100.05"), c, { minor: "digits", wrap: "none", capitalize: true })}». Словами их пишут, если этого требует форма документа.` },
    ],
    en: [
      { q: `How do I write an amount in ${c.en.major[1]} in words?`, a: `Spell out the whole part, add the currency name, then the ${c.en.minor[1]}: 1,234.56 — “${exEn}”.` },
      { q: `How is it written in Russian?`, a: `${exRu}. The Russian currency noun changes with the number: ${f[0]} (1), ${f[1]} (2–4), ${f[2]} (5–20).` },
      { q: "Can the cents be written as digits?", a: `Yes — choose “00/100” for cents to get the cheque style: “${amountEn(m1234, c, { minor: "digits", wrap: "none", capitalize: true })}”.` },
    ],
  };
  return {
    slug: c.slug,
    name: { ru: `${cap(c.ru.name)} (${c.code})`, en: `${cap(c.en.name)} (${c.code})` },
    title: { ru: `Сумма прописью ${c.ru.inName} — онлайн`, en: `Amount in words in ${c.en.major[1]} (${c.code})` },
    h1: { ru: `Сумма прописью ${c.ru.inName}`, en: `${cap(c.en.major[1])} amount in words` },
    description: {
      ru: fit(`Сумма ${c.ru.inName} прописью: «${exRu}».`, [indecl ? "" : ` Окончания: ${f[0]}, ${f[1]}, ${f[2]}.`, [` ${cap(mpl)} цифрами или словами, формат для договоров и счетов.`, ` ${cap(mpl)} цифрами или словами.`, " Для счетов и договоров."]]),
      en: fit(`Write ${c.en.name} amounts in words: “${exEn}”.`, [[" English and Russian, cents as digits or words, contract format.", " English and Russian text."]]),
    },
    lead: { ru: `1 234,56 ${c.symbol} — ${exRu}`, en: `${moneyNumeric(m1234, c, "en")} — ${exEn}` },
    props: { currency: c.code },
    keywords: { ru: [`${f[2]} прописью`, `сумма прописью ${c.ru.inName}`, c.code], en: [`${c.en.major[1]} in words`, c.code] },
    blocks: (locale) => [
      {
        type: "table",
        title: locale === "ru" ? `Примеры: сумма прописью ${c.ru.inName}` : `Examples in ${c.en.major[1]}`,
        head: locale === "ru" ? ["Сумма", "Прописью"] : ["Amount", "In words"],
        rows: EXAMPLES.map((e) => {
          const m = money(e);
          return [moneyNumeric(m, c, locale), locale === "ru" ? amountRu(m, c, { minor: "digits", wrap: "none", capitalize: true }) : amountEn(m, c, { minor: "words", wrap: "none", capitalize: true })];
        }),
      },
      {
        type: "table",
        title: locale === "ru" ? "Формы названия валюты" : "Russian noun forms",
        head: locale === "ru" ? ["Число", "Валюта", "Разменная единица"] : ["Number", "Currency", "Minor unit"],
        rows: [1, 2, 5, 11, 21, 22, 25].map((n) => [String(n), ruPlural(n, f), ruPlural(n, mf)]),
      },
      { type: "list", title: locale === "ru" ? "Полезно знать" : "Good to know", items: NOTES[c.code][locale] },
    ],
    faq,
  };
}

export const amountTool: ToolDef = {
  slug: "amount-in-words",
  seoAlt: { ru: ["сумма прописью", "сумма словами"], en: ["write a sum in words", "sum in words", "spelled out"] },
  component: "numbers/amount-in-words",
  icon: "Banknote",
  popular: true,
  name: { ru: "Сумма прописью", en: "Amount in words" },
  title: { ru: "Сумма прописью онлайн — рубли, тенге, доллары, евро", en: "Amount in Words Converter — Dollars, Euros, Pounds" },
  h1: { ru: "Сумма прописью", en: "Amount in words converter" },
  description: {
    ru: "Сумма прописью для счетов и договоров: рубли и копейки, тенге и тиыны, доллары, евро. Верные окончания, копейки цифрами или словами, формат «100 (сто) рублей».",
    en: "Convert an amount to words for cheques, invoices and contracts: dollars and cents, euros, pounds, rubles, tenge. English and Russian, cents as 00/100 or words.",
  },
  lead: {
    ru: "Введите сумму и выберите валюту — текст прописью с правильными окончаниями появится сразу.",
    en: "Enter an amount and pick a currency — the amount in words appears instantly.",
  },
  keywords: {
    ru: ["сумма прописью", "сумма прописью онлайн", "рубли прописью", "тенге прописью", "копейки прописью"],
    en: ["amount in words", "check writing", "dollars in words", "cheque amount", "number to currency words"],
  },
  howTo: {
    ru: [
      "Введите сумму: копейки отделите запятой или точкой, пробелы между разрядами допустимы.",
      "Выберите валюту — рубли, тенге, доллары США, евро и другие.",
      "Укажите, как писать копейки (цифрами, прописью или не писать), и выберите формат: текст, «100 (сто) руб.» или в скобках.",
      "Скопируйте готовый текст для счёта, акта или договора.",
    ],
    en: [
      "Enter the amount — use a point for cents; commas between thousands are fine.",
      "Choose the currency: US dollars, euros, pounds, rubles, tenge and more.",
      "Pick how to show cents (00/100, in words or omitted) and whether to capitalize.",
      "Copy the English or Russian text into your cheque, invoice or contract.",
    ],
  },
  faq: {
    ru: [
      { q: "Как правильно писать сумму прописью в договоре?", a: "Обычно сначала цифрами, затем в скобках прописью, затем валюта и копейки цифрами: «1 500 (Одна тысяча пятьсот) рублей 00 копеек». Такой вариант включается в настройке «Формат»: «100 (сто) руб.»." },
      { q: "С большой или маленькой буквы?", a: "В платёжных документах сумму прописью начинают с заглавной буквы, в скобках после цифр — встречаются оба варианта. Переключатель «С заглавной буквы» меняет только первую букву." },
      { q: "Почему «одна тысяча», а не «тысяча»?", a: "В денежных документах принято писать «одна тысяча», «один миллион» — так текст труднее исправить. Обе формы грамматически верны." },
      { q: "Что будет, если указать больше двух знаков после запятой?", a: "Сумма округляется до копеек по математическим правилам (0,125 → 0,13), и под результатом появляется предупреждение." },
      { q: "Как пишутся копейки: «одна копейка» или «один копейка»?", a: "Копейка — женского рода: одна копейка, две копейки, двадцать одна копейка. Рубль, доллар, тенге и евро — мужского: один рубль, два доллара, двадцать один тенге." },
    ],
    en: [
      { q: "How do I write a cheque amount in words?", a: "Spell out the dollars and give the cents as a fraction of 100: “One thousand two hundred thirty-four dollars and 56/100”. Choose “00/100” for cents to get this style." },
      { q: "Should I include “and” in the amount?", a: "On US cheques “and” is used only before the cents (… dollars and 56/100). British style may also use it after hundred. The tool keeps the American form." },
      { q: "What happens with more than two decimals?", a: "The amount is rounded to whole cents (0.125 → 0.13) using exact decimal arithmetic, and a notice appears below the result." },
      { q: "Can I get the Russian version too?", a: "Yes. The Russian text uses correct agreement: один рубль, две тысячи рублей, двадцать одна копейка — useful for bilingual contracts." },
    ],
  },
  about: {
    ru: [
      "Сумму прописью указывают в платёжных поручениях, счетах, актах, договорах и расписках. Главное — правильно согласовать числительное с названием валюты: один рубль, два рубля, пять рублей; одна копейка, две копейки, пять копеек.",
      "Инструмент поддерживает российский рубль, казахстанский тенге, доллар США, евро, юань, белорусский рубль, гривну и фунт стерлингов — с русским и английским текстом. Все расчёты выполняются в браузере с точной десятичной арифметикой.",
    ],
    en: [
      "Amounts in words are required on cheques and are common in invoices, contracts and receipts to prevent tampering.",
      "The tool supports US dollars, euros, pounds sterling, Chinese yuan, Russian and Belarusian rubles, Kazakhstani tenge and Ukrainian hryvnias, producing both English and Russian text with exact decimal arithmetic.",
    ],
  },
  variants: {
    title: { ru: "Сумма прописью в валютах", en: "Amount in words by currency" },
    list: () => CURRENCIES.map(currencyVariant),
  },
};
