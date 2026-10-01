/**
 * Export a JavaScript regex (pattern + flags + optional replacement) to other languages,
 * converting syntax where it differs and warning where it can't be converted.
 */
import { captureGroups } from "./engine";

export type Lang = "js" | "python" | "php" | "java" | "go" | "csharp";

export type Warning = "py-unicode-props" | "py-lookbehind" | "go-lookaround" | "go-backref" | "sticky" | "flag-v" | "java-unicode-escape" | "cs-unicode-escape";

interface Exported {
  code: string;
  warnings: Warning[];
}

const hasLookaround = (p: string) => /\(\?<?[=!]/.test(p);
const hasLookbehind = (p: string) => /\(\?<[=!]/.test(p);
const hasBackref = (p: string) => /\\[1-9]|\\k</.test(p);

/** Escape unescaped "/" (and raw line breaks) for a JS regex literal. */
export function jsLiteralBody(p: string): string {
  let out = "";
  let inClass = false;
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === "\\") {
      out += c + (p[i + 1] ?? "");
      i++;
      continue;
    }
    if (c === "[") inClass = true;
    else if (c === "]") inClass = false;
    if (c === "/" && !inClass) out += "\\/";
    else if (c === "\n") out += "\\n";
    else if (c === "\r") out += "\\r";
    else out += c;
  }
  return out || "(?:)";
}

