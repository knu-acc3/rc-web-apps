import { LayoutGrid, X } from "lucide-react";
import { href, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { navigation } from "@/registry";
import { buttonClass } from "@/ui/button";
import { LangSwitch } from "./lang-switch";
import { Logo } from "./logo";
import { SearchButton } from "./search";
import { ThemeToggle } from "./theme";

export function Header({ locale }: { locale: Locale }) {
  const t = ui(locale);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 pt-[env(safe-area-inset-top)] supports-[backdrop-filter]:bg-bg/85 supports-[backdrop-filter]:backdrop-blur">
      <div className="container-page flex h-14 items-center gap-2 sm:gap-3">
        <Logo locale={locale} />
        <button
          type="button"
          popoverTarget="all-tools"
          className={buttonClass("ghost", "md", "ml-1 gap-2 px-3 max-sm:px-2.5")}
          aria-label={t.allTools}
        >
          <LayoutGrid aria-hidden />
          <span className="max-sm:sr-only">{t.allTools}</span>
        </button>
        <div className="ml-auto flex items-center gap-1">
          <SearchButton
            locale={locale}
            labels={{ search: t.search, placeholder: t.searchPlaceholder, empty: t.searchEmpty, hint: t.searchHint, close: t.close }}
          />
          <LangSwitch locale={locale} />
          <ThemeToggle labels={{ theme: t.theme, system: t.themeSystem, light: t.themeLight, dark: t.themeDark }} />
        </div>
      </div>
      <AllToolsMenu locale={locale} />
    </header>
  );
}

/** Tool catalogue by category. Uses the native Popover API — no JavaScript. */
function AllToolsMenu({ locale }: { locale: Locale }) {
  const t = ui(locale);
  const groups = navigation(locale, 8);
  return (
    <div
      id="all-tools"
      popover="auto"
      className="m-0 mt-[calc(56px+env(safe-area-inset-top))] max-h-[calc(100dvh-56px)] w-screen max-w-none overflow-y-auto border-0 border-b border-line bg-surface p-0 text-fg shadow-[var(--shadow-overlay)] backdrop:bg-black/30"
    >
      <div className="container-page py-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold">{t.allTools}</p>
          <button type="button" popoverTarget="all-tools" popoverTargetAction="hide" className={buttonClass("ghost", "icon")} aria-label={t.close}>
            <X aria-hidden />
          </button>
        </div>
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.id}>
              <p className="mb-2 text-[13px] font-semibold tracking-wide text-fg-3 uppercase">{g.label}</p>
              <ul className="flex flex-col gap-0.5">
                {g.items.map((l) => (
                  <li key={l.path.join("/")}>
                    <a href={href(locale, l.path)} className="nav-link">
                      {l.label}
                    </a>
                  </li>
                ))}
                {g.total > g.items.length && (
                  <li>
                    <a href={`${href(locale)}#cat-${g.id}`} className="nav-link text-fg-3">
                      {t.showAll} · {g.total}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
