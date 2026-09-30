"use client";

import { useState } from "react";
import { ArrowsLeftRight } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { MobileSlider } from "@/src/components/tool/MobileSlider";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";

type ReverseMode =
  | "chars"
  | "chars-per-line"
  | "words"
  | "each-word"
  | "lines"
  | "mirror"
  | "rot13"
  | "rot47"
  | "atbash"
  | "caesar"
  | "vigenere";

const MAIN_MODES: Array<{ value: ReverseMode; ru: string; en: string }> = [
  { value: "chars", ru: "Символы", en: "Characters" },
  { value: "words", ru: "Слова", en: "Words" },
  { value: "lines", ru: "Строки", en: "Lines" },
];

const ALL_MODES: Array<{ value: ReverseMode; ru: string; en: string }> = [
  ...MAIN_MODES,
  { value: "chars-per-line", ru: "Символы в каждой строке", en: "Characters per line" },
  { value: "each-word", ru: "Каждое слово", en: "Each word" },
  { value: "mirror", ru: "Перевернуть вверх ногами", en: "Upside-down mirror" },
  { value: "rot13", ru: "ROT13", en: "ROT13" },
  { value: "rot47", ru: "ROT47", en: "ROT47" },
  { value: "atbash", ru: "Атбаш", en: "Atbash" },
  { value: "caesar", ru: "Шифр Цезаря", en: "Caesar cipher" },
  { value: "vigenere", ru: "Шифр Виженера", en: "Vigenère cipher" },
];

const FLIP_MAP: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ",
  i: "ı", j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d",
  q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x",
  y: "ʎ", z: "z", A: "∀", B: "ᗺ", C: "Ɔ", D: "ᗡ", E: "Ǝ", F: "Ⅎ",
  G: "⅁", H: "H", I: "I", J: "ſ", K: "⋊", L: "⅂", M: "W", N: "N",
  O: "O", P: "Ԁ", Q: "Ό", R: "ᴚ", S: "S", T: "⊥", U: "∩", V: "Λ",
  W: "M", X: "X", Y: "⅄", Z: "Z", "0": "0", "1": "Ɩ", "2": "ᄅ",
  "3": "Ɛ", "4": "ㄣ", "5": "ϛ", "6": "9", "7": "ㄥ", "8": "8", "9": "6",
  ".": "˙", ",": "‘", "?": "¿", "!": "¡", "(": ")", ")": "(",
  "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<",
  "&": "⅋", _: "‾", "'": ",", '"': "„", "`": ",", ";": "؛",
};

function reverseCharacters(text: string): string {
  return Array.from(text).reverse().join("");
}

function reverseWords(text: string): string {
  return text
    .split("\n")
    .map((line) => line.split(/(\s+)/).reverse().join(""))
    .join("\n");
}

function reverseEachWord(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line
        .split(/(\s+)/)
        .map((part) => (/^\s+$/.test(part) ? part : reverseCharacters(part)))
        .join(""),
    )
    .join("\n");
}

function shiftLatin(text: string, shift: number): string {
  return text.replace(/[a-zA-Z]/g, (character) => {
    const base = character <= "Z" ? 65 : 97;
    return String.fromCharCode(
      ((character.charCodeAt(0) - base + shift + 26 * 4) % 26) + base,
    );
  });
}

function rot47(text: string): string {
  return Array.from(text)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code >= 33 && code <= 126
        ? String.fromCharCode(33 + ((code - 33 + 47) % 94))
        : character;
    })
    .join("");
}

function atbash(text: string): string {
  return text.replace(/[a-zA-Z]/g, (character) => {
    const base = character <= "Z" ? 65 : 97;
    return String.fromCharCode(base + 25 - (character.charCodeAt(0) - base));
  });
}

function vigenere(text: string, key: string, encrypt: boolean): string {
  const cleanKey = key.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (!cleanKey) return text;
  let keyIndex = 0;
  return text.replace(/[a-zA-Z]/g, (character) => {
    const base = character <= "Z" ? 65 : 97;
    const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
    keyIndex += 1;
    return String.fromCharCode(
      ((character.charCodeAt(0) - base + shift * (encrypt ? 1 : -1) + 52) % 26) +
        base,
    );
  });
}

