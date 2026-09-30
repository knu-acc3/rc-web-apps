import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { inchWord, nf, nfix, tt, type Txt } from "../shared";
import { COMMON_DPI, PAPER, PAPER_BY_SLUG, areaM2, inchesOf, isoIndex, mmToPt, paperPx, type PaperFormat } from "./data";

/* ───────────── typical uses ───────────── */

const USES: Record<string, Txt> = {
  a0: { ru: "Плакаты, чертежи, архитектурные планы и научные постеры.", en: "Posters, technical drawings, architectural plans and scientific posters." },
  a1: { ru: "Плакаты, чертежи, флипчарты и рекламные стенды.", en: "Posters, drawings, flip charts and display boards." },
  a2: { ru: "Плакаты, настенные календари, чертежи и меню.", en: "Posters, wall calendars, drawings and menus." },
  a3: { ru: "Чертежи, схемы, таблицы, небольшие плакаты и развороты журналов (две страницы A4).", en: "Drawings, diagrams, spreadsheets, small posters and magazine spreads (two A4 pages)." },
  a4: { ru: "Стандартный офисный лист: документы, письма, договоры, анкеты и повседневная печать.", en: "The standard office sheet: documents, letters, contracts, forms and everyday printing." },
  a5: { ru: "Блокноты, ежедневники, книги, листовки и буклеты.", en: "Notebooks, diaries, books, flyers and booklets." },
  a6: { ru: "Открытки, карманные книги и листовки; близок к фотографии 10 × 15 см.", en: "Postcards, pocket books and flyers; close to a 10 × 15 cm photo print." },
  a7: { ru: "Карманные календари, этикетки и небольшие листовки.", en: "Pocket calendars, labels and small leaflets." },
  a8: { ru: "Этикетки, ярлыки и карточки; немного меньше визитки.", en: "Labels, tags and cards; slightly smaller than a business card." },
  b5: { ru: "Книги, журналы и тетради.", en: "Books, magazines and exercise books." },
  b7: { ru: "Книжка паспорта: формат B7 (88 × 125 мм) используют паспорта по стандарту ICAO.", en: "Passport booklets: ICAO-standard passports use B7 (88 × 125 mm)." },
  c3: { ru: "Конверт для листа A3 без сгиба.", en: "Envelope for an unfolded A3 sheet." },
  c4: { ru: "Конверт для листа A4 без сгиба — для документов, которые нельзя складывать.", en: "Envelope for an unfolded A4 sheet — for documents that must not be folded." },
  c5: { ru: "Конверт для листа A5 или A4, сложенного пополам.", en: "Envelope for an A5 sheet or an A4 sheet folded once." },
  c6: { ru: "Конверт для листа A6 или A4, сложенного дважды; открытки.", en: "Envelope for an A6 sheet or an A4 sheet folded twice; greeting cards." },
  c7: { ru: "Небольшой конверт для карточек формата A7.", en: "Small envelope for A7 cards." },
  letter: { ru: "Стандартный офисный лист в США, Канаде и Мексике — местный аналог A4.", en: "Standard office paper in the US, Canada and Mexico — the local counterpart of A4." },
  legal: { ru: "Юридические документы и договоры в США и Канаде.", en: "Legal documents and contracts in the US and Canada." },
  tabloid: { ru: "Газеты-таблоиды, плакаты и большие таблицы; в альбомной ориентации (17 × 11″) формат называется Ledger.", en: "Tabloid newspapers, posters and large spreadsheets; in landscape (17 × 11″) the same sheet is called Ledger." },
  executive: { ru: "Фирменные бланки, блокноты и деловая переписка в США.", en: "Letterheads, notepads and business correspondence in the US." },
  "half-letter": { ru: "Буклеты, ежедневники и блокноты; другое название — Statement.", en: "Booklets, planners and notepads; also called Statement." },
  sra3: { ru: "Печатный лист для тиража A3 с вылетами под обрез: запас оставляет место для обрезки и меток.", en: "Press sheet for A3 jobs with bleed: the margin leaves room for trimming and printer's marks." },
  sra4: { ru: "Печатный лист для тиража A4 с вылетами под обрез.", en: "Press sheet for A4 jobs with bleed." },
  dl: { ru: "Евроконверт для листа A4, сложенного в три раза (вкладыш 99 × 210 мм), приглашения и листовки евроформата.", en: "Envelope for an A4 sheet folded in three (99 × 210 mm insert), invitations and DL flyers." },
  "jis-b4": { ru: "Японский стандарт JIS P 0138; в Японии — распространённый формат копировальной бумаги.", en: "Japanese JIS P 0138 standard; a common copier paper size in Japan." },
  "jis-b5": { ru: "В Японии — тетради, книги и журналы.", en: "In Japan — notebooks, books and magazines." },
  "jis-b6": { ru: "В Японии — книги и блокноты небольшого формата.", en: "In Japan — small books and notepads." },
};

