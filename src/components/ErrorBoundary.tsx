'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
import { WarningCircle, ArrowClockwise } from '@phosphor-icons/react';
import { Button } from '@/src/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by Error Boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
          <WarningCircle size={32} weight="duotone" />
        </div>
        <h1 className="text-xl font-bold">Что-то пошло не так</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную.
        </p>
        {process.env.NODE_ENV === 'development' && this.state.error && (
          <pre className="max-h-40 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-left text-xs">
            <code>{this.state.error.toString()}</code>
          </pre>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button onClick={this.handleReset}>
            <ArrowClockwise size={16} /> Попробовать ещё раз
          </Button>
          <Button asChild variant="outline">
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </div>
    );
  }
}
