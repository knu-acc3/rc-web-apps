import { defineToolSection } from "@/registry/tool-section";
import * as body from "./group-body";
import * as cycle from "./group-cycle";

export const healthSection = defineToolSection({
  id: "health",
  name: { ru: "Здоровье", en: "Health" },
  title: {
    ru: "Калькуляторы здоровья онлайн — ИМТ, калории, беременность, сон",
    en: "Health calculators online — BMI, calories, pregnancy, sleep",
  },
  h1: { ru: "Калькуляторы здоровья", en: "Health calculators" },
  description: {
    ru: "Калькуляторы здоровья: индекс массы тела, калории и БЖУ, процент жира, срок беременности и овуляция, фазы сна, норма воды и пульсовые зоны.",
    en: "Health calculators: body mass index, calories and macros, body fat, pregnancy due date and ovulation, sleep cycles, water intake and heart-rate zones.",
  },
  icon: "HeartPulse",
  hue: 350,
  category: "calc",
  order: 3,
  tools: [...body.tools, ...cycle.tools],
  hubBlocks: (locale) => [
    {
      type: "text",
      title: locale === "ru" ? "Важно" : "Please note",
      paragraphs:
        locale === "ru"
          ? [
              "Калькуляторы используют общепринятые формулы: классификацию ИМТ ВОЗ, уравнение Миффлина — Сан Жеора, правило Негеле, метод ВМС США для процента жира. Каждая формула и её ограничения описаны на странице инструмента.",
              "Результаты справочные и не заменяют консультацию врача. Данные, которые вы вводите, никуда не отправляются — расчёт выполняется в браузере.",
            ]
          : [
              "The calculators use established formulas: the WHO BMI classification, the Mifflin–St Jeor equation, Naegele's rule and the US Navy body-fat method. Each tool page explains its formula and its limits.",
              "Results are for information only and are not medical advice. Nothing you enter is sent anywhere — everything is calculated in your browser.",
            ],
    },
  ],
});
