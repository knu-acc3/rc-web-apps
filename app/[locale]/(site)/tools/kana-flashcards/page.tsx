import { Metadata } from 'next';
import { KanaFlashcards } from '@/src/components/interactive/KanaFlashcards';
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
    canonicalPath: `/${locale}/tools/kana-flashcards`,
    category: 'interactive',
    entityRu: 'Тренажер японской каны: хирагана и катакана',
    entityEn: 'Japanese Kana Flashcards: Hiragana & Katakana',
    locale: locale as Locale,
  });
}

export default async function KanaFlashcardsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';

  const title = isEn
    ? 'Japanese Kana Flashcards: Hiragana & Katakana'
    : 'Тренажер японской каны: хирагана и катакана онлайн';
  const description = isEn
    ? 'Interactive flashcards and mnemonic quizzes for mastering Japanese Hiragana and Katakana syllabaries with pronunciation guides and spaced repetition progress tracking.'
    : 'Интерактивные карточки для быстрого изучения японских слоговых азбук хирагана и катакана с аудио-произношением, тестами на чтение и отслеживанием прогресса.';

  const breadcrumbsSchema = buildBreadcrumbSchema([
    { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
    { name: isEn ? 'Tools' : 'Инструменты', url: `${siteConfig.baseUrl}/${locale}/catalog` },
    { name: title, url: `${siteConfig.baseUrl}/${locale}/tools/kana-flashcards` },
  ]);

  const webAppSchema = buildWebApplicationSchema({
    name: title,
    description,
    url: `${siteConfig.baseUrl}/${locale}/tools/kana-flashcards`,
    category: 'EducationalApplication',
  });

  const faqs = isEn
    ? [
        {
          question: 'Which Japanese characters and sound variations are covered?',
          answer:
            'The learning deck covers all 46 core characters (Gojuon) for both Hiragana and Katakana, plus voiced sounds (Dakuon: g, z, d, b), semi-voiced (Handakuon: p), and compound digraphs (Yoon: kya, kyu, kyo).',
        },
        {
          question: 'Does the trainer track my learning progress without an account?',
          answer:
            'Yes. Correct answers, streak records, and review intervals are automatically tracked in your browser LocalStorage with 100% offline capability and zero sign-up friction.',
        },
        {
          question: 'Is this trainer suitable for complete beginners preparing for JLPT N5?',
          answer:
            'Yes. Mastering Hiragana and Katakana is the essential foundation for JLPT N5 and basic Japanese communication. Spaced repetition tests reinforce rapid visual recognition.',
        },
      ]
    : [
        {
          question: 'Какие ряды и варианты японских слогов входят в программу обучения?',
          answer:
            'Тренажер охватывает все 46 базовых знаков (годзюон) для хираганы и катаканы, звонкие звуки (дакуон: g, z, d, b), полузвонкие (хан-дакуон: p) и дифтонги (ёон: kya, kyu, kyo).',
        },
        {
          question: 'Сохраняется ли прогресс обучения без создания учётной записи?',
          answer:
            'Да, статистика ответов, серии правильных попыток и статус освоения символов сохраняются в локальном хранилище (LocalStorage) браузера, позволяя тренироваться офлайн в удобном темпе.',
        },
        {
          question: 'Подходит ли тренажер для подготовки к экзамену JLPT N5?',
          answer:
            'Да, уверенное чтение азбук хирагана и катакана — обязательный первый шаг для сдачи уровня JLPT N5 и чтения японских текстов без транскрипции ромаджи.',
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

      <KanaFlashcards />

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
