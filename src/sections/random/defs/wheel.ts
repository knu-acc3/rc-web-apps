import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { WHEEL_PRESETS, type WheelPreset } from "../data/wheel-presets";
import { L, num, pct } from "./common";

const DEFAULT_ENTRIES = {
  ru: ["Аня", "Борис", "Вика", "Гоша", "Даша", "Егор"],
  en: ["Alice", "Ben", "Chloe", "Daniel", "Emma", "Finn"],
};

function presetBlocks(p: WheelPreset, locale: Locale): Block[] {
  const items = p.entries[locale];
  const n = items.length;
  const blocks: Block[] = [
    {
      type: "facts",
      title: L(locale, "Коротко", "Quick facts"),
      rows: [
        [L(locale, "Вариантов на колесе", "Entries on the wheel"), num(locale, n)],
        [L(locale, "Шанс каждого варианта", "Chance of each entry"), `1/${n} ≈ ${pct(locale, 1 / n)}`],
        [L(locale, "Как выбирается результат", "How the result is chosen"), L(locale, "crypto.getRandomValues, без смещения", "crypto.getRandomValues, unbiased")],
        [L(locale, "Свой список", "Your own list"), L(locale, "сохраняется в этом браузере отдельно для этой подборки", "saved in this browser, separately for this preset")],
      ],
    },
  ];
  blocks.push(
    n <= 16
      ? { type: "list", title: L(locale, "Варианты на колесе", "Entries on the wheel"), items }
      : { type: "text", title: L(locale, "Варианты на колесе", "Entries on the wheel"), paragraphs: [items.join(", ")] },
  );
  blocks.push({ type: "text", paragraphs: [p.note[locale]] });
  return blocks;
}

const EDIT_FAQ = {
  ru: {
    q: "Можно изменить варианты на колесе?",
    a: "Да, правьте список прямо рядом с колесом. Изменения сохраняются в этом браузере только для этой подборки, а кнопка «Исходный список» восстанавливает варианты.",
  },
  en: {
    q: "Can I change the entries?",
    a: "Yes, edit the list next to the wheel. Changes are saved in this browser for this preset only, and “Original list” brings the original entries back.",
  },
};

function presetVariant(p: WheelPreset): VariantDef {
  return {
    slug: p.slug,
    name: p.name,
    title: p.title,
    h1: p.h1,
    description: p.description,
    lead: p.lead,
    glyph: p.glyph,
    props: { preset: p.slug, entries: p.entries, colors: p.colors },
    keywords: {
      ru: ["колесо фортуны", "рандомайзер", p.name.ru.toLowerCase()],
      en: ["wheel spinner", "random picker", p.name.en.toLowerCase()],
    },
    blocks: (locale) => presetBlocks(p, locale),
    faq: { ru: [...p.faq.ru, EDIT_FAQ.ru], en: [...p.faq.en, EDIT_FAQ.en] },
  };
}

