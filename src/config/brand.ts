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
  /** Logo colour (src/site/logo-mark.ts), used by OG images and the web app manifest. */
  color: "#FF6B00",
  /** Who made the site: credited in the footer of every page. */
  author: { name: "rc-web.kz", url: "https://rc-web.kz" },
  /** Search engine verification codes (empty = not rendered). */
  verification: {
    google: "MAC5dCagquZqUeHrwagiZKVNfEExuqSaXBkTL12Tpgo",
    yandex: "d33fa0c3c4e6cdd4",
    bing: "",
  },
  /** IndexNow key (Yandex, Bing): public/{key}.txt must contain it. Submit changed pages with `npm run indexnow`. */
  indexNowKey: "62f5dd069e5b09dede0cd1c809e96580",
  /** Analytics ids (empty = disabled, nothing is loaded). */
  analytics: {
    yandexMetrika: "",
  },
} as const;

export const SITE_URL = `https://${BRAND.domain}`;
