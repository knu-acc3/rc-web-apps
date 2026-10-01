import type { Locale } from "@/i18n/config";
import type { ToolDef } from "@/registry/types";
import { nf, nfix, tt } from "../lib/shared";
import { dotPitchMm, ppi } from "../screen/engine";

const EXAMPLES: { label: Record<Locale, string>; w: number; h: number; d: number }[] = [
  { label: { ru: "Ноутбук 13,3″ Full HD", en: "13.3″ Full HD laptop" }, w: 1920, h: 1080, d: 13.3 },
  { label: { ru: "Ноутбук 15,6″ Full HD", en: "15.6″ Full HD laptop" }, w: 1920, h: 1080, d: 15.6 },
  { label: { ru: "Монитор 24″ Full HD", en: "24″ Full HD monitor" }, w: 1920, h: 1080, d: 24 },
  { label: { ru: "Монитор 27″ Full HD", en: "27″ Full HD monitor" }, w: 1920, h: 1080, d: 27 },
  { label: { ru: "Монитор 27″ QHD", en: "27″ QHD monitor" }, w: 2560, h: 1440, d: 27 },
  { label: { ru: "Монитор 27″ 4K", en: "27″ 4K monitor" }, w: 3840, h: 2160, d: 27 },
  { label: { ru: "Монитор 32″ 4K", en: "32″ 4K monitor" }, w: 3840, h: 2160, d: 32 },
  { label: { ru: "Телевизор 55″ 4K", en: "55″ 4K TV" }, w: 3840, h: 2160, d: 55 },
];

export const ppiTool: ToolDef = {
  slug: "ppi-calculator",
  component: "sizes/ppi",
  icon: "ScanLine",
  name: { ru: "Калькулятор PPI", en: "PPI calculator" },
  title: { ru: "Калькулятор PPI: плотность пикселей экрана по диагонали", en: "PPI calculator: screen pixel density from diagonal" },
  h1: { ru: "Калькулятор PPI — плотность пикселей", en: "PPI calculator — pixel density" },
  description: {
    ru: "Калькулятор PPI: разрешение и диагональ в дюймах → плотность пикселей, шаг пикселя в мм, размеры экрана в см и расстояние «ретины». 1920 × 1080 на 24″ — 91,8 PPI.",
    en: "PPI calculator: resolution and diagonal in inches → pixel density, pixel pitch in mm, screen size in cm and the “retina” distance. 1920 × 1080 at 24″ is 91.8 PPI.",
  },
  lead: {
    ru: "Введите разрешение и диагональ — калькулятор посчитает PPI, шаг пикселя и физический размер экрана.",
    en: "Enter a resolution and diagonal to get the PPI, pixel pitch and physical screen size.",
  },
  keywords: {
    ru: ["калькулятор ppi", "плотность пикселей", "ppi монитора", "dpi экрана", "шаг пикселя"],
    en: ["ppi calculator", "pixel density calculator", "pixels per inch", "dot pitch"],
  },
  props: { w: 1920, h: 1080, diag: 24 },
  howTo: {
    ru: [
      "Введите ширину и высоту экрана в пикселях.",
      "Укажите диагональ в дюймах — как в характеристиках монитора или телефона.",
      "Получите PPI, шаг пикселя, размеры экрана в сантиметрах и общее число пикселей.",
      "Расстояние «ретины» подскажет, с какого расстояния отдельные пиксели перестают быть видны.",
    ],
    en: [
      "Enter the screen width and height in pixels.",
      "Add the diagonal in inches as listed in the monitor or phone specs.",
      "Get the PPI, pixel pitch, screen size in centimetres and total pixel count.",
      "The “retina” distance tells you from how far away individual pixels stop being visible.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать PPI?", a: "Найдите диагональ в пикселях по теореме Пифагора и разделите на диагональ в дюймах: √(1920² + 1080²) / 24 = 2202,9 / 24 ≈ 91,8 PPI." },
      { q: "Какой PPI считается хорошим?", a: "Зависит от расстояния. Чтобы пиксели не различались с 60 см (монитор), нужно около 145 PPI, с 30 см (телефон) — около 290 PPI. Для обычной работы за монитором комфортно 90–110 PPI при масштабе 100%." },
      { q: "Чем PPI отличается от DPI?", a: "PPI — пиксели на дюйм экрана или цифрового изображения, DPI — точки на дюйм при печати. В характеристиках мониторов их часто смешивают, но для экрана корректно говорить PPI." },
      { q: "Что такое шаг пикселя?", a: "Расстояние между центрами соседних пикселей: 25,4 / PPI мм. У монитора 24″ Full HD — 0,277 мм, у 27″ 4K — 0,156 мм." },
    ],
    en: [
      { q: "How is PPI calculated?", a: "Find the diagonal in pixels with Pythagoras and divide by the diagonal in inches: √(1920² + 1080²) / 24 = 2202.9 / 24 ≈ 91.8 PPI." },
      { q: "What PPI is good?", a: "It depends on viewing distance. For pixels to disappear at 60 cm (a monitor) you need about 145 PPI, at 30 cm (a phone) about 290 PPI. For everyday desktop work at 100% scaling, 90–110 PPI is comfortable." },
      { q: "What's the difference between PPI and DPI?", a: "PPI is pixels per inch of a screen or digital image; DPI is dots per inch in print. Monitor specs often mix them up, but PPI is the right term for screens." },
      { q: "What is pixel pitch?", a: "The distance between the centres of neighbouring pixels: 25.4 / PPI mm. A 24″ Full HD monitor has 0.277 mm, a 27″ 4K monitor 0.156 mm." },
    ],
  },
  about: {
    ru: [
      "PPI (pixels per inch) — плотность пикселей: сколько пикселей укладывается в дюйм экрана. Считается как диагональ в пикселях √(W² + H²), делённая на диагональ в дюймах. Шаг пикселя — обратная величина в миллиметрах: 25,4 / PPI.",
      "Расстояние «ретины» основано на остроте зрения 1 угловая минута (зрение 20/20): дальше него соседние пиксели сливаются. Это ориентир — многие видят чуть лучше или хуже.",
    ],
    en: [
      "PPI (pixels per inch) is pixel density — how many pixels fit into an inch of the screen. It's the pixel diagonal √(W² + H²) divided by the diagonal in inches. Pixel pitch is the inverse in millimetres: 25.4 / PPI.",
      "The “retina” distance assumes 1 arcminute visual acuity (20/20 vision): beyond it neighbouring pixels merge. It's a guideline — many people see slightly better or worse.",
    ],
  },
  related: ["screen-calibration", "convert/inches-to-centimeters"],
  blocks: (l) => [
    {
      type: "table",
      title: tt(l, "PPI популярных экранов", "PPI of common screens"),
      head: [tt(l, "Экран", "Screen"), tt(l, "Разрешение", "Resolution"), "PPI", tt(l, "Шаг пикселя, мм", "Pixel pitch, mm")],
      rows: EXAMPLES.map((e) => {
        const p = ppi(e.w, e.h, e.d);
        return [e.label[l], `${e.w} × ${e.h}`, nf(l, p, 1), nfix(l, dotPitchMm(p), 3)];
      }),
    },
  ],
};
