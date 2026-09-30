import { cn } from "@/lib/cn";

/** Top-down mouse drawing; index = MouseEvent.button (0 left, 1 middle, 2 right, 3 back, 4 forward). */
export function MouseDiagram({ down, tested, wheel, labels }: { down: readonly boolean[]; tested: readonly boolean[]; wheel: boolean; labels: readonly string[] }) {
  const cls = (i: number) =>
    cn("stroke-[1.5] transition-colors duration-75", down[i] ? "fill-accent stroke-accent" : tested[i] ? "fill-ok-soft stroke-ok" : "fill-surface-2 stroke-line-strong");
  return (
    <svg viewBox="0 0 160 240" className="h-56 w-auto sm:h-64" role="img" aria-label={labels.join(", ")}>
      <rect x="20" y="6" width="120" height="228" rx="60" className="fill-surface stroke-line-strong stroke-[1.5]" />
      <path d="M80 6 V100 H20 V66 A60 60 0 0 1 80 6 Z" className={cls(0)} />
      <path d="M80 6 A60 60 0 0 1 140 66 V100 H80 Z" className={cls(2)} />
      <rect x="71" y="26" width="18" height="48" rx="9" className={cn(cls(1), wheel && !down[1] && !tested[1] && "fill-ok-soft stroke-ok")} />
      <line x1="75" y1="40" x2="85" y2="40" className="stroke-fg-3" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="75" y1="50" x2="85" y2="50" className="stroke-fg-3" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="75" y1="60" x2="85" y2="60" className="stroke-fg-3" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="11" y="110" width="11" height="30" rx="4" className={cls(4)} />
      <rect x="11" y="146" width="11" height="30" rx="4" className={cls(3)} />
      <text x="2" y="106" className="fill-fg-3 text-[9px]">
        4
      </text>
      <text x="2" y="190" className="fill-fg-3 text-[9px]">
        3
      </text>
    </svg>
  );
}
