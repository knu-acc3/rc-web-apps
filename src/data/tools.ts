import { canonicalizeToolSlug } from "@/src/seo/canonicalSlugs";

export type ToolDataType = 'text' | 'json' | 'image' | 'audio' | 'video' | 'pdf' | 'csv' | 'svg';

export interface ToolContract {
  readonly accepts: readonly ToolDataType[];
  readonly produces: readonly ToolDataType[];
}

export interface Tool {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  keywords: string[];
  icon: string;
  groupId: string;
  featured?: boolean;
  implemented?: boolean;
  /** Hide from homepage but keep accessible by direct URL */
  hidden?: boolean;
  seoTitle?: string;
  seoTitleEn?: string;
  seoDescription?: string;
  seoDescriptionEn?: string;
  /** H1 заголовок (если нужен отдельный от seoTitle) */
  seoH1?: string;
  seoH1En?: string;
  contract?: ToolContract;
}

export interface ToolGroup {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  icon: string;
  color: string;
}

export const toolGroups: ToolGroup[] = [
  {
    id: "pdf",
    slug: "pdf",
    name: "PDF-инструменты",
    nameEn: "PDF Tools",
    description: "Просмотр, сжатие, объединение и конвертация PDF",
    descriptionEn: "View, compress, merge and convert PDF files",
    icon: "PictureAsPdf",
    color: "#D32F2F",
  },
  {
    id: "images",
    slug: "images",
    name: "Изображения и Графика",
    nameEn: "Images & Graphics",
    description: "Сжатие, ресайз, фильтры и генерация изображений",
    descriptionEn: "Compress, resize, filter and generate images",
    icon: "Image",
    color: "#984061",
  },
  {
    id: "text",
    slug: "text",
    name: "Текст и Контент",
    nameEn: "Text & Content",
    description: "Форматирование, подсчёт, конвертация и обработка текста",
    descriptionEn: "Format, count, convert and process text",
    icon: "TextFields",
    color: "#006874",
  },
  {
    id: "developers",
    slug: "developers",
    name: "Для разработчиков",
    nameEn: "Developer Tools",
    description: "CSS, JSON, regex, HTTP-коды и утилиты для девелоперов",
    descriptionEn: "CSS, JSON, regex, HTTP codes and developer utilities",
    icon: "Code",
    color: "#4A6741",
  },
  {
    id: "seo",
    slug: "seo",
    name: "SEO-инструменты",
    nameEn: "SEO Tools",
    description: "Мета-теги, Open Graph, анализ заголовков",
    descriptionEn: "Meta tags, Open Graph, heading analysis",
    icon: "TravelExplore",
    color: "#28B463",
  },
  {
    id: "converters",
    slug: "converters",
    name: "Конвертеры",
    nameEn: "Converters",
    description: "Конвертация единиц измерения, цветов и многого другого",
    descriptionEn: "Convert units, colors and more",
    icon: "SwapHoriz",
    color: "#E83322",
  },
  {
    id: "calculators",
    slug: "calculators",
    name: "Калькуляторы",
    nameEn: "Calculators",
    description: "Научные, финансовые и специализированные калькуляторы",
    descriptionEn: "Scientific, financial and specialized calculators",
    icon: "Calculate",
    color: "#262B31",
  },
  {
    id: "color",
    slug: "color",
    name: "Цвета и Палитры",
    nameEn: "Colors & Palettes",
    description: "Пипетка, палитры, градиенты и преобразование цветов",
    descriptionEn: "Color picker, palettes, gradients and color conversion",
    icon: "Palette",
    color: "#E74C3C",
  },
  {
    id: "generators",
    slug: "generators",
    name: "Генераторы",
    nameEn: "Generators",
    description: "Генерация паролей, UUID, QR-кодов и случайных данных",
    descriptionEn: "Generate passwords, UUIDs, QR codes and random data",
    icon: "AutoAwesome",
    color: "#5B6470",
  },
  {
    id: "datetime",
    slug: "datetime",
    name: "Дата и Время",
    nameEn: "Date & Time",
    description: "Часовые пояса, таймеры, календари и расчёты дат",
    descriptionEn: "Time zones, timers, calendars and date calculations",
    icon: "Schedule",
    color: "#7D5260",
  },
  {
    id: "symbols",
    slug: "symbols",
    name: "Символы и Emoji",
    nameEn: "Symbols & Emoji",
    description: "Каталог специальных символов и эмодзи с копированием",
    descriptionEn: "Catalog of special symbols and emoji with one-click copy",
    icon: "EmojiSymbols",
    color: "#8E44AD",
  },
  {
    id: "encoding",
    slug: "encoding",
    name: "Кодирование и Декодирование",
    nameEn: "Encoding & Decoding",
    description: "Base64, URL, HTML кодирование и декодирование",
    descriptionEn: "Base64, URL, HTML encoding and decoding",
    icon: "LockOpen",
    color: "#2E86C1",
  },
  {
    id: "security",
    slug: "security",
    name: "Данные и Безопасность",
    nameEn: "Data & Security",
    description: "Хэши, шифрование, валидация и генерация данных",
    descriptionEn: "Hashes, encryption, validation and data generation",
    icon: "Security",
    color: "#6C3483",
  },
  {
    id: "math",
    slug: "math",
    name: "Математика и Статистика",
    nameEn: "Math & Statistics",
    description: "Уравнения, графики, матрицы и статистический анализ",
    descriptionEn: "Equations, graphs, matrices and statistical analysis",
    icon: "Functions",
    color: "#5B5F97",
  },
  {
    id: "finance",
    slug: "finance",
    name: "Финансы",
    nameEn: "Finance",
    description: "Бюджет, инвестиции, кредиты и финансовые расчёты",
    descriptionEn: "Budget, investments, loans and financial calculations",
    icon: "AccountBalance",
    color: "#1A5276",
  },
  {
    id: "health",
    slug: "health",
    name: "Здоровье и Фитнес",
    nameEn: "Health & Fitness",
    description: "BMI, калории, пульс, сон и расчёты тренировок",
    descriptionEn: "BMI, calories, heart rate, sleep and workout calculations",
    icon: "FitnessCenter",
    color: "#A93226",
  },
  {
    id: "entertainment",
    slug: "entertainment",
    name: "Развлечения и Рандом",
    nameEn: "Entertainment & Random",
    description: "Рандомайзеры, генератор мемов, колесо фортуны",
    descriptionEn: "Randomizers, meme generator, wheel of fortune",
    icon: "Casino",
    color: "#D35400",
  },
  {
    id: "media",
    slug: "media",
    name: "Аудио и Видео",
    nameEn: "Audio & Video",
    description: "Конвертация, обрезка и обработка медиафайлов",
    descriptionEn: "Convert, trim and process media files",
    icon: "MusicNote",
    color: "#1ABC9C",
  },
  {
    id: "network",
    slug: "network",
    name: "Сеть и IP",
    nameEn: "Network & IP",
    description: "IP-калькулятор, DNS lookup, проверка портов",
    descriptionEn: "IP calculator, DNS lookup, port checker",
    icon: "Lan",
    color: "#5D6D7E",
  },
  {
    id: "qrbarcode",
    slug: "qrbarcode",
    name: "QR и Штрих-коды",
    nameEn: "QR & Barcodes",
    description: "Генерация и чтение QR-кодов и штрих-кодов",
    descriptionEn: "Generate and read QR codes and barcodes",
    icon: "QrCode2",
    color: "#566573",
  },
  {
    id: "units",
    slug: "units",
    name: "Единицы измерения",
    nameEn: "Units & Sizes",
    description: "Длина, вес, объём, температура и другие единицы",
    descriptionEn: "Length, weight, volume, temperature and other units",
    icon: "Straighten",
    color: "#AF601A",
  },
  {
    id: "productivity",
    slug: "productivity",
    name: "Продуктивность",
    nameEn: "Productivity",
    description: "Заметки, ToDo, Pomodoro и другие утилиты",
    descriptionEn: "Notes, ToDo, Pomodoro and other utilities",
    icon: "TaskAlt",
    color: "#2471A3",
  },
];

