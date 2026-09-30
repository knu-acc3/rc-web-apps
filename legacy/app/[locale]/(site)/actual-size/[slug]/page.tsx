import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import devicesData from '@/src/data/actual-size/devices.json';
import type { DeviceSpec } from '@/src/types/actual-size';
import { DeviceActualSizeViewer } from '@/src/components/actual-size/DeviceActualSizeViewer';
import { ScreenCalibrator } from '@/src/components/actual-size/ScreenCalibrator';
import { InteractiveRuler } from '@/src/components/actual-size/InteractiveRuler';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { buildBreadcrumbSchema, buildProductDeviceSchema } from '@/src/lib/seo/schemaGenerator';
import { siteConfig } from '@/src/config/site.config';
import { LOCALES, type Locale } from '@/src/i18n/index';

const devices = devicesData as DeviceSpec[];

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  const specialSlugs = ['ruler', 'credit-card'];
  for (const locale of LOCALES) {
    for (const slug of specialSlugs) {
      params.push({ locale, slug });
    }
    for (const dev of devices) {
      params.push({ locale, slug: dev.slug });
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
  let entityRu = slug;
  let entityEn = slug;

  if (slug === 'ruler') {
    entityRu = 'Экранная линейка 1:1';
    entityEn = 'Screen Ruler 1:1';
  } else if (slug === 'credit-card') {
    entityRu = 'Размер банковской карты 1:1';
    entityEn = 'Credit Card Size 1:1';
  } else {
    const dev = devices.find((d) => d.slug === slug);
    if (dev) {
      entityRu = dev.modelRu;
      entityEn = dev.modelEn;
    }
  }

  return generateUniqueMetadata({
    canonicalPath: `/${locale}/actual-size/${slug}`,
    category: 'actual-size',
    entityRu,
    entityEn,
    locale: locale as Locale,
  });
}

export default async function ActualSizeSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isEn = locale === 'en';

  if (slug === 'ruler') {
    const title = isEn ? 'Screen Ruler 1:1' : 'Экранная линейка 1:1';
    const breadcrumbs = buildBreadcrumbSchema([
      { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
      { name: isEn ? 'Actual Size' : 'Реальный размер 1:1', url: `${siteConfig.baseUrl}/${locale}/actual-size` },
      { name: title, url: `${siteConfig.baseUrl}/${locale}/actual-size/ruler` },
    ]);
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
        <InteractiveRuler />
        <ScreenCalibrator />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
        />
      </div>
    );
  }

  if (slug === 'credit-card') {
    const title = isEn ? 'Credit Card Calibration 1:1' : 'Калибровка по банковской карте 1:1';
    const breadcrumbs = buildBreadcrumbSchema([
      { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
      { name: isEn ? 'Actual Size' : 'Реальный размер 1:1', url: `${siteConfig.baseUrl}/${locale}/actual-size` },
      { name: title, url: `${siteConfig.baseUrl}/${locale}/actual-size/credit-card` },
    ]);
    return (
      <div className="container mx-auto px-4 py-8">
        <ScreenCalibrator />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
        />
      </div>
    );
  }

  const dev = devices.find((d) => d.slug === slug);
  if (!dev) notFound();

  const devTitle = isEn ? dev.modelEn : dev.modelRu;
  const breadcrumbs = buildBreadcrumbSchema([
    { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
    { name: isEn ? 'Actual Size' : 'Реальный размер 1:1', url: `${siteConfig.baseUrl}/${locale}/actual-size` },
    { name: devTitle, url: `${siteConfig.baseUrl}/${locale}/actual-size/${dev.slug}` },
  ]);

  const productSchema = buildProductDeviceSchema({
    name: devTitle,
    description: isEn
      ? `${dev.modelEn} in actual 1:1 physical size calibrated for screen.`
      : `${dev.modelRu} в реальном физическом масштабе 1:1 на экране.`,
    url: `${siteConfig.baseUrl}/${locale}/actual-size/${dev.slug}`,
    widthMm: dev.widthMm,
    heightMm: dev.heightMm,
    depthMm: dev.thicknessMm,
    brand: dev.brand || 'Device',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <DeviceActualSizeViewer device={dev} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
    </div>
  );
}
