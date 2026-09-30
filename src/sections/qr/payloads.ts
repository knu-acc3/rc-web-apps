/* QR payload builders and parsers. Pure functions, unit-tested. */

/** Backslash-escape the characters special in WIFI: and MECARD: payloads: \ ; , : " */
export function escapeMeta(s: string): string {
  return s.replace(/([\\;,:"])/g, "\\$1");
}

export type WifiSecurity = "WPA" | "WEP" | "nopass";

export function wifiPayload(o: { ssid: string; password?: string; security: WifiSecurity; hidden?: boolean }): string {
  const parts = [`T:${o.security}`, `S:${escapeMeta(o.ssid)}`];
  if (o.security !== "nopass" && o.password) parts.push(`P:${escapeMeta(o.password)}`);
  if (o.hidden) parts.push("H:true");
  return `WIFI:${parts.join(";")};;`;
}

/** Escape a vCard 3.0 text value (RFC 2426): backslash, comma, semicolon and newlines. */
export function escapeVcard(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
}

/** Fold lines longer than 75 octets (RFC 2425) without splitting UTF-8 sequences. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let curLen = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (curLen + n > limit) {
      out.push(cur);
      cur = "";
      curLen = 0;
    }
    cur += ch;
    curLen += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export interface VCard {
  firstName?: string;
  lastName?: string;
  org?: string;
  title?: string;
  phone?: string;
  workPhone?: string;
  email?: string;
  url?: string;
  street?: string;
  city?: string;
  region?: string;
  zip?: string;
  country?: string;
  note?: string;
}

export function vcardPayload(v: VCard): string {
  const e = (s?: string) => escapeVcard((s ?? "").trim());
  const fn = [v.firstName, v.lastName].map((s) => (s ?? "").trim()).filter(Boolean).join(" ") || (v.org ?? "").trim();
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${e(v.lastName)};${e(v.firstName)};;;`, `FN:${escapeVcard(fn)}`];
  if (v.org?.trim()) lines.push(`ORG:${e(v.org)}`);
  if (v.title?.trim()) lines.push(`TITLE:${e(v.title)}`);
  if (v.phone?.trim()) lines.push(`TEL;TYPE=CELL:${v.phone.trim()}`);
  if (v.workPhone?.trim()) lines.push(`TEL;TYPE=WORK:${v.workPhone.trim()}`);
  if (v.email?.trim()) lines.push(`EMAIL;TYPE=INTERNET:${v.email.trim()}`);
  if (v.url?.trim()) lines.push(`URL:${v.url.trim()}`);
  if ([v.street, v.city, v.region, v.zip, v.country].some((x) => x?.trim())) lines.push(`ADR;TYPE=WORK:;;${e(v.street)};${e(v.city)};${e(v.region)};${e(v.zip)};${e(v.country)}`);
  if (v.note?.trim()) lines.push(`NOTE:${e(v.note)}`);
  lines.push("END:VCARD");
  return lines.map(foldLine).join("\r\n");
}

export function mecardPayload(v: { firstName?: string; lastName?: string; phone?: string; email?: string; url?: string; address?: string; note?: string }): string {
  const f: string[] = [];
  const name = [v.lastName, v.firstName].map((s) => (s ?? "").trim()).filter(Boolean).map(escapeMeta).join(",");
  if (name) f.push(`N:${name}`);
  if (v.phone?.trim()) f.push(`TEL:${escapeMeta(v.phone.trim())}`);
  if (v.email?.trim()) f.push(`EMAIL:${escapeMeta(v.email.trim())}`);
  if (v.url?.trim()) f.push(`URL:${escapeMeta(v.url.trim())}`);
  if (v.address?.trim()) f.push(`ADR:${escapeMeta(v.address.trim())}`);
  if (v.note?.trim()) f.push(`NOTE:${escapeMeta(v.note.trim())}`);
  return `MECARD:${f.join(";")};;`;
}

export function mailtoPayload(o: { to: string; subject?: string; body?: string }): string {
  const q: string[] = [];
  if (o.subject) q.push(`subject=${encodeURIComponent(o.subject)}`);
  if (o.body) q.push(`body=${encodeURIComponent(o.body)}`);
  return `mailto:${o.to.trim()}${q.length ? `?${q.join("&")}` : ""}`;
}

export const cleanPhone = (s: string) => s.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");

export function smsPayload(o: { phone: string; message?: string; format?: "smsto" | "uri" }): string {
  const phone = cleanPhone(o.phone);
  if (o.format === "uri") return `sms:${phone}${o.message ? `?body=${encodeURIComponent(o.message)}` : ""}`;
  return `SMSTO:${phone}:${o.message ?? ""}`;
}

export function telPayload(phone: string): string {
  return `tel:${cleanPhone(phone)}`;
}

export function whatsappPayload(o: { phone: string; message?: string }): string {
  const digits = o.phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${o.message ? `?text=${encodeURIComponent(o.message)}` : ""}`;
}

export const TELEGRAM_USERNAME = /^[A-Za-z][A-Za-z0-9_]{3,31}$/;
export function telegramPayload(username: string): string {
  return `https://t.me/${username.trim().replace(/^@/, "")}`;
}

export function geoValid(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}
export function geoPayload(lat: number, lon: number, label?: string): string {
  const r = (n: number) => String(Math.round(n * 1e6) / 1e6);
  return `geo:${r(lat)},${r(lon)}${label ? `?q=${encodeURIComponent(label)}` : ""}`;
}

/** Escape an iCalendar TEXT value (RFC 5545 §3.3.11). */
export function escapeIcal(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** "2026-10-15T19:00" → "20261015T190000" (floating local time); "2026-10-15" → "20261015". */
export function icalDate(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return "";
  return m[4] ? `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}00` : `${m[1]}${m[2]}${m[3]}`;
}

export function eventPayload(o: { title: string; start: string; end?: string; allDay?: boolean; location?: string; description?: string }): string {
  const lines = ["BEGIN:VEVENT", `SUMMARY:${escapeIcal(o.title)}`];
  if (o.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${icalDate(o.start.slice(0, 10))}`);
    if (o.end) lines.push(`DTEND;VALUE=DATE:${icalDate(o.end.slice(0, 10))}`);
  } else {
    lines.push(`DTSTART:${icalDate(o.start)}`);
    if (o.end) lines.push(`DTEND:${icalDate(o.end)}`);
  }
  if (o.location) lines.push(`LOCATION:${escapeIcal(o.location)}`);
  if (o.description) lines.push(`DESCRIPTION:${escapeIcal(o.description)}`);
  lines.push("END:VEVENT");
  return lines.map(foldLine).join("\r\n");
}

/* ───── ГОСТ Р 56042-2014 (Russian bank transfer QR) ───── */

export interface GostPayment {
  Name: string;
  PersonalAcc: string;
  BankName: string;
  BIC: string;
  CorrespAcc: string;
  PayeeINN?: string;
  KPP?: string;
  /** Amount in roubles, e.g. "1500.50" — converted to kopecks. */
  sum?: string;
  Purpose?: string;
}

export type GostError = "Name" | "PersonalAcc" | "BankName" | "BIC" | "CorrespAcc" | "PayeeINN" | "KPP" | "Sum" | "Purpose" | "pipe";

/** Account control key against BIC (Bank of Russia rules): weights 7,1,3 over 23 digits, sum of last digits ≡ 0 (mod 10). */
export function accountKeyOk(bic: string, account: string, correspondent = false): boolean {
  if (!/^\d{9}$/.test(bic) || !/^\d{20}$/.test(account)) return false;
  const prefix = correspondent ? `0${bic.slice(4, 6)}` : bic.slice(6);
  const s = prefix + account;
  const w = [7, 1, 3];
  let sum = 0;
  for (let i = 0; i < 23; i++) sum += (Number(s[i]) * w[i % 3]) % 10;
  return sum % 10 === 0;
}

export function kopecks(sum: string): number | null {
  const s = sum.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [r, k = ""] = s.split(".");
  return Number(r) * 100 + Number(k.padEnd(2, "0"));
}

export function gostErrors(p: GostPayment): GostError[] {
  const e: GostError[] = [];
  if (!p.Name.trim() || p.Name.length > 160) e.push("Name");
  if (!/^\d{20}$/.test(p.PersonalAcc)) e.push("PersonalAcc");
  if (!p.BankName.trim() || p.BankName.length > 45) e.push("BankName");
  if (!/^\d{9}$/.test(p.BIC)) e.push("BIC");
  if (!/^(0|\d{20})$/.test(p.CorrespAcc)) e.push("CorrespAcc");
  if (p.PayeeINN && !/^\d{10}$|^\d{12}$/.test(p.PayeeINN)) e.push("PayeeINN");
  if (p.KPP && !/^\d{9}$/.test(p.KPP)) e.push("KPP");
  if (p.sum && kopecks(p.sum) === null) e.push("Sum");
  if (p.Purpose && p.Purpose.trim().length > 210) e.push("Purpose");
  if (Object.values(p).some((v) => typeof v === "string" && v.includes("|"))) e.push("pipe");
  return e;
}

/** "ST00012" = format ST, version 0001, encoding 2 (UTF-8); fields separated by "|". */
export function gostPayload(p: GostPayment): string {
  const f: string[] = ["ST00012", `Name=${p.Name.trim()}`, `PersonalAcc=${p.PersonalAcc}`, `BankName=${p.BankName.trim()}`, `BIC=${p.BIC}`, `CorrespAcc=${p.CorrespAcc}`];
  if (p.PayeeINN) f.push(`PayeeINN=${p.PayeeINN}`);
  if (p.KPP) f.push(`KPP=${p.KPP}`);
  const k = p.sum ? kopecks(p.sum) : null;
  if (k !== null && k > 0) f.push(`Sum=${k}`);
  if (p.Purpose?.trim()) f.push(`Purpose=${p.Purpose.trim()}`);
  return f.join("|");
}

/* ───── EPC069-12 SEPA credit transfer ("GiroCode") ───── */

export interface EpcPayment {
  name: string;
  iban: string;
  bic?: string;
  /** Euro amount, e.g. "12.30" */
  amount?: string;
  purpose?: string;
  reference?: string;
  text?: string;
  info?: string;
}

export type EpcError = "name" | "iban" | "bic" | "amount" | "purpose" | "reference" | "text" | "both" | "info" | "size";

export function epcAmount(amount: string): string | null {
  const s = amount.trim().replace(",", ".");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  if (n < 0.01 || n > 999999999.99) return null;
  return `EUR${n.toFixed(2)}`;
}

export function epcPayload(p: EpcPayment): string {
  const amount = p.amount ? epcAmount(p.amount) : "";
  const lines = ["BCD", "002", "1", "SCT", (p.bic ?? "").trim().toUpperCase(), p.name.trim(), p.iban.replace(/\s/g, "").toUpperCase(), amount ?? "", (p.purpose ?? "").trim().toUpperCase(), (p.reference ?? "").trim(), (p.text ?? "").trim(), (p.info ?? "").trim()];
  while (lines.length > 7 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

export function epcErrors(p: EpcPayment): EpcError[] {
  const e: EpcError[] = [];
  if (!p.name.trim() || p.name.trim().length > 70) e.push("name");
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(p.iban.replace(/\s/g, "").toUpperCase())) e.push("iban");
  if (p.bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(p.bic.trim().toUpperCase())) e.push("bic");
  if (p.amount && !epcAmount(p.amount)) e.push("amount");
  if (p.purpose && !/^[A-Z0-9]{4}$/i.test(p.purpose.trim())) e.push("purpose");
  if (p.reference && p.reference.trim().length > 35) e.push("reference");
  if (p.text && p.text.trim().length > 140) e.push("text");
  if (p.reference?.trim() && p.text?.trim()) e.push("both");
  if (p.info && p.info.trim().length > 70) e.push("info");
  if (new TextEncoder().encode(epcPayload(p)).length > 331) e.push("size");
  return e;
}

/* ───── app stores ───── */

export const APPLE_ID = /^(id)?\d{6,12}$/;
export const ANDROID_PACKAGE = /^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/;
export function appStorePayload(o: { store: "apple" | "google"; id: string }): string {
  return o.store === "apple" ? `https://apps.apple.com/app/id${o.id.replace(/^id/, "")}` : `https://play.google.com/store/apps/details?id=${o.id}`;
}

/* ───── parsing scanned payloads ───── */

export type PayloadKind = "url" | "wifi" | "vcard" | "mecard" | "email" | "sms" | "tel" | "geo" | "event" | "gost" | "epc" | "text";

/** Split "A:1;B:2" style fields honoring backslash escapes. */
function splitEscaped(s: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\" && i + 1 < s.length) {
      cur += s[++i];
      continue;
    }
    if (c === sep) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

export function parsePayload(text: string): { kind: PayloadKind; fields: [string, string][] } {
  const t = text.trim();
  if (/^WIFI:/i.test(t)) {
    const fields: [string, string][] = [];
    for (const part of splitEscaped(t.slice(5).replace(/;;$/, ""), ";")) {
      const i = part.indexOf(":");
      if (i > 0) fields.push([part.slice(0, i).toUpperCase(), part.slice(i + 1)]);
    }
    return { kind: "wifi", fields };
  }
  if (/^BEGIN:VCARD/i.test(t)) {
    const fields: [string, string][] = [];
    for (const line of t.replace(/\r?\n[ \t]/g, "").split(/\r?\n/)) {
      const m = line.match(/^([A-Z]+)(?:;[^:]*)?:(.*)$/i);
      if (m && !/^(BEGIN|END|VERSION)$/i.test(m[1])) fields.push([m[1].toUpperCase(), m[2].replace(/\\n/g, "\n").replace(/\\([,;\\])/g, "$1")]);
    }
    return { kind: "vcard", fields };
  }
  if (/^MECARD:/i.test(t)) {
    const fields: [string, string][] = [];
    for (const part of splitEscaped(t.slice(7).replace(/;;$/, ""), ";")) {
      const i = part.indexOf(":");
      if (i > 0) fields.push([part.slice(0, i).toUpperCase(), part.slice(i + 1)]);
    }
    return { kind: "mecard", fields };
  }
  if (/^BEGIN:VEVENT|^BEGIN:VCALENDAR/i.test(t)) {
    const fields: [string, string][] = [];
    for (const line of t.split(/\r?\n/)) {
      const m = line.match(/^(SUMMARY|DTSTART|DTEND|LOCATION|DESCRIPTION)(?:;[^:]*)?:(.*)$/i);
      if (m) fields.push([m[1].toUpperCase(), m[2]]);
    }
    return { kind: "event", fields };
  }
  if (/^ST0001[123]/.test(t)) {
    const sep = t[7] ?? "|";
    return { kind: "gost", fields: t.slice(8).split(sep).map((p) => { const i = p.indexOf("="); return [p.slice(0, i), p.slice(i + 1)] as [string, string]; }).filter(([k]) => k) };
  }
  if (/^BCD\r?\n/.test(t)) {
    const l = t.split(/\r?\n/);
    const names = ["", "Version", "Charset", "Identification", "BIC", "Name", "IBAN", "Amount", "Purpose", "Reference", "Text", "Info"];
    return { kind: "epc", fields: l.map((v, i) => [names[i] ?? `#${i}`, v] as [string, string]).filter(([k, v]) => k && v) };
  }
  if (/^mailto:/i.test(t)) return { kind: "email", fields: [["TO", decodeURIComponent(t.slice(7).split("?")[0])]] };
  if (/^(SMSTO:|sms:)/i.test(t)) {
    const body = t.replace(/^SMSTO:/i, "").replace(/^sms:/i, "");
    const [phone, msg] = /^SMSTO:/i.test(t) ? [body.split(":")[0], body.split(":").slice(1).join(":")] : [body.split("?")[0], decodeURIComponent((body.split("body=")[1] ?? "").replace(/\+/g, " "))];
    return { kind: "sms", fields: [["TEL", phone], ["TEXT", msg]] };
  }
  if (/^tel:/i.test(t)) return { kind: "tel", fields: [["TEL", t.slice(4)]] };
  if (/^geo:/i.test(t)) {
    const [coords] = t.slice(4).split("?");
    const [lat, lon] = coords.split(",");
    return { kind: "geo", fields: [["LAT", lat], ["LON", lon]] };
  }
  if (/^https?:\/\/\S+$/i.test(t)) return { kind: "url", fields: [["URL", t]] };
  return { kind: "text", fields: [] };
}
