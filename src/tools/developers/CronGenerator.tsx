'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Clock, Warning, Lightning, Calendar, DownloadSimple } from '@phosphor-icons/react';
import { CopyButton } from '@/src/components/CopyButton';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { Card } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/cn';
import { downloadBlob } from '@/src/utils/exportHelpers';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { ToolPrimaryAction } from '@/src/components/tool/workspace';
import { useUrlState } from '@/src/hooks/useUrlState';

type FieldMode = 'wildcard' | 'every' | 'specific' | 'range';

interface FieldState {
  mode: FieldMode;
  every: number;       // for 'every' mode
  values: number[];    // for 'specific' mode
  rangeA: number;      // for 'range' mode
  rangeB: number;      // for 'range' mode
}

interface BuilderState {
  second: FieldState;
  minute: FieldState;
  hour: FieldState;
  dayOfMonth: FieldState;
  month: FieldState;
  dayOfWeek: FieldState;
}

type FieldKey = keyof BuilderState;

const FIELD_RANGES: Record<FieldKey, { min: number; max: number }> = {
  second: { min: 0, max: 59 },
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  dayOfWeek: { min: 0, max: 6 },
};

const monthNamesShortRu = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const monthNamesShortEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthNamesFullRu = [
  'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне',
  'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре',
];
const monthNamesFullEn = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const dowShortRu = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const dowShortEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dowFullRu = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const dowOnRu = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
const dowFromRu = ['воскресенья', 'понедельника', 'вторника', 'среды', 'четверга', 'пятницы', 'субботы'];
const dowFullEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ---------- TOKEN <-> FIELDSTATE ----------

function tokenToFieldState(token: string, range: { min: number; max: number }): FieldState | null {
  const t = token.trim();
  if (!t) return null;

  if (t === '*') {
    return { mode: 'wildcard', every: 1, values: [], rangeA: range.min, rangeB: range.max };
  }
  // every: */N or N (where N >= 1)
  const stepMatch = t.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const n = parseInt(stepMatch[1], 10);
    if (n >= 1 && n <= range.max) {
      return { mode: 'every', every: n, values: [], rangeA: range.min, rangeB: range.max };
    }
    return null;
  }
  // range A-B
  const rangeMatch = t.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10);
    const b = parseInt(rangeMatch[2], 10);
    if (a >= range.min && b <= range.max && a <= b) {
      return { mode: 'range', every: 1, values: [], rangeA: a, rangeB: b };
    }
    return null;
  }
  // specific values: comma list of ints
  const specificMatch = t.match(/^\d+(,\d+)*$/);
  if (specificMatch) {
    const nums = t.split(',').map((s) => parseInt(s, 10));
    for (const n of nums) {
      if (isNaN(n) || n < range.min || n > range.max) return null;
    }
    return { mode: 'specific', every: 1, values: nums, rangeA: range.min, rangeB: range.max };
  }
  return null;
}

function fieldStateToToken(state: FieldState): string {
  switch (state.mode) {
    case 'wildcard':
      return '*';
    case 'every':
      return `*/${state.every}`;
    case 'specific':
      if (state.values.length === 0) return '*';
      return [...state.values].sort((a, b) => a - b).join(',');
    case 'range':
      return `${state.rangeA}-${state.rangeB}`;
  }
}

// ---------- CRON STRING <-> BUILDER STATE ----------

interface ParsedCron {
  builder: BuilderState;
  hasSeconds: boolean;
}

function defaultFieldState(range: { min: number; max: number }): FieldState {
  return { mode: 'wildcard', every: 1, values: [], rangeA: range.min, rangeB: range.max };
}

function defaultBuilder(): BuilderState {
  return {
    second: defaultFieldState(FIELD_RANGES.second),
    minute: defaultFieldState(FIELD_RANGES.minute),
    hour: defaultFieldState(FIELD_RANGES.hour),
    dayOfMonth: defaultFieldState(FIELD_RANGES.dayOfMonth),
    month: defaultFieldState(FIELD_RANGES.month),
    dayOfWeek: defaultFieldState(FIELD_RANGES.dayOfWeek),
  };
}

function parseCronString(input: string): ParsedCron | null {
  const parts = input.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) return null;
  const hasSeconds = parts.length === 6;

  let offset = 0;
  const builder = defaultBuilder();
  if (hasSeconds) {
    const s = tokenToFieldState(parts[0], FIELD_RANGES.second);
    if (!s) return null;
    builder.second = s;
    offset = 1;
  }
  const minute = tokenToFieldState(parts[offset], FIELD_RANGES.minute);
  const hour = tokenToFieldState(parts[offset + 1], FIELD_RANGES.hour);
  const dom = tokenToFieldState(parts[offset + 2], FIELD_RANGES.dayOfMonth);
  const month = tokenToFieldState(parts[offset + 3], FIELD_RANGES.month);
  const dow = tokenToFieldState(parts[offset + 4], FIELD_RANGES.dayOfWeek);
  if (!minute || !hour || !dom || !month || !dow) return null;
  builder.minute = minute;
  builder.hour = hour;
  builder.dayOfMonth = dom;
  builder.month = month;
  builder.dayOfWeek = dow;
  return { builder, hasSeconds };
}

