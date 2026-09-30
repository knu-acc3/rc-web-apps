import type { Locale } from '@/src/i18n/index';
import { siteConfig } from '@/src/config/site.config';

export type LegacyConversionStatus = 'ok' | 'invalid-value' | 'unsupported-pair';

type LinearUnit = {
  slug: string;
  aliases: string[];
  label: string;
  labelRu: string;
  symbol: string;
  toBase: number;
};

type ConversionFamily = 'weight' | 'temperature' | 'energy' | 'resistance' | 'frequency';

type ConversionMetadata = {
  family: ConversionFamily;
  toolSlug?: string;
  groupSlug?: string;
  groupLabel: string;
  groupLabelRu: string;
};

export type LegacyConversionOk = {
  status: 'ok';
  family: ConversionFamily;
  pair: string;
  canonicalPair: string;
  rawValue: string;
  canonicalValue: string;
  inputValue: number;
  inputFormatted: string;
  resultValue: number;
  resultFormatted: string;
  fromUnit: LinearUnit;
  toUnit: LinearUnit;
  formula: string;
  toolSlug?: string;
  groupSlug?: string;
  groupLabel: string;
  groupLabelRu: string;
};

export type LegacyConversionInvalid = {
  status: 'invalid-value';
  pair: string;
  rawValue: string;
  reason: string;
};

export type LegacyConversionUnsupported = {
  status: 'unsupported-pair';
  pair: string;
  rawValue: string;
};

export type LegacyConversionResult =
  | LegacyConversionOk
  | LegacyConversionInvalid
  | LegacyConversionUnsupported;

export type ParsedLegacyConversionPath = {
  locale?: Locale;
  pair: string;
  value: string;
};

const NUMBER_RE = /^-?\d+(?:\.\d+)?$/;
const PAIR_RE = /^([a-z]+)-to-([a-z]+)$/;

const WEIGHT_UNITS: LinearUnit[] = [
  unit('kg', [], 'kilograms', 'kilograms', 'kg', 1),
  unit('g', [], 'grams', 'grams', 'g', 0.001),
  unit('mg', [], 'milligrams', 'milligrams', 'mg', 0.000001),
  unit('t', [], 'metric tons', 'metric tons', 't', 1000),
  unit('lbs', ['lb'], 'pounds', 'pounds', 'lb', 0.45359237),
  unit('oz', [], 'ounces', 'ounces', 'oz', 0.028349523125),
  unit('stone', [], 'stone', 'stone', 'st', 6.35029318),
];

const TEMPERATURE_UNITS: LinearUnit[] = [
  unit('kelvin', [], 'kelvin', 'kelvin', 'K', 1),
  unit('celsius', [], 'degrees Celsius', 'degrees Celsius', 'deg C', 1),
];

const ENERGY_UNITS: LinearUnit[] = [
  unit('kj', [], 'kilojoules', 'kilojoules', 'kJ', 1),
  unit('kcal', [], 'kilocalories', 'kilocalories', 'kcal', 4.184),
];

const RESISTANCE_UNITS: LinearUnit[] = [
  unit('kohm', [], 'kilohms', 'kilohms', 'kOhm', 1),
  unit('mohm', [], 'megohms', 'megohms', 'MOhm', 1000),
];

const FREQUENCY_UNITS: LinearUnit[] = [
  unit('mhz', [], 'megahertz', 'megahertz', 'MHz', 1),
  unit('ghz', [], 'gigahertz', 'gigahertz', 'GHz', 1000),
];

const FAMILY_METADATA: Record<ConversionFamily, ConversionMetadata> = {
  weight: {
    family: 'weight',
    toolSlug: 'weight-converter',
    groupLabel: 'Weight converter',
    groupLabelRu: 'Weight converter',
  },
  temperature: {
    family: 'temperature',
    toolSlug: 'temperature-converter',
    groupLabel: 'Temperature converter',
    groupLabelRu: 'Temperature converter',
  },
  energy: {
    family: 'energy',
    toolSlug: 'energy-converter',
    groupLabel: 'Energy converter',
    groupLabelRu: 'Energy converter',
  },
  resistance: {
    family: 'resistance',
    groupSlug: 'converters',
    groupLabel: 'Converters',
    groupLabelRu: 'Converters',
  },
  frequency: {
    family: 'frequency',
    groupSlug: 'converters',
    groupLabel: 'Converters',
    groupLabelRu: 'Converters',
  },
};

