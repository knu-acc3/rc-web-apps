import type { Locale } from "@/i18n/config";
import type { Block, QA, VariantDef } from "@/registry/types";
import { AUDIO_TARGETS, type Target } from "../engine/spec";
import { FORMATS } from "./formats";
import { AUDIO_PAIRS, VIDEO_PAIRS, type Pair } from "./pairs";

const pairSlug = (p: Pair) => `${p.from}-to-${p.to}`;

/** Targets that are encoded by the ffmpeg module (no WebCodecs encoder in browsers). */
const FFMPEG_TARGETS = new Set(["mp3", "flac", "ogg"]);

function qualityAnswer(p: Pair, locale: Locale): QA {
  const A = FORMATS[p.from].label;
  const B = FORMATS[p.to].label;
  const ru = locale === "ru";
  const q = ru ? `Теряется ли качество при конвертации ${A} в ${B}?` : `Is quality lost converting ${A} to ${B}?`;
  let a: string;
  if (p.to === "gif")
    a = ru
      ? "Да, GIF ограничен 256 цветами на кадр, поэтому плавные градиенты и лица передаются с потерей оттенков. Палитра подбирается по кадрам, чтобы это было минимально заметно."
      : "Yes: GIF is limited to 256 colours per frame, so smooth gradients and skin tones lose shades. The palette is built from the frames to keep this as unnoticeable as possible.";
  else if (p.mode === "copy")
    a = ru
      ? `Нет. Видео и звук копируются в контейнер ${B} без перекодирования — картинка и звук остаются бит в бит такими же, как в ${A}.`
      : `No. Video and audio are copied into the ${B} container without re-encoding — picture and sound stay bit-for-bit identical to the ${A}.`;
  else if (p.mode === "mixed")
    a = ru
      ? `Если кодеки внутри ${A} подходят для ${B}, потоки копируются без потерь. Иначе видео перекодируется с высоким качеством — на глаз разница обычно незаметна.`
      : `If the codecs inside the ${A} fit ${B}, the streams are copied losslessly. Otherwise the video is re-encoded at high quality — usually indistinguishable to the eye.`;
  else if (p.kind === "audio" && (p.to === "wav" || p.to === "flac"))
    a = ru
      ? `Нет: ${B} — формат без потерь, он сохраняет звук ровно таким, каким его декодировали из ${A}.`
      : `No: ${B} is lossless, so it keeps the audio exactly as decoded from the ${A}.`;
  else
    a = ru
      ? `${B} сжимает с потерями, поэтому небольшая потеря неизбежна, как при любом таком сжатии. При высоком битрейте её практически не слышно и не видно.`
      : `${B} is a lossy format, so a small loss is unavoidable, as with any lossy compression. At a high bitrate it is practically inaudible and invisible.`;
  return { q, a };
}

function engineAnswer(p: Pair, locale: Locale): QA {
  const src = FORMATS[p.from];
  const ru = locale === "ru";
  const needs = src.engine === "ffmpeg" || FFMPEG_TARGETS.has(p.to);
  const q = ru ? "Нужно ли что-то устанавливать?" : "Do I need to install anything?";
  const a = needs
    ? ru
      ? `Нет. ${src.engine === "ffmpeg" ? `Браузер не читает ${src.label} сам` : `Кодировщика ${FORMATS[p.to].label} в браузерах нет`}, поэтому на странице запускается модуль ffmpeg: при первой конвертации он загружается с этого сайта (до 31 МБ) и потом берётся из кэша. Файл при этом никуда не отправляется.`
      : `No. ${src.engine === "ffmpeg" ? `Browsers can't read ${src.label} on their own` : `Browsers have no ${FORMATS[p.to].label} encoder`}, so the page runs the ffmpeg module: it's downloaded from this site on first use (up to 31 MB) and cached afterwards. Your file isn't sent anywhere.`
    : ru
      ? "Нет. Конвертацию выполняет встроенный в браузер кодек (WebCodecs) с аппаратным ускорением. Файл не покидает ваше устройство."
      : "No. The browser's built-in codecs (WebCodecs) do the conversion with hardware acceleration. The file never leaves your device.";
  return { q, a };
}

function factsTable(p: Pair, locale: Locale): Block {
  const A = FORMATS[p.from];
  const B = FORMATS[p.to];
  const ru = locale === "ru";
  const rows: [string, (f: typeof A) => string][] = [
    [ru ? "Полное название" : "Full name", (f) => f.full[locale]],
    [ru ? "Кто и когда создал" : "Created by", (f) => f.origin[locale]],
    [ru ? "Что внутри" : "What's inside", (f) => f.codecs[locale]],
    [ru ? "Где встречается" : "Typical use", (f) => f.use[locale]],
    [ru ? "Воспроизведение в браузерах" : "Browser playback", (f) => f.browsers[locale]],
    [ru ? "Чем читает этот сайт" : "How this site reads it", (f) => (f.engine === "ffmpeg" ? (ru ? "модуль ffmpeg" : "ffmpeg module") : ru ? "сам браузер" : "the browser itself")],
  ];
  return {
    type: "table",
    title: ru ? `${A.label} и ${B.label}: сравнение форматов` : `${A.label} vs ${B.label}: format comparison`,
    head: ["", A.label, B.label],
    rows: rows.map(([k, fn]) => [k, fn(A), fn(B)]),
  };
}

function toVariant(p: Pair, targets: Target[]): VariantDef {
  const A = FORMATS[p.from];
  const B = FORMATS[p.to];
  return {
    slug: pairSlug(p),
    name: { ru: `${A.label} → ${B.label}`, en: `${A.label} → ${B.label}` },
    title: p.title,
    h1: p.h1,
    description: p.description,
    lead: p.lead,
    props: { to: p.to, from: p.from, targets },
    keywords: {
      ru: [`${p.from} в ${p.to}`, `конвертировать ${p.from} в ${p.to}`, `${A.label} ${B.label}`, `перевести ${p.from} в ${p.to}`],
      en: [`${p.from} to ${p.to}`, `convert ${p.from} to ${p.to}`, `${A.label} ${B.label} converter`],
    },
    blocks: (locale) => {
      const ru = locale === "ru";
      return [
        { type: "text", title: ru ? `Как работает конвертация ${A.label} в ${B.label}` : `How ${A.label} to ${B.label} conversion works`, paragraphs: [p.note[locale]] },
        factsTable(p, locale),
      ];
    },
    faq: {
      ru: [{ q: p.faq.q.ru, a: p.faq.a.ru }, qualityAnswer(p, "ru"), engineAnswer(p, "ru")],
      en: [{ q: p.faq.q.en, a: p.faq.a.en }, qualityAnswer(p, "en"), engineAnswer(p, "en")],
    },
  };
}

export const VIDEO_CONVERT_TARGETS: Target[] = ["mp4", "webm", "mov", "mkv", "gif"];
export const AUDIO_CONVERT_TARGETS: Target[] = [...AUDIO_TARGETS];

export function videoPairVariants(): VariantDef[] {
  return VIDEO_PAIRS.map((p) => toVariant(p, VIDEO_CONVERT_TARGETS));
}

export function audioPairVariants(): VariantDef[] {
  return AUDIO_PAIRS.map((p) => toVariant(p, AUDIO_CONVERT_TARGETS));
}
