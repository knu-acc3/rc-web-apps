import type { ToolText } from "./types";

/** SEO and content texts of the main image tool pages (/image/<slug>), part B. */
export const TOOL_TEXTS_B: Record<string, ToolText> = {
  collage: {
    name: { ru: "Коллаж из фото", en: "Photo collage" },
    title: {
      ru: "Сделать коллаж из фото онлайн — от 2 до 9 снимков",
      en: "Photo Collage Maker — Combine 2 to 9 Photos in a Grid",
    },
    h1: { ru: "Сделать коллаж из фото онлайн", en: "Photo Collage Maker" },
    description: {
      ru: "Коллаж из 2–9 фото по готовым сеткам: отступы, поля, скругление углов, цвет фона, холст 1:1, 4:5, 16:9, 9:16 или 3:2. Сохранение в JPG, PNG или WebP.",
      en: "Combine 2–9 photos in ready-made grids: spacing, padding, rounded corners, background colour, a 1:1, 4:5, 16:9, 9:16 or 3:2 canvas. Save as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Выберите от 2 до 9 фото и подходящую сетку — снимки сами впишутся в ячейки, и готовый коллаж можно сразу скачать.",
      en: "Pick 2 to 9 photos and a layout — each photo fills its cell automatically, and the finished collage is ready to download.",
    },
    keywords: {
      ru: [
        "сделать коллаж из фото",
        "коллаж онлайн",
        "коллаж из фото онлайн",
        "объединить несколько фото в одно",
        "две фотографии рядом",
        "коллаж из 4 фото",
        "фотоколлаж онлайн",
      ],
      en: ["photo collage maker", "make a collage online", "combine photos into one", "photo grid maker", "put two photos side by side", "4 photo collage"],
    },
    howTo: {
      ru: [
        "Добавьте от 2 до 9 фото: перетащите их в окно, вставьте через Ctrl+V или выберите файлы.",
        "Выберите раскладку — для каждого количества снимков есть несколько шаблонов — и при необходимости поменяйте фото местами.",
        "Настройте холст: пропорции 1:1, 4:5, 16:9, 9:16 или 3:2 и ширину в px, затем отступы между фото, внешние поля, скругление углов и цвет фона.",
        "Выберите формат — JPG, PNG или WebP — и скачайте коллаж.",
      ],
      en: [
        "Add 2 to 9 photos: drag them into the window, paste with Ctrl+V or choose the files.",
        "Pick a layout — there are several templates for each number of photos — and swap photos around if needed.",
        "Set up the canvas: a 1:1, 4:5, 16:9, 9:16 or 3:2 ratio and the width in px, then the spacing between photos, outer padding, corner radius and background colour.",
        "Choose JPG, PNG or WebP and download the collage.",
      ],
    },
    about: {
      ru: [
        "Каждое фото заполняет свою ячейку целиком и обрезается по центру, поэтому сетка остаётся ровной, даже если снимки разной ориентации. Если важная часть кадра оказалась у края и срезается, поменяйте фото местами или выберите раскладку, где форма ячейки ближе к пропорциям снимка.",
        "Пропорции холста подбирайте под площадку: 1:1 и 4:5 — для ленты Instagram и VK, 9:16 — для сторис, 16:9 — для презентаций и обложек, 3:2 — для печати 10×15. Ширина задаёт итоговый размер в пикселях: для соцсетей обычно достаточно 1080–2048 px, для печати берите больше.",
        "Отступы и внешние поля заливаются цветом фона: белый даёт аккуратные «паспарту» между снимками, а нулевой отступ — сплошную мозаику без швов. Скругление смягчает углы фото и хорошо смотрится с широкими отступами. Коллаж собирается прямо в браузере — фото никуда не загружаются.",
      ],
      en: [
        "Each photo fills its cell completely and is cropped around the centre, so the grid stays even when the shots have different orientations. If an important part of a picture sits near the edge and gets cut off, swap the photos around or choose a layout whose cells are closer to that photo’s proportions.",
        "Match the canvas ratio to where the collage will go: 1:1 and 4:5 for an Instagram feed, 9:16 for stories, 16:9 for slides and covers, 3:2 for a 4×6 print. The width sets the final size in pixels — 1080–2048 px is usually enough for social media; go bigger for printing.",
        "Spacing and outer padding are filled with the background colour: white gives neat mat-like gaps between the photos, while zero spacing produces a seamless mosaic. Rounded corners soften the photos and look good with wider spacing. The collage is assembled right in your browser — the photos aren’t uploaded anywhere.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Сколько фото можно поместить в один коллаж?",
          a: "От 2 до 9. Для каждого количества снимков есть несколько раскладок на выбор. Если фото больше девяти, сделайте несколько коллажей или соберите общий коллаж из уже готовых.",
        },
        {
          q: "Почему фото в коллаже обрезаются по краям?",
          a: "Каждый снимок заполняет ячейку без пустых полос, поэтому то, что не помещается по пропорциям, срезается симметрично от центра. Чтобы сохранить нужную часть кадра, заранее обрежьте фото в пропорциях ячейки или выберите другую раскладку.",
        },
        {
          q: "Как соединить две фотографии рядом?",
          a: "Добавьте два фото и выберите раскладку из двух ячеек — рядом или одна над другой. Поставьте отступ 0, если нужна склейка без шва, или оставьте белую полосу, чтобы снимки читались как пара «до и после».",
        },
        {
          q: "Какой размер коллажа выбрать для Instagram?",
          a: "Для ленты — пропорции 4:5 при ширине 1080 px (получится 1080×1350) или квадрат 1:1 — 1080×1080. Для сторис — 9:16, то есть 1080×1920. Более широкий коллаж Instagram при загрузке всё равно уменьшит до 1080 px.",
        },
      ],
      en: [
        {
          q: "How many photos can go into one collage?",
          a: "From 2 to 9. Each number of photos comes with several layouts to choose from. If you have more than nine, make several collages or combine finished collages into a new one.",
        },
        {
          q: "Why are the photos in my collage cropped at the edges?",
          a: "Each photo fills its cell with no empty bars, so whatever doesn’t fit the cell’s proportions is trimmed evenly from the centre. To keep a particular part of a shot, crop the photo to the cell’s proportions beforehand or choose a different layout.",
        },
        {
          q: "How do I put two photos side by side?",
          a: "Add two photos and pick a two-cell layout — side by side or one above the other. Set the spacing to 0 for a seamless join, or keep a white gap so the pair reads as a before-and-after.",
        },
        {
          q: "What size should an Instagram collage be?",
          a: "For the feed, use a 4:5 ratio at 1080 px wide (1080×1350) or a 1:1 square (1080×1080). For stories, use 9:16, i.e. 1080×1920. Instagram scales wider images down to 1080 px on upload anyway.",
        },
      ],
    },
  },

  split: {
    name: { ru: "Разрезать фото", en: "Split image" },
    title: {
      ru: "Разрезать фото на части — сетка и карусель для Instagram",
      en: "Split Image into Pieces — Grid and Instagram Carousel",
    },
    h1: { ru: "Разрезать фото на части", en: "Split an Image into Pieces" },
    description: {
      ru: "Нарезка фото сеткой до 5×5 (2×2, 3×3, 1×3 и др.) или на слайды карусели-панорамы 1080×1350 и 1080×1080. Части нумеруются в порядке публикации, ZIP.",
      en: "Cut an image into a grid up to 5×5 (2×2, 3×3, 1×3…) or into 1080×1350 or 1080×1080 panorama carousel slides. Pieces are numbered in posting order; ZIP.",
    },
    lead: {
      ru: "Задайте число строк и столбцов или количество слайдов — картинка разрежется на равные части, готовые к публикации.",
      en: "Set the rows and columns or the number of slides — the picture is cut into equal pieces, ready to post.",
    },
    keywords: {
      ru: [
        "разрезать фото на части",
        "разделить фото на части онлайн",
        "разрезать фото для инстаграм",
        "сетка для инстаграм из одного фото",
        "панорама в карусель инстаграм",
        "разрезать картинку на 9 частей",
        "разрезать фото пополам",
      ],
      en: [
        "split image",
        "split image into pieces",
        "image splitter online",
        "instagram grid maker",
        "cut image into 9 pieces",
        "panorama carousel splitter",
        "split photo in half",
      ],
    },
    howTo: {
      ru: [
        "Загрузите изображение.",
        "Выберите режим: сетку — строки × столбцы до 5×5 или готовые варианты 2×1, 1×2, 2×2, 3×3, 1×3 — или карусель-панораму с нужным числом слайдов 1080×1350 либо 1080×1080.",
        "Проверьте результат: части пронумерованы в том порядке, в котором их нужно публиковать.",
        "Скачайте все части одним архивом кнопкой «Скачать всё (ZIP)».",
      ],
      en: [
        "Open an image.",
        "Choose a mode: a grid — rows × columns up to 5×5 or the 2×1, 1×2, 2×2, 3×3 and 1×3 presets — or a panorama carousel with the number of 1080×1350 or 1080×1080 slides you need.",
        "Check the result: the pieces are numbered in the order they should be posted.",
        "Download all the pieces in one archive with “Download all (ZIP)”.",
      ],
    },
    about: {
      ru: [
        "В режиме сетки изображение делится на равные прямоугольники — от 2 до 25 частей. Сетка 3×3 превращает один снимок в мозаику из девяти постов для профиля Instagram, 1×3 — в один ряд из трёх, а 2×1 и 1×2 режут картинку пополам. Так же можно разбить большой плакат на части, чтобы распечатать его на нескольких листах.",
        "Карусель-панорама — это широкий снимок, разрезанный на N слайдов 1080×1350 (4:5) или 1080×1080 (1:1): при пролистывании они складываются в одну непрерывную картинку. Лучше всего подходят кадры, ширина которых примерно в N раз больше высоты для квадратных слайдов или в 0,8×N раза — для слайдов 4:5.",
        "Номера частей показывают порядок публикации: выкладывайте файлы строго по возрастанию номеров — для сетки в профиле нумерация уже учитывает, что новые посты встают в начало профиля. Нарезка выполняется в браузере.",
      ],
      en: [
        "In grid mode the image is divided into equal rectangles — from 2 to 25 pieces. A 3×3 grid turns one photo into a nine-post mosaic for an Instagram profile, 1×3 makes a single row of three, and 2×1 or 1×2 cut the picture in half. The same approach lets you split a large poster into parts to print on several sheets.",
        "A panorama carousel is a wide photo cut into N slides of 1080×1350 (4:5) or 1080×1080 (1:1): as you swipe, they join into one continuous picture. It works best with shots roughly N times as wide as they are tall for square slides, or 0.8×N times for 4:5 slides.",
        "The piece numbers show the posting order: publish the files strictly in ascending order — for a profile grid, the numbering already accounts for new posts appearing at the top of the profile. Splitting happens in your browser.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сделать сетку для профиля Instagram из одного фото?",
          a: "Выберите сетку 3×3 (или 1×3, если нужен один ряд), скачайте архив и публикуйте части по порядку номеров, начиная с первого. Учтите, что с 2025 года Instagram показывает превью в профиле вертикальными прямоугольниками 3:4, поэтому края частей в сетке профиля могут немного срезаться.",
        },
        {
          q: "Как выложить панораму каруселью без швов?",
          a: "Выберите режим карусели, число слайдов и их формат — 1080×1350 или 1080×1080 — и добавьте все части в один пост по порядку номеров. Соседние слайды стыкуются точно по краю, поэтому при пролистывании картинка выглядит цельной.",
        },
        {
          q: "Как разрезать фото пополам?",
          a: "Выберите готовый вариант 1×2 или 2×1 — картинка разделится на две равные половины по вертикали или по горизонтали. Для трёх частей в ряд подойдёт 1×3.",
        },
        {
          q: "Можно ли разрезать фото на неравные части?",
          a: "Нет, в сетке все части одинакового размера. Чтобы вырезать фрагмент произвольного размера и положения, воспользуйтесь инструментом обрезки — там рамку можно двигать вручную или задать точными координатами в px.",
        },
      ],
      en: [
        {
          q: "How do I make an Instagram profile grid from one photo?",
          a: "Choose a 3×3 grid (or 1×3 for a single row), download the archive and post the pieces in numerical order, starting with number 1. Keep in mind that since 2025 Instagram shows profile thumbnails as vertical 3:4 rectangles, so the edges of the pieces may be trimmed slightly in the profile grid.",
        },
        {
          q: "How do I post a panorama as a seamless carousel?",
          a: "Switch to carousel mode, choose the number of slides and their format — 1080×1350 or 1080×1080 — and add all the pieces to one post in numerical order. Neighbouring slides meet exactly at the edge, so the picture looks continuous as people swipe.",
        },
        {
          q: "How do I split a photo in half?",
          a: "Pick the 1×2 or 2×1 preset — the picture is divided into two equal halves, vertically or horizontally. For three pieces in a row, use 1×3.",
        },
        {
          q: "Can I split an image into unequal parts?",
          a: "No, all grid pieces are the same size. To cut out a piece of any size and position, use the crop tool, where you can drag the frame or enter exact coordinates in px.",
        },
      ],
    },
  },

  "round-corners": {
    name: { ru: "Скруглить углы фото", en: "Round image corners" },
    title: {
      ru: "Скруглить углы фото онлайн — PNG с прозрачными углами",
      en: "Round Image Corners Online — Transparent PNG or Colour",
    },
    h1: { ru: "Скруглить углы фото", en: "Round the Corners of an Image" },
    description: {
      ru: "Скругление углов картинки: радиус в процентах, прозрачные углы в PNG или WebP либо заливка цветом для JPG. Несколько файлов сразу, скачивание в ZIP.",
      en: "Round the corners of any image: radius in percent, transparent corners in PNG or WebP, or a colour fill for JPG. Batch processing and ZIP download.",
    },
    lead: {
      ru: "Задайте радиус — углы картинки станут закруглёнными, а срезанные уголки прозрачными или залитыми нужным цветом.",
      en: "Set a radius — the picture gets rounded corners, and the trimmed-off bits become transparent or filled with the colour you choose.",
    },
    keywords: {
      ru: [
        "скруглить углы фото",
        "закруглить углы картинки онлайн",
        "скругленные углы png",
        "сделать закругленные края у фото",
        "скруглить углы изображения",
        "картинка с закругленными углами",
      ],
      en: [
        "round image corners",
        "rounded corners image online",
        "round corners png",
        "add rounded corners to photo",
        "rounded image maker",
        "curved corners picture",
      ],
    },
    howTo: {
      ru: [
        "Добавьте одно или несколько изображений.",
        "Ползунком «Радиус скругления» задайте, насколько круглыми будут углы.",
        "В поле «Углы» выберите «Прозрачные (PNG/WebP)» или «Цветом (JPG)» — во втором случае укажите цвет.",
        "При необходимости смените формат файла и скачайте результат по одному или кнопкой «Скачать всё (ZIP)».",
      ],
      en: [
        "Add one or more images.",
        "Use the “Corner radius” slider to set how round the corners should be.",
        "Under “Corners”, choose “Transparent (PNG/WebP)” or “Colour (JPG)” — for the latter, pick the colour.",
        "Change the file format if needed and download the results one by one or with “Download all (ZIP)”.",
      ],
    },
    about: {
      ru: [
        "Радиус задаётся в процентах от половины короткой стороны: 5–15 % дают аккуратное скругление, как у карточек на сайтах, а 100 % превращает квадратную картинку в круг, прямоугольную — в «таблетку» с полукруглыми торцами. Радиус относительный, поэтому у пачки изображений разного разрешения углы выглядят одинаково.",
        "Прозрачные уголки умеют хранить только PNG и WebP. Если исходник в JPG, а выбраны прозрачные углы, файл автоматически сохранится в PNG. В режиме «Цветом (JPG)» углы заливаются выбранным цветом — возьмите цвет фона страницы, документа или слайда, и углы будут выглядеть прозрачными.",
        "Картинки со скруглёнными углами нужны там, где форму нельзя задать стилем CSS border-radius: в письмах, документах Word и Google, презентациях, на маркетплейсах и в мессенджерах. Обработка идёт в браузере, исходные файлы не меняются.",
      ],
      en: [
        "The radius is set as a percentage of half the shorter side: 5–15% gives a neat rounding like cards on websites, while 100% turns a square picture into a circle and a rectangular one into a pill shape with semicircular ends. Because the radius is relative, a batch of images with different resolutions gets identical-looking corners.",
        "Only PNG and WebP can store transparent corners. If the source is a JPG and you choose transparent corners, the file is saved as PNG automatically. With “Colour (JPG)” the corners are filled with the chosen colour — use the background colour of the page, document or slide, and the corners will look transparent.",
        "Images with rounded corners come in handy where you can’t shape them with CSS border-radius: in emails, Word and Google documents, presentations, marketplaces and messengers. Processing happens in your browser, and the original files stay unchanged.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой радиус скругления выбрать?",
          a: "Для лёгкого скругления, как у карточек на сайтах, хватает 5–10 %, для заметного — 20–40 %. 100 % даёт максимум: круг у квадратной картинки или полукруглые края у прямоугольной.",
        },
        {
          q: "Как сохранить прозрачные углы, если фото в JPG?",
          a: "Формат JPG не поддерживает прозрачность, поэтому при выборе прозрачных углов результат автоматически сохраняется в PNG. Можно вручную выбрать WebP — он тоже хранит прозрачность, а фотографии в нём обычно весят меньше, чем в PNG.",
        },
        {
          q: "Можно ли скруглить только верхние или только нижние углы?",
          a: "Нет, радиус применяется ко всем четырём углам одинаково. Если нужны разные радиусы для разных углов, картинку придётся доработать в графическом редакторе.",
        },
        {
          q: "Как сделать из квадратной картинки круг?",
          a: "Поставьте радиус 100 % — квадрат станет кругом. Если картинка прямоугольная или нужно выбрать, какая часть попадёт в круг, удобнее инструмент обрезки по кругу: там круг можно двигать и масштабировать.",
        },
      ],
      en: [
        {
          q: "What corner radius should I choose?",
          a: "For a subtle rounding, like cards on websites, 5–10% is enough; for a clearly rounded look, try 20–40%. 100% gives the maximum: a circle for a square image or semicircular ends for a rectangular one.",
        },
        {
          q: "How do I keep transparent corners when the photo is a JPG?",
          a: "JPG can’t store transparency, so when you choose transparent corners the result is saved as PNG automatically. You can also pick WebP by hand — it keeps transparency too, and photos are usually smaller in WebP than in PNG.",
        },
        {
          q: "Can I round only the top or only the bottom corners?",
          a: "No, the radius is applied to all four corners equally. If you need different radii for different corners, you’ll have to finish the picture in an image editor.",
        },
        {
          q: "How do I turn a square image into a circle?",
          a: "Set the radius to 100% and the square becomes a circle. If the picture is rectangular or you want to choose which part ends up inside the circle, the circle crop tool is handier: there you can move and resize the circle.",
        },
      ],
    },
  },

  border: {
    name: { ru: "Рамка для фото", en: "Add border" },
    title: {
      ru: "Добавить рамку к фото онлайн — белая, чёрная или цветная",
      en: "Add Border to Image Online — White, Black or Any Colour",
    },
    h1: { ru: "Добавить рамку к фото", en: "Add a Border to an Image" },
    description: {
      ru: "Рамка вокруг фото любого цвета: толщина в px или в % от короткой стороны, снаружи или внутри кадра с сохранением размера. Пакетная обработка и ZIP.",
      en: "Put a border of any colour around a photo: width in px or % of the shorter side, outside the frame or inside it to keep the size. Batch processing and ZIP.",
    },
    lead: {
      ru: "Выберите толщину и цвет — вокруг снимка появится ровная рамка, одинаковая со всех сторон.",
      en: "Choose a width and a colour — an even border appears around the photo, the same on every side.",
    },
    keywords: {
      ru: [
        "добавить рамку к фото",
        "рамка для фото онлайн",
        "белая рамка для фото",
        "обводка фото онлайн",
        "сделать рамку вокруг картинки",
        "добавить белые края к фото",
        "черная рамка на фото",
      ],
      en: ["add border to image", "add border to photo online", "white border for photo", "image frame online", "add outline to picture", "photo border maker"],
    },
    howTo: {
      ru: [
        "Добавьте одно или несколько фото.",
        "Задайте ползунком «Толщина рамки» ширину — в процентах от короткой стороны или в пикселях — и выберите цвет рамки.",
        "Включите «Сохранить размер (рамка внутри)», если размеры изображения должны остаться прежними.",
        "Скачайте файлы по одному или кнопкой «Скачать всё (ZIP)».",
      ],
      en: [
        "Add one or more photos.",
        "Set the “Border width” slider — in percent of the shorter side or in pixels — and choose the border colour.",
        "Turn on “Keep size (border inside)” if the image dimensions must stay the same.",
        "Download the files one by one or with “Download all (ZIP)”.",
      ],
    },
    about: {
      ru: [
        "По умолчанию рамка добавляется снаружи: холст увеличивается на две толщины рамки по ширине и по высоте, и снимок не теряет ни пикселя. С опцией «Сохранить размер (рамка внутри)» размеры файла не меняются, но рамка закрывает полосу по краям кадра — учитывайте это, если у края есть важные детали.",
        "Толщина в процентах считается от короткой стороны каждого изображения, поэтому в пачке фото разного разрешения рамка выглядит одинаково. Пиксели удобны, когда нужна точная толщина — например, обводка в 1–2 px вокруг скриншота для документации или презентации.",
        "Белая рамка придаёт снимку вид фотоотпечатка и популярна в ленте Instagram, чёрная подчёркивает контрастные и чёрно-белые кадры, а тонкая серая отделяет скриншот с белым фоном от белой страницы. Обработка выполняется в браузере.",
      ],
      en: [
        "By default the border goes outside: the canvas grows by twice the border width in each direction, and the photo keeps every pixel. With “Keep size (border inside)” the file dimensions stay the same, but the border covers a strip along the edges of the frame — keep that in mind if there are important details near the edge.",
        "A width in percent is measured from each image’s shorter side, so the border looks the same across a batch of photos with different resolutions. Pixels are handy when you need an exact thickness — say, a 1–2 px outline around a screenshot for documentation or slides.",
        "A white border makes a photo look like a print and is popular in Instagram feeds, a black one emphasises contrasty and black-and-white shots, and a thin grey line separates a white-background screenshot from a white page. Processing happens in your browser.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как добавить рамку, не меняя размер фото?",
          a: "Включите «Сохранить размер (рамка внутри)»: рамка будет нарисована поверх краёв изображения, а ширина и высота останутся прежними. Это удобно, когда площадка требует точный размер, например 1080×1080 px.",
        },
        {
          q: "Какую толщину рамки выбрать?",
          a: "Для тонкой аккуратной рамки хватает 1–3 % короткой стороны, для широких полей в духе паспарту — 5–10 %. Для обводки скриншота обычно достаточно 1–2 px серого или чёрного цвета.",
        },
        {
          q: "Как добавить белые поля только сверху и снизу, чтобы фото стало квадратным?",
          a: "Рамка всегда одинаковой толщины со всех сторон. Чтобы добавить поля только там, где их не хватает до квадрата или формата 4:5, воспользуйтесь инструментом «Сделать фото квадратным без обрезки» — он дополнит холст цветом или размытым фоном.",
        },
      ],
      en: [
        {
          q: "How do I add a border without changing the image size?",
          a: "Turn on “Keep size (border inside)”: the border is drawn over the edges of the image, and the width and height stay the same. This helps when a platform requires an exact size such as 1080×1080 px.",
        },
        {
          q: "How thick should the border be?",
          a: "For a thin, tidy border, 1–3% of the shorter side is enough; for wide mat-style margins, 5–10%. For a screenshot outline, 1–2 px of grey or black usually does the job.",
        },
        {
          q: "How do I add white margins only at the top and bottom to make a photo square?",
          a: "A border is always the same thickness on every side. To add margins only where the picture falls short of a square or 4:5, use the “Make Image Square Without Cropping” tool — it extends the canvas with a colour or a blurred background.",
        },
      ],
    },
  },

  square: {
    name: { ru: "Фото в квадрат", en: "Square image" },
    title: {
      ru: "Сделать фото квадратным без обрезки — с размытым фоном",
      en: "Make Image Square Without Cropping — Blurred Background",
    },
    h1: { ru: "Сделать фото квадратным без обрезки", en: "Make a Photo Square Without Cropping" },
    description: {
      ru: "Фото в квадрат 1:1 или формат 4:5, 9:16, 16:9 без обрезки: свободное место заполняется размытой копией снимка или цветом. Для Instagram, пакетно, ZIP.",
      en: "Fit a photo into a 1:1 square or a 4:5, 9:16 or 16:9 frame without cropping: the empty space is filled with a blurred copy of the photo or a colour. Batch, ZIP.",
    },
    lead: {
      ru: "Снимок целиком помещается в квадрат, а пустые поля по бокам или сверху и снизу заполняются размытым фоном или цветом.",
      en: "The whole photo fits inside the square, and the empty bars at the sides or at the top and bottom are filled with a blurred background or a colour.",
    },
    keywords: {
      ru: [
        "сделать фото квадратным",
        "фото в квадрат без обрезки",
        "квадратное фото для инстаграм",
        "размытый фон по краям фото",
        "вписать фото в квадрат",
        "добавить поля к фото",
        "вертикальное фото в горизонтальное",
      ],
      en: [
        "make image square",
        "square image without cropping",
        "fit photo in square",
        "blurred background for photo",
        "instagram no crop",
        "square photo maker",
        "add padding to image",
      ],
    },
    howTo: {
      ru: [
        "Добавьте фото — можно сразу несколько.",
        "В поле «Формат» выберите 1:1, 4:5, 9:16 или 16:9.",
        "В поле «Поля» выберите «Размытое фото» или «Цвет»; для цвета укажите нужный оттенок.",
        "Скачайте результат по одному файлу или кнопкой «Скачать всё (ZIP)».",
      ],
      en: [
        "Add photos — several at once is fine.",
        "Under “Shape”, choose 1:1, 4:5, 9:16 or 16:9.",
        "Under “Padding”, choose “Blurred photo” or “Colour”; for a colour, pick the shade you want.",
        "Download the results one by one or with “Download all (ZIP)”.",
      ],
    },
    about: {
      ru: [
        "Фото не обрезается и не уменьшается: холст расширяется до нужных пропорций, а снимок встаёт по центру. Вертикальный кадр получает поля слева и справа, горизонтальный — сверху и снизу. Итоговый размер определяется длинной стороной: из фото 3000×4000 px получится квадрат 4000×4000 px.",
        "«Размытое фото» — это увеличенная размытая копия того же снимка на заднем плане: поля подхватывают его цвета и выглядят естественно, как в сторис и Reels. Однотонные поля — белые, чёрные или любого другого цвета — подходят для каталогов, карточек товаров на маркетплейсах и минималистичной ленты.",
        "4:5 — стандартный вертикальный пост в ленте Instagram, 9:16 — сторис, Reels и Shorts, 16:9 — видео, обложки YouTube и слайды. Если площадке нужен точный размер, например 1080×1080 px, уменьшите результат в инструменте изменения размера. Всё обрабатывается в браузере.",
      ],
      en: [
        "The photo is neither cropped nor scaled down: the canvas is extended to the chosen proportions and the photo sits in the centre. A portrait shot gets margins on the left and right, a landscape one at the top and bottom. The final size follows the longer side: a 3000×4000 px photo becomes a 4000×4000 px square.",
        "“Blurred photo” places an enlarged, blurred copy of the same image in the background, so the margins pick up its colours and look natural, as in stories and Reels. Solid margins — white, black or any other colour — suit catalogues, marketplace product cards and minimalist feeds.",
        "4:5 is the standard portrait post in the Instagram feed, 9:16 is for stories, Reels and Shorts, and 16:9 is for video, YouTube thumbnails and slides. If a platform needs an exact size such as 1080×1080 px, scale the result down with the resize tool. Everything is processed in your browser.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как опубликовать в Instagram фото целиком, чтобы оно не обрезалось?",
          a: "Лента Instagram не показывает целиком слишком вытянутые кадры — например, вертикальное фото 9:16 или широкую панораму: при публикации их приходится обрезать. Сделайте фото квадратным или приведите его к 4:5 с полями — тогда в пост попадёт весь кадр, а поля заполнятся размытым фоном или цветом.",
        },
        {
          q: "Как сделать вертикальное фото горизонтальным для YouTube или презентации?",
          a: "Выберите формат 16:9 и поля «Размытое фото»: снимок целиком останется по центру, а по бокам появится размытый фон вместо чёрных полос.",
        },
        {
          q: "Чем это отличается от обрезки до квадрата?",
          a: "Обрезка отбрасывает часть кадра, чтобы он стал квадратным. Здесь ничего не теряется: недостающее место добавляется полями. Если важен весь кадр — групповое фото или товар целиком, — выбирайте поля; если хочется показать главный объект крупнее — обрезку.",
        },
        {
          q: "Можно ли сделать квадратными сразу много фото?",
          a: "Да, добавьте все файлы: формат и тип полей применяются к каждому, а горизонтальные и вертикальные снимки дополняются с нужных сторон. Результат скачивается одним ZIP-архивом.",
        },
      ],
      en: [
        {
          q: "How do I fit a whole photo into an Instagram post?",
          a: "The Instagram feed won’t show overly elongated shots in full — a 9:16 portrait photo or a wide panorama, for example — so they have to be cropped when you post them. Make the photo square or bring it to 4:5 with margins: the whole frame gets into the post, and the margins are filled with a blurred background or a colour.",
        },
        {
          q: "How do I turn a vertical photo into a horizontal one for YouTube or slides?",
          a: "Choose 16:9 and “Blurred photo” padding: the whole photo stays in the centre, with a blurred background at the sides instead of black bars.",
        },
        {
          q: "How is this different from cropping to a square?",
          a: "Cropping throws part of the frame away to make it square. Here nothing is lost: the missing space is added as margins. If the whole frame matters — a group photo or a product in full — use margins; if you want the main subject to look bigger, crop instead.",
        },
        {
          q: "Can I make many photos square at once?",
          a: "Yes, add all the files: the shape and padding type apply to each one, and portrait and landscape shots are extended on the right sides. The results download as a single ZIP.",
        },
      ],
    },
  },

  favicon: {
    name: { ru: "Генератор favicon", en: "Favicon generator" },
    title: {
      ru: "Генератор favicon онлайн — ICO, PNG и web manifest",
      en: "Favicon Generator — ICO, PNG and Web Manifest from Image",
    },
    h1: { ru: "Генератор favicon", en: "Favicon Generator" },
    description: {
      ru: "Favicon из картинки, букв или эмодзи: favicon.ico 16/32/48, apple-touch-icon 180×180, PNG 192 и 512 для манифеста, site.webmanifest и теги <link> в ZIP.",
      en: "Make a favicon from an image, letters or an emoji: favicon.ico 16/32/48, apple-touch-icon 180×180, 192 and 512 PNGs, site.webmanifest and <link> tags.",
    },
    lead: {
      ru: "Загрузите логотип или введите 1–2 буквы либо эмодзи — получите полный набор иконок для сайта и готовый HTML-код для их подключения.",
      en: "Upload a logo or type 1–2 letters or an emoji — get the full set of site icons and the HTML code to add them.",
    },
    keywords: {
      ru: [
        "генератор favicon",
        "создать фавикон онлайн",
        "favicon ico онлайн",
        "сделать иконку для сайта",
        "favicon из png",
        "размер apple touch icon",
        "фавикон из текста",
      ],
      en: ["favicon generator", "favicon maker", "create favicon ico", "png to favicon", "favicon from text", "emoji favicon", "apple touch icon generator"],
    },
    howTo: {
      ru: [
        "Выберите источник: картинку (лучше квадратную, от 512×512 px), текст из 1–2 букв или эмодзи.",
        "Настройте цвет фона в формате HEX, форму — квадрат, скруглённый квадрат или круг — и отступ от края.",
        "Скачайте ZIP: в нём favicon.ico, PNG-иконки, apple-touch-icon, site.webmanifest и HTML-теги.",
        "Положите файлы в корень сайта, а теги <link> вставьте в раздел <head> каждой страницы.",
      ],
      en: [
        "Choose a source: an image (ideally square, 512×512 px or larger), 1–2 letters of text or an emoji.",
        "Set the background colour as a HEX code, the shape — square, rounded square or circle — and the padding.",
        "Download the ZIP: it contains favicon.ico, the PNG icons, apple-touch-icon, site.webmanifest and the HTML tags.",
        "Put the files in the site root and paste the <link> tags into the <head> of every page.",
      ],
    },
    about: {
      ru: [
        "Файл favicon.ico с размерами 16, 32 и 48 px браузеры показывают во вкладках и закладках, а многие запрашивают /favicon.ico из корня сайта даже без тега. apple-touch-icon 180×180 px используют iPhone и iPad, когда страницу добавляют на экран «Домой». PNG 192×192 и 512×512 px прописываются в site.webmanifest — их берут Android и установленные веб-приложения (PWA) для иконки и заставки.",
        "site.webmanifest — небольшой JSON-файл со списком иконок 192 и 512 px; при желании в него можно дописать название сайта и цвет темы. Все файлы кладутся в корень сайта, чтобы пути в тегах и в манифесте совпадали с реальными.",
        "В размере 16×16 px детали логотипа сливаются, поэтому для маленьких иконок лучше простой знак, 1–2 буквы или эмодзи на контрастном фоне. Эмодзи рисуется шрифтом вашей системы, поэтому на Windows, macOS и Android он выглядит по-разному — в иконку попадёт вариант с вашего устройства. Все файлы создаются в браузере.",
      ],
      en: [
        "The favicon.ico file with 16, 32 and 48 px sizes is what browsers show in tabs and bookmarks, and many of them request /favicon.ico from the site root even without a tag. The 180×180 px apple-touch-icon is used by iPhone and iPad when a page is added to the Home Screen. The 192×192 and 512×512 px PNGs are listed in site.webmanifest — Android and installed web apps (PWAs) use them for the app icon and splash screen.",
        "site.webmanifest is a small JSON file listing the 192 and 512 px icons; you can add your site’s name and theme colour to it if you like. All the files go in the site root so the paths in the tags and the manifest match the real ones.",
        "At 16×16 px the details of a logo blur together, so small icons work best with a simple mark, 1–2 letters or an emoji on a contrasting background. Emoji are drawn with your system’s font, so they look different on Windows, macOS and Android — the icon gets the version from your device. All files are created in your browser.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какие файлы favicon нужны сайту?",
          a: "Основной набор — favicon.ico (внутри 16, 32 и 48 px) для браузеров, apple-touch-icon.png 180×180 для iPhone и iPad, а также PNG 192×192 и 512×512 вместе с файлом site.webmanifest для Android и PWA. Генератор создаёт всё это одним архивом, добавляя отдельные PNG 16, 32 и 48 px.",
        },
        {
          q: "Как подключить favicon в HTML?",
          a: 'Скопируйте файлы в корень сайта и добавьте в <head> теги: <link rel="icon" href="/favicon.ico"> для ICO, такой же тег с type="image/png" и sizes="32x32" для PNG-иконки, <link rel="apple-touch-icon" href="/apple-touch-icon.png"> для устройств Apple и <link rel="manifest" href="/site.webmanifest"> для манифеста. Готовый блок тегов генератор выдаёт вместе с файлами — его достаточно скопировать.',
        },
        {
          q: "Почему favicon не обновился после замены?",
          a: "Браузеры очень долго кэшируют иконки. Попробуйте обновить страницу с очисткой кэша (Ctrl+F5 или Ctrl+Shift+R), открыть сайт в режиме инкогнито или добавить к адресу иконки версию, например /favicon.ico?v=2. В поисковой выдаче иконка меняется только после повторного обхода сайта.",
        },
        {
          q: "Как сделать, чтобы иконка появилась в выдаче Яндекса и Google?",
          a: "Поисковики берут favicon с главной страницы — по тегам <link> или из /favicon.ico в корне, — поэтому файл должен быть доступен роботам. Google рекомендует квадратную иконку размером, кратным 48 px: подойдут 48×48 из favicon.ico и PNG 192×192. Иконка в выдаче появляется не сразу, а после переобхода сайта, иногда через несколько недель.",
        },
      ],
      en: [
        {
          q: "Which favicon files does a website need?",
          a: "The core set is favicon.ico (containing 16, 32 and 48 px) for browsers, a 180×180 apple-touch-icon.png for iPhone and iPad, and 192×192 and 512×512 PNGs with a site.webmanifest file for Android and PWAs. The generator creates all of this in one archive and adds separate 16, 32 and 48 px PNGs.",
        },
        {
          q: "How do I add a favicon to my HTML?",
          a: 'Copy the files to the site root and add these tags to <head>: <link rel="icon" href="/favicon.ico"> for the ICO file, a similar tag with type="image/png" and sizes="32x32" for a PNG icon, <link rel="apple-touch-icon" href="/apple-touch-icon.png"> for Apple devices and <link rel="manifest" href="/site.webmanifest"> for the manifest. The generator gives you the ready-made block of tags along with the files, so you only need to copy it.',
        },
        {
          q: "Why hasn’t my favicon updated after I replaced it?",
          a: "Browsers cache icons very persistently. Try a hard refresh (Ctrl+F5 or Ctrl+Shift+R), open the site in a private window, or add a version to the icon URL, such as /favicon.ico?v=2. In search results the icon only changes after the site is recrawled.",
        },
        {
          q: "How do I get my icon to show in Google and Yandex search results?",
          a: "Search engines take the favicon from the home page — via the <link> tags or /favicon.ico in the root — so the file must be accessible to crawlers. Google recommends a square icon whose size is a multiple of 48 px, such as the 48×48 inside favicon.ico or the 192×192 PNG. The icon doesn’t appear right away, only after the site is recrawled, which can take a few weeks.",
        },
      ],
    },
  },

  colors: {
    name: { ru: "Цвет с картинки", en: "Pick a color from an image" },
    title: {
      ru: "Определить цвет на картинке — палитра из фото онлайн",
      en: "Image Color Picker — Palette from Image, HEX and RGB",
    },
    h1: { ru: "Определить цвет на картинке", en: "Image Color Picker" },
    description: {
      ru: "Палитра из 3–16 главных цветов фото с долей каждого и пипетка для точного цвета пикселя: HEX, RGB, HSL. Экспорт списком HEX, CSS-переменными или JSON.",
      en: "Get 3–16 dominant colours from a photo with each one’s share, plus an eyedropper for any pixel: HEX, RGB, HSL. Export as a HEX list, CSS variables or JSON.",
    },
    lead: {
      ru: "Щёлкните по любой точке картинки, чтобы узнать её цвет, — или получите палитру основных цветов всего изображения.",
      en: "Click any point on the picture to get its exact colour — or pull out a palette of the image’s main colours.",
    },
    keywords: {
      ru: [
        "определить цвет на картинке",
        "узнать цвет по фото",
        "пипетка онлайн",
        "палитра из фото",
        "код цвета с картинки",
        "цвет пикселя онлайн",
        "подобрать палитру по фото",
        "определить цвет hex",
      ],
      en: [
        "image color picker",
        "color picker from image",
        "get color from image",
        "color palette from image",
        "hex color from picture",
        "eyedropper online",
        "extract colors from image",
      ],
    },
    howTo: {
      ru: [
        "Загрузите изображение — палитра основных цветов рассчитается автоматически.",
        "Выберите, сколько цветов показать в палитре, — от 3 до 16; у каждого указана доля в изображении.",
        "Щёлкните по картинке, чтобы взять пипеткой цвет конкретной точки, — появятся коды HEX, RGB и HSL.",
        "Скопируйте нужный код или экспортируйте палитру списком HEX, CSS-переменными или в JSON.",
      ],
      en: [
        "Open an image — a palette of its main colours is calculated automatically.",
        "Choose how many colours the palette shows, from 3 to 16; each one comes with its share of the image.",
        "Click the picture to sample a specific point with the eyedropper — you get its HEX, RGB and HSL codes.",
        "Copy the code you need or export the palette as a HEX list, CSS variables or JSON.",
      ],
    },
    about: {
      ru: [
        "Палитра строится методом медианного сечения (median cut): пиксели раскладываются по цветовому пространству и делятся на группы, пока их не станет столько, сколько вы выбрали; каждая группа даёт средний цвет и свою долю. Так видно не только, какие цвета есть на картинке, но и сколько их: фон может занимать больше половины кадра, а яркий акцент — пару процентов. Расчёт идёт в браузере, в Web Worker.",
        "Пипетка показывает цвет одной точки. На фотографиях соседние пиксели почти всегда немного различаются из-за шума и сжатия JPG, поэтому для «цвета неба» или «цвета стены» надёжнее палитра, а пипетка точнее всего работает на логотипах, скриншотах и плоской графике.",
        "HEX (например, #1E88E5) используют в CSS и дизайн-программах, RGB — в коде и графических редакторах, а HSL удобен, чтобы подобрать более светлый или тёмный оттенок того же цвета. Экспорт в CSS-переменные даёт готовый блок для таблицы стилей, JSON — для скриптов и дизайн-систем.",
      ],
      en: [
        "The palette is built with the median cut algorithm: pixels are laid out in colour space and split into groups until there are as many as you asked for, and each group yields an average colour and its share. So you see not only which colours are in the picture but also how much of each: the background may take up more than half the frame, a bright accent just a couple of percent. The calculation runs in your browser, in a Web Worker.",
        "The eyedropper shows the colour of a single point. In photos neighbouring pixels almost always differ slightly because of noise and JPG compression, so for “the colour of the sky” or “the colour of the wall” the palette is more reliable, while the eyedropper is most accurate on logos, screenshots and flat graphics.",
        "HEX (for example #1E88E5) is used in CSS and design apps, RGB in code and image editors, and HSL makes it easy to find a lighter or darker shade of the same colour. Exporting to CSS variables gives you a ready block for a stylesheet; JSON suits scripts and design systems.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как узнать код цвета с картинки?",
          a: "Загрузите изображение и щёлкните по нужной точке — пипетка покажет цвет в HEX, RGB и HSL, любой код можно скопировать. Если нужен основной цвет объекта, а не отдельного пикселя, посмотрите палитру: там цвета усреднены.",
        },
        {
          q: "Почему соседние точки на фото дают разные цвета?",
          a: "На фотографии почти не бывает идеально однотонных участков: шум матрицы, освещение и артефакты JPG дают небольшой разброс даже на ровной стене. Для усреднённого цвета используйте палитру, а пипеткой пользуйтесь на графике и скриншотах.",
        },
        {
          q: "Совпадёт ли цвет с тем, что указан в брендбуке?",
          a: "Не обязательно. Пипетка показывает цвет пикселей файла, приведённых к sRGB, а на фото или скриншоте логотипа он зависит от освещения, сжатия и цветового профиля. Точный фирменный цвет берите из брендбука или исходного макета, а картинку используйте для приблизительного подбора.",
        },
        {
          q: "Сколько цветов выбрать для палитры?",
          a: "Для цветовой схемы сайта или презентации обычно хватает 5–6 цветов — это основные тона изображения. 12–16 цветов покажут оттенки и мелкие акценты, но в палитре появятся и похожие друг на друга цвета.",
        },
      ],
      en: [
        {
          q: "How do I find the colour code of a point in an image?",
          a: "Open the image and click the point you need — the eyedropper shows the colour in HEX, RGB and HSL, and you can copy any of the codes. If you need the main colour of an object rather than of a single pixel, look at the palette: its colours are averaged.",
        },
        {
          q: "Why do neighbouring points in a photo give different colours?",
          a: "Photos almost never have perfectly uniform areas: sensor noise, lighting and JPG artefacts cause slight variation even on a plain wall. Use the palette for an averaged colour, and use the eyedropper on graphics and screenshots.",
        },
        {
          q: "Will the colour match the one in our brand guidelines?",
          a: "Not necessarily. The eyedropper shows the colour of the file’s pixels converted to sRGB, and in a photo or screenshot of a logo that colour depends on lighting, compression and the colour profile. Take the exact brand colour from the guidelines or the original design file, and use the picture for an approximate match.",
        },
        {
          q: "How many colours should the palette have?",
          a: "For a website or presentation colour scheme, 5–6 colours are usually enough — they are the image’s main tones. 12–16 colours reveal shades and small accents, but the palette will also include colours that look alike.",
        },
      ],
    },
  },

  "gif-maker": {
    name: { ru: "Создать GIF", en: "GIF maker" },
    title: {
      ru: "Создать GIF из картинок онлайн — анимация из фото",
      en: "GIF Maker — Create an Animated GIF from Images",
    },
    h1: { ru: "Создать GIF из картинок", en: "Make an Animated GIF from Images" },
    description: {
      ru: "Анимированный GIF из фото и картинок: порядок кадров, задержка каждого в мс, повтор бесконечно, один или N раз, ширина, вписать или заполнить, цвет фона.",
      en: "Make an animated GIF from photos or pictures: frame order, delay per frame in ms, loop forever, once or N times, output width, fit or fill, background colour.",
    },
    lead: {
      ru: "Добавьте картинки, расставьте их по порядку и задайте скорость — получится анимированный GIF, который можно сразу посмотреть и скачать.",
      en: "Add pictures, put them in order and set the speed — you get an animated GIF to preview and download straight away.",
    },
    keywords: {
      ru: [
        "создать gif из картинок",
        "сделать гифку из фото",
        "gif из фото онлайн",
        "сделать анимацию из картинок",
        "создать гиф онлайн",
        "склеить картинки в gif",
        "гифка из нескольких фото",
      ],
      en: ["gif maker", "make gif from images", "create animated gif", "photos to gif", "gif creator online", "images to animated gif"],
    },
    howTo: {
      ru: [
        "Добавьте картинки — каждая станет отдельным кадром.",
        "Расставьте кадры в нужном порядке и задайте задержку каждого в миллисекундах.",
        "Выберите ширину GIF, способ вписывания — целиком с полями или с заполнением кадра и обрезкой краёв, — цвет фона и число повторов: бесконечно, один раз или N раз.",
        "Посмотрите превью и скачайте готовый GIF.",
      ],
      en: [
        "Add pictures — each one becomes a separate frame.",
        "Put the frames in the order you want and set each frame’s delay in milliseconds.",
        "Choose the GIF width, the fit mode — whole picture with margins, or filling the frame with the edges trimmed — the background colour and the loop count: forever, once or N times.",
        "Check the preview and download the finished GIF.",
      ],
    },
    about: {
      ru: [
        "Задержка определяет, сколько кадр держится на экране: 100 мс — это 10 кадров в секунду, 500 мс — два кадра в секунду, как в спокойном слайд-шоу. GIF хранит задержку в сотых долях секунды, а браузеры показывают задержки 10 мс и меньше как 100 мс, поэтому для самой быстрой анимации ставьте не меньше 20 мс.",
        "У каждого кадра своя палитра до 256 цветов. Для графики, скриншотов, мемов и пиксель-арта этого хватает, а на фото с плавными переходами — небе, коже, градиентах — могут появиться заметные ступеньки между оттенками.",
        "Вес GIF растёт с шириной и числом кадров: для мессенджеров и сайтов обычно достаточно 480–800 px. Если картинки разных пропорций, режим вписывания покажет каждую целиком на фоне, а режим заполнения обрежет края, чтобы кадр был заполнен полностью. Кодирование выполняется в браузере, в Web Worker.",
      ],
      en: [
        "The delay sets how long each frame stays on screen: 100 ms means 10 frames per second, 500 ms two frames per second, like a calm slideshow. GIF stores delays in hundredths of a second, and browsers show delays of 10 ms or less as 100 ms, so for the fastest animation don’t go below 20 ms.",
        "Each frame gets its own palette of up to 256 colours. That’s plenty for graphics, screenshots, memes and pixel art, but photos with smooth transitions — sky, skin, gradients — may show visible steps between shades.",
        "A GIF’s size grows with its width and number of frames: 480–800 px wide is usually enough for messengers and websites. If the pictures have different proportions, fit mode shows each one whole on the background colour, while fill mode trims the edges so the frame is always full. Encoding runs in your browser, in a Web Worker.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как изменить скорость гифки?",
          a: "Скорость задаётся задержкой кадров: чем она меньше, тем быстрее анимация. 40–60 мс дают плавное движение, 100 мс — обычную гифку, 500–1000 мс — слайд-шоу. Чтобы ускорить уже готовый GIF, разбейте его на кадры и соберите заново с новой задержкой.",
        },
        {
          q: "Почему GIF получился таким тяжёлым?",
          a: "GIF сжимает хуже современных форматов, а вес растёт с каждым кадром и с каждым пикселем ширины. Уменьшите ширину, уберите лишние кадры или используйте более простую графику — однотонные области сжимаются намного лучше, чем фотографии.",
        },
        {
          q: "Можно ли сделать GIF, который проиграется один раз?",
          a: "Да, выберите повтор один раз или задайте нужное число повторов. Учтите, что некоторые мессенджеры и соцсети перекодируют GIF в видео и зацикливают его по-своему, не обращая внимания на эту настройку.",
        },
        {
          q: "Почему цвета в GIF отличаются от оригинала?",
          a: "Формат GIF хранит не больше 256 цветов на кадр, поэтому палитра каждого кадра подбирается заново, а близкие оттенки объединяются. На ярких плоских картинках разница почти не видна, на фотографиях с градиентами — заметна.",
        },
      ],
      en: [
        {
          q: "How do I change the speed of a GIF?",
          a: "Speed is set by the frame delay: the smaller it is, the faster the animation. 40–60 ms gives smooth motion, 100 ms a typical GIF, 500–1000 ms a slideshow. To speed up an existing GIF, split it into frames and reassemble it with a new delay.",
        },
        {
          q: "Why is my GIF so large?",
          a: "GIF compresses worse than modern formats, and its size grows with every frame and every pixel of width. Reduce the width, drop unnecessary frames or use simpler graphics — flat areas of colour compress far better than photos.",
        },
        {
          q: "Can I make a GIF that plays only once?",
          a: "Yes, set the loop to play once or enter the number of repeats you want. Bear in mind that some messengers and social networks convert GIFs to video and loop them their own way, ignoring this setting.",
        },
        {
          q: "Why do the colours in my GIF differ from the original?",
          a: "GIF stores no more than 256 colours per frame, so each frame’s palette is chosen afresh and similar shades are merged. On bright, flat pictures the difference is barely visible; on photos with gradients it’s noticeable.",
        },
      ],
    },
  },

  "gif-frames": {
    name: { ru: "GIF на кадры", en: "GIF to frames" },
    title: {
      ru: "Разбить GIF на кадры онлайн — скачать кадры в PNG",
      en: "Split GIF into Frames — Extract Every Frame as PNG",
    },
    h1: { ru: "Разбить GIF на кадры", en: "Split a GIF into Frames" },
    description: {
      ru: "Раскадровка анимированного GIF: число кадров, задержка каждого и общая длительность. Кадры собираются с учётом прозрачности и сохраняются в PNG, есть ZIP.",
      en: "Break an animated GIF into frames: frame count, each frame’s delay and the total duration. Frames are composited correctly and saved as PNG, singly or in a ZIP.",
    },
    lead: {
      ru: "Загрузите анимированный GIF — каждый кадр станет отдельной картинкой PNG, которую можно скачать по одной или все сразу архивом.",
      en: "Open an animated GIF — every frame becomes a separate PNG that you can download one at a time or all together in an archive.",
    },
    keywords: {
      ru: [
        "разбить gif на кадры",
        "разложить гифку на кадры",
        "извлечь кадры из gif",
        "gif в png по кадрам",
        "раскадровка gif онлайн",
        "сохранить кадр из гифки",
        "вытащить кадр из gif",
      ],
      en: ["split gif into frames", "gif frame extractor", "extract frames from gif", "gif to png frames", "gif splitter", "save a frame from a gif"],
    },
    howTo: {
      ru: [
        "Загрузите анимированный GIF.",
        "Посмотрите, сколько в нём кадров, какая задержка у каждого и сколько длится вся анимация.",
        "Скачайте нужные кадры по одному или все сразу кнопкой «Скачать всё (ZIP)» — каждый кадр сохраняется в PNG.",
      ],
      en: [
        "Open an animated GIF.",
        "See how many frames it has, the delay of each one and how long the whole animation lasts.",
        "Download the frames you need one by one or all at once with “Download all (ZIP)” — each frame is saved as a PNG.",
      ],
    },
    about: {
      ru: [
        "Кадры GIF часто хранятся не целиком: для экономии места кодировщик записывает только изменившуюся область, а метод очистки (disposal) говорит, что делать с предыдущим кадром. Инструмент собирает каждый кадр так же, как его показывает браузер, поэтому вы получаете полную картинку, а не обрывки на прозрачном фоне.",
        "Кадры сохраняются в PNG без потерь, в размере самой анимации и с прозрачностью, если она была в GIF. Из них можно собрать новую гифку в генераторе GIF — например, убрав лишние кадры или изменив скорость.",
        "Задержка каждого кадра показана в миллисекундах. Кадры с задержкой 10 мс и меньше браузеры показывают по 100 мс, поэтому общая длительность рассчитывается так, как анимация реально идёт на экране. Файл разбирается в браузере и никуда не отправляется.",
      ],
      en: [
        "GIF frames are often not stored in full: to save space, the encoder writes only the area that changed, and the disposal method says what to do with the previous frame. The tool composites each frame the way a browser displays it, so you get complete pictures rather than fragments on a transparent background.",
        "Frames are saved as lossless PNGs at the animation’s full size, with transparency if the GIF had it. You can build a new GIF from them in the GIF maker — dropping unwanted frames or changing the speed, for example.",
        "Each frame’s delay is shown in milliseconds. Browsers display frames with a delay of 10 ms or less for 100 ms, so the total duration is calculated the way the animation actually plays on screen. The file is processed in your browser and isn’t sent anywhere.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сохранить один кадр из гифки?",
          a: "Загрузите GIF, найдите нужный кадр в списке и скачайте его отдельно — он сохранится в PNG в полном размере анимации. Если нужно несколько кадров, проще скачать все архивом и удалить лишние.",
        },
        {
          q: "Почему в других программах кадры получаются с «дырами» или обрезанными?",
          a: "Многие GIF для экономии места хранят в кадре только изменившийся фрагмент. Простые извлекатели сохраняют эти фрагменты как есть, а здесь каждый кадр накладывается на предыдущие по правилам формата — получается ровно то, что вы видите при воспроизведении.",
        },
        {
          q: "Можно ли разбить на кадры анимированный WebP или видео?",
          a: "Нет, инструмент работает только с GIF. Анимированные WebP и AVIF в остальных инструментах открываются по первому кадру, а видеофайлы в этом разделе не поддерживаются.",
        },
        {
          q: "Как изменить скорость или порядок кадров GIF?",
          a: "Разбейте GIF на кадры, скачайте архив и загрузите кадры в генератор GIF: там можно поменять порядок, удалить лишние кадры и задать новую задержку для каждого.",
        },
      ],
      en: [
        {
          q: "How do I save a single frame from a GIF?",
          a: "Open the GIF, find the frame you want in the list and download it on its own — it’s saved as a PNG at the animation’s full size. If you need several frames, it’s easier to download them all as an archive and delete the rest.",
        },
        {
          q: "Why do frames extracted by other programs look cut off or full of holes?",
          a: "Many GIFs save space by storing only the changed fragment in each frame. Simple extractors save those fragments as they are, whereas here each frame is layered over the previous ones following the format’s rules — you get exactly what you see during playback.",
        },
        {
          q: "Can I split an animated WebP or a video into frames?",
          a: "No, the tool works only with GIF. The other tools open animated WebP and AVIF files using just the first frame, and video files aren’t supported in this section.",
        },
        {
          q: "How do I change the speed or order of a GIF’s frames?",
          a: "Split the GIF into frames, download the archive and load the frames into the GIF maker: there you can reorder them, remove unwanted ones and set a new delay for each frame.",
        },
      ],
    },
  },

  dpi: {
    name: { ru: "Изменить DPI", en: "Change DPI" },
    title: {
      ru: "Изменить DPI фото онлайн — 300 dpi без пересжатия",
      en: "Change Image DPI Online — Set 300 DPI Without Re-encoding",
    },
    h1: { ru: "Изменить DPI фото", en: "Change Image DPI" },
    description: {
      ru: "Проверка и смена DPI у JPG и PNG без перекодирования: пиксели не меняются, правится только разрешение для печати. Калькулятор размера отпечатка в см и дюймах.",
      en: "Check and change JPG and PNG DPI without re-encoding: pixels stay the same, only the print resolution changes. Print size calculator in cm and inches.",
    },
    lead: {
      ru: "Узнайте текущее разрешение файла и запишите новое — например, 300 dpi для типографии, — не трогая ни одного пикселя.",
      en: "See a file’s current resolution and write a new one — say, 300 dpi for a print shop — without touching a single pixel.",
    },
    keywords: {
      ru: [
        "изменить dpi фото",
        "изменить dpi онлайн",
        "поменять разрешение на 300 dpi",
        "как узнать dpi фото",
        "сделать 300 dpi",
        "dpi картинки онлайн",
        "разрешение фото для печати",
      ],
      en: ["change image dpi", "change dpi online", "convert image to 300 dpi", "check image dpi", "set dpi of jpg", "image dpi for printing"],
    },
    howTo: {
      ru: [
        "Добавьте JPG или PNG — сразу видно текущее значение DPI, если оно записано в файле.",
        "Введите новое значение, например 300.",
        "Посмотрите в калькуляторе, какого размера получится отпечаток в сантиметрах и дюймах.",
        "Скачайте файлы — изображение останется прежним, изменится только записанное разрешение.",
      ],
      en: [
        "Add a JPG or PNG — you’ll see the current DPI right away if the file has one recorded.",
        "Enter the new value, for example 300.",
        "Check the calculator to see how big the print will be in centimetres and inches.",
        "Download the files — the image stays the same, only the recorded resolution changes.",
      ],
    },
    about: {
      ru: [
        "DPI (точек на дюйм) — не качество и не размер картинки, а пометка в файле: сколько пикселей укладывать в дюйм при печати. Фото 3000×2000 px при 300 dpi печатается размером 25,4×16,9 см, а при 72 dpi — 105,8×70,6 см, хотя пикселей в нём одинаково. На экране DPI ни на что не влияет.",
        "Нужное число пикселей считается так: пиксели = сантиметры ÷ 2,54 × dpi. Для отпечатка 10×15 см при 300 dpi нужно 1181×1772 px, для листа A4 (21×29,7 см) — 2480×3508 px. Если пикселей меньше, повышение DPI не добавит деталей — отпечаток просто станет меньше.",
        "Новое значение записывается без перекодирования: в JPG — в заголовок JFIF и в поле разрешения EXIF, если оно есть, в PNG — в блок pHYs. Сжатые данные копируются как есть, поэтому качество не меняется, а вес файла остаётся практически прежним. Поддерживаются только JPG и PNG; файлы обрабатываются в браузере.",
      ],
      en: [
        "DPI (dots per inch) is neither quality nor image size but a note in the file saying how many pixels to fit into an inch when printing. A 3000×2000 px photo prints at 25.4×16.9 cm (10×6.67 in) at 300 dpi and at 105.8×70.6 cm at 72 dpi, yet it has exactly the same pixels. On screen, DPI makes no difference at all.",
        "The pixels you need are calculated as pixels = cm ÷ 2.54 × dpi, or simply inches × dpi. A 4×6 in print at 300 dpi needs 1200×1800 px, and an A4 sheet (21×29.7 cm) needs 2480×3508 px. If there are fewer pixels, raising the DPI adds no detail — the print just comes out smaller.",
        "The new value is written without re-encoding: into the JFIF header of a JPG and its EXIF resolution field if there is one, or into the pHYs chunk of a PNG. The compressed data is copied as is, so quality doesn’t change and the file size stays practically the same. Only JPG and PNG are supported; files are processed in your browser.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Станет ли фото качественнее, если поставить 300 dpi?",
          a: "Нет. DPI меняет только то, в каком размере программы и принтер выводят картинку, а число пикселей и детали остаются прежними. Чтобы фото хорошо напечаталось при 300 dpi, в нём должно быть достаточно пикселей для нужного размера отпечатка.",
        },
        {
          q: "Какой DPI нужен для печати?",
          a: "Для фотографий, документов и полиграфии стандарт — 300 dpi. Плакаты и баннеры, которые рассматривают издалека, обычно печатают при 150–200 dpi и ниже. Для сайтов и соцсетей DPI значения не имеет — важны только размеры в пикселях.",
        },
        {
          q: "Как узнать DPI фото?",
          a: "Загрузите файл — инструмент прочитает разрешение из заголовка JFIF и EXIF у JPG или из блока pHYs у PNG. Если значение не записано, программы обычно считают, что у картинки 72 или 96 dpi.",
        },
        {
          q: "Требуют фото 300 dpi для документов — что делать?",
          a: "Поставьте 300 dpi и проверьте размер в пикселях. Например, фото 35×45 мм при 300 dpi должно иметь 413×531 px — если пикселей меньше, одной смены DPI недостаточно. Нужный размер удобно задать в инструменте изменения размера: для документных пресетов 300 dpi там записывается автоматически.",
        },
        {
          q: "Почему после смены DPI картинка в Word стала другого размера?",
          a: "Word, Photoshop и программы вёрстки переводят пиксели в сантиметры по DPI: при 300 dpi картинка вставится примерно вчетверо меньше, чем при 72 dpi. Уже вставленное изображение не изменится — вставьте файл заново.",
        },
      ],
      en: [
        {
          q: "Will my photo look better at 300 dpi?",
          a: "No. DPI only changes the size at which programs and printers output the picture; the number of pixels and the detail stay the same. For a photo to print well at 300 dpi, it needs enough pixels for the print size you want.",
        },
        {
          q: "What DPI do I need for printing?",
          a: "300 dpi is the standard for photos, documents and commercial print. Posters and banners viewed from a distance are usually printed at 150–200 dpi or less. For websites and social media DPI doesn’t matter — only the pixel dimensions count.",
        },
        {
          q: "How do I check a photo’s DPI?",
          a: "Add the file — the tool reads the resolution from the JFIF header and EXIF of a JPG or from the pHYs chunk of a PNG. If no value is recorded, programs usually assume 72 or 96 dpi.",
        },
        {
          q: "A form asks for a 300 dpi photo — what should I do?",
          a: "Set 300 dpi and check the pixel dimensions. For example, a 35×45 mm photo at 300 dpi should be 413×531 px — if it has fewer pixels, changing the DPI alone isn’t enough. You can set the required size in the resize tool, where document presets write 300 dpi automatically.",
        },
        {
          q: "Why did the picture change size in Word after I changed the DPI?",
          a: "Word, Photoshop and layout programs convert pixels to centimetres or inches using the DPI: at 300 dpi a picture is inserted about four times smaller than at 72 dpi. An image that’s already placed won’t change — insert the file again.",
        },
      ],
    },
  },

  svg: {
    name: { ru: "Просмотр SVG", en: "SVG viewer" },
    title: {
      ru: "Просмотр и оптимизация SVG онлайн — экспорт в PNG",
      en: "SVG Viewer and Optimizer — Minify SVG, Export to PNG",
    },
    h1: { ru: "Просмотр и оптимизация SVG", en: "SVG Viewer and Optimizer" },
    description: {
      ru: "Безопасный просмотр SVG с кодом, размерами и viewBox, очистка от комментариев, метаданных и данных редакторов, округление координат, экспорт в PNG, JPG и WebP.",
      en: "View an SVG safely with its code, size and viewBox; strip comments, metadata and editor data, round path coordinates, and export PNG, JPG or WebP at any width.",
    },
    lead: {
      ru: "Откройте SVG, чтобы посмотреть картинку и её код, уменьшить файл безопасной очисткой или сохранить в PNG нужной ширины.",
      en: "Open an SVG to view the picture and its code, shrink the file with a safe clean-up, or save it as a PNG at the width you need.",
    },
    keywords: {
      ru: ["просмотр svg онлайн", "оптимизация svg", "сжать svg", "svg в png", "открыть svg файл", "уменьшить размер svg", "svg в jpg"],
      en: ["svg viewer", "svg optimizer", "minify svg", "svg to png", "compress svg", "open svg file online", "svg to jpg"],
    },
    howTo: {
      ru: [
        "Откройте SVG-файл — он покажется как изображение, а рядом будут размеры, viewBox и исходный код.",
        "Переключите фон, чтобы проверить, как иконка смотрится на светлой и тёмной подложке.",
        "Запустите оптимизацию, при желании включите округление координат путей, сравните размер до и после и скачайте оптимизированный SVG.",
        "Чтобы получить растровую картинку, выберите PNG, JPG или WebP и ширину — 1×–4× или своё значение в px.",
      ],
      en: [
        "Open an SVG file — it’s shown as an image, with its size, viewBox and source code alongside.",
        "Switch the background to check how the icon looks on light and dark surfaces.",
        "Run the optimiser, optionally turn on rounding of path coordinates, compare the size before and after, and download the optimised SVG.",
        "For a raster image, choose PNG, JPG or WebP and the width — 1×–4× or your own value in px.",
      ],
    },
    about: {
      ru: [
        "SVG показывается как обычное изображение, а не встраивается в страницу, поэтому скрипты внутри файла не выполняются, а его стили не влияют на сайт. Внешние файлы и шрифты, на которые ссылается SVG, не подгружаются: если текст набран нестандартным шрифтом, переведите его в кривые в редакторе.",
        "Оптимизация удаляет то, что не влияет на картинку: комментарии, блок <metadata>, служебные данные Inkscape, Sodipodi и Illustrator, лишние пробелы и переносы строк. Объявление XML, элементы <use>, <animate> и <style> остаются, поэтому ссылки, анимация и стили продолжают работать. Округление координат путей уменьшает файл сильнее, но на мелких деталях может дать заметные искажения — сравните результат с исходником.",
        "Экспорт в PNG, JPG или WebP нужен там, где SVG не принимают: в соцсетях, мессенджерах, документах и на маркетплейсах. Вектор отрисовывается заново под выбранную ширину, поэтому версии 2× и 4× получаются такими же чёткими — это удобно для экранов с высокой плотностью пикселей. Файл обрабатывается в браузере.",
      ],
      en: [
        "The SVG is displayed as an ordinary image rather than embedded in the page, so scripts inside the file don’t run and its styles can’t affect the site. External files and fonts referenced by the SVG aren’t loaded: if text uses an unusual font, convert it to outlines in your editor.",
        "Optimisation removes what doesn’t affect the picture: comments, the <metadata> block, Inkscape, Sodipodi and Illustrator editor data, and redundant spaces and line breaks. The XML declaration and the <use>, <animate> and <style> elements stay, so references, animation and styles keep working. Rounding path coordinates shrinks the file further but can visibly distort small details — compare the result with the original.",
        "Exporting to PNG, JPG or WebP helps wherever SVG isn’t accepted: social networks, messengers, documents and marketplaces. The vector is redrawn at the chosen width, so 2× and 4× versions are just as sharp — handy for high-density screens. The file is processed in your browser.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Безопасно ли открывать SVG из незнакомого источника?",
          a: "Здесь — да: файл показывается как изображение, и встроенные в него скрипты не запускаются. Но SVG — это код, и если вставить такой файл прямо в разметку своего сайта, скрипты внутри него могут сработать, поэтому чужие SVG стоит проверять перед публикацией.",
        },
        {
          q: "Насколько уменьшится SVG после оптимизации?",
          a: "Зависит от того, откуда файл. Экспорт из Inkscape и Illustrator часто содержит много служебных данных и заметно худеет, а уже оптимизированные иконки почти не меняются. Размер до и после инструмент показывает сразу.",
        },
        {
          q: "Как перевести SVG в PNG с прозрачным фоном?",
          a: "Выберите экспорт в PNG и ширину — прозрачные области останутся прозрачными. Для экранов Retina возьмите масштаб 2× или 3× от исходного размера. JPG прозрачность не хранит, поэтому для иконок и логотипов выбирайте PNG или WebP.",
        },
        {
          q: "Почему текст в SVG отображается другим шрифтом?",
          a: "SVG ссылается на шрифт по имени, а внешние файлы шрифтов при показе не загружаются. Если такого шрифта нет в системе, браузер подставит похожий. Надёжное решение — перевести текст в кривые (контуры) в редакторе перед сохранением.",
        },
        {
          q: "Изменится ли внешний вид SVG после оптимизации?",
          a: "Безопасная очистка удаляет только невидимые данные, и картинка остаётся прежней. Внешний вид может немного измениться лишь при округлении координат, поэтому после него сравните результат с оригиналом.",
        },
      ],
      en: [
        {
          q: "Is it safe to open an SVG from an unknown source?",
          a: "Here, yes: the file is displayed as an image, so any scripts embedded in it don’t run. But an SVG is code, and if you paste such a file straight into your site’s markup, scripts inside it can execute — so check third-party SVGs before publishing them.",
        },
        {
          q: "How much smaller will my SVG get?",
          a: "It depends on where the file came from. Exports from Inkscape and Illustrator often carry a lot of editor data and shrink noticeably, while icons that are already optimised barely change. The tool shows the size before and after straight away.",
        },
        {
          q: "How do I convert an SVG to a PNG with a transparent background?",
          a: "Choose PNG export and a width — transparent areas stay transparent. For Retina screens, use 2× or 3× the original size. JPG doesn’t store transparency, so pick PNG or WebP for icons and logos.",
        },
        {
          q: "Why does the text in my SVG show up in a different font?",
          a: "An SVG refers to a font by name, and external font files aren’t loaded when it’s displayed. If that font isn’t installed on the system, the browser substitutes a similar one. The reliable fix is to convert the text to outlines in your editor before saving.",
        },
        {
          q: "Will the SVG look different after optimisation?",
          a: "The safe clean-up removes only invisible data, so the picture stays the same. Its appearance can change slightly only when coordinates are rounded, so compare the result with the original after doing that.",
        },
      ],
    },
  },

  "pixel-art": {
    name: { ru: "Пиксель-арт", en: "Pixel art" },
    title: {
      ru: "Пиксель-арт редактор онлайн — сетка до 64×64 и анимация",
      en: "Pixel Art Maker — Draw on a Grid up to 64×64, Export GIF",
    },
    h1: { ru: "Пиксель-арт редактор онлайн", en: "Pixel Art Maker" },
    description: {
      ru: "Рисование по клеткам на сетке от 8×8 до 64×64: карандаш, ластик, заливка, пипетка, зеркальное рисование, кадры анимации. Экспорт в PNG с увеличением и GIF.",
      en: "Draw on a grid from 8×8 to 64×64 with pencil, eraser, fill, colour picker, mirror drawing and animation frames. Export scaled PNG, JPG, WebP or an animated GIF.",
    },
    lead: {
      ru: "Рисуйте по клеткам, добавляйте кадры анимации и сохраняйте результат увеличенной картинкой PNG или анимированным GIF.",
      en: "Draw cell by cell, add animation frames and save the result as an upscaled PNG or an animated GIF.",
    },
    keywords: {
      ru: [
        "пиксель арт онлайн",
        "рисовать по клеточкам онлайн",
        "пиксельный редактор",
        "нарисовать пиксель арт",
        "пиксель арт гиф",
        "редактор спрайтов онлайн",
        "пиксельная графика онлайн",
      ],
      en: ["pixel art maker", "pixel art editor online", "draw pixel art", "sprite editor online", "pixel art gif maker", "8-bit art maker"],
    },
    howTo: {
      ru: [
        "Выберите размер сетки — от 8×8 до 64×64 клеток.",
        "Рисуйте карандашом, стирайте ластиком, заливайте области и берите цвет пипеткой; для симметричных рисунков включите зеркальное рисование по X или Y. Ошибки исправляются отменой и повтором действий.",
        "Для анимации добавляйте, дублируйте и удаляйте кадры.",
        "Экспортируйте PNG, JPG или WebP с масштабом от 1 до 32 px на клетку, отступом и прозрачным фоном — или сохраните анимацию в GIF.",
      ],
      en: [
        "Choose the grid size — from 8×8 to 64×64 cells.",
        "Draw with the pencil, erase with the eraser, fill areas and pick colours with the eyedropper; for symmetrical drawings, turn on mirror drawing along X or Y. Mistakes are fixed with undo and redo.",
        "For animation, add, duplicate and delete frames.",
        "Export a PNG, JPG or WebP at 1 to 32 px per cell, with padding and a transparent background — or save the animation as a GIF.",
      ],
    },
    about: {
      ru: [
        "Масштаб экспорта задаёт, сколько пикселей займёт одна клетка: рисунок 32×32 при масштабе 16 станет картинкой 512×512 px. Каждая клетка превращается в ровный квадрат одного цвета, поэтому края остаются резкими, без размытия, — именно так и должен выглядеть пиксель-арт.",
        "Зеркальное рисование по оси X или Y повторяет каждый штрих симметрично — это вдвое ускоряет работу над персонажами, иконками и узорами. Кадры анимации удобно начинать с дубликата предыдущего и менять только то, что движется. Редактором можно пользоваться и с клавиатуры.",
        "Прозрачный фон сохраняется в PNG, WebP и GIF (в GIF — без полупрозрачности). В GIF помещается до 256 цветов на кадр — для пиксель-арта этого обычно с запасом, а если цветов больше, палитра подбирается автоматически. Редактор работает в браузере, без регистрации.",
      ],
      en: [
        "The export scale sets how many pixels one cell takes up: a 32×32 drawing at scale 16 becomes a 512×512 px image. Each cell turns into a clean square of a single colour, so the edges stay crisp with no blurring — exactly how pixel art should look.",
        "Mirror drawing along the X or Y axis repeats every stroke symmetrically, halving the work on characters, icons and patterns. Animation frames are easiest to start from a duplicate of the previous one, changing only what moves. The editor can be used from the keyboard as well.",
        "A transparent background is kept in PNG, WebP and GIF (in GIF without semi-transparency). GIF holds up to 256 colours per frame — usually more than enough for pixel art, and if there are more, the palette is chosen automatically. The editor runs in your browser, with no sign-up.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой размер сетки выбрать?",
          a: "16×16 — классика для иконок и игровых предметов, 32×32 — для персонажей с деталями, 64×64 — для сцен и портретов. Начинать лучше с маленькой сетки: чем меньше клеток, тем важнее каждая и тем быстрее складывается узнаваемый рисунок.",
        },
        {
          q: "Как сохранить пиксель-арт без размытия?",
          a: "Экспортируйте сразу с нужным масштабом, например 16 или 32 px на клетку, а не увеличивайте маленький PNG в других программах — большинство из них сглаживает пиксели. Для соцсетей берите итоговый размер от 1000 px, чтобы их собственное сжатие не размыло края.",
        },
        {
          q: "Как сделать анимированный пиксель-арт?",
          a: "Добавьте кадры — удобнее дублировать предыдущий и менять в нём только движущиеся клетки — и экспортируйте результат в GIF. Анимация сохраняется только в GIF: анимированные PNG и WebP не создаются.",
        },
        {
          q: "Можно ли превратить фото в пиксель-арт?",
          a: "Редактор предназначен для рисования с нуля, загрузка фото в нём не предусмотрена. Чтобы получить пиксельный эффект на фотографии, воспользуйтесь фильтром пикселизации в инструменте фильтров: он разобьёт снимок на крупные квадраты.",
        },
      ],
      en: [
        {
          q: "Which grid size should I choose?",
          a: "16×16 is the classic for icons and game items, 32×32 for characters with some detail, and 64×64 for scenes and portraits. It’s best to start small: the fewer the cells, the more each one matters and the faster a recognisable drawing comes together.",
        },
        {
          q: "How do I save pixel art without blurring?",
          a: "Export at the scale you need straight away, such as 16 or 32 px per cell, rather than enlarging a small PNG in other programs — most of them smooth the pixels. For social media, aim for a final size of 1000 px or more so the platform’s own compression doesn’t blur the edges.",
        },
        {
          q: "How do I make animated pixel art?",
          a: "Add frames — it’s easiest to duplicate the previous one and change only the cells that move — and export the result as a GIF. Animation is saved only as GIF: animated PNG and WebP aren’t produced.",
        },
        {
          q: "Can I turn a photo into pixel art?",
          a: "The editor is meant for drawing from scratch and doesn’t import photos. To give a photo a pixelated look, use the pixelate filter in the filters tool: it breaks the picture into large squares.",
        },
      ],
    },
  },

  compare: {
    name: { ru: "Сравнить картинки", en: "Compare images" },
    title: {
      ru: "Сравнить две картинки онлайн — ползунок и поиск отличий",
      en: "Compare Two Images Online — Slider and Difference View",
    },
    h1: { ru: "Сравнить две картинки", en: "Compare Two Images" },
    description: {
      ru: "Сравнение двух изображений: ползунок «до/после», режим «рядом» и подсветка отличающихся пикселей с порогом чувствительности. Видны размеры и вес файлов.",
      en: "Compare two images with a before/after slider, side-by-side view and a difference mode highlighting changed pixels above a threshold. Dimensions and file sizes.",
    },
    lead: {
      ru: "Загрузите две версии изображения — ползунок и режим разницы покажут, чем они отличаются, вплоть до отдельных пикселей.",
      en: "Load two versions of an image — the slider and the difference mode show how they differ, down to individual pixels.",
    },
    keywords: {
      ru: [
        "сравнить две картинки",
        "сравнить два изображения онлайн",
        "найти отличия на картинках",
        "сравнить фото до и после",
        "сравнение изображений онлайн",
        "разница между двумя картинками",
      ],
      en: [
        "compare two images",
        "image diff online",
        "compare images side by side",
        "before and after slider",
        "find differences between two images",
        "image comparison tool",
      ],
    },
    howTo: {
      ru: [
        "Загрузите два изображения: первое — «до», второе — «после».",
        "Выберите режим: ползунок, два изображения рядом или разница.",
        "Двигайте ползунок мышью или стрелками на клавиатуре; в режиме разницы настройте порог, чтобы скрыть незначительные расхождения.",
        "Сравните размеры в пикселях и вес файлов.",
      ],
      en: [
        "Load two images: the first is “before”, the second “after”.",
        "Choose a mode: slider, side by side or difference.",
        "Drag the slider with the mouse or move it with the arrow keys; in difference mode, adjust the threshold to hide insignificant deviations.",
        "Compare the pixel dimensions and file sizes.",
      ],
    },
    about: {
      ru: [
        "Ползунок «до/после» накладывает картинки друг на друга, а границу между ними можно двигать мышью или стрелками. Так удобно оценивать сжатие, ретушь, фильтры и шумоподавление: артефакты JPG и потеря мелких деталей видны лучше, чем при переключении между двумя файлами.",
        "Режим разницы подсвечивает пиксели, которые отличаются сильнее заданного порога. При нулевом пороге видны даже незаметные глазу изменения от пересжатия, а с повышением порога остаются только настоящие правки: добавленный текст, сдвинутый элемент интерфейса, исправленная деталь. Это пригодится для сверки версий макета, скриншотов сайта до и после изменений и поиска отличий на картинках.",
        "Изображения разного размера приводятся к одному масштабу, поэтому можно сравнить, например, оригинал и уменьшенную копию. Для каждой картинки указаны размеры в пикселях и вес файла. Сравнение выполняется в браузере — файлы никуда не загружаются.",
      ],
      en: [
        "The before/after slider lays the pictures on top of each other, and you can move the dividing line with the mouse or the arrow keys. It’s a convenient way to judge compression, retouching, filters and noise reduction: JPG artefacts and lost fine detail are easier to see than when switching between two files.",
        "Difference mode highlights pixels that differ by more than the chosen threshold. At zero threshold even changes from re-compression that the eye can’t see show up; as you raise it, only real edits remain: added text, a shifted interface element, a corrected detail. It’s useful for checking design versions, website screenshots before and after a change, and spot-the-difference puzzles.",
        "Images of different sizes are scaled to match, so you can compare, for example, an original and a downsized copy. Each picture’s pixel dimensions and file size are shown. The comparison runs in your browser — the files aren’t uploaded anywhere.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как найти отличия между двумя почти одинаковыми картинками?",
          a: "Включите режим разницы — изменённые пиксели будут подсвечены. Если подсветка покрывает всю картинку из-за шума или сжатия, увеличьте порог: останутся только заметные расхождения.",
        },
        {
          q: "Можно ли сравнить картинки разного размера?",
          a: "Да, изображения приводятся к одному размеру. Учтите, что масштабирование само немного меняет пиксели, поэтому в режиме разницы для таких пар стоит поднять порог, иначе подсветится почти вся картинка.",
        },
        {
          q: "Как проверить, насколько сжатие испортило фото?",
          a: "Загрузите оригинал и сжатую версию и проведите ползунком по важным участкам — лицам, тексту, мелким деталям и плавным переходам. Режим разницы покажет, где кодировщик изменил пиксели сильнее всего, а по весу файлов видно, сколько удалось сэкономить.",
        },
        {
          q: "Как сравнить скриншоты сайта до и после изменений?",
          a: "Снимите скриншоты одной и той же области с одинаковым масштабом страницы, загрузите оба и включите режим разницы с небольшим порогом: подсветятся сдвинутые блоки, изменённый текст и цвета. Если страница была прокручена по-разному, отличия окажутся везде.",
        },
      ],
      en: [
        {
          q: "How do I find the differences between two nearly identical pictures?",
          a: "Switch on difference mode — changed pixels are highlighted. If the highlighting covers the whole picture because of noise or compression, raise the threshold so that only noticeable differences remain.",
        },
        {
          q: "Can I compare images of different sizes?",
          a: "Yes, the images are scaled to the same size. Keep in mind that scaling itself changes pixels slightly, so for such pairs raise the threshold in difference mode, or almost the whole picture will light up.",
        },
        {
          q: "How can I check how much compression has damaged a photo?",
          a: "Load the original and the compressed version and sweep the slider over the important areas — faces, text, fine detail and smooth gradients. Difference mode shows where the encoder changed pixels the most, and the file sizes tell you how much you saved.",
        },
        {
          q: "How do I compare website screenshots before and after a change?",
          a: "Capture the same area at the same page zoom, load both screenshots and turn on difference mode with a low threshold: shifted blocks, changed text and colours are highlighted. If the page was scrolled differently, differences will show up everywhere.",
        },
      ],
    },
  },
};
