"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Kbd } from "@/ui/panel";
import { useFullscreen } from "@/ui/fullscreen";
import { useWakeLock } from "@/ui/stage";
import { useStoredJson } from "../lib/storage";

const T = {
  ru: { full: "На весь экран", exit: "Выйти", key: "клавиша", theme: "Оформление", themes: { site: "Как на сайте", dark: "Тёмное", led: "Зелёное табло", amber: "Янтарное табло", light: "Светлое" } },
  en: { full: "Full screen", exit: "Exit", key: "key", theme: "Look", themes: { site: "Site colours", dark: "Dark", led: "Green display", amber: "Amber display", light: "Light" } },
} as const;

/** Display looks for clocks on a wall or a TV: colours only, the digits stay the same. */
const THEMES = {
  site: null,
  dark: { bg: "#000000", fg: "#f4f4f5", fg2: "#a1a1aa", card: "#1c1c1f", swatch: "#000000", dot: "#f4f4f5" },
  led: { bg: "#050805", fg: "#39ff6a", fg2: "#1fae47", card: "#0e1a10", swatch: "#050805", dot: "#39ff6a", glow: "0 0 0.06em rgb(57 255 106 / 0.75)" },
  amber: { bg: "#0b0703", fg: "#ffb321", fg2: "#b97c12", card: "#1d1406", swatch: "#0b0703", dot: "#ffb321", glow: "0 0 0.06em rgb(255 179 33 / 0.7)" },
  light: { bg: "#ffffff", fg: "#111113", fg2: "#55565c", card: "#111113", swatch: "#ffffff", dot: "#111113" },
} as const;
type ThemeId = keyof typeof THEMES;
const isTheme = (v: unknown): v is ThemeId => typeof v === "string" && v in THEMES;

/** Frame for full-screen clocks: the display (focal point) and one quiet row of options. */
export function ClockShell({ locale, children, options }: { locale: Locale; children: ReactNode; options?: ReactNode }) {
  const t = T[locale];
  const { ref, active, toggle } = useFullscreen<HTMLDivElement>();
  const [theme, setTheme] = useStoredJson<ThemeId>("clock:theme:v1", "site", isTheme);
  useWakeLock(active);
  const th = THEMES[theme];
  const style = th
    ? ({ background: th.bg, color: th.fg, "--fg": th.fg, "--fg-2": th.fg2, "--fg-3": th.fg2, "--line": "transparent", "--flip-bg": th.card, "--flip-fg": th.card === th.fg ? th.bg : th.fg, textShadow: "glow" in th ? th.glow : undefined } as CSSProperties)
    : undefined;
  return (
    <div className="flex flex-col gap-3">
      <div
        ref={ref}
        className={cn(
          "flex min-h-[46vh] flex-col items-center justify-center rounded-[0.75rem] border border-line bg-surface px-3 py-8",
          active && "min-h-screen rounded-none border-0",
        )}
        style={style}
      >
        {children}
        {active && (
          <Button variant="ghost" size="sm" onClick={toggle} className="fixed right-4 top-4 opacity-40 hover:opacity-100">
            <Minimize2 aria-hidden />
            {t.exit}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {options}
          <div role="radiogroup" aria-label={t.theme} className="flex items-center gap-1.5">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => {
              const x = THEMES[id];
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={theme === id}
                  aria-label={t.themes[id]}
                  title={t.themes[id]}
                  onClick={() => setTheme(id)}
                  className={cn(
                    "grid size-7 place-items-center rounded-full border border-line-strong pointer-coarse:size-9",
                    theme === id && "ring-2 ring-accent ring-offset-2 ring-offset-bg",
                    !x && "bg-[linear-gradient(135deg,var(--surface)_50%,var(--fg)_50%)]",
                  )}
                  style={x ? { background: x.swatch } : undefined}
                >
                  {x && <span className="size-2 rounded-full" style={{ background: x.dot }} />}
                </button>
              );
            })}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={toggle}>
          <Maximize2 aria-hidden />
          {t.full}
          <Kbd className="ml-1 hidden sm:inline-flex" aria-label={`${t.key} F`}>
            F
          </Kbd>
        </Button>
      </div>
    </div>
  );
}

const isOpts = (v: unknown): v is ClockOptions => !!v && typeof v === "object" && typeof (v as ClockOptions).h12 === "boolean" && typeof (v as ClockOptions).sec === "boolean" && typeof (v as ClockOptions).date === "boolean";
export interface ClockOptions {
  h12: boolean;
  sec: boolean;
  date: boolean;
}
export { isOpts };
