import type { ToolDef } from "@/registry/types";
import { reverseText, sortLines } from "../lib/textOps";
import { FAQ, facts, L, LL, moreTools } from "./util";

const SORT_SAMPLE = ["груша 12", "Апельсин 3", "яблоко 100", "вишня", "банан 25"];
const SORT_SAMPLE_EN = ["pear 12", "Orange 3", "apple 100", "cherry", "banana 25"];

export const removeDuplicateLines: ToolDef = {
  slug: "remove-duplicate-lines",
  component: "text/dedupe",
  icon: "ListX",
  popular: true,
  name: L("Удалить повторяющиеся строки", "Remove duplicate lines"),
  title: L("Удалить повторяющиеся строки онлайн — дубликаты из списка", "Remove Duplicate Lines Online — dedupe a list"),
  h1: L("Удалить повторяющиеся строки", "Remove duplicate lines"),
  description: L(
    "Уберите дубликаты строк из списка: с учётом или без учёта регистра и пробелов по краям, с сохранением порядка и пустых строк. Покажем, сколько строк удалено.",
    "Remove duplicate lines from a list, with or without case and edge spaces, keeping the original order and blank lines. Shows how many lines were removed.",
  ),
  lead: L("Вставьте список — повторы исчезнут, порядок строк сохранится.", "Paste a list — duplicates disappear, the order of lines is kept."),
  keywords: LL(["дубли строк", "уникальные строки", "убрать повторы", "удалить дубликаты"], ["dedupe", "unique lines", "remove duplicates"]),
  howTo: LL(
    [
      "Вставьте список: каждая строка — отдельный элемент (можно скопировать столбец из Excel).",
      "Отметьте, учитывать ли регистр и пробелы по краям строк.",
      "Скопируйте результат — в заголовке видно, сколько строк удалено.",
      "В дополнительных настройках можно оставить только уникальные или только повторявшиеся строки.",
    ],
    [
      "Paste a list: each line is one item (you can copy a column from Excel).",
      "Choose whether case and edge spaces matter.",
      "Copy the result — the header shows how many lines were removed.",
      "More options let you keep only unique lines or only the lines that were repeated.",
    ],
  ),
  about: LL(
    [
      "Сравнение идёт по нормализованному тексту строки: «Яблоко» и «яблоко» без учёта регистра — одна строка, а «слива » с пробелом в конце — то же самое, что «слива», если включено игнорирование пробелов. Остаётся первое вхождение, порядок не меняется.",
      "Переносы строк Windows (\\r\\n), старого Mac (\\r) и Unix (\\n) обрабатываются одинаково, а пустые строки по умолчанию не трогаются — их можно дедуплицировать или удалить отдельно.",
    ],
    [
      "Lines are compared after normalization: “Apple” and “apple” are the same line when case is ignored, and “plum ” with a trailing space equals “plum” when edge spaces are ignored. The first occurrence stays and the order doesn’t change.",
      "Windows (\\r\\n), classic Mac (\\r) and Unix (\\n) line endings are handled the same way, and blank lines are left alone by default — you can dedupe or remove them separately.",
    ],
  ),
  faq: FAQ(
    [
      ["Сохраняется ли порядок строк?", "Да. Остаётся первое вхождение каждой строки, остальные удаляются, порядок не меняется. Если нужен ещё и алфавитный порядок, воспользуйтесь сортировкой строк."],
      ["Как найти только повторяющиеся строки?", "В дополнительных настройках выберите «только повторявшиеся строки» — останется по одному экземпляру каждой строки, которая встречалась больше одного раза."],
      ["Удаляются ли пустые строки?", "По умолчанию нет. В настройках можно удалить повторы пустых строк или все пустые строки сразу."],
      ["Сколько строк можно обработать?", "Десятки тысяч строк обрабатываются мгновенно — всё происходит в браузере, без загрузки файла на сервер."],
    ],
    [
      ["Is the order of lines kept?", "Yes. The first occurrence of each line stays, the rest are removed and the order doesn’t change. Use Sort lines if you also need alphabetical order."],
      ["How do I list only the repeated lines?", "In More options choose “only lines that were repeated” — you get one copy of every line that appeared more than once."],
      ["Are blank lines removed?", "Not by default. You can dedupe blank lines or remove all of them in the options."],
      ["How many lines can it handle?", "Tens of thousands of lines are processed instantly, right in your browser — nothing is uploaded."],
    ],
  ),
  related: ["sort-lines", "remove-empty-lines", "word-frequency", "text-compare"],
};

