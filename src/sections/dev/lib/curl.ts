/**
 * cURL command → request model → fetch / axios / Python requests code.
 * Understands bash quoting ('…', "…", $'…', backslash-newline) and Windows cmd ^ continuations.
 */
import { bytesToBase64, utf8Encode } from "@/sections/code/kit/bytes";

export function shellSplit(input: string): string[] {
  const s = input.replace(/\^\r?\n/g, " ").replace(/\\\r?\n/g, " ");
  const out: string[] = [];
  let cur = "";
  let has = false;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      if (has) out.push(cur);
      cur = "";
      has = false;
      i++;
      continue;
    }
    has = true;
    if (c === "'") {
      const end = s.indexOf("'", i + 1);
      if (end < 0) throw new Error("quote");
      cur += s.slice(i + 1, end);
      i = end + 1;
    } else if (c === "$" && s[i + 1] === "'") {
      i += 2;
      while (i < s.length && s[i] !== "'") {
        if (s[i] === "\\" && i + 1 < s.length) {
          const n = s[i + 1];
          const map: Record<string, string> = { n: "\n", t: "\t", r: "\r", "\\": "\\", "'": "'", '"': '"', "0": "\0" };
          if (n === "x") {
            cur += String.fromCharCode(parseInt(s.slice(i + 2, i + 4), 16));
            i += 4;
            continue;
          }
          if (n === "u") {
            cur += String.fromCharCode(parseInt(s.slice(i + 2, i + 6), 16));
            i += 6;
            continue;
          }
          cur += map[n] ?? n;
          i += 2;
        } else cur += s[i++];
      }
      if (i >= s.length) throw new Error("quote");
      i++;
    } else if (c === '"') {
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === "\\" && /["\\$`\n]/.test(s[i + 1] ?? "")) {
          cur += s[i + 1];
          i += 2;
        } else cur += s[i++];
      }
      if (i >= s.length) throw new Error("quote");
      i++;
    } else if (c === "\\" && i + 1 < s.length) {
      cur += s[i + 1];
      i += 2;
    } else if (c === "^" && s[i + 1] === '"') {
      i++; // cmd escape before a quote
    } else {
      cur += c;
      i++;
    }
  }
  if (has) out.push(cur);
  return out;
}

interface FormField {
  name: string;
  value: string;
  file?: string;
}

interface CurlRequest {
  url: string;
  method: string;
  headers: [string, string][];
  body?: { kind: "raw" | "json"; text: string } | { kind: "form"; fields: FormField[] };
  insecure: boolean;
  compressed: boolean;
  location: boolean;
  warnings: string[];
}

const NO_ARG = new Set(["-L", "--location", "-k", "--insecure", "--compressed", "-s", "--silent", "-S", "--show-error", "-v", "--verbose", "-i", "--include", "-I", "--head", "-G", "--get", "-f", "--fail", "--http1.1", "--http2", "-#", "--progress-bar", "-g", "--globoff"]);

