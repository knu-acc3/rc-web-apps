/** Regex execution (run inside the worker) — capped, zero-length-safe, with groups and indices. */

export interface Match {
  index: number;
  end: number;
  text: string;
  groups: (string | undefined)[];
  named?: Record<string, string | undefined>;
  /** Group spans when the d flag is set */
  spans?: ([number, number] | undefined)[];
}

export interface MatchResult {
  matches: Match[];
  capped: boolean;
}

/** All matches (or the first one without g/y), at most `cap`. Zero-length matches advance by one code point with u/v. */
export function findAll(pattern: string, flags: string, text: string, cap = 10000): MatchResult {
  const global = flags.includes("g") || flags.includes("y");
  const re = new RegExp(pattern, global ? flags : flags + "g");
  const unicode = flags.includes("u") || flags.includes("v");
  const matches: Match[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const mi = m as RegExpExecArray & { indices?: ([number, number] | undefined)[] };
    matches.push({
      index: m.index,
      end: m.index + m[0].length,
      text: m[0],
      groups: m.slice(1),
      named: m.groups ? { ...m.groups } : undefined,
      spans: mi.indices ? mi.indices.slice(1) : undefined,
    });
    if (!global || matches.length >= cap) return { matches, capped: global && matches.length >= cap && re.lastIndex < text.length };
    if (m[0].length === 0) {
      const cp = unicode ? text.codePointAt(re.lastIndex) : undefined;
      re.lastIndex += cp !== undefined && cp > 0xffff ? 2 : 1;
      if (re.lastIndex > text.length) break;
    }
  }
  return { matches, capped: false };
}

/** String.prototype.replace semantics ($1, $<name>, $&, $`, $', $$). Without g only the first match. */
export function replace(pattern: string, flags: string, text: string, replacement: string): string {
  return text.replace(new RegExp(pattern, flags), replacement);
}

/** Names (or null) of capturing groups in order of their opening parenthesis. */
export function captureGroups(pattern: string): (string | null)[] {
  const out: (string | null)[] = [];
  let inClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "\\") {
      i++;
      continue;
    }
    if (inClass) {
      if (c === "]") inClass = false;
      continue;
    }
    if (c === "[") {
      inClass = true;
      continue;
    }
    if (c !== "(") continue;
    if (pattern[i + 1] !== "?") out.push(null);
    else {
      const m = /^\(\?P?<([A-Za-z_$][\w$]*)>/.exec(pattern.slice(i));
      if (m) out.push(m[1]);
    }
  }
  return out;
}
