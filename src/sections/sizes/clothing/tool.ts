import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { nf, tt } from "../shared";
import { JEANS_LENGTH, MEN, SHIRTS, WOMEN, span, type MenRow, type WomenRow } from "./data";

const rng = (v: number) => {
  const [a, b] = span(v);
  return `${a}–${b}`;
};
const cmU = (l: Locale) => tt(l, "см", "cm");

/* ───────────── tables ───────────── */

function womenTable(l: Locale, kind: "tops" | "bottoms", rows: WomenRow[] = WOMEN, title?: string): Block {
  const head = ["RU", "INT", "EU / DE", "FR", "IT", "UK", "US"];
  return {
    type: "table",
    title: title ?? (kind === "tops" ? tt(l, "Женская одежда: верх, платья", "Women: tops and dresses") : tt(l, "Женская одежда: брюки, юбки, джинсы", "Women: trousers, skirts, jeans")),
    head:
      kind === "tops"
        ? [...head, tt(l, "Грудь, см", "Bust, cm"), tt(l, "Талия, см", "Waist, cm"), tt(l, "Бёдра, см", "Hips, cm")]
        : [...head, tt(l, "Талия, см", "Waist, cm"), tt(l, "Бёдра, см", "Hips, cm"), tt(l, "Джинсы W", "Jeans W")],
    rows: rows.map((r) => {
      const base = [String(r.ru), r.int, String(r.de), String(r.fr), String(r.it), String(r.uk), String(r.us)];
      return kind === "tops" ? [...base, rng(r.bust), rng(r.waist), rng(r.hips)] : [...base, rng(r.waist), rng(r.hips), `W${r.w}`];
    }),
  };
}

function menTable(l: Locale, kind: "tops" | "bottoms", rows: MenRow[] = MEN, title?: string): Block {
  return kind === "tops"
    ? {
        type: "table",
        title: title ?? tt(l, "Мужская одежда: пиджаки, свитеры, футболки", "Men: jackets, sweaters, T-shirts"),
        head: ["RU", "INT", "EU / DE", "IT / FR", tt(l, "UK / US (грудь, дюймы)", "UK / US (chest, in)"), tt(l, "Грудь, см", "Chest, cm"), tt(l, "Талия, см", "Waist, cm")],
        rows: rows.map((r) => [String(r.ru), r.int, String(r.eu), String(r.it), String(r.chestIn), rng(r.chest), rng(r.waist)]),
      }
    : {
        type: "table",
        title: title ?? tt(l, "Мужские брюки и джинсы", "Men's trousers and jeans"),
        head: ["RU", "INT", "EU / IT", tt(l, "Джинсы W (US/UK)", "Jeans W (US/UK)"), tt(l, "Талия, см", "Waist, cm"), tt(l, "Бёдра, см", "Hips, cm")],
        rows: rows.map((r) => [String(r.ru), r.int, String(r.eu), `W${r.w}`, rng(r.waist), rng(r.hips)]),
      };
}

const shirtsTable = (l: Locale): Block => ({
  type: "table",
  title: tt(l, "Мужские рубашки: размер по вороту", "Men's shirts: collar size"),
  head: [tt(l, "Ворот, см (EU/RU)", "Collar, cm (EU/RU)"), tt(l, "Ворот, дюймы (US/UK)", "Collar, in (US/UK)"), "INT"],
  rows: SHIRTS.map((r) => [String(r.collar), nf(l, r.collarIn, 2), r.int]),
});

const lengthTable = (l: Locale): Block => ({
  type: "table",
  title: tt(l, "Длина джинсов L", "Jeans length L"),
  head: ["L", tt(l, "Внутренний шов, см", "Inseam, cm"), tt(l, "Рост, см", "Height, cm")],
  rows: JEANS_LENGTH.map((r) => [`L${r.l}`, String(r.inseam), `${r.height[0]}–${r.height[1]}`]),
});

const MEASURE: Record<Locale, string[]> = {
  ru: [
    "Грудь — горизонтально по самым выступающим точкам груди и под лопатками.",
    "Талия — по самому узкому месту туловища, не втягивая живот.",
    "Бёдра — горизонтально по самым выступающим точкам ягодиц.",
    "Ворот (для рубашек) — у основания шеи, оставив под лентой палец.",
    "Лента должна прилегать к телу, но не стягивать; измеряйте поверх белья.",
  ],
  en: [
    "Bust/chest — horizontally around the fullest part of the chest and under the shoulder blades.",
    "Waist — around the narrowest part of the torso without pulling the stomach in.",
    "Hips — horizontally around the fullest part of the buttocks.",
    "Collar (for shirts) — around the base of the neck with a finger under the tape.",
    "Keep the tape snug but not tight and measure over underwear.",
  ],
};
const measureBlock = (l: Locale): Block => ({ type: "list", ordered: true, title: tt(l, "Как снять мерки", "How to measure"), items: MEASURE[l] });

