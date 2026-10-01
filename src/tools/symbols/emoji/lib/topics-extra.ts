import type { TopicDef } from "./topics";

/** Collections for everyday messages, occasions and hobbies (the second half of /emoji/topic/…). */
export const EXTRA_TOPICS: TopicDef[] = [
  {
    slug: "thanks",
    name: { ru: "Спасибо", en: "Thank you" },
    h1: { ru: "Эмодзи спасибо", en: "Thank you emojis" },
    intro: {
      ru: "Чтобы сказать спасибо: сложенные ладони, рукопожатие, сердечки, цветы, подарок и смайлики с улыбкой и объятиями.",
      en: "Ways to say thanks: folded hands, a handshake, hearts, flowers, a gift and smiling, hugging faces.",
    },
    add: "🙏🤝💐🎁😊🥰🤗💝🌹✨👏🙌🫶💖😇🌸",
  },
  {
    slug: "congratulations",
    name: { ru: "Поздравления", en: "Congratulations" },
    h1: { ru: "Эмодзи для поздравлений", en: "Congratulations emojis" },
    intro: {
      ru: "Хлопушки, конфетти, кубок, шампанское, торт, букет и праздничные смайлики — для поздравлений с любым событием.",
      en: "Party poppers, confetti, a trophy, champagne, a cake, a bouquet and party faces — for congratulating on any occasion.",
    },
    add: "🎉🎊🥳🎁🏆🥇🥂🍾💐🎈👏🌟✨🎂🍰🎀🙌💯",
  },
  {
    slug: "good-morning",
    name: { ru: "Доброе утро", en: "Good morning" },
    h1: { ru: "Эмодзи доброе утро", en: "Good morning emojis" },
    intro: {
      ru: "Солнце и рассвет, кофе, завтрак, будильник, петух, подсолнух и бодрые смайлики для утренних сообщений.",
      en: "Sun and sunrise, coffee, breakfast, an alarm clock, a rooster, a sunflower and cheerful faces for morning messages.",
    },
    add: "☀️🌅🌄🌞☕🍵🥐🍳🥞🌻🐓⏰🥱😊🌷🌼",
  },
  {
    slug: "good-night",
    name: { ru: "Спокойной ночи", en: "Good night" },
    h1: { ru: "Эмодзи спокойной ночи", en: "Good night emojis" },
    intro: {
      ru: "Луна, звёзды, ночной город, кровать, сонные смайлики, сова и плюшевый мишка — чтобы пожелать сладких снов.",
      en: "The moon, stars, a night city, a bed, sleepy faces, an owl and a teddy bear — to wish sweet dreams.",
    },
    add: "🌙🌛🌜🌝😴💤🛌🛏️🌃🌌✨⭐🌠🦉🧸😪🥱💫",
  },
  {
    slug: "broken-heart",
    name: { ru: "Разбитое сердце", en: "Broken heart" },
    h1: { ru: "Эмодзи разбитое сердце", en: "Broken heart emojis" },
    intro: {
      ru: "Разбитое и перевязанное сердце, увядшая роза, слёзы и грустные смайлики — для расставаний и тоски.",
      en: "A broken and a mending heart, a wilted flower, tears and sad faces — for breakups and heartache.",
    },
    add: "💔❤️‍🩹🥀😢😭😞😔🖤🩶😿🥺😪🌧️",
  },
  {
    slug: "crying",
    name: { ru: "Плачущие смайлики", en: "Crying faces" },
    h1: { ru: "Плачущие смайлики", en: "Crying face emojis" },
    intro: {
      ru: "Смайлики со слезами: плачущий, рыдающий, со слезой радости, растроганный, а также плачущий кот и капли.",
      en: "Faces with tears: crying, sobbing, tears of joy, holding back tears, plus a crying cat and droplets.",
    },
    add: "😢😭🥲🥹😂🤣😥😪😿🙀🥺💧💦",
  },
  {
    slug: "thinking",
    name: { ru: "Думающие смайлики", en: "Thinking faces" },
    h1: { ru: "Эмодзи думаю", en: "Thinking emojis" },
    intro: {
      ru: "Смайлик в раздумье, с моноклем, с поднятой бровью, взрыв мозга, облачко мыслей и лампочка-идея.",
      en: "A thinking face, a face with a monocle, a raised eyebrow, a mind blown, a thought balloon and a light-bulb idea.",
    },
    add: "🤔🧐🤨💭🫤😶🙄🤯🧠💡❓❔🫠😐",
  },
  {
    slug: "tired",
    name: { ru: "Усталость и сон", en: "Tired & sleepy" },
    h1: { ru: "Эмодзи усталость", en: "Tired emojis" },
    intro: {
      ru: "Зевающий, сонный и уставший смайлик, выдох, тающее лицо, кровать и «Zzz» — когда сил больше нет.",
      en: "Yawning, sleepy and weary faces, a sigh, a melting face, a bed and “Zzz” — for when you are worn out.",
    },
    add: "😴🥱😪😫😩😮‍💨🫠😵‍💫🛌💤🛏️☕🔋🪫",
  },
  {
    slug: "sick",
    name: { ru: "Болезнь", en: "Feeling sick" },
    h1: { ru: "Эмодзи болею", en: "Sick emojis" },
    intro: {
      ru: "Смайлик с градусником, в маске, чихающий, с повязкой, таблетки, шприц, пластырь, больница и скорая.",
      en: "A face with a thermometer, a mask, sneezing and bandaged faces, pills, a syringe, a plaster, a hospital and an ambulance.",
    },
    add: "🤒😷🤧🤕🤢🤮🥴🥵🥶💊💉🩹🌡️🩺🏥🚑🦠",
  },
  {
    slug: "cool",
    name: { ru: "Крутые смайлики", en: "Cool" },
    h1: { ru: "Крутые смайлики", en: "Cool emojis" },
    intro: {
      ru: "Смайлик в тёмных очках, «козырёк», «сто баллов», огонь, кнопка COOL, «рок» и ухмылка — для дерзких сообщений.",
      en: "Sunglasses face, call-me hand, hundred points, fire, the COOL button, rock-on hand and a smirk — for swagger.",
    },
    add: "😎🕶️🤙🔥💯🆒🤘👌😏🤩⚡💪👊✌️🫡",
  },
  {
    slug: "hug",
    name: { ru: "Обнимашки", en: "Hugs" },
    h1: { ru: "Эмодзи обнимашки", en: "Hug emojis" },
    intro: {
      ru: "Обнимающий смайлик и обнимающиеся люди, руки-сердечко, влюблённые лица и мишка — чтобы обнять по переписке.",
      en: "A hugging face, people hugging, heart hands, loving faces and a teddy bear — to send a hug in a message.",
    },
    add: "🤗🫂🥰🫶💞💕💗😊☺️🧸🤍💓",
  },
  {
    slug: "approve",
    name: { ru: "Одобрение", en: "Approval" },
    h1: { ru: "Эмодзи одобрение и согласие", en: "Approval emojis" },
    intro: {
      ru: "Палец вверх, «окей», аплодисменты, поднятые руки, галочка, кнопка OK и «сто баллов» — чтобы сказать «да» и «отлично».",
      en: "Thumbs up, OK hand, clapping, raised hands, a check mark, the OK button and hundred points — to say “yes” and “great”.",
    },
    add: "👍👌👏🙌✅🆗💯🤝🫡😉☑️✔️🔝",
  },
  {
    slug: "disapprove",
    name: { ru: "Несогласие", en: "Disapproval" },
    h1: { ru: "Эмодзи несогласие и отказ", en: "Disapproval emojis" },
    intro: {
      ru: "Палец вниз, «нет» руками, крестик, запрет, закатывание глаз, недовольный и скептический смайлик.",
      en: "Thumbs down, a “no” gesture, a cross mark, prohibited, eye roll, unamused and skeptical faces.",
    },
    add: "👎🙅🙅‍♂️🙅‍♀️❌🚫⛔🙄😒🤨😤🫸✖️",
  },
  {
    slug: "secret",
    name: { ru: "Тайна и секрет", en: "Secrets" },
    h1: { ru: "Эмодзи секрет и тишина", en: "Secret & silence emojis" },
    intro: {
      ru: "Палец у губ, рот на замке, «ничего не скажу» обезьянка, замок и ключ, детектив и шпионские мелочи.",
      en: "A shushing face, zipper mouth, speak-no-evil monkey, a lock and key, a detective and other spy things.",
    },
    add: "🤫🤐🙊🙈🙉🔒🔐🗝️🔑🕵️🥷🫢🤭👀",
  },
  {
    slug: "luck",
    name: { ru: "Удача", en: "Good luck" },
    h1: { ru: "Эмодзи удача", en: "Good luck emojis" },
    intro: {
      ru: "Четырёхлистный клевер, скрещённые пальцы, радуга, звезда, божья коровка, обереги, кости и игровой автомат — на удачу.",
      en: "A four-leaf clover, crossed fingers, a rainbow, a star, a ladybug, amulets, dice and a slot machine — for luck.",
    },
    add: "🍀☘️🤞🌈⭐🌟🐞🎲🎰🧿🪬🐱🎯✨",
  },
  {
    slug: "victory",
    name: { ru: "Победа", en: "Victory" },
    h1: { ru: "Эмодзи победа", en: "Victory emojis" },
    intro: {
      ru: "Кубок, медали, лента, корона, знак «V», бицепс, флаг финиша и праздничные смайлики победителей.",
      en: "A trophy, medals, a ribbon, a crown, the V sign, a flexed biceps, a finish flag and winners’ party faces.",
    },
    add: "🏆🥇🥈🥉🎖️🏅🎗️👑✌️💪🏁🎉🥳🔝",
  },
  {
    slug: "peace",
    name: { ru: "Мир", en: "Peace" },
    h1: { ru: "Эмодзи мир", en: "Peace emojis" },
    intro: {
      ru: "Знак мира, голубь, рукопожатие, «V», сердце-руки, планета Земля, белый флаг и радуга.",
      en: "The peace symbol, a dove, a handshake, the V sign, heart hands, planet Earth, a white flag and a rainbow.",
    },
    add: "☮️🕊️🤝✌️🫶🌍🌎🌏🏳️🌈💙💛🤍",
  },
  {
    slug: "gifts",
    name: { ru: "Подарки", en: "Gifts" },
    h1: { ru: "Эмодзи подарок", en: "Gift emojis" },
    intro: {
      ru: "Подарок, бант, сердце с лентой, шарики, букет, мишка, пакет с покупками и красный конверт.",
      en: "A wrapped gift, a ribbon, a heart with a ribbon, balloons, a bouquet, a teddy bear, shopping bags and a red envelope.",
    },
    add: "🎁🎀💝🎈💐🧸🛍️🧧🎉🍾💍💎🌹🍫",
  },
  {
    slug: "march-8",
    name: { ru: "8 Марта", en: "Women’s Day" },
    h1: { ru: "Эмодзи на 8 Марта", en: "Women’s Day emojis" },
    intro: {
      ru: "Тюльпаны, мимоза-цветы, букеты, сердечки, подарки и женщины — для поздравлений с Международным женским днём.",
      en: "Tulips, blossoms, bouquets, hearts, gifts and women — for International Women’s Day greetings.",
    },
    add: "💐🌷🌹🌸🌼🌺💝🎁👩💃👸💖💕✨🎀",
  },
  {
    slug: "nauryz",
    name: { ru: "Наурыз", en: "Nowruz" },
    h1: { ru: "Эмодзи на Наурыз", en: "Nowruz emojis" },
    intro: {
      ru: "Весеннее солнце, цветы и ростки, шатёр, конь, котёл с едой, чай, праздник и флаг Казахстана — для поздравлений с Наурызом.",
      en: "Spring sun, flowers and sprouts, a tent, a horse, a pot of food, tea, festivities and the flag of Kazakhstan — for Nowruz greetings.",
    },
    add: "🌞☀️🌱🌷🌸🌼⛺🐎🫕🍲🫖🥛🎉🇰🇿",
  },
  {
    slug: "ramadan",
    name: { ru: "Рамадан и Курбан-айт", en: "Ramadan & Eid" },
    h1: { ru: "Эмодзи на Рамадан и Курбан-айт", en: "Ramadan & Eid emojis" },
    intro: {
      ru: "Полумесяц, звезда и мечеть, Кааба, руки в молитве, чётки, ночное небо, угощение и барашек — для праздничных пожеланий.",
      en: "A crescent moon, a star and a mosque, the Kaaba, palms up together, prayer beads, the night sky, a feast and a ewe.",
    },
    add: "🌙☪️🕌🕋🤲📿⭐🌟🌃✨🍽️🫖🐑",
  },
  {
    slug: "graduation",
    name: { ru: "Выпускной", en: "Graduation" },
    h1: { ru: "Эмодзи на выпускной", en: "Graduation emojis" },
    intro: {
      ru: "Шапочка выпускника, диплом, выпускники, школа, колокольчик, конфетти и шампанское — для выпускного и защиты диплома.",
      en: "A graduation cap, a diploma, graduates, a school, a bell, confetti and champagne — for graduation day.",
    },
    add: "🎓📜🧑‍🎓👩‍🎓👨‍🎓🏫🔔🎉🎊🥳🍾🥂📚",
  },
  {
    slug: "coffee",
    name: { ru: "Кофе и чай", en: "Coffee & tea" },
    h1: { ru: "Эмодзи кофе и чай", en: "Coffee & tea emojis" },
    intro: {
      ru: "Горячий кофе, чай, чайник, бабл-ти, молоко, мате, круассан, печенье и кекс — для перерыва на кофе.",
      en: "Hot coffee, tea, a teapot, bubble tea, milk, mate, a croissant, cookies and a cupcake — for a coffee break.",
    },
    add: "☕🍵🫖🧋🥛🧉🥐🍪🧁🍩🍰🫘",
  },
  {
    slug: "breakfast",
    name: { ru: "Завтрак", en: "Breakfast" },
    h1: { ru: "Эмодзи завтрак", en: "Breakfast emojis" },
    intro: {
      ru: "Яичница, блины, вафли, бекон, хлеб, масло, каша, круассан, сок, кофе и фрукты — всё для завтрака.",
      en: "Fried eggs, pancakes, waffles, bacon, bread, butter, cereal, a croissant, juice, coffee and fruit — all for breakfast.",
    },
    add: "🍳🥚🥞🧇🥓🍞🧈🥣🥐🥯🧃☕🥛🍌🍓🫐",
  },
  {
    slug: "baking",
    name: { ru: "Выпечка", en: "Baked goods" },
    h1: { ru: "Эмодзи выпечка и хлеб", en: "Bread & pastry emojis" },
    intro: {
      ru: "Хлеб, багет, круассан, крендель, бублик, кексы, торт, пирог, печенье и пончик.",
      en: "Bread, a baguette, a croissant, a pretzel, a bagel, cupcakes, cake, pie, cookies and a doughnut.",
    },
    add: "🍞🥖🥐🥨🥯🫓🧁🍰🎂🥧🍪🍩🥮🧈",
  },
  {
    slug: "asian-food",
    name: { ru: "Азиатская кухня", en: "Asian food" },
    h1: { ru: "Эмодзи суши и азиатская еда", en: "Sushi & Asian food emojis" },
    intro: {
      ru: "Суши, рамен, бэнто, онигири, рис с карри, пельмени, креветка темпура, палочки и коробочка с лапшой.",
      en: "Sushi, ramen, a bento box, rice balls, curry rice, dumplings, tempura shrimp, chopsticks and a takeout box.",
    },
    add: "🍣🍜🍱🍙🍚🍛🥟🥢🍤🥡🍥🍘🥠🍢🍡",
  },
  {
    slug: "bbq",
    name: { ru: "Мясо и шашлык", en: "Meat & BBQ" },
    h1: { ru: "Эмодзи мясо и шашлык", en: "Meat & BBQ emojis" },
    intro: {
      ru: "Мясо на кости, куриная ножка, стейк, бекон, шашлычок, сосиска, бургер, огонь и пиво — для пикника.",
      en: "Meat on the bone, a drumstick, a steak, bacon, skewers, a hot dog, a burger, fire and beer — for a cookout.",
    },
    add: "🍖🍗🥩🥓🍢🌭🍔🔥🍺🧅🌶️🫑🥙",
  },
  {
    slug: "cooking",
    name: { ru: "Готовка", en: "Cooking" },
    h1: { ru: "Эмодзи кулинария и готовка", en: "Cooking emojis" },
    intro: {
      ru: "Повар, сковорода, нож, ложка и вилка, соль, кастрюля, фондю, банка и тарелка — для рецептов и кулинарных блогов.",
      en: "A cook, a frying pan, a knife, a spoon and fork, salt, a pot of food, fondue, a jar and a plate — for recipes.",
    },
    add: "🧑‍🍳👩‍🍳👨‍🍳🍳🔪🥄🍴🍽️🧂🫕🍲🥘🫙🥣",
  },
  {
    slug: "shopping",
    name: { ru: "Покупки", en: "Shopping" },
    h1: { ru: "Эмодзи покупки и шопинг", en: "Shopping emojis" },
    intro: {
      ru: "Пакеты с покупками, тележка, банковская карта, ценник, чек, деньги, универмаг, платье и туфли.",
      en: "Shopping bags, a cart, a credit card, a price tag, a receipt, money, a department store, a dress and heels.",
    },
    add: "🛍️🛒💳🏷️🧾💸💰🏬🏪👗👠👜🎁📦",
  },
  {
    slug: "business",
    name: { ru: "Бизнес", en: "Business" },
    h1: { ru: "Эмодзи бизнес и финансы", en: "Business emojis" },
    intro: {
      ru: "Портфель, графики роста и падения, диаграмма, рукопожатие, банк, мешок денег, чек и деловые люди.",
      en: "A briefcase, rising and falling charts, a bar chart, a handshake, a bank, a money bag, a receipt and office workers.",
    },
    add: "💼📈📉📊🤝🏦💰🧾💹🧑‍💼👩‍💼👨‍💼🏢📅🖊️",
  },
  {
    slug: "computer",
    name: { ru: "Компьютер и интернет", en: "Computers & internet" },
    h1: { ru: "Эмодзи компьютер и интернет", en: "Computer & internet emojis" },
    intro: {
      ru: "Ноутбук, монитор, клавиатура, мышь, телефон, сигнал сети, глобус, дискета, письмо, робот и программист.",
      en: "A laptop, a desktop, a keyboard, a mouse, a phone, signal bars, a globe, a floppy disk, e-mail, a robot and a coder.",
    },
    add: "💻🖥️⌨️🖱️📱📶🌐📡💾💿📧🔌🤖🧑‍💻👩‍💻👨‍💻🛜",
  },
  {
    slug: "phone",
    name: { ru: "Связь и сообщения", en: "Phone & messages" },
    h1: { ru: "Эмодзи телефон и сообщения", en: "Phone & message emojis" },
    intro: {
      ru: "Смартфон, телефонная трубка, входящий звонок, облачка речи, мегафон, громкоговоритель и уведомление.",
      en: "A smartphone, a phone receiver, a calling phone, speech balloons, a megaphone, a loudspeaker and a bell.",
    },
    add: "📱📲☎️📞📟📠💬🗨️🗯️📣📢🔔🔕📳📴",
  },
  {
    slug: "mail",
    name: { ru: "Почта и письма", en: "Mail" },
    h1: { ru: "Эмодзи письмо и почта", en: "Mail emojis" },
    intro: {
      ru: "Конверт, электронное письмо, входящие и исходящие, почтовый ящик, посылка, любовное письмо и почтальон.",
      en: "An envelope, e-mail, incoming and outgoing mail, mailboxes, a package, a love letter and a postbox.",
    },
    add: "✉️📧📨📩📤📥📮📬📭📫📪📦💌🏤",
  },
  {
    slug: "movies",
    name: { ru: "Кино", en: "Movies" },
    h1: { ru: "Эмодзи кино", en: "Movie emojis" },
    intro: {
      ru: "Хлопушка, кинокамера, плёнка, проектор, попкорн, билеты, телевизор, маски театра и звезда.",
      en: "A clapper board, a movie camera, film frames, a projector, popcorn, tickets, a TV, theater masks and a star.",
    },
    add: "🎬🎥📽️🎞️🍿🎟️🎫📺🎭🌟⭐🎦🛋️",
  },
  {
    slug: "art",
    name: { ru: "Творчество", en: "Arts & crafts" },
    h1: { ru: "Эмодзи рисование и творчество", en: "Art & craft emojis" },
    intro: {
      ru: "Палитра, кисть, мелок, карандаш, картина в раме, нитки, пряжа, ножницы, линейка и художник.",
      en: "A palette, a paintbrush, a crayon, a pencil, a framed picture, thread, yarn, scissors, a ruler and an artist.",
    },
    add: "🎨🖌️🖍️✏️🖊️🖼️🧵🪡🧶✂️📐📏🧑‍🎨👩‍🎨👨‍🎨",
  },
  {
    slug: "photo",
    name: { ru: "Фото и видео", en: "Photo & video" },
    h1: { ru: "Эмодзи фотоаппарат и видео", en: "Camera & photo emojis" },
    intro: {
      ru: "Фотоаппарат, вспышка, видеокамера, селфи, картина, плёнка, телевизор и запись видео.",
      en: "A camera, a camera with flash, a video camera, a selfie, a framed picture, film frames, a TV and a videotape.",
    },
    add: "📷📸📹🎥🤳🖼️🎞️📽️📺📼🔴🎬",
  },
  {
    slug: "dance",
    name: { ru: "Танцы", en: "Dancing" },
    h1: { ru: "Эмодзи танцы", en: "Dancing emojis" },
    intro: {
      ru: "Танцующие женщина и мужчина, люди с ушками, зеркальный шар, ноты, пуанты и праздничный смайлик.",
      en: "A woman and a man dancing, people with bunny ears, a mirror ball, notes, ballet shoes and a party face.",
    },
    add: "💃🕺👯👯‍♀️👯‍♂️🪩🎶🎵🩰🥳🎉🎤🪇",
  },
  {
    slug: "fitness",
    name: { ru: "Фитнес и спортзал", en: "Fitness & gym" },
    h1: { ru: "Эмодзи спортзал и фитнес", en: "Gym & fitness emojis" },
    intro: {
      ru: "Тяжелоатлет, бицепс, гимнаст, йога, бег, велосипед, плавание, бокс, гандбол, скалолазание и медаль.",
      en: "A weightlifter, a flexed biceps, a cartwheel, yoga, running, cycling, swimming, boxing, handball, climbing and a medal.",
    },
    add: "🏋️💪🤸🧘🏃🚴🏊🥊🤾🧗🥇⏱️🥤🍎",
  },
  {
    slug: "winter-sports",
    name: { ru: "Зимний спорт", en: "Winter sports" },
    h1: { ru: "Эмодзи хоккей и зимний спорт", en: "Hockey & winter sports emojis" },
    intro: {
      ru: "Хоккей, коньки, лыжи и лыжник, сноуборд, санки, кёрлинг, снежинка и кубок.",
      en: "Ice hockey, skates, skis and a skier, a snowboarder, a sled, curling, a snowflake and a trophy.",
    },
    add: "🏒⛸️🎿⛷️🏂🛷🥌❄️🏔️🏆🥅⛄",
  },
  {
    slug: "fishing-camping",
    name: { ru: "Рыбалка и поход", en: "Fishing & camping" },
    h1: { ru: "Эмодзи рыбалка и поход", en: "Fishing & camping emojis" },
    intro: {
      ru: "Удочка, рыбы, лодка, палатка, костёр, лес, горы, рюкзак, ботинок, компас, фонарик и карта.",
      en: "A fishing pole, fish, a canoe, a tent, a campfire, a forest, mountains, a backpack, a boot, a compass, a flashlight and a map.",
    },
    add: "🎣🐟🐠🛶🚣⛺🏕️🔥🌲🏔️🎒🥾🧭🔦🗺️🪵",
  },
  {
    slug: "beach",
    name: { ru: "Пляж и море", en: "Beach" },
    h1: { ru: "Эмодзи пляж и отпуск на море", en: "Beach emojis" },
    intro: {
      ru: "Пляж с зонтиком, волна, солнце, купальники, очки, пальма, ракушка, краб, сёрфинг и коктейль.",
      en: "A beach with an umbrella, a wave, the sun, swimsuits, sunglasses, a palm tree, a shell, a crab, surfing and a cocktail.",
    },
    add: "🏖️⛱️🌊☀️🩱👙🩳🕶️🌴🐚🦀🏄🍹🥥🏝️",
  },
  {
    slug: "mountains",
    name: { ru: "Горы", en: "Mountains" },
    h1: { ru: "Эмодзи горы", en: "Mountain emojis" },
    intro: {
      ru: "Гора, заснеженная вершина, Фудзи, вулкан, скалолаз, лыжник, канатная дорога, орёл и рассвет в горах.",
      en: "A mountain, a snow-capped peak, Mount Fuji, a volcano, a climber, a skier, a cable car, an eagle and a mountain sunrise.",
    },
    add: "⛰️🏔️🗻🌋🧗⛷️🏂🚠🦅🌄🥾🏕️",
  },
  {
    slug: "garden",
    name: { ru: "Сад и огород", en: "Garden" },
    h1: { ru: "Эмодзи сад и огород", en: "Garden emojis" },
    intro: {
      ru: "Росток, цветы, морковь, помидор, огурец, клубника, пчела, червяк, растение в горшке, фермер и трактор.",
      en: "A seedling, flowers, a carrot, a tomato, a cucumber, a strawberry, a bee, a worm, a potted plant, a farmer and a tractor.",
    },
    add: "🌱🌻🌷🥕🍅🥒🍓🐝🪱🪴🧑‍🌾🚜🥔🧅🌽",
  },
  {
    slug: "trees",
    name: { ru: "Деревья и лес", en: "Trees & forest" },
    h1: { ru: "Эмодзи дерево и лес", en: "Tree emojis" },
    intro: {
      ru: "Ель, лиственное дерево, пальма, кактус, ёлка, опавшие листья, клён, бревно, грибы и лесные звери.",
      en: "An evergreen, a deciduous tree, a palm, a cactus, a Christmas tree, fallen leaves, a maple leaf, wood, mushrooms and forest animals.",
    },
    add: "🌲🌳🌴🌵🎄🍂🍁🍃🪵🍄🦔🦌🦊🐿️",
  },
  {
    slug: "rain",
    name: { ru: "Дождь", en: "Rain" },
    h1: { ru: "Эмодзи дождь", en: "Rain emojis" },
    intro: {
      ru: "Дождевое облако, гроза, зонтики, капли, волна, радуга, солнце за тучей, сапоги и лягушка.",
      en: "A rain cloud, a thunderstorm, umbrellas, droplets, a wave, a rainbow, sun behind a rain cloud, boots and a frog.",
    },
    add: "🌧️⛈️🌦️☔☂️🌂💧💦🌊🌈🥾⚡🐸",
  },
  {
    slug: "water",
    name: { ru: "Вода", en: "Water" },
    h1: { ru: "Эмодзи вода и капли", en: "Water emojis" },
    intro: {
      ru: "Капли, брызги, волна, душ, ванна, пловец, стакан воды, кран с питьевой водой и лёд.",
      en: "Droplets, splashes, a wave, a shower, a bathtub, a swimmer, a glass of water, potable water and ice.",
    },
    add: "💧💦🌊🚿🛁🏊🥛🫗🚰🧊🫧🐳🐬",
  },
  {
    slug: "energy",
    name: { ru: "Электричество", en: "Electricity" },
    h1: { ru: "Эмодзи молния и электричество", en: "Lightning & electricity emojis" },
    intro: {
      ru: "Молния, полная и разряженная батарейка, вилка, лампочка, фонарик, свеча, мастер, шестерёнка и солнце.",
      en: "A lightning bolt, a full and a low battery, a plug, a light bulb, a flashlight, a candle, a mechanic, a gear and the sun.",
    },
    add: "⚡🔋🪫🔌💡🔦🕯️🧑‍🔧⚙️🔆☀️🌪️",
  },
  {
    slug: "house",
    name: { ru: "Дом и уют", en: "Home" },
    h1: { ru: "Эмодзи дом и уют", en: "Home emojis" },
    intro: {
      ru: "Дом, дом с садом, диван, кровать, стул, свеча, мишка, растение, картина, ключ и дверь.",
      en: "A house, a house with a garden, a couch, a bed, a chair, a candle, a teddy bear, a plant, a picture, a key and a door.",
    },
    add: "🏠🏡🛋️🛏️🪑🕯️🧸🪴🖼️🔑🚪🪟🛁🧺",
  },
  {
    slug: "cleaning",
    name: { ru: "Уборка", en: "Cleaning" },
    h1: { ru: "Эмодзи уборка", en: "Cleaning emojis" },
    intro: {
      ru: "Метла, губка, корзина для белья, мыло, пузыри, ведро, флакон, мусорная корзина, душ и ванна.",
      en: "A broom, a sponge, a laundry basket, soap, bubbles, a bucket, a lotion bottle, a wastebasket, a shower and a bath.",
    },
    add: "🧹🧽🧺🧼🫧🪣🧴🗑️🚿🛁🧤✨",
  },
  {
    slug: "tools",
    name: { ru: "Инструменты", en: "Tools" },
    h1: { ru: "Эмодзи инструменты и ремонт", en: "Tool emojis" },
    intro: {
      ru: "Молоток, отвёртка, гаечный ключ, пила, кирка, болт, лестница, ящик с инструментами, мастер и стройка.",
      en: "A hammer, a screwdriver, a wrench, a saw, a pick, a nut and bolt, a ladder, a toolbox, a mechanic and construction.",
    },
    add: "🔨🪛🔧🪚⚒️🛠️⛏️🔩🪜🧰🧑‍🔧👷🏗️🪝",
  },
  {
    slug: "medicine",
    name: { ru: "Медицина", en: "Medicine" },
    h1: { ru: "Эмодзи медицина и врач", en: "Medical emojis" },
    intro: {
      ru: "Врач, стетоскоп, таблетка, шприц, пластырь, капля крови, рентген, зуб, ДНК, больница и скорая помощь.",
      en: "A doctor, a stethoscope, a pill, a syringe, a plaster, a drop of blood, an X-ray, a tooth, DNA, a hospital and an ambulance.",
    },
    add: "🧑‍⚕️👩‍⚕️👨‍⚕️🩺💊💉🩹🩸🩻🦷🧬🏥🚑⚕️🩼",
  },
  {
    slug: "math",
    name: { ru: "Математика", en: "Math" },
    h1: { ru: "Эмодзи математика", en: "Math emojis" },
    intro: {
      ru: "Плюс, минус, умножить, разделить, равно, бесконечность, «сто», цифры, счёты, линейка и угольник.",
      en: "Plus, minus, multiply, divide, equals, infinity, hundred points, number keys, an abacus, a ruler and a triangle ruler.",
    },
    add: "➕➖✖️➗🟰♾️💯🔢#️⃣🧮📐📏📊",
  },
  {
    slug: "police",
    name: { ru: "Полиция и помощь", en: "Police & emergency" },
    h1: { ru: "Эмодзи полиция и скорая", en: "Police & emergency emojis" },
    intro: {
      ru: "Полицейский, полицейская машина, мигалка, пожарные, скорая, SOS, телефон, огнетушитель и знак опасности.",
      en: "A police officer, a police car, a siren light, firefighters, an ambulance, SOS, a phone, an extinguisher and a warning sign.",
    },
    add: "👮🚓🚔🚨🚒🧑‍🚒🚑🆘☎️🧯⚠️🚧🦺",
  },
  {
    slug: "royalty",
    name: { ru: "Короли и принцессы", en: "Royalty" },
    h1: { ru: "Эмодзи корона и принцесса", en: "Crown & princess emojis" },
    intro: {
      ru: "Корона, принц, принцесса, человек в короне, замок, бриллиант, кольцо, меч и щит, единорог, волшебная палочка и конь.",
      en: "A crown, a prince, a princess, a person with a crown, a castle, a gem, a ring, a sword and shield, a unicorn, a magic wand and a horse.",
    },
    add: "👑🤴👸🫅🏰💎💍🗡️🛡️🦄🪄✨🐎",
  },
  {
    slug: "fairy-tale",
    name: { ru: "Сказки и фэнтези", en: "Fairy tales" },
    h1: { ru: "Эмодзи сказка и фэнтези", en: "Fairy tale & fantasy emojis" },
    intro: {
      ru: "Фея, русалка, джинн, маг, эльф, вампир, тролль, дракон, единорог, волшебная палочка и замок.",
      en: "A fairy, a merperson, a genie, a mage, an elf, a vampire, a troll, a dragon, a unicorn, a magic wand and a castle.",
    },
    add: "🧚🧜🧞🧙🧝🧛🧌🐉🦄🪄🏰🔮🍄🌟",
  },
  {
    slug: "space-aliens",
    name: { ru: "Пришельцы и роботы", en: "Aliens & robots" },
    h1: { ru: "Эмодзи инопланетянин и робот", en: "Alien & robot emojis" },
    intro: {
      ru: "Инопланетянин, монстр из игры, робот, летающая тарелка, ракета, планета, спутник и космонавт.",
      en: "An alien, a space invader, a robot, a flying saucer, a rocket, a ringed planet, a satellite and an astronaut.",
    },
    add: "👽👾🤖🛸🚀🪐🛰️🧑‍🚀👩‍🚀👨‍🚀🌌☄️🌠",
  },
  {
    slug: "dinosaurs",
    name: { ru: "Динозавры и рептилии", en: "Dinosaurs & reptiles" },
    h1: { ru: "Эмодзи динозавр", en: "Dinosaur emojis" },
    intro: {
      ru: "Тираннозавр, зауропод, дракон, крокодил, ящерица, змея, черепаха, яйцо и вулкан.",
      en: "A T-Rex, a sauropod, a dragon, a crocodile, a lizard, a snake, a turtle, an egg and a volcano.",
    },
    add: "🦖🦕🐉🐲🐊🦎🐍🐢🥚🌋🦴",
  },
  {
    slug: "wild-animals",
    name: { ru: "Дикие животные", en: "Wild animals" },
    h1: { ru: "Эмодзи дикие животные", en: "Wild animal emojis" },
    intro: {
      ru: "Лев, тигр, леопард, зебра, жираф, слон, носорог, бегемот, горилла, волк, медведь, лиса и олень.",
      en: "A lion, a tiger, a leopard, a zebra, a giraffe, an elephant, a rhino, a hippo, a gorilla, a wolf, a bear, a fox and a deer.",
    },
    add: "🦁🐯🐅🐆🦓🦒🐘🦏🦛🦍🐺🐻🦊🦌🦬🐗🦘",
  },
  {
    slug: "pets",
    name: { ru: "Домашние питомцы", en: "Pets" },
    h1: { ru: "Эмодзи домашние питомцы", en: "Pet emojis" },
    intro: {
      ru: "Собака, кошка, хомяк, кролик, мышка, попугай, рыбка, черепаха, следы лап и косточка.",
      en: "A dog, a cat, a hamster, a rabbit, a mouse, a parrot, a fish, a turtle, paw prints and a bone.",
    },
    add: "🐶🐱🐕🐈🐹🐰🐭🦜🐟🐠🐢🐾🦴🐕‍🦺🐈‍⬛",
  },
  {
    slug: "kids",
    name: { ru: "Дети и игрушки", en: "Kids & toys" },
    h1: { ru: "Эмодзи дети и игрушки", en: "Kids & toy emojis" },
    intro: {
      ru: "Ребёнок, мальчик, девочка, мишка, воздушный шар, йо-йо, воздушный змей, горка, пазл, леденец, пиньята и карусель.",
      en: "A child, a boy, a girl, a teddy bear, a balloon, a yo-yo, a kite, a playground slide, a puzzle piece, a lollipop, a piñata and a carousel horse.",
    },
    add: "🧒👦👧👶🧸🎈🪀🪁🛝🧩🍭🪅🎠🚸",
  },
  {
    slug: "pregnancy",
    name: { ru: "Беременность", en: "Pregnancy" },
    h1: { ru: "Эмодзи беременность", en: "Pregnancy emojis" },
    intro: {
      ru: "Беременные женщина, мужчина и человек, младенец, бутылочка, мишка, следы ног, бант, сердечки и голубь.",
      en: "A pregnant woman, man and person, a baby, a baby bottle, a teddy bear, footprints, a ribbon, hearts and a dove.",
    },
    add: "🤰🫃🫄👶🍼🧸👣🎀💕🕊️",
  },
  {
    slug: "beauty",
    name: { ru: "Красота и уход", en: "Beauty" },
    h1: { ru: "Эмодзи красота и маникюр", en: "Beauty emojis" },
    intro: {
      ru: "Лак для ногтей, помада, губы, стрижка, массаж лица, зеркало, флакон, гребень, платье, туфли и кольцо.",
      en: "Nail polish, lipstick, lips, a haircut, a face massage, a mirror, a lotion bottle, a hair pick, a dress, heels and a ring.",
    },
    add: "💅💄💋👄💇💆🪞🧴🪮👗👠💍✨🌸",
  },
  {
    slug: "luxury",
    name: { ru: "Богатство и роскошь", en: "Luxury" },
    h1: { ru: "Эмодзи богатство и деньги", en: "Rich & luxury emojis" },
    intro: {
      ru: "Бриллиант, мешок денег, летящие купюры, смайлик с долларами, яхта, спорткар, шампанское, корона и золотая медаль.",
      en: "A gem, a money bag, money with wings, a money-mouth face, a yacht, a race car, champagne, a crown and a gold medal.",
    },
    add: "💎💰💸🤑💵💶🛥️🏎️🍾🥂👑🥇🏦💳",
  },
  {
    slug: "casino",
    name: { ru: "Казино и карты", en: "Casino & cards" },
    h1: { ru: "Эмодзи казино и карты", en: "Casino & card emojis" },
    intro: {
      ru: "Игровой автомат, кости, масти карт, джокер, маджонг, мишень, деньги и четырёхлистный клевер.",
      en: "A slot machine, dice, card suits, a joker, mahjong, a target, money and a four-leaf clover.",
    },
    add: "🎰🎲♠️♥️♦️♣️🃏🀄🎴💰💵🍀🎯",
  },
  {
    slug: "city",
    name: { ru: "Город", en: "City" },
    h1: { ru: "Эмодзи город", en: "City emojis" },
    intro: {
      ru: "Городской пейзаж, вечерний и ночной город, офисы, магазины, музей, такси, метро, светофор и дорога.",
      en: "A cityscape, a city at dusk and at night, offices, shops, a museum, a taxi, a metro, traffic lights and a motorway.",
    },
    add: "🏙️🌆🌇🌃🏢🏬🏛️🚕🚇🚦🛣️🚌🏗️🌉",
  },
  {
    slug: "religion",
    name: { ru: "Религия", en: "Religion" },
    h1: { ru: "Эмодзи религия", en: "Religion emojis" },
    intro: {
      ru: "Церковь, мечеть, синагога, храм, кресты, полумесяц, звезда Давида, чётки, молитва и свечи.",
      en: "A church, a mosque, a synagogue, a temple, crosses, the star and crescent, the star of David, beads, prayer and candles.",
    },
    add: "⛪🕌🕍🛕⛩️✝️☦️☪️✡️🕉️☸️📿🙏🕯️",
  },
];
