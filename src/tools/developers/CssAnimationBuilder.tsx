"use client";

import { useMemo, useState } from "react";
import { ArrowClockwise, Check, Copy, Play } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type Effect = {
  id: string;
  nameRu: string;
  nameEn: string;
  keyframes: string;
};

const EFFECTS: Effect[] = [
  {
    id: "fade-in",
    nameRu: "Появление",
    nameEn: "Fade in",
    keyframes: "from { opacity: 0; }\n  to { opacity: 1; }",
  },
  {
    id: "fade-out",
    nameRu: "Исчезновение",
    nameEn: "Fade out",
    keyframes: "from { opacity: 1; }\n  to { opacity: 0; }",
  },
  {
    id: "slide-up",
    nameRu: "Сдвиг снизу",
    nameEn: "Slide up",
    keyframes:
      "from { opacity: 0; transform: translateY(32px); }\n  to { opacity: 1; transform: translateY(0); }",
  },
  {
    id: "slide-down",
    nameRu: "Сдвиг сверху",
    nameEn: "Slide down",
    keyframes:
      "from { opacity: 0; transform: translateY(-32px); }\n  to { opacity: 1; transform: translateY(0); }",
  },
  {
    id: "slide-left",
    nameRu: "Сдвиг справа",
    nameEn: "Slide from right",
    keyframes:
      "from { opacity: 0; transform: translateX(32px); }\n  to { opacity: 1; transform: translateX(0); }",
  },
  {
    id: "slide-right",
    nameRu: "Сдвиг слева",
    nameEn: "Slide from left",
    keyframes:
      "from { opacity: 0; transform: translateX(-32px); }\n  to { opacity: 1; transform: translateX(0); }",
  },
  {
    id: "scale-in",
    nameRu: "Увеличение",
    nameEn: "Scale in",
    keyframes:
      "from { opacity: 0; transform: scale(0.72); }\n  to { opacity: 1; transform: scale(1); }",
  },
  {
    id: "rotate-in",
    nameRu: "Поворот",
    nameEn: "Rotate in",
    keyframes:
      "from { opacity: 0; transform: rotate(-180deg) scale(0.75); }\n  to { opacity: 1; transform: rotate(0) scale(1); }",
  },
  {
    id: "bounce",
    nameRu: "Прыжок",
    nameEn: "Bounce",
    keyframes:
      "0%, 100% { transform: translateY(0); }\n  45% { transform: translateY(-30px); }\n  70% { transform: translateY(-12px); }",
  },
  {
    id: "pulse",
    nameRu: "Пульсация",
    nameEn: "Pulse",
    keyframes:
      "0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.12); }",
  },
  {
    id: "shake",
    nameRu: "Встряхивание",
    nameEn: "Shake",
    keyframes:
      "0%, 100% { transform: translateX(0); }\n  20%, 60% { transform: translateX(-10px); }\n  40%, 80% { transform: translateX(10px); }",
  },
  {
    id: "flip",
    nameRu: "Переворот",
    nameEn: "Flip",
    keyframes:
      "from { transform: perspective(600px) rotateY(0); }\n  to { transform: perspective(600px) rotateY(360deg); }",
  },
];

const EASINGS = [
  { value: "ease", label: "ease" },
  { value: "ease-in", label: "ease-in" },
  { value: "ease-out", label: "ease-out" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "linear", label: "linear" },
  { value: "cubic-bezier(0.22, 1, 0.36, 1)", label: "smooth-out" },
];

