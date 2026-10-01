"use client";

import { ArrowDown, ArrowLeftRight, ArrowUpDown, Download } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { downloadBlob, downloadText } from "@/lib/clipboard";
import { bytesToHex } from "@/tools/dev/shared/bytes";
import { CodeEditor } from "@/tools/dev/shared/CodeEditor";
import { useLiveTask, useWorkerClient } from "@/tools/dev/shared/hooks";
import { KIT_T, positionLabel } from "@/tools/dev/shared/labels";
import { Opt, OptionsRow, Pane } from "@/tools/dev/shared/Pane";
import { Button, IconButton } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Select, Switch } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { NumberInput } from "@/ui/number-input";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { caesar, CYRILLIC, LATIN } from "./lib/codecs";
import { loadCodec, type CodecId } from "./lib/registry";
import type { Codec as CodecT, CodecError, CodecResult, Opts } from "./lib/types";

type Dir = "encode" | "decode";
type L = { ru: string; en: string };

const NAME: Record<CodecId, L> = {
  base64: { ru: "Base64", en: "Base64" },
  url: { ru: "URL-кодировка", en: "URL-encoded" },
  html: { ru: "HTML-сущности", en: "HTML entities" },
  binary: { ru: "Двоичный код", en: "Binary" },
  octal: { ru: "Восьмеричный код", en: "Octal" },
  decimal: { ru: "Десятичные коды", en: "Decimal" },
  hex: { ru: "Hex", en: "Hex" },
  base32: { ru: "Base32", en: "Base32" },
  base58: { ru: "Base58", en: "Base58" },
  base85: { ru: "Base85", en: "Base85" },
  unicode: { ru: "Escape-последовательности", en: "Escape sequences" },
  json: { ru: "JSON-строка", en: "JSON string" },
  qp: { ru: "Quoted-printable", en: "Quoted-printable" },
  rot: { ru: "ROT13", en: "ROT13" },
  caesar: { ru: "Шифр Цезаря", en: "Caesar cipher" },
  atbash: { ru: "Шифр Атбаш", en: "Atbash cipher" },
  punycode: { ru: "Punycode (ASCII)", en: "Punycode (ASCII)" },
};

const PLAIN: Record<CodecId, L> = {
  ...Object.fromEntries(Object.keys(NAME).map((k) => [k, { ru: "Текст", en: "Text" }])),
  punycode: { ru: "Домен или e-mail", en: "Domain or e-mail" },
  rot: { ru: "Текст", en: "Text" },
} as Record<CodecId, L>;

