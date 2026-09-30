import type { L10n, Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import type { Block, QA, VariantDef } from "@/registry/types";
import { MM_PER_INCH } from "./calibration";
import { byCat, OBJECTS, toClient, type CatId, type ObjDef } from "./objects";
import { DEVICE_SHAPES, ROUND_SHAPES, type ClientObj } from "./types";

/* ───────────── categories ───────────── */

export const CATS: Record<CatId, { name: L10n; more: L10n }> = {
  cards: { name: { ru: "Карты и документы", en: "Cards and documents" }, more: { ru: "Другие карты и документы", en: "More cards and documents" } },
  photos: { name: { ru: "Фото", en: "Photos" }, more: { ru: "Другие форматы фото", en: "More photo sizes" } },
  paper: { name: { ru: "Бумага и конверты", en: "Paper and envelopes" }, more: { ru: "Другие форматы бумаги", en: "More paper sizes" } },
  coins: { name: { ru: "Монеты", en: "Coins" }, more: { ru: "Другие монеты", en: "More coins" } },
  banknotes: { name: { ru: "Банкноты", en: "Banknotes" }, more: { ru: "Другие банкноты", en: "More banknotes" } },
  batteries: { name: { ru: "Батарейки и аккумуляторы", en: "Batteries" }, more: { ru: "Другие батарейки", en: "More batteries" } },
  connectors: { name: { ru: "Разъёмы и штекеры", en: "Connectors and plugs" }, more: { ru: "Другие разъёмы", en: "More connectors" } },
  iphone: { name: same("iPhone"), more: { ru: "Другие iPhone", en: "More iPhones" } },
  android: { name: { ru: "Samsung Galaxy и Google Pixel", en: "Samsung Galaxy and Google Pixel" }, more: { ru: "Другие смартфоны Samsung и Pixel", en: "More Samsung and Pixel phones" } },
  gadgets: { name: { ru: "Планшеты, часы и гаджеты", en: "Tablets, watches and gadgets" }, more: { ru: "Другие планшеты, часы и гаджеты", en: "More tablets, watches and gadgets" } },
  things: { name: { ru: "Разные предметы", en: "Everyday things" }, more: { ru: "Другие предметы", en: "More everyday things" } },
};

function same(s: string): L10n {
  return { ru: s, en: s };
}

const GROUPS: Record<string, L10n> = {
  "cards:id": { ru: "Документы ID-1 и ID-3", en: "ID-1 and ID-3 documents" },
  "cards:sim": { ru: "SIM-карты", en: "SIM cards" },
  "cards:memory": { ru: "Карты памяти", en: "Memory cards" },
  "cards:business": { ru: "Визитки", en: "Business cards" },
  "cards:playing": { ru: "Игральные карты", en: "Playing cards" },
  "photos:doc": { ru: "Фото на документы", en: "ID photos" },
  "photos:print": { ru: "Форматы фотопечати", en: "Photo print sizes" },
  "photos:instant": { ru: "Моментальные снимки", en: "Instant photos" },
  "paper:a": { ru: "Форматы A (ISO 216)", en: "A sizes (ISO 216)" },
  "paper:b": { ru: "Форматы B (ISO 216)", en: "B sizes (ISO 216)" },
  "paper:us": { ru: "Американские форматы", en: "US paper sizes" },
  "paper:env": { ru: "Конверты", en: "Envelopes" },
  "coins:kzt": { ru: "Монеты Казахстана", en: "Coins of Kazakhstan" },
  "coins:rub": { ru: "Монеты России", en: "Coins of Russia" },
  "coins:eur": { ru: "Монеты евро", en: "Euro coins" },
  "coins:usd": { ru: "Монеты США", en: "US coins" },
  "banknotes:eur": { ru: "Банкноты евро", en: "Euro banknotes" },
  "banknotes:rub": { ru: "Банкноты России", en: "Russian banknotes" },
  "batteries:cyl": { ru: "Цилиндрические и 9V", en: "Cylindrical and 9V" },
  "batteries:li-ion": { ru: "Литий-ионные аккумуляторы", en: "Lithium-ion cells" },
  "batteries:coin-cell": { ru: "Литиевые таблетки CR", en: "CR lithium coin cells" },
  "batteries:button": { ru: "Батарейки-таблетки 1,5 В", en: "1.5 V button cells" },
  "connectors:usb": { ru: "USB и Lightning", en: "USB and Lightning" },
  "connectors:video": same("HDMI"),
  "connectors:audio": { ru: "Аудиоразъёмы", en: "Audio jacks" },
  "iphone:home": { ru: "iPhone с кнопкой «Домой»", en: "iPhones with a Home button" },
  "iphone:x": same("iPhone X, XR, XS Max"),
  "gadgets:ipad": same("iPad"),
  "gadgets:tablet": { ru: "Планшеты и ридеры", en: "Tablets and e-readers" },
  "gadgets:watch": { ru: "Умные часы", en: "Smartwatches" },
  "gadgets:audio": same("AirPods, AirTag"),
  "gadgets:console": { ru: "Игровые консоли", en: "Game consoles" },
  "things:lego": same("LEGO"),
  "things:postit": { ru: "Стикеры Post-it", en: "Post-it notes" },
  "things:media": { ru: "Диски и носители", en: "Discs and media" },
  "things:ball": { ru: "Мячи, шары и шайба", en: "Balls and pucks" },
};

function groupName(o: ObjDef): L10n {
  const g = GROUPS[`${o.cat}:${o.group}`];
  if (g) return g;
  if (o.cat === "iphone") return same(`iPhone ${o.group}`);
  if (o.cat === "android") {
    if (o.group === "a") return same("Galaxy A");
    if (o.group === "pixel") return same("Google Pixel");
    if (o.group === "pixel-a") return same("Google Pixel a");
    return same(`Galaxy ${o.group.toUpperCase()}`);
  }
  return CATS[o.cat].name;
}

/* ───────────── formatting ───────────── */

const DEVICE = DEVICE_SHAPES;
const n2 = (locale: Locale, v: number) => formatNumber(locale, v, { maximumFractionDigits: 2 });
const mmU = (l: Locale) => (l === "ru" ? "мм" : "mm");
const cmU = (l: Locale) => (l === "ru" ? "см" : "cm");
const inU = (l: Locale, last: number) => (l === "ru" ? plural("ru", last, ["дюйм", "дюйма", "дюймов", "дюйма"]) : "in");

/** Sides in the conventional order: devices height × width, everything else width × height. */
function sides(o: ObjDef): [number, number] {
  return DEVICE.has(o.shape) ? [o.h, o.w] : [o.w, o.h];
}

/** "85,6 × 53,98 мм", "⌀ 23,25 мм", "⌀ 14,5 × 50,5 мм"; `withD` adds the thickness. */
export function dimsText(o: ObjDef, locale: Locale, unit: "mm" | "cm" | "in" = "mm", withD = false): string {
  const k = unit === "mm" ? 1 : unit === "cm" ? 10 : MM_PER_INCH;
  let nums: number[];
  if (ROUND_SHAPES.has(o.shape)) nums = withD && o.d ? [o.w, o.d] : [o.w];
  else if (o.shape === "battery") nums = [o.w, o.h];
  else nums = withD && o.d ? [...sides(o), o.d] : sides(o);
  const vals = nums.map((v) => Math.round((v / k) * 100) / 100);
  const u = unit === "mm" ? mmU(locale) : unit === "cm" ? cmU(locale) : inU(locale, vals[vals.length - 1]);
  const body = vals.map((v) => n2(locale, v)).join(" × ");
  return ROUND_SHAPES.has(o.shape) || o.shape === "battery" ? `⌀ ${body} ${u}` : `${body} ${u}`;
}

const lowerFirst = (s: string) => (/^[А-ЯЁ]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const latinStart = (s: string) => /^[A-Za-z]/.test(s);

function fitParts(parts: (string | false | undefined)[], max = 160): string {
  let out = "";
  for (const p of parts) {
    if (!p) continue;
    const next = out ? `${out} ${p}` : p;
    if (next.length <= max) out = next;
  }
  return out;
}

function firstSentence(s: string): string {
  const i = s.search(/[.!?](\s|$)/);
  return i === -1 ? s : s.slice(0, i + 1);
}

/* ───────────── per-object texts ───────────── */

function titleOf(o: ObjDef, locale: Locale): string {
  const name = (o.short ?? o.name)[locale];
  const dims = dimsText(o, locale);
  if (locale === "ru") {
    const device = latinStart(name) && (o.cat === "iphone" || o.cat === "android" || o.cat === "gadgets");
    const base = device ? `Размер ${name} в натуральную величину` : `${name} в реальном размере`;
    const full = `${base} — ${dims}`;
    return !o.named && full.length <= 62 ? full : base;
  }
  const full = `${name} actual size — ${dims}`;
  return !o.named && full.length <= 62 ? full : `${name} actual size on screen`;
}

function h1Of(o: ObjDef, locale: Locale): string {
  const name = o.name[locale];
  if (locale === "ru") {
    const device = latinStart(name) && (o.cat === "iphone" || o.cat === "android" || o.cat === "gadgets");
    return device ? `Размер ${name} в натуральную величину` : `${name} в натуральную величину`;
  }
  return `${name} actual size`;
}

function extraFact(o: ObjDef, locale: Locale): string | undefined {
  const ru = locale === "ru";
  if (o.diag && o.year) return ru ? `Экран ${n2(locale, o.diag)}″, ${o.year} год.` : `${n2(locale, o.diag)}″ display, released in ${o.year}.`;
  if (o.diag) return ru ? `Экран ${n2(locale, o.diag)}″.` : `${n2(locale, o.diag)}″ display.`;
  if (o.mass && o.material) return ru ? `Масса ${n2(locale, o.mass)} г, ${o.material.ru}.` : `${n2(locale, o.mass)} g, ${o.material.en}.`;
  if (o.note) return firstSentence(o.note[locale]);
  if (o.std) return ru ? `Стандарт ${o.std}.` : `Standard: ${o.std}.`;
  return undefined;
}

function descriptionOf(o: ObjDef, locale: Locale): string {
  const name = o.name[locale];
  const ru = locale === "ru";
  const thick = o.d && !ROUND_SHAPES.has(o.shape) ? dimsText(o, locale, "mm", true) : dimsText(o, locale);
  const lead = ru ? `${name} в натуральную величину на экране: ${thick}.` : `See the ${name} at actual size on screen: ${thick}.`;
  return fitParts(
    ru
      ? [lead, extraFact(o, locale), "Точный масштаб после калибровки по банковской карте.", "Размеры в см и дюймах.", "Сравнение с похожими предметами."]
      : [lead, extraFact(o, locale), "Exact scale after a quick bank card calibration.", "Sizes in cm and inches.", "Compare with similar objects."],
  );
}

function leadOf(o: ObjDef, locale: Locale): string {
  return `${o.name[locale]}: ${dimsText(o, locale)} (${dimsText(o, locale, "cm")}; ${dimsText(o, locale, "in")}).`;
}

function factsBlock(o: ObjDef, locale: Locale): Block {
  const ru = locale === "ru";
  const row = (mm: number): string => `${n2(locale, mm)} ${mmU(locale)} · ${n2(locale, mm / 10)} ${cmU(locale)} · ${n2(locale, mm / MM_PER_INCH)}″`;
  const rows: [string, string][] = [];
  if (ROUND_SHAPES.has(o.shape)) {
    rows.push([ru ? "Диаметр" : "Diameter", row(o.w)]);
    if (o.d) rows.push([o.shape === "airtag" || o.shape === "puck" ? (ru ? "Высота" : "Height") : ru ? "Толщина" : "Thickness", row(o.d)]);
  } else if (o.shape === "battery") {
    rows.push([ru ? "Диаметр" : "Diameter", row(o.w)], [ru ? "Длина" : "Length", row(o.h)]);
  } else {
    const device = DEVICE.has(o.shape);
    const first: [string, number] = device ? [ru ? "Высота" : "Height", o.h] : [ru ? "Ширина" : "Width", o.w];
    const second: [string, number] = device ? [ru ? "Ширина" : "Width", o.w] : [ru ? "Высота" : "Height", o.h];
    rows.push([first[0], row(first[1])], [second[0], row(second[1])]);
    if (o.d) rows.push([ru ? "Толщина" : "Thickness", row(o.d)]);
  }
  if (o.diag) rows.push([ru ? "Диагональ экрана" : "Screen diagonal", `${n2(locale, o.diag)}″ (${n2(locale, o.diag * 2.54)} ${cmU(locale)})`]);
  if (o.year) rows.push([ru ? "Год выхода" : "Released", String(o.year)]);
  if (o.mass) rows.push([ru ? "Масса" : "Mass", `${n2(locale, o.mass)} ${ru ? "г" : "g"}`]);
  if (o.material) rows.push([ru ? "Материал" : "Material", o.material[locale]]);
  if (o.std) rows.push([ru ? "Стандарт" : "Standard", o.std]);
  if (o.src) rows.push([ru ? "Источник размеров" : "Source of dimensions", o.src[locale]]);
  if (o.note) rows.push([ru ? "Важно знать" : "Good to know", o.note[locale]]);
  return { type: "facts", title: ru ? "Размеры и факты" : "Dimensions and facts", rows };
}

/** Objects to compare with: the same group, or the nearest-sized objects of the category. */
function peers(o: ObjDef): { list: ObjDef[]; title: L10n } {
  const group = OBJECTS.filter((x) => x.cat === o.cat && x.group === o.group);
  if (group.length >= 3) return { list: group, title: groupName(o) };
  const area = (x: ObjDef) => x.w * x.h;
  const list = byCat(o.cat)
    .slice()
    .sort((a, b) => Math.abs(Math.log(area(a) / area(o))) - Math.abs(Math.log(area(b) / area(o))))
    .slice(0, 10);
  return { list, title: CATS[o.cat].name };
}

function compareBlock(o: ObjDef, locale: Locale): Block | null {
  const { list, title } = peers(o);
  if (list.length < 2) return null;
  const ru = locale === "ru";
  const g = title[locale];
  const hasD = list.some((x) => x.d);
  const head = [ru ? "Предмет" : "Object", ru ? "Размер" : "Size"];
  if (hasD) head.push(ru ? "Толщина" : "Thickness");
  head.push(ru ? "В дюймах" : "In inches");
  return {
    type: "table",
    title: ru ? `Сравнение размеров: ${lowerFirst(g)}` : `Size comparison: ${g}`,
    head,
    rows: list.map((x) => {
      const row = [x === o ? `${(x.short ?? x.name)[locale]} ${ru ? "(эта страница)" : "(this page)"}` : (x.short ?? x.name)[locale], dimsText(x, locale)];
      if (hasD) row.push(x.d ? `${n2(locale, x.d)} ${mmU(locale)}` : "—");
      row.push(dimsText(x, locale, "in"));
      return row;
    }),
  };
}

function catFaq(o: ObjDef, locale: Locale): QA | null {
  const ru = locale === "ru";
  const name = o.name[locale];
  const dims = dimsText(o, locale);
  switch (o.cat) {
    case "cards":
      if (o.group === "sim")
        return ru
          ? { q: "Можно ли вставить nano-SIM в слот micro-SIM или mini-SIM?", a: "Да, через пластиковый переходник: у всех трёх форматов одинаковая контактная площадка, отличается только размер пластика вокруг неё." }
          : { q: "Can a nano-SIM go into a micro-SIM or mini-SIM slot?", a: "Yes, with a plastic adapter: all three formats share the same contact pad and differ only in the plastic around it." };
      if (o.group === "memory")
        return ru
          ? { q: "Подойдёт ли microSD вместо SD?", a: "Да, через переходник microSD → SD. Обратно нельзя: карта SD (24 × 32 мм) не влезет в слот microSD (11 × 15 мм)." }
          : { q: "Can a microSD card replace an SD card?", a: "Yes, with a microSD-to-SD adapter. Not the other way round: an SD card (24 × 32 mm) won't fit a microSD slot (11 × 15 mm)." };
      return ru
        ? { q: "Подойдёт ли для калибровки экрана любая пластиковая карта?", a: "Только формата ID-1 — 85,6 × 53,98 мм: банковские, транспортные и скидочные карты, водительские права, ID-карты. Визитки и SIM-карты другого размера и для калибровки не годятся." }
        : { q: "Can any plastic card be used to calibrate the screen?", a: "Only ID-1 cards — 85.6 × 53.98 mm: bank, transit and loyalty cards, driving licences, ID cards. Business cards and SIM cards have other sizes and won't work." };
    case "photos":
      return ru
        ? { q: "Как проверить, что фото нужного размера?", a: `Приложите отпечаток к экрану после калибровки или измерьте линейкой: ${lowerFirst(name)} — ${dims}. Требования к размеру головы и фону зависят от документа — уточняйте их у ведомства, которое его выдаёт.` }
        : { q: "How do I check a photo has the right size?", a: `Hold the print against the calibrated screen or measure it with a ruler: the ${name} is ${dims}. Head size and background rules depend on the document — check them with the issuing authority.` };
    case "paper":
      return ru
        ? { q: "Можно ли увидеть лист целиком?", a: "Лист показан в натуральную величину: если он больше экрана, прокрутите страницу или поверните его на 90°. Переключатель «Уместить в окно» показывает уменьшенную копию, но это уже не реальный размер." }
        : { q: "Can I see the whole sheet at once?", a: "The sheet is drawn at actual size: if it is larger than your screen, scroll or rotate it 90°. “Fit to window” shows a scaled-down copy, which is no longer actual size." };
    case "coins":
      return ru
        ? { q: "Можно ли измерить монету по экрану?", a: `Да: после калибровки положите монету на круг — диаметры должны совпасть (${dims}). Для проверки подлинности это не годится: точность экрана ограничена размером пикселя, около 0,1–0,3 мм.` }
        : { q: "Can I measure a coin on the screen?", a: `Yes: after calibration place the coin on the circle and the diameters should match (${dims}). It is not good enough to spot fakes: screen accuracy is limited by the pixel size, about 0.1–0.3 mm.` };
    case "banknotes":
      if (o.group === "usd")
        return ru
          ? { q: "Все ли купюры доллара одного размера?", a: "Да, все номиналы от 1 до 100 долларов имеют размер 156 × 66 мм, поэтому различать их приходится по рисунку и цифрам." }
          : { q: "Are all US dollar bills the same size?", a: "Yes, every denomination from $1 to $100 measures 156 × 66 mm, so they are told apart by design and numerals only." };
      if (o.group === "eur")
        return ru
          ? { q: "Почему банкноты евро разного размера?", a: "Чем больше номинал, тем длиннее банкнота: от 120 мм у 5 евро до 160 мм у 500 евро. Так их легче различать, в том числе незрячим людям." }
          : { q: "Why are euro banknotes different sizes?", a: "The higher the value, the longer the note: from 120 mm for €5 to 160 mm for €500. This makes them easier to tell apart, including for blind people." };
      return ru
        ? { q: "Какие размеры у банкнот рубля?", a: "Банкноты 10, 50, 100, 200, 500 и 2000 рублей — 150 × 65 мм, а 1000 и 5000 рублей крупнее — 157 × 69 мм." }
        : { q: "What sizes are Russian ruble banknotes?", a: "The 10, 50, 100, 200, 500 and 2000 ruble notes are 150 × 65 mm; the 1000 and 5000 ruble notes are larger at 157 × 69 mm." };
    case "batteries":
      if (o.group === "coin-cell")
        return ru
          ? { q: "Как расшифровать маркировку CR2032?", a: "CR — литиевая батарейка 3 В, первые две цифры — диаметр в миллиметрах, последние две — толщина в десятых долях миллиметра: CR2032 — 20 × 3,2 мм, CR2016 — 20 × 1,6 мм. У CR1220 и CR2450 диаметр в названии округлён: на деле 12,5 и 24,5 мм." }
          : { q: "What does CR2032 mean?", a: "CR is a 3 V lithium cell; the first two digits are the diameter in millimetres and the last two the thickness in tenths of a millimetre: CR2032 is 20 × 3.2 mm, CR2016 is 20 × 1.6 mm. For the CR1220 and CR2450 the name rounds the diameter down: they are really 12.5 and 24.5 mm." };
      return ru
        ? { q: "Как определить типоразмер батарейки?", a: `Измерьте диаметр и длину (у таблеток — толщину) и сравните с таблицей выше: ${lowerFirst(name)} — ${dims}. Можно просто приложить батарейку к экрану после калибровки.` }
        : { q: "How do I identify a battery size?", a: `Measure the diameter and length (thickness for button cells) and compare with the table above: the ${name} is ${dims}. Or hold the battery against the calibrated screen.` };
    case "connectors":
      return ru
        ? { q: "Как понять, какой разъём у устройства?", a: `Приложите штекер или сравните гнездо с контуром на экране после калибровки: ${lowerFirst(name)} — ${dims}. Гнездо в устройстве всегда немного больше штекера.` }
        : { q: "How can I tell which connector a device has?", a: `Hold the plug to the calibrated screen or compare the socket with the outline: the ${name} is ${dims}. The socket in a device is always slightly larger than the plug.` };
    case "iphone":
    case "android":
      return ru
        ? { q: "Подойдёт ли чехол от другой модели?", a: "Указаны размеры корпуса без чехла по официальным характеристикам. Даже при совпадении размеров чехол может не подойти из-за камер и кнопок — сравните модели в таблице выше." }
        : { q: "Will a case for another model fit?", a: "These are official body dimensions without a case. Even when sizes match, a case may not fit because of the camera and buttons — compare models in the table above." };
    case "gadgets":
      return ru
        ? { q: "Размеры указаны с ремешком или чехлом?", a: "Нет, это размеры корпуса по данным производителя: у часов — без ремешка и колёсика, у планшетов — без чехла и клавиатуры." }
        : { q: "Do the sizes include the band or case?", a: "No, these are manufacturer body dimensions: watches without the band and crown, tablets without a case or keyboard." };
    case "things":
      return ru
        ? { q: "Насколько точен размер на экране?", a: "После калибровки по банковской карте погрешность — около 0,3 % плюс размер одного пикселя (0,1–0,3 мм). Без калибровки размер рассчитан на стандарт 96 ppi и может отличаться в полтора-два раза." }
        : { q: "How accurate is the size on screen?", a: "After a bank card calibration the error is about 0.3% plus one pixel (0.1–0.3 mm). Without calibration the size assumes the 96 ppi standard and can be off by a factor of 1.5–2." };
  }
}

function faqOf(o: ObjDef, locale: Locale): QA[] {
  const ru = locale === "ru";
  const name = o.name[locale];
  const d = o.d && !ROUND_SHAPES.has(o.shape) ? (ru ? ` Толщина — ${n2(locale, o.d)} мм.` : ` Thickness: ${n2(locale, o.d)} mm.`) : "";
  const out: QA[] = [
    ru
      ? { q: `Какого размера ${lowerFirst(name)}?`, a: `${name}: ${dimsText(o, locale)} — это ${dimsText(o, locale, "cm")}, или ${dimsText(o, locale, "in")}.${d}` }
      : { q: `What are the dimensions of the ${name}?`, a: `The ${name} measures ${dimsText(o, locale)}, which is ${dimsText(o, locale, "cm")} or ${dimsText(o, locale, "in")}.${d}` },
    ru
      ? {
          q: `${name} на экране: как добиться реального размера?`,
          a: "Один раз откалибруйте экран: нажмите «Откалибровать», приложите банковскую карту к рамке и подгоните её ползунком. Настройка сохранится в браузере, и все предметы на сайте будут в натуральную величину. Без калибровки используется стандарт 96 ppi — на телефонах размер заметно отличается.",
        }
      : {
          q: `How do I see the ${name} at actual size on my screen?`,
          a: "Calibrate your screen once: press Calibrate, hold a bank card against the frame and adjust it with the slider. The setting is saved in your browser and every object on the site is then shown at actual size. Without calibration the 96 ppi standard is used, which is noticeably off on phones.",
        },
  ];
  const extra = catFaq(o, locale);
  if (extra) out.push(extra);
  return out;
}

/* ───────────── variants ───────────── */

/** Objects offered in "Compare with" on every page. */
const REF_SLUGS = ["bank-card", "10-tenge", "5-rubles", "1-euro", "us-quarter", "aa", "iphone-16", "a4"];

export function refObjects(): ClientObj[] {
  return REF_SLUGS.map((s) => OBJECTS.find((o) => o.slug === s)!).map((o) => toClient(o));
}

export function objectVariants(): VariantDef[] {
  const refs = refObjects();
  const catItems = new Map<CatId, ClientObj[]>();
  for (const o of OBJECTS) {
    const list = catItems.get(o.cat) ?? [];
    list.push(toClient(o));
    catItems.set(o.cat, list);
  }
  return OBJECTS.map((o) => ({
    slug: o.slug,
    name: o.chip ?? o.short ?? o.name,
    title: { ru: titleOf(o, "ru"), en: titleOf(o, "en") },
    h1: { ru: h1Of(o, "ru"), en: h1Of(o, "en") },
    description: { ru: descriptionOf(o, "ru"), en: descriptionOf(o, "en") },
    lead: { ru: leadOf(o, "ru"), en: leadOf(o, "en") },
    props: { items: catItems.get(o.cat), initial: o.slug, fixed: true, refs },
    keywords: {
      ru: [o.name.ru, o.short?.ru ?? "", "реальный размер", "натуральная величина", "размер в мм", CATS[o.cat].name.ru],
      en: [o.name.en, o.short?.en ?? "", "actual size", "real size", "dimensions in mm", CATS[o.cat].name.en],
    },
    blocks: (locale: Locale) => {
      const out: Block[] = [factsBlock(o, locale)];
      const cmp = compareBlock(o, locale);
      if (cmp) out.push(cmp);
      return out;
    },
    faq: { ru: faqOf(o, "ru"), en: faqOf(o, "en") },
  }));
}