const letterNote = (l: Locale): Block => ({
  type: "text",
  title: tt(l, "О буквенных размерах и брендах", "About letter sizes and brands"),
  paragraphs: [
    tt(
      l,
      "Буквенные размеры (S, M, L) не стандартизованы. В таблице — распространённое в российских магазинах соответствие; у многих европейских брендов та же вещь может быть помечена буквой на одну больше, а американские мужские M и L охватывают по два российских размера.",
      "Letter sizes (S, M, L) are not standardised. The chart shows the mapping common in Russian stores; many European brands label the same garment one letter larger, and US men's M and L each cover two Russian sizes.",
    ),
    tt(
      l,
      "Соответствия между странами примерные: лекала у брендов разные, особенно у азиатских (они обычно маломерят). Перед покупкой сверяйте свои обхваты с таблицей конкретного магазина.",
      "Cross-country equivalents are approximate: brands use different patterns, and Asian brands usually run small. Compare your measurements with the specific store's chart before buying.",
    ),
  ],
});

/* ───────────── variants ───────────── */

type TT = (l: Locale) => { title: string; h1: string; description: string; lead: string };

function mk(slug: string, name: VariantDef["name"], props: Record<string, unknown>, t: TT, blocks: (l: Locale) => Block[], faq: (l: Locale) => QA[], keywords: VariantDef["keywords"]): VariantDef {
  const ru = t("ru");
  const en = t("en");
  return {
    slug,
    name,
    props,
    keywords,
    title: { ru: ru.title, en: en.title },
    h1: { ru: ru.h1, en: en.h1 },
    description: { ru: ru.description, en: en.description },
    lead: { ru: ru.lead, en: en.lead },
    blocks,
    faq: { ru: faq("ru"), en: faq("en") },
  };
}

const W44 = WOMEN.find((r) => r.ru === 44)!;
const W46 = WOMEN.find((r) => r.ru === 46)!;
const M48 = MEN.find((r) => r.ru === 48)!;
const nextLetter = (rows: { int: string }[], int: string) => rows[Math.min(rows.findIndex((r) => r.int === int) + 1, rows.length - 1)].int;

