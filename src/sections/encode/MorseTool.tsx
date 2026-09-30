"use client";

import { ArrowUpDown, Download, Play, Square } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { downloadBlob } from "@/lib/clipboard";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { KIT_T } from "@/sections/code/kit/labels";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { decodeMorse, encodeMorse, morseTimeline, renderWav } from "./morse";
import { useMorsePlayer } from "./useMorsePlayer";

type Dir = "encode" | "decode";

const T = {
  ru: {
    dir: "Направление",
    encode: "Текст → Морзе",
    decode: "Морзе → текст",
    text: "Текст",
    code: "Азбука Морзе",
    play: "Слушать",
    stop: "Стоп",
    wav: "WAV",
    swap: "Поменять местами",
    wpm: "Скорость",
    fwpm: "Фарнсворт",
    off: "выкл.",
    freq: "Тон",
    alphabet: "Алфавит",
    latin: "Латиница",
    cyrillic: "Кириллица",
    kazakh: (s: string) => `Для казахских букв (${s}) нет стандартных кодов — переданы кодами ближайших русских: Ә→А, Ғ→Г, Қ→К, Ң→Н, Ө→О, Ұ/Ү→У, Һ→Х, І→И.`,
    unknown: (s: string) => `Нет в азбуке Морзе, пропущено: ${s}`,
    badCode: (s: string) => `Неизвестные коды: ${s}`,
    wpmUnit: "сл/мин",
    light: "Сигнал",
  },
  en: {
    dir: "Direction",
    encode: "Text → Morse",
    decode: "Morse → text",
    text: "Text",
    code: "Morse code",
    play: "Listen",
    stop: "Stop",
    wav: "WAV",
    swap: "Swap",
    wpm: "Speed",
    fwpm: "Farnsworth",
    off: "off",
    freq: "Tone",
    alphabet: "Alphabet",
    latin: "Latin",
    cyrillic: "Cyrillic",
    kazakh: (s: string) => `Kazakh letters (${s}) have no standard codes — sent as the closest Russian letters: Ә→А, Ғ→Г, Қ→К, Ң→Н, Ө→О, Ұ/Ү→У, Һ→Х, І→И.`,
    unknown: (s: string) => `Not in Morse code, skipped: ${s}`,
    badCode: (s: string) => `Unknown codes: ${s}`,
    wpmUnit: "WPM",
    light: "Signal",
  },
} as const;

const SAMPLES = { ru: "SOS Привет мир", en: "SOS Hello world" };

export default function MorseTool({ locale, dir: dir0 = "encode", sample }: { locale: Locale; dir?: Dir; sample?: string }) {
  const t = T[locale];
  const id = useId();
  const [dir, setDir] = useState<Dir>(dir0);
  const [text, setText] = useState(sample ?? SAMPLES[locale]);
  const [alphabet, setAlphabet] = useState<"latin" | "cyrillic">(locale === "ru" ? "cyrillic" : "latin");
  const [wpm, setWpm] = useState(18);
  const [fwpm, setFwpm] = useState(0);
  const [freq, setFreq] = useState(600);
  const player = useMorsePlayer();

  const res = useMemo(() => (dir === "encode" ? encodeMorse(text) : decodeMorse(text, alphabet)), [dir, text, alphabet]);
  const code = dir === "encode" ? res.text : text;
  const audio = { wpm, fwpm: fwpm && fwpm < wpm ? fwpm : wpm, freq };

  function swap() {
    setText(res.text);
    setDir(dir === "encode" ? "decode" : "encode");
    player.stop();
  }

  function wav() {
    const { tones, total } = morseTimeline(code, audio.wpm, audio.fwpm);
    downloadBlob(new Blob([renderWav(tones, total, freq) as BlobPart], { type: "audio/wav" }), "morse.wav");
  }

  const notes = res.notes ?? [];
  const noteText = (n: { code: string; detail?: string }) => (n.code === "morse.kazakh" ? t.kazakh(n.detail ?? "") : n.code === "morse.unknown" ? t.unknown(n.detail ?? "") : t.badCode(n.detail ?? ""));

  return (
    <Panel className="p-4 sm:p-6">
      <Segmented
        label={t.dir}
        value={dir}
        onChange={(d) => d !== dir && swap()}
        options={[
          { value: "encode", label: t.encode },
          { value: "decode", label: t.decode },
        ]}
        size="sm"
        className="mb-4"
      />
      <CodeEditor id={`${id}-in`} locale={locale} label={dir === "encode" ? t.text : t.code} value={text} onChange={setText} rows={4} wrap />

      <div className="mt-4 rounded-[0.625rem] bg-surface-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-fg-2">
            <span className={`inline-block size-3 rounded-full transition-colors duration-75 ${player.light ? "bg-accent" : "bg-line-strong"}`} role="img" aria-label={t.light} />
            {dir === "encode" ? t.code : t.text}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={swap} disabled={!res.text} title={t.swap}>
              <ArrowUpDown aria-hidden />
              <span className="max-sm:sr-only">{t.swap}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={wav} disabled={!code.trim()}>
              <Download aria-hidden />
              {t.wav}
            </Button>
            <CopyButton value={res.text} label={KIT_T[locale].copy} copiedLabel={KIT_T[locale].copied} variant="outline" />
          </div>
        </div>
        <output className="mt-2 block min-h-8 font-mono text-xl font-semibold tracking-wide break-words whitespace-pre-wrap text-fg" aria-live="polite">
          {res.text}
        </output>
        <Button className="mt-3" variant="primary" onClick={() => (player.playing ? player.stop() : player.play(code, audio))} disabled={!code.trim()}>
          {player.playing ? <Square aria-hidden /> : <Play aria-hidden />}
          {player.playing ? t.stop : t.play}
        </Button>
      </div>

      {notes.map((n, i) => (
        <Notice key={i} tone="warn" className="mt-3">
          {noteText(n)}
        </Notice>
      ))}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-fg-2">
        {dir === "decode" && (
          <label className="flex items-center gap-2">
            {t.alphabet}
            <Select value={alphabet} size="sm" className="w-36" onChange={(e) => setAlphabet(e.target.value as "latin" | "cyrillic")}>
              <option value="latin">{t.latin}</option>
              <option value="cyrillic">{t.cyrillic}</option>
            </Select>
          </label>
        )}
        <label className="flex items-center gap-2">
          {t.wpm}
          <Select value={String(wpm)} size="sm" className="w-32" onChange={(e) => setWpm(Number(e.target.value))}>
            {[5, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40].map((v) => (
              <option key={v} value={v}>
                {v} {t.wpmUnit}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2">
          {t.fwpm}
          <Select value={String(fwpm)} size="sm" className="w-32" onChange={(e) => setFwpm(Number(e.target.value))}>
            <option value="0">{t.off}</option>
            {[5, 8, 10, 12, 15].map((v) => (
              <option key={v} value={v}>
                {v} {t.wpmUnit}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2">
          {t.freq}
          <Select value={String(freq)} size="sm" className="w-28" onChange={(e) => setFreq(Number(e.target.value))}>
            {[400, 500, 600, 700, 800, 1000].map((v) => (
              <option key={v} value={v}>
                {v} Hz
              </option>
            ))}
          </Select>
        </label>
      </div>
    </Panel>
  );
}
