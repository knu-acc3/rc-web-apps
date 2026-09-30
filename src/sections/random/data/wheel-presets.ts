import type { L10n, Locale } from "@/i18n/config";
import type { QA } from "@/registry/types";

/** Curated wheel presets: each one is its own page /spin-the-wheel/{slug}. */
export interface WheelPreset {
  slug: string;
  glyph?: string;
  /** Chip label. */
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  entries: Record<Locale, string[]>;
  /** Fixed slice colours (index-aligned), e.g. real colours on the colour wheel. */
  colors?: string[];
  /** One short paragraph about using this wheel. */
  note: L10n;
  faq: Record<Locale, QA[]>;
}

const EU_RU = [
  "Австрия", "Албания", "Андорра", "Беларусь", "Бельгия", "Болгария", "Босния и Герцеговина", "Ватикан", "Великобритания", "Венгрия", "Германия",
  "Греция", "Дания", "Ирландия", "Исландия", "Испания", "Италия", "Латвия", "Литва", "Лихтенштейн", "Люксембург", "Мальта", "Молдова", "Монако",
  "Нидерланды", "Норвегия", "Польша", "Португалия", "Россия", "Румыния", "Сан-Марино", "Северная Македония", "Сербия", "Словакия", "Словения",
  "Украина", "Финляндия", "Франция", "Хорватия", "Черногория", "Чехия", "Швейцария", "Швеция", "Эстония",
];
const EU_EN = [
  "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Czechia", "Denmark", "Estonia",
  "Finland", "France", "Germany", "Greece", "Holy See", "Hungary", "Iceland", "Ireland", "Italy", "Latvia", "Liechtenstein", "Lithuania",
  "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania",
  "Russia", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom",
];

const RU_LETTERS = "А Б В Г Д Е Ё Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Э Ю Я".split(" ");
const EN_LETTERS = "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z".split(" ");

