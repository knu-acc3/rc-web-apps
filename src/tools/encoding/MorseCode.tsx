"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DownloadSimple,
  SpeakerHigh,
  Stop,
  Waveform,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import { downloadBlob } from "@/src/utils/exportHelpers";

type Direction = "encode" | "decode";
type Alphabet = "latin" | "cyrillic";
type LetterSeparator = "space" | "pipe";
type WordSeparator = "slash" | "double-slash";

interface TransformResult {
  output: string;
  audioMorse: string;
  unknown: string[];
}

const LATIN_MORSE: Readonly<Record<string, string>> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
};

const CYRILLIC_MORSE: Readonly<Record<string, string>> = {
  А: ".-",
  Б: "-...",
  В: ".--",
  Г: "--.",
  Д: "-..",
  Е: ".",
  Ё: ".",
  Ж: "...-",
  З: "--..",
  И: "..",
  Й: ".---",
  К: "-.-",
  Л: ".-..",
  М: "--",
  Н: "-.",
  О: "---",
  П: ".--.",
  Р: ".-.",
  С: "...",
  Т: "-",
  У: "..-",
  Ф: "..-.",
  Х: "....",
  Ц: "-.-.",
  Ч: "---.",
  Ш: "----",
  Щ: "--.-",
  Ъ: "--.--",
  Ы: "-.--",
  Ь: "-..-",
  Э: "..-..",
  Ю: "..--",
  Я: ".-.-",
};

const COMMON_MORSE: Readonly<Record<string, string>> = {
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  _: "..--.-",
  '"': ".-..-.",
  "@": ".--.-.",
};

const LETTER_SEPARATOR_VALUES: Readonly<Record<LetterSeparator, string>> = {
  space: " ",
  pipe: " | ",
};

const WORD_SEPARATOR_VALUES: Readonly<Record<WordSeparator, string>> = {
  slash: " / ",
  "double-slash": " // ",
};

function alphabetMap(alphabet: Alphabet) {
  return alphabet === "latin" ? LATIN_MORSE : CYRILLIC_MORSE;
}

function fullMorseMap(alphabet: Alphabet) {
  return { ...alphabetMap(alphabet), ...COMMON_MORSE };
}

function reverseMorseMap(alphabet: Alphabet) {
  const reverse: Record<string, string> = {};
  for (const [character, morse] of Object.entries(fullMorseMap(alphabet))) {
    if (reverse[morse] === undefined) reverse[morse] = character;
  }
  return reverse;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function encodeMorse(
  text: string,
  alphabet: Alphabet,
  letterSeparator: LetterSeparator,
  wordSeparator: WordSeparator,
): TransformResult {
  const map = fullMorseMap(alphabet);
  const unknown: string[] = [];
  const displayWords: string[] = [];
  const audioWords: string[] = [];

  for (const word of text.trim().toUpperCase().split(/\s+/u)) {
    const displayLetters: string[] = [];
    const audioLetters: string[] = [];

    for (const character of Array.from(word)) {
      const morse = map[character];
      if (morse) {
        displayLetters.push(morse);
        audioLetters.push(morse);
      } else {
        displayLetters.push("[?]");
        unknown.push(character);
      }
    }

    displayWords.push(
      displayLetters.join(LETTER_SEPARATOR_VALUES[letterSeparator]),
    );
    audioWords.push(audioLetters.join(" "));
  }

  return {
    output: displayWords.join(WORD_SEPARATOR_VALUES[wordSeparator]),
    audioMorse: audioWords.filter(Boolean).join(" / "),
    unknown: unique(unknown),
  };
}

function splitMorseWords(text: string, separator: WordSeparator) {
  const pattern = separator === "double-slash" ? /\s*\/\/\s*/u : /\s*\/\s*/u;
  return text.trim().split(pattern);
}

function splitMorseLetters(text: string, separator: LetterSeparator) {
  return separator === "pipe"
    ? text.trim().split(/\s*\|\s*/u)
    : text.trim().split(/\s+/u);
}

function decodeMorse(
  text: string,
  alphabet: Alphabet,
  letterSeparator: LetterSeparator,
  wordSeparator: WordSeparator,
): TransformResult {
  const reverse = reverseMorseMap(alphabet);
  const unknown: string[] = [];
  const decodedWords: string[] = [];
  const audioWords: string[] = [];

  for (const word of splitMorseWords(text, wordSeparator)) {
    const decodedLetters: string[] = [];
    const validAudioLetters: string[] = [];

    for (const token of splitMorseLetters(word, letterSeparator).filter(
      Boolean,
    )) {
      const character = reverse[token];
      if (character) {
        decodedLetters.push(character);
        validAudioLetters.push(token);
      } else {
        decodedLetters.push("�");
        unknown.push(token);
      }
    }

    decodedWords.push(decodedLetters.join(""));
    audioWords.push(validAudioLetters.join(" "));
  }

  return {
    output: decodedWords.join(" "),
    audioMorse: audioWords.filter(Boolean).join(" / "),
    unknown: unique(unknown),
  };
}

function canonicalMorseWords(morse: string) {
  return morse
    .split(" / ")
    .map((word) => word.split(" ").filter((token) => /^[.-]+$/u.test(token)))
    .filter((word) => word.length > 0);
}

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) =>
    window.setTimeout(resolve, milliseconds),
  );
}

