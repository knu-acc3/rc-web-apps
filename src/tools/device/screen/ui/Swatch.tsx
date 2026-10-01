/** A colour field: a round swatch and the hex code on a tonal pill; the whole pill opens the colour picker. */
export function Swatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-sm font-medium text-fg-2">{label}</span>
      <span className="relative flex h-11 w-fit min-w-[8.5rem] cursor-pointer items-center gap-2.5 rounded-full bg-surface-2 pr-4 pl-1.5 transition-colors hover:bg-surface-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
        <span aria-hidden className="size-8 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)]" style={{ background: value }} />
        <span className="font-mono text-sm text-fg uppercase">{value}</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
      </span>
    </label>
  );
}
