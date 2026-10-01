"use client";

import Link from "@/ui/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_LABEL, LOCALE_SHORT, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Flag } from "./flags";

/** The same page in the other language(s): a flag and a code ("🇬🇧 EN") in the header, the full name elsewhere. */
export function LangSwitch({ locale, className, full = false }: { locale: Locale; className?: string; full?: boolean }) {
  const pathname = usePathname() || `/${locale}`;
  const rest = pathname.replace(/^\/(ru|en)(?=\/|$)/, "");
  if (full) {
    return (
      <div role="group" aria-label="Language / Язык" className={cn("flex flex-wrap gap-2", className)}>
        {LOCALES.map((l) => (
          <Link key={l} href={`/${l}${rest}`} hrefLang={l} lang={l} aria-current={l === locale ? "true" : undefined} className="chip h-11 gap-2.5 px-4 text-[0.9375rem]" prefetch={false}>
            <Flag locale={l} />
            {LOCALE_LABEL[l]}
          </Link>
        ))}
      </div>
    );
  }
  return (
    <div className={cn("flex items-center", className)}>
      {LOCALES.filter((l) => l !== locale).map((l) => (
        <Link key={l} href={`/${l}${rest}`} hrefLang={l} lang={l} className="btn btn-neutral h-10 gap-2 px-3 text-sm text-fg! [--btn-r:1.25rem]" aria-label={LOCALE_LABEL[l]} title={LOCALE_LABEL[l]} prefetch={false}>
          <Flag locale={l} />
          {LOCALE_SHORT[l]}
        </Link>
      ))}
    </div>
  );
}
