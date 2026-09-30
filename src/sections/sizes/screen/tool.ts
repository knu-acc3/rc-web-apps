import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { nf, nfix, nint, tt } from "../shared";
import { dotPitchMm, megapixels, physicalSize, ppi, resolutionName } from "./engine";
import { SCREENS, screenSlug, type ScreenRes } from "./data";
import { ratioLabel, shortName } from "./text";

const x = (w: number, h: number) => `${w} × ${h}`;
const featuredDiags = (s: ScreenRes) => (s.diags.length > 2 ? s.diags.slice(Math.floor(s.diags.length / 2), Math.floor(s.diags.length / 2) + 2) : s.diags);
const inch = (l: Locale, d: number) => `${nf(l, d, 1)}″`;

function ppiTable(l: Locale, s: ScreenRes): Block | null {
  if (!s.diags.length) return null;
  return {
    type: "table",
    title: tt(l, `Плотность пикселей ${x(s.w, s.h)} на разных диагоналях`, `${x(s.w, s.h)} pixel density by screen size`),
    head: [tt(l, "Диагональ", "Diagonal"), "PPI", tt(l, "Шаг пикселя, мм", "Pixel pitch, mm"), tt(l, "Размер экрана, см", "Screen size, cm")],
    rows: s.diags.map((d) => {
      const p = ppi(s.w, s.h, d);
      const [wi, hi] = physicalSize(s.w, s.h, d);
      return [inch(l, d), nf(l, p, 1), nfix(l, dotPitchMm(p), 3), `${nf(l, wi * 2.54, 1)} × ${nf(l, hi * 2.54, 1)}`];
    }),
  };
}

