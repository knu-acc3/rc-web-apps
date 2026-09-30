/**
 * Wrong keyboard layout fixer: QWERTY (US) ↔ ЙЦУКЕН (Russian, Windows).
 * Each key maps to the character the same physical key produces in the other layout.
 */

// Same physical keys, unshifted and shifted, US layout vs Russian layout.
const EN = "`qwertyuiop[]asdfghjkl;'zxcvbnm,./" + '~QWERTYUIOP{}ASDFGHJKL:"ZXCVBNM<>?' + '@#$^&|';
const RU = "ёйцукенгшщзхъфывапролджэячсмитьбю." + "ЁЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ," + '"№;:?/';

const EN_TO_RU = new Map<string, string>();
const RU_TO_EN = new Map<string, string>();
for (let i = 0; i < EN.length; i++) {
  EN_TO_RU.set(EN[i], RU[i]);
  RU_TO_EN.set(RU[i], EN[i]);
}

export type LayoutDirection = "en-ru" | "ru-en";

/** Guess the direction: the script with more letters is the one typed by mistake. */
export function detectDirection(s: string): LayoutDirection {
  const lat = (s.match(/[A-Za-z]/g) ?? []).length;
  const cyr = (s.match(/[А-Яа-яЁё]/g) ?? []).length;
  return cyr > lat ? "ru-en" : "en-ru";
}

export function convertLayout(s: string, direction: LayoutDirection | "auto" = "auto"): string {
  const dir = direction === "auto" ? detectDirection(s) : direction;
  const map = dir === "en-ru" ? EN_TO_RU : RU_TO_EN;
  let out = "";
  for (const ch of s) out += map.get(ch) ?? ch;
  return out;
}

/** Pairs for the reference table: [en key, ru key]. */
export const LAYOUT_PAIRS: [string, string][] = [...EN].map((c, i) => [c, RU[i]]);
