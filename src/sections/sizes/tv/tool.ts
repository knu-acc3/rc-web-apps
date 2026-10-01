import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { nf, tt } from "../lib/shared";
import { CM_PER_INCH, TV_SIZES, diagonalForAngle, screenDims, tvDistances } from "./engine";

const m = (l: Locale, v: number) => `${nf(l, v, 1)} ${tt(l, "м", "m")}`;
const cm = (l: Locale, v: number) => `${nf(l, v, 1)} ${tt(l, "см", "cm")}`;

function distanceRows(l: Locale, d: number): [string, string][] {
  const t = tvDistances(d);
  return [
    [tt(l, "THX, угол обзора 40° (кинотеатр)", "THX, 40° field of view (cinema)"), m(l, t.thx)],
    [tt(l, "SMPTE, угол обзора 30° (минимум)", "SMPTE, 30° field of view (minimum)"), m(l, t.smpte)],
    [tt(l, "Видна вся детализация 4K — ближе", "Full 4K detail visible — closer than"), m(l, t.uhd)],
    [tt(l, "Видна вся детализация Full HD — ближе", "Full HD detail visible — closer than"), m(l, t.fhd)],
  ];
}

function tableForSizes(l: Locale): Block {
  return {
    type: "table",
    title: tt(l, "Размеры телевизоров 16:9 и расстояние просмотра", "16:9 TV dimensions and viewing distance"),
    head: [tt(l, "Диагональ", "Diagonal"), tt(l, "Диагональ, см", "Diagonal, cm"), tt(l, "Экран, см", "Screen, cm"), "THX 40°", "SMPTE 30°", tt(l, "Детали 4K", "4K detail")],
    rows: TV_SIZES.map((d) => {
      const [w, h] = screenDims(d);
      const t = tvDistances(d);
      return [`${d}″`, nf(l, d * CM_PER_INCH, 1), `${nf(l, w * CM_PER_INCH, 1)} × ${nf(l, h * CM_PER_INCH, 1)}`, m(l, t.thx), m(l, t.smpte), `≤ ${m(l, t.uhd)}`];
    }),
  };
}

