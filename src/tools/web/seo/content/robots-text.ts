import type { Locale } from "@/i18n/config";
import type { Lint, LintCode } from "../lib/robots";

const LINT: Record<Locale, Record<LintCode, (t: string) => string>> = {
  ru: {
    noAgent: () => "Правило стоит до первой строки User-agent — роботы его проигнорируют",
    unknown: (t) => `Неизвестная директива «${t}» — Google её пропустит`,
    badPath: (t) => `Путь «${t}» должен начинаться с / или *`,
    crawlDelay: () => "Crawl-delay не поддерживают ни Google, ни Яндекс (с 2018 года) — скорость обхода настраивается в их вебмастерах",
    host: () => "Директива Host устарела: Яндекс перестал её учитывать в 2018 году, главное зеркало задаётся 301-редиректом",
    cleanParam: () => "Clean-param понимает только Яндекс; Google эту строку пропустит",
    relativeSitemap: (t) => `Sitemap должен быть полным адресом с https://, а не «${t}»`,
    noColon: (t) => `Строка без двоеточия: «${t}»`,
    tooBig: () => "Файл больше 500 КБ — Google прочитает только первые 500 КБ",
    emptyAgent: () => "Пустой User-agent — укажите имя робота или *",
    blockAll: () => "Disallow: / для всех роботов закрывает весь сайт от индексации",
  },
  en: {
    noAgent: () => "A rule appears before the first User-agent line — crawlers ignore it",
    unknown: (t) => `Unknown directive “${t}” — Google skips it`,
    badPath: (t) => `Path “${t}” must start with / or *`,
    crawlDelay: () => "Crawl-delay is ignored by Google (and by Yandex since 2018) — set the crawl rate in their webmaster tools",
    host: () => "Host is obsolete: Yandex stopped reading it in 2018; use a 301 redirect to the main mirror",
    cleanParam: () => "Clean-param is Yandex-only; Google skips this line",
    relativeSitemap: (t) => `Sitemap must be a full URL with https://, not “${t}”`,
    noColon: (t) => `Line without a colon: “${t}”`,
    tooBig: () => "The file is over 500 KiB — Google reads only the first 500 KiB",
    emptyAgent: () => "Empty User-agent — name a crawler or use *",
    blockAll: () => "Disallow: / for all crawlers blocks the whole site",
  },
};

export function lintText(locale: Locale, l: Lint): string {
  const prefix = l.line ? (locale === "ru" ? `Строка ${l.line}: ` : `Line ${l.line}: `) : "";
  return prefix + LINT[locale][l.code](l.text);
}
