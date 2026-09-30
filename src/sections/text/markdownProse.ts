/** Tailwind classes that style rendered Markdown (headings, lists, code, tables, quotes, task lists). */
export const MD_PROSE = [
  "text-[15px] leading-relaxed text-fg break-words",
  "[&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h1:first-child]:mt-0",
  "[&_.md-h1]:mb-3 [&_.md-h1]:mt-5 [&_.md-h1]:text-2xl [&_.md-h1]:font-bold [&_.md-h1]:leading-tight [&_.md-h1:first-child]:mt-0",
  "[&_h2]:mb-2.5 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h2:first-child]:mt-0",
  "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:mt-3 [&_h4]:font-semibold",
  "[&_p]:my-2.5 [&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
  "[&_li:has(>input)]:list-none [&_li>input]:mr-2 [&_li>input]:-ml-5 [&_li>input]:align-middle",
  "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2",
  "[&_blockquote]:my-3 [&_blockquote]:border-l-[3px] [&_blockquote]:border-line-strong [&_blockquote]:pl-4 [&_blockquote]:text-fg-2",
  "[&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]",
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-[8px] [&_pre]:bg-surface-2 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:my-3 [&_table]:block [&_table]:overflow-x-auto [&_table]:border-collapse [&_th]:border [&_th]:border-line [&_th]:bg-surface-2 [&_th]:px-3 [&_th]:py-1.5 [&_td]:border [&_td]:border-line [&_td]:px-3 [&_td]:py-1.5",
  "[&_hr]:my-5 [&_hr]:border-line [&_del]:text-fg-3 [&_img]:max-w-full [&_.md-img]:rounded [&_.md-img]:bg-surface-2 [&_.md-img]:px-1.5 [&_.md-img]:text-sm [&_.md-img]:text-fg-3",
].join(" ");
