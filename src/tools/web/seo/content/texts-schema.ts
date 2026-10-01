/* Schema.org variant pages. */

import type { QA, VariantDef } from "@/registry/types";
import type { SchemaType } from "../lib/jsonld";

interface S {
  slug: string;
  type: SchemaType;
  schema: string;
  ru: { name: string; what: string; title: string; description: string; about: string; faq: QA[] };
  en: { name: string; what: string; title: string; description: string; about: string; faq: QA[] };
}

const LIST: S[] = [
  {
    slug: "article",
    type: "article",
    schema: "Article",
    ru: {
      name: "Статья",
      what: "статей и новостей",
      title: "Микроразметка Article для статей — генератор JSON-LD",
      description: "Разметка Article, NewsArticle или BlogPosting в JSON-LD: заголовок (headline), автор, даты публикации и обновления, картинки. Поля по требованиям Google.",
      about: "Google не требует обязательных полей для Article, но рекомендует headline, image, datePublished, dateModified и author — они помогают правильно показать заголовок, дату и автора в выдаче. Заголовок статьи задаётся свойством headline, а не name. Даты указываются с часовым поясом.",
      faq: [
        { q: "Article, NewsArticle или BlogPosting?", a: "NewsArticle — для новостей, BlogPosting — для записей блога, Article — для остальных материалов. Для Google разница невелика, главное — заполнить рекомендуемые поля." },
        { q: "Какого размера нужна картинка?", a: "Google советует изображения не менее 1200 px по ширине, лучше в нескольких пропорциях: 16:9, 4:3 и 1:1." },
      ],
    },
    en: {
      name: "Article",
      what: "articles and news",
      title: "Article Schema Generator — JSON-LD for Blog Posts and News",
      description: "Article, NewsArticle or BlogPosting markup in JSON-LD: headline, author, publish and update dates, images. Fields follow Google's structured data guidelines.",
      about: "Google has no required Article properties but recommends headline, image, datePublished, dateModified and author, which help show the right title, date and author in results. The article title goes in headline, not name. Dates include a time-zone offset.",
      faq: [
        { q: "Article, NewsArticle or BlogPosting?", a: "NewsArticle for news, BlogPosting for blog posts, Article for everything else. Google treats them similarly; filling in the recommended fields matters more." },
        { q: "What image size is needed?", a: "Google recommends images at least 1200 px wide, ideally in several aspect ratios: 16:9, 4:3 and 1:1." },
      ],
    },
  },
  {
    slug: "product",
    type: "product",
    schema: "Product",
    ru: {
      name: "Товар",
      what: "карточек товаров",
      title: "Микроразметка Product для товаров — генератор JSON-LD",
      description: "Разметка Product с предложением Offer: цена, валюта, наличие, состояние, бренд, артикул и рейтинг. Чтобы показать цену и наличие в Google, нужен offers или отзывы.",
      about: "Для расширенного сниппета товара Google требует name и хотя бы одно из: offers, review или aggregateRating. Генератор собирает Offer с ценой в числовом виде (1500.50), кодом валюты ISO 4217 и наличием из словаря schema.org — например https://schema.org/InStock.",
      faq: [
        { q: "Можно ли добавить рейтинг без отзывов на странице?", a: "Нет: рейтинг должен отражать реальные отзывы, которые пользователь видит на этой странице. Иначе Google может применить ручные санкции за спам в разметке." },
        { q: "Как указать цену «от»?", a: "Для диапазона используют AggregateOffer с lowPrice и highPrice. Для одного товара с одной ценой достаточно Offer." },
      ],
    },
    en: {
      name: "Product",
      what: "product pages",
      title: "Product Schema Generator — JSON-LD with Offers",
      description: "Product markup with an Offer: price, currency, availability, condition, brand, SKU and rating. Google needs offers or reviews to show price and stock in results.",
      about: "For product rich results Google requires name plus at least one of offers, review or aggregateRating. The generator builds an Offer with a numeric price (1500.50), an ISO 4217 currency code and schema.org availability such as https://schema.org/InStock.",
      faq: [
        { q: "Can I add a rating without reviews on the page?", a: "No: ratings must reflect real reviews visible on that page, or Google may apply a manual action for structured data spam." },
        { q: "How do I show a price range?", a: "Use AggregateOffer with lowPrice and highPrice. A single product with one price needs just Offer." },
      ],
    },
  },
  {
    slug: "faq",
    type: "faq",
    schema: "FAQPage",
    ru: {
      name: "FAQ",
      what: "страниц вопросов и ответов",
      title: "Микроразметка FAQPage — генератор JSON-LD вопросов и ответов",
      description: "Разметка FAQPage из списка вопросов и ответов: вопрос, под ним ответ, пары через пустую строку. Когда Google показывает FAQ после изменений 2023 года.",
      about: "С августа 2023 года Google показывает расширенный результат FAQ только для авторитетных государственных и медицинских сайтов. Для остальных разметка остаётся корректной и помогает поисковикам понять страницу, но аккордеона с вопросами в выдаче не будет.",
      faq: [
        { q: "Можно ли размечать отзывы или форум как FAQ?", a: "Нет: FAQPage — для вопросов с одним ответом от владельца сайта. Для вопросов с ответами пользователей есть QAPage." },
        { q: "Должны ли вопросы быть видны на странице?", a: "Да, весь текст из разметки должен быть на странице и доступен пользователю." },
      ],
    },
    en: {
      name: "FAQ",
      what: "FAQ pages",
      title: "FAQ Schema Generator — FAQPage JSON-LD",
      description: "FAQPage markup from questions and answers: question on one line, answer below, pairs split by a blank line — and when Google still shows FAQ results.",
      about: "Since August 2023 Google shows FAQ rich results only for well-known, authoritative government and health websites. For other sites the markup is still valid and helps machines understand the page, but no FAQ accordion appears in results.",
      faq: [
        { q: "Can reviews or a forum be marked up as FAQ?", a: "No: FAQPage is for questions with a single answer from the site owner. User-answered questions use QAPage." },
        { q: "Must the questions be visible on the page?", a: "Yes, all marked-up text must be on the page and visible to users." },
      ],
    },
  },
  {
    slug: "organization",
    type: "organization",
    schema: "Organization",
    ru: {
      name: "Организация",
      what: "главной страницы компании",
      title: "Микроразметка Organization — логотип и профили компании",
      description: "Разметка Organization для главной страницы: название, сайт, логотип, контакты и профили в соцсетях (sameAs). Помогает Google выбрать логотип для выдачи.",
      about: "Разметку Organization размещают на главной странице или странице «О компании». Логотип должен быть не меньше 112×112 px и хорошо смотреться на белом фоне. В sameAs перечислите официальные профили: соцсети, Википедию, справочники.",
      faq: [
        { q: "Нужна ли Organization на каждой странице?", a: "Достаточно одной страницы — главной или «О нас»." },
        { q: "Чем отличается от LocalBusiness?", a: "LocalBusiness — подтип для компаний с физическим адресом, куда приходят клиенты: у неё есть адрес, часы работы и координаты." },
      ],
    },
    en: {
      name: "Organization",
      what: "a company's home page",
      title: "Organization Schema Generator — Logo and Profiles",
      description: "Organization markup for your home page: name, website, logo, contacts and social profiles (sameAs). Helps Google choose your logo for results and knowledge panels.",
      about: "Place Organization markup on the home page or About page. The logo should be at least 112×112 px and look good on white. List official profiles in sameAs: social networks, Wikipedia, directories.",
      faq: [
        { q: "Do I need it on every page?", a: "One page is enough — the home page or About page." },
        { q: "How is it different from LocalBusiness?", a: "LocalBusiness is a subtype for businesses customers visit: it adds an address, opening hours and coordinates." },
      ],
    },
  },
  {
    slug: "local-business",
    type: "localBusiness",
    schema: "LocalBusiness",
    ru: {
      name: "Компания с адресом",
      what: "компаний с офисом или точкой продаж",
      title: "Микроразметка LocalBusiness — адрес и часы работы",
      description: "Разметка LocalBusiness для кафе, магазина, салона или клиники: адрес, телефон, часы работы строками «Пн-Пт 9:00-18:00», координаты и уровень цен.",
      about: "Часы работы можно писать как привыкли — «Пн-Пт 9:00-18:00» или «Mo-Fr 09:00-18:00», — генератор превратит их в OpeningHoursSpecification. Выберите точный подтип (Restaurant, Dentist, Store): поисковикам так проще понять, чем вы занимаетесь.",
      faq: [
        { q: "Заменяет ли разметка карточку в Google Картах?", a: "Нет. Данные на картах берутся из профиля компании в Google Business Profile и Яндекс Бизнесе — разметка на сайте их дополняет." },
        { q: "Как указать круглосуточную работу?", a: "Строкой «Пн-Вс 00:00-23:59» — это распространённый способ обозначить работу без перерыва." },
      ],
    },
    en: {
      name: "Local business",
      what: "businesses with a physical location",
      title: "LocalBusiness Schema Generator — Address and Hours",
      description: "LocalBusiness markup for a café, shop, salon or clinic: address, phone, opening hours written as “Mo-Fr 09:00-18:00”, coordinates and price range.",
      about: "Write opening hours the way you're used to — “Mo-Fr 09:00-18:00” — and the generator turns them into OpeningHoursSpecification. Pick the most specific subtype (Restaurant, Dentist, Store) so search engines understand what you do.",
      faq: [
        { q: "Does it replace my Google Maps listing?", a: "No. Maps data comes from your Google Business Profile; on-site markup complements it." },
        { q: "How do I mark 24/7 opening?", a: "Use “Mo-Su 00:00-23:59” — a common way to express round-the-clock hours." },
      ],
    },
  },
  {
    slug: "breadcrumbs",
    type: "breadcrumbs",
    schema: "BreadcrumbList",
    ru: {
      name: "Хлебные крошки",
      what: "навигационной цепочки",
      title: "Микроразметка хлебных крошек BreadcrumbList — JSON-LD",
      description: "Разметка BreadcrumbList из строк «Название | URL» — от главной к текущей странице. Google показывает цепочку вместо адреса в выдаче на компьютерах.",
      about: "Каждая строка — один уровень: позиция считается автоматически. Цепочка в разметке должна совпадать с видимыми хлебными крошками на странице. Для последнего элемента URL можно не указывать.",
      faq: [
        { q: "Нужна ли главная страница в цепочке?", a: "Обычно да — так цепочка отражает реальный путь от корня сайта. Google допускает и цепочки без неё." },
        { q: "Можно ли несколько цепочек?", a: "Да, если страница доступна по разным путям, можно добавить несколько BreadcrumbList." },
      ],
    },
    en: {
      name: "Breadcrumbs",
      what: "breadcrumb trails",
      title: "Breadcrumb Schema Generator — BreadcrumbList JSON-LD",
      description: "BreadcrumbList markup from “Name | URL” lines, from the home page to the current page. Google can show the trail instead of the URL in desktop results.",
      about: "Each line is one level; positions are numbered automatically. The marked-up trail should match the visible breadcrumbs on the page. The last item may omit its URL.",
      faq: [
        { q: "Should the home page be in the trail?", a: "Usually yes, so the trail reflects the real path from the root. Google accepts trails without it too." },
        { q: "Can a page have several trails?", a: "Yes, if it's reachable through different paths you can add several BreadcrumbList items." },
      ],
    },
  },
  {
    slug: "event",
    type: "event",
    schema: "Event",
    ru: {
      name: "Мероприятие",
      what: "концертов, конференций и вебинаров",
      title: "Микроразметка Event для мероприятий — генератор JSON-LD",
      description: "Разметка Event: название, начало и окончание с часовым поясом, площадка и адрес или ссылка на трансляцию, статус, билеты и организатор. Подходит для офлайн и онлайн.",
      about: "Google требует name, startDate и location. Для онлайн-событий location — VirtualLocation со ссылкой, для смешанных — площадка и ссылка. Если событие перенесли или отменили, не удаляйте разметку: смените eventStatus.",
      faq: [
        { q: "Какой часовой пояс ставится?", a: "Часовой пояс вашего устройства, например +05:00. Если событие в другом городе, поправьте смещение в готовом коде." },
        { q: "Можно ли размечать скидки и акции как Event?", a: "Нет, Google запрещает использовать Event для купонов, распродаж и рекламы — только для реальных мероприятий." },
      ],
    },
    en: {
      name: "Event",
      what: "concerts, conferences and webinars",
      title: "Event Schema Generator — JSON-LD for Events",
      description: "Event markup: name, start and end with time zone, venue and address or stream URL, status, tickets and organizer. Works for in-person, online and mixed events.",
      about: "Google requires name, startDate and location. Online events use a VirtualLocation with a URL; mixed events list both. If an event is moved or cancelled, keep the markup and change eventStatus.",
      faq: [
        { q: "Which time zone is used?", a: "Your device's offset, e.g. -05:00. For events elsewhere, adjust the offset in the generated code." },
        { q: "Can sales or promotions be marked up as Event?", a: "No, Google forbids using Event for coupons, sales or ads — only real events." },
      ],
    },
  },
  {
    slug: "recipe",
    type: "recipe",
    schema: "Recipe",
    ru: {
      name: "Рецепт",
      what: "рецептов",
      title: "Микроразметка Recipe для рецептов — генератор JSON-LD",
      description: "Разметка Recipe: фото, время подготовки и приготовления в ISO 8601, ингредиенты и шаги построчно, порции и калорийность. Общее время считается автоматически.",
      about: "Время вводится в минутах и переводится в формат ISO 8601 (90 минут — PT1H30M), общее время — сумма подготовки и приготовления. Ингредиенты и шаги пишутся по одному на строку: шаги превращаются в HowToStep. Для расширенного результата Google требует name и image.",
      faq: [
        { q: "Какие фото подходят?", a: "Фото готового блюда хорошего качества, не меньше 1200 px по ширине, желательно в пропорциях 16:9, 4:3 и 1:1." },
        { q: "Нужны ли калории?", a: "Необязательно, но полезно: калорийность показывается в карточке рецепта." },
      ],
    },
    en: {
      name: "Recipe",
      what: "recipes",
      title: "Recipe Schema Generator — JSON-LD for Recipes",
      description: "Recipe markup: photo, prep and cook times in ISO 8601, ingredients and steps line by line, servings and calories. Total time is calculated automatically.",
      about: "Times are entered in minutes and converted to ISO 8601 (90 minutes → PT1H30M); total time is prep plus cook. Ingredients and steps go one per line, and steps become HowToStep items. Google requires name and image for recipe rich results.",
      faq: [
        { q: "What photos work?", a: "A good-quality photo of the finished dish, at least 1200 px wide, ideally in 16:9, 4:3 and 1:1." },
        { q: "Are calories required?", a: "No, but useful: calories appear on the recipe card." },
      ],
    },
  },
  {
    slug: "person",
    type: "person",
    schema: "Person",
    ru: {
      name: "Человек",
      what: "страниц авторов и экспертов",
      title: "Микроразметка Person — страница автора в JSON-LD",
      description: "Разметка Person для страницы автора, эксперта или специалиста: имя, должность, компания, фото и профили в соцсетях. Связывает публикации с конкретным человеком.",
      about: "Разметка Person на странице автора помогает поисковикам связать статьи с человеком и его профилями. В sameAs перечислите профили, которые однозначно принадлежат этому человеку: LinkedIn, соцсети, научные профили.",
      faq: [
        { q: "Где размещать Person?", a: "На странице профиля автора или «Обо мне». В статьях автора указывают через поле author разметки Article." },
        { q: "Нужно ли указывать фото?", a: "Необязательно, но фото и профили помогают отличить человека от тёзок." },
      ],
    },
    en: {
      name: "Person",
      what: "author and expert pages",
      title: "Person Schema Generator — Author Page JSON-LD",
      description: "Person markup for an author, expert or professional page: name, job title, company, photo and social profiles. Connects published work to a specific person.",
      about: "Person markup on an author page helps search engines connect articles to a person and their profiles. List profiles that clearly belong to the person in sameAs: LinkedIn, social networks, academic profiles.",
      faq: [
        { q: "Where should Person markup go?", a: "On the author's profile or About me page. In articles, reference the author through the Article author property." },
        { q: "Is a photo needed?", a: "Not required, but a photo and profiles help distinguish the person from namesakes." },
      ],
    },
  },
  {
    slug: "video",
    type: "video",
    schema: "VideoObject",
    ru: {
      name: "Видео",
      what: "страниц с видео",
      title: "Микроразметка VideoObject для видео — генератор JSON-LD",
      description: "Разметка VideoObject: название, описание, превью, дата загрузки и длительность в ISO 8601, ссылки на файл и плеер. Помогает показать видео с превью в поиске Google.",
      about: "Google требует name, thumbnailUrl и uploadDate; описание, длительность и contentUrl или embedUrl рекомендуются. Длительность вводится как «4:35» и переводится в PT4M35S. Видео должно быть основным содержимым страницы и открываться без авторизации.",
      faq: [
        { q: "Нужна ли разметка для роликов с YouTube?", a: "Если видео встроено на вашу страницу и является её главным содержимым — да, это помогает связать видео со страницей." },
        { q: "Какое превью подойдёт?", a: "Картинка не меньше 60×30 px, лучше в полном размере кадра; адрес должен открываться для робота Google." },
      ],
    },
    en: {
      name: "Video",
      what: "video pages",
      title: "Video Schema Generator — VideoObject JSON-LD",
      description: "VideoObject markup: title, description, thumbnail, upload date and ISO 8601 duration, file and player URLs. Helps Google show your video with a thumbnail in results.",
      about: "Google requires name, thumbnailUrl and uploadDate; description, duration and contentUrl or embedUrl are recommended. Duration is entered as “4:35” and becomes PT4M35S. The video should be the page's main content and viewable without signing in.",
      faq: [
        { q: "Do embedded YouTube videos need markup?", a: "If the video is embedded on your page and is its main content, yes — it helps tie the video to your page." },
        { q: "What thumbnail works?", a: "At least 60×30 px, ideally a full-size frame; the URL must be crawlable by Googlebot." },
      ],
    },
  },
  {
    slug: "job-posting",
    type: "jobPosting",
    schema: "JobPosting",
    ru: {
      name: "Вакансия",
      what: "вакансий",
      title: "Микроразметка JobPosting для вакансий — генератор JSON-LD",
      description: "Разметка JobPosting: должность, описание, дата публикации, компания, город или удалённая работа, тип занятости и зарплатная вилка. Для поиска вакансий в Google.",
      about: "Google требует title, description, datePosted, hiringOrganization и jobLocation; для полностью удалённой работы вместо адреса указывается jobLocationType TELECOMMUTE и страна кандидатов. Когда вакансия закрыта, удалите разметку или укажите validThrough в прошлом.",
      faq: [
        { q: "Нужно ли указывать зарплату?", a: "Необязательно, но baseSalary рекомендуется: вакансии с вилкой чаще открывают." },
        { q: "Работает ли в России и Казахстане?", a: "Поиск вакансий Google доступен не во всех странах; разметка при этом корректна и понятна другим системам." },
      ],
    },
    en: {
      name: "Job posting",
      what: "job listings",
      title: "JobPosting Schema Generator — JSON-LD for Job Listings",
      description: "JobPosting markup: title, description, date posted, company, city or remote, employment type and salary range, making listings eligible for Google jobs.",
      about: "Google requires title, description, datePosted, hiringOrganization and jobLocation; fully remote jobs use jobLocationType TELECOMMUTE and the applicant country instead of an address. When a job is filled, remove the markup or set validThrough in the past.",
      faq: [
        { q: "Should I include salary?", a: "Optional, but baseSalary is recommended: listings with a range get more clicks." },
        { q: "Is Google job search available everywhere?", a: "Not in every country; the markup is still valid and understood by other systems." },
      ],
    },
  },
  {
    slug: "software-application",
    type: "softwareApp",
    schema: "SoftwareApplication",
    ru: {
      name: "Приложение",
      what: "приложений и программ",
      title: "Микроразметка SoftwareApplication для приложений — JSON-LD",
      description: "Разметка SoftwareApplication для программы, игры или мобильного приложения: платформа, категория, цена (0 — бесплатно) и рейтинг пользователей.",
      about: "Google требует name и либо offers с ценой, либо aggregateRating или review. Для бесплатного приложения укажите цену 0. Рекомендуются operatingSystem и applicationCategory — например GameApplication или BusinessApplication.",
      faq: [
        { q: "Можно ли использовать для сайта-сервиса?", a: "Да, для веб-приложений тоже используют SoftwareApplication (или подтип WebApplication) с operatingSystem «Any» или «Web»." },
        { q: "Откуда брать рейтинг?", a: "Только из реальных отзывов на вашей странице. Оценки из магазинов приложений переносить нельзя." },
      ],
    },
    en: {
      name: "Software app",
      what: "apps and software",
      title: "SoftwareApplication Schema Generator — App JSON-LD",
      description: "SoftwareApplication markup for a program, game or mobile app: platform, category, price (0 for free) and rating. Rich results need a price or ratings.",
      about: "Google requires name plus either offers with a price or aggregateRating or review. For a free app set the price to 0. operatingSystem and applicationCategory — e.g. GameApplication or BusinessApplication — are recommended.",
      faq: [
        { q: "Can I use it for a web service?", a: "Yes, web apps use SoftwareApplication (or the WebApplication subtype) with operatingSystem “Any” or “Web”." },
        { q: "Where does the rating come from?", a: "Only from real reviews on your page. Don't copy app-store ratings." },
      ],
    },
  },
];

export const SCHEMA_VARIANTS: VariantDef[] = LIST.map((s) => ({
  slug: s.slug,
  name: { ru: s.ru.name, en: s.en.name },
  title: { ru: s.ru.title, en: s.en.title },
  h1: { ru: `Микроразметка ${s.schema}`, en: `${s.schema} schema generator` },
  description: { ru: s.ru.description, en: s.en.description },
  lead: { ru: `Заполните поля — получите готовый JSON-LD ${s.schema} для ${s.ru.what}.`, en: `Fill in the fields to get ready ${s.schema} JSON-LD for ${s.en.what}.` },
  props: { type: s.type },
  keywords: { ru: [`микроразметка ${s.schema.toLowerCase()}`, `schema ${s.schema.toLowerCase()} json-ld`], en: [`${s.schema.toLowerCase()} schema`, `${s.schema.toLowerCase()} json-ld`] },
  blocks: (l) => [{ type: "text", title: l === "ru" ? `Что важно для ${s.schema}` : `What matters for ${s.schema}`, paragraphs: [s[l].about] }],
  faq: { ru: s.ru.faq, en: s.en.faq },
}));
