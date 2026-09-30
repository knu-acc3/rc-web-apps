"use client";

import { Play, RotateCcw } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { useReducedMotion } from "@/sections/color/ui/hooks";
import { ANIM_PRESETS, animationCss, isIdent, presetBySlug, settingsFor, type AnimSettings } from "./lib/animation";
import { CodePanel, Stage } from "./ui/kit";

const T = {
  ru: {
    preset: "Анимация",
    name: "Имя анимации и класса",
    nameError: "Только латиница, цифры, дефис и подчёркивание; не с цифры",
    duration: "Длительность, с",
    delay: "Задержка, с",
    iterations: "Повторы",
    infinite: "Бесконечно",
    direction: "Направление",
    fill: "Заполнение (fill-mode)",
    timing: "Функция времени",
    custom: "Своя cubic-bezier()",
    steps: "Шаги steps()",
    stepsN: "Число шагов",
    jump: "Точка скачка",
    replay: "Повторить",
    reduced: "В системе включено «Уменьшить движение», поэтому превью не запускается само.",
    playAnyway: "Всё равно воспроизвести",
    demo: "Привет!",
    typing: "Печатаю этот текст...",
  },
  en: {
    preset: "Animation",
    name: "Animation and class name",
    nameError: "Latin letters, digits, hyphen and underscore only; can't start with a digit",
    duration: "Duration, s",
    delay: "Delay, s",
    iterations: "Iterations",
    infinite: "Infinite",
    direction: "Direction",
    fill: "Fill mode",
    timing: "Timing function",
    custom: "Custom cubic-bezier()",
    steps: "steps()",
    stepsN: "Number of steps",
    jump: "Jump term",
    replay: "Replay",
    reduced: "Your system asks for reduced motion, so the preview doesn't start on its own.",
    playAnyway: "Play anyway",
    demo: "Hello!",
    typing: "Typing out this text...",
  },
} as const;

const TIMINGS = ["ease", "ease-in", "ease-out", "ease-in-out", "linear"];
const JUMPS = ["jump-end", "jump-start", "jump-none", "jump-both"];

