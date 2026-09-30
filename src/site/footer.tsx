import Link from "@/ui/link";
import { BRAND } from "@/config/brand";
import { href, LOCALES, LOCALE_LABEL, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { navigation } from "@/registry";
import { LogoMark } from "./logo";

export function Footer({ locale }: { locale: Locale }) {
  const t = ui(locale);
  const groups = navigation(locale, 6);
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="container-page py-10">
        <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <nav key={g.id} aria-label={g.label}>
              <p className="mb-2.5 text-sm font-semibold text-fg">{g.label}</p>
              <ul className="flex flex-col gap-1.5">
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
        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 text-sm text-fg-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <span>
              © {new Date().getFullYear()} {BRAND.name}. {t.privacyNote}
            </span>
          </div>
          <nav aria-label={t.aboutSite} className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href={href(locale, ["about"])} className="hover:text-accent">
              {t.aboutSite}
            </Link>
            <Link href={href(locale, ["about", "privacy"])} className="hover:text-accent">
              {t.privacy}
            </Link>
            <Link href={href(locale, ["about", "terms"])} className="hover:text-accent">
              {t.terms}
            </Link>
            {LOCALES.map((l) => (
              <Link key={l} href={href(l)} hrefLang={l} lang={l} className={l === locale ? "text-fg-2" : "hover:text-accent"}>
                {LOCALE_LABEL[l]}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