export const sortLinesTool: ToolDef = {
  slug: "sort-lines",
  component: "text/sort",
  icon: "ArrowDownAZ",
  popular: true,
  name: L("Сортировка строк по алфавиту", "Sort lines"),
  title: L("Сортировка строк по алфавиту онлайн — отсортировать список", "Sort Lines Alphabetically Online"),
  h1: L("Сортировка строк по алфавиту", "Sort lines alphabetically"),
  description: L(
    "Отсортируйте список по алфавиту от А до Я или от Я до А, по числам, по длине строки или в случайном порядке. Русский, казахский и английский алфавит, ё рядом с е.",
    "Sort a list A–Z or Z–A, by the number in each line, by length, naturally (2 before 10) or randomly. Proper alphabetical order for English and other languages.",
  ),
  lead: L("Вставьте список — строки сразу выстроятся по алфавиту.", "Paste a list — the lines are sorted alphabetically at once."),
  keywords: LL(["по алфавиту", "отсортировать список", "упорядочить строки", "от а до я"], ["alphabetical order", "sort list", "a to z"]),
  howTo: LL(
    [
      "Вставьте список — по одному элементу в строке.",
      "Выберите способ: по алфавиту, по числам, естественный порядок, по длине, случайно или в обратном порядке.",
      "Включите «По убыванию» для порядка от Я до А или от большего числа к меньшему.",
      "Скопируйте отсортированный список или скачайте его файлом.",
    ],
    [
      "Paste a list — one item per line.",
      "Pick a method: alphabetical, by number, natural, by length, random or reversed.",
      "Tick “Descending” for Z–A or from the largest number to the smallest.",
      "Copy the sorted list or download it as a file.",
    ],
  ),
  about: LL(
    [
      "Сортировка использует правила алфавита из стандарта Юникода (Intl.Collator): в русском режиме кириллица идёт перед латиницей, ё стоит рядом с е, регистр не мешает. Для списков файлов подходит естественная сортировка — «файл2» окажется раньше, чем «файл10».",
      "Числовая сортировка находит первое число в строке и понимает форматы «1 000,5» и «1,000.5»; строки без чисел не превращаются в NaN, а остаются в конце в исходном порядке. Случайный порядок использует криптографический генератор браузера.",
    ],
    [
      "Sorting uses Unicode collation rules (Intl.Collator): letters with accents sort next to their base letters and case doesn’t get in the way. Natural sort suits file lists — “file2” comes before “file10”.",
      "Numeric sort finds the first number in each line and understands “1,000.5” and “1 000,5”; lines without numbers never become NaN — they stay at the end in their original order. Random order uses the browser’s cryptographic generator.",
    ],
  ),
  faq: FAQ(
    [
      ["Как отсортировать список от Я до А?", "Выберите сортировку по алфавиту и отметьте «По убыванию»."],
      ["Почему «файл10» стоит раньше «файл2»?", "При обычной алфавитной сортировке сравниваются символы: «1» меньше «2». Выберите «Естественная» — тогда числа внутри строк сравниваются как числа."],
      ["Как сортируется буква ё?", "По правилам русского алфавита ё идёт вместе с е: «ёж» окажется рядом с «ерш», а не в конце списка."],
      ["Что происходит со строками без чисел при числовой сортировке?", "Они не теряются и не ломают порядок: такие строки ставятся в конец списка в том порядке, в каком были."],
    ],
    [
      ["How do I sort Z to A?", "Choose alphabetical sort and tick “Descending”."],
      ["Why does “file10” come before “file2”?", "Plain alphabetical sort compares characters one by one and “1” is less than “2”. Choose Natural sort to compare numbers inside lines as numbers."],
      ["How are accented letters sorted?", "Next to their base letters, as in a dictionary: “éclair” sorts near “eclipse”, not after “z”."],
      ["What happens to lines without numbers in numeric sort?", "They aren’t lost and don’t break the order: they go to the end in their original order."],
    ],
  ),
  related: ["remove-duplicate-lines", "reverse-text", "add-line-numbers", "remove-empty-lines"],
  variants: {
    title: L("Другие способы сортировки", "Other ways to sort"),
    list: () => [
      {
        slug: "z-to-a",
        name: L("От Я до А", "Z to A"),
        title: L("Сортировка по алфавиту в обратном порядке — от Я до А", "Sort in reverse alphabetical order — Z to A"),
        h1: L("Сортировка от Я до А", "Sort Z to A"),
        description: L(
          "Отсортируйте строки по алфавиту в обратном порядке: от Я до А и от Z до A. Регистр не мешает, ё стоит рядом с е, пустые строки и повторы можно убрать.",
          "Sort lines in reverse alphabetical order, from Z to A. Case doesn’t interfere, accented letters stay next to their base letters; blanks and repeats can go.",
        ),
        lead: L("Строки выстроятся от Я до А — вставьте список.", "Lines are ordered from Z to A — paste your list."),
        props: { mode: "alpha", descending: true },
        blocks: (locale) => [
          facts(locale, L("Пример", "Example"), [
            [L("Было", "Input"), (locale === "ru" ? SORT_SAMPLE : SORT_SAMPLE_EN).join(", ")],
            [L("Стало", "Output"), sortLines((locale === "ru" ? SORT_SAMPLE : SORT_SAMPLE_EN).join("\n"), { mode: "alpha", descending: true, locale }).join(", ")],
          ]),
          moreTools(locale, "sort-lines"),
        ],
        faq: FAQ(
          [["Как сделать обратную сортировку?", "Эта страница сразу включает «По убыванию». Сортировку можно переключить на числовую или по длине — порядок останется убывающим."]],
          [["How do I sort in reverse?", "This page turns on “Descending” for you. You can switch to numeric or length sort — the order stays descending."]],
        ),
      },
      {
        slug: "numeric",
        name: L("По числам", "By number"),
        title: L("Сортировка строк по числам онлайн — по возрастанию", "Sort lines by number online — numeric sort"),
        h1: L("Сортировка строк по числам", "Sort lines by number"),
        description: L(
          "Отсортируйте строки по первому числу в каждой: 2 раньше 10, «1 000,5» и «1,000.5» понимаются правильно. Строки без чисел не ломают порядок и идут в конец.",
          "Sort lines by the first number in each: 2 before 10, and both “1,000.5” and “1 000,5” are read correctly. Lines without numbers go to the end.",
        ),
        lead: L("Строки упорядочатся по первому числу в каждой.", "Lines are ordered by the first number in each."),
        props: { mode: "numeric" },
        blocks: (locale) => [
          facts(locale, L("Пример", "Example"), [
            [L("Было", "Input"), (locale === "ru" ? SORT_SAMPLE : SORT_SAMPLE_EN).join(", ")],
            [L("Стало", "Output"), sortLines((locale === "ru" ? SORT_SAMPLE : SORT_SAMPLE_EN).join("\n"), { mode: "numeric", locale }).join(", ")],
            [L("Понимает", "Understands"), "−5, 2,5, 1 000, 1,000.5, 3e3"],
          ]),
          moreTools(locale, "sort-lines"),
        ],
        faq: FAQ(
          [
            ["Какое число берётся из строки?", "Первое встреченное: в строке «Товар 15 шт. по 200 ₸» это 15."],
            ["Куда попадают строки без чисел?", "В конец списка, в исходном порядке — они не превращаются в NaN и не смешиваются с числами."],
          ],
          [
            ["Which number is used?", "The first one found: in “Item 15 pcs at $200” it’s 15."],
            ["Where do lines without numbers go?", "To the end, in their original order — they never turn into NaN or mix with numbered lines."],
          ],
        ),
      },
      {
        slug: "by-length",
        name: L("По длине строки", "By length"),
        title: L("Сортировка строк по длине онлайн — от коротких к длинным", "Sort lines by length online"),
        h1: L("Сортировка строк по длине", "Sort lines by length"),
        description: L(
          "Упорядочьте строки по длине: от коротких к длинным или наоборот. Длина считается в символах, как их видит человек, — эмодзи и буквы с ударением считаются за один.",
          "Order lines by length, shortest first or longest first. Length is counted in characters as people see them — an emoji or accented letter counts as one.",
        ),
        lead: L("Короткие строки окажутся сверху, длинные — внизу.", "Short lines go to the top, long ones to the bottom."),
        props: { mode: "length" },
        blocks: (locale) => [
          facts(locale, L("Пример", "Example"), [
            [L("Было", "Input"), locale === "ru" ? "дом, ёж, телефон, кот, автомобиль" : "house, ox, telephone, cat, automobile"],
            [
              L("Стало", "Output"),
              sortLines(locale === "ru" ? "дом\nёж\nтелефон\nкот\nавтомобиль" : "house\nox\ntelephone\ncat\nautomobile", { mode: "length", locale }).join(", "),
            ],
          ]),
          moreTools(locale, "sort-lines"),
        ],
        faq: FAQ(
          [["Как сортируются строки одинаковой длины?", "По алфавиту между собой — так результат предсказуем."]],
          [["How are lines of equal length ordered?", "Alphabetically among themselves, so the result is predictable."]],
        ),
      },
      {
        slug: "shuffle",
        name: L("Перемешать строки", "Shuffle lines"),
        title: L("Перемешать строки в случайном порядке онлайн", "Shuffle lines — randomize a list online"),
        h1: L("Перемешать строки случайно", "Shuffle lines randomly"),
        description: L(
          "Перемешайте список в случайном порядке: для жеребьёвки, очереди выступлений или вопросов теста. Порядок задаёт криптографический генератор браузера.",
          "Shuffle a list into random order — for a draw, a speaking order or quiz questions. The order comes from the browser’s cryptographic random generator.",
        ),
        lead: L("Нажмите «Перемешать» — строки встанут в случайном порядке.", "Press “Shuffle” — the lines are put in random order."),
        props: { mode: "random" },
        blocks: (locale) => [
          facts(locale, L("Как это работает", "How it works"), [
            [L("Алгоритм", "Algorithm"), L("тасование Фишера — Йетса", "Fisher–Yates shuffle")],
            [L("Источник случайности", "Randomness source"), "crypto.getRandomValues"],
            [L("Все порядки", "Every order"), L("равновероятны", "equally likely")],
          ]),
          moreTools(locale, "sort-lines"),
        ],
        faq: FAQ(
          [
            ["Насколько случаен порядок?", "Используется алгоритм Фишера — Йетса и криптографический генератор crypto.getRandomValues с отбрасыванием смещения, поэтому все перестановки равновероятны."],
            ["Можно ли перемешать ещё раз?", "Да, каждое нажатие «Перемешать» даёт новый порядок; при изменении списка он перемешивается заново."],
          ],
          [
            ["How random is the order?", "It uses the Fisher–Yates algorithm with crypto.getRandomValues and rejection sampling, so every permutation is equally likely."],
            ["Can I shuffle again?", "Yes, each press of “Shuffle” gives a new order; editing the list reshuffles it."],
          ],
        ),
      },
    ],
  },
};