const SERIES_USES: Record<string, Txt> = {
  a: { ru: "Мелкие этикетки и ярлыки.", en: "Small labels and tags." },
  b: { ru: "Плакаты, афиши и промежуточные форматы между листами серии A.", en: "Posters and sizes in between the A-series sheets." },
  c: { ru: "Конверты и папки для листов серии A того же номера.", en: "Envelopes and folders for A-series sheets of the same number." },
};

export const usesOf = (p: PaperFormat): Txt => USES[p.slug] ?? SERIES_USES[p.series] ?? SERIES_USES.a;

/* ───────────── text helpers ───────────── */

const mm = (l: Locale, p: PaperFormat) => `${nf(l, p.w, 2)} × ${nf(l, p.h, 2)} ${tt(l, "мм", "mm")}`;
const cm = (l: Locale, p: PaperFormat) => `${nf(l, p.w / 10, 3)} × ${nf(l, p.h / 10, 3)} ${tt(l, "см", "cm")}`;
const inches = (l: Locale, p: PaperFormat, digits = 2) => {
  const [a, b] = inchesOf(p);
  return `${nf(l, a, digits)} × ${nf(l, b, digits)}`;
};
const inchLong = (l: Locale, p: PaperFormat) => `${inches(l, p)} ${inchWord(l, Number(inchesOf(p)[1].toFixed(2)))}`;
const px = (p: PaperFormat, dpi: number) => {
  const [a, b] = paperPx(p, dpi);
  return `${a} × ${b}`;
};
const isEnvelope = (p: PaperFormat) => p.series === "c" || p.series === "env";
const kindWord = (l: Locale, p: PaperFormat) => (isEnvelope(p) ? tt(l, "конверта", "envelope") : tt(l, "листа", "paper"));

const seriesLabel = (l: Locale, p: PaperFormat): string => {
  switch (p.series) {
    case "a":
      return tt(l, "ISO 216, серия A", "ISO 216, A series");
    case "b":
      return tt(l, "ISO 216, серия B", "ISO 216, B series");
    case "c":
      return tt(l, "ISO 269, серия C (конверты)", "ISO 269, C series (envelopes)");
    case "us":
      return tt(l, "Североамериканский (ANSI)", "North American (ANSI)");
    case "sra":
      return tt(l, "ISO 217, серия SRA (печатные листы)", "ISO 217, SRA series (press sheets)");
    case "env":
      return tt(l, "ISO 269 / DIN 678 (конверт)", "ISO 269 / DIN 678 (envelope)");
    case "jis":
      return tt(l, "JIS P 0138 (Япония)", "JIS P 0138 (Japan)");
  }
};

const ratioText = (l: Locale, p: PaperFormat) => {
  const r = p.h / p.w;
  const base = `1:${nfix(l, r, 3)}`;
  return isoIndex(p) !== null ? `${base} (1:√2)` : base;
};

/* ───────────── variant pages ───────────── */

function neighbours(p: PaperFormat): { bigger?: PaperFormat; smaller?: PaperFormat } {
  const i = isoIndex(p);
  if (i === null) return {};
  const s = p.series;
  return { bigger: PAPER_BY_SLUG.get(`${s}${i - 1}`), smaller: PAPER_BY_SLUG.get(`${s}${i + 1}`) };
}

