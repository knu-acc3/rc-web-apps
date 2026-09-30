/** Human-readable cron descriptions in grammatical Russian and English. */
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import type { CronExpr, FieldName, ParsedField } from "./engine";

const pad = (n: number) => String(n).padStart(2, "0");

const RU = {
  dowDat: ["воскресеньям", "понедельникам", "вторникам", "средам", "четвергам", "пятницам", "субботам"],
  dowGen: ["воскресенья", "понедельника", "вторника", "среды", "четверга", "пятницы", "субботы"],
  dowAcc: ["воскресенье", "понедельник", "вторник", "среду", "четверг", "пятницу", "субботу"],
  dowShort: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
  dowGender: ["n", "m", "m", "f", "m", "f", "f"] as ("m" | "f" | "n")[],
  nth: { m: ["первый", "второй", "третий", "четвёртый", "пятый"], f: ["первую", "вторую", "третью", "четвёртую", "пятую"], n: ["первое", "второе", "третье", "четвёртое", "пятое"] },
  last: { m: "последний", f: "последнюю", n: "последнее" },
  monGen: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  monPrep: ["январе", "феврале", "марте", "апреле", "мае", "июне", "июле", "августе", "сентябре", "октябре", "ноябре", "декабре"],
  monNom: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
  monShort: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  sec: ["секунду", "секунды", "секунд"],
  min: ["минуту", "минуты", "минут"],
  hour: ["час", "часа", "часов"],
  day: ["день", "дня", "дней"],
  month: ["месяц", "месяца", "месяцев"],
};

const EN = {
  dow: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  dowShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  mon: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  monShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  nth: ["first", "second", "third", "fourth", "fifth"],
};

function joinList(items: string[], locale: Locale): string {
  if (items.length <= 1) return items.join("");
  const and = locale === "ru" ? " и " : " and ";
  return `${items.slice(0, -1).join(", ")}${and}${items[items.length - 1]}`;
}

