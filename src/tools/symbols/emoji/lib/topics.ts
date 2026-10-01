import type { L10n } from "@/i18n/config";
import { EXTRA_TOPICS } from "./topics-extra";

/**
 * Curated emoji collections (/emoji/topic/{slug}). Membership = whole subgroups +
 * emoji whose English CLDR keywords contain one of `tags` + an explicit list (`add`),
 * minus `exclude`. Collections that would just repeat a group or subgroup page are
 * declared as ALIASES and link to that page instead of creating a duplicate.
 */
export interface TopicDef {
  slug: string;
  /** Chip label. */
  name: L10n;
  /** Main search phrase (h1). */
  h1: L10n;
  /** Short factual description of what the collection contains. */
  intro: L10n;
  sub?: string[];
  tags?: string[];
  /** Limit keyword matches to these groups. */
  tagGroups?: string[];
  add?: string;
  exclude?: string;
  /** Country flags of a continent. */
  region?: string;
}

interface TopicAlias {
  slug: string;
  name: L10n;
  to: ["group" | "subgroup", string];
}

export const TOPICS: TopicDef[] = [
  {
    slug: "love",
    name: { ru: "Любовь", en: "Love" },
    h1: { ru: "Эмодзи любовь", en: "Love emojis" },
    intro: {
      ru: "Эмодзи для признаний и романтических сообщений: сердца, поцелуи, влюблённые смайлики, пары, цветы и кольцо.",
      en: "Emojis for romantic messages: hearts, kisses, smitten smileys, couples, flowers and a ring.",
    },
    tags: ["love", "romance", "kiss"],
    add: "💍🌹💐🥂",
    exclude: "💒🏩🤟🏳️‍🌈🪉",
  },
  {
    slug: "kiss",
    name: { ru: "Поцелуи", en: "Kisses" },
    h1: { ru: "Эмодзи поцелуй", en: "Kiss emojis" },
    intro: {
      ru: "Смайлики с поцелуем, воздушный поцелуй, след помады и целующиеся пары во всех вариантах.",
      en: "Kissing smileys, blowing a kiss, a lipstick mark and kissing couples in every variant.",
    },
    add: "😘😗😙😚😽💋💏👩‍❤️‍💋‍👨👨‍❤️‍💋‍👨👩‍❤️‍💋‍👩🫦👄",
  },
  {
    slug: "fire",
    name: { ru: "Огонь", en: "Fire" },
    h1: { ru: "Эмодзи огонь", en: "Fire emojis" },
    intro: {
      ru: "Огонь и всё, что горит или обжигает: пламя, сердце в огне, свеча, фейерверк, вулкан, перец чили и горячий смайлик.",
      en: "Fire and everything hot: flames, a heart on fire, a candle, fireworks, a volcano, a chili pepper and the hot face.",
    },
    add: "🔥❤️‍🔥🧯🕯️🪔🎆🎇🧨🌋🌶️🥵☄️🚒👩‍🚒👨‍🚒🧑‍🚒💥🐉🐲⚡🏮♨️",
  },
  {
    slug: "flowers",
    name: { ru: "Цветы и растения", en: "Flowers & plants" },
    h1: { ru: "Эмодзи цветы и растения", en: "Flower & plant emojis" },
    intro: {
      ru: "Цветы, букеты и растения: роза, тюльпан, подсолнух, сакура, лотос, а также смайлики и предметы с цветами.",
      en: "Flowers, bouquets and plants: rose, tulip, sunflower, cherry blossom, lotus and other flowery emojis.",
    },
    sub: ["plant-flower"],
    add: "🌱🌿☘️🍀🌾🪴🎋🎍👒🌺🏵️🌷",
  },
  {
    slug: "nature",
    name: { ru: "Природа", en: "Nature" },
    h1: { ru: "Эмодзи природа", en: "Nature emojis" },
    intro: {
      ru: "Деревья, растения, горы, вода, небо и погода — эмодзи для пейзажей и прогулок на природе.",
      en: "Trees, plants, mountains, water, sky and weather — emojis for landscapes and walks outdoors.",
    },
    sub: ["plant-other", "place-geographic"],
    add: "🌸🌻🌼🌷🌹🌈🌊💧☀️🌤️☁️🌧️❄️🌙⭐🍄🐚🪨🪵🌍🏞️🌅🌄🦋🐝🐞",
  },
  {
    slug: "animals",
    name: { ru: "Животные", en: "Animals" },
    h1: { ru: "Эмодзи животные", en: "Animal emojis" },
    intro: {
      ru: "Все животные из Unicode: млекопитающие, птицы, рыбы и морские обитатели, рептилии, земноводные и насекомые.",
      en: "Every animal in Unicode: mammals, birds, fish and sea life, reptiles, amphibians and bugs.",
    },
    sub: ["animal-mammal", "animal-bird", "animal-amphibian", "animal-reptile", "animal-marine", "animal-bug"],
  },
  {
    slug: "cats",
    name: { ru: "Кошки", en: "Cats" },
    h1: { ru: "Эмодзи кошки", en: "Cat emojis" },
    intro: {
      ru: "Кошки и котики: мордочка кота, чёрный кот, кошачьи смайлики с разными эмоциями, лев и тигр.",
      en: "Cats and kittens: a cat face, a black cat, cat smileys with different emotions, a lion and a tiger.",
    },
    sub: ["cat-face"],
    add: "🐱🐈🐈‍⬛🦁🐯🐅🐆🐾🧶",
  },
  {
    slug: "dogs",
    name: { ru: "Собаки", en: "Dogs" },
    h1: { ru: "Эмодзи собаки", en: "Dog emojis" },
    intro: {
      ru: "Собаки и всё для них: мордочка пса, пудель, собака-поводырь, служебная собака, волк, лиса, следы лап и косточка.",
      en: "Dogs and doggy things: a dog face, a poodle, a guide dog, a service dog, a wolf, a fox, paw prints and a bone.",
    },
    add: "🐶🐕🦮🐕‍🦺🐩🐺🦊🐾🦴",
  },
  {
    slug: "farm-animals",
    name: { ru: "Ферма", en: "Farm animals" },
    h1: { ru: "Эмодзи ферма и деревня", en: "Farm animal emojis" },
    intro: {
      ru: "Животные с фермы и из деревни: корова, свинья, овца, коза, лошадь, курица, петух, утка, кролик и индейка.",
      en: "Animals from the farm: cow, pig, sheep, goat, horse, chicken, rooster, duck, rabbit and turkey.",
    },
    add: "🐮🐄🐂🐃🐷🐖🐗🐽🐑🐏🐐🐴🐎🫏🐔🐓🐣🐤🐥🦃🦆🪿🐰🐇🐱🐶🐭🐁🥚🥛🌾🚜🧑‍🌾👨‍🌾👩‍🌾",
  },
  {
    slug: "sea",
    name: { ru: "Море", en: "Sea" },
    h1: { ru: "Эмодзи море", en: "Sea emojis" },
    intro: {
      ru: "Море и пляж: волна, рыбы, кит, дельфин, осьминог, ракушка, пальма, зонтик, корабль и якорь.",
      en: "Sea and beach: a wave, fish, a whale, a dolphin, an octopus, a shell, a palm tree, an umbrella, a ship and an anchor.",
    },
    sub: ["animal-marine"],
    add: "🌊🏖️🏝️⛱️🩱👙🤿🏄🏊⛵🚤🛥️🛳️🚢⚓🦀🦞🦐🦑🪸🧜",
  },
  {
    slug: "fast-food",
    name: { ru: "Фастфуд", en: "Fast food" },
    h1: { ru: "Эмодзи фастфуд", en: "Fast food emojis" },
    intro: {
      ru: "Бургер, картошка фри, пицца, хот-дог, шаурма, тако, наггетсы, попкорн и газировка.",
      en: "Burger, fries, pizza, hot dog, wrap, taco, chicken, popcorn and soda.",
    },
    add: "🍔🍟🍕🌭🥪🌮🌯🫔🥙🧆🍗🍖🥓🍳🥞🧇🥨🥯🍿🧂🥤🧋🍩",
  },
  {
    slug: "alcohol",
    name: { ru: "Алкоголь", en: "Alcohol" },
    h1: { ru: "Эмодзи алкоголь", en: "Alcohol emojis" },
    intro: {
      ru: "Бокалы и бутылки: вино, шампанское, пиво, коктейли, виски и саке — для тостов и поздравлений.",
      en: "Glasses and bottles: wine, champagne, beer, cocktails, whisky and sake — for toasts and celebrations.",
    },
    add: "🍷🍸🍹🍺🍻🥂🥃🍾🍶🧉🫗🥴",
  },
  {
    slug: "sport",
    name: { ru: "Спорт", en: "Sports" },
    h1: { ru: "Эмодзи спорт", en: "Sports emojis" },
    intro: {
      ru: "Спортивный инвентарь, спортсмены за игрой и тренировкой, кубки и медали.",
      en: "Sports equipment, athletes in action, trophies and medals.",
    },
    sub: ["sport", "person-sport", "award-medal"],
    add: "🏟️💪🏋️🤸🧘",
  },
  {
    slug: "football",
    name: { ru: "Футбол", en: "Football" },
    h1: { ru: "Эмодзи футбол", en: "Football emojis" },
    intro: {
      ru: "Футбольный мяч, ворота, стадион, кубок и медали, а также эмодзи для болельщиков: аплодисменты, мегафон и огонь.",
      en: "A football, a goal net, a stadium, a trophy and medals, plus emojis for fans: clapping, a megaphone and fire.",
    },
    add: "⚽🥅🏟️🏆🥇🥈🥉🏅👟🎽📣🙌👏🔥",
  },
  {
    slug: "music",
    name: { ru: "Музыка", en: "Music" },
    h1: { ru: "Эмодзи музыка", en: "Music emojis" },
    intro: {
      ru: "Ноты, музыкальные инструменты, микрофон, наушники, колонки и танцующие люди.",
      en: "Notes, musical instruments, a microphone, headphones, speakers and dancing people.",
    },
    sub: ["music", "musical-instrument"],
    add: "🔊📢📯🎵🎶💃🕺🪩👩‍🎤👨‍🎤🧑‍🎤",
  },
  {
    slug: "weather",
    name: { ru: "Погода", en: "Weather" },
    h1: { ru: "Эмодзи погода", en: "Weather emojis" },
    intro: {
      ru: "Солнце, облака, дождь, гроза, снег, ветер, туман, радуга, зонтик и термометр — всё для прогноза погоды.",
      en: "Sun, clouds, rain, thunderstorms, snow, wind, fog, a rainbow, an umbrella and a thermometer — a full forecast.",
    },
    add: "☀️🌤️⛅🌥️☁️🌦️🌧️⛈️🌩️🌨️❄️☃️⛄🌬️💨🌪️🌫️🌈☂️☔⚡🌡️🌊💧🌞🌝🌚🌙⭐🌟",
  },
  {
    slug: "sun",
    name: { ru: "Солнце", en: "Sun" },
    h1: { ru: "Эмодзи солнце", en: "Sun emojis" },
    intro: {
      ru: "Солнце с лицом и без, рассвет, закат, солнце за облаком, солнечные очки и подсолнух.",
      en: "The sun with and without a face, sunrise, sunset, sun behind a cloud, sunglasses and a sunflower.",
    },
    add: "☀️🌞🌅🌄🌇🌆🌤️⛅🌥️🌦️🕶️😎🌻🏖️🔆🔅",
  },
  {
    slug: "moon",
    name: { ru: "Луна", en: "Moon" },
    h1: { ru: "Эмодзи луна", en: "Moon emojis" },
    intro: {
      ru: "Все фазы Луны от новолуния до полнолуния, месяц с лицом, полумесяц и лунная ночь.",
      en: "Every moon phase from new moon to full moon, moons with faces, the crescent and moonlit nights.",
    },
    add: "🌑🌒🌓🌔🌕🌖🌗🌘🌙🌚🌛🌜🌝🌃🎑🥮🌌☪️",
  },
  {
    slug: "stars",
    name: { ru: "Звёзды", en: "Stars" },
    h1: { ru: "Эмодзи звёзды", en: "Star emojis" },
    intro: {
      ru: "Звёзды, сияющая звезда, блёстки, падающая звезда, звёздное небо, салют и смайлик со звёздами в глазах.",
      en: "Stars, a glowing star, sparkles, a shooting star, the starry sky, fireworks and the star-struck face.",
    },
    add: "⭐🌟✨💫🌠🌌🌃🎇🎆🤩✴️✳️🔯✡️🪐☄️",
  },
  {
    slug: "space",
    name: { ru: "Космос", en: "Space" },
    h1: { ru: "Эмодзи космос", en: "Space emojis" },
    intro: {
      ru: "Ракета, спутник, НЛО, планеты, Земля, Луна, кометы, телескоп, космонавты и инопланетяне.",
      en: "A rocket, a satellite, a UFO, planets, Earth, the Moon, comets, a telescope, astronauts and aliens.",
    },
    add: "🚀🛸🛰️🪐🌍🌎🌏🌑🌕🌙☄️🌠🌌⭐🔭👽👾🧑‍🚀👩‍🚀👨‍🚀",
  },
  {
    slug: "winter",
    name: { ru: "Зима", en: "Winter" },
    h1: { ru: "Эмодзи зима", en: "Winter emojis" },
    intro: {
      ru: "Снег и мороз, снеговик, варежки и шарф, лыжи, коньки, санки, ёлка и горячий чай.",
      en: "Snow and frost, a snowman, gloves and a scarf, skis, skates, a sled, a Christmas tree and hot tea.",
    },
    add: "❄️☃️⛄🌨️🥶🧣🧤🧥🎿⛷️🏂⛸️🛷🏒🏔️🎄🦌🐧🐻‍❄️☕🍵🔥🧊",
  },
  {
    slug: "spring",
    name: { ru: "Весна", en: "Spring" },
    h1: { ru: "Эмодзи весна", en: "Spring emojis" },
    intro: {
      ru: "Первые цветы и зелень, сакура, тюльпаны, бабочки, пчёлы, птенцы, радуга и весенний дождь.",
      en: "First flowers and greenery, cherry blossoms, tulips, butterflies, bees, chicks, a rainbow and spring rain.",
    },
    add: "🌷🌸🌱🌿🌼🌻🪻🍀☘️🐣🐤🐥🐝🦋🐞🪺🌈☔🌦️💐",
  },
  {
    slug: "summer",
    name: { ru: "Лето", en: "Summer" },
    h1: { ru: "Эмодзи лето", en: "Summer emojis" },
    intro: {
      ru: "Солнце, пляж, море, купальник, мороженое, арбуз, коктейль, пальма и летний отдых.",
      en: "Sun, beach, sea, swimwear, ice cream, watermelon, cocktails, palm trees and summer holidays.",
    },
    add: "☀️😎🕶️🏖️🏝️🌴🌊⛱️👙🩱🩳🤿🏄🏊🍉🍦🍧🍨🍹🥥🍍🍓🍒🌻🐚🦀🦩⛵🚤",
  },
  {
    slug: "autumn",
    name: { ru: "Осень", en: "Autumn" },
    h1: { ru: "Эмодзи осень", en: "Autumn emojis" },
    intro: {
      ru: "Опавшие и кленовые листья, грибы, каштаны, тыква, яблоки, дождь, зонт и тёплый чай.",
      en: "Fallen and maple leaves, mushrooms, chestnuts, a pumpkin, apples, rain, an umbrella and warm tea.",
    },
    add: "🍂🍁🍄🌰🎃🍎🍏🍐🍇🌾🥧🦔🐿️🌧️☔☂️🌫️🧥🧣☕🍵📚🏫",
  },
  {
    slug: "new-year",
    name: { ru: "Новый год", en: "New Year" },
    h1: { ru: "Эмодзи Новый год", en: "New Year emojis" },
    intro: {
      ru: "Ёлка, Дед Мороз (в Unicode — Санта-Клаус), снеговик, подарки, шампанское, салют, мандарины и часы, бьющие полночь.",
      en: "A Christmas tree, Santa, a snowman, gifts, champagne, fireworks, tangerines and a clock striking midnight.",
    },
    add: "🎄🎅🤶🧑‍🎄⛄☃️❄️🎁🎉🎊🥳🍾🥂🎆🎇🧨✨🌟🕛🍊🦌🛷🧣🧤🔔",
  },
  {
    slug: "christmas",
    name: { ru: "Рождество", en: "Christmas" },
    h1: { ru: "Эмодзи Рождество", en: "Christmas emojis" },
    intro: {
      ru: "Рождественская ёлка, Санта-Клаус и миссис Клаус, олень, колокольчик, звезда, ангел, свечи, подарки и печенье.",
      en: "A Christmas tree, Santa and Mrs. Claus, a deer, a bell, a star, an angel, candles, gifts and cookies.",
    },
    add: "🎄🎅🤶🧑‍🎄🦌🛷🔔⭐🌟👼🕯️🎁🎀🧦🍪🥛❄️☃️⛄⛪✝️🎶",
  },
  {
    slug: "birthday",
    name: { ru: "День рождения", en: "Birthday" },
    h1: { ru: "Эмодзи день рождения", en: "Birthday emojis" },
    intro: {
      ru: "Торт со свечами, капкейк, воздушные шары, подарки, хлопушка, конфетти и праздничный колпак — для поздравлений.",
      en: "A cake with candles, a cupcake, balloons, gifts, a party popper, confetti and a party hat — for greetings.",
    },
    add: "🎂🍰🧁🎈🎉🎊🥳🎁🎀🕯️🍾🥂🪅💐🌹👑🎶🎵🍭🍬",
  },
  {
    slug: "party",
    name: { ru: "Вечеринка", en: "Party" },
    h1: { ru: "Эмодзи вечеринка", en: "Party emojis" },
    intro: {
      ru: "Хлопушки, конфетти, шарики, диско-шар, танцы, коктейли и шампанское.",
      en: "Party poppers, confetti, balloons, a mirror ball, dancing, cocktails and champagne.",
    },
    add: "🎉🎊🥳🎈🪩💃🕺👯🍾🥂🍻🍹🍸🎶🎵🎤🎧🪅🎆🎇✨",
  },
  {
    slug: "halloween",
    name: { ru: "Хэллоуин", en: "Halloween" },
    h1: { ru: "Эмодзи Хэллоуин", en: "Halloween emojis" },
    intro: {
      ru: "Тыква, привидение, череп, летучая мышь, паук и паутина, вампир, зомби, ведьма, метла и конфеты.",
      en: "A pumpkin, a ghost, a skull, a bat, a spider and web, a vampire, a zombie, a witch, a broom and candy.",
    },
    add: "🎃👻💀☠️🦇🕷️🕸️🧛🧟🧙🧹🍬🍭🌕🐈‍⬛👹👺😈👿🔮⚰️🪦🩸🧌😱",
  },
  {
    slug: "easter",
    name: { ru: "Пасха", en: "Easter" },
    h1: { ru: "Эмодзи Пасха", en: "Easter emojis" },
    intro: {
      ru: "Яйцо, цыплята, кролик, весенние цветы, корзинка, храм и крест.",
      en: "An egg, chicks, a rabbit, spring flowers, a basket, a church and a cross.",
    },
    add: "🥚🐣🐤🐥🐰🐇🌷🌸🌼💐🧺🍫⛪✝️🕊️🙏🕯️🔔",
  },
  {
    slug: "valentines-day",
    name: { ru: "День святого Валентина", en: "Valentine’s Day" },
    h1: { ru: "Эмодзи на День святого Валентина", en: "Valentine’s Day emojis" },
    intro: {
      ru: "Сердце со стрелой, валентинка, розы, шоколад, поцелуи, влюблённые пары и кольцо.",
      en: "A heart with an arrow, a love letter, roses, chocolate, kisses, couples and a ring.",
    },
    add: "💘💝💖💗💓💞💕💌❤️🌹🍫💐💋😘🥰😍💑💏🧸💍🥂🎁🍓",
  },
  {
    slug: "wedding",
    name: { ru: "Свадьба", en: "Wedding" },
    h1: { ru: "Эмодзи свадьба", en: "Wedding emojis" },
    intro: {
      ru: "Невеста, жених, кольцо, свадебная церковь, торт, букет, шампанское и влюблённые пары.",
      en: "A bride, a groom, a ring, a wedding chapel, a cake, a bouquet, champagne and couples in love.",
    },
    add: "👰👰‍♀️👰‍♂️🤵🤵‍♀️🤵‍♂️💍💒💐🎂🥂🍾💑💏👩‍❤️‍👨💞💕🕊️⛪🎉",
  },
  {
    slug: "baby",
    name: { ru: "Малыши", en: "Babies" },
    h1: { ru: "Эмодзи малыш", en: "Baby emojis" },
    intro: {
      ru: "Младенец, беременность, кормление, бутылочка, ангелочек, плюшевый мишка, значок детской комнаты и английская булавка.",
      en: "A baby, pregnancy, feeding, a baby bottle, a baby angel, a teddy bear, the baby symbol and a safety pin.",
    },
    add: "👶🍼🧸👼🤰🫃🫄🤱👩‍🍼👨‍🍼🧑‍🍼🚼🐣🎀🧷",
  },
  {
    slug: "school",
    name: { ru: "Школа", en: "School" },
    h1: { ru: "Эмодзи школа", en: "School emojis" },
    intro: {
      ru: "Школа, рюкзак, учебники, тетради, карандаши, линейки, глобус, микроскоп, учителя и выпускная шапочка.",
      en: "A school, a backpack, books, notebooks, pencils, rulers, a globe, a microscope, teachers and a graduation cap.",
    },
    add: "🏫🎒📚📖📕📗📘📙📓📔📒📝✏️🖊️🖍️📐📏📎✂️🧮🔬🧪🌍🎓🧑‍🏫👩‍🏫👨‍🏫🧑‍🎓👩‍🎓👨‍🎓🔔",
  },
  {
    slug: "books",
    name: { ru: "Книги и чтение", en: "Books" },
    h1: { ru: "Эмодзи книги", en: "Book emojis" },
    intro: {
      ru: "Открытая книга, стопка книг, цветные учебники, блокноты, свиток, закладки, очки и лупа.",
      en: "An open book, a stack of books, colored books, notebooks, a scroll, bookmarks, glasses and a magnifying glass.",
    },
    add: "📚📖📕📗📘📙📓📔📒📜📃📄📑🔖🏷️👓🔍🔎🧐🤓",
  },
  {
    slug: "money",
    name: { ru: "Деньги", en: "Money" },
    h1: { ru: "Эмодзи деньги", en: "Money emojis" },
    intro: {
      ru: "Купюры, монеты, мешок денег, кошелёк, банковская карта, чек, банк, график роста и смайлик с деньгами.",
      en: "Banknotes, coins, a money bag, a wallet, a credit card, a receipt, a bank, a growth chart and the money-mouth face.",
    },
    sub: ["money"],
    add: "💲💱🤑🏦🏧📈📉💎👛",
  },
  {
    slug: "travel",
    name: { ru: "Путешествия", en: "Travel" },
    h1: { ru: "Эмодзи путешествия", en: "Travel emojis" },
    intro: {
      ru: "Самолёт, чемодан, карта и глобус, отель, пляж, горы, достопримечательности, поезд, лайнер и фотоаппарат.",
      en: "A plane, a suitcase, a map and a globe, a hotel, beaches, mountains, landmarks, a train, a cruise ship and a camera.",
    },
    add: "✈️🛫🛬🧳🗺️🌍🌎🌏🧭🏨🏖️🏝️🏔️🏕️🗽🗼🏰🏯🎡🚆🚄🚢🛳️🚗🚌📸🎒🛂🛃🌴⛱️🎫",
  },
  {
    slug: "cars",
    name: { ru: "Машины", en: "Cars" },
    h1: { ru: "Эмодзи машины", en: "Car emojis" },
    intro: {
      ru: "Легковые и гоночные автомобили, такси, полиция, скорая помощь, грузовики, мотоциклы, заправка и светофор.",
      en: "Cars and race cars, taxis, police cars, ambulances, trucks, motorcycles, a fuel pump and traffic lights.",
    },
    add: "🚗🚙🏎️🚓🚔🚕🚖🚘🛻🚚🚛🚐🚑🚒🚌🏍️🛵⛽🅿️🚦🚥🛞🚨🛣️🚧",
  },
  {
    slug: "transport",
    name: { ru: "Транспорт", en: "Transport" },
    h1: { ru: "Эмодзи транспорт", en: "Transport emojis" },
    intro: {
      ru: "Весь транспорт в Unicode: наземный, водный и воздушный — от велосипеда и трамвая до самолёта и ракеты.",
      en: "All transport in Unicode: ground, water and air — from a bicycle and a tram to a plane and a rocket.",
    },
    sub: ["transport-ground", "transport-water", "transport-air"],
  },
  {
    slug: "faces-happy",
    name: { ru: "Весёлые смайлики", en: "Happy faces" },
    h1: { ru: "Весёлые смайлики", en: "Happy face emojis" },
    intro: {
      ru: "Улыбки, смех, радость и хорошее настроение: смайлики, которые улыбаются, смеются и подмигивают.",
      en: "Smiles, laughter and joy: smileys that grin, laugh and wink.",
    },
    sub: ["face-smiling"],
    add: "😍🥰😘😋😛😜🤪😝🤗🤩🥳😎😺😸😹😻",
  },
  {
    slug: "laughing",
    name: { ru: "Смех", en: "Laughing" },
    h1: { ru: "Смеющиеся смайлики", en: "Laughing emojis" },
    intro: {
      ru: "Смайлики, которые смеются: до слёз, катаясь по полу, с закрытыми глазами и прикрывая рот, а также смеющийся кот.",
      en: "Laughing smileys: with tears of joy, rolling on the floor, with closed eyes and hiding a giggle, plus a laughing cat.",
    },
    add: "😂🤣😆😄😁😃😅😹😸🤭🙊🤪😜😝",
  },
  {
    slug: "faces-sad",
    name: { ru: "Грустные смайлики", en: "Sad faces" },
    h1: { ru: "Грустные смайлики", en: "Sad face emojis" },
    intro: {
      ru: "Грусть, слёзы, разочарование и усталость: плачущие и печальные смайлики, разбитое сердце.",
      en: "Sadness, tears, disappointment and exhaustion: crying and sad smileys and a broken heart.",
    },
    add: "😢😭😞😔😟😕🙁☹️😣😖😫😩🥺🥹😿😥😓😪💔😿🫤😒😮‍💨",
  },
  {
    slug: "surprised",
    name: { ru: "Удивление", en: "Surprise" },
    h1: { ru: "Удивлённые смайлики", en: "Surprised emojis" },
    intro: {
      ru: "Удивление, шок и испуг: открытый рот, крик ужаса, взрыв мозга, глаза навыкате и уставший кот.",
      en: "Surprise, shock and fear: open mouths, a scream, a mind blown, wide eyes and a weary cat.",
    },
    add: "😮😯😲😳😱🤯😵😵‍💫🙀😨😰🫢🫨👀😦😧",
  },
  {
    slug: "hands",
    name: { ru: "Руки и жесты", en: "Hands & gestures" },
    h1: { ru: "Эмодзи руки и жесты", en: "Hand emojis" },
    intro: {
      ru: "Все жесты рукой: лайк, «окей», «виктория», кулак, рукопожатие, аплодисменты, молитва и указательные пальцы.",
      en: "Every hand gesture: thumbs up, OK, victory, a fist, a handshake, clapping, folded hands and pointing fingers.",
    },
    sub: ["hand-fingers-open", "hand-fingers-partial", "hand-single-finger", "hand-fingers-closed", "hands", "hand-prop"],
  },
  {
    slug: "eyes",
    name: { ru: "Глаза", en: "Eyes" },
    h1: { ru: "Эмодзи глаза", en: "Eye emojis" },
    intro: {
      ru: "Глаза и взгляды: пара глаз, глаз, смайлики с глазами-сердечками и звёздами, закатывание глаз, очки и назар.",
      en: "Eyes and looks: a pair of eyes, one eye, heart eyes and star eyes, eye rolls, glasses and a nazar amulet.",
    },
    add: "👀👁️👁️‍🗨️😍🤩🙄😳😵🥺🥹🙈😑🫣🧿👓🕶️🥽",
  },
  {
    slug: "magic",
    name: { ru: "Магия и сказки", en: "Magic & fantasy" },
    h1: { ru: "Эмодзи магия", en: "Magic emojis" },
    intro: {
      ru: "Волшебная палочка, хрустальный шар, маги, феи, джинны, русалки, единорог, дракон и блёстки.",
      en: "A magic wand, a crystal ball, mages, fairies, genies, merpeople, a unicorn, a dragon and sparkles.",
    },
    sub: ["person-fantasy"],
    add: "🪄🔮🦄🐉🐲✨🎩🧿🪬🌟💫",
  },
  {
    slug: "office",
    name: { ru: "Работа и офис", en: "Work & office" },
    h1: { ru: "Эмодзи работа и офис", en: "Work & office emojis" },
    intro: {
      ru: "Портфель, ноутбук, графики, календарь, папки, скрепки, почта, телефон и офисные работники.",
      en: "A briefcase, a laptop, charts, a calendar, folders, paper clips, mail, a phone and office workers.",
    },
    sub: ["office"],
    add: "💻🖥️⌨️🖨️🖱️📱☎️📧📨📩💼🧑‍💼👩‍💼👨‍💼🧑‍💻👩‍💻👨‍💻☕🕘📞",
  },
  {
    slug: "colors",
    name: { ru: "Цвета", en: "Colors" },
    h1: { ru: "Эмодзи цветные кружки и квадраты", en: "Colored circle & square emojis" },
    intro: {
      ru: "Кружки, квадраты и сердечки всех цветов радуги — для цветовых меток, опросов и оформления постов.",
      en: "Circles, squares and hearts in every color — for color labels, polls and post decoration.",
    },
    sub: ["geometric"],
    add: "❤️🧡💛💚💙🩵💜🤎🖤🩶🤍🩷",
  },
  {
    slug: "check-marks",
    name: { ru: "Галочки и крестики", en: "Check marks & crosses" },
    h1: { ru: "Эмодзи галочка и крестик", en: "Check mark & cross emojis" },
    intro: {
      ru: "Зелёная галочка, флажок в квадрате, крестик, «нет входа», кнопки OK и знаки вопроса и восклицания.",
      en: "A green check mark, a checked box, cross marks, no entry, the OK button and question and exclamation marks.",
    },
    add: "✅☑️✔️❌❎✖️⭕🚫⛔🆗🆖🔘❓❔❗❕‼️⁉️👍👎",
  },
  {
    slug: "flags-europe",
    name: { ru: "Флаги Европы", en: "Flags of Europe" },
    h1: { ru: "Флаги стран Европы — эмодзи", en: "European country flag emojis" },
    intro: {
      ru: "Эмодзи-флаги всех стран и территорий Европы по классификации ООН, включая Россию, а также флаги Англии, Шотландии, Уэльса и Евросоюза.",
      en: "Flag emojis of every European country and territory (UN geoscheme), including the UK nations and the EU flag.",
    },
    region: "europe",
    sub: ["subdivision-flag"],
    add: "🇪🇺",
  },
  {
    slug: "flags-asia",
    name: { ru: "Флаги Азии", en: "Flags of Asia" },
    h1: { ru: "Флаги стран Азии — эмодзи", en: "Asian country flag emojis" },
    intro: {
      ru: "Эмодзи-флаги стран Азии по классификации ООН: Казахстан, Узбекистан, Кыргызстан, Китай, Япония, Индия, Турция и другие.",
      en: "Flag emojis of Asian countries (UN geoscheme): Kazakhstan, China, Japan, India, Türkiye and more.",
    },
    region: "asia",
  },
  {
    slug: "flags-africa",
    name: { ru: "Флаги Африки", en: "Flags of Africa" },
    h1: { ru: "Флаги стран Африки — эмодзи", en: "African country flag emojis" },
    intro: {
      ru: "Эмодзи-флаги стран и территорий Африки по классификации ООН — от Египта и Марокко до ЮАР.",
      en: "Flag emojis of African countries and territories (UN geoscheme) — from Egypt and Morocco to South Africa.",
    },
    region: "africa",
  },
  {
    slug: "flags-americas",
    name: { ru: "Флаги Америки", en: "Flags of the Americas" },
    h1: { ru: "Флаги стран Америки — эмодзи", en: "Flag emojis of the Americas" },
    intro: {
      ru: "Эмодзи-флаги Северной, Центральной и Южной Америки и Карибских островов: США, Канада, Мексика, Бразилия, Аргентина и другие.",
      en: "Flag emojis of North, Central and South America and the Caribbean: USA, Canada, Mexico, Brazil, Argentina and more.",
    },
    region: "americas",
  },
  {
    slug: "flags-oceania",
    name: { ru: "Флаги Океании", en: "Flags of Oceania" },
    h1: { ru: "Флаги Австралии и Океании — эмодзи", en: "Flag emojis of Oceania" },
    intro: {
      ru: "Эмодзи-флаги Австралии, Новой Зеландии и островных государств Тихого океана.",
      en: "Flag emojis of Australia, New Zealand and the Pacific island nations.",
    },
    region: "oceania",
  },
  ...EXTRA_TOPICS,
];

