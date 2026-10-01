import type { Locale } from "@/i18n/config";
import type { QA } from "@/registry/types";

/** Build a per-locale FAQ record. */
export const faq = (ru: QA[], en: QA[]): Record<Locale, QA[]> => ({ ru, en });

export const PRIVACY = {
  ru: "Файлы обрабатываются прямо в браузере, в фоновом потоке: они не загружаются на сервер, а страница не зависает даже на больших документах.",
  en: "Files are processed right in your browser, in a background thread: nothing is uploaded, and the page stays responsive even with large documents.",
};

export const PRIVACY_QA = {
  ru: { q: "Файлы куда-нибудь загружаются?", a: "Нет. Вся обработка идёт на вашем устройстве с помощью JavaScript: файл не покидает браузер, его не видим ни мы, ни кто-либо ещё. После закрытия вкладки ничего не остаётся." },
  en: { q: "Are my files uploaded anywhere?", a: "No. Everything runs on your device in JavaScript: the file never leaves the browser, and nobody — including us — can see it. Nothing remains after you close the tab." },
};
