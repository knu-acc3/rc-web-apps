"use client";

import { Check } from "lucide-react";
import { useId, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Field, Select, Slider, Switch } from "@/ui/field";
import { ScrollRow } from "@/ui/scroll-row";
import { Segmented } from "@/ui/segmented";
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
    paletteGlobal: "Общая",
    paletteFrame: "Для каждого кадра",
    paletteGlobalHint: "Одна палитра на весь GIF — файл меньше",
    paletteFrameHint: "Своя палитра для каждого кадра — точнее цвета",
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
    paletteGlobal: "Shared",
    paletteFrame: "Per frame",
    paletteGlobalHint: "One palette for the whole GIF — smaller file",
    paletteFrameHint: "A palette per frame — more accurate colours",
    loop: "Loop forever",
    lossless: "lossless",
  },
} as const;

const LOSSLESS: Target[] = ["wav", "flac"];

/** A labelled setting (label above, control below) for controls that are not form fields: Segmented, chips. */
export function Setting({ label, children, className, aside }: { label: ReactNode; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <span className="text-sm font-medium text-fg-2">{label}</span>
        {aside}
      </div>
      {children}
    </div>
  );
}

/**
 * A slider over a fixed list of values (bitrates, frame rates, widths): the label on the left, the chosen value
 * written on the right, the slider under them.
 */
export function StepSlider<V extends number>({
  label,
  value,
  steps,
  format,
  onChange,
  disabled,
  className,
}: {
  label: string;
  value: V;
  steps: readonly V[];
  format: (v: V) => string;
  onChange: (v: V) => void;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  // The nearest step when the value is not one of them (an old saved value, a page preset).
  const i = steps.reduce((b, x, k) => (Math.abs(x - value) < Math.abs(steps[b] - value) ? k : b), 0);
  return (
    <div className={cn("flex min-w-0 flex-col", className, disabled && "opacity-60")}>
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-fg-2">
          {label}
        </label>
        <output htmlFor={id} className="tabular text-lg font-semibold text-fg">
          {format(value)}
        </output>
      </div>
      <Slider id={id} min={0} max={steps.length - 1} step={1} value={i} disabled={disabled} aria-valuetext={format(steps[i])} format={(x) => format(steps[x])} onChange={(e) => onChange(steps[Number(e.target.value)])} />
    </div>
  );
}

/**
 * One choice out of many (6+ speeds, formats, time signatures) as radio chips in a row that scrolls sideways when
 * it doesn't fit (never a wrapping wall). ←/→ move the choice.
 */
export function ChoiceChips<V extends string>({
  label,
  value,
  onChange,
  options,
  size = "md",
  className,
}: {
  label: string;
  value: V;
  onChange: (v: V) => void;
  options: readonly { value: V; label: ReactNode; title?: string }[];
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <ScrollRow role="radiogroup" label={label} className={className}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            title={o.title}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
              if (!dir) return;
              e.preventDefault();
              const j = (i + dir + options.length) % options.length;
              onChange(options[j].value);
              (e.currentTarget.parentElement?.children[j] as HTMLElement | undefined)?.focus();
            }}
            className={cn("chip tabular shrink-0 font-semibold!", size === "lg" ? "min-h-11! px-4! text-[0.9375rem]!" : "min-h-10! px-3.5!")}
          >
            {on && <Check className="size-4" strokeWidth={2.75} aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </ScrollRow>
  );
}

const BITRATES = [64, 96, 128, 160, 192, 256, 320].map((k) => k * 1000);

/** Bitrate / sample rate / channels for audio outputs. */
export function AudioOptions({ locale, target, value, onChange, disabled }: { locale: Locale; target: Target; value: AudioSpec; onChange: (v: AudioSpec) => void; disabled?: boolean }) {
  const t = T[locale];
  const id = useId();
  const lossless = LOSSLESS.includes(target);
  const rates = BITRATES.filter((b) => target !== "opus" || b <= 256000);
  return (
    <div className="flex flex-col gap-5">
      {lossless ? (
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium text-fg-2">{t.bitrate}</span>
          <span className="text-lg font-semibold text-fg">{t.lossless}</span>
        </div>
      ) : (
        <StepSlider label={t.bitrate} value={Math.min(value.bitrate ?? 192000, rates[rates.length - 1])} steps={rates} format={(b) => `${b / 1000} ${t.kbps}`} onChange={(b) => onChange({ ...value, bitrate: b })} disabled={disabled} />
      )}
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
      <Setting label={t.channels}>
        <Segmented
          label={t.channels}
          size="sm"
          value={String(value.channels ?? 0) as "0" | "1" | "2"}
          onChange={(c) => !disabled && onChange({ ...value, channels: (Number(c) || undefined) as 1 | 2 | undefined })}
          options={[
            { value: "0", label: t.keep },
            { value: "1", label: t.mono },
            { value: "2", label: t.stereo },
          ]}
        />
      </Setting>
    </div>
  );
}

export const GIF_DEFAULT: GifSpec = { fps: 12, width: 480, palette: "global", loop: true };
const GIF_FPS = [5, 8, 10, 12, 15, 20, 25, 30];
const GIF_WIDTHS = [240, 320, 400, 480, 560, 640, 800, 960];

/** Frame rate / width / palette / loop for GIF output. */
export function GifOptions({ locale, value, onChange, disabled }: { locale: Locale; value: GifSpec; onChange: (v: GifSpec) => void; disabled?: boolean }) {
  const t = T[locale];
  return (
    <div className="flex flex-col gap-5">
      <StepSlider label={t.fps} value={value.fps} steps={GIF_FPS} format={(f) => String(f)} onChange={(fps) => onChange({ ...value, fps })} disabled={disabled} />
      <StepSlider label={t.width} value={value.width} steps={GIF_WIDTHS} format={(w) => `${w} ${t.px}`} onChange={(width) => onChange({ ...value, width })} disabled={disabled} />
      <Setting label={t.palette}>
        <Segmented
          label={t.palette}
          size="sm"
          value={value.palette}
          onChange={(palette) => !disabled && onChange({ ...value, palette })}
          options={[
            { value: "global", label: t.paletteGlobal, title: t.paletteGlobalHint },
            { value: "frame", label: t.paletteFrame, title: t.paletteFrameHint },
          ]}
        />
      </Setting>
      <Switch label={t.loop} checked={value.loop} disabled={disabled} onChange={(e) => onChange({ ...value, loop: e.target.checked })} />
    </div>
  );
}