function builderToCronString(builder: BuilderState, includeSeconds: boolean): string {
  const minute = fieldStateToToken(builder.minute);
  const hour = fieldStateToToken(builder.hour);
  const dom = fieldStateToToken(builder.dayOfMonth);
  const month = fieldStateToToken(builder.month);
  const dow = fieldStateToToken(builder.dayOfWeek);
  if (includeSeconds) {
    const second = fieldStateToToken(builder.second);
    return `${second} ${minute} ${hour} ${dom} ${month} ${dow}`;
  }
  return `${minute} ${hour} ${dom} ${month} ${dow}`;
}

// ---------- CRON FIELD MATCH (token-based) ----------

function expandTokenToSet(token: string, range: { min: number; max: number }): Set<number> {
  const out = new Set<number>();
  if (token === '*') {
    for (let i = range.min; i <= range.max; i++) out.add(i);
    return out;
  }
  for (const part of token.split(',')) {
    const p = part.trim();
    const stepMatch = p.match(/^\*\/(\d+)$/);
    if (stepMatch) {
      const step = parseInt(stepMatch[1], 10);
      for (let i = range.min; i <= range.max; i += step) out.add(i);
      continue;
    }
    const rangeMatch = p.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1], 10);
      const b = parseInt(rangeMatch[2], 10);
      for (let i = a; i <= b; i++) out.add(i);
      continue;
    }
    const n = parseInt(p, 10);
    if (!isNaN(n)) out.add(n);
  }
  return out;
}

// ---------- NEXT N RUNS ----------

function matchesCronDay(
  dayOfMonthToken: string,
  dayOfWeekToken: string,
  dayOfMonth: number,
  dayOfWeek: number,
  dayOfMonthSet: Set<number>,
  dayOfWeekSet: Set<number>,
): boolean {
  const dayOfMonthIsAny = dayOfMonthToken === '*';
  const dayOfWeekIsAny = dayOfWeekToken === '*';
  const dayOfMonthMatches = dayOfMonthSet.has(dayOfMonth);
  const dayOfWeekMatches = dayOfWeekSet.has(dayOfWeek);

  if (dayOfMonthIsAny && dayOfWeekIsAny) return true;
  if (dayOfMonthIsAny) return dayOfWeekMatches;
  if (dayOfWeekIsAny) return dayOfMonthMatches;

  // Standard five/six-field cron uses OR when both day fields are restricted.
  return dayOfMonthMatches || dayOfWeekMatches;
}

function computeNextRuns(cronStr: string, count: number, includeSeconds: boolean): Date[] {
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length !== (includeSeconds ? 6 : 5)) return [];

  const secTok = includeSeconds ? parts[0] : '0';
  const minTok = parts[includeSeconds ? 1 : 0];
  const hourTok = parts[includeSeconds ? 2 : 1];
  const domTok = parts[includeSeconds ? 3 : 2];
  const monthTok = parts[includeSeconds ? 4 : 3];
  const dowTok = parts[includeSeconds ? 5 : 4];

  let secSet: Set<number>;
  let minSet: Set<number>;
  let hourSet: Set<number>;
  let domSet: Set<number>;
  let monthSet: Set<number>;
  let dowSet: Set<number>;
  try {
    secSet = expandTokenToSet(secTok, FIELD_RANGES.second);
    minSet = expandTokenToSet(minTok, FIELD_RANGES.minute);
    hourSet = expandTokenToSet(hourTok, FIELD_RANGES.hour);
    domSet = expandTokenToSet(domTok, FIELD_RANGES.dayOfMonth);
    monthSet = expandTokenToSet(monthTok, FIELD_RANGES.month);
    dowSet = expandTokenToSet(dowTok, FIELD_RANGES.dayOfWeek);
  } catch {
    return [];
  }

  const results: Date[] = [];
  const cur = new Date();

  if (includeSeconds) {
    cur.setMilliseconds(0);
    cur.setSeconds(cur.getSeconds() + 1);
    // safety: 1 year of seconds = 31,536,000 — way too many. Use minute-major loop & step seconds.
    // Strategy: iterate per second but cap at 60 days for second-precision.
    let guard = 60 * 60 * 24 * 60; // 60 days in seconds
    while (results.length < count && guard-- > 0) {
      const mo = cur.getMonth() + 1;
      const d = cur.getDate();
      const h = cur.getHours();
      const mi = cur.getMinutes();
      const s = cur.getSeconds();
      const dow = cur.getDay();
      if (
        monthSet.has(mo) &&
        matchesCronDay(domTok, dowTok, d, dow, domSet, dowSet) &&
        hourSet.has(h) &&
        minSet.has(mi) &&
        secSet.has(s)
      ) {
        results.push(new Date(cur));
      }
      cur.setSeconds(cur.getSeconds() + 1);
    }
    return results;
  }

  // 5-field: minute precision
  cur.setSeconds(0, 0);
  cur.setMinutes(cur.getMinutes() + 1);
  let guard = 525600; // minutes in 1 year
  while (results.length < count && guard-- > 0) {
    const mo = cur.getMonth() + 1;
    const d = cur.getDate();
    const h = cur.getHours();
    const mi = cur.getMinutes();
    const dow = cur.getDay();
    if (
      monthSet.has(mo) &&
      matchesCronDay(domTok, dowTok, d, dow, domSet, dowSet) &&
      hourSet.has(h) &&
      minSet.has(mi)
    ) {
      results.push(new Date(cur));
    }
    cur.setMinutes(cur.getMinutes() + 1);
  }
  return results;
}

