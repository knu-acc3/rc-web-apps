"use client";

import { Pause, Play, Square } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Checkbox, Field, Select, Slider } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { sentences } from "./lib/textOps";
import { InputPanel, MoreOptions } from "./shared";

const T = {
  ru: {
    voice: "Голос",
    online: "Показывать онлайн-голоса",
    onlineWarn:
      "Выбран онлайн-голос: браузер отправит текст поставщику голоса (например, Google или Microsoft) для синтеза речи. Локальные голоса работают на устройстве без передачи текста.",
    localTag: "на устройстве",
    onlineTag: "онлайн",
    noLocal: "Для этого языка нет голосов на устройстве. Установите голос в настройках системы или включите онлайн-голоса.",
    unsupported: "Ваш браузер не поддерживает синтез речи (Web Speech API).",
    loading: "Загрузка списка голосов…",
    rate: "Скорость",
    pitch: "Высота",
    volume: "Громкость",
    play: "Озвучить",
    pause: "Пауза",
    resume: "Продолжить",
    stop: "Стоп",
    progress: (i: number, n: number) => `Фраза ${i} из ${n}`,
    sample: "Привет! Это синтез речи прямо в браузере. Выберите голос, скорость и высоту, а затем нажмите «Озвучить».",
    all: "Все языки",
    langFilter: "Язык голоса",
  },
  en: {
    voice: "Voice",
    online: "Show online voices",
    onlineWarn:
      "An online voice is selected: the browser sends your text to the voice provider (for example Google or Microsoft) to synthesize speech. Local voices run on your device without sending the text anywhere.",
    localTag: "on device",
    onlineTag: "online",
    noLocal: "There are no on-device voices for this language. Install one in your system settings or enable online voices.",
    unsupported: "Your browser does not support speech synthesis (Web Speech API).",
    loading: "Loading voices…",
    rate: "Speed",
    pitch: "Pitch",
    volume: "Volume",
    play: "Speak",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop",
    progress: (i: number, n: number) => `Phrase ${i} of ${n}`,
    sample: "Hello! This is speech synthesis right in your browser. Pick a voice, speed and pitch, then press “Speak”.",
    all: "All languages",
    langFilter: "Voice language",
  },
} as const;

/* ───────────── voices as an external store ───────────── */

const EMPTY: SpeechSynthesisVoice[] = [];
let cache: SpeechSynthesisVoice[] = EMPTY;
let cacheKey = "";

function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return EMPTY;
  const list = window.speechSynthesis.getVoices();
  const key = list.map((v) => v.voiceURI).join("|");
  if (key !== cacheKey) {
    cacheKey = key;
    cache = list;
  }
  return cache;
}
function subscribeVoices(cb: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", cb);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", cb);
}
const noop = () => () => {};

/** Split long text into utterances (long single utterances are cut off by some browsers). */
function chunks(text: string, lang: string): string[] {
  const out: string[] = [];
  for (const s of sentences(text, lang)) {
    if (s.length <= 220) out.push(s);
    else {
      let cur = "";
      for (const w of s.split(/(?<=[,;:])\s+|\s+/)) {
        if ((cur + " " + w).length > 220 && cur) {
          out.push(cur);
          cur = w;
        } else cur = cur ? `${cur} ${w}` : w;
      }
      if (cur) out.push(cur);
    }
  }
  return out;
}

