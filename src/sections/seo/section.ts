import type { Locale } from "@/i18n/config";
import { defineToolSection } from "@/registry/tool-section";
import type { Block } from "@/registry/types";
import { REDIRECT_VARIANTS, ROBOTS_VARIANTS, UTM_VARIANTS } from "./texts";
import { SCHEMA_VARIANTS } from "./texts-schema";

const t = (l: Locale, ru: string, en: string) => (l === "ru" ? ru : en);

function directivesTable(l: Locale): Block {
  return {
    type: "table",
    title: t(l, "Директивы robots.txt", "robots.txt directives"),
    head: t(l, "Директива|Что делает|Кто понимает", "Directive|What it does|Supported by").split("|"),
    rows: [
      ["User-agent", t(l, "начинает группу правил для робота или * для всех", "starts a group for a crawler, or * for all"), t(l, "все", "all")],
      ["Disallow", t(l, "запрещает обход путей, начинающихся с указанного", "blocks paths starting with the value"), t(l, "все", "all")],
      ["Allow", t(l, "разрешает путь внутри закрытого раздела", "allows a path inside a blocked section"), t(l, "Google, Яндекс, Bing", "Google, Bing, Yandex")],
      ["Sitemap", t(l, "полный адрес карты сайта", "full URL of the sitemap"), t(l, "Google, Яндекс, Bing", "Google, Bing, Yandex")],
      ["Clean-param", t(l, "параметры, которые не меняют содержимое", "parameters that don't change content"), t(l, "только Яндекс", "Yandex only")],
      ["Crawl-delay", t(l, "пауза между запросами", "delay between requests"), t(l, "Bing; Google и Яндекс игнорируют", "Bing; ignored by Google and Yandex")],
    ],
  };
}

function limitsTable(l: Locale): Block {
  return {
    type: "table",
    title: t(l, "Сколько символов показывает Google (примерно)", "How much Google shows (approximately)"),
    head: t(l, "Элемент|Компьютер|Телефон", "Element|Desktop|Mobile").split("|"),
    rows: [
      ["Title", t(l, "≈600 px — 50–60 символов", "≈600 px — 50–60 characters"), t(l, "до двух строк, ≈70–78 символов", "up to two lines, ≈70–78 characters")],
      ["Description", t(l, "≈920 px — 150–160 символов", "≈920 px — 150–160 characters"), t(l, "≈680 px — около 120 символов", "≈680 px — about 120 characters")],
    ],
  };
}

