export const HYDRATION_SAFE_NOW_MS = Date.UTC(2026, 5, 18, 0, 0, 0);

export function createHydrationSafeDate(): Date {
  return new Date(HYDRATION_SAFE_NOW_MS);
}

export function hydrationSafeDateString(): string {
  const date = createHydrationSafeDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function hydrationSafeYear(): number {
  return createHydrationSafeDate().getFullYear();
}
