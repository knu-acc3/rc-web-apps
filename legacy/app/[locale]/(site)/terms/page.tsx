import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from '@phosphor-icons/react/dist/ssr';
import { Container } from '@/src/components/ui/container';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { getServerLanguage } from '@/src/i18n/server';
import { type Locale, isLocale, DEFAULT_LOCALE } from '@/src/i18n/index';
import { siteConfig } from '@/src/config/site.config';

const BASE_URL = siteConfig.baseUrl;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const isEn = safeLocale === 'en';
  const title = isEn ? 'Terms of Service' : 'Условия использования';
  const description = isEn
    ? `Terms for using ${siteConfig.brandName} browser utilities.`
    : `Условия использования браузерных утилит ${siteConfig.brandName}.`;
  const canonical = `${BASE_URL}/${safeLocale}/terms`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ru: `${BASE_URL}/ru/terms`,
        en: `${BASE_URL}/en/terms`,
        'x-default': `${BASE_URL}/ru/terms`,
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${title} | ${siteConfig.brandName}`,
      description,
      images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630, alt: siteConfig.brandName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.brandName}`,
      description,
      images: [`${BASE_URL}/opengraph-image`],
    },
    robots: { index: true, follow: true },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { lHref } = await getServerLanguage(safeLocale);
  const isEn = safeLocale === 'en';
  const copy = isEn
    ? {
        title: 'Terms of Service',
        updated: 'Last updated: 2026-05-20',
        riskTitle: 'Use at your own risk',
        riskText: `${siteConfig.brandName} is provided as-is without warranties. Always verify important financial, legal, medical, security, and document results before relying on them.`,
        useTitle: 'Acceptable use',
        useText: 'Do not use the service to attack third-party systems, process content you do not have rights to use, or attempt to bypass browser and server safeguards.',
        adviceTitle: 'No professional advice',
        adviceText: 'Calculators and validators are utilities, not professional advice. Confirm critical decisions with qualified specialists or official sources.',
        back: 'Back to tools',
      }
    : {
        title: 'Условия использования',
        updated: 'Обновлено: 20 мая 2026',
        riskTitle: 'Использование на свой риск',
        riskText: `${siteConfig.brandName} предоставляется как есть, без гарантий. Важные финансовые, юридические, медицинские, security- и документные результаты нужно проверять перед использованием.`,
        useTitle: 'Допустимое использование',
        useText: 'Не используйте сервис для атак на сторонние системы, обработки контента без прав или попыток обойти браузерные и серверные ограничения.',
        adviceTitle: 'Не является профессиональной консультацией',
        adviceText: 'Калькуляторы и валидаторы являются утилитами, а не профессиональной консультацией. Критичные решения подтверждайте у специалистов или по официальным источникам.',
        back: 'Назад к инструментам',
      };

  return (
    <Container className="py-8 md:py-12">
      <header className="mb-6 flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <FileText size={26} weight="duotone" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{copy.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{copy.updated}</p>
        </div>
      </header>

      <Card className="grid gap-5 p-5 text-sm leading-relaxed text-[var(--color-text-muted)] md:p-6">
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--color-text)]">{copy.riskTitle}</h2>
          <p>{copy.riskText}</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--color-text)]">{copy.useTitle}</h2>
          <p>{copy.useText}</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--color-text)]">{copy.adviceTitle}</h2>
          <p>{copy.adviceText}</p>
        </section>
      </Card>

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href={lHref('/')}>{copy.back}</Link>
        </Button>
      </div>
    </Container>
  );
}