const T = {
  ru: {
    dir: "Направление",
    encode: "Кодировать",
    decode: "Декодировать",
    encrypt: "Зашифровать",
    decrypt: "Расшифровать",
    swap: "Поменять местами",
    download: "Скачать",
    downloadBin: "Скачать как файл",
    binary: "Результат — двоичные данные, а не текст UTF-8. Первые байты в hex:",
    truncated: (n: string) => `Показаны первые ${n} символов — скопируйте или скачайте результат целиком.`,
    chars: ["символ", "символа", "символов"],
    bytes: ["байт", "байта", "байт"],
    pos: "позиция",
    loading: "Загрузка…",
    allShifts: "Все сдвиги",
    shift: "Сдвиг",
    opts: {
      urlSafe: "URL-safe (- и _)",
      wrap: "Переносы по 76 символов",
      mode: "Режим",
      modes: { component: "encodeURIComponent", uri: "encodeURI (весь адрес)", form: "Форма (пробел → +)" },
      plus: "«+» как пробел",
      htmlModes: { basic: "Только & < > \" '", named: "Именованные сущности", decimal: "Все не-ASCII: &#1076;", hex: "Все не-ASCII: &#x434;" },
      group: "Группы",
      groups: { "1": "по 1 байту", "2": "по 2 байта", "4": "по 4 байта", "0": "без пробелов" },
      prefix: "Префикс",
      upper: "ЗАГЛАВНЫЕ",
      charset: "Кодировка",
      variant: "Вариант",
      b32: { rfc4648: "RFC 4648", hex: "base32hex", crockford: "Crockford" },
      b85: { ascii85: "Ascii85 (Adobe)", z85: "Z85 (ZeroMQ)" },
      delimiters: "Обрамление <~ ~>",
      style: "Формат",
      styles: { js: "\\uXXXX (JavaScript, JSON)", es6: "\\u{…} (ES6)", html: "&#x…; (HTML)", python: "\\u / \\U (Python)", css: "\\… (CSS)", uplus: "U+XXXX" },
      all: "Экранировать и ASCII",
      quotes: "В кавычках",
      ascii: "Не-ASCII как \\u",
      rotv: { rot13: "ROT13 (буквы)", rot47: "ROT47 (все ASCII)" },
      alphabet: "Алфавит",
      alphabets: { both: "Латиница + кириллица", latin: "Латиница (26)", cyrillic: "Кириллица (33, с Ё)" },
    },
  },
  en: {
    dir: "Direction",
    encode: "Encode",
    decode: "Decode",
    encrypt: "Encrypt",
    decrypt: "Decrypt",
    swap: "Swap",
    download: "Download",
    downloadBin: "Download as a file",
    binary: "The result is binary data, not UTF-8 text. First bytes in hex:",
    truncated: (n: string) => `Showing the first ${n} characters — copy or download the full result.`,
    chars: ["character", "characters"],
    bytes: ["byte", "bytes"],
    pos: "position",
    loading: "Loading…",
    allShifts: "All shifts",
    shift: "Shift",
    opts: {
      urlSafe: "URL-safe (- and _)",
      wrap: "Wrap at 76 characters",
      mode: "Mode",
      modes: { component: "encodeURIComponent", uri: "encodeURI (whole URL)", form: "Form (space → +)" },
      plus: "“+” as space",
      htmlModes: { basic: "Only & < > \" '", named: "Named entities", decimal: "All non-ASCII: &#1076;", hex: "All non-ASCII: &#x434;" },
      group: "Groups",
      groups: { "1": "1 byte", "2": "2 bytes", "4": "4 bytes", "0": "no spaces" },
      prefix: "Prefix",
      upper: "UPPERCASE",
      charset: "Charset",
      variant: "Variant",
      b32: { rfc4648: "RFC 4648", hex: "base32hex", crockford: "Crockford" },
      b85: { ascii85: "Ascii85 (Adobe)", z85: "Z85 (ZeroMQ)" },
      delimiters: "<~ ~> delimiters",
      style: "Format",
      styles: { js: "\\uXXXX (JavaScript, JSON)", es6: "\\u{…} (ES6)", html: "&#x…; (HTML)", python: "\\u / \\U (Python)", css: "\\… (CSS)", uplus: "U+XXXX" },
      all: "Escape ASCII too",
      quotes: "With quotes",
      ascii: "Non-ASCII as \\u",
      rotv: { rot13: "ROT13 (letters)", rot47: "ROT47 (all ASCII)" },
      alphabet: "Alphabet",
      alphabets: { both: "Latin + Cyrillic", latin: "Latin (26)", cyrillic: "Cyrillic (33, with Ё)" },
    },
  },
} as const;

