
export function escapeJs(s: string, quote: "'" | '"' | "`" = '"'): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (ch === "\\") out += "\\\\";
    else if (ch === quote) out += `\\${ch}`;
    else if (quote === "`" && ch === "$") out += "\\$";
    else if (ch === "\n") out += quote === "`" ? "\n" : "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (ch === "\b") out += "\\b";
    else if (ch === "\f") out += "\\f";
    else if (ch === "\v") out += "\\v";
    else if (c === 0) out += "\\0";
    else if (c < 0x20 || c === 0x7f) out += `\\x${c.toString(16).padStart(2, "0")}`;
    else if (c === 0x2028 || c === 0x2029) out += `\\u${c.toString(16)}`;
    else out += ch;
  }
  return quote + out + quote;
}

export function unescapeJs(input: string): string {
  let s = input.trim();
  if (s.length >= 2 && /^['"`]/.test(s) && s[s.length - 1] === s[0]) s = s.slice(1, -1);
  return s.replace(/\\(u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|([0-7]{1,3})|\r?\n|(.))/g, (m, _all, cp, u4, x2, oct, other) => {
    if (cp) return String.fromCodePoint(parseInt(cp, 16));
    if (u4) return String.fromCharCode(parseInt(u4, 16));
    if (x2) return String.fromCharCode(parseInt(x2, 16));
    if (oct) return oct === "0" ? "\0" : String.fromCharCode(parseInt(oct, 8));
    if (other === undefined) return ""; // line continuation
    const map: Record<string, string> = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v" };
    return map[other] ?? other;
  });
}

export function escapeSql(s: string, backslash = false): string {
  let t = s.replace(/'/g, "''");
  if (backslash) t = t.replace(/\\/g, "\\\\").replace(/\0/g, "\\0").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\x1a/g, "\\Z");
  return `'${t}'`;
}

export function unescapeSql(input: string): string {
  let s = input.trim();
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1);
  return s.replace(/''/g, "'");
}

/** Like RegExp.escape: escapes syntax characters so the text matches literally. */
export function escapeRegex(s: string): string {
  return s.replace(/[\\^$.*+?()[\]{}|/-]/g, "\\$&");
}

export function unescapeRegex(s: string): string {
  return s.replace(/\\([\\^$.*+?()[\]{}|/-])/g, "$1");
}

export function escapeHtml(s: string, attr = false): string {
  const t = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return attr ? t.replace(/"/g, "&quot;").replace(/'/g, "&#39;") : t;
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function unescapeXml(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (m, e: string) => {
    const map: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    if (map[e]) return map[e];
    const cp = e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
  });
}

/** POSIX shell: wrap in single quotes; ' becomes '\'' */
export function escapeShell(s: string): string {
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/** Parse one POSIX-shell word: quotes and backslashes removed. */
export function unescapeShell(input: string): string {
  const s = input.trim();
  let out = "";
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "'") {
      const end = s.indexOf("'", i + 1);
      out += s.slice(i + 1, end < 0 ? s.length : end);
      i = end < 0 ? s.length : end + 1;
    } else if (c === '"') {
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === "\\" && /["\\$`]/.test(s[i + 1] ?? "")) {
          out += s[i + 1];
          i += 2;
        } else out += s[i++];
      }
      i++;
    } else if (c === "\\") {
      out += s[i + 1] ?? "";
      i += 2;
    } else out += s[i++];
  }
  return out;
}

export function escapeCsv(s: string, delimiter = ","): string {
  return /["\r\n]/.test(s) || s.includes(delimiter) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function unescapeCsv(input: string): string {
  const s = input.trim();
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).replace(/""/g, '"');
  return s;
}