export const WHEEL_PRESETS: WheelPreset[] = [
  {
    slug: "yes-no",
    glyph: "✅",
    name: { ru: "Да или нет", en: "Yes or no" },
    title: { ru: "Колесо «Да или нет» онлайн — крутить и получить ответ", en: "Yes or No Wheel — spin for a random answer" },
    h1: { ru: "Колесо «Да или нет»", en: "Yes or no wheel" },
    description: {
      ru: "Колесо «Да или нет» онлайн: два равных сектора, у каждого ответа шанс ровно 50 %. Можно добавить «Может быть» или сделать один из ответов весомее.",
      en: "Yes or no wheel online: two equal slices, so each answer has exactly a 50% chance. Add “Maybe” as a third slice or give one answer more weight.",
    },
    lead: { ru: "Два сектора — «Да» и «Нет», у каждого ответа шанс 50 %.", en: "Two slices — Yes and No, each with a 50% chance." },
    entries: { ru: ["Да", "Нет"], en: ["Yes", "No"] },
    colors: ["#2e7d32", "#c62828"],
    note: {
      ru: "Когда решение не принимается само, пусть его примет колесо: кнопка «Крутить колесо» — и стрелка остановится на «Да» или «Нет». Если ответ не понравился, это тоже подсказка: значит, вы уже знали, чего хотите.",
      en: "When you can't make up your mind, let the wheel decide: press “Spin the wheel” and the pointer stops on Yes or No. If you feel disappointed by the answer, that's a hint too — you already knew what you wanted.",
    },
    faq: {
      ru: [
        { q: "Можно добавить ответ «Может быть»?", a: "Да, впишите его третьей строкой. Тогда у каждого из трёх ответов будет шанс 1/3 ≈ 33,3 %." },
        { q: "Как сделать, чтобы «Да» выпадало чаще?", a: "Откройте «Веса и цвета» и поставьте «Да» вес 2: сектор станет вдвое больше, а шанс вырастет до 2/3 ≈ 66,7 %." },
      ],
      en: [
        { q: "Can I add a “Maybe” answer?", a: "Yes, type it as a third line. Each of the three answers then has a 1/3 ≈ 33.3% chance." },
        { q: "How do I make “Yes” come up more often?", a: "Open “Weights & colours” and give Yes a weight of 2: its slice doubles and its chance rises to 2/3 ≈ 66.7%." },
      ],
    },
  },
  {
    slug: "numbers-1-10",
    glyph: "🔟",
    name: { ru: "Числа от 1 до 10", en: "Numbers 1–10" },
    title: { ru: "Колесо с числами от 1 до 10 — крутить онлайн", en: "Number Wheel 1–10 — spin for a random number" },
    h1: { ru: "Колесо с числами от 1 до 10", en: "Number wheel 1 to 10" },
    description: {
      ru: "Колесо с числами от 1 до 10: десять равных секторов, каждое число выпадает с вероятностью 10 %. Подходит для игр, викторин, очерёдности и розыгрышей.",
      en: "Number wheel from 1 to 10: ten equal slices, so every number comes up with a 10% chance. Handy for games, quizzes, turn order and small giveaways.",
    },
    lead: { ru: "Десять секторов с числами 1–10, шанс каждого числа — 10 %.", en: "Ten slices numbered 1–10, each with a 10% chance." },
    entries: { ru: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], en: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
    note: {
      ru: "Колесо с числами удобно выводить на проектор или общий экран: всем видно, что выбор случайный. Для диапазонов больше 100 чисел удобнее генератор случайных чисел — на колесе надписи станут слишком мелкими.",
      en: "A number wheel works well on a projector or a shared screen, where everyone can see the pick is random. For ranges above 100 numbers use the random number generator instead — the labels would get too small.",
    },
    faq: {
      ru: [
        { q: "Как убрать выпавшее число, чтобы оно не повторилось?", a: "Включите «Убирать выпавший вариант». За десять вращений выпадут все числа по одному разу в случайном порядке." },
        { q: "Можно сделать колесо от 1 до 20?", a: "Да: допишите числа 11–20 в список, по одному на строку. Колесо перестроится сразу, у каждого числа станет шанс 5 %." },
      ],
      en: [
        { q: "How do I stop a number from coming up twice?", a: "Turn on “Remove the winner”. Ten spins then give every number exactly once, in random order." },
        { q: "Can I make a 1 to 20 wheel?", a: "Yes — add 11 to 20 to the list, one per line. The wheel updates at once and every number gets a 5% chance." },
      ],
    },
  },
  {
    slug: "what-to-eat",
    glyph: "🍕",
    name: { ru: "Что поесть", en: "What to eat" },
    title: { ru: "Колесо «Что поесть» — случайное блюдо на обед и ужин", en: "What to Eat Wheel — random food picker" },
    h1: { ru: "Колесо «Что поесть»", en: "What to eat wheel" },
    description: {
      ru: "Не можете решить, что поесть? Крутите колесо: 12 блюд от пиццы и суши до плова и лагмана, шанс каждого 8,3 %. Список легко заменить своим меню.",
      en: "Can't decide what to eat? Spin the wheel: 12 dishes from pizza and sushi to ramen and tacos, each with an 8.3% chance. Swap in your own menu in seconds.",
    },
    lead: { ru: "12 популярных блюд на колесе — крутите и заказывайте то, что выпало.", en: "12 popular dishes on a wheel — spin and order whatever it lands on." },
    entries: {
      ru: ["Пицца", "Суши", "Бургер", "Паста", "Плов", "Шаурма", "Салат", "Пельмени", "Лагман", "Суп", "Стейк", "Блины"],
      en: ["Pizza", "Sushi", "Burger", "Pasta", "Tacos", "Curry", "Salad", "Ramen", "Steak", "Fried chicken", "Soup", "Pancakes"],
    },
    note: {
      ru: "Впишите вместо блюд любимые кафе или службы доставки — и спор «куда пойдём обедать» решится за пять секунд. Если кто-то очень хочет пиццу, дайте ей вес 2.",
      en: "Replace the dishes with your favourite places or delivery apps and the “where do we eat” debate is over in five seconds. If someone really wants pizza, give it a weight of 2.",
    },
    faq: {
      ru: [
        { q: "Можно вписать свои блюда или рестораны?", a: "Да, правьте список прямо рядом с колесом. Ваш вариант сохранится в этом браузере отдельно от других колёс." },
        { q: "Что делать, если выпало то, чего не хочется?", a: "Нажмите «Убрать с колеса» и крутите ещё раз — невыпавшие блюда останутся, а убранное можно вернуть одной кнопкой." },
      ],
      en: [
        { q: "Can I use my own dishes or restaurants?", a: "Yes, edit the list next to the wheel. Your version is saved in this browser separately from other wheels." },
        { q: "What if it lands on something I don't fancy?", a: "Press “Remove from wheel” and spin again — the other dishes stay, and removed ones come back with one button." },
      ],
    },
  },
  {
    slug: "truth-or-dare",
    glyph: "🎭",
    name: { ru: "Правда или действие", en: "Truth or dare" },
    title: { ru: "Колесо «Правда или действие» онлайн", en: "Truth or Dare Wheel — spin online" },
    h1: { ru: "Колесо «Правда или действие»", en: "Truth or dare wheel" },
    description: {
      ru: "Колесо для игры «Правда или действие»: два равных сектора, шанс каждого 50 %. Добавьте «Выбор игрока» или имена участников — колесо выберет и того, кто ходит.",
      en: "Wheel for the Truth or Dare game: two equal slices, each with a 50% chance. Add “Player's choice” or everyone's names so the wheel also picks whose turn it is.",
    },
    lead: { ru: "Крутите колесо — оно решит, отвечать на вопрос или выполнять задание.", en: "Spin the wheel to decide between answering a question and doing a dare." },
    entries: { ru: ["Правда", "Действие"], en: ["Truth", "Dare"] },
    colors: ["#1e88e5", "#e53935"],
    note: {
      ru: "Классические правила: игрок крутит колесо и либо честно отвечает на вопрос, либо выполняет задание остальных. Договоритесь заранее о границах — игра должна оставаться весёлой для всех.",
      en: "Classic rules: a player spins and either answers a question honestly or does a dare set by the others. Agree on limits beforehand so the game stays fun for everyone.",
    },
    faq: {
      ru: [
        { q: "Как сделать, чтобы «Действие» выпадало чаще?", a: "Задайте «Действию» вес 2 в разделе «Веса и цвета»: тогда оно будет выпадать в двух случаях из трёх." },
        { q: "Можно вписать сразу вопросы и задания?", a: "Да. Замените два сектора своим списком вопросов и заданий — колесо выберет конкретный пункт, до 100 штук." },
      ],
      en: [
        { q: "How do I make “Dare” come up more often?", a: "Give Dare a weight of 2 under “Weights & colours” and it will come up two times out of three." },
        { q: "Can I put the actual questions and dares on the wheel?", a: "Yes. Replace the two slices with your own list of questions and dares — the wheel picks a specific one, up to 100 entries." },
      ],
    },
  },
  {
    slug: "movie-genres",
    glyph: "🎬",
    name: { ru: "Жанры фильмов", en: "Movie genres" },
    title: { ru: "Колесо жанров фильмов — что посмотреть сегодня", en: "Movie Genre Wheel — what to watch tonight" },
    h1: { ru: "Колесо жанров: какой фильм посмотреть", en: "Movie genre wheel" },
    description: {
      ru: "Не знаете, что посмотреть вечером? Колесо выберет жанр из 12: комедия, триллер, фантастика, мультфильм и другие. Шанс каждого жанра — 8,3 %.",
      en: "Not sure what to watch tonight? The wheel picks one of 12 genres: comedy, thriller, sci-fi, animation and more. Each genre has an 8.3% chance.",
    },
    lead: { ru: "12 жанров кино на колесе — выпавший жанр сузит выбор фильма.", en: "12 film genres on one wheel — let it narrow down movie night." },
    entries: {
      ru: ["Комедия", "Драма", "Боевик", "Триллер", "Ужасы", "Фантастика", "Фэнтези", "Мелодрама", "Детектив", "Мультфильм", "Приключения", "Документальный"],
      en: ["Comedy", "Drama", "Action", "Thriller", "Horror", "Sci-fi", "Fantasy", "Romance", "Mystery", "Animation", "Adventure", "Documentary"],
    },
    note: {
      ru: "Хороший приём для компании: сначала колесо выбирает жанр, затем каждый предлагает по одному фильму этого жанра, и вы крутите колесо ещё раз уже с названиями.",
      en: "A good trick for groups: the wheel picks a genre first, then everyone suggests one film in that genre, and you spin again with the titles.",
    },
    faq: {
      ru: [
        { q: "Как выбрать конкретный фильм?", a: "Замените жанры названиями фильмов из вашего списка «посмотреть позже» и крутите — колесо выберет один из них." },
        { q: "Можно исключить ужасы?", a: "Удалите строку «Ужасы» из списка — сектор исчезнет, а шансы остальных 11 жанров станут по 9,1 %." },
      ],
      en: [
        { q: "How do I pick an actual film?", a: "Replace the genres with titles from your watchlist and spin — the wheel picks one of them." },
        { q: "Can I leave out horror?", a: "Delete the “Horror” line — its slice disappears and each of the other 11 genres gets a 9.1% chance." },
      ],
    },
  },
  {
    slug: "weekend-activities",
    glyph: "🎡",
    name: { ru: "Чем заняться", en: "Weekend ideas" },
    title: { ru: "Чем заняться на выходных — колесо идей", en: "What to Do This Weekend — idea wheel" },
    h1: { ru: "Колесо «Чем заняться на выходных»", en: "What to do this weekend wheel" },
    description: {
      ru: "Колесо идей на выходные: 12 занятий — от прогулки в парке и кино до поездки за город и настольных игр. Крутите, если скучно и не хочется решать самим.",
      en: "Weekend idea wheel with 12 activities — from a walk in the park and the cinema to a day trip and board games. Spin it when you're bored and can't choose.",
    },
    lead: { ru: "12 идей для отдыха — колесо выберет, чем заняться сегодня.", en: "12 ideas for free time — the wheel chooses what to do today." },
    entries: {
      ru: ["Прогулка в парке", "Кино", "Настольные игры", "Музей", "Велопрогулка", "Новое блюдо", "Поездка за город", "Кафе с друзьями", "Отдых дома", "Спорт", "Бассейн или каток", "Книга и плед"],
      en: ["Walk in the park", "Cinema", "Board games", "Museum", "Bike ride", "Cook something new", "Day trip", "Café with friends", "Lazy day at home", "Workout", "Pool or ice rink", "Book and a blanket"],
    },
    note: {
      ru: "Добавьте сезонные идеи — горки зимой, пляж летом — и уберите то, что сейчас недоступно. Список сохранится, и в следующие выходные колесо будет готово.",
      en: "Add seasonal ideas — sledging in winter, the beach in summer — and remove what isn't possible right now. The list is saved, so the wheel is ready next weekend.",
    },
    faq: {
      ru: [
        { q: "Можно ли крутить колесо для всей семьи?", a: "Да: пусть каждый впишет по две-три идеи, а колесо выберет одну. Так никому не обидно, что выбрали не его вариант." },
        { q: "Сохранятся ли мои идеи?", a: "Да, изменённый список хранится в этом браузере. Кнопка «Исходный список» восстановит 12 стандартных идей." },
      ],
      en: [
        { q: "Can the whole family use one wheel?", a: "Yes: let everyone add two or three ideas and let the wheel choose. Nobody feels left out when their idea isn't picked." },
        { q: "Will my ideas be saved?", a: "Yes, your edited list stays in this browser. “Original list” brings back the 12 default ideas." },
      ],
    },
  },
  {
    slug: "colors",
    glyph: "🎨",
    name: { ru: "Цвета", en: "Colours" },
    title: { ru: "Колесо цветов — случайный цвет онлайн", en: "Colour Wheel Spinner — pick a random colour" },
    h1: { ru: "Колесо цветов", en: "Colour wheel spinner" },
    description: {
      ru: "Колесо с 12 цветами: каждый сектор окрашен в свой цвет, от красного до белого, шанс каждого 8,3 %. Для игр с детьми, рисования и заданий «найди предмет».",
      en: "Wheel of 12 colours where every slice is painted its own colour, red to white — 8.3% chance each. Great for kids' games, drawing and scavenger hunts.",
    },
    lead: { ru: "12 секторов настоящих цветов — выпавший цвет виден сразу.", en: "12 slices in real colours — you see the result at a glance." },
    entries: {
      ru: ["Красный", "Оранжевый", "Жёлтый", "Зелёный", "Голубой", "Синий", "Фиолетовый", "Розовый", "Коричневый", "Серый", "Чёрный", "Белый"],
      en: ["Red", "Orange", "Yellow", "Green", "Sky blue", "Blue", "Purple", "Pink", "Brown", "Grey", "Black", "White"],
    },
    colors: ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#4fc3f7", "#1e5bd9", "#8e24aa", "#f06292", "#795548", "#9e9e9e", "#212121", "#fafafa"],
    note: {
      ru: "Игра для малышей: крутите колесо и за минуту найдите дома три предмета выпавшего цвета. В русском языке голубой и синий — разные цвета, поэтому на колесе это два отдельных сектора.",
      en: "A game for little ones: spin the wheel and find three things of that colour at home within a minute. Colours can be renamed or recoloured under “Weights & colours”.",
    },
    faq: {
      ru: [
        { q: "Можно изменить цвет сектора?", a: "Да, в разделе «Веса и цвета» у каждого варианта есть выбор цвета. Подпись автоматически станет чёрной или белой — той, что лучше читается." },
        { q: "Для чего нужно колесо цветов?", a: "Для детских игр и изучения цветов, выбора цвета для рисунка или наряда, заданий в квестах и командных играх." },
      ],
      en: [
        { q: "Can I change a slice colour?", a: "Yes, every entry has a colour picker under “Weights & colours”. The label switches to black or white, whichever reads better." },
        { q: "What is a colour spinner used for?", a: "Kids' games and learning colours, picking a colour for a drawing or outfit, and tasks in quests and team games." },
      ],
    },
  },
  {
    slug: "alphabet",
    glyph: "🔤",
    name: { ru: "Буквы алфавита", en: "Alphabet" },
    title: { ru: "Колесо с буквами алфавита — случайная буква", en: "Alphabet Wheel — spin for a random letter" },
    h1: { ru: "Колесо с буквами алфавита", en: "Alphabet wheel" },
    description: {
      ru: "Колесо с буквами русского алфавита: 30 букв без Ъ, Ы и Ь, с которых не начинаются слова, шанс каждой 3,3 %. Для игр «Слова на букву», «Города» и «Крокодил».",
      en: "Alphabet wheel with all 26 letters of the English alphabet, each with a 3.8% chance. Perfect for word games, Scattergories-style rounds and the classroom.",
    },
    lead: { ru: "30 букв русского алфавита — стрелка выберет случайную.", en: "All 26 letters from A to Z — the pointer picks one at random." },
    entries: { ru: RU_LETTERS, en: EN_LETTERS },
    note: {
      ru: "Твёрдый знак, мягкий знак и Ы убраны: с них не начинаются слова, а значит, для игр они бесполезны. Если нужен весь алфавит из 33 букв, воспользуйтесь генератором случайных букв.",
      en: "Use it for “name a word that starts with…” games: spin, and everyone has a minute to write an animal, a city and a food beginning with that letter.",
    },
    faq: {
      ru: [
        { q: "Почему на колесе 30 букв, а не 33?", a: "Ъ, Ь и Ы убраны, потому что с них не начинаются слова. Если нужны все 33 буквы, впишите их в список или используйте генератор случайных букв." },
        { q: "Как не повторять буквы в игре?", a: "Включите «Убирать выпавший вариант» — каждая буква выпадет только один раз." },
      ],
      en: [
        { q: "How do I avoid repeating a letter?", a: "Turn on “Remove the winner” — each letter then comes up only once." },
        { q: "Can I remove hard letters like Q, X and Z?", a: "Yes, delete those lines from the list. With 23 letters left, each has a 4.3% chance." },
      ],
    },
  },
  {
    slug: "zodiac",
    glyph: "♈",
    name: { ru: "Знаки зодиака", en: "Zodiac signs" },
    title: { ru: "Колесо знаков зодиака — случайный знак онлайн", en: "Zodiac Wheel — spin for a random star sign" },
    h1: { ru: "Колесо знаков зодиака", en: "Zodiac sign wheel" },
    description: {
      ru: "Колесо с 12 знаками зодиака от Овна до Рыб: шанс каждого знака 1/12 ≈ 8,3 %. Для игр, розыгрышей и выбора персонажа — без предсказаний и гороскопов.",
      en: "Wheel with the 12 zodiac signs from Aries to Pisces, each with a 1/12 ≈ 8.3% chance. For games, giveaways and picking a character — no predictions involved.",
    },
    lead: { ru: "12 знаков зодиака на колесе — выпадает один случайный.", en: "The 12 star signs on one wheel — one comes up at random." },
    entries: {
      ru: ["Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева", "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"],
      en: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
    },
    note: {
      ru: "Знаки идут по кругу в привычном порядке — от Овна (с 21 марта) до Рыб. Колесо ничего не предсказывает: это просто честный случайный выбор одного из двенадцати.",
      en: "The signs run in their usual order, from Aries (from 21 March) to Pisces. The wheel predicts nothing: it's simply a fair random pick of one of twelve.",
    },
    faq: {
      ru: [
        { q: "Колесо предсказывает судьбу?", a: "Нет. Это обычный случайный выбор: у каждого знака шанс ровно 1/12, результат не связан с датой рождения." },
        { q: "Где это пригодится?", a: "В играх и конкурсах: например, выпавший знак получает приз, или игрок рассказывает о человеке с этим знаком." },
      ],
      en: [
        { q: "Does the wheel predict anything?", a: "No. It's a plain random choice: every sign has exactly a 1/12 chance and the result has nothing to do with birthdays." },
        { q: "What can I use it for?", a: "Games and contests — for example, the sign that comes up wins a prize, or a player talks about someone born under it." },
      ],
    },
  },
  {
    slug: "countries-europe",
    glyph: "🇪🇺",
    name: { ru: "Страны Европы", en: "European countries" },
    title: { ru: "Колесо стран Европы — случайная страна", en: "Random European Country Wheel — 44 countries" },
    h1: { ru: "Колесо стран Европы", en: "European country wheel" },
    description: {
      ru: "Колесо со всеми 44 странами Европы от Австрии до Эстонии: шанс каждой 2,3 %. Выберите страну для путешествия, урока географии или викторины по столицам.",
      en: "Wheel with all 44 European countries, Albania to the United Kingdom, each with a 2.3% chance. Pick a travel destination, a geography topic or a capitals quiz.",
    },
    lead: { ru: "44 государства Европы на одном колесе — выпадет одно случайное.", en: "All 44 European states on one wheel — one comes up at random." },
    entries: { ru: EU_RU, en: EU_EN },
    note: {
      ru: "В списке 44 государства, которые ООН относит к Европе, включая Россию. Турции, Казахстана и стран Закавказья нет — большая часть их территории в Азии. Названия идут по алфавиту.",
      en: "The list has the 44 states the UN classifies as European, including Russia. Turkey, Kazakhstan and the South Caucasus are not included, as most of their territory is in Asia.",
    },
    faq: {
      ru: [
        { q: "Почему в списке нет Турции и Казахстана?", a: "Мы взяли 44 государства, которые ООН относит к Европе. Турция и Казахстан лишь частично лежат в Европе, но вы можете дописать их сами." },
        { q: "Как выбрать страну для отпуска?", a: "Удалите страны, где уже были или куда сложно попасть, и крутите колесо — останутся только реальные варианты." },
      ],
      en: [
        { q: "Why aren't Turkey and Kazakhstan on the wheel?", a: "We used the 44 states the UN classifies as European. Turkey and Kazakhstan are only partly in Europe, but you can add them yourself." },
        { q: "How do I pick a holiday destination?", a: "Delete the countries you've visited or can't reach easily, then spin — only realistic options remain." },
      ],
    },
  },
  {
    slug: "days-of-week",
    glyph: "📅",
    name: { ru: "Дни недели", en: "Days of the week" },
    title: { ru: "Колесо дней недели — случайный день", en: "Days of the Week Wheel — pick a random day" },
    h1: { ru: "Колесо дней недели", en: "Days of the week wheel" },
    description: {
      ru: "Колесо с семью днями недели от понедельника до воскресенья: шанс каждого дня 1/7 ≈ 14,3 %. Выберите день для встречи, дежурства или похода в спортзал.",
      en: "Wheel with the seven days of the week, Monday to Sunday, each with a 1/7 ≈ 14.3% chance. Pick a day for a meeting, a chore rota or your gym session.",
    },
    lead: { ru: "Семь дней недели — колесо выберет один с шансом 14,3 %.", en: "Seven days — the wheel picks one, each with a 14.3% chance." },
    entries: {
      ru: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
      en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    note: {
      ru: "Для графика дежурств включите «Убирать выпавший вариант»: за семь вращений каждый день достанется ровно одному человеку. Выходные можно удалить, если нужны только будни.",
      en: "For a duty rota turn on “Remove the winner”: seven spins hand out every day exactly once. Delete Saturday and Sunday if you only need weekdays.",
    },
    faq: {
      ru: [
        { q: "Как выбрать только будний день?", a: "Удалите субботу и воскресенье из списка — останется пять дней, у каждого шанс 20 %." },
        { q: "Как распределить дни между людьми?", a: "Крутите колесо для каждого человека по очереди с включённым режимом «Убирать выпавший вариант» — дни не повторятся." },
      ],
      en: [
        { q: "How do I pick a weekday only?", a: "Delete Saturday and Sunday from the list — five days remain, each with a 20% chance." },
        { q: "How do I share days out between people?", a: "Spin once per person with “Remove the winner” turned on, so no day repeats." },
      ],
    },
  },
  {
    slug: "months",
    glyph: "🗓️",
    name: { ru: "Месяцы", en: "Months" },
    title: { ru: "Колесо месяцев — случайный месяц года", en: "Month Wheel — spin for a random month" },
    h1: { ru: "Колесо месяцев года", en: "Month of the year wheel" },
    description: {
      ru: "Колесо с 12 месяцами от января до декабря: шанс каждого 8,3 %. Выберите месяц для отпуска, дату события или тему для игры и школьного задания.",
      en: "Wheel with the 12 months from January to December, each with an 8.3% chance. Choose a month for a holiday, an event or a game and school activity.",
    },
    lead: { ru: "12 месяцев года на колесе — выпадает один случайный.", en: "The 12 months on one wheel — one comes up at random." },
    entries: {
      ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
      en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    },
    note: {
      ru: "Нужна конкретная дата, а не месяц? Генератор случайных дат выберет день в любом диапазоне и может учитывать только будни.",
      en: "Need an exact date rather than a month? The random date generator picks a day in any range and can stick to weekdays.",
    },
    faq: {
      ru: [
        { q: "Все месяцы выпадают одинаково часто?", a: "Да, сектора равные, у каждого месяца шанс 1/12. Количество дней в месяце на шанс не влияет." },
        { q: "Как выбрать только летние месяцы?", a: "Оставьте в списке июнь, июль и август — у каждого будет шанс 1/3." },
      ],
      en: [
        { q: "Is every month equally likely?", a: "Yes, the slices are equal, so each month has a 1/12 chance. The number of days in a month doesn't matter." },
        { q: "How do I pick a summer month only?", a: "Keep just June, July and August in the list — each then has a 1/3 chance." },
      ],
    },
  },
  {
    slug: "who-pays",
    glyph: "💸",
    name: { ru: "Кто платит", en: "Who pays" },
    title: { ru: "Колесо «Кто платит» — решить честно и быстро", en: "Who Pays Wheel — settle the bill fairly" },
    h1: { ru: "Колесо «Кто платит»", en: "Who pays wheel" },
    description: {
      ru: "Колесо «Кто платит»: впишите имена друзей или оставьте шесть готовых вариантов вроде «пополам» и «каждый за себя». Честный выбор без споров у кассы.",
      en: "Who pays wheel: type your friends' names or keep six ready-made options such as “split it” and “everyone for themselves”. A fair pick, no arguing at the till.",
    },
    lead: { ru: "Впишите имена — колесо решит, кто сегодня платит по счёту.", en: "Type the names — the wheel decides who pays the bill today." },
    entries: {
      ru: ["Я", "Ты", "Пополам", "Каждый за себя", "Кто опоздал", "Кто выбрал место"],
      en: ["Me", "You", "Split it", "Everyone for themselves", "Whoever was late", "Whoever chose the place"],
    },
    note: {
      ru: "Для компании впишите имена всех, кто за столом. Кто платил в прошлый раз, может получить вес поменьше — например, 0,5: тогда шанс снова платить у него будет вдвое ниже.",
      en: "For a group, type everyone's name. Whoever paid last time can get a lower weight, say 0.5, which halves their chance of paying again.",
    },
    faq: {
      ru: [
        { q: "Это честно?", a: "Да: победитель выбирается криптографическим генератором браузера, а колесо просто показывает результат. Сила вращения ни на что не влияет." },
        { q: "Как учесть, что кто-то уже платил?", a: "Снизьте его вес в разделе «Веса и цвета», например до 0,5. В таблице сразу видно, как изменились шансы." },
      ],
      en: [
        { q: "Is it fair?", a: "Yes: the browser's cryptographic generator picks the winner and the wheel only shows it. How hard you click changes nothing." },
        { q: "How do I account for someone who paid last time?", a: "Lower their weight under “Weights & colours”, for example to 0.5. The table shows the new chances immediately." },
      ],
    },
  },
  {
    slug: "chores",
    glyph: "🧹",
    name: { ru: "Домашние дела", en: "Chores" },
    title: { ru: "Колесо домашних дел — кто что делает по дому", en: "Chore Wheel — assign household chores at random" },
    h1: { ru: "Колесо домашних дел", en: "Chore wheel" },
    description: {
      ru: "Колесо домашних дел: 12 задач — посуда, мусор, пылесос, стирка и другие. Распределите обязанности между членами семьи или соседями честно и без споров.",
      en: "Chore wheel with 12 tasks — dishes, trash, vacuuming, laundry and more. Share out household jobs between family members or flatmates fairly, with no arguments.",
    },
    lead: { ru: "12 домашних дел на колесе — каждый крутит и берёт выпавшее.", en: "12 household chores — everyone spins and takes the one it lands on." },
    entries: {
      ru: ["Помыть посуду", "Пропылесосить", "Вынести мусор", "Протереть пыль", "Помыть пол", "Постирать", "Погладить бельё", "Полить цветы", "Убрать в ванной", "Сходить в магазин", "Приготовить ужин", "Разобрать шкаф"],
      en: ["Wash the dishes", "Vacuum", "Take out the trash", "Dust", "Mop the floor", "Do the laundry", "Ironing", "Water the plants", "Clean the bathroom", "Grocery run", "Cook dinner", "Sort a closet"],
    },
    note: {
      ru: "Включите «Убирать выпавший вариант» и пусть члены семьи крутят по очереди — дела распределятся без повторов. Неприятным задачам можно дать меньший вес, чтобы они выпадали реже.",
      en: "Turn on “Remove the winner” and let everyone take turns — chores are shared out with no repeats. Give the worst jobs a lower weight so they come up less often.",
    },
    faq: {
      ru: [
        { q: "Как распределить все дела без повторов?", a: "Включите «Убирать выпавший вариант»: каждое дело выпадет один раз, пока колесо не опустеет." },
        { q: "Можно вписать свои дела?", a: "Да, отредактируйте список — он сохранится в этом браузере, и на следующей неделе не придётся вводить его заново." },
      ],
      en: [
        { q: "How do I hand out every chore without repeats?", a: "Turn on “Remove the winner”: each chore comes up once until the wheel is empty." },
        { q: "Can I use my own chores?", a: "Yes, edit the list — it's saved in this browser, so next week you won't have to type it again." },
      ],
    },
  },
  {
    slug: "board-games",
    glyph: "🎲",
    name: { ru: "Настольные игры", en: "Board games" },
    title: { ru: "Колесо настольных игр — во что поиграть", en: "Board Game Wheel — what should we play?" },
    h1: { ru: "Колесо настольных игр", en: "Board game picker wheel" },
    description: {
      ru: "Колесо настольных игр: 12 известных игр от «Монополии» и «Каркассона» до «Мафии» и «Уно». Впишите игры со своей полки, и колесо решит, во что играть сегодня.",
      en: "Board game wheel with 12 well-known games from Monopoly and Carcassonne to Codenames and Uno. Add the games on your shelf and let the wheel pick tonight's.",
    },
    lead: { ru: "12 популярных настольных игр — колесо выберет, во что сыграть.", en: "12 popular board games — the wheel chooses what to play." },
    entries: {
      ru: ["Монополия", "Каркассон", "Колонизаторы", "Мафия", "Уно", "Дженга", "Имаджинариум", "Диксит", "Активити", "Шахматы", "Эрудит", "Кодовые имена"],
      en: ["Monopoly", "Carcassonne", "Catan", "Ticket to Ride", "Uno", "Jenga", "Dixit", "Codenames", "Scrabble", "Chess", "Pictionary", "Cluedo"],
    },
    note: {
      ru: "Уберите игры, для которых не хватает игроков или времени, — например, долгую «Монополию» в будний вечер. Для бросков внутри игры пригодятся онлайн-кубики.",
      en: "Remove games that need more players or time than you have — a long game of Monopoly on a weeknight, say. For rolls inside the game, use the online dice roller.",
    },
    faq: {
      ru: [
        { q: "Можно вписать игры с моей полки?", a: "Да, замените список своими играми — до 100 названий. Список сохранится в этом браузере." },
        { q: "Как сделать, чтобы короткие игры выпадали чаще?", a: "Дайте им вес 2 или 3 в разделе «Веса и цвета» — шанс вырастет пропорционально весу." },
      ],
      en: [
        { q: "Can I use the games on my shelf?", a: "Yes, replace the list with your own games — up to 100 titles. The list is saved in this browser." },
        { q: "How do I make quick games come up more often?", a: "Give them a weight of 2 or 3 under “Weights & colours” — their chance grows in proportion." },
      ],
    },
  },
  {
    slug: "sports",
    glyph: "⚽",
    name: { ru: "Виды спорта", en: "Sports" },
    title: { ru: "Колесо видов спорта — случайный спорт", en: "Sports Wheel — spin for a random sport" },
    h1: { ru: "Колесо видов спорта", en: "Sports wheel" },
    description: {
      ru: "Колесо с 12 видами спорта: футбол, баскетбол, хоккей, теннис, плавание и другие, шанс каждого 8,3 %. Для уроков физкультуры, тренировок и спортивных викторин.",
      en: "Wheel with 12 sports: football, basketball, ice hockey, tennis, swimming and more, each with an 8.3% chance. For PE lessons, workouts and sports quizzes.",
    },
    lead: { ru: "12 видов спорта на колесе — выпадает один случайный.", en: "12 sports on one wheel — one comes up at random." },
    entries: {
      ru: ["Футбол", "Баскетбол", "Волейбол", "Хоккей", "Теннис", "Плавание", "Бег", "Велоспорт", "Бокс", "Настольный теннис", "Бадминтон", "Лыжи"],
      en: ["Football", "Basketball", "Volleyball", "Ice hockey", "Tennis", "Swimming", "Running", "Cycling", "Boxing", "Table tennis", "Badminton", "Skiing"],
    },
    note: {
      ru: "Тренерам и учителям: впишите упражнения вместо видов спорта — колесо сделает разминку непредсказуемой. Для деления класса на команды есть отдельная жеребьёвка.",
      en: "Coaches and teachers: replace the sports with exercises to make warm-ups unpredictable. To split a class into teams, use the random team generator.",
    },
    faq: {
      ru: [
        { q: "Можно вписать упражнения вместо видов спорта?", a: "Да: «20 приседаний», «планка 1 минута», «10 отжиманий» — колесо выберет задание для круговой тренировки." },
        { q: "Как исключить зимние виды?", a: "Удалите «Хоккей» и «Лыжи» — останется 10 видов спорта, у каждого шанс 10 %." },
      ],
      en: [
        { q: "Can I use exercises instead of sports?", a: "Yes: “20 squats”, “1-minute plank”, “10 push-ups” — the wheel picks the next station of a circuit workout." },
        { q: "How do I leave out winter sports?", a: "Delete “Ice hockey” and “Skiing” — 10 sports remain, each with a 10% chance." },
      ],
    },
  },
  {
    slug: "desserts",
    glyph: "🍰",
    name: { ru: "Десерты", en: "Desserts" },
    title: { ru: "Колесо десертов — какой десерт выбрать", en: "Dessert Wheel — random dessert picker" },
    h1: { ru: "Колесо десертов", en: "Dessert wheel" },
    description: {
      ru: "Колесо сладкого: 12 десертов — мороженое, чизкейк, тирамису, медовик, наполеон, чак-чак и другие. Крутите, если не можете выбрать, что приготовить или заказать.",
      en: "Sweet wheel with 12 desserts — ice cream, cheesecake, tiramisu, apple pie, brownies, macarons and more. Spin it when you can't decide what to bake or order.",
    },
    lead: { ru: "12 десертов на колесе — выпавший и будет сегодняшним.", en: "12 desserts on a wheel — whatever it lands on is today's treat." },
    entries: {
      ru: ["Мороженое", "Чизкейк", "Тирамису", "Медовик", "Наполеон", "Эклеры", "Брауни", "Блинчики с вареньем", "Макаруны", "Штрудель", "Чак-чак", "Фруктовый салат"],
      en: ["Ice cream", "Cheesecake", "Tiramisu", "Apple pie", "Chocolate cake", "Brownies", "Pancakes", "Macarons", "Strudel", "Cupcakes", "Donuts", "Fruit salad"],
    },
    note: {
      ru: "Хотите что-то домашнее? Оставьте на колесе только то, что можно испечь из продуктов в холодильнике, и крутите.",
      en: "Fancy something homemade? Keep only the desserts you can make with what's in the fridge, then spin.",
    },
    faq: {
      ru: [
        { q: "Можно добавить свои десерты?", a: "Да, допишите их в список по одному на строку — колесо обновится сразу." },
        { q: "Каков шанс каждого десерта?", a: "При 12 равных секторах — 1/12 ≈ 8,3 %. Если меняете веса, точные шансы видны в таблице «Веса и цвета»." },
      ],
      en: [
        { q: "Can I add my own desserts?", a: "Yes, add them to the list one per line — the wheel updates at once." },
        { q: "What's the chance of each dessert?", a: "With 12 equal slices it's 1/12 ≈ 8.3%. If you change the weights, the exact chances appear in the “Weights & colours” table." },
      ],
    },
  },
  {
    slug: "drinks",
    glyph: "🥤",
    name: { ru: "Напитки", en: "Drinks" },
    title: { ru: "Колесо напитков — что выпить", en: "Drink Wheel — spin to choose a drink" },
    h1: { ru: "Колесо напитков", en: "Drink picker wheel" },
    description: {
      ru: "Колесо напитков: 12 вариантов — чай, кофе, какао, лимонад, смузи, морс, айран и другие. Решите, что заказать в кафе или приготовить дома, одним вращением.",
      en: "Drink wheel with 12 options — tea, coffee, hot chocolate, lemonade, smoothie, iced tea and more. Decide what to order at the café or make at home with one spin.",
    },
    lead: { ru: "12 напитков на колесе — крутите и выбирайте без раздумий.", en: "12 drinks on a wheel — spin and stop overthinking." },
    entries: {
      ru: ["Чай", "Кофе", "Какао", "Сок", "Лимонад", "Смузи", "Морс", "Компот", "Молочный коктейль", "Минеральная вода", "Айран", "Кисель"],
      en: ["Tea", "Coffee", "Hot chocolate", "Orange juice", "Lemonade", "Smoothie", "Iced tea", "Milkshake", "Sparkling water", "Kombucha", "Matcha latte", "Cola"],
    },
    note: {
      ru: "Впишите меню своей кофейни — от капучино до рафа — и пусть колесо выберет, что взять сегодня.",
      en: "Type in your coffee shop's menu — from flat white to cold brew — and let the wheel choose today's order.",
    },
    faq: {
      ru: [
        { q: "Можно вписать меню кофейни?", a: "Да, замените список любыми напитками. Он сохранится в браузере, и в следующий раз колесо будет готово." },
        { q: "Как исключить напитки с кофеином?", a: "Удалите кофе, чай и другие напитки с кофеином — останутся только подходящие варианты." },
      ],
      en: [
        { q: "Can I use my café's menu?", a: "Yes, replace the list with any drinks. It's saved in the browser, so the wheel is ready next time." },
        { q: "How do I skip caffeinated drinks?", a: "Delete coffee, tea, matcha and cola — only caffeine-free options remain." },
      ],
    },
  },
  {
    slug: "animals",
    glyph: "🦊",
    name: { ru: "Животные", en: "Animals" },
    title: { ru: "Колесо животных — случайное животное", en: "Animal Wheel — spin for a random animal" },
    h1: { ru: "Колесо животных", en: "Random animal wheel" },
    description: {
      ru: "Колесо с 16 животными: кошка, лиса, тигр, пингвин, панда, верблюд и другие, шанс каждого 6,25 %. Для «Крокодила», рисования, детских игр и заданий.",
      en: "Wheel with 16 animals: cat, fox, tiger, penguin, panda, camel and more, each with a 6.25% chance. Great for charades, drawing prompts and kids' games.",
    },
    lead: { ru: "16 животных на колесе — покажите, нарисуйте или расскажите о выпавшем.", en: "16 animals — act out, draw or describe the one it lands on." },
    entries: {
      ru: ["Кошка", "Собака", "Лиса", "Волк", "Медведь", "Заяц", "Тигр", "Лев", "Слон", "Жираф", "Пингвин", "Сова", "Дельфин", "Панда", "Верблюд", "Лошадь"],
      en: ["Cat", "Dog", "Fox", "Wolf", "Bear", "Rabbit", "Tiger", "Lion", "Elephant", "Giraffe", "Penguin", "Owl", "Dolphin", "Panda", "Camel", "Horse"],
    },
    note: {
      ru: "Идея для «Крокодила»: игрок крутит колесо, не показывая экран остальным, и изображает выпавшее животное без слов.",
      en: "Charades idea: a player spins without showing the screen to the others, then acts out the animal without words.",
    },
    faq: {
      ru: [
        { q: "Какие игры можно провести с этим колесом?", a: "«Крокодил», «Нарисуй за минуту», «Угадай по звуку» и задания для малышей — назвать, где живёт выпавшее животное." },
        { q: "Можно добавить других животных?", a: "Да, до 100 вариантов. С каждым новым животным шанс каждого сектора становится меньше." },
      ],
      en: [
        { q: "What games can I play with it?", a: "Charades, one-minute drawing, guess-the-sound and learning games for small children — say where the animal lives." },
        { q: "Can I add more animals?", a: "Yes, up to 100 entries. Every new animal makes each slice's chance a little smaller." },
      ],
    },
  },
  {
    slug: "continents",
    glyph: "🌍",
    name: { ru: "Материки", en: "Continents" },
    title: { ru: "Колесо материков — случайный материк", en: "Continent Wheel — spin for a random continent" },
    h1: { ru: "Колесо материков", en: "Continent wheel" },
    description: {
      ru: "Колесо с шестью материками Земли: Евразия, Африка, две Америки, Австралия и Антарктида, шанс каждого 16,7 %. Для уроков географии, викторин и игр.",
      en: "Wheel with the seven continents: Africa, Antarctica, Asia, Australia, Europe, North and South America, 14.3% chance each. For geography lessons and quizzes.",
    },
    lead: { ru: "Шесть материков — стрелка выберет один с шансом 1/6.", en: "Seven continents — the pointer picks one with a 1/7 chance." },
    entries: {
      ru: ["Евразия", "Африка", "Северная Америка", "Южная Америка", "Австралия", "Антарктида"],
      en: ["Africa", "Antarctica", "Asia", "Australia", "Europe", "North America", "South America"],
    },
    note: {
      ru: "В российской школьной географии материков шесть: Евразия — один материк. Если нужны части света, замените Евразию на Европу и Азию.",
      en: "The seven-continent model is the one taught in English-speaking schools. Some countries count six (Eurasia or the Americas as one) — edit the list to match yours.",
    },
    faq: {
      ru: [
        { q: "Почему материков шесть, а не семь?", a: "В русской традиции Евразия — единый материк. Во многих англоязычных странах Европу и Азию считают отдельно, поэтому там говорят о семи континентах." },
        { q: "Как сделать колесо частей света?", a: "Замените Евразию на Европу и Азию, а Австралию — на Австралию и Океанию." },
      ],
      en: [
        { q: "Why seven continents?", a: "That's the model taught in the UK, the US and many other countries. In Russia, for example, Eurasia is one continent, giving six." },
        { q: "Can I include Oceania?", a: "Yes, rename “Australia” to “Australia and Oceania” or add Oceania as a separate entry." },
      ],
    },
  },
  {
    slug: "planets",
    glyph: "🪐",
    name: { ru: "Планеты", en: "Planets" },
    title: { ru: "Колесо планет Солнечной системы", en: "Planet Wheel — random Solar System planet" },
    h1: { ru: "Колесо планет Солнечной системы", en: "Solar System planet wheel" },
    description: {
      ru: "Колесо с восемью планетами Солнечной системы от Меркурия до Нептуна: шанс каждой 12,5 %. Для уроков, докладов, викторин и космических игр с детьми.",
      en: "Wheel with the eight planets of the Solar System, Mercury to Neptune, each with a 12.5% chance. Handy for lessons, reports, quizzes and space games with kids.",
    },
    lead: { ru: "Восемь планет по порядку от Солнца — колесо выберет одну.", en: "Eight planets in order from the Sun — the wheel picks one." },
    entries: {
      ru: ["Меркурий", "Венера", "Земля", "Марс", "Юпитер", "Сатурн", "Уран", "Нептун"],
      en: ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"],
    },
    note: {
      ru: "Плутона на колесе нет: с 2006 года Международный астрономический союз считает его карликовой планетой. Его можно дописать для игры.",
      en: "Pluto isn't on the wheel: since 2006 the International Astronomical Union classifies it as a dwarf planet. Add it back for a game if you like.",
    },
    faq: {
      ru: [
        { q: "Почему нет Плутона?", a: "В 2006 году Плутон переведён в карликовые планеты. В Солнечной системе восемь планет — они все на колесе." },
        { q: "Как использовать колесо на уроке?", a: "Каждый ученик крутит колесо и готовит короткий рассказ о выпавшей планете: размер, спутники, расстояние от Солнца." },
      ],
      en: [
        { q: "Why isn't Pluto included?", a: "Pluto was reclassified as a dwarf planet in 2006. The Solar System has eight planets, and all of them are on the wheel." },
        { q: "How can I use it in class?", a: "Each student spins and gives a short talk on their planet: size, moons and distance from the Sun." },
      ],
    },
  },
  {
    slug: "school-subjects",
    glyph: "📚",
    name: { ru: "Школьные предметы", en: "School subjects" },
    title: { ru: "Колесо школьных предметов — случайный предмет", en: "School Subject Wheel — pick a random subject" },
    h1: { ru: "Колесо школьных предметов", en: "School subject wheel" },
    description: {
      ru: "Колесо с 12 школьными предметами: математика, русский язык, история, физика, химия, информатика и другие. Выберите, с чего начать домашку или тему викторины.",
      en: "Wheel with 12 school subjects: maths, English, history, physics, chemistry, computer science and more. Decide which homework to start with or a quiz topic.",
    },
    lead: { ru: "12 предметов на колесе — начните учить с выпавшего.", en: "12 subjects on a wheel — start studying whichever comes up." },
    entries: {
      ru: ["Математика", "Русский язык", "Литература", "История", "География", "Биология", "Физика", "Химия", "Информатика", "Иностранный язык", "Физкультура", "Музыка"],
      en: ["Maths", "English", "History", "Geography", "Biology", "Physics", "Chemistry", "Computer science", "Art", "Music", "PE", "Foreign language"],
    },
    note: {
      ru: "Впишите предметы из своего расписания — например, казахский язык или обществознание — и уберите те, по которым ничего не задано.",
      en: "Type the subjects from your own timetable and remove the ones with no homework today.",
    },
    faq: {
      ru: [
        { q: "Можно вписать свои предметы?", a: "Да, отредактируйте список: добавьте, например, казахский язык, алгебру и геометрию отдельно. Он сохранится в браузере." },
        { q: "Как учителю выбрать тему для опроса?", a: "Впишите темы раздела вместо предметов и крутите колесо на уроке — выбор будет прозрачным для всего класса." },
      ],
      en: [
        { q: "Can I use my own subjects?", a: "Yes, edit the list — split maths into algebra and geometry, for example. It's saved in the browser." },
        { q: "How can a teacher pick a revision topic?", a: "Replace the subjects with the unit's topics and spin in class — the whole class sees the choice is random." },
      ],
    },
  },
  {
    slug: "date-ideas",
    glyph: "💞",
    name: { ru: "Идеи для свидания", en: "Date ideas" },
    title: { ru: "Идеи для свидания — колесо случайных идей", en: "Date Night Ideas Wheel — spin for a date idea" },
    h1: { ru: "Колесо идей для свидания", en: "Date ideas wheel" },
    description: {
      ru: "Колесо идей для свидания: 12 вариантов — пикник, ужин при свечах, каток, караоке, мастер-класс и другие. Крутите вдвоём, когда не можете выбрать, куда пойти.",
      en: "Date ideas wheel with 12 options — picnic, candlelit dinner, ice skating, karaoke, a cooking class and more. Spin together when you can't decide where to go.",
    },
    lead: { ru: "12 идей для свидания — пусть решит колесо.", en: "12 date ideas — let the wheel decide." },
    entries: {
      ru: ["Пикник в парке", "Ужин при свечах", "Кино", "Прогулка на закате", "Кулинарный мастер-класс", "Каток", "Музей или выставка", "Настольные игры", "Боулинг", "Звёздное небо", "Велопрогулка", "Караоке"],
      en: ["Picnic in the park", "Candlelit dinner", "Movie night", "Sunset walk", "Cooking class", "Ice skating", "Museum or gallery", "Board game night", "Bowling", "Stargazing", "Bike ride", "Karaoke"],
    },
    note: {
      ru: "Пусть каждый впишет по несколько своих идей, не показывая другому, — тогда сюрприз будет и в самом результате.",
      en: "Let each of you add a few ideas without showing the other — then the result is a surprise for both.",
    },
    faq: {
      ru: [
        { q: "Как добавить свои идеи?", a: "Впишите их в список рядом с колесом, по одной на строку. Список сохранится в этом браузере." },
        { q: "Можно сделать, чтобы некоторые идеи выпадали чаще?", a: "Да, увеличьте их вес в разделе «Веса и цвета» — сектор станет больше, а шанс вырастет." },
      ],
      en: [
        { q: "How do I add our own ideas?", a: "Type them into the list next to the wheel, one per line. The list is saved in this browser." },
        { q: "Can some ideas come up more often?", a: "Yes, increase their weight under “Weights & colours” — the slice grows and so does the chance." },
      ],
    },
  },
  {
    slug: "fruits",
    glyph: "🍎",
    name: { ru: "Фрукты", en: "Fruits" },
    title: { ru: "Колесо фруктов — случайный фрукт", en: "Fruit Wheel — spin for a random fruit" },
    h1: { ru: "Колесо фруктов", en: "Fruit wheel" },
    description: {
      ru: "Колесо с 12 фруктами: яблоко, банан, апельсин, груша, виноград, арбуз и другие, шанс каждого 8,3 %. Для детских игр, изучения слов и выбора перекуса.",
      en: "Wheel with 12 fruits: apple, banana, orange, pear, grapes, watermelon and more, each with an 8.3% chance. For kids' games, vocabulary practice and snack picks.",
    },
    lead: { ru: "12 фруктов на колесе — выпадает один случайный.", en: "12 fruits on one wheel — one comes up at random." },
    entries: {
      ru: ["Яблоко", "Банан", "Апельсин", "Груша", "Виноград", "Персик", "Абрикос", "Киви", "Ананас", "Манго", "Арбуз", "Вишня"],
      en: ["Apple", "Banana", "Orange", "Pear", "Grapes", "Peach", "Apricot", "Kiwi", "Pineapple", "Mango", "Watermelon", "Cherry"],
    },
    note: {
      ru: "На уроке иностранного языка колесо помогает повторять слова: ученик крутит и называет выпавший фрукт по-английски или по-казахски.",
      en: "In a language class the wheel helps with vocabulary: a student spins and names the fruit in the language being learned.",
    },
    faq: {
      ru: [
        { q: "Как использовать колесо с детьми?", a: "Попросите назвать цвет выпавшего фрукта, где он растёт, или найти его на кухне." },
        { q: "Можно заменить фрукты овощами или ягодами?", a: "Да, отредактируйте список — колесо сразу перестроится под новые варианты." },
      ],
      en: [
        { q: "How can I use it with children?", a: "Ask them to name the fruit's colour, where it grows, or to find it in the kitchen." },
        { q: "Can I swap fruits for vegetables or berries?", a: "Yes, edit the list — the wheel rebuilds itself for the new entries." },
      ],
    },
  },
  {
    slug: "programming-languages",
    glyph: "💻",
    name: { ru: "Языки программирования", en: "Programming languages" },
    title: { ru: "Колесо языков программирования", en: "Programming Language Wheel — random language" },
    h1: { ru: "Колесо языков программирования", en: "Programming language wheel" },
    description: {
      ru: "Колесо с 12 языками программирования: Python, JavaScript, TypeScript, Java, C#, Go, Rust и другие. Выберите язык для пет-проекта, хакатона или выходных.",
      en: "Wheel with 12 programming languages: Python, JavaScript, TypeScript, Java, C#, Go, Rust and more. Pick one for a side project, a hackathon or a weekend kata.",
    },
    lead: { ru: "12 популярных языков программирования — колесо выберет, на чём писать.", en: "12 popular programming languages — the wheel chooses what to code in." },
    entries: {
      ru: ["Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby"],
      en: ["Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby"],
    },
    note: {
      ru: "Упражнение для разработчиков: решите одну и ту же задачу на языке, который выпал, — так проще выйти из привычного стека.",
      en: "A developer exercise: solve the same small problem in whatever language comes up — an easy way out of your usual stack.",
    },
    faq: {
      ru: [
        { q: "Какой язык выбрать новичку?", a: "Колесо выбирает случайно и не советует. Новичкам чаще рекомендуют Python или JavaScript, но лучше ориентироваться на задачу, которую хотите решать." },
        { q: "Можно добавить другие языки?", a: "Да, впишите их в список, например Haskell, Elixir или 1С, — до 100 вариантов." },
      ],
      en: [
        { q: "Which language should a beginner choose?", a: "The wheel picks at random and gives no advice. Python and JavaScript are common first choices, but it's best to start from the problem you want to solve." },
        { q: "Can I add other languages?", a: "Yes, add any you like — Haskell, Elixir, Zig — up to 100 entries." },
      ],
    },
  },
];
