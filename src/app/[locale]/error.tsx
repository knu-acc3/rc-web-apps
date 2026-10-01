"use client";

import { useParams } from "next/navigation";
import { buttonClass } from "@/ui/button";

const T = {
  ru: { title: "Что-то пошло не так", text: "Произошла ошибка при отображении страницы.", retry: "Повторить", home: "На главную" },
  en: { title: "Something went wrong", text: "An error occurred while rendering this page.", retry: "Try again", home: "Go home" },
};

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "en" ? "en" : "ru";
  const t = T[locale];
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="text-2xl font-bold text-fg">{t.title}</h1>
      <p className="mt-2 text-fg-2">{t.text}</p>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={reset} className={buttonClass("primary")}>
          {t.retry}
        </button>
        <a href={`/${locale}`} className={buttonClass("outline")}>
          {t.home}
        </a>
      </div>
    </div>
  );
}