function unit(
  slug: string,
  aliases: string[],
  label: string,
  labelRu: string,
  symbol: string,
  toBase: number
): LinearUnit {
  return { slug, aliases, label, labelRu, symbol, toBase };
}

function findUnit(units: LinearUnit[], rawSlug: string): LinearUnit | undefined {
  return units.find((item) => item.slug === rawSlug || item.aliases.includes(rawSlug));
}

function normalizeValue(rawValue: string): string | null {
  let decoded = rawValue.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }

  if (!NUMBER_RE.test(decoded)) return null;
  const value = Number(decoded);
  if (!Number.isFinite(value)) return null;

  return value.toString();
}

function formatNumber(value: number, maximumFractionDigits = 10): string {
  if (Object.is(value, -0)) return '0';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    useGrouping: false,
  }).format(value);
}

function convertLinear(
  family: ConversionFamily,
  units: LinearUnit[],
  fromSlug: string,
  toSlug: string,
  inputValue: number
): LegacyConversionOk | null {
  const fromUnit = findUnit(units, fromSlug);
  const toUnit = findUnit(units, toSlug);
  if (!fromUnit || !toUnit || fromUnit.slug === toUnit.slug) return null;

  const metadata = FAMILY_METADATA[family];
  const resultValue = (inputValue * fromUnit.toBase) / toUnit.toBase;
  const ratio = fromUnit.toBase / toUnit.toBase;
  const inputFormatted = formatNumber(inputValue);
  const resultFormatted = formatNumber(resultValue);
  const ratioFormatted = formatNumber(ratio);

  return {
    status: 'ok',
    family,
    pair: `${fromSlug}-to-${toSlug}`,
    canonicalPair: `${fromUnit.slug}-to-${toUnit.slug}`,
    rawValue: inputFormatted,
    canonicalValue: inputValue.toString(),
    inputValue,
    inputFormatted,
    resultValue,
    resultFormatted,
    fromUnit,
    toUnit,
    formula: `${inputFormatted} ${fromUnit.symbol} x ${ratioFormatted} = ${resultFormatted} ${toUnit.symbol}`,
    toolSlug: metadata.toolSlug,
    groupSlug: metadata.groupSlug,
    groupLabel: metadata.groupLabel,
    groupLabelRu: metadata.groupLabelRu,
  };
}

function convertTemperature(
  fromSlug: string,
  toSlug: string,
  inputValue: number
): LegacyConversionOk | null {
  const fromUnit = findUnit(TEMPERATURE_UNITS, fromSlug);
  const toUnit = findUnit(TEMPERATURE_UNITS, toSlug);
  if (!fromUnit || !toUnit || fromUnit.slug === toUnit.slug) return null;

  const resultValue = fromUnit.slug === 'kelvin'
    ? inputValue - 273.15
    : inputValue + 273.15;
  const inputFormatted = formatNumber(inputValue);
  const resultFormatted = formatNumber(resultValue);
  const operator = fromUnit.slug === 'kelvin' ? '-' : '+';

  return {
    status: 'ok',
    family: 'temperature',
    pair: `${fromSlug}-to-${toSlug}`,
    canonicalPair: `${fromUnit.slug}-to-${toUnit.slug}`,
    rawValue: inputFormatted,
    canonicalValue: inputValue.toString(),
    inputValue,
    inputFormatted,
    resultValue,
    resultFormatted,
    fromUnit,
    toUnit,
    formula: `${inputFormatted} ${fromUnit.symbol} ${operator} 273.15 = ${resultFormatted} ${toUnit.symbol}`,
    toolSlug: FAMILY_METADATA.temperature.toolSlug,
    groupLabel: FAMILY_METADATA.temperature.groupLabel,
    groupLabelRu: FAMILY_METADATA.temperature.groupLabelRu,
  };
}

