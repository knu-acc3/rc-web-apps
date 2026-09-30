"use client";

import { Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";

/** A single quiet row of main options + an optional "more settings" disclosure. */
export function OptionsBar({ children, more, locale }: { children: ReactNode; more?: ReactNode; locale: Locale }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 px-4 py-3">{children}</div>
      {more && (
        <details className="group border-t border-line">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-fg-2 hover:text-fg">
            <Settings2 className="size-4" aria-hidden />
            {locale === "ru" ? "Дополнительно" : "More options"}
          </summary>
          <div className="grid gap-4 px-4 pb-4 pt-1 sm:grid-cols-2">{more}</div>
        </details>
      )}
    </div>
  );
}
