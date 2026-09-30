/**
 * Brand — the ONLY place where the site name, domain and contacts live.
 * Rename the site by editing `name` (and `shortName` / `domain` if needed).
 */
export const BRAND = {
  name: "RC Web App",
  shortName: "RC",
  domain: "rcwebapp.com",
  email: "hello@rcwebapp.com",
  tagline: {
    ru: "Онлайн-инструменты, которые работают прямо в браузере",
    en: "Online tools that work right in your browser",
  },
  /** Brand accent used in OG images, manifest and theme-color. */
  color: "#2952FF",
  /** Search engine verification codes (empty = not rendered). */
  verification: {
    google: "MAC5dCagquZqUeHrwagiZKVNfEExuqSaXBkTL12Tpgo",
    yandex: "d33fa0c3c4e6cdd4",
    bing: "",
  },
  /** Analytics ids (empty = disabled, nothing is loaded). */
  analytics: {
    yandexMetrika: "",
  },
} as const;

export const SITE_URL = `https://${BRAND.domain}`;

/** Monogram used by the logo mark and favicons: first letter of the brand. */
export const BRAND_MARK = BRAND.shortName.slice(0, 2).toUpperCase();
