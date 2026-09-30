'use client';

import Link from 'next/link';
import { Heart, ArrowLeft } from '@phosphor-icons/react';
import { getToolBySlug, type Tool } from '@/src/data/tools';
import { useFavorites } from '@/src/hooks/useFavorites';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { Container } from '@/src/components/ui/container';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { EmptyState } from '@/src/components/ui/empty-state';
import ToolCard from '@/src/components/ToolCard';

export default function FavoritesPage() {
  const { favoriteSlugs } = useFavorites();
  const { locale, lHref } = useLanguage();
  const isEn = locale === 'en';
  const favoriteTools = favoriteSlugs.map(s => getToolBySlug(s)).filter(Boolean) as Tool[];

  return (
    <Container className="py-6 md:py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={lHref('/')}>
          <ArrowLeft size={14} /> {isEn ? 'Home' : 'Главная'}
        </Link>
      </Button>

      <header className="mb-8 flex items-start gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)]">
          <Heart size={26} weight="fill" className="text-[var(--color-primary)]" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {isEn ? 'Favorites' : 'Избранное'}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            {isEn
              ? `${favoriteTools.length} saved tool${favoriteTools.length !== 1 ? 's' : ''}`
              : `${favoriteTools.length} сохранённых`}
          </p>
        </div>
        {favoriteTools.length > 0 && <Badge variant="primary" className="ml-auto">{favoriteTools.length}</Badge>}
      </header>

      {favoriteTools.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 min-[320px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {favoriteTools.map(tool => (
            <ToolCard key={tool.id} tool={tool} showGroup />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Heart size={28} weight="duotone" />}
          title={isEn ? 'No favorites yet' : 'Пока ничего нет'}
          description={
            isEn
              ? 'Click the heart icon on any tool card to add it to your favorites.'
              : 'Нажмите на сердечко на карточке инструмента, чтобы добавить в избранное.'
          }
          action={
            <Button asChild>
              <Link href={lHref('/')}>{isEn ? 'Browse tools' : 'Смотреть инструменты'}</Link>
            </Button>
          }
        />
      )}
    </Container>
  );
}
