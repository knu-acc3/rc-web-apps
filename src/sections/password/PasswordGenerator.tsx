"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { CopyButton } from "@/ui/copy-button";
import { Checkbox, Field, Input, Select, Slider } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
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
} from "./engine";
import { humanDuration } from "./time";

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
    regenerate: "Сгенерировать заново",
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать",
    bits: (n: string) => `≈ ${n} бит энтропии`,
    strength: { "very-weak": "очень слабый", weak: "слабый", fair: "средний", strong: "надёжный", "very-strong": "очень надёжный" } as Record<Strength, string>,
    length: "Длина",
    chars: ["символ", "символа", "символов"],
    lower: "a–z",
    upper: "A–Z",
    digits: "0–9",
    symbols: "!#$…",
    classes: "Наборы символов",
    advanced: "Дополнительно",
    ambiguous: "Без похожих символов (I, l, 1, O, 0, o, |)",
    requireEach: "Хотя бы один символ из каждого набора",
    symbolSet: "Свои спецсимволы",
    count: "Сколько сгенерировать",
    more: "Все варианты",
    words: "Слов",
    wordForms: ["слово", "слова", "слов"],
    lang: "Язык слов",
    en: "English",
    ru: "Русский",
    translit: "Латиницей (kot-luna-reka)",
    separator: "Разделитель",
    seps: { "-": "дефис -", " ": "пробел", ".": "точка .", _: "подчёркивание _", "": "без разделителя" } as Record<string, string>,
    capitalize: "С заглавной буквы",
    addDigit: "Добавить цифру",
    wifiSymbols: "Разрешить спецсимволы (не везде удобно вводить)",
    syllables: "Слогов в слове",
    digitsCount: "Цифр в конце",
    keyBits: "Длина ключа",
    upperHex: "Заглавные буквы",
    keyBytes: "Размер",
    urlSafe: "Base64url (без +, / и =)",
    prefix: "Префикс",
    alphabet: "Алфавит",
    pinLength: "Цифр в PIN",
    crack: "Сколько в среднем займёт перебор",
    attacks: {
      "online-throttled": "Онлайн, с ограничением попыток (100 в час)",
      online: "Онлайн без ограничений (10 в секунду)",
      "offline-slow": "Утечка базы, медленный хеш bcrypt/Argon2 (10 тыс./с)",
      "offline-fast": "Утечка базы, быстрый хеш MD5/SHA-1 на GPU (10 млрд/с)",
    } as Record<string, string>,
    loading: "Загрузка словаря…",
    local: "Генерируется в браузере через crypto.getRandomValues — пароль никуда не отправляется.",
  },
  en: {
    result: "Generated password",
    regenerate: "Generate again",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    bits: (n: string) => `≈ ${n} bits of entropy`,
    strength: { "very-weak": "very weak", weak: "weak", fair: "fair", strong: "strong", "very-strong": "very strong" } as Record<Strength, string>,
    length: "Length",
    chars: ["character", "characters"],
    lower: "a–z",
    upper: "A–Z",
    digits: "0–9",
    symbols: "!#$…",
    classes: "Character sets",
    advanced: "More options",
    ambiguous: "Avoid look-alikes (I, l, 1, O, 0, o, |)",
    requireEach: "At least one character from every set",
    symbolSet: "Custom symbols",
    count: "How many",
    more: "All results",
    words: "Words",
    wordForms: ["word", "words"],
    lang: "Word language",
    en: "English",
    ru: "Russian",
    translit: "In Latin letters (kot-luna-reka)",
    separator: "Separator",
    seps: { "-": "hyphen -", " ": "space", ".": "dot .", _: "underscore _", "": "none" } as Record<string, string>,
    capitalize: "Capitalise",
    addDigit: "Add a digit",
    wifiSymbols: "Allow symbols (harder to type on TVs)",
    syllables: "Syllables per word",
    digitsCount: "Digits at the end",
    keyBits: "Key length",
    upperHex: "Upper case",
    keyBytes: "Size",
    urlSafe: "Base64url (no +, / or =)",
    prefix: "Prefix",
    alphabet: "Alphabet",
    pinLength: "PIN digits",
    crack: "Average time to brute-force",
    attacks: {
      "online-throttled": "Online, rate-limited (100 per hour)",
      online: "Online, no limit (10 per second)",
      "offline-slow": "Leaked database, slow hash bcrypt/Argon2 (10k/s)",
      "offline-fast": "Leaked database, fast hash MD5/SHA-1 on GPUs (10 billion/s)",
    } as Record<string, string>,
    loading: "Loading word list…",
    local: "Generated in your browser with crypto.getRandomValues — the password is never sent anywhere.",
  },
} as const;

const BAR: Record<Strength, string> = { "very-weak": "w-1/5 bg-err", weak: "w-2/5 bg-err", fair: "w-3/5 bg-warn", strong: "w-4/5 bg-ok", "very-strong": "w-full bg-ok" };

