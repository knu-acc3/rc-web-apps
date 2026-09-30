"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Crosshair,
  MapPin,
  NavigationArrow,
  Sparkle,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";
import { writeClipboardText } from "@/src/utils/clipboard";

type Coordinates = { lat: number; lon: number };

const COORDINATE_PRESETS = [
  { labelRu: "Москва (Красная пл.)", labelEn: "Moscow (Red Sq.)", lat: "55.7539", lon: "37.6208" },
  { labelRu: "Париж (Эйфель)", labelEn: "Paris (Eiffel)", lat: "48.8584", lon: "2.2945" },
  { labelRu: "Лондон (Гринвич)", labelEn: "London (Greenwich)", lat: "51.4769", lon: "0.0005" },
  { labelRu: "Токио", labelEn: "Tokyo", lat: "35.6762", lon: "139.6503" },
  { labelRu: "Нью-Йорк", labelEn: "New York", lat: "40.7128", lon: "-74.0060" },
];

const GEOHASH_ALPHABET = "0123456789bcdefghjkmnpqrstuvwxyz";

function parseCoordinate(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDecimal(value: number) {
  const normalized = Object.is(value, -0) ? 0 : value;
  return normalized
    .toFixed(7)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?[1-9])0+$/, "$1");
}

const DIRECTIONS = {
  ru: { latPos: "С", latNeg: "Ю", lonPos: "В", lonNeg: "З" },
  en: { latPos: "N", latNeg: "S", lonPos: "E", lonNeg: "W" },
};

function toDms(value: number, latitude: boolean, isEn = false) {
  const d = DIRECTIONS[isEn ? "en" : "ru"];
  const direction = latitude
    ? value >= 0
      ? d.latPos
      : d.latNeg
    : value >= 0
      ? d.lonPos
      : d.lonNeg;
  let totalSeconds = Math.abs(value) * 3_600;
  let degrees = Math.floor(totalSeconds / 3_600);
  totalSeconds -= degrees * 3_600;
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = Number((totalSeconds - minutes * 60).toFixed(3));
  if (seconds >= 60) {
    seconds = 0;
    minutes += 1;
  }
  if (minutes >= 60) {
    minutes = 0;
    degrees += 1;
  }
  return `${degrees}° ${minutes}′ ${seconds
    .toFixed(3)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?[1-9])0+$/, "$1")}″ ${direction}`;
}

function toDdm(value: number, latitude: boolean, isEn = false) {
  const d = DIRECTIONS[isEn ? "en" : "ru"];
  const direction = latitude
    ? value >= 0
      ? d.latPos
      : d.latNeg
    : value >= 0
      ? d.lonPos
      : d.lonNeg;
  let degrees = Math.floor(Math.abs(value));
  let minutes = Number(((Math.abs(value) - degrees) * 60).toFixed(5));
  if (minutes >= 60) {
    minutes = 0;
    degrees += 1;
  }
  return `${degrees}° ${minutes
    .toFixed(5)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?[1-9])0+$/, "$1")}′ ${direction}`;
}

function encodeGeohash(lat: number, lon: number, precision: number) {
  let minLat = -90;
  let maxLat = 90;
  let minLon = -180;
  let maxLon = 180;
  let even = true;
  let bit = 0;
  let bits = 0;
  let output = "";

  while (output.length < precision) {
    if (even) {
      const midpoint = (minLon + maxLon) / 2;
      if (lon >= midpoint) {
        bits = (bits << 1) | 1;
        minLon = midpoint;
      } else {
        bits <<= 1;
        maxLon = midpoint;
      }
    } else {
      const midpoint = (minLat + maxLat) / 2;
      if (lat >= midpoint) {
        bits = (bits << 1) | 1;
        minLat = midpoint;
      } else {
        bits <<= 1;
        maxLat = midpoint;
      }
    }
    even = !even;
    bit += 1;
    if (bit === 5) {
      output += GEOHASH_ALPHABET[bits];
      bit = 0;
      bits = 0;
    }
  }
  return output;
}

function getUtmZone(lat: number, lon: number) {
  if (lat < -80 || lat >= 84) return null;
  let zone = Math.min(60, Math.max(1, Math.floor((lon + 180) / 6) + 1));
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
  if (lat >= 72 && lat < 84) {
    if (lon >= 0 && lon < 9) zone = 31;
    else if (lon >= 9 && lon < 21) zone = 33;
    else if (lon >= 21 && lon < 33) zone = 35;
    else if (lon >= 33 && lon < 42) zone = 37;
  }
  return `${zone}${lat >= 0 ? "N" : "S"}`;
}

