export const TOOL_UX_PATTERNS = [
  "transform",
  "generator",
  "calculator",
  "file",
  "timer",
  "canvas",
  "reference",
] as const;

export type ToolUxPattern = (typeof TOOL_UX_PATTERNS)[number];
export type ToolUxMigrationStatus = "legacy" | "focused";

export interface ToolUxCatalogEntry {
  slug: string;
  pattern: ToolUxPattern;
  primaryVerb: { ru: string; en: string };
  migrationStatus: ToolUxMigrationStatus;
}

export interface ToolUxCatalogCategory {
  categoryId: string;
  tools: readonly ToolUxCatalogEntry[];
}

/**
 * UX migration ledger in the exact public site order from src/data/tools.ts.
 *
 * `focused` is deliberately conservative: it means the current implementation
 * already has a restrained primary flow, a dominant action, and disclosed
 * advanced controls. It is not a claim that every secondary detail is verified.
 * PDF entries are focused only when the current source exposes one dominant
 * action, discloses secondary controls, avoids locale-specific examples, and
 * compiles in the isolated focused-tool check.
 */
export const toolUxCatalog = [
  {
    categoryId: "pdf",
    tools: [
      {
        slug: "pdf-studio",
        pattern: "file",
        primaryVerb: { ru: "Добавить аннотации", en: "Annotate PDF" },
        migrationStatus: "focused",
      },
      {
        slug: "compress-pdf",
        pattern: "file",
        primaryVerb: { ru: "Сжать PDF", en: "Compress PDF" },
        migrationStatus: "focused",
      },
      {
        slug: "merge-pdf",
        pattern: "file",
        primaryVerb: { ru: "Объединить PDF", en: "Merge PDFs" },
        migrationStatus: "focused",
      },
      {
        slug: "split-pdf",
        pattern: "file",
        primaryVerb: { ru: "Разделить PDF", en: "Split PDF" },
        migrationStatus: "focused",
      },
      {
        slug: "rotate-pdf",
        pattern: "file",
        primaryVerb: { ru: "Повернуть PDF", en: "Rotate PDF" },
        migrationStatus: "focused",
      },
      {
        slug: "watermark-pdf",
        pattern: "file",
        primaryVerb: { ru: "Добавить водяной знак", en: "Add watermark" },
        migrationStatus: "focused",
      },
      {
        slug: "pdf-metadata",
        pattern: "file",
        primaryVerb: { ru: "Сохранить метаданные", en: "Save metadata" },
        migrationStatus: "focused",
      },
      {
        slug: "protect-pdf",
        pattern: "file",
        primaryVerb: { ru: "Проверить SHA-256", en: "Verify SHA-256" },
        migrationStatus: "focused",
      },
      {
        slug: "jpg-to-pdf",
        pattern: "file",
        primaryVerb: { ru: "Создать PDF", en: "Create PDF" },
        migrationStatus: "focused",
      },
      {
        slug: "word-to-pdf",
        pattern: "file",
        primaryVerb: { ru: "Перенести текст", en: "Convert text" },
        migrationStatus: "focused",
      },
      {
        slug: "pdf-to-word",
        pattern: "file",
        primaryVerb: { ru: "Извлечь в DOCX", en: "Extract to DOCX" },
        migrationStatus: "focused",
      },
      {
        slug: "pdf-to-text",
        pattern: "file",
        primaryVerb: { ru: "Извлечь текст", en: "Extract text" },
        migrationStatus: "focused",
      },
      {
        slug: "pdf-to-image",
        pattern: "file",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "images",
    tools: [
      {
        slug: "image-compressor",
        pattern: "file",
        primaryVerb: { ru: "Сжать", en: "Compress" },
        migrationStatus: "focused",
      },
      {
        slug: "image-converter",
        pattern: "file",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "image-resizer",
        pattern: "file",
        primaryVerb: { ru: "Изменить размер", en: "Resize" },
        migrationStatus: "focused",
      },
      {
        slug: "image-crop",
        pattern: "canvas",
        primaryVerb: { ru: "Обрезать", en: "Crop" },
        migrationStatus: "focused",
      },
      {
        slug: "image-rotate",
        pattern: "canvas",
        primaryVerb: { ru: "Повернуть", en: "Rotate" },
        migrationStatus: "focused",
      },
      {
        slug: "image-filters",
        pattern: "canvas",
        primaryVerb: { ru: "Применить фильтр", en: "Apply filter" },
        migrationStatus: "focused",
      },
      {
        slug: "favicon-generator",
        pattern: "generator",
        primaryVerb: { ru: "Создать favicon", en: "Generate favicon" },
        migrationStatus: "focused",
      },
      {
        slug: "meme-generator",
        pattern: "canvas",
        primaryVerb: { ru: "Скачать мем", en: "Download meme" },
        migrationStatus: "focused",
      },
      {
        slug: "image-to-base64",
        pattern: "transform",
        primaryVerb: { ru: "Преобразовать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "pixel-art",
        pattern: "canvas",
        primaryVerb: { ru: "Скачать PNG", en: "Download PNG" },
        migrationStatus: "focused",
      },
      {
        slug: "svg-editor",
        pattern: "canvas",
        primaryVerb: { ru: "Скачать SVG", en: "Download SVG" },
        migrationStatus: "focused",
      },
      {
        slug: "watermark-image",
        pattern: "canvas",
        primaryVerb: { ru: "Добавить водяной знак", en: "Add watermark" },
        migrationStatus: "focused",
      },
      {
        slug: "html-to-image",
        pattern: "canvas",
        primaryVerb: { ru: "Создать изображение", en: "Create image" },
        migrationStatus: "focused",
      },
      {
        slug: "youtube-thumbnail",
        pattern: "reference",
        primaryVerb: { ru: "Получить превью", en: "Get thumbnail" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "text",
    tools: [
      {
        slug: "case-converter",
        pattern: "transform",
        primaryVerb: { ru: "Преобразовать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "lorem-ipsum",
        pattern: "generator",
        primaryVerb: { ru: "Сгенерировать", en: "Generate" },
        migrationStatus: "focused",
      },
      {
        slug: "text-reverse",
        pattern: "transform",
        primaryVerb: { ru: "Развернуть текст", en: "Reverse text" },
        migrationStatus: "focused",
      },
      {
        slug: "remove-duplicates",
        pattern: "transform",
        primaryVerb: { ru: "Удалить дубликаты", en: "Remove duplicates" },
        migrationStatus: "focused",
      },
      {
        slug: "text-sort",
        pattern: "transform",
        primaryVerb: { ru: "Сортировать", en: "Sort" },
        migrationStatus: "focused",
      },
      {
        slug: "markdown-preview",
        pattern: "transform",
        primaryVerb: { ru: "Показать превью", en: "Show preview" },
        migrationStatus: "focused",
      },
      {
        slug: "text-replace",
        pattern: "transform",
        primaryVerb: { ru: "Заменить всё", en: "Replace all" },
        migrationStatus: "focused",
      },
      {
        slug: "transliteration",
        pattern: "transform",
        primaryVerb: { ru: "Транслитерировать", en: "Transliterate" },
        migrationStatus: "focused",
      },
      {
        slug: "text-to-speech",
        pattern: "transform",
        primaryVerb: { ru: "Озвучить", en: "Play speech" },
        migrationStatus: "focused",
      },
      {
        slug: "string-extractor",
        pattern: "transform",
        primaryVerb: { ru: "Извлечь данные", en: "Extract data" },
        migrationStatus: "focused",
      },
      {
        slug: "text-cleaner",
        pattern: "transform",
        primaryVerb: { ru: "Очистить текст", en: "Clean text" },
        migrationStatus: "focused",
      },
      {
        slug: "text-formatter",
        pattern: "transform",
        primaryVerb: { ru: "Форматировать", en: "Format" },
        migrationStatus: "focused",
      },
      {
        slug: "text-analyzer",
        pattern: "calculator",
        primaryVerb: { ru: "Анализировать", en: "Analyze" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "developers",
    tools: [
      {
        slug: "json-formatter",
        pattern: "transform",
        primaryVerb: { ru: "Форматировать", en: "Format" },
        migrationStatus: "focused",
      },
      {
        slug: "regex-tester",
        pattern: "reference",
        primaryVerb: { ru: "Проверить", en: "Test" },
        migrationStatus: "focused",
      },
      {
        slug: "css-minifier",
        pattern: "transform",
        primaryVerb: { ru: "Минифицировать", en: "Minify" },
        migrationStatus: "focused",
      },
      {
        slug: "js-beautifier",
        pattern: "transform",
        primaryVerb: { ru: "Форматировать", en: "Beautify" },
        migrationStatus: "focused",
      },
      {
        slug: "html-formatter",
        pattern: "transform",
        primaryVerb: { ru: "Форматировать", en: "Format HTML" },
        migrationStatus: "focused",
      },
      {
        slug: "sql-formatter",
        pattern: "transform",
        primaryVerb: { ru: "Форматировать", en: "Format" },
        migrationStatus: "focused",
      },
      {
        slug: "cron-generator",
        pattern: "generator",
        primaryVerb: { ru: "Создать cron", en: "Generate cron" },
        migrationStatus: "focused",
      },
      {
        slug: "http-status",
        pattern: "reference",
        primaryVerb: { ru: "Найти код", en: "Find status" },
        migrationStatus: "focused",
      },
      {
        slug: "mime-types",
        pattern: "reference",
        primaryVerb: { ru: "Найти MIME", en: "Find MIME" },
        migrationStatus: "focused",
      },
      {
        slug: "flexbox-playground",
        pattern: "canvas",
        primaryVerb: { ru: "Скопировать CSS", en: "Copy CSS" },
        migrationStatus: "focused",
      },
      {
        slug: "grid-playground",
        pattern: "canvas",
        primaryVerb: { ru: "Скопировать CSS", en: "Copy CSS" },
        migrationStatus: "focused",
      },
      {
        slug: "diff-checker",
        pattern: "transform",
        primaryVerb: { ru: "Сравнить", en: "Compare" },
        migrationStatus: "focused",
      },
      {
        slug: "jwt-decoder",
        pattern: "reference",
        primaryVerb: { ru: "Декодировать", en: "Decode" },
        migrationStatus: "focused",
      },
      {
        slug: "json-csv",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "yaml-json",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "xml-formatter",
        pattern: "transform",
        primaryVerb: { ru: "Форматировать", en: "Format" },
        migrationStatus: "focused",
      },
      {
        slug: "color-picker",
        pattern: "canvas",
        primaryVerb: { ru: "Скопировать цвет", en: "Copy color" },
        migrationStatus: "focused",
      },
      {
        slug: "box-shadow",
        pattern: "canvas",
        primaryVerb: { ru: "Скопировать CSS", en: "Copy CSS" },
        migrationStatus: "focused",
      },
      {
        slug: "chmod-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать", en: "Calculate" },
        migrationStatus: "focused",
      },
      {
        slug: "github-readme",
        pattern: "generator",
        primaryVerb: { ru: "Создать README", en: "Generate README" },
        migrationStatus: "focused",
      },
      {
        slug: "regex-library",
        pattern: "reference",
        primaryVerb: { ru: "Найти выражение", en: "Find pattern" },
        migrationStatus: "focused",
      },
      {
        slug: "css-animation",
        pattern: "canvas",
        primaryVerb: { ru: "Скопировать CSS", en: "Copy CSS" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "seo",
    tools: [
      {
        slug: "seo-meta-tool",
        pattern: "generator",
        primaryVerb: { ru: "Создать мета-теги", en: "Generate meta tags" },
        migrationStatus: "focused",
      },
      {
        slug: "text-extractor",
        pattern: "transform",
        primaryVerb: { ru: "Извлечь текст", en: "Extract text" },
        migrationStatus: "focused",
      },
      {
        slug: "robots-generator",
        pattern: "generator",
        primaryVerb: { ru: "Создать robots.txt", en: "Generate robots.txt" },
        migrationStatus: "focused",
      },
      {
        slug: "sitemap-generator",
        pattern: "generator",
        primaryVerb: { ru: "Создать sitemap", en: "Generate sitemap" },
        migrationStatus: "focused",
      },
      {
        slug: "keyword-density",
        pattern: "calculator",
        primaryVerb: { ru: "Анализировать", en: "Analyze" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "converters",
    tools: [
      {
        slug: "file-converter",
        pattern: "file",
        primaryVerb: { ru: "Конвертировать всё", en: "Convert all" },
        migrationStatus: "focused",
      },
      {
        slug: "color-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "number-system",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "temperature-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "length-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "weight-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "volume-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "speed-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "area-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "energy-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "pressure-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "data-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "angle-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "power-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "fuel-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "coordinate-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "calculators",
    tools: [
      {
        slug: "scientific-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать", en: "Calculate" },
        migrationStatus: "focused",
      },
      {
        slug: "percentage-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать", en: "Calculate" },
        migrationStatus: "focused",
      },
      {
        slug: "mortgage-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать ипотеку", en: "Calculate mortgage" },
        migrationStatus: "focused",
      },
      {
        slug: "loan-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать кредит", en: "Calculate loan" },
        migrationStatus: "focused",
      },
      {
        slug: "tax-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать налог", en: "Calculate tax" },
        migrationStatus: "focused",
      },
      {
        slug: "tip-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать чаевые", en: "Calculate tip" },
        migrationStatus: "focused",
      },
      {
        slug: "discount-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать скидку", en: "Calculate discount" },
        migrationStatus: "focused",
      },
      {
        slug: "compound-interest",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать доход", en: "Calculate growth" },
        migrationStatus: "focused",
      },
      {
        slug: "salary-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать зарплату", en: "Calculate salary" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "color",
    tools: [
      {
        slug: "color-wheel",
        pattern: "canvas",
        primaryVerb: { ru: "Подобрать цвет", en: "Pick color" },
        migrationStatus: "focused",
      },
      {
        slug: "contrast-checker",
        pattern: "calculator",
        primaryVerb: { ru: "Проверить контраст", en: "Check contrast" },
        migrationStatus: "focused",
      },
      {
        slug: "color-blender",
        pattern: "transform",
        primaryVerb: { ru: "Смешать цвета", en: "Blend colors" },
        migrationStatus: "focused",
      },
      {
        slug: "image-colors",
        pattern: "file",
        primaryVerb: { ru: "Извлечь цвета", en: "Extract colors" },
        migrationStatus: "focused",
      },
      {
        slug: "tailwind-colors",
        pattern: "reference",
        primaryVerb: { ru: "Найти цвет", en: "Find color" },
        migrationStatus: "focused",
      },
      {
        slug: "material-colors",
        pattern: "reference",
        primaryVerb: { ru: "Найти цвет", en: "Find color" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "generators",
    tools: [
      {
        slug: "password-generator",
        pattern: "generator",
        primaryVerb: { ru: "Сгенерировать пароль", en: "Generate password" },
        migrationStatus: "focused",
      },
      {
        slug: "uuid-generator",
        pattern: "generator",
        primaryVerb: { ru: "Сгенерировать UUID", en: "Generate UUID" },
        migrationStatus: "focused",
      },
      {
        slug: "hash-generator",
        pattern: "generator",
        primaryVerb: { ru: "Создать хэш", en: "Generate hash" },
        migrationStatus: "focused",
      },
      {
        slug: "avatar-generator",
        pattern: "generator",
        primaryVerb: { ru: "Создать аватар", en: "Generate avatar" },
        migrationStatus: "focused",
      },
      {
        slug: "gradient-generator",
        pattern: "generator",
        primaryVerb: { ru: "Создать градиент", en: "Generate gradient" },
        migrationStatus: "focused",
      },
      {
        slug: "palette-generator",
        pattern: "generator",
        primaryVerb: { ru: "Создать палитру", en: "Generate palette" },
        migrationStatus: "focused",
      },
      {
        slug: "random-name",
        pattern: "generator",
        primaryVerb: { ru: "Сгенерировать имя", en: "Generate name" },
        migrationStatus: "focused",
      },
      {
        slug: "random-number",
        pattern: "generator",
        primaryVerb: { ru: "Сгенерировать число", en: "Generate number" },
        migrationStatus: "focused",
      },
      {
        slug: "mockdata-generator",
        pattern: "generator",
        primaryVerb: { ru: "Сгенерировать данные", en: "Generate data" },
        migrationStatus: "focused",
      },
      {
        slug: "slug-generator",
        pattern: "transform",
        primaryVerb: { ru: "Создать slug", en: "Generate slug" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "datetime",
    tools: [
      {
        slug: "world-clock",
        pattern: "timer",
        primaryVerb: { ru: "Показать время", en: "Show time" },
        migrationStatus: "focused",
      },
      {
        slug: "timezone-converter",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать время", en: "Convert time" },
        migrationStatus: "focused",
      },
      {
        slug: "date-difference",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать разницу", en: "Calculate difference" },
        migrationStatus: "focused",
      },
      {
        slug: "timer",
        pattern: "timer",
        primaryVerb: { ru: "Запустить таймер", en: "Start timer" },
        migrationStatus: "focused",
      },
      {
        slug: "age-calculator",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать возраст", en: "Calculate age" },
        migrationStatus: "focused",
      },
      {
        slug: "unix-timestamp",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "calendar",
        pattern: "reference",
        primaryVerb: { ru: "Открыть дату", en: "Open date" },
        migrationStatus: "focused",
      },
      {
        slug: "week-number",
        pattern: "calculator",
        primaryVerb: { ru: "Определить неделю", en: "Find week" },
        migrationStatus: "focused",
      },
      {
        slug: "kz-holidays",
        pattern: "reference",
        primaryVerb: { ru: "Найти праздник", en: "Find holiday" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "symbols",
    tools: [
      {
        slug: "unicode-lookup",
        pattern: "reference",
        primaryVerb: { ru: "Найти символ", en: "Find symbol" },
        migrationStatus: "focused",
      },
      {
        slug: "symbol-catalog",
        pattern: "reference",
        primaryVerb: { ru: "Найти символ", en: "Find symbol" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "encoding",
    tools: [
      {
        slug: "base64-encoder",
        pattern: "transform",
        primaryVerb: { ru: "Преобразовать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "url-encoder",
        pattern: "transform",
        primaryVerb: { ru: "Преобразовать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "html-encoder",
        pattern: "transform",
        primaryVerb: { ru: "Преобразовать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "morse-code",
        pattern: "transform",
        primaryVerb: { ru: "Преобразовать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "binary-text",
        pattern: "transform",
        primaryVerb: { ru: "Преобразовать", en: "Convert" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "security",
    tools: [
      {
        slug: "password-strength",
        pattern: "calculator",
        primaryVerb: { ru: "Проверить пароль", en: "Check password" },
        migrationStatus: "focused",
      },
      {
        slug: "email-validator",
        pattern: "reference",
        primaryVerb: { ru: "Проверить email", en: "Validate email" },
        migrationStatus: "focused",
      },
      {
        slug: "url-validator",
        pattern: "reference",
        primaryVerb: { ru: "Проверить URL", en: "Validate URL" },
        migrationStatus: "focused",
      },
      {
        slug: "ip-validator",
        pattern: "reference",
        primaryVerb: { ru: "Проверить IP", en: "Validate IP" },
        migrationStatus: "focused",
      },
      {
        slug: "phone-validator",
        pattern: "reference",
        primaryVerb: { ru: "Проверить номер", en: "Validate phone" },
        migrationStatus: "focused",
      },
      {
        slug: "iin-validator",
        pattern: "reference",
        primaryVerb: { ru: "Проверить ИИН", en: "Validate IIN" },
        migrationStatus: "focused",
      },
      {
        slug: "kz-phone-formatter",
        pattern: "transform",
        primaryVerb: { ru: "Форматировать номер", en: "Format phone" },
        migrationStatus: "focused",
      },
      {
        slug: "bin-validator",
        pattern: "reference",
        primaryVerb: { ru: "Проверить БИН", en: "Validate BIN" },
        migrationStatus: "focused",
      },
      {
        slug: "json-data-gen",
        pattern: "generator",
        primaryVerb: { ru: "Сгенерировать JSON", en: "Generate JSON" },
        migrationStatus: "focused",
      },
      {
        slug: "checksum-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать checksum", en: "Calculate checksum" },
        migrationStatus: "focused",
      },
      {
        slug: "iban-validator",
        pattern: "reference",
        primaryVerb: { ru: "Проверить IBAN", en: "Validate IBAN" },
        migrationStatus: "focused",
      },
      {
        slug: "kz-iban-validator",
        pattern: "reference",
        primaryVerb: { ru: "Проверить IBAN", en: "Validate IBAN" },
        migrationStatus: "focused",
      },
      {
        slug: "kz-postal-code",
        pattern: "reference",
        primaryVerb: { ru: "Проверить индекс", en: "Validate postcode" },
        migrationStatus: "focused",
      },
      {
        slug: "kz-address-format",
        pattern: "transform",
        primaryVerb: { ru: "Форматировать адрес", en: "Format address" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "math",
    tools: [
      {
        slug: "equation-solver",
        pattern: "calculator",
        primaryVerb: { ru: "Решить", en: "Solve" },
        migrationStatus: "focused",
      },
      {
        slug: "matrix-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать", en: "Calculate" },
        migrationStatus: "focused",
      },
      {
        slug: "statistics-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать", en: "Calculate" },
        migrationStatus: "focused",
      },
      {
        slug: "factorial-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать", en: "Calculate" },
        migrationStatus: "focused",
      },
      {
        slug: "roman-numerals",
        pattern: "transform",
        primaryVerb: { ru: "Конвертировать", en: "Convert" },
        migrationStatus: "focused",
      },
      {
        slug: "fraction-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать", en: "Calculate" },
        migrationStatus: "focused",
      },
      {
        slug: "graph-plotter",
        pattern: "canvas",
        primaryVerb: { ru: "Построить график", en: "Plot graph" },
        migrationStatus: "focused",
      },
      {
        slug: "gcd-lcm",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать", en: "Calculate" },
        migrationStatus: "focused",
      },
      {
        slug: "prime-checker",
        pattern: "calculator",
        primaryVerb: { ru: "Проверить число", en: "Check number" },
        migrationStatus: "focused",
      },
      {
        slug: "proportion-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать", en: "Calculate" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "finance",
    tools: [
      {
        slug: "budget-planner",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать бюджет", en: "Calculate budget" },
        migrationStatus: "focused",
      },
      {
        slug: "investment-calc",
        pattern: "calculator",
        primaryVerb: {
          ru: "Рассчитать инвестиции",
          en: "Calculate investment",
        },
        migrationStatus: "focused",
      },
      {
        slug: "inflation-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать инфляцию", en: "Calculate inflation" },
        migrationStatus: "focused",
      },
      {
        slug: "retirement-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать пенсию", en: "Calculate retirement" },
        migrationStatus: "focused",
      },
      {
        slug: "deposit-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать депозит", en: "Calculate deposit" },
        migrationStatus: "focused",
      },
      {
        slug: "kz-salary-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать зарплату", en: "Calculate salary" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "health",
    tools: [
      {
        slug: "body-metrics",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать показатели", en: "Calculate metrics" },
        migrationStatus: "focused",
      },
      {
        slug: "water-intake",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать норму", en: "Calculate intake" },
        migrationStatus: "focused",
      },
      {
        slug: "sleep-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать сон", en: "Calculate sleep" },
        migrationStatus: "focused",
      },
      {
        slug: "heart-rate-zone",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать зоны", en: "Calculate zones" },
        migrationStatus: "focused",
      },
      {
        slug: "pregnancy-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать срок", en: "Calculate dates" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "entertainment",
    tools: [
      {
        slug: "random-picker",
        pattern: "generator",
        primaryVerb: { ru: "Выбрать случайно", en: "Pick randomly" },
        migrationStatus: "focused",
      },
      {
        slug: "team-generator",
        pattern: "generator",
        primaryVerb: { ru: "Создать команды", en: "Generate teams" },
        migrationStatus: "focused",
      },
      {
        slug: "countdown",
        pattern: "timer",
        primaryVerb: { ru: "Запустить отсчёт", en: "Start countdown" },
        migrationStatus: "focused",
      },
      {
        slug: "random-color",
        pattern: "generator",
        primaryVerb: { ru: "Сгенерировать цвет", en: "Generate color" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "media",
    tools: [
      {
        slug: "metronome",
        pattern: "timer",
        primaryVerb: { ru: "Запустить метроном", en: "Start metronome" },
        migrationStatus: "focused",
      },
      {
        slug: "speaker-dryer",
        pattern: "timer",
        primaryVerb: { ru: "Запустить тон", en: "Start tone" },
        migrationStatus: "focused",
      },
      {
        slug: "noise-generator",
        pattern: "generator",
        primaryVerb: { ru: "Запустить звук", en: "Start sound" },
        migrationStatus: "focused",
      },
      {
        slug: "video-aspect",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать размер", en: "Calculate size" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "network",
    tools: [
      {
        slug: "ip-calculator",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать сеть", en: "Calculate network" },
        migrationStatus: "focused",
      },
      {
        slug: "subnet-calc",
        pattern: "calculator",
        primaryVerb: { ru: "Рассчитать подсеть", en: "Calculate subnet" },
        migrationStatus: "focused",
      },
      {
        slug: "mac-lookup",
        pattern: "reference",
        primaryVerb: { ru: "Разобрать MAC", en: "Inspect MAC" },
        migrationStatus: "focused",
      },
      {
        slug: "port-list",
        pattern: "reference",
        primaryVerb: { ru: "Найти в справочнике", en: "Search reference" },
        migrationStatus: "focused",
      },
      {
        slug: "user-agent-parser",
        pattern: "reference",
        primaryVerb: { ru: "Разобрать User-Agent", en: "Parse User-Agent" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "qrbarcode",
    tools: [
      {
        slug: "qr-code-gen",
        pattern: "generator",
        primaryVerb: { ru: "Создать QR-код", en: "Generate QR code" },
        migrationStatus: "focused",
      },
      {
        slug: "barcode-gen",
        pattern: "generator",
        primaryVerb: { ru: "Создать штрихкод", en: "Generate barcode" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "units",
    tools: [
      {
        slug: "cooking-converter",
        pattern: "transform",
        primaryVerb: { ru: "Перевести меру", en: "Convert measure" },
        migrationStatus: "focused",
      },
      {
        slug: "shoe-size",
        pattern: "transform",
        primaryVerb: {
          ru: "Подобрать ориентировочный размер",
          en: "Find approximate size",
        },
        migrationStatus: "focused",
      },
      {
        slug: "clothing-size",
        pattern: "transform",
        primaryVerb: {
          ru: "Найти ориентиры по размеру",
          en: "Find size guidance",
        },
        migrationStatus: "focused",
      },
      {
        slug: "screen-resolution",
        pattern: "reference",
        primaryVerb: { ru: "Считать данные экрана", en: "Read display data" },
        migrationStatus: "focused",
      },
      {
        slug: "paper-size",
        pattern: "reference",
        primaryVerb: { ru: "Показать размеры", en: "Show dimensions" },
        migrationStatus: "focused",
      },
    ],
  },
  {
    categoryId: "productivity",
    tools: [
      {
        slug: "pomodoro",
        pattern: "timer",
        primaryVerb: { ru: "Запустить", en: "Start" },
        migrationStatus: "focused",
      },
      {
        slug: "todo-list",
        pattern: "canvas",
        primaryVerb: { ru: "Добавить задачу", en: "Add task" },
        migrationStatus: "focused",
      },
      {
        slug: "notes",
        pattern: "canvas",
        primaryVerb: { ru: "Сохранить заметку", en: "Save note" },
        migrationStatus: "focused",
      },
      {
        slug: "typing-speed",
        pattern: "timer",
        primaryVerb: { ru: "Начать тест", en: "Start test" },
        migrationStatus: "focused",
      },
    ],
  },
] as const satisfies readonly ToolUxCatalogCategory[];

export const flatToolUxCatalog = toolUxCatalog.flatMap((category) =>
  category.tools.map((tool) => ({ ...tool, categoryId: category.categoryId })),
);
