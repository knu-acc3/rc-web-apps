"use client";

import { Mic, MicOff, Volume2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Field, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { INSTRUMENTS, type InstrumentId } from "../data/instruments";
import { mediaErrorKind, openMicrophone, resumeAudio, stopStream } from "../lib/audio";
import { centsBetween, detectPitch, median, midiToFreq, NOTE_NAMES_RU, noteOf, parseNote } from "../lib/pitch";

const T = {
  ru: {
    start: "Включить микрофон",
    stop: "Выключить",
    instrument: "Инструмент",
    names: { chromatic: "Хроматический", guitar: "Гитара", bass: "Бас-гитара", ukulele: "Укулеле", violin: "Скрипка", balalaika: "Балалайка", dombra: "Домбра" } as Record<InstrumentId, string>,
    a4: "Ля первой октавы (A4)",
    listen: "Сыграйте ноту или открытую струну",
    flat: "Ниже — подтяните",
    sharp: "Выше — ослабьте",
    inTune: "Точно",
    ref: "Эталонный тон",
    string: "Струна",
    errors: {
      denied: "Доступ к микрофону запрещён. Разрешите его в настройках сайта и попробуйте снова.",
      notfound: "Микрофон не найден.",
      busy: "Микрофон занят другой программой.",
      insecure: "Микрофон доступен только на защищённой странице (HTTPS).",
      unsupported: "Браузер не поддерживает доступ к микрофону.",
      other: "Не удалось включить микрофон.",
    },
    privacy: "Звук анализируется прямо в браузере и никуда не передаётся и не записывается.",
  },
  en: {
    start: "Turn on microphone",
    stop: "Turn off",
    instrument: "Instrument",
    names: { chromatic: "Chromatic", guitar: "Guitar", bass: "Bass guitar", ukulele: "Ukulele", violin: "Violin", balalaika: "Balalaika", dombra: "Dombra" } as Record<InstrumentId, string>,
    a4: "Concert A (A4)",
    listen: "Play a note or an open string",
    flat: "Flat — tune up",
    sharp: "Sharp — tune down",
    inTune: "In tune",
    ref: "Reference tone",
    string: "String",
    errors: {
      denied: "Microphone access was denied. Allow it in the site settings and try again.",
      notfound: "No microphone found.",
      busy: "The microphone is used by another app.",
      insecure: "The microphone is only available on a secure (HTTPS) page.",
      unsupported: "This browser doesn't support microphone access.",
      other: "Could not turn on the microphone.",
    },
    privacy: "Sound is analysed right in the browser and is never sent or recorded.",
  },
} as const;

interface Reading {
  freq: number;
  name: string;
  octave: number;
  midi: number;
  cents: number;
}

export default function Tuner({ locale, instrument: inst0 = "chromatic" }: { locale: Locale; instrument?: InstrumentId }) {
  const t = T[locale];
  const id = useId();
  const [instrument, setInstrument] = useState<InstrumentId>(inst0);
  const [a4, setA4] = useState(440);
  const [on, setOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const live = useRef<{ stream: MediaStream; src: MediaStreamAudioSourceNode; an: AnalyserNode; raf: number } | null>(null);
  const cfg = useRef({ instrument, a4 });
  useEffect(() => {
    cfg.current = { instrument, a4 };
  }, [instrument, a4]);

  const stop = () => {
    const l = live.current;
    live.current = null;
    setOn(false);
    if (!l) return;
    cancelAnimationFrame(l.raf);
    l.src.disconnect();
    stopStream(l.stream);
  };
  useEffect(() => () => stop(), []);

  async function start() {
    setError(null);
    try {
      const ctx = await resumeAudio();
      const stream = await openMicrophone({ raw: true });
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 4096;
      src.connect(an);
      const buf = new Float32Array(an.fftSize);
      const history: number[] = [];
      let last = 0;
      let lastHeard = 0;
      const l = { stream, src, an, raf: 0 };
      live.current = l;
      setOn(true);
      const loop = (now: number) => {
        l.raf = requestAnimationFrame(loop);
        if (now - last < 66) return; // ~15 readings per second
        last = now;
        an.getFloatTimeDomainData(buf);
        const { instrument: ins, a4: ref } = cfg.current;
        const [lo, hi] = INSTRUMENTS[ins].range;
        // Low instruments: decimate by 2 to keep the autocorrelation cheap.
        let data: Float32Array = buf;
        let sr = ctx.sampleRate;
        if (lo < 60) {
          data = new Float32Array(buf.length / 2);
          for (let i = 0; i < data.length; i++) data[i] = (buf[2 * i] + buf[2 * i + 1]) / 2;
          sr /= 2;
        } else {
          data = buf.subarray(buf.length - 2048);
        }
        const p = detectPitch(data, sr, lo, hi);
        if (p) {
          history.push(p.freq);
          if (history.length > 5) history.shift();
          const f = median(history);
          const n = noteOf(f, ref);
          lastHeard = now;
          setReading({ freq: f, name: n.name, octave: n.octave, midi: n.midi, cents: n.cents });
        } else if (now - lastHeard > 1200) {
          history.length = 0;
          setReading(null);
        }
      };
      l.raf = requestAnimationFrame(loop);
    } catch (e) {
      stop();
      setError(t.errors[mediaErrorKind(e)]);
    }
  }

  async function reference(note: string) {
    const midi = parseNote(note);
    if (midi === null) return;
    const ctx = await resumeAudio().catch(() => null);
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = midiToFreq(midi, a4);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.3, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2.05);
  }

  const strings = INSTRUMENTS[instrument].strings;
  // Nearest string of the chosen instrument (by cents) — tells which peg to turn.
  const target = reading && strings.length ? strings.map((s) => ({ s, f: midiToFreq(parseNote(s)!, a4) })).reduce((b, x) => (Math.abs(centsBetween(reading.freq, x.f)) < Math.abs(centsBetween(reading.freq, b.f)) ? x : b)) : null;
  const cents = reading ? (target ? centsBetween(reading.freq, target.f) : reading.cents) : 0;
  const shownCents = Math.max(-50, Math.min(50, cents));
  const good = reading && Math.abs(cents) < 5;
  const noteLabel = target ? target.s : reading ? `${reading.name}${reading.octave}` : "—";
  const ru = reading ? NOTE_NAMES_RU[(((target ? parseNote(target.s)! : reading.midi) % 12) + 12) % 12] : "";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-5 p-6">
        <div className="flex flex-col items-center">
          <span className={cn("tabular text-7xl font-bold tracking-tight", good ? "text-ok" : "text-fg")}>{on ? noteLabel : "—"}</span>
          <span className="h-5 text-sm text-fg-3">{on && reading ? `${locale === "ru" ? `${ru} · ` : ""}${formatNumber(locale, reading.freq, { maximumFractionDigits: 1 })} Hz` : ""}</span>
        </div>
        <div className="w-full max-w-md" aria-hidden>
          <div className="relative h-10 rounded-[10px] bg-surface-2">
            <div className="absolute inset-y-1 left-1/2 w-0.5 -translate-x-1/2 bg-ok" />
            {[-40, -30, -20, -10, 10, 20, 30, 40].map((c) => (
              <div key={c} className="absolute bottom-1 h-2 w-px bg-line-strong" style={{ left: `${50 + c}%` }} />
            ))}
            {on && reading && (
              <div
                className={cn("absolute inset-y-0 w-1.5 -translate-x-1/2 rounded-full transition-[left] duration-100", good ? "bg-ok" : "bg-accent")}
                style={{ left: `${50 + shownCents}%` }}
              />
            )}
          </div>
          <div className="mt-1 flex justify-between text-[12px] text-fg-3">
            <span>−50 ¢</span>
            <span>0</span>
            <span>+50 ¢</span>
          </div>
        </div>
        <p className={cn("h-6 text-base font-medium", good ? "text-ok" : "text-fg-2")}>
          {!on ? "" : !reading ? t.listen : good ? t.inTune : `${cents < 0 ? t.flat : t.sharp} (${cents > 0 ? "+" : "−"}${formatNumber(locale, Math.abs(Math.round(cents)))} ¢)`}
        </p>
        <Button variant={on ? "outline" : "primary"} size="lg" onClick={() => (on ? stop() : start())} className="min-w-52">
          {on ? <MicOff aria-hidden /> : <Mic aria-hidden />}
          {on ? t.stop : t.start}
        </Button>
        {strings.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t.ref}>
            {strings.map((s, i) => (
              <button
                key={`${s}-${i}`}
                type="button"
                onClick={() => reference(s)}
                title={`${t.ref}: ${s}`}
                className={cn("chip tabular", target?.s === s && on && reading && "border-accent! text-accent")}
              >
                <Volume2 className="size-3.5" aria-hidden />
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-end justify-center gap-3 border-t border-line pt-4">
          <Field label={t.instrument} htmlFor={`${id}-i`} className="w-48">
            <Select id={`${id}-i`} size="sm" value={instrument} onChange={(e) => setInstrument(e.target.value as InstrumentId)}>
              {(Object.keys(INSTRUMENTS) as InstrumentId[]).map((k) => (
                <option key={k} value={k}>
                  {t.names[k]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.a4} htmlFor={`${id}-a`} className="w-48">
            <Select id={`${id}-a`} size="sm" value={String(a4)} onChange={(e) => setA4(Number(e.target.value))}>
              {[430, 432, 435, 438, 440, 441, 442, 443, 444, 446].map((f) => (
                <option key={f} value={f}>
                  {f} Hz
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>
      {error && <Notice tone="err">{error}</Notice>}
      <p className="text-sm text-fg-3">{t.privacy}</p>
    </div>
  );
}
