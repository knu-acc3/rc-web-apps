import type { L10n, L10nList, Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { isResolvingRelated, resolveRelatedKey } from "@/registry/tool-section";
import type { Block, LinkItem, PageModel, QA } from "@/registry/types";
import { DEFAULT_FAVORITES } from "../data/zones";
import { CITIES, COUNTRIES, cityLabel, clientCity, countryPath } from "../lib/model";
import type { ConverterProps, WorldClockProps } from "../lib/types";
import { citiesBySlugs, cityLink, home, HUE } from "./common";
import { pairKeys } from "./pair";
import { enSpoken, ruOfficial, ruSpoken } from "../lib/words";

interface TimeTool {
  slug: string;
  component: string;
  icon: string;
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  howTo: L10nList;
  about: L10nList;
  faq: Record<Locale, QA[]>;
  related: string[];
  props?: (locale: Locale) => Record<string, unknown>;
  blocks?: (locale: Locale) => Block[];
  topBlocks?: (locale: Locale) => Block[];
  keywords?: L10nList;
  wide?: boolean;
  compact?: boolean;
}

/** "более 650" — a rounded, always-true count of catalogue cities. */
const N = Math.floor(CITIES.length / 50) * 50;

/** Popular cities for the /time catalogue (audience first, then the world). */
const POPULAR = [
  "moscow", "astana", "almaty", "saint-petersburg", "shymkent", "karaganda", "tashkent", "bishkek", "minsk", "kyiv", "baku", "tbilisi", "yerevan",
  "novosibirsk", "yekaterinburg", "kazan", "krasnoyarsk", "omsk", "vladivostok", "kaliningrad", "samara", "sochi",
  "london", "paris", "berlin", "rome", "madrid", "prague", "istanbul", "antalya", "dubai", "tel-aviv", "cairo",
  "delhi", "bangkok", "phuket", "bali", "beijing", "shanghai", "hong-kong", "seoul", "tokyo", "singapore",
  "new-york", "los-angeles", "chicago", "toronto", "miami", "mexico-city", "buenos-aires", "sydney",
];

const RELATED_TOOLS = ["world-clock", "time-zone-converter", "time-zones", "online-clock", "utc-time"];

export const TIME_TOOLS: TimeTool[] = [
  {
    slug: "time",
    component: "time/now",
    icon: "Clock",
    name: { ru: "Точное время", en: "Exact time" },
    title: { ru: "Точное время сейчас онлайн — часы с секундами", en: "Exact time now — current local time with seconds" },
    h1: { ru: "Точное время сейчас", en: "Exact time now" },
    description: {
      ru: `Точное время онлайн с секундами по часам вашего устройства: дата, день недели, номер недели, часовой пояс и смещение от UTC. Время в ${N}+ городах мира.`,
      en: `Exact time online with seconds from your device clock: date, weekday, week number, your time zone and UTC offset. Local time in ${N}+ cities worldwide.`,
    },
    lead: { ru: "Текущее время по часам вашего устройства — с секундами, датой и часовым поясом.", en: "The current time from your device clock — with seconds, date and time zone." },
    howTo: {
      ru: ["Откройте страницу — часы сразу покажут время вашего устройства с секундами.", "Под часами — дата, день недели, номер недели и ваш часовой пояс.", "Чтобы узнать время в другом городе, выберите его в списке ниже или воспользуйтесь поиском по сайту."],
      en: ["Open the page — the clock shows your device time with seconds right away.", "Below the clock you see the date, weekday, week number and your time zone.", "To see the time in another city, pick it from the list below or use the site search."],
    },
    about: {
      ru: [
        "Часы на этой странице показывают время системных часов вашего компьютера или телефона. Современные устройства синхронизируют их с серверами точного времени (NTP), поэтому расхождение обычно не превышает долей секунды. Если часы устройства сбиты вручную, страница покажет то же сбитое время — она не обращается к внешним серверам.",
        `Часовой пояс определяется браузером: вы увидите идентификатор зоны (например, Asia/Almaty) и смещение от UTC. Для более чем ${N} городов мира есть отдельные страницы с часовым поясом, переходом на летнее время, восходом и закатом.`,
      ],
      en: [
        "The clock shows the system time of your computer or phone. Modern devices sync it with network time servers (NTP), so it is usually accurate to a fraction of a second. If the device clock was set wrong manually, the page shows the same wrong time — it never contacts external servers.",
        `Your time zone is detected by the browser: you see the zone id (e.g. Europe/London) and the UTC offset. Over ${N} cities have their own pages with time zone, daylight saving time, sunrise and sunset.`,
      ],
    },
    faq: {
      ru: [
        { q: "Насколько точно показывается время?", a: "Настолько, насколько точны часы вашего устройства. Windows, macOS, Android и iOS по умолчанию синхронизируют время через интернет, и погрешность обычно меньше секунды. Если на странице время отличается от реального, проверьте в настройках устройства автоматическую установку времени." },
        { q: "Как узнать свой часовой пояс?", a: "Он показан под часами: например, «Asia/Almaty, UTC+5». Эти данные сообщает браузер по настройкам вашей системы." },
        { q: "Какой сейчас номер недели?", a: "Номер недели по ISO 8601 показан под датой. Неделя начинается в понедельник, первая неделя года — та, в которую попадает первый четверг января." },
        { q: "Почему время в Казахстане теперь одно?", a: "С 1 марта 2024 года весь Казахстан, включая Астану и Алматы, живёт по UTC+5. До этого большая часть страны жила по UTC+6." },
      ],
      en: [
        { q: "How accurate is this clock?", a: "As accurate as your device clock. Windows, macOS, Android and iOS sync time over the internet by default, so the error is usually below a second. If the time looks wrong, enable automatic time in your device settings." },
        { q: "How do I find my time zone?", a: "It is shown below the clock, e.g. 'Europe/London, UTC+1'. The browser reports it from your system settings." },
        { q: "What week number is it?", a: "The ISO 8601 week number is shown next to the date. Weeks start on Monday; week 1 is the week containing the first Thursday of January." },
        { q: "Can I see the time in another city?", a: "Yes — choose one of the cities below or use the world clock to follow several cities at once." },
      ],
    },
    related: ["world-clock", "time-zone-converter", "online-clock", "time-zones", "utc-time"],
    topBlocks: (locale) => {
      const ru = locale === "ru";
      const countries = [...COUNTRIES].sort((a, b) => (ru ? a.ru : a.en).localeCompare(ru ? b.ru : b.en, ru ? "ru" : "en"));
      return [
        { type: "links", title: ru ? "Время в городах" : "Time in cities", style: "chips", items: citiesBySlugs(POPULAR).map((c) => cityLink(c, locale)) },
        { type: "links", title: ru ? "Время в странах" : "Time by country", style: "chips", items: countries.map((c): LinkItem => ({ path: countryPath(c), label: ru ? c.ru : c.en })) },
      ];
    },
    keywords: { ru: ["который час", "сколько времени", "текущее время", "время сейчас"], en: ["what time is it", "current time", "time now"] },
  },
  {
    slug: "world-clock",
    component: "time/world",
    icon: "Globe",
    name: { ru: "Мировое время", en: "World clock" },
    title: { ru: "Мировое время — часы в разных городах онлайн", en: "World clock — current time in cities around the world" },
    h1: { ru: "Мировое время", en: "World clock" },
    description: {
      ru: `Мировое время онлайн: часы Москвы, Астаны, Лондона, Нью-Йорка, Дубая и Токио на одном экране. Добавьте любой из ${N}+ городов — список сохранится, видно день и ночь и разницу с вами.`,
      en: `World clock online: the time in Moscow, Astana, London, New York, Dubai and Tokyo on one screen. Add any of ${N}+ cities — your list is saved, with day/night and the difference from you.`,
    },
    lead: { ru: "Текущее время в нескольких городах сразу и разница с вашим временем.", en: "The current time in several cities at once and the difference from yours." },
    howTo: {
      ru: ["Вверху — ваше местное время.", "Ниже — часы выбранных городов: время, дата, разница с вами и признак дня или ночи.", "Добавьте город через поиск (по-русски или по-английски) или уберите лишний крестиком — список запоминается в браузере."],
      en: ["Your local time is at the top.", "Below are the clocks of your cities: time, date, difference from you and a day/night mark.", "Add a city via search (Russian or English names) or remove one with the cross — the list is remembered in your browser."],
    },
    about: {
      ru: [
        "Мировые часы удобны, когда коллеги, родственники или клиенты живут в других часовых поясах: сразу видно, не спят ли они и сколько у них сейчас времени.",
        "Время считается в браузере по базе часовых поясов IANA, поэтому переход на летнее время в Европе, США или Австралии учитывается автоматически. День и ночь определяются по реальной высоте солнца над горизонтом в каждом городе.",
      ],
      en: [
        "A world clock helps when colleagues, family or clients live in other time zones: you see at a glance what time it is there and whether they are awake.",
        "Times are calculated in your browser from the IANA time zone database, so daylight saving time in Europe, the US or Australia is applied automatically. Day and night are determined by the actual height of the sun in each city.",
      ],
    },
    faq: {
      ru: [
        { q: "Сохраняется ли мой список городов?", a: "Да, в памяти браузера (localStorage) на этом устройстве. На сервер ничего не отправляется." },
        { q: "Учитывается ли переход на летнее время?", a: "Да. Время каждого города считается по базе часовых поясов IANA, в которой записаны все переводы часов." },
        { q: "Как определяется день и ночь?", a: "По положению солнца: если в городе солнце выше горизонта, показывается значок солнца, если ниже — луны. Это точнее, чем правило «с 6 до 20»." },
        { q: "Какие города можно добавить?", a: `Любой из ${N}+ городов каталога: все столицы, города-миллионники, все областные центры Казахстана и крупные города России. Поиск понимает русские и английские названия.` },
      ],
      en: [
        { q: "Is my list saved?", a: "Yes, in your browser's local storage on this device. Nothing is sent to a server." },
        { q: "Is daylight saving time taken into account?", a: "Yes. Each city's time comes from the IANA time zone database, which contains all clock changes." },
        { q: "How is day or night determined?", a: "From the position of the sun: a sun icon when the sun is above the horizon in that city, a moon when it is below — more accurate than a fixed 6 am–8 pm rule." },
        { q: "Which cities can I add?", a: `Any of the ${N}+ cities in the catalogue: all capitals, cities over a million people, all regional centres of Kazakhstan and large Russian cities. Search accepts English and Russian names.` },
      ],
    },
    related: ["time-zone-converter", "time", "time-zones", "online-clock"],
    props: (locale) => ({ defaults: citiesBySlugs(DEFAULT_FAVORITES).map((c) => clientCity(c, locale)) } satisfies Omit<WorldClockProps, "locale">),
    keywords: { ru: ["часы мира", "время в мире", "мировые часы"], en: ["world time", "time around the world"] },
    wide: true,
  },
  {
    slug: "time-zone-converter",
    component: "time/convert",
    icon: "ArrowLeftRight",
    name: { ru: "Конвертер часовых поясов", en: "Time zone converter" },
    title: { ru: "Конвертер часовых поясов — перевод времени онлайн", en: "Time zone converter — convert time between cities" },
    h1: { ru: "Конвертер часовых поясов", en: "Time zone converter" },
    description: {
      ru: "Перевод времени между городами и часовыми поясами: выберите дату и час — конвертер покажет время в Москве, Астане, Лондоне, Нью-Йорке и других городах и подберёт удобное время для созвона.",
      en: "Convert time between cities and time zones: pick a date and hour and see the time in Moscow, Astana, London, New York and more, plus the best overlap for a meeting.",
    },
    lead: { ru: "Выберите время в одном городе — увидите, сколько будет в остальных.", en: "Pick a time in one city and see what time it is everywhere else." },
    howTo: {
      ru: ["Добавьте города или часовые пояса (MSK, UTC+5, EST) через поиск.", "Передвиньте ползунок или укажите дату — они задают время в первой строке, остальные строки пересчитаются сразу.", "Время можно ввести и прямо в любой строке: например, 15:00 в Лондоне — и увидеть, сколько это в Москве.", "Внизу — планировщик встреч: зелёным отмечены часы, когда у всех рабочее время."],
      en: ["Add cities or zones (MSK, UTC+5, EST) via search.", "Move the slider or set the date — they set the time of the first row, and the other rows update instantly.", "You can also type a time straight into any row: e.g. 15:00 in London, and see what that is in Moscow.", "The meeting planner below highlights the hours that are working hours for everyone."],
    },
    about: {
      ru: [
        "Конвертер учитывает переход на летнее время по выбранной дате: например, разница между Москвой и Лондоном — 3 часа зимой и 2 часа летом. Если в выбранный день где-то переводят часы, это видно по смещению в строке.",
        "Поиск понимает русские и английские названия городов, страны, аббревиатуры (MSK, CET, PST) и смещения вида UTC+5. Список городов на этой странице запоминается в браузере.",
      ],
      en: [
        "The converter applies daylight saving time for the chosen date: Moscow and London are 3 hours apart in winter and 2 in summer. If clocks change somewhere on that day, you see it in the row's offset.",
        "Search accepts city names in English and Russian, countries, abbreviations (MSK, CET, PST) and offsets like UTC+5. The list of cities on this page is remembered in your browser.",
      ],
    },
    faq: {
      ru: [
        { q: "Как перевести московское время в местное?", a: "Добавьте Москву и ваш город (или оставьте строку «Ваше время»), затем выставьте нужный час в строке Москвы — в вашей строке появится местное время." },
        { q: "Учитывается ли летнее время?", a: "Да, для выбранной даты. Поэтому результат для января и июля может отличаться на час." },
        { q: "Как подобрать время для созвона?", a: "Посмотрите на планировщик внизу: зелёные колонки — часы, когда во всех выбранных городах с 9:00 до 18:00." },
        { q: "Можно ли указать смещение, а не город?", a: "Да: введите в поиске UTC+5, GMT−3 или аббревиатуру вроде MSK, CET, EST." },
      ],
      en: [
        { q: "How do I convert Moscow time to my local time?", a: "Add Moscow and your city (or keep the 'Your time' row) and set the hour in the Moscow row — your row shows the local time." },
        { q: "Is daylight saving time applied?", a: "Yes, for the selected date, so January and July can differ by an hour." },
        { q: "How do I find a meeting time?", a: "Use the planner below: green columns are hours when it is 9:00–18:00 in every selected city." },
        { q: "Can I use an offset instead of a city?", a: "Yes: type UTC+5, GMT−3 or an abbreviation like MSK, CET or EST." },
      ],
    },
    related: ["world-clock", "time-zones", "time", "utc-time"],
    props: (locale) => ({ rows: citiesBySlugs(["moscow", "london", "new-york"]).map((c) => clientCity(c, locale)), withLocal: true, persist: true } satisfies Omit<ConverterProps, "locale">),
    topBlocks: (locale) => {
      const ru = locale === "ru";
      const pick = pairKeys().filter((k) => /^(moscow|almaty|astana)-to-/.test(k)).slice(0, 48);
      return [
        {
          type: "links",
          title: ru ? "Популярные пары городов" : "Popular city pairs",
          style: "chips",
          items: pick.map((k) => {
            const [a, b] = k.split("-to-");
            return { path: ["time-zone-converter", k], label: `${labelOf(a, locale)} → ${labelOf(b, locale)}` };
          }),
        },
      ];
    },
    keywords: { ru: ["перевод времени", "разница во времени", "конвертер времени"], en: ["time converter", "time difference", "meeting planner"] },
    wide: true,
  },
  {
    slug: "online-clock",
    component: "time/clock",
    icon: "AlarmClock",
    name: { ru: "Часы онлайн", en: "Online clock" },
    title: { ru: "Часы онлайн на весь экран — электронные часы с секундами", en: "Online clock — full-screen digital clock with seconds" },
    h1: { ru: "Часы онлайн на весь экран", en: "Full-screen online clock" },
    description: {
      ru: "Электронные часы онлайн на весь экран: крупные цифры с секундами, 24- или 12-часовой формат, дата и день недели. Подходят для презентаций, экзаменов, стримов и второго монитора.",
      en: "Full-screen digital clock online: big digits with seconds, 24- or 12-hour format, date and weekday. Great for presentations, exams, streams and a second monitor.",
    },
    lead: { ru: "Крупные цифровые часы, которые можно развернуть на весь экран.", en: "Big digital clock you can expand to full screen." },
    howTo: {
      ru: ["Часы сразу показывают время вашего устройства.", "Выберите формат (24 или 12 часов) и нужно ли показывать секунды и дату.", "Нажмите «На весь экран» или клавишу F; выход — Esc."],
      en: ["The clock shows your device time right away.", "Choose 24- or 12-hour format and whether to show seconds and the date.", "Press 'Full screen' or the F key; Esc exits."],
    },
    about: {
      ru: ["Цифры масштабируются под размер окна, поэтому часы хорошо видны с другого конца комнаты. В полноэкранном режиме экран не гаснет, пока вкладка открыта (если браузер поддерживает Screen Wake Lock).", "Время берётся с часов устройства и обновляется точно на границе каждой секунды."],
      en: ["The digits scale with the window, so the clock is readable across a room. In full screen the display stays on while the tab is open (if the browser supports Screen Wake Lock).", "The time comes from your device clock and updates exactly on each second boundary."],
    },
    faq: {
      ru: [
        { q: "Как развернуть часы на весь экран?", a: "Нажмите кнопку «На весь экран» или клавишу F. Чтобы выйти, нажмите Esc." },
        { q: "Не погаснет ли экран?", a: "В полноэкранном режиме страница просит браузер не отключать экран (Screen Wake Lock). В Chrome, Edge и Safari это работает; если браузер не поддерживает функцию, экран погаснет по настройкам системы." },
        { q: "Можно ли включить 12-часовой формат?", a: "Да, переключатель «12 ч» показывает время с AM/PM." },
      ],
      en: [
        { q: "How do I make the clock full screen?", a: "Press 'Full screen' or the F key. Press Esc to exit." },
        { q: "Will the screen turn off?", a: "In full screen the page asks the browser to keep the display on (Screen Wake Lock). This works in Chrome, Edge and Safari; otherwise your system settings apply." },
        { q: "Is a 12-hour format available?", a: "Yes, the '12 h' switch shows the time with AM/PM." },
      ],
    },
    related: ["flip-clock", "analog-clock", "time", "world-clock"],
    keywords: { ru: ["электронные часы", "цифровые часы", "часы на экран"], en: ["digital clock", "fullscreen clock", "desktop clock"] },
  },
  {
    slug: "flip-clock",
    component: "time/flip",
    icon: "Clock9",
    name: { ru: "Перекидные часы", en: "Flip clock" },
    title: { ru: "Перекидные часы онлайн — флип-часы на весь экран", en: "Flip clock online — full-screen flip clock" },
    h1: { ru: "Перекидные часы онлайн", en: "Flip clock online" },
    description: {
      ru: "Перекидные флип-часы онлайн: ретро-табло с перелистывающимися карточками, секунды, 24 или 12 часов, режим на весь экран. Красиво смотрятся на втором мониторе и в эфире.",
      en: "Flip clock online: a retro split-flap display with flipping cards, seconds, 24- or 12-hour format and full-screen mode. Looks great on a second monitor or on stream.",
    },
    lead: { ru: "Ретро-часы с перелистывающимися карточками — по времени вашего устройства.", en: "Retro split-flap clock driven by your device time." },
    howTo: {
      ru: ["Часы начинают идти сразу после открытия страницы.", "Включите или скройте секунды, выберите 24- или 12-часовой формат.", "Нажмите «На весь экран» (или F), чтобы убрать всё лишнее."],
      en: ["The clock starts right away.", "Show or hide seconds and choose 24- or 12-hour format.", "Press 'Full screen' (or F) to hide everything else."],
    },
    about: {
      ru: ["Анимация перелистывания сделана на CSS и не нагружает процессор. Если в системе включено «уменьшение движения», карточки меняются без анимации."],
      en: ["The flip animation is pure CSS and light on the CPU. If your system has 'reduce motion' enabled, cards change without animation."],
    },
    faq: {
      ru: [
        { q: "Можно ли убрать секунды?", a: "Да, переключателем «Секунды» — останутся только часы и минуты." },
        { q: "Работают ли часы без интернета?", a: "Да. После загрузки страницы время берётся с часов устройства, сеть не нужна." },
      ],
      en: [
        { q: "Can I hide the seconds?", a: "Yes, with the 'Seconds' switch — only hours and minutes remain." },
        { q: "Does it work offline?", a: "Yes. Once the page is loaded, the time comes from your device clock; no network is needed." },
      ],
    },
    related: ["online-clock", "analog-clock", "time"],
    keywords: { ru: ["флип часы", "ретро часы", "часы с карточками"], en: ["split flap clock", "retro clock"] },
  },
  {
    slug: "analog-clock",
    component: "time/analog",
    icon: "Clock3",
    name: { ru: "Аналоговые часы", en: "Analog clock" },
    title: { ru: "Аналоговые часы онлайн — часы со стрелками", en: "Analog clock online — clock with hands" },
    h1: { ru: "Аналоговые часы онлайн", en: "Analog clock online" },
    description: {
      ru: "Аналоговые часы со стрелками онлайн: плавная секундная стрелка, цифры на циферблате, дата и режим на весь экран. Удобно, чтобы учить ребёнка определять время по стрелкам.",
      en: "Analog clock with hands online: smooth second hand, numbered dial, date and full-screen mode. Handy for teaching kids to tell the time.",
    },
    lead: { ru: "Классический циферблат со стрелками по времени вашего устройства.", en: "A classic dial with hands, driven by your device time." },
    howTo: {
      ru: ["Часы идут сразу после открытия страницы.", "Под циферблатом показано то же время цифрами — удобно сверять при обучении.", "Кнопка «На весь экран» разворачивает циферблат."],
      en: ["The clock runs as soon as the page opens.", "The same time is shown in digits below the dial — handy for learning.", "'Full screen' expands the dial."],
    },
    about: {
      ru: ["Секундная стрелка движется плавно, часовая и минутная — тоже, как у настоящих кварцевых часов с плавным ходом. Циферблат рисуется в SVG и чётко выглядит на любом экране."],
      en: ["The second hand sweeps smoothly, and so do the hour and minute hands, like a real sweep-movement clock. The dial is SVG and stays sharp on any screen."],
    },
    faq: {
      ru: [
        { q: "Как научить ребёнка определять время по часам?", a: "Покажите, что короткая стрелка — часы, длинная — минуты, а цифры на циферблате умножаются на 5 для минут. Под циферблатом то же время написано цифрами, по нему удобно проверять ответ." },
        { q: "Можно ли развернуть часы на весь экран?", a: "Да, кнопкой «На весь экран» или клавишей F." },
      ],
      en: [
        { q: "How do I teach a child to read a clock?", a: "Show that the short hand is hours and the long hand is minutes, and that each number on the dial means 5 minutes. The digital time below the dial lets them check the answer." },
        { q: "Can the clock go full screen?", a: "Yes, with the 'Full screen' button or the F key." },
      ],
    },
    related: ["online-clock", "flip-clock", "time"],
    keywords: { ru: ["часы со стрелками", "циферблат онлайн"], en: ["clock face", "clock with hands"] },
  },
  {
    slug: "night-clock",
    component: "time/night",
    icon: "Moon",
    name: { ru: "Ночные часы", en: "Night clock" },
    title: { ru: "Ночные часы на экран | часы для тумбочки с тусклыми цифрами", en: "Night Clock — Dim Bedside Clock for Your Screen" },
    h1: { ru: "Ночные часы онлайн", en: "Night clock online" },
    description: {
      ru: "Ночные часы на телефон или планшет: тусклые красные, янтарные или зелёные цифры на чёрном фоне, регулировка яркости, дата и защита экрана от выгорания.",
      en: "A night clock for a phone or tablet: dim red, amber or green digits on black, adjustable brightness, the date and screen burn-in protection.",
    },
    lead: { ru: "Тусклые цифры на чёрном экране — видно время ночью, но свет не мешает спать.", en: "Dim digits on a black screen — you can see the time at night, but the light won't keep you awake." },
    howTo: {
      ru: ["Выберите цвет цифр — красный меньше всего мешает сну — и яркость.", "Нажмите «На весь экран» и положите телефон на тумбочку, лучше на зарядку.", "Яркость меняется прямо в полноэкранном режиме: коснитесь экрана и нажмите луну или солнце."],
      en: ["Pick a digit colour — red disturbs sleep least — and the brightness.", "Press Full screen and put the phone on the nightstand, ideally on a charger.", "Change brightness in full screen: tap the screen and press the moon or the sun."],
    },
    about: {
      ru: [
        "Синий и белый свет сильнее всего сбивает внутренние часы организма, а тусклый красный почти не мешает. Поэтому у ночных часов по умолчанию красные цифры на чёрном фоне: на OLED-экране чёрные пиксели не светятся вовсе.",
        "Чтобы цифры не «выжгли» экран за ночь, раз в минуту они плавно сдвигаются на несколько пикселей. Пока часы открыты на весь экран, телефон не гаснет.",
      ],
      en: [
        "Blue and white light upset the body clock the most, while dim red light barely does. That's why the night clock defaults to red digits on black: on an OLED screen the black pixels don't light up at all.",
        "To keep the digits from burning into the screen overnight, they drift a few pixels once a minute. The phone stays awake while the clock is full screen.",
      ],
    },
    faq: {
      ru: [
        { q: "Не разрядится ли телефон за ночь?", a: "Экран будет включён всю ночь, поэтому лучше поставить телефон на зарядку. На OLED-экране чёрный фон почти не тратит энергию." },
        { q: "Какой цвет лучше для сна?", a: "Красный или янтарный при низкой яркости. Белый и голубой свет сильнее подавляет мелатонин." },
        { q: "Почему экран всё равно гаснет?", a: "Не все браузеры позволяют сайту держать экран включённым. В Chrome, Edge и Safari 16.4+ это работает; иначе увеличьте время автоблокировки в настройках телефона." },
      ],
      en: [
        { q: "Won't the battery run down overnight?", a: "The screen stays on all night, so charge the phone. On OLED screens the black background uses almost no power." },
        { q: "Which colour is best for sleep?", a: "Red or amber at low brightness. White and blue light suppress melatonin more." },
        { q: "Why does the screen still turn off?", a: "Not every browser lets a site keep the screen on. Chrome, Edge and Safari 16.4+ do; otherwise increase auto-lock time in your phone settings." },
      ],
    },
    related: ["online-clock", "flip-clock", "alarm-clock", "noise-generator"],
    keywords: { ru: ["ночные часы", "часы для тумбочки", "прикроватные часы", "часы на ночь"], en: ["night clock", "bedside clock", "nightstand clock"] },
    blocks: (locale) => [
      {
        type: "facts",
        title: locale === "ru" ? "Какой свет меньше мешает сну" : "Which light disturbs sleep least",
        rows:
          locale === "ru"
            ? [
                ["Красный, янтарный", "почти не влияет на выработку мелатонина"],
                ["Зелёный", "заметнее, но мягче белого"],
                ["Белый, голубой", "сильнее всего сбивает внутренние часы"],
              ]
            : [
                ["Red, amber", "barely affects melatonin"],
                ["Green", "more noticeable, but softer than white"],
                ["White, blue", "upsets the body clock the most"],
              ],
      },
    ],
  },
  {
    slug: "learn-to-tell-time",
    component: "time/teach",
    icon: "GraduationCap",
    name: { ru: "Учимся определять время", en: "Learn to tell time" },
    title: { ru: "Учимся определять время по часам | учебные часы для детей", en: "Learn to Tell Time — Interactive Teaching Clock" },
    h1: { ru: "Учимся определять время по часам", en: "Learn to tell the time" },
    description: {
      ru: "Интерактивные учебные часы для детей: двигайте стрелки и смотрите, как время называется словами — «четверть третьего», «без двадцати четыре». Есть тренажёр с заданиями.",
      en: "An interactive teaching clock for kids: move the hands and see the time in words — quarter past two, twenty to four. With practice quizzes.",
    },
    lead: { ru: "Двигайте стрелки — часы покажут время цифрами и словами. Потом проверьте себя в тренажёре.", en: "Move the hands to see the time in digits and words. Then test yourself with the quizzes." },
    howTo: {
      ru: ["В режиме «Изучать» тяните стрелки: короткая красная — часы, длинная синяя — минуты.", "Под часами время написано цифрами и словами, как его говорят: «половина пятого».", "В режимах «Сколько времени?» и «Поставь стрелки» ребёнок решает задания, а сложность растёт от целых часов до минут."],
      en: ["In Explore mode drag the hands: the short red one is hours, the long blue one minutes.", "Below the clock the time is written in digits and in words, the way people say it.", "In What time is it? and Set the clock, kids solve tasks from whole hours up to single minutes."],
    },
    about: {
      ru: [
        "По-русски время по стрелкам называют иначе, чем по электронным часам: 15:40 — это «без двадцати четыре», а 2:15 — «четверть третьего». Часы показывают оба варианта, поэтому ребёнок сразу видит связь.",
        "Синие цифры по краю циферблата подсказывают минуты: 1 — это 5 минут, 3 — 15, 6 — 30. Когда ребёнок освоится, подсказку можно выключить.",
      ],
      en: [
        "On a clock face we say the time differently from a digital display: 3:40 is twenty to four and 2:15 is quarter past two. The clock shows both, so kids see the link right away.",
        "Blue numbers around the edge show the minutes: 1 means 5 minutes, 3 means 15, 6 means 30. Turn the hint off once your child is confident.",
      ],
    },
    faq: {
      ru: [
        { q: "С какого возраста учить время по часам?", a: "Обычно с 5–7 лет: сначала целые часы, потом половины и четверти, затем 5 минут и минуты. В тренажёре так и устроены уровни сложности." },
        { q: "Как объяснить «без двадцати четыре»?", a: "После половины часа считают, сколько минут осталось до следующего часа: 15:40 — до четырёх осталось двадцать минут, поэтому «без двадцати четыре»." },
        { q: "Почему часовая стрелка стоит между цифрами?", a: "Она движется постепенно: в половине третьего она ровно посередине между 2 и 3. Часы показывают это так же, как настоящие." },
      ],
      en: [
        { q: "At what age do kids learn to tell time?", a: "Usually at 5–7: whole hours first, then half and quarter hours, then 5 minutes and single minutes. The quiz levels follow that order." },
        { q: "How do I explain “twenty to four”?", a: "After half past, we count the minutes left until the next hour: at 3:40 there are twenty minutes to four." },
        { q: "Why is the hour hand between two numbers?", a: "It moves gradually: at half past two it is exactly halfway between 2 and 3, just like on a real clock." },
      ],
    },
    related: ["analog-clock", "online-clock", "timer", "random-number-generator"],
    keywords: { ru: ["учебные часы", "часы для детей", "учимся определять время", "как определять время по часам", "тренажёр часы"], en: ["teaching clock", "learn to tell time", "clock for kids", "telling time practice"] },
    wide: true,
    blocks: (locale) => {
      const rows: [number, number][] = [[3, 0], [3, 5], [3, 15], [3, 30], [3, 40], [3, 45], [3, 55], [12, 0], [0, 15]];
      return [
        {
          type: "table",
          title: locale === "ru" ? "Как называть время по-русски" : "Saying the time in English",
          head: locale === "ru" ? ["Цифрами", "Говорят", "Официально"] : ["Digits", "We say"],
          rows: rows.map(([h, m]) => {
            const hh = locale === "ru" ? h + (h === 3 ? 12 : 0) : h;
            return locale === "ru" ? [`${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`, ruSpoken(hh, m), ruOfficial(hh, m)] : [`${h === 0 ? 12 : h}:${String(m).padStart(2, "0")}`, enSpoken(h, m)];
          }),
        },
      ];
    },
  },
  {
    slug: "utc-time",
    component: "time/utc",
    icon: "Globe2",
    name: { ru: "Время UTC", en: "UTC time" },
    title: { ru: "Время UTC сейчас — всемирное координированное время", en: "Current UTC time — Coordinated Universal Time now" },
    h1: { ru: "Время UTC сейчас", en: "Current UTC time" },
    description: {
      ru: "Точное время UTC онлайн с секундами: всемирное координированное время, дата, запись ISO 8601, Unix-время и разница UTC с вашим часовым поясом, с Москвой (UTC+3) и Астаной (UTC+5).",
      en: "Current UTC time with seconds: Coordinated Universal Time, date, ISO 8601 notation, Unix time and the difference between UTC and your time zone, Moscow (UTC+3) and Astana (UTC+5).",
    },
    lead: { ru: "Всемирное координированное время — точка отсчёта для всех часовых поясов.", en: "Coordinated Universal Time — the reference for every time zone." },
    howTo: {
      ru: ["Крупно показано текущее время UTC с секундами.", "Ниже — дата, запись в формате ISO 8601 и Unix-время; их можно скопировать.", "Разница с вашим временем показана в строке «Вы»."],
      en: ["The current UTC time with seconds is shown large.", "Below: the date, the ISO 8601 string and Unix time — each can be copied.", "The difference from your time is in the 'You' row."],
    },
    about: {
      ru: [
        "UTC (Coordinated Universal Time) — шкала времени, по которой синхронизируются часы, серверы и навигационные системы. Она не переходит на летнее время. Время любого пояса записывают как смещение от UTC: Москва — UTC+3, Астана и Алматы — UTC+5, Нью-Йорк — UTC−5 зимой.",
        "Для бытовых целей UTC совпадает с GMT. В авиации и у военных UTC называют «Zulu time» (Z): 12:00Z — это 12:00 UTC.",
      ],
      en: [
        "UTC (Coordinated Universal Time) is the time scale clocks, servers and navigation systems are synchronised to. It never changes for daylight saving. Every zone is written as an offset from UTC: Moscow is UTC+3, Astana and Almaty UTC+5, New York UTC−5 in winter.",
        "For everyday use UTC equals GMT. Aviation and the military call it 'Zulu time' (Z): 12:00Z means 12:00 UTC.",
      ],
    },
    faq: {
      ru: [
        { q: "Сколько сейчас времени по UTC в Москве?", a: "Москва живёт по UTC+3: чтобы получить московское время, прибавьте к UTC 3 часа. 12:00 UTC = 15:00 MSK." },
        { q: "Какая разница между UTC и временем в Казахстане?", a: "С 1 марта 2024 года весь Казахстан живёт по UTC+5: 12:00 UTC = 17:00 в Астане и Алматы." },
        { q: "Переходит ли UTC на летнее время?", a: "Нет. UTC одинаково круглый год, меняются только смещения стран, которые переводят часы." },
        { q: "Что такое Z в конце времени, например 2026-03-08T12:00:00Z?", a: "Буква Z означает UTC («Zulu»). Такая запись — стандарт ISO 8601." },
      ],
      en: [
        { q: "How do I convert UTC to Moscow time?", a: "Moscow is UTC+3: add 3 hours. 12:00 UTC = 15:00 MSK." },
        { q: "What is the difference between UTC and Kazakhstan time?", a: "Since 1 March 2024 all of Kazakhstan is on UTC+5: 12:00 UTC = 17:00 in Astana and Almaty." },
        { q: "Does UTC change for daylight saving time?", a: "No. UTC is the same all year; only the offsets of countries that change clocks shift." },
        { q: "What does the Z in 2026-03-08T12:00:00Z mean?", a: "Z stands for UTC ('Zulu'). The notation is ISO 8601." },
      ],
    },
    related: ["time-zones", "time-zone-converter", "time", "world-clock"],
    keywords: { ru: ["utc время", "время по гринвичу", "gmt сейчас", "zulu"], en: ["utc now", "gmt time", "zulu time"] },
  },
];

function labelOf(slug: string, locale: Locale): string {
  const c = citiesBySlugs([slug])[0];
  return c ? cityLabel(c, locale) : slug.toUpperCase();
}

export const TOOL_BY_SLUG = new Map(TIME_TOOLS.map((t) => [t.slug, t]));

export function toolLink(t: TimeTool, locale: Locale): LinkItem {
  return { path: [t.slug], label: t.name[locale], hint: t.lead[locale], icon: t.icon, hue: HUE };
}

/** Related keys of time tools point to other time tools. */
function relatedLink(key: string, locale: Locale): LinkItem | null {
  const t = TOOL_BY_SLUG.get(key);
  if (t) return toolLink(t, locale);
  if (key === "time-zones") return { path: ["time-zones"], label: locale === "ru" ? "Часовые пояса мира" : "World time zones", hint: locale === "ru" ? "Все пояса от UTC−12 до UTC+14 и текущее время в каждом" : "Every zone from UTC−12 to UTC+14 with its current time", icon: "Globe", hue: HUE };
  // Tools of other sections (timer, noise generator…); skipped while building a page only for a link.
  return isResolvingRelated() ? null : resolveRelatedKey(key, locale);
}

export function timeToolPage(t: TimeTool, locale: Locale): PageModel {
  const blocks: Block[] = [...(t.blocks?.(locale) ?? [])];
  if (t.about[locale].length) blocks.push({ type: "text", title: ui(locale).about, paragraphs: t.about[locale] });
  const related = [...t.related, ...RELATED_TOOLS]
    .filter((k, i, a) => k !== t.slug && a.indexOf(k) === i)
    .map((k) => relatedLink(k, locale))
    .filter((x): x is LinkItem => !!x)
    .slice(0, 6);
  const props = t.props?.(locale);
  return {
    path: [t.slug],
    sectionId: "time",
    kind: "tool",
    title: t.title[locale],
    h1: t.h1[locale],
    description: t.description[locale],
    lead: t.lead[locale],
    breadcrumbs: [home(locale)],
    tool: { id: t.component, props },
    topBlocks: t.topBlocks?.(locale),
    blocks,
    howTo: t.howTo[locale],
    faq: t.faq[locale],
    related,
    schemaType: "WebApplication",
    icon: t.icon,
    hue: HUE,
    wide: t.wide,
  };
}
