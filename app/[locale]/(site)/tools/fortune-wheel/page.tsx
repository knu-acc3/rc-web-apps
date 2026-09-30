import { Metadata } from 'next';
import { WheelOfFortune } from '@/src/components/interactive/WheelOfFortune';
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
    canonicalPath: `/${locale}/tools/fortune-wheel`,
    category: 'interactive',
    entityRu: 'Колесо фортуны и случайного выбора',
    entityEn: 'Wheel of Fortune & Random Picker',
    locale: locale as Locale,
  });
}

export default async function FortuneWheelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';

  const title = isEn
    ? 'Wheel of Fortune & Random Decision Picker'
    : 'Колесо фортуны и случайного выбора онлайн';
  const description = isEn
    ? 'Interactive online wheel of fortune for giveaways, contests, random prize draws, and making unbiased decisions. Customize sectors, probabilities, and spin with realistic physics in your browser.'
    : 'Интерактивное колесо фортуны для проведения конкурсов, розыгрышей, жеребьёвки и принятия случайных решений. Настраивайте список вариантов, цвета секторов и запускайте вращение прямо в браузере.';

  const breadcrumbsSchema = buildBreadcrumbSchema([
    { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
    { name: isEn ? 'Tools' : 'Инструменты', url: `${siteConfig.baseUrl}/${locale}/catalog` },
    { name: title, url: `${siteConfig.baseUrl}/${locale}/tools/fortune-wheel` },
  ]);

  const webAppSchema = buildWebApplicationSchema({
    name: title,
    description,
    url: `${siteConfig.baseUrl}/${locale}/tools/fortune-wheel`,
    category: 'EntertainmentApplication',
  });

  const faqs = isEn
    ? [
        {
          question: 'How does the random wheel algorithm determine the outcome?',
          answer:
            'The wheel utilizes browser-native cryptographic entropy (crypto.getRandomValues) paired with a physics-based angular deceleration equation to guarantee 100% unbiased, tamper-proof selection.',
        },
        {
          question: 'Can I customize options, weights, and wheel sector colors?',
          answer:
            'Yes. You can add unlimited custom options, configure individual weighting odds, tweak color palettes, and store or reset customized wheel configurations directly in your browser.',
        },
        {
          question: 'Is user registration or internet connection required after loading?',
          answer:
            'No registration or payment is required. The wheel operates entirely on the client side in your web browser and continues functioning seamlessly even if your device goes offline.',
        },
      ]
    : [
        {
          question: 'Как работает генератор случайного выбора в колесе фортуны?',
          answer:
            'Алгоритм вращения использует криптографически стойкий генератор случайных чисел браузера (crypto.getRandomValues) с реалистичной физикой затухания скорости и плавным замедлением, исключая любые подтасовки.',
        },
        {
          question: 'Можно ли настраивать сектора, шансы и цветовую гамму вариантов?',
          answer:
            'Да, вы можете добавлять неограниченное количество вариантов, задавать индивидуальные веса для секторов, менять цвета секторов и сохранять списки для повторного использования.',
        },
        {
          question: 'Нужна ли регистрация или подключение к интернету для вращения колеса?',
          answer:
            'Регистрация не требуется. Колесо фортуны работает полностью на стороне клиента в браузере и продолжает исправно работать даже при кратковременной потере интернет-соединения.',
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

      <WheelOfFortune />

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
