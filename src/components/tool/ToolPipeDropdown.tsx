'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShareNetwork, ArrowSquareOut, CaretDown } from '@phosphor-icons/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/src/components/ui/button';
import { findCompatibleTools, ToolPipeBroker, type PipePayload } from '@/src/lib/pipe/ToolPipeBroker';
import { type ToolDataType } from '@/src/data/tools';
import { getToolName } from '@/src/data/toolLocalization';

export interface ToolPipeDropdownProps {
  currentSlug: string;
  produces: readonly ToolDataType[];
  getData: () => PipePayload | Promise<PipePayload>;
  locale?: string;
}

export function ToolPipeDropdown({
  currentSlug,
  produces,
  getData,
  locale = 'ru',
}: ToolPipeDropdownProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEn = locale === 'en';

  const compatible = findCompatibleTools(produces, currentSlug).slice(0, 8);
  if (compatible.length === 0) return null;

  const handlePipeTo = async (targetSlug: string) => {
    try {
      setLoading(true);
      const data = await getData();
      const targetUrl = await ToolPipeBroker.sendDataToTool(targetSlug, data, locale);
      router.push(targetUrl);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          className="gap-1.5 text-xs font-medium"
          title={isEn ? 'Pass data to another tool...' : 'Передать данные в другой инструмент...'}
        >
          <ShareNetwork size={14} className="text-[var(--color-primary)]" />
          <span>{isEn ? 'Send to tool...' : 'Передать в инструмент...'}</span>
          <CaretDown size={12} className="opacity-60" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={5}
          className="z-50 min-w-[200px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-xl animate-in fade-in-80"
        >
          <DropdownMenu.Label className="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
            {isEn ? 'Compatible tools' : 'Совместимые утилиты'}
          </DropdownMenu.Label>
          {compatible.map((tool) => (
            <DropdownMenu.Item
              key={tool.slug}
              onSelect={() => handlePipeTo(tool.slug)}
              className="flex cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-2 text-xs text-[var(--color-text)] outline-none hover:bg-[var(--color-surface-muted)] focus:bg-[var(--color-surface-muted)]"
            >
              <span>{getToolName(tool, locale)}</span>
              <ArrowSquareOut size={13} className="text-[var(--color-text-muted)]" />
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
