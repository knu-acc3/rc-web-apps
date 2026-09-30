import { round } from "./tokens";

export interface AnimPreset {
  slug: string;
  /** Keyframe blocks inside @keyframes { … } */
  keyframes: string;
  duration: number;
  timing: string;
  iterations: number | "infinite";
  fill: "none" | "forwards" | "backwards" | "both";
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
  /** Extra declarations the animated element needs (transform-origin, width…). */
  extra?: string[];
  /** Kind of motion, used in the texts. */
  kind: "entrance" | "exit" | "attention" | "loop" | "text" | "loading";
  /** Demo content of the preview element. */
  demo?: "text" | "block" | "skeleton";
}

const k = (s: string) => s.trim().replace(/^ {4}/gm, "");

export const ANIM_PRESETS: AnimPreset[] = [
  { slug: "fade-in", kind: "entrance", duration: 0.6, timing: "ease-out", iterations: 1, fill: "both", keyframes: k(`
    from { opacity: 0; }
    to { opacity: 1; }`) },
  { slug: "fade-out", kind: "exit", duration: 0.6, timing: "ease-in", iterations: 1, fill: "both", keyframes: k(`
    from { opacity: 1; }
    to { opacity: 0; }`) },
  { slug: "slide-in-left", kind: "entrance", duration: 0.5, timing: "cubic-bezier(0.16, 1, 0.3, 1)", iterations: 1, fill: "both", keyframes: k(`
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }`) },
  { slug: "slide-in-right", kind: "entrance", duration: 0.5, timing: "cubic-bezier(0.16, 1, 0.3, 1)", iterations: 1, fill: "both", keyframes: k(`
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }`) },
  { slug: "slide-in-up", kind: "entrance", duration: 0.5, timing: "cubic-bezier(0.16, 1, 0.3, 1)", iterations: 1, fill: "both", keyframes: k(`
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }`) },
  { slug: "slide-in-down", kind: "entrance", duration: 0.5, timing: "cubic-bezier(0.16, 1, 0.3, 1)", iterations: 1, fill: "both", keyframes: k(`
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }`) },
  { slug: "zoom-in", kind: "entrance", duration: 0.4, timing: "ease-out", iterations: 1, fill: "both", keyframes: k(`
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }`) },
  { slug: "zoom-out", kind: "exit", duration: 0.4, timing: "ease-in", iterations: 1, fill: "both", keyframes: k(`
    from { transform: scale(1); opacity: 1; }
    to { transform: scale(0.5); opacity: 0; }`) },
  { slug: "bounce", kind: "attention", duration: 1, timing: "ease", iterations: "infinite", fill: "both", keyframes: k(`
    0%, 20%, 53%, 100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1); }
    40%, 43% { transform: translateY(-30px); animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06); }
    70% { transform: translateY(-15px); animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06); }
    80% { transform: translateY(0); }
    90% { transform: translateY(-4px); }`) },
  { slug: "shake", kind: "attention", duration: 0.8, timing: "ease-in-out", iterations: 1, fill: "both", keyframes: k(`
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
    20%, 40%, 60%, 80% { transform: translateX(6px); }`) },
  { slug: "pulse", kind: "loop", duration: 1.5, timing: "ease-in-out", iterations: "infinite", fill: "none", keyframes: k(`
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }`) },
  { slug: "spin", kind: "loading", duration: 1, timing: "linear", iterations: "infinite", fill: "none", keyframes: k(`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }`) },
  { slug: "flip", kind: "attention", duration: 1, timing: "ease-in-out", iterations: 1, fill: "both", keyframes: k(`
    from { transform: perspective(400px) rotateY(0); }
    to { transform: perspective(400px) rotateY(360deg); }`) },
  { slug: "swing", kind: "attention", duration: 1, timing: "ease-in-out", iterations: 1, fill: "both", extra: ["transform-origin: top center;"], keyframes: k(`
    20% { transform: rotate(15deg); }
    40% { transform: rotate(-10deg); }
    60% { transform: rotate(5deg); }
    80% { transform: rotate(-5deg); }
    100% { transform: rotate(0deg); }`) },
  { slug: "heartbeat", kind: "loop", duration: 1.3, timing: "ease-in-out", iterations: "infinite", fill: "none", keyframes: k(`
    0%, 28%, 70%, 100% { transform: scale(1); }
    14%, 42% { transform: scale(1.3); }`) },
  { slug: "wobble", kind: "attention", duration: 1, timing: "ease-in-out", iterations: 1, fill: "both", keyframes: k(`
    0%, 100% { transform: translateX(0); }
    15% { transform: translateX(-25%) rotate(-5deg); }
    30% { transform: translateX(20%) rotate(3deg); }
    45% { transform: translateX(-15%) rotate(-3deg); }
    60% { transform: translateX(10%) rotate(2deg); }
    75% { transform: translateX(-5%) rotate(-1deg); }`) },
  { slug: "jello", kind: "attention", duration: 1, timing: "ease", iterations: 1, fill: "both", extra: ["transform-origin: center;"], keyframes: k(`
    0%, 11.1%, 100% { transform: none; }
    22.2% { transform: skewX(-12.5deg) skewY(-12.5deg); }
    33.3% { transform: skewX(6.25deg) skewY(6.25deg); }
    44.4% { transform: skewX(-3.125deg) skewY(-3.125deg); }
    55.5% { transform: skewX(1.5625deg) skewY(1.5625deg); }
    66.6% { transform: skewX(-0.78125deg) skewY(-0.78125deg); }
    77.7% { transform: skewX(0.390625deg) skewY(0.390625deg); }
    88.8% { transform: skewX(-0.1953125deg) skewY(-0.1953125deg); }`) },
  { slug: "blink", kind: "loop", duration: 1, timing: "steps(1, end)", iterations: "infinite", fill: "none", keyframes: k(`
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }`) },
  { slug: "typing", kind: "text", duration: 2.5, timing: "steps(22, end)", iterations: 1, fill: "both", demo: "text", extra: ["width: 22ch;", "white-space: nowrap;", "overflow: hidden;", "border-right: 2px solid;", "font-family: monospace;"], keyframes: k(`
    from { width: 0; }
    to { width: 22ch; }`) },
  { slug: "skeleton-shimmer", kind: "loading", duration: 1.4, timing: "ease", iterations: "infinite", fill: "none", demo: "skeleton", extra: ["background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 37%, #e5e7eb 63%);", "background-size: 400% 100%;"], keyframes: k(`
    from { background-position: 100% 50%; }
    to { background-position: 0 50%; }`) },
];