export const reverseTextTool: ToolDef = {
  slug: "reverse-text",
  component: "text/reverse",
  icon: "ArrowLeftRight",
  name: L("Текст задом наперёд", "Reverse text"),
  title: L("Перевернуть текст задом наперёд онлайн", "Reverse Text — write text backwards online"),
  h1: L("Текст задом наперёд", "Reverse text"),
  description: L(
    "Переверните текст задом наперёд, поменяйте порядок слов или строк, отразите буквы внутри слов. Эмодзи, флаги и буквы с ударениями не ломаются при развороте.",
    "Write text backwards, reverse the order of words or lines, or flip the letters inside each word. Emoji, flags and accented letters survive the reversal.",
  ),
  lead: L("«Привет» → «тевирП»: вставьте текст и выберите, что переворачивать.", "“Hello” → “olleH”: paste text and choose what to reverse."),
  keywords: LL(["наоборот", "перевернуть слова", "зеркальный текст", "палиндром"], ["backwards text", "reverse words", "mirror text"]),
  howTo: LL(
    [
      "Вставьте текст.",
      "Выберите режим: весь текст, каждую строку, порядок слов, буквы в словах или порядок строк.",
      "Скопируйте результат.",
    ],
    ["Paste your text.", "Pick a mode: whole text, each line, word order, letters in words or line order.", "Copy the result."],
  ),
  about: LL(
    [
      "Текст переворачивается по графемам — символам, какими их видит человек. Поэтому составной эмодзи 👨‍👩‍👧, флаг 🇰🇿 или буква с ударением не рассыпаются на части, как это бывает у простых инструментов, которые переворачивают кодовые единицы.",
      "Можно проверить палиндром: «А роза упала на лапу Азора» задом наперёд читается так же (если не считать пробелов и регистра).",
    ],
    [
      "Text is reversed by graphemes — characters as people see them. A combined emoji 👨‍👩‍👧, a flag 🇰🇿 or an accented letter doesn’t fall apart the way it does in simple tools that reverse code units.",
      "It’s handy for checking palindromes: “Was it a car or a cat I saw” reads the same backwards (ignoring spaces and case).",
    ],
  ),
  faq: FAQ(
    [
      ["Как написать текст задом наперёд?", "Вставьте его в поле — в режиме «Весь текст» последняя буква станет первой: «Привет, мир» → «рим ,тевирП»."],
      ["Почему у других сервисов ломаются эмодзи?", "Они переворачивают коды символов, а эмодзи и флаги состоят из нескольких кодов. Здесь текст делится на графемы, поэтому эмодзи остаются целыми."],
      ["Как поменять порядок слов, не переворачивая буквы?", "Выберите «Порядок слов»: «один два три» → «три два один»."],
    ],
    [
      ["How do I write text backwards?", "Paste it — in “Whole text” mode the last letter becomes the first: “Hello, world” → “dlrow ,olleH”."],
      ["Why do emoji break in other tools?", "They reverse code points, while emoji and flags consist of several of them. Here the text is split into graphemes, so emoji stay intact."],
      ["How do I reverse word order without flipping letters?", "Choose “Word order”: “one two three” → “three two one”."],
    ],
  ),
  related: ["case-converter", "sort-lines", "word-counter"],
  variants: {
    title: L("Другие режимы", "Other modes"),
    list: () => [
      {
        slug: "words",
        name: L("Обратный порядок слов", "Reverse word order"),
        title: L("Обратный порядок слов в предложении онлайн", "Reverse word order online"),
        h1: L("Обратный порядок слов", "Reverse word order"),
        description: L(
          "Поменяйте порядок слов на обратный: «один два три» → «три два один». Буквы в словах не переворачиваются, пробелы и переносы строк остаются на своих местах.",
          "Reverse the order of words: “one two three” → “three two one”. Letters inside words are not flipped; spaces and line breaks stay where they were.",
        ),
        lead: L("Слова встанут в обратном порядке, буквы останутся как были.", "Words go in reverse order; letters stay as they were."),
        props: { mode: "words" },
        blocks: (locale) => [
          facts(locale, L("Пример", "Example"), [
            [L("Было", "Input"), locale === "ru" ? "мама мыла раму" : "the quick brown fox"],
            [L("Стало", "Output"), reverseText(locale === "ru" ? "мама мыла раму" : "the quick brown fox", "words")],
          ]),
          moreTools(locale, "reverse-text"),
        ],
        faq: FAQ(
          [["Каждая строка обрабатывается отдельно?", "Да, слова переставляются внутри своей строки, порядок строк не меняется."]],
          [["Is each line handled separately?", "Yes, words are reordered within their own line; the order of lines doesn’t change."]],
        ),
      },
      {
        slug: "lines",
        name: L("Обратный порядок строк", "Reverse line order"),
        title: L("Перевернуть порядок строк онлайн — снизу вверх", "Reverse line order — flip a list upside down"),
        h1: L("Обратный порядок строк", "Reverse line order"),
        description: L(
          "Переверните список снизу вверх: последняя строка станет первой. Содержимое строк не меняется — удобно для логов, хронологии и списков, записанных с конца.",
          "Flip a list upside down: the last line becomes the first. Line contents don’t change — handy for logs, timelines and lists written from the end.",
        ),
        lead: L("Последняя строка станет первой, первая — последней.", "The last line becomes the first and the first the last."),
        props: { mode: "lines" },
        blocks: (locale) => [
          facts(locale, L("Пример", "Example"), [
            [L("Было", "Input"), "1, 2, 3, 4"],
            [L("Стало", "Output"), reverseText("1\n2\n3\n4", "lines").split("\n").join(", ")],
          ]),
          moreTools(locale, "reverse-text"),
        ],
        faq: FAQ(
          [["Чем это отличается от сортировки по убыванию?", "Сортировка упорядочивает строки по алфавиту, а здесь просто зеркально меняется исходный порядок, каким бы он ни был."]],
          [["How is it different from sorting descending?", "Sorting orders lines alphabetically; this simply mirrors the existing order, whatever it is."]],
        ),
      },
    ],
  },
};

