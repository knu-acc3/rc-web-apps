import { Skeleton } from '@/src/components/ui/skeleton';

export function ToolSkeleton() {
  return (
    <div aria-busy className="grid w-full gap-3 p-4">
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}
