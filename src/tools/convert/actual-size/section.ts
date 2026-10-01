import { tr, type Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, LinkItem, PageModel, SectionDef, ToolDef } from "@/registry/types";
import { CAT_IDS, OBJECTS, toClient, type ObjDef } from "./data/objects";
import { CATS, objectVariants } from "./content/pages";

const ID = "actual-size";
const HUE = 60;
const COUNT = OBJECTS.length;

/* ───────────── tools ───────────── */

const objectsTool: ToolDef = {
  slug: "",
  seoAlt: { ru: ["реальный размер на экране", "натуральная величина", "1:1 на экране"], en: ["real size on screen", "actual size", "1:1 on screen"] },
  component: "actual-size/object",
  icon: "Ruler",
  name: { ru: "Реальный размер предметов", en: "Actual size objects" },
  title: {
    ru: "Реальный размер предметов на экране: карты, монеты, iPhone",
    en: "Actual size of objects on screen: cards, coins, phones",
  },
  h1: { ru: "Реальный размер предметов на экране", en: "Actual size of objects on screen" },
  description: {
    ru: `${COUNT} ${plural("ru", COUNT, ["предмет", "предмета", "предметов"])} в натуральную величину: банковская карта, SIM, монеты тенге, рубля и евро, батарейки, iPhone и Galaxy. Калибровка по карте за минуту.`,
    en: `${COUNT} objects at actual size: bank card, SIM cards, coins, banknotes, batteries, paper sizes, iPhone and Galaxy phones. One-minute bank card calibration.`,
  },
  lead: {
    ru: "Выберите предмет — он появится на экране в натуральную величину; для точности откалибруйте экран по банковской карте.",
    en: "Pick an object and it appears on screen at actual size; calibrate the screen with a bank card for accuracy.",
  },
  keywords: {
    ru: ["реальный размер", "натуральная величина", "размер 1:1", "на экране", "предметы"],
    en: ["actual size", "real size", "life size", "1:1", "on screen"],
  },
  props: {
    items: OBJECTS.map((o) => toClient(o, true)),
    initial: "bank-card",
    refs: [],
    groups: CAT_IDS.map((id) => ({ id, name: CATS[id].name })),
  },
  howTo: {
    ru: [
      "Выберите предмет в списке или откройте его страницу из каталога ниже.",
      "Нажмите «Откалибровать», приложите банковскую карту к рамке на экране и подгоните размер ползунком — это нужно сделать один раз в этом браузере.",
      "Приложите настоящий предмет к экрану или сравните его с другим предметом через «Сравнить с»: второй контур появится пунктиром.",
      "Если предмет больше экрана, поверните его на 90° или прокрутите область; «Уместить в окно» показывает уменьшенную копию.",
    ],
    en: [
      "Pick an object in the list or open its page from the catalogue below.",
      "Press Calibrate, hold a bank card against the frame on screen and adjust the size with the slider — once per browser.",
      "Hold the real object against the screen or compare it with another one via “Compare with”: the second outline appears dashed.",
      "If the object is larger than the screen, rotate it 90° or scroll; “Fit to window” shows a scaled-down copy.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему без калибровки размер неточный?",
        a: "Браузер не знает физический размер пикселя вашего экрана. По стандарту CSS в дюйме 96 пикселей, но у телефонов, ноутбуков и мониторов реальный масштаб другой — отличие бывает в полтора-два раза. Калибровка по банковской карте измеряет его напрямую.",
      },
      {
        q: "Насколько точна калибровка?",
        a: "Если подогнать рамку к карте до пикселя, ошибка — около 0,3 % длины: примерно 0,3 мм на 10 см. Смотрите на экран прямо и прижимайте карту плотно — тогда результат будет лучше.",
      },
      {
        q: "Сбивается ли калибровка при изменении масштаба страницы?",
        a: "Да: при масштабировании (Ctrl и плюс/минус) меняется размер CSS-пикселя. В Chrome, Edge и Firefox сайт замечает это по devicePixelRatio, пересчитывает размеры и предупреждает; в Safari такое изменение не видно — держите масштаб 100 % или откалибруйте заново.",
      },
      {
        q: "Откуда взяты размеры предметов?",
        a: "Из официальных источников: стандартов ISO и IEC, данных Национального банка Казахстана, Банка России, ЕЦБ и Монетного двора США, технических характеристик Apple, Samsung, Google и других производителей. Предметы, размеры которых не удалось надёжно проверить, в каталог не попали.",
      },
    ],
    en: [
      {
        q: "Why is the size inaccurate without calibration?",
        a: "Browsers don't know the physical pixel size of your screen. CSS assumes 96 pixels per inch, but phones, laptops and monitors differ — often by a factor of 1.5–2. A bank card calibration measures the real scale directly.",
      },
      {
        q: "How accurate is the calibration?",
        a: "If you match the frame to the card to the pixel, the error is about 0.3% of the length: roughly 0.3 mm per 10 cm. Look at the screen straight on and press the card flat for the best result.",
      },
      {
        q: "Does page zoom break the calibration?",
        a: "Yes: zooming (Ctrl and plus/minus) changes the size of a CSS pixel. In Chrome, Edge and Firefox the site notices this through devicePixelRatio, adjusts the sizes and warns you; Safari doesn't expose it — keep zoom at 100% or calibrate again.",
      },
      {
        q: "Where do the dimensions come from?",
        a: "From official sources: ISO and IEC standards, the National Bank of Kazakhstan, the Bank of Russia, the ECB and the US Mint, and Apple, Samsung, Google and other manufacturers' spec sheets. Objects whose size could not be reliably verified are not in the catalogue.",
      },
    ],
  },
  about: {
    ru: [
      "Каталог показывает предметы в натуральную величину: контур рисуется в миллиметрах и переводится в пиксели по калибровке вашего экрана. Под каждым предметом — миллиметровая шкала, а размеры указаны в мм, см и дюймах.",
      "Калибровка хранится только в вашем браузере и общая для каталога, линейки и транспортира. Детали предметов (кнопки, камеры, узор монет) нарисованы схематично — точными являются габариты, диаметр и скругление углов.",
    ],
    en: [
      "The catalogue draws objects at actual size: each outline is defined in millimetres and converted to pixels using your screen calibration. A millimetre scale sits under every object, and sizes are listed in mm, cm and inches.",
      "The calibration is stored only in your browser and shared by the catalogue, the rulers and the protractor. Details such as buttons, cameras and coin designs are schematic — the outer size, diameter and corner radius are exact.",
    ],
  },
  related: ["convert/centimeters-to-inches", "convert/millimeters-to-inches"],
  popular: true,
  wide: true,
  variants: {
    title: { ru: "Предметы в натуральную величину", en: "Objects at actual size" },
    list: objectVariants,
  },
};