function lineTool(o: {
  slug: string;
  op: string;
  icon: string;
  name: [string, string];
  title: [string, string];
  h1: [string, string];
  description: [string, string];
  lead: [string, string];
  keywords: [string[], string[]];
  howTo: [string[], string[]];
  about: [string[], string[]];
  faq: { ru: [string, string][]; en: [string, string][] };
  related: string[];
}): ToolDef {
  return {
    slug: o.slug,
    component: "text/lines",
    icon: o.icon,
    props: { op: o.op },
    name: L(...o.name),
    title: L(...o.title),
    h1: L(...o.h1),
    description: L(...o.description),
    lead: L(...o.lead),
    keywords: LL(...o.keywords),
    howTo: LL(...o.howTo),
    about: LL(...o.about),
    faq: FAQ(o.faq.ru, o.faq.en),
    related: o.related,
  };
}

export const addLineNumbers = lineTool({
  slug: "add-line-numbers",
  op: "number",
  icon: "ListOrdered",
  name: ["Пронумеровать строки", "Add line numbers"],
  title: ["Пронумеровать строки онлайн — нумерация списка", "Add Line Numbers Online — number a list"],
  h1: ["Пронумеровать строки", "Add line numbers"],
  description: [
    "Пронумеруйте строки текста: 1. 2. 3., 1) 2), [1] или с ведущими нулями 01, 02. Можно начать с любого числа и пропускать пустые строки — нумерация сразу.",
    "Number the lines of a text: 1. 2. 3., 1) 2), [1] or with leading zeros 01, 02. Start from any number and skip empty lines — numbering is instant.",
  ],
  lead: ["Вставьте список — строки получат номера 1., 2., 3.…", "Paste a list — lines get numbers 1., 2., 3.…"],
  keywords: [["нумерация строк", "пронумеровать список", "номера строк"], ["number lines", "numbered list", "line numbering"]],
  howTo: [
    ["Вставьте текст — по одному пункту в строке.", "Выберите формат номера и число, с которого начать.", "Отметьте, пропускать ли пустые строки, и скопируйте результат."],
    ["Paste your text — one item per line.", "Pick the number format and the starting number.", "Choose whether to skip empty lines and copy the result."],
  ],
  about: [
    [
      "Инструмент добавляет номер в начало каждой строки: форматы «1.», «1)», «[1]», «#1» и «1 -», можно начать с нуля или любого числа и выровнять номера нулями, чтобы «01» и «10» были одной ширины.",
      "Пустые строки по умолчанию пропускаются и не получают номер — абзацы и разделители между пунктами сохраняются.",
    ],
    [
      "The tool adds a number to the start of every line: formats “1.”, “1)”, “[1]”, “#1” and “1 -”; start from zero or any number and pad with zeros so “01” and “10” have the same width.",
      "Empty lines are skipped by default and get no number, so paragraphs and separators between items survive.",
    ],
  ],
  faq: {
    ru: [
      ["Как пронумеровать строки с 0 или с 100?", "Укажите нужное число в поле «Начать с» — нумерация продолжится от него."],
      ["Можно ли убрать номера обратно?", "Да, через «Найти и заменить» с регулярным выражением ^\\d+[.)]\\s* и пустой заменой."],
      ["Нумеруются ли пустые строки?", "Нет, если включено «Пропускать пустые». Отключите опцию, чтобы номер получила каждая строка."],
    ],
    en: [
      ["How do I start numbering at 0 or 100?", "Enter the number in “Start at” — numbering continues from there."],
      ["Can I remove the numbers later?", "Yes, with Find and replace using the regular expression ^\\d+[.)]\\s* and an empty replacement."],
      ["Are empty lines numbered?", "Not while “Skip empty lines” is on. Turn it off to number every line."],
    ],
  },
  related: ["add-prefix-suffix", "sort-lines", "remove-empty-lines", "find-and-replace"],
});

