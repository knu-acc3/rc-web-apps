import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { mmToPx, PHOTO_FORMATS, SHEETS, sheetLayout, type PhotoFormat } from "../lib/passport";

const tt = (l: Locale, ru: string, en: string) => (l === "ru" ? ru : en);
const fmt = (id: string) => PHOTO_FORMATS.find((f) => f.id === id)!;
const mm = (l: Locale, n: number) => `${String(n).replace(".", l === "ru" ? "," : ".")}`;

function formatFacts(f: PhotoFormat): (l: Locale) => Block[] {
  return (l) => {
    const rows: [string, string][] = [
      [tt(l, "Размер", "Size"), `${mm(l, f.w)} × ${mm(l, f.h)} ${tt(l, "мм", "mm")}`],
      [tt(l, "В пикселях (600 dpi)", "In pixels (600 dpi)"), `${mmToPx(f.w, 600)} × ${mmToPx(f.h, 600)} px`],
      [tt(l, "В пикселях (300 dpi)", "In pixels (300 dpi)"), `${mmToPx(f.w, 300)} × ${mmToPx(f.h, 300)} px`],
      [tt(l, "На листе 10×15 см", "On a 4×6 in sheet"), String(sheetLayout(SHEETS["10x15"], f).cells.length)],
      [tt(l, "На листе A4", "On an A4 sheet"), String(sheetLayout(SHEETS.a4, f).cells.length)],
    ];
    if (f.head) rows.splice(1, 0, [tt(l, "Голова от подбородка до макушки", "Head, chin to crown"), `${f.head[0]}–${f.head[1]} ${tt(l, "мм", "mm")}`]);
    return [{ type: "facts", title: tt(l, "Размеры и печать", "Sizes and printing"), rows }];
  };
}

interface Variant {
  slug: string;
  id: string;
  ru: { name: string; title: string; h1: string; desc: string; lead: string; for: string[] };
  en: { name: string; title: string; h1: string; desc: string; lead: string; for: string[] };
}

