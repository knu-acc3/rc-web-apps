/* Variant page texts for the barcode generator and check-digit calculator. */

import type { Locale } from "@/i18n/config";
import type { Block, VariantDef } from "@/registry/types";
import { gs1Check, isbn10Check, upcEToA } from "../lib/checkdigits";
import { variant } from "./texts";

const GS1_PREFIXES = {
  ru: {
    title: "Префиксы GS1 некоторых стран",
    head: ["Префикс", "Организация GS1"],
    rows: [
      ["460–469", "Россия (ГС1 РУС)"],
      ["481", "Беларусь"],
      ["487", "Казахстан"],
      ["470", "Кыргызстан"],
      ["478", "Узбекистан"],
      ["482", "Украина"],
      ["400–440", "Германия"],
      ["690–699", "Китай"],
      ["000–139", "США и Канада (UPC)"],
    ],
  },
  en: {
    title: "GS1 prefixes of some countries",
    head: ["Prefix", "GS1 member organisation"],
    rows: [
      ["000–139", "USA and Canada (UPC)"],
      ["300–379", "France"],
      ["400–440", "Germany"],
      ["460–469", "Russia"],
      ["487", "Kazakhstan"],
      ["500–509", "United Kingdom"],
      ["690–699", "China"],
      ["880", "South Korea"],
      ["978–979", "Books (ISBN)"],
    ],
  },
};

