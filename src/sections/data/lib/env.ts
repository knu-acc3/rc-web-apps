/** dotenv (.env) parsing and writing. */
import { isObj, Num, Obj, type V } from "@/sections/code/kit/value";

interface EnvError {
  line: number;
  code: "bad-line" | "unclosed-quote";
}

export function parseEnv(text: string): { value: Obj; errors: EnvError[] } {
  const obj = new Obj();
  const errors: EnvError[] = [];
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/.exec(line);
    if (!m) {
      errors.push({ line: i + 1, code: "bad-line" });
      continue;
    }
    const [, key, rest] = m;
    let value: string;
    if (rest.startsWith('"')) {
      let body = rest.slice(1);
      let end = findClose(body, '"');
      let j = i;
      while (end < 0 && j + 1 < lines.length) {
        j++;
        body += `\n${lines[j]}`;
        end = findClose(body, '"');
      }
      if (end < 0) {
        errors.push({ line: i + 1, code: "unclosed-quote" });
        continue;
      }
      i = j;
      value = body.slice(0, end).replace(/\\([nrt"\\$])/g, (_x, c: string) => ({ n: "\n", r: "\r", t: "\t" })[c as "n"] ?? c);
    } else if (rest.startsWith("'")) {
      const end = rest.indexOf("'", 1);
      if (end < 0) {
        errors.push({ line: i + 1, code: "unclosed-quote" });
        continue;
      }
      value = rest.slice(1, end);
    } else value = rest.replace(/\s+#.*$/, "").trim();
    obj.entries.push([key, value]);
  }
  return { value: obj, errors };
}

function findClose(s: string, q: string): number {
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\") {
      i++;
      continue;
    }
    if (s[i] === q) return i;
  }
  return -1;
}

function envValue(v: V): string {
  if (v === null) return "";
  if (typeof v === "boolean") return String(v);
  if (v instanceof Num) return v.raw;
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

/** Flatten nested objects into KEY__SUB=value lines. */
export function writeEnv(v: V, o: { separator?: string; upper?: boolean; prefix?: string } = {}): string {
  const sep = o.separator ?? "__";
  const lines: string[] = [];
  const walk = (x: V, path: string[]) => {
    if (isObj(x) && x.entries.length) {
      for (const [k, e] of x.entries) walk(e, [...path, k]);
      return;
    }
    if (Array.isArray(x) && x.length && x.some((e) => isObj(e) || Array.isArray(e))) {
      x.forEach((e, i) => walk(e, [...path, String(i)]));
      return;
    }
    let key = (o.prefix ?? "") + path.join(sep);
    key = key.replace(/[^A-Za-z0-9_]/g, "_").replace(/^(?=\d)/, "_");
    if (o.upper !== false) key = key.toUpperCase();
    const val = Array.isArray(x) ? x.map(envValue).join(",") : envValue(x);
    const needs = /[\s#"'$\\]/.test(val) || val === "";
    lines.push(`${key || "VALUE"}=${needs ? `"${val.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/\n/g, "\\n")}"` : val}`);
  };
  walk(v, []);
  return lines.join("\n") + "\n";
}
