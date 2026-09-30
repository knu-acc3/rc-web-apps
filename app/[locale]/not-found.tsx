import Link from "@/ui/link";
import { buttonClass } from "@/ui/button";

/** 404 inside a locale. not-found.tsx has no params, so the page is bilingual. */
export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="text-6xl font-bold tracking-tight text-fg-3">404</p>
      <h1 className="mt-4 text-2xl font-bold text-fg">Страница не найдена · Page not found</h1>
      <p className="mt-2 max-w-md text-fg-2">
        Такой страницы нет — воспользуйтесь поиском или перейдите на главную. This page does not exist.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/ru" className={buttonClass("primary")}>
          На главную
        </Link>
        <Link href="/en" className={buttonClass("outline")}>
          Home (EN)
        </Link>
      </div>
    </div>
  );
}
