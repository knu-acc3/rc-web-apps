import type { ToolDef, VariantDef } from "@/registry/types";
import { KZ_CITIES, type KzCity } from "./data";

function cityVariants(): VariantDef[] {
  return KZ_CITIES.map((c: KzCity) => {
    const tariffStr = c.residentialTariff.toFixed(2);
    return {
      slug: c.slug,
      name: { ru: c.name.ru, en: c.name.en },
      title: {
        ru: `Калькулятор 3D-печати в ${c.name.ru} — расчёт стоимости`,
        en: `3D Printing Cost Calculator in ${c.name.en}`,
      },
      h1: {
        ru: `Стоимость 3D-печати в ${c.name.ru}`,
        en: `3D Printing Cost Calculator in ${c.name.en}`,
      },
      description: {
        ru: `Онлайн-калькулятор стоимости 3D-печати в ${c.name.ru}: тариф ${tariffStr} ₸/кВт⋅ч (${c.utility}), расход филамента, износ сопла и наценка мастерской.`,
        en: `Calculate 3D printing costs in ${c.name.en}: local electricity tariff of ${tariffStr} KZT/kWh, filament usage, Bambu Lab machine depreciation, and labor.`,
      },
      lead: {
        ru: `Расчёт себестоимости и цены 3D-печати в ${c.name.ru} по местному тарифу ${tariffStr} ₸ за кВт⋅ч с учётом пластика и износа.`,
        en: `Estimate 3D print pricing in ${c.name.en} based on the local energy tariff of ${tariffStr} KZT/kWh plus consumables and labor.`,
      },
      keywords: {
        ru: [
          `3д печать ${c.name.ru.toLowerCase()}`,
          `стоимость 3д печати ${c.name.ru.toLowerCase()}`,
          `калькулятор 3d печати ${c.name.ru.toLowerCase()}`,
        ],
        en: [
          `3d printing cost ${c.name.en.toLowerCase()}`,
          `3d print calculator ${c.name.en.toLowerCase()}`,
        ],
      },
      props: {
        city: c.slug,
      },
    };
  });
}