function chartVariants(): VariantDef[] {
  const womenTopsFaq = (l: Locale): QA[] => [
    {
      q: tt(l, "Как перевести российский размер в европейский?", "How do I convert a Russian size to EU?"),
      a: tt(l, "Вычтите 6: RU 44 = EU 38, RU 48 = EU 42. Французский размер на 2 больше европейского, итальянский — на 4.", "Subtract 6: RU 44 = EU 38, RU 48 = EU 42. French sizes are EU + 2 and Italian sizes are EU + 4."),
    },
    {
      q: tt(l, "Как перевести российский размер в американский?", "How do I convert a Russian size to US?"),
      a: tt(l, "Вычтите 38: RU 44 = US 6, RU 48 = US 10. Британский размер на 4 больше американского: US 6 = UK 10.", "Subtract 38: RU 44 = US 6, RU 48 = US 10. UK sizes are US + 4: US 6 = UK 10."),
    },
    {
      q: tt(l, "Какой обхват груди у 46 размера?", "What bust fits Russian size 46?"),
      a: tt(l, "92 см (90–94). Российский размер — это половина обхвата груди: 46 × 2 = 92.", "92 cm (90–94). The Russian size is half the bust girth: 46 × 2 = 92."),
    },
  ];
  const womenBottomsFaq = (l: Locale): QA[] => [
    {
      q: tt(l, "Почему размер брюк может отличаться от размера блузки?", "Why can my trouser size differ from my top size?"),
      a: tt(
        l,
        "Верх подбирают по обхвату груди, низ — по обхвату бёдер и талии. При груди 88 см и бёдрах 100 см подойдут блузка 44 и брюки 46.",
        "Tops are chosen by bust, bottoms by hips and waist. With an 88 cm bust and 100 cm hips you need a size 44 top and size 46 trousers.",
      ),
    },
    {
      q: tt(l, "Что означает W на женских джинсах?", "What does W mean on women's jeans?"),
      a: tt(l, "W (waist) — обхват талии в дюймах: W28 ≈ 71 см. Российскому 44 обычно соответствуют W27–28.", "W (waist) is the waist girth in inches: W28 ≈ 71 cm. Russian size 44 usually matches W27–28."),
    },
    {
      q: tt(l, "Как выбрать, если талия и бёдра дают разные размеры?", "What if my waist and hips give different sizes?"),
      a: tt(l, "Берите больший размер — ушить в талии проще, чем расширить в бёдрах. Для стрейчевых тканей можно взять меньший.", "Take the larger size — taking in the waist is easier than letting out the hips. With stretch fabrics you can go smaller."),
    },
  ];
  const menTopsFaq = (l: Locale): QA[] => [
    {
      q: tt(l, "Какой российский размер соответствует M?", "What Russian size is M?"),
      a: tt(
        l,
        "В российских и европейских таблицах M — это 48 (обхват груди 94–98 см). У американских брендов M шире: обхват груди 38–40 дюймов, то есть RU 48–50.",
        "In Russian and European charts M is 48 (chest 94–98 cm). US brands size M more broadly: a 38–40 in chest, i.e. RU 48–50.",
      ),
    },
    {
      q: tt(l, "Российский и европейский мужские размеры совпадают?", "Are Russian and EU men's sizes the same?"),
      a: tt(l, "Да, для пиджаков, свитеров и футболок номер одинаковый — половина обхвата груди: 50 = 100 см. Итальянские и французские размеры такие же.", "Yes, for jackets, sweaters and T-shirts the number is the same — half the chest girth: 50 = 100 cm. Italian and French sizes match too."),
    },
    {
      q: tt(l, "Что значит американский размер пиджака 40?", "What does a US jacket size 40 mean?"),
      a: tt(l, "Это обхват груди в дюймах: 40″ ≈ 102 см, российский 50. Для перевода вычтите из российского размера 10.", "It is the chest girth in inches: 40″ ≈ 102 cm, Russian 50. Subtract 10 from the Russian size to convert."),
    },
  ];
  const menBottomsFaq = (l: Locale): QA[] => [
    {
      q: tt(l, "Что означают W и L на джинсах?", "What do W and L mean on jeans?"),
      a: tt(l, "W — обхват талии в дюймах, L — длина по внутреннему шву в дюймах. W32 L32 — талия около 81 см и шов 81 см.", "W is the waist in inches, L the inseam in inches. W32 L32 means about an 81 cm waist and an 81 cm inseam."),
    },
    {
      q: tt(l, "Какой W соответствует 50 размеру?", "What W matches Russian size 50?"),
      a: tt(l, "Примерно W34: у 50 размера обхват талии 84–88 см, это 33–35 дюймов.", "About W34: size 50 has an 84–88 cm waist, which is 33–35 inches."),
    },
    {
      q: tt(l, "Как выбрать длину L?", "How do I choose the length L?"),
      a: tt(l, "По росту: L30 — примерно 165–173 см, L32 — 173–182 см, L34 — 182–190 см, L36 — выше 190 см. Точнее — по длине внутреннего шва любимых брюк.", "By height: L30 ≈ 165–173 cm, L32 ≈ 173–182 cm, L34 ≈ 182–190 cm, L36 above 190 cm. For precision measure the inseam of trousers that fit."),
    },
  ];
  const shirtsFaq = (l: Locale): QA[] => [
    {
      q: tt(l, "Как узнать размер рубашки?", "How do I find my shirt size?"),
      a: tt(l, "Измерьте обхват шеи у основания, оставив под лентой палец. Полученное число в сантиметрах — ваш размер ворота: 40 см → рубашка 40 (15¾″).", "Measure around the base of your neck with a finger under the tape. That number in centimetres is your collar size: 40 cm → shirt 40 (15¾″)."),
    },
    {
      q: tt(l, "Как перевести размер рубашки в дюймы?", "How do I convert a collar size to inches?"),
      a: tt(l, "Разделите на 2,54 и округлите до половины дюйма: 39 см ≈ 15,5″, 41 см ≈ 16″, 43 см ≈ 17″.", "Divide by 2.54 and round to half an inch: 39 cm ≈ 15.5″, 41 cm ≈ 16″, 43 cm ≈ 17″."),
    },
    {
      q: tt(l, "Какой ворот у размера L?", "What collar is size L?"),
      a: tt(l, "Обычно 41–42 см (16–16,5″). M — 39–40 см, XL — 43–44 см.", "Usually 41–42 cm (16–16.5″). M is 39–40 cm and XL is 43–44 cm."),
    },
  ];

  return [
    mk(
      "women-tops",
      { ru: "Женский верх", en: "Women's tops" },
      { chart: "women-tops", ru: 44 },
      (l) => ({
        title: tt(l, "Таблица размеров женской одежды: RU, EU, US, UK, IT", "Women's clothing size chart: RU, EU, US, UK, IT"),
        h1: tt(l, "Таблица размеров женской одежды", "Women's clothing size chart"),
        description: tt(
          l,
          "Женские размеры 40–56: российские, международные (XXS–4XL), европейские, французские, итальянские, британские и американские с обхватами груди, талии и бёдер.",
          "Women's sizes RU 40–56 with letter (XXS–4XL), EU/DE, French, Italian, UK and US equivalents and the bust, waist and hip measurements of each size.",
        ),
        lead: tt(
          l,
          `44 = S = EU ${W44.de} = FR ${W44.fr} = IT ${W44.it} = UK ${W44.uk} = US ${W44.us} — при обхвате груди ${rng(W44.bust)} см.`,
          `RU 44 = S = EU ${W44.de} = FR ${W44.fr} = IT ${W44.it} = UK ${W44.uk} = US ${W44.us} — for a ${rng(W44.bust)} cm bust.`,
        ),
      }),
      (l) => [womenTable(l, "tops"), measureBlock(l), letterNote(l)],
      womenTopsFaq,
      { ru: ["таблица размеров женской одежды", "женские размеры", "размер платья"], en: ["women's size chart", "women's dress size conversion"] },
    ),
    mk(
      "women-bottoms",
      { ru: "Женские брюки и юбки", en: "Women's bottoms" },
      { chart: "women-bottoms", ru: 46 },
      (l) => ({
        title: tt(l, "Размеры женских брюк и юбок: таблица RU, EU, US, W", "Women's trouser and skirt sizes: RU, EU, US, W chart"),
        h1: tt(l, "Таблица размеров женских брюк, юбок и джинсов", "Women's trousers, skirts and jeans size chart"),
        description: tt(
          l,
          `Женские брюки, юбки и джинсы: размеры RU 40–56 в европейской, американской и британской системах и W, подбор по бёдрам и талии. RU 46 = EU ${W46.de} = W${W46.w}.`,
          `Women's trousers, skirts and jeans: sizes RU 40–56 in EU, US and UK systems and W, chosen by hips and waist. RU 46 = EU ${W46.de} = US ${W46.us} = W${W46.w}.`,
        ),
        lead: tt(
          l,
          `Низ подбирают по бёдрам: бёдра ${rng(W46.hips)} см — российский 46, EU ${W46.de}, US ${W46.us}, джинсы W${W46.w}.`,
          `Bottoms are chosen by hips: ${rng(W46.hips)} cm hips — Russian 46, EU ${W46.de}, US ${W46.us}, jeans W${W46.w}.`,
        ),
      }),
      (l) => [womenTable(l, "bottoms"), measureBlock(l), letterNote(l)],
      womenBottomsFaq,
      { ru: ["размер женских брюк", "размер юбки", "размер женских джинсов"], en: ["women's pants size chart", "women's jeans size"] },
    ),
    mk(
      "men-tops",
      { ru: "Мужской верх", en: "Men's tops" },
      { chart: "men-tops", ru: 48 },
      (l) => ({
        title: tt(l, "Таблица размеров мужской одежды: RU, EU, US, UK", "Men's clothing size chart: RU, EU, US, UK"),
        h1: tt(l, "Таблица размеров мужской одежды", "Men's clothing size chart"),
        description: tt(
          l,
          "Мужские размеры 44–60: российские, международные (XS–5XL), европейские, итальянские, американские и британские с обхватами груди и талии. RU 48 = M = US 38.",
          "Men's sizes RU 44–60 with letter (XS–5XL), EU, Italian, US and UK equivalents and chest and waist measurements. Russian 48 = M = EU 48 = US 38.",
        ),
        lead: tt(
          l,
          `48 = M = EU 48 = IT 48 = US/UK ${M48.chestIn} — при обхвате груди ${rng(M48.chest)} см.`,
          `RU 48 = M = EU 48 = IT 48 = US/UK ${M48.chestIn} — for a ${rng(M48.chest)} cm chest.`,
        ),
      }),
      (l) => [menTable(l, "tops"), measureBlock(l), letterNote(l)],
      menTopsFaq,
      { ru: ["таблица размеров мужской одежды", "мужские размеры"], en: ["men's size chart", "men's jacket size conversion"] },
    ),
    mk(
      "men-bottoms",
      { ru: "Мужские брюки и джинсы", en: "Men's trousers & jeans" },
      { chart: "men-bottoms", ru: 48 },
      (l) => ({
        title: tt(l, "Размеры мужских брюк и джинсов: таблица RU, EU, W, L", "Men's trouser and jeans sizes: RU, EU, W and L chart"),
        h1: tt(l, "Таблица размеров мужских брюк и джинсов", "Men's trousers and jeans size chart"),
        description: tt(
          l,
          `Мужские брюки и джинсы: российские размеры 44–60, европейские, W (талия в дюймах) и L (длина по внутреннему шву) с подбором по росту. RU 48 ≈ W${M48.w}.`,
          `Men's trousers and jeans: Russian sizes 44–60, EU sizes, W (waist in inches) and L (inseam) with a height guide. Russian 48 ≈ EU 48 ≈ W${M48.w}.`,
        ),
        lead: tt(
          l,
          `RU 48 ≈ EU 48 ≈ W${M48.w} — при обхвате талии ${rng(M48.waist)} см; длина L32 — для роста 173–182 см.`,
          `RU 48 ≈ EU 48 ≈ W${M48.w} for a ${rng(M48.waist)} cm waist; length L32 suits a height of 173–182 cm.`,
        ),
      }),
      (l) => [menTable(l, "bottoms"), lengthTable(l), measureBlock(l)],
      menBottomsFaq,
      { ru: ["размер мужских джинсов", "размеры брюк мужские", "w32 l32"], en: ["men's jeans size chart", "w32 l32", "men's pants size"] },
    ),
    mk(
      "men-shirts",
      { ru: "Мужские рубашки", en: "Men's shirts" },
      { chart: "men-shirts", collar: 41 },
      (l) => ({
        title: tt(l, "Размеры мужских рубашек по вороту: см, дюймы, S–XXL", "Men's shirt sizes by collar: cm, inches, S–XXL"),
        h1: tt(l, "Таблица размеров мужских рубашек", "Men's shirt size chart"),
        description: tt(
          l,
          "Размер рубашки — обхват шеи (ворота): 39 см = 15,5″ = M, 41 см = 16″ = L, 43 см = 17″ = XL. Таблица европейских и американских размеров от 37 до 46 см.",
          "A shirt size is the neck (collar) girth: 39 cm = 15.5″ = M, 41 cm = 16″ = L, 43 cm = 17″ = XL. EU and US collar sizes from 37 to 46 cm.",
        ),
        lead: tt(l, "Размер рубашки равен обхвату шеи: 41 см (EU/RU) = 16 дюймов (US/UK) = L.", "A shirt size equals the neck girth: 41 cm (EU) = 16 inches (US/UK) = L."),
      }),
      (l) => [shirtsTable(l), measureBlock(l)],
      shirtsFaq,
      { ru: ["размер мужской рубашки", "размер ворота рубашки"], en: ["men's shirt size chart", "collar size chart"] },
    ),
  ];
}