export default function CssAnimationBuilder() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [effectId, setEffectId] = useState("fade-in");
  const [duration, setDuration] = useState(700);
  const [delay, setDelay] = useState(0);
  const [easing, setEasing] = useState("ease-out");
  const [iterations, setIterations] = useState("1");
  const [direction, setDirection] = useState("normal");
  const [fillMode, setFillMode] = useState("both");
  const [selector, setSelector] = useState(".animated-element");
  const [reducedMotion, setReducedMotion] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const effect = EFFECTS.find((item) => item.id === effectId) ?? EFFECTS[0];
  const animationName = `ulti-${effect.id}`;
  const iterationValue =
    iterations === "infinite"
      ? "infinite"
      : String(Math.max(1, Number(iterations) || 1));
  const animationDeclaration = `${animationName} ${duration}ms ${easing} ${delay}ms ${iterationValue} ${direction} ${fillMode}`;

  const css = useMemo(() => {
    const safeSelector = selector.trim() || ".animated-element";
    const base = `${safeSelector} {\n  animation: ${animationDeclaration};\n}\n\n@keyframes ${animationName} {\n  ${effect.keyframes}\n}`;
    if (!reducedMotion) return `${base}\n`;
    return `${base}\n\n@media (prefers-reduced-motion: reduce) {\n  ${safeSelector} {\n    animation: none;\n  }\n}\n`;
  }, [
    animationDeclaration,
    animationName,
    effect.keyframes,
    reducedMotion,
    selector,
  ]);

  const replay = () => {
    setPreviewKey((value) => value + 1);
    setCopied(false);
  };

  const copyCss = async () => {
    await navigator.clipboard.writeText(css);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div>
            <Label htmlFor="animation-effect" className="text-sm font-semibold">
              {isEn ? "Animation" : "Анимация"}
            </Label>
            <select
              id="animation-effect"
              value={effectId}
              onChange={(event) => {
                setEffectId(event.target.value);
                replay();
              }}
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            >
              {EFFECTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {isEn ? item.nameEn : item.nameRu}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor="animation-duration"
                className="text-sm font-semibold"
              >
                {isEn ? "Duration" : "Длительность"}
              </Label>
              <span className="font-mono text-sm font-bold text-[var(--color-primary)]">
                {duration} ms
              </span>
            </div>
            <input
              id="animation-duration"
              type="range"
              min={100}
              max={3000}
              step={50}
              value={duration}
              onChange={(event) => {
                setDuration(Number(event.target.value));
                setCopied(false);
              }}
              onPointerUp={replay}
              className="mt-2 h-12 w-full accent-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="mt-4 flex min-h-72 flex-col items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6">
          <style>{`@keyframes ${animationName} { ${effect.keyframes} }`}</style>
          <div
            key={previewKey}
            className="flex size-28 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-center text-sm font-bold text-[var(--color-primary-foreground)] shadow-[var(--shadow-elevated)]"
            style={{ animation: animationDeclaration }}
          >
            {isEn ? "Preview" : "Просмотр"}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-6 min-h-11"
            onClick={replay}
          >
            <ArrowClockwise size={18} /> {isEn ? "Replay" : "Повторить"}
          </Button>
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          onClick={copyCss}
          leadingIcon={
            copied ? <Check size={20} weight="bold" /> : <Copy size={20} />
          }
        >
          {copied
            ? isEn
              ? "CSS copied"
              : "CSS скопирован"
            : isEn
              ? "Copy CSS"
              : "Скопировать CSS"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Timing and output" : "Тайминг и вывод"}
          description={
            isEn
              ? "Delay, easing, repeats, direction and selector"
              : "Задержка, ускорение, повторы, направление и селектор"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="animation-delay">
                {isEn ? "Delay (ms)" : "Задержка (мс)"}
              </Label>
              <Input
                id="animation-delay"
                type="number"
                min={0}
                max={10000}
                value={delay}
                onChange={(event) => {
                  setDelay(Math.max(0, Number(event.target.value) || 0));
                  setCopied(false);
                }}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="animation-easing">
                {isEn ? "Easing" : "Функция ускорения"}
              </Label>
              <select
                id="animation-easing"
                value={easing}
                onChange={(event) => {
                  setEasing(event.target.value);
                  setCopied(false);
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 font-mono text-sm"
              >
                {EASINGS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="animation-iterations">
                {isEn ? "Repeats" : "Повторы"}
              </Label>
              <select
                id="animation-iterations"
                value={iterations}
                onChange={(event) => {
                  setIterations(event.target.value);
                  setCopied(false);
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="infinite">
                  {isEn ? "Infinite" : "Бесконечно"}
                </option>
              </select>
            </div>
            <div>
              <Label htmlFor="animation-direction">
                {isEn ? "Direction" : "Направление"}
              </Label>
              <select
                id="animation-direction"
                value={direction}
                onChange={(event) => {
                  setDirection(event.target.value);
                  setCopied(false);
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="normal">normal</option>
                <option value="reverse">reverse</option>
                <option value="alternate">alternate</option>
                <option value="alternate-reverse">alternate-reverse</option>
              </select>
            </div>
            <div>
              <Label htmlFor="animation-fill">fill-mode</Label>
              <select
                id="animation-fill"
                value={fillMode}
                onChange={(event) => {
                  setFillMode(event.target.value);
                  setCopied(false);
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="none">none</option>
                <option value="forwards">forwards</option>
                <option value="backwards">backwards</option>
                <option value="both">both</option>
              </select>
            </div>
            <div>
              <Label htmlFor="animation-selector">
                {isEn ? "CSS selector" : "CSS-селектор"}
              </Label>
              <Input
                id="animation-selector"
                value={selector}
                onChange={(event) => {
                  setSelector(event.target.value);
                  setCopied(false);
                }}
                className="mt-1.5 h-11 font-mono"
              />
            </div>
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) => {
                setReducedMotion(event.target.checked);
                setCopied(false);
              }}
              className="size-5 accent-[var(--color-primary)]"
            />
            <span>
              {isEn
                ? "Disable animation for prefers-reduced-motion"
                : "Отключать анимацию при prefers-reduced-motion"}
            </span>
          </label>

          <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-code-bg)] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-code-muted)]">
              <Play size={16} /> CSS
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs text-[var(--color-code-text)]">
              <code>{css}</code>
            </pre>
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
