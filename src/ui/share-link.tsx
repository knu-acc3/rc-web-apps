"use client";

import { Check, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { buttonClass } from "./button";

const T = {
  ru: { share: "Ссылка", copied: "Ссылка скопирована" },
  en: { share: "Link", copied: "Link copied" },
} as const;

/**
 * "Link to this setup": the phone share sheet on touch screens, the clipboard elsewhere. `url` is called on click,
 * so it always reflects the current state.
 */
export function ShareLink({ url, locale, label, className }: { url: () => string; locale: Locale; label?: string; className?: string }) {
  const t = T[locale];
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function share() {
    const u = url();
    if (typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ url: u });
        return;
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
      }
    }
    if (await copyText(u)) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <button type="button" onClick={share} className={cn(buttonClass("ghost", "sm"), copied && "text-ok", className)} title={label ?? t.share}>
      {copied ? <Check aria-hidden /> : <Link2 aria-hidden />}
      <span>{copied ? t.copied : (label ?? t.share)}</span>
      <span role="status" className="sr-only">
        {copied ? t.copied : ""}
      </span>
    </button>
  );
}
