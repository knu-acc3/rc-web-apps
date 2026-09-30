import Link from 'next/link';
import { House, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import { Container } from '@/src/components/ui/container';
import { Button } from '@/src/components/ui/button';
import { getFeaturedTools } from '@/src/data/tools';
import { getToolName } from '@/src/data/toolLocalization';
import { SearchTrigger } from '@/src/components/layout/SearchTrigger';

export default function NotFound() {
  const popular = getFeaturedTools().slice(0, 6);

  return (
    <Container className="py-16 text-center">
      <p className="text-7xl font-extrabold text-[var(--color-text-subtle)] md:text-8xl">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
        The page may have moved. Search the catalog or open one of the popular tools below.
      </p>
      <div className="mx-auto mt-6 max-w-xl">
        <SearchTrigger
          variant="hero"
          placeholder="Search tools..."
          enableShortcut
        />
      </div>
      <div className="mx-auto mt-5 flex max-w-xl flex-wrap justify-center gap-2">
        {popular.map(tool => (
          <Link
            key={tool.slug}
            href={`/ru/tools/${tool.slug}`}
            className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
          >
            {getToolName(tool, 'ru')}
          </Link>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild>
          <Link href="/ru">
            <House size={16} /> Home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/ru?search=1">
            <MagnifyingGlass size={16} /> Search
          </Link>
        </Button>
      </div>
    </Container>
  );
}
