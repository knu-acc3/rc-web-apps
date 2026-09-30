import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef } from "@/registry/types";
import { hex, type Color } from "../lib/color";
import { CONV_LABEL, PAIRS, formatAs, pairSlug, type ConvFormat } from "../lib/convert";
import { NAMED_MAP } from "../lib/named";
import { NAMED_INFO } from "../data/named-info";

/* ───────────── per-format explanations ───────────── */

const EXPLAIN: Record<ConvFormat, { ru: string; en: string }> = {
  hex: {
    ru: "HEX-код — это те же три канала RGB, записанные в шестнадцатеричной системе: #RRGGBB. Каждая пара цифр — число от 00 до FF, то есть от 0 до 255: FF = 15 × 16 + 15 = 255, 63 = 6 × 16 + 3 = 99. Короткая запись #RGB удваивает каждую цифру (#F64 = #FF6644), а четвёртая пара в #RRGGBBAA задаёт непрозрачность (80 ≈ 50 %).",
    en: "A HEX code is the same three RGB channels written in base 16: #RRGGBB. Each pair is a number from 00 to FF, i.e. 0 to 255: FF = 15 × 16 + 15 = 255, 63 = 6 × 16 + 3 = 99. The short form #RGB doubles every digit (#F64 = #FF6644), and a fourth pair in #RRGGBBAA sets the opacity (80 ≈ 50%).",
  },
  rgb: {
    ru: "RGB описывает цвет как смесь красного, зелёного и синего каналов, каждый от 0 до 255 (или от 0 % до 100 %). В CSS допустимы обе записи: классическая rgb(255, 99, 71) и современная rgb(255 99 71 / 50%) с прозрачностью через косую черту.",
    en: "RGB describes a color as a mix of red, green and blue channels, each from 0 to 255 (or 0% to 100%). CSS accepts both the classic rgb(255, 99, 71) and the modern rgb(255 99 71 / 50%) with opacity after a slash.",
  },
  rgba: {
    ru: "RGBA — это RGB с четвёртым каналом альфа: 0 — полностью прозрачный цвет, 1 — непрозрачный. В HEX прозрачность записывается последней парой цифр: альфа × 255 в шестнадцатеричном виде (0,5 × 255 ≈ 128 = 80₁₆). Современный CSS понимает и rgba(255, 99, 71, 0.5), и rgb(255 99 71 / 0.5), и #FF634780.",
    en: "RGBA is RGB with a fourth alpha channel: 0 is fully transparent, 1 is opaque. In HEX the opacity is the last pair of digits: alpha × 255 in base 16 (0.5 × 255 ≈ 128 = 80₁₆). Modern CSS accepts rgba(255, 99, 71, 0.5), rgb(255 99 71 / 0.5) and #FF634780 alike.",
  },
  hsl: {
    ru: "HSL — тон (0–360°), насыщенность и светлота (0–100 %). Светлота L = (max + min) / 2 по каналам RGB в долях единицы, насыщенность S = (max − L) / min(L, 1 − L), а тон зависит от того, какой канал максимальный, и отсчитывается по цветовому кругу: 0° — красный, 120° — зелёный, 240° — синий. У серых S = 0, и тон не определён.",
    en: "HSL is hue (0–360°), saturation and lightness (0–100%). Lightness L = (max + min) / 2 of the RGB channels as fractions, saturation S = (max − L) / min(L, 1 − L), and the hue depends on which channel is the largest, measured around the color wheel: 0° red, 120° green, 240° blue. Grays have S = 0 and no defined hue.",
  },
  hsv: {
    ru: "HSV (он же HSB) — тон, насыщенность и яркость. Яркость V = max(R, G, B), насыщенность S = (max − min) / max, тон считается так же, как в HSL. Так устроены палитры в графических редакторах: у чистых цветов S = V = 100 %, тогда как в HSL у них L = 50 %. В CSS формата hsv() нет — для кода переводите в HEX, RGB или HSL.",
    en: "HSV (also called HSB) is hue, saturation and value. Value V = max(R, G, B), saturation S = (max − min) / max, and the hue is computed as in HSL. Graphics editors use it for their pickers: pure colors have S = V = 100%, while in HSL they have L = 50%. CSS has no hsv() function, so convert to HEX, RGB or HSL for code.",
  },
  hwb: {
    ru: "HWB — тон, доля белого и доля чёрного: W = min(R, G, B), B = 1 − max(R, G, B). Это самая «малярная» модель: берём чистый тон и подмешиваем белую и чёрную краску; при W + B ≥ 100 % получается серый. Функция hwb() работает во всех современных браузерах с 2022 года.",
    en: "HWB is hue, whiteness and blackness: W = min(R, G, B), B = 1 − max(R, G, B). It is the most painter-like model: take a pure hue and add white and black paint; when W + B ≥ 100% the result is gray. The hwb() function works in all modern browsers since 2022.",
  },
  cmyk: {
    ru: "CMYK — голубой, пурпурный, жёлтый и чёрный. Здесь используется упрощённая формула без ICC-профиля: K = 1 − max(R, G, B), C = (1 − R − K) / (1 − K), так же для M и Y. Реальный цвет на бумаге зависит от красок, бумаги и профиля печати (например, FOGRA39), поэтому для типографии значения лучше получать в программе с цветовым профилем.",
    en: "CMYK is cyan, magenta, yellow and key (black). This is the simple formula without an ICC profile: K = 1 − max(R, G, B), C = (1 − R − K) / (1 − K), and the same for M and Y. Real printed color depends on inks, paper and the print profile (e.g. FOGRA39), so for a print shop get the values from software with a color profile.",
  },
  lab: {
    ru: "CIE Lab (как в CSS lab()) — светлота L от 0 до 100 и две оси: a (зелёный ↔ красный) и b (синий ↔ жёлтый). Расчёт идёт через XYZ с белой точкой D50 и адаптацией Брэдфорда, как в спецификации CSS Color 4, поэтому значения совпадают с тем, что показывают браузеры.",
    en: "CIE Lab (as in CSS lab()) is lightness L from 0 to 100 plus two axes: a (green ↔ red) and b (blue ↔ yellow). It is computed through XYZ with the D50 white point and Bradford adaptation, exactly as CSS Color 4 specifies, so the values match what browsers show.",
  },
  oklch: {
    ru: "OKLCH — перцептивная модель: светлота L (0–100 %), хрома C (обычно от 0 до 0,37) и тон H (0–360°). Равные шаги L выглядят равными на глаз, поэтому OKLCH удобен для палитр и тем — его использует Tailwind CSS v4. Цвет получается из RGB через линейный sRGB и пространство OKLab. Если цвет OKLCH не помещается в sRGB, хрома уменьшается до границы охвата по алгоритму CSS Color 4 с сохранением светлоты и тона.",
    en: "OKLCH is a perceptual model: lightness L (0–100%), chroma C (usually 0 to 0.37) and hue H (0–360°). Equal steps of L look equal, which makes OKLCH handy for palettes and themes — Tailwind CSS v4 uses it. It is derived from RGB via linear sRGB and the OKLab space. When an OKLCH color doesn't fit into sRGB, chroma is reduced to the gamut edge with the CSS Color 4 algorithm, keeping lightness and hue.",
  },
};