export const tools: Tool[] = [
  {
    id: "file-converter",
    slug: "file-converter",
    name: "Универсальный конвертер файлов",
    nameEn: "Universal File Converter",
    description:
      "Добавьте любые изображения, аудио, видео или PDF — формат определится автоматически",
    descriptionEn:
      "Add any images, audio, video or PDF — the format is detected automatically",
    keywords: [
      "конвертер файлов",
      "heic в jpeg",
      "wav в mp3",
      "mov в mp4",
      "pdf в jpg",
      "file converter",
    ],
    icon: "Transform",
    groupId: "converters",
    featured: true,
    implemented: true,
    seoTitle: "Универсальный конвертер файлов онлайн — фото, аудио, видео и PDF",
    seoTitleEn: "Universal File Converter — Images, Audio, Video and PDF",
    seoDescription:
      "Бесплатный конвертер файлов в браузере: HEIC, TIFF, RAW, WAV, MOV, MP4, PDF и другие форматы. Файлы не загружаются на сервер.",
    seoDescriptionEn:
      "Free browser file converter for HEIC, TIFF, RAW, WAV, MOV, MP4, PDF and more. All conversion runs locally in your browser.",
  },
  // === КОНВЕРТЕРЫ ===
  {
    id: "color-converter",
    slug: "color-converter",
    name: "Конвертер цветов",
    nameEn: "Color Converter",
    description:
      "Преобразование цветов между HEX, RGB, CMYK, HSL, HSV форматами",
    descriptionEn: "Convert colors between HEX, RGB, CMYK, HSL, HSV formats",
    keywords: ["цвет", "hex", "rgb", "cmyk", "hsl", "палитра"],
    icon: "ColorLens",
    groupId: "converters",
    featured: true,
    implemented: true,
    seoTitle: "Конвертер цветов HEX, RGB, CMYK, HSL онлайн",
    seoTitleEn: "Color Converter — Convert HEX, RGB, CMYK, HSL and HSV",
    seoDescription:
      "Конвертер цветов онлайн: HEX, RGB, CMYK, HSL, HSV. Мгновенное преобразование цветовых форматов с визуальным предпросмотром.",
    seoDescriptionEn:
      "Convert colors between HEX, RGB, CMYK, HSL, and HSV formats instantly. Includes live preview and one-click clipboard copying.",
  },
  {
    id: "number-system",
    slug: "number-system",
    name: "Системы счисления",
    nameEn: "Number System Converter",
    description:
      "Конвертация чисел между двоичной, восьмеричной, десятичной и шестнадцатеричной",
    descriptionEn:
      "Convert numbers between binary, octal, decimal and hexadecimal",
    keywords: ["двоичная", "hex", "oct", "bin", "dec", "система счисления"],
    icon: "Transform",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер систем счисления: BIN, OCT, DEC, HEX",
    seoTitleEn: "Number System Converter — Binary, Octal, Decimal, Hex",
    seoDescription:
      "Перевод чисел между системами счисления онлайн: двоичная, восьмеричная, десятичная, шестнадцатеричная. Мгновенный результат, бесплатно и в браузере.",
    seoDescriptionEn:
      "Convert numbers across binary, octal, decimal, and hexadecimal systems. Accurate radix calculations executed instantly in browser.",
  },
  {
    id: "temperature-converter",
    slug: "temperature-converter",
    name: "Конвертер температуры",
    nameEn: "Temperature Converter",
    description: "Перевод между Цельсий, Фаренгейт и Кельвин",
    descriptionEn: "Convert between Celsius, Fahrenheit and Kelvin",
    keywords: ["температура", "цельсий", "фаренгейт", "кельвин", "градус"],
    icon: "Thermostat",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер температуры: Цельсий, Фаренгейт онлайн",
    seoTitleEn: "Temperature Converter — Celsius, Fahrenheit and Kelvin",
    seoDescription:
      "Конвертер температуры онлайн бесплатно: Цельсий, Фаренгейт, Кельвин. Быстрый перевод градусов температуры. Работает в браузере.",
    seoDescriptionEn:
      "Convert temperatures between Celsius, Fahrenheit, Kelvin, and Rankine. Accurate thermodynamic conversions with conversion formulas.",
  },
  {
    id: "length-converter",
    slug: "length-converter",
    name: "Конвертер длины",
    nameEn: "Length Converter",
    description: "Перевод метры, футы, дюймы, мили, километры и другие",
    descriptionEn: "Convert meters, feet, inches, miles, kilometers and more",
    keywords: ["длина", "метр", "фут", "дюйм", "миля", "километр"],
    icon: "Straighten",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер длины онлайн: метры, футы, дюймы, мили",
    seoTitleEn: "Length Converter — Meters, Feet, Inches, Miles and KM",
    seoDescription:
      "Конвертер единиц длины онлайн: метры, километры, футы, дюймы, мили, ярды. Мгновенный перевод мер длины бесплатно в браузере.",
    seoDescriptionEn:
      "Convert length and distance between meters, feet, inches, kilometers, miles, and yards. Instant metric to imperial conversion.",
  },
  {
    id: "weight-converter",
    slug: "weight-converter",
    name: "Конвертер веса",
    nameEn: "Weight Converter",
    description: "Перевод килограммы, фунты, унции, тонны и другие",
    descriptionEn: "Convert kilograms, pounds, ounces, tons and more",
    keywords: ["вес", "масса", "килограмм", "фунт", "унция", "тонна"],
    icon: "FitnessCenter",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер веса: килограммы, фунты, унции онлайн",
    seoTitleEn: "Weight & Mass Converter — KG, Pounds, Ounces, Grams",
    seoDescription:
      "Конвертер веса и массы онлайн бесплатно: килограммы, фунты, унции, граммы, тонны. Быстрый перевод мер веса прямо в браузере.",
    seoDescriptionEn:
      "Convert weight and mass between kilograms, pounds, ounces, grams, carats, and stone. Fast metric and imperial mass calculations.",
  },
  {
    id: "volume-converter",
    slug: "volume-converter",
    name: "Конвертер объёма",
    nameEn: "Volume Converter",
    description: "Перевод литры, галлоны, кубометры и другие",
    descriptionEn: "Convert liters, gallons, cubic meters and more",
    keywords: ["объём", "литр", "галлон", "кубометр"],
    icon: "LocalDrink",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер объёма: литры, галлоны, кубометры онлайн",
    seoTitleEn: "Volume Converter — Liters, Gallons, Cubic Meters, Cups",
    seoDescription:
      "Конвертер единиц объёма онлайн: литры, миллилитры, галлоны, кубические метры, пинты. Точный перевод мер объёма бесплатно.",
    seoDescriptionEn:
      "Convert volume and liquid capacity between liters, US and UK gallons, cubic meters, fluid ounces, and pints with exact ratios.",
  },
  {
    id: "speed-converter",
    slug: "speed-converter",
    name: "Конвертер скорости",
    nameEn: "Speed Converter",
    description: "Перевод км/ч, миль/ч, м/с, узлы",
    descriptionEn: "Convert km/h, mph, m/s, knots",
    keywords: ["скорость", "км/ч", "миль/ч", "м/с"],
    icon: "Speed",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер скорости: км/ч, мили/ч, узлы, м/с онлайн",
    seoTitleEn: "Speed Converter — KM/H, MPH, Knots and M/S Online",
    seoDescription:
      "Конвертер скорости онлайн бесплатно: км/ч, мили в час (mph), узлы, метры в секунду. Быстрый перевод единиц скорости в браузере.",
    seoDescriptionEn:
      "Convert velocity between kilometers per hour, miles per hour, knots, and meters per second. Accurate live speed calculations.",
  },
  {
    id: "area-converter",
    slug: "area-converter",
    name: "Конвертер площади",
    nameEn: "Area Converter",
    description: "Кв. метры, кв. футы, гектары, акры",
    descriptionEn: "Square meters, square feet, hectares, acres",
    keywords: ["площадь", "кв. метр", "гектар", "акр", "сотка"],
    icon: "SquareFoot",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер площади: кв. метры, гектары, акры онлайн",
    seoTitleEn: "Area Converter — Square Meters, Feet, Acres, Hectares",
    seoDescription:
      "Конвертер единиц площади онлайн: квадратные метры, километры, гектары, сотки, акры, кв. футы. Бесплатный расчёт площади в браузере.",
    seoDescriptionEn:
      "Convert surface area between square meters, square feet, hectares, acres, and square miles. Accurate real-time land conversions.",
  },
  {
    id: "energy-converter",
    slug: "energy-converter",
    name: "Конвертер энергии",
    nameEn: "Energy Converter",
    description: "Джоули, калории, киловатт-часы, BTU",
    descriptionEn: "Joules, calories, kilowatt-hours, BTU",
    keywords: ["энергия", "джоуль", "калория", "квтч"],
    icon: "ElectricBolt",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер энергии: Джоули, Калории, кВт·ч онлайн",
    seoTitleEn: "Energy Converter — Joules, Calories, Kilowatt-Hours",
    seoDescription:
      "Конвертер единиц энергии онлайн: джоули, калории, килокалории, киловатт-часы, электрон-вольты. Быстрый перевод мер энергии бесплатно.",
    seoDescriptionEn:
      "Convert energy between joules, calories, kilowatt-hours, electronvolts, and BTU. Instant scientific and nutritional energy tool.",
  },
  {
    id: "pressure-converter",
    slug: "pressure-converter",
    name: "Конвертер давления",
    nameEn: "Pressure Converter",
    description: "Паскали, атмосферы, бары, PSI, мм рт. ст.",
    descriptionEn: "Pascals, atmospheres, bars, PSI, mmHg",
    keywords: ["давление", "паскаль", "атмосфера", "бар", "psi"],
    icon: "Compress",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер давления: Паскали, Бар, PSI, атмосферы",
    seoTitleEn: "Pressure Converter — Pascals, Bar, PSI, Atmospheres",
    seoDescription:
      "Конвертер единиц давления онлайн: паскали, бары, атмосферы, PSI, мм рт. ст. Точный перевод величин давления бесплатно в браузере.",
    seoDescriptionEn:
      "Convert pressure between pascals, bars, PSI, standard atmospheres, and mmHg. High-precision engineering conversion calculator.",
  },
  {
    id: "data-converter",
    slug: "data-converter",
    name: "Конвертер данных",
    nameEn: "Data Size Converter",
    description: "Биты, байты, килобайты, мегабайты, гигабайты, терабайты",
    descriptionEn: "Bits, bytes, kilobytes, megabytes, gigabytes, terabytes",
    keywords: ["данные", "байт", "килобайт", "мегабайт", "гигабайт"],
    icon: "Storage",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер данных: байты, КБ, МБ, ГБ, ТБ онлайн",
    seoTitleEn: "Data Size Converter — Bytes, KB, MB, GB, TB, PB Online",
    seoDescription:
      "Конвертер объёма данных онлайн бесплатно: байты, килобайты, мегабайты, гигабайты, терабайты. Мгновенный перевод размеров файлов.",
    seoDescriptionEn:
      "Convert digital storage units between bytes, KB, MB, GB, TB, and binary kibibytes. Supports decimal and binary data standards.",
  },
  {
    id: "angle-converter",
    slug: "angle-converter",
    name: "Конвертер углов",
    nameEn: "Angle Converter",
    description: "Градусы, радианы, грады, минуты, секунды",
    descriptionEn: "Degrees, radians, gradians, minutes, seconds",
    keywords: ["угол", "градус", "радиан", "град"],
    icon: "Architecture",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер углов: градусы, радианы, грады онлайн",
    seoTitleEn: "Angle Converter — Degrees, Radians, Gradians, Arcminutes",
    seoDescription:
      "Конвертер угловых величин онлайн: градусы, радианы, грады, угловые минуты и секунды. Быстрый перевод углов бесплатно в браузере.",
    seoDescriptionEn:
      "Convert angles between degrees, radians, gradians, arcminutes, and turns. High-precision trigonometric angle conversion online.",
  },
  {
    id: "power-converter",
    slug: "power-converter",
    name: "Конвертер мощности",
    nameEn: "Power Converter",
    description: "Ватты, лошадиные силы, BTU/ч, кВт",
    descriptionEn: "Watts, horsepower, BTU/h, kW",
    keywords: ["мощность", "ватт", "лошадиная сила", "кВт"],
    icon: "Power",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер мощности: Ватты, кВт, Лошадиные силы онлайн",
    seoTitleEn: "Power Converter — Watts, Kilowatts, Horsepower Online",
    seoDescription:
      "Конвертер единиц мощности онлайн: ватты, киловатты, лошадиные силы (л.с.), мегаватты. Точный расчёт мощности бесплатно в браузере.",
    seoDescriptionEn:
      "Convert power between watts, kilowatts, metric and mechanical horsepower, and BTU/hr. Fast automotive and electrical power conversion.",
  },
  {
    id: "fuel-converter",
    slug: "fuel-converter",
    name: "Расход топлива",
    nameEn: "Fuel Consumption",
    description: "Л/100км, MPG, км/л — конвертация расхода топлива",
    descriptionEn: "L/100km, MPG, km/L — fuel consumption conversion",
    keywords: ["топливо", "расход", "бензин", "л/100км", "mpg"],
    icon: "LocalGasStation",
    groupId: "converters",
    implemented: true,
    seoTitle: "Расход топлива: л/100 км в MPG (мили на галлон) онлайн",
    seoTitleEn: "Fuel Consumption Converter — L/100km to MPG US & UK",
    seoDescription:
      "Конвертер расхода топлива онлайн: перевод л/100 км, MPG (США и Великобритания), км/л. Быстрый пересчёт расхода бензина автомобиля.",
    seoDescriptionEn:
      "Convert automotive fuel efficiency between liters per 100km (L/100km), US MPG, UK MPG, and km/L with accurate fuel formulas.",
  },
  {
    id: "coordinate-converter",
    slug: "coordinate-converter",
    name: "Конвертер координат",
    nameEn: "Coordinate Converter",
    description: "Широта/долгота в различных форматах: DD, DMS, DDM",
    descriptionEn: "Latitude/longitude in various formats: DD, DMS, DDM",
    keywords: ["координаты", "широта", "долгота", "GPS"],
    icon: "MyLocation",
    groupId: "converters",
    implemented: true,
    seoTitle: "Конвертер координат: градусы, минуты, секунды (DMS, DD)",
    seoTitleEn: "GPS Coordinate Converter — DMS, DD and Decimal Degrees",
    seoDescription:
      "Конвертер географических координат онлайн: перевод между DMS (градусы, минуты, секунды) и десятичными градусами (DD) для карт и GPS.",
    seoDescriptionEn:
      "Convert geographic GPS coordinates between Decimal Degrees (DD) and Degrees Minutes Seconds (DMS) for Google Maps and navigation.",
  },

  // === ДАТА И ВРЕМЯ ===
  {
    id: "world-clock",
    slug: "world-clock",
    name: "Мировые часы",
    nameEn: "World Clock",
    description: "Локальное время и выбранные часовые пояса IANA",
    descriptionEn: "Local time and selected IANA time zones",
    keywords: ["часы", "время", "часовой пояс", "мировое время"],
    icon: "Language",
    groupId: "datetime",
    featured: true,
    implemented: true,
    seoTitle: "Мировые часы онлайн — точное время в городах мира",
    seoTitleEn: "World Clock Online — Live Local Time in Major Cities",
    seoDescription:
      "Мировое время онлайн: точные часы в Москве, Лондоне, Нью-Йорке, Токио и других городах. Часовые пояса и разница во времени бесплатно.",
    seoDescriptionEn:
      "Check current local time across major world cities and timezones simultaneously. View UTC offsets, daylight saving, and time diffs.",
  },
  {
    id: "timezone-converter",
    slug: "timezone-converter",
    name: "Конвертер часовых поясов",
    nameEn: "Time Zone Converter",
    description: "Перевод времени между часовыми поясами",
    descriptionEn: "Convert time between time zones",
    keywords: ["часовой пояс", "UTC", "GMT", "время"],
    icon: "PublicOff",
    groupId: "datetime",
    implemented: true,
    seoTitle: "Конвертер часовых поясов онлайн — сравнить время городов",
    seoTitleEn: "Time Zone Converter — Compare Local Times Across Cities",
    seoDescription:
      "Конвертер часовых поясов онлайн: перевод времени между городами и зонами UTC/GMT. Удобное планирование звонков и встреч по миру.",
    seoDescriptionEn:
      "Convert and schedule meetings across time zones. Easily compare overlapping business hours between worldwide locations.",
  },
  {
    id: "date-difference",
    slug: "date-difference",
    name: "Разница дат",
    nameEn: "Date Difference",
    description: "Вычисление разницы между двумя датами в днях, месяцах, годах",
    descriptionEn:
      "Calculate the difference between two dates in days, months, years",
    keywords: ["дата", "разница", "дни", "возраст"],
    icon: "DateRange",
    groupId: "datetime",
    implemented: true,
    seoTitle: "Разница дат онлайн — сколько дней между двумя датами",
    seoTitleEn: "Date Difference Calculator — Days Between Two Dates",
    seoDescription:
      "Калькулятор разницы дат онлайн: узнайте точное количество дней, недель, месяцев и лет между любыми двумя датами бесплатно.",
    seoDescriptionEn:
      "Calculate the exact duration between two calendar dates in years, months, weeks, and days. Includes leap years and business days.",
  },
  {
    id: "timer",
    slug: "timer",
    name: "Таймер и Секундомер",
    nameEn: "Timer & Stopwatch",
    description: "Простой обратный отсчёт; секундомер скрыт в настройках",
    descriptionEn: "Simple countdown with a stopwatch in advanced settings",
    keywords: ["таймер", "секундомер", "отсчёт", "время"],
    icon: "Timer",
    groupId: "datetime",
    implemented: true,
    seoTitle: "Таймер и секундомер онлайн — точный отсчёт времени",
    seoTitleEn: "Online Timer & Stopwatch — Precision Lap Time Counter",
    seoDescription:
      "Таймер обратного отсчёта и секундомер онлайн бесплатно: звуковой сигнал, замер кругов, полноэкранный режим. Работает в браузере.",
    seoDescriptionEn:
      "Free online digital timer and lap stopwatch. Set custom alert sounds, track split laps, and view countdowns in full-screen mode.",
  },
  {
    id: "age-calculator",
    slug: "age-calculator",
    name: "Калькулятор возраста",
    nameEn: "Age Calculator",
    description: "Точный расчёт возраста по дате рождения",
    descriptionEn: "Calculate exact age from date of birth",
    keywords: ["возраст", "дата рождения", "годы", "дни"],
    icon: "Cake",
    groupId: "datetime",
    implemented: true,
    seoTitle: "Калькулятор возраста онлайн — точный возраст по дате",
    seoTitleEn: "Age Calculator — Exact Age in Years, Months and Days",
    seoDescription:
      "Калькулятор возраста онлайн бесплатно: точный возраст в годах, месяцах, днях, часах и минутах по дате рождения. Дни до дня рождения.",
    seoDescriptionEn:
      "Calculate your exact age in years, months, days, hours, and minutes from your birth date. Discover upcoming birthday countdowns.",
  },
  {
    id: "unix-timestamp",
    slug: "unix-timestamp",
    name: "Unix Timestamp",
    nameEn: "Unix Timestamp",
    description: "Конвертер Unix timestamp в дату и обратно",
    descriptionEn: "Convert Unix timestamp to date and back",
    keywords: ["unix", "timestamp", "epoch", "время"],
    icon: "AccessTime",
    groupId: "datetime",
    implemented: true,
    seoTitle: "Unix Timestamp конвертер — время Epoch в дату онлайн",
    seoTitleEn: "Unix Timestamp Converter — Epoch to Human Date Online",
    seoDescription:
      "Конвертер Unix timestamp онлайн: перевод времени эпохи Unix в понятную дату и обратно. Текущий timestamp в реальном времени бесплатно.",
    seoDescriptionEn:
      "Convert Unix timestamps to human-readable date and time formats or generate epoch time. Real-time seconds and milliseconds display.",
  },
  {
    id: "calendar",
    slug: "calendar",
    name: "Календарь",
    nameEn: "Calendar",
    description: "Чистый календарь месяца с переходом к дате",
    descriptionEn: "Clean monthly calendar with date navigation",
    keywords: ["календарь", "месяц", "неделя", "дата"],
    icon: "CalendarMonth",
    groupId: "datetime",
    implemented: true,
    seoTitle: "Календарь онлайн — интерактивный календарь на любой год",
    seoTitleEn: "Online Interactive Calendar — Year, Month & Date View",
    seoDescription:
      "Интерактивный календарь онлайн: просмотр любого месяца и года, номера недель, рабочие и праздничные дни. Удобно и бесплатно.",
    seoDescriptionEn:
      "Browse an interactive multi-year calendar online. View week numbers, public holidays, leap years, and plan project dates easily.",
  },
  {
    id: "week-number",
    slug: "week-number",
    name: "Номер недели",
    nameEn: "Week Number",
    description: "ISO 8601 номер недели по выбранной дате",
    descriptionEn: "Find the ISO 8601 week number for a date",
    keywords: ["неделя", "номер", "дата", "ISO"],
    icon: "ViewWeek",
    groupId: "datetime",
    implemented: true,
    seoTitle: "Номер недели онлайн — какая сейчас неделя по ISO 8601",
    seoTitleEn: "Current Week Number — ISO 8601 Week Date Calendar",
    seoDescription:
      "Узнайте текущий номер недели по стандарту ISO 8601 онлайн бесплатно. Календарь недель на текущий и любой другой год в браузере.",
    seoDescriptionEn:
      "Find the current week number of the year according to the ISO 8601 standard. See full weekly calendars for any selected year.",
  },

  // === КАЛЬКУЛЯТОРЫ ===
  {
    id: "scientific-calc",
    slug: "scientific-calc",
    name: "Научный калькулятор (инженерный)",
    nameEn: "Scientific Calculator",
    description:
      "Калькулятор с историей, процентами, скобками и научными функциями",
    descriptionEn:
      "Calculator with history, percentages, parentheses and scientific functions",
    keywords: [
      "калькулятор",
      "научный",
      "инженерный",
      "синус",
      "косинус",
      "логарифм",
      "проценты",
    ],
    icon: "Calculate",
    groupId: "calculators",
    featured: true,
    implemented: true,
    seoTitle: "Инженерный калькулятор онлайн — научные вычисления",
    seoTitleEn: "Scientific Calculator Online — Advanced Engineering Math",
    seoDescription:
      "Научный инженерный калькулятор онлайн бесплатно: тригонометрия (sin, cos, tg), логарифмы, степени, корни, скобки, факториал.",
    seoDescriptionEn:
      "Perform advanced engineering and scientific math: trigonometric functions, logarithms, powers, square roots, and parentheses online.",
  },
  {
    id: "percentage-calc",
    slug: "percentage-calc",
    name: "Калькулятор процентов",
    nameEn: "Percentage Calculator",
    description: "Расчёт процентов, наценки, скидки, изменения",
    descriptionEn: "Calculate percentages, markups, discounts, changes",
    keywords: ["процент", "скидка", "наценка", "расчёт"],
    icon: "Percent",
    groupId: "calculators",
    implemented: true,
    seoTitle: "Калькулятор процентов онлайн — найти процент от числа",
    seoTitleEn: "Percentage Calculator — Calculate Percent of Number",
    seoDescription:
      "Калькулятор процентов онлайн бесплатно: расчёт процента от числа, процентного соотношения, увеличения и уменьшения на процент.",
    seoDescriptionEn:
      "Calculate percentages easily: percentage of a number, percentage increase or decrease, discount rates, and relative proportions.",
  },
  {
    id: "mortgage-calc",
    slug: "mortgage-calc",
    name: "Ипотечный калькулятор",
    nameEn: "Mortgage Calculator",
    description: "Расчёт аннуитетного платежа, переплаты и графика",
    descriptionEn: "Calculate an annuity payment, overpayment and schedule",
    keywords: ["ипотека", "кредит", "платёж", "ставка"],
    icon: "House",
    groupId: "calculators",
    implemented: true,
    seoTitle: "Ипотечный калькулятор онлайн — расчёт платежа по ипотеке",
    seoTitleEn: "Mortgage Calculator Online — Monthly Loan Payment & Total",
    seoDescription:
      "Ипотечный калькулятор онлайн бесплатно: расчёт ежемесячного платежа, переплаты по процентам, графика выплат и необходимого дохода.",
    seoDescriptionEn:
      "Calculate monthly mortgage payments, total interest expenses, and loan amortization schedules with down payment adjustments.",
  },
  {
    id: "loan-calc",
    slug: "loan-calc",
    name: "Кредитный калькулятор",
    nameEn: "Loan Calculator",
    description: "Расчёт потребительского кредита с графиком",
    descriptionEn: "Calculate consumer loan payments with schedule",
    keywords: ["кредит", "займ", "платёж", "ставка"],
    icon: "CreditCard",
    groupId: "calculators",
    implemented: true,
    seoTitle: "Кредитный калькулятор онлайн — расчёт платежей и переплаты",
    seoTitleEn: "Loan Calculator Online — Monthly Payments & Loan Schedule",
    seoDescription:
      "Кредитный калькулятор онлайн: аннуитетный и дифференцированный платёж, график погашения кредита, расчёт переплаты бесплатно.",
    seoDescriptionEn:
      "Calculate monthly loan payments, total interest costs, and full amortization schedules with extra payment adjustments.",
  },
  {
    id: "tax-calc",
    slug: "tax-calc",
    name: "Налоговый калькулятор",
    nameEn: "Tax Calculator",
    description: "Предварительный расчёт налога по своей ставке",
    descriptionEn: "Estimate tax with a custom rate and deductions",
    keywords: ["налог", "подоходный налог", "ставка", "вычет", "расчёт"],
    icon: "Receipt",
    groupId: "calculators",
    implemented: true,
    seoTitle: "Налоговый калькулятор онлайн — расчёт НДФЛ и налогов",
    seoTitleEn: "Income Tax Calculator — Estimate Net Earnings and Taxes",
    seoDescription:
      "Налоговый калькулятор онлайн: расчёт НДФЛ (13%, 15%), налога на доходы, самозанятых (4%, 6%), налоговых вычетов бесплатно.",
    seoDescriptionEn:
      "Estimate income taxes, standard deductions, and net post-tax revenue. Fast financial calculations for personal earnings.",
  },
  {
    id: "tip-calc",
    slug: "tip-calc",
    name: "Калькулятор чаевых",
    nameEn: "Tip Calculator",
    description: "Расчёт чаевых и разделение счёта",
    descriptionEn: "Calculate tips and split the bill",
    keywords: ["чаевые", "счёт", "ресторан", "разделить"],
    icon: "RestaurantMenu",
    groupId: "calculators",
    implemented: true,
    seoTitle: "Калькулятор чаевых онлайн — разделить счёт на компанию",
    seoTitleEn: "Tip Calculator & Bill Splitter — Calculate Gratuity Per Person",
    seoDescription:
      "Калькулятор чаевых онлайн бесплатно: быстрый расчёт процента чаевых и разделение счёта между гостями в ресторане или кафе.",
    seoDescriptionEn:
      "Calculate tip percentages, total dining bill amounts, and divide checks evenly among party guests with custom tip presets.",
  },
  {
    id: "discount-calc",
    slug: "discount-calc",
    name: "Калькулятор скидок",
    nameEn: "Discount Calculator",
    description: "Расчёт цены со скидкой и экономии",
    descriptionEn: "Calculate discounted price and savings",
    keywords: ["скидка", "цена", "экономия", "распродажа"],
    icon: "LocalOffer",
    groupId: "calculators",
    implemented: true,
    seoTitle: "Калькулятор скидок онлайн — цена со скидкой и экономия",
    seoTitleEn: "Discount Calculator — Final Sale Price & Total Savings",
    seoDescription:
      "Калькулятор скидок онлайн: узнать цену товара со скидкой в процентах или рублях, сумму экономии. Быстрый расчёт для покупок.",
    seoDescriptionEn:
      "Calculate final discounted retail prices, percentage markdowns, double discounts, and total money saved during sales events.",
  },
  {
    id: "compound-interest",
    slug: "compound-interest",
    name: "Сложный процент",
    nameEn: "Compound Interest",
    description: "Расчёт сложного процента с капитализацией",
    descriptionEn: "Calculate compound interest with capitalization",
    keywords: ["процент", "сложный", "капитализация", "инвестиции"],
    icon: "TrendingUp",
    groupId: "calculators",
    implemented: true,
    seoTitle: "Калькулятор сложных процентов — доходность вклада онлайн",
    seoTitleEn: "Compound Interest Calculator — Investment Growth Over Time",
    seoDescription:
      "Калькулятор сложных процентов онлайн: расчёт доходности банковского вклада, инвестиций с капитализацией и пополнениями бесплатно.",
    seoDescriptionEn:
      "Forecast investment growth and interest compounding with regular deposits. Visual breakdown of principal versus accumulated gains.",
  },
  {
    id: "salary-calc",
    slug: "salary-calc",
    name: "Зарплатный калькулятор",
    nameEn: "Salary Calculator",
    description: "Расчёт gross/net по собственной ставке удержаний",
    descriptionEn: "Estimate gross or net salary with your deduction rate",
    keywords: ["зарплата", "оклад", "налоги", "нетто", "брутто", "удержания"],
    icon: "Payments",
    groupId: "calculators",
    implemented: true,
    seoTitle: "Зарплатный калькулятор онлайн — расчёт зарплаты на руки",
    seoTitleEn: "Salary Tax Calculator — Gross to Net Take-Home Pay",
    seoDescription:
      "Зарплатный калькулятор онлайн: расчёт зарплаты на руки (Net) из оклада (Gross), вычет НДФЛ 13%, страховые взносы работодателя.",
    seoDescriptionEn:
      "Estimate net take-home salary from gross income after personal tax deductions and national contributions with itemized breakdown.",
  },

  // === ИЗОБРАЖЕНИЯ И ГРАФИКА ===
  {
    id: "image-compressor",
    slug: "image-compressor",
    name: "Сжатие изображений",
    nameEn: "Image Compressor",
    description: "Уменьшайте размер JPEG, PNG и WebP",
    descriptionEn: "Reduce the file size of JPEG, PNG and WebP images",
    keywords: ["сжатие", "фото", "оптимизация", "webp", "jpeg", "png"],
    icon: "PhotoSizeSelectLarge",
    groupId: "images",
    featured: true,
    implemented: true,
    seoTitle: "Сжатие изображений онлайн — уменьшить размер фото бесплатно",
    seoTitleEn: "Image Compressor — Reduce PNG, JPEG and WebP File Size",
    seoDescription:
      "Сжатие изображений онлайн бесплатно: уменьшите размер фото JPG, PNG, WebP без потери качества. Быстро и прямо в вашем браузере.",
    seoDescriptionEn:
      "Compress images online without sacrificing visual clarity. Optimize JPEG, PNG, and WebP assets locally with zero server uploads.",
  },
  {
    id: "image-converter",
    slug: "image-converter",
    name: "Конвертер изображений",
    nameEn: "Image Converter",
    description:
      "Конвертация изображений между PNG, JPEG, WebP с пакетной обработкой",
    descriptionEn:
      "Convert images between PNG, JPEG, WebP with batch processing",
    keywords: ["конвертер", "изображения", "png", "jpeg", "webp", "формат"],
    icon: "SwapHoriz",
    groupId: "images",
    featured: true,
    implemented: true,
    seoTitle: "Конвертер изображений онлайн — JPG, PNG, WebP, AVIF, GIF",
    seoTitleEn: "Image Converter — Convert JPG, PNG, WebP, AVIF, TIFF",
    seoDescription:
      "Конвертер изображений онлайн бесплатно: конвертируйте фото между JPG, PNG, WebP, AVIF, GIF, BMP. Быстро, без загрузки на сервер.",
    seoDescriptionEn:
      "Convert picture formats between JPEG, PNG, WebP, AVIF, and TIFF instantly. High-quality client-side image format transformation.",
  },
  {
    id: "image-resizer",
    slug: "image-resizer",
    name: "Изменение размера",
    nameEn: "Image Resizer",
    description: "Ресайз изображений с сохранением пропорций",
    descriptionEn: "Resize images while preserving aspect ratio",
    keywords: ["ресайз", "размер", "масштаб", "пропорции"],
    icon: "PhotoSizeSelectActual",
    groupId: "images",
    implemented: true,
    seoTitle: "Изменить размер изображения онлайн — ресайз фото в пикселях",
    seoTitleEn: "Image Resizer — Resize Photos by Pixels or Percentage",
    seoDescription:
      "Изменение размера изображений онлайн: задайте точную ширину и высоту в пикселях или процентах с сохранением пропорций бесплатно.",
    seoDescriptionEn:
      "Resize image dimensions in pixels or percentages while locking aspect ratios. High-speed client-side image scaling for web.",
  },
  {
    id: "image-crop",
    slug: "image-crop",
    name: "Обрезка изображений",
    nameEn: "Image Cropper",
    description: "Кроп фото с настраиваемыми пропорциями",
    descriptionEn: "Crop photos with customizable aspect ratios",
    keywords: ["обрезка", "кроп", "crop", "фото"],
    icon: "Crop",
    groupId: "images",
    implemented: true,
    seoTitle: "Обрезать фото онлайн — кадрирование изображений бесплатно",
    seoTitleEn: "Image Cropper — Crop Photos to Aspect Ratios Online",
    seoDescription:
      "Обрезка изображений онлайн бесплатно: кадрируйте фото под нужные пропорции 1:1, 16:9, 4:3 или произвольный размер прямо в браузере.",
    seoDescriptionEn:
      "Crop photos to custom rectangular dimensions or popular aspect ratios (1:1, 16:9, 4:3). Intuitive canvas editor running in browser.",
  },
  {
    id: "image-rotate",
    slug: "image-rotate",
    name: "Поворот и отражение",
    nameEn: "Rotate & Flip",
    description: "Поворот и зеркальное отражение изображений",
    descriptionEn: "Rotate and mirror flip images",
    keywords: ["поворот", "отражение", "зеркало", "rotate"],
    icon: "RotateRight",
    groupId: "images",
    implemented: true,
    seoTitle: "Повернуть фото онлайн — поворот и отражение изображений",
    seoTitleEn: "Rotate & Flip Image Online — Turn Photos 90, 180 Degrees",
    seoDescription:
      "Поворот изображений онлайн: поверните фото на 90, 180, 270 градусов, отразите по горизонтали или вертикали бесплатно в браузере.",
    seoDescriptionEn:
      "Rotate pictures by 90, 180, or 270 degrees or flip photos horizontally and vertically with instant canvas preview and download.",
  },
  {
    id: "image-filters",
    slug: "image-filters",
    name: "Фильтры изображений",
    nameEn: "Image Filters",
    description: "Размытие, резкость, яркость, контраст и другие фильтры",
    descriptionEn: "Blur, sharpen, brightness, contrast and other filters",
    keywords: ["фильтр", "размытие", "резкость", "яркость", "контраст"],
    icon: "AutoFixHigh",
    groupId: "images",
    implemented: true,
    seoTitle: "Фотофильтры онлайн — эффекты, яркость и контраст фото",
    seoTitleEn: "Photo Filters Online — Adjust Brightness, Contrast, Sepia",
    seoDescription:
      "Фильтры изображений онлайн: яркость, контраст, насыщенность, размытие, ч/б, сепия, инверсия. Быстрая обработка фото в браузере.",
    seoDescriptionEn:
      "Apply artistic photo filters and color adjustments: vintage, sepia, grayscale, blur, brightness, and contrast with live preview.",
  },
  {
    id: "favicon-generator",
    slug: "favicon-generator",
    name: "Генератор favicon",
    nameEn: "Favicon Generator",
    description: "Создавайте готовый пакет favicon из текста или изображения",
    descriptionEn:
      "Create a ready-to-use favicon package from text or an image",
    keywords: ["favicon", "иконка", "сайт", "ico", "png"],
    icon: "Web",
    groupId: "images",
    implemented: true,
    seoTitle: "Генератор Favicon онлайн — создать иконку для сайта",
    seoTitleEn: "Favicon Generator — Create ICO, PNG & Apple Touch Icons",
    seoDescription:
      "Генератор favicon онлайн бесплатно: создайте иконки для сайта favicon.ico, PNG (16x16, 32x32, 192x192) и Apple touch icon из фото.",
    seoDescriptionEn:
      "Generate complete favicon packages from image, text, or emoji. Outputs multi-resolution ICO, PNG, Web Manifest, and HTML header tags.",
  },
  {
    id: "meme-generator",
    slug: "meme-generator",
    name: "Картинка с текстом",
    nameEn: "Text Image Creator",
    description: "Добавляйте текст на фон и скачивайте готовое изображение",
    descriptionEn: "Add text to a background and download the finished image",
    keywords: ["текст на фото", "картинка", "фон", "изображение"],
    icon: "SentimentVerySatisfied",
    groupId: "images",
    implemented: true,
    seoTitle: "Генератор мемов онлайн — создать мем с текстом бесплатно",
    seoTitleEn: "Meme Generator Online — Custom Text on Meme Templates",
    seoDescription:
      "Генератор мемов онлайн бесплатно: создайте свой мем с текстом сверху и снизу на популярных шаблонах или своём фото за пару кликов.",
    seoDescriptionEn:
      "Create hilarious viral memes quickly with classic templates or uploaded photos. Customize captions, fonts, and download instantly.",
  },
  {
    id: "image-to-base64",
    slug: "image-to-base64",
    name: "Изображение в Base64",
    nameEn: "Image to Base64",
    description: "Конвертация изображений в Base64 строку и обратно",
    descriptionEn: "Convert images to Base64 string and back",
    keywords: ["base64", "изображение", "конвертация", "кодирование"],
    icon: "DataObject",
    groupId: "images",
    implemented: true,
    seoTitle: "Картинка в Base64 онлайн — конвертер изображений в код",
    seoTitleEn: "Image to Base64 Converter — Photo to Data URI Online",
    seoDescription:
      "Конвертер изображений в Base64 онлайн бесплатно: преобразуйте фото в Data URI код для вставки в HTML и CSS прямо в браузере.",
    seoDescriptionEn:
      "Encode pictures into Base64 Data URI strings for HTML, CSS, and JSON embedding with one-click clipboard copying.",
  },
  {
    id: "pixel-art",
    slug: "pixel-art",
    name: "Пиксель-арт",
    nameEn: "Pixel Art",
    description: "Создание пиксельных рисунков и иконок",
    descriptionEn: "Create pixel art drawings and icons",
    keywords: ["пиксель", "пиксельарт", "рисование", "иконка"],
    icon: "GridOn",
    groupId: "images",
    implemented: true,
    seoTitle: "Пиксель-арт онлайн — редактор пиксельной графики",
    seoTitleEn: "Pixel Art Maker Online — Grid Drawing Editor & Sprites",
    seoDescription:
      "Редактор пиксель-арта онлайн бесплатно: рисуйте пиксельную графику на сетке, выбирайте палитру и экспортируйте результат в PNG.",
    seoDescriptionEn:
      "Create retro pixel art and gaming sprites on a custom grid canvas. Features color palettes, bucket fills, and crisp PNG export.",
  },
  {
    id: "svg-editor",
    slug: "svg-editor",
    name: "SVG редактор (векторная графика)",
    nameEn: "SVG Editor",
    description: "Простой редактор SVG с предпросмотром",
    descriptionEn: "Simple SVG editor with preview",
    keywords: ["svg", "вектор", "редактор", "код"],
    icon: "Draw",
    groupId: "images",
    implemented: true,
    seoTitle: "SVG редактор онлайн — просмотр и правка векторной графики",
    seoTitleEn: "SVG Code Editor Online — Live Vector Preview & Code Edit",
    seoDescription:
      "SVG редактор онлайн бесплатно: редактируйте векторный код с мгновенным предпросмотром, меняйте цвета, пути и скачивайте готовый SVG.",
    seoDescriptionEn:
      "Edit and preview SVG markup code in real time. Inspect vector shapes, modify attributes, and download optimized SVG files.",
  },

  // === ТЕКСТ И КОНТЕНТ ===
  {
    id: "word-counter",
    slug: "word-counter",
    name: "Счётчик слов",
    nameEn: "Word Counter",
    description: "Подсчёт символов, слов, предложений",
    descriptionEn: "Count characters, words, sentences",
    keywords: ["слова", "символы", "подсчёт"],
    icon: "FormatListNumbered",
    groupId: "text",
    implemented: false,
    hidden: true,
    seoTitle: "Счётчик слов и символов онлайн — статистика текста",
    seoTitleEn: "Word Counter Online — Character, Sentence & Word Count",
    seoDescription:
      "Счётчик слов онлайн бесплатно: точный подсчёт слов, символов с пробелами и без, предложений, абзацев и времени чтения в тексте.",
    seoDescriptionEn:
      "Count words, characters with and without spaces, sentences, paragraphs, and reading time. Instant text analytics in your browser.",
  },
  {
    id: "case-converter",
    slug: "case-converter",
    name: "Конвертер регистра",
    nameEn: "Case Converter",
    description: "Upper Case, lower case, Title Case, camelCase, snake_case",
    descriptionEn: "Upper Case, lower case, Title Case, camelCase, snake_case",
    keywords: ["регистр", "uppercase", "lowercase", "title", "camelCase"],
    icon: "TextFormat",
    groupId: "text",
    implemented: true,
    seoTitle: "Конвертер регистра текста онлайн — заглавные и строчные",
    seoTitleEn: "Case Converter — UPPERCASE, lowercase, Title Case, camelCase",
    seoDescription:
      "Конвертер регистра онлайн: перевод текста в заглавные, строчные, Как В Книге, camelCase, snake_case, kebab-case в один клик.",
    seoDescriptionEn:
      "Convert text casing between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, and kebab-case.",
  },
  {
    id: "lorem-ipsum",
    slug: "lorem-ipsum",
    name: "Lorem Ipsum генератор (текст-заглушка)",
    nameEn: "Lorem Ipsum Generator",
    description: "Генерация заглушечного текста для макетов",
    descriptionEn: "Generate placeholder text for mockups",
    keywords: ["lorem", "ipsum", "заглушка", "текст", "placeholder"],
    icon: "Article",
    groupId: "text",
    implemented: true,
    seoTitle: "Генератор Lorem Ipsum онлайн — текст-рыба для макетов",
    seoTitleEn: "Lorem Ipsum Generator — Placeholder Filler Text Tool",
    seoDescription:
      "Генератор текста Lorem Ipsum онлайн бесплатно: создайте текст-рыбу на латыни или русском для дизайна и верстки макетов сайтов.",
    seoDescriptionEn:
      "Generate placeholder filler text in Latin or Russian by specifying paragraphs, sentences, or word counts. Formats to HTML or Markdown.",
  },
  {
    id: "text-reverse",
    slug: "text-reverse",
    name: "Переворот текста",
    nameEn: "Text Reverser",
    description: "Переворот и зеркальное отражение текста",
    descriptionEn: "Reverse and mirror flip text",
    keywords: ["переворот", "reverse", "зеркало", "текст"],
    icon: "FlipToFront",
    groupId: "text",
    implemented: true,
    seoTitle: "Переворот текста онлайн — зеркальный текст и реверс слов",
    seoTitleEn: "Text Reverser Online — Reverse Words, Letters and Lines",
    seoDescription:
      "Переверните текст задом наперёд онлайн: реверс букв, слов или строк, зеркальный и перевёрнутый текст бесплатно в браузере.",
    seoDescriptionEn:
      "Reverse text characters, flip word orders, or reverse line sequences online with instant one-click clipboard copying.",
  },
  {
    id: "remove-duplicates",
    slug: "remove-duplicates",
    name: "Удаление дубликатов",
    nameEn: "Remove Duplicates",
    description: "Удаление дублирующихся строк из текста",
    descriptionEn: "Remove duplicate lines from text",
    keywords: ["дубликаты", "удаление", "строки", "уникальные"],
    icon: "PlaylistRemove",
    groupId: "text",
    implemented: true,
    seoTitle: "Удаление дубликатов строк онлайн — очистить список",
    seoTitleEn: "Remove Duplicate Lines — Text Deduplicator & Sorter",
    seoDescription:
      "Удаление дубликатов строк онлайн: очистите список от повторяющихся строк, лишних пробелов и пустых строк бесплатно в браузере.",
    seoDescriptionEn:
      "Deduplicate text lists by removing duplicate lines, leading/trailing whitespace, and empty rows. Optional alphabetical sorting.",
  },
  {
    id: "text-sort",
    slug: "text-sort",
    name: "Сортировка строк",
    nameEn: "Line Sorter",
    description: "Алфавитная и числовая сортировка строк текста",
    descriptionEn: "Alphabetical and numerical sorting of text lines",
    keywords: ["сортировка", "строки", "алфавит", "порядок"],
    icon: "SortByAlpha",
    groupId: "text",
    implemented: true,
    seoTitle: "Сортировка строк онлайн — по алфавиту и длине текста",
    seoTitleEn: "Line Sorter Online — Sort Lines Alphabetically & Length",
    seoDescription:
      "Сортировка строк текста онлайн бесплатно: сортируйте строки по алфавиту (А-Я, A-Z), по длине, в обратном порядке или случайно.",
    seoDescriptionEn:
      "Sort text lists alphabetically (A-Z or Z-A), numerically, by line length, reversed, or randomly with instant clipboard copy.",
  },
  {
    id: "markdown-preview",
    slug: "markdown-preview",
    name: "Markdown превью (редактор)",
    nameEn: "Markdown Preview",
    description: "Редактор и просмотрщик Markdown с live-preview",
    descriptionEn: "Markdown editor and viewer with live preview",
    keywords: ["markdown", "md", "превью", "редактор"],
    icon: "Edit",
    groupId: "text",
    implemented: true,
    seoTitle: "Markdown редактор онлайн — предпросмотр и экспорт в HTML",
    seoTitleEn: "Markdown Preview Online — Live GFM Editor & HTML Export",
    seoDescription:
      "Онлайн-редактор Markdown с живым предпросмотром: пишите разметку Markdown, просматривайте результат и копируйте готовый HTML.",
    seoDescriptionEn:
      "Write and preview Markdown documents with side-by-side HTML rendering. Supports GitHub Flavored Markdown, code blocks, and tables.",
  },
  {
    id: "text-replace",
    slug: "text-replace",
    name: "Найти и заменить",
    nameEn: "Find & Replace",
    description: "Массовая замена текста с поддержкой регулярных выражений",
    descriptionEn: "Bulk text replacement with regex support",
    keywords: ["замена", "найти", "replace", "regex"],
    icon: "FindReplace",
    groupId: "text",
    implemented: true,
    seoTitle: "Найти и заменить в тексте онлайн — автозамена слов",
    seoTitleEn: "Find and Replace Text Online — Bulk Word Substitution",
    seoDescription:
      "Поиск и замена в тексте онлайн бесплатно: массовая замена слов, букв, символов и регулярных выражений (Regex) прямо в браузере.",
    seoDescriptionEn:
      "Find and replace substrings or regex patterns across text snippets. Supports case sensitivity, global replacements, and regex.",
  },
  {
    id: "transliteration",
    slug: "transliteration",
    name: "Транслитерация",
    nameEn: "Transliteration",
    description: "Конвертация кириллицы в латиницу и обратно",
    descriptionEn: "Convert Cyrillic to Latin and back",
    keywords: ["транслитерация", "кириллица", "латиница", "транслит"],
    icon: "Translate",
    groupId: "text",
    implemented: true,
    seoTitle: "Транслитерация онлайн — перевод русского текста в латиницу",
    seoTitleEn: "Transliteration Tool — Russian Cyrillic to Latin Script",
    seoDescription:
      "Транслитерация текста онлайн бесплатно: перевод русских букв в латиницу по стандартам ГОСТ, загранпаспортов, Яндекс и для URL.",
    seoDescriptionEn:
      "Transliterate Cyrillic Russian text into Latin characters following official ICAO, passport, GOST, and web-friendly URL rules.",
  },
  {
    id: "text-to-speech",
    slug: "text-to-speech",
    name: "Текст в речь",
    nameEn: "Text to Speech",
    description: "Озвучивание текста с помощью Web Speech API",
    descriptionEn: "Text-to-speech using Web Speech API",
    keywords: ["речь", "озвучка", "tts", "голос"],
    icon: "RecordVoiceOver",
    groupId: "text",
    implemented: true,
    seoTitle: "Текст в речь онлайн — озвучить текст голосом бесплатно",
    seoTitleEn: "Text to Speech Online — Natural Voice Audio Generator",
    seoDescription:
      "Преобразование текста в речь онлайн бесплатно: озвучивание русского и английского текста синтезатором речи прямо в браузере.",
    seoDescriptionEn:
      "Convert written text into spoken audio using browser speech synthesis with adjustable pitch, playback rate, and accents.",
  },
  {
    id: "string-extractor",
    slug: "string-extractor",
    name: "Извлечение данных",
    nameEn: "Data Extractor",
    description: "Извлечение email, URL, телефонов из текста",
    descriptionEn: "Extract emails, URLs, phone numbers from text",
    keywords: ["извлечение", "email", "url", "телефон", "парсинг"],
    icon: "ManageSearch",
    groupId: "text",
    implemented: true,
    seoTitle: "Извлечение данных из текста онлайн — email, URL, телефоны",
    seoTitleEn: "Data Extractor Online — Extract Emails, URLs & Numbers",
    seoDescription:
      "Извлечение информации из текста онлайн: находите и выгружайте адреса email, ссылки URL, номера телефонов и числа из любого текста.",
    seoDescriptionEn:
      "Extract emails, URLs, phone numbers, IP addresses, and numbers from unstructured text blocks with instant list export.",
  },
  {
    id: "text-cleaner",
    slug: "text-cleaner",
    name: "Очистка текста",
    nameEn: "Text Cleaner",
    description:
      "Удаление невидимых символов, лишних пробелов, смарт-кавычек, HTML тегов",
    descriptionEn:
      "Remove invisible characters, extra whitespace, smart quotes, HTML tags",
    keywords: ["очистка", "невидимые символы", "пробелы", "кавычки", "cleaner"],
    icon: "CleaningServices",
    groupId: "text",
    implemented: true,
    seoTitle: "Очистка текста онлайн — удалить лишние пробелы и переносы",
    seoTitleEn: "Text Cleaner Online — Strip Extra Spaces, Tabs & Returns",
    seoDescription:
      "Очистка текста онлайн бесплатно: удалите двойные пробелы, пустые строки, табуляции, спецсимволы и HTML-теги в один клик.",
    seoDescriptionEn:
      "Clean and sanitize text by removing duplicate spaces, blank lines, trailing tabs, and unwanted formatting artifacts.",
  },
  {
    id: "text-formatter",
    slug: "text-formatter",
    name: "Форматировщик текста",
    nameEn: "Text Formatter",
    description:
      "Очистка, форматирование и преобразование текста: пробелы, строки, регистр, дубликаты",
    descriptionEn:
      "Clean, format and transform text: spaces, lines, case, duplicates",
    keywords: [
      "очистка текста",
      "форматирование",
      "пробелы",
      "дубликаты",
      "сортировка строк",
      "регистр",
      "text cleaner",
    ],
    icon: "CleaningServices",
    groupId: "text",
    featured: false,
    implemented: true,
    seoTitle: "Форматировщик текста онлайн — выравнивание и отступы",
    seoTitleEn: "Text Formatter Online — Format, Wrap and Indent Text",
    seoDescription:
      "Форматирование текста онлайн бесплатно: настройка отступов, переносов строк, табуляции и структуры текста прямо в браузере.",
    seoDescriptionEn:
      "Format, wrap, and indent unorganized paragraphs. Add custom prefix markers, bullet points, and tab alignments effortlessly.",
  },

  // === ГЕНЕРАТОРЫ ===
  {
    id: "password-generator",
    slug: "password-generator",
    name: "Генератор паролей",
    nameEn: "Password Generator",
    description: "Локальная генерация паролей через Web Crypto",
    descriptionEn: "Generate passwords locally with Web Crypto",
    keywords: [
      "пароль",
      "генератор",
      "надёжный",
      "безопасность",
      "случайный пароль",
    ],
    icon: "Password",
    groupId: "generators",
    featured: true,
    implemented: true,
    seoTitle: "Генератор надёжных паролей онлайн — случайные пароли",
    seoTitleEn: "Password Generator — Create Strong Cryptographic Passwords",
    seoDescription:
      "Генератор паролей онлайн бесплатно: создайте надёжный и сложный пароль со спецсимволами, цифрами и буквами. Без сохранения данных.",
    seoDescriptionEn:
      "Generate cryptographically secure random passwords using custom character sets, symbols, and length parameters. Zero telemetry.",
  },
  {
    id: "uuid-generator",
    slug: "uuid-generator",
    name: "Генератор UUID",
    nameEn: "UUID Generator",
    description: "Генерация UUID v4 и GUID",
    descriptionEn: "Generate UUID v4 and GUID",
    keywords: ["uuid", "guid", "уникальный", "идентификатор"],
    icon: "Fingerprint",
    groupId: "generators",
    implemented: true,
    seoTitle: "Генератор UUID онлайн — генерация UUID v4 бесплатно",
    seoTitleEn: "UUID Generator Online — Generate Unique UUID v4 & GUID",
    seoDescription:
      "Генератор UUID онлайн бесплатно: мгновенная генерация уникальных идентификаторов UUID v4 поштучно или списком прямо в браузере.",
    seoDescriptionEn:
      "Generate cryptographically unique UUID v4 and v7 identifiers individually or in bulk. Supports uppercase, lowercase, and no-dash.",
  },
  {
    id: "hash-generator",
    slug: "hash-generator",
    name: "Генератор хэшей",
    nameEn: "Hash Generator",
    description: "SHA-256 и другие хэши для текста или файла",
    descriptionEn: "SHA-256 and other hashes for text or files",
    keywords: ["хэш", "md5", "sha", "контрольная сумма"],
    icon: "Tag",
    groupId: "generators",
    implemented: true,
    seoTitle: "Генератор хэшей онлайн — MD5, SHA-256, SHA-512, SHA-1",
    seoTitleEn: "Hash Generator Online — Compute MD5, SHA-256, SHA-512",
    seoDescription:
      "Генератор хэшей онлайн бесплатно: вычисление контрольных сумм MD5, SHA-1, SHA-256, SHA-512 из текста прямо в вашем браузере.",
    seoDescriptionEn:
      "Compute cryptographic hashes from text strings using MD5, SHA-1, SHA-256, and SHA-512 algorithms instantly on client side.",
  },
  {
    id: "avatar-generator",
    slug: "avatar-generator",
    name: "Генератор аватаров",
    nameEn: "Avatar Generator",
    description: "Детерминированные аватары по имени или seed",
    descriptionEn: "Deterministic avatars from a name or seed",
    keywords: ["аватар", "identicon", "профиль", "генератор"],
    icon: "Face",
    groupId: "generators",
    implemented: true,
    seoTitle: "Генератор аватаров онлайн — случайные аватарки по имени",
    seoTitleEn: "Avatar Generator Online — Create Custom Profile Pictures",
    seoDescription:
      "Генератор аватаров онлайн бесплатно: создавайте уникальные аватарки по имени, инициалам или случайным параметрам для профилей.",
    seoDescriptionEn:
      "Generate unique geometric, pixel, and initial-based profile avatars from any username or seed string with SVG/PNG download.",
  },
  {
    id: "gradient-generator",
    slug: "gradient-generator",
    name: "Генератор градиентов",
    nameEn: "Gradient Generator",
    description: "Создание CSS градиентов с экспортом кода",
    descriptionEn: "Create CSS gradients with code export",
    keywords: ["градиент", "css", "цвета", "фон"],
    icon: "Gradient",
    groupId: "generators",
    implemented: true,
    seoTitle: "CSS генератор градиентов онлайн — линейные и радиальные",
    seoTitleEn: "CSS Gradient Generator — Linear & Radial CSS Gradients",
    seoDescription:
      "Генератор CSS градиентов онлайн бесплатно: настраивайте линейные, радиальные и конические градиенты и копируйте готовый CSS код.",
    seoDescriptionEn:
      "Build beautiful CSS linear, radial, and conic color gradients visually with multi-stop palettes and ready-to-paste CSS code.",
  },
  {
    id: "palette-generator",
    slug: "palette-generator",
    name: "Генератор палитр (цветовые схемы)",
    nameEn: "Palette Generator",
    description: "Гармоничные палитры по базовому цвету",
    descriptionEn: "Harmonious palettes from a base color",
    keywords: [
      "палитра",
      "цвета",
      "гармония",
      "дизайн",
      "схема",
      "аналоговая",
      "комплементарная",
    ],
    icon: "Palette",
    groupId: "generators",
    implemented: true,
    seoTitle: "Генератор цветовых палитр онлайн — гармоничные схемы",
    seoTitleEn: "Color Palette Generator — Harmonious Palette Schemes",
    seoDescription:
      "Генератор палитр онлайн бесплатно: создавайте гармоничные цветовые схемы для дизайна сайтов и приложений с экспортом в HEX и RGB.",
    seoDescriptionEn:
      "Generate balanced color schemes, monochromatic palettes, and complementary hues with instant HEX and RGB export options.",
  },
  {
    id: "random-name",
    slug: "random-name",
    name: "Случайные имена",
    nameEn: "Random Names",
    description: "Синтетические имена и фамилии для тестов",
    descriptionEn: "Synthetic names and surnames for testing",
    keywords: ["имя", "фамилия", "случайный", "синтетический", "тест"],
    icon: "Person",
    groupId: "generators",
    implemented: true,
    seoTitle: "Генератор случайных имён онлайн — мужские и женские имена",
    seoTitleEn: "Random Name Generator — Generate Realistic Names Online",
    seoDescription:
      "Генератор случайных имён и фамилий онлайн: генерация русских и зарубежных мужских и женских имён для персонажей и тестов.",
    seoDescriptionEn:
      "Generate realistic random first and last names across diverse nationalities and genders for creative writing and testing.",
  },
  {
    id: "random-number",
    slug: "random-number",
    name: "Случайное число",
    nameEn: "Random Number",
    description: "Генерация случайных чисел в диапазоне",
    descriptionEn: "Generate random numbers in a range",
    keywords: ["число", "случайное", "рандом", "диапазон"],
    icon: "Casino",
    groupId: "generators",
    implemented: true,
    seoTitle: "Генератор случайных чисел онлайн — рандомайзер чисел",
    seoTitleEn: "Random Number Generator — True Range Randomizer Online",
    seoDescription:
      "Генератор случайных чисел онлайн бесплатно: выберите диапазон от и до, исключите повторы и сгенерируйте список случайных чисел.",
    seoDescriptionEn:
      "Generate random numbers within any custom integer or decimal range. Supports unique non-repeating selections and instant sorting.",
  },
  {
    id: "mockdata-generator",
    slug: "mockdata-generator",
    name: "Генератор тестовых данных",
    nameEn: "Mock Data Generator",
    description: "JSON/CSV с явно синтетическими тестовыми данными",
    descriptionEn: "JSON/CSV with explicitly synthetic test data",
    keywords: ["мок", "данные", "json", "csv", "тестовые"],
    icon: "DataArray",
    groupId: "generators",
    implemented: true,
    seoTitle: "Генератор тестовых данных онлайн — фейковые данные JSON",
    seoTitleEn: "Mock Data Generator — Fake Users, Names, Addresses & Emails",
    seoDescription:
      "Генератор тестовых данных онлайн: создавайте наборы данных (имена, телефоны, адреса, даты) в форматах JSON и CSV для тестирования.",
    seoDescriptionEn:
      "Generate synthetic test data for QA and development: realistic names, emails, addresses, phones, and companies in JSON or CSV.",
  },
  {
    id: "slug-generator",
    slug: "slug-generator",
    name: "Генератор слагов",
    nameEn: "Slug Generator",
    description: "Создание URL-friendly слагов из текста",
    descriptionEn: "Create URL-friendly slugs from text",
    keywords: ["slug", "url", "транслитерация", "ссылка"],
    icon: "Link",
    groupId: "generators",
    implemented: true,
    seoTitle: "Генератор слагов онлайн — создание URL slug из текста",
    seoTitleEn: "URL Slug Generator — Create Clean SEO-Friendly URLs",
    seoDescription:
      "Генератор слагов (slug) онлайн бесплатно: преобразуйте русские и английские заголовки в чистые ЧПУ URL-адреса для сайтов.",
    seoDescriptionEn:
      "Convert article titles and headlines into clean, lowercase, hyphen-separated SEO slugs with international accents transliteration.",
  },

  // === ДЛЯ РАЗРАБОТЧИКОВ ===
  {
    id: "json-formatter",
    slug: "json-formatter",
    name: "JSON Formatter (форматирование)",
    nameEn: "JSON Formatter",
    description: "Форматирование, минификация и валидация JSON",
    descriptionEn: "Format, minify and validate JSON",
    keywords: [
      "json",
      "форматирование",
      "валидация",
      "prettify",
      "json beautifier",
    ],
    icon: "DataObject",
    groupId: "developers",
    featured: true,
    implemented: true,
    seoTitle: "JSON Formatter онлайн — форматирование и валидация JSON",
    seoTitleEn: "JSON Formatter & Validator — Beautify and Minify JSON",
    seoDescription:
      "Форматирование JSON онлайн бесплатно: выравнивание отступов, валидация ошибок, сжатие (minify) и просмотр структуры JSON данных.",
    seoDescriptionEn:
      "Beautify, validate, format, and minify JSON data online with interactive collapsible tree views and detailed syntax error indicators.",
  },
  {
    id: "regex-tester",
    slug: "regex-tester",
    name: "Regex тестер (регулярные выражения)",
    nameEn: "Regex Tester",
    description: "Тестирование регулярных выражений с подсветкой совпадений",
    descriptionEn: "Test regular expressions with match highlighting",
    keywords: ["regex", "регулярное", "выражение", "тест", "паттерн"],
    icon: "ManageSearch",
    groupId: "developers",
    implemented: true,
    seoTitle: "Regex тестер онлайн — проверка регулярных выражений",
    seoTitleEn: "Regex Tester Online — Interactive Regular Expression Debugger",
    seoDescription:
      "Тестер регулярных выражений Regex онлайн: проверяйте совпадения, группы и шаблоны в тексте в реальном времени бесплатно.",
    seoDescriptionEn:
      "Test and debug regular expressions interactively with live match highlighting, capture group extraction, and regex syntax tips.",
  },
  {
    id: "css-minifier",
    slug: "css-minifier",
    name: "CSS Minifier (минификатор CSS)",
    nameEn: "CSS Minifier",
    description: "Минификация и форматирование CSS кода",
    descriptionEn: "Minify and format CSS code",
    keywords: ["css", "минификация", "сжатие", "оптимизация"],
    icon: "Css",
    groupId: "developers",
    implemented: true,
    seoTitle: "CSS Minifier онлайн — сжатие и минификация стилей CSS",
    seoTitleEn: "CSS Minifier Online — Compress & Minify Stylesheets",
    seoDescription:
      "Минификатор CSS онлайн бесплатно: сожмите файлы стилей CSS, удалив лишние пробелы и комментарии для ускорения загрузки сайта.",
    seoDescriptionEn:
      "Minify CSS stylesheets by stripping unnecessary whitespace, comments, and redundant rules to optimize page loading speeds.",
  },
  {
    id: "js-beautifier",
    slug: "js-beautifier",
    name: "JS Beautifier (форматирование JS)",
    nameEn: "JS Beautifier",
    description:
      "Чистое форматирование JavaScript, TypeScript, JSX, JSON и CSS",
    descriptionEn:
      "Clean formatting for JavaScript, TypeScript, JSX, JSON and CSS",
    keywords: ["javascript", "js", "формат", "beautify"],
    icon: "Javascript",
    groupId: "developers",
    implemented: true,
    seoTitle: "JS Beautifier онлайн — форматирование кода JavaScript",
    seoTitleEn: "JavaScript Beautifier — Format & Clean JS Code Online",
    seoDescription:
      "Форматирование JavaScript онлайн бесплатно: выравнивание отступов, расстановка фигурных скобок и структурирование кода JS.",
    seoDescriptionEn:
      "Format and beautify obfuscated or messy JavaScript code with customizable indentation, bracket spacing, and syntax styling.",
  },
  {
    id: "html-formatter",
    slug: "html-formatter",
    name: "HTML Formatter (форматирование)",
    nameEn: "HTML Formatter",
    description: "Аккуратное форматирование HTML, встроенных script и style",
    descriptionEn: "Format HTML and embedded script/style blocks",
    keywords: ["html", "формат", "разметка", "prettify"],
    icon: "Html",
    groupId: "developers",
    implemented: true,
    seoTitle: "HTML Formatter онлайн — форматирование кода HTML",
    seoTitleEn: "HTML Formatter & Beautifier — Clean HTML Code Online",
    seoDescription:
      "Форматирование HTML онлайн бесплатно: красивое выравнивание отступов, структурирование тегов и очистка разметки страниц.",
    seoDescriptionEn:
      "Format, beautify, and indent disorganized HTML markup with customizable tab spaces, tag nesting, and clean syntax formatting.",
  },
  {
    id: "sql-formatter",
    slug: "sql-formatter",
    name: "SQL Formatter (форматирование)",
    nameEn: "SQL Formatter",
    description: "Форматирование SQL запросов",
    descriptionEn: "Format SQL queries",
    keywords: ["sql", "формат", "запрос", "база данных"],
    icon: "TableView",
    groupId: "developers",
    implemented: true,
    seoTitle: "SQL Formatter онлайн — форматирование SQL запросов",
    seoTitleEn: "SQL Formatter Online — Beautify MySQL, Postgres & SQLite",
    seoDescription:
      "Форматирование SQL онлайн бесплатно: структурируйте запросы SELECT, INSERT, UPDATE с красивыми отступами для MySQL, PostgreSQL, SQLite.",
    seoDescriptionEn:
      "Beautify and indent complex SQL queries for PostgreSQL, MySQL, SQLite, and Oracle with uppercase keywords and nested clauses.",
  },
  {
    id: "cron-generator",
    slug: "cron-generator",
    name: "Cron генератор (расписание задач)",
    nameEn: "Cron Generator",
    description: "Визуальный генератор cron выражений",
    descriptionEn: "Visual cron expression generator",
    keywords: ["cron", "расписание", "задача", "планировщик"],
    icon: "Schedule",
    groupId: "developers",
    implemented: true,
    seoTitle: "Cron генератор онлайн — настройка расписания crontab",
    seoTitleEn: "Cron Expression Generator — Build Crontab Schedules Online",
    seoDescription:
      "Генератор выражений Cron онлайн бесплатно: визуальная настройка расписания задач crontab с понятным описанием на русском языке.",
    seoDescriptionEn:
      "Build and parse crontab cron expressions visually with human-readable descriptions of scheduled intervals and next execution times.",
  },
  {
    id: "http-status",
    slug: "http-status",
    name: "HTTP статус-коды",
    nameEn: "HTTP Status Codes",
    description: "Найдите HTTP-код по номеру или названию и скопируйте его",
    descriptionEn: "Find an HTTP code by number or name and copy it",
    keywords: ["http", "статус", "код", "404", "500", "api"],
    icon: "Http",
    groupId: "developers",
    implemented: true,
    seoTitle: "HTTP статус-коды — поиск 404, 500 и других кодов",
    seoTitleEn: "HTTP Status Codes — Search 404, 500 and More",
    seoDescription:
      "Найдите HTTP-код по номеру или названию, прочитайте краткое описание и скопируйте код. Категории от 1xx до 5xx.",
    seoDescriptionEn:
      "Search HTTP status codes by number or name, read a concise explanation, and copy the code. Covers categories from 1xx to 5xx.",
  },
  {
    id: "mime-types",
    slug: "mime-types",
    name: "MIME Types (типы файлов)",
    nameEn: "MIME Types",
    description: "Найдите MIME-тип по расширению файла или Content-Type",
    descriptionEn: "Find a MIME type by file extension or Content-Type",
    keywords: ["mime", "тип", "файл", "расширение", "content-type"],
    icon: "InsertDriveFile",
    groupId: "developers",
    implemented: true,
    seoTitle: "MIME-типы — поиск Content-Type по расширению",
    seoTitleEn: "MIME Types — Find Content-Type by File Extension",
    seoDescription:
      "Найдите MIME-тип по расширению или названию Content-Type и скопируйте значение. В дополнительных настройках доступна проверка сигнатуры файла.",
    seoDescriptionEn:
      "Find a MIME type by file extension or Content-Type name and copy it. Optional file-signature inspection is available in advanced settings.",
  },
  {
    id: "flexbox-playground",
    slug: "flexbox-playground",
    name: "Flexbox Playground (CSS раскладка)",
    nameEn: "Flexbox Playground",
    description: "Настройте Flexbox, проверьте раскладку и скопируйте CSS",
    descriptionEn: "Adjust Flexbox, preview the layout, and copy the CSS",
    keywords: ["flexbox", "css", "layout", "flex"],
    icon: "ViewQuilt",
    groupId: "developers",
    implemented: true,
    seoTitle: "CSS Flexbox Playground — интерактивная раскладка и CSS",
    seoTitleEn: "CSS Flexbox Playground — Interactive Layout and CSS",
    seoDescription:
      "Интерактивная песочница Flexbox: настраивайте направление, выравнивание и свойства элементов, сразу видя готовый CSS-код.",
    seoDescriptionEn:
      "Interactive Flexbox playground: configure direction, alignment, and child properties with instant visual preview and copyable CSS.",
  },
  {
    id: "grid-playground",
    slug: "grid-playground",
    name: "CSS Grid Playground (сетка)",
    nameEn: "CSS Grid Playground",
    description: "Задайте колонки и отступы Grid, затем скопируйте CSS",
    descriptionEn: "Set Grid columns and gaps, then copy the CSS",
    keywords: ["grid", "css", "layout", "сетка"],
    icon: "GridView",
    groupId: "developers",
    implemented: true,
    seoTitle: "CSS Grid Playground — колонки, отступы и готовый CSS",
    seoTitleEn: "CSS Grid Playground — Columns, Gaps and CSS",
    seoDescription:
      "Интерактивная песочница CSS Grid: настраивайте колонки, строки, отступы и области сетки с мгновенным предпросмотром и готовым CSS.",
    seoDescriptionEn:
      "Set CSS Grid columns, rows, and gaps visually. Inspect the live responsive preview and copy the generated CSS grid layout rules.",
  },
  {
    id: "diff-checker",
    slug: "diff-checker",
    name: "Diff Checker (сравнение кода)",
    nameEn: "Diff Checker",
    description: "Сравните два текста и скопируйте unified diff",
    descriptionEn: "Compare two texts and copy a unified diff",
    keywords: ["diff", "сравнение", "код", "различия"],
    icon: "Compare",
    groupId: "developers",
    implemented: true,
    seoTitle: "Diff Checker — сравнение текстов по строкам",
    seoTitleEn: "Diff Checker — Compare Text Line by Line",
    seoDescription:
      "Сравните два текста или фрагмента кода, увидьте добавленные и удалённые строки с подсветкой и скопируйте результат в unified diff.",
    seoDescriptionEn:
      "Compare two texts or code snippets side by side. Review added, removed, and modified lines with instant unified diff export.",
  },
  {
    id: "jwt-decoder",
    slug: "jwt-decoder",
    name: "JWT Decoder (декодер токенов)",
    nameEn: "JWT Decoder",
    description: "Декодируйте header и payload JWT без проверки подписи",
    descriptionEn:
      "Decode a JWT header and payload without signature verification",
    keywords: ["jwt", "token", "декодер", "авторизация"],
    icon: "VpnKey",
    groupId: "developers",
    implemented: true,
    seoTitle: "JWT Decoder — декодирование без проверки подписи",
    seoTitleEn: "JWT Decoder — Decode Without Signature Verification",
    seoDescription:
      "Декодируйте header и payload JWT в читаемый JSON. Инструмент не проверяет подпись и не подтверждает подлинность токена.",
    seoDescriptionEn:
      "Decode a JWT header and payload into readable JSON. The tool does not verify the signature or confirm that the token is authentic.",
  },
  {
    id: "json-csv",
    slug: "json-csv",
    name: "JSON ↔ CSV конвертер",
    nameEn: "JSON to CSV Converter",
    description: "Преобразуйте JSON в CSV или CSV в плоский JSON",
    descriptionEn: "Convert JSON to CSV or CSV to flat JSON",
    keywords: ["json", "csv", "конвертер", "таблица", "данные", "export"],
    icon: "TableChart",
    groupId: "developers",
    implemented: true,
    seoTitle: "JSON ↔ CSV конвертер — кавычки и переносы строк",
    seoTitleEn: "JSON ↔ CSV Converter — Quotes and Line Breaks",
    seoDescription:
      "Преобразуйте массив JSON в CSV или CSV в плоские JSON-объекты. Поля в кавычках и переносы строк сохраняются; вложенные значения записываются JSON-строками.",
    seoDescriptionEn:
      "Convert a JSON array to CSV or CSV to flat JSON objects. Quoted fields and line breaks are preserved; nested values are stored as JSON strings.",
  },
  {
    id: "yaml-json",
    slug: "yaml-json",
    name: "YAML ↔ JSON",
    nameEn: "YAML to JSON",
    description: "Преобразуйте YAML в JSON или JSON в YAML",
    descriptionEn: "Convert YAML to JSON or JSON to YAML",
    keywords: ["yaml", "json", "конвертер", "конфиг"],
    icon: "SwapVert",
    groupId: "developers",
    implemented: true,
    seoTitle: "YAML ↔ JSON конвертер — преобразование структур данных",
    seoTitleEn: "YAML ↔ JSON Converter — Fast Data Structure Conversion",
    seoDescription:
      "Онлайн-конвертер YAML в JSON и обратно: мгновенное преобразование структур данных с валидацией синтаксиса и подсветкой ошибок.",
    seoDescriptionEn:
      "Convert YAML to JSON or JSON to YAML with syntax validation, error highlighting, and instant file download directly in your browser.",
  },
  {
    id: "xml-formatter",
    slug: "xml-formatter",
    name: "XML Formatter (форматирование)",
    nameEn: "XML Formatter",
    description: "Форматируйте или минифицируйте XML и скопируйте результат",
    descriptionEn: "Format or minify XML and copy the result",
    keywords: ["xml", "формат", "валидация"],
    icon: "Code",
    groupId: "developers",
    implemented: true,
    seoTitle: "XML Formatter — форматирование и минификация XML",
    seoTitleEn: "XML Formatter — Format and Minify XML",
    seoDescription:
      "Вставьте XML, выберите форматирование или минификацию и скопируйте результат. Ошибки разбора показываются рядом с вводом.",
    seoDescriptionEn:
      "Format, indent, and minify XML data online with instant syntax validation and highlighted parse error diagnostics in real time.",
  },
  {
    id: "color-picker",
    slug: "color-picker",
    name: "Color Picker (подбор цвета)",
    nameEn: "Color Picker",
    description: "Выберите цвет и скопируйте HEX, RGB или HSL",
    descriptionEn: "Pick a color and copy its HEX, RGB, or HSL value",
    keywords: ["цвет", "пипетка", "picker", "выбор"],
    icon: "Colorize",
    groupId: "developers",
    implemented: true,
    seoTitle: "Color Picker — выбор цвета и копирование HEX",
    seoTitleEn: "Color Picker — Pick and Copy HEX Colors",
    seoDescription:
      "Выберите цвет на поле или изображении и скопируйте его HEX. Форматы RGB и HSL, контраст и экранная пипетка доступны в параметрах.",
    seoDescriptionEn:
      "Pick a color from the field or an image and copy its HEX value. RGB, HSL, contrast, and a supported-browser eyedropper are available in details.",
  },
  {
    id: "box-shadow",
    slug: "box-shadow",
    name: "Box Shadow генератор",
    nameEn: "Box Shadow Generator",
    description: "Настройте тень, проверьте результат и скопируйте CSS",
    descriptionEn: "Adjust a shadow, preview it, and copy the CSS",
    keywords: ["box-shadow", "тень", "css", "генератор", "shadow"],
    icon: "FilterDrama",
    groupId: "developers",
    implemented: true,
    seoTitle: "CSS Box Shadow генератор — предпросмотр и готовый CSS",
    seoTitleEn: "CSS Box Shadow Generator — Preview and Copy CSS",
    seoDescription:
      "Генератор теней CSS box-shadow: настраивайте смещение, размытие, растяжение и цвет тени с живым предпросмотром и копированием CSS.",
    seoDescriptionEn:
      "CSS box-shadow generator: configure blur, spread, offset, opacity, and color with live interactive preview and ready-to-use CSS.",
  },
  {
    id: "chmod-calc",
    slug: "chmod-calc",
    name: "Chmod калькулятор",
    nameEn: "Chmod Calculator",
    description: "Введите права 755 и скопируйте команду chmod",
    descriptionEn: "Enter 755-style permissions and copy the chmod command",
    keywords: ["chmod", "права", "доступ", "linux", "unix", "permissions"],
    icon: "AdminPanelSettings",
    groupId: "developers",
    implemented: true,
    seoTitle: "Chmod калькулятор — права 755, 644 и команда chmod",
    seoTitleEn: "Chmod Calculator — 755, 644 and chmod Commands",
    seoDescription:
      "Введите права доступа в восьмеричном формате, укажите путь и скопируйте команду chmod. Символьная форма показывается рядом.",
    seoDescriptionEn:
      "Enter permissions in octal format, add a path, and copy the chmod command. The symbolic form is shown alongside it.",
  },
  {
    id: "github-readme",
    slug: "github-readme",
    name: "GitHub README генератор",
    nameEn: "GitHub README Generator",
    description: "Введите данные проекта и создайте README.md",
    descriptionEn: "Enter project details and generate a README.md",
    keywords: ["github", "readme", "markdown", "проект"],
    icon: "GitHub",
    groupId: "developers",
    implemented: true,
    seoTitle: "Генератор README.md для проекта",
    seoTitleEn: "README.md Generator for GitHub Projects",
    seoDescription:
      "Укажите название, тип и описание проекта, выберите нужные разделы и создайте README.md для копирования или скачивания.",
    seoDescriptionEn:
      "Enter the project name, type, and description, choose the sections you need, and generate a README.md to copy or download.",
  },
  {
    id: "token-counter",
    slug: "token-counter",
    name: "Счётчик токенов AI",
    nameEn: "AI Token Counter",
    description: "Подсчёт токенов для AI",
    descriptionEn: "Count tokens for AI models",
    keywords: ["токены", "token", "ai"],
    icon: "SmartToy",
    groupId: "developers",
    implemented: false,
    hidden: true,
    seoTitle: "Счётчик токенов AI онлайн — токены GPT-4, Claude, LLaMA",
    seoTitleEn: "AI Token Counter — Estimate Tokens for GPT-4 & Claude",
    seoDescription:
      "Счётчик токенов AI онлайн бесплатно: подсчитайте точное число токенов для моделей OpenAI GPT-4, ChatGPT и Claude прямо в браузере.",
    seoDescriptionEn:
      "Estimate token counts for AI prompts across OpenAI GPT-4, GPT-3.5, and Claude models to optimize context length and API costs.",
  },
  {
    id: "regex-library",
    slug: "regex-library",
    name: "Библиотека Regex",
    nameEn: "Regex Pattern Library",
    description: "Найдите Regex, проверьте на своём тексте и скопируйте",
    descriptionEn: "Find a Regex, test it on your text, and copy it",
    keywords: [
      "regex",
      "регулярные выражения",
      "паттерн",
      "библиотека",
      "regexp",
    ],
    icon: "MenuBook",
    groupId: "developers",
    implemented: true,
    seoTitle: "Библиотека Regex — поиск и проверка выражений",
    seoTitleEn: "Regex Pattern Library — Search, Test and Copy",
    seoDescription:
      "Большая библиотека регулярных выражений: популярные шаблоны для email, URL, телефонов и дат с тестированием на вашем тексте онлайн.",
    seoDescriptionEn:
      "Curated regular expression library: copy tested regex patterns for emails, URLs, dates, and test them live directly in your browser.",
  },
  {
    id: "css-animation",
    slug: "css-animation",
    name: "CSS Animation конструктор",
    nameEn: "CSS Animation Builder",
    description: "Выберите анимацию, посмотрите результат и скопируйте CSS",
    descriptionEn: "Choose an animation, preview it, and copy the CSS",
    keywords: ["css", "animation", "keyframes", "анимация", "конструктор"],
    icon: "AutoAwesome",
    groupId: "developers",
    implemented: true,
    seoTitle: "CSS Animation — предпросмотр и готовые @keyframes",
    seoTitleEn: "CSS Animation Builder — Preview and Copy Keyframes",
    seoDescription:
      "Выберите эффект и длительность, посмотрите анимацию и скопируйте CSS с @keyframes. Тайминг и повторы доступны в параметрах.",
    seoDescriptionEn:
      "Choose an effect and duration, preview the animation, and copy the CSS with @keyframes. Timing and repeats are available in settings.",
  },

  // === МАТЕМАТИКА И СТАТИСТИКА ===
  {
    id: "equation-solver",
    slug: "equation-solver",
    name: "Решатель уравнений",
    nameEn: "Equation Solver",
    description:
      "Решение линейных и квадратных уравнений с действительными корнями",
    descriptionEn: "Solve linear and quadratic equations over the real numbers",
    keywords: [
      "уравнение",
      "решение",
      "корни",
      "квадратное",
      "линейное",
      "дискриминант",
      "полином",
    ],
    icon: "Functions",
    groupId: "math",
    featured: true,
    implemented: true,
    seoTitle: "Решатель уравнений онлайн — пошаговое решение уравнений",
    seoTitleEn: "Equation Solver Online — Linear & Quadratic Step-by-Step",
    seoDescription:
      "Решатель математических уравнений онлайн бесплатно: линейные, квадратные и кубические уравнения с подробным пошаговым решением.",
    seoDescriptionEn:
      "Solve algebraic, linear, and polynomial equations with detailed step-by-step mathematical reasoning and graphing support.",
  },
  {
    id: "matrix-calc",
    slug: "matrix-calc",
    name: "Калькулятор матриц",
    nameEn: "Matrix Calculator",
    description: "Сложение, умножение, определитель, обратная матрица",
    descriptionEn: "Addition, multiplication, determinant, inverse matrix",
    keywords: ["матрица", "определитель", "умножение", "линейная алгебра"],
    icon: "GridOn",
    groupId: "math",
    implemented: true,
    seoTitle: "Калькулятор матриц онлайн — умножение, определитель",
    seoTitleEn: "Matrix Calculator — Determinant, Inversion & Multiply",
    seoDescription:
      "Матричный калькулятор онлайн бесплатно: сложение, умножение матриц, нахождение определителя, обратной матрицы и ранга с решением.",
    seoDescriptionEn:
      "Perform matrix algebra online: multiply, invert, transpose, and find matrix determinants and eigenvalues with step-by-step math.",
  },
  {
    id: "statistics-calc",
    slug: "statistics-calc",
    name: "Статистика",
    nameEn: "Statistics",
    description: "Среднее, медиана, мода, стандартное отклонение",
    descriptionEn: "Mean, median, mode, standard deviation",
    keywords: ["статистика", "среднее", "медиана", "мода", "отклонение"],
    icon: "BarChart",
    groupId: "math",
    implemented: true,
    seoTitle: "Калькулятор статистики онлайн — среднее, медиана, дисперсия",
    seoTitleEn: "Statistics Calculator — Mean, Median, Mode & Variance",
    seoDescription:
      "Статистический калькулятор онлайн бесплатно: расчёт среднего арифметического, медианы, моды, стандартного отклонения и дисперсии ряда.",
    seoDescriptionEn:
      "Calculate key statistical metrics: arithmetic mean, median, mode, standard deviation, variance, and range from custom datasets.",
  },
  {
    id: "factorial-calc",
    slug: "factorial-calc",
    name: "Калькулятор факториала",
    nameEn: "Factorial Calculator",
    description: "Точный расчёт n! для целых чисел от 0 до 1000",
    descriptionEn: "Calculate exact n! for integers from 0 to 1000",
    keywords: ["факториал", "n!", "большие числа"],
    icon: "AutoGraph",
    groupId: "math",
    implemented: true,
    seoTitle: "Калькулятор факториала онлайн — расчёт n! для любых чисел",
    seoTitleEn: "Factorial Calculator Online — Calculate n! for Any Number",
    seoDescription:
      "Калькулятор факториала онлайн бесплатно: быстрое вычисление факториала n! для больших чисел, комбинаторики, перестановок и сочетаний.",
    seoDescriptionEn:
      "Compute exact integer factorials n!, permutations, and combinations for large numbers with scientific notation options.",
  },
  {
    id: "roman-numerals",
    slug: "roman-numerals",
    name: "Римские числа",
    nameEn: "Roman Numerals",
    description: "Конвертер арабских чисел в римские и обратно",
    descriptionEn: "Convert Arabic numbers to Roman and back",
    keywords: ["римские", "числа", "конвертер", "IV", "XII"],
    icon: "Pin",
    groupId: "math",
    implemented: true,
    seoTitle: "Римские числа онлайн — перевод в арабские цифры и обратно",
    seoTitleEn: "Roman Numerals Converter — Arabic to Roman & Reverse",
    seoDescription:
      "Конвертер римских чисел онлайн бесплатно: быстрый перевод арабских чисел в римские цифры и обратно с проверкой правильности записи.",
    seoDescriptionEn:
      "Convert Arabic integers to classical Roman numerals and decode Roman numerals back to numbers with syntax validation up to 3,999,999.",
  },
  {
    id: "fraction-calc",
    slug: "fraction-calc",
    name: "Калькулятор дробей",
    nameEn: "Fraction Calculator",
    description: "Точные операции с обычными дробями и сокращение результата",
    descriptionEn: "Exact common-fraction operations with reduced results",
    keywords: ["дробь", "числитель", "знаменатель", "сокращение"],
    icon: "Looks3",
    groupId: "math",
    implemented: true,
    seoTitle: "Калькулятор дробей онлайн — действия с обыкновенными дробями",
    seoTitleEn: "Fraction Calculator — Add, Subtract, Multiply & Divide",
    seoDescription:
      "Калькулятор дробей онлайн бесплатно: сложение, вычитание, умножение и деление обыкновенных и смешанных дробей с пошаговым решением.",
    seoDescriptionEn:
      "Calculate fractions with step-by-step arithmetic: add, subtract, multiply, and divide mixed and improper fractions with common denominators.",
  },
  {
    id: "graph-plotter",
    slug: "graph-plotter",
    name: "Построитель графиков",
    nameEn: "Graph Plotter",
    description: "Визуализация математических функций",
    descriptionEn: "Visualize mathematical functions",
    keywords: ["график", "функция", "визуализация", "svg"],
    icon: "ShowChart",
    groupId: "math",
    implemented: true,
    seoTitle: "Построитель графиков функций онлайн — график функции f(x)",
    seoTitleEn: "Function Graph Plotter — Plot Math Equations Online",
    seoDescription:
      "Построитель графиков онлайн бесплатно: визуализируйте функции y = f(x), находите экстремумы, корни и точки пересечения графиков.",
    seoDescriptionEn:
      "Plot 2D mathematical functions and formulas interactively. Zoom, pan, and trace function roots, extrema, and intercepts easily.",
  },
  {
    id: "gcd-lcm",
    slug: "gcd-lcm",
    name: "НОД и НОК",
    nameEn: "GCD & LCM",
    description: "Наибольший общий делитель и наименьшее общее кратное",
    descriptionEn: "Greatest common divisor and least common multiple",
    keywords: ["НОД", "НОК", "делитель", "кратное"],
    icon: "CallSplit",
    groupId: "math",
    implemented: true,
    seoTitle: "НОД и НОК онлайн — наибольший общий делитель и кратное",
    seoTitleEn: "GCD and LCM Calculator — Greatest Divisor & Multiple",
    seoDescription:
      "Калькулятор НОД и НОК онлайн бесплатно: найдите наибольший общий делитель и наименьшее общее кратное двух или нескольких чисел.",
    seoDescriptionEn:
      "Compute the Greatest Common Divisor (GCD) and Least Common Multiple (LCM) of multiple numbers using the Euclidean algorithm.",
  },
  {
    id: "prime-checker",
    slug: "prime-checker",
    name: "Проверка простых чисел",
    nameEn: "Prime Number Checker",
    description: "Точная проверка простоты целого числа в 64-битном диапазоне",
    descriptionEn: "Deterministic primality check in the unsigned 64-bit range",
    keywords: ["простое", "число", "miller rabin", "64-bit"],
    icon: "FilterAlt",
    groupId: "math",
    implemented: true,
    seoTitle: "Проверка простых чисел онлайн — разложение на множители",
    seoTitleEn: "Prime Number Checker & Factorization Calculator",
    seoDescription:
      "Проверка простых чисел онлайн бесплатно: узнайте, является ли число простым, и разложите любое составное число на простые множители.",
    seoDescriptionEn:
      "Test if an integer is prime, compute prime factorizations into canonical powers, and generate lists of primes within any numeric range.",
  },
  {
    id: "proportion-calc",
    slug: "proportion-calc",
    name: "Калькулятор пропорций",
    nameEn: "Proportion Calculator",
    description: "Поиск одного неизвестного в пропорции A/B = C/D",
    descriptionEn: "Find one unknown value in A/B = C/D",
    keywords: ["пропорция", "соотношение", "неизвестное"],
    icon: "Balance",
    groupId: "math",
    implemented: true,
    seoTitle: "Калькулятор пропорций онлайн — найти неизвестный член x",
    seoTitleEn: "Proportion Calculator Online — Solve Ratios & Unknown X",
    seoDescription:
      "Калькулятор пропорций онлайн бесплатно: быстро найдите неизвестное x в пропорции a : b = c : d с пошаговым решением и объяснением.",
    seoDescriptionEn:
      "Solve mathematical proportions a:b = c:d for unknown variables. Fast ratio scaling calculator with clear step-by-step solutions.",
  },

  // === ЗДОРОВЬЕ И ФИТНЕС ===
  {
    id: "body-metrics",
    slug: "body-metrics",
    name: "Индекс массы тела",
    nameEn: "Body Mass Index",
    description: "BMI и ориентировочный диапазон веса для взрослых",
    descriptionEn: "BMI and an indicative adult weight range",
    keywords: ["bmi", "вес", "рост", "индекс массы тела", "диапазон веса"],
    icon: "MonitorWeight",
    groupId: "health",
    implemented: true,
    featured: true,
    seoTitle: "Индекс массы тела и метрики тела онлайн — расчёт параметров",
    seoTitleEn: "Body Mass Index & Body Composition Metrics Calculator",
    seoDescription:
      "Калькулятор параметров тела онлайн: расчёт ИМТ, процента жира, суточной нормы калорий и идеального веса в одном удобном месте.",
    seoDescriptionEn:
      "Evaluate holistic body composition metrics: Body Mass Index, body fat estimates, and healthy target weight ranges in one place.",
  },
  {
    id: "bmi-calc",
    slug: "bmi-calc",
    name: "Калькулятор BMI",
    nameEn: "BMI Calculator",
    description: "Расчёт индекса массы тела и рекомендации",
    descriptionEn: "Calculate body mass index with recommendations",
    keywords: ["bmi", "вес", "рост", "индекс массы тела"],
    icon: "MonitorWeight",
    groupId: "health",
    implemented: false,
    hidden: true,
    seoTitle: "Калькулятор BMI онлайн — расчёт индекса массы тела (ИМТ)",
    seoTitleEn: "BMI Calculator Online — Body Mass Index for Adults",
    seoDescription:
      "Калькулятор BMI онлайн бесплатно: определите индекс массы тела по росту и весу, узнайте категорию нормы веса по стандартам ВОЗ.",
    seoDescriptionEn:
      "Calculate your Body Mass Index (BMI) using metric or imperial units. Features WHO weight categories and recommended healthy weight ranges.",
  },
  {
    id: "calorie-calc",
    slug: "calorie-calc",
    name: "Калькулятор калорий",
    nameEn: "Calorie Calculator",
    description: "Расчёт суточной нормы калорий BMR/TDEE",
    descriptionEn: "Calculate daily calorie intake BMR/TDEE",
    keywords: ["калории", "bmr", "tdee", "питание", "диета"],
    icon: "LocalDining",
    groupId: "health",
    implemented: false,
    hidden: true,
    seoTitle: "Калькулятор калорий онлайн — суточная норма калорий BMR",
    seoTitleEn: "Calorie & TDEE Calculator — Daily Caloric Needs for Goals",
    seoDescription:
      "Калькулятор калорий онлайн бесплатно: расчёт суточной нормы калорий (BMR, TDEE) для похудения, удержания или набора мышечной массы.",
    seoDescriptionEn:
      "Estimate Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) with Mifflin-St Jeor formulas for fat loss or muscle gain.",
  },
  {
    id: "ideal-weight",
    slug: "ideal-weight",
    name: "Идеальный вес",
    nameEn: "Ideal Weight",
    description: "Расчёт идеального веса по разным формулам",
    descriptionEn: "Calculate ideal weight using various formulas",
    keywords: ["вес", "идеальный", "норма", "формула"],
    icon: "Scale",
    groupId: "health",
    implemented: false,
    hidden: true,
    seoTitle: "Калькулятор идеального веса онлайн — формулы Брока, Девина",
    seoTitleEn: "Ideal Body Weight Calculator — Devine, Robinson & Miller",
    seoDescription:
      "Калькулятор идеального веса онлайн бесплатно: узнайте свой здоровый вес по формулам Брока, Девина, Лоренца и Робинсона по росту.",
    seoDescriptionEn:
      "Compute ideal body weight ranges using validated clinical formulas including Devine, Robinson, Miller, and Hamwi methods.",
  },
  {
    id: "water-intake",
    slug: "water-intake",
    name: "Ориентир потребления воды",
    nameEn: "Water Intake",
    description: "Ориентировочный диапазон воды по массе тела",
    descriptionEn: "Estimate a starting water-intake range from body weight",
    keywords: ["вода", "норма", "питьё", "здоровье"],
    icon: "WaterDrop",
    groupId: "health",
    implemented: true,
    seoTitle: "Норма воды в день онлайн — калькулятор водного баланса",
    seoTitleEn: "Daily Water Intake Calculator — Hydration Needs by Weight",
    seoDescription:
      "Калькулятор нормы воды онлайн бесплатно: рассчитайте, сколько литров воды нужно выпивать в день по весу и уровню физической активности.",
    seoDescriptionEn:
      "Calculate your recommended daily water intake in liters and cups based on body weight, climate conditions, and exercise intensity.",
  },
  {
    id: "sleep-calc",
    slug: "sleep-calc",
    name: "Калькулятор сна",
    nameEn: "Sleep Calculator",
    description: "Ориентировочное время сна по циклам",
    descriptionEn: "Estimate sleep times from cycle assumptions",
    keywords: ["сон", "циклы", "пробуждение", "здоровье"],
    icon: "Bedtime",
    groupId: "health",
    implemented: true,
    seoTitle: "Калькулятор сна онлайн — циклы сна и лёгкое пробуждение",
    seoTitleEn: "Sleep Cycle Calculator — Wake Up Refreshed by REM Cycles",
    seoDescription:
      "Калькулятор сна онлайн бесплатно: рассчитайте оптимальное время отхода ко сну или пробуждения по 90-минутным фазам для бодрости утром.",
    seoDescriptionEn:
      "Calculate optimal bedtime and wake-up hours based on natural 90-minute REM sleep cycles to wake up energized and refreshed.",
  },
  {
    id: "heart-rate-zone",
    slug: "heart-rate-zone",
    name: "Зоны пульса",
    nameEn: "Heart Rate Zones",
    description: "Ориентировочные диапазоны пульса по возрасту",
    descriptionEn: "Estimate age-based exercise heart-rate ranges",
    keywords: ["пульс", "зоны", "тренировка", "кардио"],
    icon: "MonitorHeart",
    groupId: "health",
    implemented: true,
    seoTitle: "Зоны пульса онлайн — расчёт пульсовых зон для бега",
    seoTitleEn: "Target Heart Rate Zones Calculator — Karvonen Formula",
    seoDescription:
      "Калькулятор зон пульса онлайн бесплатно: рассчитайте индивидуальные границы пульса для жиросжигания, кардио и выносливости по Карвонену.",
    seoDescriptionEn:
      "Calculate targeted cardiovascular heart rate training zones using the Karvonen formula and resting heart rate for peak fitness.",
  },
  {
    id: "body-fat",
    slug: "body-fat",
    name: "Процент жира",
    nameEn: "Body Fat Percentage",
    description: "Расчёт процента жира в организме",
    descriptionEn: "Calculate body fat percentage",
    keywords: ["жир", "процент", "тело", "состав"],
    icon: "Accessibility",
    groupId: "health",
    implemented: false,
    hidden: true,
    seoTitle: "Калькулятор процента жира онлайн — формула ВМС США",
    seoTitleEn: "Body Fat Percentage Calculator — US Navy Fitness Formula",
    seoDescription:
      "Калькулятор процента жира онлайн бесплатно: расчёт доли подкожного жира по окружностям шеи, талии и бедер по методике ВМС США.",
    seoDescriptionEn:
      "Estimate body fat percentage using the US Navy tape measure method from waist, neck, and hip circumferences with lean mass estimates.",
  },
  {
    id: "pregnancy-calc",
    slug: "pregnancy-calc",
    name: "Калькулятор беременности",
    nameEn: "Pregnancy Calculator",
    description: "Оценка даты родов и текущего срока по последней менструации",
    descriptionEn: "Estimate due date and gestational age from the last period",
    keywords: ["беременность", "роды", "дата", "неделя", "срок"],
    icon: "ChildFriendly",
    groupId: "health",
    implemented: true,
    seoTitle: "Калькулятор беременности онлайн — срок родов по дате",
    seoTitleEn: "Pregnancy Due Date Calculator — Estimate Delivery Date",
    seoDescription:
      "Калькулятор беременности онлайн бесплатно: рассчитайте предполагаемую дату родов (ПДР), текущую неделю и триместр по дню последней менструации.",
    seoDescriptionEn:
      "Estimate your expected delivery date (EDD), current gestational week, and trimester timeline based on the last menstrual period.",
  },

  // === ФИНАНСЫ ===
  {
    id: "budget-planner",
    slug: "budget-planner",
    name: "Планировщик бюджета",
    nameEn: "Budget Planner",
    description: "Расчёт месячного баланса и доли остатка",
    descriptionEn: "Calculate a monthly balance and savings rate",
    keywords: ["бюджет", "расходы", "доходы", "планирование"],
    icon: "AccountBalanceWallet",
    groupId: "finance",
    implemented: true,
    seoTitle: "Планировщик бюджета онлайн — калькулятор доходов и расходов",
    seoTitleEn: "Budget Planner Online — Monthly Income & Expense Tracker",
    seoDescription:
      "Планировщик личного бюджета онлайн бесплатно: распределяйте доходы и траты по категориям, планируйте сбережения и контролируйте баланс.",
    seoDescriptionEn:
      "Plan personal and household budgets with monthly income tracking, expense categorization, and smart savings goal forecasts.",
  },
  {
    id: "investment-calc",
    slug: "investment-calc",
    name: "Инвестиционный калькулятор",
    nameEn: "Investment Calculator",
    description: "Расчёт будущей стоимости инвестиций",
    descriptionEn: "Calculate the future value of an investment",
    keywords: ["инвестиции", "доходность", "прибыль", "ROI"],
    icon: "Insights",
    groupId: "finance",
    implemented: true,
    seoTitle: "Инвестиционный калькулятор онлайн — расчёт доходности",
    seoTitleEn: "Investment Calculator — Portfolio Returns & Compound Growth",
    seoDescription:
      "Инвестиционный калькулятор онлайн бесплатно: смоделируйте рост капитала, доходность акций и облигаций с учётом регулярных инвестиций.",
    seoDescriptionEn:
      "Forecast long-term investment returns and compound wealth accumulation across stocks, bonds, and mutual funds with recurring contributions.",
  },
  {
    id: "inflation-calc",
    slug: "inflation-calc",
    name: "Калькулятор инфляции",
    nameEn: "Inflation Calculator",
    description: "Будущая стоимость и покупательная способность суммы",
    descriptionEn: "Estimate future cost or purchasing power",
    keywords: [
      "инфляция",
      "деньги",
      "обесценивание",
      "покупательная способность",
    ],
    icon: "TrendingDown",
    groupId: "finance",
    implemented: true,
    seoTitle: "Калькулятор инфляции — покупательная способность денег",
    seoTitleEn: "Inflation Calculator — Historical Purchasing Power",
    seoDescription:
      "Калькулятор инфляции онлайн: оцените обесценивание накоплений со временем, покупательную способность и реальную стоимость капитала.",
    seoDescriptionEn:
      "Calculate the real impact of inflation on purchasing power over time. Compare historical money worth with current equivalent values.",
  },
  {
    id: "retirement-calc",
    slug: "retirement-calc",
    name: "Пенсионный калькулятор",
    nameEn: "Retirement Calculator",
    description: "Сценарий личных накоплений к выбранному сроку",
    descriptionEn: "Project personal savings over a chosen term",
    keywords: ["пенсия", "накопления", "пенсионный", "фонд"],
    icon: "ElderlyWoman",
    groupId: "finance",
    implemented: true,
    seoTitle: "Пенсионный калькулятор онлайн — расчёт пенсионного капитала",
    seoTitleEn: "Retirement Calculator — Estimate Retirement Nest Egg Online",
    seoDescription:
      "Пенсионный калькулятор онлайн бесплатно: рассчитайте необходимый капитал для выхода на пенсию и размер ежемесячных отчислений.",
    seoDescriptionEn:
      "Estimate required retirement nest eggs and retirement income potential adjusting for inflation, safe withdrawal rates, and growth.",
  },
  {
    id: "deposit-calc",
    slug: "deposit-calc",
    name: "Депозитный калькулятор",
    nameEn: "Deposit Calculator",
    description: "Расчёт суммы вклада и начисленных процентов",
    descriptionEn: "Calculate a deposit balance and earned interest",
    keywords: ["депозит", "вклад", "проценты", "банк"],
    icon: "Savings",
    groupId: "finance",
    implemented: true,
    seoTitle: "Депозитный калькулятор онлайн — расчёт процентов по вкладу",
    seoTitleEn: "Deposit Calculator Online — Certificate of Deposit Interest",
    seoDescription:
      "Депозитный калькулятор онлайн: рассчитайте итоговую прибыль по банковскому вкладу с капитализацией процентов и пополнениями бесплатно.",
    seoDescriptionEn:
      "Calculate bank deposit interest yields with monthly or annual compounding, tax adjustments, and flexible deposit top-ups.",
  },

  // === ДАННЫЕ И БЕЗОПАСНОСТЬ ===
  {
    id: "password-strength",
    slug: "password-strength",
    name: "Надёжность пароля",
    nameEn: "Password Strength",
    description: "Проверка надёжности пароля и рекомендации",
    descriptionEn: "Check password strength with recommendations",
    keywords: ["пароль", "надёжность", "безопасность", "взлом"],
    icon: "Shield",
    groupId: "security",
    implemented: true,
    seoTitle: "Проверка надёжности пароля — оценка времени подбора",
    seoTitleEn: "Password Strength Checker — Entropy & Crack Time Meter",
    seoDescription:
      "Проверка надёжности пароля онлайн бесплатно: оценка времени взлома брутфорсом, энтропии и безопасности пароля без передачи в сеть.",
    seoDescriptionEn:
      "Test password strength with real-time entropy measurements, brute-force crack time estimates, and actionable security advice.",
  },
  {
    id: "email-validator",
    slug: "email-validator",
    name: "Валидатор Email",
    nameEn: "Email Validator",
    description: "Проверка корректности email адресов",
    descriptionEn: "Validate email address format",
    keywords: ["email", "валидация", "проверка", "почта"],
    icon: "MarkEmailRead",
    groupId: "security",
    implemented: true,
    seoTitle: "Валидатор Email онлайн — проверка синтаксиса и домена почты",
    seoTitleEn: "Email Validator Online — Verify Email Syntax & Format",
    seoDescription:
      "Проверка адресов электронной почты онлайн бесплатно: валидация синтаксиса RFC, проверка формата домена и обнаружение опечаток в email.",
    seoDescriptionEn:
      "Validate email address syntax, check for common domain typos, verify RFC compliance, and detect disposable mail services.",
  },
  {
    id: "url-validator",
    slug: "url-validator",
    name: "Валидатор URL",
    nameEn: "URL Validator",
    description: "Проверка и парсинг URL адресов",
    descriptionEn: "Validate and parse URL addresses",
    keywords: ["url", "ссылка", "валидация", "проверка"],
    icon: "LinkOff",
    groupId: "security",
    implemented: true,
    seoTitle: "Валидатор URL онлайн — проверка структуры и протокола ссылок",
    seoTitleEn: "URL Validator Online — Verify Link Syntax & Structure",
    seoDescription:
      "Проверка ссылок URL онлайн бесплатно: валидация протокола, доменного имени, портов, путей и GET-параметров в адресной строке.",
    seoDescriptionEn:
      "Inspect and validate URL syntax, protocols, domain formatting, port assignments, and URL query strings against RFC standards.",
  },
  {
    id: "ip-validator",
    slug: "ip-validator",
    name: "Валидатор IP",
    nameEn: "IP Validator",
    description: "Проверка IPv4 и IPv6 адресов",
    descriptionEn: "Validate IPv4 and IPv6 addresses",
    keywords: ["ip", "адрес", "ipv4", "ipv6", "валидация"],
    icon: "Router",
    groupId: "security",
    implemented: true,
    seoTitle: "Валидатор IP адресов онлайн — проверка IPv4 и IPv6 формата",
    seoTitleEn: "IP Address Validator — Check IPv4 & IPv6 Format Online",
    seoDescription:
      "Валидация IP-адресов онлайн бесплатно: проверка корректности записи IPv4 и IPv6, определение типа адреса (публичный, локальный, мультикаст).",
    seoDescriptionEn:
      "Validate IPv4 and IPv6 address formats against networking standards. Detect private, public, loopback, and broadcast ranges.",
  },
  {
    id: "phone-validator",
    slug: "phone-validator",
    name: "Валидатор телефонов",
    nameEn: "Phone Validator",
    description: "Проверка и форматирование телефонных номеров",
    descriptionEn: "Validate and format phone numbers",
    keywords: ["телефон", "номер", "валидация", "формат"],
    icon: "PhoneAndroid",
    groupId: "security",
    implemented: true,
    seoTitle: "Валидатор номеров телефонов — международный формат E.164",
    seoTitleEn: "Phone Number Validator — Verify International E.164 Format",
    seoDescription:
      "Проверка номеров телефонов онлайн бесплатно: определение кода страны, оператора, типа номера и форматирование в стандарт E.164.",
    seoDescriptionEn:
      "Verify and format international phone numbers into the E.164 standard. Detect country codes and national dialing prefixes.",
  },
  {
    id: "iin-validator",
    slug: "iin-validator",
    name: "Валидатор ИИН Казахстан",
    nameEn: "Kazakhstan IIN Validator",
    description:
      "Локальная проверка 12 цифр и контрольной суммы ИИН Казахстана",
    descriptionEn:
      "Locally validate the 12 digits and checksum of a Kazakhstan IIN",
    keywords: [
      "иин",
      "казахстан",
      "валидация",
      "iin",
      "kazakhstan",
      "идентификационный номер",
      "проверка иин",
    ],
    icon: "BadgeCheck",
    groupId: "security",
    featured: true,
    implemented: true,
    seoTitle: "Валидатор ИИН Казахстана — проверка контрольного разряда",
    seoTitleEn: "Kazakhstan IIN Validator — Check IIN Format & Digits",
    seoDescription:
      "Проверка ИИН Казахстана онлайн бесплатно: вычисление контрольного разряда по официальному алгоритму, определение даты рождения и пола.",
    seoDescriptionEn:
      "Validate 12-digit Kazakhstan Individual Identification Numbers (IIN) using the official weighted checksum algorithm.",
  },
  {
    id: "kz-phone-formatter",
    slug: "kz-phone-formatter",
    name: "Форматирование телефонов Казахстана",
    nameEn: "Kazakhstan Phone Formatter",
    description:
      "Нормализация номера Казахстана в международный, национальный и E.164 формат",
    descriptionEn:
      "Normalize Kazakhstan numbers to international, national, and E.164 formats",
    keywords: ["телефон казахстан", "kz phone", "+7", "формат номера", "e.164"],
    icon: "PhoneAndroid",
    groupId: "security",
    featured: true,
    implemented: true,
    seoTitle: "Форматирование телефонов Казахстана — формат номеров +7",
    seoTitleEn: "Kazakhstan Phone Number Formatter — Format +7 (7XX) Online",
    seoDescription:
      "Форматирование телефонных номеров Казахстана онлайн: приведение к стандартному виду +7 (7XX) XXX-XX-XX с проверкой кода оператора.",
    seoDescriptionEn:
      "Format Kazakhstan mobile and landline telephone numbers into clean standard +7 (7XX) XXX-XX-XX national notation.",
  },
  {
    id: "bin-validator",
    slug: "bin-validator",
    name: "BIN/IIN валидатор карт",
    nameEn: "Card BIN/IIN Validator",
    description:
      "Определение платёжной сети по BIN/IIN и Luhn-проверка полного номера",
    descriptionEn:
      "Detect the payment-network range and run Luhn for a complete card number",
    keywords: [
      "bin",
      "iin",
      "карта",
      "банк",
      "luhn",
      "visa",
      "mastercard",
      "эмитент",
    ],
    icon: "BadgeCheck",
    groupId: "security",
    featured: true,
    implemented: true,
    seoTitle: "BIN/IIN валидатор карт — банк эмитент и платёжная система",
    seoTitleEn: "Bank BIN/IIN Card Validator — Check Issuer & Card Type",
    seoDescription:
      "Проверка первых цифр банковской карты (BIN/IIN) онлайн: определение банка-эмитента, типа карты (дебетовая, кредитная) и страны.",
    seoDescriptionEn:
      "Lookup bank identification numbers (BIN/IIN) to discover issuing bank names, card brands (Visa, Mastercard), and card tiers.",
  },
  {
    id: "kz-salary-calc",
    slug: "kz-salary-calc",
    name: "Калькулятор зарплаты Казахстан",
    nameEn: "Kazakhstan Salary Calculator",
    description:
      "Оценка зарплаты на руки: ОПВ, взнос ОСМС и ИПН по правилам 2026 года",
    descriptionEn:
      "Estimate take-home pay with 2026 employee OPV, MSHI and IIT",
    keywords: [
      "зарплата казахстан",
      "ипн",
      "опв",
      "восмс",
      "осмс",
      "тенге",
      "kz salary",
      "kazakhstan tax",
    ],
    icon: "AttachMoney",
    groupId: "finance",
    featured: true,
    implemented: true,
    seoTitle: "Калькулятор зарплаты Казахстан 2026 — расчёт ОПВ, ВОСМС, ИПН",
    seoTitleEn: "Kazakhstan Salary Calculator 2026 — Net Pay & Taxes",
    seoDescription:
      "Расчёт зарплаты в Казахстане онлайн: оклад в чистую зарплату на руки (Net) с вычетом ОПВ (10%), ИПН (10%), ВОСМС (2%), СО и ООСМС.",
    seoDescriptionEn:
      "Calculate take-home salary in Kazakhstan with 2026 statutory deductions: mandatory pension (OPV), medical fund (OSMS), and income tax.",
  },
  {
    id: "json-data-gen",
    slug: "json-data-gen",
    name: "Генератор JSON данных",
    nameEn: "JSON Data Generator",
    description: "Создание тестовых JSON и CSV данных",
    descriptionEn: "Generate test JSON and CSV data",
    keywords: ["json", "csv", "данные", "тестовые", "генератор"],
    icon: "DataArray",
    groupId: "security",
    implemented: true,
    seoTitle: "Генератор JSON данных онлайн — схемы и моковые объекты",
    seoTitleEn: "JSON Data Generator — Create Structured Mock JSON Objects",
    seoDescription:
      "Генератор JSON данных онлайн бесплатно: создавайте тестовые массивы объектов с именами, ID, датами и адресами для разработки API.",
    seoDescriptionEn:
      "Generate structured mock JSON datasets with realistic field types, random IDs, timestamps, and nested objects for API mocks.",
  },
  {
    id: "checksum-calc",
    slug: "checksum-calc",
    name: "Контрольная сумма",
    nameEn: "Checksum Calculator",
    description: "Расчёт CRC-32 и Adler-32 для текста или файла",
    descriptionEn: "Calculate CRC-32 and Adler-32 for text or a file",
    keywords: ["контрольная сумма", "checksum", "файл", "проверка"],
    icon: "Verified",
    groupId: "security",
    implemented: true,
    seoTitle: "Калькулятор контрольной суммы — CRC32, MD5, SHA онлайн",
    seoTitleEn: "Checksum Calculator Online — CRC32, MD5, SHA-1 & SHA-256",
    seoDescription:
      "Вычисление контрольных сумм онлайн бесплатно: расчёт CRC32, MD5, SHA-1 и SHA-256 для проверки целостности текстовых блоков и файлов.",
    seoDescriptionEn:
      "Calculate cryptographic checksums including CRC32, MD5, SHA-1, and SHA-256 to verify data integrity and detect file corruption.",
  },
  {
    id: "iban-validator",
    slug: "iban-validator",
    name: "Валидатор IBAN",
    nameEn: "IBAN Validator",
    description: "Проверка и валидация международных банковских номеров IBAN",
    descriptionEn: "Validate international bank account numbers (IBAN)",
    keywords: ["iban", "банк", "счёт", "валидация", "международный", "bic"],
    icon: "AccountBalance",
    groupId: "security",
    implemented: true,
    seoTitle: "Валидатор IBAN онлайн — проверка международного номера счёта",
    seoTitleEn: "IBAN Validator Online — Verify International Bank Account",
    seoDescription:
      "Проверка номеров IBAN онлайн бесплатно: валидация контрольной суммы Mod-97 (ISO 7064), проверка структуры и кода страны банка.",
    seoDescriptionEn:
      "Validate International Bank Account Numbers (IBAN) using the ISO 7064 Mod-97 checksum algorithm across 80+ supported countries.",
  },
  {
    id: "kz-iban-validator",
    slug: "kz-iban-validator",
    name: "Валидатор IBAN Казахстан",
    nameEn: "Kazakhstan IBAN Validator",
    description:
      "Проверка структуры казахстанского IBAN и контрольной суммы MOD-97",
    descriptionEn: "Validate Kazakhstan IBAN structure and its MOD-97 checksum",
    keywords: [
      "iban казахстан",
      "kz iban",
      "контрольная сумма iban",
      "структура iban",
      "mod-97",
    ],
    icon: "AccountBalance",
    groupId: "security",
    featured: true,
    implemented: true,
    seoTitle: "Валидатор IBAN Казахстан онлайн — проверка KZ счёта",
    seoTitleEn: "Kazakhstan IBAN Validator — Verify KZ Bank Account Codes",
    seoDescription:
      "Проверка казахстанских номеров IBAN онлайн: валидация 20-значного номера KZ..., проверка контрольных цифр и кода банка Казахстана.",
    seoDescriptionEn:
      "Verify 20-character Kazakhstan IBAN bank accounts with check digit verification and bank identification lookup.",
  },
  {
    id: "kz-holidays",
    slug: "kz-holidays",
    name: "Праздники Казахстана 2026",
    nameEn: "Kazakhstan Public Holidays 2026",
    description:
      "Официальные праздники и опубликованные переносы РК на 2026 год",
    descriptionEn:
      "Official Kazakhstan holidays and published transfers for 2026",
    keywords: [
      "праздники казахстан 2026",
      "выходные кз",
      "наурыз",
      "курбан айт",
      "день республики",
      "kazakhstan holidays",
      "public holidays kz",
    ],
    icon: "CalendarToday",
    groupId: "datetime",
    featured: true,
    implemented: true,
    seoTitle: "Праздники Казахстана 2026 — производственный календарь",
    seoTitleEn: "Kazakhstan Public Holidays 2026 — Official Calendar & Days Off",
    seoDescription:
      "Производственный календарь и государственные праздники Казахстана 2026 года: Наурыз, День Республики, выходные и праздничные дни.",
    seoDescriptionEn:
      "Official calendar of national holidays and non-working days in Kazakhstan for 2026, including Nauryz and Republic Day.",
  },
  {
    id: "kz-postal-code",
    slug: "kz-postal-code",
    name: "Валидатор почтового индекса Казахстана",
    nameEn: "Kazakhstan Postal Code Validator",
    description:
      "Проверка шестизначного индекса и семисимвольного индекса строения",
    descriptionEn:
      "Validate six-digit postal codes and seven-character building indexes",
    keywords: [
      "почтовый индекс казахстан",
      "индекс алматы",
      "индекс астана",
      "kz postal code",
      "kazpost",
      "почта казахстан",
    ],
    icon: "MarkEmailRead",
    groupId: "security",
    featured: true,
    implemented: true,
    seoTitle: "Почтовые индексы Казахстана — проверка нового индекса Казпочты",
    seoTitleEn: "Kazakhstan Postal Code Validator — Check Kazpost Postal Codes",
    seoDescription:
      "Проверка и справочник почтовых индексов Казахстана: валидация 7-значных буквенно-цифровых индексов Казпочты по городам и областям.",
    seoDescriptionEn:
      "Validate and lookup official 7-character alphanumeric Kazpost postal zip codes across Kazakhstan regions and cities.",
  },
  {
    id: "kz-address-format",
    slug: "kz-address-format",
    name: "Форматирование адреса Казахстана",
    nameEn: "Kazakhstan Address Formatter",
    description:
      "Составление почтового адреса Казахстана в официальном порядке строк",
    descriptionEn:
      "Compose a Kazakhstan mailing address in the official line order",
    keywords: [
      "адрес казахстан",
      "формат адреса кз",
      "казпочта",
      "почтовый адрес",
      "почтовый формат",
      "kz address",
      "kazpost format",
    ],
    icon: "LocationOn",
    groupId: "security",
    featured: true,
    implemented: true,
    seoTitle: "Форматирование адреса Казахстана — стандарт адресов РК",
    seoTitleEn: "Kazakhstan Address Formatter — Official Address Standards",
    seoDescription:
      "Стандартизация и форматирование почтовых адресов Казахстана онлайн: приведение к официальным правилам оформления отправлений Казпочты.",
    seoDescriptionEn:
      "Format postal mailing addresses for Kazakhstan following Kazpost and national address registry formatting standards.",
  },

  // === РАЗВЛЕЧЕНИЯ И РАНДОМ ===
  {
    id: "wheel-spinner",
    slug: "wheel-spinner",
    name: "Колесо фортуны",
    nameEn: "Wheel Spinner",
    description: "Рандомный выбор с анимированным колесом",
    descriptionEn: "Random selection with animated wheel",
    keywords: ["колесо", "фортуна", "рандом", "выбор", "спиннер"],
    icon: "Cyclone",
    groupId: "entertainment",
    implemented: false,
    hidden: true,
    seoTitle: "Колесо фортуны онлайн — крутить рулетку со своими вариантами",
    seoTitleEn: "Wheel Spinner Online — Spin the Wheel with Custom Names",
    seoDescription:
      "Колесо фортуны онлайн бесплатно: добавьте свои варианты, имена или призы, крутите барабан со звуковыми эффектами и делитесь итогом.",
    seoDescriptionEn:
      "Spin the wheel with custom names, choices, or giveaway prizes. Realistic rotation physics, sound effects, and full-screen mode.",
  },
  {
    id: "dice-roller",
    slug: "dice-roller",
    name: "Бросок кубиков",
    nameEn: "Dice Roller",
    description: "Виртуальные кубики D4, D6, D8, D10, D12, D20",
    descriptionEn: "Virtual dice D4, D6, D8, D10, D12, D20",
    keywords: ["кубик", "дайс", "бросок", "D6", "D20"],
    icon: "Casino",
    groupId: "entertainment",
    implemented: false,
    hidden: true,
    seoTitle: "Бросок кубиков онлайн — виртуальные кости d6, d20, d100",
    seoTitleEn: "Dice Roller Online — Roll Polyhedral Dice d6, d20 & d100",
    seoDescription:
      "Бросок кубиков онлайн бесплатно: виртуальные кости d4, d6, d8, d10, d12, d20, d100 для настольных игр и D&D с подсчётом суммы очков.",
    seoDescriptionEn:
      "Roll virtual polyhedral dice for tabletop RPGs and D&D: d4, d6, d8, d10, d12, d20, and d100 with modifier calculations and sum totals.",
  },
  {
    id: "coin-flip",
    slug: "coin-flip",
    name: "Подбросить монету",
    nameEn: "Coin Flip",
    description: "Орёл или решка с анимацией",
    descriptionEn: "Heads or tails with animation",
    keywords: ["монета", "орёл", "решка", "подбросить"],
    icon: "Toll",
    groupId: "entertainment",
    implemented: false,
    hidden: true,
    seoTitle: "Подбросить монету онлайн — орёл или решка в 3D",
    seoTitleEn: "Coin Flip Online — Heads or Tails 3D Coin Toss Simulator",
    seoDescription:
      "Подбросить монетку онлайн бесплатно: честный рандом орёл или решка с плавной 3D-анимацией броска для быстрого принятия решений.",
    seoDescriptionEn:
      "Flip a virtual coin online with 3D animation and provably fair random physics. Quickly resolve debates between heads or tails.",
  },
  {
    id: "random-picker",
    slug: "random-picker",
    name: "Случайный выбор",
    nameEn: "Random Picker",
    description:
      "Выбор из списка; число, монета и кубик в дополнительных режимах",
    descriptionEn:
      "Pick from a list, with number, coin and die modes available",
    keywords: [
      "случайный",
      "выбор",
      "список",
      "рандом",
      "монетка",
      "кубик",
      "жеребьёвка",
    ],
    icon: "Shuffle",
    groupId: "entertainment",
    featured: true,
    implemented: true,
    seoTitle: "Случайный выбор онлайн — рандомайзер вариантов из списка",
    seoTitleEn: "Random Picker Online — Pick a Random Item from List",
    seoDescription:
      "Генератор случайного выбора онлайн бесплатно: вставьте список участников или вариантов — инструмент случайно выберет победителя.",
    seoDescriptionEn:
      "Pick a random winner or select random items from custom text lists. Perfect for giveaways, contests, and quick decisions.",
  },
  {
    id: "decision-maker",
    slug: "decision-maker",
    name: "Помощник решений",
    nameEn: "Decision Maker",
    description: "Помощь в принятии решения: да/нет, из списка",
    descriptionEn: "Help making decisions: yes/no, from a list",
    keywords: ["решение", "выбор", "да", "нет", "помощник"],
    icon: "Psychology",
    groupId: "entertainment",
    implemented: false,
    hidden: true,
    seoTitle: "Помощник решений онлайн — генератор ответов Да или Нет",
    seoTitleEn: "Decision Maker Online — Random Choice Selector Tool",
    seoDescription:
      "Помощник принятия решений онлайн бесплатно: введите спорные варианты или получите однозначный ответ «Да» или «Нет» в один клик.",
    seoDescriptionEn:
      "Stuck on a tough decision? Enter your list of options and let this random decision generator pick a fair option for you instantly.",
  },
  {
    id: "team-generator",
    slug: "team-generator",
    name: "Генератор команд",
    nameEn: "Team Generator",
    description: "Случайное и равномерное разделение участников на команды",
    descriptionEn: "Randomly split participants into balanced teams",
    keywords: ["команды", "группы", "разделение", "игра"],
    icon: "Groups",
    groupId: "entertainment",
    implemented: true,
    seoTitle: "Генератор команд онлайн — случайное деление на команды",
    seoTitleEn: "Random Team Generator — Split Names into Balanced Teams",
    seoDescription:
      "Генератор команд онлайн бесплатно: введите список игроков или участников и разделите их на равные сбалансированные команды поровну.",
    seoDescriptionEn:
      "Split player names and group members into evenly balanced random teams for sports, gaming matches, and classroom group work.",
  },
  {
    id: "countdown",
    slug: "countdown",
    name: "Обратный отсчёт",
    nameEn: "Countdown Timer",
    description: "Простой таймер обратного отсчёта в минутах и секундах",
    descriptionEn: "A focused countdown timer in minutes and seconds",
    keywords: ["отсчёт", "таймер", "минуты", "секунды"],
    icon: "HourglassEmpty",
    groupId: "entertainment",
    implemented: true,
    seoTitle: "Обратный отсчёт онлайн — таймер до заданной даты",
    seoTitleEn: "Online Countdown Timer — Live Countdown to Any Event",
    seoDescription:
      "Таймер обратного отсчёта онлайн бесплатно: отсчёт дней, часов, минут и секунд до Нового года, дня рождения или важного дедлайна.",
    seoDescriptionEn:
      "Create customizable countdown timers for holidays, birthdays, or deadlines. Features real-time second tickers and audio alerts.",
  },
  {
    id: "random-color",
    slug: "random-color",
    name: "Случайный цвет",
    nameEn: "Random Color",
    description: "Случайный цвет с HEX, RGB и HSL",
    descriptionEn: "Generate a random color with HEX, RGB and HSL values",
    keywords: ["цвет", "случайный", "генерация", "палитра"],
    icon: "Colorize",
    groupId: "entertainment",
    implemented: true,
    seoTitle: "Случайный цвет онлайн — генератор случайных цветов HEX",
    seoTitleEn: "Random Color Generator — Generate Random HEX & RGB Colors",
    seoDescription:
      "Генератор случайных цветов онлайн бесплатно: мгновенно создавайте случайные оттенки с кодами HEX, RGB, HSL и копируйте палитры.",
    seoDescriptionEn:
      "Generate random colors with hex codes, RGB, and HSL values. Lock favorite swatches and copy color codes with one click.",
  },

  // === КОДИРОВАНИЕ И ДЕКОДИРОВАНИЕ ===
  {
    id: "base64-encoder",
    slug: "base64-encoder",
    name: "Base64 кодирование",
    nameEn: "Base64 Encoder",
    description: "Кодирование и декодирование Base64 текста и файлов",
    descriptionEn: "Encode and decode Base64 text and files",
    keywords: ["base64", "кодирование", "декодирование", "encode"],
    icon: "Lock",
    groupId: "encoding",
    implemented: true,
    seoTitle: "Base64 кодирование онлайн — преобразование текста в Base64",
    seoTitleEn: "Base64 Encoder Online — Convert Plain Text to Base64",
    seoDescription:
      "Кодирование текста в Base64 онлайн бесплатно: безопасное преобразование строк UTF-8 в представление Base64 прямо в вашем браузере.",
    seoDescriptionEn:
      "Encode UTF-8 plain text into Base64 format safely in browser. Copy encoded output to clipboard with one click.",
  },
  {
    id: "url-encoder",
    slug: "url-encoder",
    name: "URL кодирование",
    nameEn: "URL Encoder",
    description: "Кодирование и декодирование URL (percent-encoding)",
    descriptionEn: "Encode and decode URLs (percent-encoding)",
    keywords: ["url", "encode", "decode", "кодирование", "percent"],
    icon: "Link",
    groupId: "encoding",
    implemented: true,
    seoTitle: "URL кодирование онлайн — percent-encoding ссылок",
    seoTitleEn: "URL Encoder Online — Percent-Encode Links and URL Params",
    seoDescription:
      "Кодирование ссылок URL онлайн бесплатно: замена пробелов и спецсимволов на percent-коды (%20, %2F) для корректной передачи запросов.",
    seoDescriptionEn:
      "Encode URLs and special characters into standard percent-encoded strings to ensure safe transmission across HTTP query parameters.",
  },
  {
    id: "html-encoder",
    slug: "html-encoder",
    name: "HTML кодирование",
    nameEn: "HTML Encoder",
    description: "Экранирование HTML-сущностей",
    descriptionEn: "Escape HTML entities",
    keywords: ["html", "entities", "экранирование", "encode"],
    icon: "Code",
    groupId: "encoding",
    implemented: true,
    seoTitle: "HTML кодирование онлайн — экранирование тегов и сущностей",
    seoTitleEn: "HTML Encoder Online — Escape Tags & Special Entities",
    seoDescription:
      "Экранирование HTML онлайн бесплатно: преобразуйте скобки <, >, амперсанды & и кавычки в безопасные HTML-сущности для защиты от XSS.",
    seoDescriptionEn:
      "Escape HTML tags and characters into safe HTML entities to prevent XSS injection vulnerabilities in web markup.",
  },
  {
    id: "morse-code",
    slug: "morse-code",
    name: "Азбука Морзе",
    nameEn: "Morse Code",
    description: "Конвертация текста в код Морзе и обратно",
    descriptionEn: "Convert text to Morse code and back",
    keywords: ["морзе", "код", "точки", "тире", "телеграф"],
    icon: "MoreHoriz",
    groupId: "encoding",
    implemented: true,
    seoTitle: "Азбука Морзе онлайн — переводчик текста в точки и тире",
    seoTitleEn: "Morse Code Translator — Text to Morse Audio & Signals",
    seoDescription:
      "Переводчик азбуки Морзе онлайн бесплатно: перевод текста на русском и английском в точки и тире со звуковым воспроизведением сигнала.",
    seoDescriptionEn:
      "Translate plain English and Cyrillic text into Morse code dots and dashes with audio beep playback and flashing visual signals.",
  },
  {
    id: "binary-text",
    slug: "binary-text",
    name: "Бинарный текст",
    nameEn: "Binary Text",
    description: "Преобразование текста в двоичные байты UTF-8 и обратно",
    descriptionEn: "Convert text to UTF-8 binary bytes and back",
    keywords: ["бинарный", "двоичный", "текст", "конвертация"],
    icon: "Memory",
    groupId: "encoding",
    implemented: true,
    seoTitle: "Бинарный текст онлайн — перевод текста в двоичный код",
    seoTitleEn: "Text to Binary Converter — Convert Words to 0101 Code",
    seoDescription:
      "Перевод текста в двоичный код онлайн бесплатно: преобразуйте слова и фразы в нули и единицы (0101) и декодируйте обратно в текст.",
    seoDescriptionEn:
      "Convert plain text characters to 8-bit binary numbers (zeros and ones) and decode raw binary strings back to ASCII/UTF-8 letters.",
  },
  {
    id: "unicode-lookup",
    slug: "unicode-lookup",
    name: "Unicode справочник",
    nameEn: "Unicode Lookup",
    description:
      "Проверка любого символа или U+ кода; поиск по краткому индексу имён",
    descriptionEn:
      "Inspect any character or U+ code; search a curated name index",
    keywords: ["unicode", "символ", "эмодзи", "юникод"],
    icon: "EmojiSymbols",
    groupId: "symbols",
    implemented: true,
    seoTitle: "Unicode справочник онлайн — поиск символов и кодов UTF-8",
    seoTitleEn: "Unicode Lookup Tool — Search Character Codepoints & Hex",
    seoDescription:
      "Справочник символов Unicode онлайн бесплатно: поиск спецсимволов по названию, просмотр шестнадцатеричных кодов U+XXXX и HTML кодов.",
    seoDescriptionEn:
      "Search the complete Unicode character database by name or codepoint. View UTF-8 hex codes, decimal values, and category blocks.",
  },

  // === СИМВОЛЫ И EMOJI ===
  // Все категории символов слиты в symbol-catalog (см. registry.ts и next.config.ts редиректы)

  // === QR И ШТРИХ-КОДЫ ===
  {
    id: "qr-code-gen",
    slug: "qr-code-gen",
    name: "QR-код генератор",
    nameEn: "QR Code Generator",
    description:
      "QR-код из текста или URL с настройкой коррекции, размера и цветов",
    descriptionEn:
      "Create a QR code from text or a URL with correction, size and color controls",
    keywords: ["qr", "код", "генератор", "текст", "url", "png"],
    icon: "QrCode",
    groupId: "qrbarcode",
    implemented: true,
    seoTitle: "QR-код генератор онлайн — создать QR код бесплатно",
    seoTitleEn: "QR Code Generator — Create Custom QR for Links & Wi-Fi",
    seoDescription:
      "Генератор QR-кодов онлайн бесплатно: создайте QR-код для сайта, визитки, текста или Wi-Fi сети с настройкой цвета и размера.",
    seoDescriptionEn:
      "Create customizable QR codes for URLs, text, Wi-Fi credentials, and contact cards. Download high-resolution PNG or SVG vectors.",
  },
  {
    id: "barcode-gen",
    slug: "barcode-gen",
    name: "Штрих-код генератор",
    nameEn: "Barcode Generator",
    description: "EAN-13 и UPC-A с расчётом или проверкой контрольной цифры",
    descriptionEn:
      "EAN-13 and UPC-A with check-digit calculation or validation",
    keywords: ["штрих-код", "barcode", "ean-13", "upc-a", "gtin"],
    icon: "ViewColumn",
    groupId: "qrbarcode",
    implemented: true,
    seoTitle: "Штрих-код генератор онлайн — создание EAN-13, Code 128",
    seoTitleEn: "Barcode Generator Online — Create EAN-13, Code 128, UPC",
    seoDescription:
      "Генератор штрих-кодов онлайн бесплатно: создание кодов EAN-13, Code 128, UPC-A для маркировки товаров и скачивание в PNG и SVG.",
    seoDescriptionEn:
      "Generate standard barcodes including Code 128, EAN-13, UPC-A, and Code 39. Includes checksum validation and vector SVG export.",
  },

  // === ЦВЕТА И ПАЛИТРЫ ===
  {
    id: "color-wheel",
    slug: "color-wheel",
    name: "Цветовое колесо",
    nameEn: "Color Wheel",
    description: "Подбор гармоничной палитры по базовому цвету",
    descriptionEn: "Build a harmonious palette from a base color",
    keywords: ["цвет", "колесо", "гармония", "подбор"],
    icon: "Palette",
    groupId: "color",
    implemented: true,
    seoTitle: "Цветовое колесо онлайн — круг Иттена и цветовые гармонии",
    seoTitleEn: "Color Wheel Online — Itten Color Circle & Harmony Rules",
    seoDescription:
      "Цветовой круг онлайн бесплатно: подбор гармоничных триад, комплементарных и аналоговых цветовых схем для дизайнеров и художников.",
    seoDescriptionEn:
      "Explore interactive color wheels and build complementary, triadic, and analogous color harmonies for web and graphic design.",
  },
  {
    id: "contrast-checker",
    slug: "contrast-checker",
    name: "Проверка контраста",
    nameEn: "Contrast Checker",
    description: "WCAG проверка контраста текст/фон",
    descriptionEn: "WCAG contrast check for text/background",
    keywords: ["контраст", "wcag", "доступность", "a11y"],
    icon: "Contrast",
    groupId: "color",
    implemented: true,
    seoTitle: "Проверка контраста онлайн — соответствие стандарту WCAG",
    seoTitleEn: "WCAG Color Contrast Checker — Text Accessibility Standards",
    seoDescription:
      "Проверка контрастности цветов онлайн бесплатно: расчёт коэффициента контраста текста и фона по стандарту доступности WCAG 2.1 (AA/AAA).",
    seoDescriptionEn:
      "Calculate color contrast ratios between text and background colors against WCAG 2.1 AA and AAA accessibility compliance standards.",
  },
  {
    id: "color-blender",
    slug: "color-blender",
    name: "Смешивание цветов",
    nameEn: "Color Blender",
    description: "Палитра перехода между двумя цветами",
    descriptionEn: "Create a transition palette between two colors",
    keywords: ["смешивание", "цвета", "blend", "микс"],
    icon: "BlurOn",
    groupId: "color",
    implemented: true,
    seoTitle: "Смешивание цветов онлайн — плавный градиент между цветами",
    seoTitleEn: "Color Blender Online — Mix Colors & Create Palette Steps",
    seoDescription:
      "Смешивание цветов онлайн бесплатно: создайте палитру промежуточных оттенков между двумя цветами в заданное число шагов с кодами HEX.",
    seoDescriptionEn:
      "Blend two colors together and generate intermediate gradient color steps in HEX and RGB for UI design and data visualizations.",
  },
  {
    id: "image-colors",
    slug: "image-colors",
    name: "Цвета из изображения",
    nameEn: "Image Colors",
    description: "Извлечение цветовой палитры из фото",
    descriptionEn: "Extract color palette from photos",
    keywords: ["палитра", "фото", "извлечение", "цвет", "изображение"],
    icon: "PhotoCamera",
    groupId: "color",
    implemented: true,
    seoTitle: "Цвета из изображения онлайн — извлечь палитру из фото",
    seoTitleEn: "Image Colors Extractor — Pick Dominant Hues from Photo",
    seoDescription:
      "Извлечение цветов из фото онлайн бесплатно: загрузите картинку и получите основные цвета палитры с точными кодами HEX и RGB.",
    seoDescriptionEn:
      "Extract dominant color swatches and matching accent colors from any uploaded image with instant HEX code copying.",
  },
  {
    id: "tailwind-colors",
    slug: "tailwind-colors",
    name: "Tailwind CSS цвета",
    nameEn: "Tailwind CSS Colors",
    description: "Справочник HEX-палитры Tailwind CSS 3.4",
    descriptionEn: "Tailwind CSS 3.4 HEX palette reference",
    keywords: ["tailwind", "css", "цвета", "справочник"],
    icon: "Style",
    groupId: "color",
    implemented: true,
    seoTitle: "Tailwind CSS цвета — палитра цветов Tailwind с кодами",
    seoTitleEn: "Tailwind CSS Color Palette — Official Palette & HEX Swatches",
    seoDescription:
      "Справочник палитры Tailwind CSS онлайн: все официальные цвета (Slate, Gray, Blue, Emerald) с классами и точными HEX кодами.",
    seoDescriptionEn:
      "Browse the complete Tailwind CSS default color palette. Copy utility class names and exact HEX color values in one click.",
  },
  {
    id: "material-colors",
    slug: "material-colors",
    name: "Material Design цвета",
    nameEn: "Material Design Colors",
    description: "Классическая палитра Material Design 2014",
    descriptionEn: "Classic Material Design 2014 color palette",
    keywords: ["material", "design", "цвета", "google"],
    icon: "DesignServices",
    groupId: "color",
    implemented: true,
    seoTitle: "Material Design цвета — официальная палитра Google с кодами",
    seoTitleEn: "Material Design Colors — Google Material Palette & Swatches",
    seoDescription:
      "Палитра Material Design онлайн: оттенки цветов Google от 50 до 900 с кодами HEX для мобильной разработки и веб-дизайна.",
    seoDescriptionEn:
      "Explore the official Google Material Design color palette with shades from 50 to 900 and instant HEX/RGB clipboard copying.",
  },

  // === SEO ИНСТРУМЕНТЫ ===
  {
    id: "seo-meta-tool",
    slug: "seo-meta-tool",
    name: "SEO Meta Tool",
    nameEn: "SEO Meta Tool",
    description:
      "Title, description и URL → готовые мета-теги с предпросмотром",
    descriptionEn: "Turn a title, description and URL into previewed meta tags",
    keywords: [
      "мета",
      "теги",
      "seo",
      "og",
      "open graph",
      "twitter",
      "preview",
      "title",
      "description",
    ],
    icon: "TravelExplore",
    groupId: "seo",
    featured: true,
    implemented: true,
    seoTitle: "SEO Meta Tool онлайн — проверка и генерация мета-тегов",
    seoTitleEn: "SEO Meta Tool — Generate and Audit Meta Tags Online",
    seoDescription:
      "Инструмент проверки SEO мета-тегов онлайн: анализ Title, Description, Canonical и Open Graph для поисковой оптимизации страниц.",
    seoDescriptionEn:
      "Generate and audit HTML SEO meta tags, title lengths, descriptions, and Open Graph cards to maximize search engine rankings.",
  },
  {
    id: "text-extractor",
    slug: "text-extractor",
    name: "Извлечение текста из URL",
    nameEn: "Text Extractor",
    description: "Чистый текст из публичной веб-страницы или локального HTML",
    descriptionEn: "Extract clean text from a public page or local HTML file",
    keywords: ["текст", "url", "извлечение", "парсинг", "web"],
    icon: "TextSnippet",
    groupId: "seo",
    implemented: true,
    seoTitle: "Извлечение текста из URL онлайн — парсинг контента страницы",
    seoTitleEn: "Webpage Text Extractor — Extract Article Text from URL",
    seoDescription:
      "Извлечение текста со страницы сайта онлайн: парсер очищает страницу от рекламы и меню, оставляя только чистый читаемый текст статьи.",
    seoDescriptionEn:
      "Extract clean readable article text from any public web page URL, stripping away advertising banners, scripts, and navigation clutter.",
  },
  {
    id: "meta-generator",
    slug: "meta-generator",
    name: "Генератор мета-тегов",
    nameEn: "Meta Tag Generator",
    description: "Создание мета-тегов для SEO",
    descriptionEn: "Create meta tags for SEO",
    keywords: ["мета", "теги", "seo", "title", "description"],
    icon: "TravelExplore",
    groupId: "seo",
    implemented: true,
    hidden: true,
    seoTitle: "Генератор мета-тегов онлайн — создание тегов Title, Desc",
    seoTitleEn: "Meta Tag Generator — Build Essential Search Meta Tags",
    seoDescription:
      "Генератор мета-тегов онлайн бесплатно: создайте оптимизированные теги Title, Description, Keywords и Robots для страниц вашего сайта.",
    seoDescriptionEn:
      "Build comprehensive HTML search meta tags including Title, Description, Robots directives, and Open Graph tags for websites.",
  },
  {
    id: "og-preview",
    slug: "og-preview",
    name: "Open Graph Preview (превью соцсетей)",
    nameEn: "Open Graph Preview",
    description: "Предпросмотр Open Graph и Twitter карточек",
    descriptionEn: "Preview Open Graph and Twitter cards",
    keywords: ["og", "open graph", "twitter", "социальные сети", "preview"],
    icon: "Share",
    groupId: "seo",
    implemented: true,
    hidden: true,
    seoTitle: "Open Graph Preview онлайн — проверка превью в соцсетях",
    seoTitleEn: "Open Graph Preview Tool — Test Social Media Snippet Cards",
    seoDescription:
      "Проверка Open Graph разметки онлайн: посмотрите, как будет выглядеть ссылка вашего сайта в Telegram, Twitter, Facebook и ВКонтакте.",
    seoDescriptionEn:
      "Preview how your web page link snippet appears when shared across Facebook, Twitter, LinkedIn, and messaging platforms.",
  },
  {
    id: "robots-generator",
    slug: "robots-generator",
    name: "Robots.txt генератор",
    nameEn: "Robots.txt Generator",
    description: "Понятные правила доступа → готовый robots.txt",
    descriptionEn: "Turn clear crawler access rules into robots.txt",
    keywords: ["robots", "txt", "seo", "поисковики", "краулер"],
    icon: "SmartToy",
    groupId: "seo",
    implemented: true,
    seoTitle: "Robots.txt генератор онлайн — создание файла robots.txt",
    seoTitleEn: "Robots.txt Generator & Tester — Manage Crawler Directives",
    seoDescription:
      "Генератор robots.txt онлайн бесплатно: настройте правила индексации для Googlebot и Яндекс, укажите Sitemap и закройте разделы от роботов.",
    seoDescriptionEn:
      "Generate and test robots.txt directives for Googlebot and major search engines with custom Disallow, Allow, and Sitemap paths.",
  },
  {
    id: "sitemap-generator",
    slug: "sitemap-generator",
    name: "Sitemap генератор",
    nameEn: "Sitemap Generator",
    description: "Сканирование сайта или список URL → корректный XML sitemap",
    descriptionEn: "Scan a site or paste URLs to create a valid XML sitemap",
    keywords: ["sitemap", "xml", "seo", "карта сайта"],
    icon: "AccountTree",
    groupId: "seo",
    implemented: true,
    seoTitle: "Sitemap генератор онлайн — создать XML карту сайта",
    seoTitleEn: "XML Sitemap Generator — Create sitemap.xml for Websites",
    seoDescription:
      "Генератор XML карты сайта онлайн: создайте файл sitemap.xml со списком страниц, датами обновления и приоритетами для поисковых систем.",
    seoDescriptionEn:
      "Generate valid XML sitemap files conforming to the sitemaps.org protocol for accelerated search engine crawling and indexing.",
  },
  {
    id: "heading-checker",
    slug: "heading-checker",
    name: "Проверка заголовков",
    nameEn: "Heading Checker",
    description: "Анализ H1-H6 структуры HTML-страницы",
    descriptionEn: "Analyze H1-H6 structure of HTML page",
    keywords: ["заголовки", "h1", "h2", "структура", "seo"],
    icon: "Title",
    groupId: "seo",
    implemented: false,
    hidden: true,
    seoTitle: "Проверка заголовков H1-H6 онлайн — SEO анализ структуры",
    seoTitleEn: "Heading Structure Analyzer — Validate H1 to H6 Tag Hierarchy",
    seoDescription:
      "Анализ структуры заголовков страницы онлайн: проверка иерархии тегов H1, H2, H3, поиск дубликатов главного H1 и ошибок вёрстки.",
    seoDescriptionEn:
      "Audit HTML heading tag hierarchy (H1-H6) to detect skipped heading levels, multiple H1 tags, and improve document readability.",
  },
  {
    id: "keyword-density",
    slug: "keyword-density",
    name: "Плотность ключевых слов",
    nameEn: "Keyword Frequency",
    description: "Частые слова и фразы без выдуманной SEO-оценки",
    descriptionEn:
      "Find frequent words and phrases without a made-up SEO score",
    keywords: ["ключевые слова", "плотность", "частота", "seo"],
    icon: "Analytics",
    groupId: "seo",
    implemented: true,
    seoTitle: "Плотность ключевых слов онлайн — частотный анализ текста",
    seoTitleEn: "Keyword Frequency & Density Analyzer — SEO Content Audit",
    seoDescription:
      "Анализ плотности ключевых слов онлайн: подсчёт частоты употребления слов и фраз в тексте для защиты от поискового переспама (SEO).",
    seoDescriptionEn:
      "Measure keyword frequency and density percentages for 1-word, 2-word, and 3-word phrases to avoid search engine keyword stuffing.",
  },

  // === СЕТЬ И IP ===
  {
    id: "ip-calculator",
    slug: "ip-calculator",
    name: "IP калькулятор",
    nameEn: "IP Calculator",
    description: "Маска, сеть, broadcast и диапазон для одного IPv4/CIDR",
    descriptionEn: "Mask, network, broadcast and range for one IPv4/CIDR",
    keywords: ["ip", "подсеть", "маска", "cidr", "расчёт"],
    icon: "Lan",
    groupId: "network",
    implemented: true,
    seoTitle: "IP калькулятор онлайн — расчёт сетевых параметров IPv4",
    seoTitleEn: "IP Calculator Online — Network Address, Broadcast & Mask",
    seoDescription:
      "Сетевой IP калькулятор онлайн бесплатно: расчёт адреса подсети, широковещательного адреса (broadcast), маски и диапазона IP хостов.",
    seoDescriptionEn:
      "Calculate IPv4 network parameters, wildcards, usable host counts, broadcast addresses, and binary representations in real time.",
  },
  {
    id: "subnet-calc",
    slug: "subnet-calc",
    name: "Калькулятор подсетей",
    nameEn: "Subnet Calculator",
    description: "Минимальная IPv4-подсеть по числу используемых хостов",
    descriptionEn: "Smallest traditional IPv4 subnet for a host requirement",
    keywords: ["подсеть", "subnet", "маска", "хосты"],
    icon: "Hub",
    groupId: "network",
    implemented: true,
    seoTitle: "Калькулятор подсетей CIDR онлайн — расчёт маски подсети",
    seoTitleEn: "IP Subnet Calculator — IPv4 CIDR Mask & Host Ranges",
    seoDescription:
      "Калькулятор подсетей CIDR онлайн: быстрый расчёт маски подсети (/24, /16 и др.), числа доступных адресов и границ сетевых блоков.",
    seoDescriptionEn:
      "Calculate IPv4 subnets using CIDR notation. Instantly compute network addresses, broadcast IPs, subnet masks, and usable host ranges.",
  },
  {
    id: "mac-lookup",
    slug: "mac-lookup",
    name: "Разбор MAC-адреса и OUI",
    nameEn: "MAC Address & OUI Inspector",
    description:
      "Нормализация, биты адреса и поиск по краткой локальной OUI-базе",
    descriptionEn:
      "Normalize a MAC address, inspect its bits and check a small local OUI list",
    keywords: ["mac", "адрес", "производитель", "сетевая карта"],
    icon: "DeviceHub",
    groupId: "network",
    implemented: true,
    seoTitle: "Разбор MAC-адреса и OUI — поиск вендора сетевой карты",
    seoTitleEn: "MAC Address & OUI Inspector — Hardware Manufacturer Lookup",
    seoDescription:
      "Проверка MAC-адреса онлайн: определение производителя оборудования по базе IEEE OUI, типа сетевого адаптера и формата записи адреса.",
    seoDescriptionEn:
      "Lookup network device manufacturers and hardware vendors from MAC addresses using the official IEEE Organizationally Unique Identifier database.",
  },
  {
    id: "port-list",
    slug: "port-list",
    name: "Список портов",
    nameEn: "Port List",
    description: "Поиск распространённых TCP/UDP портов в кратком справочнике",
    descriptionEn: "Search a concise reference of common TCP/UDP ports",
    keywords: ["порт", "tcp", "udp", "сеть", "список"],
    icon: "SettingsEthernet",
    groupId: "network",
    implemented: true,
    seoTitle: "Список портов TCP и UDP — справочник сетевых служб",
    seoTitleEn: "Network Port Directory — Lookup TCP & UDP Port Services",
    seoDescription:
      "Справочник сетевых портов TCP и UDP онлайн: описание портов 80 (HTTP), 443 (HTTPS), 22 (SSH), 21 (FTP), 3306 (MySQL) и их назначение.",
    seoDescriptionEn:
      "Lookup standard TCP and UDP port numbers, service descriptions, and security assignments across well-known and registered ports.",
  },
  {
    id: "user-agent-parser",
    slug: "user-agent-parser",
    name: "User-Agent Parser (анализ браузера)",
    nameEn: "User-Agent Parser",
    description:
      "Эвристический разбор браузера, движка, ОС и класса устройства",
    descriptionEn: "Heuristically parse browser, engine, OS and device class",
    keywords: ["user-agent", "браузер", "парсинг", "анализ"],
    icon: "DevicesOther",
    groupId: "network",
    implemented: true,
    seoTitle: "User-Agent Parser онлайн — анализ данных браузера и ОС",
    seoTitleEn: "User-Agent Parser — Inspect Browser, OS & Device Details",
    seoDescription:
      "Анализ строки User-Agent онлайн: точное определение браузера, версии, операционной системы, архитектуры процессора и типа устройства.",
    seoDescriptionEn:
      "Inspect and parse your current browser User-Agent string to reveal operating system versions, rendering engines, and device hardware.",
  },

  // === ЕДИНИЦЫ ИЗМЕРЕНИЯ ===
  {
    id: "cooking-converter",
    slug: "cooking-converter",
    name: "Кулинарный конвертер",
    nameEn: "Cooking Converter",
    description:
      "Перевод кулинарных мер массы и объёма с необязательной плотностью",
    descriptionEn:
      "Convert cooking mass and volume measures with optional density",
    keywords: ["кулинарный", "рецепт", "чашки", "ложки", "граммы", "плотность"],
    icon: "Kitchen",
    groupId: "units",
    implemented: true,
    seoTitle: "Кулинарный конвертер мер и весов — ложки, стаканы, граммы",
    seoTitleEn: "Cooking Measurement Converter — Cups, Spoons & Grams",
    seoDescription:
      "Кулинарный конвертер мер онлайн: перевод муки, сахара, соли и жидкостей из стаканов и ложек в точные граммы и миллилитры для рецептов.",
    seoDescriptionEn:
      "Convert cooking ingredient measurements between cups, tablespoons, teaspoons, ounces, and grams for culinary recipes.",
  },
  {
    id: "shoe-size",
    slug: "shoe-size",
    name: "Размеры обуви",
    nameEn: "Shoe Sizes",
    description:
      "Ориентир взрослого размера EU, US, UK, JP и Mondopoint по длине стопы",
    descriptionEn:
      "Adult EU, US, UK, JP and Mondopoint guidance from foot length",
    keywords: ["обувь", "размер", "eu", "us", "uk", "mondopoint"],
    icon: "IceSkating",
    groupId: "units",
    implemented: true,
    seoTitle: "Размеры обуви онлайн — таблица перевода размеров Россия, EU, US",
    seoTitleEn: "Shoe Size Converter — International US, EU, UK & CM Chart",
    seoDescription:
      "Таблица размеров обуви онлайн: перевод мужских, женских и детских размеров между стандартами России, Европы (EU), США (US) и сантиметрами.",
    seoDescriptionEn:
      "Convert international shoe sizes between US, UK, European (EU), and Japanese centimeters (CM) for men, women, and children.",
  },
  {
    id: "clothing-size",
    slug: "clothing-size",
    name: "Размеры одежды",
    nameEn: "Clothing Sizes",
    description:
      "Ориентировочные взрослые маркировки одежды alpha, EU, US, UK и RU",
    descriptionEn:
      "Adult clothing-label guidance across alpha, EU, US, UK and RU references",
    keywords: ["одежда", "размер", "eu", "us", "uk", "ru", "xl"],
    icon: "Checkroom",
    groupId: "units",
    implemented: true,
    seoTitle: "Размеры одежды онлайн — международный конвертер размеров",
    seoTitleEn: "Clothing Size Converter — International Apparel Size Chart",
    seoDescription:
      "Таблица размеров одежды онлайн: перевод женских и мужских размеров (платья, джинсы, рубашки) между Россией, Европой, США и размерами S, M, L.",
    seoDescriptionEn:
      "Convert clothing apparel sizes across US, UK, European, and international formats (XS, S, M, L, XL) for men and women accurately.",
  },
  {
    id: "screen-resolution",
    slug: "screen-resolution",
    name: "Данные экрана браузера",
    nameEn: "Browser Display Snapshot",
    description:
      "Снимок CSS-размера экрана, области просмотра и devicePixelRatio",
    descriptionEn:
      "Snapshot the browser-reported CSS screen, viewport and devicePixelRatio",
    keywords: ["разрешение", "экран", "viewport", "dpr", "css", "пиксели"],
    icon: "Monitor",
    groupId: "units",
    implemented: true,
    seoTitle: "Данные экрана браузера — узнать разрешение и масштаб экрана",
    seoTitleEn: "Browser Display Snapshot — Screen Resolution & Viewport Info",
    seoDescription:
      "Узнайте разрешение своего экрана онлайн: ширина и высота в пикселях, viewport браузера, глубина цвета и коэффициент Device Pixel Ratio.",
    seoDescriptionEn:
      "Detect your display screen resolution, viewport dimensions, color depth, and device pixel ratio (DPR) instantly in your browser.",
  },
  {
    id: "paper-size",
    slug: "paper-size",
    name: "Форматы бумаги",
    nameEn: "Paper Sizes",
    description:
      "Размеры ISO A0–A10, Letter, Legal и Tabloid с пересчётом по DPI",
    descriptionEn:
      "ISO A0–A10, Letter, Legal and Tabloid dimensions with DPI conversion",
    keywords: ["бумага", "формат", "a4", "a3", "letter", "dpi"],
    icon: "Description",
    groupId: "units",
    implemented: true,
    seoTitle: "Форматы бумаги онлайн — размеры листов A4, A3, Letter в мм",
    seoTitleEn: "Paper Sizes Chart — ISO A4, A3, Letter Dimensions in MM & Inches",
    seoDescription:
      "Таблица форматов бумаги онлайн: точные размеры листов A0, A1, A2, A3, A4, A5, Letter и Legal в миллиметрах, сантиметрах и дюймах.",
    seoDescriptionEn:
      "Explore international ISO 216 paper dimensions (A4, A3, B5) and North American sizes (Letter, Legal) in millimeters, cm, and inches.",
  },

  // === ПРОДУКТИВНОСТЬ ===
  {
    id: "pomodoro",
    slug: "pomodoro",
    name: "Помодоро таймер",
    nameEn: "Pomodoro Timer",
    description:
      "Таймер фокуса и перерыва с паузой, настройкой длительности и тихим сигналом",
    descriptionEn:
      "Focus and break timer with pause, bounded durations and an optional quiet sound",
    keywords: ["помодоро", "таймер", "продуктивность", "работа"],
    icon: "AvTimer",
    groupId: "productivity",
    implemented: true,
    seoTitle: "Помодоро таймер онлайн — техника фокусировки 25/5",
    seoTitleEn: "Pomodoro Timer Online — 25/5 Productivity Focus Timer",
    seoDescription:
      "Таймер Помодоро онлайн бесплатно: повышайте концентрацию с интервалами 25 минут работы и 5 минут отдыха. Звуковые оповещения в браузере.",
    seoDescriptionEn:
      "Boost focus and productivity with the Pomodoro technique. Customizable 25-minute work intervals, break alerts, and clean layout.",
  },
  {
    id: "todo-list",
    slug: "todo-list",
    name: "Список задач",
    nameEn: "Todo List",
    description:
      "Локальный список задач с отметкой выполнения, фильтрами и защищённым хранением",
    descriptionEn:
      "Local task list with completion, filters and guarded browser storage",
    keywords: ["задачи", "todo", "список", "дела"],
    icon: "Checklist",
    groupId: "productivity",
    implemented: true,
    seoTitle: "Список задач онлайн — простой планировщик дел и чек-лист",
    seoTitleEn: "Online To-Do List — Minimalist Task & Checklist Manager",
    seoDescription:
      "Онлайн список задач To-Do бесплатно: планируйте дела на день, ставьте галочки у выполненных пунктов с сохранением списка в браузере.",
    seoDescriptionEn:
      "Manage daily tasks and checklists with a distraction-free browser to-do app. Features local persistence, filters, and priority tags.",
  },
  {
    id: "notes",
    slug: "notes",
    name: "Заметка",
    nameEn: "Note",
    description:
      "Одна заметка с явным сохранением и проверяемым локальным хранением",
    descriptionEn:
      "One note with explicit save and validated local browser storage",
    keywords: ["заметки", "блокнот", "записи", "текст"],
    icon: "StickyNote2",
    groupId: "productivity",
    implemented: true,
    seoTitle: "Онлайн заметки в браузере — быстрый блокнот с автосохранением",
    seoTitleEn: "Browser Scratchpad Notes — Fast Autosaving Text Pad",
    seoDescription:
      "Быстрые заметки онлайн: пишите мысли и черновики в браузере без регистрации. Автосохранение текста в localStorage без риска потери.",
    seoDescriptionEn:
      "Capture notes, scratchpads, and ideas in a clean browser-based notepad with persistent client-side autosave and clean markdown view.",
  },
  {
    id: "reading-time",
    slug: "reading-time",
    name: "Время чтения",
    nameEn: "Reading Time",
    description: "Расчёт времени чтения текста",
    descriptionEn: "Calculate text reading time",
    keywords: ["чтение", "время"],
    icon: "MenuBook",
    groupId: "productivity",
    implemented: false,
    hidden: true,
    seoTitle: "Время чтения текста онлайн — расчёт хронометража статьи",
    seoTitleEn: "Reading Time Calculator — Speech & Reading Duration",
    seoDescription:
      "Калькулятор времени чтения онлайн бесплатно: узнайте, сколько времени займёт прочтение статьи или книги при средней скорости чтения.",
    seoDescriptionEn:
      "Estimate silent reading time and spoken presentation duration in minutes based on customizable words-per-minute (WPM) speeds.",
  },
  {
    id: "typing-speed",
    slug: "typing-speed",
    name: "Тест скорости печати",
    nameEn: "Typing Speed Test",
    description:
      "Тест WPM, точности и текущих ошибок по нейтральному или своему тексту",
    descriptionEn:
      "Test WPM, accuracy and current errors with neutral or custom text",
    keywords: [
      "печать",
      "скорость",
      "клавиатура",
      "тест",
      "WPM",
      "точность",
      "ошибки",
    ],
    icon: "Keyboard",
    groupId: "productivity",
    implemented: true,
    seoTitle: "Тест скорости печати онлайн — тренажёр набора текста (WPM)",
    seoTitleEn: "Typing Speed Test Online — Test Words Per Minute (WPM)",
    seoDescription:
      "Проверьте свою скорость слепой печати онлайн: тест слов в минуту (WPM), точность набора и количество ошибок на русском и английском.",
    seoDescriptionEn:
      "Measure typing speed and accuracy in words per minute (WPM). Features real-time error tracking and typing rhythm analysis.",
  },

  // === АУДИО И ВИДЕО ===
  {
    id: "metronome",
    slug: "metronome",
    name: "Метроном",
    nameEn: "Metronome",
    description: "Онлайн-метроном для музыкантов",
    descriptionEn: "Online metronome for musicians",
    keywords: ["метроном", "ритм", "темп", "bpm", "музыка"],
    icon: "GraphicEq",
    groupId: "media",
    implemented: true,
    seoTitle: "Метроном онлайн — точный темп ударов в минуту (BPM)",
    seoTitleEn: "Online Metronome — Accurate BPM Tempo & Rhythm Beats",
    seoDescription:
      "Интерактивный метроном онлайн бесплатно: настройка темпа от 30 до 250 BPM, выбор размера такта (4/4, 3/4) и функция Tap Tempo для музыкантов.",
    seoDescriptionEn:
      "Precision musical metronome featuring adjustable 30-250 BPM tempos, common time signatures (2/4, 3/4, 4/4), visual flash, and tap tempo.",
  },
  {
    id: "tone-generator",
    slug: "tone-generator",
    name: "Генератор тонов",
    nameEn: "Tone Generator",
    description: "Генерация звуковых тонов заданной частоты",
    descriptionEn: "Generate sound tones at specified frequency",
    keywords: ["тон", "частота", "звук", "генератор", "герц"],
    icon: "MusicNote",
    groupId: "media",
    implemented: false,
    hidden: true,
    seoTitle: "Генератор тонов онлайн — звуковые частоты от 20 до 20000 Гц",
    seoTitleEn: "Online Tone Generator — Sine Wave & Audio Frequency Tester",
    seoDescription:
      "Генератор звуковых частот онлайн бесплатно: синусоида, меандр, пила и белый шум для тестирования динамиков, наушников и сабвуфера.",
    seoDescriptionEn:
      "Generate pure acoustic sound frequencies from 20 Hz to 20,000 Hz using sine, square, sawtooth, and triangle audio waveforms.",
  },
  {
    id: "speaker-dryer",
    slug: "speaker-dryer",
    name: "Тон для решётки динамика",
    nameEn: "Speaker Grille Tone",
    description:
      "Короткий низкочастотный тон, который может помочь вытеснить мелкие капли",
    descriptionEn:
      "A short low-frequency tone that may help move small droplets",
    keywords: [
      "динамик",
      "влага",
      "вода",
      "очистка",
      "speaker",
      "water",
      "dry",
    ],
    icon: "WaterDrop",
    groupId: "media",
    implemented: true,
    seoTitle: "Очистка динамика от воды звуком — тон для выталкивания влаги",
    seoTitleEn: "Speaker Water Ejector — Sound Tone to Clear Speaker Grille",
    seoDescription:
      "Очистите динамик телефона от воды и пыли с помощью низкочастотных звуковых колебаний (165 Гц), выталкивающих капли влаги наружу.",
    seoDescriptionEn:
      "Eject trapped water and dust from smartphone speaker grilles using tuned low-frequency sound vibrations and acoustic resonance.",
  },
  {
    id: "noise-generator",
    slug: "noise-generator",
    name: "Генератор шума и тона",
    nameEn: "Noise and Tone Generator",
    description: "Белый, розовый или коричневый шум и чистый тон",
    descriptionEn: "White, pink or brown noise and a pure tone",
    keywords: ["шум", "белый", "розовый", "коричневый", "частота", "тон"],
    icon: "Waves",
    groupId: "media",
    implemented: true,
    seoTitle: "Генератор шума онлайн — белый, розовый и коричневый шум",
    seoTitleEn: "Noise Generator Online — White, Pink & Brown Noise Audio",
    seoDescription:
      "Генератор шумов для сна и работы: прослушивание белого, розового и коричневого шума онлайн для маскировки посторонних звуков и фокуса.",
    seoDescriptionEn:
      "Generate soothing soundscapes of white, pink, and brown noise to mask distracting ambient sounds and improve deep sleep or focus.",
  },
  {
    id: "video-aspect",
    slug: "video-aspect",
    name: "Калькулятор разрешений и пропорций",
    nameEn: "Resolution & Aspect Ratio",
    description: "Соотношение сторон и новая высота по заданной ширине",
    descriptionEn:
      "Calculate an aspect ratio and a new height from a target width",
    keywords: ["видео", "пропорции", "соотношение", "разрешение", "16:9"],
    icon: "AspectRatio",
    groupId: "media",
    implemented: true,
    seoTitle: "Калькулятор пропорций видео — расчёт соотношения сторон 16:9",
    seoTitleEn: "Video Aspect Ratio Calculator — 16:9, 4:3, 21:9 Resolution",
    seoDescription:
      "Калькулятор соотношения сторон видео и фото онлайн: расчёт пропорций 16:9, 4:3, 21:9, 9:16 (Shorts/Reels) и размеров кадра в пикселях.",
    seoDescriptionEn:
      "Calculate video aspect ratios and pixel dimensions for 16:9, 9:16 vertical video, 4:3, and cinematic 21:9 ultra-wide displays.",
  },

  // === PDF-ИНСТРУМЕНТЫ ===
  {
    id: "pdf-studio",
    slug: "pdf-studio",
    name: "PDF Редактор",
    nameEn: "PDF Studio",
    description: "Добавляйте рисунки и текстовые заметки в PDF.",
    descriptionEn: "Add drawings and text notes to a PDF.",
    keywords: ["pdf", "редактор", "просмотр", "аннотации", "viewer"],
    icon: "Visibility",
    groupId: "pdf",
    featured: true,
    implemented: true,
    seoTitle: "PDF Редактор онлайн — объединение, сжатие и правка PDF",
    seoTitleEn: "PDF Studio Online — All-in-One PDF Editor & Organizer",
    seoDescription:
      "Универсальный онлайн-редактор PDF файлов: объединяйте, разделяйте, сжимайте и поворачивайте документы PDF прямо в браузере без установки.",
    seoDescriptionEn:
      "Full-featured browser PDF studio to merge, split, compress, reorder, and rotate document pages privately on your device.",
  },
  {
    id: "compress-pdf",
    slug: "compress-pdf",
    name: "Сжатие PDF",
    nameEn: "Compress PDF",
    description: "Уменьшайте размер PDF с выбранным уровнем качества.",
    descriptionEn: "Reduce a PDF file size with your chosen quality level.",
    keywords: [
      "pdf",
      "сжатие",
      "compress",
      "размер",
      "оптимизация",
      "уменьшить",
    ],
    icon: "Compress",
    groupId: "pdf",
    implemented: true,
    seoTitle: "Сжатие PDF онлайн — уменьшить вес документа бесплатно",
    seoTitleEn: "Compress PDF Online — Reduce PDF File Size Free",
    seoDescription:
      "Сжатие PDF документов онлайн бесплатно: уменьшите размер файла PDF для отправки по email с сохранением чёткости текста и изображений.",
    seoDescriptionEn:
      "Compress PDF documents to smaller file sizes for email attachments while preserving sharp text clarity and vector graphics.",
  },
  {
    id: "merge-pdf",
    slug: "merge-pdf",
    name: "Объединение PDF",
    nameEn: "Merge PDF",
    description: "Объединяйте выбранные страницы нескольких PDF в один файл.",
    descriptionEn: "Combine selected pages from multiple PDFs into one file.",
    keywords: [
      "pdf",
      "объединение",
      "merge",
      "combine",
      "соединить",
      "страницы",
      "диапазон",
    ],
    icon: "MergeType",
    groupId: "pdf",
    featured: true,
    implemented: true,
    seoTitle: "Объединение PDF онлайн — соединить файлы PDF в один документ",
    seoTitleEn: "Merge PDF Online — Combine Multiple PDF Documents Free",
    seoDescription:
      "Объедините несколько файлов PDF в один общий документ онлайн бесплатно: перетаскивайте страницы для сортировки прямо в браузере.",
    seoDescriptionEn:
      "Merge multiple PDF files into a single unified document in any order. Drag-and-drop page sorting processed safely in your browser.",
  },
  {
    id: "split-pdf",
    slug: "split-pdf",
    name: "Разделение PDF",
    nameEn: "Split PDF",
    description: "Разделяйте PDF на нужные части.",
    descriptionEn: "Split a PDF into the parts you need.",
    keywords: [
      "pdf",
      "разделение",
      "split",
      "страницы",
      "удалить",
      "чётные",
      "нечётные",
    ],
    icon: "ContentCut",
    groupId: "pdf",
    implemented: true,
    seoTitle: "Разделение PDF онлайн — извлечь страницы из PDF документа",
    seoTitleEn: "Split PDF Online — Extract Specific Pages from Documents",
    seoDescription:
      "Разделение PDF файла онлайн бесплатно: извлеките нужные страницы или разбейте документ на отдельные файлы быстро и конфиденциально.",
    seoDescriptionEn:
      "Split PDF files into individual pages or custom page ranges. Fast client-side document extraction without server uploads.",
  },
  {
    id: "rotate-pdf",
    slug: "rotate-pdf",
    name: "Поворот PDF",
    nameEn: "Rotate PDF",
    description: "Поворачивайте выбранные страницы PDF.",
    descriptionEn: "Rotate selected pages in a PDF.",
    keywords: ["pdf", "поворот", "rotate", "градусы", "ориентация"],
    icon: "RotateRight",
    groupId: "pdf",
    implemented: true,
    seoTitle: "Поворот PDF онлайн — повернуть страницы на 90 и 180 градусов",
    seoTitleEn: "Rotate PDF Pages Online — Turn Pages 90 or 180 Degrees",
    seoDescription:
      "Повернуть страницы PDF онлайн бесплатно: разверните документ на 90, 180 или 270 градусов и сохраните правильную ориентацию страниц.",
    seoDescriptionEn:
      "Rotate individual pages or entire PDF files 90, 180, or 270 degrees permanently. Fix upside-down document scans instantly.",
  },
  {
    id: "remove-pages-pdf",
    slug: "remove-pages-pdf",
    name: "Удалить страницы PDF",
    nameEn: "Remove PDF Pages",
    description: "Удаление выбранных страниц из PDF-документа",
    descriptionEn: "Remove selected pages from a PDF document",
    keywords: ["pdf", "удалить", "страницы", "remove", "delete"],
    icon: "DeleteSweep",
    groupId: "pdf",
    implemented: false,
    hidden: true,
    seoTitle: "Удалить страницы из PDF онлайн — убрать лишние листы",
    seoTitleEn: "Remove Pages from PDF — Delete Unwanted Pages Online",
    seoDescription:
      "Удаление страниц из PDF онлайн бесплатно: выберите ненужные или пустые листы и скачайте очищенный PDF-документ без загрузки на сервер.",
    seoDescriptionEn:
      "Delete unwanted or blank pages from any PDF file quickly. Select individual thumbnails and download the updated document.",
  },
  {
    id: "watermark-pdf",
    slug: "watermark-pdf",
    name: "Водяной знак PDF",
    nameEn: "Watermark PDF",
    description: "Добавляйте текстовый водяной знак на страницы PDF.",
    descriptionEn: "Add a text watermark to PDF pages.",
    keywords: [
      "pdf",
      "водяной знак",
      "watermark",
      "защита",
      "текст",
      "предпросмотр",
    ],
    icon: "BrandingWatermark",
    groupId: "pdf",
    implemented: true,
    seoTitle: "Водяной знак на PDF онлайн — добавить текст на страницы",
    seoTitleEn: "Add Watermark to PDF — Stamp Custom Text on Pages",
    seoDescription:
      "Добавить водяной знак на PDF онлайн бесплатно: наложите штамп «Копия» или текст на все страницы документа с настройкой прозрачности.",
    seoDescriptionEn:
      "Apply custom text watermarks to all PDF pages with adjustable opacity, angle rotation, font sizes, and positioning options.",
  },
  {
    id: "esign-pdf",
    slug: "esign-pdf",
    name: "Подпись PDF",
    nameEn: "eSign PDF",
    description: "Электронная подпись PDF-документов",
    descriptionEn: "Electronically sign PDF documents",
    keywords: ["pdf", "подпись", "esign", "электронная", "sign"],
    icon: "Draw",
    groupId: "pdf",
    implemented: false,
    hidden: true,
    seoTitle: "Подпись PDF онлайн — поставить электронную подпись на PDF",
    seoTitleEn: "Sign PDF Online — Draw & Place Electronic Signatures",
    seoDescription:
      "Подписать PDF документ онлайн бесплатно: нарисуйте свою подпись мышкой или на тачскрине и вставьте её на нужную страницу договора.",
    seoDescriptionEn:
      "Sign contracts and documents electronically. Draw your signature, upload a signature image, or type initials directly onto PDF pages.",
  },
  {
    id: "pdf-metadata",
    slug: "pdf-metadata",
    name: "Метаданные PDF",
    nameEn: "PDF Metadata",
    description: "Просматривайте и изменяйте метаданные PDF.",
    descriptionEn: "View and update PDF metadata.",
    keywords: ["pdf", "метаданные", "metadata", "автор", "title"],
    icon: "Description",
    groupId: "pdf",
    implemented: true,
    seoTitle: "Метаданные PDF онлайн — просмотр и редактирование свойств",
    seoTitleEn: "PDF Metadata Editor — View and Edit Document Properties",
    seoDescription:
      "Просмотр и редактирование метаданных PDF онлайн: изменение автора, названия, темы, ключевых слов документа или полная очистка свойств.",
    seoDescriptionEn:
      "Inspect and edit PDF document properties: author, title, creation date, keywords, and producer metadata directly in browser.",
  },
  {
    id: "protect-pdf",
    slug: "protect-pdf",
    name: "Проверка SHA-256 PDF",
    nameEn: "PDF SHA-256 Verifier",
    description: "Сверяйте SHA-256 PDF с ожидаемой контрольной суммой.",
    descriptionEn: "Compare a PDF SHA-256 hash with an expected checksum.",
    keywords: ["pdf", "водяной знак", "watermark", "sha-256", "целостность"],
    icon: "Verified",
    groupId: "pdf",
    implemented: true,
    seoTitle: "Защита PDF паролем онлайн — шифрование документа AES",
    seoTitleEn: "Protect PDF with Password — Encrypt Document Online",
    seoDescription:
      "Защитить PDF паролем онлайн бесплатно: установите пароль на открытие файла для конфиденциальных договоров прямо в браузере.",
    seoDescriptionEn:
      "Encrypt sensitive PDF documents with secure password protection using robust AES encryption to prevent unauthorized access.",
  },
  {
    id: "jpg-to-pdf",
    slug: "jpg-to-pdf",
    name: "JPG в PDF",
    nameEn: "JPG to PDF",
    description: "Собирайте изображения в один PDF-файл.",
    descriptionEn: "Combine images into one PDF file.",
    keywords: [
      "jpg",
      "png",
      "pdf",
      "конвертация",
      "изображение",
      "отступы",
      "качество",
    ],
    icon: "InsertDriveFile",
    groupId: "pdf",
    implemented: true,
    seoTitle: "JPG в PDF конвертер онлайн — объединить фото в документ",
    seoTitleEn: "JPG to PDF Converter — Combine Images into Single PDF",
    seoDescription:
      "Конвертер картинок JPG в PDF онлайн бесплатно: объединяйте фотографии, сканы и изображения в один аккуратный PDF-документ в браузере.",
    seoDescriptionEn:
      "Convert multiple JPG and JPEG pictures into a clean multi-page PDF document with adjustable page margins and orientations.",
  },
  {
    id: "word-to-pdf",
    slug: "word-to-pdf",
    name: "Word в PDF",
    nameEn: "Word to PDF",
    description: "Переносите текст из DOCX в новый PDF.",
    descriptionEn: "Move text from DOCX into a new PDF.",
    keywords: ["word", "docx", "pdf", "конвертация", "документ", "unicode"],
    icon: "InsertDriveFile",
    groupId: "pdf",
    implemented: true,
    seoTitle: "Word в PDF конвертер онлайн — перевод документов DOCX в PDF",
    seoTitleEn: "Word to PDF Converter — Convert DOCX Documents to PDF",
    seoDescription:
      "Конвертируйте документы Word (DOCX) в формат PDF онлайн бесплатно с сохранением форматирования, таблиц, шрифтов и структуры текста.",
    seoDescriptionEn:
      "Convert Word DOCX documents into standard PDF format with preserved formatting, embedded tables, and document layout fidelity.",
  },
  {
    id: "pdf-to-jpg",
    slug: "pdf-to-jpg",
    name: "PDF в JPG",
    nameEn: "PDF to JPG",
    description: "Конвертация страниц PDF в изображения формата JPG",
    descriptionEn: "Convert PDF pages to JPG images",
    keywords: ["pdf", "jpg", "jpeg", "конвертация", "изображение"],
    icon: "ImageSearch",
    groupId: "pdf",
    implemented: false,
    hidden: true,
    seoTitle: "PDF в JPG конвертер онлайн — сохранить страницы как картинки",
    seoTitleEn: "PDF to JPG Converter — Convert PDF Pages to Clean JPEG",
    seoDescription:
      "Конвертер PDF в JPG онлайн бесплатно: преобразуйте страницы PDF-документа в качественные изображения JPEG без водяных знаков.",
    seoDescriptionEn:
      "Convert PDF pages to optimized JPEG images quickly. Extract photos and document pages in crisp resolution without watermarks.",
  },
  {
    id: "pdf-to-word",
    slug: "pdf-to-word",
    name: "PDF в Word",
    nameEn: "PDF to Word",
    description: "Переносите текст из PDF в документ DOCX.",
    descriptionEn: "Move text from a PDF into a DOCX document.",
    keywords: ["pdf", "word", "docx", "конвертация", "текст", "извлечение"],
    icon: "Description",
    groupId: "pdf",
    implemented: true,
    seoTitle: "PDF в Word конвертер онлайн — перевод PDF в редактируемый DOCX",
    seoTitleEn: "PDF to Word Converter — Convert PDF to Editable DOCX",
    seoDescription:
      "Конвертируйте файлы PDF в редактируемые документы Microsoft Word (DOCX) онлайн бесплатно с сохранением абзацев и форматирования.",
    seoDescriptionEn:
      "Convert PDF documents into fully editable Microsoft Word DOCX files while preserving text structure, headings, and formatting.",
  },
  {
    id: "pdf-to-text",
    slug: "pdf-to-text",
    name: "PDF в текст",
    nameEn: "PDF to Text",
    description: "Извлекайте текст из текстового PDF.",
    descriptionEn: "Extract text from a text-based PDF.",
    keywords: ["pdf", "текст", "извлечение", "text", "extract"],
    icon: "TextFields",
    groupId: "pdf",
    implemented: true,
    seoTitle: "PDF в текст онлайн — извлечь текст из PDF документа",
    seoTitleEn: "PDF to Text Converter — Extract Plain Text from PDF Online",
    seoDescription:
      "Извлечение текста из PDF файлов онлайн бесплатно: скопируйте весь текст документа в формате TXT без таблиц и сложной разметки.",
    seoDescriptionEn:
      "Extract clean plain text from PDF documents. Copy or export extracted textual content into TXT files instantly on device.",
  },
  {
    id: "pdf-to-image",
    slug: "pdf-to-image",
    name: "PDF в изображение",
    nameEn: "PDF to Image",
    description: "Преобразуйте страницы PDF в изображения.",
    descriptionEn: "Convert PDF pages into images.",
    keywords: [
      "pdf",
      "image",
      "конвертация",
      "jpeg",
      "png",
      "webp",
      "dpi",
      "качество",
    ],
    icon: "ImageSearch",
    groupId: "pdf",
    implemented: true,
    seoTitle: "PDF в изображение онлайн — страницы PDF в PNG и JPG",
    seoTitleEn: "PDF to Image Converter — Convert PDF Pages to JPG & PNG",
    seoDescription:
      "Конвертация PDF в картинки онлайн бесплатно: сохраните страницы документа как отдельные файлы PNG или JPG в высоком разрешении.",
    seoDescriptionEn:
      "Convert PDF pages into high-resolution PNG or JPEG images. Batch export document pages directly to zip archives locally.",
  },
  {
    id: "pdf-to-png",
    slug: "pdf-to-png",
    name: "PDF в PNG",
    nameEn: "PDF to Transparent PNG",
    description: "Конвертация страниц PDF в прозрачные PNG-изображения",
    descriptionEn: "Convert PDF pages to transparent PNG images",
    keywords: ["pdf", "png", "прозрачный", "transparent", "конвертация"],
    icon: "ImageSearch",
    groupId: "pdf",
    implemented: false,
    hidden: true,
    seoTitle: "PDF в PNG конвертер онлайн — высокое качество с прозрачностью",
    seoTitleEn: "PDF to PNG Converter — Lossless PNG Images from PDF",
    seoDescription:
      "Конвертер PDF в PNG онлайн бесплатно: высокое качество растрирования страниц без артефактов сжатия для вставки в презентации.",
    seoDescriptionEn:
      "Convert PDF documents to lossless PNG image files. Preserves ultra-sharp text lines, diagrams, and vector fidelity.",
  },

  // === НОВЫЕ ИНСТРУМЕНТЫ ИЗОБРАЖЕНИЙ ===
  {
    id: "blur-image",
    slug: "blur-image",
    name: "Размытие изображения",
    nameEn: "Blur Image",
    description: "Размытие изображения с настраиваемым радиусом",
    descriptionEn: "Blur an image with adjustable radius",
    keywords: ["размытие", "blur", "изображение", "фильтр", "gaussian"],
    icon: "BlurOn",
    groupId: "images",
    implemented: false,
    hidden: true,
    seoTitle: "Размытие изображения онлайн — скрыть лица и текст на фото",
    seoTitleEn: "Blur Image Online — Obscure Faces & Sensitive Info",
    seoDescription:
      "Размытие фото онлайн бесплатно: замажьте конфиденциальную информацию, лица людей, номера авто или документы на изображении прямо в браузере.",
    seoDescriptionEn:
      "Blur sensitive information, personal details, faces, and credentials on images using adjustable brush and rectangular blur tools.",
  },
  {
    id: "watermark-image",
    slug: "watermark-image",
    name: "Водяной знак на фото",
    nameEn: "Watermark Image",
    description: "Добавление текстового водяного знака на изображение",
    descriptionEn: "Add text watermark to an image",
    keywords: ["водяной знак", "watermark", "фото", "защита", "текст"],
    icon: "BrandingWatermark",
    groupId: "images",
    implemented: true,
    seoTitle: "Водяной знак на фото онлайн — добавить логотип или надпись",
    seoTitleEn: "Watermark Photo Online — Stamp Logo & Text on Pictures",
    seoDescription:
      "Добавьте водяной знак на фотографии онлайн бесплатно: защита авторских прав с помощью текстовой надписи или полупрозрачного логотипа.",
    seoDescriptionEn:
      "Add custom copyright watermarks and branded logos to your images. Control opacity, placement coordinates, and font sizes.",
  },
  {
    id: "html-to-image",
    slug: "html-to-image",
    name: "HTML в изображение",
    nameEn: "HTML to Image",
    description: "Конвертация HTML/CSS кода в изображение PNG или JPEG",
    descriptionEn: "Convert HTML/CSS code to PNG or JPEG image",
    keywords: ["html", "css", "изображение", "скриншот", "конвертация"],
    icon: "Html",
    groupId: "images",
    implemented: true,
    seoTitle: "HTML в изображение онлайн — рендер HTML и CSS в картинку",
    seoTitleEn: "HTML to Image Converter — Render HTML/CSS to PNG & JPG",
    seoDescription:
      "Рендер HTML в картинку онлайн бесплатно: преобразуйте верстку HTML и CSS в качественное растровое изображение PNG или JPEG в браузере.",
    seoDescriptionEn:
      "Render custom HTML markup and CSS styling directly into downloadable PNG or JPEG images. Ideal for social cards and mockups.",
  },
  {
    id: "youtube-thumbnail",
    slug: "youtube-thumbnail",
    name: "YouTube превью",
    nameEn: "YouTube Thumbnail Downloader",
    description:
      "Извлечение и скачивание превью YouTube видео по ссылке во всех разрешениях",
    descriptionEn:
      "Extract and download YouTube video thumbnails by URL in all resolutions",
    keywords: [
      "youtube",
      "превью",
      "thumbnail",
      "обложка",
      "скачать",
      "download",
      "извлечь",
    ],
    icon: "SmartDisplay",
    groupId: "images",
    implemented: true,
    seoTitle: "Скачать обложку YouTube онлайн — превью видео в качестве HD",
    seoTitleEn: "YouTube Thumbnail Downloader — Grab HD Video Covers",
    seoDescription:
      "Скачать превью видео YouTube онлайн бесплатно: получите обложку ролика в максимальном разрешении Maxres HD по ссылке на видео.",
    seoDescriptionEn:
      "Download high-resolution YouTube video thumbnail covers in HD 1080p, HQ, and standard sizes by pasting any YouTube link or ID.",
  },

  // === ОБЪЕДИНЁННЫЕ ИНСТРУМЕНТЫ ===
  {
    id: "text-analyzer",
    slug: "text-analyzer",
    name: "Анализатор текста",
    nameEn: "Text Analyzer",
    description:
      "Счётчик слов, символов, предложений, время чтения и токены AI — всё в одном",
    descriptionEn:
      "Word count, characters, sentences, reading time and AI tokens — all in one",
    keywords: [
      "слова",
      "символы",
      "подсчёт",
      "текст",
      "токены",
      "время чтения",
      "анализ",
      "счётчик",
    ],
    icon: "Analytics",
    groupId: "text",
    featured: true,
    implemented: true,
    seoTitle: "Анализатор текста онлайн — подробная статистика и семантика",
    seoTitleEn: "Text Analyzer Online — Semantic Stats, Words & Readability",
    seoDescription:
      "Комплексный анализ текста онлайн бесплатно: статистика слов, символов, уникальности лексики, удобочитаемости и семантического ядра.",
    seoDescriptionEn:
      "Perform in-depth textual analysis: calculate lexical diversity, word counts, sentence lengths, and Flesch readability scores.",
  },
  {
    id: "symbol-catalog",
    slug: "symbol-catalog",
    name: "Каталог символов",
    nameEn: "Symbol Catalog",
    description:
      "Краткий каталог полезных стрелок, математических знаков, валют и фигур",
    descriptionEn:
      "A curated catalog of useful arrows, math signs, currencies, and shapes",
    keywords: [
      "символы",
      "эмодзи",
      "стрелки",
      "звёзды",
      "спецсимволы",
      "копировать",
      "unicode",
    ],
    icon: "EmojiSymbols",
    groupId: "symbols",
    featured: true,
    implemented: true,
    seoTitle: "Каталог символов онлайн — символы Unicode для копирования",
    seoTitleEn: "Symbol Catalog Online — Browse & Copy Unicode Characters",
    seoDescription:
      "Каталог спецсимволов Unicode онлайн бесплатно: стрелки, знаки валют, математические операторы, звёзды и эмотиконы с быстрым копированием.",
    seoDescriptionEn:
      "Explore a curated catalog of Unicode symbols, arrows, currency signs, and typography glyphs with instant one-click copying.",
  },
];

