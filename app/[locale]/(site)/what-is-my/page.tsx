import Link from 'next/link';
import { Metadata } from 'next';
import { SystemDiagnosticsSuite } from '@/src/components/diagnostics/SystemDiagnosticsSuite';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { type Locale } from '@/src/i18n/index';
import { DIAGNOSTIC_METRICS } from '@/src/lib/diagnostics/metrics';

export const dynamic = 'force-static';

const categoryLabels = {
  network: { ru: 'Сеть и IP', en: 'Network & IP' },
  screen: { ru: 'Экран и дисплей', en: 'Screen & Display' },
  hardware: { ru: 'Процессор и GPU', en: 'CPU & Hardware' },
  browser: { ru: 'Браузер и клиент', en: 'Browser & Environment' },
  battery: { ru: 'Батарея и питание', en: 'Battery & Power' },
  os: { ru: 'Операционная система', en: 'Operating System' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateUniqueMetadata({
    canonicalPath: `/${locale}/what-is-my`,
    category: 'what-is-my',
    entityName: locale === 'en' ? 'System Diagnostics & IP' : 'Диагностика системы и IP',
    locale: locale as Locale,
  });
}

export default async function WhatIsMyIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';

  const categories = ['network', 'screen', 'hardware', 'browser', 'battery', 'os'] as const;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
          {isEn ? 'Client System & Network Diagnostics' : 'Диагностика клиентской системы и сети'}
        </h1>
        <p className="text-muted-foreground">
          {isEn
            ? 'Comprehensive client-side diagnostic suite covering 65 parameters: IP address, display metrics, GPU hardware, WebRTC privacy, battery telemetry, and browser capabilities.'
            : 'Полный комплекс клиентской диагностики из 65 спецификаций: внешний IP-адрес, характеристики экрана, GPU, защита от утечек WebRTC, состояние батареи и возможности браузера.'}
        </p>
      </div>

      <SystemDiagnosticsSuite />

      <div className="flex flex-col gap-6 pt-4 border-t">
        <h2 className="text-xl font-bold tracking-tight">
          {isEn ? 'All 65 Diagnostic Specifications' : 'Все 65 диагностических спецификаций'}
        </h2>

        {categories.map((catKey) => {
          const groupMetrics = DIAGNOSTIC_METRICS.filter((m) => m.category === catKey);
          const label = isEn ? categoryLabels[catKey].en : categoryLabels[catKey].ru;

          return (
            <div key={catKey} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {label} ({groupMetrics.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {groupMetrics.map((m) => (
                  <Link
                    key={m.slug}
                    href={`/${locale}/what-is-my/${m.slug}`}
                    className="px-3 py-1.5 border rounded-xl bg-card hover:bg-secondary text-xs sm:text-sm font-medium transition-colors"
                  >
                    {isEn ? m.nameEn : m.nameRu}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