function transformText(
  text: string,
  mode: ReverseMode,
  caesarShift: number,
  vigenereKey: string,
  encrypt: boolean,
): string {
  switch (mode) {
    case "chars":
      return reverseCharacters(text);
    case "chars-per-line":
      return text.split("\n").map(reverseCharacters).join("\n");
    case "words":
      return reverseWords(text);
    case "each-word":
      return reverseEachWord(text);
    case "lines":
      return text.split("\n").reverse().join("\n");
    case "mirror":
      return reverseCharacters(
        Array.from(text)
          .map((character) => FLIP_MAP[character] ?? character)
          .join(""),
      )
        .split("\n")
        .reverse()
        .join("\n");
    case "rot13":
      return shiftLatin(text, 13);
    case "rot47":
      return rot47(text);
    case "atbash":
      return atbash(text);
    case "caesar":
      return shiftLatin(text, caesarShift);
    case "vigenere":
      return vigenere(text, vigenereKey, encrypt);
  }
}

export default function TextReverse() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ReverseMode>("chars");
  const [caesarShift, setCaesarShift] = useState(3);
  const [vigenereKey, setVigenereKey] = useState("KEY");
  const [vigenereEncrypt, setVigenereEncrypt] = useState(true);
  const [result, setResult] = useState("");
  const [processedSignature, setProcessedSignature] = useState("");

  const signature = [input, mode, caesarShift, vigenereKey, vigenereEncrypt].join("|");
  const hasFreshResult = result.length > 0 && processedSignature === signature;
  const activeLabel = ALL_MODES.find((option) => option.value === mode);

  const runTransform = () => {
    setResult(transformText(input, mode, caesarShift, vigenereKey, vigenereEncrypt));
    setProcessedSignature(signature);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      <Card className="p-4 sm:p-5">
        <Label htmlFor="reverse-input" className="mb-1.5 block text-sm">
          {isEn ? "Text" : "Текст"}
        </Label>
        <Textarea
          id="reverse-input"
          rows={6}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isEn ? "Enter text to reverse" : "Введите текст, который нужно развернуть"}
          className="mb-4 text-base"
        />

        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label={isEn ? "Reverse by" : "Что развернуть"}
        >
          {MAIN_MODES.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={mode === option.value ? "soft" : "outline"}
              role="radio"
              aria-checked={mode === option.value}
              onClick={() => setMode(option.value)}
            >
              {isEn ? option.en : option.ru}
            </Button>
          ))}
        </div>

        <AdvancedSettings
          className="mt-3"
          title={isEn ? "Other transformations" : "Другие преобразования"}
          description={isEn ? "Per-line, mirror and classic ciphers" : "По строкам, зеркало и классические шифры"}
        >
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm">
                {isEn ? "Transformation" : "Преобразование"}
              </Label>
              <Select value={mode} onValueChange={(value) => setMode(value as ReverseMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_MODES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {isEn ? option.en : option.ru}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === "caesar" && (
              <MobileSlider
                label={isEn ? "Shift" : "Сдвиг"}
                value={caesarShift}
                min={-25}
                max={25}
                onChange={setCaesarShift}
              />
            )}

            {mode === "vigenere" && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="vigenere-key" className="mb-1.5 block text-sm">
                    {isEn ? "Key" : "Ключ"}
                  </Label>
                  <Input
                    id="vigenere-key"
                    value={vigenereKey}
                    onChange={(event) => setVigenereKey(event.target.value)}
                    maxLength={64}
                    className="font-mono uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={vigenereEncrypt ? "soft" : "outline"}
                    onClick={() => setVigenereEncrypt(true)}
                  >
                    {isEn ? "Encrypt" : "Зашифровать"}
                  </Button>
                  <Button
                    type="button"
                    variant={!vigenereEncrypt ? "soft" : "outline"}
                    onClick={() => setVigenereEncrypt(false)}
                  >
                    {isEn ? "Decrypt" : "Расшифровать"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </AdvancedSettings>

        <Button
          type="button"
          size="lg"
          className="mt-3 w-full"
          onClick={runTransform}
          disabled={!input}
        >
          <ArrowsLeftRight size={20} />
          {isEn ? "Transform text" : "Преобразовать текст"}
        </Button>
      </Card>

      {hasFreshResult && (
        <Card className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{isEn ? "Result" : "Результат"}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {isEn ? activeLabel?.en : activeLabel?.ru}
              </div>
            </div>
            <CopyButton text={result} size="medium" />
          </div>
          <Textarea
            rows={7}
            value={result}
            readOnly
            aria-label={isEn ? "Transformed text" : "Преобразованный текст"}
            className="bg-[var(--color-surface-muted)] text-base"
          />
        </Card>
      )}
    </div>
  );
}