async function playMorseAudio(
  morse: string,
  wordsPerMinute: number,
  frequency: number,
  stopRef: React.MutableRefObject<boolean>,
) {
  const context = new AudioContext();
  const unit = 1200 / wordsPerMinute;
  const words = canonicalMorseWords(morse);

  await context.resume();

  const beep = async (duration: number) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const durationSeconds = duration / 1000;
    const endTime = context.currentTime + durationSeconds;

    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.55, context.currentTime + 0.006);
    gain.gain.setValueAtTime(
      0.55,
      Math.max(context.currentTime + 0.006, endTime - 0.006),
    );
    gain.gain.linearRampToValueAtTime(0, endTime);
    oscillator.start();
    oscillator.stop(endTime + 0.01);
    await sleep(duration);
  };

  try {
    for (let wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
      const word = words[wordIndex];
      for (let letterIndex = 0; letterIndex < word.length; letterIndex += 1) {
        const letter = word[letterIndex];
        for (
          let signalIndex = 0;
          signalIndex < letter.length;
          signalIndex += 1
        ) {
          if (stopRef.current) return;
          await beep(letter[signalIndex] === "." ? unit : unit * 3);
          if (signalIndex < letter.length - 1) await sleep(unit);
        }
        if (letterIndex < word.length - 1) await sleep(unit * 3);
      }
      if (wordIndex < words.length - 1) await sleep(unit * 7);
    }
  } finally {
    await context.close();
  }
}

interface TimingSegment {
  tone: boolean;
  units: number;
}

function morseTiming(morse: string) {
  const segments: TimingSegment[] = [];
  const words = canonicalMorseWords(morse);

  for (let wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
    const word = words[wordIndex];
    for (let letterIndex = 0; letterIndex < word.length; letterIndex += 1) {
      const letter = word[letterIndex];
      for (let signalIndex = 0; signalIndex < letter.length; signalIndex += 1) {
        segments.push({
          tone: true,
          units: letter[signalIndex] === "." ? 1 : 3,
        });
        if (signalIndex < letter.length - 1)
          segments.push({ tone: false, units: 1 });
      }
      if (letterIndex < word.length - 1)
        segments.push({ tone: false, units: 3 });
    }
    if (wordIndex < words.length - 1) segments.push({ tone: false, units: 7 });
  }

  return segments;
}

