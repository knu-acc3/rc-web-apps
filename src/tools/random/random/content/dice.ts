import type { L10n, Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { diceDistribution, diceStats, gcd, parseDice, ratio, type DiceExpr } from "../lib/dice";
import { L, num, pct } from "./common";

interface DicePreset {
  slug: string;
  notation: string;
  glyph: string;
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  note: L10n;
  faq: Record<Locale, QA>;
}

const PRESETS: DicePreset[] = [
  {
    slug: "d4",
    notation: "1d4",
    glyph: "🔺",
    name: { ru: "d4", en: "d4" },
    title: { ru: "Кубик d4 онлайн — бросить четырёхгранник", en: "D4 Dice Roller — roll a four-sided die online" },
    h1: { ru: "Кубик d4 онлайн", en: "D4 dice roller" },
    description: {
      ru: "Бросить кубик d4 онлайн: четыре грани от 1 до 4, шанс каждой 25 %, среднее 2,5. Можно бросить несколько d4 сразу и прибавить модификатор, например 1d4+1.",
      en: "Roll a d4 online: four faces from 1 to 4, each with a 25% chance and an average of 2.5. Roll several d4 at once and add a modifier such as 1d4+1.",
    },
    lead: { ru: "Четырёхгранный кубик: результат от 1 до 4, у каждой грани шанс 25 %.", en: "Four-sided die: a result from 1 to 4, each face with a 25% chance." },
    note: {
      ru: "d4 — пирамидка из набора кубиков для настольных ролевых игр. В D&D им бросают урон кинжала и заклинания «Волшебная стрела» (1d4+1).",
      en: "The d4 is the pyramid of a tabletop RPG dice set. In D&D it rolls dagger damage and the Magic Missile spell (1d4+1).",
    },
    faq: {
      ru: { q: "Как бросить 1d4+1?", a: "Впишите «1d4+1» в поле формулы и нажмите «Бросить»: результат будет от 2 до 5, каждое значение с шансом 25 %." },
      en: { q: "How do I roll 1d4+1?", a: "Type “1d4+1” in the formula field and press Roll: you get 2 to 5, each value with a 25% chance." },
    },
  },
  {
    slug: "d6",
    notation: "1d6",
    glyph: "🎲",
    name: { ru: "d6", en: "d6" },
    title: { ru: "Кубик d6 онлайн — бросить шестигранный кубик", en: "Roll a D6 — six-sided dice roller online" },
    h1: { ru: "Шестигранный кубик d6 онлайн", en: "Roll a d6 online" },
    description: {
      ru: "Бросить обычный игральный кубик онлайн: шесть граней от 1 до 6, шанс каждой 1/6 ≈ 16,7 %, среднее 3,5. Кубик рисуется точками, как настоящий.",
      en: "Roll a standard six-sided die online: faces 1 to 6, each with a 1/6 ≈ 16.7% chance and an average of 3.5. The result is drawn with pips like a real die.",
    },
    lead: { ru: "Обычная игральная кость: от 1 до 6, у каждой грани шанс 1/6.", en: "A standard die: 1 to 6, each face with a 1/6 chance." },
    note: {
      ru: "Шестигранник — самый распространённый кубик: его используют в «Монополии», нардах, «Колонизаторах» и сотнях других игр. Потерялся кубик из коробки — бросайте здесь.",
      en: "The six-sided die is the most common one: Monopoly, backgammon, Catan and hundreds of other games use it. Lost the die from the box? Roll it here.",
    },
    faq: {
      ru: { q: "Какова вероятность выбросить шестёрку?", a: "1/6 ≈ 16,7 %. Шанс хотя бы одной шестёрки за четыре броска — 1 − (5/6)⁴ ≈ 51,8 %." },
      en: { q: "What are the odds of rolling a six?", a: "1/6 ≈ 16.7%. The chance of at least one six in four rolls is 1 − (5/6)⁴ ≈ 51.8%." },
    },
  },
  {
    slug: "d8",
    notation: "1d8",
    glyph: "🔷",
    name: { ru: "d8", en: "d8" },
    title: { ru: "Кубик d8 онлайн — восьмигранный кубик", en: "D8 Dice Roller — roll an eight-sided die" },
    h1: { ru: "Кубик d8 онлайн", en: "D8 dice roller" },
    description: {
      ru: "Бросить кубик d8 онлайн: восемь граней от 1 до 8, шанс каждой 12,5 %, среднее 4,5. Для урона длинного меча и других бросков в настольных ролевых играх.",
      en: "Roll a d8 online: eight faces from 1 to 8, each with a 12.5% chance and an average of 4.5. For longsword damage and other rolls in tabletop role-playing games.",
    },
    lead: { ru: "Восьмигранный кубик: от 1 до 8, у каждой грани шанс 12,5 %.", en: "Eight-sided die: 1 to 8, each face with a 12.5% chance." },
    note: {
      ru: "В D&D d8 — урон длинного меча (1d8) и кость хитов барда, жреца и плута. Два d8 с модификатором записываются как 2d8+3.",
      en: "In D&D the d8 rolls longsword damage (1d8) and is the hit die of bards, clerics and rogues. Two d8 with a modifier are written 2d8+3.",
    },
    faq: {
      ru: { q: "Как бросить 2d8+3?", a: "Впишите «2d8+3» в поле формулы. Сумма будет от 5 до 19, в среднем 12." },
      en: { q: "How do I roll 2d8+3?", a: "Type “2d8+3” in the formula field. The total ranges from 5 to 19 with an average of 12." },
    },
  },
  {
    slug: "d10",
    notation: "1d10",
    glyph: "🔟",
    name: { ru: "d10", en: "d10" },
    title: { ru: "Кубик d10 онлайн — десятигранный кубик", en: "D10 Dice Roller — roll a ten-sided die" },
    h1: { ru: "Кубик d10 онлайн", en: "D10 dice roller" },
    description: {
      ru: "Бросить кубик d10 онлайн: десять граней от 1 до 10, шанс каждой 10 %, среднее 5,5. Можно бросить сразу несколько d10 и сложить их с модификатором.",
      en: "Roll a d10 online: ten faces from 1 to 10, each with a 10% chance and an average of 5.5. Roll several d10 at once and add them up with a modifier.",
    },
    lead: { ru: "Десятигранный кубик: от 1 до 10, у каждой грани шанс 10 %.", en: "Ten-sided die: 1 to 10, each face with a 10% chance." },
    note: {
      ru: "d10 — основной кубик ролевых систем вроде «Мира Тьмы». Пара d10 (десятки и единицы) заменяет процентный кубик d100.",
      en: "The d10 is the core die of systems such as World of Darkness. A pair of d10 (tens and units) replaces the percentile d100.",
    },
    faq: {
      ru: { q: "На настоящем d10 есть грань «0» — здесь тоже?", a: "Нет, здесь результат всегда от 1 до 10: ноль на физическом кубике как раз означает 10." },
      en: { q: "A real d10 has a “0” face — does this one?", a: "No, results here are always 1 to 10: the 0 on a physical d10 means 10 anyway." },
    },
  },
  {
    slug: "d12",
    notation: "1d12",
    glyph: "🕛",
    name: { ru: "d12", en: "d12" },
    title: { ru: "Кубик d12 онлайн — двенадцатигранный кубик", en: "D12 Dice Roller — roll a twelve-sided die" },
    h1: { ru: "Кубик d12 онлайн", en: "D12 dice roller" },
    description: {
      ru: "Бросить кубик d12 онлайн: двенадцать граней от 1 до 12, шанс каждой 1/12 ≈ 8,3 %, среднее 6,5. Для ролевых игр, случайного месяца или часа на циферблате.",
      en: "Roll a d12 online: twelve faces from 1 to 12, each with a 1/12 ≈ 8.3% chance and an average of 6.5. For role-playing games or a random month or hour.",
    },
    lead: { ru: "Двенадцатигранный кубик: от 1 до 12, у каждой грани шанс 1/12.", en: "Twelve-sided die: 1 to 12, each face with a 1/12 chance." },
    note: {
      ru: "В D&D d12 — урон секиры и кость хитов варвара. Вне ролевых игр им удобно выбирать случайный месяц года.",
      en: "In D&D the d12 rolls greataxe damage and is the barbarian's hit die. Outside RPGs it's handy for picking a random month.",
    },
    faq: {
      ru: { q: "Чем d12 отличается от 2d6?", a: "d12 даёт каждое число от 1 до 12 с равным шансом. Сумма 2d6 — от 2 до 12, и средние значения выпадают гораздо чаще крайних." },
      en: { q: "How is a d12 different from 2d6?", a: "A d12 gives every number from 1 to 12 equally often. 2d6 sums range from 2 to 12, and middle totals come up far more often than the extremes." },
    },
  },
  {
    slug: "d20",
    notation: "1d20",
    glyph: "🐉",
    name: { ru: "d20", en: "d20" },
    title: { ru: "Кубик d20 онлайн — бросить двадцатигранник для D&D", en: "Roll a D20 — twenty-sided dice roller for D&D" },
    h1: { ru: "Кубик d20 онлайн", en: "Roll a d20 online" },
    description: {
      ru: "Бросить кубик d20 онлайн: грани от 1 до 20, шанс каждой 5 %, в том числе «натуральной 20». Таблица шансов выбросить не меньше нужного числа для проверок.",
      en: "Roll a d20 online: faces 1 to 20, each with a 5% chance — natural 20 included. See the exact chance to roll at least any target number for checks and saves.",
    },
    lead: { ru: "Двадцатигранник: результат от 1 до 20, у каждой грани шанс 5 %.", en: "Twenty-sided die: 1 to 20, each face with a 5% chance." },
    note: {
      ru: "d20 — главный кубик Dungeons & Dragons: им бросают проверки, спасброски и атаки. «Натуральная 20» (критический успех) и «натуральная 1» выпадают с шансом по 5 %.",
      en: "The d20 is the heart of Dungeons & Dragons: ability checks, saving throws and attacks all use it. A natural 20 (critical hit) and a natural 1 each have a 5% chance.",
    },
    faq: {
      ru: { q: "Как бросить с модификатором, например d20+5?", a: "Впишите «d20+5» в поле формулы. Результат будет от 6 до 25, в среднем 15,5." },
      en: { q: "How do I roll with a modifier, like d20+5?", a: "Type “d20+5” in the formula field. The result ranges from 6 to 25 with an average of 15.5." },
    },
  },
  {
    slug: "d100",
    notation: "1d100",
    glyph: "💯",
    name: { ru: "d100", en: "d100" },
    title: { ru: "Кубик d100 онлайн — процентный бросок от 1 до 100", en: "D100 Dice Roller — percentile roll 1 to 100" },
    h1: { ru: "Кубик d100 онлайн", en: "D100 percentile dice" },
    description: {
      ru: "Бросок d100 онлайн: результат от 1 до 100, шанс каждого значения ровно 1 %. Процентный кубик для ролевых игр, таблиц случайных событий и проверок навыков.",
      en: "Roll a d100 online: a result from 1 to 100, each value with exactly a 1% chance. The percentile die for RPGs, random event tables and skill checks.",
    },
    lead: { ru: "Процентный кубик: результат от 1 до 100, каждое значение — 1 %.", en: "Percentile die: 1 to 100, each value with a 1% chance." },
    note: {
      ru: "За столом d100 обычно бросают двумя d10: один даёт десятки, другой единицы. Здесь сразу выпадает число от 1 до 100 с равными шансами. Можно писать и «d%».",
      en: "At the table a d100 is usually two d10 — one for tens, one for units. Here you get 1 to 100 directly, all equally likely. You can also type “d%”.",
    },
    faq: {
      ru: { q: "Как пройти проверку «выбросить не больше 35»?", a: "Шанс выбросить 35 или меньше на d100 — ровно 35 %: процентный кубик для того и нужен, чтобы шанс совпадал с числом." },
      en: { q: "What's my chance to roll 35 or under?", a: "Exactly 35% — that's the point of a percentile die: the target number is the chance." },
    },
  },
  {
    slug: "2d6",
    notation: "2d6",
    glyph: "🎲",
    name: { ru: "2 кубика (2d6)", en: "2d6" },
    title: { ru: "Бросить 2 кубика онлайн (2d6) — сумма и шансы", en: "Roll 2 Dice Online (2d6) — sums and odds" },
    h1: { ru: "Бросить 2 кубика онлайн", en: "Roll 2 dice online" },
    description: {
      ru: "Бросить два кубика онлайн: 2d6 даёт сумму от 2 до 12, чаще всего выпадает 7 — 6 комбинаций из 36, шанс 16,7 %. Полная таблица вероятностей всех сумм.",
      en: "Roll two dice online: 2d6 gives a total from 2 to 12, and 7 is the most common — 6 of 36 combinations, a 16.7% chance. Full table of sum probabilities.",
    },
    lead: { ru: "Два шестигранника: сумма от 2 до 12, чаще всего выпадает 7 (шанс 1/6).", en: "Two six-sided dice: totals from 2 to 12, with 7 the most likely (1/6)." },
    note: {
      ru: "Два кубика бросают в «Монополии», нардах и «Колонизаторах». Сумма распределена неравномерно: семёрка выпадает в шесть раз чаще, чем 2 или 12.",
      en: "Two dice are used in Monopoly, backgammon and Catan. Totals aren't equally likely: a 7 comes up six times as often as a 2 or a 12.",
    },
    faq: {
      ru: { q: "Какова вероятность дубля?", a: "6 из 36 комбинаций — дубли (1-1, 2-2 … 6-6), шанс 1/6 ≈ 16,7 %. Каждый конкретный дубль — 1/36 ≈ 2,8 %." },
      en: { q: "What are the odds of rolling doubles?", a: "6 of the 36 combinations are doubles (1-1 to 6-6), so 1/6 ≈ 16.7%. Any specific double is 1/36 ≈ 2.8%." },
    },
  },
  {
    slug: "3d6",
    notation: "3d6",
    glyph: "🎲",
    name: { ru: "3 кубика (3d6)", en: "3d6" },
    title: { ru: "Бросить 3 кубика онлайн (3d6) — таблица вероятностей", en: "Roll 3 Dice Online (3d6) — probability table" },
    h1: { ru: "Бросить 3 кубика онлайн", en: "Roll 3 dice online" },
    description: {
      ru: "Бросить три кубика онлайн: сумма 3d6 от 3 до 18, среднее 10,5, чаще всего выпадают 10 и 11 — по 27 из 216 комбинаций (12,5 %). Полная таблица шансов.",
      en: "Roll three dice online: 3d6 totals range from 3 to 18 with an average of 10.5; 10 and 11 are most likely at 27 of 216 combinations (12.5%) each.",
    },
    lead: { ru: "Три шестигранника: сумма от 3 до 18, в среднем 10,5.", en: "Three six-sided dice: totals from 3 to 18, averaging 10.5." },
    note: {
      ru: "3d6 — классический способ создать характеристики персонажа в ранних редакциях D&D и в GURPS. Крайние значения 3 и 18 выпадают лишь один раз из 216.",
      en: "3d6 is the classic way to roll character stats in early D&D and in GURPS. The extremes, 3 and 18, come up only once in 216 rolls.",
    },
    faq: {
      ru: { q: "Какой шанс выбросить 18 на трёх кубиках?", a: "Только одна комбинация из 216 — три шестёрки, шанс ≈ 0,46 %." },
      en: { q: "What's the chance of rolling 18 on 3d6?", a: "Only one combination out of 216 — three sixes — about 0.46%." },
    },
  },
  {
    slug: "4d6",
    notation: "4d6",
    glyph: "🎲",
    name: { ru: "4 кубика (4d6)", en: "4d6" },
    title: { ru: "4d6 онлайн — бросить четыре кубика, вероятности сумм", en: "4d6 Dice Roller — roll four dice, sum odds" },
    h1: { ru: "Бросить 4 кубика онлайн (4d6)", en: "Roll 4d6 online" },
    description: {
      ru: "Бросить 4d6 онлайн: сумма от 4 до 24, среднее 14, всего 1296 равновероятных комбинаций. Видно каждый кубик — легко отбросить наименьший для характеристик D&D.",
      en: "Roll 4d6 online: totals from 4 to 24, an average of 14 and 1,296 equally likely combinations. Every die is shown, so dropping the lowest for D&D stats is easy.",
    },
    lead: { ru: "Четыре шестигранника: сумма от 4 до 24, в среднем 14.", en: "Four six-sided dice: totals from 4 to 24, averaging 14." },
    note: {
      ru: "В D&D 5e характеристики часто создают так: бросают 4d6 и отбрасывают наименьший кубик. Генератор показывает все четыре значения, так что наименьший легко вычесть; таблица ниже — для суммы всех четырёх.",
      en: "In D&D 5e stats are often rolled as 4d6, dropping the lowest die. The roller shows all four values so you can drop the lowest yourself; the table below is for the sum of all four.",
    },
    faq: {
      ru: { q: "Как бросить «4d6, отбросить наименьший»?", a: "Бросьте 4d6: под суммой видно каждый кубик. Вычтите из суммы наименьшее значение — получится результат от 3 до 18." },
      en: { q: "How do I roll “4d6 drop lowest”?", a: "Roll 4d6: each die is shown under the total. Subtract the lowest one from the total to get a stat from 3 to 18." },
    },
  },
  {
    slug: "5d6",
    notation: "5d6",
    glyph: "🎲",
    name: { ru: "5 кубиков (5d6)", en: "5d6" },
    title: { ru: "Бросить 5 кубиков онлайн (5d6) — для покера на костях", en: "Roll 5 Dice Online (5d6) — dice poker roller" },
    h1: { ru: "Бросить 5 кубиков онлайн", en: "Roll 5 dice online" },
    description: {
      ru: "Бросить пять кубиков онлайн: сумма 5d6 от 5 до 30, среднее 17,5, всего 7776 комбинаций. Каждая кость видна отдельно — подходит для покера на костях.",
      en: "Roll five dice online: 5d6 totals range from 5 to 30 with an average of 17.5 across 7,776 combinations. Every die is shown on its own, ideal for dice poker.",
    },
    lead: { ru: "Пять шестигранников: видно каждую кость и сумму от 5 до 30.", en: "Five six-sided dice: see every die and the total from 5 to 30." },
    note: {
      ru: "В покере на костях важна не сумма, а комбинация: пара, фулл-хаус, стрит. Шанс выбросить пять одинаковых с первого броска — 6 из 7776, около 0,08 %.",
      en: "In dice poker the combination matters more than the total: pairs, a full house, a straight. Five of a kind on the first roll is 6 in 7,776, about 0.08%.",
    },
    faq: {
      ru: { q: "Какой шанс выбросить пять одинаковых?", a: "6 комбинаций из 7776 (по одной на каждое число), то есть 1/1296 ≈ 0,077 %." },
      en: { q: "What are the odds of five of a kind?", a: "6 combinations out of 7,776 (one per number), i.e. 1/1296 ≈ 0.077%." },
    },
  },
  {
    slug: "2d10",
    notation: "2d10",
    glyph: "🔟",
    name: { ru: "2d10", en: "2d10" },
    title: { ru: "2d10 онлайн — бросить два десятигранных кубика", en: "2d10 Dice Roller — roll two ten-sided dice" },
    h1: { ru: "Бросить 2d10 онлайн", en: "Roll 2d10 online" },
    description: {
      ru: "Бросить 2d10 онлайн: сумма от 2 до 20, среднее 11, чаще всего выпадает 11 — 10 из 100 комбинаций, 10 %. Таблица вероятностей всех сумм и шанс «не меньше».",
      en: "Roll 2d10 online: totals from 2 to 20 with an average of 11; 11 is the most likely at 10 of 100 combinations (10%). Full sum table plus “at least” odds.",
    },
    lead: { ru: "Два десятигранника: сумма от 2 до 20, чаще всего 11.", en: "Two ten-sided dice: totals from 2 to 20, most often 11." },
    note: {
      ru: "2d10 встречается в ролевых системах с «колоколообразным» распределением: крайние результаты редки, средние — часты.",
      en: "2d10 shows up in RPG systems that want a bell-shaped curve: extreme results are rare and middle ones common.",
    },
    faq: {
      ru: { q: "Чем 2d10 отличается от d20?", a: "На d20 все результаты от 1 до 20 равновероятны. У 2d10 сумма 11 выпадает в 10 раз чаще, чем 2 или 20." },
      en: { q: "How is 2d10 different from a d20?", a: "On a d20 every result from 1 to 20 is equally likely. With 2d10 a total of 11 is ten times as likely as 2 or 20." },
    },
  },
  {
    slug: "2d20",
    notation: "2d20",
    glyph: "🐉",
    name: { ru: "2d20", en: "2d20" },
    title: { ru: "2d20 онлайн — два кубика d20, преимущество и помеха", en: "2d20 Roller — advantage and disadvantage odds" },
    h1: { ru: "Бросить 2d20 онлайн", en: "Roll 2d20 online" },
    description: {
      ru: "Бросить 2d20 онлайн: видно оба кубика, так что легко взять больший (преимущество) или меньший (помеха). Таблица шансов для суммы и для броска с преимуществом.",
      en: "Roll 2d20 online: both dice are shown, so taking the higher (advantage) or lower (disadvantage) is easy. Odds tables for the sum and for advantage rolls.",
    },
    lead: { ru: "Два двадцатигранника: для суммы или броска с преимуществом и помехой.", en: "Two twenty-sided dice: for a sum or for advantage and disadvantage." },
    note: {
      ru: "В D&D 5e при преимуществе бросают 2d20 и берут больший результат, при помехе — меньший. Шанс «натуральной 20» с преимуществом — 39/400 ≈ 9,75 % против 5 % у одного кубика.",
      en: "In D&D 5e advantage means rolling 2d20 and keeping the higher die; disadvantage keeps the lower. A natural 20 with advantage is 39/400 ≈ 9.75%, versus 5% on one die.",
    },
    faq: {
      ru: { q: "Насколько преимущество повышает шанс?", a: "В среднем это примерно +3,3 к броску. Например, шанс выбросить 11+ растёт с 50 % до 75 %." },
      en: { q: "How much does advantage help?", a: "On average it's worth roughly +3.3. For example, the chance to roll 11 or higher rises from 50% to 75%." },
    },
  },
];

function expr(notation: string): DiceExpr {
  const r = parseDice(notation);
  if (!r.ok) throw new Error(`bad dice preset ${notation}`);
  return r.expr;
}

function frac(n: bigint, d: bigint): string {
  const g = gcd(n, d);
  return `${n / g}/${d / g}`;
}

function diceBlocks(p: DicePreset, locale: Locale): Block[] {
  const e = expr(p.notation);
  const d = diceDistribution(e)!;
  const { mean, sd } = diceStats(e);
  const max = d.min + d.ways.length - 1;
  const top = d.ways.reduce((m, w) => (w > m ? w : m), 0n);
  const modes = d.ways.map((w, i) => (w === top ? d.min + i : null)).filter((x): x is number => x !== null);
  const single = e.terms.length === 1 && e.terms[0].kind === "dice" && e.terms[0].count === 1;
  const sides = e.terms[0].kind === "dice" ? e.terms[0].sides : 0;

  const facts: Block = {
    type: "facts",
    title: L(locale, "Коротко", "Quick facts"),
    rows: [
      [L(locale, "Диапазон", "Range"), `${d.min}–${max}`],
      [L(locale, "Среднее (матожидание)", "Average (expected value)"), num(locale, mean)],
      [L(locale, "Стандартное отклонение", "Standard deviation"), num(locale, Math.round(sd * 100) / 100)],
      single
        ? [L(locale, "Шанс каждой грани", "Chance of each face"), `1/${sides} = ${pct(locale, 1 / sides)}`]
        : [L(locale, "Самая частая сумма", "Most likely total"), `${modes.join(L(locale, " и ", " and "))} — ${pct(locale, ratio(top, d.outcomes))}`],
      [L(locale, "Равновероятных исходов", "Equally likely outcomes"), num(locale, d.outcomes)],
    ],
  };

  const suffix = (s: number) => {
    let acc = 0n;
    for (let i = d.ways.length - 1; i >= s - d.min; i--) acc += d.ways[i];
    return acc;
  };

  let table: Block;
  if (single && sides === 100) {
    const targets = [2, 5, 10, 21, 26, 51, 76, 91, 96, 100];
    table = {
      type: "table",
      title: L(locale, "Шанс выбросить не меньше", "Chance to roll at least"),
      head: [L(locale, "Не меньше", "At least"), L(locale, "Вероятность", "Probability")],
      rows: targets.map((k) => [String(k), pct(locale, (101 - k) / 100)]),
    };
  } else if (single) {
    table = {
      type: "table",
      title: L(locale, `Шанс выбросить не меньше на d${sides}`, `Chance to roll at least N on a d${sides}`),
      head: [L(locale, "Не меньше", "At least"), L(locale, "Граней", "Faces"), L(locale, "Вероятность", "Probability")],
      rows: Array.from({ length: sides }, (_, i) => {
        const k = i + 1;
        return [String(k), `${sides - k + 1}/${sides}`, pct(locale, (sides - k + 1) / sides)];
      }),
    };
  } else {
    table = {
      type: "table",
      title: L(locale, `Вероятности сумм ${e.text}`, `${e.text} sum probabilities`),
      head: [L(locale, "Сумма", "Total"), L(locale, "Комбинаций", "Combinations"), L(locale, "Вероятность", "Probability"), L(locale, "Не меньше", "At least")],
      rows: d.ways.map((w, i) => [String(d.min + i), `${num(locale, w)} ${L(locale, "из", "of")} ${num(locale, d.outcomes)}`, `${pct(locale, ratio(w, d.outcomes))} (${frac(w, d.outcomes)})`, pct(locale, ratio(suffix(d.min + i), d.outcomes))]),
    };
  }

  const blocks: Block[] = [facts, table];
  if (p.slug === "2d20") {
    // Advantage: P(max ≥ k) = 1 − ((k−1)/20)²; disadvantage: P(min ≥ k) = ((21−k)/20)².
    blocks.push({
      type: "table",
      title: L(locale, "Преимущество и помеха: шанс выбросить не меньше", "Advantage and disadvantage: chance to roll at least"),
      head: [L(locale, "Не меньше", "At least"), L(locale, "Один d20", "One d20"), L(locale, "С преимуществом", "Advantage"), L(locale, "С помехой", "Disadvantage")],
      rows: [2, 5, 8, 10, 11, 12, 15, 18, 20].map((k) => [String(k), pct(locale, (21 - k) / 20), pct(locale, 1 - ((k - 1) / 20) ** 2), pct(locale, ((21 - k) / 20) ** 2)]),
    });
  }
  blocks.push({ type: "text", paragraphs: [p.note[locale]] });
  return blocks;
}

function computedFaq(p: DicePreset, locale: Locale): QA {
  const e = expr(p.notation);
  const { mean } = diceStats(e);
  const { min } = diceDistribution(e)!;
  const max = min + diceDistribution(e)!.ways.length - 1;
  return locale === "ru"
    ? { q: `Какое среднее значение у ${e.text}?`, a: `Математическое ожидание ${e.text} — ${num(locale, mean)}: это середина между минимумом ${min} и максимумом ${max}. На длинной серии бросков средний результат будет близок к этому числу.` }
    : { q: `What is the average roll of ${e.text}?`, a: `The expected value of ${e.text} is ${num(locale, mean)}, halfway between the minimum ${min} and the maximum ${max}. Over many rolls your average will settle close to it.` };
}

function diceVariant(p: DicePreset): VariantDef {
  return {
    slug: p.slug,
    name: p.name,
    title: p.title,
    h1: p.h1,
    description: p.description,
    lead: p.lead,
    glyph: p.glyph,
    props: { notation: p.notation },
    keywords: { ru: ["кубик", "кости", p.notation, p.slug], en: ["dice", "roll", p.notation, p.slug] },
    blocks: (locale) => diceBlocks(p, locale),
    faq: { ru: [p.faq.ru, computedFaq(p, "ru")], en: [p.faq.en, computedFaq(p, "en")] },
  };
}

export const diceTool: ToolDef = {
  slug: "dice-roller",
  component: "random/dice",
  icon: "Dices",
  popular: true,
  name: { ru: "Кубик онлайн", en: "Dice roller" },
  title: { ru: "Кубик онлайн — бросить игральные кости d4, d6, d20", en: "Dice Roller — roll d4, d6, d8, d10, d12, d20, d100 online" },
  h1: { ru: "Кубик онлайн", en: "Dice roller" },
  description: {
    ru: "Бросить кубик онлайн: d4, d6, d8, d10, d12, d20 и d100, до 100 кубиков за раз и формулы вроде 2d6+3 или 3d6+1d4. Видно каждый кубик, сумму и историю бросков.",
    en: "Roll dice online: d4, d6, d8, d10, d12, d20 and d100, up to 100 dice at once and formulas like 2d6+3 or 3d6+1d4. See every die, the total and your roll history.",
  },
  lead: {
    ru: "Выберите кубик или впишите формулу вроде 2d6+3 и нажмите «Бросить».",
    en: "Pick a die or type a formula such as 2d6+3 and press Roll.",
  },
  keywords: {
    ru: ["бросить кубик", "игральные кости", "кости онлайн", "d20", "d6", "кубик днд"],
    en: ["roll dice", "dice roller", "d20", "d6", "virtual dice", "dnd dice"],
  },
  props: { notation: "1d6" },
  howTo: {
    ru: [
      "Выберите тип кубика: d4, d6, d8, d10, d12, d20 или d100.",
      "Укажите, сколько кубиков бросить, или впишите формулу, например 2d6+3.",
      "Нажмите «Бросить» или Enter в поле формулы.",
      "Смотрите значение каждого кубика и сумму; прошлые броски сохраняются в истории.",
    ],
    en: [
      "Choose a die: d4, d6, d8, d10, d12, d20 or d100.",
      "Set how many dice to roll, or type a formula such as 2d6+3.",
      "Press Roll, or Enter in the formula field.",
      "See every die and the total; earlier rolls stay in the history.",
    ],
  },
  faq: {
    ru: [
      { q: "Что означает запись 2d6+3?", a: "Бросить два шестигранных кубика (2d6) и прибавить к сумме 3. Буква d — от английского dice; можно писать и по-русски: 2к6+3." },
      { q: "Можно бросить разные кубики сразу?", a: "Да, соедините их плюсом или минусом: «1d20+1d4+2» или «3d6−1d4». Всего до 200 кубиков, до 1000 граней у каждого." },
      { q: "Результаты действительно случайные?", a: "Да. Каждая грань выбирается криптографическим генератором браузера (crypto.getRandomValues) с отбором без смещения, поэтому все грани равновероятны." },
      { q: "Сохраняется ли история бросков?", a: "История хранится, пока открыта страница, — последние 50 бросков с формулой и значением каждого кубика." },
    ],
    en: [
      { q: "What does 2d6+3 mean?", a: "Roll two six-sided dice (2d6) and add 3 to the total. The “d” stands for die/dice." },
      { q: "Can I roll different dice together?", a: "Yes, join them with plus or minus: “1d20+1d4+2” or “3d6-1d4”. Up to 200 dice in total, up to 1000 sides each." },
      { q: "Are the rolls really random?", a: "Yes. Every face is chosen by the browser's cryptographic generator (crypto.getRandomValues) with unbiased rejection sampling, so all faces are equally likely." },
      { q: "Is my roll history saved?", a: "The history is kept while the page is open — the last 50 rolls with the formula and every die's value." },
    ],
  },
  about: {
    ru: [
      "Онлайн-кубик заменяет любой набор игральных костей: от обычного шестигранника для «Монополии» до полного набора для D&D. Можно бросать сразу несколько кубиков, складывать разные типы и добавлять модификаторы.",
      "На каждой странице кубика ниже есть точная таблица вероятностей — посчитанная сверткой, без округлений в комбинациях: сколько способов дают каждую сумму и какой шанс выбросить не меньше нужного числа.",
    ],
    en: [
      "The online dice roller replaces any dice set, from the plain d6 for Monopoly to a full D&D kit. Roll several dice at once, mix types and add modifiers.",
      "Each dice page below has an exact probability table computed by convolution: how many combinations give each total and the chance to roll at least a given number.",
    ],
  },
  variants: {
    title: { ru: "Кубики и броски", en: "Dice and rolls" },
    list: () => PRESETS.map(diceVariant),
  },
};
