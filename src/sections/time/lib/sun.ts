/**
 * Sunrise, sunset and solar noon — NOAA solar calculator (Meeus-based) equations.
 * Accuracy is about a minute for latitudes below ±72°. Standard refraction
 * (apparent sunrise/sunset: solar zenith 90.833°).
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function julianCentury(t: number): number {
  const jd = t / 86400000 + 2440587.5;
  return (jd - 2451545) / 36525;
}

interface SolarPos {
  /** declination, degrees */
  decl: number;
  /** equation of time, minutes */
  eqt: number;
}

function solarPosition(t: number): SolarPos {
  const jc = julianCentury(t);
  const L0 = (((280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360) + 360) % 360;
  const M = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
  const e = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
  const C = Math.sin(M * RAD) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * jc) + Math.sin(3 * M * RAD) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * jc;
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const meanObliq = 23 + (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) / 60;
  const obliq = meanObliq + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(obliq * RAD) * Math.sin(appLong * RAD)) * DEG;
  const y = Math.tan((obliq / 2) * RAD) ** 2;
  const eqt =
    4 *
    DEG *
    (y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD));
  return { decl, eqt };
}

/** cos of the hour angle for the sun at zenith `zen` degrees. */
function cosHourAngle(lat: number, decl: number, zen = 90.833): number {
  return Math.cos(zen * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)) - Math.tan(lat * RAD) * Math.tan(decl * RAD);
}

export interface SunDay {
  /** UTC ms, null during polar day/night */
  sunrise: number | null;
  sunset: number | null;
  /** UTC ms of solar noon */
  noon: number;
  /** Day length in minutes (0 for polar night, 1440 for polar day). */
  dayLength: number;
  polar: "day" | "night" | null;
}

/**
 * Sun events for the civil date (y, m, d) at a place. `utcOffsetMin` is the local
 * offset used to pick the right solar day (the day whose local noon falls on that date).
 */
export function sunDay(y: number, m: number, d: number, lat: number, lon: number, utcOffsetMin = Math.round(lon * 4)): SunDay {
  const day0 = Date.UTC(y, m - 1, d) - utcOffsetMin * 60000; // local midnight in UTC
  // Solar noon: iterate twice for the equation of time.
  let noon = day0 + 12 * 3600000;
  for (let i = 0; i < 2; i++) {
    const { eqt } = solarPosition(noon);
    const utcMin = 720 - 4 * lon - eqt; // minutes after UTC midnight of the UTC date
    const utcMidnight = Math.floor((day0 + 12 * 3600000) / 86400000) * 86400000;
    noon = utcMidnight + utcMin * 60000;
    // keep noon within the local day
    if (noon < day0) noon += 86400000;
    if (noon >= day0 + 86400000) noon -= 86400000;
  }
  const event = (dir: -1 | 1): number | "day" | "night" => {
    let t = noon;
    for (let i = 0; i < 3; i++) {
      const { decl, eqt } = solarPosition(t);
      const c = cosHourAngle(lat, decl);
      if (c > 1) return "night";
      if (c < -1) return "day";
      const ha = Math.acos(c) * DEG;
      const noonHere = noon + (solarPosition(noon).eqt - eqt) * 60000;
      t = noonHere + dir * ha * 4 * 60000;
    }
    return t;
  };
  const rise = event(-1);
  const set = event(1);
  if (typeof rise !== "number" || typeof set !== "number") {
    const polar = rise === "day" || set === "day" ? "day" : "night";
    return { sunrise: null, sunset: null, noon, dayLength: polar === "day" ? 1440 : 0, polar };
  }
  return { sunrise: rise, sunset: set, noon, dayLength: Math.round((set - rise) / 60000), polar: null };
}

/** Is the sun above the horizon at instant `t`? (uses the same NOAA formulas) */
export function sunElevation(t: number, lat: number, lon: number): number {
  const { decl, eqt } = solarPosition(t);
  const utcMin = (((t % 86400000) + 86400000) % 86400000) / 60000;
  const trueSolarMin = (((utcMin + eqt + 4 * lon) % 1440) + 1440) % 1440;
  const ha = trueSolarMin / 4 - 180;
  const cosZen = Math.sin(lat * RAD) * Math.sin(decl * RAD) + Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(ha * RAD);
  return 90 - Math.acos(Math.max(-1, Math.min(1, cosZen))) * DEG;
}
