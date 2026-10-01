/* Variant page texts for SEO tools. */

import type { Locale } from "@/i18n/config";
import type { Block, QA, VariantDef } from "@/registry/types";
import { AI_BOTS } from "../lib/presets";

interface VT {
  name: string;
  title: string;
  h1: string;
  description: string;
  lead: string;
  keywords: string[];
  about?: { title: string; paragraphs: string[] };
  list?: { title: string; items: string[] };
  faq: QA[];
}

function variant(slug: string, props: Record<string, unknown>, ru: VT, en: VT): VariantDef {
  const t = { ru, en };
  return {
    slug,
    name: { ru: ru.name, en: en.name },
    title: { ru: ru.title, en: en.title },
    h1: { ru: ru.h1, en: en.h1 },
    description: { ru: ru.description, en: en.description },
    lead: { ru: ru.lead, en: en.lead },
    props,
    keywords: { ru: ru.keywords, en: en.keywords },
    blocks: (l: Locale) => {
      const v = t[l];
      const out: Block[] = [];
      if (v.about) out.push({ type: "text", title: v.about.title, paragraphs: v.about.paragraphs });
      if (v.list) out.push({ type: "list", title: v.list.title, items: v.list.items });
      return out;
    },
    faq: { ru: ru.faq, en: en.faq },
  };
}

/* ───────────── robots.txt presets ───────────── */

const cms = (slug: string, preset: string, name: string, ru: { about: string; faq: QA[] }, en: { about: string; faq: QA[]; name?: string }) =>
  variant(
    slug,
    { preset },
    {
      name,
      title: `robots.txt для ${name} — готовый шаблон`,
      h1: `robots.txt для ${name}`,
      description: `Шаблон robots.txt для ${name}: закрыты служебные разделы, поиск и дубли с параметрами, открыты CSS и JS. Добавьте sitemap, свои пути и проверьте ошибки.`,
      lead: `Готовый robots.txt для ${name} — отредактируйте под свой сайт и положите в корень.`,
      keywords: [`robots.txt для ${name.toLowerCase()}`, `правильный robots ${name.toLowerCase()}`],
      about: { title: `Что закрывает шаблон для ${name}`, paragraphs: [ru.about, "Шаблон — отправная точка, а не догма: проверьте, что не закрыли нужные разделы, с помощью проверки robots.txt, и посмотрите отчёт об индексировании в Google Search Console и Яндекс Вебмастере."] },
      faq: ru.faq,
    },
    {
      name: en.name ?? name,
      title: `Robots.txt for ${en.name ?? name} — Recommended Template`,
      h1: `Robots.txt for ${en.name ?? name}`,
      description: `A robots.txt template for ${en.name ?? name}: admin areas, search and parameter duplicates blocked, CSS and JS open. Add a sitemap and check for errors.`,
      lead: `A ready robots.txt for ${en.name ?? name} — adjust it to your site and upload it to the root.`,
      keywords: [`${(en.name ?? name).toLowerCase()} robots.txt`, `robots.txt for ${(en.name ?? name).toLowerCase()}`],
      about: { title: `What the ${en.name ?? name} template blocks`, paragraphs: [en.about, "A template is a starting point: test that you haven't blocked pages you need with the robots.txt tester and watch the indexing reports in Google Search Console."] },
      faq: en.faq,
    },
  );

