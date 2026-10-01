import type { Locale } from "@/i18n/config";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, LinkItem, SectionDef } from "@/registry/types";
import { braTool } from "./bra/tool";
import { clothingTool } from "./clothing/tool";
import { paperTool } from "./paper/tool";
import { ppiTool } from "./ppi/tool";
import { RATIO_BY_SLUG } from "./ratio/data";
import { ratioTool } from "./ratio/tool";
import { ringsTool } from "./rings/tool";
import { SCREENS, screenSlug, type ScreenRes } from "./screen/data";
import { nearestCommonRatio } from "./screen/engine";
import { screenTool } from "./screen/tool";
import { tt } from "./lib/shared";
import { shoesTool } from "./shoes/tool";
import { tvTool } from "./tv/tool";

const base = defineToolSection({
  id: "sizes",
  name: { ru: "Размеры", en: "Sizes" },
  description: {
    ru: "Форматы бумаги, размеры обуви, одежды и колец, разрешения экранов",
    en: "Paper formats, shoe, clothing and ring sizes, screen resolutions",
  },
  icon: "Shirt",
  hue: 40,
  category: "convert",
  order: 3,
  tools: [paperTool, shoesTool, clothingTool, ringsTool, braTool, screenTool, ratioTool, ppiTool, tvTool],
});

/* Small variant families (aspect ratios, TV sizes) get extra chips to related screen-resolution pages,
   so every variant page links to at least ~20 neighbours. */
const MIN_CHIPS = 20;
const TARGET_CHIPS = 26;

const screenChip = (s: ScreenRes): LinkItem => ({ path: [screenTool.slug, screenSlug(s)], label: `${s.w}×${s.h}` });
const bySlug = (slugs: string[]) => slugs.map((k) => SCREENS.find((s) => screenSlug(s) === k)).filter((s): s is ScreenRes => !!s);

function extraChips(tool: string, variant: string, have: number, locale: Locale): Block | null {
  const need = Math.max(0, TARGET_CHIPS - have);
  if (tool === ratioTool.slug) {
    const r = RATIO_BY_SLUG.get(variant);
    if (!r) return null;
    const label = `${r.w}:${r.h}`;
    const match = SCREENS.filter((s) => nearestCommonRatio(s.w, s.h)?.oriented === label);
    const rest = SCREENS.filter((s) => !match.includes(s));
    const items = [...match, ...rest].slice(0, Math.max(need, match.length)).map(screenChip);
    return { type: "links", style: "chips", title: tt(locale, "Разрешения экранов", "Screen resolutions"), items };
  }
  if (tool === tvTool.slug) {
    const tv = bySlug(["1280x720", "1366x768", "1920x1080", "3840x2160", "4096x2160", "7680x4320", "2560x1440", "5120x2880"]);
    return { type: "links", style: "chips", title: tt(locale, "Разрешения экранов", "Screen resolutions"), items: tv.slice(0, Math.max(need, 5)).map(screenChip) };
  }
  return null;
}

export const sizesSection: SectionDef = {
  ...base,
  resolve(locale, segs) {
    const page = base.resolve(locale, segs);
    if (page?.kind === "variant" && segs.length === 2) {
      const have = (page.topBlocks ?? []).reduce((n, b) => n + (b.type === "links" ? b.items.length : 0), 0);
      if (have < MIN_CHIPS) {
        const extra = extraChips(segs[0], segs[1], have, locale);
        if (extra) page.topBlocks = [...(page.topBlocks ?? []), extra];
      }
    }
    return page;
  },
};