export default function AnimationGenerator({ locale, preset: preset0 = "fade-in" }: { locale: Locale; preset?: string }) {
  const t = T[locale];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reduced = useReducedMotion();
  const [slug, setSlug] = useState(presetBySlug.has(preset0) ? preset0 : "fade-in");
  const preset = presetBySlug.get(slug)!;
  const [s, setS] = useState<AnimSettings>(() => settingsFor(preset));
  const [timingMode, setTimingMode] = useState<"keyword" | "bezier" | "steps">(() => (preset.timing.startsWith("cubic") ? "bezier" : preset.timing.startsWith("steps") ? "steps" : "keyword"));
  const [bez, setBez] = useState(() => (preset.timing.match(/-?[\d.]+/g) ?? ["0.25", "0.1", "0.25", "1"]).slice(0, 4).join(", "));
  const [steps, setSteps] = useState(() => ({ n: Number(preset.timing.match(/steps\((\d+)/)?.[1] ?? 4), jump: "jump-end" }));
  const [run, setRun] = useState(0);
  const [forcePlay, setForcePlay] = useState(false);
  const set = (patch: Partial<AnimSettings>) => setS((x) => ({ ...x, ...patch }));
  const nameOk = isIdent(s.name);

  function choosePreset(next: string) {
    const p = presetBySlug.get(next)!;
    setSlug(next);
    setS(settingsFor(p));
    setTimingMode(p.timing.startsWith("cubic") ? "bezier" : p.timing.startsWith("steps") ? "steps" : "keyword");
    if (p.timing.startsWith("cubic")) setBez((p.timing.match(/-?[\d.]+/g) ?? []).join(", "));
    if (p.timing.startsWith("steps")) setSteps({ n: Number(p.timing.match(/steps\((\d+)/)?.[1] ?? 4), jump: "jump-end" });
    setRun((r) => r + 1);
  }

  const bezValid = /^\s*[01](\.\d+)?\s*,\s*-?\d*\.?\d+\s*,\s*[01](\.\d+)?\s*,\s*-?\d*\.?\d+\s*$/.test(bez) && bez.split(",").every((x, i) => i % 2 === 1 || (Number(x) >= 0 && Number(x) <= 1));
  const timing =
    timingMode === "bezier" ? (bezValid ? `cubic-bezier(${bez.split(",").map((x) => Number(x)).join(", ")})` : "ease") : timingMode === "steps" ? `steps(${Math.max(1, Math.round(steps.n))}, ${steps.jump})` : TIMINGS.includes(s.timing) ? s.timing : "ease";
  const settings: AnimSettings = { ...s, timing };
  const css = animationCss(preset, settings);

  // Preview: internal keyframes name so the page's own animations are never overridden.
  const pv = `pv-${id}`;
  const playing = !reduced || forcePlay;
  const important = reduced && forcePlay ? " !important" : "";
  const previewCss = `@keyframes ${pv} {\n${preset.keyframes}\n}\n.${pv} {\n${(preset.extra ?? []).join("\n")}\n${
    playing ? `animation: ${pv} ${settings.duration}s ${timing} ${settings.delay}s ${settings.iterations} ${settings.direction} ${settings.fill}${important};${important ? `\nanimation-duration: ${settings.duration}s !important; animation-iteration-count: ${settings.iterations} !important;` : ""}` : ""
  }\n}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-2">
          <Stage locale={locale} minHeight={300}>
            <style>{previewCss}</style>
            <div key={run} className={pv}>
              {preset.demo === "text" ? (
                <span className="block text-xl text-zinc-900">{t.typing}</span>
              ) : preset.demo === "skeleton" ? (
                <span className="block h-16 w-64 rounded-[0.625rem]" />
              ) : (
                <span className="flex size-32 items-center justify-center rounded-[1.125rem] bg-indigo-600 text-lg font-semibold text-white">{t.demo}</span>
              )}
            </div>
          </Stage>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRun((r) => r + 1)} disabled={!playing}>
              <RotateCcw aria-hidden />
              {t.replay}
            </Button>
            {reduced && !forcePlay && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setForcePlay(true);
                  setRun((r) => r + 1);
                }}
              >
                <Play aria-hidden />
                {t.playAnyway}
              </Button>
            )}
          </div>
          {reduced && !forcePlay && <Notice>{t.reduced}</Notice>}
        </div>

        <Panel className="flex flex-col gap-3 p-4">
          <Field label={t.preset} htmlFor={`${id}-p`}>
            <Select id={`${id}-p`} value={slug} onChange={(e) => choosePreset(e.target.value)}>
              {ANIM_PRESETS.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.slug}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.name} htmlFor={`${id}-n`} error={nameOk ? undefined : t.nameError}>
            <Input id={`${id}-n`} value={s.name} onChange={(e) => set({ name: e.target.value.trim() })} className="font-mono" autoComplete="off" spellCheck={false} aria-invalid={!nameOk} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.duration} htmlFor={`${id}-d`}>
              <Input id={`${id}-d`} type="number" min={0} step={0.1} value={s.duration} onChange={(e) => set({ duration: Math.max(0, Number(e.target.value) || 0) })} size="sm" />
            </Field>
            <Field label={t.delay} htmlFor={`${id}-dl`}>
              <Input id={`${id}-dl`} type="number" step={0.1} value={s.delay} onChange={(e) => set({ delay: Number(e.target.value) || 0 })} size="sm" />
            </Field>
            <Field label={t.iterations} htmlFor={`${id}-i`}>
              <Input
                id={`${id}-i`}
                type="number"
                min={0}
                step={1}
                disabled={s.iterations === "infinite"}
                value={s.iterations === "infinite" ? "" : s.iterations}
                onChange={(e) => set({ iterations: Math.max(0, Number(e.target.value) || 0) })}
                size="sm"
              />
            </Field>
            <div className="flex items-end pb-2">
              <Checkbox label={t.infinite} checked={s.iterations === "infinite"} onChange={(e) => set({ iterations: e.target.checked ? "infinite" : 1 })} />
            </div>
            <Field label={t.direction} htmlFor={`${id}-dir`}>
              <Select id={`${id}-dir`} value={s.direction} onChange={(e) => set({ direction: e.target.value as AnimSettings["direction"] })} size="sm">
                {["normal", "reverse", "alternate", "alternate-reverse"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label={t.fill} htmlFor={`${id}-f`}>
              <Select id={`${id}-f`} value={s.fill} onChange={(e) => set({ fill: e.target.value as AnimSettings["fill"] })} size="sm">
                {["none", "forwards", "backwards", "both"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={t.timing} htmlFor={`${id}-t`}>
            <Select
              id={`${id}-t`}
              value={timingMode === "keyword" ? s.timing : timingMode}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "bezier" || v === "steps") setTimingMode(v);
                else {
                  setTimingMode("keyword");
                  set({ timing: v });
                }
              }}
              size="sm"
            >
              {TIMINGS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
              <option value="bezier">{t.custom}</option>
              <option value="steps">{t.steps}</option>
            </Select>
          </Field>
          {timingMode === "bezier" && (
            <Input aria-label={t.custom} value={bez} onChange={(e) => setBez(e.target.value)} className="font-mono" size="sm" aria-invalid={!bezValid} placeholder="0.25, 0.1, 0.25, 1" />
          )}
          {timingMode === "steps" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label={t.stepsN} htmlFor={`${id}-sn`}>
                <Input id={`${id}-sn`} type="number" min={1} value={steps.n} onChange={(e) => setSteps((x) => ({ ...x, n: Number(e.target.value) || 1 }))} size="sm" />
              </Field>
              <Field label={t.jump} htmlFor={`${id}-sj`}>
                <Select id={`${id}-sj`} value={steps.jump} onChange={(e) => setSteps((x) => ({ ...x, jump: e.target.value }))} size="sm">
                  {JUMPS.map((j) => (
                    <option key={j}>{j}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
        </Panel>
      </div>
      <CodePanel locale={locale} tabs={[{ id: "css", label: "CSS", code: css, filename: `${nameOk ? s.name : preset.slug}.css` }]} />
    </div>
  );
}
