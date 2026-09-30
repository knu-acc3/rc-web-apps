import { ChevronDown } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { Block, QA } from "@/registry/types";
import { GlyphGrid, LinkCards, LinkChips } from "./links";

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("mb-3 text-lg font-semibold text-fg sm:text-xl", className)}>{children}</h2>;
}

export function BlockView({ block, locale }: { block: Block; locale: Locale }) {
  switch (block.type) {
    case "text":
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
            <LinkChips items={block.items} locale={locale} />
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

export function Faq({ items, title }: { items: QA[]; title: string }) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="divide-y divide-line overflow-hidden rounded-[12px] border border-line bg-surface">
        {items.map((it, i) => (
          <details key={i} className="group" open={i === 0}>
            <summary className="flex items-center justify-between gap-4 px-4 py-3.5 font-medium text-fg hover:bg-surface-2">
              <h3 className="text-[15px] font-medium">{it.q}</h3>
              <ChevronDown className="size-4 shrink-0 text-fg-3 transition-transform duration-150 group-open:rotate-180" aria-hidden />
            </summary>
            <div className="px-4 pb-4 text-[15px] leading-relaxed text-fg-2">{it.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