export default function TextToSpeech({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const supported = useSyncExternalStore(noop, () => "speechSynthesis" in window, () => true);
  const voices = useSyncExternalStore(subscribeVoices, getVoices, () => EMPTY);
  const [text, setText] = useState<string>(t.sample);
  const [showOnline, setShowOnline] = useState(false);
  const [langFilter, setLangFilter] = useState<string>(locale);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [state, setState] = useState<"idle" | "speaking" | "paused">("idle");
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const cancelled = useRef(false);

  useEffect(
    () => () => {
      cancelled.current = true;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  const langs = [...new Set(voices.map((v) => v.lang.split(/[-_]/)[0].toLowerCase()))].sort();
  const filtered = voices
    .filter((v) => (showOnline || v.localService) && (langFilter === "all" || v.lang.toLowerCase().startsWith(langFilter)))
    .sort((a, b) => Number(b.localService) - Number(a.localService) || a.name.localeCompare(b.name));
  const hasLocalForLang = voices.some((v) => v.localService && (langFilter === "all" || v.lang.toLowerCase().startsWith(langFilter)));
  const voice = filtered.find((v) => v.voiceURI === voiceURI) ?? filtered.find((v) => v.default) ?? filtered[0];

  function speak() {
    const synth = window.speechSynthesis;
    synth.cancel();
    cancelled.current = false;
    const parts = chunks(text, voice?.lang ?? locale);
    if (!parts.length) return;
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      u.rate = rate;
      u.pitch = pitch;
      u.volume = volume;
      u.onstart = () => {
        setState("speaking");
        setProgress([i + 1, parts.length]);
      };
      u.onend = () => {
        if (i === parts.length - 1) {
          setState("idle");
          setProgress(null);
        }
      };
      u.onerror = () => {
        setState("idle");
        setProgress(null);
      };
      synth.speak(u);
    });
    setState("speaking");
  }

  if (!supported) return <Notice tone="warn">{t.unsupported}</Notice>;

  return (
    <div className="flex flex-col gap-4">
      <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} rows={7} />
      <div className="flex flex-wrap items-end gap-3">
        <Button variant="primary" size="lg" onClick={speak} disabled={!text.trim() || !voice}>
          <Play aria-hidden />
          {t.play}
        </Button>
        <Field label={t.voice} htmlFor={`${id}-v`} className="min-w-56 flex-1">
          <Select id={`${id}-v`} value={voice?.voiceURI ?? ""} onChange={(e) => setVoiceURI(e.target.value)} disabled={!filtered.length}>
            {!voices.length && <option value="">{t.loading}</option>}
            {filtered.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} · {v.lang} · {v.localService ? t.localTag : t.onlineTag}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {voices.length > 0 && !hasLocalForLang && !showOnline && <Notice tone="warn">{t.noLocal}</Notice>}
      {voice && !voice.localService && <Notice tone="warn">{t.onlineWarn}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          disabled={state === "idle"}
          onClick={() => {
            const synth = window.speechSynthesis;
            if (state === "paused") {
              synth.resume();
              setState("speaking");
            } else {
              synth.pause();
              setState("paused");
            }
          }}
        >
          <Pause aria-hidden />
          {state === "paused" ? t.resume : t.pause}
        </Button>
        <Button
          variant="outline"
          disabled={state === "idle"}
          onClick={() => {
            window.speechSynthesis.cancel();
            setState("idle");
            setProgress(null);
          }}
        >
          <Square aria-hidden />
          {t.stop}
        </Button>
        {progress && <span className="tabular text-sm text-fg-2">{t.progress(progress[0], progress[1])}</span>}
      </div>
      <MoreOptions locale={locale}>
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t.langFilter} htmlFor={`${id}-lf`}>
            <Select id={`${id}-lf`} value={langFilter} onChange={(e) => setLangFilter(e.target.value)} size="sm">
              <option value="all">{t.all}</option>
              {[...new Set([locale, ...langs])].map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </Select>
          </Field>
          {(
            [
              [t.rate, rate, setRate, 0.5, 2, 0.1],
              [t.pitch, pitch, setPitch, 0, 2, 0.1],
              [t.volume, volume, setVolume, 0, 1, 0.05],
            ] as [string, number, (n: number) => void, number, number, number][]
          ).map(([label, v, setV, min, max, step], i) => (
            <Field key={label} label={label} htmlFor={`${id}-s${i}`} aside={<span className="tabular text-sm text-fg-2">{formatNumber(locale, v, { maximumFractionDigits: 2 })}</span>}>
              <Slider id={`${id}-s${i}`} min={min} max={max} step={step} value={v} onChange={(e) => setV(Number(e.target.value))} />
            </Field>
          ))}
        </div>
        <Checkbox label={t.online} checked={showOnline} onChange={(e) => setShowOnline(e.target.checked)} />
      </MoreOptions>
    </div>
  );
}
