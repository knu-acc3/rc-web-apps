"use client";

import { ArrowRight } from "lucide-react";
import { href, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { NotFoundSuggestions } from "./not-found-suggestions";
import { SearchBox } from "./search";

/** Light 404 for client-side navigations (no registry on the client). */
export function NotFoundClient({ locale }: { locale: Locale }) {
  const t = ui(locale);
  return (
    <div>
      <section className="stage">
        <div className="container-page mx-auto max-w-2xl py-12 text-center sm:py-16">
          <p className="text-sm font-semibold tracking-widest text-accent uppercase">404</p>
          <h1 className="mt-2 text-[1.875rem] font-bold tracking-tight text-fg sm:text-[2.5rem]">{t.notFoundTitle}</h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-fg-2 sm:text-lg">{t.notFoundText}</p>
          <div className="mx-auto mt-7 max-w-xl text-left">
            <SearchBox locale={locale} variant="hero" labels={{ search: t.search, placeholder: t.searchPlaceholder, empty: t.searchEmpty, hint: t.searchHint, close: t.close }} />
          </div>
          <a href={href(locale)} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            {t.toHome}
            <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>
      </section>
      <div className="container-page pb-16 pt-10">
        <NotFoundSuggestions locale={locale} title={t.maybeLookingFor} />
      </div>
    </div>
  );
}
