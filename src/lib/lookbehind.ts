/**
 * Regex lookbehind (`(?<!…)`, `(?<=…)`) is not supported before Safari 16.4, and a regex literal that uses it makes
 * the whole script fail to parse there. These helpers emulate a negative lookbehind of one character:
 * `/(?<![\p{L}])x/g` becomes `execAllNotAfter(text, /x/g, /[\p{L}]/u)` with exactly the same matches.
 */

/** The character (code point) right before index `i`, or "" at the start. */
function charBefore(s: string, i: number): string {
  if (i <= 0) return "";
  const lo = s.charCodeAt(i - 1);
  if (lo >= 0xdc00 && lo <= 0xdfff && i >= 2) {
    const hi = s.charCodeAt(i - 2);
    if (hi >= 0xd800 && hi <= 0xdbff) return s.slice(i - 2, i);
  }
  return s[i - 1];
}

function step(s: string, i: number): number {
  const c = s.charCodeAt(i);
  return c >= 0xd800 && c <= 0xdbff && i + 1 < s.length ? 2 : 1;
}

/** All matches of `re` whose preceding character does not match `notAfter` (like `(?<!notAfter)re`). */
export function execAllNotAfter(s: string, re: RegExp, notAfter: RegExp | null): RegExpExecArray[] {
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  const out: RegExpExecArray[] = [];
  let i = 0;
  while (i <= s.length) {
    g.lastIndex = i;
    const m = g.exec(s);
    if (!m) break;
    const at = m.index;
    if (notAfter && notAfter.test(charBefore(s, at))) {
      // The lookbehind failed here: the regex engine would retry one position later.
      i = at + step(s, at);
      continue;
    }
    out.push(m);
    i = m[0].length ? at + m[0].length : at + step(s, at);
  }
  return out;
}

/**
 * `s.replace(re, fn)` with a negative one-character lookbehind. `fn` receives the match; return the replacement.
 * Replaces at most `limit` matches (all by default).
 */
export function replaceNotAfter(s: string, re: RegExp, notAfter: RegExp | null, fn: (m: RegExpExecArray) => string, limit = Infinity): string {
  let out = "";
  let last = 0;
  let n = 0;
  for (const m of execAllNotAfter(s, re, notAfter)) {
    if (n++ >= limit) break;
    out += s.slice(last, m.index) + fn(m);
    last = m.index + m[0].length;
  }
  return out + s.slice(last);
}

/** Expand `$1`, `$&`, `$<name>` and `$$` in a replacement string the way `String.prototype.replace` does. */
export function expandReplacement(rep: string, m: RegExpExecArray): string {
  return rep.replace(/\$(\$|&|`|'|\d{1,2}|<([^>]+)>)/g, (tok: string, t: string, name?: string) => {
    if (t === "$") return "$";
    if (t === "&") return m[0];
    if (name !== undefined) return m.groups?.[name] ?? "";
    if (t === "`" || t === "'") return tok;
    const idx = Number(t);
    return idx >= 1 && idx < m.length ? (m[idx] ?? "") : tok;
  });
}
