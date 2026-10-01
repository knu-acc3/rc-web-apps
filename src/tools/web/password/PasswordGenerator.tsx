"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { Field, Input, Switch } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { SliderField } from "@/ui/slider-field";
import {
  ATTACKS,
  averageCrackSeconds,
  cryptoSource,
  DIGITS,
  generateMemorable,
  generatePassphrase,
  generatePassword,
  generatePin,
  LOWER,
  memorableEntropy,
  passphraseEntropy,
  passwordEntropy,
  randomBytes,
  randomString,
  stringEntropy,
  strengthOf,
  SYMBOLS,
  toBase64,
  toHex,
  UPPER,
  type Strength,
} from "./lib/engine";
import { humanDuration } from "./lib/time";

export type Mode = "password" | "pin" | "passphrase" | "wifi" | "memorable" | "hex" | "base64" | "apikey" | "string";

export interface GeneratorProps {
  locale: Locale;
  mode?: Mode;
  length?: number;
  words?: number;
  lang?: "en" | "ru";
  bits?: number;
  bytes?: number;
}

const T = {
  ru: {
    result: "Сгенерированный пароль",
    regenerate: "Новый",
    regenerateTitle: "Сгенерировать новый",
    copy: "Скопировать",
    copied: "Скопировано",
    download: "Скачать",
    bits: (n: string) => `≈ ${n} бит`,
    strength: { "very-weak": "Очень слабый", weak: "Слабый", fair: "Средний", strong: "Надёжный", "very-strong": "Очень надёжный" } as Record<Strength, string>,
    length: "Длина",
    range: (a: number, b: number) => `От ${a} до ${b}`,
    chars: ["символ", "символа", "символов"],
    lower: "a–z",
    upper: "A–Z",
    digits: "0–9",
    symbols: "!#$…",
    classes: "Символы",
    classTitles: ["Строчные буквы", "Заглавные буквы", "Цифры", "Спецсимволы"],
    advanced: "Дополнительно",
    ambiguous: "Без похожих символов (I, l, 1, O, 0)",
    requireEach: "Хотя бы один символ из каждого набора",
    symbolSet: "Свои спецсимволы",
    count: "Сколько сгенерировать",
    more: "Все варианты",
    words: "Слов",
    lang: "Язык слов",
    en: "English",
    ru: "Русский",
    translit: "Латиницей (kot-luna-reka)",
    separator: "Разделитель",
    seps: { "-": "-", " ": "пробел", ".": ".", _: "_", "": "нет" } as Record<string, string>,
    sepTitles: { "-": "дефис", " ": "пробел", ".": "точка", _: "подчёркивание", "": "без разделителя" } as Record<string, string>,
    capitalize: "С заглавной буквы",
    addDigit: "Добавить цифру",
    wifiSymbols: "Спецсимволы (не везде удобно вводить)",
    syllables: "Слогов в слове",
    digitsCount: "Цифр в конце",
    keyBits: "Длина ключа",
    upperHex: "Заглавные буквы",
    keyBytes: "Размер",
    urlSafe: "Base64url (без +, / и =)",
    prefix: "Префикс",
    alphabet: "Алфавит",
    pinLength: "Цифр в PIN",
    crack: "Сколько займёт перебор",
    attacks: {
      "online-throttled": "Онлайн, 100 попыток в час",
      online: "Онлайн, 10 попыток в секунду",
      "offline-slow": "Утечка базы, bcrypt/Argon2 (10 тыс./с)",
      "offline-fast": "Утечка базы, MD5/SHA-1 на GPU (10 млрд/с)",
    } as Record<string, string>,
    loading: "Загрузка словаря…",
    local: "Создаётся в браузере через crypto.getRandomValues — никуда не отправляется.",
  },
  en: {
    result: "Generated password",
    regenerate: "New",
    regenerateTitle: "Generate a new one",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    bits: (n: string) => `≈ ${n} bits`,
    strength: { "very-weak": "Very weak", weak: "Weak", fair: "Fair", strong: "Strong", "very-strong": "Very strong" } as Record<Strength, string>,
    length: "Length",
    range: (a: number, b: number) => `From ${a} to ${b}`,
    chars: ["character", "characters"],
    lower: "a–z",
    upper: "A–Z",
    digits: "0–9",
    symbols: "!#$…",
    classes: "Characters",
    classTitles: ["Lower case", "Upper case", "Digits", "Symbols"],
    advanced: "More options",
    ambiguous: "Avoid look-alikes (I, l, 1, O, 0)",
    requireEach: "At least one character from every set",
    symbolSet: "Custom symbols",
    count: "How many",
    more: "All results",
    words: "Words",
    lang: "Word language",
    en: "English",
    ru: "Russian",
    translit: "In Latin letters (kot-luna-reka)",
    separator: "Separator",
    seps: { "-": "-", " ": "space", ".": ".", _: "_", "": "none" } as Record<string, string>,
    sepTitles: { "-": "hyphen", " ": "space", ".": "dot", _: "underscore", "": "no separator" } as Record<string, string>,
    capitalize: "Capitalise",
    addDigit: "Add a digit",
    wifiSymbols: "Symbols (harder to type on TVs)",
    syllables: "Syllables per word",
    digitsCount: "Digits at the end",
    keyBits: "Key length",
    upperHex: "Upper case",
    keyBytes: "Size",
    urlSafe: "Base64url (no +, / or =)",
    prefix: "Prefix",
    alphabet: "Alphabet",
    pinLength: "PIN digits",
    crack: "Time to brute-force",
    attacks: {
      "online-throttled": "Online, 100 tries per hour",
      online: "Online, 10 tries per second",
      "offline-slow": "Leaked database, bcrypt/Argon2 (10k/s)",
      "offline-fast": "Leaked database, MD5/SHA-1 on GPUs (10 billion/s)",
    } as Record<string, string>,
    loading: "Loading word list…",
    local: "Made in your browser with crypto.getRandomValues — never sent anywhere.",
  },
} as const;

