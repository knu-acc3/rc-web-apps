import type { L10n, L10nList, Locale } from "@/i18n/config";

/** Home-page category that groups sections. */
export type CategoryId =
  | "files"
  | "text"
  | "symbols"
  | "time"
  | "calc"
  | "convert"
  | "random"
  | "dev"
  | "design"
  | "device"
  | "web";

export interface LinkItem {
  /** Path segments after the locale, e.g. ["convert", "km-to-miles"]. */
  path: string[];
  label: string;
  /** Optional second line / hint. */
  hint?: string;
  /** Large glyph shown instead of an icon (emoji, symbol, etc.). */
  glyph?: string;
  icon?: string;
  hue?: number;
}

export interface Crumb {
  name: string;
  path: string[];
}

export interface QA {
  q: string;
  a: string;
}

/** Server-rendered content blocks that sit under the tool. */
export type Block =
  | { type: "text"; title?: string; paragraphs: string[]; /** Collapsed under its title (long explanations). */ fold?: boolean }
  | { type: "list"; title?: string; ordered?: boolean; items: string[] }
  | { type: "facts"; title?: string; rows: [string, string][] }
  | { type: "table"; title?: string; head: string[]; rows: string[][]; caption?: string; mono?: boolean; /** Two half-tables side by side on wide screens. */ split?: boolean }
  | { type: "links"; title: string; items: LinkItem[]; style?: "chips" | "cards" | "glyphs"; more?: LinkItem }
  | { type: "glyphs"; title?: string; items: { glyph: string; label: string; path?: string[] }[] };

export interface ToolMount {
  /** Key in the tool component registry (src/tools/index.ts). */
  id: string;
  /** Serializable preset props passed to the tool component. */
  props?: Record<string, unknown>;
}

/** Page layout by task type (see src/registry/layouts.ts). */
export type PageLayout = "file" | "compute" | "screen" | "reference";

export interface PageModel {
  path: string[];
  sectionId: string;
  kind: "hub" | "tool" | "variant" | "entity" | "static";
  /** <title> without the brand suffix. */
  title: string;
  h1: string;
  description: string;
  /** One-line answer / summary under the H1. */
  lead?: string;
  breadcrumbs: Crumb[];
  tool?: ToolMount;
  /** Blocks rendered right after the tool (variants, siblings). */
  topBlocks?: Block[];
  /** Blocks rendered in the content area (facts, tables, text). */
  blocks?: Block[];
  howTo?: string[];
  faq?: QA[];
  related?: LinkItem[];
  /** Extra JSON-LD objects (Breadcrumb and WebApplication are added automatically). */
  jsonLd?: Record<string, unknown>[];
  /** Schema.org type of the main entity for tool pages. */
  schemaType?: "WebApplication" | "WebPage" | "CollectionPage" | "DefinedTerm";
  noindex?: boolean;
  /** Hide the H1 area (e.g. full-screen tools); H1 still rendered for SEO. */
  compactHeader?: boolean;
  /** Wide layout for tools that need the full container width. */
  wide?: boolean;
  /** Overrides the layout derived from the section. */
  layout?: PageLayout;
  icon?: string;
  hue?: number;
}

export interface SearchEntry {
  path: string[];
  title: string;
  /** Section name or short hint. */
  hint: string;
  keywords?: string;
  glyph?: string;
  /** Higher = shown first when scores tie. */
  weight?: number;
}

export interface SectionDef {
  id: string;
  name: L10n;
  /** Short description used in navigation. */
  description: L10n;
  icon: string;
  hue: number;
  category: CategoryId;
  /** Hidden from home page, menu and footer category lists. */
  hidden?: boolean;
  /** Order inside the category on the home page (lower first). */
  order?: number;
  /**
   * Absolute sections own several top-level URL segments (`mounts`), receive the full path in
   * `resolve` and return full paths from `paths`/`prebuild`. Prefixed sections (default) live
   * under `/{id}/…` and work with paths relative to the id.
   */
  absolute?: boolean;
  /** Top-level segments owned by an absolute section. */
  mounts?(): string[];
  /** Section landing page, or null when the section has none (navigation-only group). */
  hubPath?: string[] | null;
  /** Resolve a page. `rest` = segments after the id (prefixed) or all segments (absolute). */
  resolve(locale: Locale, rest: string[]): PageModel | null;
  /** All paths that exist (relative to the id for prefixed sections, full for absolute ones). */
  paths(): string[][];
  /** Paths prebuilt at build time; the rest are rendered on first request. Default: all. */
  prebuild?(): string[][];
  /** Entries for the search index. */
  search(locale: Locale): SearchEntry[];
  /** Highlighted links for the header menu and footer. */
  featured(locale: Locale): LinkItem[];
  /** Every tool of the section (no variants) for the home-page catalogue. Default: featured. */
  tools?(locale: Locale): LinkItem[];
}

/* ───────────── Declarative tool sections ───────────── */

export interface VariantDef {
  slug: string;
  /** Short label for chips. */
  name: L10n;
  title: L10n;
  h1?: L10n;
  description: L10n;
  lead?: L10n;
  props?: Record<string, unknown>;
  keywords?: L10nList;
  blocks?: (locale: Locale) => Block[];
  faq?: Record<Locale, QA[]>;
  glyph?: string;
  /** Include in search index (default true). */
  searchable?: boolean;
}

export interface ToolDef {
  /**
   * Top-level URL slug of the tool, unique across the whole site: the English form of the main
   * search query (e.g. "microphone-test", "merge-pdf", "word-counter"). "" = the tool lives at
   * `/{section id}` itself.
   */
  slug: string;
  /** Component key in src/tools/index.ts */
  component: string;
  icon: string;
  name: L10n;
  title: L10n;
  /**
   * Second half of titles that don't have one ("<query> | <seoAlt>"): another way people search for this tool,
   * e.g. "калькулятор сна по циклам"; a list gives shorter fallbacks for long titles. Defaults to the tool name.
   */
  seoAlt?: L10n | L10nList;
  h1?: L10n;
  description: L10n;
  lead?: L10n;
  keywords?: L10nList;
  props?: Record<string, unknown>;
  howTo?: L10nList;
  about?: L10nList;
  faq?: Record<Locale, QA[]>;
  /** Related pages as paths without locale: "merge-pdf", "timer/5-minutes", "convert/km-to-miles". */
  related?: string[];
  popular?: boolean;
  wide?: boolean;
  variants?: {
    title: L10n;
    list: () => VariantDef[];
    /** Number of variant chips shown on the tool page before "show all" (default 48). */
    limit?: number;
  };
  /** Extra blocks on the main tool page. */
  blocks?: (locale: Locale) => Block[];
}