const ERR: Record<string, L> = {
  notUtf8: { ru: "Результат — не текст в UTF-8", en: "The result isn't UTF-8 text" },
  "b64.char": { ru: "Недопустимый символ «{d}» для Base64", en: "Invalid Base64 character “{d}”" },
  "b64.length": { ru: "Неверная длина: в конце остался один лишний символ", en: "Invalid length: one stray character at the end" },
  "b64.padding": { ru: "Данные после знаков «=» или слишком много «=»", en: "Data after “=” padding or too much padding" },
  "url.percent": { ru: "После % должны идти две hex-цифры, а здесь «{d}»", en: "% must be followed by two hex digits, got “{d}”" },
  "url.utf8": { ru: "Последовательность {d} — не символ UTF-8", en: "Sequence {d} is not valid UTF-8" },
  "url.surrogate": { ru: "Непарный суррогатный символ UTF-16 нельзя закодировать", en: "A lone UTF-16 surrogate can't be encoded" },
  "num.char": { ru: "Недопустимый символ «{d}»", en: "Invalid character “{d}”" },
  "num.range": { ru: "Значение {d} больше 255 — это не байт", en: "Value {d} is greater than 255 — not a byte" },
  "num.decimalSep": { ru: "Десятичные коды разделяйте пробелами или запятыми", en: "Separate decimal codes with spaces or commas" },
  "num.width": { ru: "Без разделителей количество цифр должно быть кратно {d}", en: "Without separators the number of digits must be a multiple of {d}" },
  "b32.char": { ru: "Символа «{d}» нет в алфавите Base32", en: "“{d}” is not in the Base32 alphabet" },
  "b58.char": { ru: "Символа «{d}» нет в алфавите Base58 (нет 0, O, I и l)", en: "“{d}” is not in the Base58 alphabet (no 0, O, I or l)" },
  "b85.char": { ru: "Символа «{d}» нет в алфавите Base85", en: "“{d}” is not in the Base85 alphabet" },
  "b85.length": { ru: "Неполная группа из одного символа в конце", en: "Incomplete one-character group at the end" },
  "b85.overflow": { ru: "Группа из 5 символов больше 2³² − 1", en: "A 5-character group exceeds 2³² − 1" },
  "z85.length": { ru: "Z85 кодирует данные длиной, кратной 4 байтам (сейчас {d})", en: "Z85 needs a length that is a multiple of 4 bytes (got {d})" },
  "uni.range": { ru: "Код {d} больше U+10FFFF", en: "Code point {d} is above U+10FFFF" },
  "json.quote": { ru: "Неэкранированная кавычка внутри строки", en: "Unescaped quote inside the string" },
  "json.escape": { ru: "Неизвестная escape-последовательность {d}", en: "Unknown escape sequence {d}" },
  "json.u": { ru: "Неполная последовательность {d}", en: "Incomplete sequence {d}" },
  tooLong: { ru: "Слишком длинный ввод (максимум {d} байт)", en: "Input too long (maximum {d} bytes)" },
  "puny.bad": { ru: "Неверная Punycode-метка после xn--", en: "Invalid Punycode label after xn--" },
};

export function errorText(e: CodecError, locale: Locale, input: string): string {
  const base = (ERR[e.code]?.[locale] ?? e.code).replace("{d}", e.detail ?? "");
  if (e.pos === undefined) return base;
  const before = input.slice(0, e.pos);
  const line = before.split("\n").length;
  const col = e.pos - before.lastIndexOf("\n");
  return `${base} — ${positionLabel(locale, line, col)}`;
}

const SHOW_MAX = 100_000;
const SYNC_MAX = 200_000;

export interface CodecProps {
  locale: Locale;
  codec: CodecId;
  dir: Dir;
  samples: L;
  /** Output for the sample, computed on the server so the answer is in the HTML. */
  outputs?: L;
  options?: Opts;
  /** Encrypt/Decrypt wording (ciphers). */
  cipher?: boolean;
}

