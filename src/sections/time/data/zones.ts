import type { L10n } from "@/i18n/config";
import { offsetSlug } from "../lib/tz";

/** A time-zone page: a plain UTC offset or a named abbreviation. */
export interface ZoneDef {
  slug: string;
  kind: "offset" | "abbr";
  /** Fixed offset in minutes east of UTC. */
  offset: number;
  /** "MSK", "CET" … (abbr pages) */
  abbr?: string;
  /** English full name: "Central European Time" */
  full?: string;
  /** Russian name: «Центральноевропейское время» */
  ru?: string;
  /** Where it is used (prose, both locales). */
  used?: L10n;
  /** A generic US/EU name that follows DST (ET, PT): live clock uses this IANA zone. */
  tz?: string;
  /** Slug of the summer/winter counterpart (cet ↔ cest). */
  pair?: string;
  /** Ambiguity or other important note. */
  note?: L10n;
  /** Russian «МСК+N» relation for Russian zones. */
  msk?: number;
}

/* ───────────── plain offsets ───────────── */

const PLUS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((h) => h * 60);
const PLUS_FRAC = [210, 270, 330, 345, 390, 525, 570, 630, 765];
const MINUS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => -h * 60);
const MINUS_FRAC = [-150, -210, -570];

export const OFFSET_ZONES: ZoneDef[] = [
  { slug: "utc", kind: "offset", offset: 0 },
  { slug: "gmt", kind: "abbr", offset: 0, abbr: "GMT", full: "Greenwich Mean Time", ru: "Среднее время по Гринвичу", used: { ru: "Великобритания и Ирландия зимой, Исландия, Гана, Сенегал, Кот-д’Ивуар и другие страны Западной Африки круглый год", en: "the UK and Ireland in winter, Iceland, Ghana, Senegal, Côte d'Ivoire and other West African countries all year" }, note: { ru: "GMT — астрономическое время меридиана Гринвича. В быту GMT и UTC совпадают, но UTC — атомная шкала, а GMT сегодня — название часового пояса.", en: "GMT is the mean solar time at Greenwich. In everyday use GMT equals UTC, but UTC is the atomic time standard while GMT is now the name of a time zone." } },
  ...[...PLUS, ...PLUS_FRAC, ...MINUS, ...MINUS_FRAC].sort((a, b) => a - b).map((o): ZoneDef => ({ slug: offsetSlug(o), kind: "offset", offset: o })),
];

/* ───────────── abbreviations ───────────── */

const A = (d: Omit<ZoneDef, "kind">): ZoneDef => ({ kind: "abbr", ...d });