export function parseCurl(cmd: string): CurlRequest {
  const t = shellSplit(cmd.trim());
  if (t[0] !== "curl" && !/[/\\]curl(\.exe)?$/.test(t[0] ?? "")) throw new Error("not-curl");
  const req: CurlRequest = { url: "", method: "", headers: [], insecure: false, compressed: false, location: false, warnings: [] };
  const data: string[] = [];
  const form: FormField[] = [];
  let json = false;
  let get = false;
  let head = false;
  let user: string | undefined;
  for (let i = 1; i < t.length; i++) {
    let a = t[i];
    let val: string | undefined;
    const eq = a.startsWith("--") ? a.indexOf("=") : -1;
    if (eq > 0 && !NO_ARG.has(a.slice(0, eq))) {
      val = a.slice(eq + 1);
      a = a.slice(0, eq);
    }
    // short option with attached value: -XPOST, -H'…'
    if (/^-[XHdFAebu]./.test(a) && !a.startsWith("--")) {
      val = a.slice(2);
      a = a.slice(0, 2);
    }
    const next = () => val ?? t[++i] ?? "";
    switch (a) {
      case "-X":
      case "--request":
        req.method = next().toUpperCase();
        break;
      case "-H":
      case "--header": {
        const h = next();
        const c = h.indexOf(":");
        if (c > 0) req.headers.push([h.slice(0, c).trim(), h.slice(c + 1).trim()]);
        break;
      }
      case "-d":
      case "--data":
      case "--data-ascii":
      case "--data-binary":
      case "--data-raw": {
        const v = next();
        if (v.startsWith("@") && a !== "--data-raw") req.warnings.push("file-data");
        data.push(a === "--data-binary" || a === "--data-raw" ? v : v.replace(/\r?\n/g, ""));
        break;
      }
      case "--data-urlencode": {
        const v = next();
        const k = v.indexOf("=");
        data.push(k > 0 ? `${v.slice(0, k)}=${encodeURIComponent(v.slice(k + 1))}` : encodeURIComponent(v.replace(/^=/, "")));
        break;
      }
      case "--json":
        data.push(next());
        json = true;
        break;
      case "-F":
      case "--form":
      case "--form-string": {
        const v = next();
        const k = v.indexOf("=");
        const name = v.slice(0, k);
        const value = v.slice(k + 1);
        if (a !== "--form-string" && (value.startsWith("@") || value.startsWith("<"))) form.push({ name, value: "", file: value.slice(1).split(";")[0] });
        else form.push({ name, value });
        break;
      }
      case "-u":
      case "--user":
        user = next();
        break;
      case "-A":
      case "--user-agent":
        req.headers.push(["User-Agent", next()]);
        break;
      case "-e":
      case "--referer":
        req.headers.push(["Referer", next()]);
        break;
      case "-b":
      case "--cookie": {
        const v = next();
        if (v.includes("=")) req.headers.push(["Cookie", v]);
        else req.warnings.push("cookie-file");
        break;
      }
      case "--url":
        req.url = next();
        break;
      case "-G":
      case "--get":
        get = true;
        break;
      case "-I":
      case "--head":
        head = true;
        break;
      case "-L":
      case "--location":
        req.location = true;
        break;
      case "-k":
      case "--insecure":
        req.insecure = true;
        break;
      case "--compressed":
        req.compressed = true;
        break;
      case "-o":
      case "--output":
      case "--connect-timeout":
      case "-m":
      case "--max-time":
      case "--retry":
      case "-w":
      case "--write-out":
      case "--proxy":
      case "-x":
        next();
        break;
      default:
        if (a.startsWith("-") && !NO_ARG.has(a)) req.warnings.push(`unknown:${a}`);
        else if (!a.startsWith("-") && !req.url) req.url = a;
    }
  }
  if (!req.url) throw new Error("no-url");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(req.url)) req.url = `http://${req.url}`;
  if (user !== undefined) req.headers.push(["Authorization", `Basic ${bytesToBase64(utf8Encode(user.includes(":") ? user : `${user}:`))}`]);
  const hasHeader = (n: string) => req.headers.some(([k]) => k.toLowerCase() === n.toLowerCase());
  if (get && data.length) {
    req.url += (req.url.includes("?") ? "&" : "?") + data.join("&");
  } else if (form.length) {
    req.body = { kind: "form", fields: form };
  } else if (data.length) {
    const text = data.join("&");
    let isJson = json;
    if (!isJson) {
      try {
        const ct = req.headers.find(([k]) => k.toLowerCase() === "content-type")?.[1] ?? "";
        isJson = /json/i.test(ct) && typeof JSON.parse(text) === "object";
      } catch {
        isJson = false;
      }
    }
    req.body = { kind: isJson ? "json" : "raw", text };
    if (json) {
      if (!hasHeader("Content-Type")) req.headers.push(["Content-Type", "application/json"]);
      if (!hasHeader("Accept")) req.headers.push(["Accept", "application/json"]);
    } else if (!hasHeader("Content-Type")) req.headers.push(["Content-Type", "application/x-www-form-urlencoded"]);
  }
  if (!req.method) req.method = head ? "HEAD" : req.body ? "POST" : "GET";
  return req;
}

const q = (s: string) => JSON.stringify(s);
const pyq = (s: string) => (s.includes("\n") ? `"""${s.replace(/\\/g, "\\\\").replace(/"""/g, '\\"\\"\\"')}"""` : `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`);

function jsonLiteral(text: string, indent: number): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2).replace(/\n/g, `\n${" ".repeat(indent)}`);
  } catch {
    return q(text);
  }
}

