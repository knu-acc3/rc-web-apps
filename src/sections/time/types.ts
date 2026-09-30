import type { Locale } from "@/i18n/config";

/** A place a client clock can show: an IANA zone or a fixed UTC offset. */
export interface Place {
  key: string;
  name: string;
  /** Country or hint line. */
  sub: string;
  tz: string | null;
  /** Fixed offset in minutes (used when tz is null). */
  offset: number | null;
  lat?: number;
  lon?: number;
}

export interface CityTimeProps {
  locale: Locale;
  city: Place & { inName: string };
  compare: Place[];
  world: Place[];
}

export interface CountryTimeProps {
  locale: Locale;
  groups: { label: string; places: Place[] }[];
}

export interface ZoneTimeProps {
  locale: Locale;
  label: string;
  /** Fixed offset (null for generic zones that follow DST, e.g. ET). */
  offset: number | null;
  tz: string | null;
  /** Candidate cities; the client shows those currently at this offset. */
  candidates: Place[];
}

export interface ConverterProps {
  locale: Locale;
  /** Initial rows (the visitor's own zone is added on the client when `withLocal`). */
  rows: Place[];
  withLocal?: boolean;
  /** Remember the rows in localStorage (hub page only). */
  persist?: boolean;
}

export interface WorldClockProps {
  locale: Locale;
  defaults: Place[];
}

export interface NowProps {
  locale: Locale;
}

export interface ZonesTableProps {
  locale: Locale;
  rows: { offset: number; label: string; path: string | null; cities: string }[];
}
