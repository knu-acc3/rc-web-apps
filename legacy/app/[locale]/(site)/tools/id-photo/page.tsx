import { Metadata } from 'next';
import { IdPhotoComposer } from '@/src/components/interactive/IdPhotoComposer';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { buildBreadcrumbSchema, buildWebApplicationSchema, buildFaqSchema } from '@/src/lib/seo/schemaGenerator';
import { siteConfig } from '@/src/config/site.config';
import { type Locale } from '@/src/i18n/index';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/src/components/ui/accordion';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateUniqueMetadata({
    canonicalPath: `/${locale}/tools/id-photo`,
    category: 'interactive',
    entityRu: 'Фото на документы онлайн (300 DPI)',
    entityEn: 'Passport & ID Photo Maker 300 DPI',
    locale: locale as Locale,
  });
}

export default async function IdPhotoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';

  const title = isEn
    ? 'Passport & ID Photo Maker (300 DPI)'
    : 'Фото на документы онлайн (300 DPI)';
  const description = isEn
    ? 'Free biometric passport, visa, and ID photo composer. Automatic framing guides, 300 DPI print sheet generator, and client-side background adjustments with zero server uploads.'
    : 'Бесплатный конструктор фото на паспорт, визу, водительские права и удостоверения с разметкой биометрических пропорций, плотностью 300 DPI и раскладкой на лист 10x15 см.';

  const breadcrumbsSchema = buildBreadcrumbSchema([
    { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
    { name: isEn ? 'Tools' : 'Инструменты', url: `${siteConfig.baseUrl}/${locale}/catalog` },
    { name: title, url: `${siteConfig.baseUrl}/${locale}/tools/id-photo` },
  ]);

  const webAppSchema = buildWebApplicationSchema({
    name: title,
    description,
    url: `${siteConfig.baseUrl}/${locale}/tools/id-photo`,
    category: 'PhotographyApplication',
  });

  const faqs = isEn
    ? [
        {
          question: 'Does the exported print layout strictly meet official 300 DPI specifications?',
          answer:
            'Yes. Photos and multi-up print templates (standard 4x6 inch / 10x15 cm photo paper) are rendered at exactly 300 DPI physical dot density to pass biometric passport and consular verification.',
        },
        {
          question: 'Are my personal portrait photos uploaded to any external server?',
          answer:
            'No. All cropping, angle adjustments, color enhancement, and sheet composition execute completely inside your browser memory (HTML5 Canvas). Your photos never leave your device.',
        },
        {
          question: 'Which official document photo sizes are supported?',
          answer:
            'The tool provides calibrated presets for Schengen visas (35x45 mm), US/India visas (2x2 inches / 50x50 mm), Russian internal/international passports, driver licenses, and custom dimensions.',
        },
      ]
    : [
        {
          question: 'Соответствует ли готовый макет официальным требованиям 300 DPI?',
          answer:
            'Да, сформированные фотографии и раскладки на стандартный лист фотобумаги 10x15 см экспортируются со строгим полиграфическим разрешением 300 DPI, что гарантирует прохождение проверок в визовых центрах и МФЦ.',
        },
        {
          question: 'Загружаются ли мои личные фотографии на сервер сервиса?',
          answer:
            'Нет. Все операции по кадрированию, центрированию по биометрическим линиям и формированию печатного листа производятся локально в оперативной памяти браузера без отправки в интернет.',
        },
        {
          question: 'Какие форматы документов и виз поддерживает генератор?',
          answer:
            'Доступны официальные шаблоны для паспорта РФ (35x45 мм), шенгенской визы, визы в США (50x50 мм / 2x2 дюйма), водительского удостоверения, студенческого билета, а также произвольный ввод размеров.',
        },
      ];

  const faqSchema = buildFaqSchema(faqs);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col gap-8">
      <header className="border-b border-[var(--color-border-subtle)] pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="text-[var(--color-text-muted)] mt-2 text-sm sm:text-base leading-relaxed">
          {description}
        </p>
      </header>

      <IdPhotoComposer />

      <section aria-label={isEn ? 'Frequently Asked Questions' : 'Часто задаваемые вопросы'} className="mt-6 border-t border-[var(--color-border-subtle)] pt-6">
        <h2 className="text-xl font-bold mb-4">
          {isEn ? 'Frequently Asked Questions' : 'Часто задаваемые вопросы'}
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-left font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  );
}
