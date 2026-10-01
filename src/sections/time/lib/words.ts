/*
 * Telling the time in words, the way people say it: "без двадцати четыре", "четверть третьего",
 * "twenty to four". Pure, unit-tested; used by the learn-to-tell-time clock.
 */

const UNITS_M = ["ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят"];
const UNITS_GEN = ["", "одной", "двух", "трёх", "четырёх", "пяти", "шести", "семи", "восьми", "девяти", "десяти", "одиннадцати", "двенадцати", "тринадцати", "четырнадцати", "пятнадцати", "шестнадцати", "семнадцати", "восемнадцати", "девятнадцати"];
const TENS_GEN = ["", "", "двадцати", "тридцати", "сорока", "пятидесяти"];
const ORD_GEN = ["", "первого", "второго", "третьего", "четвёртого", "пятого", "шестого", "седьмого", "восьмого", "девятого", "десятого", "одиннадцатого", "двенадцатого"];

/** Russian plural form: 1 минута, 2 минуты, 5 минут. */
export function ruPlural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

/** Cardinal number 0–59 in words; `feminine` for "одна/две минуты". */
export function ruNumber(n: number, feminine = false): string {
  const fem = (w: string) => (feminine ? w.replace(/^один$/, "одна").replace(/^два$/, "две") : w);
  if (n < 20) return fem(UNITS_M[n]);
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? TENS[t] : `${TENS[t]} ${fem(UNITS_M[u])}`;
}

function ruGenitive(n: number): string {
  if (n < 20) return UNITS_GEN[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? TENS_GEN[t] : `${TENS_GEN[t]} ${UNITS_GEN[u]}`;
}

const h12 = (h: number) => ((h + 11) % 12) + 1;

/** "час", "два", "пять" — the hour as said after "без …": "без пяти час". */
function ruHourBare(h: number): string {
  const x = h12(h);
  return x === 1 ? "час" : ruNumber(x);
}

/** Part of the day for a 24-hour hour: ночи, утра, дня, вечера. */
export function ruDayPart(h: number): string {
  if (h < 4) return "ночи";
  if (h < 12) return "утра";
  if (h < 17) return "дня";
  return "вечера";
}

/** The official way: "пятнадцать часов сорок минут". */
export function ruOfficial(h: number, m: number): string {
  const hours = `${ruNumber(h)} ${ruPlural(h, "час", "часа", "часов")}`;
  if (m === 0) return `${hours} ровно`;
  return `${hours} ${ruNumber(m, true)} ${ruPlural(m, "минута", "минуты", "минут")}`;
}

/** The everyday way: "без двадцати четыре", "четверть третьего", "половина пятого", "ровно три". */
export function ruSpoken(h: number, m: number): string {
  const next = h12(h + 1);
  if (m === 0) {
    if (h === 0) return "полночь";
    if (h === 12) return "полдень";
    const x = h12(h);
    return x === 1 ? "ровно час" : `ровно ${ruNumber(x)}`;
  }
  if (m === 15) return `четверть ${ORD_GEN[next]}`;
  if (m === 30) return `половина ${ORD_GEN[next]}`;
  if (m === 45) return `без четверти ${ruHourBare(h + 1)}`;
  if (m < 30) return `${ruNumber(m, true)} ${ruPlural(m, "минута", "минуты", "минут")} ${ORD_GEN[next]}`;
  const left = 60 - m;
  // Round fives are said without "минут": "без двадцати четыре", but "без трёх минут четыре".
  const mins = left % 5 === 0 ? "" : ` ${left === 1 ? "минуты" : "минут"}`;
  return `без ${ruGenitive(left)}${mins} ${ruHourBare(h + 1)}`;
}

const EN_UNITS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "quarter", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_HOURS = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

function enMinutes(n: number): string {
  if (n === 15) return "quarter";
  if (n < 20) return EN_UNITS[n];
  const u = n % 10;
  return u === 0 ? "twenty" : `twenty-${EN_UNITS[u]}`;
}

/** "twenty to four", "quarter past three", "half past three", "three o'clock". */
export function enSpoken(h: number, m: number): string {
  if (m === 0) {
    if (h === 0) return "midnight";
    if (h === 12) return "noon";
    return `${EN_HOURS[h12(h)]} o'clock`;
  }
  if (m === 30) return `half past ${EN_HOURS[h12(h)]}`;
  const past = m < 30;
  const n = past ? m : 60 - m;
  const word = enMinutes(n);
  const mins = n === 15 || n % 5 === 0 ? "" : n === 1 ? " minute" : " minutes";
  return `${word}${mins} ${past ? "past" : "to"} ${EN_HOURS[h12(past ? h : h + 1)]}`;
}

/** "3:40 PM" style digits for English, "15:40" for Russian. */
export function digits(h: number, m: number, twelve: boolean): string {
  const mm = String(m).padStart(2, "0");
  if (!twelve) return `${String(h).padStart(2, "0")}:${mm}`;
  return `${h12(h)}:${mm} ${h < 12 ? "AM" : "PM"}`;
}

/** Hand angles in degrees for a time: the hour hand moves between numbers as minutes pass. */
export function handAngles(h: number, m: number): { hour: number; minute: number } {
  return { hour: ((h % 12) + m / 60) * 30, minute: m * 6 };
}

/** Minutes since midnight from a minute-hand drag: keeps the hour, wrapping forward/back through 12. */
export function dragMinute(total: number, angle: number, step = 1): number {
  const m0 = total % 60;
  let m = Math.round(((((angle % 360) + 360) % 360) / 6) / step) * step;
  if (m === 60) m = 0;
  let next = total - m0 + m;
  if (m0 > 45 && m < 15) next += 60; // passed 12 going forward
  else if (m0 < 15 && m > 45) next -= 60; // passed 12 going back
  return ((next % 1440) + 1440) % 1440;
}
