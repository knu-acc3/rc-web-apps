import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formatNumber } from "@/i18n/format";
import { allSections, sectionPaths } from "@/registry";
import { CATEGORIES } from "@/registry/categories";

/*
 * README.md has a block generated from the code: categories, their folders, sections and page counts. This test fails
 * when the block is out of date; `npm run docs` rewrites it (and the "актуален на" date) instead.
 */
const START = "<!-- auto:tools";
const END = "<!-- /auto:tools -->";
const n = (x: number) => formatNumber("ru", x);

function folderOf(id: string, category: string): string {
  if (existsSync(`src/tools/${category}/${id}`)) return `src/tools/${category}/`;
  if (existsSync(`src/site/${id}`)) return "src/site/";
  throw new Error(`no folder for section ${id}`);
}

function block(): string {
  const rows: string[] = [];
  let pages = 0;
  for (const c of CATEGORIES) {
    const sections = allSections().filter((s) => s.category === c.id);
    if (!sections.length) continue;
    const byFolder = new Map<string, { ids: string[]; pages: number }>();
    for (const s of sections) {
      const f = folderOf(s.id, c.id);
      const row = byFolder.get(f) ?? byFolder.set(f, { ids: [], pages: 0 }).get(f)!;
      row.ids.push(s.id);
      row.pages += sectionPaths(s).length;
    }
    for (const [folder, r] of byFolder) {
      const label = folder === "src/site/" ? "Служебные страницы (о сайте)" : c.name.ru;
      rows.push(`| ${label} | \`${folder}\` | ${r.ids.sort().join(", ")} | ${n(r.pages)} |`);
      pages += r.pages;
    }
  }
  return [
    `${START} — генерируется \`npm run docs\`, руками не править -->`,
    "| Категория на сайте | Папка | Разделы (папки внутри) | Страниц на язык |",
    "|---|---|---|---:|",
    ...rows,
    `| **Всего** | | ${allSections().length} разделов | **${n(pages)}** |`,
    END,
  ].join("\n");
}

describe("README.md", () => {
  it("has an up-to-date generated block (run `npm run docs` to refresh it)", () => {
    const readme = readFileSync("README.md", "utf8");
    const a = readme.indexOf(START);
    const b = readme.indexOf(END);
    expect(a, "README.md has no auto:tools block").toBeGreaterThanOrEqual(0);
    const current = readme.slice(a, b + END.length);
    const fresh = block();
    if (process.env.UPDATE_DOCS && current !== fresh) {
      const today = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }).replace(" г.", "");
      const next = (readme.slice(0, a) + fresh + readme.slice(b + END.length)).replace(/(Документ актуален на )[^.\n]+/, `$1${today}`);
      writeFileSync("README.md", next);
      return;
    }
    expect(current).toBe(fresh);
  });
});
