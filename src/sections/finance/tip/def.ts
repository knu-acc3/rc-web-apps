import type { ToolDef } from "@/registry/types";

export const tipTool: ToolDef = {
  slug: "tip-calculator",
  component: "finance/tip",
  icon: "HandCoins",
  name: { ru: "Калькулятор чаевых", en: "Tip calculator" },
  title: { ru: "Калькулятор чаевых — разделить счёт на компанию", en: "Tip calculator — split the bill with a tip" },
  h1: { ru: "Калькулятор чаевых и разделения счёта", en: "Tip calculator and bill splitter" },
  description: {
    ru: "Посчитайте чаевые и поделите счёт на компанию: доли округляются вверх до 10, 100 или 1000 ₸, а сумма долей всегда совпадает с итогом — никаких 99,99 из 100.",
    en: "Work out the tip and split the bill between friends: shares can be rounded up to a whole amount, and they always add up to the total — never 99.99 out of 100.",
  },
  lead: {
    ru: "Счёт 18 450 ₸ + 10 % чаевых на троих — по 6 800 ₸ с человека при округлении до 100 ₸.",
    en: "A $86.50 bill with a 10% tip split three ways is $31.72, $31.72 and $31.71 — exactly $95.15.",
  },
  keywords: {
    ru: ["калькулятор чаевых", "разделить счёт", "сколько оставить чаевых", "чаевые процент"],
    en: ["tip calculator", "split the bill", "how much to tip", "bill splitter"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите сумму счёта из чека.",
      "Укажите процент чаевых и число человек.",
      "Выберите округление доли: точно до тиына или вверх до 10, 100, 1000 ₸.",
      "Смотрите, сколько платит каждый, и фактический процент чаевых после округления.",
    ],
    en: [
      "Enter the bill amount from the receipt.",
      "Enter the tip percentage and the number of people.",
      "Choose rounding: exact to the cent or up to a whole amount.",
      "See what each person pays and the actual tip percentage after rounding.",
    ],
  },
  about: {
    ru: [
      "Калькулятор делит счёт так, чтобы доли всегда давали ровно итоговую сумму. Если сумма не делится поровну, один или несколько человек платят на тиын больше: 100 ₸ на троих — 33,34 + 33,33 + 33,33.",
      "Удобнее платить круглыми суммами — выберите округление вверх. Тогда все платят одинаково, а разница увеличивает чаевые; калькулятор покажет, сколько процентов получилось на самом деле.",
    ],
    en: [
      "The calculator splits the bill so the shares always add up to the exact total. When it does not divide evenly, one or more people pay a cent more: 100 split three ways is 33.34 + 33.33 + 33.33.",
      "Paying round amounts is easier — choose rounding up. Everyone then pays the same and the difference is added to the tip; the calculator shows the actual percentage.",
    ],
  },
  faq: {
    ru: [
      { q: "Сколько оставлять чаевых?", a: "Обычно 5–10 % от счёта в Казахстане и России и 15–20 % в США. Если в чеке уже есть плата за обслуживание, дополнительные чаевые не обязательны." },
      { q: "Как разделить счёт с чаевыми на компанию?", a: "Прибавьте чаевые к счёту и разделите на число людей: (18 450 + 1 845) / 3 = 6 765 ₸. С округлением до 100 ₸ каждый платит по 6 800 ₸." },
      { q: "Почему доли разные на тиын?", a: "Чтобы сумма долей точно равнялась итогу. 100 ₸ на троих нельзя разделить поровну до тиына, поэтому один платит 33,34 ₸, двое — по 33,33 ₸." },
    ],
    en: [
      { q: "How much should I tip?", a: "Usually 15–20% in the US and 5–10% in many other countries. If a service charge is already on the bill, an extra tip is optional." },
      { q: "How do I split a bill with a tip?", a: "Add the tip to the bill and divide by the number of people: (86.50 + 8.65) / 3 gives 31.72, 31.72 and 31.71 — together exactly 95.15." },
      { q: "Why do the shares differ by a cent?", a: "So the shares add up to the exact total. 100 cannot be split three ways evenly to the cent, so one person pays 33.34 and two pay 33.33." },
    ],
  },
  related: ["percentage-calculator", "discount-calculator", "budget-calculator", "unit-price-calculator"],
};