function facts(l: Locale, p: PaperFormat): [string, string][] {
  const rows: [string, string][] = [
    [tt(l, "Размер в миллиметрах", "Size in millimetres"), mm(l, p)],
    [tt(l, "В сантиметрах", "In centimetres"), cm(l, p)],
    [tt(l, "В дюймах", "In inches"), `${inches(l, p)}″${p.inch ? tt(l, " (точно)", " (exact)") : ""}`],
    [tt(l, "В пунктах (1 pt = 1/72″)", "In points (1 pt = 1/72″)"), `${nf(l, mmToPt(p.w), 2)} × ${nf(l, mmToPt(p.h), 2)} pt`],
    [tt(l, "Площадь", "Area"), `${nf(l, areaM2(p), 4)} ${tt(l, "м²", "m²")}`],
    [tt(l, "Соотношение сторон", "Aspect ratio"), ratioText(l, p)],
    [tt(l, "Масса листа 80 г/м²", "Weight at 80 g/m²"), `${nf(l, areaM2(p) * 80, 2)} ${tt(l, "г", "g")}`],
    [tt(l, "Стандарт", "Standard"), seriesLabel(l, p)],
  ];
  const i = isoIndex(p);
  if (p.series === "a" && i !== null && i > 0) rows.push([tt(l, "Листов в A0", "Sheets per A0"), String(2 ** i)]);
  if (p.series === "c" && i !== null) rows.push([tt(l, "Вмещает", "Holds"), tt(l, `лист A${i} без сгиба`, `an unfolded A${i} sheet`)]);
  if (p.series === "sra") rows.push([tt(l, "Готовый формат после обрезки", "Trimmed format"), p.slug === "sra3" ? "A3" : "A4"]);
  return rows;
}

function relationText(l: Locale, p: PaperFormat): string {
  const { bigger, smaller } = neighbours(p);
  const a4 = PAPER_BY_SLUG.get("a4")!;
  if (bigger || smaller) {
    const parts: string[] = [];
    if (bigger) parts.push(tt(l, `${p.name} — половина листа ${bigger.name} (${mm(l, bigger)})`, `${p.name} is half of ${bigger.name} (${mm(l, bigger)})`));
    if (smaller) parts.push(tt(l, `из одного ${p.name} получаются два ${smaller.name} (${mm(l, smaller)})`, `one ${p.name} makes two ${smaller.name} sheets (${mm(l, smaller)})`));
    return `${parts.join(tt(l, ", а ", ", and "))}.`;
  }
  const dw = p.w - a4.w;
  const dh = p.h - a4.h;
  const d = (n: number) => nf(l, Math.abs(n), 1);
  return tt(
    l,
    `По сравнению с A4 формат ${p.name} ${dw >= 0 ? "шире" : "уже"} на ${d(dw)} мм и ${dh >= 0 ? "длиннее" : "короче"} на ${d(dh)} мм.`,
    `Compared with A4, ${p.name} is ${d(dw)} mm ${dw >= 0 ? "wider" : "narrower"} and ${d(dh)} mm ${dh >= 0 ? "longer" : "shorter"}.`,
  );
}

function variantBlocks(p: PaperFormat) {
  return (l: Locale): Block[] => [
    { type: "facts", title: tt(l, `Размеры ${p.name}`, `${p.name} dimensions`), rows: facts(l, p) },
    {
      type: "table",
      title: tt(l, `${p.name} в пикселях при разном DPI`, `${p.name} in pixels at common DPI`),
      head: ["DPI", tt(l, "Книжная, px", "Portrait, px"), tt(l, "Альбомная, px", "Landscape, px"), tt(l, "Мегапиксели", "Megapixels")],
      rows: COMMON_DPI.map((dpi) => {
        const [a, b] = paperPx(p, dpi);
        return [String(dpi), `${a} × ${b}`, `${b} × ${a}`, nf(l, (a * b) / 1e6, 1)];
      }),
    },
    { type: "text", title: tt(l, `Где используется ${p.name}`, `What ${p.name} is used for`), paragraphs: [usesOf(p)[l], relationText(l, p)].filter(Boolean) },
  ];
}

