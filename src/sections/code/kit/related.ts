import type { L10n, Locale } from "@/i18n/config";
import type { LinkItem, SectionDef, ToolDef } from "@/registry/types";

/**
 * Cycle-safe "related" links between the developer tool pages.
 *
 * Why not ToolDef.related? The shared resolver fully resolves every target page,
 * including that page's own related links, so any cycle (A → B → A) recurses forever.
 * Here each section registers its tools' labels once at import time, and links are
 * built from that table at resolve time — no page is resolved to build a link.
 * Keys are page paths without locale ("json-formatter", "chmod-calculator/755").
 */
interface Meta {
  label: L10n;
  hint?: L10n;
  icon?: string;
  hue?: number;
}

const LINKS = new Map<string, Meta>();

/** Register the pages of a tool section (tool pages only) so other pages can link to them. */
export function registerTools(sectionId: string, hue: number, tools: readonly ToolDef[]): void {
  for (const t of tools) LINKS.set(t.slug || sectionId, { label: t.h1 ?? t.name, hint: t.lead ?? t.description, icon: t.icon, hue });
}

/** Register an arbitrary page (e.g. a variant) under its path key. */
export function registerLink(key: string, meta: Meta): void {
  LINKS.set(key, meta);
}

const missing = new Set<string>();

/** Keys that were referenced but never registered (checked by unit tests). */
export function missingRelated(): string[] {
  return [...missing];
}

export function relatedLinks(keys: readonly string[], locale: Locale): LinkItem[] {
  const out: LinkItem[] = [];
  for (const k of keys) {
    const m = LINKS.get(k);
    if (!m) {
      missing.add(k);
      continue;
    }
    out.push({ path: k.split("/"), label: m.label[locale], hint: m.hint?.[locale], icon: m.icon, hue: m.hue });
  }
  return out;
}

/**
 * Wrap a section so its tool/variant pages get extra related links (cycle-safe).
 * `keysFor(segs)` receives the full page path segments and returns related page keys.
 * The section's own links (siblings) keep up to `max - min(extra, 4)` places.
 */
export function withRelated(section: SectionDef, keysFor: (segs: string[]) => readonly string[], max = 8): SectionDef {
  return {
    ...section,
    resolve(locale, segs) {
      const page = section.resolve(locale, segs);
      if (!page || page.kind === "hub") return page;
      const own = page.related ?? [];
      const seen = new Set([page.path.join("/")]);
      const extra = relatedLinks(keysFor(page.path), locale).filter((l) => {
        const k = l.path.join("/");
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      const rest = own.filter((l) => !seen.has(l.path.join("/")));
      const keepOwn = Math.max(max - Math.min(extra.length, 4), 0);
      return { ...page, related: [...extra.slice(0, 4), ...rest.slice(0, keepOwn)].slice(0, max) };
    },
  };
}
