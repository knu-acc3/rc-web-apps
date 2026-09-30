'use client';

import Link from 'next/link';
import { ArrowClockwise, House } from '@phosphor-icons/react';
import { Container } from '@/src/components/ui/container';
import { Button } from '@/src/components/ui/button';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-16 text-center">
      <p className="text-7xl font-extrabold text-[var(--color-text-subtle)] md:text-8xl">500</p>
      <h1 className="mt-2 text-2xl font-bold">Что-то пошло не так</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
        Произошла непредвиденная ошибка. Попробуйте обновить страницу.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <ArrowClockwise size={16} /> Попробовать снова
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <House size={16} /> На главную
          </Link>
        </Button>
      </div>
    </Container>
  );
}