const calibrationTool: ToolDef = {
  slug: "screen-calibration",
  component: "actual-size/calibrate",
  icon: "CreditCard",
  name: { ru: "Калибровка экрана", en: "Screen calibration" },
  title: { ru: "Калибровка экрана по банковской карте — масштаб 1:1", en: "Screen calibration with a bank card — true 1:1 scale" },
  h1: { ru: "Калибровка экрана по банковской карте", en: "Screen calibration with a bank card" },
  description: {
    ru: "Настройте реальный масштаб экрана за минуту: подгоните рамку к банковской карте 85,6 × 53,98 мм или введите диагональ. Покажем плотность пикселей (PPI).",
    en: "Set your screen's real scale in a minute: match the frame to an 85.6 × 53.98 mm bank card or enter the diagonal. Shows the pixel density (PPI) too.",
  },
  lead: {
    ru: "Приложите карту к экрану и подгоните рамку — после этого линейка и предметы на сайте покажут реальный размер.",
    en: "Hold a card to the screen and match the frame — the rulers and objects on this site then show real sizes.",
  },
  keywords: {
    ru: ["калибровка монитора", "масштаб экрана", "ppi экрана", "плотность пикселей", "банковская карта"],
    en: ["calibrate screen size", "screen scale", "screen ppi", "pixel density", "credit card"],
  },
  howTo: {
    ru: [
      "Возьмите банковскую карту или любую карту формата ID-1: права, ID-карту, транспортную.",
      "Приложите её к экрану так, чтобы угол карты совпал с левым верхним углом рамки.",
      "Двигайте ползунок или нажимайте «−» и «+», пока края не совпадут, затем нажмите «Сохранить».",
      "Проверьте результат обычной линейкой по отрезкам 5 см и 2 дюйма внизу страницы.",
    ],
    en: [
      "Take a bank card or any ID-1 card: a driving licence, ID card or transit card.",
      "Hold it against the screen with its corner in the top-left corner of the frame.",
      "Move the slider or press − and + until the edges match, then press Save.",
      "Check the result with a real ruler against the 5 cm and 2 inch lines at the bottom.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему именно банковская карта?",
        a: "Её размер задан стандартом ISO/IEC 7810 ID-1 — 85,60 × 53,98 мм — и одинаков у всех банков мира. Такая карта есть почти у всех, а длина 8,5 см позволяет подогнать масштаб с точностью до долей процента.",
      },
      {
        q: "Когда подходит способ с диагональю?",
        a: "Когда карты нет под рукой, а масштаб браузера 100 %. Сайт берёт разрешение экрана из браузера и делит его на диагональ. На Mac с масштабированным разрешением и на некоторых телефонах браузер сообщает не реальное разрешение матрицы — тогда результат будет неверным.",
      },
      {
        q: "Что такое CSS-пиксель и PPI?",
        a: "CSS-пиксель — единица, в которой браузер рисует страницы; по стандарту их 96 на дюйм. PPI — число реальных точек матрицы на дюйм, оно равно CSS-плотности, умноженной на devicePixelRatio. Калибровка определяет, сколько CSS-пикселей помещается в миллиметре именно на вашем экране.",
      },
      {
        q: "Где хранится калибровка?",
        a: "В localStorage этого браузера: на сервер ничего не отправляется, а настройка действует на всех страницах с реальными размерами. На другом устройстве или в другом браузере калибровку нужно повторить.",
      },
    ],
    en: [
      {
        q: "Why a bank card?",
        a: "Its size is fixed by ISO/IEC 7810 ID-1 — 85.60 × 53.98 mm — and is the same for every bank in the world. Almost everyone has one, and its 8.5 cm length lets you set the scale to a fraction of a percent.",
      },
      {
        q: "When does the diagonal method work?",
        a: "When you have no card at hand and browser zoom is 100%. The site takes the screen resolution from the browser and divides it by the diagonal. On Macs with a scaled resolution and on some phones the browser does not report the real panel resolution, and the result will be wrong.",
      },
      {
        q: "What are CSS pixels and PPI?",
        a: "A CSS pixel is the unit browsers draw pages in; the standard says 96 per inch. PPI is the number of real panel dots per inch, equal to the CSS density times devicePixelRatio. Calibration finds how many CSS pixels fit in a millimetre on your particular screen.",
      },
      {
        q: "Where is the calibration stored?",
        a: "In this browser's localStorage: nothing is sent to a server, and the setting applies to every actual-size page. On another device or browser you need to calibrate again.",
      },
    ],
  },
  about: {
    ru: [
      "Экраны отличаются плотностью пикселей: у монитора 24″ Full HD около 92 точек на дюйм, у смартфона — 400–500. Браузер не сообщает сайтам физический размер экрана, поэтому надёжный способ показать предмет в натуральную величину — измерить масштаб по известному эталону.",
      "Карта формата ID-1 — удобный эталон: 85,60 × 53,98 мм по ISO/IEC 7810. Сохранённая калибровка применяется к линейкам, транспортиру и каталогу предметов, а при смене масштаба браузера сайт предупредит об этом.",
    ],
    en: [
      "Screens differ in pixel density: a 24″ Full HD monitor has about 92 dots per inch, a smartphone 400–500. Browsers don't tell websites the physical size of the screen, so the reliable way to show an object at actual size is to measure the scale against a known reference.",
      "An ID-1 card is a handy reference: 85.60 × 53.98 mm per ISO/IEC 7810. The saved calibration applies to the rulers, the protractor and the object catalogue, and the site warns you when browser zoom changes.",
    ],
  },
  related: ["convert/centimeters-to-inches"],
  popular: true,
};