function womenSizeVariant(r: WomenRow): VariantDef {
  const idx = WOMEN.indexOf(r);
  const near = WOMEN.slice(Math.max(0, idx - 1), idx + 2);
  const alt = nextLetter(WOMEN, r.int);
  return mk(
    `women-${r.ru}`,
    { ru: `Жен. ${r.ru}`, en: `Women ${r.ru}` },
    { chart: "women-tops", ru: r.ru },
    (l) => ({
      title: tt(l, `${r.ru} размер женской одежды: ${r.int}, EU ${r.de}, US ${r.us}, UK ${r.uk}`, `Russian women's size ${r.ru}: ${r.int}, EU ${r.de}, US ${r.us}, UK ${r.uk}`),
      h1: tt(l, `${r.ru} размер женской одежды`, `Russian women's size ${r.ru}`),
      description: tt(
        l,
        `Женский ${r.ru} размер — это ${r.int}, европейский ${r.de}, французский ${r.fr}, итальянский ${r.it}, британский ${r.uk} и американский ${r.us}. Грудь ${rng(r.bust)}, талия ${rng(r.waist)}, бёдра ${rng(r.hips)} см.`,
        `Russian women's size ${r.ru} is ${r.int}, EU/DE ${r.de}, FR ${r.fr}, IT ${r.it}, UK ${r.uk} and US ${r.us}. Bust ${rng(r.bust)} cm, waist ${rng(r.waist)} cm, hips ${rng(r.hips)} cm.`,
      ),
      lead: tt(l, `${r.ru} = ${r.int} = EU ${r.de} = FR ${r.fr} = IT ${r.it} = UK ${r.uk} = US ${r.us}.`, `RU ${r.ru} = ${r.int} = EU ${r.de} = FR ${r.fr} = IT ${r.it} = UK ${r.uk} = US ${r.us}.`),
    }),
    (l) => [
      {
        type: "facts",
        title: tt(l, `${r.ru} размер в других системах`, `Size ${r.ru} in other systems`),
        rows: [
          [tt(l, "Международный", "Letter size"), r.int],
          [tt(l, "Европейский (DE)", "EU / German"), String(r.de)],
          [tt(l, "Французский", "French"), String(r.fr)],
          [tt(l, "Итальянский", "Italian"), String(r.it)],
          [tt(l, "Британский", "UK"), String(r.uk)],
          [tt(l, "Американский", "US"), String(r.us)],
          [tt(l, "Обхват груди", "Bust"), `${rng(r.bust)} ${cmU(l)}`],
          [tt(l, "Обхват талии", "Waist"), `${rng(r.waist)} ${cmU(l)}`],
          [tt(l, "Обхват бёдер", "Hips"), `${rng(r.hips)} ${cmU(l)}`],
          [tt(l, "Джинсы", "Jeans"), `W${r.w}`],
        ],
      },
      womenTable(l, "tops", near, tt(l, "Соседние размеры", "Neighbouring sizes")),
      letterNote(l),
    ],
    (l) => [
      {
        q: tt(l, `${r.ru} размер — это какая буква?`, `What letter size is Russian ${r.ru}?`),
        a: tt(
          l,
          `В российских таблицах ${r.ru} размер обозначают как ${r.int}. Буквы не стандартизованы: у многих европейских брендов тот же размер (EU ${r.de}) идёт как ${alt}, поэтому сверяйтесь с обхватами.`,
          `Russian charts label size ${r.ru} as ${r.int}. Letters are not standardised: many European brands mark the same size (EU ${r.de}) as ${alt}, so check the measurements.`,
        ),
      },
      {
        q: tt(l, `Какие обхваты у ${r.ru} размера?`, `What are the measurements of size ${r.ru}?`),
        a: tt(
          l,
          `Грудь ${rng(r.bust)} см, талия ${rng(r.waist)} см, бёдра ${rng(r.hips)} см. Российский размер — половина обхвата груди: ${r.ru} × 2 = ${r.bust} см.`,
          `Bust ${rng(r.bust)} cm, waist ${rng(r.waist)} cm, hips ${rng(r.hips)} cm. The Russian size is half the bust girth: ${r.ru} × 2 = ${r.bust} cm.`,
        ),
      },
      {
        q: tt(l, `Какой размер джинсов у ${r.ru} размера?`, `What jeans size matches Russian ${r.ru}?`),
        a: tt(
          l,
          `Примерно W${r.w}: W — это обхват талии в дюймах (${r.waist} см ≈ ${nf(l, r.waist / 2.54, 1)}″). Если бёдра больше ${r.hips + 2} см, берите брюки на размер больше.`,
          `About W${r.w}: W is the waist girth in inches (${r.waist} cm ≈ ${nf(l, r.waist / 2.54, 1)}″). If your hips are over ${r.hips + 2} cm, go one size up for trousers.`,
        ),
      },
    ],
    { ru: [`${r.ru} размер женский`, `${r.ru} размер это`, `${r.ru} размер ${r.int}`], en: [`russian size ${r.ru} women`, `size ${r.ru} to us`] },
  );
}

