import type { ToolDef, VariantDef } from "@/registry/types";
import { PRIVACY, PRIVACY_QA, faq } from "./shared";

/* ───────────── merge ───────────── */

export const mergeTool: ToolDef = {
  slug: "merge-pdf",
  component: "pdf/merge",
  icon: "Combine",
  popular: true,
  name: { ru: "Объединить PDF", en: "Merge PDF" },
  title: { ru: "Объединить PDF онлайн — склеить PDF-файлы в один", en: "Merge PDF online — combine PDF files into one" },
  h1: { ru: "Объединить PDF онлайн", en: "Merge PDF online" },
  description: {
    ru: "Склейте несколько PDF в один прямо в браузере: порядок файлов и страниц, диапазоны вида 1-3, 5, поворот страниц. Без пересжатия и без загрузки на сервер.",
    en: "Combine several PDFs into one right in your browser: order files and pages, pick ranges like 1-3, 5, rotate pages. No re-compression, no uploads.",
  },
  lead: {
    ru: "Добавьте PDF-файлы, расставьте их по порядку и получите один документ — всё делается на вашем устройстве.",
    en: "Add PDF files, put them in order and get a single document — everything happens on your device.",
  },
  keywords: {
    ru: ["склеить pdf", "соединить pdf", "объединить pdf файлы в один", "слить pdf", "собрать pdf из нескольких"],
    en: ["combine pdf", "join pdf", "merge pdf files into one", "pdf merger"],
  },
  howTo: {
    ru: [
      "Перетащите PDF-файлы в поле или выберите их — можно сразу несколько.",
      "Расставьте файлы стрелками; у каждого файла можно указать страницы, например «1-3, 5».",
      "Чтобы переставить отдельные страницы, нажмите «Упорядочить страницы» и перетащите миниатюры.",
      "Нажмите «Объединить» и скачайте готовый PDF.",
    ],
    en: [
      "Drop PDF files into the box or choose them — several at once is fine.",
      "Order the files with the arrows; for each file you can list pages, e.g. “1-3, 5”.",
      "To reorder individual pages, click “Arrange pages” and drag the thumbnails.",
      "Click “Merge” and download the combined PDF.",
    ],
  },
  about: {
    ru: [
      "Страницы копируются целиком, без пересжатия: текст остаётся текстом, векторы — векторами, шрифты и ссылки внутри страниц сохраняются, поэтому качество не меняется. Общие шрифты и картинки одного файла записываются один раз, и размер результата близок к сумме исходных.",
      "Диапазоны страниц пишутся как «1-3, 5, 8-» (8- — с восьмой до конца) и сохраняют ваш порядок: «5, 1-4» поставит пятую страницу первой, а одну страницу можно повторить. Файл под паролем объединяется после ввода пароля — без него содержимое зашифровано.",
      PRIVACY.ru,
    ],
    en: [
      "Pages are copied whole, without re-compression: text stays text, vectors stay vectors, fonts and in-page links are kept, so quality does not change. Fonts and images shared inside one file are stored once, keeping the result close to the sum of the originals.",
      "Page ranges look like “1-3, 5, 8-” (8- means page 8 to the end) and keep your order: “5, 1-4” puts page five first, and a page can be repeated. A password-protected file is merged once you enter its password — without it the content is encrypted.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Сколько файлов и какого размера можно объединить?", a: "Искусственных лимитов нет — всё зависит от памяти устройства. На компьютере спокойно объединяются сотни страниц и файлы по 100–200 МБ, на телефоне разумно держаться в пределах 50–100 МБ." },
      { q: "Сохранятся ли закладки и поля форм?", a: "Страницы, текст, картинки и ссылки внутри страниц сохраняются. Оглавление (закладки) исходных файлов и интерактивные поля форм при объединении не переносятся — формы лучше заполнить и «сплющить» заранее." },
      { q: "Можно ли объединить PDF, защищённый паролем?", a: "Да, если вы знаете пароль: введите его в строке файла. Без пароля страницы зашифрованы, и получить их содержимое нельзя." },
      { q: "Как расставить страницы в нужном порядке?", a: "Укажите диапазон в поле «Страницы» (например, «3, 1-2») или включите «Упорядочить страницы» и перетащите миниатюры мышью; с клавиатуры — Alt и стрелки." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "How many files, and how large, can I merge?", a: "There are no artificial limits — it depends on your device's memory. A computer handles hundreds of pages and 100–200 MB files; on a phone, stay around 50–100 MB." },
      { q: "Are bookmarks and form fields kept?", a: "Pages, text, images and in-page links are kept. The outlines (bookmarks) of the source files and interactive form fields are not carried over — fill and flatten forms beforehand." },
      { q: "Can I merge a password-protected PDF?", a: "Yes, if you know the password: enter it in the file's row. Without it the pages are encrypted and their content can't be read." },
      { q: "How do I put pages in a specific order?", a: "Type a range in the “Pages” field (e.g. “3, 1-2”) or switch to “Arrange pages” and drag the thumbnails; on the keyboard use Alt plus the arrow keys." },
      PRIVACY_QA.en,
    ],
  ),
};