export const presetBySlug = new Map(ANIM_PRESETS.map((p) => [p.slug, p]));

export interface AnimSettings {
  name: string;
  duration: number;
  delay: number;
  iterations: number | "infinite";
  direction: "normal" | "reverse" | "alternate" | "alternate-reverse";
  fill: "none" | "forwards" | "backwards" | "both";
  timing: string;
}

export function settingsFor(p: AnimPreset): AnimSettings {
  return { name: p.slug, duration: p.duration, delay: 0, iterations: p.iterations, direction: p.direction ?? "normal", fill: p.fill, timing: p.timing };
}

export const isIdent = (s: string) => /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/.test(s) && !/^(none|initial|inherit|unset|revert|default)$/i.test(s);

/** The animation shorthand, e.g. "fade-in 0.6s ease-out 0s 1 normal both". */
export function animationShorthand(s: AnimSettings): string {
  return `${s.name} ${round(s.duration, 3)}s ${s.timing} ${round(s.delay, 3)}s ${s.iterations} ${s.direction} ${s.fill}`;
}

/**
 * Complete CSS: @keyframes, a class that runs the animation (named exactly as the user chose,
 * no forced prefix) and a prefers-reduced-motion block that switches the motion off.
 */
export function animationCss(p: AnimPreset, s: AnimSettings): string {
  const name = isIdent(s.name) ? s.name : p.slug;
  const set = { ...s, name };
  const body = p.keyframes
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
  const extra = (p.extra ?? []).map((d) => `  ${d}\n`).join("");
  return `@keyframes ${name} {\n${body}\n}\n\n.${name} {\n${extra}  animation: ${animationShorthand(set)};\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .${name} {\n    animation: none;\n  }\n}`;
}