function menSizeVariant(r: MenRow): VariantDef {
  const idx = MEN.indexOf(r);
  const near = MEN.slice(Math.max(0, idx - 1), idx + 2);
  return mk(
    `men-${r.ru}`,
    { ru: `Муж. ${r.ru}`, en: `Men ${r.ru}` },
    { chart: "men-tops", ru: r.ru },
    (l) => ({
      title: tt(l, `${r.ru} размер мужской одежды: ${r.int}, EU ${r.eu}, US ${r.chestIn}`, `Russian men's size ${r.ru}: ${r.int}, EU ${r.eu}, US/UK ${r.chestIn}`),
      h1: tt(l, `${r.ru} размер мужской одежды`, `Russian men's size ${r.ru}`),
      description: tt(
        l,
        `Мужской ${r.ru} размер — это ${r.int}, европейский и итальянский ${r.eu}, американский и британский ${r.chestIn} (грудь в дюймах). Грудь ${rng(r.chest)} см, талия ${rng(r.waist)} см, джинсы W${r.w}.`,
        `Russian men's size ${r.ru} is ${r.int}, EU and Italian ${r.eu}, US and UK ${r.chestIn} (chest in inches). Chest ${rng(r.chest)} cm, waist ${rng(r.waist)} cm, jeans W${r.w}.`,
      ),
      lead: tt(l, `${r.ru} = ${r.int} = EU ${r.eu} = IT ${r.it} = US/UK ${r.chestIn}.`, `RU ${r.ru} = ${r.int} = EU ${r.eu} = IT ${r.it} = US/UK ${r.chestIn}.`),
    }),
    (l) => [
      {
        type: "facts",
        title: tt(l, `${r.ru} размер в других системах`, `Size ${r.ru} in other systems`),
        rows: [
          [tt(l, "Международный", "Letter size"), r.int],
          [tt(l, "Европейский / итальянский", "EU / Italian"), String(r.eu)],
          [tt(l, "Американский / британский (пиджак)", "US / UK (jacket)"), String(r.chestIn)],
          [tt(l, "Обхват груди", "Chest"), `${rng(r.chest)} ${cmU(l)}`],
          [tt(l, "Обхват талии", "Waist"), `${rng(r.waist)} ${cmU(l)}`],
          [tt(l, "Обхват бёдер", "Hips"), `${rng(r.hips)} ${cmU(l)}`],
          [tt(l, "Джинсы", "Jeans"), `W${r.w}`],
        ],
      },
      menTable(l, "tops", near, tt(l, "Соседние размеры", "Neighbouring sizes")),
      letterNote(l),
    ],
    (l) => [
      {
        q: tt(l, `${r.ru} размер — это какая буква?`, `What letter size is Russian ${r.ru}?`),
        a: tt(
          l,
          `По российским и европейским таблицам — ${r.int}. У американских брендов буквенные размеры шире: M — это грудь 38–40″ (RU 48–50), поэтому сверяйтесь с обхватом груди — ${rng(r.chest)} см.`,
          `Russian and European charts say ${r.int}. US brands size letters more broadly (M = 38–40″ chest, RU 48–50), so check the chest girth — ${rng(r.chest)} cm.`,
        ),
      },
      {
        q: tt(l, `Какой американский размер у ${r.ru}?`, `What US size is Russian ${r.ru}?`),
        a: tt(
          l,
          `Для пиджаков и курток — ${r.chestIn} (обхват груди в дюймах: ${r.chest} см ≈ ${nf(l, r.chest / 2.54, 1)}″). Для брюк и джинсов — W${r.w}, это талия в дюймах.`,
          `For jackets it is ${r.chestIn} (chest in inches: ${r.chest} cm ≈ ${nf(l, r.chest / 2.54, 1)}″). For trousers and jeans it is W${r.w}, the waist in inches.`,
        ),
      },
    ],
    { ru: [`${r.ru} размер мужской`, `${r.ru} размер это`, `${r.ru} размер ${r.int}`], en: [`russian size ${r.ru} men`, `size ${r.ru} to us`] },
  );
}

