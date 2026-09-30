import type { L10n } from "@/i18n/config";

/** Texts of the symbol collections (/symbols/{id}); membership lives in scripts/data/gen-symbols-collections.mjs. */
export interface CollectionMeta {
  /** Short label for chips and cards. */
  name: L10n;
  /** Main search phrase. */
  h1: L10n;
  /** One or two factual sentences about the contents. */
  intro: L10n;
}

export const COLLECTION_META: Record<string, CollectionMeta> = {
  hearts: {
    name: { ru: "Сердечки", en: "Hearts" },
    h1: { ru: "Символы сердечек", en: "Heart symbols" },
    intro: {
      ru: "Текстовые сердечки ♥ ♡ ❤ ❥ ❦ и эмодзи-сердца всех цветов. Текстовые символы отображаются обычным шрифтом, поэтому подходят для ников и игр, где цветные эмодзи не показываются.",
      en: "Text hearts ♥ ♡ ❤ ❥ ❦ and emoji hearts in every color. Text symbols use the regular font, so they work in nicknames and games that don’t show color emoji.",
    },
  },
  stars: {
    name: { ru: "Звёзды", en: "Stars" },
    h1: { ru: "Символы звёзд", en: "Star symbols" },
    intro: {
      ru: "Чёрная ★ и белая ☆ звёзды, четырёх-, шести-, восьми- и двенадцатиконечные звёзды, пентаграмма ⛤ и звёзды-эмодзи ⭐ 🌟 ✨.",
      en: "Black ★ and white ☆ stars, four-, six-, eight- and twelve-pointed stars, the pentagram ⛤ and emoji stars ⭐ 🌟 ✨.",
    },
  },
  asterisks: {
    name: { ru: "Звёздочки", en: "Asterisks" },
    h1: { ru: "Символы звёздочек (астериски)", en: "Asterisk symbols" },
    intro: {
      ru: "Звёздочки для сносок и оформления: обычная *, нижняя ⁎, двойная ⁑, астеризм ⁂ и декоративные звёздочки с лучами-каплями из набора дингбатов.",
      en: "Asterisks for footnotes and decoration: the regular *, low ⁎, double ⁑, the asterism ⁂ and decorative teardrop-spoked asterisks from the dingbats.",
    },
  },
  arrows: {
    name: { ru: "Стрелки", en: "Arrows" },
    h1: { ru: "Символы стрелок", en: "Arrow symbols" },
    intro: {
      ru: "Стрелки во все стороны: простые ← ↑ → ↓, двойные ⇐ ⇒, с крючком ↩ ↪, круговые ↺ ↻, длинные ⟶ и декоративные ➔ ➤ — около 200 символов из блоков «Стрелки» и «Дингбаты».",
      en: "Arrows in every direction: simple ← ↑ → ↓, double ⇐ ⇒, hooked ↩ ↪, circular ↺ ↻, long ⟶ and decorative ➔ ➤ — about 200 characters from the Arrows and Dingbats blocks.",
    },
  },
  "check-marks": {
    name: { ru: "Галочки", en: "Check marks" },
    h1: { ru: "Символ галочки ✓", en: "Check mark symbols" },
    intro: {
      ru: "Галочки ✓ ✔, квадраты для отметок ☐ ☑ ☒ и крестики ✗ ✘ — для чек-листов, опросов и списков задач.",
      en: "Check marks ✓ ✔, ballot boxes ☐ ☑ ☒ and ballot crosses ✗ ✘ — for checklists, polls and to-do lists.",
    },
  },
  crosses: {
    name: { ru: "Крестики и кресты", en: "Crosses" },
    h1: { ru: "Символы крестиков и крестов", en: "Cross symbols" },
    intro: {
      ru: "Крестики ✕ ✖ ☓ для отметок, знак умножения × и христианские кресты: латинский ✝, православный ☦, мальтийский ✠, лотарингский ☨ и иерусалимский ☩.",
      en: "X marks ✕ ✖ ☓, the multiplication sign × and Christian crosses: Latin ✝, Orthodox ☦, Maltese ✠, Lorraine ☨ and Jerusalem ☩.",
    },
  },
  bullets: {
    name: { ru: "Маркеры списка", en: "Bullets" },
    h1: { ru: "Символы маркеров списка", en: "Bullet point symbols" },
    intro: {
      ru: "Точки и значки для списков: • ◦ ‣ ⁃ ▪ ▫ ► ❖. Их вставляют перед пунктами там, где нет автоматических маркированных списков: в мессенджерах, описаниях и таблицах.",
      en: "Dots and marks for lists: • ◦ ‣ ⁃ ▪ ▫ ► ❖. Put them before items where automatic bulleted lists aren’t available: messengers, descriptions and spreadsheets.",
    },
  },
  math: {
    name: { ru: "Математика", en: "Math" },
    h1: { ru: "Математические символы", en: "Math symbols" },
    intro: {
      ru: "Знаки математики и логики: ± × ÷ ≠ ≈ ≤ ≥, корни √ ∛, бесконечность ∞, суммы и интегралы ∑ ∫, множества ∈ ∪ ∩ ⊂ и числовые множества ℕ ℤ ℚ ℝ ℂ.",
      en: "Math and logic signs: ± × ÷ ≠ ≈ ≤ ≥, roots √ ∛, infinity ∞, sums and integrals ∑ ∫, set symbols ∈ ∪ ∩ ⊂ and number sets ℕ ℤ ℚ ℝ ℂ.",
    },
  },
  greek: {
    name: { ru: "Греческий алфавит", en: "Greek alphabet" },
    h1: { ru: "Греческий алфавит: буквы и символы", en: "Greek alphabet letters" },
    intro: {
      ru: "Все 24 буквы греческого алфавита, заглавные и строчные, конечная сигма ς и варианты начертания ϑ ϕ ϖ, которые используются в математике и физике.",
      en: "All 24 letters of the Greek alphabet in upper and lower case, the final sigma ς and the variant forms ϑ ϕ ϖ used in math and physics.",
    },
  },
  currency: {
    name: { ru: "Валюты", en: "Currency" },
    h1: { ru: "Символы валют", en: "Currency symbols" },
    intro: {
      ru: "Знаки денежных единиц: рубль ₽, тенге ₸, гривна ₴, сом ⃀, доллар $, евро €, фунт £, иена ¥, биткоин ₿ и ещё несколько десятков валют мира.",
      en: "Currency signs: ruble ₽, tenge ₸, hryvnia ₴, som ⃀, dollar $, euro €, pound £, yen ¥, bitcoin ₿ and dozens of other currencies.",
    },
  },
  fractions: {
    name: { ru: "Дроби", en: "Fractions" },
    h1: { ru: "Символы дробей", en: "Fraction symbols" },
    intro: {
      ru: "Готовые дроби одним символом: ½ ⅓ ⅔ ¼ ¾ ⅕ ⅛ и другие, а также дробная черта ⁄, с которой можно записать любую дробь: 5⁄16.",
      en: "Ready-made single-character fractions: ½ ⅓ ⅔ ¼ ¾ ⅕ ⅛ and more, plus the fraction slash ⁄ for writing any fraction: 5⁄16.",
    },
  },
  superscript: {
    name: { ru: "Верхний индекс", en: "Superscript" },
    h1: { ru: "Надстрочные символы (верхний индекс)", en: "Superscript symbols" },
    intro: {
      ru: "Цифры ⁰ ¹ ² ³ и буквы ᵃ ᵇ ᶜ в верхнем индексе — для степеней (м², м³), формул и примечаний там, где нельзя включить форматирование.",
      en: "Superscript digits ⁰ ¹ ² ³ and letters ᵃ ᵇ ᶜ — for powers (m², m³), formulas and notes where formatting isn’t available.",
    },
  },
  subscript: {
    name: { ru: "Нижний индекс", en: "Subscript" },
    h1: { ru: "Подстрочные символы (нижний индекс)", en: "Subscript symbols" },
    intro: {
      ru: "Цифры ₀ ₁ ₂ и буквы ₐ ₑ ₒ в нижнем индексе — для химических формул (H₂O, CO₂) и обозначений вроде x₁.",
      en: "Subscript digits ₀ ₁ ₂ and letters ₐ ₑ ₒ — for chemical formulas (H₂O, CO₂) and notation like x₁.",
    },
  },
  "roman-numerals": {
    name: { ru: "Римские цифры", en: "Roman numerals" },
    h1: { ru: "Римские цифры символами", en: "Roman numeral symbols" },
    intro: {
      ru: "Символы Unicode для римских цифр: Ⅰ Ⅱ Ⅲ Ⅳ Ⅴ … Ⅻ, Ⅼ Ⅽ Ⅾ Ⅿ и строчные ⅰ ⅱ ⅲ. Обычно римские числа пишут латинскими буквами I, V, X — эти символы нужны, когда число должно быть одним знаком.",
      en: "Unicode Roman numeral characters: Ⅰ Ⅱ Ⅲ Ⅳ Ⅴ … Ⅻ, Ⅼ Ⅽ Ⅾ Ⅿ and lowercase ⅰ ⅱ ⅲ. Roman numbers are usually written with the letters I, V, X; these characters are for when a number must be a single glyph.",
    },
  },
  "circled-numbers": {
    name: { ru: "Цифры в кружках", en: "Circled numbers" },
    h1: { ru: "Цифры в кружке ① ② ③", en: "Circled number symbols" },
    intro: {
      ru: "Числа в кружках от ⓪ до ㊿, в чёрных кружках ❶ ⓫, в двойных кружках ⓵, в скобках ⑴ и с точкой ⒈.",
      en: "Numbers in circles from ⓪ to ㊿, in black circles ❶ ⓫, double circles ⓵, parentheses ⑴ and with a full stop ⒈.",
    },
  },
  "circled-letters": {
    name: { ru: "Буквы в кружках", en: "Circled letters" },
    h1: { ru: "Буквы в кружках и квадратах", en: "Circled and squared letters" },
    intro: {
      ru: "Латинские буквы в кружках Ⓐ ⓐ, в скобках ⒜, в квадратах 🄰 и в чёрных кружках и квадратах 🅐 🅰 — для ников и оформления.",
      en: "Latin letters in circles Ⓐ ⓐ, parentheses ⒜, squares 🄰 and black circles and squares 🅐 🅰 — for nicknames and decoration.",
    },
  },
  digits: {
    name: { ru: "Красивые цифры", en: "Fancy digits" },
    h1: { ru: "Красивые цифры для ника", en: "Fancy number fonts" },
    intro: {
      ru: "Цифры другого начертания: полноширинные ０–９, жирные 𝟎–𝟗, ажурные 𝟘–𝟡, рубленые и моноширинные 𝟶–𝟿. Это отдельные символы Unicode, поэтому они сохраняют вид в любом поле ввода.",
      en: "Digits in other styles: fullwidth ０–９, bold 𝟎–𝟗, double-struck 𝟘–𝟡, sans-serif and monospace 𝟶–𝟿. They are separate Unicode characters, so they keep their look in any text field.",
    },
  },
  zodiac: {
    name: { ru: "Знаки зодиака", en: "Zodiac" },
    h1: { ru: "Символы знаков зодиака", en: "Zodiac sign symbols" },
    intro: {
      ru: "Двенадцать знаков зодиака от Овна ♈ до Рыб ♓ и Змееносец ⛎. На большинстве устройств они показываются как цветные эмодзи.",
      en: "The twelve zodiac signs from Aries ♈ to Pisces ♓ plus Ophiuchus ⛎. Most devices show them as color emoji.",
    },
  },
  astrology: {
    name: { ru: "Астрология", en: "Astrology" },
    h1: { ru: "Астрологические символы планет", en: "Astrological planet symbols" },
    intro: {
      ru: "Символы Солнца ☉, Луны ☽ ☾, планет от Меркурия ☿ до Плутона ♇, астероидов ⚳ ⚴ ⚵ ⚶, лунных узлов ☊ ☋ и аспектов ☌ ☍.",
      en: "Symbols of the Sun ☉, the Moon ☽ ☾, planets from Mercury ☿ to Pluto ♇, asteroids ⚳ ⚴ ⚵ ⚶, lunar nodes ☊ ☋ and aspects ☌ ☍.",
    },
  },
  chess: {
    name: { ru: "Шахматы", en: "Chess" },
    h1: { ru: "Шахматные фигуры символами", en: "Chess piece symbols" },
    intro: {
      ru: "Белые ♔ ♕ ♖ ♗ ♘ ♙ и чёрные ♚ ♛ ♜ ♝ ♞ ♟ шахматные фигуры — для записи партий, задач и диаграмм в тексте.",
      en: "White ♔ ♕ ♖ ♗ ♘ ♙ and black ♚ ♛ ♜ ♝ ♞ ♟ chess pieces — for writing games, puzzles and diagrams in plain text.",
    },
  },
  cards: {
    name: { ru: "Игральные карты", en: "Playing cards" },
    h1: { ru: "Символы мастей и игральных карт", en: "Card suit and playing card symbols" },
    intro: {
      ru: "Масти ♠ ♣ ♥ ♦ в чёрном и белом варианте и колода игральных карт Unicode — от туза до короля, включая рыцарей и джокеров.",
      en: "The suits ♠ ♣ ♥ ♦ in black and white and the Unicode deck of playing cards — ace to king, including knights and jokers.",
    },
  },
  dice: {
    name: { ru: "Кости и шашки", en: "Dice" },
    h1: { ru: "Символы игральных костей", en: "Dice symbols" },
    intro: {
      ru: "Грани игральной кости ⚀ ⚁ ⚂ ⚃ ⚄ ⚅, шашки и дамки ⛀ ⛁ ⛂ ⛃ и эмодзи-кубик 🎲.",
      en: "Die faces ⚀ ⚁ ⚂ ⚃ ⚄ ⚅, draughts men and kings ⛀ ⛁ ⛂ ⛃ and the game die emoji 🎲.",
    },
  },
  music: {
    name: { ru: "Музыка", en: "Music" },
    h1: { ru: "Музыкальные символы и ноты", en: "Music symbols and notes" },
    intro: {
      ru: "Ноты ♩ ♪ ♫ ♬, знаки альтерации ♭ ♮ ♯ 𝄪 𝄫, скрипичный 𝄞 и басовый 𝄢 ключи, паузы, тактовые черты и знаки повтора.",
      en: "Notes ♩ ♪ ♫ ♬, accidentals ♭ ♮ ♯ 𝄪 𝄫, the treble 𝄞 and bass 𝄢 clefs, rests, bar lines and repeat signs.",
    },
  },
  weather: {
    name: { ru: "Погода", en: "Weather" },
    h1: { ru: "Символы погоды", en: "Weather symbols" },
    intro: {
      ru: "Солнце ☀ ☼, облако ☁, зонт ☂, снеговик ☃, снежинки ❄ ❅ ❆, молния ☇, гроза ☈ и градусы ° ℃ ℉ для прогноза.",
      en: "Sun ☀ ☼, cloud ☁, umbrella ☂, snowman ☃, snowflakes ❄ ❅ ❆, lightning ☇, thunderstorm ☈ and degrees ° ℃ ℉ for forecasts.",
    },
  },
  brackets: {
    name: { ru: "Скобки", en: "Brackets" },
    h1: { ru: "Символы скобок", en: "Bracket symbols" },
    intro: {
      ru: "Круглые, квадратные и фигурные скобки, угловые ⟨ ⟩ и 《 》, японские 「 」 『 』 【 】, двойные ⟦ ⟧ и декоративные ❨ ❩ ❮ ❯.",
      en: "Round, square and curly brackets, angle brackets ⟨ ⟩ and 《 》, Japanese 「 」 『 』 【 】, double ⟦ ⟧ and ornamental ❨ ❩ ❮ ❯.",
    },
  },
  quotes: {
    name: { ru: "Кавычки", en: "Quotation marks" },
    h1: { ru: "Символы кавычек", en: "Quotation mark symbols" },
    intro: {
      ru: "Ёлочки « », лапки „ “, английские “ ” и ‘ ’, одиночные угловые ‹ › и декоративные ❝ ❞. В русском тексте основные кавычки — ёлочки, а внутри них ставят лапки.",
      en: "Guillemets « », low-high quotes „ “, English “ ” and ‘ ’, single angle quotes ‹ › and ornamental ❝ ❞.",
    },
  },
  punctuation: {
    name: { ru: "Знаки препинания", en: "Punctuation" },
    h1: { ru: "Знаки препинания и типографские символы", en: "Punctuation and typographic symbols" },
    intro: {
      ru: "Многоточие …, перевёрнутые ¡ ¿, интерробанг ‽, ‼ ⁉, кинжалы † ‡ для сносок, знак сноски ※, параграф § и знак абзаца ¶.",
      en: "Ellipsis …, inverted ¡ ¿, the interrobang ‽, ‼ ⁉, daggers † ‡ for footnotes, the reference mark ※, section § and pilcrow ¶.",
    },
  },
  dashes: {
    name: { ru: "Тире и дефисы", en: "Dashes" },
    h1: { ru: "Тире, дефис и минус", en: "Dash, hyphen and minus symbols" },
    intro: {
      ru: "Длинное тире —, среднее –, цифровое ‒, дефис ‐, неразрывный дефис ‑, минус −, двойное и тройное тире ⸺ ⸻. Выглядят похоже, но у каждого своя роль.",
      en: "Em dash —, en dash –, figure dash ‒, hyphen ‐, non-breaking hyphen ‑, minus −, two- and three-em dashes ⸺ ⸻. They look alike but each has its own job.",
    },
  },
  spaces: {
    name: { ru: "Невидимые символы", en: "Spaces" },
    h1: { ru: "Невидимые символы и пробелы", en: "Invisible characters and spaces" },
    intro: {
      ru: "Неразрывный пробел, узкие и широкие пробелы, пробел нулевой ширины, соединитель ZWJ, мягкий перенос и символы-заполнители ㅤ (U+3164) и ⠀ (U+2800), которые используют как «пустой символ» в никах.",
      en: "No-break space, narrow and wide spaces, zero width space, the ZWJ joiner, soft hyphen and filler characters ㅤ (U+3164) and ⠀ (U+2800) that are used as a “blank character” in nicknames.",
    },
  },
  lines: {
    name: { ru: "Линии и рамки", en: "Box drawing" },
    h1: { ru: "Символы псевдографики: линии и рамки", en: "Box drawing characters" },
    intro: {
      ru: "128 символов для рамок и таблиц в тексте: тонкие ─ │, жирные ━ ┃, двойные ═ ║, уголки ┌ ┐ └ ┘ и пересечения ┼ ╬.",
      en: "128 characters for frames and tables in plain text: light ─ │, heavy ━ ┃, double ═ ║, corners ┌ ┐ └ ┘ and crossings ┼ ╬.",
    },
  },
  blocks: {
    name: { ru: "Блоки", en: "Blocks" },
    h1: { ru: "Блочные символы █ ▓ ▒ ░", en: "Block element characters" },
    intro: {
      ru: "Полный блок █, половинки ▀ ▄ ▌ ▐, доли по восьмым и штриховки ░ ▒ ▓ — для текстовой графики, индикаторов прогресса и ASCII-арта.",
      en: "Full block █, halves ▀ ▄ ▌ ▐, eighths and shades ░ ▒ ▓ — for text graphics, progress bars and ASCII art.",
    },
  },
  squares: {
    name: { ru: "Квадраты", en: "Squares" },
    h1: { ru: "Символы квадратов", en: "Square symbols" },
    intro: {
      ru: "Закрашенные ■ и полые □ квадраты, маленькие ▪ ▫, квадраты с тенью ❏ ❐, со штриховкой ▤ ▥ ▦ и прямоугольники ▬ ▭ ▮ ▯.",
      en: "Black ■ and white □ squares, small ▪ ▫, shadowed ❏ ❐, hatched ▤ ▥ ▦ and rectangles ▬ ▭ ▮ ▯.",
    },
  },
  circles: {
    name: { ru: "Круги", en: "Circles" },
    h1: { ru: "Символы кругов", en: "Circle symbols" },
    intro: {
      ru: "Круги ○ ●, концентрические ◎ ◉, пунктирный ◌, наполовину закрашенные ◐ ◑ ◒ ◓, большой ⬤ и цветные эмодзи-круги 🔴 🔵.",
      en: "Circles ○ ●, concentric ◎ ◉, dotted ◌, half-filled ◐ ◑ ◒ ◓, the large ⬤ and colored emoji circles 🔴 🔵.",
    },
  },
  triangles: {
    name: { ru: "Треугольники", en: "Triangles" },
    h1: { ru: "Символы треугольников", en: "Triangle symbols" },
    intro: {
      ru: "Треугольники всех направлений: ▲ △ ▼ ▽ ◀ ▶, маленькие ▴ ▸ ▾ ◂, указатели ► ◄ и угловые треугольники ◢ ◣ ◤ ◥.",
      en: "Triangles pointing every way: ▲ △ ▼ ▽ ◀ ▶, small ▴ ▸ ▾ ◂, pointers ► ◄ and corner triangles ◢ ◣ ◤ ◥.",
    },
  },
  geometric: {
    name: { ru: "Геометрические фигуры", en: "Geometric shapes" },
    h1: { ru: "Геометрические фигуры: символы", en: "Geometric shape symbols" },
    intro: {
      ru: "Весь блок Unicode «Геометрические фигуры» — квадраты, круги, треугольники, ромбы ◆ ◇ ◈ ◊ — а также пятиугольники ⬟ ⬠ и шестиугольники ⬡ ⬢.",
      en: "The whole Unicode Geometric Shapes block — squares, circles, triangles, diamonds ◆ ◇ ◈ ◊ — plus pentagons ⬟ ⬠ and hexagons ⬡ ⬢.",
    },
  },
  keyboard: {
    name: { ru: "Клавиши", en: "Keyboard" },
    h1: { ru: "Символы клавиш Mac и клавиатуры", en: "Keyboard and Mac key symbols" },
    intro: {
      ru: "Обозначения клавиш: Command ⌘, Option ⌥, Shift ⇧, Control ⌃, Escape ⎋, Backspace ⌫, Delete ⌦, Return ⏎, Tab ⇥, Caps Lock ⇪, Eject ⏏ и символы питания ⏻ ⏼.",
      en: "Key symbols: Command ⌘, Option ⌥, Shift ⇧, Control ⌃, Escape ⎋, Backspace ⌫, Delete ⌦, Return ⏎, Tab ⇥, Caps Lock ⇪, Eject ⏏ and power symbols ⏻ ⏼.",
    },
  },
  technical: {
    name: { ru: "Технические символы", en: "Technical" },
    h1: { ru: "Технические символы", en: "Technical symbols" },
    intro: {
      ru: "Знак диаметра ⌀, дом ⌂, дуга ⌒, прицел ⌖, заземление ⏚, переменный ток ⏦, бензольное кольцо ⌬, знаки допусков формы и часы ⌚ ⌛.",
      en: "Diameter sign ⌀, house ⌂, arc ⌒, position indicator ⌖, earth ground ⏚, AC current ⏦, benzene ring ⌬, geometric tolerance signs and clocks ⌚ ⌛.",
    },
  },
  units: {
    name: { ru: "Единицы и знаки", en: "Units & signs" },
    h1: { ru: "Знаки единиц измерения: ° № ‰ ℃", en: "Unit and measurement symbols" },
    intro: {
      ru: "Градус °, градусы Цельсия ℃ и Фаренгейта ℉, номер №, промилле ‰, микро µ, ом Ω, кельвин K, ангстрем Å и единицы в одной клетке: ㎡ ㎥ ㎏ ㎞.",
      en: "Degree °, degrees Celsius ℃ and Fahrenheit ℉, numero №, per mille ‰, micro µ, ohm Ω, kelvin K, angstrom Å and single-character units: ㎡ ㎥ ㎏ ㎞.",
    },
  },
  legal: {
    name: { ru: "Копирайт и товарные знаки", en: "Legal" },
    h1: { ru: "Знаки копирайта ©, ® и ™", en: "Copyright and trademark symbols" },
    intro: {
      ru: "Знак авторского права ©, зарегистрированный товарный знак ®, товарный знак ™, знак обслуживания ℠, фонограмма ℗, копилефт 🄯, параграф § и знак абзаца ¶.",
      en: "Copyright ©, registered trademark ®, trademark ™, service mark ℠, sound recording ℗, copyleft 🄯, section § and pilcrow ¶.",
    },
  },
  gender: {
    name: { ru: "Гендерные символы", en: "Gender" },
    h1: { ru: "Гендерные символы ♀ ♂", en: "Gender symbols" },
    intro: {
      ru: "Женский ♀ и мужской ♂ символы, их сочетания ⚢ ⚣ ⚤ ⚥, трансгендерный символ ⚧, средний род ⚲ и символы брака и развода ⚭ ⚮.",
      en: "Female ♀ and male ♂ signs, their combinations ⚢ ⚣ ⚤ ⚥, the transgender symbol ⚧, neuter ⚲ and marriage and divorce symbols ⚭ ⚮.",
    },
  },
  religious: {
    name: { ru: "Религиозные символы", en: "Religious" },
    h1: { ru: "Религиозные символы", en: "Religious symbols" },
    intro: {
      ru: "Кресты ✝ ☦ ✞, хризма ☧, звезда Давида ✡, звезда и полумесяц ☪, инь и ян ☯, колесо дхармы ☸, анх ☥, ом 🕉 и знак мира ☮.",
      en: "Crosses ✝ ☦ ✞, the chi rho ☧, star of David ✡, star and crescent ☪, yin yang ☯, dharma wheel ☸, ankh ☥, om 🕉 and the peace symbol ☮.",
    },
  },
  flowers: {
    name: { ru: "Цветочки", en: "Flowers" },
    h1: { ru: "Символы цветов ✿ ❀", en: "Flower symbols" },
    intro: {
      ru: "Цветочки ✿ ❀ ❁ ✾, цветок ⚘, геральдическая лилия ⚜, цветочные сердца ❦ ❧ и узорные звёздочки — для украшения ников и постов.",
      en: "Florettes ✿ ❀ ❁ ✾, the flower ⚘, fleur-de-lis ⚜, floral hearts ❦ ❧ and patterned asterisks — to decorate nicknames and posts.",
    },
  },
  dingbats: {
    name: { ru: "Дингбаты", en: "Dingbats" },
    h1: { ru: "Дингбаты: все символы блока", en: "Dingbat symbols" },
    intro: {
      ru: "Все 192 символа блока Unicode «Дингбаты»: ножницы ✂, самолёт ✈, конверт ✉, карандаши ✎ ✏, галочки ✓ ✔, кресты, звёзды, цифры в кружках ❶ ➀ и стрелки ➔ ➤.",
      en: "All 192 characters of the Unicode Dingbats block: scissors ✂, airplane ✈, envelope ✉, pencils ✎ ✏, check marks ✓ ✔, crosses, stars, circled digits ❶ ➀ and arrows ➔ ➤.",
    },
  },
  braille: {
    name: { ru: "Шрифт Брайля", en: "Braille" },
    h1: { ru: "Символы шрифта Брайля", en: "Braille pattern symbols" },
    intro: {
      ru: "Все 256 комбинаций восьмиточечной ячейки Брайля от ⠁ до ⣿. Кроме письма для незрячих, их используют в текстовых рисунках: точки образуют мелкую сетку 2 × 4.",
      en: "All 256 combinations of the eight-dot Braille cell from ⠁ to ⣿. Besides writing for the blind, they are used for text art: the dots form a fine 2 × 4 grid.",
    },
  },
  latin: {
    name: { ru: "Латиница с диакритикой", en: "Latin letters" },
    h1: { ru: "Латинские буквы с диакритикой", en: "Latin letters with accents" },
    intro: {
      ru: "Буквы европейских языков: ä ö ü ß (немецкий), é è ç (французский), ñ (испанский), ø æ å (скандинавские), ł ż ś (польский), č š ž (чешский) и другие — около 190 символов.",
      en: "Letters of European languages: ä ö ü ß (German), é è ç (French), ñ (Spanish), ø æ å (Scandinavian), ł ż ś (Polish), č š ž (Czech) and more — about 190 characters.",
    },
  },
  cyrillic: {
    name: { ru: "Кириллица", en: "Cyrillic" },
    h1: { ru: "Буквы кириллицы: Ё, Ї, Ґ, Є, Ў и другие", en: "Cyrillic letters" },
    intro: {
      ru: "Буквы, которых нет на русской клавиатуре: украинские Ї Ґ Є, белорусская Ў, сербские и македонские Ђ Ј Љ Њ Ћ Џ, дореформенные Ѣ Ѳ Ѵ и буквы языков России и Средней Азии.",
      en: "Letters missing from the Russian keyboard: Ukrainian Ї Ґ Є, Belarusian Ў, Serbian and Macedonian Ђ Ј Љ Њ Ћ Џ, pre-reform Ѣ Ѳ Ѵ and letters of Russia’s and Central Asia’s languages.",
    },
  },
  kazakh: {
    name: { ru: "Казахские буквы", en: "Kazakh letters" },
    h1: { ru: "Казахские буквы: Ә Ғ Қ Ң Ө Ұ Ү Һ І", en: "Kazakh Cyrillic letters" },
    intro: {
      ru: "Девять букв казахского алфавита, которых нет в русском: Ә Ғ Қ Ң Ө Ұ Ү Һ І. Скопируйте их, если на компьютере не установлена казахская раскладка.",
      en: "The nine letters of the Kazakh alphabet that Russian lacks: Ә Ғ Қ Ң Ө Ұ Ү Һ І. Copy them when no Kazakh keyboard layout is installed.",
    },
  },
  ipa: {
    name: { ru: "Транскрипция (МФА)", en: "IPA" },
    h1: { ru: "Символы транскрипции (МФА)", en: "IPA phonetic symbols" },
    intro: {
      ru: "Знаки Международного фонетического алфавита: шва ə, эш ʃ, эж ʒ, энг ŋ, открытые ɛ ɔ, знаки ударения ˈ ˌ и долготы ː — всё для транскрипции английских и других слов.",
      en: "International Phonetic Alphabet signs: schwa ə, esh ʃ, ezh ʒ, eng ŋ, open ɛ ɔ, stress marks ˈ ˌ and the length mark ː — everything for phonetic transcription.",
    },
  },
  "small-caps": {
    name: { ru: "Капитель", en: "Small caps" },
    h1: { ru: "Маленькие заглавные буквы (капитель)", en: "Small capital letters" },
    intro: {
      ru: "Латинские буквы в виде уменьшенных заглавных: ᴀ ʙ ᴄ ᴅ ᴇ… Это отдельные символы Unicode из фонетических блоков, поэтому ими можно набрать ник или заголовок.",
      en: "Latin letters shaped as small capitals: ᴀ ʙ ᴄ ᴅ ᴇ… They are separate Unicode characters from the phonetic blocks, so you can type a nickname or heading with them.",
    },
  },
  smileys: {
    name: { ru: "Символы для смайликов", en: "Smiley symbols" },
    h1: { ru: "Символы для текстовых смайликов", en: "Text smiley symbols" },
    intro: {
      ru: "Лица ☺ ☻ ☹, японская улыбка ツ, взгляд ಠ_ಠ, ручки ლ и буквы разных алфавитов, из которых собирают каомодзи вроде ʕ•ᴥ•ʔ.",
      en: "Faces ☺ ☻ ☹, the Japanese smile ツ, the look of disapproval ಠ_ಠ, hands ლ and letters from various scripts used to build kaomoji like ʕ•ᴥ•ʔ.",
    },
  },
  hands: {
    name: { ru: "Руки", en: "Hands" },
    h1: { ru: "Символы рук и указательных пальцев", en: "Hand and pointing finger symbols" },
    intro: {
      ru: "Указательные пальцы ☚ ☛ ☜ ☞ ☝ ☟, пишущая рука ✍, жест победы ✌ и эмодзи-жесты 👍 👎 👌.",
      en: "Pointing fingers ☚ ☛ ☜ ☞ ☝ ☟, the writing hand ✍, the victory hand ✌ and emoji gestures 👍 👎 👌.",
    },
  },
  letterlike: {
    name: { ru: "Буквоподобные символы", en: "Letterlike" },
    h1: { ru: "Буквоподобные символы", en: "Letterlike symbols" },
    intro: {
      ru: "80 символов блока «Буквоподобные символы»: ℃ ℉ № ℗ ™, ажурные ℕ ℝ ℂ, готические ℌ ℑ ℜ, рукописные ℋ ℒ ℘, постоянная Планка ℏ и другие.",
      en: "The 80 characters of the Letterlike Symbols block: ℃ ℉ № ℗ ™, double-struck ℕ ℝ ℂ, black-letter ℌ ℑ ℜ, script ℋ ℒ ℘, the Planck constant ℏ and more.",
    },
  },
  warning: {
    name: { ru: "Предупреждающие знаки", en: "Warning signs" },
    h1: { ru: "Предупреждающие знаки: ⚠ ☢ ☣ ☠", en: "Warning sign symbols" },
    intro: {
      ru: "Знак внимания ⚠, радиация ☢, биологическая опасность ☣, череп и кости ☠, высокое напряжение ⚡, запрет ⛔ 🛇, флаги ⚐ ⚑ и медицинские символы ⚕ ☤.",
      en: "Warning ⚠, radioactive ☢, biohazard ☣, skull and crossbones ☠, high voltage ⚡, no entry ⛔ 🛇, flags ⚐ ⚑ and medical symbols ⚕ ☤.",
    },
  },
  objects: {
    name: { ru: "Предметы и знаки", en: "Objects" },
    h1: { ru: "Символы предметов: ☎ ✈ ✂ ♻", en: "Object symbols" },
    intro: {
      ru: "Телефон ☎, самолёт ✈, ножницы ✂, конверт ✉, знаки переработки ♻ ♲ ♳, знак бескислотной бумаги ♾, инструменты ⚒ ⚙, весы ⚖, мечи ⚔ и якорь ⚓.",
      en: "Telephone ☎, airplane ✈, scissors ✂, envelope ✉, recycling signs ♻ ♲ ♳, the permanent paper sign ♾, tools ⚒ ⚙, scales ⚖, swords ⚔ and anchor ⚓.",
    },
  },
  decorative: {
    name: { ru: "Для оформления", en: "Decorative" },
    h1: { ru: "Символы для оформления ника и профиля", en: "Decorative symbols for nicknames" },
    intro: {
      ru: "Орнаменты ꧁ ꧂, тибетские знаки ༺ ༻, скобки ⊱ ⊰ ꒰ ꒱, «крылышки» ʚ ɞ, звёздочки ✧ ⋆ ˚ и другие символы, которыми украшают ники, описания профиля и посты.",
      en: "Ornaments ꧁ ꧂, Tibetan marks ༺ ༻, brackets ⊱ ⊰ ꒰ ꒱, “wings” ʚ ɞ, sparkles ✧ ⋆ ˚ and other characters used to decorate nicknames, bios and posts.",
    },
  },
};