export default function PasswordGenerator({ locale, mode = "password", length: len0, words: w0 = 5, lang: lang0, bits: bits0 = 256, bytes: bytes0 = 32 }: GeneratorProps) {
  const t = T[locale];
  const id = useId();
  const defaultLen = len0 ?? (mode === "pin" ? 4 : mode === "wifi" ? 63 : mode === "apikey" ? 32 : mode === "string" ? 24 : 16);
  const [length, setLength] = useState(defaultLen);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(mode === "password");
  const [symbolSet, setSymbolSet] = useState(SYMBOLS);
  const [ambiguous, setAmbiguous] = useState(false);
  const [requireEach, setRequireEach] = useState(true);
  const [count, setCount] = useState(1);
  const [words, setWords] = useState(w0);
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
  const lenRange: Record<string, [number, number]> = { password: [4, 128], wifi: [8, 63], apikey: [16, 64], string: [1, 256] };
  const range = lenRange[mode];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[0.75rem] bg-surface-2 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <output aria-label={t.result} aria-live="polite" className={cn("min-h-9 min-w-0 flex-1 font-mono font-semibold break-all text-fg", main.length > 40 ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl")}>
            {main || (mode === "passphrase" && !list ? <span className="text-base font-normal text-fg-3">{t.loading}</span> : " ")}
          </output>
          <div className="flex shrink-0 gap-1">
            <Button variant="outline" size="icon" onClick={() => setNonce((n) => n + 1)} aria-label={t.regenerate} title={t.regenerate}>
              <RefreshCw />
            </Button>
            <CopyButton value={main} label={t.copy} copiedLabel={t.copied} size="icon" showLabel={false} variant="primary" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div className={cn("h-full rounded-full transition-all", BAR[strength])} />
          </div>
          <span className="shrink-0 text-sm text-fg-2">
            {t.bits(formatNumber(locale, Math.round(entropy)))} · {t.strength[strength]}
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {range && (
          <Field label={`${t.length}: ${length} ${plural(locale, length, t.chars)}`} htmlFor={`${id}-len`}>
            <div className="flex items-center gap-3">
              <Slider id={`${id}-len`} min={range[0]} max={range[1]} value={length} onChange={(e) => setLength(Number(e.target.value))} />
              <Input aria-label={t.length} type="number" min={range[0]} max={range[1]} value={length} onChange={(e) => setLength(Math.min(range[1], Math.max(range[0], Number(e.target.value) || range[0])))} className="w-20" />
            </div>
          </Field>
        )}

        {mode === "password" && (
          <>
            <fieldset className="flex flex-wrap gap-x-5 gap-y-2">
              <legend className="mb-1.5 text-sm font-medium text-fg-2">{t.classes}</legend>
              <Checkbox label={t.lower} checked={lower} onChange={(e) => setLower(e.target.checked)} />
              <Checkbox label={t.upper} checked={upper} onChange={(e) => setUpper(e.target.checked)} />
              <Checkbox label={t.digits} checked={digits} onChange={(e) => setDigits(e.target.checked)} />
              <Checkbox label={t.symbols} checked={symbols} onChange={(e) => setSymbols(e.target.checked)} />
            </fieldset>
            <details className="rounded-[0.625rem] border border-line px-4 py-2">
              <summary className="py-1 text-sm font-medium text-fg-2">{t.advanced}</summary>
              <div className="grid gap-3 py-3 sm:grid-cols-2">
                <Checkbox label={t.ambiguous} checked={ambiguous} onChange={(e) => setAmbiguous(e.target.checked)} />
                <Checkbox label={t.requireEach} checked={requireEach} onChange={(e) => setRequireEach(e.target.checked)} />
                <Field label={t.symbolSet} htmlFor={`${id}-sym`}>
                  <Input id={`${id}-sym`} value={symbolSet} onChange={(e) => setSymbolSet(e.target.value)} className="font-mono" disabled={!symbols} spellCheck={false} />
                </Field>
                <CountSelect id={`${id}-n`} label={t.count} value={count} onChange={setCount} />
              </div>
            </details>
          </>
        )}

        {mode === "pin" && (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg-2">{t.pinLength}</span>
              <Segmented label={t.pinLength} value={String(length)} onChange={(v) => setLength(Number(v))} options={[4, 5, 6, 8, 10, 12].map((n) => ({ value: String(n), label: String(n) }))} />
            </div>
            <CountSelect id={`${id}-n`} label={t.count} value={count} onChange={setCount} />
          </div>
        )}

        {mode === "passphrase" && (
          <>
            <Field label={`${t.words}: ${words}`} htmlFor={`${id}-w`}>
              <Slider id={`${id}-w`} min={3} max={10} value={words} onChange={(e) => setWords(Number(e.target.value))} />
            </Field>
            <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-fg-2">{t.lang}</span>
                <Segmented label={t.lang} value={lang} onChange={setLang} options={[{ value: "ru", label: t.ru }, { value: "en", label: t.en }]} />
              </div>
              <SepSelect id={`${id}-sep`} label={t.separator} value={sep} onChange={setSep} labels={t.seps} />
              {lang === "ru" && <Checkbox label={t.translit} checked={translitOn} onChange={(e) => setTranslitOn(e.target.checked)} />}
              <Checkbox label={t.capitalize} checked={capitalize} onChange={(e) => setCapitalize(e.target.checked)} />
              <Checkbox label={t.addDigit} checked={addDigit} onChange={(e) => setAddDigit(e.target.checked)} />
            </div>
          </>
        )}

        {mode === "wifi" && <Checkbox label={t.wifiSymbols} checked={symbols} onChange={(e) => setSymbols(e.target.checked)} />}

        {mode === "memorable" && (
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <SmallSelect id={`${id}-mw`} label={t.words} value={words} options={[2, 3, 4, 5]} onChange={setWords} />
            <SmallSelect id={`${id}-sy`} label={t.syllables} value={syllables} options={[2, 3, 4]} onChange={setSyllables} />
            <SmallSelect id={`${id}-dg`} label={t.digitsCount} value={tailDigits} options={[0, 1, 2, 3, 4]} onChange={setTailDigits} />
            <SepSelect id={`${id}-sep`} label={t.separator} value={sep} onChange={setSep} labels={t.seps} />
            <Checkbox label={t.capitalize} checked={capitalize} onChange={(e) => setCapitalize(e.target.checked)} />
          </div>
        )}

        {mode === "hex" && (
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg-2">{t.keyBits}</span>
              <Segmented label={t.keyBits} value={String(bits)} onChange={(v) => setBits(Number(v))} options={[128, 192, 256, 512].map((b) => ({ value: String(b), label: `${b} bit` }))} />
            </div>
            <Checkbox label={t.upperHex} checked={upperHex} onChange={(e) => setUpperHex(e.target.checked)} />
          </div>
        )}

        {mode === "base64" && (
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg-2">{t.keyBytes}</span>
              <Segmented label={t.keyBytes} value={String(bytes)} onChange={(v) => setBytes(Number(v))} options={[16, 24, 32, 64].map((b) => ({ value: String(b), label: `${b * 8} bit` }))} />
            </div>
            <Checkbox label={t.urlSafe} checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} />
          </div>
        )}

        {mode === "apikey" && (
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <Field label={t.prefix} htmlFor={`${id}-pre`} className="w-48">
              <Input id={`${id}-pre`} value={prefix} onChange={(e) => setPrefix(e.target.value.replace(/\s/g, ""))} className="font-mono" spellCheck={false} />
            </Field>
            <CountSelect id={`${id}-n`} label={t.count} value={count} onChange={setCount} />
          </div>
        )}

        {mode === "string" && (
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <Field label={t.alphabet} htmlFor={`${id}-ab`} className="min-w-0 flex-1">
              <Input id={`${id}-ab`} value={alphabet} onChange={(e) => setAlphabet(e.target.value)} className="font-mono" spellCheck={false} />
            </Field>
            <CountSelect id={`${id}-n`} label={t.count} value={count} onChange={setCount} />
          </div>
        )}
      </div>

      {out && out.length > 1 && <CodeOutput title={t.more} value={out.join("\n")} labels={{ copy: t.copy, copied: t.copied, download: t.download }} filename="passwords.txt" minRows={Math.min(10, out.length)} />}

      <section className="rounded-[0.75rem] border border-line">
        <h2 className="border-b border-line px-4 py-2.5 text-sm font-semibold text-fg-2">{t.crack}</h2>
        <dl className="divide-y divide-line">
          {ATTACKS.map((a) => (
            <div key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 px-4 py-2 text-sm">
              <dt className="text-fg-2">{t.attacks[a.id]}</dt>
              <dd className="font-medium text-fg">{humanDuration(averageCrackSeconds(entropy, a.perSecond), locale)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="text-sm text-fg-3">{t.local}</p>
    </div>
  );
}

function CountSelect({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (n: number) => void }) {
  return (
    <Field label={label} htmlFor={id} className="w-36">
      <Select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {[1, 5, 10, 20, 50].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function SmallSelect({ id, label, value, options, onChange }: { id: string; label: string; value: number; options: number[]; onChange: (n: number) => void }) {
  return (
    <Field label={label} htmlFor={id} className="w-32">
      <Select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function SepSelect({ id, label, value, onChange, labels }: { id: string; label: string; value: string; onChange: (s: string) => void; labels: Record<string, string> }) {
  return (
    <Field label={label} htmlFor={id} className="w-44">
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(labels).map(([v, l]) => (
          <option key={v || "none"} value={v}>
            {l}
          </option>
        ))}
      </Select>
    </Field>
  );
}