function tvVariant(d: number): VariantDef {
  const [w, h] = screenDims(d);
  const t = tvDistances(d);
  const wc = w * CM_PER_INCH;
  const hc = h * CM_PER_INCH;
  const txt = (l: Locale) => ({
    title: tt(l, `Телевизор ${d} дюймов: размеры в см и расстояние просмотра`, `${d}-inch TV: dimensions in cm and viewing distance`),
    h1: tt(l, `Телевизор ${d} дюймов: размеры и расстояние`, `${d}-inch TV: size and viewing distance`),
    description: tt(
      l,
      `Телевизор ${d}″: диагональ ${cm(l, d * CM_PER_INCH)}, экран ${nf(l, wc, 1)} × ${nf(l, hc, 1)} см (16:9). Смотреть с ${nf(l, t.thx, 1)}–${m(l, t.smpte)} (THX и SMPTE); вся детализация 4K видна ближе ${m(l, t.uhd)}.`,
      `A ${d}″ TV has a ${cm(l, d * CM_PER_INCH)} diagonal and a ${nf(l, wc, 1)} × ${nf(l, hc, 1)} cm 16:9 screen. Sit ${nf(l, t.thx, 1)}–${m(l, t.smpte)} away (THX, SMPTE); full 4K detail shows within ${m(l, t.uhd)}.`,
    ),
    lead: tt(
      l,
      `${d} дюймов = ${cm(l, d * CM_PER_INCH)} по диагонали; ширина экрана ${cm(l, wc)}, высота ${cm(l, hc)}. Рекомендуемое расстояние — ${nf(l, t.thx, 1)}–${m(l, t.smpte)}.`,
      `${d} inches = ${cm(l, d * CM_PER_INCH)} diagonal; the screen is ${cm(l, wc)} wide and ${cm(l, hc)} tall. Recommended distance: ${nf(l, t.thx, 1)}–${m(l, t.smpte)}.`,
    ),
  });
  const faq = (l: Locale): QA[] => [
    {
      q: tt(l, `На каком расстоянии смотреть телевизор ${d} дюймов?`, `How far should I sit from a ${d}-inch TV?`),
      a: tt(
        l,
        `Для кинотеатрального погружения (THX, 40°) — около ${m(l, t.thx)}, по минимальной рекомендации SMPTE (30°) — около ${m(l, t.smpte)}. Для новостей и фоновых передач комфортно и дальше.`,
        `For a cinema-like view (THX, 40°) about ${m(l, t.thx)}; by SMPTE's minimum (30°) about ${m(l, t.smpte)}. For news and background viewing further away is fine.`,
      ),
    },
    {
      q: tt(l, `Сколько сантиметров ${d} дюймов?`, `How many centimetres is ${d} inches?`),
      a: tt(
        l,
        `${d} × 2,54 = ${cm(l, d * CM_PER_INCH)} — это диагональ экрана. Сам экран 16:9 — ${nf(l, wc, 1)} × ${nf(l, hc, 1)} см; корпус с рамками обычно на 1–3 см больше, а с подставкой — выше.`,
        `${d} × 2.54 = ${cm(l, d * CM_PER_INCH)} — the screen diagonal. The 16:9 picture itself is ${nf(l, wc, 1)} × ${nf(l, hc, 1)} cm; the body with bezels is usually 1–3 cm larger, and taller on its stand.`,
      ),
    },
    {
      q: tt(l, `Нужен ли 4K для ${d} дюймов?`, `Do I need 4K at ${d} inches?`),
      a: tt(
        l,
        `При зрении 20/20 разницу между 4K и Full HD на ${d}″ видно ближе ${m(l, t.fhd)}; всю детализацию 4K — ближе ${m(l, t.uhd)}. Если диван дальше ${m(l, t.fhd)}, выигрыш от 4K будет небольшим.`,
        `With 20/20 vision the difference between 4K and Full HD on a ${d}″ screen shows up closer than ${m(l, t.fhd)}; full 4K detail within ${m(l, t.uhd)}. If you sit further than ${m(l, t.fhd)}, 4K adds little.`,
      ),
    },
  ];
  const ru = txt("ru");
  const en = txt("en");
  return {
    slug: `${d}-inch`,
    name: { ru: `${d}″`, en: `${d}″` },
    title: { ru: ru.title, en: en.title },
    h1: { ru: ru.h1, en: en.h1 },
    description: { ru: ru.description, en: en.description },
    lead: { ru: ru.lead, en: en.lead },
    props: { diag: d },
    keywords: { ru: [`телевизор ${d} дюймов`, `${d} дюймов в см`, `${d} дюймов расстояние`], en: [`${d} inch tv dimensions`, `${d} inch tv viewing distance`] },
    blocks: (l) => [
      {
        type: "facts",
        title: tt(l, `Размеры телевизора ${d}″`, `${d}″ TV dimensions`),
        rows: [
          [tt(l, "Диагональ", "Diagonal"), cm(l, d * CM_PER_INCH)],
          [tt(l, "Ширина экрана (16:9)", "Screen width (16:9)"), cm(l, wc)],
          [tt(l, "Высота экрана", "Screen height"), cm(l, hc)],
          [tt(l, "Площадь экрана", "Screen area"), `${nf(l, (wc * hc) / 1e4, 2)} ${tt(l, "м²", "m²")}`],
        ],
      },
      { type: "facts", title: tt(l, "Расстояние просмотра", "Viewing distance"), rows: distanceRows(l, d) },
      tableForSizes(l),
    ],
    faq: { ru: faq("ru"), en: faq("en") },
  };
}

