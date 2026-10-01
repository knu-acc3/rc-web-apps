/** Find & replace engine (runs inside a Web Worker for regular expressions). */
import { execAllNotAfter, expandReplacement } from "@/lib/lookbehind";
import { literalPattern, unescapeReplacement, WORD_CHAR } from "./textOps";

export interface ReplaceRequest {
  text: string;
  find: string;
  replace: string;
  regex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  /** ^ and $ match at every line (m flag). On by default for regex. */
  multiline: boolean;
  /** . matches line breaks (s flag). */
  dotAll: boolean;
  /** Replace all matches, not only the first. */
  all: boolean;
  /** Interpret \n, \t in the replacement. */
  escapes: boolean;
}

export type ReplaceResult = { ok: true; text: string; count: number } | { ok: false; error: string };

export function buildRegExp(
  r: Pick<ReplaceRequest, "find" | "regex" | "caseSensitive" | "wholeWord" | "multiline" | "dotAll">,
  global: boolean,
): { re: RegExp; notAfter: RegExp | null } {
  const flags = `${global ? "g" : ""}u${r.caseSensitive ? "" : "i"}${r.regex && r.multiline ? "m" : ""}${r.regex && r.dotAll ? "s" : ""}`;
  const source = r.regex ? (r.wholeWord ? `(?:${r.find})(?![\\p{L}\\p{N}\\p{M}_])` : r.find) : literalPattern(r.find, r.wholeWord);
  return { re: new RegExp(source, flags), notAfter: r.wholeWord ? WORD_CHAR : null };
}

export function replaceText(r: ReplaceRequest): ReplaceResult {
  if (!r.find) return { ok: true, text: r.text, count: 0 };
  let built: ReturnType<typeof buildRegExp>;
  try {
    built = buildRegExp(r, true);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  const rep = r.escapes ? unescapeReplacement(r.replace) : r.replace;
  const matches = execAllNotAfter(r.text, built.re, built.notAfter);
  let out = "";
  let last = 0;
  for (const [i, m] of matches.entries()) {
    if (!r.all && i > 0) break;
    out += r.text.slice(last, m.index) + (r.regex ? expandReplacement(rep, m) : rep);
    last = m.index + m[0].length;
  }
  return { ok: true, text: out + r.text.slice(last), count: matches.length };
}