function morseToWavBlob(
  morse: string,
  wordsPerMinute: number,
  frequency: number,
) {
  const sampleRate = 22050;
  const samplesPerUnit = Math.max(
    1,
    Math.round((1.2 / wordsPerMinute) * sampleRate),
  );
  const segments = morseTiming(morse);
  const sampleCount = segments.reduce(
    (total, segment) => total + segment.units * samplesPerUnit,
    0,
  );
  const pcm = new Int16Array(sampleCount);
  let offset = 0;

  for (const segment of segments) {
    const length = segment.units * samplesPerUnit;
    if (segment.tone) {
      const fade = Math.min(80, Math.floor(length / 20));
      for (let index = 0; index < length; index += 1) {
        const fadeIn = fade > 0 && index < fade ? index / fade : 1;
        const fadeOut =
          fade > 0 && index >= length - fade ? (length - index - 1) / fade : 1;
        const amplitude = 0.55 * Math.max(0, Math.min(fadeIn, fadeOut));
        pcm[offset + index] = Math.round(
          amplitude *
            Math.sin((2 * Math.PI * frequency * index) / sampleRate) *
            0x7fff,
        );
      }
    }
    offset += length;
  }

  const buffer = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(buffer);
  const writeText = (at: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(at + index, value.charCodeAt(index));
    }
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, pcm.byteLength, true);
  for (let index = 0; index < pcm.length; index += 1) {
    view.setInt16(44 + index * 2, pcm[index], true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export default function MorseCode() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [direction, setDirection] = useState<Direction>("encode");
  const [alphabet, setAlphabet] = useState<Alphabet>(() =>
    locale === "en" ? "latin" : "cyrillic",
  );
  const [letterSeparator, setLetterSeparator] =
    useState<LetterSeparator>("space");
  const [wordSeparator, setWordSeparator] = useState<WordSeparator>("slash");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [audioMorse, setAudioMorse] = useState("");
  const [unknown, setUnknown] = useState<string[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [wordsPerMinute, setWordsPerMinute] = useState(15);
  const [frequency, setFrequency] = useState(600);
  const [playing, setPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const stopRef = useRef(false);

  const signalCount = useMemo(
    () =>
      Array.from(audioMorse).filter(
        (character) => character === "." || character === "-",
      ).length,
    [audioMorse],
  );
  const canDownloadWav = signalCount > 0 && signalCount <= 600;

  const invalidateResult = useCallback(() => {
    stopRef.current = true;
    setHasRun(false);
    setOutput("");
    setAudioMorse("");
    setUnknown([]);
    setPlaybackError("");
  }, []);

  useEffect(
    () => () => {
      stopRef.current = true;
    },
    [],
  );

  const chooseDirection = useCallback(
    (nextDirection: Direction) => {
      setDirection(nextDirection);
      invalidateResult();
    },
    [invalidateResult],
  );

  const transform = useCallback(() => {
    const result =
      direction === "encode"
        ? encodeMorse(input, alphabet, letterSeparator, wordSeparator)
        : decodeMorse(input, alphabet, letterSeparator, wordSeparator);

    setOutput(result.output);
    setAudioMorse(result.audioMorse);
    setUnknown(result.unknown);
    setPlaybackError("");
    setHasRun(true);
  }, [alphabet, direction, input, letterSeparator, wordSeparator]);

  const play = useCallback(async () => {
    if (!audioMorse || playing) return;
    stopRef.current = false;
    setPlaying(true);
    setPlaybackError("");
    try {
      await playMorseAudio(audioMorse, wordsPerMinute, frequency, stopRef);
    } catch {
      setPlaybackError(
        isEn
          ? "Audio could not start in this browser."
          : "Не удалось запустить звук в этом браузере.",
      );
    } finally {
      setPlaying(false);
    }
  }, [audioMorse, frequency, isEn, playing, wordsPerMinute]);

  const downloadWav = useCallback(() => {
    if (!canDownloadWav) return;
    const blob = morseToWavBlob(audioMorse, wordsPerMinute, frequency);
    downloadBlob(blob, "morse-code.wav");
  }, [audioMorse, canDownloadWav, frequency, wordsPerMinute]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Waveform size={23} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn ? "Morse code" : "Азбука Морзе"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Convert text with a clear alphabet and explicit separators."
                : "Преобразуйте текст с явным алфавитом и понятными разделителями."}
            </p>
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">
            {isEn ? "Direction" : "Направление"}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["encode", isEn ? "Text → Morse" : "Текст → Морзе"],
                ["decode", isEn ? "Morse → Text" : "Морзе → Текст"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={direction === value}
                onClick={() => chooseDirection(value)}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] border px-2 text-sm font-semibold transition-colors",
                  direction === value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <Label htmlFor="morse-input">
            {direction === "encode"
              ? isEn
                ? "Text"
                : "Текст"
              : isEn
                ? "Morse code"
                : "Код Морзе"}
          </Label>
          <Textarea
            id="morse-input"
            value={input}
            maxLength={2000}
            onChange={(event) => {
              setInput(event.target.value);
              invalidateResult();
            }}
            placeholder={
              direction === "encode"
                ? isEn
                  ? "Enter text"
                  : "Введите текст"
                : isEn
                  ? "Enter dots, dashes and separators"
                  : "Введите точки, тире и разделители"
            }
            className={cn(
              "mt-2 min-h-44 resize-y text-sm leading-relaxed",
              direction === "decode" && "font-mono tracking-wide",
            )}
            spellCheck={false}
          />
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          onClick={transform}
          disabled={input.trim().length === 0}
          leadingIcon={<Waveform size={20} aria-hidden="true" />}
        >
          {direction === "encode"
            ? isEn
              ? "Encode to Morse"
              : "Кодировать в Морзе"
            : isEn
              ? "Decode Morse"
              : "Декодировать Морзе"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Advanced settings" : "Дополнительные настройки"}
          description={
            isEn
              ? "Alphabet, separators and audio"
              : "Алфавит, разделители и звук"
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="morse-alphabet">
                {isEn ? "Alphabet" : "Алфавит"}
              </Label>
              <Select
                value={alphabet}
                onValueChange={(value) => {
                  setAlphabet(value as Alphabet);
                  invalidateResult();
                }}
              >
                <SelectTrigger id="morse-alphabet" className="mt-2 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latin">
                    {isEn ? "English / Latin" : "Английский / латиница"}
                  </SelectItem>
                  <SelectItem value="cyrillic">
                    {isEn ? "Russian / Cyrillic" : "Русский / кириллица"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="morse-letter-separator">
                {isEn ? "Between letters" : "Между буквами"}
              </Label>
              <Select
                value={letterSeparator}
                onValueChange={(value) => {
                  setLetterSeparator(value as LetterSeparator);
                  invalidateResult();
                }}
              >
                <SelectTrigger
                  id="morse-letter-separator"
                  className="mt-2 h-11"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="space">
                    {isEn ? "Space" : "Пробел"}
                  </SelectItem>
                  <SelectItem value="pipe">|</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="morse-word-separator">
                {isEn ? "Between words" : "Между словами"}
              </Label>
              <Select
                value={wordSeparator}
                onValueChange={(value) => {
                  setWordSeparator(value as WordSeparator);
                  invalidateResult();
                }}
              >
                <SelectTrigger id="morse-word-separator" className="mt-2 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slash">/</SelectItem>
                  <SelectItem value="double-slash">{"//"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
            <div className="flex flex-wrap items-center gap-2">
              {playing ? (
                <Button
                  type="button"
                  variant="danger"
                  className="min-h-11"
                  onClick={() => {
                    stopRef.current = true;
                  }}
                >
                  <Stop size={18} weight="fill" aria-hidden="true" />
                  {isEn ? "Stop" : "Остановить"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => void play()}
                  disabled={!hasRun || !audioMorse}
                >
                  <SpeakerHigh size={18} aria-hidden="true" />
                  {isEn ? "Play result" : "Воспроизвести результат"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={downloadWav}
                disabled={!hasRun || !canDownloadWav || playing}
                title={
                  signalCount > 600
                    ? isEn
                      ? "WAV is limited to 600 dot/dash signals"
                      : "WAV ограничен 600 сигналами точки/тире"
                    : undefined
                }
              >
                <DownloadSimple size={18} aria-hidden="true" />
                WAV
              </Button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">
                <span>
                  {isEn ? "Speed" : "Скорость"}: {wordsPerMinute} WPM
                </span>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={wordsPerMinute}
                  onChange={(event) =>
                    setWordsPerMinute(Number(event.target.value))
                  }
                  disabled={playing}
                  className="h-11 w-full accent-[var(--color-primary)]"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                <span>
                  {isEn ? "Tone" : "Тон"}: {frequency} Hz
                </span>
                <input
                  type="range"
                  min={400}
                  max={1000}
                  step={50}
                  value={frequency}
                  onChange={(event) => setFrequency(Number(event.target.value))}
                  disabled={playing}
                  className="h-11 w-full accent-[var(--color-primary)]"
                />
              </label>
            </div>

            {playbackError ? (
              <p
                role="alert"
                className="mt-3 text-sm text-[var(--color-danger)]"
              >
                {playbackError}
              </p>
            ) : null}
          </div>
        </AdvancedSettings>
      </Card>

      {hasRun ? (
        <Card
          className="p-4 sm:p-5"
          aria-live="polite"
          aria-labelledby="morse-result-title"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 id="morse-result-title" className="font-bold">
                {isEn ? "Result" : "Результат"}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                {alphabet === "latin"
                  ? isEn
                    ? "English / Latin alphabet"
                    : "Английский / латиница"
                  : isEn
                    ? "Russian / Cyrillic alphabet"
                    : "Русский / кириллица"}
              </p>
            </div>
            <CopyButton
              text={output}
              size="medium"
              tooltip={isEn ? "Copy result" : "Копировать результат"}
            />
          </div>
          <Textarea
            value={output}
            readOnly
            aria-label={isEn ? "Conversion result" : "Результат преобразования"}
            className={cn(
              "mt-3 min-h-40 resize-y bg-[var(--color-surface-muted)]/50 text-sm leading-relaxed",
              direction === "encode" && "font-mono tracking-wide",
            )}
            spellCheck={false}
          />

          {unknown.length > 0 ? (
            <div
              role="alert"
              className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-warning)]/35 bg-[var(--color-warning-soft)] p-3 text-sm text-[var(--color-text)]"
            >
              <span className="font-semibold">
                {direction === "encode"
                  ? isEn
                    ? "Unsupported characters:"
                    : "Неподдерживаемые символы:"
                  : isEn
                    ? "Unknown Morse groups:"
                    : "Неизвестные группы Морзе:"}
              </span>{" "}
              <span className="break-all font-mono">{unknown.join(", ")}</span>
              <p className="mt-1 text-[var(--color-text-muted)]">
                {isEn
                  ? "They are marked in the result instead of being removed."
                  : "Они отмечены в результате, а не удалены без предупреждения."}
              </p>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
