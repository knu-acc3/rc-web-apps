"use client";

import { useId } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Checkbox, Field, Select } from "@/ui/field";
import type { AudioSpec, GifSpec, Target } from "../../shared/spec";

export const FORMAT_LABEL: Record<Target, string> = {
  mp4: "MP4",
  webm: "WebM",
  mov: "MOV",
  mkv: "MKV",
  gif: "GIF",
  mp3: "MP3",
  wav: "WAV",
  m4a: "M4A (AAC)",
  aac: "AAC",
  ogg: "OGG (Vorbis)",
  opus: "Opus",
  flac: "FLAC",
};

const T = {
  ru: {
    bitrate: "Битрейт",
    sampleRate: "Частота дискретизации",
    channels: "Каналы",
    keep: "Как в исходнике",
    mono: "Моно",
    stereo: "Стерео",
    kbps: "кбит/с",
    hz: "Гц",
    fps: "Кадров в секунду",
    width: "Ширина",
    px: "пикс.",
    palette: "Палитра",
    paletteGlobal: "Общая на весь GIF (меньше файл)",
    paletteFrame: "Своя для каждого кадра (точнее цвета)",
    loop: "Повторять по кругу",
    lossless: "без потерь",
  },
  en: {
    bitrate: "Bitrate",
    sampleRate: "Sample rate",
    channels: "Channels",
    keep: "Same as source",
    mono: "Mono",
    stereo: "Stereo",
    kbps: "kbit/s",
    hz: "Hz",
    fps: "Frames per second",
    width: "Width",
    px: "px",
    palette: "Palette",
    paletteGlobal: "One for the whole GIF (smaller file)",
    paletteFrame: "Per frame (more accurate colours)",
    loop: "Loop forever",
    lossless: "lossless",
  },
} as const;

const LOSSLESS: Target[] = ["wav", "flac"];

/** Bitrate / sample rate / channels for audio outputs. */
export function AudioOptions({ locale, target, value, onChange, disabled }: { locale: Locale; target: Target; value: AudioSpec; onChange: (v: AudioSpec) => void; disabled?: boolean }) {
  const t = T[locale];
  const id = useId();
  const lossless = LOSSLESS.includes(target);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label={t.bitrate} htmlFor={`${id}-b`}>
        <Select id={`${id}-b`} value={lossless ? "0" : String(value.bitrate ?? 192000)} disabled={disabled || lossless} onChange={(e) => onChange({ ...value, bitrate: Number(e.target.value) || undefined })}>
          {lossless ? (
            <option value="0">{t.lossless}</option>
          ) : (
            [64, 96, 128, 160, 192, 256, 320].filter((k) => target !== "opus" || k <= 256).map((k) => (
              <option key={k} value={k * 1000}>
                {k} {t.kbps}
              </option>
            ))
          )}
        </Select>
      </Field>
      <Field label={t.sampleRate} htmlFor={`${id}-r`}>
        <Select id={`${id}-r`} value={String(value.sampleRate ?? 0)} disabled={disabled || target === "opus"} onChange={(e) => onChange({ ...value, sampleRate: Number(e.target.value) || undefined })}>
          <option value="0">{target === "opus" ? `${formatNumber(locale, 48000)} ${t.hz}` : t.keep}</option>
          {target !== "opus" &&
            [22050, 32000, 44100, 48000].map((r) => (
              <option key={r} value={r}>
                {formatNumber(locale, r)} {t.hz}
              </option>
            ))}
        </Select>
      </Field>
      <Field label={t.channels} htmlFor={`${id}-c`}>
        <Select id={`${id}-c`} value={String(value.channels ?? 0)} disabled={disabled} onChange={(e) => onChange({ ...value, channels: (Number(e.target.value) || undefined) as 1 | 2 | undefined })}>
          <option value="0">{t.keep}</option>
          <option value="1">{t.mono}</option>
          <option value="2">{t.stereo}</option>
        </Select>
      </Field>
    </div>
  );
}

export const GIF_DEFAULT: GifSpec = { fps: 12, width: 480, palette: "global", loop: true };

/** Frame rate / width / palette / loop for GIF output. */
export function GifOptions({ locale, value, onChange, disabled }: { locale: Locale; value: GifSpec; onChange: (v: GifSpec) => void; disabled?: boolean }) {
  const t = T[locale];
  const id = useId();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label={t.fps} htmlFor={`${id}-f`}>
        <Select id={`${id}-f`} value={String(value.fps)} disabled={disabled} onChange={(e) => onChange({ ...value, fps: Number(e.target.value) })}>
          {[5, 8, 10, 12, 15, 20, 25, 30].map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t.width} htmlFor={`${id}-w`}>
        <Select id={`${id}-w`} value={String(value.width)} disabled={disabled} onChange={(e) => onChange({ ...value, width: Number(e.target.value) })}>
          {[240, 320, 400, 480, 560, 640, 800, 960].map((w) => (
            <option key={w} value={w}>
              {w} {t.px}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t.palette} htmlFor={`${id}-p`}>
        <Select id={`${id}-p`} value={value.palette} disabled={disabled} onChange={(e) => onChange({ ...value, palette: e.target.value as GifSpec["palette"] })}>
          <option value="global">{t.paletteGlobal}</option>
          <option value="frame">{t.paletteFrame}</option>
        </Select>
      </Field>
      <Checkbox label={t.loop} checked={value.loop} disabled={disabled} onChange={(e) => onChange({ ...value, loop: e.target.checked })} className="sm:col-span-3" />
    </div>
  );
}
