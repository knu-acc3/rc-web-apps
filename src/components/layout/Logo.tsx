import Link from 'next/link';
import { Toolbox } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/src/lib/cn';
import { siteConfig } from '@/src/config/site.config';

export function Logo({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn('inline-flex shrink-0 items-center gap-2 font-extrabold tracking-tight text-[var(--color-text)] transition-opacity hover:opacity-90', className)}
      aria-label={siteConfig.brandName}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-text)] text-[var(--color-surface)] shadow-[var(--shadow-soft)]">
        <Toolbox size={20} weight="bold" />
      </span>
      <span className="hidden text-lg leading-none xs:inline font-extrabold">
        {siteConfig.brandName}
      </span>
    </Link>
  );
}
