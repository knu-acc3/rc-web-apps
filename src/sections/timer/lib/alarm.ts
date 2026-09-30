/** Next local occurrence of HH:MM strictly after `from` (local Date handles DST shifts). */
export function nextOccurrence(hhmm: string, from: number): number {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(from);
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
  if (t.getTime() <= from) t.setDate(t.getDate() + 1);
  return t.getTime();
}

export interface Segment {
  kind: "prepare" | "work" | "rest";
  round: number;
  /** ms from the start of the workout */
  start: number;
  end: number;
}

/** Interval-training timeline: prepare, then rounds of work (+ rest, skipped after the last round). */
export function timeline(prepare: number, work: number, rest: number, rounds: number): Segment[] {
  const out: Segment[] = [];
  let t = 0;
  if (prepare > 0) {
    out.push({ kind: "prepare", round: 0, start: 0, end: prepare * 1000 });
    t = prepare * 1000;
  }
  for (let r = 1; r <= rounds; r++) {
    out.push({ kind: "work", round: r, start: t, end: t + work * 1000 });
    t += work * 1000;
    if (rest > 0 && r < rounds) {
      out.push({ kind: "rest", round: r, start: t, end: t + rest * 1000 });
      t += rest * 1000;
    }
  }
  return out;
}
