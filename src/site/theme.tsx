"use client";

import { useServerInsertedHTML } from "next/navigation";
import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonClass } from "@/ui/button";

type Mode = "system" | "light" | "dark";
const KEY = "theme";

/** Inline script that applies the theme before first paint (no flash). */
export const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem('${KEY}');var d=m==='dark'||((!m||m==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export function ThemeScript() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
  ));
  return null;
}

function apply(mode: Mode) {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle({ labels }: { labels: { theme: string; system: string; light: string; dark: string } }) {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    let stored: Mode = "system";
    try {
      const v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark") stored = v;
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with storage after hydration
    setMode(stored);
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
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next: Mode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    apply(next);
  }

  const label = `${labels.theme}: ${mode === "system" ? labels.system : mode === "light" ? labels.light : labels.dark}`;
  return (
    <button type="button" onClick={cycle} className={buttonClass("ghost", "icon")} aria-label={label} title={label}>
      {mode === "system" ? <Laptop aria-hidden /> : mode === "light" ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </button>
  );
}
