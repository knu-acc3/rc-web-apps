import type { Locale } from "@/i18n/config";

interface TemplateGroup {
  title: string;
  items: string[];
}

/** Packing list for a trip, grouped by category. */
export const PACKING: Record<Locale, { name: string; groups: TemplateGroup[] }> = {
  ru: {
    name: "Вещи в поездку",
    groups: [
      { title: "Документы и деньги", items: ["Паспорт или удостоверение личности", "Билеты и бронь жилья (в телефоне или распечатка)", "Медицинская страховка", "Банковские карты и немного наличных", "Водительские права"] },
      { title: "Техника", items: ["Телефон и зарядка", "Пауэрбанк", "Наушники", "Переходник для розеток", "Ноутбук или планшет с зарядкой"] },
      { title: "Одежда и обувь", items: ["Нижнее бельё и носки", "Футболки", "Брюки или джинсы", "Тёплая кофта или куртка", "Пижама", "Удобная обувь", "Шлёпанцы", "Купальник или плавки", "Головной убор и солнцезащитные очки"] },
      { title: "Гигиена", items: ["Зубная щётка и паста", "Шампунь и гель для душа в дорожном объёме", "Дезодорант", "Расчёска", "Солнцезащитный крем", "Бритва"] },
      { title: "Здоровье", items: ["Лекарства, которые вы принимаете", "Аптечка: обезболивающее, пластыри, средство от расстройства желудка"] },
      { title: "Разное", items: ["Ключи от дома", "Бутылка для воды", "Книга или загруженные фильмы", "Зонт", "Пакеты для обуви и грязной одежды"] },
    ],
  },
  en: {
    name: "Packing list",
    groups: [
      { title: "Documents and money", items: ["Passport or ID", "Tickets and accommodation booking (on the phone or printed)", "Travel insurance", "Bank cards and some cash", "Driving licence"] },
      { title: "Electronics", items: ["Phone and charger", "Power bank", "Headphones", "Plug adapter", "Laptop or tablet with charger"] },
      { title: "Clothes and shoes", items: ["Underwear and socks", "T-shirts", "Trousers or jeans", "Warm sweater or jacket", "Pyjamas", "Comfortable shoes", "Flip-flops", "Swimsuit", "Hat and sunglasses"] },
      { title: "Toiletries", items: ["Toothbrush and toothpaste", "Travel-size shampoo and shower gel", "Deodorant", "Hairbrush", "Sunscreen", "Razor"] },
      { title: "Health", items: ["Your regular medication", "First-aid kit: painkillers, plasters, stomach remedy"] },
      { title: "Other", items: ["House keys", "Water bottle", "A book or downloaded films", "Umbrella", "Bags for shoes and laundry"] },
    ],
  },
};

export const TEMPLATES = { packing: PACKING } as const;
export type TemplateId = keyof typeof TEMPLATES;

export function templateItems(id: TemplateId, locale: Locale): string[] {
  return TEMPLATES[id][locale].groups.flatMap((g) => g.items);
}
