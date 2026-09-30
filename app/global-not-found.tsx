import './globals.css';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import Link from 'next/link';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['500', '700', '800'],
});

import { siteConfig } from '@/src/config/site.config';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
  title: `404 — Page not found | ${siteConfig.brandName}`,
  description: 'The requested page does not exist.',
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-7xl font-extrabold text-[var(--color-text-subtle)] md:text-8xl">404</p>
          <h1 className="mt-2 text-2xl font-bold">Страница не найдена</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Возможно, адрес изменился. Вернитесь в каталог инструментов.
          </p>
          <Link
            href="/ru"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-foreground)]"
          >
            На главную
          </Link>
        </main>
      </body>
    </html>
  );
}