export const ROBOTS_VARIANTS: VariantDef[] = [
  cms(
    "wordpress",
    "wordpress",
    "WordPress",
    {
      about: "Закрыты админка /wp-admin/ (кроме admin-ajax.php, который нужен темам и плагинам), страница входа, внутренний поиск, ответы на комментарии (?replytocom) и trackback. Папки /wp-content/ и /wp-includes/ не закрыты: в них CSS, JS и картинки, без которых Google не отрисует страницу.",
      faq: [
        { q: "Где в WordPress лежит robots.txt?", a: "По умолчанию WordPress отдаёт виртуальный файл. Если положить настоящий robots.txt в корень сайта, будет использоваться он. SEO-плагины (Yoast, Rank Math) тоже позволяют редактировать его из админки." },
        { q: "Какой sitemap указать?", a: "Встроенная карта WordPress — /wp-sitemap.xml; у Yoast — /sitemap_index.xml, у Rank Math — /sitemap_index.xml. Укажите тот, что реально открывается." },
      ],
    },
    {
      about: "Blocks /wp-admin/ (except admin-ajax.php, which themes and plugins need), the login page, internal search, comment replies (?replytocom) and trackbacks. /wp-content/ and /wp-includes/ stay open: they hold the CSS, JS and images Google needs to render pages.",
      faq: [
        { q: "Where is robots.txt in WordPress?", a: "WordPress serves a virtual file by default. Upload a real robots.txt to the site root and it takes over. SEO plugins (Yoast, Rank Math) also let you edit it from the dashboard." },
        { q: "Which sitemap should I list?", a: "WordPress core uses /wp-sitemap.xml; Yoast and Rank Math use /sitemap_index.xml. List the one that actually opens." },
      ],
    },
  ),
  cms(
    "bitrix",
    "bitrix",
    "1С-Битрикс",
    {
      about: "Закрыты служебная папка /bitrix/, личный кабинет, авторизация, поиск, версии для печати и ссылки с параметрами корзины, сравнения и возврата (backurl). Открыты /bitrix/templates/, /bitrix/js/, /bitrix/components/ и /upload/ — там стили, скрипты и картинки сайта.",
      faq: [
        { q: "Нужно ли закрывать постраничную навигацию PAGEN?", a: "Обычно нет: страницы пагинации помогают роботу найти товары. Лучше настройте canonical или уникальные заголовки для страниц каталога." },
        { q: "Можно ли редактировать robots.txt из админки?", a: "Да, в модуле «Поисковая оптимизация» есть редактор robots.txt. Итоговый файл лежит в корне сайта." },
      ],
    },
    {
      name: "1C-Bitrix",
      about: "Blocks the /bitrix/ system folder, the personal area, authentication, search, print versions and cart, compare and backurl parameters. /bitrix/templates/, /bitrix/js/, /bitrix/components/ and /upload/ stay open — they hold the site's styles, scripts and images.",
      faq: [
        { q: "Should PAGEN pagination be blocked?", a: "Usually not: pagination pages help crawlers find products. Use canonical tags or unique titles for catalogue pages instead." },
        { q: "Can I edit robots.txt from the admin panel?", a: "Yes, the SEO module has a robots.txt editor. The resulting file lives in the site root." },
      ],
    },
  ),
  cms(
    "opencart",
    "opencart",
    "OpenCart",
    {
      about: "Закрыты /admin и /system, личный кабинет, партнёрка, оформление заказа, поиск и дубли каталога с параметрами сортировки, лимита и фильтра. Если включены ЧПУ, адреса товаров и категорий остаются открытыми.",
      faq: [
        { q: "Почему не закрыт /catalog?", a: "В папке /catalog/view/ лежат темы, стили и скрипты магазина. Если закрыть её, Google не сможет корректно отрисовать страницы." },
        { q: "Что делать с дублями из-за ?page=?", a: "Страницы пагинации лучше оставить открытыми для обхода, но следить, чтобы у них были уникальные заголовки или корректный canonical." },
      ],
    },
    {
      about: "Blocks /admin and /system, the account area, affiliates, checkout, search and catalogue duplicates with sort, limit and filter parameters. With SEO URLs enabled, product and category pages stay open.",
      faq: [
        { q: "Why isn't /catalog blocked?", a: "/catalog/view/ holds the store's themes, styles and scripts. Blocking it stops Google from rendering pages properly." },
        { q: "What about ?page= duplicates?", a: "Keep pagination crawlable but make sure those pages have unique titles or a correct canonical." },
      ],
    },
  ),
  cms(
    "joomla",
    "joomla",
    "Joomla",
    {
      about: "Шаблон повторяет стандартный robots.txt.dist из Joomla 4 и 5: закрыты административная часть, API, кэш, системные папки, установщик, логи и временные файлы. Папки /images/, /media/ и /templates/ открыты — там оформление и картинки.",
      faq: [
        { q: "Почему в Joomla нет robots.txt после установки?", a: "Joomla поставляет файл robots.txt.dist. Переименуйте его в robots.txt или сохраните этот шаблон в корень сайта." },
        { q: "Нужно ли закрывать /component/?", a: "Если включены ЧПУ и сайт отдаёт дубли вида /component/…, их лучше закрыть или настроить редиректы на основные адреса." },
      ],
    },
    {
      about: "The template mirrors the robots.txt.dist shipped with Joomla 4 and 5: admin area, API, cache, system folders, installer, logs and temp files are blocked. /images/, /media/ and /templates/ stay open for styling and images.",
      faq: [
        { q: "Why is there no robots.txt after installing Joomla?", a: "Joomla ships robots.txt.dist. Rename it to robots.txt or save this template to the site root." },
        { q: "Should /component/ be blocked?", a: "If SEF URLs are on and the site exposes /component/… duplicates, block them or redirect them to the main URLs." },
      ],
    },
  ),
  cms(
    "modx",
    "modx",
    "MODX",
    {
      about: "Закрыты менеджер /manager/, ядро /core/, коннекторы, служебные компоненты в /assets/components/, прямые обращения к index.php и все адреса с параметрами (/*?). Последнее правило строгое: если нужные страницы открываются с параметрами, удалите его.",
      faq: [
        { q: "Не закроет ли /*? нужные страницы?", a: "Закроет всё, что содержит «?». Для сайта на ЧПУ это обычно дубли; если же у вас фильтры или пагинация работают через параметры и должны индексироваться, уберите это правило." },
        { q: "Где хранится robots.txt в MODX?", a: "Обычным файлом в корне сайта или ресурсом с типом содержимого text/plain и псевдонимом robots.txt." },
      ],
    },
    {
      about: "Blocks the /manager/, /core/, connectors, service components in /assets/components/, direct index.php requests and every URL with parameters (/*?). The last rule is strict: remove it if pages you need use query parameters.",
      faq: [
        { q: "Won't /*? block pages I need?", a: "It blocks everything containing “?”. With friendly URLs these are usually duplicates; if filters or pagination use parameters and should be indexed, remove the rule." },
        { q: "Where does MODX keep robots.txt?", a: "Either as a plain file in the site root or as a resource with the text/plain content type and the robots.txt alias." },
      ],
    },
  ),
  variant(
    "block-ai-bots",
    { preset: "basic", blockAi: true },
    {
      name: "Закрыть от AI-ботов",
      title: "Как закрыть сайт от AI-ботов в robots.txt: GPTBot, ClaudeBot",
      h1: "robots.txt против AI-ботов",
      description: "Запретите обход сайта роботам, которые собирают данные для нейросетей: GPTBot, ClaudeBot, Google-Extended, CCBot и другим. Поиск Google и Яндекса открыт.",
      lead: "Одна группа правил в robots.txt закрывает сайт от известных AI-краулеров, не трогая поисковики.",
      keywords: ["закрыть сайт от gptbot", "robots.txt ai боты", "запретить chatgpt сканировать сайт"],
      list: { title: "Какие роботы закрываются", items: AI_BOTS.map(([b, c]) => `${b} — ${c}`) },
      about: {
        title: "Что важно знать",
        paragraphs: [
          "robots.txt — это просьба, а не защита: добросовестные компании её соблюдают, но скрытые парсеры могут игнорировать. Закрытие Google-Extended не влияет на позиции в Google — это отдельный токен, который управляет использованием контента для моделей Gemini.",
          "Роботы OAI-SearchBot и PerplexityBot приводят пользователей из AI-поиска. Если хотите, чтобы сайт показывался в ответах ChatGPT Search и Perplexity со ссылкой, удалите их из списка.",
        ],
      },
      faq: [
        { q: "Пропадёт ли сайт из Google?", a: "Нет. Googlebot остаётся открытым; Google-Extended отвечает только за использование контента в обучении и ответах Gemini." },
        { q: "Удалит ли это уже собранные данные?", a: "Нет, запрет действует только на будущий обход. Для удаления данных обращайтесь к компаниям напрямую." },
      ],
    },
    {
      name: "Block AI crawlers",
      title: "Block AI Crawlers in robots.txt — GPTBot, ClaudeBot and More",
      h1: "Block AI crawlers with robots.txt",
      description: "Stop crawlers that collect data for AI models: GPTBot, ClaudeBot, Google-Extended, CCBot, PerplexityBot and others — while Google and Bing search stay open.",
      lead: "One robots.txt group keeps known AI crawlers out without touching search engines.",
      keywords: ["block gptbot", "block ai crawlers robots.txt", "robots.txt chatgpt"],
      list: { title: "Crawlers this blocks", items: AI_BOTS.map(([b, c]) => `${b} — ${c}`) },
      about: {
        title: "Worth knowing",
        paragraphs: [
          "robots.txt is a request, not protection: reputable companies honour it, hidden scrapers may not. Blocking Google-Extended doesn't affect Google rankings — it's a separate token that controls use of your content for Gemini models.",
          "OAI-SearchBot and PerplexityBot send visitors from AI search. If you want to appear with links in ChatGPT Search and Perplexity answers, remove them from the list.",
        ],
      },
      faq: [
        { q: "Will my site disappear from Google?", a: "No. Googlebot stays allowed; Google-Extended only governs use of content for training and Gemini answers." },
        { q: "Does it delete data already collected?", a: "No, it only affects future crawling. Contact the companies directly to request removal." },
      ],
    },
  ),
  variant(
    "disallow-all",
    { preset: "disallowAll" },
    {
      name: "Закрыть весь сайт",
      title: "Как закрыть сайт от индексации | robots.txt",
      h1: "Закрыть сайт от индексации",
      description: "robots.txt, который запрещает обход всего сайта: для тестовой копии, сайта в разработке или staging. Почему одного Disallow недостаточно и как надёжно скрыть сайт.",
      lead: "Две строки — User-agent: * и Disallow: / — просят всех роботов не обходить сайт.",
      keywords: ["закрыть сайт от индексации", "robots.txt disallow all", "запретить индексацию сайта"],
      about: {
        title: "Почему этого может быть мало",
        paragraphs: [
          "Disallow запрещает обход, но не индексацию: если на закрытые страницы ведут внешние ссылки, Google может показать их в выдаче без описания. Чтобы страницы не попали в индекс, нужен meta robots noindex или заголовок X-Robots-Tag — и тогда robots.txt, наоборот, не должен их закрывать, иначе робот не увидит noindex.",
          "Для тестовой копии надёжнее всего закрыть сайт паролем (HTTP-авторизацией) — тогда его не увидят ни роботы, ни случайные посетители.",
        ],
      },
      faq: [
        { q: "Как вернуть сайт в поиск?", a: "Замените Disallow: / на пустой Disallow: или удалите правило, затем отправьте sitemap в Google Search Console и Яндекс Вебмастер." },
        { q: "Сработает ли это для Яндекса?", a: "Да, Яндекс соблюдает User-agent: * и Disallow: /." },
      ],
    },
    {
      name: "Block the whole site",
      title: "Robots.txt to Block All Crawlers (Disallow All)",
      h1: "Block the whole site in robots.txt",
      description: "A robots.txt that stops crawling of the entire site — for staging, development or test copies. Why Disallow alone isn't enough and how to hide a site reliably.",
      lead: "Two lines — User-agent: * and Disallow: / — ask every crawler to stay out.",
      keywords: ["robots.txt disallow all", "block all crawlers", "noindex whole site"],
      about: {
        title: "Why this may not be enough",
        paragraphs: [
          "Disallow blocks crawling, not indexing: if external links point to blocked pages, Google may still list them without a snippet. To keep pages out of the index use meta robots noindex or the X-Robots-Tag header — and then don't block them in robots.txt, or crawlers never see the noindex.",
          "For a staging copy, password protection (HTTP authentication) is the most reliable: neither crawlers nor passers-by can see it.",
        ],
      },
      faq: [
        { q: "How do I get the site back into search?", a: "Replace Disallow: / with an empty Disallow: or remove it, then resubmit your sitemap in Google Search Console." },
        { q: "Do all search engines respect it?", a: "Google, Bing and Yandex all honour User-agent: * with Disallow: /." },
      ],
    },
  ),
];