export function getLegacyConversion(pair: string, rawValue: string): LegacyConversionResult {
  const normalizedPair = pair.toLowerCase();
  const match = PAIR_RE.exec(normalizedPair);
  if (!match) return { status: 'unsupported-pair', pair: normalizedPair, rawValue };

  const [, fromSlug, toSlug] = match;
  const canonicalValue = normalizeValue(rawValue);
  const inputValue = canonicalValue === null ? Number.NaN : Number(canonicalValue);

  const family =
    findUnit(WEIGHT_UNITS, fromSlug) && findUnit(WEIGHT_UNITS, toSlug) ? 'weight'
      : findUnit(TEMPERATURE_UNITS, fromSlug) && findUnit(TEMPERATURE_UNITS, toSlug) ? 'temperature'
        : findUnit(ENERGY_UNITS, fromSlug) && findUnit(ENERGY_UNITS, toSlug) ? 'energy'
          : findUnit(RESISTANCE_UNITS, fromSlug) && findUnit(RESISTANCE_UNITS, toSlug) ? 'resistance'
            : findUnit(FREQUENCY_UNITS, fromSlug) && findUnit(FREQUENCY_UNITS, toSlug) ? 'frequency'
              : null;

  if (!family) return { status: 'unsupported-pair', pair: normalizedPair, rawValue };

  if (canonicalValue === null) {
    return {
      status: 'invalid-value',
      pair: normalizedPair,
      rawValue,
      reason: 'Value must be a plain finite number.',
    };
  }

  if (
    (family === 'weight' || family === 'energy' || family === 'resistance' || family === 'frequency')
    && inputValue < 0
  ) {
    return {
      status: 'invalid-value',
      pair: normalizedPair,
      rawValue,
      reason: 'This conversion expects a non-negative value.',
    };
  }

  if (family === 'temperature' && fromSlug === 'kelvin' && inputValue < 0) {
    return {
      status: 'invalid-value',
      pair: normalizedPair,
      rawValue,
      reason: 'Kelvin values cannot be below zero.',
    };
  }

  const conversion =
    family === 'weight'
      ? convertLinear(family, WEIGHT_UNITS, fromSlug, toSlug, inputValue)
      : family === 'temperature'
        ? convertTemperature(fromSlug, toSlug, inputValue)
        : family === 'energy'
          ? convertLinear(family, ENERGY_UNITS, fromSlug, toSlug, inputValue)
          : family === 'resistance'
            ? convertLinear(family, RESISTANCE_UNITS, fromSlug, toSlug, inputValue)
            : convertLinear(family, FREQUENCY_UNITS, fromSlug, toSlug, inputValue);

  return conversion || { status: 'unsupported-pair', pair: normalizedPair, rawValue };
}

export function parseLegacyConversionPath(pathname: string): ParsedLegacyConversionPath | null {
  const cleanPath = pathname.replace(/\/+$/, '');
  const parts = cleanPath.split('/').filter(Boolean);
  if (parts.length !== 2 && parts.length !== 3) return null;

  const first = parts[0];
  if (first === 'ru' || first === 'en') {
    if (parts.length !== 3) return null;
    return { locale: first, pair: parts[1].toLowerCase(), value: parts[2] };
  }

  if (parts.length !== 2) return null;
  return { pair: first.toLowerCase(), value: parts[1] };
}

export function isLegacyConversionPath(pathname: string): boolean {
  const parsed = parseLegacyConversionPath(pathname);
  if (!parsed) return false;
  return getLegacyConversion(parsed.pair, parsed.value).status !== 'unsupported-pair';
}

export function isPotentialLegacyConversionPath(pathname: string): boolean {
  const parsed = parseLegacyConversionPath(pathname);
  return Boolean(parsed && PAIR_RE.test(parsed.pair));
}

export function buildLegacyConversionPath(locale: Locale, conversion: LegacyConversionOk): string {
  return `/${locale}/${conversion.canonicalPair}/${encodeURIComponent(conversion.canonicalValue)}`;
}

export function buildLegacyConversionCanonicalUrl(locale: Locale, conversion: LegacyConversionOk): string {
  return `${siteConfig.baseUrl}${buildLegacyConversionPath(locale, conversion)}`;
}