/* ───────────── split ───────────── */

const splitVariants = (): VariantDef[] => [
  {
    slug: "every-page",
    name: { ru: "Каждая страница отдельно", en: "Every page separately" },
    title: { ru: "Разделить PDF на отдельные страницы онлайн", en: "Split PDF into single pages online" },
    description: {
      ru: "Разрежьте PDF на отдельные страницы: из файла на 20 страниц получится 20 PDF по одной странице, скачать можно по одному или одним ZIP-архивом.",
      en: "Split a PDF into single pages: a 20-page file becomes 20 one-page PDFs, downloadable one by one or as a single ZIP archive.",
    },
    lead: { ru: "Каждая страница становится отдельным PDF-файлом.", en: "Every page becomes its own PDF file." },
    props: { mode: "each" },
    keywords: { ru: ["pdf по страницам", "разбить pdf на страницы"], en: ["pdf to single pages", "separate pdf pages"] },
    blocks: (l) => [
      {
        type: "facts",
        title: l === "ru" ? "Как это работает" : "How it works",
        rows:
          l === "ru"
            ? [
                ["Файлов на выходе", "столько же, сколько страниц"],
                ["Имена файлов", "отчёт-page-01.pdf, отчёт-page-02.pdf…"],
                ["Качество", "без пересжатия — страницы копируются как есть"],
                ["Скачивание", "по одному или одним ZIP"],
              ]
            : [
                ["Output files", "as many as there are pages"],
                ["File names", "report-page-01.pdf, report-page-02.pdf…"],
                ["Quality", "no re-compression — pages are copied as is"],
                ["Download", "one by one or as one ZIP"],
              ],
      },
    ],
    faq: faq(
      [
        { q: "Как скачать все страницы сразу?", a: "Нажмите «Скачать всё одним ZIP» — архив соберётся в браузере. Номера в именах дополнены нулями (01, 02…), поэтому файлы сортируются по порядку." },
        { q: "Станет ли файл больше?", a: "Каждая часть содержит нужные своей странице шрифты и картинки. Если страницы используют общий шрифт, суммарный размер частей бывает больше исходного — это нормально." },
      ],
      [
        { q: "How do I download all pages at once?", a: "Click “Download all as ZIP” — the archive is built in your browser. Numbers in the names are zero-padded (01, 02…), so the files sort in order." },
        { q: "Will the files get bigger?", a: "Each part carries the fonts and images its page needs. When pages share a font, the parts together can weigh more than the original — that is expected." },
      ],
    ),
  },
  {
    slug: "by-range",
    name: { ru: "По диапазонам", en: "By ranges" },
    title: { ru: "Разделить PDF по диапазонам страниц онлайн", en: "Split PDF by page ranges online" },
    description: {
      ru: "Разделите PDF по диапазонам: «1-3, 4-10, 11-» даст три файла. Диапазоны могут повторяться и идти в любом порядке, номера проверяются на ошибки сразу.",
      en: "Split a PDF by ranges: “1-3, 4-10, 11-” gives three files. Ranges may overlap and come in any order, and page numbers are checked as you type.",
    },
    lead: { ru: "Каждый диапазон через запятую становится отдельным PDF.", en: "Every comma-separated range becomes its own PDF." },
    props: { mode: "ranges" },
    keywords: { ru: ["разделить pdf на части", "вырезать страницы из pdf"], en: ["split pdf into parts", "pdf page range"] },
    blocks: (l) => [
      {
        type: "table",
        title: l === "ru" ? "Примеры для файла из 12 страниц" : "Examples for a 12-page file",
        head: l === "ru" ? ["Ввод", "Получится"] : ["Input", "Result"],
        rows:
          l === "ru"
            ? [
                ["1-3, 4-12", "2 файла: стр. 1–3 и 4–12"],
                ["1-6, 7-", "2 файла: стр. 1–6 и 7–12"],
                ["1, 2-5, 6-", "3 файла: стр. 1, 2–5 и 6–12"],
                ["5-1", "1 файл: страницы 5, 4, 3, 2, 1"],
                ["1-4, 3-6", "2 файла, страницы 3–4 есть в обоих"],
              ]
            : [
                ["1-3, 4-12", "2 files: pages 1–3 and 4–12"],
                ["1-6, 7-", "2 files: pages 1–6 and 7–12"],
                ["1, 2-5, 6-", "3 files: pages 1, 2–5 and 6–12"],
                ["5-1", "1 file: pages 5, 4, 3, 2, 1"],
                ["1-4, 3-6", "2 files, pages 3–4 appear in both"],
              ],
      },
    ],
    faq: faq(
      [
        { q: "Что значит «8-»?", a: "Открытый диапазон: с восьмой страницы до последней. Аналогично «-3» — с первой по третью." },
        { q: "Что если указать страницу, которой нет?", a: "Инструмент сразу подсветит ошибку и напишет, сколько страниц в файле, — ничего не будет молча пропущено." },
      ],
      [
        { q: "What does “8-” mean?", a: "An open range: from page eight to the last page. Likewise “-3” means pages one to three." },
        { q: "What if I type a page that doesn't exist?", a: "The tool highlights the error right away and tells you how many pages the file has — nothing is silently dropped." },
      ],
    ),
  },
  {
    slug: "every-2-pages",
    name: { ru: "Каждые 2 страницы", en: "Every 2 pages" },
    title: { ru: "Разделить PDF по 2 страницы онлайн", en: "Split PDF every 2 pages online" },
    description: {
      ru: "Разбейте PDF на файлы по 2 страницы: 10 страниц дают 5 файлов. Удобно для двусторонних сканов и анкет на двух листах. Число страниц в части можно поменять.",
      en: "Split a PDF into 2-page files: 10 pages give 5 files. Handy for double-sided scans and two-page forms. You can change the number of pages per part.",
    },
    lead: { ru: "Файл режется на части по две страницы подряд.", en: "The file is cut into parts of two consecutive pages." },
    props: { mode: "chunks", chunk: 2 },
    keywords: { ru: ["pdf по 2 страницы", "разбить pdf на равные части"], en: ["split pdf into equal parts"] },
    blocks: (l) => [
      {
        type: "table",
        title: l === "ru" ? "Сколько получится файлов" : "How many files you get",
        head: l === "ru" ? ["Страниц в PDF", "По 2 страницы", "По 5 страниц", "По 10 страниц"] : ["Pages in PDF", "2 per file", "5 per file", "10 per file"],
        rows: [10, 25, 50, 100, 250].map((n) => [String(n), String(Math.ceil(n / 2)), String(Math.ceil(n / 5)), String(Math.ceil(n / 10))]),
      },
    ],
    faq: faq(
      [
        { q: "Что будет с последней страницей при нечётном количестве?", a: "Она окажется в последнем файле одна: из 7 страниц получится три файла по 2 страницы и один с 7-й страницей." },
        { q: "Можно ли по 3 или по 10 страниц?", a: "Да: выберите «Каждые N страниц» и введите любое число." },
      ],
      [
        { q: "What happens to the last page with an odd count?", a: "It ends up alone in the last file: 7 pages give three 2-page files and one file with page 7." },
        { q: "Can I use 3 or 10 pages per file?", a: "Yes: choose “Every N pages” and type any number." },
      ],
    ),
  },
  {
    slug: "odd-pages",
    name: { ru: "Нечётные страницы", en: "Odd pages" },
    title: { ru: "Извлечь нечётные страницы PDF онлайн", en: "Extract odd pages from PDF online" },
    description: {
      ru: "Сохраните нечётные страницы PDF (1, 3, 5…) в отдельный файл — например, чтобы напечатать двустороннюю брошюру на принтере без дуплекса в два прохода.",
      en: "Save the odd pages of a PDF (1, 3, 5…) as a separate file — for example, to print double-sided on a printer without duplex in two passes.",
    },
    lead: { ru: "В новый файл попадут страницы 1, 3, 5 и так далее.", en: "Pages 1, 3, 5 and so on go into a new file." },
    props: { mode: "odd" },
    keywords: { ru: ["нечетные страницы pdf", "печать нечетных страниц"], en: ["odd pages pdf"] },
    blocks: (l) => [
      {
        type: "list",
        ordered: true,
        title: l === "ru" ? "Двусторонняя печать без дуплекса" : "Double-sided printing without duplex",
        items:
          l === "ru"
            ? ["Сохраните нечётные страницы и напечатайте их.", "Переверните стопку и положите обратно в лоток (как именно — зависит от принтера, проверьте на двух листах).", "Сохраните чётные страницы и напечатайте их на обороте."]
            : ["Save the odd pages and print them.", "Flip the stack and put it back in the tray (how exactly depends on the printer — test with two sheets).", "Save the even pages and print them on the back."],
      },
    ],
    faq: faq(
      [{ q: "А чётные страницы?", a: "Выберите в списке «Только чётные страницы» или откройте страницу «Чётные страницы PDF»." }],
      [{ q: "What about even pages?", a: "Choose “Even pages only” in the list or open the “Even pages” page." }],
    ),
  },
  {
    slug: "even-pages",
    name: { ru: "Чётные страницы", en: "Even pages" },
    title: { ru: "Извлечь чётные страницы PDF онлайн", en: "Extract even pages from PDF online" },
    description: {
      ru: "Сохраните чётные страницы PDF (2, 4, 6…) в отдельный файл: для печати оборотных сторон, разделения сканов «лицо — оборот» и проверки разворотов.",
      en: "Save the even pages of a PDF (2, 4, 6…) as a separate file: for printing back sides, separating front/back scans and checking spreads.",
    },
    lead: { ru: "В новый файл попадут страницы 2, 4, 6 и так далее.", en: "Pages 2, 4, 6 and so on go into a new file." },
    props: { mode: "even" },
    keywords: { ru: ["четные страницы pdf"], en: ["even pages pdf"] },
    blocks: (l) => [
      {
        type: "facts",
        rows:
          l === "ru"
            ? [
                ["Файл из 10 страниц", "страницы 2, 4, 6, 8, 10 — 5 страниц"],
                ["Файл из 1 страницы", "чётных страниц нет — сохранять нечего"],
                ["Порядок", "по возрастанию, без пересжатия"],
              ]
            : [
                ["A 10-page file", "pages 2, 4, 6, 8, 10 — 5 pages"],
                ["A 1-page file", "no even pages — nothing to save"],
                ["Order", "ascending, no re-compression"],
              ],
      },
    ],
    faq: faq(
      [{ q: "Как напечатать чётные страницы в обратном порядке?", a: "Сохраните чётные страницы, откройте результат в «Упорядочить страницы PDF» и нажмите «Обратный порядок»." }],
      [{ q: "How do I print even pages in reverse order?", a: "Save the even pages, open the result in “Organize PDF pages” and click “Reverse order”." }],
    ),
  },
];