/** Sample colors cycle through the pairs so each page shows a different worked example. */
const SAMPLES = ["#FF6347", "#3B82F6", "#2E8B57", "#FFD700", "#8A2BE2", "#FF69B4", "#20B2AA", "#D2691E", "#6363F8", "#DC143C"];
const TABLE = ["red", "orange", "gold", "yellow", "lime", "green", "teal", "aqua", "blue", "navy", "purple", "fuchsia", "pink", "brown", "gray", "black", "white"];

const hasAlpha = (a: ConvFormat, b: ConvFormat) => a === "rgba" || b === "rgba";
const withAlpha = (c: Color, a: ConvFormat, b: ConvFormat): Color => (hasAlpha(a, b) ? { ...c, alpha: 0.5 } : c);

function faqFor(a: ConvFormat, b: ConvFormat, sA: string, sB: string, locale: Locale): QA[] {
  const A = CONV_LABEL[a];
  const B = CONV_LABEL[b];
  const ru = locale === "ru";
  const out: QA[] = [
    ru
      ? { q: `Как перевести ${A} в ${B}?`, a: `Введите цвет в поле конвертера — результат появится сразу. Например, ${sA} = ${sB}. Формулу перевода мы расписали выше, в разделе «Подробнее».` }
      : { q: `How do I convert ${A} to ${B}?`, a: `Type the color into the converter and the result appears instantly. For example, ${sA} = ${sB}. The formula is explained above under “About”.` },
  ];
  const fmts = new Set([a, b]);
  if (fmts.has("hex"))
    out.push(
      ru
        ? { q: "А если HEX-код из 3 или 8 цифр?", a: "Конвертер понимает все длины: #F64 разворачивается в #FF6644, #F648 — в #FF664488, а #FF634780 — это цвет с альфа-каналом 0,5 (80₁₆ = 128 из 255). Решётку можно не ставить." }
        : { q: "What about 3- or 8-digit HEX codes?", a: "All lengths work: #F64 expands to #FF6644, #F648 to #FF664488, and #FF634780 is a color with alpha 0.5 (80₁₆ = 128 of 255). The # sign is optional." },
    );
  if (fmts.has("cmyk"))
    out.push(
      ru
        ? { q: "Совпадёт ли CMYK с цветом при печати?", a: "Не обязательно. Формула здесь не учитывает ICC-профиль, бумагу и растискивание, поэтому это ориентир для экрана и макетов. Для тиража переведите цвет в Photoshop, Illustrator или Affinity с профилем вашей типографии." }
        : { q: "Will the CMYK values match the printed color?", a: "Not necessarily. This formula ignores ICC profiles, paper and dot gain, so treat it as a screen/mock-up reference. For a print run, convert in Photoshop, Illustrator or Affinity with your printer's profile." },
    );
  if (fmts.has("oklch"))
    out.push(
      ru
        ? { q: "Почему цвет OKLCH может измениться при переводе?", a: "OKLCH описывает и цвета шире охвата sRGB (например, Display P3). В HEX и RGB их нельзя записать, поэтому хрома уменьшается до ближайшего представимого цвета — тон и светлота сохраняются." }
        : { q: "Why can an OKLCH color change after conversion?", a: "OKLCH can describe colors outside sRGB (e.g. Display P3). HEX and RGB can't store them, so the chroma is reduced to the nearest representable color while hue and lightness are kept." },
    );
  if (fmts.has("hsl") || fmts.has("hsv"))
    out.push(
      ru
        ? { q: "Чем HSL отличается от HSV?", a: "Тон у них одинаковый, а третья координата разная: в HSL чистый цвет имеет светлоту 50 %, а 100 % — это всегда белый; в HSV чистый цвет имеет яркость 100 %. Поэтому hsl(0, 100%, 50%) и hsv(0, 100%, 100%) — один и тот же красный." }
        : { q: "What is the difference between HSL and HSV?", a: "The hue is the same, the third coordinate differs: in HSL a pure color has 50% lightness and 100% is always white; in HSV a pure color has 100% value. So hsl(0, 100%, 50%) and hsv(0, 100%, 100%) are the same red." },
    );
  if (fmts.has("rgba"))
    out.push(
      ru
        ? { q: "Как записать прозрачность в HEX?", a: "Добавьте две цифры в конец: 00 — полностью прозрачный, FF — непрозрачный. 50 % ≈ 80, 25 % ≈ 40, 75 % ≈ BF. Все современные браузеры понимают восьмизначный HEX." }
        : { q: "How do I write opacity in HEX?", a: "Append two digits: 00 is fully transparent, FF is opaque. 50% ≈ 80, 25% ≈ 40, 75% ≈ BF. All modern browsers support 8-digit HEX." },
    );
  if (fmts.has("lab"))
    out.push(
      ru
        ? { q: "Почему Lab в Photoshop и здесь может немного отличаться?", a: "Lab зависит от белой точки и способа адаптации. Мы считаем, как CSS: D50 и матрица Брэдфорда. Программы, использующие D65 или другой профиль, покажут значения, отличающиеся на доли единицы." }
        : { q: "Why may Lab differ slightly from Photoshop?", a: "Lab depends on the white point and adaptation method. We compute it like CSS does: D50 with the Bradford matrix. Software using D65 or a different profile will show values differing by fractions of a unit." },
    );
  if (fmts.has("hwb"))
    out.push(
      ru
        ? { q: "Можно ли использовать hwb() в CSS?", a: "Да, функция hwb() поддерживается в Chrome и Edge с версии 101, Firefox 96 и Safari 15 — то есть во всех актуальных браузерах." }
        : { q: "Can I use hwb() in CSS?", a: "Yes, hwb() is supported in Chrome and Edge 101+, Firefox 96+ and Safari 15+, i.e. in all current browsers." },
    );
  out.push(
    ru
      ? { q: "Куда отправляются введённые цвета?", a: "Никуда: перевод выполняется прямо в браузере, без запросов к серверу. Конвертер работает и без интернета после загрузки страницы." }
      : { q: "Where are the colors I enter sent?", a: "Nowhere: the conversion runs in your browser without any server requests, and keeps working offline once the page has loaded." },
  );
  return out.slice(0, 5);
}

