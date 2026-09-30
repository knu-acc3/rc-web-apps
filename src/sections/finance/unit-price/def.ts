import type { ToolDef } from "@/registry/types";

export const unitPriceTool: ToolDef = {
  slug: "unit-price-calculator",
  component: "finance/unit-price",
  icon: "ShoppingBasket",
  name: { ru: "Сравнение цен за килограмм", en: "Unit price calculator" },
  title: { ru: "Цена за килограмм и литр — сравнить упаковки онлайн", en: "Unit price calculator — compare price per kg, litre, item" },
  h1: { ru: "Какая упаковка выгоднее: цена за кг и литр", en: "Unit price calculator: which pack is cheaper" },
  description: {
    ru: "Сравните товары в разных упаковках: цена за килограмм, литр или штуку, самый выгодный вариант и переплата в процентах. Граммы, кг, мл, литры и штуки.",
    en: "Compare products in different pack sizes: price per kilogram, litre or item, the best deal and how much more the others cost. Grams, kg, ml, litres and pieces.",
  },
  lead: {
    ru: "Пачка 900 г за 1 590 ₸ выгоднее двух пачек по 450 г за 890 ₸: 1 767 ₸ против 1 978 ₸ за килограмм.",
    en: "A 36-pack for $8.99 beats a 12-pack for $3.49: $0.25 versus $0.29 per item.",
  },
  keywords: {
    ru: ["цена за кг", "цена за литр", "сравнить цены", "какая упаковка выгоднее", "цена за единицу"],
    en: ["unit price calculator", "price per kg", "price per litre", "compare prices", "best value"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите цену и вес, объём или количество штук для каждой упаковки.",
      "Выберите единицу: г, кг, мл, л или шт. — всё приводится к цене за кг, литр или штуку.",
      "Добавьте нужное число товаров — до 12.",
      "Самый выгодный вариант выделен, для остальных показана переплата в процентах.",
    ],
    en: [
      "Enter the price and the weight, volume or count of each pack.",
      "Choose the unit: g, kg, ml, l or pcs — everything is converted to a price per kg, litre or item.",
      "Add as many items as you need, up to 12.",
      "The best deal is highlighted, the others show how much more they cost.",
    ],
  },
  about: {
    ru: [
      "Большая упаковка не всегда дешевле, а акционная цена не всегда выгодна. Честное сравнение — по цене за единицу: за килограмм, литр или штуку. Именно её в магазинах указывают мелким шрифтом на ценнике.",
      "Калькулятор сам переводит граммы в килограммы и миллилитры в литры, поэтому можно сравнивать пачку 450 г с упаковкой 2 кг. Товары, которые продаются в разных единицах (например, вес и штуки), сравниваются внутри своей группы.",
    ],
    en: [
      "Bigger packs are not always cheaper and deals are not always a bargain. The fair comparison is the unit price — per kilogram, litre or item — the small print on shelf labels.",
      "The calculator converts grams to kilograms and millilitres to litres, so you can compare a 450 g pack with a 2 kg bag. Items sold in different kinds of units (weight vs pieces) are compared within their own group.",
    ],
  },
  faq: {
    ru: [
      { q: "Как посчитать цену за килограмм?", a: "Разделите цену на вес в граммах и умножьте на 1000. Пачка 450 г за 890 ₸: 890 / 450 × 1000 ≈ 1 978 ₸ за кг." },
      { q: "Как сравнить упаковки разного объёма?", a: "Приведите их к цене за литр: 1,5 л за 1 200 ₸ — это 800 ₸ за литр, а 0,5 л за 450 ₸ — 900 ₸ за литр, значит большая бутылка выгоднее на 11 %." },
      { q: "Всегда ли большая упаковка выгоднее?", a: "Нет. Часто так и есть, но на акциях маленькие упаковки бывают дешевле за килограмм. Сравнивайте цену за единицу." },
    ],
    en: [
      { q: "How do I calculate the price per kilogram?", a: "Divide the price by the weight in grams and multiply by 1000. A 450 g pack for 8.90: 8.90 / 450 × 1000 ≈ 19.78 per kg." },
      { q: "How do I compare different volumes?", a: "Convert to a price per litre: 1.5 l for 1.20 is 0.80 per litre, 0.5 l for 0.45 is 0.90 per litre — the big bottle is 11% cheaper." },
      { q: "Is the bigger pack always cheaper?", a: "No. Often it is, but small packs on sale can be cheaper per kilogram. Compare unit prices." },
    ],
  },
  related: ["discount-calculator", "percentage-calculator", "budget-calculator", "tip-calculator"],
};
