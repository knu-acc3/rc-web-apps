import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { SystemDiagnosticsSuite } from '@/src/components/diagnostics/SystemDiagnosticsSuite';
import { DiagnosticHero } from '@/src/components/diagnostics/DiagnosticHero';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { buildBreadcrumbSchema, buildWebApplicationSchema } from '@/src/lib/seo/schemaGenerator';
import { siteConfig } from '@/src/config/site.config';
import { LOCALES, type Locale } from '@/src/i18n/index';
import {
  DIAGNOSTIC_METRICS,
  DIAGNOSTIC_ALIASES,
  getDiagnosticMetric,
} from '@/src/lib/diagnostics/metrics';

export const dynamic = 'force-static';
export const dynamicParams = true;

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    for (const metric of DIAGNOSTIC_METRICS) {
      params.push({ locale, slug: metric.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const canonicalSlug = DIAGNOSTIC_ALIASES[slug] || slug;
  const metric = getDiagnosticMetric(canonicalSlug);
  if (!metric) return {};

  return generateUniqueMetadata({
    canonicalPath: `/${locale}/what-is-my/${canonicalSlug}`,
    category: 'what-is-my',
    entityRu: metric.nameRu,
    entityEn: metric.nameEn,
    locale: locale as Locale,
  });
}

export default async function DiagnosticSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug, locale } = await params;
  if (slug in DIAGNOSTIC_ALIASES) {
    redirect(`/${locale}/what-is-my/${DIAGNOSTIC_ALIASES[slug]}`);
  }
  const metric = getDiagnosticMetric(slug);
  if (!metric) notFound();

  const isEn = locale === 'en';
  const name = isEn ? metric.nameEn : metric.nameRu;
  const desc = isEn ? metric.descriptionEn : metric.descriptionRu;

  const breadcrumbsSchema = buildBreadcrumbSchema([
    { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
    { name: isEn ? 'Diagnostics' : 'Диагностика', url: `${siteConfig.baseUrl}/${locale}/what-is-my` },
    { name, url: `${siteConfig.baseUrl}/${locale}/what-is-my/${slug}` },
  ]);

  const webAppSchema = buildWebApplicationSchema({
    name,
    description: desc,
    url: `${siteConfig.baseUrl}/${locale}/what-is-my/${slug}`,
    category: 'DiagnosticApplication',
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col gap-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {desc}
        </p>
      </div>
      <DiagnosticHero slug={slug} locale={locale} />
      <SystemDiagnosticsSuite />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
    </div>
  );
}