const rulerTool: ToolDef = {
  slug: "online-ruler",
  component: "actual-size/ruler",
  icon: "Ruler",
  name: { ru: "Линейка онлайн", en: "Online ruler" },
  title: { ru: "Линейка онлайн в сантиметрах — реальный размер, до 100 см", en: "Online ruler in centimeters — actual size, up to 100 cm" },
  h1: { ru: "Линейка онлайн в сантиметрах", en: "Online ruler in centimeters" },
  description: {
    ru: "Линейка на экране в натуральную величину: сантиметры и миллиметры, длина от 10 до 100 см, вторая шкала в дюймах, вертикальный режим для телефона.",
    en: "A ruler on your screen at actual size: centimeters and millimeters, 10 to 100 cm long, an optional inch scale and a vertical mode for phones.",
  },
  lead: {
    ru: "Приложите предмет к экрану — после калибровки деления линейки совпадают с настоящими миллиметрами.",
    en: "Hold an object to the screen — after calibration the ruler marks match real millimeters.",
  },
  keywords: {
    ru: ["линейка", "линейка на экране", "сантиметры", "миллиметры", "измерить"],
    en: ["ruler", "cm ruler", "mm ruler", "measure", "on screen"],
  },
  props: { unit: "cm" },
  howTo: {
    ru: [
      "Откалибруйте экран по банковской карте — кнопка над линейкой.",
      "Приложите предмет к нулю шкалы и посмотрите на деление у другого конца.",
      "Нажмите на линейку, чтобы поставить отметку: под ней появится значение в см, мм и дюймах.",
      "Под результатом можно выбрать длину до 100 см, вертикальное положение (удобно на телефоне) и вторую шкалу в дюймах.",
    ],
    en: [
      "Calibrate the screen with a bank card — the button is above the ruler.",
      "Place the object at zero and read the mark at its other end.",
      "Click the ruler to place a marker: the value in cm, mm and inches appears below.",
      "Below the result you can pick a length up to 100 cm, the vertical mode (handy on phones) and an extra inch scale.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Насколько точна линейка на экране?",
        a: "Точность зависит от калибровки: если рамка подогнана к карте до пикселя, погрешность около 0,3 % — примерно 1 мм на 30 см. Без калибровки линейка рассчитана на 96 ppi и на большинстве экранов будет неверной.",
      },
      {
        q: "Как измерить предмет длиннее экрана?",
        a: "Прокрутите линейку вбок или переключите её в вертикальное положение и прокручивайте страницу. Можно мерить и частями: поставить отметку, сдвинуть предмет и сложить результаты.",
      },
      {
        q: "Зачем увеличение 2× и 4×?",
        a: "Чтобы разглядеть миллиметровые деления на маленьком экране. В увеличенном режиме линейка уже не в натуральную величину — сайт показывает предупреждение.",
      },
      {
        q: "Можно ли видеть сантиметры и дюймы одновременно?",
        a: "Да: включите «Шкала в дюймах», и дюймовые деления появятся вдоль нижнего края линейки.",
      },
    ],
    en: [
      {
        q: "How accurate is an on-screen ruler?",
        a: "It depends on calibration: with the frame matched to the card to the pixel the error is about 0.3% — roughly 1 mm over 30 cm. Without calibration the ruler assumes 96 ppi and is wrong on most screens.",
      },
      {
        q: "How do I measure something longer than the screen?",
        a: "Scroll the ruler sideways, or switch to vertical mode and scroll the page. You can also measure in parts: place a marker, move the object and add up the results.",
      },
      {
        q: "What are 2× and 4× for?",
        a: "To read the millimeter marks on a small screen. A magnified ruler is no longer actual size — the site shows a warning.",
      },
      {
        q: "Can I see centimeters and inches together?",
        a: "Yes: switch on “Inch scale” and inch marks appear along the bottom edge of the ruler.",
      },
    ],
  },
  about: {
    ru: [
      "Онлайн-линейка рисует деления через каждый миллиметр, выделяет полсантиметра и подписывает сантиметры. Длина — от 10 до 100 см, длинная линейка прокручивается. Масштаб берётся из калибровки экрана, общей для всех страниц с реальными размерами.",
      "Отметка на линейке показывает значение в сантиметрах, миллиметрах и дюймах; её можно двигать стрелками с клавиатуры. На телефоне удобнее вертикальный режим: линейка идёт вдоль длинной стороны экрана.",
    ],
    en: [
      "The online ruler draws a mark every millimeter, highlights half-centimeters and labels every centimeter. It is 10 to 100 cm long and scrolls when longer than the screen. The scale comes from the screen calibration shared by every actual-size page.",
      "A marker shows the reading in centimeters, millimeters and inches and can be moved with the arrow keys. On phones the vertical mode is handier: the ruler runs along the long side of the screen.",
    ],
  },
  related: ["convert/centimeters-to-inches", "convert/millimeters-to-inches"],
  popular: true,
};

