import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

/**
 * Language flags drawn as SVG (Windows shows flag emoji as two letters). Russian tricolour for "Русский", the Union
 * Jack for "English". Decorative: the language name or code always sits next to it.
 */
export function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex h-[0.875rem] w-5 shrink-0 overflow-hidden rounded-[0.1875rem] shadow-[0_0_0_1px_rgb(0_0_0/0.12)]", className)}>
      {locale === "ru" ? (
        <svg viewBox="0 0 9 6" preserveAspectRatio="none" className="size-full">
          <path fill="#fff" d="M0 0h9v2H0z" />
          <path fill="#0039A6" d="M0 2h9v2H0z" />
          <path fill="#D52B1E" d="M0 4h9v2H0z" />
        </svg>
      ) : (
        <svg viewBox="0 0 60 36" preserveAspectRatio="xMidYMid slice" className="size-full">
          <path fill="#012169" d="M0 0h60v36H0z" />
          <path stroke="#fff" strokeWidth="7" d="M0 0l60 36M60 0L0 36" />
          <path stroke="#C8102E" strokeWidth="2.6" d="M0 0l60 36M60 0L0 36" />
          <path stroke="#fff" strokeWidth="11" d="M30 0v36M0 18h60" />
          <path stroke="#C8102E" strokeWidth="6.5" d="M30 0v36M0 18h60" />
        </svg>
      )}
    </span>
  );
}
