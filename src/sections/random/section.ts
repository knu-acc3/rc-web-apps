import type { Locale } from "@/i18n/config";
import { defineToolSection } from "@/registry/tool-section";
import type { Block } from "@/registry/types";
import { diceTool } from "./defs/dice";
import { letterTool } from "./defs/letters";
import { lotteryTool } from "./defs/lottery";
import { nameTool } from "./defs/names";
import { numberTool } from "./defs/number";
import { cardTool, coinTool, dateTool, pickerTool, rpsTool, santaTool, yesNoTool } from "./defs/simple";
import { teamsTool } from "./defs/teams";
import { wheelTool } from "./defs/wheel";

function hubBlocks(locale: Locale): Block[] {
  return [
    {
      type: "text",
      title: locale === "ru" ? "Насколько это случайно" : "How random is it?",
      paragraphs:
        locale === "ru"
          ? [
              "Все инструменты раздела используют криптографический генератор браузера crypto.getRandomValues — тот же источник, что и для ключей шифрования. Если он недоступен, инструмент сообщит об ошибке, а не подменит его предсказуемым Math.random.",
              "Числа переводятся в нужный диапазон отбором без смещения: лишние значения отбрасываются, поэтому, например, на кубике d6 каждая грань выпадает ровно с шансом 1/6. Колесо фортуны сначала выбирает победителя, а потом останавливается в случайной точке его сектора.",
              "Всё считается на вашем устройстве: списки, имена и результаты никуда не отправляются.",
            ]
          : [
              "Every tool here uses the browser's cryptographic generator, crypto.getRandomValues — the same source used for encryption keys. If it's unavailable, the tool shows an error instead of quietly falling back to the predictable Math.random.",
              "Numbers are mapped to your range by unbiased rejection sampling: values that would skew the result are discarded, so each face of a d6 comes up with exactly a 1/6 chance. The wheel picks the winner first and then stops at a random point inside its slice.",
              "Everything runs on your device: lists, names and results are never sent anywhere.",
            ],
    },
    {
      type: "links",
      title: locale === "ru" ? "Другие генераторы" : "More generators",
      style: "chips",
      items: [
        { path: ["password-generator"], label: locale === "ru" ? "Генератор паролей" : "Password generator" },
        { path: ["uuid-generator"], label: locale === "ru" ? "Генератор UUID" : "UUID generator" },
        { path: ["lorem-ipsum"], label: "Lorem ipsum" },
        { path: ["color-palette-generator"], label: locale === "ru" ? "Генератор палитр" : "Color palette generator" },
      ],
    },
  ];
}

export const randomSection = defineToolSection({
  id: "random",
  name: { ru: "Рандомайзер", en: "Randomizer" },
  description: {
    ru: "Колесо фортуны, монетка, кубики, случайные числа, жеребьёвка команд и Тайный Санта",
    en: "Wheel spinner, coin flip, dice, random numbers, team picker and Secret Santa",
  },
  title: {
    ru: "Рандомайзер онлайн — колесо фортуны, кубики, монетка, числа",
    en: "Online Randomizer — wheel spinner, dice, coin flip, numbers",
  },
  h1: { ru: "Рандомайзер онлайн", en: "Online randomizer" },
  hubDescription: {
    ru: "Рандомайзер онлайн: колесо фортуны, монетка, кубики d4–d100, случайные числа, лотерея, команды, имена и Тайный Санта. Честный выбор на crypto.getRandomValues.",
    en: "Online randomizer: wheel spinner, coin flip, d4–d100 dice, random numbers, lottery picks, teams, names and Secret Santa, powered by crypto.getRandomValues.",
  },
  icon: "Dices",
  hue: 300,
  category: "random",
  order: 1,
  tools: [wheelTool, numberTool, coinTool, diceTool, pickerTool, teamsTool, yesNoTool, lotteryTool, nameTool, letterTool, cardTool, rpsTool, santaTool, dateTool],
  hubBlocks,
});
