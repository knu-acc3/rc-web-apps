/**
 * Normalizes user-entered number strings by trimming, stripping thousands separators
 * (spaces, non-breaking spaces, thin spaces), and replacing commas with decimal points.
 * Returns the finite number or null if invalid or empty.
 */
export function parseUserNumber(input: string): number | null {
  if (!input) return null;
  const normalized = input
    .trim()
    .replace(/[\s\u00A0\u202F]+/g, "")
    .replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