/** Convert JS named-group syntax to Python / Go style. */
const toPyGroups = (p: string) => p.replace(/\(\?<([A-Za-z_]\w*)>/g, "(?P<$1>").replace(/\\k<([A-Za-z_]\w*)>/g, "(?P=$1)");

/** $1 / $<name> / $& → \g<1> / \g<name> / \g<0> */
function toPyReplacement(r: string): string {
  return r.replace(/\\/g, "\\\\").replace(/\$(\$|&|\d{1,2}|<([^>]+)>|`|')/g, (m, x: string, name?: string) => {
    if (x === "$") return "$";
    if (x === "&") return "\\g<0>";
    if (name) return `\\g<${name}>`;
    if (/^\d+$/.test(x)) return `\\g<${Number(x)}>`;
    return m;
  });
}

function pyString(s: string): string {
  if (!s.includes("'") && !/\\$/.test(s) && !/[\r\n]/.test(s)) return `r'${s}'`;
  if (!s.includes('"') && !/\\$/.test(s) && !/[\r\n]/.test(s)) return `r"${s}"`;
  return JSON.stringify(s);
}

const javaString = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`;

/** JS replacement → numbered-only replacement (PHP preg_replace doesn't know $<name>). */
function numberedReplacement(r: string, pattern: string, style: "php" | "java" | "go" | "cs"): string {
  const names = captureGroups(pattern);
  return r.replace(/\$(\$|&|\d{1,2}|<([^>]+)>)/g, (m, x: string, name?: string) => {
    if (x === "$") return style === "go" ? "$$" : style === "php" ? "\\$" : style === "java" ? "\\$" : "$$";
    if (x === "&") return style === "php" ? "$0" : style === "java" ? "$0" : style === "go" ? "${0}" : "$0";
    if (name) {
      if (style === "php") {
        const idx = names.indexOf(name);
        return idx >= 0 ? `\${${idx + 1}}` : m;
      }
      return `\${${name}}`;
    }
    return style === "go" ? `\${${Number(x)}}` : `$${x}`;
  });
}

export function exportRegex(lang: Lang, pattern: string, flags: string, replacement?: string): Exported {
  const warnings = new Set<Warning>();
  const g = flags.includes("g");
  const i = flags.includes("i");
  const m = flags.includes("m");
  const s = flags.includes("s");
  const u = flags.includes("u") || flags.includes("v");
  if (flags.includes("y") && lang !== "js") warnings.add("sticky");
  if (flags.includes("v") && lang !== "js") warnings.add("flag-v");
  const lines: string[] = [];

  switch (lang) {
    case "js": {
      lines.push(`const re = /${jsLiteralBody(pattern)}/${flags};`);
      if (replacement !== undefined) lines.push(`const result = text.replace(re, ${JSON.stringify(replacement)});`);
      else if (g) lines.push("for (const m of text.matchAll(re)) {", "  console.log(m.index, m[0], m.groups);", "}");
      else lines.push("const m = text.match(re);", "if (m) console.log(m.index, m[0], m.groups);");
      break;
    }
    case "python": {
      if (/\\p\{/i.test(pattern)) warnings.add("py-unicode-props");
      if (hasLookbehind(pattern) && /\(\?<[=!][^)]*[*+?{]/.test(pattern)) warnings.add("py-lookbehind");
      const pf = [i && "re.IGNORECASE", m && "re.MULTILINE", s && "re.DOTALL"].filter(Boolean);
      const py = toPyGroups(pattern).replace(/\\u\{([0-9A-Fa-f]+)\}/g, (_x, h: string) => `\\U${h.padStart(8, "0")}`);
      lines.push("import re", "", `pattern = re.compile(${pyString(py)}${pf.length ? `, ${pf.join(" | ")}` : ""})`);
      if (replacement !== undefined) lines.push(`result = pattern.sub(${pyString(toPyReplacement(replacement))}, text${g ? "" : ", count=1"})`);
      else if (g) lines.push("for m in pattern.finditer(text):", "    print(m.start(), m.group(0), m.groupdict())");
      else lines.push("m = pattern.search(text)", "if m:", "    print(m.start(), m.group(0), m.groupdict())");
      break;
    }
    case "php": {
      const mods = `${i ? "i" : ""}${m ? "m" : ""}${s ? "s" : ""}${u ? "u" : ""}`;
      const body = pattern.replace(/(^|[^\\])((?:\\\\)*)\//g, "$1$2\\/").replace(/\\u\{([0-9A-Fa-f]+)\}/g, "\\x{$1}");
      const lit = `'/${body.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}/${mods}'`;
      if (replacement !== undefined) {
        const rep = numberedReplacement(replacement, pattern, "php");
        lines.push(`$result = preg_replace(${lit}, '${rep.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}', $text${g ? "" : ", 1"});`);
      } else if (g) lines.push(`preg_match_all(${lit}, $text, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);`, "print_r($matches);");
      else lines.push(`if (preg_match(${lit}, $text, $m, PREG_OFFSET_CAPTURE)) {`, "    print_r($m);", "}");
      break;
    }
    case "java": {
      if (/\\u\{/.test(pattern)) warnings.add("java-unicode-escape");
      const jf = [i && "Pattern.CASE_INSENSITIVE", i && u && "Pattern.UNICODE_CASE", m && "Pattern.MULTILINE", s && "Pattern.DOTALL", u && "Pattern.UNICODE_CHARACTER_CLASS"].filter(Boolean);
      lines.push("import java.util.regex.*;", "", `Pattern p = Pattern.compile(${javaString(pattern)}${jf.length ? `, ${jf.join(" | ")}` : ""});`, "Matcher m = p.matcher(text);");
      if (replacement !== undefined) lines.push(`String result = m.${g ? "replaceAll" : "replaceFirst"}(${javaString(numberedReplacement(replacement, pattern, "java"))});`);
      else if (g) lines.push("while (m.find()) {", "    System.out.println(m.start() + \": \" + m.group());", "}");
      else lines.push("if (m.find()) {", "    System.out.println(m.start() + \": \" + m.group());", "}");
      break;
    }
    case "go": {
      if (hasLookaround(pattern)) warnings.add("go-lookaround");
      if (hasBackref(pattern)) warnings.add("go-backref");
      const inline = `${i || m || s ? `(?${i ? "i" : ""}${m ? "m" : ""}${s ? "s" : ""})` : ""}`;
      const gp = inline + toPyGroups(pattern).replace(/\\u\{([0-9A-Fa-f]+)\}/g, "\\x{$1}").replace(/\\u([0-9A-Fa-f]{4})/g, "\\x{$1}");
      const lit = gp.includes("`") ? JSON.stringify(gp) : `\`${gp}\``;
      lines.push('import "regexp"', "", `re := regexp.MustCompile(${lit})`);
      if (replacement !== undefined) lines.push(`result := re.ReplaceAllString(text, ${JSON.stringify(numberedReplacement(replacement, pattern, "go"))})${g ? "" : " // Go replaces every match; there is no replace-first"}`);
      else if (g) lines.push("for _, m := range re.FindAllStringSubmatchIndex(text, -1) {", "\tfmt.Println(m[0], text[m[0]:m[1]])", "}");
      else lines.push("if loc := re.FindStringIndex(text); loc != nil {", "\tfmt.Println(loc[0], text[loc[0]:loc[1]])", "}");
      break;
    }
    case "csharp": {
      if (/\\u\{/.test(pattern)) warnings.add("cs-unicode-escape");
      const opts = [i && "RegexOptions.IgnoreCase", m && "RegexOptions.Multiline", s && "RegexOptions.Singleline"].filter(Boolean);
      const lit = `@"${pattern.replace(/"/g, '""')}"`;
      lines.push("using System.Text.RegularExpressions;", "", `var re = new Regex(${lit}${opts.length ? `, ${opts.join(" | ")}` : ""});`);
      if (replacement !== undefined) {
        const rep = numberedReplacement(replacement, pattern, "cs");
        lines.push(g ? `var result = re.Replace(text, @"${rep.replace(/"/g, '""')}");` : `var result = re.Replace(text, @"${rep.replace(/"/g, '""')}", 1);`);
      } else if (g) lines.push("foreach (Match m in re.Matches(text))", "    Console.WriteLine($\"{m.Index}: {m.Value}\");");
      else lines.push("var m = re.Match(text);", "if (m.Success) Console.WriteLine($\"{m.Index}: {m.Value}\");");
      break;
    }
  }
  return { code: lines.join("\n"), warnings: [...warnings] };
}