export const BARCODE_VARIANTS: VariantDef[] = [
  variant(
    "ean-13",
    { symbology: "ean13" },
    {
      name: "EAN-13",
      title: "Генератор штрихкода EAN-13 с контрольной цифрой",
      h1: "Штрихкод EAN-13",
      description: "Штрихкод EAN-13 для товаров: введите 12 цифр — контрольная добавится автоматически, или все 13 для проверки. Скачайте PNG или векторный SVG для этикетки и упаковки.",
      lead: "EAN-13 — стандартный штрихкод розничных товаров: 12 цифр и контрольная цифра.",
      keywords: ["штрихкод ean-13", "генератор ean 13", "создать штрихкод товара"],
      about: {
        title: "Из чего состоит EAN-13",
        paragraphs: [
          "Первые 2–3 цифры — префикс национальной организации GS1 (не страна производства!), затем номер компании и номер товара, последняя цифра — контрольная. Её считает алгоритм GS1 mod 10: цифры умножаются попеременно на 1 и 3, контрольная дополняет сумму до кратного 10.",
          "Номер нельзя придумать для продажи в магазинах: его выдаёт GS1 — в России ГС1 РУС, в Казахстане GS1 Kazakhstan. Для внутреннего учёта используют префиксы 200–299: они не пересекаются с чужими товарами.",
        ],
      },
      table: GS1_PREFIXES.ru,
      faq: [
        { q: "Можно ли сделать штрихкод для маркетплейса?", a: "Wildberries, Ozon и другие площадки могут сами выдать внутренний штрихкод. Если нужен свой EAN-13 — получите номер в GS1, а здесь сгенерируйте изображение для печати." },
        { q: "Какого размера печатать?", a: "Номинал — около 37×26 мм (масштаб 100%); допускается от 80% до 200%. Не обрезайте штрихкод по высоте и оставляйте светлые поля слева и справа." },
      ],
    },
    {
      name: "EAN-13",
      title: "EAN-13 Barcode Generator with Check Digit",
      h1: "EAN-13 barcode generator",
      description: "Make an EAN-13 product barcode: enter 12 digits and the check digit is added, or all 13 to verify it. Download a PNG or a scalable SVG for labels and packaging.",
      lead: "EAN-13 is the standard retail barcode: 12 digits plus a check digit.",
      keywords: ["ean-13 barcode generator", "ean13 barcode", "product barcode generator"],
      about: {
        title: "What's inside an EAN-13",
        paragraphs: [
          "The first 2–3 digits are the prefix of the issuing GS1 organisation (not the country of origin!), then a company number and item number; the last digit is the check digit. It's computed with GS1 mod 10: digits are weighted 1 and 3 alternately and the check digit rounds the sum up to a multiple of 10.",
          "You can't invent a number for retail: GS1 issues them. For internal use, prefixes 200–299 are reserved and never clash with other companies' products.",
        ],
      },
      table: GS1_PREFIXES.en,
      faq: [
        { q: "Can I make a barcode for Amazon or a marketplace?", a: "Marketplaces require GS1-issued numbers or their own internal codes. Get your number from GS1, then generate the print image here." },
        { q: "What size should I print?", a: "Nominal size is about 37×26 mm (100%); 80% to 200% is allowed. Don't truncate the height and keep light margins on both sides." },
      ],
    },
  ),
  variant(
    "ean-8",
    { symbology: "ean8" },
    {
      name: "EAN-8",
      title: "Генератор штрихкода EAN-8 онлайн",
      h1: "Штрихкод EAN-8",
      description: "Штрихкод EAN-8 для маленьких упаковок, где не помещается EAN-13: введите 7 цифр — контрольная цифра добавится сама. Готовый штрихкод в PNG и SVG.",
      lead: "EAN-8 — короткий 8-значный штрихкод для товаров, на которых мало места.",
      keywords: ["штрихкод ean-8", "генератор ean 8"],
      about: {
        title: "Когда нужен EAN-8",
        paragraphs: [
          "EAN-8 выдают для совсем маленьких товаров — жевательной резинки, косметики, карандашей, — когда EAN-13 не помещается на упаковке. Номера EAN-8 в дефиците, поэтому GS1 выдаёт их только по обоснованию. Коды EAN-8, начинающиеся с 0 или 2, зарезервированы для внутреннего использования в магазинах.",
        ],
      },
      faq: [
        { q: "Как считается контрольная цифра?", a: "Так же, как у EAN-13: веса 3 и 1 чередуются справа налево, контрольная цифра дополняет сумму до кратного 10." },
        { q: "Можно ли превратить EAN-13 в EAN-8?", a: "Нет, это разные номера. EAN-8 выдаётся отдельно." },
      ],
    },
    {
      name: "EAN-8",
      title: "EAN-8 Barcode Generator Online",
      h1: "EAN-8 barcode generator",
      description: "EAN-8 barcodes for small packages where an EAN-13 doesn't fit: enter 7 digits and the check digit is added automatically. Download the barcode as PNG or SVG.",
      lead: "EAN-8 is the short 8-digit barcode for products with very little space.",
      keywords: ["ean-8 barcode generator", "ean8 barcode"],
      about: {
        title: "When to use EAN-8",
        paragraphs: [
          "EAN-8 is issued for tiny products — chewing gum, cosmetics, pencils — where an EAN-13 won't fit on the pack. EAN-8 numbers are scarce, so GS1 only issues them with justification. EAN-8 codes starting with 0 or 2 are reserved for in-store use.",
        ],
      },
      faq: [
        { q: "How is the check digit computed?", a: "Same as EAN-13: weights 3 and 1 alternate from the right and the check digit rounds the sum up to a multiple of 10." },
        { q: "Can an EAN-13 be shortened to EAN-8?", a: "No, they're different numbers; an EAN-8 is issued separately." },
      ],
    },
  ),
  variant(
    "upc-a",
    { symbology: "upca" },
    {
      name: "UPC-A",
      title: "Генератор штрихкода UPC-A для США и Канады",
      h1: "Штрихкод UPC-A",
      description: "Штрихкод UPC-A — 12 цифр, стандарт розничной торговли США и Канады. Введите 11 цифр — контрольная цифра добавится автоматически; PNG и SVG для печати.",
      lead: "UPC-A — 12-значный штрихкод товаров для Северной Америки.",
      keywords: ["штрихкод upc-a", "генератор upc"],
      about: {
        title: "UPC-A и EAN-13",
        paragraphs: [
          "UPC-A — это EAN-13 с ведущим нулём: код 036000291452 соответствует EAN-13 0036000291452. Поэтому современные кассы по всему миру читают оба формата. Первая цифра UPC-A — системная: 0, 1, 6–9 для обычных товаров, 2 — весовые, 3 — лекарства, 5 — купоны.",
        ],
      },
      faq: [
        { q: "Нужен ли UPC для продажи в США?", a: "Американские ритейлеры принимают и EAN-13, но многие площадки и магазины исторически просят UPC — номер выдаёт GS1 US." },
        { q: "Как считается контрольная цифра?", a: "Цифры на нечётных позициях умножаются на 3, на чётных — на 1; контрольная дополняет сумму до кратного 10." },
      ],
    },
    {
      name: "UPC-A",
      title: "UPC-A Barcode Generator — 12-Digit UPC Code",
      h1: "UPC-A barcode generator",
      description: "UPC-A is the 12-digit retail barcode of the USA and Canada. Enter 11 digits and the check digit is added automatically; download a PNG or SVG ready for print.",
      lead: "UPC-A is North America's 12-digit product barcode.",
      keywords: ["upc barcode generator", "upc-a barcode", "upc code generator"],
      about: {
        title: "UPC-A and EAN-13",
        paragraphs: [
          "A UPC-A is an EAN-13 with a leading zero: 036000291452 equals EAN-13 0036000291452, so checkouts worldwide read both. The first UPC-A digit is the number system: 0, 1, 6–9 for regular items, 2 for random-weight items, 3 for drugs, 5 for coupons.",
        ],
      },
      faq: [
        { q: "Do I need a UPC to sell in the US?", a: "US retailers accept EAN-13 too, but many stores and marketplaces traditionally ask for a UPC, issued by GS1 US." },
        { q: "How is the check digit computed?", a: "Digits in odd positions are multiplied by 3, even positions by 1; the check digit rounds the sum up to a multiple of 10." },
      ],
    },
  ),
  variant(
    "upc-e",
    { symbology: "upce" },
    {
      name: "UPC-E",
      title: "Генератор штрихкода UPC-E (сжатый UPC)",
      h1: "Штрихкод UPC-E",
      description: "UPC-E — сжатая 8-значная версия UPC-A для маленьких упаковок: нули из середины номера убираются. Введите 6 цифр — системная и контрольная цифры добавятся сами.",
      lead: "UPC-E сжимает 12-значный UPC-A до 8 цифр за счёт повторяющихся нулей.",
      keywords: ["штрихкод upc-e", "upc-e генератор"],
      about: {
        title: "Как UPC-E разворачивается в UPC-A",
        paragraphs: [
          "Последняя из шести цифр подсказывает, куда вернуть нули: 0–2 — после второй цифры, 3 — после третьей, 4 — после четвёртой, 5–9 — перед последней. Например, UPC-E 0 425261 4 — это UPC-A 042100005264. Контрольная цифра считается по развёрнутому UPC-A.",
        ],
      },
      faq: [
        { q: "Любой ли UPC-A можно сжать?", a: "Нет, только номера с нужным расположением нулей. Сначала проверьте, что ваш UPC-A подходит, — или используйте полный UPC-A." },
        { q: "Какая системная цифра?", a: "0 или 1. Если введены 6 цифр, генератор подставит 0." },
      ],
    },
    {
      name: "UPC-E",
      title: "UPC-E Barcode Generator — Zero-Suppressed UPC",
      h1: "UPC-E barcode generator",
      description: "UPC-E is the 8-digit zero-suppressed form of UPC-A for small packages. Enter 6 digits and the number system and check digits are added automatically.",
      lead: "UPC-E squeezes a 12-digit UPC-A into 8 digits by dropping runs of zeros.",
      keywords: ["upc-e barcode generator", "upce barcode"],
      about: {
        title: "How UPC-E expands to UPC-A",
        paragraphs: [
          "The last of the six digits tells where the zeros go: 0–2 after the second digit, 3 after the third, 4 after the fourth, 5–9 before the last. For example, UPC-E 0 425261 4 is UPC-A 042100005264. The check digit is computed on the expanded UPC-A.",
        ],
      },
      faq: [
        { q: "Can every UPC-A be compressed?", a: "No, only numbers with zeros in the right places. Check yours fits — or use the full UPC-A." },
        { q: "Which number system digit?", a: "0 or 1. With 6 digits entered, the generator uses 0." },
      ],
    },
  ),
  variant(
    "code-128",
    { symbology: "code128" },
    {
      name: "Code 128",
      title: "Генератор штрихкода Code 128 онлайн",
      h1: "Штрихкод Code 128",
      description: "Штрихкод Code 128 для складов, логистики и внутреннего учёта: латиница, цифры и знаки ASCII в компактной записи. Скачайте PNG для печати на этикетках или SVG.",
      lead: "Code 128 кодирует любые символы ASCII и получается компактнее Code 39.",
      keywords: ["штрихкод code 128", "генератор code128"],
      about: {
        title: "Где используют Code 128",
        paragraphs: [
          "Code 128 — самый распространённый буквенно-цифровой штрихкод: складские ячейки, накладные, артикулы, серийные номера. Длинные последовательности цифр он пакует парами (набор C), поэтому число из 12 цифр занимает меньше места, чем в Code 39. Контрольный символ mod 103 добавляется автоматически и в подписи не отображается.",
          "Кириллицу Code 128 не кодирует. Если нужны русские буквы, используйте QR-код.",
        ],
      },
      faq: [
        { q: "Какая максимальная длина?", a: "Стандарт не ограничивает длину, но сканеры надёжно читают штрихкоды до 20–30 символов. Генератор принимает до 80." },
        { q: "Это то же, что GS1-128?", a: "GS1-128 — это Code 128 со специальным символом FNC1 и идентификаторами применения. Для логистических этикеток GS1 используйте специализированные программы." },
      ],
    },
    {
      name: "Code 128",
      title: "Code 128 Barcode Generator Online",
      h1: "Code 128 barcode generator",
      description: "Code 128 barcodes for warehouses, shipping and internal tracking: Latin letters, digits and ASCII symbols in a compact form. Download a PNG for labels or an SVG.",
      lead: "Code 128 encodes any ASCII character and is more compact than Code 39.",
      keywords: ["code 128 barcode generator", "code128 barcode"],
      about: {
        title: "Where Code 128 is used",
        paragraphs: [
          "Code 128 is the most common alphanumeric barcode: bin locations, waybills, SKUs, serial numbers. It packs runs of digits in pairs (code set C), so a 12-digit number takes less space than in Code 39. The mod 103 check character is added automatically and isn't shown in the text.",
        ],
      },
      faq: [
        { q: "What's the maximum length?", a: "The standard has no limit, but scanners read 20–30 characters reliably. The generator accepts up to 80." },
        { q: "Is this GS1-128?", a: "GS1-128 is Code 128 with an FNC1 character and application identifiers. Use dedicated software for GS1 logistics labels." },
      ],
    },
  ),
  variant(
    "code-39",
    { symbology: "code39" },
    {
      name: "Code 39",
      title: "Генератор штрихкода Code 39 онлайн",
      h1: "Штрихкод Code 39",
      description: "Штрихкод Code 39: заглавные латинские буквы, цифры и символы - . $ / + % пробел. Используется в промышленности, на бейджах и в инвентаризации. PNG и SVG.",
      lead: "Code 39 — простой буквенно-цифровой штрихкод, который читает любой сканер.",
      keywords: ["штрихкод code 39", "генератор code39"],
      about: {
        title: "Особенности Code 39",
        paragraphs: [
          "Каждый символ Code 39 кодируется отдельно, а начало и конец отмечаются звёздочкой, поэтому штрихкод легко печатать даже шрифтом. Цена простоты — длина: при том же содержимом Code 39 заметно шире Code 128. Строчные буквы генератор переводит в заглавные.",
        ],
      },
      faq: [
        { q: "Нужна ли контрольная цифра?", a: "В Code 39 она необязательна (mod 43). Большинство систем обходится без неё." },
        { q: "Почему нельзя строчные буквы?", a: "Базовый Code 39 содержит только 43 символа. Расширенный режим Full ASCII кодирует строчные парами символов, но его понимают не все сканеры." },
      ],
    },
    {
      name: "Code 39",
      title: "Code 39 Barcode Generator Online",
      h1: "Code 39 barcode generator",
      description: "Code 39 barcodes: upper-case Latin letters, digits and - . $ / + % space. Used in manufacturing, ID badges and inventory. Download the barcode as PNG or SVG.",
      lead: "Code 39 is a simple alphanumeric barcode that every scanner reads.",
      keywords: ["code 39 barcode generator", "code39 barcode"],
      about: {
        title: "Code 39 in brief",
        paragraphs: [
          "Each Code 39 character is encoded separately and asterisks mark the start and end, so it can even be printed with a font. The price is length: for the same data Code 39 is much wider than Code 128. Lower-case letters are converted to upper case.",
        ],
      },
      faq: [
        { q: "Is a check digit required?", a: "It's optional in Code 39 (mod 43); most systems don't use it." },
        { q: "Why no lower-case letters?", a: "Standard Code 39 has 43 characters. Full ASCII mode encodes lower case with character pairs, but not all scanners support it." },
      ],
    },
  ),
  variant(
    "itf-14",
    { symbology: "itf14" },
    {
      name: "ITF-14",
      title: "Генератор штрихкода ITF-14 для транспортной упаковки",
      h1: "Штрихкод ITF-14",
      description: "Штрихкод ITF-14 (GTIN-14) для коробов и транспортной упаковки: 13 цифр — контрольная цифра добавится сама. Печатается даже на гофрокартоне. PNG и SVG.",
      lead: "ITF-14 маркирует коробки и паллеты с товаром: 14 цифр кода GTIN.",
      keywords: ["штрихкод itf-14", "gtin-14 штрихкод", "штрихкод на короб"],
      about: {
        title: "GTIN-14 на коробе",
        paragraphs: [
          "Первая цифра GTIN-14 — индикатор упаковки (1–8), затем 12 цифр кода товара из EAN-13 без его контрольной цифры и новая контрольная цифра. Так короб из 12 бутылок получает свой номер, связанный с номером бутылки.",
          "ITF — чередующийся код 2 из 5: широкие штрихи и рамка-носитель по краям делают его устойчивым к печати на гофрокартоне.",
        ],
      },
      faq: [
        { q: "Как получить GTIN-14 из EAN-13?", a: "Допишите слева индикатор упаковки, уберите старую контрольную цифру и пересчитайте её для 13 цифр — это делает калькулятор контрольной цифры." },
        { q: "Нужна ли рамка вокруг штрихкода?", a: "Стандарт GS1 рекомендует рамку-носитель при печати на гофрокартоне. Её можно добавить в макете упаковки." },
      ],
    },
    {
      name: "ITF-14",
      title: "ITF-14 Barcode Generator for Shipping Cartons",
      h1: "ITF-14 barcode generator",
      description: "ITF-14 (GTIN-14) barcodes for cases and shipping cartons: enter 13 digits and the check digit is added. Prints reliably even on corrugated board. PNG and SVG.",
      lead: "ITF-14 marks cases and pallets of goods with a 14-digit GTIN.",
      keywords: ["itf-14 barcode generator", "gtin-14 barcode", "case barcode"],
      about: {
        title: "GTIN-14 on a carton",
        paragraphs: [
          "The first GTIN-14 digit is the packaging indicator (1–8), followed by the 12 digits of the item's EAN-13 without its check digit, then a new check digit. A case of 12 bottles gets its own number linked to the bottle's.",
          "ITF is Interleaved 2 of 5: wide bars and a bearer bar around it make it robust when printed on corrugated board.",
        ],
      },
      faq: [
        { q: "How do I derive a GTIN-14 from an EAN-13?", a: "Add the packaging indicator on the left, drop the old check digit and recompute it for 13 digits — the check digit calculator does this." },
        { q: "Do I need the bearer bar?", a: "GS1 recommends a bearer bar when printing on corrugated board; add it in your packaging artwork." },
      ],
    },
  ),
  variant(
    "codabar",
    { symbology: "codabar" },
    {
      name: "Codabar",
      title: "Генератор штрихкода Codabar онлайн",
      h1: "Штрихкод Codabar",
      description: "Штрихкод Codabar: цифры и символы - $ : / . + со старт-стоп символами A–D. Применяется в библиотеках, банках крови и в авиа-накладных. PNG и SVG.",
      lead: "Codabar — старый, но живой штрихкод для цифровых номеров в библиотеках и медицине.",
      keywords: ["штрихкод codabar", "генератор codabar"],
      about: {
        title: "Где встречается Codabar",
        paragraphs: [
          "Codabar появился в 1970-х и до сих пор используется для библиотечных билетов и книг, маркировки донорской крови и накладных. Старт и стоп обозначаются буквами A, B, C или D; если вы их не укажете, генератор добавит A с обеих сторон.",
        ],
      },
      faq: [
        { q: "Можно ли кодировать буквы?", a: "Нет, кроме старт-стоп символов A–D. Для текста используйте Code 128." },
        { q: "Какой старт-стоп выбрать?", a: "Тот, что требует ваша система: библиотечные программы часто ждут конкретную пару, например A…B." },
      ],
    },
    {
      name: "Codabar",
      title: "Codabar Barcode Generator Online",
      h1: "Codabar barcode generator",
      description: "Codabar barcodes: digits and - $ : / . + with A–D start and stop characters. Traditionally used in libraries, blood banks and air waybills. Download PNG or SVG.",
      lead: "Codabar is an old but living barcode for numeric IDs in libraries and healthcare.",
      keywords: ["codabar barcode generator", "codabar"],
      about: {
        title: "Where Codabar is used",
        paragraphs: [
          "Codabar dates from the 1970s and is still used on library cards and books, blood bags and air waybills. Start and stop are the letters A, B, C or D; if you leave them out, the generator adds A on both ends.",
        ],
      },
      faq: [
        { q: "Can it encode letters?", a: "No, except the A–D start/stop characters. Use Code 128 for text." },
        { q: "Which start/stop pair?", a: "Whatever your system expects: library software often needs a specific pair such as A…B." },
      ],
    },
  ),
  variant(
    "msi",
    { symbology: "msi" },
    {
      name: "MSI",
      title: "Генератор штрихкода MSI Plessey онлайн",
      h1: "Штрихкод MSI (Modified Plessey)",
      description: "Штрихкод MSI (Modified Plessey) для маркировки полок и складских ячеек: только цифры, контрольная цифра mod 10 добавляется автоматически. PNG и SVG.",
      lead: "MSI — цифровой штрихкод для ценников на полках и складских мест.",
      keywords: ["штрихкод msi", "msi plessey"],
      about: {
        title: "Контрольная цифра MSI",
        paragraphs: [
          "MSI использует алгоритм Луна: цифры справа налево через одну удваиваются, из двузначных вычитается 9, контрольная цифра дополняет сумму до кратного 10. Это тот же алгоритм, что у номеров банковских карт.",
        ],
      },
      faq: [
        { q: "Бывают ли две контрольные цифры?", a: "Да, есть варианты mod 10/10 и mod 11/10. Генератор использует самый распространённый — одну цифру mod 10." },
        { q: "Где сейчас используют MSI?", a: "В основном в складских и полочных метках старых систем учёта; для новых проектов лучше Code 128." },
      ],
    },
    {
      name: "MSI",
      title: "MSI Plessey Barcode Generator Online",
      h1: "MSI (Modified Plessey) barcode generator",
      description: "MSI (Modified Plessey) barcodes for shelf labels and warehouse bins: digits only, with the mod 10 check digit added automatically. Download as PNG or SVG.",
      lead: "MSI is a numeric barcode for shelf tags and warehouse locations.",
      keywords: ["msi barcode generator", "msi plessey"],
      about: {
        title: "MSI check digit",
        paragraphs: [
          "MSI uses the Luhn algorithm: every other digit from the right is doubled, 9 is subtracted from two-digit results, and the check digit rounds the sum up to a multiple of 10 — the same algorithm as bank card numbers.",
        ],
      },
      faq: [
        { q: "Are there two check digits?", a: "Variants mod 10/10 and mod 11/10 exist. The generator uses the most common single mod 10 digit." },
        { q: "Where is MSI still used?", a: "Mostly on shelf and bin labels of older inventory systems; prefer Code 128 for new projects." },
      ],
    },
  ),
];