// ---------- DESCRIPTION ----------

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

interface DescriptionInput {
  cronStr: string;
  includeSeconds: boolean;
  isEn: boolean;
}

interface PresetDescriptor {
  cron5: string;
  ruDesc: string;
  enDesc: string;
}

const PRESETS: { label: string; labelEn: string; cron5: string; ruDesc: string; enDesc: string }[] = [
  { label: 'Каждую минуту',           labelEn: 'Every minute',          cron5: '* * * * *',     ruDesc: 'Каждую минуту',                            enDesc: 'Every minute' },
  { label: 'Каждые 5 минут',          labelEn: 'Every 5 minutes',       cron5: '*/5 * * * *',   ruDesc: 'Каждые 5 минут',                           enDesc: 'Every 5 minutes' },
  { label: 'Каждые 15 минут',         labelEn: 'Every 15 minutes',      cron5: '*/15 * * * *',  ruDesc: 'Каждые 15 минут',                          enDesc: 'Every 15 minutes' },
  { label: 'Каждый час',              labelEn: 'Every hour',            cron5: '0 * * * *',     ruDesc: 'В начале каждого часа',                    enDesc: 'At the start of every hour' },
  { label: 'Каждый день в 09:00',     labelEn: 'Daily at 09:00',        cron5: '0 9 * * *',     ruDesc: 'Каждый день в 09:00',                      enDesc: 'Every day at 09:00' },
  { label: 'Каждый день в полночь',   labelEn: 'Daily at midnight',     cron5: '0 0 * * *',     ruDesc: 'Каждый день в 00:00',                      enDesc: 'Every day at midnight' },
  { label: 'Каждый рабочий день 09:30', labelEn: 'Workdays 09:30',      cron5: '30 9 * * 1-5',  ruDesc: 'В 09:30 каждый будний день',               enDesc: 'At 09:30 on weekdays' },
  { label: 'Каждый понедельник 09:00', labelEn: 'Every Monday 09:00',   cron5: '0 9 * * 1',     ruDesc: 'Каждый понедельник в 09:00',               enDesc: 'Every Monday at 09:00' },
  { label: '1-го числа каждого месяца', labelEn: 'First day of month',  cron5: '0 0 1 * *',     ruDesc: '1-го числа каждого месяца в 00:00',        enDesc: 'On the 1st of every month at midnight' },
  { label: '1 января ежегодно',       labelEn: 'January 1st yearly',    cron5: '0 0 1 1 *',     ruDesc: '1 января ежегодно в 00:00',                enDesc: 'On January 1st at midnight' },
];

const PRESET_DESCRIPTORS: PresetDescriptor[] = PRESETS.map((p) => ({
  cron5: p.cron5,
  ruDesc: p.ruDesc,
  enDesc: p.enDesc,
}));