const ordEn = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${s}`;
};

/** Structure of a simple field. */
type Shape = { kind: "all" } | { kind: "single"; v: number } | { kind: "range"; a: number; b: number } | { kind: "step"; from: number; to?: number; step: number } | { kind: "list"; values: number[] };

function shape(f: ParsedField, max: number): Shape {
  const raw = f.raw;
  if (raw === "*" || raw === "?") return { kind: "all" };
  if (!raw.includes(",")) {
    const m = /^(\*|\d+|[A-Za-z]{3})(?:-(\d+|[A-Za-z]{3}))?(?:\/(\d+))?$/.exec(raw);
    if (m && m[3]) {
      const from = m[1] === "*" ? f.values[0] : f.values[0];
      const to = m[2] !== undefined ? f.values[f.values.length - 1] : undefined;
      if (m[1] === "*" || to === undefined) return { kind: "step", from, step: Number(m[3]), to: m[1] === "*" ? undefined : to };
      return { kind: "step", from, to, step: Number(m[3]) };
    }
    if (m && m[2] !== undefined && f.values.length > 1) return { kind: "range", a: f.values[0], b: f.values[f.values.length - 1] };
  }
  if (f.values.length === 1) return { kind: "single", v: f.values[0] };
  if (f.values.length === max) return { kind: "all" };
  const v = f.values;
  if (v.length > 2 && v.every((x, i) => i === 0 || x === v[i - 1] + 1)) return { kind: "range", a: v[0], b: v[v.length - 1] };
  return { kind: "list", values: v };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Russian "в" → "во" before в/ф + consonant: "во второй", "во вторник". */
const vo = (word: string) => `${/^[вф][^аеёиоуыэюя]/i.test(word) ? "во" : "в"} ${word}`;

/* ───────────── time of day ───────────── */

function timeParts(e: CronExpr, locale: Locale): { text: string; specific: boolean } {
  const ru = locale === "ru";
  const F = e.fields;
  const hasSec = e.dialect !== "unix";
  const S = hasSec ? shape(F.second, 60) : ({ kind: "single", v: 0 } as Shape);
  const Mi = shape(F.minute, 60);
  const H = shape(F.hour, 24);
  const secSuffix = S.kind === "single" && S.v !== 0 ? `:${pad(S.v)}` : "";
  const t = (h: number, m: number) => `${pad(h)}:${pad(m)}${secSuffix}`;

  let secText = "";
  if (hasSec && !(S.kind === "single")) {
    if (S.kind === "all") secText = ru ? "каждую секунду" : "every second";
    else if (S.kind === "step" && S.from === 0 && !S.to) secText = ru ? `каждые ${S.step} ${plural("ru", S.step, RU.sec)}` : `every ${S.step} seconds`;
    else if (S.kind === "step") secText = ru ? `каждые ${S.step} ${plural("ru", S.step, RU.sec)}, начиная с ${S.from}-й секунды` : `every ${S.step} seconds starting at second ${S.from}`;
    else secText = ru ? `в ${joinList(F.second.values.map(String), locale)} ${plural("ru", F.second.values[F.second.values.length - 1], ["секунду", "секунды", "секунд"])}` : `at second${F.second.values.length > 1 ? "s" : ""} ${joinList(F.second.values.map(String), locale)}`;
    if (Mi.kind === "all" && H.kind === "all") return { text: secText, specific: false };
  }

  let text = "";
  let specific = false;
  const hourRange = (a: number, b: number, mEnd = 59) => (ru ? `с ${pad(a)}:00 до ${pad(b)}:${pad(mEnd)}` : `between ${pad(a)}:00 and ${pad(b)}:${pad(mEnd)}`);
  const hoursPhrase = (): string => {
    if (H.kind === "all") return "";
    if (H.kind === "single") return hourRange(H.v, H.v);
    if (H.kind === "range") return hourRange(H.a, H.b);
    if (H.kind === "step") return ru ? `каждые ${H.step} ${plural("ru", H.step, RU.hour)}` : `every ${H.step} hours`;
    return ru ? `в ${joinList(H.values.map(String), locale)} ${plural("ru", H.values[H.values.length - 1], RU.hour)}` : `during hours ${joinList(H.values.map(String), locale)}`;
  };

  if (Mi.kind === "all") {
    text = ru ? "каждую минуту" : "every minute";
    const hp = hoursPhrase();
    if (hp) text += ` ${hp}`;
  } else if (Mi.kind === "step") {
    const base = ru ? `каждые ${Mi.step} ${plural("ru", Mi.step, RU.min)}` : `every ${Mi.step} minutes`;
    text = Mi.from === 0 && !Mi.to ? base : ru ? `${base}, начиная с ${Mi.from}-й минуты` : `${base} starting at minute ${Mi.from}`;
    if (Mi.to !== undefined && Mi.to !== 59) text = ru ? `${base} с ${Mi.from}-й по ${Mi.to}-ю минуту` : `${base} from minute ${Mi.from} through ${Mi.to}`;
    const hp = hoursPhrase();
    if (hp) text += `${H.kind === "step" ? ", " : " "}${hp}`;
  } else {
    const mins = Mi.kind === "single" ? [Mi.v] : F.minute.values;
    if (H.kind === "all") {
      if (Mi.kind === "single" && Mi.v === 0 && !secSuffix) text = ru ? "каждый час" : "every hour";
      else text = ru ? `в ${joinList(mins.map(String), locale)} ${plural("ru", mins[mins.length - 1], ["минуту", "минуты", "минут"])} каждого часа` : `at minute${mins.length > 1 ? "s" : ""} ${joinList(mins.map(String), locale)} of every hour`;
    } else if (H.kind === "step" && (H.from === 0 || H.to === undefined) && !H.to) {
      const every = ru ? `каждые ${H.step} ${plural("ru", H.step, RU.hour)}` : `every ${H.step} hours`;
      const start = H.from !== 0 ? (ru ? `, начиная с ${t(H.from, mins[0])}` : ` starting at ${t(H.from, mins[0])}`) : "";
      text = mins.length === 1 && mins[0] === 0 && !secSuffix ? every + start : ru ? `${every}, в ${joinList(mins.map(pad), locale)} ${plural("ru", mins[mins.length - 1], ["минуту", "минуты", "минут"])}${start}` : `${every} at minute ${joinList(mins.map(String), locale)}${start}`;
    } else {
      const hours = F.hour.values;
      if (hours.length * mins.length <= 6) {
        const times = hours.flatMap((h) => mins.map((m) => t(h, m)));
        text = ru ? `в ${joinList(times, locale)}` : `at ${joinList(times, locale)}`;
        specific = true;
      } else if (Mi.kind === "single" && H.kind === "range") {
        text = ru ? `каждый час с ${t(H.a, Mi.v)} до ${t(H.b, Mi.v)}` : `every hour from ${t(H.a, Mi.v)} to ${t(H.b, Mi.v)}`;
      } else {
        text = ru ? `в ${joinList(mins.map(pad), locale)} ${plural("ru", mins[mins.length - 1], ["минуту", "минуты", "минут"])} ${hoursPhrase()}` : `at minute ${joinList(mins.map(String), locale)} ${hoursPhrase()}`;
      }
    }
  }
  if (secText) text = `${secText}, ${text}`;
  return { text, specific };
}

/* ───────────── days ───────────── */

function dowPhrase(f: ParsedField, locale: Locale): string {
  const ru = locale === "ru";
  const parts: string[] = [];
  const v = f.values;
  const all = v.length === 7;
  if (!all && v.length) {
    const key = v.join(",");
    if (key === "1,2,3,4,5") parts.push(ru ? "по будням (пн–пт)" : "on weekdays (Mon–Fri)");
    else if (key === "0,6") parts.push(ru ? "по выходным (сб и вс)" : "on weekends (Sat and Sun)");
    else if (v.length >= 3 && v.every((x, i) => i === 0 || x === v[i - 1] + 1)) {
      const a = v[0];
      const b = v[v.length - 1];
      parts.push(ru ? `${a === 2 || a === 3 ? "со" : "с"} ${RU.dowGen[a]} по ${RU.dowAcc[b]}` : `${EN.dow[a]} through ${EN.dow[b]}`);
    } else {
      // Monday-first order reads more naturally
      const ordered = [...v].sort((x, y) => ((x + 6) % 7) - ((y + 6) % 7));
      parts.push(ru ? `по ${joinList(ordered.map((d) => RU.dowDat[d]), locale)}` : `on ${joinList(ordered.map((d) => `${EN.dow[d]}s`), locale)}`);
    }
  }
  for (const [d, n] of f.nthDow ?? []) parts.push(ru ? `${vo(RU.nth[RU.dowGender[d]][n - 1])} ${RU.dowAcc[d]} месяца` : `on the ${EN.nth[n - 1]} ${EN.dow[d]} of the month`);
  for (const d of f.lastDow ?? []) parts.push(ru ? `в ${RU.last[RU.dowGender[d]]} ${RU.dowAcc[d]} месяца` : `on the last ${EN.dow[d]} of the month`);
  return joinList(parts, locale);
}

function domPhrase(f: ParsedField, locale: Locale, monthAll: boolean): string {
  const ru = locale === "ru";
  const parts: string[] = [];
  const S = shape(f, 31);
  const suffixRu = monthAll ? " каждого месяца" : "";
  const suffixEn = monthAll ? " of every month" : "";
  if (f.raw !== "*" && f.raw !== "?" && f.values.length) {
    if (S.kind === "single") parts.push(ru ? `${S.v}-го числа${suffixRu}` : `on the ${ordEn(S.v)}${suffixEn}`);
    else if (S.kind === "range") parts.push(ru ? `с ${S.a}-го по ${S.b}-е число${suffixRu}` : `on days ${S.a}–${S.b}${suffixEn}`);
    else if (S.kind === "step") {
      if (S.step === 2 && S.from === 1 && !S.to) parts.push(ru ? "по нечётным числам" : "on odd days of the month");
      else if (S.step === 2 && S.from === 2 && !S.to) parts.push(ru ? "по чётным числам" : "on even days of the month");
      else parts.push(ru ? `каждые ${S.step} ${plural("ru", S.step, RU.day)}, начиная с ${S.from}-го числа` : `every ${S.step} days starting on the ${ordEn(S.from)}`);
    } else if (S.kind === "list") parts.push(ru ? `${joinList(f.values.map((d) => `${d}-го`), locale)} числа${suffixRu}` : `on the ${joinList(f.values.map(ordEn), locale)}${suffixEn}`);
  }
  if (f.last) parts.push(f.lastOffset ? (ru ? `за ${f.lastOffset} ${plural("ru", f.lastOffset, RU.day)} до последнего дня месяца` : `${f.lastOffset} day${f.lastOffset > 1 ? "s" : ""} before the last day of the month`) : ru ? "в последний день месяца" : "on the last day of the month");
  if (f.lastWeekday) parts.push(ru ? "в последний будний день месяца" : "on the last weekday of the month");
  for (const n of f.nearestWeekday ?? []) parts.push(ru ? `в ближайший к ${n}-му числу будний день` : `on the weekday nearest the ${ordEn(n)}`);
  return joinList(parts, locale);
}

function monthPhrase(f: ParsedField, locale: Locale): string {
  const ru = locale === "ru";
  const S = shape(f, 12);
  if (S.kind === "all") return "";
  if (S.kind === "single") return ru ? `в ${RU.monPrep[S.v - 1]}` : `in ${EN.mon[S.v - 1]}`;
  if (S.kind === "range") return ru ? `с ${RU.monGen[S.a - 1]} по ${RU.monNom[S.b - 1]}` : `from ${EN.mon[S.a - 1]} through ${EN.mon[S.b - 1]}`;
  if (S.kind === "step") return ru ? `каждые ${S.step} ${plural("ru", S.step, RU.month)} (${f.values.map((m) => RU.monShort[m - 1]).join(", ")})` : `every ${S.step} months (${f.values.map((m) => EN.monShort[m - 1]).join(", ")})`;
  return ru ? `в ${joinList(f.values.map((m) => RU.monPrep[m - 1]), locale)}` : `in ${joinList(f.values.map((m) => EN.mon[m - 1]), locale)}`;
}

/* ───────────── public API ───────────── */

export function describe(e: CronExpr, locale: Locale): string {
  const ru = locale === "ru";
  if (e.reboot) return ru ? "Один раз при запуске системы (@reboot)" : "Once at system startup (@reboot)";
  const F = e.fields;
  const time = timeParts(e, locale);
  const monthAll = F.month.values.length === 12;
  const domRestricted = (F.dom.raw !== "*" && F.dom.raw !== "?" && !(F.dom.star && F.dom.values.length === 31)) || !!F.dom.last || !!F.dom.lastWeekday || !!F.dom.nearestWeekday;
  const dowRestricted = F.dow.values.length < 7 || !!F.dow.nthDow || !!F.dow.lastDow;

  // "1 января" when a single day of a single month
  const singleDate = e.fields.dom.values.length === 1 && !F.dom.star && !F.dom.last && !F.dom.lastWeekday && !F.dom.nearestWeekday && F.month.values.length === 1 && !dowRestricted;
  let day = "";
  let month = "";
  if (singleDate) {
    const d = F.dom.values[0];
    const m = F.month.values[0];
    day = ru ? `${d} ${RU.monGen[m - 1]}` : `on ${EN.mon[m - 1]} ${d}`;
  } else {
    const dom = domRestricted ? domPhrase(F.dom, locale, monthAll) : "";
    const dow = dowRestricted ? dowPhrase(F.dow, locale) : "";
    if (dom && dow) day = e.dialect === "quartz" ? dom || dow : ru ? `${dom} или ${dow}` : `${dom} or ${dow}`;
    else day = dom || dow;
    month = monthPhrase(F.month, locale);
  }
  let year = "";
  if (!F.year.star && F.year.values.length) {
    const ys = F.year.values;
    year = ys.length === 1 ? (ru ? `в ${ys[0]} году` : `in ${ys[0]}`) : ru ? `в ${joinList(ys.map(String), locale)} годах` : `in ${joinList(ys.map(String), locale)}`;
  }
  let t = time.text;
  if (time.specific && !day) t = ru ? `каждый день ${t}` : `every day ${t}`;
  const parts = [t, day, month, year].filter(Boolean);
  let out = parts.join(ru ? ", " : ", ");
  // natural joins: "В 09:00 по будням", "At 09:00 on weekdays"
  if (time.specific && parts.length > 1) out = `${t} ${parts.slice(1).join(", ")}`;
  return cap(out);
}

const FIELD_NAME: Record<FieldName, { ru: string; en: string }> = {
  second: { ru: "Секунды", en: "Seconds" },
  minute: { ru: "Минуты", en: "Minutes" },
  hour: { ru: "Часы", en: "Hours" },
  dom: { ru: "День месяца", en: "Day of month" },
  month: { ru: "Месяц", en: "Month" },
  dow: { ru: "День недели", en: "Day of week" },
  year: { ru: "Год", en: "Year" },
};

export function fieldLabel(f: FieldName, locale: Locale): string {
  return FIELD_NAME[f][locale];
}

/** Row per field for the breakdown table: [field, raw, meaning]. */
export function fieldRows(e: CronExpr, locale: Locale): [string, string, string][] {
  const ru = locale === "ru";
  const names: FieldName[] = e.dialect === "unix" ? ["minute", "hour", "dom", "month", "dow"] : ["second", "minute", "hour", "dom", "month", "dow", ...(e.fields.year.raw !== "*" || e.source.split(" ").length === 7 ? (["year"] as FieldName[]) : [])];
  return names.map((n) => {
    const f = e.fields[n];
    let meaning: string;
    if (f.raw === "*" || f.raw === "?") meaning = ru ? (f.raw === "?" ? "не задано (?)" : "любое значение") : f.raw === "?" ? "no specific value (?)" : "any value";
    else if (n === "dow") meaning = [dowPhrase(f, locale), f.values.length && f.values.length < 7 ? `(${f.values.map((d) => (ru ? RU.dowShort[d] : EN.dowShort[d])).join(", ")})` : ""].filter(Boolean).join(" ");
    else if (n === "month") meaning = f.values.map((m) => (ru ? RU.monShort[m - 1] : EN.monShort[m - 1])).join(", ");
    else if (n === "dom" && (f.last || f.lastWeekday || f.nearestWeekday)) meaning = domPhrase(f, locale, false);
    else {
      const v = f.values;
      meaning = v.length > 14 ? `${v.slice(0, 12).join(", ")}, … ${v[v.length - 1]} (${v.length})` : v.join(", ");
    }
    return [FIELD_NAME[n][locale], f.raw, meaning];
  });
}
