/** Find & replace engine (runs inside a Web Worker for regular expressions). */
import { literalPattern, unescapeReplacement } from "./textOps";

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

export function buildRegExp(r: Pick<ReplaceRequest, "find" | "regex" | "caseSensitive" | "wholeWord" | "multiline" | "dotAll">, global: boolean): RegExp {
  const flags = `${global ? "g" : ""}u${r.caseSensitive ? "" : "i"}${r.regex && r.multiline ? "m" : ""}${r.regex && r.dotAll ? "s" : ""}`;
  const source = r.regex
    ? r.wholeWord
      ? `(?<![\\p{L}\\p{N}\\p{M}_])(?:${r.find})(?![\\p{L}\\p{N}\\p{M}_])`
      : r.find
    : literalPattern(r.find, r.wholeWord);
  return new RegExp(source, flags);
}

export function replaceText(r: ReplaceRequest): ReplaceResult {
  if (!r.find) return { ok: true, text: r.text, count: 0 };
  let re: RegExp;
  try {
    re = buildRegExp(r, true);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  const rep = r.escapes ? unescapeReplacement(r.replace) : r.replace;
  let count = 0;
  let firstDone = false;
  const text = r.text.replace(re, (...args: unknown[]) => {
    count++;
    if (!r.all && firstDone) return args[0] as string;
    firstDone = true;
    if (!r.regex) return rep;
    // Expand $1, $<name>, $&, $$ like String.prototype.replace does.
    const hasGroups = typeof args[args.length - 1] === "object" && args[args.length - 1] !== null;
    const groups = (hasGroups ? args[args.length - 1] : undefined) as Record<string, string> | undefined;
    const caps = args.slice(1, hasGroups ? -3 : -2) as (string | undefined)[];
    const match = args[0] as string;
    return rep.replace(/\$(\$|&|`|'|\d{1,2}|<([^>]+)>)/g, (m, tok: string, name?: string) => {
      if (tok === "$") return "$";
      if (tok === "&") return match;
      if (name !== undefined) return groups?.[name] ?? "";
      if (tok === "`" || tok === "'") return m;
      const idx = Number(tok);
      return idx >= 1 && idx <= caps.length ? (caps[idx - 1] ?? "") : m;
    });
  });
  return { ok: true, text, count };
}
