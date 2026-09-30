import "./globals.css";
import type { Metadata } from "next";
import { THEME_SCRIPT } from "@/site/theme";
import { LEGACY_SCRIPT } from "@/site/legacy";
import Link from "@/ui/link";

export const metadata: Metadata = { title: "404", robots: { index: false } };

/** Last-resort 404 outside the locale layout (the proxy answers unknown pages with /[locale]/404). */
export default function GlobalNotFound() {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LEGACY_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col items-center justify-center bg-stage p-6 text-center">
        <p className="text-sm font-semibold tracking-widest text-accent uppercase">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg">Страница не найдена</h1>
        <p className="mt-1 text-lg text-fg-2" lang="en">
          Page not found
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/ru" className="inline-flex h-11 items-center rounded-[0.5rem] bg-accent px-5 font-medium text-accent-fg hover:bg-accent-hover">
            На главную
          </Link>
          <Link href="/en" lang="en" className="inline-flex h-11 items-center rounded-[0.5rem] border border-line bg-surface px-5 font-medium text-fg hover:border-line-strong">
            English version
          </Link>
        </div>
      </body>
    </html>
  );
}