/** Hub grouping of collections. */
export const HUB_GROUPS: { title: L10n; ids: string[] }[] = [
  { title: { ru: "Популярные", en: "Popular" }, ids: ["hearts", "stars", "arrows", "check-marks", "currency", "math", "units", "legal", "spaces", "decorative"] },
  { title: { ru: "Текст и типографика", en: "Text & typography" }, ids: ["punctuation", "quotes", "dashes", "brackets", "bullets", "asterisks", "superscript", "subscript", "fractions"] },
  { title: { ru: "Цифры", en: "Numbers" }, ids: ["roman-numerals", "circled-numbers", "digits"] },
  { title: { ru: "Буквы и алфавиты", en: "Letters & alphabets" }, ids: ["kazakh", "cyrillic", "greek", "latin", "ipa", "small-caps", "circled-letters", "letterlike"] },
  { title: { ru: "Фигуры и графика", en: "Shapes & graphics" }, ids: ["squares", "circles", "triangles", "geometric", "lines", "blocks", "braille"] },
  { title: { ru: "Знаки и значки", en: "Signs & icons" }, ids: ["crosses", "keyboard", "technical", "warning", "objects", "gender", "religious", "hands", "flowers", "dingbats", "smileys"] },
  { title: { ru: "Игры, музыка, небо", en: "Games, music, sky" }, ids: ["chess", "cards", "dice", "music", "weather", "zodiac", "astrology"] },
];