export function toFetch(r: CurlRequest): string {
  const lines: string[] = [];
  const opts: string[] = [];
  if (r.method !== "GET") opts.push(`  method: ${q(r.method)},`);
  const headers = r.body?.kind === "form" ? r.headers.filter(([k]) => k.toLowerCase() !== "content-type") : r.headers;
  if (headers.length) opts.push(`  headers: {\n${headers.map(([k, v]) => `    ${q(k)}: ${q(v)},`).join("\n")}\n  },`);
  if (r.body?.kind === "form") {
    lines.push("const form = new FormData();");
    for (const f of r.body.fields) lines.push(f.file ? `form.append(${q(f.name)}, fileInput.files[0]); // ${f.file}` : `form.append(${q(f.name)}, ${q(f.value)});`);
    lines.push("");
    opts.push("  body: form,");
  } else if (r.body?.kind === "json") opts.push(`  body: JSON.stringify(${jsonLiteral(r.body.text, 2)}),`);
  else if (r.body) opts.push(`  body: ${q(r.body.text)},`);
  lines.push(`const response = await fetch(${q(r.url)}${opts.length ? `, {\n${opts.join("\n")}\n}` : ""});`);
  lines.push(r.method === "HEAD" ? "console.log(response.status, [...response.headers]);" : `const data = await response.${r.body?.kind === "json" || r.headers.some(([k, v]) => k.toLowerCase() === "accept" && /json/.test(v)) ? "json" : "text"}();`);
  return lines.join("\n");
}

export function toAxios(r: CurlRequest): string {
  const lines = ['import axios from "axios";', ""];
  const cfg: string[] = [`  method: ${q(r.method.toLowerCase())},`, `  url: ${q(r.url)},`];
  const headers = r.body?.kind === "form" ? r.headers.filter(([k]) => k.toLowerCase() !== "content-type") : r.headers;
  if (headers.length) cfg.push(`  headers: {\n${headers.map(([k, v]) => `    ${q(k)}: ${q(v)},`).join("\n")}\n  },`);
  if (r.body?.kind === "form") {
    lines.push("const form = new FormData();");
    for (const f of r.body.fields) lines.push(f.file ? `form.append(${q(f.name)}, fileInput.files[0]); // ${f.file}` : `form.append(${q(f.name)}, ${q(f.value)});`);
    lines.push("");
    cfg.push("  data: form,");
  } else if (r.body?.kind === "json") cfg.push(`  data: ${jsonLiteral(r.body.text, 2)},`);
  else if (r.body) cfg.push(`  data: ${q(r.body.text)},`);
  lines.push(`const response = await axios({\n${cfg.join("\n")}\n});`, "console.log(response.data);");
  return lines.join("\n");
}

export function toPython(r: CurlRequest): string {
  const lines = ["import requests", ""];
  const args: string[] = [pyq(r.url)];
  const headers = r.body?.kind === "form" ? r.headers.filter(([k]) => k.toLowerCase() !== "content-type") : r.body?.kind === "json" ? r.headers.filter(([k]) => k.toLowerCase() !== "content-type") : r.headers;
  if (headers.length) {
    lines.push(`headers = {\n${headers.map(([k, v]) => `    ${pyq(k)}: ${pyq(v)},`).join("\n")}\n}`, "");
    args.push("headers=headers");
  }
  if (r.body?.kind === "json") {
    let py: string;
    try {
      py = JSON.stringify(JSON.parse(r.body.text), null, 4)
        .replace(/\btrue\b/g, "True")
        .replace(/\bfalse\b/g, "False")
        .replace(/\bnull\b/g, "None");
    } catch {
      py = pyq(r.body.text);
    }
    lines.push(`json_data = ${py}`, "");
    args.push("json=json_data");
  } else if (r.body?.kind === "form") {
    const plain = r.body.fields.filter((f) => !f.file);
    const files = r.body.fields.filter((f) => f.file);
    if (plain.length) {
      lines.push(`data = {\n${plain.map((f) => `    ${pyq(f.name)}: ${pyq(f.value)},`).join("\n")}\n}`, "");
      args.push("data=data");
    }
    if (files.length) {
      lines.push(`files = {\n${files.map((f) => `    ${pyq(f.name)}: open(${pyq(f.file!)}, "rb"),`).join("\n")}\n}`, "");
      args.push("files=files");
    }
  } else if (r.body) {
    lines.push(`data = ${pyq(r.body.text)}`, "");
    args.push("data=data");
  }
  if (r.insecure) args.push("verify=False");
  const fn = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(r.method) ? r.method.toLowerCase() : null;
  lines.push(fn ? `response = requests.${fn}(${args.join(", ")})` : `response = requests.request(${pyq(r.method)}, ${args.join(", ")})`);
  lines.push(r.method === "HEAD" ? "print(response.status_code, response.headers)" : "print(response.status_code, response.text)");
  return lines.join("\n");
}
