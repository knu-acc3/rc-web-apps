import { it } from "vitest";
import { emojiSection } from "@/sections/emoji/section";

it("scratch", () => {
  for (const locale of ["ru", "en"] as const) {
    const pages = emojiSection.paths().map((p) => emojiSection.resolve(locale, p)!);
    const long = pages.filter((p) => p.description.length > 165).length;
    const short = pages.filter((p) => p.description.length < 115).length;
    const tl = pages.filter((p) => p.title.length > 65).length;
    console.log(locale, "desc>165", long, "desc<115", short, "title>65", tl);
    for (const k of ["", "red-heart", "grinning-face", "group/people-body", "subgroup/face-smiling", "topic/new-year", "family-man-woman-girl", "keycap-number-sign"]) {
      const p = emojiSection.resolve(locale, k ? k.split("/") : [])!;
      console.log(`${k}\n  T: ${p.title} (${p.title.length})\n  H: ${p.h1}\n  D: ${p.description} (${p.description.length})\n  L: ${p.lead}`);
    }
    console.log(pages.filter((p) => p.description.length < 115).slice(0, 5).map((p) => p.description));
  }
});
