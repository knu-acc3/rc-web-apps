/** Page-number labels (plain module: used by the tool UI and by the worker). */

export type NumberFormat = "n" | "n-of-total" | "page-n-of-total" | "dash-n";

export function pageLabel(format: NumberFormat, n: number, total: number, locale: "ru" | "en"): string {
  switch (format) {
    case "n-of-total":
      return `${n} / ${total}`;
    case "page-n-of-total":
      return locale === "ru" ? `Страница ${n} из ${total}` : `Page ${n} of ${total}`;
    case "dash-n":
      return `– ${n} –`;
    default:
      return String(n);
  }
}

interface NumberPlanOptions {
  format: NumberFormat;
  locale: "ru" | "en";
  /** Number printed on the first numbered page. */
  start: number;
  /** Leave the first page without a number. */
  skipFirst: boolean;
}

/** Labels for every page (null = not numbered). The total is the last printed number. */
export function pageNumberPlan(pageCount: number, o: NumberPlanOptions): (string | null)[] {
  const first = o.skipFirst ? 1 : 0;
  const numbered = Math.max(0, pageCount - first);
  const total = o.start + numbered - 1;
  return Array.from({ length: pageCount }, (_, i) => (i < first ? null : pageLabel(o.format, o.start + i - first, total, o.locale)));
}