const CHECK_VARIANTS_BASE: VariantDef[] = [
  variant(
    "ean-13",
    { kind: "ean13" },
    {
      name: "EAN-13",
      title: "Контрольная цифра EAN-13 — калькулятор и проверка",
      h1: "Контрольная цифра EAN-13",
      description: "Рассчитайте контрольную цифру EAN-13 по первым 12 цифрам или проверьте готовый 13-значный код. Пошаговый расчёт: веса 1 и 3, сумма и дополнение до кратного 10.",
      lead: "Введите 12 цифр — калькулятор допишет тринадцатую и покажет, как она получилась.",
      keywords: ["контрольная цифра ean 13", "проверить штрихкод ean-13", "расчет контрольной цифры штрихкода"],
      about: {
        title: "Алгоритм",
        paragraphs: [
          "Цифры на нечётных позициях (1, 3, 5…) умножаются на 1, на чётных — на 3. Произведения складываются, контрольная цифра — сколько не хватает сумме до ближайшего кратного 10. Пример: для 400638133393 сумма 89, до 90 не хватает 1 — код 4006381333931.",
          "Та же контрольная цифра у ISBN-13: книжный номер 978… — это EAN-13.",
        ],
      },
      faq: [
        { q: "Что значит неверная контрольная цифра?", a: "В номере опечатка: переставлены соседние цифры или одна ошибочна. Касса такой штрихкод не примет." },
        { q: "Проверяет ли калькулятор, что товар существует?", a: "Нет — только математическую правильность номера. Кому принадлежит номер, можно узнать в сервисах GS1." },
      ],
    },
    {
      name: "EAN-13",
      title: "EAN-13 Check Digit Calculator and Validator",
      h1: "EAN-13 check digit calculator",
      description: "Calculate the EAN-13 check digit from the first 12 digits or verify a full 13-digit code. Step-by-step: weights 1 and 3, the sum and rounding up to a multiple of 10.",
      lead: "Enter 12 digits — the calculator adds the 13th and shows how it was derived.",
      keywords: ["ean-13 check digit", "ean 13 check digit calculator", "validate ean-13"],
      about: {
        title: "The algorithm",
        paragraphs: [
          "Digits in odd positions (1, 3, 5…) are multiplied by 1, even positions by 3. The products are summed and the check digit is what's missing to reach the next multiple of 10. Example: for 400638133393 the sum is 89, 1 short of 90 — so the code is 4006381333931.",
          "ISBN-13 uses the same check digit: a 978… book number is an EAN-13.",
        ],
      },
      faq: [
        { q: "What does a wrong check digit mean?", a: "There's a typo: two adjacent digits swapped or one digit wrong. A checkout won't accept such a barcode." },
        { q: "Does it check that the product exists?", a: "No — only that the number is mathematically valid. GS1 services show who owns a number." },
      ],
    },
  ),
  variant(
    "ean-8",
    { kind: "ean8" },
    {
      name: "EAN-8",
      title: "Контрольная цифра EAN-8 — расчёт онлайн",
      h1: "Контрольная цифра EAN-8",
      description: "Посчитайте контрольную цифру EAN-8 по 7 цифрам или проверьте 8-значный код. Алгоритм GS1 mod 10 с весами 3 и 1 и подробной таблицей расчёта по шагам.",
      lead: "Введите 7 цифр EAN-8 — получите восьмую, контрольную.",
      keywords: ["контрольная цифра ean 8", "проверка ean-8"],
      faq: [
        { q: "Отличается ли алгоритм от EAN-13?", a: "Нет, это тот же GS1 mod 10: веса 3 и 1 чередуются начиная с последней цифры перед контрольной." },
        { q: "Пример?", a: "Для 9638507 контрольная цифра 4: код 96385074." },
      ],
    },
    {
      name: "EAN-8",
      title: "EAN-8 Check Digit Calculator Online",
      h1: "EAN-8 check digit calculator",
      description: "Compute the EAN-8 check digit from 7 digits or verify an 8-digit code. GS1 mod 10 algorithm with weights 3 and 1, plus a step-by-step calculation table.",
      lead: "Enter the 7 EAN-8 digits — get the 8th, the check digit.",
      keywords: ["ean-8 check digit", "ean8 check digit calculator"],
      faq: [
        { q: "Is it different from EAN-13?", a: "No, it's the same GS1 mod 10: weights 3 and 1 alternate starting from the digit next to the check digit." },
        { q: "Example?", a: "For 9638507 the check digit is 4: 96385074." },
      ],
    },
  ),
  variant(
    "upc-a",
    { kind: "upca" },
    {
      name: "UPC-A",
      title: "Контрольная цифра UPC-A — калькулятор",
      h1: "Контрольная цифра UPC-A",
      description: "Рассчитайте контрольную цифру UPC-A по 11 цифрам или проверьте 12-значный код UPC. Нечётные позиции умножаются на 3, чётные — на 1; расчёт показан пошагово.",
      lead: "Введите 11 цифр UPC-A — калькулятор допишет двенадцатую.",
      keywords: ["контрольная цифра upc", "проверка upc-a"],
      faq: [
        { q: "Пример расчёта?", a: "036000291452: сумма цифр на нечётных позициях (0+6+0+2+1+5) × 3 = 42, на чётных 3+0+0+9+4 = 16, всего 58 — до 60 не хватает 2." },
        { q: "UPC-A и EAN-13 дают одинаковую цифру?", a: "Да: UPC-A с ведущим нулём — это EAN-13, и контрольная цифра у них одна." },
      ],
    },
    {
      name: "UPC-A",
      title: "UPC Check Digit Calculator (UPC-A)",
      h1: "UPC-A check digit calculator",
      description: "Calculate the UPC-A check digit from 11 digits or verify a 12-digit UPC. Odd positions are multiplied by 3 and even positions by 1; every step is shown.",
      lead: "Enter the 11 UPC-A digits — the calculator adds the 12th.",
      keywords: ["upc check digit calculator", "upc-a check digit"],
      faq: [
        { q: "Worked example?", a: "036000291452: odd-position digits (0+6+0+2+1+5) × 3 = 42, even positions 3+0+0+9+4 = 16, total 58 — 2 short of 60." },
        { q: "Do UPC-A and EAN-13 give the same digit?", a: "Yes: a UPC-A with a leading zero is an EAN-13 and shares the check digit." },
      ],
    },
  ),
  variant(
    "upc-e",
    { kind: "upce" },
    {
      name: "UPC-E",
      title: "Контрольная цифра UPC-E — расчёт с разворотом в UPC-A",
      h1: "Контрольная цифра UPC-E",
      description: "Контрольная цифра UPC-E: калькулятор разворачивает сжатый код в UPC-A по правилам нулей и считает цифру по GS1 mod 10. Введите системную цифру и 6 цифр кода.",
      lead: "Введите 7 цифр (системная 0/1 и шесть цифр) — получите восьмую и развёрнутый UPC-A.",
      keywords: ["контрольная цифра upc-e", "upc-e в upc-a"],
      faq: [
        { q: "Почему нельзя считать по самим 7 цифрам?", a: "Контрольная цифра UPC-E — это контрольная цифра соответствующего UPC-A, поэтому код сначала разворачивается." },
        { q: "Пример?", a: "0 425261 → UPC-A 04210000526, контрольная цифра 4: UPC-E 04252614." },
      ],
    },
    {
      name: "UPC-E",
      title: "UPC-E Check Digit Calculator with UPC-A Expansion",
      h1: "UPC-E check digit calculator",
      description: "The UPC-E check digit: the calculator expands the compressed code to UPC-A by the zero rules and computes GS1 mod 10. Enter the number system and the 6 code digits.",
      lead: "Enter 7 digits (number system 0/1 plus six digits) — get the 8th and the expanded UPC-A.",
      keywords: ["upc-e check digit", "upc-e to upc-a"],
      faq: [
        { q: "Why not compute it on the 7 digits directly?", a: "The UPC-E check digit is the check digit of the matching UPC-A, so the code is expanded first." },
        { q: "Example?", a: "0 425261 → UPC-A 04210000526, check digit 4: UPC-E 04252614." },
      ],
    },
  ),
  variant(
    "gtin-14",
    { kind: "gtin14" },
    {
      name: "GTIN-14",
      title: "Контрольная цифра GTIN-14 (ITF-14) — калькулятор",
      h1: "Контрольная цифра GTIN-14",
      description: "Рассчитайте контрольную цифру GTIN-14 для транспортной упаковки: индикатор упаковки и 12 цифр товара. Проверка готовых 14-значных кодов ITF-14 и расчёт по шагам.",
      lead: "Введите 13 цифр GTIN-14 — калькулятор добавит контрольную.",
      keywords: ["контрольная цифра gtin-14", "gtin 14 расчет", "itf-14 контрольная цифра"],
      faq: [
        { q: "Как сделать GTIN-14 из EAN-13?", a: "Возьмите первые 12 цифр EAN-13, допишите слева индикатор упаковки (1–8) и посчитайте здесь новую контрольную цифру." },
        { q: "Что такое индикатор 0?", a: "GTIN-14 с нулём впереди — это просто EAN-13, дополненный до 14 цифр; контрольная цифра не меняется." },
      ],
    },
    {
      name: "GTIN-14",
      title: "GTIN-14 Check Digit Calculator (ITF-14)",
      h1: "GTIN-14 check digit calculator",
      description: "Calculate the GTIN-14 check digit for cases and cartons: packaging indicator plus the 12 item digits. Verify 14-digit ITF-14 codes with a step-by-step calculation.",
      lead: "Enter the 13 GTIN-14 digits — the calculator adds the check digit.",
      keywords: ["gtin-14 check digit", "gtin check digit calculator", "itf-14 check digit"],
      faq: [
        { q: "How do I make a GTIN-14 from an EAN-13?", a: "Take the first 12 EAN-13 digits, prepend a packaging indicator (1–8) and compute the new check digit here." },
        { q: "What does indicator 0 mean?", a: "A GTIN-14 starting with 0 is just the EAN-13 padded to 14 digits; the check digit stays the same." },
      ],
    },
  ),
  variant(
    "sscc",
    { kind: "sscc" },
    {
      name: "SSCC",
      title: "Контрольная цифра SSCC — калькулятор для паллет",
      h1: "Контрольная цифра SSCC",
      description: "Рассчитайте контрольную цифру SSCC — 18-значного серийного кода транспортной единицы (паллеты, короба) по GS1: расширение, префикс компании, серийный номер.",
      lead: "Введите 17 цифр SSCC — получите восемнадцатую, контрольную.",
      keywords: ["контрольная цифра sscc", "sscc расчет", "sscc код паллеты"],
      about: {
        title: "Из чего состоит SSCC",
        paragraphs: [
          "Первая цифра — расширение (0–9, выбирает компания), затем префикс компании GS1 и серийный номер, которые вместе дают 16 цифр, и контрольная цифра по тому же алгоритму GS1 mod 10. На этикетке SSCC печатается в штрихкоде GS1-128 с идентификатором применения (00).",
        ],
      },
      faq: [
        { q: "Можно ли повторять SSCC?", a: "Нет: номер уникален для каждой отправленной единицы и не должен повторяться минимум год." },
        { q: "Алгоритм отличается от EAN?", a: "Нет, это тот же GS1 mod 10, просто для 17 цифр." },
      ],
    },
    {
      name: "SSCC",
      title: "SSCC Check Digit Calculator for Pallets",
      h1: "SSCC check digit calculator",
      description: "Calculate the check digit of an SSCC — the 18-digit GS1 Serial Shipping Container Code for pallets and cases: extension digit, company prefix and serial reference.",
      lead: "Enter the 17 SSCC digits — get the 18th, the check digit.",
      keywords: ["sscc check digit", "sscc check digit calculator"],
      about: {
        title: "What's inside an SSCC",
        paragraphs: [
          "The first digit is the extension (0–9, chosen by the company), then the GS1 company prefix and a serial reference totalling 16 digits, and the check digit by the same GS1 mod 10. On labels the SSCC is printed in a GS1-128 barcode with application identifier (00).",
        ],
      },
      faq: [
        { q: "Can an SSCC be reused?", a: "No: it's unique to each shipped unit and must not be reused for at least a year." },
        { q: "Is the algorithm different from EAN?", a: "No, it's the same GS1 mod 10, applied to 17 digits." },
      ],
    },
  ),
  variant(
    "isbn-10",
    { kind: "isbn10" },
    {
      name: "ISBN-10",
      title: "Контрольная цифра ISBN-10 — расчёт и символ X",
      h1: "Контрольная цифра ISBN-10",
      description: "Рассчитайте контрольную цифру ISBN-10 по 9 цифрам: веса от 10 до 2, сумма по модулю 11, значение 10 записывается как X. Проверка готовых 10-значных номеров.",
      lead: "Введите 9 цифр ISBN-10 — калькулятор найдёт десятую (или X).",
      keywords: ["контрольная цифра isbn", "isbn-10 x", "расчет isbn"],
      faq: [
        { q: "Почему в ISBN бывает X?", a: "Контрольная цифра считается по модулю 11 и может быть равна 10 — её записывают римской X. Пример: 080442957X." },
        { q: "А ISBN-13?", a: "ISBN-13 — это EAN-13 с префиксом 978 или 979, контрольная цифра считается по алгоритму EAN-13." },
      ],
    },
    {
      name: "ISBN-10",
      title: "ISBN-10 Check Digit Calculator (Including X)",
      h1: "ISBN-10 check digit calculator",
      description: "Calculate the ISBN-10 check digit from 9 digits: weights 10 down to 2, sum modulo 11, and a value of 10 written as X. Verify complete 10-digit ISBNs too.",
      lead: "Enter the 9 ISBN-10 digits — the calculator finds the 10th (or X).",
      keywords: ["isbn-10 check digit", "isbn check digit calculator", "isbn x"],
      faq: [
        { q: "Why does an ISBN end in X?", a: "The check digit is modulo 11 and can equal 10, written as the Roman X. Example: 080442957X." },
        { q: "What about ISBN-13?", a: "ISBN-13 is an EAN-13 with the 978 or 979 prefix; its check digit follows the EAN-13 algorithm." },
      ],
    },
  ),
];

