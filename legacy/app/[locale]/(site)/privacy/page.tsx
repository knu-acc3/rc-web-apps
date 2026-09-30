import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import { Container } from '@/src/components/ui/container';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { AnalyticsPreferencesButton } from '@/src/components/layout/CookieConsent';
import { getServerLanguage } from '@/src/i18n/server';
import { type Locale, isLocale, DEFAULT_LOCALE } from '@/src/i18n/index';
import { siteConfig } from '@/src/config/site.config';

const BASE_URL = siteConfig.baseUrl;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const isEn = safeLocale === 'en';
  const title = isEn ? 'Privacy Policy' : 'Политика приватности';
  const description = isEn
    ? `How ${siteConfig.brandName} handles analytics consent, local storage, and user files.`
    : `Как ${siteConfig.brandName} обрабатывает согласие на аналитику, localStorage и пользовательские файлы.`;
  const canonical = `${BASE_URL}/${safeLocale}/privacy`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ru: `${BASE_URL}/ru/privacy`,
        en: `${BASE_URL}/en/privacy`,
        'x-default': `${BASE_URL}/ru/privacy`,
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

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { lHref } = await getServerLanguage(safeLocale);
  const isEn = safeLocale === 'en';
  const copy = isEn
    ? {
        title: 'Privacy Policy',
        updated: 'Last updated: 2026-07-11',
        localTitle: 'Local-first tools',
        localText: 'Most tools process text, images, PDFs, and generated data directly in your browser. Files are not uploaded unless a tool explicitly calls an API route for a URL-fetching workflow.',
        analyticsTitle: 'Analytics',
        analyticsText: 'Vercel Analytics and Yandex Metrika are loaded only after analytics consent. Yandex Webvisor is disabled. If you choose necessary-only mode, analytics scripts are not initialized; revoking consent reloads the page to stop already loaded trackers. You can reopen analytics preferences from the footer.',
        storageTitle: 'Local storage',
        storageText: 'The app stores preferences such as favorites, recent tools, language, theme, presets, and tool history in your browser. Do not store secrets or sensitive tokens in tool fields.',
        contactTitle: 'Contact',
        contactText: 'For privacy questions, contact the site owner through rc-web.kz.',
        back: 'Back to tools',
      }
    : {
        title: 'Политика приватности',
        updated: 'Обновлено: 11 июля 2026',
        localTitle: 'Локальная обработка',
        localText: 'Большинство инструментов обрабатывают текст, изображения, PDF и сгенерированные данные прямо в браузере. Файлы не загружаются на сервер, кроме случаев, где инструмент явно вызывает API для получения данных по URL.',
        analyticsTitle: 'Аналитика',
        analyticsText: 'Vercel Analytics и Yandex Metrika загружаются только после согласия на аналитику. В Yandex Webvisor отключён. Если выбран режим «только необходимые», аналитические скрипты не запускаются; при отзыве согласия страница перезагружается, чтобы остановить уже загруженные трекеры. Настройки аналитики можно снова открыть в футере.',
        storageTitle: 'LocalStorage',
        storageText: 'Приложение хранит избранное, недавние инструменты, язык, тему, пресеты и историю отдельных инструментов в вашем браузере. Не храните секреты, токены и чувствительные данные в полях инструментов.',
        contactTitle: 'Контакты',
        contactText: 'По вопросам приватности можно связаться с владельцем сайта через rc-web.kz.',
        back: 'Назад к инструментам',
      };

  return (
    <Container className="py-8 md:py-12">
      <header className="mb-6 flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <ShieldCheck size={26} weight="duotone" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{copy.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{copy.updated}</p>
        </div>
      </header>

      <Card className="grid gap-5 p-5 text-sm leading-relaxed text-[var(--color-text-muted)] md:p-6">
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--color-text)]">{copy.localTitle}</h2>
          <p>{copy.localText}</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--color-text)]">{copy.analyticsTitle}</h2>
          <p>{copy.analyticsText}</p>
          <AnalyticsPreferencesButton className="mt-3" />
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--color-text)]">{copy.storageTitle}</h2>
          <p>{copy.storageText}</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--color-text)]">{copy.contactTitle}</h2>
          <p>{copy.contactText}</p>
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
