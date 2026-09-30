import "./globals.css";
import type { Metadata } from "next";
import Link from "@/ui/link";

export const metadata: Metadata = { title: "404", robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <html lang="ru">
      <body className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <p className="text-6xl font-bold text-fg-3">404</p>
        <h1 className="mt-4 text-2xl font-bold">Страница не найдена · Page not found</h1>
        <div className="mt-6 flex gap-4">
          <Link href="/ru" className="text-accent underline">
            На главную
          </Link>
          <Link href="/en" className="text-accent underline">
            Home
          </Link>
        </div>
      </body>
    </html>
  );
}
