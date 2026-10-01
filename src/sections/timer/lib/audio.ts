/**
 * Generated sounds (no audio files). Every note is scheduled on the AudioContext
 * clock (osc.start(t)), not with setTimeout, so rhythms stay exact and a finish
 * sound scheduled in advance plays on time even when the tab is in the background.
 * The context is created/resumed on a user gesture (Start button) to satisfy
 * browser autoplay rules.
 */

export type SoundId = "beep" | "bell" | "digital" | "soft";
export const SOUND_IDS: SoundId[] = ["beep", "bell", "digital", "soft"];

let ctx: AudioContext | null = null;

/** Create or resume the shared context. Call from a click/keydown handler. */
export function unlockAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export interface Scheduled {
  /** Audio-clock time of the first note. */
  at: number;
  /** Audio-clock time when the pattern ends. */
  end: number;
  stop(): void;
}

interface Note {
  t: number;
  dur: number;
  freq: number;
  type?: OscillatorType;
  gain?: number;
  /** exponential decay instead of a flat tone */
  decay?: boolean;
  /** extra partials (multiples of freq) for bell-like timbres */
  partials?: number[];
}

/** One repetition of each sound, times in seconds from the start. */
function pattern(id: SoundId): { notes: Note[]; length: number } {
  const notes: Note[] = [];
  switch (id) {
    case "beep": {
      // 3 groups of 4 short beeps
      for (let g = 0; g < 3; g++) for (let i = 0; i < 4; i++) notes.push({ t: g * 1.1 + i * 0.16, dur: 0.09, freq: 880, type: "square", gain: 0.25 });
      return { notes, length: 3.4 };
    }
    case "digital": {
      for (let i = 0; i < 8; i++) notes.push({ t: i * 0.25, dur: 0.12, freq: i % 2 ? 2093 : 2637, type: "square", gain: 0.18 });
      return { notes, length: 2.4 };
    }
    case "bell": {
      for (let i = 0; i < 3; i++) notes.push({ t: i * 1.2, dur: 1.15, freq: 659.25, type: "sine", gain: 0.5, decay: true, partials: [2, 3.01, 4.2] });
      return { notes, length: 3.6 };
    }
    case "soft":
    default: {
      const seq = [523.25, 659.25, 783.99];
      seq.forEach((f, i) => notes.push({ t: i * 0.22, dur: 0.5, freq: f, type: "sine", gain: 0.35, decay: true }));
      return { notes, length: 1.6 };
    }
  }
}

/**
 * Schedule a sound `delaySec` from now (0 = immediately), repeated `repeats` times.
 * Returns a handle that can cancel the sound even before it starts.
 */
export function schedule(id: SoundId, delaySec = 0, repeats = 1, volume = 0.8): Scheduled | null {
  const c = unlockAudio();
  if (!c) return null;
  const { notes, length } = pattern(id);
  const master = c.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume));
  master.connect(c.destination);
  const start = c.currentTime + Math.max(0, delaySec) + 0.02;
  const sources: OscillatorNode[] = [];
  for (let r = 0; r < repeats; r++) {
    for (const n of notes) {
      const t0 = start + r * length + n.t;
      for (const mult of [1, ...(n.partials ?? [])]) {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = n.type ?? "sine";
        osc.frequency.value = n.freq * mult;
        const peak = (n.gain ?? 0.3) / (mult === 1 ? 1 : mult * 1.8);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
        if (n.decay) g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);
        else {
          g.gain.setValueAtTime(peak, t0 + n.dur - 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);
        }
        osc.connect(g);
        g.connect(master);
        osc.start(t0);
        osc.stop(t0 + n.dur + 0.02);
        sources.push(osc);
      }
    }
  }
  const end = start + repeats * length;
  let stopped = false;
  return {
    at: start,
    end,
    stop() {
      if (stopped) return;
      stopped = true;
      const now = c.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.03);
      for (const s of sources) {
        try {
          s.stop(now + 0.04);
        } catch {
          // already stopped
        }
      }
      setTimeout(() => master.disconnect(), 200);
    },
  };
}

/** Short tick used for countdowns (interval timer, last seconds). */
export function scheduleTick(delaySec: number, high = false): Scheduled | null {
  const c = unlockAudio();
  if (!c) return null;
  const t0 = c.currentTime + Math.max(0, delaySec);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.value = high ? 1318.5 : 880;
  const dur = high ? 0.5 : 0.12;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
  let stopped = false;
  return {
    at: t0,
    end: t0 + dur,
    stop() {
      if (stopped) return;
      stopped = true;
      try {
        osc.stop();
      } catch {
        // ignore
      }
    },
  };
}

/** Did a scheduled sound actually start (context running and its time passed)? */
export function hasPlayed(s: Scheduled | null): boolean {
  return !!s && !!ctx && ctx.state === "running" && ctx.currentTime >= s.at;
}