/* ───────────── tool ───────────── */

export const clothingTool: ToolDef = {
  slug: "clothing-size-chart",
  component: "sizes/clothing",
  icon: "Shirt",
  popular: true,
  name: { ru: "Размеры одежды", en: "Clothing sizes" },
  title: { ru: "Таблица размеров одежды: RU, EU, US, UK, IT, FR", en: "Clothing size chart and converter: RU, EU, US, UK, IT" },
  h1: { ru: "Таблица размеров одежды", en: "Clothing size chart" },
  description: {
    ru: "Перевод размеров женской и мужской одежды: российские, европейские, американские, британские, итальянские и французские, S–XXL. Женский RU 44 = S = EU 38 = US 6.",
    en: "Convert women's and men's clothing sizes between Russian, EU, US, UK, Italian and French systems and S–XXL, with body measurements. Russian 44 = S = EU 38 = US 6.",
  },
  lead: {
    ru: "Выберите таблицу и размер — увидите аналоги в других странах и обхваты груди, талии и бёдер.",
    en: "Pick a chart and a size to see its equivalents in other countries and the bust, waist and hip measurements.",
  },
  keywords: {
    ru: ["размеры одежды", "таблица размеров одежды", "европейский размер одежды", "американский размер одежды", "s m l размер"],
    en: ["clothing size chart", "clothing size converter", "eu to us clothing size", "russian clothing sizes"],
  },
  props: { chart: "women-tops", ru: 44 },
  howTo: {
    ru: [
      "Выберите таблицу: женская или мужская одежда, верх или низ, мужские рубашки.",
      "Укажите систему и известный размер — например, российский 46 или европейский 40.",
      "Не знаете размер — откройте «Подобрать по меркам» и введите обхваты в сантиметрах.",
      "Сверьтесь с таблицей конкретного бренда: соответствия между странами примерные.",
    ],
    en: [
      "Choose a chart: women's or men's, tops or bottoms, or men's shirts.",
      "Pick the system and the size you know — e.g. Russian 46 or EU 40.",
      "Don't know your size? Open “Find by measurements” and enter your girths in centimetres.",
      "Check the brand's own chart: cross-country equivalents are approximate.",
    ],
  },
  faq: {
    ru: [
      { q: "Как перевести российский размер одежды в европейский?", a: "Для женской одежды европейский (немецкий) размер на 6 меньше российского: RU 44 = EU 38, RU 48 = EU 42. У мужских пиджаков, свитеров и футболок номера совпадают: RU 50 = EU 50." },
      { q: "Какой российский размер соответствует S, M, L?", a: "Женские: S — 44, M — 46, L — 48, XL — 50. Мужские: S — 46, M — 48, L — 50, XL — 52. Буквенные размеры не стандартизованы: у американских брендов мужской M охватывает 48–50, а у немецких женская M часто соответствует EU 38 (RU 44)." },
      { q: "Почему размер верха и низа может отличаться?", a: "Верх подбирают по обхвату груди, низ — по обхвату бёдер и талии. При груди 88 см и бёдрах 100 см нужен верх 44 и низ 46 — поэтому в конвертере отдельные таблицы." },
      { q: "Что означают W и L на джинсах?", a: "W (waist) — обхват талии в дюймах, L (length) — длина по внутреннему шву в дюймах. W32 L32 — талия около 81 см, длина шва 81 см." },
      { q: "Как правильно снять мерки?", a: "Грудь — по самым выступающим точкам, талия — по самому узкому месту, бёдра — по самым выступающим точкам ягодиц. Лента должна прилегать, но не стягивать." },
    ],
    en: [
      { q: "How do I convert Russian clothing sizes to EU?", a: "For women the EU (German) size is the Russian size minus 6: RU 44 = EU 38, RU 48 = EU 42. Men's jackets, sweaters and T-shirts use the same number: RU 50 = EU 50." },
      { q: "Which Russian sizes are S, M and L?", a: "Women: S — 44, M — 46, L — 48, XL — 50. Men: S — 46, M — 48, L — 50, XL — 52. Letter sizes are not standardised: US brands' men's M covers 48–50, and German women's M is often EU 38 (RU 44)." },
      { q: "Why can my top and bottom sizes differ?", a: "Tops are chosen by bust, bottoms by hips and waist. With an 88 cm bust and 100 cm hips you need a size 44 top and size 46 bottoms — that's why the converter has separate charts." },
      { q: "What do W and L mean on jeans?", a: "W (waist) is the waist girth in inches and L (length) the inseam in inches. W32 L32 means about an 81 cm waist and an 81 cm inseam." },
      { q: "How do I take measurements?", a: "Bust around the fullest part, waist at the narrowest point, hips around the fullest part of the buttocks. Keep the tape snug but not tight." },
    ],
  },
  about: {
    ru: [
      "Российский размер одежды равен половине обхвата груди: 48 — это обхват 96 см. Немецкие (европейские) женские размеры на 6 меньше российских — DE 38 соответствует груди 88 см, французские на 2 больше немецких, итальянские — на 4. Британские женские размеры на 28 меньше немецких, американские — ещё на 4 меньше.",
      "Мужские пиджаки, свитеры и футболки в России, Германии, Италии и Франции размечаются одинаково — половиной обхвата груди. В США и Великобритании размер пиджака — это обхват груди в дюймах (38 ≈ 96,5 см), размер брюк и джинсов — обхват талии в дюймах.",
      "У каждой таблицы свои мерки: верх подбирают по обхвату груди, низ — по бёдрам и талии, рубашки — по обхвату шеи. Поэтому одна и та же женщина может носить блузку 44 и брюки 46.",
    ],
    en: [
      "A Russian clothing size is half the bust/chest girth: 48 means a 96 cm chest. German (EU) women's sizes are the Russian number minus 6 — DE 38 fits an 88 cm bust; French sizes are German + 2 and Italian German + 4. UK women's sizes are German − 28 and US sizes another 4 lower.",
      "Men's jackets, sweaters and T-shirts in Russia, Germany, Italy and France share one number — half the chest girth. In the US and UK a jacket size is the chest in inches (38 ≈ 96.5 cm) and trouser or jeans sizes are the waist in inches.",
      "Each chart is defined by its own measurements: tops by bust or chest, bottoms by hips and waist, shirts by neck girth.",
    ],
  },
  related: ["convert/centimeters-to-inches", "convert/inches-to-centimeters"],
  variants: {
    title: { ru: "Таблицы и размеры", en: "Charts and sizes" },
    list: () => [...chartVariants(), ...WOMEN.map(womenSizeVariant), ...MEN.map(menSizeVariant)],
  },
  blocks: (l) => [womenTable(l, "tops"), womenTable(l, "bottoms"), menTable(l, "tops"), menTable(l, "bottoms"), measureBlock(l)],
};