const inchRulerTool: ToolDef = {
  slug: "inch-ruler",
  component: "actual-size/ruler",
  icon: "Ruler",
  name: { ru: "Линейка в дюймах", en: "Inch ruler" },
  title: { ru: "Линейка в дюймах онлайн — деления 1/16″ в реальном размере", en: "Inch ruler online — actual size with 1/16″ marks" },
  h1: { ru: "Линейка в дюймах онлайн", en: "Online inch ruler" },
  description: {
    ru: "Дюймовая линейка на экране в натуральную величину: деления 1/2, 1/4, 1/8 и 1/16 дюйма, длина до 36″, вторая шкала в сантиметрах. 1 дюйм = 2,54 см.",
    en: "An inch ruler on your screen at actual size: 1/2, 1/4, 1/8 and 1/16 inch marks, up to 36 inches long, with an optional cm scale. 1 inch = 2.54 cm.",
  },
  lead: {
    ru: "Деления через каждые 1/16 дюйма; отметка показывает значение дробью, в десятичных дюймах и сантиметрах.",
    en: "Marks every 1/16 inch; the marker shows the reading as a fraction, in decimal inches and in centimeters.",
  },
  keywords: {
    ru: ["линейка в дюймах", "дюймы", "дюймовая линейка", "1/16 дюйма"],
    en: ["inch ruler", "ruler in inches", "1/16 inch", "measure inches"],
  },
  props: { unit: "in" },
  howTo: {
    ru: [
      "Откалибруйте экран по банковской карте — кнопка над линейкой.",
      "Приложите предмет к нулю шкалы. Самые длинные деления — дюймы, дальше по убыванию: 1/2, 1/4, 1/8 и 1/16.",
      "Нажмите на линейку — отметка покажет, например, «4 5/16″» и то же значение в десятичных дюймах и сантиметрах.",
      "Под результатом можно выбрать длину 6, 12, 24 или 36 дюймов и добавить шкалу в сантиметрах.",
    ],
    en: [
      "Calibrate the screen with a bank card — the button is above the ruler.",
      "Place the object at zero. The longest marks are inches, then 1/2, 1/4, 1/8 and 1/16.",
      "Click the ruler — the marker shows a reading such as “4 5/16″” plus the same value in decimal inches and centimeters.",
      "Below the result you can pick a 6, 12, 24 or 36 inch length and add a centimeter scale.",
    ],
  },
  faq: {
    ru: [
      { q: "Сколько сантиметров в дюйме?", a: "Ровно 2,54 см: с 1959 года дюйм определён как 25,4 мм. Значит, 12 дюймов (фут) — 30,48 см, а 36 дюймов (ярд) — 91,44 см." },
      {
        q: "Как читать дюймовую линейку?",
        a: "Сначала считайте целые дюймы по подписанным делениям, затем самые мелкие деления после них: каждое — 1/16 дюйма. Например, 5 делений после отметки 4 — это 4 5/16″, или около 10,95 см.",
      },
      {
        q: "Насколько точна линейка в дюймах на экране?",
        a: "После калибровки по банковской карте погрешность около 0,3 % — меньше 1/16 дюйма на 12 дюймах. Без калибровки используется стандарт 96 пикселей на дюйм, и на большинстве экранов размер будет неверным.",
      },
    ],
    en: [
      { q: "How many centimeters are in an inch?", a: "Exactly 2.54 cm: since 1959 the inch has been defined as 25.4 mm. So 12 inches (a foot) is 30.48 cm and 36 inches (a yard) is 91.44 cm." },
      {
        q: "How do I read an inch ruler?",
        a: "Count whole inches by the labelled marks, then the smallest marks after them: each one is 1/16 inch. For example, 5 marks after the 4 is 4 5/16″, about 10.95 cm.",
      },
      {
        q: "How accurate is an on-screen inch ruler?",
        a: "After a bank card calibration the error is about 0.3% — less than 1/16 inch over 12 inches. Without calibration the 96 pixels per inch standard is used, which is wrong on most screens.",
      },
    ],
  },
  about: {
    ru: [
      "Дюймовая линейка размечена как американская: деления разной длины для 1/2, 1/4, 1/8 и 1/16 дюйма. Длина — до 36 дюймов (ярд), длинная линейка прокручивается.",
      "Отметка на линейке показывает значение дробью, в десятичных дюймах и в сантиметрах; её можно двигать стрелками по 1/16 дюйма, а с Shift — по целому дюйму. Масштаб задаётся калибровкой экрана.",
    ],
    en: [
      "The inch ruler is marked like an American one: marks of different lengths for 1/2, 1/4, 1/8 and 1/16 inch. It is up to 36 inches (a yard) long and scrolls when longer than the screen.",
      "The marker shows the reading as a fraction, in decimal inches and in centimeters; arrow keys move it by 1/16 inch, or a whole inch with Shift. The scale comes from the screen calibration.",
    ],
  },
  related: ["convert/inches-to-centimeters", "convert/inches-to-millimeters"],
};