function tableBlock(a: ConvFormat, b: ConvFormat, locale: Locale): Block {
  const ru = locale === "ru";
  return {
    type: "table",
    title: ru ? `Популярные цвета: ${CONV_LABEL[a]} и ${CONV_LABEL[b]}` : `Common colors in ${CONV_LABEL[a]} and ${CONV_LABEL[b]}`,
    head: [ru ? "Цвет" : "Color", CONV_LABEL[a], CONV_LABEL[b]],
    rows: TABLE.map((n) => {
      const c = withAlpha(hex(NAMED_MAP.get(n)!), a, b);
      return [ru ? `${NAMED_INFO[n].ru} (${n})` : n, formatAs(c, a), formatAs(c, b)];
    }),
    mono: true,
  };
}

export const CONVERTER_TOOLS: ToolDef[] = PAIRS.map(([a, b], i) => {
  const A = CONV_LABEL[a];
  const B = CONV_LABEL[b];
  const slug = pairSlug(a, b);
  const reverse = PAIRS.some(([x, y]) => x === b && y === a) ? pairSlug(b, a) : undefined;
  const c = withAlpha(hex(SAMPLES[i % SAMPLES.length]), a, b);
  const sA = formatAs(c, a);
  const sB = formatAs(c, b);
  const others = [a, b];
  return {
    slug,
    component: "color/convert",
    icon: "ArrowLeftRight",
    name: { ru: `${A} в ${B}`, en: `${A} to ${B}` },
    title: { ru: `${A} в ${B} — конвертер цвета онлайн`, en: `${A} to ${B} converter — color code conversion` },
    h1: { ru: `Конвертер ${A} в ${B}`, en: `${A} to ${B} converter` },
    description: {
      ru: `Перевод цвета из ${A} в ${B} онлайн: ${sA} → ${sB}. Результат сразу при вводе, формула, таблица популярных цветов и все форматы.`,
      en: `Convert ${A} to ${B} online: ${sA} → ${sB}. Instant result, the formula, a common-colors table and all other formats.`,
    },
    lead: { ru: `${sA} = ${sB}. Введите свой цвет — перевод появится сразу.`, en: `${sA} = ${sB}. Enter your color and the conversion appears instantly.` },
    keywords: { ru: [`${a} в ${b}`, `перевести ${a} в ${b}`, "конвертер цветов"], en: [`${a} to ${b}`, `convert ${a} to ${b}`, "color converter"] },
    props: { from: a, to: b, sample: sA, reverse },
    howTo: {
      ru: [
        `Введите цвет в формате ${A}, например ${sA}. Подойдёт и любой другой формат CSS.`,
        `Результат в ${B} появляется сразу — ${sB}. Скопируйте его кнопкой рядом.`,
        "Ниже показан тот же цвет во всех форматах: HEX, RGB, HSL, HWB, CMYK, Lab, OKLCH и Display P3.",
        ...(reverse ? [`Для обратного перевода (${B} в ${A}) нажмите кнопку со стрелками.`] : []),
      ],
      en: [
        `Enter a color in ${A}, e.g. ${sA}. Any other CSS format works too.`,
        `The ${B} result appears instantly — ${sB}. Copy it with the button next to it.`,
        "Below, the same color is shown in every format: HEX, RGB, HSL, HWB, CMYK, Lab, OKLCH and Display P3.",
        ...(reverse ? [`For the reverse conversion (${B} to ${A}) press the arrows button.`] : []),
      ],
    },
    about: {
      ru: [...others.map((f) => EXPLAIN[f].ru), "Конвертер работает в браузере: цвета никуда не отправляются, результат пересчитывается при каждом изменении."],
      en: [...others.map((f) => EXPLAIN[f].en), "The converter runs in your browser: colors are never sent anywhere, and the result updates on every change."],
    },
    faq: { ru: faqFor(a, b, sA, sB, "ru"), en: faqFor(a, b, sA, sB, "en") },
    blocks: (locale) => [tableBlock(a, b, locale)],
  } satisfies ToolDef;
});
