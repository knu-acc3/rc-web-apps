/**
 * Расчет плавающих дат мировых праздников и астрономических событий.
 */

export function calculateEasterDate(year: number, type: 'orthodox' | 'catholic' = 'orthodox'): Date {
  if (type === 'catholic') {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
  }

  // Православная Пасха (по алгоритму Гаусса с юлианско-григорианской поправкой +13 дней)
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31) - 1;
  const day = ((d + e + 114) % 31) + 1;
  const dt = new Date(year, month, day);
  dt.setDate(dt.getDate() + 13);
  return dt;
}

export function calculateSolsticeEquinox(year: number): {
  springEquinox: Date;
  summerSolstice: Date;
  autumnEquinox: Date;
  winterSolstice: Date;
} {
  return {
    springEquinox: new Date(year, 2, 20),
    summerSolstice: new Date(year, 5, 21),
    autumnEquinox: new Date(year, 8, 22),
    winterSolstice: new Date(year, 11, 21),
  };
}
