import { ArrowRight } from "lucide-react";
import { href, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { toneVars } from "@/lib/tone";
import { linkFor } from "@/registry";
import type { LinkItem } from "@/registry/types";
import { LinkCards } from "./links";
import { NotFoundSuggestions } from "./not-found-suggestions";
import { SearchBox } from "./search";

const PICKS = [["merge-pdf"], ["compress-image"], ["timer"], ["percentage-calculator"], ["word-counter"], ["unit-converter"]];

/** 404 in the site's look: what happened, a search, "maybe you meant…" from the URL, popular tools. */
export function NotFoundView({ locale }: { locale: Locale }) {
  const t = ui(locale);
  const picks = PICKS.map((p) => linkFor(locale, p)).filter((x): x is LinkItem => !!x);
  return (
    <div className="tone" style={toneVars(225) as React.CSSProperties}>
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
      <div className="container-page flex flex-col gap-12 pb-16 pt-10">
        <NotFoundSuggestions locale={locale} title={t.maybeLookingFor} />
        <section>
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-fg">{t.popular}</h2>
          <LinkCards items={picks} locale={locale} />
        </section>
      </div>
    </div>
  );
}
