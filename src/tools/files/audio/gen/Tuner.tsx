"use client";

import { Mic, MicOff, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Notice, Panel } from "@/ui/panel";
import { Fab } from "@/tools/files/video/ui/Fab";
import { ChoiceChips, Setting, StepSlider } from "@/tools/files/video/ui/options";
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
    ref: "Эталонный тон струны",
    string: "Струна",
    errors: {
      denied: "Доступ к микрофону запрещён. Разрешите его в настройках сайта и попробуйте снова.",
      notfound: "Микрофон не найден.",
      busy: "Микрофон занят другой программой.",
      insecure: "Микрофон доступен только на защищённой странице (HTTPS).",
      unsupported: "Браузер не поддерживает доступ к микрофону.",
      other: "Не удалось включить микрофон.",
    },
    privacy: "Звук анализируется в браузере и никуда не передаётся.",
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
    ref: "String reference tone",
    string: "String",
    errors: {
      denied: "Microphone access was denied. Allow it in the site settings and try again.",
      notfound: "No microphone found.",
      busy: "The microphone is used by another app.",
      insecure: "The microphone is only available on a secure (HTTPS) page.",
      unsupported: "This browser doesn't support microphone access.",
      other: "Could not turn on the microphone.",
    },
    privacy: "Sound is analysed in the browser and never sent anywhere.",
  },
} as const;

const A4 = [430, 432, 435, 438, 440, 441, 442, 443, 444, 446];

interface Reading {
  freq: number;
  name: string;
  octave: number;
  midi: number;
  cents: number;
}

function TunerInner({ locale, instrument: inst0 = "chromatic" }: { locale: Locale; instrument?: InstrumentId }) {
  const t = T[locale];
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
    <div className="flex flex-col gap-3">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
        <Panel className="flex min-w-0 flex-col items-center gap-5 p-4 sm:p-6">
          <div className="flex flex-col items-center">
            <span className={cn("tabular text-7xl font-bold leading-none tracking-tight transition-colors sm:text-8xl", good ? "text-ok" : on && reading ? "text-fg" : "text-fg-3")}>{on ? noteLabel : "—"}</span>
            <span className="mt-2 h-5 text-sm text-fg-3">{on && reading ? `${locale === "ru" ? `${ru} · ` : ""}${formatNumber(locale, reading.freq, { maximumFractionDigits: 1 })} Hz` : ""}</span>
          </div>
          <div className="w-full max-w-xl" aria-hidden>
            <div className={cn("relative h-12 rounded-[1rem] transition-colors", good ? "bg-ok-soft" : "bg-surface-2")}>
              <div className="absolute inset-y-1.5 left-1/2 w-0.5 -translate-x-1/2 bg-ok" />
              {[-40, -30, -20, -10, 10, 20, 30, 40].map((c) => (
                <div key={c} className="absolute bottom-1.5 h-2.5 w-px bg-line-strong" style={{ left: `${50 + c}%` }} />
              ))}
              {on && reading && (
                <div
                  className={cn("absolute inset-y-0 w-2 -translate-x-1/2 rounded-full shadow-elev-1 transition-[left] duration-100", good ? "bg-ok" : "bg-accent")}
                  style={{ left: `${50 + shownCents}%` }}
                />
              )}
            </div>
            <div className="mt-1 flex justify-between text-xs text-fg-3">
              <span>−50 ¢</span>
              <span>0</span>
              <span>+50 ¢</span>
            </div>
          </div>
          <p className={cn("h-6 text-center text-base font-semibold", good ? "text-ok" : "text-fg-2")} aria-live="polite">
            {!on ? "" : !reading ? t.listen : good ? t.inTune : `${cents < 0 ? t.flat : t.sharp} (${cents > 0 ? "+" : "−"}${formatNumber(locale, Math.abs(Math.round(cents)))} ¢)`}
          </p>
          <Fab label={on ? t.stop : t.start} icon={on ? <MicOff aria-hidden /> : <Mic aria-hidden />} onClick={() => (on ? stop() : start())} active={on} />
        </Panel>
        <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
          <Setting label={t.instrument}>
            <ChoiceChips label={t.instrument} value={instrument} onChange={setInstrument} options={(Object.keys(INSTRUMENTS) as InstrumentId[]).map((k) => ({ value: k, label: t.names[k] }))} />
          </Setting>
          {strings.length > 0 && (
            <Setting label={t.ref}>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t.ref}>
                {strings.map((s, i) => (
                  <button key={`${s}-${i}`} type="button" onClick={() => reference(s)} title={`${t.ref}: ${s}`} className={cn("chip tabular min-h-10! font-semibold!", target?.s === s && on && reading && "is-on")}>
                    <Volume2 className="size-4" aria-hidden />
                    {s}
                  </button>
                ))}
              </div>
            </Setting>
          )}
          <StepSlider label={t.a4} value={a4} steps={A4} format={(f) => `${f} Hz`} onChange={setA4} />
        </Panel>
      </div>
      {error && <Notice tone="err">{error}</Notice>}
      <p className="text-sm text-fg-3">{t.privacy}</p>
    </div>
  );
}

/** Remount when the page preset changes (client-side navigation between variant pages). */
export default function Tuner(props: { locale: Locale; instrument?: InstrumentId }) {
  return <TunerInner key={props.instrument ?? ""} {...props} />;
}