export const addPrefixSuffix = lineTool({
  slug: "add-prefix-suffix",
  op: "prefix",
  icon: "TextCursorInput",
  name: ["Добавить текст в каждую строку", "Add prefix and suffix"],
  title: ["Добавить текст в начало и конец каждой строки онлайн", "Add Prefix and Suffix to Each Line Online"],
  h1: ["Добавить текст в начало и конец строк", "Add a prefix and suffix to every line"],
  description: [
    "Добавьте одинаковый текст в начало и конец каждой строки: маркеры списка, кавычки, запятые, теги HTML или части SQL-запроса. Пустые строки можно пропустить.",
    "Add the same text to the start and end of every line: bullets, quotes, commas, HTML tags or parts of an SQL query. Empty lines can be skipped.",
  ],
  lead: ["Префикс и суффикс добавятся к каждой строке списка.", "The prefix and suffix are added to every line of the list."],
  keywords: [["префикс", "суффикс", "в начало строки", "в конец строки", "кавычки к каждой строке"], ["prefix lines", "suffix lines", "wrap lines"]],
  howTo: [
    ["Вставьте список.", "Введите текст для начала строки и для конца.", "Скопируйте результат — например, список в кавычках и через запятую для SQL."],
    ["Paste your list.", "Type the text for the start and the end of each line.", "Copy the result — for example, a quoted, comma-separated list for SQL."],
  ],
  about: [
    [
      "Типичные задачи: превратить столбец значений в список для SQL (префикс ' и суффикс ',), добавить маркеры «— » к пунктам, обернуть строки в теги <li>…</li> или добавить хештег к каждому слову.",
      "Пробелы в префиксе и суффиксе сохраняются как есть, поэтому можно точно задать отступ.",
    ],
    [
      "Typical jobs: turn a column of values into an SQL list (prefix ' and suffix ',), add “— ” bullets to items, wrap lines in <li>…</li> tags or add a hashtag to each word.",
      "Spaces in the prefix and suffix are kept exactly, so you can control indentation precisely.",
    ],
  ],
  faq: {
    ru: [
      ["Как сделать из столбца список для SQL IN (…)?", "Префикс ', суффикс ', — затем объедините строки инструментом «Объединить строки» и уберите последнюю запятую."],
      ["Добавляется ли текст к пустым строкам?", "Нет, пока включено «Пропускать пустые»."],
    ],
    en: [
      ["How do I turn a column into an SQL IN (…) list?", "Use prefix ' and suffix ', then merge the lines with Join lines and drop the last comma."],
      ["Is text added to empty lines?", "Not while “Skip empty lines” is on."],
    ],
  },
  related: ["add-line-numbers", "join-lines", "find-and-replace", "split-text"],
});

