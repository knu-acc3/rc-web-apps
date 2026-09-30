import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Ruler,
  Smiley,
  Asterisk,
  Timer,
  Monitor,
} from "@phosphor-icons/react/dist/ssr";
import {
  toolGroups,
  getFeaturedTools,
  getStats,
  getToolsByGroup,
} from "@/src/data/tools";
import { getGroupName, getToolName, formatToolCount } from "@/src/data/toolLocalization";
import { type Locale } from "@/src/i18n/index";
import { getServerLanguage } from "@/src/i18n/server";
import { Container } from "@/src/components/ui/container";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Icon } from "@/src/components/Icon";
import ToolCard from "@/src/components/ToolCard";
import { HeroSearch } from "@/src/components/home/HeroSearch";
import { siteConfig } from "@/src/config/site.config";

const stats = getStats();

export default async function HomePage({ locale }: { locale: Locale }) {
  const { t, lHref } = await getServerLanguage(locale);
  const isEn = locale === "en";
  const featuredTools = getFeaturedTools();
  const groupToolsMap = new Map(
    toolGroups.map((g) => [g.id, getToolsByGroup(g.id)]),
  );

  const catalogHubs = [
    {
      id: "time-now",
      href: lHref("/time-now"),
      icon: Clock,
      color: "#0284c7",
      title: isEn ? "World Time & Time Zones" : "Мировое время и часовые пояса",
      badge: isEn ? "300+ cities" : "300+ городов",
      desc: isEn
        ? "Atomic live time in capitals and major cities worldwide, time difference calculator, and UTC/GMT offsets."
        : "Точное атомное время в столицах и городах мира, часовые пояса UTC/GMT и калькулятор разницы во времени.",
    },
    {
      id: "actual-size",
      href: lHref("/actual-size"),
      icon: Ruler,
      color: "#d97706",
      title: isEn ? "Actual Size 1:1 Scale" : "Реальные размеры экранов 1:1",
      badge: isEn ? "1:1 Calibrator" : "Онлайн-линейка 1:1",
      desc: isEn
        ? "Screen ruler calibrated by a credit card. View and compare physical dimensions of 100+ devices."
        : "Экранная линейка в масштабе 1:1 с калибровкой по карте. Физические размеры 100+ смартфонов и мониторов.",
    },
    {
      id: "emojis",
      href: lHref("/emojis"),
      icon: Smiley,
      color: "#ca8a04",
      title: isEn ? "Unicode Emoji Directory" : "Каталог эмодзи Unicode",
      badge: isEn ? "1,500+ emojis" : "1 500+ эмодзи",
      desc: isEn
        ? "Complete Unicode 15.1 emoji registry with semantic search, categories, and instant 1-click clipboard copy."
        : "Полная коллекция стандарта Unicode 15.1 с быстрым поиском по смыслу, категориями и копированием в 1 клик.",
    },
    {
      id: "symbols",
      href: lHref("/symbols"),
      icon: Asterisk,
      color: "#7c3aed",
      title: isEn ? "Special Symbols & Glyphs" : "Спецсимволы и знаки",
      badge: isEn ? "1,000+ glyphs" : "1 000+ знаков",
      desc: isEn
        ? "Typographic signs, arrows, currency symbols, math operators, and kaomoji for clean copy and design."
        : "Стрелки, валюты, математика, каомодзи, рамки и редкие типографические знаки для текстов и дизайна.",
    },
    {
      id: "timer",
      href: lHref("/timer"),
      icon: Timer,
      color: "#059669",
      title: isEn ? "Timers & Precision Stopwatch" : "Таймеры и секундомер",
      badge: isEn ? "120+ presets" : "120+ таймеров",
      desc: isEn
        ? "Ready presets for cooking, workouts, sleep, and Pomodoro focus, plus a split-lap stopwatch and countdowns."
        : "Готовые таймеры для тренировок, кухни, сна и Pomodoro, миллисекундный секундомер и обратный отсчет праздников.",
    },
    {
      id: "what-is-my",
      href: lHref("/what-is-my"),
      icon: Monitor,
      color: "#dc2626",
      title: isEn ? "System & Network Diagnostics" : "Диагностика системы и сети",
      badge: isEn ? "65 benchmarks" : "65 параметров",
      desc: isEn
        ? "Device and client audit: public IP, internet speed, screen resolution, refresh rate (Hz), GPU, and WebGL."
        : "Проверка оборудования и браузера: реальный IP, скорость сети, экран, герцы (Гц), видеокарта, WebGL и звук.",
    },
  ];

  return (
    <>
      <HeroSearch
        totalTools={stats.totalTools}
        isEn={isEn}
        searchPlaceholder={
          t("home.hero.searchPlaceholder") ||
          (isEn ? "Search tools…" : "Поиск инструментов…")
        }
      />

      <Container className="py-7 sm:py-10 md:py-12">
        {/* Specialized Compendiums & Services */}
        <section className="mb-10 sm:mb-14">
          <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {isEn
                  ? "Digital Catalogs & Reference Services"
                  : "Каталоги и цифровые сервисы"}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {isEn
                  ? "World clocks, 1:1 screen calibrators, Unicode emojis, symbols, timers, and hardware benchmarks"
                  : "Точное мировое время, калибровка экранов 1:1, эмодзи, спецсимволы, таймеры и тесты железа"}
              </p>
            </div>
            <span className="hidden text-sm font-semibold tabular-nums text-[var(--color-primary)] sm:inline-block">
              {isEn ? "6 hubs" : "6 разделов"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {catalogHubs.map((hub) => {
              const IconComp = hub.icon;
              return (
                <Link
                  key={hub.id}
                  href={hub.href}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 transition-all hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-muted)]/50 hover:shadow-sm"
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                        style={{
                          background: `color-mix(in oklab, ${hub.color} 14%, transparent)`,
                        }}
                      >
                        <IconComp
                          size={22}
                          weight="duotone"
                          style={{ color: hub.color }}
                        />
                      </span>
                      <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-text-muted)]">
                        {hub.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                      {hub.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)] sm:text-sm">
                      {hub.desc}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-hover)] dark:text-[var(--color-primary)] transition-all group-hover:translate-x-1">
                    <span>{isEn ? "Open catalog" : "Открыть раздел"}</span>
                    <ArrowRight size={14} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Categories */}
        <section id="categories" className="mb-10 scroll-mt-20 sm:mb-14">
          <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {t("home.sections.categories") ||
                  (isEn ? "Categories" : "Категории")}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {isEn ? "Choose a task area" : "Выберите тип задачи"}
              </p>
            </div>
            <span className="text-sm font-medium tabular-nums text-[var(--color-text-subtle)]">
              {stats.totalTools}
            </span>
          </div>
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {toolGroups.map((group) => {
              const groupTools = groupToolsMap.get(group.id) || [];
              return (
                <Link
                  key={group.id}
                  href={lHref(`/group/${group.slug}`)}
                  className="group flex min-h-[4.75rem] items-center gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3 transition-colors hover:bg-[var(--color-surface-muted)] sm:border-r sm:px-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-primary)]">
                    <Icon name={group.icon} size={20} weight="regular" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-[var(--color-text)] sm:text-[15px]">
                      {getGroupName(group, locale)}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--color-text-subtle)]">
                      {formatToolCount(groupTools.length, locale)}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-[var(--color-text-subtle)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured */}
        <section className="mb-8 sm:mb-12">
          <div className="mb-4 flex items-center justify-between sm:mb-5">
            <h2 className="text-lg font-bold sm:text-xl md:text-2xl">
              {t("home.sections.featuredTools") ||
                (isEn ? "Featured tools" : "Популярные")}
            </h2>
          </div>
          <div className="grid auto-rows-fr grid-cols-1 gap-2 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featuredTools.slice(0, 12).map((tool) => (
              <ToolCard key={tool.id} tool={tool} variant="compact" showGroup />
            ))}
          </div>
        </section>

        {/* Tools by category */}
        {toolGroups.slice(0, 4).map((group) => {
          const groupTools = groupToolsMap.get(group.id) || [];
          if (groupTools.length === 0) return null;
          return (
            <section key={group.id} className="mb-8 sm:mb-12">
              <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5 sm:gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                    style={{
                      background: `color-mix(in oklab, ${group.color} 14%, transparent)`,
                    }}
                  >
                    <Icon
                      name={group.icon}
                      size={18}
                      weight="duotone"
                      style={{ color: group.color }}
                    />
                  </span>
                  <h2 className="text-lg font-bold md:text-xl">
                    {getGroupName(group, locale)}
                  </h2>
                </div>
                <Button asChild variant="soft" size="sm">
                  <Link href={lHref(`/group/${group.slug}`)}>
                    {isEn
                      ? `All ${groupTools.length}`
                      : `Все ${groupTools.length}`}{" "}
                    <ArrowRight size={14} />
                  </Link>
                </Button>
              </div>
              <div className="grid auto-rows-fr grid-cols-1 gap-2 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {groupTools.slice(0, 6).map((tool) => (
                  <ToolCard key={tool.id} tool={tool} variant="compact" />
                ))}
              </div>
            </section>
          );
        })}

        {/* SEO block */}
        <Card className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7 md:p-9 shadow-sm">
          <header className="mb-5 border-b border-[var(--color-border-subtle)] pb-4">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl text-[var(--color-text)]">
              {isEn ? `About ${siteConfig.brandName}` : `О платформе ${siteConfig.brandName}`}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {isEn
                ? "Unified browser platform for daily digital tools, global time, and reference compendiums"
                : "Единая браузерная платформа для повседневных задач, мирового времени и цифровых справочников"}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-[var(--color-text-muted)] leading-relaxed">
            <div>
              <h3 className="mb-2 text-base font-semibold text-[var(--color-text)]">
                {isEn ? `${stats.totalTools} Interactive Tools` : `${stats.totalTools} интерактивные утилиты`}
              </h3>
              <p>
                {isEn
                  ? "Full spectrum of client-side utilities: converters (units, currencies, colors), calculators (scientific, mortgage, percentage), secure password generators, QR codes, JSON/CSS/JS formatters, regex tester, and PDF tools."
                  : "Полный набор клиентских утилит: конвертеры (величины, валюты, цвета), калькуляторы (инженерный, ипотечный, проценты), генераторы паролей и QR-кодов, форматирование JSON/CSS/JS, тестирование регулярных выражений и работа с PDF."}
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold text-[var(--color-text)]">
                {isEn ? "Specialized Catalogs" : "Специализированные справочники"}
              </h3>
              <p>
                {isEn
                  ? "High-precision reference hubs: atomic world clocks across 300+ major cities, calibrated 1:1 actual size screen measurement, complete Unicode 15.1 emoji catalog, 1,000+ typographic glyphs, and custom timers."
                  : "Высокоточные цифровые справочники: атомное мировое время в 300+ столицах, виртуальная линейка и калибратор реальных размеров 1:1, полный реестр эмодзи Unicode 15.1, более 1 000 спецсимволов и адаптивные таймеры."}
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold text-[var(--color-text)]">
                {isEn ? "Privacy & Zero Install" : "Приватность и нулевая установка"}
              </h3>
              <p>
                {isEn
                  ? "All processing takes place directly in your browser using modern WebAssembly and Web Workers. Your files, text, and personal data never leave your device, ensuring maximum security and instant performance."
                  : "Все вычисления выполняются прямо в вашем браузере с использованием WebAssembly и Web Workers. Ваши файлы, текст и персональные данные не передаются на серверы, обеспечивая мгновенную скорость и 100% приватность."}
              </p>
            </div>
          </div>
        </Card>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: siteConfig.brandName,
            url: `${siteConfig.baseUrl}/${locale}`,
            description: isEn
              ? `Over 3,000 free online tools, world clocks, 1:1 calibrators and reference compendiums`
              : `Более 3 000 бесплатных онлайн-инструментов, мировых часов, калибраторов 1:1 и цифровых справочников`,
            inLanguage: locale,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: isEn
              ? "Featured online tools"
              : "Популярные онлайн-инструменты",
            itemListOrder: "https://schema.org/ItemListOrderAscending",
            numberOfItems: featuredTools.length,
            itemListElement: featuredTools.slice(0, 12).map((tool, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${siteConfig.baseUrl}/${locale}/tools/${tool.slug}`,
              name: getToolName(tool, locale),
            })),
          }),
        }}
      />
      {locale === "ru" && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: siteConfig.brandName,
                alternateName: siteConfig.brandShort,
                url: `${siteConfig.baseUrl}/ru`,
                description: `Более 3 000 бесплатных онлайн-инструментов, мировое время и справочники для повседневных задач`,
                inLanguage: ["ru", "en"],
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: siteConfig.brandName,
                url: `${siteConfig.baseUrl}/ru`,
                logo: {
                  "@type": "ImageObject",
                  url: `${siteConfig.baseUrl}/web-app-manifest-512x512.png`,
                },
              }),
            }}
          />
        </>
      )}
    </>
  );
}
