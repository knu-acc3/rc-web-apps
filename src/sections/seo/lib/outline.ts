/* Heading outline (H1–H6) extracted from HTML without a DOM, plus structural issues;
   and the llms.txt builder. */

export interface Heading {
  level: number;
  text: string;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»", mdash: "—", ndash: "–", hellip: "…" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

export function extractHeadings(html: string): Heading[] {
  const src = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|template|noscript|svg)\b[\s\S]*?<\/\1\s*>/gi, "");
  const out: Heading[] = [];
  for (const m of src.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi)) {
    const inner = m[2].replace(/<img\b[^>]*\balt\s*=\s*(["'])(.*?)\1[^>]*>/gi, " $2 ");
    const text = decodeEntities(inner.replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    out.push({ level: Number(m[1]), text });
  }
  return out;
}

export type OutlineIssueKind = "noH1" | "manyH1" | "skip" | "empty" | "longH1" | "duplicate" | "firstNotH1";

export interface OutlineIssue {
  kind: OutlineIssueKind;
  index: number;
  from?: number;
  to?: number;
}

export function outlineIssues(hs: Heading[]): OutlineIssue[] {
  const out: OutlineIssue[] = [];
  if (!hs.length) return out;
  const h1 = hs.filter((h) => h.level === 1);
  if (!h1.length) out.push({ kind: "noH1", index: -1 });
  if (h1.length > 1) out.push({ kind: "manyH1", index: hs.findIndex((h, i) => h.level === 1 && i > hs.findIndex((x) => x.level === 1)) });
  if (hs[0].level !== 1 && h1.length) out.push({ kind: "firstNotH1", index: 0 });
  const seen = new Map<string, number>();
  hs.forEach((h, i) => {
    if (!h.text) out.push({ kind: "empty", index: i });
    if (i > 0 && h.level > hs[i - 1].level + 1) out.push({ kind: "skip", index: i, from: hs[i - 1].level, to: h.level });
    if (h.level === 1 && h.text.length > 70) out.push({ kind: "longH1", index: i });
    const k = `${h.level}:${h.text.toLowerCase()}`;
    if (h.text && seen.has(k)) out.push({ kind: "duplicate", index: i });
    seen.set(k, i);
  });
  return out;
}

/* ───── llms.txt (llmstxt.org) ───── */

export interface LlmsInput {
  name: string;
  summary: string;
  details: string;
  /** Lines: "## Section" starts a section; "Title | URL | notes" adds a link. */
  links: string;
}

export function buildLlmsTxt(i: LlmsInput): { text: string; bad: number[] } {
  const bad: number[] = [];
  const out: string[] = [`# ${i.name.trim() || "Site name"}`];
  if (i.summary.trim()) out.push("", `> ${i.summary.trim().replace(/\s*\n\s*/g, " ")}`);
  if (i.details.trim()) out.push("", i.details.trim());
  let open = false;
  i.links.split(/\r?\n/).forEach((raw, idx) => {
    const l = raw.trim();
    if (!l) return;
    const h = l.match(/^#{1,6}\s*(.+)$/);
    if (h) {
      out.push("", `## ${h[1].trim()}`, "");
      open = true;
      return;
    }
    const [title, url, ...notes] = l.split("|").map((x) => x.trim());
    const link = url ?? (/^https?:\/\//i.test(title) ? title : "");
    if (!link || !/^(https?:\/\/|\/)/i.test(link)) {
      bad.push(idx + 1);
      return;
    }
    if (!open) {
      out.push("", "## Docs", "");
      open = true;
    }
    const label = url ? title : link.replace(/^https?:\/\/(www\.)?/i, "");
    const note = notes.join(" | ");
    out.push(`- [${label.replace(/[[\]]/g, "")}](${link})${note ? `: ${note}` : ""}`);
  });
  return { text: `${out.join("\n")}\n`, bad };
}