/** Popular single symbols for the hub (each has a page). */
export const POPULAR_SYMBOLS = "°№∞♥★☆✓✔×÷±≈≠≤≥√∑π©®™€₽₸$→←↑↓⇒—–«»…•§¶½²³₂✿❀ツ⌘₿♀♂☯☮✝☦⚠☢♻☎✈✂♪♫♠♣♦█░─ə";

/**
 * Curated page texts for the most searched symbols: an h1 phrase people really type and a short,
 * factual note about typical use.
 */
export const CURATED: Record<string, { h1?: L10n; usage: L10n }> = {
  "°": {
    usage: {
      ru: "Обозначает градусы температуры (+20 °C) и углов (90°), а также градусы географических координат. По ГОСТ перед знаком градуса Цельсия ставят пробел: 20 °C, а угловой градус пишут слитно: 45°.",
      en: "Marks degrees of temperature (20 °C), angles (90°) and geographic coordinates. The SI style puts a space before °C but not before an angle: 20 °C, 45°.",
    },
  },
  "№": {
    h1: { ru: "Знак номера №", en: "Numero sign №" },
    usage: {
      ru: "Ставится перед числом через пробел: № 5, дом № 12. В русской раскладке Windows его набирают сочетанием Shift+3. Во множественном числе знак не удваивают: № 1–5.",
      en: "Placed before a number: № 5. It is common in Russian and other European typography; on the Russian keyboard layout it is typed with Shift+3.",
    },
  },
  "∞": {
    usage: {
      ru: "Математический знак бесконечности: lim x→∞, интервал (0; +∞). Его также используют в значении «навсегда, без ограничений».",
      en: "The mathematical infinity sign: lim x→∞, interval (0, +∞). It is also used to mean “forever, unlimited”.",
    },
  },
  "±": {
    usage: {
      ru: "Показывает допуск или погрешность: 5 ± 0,1 мм, а в формулах — два значения сразу: x = ±2.",
      en: "Shows a tolerance or error margin: 5 ± 0.1 mm, and in formulas two values at once: x = ±2.",
    },
  },
  "×": {
    usage: {
      ru: "Знак умножения (2 × 3) и размеров (1920 × 1080, 30 × 40 см). Не путайте с латинской буквой x и русской х — это разные символы.",
      en: "The multiplication sign (2 × 3) and dimensions (1920 × 1080). Don’t confuse it with the letter x.",
    },
  },
  "÷": {
    usage: {
      ru: "Знак деления (обелюс) из школьной арифметики: 6 ÷ 2 = 3. В России деление чаще записывают двоеточием или дробной чертой, а ÷ встречается на кнопках калькуляторов.",
      en: "The division sign (obelus): 6 ÷ 2 = 3. It appears on calculator keys; in formulas division is usually written with a slash or fraction bar.",
    },
  },
  "≈": {
    usage: {
      ru: "«Приблизительно равно»: π ≈ 3,14. В обычных текстах знак заменяет слова «около», «примерно»: ≈ 100 км.",
      en: "“Almost equal to”: π ≈ 3.14. In everyday text it replaces “about”: ≈ 100 km.",
    },
  },
  "≠": { usage: { ru: "«Не равно»: 2 + 2 ≠ 5. В языках программирования его заменяют сочетаниями != или <>.", en: "“Not equal to”: 2 + 2 ≠ 5. Programming languages use != or <> instead." } },
  "≤": { usage: { ru: "«Меньше или равно»: x ≤ 10. В программах записывается как <=.", en: "“Less than or equal to”: x ≤ 10. In code it is written <=." } },
  "≥": { usage: { ru: "«Больше или равно»: возраст ≥ 18. В программах записывается как >=.", en: "“Greater than or equal to”: age ≥ 18. In code it is written >=." } },
  "√": { usage: { ru: "Знак квадратного корня: √16 = 4. Для кубического корня есть отдельный символ ∛.", en: "The square root sign: √16 = 4. The cube root has its own character ∛." } },
  "∑": { usage: { ru: "Знак суммы (заглавная сигма) в математике и статистике: ∑ xᵢ. Это отдельный символ, а не греческая буква Σ.", en: "The summation sign used in math and statistics: ∑ xᵢ. It is a separate character from the Greek letter Σ." } },
  "₽": {
    h1: { ru: "Знак рубля ₽", en: "Ruble sign ₽" },
    usage: {
      ru: "Официальный знак российского рубля, утверждён Банком России в 2013 году и добавлен в Unicode 7.0 в 2014-м. Пишется после суммы через пробел: 500 ₽. В русской раскладке Windows набирается сочетанием правый Alt + 8.",
      en: "The official sign of the Russian ruble, approved by the Bank of Russia in 2013 and added to Unicode 7.0 in 2014. It follows the amount: 500 ₽.",
    },
  },
  "₸": {
    h1: { ru: "Знак тенге ₸", en: "Tenge sign ₸" },
    usage: {
      ru: "Знак казахстанского тенге, утверждён Национальным банком Казахстана в 2007 году и добавлен в Unicode 6.0 в 2010-м. Пишется после суммы через пробел: 1 500 ₸.",
      en: "The sign of the Kazakhstani tenge, adopted by the National Bank of Kazakhstan in 2007 and added to Unicode 6.0 in 2010. It follows the amount: 1,500 ₸.",
    },
  },
  "₴": { h1: { ru: "Знак гривны ₴", en: "Hryvnia sign ₴" }, usage: { ru: "Знак украинской гривны, добавлен в Unicode 4.1 в 2005 году. Пишется после суммы: 100 ₴.", en: "The sign of the Ukrainian hryvnia, added to Unicode 4.1 in 2005. It follows the amount: 100 ₴." } },
  "€": { h1: { ru: "Знак евро €", en: "Euro sign €" }, usage: { ru: "Знак евро. В русском тексте ставится после суммы через пробел (100 €), в англоязычном — перед суммой (€100).", en: "The euro sign. English usage puts it before the amount (€100); many European languages put it after (100 €)." } },
  "$": { h1: { ru: "Знак доллара $", en: "Dollar sign $" }, usage: { ru: "Знак доллара и ряда других валют (песо, реал). Ставится перед суммой: $100. В программировании $ обозначает переменные в PHP и Bash.", en: "The dollar sign, also used for pesos and other currencies. It precedes the amount: $100. In programming it marks variables in PHP and shells." } },
  "₿": { h1: { ru: "Знак биткоина ₿", en: "Bitcoin sign ₿" }, usage: { ru: "Знак криптовалюты биткоин, добавлен в Unicode 10.0 в 2017 году.", en: "The sign of the bitcoin cryptocurrency, added in Unicode 10.0 (2017)." } },
  "©": {
    usage: {
      ru: "Знак охраны авторского права: © 2025 Имя владельца. По Гражданскому кодексу РФ (ст. 1271) знак состоит из латинской буквы C в окружности, имени правообладателя и года первой публикации.",
      en: "The copyright notice symbol: © 2025 Owner Name. A notice usually combines ©, the year of first publication and the owner’s name.",
    },
  },
  "®": { usage: { ru: "Обозначает зарегистрированный товарный знак. Ставить его можно только если знак действительно зарегистрирован.", en: "Marks a registered trademark. Use it only if the mark is actually registered." } },
  "™": { usage: { ru: "Обозначает товарный знак, на который заявлены права (в том числе незарегистрированный). Ставится сразу после названия: Brand™.", en: "Marks a claimed trademark, registered or not. It follows the name directly: Brand™." } },
  "§": { usage: { ru: "Знак параграфа: ссылки на разделы законов и учебников (§ 5, §§ 3–7).", en: "The section sign for references to sections of laws and books (§ 5, §§ 3–7)." } },
  "¶": { usage: { ru: "Знак абзаца (пилкроу). В Word и других редакторах им отмечают невидимые концы абзацев в режиме показа всех знаков.", en: "The pilcrow marks paragraphs; word processors show it at paragraph ends in “show formatting” mode." } },
  "—": {
    usage: {
      ru: "Длинное тире — основное тире русского текста: между подлежащим и сказуемым, в прямой речи, в диалогах. С обеих сторон отбивается пробелами.",
      en: "The em dash marks a break in a sentence — like this. American style sets it without spaces, many others with spaces.",
    },
  },
  "–": {
    usage: {
      ru: "Среднее тире ставят в диапазонах без пробелов: 1941–1945, 10–15 кг, а также в английских текстах вместо длинного тире.",
      en: "The en dash joins ranges without spaces: 1941–1945, pages 10–15, and connections like London–Paris.",
    },
  },
  "«": { h1: { ru: "Кавычки-ёлочки « »", en: "Guillemets « »" }, usage: { ru: "Основные кавычки русского языка («ёлочки»). Внутри них для вложенных цитат используют «лапки» „ “.", en: "The main quotation marks in Russian, French and many other languages. Nested quotes in Russian use „ “." } },
  "…": { usage: { ru: "Многоточие одним символом. Выглядит почти как три точки, но занимает одно место и не разрывается при переносе строки.", en: "The ellipsis as one character. It looks like three dots but is a single glyph that never breaks across lines." } },
  "•": { usage: { ru: "Круглый маркер списка. Его ставят перед пунктами в текстах, где нельзя сделать настоящий маркированный список: в мессенджерах и описаниях.", en: "The round bullet placed before list items where real bulleted lists aren’t available." } },
  "✓": { h1: { ru: "Галочка ✓", en: "Check mark ✓" }, usage: { ru: "Отметка «выполнено» или «да» в списках и таблицах. Для жирной галочки есть символ ✔, для зелёной эмодзи-галочки — ✅.", en: "A “done” or “yes” mark in lists and tables. The heavy version is ✔ and the green emoji is ✅." } },
  "✔": { usage: { ru: "Жирная галочка. На некоторых устройствах показывается как чёрно-белый эмодзи ✔️.", en: "The heavy check mark. Some devices show it as a black-and-white emoji ✔️." } },
  "★": { h1: { ru: "Звёздочка ★ (чёрная звезда)", en: "Black star ★" }, usage: { ru: "Закрашенная звезда — для рейтингов (★★★★☆), выделения и оформления ников.", en: "The filled star, used for ratings (★★★★☆), highlights and nickname decoration." } },
  "☆": { usage: { ru: "Контурная звезда. В рейтингах обозначает незаполненную позицию: ★★★☆☆.", en: "The outlined star. In ratings it marks an empty position: ★★★☆☆." } },
  "♥": { h1: { ru: "Сердечко ♥", en: "Heart symbol ♥" }, usage: { ru: "Текстовое сердечко, по Unicode — масть червы. Отображается обычным шрифтом; если нужен красный цвет, используйте эмодзи ❤️.", en: "The text heart, officially the heart suit. It renders in the text font; for a red heart use the ❤️ emoji." } },
  "❤": { usage: { ru: "Жирное сердце — основа эмодзи ❤️. Без невидимого селектора U+FE0F оно может отображаться как чёрно-белый символ, с ним — как красное сердце.", en: "The heavy heart behind the ❤️ emoji. Without the invisible selector U+FE0F it may render as black-and-white text." } },
  "→": { h1: { ru: "Стрелка вправо →", en: "Right arrow →" }, usage: { ru: "Самая распространённая стрелка: указывает направление, следствие (A → B) или переход в меню (Файл → Сохранить).", en: "The most common arrow: direction, implication (A → B) or menu paths (File → Save)." } },
  "⇒": { usage: { ru: "Двойная стрелка — знак следования в логике: A ⇒ B («из A следует B»).", en: "The double arrow means implication in logic: A ⇒ B." } },
  "↵": { usage: { ru: "Стрелка вниз с поворотом влево — обозначение клавиши Enter на клавиатурах.", en: "The down-and-left arrow is the Enter key symbol on keyboards." } },
  "⌘": { h1: { ru: "Значок Command ⌘", en: "Command key symbol ⌘" }, usage: { ru: "Обозначение клавиши Command на клавиатурах Apple. Сам знак — старый скандинавский символ достопримечательности.", en: "The Command key on Apple keyboards. The glyph is an old Scandinavian “place of interest” sign." } },
  "⌥": { h1: { ru: "Значок Option ⌥", en: "Option key symbol ⌥" }, usage: { ru: "Обозначение клавиши Option (Alt) на клавиатурах Apple.", en: "The Option (Alt) key on Apple keyboards." } },
  "⇧": { h1: { ru: "Значок Shift ⇧", en: "Shift key symbol ⇧" }, usage: { ru: "Полая стрелка вверх — обозначение клавиши Shift.", en: "The white up arrow is the Shift key symbol." } },
  "½": { h1: { ru: "Символ половины ½", en: "One half symbol ½" }, usage: { ru: "Дробь «одна вторая» одним знаком: ½ стакана. Для математических формул лучше писать 1/2.", en: "The fraction one half as a single character: ½ cup. For formulas write 1/2." } },
  "²": { h1: { ru: "Квадрат ² (верхний индекс 2)", en: "Superscript two ²" }, usage: { ru: "Надстрочная двойка для степеней и квадратных единиц: м², x². В русской раскладке Windows набирается Alt+0178.", en: "Superscript two for squares and square units: m², x². On Windows type Alt+0178." } },
  "³": { h1: { ru: "Куб ³ (верхний индекс 3)", en: "Superscript three ³" }, usage: { ru: "Надстрочная тройка для кубов и объёмов: м³, x³.", en: "Superscript three for cubes and volumes: m³, x³." } },
  "₂": { usage: { ru: "Подстрочная двойка для химических формул: H₂O, CO₂, O₂.", en: "Subscript two for chemical formulas: H₂O, CO₂, O₂." } },
  "♀": { usage: { ru: "Женский символ — зеркало Венеры. Используется в биологии и как обозначение женского пола.", en: "The female sign, the mirror of Venus, used in biology and to denote female sex." } },
  "♂": { usage: { ru: "Мужской символ — щит и копьё Марса. Используется в биологии и как обозначение мужского пола.", en: "The male sign, the shield and spear of Mars, used in biology and to denote male sex." } },
  "☯": { usage: { ru: "Инь и ян — символ единства противоположностей в китайской философии.", en: "Yin and yang, the symbol of complementary opposites in Chinese philosophy." } },
  "☮": { usage: { ru: "Знак мира (пацифик), созданный в 1958 году для британского движения за ядерное разоружение.", en: "The peace symbol, designed in 1958 for the British nuclear disarmament movement." } },
  "✝": { usage: { ru: "Латинский крест — главный символ христианства в западной традиции.", en: "The Latin cross, the main symbol of Western Christianity." } },
  "☦": { usage: { ru: "Православный (восьмиконечный) крест: с верхней перекладиной-табличкой и нижней косой перекладиной.", en: "The Orthodox cross with an upper title bar and a slanted lower footrest." } },
  "⚠": { usage: { ru: "Знак предупреждения. Может отображаться как эмодзи ⚠️ в жёлтом треугольнике.", en: "The warning sign. It may render as the yellow ⚠️ emoji." } },
  "♻": { usage: { ru: "Универсальный знак переработки (лента Мёбиуса). Часто показывается как зелёный эмодзи ♻️.", en: "The universal recycling symbol. It often shows as the green ♻️ emoji." } },
  "♪": { usage: { ru: "Восьмая нота — самый популярный музыкальный символ для подписей к песням и оформления.", en: "The eighth note, the most popular music symbol for song captions and decoration." } },
  "█": { usage: { ru: "Полный блок для текстовой графики и индикаторов: ████░░░░ 50%.", en: "The full block for text graphics and progress bars: ████░░░░ 50%." } },
  "─": { usage: { ru: "Горизонтальная линия псевдографики. Вместе с │ ┌ ┐ └ ┘ из неё рисуют рамки и таблицы в консоли.", en: "The horizontal box-drawing line; with │ ┌ ┐ └ ┘ it draws frames and tables in consoles." } },
  "\u{A0}": {
    usage: {
      ru: "Неразрывный пробел не даёт строке разорваться: 100 км, 5 %, г. Москва. В HTML это &nbsp;, в Word — Ctrl+Shift+Пробел, на Mac — Option+Пробел.",
      en: "The no-break space keeps words on one line: 100 km, Mr. Smith. In HTML it is &nbsp;, in Word Ctrl+Shift+Space, on a Mac Option+Space.",
    },
  },
  "\u{200B}": {
    usage: {
      ru: "Пробел нулевой ширины не виден, но разрешает перенос строки в этом месте. Его используют в длинных адресах и кодах, а иногда — чтобы отправить «пустое» сообщение.",
      en: "The zero width space is invisible but allows a line break at that point. It is used in long URLs and codes, and sometimes to send a “blank” message.",
    },
  },
  "\u{200D}": {
    usage: {
      ru: "Соединитель нулевой ширины (ZWJ) склеивает эмодзи в одно: 👨 + ZWJ + 💻 = 👨‍💻. В арабском и индийских письменностях он управляет формой букв.",
      en: "The zero width joiner glues emoji together: 👨 + ZWJ + 💻 = 👨‍💻. In Arabic and Indic scripts it controls letter forms.",
    },
  },
  "\u{3164}": {
    usage: {
      ru: "Корейский символ-заполнитель выглядит как пустое место, но считается буквой. Поэтому его вставляют как «пустой ник» в играх и соцсетях, где обычный пробел запрещён.",
      en: "The Hangul filler looks blank but counts as a letter, so it is used as a “blank name” in games and apps that reject spaces.",
    },
  },
  "\u{2800}": {
    usage: {
      ru: "Пустая ячейка Брайля — видимой точки нет, но символ не считается пробелом. Его используют как невидимый символ в никах и для пустых строк в соцсетях.",
      en: "The blank Braille cell has no dots but isn’t treated as a space, so it’s used as an invisible character in names and for blank lines in posts.",
    },
  },
  "\u{AD}": {
    usage: {
      ru: "Мягкий перенос невидим, пока слово не окажется на границе строки: тогда браузер переносит слово в этом месте и показывает дефис.",
      en: "The soft hyphen is invisible unless the word hits the line end; then the browser breaks the word there and shows a hyphen.",
    },
  },
  ё: {
    h1: { ru: "Буква Ё ё", en: "Cyrillic letter Yo (Ё ё)" },
    usage: {
      ru: "Седьмая буква русского алфавита. По правилам её обязательно пишут в именах собственных и там, где без неё смысл неясен (всё — все). На клавиатуре она находится слева от цифры 1.",
      en: "The seventh letter of the Russian alphabet, also used in Belarusian. On the Russian keyboard it sits left of the 1 key.",
    },
  },
  ә: {
    h1: { ru: "Буква Ә ә (казахская)", en: "Kazakh letter Schwa (Ә ә)" },
    usage: {
      ru: "Казахская буква, обозначает гласный звук, близкий к [э] или [ä]: әже (бабушка), әке (отец). Есть также в татарском, башкирском и азербайджанском (кириллица) алфавитах.",
      en: "A Kazakh letter for a front vowel close to [æ]: әке (father). Also used in Tatar, Bashkir and Cyrillic Azerbaijani.",
    },
  },
  қ: { h1: { ru: "Буква Қ қ (казахская)", en: "Kazakh letter Qa (Қ қ)" }, usage: { ru: "Казахская буква для глубокого [қ]: Қазақстан, қала (город).", en: "A Kazakh letter for the uvular [q]: Қазақстан (Kazakhstan)." } },
  ң: { h1: { ru: "Буква Ң ң (казахская)", en: "Kazakh letter Eng (Ң ң)" }, usage: { ru: "Обозначает носовой звук [ŋ], как в английском sing: мың (тысяча), таң (рассвет).", en: "Stands for the nasal [ŋ] as in “sing”: мың (thousand)." } },
  ғ: { h1: { ru: "Буква Ғ ғ (казахская)", en: "Kazakh letter Ghayn (Ғ ғ)" }, usage: { ru: "Обозначает звонкий заднеязычный фрикативный звук [ғ]: ғалам (вселенная), бағыт (направление).", en: "Stands for a voiced back fricative: ғалам (universe)." } },
  ө: { h1: { ru: "Буква Ө ө (казахская)", en: "Kazakh letter Barred O (Ө ө)" }, usage: { ru: "Обозначает звук, близкий к немецкому ö: өмір (жизнь), көл (озеро). Используется также в киргизском и монгольском.", en: "A vowel close to German ö: өмір (life). Also used in Kyrgyz and Mongolian." } },
  ұ: { h1: { ru: "Буква Ұ ұ (казахская)", en: "Kazakh letter Straight U with stroke (Ұ ұ)" }, usage: { ru: "Обозначает краткий твёрдый [ұ]: ұл (сын), ұзақ (долгий). Есть только в казахском алфавите.", en: "A short back rounded vowel: ұл (son). It exists only in Kazakh." } },
  ү: { h1: { ru: "Буква Ү ү (казахская)", en: "Kazakh letter Straight U (Ү ү)" }, usage: { ru: "Обозначает звук, близкий к немецкому ü: үй (дом), күн (солнце, день).", en: "A vowel close to German ü: үй (house)." } },
  һ: { h1: { ru: "Буква Һ һ (казахская)", en: "Kazakh letter Shha (Һ һ)" }, usage: { ru: "Обозначает звук [һ] в заимствованиях: гауһар (бриллиант). Широко используется в башкирском и якутском.", en: "Stands for [h] in loanwords: гауһар (diamond). Common in Bashkir and Yakut." } },
  і: {
    h1: { ru: "Буква І і (казахская, украинская)", en: "Cyrillic letter I (І і)" },
    usage: {
      ru: "В казахском обозначает краткий [ы]-образный звук: бір (один), кітап (книга); в украинском и белорусском — звук [и]. Выглядит как латинская I, но это другой символ.",
      en: "In Kazakh it marks a short front vowel: бір (one); in Ukrainian and Belarusian it is [i]. It looks like the Latin I but is a different character.",
    },
  },
  ї: { h1: { ru: "Буква Ї ї (украинская)", en: "Ukrainian letter Yi (Ї ї)" }, usage: { ru: "Украинская буква, читается [йи]: їжак, Україна.", en: "A Ukrainian letter read [ji]: Україна." } },
  ґ: { h1: { ru: "Буква Ґ ґ (украинская)", en: "Ukrainian letter Ghe with upturn (Ґ ґ)" }, usage: { ru: "Украинская буква для взрывного [г]: ґанок, ґудзик.", en: "A Ukrainian letter for the hard [g]: ґанок." } },
  є: { h1: { ru: "Буква Є є (украинская)", en: "Ukrainian letter Ye (Є є)" }, usage: { ru: "Украинская буква, читается [йэ]: Європа, моє.", en: "A Ukrainian letter read [je]: Європа." } },
  ў: { h1: { ru: "Буква Ў ў (белорусская)", en: "Belarusian letter Short U (Ў ў)" }, usage: { ru: "Белорусская буква «у краткое», неслоговой звук: воўк, доўгі.", en: "The Belarusian “short u”, a non-syllabic sound: воўк (wolf)." } },
  ə: { h1: { ru: "Символ шва ə", en: "Schwa ə" }, usage: { ru: "Нейтральный безударный гласный в транскрипции: about [əˈbaʊt]. Кириллическая буква Ә — другой символ.", en: "The neutral unstressed vowel in transcription: about [əˈbaʊt]. The Cyrillic Ә is a different character." } },
  ß: { h1: { ru: "Буква ß (эсцет)", en: "Eszett ß (sharp S)" }, usage: { ru: "Немецкая буква «эсцет», читается как [с]: Straße. Заглавная форма ẞ официально разрешена с 2017 года; чаще вместо неё пишут SS.", en: "The German letter eszett, read as [s]: Straße. The capital ẞ has been officially allowed since 2017; SS is still common." } },
  α: { h1: { ru: "Греческая буква альфа α", en: "Greek letter alpha α" }, usage: { ru: "Первая буква греческого алфавита. В математике и физике обозначает углы, коэффициенты и альфа-частицы.", en: "The first Greek letter; in math and physics it denotes angles, coefficients and alpha particles." } },
  π: { h1: { ru: "Число пи π", en: "Pi symbol π" }, usage: { ru: "Буква пи обозначает отношение длины окружности к диаметру: π ≈ 3,14159.", en: "Pi denotes the ratio of a circle’s circumference to its diameter: π ≈ 3.14159." } },
  "∆": { usage: { ru: "Знак приращения (дельта): ∆t — изменение времени. Внешне совпадает с греческой Δ, но в Unicode это отдельный символ.", en: "The increment sign: ∆t is a change in time. It looks like the Greek Δ but is a separate character." } },
};