export const splitTool: ToolDef = {
  slug: "split-pdf",
  seoAlt: { ru: ["разбить PDF на части", "разбить PDF"], en: ["split a PDF into parts", "split a PDF"] },
  component: "pdf/split",
  icon: "Scissors",
  popular: true,
  name: { ru: "Разделить PDF", en: "Split PDF" },
  title: { ru: "Разделить PDF онлайн — по страницам и диапазонам", en: "Split PDF online — by pages, ranges or every N pages" },
  h1: { ru: "Разделить PDF онлайн", en: "Split PDF online" },
  description: {
    ru: "Разделите PDF на файлы: каждая страница отдельно, диапазоны 1-3, 4-6, каждые N страниц, чётные или нечётные. Скачивайте части по одной или одним ZIP.",
    en: "Split a PDF into files: every page separately, ranges like 1-3, 4-6, every N pages, odd or even pages. Download the parts one by one or as a ZIP.",
  },
  lead: {
    ru: "Выберите способ разделения и сразу увидите, сколько файлов получится.",
    en: "Choose how to split and see right away how many files you'll get.",
  },
  keywords: { ru: ["разбить pdf", "разрезать pdf", "разделить pdf на страницы", "извлечь страницы"], en: ["pdf splitter", "separate pdf", "cut pdf"] },
  howTo: {
    ru: ["Откройте PDF-файл.", "Выберите способ: каждая страница, диапазоны, каждые N страниц, чётные, нечётные или вручную.", "Проверьте, сколько файлов получится.", "Нажмите «Разделить PDF» и скачайте части по одной или одним ZIP."],
    en: ["Open a PDF file.", "Choose a method: every page, ranges, every N pages, odd, even or by hand.", "Check how many files you'll get.", "Click “Split PDF” and download the parts one by one or as a ZIP."],
  },
  about: {
    ru: [
      "Части получаются копированием страниц без пересжатия, поэтому текст остаётся выделяемым, а картинки — в исходном качестве. Название и автор документа переносятся в каждую часть.",
      "Диапазоны пишутся так же, как в диалоге печати: «1-3, 5, 8-». Ошибка в номере страницы подсвечивается сразу, а не превращается в пустой файл.",
      PRIVACY.ru,
    ],
    en: [
      "Parts are made by copying pages without re-compression, so text stays selectable and images keep their quality. The document title and author are copied into every part.",
      "Ranges are written just like in a print dialog: “1-3, 5, 8-”. A wrong page number is flagged immediately instead of producing an empty file.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Как разделить PDF на две части?", a: "Выберите «По диапазонам» и введите, например, «1-10, 11-» — получится два файла: первые десять страниц и всё остальное." },
      { q: "Сохранятся ли ссылки и закладки?", a: "Ссылки внутри страниц сохраняются, если ведут на страницы той же части. Оглавление (закладки) исходного файла в части не переносится." },
      { q: "Можно ли разделить защищённый PDF?", a: "Да, после ввода пароля к файлу. Части сохраняются без пароля — при необходимости защитите их отдельно." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "How do I split a PDF in two?", a: "Choose “By page ranges” and type, say, “1-10, 11-” — you get two files: the first ten pages and the rest." },
      { q: "Are links and bookmarks kept?", a: "In-page links are kept when they point to pages of the same part. The source file's outline (bookmarks) is not copied into the parts." },
      { q: "Can I split a protected PDF?", a: "Yes, after entering its password. The parts are saved without a password — protect them separately if needed." },
      PRIVACY_QA.en,
    ],
  ),
  variants: { title: { ru: "Способы разделения", en: "Ways to split" }, list: splitVariants },
};

