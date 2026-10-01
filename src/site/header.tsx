import { LayoutGrid, Menu, X } from "lucide-react";
import { href, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { sectionsByCategory } from "@/registry";
import { CATEGORY_LOOK } from "@/registry/categories";
import { buttonClass } from "@/ui/button";
import { IconTile } from "@/ui/icon";
import { LangSwitch } from "./lang-switch";
import { Logo } from "./logo";
import { SearchBox } from "./search";
import { ThemeSwitch, ThemeToggle } from "./theme";

/**
 * Site header. Universal icons where words aren't needed (search, menu, theme); words where an icon would
 * be a guess ("All tools"). Phone: logo · 🔍 · EN · ☰. Desktop: logo · live search · all tools · EN · theme.
 * The phone menu is a native popover; browsers without it get a small fallback script (see layout).
 */
export function Header({ locale }: { locale: Locale }) {
  const t = ui(locale);
  const themeLabels = { theme: t.theme, system: t.themeSystem, light: t.themeLight, dark: t.themeDark };
  const searchLabels = { search: t.searchTools, placeholder: t.searchPlaceholder, empty: t.searchEmpty, hint: t.searchHint, close: t.close };
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 pt-[env(safe-area-inset-top)] supports-[backdrop-filter]:bg-bg/85 supports-[backdrop-filter]:backdrop-blur">
      <div className="container-page flex h-14 items-center gap-1 sm:gap-2">
        <Logo locale={locale} />
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2">
          <SearchBox locale={locale} labels={searchLabels} />
          <a href={href(locale, ["all"])} className={buttonClass("tonal", "md", "hidden! gap-2 px-4 sm:inline-flex!")}>
            <LayoutGrid aria-hidden />
            <span className="hidden lg:inline">{t.catalog}</span>
            <span className="lg:hidden">{t.catalogShort}</span>
          </a>
          <LangSwitch locale={locale} />
          <ThemeToggle labels={themeLabels} className="hidden! sm:inline-flex!" />
          <button type="button" popoverTarget="site-menu" className={buttonClass("ghost", "icon", "sm:hidden!")} aria-label={t.menuOpen} title={t.menu}>
            <Menu aria-hidden />
          </button>
        </div>
      </div>
      <SiteMenu locale={locale} />
    </header>
  );
}

/** Phone menu: catalogue by category, language and theme with text labels. */
function SiteMenu({ locale }: { locale: Locale }) {
  const t = ui(locale);
  const groups = sectionsByCategory(locale);
  return (
    <div
      id="site-menu"
      popover="auto"
      className="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] bottom-0 z-50 m-0 h-auto max-h-none w-full max-w-none overflow-y-auto border-0 border-t border-line bg-bg p-0 text-fg"
    >
      <div className="container-page flex flex-col gap-6 pb-10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <a href={href(locale, ["all"])} className={buttonClass("primary", "lg", "flex-1")}>
            <LayoutGrid aria-hidden />
            {t.catalog}
          </a>
          <button type="button" popoverTarget="site-menu" popoverTargetAction="hide" className={buttonClass("secondary", "icon", "size-12!")} aria-label={t.close}>
            <X aria-hidden />
          </button>
        </div>
        <nav aria-label={t.categories}>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-1 min-[420px]:grid-cols-2">
            {groups.map((g) => (
              <li key={g.id}>
                <a href={`${href(locale, ["all"])}#cat-${g.id}`} className="flex min-h-12 items-center gap-3 rounded-[0.75rem] px-2 py-1.5 hover:bg-surface-2">
                  <IconTile name={CATEGORY_LOOK[g.id].icon} hue={CATEGORY_LOOK[g.id].hue} size="sm" />
                  <span className="font-medium">{g.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-4 border-t border-line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-fg-2">{t.language}</span>
            <LangSwitch locale={locale} full />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-fg-2">{t.theme}</span>
            <ThemeSwitch labels={{ theme: t.theme, system: t.themeSystem, light: t.themeLight, dark: t.themeDark }} />
          </div>
        </div>
      </div>
    </div>
  );
}