/** Groups of look-alike characters with the difference in a few words. */
export const LOOKALIKES: { chars: string; note: Record<string, L10n> }[] = [
  {
    chars: "°º˚⁰∘",
    note: {
      "°": { ru: "градусы температуры и углов", en: "degrees of temperature and angles" },
      "º": { ru: "порядковый индикатор в испанском и португальском (1º)", en: "ordinal indicator in Spanish and Portuguese (1º)" },
      "˚": { ru: "кружок над буквой (диакритика)", en: "ring above a letter (diacritic)" },
      "⁰": { ru: "надстрочная цифра ноль (степень 10⁰)", en: "superscript zero (10⁰)" },
      "∘": { ru: "оператор композиции функций (f ∘ g)", en: "function composition operator (f ∘ g)" },
    },
  },
  {
    chars: "-‐‑‒–—―−",
    note: {
      "-": { ru: "дефис-минус с клавиатуры", en: "keyboard hyphen-minus" },
      "‐": { ru: "типографский дефис", en: "typographic hyphen" },
      "‑": { ru: "дефис без переноса строки", en: "hyphen that never breaks a line" },
      "‒": { ru: "тире шириной в цифру, для телефонов", en: "digit-wide dash for phone numbers" },
      "–": { ru: "среднее тире для диапазонов: 1–5", en: "en dash for ranges: 1–5" },
      "—": { ru: "длинное тире в предложениях", en: "em dash in sentences" },
      "―": { ru: "горизонтальная черта перед цитатами", en: "quotation dash" },
      "−": { ru: "математический минус: 5 − 3", en: "mathematical minus: 5 − 3" },
    },
  },
  {
    chars: "\"«»„“”'’",
    note: {
      '"': { ru: "прямые кавычки с клавиатуры", en: "straight keyboard quotes" },
      "«": { ru: "открывающая ёлочка", en: "opening guillemet" },
      "»": { ru: "закрывающая ёлочка", en: "closing guillemet" },
      "„": { ru: "открывающая лапка (внутри ёлочек)", en: "low opening quote (German, Russian nested)" },
      "“": { ru: "закрывающая лапка / английская открывающая", en: "English opening quote" },
      "”": { ru: "английская закрывающая кавычка", en: "English closing quote" },
      "'": { ru: "машинописный апостроф", en: "typewriter apostrophe" },
      "’": { ru: "типографский апостроф: don’t, О’Коннор", en: "typographic apostrophe: don’t" },
    },
  },
  {
    chars: "×xх✕✖⨯⋅",
    note: {
      "×": { ru: "знак умножения и размеров", en: "multiplication and dimensions" },
      x: { ru: "латинская буква икс", en: "Latin letter x" },
      х: { ru: "русская буква ха", en: "Cyrillic letter kha" },
      "✕": { ru: "крестик для отметок и закрытия", en: "X mark for ticks and closing" },
      "✖": { ru: "жирный крестик", en: "heavy X mark" },
      "⨯": { ru: "векторное произведение", en: "vector cross product" },
      "⋅": { ru: "умножение точкой: a ⋅ b", en: "dot product: a ⋅ b" },
    },
  },
  {
    chars: "·•∙⋅‧",
    note: {
      "·": { ru: "интерпункт, точка посередине строки", en: "middle dot" },
      "•": { ru: "маркер списка", en: "list bullet" },
      "∙": { ru: "математический оператор-точка", en: "bullet operator" },
      "⋅": { ru: "знак умножения точкой", en: "dot operator" },
      "‧": { ru: "точка переноса в словарях", en: "hyphenation point in dictionaries" },
    },
  },
  {
    chars: "\u{B5}μ",
    note: {
      "\u{B5}": { ru: "знак микро в единицах: µm, µs", en: "micro sign in units: µm, µs" },
      μ: { ru: "греческая буква мю", en: "Greek letter mu" },
    },
  },
  {
    chars: "\u{2126}Ω",
    note: {
      "\u{2126}": { ru: "знак ома (устаревшая совместимая форма)", en: "ohm sign (compatibility form)" },
      Ω: { ru: "греческая буква омега — рекомендуется для ома", en: "Greek capital omega, recommended for ohms" },
    },
  },
  {
    chars: "\u{212A}K",
    note: {
      "\u{212A}": { ru: "знак кельвина (совместимая форма)", en: "Kelvin sign (compatibility form)" },
      K: { ru: "латинская K — рекомендуется для кельвинов", en: "Latin K, recommended for kelvins" },
    },
  },
  {
    chars: "\u{212B}Å",
    note: {
      "\u{212B}": { ru: "знак ангстрема (совместимая форма)", en: "Angstrom sign (compatibility form)" },
      Å: { ru: "латинская Å — рекомендуется для ангстремов", en: "Latin Å, recommended for angstroms" },
    },
  },
  {
    chars: "♥♡❤",
    note: {
      "♥": { ru: "масть червы, текстовое сердечко", en: "heart suit, text heart" },
      "♡": { ru: "белое (контурное) сердечко", en: "white (outlined) heart" },
      "❤": { ru: "жирное сердце, основа эмодзи ❤️", en: "heavy heart, base of the ❤️ emoji" },
    },
  },
  {
    chars: "✓✔☑√",
    note: {
      "✓": { ru: "тонкая галочка", en: "check mark" },
      "✔": { ru: "жирная галочка", en: "heavy check mark" },
      "☑": { ru: "галочка в квадрате", en: "ballot box with check" },
      "√": { ru: "знак корня, не галочка", en: "square root, not a check mark" },
    },
  },
  {
    chars: "★☆✩✭*⁎",
    note: {
      "★": { ru: "закрашенная звезда", en: "black star" },
      "☆": { ru: "контурная звезда", en: "white star" },
      "✩": { ru: "контурная звезда с обводкой", en: "stress outlined white star" },
      "✭": { ru: "закрашенная звезда с обводкой", en: "outlined black star" },
      "*": { ru: "звёздочка с клавиатуры", en: "keyboard asterisk" },
      "⁎": { ru: "нижняя звёздочка", en: "low asterisk" },
    },
  },
  {
    chars: "′″'\"",
    note: {
      "′": { ru: "штрих: минуты, футы, производная f′", en: "prime: minutes, feet, derivative f′" },
      "″": { ru: "двойной штрих: секунды, дюймы", en: "double prime: seconds, inches" },
      "'": { ru: "апостроф с клавиатуры", en: "keyboard apostrophe" },
      '"': { ru: "прямые кавычки с клавиатуры", en: "keyboard double quote" },
    },
  },
  {
    chars: "ІIӀl",
    note: {
      І: { ru: "кириллическая І (казахский, украинский)", en: "Cyrillic І (Kazakh, Ukrainian)" },
      I: { ru: "латинская заглавная I", en: "Latin capital I" },
      Ӏ: { ru: "палочка — буква кавказских языков", en: "palochka, a Caucasian letter" },
      l: { ru: "латинская строчная l", en: "Latin small l" },
    },
  },
  {
    chars: "ӘƏә",
    note: {
      Ә: { ru: "кириллическая шва (казахский)", en: "Cyrillic schwa (Kazakh)" },
      Ə: { ru: "латинская шва (азербайджанский)", en: "Latin schwa (Azerbaijani)" },
      ә: { ru: "строчная кириллическая шва", en: "Cyrillic small schwa" },
    },
  },
  {
    chars: "₽РP",
    note: {
      "₽": { ru: "знак рубля", en: "ruble sign" },
      Р: { ru: "русская буква эр", en: "Cyrillic letter er" },
      P: { ru: "латинская буква P", en: "Latin letter P" },
    },
  },
  {
    chars: "…⋯⋮",
    note: {
      "…": { ru: "многоточие в тексте", en: "ellipsis in text" },
      "⋯": { ru: "многоточие по центру строки в формулах", en: "midline ellipsis in formulas" },
      "⋮": { ru: "вертикальное многоточие в матрицах", en: "vertical ellipsis in matrices" },
    },
  },
  {
    chars: "/⁄∕",
    note: {
      "/": { ru: "косая черта с клавиатуры", en: "keyboard slash" },
      "⁄": { ru: "дробная черта: 3⁄4", en: "fraction slash: 3⁄4" },
      "∕": { ru: "математическая косая черта деления", en: "division slash" },
    },
  },
  {
    chars: "|¦‖∣",
    note: {
      "|": { ru: "вертикальная черта с клавиатуры", en: "keyboard vertical bar" },
      "¦": { ru: "прерывистая черта", en: "broken bar" },
      "‖": { ru: "двойная черта: норма ‖x‖", en: "double bar: norm ‖x‖" },
      "∣": { ru: "знак делимости: a ∣ b", en: "divides: a ∣ b" },
    },
  },
  {
    chars: "\u{A0}\u{202F}\u{2009}\u{200B} ",
    note: {
      "\u{A0}": { ru: "неразрывный пробел обычной ширины", en: "no-break space of normal width" },
      "\u{202F}": { ru: "узкий неразрывный пробел", en: "narrow no-break space" },
      "\u{2009}": { ru: "тонкий пробел (с переносом)", en: "thin space (breakable)" },
      "\u{200B}": { ru: "пробел нулевой ширины", en: "zero width space" },
      " ": { ru: "обычный пробел", en: "regular space" },
    },
  },
  {
    chars: "©Ⓒ",
    note: {
      "©": { ru: "знак авторского права", en: "copyright sign" },
      "Ⓒ": { ru: "буква C в кружке — не знак копирайта", en: "circled letter C, not the copyright sign" },
    },
  },
];

