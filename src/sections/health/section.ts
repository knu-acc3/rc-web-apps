import { defineToolSection } from "@/registry/tool-section";
import { guardSection } from "../calc/kit/section-guard";
import * as body from "./group-body";
import * as cycle from "./group-cycle";

/** Navigation group only (no landing page). */
const tools = [...body.tools, ...cycle.tools];

export const healthSection = guardSection(
  defineToolSection({
    id: "health",
    name: { ru: "Здоровье", en: "Health" },
    description: {
      ru: "ИМТ, калории и БЖУ, процент жира, срок беременности и овуляция, фазы сна, норма воды и пульсовые зоны",
      en: "BMI, calories and macros, body fat, pregnancy due date and ovulation, sleep cycles, water intake and heart-rate zones",
    },
    icon: "HeartPulse",
    hue: 350,
    category: "calc",
    order: 3,
    tools,
  }),
  tools,
);