export const ABBR_ZONES: ZoneDef[] = [
  A({ slug: "msk", abbr: "MSK", offset: 180, full: "Moscow Standard Time", ru: "Московское время", msk: 0, used: { ru: "Москва, Санкт-Петербург и большая часть европейской России (Казань, Нижний Новгород, Воронеж, Ростов-на-Дону, Краснодар, Сочи, Мурманск, Архангельск); круглый год, без перехода на летнее время", en: "Moscow, Saint Petersburg and most of European Russia (Kazan, Nizhny Novgorod, Voronezh, Rostov-on-Don, Krasnodar, Sochi, Murmansk); all year, no daylight saving time" }, note: { ru: "От московского времени отсчитываются все часовые пояса России: МСК−1 (Калининград) … МСК+9 (Камчатка, Чукотка). С 26 октября 2014 года Россия не переводит часы.", en: "All Russian time zones are expressed relative to Moscow time: MSK−1 (Kaliningrad) to MSK+9 (Kamchatka, Chukotka). Russia has not changed clocks since 26 October 2014." } }),
  A({ slug: "cet", abbr: "CET", offset: 60, full: "Central European Time", ru: "Центральноевропейское время", pair: "cest", used: { ru: "зимой: Германия, Франция, Италия, Испания, Польша, Чехия, Австрия, Швейцария, Нидерланды, Бельгия, Швеция, Норвегия, Дания, Венгрия, Сербия, Хорватия; круглый год — Алжир и Тунис", en: "in winter: Germany, France, Italy, Spain, Poland, Czechia, Austria, Switzerland, the Netherlands, Belgium, Sweden, Norway, Denmark, Hungary, Serbia, Croatia; all year — Algeria and Tunisia" } }),
  A({ slug: "cest", abbr: "CEST", offset: 120, full: "Central European Summer Time", ru: "Центральноевропейское летнее время", pair: "cet", tz: undefined, used: { ru: "летом (с последнего воскресенья марта до последнего воскресенья октября) — страны центральноевропейского времени: Германия, Франция, Италия, Испания, Польша, Чехия и другие", en: "in summer (last Sunday of March to last Sunday of October) — the Central European Time countries: Germany, France, Italy, Spain, Poland, Czechia and others" } }),
  A({ slug: "eet", abbr: "EET", offset: 120, full: "Eastern European Time", ru: "Восточноевропейское время", pair: "eest", used: { ru: "зимой: Финляндия, Эстония, Латвия, Литва, Украина, Молдова, Румыния, Болгария, Греция, Кипр, Египет; круглый год — Калининград и Ливия", en: "in winter: Finland, Estonia, Latvia, Lithuania, Ukraine, Moldova, Romania, Bulgaria, Greece, Cyprus, Egypt; all year — Kaliningrad and Libya" } }),
  A({ slug: "eest", abbr: "EEST", offset: 180, full: "Eastern European Summer Time", ru: "Восточноевропейское летнее время", pair: "eet", used: { ru: "летом: Финляндия, страны Балтии, Украина, Молдова, Румыния, Болгария, Греция, Кипр; в Египте — с последней пятницы апреля до последнего четверга октября", en: "in summer: Finland, the Baltic states, Ukraine, Moldova, Romania, Bulgaria, Greece, Cyprus; in Egypt from the last Friday of April to the last Thursday of October" } }),
  A({ slug: "wet", abbr: "WET", offset: 0, full: "Western European Time", ru: "Западноевропейское время", pair: "west", used: { ru: "зимой: Португалия (кроме Азорских островов), Канарские острова, Фарерские острова", en: "in winter: Portugal (except the Azores), the Canary Islands, the Faroe Islands" } }),
  A({ slug: "west", abbr: "WEST", offset: 60, full: "Western European Summer Time", ru: "Западноевропейское летнее время", pair: "wet", used: { ru: "летом: Португалия, Канарские и Фарерские острова", en: "in summer: Portugal, the Canary Islands and the Faroe Islands" } }),
  A({ slug: "bst", abbr: "BST", offset: 60, full: "British Summer Time", ru: "Британское летнее время", pair: "gmt", used: { ru: "Великобритания с последнего воскресенья марта до последнего воскресенья октября; зимой там действует GMT (UTC+0)", en: "the United Kingdom from the last Sunday of March to the last Sunday of October; GMT (UTC+0) applies in winter" } }),
  A({ slug: "est", abbr: "EST", offset: -300, full: "Eastern Standard Time", ru: "Восточное стандартное время (США)", pair: "edt", used: { ru: "зимой восточное побережье США и Канады: Нью-Йорк, Вашингтон, Бостон, Майами, Атланта, Торонто, Монреаль; круглый год — Панама, Ямайка и мексиканский Канкун", en: "in winter the US and Canadian east coast: New York, Washington, Boston, Miami, Atlanta, Toronto, Montreal; all year — Panama, Jamaica and Cancún" }, note: { ru: "Летом (со второго воскресенья марта до первого воскресенья ноября) эти города переходят на EDT (UTC−4). Если в анонсе написано «EST» летом, скорее всего, имеется в виду EDT.", en: "In summer (second Sunday of March to first Sunday of November) these cities use EDT (UTC−4). “EST” written in summer usually means EDT." } }),
  A({ slug: "edt", abbr: "EDT", offset: -240, full: "Eastern Daylight Time", ru: "Восточное летнее время (США)", pair: "est", used: { ru: "летом восточное побережье США и Канады: Нью-Йорк, Вашингтон, Бостон, Майами, Торонто, Монреаль", en: "in summer the US and Canadian east coast: New York, Washington, Boston, Miami, Toronto, Montreal" } }),
  A({ slug: "cst", abbr: "CST", offset: -360, full: "Central Standard Time", ru: "Центральное стандартное время (США)", pair: "cdt", used: { ru: "зимой центральные штаты США и Канады: Чикаго, Хьюстон, Даллас, Новый Орлеан, Виннипег; круглый год — Мехико, Гватемала, Коста-Рика и канадская провинция Саскачеван", en: "in winter the central US and Canada: Chicago, Houston, Dallas, New Orleans, Winnipeg; all year — Mexico City, Guatemala, Costa Rica and Saskatchewan" }, note: { ru: "CST также означает China Standard Time — китайское время UTC+8. Смотрите по контексту.", en: "CST also stands for China Standard Time (UTC+8) — check the context." } }),
  A({ slug: "cdt", abbr: "CDT", offset: -300, full: "Central Daylight Time", ru: "Центральное летнее время (США)", pair: "cst", used: { ru: "летом Чикаго, Хьюстон, Даллас, Новый Орлеан, Миннеаполис, Виннипег", en: "in summer Chicago, Houston, Dallas, New Orleans, Minneapolis, Winnipeg" } }),
  A({ slug: "mst", abbr: "MST", offset: -420, full: "Mountain Standard Time", ru: "Горное стандартное время (США)", pair: "mdt", used: { ru: "зимой Денвер, Солт-Лейк-Сити, Калгари, Эдмонтон; круглый год — Аризона (Финикс) и мексиканский штат Сонора", en: "in winter Denver, Salt Lake City, Calgary, Edmonton; all year — Arizona (Phoenix) and Sonora, Mexico" } }),
  A({ slug: "mdt", abbr: "MDT", offset: -360, full: "Mountain Daylight Time", ru: "Горное летнее время (США)", pair: "mst", used: { ru: "летом Денвер, Солт-Лейк-Сити, Бойсе, Калгари, Эдмонтон (Аризона не переходит)", en: "in summer Denver, Salt Lake City, Boise, Calgary, Edmonton (Arizona does not switch)" } }),
  A({ slug: "pst", abbr: "PST", offset: -480, full: "Pacific Standard Time", ru: "Тихоокеанское стандартное время (США)", pair: "pdt", used: { ru: "зимой западное побережье США и Канады: Лос-Анджелес, Сан-Франциско, Сиэтл, Лас-Вегас, Ванкувер", en: "in winter the US and Canadian west coast: Los Angeles, San Francisco, Seattle, Las Vegas, Vancouver" } }),
  A({ slug: "pdt", abbr: "PDT", offset: -420, full: "Pacific Daylight Time", ru: "Тихоокеанское летнее время (США)", pair: "pst", used: { ru: "летом Лос-Анджелес, Сан-Франциско, Сиэтл, Лас-Вегас, Портленд, Ванкувер", en: "in summer Los Angeles, San Francisco, Seattle, Las Vegas, Portland, Vancouver" } }),
  A({ slug: "akst", abbr: "AKST", offset: -540, full: "Alaska Standard Time", ru: "Аляскинское стандартное время", used: { ru: "Аляска зимой (Анкоридж, Джуно); летом — AKDT, UTC−8", en: "Alaska in winter (Anchorage, Juneau); AKDT (UTC−8) in summer" } }),
  A({ slug: "hst", abbr: "HST", offset: -600, full: "Hawaii–Aleutian Standard Time", ru: "Гавайское стандартное время", used: { ru: "Гавайи (Гонолулу) круглый год — летнее время там не используется", en: "Hawaii (Honolulu) all year — no daylight saving time" } }),
  A({ slug: "ast", abbr: "AST", offset: -240, full: "Atlantic Standard Time", ru: "Атлантическое стандартное время", used: { ru: "Пуэрто-Рико, Доминиканская Республика, Барбадос и другие острова Карибского моря круглый год; канадские Новая Шотландия и Нью-Брансуик зимой", en: "Puerto Rico, the Dominican Republic, Barbados and other Caribbean islands all year; Nova Scotia and New Brunswick in winter" }, note: { ru: "AST также используют для Arabia Standard Time (UTC+3, Саудовская Аравия, Ирак, Кувейт).", en: "AST is also used for Arabia Standard Time (UTC+3: Saudi Arabia, Iraq, Kuwait)." } }),
  A({ slug: "ist", abbr: "IST", offset: 330, full: "India Standard Time", ru: "Индийское стандартное время", used: { ru: "вся Индия круглый год: Дели, Мумбаи, Бангалор, Гоа; то же смещение у Шри-Ланки", en: "all of India all year: Delhi, Mumbai, Bengaluru, Goa; Sri Lanka uses the same offset" }, note: { ru: "IST также означает Israel Standard Time (UTC+2) и Irish Standard Time (UTC+1, летнее время Ирландии).", en: "IST also stands for Israel Standard Time (UTC+2) and Irish Standard Time (UTC+1, Ireland's summer time)." } }),
  A({ slug: "pkt", abbr: "PKT", offset: 300, full: "Pakistan Standard Time", ru: "Пакистанское время", used: { ru: "Пакистан круглый год: Карачи, Лахор, Исламабад", en: "Pakistan all year: Karachi, Lahore, Islamabad" } }),
  A({ slug: "gst", abbr: "GST", offset: 240, full: "Gulf Standard Time", ru: "Время Персидского залива", used: { ru: "ОАЭ (Дубай, Абу-Даби) и Оман круглый год", en: "the UAE (Dubai, Abu Dhabi) and Oman all year" } }),
  A({ slug: "ict", abbr: "ICT", offset: 420, full: "Indochina Time", ru: "Индокитайское время", used: { ru: "Таиланд, Вьетнам, Камбоджа и Лаос круглый год: Бангкок, Пхукет, Ханой, Хошимин, Нячанг", en: "Thailand, Vietnam, Cambodia and Laos all year: Bangkok, Phuket, Hanoi, Ho Chi Minh City" } }),
  A({ slug: "wib", abbr: "WIB", offset: 420, full: "Western Indonesia Time", ru: "Западноиндонезийское время", used: { ru: "запад Индонезии: Джакарта, Сурабая, Бандунг, Медан (Бали живёт по WITA, UTC+8)", en: "western Indonesia: Jakarta, Surabaya, Bandung, Medan (Bali uses WITA, UTC+8)" } }),
  A({ slug: "hkt", abbr: "HKT", offset: 480, full: "Hong Kong Time", ru: "Гонконгское время", used: { ru: "Гонконг круглый год; совпадает с пекинским временем", en: "Hong Kong all year; same as Beijing time" } }),
  A({ slug: "sgt", abbr: "SGT", offset: 480, full: "Singapore Time", ru: "Сингапурское время", used: { ru: "Сингапур круглый год; то же смещение у Малайзии, Филиппин и Китая", en: "Singapore all year; Malaysia, the Philippines and China use the same offset" } }),
  A({ slug: "jst", abbr: "JST", offset: 540, full: "Japan Standard Time", ru: "Японское стандартное время", used: { ru: "вся Япония круглый год: Токио, Осака, Киото, Саппоро", en: "all of Japan all year: Tokyo, Osaka, Kyoto, Sapporo" } }),
  A({ slug: "kst", abbr: "KST", offset: 540, full: "Korea Standard Time", ru: "Корейское стандартное время", used: { ru: "Южная Корея (Сеул, Пусан) и Северная Корея круглый год", en: "South Korea (Seoul, Busan) and North Korea all year" } }),
  A({ slug: "awst", abbr: "AWST", offset: 480, full: "Australian Western Standard Time", ru: "Западноавстралийское время", used: { ru: "Западная Австралия (Перт) круглый год", en: "Western Australia (Perth) all year" } }),
  A({ slug: "acst", abbr: "ACST", offset: 570, full: "Australian Central Standard Time", ru: "Центральноавстралийское время", used: { ru: "Северная территория (Дарвин) круглый год, Южная Австралия (Аделаида) зимой", en: "the Northern Territory (Darwin) all year, South Australia (Adelaide) in winter" } }),
  A({ slug: "aest", abbr: "AEST", offset: 600, full: "Australian Eastern Standard Time", ru: "Восточноавстралийское время", pair: "aedt", used: { ru: "Квинсленд (Брисбен) круглый год; Сидней, Мельбурн, Канберра и Хобарт — с апреля по октябрь", en: "Queensland (Brisbane) all year; Sydney, Melbourne, Canberra and Hobart from April to October" } }),
  A({ slug: "aedt", abbr: "AEDT", offset: 660, full: "Australian Eastern Daylight Time", ru: "Восточноавстралийское летнее время", pair: "aest", used: { ru: "Сидней, Мельбурн, Канберра и Хобарт с первого воскресенья октября до первого воскресенья апреля", en: "Sydney, Melbourne, Canberra and Hobart from the first Sunday of October to the first Sunday of April" } }),
  A({ slug: "nzst", abbr: "NZST", offset: 720, full: "New Zealand Standard Time", ru: "Новозеландское стандартное время", pair: "nzdt", used: { ru: "Новая Зеландия (Окленд, Веллингтон) с апреля по сентябрь", en: "New Zealand (Auckland, Wellington) from April to September" } }),
  A({ slug: "nzdt", abbr: "NZDT", offset: 780, full: "New Zealand Daylight Time", ru: "Новозеландское летнее время", pair: "nzst", used: { ru: "Новая Зеландия с последнего воскресенья сентября до первого воскресенья апреля", en: "New Zealand from the last Sunday of September to the first Sunday of April" } }),
  A({ slug: "samt", abbr: "SAMT", offset: 240, full: "Samara Time", ru: "Самарское время", msk: 1, used: { ru: "Самарская, Саратовская, Ульяновская и Астраханская области, Удмуртия (Ижевск)", en: "Samara, Saratov, Ulyanovsk and Astrakhan regions and Udmurtia (Izhevsk)" } }),
  A({ slug: "yekt", abbr: "YEKT", offset: 300, full: "Yekaterinburg Time", ru: "Екатеринбургское время", msk: 2, used: { ru: "Урал: Екатеринбург, Челябинск, Пермь, Уфа, Тюмень, Оренбург, Курган, Сургут, Ханты-Мансийск", en: "the Urals: Yekaterinburg, Chelyabinsk, Perm, Ufa, Tyumen, Orenburg, Kurgan, Surgut" } }),
  A({ slug: "omst", abbr: "OMST", offset: 360, full: "Omsk Time", ru: "Омское время", msk: 3, used: { ru: "Омская область", en: "Omsk Oblast" } }),
  A({ slug: "krat", abbr: "KRAT", offset: 420, full: "Krasnoyarsk Time", ru: "Красноярское время", msk: 4, used: { ru: "Красноярский край, Хакасия, Тыва, Кемеровская область; то же смещение у Новосибирска, Томска и Барнаула", en: "Krasnoyarsk Krai, Khakassia, Tuva, Kemerovo Oblast; Novosibirsk, Tomsk and Barnaul use the same offset" } }),
  A({ slug: "irkt", abbr: "IRKT", offset: 480, full: "Irkutsk Time", ru: "Иркутское время", msk: 5, used: { ru: "Иркутская область и Бурятия (Улан-Удэ)", en: "Irkutsk Oblast and Buryatia (Ulan-Ude)" } }),
  A({ slug: "yakt", abbr: "YAKT", offset: 540, full: "Yakutsk Time", ru: "Якутское время", msk: 6, used: { ru: "большая часть Якутии, Амурская область (Благовещенск), Забайкальский край (Чита)", en: "most of Yakutia, Amur Oblast (Blagoveshchensk), Zabaykalsky Krai (Chita)" } }),
  A({ slug: "vlat", abbr: "VLAT", offset: 600, full: "Vladivostok Time", ru: "Владивостокское время", msk: 7, used: { ru: "Приморский и Хабаровский края, Еврейская автономная область", en: "Primorsky and Khabarovsk Krais, the Jewish Autonomous Oblast" } }),
  A({ slug: "magt", abbr: "MAGT", offset: 660, full: "Magadan Time", ru: "Магаданское время", msk: 8, used: { ru: "Магаданская и Сахалинская области, северо-восток Якутии", en: "Magadan and Sakhalin Oblasts, north-eastern Yakutia" } }),
  A({ slug: "pett", abbr: "PETT", offset: 720, full: "Kamchatka Time", ru: "Камчатское время", msk: 9, used: { ru: "Камчатский край (Петропавловск-Камчатский) и Чукотка (Анадырь)", en: "Kamchatka Krai (Petropavlovsk-Kamchatsky) and Chukotka (Anadyr)" } }),
  A({ slug: "et", abbr: "ET", offset: -300, tz: "America/New_York", full: "Eastern Time", ru: "Восточное время (США)", used: { ru: "восточное побережье США и Канады; зимой это EST (UTC−5), летом — EDT (UTC−4)", en: "the US and Canadian east coast; EST (UTC−5) in winter and EDT (UTC−4) in summer" } }),
  A({ slug: "ct", abbr: "CT", offset: -360, tz: "America/Chicago", full: "Central Time", ru: "Центральное время (США)", used: { ru: "центральные штаты США; зимой CST (UTC−6), летом CDT (UTC−5)", en: "the central United States; CST (UTC−6) in winter and CDT (UTC−5) in summer" } }),
  A({ slug: "mt", abbr: "MT", offset: -420, tz: "America/Denver", full: "Mountain Time", ru: "Горное время (США)", used: { ru: "горные штаты США; зимой MST (UTC−7), летом MDT (UTC−6); Аризона круглый год на MST", en: "the US Mountain states; MST (UTC−7) in winter and MDT (UTC−6) in summer; Arizona stays on MST" } }),
  A({ slug: "pt", abbr: "PT", offset: -480, tz: "America/Los_Angeles", full: "Pacific Time", ru: "Тихоокеанское время (США)", used: { ru: "западное побережье США и Канады; зимой PST (UTC−8), летом PDT (UTC−7)", en: "the US and Canadian west coast; PST (UTC−8) in winter and PDT (UTC−7) in summer" } }),
];