function describeMinuteHour(minTok: string, hourTok: string, isEn: boolean): string {
  // single minute + single hour => HH:MM
  if (/^\d+$/.test(minTok) && /^\d+$/.test(hourTok)) {
    const m = parseInt(minTok, 10);
    const h = parseInt(hourTok, 10);
    if (m >= 0 && m < 60 && h >= 0 && h < 24) {
      return isEn ? `at ${pad2(h)}:${pad2(m)}` : `в ${pad2(h)}:${pad2(m)}`;
    }
  }
  // every-N minute + wildcard hour
  if (minTok.match(/^\*\/(\d+)$/) && hourTok === '*') {
    const n = parseInt(minTok.slice(2), 10);
    return isEn ? `every ${n} minutes` : `каждые ${n} мин.`;
  }
  // wildcard minute + specific hour => every minute of hour
  if (minTok === '*' && hourTok === '*') {
    return isEn ? 'every minute' : 'каждую минуту';
  }
  // 0 minute + wildcard hour
  if (minTok === '0' && hourTok === '*') {
    return isEn ? 'at the start of every hour' : 'в начале каждого часа';
  }
  // 0 minute + every-N hour
  if (minTok === '0' && hourTok.match(/^\*\/(\d+)$/)) {
    const n = parseInt(hourTok.slice(2), 10);
    return isEn ? `every ${n} hours` : `каждые ${n} ч.`;
  }
  // range hour 9-18 + 0 minute
  if (minTok === '0' && hourTok.match(/^(\d+)-(\d+)$/)) {
    return isEn ? `every hour from ${hourTok}` : `каждый час с ${hourTok}`;
  }
  // generic fallback
  const minPart = describeFieldGeneric(minTok, 'minute', isEn);
  const hourPart = describeFieldGeneric(hourTok, 'hour', isEn);
  return `${minPart} ${hourPart}`;
}

function describeFieldGeneric(token: string, field: 'minute' | 'hour' | 'dom' | 'month' | 'dow' | 'second', isEn: boolean): string {
  if (token === '*') {
    switch (field) {
      case 'second': return isEn ? 'every second' : 'каждую секунду';
      case 'minute': return isEn ? 'every minute' : 'каждую минуту';
      case 'hour':   return isEn ? 'every hour'   : 'каждый час';
      case 'dom':    return '';
      case 'month':  return '';
      case 'dow':    return '';
    }
  }
  const stepM = token.match(/^\*\/(\d+)$/);
  if (stepM) {
    const n = parseInt(stepM[1], 10);
    switch (field) {
      case 'second': return isEn ? `every ${n} seconds` : `каждые ${n} с`;
      case 'minute': return isEn ? `every ${n} minutes` : `каждые ${n} мин.`;
      case 'hour':   return isEn ? `every ${n} hours`   : `каждые ${n} ч.`;
      case 'dom':    return isEn ? `every ${n} days`    : `каждые ${n} дн.`;
      case 'month':  return isEn ? `every ${n} months`  : `каждые ${n} мес.`;
      case 'dow':    return isEn ? `every ${n} days`    : `каждые ${n} дн.`;
    }
  }
  const rangeM = token.match(/^(\d+)-(\d+)$/);
  if (rangeM) {
    const a = parseInt(rangeM[1], 10);
    const b = parseInt(rangeM[2], 10);
    if (field === 'dow') {
      if (a === 1 && b === 5) return isEn ? 'on weekdays' : 'по будням';
      const aN = (isEn ? dowFullEn : dowFromRu)[a] ?? String(a);
      const bN = (isEn ? dowFullEn : dowOnRu)[b] ?? String(b);
      return isEn ? `from ${aN} to ${bN}` : `с ${aN} по ${bN}`;
    }
    if (field === 'month') {
      const aN = (isEn ? monthNamesFullEn : monthNamesFullRu)[a - 1] ?? String(a);
      const bN = (isEn ? monthNamesFullEn : monthNamesFullRu)[b - 1] ?? String(b);
      return isEn ? `from ${aN} to ${bN}` : `с ${aN} по ${bN}`;
    }
    return isEn ? `from ${a} to ${b}` : `с ${a} по ${b}`;
  }
  // specific list or single
  if (/^\d+(,\d+)*$/.test(token)) {
    const nums = token.split(',').map((s) => parseInt(s, 10));
    if (field === 'dow') {
      if (token === '0,6' || token === '6,0') return isEn ? 'on weekends' : 'по выходным';
      if (nums.length === 1) {
        const name = (isEn ? dowFullEn : dowOnRu)[nums[0]] ?? String(nums[0]);
        return isEn ? `on ${name}` : `в ${name}`;
      }
      const names = nums.map((n) => (isEn ? dowFullEn : dowFullRu)[n] ?? String(n));
      return isEn ? `on ${names.join(', ')}` : `по дням: ${names.join(', ')}`;
    }
    if (field === 'month') {
      const names = nums.map((n) => (isEn ? monthNamesFullEn : monthNamesFullRu)[n - 1] ?? String(n));
      if (names.length === 1) return isEn ? `in ${names[0]}` : `в ${names[0]}`;
      return isEn ? `in ${names.join(', ')}` : `в месяцы: ${names.join(', ')}`;
    }
    if (field === 'dom') {
      if (nums.length === 1) return isEn ? `on day ${nums[0]}` : `${nums[0]}-го числа`;
      return isEn ? `on days ${nums.join(', ')}` : `по дням: ${nums.join(', ')}`;
    }
    if (field === 'hour') {
      if (nums.length === 1) return isEn ? `at hour ${nums[0]}` : `в ${nums[0]} ч.`;
      return isEn ? `at hours ${nums.join(', ')}` : `в часы: ${nums.join(', ')}`;
    }
    if (field === 'minute') {
      if (nums.length === 1) return isEn ? `at minute ${nums[0]}` : `в ${nums[0]} мин.`;
      return isEn ? `at minutes ${nums.join(', ')}` : `в минуты: ${nums.join(', ')}`;
    }
    if (field === 'second') {
      if (nums.length === 1) return isEn ? `at second ${nums[0]}` : `в ${nums[0]} с`;
      return isEn ? `at seconds ${nums.join(', ')}` : `в секунды: ${nums.join(', ')}`;
    }
  }
  return token;
}