const protractorTool: ToolDef = {
  slug: "protractor",
  component: "actual-size/protractor",
  icon: "DraftingCompass",
  name: { ru: "Транспортир онлайн", en: "Online protractor" },
  title: { ru: "Транспортир онлайн — измерить угол на экране", en: "Online protractor — measure an angle on screen" },
  h1: { ru: "Транспортир онлайн", en: "Online protractor" },
  description: {
    ru: "Транспортир на 180° в браузере: двигайте два луча и узнайте угол с шагом до 0,1°, смежный угол и радианы. Работает мышью, пальцем и с клавиатуры.",
    en: "A 180° protractor in your browser: move two arms to read the angle in steps down to 0.1°, plus the supplementary angle and radians. Mouse, touch and keyboard.",
  },
  lead: {
    ru: "Совместите лучи со сторонами угла — его величина появится под транспортиром.",
    en: "Line the arms up with the sides of the angle — its size appears below the protractor.",
  },
  keywords: {
    ru: ["транспортир", "измерить угол", "угломер", "градусы"],
    en: ["protractor", "measure angle", "angle finder", "degrees"],
  },
  howTo: {
    ru: [
      "Совместите центр транспортира с вершиной угла, например приложив предмет или распечатку к экрану.",
      "Перетащите ручку первого луча на одну сторону угла, второго — на другую.",
      "Прочитайте угол под транспортиром; рядом — смежный угол и значение в радианах.",
      "Для точной настройки выберите ручку клавишей Tab и двигайте стрелками с шагом 1°, 0,5° или 0,1°.",
    ],
    en: [
      "Put the centre of the protractor on the vertex of the angle, for example by holding an object or a printout to the screen.",
      "Drag the first arm's handle onto one side of the angle and the second onto the other.",
      "Read the angle below the protractor, along with the supplementary angle and radians.",
      "For fine control, Tab to a handle and use the arrow keys in steps of 1°, 0.5° or 0.1°.",
    ],
  },
  faq: {
    ru: [
      { q: "Нужна ли калибровка для транспортира?", a: "Нет: угол не зависит от масштаба экрана, поэтому транспортир показывает верные градусы и без калибровки." },
      {
        q: "Как измерить угол больше 180°?",
        a: "Измерьте смежный угол до прямой линии и прибавьте 180° или вычтите измеренный угол из 360°. Например, если внутренний угол 120°, внешний — 240°.",
      },
      { q: "Как перевести градусы в радианы?", a: "Умножьте на π/180: 90° = π/2 ≈ 1,5708 рад, 60° ≈ 1,0472 рад. Транспортир показывает радианы автоматически." },
    ],
    en: [
      { q: "Does the protractor need calibration?", a: "No: an angle does not depend on the screen scale, so the protractor shows correct degrees even without calibration." },
      {
        q: "How do I measure an angle larger than 180°?",
        a: "Measure the adjacent angle to a straight line and add 180°, or subtract the measured angle from 360°. For example, if the inner angle is 120°, the outer one is 240°.",
      },
      { q: "How do I convert degrees to radians?", a: "Multiply by π/180: 90° = π/2 ≈ 1.5708 rad, 60° ≈ 1.0472 rad. The protractor shows radians automatically." },
    ],
  },
  about: {
    ru: [
      "Онлайн-транспортир размечен через каждый градус: внешняя шкала идёт от 0° справа, внутренняя — от 0° слева, как у обычного школьного транспортира. Два луча двигаются независимо, угол между ними считается сразу.",
      "Им удобно проверять углы на распечатках и небольших предметах, приложенных к экрану. Для точности до десятой доли градуса выберите шаг 0,1° и управляйте лучами стрелками.",
    ],
    en: [
      "The online protractor is marked every degree: the outer scale starts at 0° on the right and the inner one at 0° on the left, like a school protractor. The two arms move independently and the angle between them updates instantly.",
      "Use it to check angles on printouts and small objects held against the screen. For tenth-of-a-degree precision pick the 0.1° step and move the arms with the arrow keys.",
    ],
  },
  related: ["angle-converter"],
};

