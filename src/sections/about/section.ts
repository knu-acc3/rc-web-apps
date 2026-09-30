import { BRAND } from "@/config/brand";
import { tr, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import type { PageModel, SectionDef } from "@/registry/types";

type Doc = { title: Record<Locale, string>; description: Record<Locale, string>; body: Record<Locale, string[]> };

const DOCS: Record<string, Doc> = {
  "": {
    title: { ru: `О сайте ${BRAND.name}`, en: `About ${BRAND.name}` },
    description: {
      ru: `${BRAND.name} — набор бесплатных онлайн-инструментов, которые работают прямо в браузере, без регистрации и без загрузки файлов на сервер.`,
      en: `${BRAND.name} is a collection of free online tools that run right in your browser — no sign-up and no file uploads.`,
    },
    body: {
      ru: [
        `${BRAND.name} — это сотни небольших инструментов для повседневных задач: работа с PDF и изображениями, конвертеры единиц, калькуляторы, таймеры и мировое время, символы и эмодзи, инструменты для разработчиков.`,
        "Все вычисления выполняются на вашем устройстве. Файлы, которые вы открываете в инструментах, не отправляются на сервер — поэтому инструменты работают быстро и безопасно даже с конфиденциальными документами.",
        "Сайт бесплатный и не требует регистрации. Если вы нашли ошибку или хотите предложить инструмент, напишите нам: " + BRAND.email + ".",
      ],
      en: [
        `${BRAND.name} offers hundreds of small tools for everyday tasks: PDF and image utilities, unit converters, calculators, timers and world time, symbols and emoji, developer tools.`,
        "All processing happens on your device. Files you open in the tools are never uploaded to a server, so the tools are fast and safe even for confidential documents.",
        "The site is free and requires no account. Found a bug or want to suggest a tool? Write to " + BRAND.email + ".",
      ],
    },
  },
  privacy: {
    title: { ru: "Политика конфиденциальности", en: "Privacy policy" },
    description: {
      ru: `Как ${BRAND.name} обращается с данными: инструменты работают в браузере, файлы не загружаются на сервер.`,
      en: `How ${BRAND.name} handles data: tools run in your browser and files are never uploaded.`,
    },
    body: {
      ru: [
        "Инструменты сайта работают локально в вашем браузере. Тексты, файлы, изображения и документы, которые вы обрабатываете, не передаются на наши серверы и не сохраняются нами.",
        "Некоторые настройки (тема оформления, недавно открытые инструменты, заметки и списки задач) хранятся только в локальном хранилище вашего браузера. Вы можете удалить их, очистив данные сайта в браузере.",
        "Сервер сайта, как и любой веб-сервер, может вести технические журналы запросов (IP-адрес, адрес страницы, время) для обеспечения работы и защиты от злоупотреблений. Эти данные не используются для идентификации пользователей.",
        "Если на сайте включена веб-аналитика, она собирает обезличенную статистику посещений. Сторонние рекламные трекеры не используются.",
        "По вопросам конфиденциальности пишите: " + BRAND.email + ".",
      ],
      en: [
        "The tools on this site run locally in your browser. Texts, files, images and documents you process are not sent to our servers and are not stored by us.",
        "Some preferences (theme, recently used tools, notes and to-do lists) are stored only in your browser's local storage. You can remove them by clearing site data in your browser.",
        "Like any web server, our server may keep technical request logs (IP address, page URL, time) to operate the service and prevent abuse. This data is not used to identify users.",
        "If web analytics is enabled, it collects anonymous visit statistics. No third-party advertising trackers are used.",
        "Privacy questions: " + BRAND.email + ".",
      ],
    },
  },
  terms: {
    title: { ru: "Условия использования", en: "Terms of use" },
    description: {
      ru: `Условия использования бесплатных онлайн-инструментов ${BRAND.name}.`,
      en: `Terms of use for the free online tools of ${BRAND.name}.`,
    },
    body: {
      ru: [
        "Инструменты предоставляются бесплатно и «как есть». Мы стараемся, чтобы результаты были точными, но не гарантируем отсутствие ошибок.",
        "Результаты калькуляторов (финансовых, медицинских и других) носят справочный характер и не заменяют консультацию специалиста.",
        "Вы несёте ответственность за файлы и данные, которые обрабатываете с помощью инструментов, и за соблюдение прав третьих лиц.",
        "Мы можем изменять и дополнять инструменты и эти условия без предварительного уведомления.",
      ],
      en: [
        "The tools are provided free of charge and “as is”. We strive for accurate results but do not guarantee they are error-free.",
        "Results of calculators (financial, health and others) are for reference only and do not replace professional advice.",
        "You are responsible for the files and data you process with the tools and for respecting third-party rights.",
        "We may change the tools and these terms without prior notice.",
      ],
    },
  },
};

export const aboutSection: SectionDef = {
  id: "about",
  name: { ru: "О сайте", en: "About" },
  description: { ru: "Информация о сайте", en: "About the site" },
  icon: "Info",
  hue: 220,
  category: "web",
  order: 999,
  hidden: true,
  paths: () => Object.keys(DOCS).map((k) => (k ? [k] : [])),
  search: () => [],
  featured: () => [],
  resolve(locale, rest): PageModel | null {
    if (rest.length > 1) return null;
    const key = rest[0] ?? "";
    const doc = DOCS[key];
    if (!doc) return null;
    const t = ui(locale);
    const crumbs: { name: string; path: string[] }[] = [{ name: t.home, path: [] }];
    if (key) crumbs.push({ name: tr(DOCS[""].title, locale), path: ["about"] });
    return {
      path: key ? ["about", key] : ["about"],
      sectionId: "about",
      kind: "static",
      title: tr(doc.title, locale),
      h1: tr(doc.title, locale),
      description: tr(doc.description, locale),
      breadcrumbs: crumbs,
      blocks: [{ type: "text", paragraphs: doc.body[locale] }],
      schemaType: "WebPage",
    };
  },
};