function screenVariant(s: ScreenRes): VariantDef {
  const name = resolutionName(s.w, s.h);
  const short = shortName(s.w, s.h);
  const mp = megapixels(s.w, s.h);
  const fd = featuredDiags(s);
  const ppiPart = (l: Locale) =>
    fd.length
      ? fd.map((d) => tt(l, `${nf(l, ppi(s.w, s.h, d), 1)} PPI на ${inch(l, d)}`, `${nf(l, ppi(s.w, s.h, d), 1)} PPI at ${inch(l, d)}`)).join(tt(l, " и ", " and "))
      : "";
  const vsFhd = (s.w * s.h) / (1920 * 1080);
  const t = (l: Locale) => {
    const r = ratioLabel(l, s.w, s.h);
    const base = tt(
      l,
      `${x(s.w, s.h)}${short ? ` — ${short}` : ""}: соотношение ${r}, ${nf(l, mp, 2)} Мп${fd.length ? `, ${ppiPart(l)}` : ""}.`,
      `${x(s.w, s.h)}${short ? ` (${short})` : ""}: ${r} aspect ratio, ${nf(l, mp, 2)} MP${fd.length ? `, ${ppiPart(l)}` : ""}.`,
    );
    let description = base;
    const usage = description.length + s.devices[l].length < 150 ? s.devices[l] : s.brief?.[l];
    if (usage) description += ` ${usage}`;
    const tail = s.diags.length ? tt(l, " Таблица PPI и размеров экрана.", " PPI and screen size table.") : tt(l, " Где используется и чем отличается от 4K UHD.", " Where it's used and how it differs from 4K UHD.");
    if (description.length + tail.length <= 165) description += tail;
    return {
      title: short
        ? tt(l, `Разрешение ${s.w}×${s.h} (${short}): соотношение сторон и PPI`, `${s.w}×${s.h} resolution (${short}): aspect ratio and PPI`)
        : tt(l, `Разрешение ${s.w}×${s.h}: соотношение сторон, PPI, устройства`, `${s.w}×${s.h} resolution: aspect ratio, PPI and devices`),
      h1: name ? tt(l, `Разрешение ${x(s.w, s.h)} — ${name}`, `${x(s.w, s.h)} resolution — ${name}`) : tt(l, `Разрешение ${x(s.w, s.h)}`, `${x(s.w, s.h)} resolution`),
      description,
      lead: tt(
        l,
        `${x(s.w, s.h)}${short ? ` (${short})` : ""} — соотношение сторон ${r}, ${nint(l, s.w * s.h)} пикселей (${nf(l, mp, 2)} Мп).`,
        `${x(s.w, s.h)}${short ? ` (${short})` : ""} — ${r} aspect ratio, ${nint(l, s.w * s.h)} pixels (${nf(l, mp, 2)} MP).`,
      ),
    };
  };
  const faq = (l: Locale): QA[] => {
    const r = ratioLabel(l, s.w, s.h);
    const out: QA[] = [
      {
        q: tt(l, `Какое соотношение сторон у ${s.w}×${s.h}?`, `What is the aspect ratio of ${s.w}×${s.h}?`),
        a: r.includes("≈")
          ? tt(
              l,
              `Точная пропорция — ${r.split(" ")[0]}: ширину и высоту делят на наибольший общий делитель. ${r.includes("(") ? "Стандартному соотношению она не соответствует." : `Это ближе всего к ${r.split("≈ ")[1]}, поэтому экран так и обозначают.`}`,
              `The exact ratio is ${r.split(" ")[0]} (width and height divided by their greatest common divisor). ${r.includes("(") ? "It doesn't match a standard ratio." : `That is closest to ${r.split("≈ ")[1]}, which is how the screen is marketed.`}`,
            )
          : tt(l, `Ровно ${r}: ${s.w} / ${s.h} = ${nf(l, s.w / s.h, 4)}.`, `Exactly ${r}: ${s.w} / ${s.h} = ${nf(l, s.w / s.h, 4)}.`),
      },
    ];
    if (s.diags.length)
      out.push({
        q: tt(l, `Сколько PPI у разрешения ${s.w}×${s.h}?`, `What PPI does ${s.w}×${s.h} give?`),
        a: tt(
          l,
          `Зависит от диагонали: ${s.diags.map((d) => `${nf(l, ppi(s.w, s.h, d), 1)} на ${inch(l, d)}`).join(", ")}. PPI = √(${s.w}² + ${s.h}²) / диагональ в дюймах.${s.note ? ` ${s.note[l]}` : ""}`,
          `It depends on the diagonal: ${s.diags.map((d) => `${nf(l, ppi(s.w, s.h, d), 1)} at ${inch(l, d)}`).join(", ")}. PPI = √(${s.w}² + ${s.h}²) / diagonal in inches.${s.note ? ` ${s.note[l]}` : ""}`,
        ),
      });
    out.push({
      q: name ? tt(l, `${s.w}×${s.h} — это какое разрешение?`, `What is ${s.w}×${s.h} called?`) : tt(l, `Где встречается разрешение ${s.w}×${s.h}?`, `Where is ${s.w}×${s.h} used?`),
      a: name ? `${name}. ${s.devices[l]}` : s.devices[l],
    });
    return out;
  };
  const ru = t("ru");
  const en = t("en");
  return {
    slug: screenSlug(s),
    name: { ru: `${s.w}×${s.h}`, en: `${s.w}×${s.h}` },
    title: { ru: ru.title, en: en.title },
    h1: { ru: ru.h1, en: en.h1 },
    description: { ru: ru.description, en: en.description },
    lead: { ru: ru.lead, en: en.lead },
    props: { w: s.w, h: s.h, diag: fd[0] ?? null },
    keywords: {
      ru: [`${s.w}x${s.h}`, `${s.w} на ${s.h}`, ...(short ? [short] : [])],
      en: [`${s.w}x${s.h}`, `${s.w} by ${s.h}`, ...(short ? [short] : [])],
    },
    blocks: (l) => {
      const blocks: Block[] = [
        {
          type: "facts",
          title: tt(l, `Характеристики ${x(s.w, s.h)}`, `${x(s.w, s.h)} at a glance`),
          rows: [
            [tt(l, "Название", "Name"), name ?? tt(l, "нет стандартного названия", "no standard name")],
            [tt(l, "Соотношение сторон", "Aspect ratio"), ratioLabel(l, s.w, s.h)],
            [tt(l, "Отношение ширины к высоте", "Width ÷ height"), nf(l, s.w / s.h, 4)],
            [tt(l, "Всего пикселей", "Total pixels"), `${nint(l, s.w * s.h)} (${nf(l, mp, 2)} ${tt(l, "Мп", "MP")})`],
            [tt(l, "Пикселей относительно Full HD", "Pixels relative to Full HD"), `${nf(l, vsFhd, 2)}×`],
            [tt(l, "Ориентация", "Orientation"), s.h > s.w ? tt(l, "книжная (вертикальная)", "portrait") : tt(l, "альбомная (горизонтальная)", "landscape")],
          ],
        },
      ];
      const table = ppiTable(l, s);
      if (table) blocks.push(table);
      blocks.push({ type: "text", title: tt(l, "Где используется", "Where it's used"), paragraphs: [s.devices[l], ...(s.note ? [s.note[l]] : [])] });
      return blocks;
    },
    faq: { ru: faq("ru"), en: faq("en") },
  };
}