const LEVEL: Record<Strength, number> = { "very-weak": 1, weak: 2, fair: 3, strong: 4, "very-strong": 5 };
const TONE: Record<Strength, { bar: string; text: string }> = {
  "very-weak": { bar: "bg-err", text: "text-err" },
  weak: { bar: "bg-err", text: "text-err" },
  fair: { bar: "bg-warn", text: "text-warn" },
  strong: { bar: "bg-ok", text: "text-ok" },
  "very-strong": { bar: "bg-ok", text: "text-ok" },
};

const LEN_RANGE: Partial<Record<Mode, [number, number]>> = { password: [4, 128], wifi: [8, 63], apikey: [16, 64], string: [1, 256] };

export default function PasswordGenerator({ locale, mode = "password", length: len0, words: w0 = 5, lang: lang0, bits: bits0 = 256, bytes: bytes0 = 32 }: GeneratorProps) {
  const t = T[locale];
  const id = useId();
  const range = LEN_RANGE[mode];
  const defaultLen = len0 ?? (mode === "pin" ? 4 : mode === "wifi" ? 63 : mode === "apikey" ? 32 : mode === "string" ? 24 : 16);
  // The length is kept as typed text (the value on the slider line); the generators get the clamped number.
  const [lenText, setLenText] = useState(String(defaultLen));
  const typedLen = /^\d{1,4}$/.test(lenText.trim()) ? Number(lenText.trim()) : null;
  const length = range ? Math.min(range[1], Math.max(range[0], typedLen ?? defaultLen)) : (typedLen ?? defaultLen);
  const lenError = range && (typedLen === null || typedLen < range[0] || typedLen > range[1]) ? t.range(range[0], range[1]) : undefined;
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(mode === "password");
  const [symbolSet, setSymbolSet] = useState(SYMBOLS);
  const [ambiguous, setAmbiguous] = useState(false);
  const [requireEach, setRequireEach] = useState(true);
  const [count, setCount] = useState(1);
  const [words, setWords] = useState(w0);
  const [wordsText, setWordsText] = useState(String(w0));
  const [lang, setLang] = useState<"en" | "ru">(lang0 ?? (locale === "ru" ? "ru" : "en"));
  const [translitOn, setTranslitOn] = useState(true);
  const [sep, setSep] = useState("-");
  const [capitalize, setCapitalize] = useState(mode === "memorable");
  const [addDigit, setAddDigit] = useState(false);
  const [syllables, setSyllables] = useState(3);
  const [tailDigits, setTailDigits] = useState(2);
  const [bits, setBits] = useState(bits0);
  const [upperHex, setUpperHex] = useState(false);
  const [bytes, setBytes] = useState(bytes0);
  const [urlSafe, setUrlSafe] = useState(false);
  const [prefix, setPrefix] = useState("key_");
  const [alphabet, setAlphabet] = useState(LOWER + UPPER + DIGITS);
  const [nonce, setNonce] = useState(0);
  const [lists, setLists] = useState<{ en?: readonly string[]; ru?: readonly string[]; tr?: (w: string) => string }>({});
  const [out, setOut] = useState<string[] | null>(null);

  // word lists are loaded only for passphrases
  useEffect(() => {
    if (mode !== "passphrase" || lists[lang]) return;
    let alive = true;
    if (lang === "en") import("./data/words-en").then((m) => alive && setLists((s) => ({ ...s, en: m.WORDS_EN })));
    else import("./data/words-ru").then((m) => alive && setLists((s) => ({ ...s, ru: m.WORDS_RU, tr: m.translit })));
    return () => {
      alive = false;
    };
  }, [mode, lang, lists]);

  const pwOpts = useMemo(() => ({ length, lower, upper, digits, symbols, symbolSet, excludeAmbiguous: ambiguous, requireEach }), [length, lower, upper, digits, symbols, symbolSet, ambiguous, requireEach]);
  const wifiAlphabet = LOWER + UPPER + DIGITS + (symbols ? SYMBOLS : "");
  const rawList = lists[lang];
  // Transliteration is one-to-one on the list (unit-tested), so entropy stays the same.
  const list = useMemo(() => (rawList && lang === "ru" && translitOn && lists.tr ? rawList.map(lists.tr) : rawList), [rawList, lang, translitOn, lists.tr]);

  const entropy = useMemo(() => {
    switch (mode) {
      case "password":
        return passwordEntropy(pwOpts);
      case "pin":
        return length * Math.log2(10);
      case "passphrase":
        return passphraseEntropy(list?.length ?? (lang === "en" ? 1303 : 1359), { words, separator: sep, capitalize, addDigit });
      case "wifi":
        return stringEntropy(wifiAlphabet, length);
      case "memorable":
        return memorableEntropy({ words, syllables, digits: tailDigits, separator: sep, capitalize });
      case "hex":
        return bits;
      case "base64":
        return bytes * 8;
      case "apikey":
        return stringEntropy(LOWER + UPPER + DIGITS, length);
      case "string":
        return stringEntropy(alphabet, length);
    }
  }, [mode, pwOpts, length, list, lang, words, sep, capitalize, addDigit, wifiAlphabet, syllables, tailDigits, bits, bytes, alphabet]);

  // Generate in the browser only (SSR renders a placeholder): the random source is read in a frame callback.
  useEffect(() => {
    if (mode === "passphrase" && !list) return;
    const frame = requestAnimationFrame(() => {
      const rng = cryptoSource;
      const one = (): string => {
        switch (mode) {
          case "password":
            return generatePassword(pwOpts, rng);
          case "pin":
            return generatePin(length, rng);
          case "passphrase":
            return generatePassphrase(list!, { words, separator: sep, capitalize, addDigit }, rng);
          case "wifi":
            return randomString(wifiAlphabet, length, rng);
          case "memorable":
            return generateMemorable({ words, syllables, digits: tailDigits, separator: sep, capitalize }, rng);
          case "hex": {
            const h = toHex(randomBytes(bits / 8, rng));
            return upperHex ? h.toUpperCase() : h;
          }
          case "base64":
            return toBase64(randomBytes(bytes, rng), urlSafe);
          case "apikey":
            return prefix + randomString(LOWER + UPPER + DIGITS, length, rng);
          case "string":
            return randomString(alphabet, length, rng);
        }
      };
      setOut(Array.from({ length: count }, one));
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, pwOpts, length, list, words, sep, capitalize, addDigit, wifiAlphabet, syllables, tailDigits, bits, upperHex, bytes, urlSafe, prefix, alphabet, count, nonce]);

  const strength = strengthOf(entropy);
  const main = out?.[0] ?? "";

  // Character sets as toggle chips; the last one switched on stays on (an empty set gives no password).
  const sets = [
    { label: t.lower, on: lower, set: setLower },
    { label: t.upper, on: upper, set: setUpper },
    { label: t.digits, on: digits, set: setDigits },
    { label: t.symbols, on: symbols, set: setSymbols },
  ];
  const onCount = sets.filter((s) => s.on).length;
  const countPicker = <Group label={t.count}>{segNumbers(t.count, count, [1, 5, 10, 20, 50], setCount)}</Group>;

  const settings: ReactNode[] = [];
  if (range)
    settings.push(
      <SliderField
        key="len"
        id={`${id}-len`}
        label={t.length}
        value={lenText}
        onChange={setLenText}
        parse={(s) => (/^\d{1,4}$/.test(s.trim()) ? Number(s.trim()) : null)}
        format={(n) => String(Math.round(n))}
        min={range[0]}
        max={range[1]}
        suffix={plural(locale, length, t.chars)}
        error={lenError}
        inputMode="numeric"
      />,
    );

  if (mode === "password")
    settings.push(
      <Group key="sets" label={t.classes}>
        <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
          {sets.map((s, i) => (
            <button
              key={s.label}
              type="button"
              aria-pressed={s.on}
              title={t.classTitles[i]}
              disabled={s.on && onCount === 1}
              onClick={() => s.set(!s.on)}
              className="chip justify-center gap-1! px-1.5! font-mono text-base! disabled:opacity-100! sm:min-w-[4.5rem] sm:px-3.5!"
            >
              {s.on && <Check className="size-4 max-sm:hidden" aria-hidden />}
              {s.label}
            </button>
          ))}
        </div>
      </Group>,
      <Fold key="adv" variant="inline" title={t.advanced}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <Switch label={t.ambiguous} checked={ambiguous} onChange={(e) => setAmbiguous(e.target.checked)} />
            <Switch label={t.requireEach} checked={requireEach} onChange={(e) => setRequireEach(e.target.checked)} />
          </div>
          <Field label={t.symbolSet} htmlFor={`${id}-sym`}>
            <Input id={`${id}-sym`} value={symbolSet} onChange={(e) => setSymbolSet(e.target.value)} className="font-mono" disabled={!symbols} spellCheck={false} />
          </Field>
          {countPicker}
        </div>
      </Fold>,
    );

  if (mode === "pin")
    settings.push(
      <Group key="pin" label={t.pinLength}>
        <div className="flex flex-wrap gap-2">
          {[4, 5, 6, 8, 10, 12].map((n) => (
            <button key={n} type="button" aria-pressed={length === n} onClick={() => setLenText(String(n))} className="chip min-w-12 justify-center text-base!">
              {n}
            </button>
          ))}
        </div>
      </Group>,
      <div key="n">{countPicker}</div>,
    );

  if (mode === "passphrase")
    settings.push(
      <SliderField
        key="words"
        id={`${id}-w`}
        label={t.words}
        value={wordsText}
        onChange={(s) => {
          setWordsText(s);
          const n = /^\d{1,2}$/.test(s.trim()) ? Number(s.trim()) : NaN;
          if (n >= 3 && n <= 10) setWords(n);
        }}
        parse={(s) => (/^\d{1,2}$/.test(s.trim()) ? Number(s.trim()) : null)}
        format={(n) => String(Math.round(n))}
        min={3}
        max={10}
        error={/^\d{1,2}$/.test(wordsText.trim()) && Number(wordsText) >= 3 && Number(wordsText) <= 10 ? undefined : t.range(3, 10)}
        inputMode="numeric"
      />,
      <div key="pp" className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <Group label={t.lang}>
          <Segmented
            label={t.lang}
            value={lang}
            onChange={setLang}
            options={[
              { value: "ru", label: t.ru },
              { value: "en", label: t.en },
            ]}
          />
        </Group>
        <SepPicker label={t.separator} value={sep} onChange={setSep} labels={t.seps} titles={t.sepTitles} />
      </div>,
      <div key="sw" className="flex flex-col">
        {lang === "ru" && <Switch label={t.translit} checked={translitOn} onChange={(e) => setTranslitOn(e.target.checked)} />}
        <Switch label={t.capitalize} checked={capitalize} onChange={(e) => setCapitalize(e.target.checked)} />
        <Switch label={t.addDigit} checked={addDigit} onChange={(e) => setAddDigit(e.target.checked)} />
      </div>,
    );

  if (mode === "wifi") settings.push(<Switch key="wsym" label={t.wifiSymbols} checked={symbols} onChange={(e) => setSymbols(e.target.checked)} />);

  if (mode === "memorable")
    settings.push(
      <div key="mem" className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <Group label={t.words}>{segNumbers(t.words, words, [2, 3, 4, 5], setWords)}</Group>
        <Group label={t.syllables}>{segNumbers(t.syllables, syllables, [2, 3, 4], setSyllables)}</Group>
        <Group label={t.digitsCount}>{segNumbers(t.digitsCount, tailDigits, [0, 1, 2, 3, 4], setTailDigits)}</Group>
        <SepPicker label={t.separator} value={sep} onChange={setSep} labels={t.seps} titles={t.sepTitles} />
      </div>,
      <Switch key="cap" label={t.capitalize} checked={capitalize} onChange={(e) => setCapitalize(e.target.checked)} />,
    );

  if (mode === "hex")
    settings.push(
      <Group key="bits" label={t.keyBits}>
        <Segmented label={t.keyBits} value={String(bits)} onChange={(v) => setBits(Number(v))} options={[128, 192, 256, 512].map((b) => ({ value: String(b), label: `${b} bit` }))} />
      </Group>,
      <Switch key="up" label={t.upperHex} checked={upperHex} onChange={(e) => setUpperHex(e.target.checked)} />,
    );

  if (mode === "base64")
    settings.push(
      <Group key="bytes" label={t.keyBytes}>
        <Segmented label={t.keyBytes} value={String(bytes)} onChange={(v) => setBytes(Number(v))} options={[16, 24, 32, 64].map((b) => ({ value: String(b), label: `${b * 8} bit` }))} />
      </Group>,
      <Switch key="url" label={t.urlSafe} checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} />,
    );

  if (mode === "apikey")
    settings.push(
      <Field key="pre" label={t.prefix} htmlFor={`${id}-pre`}>
        <Input id={`${id}-pre`} value={prefix} onChange={(e) => setPrefix(e.target.value.replace(/\s/g, ""))} className="font-mono" spellCheck={false} />
      </Field>,
      <div key="n">{countPicker}</div>,
    );

  if (mode === "string")
    settings.push(
      <Field key="ab" label={t.alphabet} htmlFor={`${id}-ab`}>
        <Input id={`${id}-ab`} value={alphabet} onChange={(e) => setAlphabet(e.target.value)} className="font-mono" spellCheck={false} />
      </Field>,
      <div key="n">{countPicker}</div>,
    );

  // Phones: result, settings, details. From lg: result and details on the left, settings on the right.
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6">
      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
        <div className="order-1 flex min-w-0 flex-col gap-5 rounded-[1.25rem] bg-accent-soft p-5 sm:p-6 lg:order-none">
          <output
            aria-label={t.result}
            aria-live="polite"
            className={cn(
              "block min-h-12 font-mono font-semibold leading-tight tracking-tight text-fg [overflow-wrap:anywhere]",
              main.length > 64 ? "text-lg sm:text-xl" : main.length > 32 ? "text-xl sm:text-2xl" : main.length > 20 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
            )}
          >
            {main || (mode === "passphrase" && !list ? <span className="font-sans text-base font-normal text-fg-3">{t.loading}</span> : " ")}
          </output>

          <StrengthMeter strength={strength} label={t.strength[strength]} bits={t.bits(formatNumber(locale, Math.round(entropy)))} />

          <div className="flex flex-wrap gap-2">
            <BigCopy value={main} label={t.copy} copied={t.copied} />
            <Button variant="elevated" size="lg" onClick={() => setNonce((n) => n + 1)} title={t.regenerateTitle} className="group">
              <RefreshCw aria-hidden className="transition-transform duration-300 motion-safe:group-active:rotate-180" />
              {t.regenerate}
            </Button>
          </div>
        </div>

        <div className="order-3 flex min-w-0 flex-col gap-4 lg:order-none">
          {out && out.length > 1 && <CodeOutput title={t.more} value={out.join("\n")} labels={{ copy: t.copy, copied: t.copied, download: t.download }} filename="passwords.txt" minRows={Math.min(10, out.length)} />}

          <Panel className="p-4 sm:p-5">
            <h2 className="mb-2 text-sm font-semibold text-fg">{t.crack}</h2>
            <dl className="divide-y divide-line">
              {ATTACKS.map((a) => (
                <div key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 text-sm">
                  <dt className="min-w-0 text-fg-2">{t.attacks[a.id]}</dt>
                  <dd className="font-semibold text-fg">{humanDuration(averageCrackSeconds(entropy, a.perSecond), locale)}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <p className="text-sm text-fg-3">{t.local}</p>
        </div>
      </div>

      {settings.length > 0 && <Panel className="order-2 flex min-w-0 flex-col gap-6 p-4 sm:p-6 lg:order-none">{settings}</Panel>}
    </div>
  );
}

/** Five-step meter: the filled steps and the word share the strength colour. */
function StrengthMeter({ strength, label, bits }: { strength: Strength; label: string; bits: string }) {
  const level = LEVEL[strength];
  const tone = TONE[strength];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={cn("h-2 flex-1 rounded-full transition-colors duration-300", i <= level ? tone.bar : "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]")} />
        ))}
      </div>
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className={cn("text-base font-semibold", tone.text)}>{label}</span>
        <span className="text-fg-2">{bits}</span>
      </p>
    </div>
  );
}