export default function Codec({ locale, codec, dir: dir0, samples, outputs, options = {}, cipher = false }: CodecProps) {
  const t = T[locale];
  const o = t.opts;
  const id = useId();
  const [dir, setDir] = useState<Dir>(dir0);
  const [text, setText] = useState(samples[locale]);
  const [opts, setOpts] = useState<Opts>(options);
  const [impl, setImpl] = useState<CodecT | null>(null);
  const client = useWorkerClient(() => new Worker(new URL("./lib/encode.worker.ts", import.meta.url), { type: "module" }));

  useEffect(() => {
    let alive = true;
    loadCodec(codec).then((c) => alive && setImpl(c));
    return () => {
      alive = false;
    };
  }, [codec]);

  const set = (k: string, v: string | number | boolean) => setOpts((p) => ({ ...p, [k]: v }));
  const big = text.length > SYNC_MAX;
  const optKey = JSON.stringify(opts);

  const sync: CodecResult | null = useMemo(() => {
    if (big) return null;
    if (!impl) return dir === dir0 && text === samples[locale] && optKey === JSON.stringify(options) && outputs ? { text: outputs[locale] } : null;
    return dir === "encode" ? impl.encode(text, opts) : impl.decode(text, opts);
  }, [big, impl, dir, dir0, text, samples, locale, optKey, options, outputs, opts]);

  const live = useLiveTask<CodecResult>(`${dir}|${optKey}|${text}`, big ? () => client.run<CodecResult>("run", { id: codec, dir, text, opts }, { timeoutMs: 60000 }) : null, 300);
  const res = big ? (live.value ?? null) : sync;
  const out = res && !res.error ? res.text : "";

  /** Flip the direction; a valid result becomes the new input. */
  function swap() {
    if (out && !res?.error && !res?.bytes) setText(out);
    setDir(dir === "encode" ? "decode" : "encode");
  }

  const outName = dir === "encode" ? NAME[codec][locale] : PLAIN[codec][locale];
  const inName = dir === "encode" ? PLAIN[codec][locale] : NAME[codec][locale];
  const shown = out.length > SHOW_MAX ? out.slice(0, SHOW_MAX) : out;
  const count = [...out.slice(0, SHOW_MAX)].length + Math.max(0, out.length - SHOW_MAX);

  const caption = (key: string) => (key === "mode" ? o.mode : key === "group" ? o.group : key === "charset" ? o.charset : key === "variant" ? o.variant : key === "style" ? o.style : key === "alphabet" ? o.alphabet : key);
  /** Many or long choices: a drop-down list sized to its text. */
  const sel = (key: string, labels: Record<string, string>, def: string) => (
    <Opt label={caption(key)}>
      <Select value={String(opts[key] ?? def)} size="sm" onChange={(e) => set(key, e.target.value)}>
        {Object.entries(labels).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Select>
    </Opt>
  );
  /** Two to four short choices: segmented buttons (they wrap into pills on a narrow screen). */
  const seg = (key: string, labels: Record<string, string>, def: string) => (
    <Opt label={caption(key)} group>
      <Segmented label={caption(key)} size="sm" value={String(opts[key] ?? def)} onChange={(v) => set(key, v)} options={Object.entries(labels).map(([value, label]) => ({ value, label }))} />
    </Opt>
  );
  const sw = (key: string, label: string, def = false) => <Switch label={label} checked={opts[key] === undefined ? def : !!opts[key]} onChange={(e) => set(key, e.target.checked)} />;
  const charsets = { "utf-8": "UTF-8", "windows-1251": "Windows-1251", "koi8-r": "KOI8-R", "iso-8859-1": "ISO-8859-1" };
  const numeric = codec === "binary" || codec === "octal" || codec === "decimal" || codec === "hex";

  const optionRow = (
    <>
      {codec === "base64" && dir === "encode" && (
        <>
          {sw("urlSafe", o.urlSafe)}
          {sw("wrap", o.wrap)}
        </>
      )}
      {codec === "url" && (dir === "encode" ? seg("mode", o.modes, "component") : sw("plus", o.plus))}
      {codec === "html" && dir === "encode" && sel("mode", o.htmlModes, "basic")}
      {numeric && dir === "encode" && (
        <>
          {seg("group", o.groups, "1")}
          {codec !== "decimal" && sw("prefix", `${o.prefix} ${codec === "hex" ? "0x" : codec === "binary" ? "0b" : "0o"}`)}
          {codec === "hex" && sw("upper", o.upper)}
        </>
      )}
      {(numeric || codec === "qp") && dir === "decode" && seg("charset", charsets, "utf-8")}
      {codec === "base32" && seg("variant", o.b32, "rfc4648")}
      {codec === "base85" && (
        <>
          {seg("variant", o.b85, "ascii85")}
          {dir === "encode" && opts.variant !== "z85" && sw("delimiters", o.delimiters, true)}
        </>
      )}
      {codec === "unicode" && dir === "encode" && (
        <>
          {sel("style", o.styles, "js")}
          {sw("all", o.all)}
        </>
      )}
      {codec === "json" && dir === "encode" && (
        <>
          {sw("quotes", o.quotes, true)}
          {sw("ascii", o.ascii)}
        </>
      )}
      {codec === "rot" && seg("variant", o.rotv, "rot13")}
      {(codec === "caesar" || codec === "atbash") && seg("alphabet", o.alphabets, "both")}
      {codec === "caesar" && (
        <Opt label={t.shift} htmlFor={`${id}-shift`}>
          <NumberInput id={`${id}-shift`} size="sm" locale={locale} min={1} max={32} value={Number(opts.shift ?? 3)} onChange={(v) => v !== null && set("shift", v)} className="w-32" />
        </Opt>
      )}
    </>
  );

  const dirLabels = cipher ? { encode: t.encrypt, decode: t.decrypt } : { encode: t.encode, decode: t.decode };
  const canSwap = codec !== "rot" && codec !== "atbash";
  const pending = big && live.pending;

  return (
    <Panel className="flex flex-col gap-4 p-4 sm:p-6">
      {canSwap && <Segmented label={t.dir} value={dir} onChange={(d) => d !== dir && swap()} options={[{ value: "encode", label: dirLabels.encode }, { value: "decode", label: dirLabels.decode }]} className="self-start" />}

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-3">
        <CodeEditor id={`${id}-in`} locale={locale} label={inName} value={text} onChange={setText} rows={6} wrap invalid={!!res?.error && !res.bytes} fileAccept="" />

        <div className="flex items-center justify-center">
          {canSwap ? (
            <IconButton
              variant="tonal"
              label={t.swap}
              onClick={swap}
              disabled={!out}
              icon={
                <>
                  <ArrowUpDown aria-hidden className="lg:hidden" />
                  <ArrowLeftRight aria-hidden className="max-lg:hidden" />
                </>
              }
            />
          ) : (
            <ArrowDown aria-hidden className="size-5 text-fg-3 lg:-rotate-90" />
          )}
        </div>

        <Pane
          title={outName}
          actions={
            <>
              {out.length > 2000 && <IconButton label={t.download} icon={<Download aria-hidden />} onClick={() => downloadText(out, `${codec}-${dir}.txt`)} />}
              <CopyButton value={out} label={KIT_T[locale].copy} copiedLabel={KIT_T[locale].copied} variant="secondary" compact />
            </>
          }
          footer={
            out ? (
              <span aria-live="polite">
                {formatNumber(locale, count)} {plural(locale, count, t.chars)}
                {out.length > SHOW_MAX ? ` · ${t.truncated(formatNumber(locale, SHOW_MAX))}` : ""}
              </span>
            ) : undefined
          }
        >
          {res?.bytes ? (
            <div className="flex flex-col items-start gap-2 px-4 py-3 text-sm text-fg-2">
              <p>{t.binary}</p>
              <code className="block font-mono text-[0.8125rem] break-all text-fg">{bytesToHex(res.bytes.slice(0, 64)).replace(/(..)/g, "$1 ")}</code>
              <Button size="sm" variant="tonal" onClick={() => downloadBlob(new Blob([res.bytes as BlobPart]), "decoded.bin")}>
                <Download aria-hidden />
                {t.downloadBin} ({formatNumber(locale, res.bytes.length)} {plural(locale, res.bytes.length, t.bytes)})
              </Button>
            </div>
          ) : res?.error ? (
            <p role="alert" className="flex-1 px-4 py-3 text-[0.9375rem] font-medium text-err">
              {errorText(res.error, locale, text)}
            </p>
          ) : (
            <pre aria-live="polite" className={cn("max-h-[45vh] min-h-24 flex-1 overflow-auto px-4 py-3 font-mono break-all whitespace-pre-wrap text-fg motion-safe:transition-opacity", out.length < 240 ? "text-lg font-semibold sm:text-xl" : "text-sm", pending && "opacity-60")}>
              {shown || (pending ? t.loading : "")}
            </pre>
          )}
        </Pane>
      </div>

      <OptionsRow>{optionRow}</OptionsRow>

      {codec === "caesar" && dir === "decode" && text.trim() && !big && <AllShifts locale={locale} text={text} alphabet={String(opts.alphabet ?? "both")} />}
    </Panel>
  );
}

function AllShifts({ locale, text, alphabet }: { locale: Locale; text: string; alphabet: string }) {
  const t = T[locale];
  const abc = alphabet === "latin" ? [LATIN] : alphabet === "cyrillic" ? [CYRILLIC] : [LATIN, CYRILLIC];
  const n = alphabet === "latin" ? 26 : 33;
  const sample = text.slice(0, 160);
  return (
    <Fold variant="inline" title={t.allShifts}>
      <ol className="divide-y divide-line rounded-[1rem] bg-surface-2 font-mono text-[0.8125rem]">
        {Array.from({ length: n - 1 }, (_, i) => i + 1).map((s) => (
          <li key={s} className="flex gap-3 px-4 py-1.5">
            <span className="w-6 shrink-0 text-right text-fg-3">{s}</span>
            <span className="min-w-0 break-all text-fg">{caesar(sample, -s, abc)}</span>
          </li>
        ))}
      </ol>
    </Fold>
  );
}