const ORDER = [...SCREENS].sort((a, b) => Number(a.h > a.w) - Number(b.h > b.w) || b.w * b.h - a.w * a.h);

export const screenTool: ToolDef = {
  slug: "screen-resolutions",
  component: "sizes/screen",
  icon: "Monitor",
  popular: true,
  name: { ru: "Разрешения экранов", en: "Screen resolutions" },
  title: { ru: "Разрешения экранов: HD, Full HD, QHD, 4K — пропорции и PPI", en: "Screen resolutions: HD, Full HD, QHD, 4K — ratio and PPI" },
  h1: { ru: "Разрешения экранов", en: "Screen resolutions" },
  description: {
    ru: "Разрешение экрана по ширине и высоте: название (HD, Full HD, QHD, 4K, 8K), соотношение сторон, мегапиксели и PPI. Показывает физическое разрешение вашего экрана.",
    en: "Look up any screen resolution: its name (HD, Full HD, QHD, 4K, 8K), aspect ratio, megapixels and PPI. Also shows the physical resolution of your own screen.",
  },
  lead: {
    ru: "Введите разрешение и диагональ — увидите название, соотношение сторон, число пикселей и их плотность.",
    en: "Enter a resolution and a diagonal to see its name, aspect ratio, pixel count and pixel density.",
  },
  keywords: {
    ru: ["разрешения экранов", "full hd разрешение", "4k разрешение", "qhd", "разрешение монитора"],
    en: ["screen resolutions", "resolution names", "full hd", "4k resolution", "qhd resolution"],
  },
  props: { w: 1920, h: 1080, diag: 24 },
  howTo: {
    ru: [
      "Введите ширину и высоту в пикселях — например, 2560 и 1440.",
      "Добавьте диагональ в дюймах, если нужна плотность пикселей (PPI).",
      "Прочитайте название, соотношение сторон и количество мегапикселей.",
      "Ниже — физическое разрешение вашего экрана: CSS-пиксели, умноженные на devicePixelRatio.",
    ],
    en: [
      "Enter the width and height in pixels — for example 2560 and 1440.",
      "Add the diagonal in inches if you need the pixel density (PPI).",
      "Read the name, aspect ratio and megapixels.",
      "Below is your own screen's physical resolution: CSS pixels multiplied by devicePixelRatio.",
    ],
  },
  faq: {
    ru: [
      { q: "Как узнать разрешение своего экрана?", a: "Блок «Ваш экран» показывает физическое разрешение: размер экрана в CSS-пикселях, умноженный на devicePixelRatio. Откройте страницу с масштабом 100% (Ctrl+0), иначе результат исказится." },
      { q: "Чем физические пиксели отличаются от CSS-пикселей?", a: "Система масштабирует интерфейс: 4K-монитор (3840 × 2160) при масштабе 150% сообщает сайтам 2560 × 1440 CSS-пикселей, а Full HD-ноутбук при 125% — 1536 × 864. Поэтому название разрешения определяется по физическим пикселям." },
      { q: "Что такое Full HD, QHD и 4K?", a: "Full HD — 1920 × 1080, QHD (1440p) — 2560 × 1440, 4K UHD — 3840 × 2160, 8K UHD — 7680 × 4320. У всех соотношение сторон 16:9." },
      { q: "Что такое PPI?", a: "Плотность пикселей — сколько пикселей приходится на дюйм. PPI = диагональ в пикселях / диагональ в дюймах: у 1920 × 1080 на 24″ — 91,8 PPI." },
    ],
    en: [
      { q: "How do I find my screen resolution?", a: "The “Your screen” block shows the physical resolution: the screen size in CSS pixels multiplied by devicePixelRatio. Keep the page zoom at 100% (Ctrl+0), otherwise the result is skewed." },
      { q: "What's the difference between physical and CSS pixels?", a: "The OS scales the interface: a 4K monitor (3840 × 2160) at 150% reports 2560 × 1440 CSS pixels to websites, and a Full HD laptop at 125% reports 1536 × 864. That's why the resolution name is based on physical pixels." },
      { q: "What are Full HD, QHD and 4K?", a: "Full HD is 1920 × 1080, QHD (1440p) is 2560 × 1440, 4K UHD is 3840 × 2160 and 8K UHD is 7680 × 4320. All of them are 16:9." },
      { q: "What is PPI?", a: "Pixel density — how many pixels fit into an inch. PPI = diagonal in pixels / diagonal in inches: 1920 × 1080 on a 24″ screen is 91.8 PPI." },
    ],
  },
  about: {
    ru: [
      "Название определяется по физическим пикселям. Соотношение сторон сокращается через НОД (1920 × 1080 → 16:9), а затем подбирается ближайшее «маркетинговое»: 1366 × 768 — это 683:384, но продаётся как 16:9; 2560 × 1080 — 64:27, продаётся как 21:9.",
      "Многие онлайн-определители берут размер экрана в CSS-пикселях, поэтому 4K-монитор с масштабом 150% получает подпись «QHD». Здесь размер умножается на devicePixelRatio. При масштабе страницы, отличном от 100%, результат искажается — сбросьте масштаб сочетанием Ctrl+0.",
    ],
    en: [
      "Names are based on physical pixels. The aspect ratio is reduced by the greatest common divisor (1920 × 1080 → 16:9) and matched to the closest marketing ratio: 1366 × 768 is 683:384 but sold as 16:9; 2560 × 1080 is 64:27 but sold as 21:9.",
      "Many online checkers read the screen size in CSS pixels, so a 4K monitor at 150% scaling gets labelled “QHD”. Here the size is multiplied by devicePixelRatio. Page zoom other than 100% skews the result — reset it with Ctrl+0.",
    ],
  },
  related: ["convert/inches-to-centimeters"],
  variants: { title: { ru: "Популярные разрешения", en: "Popular resolutions" }, list: () => ORDER.map(screenVariant) },
  blocks: (l) => [
    {
      type: "table",
      title: tt(l, "Популярные разрешения", "Popular resolutions"),
      head: [tt(l, "Разрешение", "Resolution"), tt(l, "Название", "Name"), tt(l, "Соотношение", "Ratio"), tt(l, "Мегапиксели", "Megapixels")],
      rows: ORDER.map((s) => [x(s.w, s.h), resolutionName(s.w, s.h) ?? "—", ratioLabel(l, s.w, s.h), nf(l, megapixels(s.w, s.h), 2)]),
    },
  ],
};