export const ZONES: ZoneDef[] = [...OFFSET_ZONES, ...ABBR_ZONES];
export const zoneBySlug = new Map(ZONES.map((z) => [z.slug, z]));

/* ───────────── converter pairs ───────────── */

/** Cities of the main audience (RU/KZ/CIS) … */
export const PAIR_HOME = ["moscow", "almaty", "astana", "kyiv", "minsk", "tashkent", "bishkek"];
/** … paired with the most searched world cities. */
export const PAIR_WORLD = ["london", "new-york", "los-angeles", "chicago", "toronto", "berlin", "paris", "istanbul", "dubai", "delhi", "bangkok", "beijing", "singapore", "seoul", "tokyo", "sydney"];
/** Moscow ↔ neighbours. */
const PAIR_MOSCOW = ["almaty", "astana", "kyiv", "minsk", "tashkent", "bishkek", "yekaterinburg", "novosibirsk", "vladivostok"];
/** Zone ↔ zone pairs. */
const PAIR_ZONES: [string, string][] = [
  ["utc", "msk"],
  ["gmt", "msk"],
  ["cet", "msk"],
  ["eet", "msk"],
  ["est", "msk"],
  ["pst", "msk"],
  ["pst", "est"],
  ["cst", "est"],
  ["utc", "est"],
  ["utc", "pst"],
  ["cet", "est"],
  ["gmt", "est"],
  ["ist", "msk"],
  ["utc", "ist"],
];

export function pairList(): [string, string][] {
  const out: [string, string][] = [];
  const both = (a: string, b: string) => out.push([a, b], [b, a]);
  for (const a of PAIR_HOME) for (const b of PAIR_WORLD) both(a, b);
  for (const b of PAIR_MOSCOW) both("moscow", b);
  for (const [a, b] of PAIR_ZONES) both(a, b);
  return out;
}

/** Cities shown in the "same moment around the world" table. */
export const WORLD_12 = ["london", "paris", "moscow", "istanbul", "dubai", "almaty", "delhi", "bangkok", "beijing", "tokyo", "sydney", "new-york", "los-angeles"];
/** Cities every city page compares with. */
export const COMPARE = ["moscow", "astana", "london", "new-york"];
/** Default favourites of the world clock. */
export const DEFAULT_FAVORITES = ["moscow", "astana", "london", "new-york", "dubai", "tokyo"];