const VARIANTS: Variant[] = [
  {
    slug: "3x4",
    id: "30x40",
    ru: {
      name: "Фото 3×4",
      title: "Фото 3×4 на документы онлайн | лист 10×15 для печати",
      h1: "Фото 3×4 на документы онлайн",
      desc: "Сделайте фото 3×4 см из любого снимка: рамка нужной формы, разметка для лица, готовый лист 10×15 или A4 с несколькими фото для печати в фотосалоне.",
      lead: "Выделите лицо рамкой 3×4 — получите фото или целый лист для печати.",
      for: ["Пропуск и удостоверение сотрудника.", "Студенческий билет и зачётная книжка.", "Медицинская книжка и личное дело."],
    },
    en: {
      name: "3×4 cm photo",
      title: "3×4 cm Document Photo Online — Print Sheet Included",
      h1: "3×4 cm document photo online",
      desc: "Make a 3×4 cm photo from any picture: the right frame shape, face guides and a ready 4×6 in or A4 sheet with several copies for printing.",
      lead: "Frame the face at 3×4 cm and get a photo or a whole print sheet.",
      for: ["Staff and pass cards.", "Student IDs and record books.", "Medical record books and personnel files."],
    },
  },
  {
    slug: "us-visa",
    id: "us",
    ru: {
      name: "Виза США 2×2",
      title: "Фото на визу США онлайн | 2×2 дюйма (51×51 мм)",
      h1: "Фото на визу США 2×2 дюйма",
      desc: "Фото на визу и паспорт США: квадрат 2×2 дюйма (51×51 мм), голова 25–35 мм по разметке, файл 1200×1200 px для анкеты DS-160 или лист для печати.",
      lead: "Поставьте голову между линиями разметки — фото будет нужного для США размера.",
      for: ["Анкета DS-160 на визу США: 600–1200 px и до 240 КБ — при необходимости сожмите файл.", "Паспорт гражданина США.", "Грин-карта (лотерея DV)."],
    },
    en: {
      name: "US visa 2×2",
      title: "US Visa Photo Online — 2×2 Inch Passport Photo",
      h1: "US visa photo, 2×2 inches",
      desc: "A US visa and passport photo: a 2×2 inch (51×51 mm) square with the head at 25–35 mm on the guides, a 1200×1200 px file for DS-160 or a print sheet.",
      lead: "Fit the head between the guide lines and the photo meets the US size.",
      for: ["DS-160 visa application: 600–1200 px and up to 240 KB — compress the file if needed.", "US passport.", "Green card lottery (DV)."],
    },
  },
  {
    slug: "china-visa",
    id: "33x48",
    ru: {
      name: "Виза в Китай 33×48",
      title: "Фото на визу в Китай онлайн | 33×48 мм",
      h1: "Фото на визу в Китай 33×48 мм",
      desc: "Фото на китайскую визу: 33×48 мм, голова 28–33 мм по разметке, белый фон. Одно фото для анкеты или лист для печати 10×15 см.",
      lead: "Рамка 33×48 мм с разметкой головы — для визы в Китай.",
      for: ["Туристическая и деловая виза в Китай.", "Электронная анкета визового центра.", "Печать на фотобумаге 10×15 см."],
    },
    en: {
      name: "China visa 33×48",
      title: "China Visa Photo Online — 33×48 mm",
      h1: "China visa photo, 33×48 mm",
      desc: "A Chinese visa photo: 33×48 mm with the head at 28–33 mm on the guides and a white background. One photo for the form or a 4×6 in print sheet.",
      lead: "A 33×48 mm frame with head guides — for a China visa.",
      for: ["Tourist and business visas to China.", "The visa centre's online form.", "Printing on 4×6 in photo paper."],
    },
  },
  {
    slug: "9x12",
    id: "90x120",
    ru: {
      name: "Фото 9×12",
      title: "Фото 9×12 на документы онлайн | для личного дела",
      h1: "Фото 9×12 см онлайн",
      desc: "Фото 9×12 см для личного дела, военкомата и некоторых удостоверений: рамка нужной формы и лист A4 с двумя фото для печати.",
      lead: "Рамка 9×12 см и лист A4 с готовыми фото для печати.",
      for: ["Личное дело в военкомате.", "Документы на работу и в учебные заведения.", "Портрет на доску почёта."],
    },
    en: {
      name: "9×12 cm photo",
      title: "9×12 cm Document Photo Online — A4 Print Sheet",
      h1: "9×12 cm photo online",
      desc: "A 9×12 cm photo for personnel files and some certificates: the right frame shape and an A4 sheet with two copies for printing.",
      lead: "A 9×12 cm frame and an A4 sheet with ready copies.",
      for: ["Military registration files.", "Job and school documents.", "Honour board portraits."],
    },
  },
];

