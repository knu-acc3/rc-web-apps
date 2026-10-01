import { ChevronDown, CircleHelp, ListOrdered, type LucideIcon } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { Block, QA } from "@/registry/types";
import { Fold } from "@/ui/fold";
import { GlyphGrid, LinkCards, LinkChips } from "./links";

export function SectionTitle({ children, className, icon: Ico }: { children: React.ReactNode; className?: string; icon?: LucideIcon }) {
  return (
    <h2 className={cn("mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-fg sm:text-xl", className)}>
      {Ico && <Ico className="size-5 shrink-0 text-accent" aria-hidden />}
      {children}
    </h2>
  );
}

export function BlockView({ block, locale }: { block: Block; locale: Locale }) {
  switch (block.type) {
    case "text":
      if (block.fold && block.title) {
        return (
          <section>
            <Fold title={<h2 className="text-base font-semibold">{block.title}</h2>} bodyClassName="px-4 pb-5 pt-4">
              <div className="prose-lite">
                {block.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Fold>
          </section>
        );
      }
      return (
        <section>
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          <div className="prose-lite">
            {block.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      );
    case "list":
      return (
        <section>
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          <div className="prose-lite">
            {block.ordered ? (
              <ol>{block.items.map((x, i) => <li key={i}>{x}</li>)}</ol>
            ) : (
              <ul>{block.items.map((x, i) => <li key={i}>{x}</li>)}</ul>
            )}
          </div>
        </section>
      );
    case "facts":
      return (
        <section>
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          <dl className="facts">
            {block.rows.map(([k, v], i) => (
              <div key={i}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case "table": {
      const half = Math.ceil(block.rows.length / 2);
      const parts = block.split && block.rows.length > 8 ? [block.rows.slice(0, half), block.rows.slice(half)] : [block.rows];
      return (
        <section>
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          <div className={cn(parts.length > 1 && "grid sm:grid-cols-2 sm:gap-3")}>
            {parts.map((rows, k) => (
              <div key={k} tabIndex={0} className={cn("tbl", parts.length > 1 && (k === 0 ? "max-sm:rounded-b-none max-sm:border-b-0" : "max-sm:rounded-t-none"))}>
                <table className={block.mono ? "font-mono" : undefined}>
                  {block.caption && k === 0 && <caption className="sr-only">{block.caption}</caption>}
                  <thead className={cn(k > 0 && "max-sm:hidden")}>
                    <tr>
                      {block.head.map((h, i) => (
                        <th key={i} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((c, j) => (
                          <td key={j}>{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      );
    }
    case "links":
      return (
        <section>
          <SectionTitle>{block.title}</SectionTitle>
          {block.style === "cards" ? (
            <LinkCards items={block.items} locale={locale} />
          ) : block.style === "glyphs" ? (
            <GlyphGrid items={block.items.map((x) => ({ glyph: x.glyph ?? "", label: x.label, path: x.path }))} locale={locale} />
          ) : (
            <LinkChips items={block.items} locale={locale} limit={16} />
          )}
          {block.more && <LinkChips items={[block.more]} locale={locale} className="mt-3" />}
        </section>
      );
    case "glyphs":
      return (
        <section>
          {block.title && <SectionTitle>{block.title}</SectionTitle>}
          <GlyphGrid items={block.items} locale={locale} />
        </section>
      );
  }
}

export function HowTo({ steps, title }: { steps: string[]; title: string }) {
  return (
    <section>
      <SectionTitle icon={ListOrdered}>{title}</SectionTitle>
      <ol className={cn("grid gap-x-8 gap-y-4 xl:grid-cols-1!", steps.length === 4 ? "sm:grid-cols-2" : steps.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-container text-[0.9375rem] font-bold text-on-accent-container">{i + 1}</span>
            <span className="pt-1 text-[0.9375rem] leading-snug text-fg-2">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Faq({ items, title }: { items: QA[]; title: string }) {
  return (
    <section>
      <SectionTitle icon={CircleHelp}>{title}</SectionTitle>
      <div className="panel divide-y divide-line overflow-hidden">
        {items.map((it, i) => (
          <details key={i} className="group">
            <summary className="flex items-center justify-between gap-4 px-5 py-3.5 text-fg transition-colors hover:bg-surface-2 hover:text-accent">
              <h3 className="text-[0.9375rem] font-semibold">{it.q}</h3>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-container text-on-accent-container transition-transform duration-200 group-open:rotate-180" aria-hidden>
                <ChevronDown className="size-4" />
              </span>
            </summary>
            <div className="px-5 pb-4 text-[0.9375rem] leading-relaxed text-fg-2">{it.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
