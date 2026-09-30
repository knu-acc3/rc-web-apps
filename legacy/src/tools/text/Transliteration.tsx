'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ArrowsLeftRight,
  CheckCircle,
  ClipboardText,
} from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { cn } from '@/src/lib/cn';
import { writeClipboardText } from '@/src/utils/clipboard';

type Direction = 'cyr-to-lat' | 'lat-to-cyr';
type Language = 'auto' | 'ru' | 'kk';
type StandardId = 'phonetic' | 'icao' | 'gost-a' | 'gost-b';

function withCases(pairs: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  Object.entries(pairs).forEach(([source, target]) => {
    result[source] = target;
    result[source.toUpperCase()] = target
      ? target[0].toUpperCase() + target.slice(1)
      : '';
  });
  return result;
}

const PHONETIC_RU = withCases({
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
});
const PHONETIC_KK = withCases({
  ...Object.fromEntries(Object.entries(PHONETIC_RU).filter(([key]) => key === key.toLowerCase())),
  ә:'a',ғ:'gh',қ:'q',ң:'ng',ө:'o',ұ:'u',ү:'u',һ:'h',і:'i',
});
const ICAO_RU = withCases({
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'ie',ы:'y',ь:'',э:'e',ю:'iu',я:'ia',
});
const ICAO_KK = withCases({
  ...Object.fromEntries(Object.entries(ICAO_RU).filter(([key]) => key === key.toLowerCase())),
  ә:'a',ғ:'g',қ:'q',ң:'n',ө:'o',ұ:'u',ү:'u',һ:'h',і:'i',
});
const GOST_A_RU = withCases({
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'ë',ж:'ž',з:'z',и:'i',й:'j',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'č',ш:'š',щ:'ŝ',ъ:'ʺ',ы:'y',ь:'ʹ',э:'è',ю:'û',я:'â',
});
const GOST_A_KK = withCases({
  ...Object.fromEntries(Object.entries(GOST_A_RU).filter(([key]) => key === key.toLowerCase())),
  ә:'ä',ғ:'ġ',қ:'q',ң:'ṅ',ө:'ö',ұ:'ŭ',ү:'ü',һ:'ḥ',і:'ì',
});
const GOST_B_RU = withCases({
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'cz',ч:'ch',ш:'sh',щ:'shh',ъ:'``',ы:'y`',ь:'`',э:'e`',ю:'yu',я:'ya',
});
const GOST_B_KK = withCases({
  ...Object.fromEntries(Object.entries(GOST_B_RU).filter(([key]) => key === key.toLowerCase())),
  ә:'ae',ғ:'gh',қ:'q',ң:'ng',ө:'oe',ұ:'u`',ү:'ue',һ:'h',і:'i`',
});

interface Standard {
  id: StandardId;
  name: string;
  descriptionEn: string;
  descriptionRu: string;
  ru: Record<string, string>;
  kk: Record<string, string>;
}

const STANDARDS: Standard[] = [
  {
    id: 'phonetic',
    name: 'Phonetic',
    descriptionEn: 'Readable everyday transliteration close to BGN/PCGN.',
    descriptionRu: 'Читаемая повседневная транслитерация, близкая к BGN/PCGN.',
    ru: PHONETIC_RU,
    kk: PHONETIC_KK,
  },
  {
    id: 'icao',
    name: 'ICAO Doc 9303',
    descriptionEn: 'Machine-readable travel-document transliteration.',
    descriptionRu: 'Транслитерация для машиносчитываемых проездных документов.',
    ru: ICAO_RU,
    kk: ICAO_KK,
  },
  {
    id: 'gost-a',
    name: 'GOST 7.79-A',
    descriptionEn: 'Scientific form with diacritics.',
    descriptionRu: 'Научная форма с диакритическими знаками.',
    ru: GOST_A_RU,
    kk: GOST_A_KK,
  },
  {
    id: 'gost-b',
    name: 'GOST 7.79-B',
    descriptionEn: 'ASCII-oriented form with digraphs.',
    descriptionRu: 'ASCII-совместимая форма с диграфами.',
    ru: GOST_B_RU,
    kk: GOST_B_KK,
  },
];