function describeCron(input: DescriptionInput): string {
  const { cronStr, includeSeconds, isEn } = input;
  // Preset shortcut for 5-field only
  if (!includeSeconds) {
    const preset = PRESET_DESCRIPTORS.find((p) => p.cron5 === cronStr.trim());
    if (preset) return isEn ? preset.enDesc : preset.ruDesc;
  }

  const parts = cronStr.trim().split(/\s+/);
  if (parts.length !== (includeSeconds ? 6 : 5)) return cronStr;

  const offset = includeSeconds ? 1 : 0;
  const secTok = includeSeconds ? parts[0] : '';
  const minTok = parts[offset];
  const hourTok = parts[offset + 1];
  const domTok = parts[offset + 2];
  const monthTok = parts[offset + 3];
  const dowTok = parts[offset + 4];

  const segments: string[] = [];

  if (includeSeconds && secTok && secTok !== '0') {
    segments.push(describeFieldGeneric(secTok, 'second', isEn));
  }
  segments.push(describeMinuteHour(minTok, hourTok, isEn));

  const dayOfMonthDescription =
    domTok === '*' ? '' : describeFieldGeneric(domTok, 'dom', isEn);
  const dayOfWeekDescription =
    dowTok === '*' ? '' : describeFieldGeneric(dowTok, 'dow', isEn);

  if (dayOfMonthDescription && dayOfWeekDescription) {
    segments.push(
      isEn
        ? dayOfMonthDescription + ' or ' + dayOfWeekDescription
        : dayOfMonthDescription + ' или ' + dayOfWeekDescription,
    );
  } else if (dayOfMonthDescription || dayOfWeekDescription) {
    segments.push(dayOfMonthDescription || dayOfWeekDescription);
  }

  if (monthTok !== '*') {
    const desc = describeFieldGeneric(monthTok, 'month', isEn);
    if (desc) segments.push(desc);
  }

  // Capitalize first letter
  const joined = segments.filter(Boolean).join(', ');
  if (!joined) return isEn ? 'Every minute' : 'Каждую минуту';
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

function formatRelative(future: Date, isEn: boolean): string {
  const ms = future.getTime() - Date.now();
  if (ms <= 0) return isEn ? 'now' : 'сейчас';
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return isEn ? `in ${day}d ${hr % 24}h` : `через ${day} д ${hr % 24} ч`;
  if (hr > 0) return isEn ? `in ${hr}h ${min % 60}m` : `через ${hr} ч ${min % 60} мин`;
  if (min > 0) return isEn ? `in ${min} min` : `через ${min} мин`;
  return isEn ? 'in <1 min' : 'через <1 мин';
}

// ---------- FIELD UI ----------

interface FieldEditorProps {
  label: string;
  state: FieldState;
  isEn: boolean;
  onChange: (s: FieldState) => void;
  range: { min: number; max: number };
  chipLabels?: string[];
}

function FieldEditor({ label, state, isEn, onChange, range, chipLabels }: FieldEditorProps) {
  const modeButton = (m: FieldMode, text: string) => (
    <button
      key={m}
      type="button"
      onClick={() => onChange({ ...state, mode: m })}
      className={cn(
        'cursor-pointer rounded-[var(--radius-pill)] border px-2 py-0.5 text-[11px] font-semibold transition-colors',
        state.mode === m
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
          : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
      )}
    >
      {text}
    </button>
  );

  const toggleValue = (v: number) => {
    const exists = state.values.includes(v);
    const next = exists ? state.values.filter((x) => x !== v) : [...state.values, v];
    onChange({ ...state, values: next });
  };

  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-[10px] tabular-nums text-[var(--color-text-muted)]">
          {range.min}-{range.max}
        </span>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {modeButton('wildcard', isEn ? 'Any *' : 'Любое *')}
        {modeButton('every', isEn ? 'Every N' : 'Каждые N')}
        {modeButton('specific', isEn ? 'Specific' : 'Список')}
        {modeButton('range', isEn ? 'Range' : 'Диапазон')}
      </div>

      {state.mode === 'wildcard' && (
        <div className="text-xs text-[var(--color-text-muted)]">
          {isEn ? 'Matches all values (*)' : 'Любое значение (*)'}
        </div>
      )}

      {state.mode === 'every' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">{isEn ? 'Step:' : 'Шаг:'}</span>
          <span className="font-mono text-xs text-[var(--color-text-muted)]">*/</span>
          <Input
            type="number"
            min={1}
            max={range.max}
            value={state.every}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n) && n >= 1 && n <= range.max) onChange({ ...state, every: n });
            }}
            className="h-8 w-20 text-sm"
          />
        </div>
      )}

      {state.mode === 'specific' && (
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: range.max - range.min + 1 }, (_, i) => {
            const v = range.min + i;
            const labelText = chipLabels ? chipLabels[i] ?? String(v) : String(v);
            const active = state.values.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggleValue(v)}
                className={cn(
                  'cursor-pointer rounded-[var(--radius-sm)] border px-1.5 py-0.5 font-mono text-[11px] tabular-nums transition-colors',
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
                )}
                aria-pressed={active}
              >
                {labelText}
              </button>
            );
          })}
          {state.values.length === 0 && (
            <div className="mt-1 w-full text-[11px] text-[var(--color-warning)]">
              {isEn ? 'Select at least one — currently treated as *' : 'Выберите минимум одно — сейчас как *'}
            </div>
          )}
        </div>
      )}

      {state.mode === 'range' && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={range.min}
            max={range.max}
            value={state.rangeA}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n)) onChange({ ...state, rangeA: n });
            }}
            className="h-8 w-20 text-sm"
            aria-label={`${label} - from`}
          />
          <span className="text-xs text-[var(--color-text-muted)]">—</span>
          <Input
            type="number"
            min={range.min}
            max={range.max}
            value={state.rangeB}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n)) onChange({ ...state, rangeB: n });
            }}
            className="h-8 w-20 text-sm"
            aria-label={`${label} - to`}
          />
          {(state.rangeA < range.min || state.rangeB > range.max || state.rangeA > state.rangeB) && (
            <span className="text-[10px] text-[var(--color-danger)]">
              {isEn ? 'invalid range' : 'неверный диапазон'}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------- MAIN ----------

export default function CronGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';

  const { state: urlState, setState: setUrlState } = useUrlState({
    defaultValues: {
      cron: '0 9 * * *',
    },
  });

  const [builder, setBuilder] = useState<BuilderState>(() => {
    const initial = parseCronString(urlState.cron || '0 9 * * *');
    return initial?.builder ?? defaultBuilder();
  });
  const [includeSeconds, setIncludeSeconds] = useState(() => {
    const initial = parseCronString(urlState.cron || '');
    return initial?.hasSeconds ?? false;
  });
  const [manualInput, setManualInput] = useState(() => urlState.cron || '0 9 * * *');
  const [manualError, setManualError] = useState('');

  const cronExpression = useMemo(
    () => builderToCronString(builder, includeSeconds),
    [builder, includeSeconds],
  );

  useEffect(() => {
    if (urlState.cron && urlState.cron !== cronExpression) {
      const parsed = parseCronString(urlState.cron);
      if (parsed) {
        const timer = setTimeout(() => {
          setBuilder(parsed.builder);
          setIncludeSeconds(parsed.hasSeconds);
          setManualInput(urlState.cron);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [urlState.cron, cronExpression]);

  useEffect(() => {
    if (cronExpression) {
      setUrlState({ cron: cronExpression });
    }
  }, [cronExpression, setUrlState]);

  const description = useMemo(
    () => describeCron({ cronStr: cronExpression, includeSeconds, isEn }),
    [cronExpression, includeSeconds, isEn],
  );

  const nextRuns = useMemo(
    () => computeNextRuns(cronExpression, 5, includeSeconds),
    [cronExpression, includeSeconds],
  );

  const selectedPreset = useMemo(
    () =>
      includeSeconds
        ? ''
        : (PRESETS.find((preset) => preset.cron5 === cronExpression)?.cron5 ?? ''),
    [cronExpression, includeSeconds],
  );

  const fmtAbs = useCallback(
    (date: Date) =>
      date.toLocaleString(isEn ? 'en-US' : 'ru-RU', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
      }),
    [includeSeconds, isEn],
  );

  const nextRunsReport = useMemo(() => {
    if (nextRuns.length === 0) return '';
    return [
      (isEn ? 'Expression' : 'Выражение') + ': ' + cronExpression,
      (isEn ? 'Description' : 'Описание') + ': ' + description,
      '',
      ...nextRuns.map(
        (date, index) =>
          String(index + 1) + '. ' + fmtAbs(date) + ' (' + formatRelative(date, isEn) + ')',
      ),
    ].join('\n');
  }, [cronExpression, description, fmtAbs, isEn, nextRuns]);

  const downloadNextRunsCsv = useCallback(() => {
    if (nextRuns.length === 0) return;
    const rows = [
      ['index', 'local_time', 'iso_time', 'relative'],
      ...nextRuns.map((date, index) => [
        String(index + 1),
        fmtAbs(date),
        date.toISOString(),
        formatRelative(date, isEn),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => '"' + value.replace(/"/g, '""') + '"').join(','))
      .join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'cron-next-runs.csv');
  }, [fmtAbs, isEn, nextRuns]);

  const applyManualInput = useCallback(() => {
    const parsed = parseCronString(manualInput);
    if (!parsed) {
      setManualError(
        isEn
          ? 'Use a valid 5-field cron, or 6 fields when the first field is seconds.'
          : 'Введите корректный cron из 5 полей или 6 полей, где первое поле — секунды.',
      );
      return;
    }

    setBuilder(parsed.builder);
    setIncludeSeconds(parsed.hasSeconds);
    setManualInput(builderToCronString(parsed.builder, parsed.hasSeconds));
    setManualError('');
  }, [isEn, manualInput]);

  const updateField = useCallback(
    (key: FieldKey, next: FieldState) => {
      const nextBuilder = { ...builder, [key]: next };
      setBuilder(nextBuilder);
      setManualInput(builderToCronString(nextBuilder, includeSeconds));
      setManualError('');
    },
    [builder, includeSeconds],
  );

  const updateSecondsMode = useCallback(
    (enabled: boolean) => {
      setIncludeSeconds(enabled);
      setManualInput(builderToCronString(builder, enabled));
      setManualError('');
    },
    [builder],
  );

  const applyPreset = useCallback((cron: string) => {
    const parsed = parseCronString(cron);
    if (!parsed) return;
    setBuilder(parsed.builder);
    setIncludeSeconds(false);
    setManualInput(builderToCronString(parsed.builder, false));
    setManualError('');
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
      <Card className="p-4 sm:p-5">
        <Label htmlFor="cron-input" className="mb-2 block text-sm font-medium">
          {isEn ? 'Cron expression' : 'Cron-выражение'}
        </Label>
        <Input
          id="cron-input"
          value={manualInput}
          onChange={(event) => {
            setManualInput(event.target.value);
            setManualError('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') applyManualInput();
          }}
          placeholder="* * * * *"
          className={cn(
            'h-11 font-mono text-base',
            manualError && 'border-[var(--color-danger)]/60',
          )}
          aria-invalid={manualError ? true : undefined}
          aria-describedby={manualError ? 'cron-error' : 'cron-format'}
        />
        <p id="cron-format" className="mt-1.5 text-xs text-[var(--color-text-muted)]">
          {isEn
            ? '5 fields: minute, hour, day, month, weekday. A 6th leading field means seconds.'
            : '5 полей: минута, час, день, месяц, день недели. Первое поле в формате из 6 — секунды.'}
        </p>

        <div className="mt-4">
          <ToolPrimaryAction
            type="button"
            onClick={applyManualInput}
            disabled={!manualInput.trim()}
            leadingIcon={<Clock size={20} />}
          >
            {isEn ? 'Apply cron' : 'Применить cron'}
          </ToolPrimaryAction>
        </div>

        {manualError && (
          <p
            id="cron-error"
            role="alert"
            className="mt-3 flex items-start gap-2 text-sm text-[var(--color-danger)]"
          >
            <Warning size={18} weight="fill" className="mt-0.5 shrink-0" />
            {manualError}
          </p>
        )}

        <section
          className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
          aria-live="polite"
        >
          <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {isEn ? 'Current schedule' : 'Текущее расписание'}
              </span>
              <Badge variant="outline">
                {includeSeconds
                  ? isEn
                    ? '6 fields · seconds'
                    : '6 полей · секунды'
                  : isEn
                    ? '5 fields'
                    : '5 полей'}
              </Badge>
            </div>
            <CopyButton text={cronExpression} size="medium" />
          </div>
          <p className="break-all font-mono text-xl font-bold tracking-wide text-[var(--color-primary)] sm:text-2xl">
            {cronExpression}
          </p>
          <div className="mt-3 flex items-start gap-2 border-t border-[var(--color-border)] pt-3">
            <Calendar size={18} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
            <p className="text-sm">{description}</p>
          </div>
        </section>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex min-h-11 flex-wrap items-center gap-2">
          <Clock size={20} className="text-[var(--color-text-muted)]" />
          <h2 className="text-sm font-bold">
            {isEn ? 'Next 5 runs' : 'Ближайшие 5 запусков'}
          </h2>
          <Badge variant="outline" className="sm:ml-auto">
            {isEn ? 'Local time' : 'Местное время'}
          </Badge>
          <div className="ml-auto flex items-center gap-1 sm:ml-0">
            <CopyButton
              text={nextRunsReport}
              size="medium"
              tooltip={isEn ? 'Copy upcoming runs' : 'Копировать ближайшие запуски'}
              silent={nextRuns.length === 0}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={downloadNextRunsCsv}
              disabled={nextRuns.length === 0}
              aria-label={isEn ? 'Download upcoming runs as CSV' : 'Скачать ближайшие запуски в CSV'}
            >
              <DownloadSimple size={18} />
            </Button>
          </div>
        </div>

        {nextRuns.length === 0 ? (
          <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 p-3 text-sm text-[var(--color-text-muted)]">
            <Lightning size={18} className="mt-0.5 shrink-0 text-[var(--color-warning)]" weight="fill" />
            {isEn
              ? 'No matching run was found in the supported search window. Check the field combination.'
              : 'В поддерживаемом диапазоне поиска запуск не найден. Проверьте сочетание полей.'}
          </div>
        ) : (
          <ol className="space-y-1.5">
            {nextRuns.map((date, index) => (
              <li
                key={date.toISOString()}
                className={cn(
                  'flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border px-3 py-2',
                  index === 0
                    ? 'border-[color-mix(in_oklab,var(--color-primary)_25%,transparent)] bg-[color-mix(in_oklab,var(--color-primary)_7%,transparent)]'
                    : 'border-transparent bg-[var(--color-surface-muted)]',
                )}
              >
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <Badge variant="primary">{isEn ? 'Next' : 'Следующий'}</Badge>
                  )}
                  <span className={cn('font-mono text-sm', index === 0 && 'font-bold')}>
                    {fmtAbs(date)}
                  </span>
                </div>
                <span className="font-mono text-xs tabular-nums text-[var(--color-primary)]">
                  {formatRelative(date, isEn)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <AdvancedSettings
        title={isEn ? 'Schedule builder' : 'Конструктор расписания'}
        description={
          isEn
            ? 'Presets, seconds and precise field rules'
            : 'Частые расписания, секунды и точные правила полей'
        }
      >
        <div className="space-y-5 [&_button]:min-h-11 [&_input]:min-h-11 [&_select]:min-h-11">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">
                {isEn ? 'Common schedule' : 'Частое расписание'}
              </span>
              <select
                value={selectedPreset}
                onChange={(event) => {
                  if (event.target.value) applyPreset(event.target.value);
                }}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="">{isEn ? 'Custom' : 'Своё'}</option>
                {PRESETS.slice(0, 5).map((preset) => (
                  <option key={preset.cron5} value={preset.cron5}>
                    {isEn ? preset.labelEn : preset.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-h-11 cursor-pointer items-end gap-3 pb-2 text-sm">
              <input
                type="checkbox"
                checked={includeSeconds}
                onChange={(event) => updateSecondsMode(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? 'Use 6 fields with seconds' : 'Использовать 6 полей с секундами'}
            </label>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            {isEn
              ? 'When both day-of-month and weekday are restricted, standard cron runs when either field matches.'
              : 'Если ограничены и день месяца, и день недели, стандартный cron запускается при совпадении любого из них.'}
          </p>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {includeSeconds && (
              <FieldEditor
                label={isEn ? 'Second' : 'Секунда'}
                state={builder.second}
                isEn={isEn}
                onChange={(next) => updateField('second', next)}
                range={FIELD_RANGES.second}
              />
            )}
            <FieldEditor
              label={isEn ? 'Minute' : 'Минута'}
              state={builder.minute}
              isEn={isEn}
              onChange={(next) => updateField('minute', next)}
              range={FIELD_RANGES.minute}
            />
            <FieldEditor
              label={isEn ? 'Hour' : 'Час'}
              state={builder.hour}
              isEn={isEn}
              onChange={(next) => updateField('hour', next)}
              range={FIELD_RANGES.hour}
            />
            <FieldEditor
              label={isEn ? 'Day of month' : 'День месяца'}
              state={builder.dayOfMonth}
              isEn={isEn}
              onChange={(next) => updateField('dayOfMonth', next)}
              range={FIELD_RANGES.dayOfMonth}
            />
            <FieldEditor
              label={isEn ? 'Month' : 'Месяц'}
              state={builder.month}
              isEn={isEn}
              onChange={(next) => updateField('month', next)}
              range={FIELD_RANGES.month}
              chipLabels={isEn ? monthNamesShortEn : monthNamesShortRu}
            />
            <FieldEditor
              label={isEn ? 'Weekday' : 'День недели'}
              state={builder.dayOfWeek}
              isEn={isEn}
              onChange={(next) => updateField('dayOfWeek', next)}
              range={FIELD_RANGES.dayOfWeek}
              chipLabels={isEn ? dowShortEn : dowShortRu}
            />
          </div>
        </div>
      </AdvancedSettings>

      <output aria-live="polite" className="sr-only">
        {cronExpression + ' — ' + description}
      </output>
    </div>
  );
}