/** Worked examples for every check-digit page, computed with the calculator's own functions. */
const CHECK_EXAMPLES: Record<string, { bodies: string[]; check: (body: string) => string }> = {
  "ean-13": { bodies: ["400638133393", "460123456789", "978030640615", "590123412345"], check: (b) => String(gs1Check(b)) },
  "ean-8": { bodies: ["9638507", "4007630", "5512345", "2012345"], check: (b) => String(gs1Check(b)) },
  "upc-a": { bodies: ["03600029145", "01234567890", "04210000526", "07203660010"], check: (b) => String(gs1Check(b)) },
  "upc-e": { bodies: ["0123456", "0654321", "1123453", "0425261"], check: (b) => String(gs1Check(upcEToA(b[0], b.slice(1)) ?? "")) },
  "gtin-14": { bodies: ["1400638133393", "0001234560001", "5012345678900", "1061414100001"], check: (b) => String(gs1Check(b)) },
  "isbn-10": { bodies: ["030640615", "080442957", "059035342", "019853453"], check: isbn10Check },
};

function examplesBlock(slug: string, l: Locale): Block | null {
  const ex = CHECK_EXAMPLES[slug];
  if (!ex) return null;
  const ru = l === "ru";
  return {
    type: "table",
    title: ru ? "Примеры расчёта" : "Worked examples",
    head: ru ? ["Цифры без контрольной", "Контрольная цифра", "Полный код"] : ["Digits without check", "Check digit", "Full code"],
    rows: ex.bodies.map((b) => {
      const c = ex.check(b);
      return [b, c, b + c];
    }),
    mono: true,
  };
}

export const CHECK_VARIANTS: VariantDef[] = CHECK_VARIANTS_BASE.map((v) => ({
  ...v,
  blocks: (l: Locale) => {
    const own = v.blocks?.(l) ?? [];
    const ex = examplesBlock(v.slug, l);
    return ex ? [...own, ex] : own;
  },
}));
