export interface SolarCalculationResult {
  readonly sunriseTimeString: string;
  readonly sunsetTimeString: string;
  readonly solarNoonTimeString: string;
  readonly dayLengthMinutes: number;
  readonly isDaylight: boolean;
  readonly solarElevationAngle: number;
}

export function calculateSolarTimes(
  lat: number,
  lng: number,
  timezoneIana: string,
  date: Date = new Date()
): SolarCalculationResult {
  const dayOfYear = getDayOfYear(date);

  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (12 - lng / 15) / 24);
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma);

  const latRad = lat * (Math.PI / 180);
  const zenith = 90.833 * (Math.PI / 180);

  const cosHa =
    Math.cos(zenith) / (Math.cos(latRad) * Math.cos(decl)) -
    Math.tan(latRad) * Math.tan(decl);
  
  // Clamp between -1 and 1
  const clampedCosHa = Math.max(-1, Math.min(1, cosHa));
  const haHour = Math.acos(clampedCosHa);
  const haDeg = haHour * (180 / Math.PI);

  const sunriseMinutesUtc = (720 - 4 * (lng + haDeg) - eqtime + 1440) % 1440;
  const sunsetMinutesUtc = (720 - 4 * (lng - haDeg) - eqtime + 1440) % 1440;
  const noonMinutesUtc = (720 - 4 * lng - eqtime + 1440) % 1440;

  const dayLength = haDeg * 8; // 2 * haDeg * 4 min/deg

  const sunriseDate = new Date(date);
  sunriseDate.setUTCHours(
    Math.floor(sunriseMinutesUtc / 60),
    Math.floor(sunriseMinutesUtc % 60),
    0,
    0
  );

  const sunsetDate = new Date(date);
  sunsetDate.setUTCHours(
    Math.floor(sunsetMinutesUtc / 60),
    Math.floor(sunsetMinutesUtc % 60),
    0,
    0
  );

  const noonDate = new Date(date);
  noonDate.setUTCHours(
    Math.floor(noonMinutesUtc / 60),
    Math.floor(noonMinutesUtc % 60),
    0,
    0
  );

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezoneIana,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  const nowMs = date.getTime();
  const isDaylight = nowMs >= sunriseDate.getTime() && nowMs <= sunsetDate.getTime();

  return {
    sunriseTimeString: sunriseDate.toLocaleTimeString('ru-RU', formatOptions),
    sunsetTimeString: sunsetDate.toLocaleTimeString('ru-RU', formatOptions),
    solarNoonTimeString: noonDate.toLocaleTimeString('ru-RU', formatOptions),
    dayLengthMinutes: Math.round(dayLength),
    isDaylight,
    solarElevationAngle: 45,
  };
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