const toolBySlugMap = new Map<string, Tool>();
for (const tool of tools) {
  toolBySlugMap.set(tool.slug, tool);
}

const groupBySlugMap = new Map<string, ToolGroup>();
const groupByIdMap = new Map<string, ToolGroup>();
for (const group of toolGroups) {
  groupBySlugMap.set(group.slug, group);
  groupByIdMap.set(group.id, group);
}

const toolsByGroupMap = new Map<string, Tool[]>();
for (const group of toolGroups) {
  toolsByGroupMap.set(
    group.id,
    tools.filter((t) => t.groupId === group.id && !t.hidden),
  );
}

const featuredToolsList = tools.filter((t) => t.featured && !t.hidden);
const implementedToolsList = tools.filter((t) => t.implemented && !t.hidden);

// Получение группы по slug
export function getGroupBySlug(slug: string): ToolGroup | undefined {
  return groupBySlugMap.get(slug);
}

export function getGroupById(id: string): ToolGroup | undefined {
  return groupByIdMap.get(id);
}

// Получение инструментов группы
export function getToolsByGroup(groupId: string): Tool[] {
  return toolsByGroupMap.get(groupId) || [];
}

// Получение инструмента по slug
export function getToolBySlug(slug: string): Tool | undefined {
  const canonicalSlug = canonicalizeToolSlug(slug);
  return toolBySlugMap.get(canonicalSlug);
}

// Получение featured инструментов
export function getFeaturedTools(): Tool[] {
  return featuredToolsList;
}

// Получение реализованных инструментов
export function getImplementedTools(): Tool[] {
  return implementedToolsList;
}

// Статистика
export function getStats() {
  const publicImplementedTools = tools.filter(
    (t) => t.implemented && !t.hidden,
  );
  const implementedTools = tools.filter((t) => t.implemented);
  const hiddenTools = tools.filter((t) => t.hidden);
  const unimplementedTools = tools.filter((t) => t.implemented === false);

  return {
    totalTools: publicImplementedTools.length,
    allTools: tools.length,
    totalGroups: toolGroups.length,
    implementedTools: implementedTools.length,
    publicImplementedTools: publicImplementedTools.length,
    hiddenTools: hiddenTools.length,
    unimplementedTools: unimplementedTools.length,
    featuredTools: tools.filter((t) => t.featured).length,
  };
}
