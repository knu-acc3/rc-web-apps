import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { resolvePage } from "@/registry";
import { HANDOFF_TARGETS } from "@/tools/files/image/ui/handoff-targets";

describe("photo hand-off targets", () => {
  it("every target opens a photo tool page in every language", () => {
    for (const locale of LOCALES)
      for (const t of HANDOFF_TARGETS) {
        const page = resolvePage(locale, [t.slug]);
        expect(page, `${locale}/${t.slug}`).not.toBeNull();
        expect(page?.tool?.id, t.slug).toMatch(/^image\//);
        expect(t.label[locale].length).toBeGreaterThan(0);
      }
  });
  it("ids and slugs are unique", () => {
    expect(new Set(HANDOFF_TARGETS.map((t) => t.id)).size).toBe(HANDOFF_TARGETS.length);
    expect(new Set(HANDOFF_TARGETS.map((t) => t.slug)).size).toBe(HANDOFF_TARGETS.length);
  });
});
