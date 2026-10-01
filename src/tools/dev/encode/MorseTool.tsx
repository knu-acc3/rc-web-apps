"use client";

import { ArrowLeftRight, ArrowUpDown, Download, Play, Square } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { downloadBlob } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { CodeEditor } from "@/tools/dev/shared/CodeEditor";
import { KIT_T } from "@/tools/dev/shared/labels";
import { Opt, OptionsRow, Pane } from "@/tools/dev/shared/Pane";
import { Button, IconButton } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Select, Slider } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { decodeMorse, encodeMorse, morseTimeline, renderWav } from "./lib/morse";
import { useMorsePlayer } from "./lib/useMorsePlayer";

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
    <Panel className="flex flex-col gap-4 p-4 sm:p-6">
      <Segmented
        label={t.dir}
        value={dir}
        onChange={(d) => d !== dir && swap()}
        options={[
          { value: "encode", label: t.encode },
          { value: "decode", label: t.decode },
        ]}
        className="self-start"
      />
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-3">
        <CodeEditor id={`${id}-in`} locale={locale} label={dir === "encode" ? t.text : t.code} value={text} onChange={setText} rows={5} wrap />
        <div className="flex items-center justify-center">
          <IconButton
            variant="tonal"
            label={t.swap}
            onClick={swap}
            disabled={!res.text}
            icon={
              <>
                <ArrowUpDown aria-hidden className="lg:hidden" />
                <ArrowLeftRight aria-hidden className="max-lg:hidden" />
              </>
            }
          />
        </div>
        <Pane
          title={
            <span className="flex items-center gap-2">
              <span className={cn("inline-block size-3 shrink-0 rounded-full transition-colors duration-75", player.light ? "bg-accent shadow-[0_0_0_4px_var(--accent-soft)]" : "bg-line-strong")} role="img" aria-label={t.light} />
              {dir === "encode" ? t.code : t.text}
            </span>
          }
          actions={
            <>
              <Button variant="text" size="sm" className="px-3!" onClick={wav} disabled={!code.trim()} title={`${t.wav} — ${KIT_T[locale].download}`}>
                <Download aria-hidden />
                {t.wav}
              </Button>
              <CopyButton value={res.text} label={KIT_T[locale].copy} copiedLabel={KIT_T[locale].copied} variant="secondary" compact />
            </>
          }
        >
          <output className="block min-h-24 flex-1 px-4 py-3 font-mono text-xl font-semibold tracking-wide break-words whitespace-pre-wrap text-fg sm:text-2xl" aria-live="polite">
            {res.text}
          </output>
        </Pane>
      </div>

      {notes.map((n, i) => (
        <Notice key={i} tone="warn">
          {noteText(n)}
        </Notice>
      ))}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <Button variant="filled" size="lg" onClick={() => (player.playing ? player.stop() : player.play(code, audio))} disabled={!code.trim()}>
          {player.playing ? <Square aria-hidden /> : <Play aria-hidden />}
          {player.playing ? t.stop : t.play}
        </Button>
        <OptionsRow>
          {dir === "decode" && (
            <Opt label={t.alphabet} group>
              <Segmented
                size="sm"
                label={t.alphabet}
                value={alphabet}
                onChange={setAlphabet}
                options={[
                  { value: "cyrillic", label: t.cyrillic },
                  { value: "latin", label: t.latin },
                ]}
              />
            </Opt>
          )}
          <Opt label={`${t.wpm}: ${wpm} ${t.wpmUnit}`}>
            <Slider min={5} max={40} step={1} value={wpm} onChange={(e) => setWpm(Number(e.target.value))} className="w-40!" />
          </Opt>
          <Opt label={`${t.freq}: ${freq} Hz`}>
            <Slider min={300} max={1000} step={50} value={freq} onChange={(e) => setFreq(Number(e.target.value))} className="w-40!" />
          </Opt>
          <Opt label={t.fwpm}>
            <Select value={String(fwpm)} size="sm" onChange={(e) => setFwpm(Number(e.target.value))}>
              <option value="0">{t.off}</option>
              {[5, 8, 10, 12, 15].map((v) => (
                <option key={v} value={v}>
                  {v} {t.wpmUnit}
                </option>
              ))}
            </Select>
          </Opt>
        </OptionsRow>
      </div>
    </Panel>
  );
}