export const wheelTool: ToolDef = {
  slug: "spin-the-wheel",
  component: "random/wheel",
  icon: "Disc3",
  popular: true,
  wide: true,
  name: { ru: "Колесо фортуны", en: "Spin the wheel" },
  title: { ru: "Колесо фортуны онлайн — крутить колесо со своими вариантами", en: "Spin the Wheel — random wheel picker with your own entries" },
  h1: { ru: "Колесо фортуны онлайн", en: "Spin the wheel" },
  description: {
    ru: "Колесо фортуны онлайн: впишите до 100 вариантов, задайте веса и цвета и крутите. Победителя выбирает криптографический генератор, список сохраняется.",
    en: "Spin the wheel online: add up to 100 entries, set weights and colours, then spin. The winner is picked by a cryptographic generator and your list is saved.",
  },
  lead: {
    ru: "Впишите варианты и нажмите «Крутить колесо» — стрелка остановится на случайном секторе.",
    en: "Type your entries and press “Spin the wheel” — the pointer stops on a random slice.",
  },
  keywords: {
    ru: ["колесо фортуны", "крутить колесо", "рандомайзер", "колесо выбора", "случайный выбор"],
    en: ["wheel of names", "wheel spinner", "random wheel", "spin the wheel", "decision wheel"],
  },
  props: { entries: DEFAULT_ENTRIES },
  howTo: {
    ru: [
      "Впишите варианты в поле рядом с колесом — по одному на строку, до 100 штук.",
      "Нажмите «Крутить колесо» или щёлкните по самому колесу.",
      "Дождитесь остановки: результат появится под колесом и в истории вращений.",
      "Чтобы вариант выпадал чаще, откройте «Веса и цвета» и увеличьте его вес.",
      "Включите «Убирать выпавший вариант», чтобы разыграть всё по очереди без повторов.",
    ],
    en: [
      "Type your entries next to the wheel — one per line, up to 100.",
      "Press “Spin the wheel” or click the wheel itself.",
      "Wait for it to stop: the result appears under the wheel and in the spin history.",
      "To make an entry come up more often, open “Weights & colours” and raise its weight.",
      "Turn on “Remove the winner” to draw every entry once, in turn.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Колесо честное?",
        a: "Да. Сначала криптографический генератор браузера (crypto.getRandomValues) выбирает победителя с вероятностью, пропорциональной весу, затем колесо останавливается в случайной точке его сектора. Анимация только показывает уже сделанный выбор.",
      },
      {
        q: "Как сделать, чтобы вариант выпадал чаще?",
        a: "Откройте «Веса и цвета» и задайте вес: вариант с весом 2 выпадает вдвое чаще варианта с весом 1 и занимает вдвое больший сектор. Точный шанс каждого варианта виден в таблице.",
      },
      {
        q: "Сохраняется ли мой список?",
        a: "Да, в памяти этого браузера (localStorage) — отдельно для главного колеса и для каждой готовой подборки. На сервер ничего не отправляется.",
      },
      {
        q: "Как разыграть все варианты по очереди?",
        a: "Включите «Убирать выпавший вариант»: выпавший сектор исчезнет при следующем запуске. Убранные варианты возвращаются одной кнопкой.",
      },
      {
        q: "Сколько вариантов можно добавить?",
        a: "До 100. На большом колесе надписи уменьшаются и сокращаются, но полный текст выпавшего варианта всегда виден под колесом.",
      },
    ],
    en: [
      {
        q: "Is the wheel fair?",
        a: "Yes. The browser's cryptographic generator (crypto.getRandomValues) first picks the winner with a probability proportional to its weight, then the wheel stops at a random point inside that slice. The animation only shows a choice that's already made.",
      },
      {
        q: "How do I make an entry come up more often?",
        a: "Open “Weights & colours” and set a weight: an entry with weight 2 comes up twice as often as one with weight 1 and gets a slice twice as big. The table shows each entry's exact chance.",
      },
      {
        q: "Is my list saved?",
        a: "Yes, in this browser's storage (localStorage) — separately for the main wheel and for each ready-made wheel. Nothing is sent to a server.",
      },
      {
        q: "How do I draw every entry once?",
        a: "Turn on “Remove the winner”: the last winner disappears when you spin again. Removed entries come back with one button.",
      },
      {
        q: "How many entries can I add?",
        a: "Up to 100. On a crowded wheel the labels get smaller and shortened, but the full text of the winner is always shown under the wheel.",
      },
    ],
  },
  about: {
    ru: [
      "Колесо фортуны помогает быстро и без споров сделать выбор: кто идёт за кофе, какой фильм смотреть, кто отвечает первым. Варианты можно вписать любые, а для частых задач ниже есть готовые колёса.",
      "Результат не зависит от силы или длины вращения: победитель определяется заранее криптографическим генератором браузера, а колесо плавно останавливается на нём. Варианты с одинаковым весом выпадают с одинаковой вероятностью.",
      "Если в системе включено уменьшение движения, колесо показывает результат сразу, без анимации.",
    ],
    en: [
      "A wheel spinner settles small decisions quickly and without arguments: who gets the coffee, which film to watch, who goes first. Type any entries you like, or use one of the ready-made wheels below.",
      "The result doesn't depend on how hard or how long you spin: the browser's cryptographic generator picks the winner first and the wheel then eases to a stop on it. Entries with equal weights are equally likely.",
      "If your system asks for reduced motion, the wheel shows the result straight away, without the animation.",
    ],
  },
  variants: {
    title: { ru: "Готовые колёса", en: "Ready-made wheels" },
    list: () => WHEEL_PRESETS.map(presetVariant),
  },
};

