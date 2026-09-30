import Link from 'next/link';
import { CaretRight, House } from '@phosphor-icons/react/dist/ssr';
import { getGroupBySlug, getToolsByGroup, toolGroups } from '@/src/data/tools';
import { getGroupName, getToolDescription, getToolName } from '@/src/data/toolLocalization';
import { groupSeoContentEn } from '@/src/data/groupSeoContent';
import { type Locale } from '@/src/i18n/index';
import { getServerLanguage } from '@/src/i18n/server';
import { Container } from '@/src/components/ui/container';
import { Card } from '@/src/components/ui/card';
import { Icon } from '@/src/components/Icon';
import ToolCard from '@/src/components/ToolCard';
import { siteConfig } from '@/src/config/site.config';

interface Props {
  slug: string;
  locale: Locale;
}

export default async function GroupPage({ slug, locale }: Props) {
  const group = getGroupBySlug(slug);
  const { lHref } = await getServerLanguage(locale);
  const isEn = locale === 'en';

  if (!group) {
    return (
      <Container className="py-12 text-center">
        <h1 className="mb-3 text-2xl font-bold">{isEn ? 'Category not found' : 'Категория не найдена'}</h1>
        <Link href={lHref('/')} className="text-[var(--color-primary)] hover:underline">
          {isEn ? 'Go home' : 'На главную'}
        </Link>
      </Container>
    );
  }

  const groupTools = getToolsByGroup(group.id).filter(t => !t.hidden);
  const groupName = getGroupName(group, locale);
  const seoEn = groupSeoContentEn[group.id];
  const pageTitle = isEn
    ? (seoEn?.h1 || `${groupName} — ${groupTools.length} free tools`)
    : `${groupName} — ${groupTools.length} бесплатных инструментов`;
  const groupDescription = isEn ? group.descriptionEn || group.description : group.description;
  const toolGuideTitle = isEn
    ? `Tools in ${groupName}`
    : `Инструменты категории «${groupName}»`;
  const canonicalUrl = `${siteConfig.baseUrl}/${locale}/group/${group.slug}`;
  const collectionPageJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#collection`,
    name: pageTitle,
    description: groupDescription,
    url: canonicalUrl,
    inLanguage: locale,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.brandName,
      url: `${siteConfig.baseUrl}/${locale}`,
    },
    mainEntity: {
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#tools`,
      name: toolGuideTitle,
      numberOfItems: groupTools.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: groupTools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'WebApplication',
          name: getToolName(tool, locale),
          description: getToolDescription(tool, locale),
          url: `${siteConfig.baseUrl}/${locale}/tools/${tool.slug}`,
          inLanguage: locale,
        },
      })),
    },
  });

  return (
    <Container className="py-6 md:py-8">
      <nav aria-label="Breadcrumbs" className="mb-4 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
        <Link href={lHref('/')} className="inline-flex items-center gap-1 hover:text-[var(--color-text)]">
          <House size={14} /> {isEn ? 'Home' : 'Главная'}
        </Link>
        <CaretRight size={12} className="text-[var(--color-text-subtle)]" />
        <span className="font-semibold text-[var(--color-text)]">{groupName}</span>
      </nav>

      <header className="mb-8 max-w-3xl">
          <h1 className="text-balance text-3xl font-extrabold tracking-[-0.035em] md:text-4xl">
            {pageTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
            {groupDescription}
          </p>
      </header>

      {groupTools.length > 0 ? (
        <div className="grid auto-rows-fr grid-cols-1 gap-2 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {groupTools.map(tool => (
            <ToolCard key={tool.id} tool={tool} variant="compact" />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-[var(--color-text-muted)]">
          {isEn ? 'No tools in this category yet.' : 'Пока нет инструментов в этой категории.'}
        </Card>
      )}

      {groupTools.length > 0 && (
        <section className="mt-10" aria-labelledby="group-tool-guide-title">
          <div className="max-w-3xl">
            <h2 id="group-tool-guide-title" className="text-xl font-bold tracking-tight md:text-2xl">
              {toolGuideTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? `Compare all ${groupTools.length} tools by their catalog descriptions and open the one you need.`
                : `Сравните все ${groupTools.length} инструментов по описаниям из каталога и откройте подходящий.`}
            </p>
          </div>

          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {groupTools.map(tool => (
              <li key={tool.id}>
                <Link
                  href={lHref(`/tools/${tool.slug}`)}
                  className="group flex h-full min-h-24 items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[var(--color-text)]">
                      {getToolName(tool, locale)}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {getToolDescription(tool, locale)}
                    </span>
                  </span>
                  <CaretRight
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[var(--color-text-subtle)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isEn && seoEn && (
        <section
          className="mt-12 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7 md:p-8"
          aria-labelledby="group-about-title"
        >
          <div className="max-w-3xl">
            <h2
              id="group-about-title"
              className="text-2xl font-extrabold tracking-tight"
            >
              About {groupName}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
              {seoEn.intro}
            </p>
          </div>

          <div className="mt-7 grid gap-7 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-bold">What these tools can do</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {seoEn.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold">When to use them</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {seoEn.useCases}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Other categories */}
      <section className="mt-12">
        <h2 className="mb-3 text-lg font-bold">{isEn ? 'Other categories' : 'Другие категории'}</h2>
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {toolGroups
            .filter(g => g.id !== group.id)
            .map(g => (
              <Link
                key={g.id}
                href={lHref(`/group/${g.slug}`)}
                className="inline-flex min-h-11 items-center gap-2 border-b border-[var(--color-border-subtle)] px-1 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
              >
                <Icon name={g.icon} size={16} weight="regular" />
                {getGroupName(g, locale)}
              </Link>
            ))}
          </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: collectionPageJson }}
      />
    </Container>
  );
}
