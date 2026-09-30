import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import {
  type Tool,
  toolGroups,
  tools,
  getToolBySlug,
  getToolsByGroup,
} from "@/src/data/tools";
import {
  getGroupName,
  getToolDescription,
  getToolDisplayName,
  getToolName,
  getToolSeoTitle,
  getToolSeoDescription,
  getToolH1,
} from "@/src/data/toolLocalization";
import { type Locale } from "@/src/i18n/index";
import { getServerLanguage } from "@/src/i18n/server";
import { Container } from "@/src/components/ui/container";
import { ToolBody } from "@/src/components/ui/responsive";
import { siteConfig } from "@/src/config/site.config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import ToolCard from "@/src/components/ToolCard";
import { relatedToolsMap } from "@/src/data/relatedTools";
import { canonicalizeToolSlug } from "@/src/seo/canonicalSlugs";
import {
  getToolFAQ,
  getToolFAQEn,
  getToolSeoContent,
  getToolSeoContentEn,
} from "@/src/data/toolPageContent";
import { ToolHost } from "./ToolHost";

interface Props {
  slug: string;
  locale: Locale;
}

export default async function ToolPage({ slug, locale }: Props) {
  const tool = getToolBySlug(slug);
  const { t, lHref } = await getServerLanguage(locale);
  const isEn = locale === "en";

  if (!tool) {
    return (
      <Container className="py-12 text-center">
        <h1 className="mb-3 text-2xl font-bold">
          {isEn ? "Tool not found" : "Инструмент не найден"}
        </h1>
        <Link
          href={lHref("/")}
          className="text-[var(--color-primary)] hover:underline"
        >
          {isEn ? "Go home" : "На главную"}
        </Link>
      </Container>
    );
  }

  const group = toolGroups.find((g) => g.id === tool.groupId);
  const localizedToolName = getToolName(tool, locale);
  const displayToolName = getToolDisplayName(tool, locale);
  const localizedToolDescription = getToolDescription(tool, locale);
  const localizedGroupName = group ? getGroupName(group, locale) : "";
  const seoTitle = getToolSeoTitle(tool, locale);
  const seoDescription = getToolSeoDescription(tool, locale);
  const groupNameRu = group?.name || "";
  const groupNameEn = group?.nameEn || group?.name || "";

  // Related tools
  const implementedTools = tools.filter((t) => t.implemented && !t.hidden);
  const crossCategory = (relatedToolsMap[tool.slug] || [])
    .map((s) =>
      implementedTools.find((t) => t.slug === canonicalizeToolSlug(s)),
    )
    .filter((t): t is Tool => !!t);
  const sameGroup = getToolsByGroup(tool.groupId).filter(
    (t) => t.id !== tool.id,
  );
  const featuredFallback = implementedTools
    .filter((t) => t.id !== tool.id && t.featured && t.groupId !== tool.groupId)
    .slice(0, 4);
  const merged = [...crossCategory, ...sameGroup, ...featuredFallback];
  const seen = new Set<string>();
  const relatedTools: Tool[] = [];
  for (const item of merged) {
    if (seen.has(item.id) || item.id === tool.id) continue;
    seen.add(item.id);
    relatedTools.push(item);
    if (relatedTools.length >= 4) break;
  }

  const seoContent = isEn ? getToolSeoContentEn(tool) : getToolSeoContent(tool);
  const faqItems = isEn ? getToolFAQEn(tool) : getToolFAQ(tool);

  // JSON-LD
  const softwareApplicationJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: seoTitle,
    description: seoDescription,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${siteConfig.baseUrl}/${locale}/tools/${tool.slug}`,
    inLanguage: locale,
    isAccessibleForFree: true,
    browserRequirements: "Requires JavaScript",
    author: {
      "@type": "Organization",
      name: siteConfig.brandName,
      url: siteConfig.baseUrl,
    },
    keywords: isEn
      ? (tool.keywords.filter((kw) => !/[А-Яа-яЁё]/.test(kw)).join(", ") || `${displayToolName}, online tool, free utility`)
      : tool.keywords.join(", "),
  });

  const faqJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  });

  const breadcrumbsJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isEn ? "Home" : "Главная",
        item: `${siteConfig.baseUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEn ? groupNameEn || "Tools" : groupNameRu || "Инструменты",
        item: `${siteConfig.baseUrl}/${locale}/group/${group?.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: seoTitle,
        item: `${siteConfig.baseUrl}/${locale}/tools/${tool.slug}`,
      },
    ],
  });

  const relatedItemListJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEn
      ? `${localizedToolName} related resources`
      : `Связанные материалы: ${localizedToolName}`,
    itemListElement: [
      ...relatedTools.slice(0, 6).map((rt, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: getToolName(rt, locale),
        url: `${siteConfig.baseUrl}/${locale}/tools/${rt.slug}`,
      })),
    ],
  });

  return (
    <Container size="xl" className="tool-page-shell pb-12 pt-5 sm:pt-7 md:pb-16 md:pt-9">
      <div className="tool-page-stack mx-auto flex min-w-0 max-w-none flex-col gap-6 md:gap-8">
        <nav aria-label={isEn ? "Breadcrumbs" : "Навигация"} className="flex min-w-0 items-center gap-2 text-xs font-medium text-[var(--color-text-muted)] sm:text-sm">
          <Link
            href={lHref(`/group/${group?.slug}`)}
            className="truncate text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
          >
            {localizedGroupName}
          </Link>
          <span aria-hidden="true" className="text-[var(--color-border-strong)]">/</span>
          <span className="truncate">{displayToolName}</span>
        </nav>

        {/* Quiet, task-first header. The tool itself is the focal point. */}
        <header
          className={
            tool.slug === "file-converter"
              ? "tool-page-heading max-w-5xl"
              : "tool-page-heading max-w-3xl"
          }
        >
          <h1 className="text-balance text-[clamp(1.85rem,1.45rem+2vw,3rem)] font-extrabold tracking-[-0.035em]">
            {getToolH1(tool, locale)}
          </h1>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
            {localizedToolDescription}
          </p>
        </header>

        {/* Tool body */}
        <ToolBody
          id="tool-workspace"
          variant="bare"
          padding="none"
          className="scroll-mt-24"
        >
          <ToolHost
            slug={tool.slug}
            notImplementedLabel={
              t("toolPage.underConstruction") ||
              (isEn ? "Under construction" : "В разработке")
            }
            notImplementedDescription={
              t("toolPage.underConstructionDesc", { name: displayToolName }) ||
              (isEn
                ? `${displayToolName} is coming soon.`
                : `${displayToolName} скоро появится.`)
            }
          />
        </ToolBody>

        {/* SEO content */}
        <details className="group rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold marker:content-none sm:px-5">
            <span>
              {isEn ? "About this tool and FAQ" : "Об инструменте и ответы"}
            </span>
            <span
              aria-hidden="true"
              className="text-lg text-[var(--color-text-muted)] transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="border-t border-[var(--color-border-subtle)] p-5 md:p-6">
            <h2 className="mb-2 text-xl font-bold">
              {t("toolPage.seoSection.whatIs", { name: displayToolName }) ||
                (isEn
                  ? `What is ${displayToolName}?`
                  : `Что такое ${displayToolName}?`)}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
              {seoContent.intro}
            </p>

            <h3 className="mt-5 mb-2 text-base font-bold">
              {t("toolPage.seoSection.howToUse") ||
                (isEn ? "How to use" : "Как пользоваться")}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
              {seoContent.howTo}
            </p>

            <h3 className="mt-5 mb-2 text-base font-bold">
              {t("toolPage.seoSection.features", { name: displayToolName }) ||
                (isEn
                  ? `${displayToolName} features`
                  : `Возможности ${displayToolName}`)}
            </h3>
            <ul className="grid gap-2">
              {seoContent.features.slice(0, 4).map((feat, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"
                >
                  <CheckCircle
                    size={16}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-[var(--color-text-muted)]"
                  />
                  {feat}
                </li>
              ))}
            </ul>

            <details className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text)]">
                {isEn
                  ? "When this tool helps"
                  : "Когда этот инструмент полезен"}
              </summary>
              <div className="mt-3 grid gap-3 text-sm leading-relaxed text-[var(--color-text-muted)] md:grid-cols-2">
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-[var(--color-text)]">
                    {t("toolPage.seoSection.whenToUse") ||
                      (isEn ? "When to use" : "Когда пригодится")}
                  </h3>
                  <p>{seoContent.useCases}</p>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-[var(--color-text)]">
                    {t("toolPage.seoSection.advantages") ||
                      (isEn ? "Advantages" : "Преимущества")}
                  </h3>
                  <p>{seoContent.advantages}</p>
                </div>
              </div>
            </details>
          </div>

          {/* FAQ */}
          {faqItems.length > 0 && (
            <section className="border-t border-[var(--color-border-subtle)] p-5 md:p-6">
              <h2 className="mb-3 text-xl font-bold">
                {isEn ? "FAQ" : "Частые вопросы"}
              </h2>
              <Accordion type="single" collapsible className="grid gap-2">
                {faqItems.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger>{faq.q}</AccordionTrigger>
                    <AccordionContent>{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}
        </details>

        {/* Related tools — useful after the primary task, never beside it. */}
        {relatedTools.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-bold">
              {t("toolPage.sidebar.relatedTools") ||
                (isEn ? "Related tools" : "Похожие инструменты")}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {relatedTools.map((rt) => (
                <ToolCard
                  key={rt.id}
                  tool={rt}
                  variant="horizontal"
                  hideFavorite
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: softwareApplicationJson }}
      />
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: faqJson }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbsJson }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: relatedItemListJson }}
      />
    </Container>
  );
}