const KAZAKH_CHARACTERS = /[ӘәҒғҚқҢңӨөҰұҮүҺһІі]/;

function detectLanguage(value: string): 'ru' | 'kk' {
  return KAZAKH_CHARACTERS.test(value) ? 'kk' : 'ru';
}

function cyrillicToLatin(value: string, map: Record<string, string>): string {
  let result = '';
  for (const character of value) result += Object.hasOwn(map, character) ? map[character] : character;
  return result;
}

function latinToCyrillic(value: string, map: Record<string, string>): string {
  const entries = Object.entries(map)
    .filter(([source, target]) => source === source.toLowerCase() && Boolean(target))
    .sort((left, right) => right[1].length - left[1].length);
  let result = '';
  let index = 0;
  while (index < value.length) {
    let matched = false;
    for (const [cyrillic, latin] of entries) {
      const candidate = value.slice(index, index + latin.length);
      if (candidate.toLocaleLowerCase() !== latin.toLocaleLowerCase()) continue;
      const uppercase = candidate[0] && candidate[0] === candidate[0].toUpperCase() && candidate[0] !== candidate[0].toLowerCase();
      result += uppercase ? cyrillic.toUpperCase() : cyrillic;
      index += latin.length;
      matched = true;
      break;
    }
    if (!matched) {
      result += value[index];
      index += 1;
    }
  }
  return result;
}

