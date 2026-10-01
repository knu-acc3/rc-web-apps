/**
 * Unix permission engine: octal ↔ symbolic (ls -l style with s/S/t/T), chmod symbolic
 * expressions (u+x, g-w, a=r, a+X, u=rwx,go=rx, o=u …), umask, precise safety notes.
 * A mode is a number 0…0o7777.
 */

export const SETUID = 0o4000;
export const SETGID = 0o2000;
export const STICKY = 0o1000;

export type Who = "u" | "g" | "o";
const SHIFT: Record<Who, number> = { u: 6, g: 3, o: 0 };

export function parseOctal(s: string): number | null {
  const t = s.trim();
  if (!/^[0-7]{1,4}$/.test(t)) return null;
  return parseInt(t, 8);
}

export function toOctal(mode: number, digits: 3 | 4 = mode > 0o777 ? 4 : 3): string {
  return (mode & 0o7777).toString(8).padStart(digits, "0");
}

/** "rwxr-xr-x" (9 chars) with s/S/t/T for the special bits. */
export function toSymbolic(mode: number): string {
  const bit = (m: number, c: string) => (mode & m ? c : "-");
  let s = "";
  for (const w of ["u", "g", "o"] as Who[]) {
    const sh = SHIFT[w];
    s += bit(4 << sh, "r") + bit(2 << sh, "w");
    const x = (mode & (1 << sh)) !== 0;
    const special = w === "u" ? mode & SETUID : w === "g" ? mode & SETGID : mode & STICKY;
    const lower = w === "o" ? "t" : "s";
    s += special ? (x ? lower : lower.toUpperCase()) : x ? "x" : "-";
  }
  return s;
}

/** Parse "rwxr-xr-x", "-rwsr-xr-x" or "drwxrwxrwt" (ls -l). */
export function fromSymbolic(input: string): number | null {
  let s = input.trim();
  if (s.length === 10) s = s.slice(1);
  if (!/^[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/.test(s)) return null;
  let m = 0;
  (["u", "g", "o"] as Who[]).forEach((w, i) => {
    const sh = SHIFT[w];
    const [r, wr, x] = s.slice(i * 3, i * 3 + 3);
    if (r === "r") m |= 4 << sh;
    if (wr === "w") m |= 2 << sh;
    if (x === "x" || x === "s" || x === "t") m |= 1 << sh;
    if (x === "s" || x === "S") m |= w === "u" ? SETUID : SETGID;
    if (x === "t" || x === "T") m |= STICKY;
  });
  return m;
}

class ChmodError extends Error {
  constructor(
    message: string,
    readonly clause: string,
  ) {
    super(message);
  }
}

/**
 * Apply a chmod symbolic expression. Without "who" the clause applies to all (like "a",
 * but real chmod then also respects the umask — that is not simulated here).
 */
export function applySymbolic(mode: number, expr: string, isDir = false): number {
  let m = mode & 0o7777;
  for (const clause of expr.split(",").map((c) => c.trim())) {
    if (!clause) continue;
    const re = /^([ugoa]*)((?:[-+=][ugo](?![rwxXst])|[-+=][rwxXst]*)+)$/;
    const mm = re.exec(clause);
    if (!mm) throw new ChmodError("bad-clause", clause);
    let who = mm[1].replace(/a/g, "ugo");
    if (!who) who = "ugo";
    const whos = [...new Set(who)] as Who[];
    const ops = mm[2].match(/[-+=][ugo](?![rwxXst])|[-+=][rwxXst]*/g)!;
    for (const op of ops) {
      const sign = op[0];
      const perms = op.slice(1);
      for (const w of whos) {
        const sh = SHIFT[w];
        let bits = 0;
        let special = 0;
        if (/^[ugo]$/.test(perms)) {
          bits = (m >> SHIFT[perms as Who]) & 7;
        } else {
          for (const p of perms) {
            if (p === "r") bits |= 4;
            else if (p === "w") bits |= 2;
            else if (p === "x") bits |= 1;
            else if (p === "X") {
              if (isDir || m & 0o111) bits |= 1;
            } else if (p === "s") special |= w === "u" ? SETUID : w === "g" ? SETGID : 0;
            else if (p === "t") special |= w === "o" ? STICKY : 0;
          }
        }
        const mask = 7 << sh;
        if (sign === "+") m |= (bits << sh) | special;
        else if (sign === "-") m &= ~((bits << sh) | special);
        else {
          const keepSpecial = w === "u" ? SETUID : w === "g" ? SETGID : STICKY;
          // "=" resets the class bits and its special bit; GNU chmod keeps setuid/setgid on directories
          m = (m & ~mask) | (bits << sh);
          if (!(isDir && (w === "u" || w === "g"))) m &= ~keepSpecial;
          m |= special;
        }
      }
    }
  }
  return m;
}

/** Canonical symbolic chmod command for a mode, e.g. 755 → "u=rwx,go=rx". */
export function toChmodSymbolic(mode: number): string {
  const part = (w: Who) => {
    const b = (mode >> SHIFT[w]) & 7;
    return (b & 4 ? "r" : "") + (b & 2 ? "w" : "") + (b & 1 ? "x" : "");
  };
  const u = part("u") + (mode & SETUID ? "s" : "");
  const g = part("g") + (mode & SETGID ? "s" : "");
  const o = part("o") + (mode & STICKY ? "t" : "");
  if (u === g && g === o) return `a=${u}`;
  if (g === o) return `u=${u},go=${g}`;
  return `u=${u},g=${g},o=${o}`;
}

export function umask(mask: number): { file: number; dir: number } {
  return { file: 0o666 & ~mask, dir: 0o777 & ~mask };
}

interface Rights {
  read: boolean;
  write: boolean;
  exec: boolean;
}
export function rights(mode: number, w: Who): Rights {
  const b = (mode >> SHIFT[w]) & 7;
  return { read: !!(b & 4), write: !!(b & 2), exec: !!(b & 1) };
}

export type NoteCode =
  | "world-writable-dir"
  | "world-writable-file"
  | "sticky-tmp"
  | "setuid"
  | "setgid-dir"
  | "setgid-file"
  | "setid-writable"
  | "special-no-exec"
  | "no-access"
  | "private"
  | "owner-cant-read";

interface Note {
  code: NoteCode;
  level: "danger" | "warn" | "info";
}

/** Precise notes: 1777 (sticky world-writable, like /tmp) is explained, not flagged. */
export function notes(mode: number): Note[] {
  const out: Note[] = [];
  const ow = !!(mode & 0o002);
  const sticky = !!(mode & STICKY);
  if (ow && sticky) out.push({ code: "sticky-tmp", level: "info" });
  else if (ow) {
    out.push({ code: "world-writable-dir", level: "danger" });
    out.push({ code: "world-writable-file", level: "danger" });
  }
  if (mode & (SETUID | SETGID) && mode & 0o022) out.push({ code: "setid-writable", level: "danger" });
  if (mode & SETUID) out.push({ code: "setuid", level: "warn" });
  if (mode & SETGID) {
    out.push({ code: "setgid-dir", level: "info" });
    out.push({ code: "setgid-file", level: "info" });
  }
  if ((mode & SETUID && !(mode & 0o100)) || (mode & SETGID && !(mode & 0o010) && !(mode & 0o001))) out.push({ code: "special-no-exec", level: "warn" });
  if ((mode & 0o777) === 0) out.push({ code: "no-access", level: "info" });
  else if ((mode & 0o077) === 0) out.push({ code: "private", level: "info" });
  if (!(mode & 0o400) && mode & 0o077) out.push({ code: "owner-cant-read", level: "warn" });
  return out;
}