export const print3dTool: ToolDef = {
  slug: "3d-printing-calculator",
  component: "calc/3d-print",
  icon: "Printer",
  hue: 0,
  popular: true,
  name: {
    ru: "Калькулятор 3D-печати",
    en: "3D printing calculator",
  },
  title: {
    ru: "Калькулятор 3D-печати — себестоимость и цена в Казахстане",
    en: "3D Printing Cost Calculator — Material, Power and Rates",
  },
  h1: {
    ru: "Калькулятор стоимости 3D-печати",
    en: "3D Printing Cost Calculator",
  },
  description: {
    ru: "Калькулятор 3D-печати для Казахстана: расчёт себестоимости по весу, времени, электроэнергии в РК, принтерам Creality и Bambu, соплам и тиражу.",
    en: "Calculate 3D printing costs in Kazakhstan and worldwide: filament weight, Creality and Bambu power consumption, city tariffs, nozzle wear, batch profit.",
  },
  lead: {
    ru: "Точный расчёт себестоимости и продажной цены детали на 3D-принтере с учётом тарифов Казахстана, расхода пластика и износа.",
    en: "Accurate 3D print pricing tool for calculating filament, electricity rates, equipment depreciation, nozzle wear, and profit margin.",
  },
  keywords: {
    ru: [
      "калькулятор 3д печати",
      "себестоимость 3д печати",
      "стоимость 3d печати казахстан",
      "расход пластика 3д печать",
      "расход электричества creality",
      "расход электричества bambu lab",
      "цена 3д печати за грамм",
    ],
    en: [
      "3d printing cost calculator",
      "3d print price calculator",
      "creality electricity cost",
      "bambu lab electricity cost",
      "3d printing price per gram",
      "filament cost calculator",
    ],
  },
  props: {
    city: "almaty",
    printer: "ender3",
    material: "pla",
    weight: 100,
    hours: 4,
  },
  howTo: {
    ru: [
      "Выберите модель 3D-принтера (Bambu Lab P1S/P2S/A1, Creality K1/Ender, Anycubic Kobra) и пластик (PLA, PETG, ABS, TPU, PA-CF).",
      "Укажите город Казахстана — калькулятор подставит официальный тариф на электроэнергию (с возможностью ручной правки).",
      "Задайте чистый вес детали и время печати из слайсера (Bambu Studio, OrcaSlicer, Creality Print, PrusaSlicer).",
      "Для многоцветной печати переключите режим и укажите число смен цвета (AMS / CFS / ACE Pro) и сброс на смену.",
      "В расширенных настройках настройте сопло, сушилку, работу мастера, упаковку и налог для точной цены.",
    ],
    en: [
      "Select your 3D printer (Bambu Lab P1S/P2S/A1, Creality K1/Ender, Anycubic Kobra) and filament material.",
      "Choose a city in Kazakhstan — the calculator automatically fills in the electricity tariff (editable).",
      "Enter the net part weight and printing time from your slicer (Bambu Studio, OrcaSlicer, Creality Print).",
      "For multi-color printing, switch modes and specify tool changes (AMS / CFS / ACE Pro) and purge weight.",
      "Review the detailed cost breakdown, recommended selling price, profit margin, and cost per gram.",
    ],
  },
  about: {
    ru: [
      "Расчёт коммерческой стоимости 3D-печати требует учёта множества скрытых расходов, помимо стоимости катушки пластика. Линейная оценка «20–30 тенге за грамм» часто приводит к убыткам на лёгких, но долгих деталях, либо отпугивает заказчиков на массивных простых изделиях.",
      "Настоящая себестоимость складывается из затрат на сырьё (с учётом башни очистки и продувки сопла при многоцветной печати в AMS/CFS/ACE Pro), реального электропотребления стола и экструдера, амортизации оборудования, износа сопел и адгезивов, оплаты труда мастера и упаковки.",
      "Калькулятор содержит готовую базу тарифов для 18 ключевых городов Казахстана, проверенные профили энергопотребления линеек Bambu Lab, Creality и Anycubic, а также налоговые режимы РК (ИП на упрощёнке 3%, розничный налог 4%, НДС).",
    ],
    en: [
      "Pricing 3D printed parts accurately requires taking into account far more than just the weight of filament. Flat-rate pricing per gram can lead to heavy losses on small intricate prints or scare away clients on large simple parts.",
      "Real production cost consists of filament expenses (including multi-color purge waste and prime towers), actual bed and hotend electricity consumption, machine depreciation, nozzle degradation, adhesive supplies, labor, and packaging.",
      "This calculator features built-in electricity tariffs for 18 cities in Kazakhstan, empirical printer power curves for Bambu Lab, Creality, and Anycubic, and Kazakhstan tax regimes.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Сколько электроэнергии потребляет современный 3D-принтер?",
        a: "В расчёте учитывается стабильная базовая мощность во время печати: около 85–110 Вт для открытых моделей (A1, Ender-3), 105–140 Вт для закрытых CoreXY на PLA/PETG (P1S, P2S, K1) и 190–250 Вт при печати ABS/ASA с горячим столом. Кратковременные пики первичного прогрева стола не завышают итоговую сумму.",
      },
      {
        q: "Как рассчитываются отходы при многоцветной печати (AMS / CFS / ACE Pro)?",
        a: "При частой смене цветов продувка сопла (слив/poop) и чистящая башня могут превышать вес самой детали. Калькулятор умножает число смен нити на граммы сброса (по умолчанию 0.35 г на смену) и добавляет время на каждую смену к общему времени работы принтера.",
      },
      {
        q: "Как считается амортизация принтера?",
        a: "Стоимость принтера делится на его расчётный ресурс в часах печати. Например, для Bambu Lab P1S при цене 460 000 ₸ и ресурсе 6 000 часов амортизация составляет 77 ₸ за каждый час печати.",
      },
      {
        q: "В чём выгода оптового тиража деталей?",
        a: "Время подготовки файла, слайсинга и настройки распределяется на весь тираж. Упаковка также может считаться на общую коробку, благодаря чему себестоимость единицы при тираже от 10–50 штук заметно снижается.",
      },
    ],
    en: [
      {
        q: "How much power does a modern 3D printer actually draw?",
        a: "Calculations use sustained operating power: ~85–110W for open bedslingers (A1, Ender-3), 105–140W for enclosed CoreXY on PLA/PETG (P1S, P2S, K1), and 190–250W for ABS/ASA with high bed temperatures.",
      },
      {
        q: "How does multi-color printing waste get calculated?",
        a: "Purge towers and nozzle flushes (poop) often exceed part weight. The calculator multiplies total tool changes by purge weight per swap (~0.35g) and accounts for the additional machine time required for each filament swap.",
      },
      {
        q: "How is printer depreciation calculated?",
        a: "The machine purchase price is divided by its estimated service lifespan in printing hours. For a Bambu Lab P1S at 460,000 KZT with a 6,000-hour lifespan, depreciation equals 77 KZT per printing hour.",
      },
      {
        q: "Why is batch 3D printing cheaper per unit?",
        a: "Preparation and slicing labor is divided across the total batch quantity. Packaging can also be shared, significantly reducing the per-piece net cost for quantities of 10 or more.",
      },
    ],
  },
  related: [
    "unit-price-calculator",
    "vat-calculator",
    "markup-margin-calculator",
    "percentage-calculator",
    "break-even-calculator",
  ],
  variants: {
    title: {
      ru: "Калькулятор 3D-печати по городам Казахстана",
      en: "3D printing calculator by Kazakhstan cities",
    },
    list: cityVariants,
  },
};