export const joinLinesTool = lineTool({
  slug: "join-lines",
  op: "join",
  icon: "WrapText",
  name: ["Объединить строки в одну", "Join lines"],
  title: ["Объединить строки в одну онлайн — через запятую или пробел", "Join Lines Online — merge lines with a comma or space"],
  h1: ["Объединить строки в одну", "Join lines into one"],
  description: [
    "Склейте столбец или список в одну строку через запятую, пробел, точку с запятой или любой разделитель. Пустые строки пропускаются, пробелы по краям обрезаются.",
    "Merge a column or list into one line separated by commas, spaces, semicolons or any other separator. Empty lines are skipped and edges trimmed.",
  ],
  lead: ["Список превратится в одну строку через выбранный разделитель.", "A list becomes one line with the separator you choose."],
  keywords: [["склеить строки", "в одну строку", "через запятую", "столбец в строку"], ["merge lines", "join with comma", "column to row"]],
  howTo: [
    ["Вставьте список — например, столбец из Excel.", "Выберите разделитель: запятая, запятая с пробелом, пробел, точка с запятой, черта или без разделителя.", "Скопируйте получившуюся строку."],
    ["Paste a list — for example a column from Excel.", "Pick a separator: comma, comma and space, space, semicolon, bar or none.", "Copy the resulting line."],
  ],
  about: [
    [
      "Удобно, чтобы передать список адресов почты, артикулов или тегов в одну строку: пустые строки пропускаются, пробелы по краям каждой строки обрезаются, поэтому лишних разделителей не будет.",
      "Обратная операция — «Разбить на строки» — превращает строку с разделителями снова в столбец.",
    ],
    [
      "Useful for passing a list of e-mails, SKUs or tags as one line: empty lines are skipped and each line is trimmed, so there are no stray separators.",
      "The reverse operation, Split text, turns a delimited line back into a column.",
    ],
  ],
  faq: {
    ru: [
      ["Как соединить строки через запятую?", "Выберите разделитель «запятая и пробел» — «яблоко, груша, слива»."],
      ["Как убрать переносы строк внутри абзацев, а абзацы оставить?", "Для этого подходит «Удалить переносы строк»: он склеивает строки внутри абзацев и сохраняет пустую строку между ними."],
    ],
    en: [
      ["How do I join lines with commas?", "Pick “comma and space” — “apple, pear, plum”."],
      ["How do I remove line breaks inside paragraphs but keep paragraphs?", "Use Remove line breaks: it joins lines inside paragraphs and keeps the blank line between them."],
    ],
  },
  related: ["split-text", "remove-line-breaks", "add-prefix-suffix", "remove-duplicate-lines"],
});

