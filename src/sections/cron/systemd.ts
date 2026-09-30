/**
 * Convert simple cron expressions to a systemd OnCalendar= value. Returns null when there is
 * no exact equivalent (Vixie DOM-or-DOW, W, #, nL, @reboot).
 */
import type { CronExpr, ParsedField } from "./engine";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const p2 = (n: number) => String(n).padStart(2, "0");

function part(f: ParsedField, width = 2): string {
  const raw = f.raw;
  if (raw === "*" || raw === "?") return "*";
  const m = /^(\*|\d+)\/(\d+)$/.exec(raw);
  if (m) return `${m[1] === "*" ? "00".slice(0, width) : String(Number(m[1])).padStart(width, "0")}/${m[2]}`;
  const v = f.values;
  if (v.length > 2 && v.every((x, i) => i === 0 || x === v[i - 1] + 1)) return `${String(v[0]).padStart(width, "0")}..${String(v[v.length - 1]).padStart(width, "0")}`;
  return v.map((x) => String(x).padStart(width, "0")).join(",");
}

export function toSystemd(e: CronExpr): string | null {
  if (e.reboot) return null;
  const F = e.fields;
  if (F.dom.lastWeekday || F.dom.nearestWeekday || F.dow.nthDow || F.dow.lastDow || (F.dom.last && F.dom.lastOffset)) return null;
  const domRestricted = F.dom.raw !== "*" && F.dom.raw !== "?";
  const dowRestricted = F.dow.values.length < 7;
  if (e.dialect !== "quartz" && domRestricted && dowRestricted && !F.dom.star && !F.dow.star) return null; // OR semantics
  let dow = "";
  if (dowRestricted) {
    const v = F.dow.values;
    dow = v.length > 2 && v.every((x, i) => i === 0 || x === v[i - 1] + 1) ? `${DOW[v[0]]}..${DOW[v[v.length - 1]]}` : v.map((d) => DOW[d]).join(",");
    dow += " ";
  }
  const year = F.year.star ? "*" : part(F.year, 4);
  const month = part(F.month);
  const date = F.dom.last ? `${year}-${month}~01` : `${year}-${month}-${part(F.dom)}`;
  const time = `${part(F.hour)}:${part(F.minute)}:${e.dialect === "unix" ? "00" : part(F.second)}`;
  return `${dow}${date} ${time}`.replace(/^\*-\*-\* /, dow ? "*-*-* " : "*-*-* ").replace(/:0{2}\/(\d+):00$/, (_s, n) => `:00/${n}:00`).replace(/:(\d{2}):(\d{2})$/, (_s, a, b) => `:${p2(Number(a))}:${p2(Number(b))}`);
}
