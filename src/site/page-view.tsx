import { LayoutGrid, Lock, TriangleAlert } from "lucide-react";
import Link from "@/ui/link";
import { href, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { cn } from "@/lib/cn";
import { toneVars } from "@/lib/tone";
import { isSensitive, layoutOf } from "@/registry/layouts";
import type { PageModel } from "@/registry/types";
import { IconTile } from "@/ui/icon";
import { BlockView, Faq, HowTo, SectionTitle } from "./blocks";
import { Breadcrumbs } from "./breadcrumbs";
import { JsonLd, pageJsonLd } from "./seo";
import { LinkCards } from "./links";
import { ToolMount } from "./tool-mount";
import { RecentTracker } from "./recent-tracker";
import { PageActions } from "./page-actions";
import { Icon } from "@/ui/icon";
import { FamilyTabs } from "./family-tabs";

/**
 * Every page: a tinted "stage" in the section colour with the title and the tool (the one thing to look at),
 * then quiet reference content: variants, data, how-to, FAQ, details, related tools.
 */
export function PageView({ page, locale }: { page: PageModel; locale: Locale }) {
  const t = ui(locale);
  const layout = layoutOf(page);
  const centred = layout === "file";
  const compactHead = page.compactHeader || layout === "screen";
  const narrow = !page.wide && layout !== "reference";
  // The next thing people usually do: the first related tools, right under the result.
  const next = page.tool ? (page.related ?? []).slice(0, 4) : [];

  return (
    <div className="tone" style={toneVars(page.hue) as React.CSSProperties}>
      <JsonLd data={pageJsonLd(page, locale)} />
      <section className="stage">
        <div className={cn("container-page pb-8 pt-3 sm:pb-10 sm:pt-4", narrow && "lg:max-w-[68rem]")}>
          <div className="mb-3 flex min-h-9 items-center justify-between gap-3">
            <Breadcrumbs items={page.breadcrumbs} current={page.h1} locale={locale} className="mb-0! min-w-0 flex-1" />
            {page.kind !== "hub" && <PageActions path={page.path} title={page.h1} locale={locale} />}
          </div>
          <header className={cn("flex gap-4", centred ? "mx-auto max-w-3xl flex-col items-center text-center sm:pt-4" : "items-start", compactHead ? "mb-5" : "mb-5 sm:mb-7")}>
            {/* The icon is decoration: phones spend the height on the tool instead. */}
            {page.icon && !compactHead && <IconTile name={page.icon} hue={page.hue} size="lg" className={cn("hidden! sm:inline-flex!", !centred && "mt-0.5")} />}
            <div className="min-w-0 flex-1">
              <h1 className={cn("font-bold tracking-tight text-fg", compactHead ? "text-[1.5rem] min-[400px]:text-[1.625rem] sm:text-[2rem]" : "text-[1.625rem] min-[400px]:text-[1.75rem] sm:text-[2.5rem]")}>{page.h1}</h1>
              {page.lead && <p className={cn("mt-2 text-[0.9375rem] leading-snug text-fg-2 sm:text-lg sm:leading-normal", centred ? "mx-auto max-w-2xl" : "max-w-3xl")}>{page.lead}</p>}
            </div>
          </header>

          {page.tool && (
            <div className={cn(centred && "mx-auto max-w-3xl")}>
              {(page.kind === "tool" || page.kind === "variant") && <FamilyTabs slug={page.path[0]} locale={locale} />}
              <p className="js-note mb-4 rounded-[0.75rem] bg-warn-soft px-4 py-3 text-sm text-warn">
                <TriangleAlert className="mr-1.5 inline size-4 align-[-3px]" aria-hidden />
                {t.oldBrowser}
              </p>
              <ToolMount tool={page.tool} locale={locale} />
              {page.kind !== "hub" && page.kind !== "static" && <RecentTracker path={page.path} title={page.h1} locale={locale} />}
              {next.length > 0 && (
                <nav aria-label={t.nextSteps} className={cn("mt-5 flex flex-wrap items-center gap-2", centred && "justify-center")}>
                  <span className="mr-1 text-sm font-medium text-fg-3">{t.nextSteps}:</span>
                  {next.map((r) => (
                    <a key={r.path.join("/")} href={href(locale, r.path)} className="chip">
                      {r.glyph ? <span className="text-base leading-none">{r.glyph}</span> : <Icon name={r.icon} className="size-4 text-accent" strokeWidth={1.75} />}
                      {r.label}
                    </a>
                  ))}
                </nav>
              )}
              {isSensitive(page) && (
                <p className={cn("mt-4 flex items-start gap-2 text-sm text-fg-3", centred && "justify-center text-center")}>
                  <Lock className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
                  <span>
                    {t.localOnly}{" "}
                    <Link href={href(locale, ["about", "privacy"])} className="underline underline-offset-2 hover:text-accent">
                      {t.localOnlyHow}
                    </Link>
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <div className={cn("container-page flex flex-col gap-11 pb-16 pt-9 sm:gap-12 sm:pt-10", narrow && "lg:max-w-[68rem]")}>
        {page.topBlocks?.map((b, i) => <BlockView key={`t${i}`} block={b} locale={locale} />)}
        {page.blocks?.filter((b) => !(b.type === "text" && b.fold)).map((b, i) => <BlockView key={`b${i}`} block={b} locale={locale} />)}
        {page.howTo && page.howTo.length > 0 && <HowTo steps={page.howTo} title={t.howTo} />}
        {page.faq && page.faq.length > 0 && <Faq items={page.faq} title={t.faq} />}
        {page.blocks?.filter((b) => b.type === "text" && b.fold).map((b, i) => <BlockView key={`f${i}`} block={b} locale={locale} />)}
        {page.related && page.related.length > next.length && (
          <section>
            <SectionTitle icon={LayoutGrid}>{t.related}</SectionTitle>
            <LinkCards items={page.related.slice(next.length, next.length + 6)} locale={locale} />
          </section>
        )}
      </div>
    </div>
  );
}
