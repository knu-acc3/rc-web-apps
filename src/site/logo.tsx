import Link from "@/ui/link";
import { BRAND, BRAND_MARK } from "@/config/brand";
import { href, type Locale } from "@/i18n/config";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-[0.5625rem] bg-accent text-[0.8125rem] font-extrabold tracking-tight text-accent-fg ${className}`}
    >
      {BRAND_MARK}
    </span>
  );
}

export function Logo({ locale }: { locale: Locale }) {
  return (
    <Link href={href(locale)} className="flex shrink-0 items-center gap-2.5 rounded-[0.625rem]" aria-label={BRAND.name}>
      <LogoMark />
      <span className="hidden text-[1.0625rem] font-bold tracking-tight text-fg sm:inline">{BRAND.name}</span>
    </Link>
  );
}
