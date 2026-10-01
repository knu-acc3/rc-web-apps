import Link from "@/ui/link";
import { BRAND } from "@/config/brand";
import { href, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { navigation } from "@/registry";
import { LangSwitch } from "./lang-switch";
import { LogoMark } from "./logo";
import { ThemeSwitch } from "./theme";

export function Footer({ locale }: { locale: Locale }) {
  const t = ui(locale);
  const groups = navigation(locale, 5);
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="container-page py-10">
        {/* Phones: category names only (the menu and the catalogue have the rest); wider screens: top tools too. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {groups.map((g) => (
            <nav key={g.id} aria-label={g.label} className="min-w-0">
              <a href={`${href(locale, ["all"])}#cat-${g.id}`} className="block py-1 text-sm font-semibold text-fg hover:text-accent sm:mb-2 sm:py-0">
                {g.label}
              </a>
              <ul className="flex flex-col gap-1.5 max-sm:hidden">
                {g.items.map((l) => (
                  <li key={l.path.join("/")}>
                    <a href={href(locale, l.path)} className="text-sm text-fg-2 hover:text-accent">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-5 border-t border-line pt-6 text-sm text-fg-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-2.5">
            <LogoMark className="size-7" />
            <span>
              © {new Date().getFullYear()} {BRAND.name}. {t.privacyNote}{" "}
              <span className="whitespace-nowrap">
                {t.author}{" "}
                <a href={BRAND.author.url} rel="author" className="font-semibold text-fg-2 underline-offset-2 hover:text-accent hover:underline">
                  {BRAND.author.name}
                </a>
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <nav aria-label={t.aboutSite} className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a href={href(locale, ["all"])} className="hover:text-accent">
                {t.catalog}
              </a>
              <Link href={href(locale, ["about"])} className="hover:text-accent">
                {t.aboutSite}
              </Link>
              <Link href={href(locale, ["about", "privacy"])} className="hover:text-accent">
                {t.privacy}
              </Link>
              <Link href={href(locale, ["about", "terms"])} className="hover:text-accent">
                {t.terms}
              </Link>
            </nav>
            <LangSwitch locale={locale} full />
            <ThemeSwitch labels={{ theme: t.theme, system: t.themeSystem, light: t.themeLight, dark: t.themeDark }} />
          </div>
        </div>
      </div>
    </footer>
  );
}