function capitalizeNames(value: string): string {
  return value.toLocaleLowerCase().replace(/(^|[\s\-'’(])(\p{L})/gu, (_, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase()}`);
}

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function Transliteration() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('cyr-to-lat');
  const [language, setLanguage] = useState<Language>('auto');
  const [standardId, setStandardId] = useState<StandardId>('phonetic');
  const [capitalize, setCapitalize] = useState(false);
  const [slug, setSlug] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const standard = STANDARDS.find((item) => item.id === standardId) ?? STANDARDS[0];
  const effectiveLanguage = language === 'auto' ? detectLanguage(input) : language;
  const map = effectiveLanguage === 'kk' ? standard.kk : standard.ru;
  const output = useMemo(() => {
    let result = direction === 'cyr-to-lat'
      ? cyrillicToLatin(input, map)
      : latinToCyrillic(input, map);
    if (capitalize) result = capitalizeNames(result);
    if (slug && direction === 'cyr-to-lat') result = toSlug(result);
    return result;
  }, [capitalize, direction, input, map, slug]);

  const copyOutput = useCallback(async () => {
    const copied = await writeClipboardText(output);
    setCopyStatus(copied
      ? isEn ? 'Copied' : 'Скопировано'
      : isEn ? 'Could not copy' : 'Не удалось скопировать');
  }, [isEn, output]);

  const swap = useCallback(() => {
    setInput(output);
    setDirection((current) => current === 'cyr-to-lat' ? 'lat-to-cyr' : 'cyr-to-lat');
    setSlug(false);
    setCopyStatus('');
  }, [output]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div role="radiogroup" aria-label={isEn ? 'Transliteration direction' : 'Направление транслитерации'} className="grid grid-cols-[1fr_44px_1fr] gap-2">
          <button type="button" role="radio" aria-checked={direction === 'cyr-to-lat'} className={cn('min-h-12 rounded-[var(--radius-md)] border px-2 text-sm font-semibold', direction === 'cyr-to-lat' ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--color-border)]')} onClick={() => {
            setDirection('cyr-to-lat');
            setCopyStatus('');
          }}>
            {isEn ? 'Cyrillic → Latin' : 'Кириллица → латиница'}
          </button>
          <button type="button" className="min-h-11 min-w-11 rounded-[var(--radius-md)] border border-[var(--color-border)]" onClick={swap} disabled={!output} aria-label={isEn ? 'Swap input and result' : 'Поменять ввод и результат'}>
            <ArrowsLeftRight size={19} className="mx-auto" />
          </button>
          <button type="button" role="radio" aria-checked={direction === 'lat-to-cyr'} className={cn('min-h-12 rounded-[var(--radius-md)] border px-2 text-sm font-semibold', direction === 'lat-to-cyr' ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--color-border)]')} onClick={() => {
            setDirection('lat-to-cyr');
            setSlug(false);
            setCopyStatus('');
          }}>
            {isEn ? 'Latin → Cyrillic' : 'Латиница → кириллица'}
          </button>
        </div>

        <div className="mt-4">
          <Label htmlFor="transliteration-input">{isEn ? 'Source text' : 'Исходный текст'}</Label>
          <Textarea
            id="transliteration-input"
            className="mt-1.5 min-h-40 font-mono text-base"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setCopyStatus('');
            }}
            placeholder={direction === 'cyr-to-lat'
              ? isEn ? 'Enter Cyrillic text' : 'Введите текст кириллицей'
              : isEn ? 'Enter Latin text' : 'Введите текст латиницей'}
            autoFocus
          />
        </div>
      </Card>

      <Card className="border-[var(--color-primary)]/25 p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <Label htmlFor="transliteration-output">{isEn ? 'Result' : 'Результат'}</Label>
          <span className="text-xs text-[var(--color-text-muted)]">{standard.name} · {effectiveLanguage === 'kk' ? (isEn ? 'Kazakh' : 'Казахский') : (isEn ? 'Russian' : 'Русский')}</span>
        </div>
        <Textarea id="transliteration-output" className="min-h-40 bg-[var(--color-surface-muted)] font-mono text-base" value={output} readOnly aria-live="polite" />
        {direction === 'lat-to-cyr' && output ? (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            {isEn ? 'Reverse transliteration is ambiguous: verify names and official documents.' : 'Обратная транслитерация неоднозначна: проверяйте имена и официальные документы.'}
          </p>
        ) : null}
        <div className="mt-3 flex justify-start">
          <Button size="lg" className="h-11 w-full sm:w-auto min-w-[200px] px-6 shadow-sm" onClick={copyOutput} disabled={!output}>
            {copyStatus === (isEn ? 'Copied' : 'Скопировано')
              ? <CheckCircle size={20} weight="fill" />
              : <ClipboardText size={20} />}
            {copyStatus || (isEn ? 'Copy result' : 'Копировать результат')}
          </Button>
        </div>
      </Card>

      <AdvancedSettings
        title={isEn ? 'Language, standard and formatting' : 'Язык, стандарт и оформление'}
        description={isEn ? 'Automatic language choice, ICAO/GOST, names and slugs' : 'Автовыбор языка, ICAO/ГОСТ, имена и slug'}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="transliteration-language">{isEn ? 'Language' : 'Язык'}</Label>
              <select id="transliteration-language" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
                <option value="auto">{isEn ? 'Detect automatically' : 'Определять автоматически'}</option>
                <option value="ru">{isEn ? 'Russian' : 'Русский'}</option>
                <option value="kk">{isEn ? 'Kazakh' : 'Казахский'}</option>
              </select>
            </div>
            <div>
              <Label htmlFor="transliteration-standard">{isEn ? 'Standard' : 'Стандарт'}</Label>
              <select id="transliteration-standard" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={standardId} onChange={(event) => setStandardId(event.target.value as StandardId)}>
                {STANDARDS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-muted)]">
            {isEn ? standard.descriptionEn : standard.descriptionRu}
          </div>

          <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
            <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={capitalize} onChange={(event) => setCapitalize(event.target.checked)} />
            {isEn ? 'Capitalize names' : 'Имена с заглавной буквы'}
          </label>
          <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
            <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={slug} disabled={direction !== 'cyr-to-lat'} onChange={(event) => setSlug(event.target.checked)} />
            {isEn ? 'Create URL slug' : 'Создать URL-slug'}
          </label>
        </div>
      </AdvancedSettings>
    </div>
  );
}