const base = defineToolSection({
  id: ID,
  name: { ru: "Реальный размер", en: "Actual size" },
  description: {
    ru: "Линейка онлайн, транспортир и предметы в натуральную величину после калибровки экрана по банковской карте",
    en: "Online ruler, protractor and everyday objects shown at actual size after a quick bank card calibration",
  },
  icon: "Ruler",
  hue: HUE,
  category: "convert",
  order: 4,
  tools: [objectsTool, calibrationTool, rulerTool, inchRulerTool, protractorTool],
});

/* ───────────── chips: same category first, 20–50 per page ───────────── */

const bySlug = new Map(OBJECTS.map((o) => [o.slug, o]));
const POPULAR = OBJECTS.filter((o) => o.popular);

function chip(o: ObjDef, locale: Locale): LinkItem {
  return { path: [ID, o.slug], label: tr(o.chip ?? o.short ?? o.name, locale), hint: tr(o.name, locale) };
}

function toolLink(t: ToolDef, locale: Locale): LinkItem {
  return { path: [t.slug], label: tr(t.name, locale), hint: tr(t.lead ?? t.description, locale), icon: t.icon, hue: HUE };
}

function variantChips(o: ObjDef, locale: Locale): Block[] {
  const same = OBJECTS.filter((x) => x.cat === o.cat && x !== o).slice(0, 50);
  const blocks: Block[] = [{ type: "links", title: tr(CATS[o.cat].more, locale), style: "chips", items: same.map((x) => chip(x, locale)) }];
  if (same.length < 20) {
    const fill = POPULAR.filter((x) => x.cat !== o.cat).slice(0, 24 - same.length);
    blocks.push({ type: "links", title: locale === "ru" ? "Популярные предметы в натуральную величину" : "Popular objects at actual size", style: "chips", items: fill.map((x) => chip(x, locale)) });
  }
  return blocks;
}

function catalogueBlocks(locale: Locale): Block[] {
  return CAT_IDS.map((id) => ({
    type: "links" as const,
    title: tr(CATS[id].name, locale),
    style: "chips" as const,
    items: OBJECTS.filter((o) => o.cat === id).map((o) => chip(o, locale)),
  }));
}

export const actualSizeSection: SectionDef = {
  ...base,
  resolve(locale, segs) {
    const page: PageModel | null = base.resolve(locale, segs);
    if (!page || page.path[0] !== ID) return page;
    if (page.kind === "tool") return { ...page, topBlocks: catalogueBlocks(locale) };
    if (page.kind === "variant") {
      const o = bySlug.get(page.path[1]);
      if (!o) return page;
      const extra = [calibrationTool, rulerTool].map((t) => toolLink(t, locale));
      const seen = new Set((page.related ?? []).map((r) => r.path.join("/")));
      return {
        ...page,
        topBlocks: variantChips(o, locale),
        related: [...(page.related ?? []), ...extra.filter((l) => !seen.has(l.path.join("/")))].slice(0, 8),
      };
    }
    return page;
  },
};

