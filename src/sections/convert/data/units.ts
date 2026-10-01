/**
 * Units of measurement. Every unit converts to/from the quantity's base unit.
 *  - linear:     base = value × factor
 *  - affine:     base = value × factor + offset   (temperature)
 *  - reciprocal: base = k / value                  (fuel economy)
 */

export interface RuForms {
  /** 1 километр, 2 километра, 5 километров */
  f: [string, string, string];
  /** genitive singular for fractions (0,5 километра); defaults to f[1] */
  o?: string;
  /** nominative plural: «километры» (used in «километры в мили») */
  pl: string;
  /** prepositional plural: «в километрах» */
  loc: string;
}

export interface UnitDef {
  /** URL slug, English plural: "kilometers" */
  slug: string;
  sym: { ru: string; en: string };
  ru: RuForms;
  /** English [singular, plural] */
  en: [string, string];
  kind?: "linear" | "affine" | "reciprocal";
  factor: number;
  offset?: number;
  /** Extra search keywords */
  kw?: string;
}

export interface QuantityDef {
  id: string;
  name: { ru: string; en: string };
  /** «длины», «of length» — used in "Конвертер длины" */
  gen: { ru: string; en: string };
  icon: string;
  base: string;
  units: UnitDef[];
  /** Curated [from, to] pairs that get their own pages (both directions are listed explicitly). */
  pairs: [string, string][];
  /** Values for the conversion table on pair pages. */
  table?: number[];
  /** Default unit pair on the quantity page. */
  def: [string, string];
  allowNegative?: boolean;
}

const lin = (
  slug: string,
  sym: [string, string],
  ru: RuForms,
  en: [string, string],
  factor: number,
  kw?: string,
): UnitDef => ({ slug, sym: { ru: sym[0], en: sym[1] }, ru, en, factor, kw });

const ru = (one: string, few: string, many: string, pl: string, loc: string, o?: string): RuForms => ({ f: [one, few, many], pl, loc, o });

const T_SMALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 500, 1000];

