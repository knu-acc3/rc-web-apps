/**
 * Morse code: ITU Latin letters, digits and punctuation, the Russian Cyrillic table,
 * prosigns, audio timing (PARIS standard + Farnsworth) and WAV synthesis.
 *
 * Kazakh: the nine Kazakh-specific letters have no standardized Morse codes, so they are
 * sent with the codes of the closest Russian letters (Ә→А, Ғ→Г, Қ→К, Ң→Н, Ө→О, Ұ→У, Ү→У,
 * Һ→Х, І→И) and reported as substitutions. Decoding can't restore them.
 */
import type { CodecError, CodecResult, Opts } from "./types";

export const LATIN_MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--",
  N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
};

export const DIGIT_MORSE: Record<string, string> = {
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
};

export const PUNCT_MORSE: Record<string, string> = {
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...",
  ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", _: "..--.-", '"': ".-..-.", $: "...-..-", "@": ".--.-.",
};

export const CYRILLIC_MORSE: Record<string, string> = {
  А: ".-", Б: "-...", В: ".--", Г: "--.", Д: "-..", Е: ".", Ж: "...-", З: "--..", И: "..", Й: ".---", К: "-.-", Л: ".-..", М: "--",
  Н: "-.", О: "---", П: ".--.", Р: ".-.", С: "...", Т: "-", У: "..-", Ф: "..-.", Х: "....", Ц: "-.-.", Ч: "---.", Ш: "----",
  Щ: "--.-", Ъ: "--.--", Ы: "-.--", Ь: "-..-", Э: "..-..", Ю: "..--", Я: ".-.-",
};

/** Kazakh-specific letters → closest Russian letter (no standard Morse codes exist for them). */
export const KAZAKH_SUBST: Record<string, string> = { Ә: "А", Ғ: "Г", Қ: "К", Ң: "Н", Ө: "О", Ұ: "У", Ү: "У", Һ: "Х", І: "И" };

export const PROSIGNS: Record<string, string> = {
  SOS: "...---...", AR: ".-.-.", SK: "...-.-", BT: "-...-", KN: "-.--.", AS: ".-...", CT: "-.-.-", VE: "...-.", HH: "........", SN: "...-.",
};

const DECODE_LATIN = invert({ ...LATIN_MORSE, ...DIGIT_MORSE, ...PUNCT_MORSE });
const DECODE_CYR = invert({ ...CYRILLIC_MORSE, ...DIGIT_MORSE, ...PUNCT_MORSE });
const DECODE_PRO: Record<string, string> = {};
for (const [k, v] of Object.entries(PROSIGNS)) if (!(v in DECODE_LATIN) && !(v in DECODE_PRO)) DECODE_PRO[v] = `<${k}>`;

function invert(o: Record<string, string>): Record<string, string> {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) if (!(v in r)) r[v] = k;
  return r;
}

export interface MorseEncoded extends CodecResult {
  unknown: string[];
  substituted: string[];
}

/** Text → Morse. Letters separated by spaces, words by " / ". "<SOS>" sends a prosign without gaps. */
export function encodeMorse(text: string, o: Opts = {}): MorseEncoded {
  const letterSep = (o.letterSep as string) ?? " ";
  const wordSep = (o.wordSep as string) ?? " / ";
  const dot = (o.dot as string) ?? ".";
  const dash = (o.dash as string) ?? "-";
  const unknown = new Set<string>();
  const substituted = new Set<string>();
  const words: string[] = [];
  for (const word of text.trim().split(/\s+/)) {
    if (!word) continue;
    const letters: string[] = [];
    const re = /<([A-Za-z]{2,3})>|./gsu;
    let m: RegExpExecArray | null;
    while ((m = re.exec(word))) {
      if (m[1] && PROSIGNS[m[1].toUpperCase()]) {
        letters.push(PROSIGNS[m[1].toUpperCase()]);
        continue;
      }
      const ch = m[0].toUpperCase();
      const code = LATIN_MORSE[ch] ?? CYRILLIC_MORSE[ch === "Ё" ? "Е" : ch] ?? DIGIT_MORSE[ch] ?? PUNCT_MORSE[ch];
      if (code) letters.push(code);
      else if (KAZAKH_SUBST[ch]) {
        substituted.add(m[0]);
        letters.push(CYRILLIC_MORSE[KAZAKH_SUBST[ch]]);
      } else unknown.add(m[0]);
    }
    if (letters.length) words.push(letters.join(letterSep));
  }
  let out = words.join(wordSep);
  if (dot !== "." || dash !== "-") out = out.replace(/[.-]/g, (c) => (c === "." ? dot : dash));
  const notes: CodecError[] = [];
  if (substituted.size) notes.push({ code: "morse.kazakh", detail: [...substituted].join(" ") });
  if (unknown.size) notes.push({ code: "morse.unknown", detail: [...unknown].join(" ") });
  return { text: out, unknown: [...unknown], substituted: [...substituted], notes };
}

