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
  | { type: "text"; title?: string; paragraphs: string[] }
  | { type: "list"; title?: string; ordered?: boolean; items: string[] }
  | { type: "facts"; title?: string; rows: [string, string][] }
  | { type: "table"; title?: string; head: string[]; rows: string[][]; caption?: string; mono?: boolean }
  | { type: "links"; title: string; items: LinkItem[]; style?: "chips" | "cards" | "glyphs"; more?: LinkItem }
  | { type: "glyphs"; title?: string; items: { glyph: string; label: string; path?: string[] }[] };

export interface ToolMount {
  /** Key in the tool component registry (src/tools/index.ts). */
  id: string;
  /** Serializable preset props passed to the tool component. */
  props?: Record<string, unknown>;
}

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
  /** Short description used on hub cards and the section page. */
  description: L10n;
  icon: string;
  hue: number;
  category: CategoryId;
  /** Hidden from home page, menu and footer category lists. */
  hidden?: boolean;
  /** Order inside the category on the home page (lower first). */
  order?: number;
  /** Resolve a page. `rest` = path segments after the section id. */
  resolve(locale: Locale, rest: string[]): PageModel | null;
  /** All paths (after the section id) that exist, including [] for the section root. */
  paths(): string[][];
  /** Paths prebuilt at build time; the rest are rendered on first request. Default: all. */
  prebuild?(): string[][];
  /** Entries for the search index. */
  search(locale: Locale): SearchEntry[];
  /** Highlighted links for the home page / mega menu. */
  featured(locale: Locale): LinkItem[];
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
  /** URL slug inside the section; "" = the section root page is this tool. */
  slug: string;
  /** Component key in src/tools/index.ts */
  component: string;
  icon: string;
  name: L10n;
  title: L10n;
  h1?: L10n;
  description: L10n;
  lead?: L10n;
  keywords?: L10nList;
  props?: Record<string, unknown>;
  howTo?: L10nList;
  about?: L10nList;
  faq?: Record<Locale, QA[]>;
  /** Related tools as "section/slug" or "section" keys. */
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