export const ALIASES: TopicAlias[] = [
  { slug: "science", name: { ru: "Наука", en: "Science" }, to: ["subgroup", "science"] },
  { slug: "hearts", name: { ru: "Сердечки", en: "Hearts" }, to: ["subgroup", "heart"] },
  { slug: "faces-angry", name: { ru: "Злые смайлики", en: "Angry faces" }, to: ["subgroup", "face-negative"] },
  { slug: "smileys", name: { ru: "Смайлики", en: "Smileys" }, to: ["group", "smileys-emotion"] },
  { slug: "food", name: { ru: "Еда", en: "Food" }, to: ["group", "food-drink"] },
  { slug: "fruits", name: { ru: "Фрукты", en: "Fruits" }, to: ["subgroup", "food-fruit"] },
  { slug: "vegetables", name: { ru: "Овощи", en: "Vegetables" }, to: ["subgroup", "food-vegetable"] },
  { slug: "sweets", name: { ru: "Сладости", en: "Sweets" }, to: ["subgroup", "food-sweet"] },
  { slug: "drinks", name: { ru: "Напитки", en: "Drinks" }, to: ["subgroup", "drink"] },
  { slug: "birds", name: { ru: "Птицы", en: "Birds" }, to: ["subgroup", "animal-bird"] },
  { slug: "insects", name: { ru: "Насекомые", en: "Insects" }, to: ["subgroup", "animal-bug"] },
  { slug: "jobs", name: { ru: "Профессии", en: "Jobs" }, to: ["subgroup", "person-role"] },
  { slug: "family", name: { ru: "Семья", en: "Family" }, to: ["subgroup", "family"] },
  { slug: "zodiac", name: { ru: "Знаки зодиака", en: "Zodiac" }, to: ["subgroup", "zodiac"] },
  { slug: "arrows", name: { ru: "Стрелки", en: "Arrows" }, to: ["subgroup", "arrow"] },
  { slug: "clothes", name: { ru: "Одежда", en: "Clothes" }, to: ["subgroup", "clothing"] },
  { slug: "flags", name: { ru: "Все флаги", en: "All flags" }, to: ["group", "flags"] },
  { slug: "clocks", name: { ru: "Часы", en: "Clocks" }, to: ["subgroup", "time"] },
  { slug: "numbers", name: { ru: "Цифры", en: "Numbers" }, to: ["subgroup", "keycap"] },
  { slug: "games", name: { ru: "Игры", en: "Games" }, to: ["subgroup", "game"] },
  { slug: "gestures", name: { ru: "Жесты людей", en: "Gestures" }, to: ["subgroup", "person-gesture"] },
];