export function normalizeMorse(code: string): string {
  return code.replace(/[·•∙⋅*]/g, ".").replace(/[−–—_]/g, "-");
}

/** Morse → text. Words are split by "/", "|", a line break or 3+ spaces. */
export function decodeMorse(code: string, alphabet: "latin" | "cyrillic" = "latin"): MorseEncoded {
  const table = alphabet === "cyrillic" ? DECODE_CYR : DECODE_LATIN;
  const unknown = new Set<string>();
  const words = normalizeMorse(code)
    .trim()
    .split(/\s*[/|]\s*|\s{3,}|\n+/)
    .filter(Boolean)
    .map((w) =>
      w
        .split(/\s+/)
        .filter(Boolean)
        .map((c) => {
          if (!/^[.-]+$/.test(c)) {
            unknown.add(c);
            return "�";
          }
          const r = table[c] ?? DECODE_PRO[c];
          if (!r) unknown.add(c);
          return r ?? "�";
        })
        .join(""),
    );
  const notes: CodecError[] = unknown.size ? [{ code: "morse.badCode", detail: [...unknown].join(" ") }] : [];
  return { text: words.join(" "), unknown: [...unknown], substituted: [], notes };
}

/* ───────────── timing & audio ───────────── */

export interface Tone {
  /** start, seconds */
  t: number;
  /** duration, seconds */
  d: number;
}

/**
 * Tones for a Morse string (". - space /"). Characters are sent at `wpm` (PARIS: dot = 1.2 / wpm s);
 * with Farnsworth (`fwpm` < wpm) the gaps between characters and words are stretched so the
 * overall speed is `fwpm` (ARRL formula).
 */
export function morseTimeline(code: string, wpm: number, fwpm = wpm): { tones: Tone[]; total: number } {
  const u = 1.2 / wpm;
  let charGap = 3 * u;
  let wordGap = 7 * u;
  if (fwpm < wpm) {
    const ta = (60 * wpm - 37.2 * fwpm) / (fwpm * wpm);
    charGap = (3 * ta) / 19;
    wordGap = (7 * ta) / 19;
  }
  const tones: Tone[] = [];
  let t = 0;
  const words = normalizeMorse(code).trim().split(/\s*[/|]\s*|\s{3,}|\n+/).filter(Boolean);
  words.forEach((w, wi) => {
    const letters = w.split(/\s+/).filter(Boolean);
    letters.forEach((l, li) => {
      [...l].forEach((s, si) => {
        if (s !== "." && s !== "-") return;
        const d = s === "." ? u : 3 * u;
        tones.push({ t, d });
        t += d;
        if (si < l.length - 1) t += u;
      });
      if (li < letters.length - 1) t += charGap;
    });
    if (wi < words.length - 1) t += wordGap;
  });
  return { tones, total: t };
}

/** Render tones to a 16-bit mono PCM WAV (sine with 5 ms ramps to avoid clicks). */
export function renderWav(tones: Tone[], total: number, freq = 600, sampleRate = 22050): Uint8Array {
  const n = Math.ceil((total + 0.25) * sampleRate);
  const pcm = new Int16Array(n);
  const ramp = Math.floor(0.005 * sampleRate);
  for (const { t, d } of tones) {
    const s0 = Math.floor(t * sampleRate);
    const len = Math.floor(d * sampleRate);
    for (let i = 0; i < len && s0 + i < n; i++) {
      const env = i < ramp ? 0.5 - 0.5 * Math.cos((Math.PI * i) / ramp) : i > len - ramp ? 0.5 - 0.5 * Math.cos((Math.PI * (len - i)) / ramp) : 1;
      pcm[s0 + i] = Math.round(Math.sin((2 * Math.PI * freq * i) / sampleRate) * env * 0.6 * 32767);
    }
  }
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, n * 2, true);
  new Int16Array(buf, 44).set(pcm);
  return new Uint8Array(buf);
}
