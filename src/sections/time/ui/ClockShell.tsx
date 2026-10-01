"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Kbd } from "@/ui/panel";
import { useFullscreen } from "@/ui/fullscreen";
import { useWakeLock } from "@/ui/stage";

const T = {
  ru: { full: "На весь экран", exit: "Выйти", key: "клавиша" },
  en: { full: "Full screen", exit: "Exit", key: "key" },
} as const;

/** Frame for full-screen clocks: the display (focal point) and one quiet row of options. */
export function ClockShell({ locale, children, options }: { locale: Locale; children: ReactNode; options?: ReactNode }) {
  const t = T[locale];
  const { ref, active, toggle } = useFullscreen<HTMLDivElement>();
  useWakeLock(active);
  return (
    <div className="flex flex-col gap-3">
      <div
        ref={ref}
        className={cn(
          "flex min-h-[46vh] flex-col items-center justify-center rounded-[0.75rem] border border-line bg-surface px-3 py-8",
          active && "min-h-screen rounded-none border-0",
        )}
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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">{options}</div>
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
