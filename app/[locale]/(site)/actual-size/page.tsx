import Link from 'next/link';
import { Metadata } from 'next';
import devicesData from '@/src/data/actual-size/devices.json';
import type { DeviceSpec } from '@/src/types/actual-size';
import { ScreenCalibrator } from '@/src/components/actual-size/ScreenCalibrator';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { type Locale } from '@/src/i18n/index';

const devices = devicesData as DeviceSpec[];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateUniqueMetadata({
    canonicalPath: `/${locale}/actual-size`,
    category: 'actual-size',
    entityName: locale === 'en' ? 'Actual Size 1:1 Catalog' : 'Каталог реальных размеров 1:1',
    locale: locale as Locale,
  });
}

export default async function ActualSizeIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          {isEn ? 'Actual Size 1:1 Device & Screen Scaler' : 'Реальные размеры гаджетов 1:1 на экране'}
        </h1>
        <p className="text-muted-foreground">
          {isEn
            ? 'Compare physical device dimensions, view a calibrated screen ruler, and calibrate your display PPI using a standard credit card.'
            : 'Точное отображение гаджетов в натуральную величину на мониторе. Калибровка экрана по банковской карте и экранная линейка.'}
        </p>
      </div>

      <ScreenCalibrator />

      <div className="flex gap-4">
        <Link
          href={`/${locale}/actual-size/ruler`}
          className="p-4 border rounded-2xl bg-card hover:border-primary flex-1 text-center font-bold"
        >
          {isEn ? '📏 Calibrated Screen Ruler' : '📏 Экранная линейка 1:1'}
        </Link>
        <Link
          href={`/${locale}/actual-size/credit-card`}
          className="p-4 border rounded-2xl bg-card hover:border-primary flex-1 text-center font-bold"
        >
          {isEn ? '💳 Bank Card Calibration' : '💳 Калибровка по карте'}
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">
          {isEn ? 'Devices Catalog' : 'Каталог устройств'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {devices.map((dev) => (
            <Link
              key={dev.slug}
              href={`/${locale}/actual-size/${dev.slug}`}
              className="p-3 border rounded-xl hover:border-primary transition-colors bg-card flex flex-col justify-between"
            >
              <div className="font-semibold text-sm truncate">
                {isEn ? dev.modelEn : dev.modelRu}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {dev.widthMm} × {dev.heightMm} мм {dev.screenDiagonalInches ? `(${dev.screenDiagonalInches}″)` : ''}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
