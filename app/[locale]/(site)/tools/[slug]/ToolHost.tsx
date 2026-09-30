'use client';

import {
  Component,
  Suspense,
  use,
  useEffect,
  useState,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { toolComponents } from '@/src/tools/registry';
import { useRecentTools } from '@/src/hooks/useRecentTools';
import { ArrowClockwise, ArrowRight, BellSimple, WarningCircle, Wrench } from '@phosphor-icons/react';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Button } from '@/src/components/ui/button';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { trackEvent } from '@/src/components/layout/Analytics';
import { getToolBySlug, getToolsByGroup, tools, type Tool } from '@/src/data/tools';
import { relatedToolsMap } from '@/src/data/relatedTools';
import { canonicalizeToolSlug } from '@/src/seo/canonicalSlugs';
import { getToolName } from '@/src/data/toolLocalization';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { ToolSkeleton } from '@/src/components/ToolSkeleton';
import { ToolWorkspace } from '@/src/components/tool/workspace';
import { FilePasteProvider } from '@/src/components/providers/FilePasteProvider';

interface Props {
  slug: string;
  notImplementedLabel: string;
  notImplementedDescription: string;
}

class ToolChunkLoadError extends Error {
  readonly cause: unknown;
  readonly attempt: number;

  constructor(cause: unknown, attempt: number) {
    super('The tool bundle could not be loaded.');
    this.name = 'ToolChunkLoadError';
    this.cause = cause;
    this.attempt = attempt;
  }
}

type ToolModule = { default: ComponentType };
type ToolLoader = () => Promise<ToolModule>;

interface ToolLoadCacheEntry {
  loader: ToolLoader;
  promise: Promise<ToolModule>;
}

const toolLoadCache = new Map<string, ToolLoadCacheEntry>();

function getToolLoadPromise(slug: string, loadTool: ToolLoader, attempt: number) {
  const cacheKey = `${slug}:${attempt}`;
  const cached = toolLoadCache.get(cacheKey);

  if (cached?.loader === loadTool) return cached.promise;

  const promise = loadTool().catch((error: unknown) => {
    throw new ToolChunkLoadError(error, attempt);
  });
  toolLoadCache.set(cacheKey, { loader: loadTool, promise });
  return promise;
}

interface LoadedToolProps {
  slug: string;
  loadTool: ToolLoader;
  attempt: number;
}

function LoadedTool({ slug, loadTool, attempt }: LoadedToolProps) {
  const { default: Tool } = use(getToolLoadPromise(slug, loadTool, attempt));
  return (
    <ToolWorkspace className="tool-workspace" maxWidth="full" data-tool-slug={slug}>
      <Tool />
    </ToolWorkspace>
  );
}

interface ToolLoadBoundaryProps {
  children: ReactNode;
  isEn: boolean;
  onRetry: () => void;
}

interface ToolLoadBoundaryState {
  error: Error | null;
}

class ToolLoadBoundary extends Component<ToolLoadBoundaryProps, ToolLoadBoundaryState> {
  state: ToolLoadBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ToolLoadBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (error instanceof ToolChunkLoadError) {
      console.error('Tool bundle failed to load:', error.cause, info);
    }
  }

  render() {
    const { children, isEn, onRetry } = this.props;
    const { error } = this.state;

    if (!error) return children;

    // Rendering bugs belong to the regular tool error boundary. Only an
    // import rejection is handled here as a recoverable loading problem.
    if (!(error instanceof ToolChunkLoadError)) throw error;

    return (
      <EmptyState
        role="alert"
        aria-live="assertive"
        icon={<WarningCircle size={24} weight="duotone" />}
        title={isEn ? 'Could not load this tool' : 'Не удалось загрузить инструмент'}
        description={
          isEn
            ? 'Check your connection and try loading the tool again.'
            : 'Проверьте соединение и попробуйте загрузить инструмент ещё раз.'
        }
        action={
          <Button type="button" onClick={onRetry}>
            <ArrowClockwise size={16} />
            {isEn ? 'Try again' : 'Попробовать снова'}
          </Button>
        }
      />
    );
  }
}

export function ToolHost({ slug, notImplementedLabel, notImplementedDescription }: Props) {
  const { addRecentTool } = useRecentTools();
  const { locale, lHref } = useLanguage();
  const isEn = locale === 'en';
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    addRecentTool(slug);
    trackEvent('tool_open', { tool: slug });
  }, [slug, addRecentTool]);

  const loadTool = toolComponents[slug];

  if (!loadTool) {
    const currentTool = getToolBySlug(slug);
    const implementedTools = tools.filter(t => t.implemented && !t.hidden);
    const mapped = (relatedToolsMap[slug] || [])
      .map(s => implementedTools.find(t => t.slug === canonicalizeToolSlug(s)))
      .filter((tool): tool is Tool => Boolean(tool));
    const sameGroup = currentTool
      ? getToolsByGroup(currentTool.groupId).filter(tool => tool.slug !== slug)
      : [];
    const related = [...mapped, ...sameGroup]
      .filter((tool, index, list) => list.findIndex(item => item.slug === tool.slug) === index)
      .slice(0, 4);

    return (
      <EmptyState
        icon={<Wrench size={24} weight="duotone" />}
        title={notImplementedLabel}
        description={notImplementedDescription}
        action={
          <div className="grid gap-3">
            {related.length > 0 && (
              <div className="grid gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {isEn ? 'Similar tools' : 'Похожие инструменты'}
                </div>
                <div className="flex max-w-lg flex-wrap justify-center gap-2">
                  {related.map(tool => (
                    <Link
                      key={tool.slug}
                      href={lHref(`/tools/${tool.slug}`)}
                      className="inline-flex min-h-10 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-border-strong)]"
                    >
                      {getToolName(tool, locale)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="secondary">
                <Link href={lHref('/')}>
                  {isEn ? 'Open catalog' : 'Перейти к каталогу'}
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button type="button" variant="outline" disabled>
                <BellSimple size={16} />
                {isEn ? 'Subscribe for updates' : 'Подписаться на обновления'}
              </Button>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <>
      <FilePasteProvider />
      <ErrorBoundary key={`${slug}:${loadAttempt}`}>
        <ToolLoadBoundary
          key={`${slug}:${loadAttempt}`}
          isEn={isEn}
          onRetry={() => setLoadAttempt(attempt => attempt + 1)}
        >
          <Suspense fallback={<ToolSkeleton />}>
            <LoadedTool slug={slug} loadTool={loadTool} attempt={loadAttempt} />
          </Suspense>
        </ToolLoadBoundary>
      </ErrorBoundary>
    </>
  );
}