function variantFaq(p: PaperFormat): Record<Locale, QA[]> {
  const make = (l: Locale): QA[] => {
    const out: QA[] = [
      {
        q: tt(l, `Какой размер ${p.name} в пикселях?`, `What is ${p.name} in pixels?`),
        a: tt(
          l,
          `При 300 DPI (качественная печать) — ${px(p, 300)} пикселей, при 150 DPI — ${px(p, 150)}, при 96 DPI — ${px(p, 96)}, при 72 DPI — ${px(p, 72)}. Формула: миллиметры / 25,4 × DPI.`,
          `At 300 DPI (quality print) it is ${px(p, 300)} pixels, at 150 DPI ${px(p, 150)}, at 96 DPI ${px(p, 96)} and at 72 DPI ${px(p, 72)}. Formula: millimetres / 25.4 × DPI.`,
        ),
      },
      {
        q: tt(l, `Какой размер ${p.name} в сантиметрах и дюймах?`, `What is ${p.name} in centimetres and inches?`),
        a: tt(l, `${p.name} — ${cm(l, p)}, или ${inchLong(l, p)}.`, `${p.name} is ${cm(l, p)}, or ${inchLong(l, p)}.`),
      },
    ];
    const rel = relationText(l, p);
    if (rel) out.push({ q: tt(l, `Как ${p.name} соотносится с другими форматами?`, `How does ${p.name} compare with other sizes?`), a: rel });
    out.push({ q: tt(l, `Для чего используется ${p.name}?`, `What is ${p.name} used for?`), a: usesOf(p)[l] });
    return out;
  };
  return { ru: make("ru"), en: make("en") };
}

function paperVariant(p: PaperFormat): VariantDef {
  const t = (l: Locale) => {
    const [iw, ih] = inchesOf(p);
    const inchShort = `${nf(l, iw, 2)} × ${nf(l, ih, 2)}″`;
    const extra =
      isoIndex(p) !== null
        ? tt(l, " Соотношение сторон 1:√2.", " Aspect ratio 1:√2.")
        : p.series === "us"
          ? tt(l, " Стандарт США и Канады.", " US and Canadian standard.")
          : "";
    return {
      title: tt(l, `Размер ${kindWord(l, p)} ${p.name} в мм, см, дюймах и пикселях`, `${p.name} ${isEnvelope(p) ? "envelope" : "paper"} size in mm, cm, inches and pixels`),
      h1: tt(l, `Размер ${kindWord(l, p)} ${p.name}`, `${p.name} ${kindWord(l, p)} size`),
      description: tt(
        l,
        `${p.name}: ${mm(l, p)} (${cm(l, p)}, ${inchShort}). При 300 DPI — ${px(p, 300)} пикселей, при 72 DPI — ${px(p, 72)}.${extra}`,
        `${p.name}: ${mm(l, p)} (${cm(l, p)}, ${inchShort}). At 300 DPI it is ${px(p, 300)} pixels, at 72 DPI ${px(p, 72)}.${extra}`,
      ),
      lead: p.inch
        ? tt(l, `${p.name} — ${inchLong(l, p)}, или ${mm(l, p)}.`, `${p.name} is ${inchLong(l, p)}, or ${mm(l, p)}.`)
        : tt(l, `${p.name} — ${mm(l, p)}, или ${cm(l, p)}, или ${inchLong(l, p)}.`, `${p.name} is ${mm(l, p)}, or ${cm(l, p)}, or ${inchLong(l, p)}.`),
    };
  };
  const ru = t("ru");
  const en = t("en");
  return {
    slug: p.slug,
    name: { ru: p.name, en: p.name },
    title: { ru: ru.title, en: en.title },
    h1: { ru: ru.h1, en: en.h1 },
    description: { ru: ru.description, en: en.description },
    lead: { ru: ru.lead, en: en.lead },
    props: { format: p.slug },
    keywords: { ru: [`${p.name} размер`, `${p.name} в пикселях`, `формат ${p.name}`], en: [`${p.name} size`, `${p.name} in pixels`, `${p.name} dimensions`] },
    blocks: variantBlocks(p),
    faq: variantFaq(p),
  };
}