/* ───────────── UTM ───────────── */

export const UTM_VARIANTS: VariantDef[] = [
  variant(
    "yandex-direct",
    { preset: "yandex" },
    {
      name: "Яндекс Директ",
      title: "UTM-метки для Яндекс Директа — шаблон с макросами",
      h1: "UTM-метки для Яндекс Директа",
      description: "Шаблон UTM для Яндекс Директа с динамическими параметрами {campaign_id}, {ad_id} и {keyword}: Директ сам подставит кампанию, объявление и ключевую фразу.",
      lead: "Вставьте адрес посадочной страницы — метки с макросами Директа добавятся автоматически.",
      keywords: ["utm метки для яндекс директ", "динамические параметры директ", "шаблон utm директ"],
      about: {
        title: "Как работают макросы Директа",
        paragraphs: [
          "Значения в фигурных скобках Директ заменяет при клике: {campaign_id} — номер кампании, {ad_id} — номер объявления, {keyword} — ключевая фраза. Так в Метрике и Google Analytics видно, какая именно фраза привела посетителя. Фигурные скобки не кодируются — иначе подстановка не сработает.",
          "Для Метрики UTM-метки не обязательны: Директ передаёт данные автоматически через yclid, если включена связка счётчика. Метки нужны для других систем аналитики и для CRM.",
        ],
      },
      faq: [
        { q: "Какие ещё макросы есть в Директе?", a: "Например {source_type} (поиск или сети), {source} (площадка), {position_type} (блок показа), {region_name}. Их можно добавить в utm_content или utm_term." },
        { q: "Не сломают ли метки ссылку?", a: "Нет: генератор сохраняет существующие параметры и якорь (#) и добавляет метки перед якорем." },
      ],
    },
    {
      name: "Yandex Direct",
      title: "UTM Parameters for Yandex Direct — Template with Macros",
      h1: "UTM parameters for Yandex Direct",
      description: "A ready UTM template for Yandex Direct with dynamic parameters {campaign_id}, {ad_id} and {keyword}: Direct fills in the campaign, ad and keyword on every click.",
      lead: "Paste your landing page URL — UTM tags with Direct macros are added automatically.",
      keywords: ["yandex direct utm", "yandex direct dynamic parameters"],
      about: {
        title: "How Direct macros work",
        paragraphs: [
          "Direct replaces values in curly braces on click: {campaign_id} is the campaign number, {ad_id} the ad, {keyword} the keyword. Analytics then shows which exact keyword brought the visitor. Braces are left unencoded — otherwise substitution fails.",
        ],
      },
      faq: [
        { q: "What other macros does Direct support?", a: "For example {source_type} (search or networks), {source} (site), {position_type} (ad block) and {region_name}." },
        { q: "Will the tags break my link?", a: "No: existing parameters and the #fragment are kept, and tags go before the fragment." },
      ],
    },
  ),
  variant(
    "google-ads",
    { preset: "google" },
    {
      name: "Google Ads",
      title: "UTM-метки для Google Ads — шаблон с ValueTrack",
      h1: "UTM-метки для Google Ads",
      description: "Шаблон UTM для Google Ads с параметрами ValueTrack {campaignid}, {creative} и {keyword}. Когда метки нужны при включённой автопометке gclid и как не задвоить данные.",
      lead: "Добавьте к ссылке метки с параметрами ValueTrack — Google Ads подставит кампанию, объявление и ключевое слово.",
      keywords: ["utm метки google ads", "valuetrack параметры", "шаблон utm google"],
      about: {
        title: "UTM и автопометка",
        paragraphs: [
          "Google Analytics получает данные Google Ads через автопометку (параметр gclid) — для GA4 метки не обязательны. UTM пригодятся для других систем аналитики, Яндекс Метрики и CRM. Параметры ValueTrack в фигурных скобках Google Ads заменяет при клике.",
        ],
      },
      faq: [
        { q: "Где указать шаблон в Google Ads?", a: "Удобнее всего в поле «Суффикс конечного URL» на уровне аккаунта или кампании: туда вставляется часть после «?», и её не нужно дублировать в каждом объявлении." },
        { q: "Какие ещё параметры ValueTrack бывают?", a: "{adgroupid}, {matchtype}, {network}, {device}, {placement} и другие — полный список есть в справке Google Ads." },
      ],
    },
    {
      name: "Google Ads",
      title: "UTM Parameters for Google Ads — ValueTrack Template",
      h1: "UTM parameters for Google Ads",
      description: "A UTM template for Google Ads with ValueTrack parameters {campaignid}, {creative} and {keyword}, and when you need UTM alongside gclid auto-tagging.",
      lead: "Add UTM tags with ValueTrack parameters — Google Ads fills in the campaign, ad and keyword.",
      keywords: ["google ads utm", "valuetrack parameters", "google ads tracking template"],
      about: {
        title: "UTM and auto-tagging",
        paragraphs: [
          "Google Analytics receives Google Ads data through auto-tagging (gclid), so GA4 doesn't need UTM. Tags help with other analytics tools and CRMs. Google Ads replaces ValueTrack parameters in curly braces on click.",
        ],
      },
      faq: [
        { q: "Where do I put the template in Google Ads?", a: "The Final URL suffix at account or campaign level is easiest: it takes the part after “?” and applies it to every ad." },
        { q: "What other ValueTrack parameters exist?", a: "{adgroupid}, {matchtype}, {network}, {device}, {placement} and more — see the Google Ads help for the full list." },
      ],
    },
  ),
];

