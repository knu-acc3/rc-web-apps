import type { WheelPreset } from "./wheel-presets";

const N100 = Array.from({ length: 100 }, (_, i) => String(i + 1));

/** Party games, places and everyday picks (the second half of /spin-the-wheel/…). */
export const EXTRA_WHEEL_PRESETS: WheelPreset[] = [
  {
    slug: "numbers-1-100",
    glyph: "💯",
    name: { ru: "Числа от 1 до 100", en: "Numbers 1–100" },
    title: { ru: "Колесо с числами от 1 до 100 — крутить онлайн", en: "Number Wheel 1–100 — spin for a random number" },
    h1: { ru: "Колесо с числами от 1 до 100", en: "Number wheel 1 to 100" },
    description: {
      ru: "Колесо с числами от 1 до 100: сто равных секторов, у каждого числа шанс 1 %. Для лотерей, викторин и розыгрышей по номерам — результат виден всем.",
      en: "Number wheel from 1 to 100: a hundred equal slices, each number has a 1% chance. For raffles, quizzes and giveaways by number — everyone sees the result.",
    },
    lead: { ru: "Сто секторов с числами 1–100, шанс каждого числа — 1 %.", en: "A hundred slices numbered 1–100, each with a 1% chance." },
    entries: { ru: N100, en: N100 },
    note: {
      ru: "Сто секторов — предел колеса: надписи становятся мелкими, но выпавшее число всегда крупно показано под колесом. Чтобы номера не повторялись, включите «Убирать выпавший вариант».",
      en: "A hundred slices is the wheel's limit: labels get small, but the winning number is always shown large under the wheel. Turn on “Remove the winner” so numbers don't repeat.",
    },
    faq: {
      ru: [
        { q: "Как разыграть несколько номеров без повторов?", a: "Включите «Убирать выпавший вариант» и крутите колесо нужное число раз: выпавшие номера исчезают с колеса и остаются в истории." },
        { q: "Нужен диапазон больше 100?", a: "Для больших диапазонов удобнее генератор случайных чисел: он выдаёт числа до миллиарда и умеет делать выборку без повторов." },
      ],
      en: [
        { q: "How do I draw several numbers without repeats?", a: "Turn on “Remove the winner” and spin as many times as you need: drawn numbers leave the wheel and stay in the history." },
        { q: "Need a range above 100?", a: "For bigger ranges, use the random number generator: it goes up to a billion and can draw without repeats." },
      ],
    },
  },
  {
    slug: "cities-kazakhstan",
    glyph: "🇰🇿",
    name: { ru: "Города Казахстана", en: "Cities of Kazakhstan" },
    title: { ru: "Колесо с городами Казахстана — случайный город", en: "Kazakhstan Cities Wheel — spin for a random city" },
    h1: { ru: "Колесо с городами Казахстана", en: "Kazakhstan cities wheel" },
    description: {
      ru: "Колесо с городами Казахстана: столица, города республиканского значения и областные центры. Выберите город для поездки, игры в города или викторины.",
      en: "Kazakhstan cities wheel: the capital, the cities of republican significance and the regional centres. Pick a city for a trip, a quiz or a game of cities.",
    },
    lead: { ru: "Астана, Алматы, Шымкент и областные центры — 20 городов на колесе.", en: "Astana, Almaty, Shymkent and the regional centres — 20 cities on the wheel." },
    entries: {
      ru: ["Астана", "Алматы", "Шымкент", "Актобе", "Караганда", "Тараз", "Павлодар", "Усть-Каменогорск", "Семей", "Атырау", "Костанай", "Кызылорда", "Уральск", "Петропавловск", "Актау", "Талдыкорган", "Туркестан", "Кокшетау", "Жезказган", "Конаев"],
      en: ["Astana", "Almaty", "Shymkent", "Aktobe", "Karaganda", "Taraz", "Pavlodar", "Oskemen", "Semey", "Atyrau", "Kostanay", "Kyzylorda", "Oral", "Petropavl", "Aktau", "Taldykorgan", "Turkistan", "Kokshetau", "Zhezkazgan", "Konaev"],
    },
    note: {
      ru: "На колесе — три города республиканского значения и центры всех 17 областей, включая новые Абайскую, Жетысускую и Улытаускую. Добавьте свой посёлок или уберите лишнее прямо в списке.",
      en: "The wheel holds the three cities of republican significance and the centres of all 17 regions, including the new Abai, Zhetysu and Ulytau regions. Add your own town or remove any in the list.",
    },
    faq: {
      ru: [
        { q: "Почему на колесе 20 городов?", a: "Это Астана, Алматы и Шымкент (города республиканского значения) и административные центры 17 областей Казахстана по состоянию на 2024 год." },
        { q: "Можно добавить свой город?", a: "Да, впишите его отдельной строкой. Список сохранится в этом браузере только для этой подборки." },
      ],
      en: [
        { q: "Why 20 cities?", a: "Astana, Almaty and Shymkent (cities of republican significance) plus the administrative centres of Kazakhstan's 17 regions as of 2024." },
        { q: "Can I add my own town?", a: "Yes, type it as a new line. The list is saved in this browser for this preset only." },
      ],
    },
  },
  {
    slug: "cities-russia",
    glyph: "🏙️",
    name: { ru: "Города России", en: "Cities of Russia" },
    title: { ru: "Колесо с городами России — случайный город онлайн", en: "Russian Cities Wheel — spin for a random city" },
    h1: { ru: "Колесо с городами России", en: "Russian cities wheel" },
    description: {
      ru: "Колесо с городами России: 20 крупнейших городов от Москвы до Владивостока. Крутите, чтобы выбрать направление поездки или начать игру в города.",
      en: "Russian cities wheel: the 20 largest cities from Moscow to Vladivostok. Spin to choose where to travel next or to start a game of cities.",
    },
    lead: { ru: "Двадцать крупнейших городов России — от Москвы до Владивостока.", en: "Russia's twenty largest cities — from Moscow to Vladivostok." },
    entries: {
      ru: ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород", "Красноярск", "Челябинск", "Самара", "Уфа", "Ростов-на-Дону", "Краснодар", "Омск", "Воронеж", "Пермь", "Волгоград", "Саратов", "Тюмень", "Иркутск", "Владивосток"],
      en: ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Krasnoyarsk", "Chelyabinsk", "Samara", "Ufa", "Rostov-on-Don", "Krasnodar", "Omsk", "Voronezh", "Perm", "Volgograd", "Saratov", "Tyumen", "Irkutsk", "Vladivostok"],
    },
    note: {
      ru: "В списке города-миллионники и другие крупные центры из разных частей страны, поэтому колесо подходит и для выбора маршрута, и для географических викторин. Список легко поменять под свою игру.",
      en: "The list mixes million-plus cities and other big centres from all over the country, so the wheel works for picking a trip and for geography quizzes. Change the list to fit your game.",
    },
    faq: {
      ru: [
        { q: "По какому принципу выбраны города?", a: "Это крупнейшие по населению города России из разных регионов — от европейской части до Сибири и Дальнего Востока." },
        { q: "Как сыграть в города с колесом?", a: "Крутите колесо, чтобы выбрать первый город, а дальше называйте города на последнюю букву предыдущего. Колесо можно крутить снова, когда игра заходит в тупик." },
      ],
      en: [
        { q: "How were the cities chosen?", a: "These are Russia's most populous cities from different regions — from the European part to Siberia and the Far East." },
        { q: "How do I play a game of cities with it?", a: "Spin for the first city, then take turns naming cities that start with the last letter of the previous one. Spin again whenever the game gets stuck." },
      ],
    },
  },
  {
    slug: "never-have-i-ever",
    glyph: "🙈",
    name: { ru: "Я никогда не…", en: "Never have I ever" },
    title: { ru: "Колесо «Я никогда не…» — вопросы для игры онлайн", en: "Never Have I Ever Wheel — spin for a question" },
    h1: { ru: "Колесо «Я никогда не…»", en: "Never have I ever wheel" },
    description: {
      ru: "Колесо для игры «Я никогда не…»: 24 безобидных утверждения для компании друзей, вечеринки или знакомства. Крутите и узнавайте друг о друге новое.",
      en: "Never have I ever wheel: 24 friendly statements for friends, a party or an icebreaker. Spin the wheel and learn something new about each other.",
    },
    lead: { ru: "Двадцать четыре утверждения для игры — без пошлостей, подходят для любой компании.", en: "Twenty-four statements for the game — clean and fine for any company." },
    entries: {
      ru: ["…летал на самолёте", "…ночевал в палатке", "…пел в караоке", "…опаздывал на поезд", "…засыпал в кино", "…терял ключи", "…готовил на всю компанию", "…прыгал с парашютом", "…красил волосы в яркий цвет", "…ездил автостопом", "…выступал на сцене", "…забывал день рождения друга", "…плавал в море ночью", "…ел что-то экзотическое", "…катался на лошади", "…выигрывал в лотерею", "…встречал рассвет в горах", "…танцевал под дождём", "…отправлял сообщение не тому человеку", "…ходил в поход больше трёх дней", "…пробовал рыбалку", "…ломал телефон", "…учил иностранный язык", "…видел северное сияние"],
      en: ["…been on a plane", "…slept in a tent", "…sung karaoke", "…missed a train", "…fallen asleep in a cinema", "…lost my keys", "…cooked for the whole group", "…gone skydiving", "…dyed my hair a bright colour", "…hitchhiked", "…performed on stage", "…forgotten a friend's birthday", "…swum in the sea at night", "…eaten something exotic", "…ridden a horse", "…won a lottery", "…watched a sunrise in the mountains", "…danced in the rain", "…texted the wrong person", "…hiked for more than three days", "…been fishing", "…broken a phone", "…learned a foreign language", "…seen the northern lights"],
    },
    note: {
      ru: "Правила простые: ведущий крутит колесо и читает утверждение, а те, кто это делал, загибают палец или поднимают руку. Включите «Убирать выпавший вариант», чтобы вопросы не повторялись, и дописывайте свои.",
      en: "The rules are simple: the host spins and reads the statement, and everyone who has done it lowers a finger or raises a hand. Turn on “Remove the winner” so questions don't repeat, and add your own.",
    },
    faq: {
      ru: [
        { q: "Как играть в «Я никогда не…»?", a: "Каждый показывает пять или десять пальцев. Ведущий крутит колесо и читает утверждение, те, кто это делал, загибают палец. Кто первым останется без пальцев — проиграл." },
        { q: "Можно добавить свои вопросы?", a: "Да, впишите их в список рядом с колесом. Подборка сохранится в этом браузере и будет ждать следующей вечеринки." },
      ],
      en: [
        { q: "How do you play Never Have I Ever?", a: "Everyone holds up five or ten fingers. The host spins and reads a statement; anyone who has done it lowers a finger. The first one out of fingers loses." },
        { q: "Can I add my own statements?", a: "Yes, type them into the list next to the wheel. Your set is saved in this browser for the next party." },
      ],
    },
  },
  {
    slug: "party-tasks",
    glyph: "🎉",
    name: { ru: "Задания для вечеринки", en: "Party challenges" },
    title: { ru: "Колесо заданий для вечеринки — весёлые фанты онлайн", en: "Party Challenge Wheel — fun dares for any party" },
    h1: { ru: "Колесо заданий для вечеринки", en: "Party challenge wheel" },
    description: {
      ru: "Колесо заданий для вечеринки: 20 весёлых и безобидных фантов — спеть, изобразить, рассказать, станцевать. Для дня рождения, корпоратива и семейного праздника.",
      en: "Party challenge wheel: 20 fun and harmless dares — sing, act out, tell a story, dance. For birthdays, office parties and family celebrations.",
    },
    lead: { ru: "Двадцать фантов, которые можно выполнить в любой компании.", en: "Twenty dares anyone can do in any company." },
    entries: {
      ru: ["Спой припев любимой песни", "Изобрази животное без слов", "Расскажи смешную историю", "Станцуй 15 секунд", "Скажи комплимент соседу справа", "Говори голосом робота до следующего хода", "Покажи фокус", "Изобрази известного человека", "Назови 5 фруктов за 10 секунд", "Сделай селфи с серьёзным лицом", "Придумай тост", "Нарисуй портрет соседа за минуту", "Расскажи скороговорку", "Покажи пантомимой профессию", "Пройдись как модель по подиуму", "Ответь честно на любой вопрос", "Прочитай стишок с выражением", "Изобрази эмодзи — пусть угадают", "Сделай 10 приседаний", "Придумай новое название для праздника"],
      en: ["Sing the chorus of your favourite song", "Act out an animal without words", "Tell a funny story", "Dance for 15 seconds", "Pay a compliment to the person on your right", "Talk like a robot until your next turn", "Show a magic trick", "Impersonate a famous person", "Name 5 fruits in 10 seconds", "Take a selfie with a serious face", "Make a toast", "Draw your neighbour in one minute", "Say a tongue twister", "Mime a profession", "Walk like a catwalk model", "Answer any question honestly", "Recite a poem with feeling", "Act out an emoji for others to guess", "Do 10 squats", "Invent a new name for the party"],
    },
    note: {
      ru: "Выведите колесо на телевизор или общий экран и крутите по очереди: кто крутит, тот и выполняет. Уберите задания, которые не подходят вашей компании, и добавьте свои — список сохранится.",
      en: "Put the wheel on a TV or shared screen and take turns: whoever spins does the dare. Remove dares that don't fit your group and add your own — the list is saved.",
    },
    faq: {
      ru: [
        { q: "Задания подходят для детей?", a: "Да, все фанты безобидные: спеть, станцевать, изобразить, рассказать. Для детского праздника можно убрать «тост» и добавить свои задания." },
        { q: "Как не повторять задания?", a: "Включите «Убирать выпавший вариант»: выполненное задание исчезнет с колеса, а вернуть всё можно одной кнопкой." },
      ],
      en: [
        { q: "Are the dares fine for kids?", a: "Yes, they're all harmless: sing, dance, act, tell. For a kids' party, remove the toast and add your own." },
        { q: "How do I avoid repeats?", a: "Turn on “Remove the winner”: a finished dare disappears from the wheel, and one button brings them all back." },
      ],
    },
  },
  {
    slug: "gift-ideas",
    glyph: "🎁",
    name: { ru: "Идеи подарков", en: "Gift ideas" },
    title: { ru: "Колесо идей подарков — что подарить, решит колесо", en: "Gift Ideas Wheel — spin to decide what to give" },
    h1: { ru: "Колесо идей подарков", en: "Gift ideas wheel" },
    description: {
      ru: "Колесо идей подарков: 20 универсальных вариантов — от книги и настольной игры до впечатлений и мастер-класса. Крутите, если не знаете, что подарить.",
      en: "Gift ideas wheel: 20 universal options — from a book and a board game to experiences and a workshop. Spin it when you don't know what to give.",
    },
    lead: { ru: "Двадцать идей подарков для друзей, коллег и близких.", en: "Twenty gift ideas for friends, colleagues and family." },
    entries: {
      ru: ["Книга", "Настольная игра", "Билеты в театр или кино", "Сертификат в магазин", "Мастер-класс", "Растение в горшке", "Плед", "Набор чая или кофе", "Фотокнига", "Наушники", "Ароматическая свеча", "Термокружка", "Пазл", "Поход в ресторан", "Подписка на сервис", "Подарок своими руками", "Спортивный инвентарь", "Квест", "Поездка на выходные", "Сладкий набор"],
      en: ["A book", "A board game", "Theatre or cinema tickets", "A gift card", "A workshop", "A potted plant", "A blanket", "A tea or coffee set", "A photo book", "Headphones", "A scented candle", "A travel mug", "A jigsaw puzzle", "Dinner out", "A subscription", "Something handmade", "Sports gear", "An escape room", "A weekend trip", "A box of sweets"],
    },
    note: {
      ru: "Колесо не знает вкусов именинника, поэтому оставьте на нём только то, что точно подойдёт, и допишите свои идеи. Выпавший вариант — повод подумать, а не обязательство: крутите ещё раз, если не откликается.",
      en: "The wheel doesn't know the person's taste, so keep only what would suit them and add your own ideas. The result is a nudge, not a rule: spin again if it doesn't feel right.",
    },
    faq: {
      ru: [
        { q: "Можно составить свой список подарков?", a: "Да: правьте список рядом с колесом, добавляйте идеи и веса. Например, дайте самой желанной идее вес 3, чтобы она выпадала чаще." },
        { q: "Как выбрать подарок вдвоём?", a: "Пусть каждый впишет свои варианты, а колесо решит. Кнопка «Ссылка» под колесом отправит этот список вместе с колесом." },
      ],
      en: [
        { q: "Can I make my own list?", a: "Yes: edit the list next to the wheel and add ideas and weights. For instance, give the favourite idea a weight of 3 so it comes up more often." },
        { q: "How do we choose a gift together?", a: "Each of you adds options and the wheel decides. The Link button shares the list together with the wheel." },
      ],
    },
  },
  {
    slug: "exercises",
    glyph: "💪",
    name: { ru: "Упражнения", en: "Exercises" },
    title: { ru: "Колесо упражнений — случайная тренировка онлайн", en: "Workout Wheel — spin for a random exercise" },
    h1: { ru: "Колесо упражнений", en: "Workout wheel" },
    description: {
      ru: "Колесо упражнений для тренировки дома: приседания, отжимания, планка, выпады, берпи и ещё 11 упражнений без снаряжения. Крутите и выполняйте подход.",
      en: "Workout wheel for training at home: squats, push-ups, plank, lunges, burpees and 11 more exercises without equipment. Spin and do a set.",
    },
    lead: { ru: "Шестнадцать упражнений без инвентаря — для разминки и домашних тренировок.", en: "Sixteen no-equipment exercises — for warm-ups and home workouts." },
    entries: {
      ru: ["Приседания", "Отжимания", "Планка", "Выпады", "Берпи", "Скалолаз", "Прыжки «звезда»", "Скручивания", "Ягодичный мостик", "Боковая планка", "Бег на месте", "Супермен", "Обратные отжимания", "Подъёмы на носки", "Велосипед лёжа", "Стульчик у стены"],
      en: ["Squats", "Push-ups", "Plank", "Lunges", "Burpees", "Mountain climbers", "Jumping jacks", "Crunches", "Glute bridge", "Side plank", "Running in place", "Superman", "Triceps dips", "Calf raises", "Bicycle crunches", "Wall sit"],
    },
    note: {
      ru: "Для интервальной тренировки крутите колесо перед каждым раундом и работайте 40 секунд с отдыхом 20 — включите рядом интервальный таймер. Убирайте упражнения, которые вам не подходят по здоровью.",
      en: "For interval training, spin before each round and work 40 seconds with 20 seconds of rest — keep the interval timer open alongside. Remove any exercise that doesn't suit your health.",
    },
    faq: {
      ru: [
        { q: "Сколько повторений делать?", a: "Начните с 10–15 повторений или 30–40 секунд на упражнение. Если что-то вызывает боль, пропустите упражнение и уберите его с колеса." },
        { q: "Как собрать тренировку из колеса?", a: "Крутите колесо 6–8 раз, выполняя каждое выпавшее упражнение, и повторите круг 2–3 раза. Включите «Убирать выпавший вариант», чтобы упражнения не повторялись." },
      ],
      en: [
        { q: "How many reps should I do?", a: "Start with 10–15 reps or 30–40 seconds per exercise. If anything hurts, skip it and remove it from the wheel." },
        { q: "How do I build a workout with the wheel?", a: "Spin 6–8 times, doing each exercise as it comes up, and repeat the circuit 2–3 times. Turn on “Remove the winner” to avoid repeats." },
      ],
    },
  },
  {
    slug: "kazakh-names",
    glyph: "🧑",
    name: { ru: "Казахские имена", en: "Kazakh names" },
    title: { ru: "Колесо с казахскими именами — случайное имя онлайн", en: "Kazakh Names Wheel — spin for a random name" },
    h1: { ru: "Колесо с казахскими именами", en: "Kazakh names wheel" },
    description: {
      ru: "Колесо с казахскими именами: 24 популярных мужских и женских имени. Подходит для игр, выбора героя рассказа или жеребьёвки в классе, если вписать свой список.",
      en: "Kazakh names wheel: 24 popular male and female Kazakh names. Good for games, picking a story character, or a class draw once you add your own list.",
    },
    lead: { ru: "Двадцать четыре популярных казахских имени — мужские и женские поровну.", en: "Twenty-four popular Kazakh names — half male, half female." },
    entries: {
      ru: ["Алихан", "Нурсултан", "Арман", "Ерлан", "Данияр", "Айдос", "Тимур", "Рустем", "Санжар", "Ержан", "Бауыржан", "Асхат", "Айгерим", "Аружан", "Динара", "Жансая", "Мадина", "Камила", "Айсулу", "Томирис", "Дана", "Асель", "Аяулым", "Инкар"],
      en: ["Alikhan", "Nursultan", "Arman", "Yerlan", "Daniyar", "Aidos", "Timur", "Rustem", "Sanzhar", "Yerzhan", "Bauyrzhan", "Askhat", "Aigerim", "Aruzhan", "Dinara", "Zhansaya", "Madina", "Kamila", "Aisulu", "Tomiris", "Dana", "Assel", "Ayaulym", "Inkar"],
    },
    note: {
      ru: "Чтобы выбрать ученика для ответа или игрока для хода, замените имена на свой список — он сохранится в браузере. Для генерации новых имён с фамилиями есть отдельный генератор случайных имён.",
      en: "To pick a student or a player, replace the names with your own list — it's saved in the browser. To generate new names with surnames, use the random name generator.",
    },
    faq: {
      ru: [
        { q: "Можно вписать имена своего класса?", a: "Да, замените список своими именами — по одному на строку. Он сохранится в этом браузере, и в следующий раз колесо будет готово." },
        { q: "Как выбрать нескольких человек без повторов?", a: "Включите «Убирать выпавший вариант»: каждый выбранный исчезает с колеса до сброса." },
      ],
      en: [
        { q: "Can I enter my class's names?", a: "Yes, replace the list with your own names, one per line. It's saved in this browser, so the wheel is ready next time." },
        { q: "How do I pick several people without repeats?", a: "Turn on “Remove the winner”: each pick leaves the wheel until you reset it." },
      ],
    },
  },
  {
    slug: "prizes",
    glyph: "🏆",
    name: { ru: "Призы для розыгрыша", en: "Prize wheel" },
    title: { ru: "Колесо призов для розыгрыша — крутить онлайн", en: "Prize Wheel — spin to win in a giveaway" },
    h1: { ru: "Колесо призов", en: "Prize wheel" },
    description: {
      ru: "Колесо призов для розыгрыша: скидки, подарок, бесплатная доставка и «попробуйте ещё». Впишите свои призы, задайте веса и крутите на стриме или празднике.",
      en: "Prize wheel for giveaways: discounts, a gift, free delivery and “try again”. Add your own prizes, set weights and spin it on a stream or at an event.",
    },
    lead: { ru: "Шаблон колеса призов — замените на свои призы и задайте шансы весами.", en: "A prize wheel template — swap in your own prizes and set the odds with weights." },
    entries: {
      ru: ["Скидка 5 %", "Скидка 10 %", "Скидка 15 %", "Подарок", "Бесплатная доставка", "Попробуйте ещё раз", "Скидка 20 %", "Сувенир", "Главный приз", "Бонусные баллы"],
      en: ["5% off", "10% off", "15% off", "A gift", "Free delivery", "Try again", "20% off", "A souvenir", "Grand prize", "Bonus points"],
    },
    note: {
      ru: "Шанс каждого приза задаётся весом: дайте «Главному призу» вес 1, а «Скидке 5 %» — 5, и колесо станет честным по заданным правилам. Опубликуйте правила розыгрыша заранее и крутите колесо на экране у всех на виду.",
      en: "Each prize's chance is its weight: give the grand prize weight 1 and 5% off weight 5, and the wheel follows exactly those odds. Publish the rules in advance and spin where everyone can see.",
    },
    faq: {
      ru: [
        { q: "Как сделать главный приз редким?", a: "Откройте «Веса и цвета» и уменьшите его вес относительно остальных. Точный шанс каждого приза показан в таблице." },
        { q: "Результат можно подделать?", a: "Победителя выбирает криптографический генератор браузера, а анимация лишь показывает выбор. Для прозрачности крутите колесо в прямом эфире или на общем экране." },
      ],
      en: [
        { q: "How do I make the grand prize rare?", a: "Open “Weights & colours” and lower its weight relative to the others. The table shows each prize's exact chance." },
        { q: "Can the result be rigged?", a: "The winner is chosen by the browser's cryptographic generator; the animation only shows that choice. For transparency, spin live or on a shared screen." },
      ],
    },
  },
  {
    slug: "what-to-do",
    glyph: "🤷",
    name: { ru: "Чем заняться", en: "What to do" },
    title: { ru: "Колесо «Чем заняться» — идеи, когда скучно", en: "What Should I Do Wheel — ideas when you're bored" },
    h1: { ru: "Колесо «Чем заняться»", en: "What should I do wheel" },
    description: {
      ru: "Колесо «Чем заняться», когда скучно: прогулка, книга, фильм, уборка, звонок другу и ещё 15 идей на вечер или выходной. Крутите и не тратьте время на выбор.",
      en: "What should I do wheel for when you're bored: a walk, a book, a film, tidying up, calling a friend and 15 more ideas for an evening or a day off.",
    },
    lead: { ru: "Двадцать занятий дома и на улице — когда не можете решить сами.", en: "Twenty things to do at home or outside — for when you can't decide." },
    entries: {
      ru: ["Прогуляться", "Почитать книгу", "Посмотреть фильм", "Навести порядок", "Позвонить другу", "Приготовить что-то новое", "Сделать зарядку", "Порисовать", "Сыграть в настольную игру", "Выучить 10 слов на другом языке", "Послушать подкаст", "Разобрать фото", "Сходить в музей", "Покататься на велосипеде", "Написать письмо", "Собрать пазл", "Сходить в кафе", "Посадить растение", "Устроить пикник", "Поспать днём"],
      en: ["Go for a walk", "Read a book", "Watch a film", "Tidy up", "Call a friend", "Cook something new", "Do a workout", "Draw something", "Play a board game", "Learn 10 words in another language", "Listen to a podcast", "Sort your photos", "Visit a museum", "Go for a bike ride", "Write a letter", "Do a jigsaw puzzle", "Go to a café", "Plant something", "Have a picnic", "Take a nap"],
    },
    note: {
      ru: "Уберите то, что сейчас недоступно (например, прогулки в плохую погоду), и добавьте свои любимые занятия — колесо станет личным списком идей. Для выходных с семьёй есть отдельное колесо идей на выходные.",
      en: "Remove what isn't possible right now (like walks in bad weather) and add your favourite activities — the wheel becomes your personal idea list. There's also a separate wheel for weekend plans.",
    },
    faq: {
      ru: [
        { q: "Можно сделать колесо только для дома?", a: "Да, удалите занятия на улице и впишите свои домашние — список сохранится в этом браузере для этой подборки." },
        { q: "Что если выпало то, чего не хочется?", a: "Крутите ещё раз или уменьшите вес этого занятия в «Весах и цветах», чтобы оно выпадало реже." },
      ],
      en: [
        { q: "Can I make an indoor-only wheel?", a: "Yes, delete the outdoor ideas and add your own indoor ones — the list is saved in this browser for this preset." },
        { q: "What if I don't like the result?", a: "Spin again, or lower that activity's weight under “Weights & colours” so it comes up less often." },
      ],
    },
  },
];
