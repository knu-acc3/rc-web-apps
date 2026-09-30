import Link from "next/link";
import type { Metadata } from "next";
import {
  CaretRight,
  House,
  MapPin,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { getToolBySlug } from "@/src/data/tools";
import { type Locale } from "@/src/i18n/index";
import { getServerLanguage } from "@/src/i18n/server";
import { Container } from "@/src/components/ui/container";
import ToolCard from "@/src/components/ToolCard";
import { siteConfig } from "@/src/config/site.config";

const KZ_TOOL_SLUGS = [
  "iin-validator",
  "kz-phone-formatter",
  "kz-salary-calc",
  "kz-iban-validator",
  "kz-holidays",
  "kz-postal-code",
  "kz-address-format",
] as const;

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const title = isEn
    ? "Online tools for Kazakhstan"
    : "Онлайн-инструменты для Казахстана";
  const description = isEn
    ? "Seven focused Kazakhstan tools: IIN, phone, salary, IBAN, holidays, postal codes and address formatting."
    : "Семь специализированных инструментов для Казахстана: ИИН, телефоны, зарплата, IBAN, праздники, индексы и адреса.";
  const url = `${siteConfig.baseUrl}/${locale}/kz`;

  return {
    metadataBase: new URL(siteConfig.baseUrl),
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ru: `${siteConfig.baseUrl}/ru/kz`,
        en: `${siteConfig.baseUrl}/en/kz`,
        "x-default": `${siteConfig.baseUrl}/ru/kz`,
      },
    },
    openGraph: {
      type: "website",
      locale: isEn ? "en_US" : "ru_RU",
      siteName: siteConfig.brandName,
      url,
      title,
      description,
      images: [
        {
          url: `${siteConfig.baseUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteConfig.baseUrl}/opengraph-image`],
    },
  };
}

export default async function KzIndexPage({ params }: PageProps) {
  const { locale } = await params;
  const { lHref } = await getServerLanguage(locale);
  const isEn = locale === "en";
  const kzTools = KZ_TOOL_SLUGS.map((slug) => getToolBySlug(slug)).filter(
    (tool): tool is NonNullable<typeof tool> => Boolean(tool?.implemented),
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isEn
      ? "Online tools for Kazakhstan"
      : "Онлайн-инструменты для Казахстана",
    description: isEn
      ? "A focused collection of online utilities made specifically for Kazakhstan."
      : "Подборка онлайн-инструментов, созданных специально для Казахстана.",
    url: `${siteConfig.baseUrl}/${locale}/kz`,
    inLanguage: locale,
    about: { "@type": "Country", name: "Kazakhstan" },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: kzTools.length,
      itemListElement: kzTools.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteConfig.baseUrl}/${locale}/tools/${tool.slug}`,
      })),
    },
  };

  return (
    <Container className="py-6 md:py-10 lg:py-14">
      <nav
        aria-label="Breadcrumbs"
        className="mb-5 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]"
      >
        <Link
          href={lHref("/")}
          className="inline-flex min-h-11 items-center gap-1 hover:text-[var(--color-text)]"
        >
          <House size={15} /> {isEn ? "Home" : "Главная"}
        </Link>
        <CaretRight size={13} className="text-[var(--color-text-subtle)]" />
        <span className="font-semibold text-[var(--color-text)]">
          {isEn ? "Kazakhstan tools" : "Инструменты Казахстана"}
        </span>
      </nav>

      <header className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7 md:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <MapPin size={25} weight="duotone" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
          Kazakhstan · Қазақстан
        </p>
        <h1 className="mt-2 max-w-3xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          {isEn
            ? "Seven tools built for Kazakhstan"
            : "Семь инструментов для Казахстана"}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
          {isEn
            ? "Only country-specific utilities are collected here. General converters and calculators remain in the main catalog."
            : "Здесь собраны только инструменты, которым действительно нужна специфика Казахстана. Обычные конвертеры и калькуляторы находятся в общем каталоге."}
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
          <ShieldCheck size={19} className="text-[var(--color-success)]" />
          <span>
            {isEn
              ? "Sensitive values are processed locally in your browser."
              : "Чувствительные данные обрабатываются локально в браузере."}
          </span>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="kz-tools-title">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2
              id="kz-tools-title"
              className="text-2xl font-extrabold tracking-tight"
            >
              {isEn ? "Choose a task" : "Выберите задачу"}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {kzTools.length}{" "}
              {isEn ? "specialized tools" : "специализированных инструментов"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kzTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} hideFavorite />
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </Container>
  );
}