/* ───────────── redirects ───────────── */

export const REDIRECT_VARIANTS: VariantDef[] = [
  variant(
    "htaccess",
    { server: "htaccess" },
    {
      name: ".htaccess",
      title: "301 редирект в .htaccess — генератор правил",
      h1: "301 редирект в .htaccess",
      description: "Правила RewriteRule для .htaccess из списка старых и новых адресов: точное совпадение, адреса с параметрами через RewriteCond, кириллица. Проверка цепочек и петель.",
      lead: "Вставьте пары «старый — новый адрес» и получите готовый блок для .htaccess.",
      keywords: ["301 редирект htaccess", "redirect htaccess", "rewriterule 301"],
      about: {
        title: "Почему RewriteRule, а не Redirect",
        paragraphs: [
          "Директива Redirect из mod_alias работает по префиксу: Redirect 301 /old /new перенаправит и /old-page, и /old/anything. Генератор использует RewriteRule с якорями ^…$, поэтому срабатывает только точный адрес (с косой чертой в конце или без). Для адресов с параметрами добавляется RewriteCond %{QUERY_STRING}, а знак «?» в конце цели отбрасывает старые параметры.",
        ],
      },
      faq: [
        { q: "Куда вставлять правила?", a: "В .htaccess в корне сайта, выше правил CMS (например, выше блока # BEGIN WordPress), иначе CMS перехватит запрос раньше." },
        { q: "Как перенаправить весь сайт на новый домен?", a: "Одним правилом: RewriteCond %{HTTP_HOST} ^old\\.ru$ [NC] и RewriteRule ^(.*)$ https://new.ru/$1 [R=301,L]." },
      ],
    },
    {
      name: ".htaccess",
      title: "301 Redirect in .htaccess — Rule Generator",
      h1: "301 redirects in .htaccess",
      description: "RewriteRule lines for .htaccess from a list of old and new URLs: exact matching, query-string URLs via RewriteCond, non-Latin paths. Chains and loops are flagged.",
      lead: "Paste “old → new” pairs and get a ready block for .htaccess.",
      keywords: ["htaccess 301 redirect", "htaccess redirect generator", "rewriterule 301"],
      about: {
        title: "Why RewriteRule instead of Redirect",
        paragraphs: [
          "mod_alias Redirect matches by prefix: Redirect 301 /old /new also redirects /old-page and /old/anything. The generator uses RewriteRule anchored with ^…$, so only the exact URL (with or without a trailing slash) matches. Query-string URLs get a RewriteCond %{QUERY_STRING}, and a trailing “?” on the target drops the old parameters.",
        ],
      },
      faq: [
        { q: "Where do the rules go?", a: "In the .htaccess at the site root, above your CMS rules (e.g. above # BEGIN WordPress), or the CMS handles the request first." },
        { q: "How do I move a whole site to a new domain?", a: "One rule: RewriteCond %{HTTP_HOST} ^old\\.com$ [NC] and RewriteRule ^(.*)$ https://new.com/$1 [R=301,L]." },
      ],
    },
  ),
  variant(
    "nginx",
    { server: "nginx" },
    {
      name: "nginx",
      title: "301 редирект в nginx — генератор map и return",
      h1: "301 редирект в nginx",
      description: "Редиректы для nginx из списка адресов: один блок map по $request_uri и return 301 — быстро даже для тысяч правил и корректно для адресов с параметрами.",
      lead: "Вставьте пары адресов — получите map для секции http и условие для server.",
      keywords: ["301 редирект nginx", "nginx redirect map", "return 301 nginx"],
      about: {
        title: "Почему map",
        paragraphs: [
          "Отдельный location на каждый адрес плохо масштабируется и не умеет сравнивать параметры. Блок map сопоставляет полный $request_uri (путь с параметрами) с новым адресом через хеш-таблицу — это быстро даже для десятков тысяч строк. Кириллические адреса записываются в percent-кодировке, как их присылает браузер.",
        ],
      },
      faq: [
        { q: "Что делать при ошибке map_hash_bucket_size?", a: "Для длинных адресов увеличьте в секции http значение map_hash_bucket_size (например, до 128 или 256) и перезагрузите nginx." },
        { q: "Как проверить конфигурацию?", a: "Выполните nginx -t, затем nginx -s reload (или systemctl reload nginx)." },
      ],
    },
    {
      name: "nginx",
      title: "301 Redirect in nginx — map and return Generator",
      h1: "301 redirects in nginx",
      description: "nginx redirects from a URL list: one map block on $request_uri plus return 301 — fast even for thousands of rules and correct for URLs with query strings.",
      lead: "Paste URL pairs — get a map for the http context and a check for the server block.",
      keywords: ["nginx 301 redirect", "nginx redirect map", "nginx return 301"],
      about: {
        title: "Why map",
        paragraphs: [
          "A location per URL scales poorly and can't compare query strings. A map matches the full $request_uri (path plus query) to the new URL via a hash table — fast even for tens of thousands of lines. Non-ASCII paths are percent-encoded, as browsers send them.",
        ],
      },
      faq: [
        { q: "What about a map_hash_bucket_size error?", a: "For long URLs raise map_hash_bucket_size in the http context (e.g. to 128 or 256) and reload nginx." },
        { q: "How do I test the config?", a: "Run nginx -t, then nginx -s reload (or systemctl reload nginx)." },
      ],
    },
  ),
  variant(
    "nextjs",
    { server: "nextjs" },
    {
      name: "Next.js",
      title: "Редиректы в Next.js — генератор redirects() для next.config",
      h1: "Редиректы в Next.js",
      description: "Массив redirects() для next.config.js из списка адресов: точные пути, адреса с параметрами через has, экранирование спецсимволов и нужный код ответа.",
      lead: "Вставьте пары адресов — получите готовую функцию redirects() для next.config.js.",
      keywords: ["редирект next.js", "next.config redirects", "301 редирект nextjs"],
      about: {
        title: "301 или 308",
        paragraphs: [
          "Флаг permanent: true в Next.js отдаёт код 308, а не 301. Для поисковиков оба означают постоянный переезд, но генератор явно указывает statusCode, чтобы ответ был именно тем, что вы выбрали. Адреса с параметрами превращаются в условие has с type: \"query\"; скобки, двоеточия и звёздочки в пути экранируются, чтобы Next.js не принял их за шаблоны.",
        ],
      },
      faq: [
        { q: "Сколько редиректов можно добавить?", a: "Каждое правило проверяется при каждом запросе, поэтому тысячи строк в next.config замедляют маршрутизацию. Для больших списков используйте middleware с поиском по словарю или редиректы на уровне хостинга." },
        { q: "Работает ли это при статическом экспорте?", a: "Нет: при output: \"export\" redirects() не применяется — настройте редиректы на сервере или CDN." },
      ],
    },
    {
      name: "Next.js",
      title: "Next.js Redirects Generator — redirects() for next.config",
      h1: "Next.js redirects generator",
      description: "A redirects() array for next.config.js from a URL list: exact paths, query-string URLs via has, escaped special characters and the status code you choose.",
      lead: "Paste URL pairs — get a ready redirects() function for next.config.js.",
      keywords: ["next.js redirects", "next.config redirects", "nextjs 301 redirect"],
      about: {
        title: "301 or 308",
        paragraphs: [
          "permanent: true makes Next.js answer 308, not 301. Search engines treat both as permanent moves, but the generator sets statusCode explicitly so the response is exactly what you picked. Query-string URLs become a has condition with type: \"query\"; parentheses, colons and asterisks in paths are escaped so Next.js doesn't read them as patterns.",
        ],
      },
      faq: [
        { q: "How many redirects can I add?", a: "Every rule is checked on every request, so thousands of lines in next.config slow routing down. For large lists use middleware with a lookup table or host-level redirects." },
        { q: "Does it work with static export?", a: "No: with output: \"export\" redirects() isn't applied — configure redirects on the server or CDN." },
      ],
    },
  ),
];
