"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_LABEL, LOCALE_SHORT, type Locale } from "@/i18n/config";
import { buttonClass } from "@/ui/button";

/** Links to the same page in the other locale(s). */
export function LangSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const rest = pathname.replace(/^\/(ru|en)(?=\/|$)/, "");
  return (
    <div className="flex items-center">
      {LOCALES.filter((l) => l !== locale).map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          hrefLang={l}
          lang={l}
          className={buttonClass("ghost", "sm", "px-2.5 font-semibold")}
          aria-label={LOCALE_LABEL[l]}
          title={LOCALE_LABEL[l]}
          prefetch={false}
        >
          {LOCALE_SHORT[l]}
        </Link>
      ))}
    </div>
  );
}
