export const LOCALES = ["ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
/** Locale used for hreflang x-default. */
export const X_DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Text in every supported locale. */
export type L10n = Record<Locale, string>;
export type L10nList = Record<Locale, string[]>;

export function tr(text: L10n, locale: Locale): string {
  return text[locale] ?? text.ru;
}

export const LOCALE_LABEL: Record<Locale, string> = { ru: "Русский", en: "English" };
export const LOCALE_SHORT: Record<Locale, string> = { ru: "RU", en: "EN" };
export const OG_LOCALE: Record<Locale, string> = { ru: "ru_RU", en: "en_US" };
export const INTL_LOCALE: Record<Locale, string> = { ru: "ru-RU", en: "en-US" };

/** Build an absolute-path URL for a locale and path segments. */
export function href(locale: Locale, path: readonly string[] = []): string {
  const rest = path.filter(Boolean).join("/");
  return rest ? `/${locale}/${rest}` : `/${locale}`;
}