/** Unicode general categories. */
export const GC_NAMES: Record<string, L10n> = {
  Lu: { ru: "заглавная буква", en: "uppercase letter" },
  Ll: { ru: "строчная буква", en: "lowercase letter" },
  Lt: { ru: "титульная буква", en: "titlecase letter" },
  Lm: { ru: "буква-модификатор", en: "modifier letter" },
  Lo: { ru: "прочая буква", en: "other letter" },
  Mn: { ru: "непротяжённый знак", en: "nonspacing mark" },
  Mc: { ru: "протяжённый знак", en: "spacing mark" },
  Me: { ru: "охватывающий знак", en: "enclosing mark" },
  Nd: { ru: "десятичная цифра", en: "decimal number" },
  Nl: { ru: "буквенное число", en: "letter number" },
  No: { ru: "прочее число", en: "other number" },
  Pc: { ru: "соединительная пунктуация", en: "connector punctuation" },
  Pd: { ru: "тире и дефисы", en: "dash punctuation" },
  Ps: { ru: "открывающая пунктуация", en: "open punctuation" },
  Pe: { ru: "закрывающая пунктуация", en: "close punctuation" },
  Pi: { ru: "открывающая кавычка", en: "initial quote" },
  Pf: { ru: "закрывающая кавычка", en: "final quote" },
  Po: { ru: "прочая пунктуация", en: "other punctuation" },
  Sm: { ru: "математический символ", en: "math symbol" },
  Sc: { ru: "символ валюты", en: "currency symbol" },
  Sk: { ru: "символ-модификатор", en: "modifier symbol" },
  So: { ru: "прочий символ", en: "other symbol" },
  Zs: { ru: "пробел", en: "space separator" },
  Zl: { ru: "разделитель строк", en: "line separator" },
  Zp: { ru: "разделитель абзацев", en: "paragraph separator" },
  Cc: { ru: "управляющий символ", en: "control" },
  Cf: { ru: "символ форматирования", en: "format" },
  Co: { ru: "для частного использования", en: "private use" },
  Cn: { ru: "не назначен", en: "unassigned" },
};