export const splitText = lineTool({
  slug: "split-text",
  op: "split",
  icon: "SplitSquareVertical",
  name: ["Разбить текст на строки", "Split text into lines"],
  title: ["Разбить текст на строки по разделителю онлайн", "Split Text into Lines by a Delimiter Online"],
  h1: ["Разбить текст на строки", "Split text into lines"],
  description: [
    "Разбейте строку со значениями через запятую, точку с запятой или другой символ на отдельные строки — столбец для Excel. Пробелы обрезаются, пустые пропускаются.",
    "Split a line of values separated by commas, semicolons or any character into separate lines — a column ready for Excel. Spaces trimmed, empties skipped.",
  ],
  lead: ["«а, б, в» превратится в столбец из трёх строк.", "“a, b, c” turns into a column of three lines."],
  keywords: [["разделить по запятой", "строку в столбец", "каждое слово с новой строки"], ["split by comma", "delimiter to newline", "row to column"]],
  howTo: [
    ["Вставьте текст со значениями через разделитель.", "Укажите разделитель: запятую, точку с запятой, пробел или любой текст (\\t — табуляция).", "Скопируйте получившийся столбец."],
    ["Paste text with delimited values.", "Enter the delimiter: comma, semicolon, space or any text (\\t for a tab).", "Copy the resulting column."],
  ],
  about: [
    [
      "Каждый фрагмент между разделителями становится отдельной строкой; пробелы по краям обрезаются, а пустые фрагменты (например, из-за двух запятых подряд) пропускаются.",
      "Разделитель может быть любым текстом, в том числе из нескольких символов, например « | » или «; ». Табуляция задаётся как \\t.",
    ],
    [
      "Every piece between delimiters becomes its own line; edge spaces are trimmed and empty pieces (from two commas in a row, say) are skipped.",
      "The delimiter can be any text, including several characters such as “ | ” or “; ”. Use \\t for a tab.",
    ],
  ],
  faq: {
    ru: [
      ["Как поставить каждое слово с новой строки?", "Укажите в разделителе пробел — каждое слово окажется на своей строке."],
      ["Как вставить результат в Excel столбцом?", "Скопируйте результат и вставьте в ячейку — каждая строка займёт отдельную ячейку столбца."],
    ],
    en: [
      ["How do I put each word on a new line?", "Use a space as the delimiter — every word ends up on its own line."],
      ["How do I paste the result into Excel as a column?", "Copy the result and paste it into a cell — each line fills its own cell in the column."],
    ],
  },
  related: ["join-lines", "remove-duplicate-lines", "sort-lines", "email-extractor"],
});

export const removeEmptyLines = lineTool({
  slug: "remove-empty-lines",
  op: "remove-empty",
  icon: "ListMinus",
  name: ["Удалить пустые строки", "Remove empty lines"],
  title: ["Удалить пустые строки из текста онлайн", "Remove Empty Lines Online — delete blank lines"],
  h1: ["Удалить пустые строки", "Remove empty lines"],
  description: [
    "Удалите пустые строки из текста или списка, включая строки только из пробелов и табуляций. Остальные строки и их порядок не меняются, результат можно скопировать.",
    "Delete blank lines from a text or list, including lines that contain only spaces or tabs. Other lines and their order stay the same; copy the result.",
  ],
  lead: ["Пустые строки исчезнут, остальной текст останется как был.", "Blank lines disappear; the rest of the text stays as it was."],
  keywords: [["пустые строки", "убрать пустые строки", "лишние строки"], ["delete blank lines", "remove blank lines"]],
  howTo: [
    ["Вставьте текст.", "Решите, считать ли пустыми строки из одних пробелов (по умолчанию — да).", "Скопируйте текст без пустых строк."],
    ["Paste your text.", "Decide whether whitespace-only lines count as empty (they do by default).", "Copy the text without blank lines."],
  ],
  about: [
    [
      "Строка считается пустой, если в ней нет ничего, кроме пробелов, табуляций и неразрывных пробелов. Отключите эту опцию, чтобы удалять только совсем пустые строки.",
      "Если нужно не удалить, а оставить максимум одну пустую строку между абзацами, используйте «Очистку текста».",
    ],
    [
      "A line counts as empty when it contains nothing but spaces, tabs and non-breaking spaces. Turn the option off to remove only truly empty lines.",
      "To keep at most one blank line between paragraphs instead of removing them all, use the Text cleaner.",
    ],
  ],
  faq: {
    ru: [
      ["Удалятся ли строки, в которых только пробелы?", "Да, по умолчанию. Снимите галочку «Строки из пробелов тоже пустые», чтобы их оставить."],
      ["Как оставить одну пустую строку между абзацами?", "В «Очистке текста» выберите для пустых строк «не больше одной подряд»."],
    ],
    en: [
      ["Are whitespace-only lines removed?", "Yes, by default. Untick “Whitespace-only lines count as empty” to keep them."],
      ["How do I keep one blank line between paragraphs?", "In the Text cleaner set empty lines to “at most one in a row”."],
    ],
  },
  related: ["remove-duplicate-lines", "remove-line-breaks", "text-cleaner", "remove-extra-spaces"],
});

