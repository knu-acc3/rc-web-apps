import type { Ymd } from "./dates";

/**
 * Islamic holiday dates 2000–2040 from the Umm al-Qura calendar (the official
 * civil calendar of Saudi Arabia; generated with ICU `islamic-umalqura`, which
 * embeds the published Umm al-Qura tables). Columns: 1 Ramadan, 1 Shawwal
 * (Eid al-Fitr / Ораза айт), 10 Dhu al-Hijjah (Eid al-Adha / Курбан айт), as MMDD.
 * A year may contain an event twice (e.g. Eid al-Fitr in January and December 2033).
 *
 * Religious authorities (e.g. the Spiritual Administration of Muslims of Kazakhstan)
 * announce the final date; it can differ from this table by one day.
 */
const TABLE: Record<number, [string, string, string]> = {
  2000: ["1127", "0108 1227", "0316"],
  2001: ["1116", "1216", "0305"],
  2002: ["1106", "1205", "0222"],
  2003: ["1026", "1125", "0211"],
  2004: ["1015", "1114", "0201"],
  2005: ["1004", "1103", "0121"],
  2006: ["0924", "1023", "0110 1231"],
  2007: ["0913", "1013", "1220"],
  2008: ["0901", "1001", "1208"],
  2009: ["0822", "0920", "1127"],
  2010: ["0811", "0910", "1116"],
  2011: ["0801", "0830", "1106"],
  2012: ["0720", "0819", "1026"],
  2013: ["0709", "0808", "1015"],
  2014: ["0628", "0728", "1004"],
  2015: ["0618", "0717", "0923"],
  2016: ["0606", "0706", "0911"],
  2017: ["0527", "0625", "0901"],
  2018: ["0516", "0615", "0821"],
  2019: ["0506", "0604", "0811"],
  2020: ["0424", "0524", "0731"],
  2021: ["0413", "0513", "0720"],
  2022: ["0402", "0502", "0709"],
  2023: ["0323", "0421", "0628"],
  2024: ["0311", "0410", "0616"],
  2025: ["0301", "0330", "0606"],
  2026: ["0218", "0320", "0527"],
  2027: ["0208", "0309", "0516"],
  2028: ["0128", "0226", "0505"],
  2029: ["0116", "0214", "0424"],
  2030: ["0105 1226", "0204", "0413"],
  2031: ["1216", "0124", "0402"],
  2032: ["1204", "0114", "0322"],
  2033: ["1123", "0103 1223", "0312"],
  2034: ["1112", "1212", "0301"],
  2035: ["1101", "1201", "0219"],
  2036: ["1021", "1119", "0208"],
  2037: ["1010", "1109", "0127"],
  2038: ["0930", "1029", "0116"],
  2039: ["0919", "1019", "0105 1226"],
  2040: ["0908", "1007", "1215"],
};

export const ISLAMIC_YEARS = { min: 2000, max: 2040 } as const;
type IslamicEvent = "ramadan" | "fitr" | "adha";
const COL: Record<IslamicEvent, number> = { ramadan: 0, fitr: 1, adha: 2 };

/** All dates of the event in a Gregorian year (0, 1 or 2 dates); empty outside 2000–2040. */
export function islamicDates(event: IslamicEvent, y: number): Ymd[] {
  const row = TABLE[y];
  if (!row) return [];
  return row[COL[event]].split(" ").map((s) => ({ y, m: +s.slice(0, 2), d: +s.slice(2) }));
}

