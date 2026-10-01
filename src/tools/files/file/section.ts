import type { Block, ToolDef } from "@/registry/types";
import { defineToolSection } from "@/registry/tool-section";
import { encryptFileTool, encryptTextTool } from "./content/crypt";

const local = (locale: "ru" | "en"): Block => ({
  type: "text",
  title: locale === "ru" ? "Файлы не покидают устройство" : "Files never leave your device",
  paragraphs: [
    locale === "ru"
      ? "Всё выполняется в браузере: файлы читаются с диска прямо в вкладку и никуда не отправляются. Поэтому инструмент работает и с конфиденциальными документами, а ограничение по размеру задаёт только память устройства."
      : "Everything runs in the browser: files are read from disk straight into the tab and sent nowhere. That makes the tool safe for confidential documents, and the only size limit is your device's memory.",
  ],
});

const tools: ToolDef[] = [
  {
    slug: "create-zip",
    component: "file/zip",
    icon: "FileArchive",
    popular: true,
    name: { ru: "Создать ZIP-архив", en: "Create ZIP" },
    title: { ru: "Создать ZIP-архив онлайн — заархивировать файлы и папки", en: "Create a ZIP file online — zip files and folders" },
    h1: { ru: "Создать ZIP-архив онлайн", en: "Create a ZIP file online" },
    description: {
      ru: "Заархивируйте файлы и целые папки в ZIP прямо в браузере: четыре уровня сжатия, сохранение структуры папок и дат, имена на кириллице. Без загрузки на сервер.",
      en: "Zip files and whole folders in your browser: four compression levels, folder structure and dates kept, non-Latin file names supported. Nothing is uploaded.",
    },
    lead: { ru: "Соберите файлы и папки в один ZIP-архив — например, чтобы отправить их одним вложением.", en: "Pack files and folders into one ZIP — for example, to send them as a single attachment." },
    keywords: { ru: ["создать zip архив", "заархивировать файлы", "сжать файлы в zip", "zip онлайн"], en: ["create zip file", "zip files online", "compress files to zip", "make a zip"] },
    howTo: {
      ru: ["Перетащите файлы или папки в окно или нажмите «Добавить папку».", "Проверьте список и уберите лишнее.", "Задайте имя архива и уровень сжатия.", "Нажмите «Создать ZIP» и скачайте архив."],
      en: ["Drop files or folders onto the page or click “Add folder”.", "Check the list and remove anything extra.", "Set the archive name and compression level.", "Click Create ZIP and download the archive."],
    },
    about: {
      ru: [
        "Архив собирается библиотекой JSZip в фоновом потоке, поэтому страница не зависает даже на больших наборах. Сжатие — стандартный Deflate: «Быстрое» соответствует уровню 1, «Обычное» — 6, «Максимальное» — 9.",
        "Имена файлов сохраняются в UTF-8 с соответствующим флагом, поэтому кириллица и казахские буквы правильно отображаются в Windows 10 и 11, macOS и Linux. Фото, видео и музыка почти не сжимаются — для них быстрее всего режим «Без сжатия».",
      ],
      en: [
        "The archive is built by the JSZip library on a background thread, so the page stays responsive even with large sets. Compression is standard Deflate: Fast is level 1, Normal 6 and Maximum 9.",
        "File names are stored as UTF-8 with the matching flag, so non-Latin names display correctly on Windows 10 and 11, macOS and Linux. Photos, video and music barely compress — “None” is fastest for them.",
      ],
    },
    faq: {
      ru: [
        { q: "Можно ли поставить пароль на архив?", a: "Сам ZIP-архив создаётся без пароля, но готовый архив можно зашифровать паролем (AES-256) на странице «Зашифровать файл паролем»." },
        { q: "Сохранится ли структура папок?", a: "Да: при добавлении папки пути внутри неё сохраняются, и архив распакуется с теми же папками." },
        { q: "Насколько уменьшится размер?", a: "Текст, таблицы и документы сжимаются в 2–10 раз. JPEG, MP4, MP3 и другие уже сжатые форматы уменьшатся на единицы процентов." },
      ],
      en: [
        { q: "Can I password-protect the archive?", a: "The ZIP itself has no password, but you can encrypt the finished archive with a password (AES-256) on the Encrypt a file page." },
        { q: "Is the folder structure kept?", a: "Yes: when you add a folder, the paths inside it are kept and the archive extracts with the same folders." },
        { q: "How much smaller will it be?", a: "Text, spreadsheets and documents shrink 2–10 times. JPEG, MP4, MP3 and other already compressed formats shrink by only a few percent." },
      ],
    },
    related: ["unzip", "batch-rename-files", "split-file", "file-type-checker"],
    blocks: (locale) => [local(locale)],
  },
  {
    slug: "unzip",
    component: "file/unzip",
    icon: "FolderOpen",
    popular: true,
    name: { ru: "Распаковать ZIP", en: "Unzip files" },
    title: { ru: "Распаковать ZIP онлайн — открыть архив в браузере", en: "Unzip online — open a ZIP archive in your browser" },
    h1: { ru: "Распаковать ZIP-архив онлайн", en: "Unzip files online" },
    description: {
      ru: "Откройте ZIP в браузере: список файлов, просмотр текста и картинок, скачивание по одному или всё в папку. Правильно читает кириллицу из архивов Windows.",
      en: "Open a ZIP in your browser: file list, text and image previews, download files one by one or extract all to a folder. Reads Cyrillic names from Windows ZIPs.",
    },
    lead: { ru: "Посмотрите, что внутри ZIP, и достаньте нужные файлы — без архиватора.", en: "See what's inside a ZIP and take out the files you need — no archiver required." },
    keywords: { ru: ["распаковать zip", "открыть zip онлайн", "разархивировать", "извлечь файлы из архива"], en: ["unzip online", "open zip file", "extract zip", "zip extractor"] },
    howTo: {
      ru: ["Перетащите ZIP-архив в окно.", "Нажмите на файл в списке, чтобы посмотреть его и скачать.", "Или нажмите «Распаковать всё в папку» и выберите папку.", "Если имена отображаются иероглифами, смените кодировку."],
      en: ["Drop a ZIP archive onto the page.", "Click a file in the list to preview and download it.", "Or click “Extract all to a folder” and pick a folder.", "If names look garbled, change the encoding."],
    },
    about: {
      ru: [
        "Встроенный архиватор Windows на русской системе записывает имена файлов в кодировке CP866 без флага UTF-8, и многие программы показывают вместо них «кракозябры». В автоматическом режиме имена сначала проверяются как UTF-8, а при ошибке читаются как CP866.",
        "«Распаковать всё в папку» работает в Chrome и Edge: браузер попросит выбрать папку и запишет в неё файлы с подпапками. В Firefox и Safari файлы скачиваются по одному.",
      ],
      en: [
        "On Russian-language Windows the built-in archiver stores file names in CP866 without the UTF-8 flag, and many programs show them garbled. In automatic mode names are tried as UTF-8 first and read as CP866 if that fails.",
        "“Extract all to a folder” works in Chrome and Edge: the browser asks for a folder and writes the files with subfolders into it. Firefox and Safari download files one by one.",
      ],
    },
    faq: {
      ru: [
        { q: "Можно ли открыть RAR или 7z?", a: "Нет, распаковываются только ZIP и форматы на его основе (DOCX, XLSX, EPUB, JAR, APK). RAR и 7z откройте в 7-Zip." },
        { q: "Открывается ли архив с паролем?", a: "Нет, зашифрованные ZIP не поддерживаются — инструмент сообщит об этом." },
        { q: "Как посмотреть содержимое DOCX или EPUB?", a: "Перетащите файл как есть: внутри будут XML-файлы, стили и картинки — их можно посмотреть и скачать." },
      ],
      en: [
        { q: "Can I open RAR or 7z?", a: "No, only ZIP and ZIP-based formats (DOCX, XLSX, EPUB, JAR, APK). Open RAR and 7z with 7-Zip." },
        { q: "Does it open password-protected archives?", a: "No, encrypted ZIPs aren't supported — the tool tells you so." },
        { q: "How do I look inside a DOCX or EPUB?", a: "Drop the file as it is: you'll see XML files, styles and images you can preview and download." },
      ],
    },
    related: ["create-zip", "file-type-checker", "join-files", "batch-rename-files"],
    blocks: (locale) => [local(locale)],
  },
  {
    slug: "file-type-checker",
    component: "file/info",
    icon: "FileSearch",
    name: { ru: "Определить тип файла", en: "File type checker" },
    title: { ru: "Определить тип файла онлайн — по сигнатуре, не по расширению", en: "File type checker online — by signature, not extension" },
    h1: { ru: "Определить тип файла", en: "Check a file's real type" },
    description: {
      ru: "Настоящий формат файла по первым байтам (сигнатуре): более 100 форматов, проверка расширения, размер и дата, размеры картинок, длительность, MD5 и SHA-256.",
      en: "Find a file's real format from its first bytes (magic signature): 100+ formats, extension check, size, date, image size, duration, MD5 and SHA-256.",
    },
    lead: { ru: "Проверьте, что это за файл на самом деле, — даже если расширение неправильное или его нет.", en: "Find out what a file really is — even if the extension is wrong or missing." },
    keywords: { ru: ["определить тип файла", "узнать формат файла", "чем открыть файл", "сигнатура файла"], en: ["file type checker", "identify file type", "what file is this", "magic bytes"] },
    howTo: {
      ru: ["Перетащите один или несколько файлов.", "Посмотрите определённый формат и совпадает ли он с расширением.", "При необходимости откройте первые байты в шестнадцатеричном виде.", "Нажмите «Посчитать MD5, SHA-1 и SHA-256» для контрольных сумм."],
      en: ["Drop one or more files.", "See the detected format and whether it matches the extension.", "Open the first bytes in hex if needed.", "Click “Calculate MD5, SHA-1 and SHA-256” for checksums."],
    },
    about: {
      ru: [
        "Почти у каждого формата в начале файла есть сигнатура — «магические байты»: у PNG это 89 50 4E 47, у PDF — %PDF, у ZIP — PK. Инструмент сверяет их с таблицей, заглядывает внутрь контейнеров (MP4 или HEIC, Word или ZIP) и отличает, например, AAC от MP3 и анимированный GIF от статичного.",
        "Расширение — лишь часть имени, и его легко изменить. Если оно не совпадает с содержимым, инструмент предупредит и подскажет правильное: так находят «картинки», которые на деле оказываются программами.",
      ],
      en: [
        "Almost every format starts with a signature — “magic bytes”: PNG starts with 89 50 4E 47, PDF with %PDF, ZIP with PK. The tool matches them against a table, looks inside containers (MP4 vs HEIC, Word vs ZIP) and tells AAC from MP3 or an animated GIF from a still one.",
        "An extension is just part of the name and easy to change. If it doesn't match the content, the tool warns you and suggests the right one — that's how “pictures” that are really programs get caught.",
      ],
    },
    faq: {
      ru: [
        { q: "Почему файл определился как ZIP, хотя это документ Word?", a: "DOCX, XLSX и PPTX — это ZIP-архивы с XML внутри. Инструмент распознаёт их по содержимому архива; если признаков нет, покажет общий «ZIP-архив»." },
        { q: "Можно ли узнать дату создания файла?", a: "Нет: браузеры сообщают только дату последнего изменения. Дату съёмки фото можно найти в EXIF-данных." },
        { q: "Что значит «неизвестный формат»?", a: "Сигнатура не найдена: это могут быть зашифрованные или «сырые» данные, редкий формат или простой текст в необычной кодировке." },
      ],
      en: [
        { q: "Why was a Word document detected as ZIP?", a: "DOCX, XLSX and PPTX are ZIP archives with XML inside. The tool recognises them by the archive contents; without those markers it shows a generic ZIP." },
        { q: "Can I see when a file was created?", a: "No: browsers only report the last modification date. A photo's capture date can be found in its EXIF data." },
        { q: "What does “unknown format” mean?", a: "No signature was found: it may be encrypted or raw data, a rare format, or plain text in an unusual encoding." },
      ],
    },
    related: ["file-checksum", "file-to-base64", "image-converter", "unzip"],
    blocks: (locale) => [local(locale)],
  },
  {
    slug: "batch-rename-files",
    component: "file/rename",
    icon: "PenLine",
    name: { ru: "Переименовать файлы", en: "Batch rename files" },
    title: { ru: "Массовое переименование файлов онлайн — по шаблону", en: "Batch rename files online — by pattern" },
    h1: { ru: "Переименовать файлы пачкой", en: "Batch rename files" },
    description: {
      ru: "Переименуйте много файлов сразу: шаблон с номером и датой, поиск и замена (и regex), регистр, транслитерация кириллицы и пробелы. Предпросмотр и скачивание ZIP.",
      en: "Rename many files at once: pattern with numbers and dates, find and replace (regex too), case, Cyrillic transliteration and spaces. Live preview, ZIP download.",
    },
    lead: { ru: "Приведите имена файлов к порядку — например, «Отпуск 001.jpg», «Отпуск 002.jpg»…", en: "Tidy up file names — for example “Holiday 001.jpg”, “Holiday 002.jpg”…" },
    keywords: { ru: ["переименовать файлы", "массовое переименование", "пакетное переименование", "транслитерация имён файлов"], en: ["batch rename files", "bulk rename", "rename multiple files", "rename files online"] },
    howTo: {
      ru: ["Добавьте файлы.", "Задайте шаблон, например «Отпуск {n:3}».", "При необходимости настройте замену, регистр, транслитерацию и порядок.", "Проверьте предпросмотр и скачайте ZIP с новыми именами."],
      en: ["Add files.", "Set a pattern such as “Holiday {n:3}”.", "Adjust replacements, case, transliteration and order if needed.", "Check the preview and download the ZIP with new names."],
    },
    about: {
      ru: [
        "Порядок операций: сначала поиск и замена в исходном имени, затем шаблон, транслитерация, пробелы и регистр. Расширение сохраняется автоматически. Транслитерация понимает русский и казахский алфавиты: «Қазақстан» → «Qazaqstan».",
        "Инструмент заранее проверяет имена: повторы (без учёта регистра, как в Windows и macOS), недопустимые символы \\ / : * ? \" < > | и зарезервированные имена вроде CON и NUL. Скачать архив можно, только когда ошибок нет.",
      ],
      en: [
        "Order of operations: find and replace in the original name first, then the pattern, transliteration, spaces and case. The extension is kept automatically. Transliteration handles Russian and Kazakh: “Қазақстан” → “Qazaqstan”.",
        "Names are checked up front: duplicates (case-insensitive, like Windows and macOS), illegal characters \\ / : * ? \" < > | and reserved names such as CON and NUL. The archive can be downloaded only when there are no errors.",
      ],
    },
    faq: {
      ru: [
        { q: "Почему нельзя переименовать файлы прямо в папке?", a: "Браузер не даёт сайтам менять файлы на диске. Поэтому переименованные копии скачиваются в ZIP-архиве без сжатия, его остаётся распаковать." },
        { q: "Как пронумеровать по дате съёмки?", a: "Выберите порядок «по дате» — нумерация пойдёт по дате изменения файла, которая у фото с камеры обычно совпадает с датой съёмки." },
        { q: "Как использовать регулярные выражения?", a: "Включите «Регулярное выражение»: например, найти ^IMG_(\\d+)$ и заменить на photo-$1 превратит IMG_0042 в photo-0042." },
      ],
      en: [
        { q: "Why can't it rename files in place?", a: "Browsers don't let websites modify files on disk, so the renamed copies are downloaded in an uncompressed ZIP for you to extract." },
        { q: "How do I number photos by date?", a: "Choose the “by date” order — numbering follows the file modification date, which for camera photos usually matches when they were taken." },
        { q: "How do regular expressions work here?", a: "Turn on “Regular expression”: for example, finding ^IMG_(\\d+)$ and replacing with photo-$1 turns IMG_0042 into photo-0042." },
      ],
    },
    related: ["create-zip", "file-type-checker", "unzip", "split-file"],
    blocks: (locale) => [local(locale)],
  },
  {
    slug: "split-file",
    component: "file/split",
    icon: "Split",
    name: { ru: "Разделить файл на части", en: "Split file" },
    title: { ru: "Разделить файл на части онлайн — .001, .002…", en: "Split a file into parts online — .001, .002…" },
    h1: { ru: "Разделить файл на части", en: "Split a file into parts" },
    description: {
      ru: "Разрежьте большой файл на части нужного размера или на N равных частей в формате 7-Zip (.001, .002…). Мгновенно даже для гигабайтных файлов, без загрузки.",
      en: "Cut a large file into parts of a set size or into N equal parts, 7-Zip style (.001, .002…). Instant even for multi-gigabyte files, with no uploading.",
    },
    lead: { ru: "Разделите файл, который не влезает в лимит почты, флешки или мессенджера.", en: "Split a file that exceeds an email, USB drive or messenger limit." },
    keywords: { ru: ["разделить файл на части", "разрезать файл", "разбить большой файл", "split файл"], en: ["split file", "split large file", "file splitter", "cut file into parts"] },
    howTo: {
      ru: ["Выберите файл.", "Задайте размер части (например, 25 МБ) или количество частей.", "Нажмите «Скачать все части».", "Соберите части обратно инструментом «Склеить файлы», 7-Zip или командой copy /b."],
      en: ["Choose a file.", "Set the part size (e.g. 25 MB) or the number of parts.", "Click “Download all parts”.", "Put them back together with “Join files”, 7-Zip or copy /b."],
    },
    about: {
      ru: [
        "Файл режется по байтам без чтения в память (Blob.slice), поэтому деление мгновенное даже для файлов в несколько гигабайт. Части называются как в 7-Zip: имя.расширение.001, .002 и т. д.",
        "Сами по себе части не открываются — это куски одного файла. Чтобы получить исходник, их нужно соединить в правильном порядке; результат совпадёт с оригиналом бит в бит.",
      ],
      en: [
        "The file is cut by bytes without being read into memory (Blob.slice), so splitting is instant even for multi-gigabyte files. Parts are named like 7-Zip volumes: name.ext.001, .002 and so on.",
        "Parts don't open on their own — they're pieces of one file. Join them in order to get the original back, bit for bit.",
      ],
    },
    faq: {
      ru: [
        { q: "Как собрать части на компьютере получателя?", a: "На этом сайте — «Склеить файлы». В Windows: copy /b файл.001+файл.002 файл. В macOS и Linux: cat файл.0* > файл. Или откройте .001 в 7-Zip." },
        { q: "Чем это лучше архива в несколько томов?", a: "Не нужен архиватор ни вам, ни получателю: части склеиваются любым способом. Но и сжатия нет — если оно нужно, используйте 7-Zip." },
        { q: "Какой размер части выбрать?", a: "На 1–2 % меньше лимита: например, 24 МБ для писем с ограничением 25 МБ, так как почта кодирует вложения и немного увеличивает их." },
      ],
      en: [
        { q: "How does the recipient put the parts together?", a: "With “Join files” on this site. On Windows: copy /b file.001+file.002 file. On macOS and Linux: cat file.0* > file. Or open the .001 in 7-Zip." },
        { q: "Why not a multi-volume archive?", a: "Neither you nor the recipient needs an archiver: the parts join any way. But there's no compression — use 7-Zip if you need it." },
        { q: "What part size should I choose?", a: "A little below the limit — e.g. 24 MB for 25 MB email attachments, since mail encoding makes attachments slightly larger." },
      ],
    },
    related: ["join-files", "create-zip", "file-type-checker", "compress-video"],
    blocks: (locale) => [local(locale)],
  },
  {
    slug: "join-files",
    component: "file/join",
    icon: "Merge",
    name: { ru: "Склеить файлы", en: "Join files" },
    title: { ru: "Склеить файлы онлайн — собрать части .001, .002", en: "Join files online — merge .001, .002 parts" },
    h1: { ru: "Склеить части файла", en: "Join file parts" },
    description: {
      ru: "Соедините части файла (.001, .002, .part1…) обратно в один: автоматическая сортировка по номеру, проверка пропущенных частей, сборка без загрузки на сервер.",
      en: "Join file parts (.001, .002, .part1…) back into one file: automatic sorting by number, missing-part check, assembled without uploading anything.",
    },
    lead: { ru: "Соберите файл, разрезанный на части, — порядок определится по номерам.", en: "Reassemble a file that was split into parts — the order comes from the numbers." },
    keywords: { ru: ["склеить файлы", "объединить части файла", "собрать файл 001", "соединить файлы"], en: ["join files", "merge file parts", "combine 001 files", "file joiner"] },
    howTo: {
      ru: ["Выберите все части сразу.", "Проверьте порядок и предупреждения о пропусках.", "При необходимости исправьте имя итогового файла.", "Нажмите «Склеить и скачать»."],
      en: ["Select all parts at once.", "Check the order and any missing-part warnings.", "Adjust the output name if needed.", "Click Join and download."],
    },
    about: {
      ru: [
        "Части распознаются по окончаниям .001/.002, .part1/.part2 и _1/_2 и сортируются по номеру, а не по алфавиту (поэтому .010 не окажется раньше .002). Если какого-то номера не хватает, инструмент предупредит.",
        "Соединение делается без копирования в память — из частей собирается один Blob, поэтому даже гигабайтные файлы склеиваются мгновенно.",
      ],
      en: [
        "Parts are recognised by .001/.002, .part1/.part2 and _1/_2 endings and sorted numerically rather than alphabetically, so .010 never lands before .002. If a number is missing, the tool warns you.",
        "Joining doesn't copy data in memory — the parts are combined into one Blob, so even gigabyte files are joined instantly.",
      ],
    },
    faq: {
      ru: [
        { q: "Можно ли склеить части RAR-архива (.part1.rar)?", a: "Их склеивать не нужно: многотомный RAR открывается архиватором с первой части. Инструмент рассчитан на части, разрезанные побайтно." },
        { q: "Откуда берётся имя итогового файла?", a: "Из имени частей без номера: video.mp4.001 → video.mp4. Его можно изменить." },
        { q: "Что если одной части не хватает?", a: "Файл соберётся, но будет неполным и, скорее всего, не откроется. Найдите недостающую часть и повторите." },
      ],
      en: [
        { q: "Can I join multi-part RAR files (.part1.rar)?", a: "They don't need joining: a multi-volume RAR opens in an archiver from the first part. This tool is for byte-split parts." },
        { q: "Where does the output name come from?", a: "From the part names minus the number: video.mp4.001 → video.mp4. You can change it." },
        { q: "What if one part is missing?", a: "The file is assembled but incomplete and probably won't open. Find the missing part and retry." },
      ],
    },
    related: ["split-file", "unzip", "create-zip", "file-type-checker"],
    blocks: (locale) => [local(locale)],
  },
  {
    slug: "file-to-base64",
    component: "file/base64",
    icon: "Binary",
    name: { ru: "Файл в Base64", en: "File to Base64" },
    title: { ru: "Файл в Base64 онлайн — и обратно, data URI для картинок", en: "File to Base64 online — and back, data URIs for images" },
    h1: { ru: "Файл в Base64 и обратно", en: "File to Base64 and back" },
    description: {
      ru: "Любой файл в Base64 или data URI для CSS, HTML, JSON и писем — и обратно из Base64 в файл с определением типа. Перенос строк по 76 символов (MIME).",
      en: "Encode any file as Base64 or a data URI for CSS, HTML, JSON and email — and decode Base64 back into a file with its type detected. Optional MIME line wrapping.",
    },
    lead: { ru: "Превратите картинку или любой файл в текст Base64 — или восстановите файл из Base64.", en: "Turn an image or any file into Base64 text — or restore a file from Base64." },
    keywords: { ru: ["файл в base64", "картинка в base64", "base64 в файл", "data uri"], en: ["file to base64", "image to base64", "base64 to file", "data uri generator"] },
    howTo: {
      ru: ["Во вкладке «Файл → Base64» перетащите файл.", "Выберите вид результата: Base64, data URI, CSS или тег img.", "Скопируйте текст или скачайте его .txt-файлом.", "Для обратного преобразования вставьте Base64 во вкладке «Base64 → файл»."],
      en: ["In the “File → Base64” tab drop a file.", "Choose the output: Base64, data URI, CSS or an img tag.", "Copy the text or download it as a .txt file.", "To go back, paste Base64 in the “Base64 → file” tab."],
    },
    about: {
      ru: [
        "Base64 записывает каждые 3 байта четырьмя символами, поэтому текст получается примерно на треть больше файла. Data URI вида data:image/png;base64,… позволяет встроить небольшую картинку прямо в HTML или CSS без отдельного запроса.",
        "Декодер принимает и «чистый» Base64, и data URI, прощает переносы строк, URL-safe алфавит (- и _) и отсутствие знаков = в конце, а тип файла определяет по сигнатуре.",
      ],
      en: [
        "Base64 writes every 3 bytes as 4 characters, so the text is about a third larger than the file. A data URI such as data:image/png;base64,… embeds a small image straight into HTML or CSS without a separate request.",
        "The decoder accepts plain Base64 and data URIs, tolerates line breaks, the URL-safe alphabet (- and _) and missing trailing = signs, and detects the file type from its signature.",
      ],
    },
    faq: {
      ru: [
        { q: "Стоит ли встраивать картинки в CSS через Base64?", a: "Только маленькие (иконки до нескольких килобайт): Base64 на треть больше, не кешируется отдельно и замедляет загрузку CSS. Большие картинки лучше подключать файлами." },
        { q: "Как закодировать в Base64 текст, а не файл?", a: "Для текста удобнее отдельный кодировщик Base64 — он работает со строкой и кодировкой UTF-8. Здесь любой файл кодируется побайтно." },
        { q: "Почему декодер пишет, что это не Base64?", a: "Во вставленном тексте есть символы вне алфавита Base64 (например, кавычки или обрезанный конец). Скопируйте строку целиком, без кавычек." },
      ],
      en: [
        { q: "Should I embed images in CSS as Base64?", a: "Only small ones (icons of a few kilobytes): Base64 is a third larger, isn't cached separately and slows CSS loading. Link larger images as files." },
        { q: "How do I Base64-encode text rather than a file?", a: "A dedicated text Base64 encoder is handier — it works with strings and UTF-8. Here any file is encoded byte by byte." },
        { q: "Why does the decoder say it isn't Base64?", a: "The pasted text contains characters outside the Base64 alphabet (quotes, say, or a cut-off end). Copy the whole string without quotes." },
      ],
    },
    related: ["base64-decode", "image-to-base64", "file-type-checker", "file-checksum"],
    blocks: (locale) => [local(locale)],
  },
];

export const fileSection = defineToolSection({
  id: "file",
  name: { ru: "Файлы и архивы", en: "Files & archives" },
  description: {
    ru: "ZIP-архивы, шифрование файлов паролем, тип файла по сигнатуре, пакетное переименование, деление и склейка файлов, Base64",
    en: "ZIP archives, password encryption, file type detection, batch renaming, splitting and joining files, Base64",
  },
  icon: "FileArchive",
  hue: 30,
  category: "files",
  order: 5,
  tools: [...tools, encryptFileTool, encryptTextTool],
});