/* ───────────── tool page ───────────── */

function seriesTable(l: Locale, title: string, list: PaperFormat[]): Block {
  return {
    type: "table",
    title,
    head: [tt(l, "Формат", "Format"), tt(l, "мм", "mm"), tt(l, "дюймы", "inches"), tt(l, "px при 300 DPI", "px at 300 DPI")],
    rows: list.map((p) => [p.name, `${nf(l, p.w, 2)} × ${nf(l, p.h, 2)}`, inches(l, p), px(p, 300)]),
  };
}

export const paperTool: ToolDef = {
  slug: "paper-sizes",
  component: "sizes/paper",
  icon: "FileText",
  popular: true,
  name: { ru: "Форматы бумаги", en: "Paper sizes" },
  title: { ru: "Форматы бумаги: размеры A4, A3, A5 в мм и пикселях", en: "Paper sizes: A4, A3, A5, Letter in mm, inches and pixels" },
  h1: { ru: "Размеры форматов бумаги", en: "Paper sizes" },
  description: {
    ru: "Размеры форматов бумаги A0–A10, B0–B10, C0–C10, SRA, DL, Letter и Legal в мм, см, дюймах и пикселях при 72–600 DPI. A4 — 210 × 297 мм.",
    en: "Paper sizes A0–A10, B0–B10, C0–C10, SRA, DL, Letter and Legal in mm, cm, inches and pixels at 72–600 DPI. A4 is 210 × 297 mm.",
  },
  lead: {
    ru: "A4 — 210 × 297 мм, A3 — 297 × 420 мм, A5 — 148 × 210 мм. Выберите формат и DPI, чтобы получить размер в пикселях.",
    en: "A4 is 210 × 297 mm, A3 is 297 × 420 mm, A5 is 148 × 210 mm. Pick a format and DPI to get the size in pixels.",
  },
  keywords: {
    ru: ["размер а4", "формат а4 в пикселях", "размеры листов", "форматы бумаги", "a3", "a5", "letter"],
    en: ["a4 size", "paper sizes", "a4 in pixels", "letter size", "a3 size", "iso 216"],
  },
  props: { format: "a4" },
  howTo: {
    ru: [
      "Выберите формат: серии A, B и C, североамериканские Letter и Legal, печатные листы SRA, конверт DL или японские JIS B.",
      "Укажите ориентацию — книжную или альбомную.",
      "Задайте разрешение: 300 DPI — для печати, 72 или 96 — для экрана, либо введите своё значение.",
      "Скопируйте нужный размер: в миллиметрах, дюймах, пунктах или пикселях.",
    ],
    en: [
      "Choose a format: A, B and C series, North American Letter and Legal, SRA press sheets, DL envelopes or Japanese JIS B.",
      "Set the orientation — portrait or landscape.",
      "Pick a resolution: 300 DPI for print, 72 or 96 for screens, or type your own.",
      "Copy the size you need in millimetres, inches, points or pixels.",
    ],
  },
  faq: {
    ru: [
      { q: "Какой размер у листа A4?", a: "210 × 297 мм, или 21 × 29,7 см, или 8,27 × 11,69 дюйма. В пикселях при 300 DPI — 2480 × 3508, при 72 DPI — 595 × 842." },
      { q: "Как перевести формат бумаги в пиксели?", a: "Разделите размер в миллиметрах на 25,4 (получатся дюймы) и умножьте на DPI: 210 / 25,4 × 300 ≈ 2480 пикселей. Калькулятор делает это автоматически и округляет до целого." },
      { q: "Почему у форматов A соотношение сторон 1:√2?", a: "Лист с таким соотношением, разрезанный пополам поперёк длинной стороны, сохраняет пропорции. Поэтому A3 — это два A4, а лист A0 площадью 1 м² делится на 16 листов A4." },
      { q: "Чем Letter отличается от A4?", a: "Letter (8,5 × 11″ = 215,9 × 279,4 мм) шире A4 на 5,9 мм и короче на 17,6 мм. Документ, свёрстанный под один формат, при печати на другом масштабируется или обрезается по краям." },
      { q: "Какой конверт нужен для листа A4?", a: "C4 (229 × 324 мм) — для листа без сгиба, C5 (162 × 229 мм) — для сложенного пополам, DL (110 × 220 мм) — для сложенного в три раза." },
    ],
    en: [
      { q: "What size is A4 paper?", a: "210 × 297 mm, or 21 × 29.7 cm, or 8.27 × 11.69 inches. In pixels that is 2480 × 3508 at 300 DPI and 595 × 842 at 72 DPI." },
      { q: "How do I convert a paper size to pixels?", a: "Divide millimetres by 25.4 to get inches and multiply by the DPI: 210 / 25.4 × 300 ≈ 2480 pixels. The calculator does it automatically and rounds to whole pixels." },
      { q: "Why do A sizes have a 1:√2 aspect ratio?", a: "A sheet with that ratio keeps its proportions when cut in half across the long side. That is why A3 is two A4 sheets and the 1 m² A0 sheet makes 16 A4 sheets." },
      { q: "How is Letter different from A4?", a: "Letter (8.5 × 11″ = 215.9 × 279.4 mm) is 5.9 mm wider and 17.6 mm shorter than A4. A document laid out for one size gets scaled or clipped when printed on the other." },
      { q: "Which envelope fits an A4 sheet?", a: "C4 (229 × 324 mm) for an unfolded sheet, C5 (162 × 229 mm) for a sheet folded once and DL (110 × 220 mm) for a sheet folded in three." },
    ],
  },
  about: {
    ru: [
      "Стандарт ISO 216 задаёт серии A и B, ISO 269 — серию C для конвертов. Лист A0 имеет площадь 1 м², каждый следующий формат получается делением предыдущего пополам; B — промежуточные размеры, C — конверты под листы A того же номера. В России те же размеры закреплены ГОСТ 9327-60.",
      "В США и Канаде бумагу измеряют в дюймах: Letter, Legal, Tabloid. SRA — увеличенные печатные листы с запасом под обрез, JIS B — японская серия B, которая немного больше ISO B.",
      "Пиксели считаются по формуле px = мм / 25,4 × DPI с округлением до целого. Для печати обычно нужно 300 DPI, для экрана хватает 72–96.",
    ],
    en: [
      "ISO 216 defines the A and B series and ISO 269 the C series for envelopes. A0 has an area of 1 m² and each next size is the previous one cut in half; B sizes sit in between, C envelopes fit A sheets of the same number.",
      "The US and Canada measure paper in inches: Letter, Legal, Tabloid. SRA sheets are oversized press sheets with room for bleed, and JIS B is the Japanese B series, slightly larger than ISO B.",
      "Pixels are calculated as px = mm / 25.4 × DPI, rounded to whole pixels. Print usually needs 300 DPI; 72–96 DPI is enough for screens.",
    ],
  },
  related: ["actual-size/a4", "convert/millimeters-to-inches", "convert/centimeters-to-inches"],
  variants: { title: { ru: "Все форматы", en: "All formats" }, list: () => PAPER.map(paperVariant) },
  blocks: (l) => [
    seriesTable(l, tt(l, "Серия A (ISO 216)", "A series (ISO 216)"), PAPER.filter((p) => p.series === "a")),
    seriesTable(l, tt(l, "Серия B (ISO 216)", "B series (ISO 216)"), PAPER.filter((p) => p.series === "b")),
    seriesTable(l, tt(l, "Серия C — конверты (ISO 269)", "C series — envelopes (ISO 269)"), PAPER.filter((p) => p.series === "c")),
    seriesTable(l, tt(l, "Североамериканские форматы", "North American sizes"), PAPER.filter((p) => p.series === "us")),
    seriesTable(l, tt(l, "SRA, DL и JIS B", "SRA, DL and JIS B"), PAPER.filter((p) => p.series === "sra" || p.series === "env" || p.series === "jis")),
  ],
};
