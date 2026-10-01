"use client";

import { Moon, Sun, SunMoon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/ui/button";

type Mode = "system" | "light" | "dark";
const KEY = "theme";

/** Inline script that applies the theme before first paint (no flash). ES5: runs in any browser. */
export const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem('${KEY}');var d=m==='dark'||((!m||m==='system')&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.className+=' dark'}catch(e){}})()`;

function apply(mode: Mode) {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function useThemeMode(): [Mode, (m: Mode) => void] {
  const [mode, setModeState] = useState<Mode>("system");

  useEffect(() => {
    let stored: Mode = "system";
    try {
      const v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark") stored = v;
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with storage after hydration
    setModeState(stored);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let cur: Mode = "system";
      try {
        cur = (localStorage.getItem(KEY) as Mode) || "system";
      } catch {
        /* ignore */
      }
      if (cur === "system") apply("system");
    };
    const onSync = (e: Event) => setModeState((e as CustomEvent<Mode>).detail);
    mq.addEventListener("change", onChange);
    window.addEventListener("theme-change", onSync);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("theme-change", onSync);
    };
  }, []);

  function setMode(next: Mode) {
    setModeState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    apply(next);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: next }));
  }
  return [mode, setMode];
}

interface Labels {
  theme: string;
  system: string;
  light: string;
  dark: string;
}

/** Header icon button: system → light → dark. */
export function ThemeToggle({ labels, className }: { labels: Labels; className?: string }) {
  const [mode, setMode] = useThemeMode();
  const label = `${labels.theme}: ${mode === "system" ? labels.system : mode === "light" ? labels.light : labels.dark}`;
  return (
    <button
      type="button"
      onClick={() => setMode(mode === "system" ? "light" : mode === "light" ? "dark" : "system")}
      className={buttonClass("ghost", "icon", className)}
      aria-label={label}
      title={label}
    >
      {mode === "system" ? <SunMoon aria-hidden /> : mode === "light" ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </button>
  );
}

/** Labelled three-way switch (menu, footer): no guessing what an icon means. */
export function ThemeSwitch({ labels, className }: { labels: Labels; className?: string }) {
  const [mode, setMode] = useThemeMode();
  const options: [Mode, string, typeof Sun][] = [
    ["system", labels.system, SunMoon],
    ["light", labels.light, Sun],
    ["dark", labels.dark, Moon],
  ];
  return (
    <div role="radiogroup" aria-label={labels.theme} className={cn("inline-flex max-w-full gap-1 rounded-[0.625rem] bg-surface-2 p-1", className)}>
      {options.map(([m, label, Icon]) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => setMode(m)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-[0.4375rem] px-2.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors",
            mode === m ? "bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-fg-2 hover:text-fg",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