/** The main action: a large filled copy button that confirms with a check. */
function BigCopy({ value, label, copied }: { value: string; label: string; copied: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <Button
      variant="filled"
      size="lg"
      disabled={!value}
      onClick={async () => {
        if (!value || !(await copyText(value))) return;
        setDone(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check aria-hidden /> : <Copy aria-hidden />}
      {done ? copied : label}
      <span role="status" className="sr-only">
        {done ? copied : ""}
      </span>
    </Button>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      <span id={id} className="text-sm font-medium text-fg-2">
        {label}
      </span>
      {children}
    </div>
  );
}

function segNumbers(label: string, value: number, options: number[], onChange: (n: number) => void) {
  return <Segmented label={label} value={String(value)} onChange={(v) => onChange(Number(v))} options={options.map((n) => ({ value: String(n), label: String(n) }))} />;
}

function SepPicker({ label, value, onChange, labels, titles }: { label: string; value: string; onChange: (s: string) => void; labels: Record<string, string>; titles: Record<string, string> }) {
  return (
    <Group label={label}>
      <Segmented label={label} value={value || "none"} onChange={(v) => onChange(v === "none" ? "" : v)} options={Object.keys(labels).map((v) => ({ value: v || "none", label: labels[v], title: titles[v] }))} />
    </Group>
  );
}
