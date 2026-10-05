import type { Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { cn } from "@/lib/cn";
import type { PageModel } from "@/registry/types";
import { IconTile } from "@/ui/icon";
import { BlockView, Faq, SectionTitle } from "./blocks";
import { Breadcrumbs } from "./breadcrumbs";
import { JsonLd, pageJsonLd } from "./seo";
import { LinkCards } from "./links";
import { ToolMount } from "./tool-mount";
import { RecentTracker } from "./recent-tracker";

export function PageView({ page, locale }: { page: PageModel; locale: Locale }) {
  const t = ui(locale);
  return (
    <>
      <JsonLd data={pageJsonLd(page, locale)} />
      <div className={cn("container-page pb-16 pt-4 sm:pt-6", !page.wide && "lg:max-w-[1088px]")}>
        <Breadcrumbs items={page.breadcrumbs} current={page.h1} locale={locale} />

        <header className={cn("mb-5 flex items-start gap-3.5", page.compactHeader && "mb-3")}>
          {page.icon && !page.compactHeader && (
            <IconTile
              name={page.icon}
              hue={page.hue}
              size="lg"
              className={cn(
                "hidden sm:inline-flex",
                page.path[0] === "3d-printing-calculator" && "inline-flex size-10 sm:size-12 rounded-xl sm:rounded-2xl !bg-neutral-950 !text-white dark:!bg-white dark:!text-neutral-950 shadow-sm"
              )}
            />
          )}
          <div className="min-w-0">
            <h1 className={cn("font-bold tracking-tight text-fg", page.compactHeader ? "text-xl sm:text-2xl" : "text-[26px] sm:text-[34px]")}>
              {page.h1}
            </h1>
            {page.lead && <p className="mt-1.5 max-w-3xl text-[15px] text-fg-2 sm:text-base">{page.lead}</p>}
          </div>
        </header>

        {page.tool && (
          <div className="mb-10">
            <ToolMount tool={page.tool} locale={locale} />
            {page.kind !== "hub" && <RecentTracker path={page.path} title={page.h1} locale={locale} />}
          </div>
        )}

        <div className="flex flex-col gap-10">
          {page.topBlocks?.map((b, i) => <BlockView key={`t${i}`} block={b} locale={locale} />)}
          {page.blocks?.map((b, i) => <BlockView key={`b${i}`} block={b} locale={locale} />)}
          {page.howTo && page.howTo.length > 0 && (
            <section>
              <SectionTitle>{t.howTo}</SectionTitle>
              <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {page.howTo.map((step, i) => (
                  <li key={i} className="flex gap-3 rounded-[12px] border border-line bg-surface p-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                      {i + 1}
                    </span>
                    <span className="text-[15px] leading-snug text-fg-2">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {page.faq && page.faq.length > 0 && <Faq items={page.faq} title={t.faq} />}
          {page.related && page.related.length > 0 && (
            <section>
              <SectionTitle>{t.related}</SectionTitle>
              <LinkCards items={page.related} locale={locale} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