export default function CoordinateConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [latitude, setLatitude] = useState("55.7539");
  const [longitude, setLongitude] = useState("37.6208");
  const [result, setResult] = useState<Coordinates | null>({
    lat: 55.7539,
    lon: 37.6208,
  });
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [geohashPrecision, setGeohashPrecision] = useState(9);
  const [locating, setLocating] = useState(false);

  const output = useMemo(() => {
    if (!result) return null;
    const dd = `${formatDecimal(result.lat)}, ${formatDecimal(result.lon)}`;
    return {
      dd,
      dms: `${toDms(result.lat, true, isEn)}, ${toDms(result.lon, false, isEn)}`,
      ddm: `${toDdm(result.lat, true, isEn)}, ${toDdm(result.lon, false, isEn)}`,
      geohash: encodeGeohash(result.lat, result.lon, geohashPrecision),
      utmZone: getUtmZone(result.lat, result.lon),
      openStreetMap: `https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}#map=12/${result.lat}/${result.lon}`,
      googleMaps: `https://www.google.com/maps?q=${result.lat},${result.lon}`,
    };
  }, [geohashPrecision, isEn, result]);

  const tryLiveConvert = (latStr: string, lonStr: string) => {
    const lat = parseCoordinate(latStr);
    const lon = parseCoordinate(lonStr);
    if (
      lat !== null &&
      lat >= -90 &&
      lat <= 90 &&
      lon !== null &&
      lon >= -180 &&
      lon <= 180
    ) {
      setError("");
      setCopied(false);
      setResult({ lat, lon });
    }
  };

  const convert = () => {
    const lat = parseCoordinate(latitude);
    const lon = parseCoordinate(longitude);
    if (lat === null || lat < -90 || lat > 90) {
      setError(
        isEn
          ? "Latitude must be a number from -90 to 90."
          : "Широта должна быть числом от −90 до 90.",
      );
      setResult(null);
      return;
    }
    if (lon === null || lon < -180 || lon > 180) {
      setError(
        isEn
          ? "Longitude must be a number from -180 to 180."
          : "Долгота должна быть числом от −180 до 180.",
      );
      setResult(null);
      return;
    }
    setError("");
    setCopied(false);
    setResult({ lat, lon });
  };

  const primaryAction = async () => {
    if (!output) {
      convert();
      return;
    }
    const didCopy = await writeClipboardText(output.dd);
    if (didCopy) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_600);
    }
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setError(
        isEn
          ? "Geolocation is not available in this browser."
          : "Геолокация недоступна в этом браузере.",
      );
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { lat: coords.latitude, lon: coords.longitude };
        setLatitude(formatDecimal(next.lat));
        setLongitude(formatDecimal(next.lon));
        setResult(next);
        setLocating(false);
      },
      () => {
        setError(
          isEn
            ? "Location access was denied or timed out."
            : "Доступ к геопозиции отклонён или истёк тайм-аут.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 30_000 },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* 1-Click Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Быстрый выбор:"}
        </span>
        {COORDINATE_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setLatitude(p.lat);
              setLongitude(p.lon);
              tryLiveConvert(p.lat, p.lon);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
              latitude === p.lat && longitude === p.lon
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
            )}
          >
            {isEn ? p.labelEn : p.labelRu}
          </button>
        ))}
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Crosshair size={19} className="text-[var(--color-primary)]" />
          {isEn ? "Enter decimal coordinates" : "Введите десятичные координаты"}
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="coordinate-latitude">
              {isEn ? "Latitude" : "Широта"}
            </Label>
            <Input
              id="coordinate-latitude"
              value={latitude}
              inputMode="decimal"
              onChange={(event) => {
                const next = event.target.value;
                setLatitude(next);
                tryLiveConvert(next, longitude);
              }}
              placeholder="-90 … 90"
              className="mt-1.5 h-14 font-mono text-2xl font-bold tabular-nums"
            />
          </div>
          <div>
            <Label htmlFor="coordinate-longitude">
              {isEn ? "Longitude" : "Долгота"}
            </Label>
            <Input
              id="coordinate-longitude"
              value={longitude}
              inputMode="decimal"
              onChange={(event) => {
                const next = event.target.value;
                setLongitude(next);
                tryLiveConvert(latitude, next);
              }}
              placeholder="-180 … 180"
              className="mt-1.5 h-14 font-mono text-2xl font-bold tabular-nums"
            />
          </div>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <ToolPrimaryAction
            type="button"
            fullWidthOnMobile={false}
            className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
            disabled={!output && (!latitude.trim() || !longitude.trim())}
            onClick={() => void primaryAction()}
            leadingIcon={
              output ? (
                copied ? (
                  <Check size={20} weight="bold" />
                ) : (
                  <Copy size={20} />
                )
              ) : (
                <NavigationArrow size={20} weight="bold" />
              )
            }
          >
            {output
              ? copied
                ? isEn
                  ? "Coordinates copied"
                  : "Координаты скопированы"
                : isEn
                  ? "Copy decimal coordinates"
                  : "Скопировать координаты"
              : isEn
                ? "Convert coordinates"
                : "Преобразовать координаты"}
          </ToolPrimaryAction>

          <Button
            type="button"
            variant="outline"
            onClick={useLocation}
            disabled={locating}
            className="h-11 shadow-xs"
          >
            <MapPin size={18} className="mr-1.5" />
            {locating
              ? isEn
                ? "Determining location…"
                : "Определение геопозиции…"
              : isEn
                ? "Use my location"
                : "Моя геопозиция"}
          </Button>
        </div>

        <AdvancedSettings
          className="mt-4"
          title={
            isEn
              ? "Location and technical formats"
              : "Геопозиция и технические форматы"
          }
          description={
            isEn
              ? "Use your device, adjust geohash and open map links"
              : "Геопозиция устройства, точность geohash и ссылки на карты"
          }
        >
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={useLocation}
            disabled={locating}
          >
            <MapPin size={18} />{" "}
            {locating
              ? isEn
                ? "Finding location…"
                : "Определяем геопозицию…"
              : isEn
                ? "Use my location"
                : "Использовать мою геопозицию"}
          </Button>
          <div className="mt-4 max-w-56">
            <Label htmlFor="coordinate-geohash-precision">
              {isEn ? "Geohash length" : "Длина geohash"}
            </Label>
            <Input
              id="coordinate-geohash-precision"
              type="number"
              min={1}
              max={12}
              value={geohashPrecision}
              onChange={(event) =>
                setGeohashPrecision(
                  Math.min(12, Math.max(1, Number(event.target.value) || 1)),
                )
              }
              className="mt-1.5 h-11"
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
            {isEn
              ? "The UTM value below is a zone identifier, not projected easting/northing coordinates. UTM zones cover latitudes from 80°S to 84°N."
              : "Значение UTM ниже — идентификатор зоны, а не проекционные координаты easting/northing. Зоны UTM покрывают широты от 80° ю. ш. до 84° с. ш."}
          </p>

          {output ? (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Geohash
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold">
                    {output.geohash}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {isEn ? "UTM zone" : "Зона UTM"}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold">
                    {output.utmZone ??
                      (isEn ? "Outside UTM coverage" : "Вне зоны покрытия UTM")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="min-h-11">
                  <a
                    href={output.openStreetMap}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenStreetMap ↗
                  </a>
                </Button>
                <Button asChild variant="outline" className="min-h-11">
                  <a
                    href={output.googleMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Maps ↗
                  </a>
                </Button>
              </div>
            </div>
          ) : null}
        </AdvancedSettings>
      </section>

      {output ? (
        <section
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          aria-live="polite"
        >
          <h2 className="font-bold">
            {isEn ? "Converted coordinates" : "Преобразованные координаты"}
          </h2>
          <dl className="mt-3 divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <div className="p-3">
              <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                DD
              </dt>
              <dd className="mt-1 break-words font-mono text-base font-semibold">
                {output.dd}
              </dd>
            </div>
            <div className="p-3">
              <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                DMS
              </dt>
              <dd className="mt-1 break-words font-mono text-sm">
                {output.dms}
              </dd>
            </div>
            <div className="p-3">
              <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                DDM
              </dt>
              <dd className="mt-1 break-words font-mono text-sm">
                {output.ddm}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