export const seoSection = defineToolSection({
  id: "seo",
  name: { ru: "SEO-инструменты", en: "SEO tools" },
  description: {
    ru: "Мета-теги, robots.txt, sitemap, UTM, микроразметка и превью сниппета",
    en: "Meta tags, robots.txt, sitemap, UTM, schema markup and snippet preview",
  },
  icon: "Search",
  hue: 100,
  category: "web",
  order: 5,
  tools: [
    {
      slug: "meta-tag-generator",
      component: "seo/meta",
      icon: "Tags",
      popular: true,
      name: { ru: "Генератор мета-тегов", en: "Meta tag generator" },
      title: { ru: "Генератор мета-тегов title и description с превью в Google", en: "Meta Tag Generator | Google SERP preview" },
      h1: { ru: "Генератор мета-тегов с превью сниппета", en: "Meta tag generator with SERP preview" },
      description: {
        ru: "Напишите title и description и сразу увидите сниппет, как в Google: ширина в пикселях, место обрезки, готовый HTML с canonical и robots. Для компьютера и телефона.",
        en: "Write a title and meta description and see the Google snippet instantly: pixel width, where it gets cut, and ready HTML with canonical and robots tags.",
      },
      lead: { ru: "Title обрезается не по символам, а по ширине: около 600 px на компьютере. Здесь видно, где именно.", en: "Titles are cut by pixel width, not characters — about 600 px on desktop. See exactly where." },
      keywords: { ru: ["генератор мета тегов", "проверка длины title", "превью сниппета google"], en: ["meta tag generator", "serp preview", "title length checker"] },
      howTo: {
        ru: ["Введите title — главный заголовок страницы для поисковиков.", "Добавьте description — описание, которое может попасть в сниппет.", "Следите за полосками ширины: зелёная — помещается, красная — будет обрезано.", "Скопируйте HTML в раздел <head> страницы."],
        en: ["Type the title — the page's main heading for search engines.", "Add a meta description that may appear in the snippet.", "Watch the width bars: green fits, red will be truncated.", "Copy the HTML into the page's <head>."],
      },
      about: {
        ru: [
          "Google обрезает заголовок по ширине в пикселях, поэтому «ШИРОКИЕ» заглавные буквы съедают место быстрее строчных, а «ш» шире «i». Генератор измеряет текст тем же шрифтом Arial, что и выдача, и показывает, где встанет многоточие.",
          "Google может переписать title и выбрать другой фрагмент текста вместо description — особенно если описание не отвечает на запрос. Лучший способ этого избежать — уникальные, конкретные title и description для каждой страницы.",
        ],
        en: [
          "Google cuts titles by pixel width, so CAPITALS use up space faster than lower case and “w” is wider than “i”. The generator measures text in Arial like the results page and shows where the ellipsis will land.",
          "Google may rewrite titles and pick other text instead of your description — especially if it doesn't answer the query. Unique, specific titles and descriptions for each page are the best defence.",
        ],
      },
      faq: {
        ru: [
          { q: "Какой длины должен быть title?", a: "До ~600 px — обычно 50–60 символов. Главное слово ставьте ближе к началу: так оно не пропадёт при обрезке." },
          { q: "Влияет ли description на позиции?", a: "Напрямую — нет, но хорошее описание повышает кликабельность сниппета, а это косвенно помогает." },
          { q: "Нужен ли meta keywords?", a: "Нет, Google и Яндекс давно не учитывают его при ранжировании." },
        ],
        en: [
          { q: "How long should a title be?", a: "Up to ~600 px — usually 50–60 characters. Put the key phrase near the start so it survives truncation." },
          { q: "Does the description affect rankings?", a: "Not directly, but a good description raises click-through, which helps indirectly." },
          { q: "Do I need meta keywords?", a: "No, Google and Bing ignore it for ranking." },
        ],
      },
      blocks: (l) => [limitsTable(l)],
    },
    {
      slug: "open-graph-generator",
      component: "seo/og",
      icon: "Share2",
      name: { ru: "Генератор Open Graph", en: "Open Graph generator" },
      title: { ru: "Генератор Open Graph — превью ссылки в соцсетях", en: "Open Graph Generator — Preview Links in Social Media" },
      h1: { ru: "Генератор Open Graph и превью ссылки", en: "Open Graph generator and link preview" },
      description: {
        ru: "Создайте мета-теги Open Graph и Twitter Card и посмотрите, как ссылка будет выглядеть в Telegram, WhatsApp, Facebook, X и VK. Проверка размеров картинки 1200×630.",
        en: "Create Open Graph and Twitter Card meta tags and see how your link looks in Telegram, WhatsApp, Facebook, X and VK. Checks the image against the 1200×630 standard.",
      },
      lead: { ru: "Заголовок, описание и картинка для превью ссылки — с предпросмотром для популярных мессенджеров и соцсетей.", en: "Title, description and image for link previews — with a preview for popular messengers and social networks." },
      keywords: { ru: ["генератор open graph", "og теги", "превью ссылки telegram"], en: ["open graph generator", "og tags generator", "link preview"] },
      howTo: {
        ru: ["Заполните заголовок, описание и адрес страницы.", "Укажите полный адрес картинки 1200×630 и, если хотите, выберите файл для предпросмотра.", "Переключайте площадки и проверьте превью.", "Скопируйте теги в <head>."],
        en: ["Fill in the title, description and page URL.", "Enter the full URL of a 1200×630 image and optionally pick the file to preview.", "Switch platforms to check the preview.", "Copy the tags into <head>."],
      },
      about: {
        ru: [
          "Мессенджеры и соцсети читают теги og:title, og:description и og:image, когда кто-то делится ссылкой. X (Twitter) использует те же теги, если нет отдельных twitter:*, — достаточно добавить twitter:card.",
          "Превью кэшируются. После изменения тегов обновите их: в Telegram — через бота @WebpageBot, в Facebook — в Sharing Debugger.",
        ],
        en: [
          "Messengers and social networks read og:title, og:description and og:image when a link is shared. X (Twitter) falls back to the same tags when twitter:* ones are missing — adding twitter:card is enough.",
          "Previews are cached. After changing tags, refresh them: in Telegram via @WebpageBot, in Facebook via the Sharing Debugger.",
        ],
      },
      faq: {
        ru: [
          { q: "Какой размер картинки нужен?", a: "1200×630 px (1,91:1) — универсальный вариант для Facebook, Telegram, VK и X. Важное держите в центре: края могут обрезаться." },
          { q: "Почему превью не обновилось?", a: "Соцсети кэшируют превью. Сбросьте кэш через @WebpageBot в Telegram или Sharing Debugger в Facebook." },
        ],
        en: [
          { q: "What image size do I need?", a: "1200×630 px (1.91:1) works for Facebook, Telegram, VK and X. Keep key content centred as edges may be cropped." },
          { q: "Why didn't the preview update?", a: "Networks cache previews. Refresh via @WebpageBot in Telegram or the Sharing Debugger in Facebook." },
        ],
      },
    },
    {
      slug: "robots-txt-generator",
      component: "seo/robots",
      icon: "Bot",
      popular: true,
      name: { ru: "Генератор robots.txt", en: "Robots.txt generator" },
      title: { ru: "Генератор robots.txt онлайн — шаблоны для CMS", en: "Robots.txt Generator — Templates for Popular CMS" },
      h1: { ru: "Генератор robots.txt", en: "Robots.txt generator" },
      description: {
        ru: "Создайте robots.txt за минуту: шаблоны для WordPress, 1С-Битрикс, OpenCart, Joomla и MODX, запрет для AI-ботов, sitemap и проверка ошибок. Скачайте готовый файл.",
        en: "Build a robots.txt in a minute: templates for WordPress, 1C-Bitrix, OpenCart, Joomla and MODX, AI-crawler blocking, sitemap and error checks. Download the file.",
      },
      lead: { ru: "Выберите шаблон, добавьте sitemap и свои пути — файл проверяется на ошибки по ходу.", en: "Pick a template, add your sitemap and paths — the file is checked for errors as you go." },
      keywords: { ru: ["генератор robots.txt", "создать robots.txt", "robots txt онлайн"], en: ["robots.txt generator", "create robots.txt", "robots txt builder"] },
      howTo: {
        ru: ["Выберите шаблон под свою CMS или «Открыть весь сайт».", "Укажите адрес sitemap.xml.", "При необходимости закройте дополнительные разделы и AI-ботов.", "Скачайте robots.txt и загрузите в корень сайта."],
        en: ["Pick a template for your CMS or “Allow everything”.", "Enter your sitemap.xml URL.", "Block extra sections or AI crawlers if needed.", "Download robots.txt and upload it to the site root."],
      },
      about: {
        ru: [
          "robots.txt управляет обходом, а не индексацией: закрытая страница может попасть в выдачу без описания, если на неё ссылаются. Чтобы убрать страницу из поиска, используйте meta robots noindex и не закрывайте её в robots.txt.",
          "Не закрывайте CSS, JS и картинки: Google отрисовывает страницы как браузер, и без стилей и скриптов может неправильно оценить их содержание и адаптивность.",
        ],
        en: [
          "robots.txt controls crawling, not indexing: a blocked page can still appear without a snippet if others link to it. To remove a page from search, use meta robots noindex and don't block it in robots.txt.",
          "Don't block CSS, JS or images: Google renders pages like a browser and may misjudge content and mobile-friendliness without them.",
        ],
      },
      faq: {
        ru: [
          { q: "Где должен лежать robots.txt?", a: "Строго в корне домена: https://example.com/robots.txt. Для каждого поддомена — свой файл." },
          { q: "Нужна ли директива Host?", a: "Нет. Яндекс перестал её учитывать в 2018 году — главное зеркало определяется 301-редиректом." },
          { q: "Как проверить, что нужная страница не закрыта?", a: "Вставьте файл и адрес в проверку robots.txt — она покажет, какое правило срабатывает для выбранного робота." },
        ],
        en: [
          { q: "Where does robots.txt go?", a: "At the domain root: https://example.com/robots.txt. Each subdomain needs its own file." },
          { q: "Should I block admin pages?", a: "Usually yes — but remember robots.txt is public, so don't list secret URLs in it; protect them with authentication." },
          { q: "How do I check a page isn't blocked?", a: "Paste the file and URL into the robots.txt tester — it shows which rule applies for the chosen crawler." },
        ],
      },
      variants: { title: { ru: "Шаблоны robots.txt", en: "robots.txt templates" }, list: () => ROBOTS_VARIANTS },
      blocks: (l) => [directivesTable(l)],
    },
    {
      slug: "robots-txt-tester",
      component: "seo/robots-tester",
      icon: "ShieldCheck",
      name: { ru: "Проверка robots.txt", en: "Robots.txt tester" },
      title: { ru: "Проверка robots.txt — закрыт ли URL от индексации", en: "Robots.txt Tester — Check if a URL Is Blocked" },
      h1: { ru: "Проверка robots.txt", en: "Robots.txt tester" },
      description: {
        ru: "Проверьте, разрешён ли адрес для Googlebot, YandexBot, Bingbot или GPTBot: какое правило срабатывает, с учётом * и $, самого длинного совпадения и приоритета Allow.",
        en: "Check whether a URL is allowed for Googlebot, Bingbot, YandexBot or GPTBot: see which rule wins, with * and $ wildcards, longest-match precedence and Allow on ties.",
      },
      lead: { ru: "Вставьте robots.txt и адрес — сразу видно, разрешён ли обход и какая строка это решает.", en: "Paste robots.txt and a URL — see instantly whether crawling is allowed and which line decides." },
      keywords: { ru: ["проверка robots.txt", "проверить robots txt", "закрыта ли страница от индексации"], en: ["robots.txt tester", "robots.txt checker", "is url blocked by robots.txt"] },
      howTo: {
        ru: ["Вставьте содержимое robots.txt (откройте https://сайт/robots.txt и скопируйте).", "Введите адрес или путь страницы.", "Выберите робота — вердикт и сработавшее правило появятся сразу."],
        en: ["Paste the robots.txt contents (open https://site/robots.txt and copy it).", "Enter the page URL or path.", "Choose a crawler — the verdict and the matching rule appear instantly."],
      },
      about: {
        ru: [
          "Проверка следует стандарту RFC 9309 и документации Google: группы одного робота объединяются, выбирается самая конкретная группа (Googlebot-Image без своей группы подчиняется Googlebot), побеждает самое длинное совпавшее правило, а при равной длине — Allow. Кириллица и %-кодировка приводятся к одному виду.",
        ],
        en: [
          "The tester follows RFC 9309 and Google's documentation: groups for the same crawler are merged, the most specific group wins (Googlebot-Image without its own group follows Googlebot), the longest matching rule wins and Allow wins ties. Non-ASCII characters and %-escapes are normalised.",
        ],
      },
      faq: {
        ru: [
          { q: "Почему правило Allow не сработало?", a: "Скорее всего, есть более длинное правило Disallow: побеждает не порядок строк, а длина совпадения." },
          { q: "Отличается ли логика Яндекса?", a: "Яндекс тоже выбирает самое длинное совпадение и отдаёт приоритет Allow при равенстве, так что результат обычно совпадает." },
        ],
        en: [
          { q: "Why didn't my Allow rule win?", a: "Probably a longer Disallow matches: precedence is by match length, not line order." },
          { q: "Does Bing behave the same?", a: "Bing also uses the most specific (longest) match, so results usually agree." },
        ],
      },
    },
    {
      slug: "sitemap-generator",
      component: "seo/sitemap",
      icon: "Network",
      name: { ru: "Генератор sitemap.xml", en: "Sitemap generator" },
      title: { ru: "Генератор sitemap.xml из списка ссылок", en: "Sitemap Generator — Create sitemap.xml from a URL List" },
      h1: { ru: "Генератор sitemap.xml", en: "Sitemap.xml generator" },
      description: {
        ru: "Создайте sitemap.xml из списка адресов или файла: экранирование, кодирование кириллицы, удаление дублей, разбивка по 50 000 адресов с индексом.",
        en: "Create sitemap.xml from a list of URLs or a file: escaping, encoding of non-Latin URLs, duplicate removal and splitting at 50,000 URLs with an index.",
      },
      lead: { ru: "Вставьте ссылки — получите корректный sitemap.xml; для больших сайтов — архив с частями и индексом.", en: "Paste your links and get a valid sitemap.xml; big sites get an archive with parts and an index." },
      keywords: { ru: ["генератор sitemap", "создать sitemap xml", "карта сайта xml онлайн"], en: ["sitemap generator", "xml sitemap generator", "create sitemap.xml"] },
      howTo: {
        ru: ["Вставьте адреса по одному на строку или перетащите TXT/CSV.", "При необходимости задайте lastmod.", "Скачайте sitemap.xml (или ZIP с частями и индексом).", "Загрузите файл на сайт и укажите его в robots.txt и вебмастерах."],
        en: ["Paste URLs one per line or drop a TXT/CSV file.", "Optionally set lastmod.", "Download sitemap.xml (or a ZIP with parts and an index).", "Upload it and reference it in robots.txt and Search Console."],
      },
      about: {
        ru: [
          "Один файл sitemap вмещает до 50 000 адресов и 50 МБ. Если больше, генератор разбивает список на sitemap-1.xml, sitemap-2.xml… и создаёт sitemap_index.xml — его и нужно указывать в robots.txt.",
          "Адреса с кириллицей и пробелами кодируются, домены .рф переводятся в punycode, символы & < > экранируются. Все адреса должны быть с одного сайта и отдавать код 200 — перенаправления и страницы с noindex в карту не включайте.",
        ],
        en: [
          "One sitemap holds up to 50,000 URLs and 50 MB. Above that the generator splits the list into sitemap-1.xml, sitemap-2.xml… and builds a sitemap_index.xml — reference that one in robots.txt.",
          "Non-Latin characters and spaces are percent-encoded, IDN domains converted to punycode and & < > escaped. All URLs should belong to one site and return 200 — leave out redirects and noindex pages.",
        ],
      },
      faq: {
        ru: [
          { q: "Нужны ли changefreq и priority?", a: "Google их игнорирует, Яндекс учитывает слабо. Честный lastmod полезнее — если он соответствует реальным изменениям." },
          { q: "Как сообщить поисковикам о sitemap?", a: "Добавьте строку Sitemap: https://сайт/sitemap.xml в robots.txt и отправьте карту в Google Search Console и Яндекс Вебмастер." },
        ],
        en: [
          { q: "Do I need changefreq and priority?", a: "Google ignores both. An accurate lastmod is more useful — if it reflects real changes." },
          { q: "How do I tell search engines about it?", a: "Add Sitemap: https://site/sitemap.xml to robots.txt and submit it in Google Search Console and Bing Webmaster Tools." },
        ],
      },
    },
    {
      slug: "hreflang-generator",
      component: "seo/hreflang",
      icon: "Languages",
      name: { ru: "Генератор hreflang", en: "Hreflang generator" },
      title: { ru: "Генератор hreflang — разметка языковых версий", en: "Hreflang Tag Generator and Validator" },
      h1: { ru: "Генератор hreflang", en: "Hreflang tag generator" },
      description: {
        ru: "Создайте теги hreflang для языковых и региональных версий страницы: HTML, HTTP-заголовок или sitemap. Проверка кодов (en-GB, а не en-UK), дублей и x-default.",
        en: "Create hreflang annotations for language and regional versions of a page: HTML, HTTP header or sitemap. Validates codes (en-GB, not en-UK), duplicates and x-default.",
      },
      lead: { ru: "Перечислите версии страницы — получите взаимную разметку hreflang и список ошибок в кодах.", en: "List the versions of a page and get reciprocal hreflang markup plus any code errors." },
      keywords: { ru: ["генератор hreflang", "hreflang теги", "мультиязычный сайт hreflang"], en: ["hreflang generator", "hreflang tags", "hreflang checker"] },
      howTo: {
        ru: ["Впишите версии страницы: код языка и адрес через пробел.", "Добавьте x-default — версию для остальных языков.", "Выберите формат: HTML, HTTP-заголовок или sitemap.", "Разместите одинаковый блок на всех версиях."],
        en: ["Enter each version: language code and URL separated by a space.", "Add x-default for everyone else.", "Choose a format: HTML, HTTP header or sitemap.", "Put the same block on every version."],
      },
      about: {
        ru: [
          "hreflang подсказывает Google и Яндексу, какую версию показать пользователю с определённым языком и страной. Код состоит из языка ISO 639-1 и необязательного региона ISO 3166-1: ru, en-GB, kk-KZ. Одного региона без языка быть не может.",
          "Частые ошибки: en-UK вместо en-GB, подчёркивание вместо дефиса, отсутствие ссылки на саму себя и невзаимные ссылки — если страница A ссылается на B, то B должна ссылаться на A.",
        ],
        en: [
          "hreflang tells Google and Yandex which version to show users of a given language and country. The code is an ISO 639-1 language plus an optional ISO 3166-1 region: en, en-GB, es-MX. A region alone is invalid.",
          "Common mistakes: en-UK instead of en-GB, underscores instead of hyphens, missing self-references and non-reciprocal links — if page A points to B, B must point back to A.",
        ],
      },
      faq: {
        ru: [
          { q: "Нужно ли указывать регион?", a: "Только если версии для разных стран различаются (цены, валюта, доставка). Для одной версии на язык хватит кода языка." },
          { q: "Какой формат выбрать?", a: "HTML-теги в <head> — самый простой. HTTP-заголовок подходит для PDF и других не-HTML файлов, sitemap — для больших сайтов." },
        ],
        en: [
          { q: "Do I need a region?", a: "Only if versions differ by country (prices, currency, shipping). One version per language needs just the language code." },
          { q: "Which format should I use?", a: "HTML tags in <head> are simplest. The HTTP header suits PDFs and other non-HTML files; sitemaps suit large sites." },
        ],
      },
    },
    {
      slug: "utm-builder",
      component: "seo/utm",
      icon: "Link2",
      popular: true,
      name: { ru: "Конструктор UTM-меток", en: "UTM builder" },
      title: { ru: "Конструктор UTM-меток — генератор ссылок с UTM", en: "UTM Builder — Campaign URL Generator" },
      h1: { ru: "Конструктор UTM-меток", en: "UTM builder" },
      description: {
        ru: "Добавьте к ссылке UTM-метки для Яндекс Метрики и Google Analytics: шаблоны для Директа, Google Ads, VK, Telegram и рассылок, макросы, сохранение параметров и якоря.",
        en: "Add UTM parameters for Google Analytics: templates for Google Ads, Yandex Direct, Telegram and newsletters; ad macros, parameters and #fragment kept.",
      },
      lead: { ru: "Вставьте ссылку и заполните источник, канал и кампанию — готовая ссылка с метками появится сразу.", en: "Paste a link and fill in source, medium and campaign — the tagged link appears instantly." },
      keywords: { ru: ["конструктор utm меток", "генератор utm", "utm метки"], en: ["utm builder", "utm generator", "campaign url builder"] },
      howTo: {
        ru: ["Вставьте адрес страницы.", "Выберите шаблон или заполните utm_source, utm_medium и utm_campaign.", "Скопируйте готовую ссылку."],
        en: ["Paste the page URL.", "Pick a template or fill in utm_source, utm_medium and utm_campaign.", "Copy the tagged link."],
      },
      about: {
        ru: [
          "UTM-метки — пять параметров, по которым системы аналитики определяют источник визита: utm_source (откуда), utm_medium (тип трафика), utm_campaign (кампания), utm_term (ключевое слово) и utm_content (вариант объявления). Пишите их строчными латинскими буквами и одинаково во всех кампаниях — иначе отчёты разъедутся.",
          "Если в ссылке уже есть метки, генератор заменит их новыми, а остальные параметры и якорь (#) сохранит.",
        ],
        en: [
          "UTM tags are five parameters analytics tools use to attribute a visit: utm_source (where), utm_medium (channel), utm_campaign (campaign), utm_term (keyword) and utm_content (ad variant). Use lower-case and keep naming consistent across campaigns, or your reports fragment.",
          "If the link already has UTM tags, the builder replaces them and keeps other parameters and the #fragment.",
        ],
      },
      faq: {
        ru: [
          { q: "Какие метки обязательны?", a: "utm_source, utm_medium и utm_campaign. utm_term и utm_content — по необходимости." },
          { q: "Можно ли ставить UTM на внутренние ссылки сайта?", a: "Нет: переход по такой ссылке начнёт новый визит и исказит статистику источников." },
        ],
        en: [
          { q: "Which tags are required?", a: "utm_source, utm_medium and utm_campaign. utm_term and utm_content are optional." },
          { q: "Should I tag internal links?", a: "No: clicking them starts a new session and corrupts source attribution." },
        ],
      },
      variants: { title: { ru: "Шаблоны UTM", en: "UTM templates" }, list: () => UTM_VARIANTS },
    },
    {
      slug: "schema-markup-generator",
      component: "seo/schema",
      icon: "Braces",
      popular: true,
      name: { ru: "Генератор микроразметки", en: "Schema markup generator" },
      title: { ru: "Генератор микроразметки Schema.org | JSON-LD онлайн", en: "Schema Markup Generator — JSON-LD for Rich Results" },
      h1: { ru: "Генератор микроразметки Schema.org", en: "Schema markup generator" },
      description: {
        ru: "Микроразметка JSON-LD для статьи, товара, FAQ, организации, компании, крошек, события, рецепта, видео, вакансии и приложения с проверкой полей.",
        en: "JSON-LD structured data for articles, products, FAQs, organizations, local businesses, breadcrumbs, events, recipes, videos, jobs and apps.",
      },
      lead: { ru: "Выберите тип, заполните поля — готовый блок <script type=\"application/ld+json\"> можно вставлять на страницу.", en: "Choose a type and fill in the fields — the <script type=\"application/ld+json\"> block is ready to paste." },
      keywords: { ru: ["генератор микроразметки", "schema.org json-ld", "микроразметка сайта"], en: ["schema markup generator", "json-ld generator", "structured data generator"] },
      howTo: {
        ru: ["Выберите тип разметки.", "Заполните основные поля; дополнительные — в раскрывающемся блоке.", "Убедитесь, что обязательные поля заполнены.", "Вставьте код на страницу и проверьте в Rich Results Test."],
        en: ["Choose the markup type.", "Fill in the main fields; extras are under the disclosure.", "Make sure required fields are filled.", "Paste the code and validate it in the Rich Results Test."],
      },
      about: {
        ru: [
          "JSON-LD — рекомендованный Google формат микроразметки: отдельный блок кода, который не надо вплетать в HTML. Разметка должна описывать то, что пользователь видит на странице: цены, отзывы и вопросы из кода обязаны совпадать с текстом.",
          "Генератор выпускает только заполненные поля, подставляет полные адреса значений schema.org (например, https://schema.org/InStock), приводит цены к числу с точкой, время — к ISO 8601 и экранирует «</» внутри текста, чтобы разметка не сломала страницу.",
        ],
        en: [
          "JSON-LD is Google's recommended structured data format: a separate code block, no need to weave attributes into HTML. Markup must describe what users see: prices, reviews and questions in the code must match the page.",
          "The generator emits only filled-in fields, uses full schema.org enumeration URLs (e.g. https://schema.org/InStock), normalises prices to numbers with a dot and times to ISO 8601, and escapes “</” inside text so the markup can't break the page.",
        ],
      },
      faq: {
        ru: [
          { q: "Гарантирует ли разметка расширенный сниппет?", a: "Нет: разметка делает страницу подходящей, но показывать ли расширенный результат, решает поисковик." },
          { q: "Куда вставлять код?", a: "В <head> или <body> — Google читает оба варианта. Главное, чтобы код был в исходном HTML или добавлялся при рендеринге." },
        ],
        en: [
          { q: "Does markup guarantee rich results?", a: "No: it makes a page eligible, but the search engine decides whether to show a rich result." },
          { q: "Where do I put the code?", a: "In <head> or <body> — Google reads both, as long as it's in the HTML or added during rendering." },
        ],
      },
      variants: { title: { ru: "Типы микроразметки", en: "Schema types" }, list: () => SCHEMA_VARIANTS },
    },
    {
      slug: "keyword-density-checker",
      component: "seo/keywords",
      icon: "ChartColumn",
      name: { ru: "Плотность ключевых слов", en: "Keyword density checker" },
      title: { ru: "Анализ плотности ключевых слов — тошнота и водность текста", en: "Keyword Density Checker — Word and Phrase Frequency" },
      h1: { ru: "Анализ плотности ключевых слов", en: "Keyword density checker" },
      description: {
        ru: "Частота слов и фраз из 2–3 слов, водность и классическая тошнота текста. Русский и английский: стоп-слова, ё = е, объединение словоформ.",
        en: "Count word and 2–3-word phrase frequency, stop-word share and classic nausea of a text, with English and Russian stop words and word-form grouping.",
      },
      lead: { ru: "Вставьте текст — увидите самые частые слова и фразы с долей в процентах.", en: "Paste your text to see the most frequent words and phrases with their share." },
      keywords: { ru: ["плотность ключевых слов", "тошнота текста", "водность текста", "частотность слов"], en: ["keyword density checker", "word frequency counter", "keyword frequency"] },
      howTo: {
        ru: ["Вставьте текст статьи или страницы.", "Переключайте слова, фразы из двух и трёх слов.", "Проверьте, не повторяется ли ключевая фраза слишком часто."],
        en: ["Paste the article or page text.", "Switch between words and 2- or 3-word phrases.", "Check that the key phrase isn't repeated too often."],
      },
      about: {
        ru: [
          "Слова приводятся к нижнему регистру, «ё» считается как «е», служебные слова (предлоги, союзы, местоимения) не попадают в список фраз и составляют водность. Облегчённый стемминг объединяет формы одного слова: «ёлка», «ёлки», «ёлку» считаются вместе, а в таблице показывается самая частая форма. Фразы не переходят через границы предложений.",
          "Поисковики давно не ранжируют по «правильной» плотности, но переспам — когда одна фраза повторяется в каждом абзаце — вредит и читателю, и позициям.",
        ],
        en: [
          "Words are lower-cased, stop words (prepositions, conjunctions, pronouns) are excluded from phrases and form the stop-word share. Light stemming groups word forms — “tool” and “tools” count together, and the table shows the most frequent form. Phrases never cross sentence boundaries.",
          "Search engines no longer rank by a “right” density, but stuffing — repeating one phrase in every paragraph — hurts both readers and rankings.",
        ],
      },
      faq: {
        ru: [
          { q: "Какая тошнота нормальная?", a: "Ориентир для классической тошноты — до 3–4 в статье среднего размера. Выше — вероятно, одно слово повторяется слишком часто." },
          { q: "Какая водность нормальная?", a: "Для обычного текста 15–30% — нормально: без служебных слов нельзя писать по-человечески." },
        ],
        en: [
          { q: "What density is normal?", a: "There's no magic number; if a phrase makes up more than 2–3% of a long text, read it aloud — it probably sounds repetitive." },
          { q: "What is classic nausea?", a: "The square root of the most frequent word's count — a quick signal from Russian SEO tools that one word is overused." },
        ],
      },
    },
    {
      slug: "redirect-generator",
      component: "seo/redirects",
      icon: "Split",
      name: { ru: "Генератор редиректов", en: "Redirect generator" },
      title: { ru: "Генератор 301 редиректов для .htaccess, nginx и Next.js", en: "301 Redirect Generator — .htaccess, nginx, Next.js" },
      h1: { ru: "Генератор 301 редиректов", en: "301 redirect generator" },
      description: {
        ru: "Превратите список «старый — новый адрес» в правила 301 редиректа для Apache .htaccess, nginx или Next.js. Адреса с параметрами, кириллица, поиск цепочек и петель.",
        en: "Turn a list of old and new URLs into 301 redirect rules for Apache .htaccess, nginx or Next.js. Handles query strings and flags chains and loops.",
      },
      lead: { ru: "Вставьте пары адресов — получите готовые правила для своего сервера.", en: "Paste URL pairs and get ready rules for your server." },
      keywords: { ru: ["генератор редиректов", "301 редирект", "массовые редиректы"], en: ["redirect generator", "301 redirect generator", "bulk redirects"] },
      howTo: {
        ru: ["Вставьте пары «старый адрес новый адрес», по одной на строку.", "Выберите сервер и код ответа.", "Исправьте цепочки и петли, если они найдены.", "Скопируйте правила в конфигурацию."],
        en: ["Paste “old new” URL pairs, one per line.", "Choose the server and status code.", "Fix any chains or loops found.", "Copy the rules into your config."],
      },
      about: {
        ru: [
          "301 и 308 сообщают поисковикам о постоянном переезде страницы — ссылочный вес и позиции переходят на новый адрес. 302 и 307 — временные: старый адрес остаётся в индексе.",
          "Цепочки (A→B→C) замедляют сайт и теряют часть сигналов — генератор находит их и петли, когда адреса перенаправляют друг на друга.",
        ],
        en: [
          "301 and 308 tell search engines the page moved permanently — signals and rankings pass to the new URL. 302 and 307 are temporary: the old URL stays indexed.",
          "Chains (A→B→C) slow the site and dilute signals — the generator finds them, and loops where URLs redirect to each other.",
        ],
      },
      faq: {
        ru: [
          { q: "301 или 302?", a: "Для переезда навсегда — 301 (или 308). 302 — только для временных ситуаций, например акции или технических работ." },
          { q: "Сколько держать редиректы?", a: "Google советует не меньше года, а лучше — постоянно, пока на старые адреса ведут ссылки." },
        ],
        en: [
          { q: "301 or 302?", a: "301 (or 308) for permanent moves. 302 only for temporary situations like a promotion or maintenance." },
          { q: "How long should redirects stay?", a: "Google recommends at least a year, ideally permanently while links still point to the old URLs." },
        ],
      },
      variants: { title: { ru: "Серверы", en: "Servers" }, list: () => REDIRECT_VARIANTS },
    },
    {
      slug: "llms-txt-generator",
      component: "seo/llms",
      icon: "FileText",
      name: { ru: "Генератор llms.txt", en: "llms.txt generator" },
      title: { ru: "Генератор llms.txt для сайта — формат llmstxt.org", en: "llms.txt Generator — Create an llms.txt File" },
      h1: { ru: "Генератор llms.txt", en: "llms.txt generator" },
      description: {
        ru: "Создайте llms.txt по спецификации llmstxt.org: название, описание и разделы со ссылками в Markdown — чтобы AI-ассистенты быстрее нашли главное на сайте.",
        en: "Create an llms.txt file following llmstxt.org: name, summary and sections of links in Markdown, so AI assistants and tools find the key pages of your site faster.",
      },
      lead: { ru: "Опишите сайт и перечислите главные страницы — получите готовый llms.txt для корня сайта.", en: "Describe your site and list its key pages to get an llms.txt for your site root." },
      keywords: { ru: ["llms.txt", "генератор llms txt", "llms.txt для сайта"], en: ["llms.txt generator", "llms.txt", "create llms.txt"] },
      howTo: {
        ru: ["Укажите название и краткое описание.", "Перечислите ссылки по разделам: «## Раздел» и строки «Название | URL | пояснение».", "Скачайте llms.txt и загрузите в корень сайта."],
        en: ["Enter the name and a short summary.", "List links by section: “## Section” and lines of “Title | URL | notes”.", "Download llms.txt and upload it to the site root."],
      },
      about: {
        ru: [
          "llms.txt — предложенный в 2024 году формат (llmstxt.org): Markdown-файл в корне сайта с заголовком H1, цитатой-описанием и разделами H2 со списками ссылок. Раздел Optional помечает второстепенные материалы, которые можно пропустить при нехватке контекста.",
          "Это не замена robots.txt и sitemap: файл не управляет обходом и не влияет на поисковую выдачу — он помогает языковым моделям и инструментам разработчиков быстро найти документацию.",
        ],
        en: [
          "llms.txt is a format proposed in 2024 (llmstxt.org): a Markdown file at the site root with an H1 title, a blockquote summary and H2 sections listing links. The Optional section marks secondary material that can be skipped when context is short.",
          "It doesn't replace robots.txt or sitemaps: it doesn't control crawling or affect search results — it helps language models and developer tools find documentation quickly.",
        ],
      },
      faq: {
        ru: [
          { q: "Учитывают ли llms.txt поисковики?", a: "Google и Яндекс не заявляли о его поддержке. Файл полезен прежде всего для документации, которую читают AI-ассистенты и инструменты разработчиков." },
          { q: "Нужен ли llms-full.txt?", a: "Это необязательное дополнение с полным текстом документации в одном файле. Начните с обычного llms.txt." },
        ],
        en: [
          { q: "Do search engines use llms.txt?", a: "Google hasn't announced support. The file mainly helps documentation be read by AI assistants and developer tools." },
          { q: "Do I need llms-full.txt?", a: "It's an optional companion with the full documentation text in one file. Start with a plain llms.txt." },
        ],
      },
    },
    {
      slug: "heading-checker",
      component: "seo/headings",
      icon: "Heading",
      name: { ru: "Проверка заголовков H1–H6", en: "Heading checker" },
      title: { ru: "Проверка заголовков H1–H6 на странице", en: "Heading Checker — H1–H6 Structure of a Page" },
      h1: { ru: "Проверка заголовков H1–H6", en: "H1–H6 heading checker" },
      description: {
        ru: "Вставьте HTML-код страницы и получите дерево заголовков H1–H6: пропуски уровней, пустые и повторяющиеся заголовки, лишние H1. Всё в браузере.",
        en: "Paste a page's HTML to get its H1–H6 outline: skipped levels, empty or duplicate headings and extra H1s are flagged. The code is processed in your browser.",
      },
      lead: { ru: "Структура заголовков одним взглядом — с подсветкой проблем.", en: "The heading structure at a glance, with problems highlighted." },
      keywords: { ru: ["проверка заголовков h1", "структура заголовков страницы", "проверить h1 h2"], en: ["heading checker", "h1 checker", "heading structure"] },
      howTo: {
        ru: ["Откройте страницу и нажмите Ctrl+U, чтобы увидеть исходный код.", "Скопируйте весь код и вставьте в поле.", "Изучите дерево заголовков и список замечаний."],
        en: ["Open the page and press Ctrl+U to view the source.", "Copy all of it and paste it into the field.", "Review the outline and the list of issues."],
      },
      about: {
        ru: [
          "Заголовки — оглавление страницы для людей, программ чтения с экрана и поисковиков. Хорошая структура: один H1 с главной темой, H2 для разделов, H3 для подразделов — без прыжков через уровень.",
          "Проверяется исходный HTML: заголовки, которые добавляет JavaScript после загрузки, здесь не видны. Скрипты, стили и комментарии пропускаются, текст картинок внутри заголовков берётся из alt.",
        ],
        en: [
          "Headings are a page's table of contents for people, screen readers and search engines. A good structure has one H1 with the main topic, H2s for sections and H3s for subsections — without skipping levels.",
          "The source HTML is checked: headings injected by JavaScript after load aren't visible here. Scripts, styles and comments are skipped; images inside headings contribute their alt text.",
        ],
      },
      faq: {
        ru: [
          { q: "Можно ли несколько H1?", a: "HTML это допускает, и Google не штрафует, но один H1 делает структуру понятнее и для людей, и для поисковиков." },
          { q: "Страшно ли пропустить уровень?", a: "Для позиций — нет, для доступности — да: программы чтения с экрана строят навигацию по уровням." },
        ],
        en: [
          { q: "Can a page have several H1s?", a: "HTML allows it and Google doesn't penalise it, but a single H1 makes the structure clearer for people and search engines." },
          { q: "Is skipping a level bad?", a: "Not for rankings, but it hurts accessibility: screen readers navigate by heading levels." },
        ],
      },
    },
  ],
});