export const passportPhotoTool: ToolDef = {
  slug: "passport-photo",
  component: "image/passport",
  icon: "SquareUser",
  popular: true,
  props: { format: "35x45" },
  name: { ru: "Фото на документы", en: "Passport photo" },
  title: { ru: "Фото на паспорт онлайн | фото на документы с разметкой", en: "Passport Photo Online — ID Photo with Guides" },
  seoAlt: { ru: "фото на документы", en: "ID photo maker" },
  h1: { ru: "Фото на паспорт онлайн", en: "Passport photo online" },
  description: {
    ru: "Фото на паспорт 35×45 мм, 3×4 и на визы из обычного снимка: рамка с разметкой головы, фото в 600 dpi и готовый лист 10×15 или A4 для печати.",
    en: "Passport, 3×4 cm and visa photos from a normal picture: a frame with head guides, a 600 dpi photo and a ready 4×6 in or A4 sheet for printing.",
  },
  lead: { ru: "Загрузите снимок, выставьте лицо по разметке — получите фото на документы или лист для печати.", en: "Upload a picture, fit the face to the guides and get an ID photo or a print sheet." },
  keywords: { ru: ["фото на паспорт онлайн", "фото на документы онлайн", "фото 35х45", "фото на загранпаспорт", "фото на визу", "сделать фото на паспорт"], en: ["passport photo", "id photo maker", "passport photo online", "visa photo", "35x45 photo"] },
  howTo: {
    ru: ["Сфотографируйтесь на светлом однотонном фоне при ровном свете и загрузите снимок.", "Выберите размер и подвиньте рамку: макушка — на верхней линии, подбородок — в нижней полосе.", "Выберите «Одно фото», «Лист 10×15» или «Лист A4» и скачайте. Лист печатается в фотосалоне как обычное фото 10×15."],
    en: ["Take a picture against a plain light background in even light and upload it.", "Choose the size and move the frame: crown on the upper line, chin in the lower band.", "Choose One photo, 4×6 sheet or A4 sheet and download. Print the sheet like any 4×6 photo."],
  },
  about: {
    ru: [
      "Разметка соответствует рекомендациям ИКАО для фото на документы: для формата 35×45 мм голова от подбородка до макушки занимает 32–36 мм, над макушкой — 3–5 мм. Так вы сразу видите, подходит ли кадр.",
      "Лист 10×15 см — самый дешёвый способ напечатать фото на документы: на нём помещается 6 фото 35×45, а печать стоит как одна обычная фотография. Фон заменить инструмент не может — снимайтесь сразу на светлом фоне.",
    ],
    en: [
      "The guides follow ICAO recommendations for document photos: in a 35×45 mm photo the head from chin to crown takes 32–36 mm with 3–5 mm above the crown, so you see at once whether the shot fits.",
      "A 4×6 in sheet is the cheapest way to print ID photos: it holds six 35×45 mm photos and costs as much as one ordinary print. The tool can't replace the background — take the photo against a light one.",
    ],
  },
  faq: {
    ru: [
      { q: "Подойдёт ли фото для паспорта РФ и удостоверения РК?", a: "По размеру — да: оба документа используют формат 35×45 мм. Требования к фону, освещению и выражению лица проверьте на сайте ведомства: инструмент отвечает за размер и положение головы." },
      { q: "Как распечатать лист 10×15?", a: "Отправьте файл в любой фотосалон или киоск печати как обычное фото 10×15 без полей и масштабирования, затем разрежьте по серым линиям." },
      { q: "Можно ли сделать чёрно-белое фото?", a: "Да, включите «Чёрно-белое» в дополнительных настройках." },
      { q: "Снимок куда-нибудь отправляется?", a: "Нет, всё делается в браузере: фото не покидает ваше устройство." },
    ],
    en: [
      { q: "Will it work for a passport or national ID?", a: "Size-wise yes for any 35×45 mm document. Check background, lighting and expression rules on the issuing authority's site: the tool takes care of size and head position." },
      { q: "How do I print the 4×6 sheet?", a: "Send the file to any photo shop or kiosk as a borderless 4×6 print with no scaling, then cut along the grey lines." },
      { q: "Can I make it black and white?", a: "Yes, turn on Black and white in the extra settings." },
      { q: "Is my picture uploaded?", a: "No, everything runs in your browser: the photo never leaves your device." },
    ],
  },
  related: ["resize-image/passport-35x45", "crop-image", "id-card-copy", "change-dpi"],
  wide: true,
  blocks: formatFacts(fmt("35x45")),
  variants: {
    title: { ru: "Другие размеры", en: "Other sizes" },
    list: (): VariantDef[] =>
      VARIANTS.map((v) => ({
        slug: v.slug,
        name: { ru: v.ru.name, en: v.en.name },
        title: { ru: v.ru.title, en: v.en.title },
        h1: { ru: v.ru.h1, en: v.en.h1 },
        description: { ru: v.ru.desc, en: v.en.desc },
        lead: { ru: v.ru.lead, en: v.en.lead },
        props: { format: v.id },
        blocks: (l) => [...formatFacts(fmt(v.id))(l), { type: "list", title: tt(l, "Для чего подходит", "Used for"), items: v[l].for }],
      })),
  },
};