export const QUANTITIES: QuantityDef[] = [
  {
    id: "length",
    name: { ru: "Длина", en: "Length" },
    gen: { ru: "длины", en: "length" },
    icon: "Ruler",
    base: "meters",
    def: ["kilometers", "miles"],
    units: [
      lin("nanometers", ["нм", "nm"], ru("нанометр", "нанометра", "нанометров", "нанометры", "нанометрах"), ["nanometer", "nanometers"], 1e-9),
      lin("micrometers", ["мкм", "µm"], ru("микрометр", "микрометра", "микрометров", "микрометры", "микрометрах"), ["micrometer", "micrometers"], 1e-6, "микрон micron"),
      lin("millimeters", ["мм", "mm"], ru("миллиметр", "миллиметра", "миллиметров", "миллиметры", "миллиметрах"), ["millimeter", "millimeters"], 0.001),
      lin("centimeters", ["см", "cm"], ru("сантиметр", "сантиметра", "сантиметров", "сантиметры", "сантиметрах"), ["centimeter", "centimeters"], 0.01),
      lin("decimeters", ["дм", "dm"], ru("дециметр", "дециметра", "дециметров", "дециметры", "дециметрах"), ["decimeter", "decimeters"], 0.1),
      lin("meters", ["м", "m"], ru("метр", "метра", "метров", "метры", "метрах"), ["meter", "meters"], 1, "metre"),
      lin("kilometers", ["км", "km"], ru("километр", "километра", "километров", "километры", "километрах"), ["kilometer", "kilometers"], 1000, "kilometre"),
      lin("inches", ["дюйм", "in"], ru("дюйм", "дюйма", "дюймов", "дюймы", "дюймах"), ["inch", "inches"], 0.0254, "\""),
      lin("feet", ["фут", "ft"], ru("фут", "фута", "футов", "футы", "футах"), ["foot", "feet"], 0.3048, "'"),
      lin("yards", ["ярд", "yd"], ru("ярд", "ярда", "ярдов", "ярды", "ярдах"), ["yard", "yards"], 0.9144),
      lin("miles", ["миля", "mi"], ru("миля", "мили", "миль", "мили", "милях"), ["mile", "miles"], 1609.344),
      lin("nautical-miles", ["мор. миля", "nmi"], ru("морская миля", "морские мили", "морских миль", "морские мили", "морских милях", "морской мили"), ["nautical mile", "nautical miles"], 1852),
      lin("mils", ["мил", "mil"], ru("мил", "мила", "милов", "милы", "милах"), ["mil", "mils"], 0.0000254, "thou тысячная дюйма"),
      lin("arshins", ["аршин", "arshin"], ru("аршин", "аршина", "аршинов", "аршины", "аршинах"), ["arshin", "arshins"], 0.7112, "старорусские меры"),
      lin("vershoks", ["вершок", "vershok"], ru("вершок", "вершка", "вершков", "вершки", "вершках"), ["vershok", "vershoks"], 0.04445, "старорусские меры"),
      lin("sazhens", ["сажень", "sazhen"], ru("сажень", "сажени", "саженей", "сажени", "саженях"), ["sazhen", "sazhens"], 2.1336, "старорусские меры"),
      lin("versts", ["верста", "verst"], ru("верста", "версты", "вёрст", "вёрсты", "вёрстах"), ["verst", "versts"], 1066.8, "старорусские меры"),
      lin("astronomical-units", ["а. е.", "au"], ru("астрономическая единица", "астрономические единицы", "астрономических единиц", "астрономические единицы", "астрономических единицах", "астрономической единицы"), ["astronomical unit", "astronomical units"], 149597870700),
      lin("light-years", ["св. год", "ly"], ru("световой год", "световых года", "световых лет", "световые годы", "световых годах", "светового года"), ["light-year", "light-years"], 9460730472580800),
      lin("parsecs", ["пк", "pc"], ru("парсек", "парсека", "парсеков", "парсеки", "парсеках"), ["parsec", "parsecs"], 30856775814913673),
    ],
    pairs: [
      ["kilometers", "miles"], ["miles", "kilometers"], ["meters", "feet"], ["feet", "meters"], ["centimeters", "inches"], ["inches", "centimeters"],
      ["millimeters", "inches"], ["inches", "millimeters"], ["meters", "yards"], ["yards", "meters"], ["feet", "centimeters"], ["centimeters", "feet"],
      ["feet", "inches"], ["inches", "feet"], ["kilometers", "meters"], ["meters", "kilometers"], ["meters", "centimeters"], ["centimeters", "meters"],
      ["millimeters", "centimeters"], ["centimeters", "millimeters"], ["meters", "millimeters"], ["millimeters", "meters"], ["miles", "feet"], ["feet", "miles"],
      ["nautical-miles", "kilometers"], ["kilometers", "nautical-miles"], ["miles", "nautical-miles"], ["yards", "feet"], ["meters", "inches"], ["inches", "meters"],
      ["light-years", "kilometers"], ["astronomical-units", "kilometers"], ["parsecs", "light-years"], ["arshins", "centimeters"], ["vershoks", "centimeters"],
      ["sazhens", "meters"], ["versts", "kilometers"], ["micrometers", "millimeters"], ["nanometers", "micrometers"], ["mils", "millimeters"],
    ],
    table: T_SMALL,
  },
  {
    id: "weight",
    name: { ru: "Масса и вес", en: "Weight and mass" },
    gen: { ru: "веса", en: "weight" },
    icon: "Weight",
    base: "kilograms",
    def: ["kilograms", "pounds"],
    units: [
      lin("micrograms", ["мкг", "µg"], ru("микрограмм", "микрограмма", "микрограммов", "микрограммы", "микрограммах"), ["microgram", "micrograms"], 1e-9),
      lin("milligrams", ["мг", "mg"], ru("миллиграмм", "миллиграмма", "миллиграммов", "миллиграммы", "миллиграммах"), ["milligram", "milligrams"], 1e-6),
      lin("grams", ["г", "g"], ru("грамм", "грамма", "граммов", "граммы", "граммах"), ["gram", "grams"], 0.001),
      lin("kilograms", ["кг", "kg"], ru("килограмм", "килограмма", "килограммов", "килограммы", "килограммах"), ["kilogram", "kilograms"], 1, "кило kilo"),
      lin("centners", ["ц", "q"], ru("центнер", "центнера", "центнеров", "центнеры", "центнерах"), ["centner", "centners"], 100, "quintal"),
      lin("tonnes", ["т", "t"], ru("тонна", "тонны", "тонн", "тонны", "тоннах"), ["tonne", "tonnes"], 1000, "metric ton метрическая тонна"),
      lin("carats", ["кар", "ct"], ru("карат", "карата", "карат", "караты", "каратах"), ["carat", "carats"], 0.0002),
      lin("grains", ["гран", "gr"], ru("гран", "грана", "гранов", "граны", "гранах"), ["grain", "grains"], 0.00006479891),
      lin("ounces", ["унция", "oz"], ru("унция", "унции", "унций", "унции", "унциях"), ["ounce", "ounces"], 0.028349523125),
      lin("troy-ounces", ["тр. унция", "ozt"], ru("тройская унция", "тройские унции", "тройских унций", "тройские унции", "тройских унциях", "тройской унции"), ["troy ounce", "troy ounces"], 0.0311034768, "золото gold"),
      lin("pounds", ["фунт", "lb"], ru("фунт", "фунта", "фунтов", "фунты", "фунтах"), ["pound", "pounds"], 0.45359237, "lbs"),
      lin("stones", ["стоун", "st"], ru("стоун", "стоуна", "стоунов", "стоуны", "стоунах"), ["stone", "stones"], 6.35029318),
      lin("short-tons", ["амер. тонна", "sh tn"], ru("короткая тонна", "короткие тонны", "коротких тонн", "короткие тонны", "коротких тоннах", "короткой тонны"), ["short ton", "short tons"], 907.18474, "US ton американская"),
      lin("long-tons", ["англ. тонна", "LT"], ru("длинная тонна", "длинные тонны", "длинных тонн", "длинные тонны", "длинных тоннах", "длинной тонны"), ["long ton", "long tons"], 1016.0469088, "imperial ton английская"),
      lin("poods", ["пуд", "pood"], ru("пуд", "пуда", "пудов", "пуды", "пудах"), ["pood", "poods"], 16.380496, "старорусские меры"),
    ],
    pairs: [
      ["kilograms", "pounds"], ["pounds", "kilograms"], ["grams", "ounces"], ["ounces", "grams"], ["kilograms", "grams"], ["grams", "kilograms"],
      ["stones", "kilograms"], ["kilograms", "stones"], ["pounds", "grams"], ["grams", "pounds"], ["ounces", "pounds"], ["pounds", "ounces"],
      ["tonnes", "kilograms"], ["kilograms", "tonnes"], ["milligrams", "grams"], ["grams", "milligrams"], ["micrograms", "milligrams"], ["milligrams", "micrograms"],
      ["carats", "grams"], ["grams", "carats"], ["troy-ounces", "grams"], ["grams", "troy-ounces"], ["centners", "kilograms"], ["tonnes", "centners"],
      ["short-tons", "tonnes"], ["tonnes", "short-tons"], ["long-tons", "tonnes"], ["poods", "kilograms"], ["kilograms", "poods"], ["ounces", "kilograms"],
      ["stones", "pounds"], ["pounds", "stones"],
    ],
    table: T_SMALL,
  },
  {
    id: "volume",
    name: { ru: "Объём", en: "Volume" },
    gen: { ru: "объёма", en: "volume" },
    icon: "Beaker",
    base: "liters",
    def: ["liters", "us-gallons"],
    units: [
      lin("milliliters", ["мл", "ml"], ru("миллилитр", "миллилитра", "миллилитров", "миллилитры", "миллилитрах"), ["milliliter", "milliliters"], 0.001),
      lin("cubic-centimeters", ["см³", "cm³"], ru("кубический сантиметр", "кубических сантиметра", "кубических сантиметров", "кубические сантиметры", "кубических сантиметрах", "кубического сантиметра"), ["cubic centimeter", "cubic centimeters"], 0.001, "cc куб см"),
      lin("liters", ["л", "L"], ru("литр", "литра", "литров", "литры", "литрах"), ["liter", "liters"], 1, "litre"),
      lin("cubic-meters", ["м³", "m³"], ru("кубический метр", "кубических метра", "кубических метров", "кубические метры", "кубических метрах", "кубического метра"), ["cubic meter", "cubic meters"], 1000, "кубометр куб"),
      lin("teaspoons", ["ч. л.", "tsp"], ru("чайная ложка", "чайные ложки", "чайных ложек", "чайные ложки", "чайных ложках", "чайной ложки"), ["US teaspoon", "US teaspoons"], 0.00492892159375),
      lin("tablespoons", ["ст. л.", "tbsp"], ru("столовая ложка", "столовые ложки", "столовых ложек", "столовые ложки", "столовых ложках", "столовой ложки"), ["US tablespoon", "US tablespoons"], 0.01478676478125),
      lin("us-fluid-ounces", ["амер. жидк. унция", "US fl oz"], ru("жидкая унция (США)", "жидкие унции (США)", "жидких унций (США)", "жидкие унции (США)", "жидких унциях (США)", "жидкой унции (США)"), ["US fluid ounce", "US fluid ounces"], 0.0295735295625, "fl oz"),
      lin("us-cups", ["чашка (США)", "cup"], ru("чашка (США)", "чашки (США)", "чашек (США)", "чашки (США)", "чашках (США)"), ["US cup", "US cups"], 0.2365882365),
      lin("us-pints", ["пинта (США)", "US pt"], ru("пинта (США)", "пинты (США)", "пинт (США)", "пинты (США)", "пинтах (США)"), ["US pint", "US pints"], 0.473176473),
      lin("us-quarts", ["кварта (США)", "US qt"], ru("кварта (США)", "кварты (США)", "кварт (США)", "кварты (США)", "квартах (США)"), ["US quart", "US quarts"], 0.946352946),
      lin("us-gallons", ["галлон (США)", "US gal"], ru("галлон (США)", "галлона (США)", "галлонов (США)", "галлоны (США)", "галлонах (США)"), ["US gallon", "US gallons"], 3.785411784, "gallon"),
      lin("imperial-fluid-ounces", ["брит. жидк. унция", "imp fl oz"], ru("жидкая унция (брит.)", "жидкие унции (брит.)", "жидких унций (брит.)", "жидкие унции (брит.)", "жидких унциях (брит.)", "жидкой унции (брит.)"), ["imperial fluid ounce", "imperial fluid ounces"], 0.0284130625),
      lin("imperial-pints", ["пинта (брит.)", "imp pt"], ru("пинта (брит.)", "пинты (брит.)", "пинт (брит.)", "пинты (брит.)", "пинтах (брит.)"), ["imperial pint", "imperial pints"], 0.56826125, "UK pint"),
      lin("imperial-gallons", ["галлон (брит.)", "imp gal"], ru("галлон (брит.)", "галлона (брит.)", "галлонов (брит.)", "галлоны (брит.)", "галлонах (брит.)"), ["imperial gallon", "imperial gallons"], 4.54609, "UK gallon"),
      lin("cubic-inches", ["дюйм³", "in³"], ru("кубический дюйм", "кубических дюйма", "кубических дюймов", "кубические дюймы", "кубических дюймах", "кубического дюйма"), ["cubic inch", "cubic inches"], 0.016387064),
      lin("cubic-feet", ["фут³", "ft³"], ru("кубический фут", "кубических фута", "кубических футов", "кубические футы", "кубических футах", "кубического фута"), ["cubic foot", "cubic feet"], 28.316846592),
      lin("oil-barrels", ["баррель", "bbl"], ru("баррель", "барреля", "баррелей", "баррели", "баррелях"), ["oil barrel", "oil barrels"], 158.987294928, "нефть oil"),
    ],
    pairs: [
      ["liters", "us-gallons"], ["us-gallons", "liters"], ["liters", "imperial-gallons"], ["imperial-gallons", "liters"], ["milliliters", "us-fluid-ounces"],
      ["us-fluid-ounces", "milliliters"], ["us-cups", "milliliters"], ["milliliters", "us-cups"], ["tablespoons", "milliliters"], ["milliliters", "tablespoons"],
      ["teaspoons", "milliliters"], ["milliliters", "teaspoons"], ["liters", "milliliters"], ["milliliters", "liters"], ["cubic-meters", "liters"], ["liters", "cubic-meters"],
      ["liters", "us-quarts"], ["us-quarts", "liters"], ["us-pints", "liters"], ["liters", "us-pints"], ["imperial-pints", "liters"], ["liters", "cubic-feet"],
      ["cubic-feet", "liters"], ["cubic-feet", "cubic-meters"], ["cubic-meters", "cubic-feet"], ["oil-barrels", "liters"], ["liters", "oil-barrels"],
      ["cubic-inches", "cubic-centimeters"], ["cubic-centimeters", "cubic-inches"], ["us-gallons", "imperial-gallons"], ["tablespoons", "teaspoons"],
    ],
    table: T_SMALL,
  },
  {
    id: "temperature",
    name: { ru: "Температура", en: "Temperature" },
    gen: { ru: "температуры", en: "temperature" },
    icon: "Thermometer",
    base: "kelvin",
    def: ["celsius", "fahrenheit"],
    allowNegative: true,
    units: [
      { slug: "celsius", sym: { ru: "°C", en: "°C" }, ru: ru("градус Цельсия", "градуса Цельсия", "градусов Цельсия", "градусы Цельсия", "градусах Цельсия"), en: ["degree Celsius", "degrees Celsius"], kind: "affine", factor: 1, offset: 273.15, kw: "цельсий centigrade" },
      { slug: "fahrenheit", sym: { ru: "°F", en: "°F" }, ru: ru("градус Фаренгейта", "градуса Фаренгейта", "градусов Фаренгейта", "градусы Фаренгейта", "градусах Фаренгейта"), en: ["degree Fahrenheit", "degrees Fahrenheit"], kind: "affine", factor: 5 / 9, offset: 459.67 * (5 / 9), kw: "фаренгейт" },
      { slug: "kelvin", sym: { ru: "K", en: "K" }, ru: ru("кельвин", "кельвина", "кельвинов", "кельвины", "кельвинах"), en: ["kelvin", "kelvins"], kind: "affine", factor: 1, offset: 0 },
      { slug: "rankine", sym: { ru: "°R", en: "°R" }, ru: ru("градус Ранкина", "градуса Ранкина", "градусов Ранкина", "градусы Ранкина", "градусах Ранкина"), en: ["degree Rankine", "degrees Rankine"], kind: "affine", factor: 5 / 9, offset: 0 },
      { slug: "reaumur", sym: { ru: "°Ré", en: "°Ré" }, ru: ru("градус Реомюра", "градуса Реомюра", "градусов Реомюра", "градусы Реомюра", "градусах Реомюра"), en: ["degree Réaumur", "degrees Réaumur"], kind: "affine", factor: 1.25, offset: 273.15 },
    ],
    pairs: [
      ["celsius", "fahrenheit"], ["fahrenheit", "celsius"], ["celsius", "kelvin"], ["kelvin", "celsius"], ["fahrenheit", "kelvin"], ["kelvin", "fahrenheit"],
      ["celsius", "rankine"], ["rankine", "celsius"], ["fahrenheit", "rankine"], ["rankine", "fahrenheit"], ["celsius", "reaumur"], ["reaumur", "celsius"],
    ],
    table: [-40, -30, -20, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 36.6, 37, 38, 39, 40, 50, 60, 80, 100, 150, 180, 200, 220, 250],
  },
  {
    id: "area",
    name: { ru: "Площадь", en: "Area" },
    gen: { ru: "площади", en: "area" },
    icon: "SquareDashed",
    base: "square-meters",
    def: ["square-meters", "square-feet"],
    units: [
      lin("square-millimeters", ["мм²", "mm²"], ru("квадратный миллиметр", "квадратных миллиметра", "квадратных миллиметров", "квадратные миллиметры", "квадратных миллиметрах", "квадратного миллиметра"), ["square millimeter", "square millimeters"], 1e-6),
      lin("square-centimeters", ["см²", "cm²"], ru("квадратный сантиметр", "квадратных сантиметра", "квадратных сантиметров", "квадратные сантиметры", "квадратных сантиметрах", "квадратного сантиметра"), ["square centimeter", "square centimeters"], 1e-4),
      lin("square-meters", ["м²", "m²"], ru("квадратный метр", "квадратных метра", "квадратных метров", "квадратные метры", "квадратных метрах", "квадратного метра"), ["square meter", "square meters"], 1, "квадрат кв м"),
      lin("ares", ["сотка", "a"], ru("сотка", "сотки", "соток", "сотки", "сотках"), ["are", "ares"], 100, "ар ары are"),
      lin("hectares", ["га", "ha"], ru("гектар", "гектара", "гектаров", "гектары", "гектарах"), ["hectare", "hectares"], 10000),
      lin("square-kilometers", ["км²", "km²"], ru("квадратный километр", "квадратных километра", "квадратных километров", "квадратные километры", "квадратных километрах", "квадратного километра"), ["square kilometer", "square kilometers"], 1e6),
      lin("square-inches", ["дюйм²", "in²"], ru("квадратный дюйм", "квадратных дюйма", "квадратных дюймов", "квадратные дюймы", "квадратных дюймах", "квадратного дюйма"), ["square inch", "square inches"], 0.00064516),
      lin("square-feet", ["фут²", "ft²"], ru("квадратный фут", "квадратных фута", "квадратных футов", "квадратные футы", "квадратных футах", "квадратного фута"), ["square foot", "square feet"], 0.09290304, "sq ft"),
      lin("square-yards", ["ярд²", "yd²"], ru("квадратный ярд", "квадратных ярда", "квадратных ярдов", "квадратные ярды", "квадратных ярдах", "квадратного ярда"), ["square yard", "square yards"], 0.83612736),
      lin("acres", ["акр", "ac"], ru("акр", "акра", "акров", "акры", "акрах"), ["acre", "acres"], 4046.8564224),
      lin("square-miles", ["миля²", "mi²"], ru("квадратная миля", "квадратные мили", "квадратных миль", "квадратные мили", "квадратных милях", "квадратной мили"), ["square mile", "square miles"], 2589988.110336),
    ],
    pairs: [
      ["square-meters", "square-feet"], ["square-feet", "square-meters"], ["hectares", "acres"], ["acres", "hectares"], ["ares", "square-meters"], ["square-meters", "ares"],
      ["hectares", "ares"], ["ares", "hectares"], ["hectares", "square-meters"], ["square-meters", "hectares"], ["square-kilometers", "square-miles"], ["square-miles", "square-kilometers"],
      ["square-centimeters", "square-inches"], ["square-inches", "square-centimeters"], ["acres", "square-meters"], ["square-meters", "acres"], ["square-yards", "square-meters"],
      ["square-meters", "square-yards"], ["square-kilometers", "hectares"], ["hectares", "square-kilometers"], ["acres", "square-feet"], ["square-feet", "acres"],
      ["square-meters", "square-centimeters"], ["square-centimeters", "square-meters"], ["ares", "acres"], ["acres", "ares"],
    ],
    table: T_SMALL,
  },
  {
    id: "speed",
    name: { ru: "Скорость", en: "Speed" },
    gen: { ru: "скорости", en: "speed" },
    icon: "Gauge",
    base: "meters-per-second",
    def: ["kilometers-per-hour", "miles-per-hour"],
    units: [
      lin("meters-per-second", ["м/с", "m/s"], ru("метр в секунду", "метра в секунду", "метров в секунду", "метры в секунду", "метрах в секунду"), ["meter per second", "meters per second"], 1),
      lin("kilometers-per-hour", ["км/ч", "km/h"], ru("километр в час", "километра в час", "километров в час", "километры в час", "километрах в час"), ["kilometer per hour", "kilometers per hour"], 1 / 3.6, "kph"),
      lin("miles-per-hour", ["миль/ч", "mph"], ru("миля в час", "мили в час", "миль в час", "мили в час", "милях в час"), ["mile per hour", "miles per hour"], 0.44704),
      lin("knots", ["узел", "kn"], ru("узел", "узла", "узлов", "узлы", "узлах"), ["knot", "knots"], 1852 / 3600),
      lin("feet-per-second", ["фут/с", "ft/s"], ru("фут в секунду", "фута в секунду", "футов в секунду", "футы в секунду", "футах в секунду"), ["foot per second", "feet per second"], 0.3048),
      lin("mach", ["Мах", "Mach"], ru("мах", "маха", "махов", "махи", "махах"), ["Mach", "Mach"], 340.294, "число маха скорость звука"),
      lin("speed-of-light", ["c", "c"], ru("скорость света", "скорости света", "скоростей света", "скорости света", "скоростях света", "скорости света"), ["speed of light", "speed of light"], 299792458),
    ],
    pairs: [
      ["kilometers-per-hour", "miles-per-hour"], ["miles-per-hour", "kilometers-per-hour"], ["meters-per-second", "kilometers-per-hour"], ["kilometers-per-hour", "meters-per-second"],
      ["knots", "kilometers-per-hour"], ["kilometers-per-hour", "knots"], ["knots", "miles-per-hour"], ["miles-per-hour", "knots"], ["meters-per-second", "miles-per-hour"],
      ["miles-per-hour", "meters-per-second"], ["mach", "kilometers-per-hour"], ["kilometers-per-hour", "mach"], ["feet-per-second", "meters-per-second"], ["meters-per-second", "feet-per-second"],
      ["feet-per-second", "miles-per-hour"],
    ],
    table: [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 150, 200, 250, 300],
  },
  {
    id: "time",
    name: { ru: "Время", en: "Time" },
    gen: { ru: "времени", en: "time" },
    icon: "Hourglass",
    base: "seconds",
    def: ["hours", "minutes"],
    units: [
      lin("nanoseconds", ["нс", "ns"], ru("наносекунда", "наносекунды", "наносекунд", "наносекунды", "наносекундах"), ["nanosecond", "nanoseconds"], 1e-9),
      lin("microseconds", ["мкс", "µs"], ru("микросекунда", "микросекунды", "микросекунд", "микросекунды", "микросекундах"), ["microsecond", "microseconds"], 1e-6),
      lin("milliseconds", ["мс", "ms"], ru("миллисекунда", "миллисекунды", "миллисекунд", "миллисекунды", "миллисекундах"), ["millisecond", "milliseconds"], 0.001),
      lin("seconds", ["с", "s"], ru("секунда", "секунды", "секунд", "секунды", "секундах"), ["second", "seconds"], 1),
      lin("minutes", ["мин", "min"], ru("минута", "минуты", "минут", "минуты", "минутах"), ["minute", "minutes"], 60),
      lin("hours", ["ч", "h"], ru("час", "часа", "часов", "часы", "часах"), ["hour", "hours"], 3600),
      lin("days", ["сут", "d"], ru("день", "дня", "дней", "дни", "днях"), ["day", "days"], 86400, "сутки"),
      lin("weeks", ["нед", "wk"], ru("неделя", "недели", "недель", "недели", "неделях"), ["week", "weeks"], 604800),
      lin("months", ["мес", "mo"], ru("месяц", "месяца", "месяцев", "месяцы", "месяцах"), ["month", "months"], 2629746, "средний месяц"),
      lin("years", ["год", "yr"], ru("год", "года", "лет", "годы", "годах"), ["year", "years"], 31556952),
      lin("decades", ["десятилетие", "dec"], ru("десятилетие", "десятилетия", "десятилетий", "десятилетия", "десятилетиях"), ["decade", "decades"], 315569520),
      lin("centuries", ["век", "c"], ru("век", "века", "веков", "века", "веках"), ["century", "centuries"], 3155695200),
    ],
    pairs: [
      ["hours", "minutes"], ["minutes", "hours"], ["minutes", "seconds"], ["seconds", "minutes"], ["hours", "seconds"], ["seconds", "hours"], ["days", "hours"],
      ["hours", "days"], ["weeks", "days"], ["days", "weeks"], ["years", "days"], ["days", "years"], ["months", "days"], ["days", "months"], ["years", "months"],
      ["months", "years"], ["weeks", "months"], ["months", "weeks"], ["seconds", "milliseconds"], ["milliseconds", "seconds"], ["years", "weeks"], ["years", "hours"],
      ["days", "minutes"], ["days", "seconds"], ["microseconds", "milliseconds"], ["nanoseconds", "seconds"],
    ],
    table: T_SMALL,
  },
  {
    id: "data",
    name: { ru: "Объём данных", en: "Data size" },
    gen: { ru: "единиц информации", en: "data units" },
    icon: "HardDrive",
    base: "bytes",
    def: ["gigabytes", "megabytes"],
    units: [
      lin("bits", ["бит", "bit"], ru("бит", "бита", "бит", "биты", "битах"), ["bit", "bits"], 0.125),
      lin("bytes", ["Б", "B"], ru("байт", "байта", "байт", "байты", "байтах"), ["byte", "bytes"], 1),
      lin("kilobits", ["Кбит", "kbit"], ru("килобит", "килобита", "килобит", "килобиты", "килобитах"), ["kilobit", "kilobits"], 125),
      lin("kilobytes", ["КБ", "kB"], ru("килобайт", "килобайта", "килобайт", "килобайты", "килобайтах"), ["kilobyte", "kilobytes"], 1000),
      lin("kibibytes", ["КиБ", "KiB"], ru("кибибайт", "кибибайта", "кибибайт", "кибибайты", "кибибайтах"), ["kibibyte", "kibibytes"], 1024),
      lin("megabits", ["Мбит", "Mbit"], ru("мегабит", "мегабита", "мегабит", "мегабиты", "мегабитах"), ["megabit", "megabits"], 125000),
      lin("megabytes", ["МБ", "MB"], ru("мегабайт", "мегабайта", "мегабайт", "мегабайты", "мегабайтах"), ["megabyte", "megabytes"], 1e6),
      lin("mebibytes", ["МиБ", "MiB"], ru("мебибайт", "мебибайта", "мебибайт", "мебибайты", "мебибайтах"), ["mebibyte", "mebibytes"], 1048576),
      lin("gigabits", ["Гбит", "Gbit"], ru("гигабит", "гигабита", "гигабит", "гигабиты", "гигабитах"), ["gigabit", "gigabits"], 1.25e8),
      lin("gigabytes", ["ГБ", "GB"], ru("гигабайт", "гигабайта", "гигабайт", "гигабайты", "гигабайтах"), ["gigabyte", "gigabytes"], 1e9, "гиг"),
      lin("gibibytes", ["ГиБ", "GiB"], ru("гибибайт", "гибибайта", "гибибайт", "гибибайты", "гибибайтах"), ["gibibyte", "gibibytes"], 1073741824),
      lin("terabytes", ["ТБ", "TB"], ru("терабайт", "терабайта", "терабайт", "терабайты", "терабайтах"), ["terabyte", "terabytes"], 1e12),
      lin("tebibytes", ["ТиБ", "TiB"], ru("тебибайт", "тебибайта", "тебибайт", "тебибайты", "тебибайтах"), ["tebibyte", "tebibytes"], 1099511627776),
      lin("petabytes", ["ПБ", "PB"], ru("петабайт", "петабайта", "петабайт", "петабайты", "петабайтах"), ["petabyte", "petabytes"], 1e15),
    ],
    pairs: [
      ["gigabytes", "megabytes"], ["megabytes", "gigabytes"], ["megabytes", "kilobytes"], ["kilobytes", "megabytes"], ["terabytes", "gigabytes"], ["gigabytes", "terabytes"],
      ["bytes", "bits"], ["bits", "bytes"], ["megabits", "megabytes"], ["megabytes", "megabits"], ["gigabits", "gigabytes"], ["gigabytes", "gigabits"], ["gibibytes", "gigabytes"],
      ["gigabytes", "gibibytes"], ["mebibytes", "megabytes"], ["megabytes", "mebibytes"], ["kibibytes", "kilobytes"], ["tebibytes", "terabytes"], ["terabytes", "tebibytes"],
      ["kilobytes", "bytes"], ["bytes", "kilobytes"], ["petabytes", "terabytes"], ["kilobits", "kilobytes"],
    ],
    table: [1, 2, 4, 8, 10, 16, 32, 50, 64, 100, 128, 256, 500, 512, 1000, 1024, 2048],
  },
  {
    id: "pressure",
    name: { ru: "Давление", en: "Pressure" },
    gen: { ru: "давления", en: "pressure" },
    icon: "Gauge",
    base: "pascals",
    def: ["bars", "psi"],
    units: [
      lin("pascals", ["Па", "Pa"], ru("паскаль", "паскаля", "паскалей", "паскали", "паскалях"), ["pascal", "pascals"], 1),
      lin("hectopascals", ["гПа", "hPa"], ru("гектопаскаль", "гектопаскаля", "гектопаскалей", "гектопаскали", "гектопаскалях"), ["hectopascal", "hectopascals"], 100),
      lin("kilopascals", ["кПа", "kPa"], ru("килопаскаль", "килопаскаля", "килопаскалей", "килопаскали", "килопаскалях"), ["kilopascal", "kilopascals"], 1000),
      lin("megapascals", ["МПа", "MPa"], ru("мегапаскаль", "мегапаскаля", "мегапаскалей", "мегапаскали", "мегапаскалях"), ["megapascal", "megapascals"], 1e6),
      lin("millibars", ["мбар", "mbar"], ru("миллибар", "миллибара", "миллибаров", "миллибары", "миллибарах"), ["millibar", "millibars"], 100),
      lin("bars", ["бар", "bar"], ru("бар", "бара", "бар", "бары", "барах"), ["bar", "bars"], 1e5),
      lin("atmospheres", ["атм", "atm"], ru("атмосфера", "атмосферы", "атмосфер", "атмосферы", "атмосферах"), ["standard atmosphere", "standard atmospheres"], 101325, "физическая атмосфера"),
      lin("technical-atmospheres", ["кгс/см²", "at"], ru("техническая атмосфера (кгс/см²)", "технические атмосферы (кгс/см²)", "технических атмосфер (кгс/см²)", "технические атмосферы (кгс/см²)", "технических атмосферах (кгс/см²)", "технической атмосферы (кгс/см²)"), ["technical atmosphere (kgf/cm²)", "technical atmospheres (kgf/cm²)"], 98066.5, "кгс см2 kgf"),
      lin("mmhg", ["мм рт. ст.", "mmHg"], ru("миллиметр ртутного столба", "миллиметра ртутного столба", "миллиметров ртутного столба", "миллиметры ртутного столба", "миллиметрах ртутного столба"), ["millimeter of mercury", "millimeters of mercury"], 133.322387415, "давление крови торр"),
      lin("torr", ["Торр", "Torr"], ru("торр", "торра", "торр", "торры", "торрах"), ["torr", "torr"], 101325 / 760),
      lin("inhg", ["дюйм рт. ст.", "inHg"], ru("дюйм ртутного столба", "дюйма ртутного столба", "дюймов ртутного столба", "дюймы ртутного столба", "дюймах ртутного столба"), ["inch of mercury", "inches of mercury"], 3386.388640341),
      lin("mm-water", ["мм вод. ст.", "mmH₂O"], ru("миллиметр водяного столба", "миллиметра водяного столба", "миллиметров водяного столба", "миллиметры водяного столба", "миллиметрах водяного столба"), ["millimeter of water", "millimeters of water"], 9.80665),
      lin("psi", ["psi", "psi"], ru("фунт на квадратный дюйм", "фунта на квадратный дюйм", "фунтов на квадратный дюйм", "фунты на квадратный дюйм", "фунтах на квадратный дюйм"), ["pound per square inch", "pounds per square inch"], 6894.757293168, "шины tyre tire"),
    ],
    pairs: [
      ["bars", "psi"], ["psi", "bars"], ["atmospheres", "bars"], ["bars", "atmospheres"], ["psi", "kilopascals"], ["kilopascals", "psi"], ["bars", "kilopascals"],
      ["kilopascals", "bars"], ["mmhg", "kilopascals"], ["kilopascals", "mmhg"], ["hectopascals", "mmhg"], ["mmhg", "hectopascals"], ["technical-atmospheres", "bars"],
      ["bars", "technical-atmospheres"], ["technical-atmospheres", "psi"], ["psi", "technical-atmospheres"], ["megapascals", "bars"], ["bars", "megapascals"],
      ["atmospheres", "pascals"], ["pascals", "atmospheres"], ["inhg", "hectopascals"], ["hectopascals", "inhg"], ["psi", "atmospheres"], ["atmospheres", "psi"],
      ["millibars", "mmhg"], ["mmhg", "millibars"], ["torr", "pascals"], ["mm-water", "pascals"],
    ],
    table: [0.5, 1, 1.5, 2, 2.2, 2.5, 3, 4, 5, 6, 8, 10, 15, 20, 30, 50, 100],
  },
  {
    id: "energy",
    name: { ru: "Энергия", en: "Energy" },
    gen: { ru: "энергии", en: "energy" },
    icon: "Zap",
    base: "joules",
    def: ["kilocalories", "kilojoules"],
    units: [
      lin("joules", ["Дж", "J"], ru("джоуль", "джоуля", "джоулей", "джоули", "джоулях"), ["joule", "joules"], 1),
      lin("kilojoules", ["кДж", "kJ"], ru("килоджоуль", "килоджоуля", "килоджоулей", "килоджоули", "килоджоулях"), ["kilojoule", "kilojoules"], 1000),
      lin("megajoules", ["МДж", "MJ"], ru("мегаджоуль", "мегаджоуля", "мегаджоулей", "мегаджоули", "мегаджоулях"), ["megajoule", "megajoules"], 1e6),
      lin("calories", ["кал", "cal"], ru("калория", "калории", "калорий", "калории", "калориях"), ["calorie", "calories"], 4.184),
      lin("kilocalories", ["ккал", "kcal"], ru("килокалория", "килокалории", "килокалорий", "килокалории", "килокалориях"), ["kilocalorie", "kilocalories"], 4184, "калории пищевые food calories Cal"),
      lin("watt-hours", ["Вт·ч", "Wh"], ru("ватт-час", "ватт-часа", "ватт-часов", "ватт-часы", "ватт-часах"), ["watt-hour", "watt-hours"], 3600),
      lin("kilowatt-hours", ["кВт·ч", "kWh"], ru("киловатт-час", "киловатт-часа", "киловатт-часов", "киловатт-часы", "киловатт-часах"), ["kilowatt-hour", "kilowatt-hours"], 3.6e6, "квт ч электроэнергия"),
      lin("electronvolts", ["эВ", "eV"], ru("электронвольт", "электронвольта", "электронвольт", "электронвольты", "электронвольтах"), ["electronvolt", "electronvolts"], 1.602176634e-19),
      lin("btu", ["БТЕ", "BTU"], ru("британская тепловая единица", "британские тепловые единицы", "британских тепловых единиц", "британские тепловые единицы", "британских тепловых единицах", "британской тепловой единицы"), ["British thermal unit", "British thermal units"], 1055.05585262, "btu"),
      lin("foot-pounds", ["фут·фунт", "ft·lbf"], ru("фут-фунт", "фут-фунта", "фут-фунтов", "фут-фунты", "фут-фунтах"), ["foot-pound", "foot-pounds"], 1.3558179483314004),
      lin("therms", ["терм", "thm"], ru("терм", "терма", "термов", "термы", "термах"), ["therm", "therms"], 105480400),
    ],
    pairs: [
      ["kilocalories", "kilojoules"], ["kilojoules", "kilocalories"], ["joules", "calories"], ["calories", "joules"], ["kilowatt-hours", "joules"], ["joules", "kilowatt-hours"],
      ["kilowatt-hours", "megajoules"], ["megajoules", "kilowatt-hours"], ["btu", "kilowatt-hours"], ["kilowatt-hours", "btu"], ["btu", "joules"], ["joules", "btu"],
      ["kilocalories", "calories"], ["calories", "kilocalories"], ["watt-hours", "joules"], ["joules", "watt-hours"], ["electronvolts", "joules"], ["joules", "electronvolts"],
      ["kilocalories", "kilowatt-hours"], ["kilowatt-hours", "kilocalories"], ["foot-pounds", "joules"], ["joules", "foot-pounds"], ["therms", "kilowatt-hours"],
    ],
    table: T_SMALL,
  },
  {
    id: "power",
    name: { ru: "Мощность", en: "Power" },
    gen: { ru: "мощности", en: "power" },
    icon: "PlugZap",
    base: "watts",
    def: ["kilowatts", "horsepower"],
    units: [
      lin("watts", ["Вт", "W"], ru("ватт", "ватта", "ватт", "ватты", "ваттах"), ["watt", "watts"], 1),
      lin("kilowatts", ["кВт", "kW"], ru("киловатт", "киловатта", "киловатт", "киловатты", "киловаттах"), ["kilowatt", "kilowatts"], 1000),
      lin("megawatts", ["МВт", "MW"], ru("мегаватт", "мегаватта", "мегаватт", "мегаватты", "мегаваттах"), ["megawatt", "megawatts"], 1e6),
      lin("metric-horsepower", ["л. с.", "PS"], ru("лошадиная сила", "лошадиные силы", "лошадиных сил", "лошадиные силы", "лошадиных силах", "лошадиной силы"), ["metric horsepower", "metric horsepower"], 735.49875, "лс л.с. авто"),
      lin("horsepower", ["hp", "hp"], ru("механическая лошадиная сила (hp)", "механические лошадиные силы (hp)", "механических лошадиных сил (hp)", "механические лошадиные силы (hp)", "механических лошадиных силах (hp)", "механической лошадиной силы (hp)"), ["horsepower", "horsepower"], 745.6998715822702, "hp imperial"),
      lin("btu-per-hour", ["БТЕ/ч", "BTU/h"], ru("БТЕ в час", "БТЕ в час", "БТЕ в час", "БТЕ в час", "БТЕ в час"), ["BTU per hour", "BTU per hour"], 0.29307107017, "кондиционер btu"),
      lin("kilocalories-per-hour", ["ккал/ч", "kcal/h"], ru("килокалория в час", "килокалории в час", "килокалорий в час", "килокалории в час", "килокалориях в час"), ["kilocalorie per hour", "kilocalories per hour"], 4184 / 3600),
      lin("tons-of-refrigeration", ["TR", "TR"], ru("тонна охлаждения", "тонны охлаждения", "тонн охлаждения", "тонны охлаждения", "тоннах охлаждения"), ["ton of refrigeration", "tons of refrigeration"], 3516.8528420667),
    ],
    pairs: [
      ["kilowatts", "horsepower"], ["horsepower", "kilowatts"], ["kilowatts", "metric-horsepower"], ["metric-horsepower", "kilowatts"], ["horsepower", "metric-horsepower"],
      ["metric-horsepower", "horsepower"], ["watts", "kilowatts"], ["kilowatts", "watts"], ["btu-per-hour", "watts"], ["watts", "btu-per-hour"], ["btu-per-hour", "kilowatts"],
      ["kilowatts", "btu-per-hour"], ["megawatts", "kilowatts"], ["watts", "horsepower"], ["tons-of-refrigeration", "kilowatts"], ["kilocalories-per-hour", "watts"],
    ],
    table: [1, 5, 10, 50, 75, 100, 110, 150, 200, 250, 300, 400, 500, 1000],
  },
  {
    id: "angle",
    name: { ru: "Угол", en: "Angle" },
    gen: { ru: "углов", en: "angle" },
    icon: "TriangleRight",
    base: "degrees",
    def: ["degrees", "radians"],
    allowNegative: true,
    units: [
      lin("degrees", ["°", "°"], ru("градус", "градуса", "градусов", "градусы", "градусах"), ["degree", "degrees"], 1),
      lin("radians", ["рад", "rad"], ru("радиан", "радиана", "радиан", "радианы", "радианах"), ["radian", "radians"], 180 / Math.PI),
      lin("gradians", ["град", "gon"], ru("град", "града", "градов", "грады", "градах"), ["gradian", "gradians"], 0.9, "гон gon"),
      lin("arcminutes", ["′", "′"], ru("угловая минута", "угловые минуты", "угловых минут", "угловые минуты", "угловых минутах", "угловой минуты"), ["arcminute", "arcminutes"], 1 / 60),
      lin("arcseconds", ["″", "″"], ru("угловая секунда", "угловые секунды", "угловых секунд", "угловые секунды", "угловых секундах", "угловой секунды"), ["arcsecond", "arcseconds"], 1 / 3600),
      lin("turns", ["об", "tr"], ru("оборот", "оборота", "оборотов", "обороты", "оборотах"), ["turn", "turns"], 360),
      lin("mils-nato", ["т. д.", "mil"], ru("тысячная (НАТО)", "тысячные (НАТО)", "тысячных (НАТО)", "тысячные (НАТО)", "тысячных (НАТО)", "тысячной (НАТО)"), ["NATO mil", "NATO mils"], 360 / 6400),
    ],
    pairs: [
      ["degrees", "radians"], ["radians", "degrees"], ["degrees", "gradians"], ["gradians", "degrees"], ["degrees", "arcminutes"], ["arcminutes", "degrees"],
      ["arcseconds", "degrees"], ["degrees", "arcseconds"], ["turns", "degrees"], ["degrees", "turns"], ["radians", "turns"], ["mils-nato", "degrees"],
    ],
    table: [1, 5, 10, 15, 30, 45, 60, 90, 120, 135, 180, 270, 360],
  },
  {
    id: "frequency",
    name: { ru: "Частота", en: "Frequency" },
    gen: { ru: "частоты", en: "frequency" },
    icon: "AudioWaveform",
    base: "hertz",
    def: ["megahertz", "kilohertz"],
    units: [
      lin("hertz", ["Гц", "Hz"], ru("герц", "герца", "герц", "герцы", "герцах"), ["hertz", "hertz"], 1),
      lin("kilohertz", ["кГц", "kHz"], ru("килогерц", "килогерца", "килогерц", "килогерцы", "килогерцах"), ["kilohertz", "kilohertz"], 1e3),
      lin("megahertz", ["МГц", "MHz"], ru("мегагерц", "мегагерца", "мегагерц", "мегагерцы", "мегагерцах"), ["megahertz", "megahertz"], 1e6),
      lin("gigahertz", ["ГГц", "GHz"], ru("гигагерц", "гигагерца", "гигагерц", "гигагерцы", "гигагерцах"), ["gigahertz", "gigahertz"], 1e9),
      lin("rpm", ["об/мин", "rpm"], ru("оборот в минуту", "оборота в минуту", "оборотов в минуту", "обороты в минуту", "оборотах в минуту"), ["revolution per minute", "revolutions per minute"], 1 / 60),
    ],
    pairs: [["hertz", "rpm"], ["rpm", "hertz"], ["megahertz", "kilohertz"], ["kilohertz", "megahertz"], ["gigahertz", "megahertz"], ["megahertz", "gigahertz"], ["kilohertz", "hertz"], ["hertz", "kilohertz"]],
    table: [1, 2, 5, 10, 50, 60, 100, 440, 1000, 2400, 5000],
  },
  {
    id: "force",
    name: { ru: "Сила", en: "Force" },
    gen: { ru: "силы", en: "force" },
    icon: "MoveRight",
    base: "newtons",
    def: ["newtons", "kilograms-force"],
    units: [
      lin("newtons", ["Н", "N"], ru("ньютон", "ньютона", "ньютонов", "ньютоны", "ньютонах"), ["newton", "newtons"], 1),
      lin("kilonewtons", ["кН", "kN"], ru("килоньютон", "килоньютона", "килоньютонов", "килоньютоны", "килоньютонах"), ["kilonewton", "kilonewtons"], 1000),
      lin("kilograms-force", ["кгс", "kgf"], ru("килограмм-сила", "килограмм-силы", "килограмм-сил", "килограмм-силы", "килограмм-силах"), ["kilogram-force", "kilograms-force"], 9.80665),
      lin("pounds-force", ["фунт-сила", "lbf"], ru("фунт-сила", "фунт-силы", "фунт-сил", "фунт-силы", "фунт-силах"), ["pound-force", "pounds-force"], 4.4482216152605),
      lin("dynes", ["дин", "dyn"], ru("дина", "дины", "дин", "дины", "динах"), ["dyne", "dynes"], 1e-5),
      lin("tonnes-force", ["тс", "tf"], ru("тонна-сила", "тонны-силы", "тонн-сил", "тонны-силы", "тоннах-силы"), ["tonne-force", "tonnes-force"], 9806.65),
    ],
    pairs: [["newtons", "kilograms-force"], ["kilograms-force", "newtons"], ["kilonewtons", "tonnes-force"], ["tonnes-force", "kilonewtons"], ["newtons", "pounds-force"], ["pounds-force", "newtons"], ["kilonewtons", "kilograms-force"], ["kilograms-force", "kilonewtons"]],
    table: T_SMALL,
  },
  {
    id: "torque",
    name: { ru: "Крутящий момент", en: "Torque" },
    gen: { ru: "крутящего момента", en: "torque" },
    icon: "RotateCw",
    base: "newton-meters",
    def: ["newton-meters", "pound-feet"],
    units: [
      lin("newton-meters", ["Н·м", "N·m"], ru("ньютон-метр", "ньютон-метра", "ньютон-метров", "ньютон-метры", "ньютон-метрах"), ["newton-meter", "newton-meters"], 1),
      lin("kilogram-force-meters", ["кгс·м", "kgf·m"], ru("килограмм-сила-метр", "килограмм-сила-метра", "килограмм-сила-метров", "килограмм-сила-метры", "килограмм-сила-метрах"), ["kilogram-force meter", "kilogram-force meters"], 9.80665),
      lin("pound-feet", ["фунт·фут", "lb·ft"], ru("фунт-фут", "фунт-фута", "фунт-футов", "фунт-футы", "фунт-футах"), ["pound-foot", "pound-feet"], 1.3558179483314004, "lbf ft"),
      lin("pound-inches", ["фунт·дюйм", "lb·in"], ru("фунт-дюйм", "фунт-дюйма", "фунт-дюймов", "фунт-дюймы", "фунт-дюймах"), ["pound-inch", "pound-inches"], 0.1129848290276167),
    ],
    pairs: [["newton-meters", "pound-feet"], ["pound-feet", "newton-meters"], ["newton-meters", "kilogram-force-meters"], ["kilogram-force-meters", "newton-meters"], ["pound-inches", "newton-meters"], ["newton-meters", "pound-inches"]],
    table: [1, 5, 10, 20, 25, 30, 40, 50, 80, 100, 150, 200, 300, 400, 500],
  },
  {
    id: "data-rate",
    name: { ru: "Скорость передачи данных", en: "Data transfer rate" },
    gen: { ru: "скорости интернета", en: "data rate" },
    icon: "Wifi",
    base: "bits-per-second",
    def: ["megabits-per-second", "megabytes-per-second"],
    units: [
      lin("bits-per-second", ["бит/с", "bps"], ru("бит в секунду", "бита в секунду", "бит в секунду", "биты в секунду", "битах в секунду"), ["bit per second", "bits per second"], 1),
      lin("kilobits-per-second", ["Кбит/с", "kbps"], ru("килобит в секунду", "килобита в секунду", "килобит в секунду", "килобиты в секунду", "килобитах в секунду"), ["kilobit per second", "kilobits per second"], 1e3),
      lin("megabits-per-second", ["Мбит/с", "Mbps"], ru("мегабит в секунду", "мегабита в секунду", "мегабит в секунду", "мегабиты в секунду", "мегабитах в секунду"), ["megabit per second", "megabits per second"], 1e6, "скорость интернета"),
      lin("gigabits-per-second", ["Гбит/с", "Gbps"], ru("гигабит в секунду", "гигабита в секунду", "гигабит в секунду", "гигабиты в секунду", "гигабитах в секунду"), ["gigabit per second", "gigabits per second"], 1e9),
      lin("kilobytes-per-second", ["КБ/с", "kB/s"], ru("килобайт в секунду", "килобайта в секунду", "килобайт в секунду", "килобайты в секунду", "килобайтах в секунду"), ["kilobyte per second", "kilobytes per second"], 8e3),
      lin("megabytes-per-second", ["МБ/с", "MB/s"], ru("мегабайт в секунду", "мегабайта в секунду", "мегабайт в секунду", "мегабайты в секунду", "мегабайтах в секунду"), ["megabyte per second", "megabytes per second"], 8e6, "скорость загрузки"),
      lin("gigabytes-per-second", ["ГБ/с", "GB/s"], ru("гигабайт в секунду", "гигабайта в секунду", "гигабайт в секунду", "гигабайты в секунду", "гигабайтах в секунду"), ["gigabyte per second", "gigabytes per second"], 8e9),
    ],
    pairs: [
      ["megabits-per-second", "megabytes-per-second"], ["megabytes-per-second", "megabits-per-second"], ["gigabits-per-second", "megabytes-per-second"], ["megabytes-per-second", "gigabits-per-second"],
      ["kilobits-per-second", "kilobytes-per-second"], ["kilobytes-per-second", "kilobits-per-second"], ["gigabits-per-second", "megabits-per-second"], ["megabits-per-second", "kilobits-per-second"],
    ],
    table: [1, 5, 10, 20, 25, 50, 100, 200, 300, 500, 1000],
  },
  {
    id: "fuel",
    name: { ru: "Расход топлива", en: "Fuel economy" },
    gen: { ru: "расхода топлива", en: "fuel economy" },
    icon: "Fuel",
    base: "kilometers-per-liter",
    def: ["liters-per-100-km", "mpg-us"],
    units: [
      { slug: "liters-per-100-km", sym: { ru: "л/100 км", en: "L/100 km" }, ru: ru("литр на 100 км", "литра на 100 км", "литров на 100 км", "литры на 100 км", "литрах на 100 км"), en: ["liter per 100 km", "liters per 100 km"], kind: "reciprocal", factor: 100 },
      { slug: "kilometers-per-liter", sym: { ru: "км/л", en: "km/L" }, ru: ru("километр на литр", "километра на литр", "километров на литр", "километры на литр", "километрах на литр"), en: ["kilometer per liter", "kilometers per liter"], factor: 1 },
      { slug: "mpg-us", sym: { ru: "миль/галлон (США)", en: "mpg (US)" }, ru: ru("миля на галлон (США)", "мили на галлон (США)", "миль на галлон (США)", "мили на галлон (США)", "милях на галлон (США)"), en: ["mile per US gallon", "miles per US gallon"], factor: 1.609344 / 3.785411784, kw: "mpg" },
      { slug: "mpg-uk", sym: { ru: "миль/галлон (брит.)", en: "mpg (UK)" }, ru: ru("миля на галлон (брит.)", "мили на галлон (брит.)", "миль на галлон (брит.)", "мили на галлон (брит.)", "милях на галлон (брит.)"), en: ["mile per imperial gallon", "miles per imperial gallon"], factor: 1.609344 / 4.54609, kw: "mpg imperial" },
    ],
    pairs: [
      ["liters-per-100-km", "mpg-us"], ["mpg-us", "liters-per-100-km"], ["liters-per-100-km", "mpg-uk"], ["mpg-uk", "liters-per-100-km"], ["liters-per-100-km", "kilometers-per-liter"],
      ["kilometers-per-liter", "liters-per-100-km"], ["mpg-us", "kilometers-per-liter"], ["kilometers-per-liter", "mpg-us"], ["mpg-us", "mpg-uk"], ["mpg-uk", "mpg-us"],
    ],
    table: [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50],
  },
];
