import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";

const tt = (l: Locale, ru: string, en: string) => (l === "ru" ? ru : en);

const sizes = (l: Locale): Block => ({
  type: "facts",
  title: tt(l, "Размеры на листе", "Sizes on the sheet"),
  rows: [
    [tt(l, "ID-карта, удостоверение, права, банковская карта", "ID card, driving licence, bank card"), tt(l, "85,6 × 54 мм (формат ID-1)", "85.6 × 54 mm (ID-1 format)")],
    [tt(l, "Разворот паспорта", "Passport spread"), tt(l, "176 × 125 мм", "176 × 125 mm")],
    [tt(l, "Лист", "Sheet"), tt(l, "A4, 210 × 297 мм, 300 dpi", "A4, 210 × 297 mm, 300 dpi")],
  ],
});

export const idCopyTool: ToolDef = {
  slug: "id-card-copy",
  component: "image/id-copy",
  icon: "IdCard",
  props: { doc: "id" },
  name: { ru: "Копия удостоверения на одном листе", en: "ID card copy on one page" },
  title: { ru: "Копия удостоверения с двух сторон на одном листе | онлайн", en: "Copy Both Sides of an ID Card on One Page Online" },
  h1: { ru: "Копия удостоверения с двух сторон на одном листе", en: "Copy both sides of an ID card on one page" },
  description: {
    ru: "Сфотографируйте удостоверение или ID-карту с двух сторон — получите копию на одном листе A4 в натуральную величину. PDF или JPG, чёрно-белая для печати.",
    en: "Photograph both sides of an ID card and get a copy on one A4 page at actual size. PDF or JPG, black and white for printing.",
  },
  lead: { ru: "Две фотографии документа — и готовая копия обеих сторон на одном листе, как с ксерокса.", en: "Two photos of the document make a copy of both sides on one page, like a photocopier." },
  keywords: { ru: ["копия удостоверения с двух сторон на одном листе", "копия удостоверения личности", "ксерокопия удостоверения онлайн", "копия id карты"], en: ["id card copy both sides one page", "copy id card front and back", "photocopy id online"] },
  howTo: {
    ru: ["Сфотографируйте лицевую и обратную стороны документа на тёмном фоне при хорошем свете.", "Загрузите фото и подгоните рамку по краям документа; кнопка «Повернуть» выпрямит снимок.", "Выберите PDF или JPG и скачайте лист. Печатайте без масштабирования — размер будет как у оригинала."],
    en: ["Photograph the front and back of the document on a dark background in good light.", "Upload the photos and fit the frame to the document's edges; Rotate straightens a sideways shot.", "Choose PDF or JPG and download. Print without scaling — the size matches the original."],
  },
  about: {
    ru: [
      "Копию удостоверения с двух сторон на одном листе просят банки, работодатели, нотариусы и школы. Здесь её можно сделать без ксерокса: обе стороны встают на лист A4 в размере 85,6 × 54 мм — как у настоящей карты.",
      "Документ не покидает ваш телефон или компьютер: фото обрабатываются в браузере. Чёрно-белая копия выглядит как с копира и экономит краску.",
    ],
    en: [
      "Banks, employers, notaries and schools often ask for a copy of both sides of an ID on one page. Here you can make one without a copier: both sides land on an A4 sheet at 85.6 × 54 mm, like the real card.",
      "The document never leaves your phone or computer: photos are processed in the browser. A black-and-white copy looks like a photocopy and saves ink.",
    ],
  },
  faq: {
    ru: [
      { q: "Будет ли копия в натуральную величину?", a: "Да, если печатать без масштабирования («Фактический размер» или 100 % в настройках печати). Удостоверение займёт 85,6 × 54 мм." },
      { q: "Как сфотографировать документ, чтобы копия была чёткой?", a: "Положите документ на тёмный стол, снимайте сверху при дневном свете без вспышки, чтобы не было бликов, и заполните им как можно больше кадра." },
      { q: "Безопасно ли это?", a: "Фото не загружаются на сервер — всё делается на вашем устройстве. Для отправки копии по почте можно дописать на неё назначение, например «Для банка», в «Добавить текст в PDF»." },
    ],
    en: [
      { q: "Is the copy actual size?", a: "Yes, if you print without scaling (Actual size or 100% in print settings). The card takes 85.6 × 54 mm." },
      { q: "How do I photograph a document for a sharp copy?", a: "Put it on a dark table, shoot from above in daylight without flash to avoid glare, and fill as much of the frame as you can." },
      { q: "Is it safe?", a: "Photos aren't uploaded — everything happens on your device. Before emailing a copy, you can stamp its purpose on it, e.g. “For the bank”, with Add text to PDF." },
    ],
  },
  related: ["passport-photo", "add-text-to-pdf", "jpg-to-pdf", "compress-pdf"],
  wide: true,
  blocks: (l) => [sizes(l)],
  variants: {
    title: { ru: "Другие документы", en: "Other documents" },
    list: (): VariantDef[] => [
      {
        slug: "passport",
        name: { ru: "Копия паспорта", en: "Passport copy" },
        title: { ru: "Копия паспорта на одном листе онлайн | два разворота", en: "Passport Copy on One Page Online — Two Spreads" },
        h1: { ru: "Копия паспорта на одном листе", en: "Passport copy on one page" },
        description: {
          ru: "Копия двух разворотов паспорта — с фото и пропиской — на одном листе A4 в натуральную величину. Из фотографий телефона, без ксерокса, PDF или JPG.",
          en: "A copy of two passport spreads — the photo page and another — on one A4 page at actual size. From phone photos, no copier, as PDF or JPG.",
        },
        lead: { ru: "Сфотографируйте два разворота — получите их копию на одном листе.", en: "Photograph two spreads and get both on one page." },
        props: { doc: "passport" },
        blocks: (l) => [
          {
            type: "list",
            title: tt(l, "Какие развороты обычно просят", "Spreads usually requested"),
            items:
              l === "ru"
                ? ["Страницы 2–3: кем выдан и фото с данными владельца.", "Страницы 4–5: регистрация по месту жительства.", "Для загранпаспорта — разворот с фото."]
                : ["The photo page with the holder's details.", "The address or residence page, where there is one.", "For travel passports — the photo spread."],
          },
        ],
      },
      {
        slug: "driver-license",
        name: { ru: "Копия водительских прав", en: "Driving licence copy" },
        title: { ru: "Копия водительских прав с двух сторон на одном листе", en: "Driving Licence Copy — Both Sides on One Page" },
        h1: { ru: "Копия водительских прав на одном листе", en: "Driving licence copy on one page" },
        description: {
          ru: "Копия водительского удостоверения с двух сторон на одном листе A4: в натуральную величину 85,6 × 54 мм, чёрно-белая или цветная, в PDF или JPG.",
          en: "A copy of both sides of a driving licence on one A4 page: actual size 85.6 × 54 mm, black and white or colour, as PDF or JPG.",
        },
        lead: { ru: "Обе стороны прав на одном листе — для страховой, работы или аренды авто.", en: "Both sides of the licence on one page — for insurance, work or car hire." },
        props: { doc: "id" },
        blocks: (l) => [
          {
            type: "list",
            title: tt(l, "Когда нужна копия прав", "When a licence copy is needed"),
            items: l === "ru" ? ["Полис ОСАГО или страховка.", "Трудоустройство водителем.", "Аренда автомобиля и каршеринг."] : ["Car insurance.", "Driving jobs.", "Car hire and car sharing."],
          },
        ],
      },
    ],
  },
};
