import type { L10n, Locale } from "@/i18n/config";
import type { LinkItem, SectionDef } from "@/registry/types";

/**
 * Cross-section "related" links built from static metadata.
 *
 * Why not ToolDef.related? The shared related-link resolver fully resolves every
 * target page, including that page's own related links, so any cycle between pages
 * (A → B → A, also across sections) recurses forever. These links never resolve
 * other pages, so they are cycle-safe. Paths must exist (section roots always do).
 */
const SECTION_META: Record<string, { name: L10n; icon: string; hue: number }> = {
  code: { name: { ru: "Форматирование кода", en: "Code formatters" }, icon: "Braces", hue: 255 },
  data: { name: { ru: "Конвертеры данных", en: "Data converters" }, icon: "FileJson", hue: 235 },
  regex: { name: { ru: "Регулярные выражения", en: "Regex" }, icon: "Regex", hue: 245 },
  cron: { name: { ru: "Cron-выражения", en: "Cron expressions" }, icon: "Clock3", hue: 205 },
  encode: { name: { ru: "Кодирование", en: "Encoding" }, icon: "Binary", hue: 190 },
  hash: { name: { ru: "Хэши", en: "Hashes" }, icon: "Fingerprint", hue: 280 },
  uuid: { name: { ru: "UUID и ID", en: "UUID & IDs" }, icon: "KeyRound", hue: 170 },
  dev: { name: { ru: "Утилиты разработчика", en: "Developer utilities" }, icon: "Terminal", hue: 215 },
  random: { name: { ru: "Случайный выбор", en: "Random" }, icon: "Dices", hue: 300 },
  password: { name: { ru: "Пароли", en: "Passwords" }, icon: "Lock", hue: 120 },
  text: { name: { ru: "Текст", en: "Text tools" }, icon: "Type", hue: 160 },
  date: { name: { ru: "Даты", en: "Date calculators" }, icon: "CalendarClock", hue: 225 },
  time: { name: { ru: "Мировое время", en: "World time" }, icon: "Globe", hue: 195 },
  css: { name: { ru: "CSS-генераторы", en: "CSS generators" }, icon: "Paintbrush", hue: 270 },
  "http-status": { name: { ru: "HTTP-коды", en: "HTTP status codes" }, icon: "Server", hue: 200 },
  mime: { name: { ru: "MIME-типы", en: "MIME types" }, icon: "FileCode", hue: 220 },
  network: { name: { ru: "IP и сети", en: "IP & networks" }, icon: "Router", hue: 200 },
  validate: { name: { ru: "Проверка данных", en: "Validators" }, icon: "BadgeCheck", hue: 140 },
  numbers: { name: { ru: "Числа", en: "Numbers" }, icon: "Hash", hue: 20 },
  qr: { name: { ru: "QR-коды и штрихкоды", en: "QR codes & barcodes" }, icon: "QrCode", hue: 0 },
  seo: { name: { ru: "SEO-инструменты", en: "SEO tools" }, icon: "Search", hue: 100 },
  file: { name: { ru: "Файлы и архивы", en: "Files & archives" }, icon: "FileArchive", hue: 30 },
  color: { name: { ru: "Цвета", en: "Colors" }, icon: "Palette", hue: 330 },
};

/** A related entry: a section id, or an explicit link to a page of one of the developer sections. */
export type RelatedRef = string | { path: string[]; label: L10n; hint?: L10n };

export function relatedLinks(refs: readonly RelatedRef[], locale: Locale): LinkItem[] {
  const out: LinkItem[] = [];
  for (const r of refs) {
    if (typeof r === "string") {
      const m = SECTION_META[r];
      if (m) out.push({ path: [r], label: m.name[locale], icon: m.icon, hue: m.hue });
    } else {
      const m = SECTION_META[r.path[0]];
      out.push({ path: r.path, label: r.label[locale], hint: r.hint?.[locale], icon: m?.icon, hue: m?.hue });
    }
  }
  return out;
}

/**
 * Wrap a section so tool/variant pages get cycle-safe cross-section related links.
 * `refsFor(rest)` returns the refs for the page at /<section>/<...rest>.
 * Own-section links (siblings) produced by the section come first.
 */
export function withRelated(section: SectionDef, refsFor: (rest: string[]) => readonly RelatedRef[], max = 8): SectionDef {
  return {
    ...section,
    resolve(locale, rest) {
      const page = section.resolve(locale, rest);
      if (!page || page.kind === "hub") return page;
      const own = page.related ?? [];
      const seen = new Set(own.map((l) => l.path.join("/")));
      seen.add(page.path.join("/"));
      const extra = relatedLinks(refsFor(rest), locale).filter((l) => !seen.has(l.path.join("/")));
      const keepOwn = Math.max(max - Math.min(extra.length, 4), 0);
      return { ...page, related: [...own.slice(0, keepOwn), ...extra].slice(0, max) };
    },
  };
}