/* ───────────── organize / delete / extract ───────────── */

export const organizeTool: ToolDef = {
  slug: "organize-pdf",
  component: "pdf/pages",
  icon: "LayoutGrid",
  props: { mode: "organize" },
  name: { ru: "Упорядочить страницы PDF", en: "Organize PDF pages" },
  title: { ru: "Упорядочить страницы PDF онлайн — переставить, повернуть", en: "Organize PDF pages online — reorder, rotate, delete" },
  h1: { ru: "Упорядочить страницы PDF", en: "Organize PDF pages" },
  description: {
    ru: "Переставьте страницы PDF перетаскиванием миниатюр, поверните, удалите или продублируйте нужные, разверните порядок. Сохраняется без пересжатия, в браузере.",
    en: "Reorder PDF pages by dragging thumbnails, rotate, delete or duplicate them, reverse the order. Saved without re-compression, right in your browser.",
  },
  lead: { ru: "Перетаскивайте миниатюры страниц — порядок в файле будет таким же.", en: "Drag page thumbnails — the file will follow the same order." },
  keywords: { ru: ["поменять страницы местами pdf", "переставить страницы pdf", "изменить порядок страниц pdf"], en: ["rearrange pdf pages", "reorder pdf", "sort pdf pages"] },
  howTo: {
    ru: ["Откройте PDF — появятся миниатюры всех страниц.", "Перетащите страницы мышью или выберите их и двигайте Alt+стрелками.", "Поверните, удалите или продублируйте выбранные страницы кнопками над миниатюрами.", "Нажмите «Сохранить PDF»."],
    en: ["Open a PDF — thumbnails of all pages appear.", "Drag pages with the mouse, or select them and move with Alt+arrow keys.", "Rotate, delete or duplicate the selected pages with the buttons above the thumbnails.", "Click “Save PDF”."],
  },
  about: {
    ru: [
      "Миниатюры рисуются по мере прокрутки, поэтому даже документ на несколько сотен страниц открывается быстро. Выбор работает как в проводнике: щелчок — одна страница, Shift+щелчок — диапазон.",
      "Страницы не перерисовываются и не пересжимаются: поворот меняет только отметку ориентации, а дубликат ссылается на то же содержимое и почти не увеличивает файл.",
      PRIVACY.ru,
    ],
    en: [
      "Thumbnails render as you scroll, so even a document with several hundred pages opens quickly. Selection works like a file manager: click for one page, Shift+click for a range.",
      "Pages are never redrawn or re-compressed: rotation only changes the orientation flag, and a duplicate refers to the same content, barely growing the file.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Как поменять две страницы местами?", a: "Перетащите одну страницу на место другой или выделите её и нажимайте Alt+← / Alt+→." },
      { q: "Как развернуть порядок страниц?", a: "Нажмите «Обратный порядок» над миниатюрами — последняя страница станет первой." },
      { q: "Сохранятся ли закладки?", a: "Страницы, текст и ссылки внутри страниц сохраняются, название и автор — тоже. Оглавление (закладки) при перестановке не переносится, потому что ссылается на старый порядок." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "How do I swap two pages?", a: "Drag one page onto the other's place, or select it and press Alt+← / Alt+→." },
      { q: "How do I reverse the page order?", a: "Click “Reverse order” above the thumbnails — the last page becomes the first." },
      { q: "Are bookmarks kept?", a: "Pages, text and in-page links are kept, and so are the title and author. The outline (bookmarks) is not carried over because it points to the old order." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["merge-pdf", "rotate-pdf", "split-pdf"],
};

export const deleteTool: ToolDef = {
  slug: "delete-pdf-pages",
  component: "pdf/pages",
  icon: "Trash2",
  props: { mode: "delete" },
  name: { ru: "Удалить страницы из PDF", en: "Delete PDF pages" },
  title: { ru: "Удалить страницы из PDF онлайн", en: "Delete pages from PDF online" },
  h1: { ru: "Удалить страницы из PDF", en: "Delete pages from a PDF" },
  description: {
    ru: "Удалите лишние страницы из PDF: отметьте их на миниатюрах или введите номера вида 2, 5-7. Остальные страницы сохраняются без изменений и пересжатия.",
    en: "Remove unwanted pages from a PDF: mark them on the thumbnails or type numbers like 2, 5-7. The remaining pages are kept unchanged, without re-compression.",
  },
  lead: { ru: "Отметьте ненужные страницы — в новом файле останутся все остальные.", en: "Mark the pages you don't need — the new file keeps all the others." },
  keywords: { ru: ["вырезать страницы из pdf", "убрать страницу из pdf", "удалить лист из pdf"], en: ["remove pages from pdf", "pdf page remover"] },
  howTo: {
    ru: ["Откройте PDF.", "Нажмите на страницы, которые нужно удалить, или впишите их номера: «2, 5-7».", "Проверьте, сколько страниц останется.", "Нажмите «Удалить» и скачайте файл."],
    en: ["Open a PDF.", "Click the pages to remove, or type their numbers: “2, 5-7”.", "Check how many pages will remain.", "Click “Delete” and download the file."],
  },
  about: {
    ru: [
      "Отмеченные страницы подсвечиваются красным, а поле с номерами и миниатюры синхронизированы: можно начать с одного и закончить другим. Удалить все страницы нельзя — PDF без страниц не открывается.",
      "Оставшиеся страницы копируются как есть, вместе с их шрифтами и картинками; всё, что нужно только удалённым страницам, в файл не попадает, поэтому он становится меньше.",
      PRIVACY.ru,
    ],
    en: [
      "Marked pages are highlighted in red, and the number field and thumbnails stay in sync: start with one and finish with the other. You can't delete every page — a PDF without pages won't open.",
      "Remaining pages are copied as is, with their fonts and images; anything used only by the deleted pages is left out, so the file gets smaller.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Как удалить пустые страницы?", a: "Найдите их на миниатюрах и отметьте щелчком — пустые страницы хорошо видны. Автоматического определения «почти пустых» страниц здесь нет." },
      { q: "Уменьшится ли файл?", a: "Да, если удалённые страницы содержали картинки или шрифты, которые больше нигде не используются." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "How do I remove blank pages?", a: "Spot them on the thumbnails and click to mark them — blank pages are easy to see. There is no automatic “nearly blank” detection here." },
      { q: "Will the file get smaller?", a: "Yes, if the deleted pages had images or fonts used nowhere else." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["split-pdf", "compress-pdf", "merge-pdf"],
};

export const extractTool: ToolDef = {
  slug: "extract-pdf-pages",
  component: "pdf/pages",
  icon: "FileOutput",
  props: { mode: "extract" },
  name: { ru: "Извлечь страницы из PDF", en: "Extract PDF pages" },
  title: { ru: "Извлечь страницы из PDF онлайн — сохранить нужные", en: "Extract pages from PDF online — save the ones you need" },
  h1: { ru: "Извлечь страницы из PDF", en: "Extract pages from a PDF" },
  description: {
    ru: "Сохраните выбранные страницы PDF в новый файл: отметьте миниатюры или введите номера, например 1, 4-6. Можно получить один PDF или каждую страницу отдельно.",
    en: "Save chosen PDF pages to a new file: click thumbnails or type numbers such as 1, 4-6. Get a single PDF or every page as its own file.",
  },
  lead: { ru: "Выберите страницы — они сохранятся в новый PDF в указанном порядке.", en: "Choose pages — they're saved to a new PDF in the order you give." },
  keywords: { ru: ["сохранить страницу из pdf", "вытащить страницы из pdf", "копировать страницы pdf"], en: ["save pdf pages", "pdf page extractor"] },
  howTo: {
    ru: ["Откройте PDF.", "Нажмите на нужные страницы или впишите номера: «1, 4-6».", "При желании включите «Каждую страницу отдельным файлом».", "Нажмите «Извлечь» и скачайте результат."],
    en: ["Open a PDF.", "Click the pages you need or type their numbers: “1, 4-6”.", "Optionally turn on “Each page as a separate file”.", "Click “Extract” and download the result."],
  },
  about: {
    ru: [
      "Если номера введены вручную, их порядок сохраняется: «6, 1-3» поставит шестую страницу первой. При выборе щелчками страницы идут по возрастанию.",
      "Страницы копируются без пересжатия, вместе с их шрифтами и картинками, а название и автор документа переносятся в новый файл.",
      PRIVACY.ru,
    ],
    en: [
      "Numbers you type keep their order: “6, 1-3” puts page six first. When you pick by clicking, pages go in ascending order.",
      "Pages are copied without re-compression, with their fonts and images, and the document title and author are carried into the new file.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Чем это отличается от «Разделить PDF»?", a: "Здесь вы получаете один файл из выбранных страниц (или по файлу на страницу), а разделение режет весь документ на части по правилу." },
      { q: "Изменится ли исходный файл?", a: "Нет, исходный файл не меняется: создаётся новый PDF, который вы скачиваете." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "How is this different from “Split PDF”?", a: "Here you get one file with the chosen pages (or one file per page), while splitting cuts the whole document into parts by a rule." },
      { q: "Does the original file change?", a: "No, the original is untouched: a new PDF is created for you to download." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["split-pdf", "merge-pdf", "pdf-to-jpg"],
};

/* ───────────── rotate ───────────── */

const rotateVariant = (deg: 90 | 180 | 270): VariantDef => {
  const ru = { 90: "на 90° по часовой стрелке", 180: "на 180° (вверх ногами)", 270: "на 90° против часовой стрелки" }[deg];
  const en = { 90: "90° clockwise", 180: "180° (upside down)", 270: "90° counter-clockwise" }[deg];
  const use = {
    90: { ru: "лист отсканирован боком, альбомная таблица читается снизу вверх", en: "a sheet scanned sideways, a landscape table reading bottom to top" },
    180: { ru: "страница отсканирована вверх ногами, лист вставлен в сканер не той стороной", en: "a page scanned upside down, a sheet fed into the scanner the wrong way" },
    270: { ru: "альбомная страница повёрнута не в ту сторону, фото с телефона легло набок", en: "a landscape page turned the wrong way, a phone photo lying on its side" },
  }[deg];
  return {
    slug: `${deg}-degrees`,
    name: { ru: deg === 270 ? "Против часовой (270°)" : `${deg}°`, en: deg === 270 ? "Counter-clockwise (270°)" : `${deg}°` },
    title: {
      ru: deg === 270 ? "Повернуть PDF против часовой стрелки онлайн" : `Повернуть PDF на ${deg} градусов онлайн`,
      en: deg === 270 ? "Rotate PDF counter-clockwise online (270°)" : `Rotate PDF ${deg} degrees online`,
    },
    description: {
      ru: `Поверните все или выбранные страницы PDF ${ru}. Меняется только ориентация: текст, картинки, закладки и формы остаются как были.`,
      en: `Rotate all or selected PDF pages ${en}. Only the orientation changes — text, images and quality stay the same, bookmarks and forms are kept.`,
    },
    lead: { ru: `Страницы повернутся ${ru}; можно выбрать только некоторые.`, en: `Pages turn ${en}; you can pick just some of them.` },
    props: { angle: deg },
    blocks: (l) => [
      {
        type: "facts",
        rows:
          l === "ru"
            ? [
                ["Поворот", ru],
                ["Как записывается", `к значению /Rotate страницы добавляется ${deg}° (например, 0 → ${deg}, ${deg === 90 ? "90 → 180" : deg === 180 ? "90 → 270" : "90 → 0"})`],
                ["Когда нужно", use.ru],
                ["Что сохраняется", "текст, картинки, ссылки, закладки, поля форм, метаданные"],
              ]
            : [
                ["Rotation", en],
                ["How it's stored", `${deg}° is added to the page's /Rotate value (e.g. 0 → ${deg}, ${deg === 90 ? "90 → 180" : deg === 180 ? "90 → 270" : "90 → 0"})`],
                ["When you need it", use.en],
                ["What's kept", "text, images, links, bookmarks, form fields, metadata"],
              ],
      },
    ],
    faq: faq(
      [
        { q: "Повернётся ли файл «навсегда»?", a: "Да: поворот записывается в сам PDF, и страницы будут открываться повёрнутыми в любой программе — Acrobat, браузере, на телефоне." },
        { q: "Как повернуть только одну страницу?", a: "Нажмите на нужные миниатюры, чтобы выбрать их: поворот применится только к ним. Если ничего не выбрано — ко всем страницам." },
      ],
      [
        { q: "Is the rotation permanent?", a: "Yes: it's written into the PDF itself, so pages open rotated in any app — Acrobat, a browser, a phone." },
        { q: "How do I rotate just one page?", a: "Click the thumbnails to select them: only those rotate. With nothing selected, every page rotates." },
      ],
    ),
  };
};

export const rotateTool: ToolDef = {
  slug: "rotate-pdf",
  seoAlt: { ru: ["перевернуть страницы PDF", "перевернуть PDF", "онлайн"], en: ["turn PDF pages", "turn PDF"] },
  component: "pdf/pages",
  icon: "RotateCw",
  popular: true,
  props: { mode: "rotate", angle: 90 },
  name: { ru: "Повернуть PDF", en: "Rotate PDF" },
  title: { ru: "Повернуть PDF онлайн — все страницы или выбранные", en: "Rotate PDF online — all pages or selected ones" },
  h1: { ru: "Повернуть PDF онлайн", en: "Rotate PDF online" },
  description: {
    ru: "Поверните страницы PDF на 90° или 180° и сохраните: все сразу или только выбранные. Поворот записывается в файл, качество и закладки не меняются.",
    en: "Rotate PDF pages by 90° or 180° and save: all at once or only selected ones. The rotation is stored in the file; quality and bookmarks stay intact.",
  },
  lead: { ru: "Выберите угол и страницы — повёрнутый PDF сохранится за секунду.", en: "Pick an angle and pages — the rotated PDF is saved in a second." },
  keywords: { ru: ["перевернуть pdf", "развернуть pdf", "повернуть страницу pdf и сохранить"], en: ["turn pdf", "flip pdf pages", "rotate pdf and save"] },
  howTo: {
    ru: ["Откройте PDF.", "Выберите угол: 90° по часовой, 180° или 90° против часовой.", "Чтобы повернуть не всё, нажмите на нужные страницы.", "Нажмите «Повернуть PDF» и скачайте файл."],
    en: ["Open a PDF.", "Choose an angle: 90° clockwise, 180° or 90° counter-clockwise.", "To rotate only some pages, click them.", "Click “Rotate PDF” and download the file."],
  },
  about: {
    ru: [
      "Поворот меняет у страницы только поле /Rotate — то же, что делает Acrobat. Содержимое не перерисовывается и не пересжимается, поэтому операция мгновенная даже для сотен страниц.",
      "Файл изменяется на месте: закладки, ссылки, поля форм и метаданные остаются. Миниатюры сразу показывают, как будут выглядеть страницы после поворота.",
      PRIVACY.ru,
    ],
    en: [
      "Rotation only changes the page's /Rotate entry — exactly what Acrobat does. Content is not redrawn or re-compressed, so it's instant even for hundreds of pages.",
      "The file is edited in place: bookmarks, links, form fields and metadata stay. Thumbnails show right away how the pages will look after rotating.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Почему в просмотрщике PDF поворот не сохраняется?", a: "Многие программы поворачивают страницу только на экране. Здесь поворот записывается в файл, и он сохраняется везде." },
      { q: "Можно ли повернуть страницы в разные стороны?", a: "Да: поверните одни страницы, скачайте файл, откройте его снова и поверните другие. Для точной настройки каждой страницы удобнее «Упорядочить страницы PDF»." },
      { q: "Станет ли файл хуже?", a: "Нет. Поворот не трогает содержимое страниц, качество и размер остаются прежними." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Why doesn't my PDF viewer keep the rotation?", a: "Many viewers only rotate the page on screen. Here the rotation is written into the file, so it sticks everywhere." },
      { q: "Can pages be rotated in different directions?", a: "Yes: rotate some pages, download, reopen and rotate others. For per-page control “Organize PDF pages” is handier." },
      { q: "Will the quality drop?", a: "No. Rotation doesn't touch page content, so quality and size stay the same." },
      PRIVACY_QA.en,
    ],
  ),
  variants: { title: { ru: "Угол поворота", en: "Rotation angle" }, list: () => [rotateVariant(90), rotateVariant(180), rotateVariant(270)] },
};