export const repeatTextTool: ToolDef = {
  slug: "repeat-text",
  component: "text/repeat",
  icon: "Repeat",
  name: L("Повторить текст", "Text repeater"),
  title: L("Повторить текст несколько раз онлайн", "Text Repeater — repeat text N times online"),
  h1: L("Повторить текст несколько раз", "Repeat text multiple times"),
  description: L(
    "Повторите слово, фразу или абзац нужное число раз — до 10 000 повторов — через перенос строки, пробел, запятую или без разделителя. Результат можно скопировать.",
    "Repeat a word, phrase or paragraph as many times as you need — up to 10,000 — separated by new lines, spaces, commas or nothing. Copy the result.",
  ),
  lead: L("Введите текст и число повторов — результат появится сразу.", "Enter text and a number of repeats — the result appears instantly."),
  keywords: LL(["размножить текст", "повторение строки", "повтор слова"], ["repeat string", "duplicate text", "text multiplier"]),
  howTo: LL(
    ["Введите текст, который нужно повторить.", "Укажите число повторов и разделитель.", "Скопируйте результат или скачайте файлом."],
    ["Type the text to repeat.", "Set the number of repeats and a separator.", "Copy the result or download it as a file."],
  ),
  about: LL(
    [
      "Пригодится для тестовых данных и проверки полей ввода на длинные строки, а также для шуточных сообщений. Число повторов ограничено 10 000, чтобы страница не зависла.",
      "Разделитель можно выбрать: новая строка, пустая строка, пробел, запятая или ничего.",
    ],
    [
      "Useful for test data, checking input fields with long strings and for jokey messages. Repeats are capped at 10,000 so the page stays responsive.",
      "Choose the separator: new line, blank line, space, comma or nothing.",
    ],
  ),
  faq: FAQ(
    [
      ["Сколько раз можно повторить текст?", "До 10 000 раз. Для очень длинного результата удобнее скачать файл, чем копировать."],
      ["Можно ли повторить текст без пробелов?", "Да, выберите разделитель «без разделителя» — копии склеятся подряд."],
    ],
    [
      ["How many times can text be repeated?", "Up to 10,000. For a very long result, downloading a file is easier than copying."],
      ["Can I repeat text without spaces?", "Yes, choose “nothing” as the separator — the copies are glued together."],
    ],
  ),
  related: ["word-counter", "lorem-ipsum", "add-line-numbers"],
};

export const wordFrequencyTool: ToolDef = {
  slug: "word-frequency",
  component: "text/frequency",
  icon: "ChartColumn",
  name: L("Частотность слов", "Word frequency"),
  title: L("Частотность слов в тексте онлайн — подсчёт повторов", "Word Frequency Counter — find repeated words online"),
  h1: L("Частотность слов в тексте", "Word frequency counter"),
  description: L(
    "Посчитайте, сколько раз встречается каждое слово или фраза из 2–3 слов, и их долю в тексте. Служебные слова можно скрыть, таблицу — скачать в CSV.",
    "Count how many times each word or 2–3-word phrase appears and its share of the text. Hide stop words and download the table as CSV.",
  ),
  lead: L("Таблица самых частых слов строится при вводе текста.", "A table of the most frequent words builds as you type."),
  keywords: LL(["повторы слов", "частотный анализ", "плотность ключевых слов", "тошнота текста"], ["keyword density", "word count by frequency", "most used words"]),
  howTo: LL(
    [
      "Вставьте текст.",
      "Оставьте «Без служебных слов», чтобы предлоги и союзы не мешали, и выберите: слова или фразы из 2–3 слов.",
      "Смотрите таблицу: слово, число повторов и долю от всех слов.",
      "Скачайте таблицу в CSV для Excel или Google Таблиц.",
    ],
    [
      "Paste your text.",
      "Keep “Hide stop words” on so prepositions don’t get in the way, and choose single words or 2–3-word phrases.",
      "Read the table: word, number of occurrences and share of all words.",
      "Download the table as CSV for Excel or Google Sheets.",
    ],
  ),
  about: LL(
    [
      "Частотный анализ помогает найти переспам — ключевое слово, которое повторяется слишком часто, — и слова-паразиты. Слова считаются без учёта регистра, по правилам Юникода, поэтому одинаково работают русский, казахский и английский тексты.",
      "Список служебных слов включает частые русские и английские предлоги, союзы, частицы и местоимения. Разные формы слова («кот», «кота», «коту») считаются отдельно — лемматизация не выполняется.",
    ],
    [
      "Frequency analysis helps spot keyword stuffing — a keyword repeated too often — and filler words. Words are counted case-insensitively by Unicode rules, so English, Russian and other texts work the same way.",
      "The stop-word list covers common English and Russian prepositions, conjunctions, particles and pronouns. Different forms of a word (run, runs, running) are counted separately — no lemmatization is done.",
    ],
  ),
  faq: FAQ(
    [
      ["Как рассчитывается доля слова?", "Число повторов делится на количество всех учтённых слов (после исключения служебных слов и слишком коротких)."],
      ["Объединяются ли формы слова?", "Нет: «кот» и «кота» — разные строки таблицы. Так видно, какие именно формы повторяются."],
      ["Что значит «фразы из 2 слов»?", "Считаются пары соседних слов внутри предложения — это помогает найти повторяющиеся словосочетания и ключевые фразы."],
    ],
    [
      ["How is a word’s share calculated?", "Its count is divided by the number of all counted words (after dropping stop words and very short words)."],
      ["Are word forms merged?", "No: “run” and “runs” are separate rows, so you see exactly which forms repeat."],
      ["What are 2-word phrases?", "Pairs of neighbouring words within a sentence — useful for finding repeated collocations and key phrases."],
    ],
  ),
  related: ["word-counter", "remove-duplicate-lines", "text-compare"],
};