export const tvTool: ToolDef = {
  slug: "tv-size-calculator",
  component: "sizes/tv",
  icon: "Tv",
  name: { ru: "Диагональ телевизора", en: "TV size & distance" },
  title: { ru: "Расстояние до телевизора: калькулятор диагонали", en: "TV size calculator: viewing distance vs screen size" },
  h1: { ru: "Расстояние до телевизора и диагональ", en: "TV size and viewing distance calculator" },
  description: {
    ru: "Какую диагональ телевизора выбрать для комнаты: калькулятор по расстоянию до дивана и обратно — по рекомендациям SMPTE (30°), THX (40°) и остроте зрения для 4K и Full HD.",
    en: "Which TV size fits your room: calculate the diagonal from your viewing distance and back, using SMPTE (30°), THX (40°) and visual-acuity guidelines for 4K and Full HD.",
  },
  lead: {
    ru: "Введите диагональ или расстояние до дивана — калькулятор покажет рекомендации SMPTE и THX и дистанцию, на которой видна детализация 4K.",
    en: "Enter a screen size or your viewing distance to see SMPTE and THX recommendations and the distance at which 4K detail is visible.",
  },
  keywords: {
    ru: ["расстояние до телевизора", "какую диагональ телевизора выбрать", "диагональ телевизора", "телевизор в см"],
    en: ["tv size calculator", "tv viewing distance", "what size tv", "tv dimensions"],
  },
  props: { diag: 55 },
  howTo: {
    ru: [
      "Выберите, что вы знаете: диагональ телевизора или расстояние до места просмотра.",
      "Введите значение — в дюймах для диагонали или в метрах для расстояния.",
      "Смотрите главный результат — рекомендуемый диапазон между THX (40°) и SMPTE (30°).",
      "Ниже — размеры экрана в сантиметрах и расстояния, на которых видна детализация Full HD и 4K.",
    ],
    en: [
      "Choose what you know: the TV size or your viewing distance.",
      "Enter the value — inches for the diagonal or metres for the distance.",
      "Read the main result — the recommended range between THX (40°) and SMPTE (30°).",
      "Below are the screen dimensions in centimetres and the distances at which Full HD and 4K detail is visible.",
    ],
  },
  faq: {
    ru: [
      { q: "На каком расстоянии смотреть телевизор 55 дюймов?", a: "По THX (угол обзора 40°) — около 1,7 м, по минимальной рекомендации SMPTE (30°) — около 2,3 м. Вся детализация 4K на 55″ видна ближе 1,1 м." },
      { q: "Какая диагональ нужна при расстоянии 3 метра?", a: `По SMPTE (30°) — от ${nf("ru", diagonalForAngle(3, 30), 0)}″, по THX (40°) — около ${nf("ru", diagonalForAngle(3, 40), 0)}″. Меньший экран тоже подойдёт: эти цифры описывают эффект погружения, а не комфорт.` },
      { q: "Почему 4K-телевизор можно ставить ближе?", a: "Пиксели 4K вдвое меньше, чем у Full HD той же диагонали, поэтому зерно перестаёт быть заметным примерно вдвое ближе: около 0,8 диагонали против 1,6 для Full HD." },
      { q: "Это точные правила?", a: "Нет, это ориентиры. SMPTE задаёт минимальный угол для «эффекта присутствия», THX — угол для кинотеатрального погружения, а расстояния по остроте зрения рассчитаны для зрения 20/20. Комфорт зависит от контента и привычек." },
    ],
    en: [
      { q: "How far should I sit from a 55-inch TV?", a: "About 1.7 m by THX (40° field of view) and about 2.3 m by SMPTE's minimum (30°). Full 4K detail on a 55″ screen is visible within 1.1 m." },
      { q: "What TV size for a 3 m viewing distance?", a: `SMPTE (30°) suggests at least ${nf("en", diagonalForAngle(3, 30), 0)}″ and THX (40°) about ${nf("en", diagonalForAngle(3, 40), 0)}″. A smaller screen is fine too — these figures describe immersion, not comfort.` },
      { q: "Why can a 4K TV be closer?", a: "4K pixels are half the size of Full HD pixels on the same diagonal, so the grain disappears at about half the distance: roughly 0.8 × the diagonal versus 1.6 × for Full HD." },
      { q: "Are these strict rules?", a: "No, they are guidelines. SMPTE sets a minimum angle for immersion, THX an angle for a cinema-like view, and the acuity distances assume 20/20 vision. Comfort depends on content and habit." },
    ],
  },
  about: {
    ru: [
      "Рекомендации основаны на угле обзора: SMPTE EG-18 советует, чтобы экран занимал не меньше 30° поля зрения по горизонтали, THX для кинотеатра — около 40°. Расстояние = ширина экрана / (2 × tg(угол / 2)); для 16:9 это примерно 1,6 и 1,2 диагонали.",
      "Расстояния для Full HD и 4K рассчитаны по остроте зрения 1 угловая минута: дальше этой дистанции соседние пиксели сливаются, и более высокое разрешение уже не добавляет заметных деталей. Все цифры — ориентиры, а не строгие нормы.",
    ],
    en: [
      "The recommendations are based on field of view: SMPTE EG-18 suggests the screen should fill at least 30° horizontally, THX about 40° for a cinema-like view. Distance = screen width / (2 × tan(angle / 2)); for 16:9 that's about 1.6 and 1.2 × the diagonal.",
      "The Full HD and 4K distances assume 1 arcminute visual acuity: beyond them neighbouring pixels merge and more resolution adds no visible detail. All figures are guidelines, not strict rules.",
    ],
  },
  related: ["convert/inches-to-centimeters"],
  variants: { title: { ru: "Диагонали телевизоров", en: "TV sizes" }, list: () => TV_SIZES.map(tvVariant) },
  blocks: (l) => [tableForSizes(l)],
};
