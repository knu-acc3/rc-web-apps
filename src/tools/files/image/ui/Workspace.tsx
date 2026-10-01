"use client";

import { ArrowLeftRight, ChevronDown, Crop, History, Loader2, Minimize2, RotateCw, Scaling, Stamp, Type, WandSparkles } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { href, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/ui/button";
import { wsReplace } from "../../shared/workspace";
import { HANDOFF_TARGETS, type HandoffId } from "./handoff-targets";

const T = {
  ru: {
    continue: (n: number) => `Продолжаем с ${n} фото`,
    startOver: "Начать заново",
    restoring: "Восстанавливаем фото…",
    next: "Дальше",
    nextTitle: "Открыть результат в другом инструменте",
  },
  en: {
    continue: (n: number) => `Continuing with ${n} ${n === 1 ? "photo" : "photos"}`,
    startOver: "Start over",
    restoring: "Restoring photos…",
    next: "Next",
    nextTitle: "Open the result in another tool",
  },
} as const;

/** One tonal line above a tool that got its photos from the previous tool. */
export function WorkspaceBar({ locale, count, onStartOver }: { locale: Locale; count: number; onStartOver: () => void }) {
  const t = T[locale];
  if (!count) return null;
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 rounded-[1rem] bg-accent-container py-1 pl-4 pr-1 text-[0.9375rem] text-on-accent-container motion-safe:animate-[menu-in_200ms_ease-out]">
      <History className="size-4 shrink-0" aria-hidden />
      <span className="font-medium">{t.continue(count)}</span>
      <span aria-hidden>·</span>
      <button type="button" onClick={onStartOver} className={buttonClass("text", "sm", "-ml-2 text-on-accent-container underline-offset-4 hover:underline")}>
        {t.startOver}
      </button>
    </div>
  );
}

/** Shown instead of the drop zone while the photos of the previous tool are read back. */
export function RestoringPlaceholder({ locale, text, className }: { locale: Locale; text?: string; className?: string }) {
  return (
    <div className={cn("flex min-h-48 flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-surface-2 px-5 py-8 text-fg-2", className)} role="status">
      <Loader2 className="size-7 animate-spin text-accent" aria-hidden />
      <span className="text-base font-medium">{text ?? T[locale].restoring}</span>
    </div>
  );
}

const ICONS: Record<HandoffId, ReactNode> = {
  compress: <Minimize2 aria-hidden />,
  resize: <Scaling aria-hidden />,
  crop: <Crop aria-hidden />,
  convert: <ArrowLeftRight aria-hidden />,
  rotate: <RotateCw aria-hidden />,
  filters: <WandSparkles aria-hidden />,
  "add-text": <Type aria-hidden />,
  watermark: <Stamp aria-hidden />,
};

/**
 * "Next ▾" on the result card: hands the results to another photo tool and opens it. A native <details> menu
 * (works without extra scripts in Safari 14); closes on Escape and on a click outside.
 */
export function NextMenu({
  locale,
  self,
  getFiles,
  disabled,
  className,
}: {
  locale: Locale;
  /** The tool the menu is in (left out of the list). */
  self?: HandoffId;
  /** The results to hand on (null = nothing to hand on yet). */
  getFiles: () => Promise<File[] | null> | File[] | null;
  disabled?: boolean;
  className?: string;
}) {
  const t = T[locale];
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<HandoffId | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const el = ref.current;
      if (!el) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !el.contains(e.target as Node)) {
        el.open = false;
        if (e instanceof KeyboardEvent) el.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function go(id: HandoffId, slug: string) {
    setBusy(id);
    try {
      const files = await getFiles();
      if (!files?.length) return;
      await wsReplace(files, "result");
      window.location.assign(href(locale, [slug]));
    } catch {
      // nothing to hand on
    } finally {
      setBusy(null);
    }
  }

  return (
    <details
      ref={ref}
      className={cn("group relative", disabled && "pointer-events-none opacity-50", className)}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary
        title={t.nextTitle}
        aria-disabled={disabled || undefined}
        className={buttonClass("tonal", "lg", "w-full list-none [&::-webkit-details-marker]:hidden")}
      >
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {t.next}
        <ChevronDown className="transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="absolute bottom-full left-0 z-30 sm:left-auto sm:right-0 mb-2 w-60 max-w-[calc(100vw-2rem)] rounded-[1rem] bg-surface p-1.5 shadow-elev-3 motion-safe:animate-[menu-in_150ms_ease-out]">
        <ul className="flex flex-col">
          {HANDOFF_TARGETS.filter((x) => x.id !== self).map((x) => (
            <li key={x.id}>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => go(x.id, x.slug)}
                className="flex h-11 w-full items-center gap-3 rounded-[0.75rem] px-3 text-left text-[0.9375rem] text-fg transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none disabled:opacity-60 [&_svg]:size-5 [&_svg]:text-fg-2"
              >
                {busy === x.id ? <Loader2 className="animate-spin" aria-hidden /> : ICONS[x.id]}
                {x.label[locale]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
