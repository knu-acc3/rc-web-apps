/**
 * Canonical route map for tools that were merged or renamed.
 *
 * Keep this map aligned with `next.config.ts` redirects. It is used by SEO
 * builders and article rendering so internal links point at final URLs instead
 * of creating crawl-time redirect chains.
 */
export const TOOL_SLUG_REDIRECTS: Record<string, string> = {
  'qr-generator': 'qr-code-gen',
  'barcode-generator': 'barcode-gen',
  'heading-checker': 'keyword-density',
  'og-preview': 'seo-meta-tool',
  'meta-generator': 'seo-meta-tool',
  'coin-flip': 'random-picker',
  'dice-roller': 'random-picker',
  'wheel-spinner': 'random-picker',
  'decision-maker': 'random-picker',
  'symbols-common': 'symbol-catalog',
  'symbols-math': 'symbol-catalog',
  'symbols-arrows': 'symbol-catalog',
  'symbols-stars': 'symbol-catalog',
  'symbols-typography': 'symbol-catalog',
  'symbols-graphic': 'symbol-catalog',
  'symbols-people': 'symbol-catalog',
  'symbols-animals': 'symbol-catalog',
  'symbols-popular': 'symbol-catalog',
  'symbols-language-currency': 'symbol-catalog',
  'pdf-to-jpg': 'pdf-to-image',
  'pdf-to-png': 'pdf-to-image',
  'text-diff': 'diff-checker',
  'word-counter': 'text-analyzer',
  'reading-time': 'text-analyzer',
  'token-counter': 'text-analyzer',
  'remove-pages-pdf': 'split-pdf',
  'blur-image': 'image-filters',
  'tone-generator': 'noise-generator',
  'esign-pdf': 'pdf-studio',
  'bmi-calc': 'body-metrics',
  'bmi-calculator': 'body-metrics',
  'ideal-weight': 'body-metrics',
  'body-fat': 'body-metrics',
  'calorie-calc': 'body-metrics',
};

export function canonicalizeToolSlug(slug: string): string {
  let current = slug;
  const seen = new Set<string>();

  while (TOOL_SLUG_REDIRECTS[current] && !seen.has(current)) {
    seen.add(current);
    current = TOOL_SLUG_REDIRECTS[current];
  }

  return current;
}

export function canonicalizeToolPath(path: string): string {
  return path.replace(/\/tools\/([a-z0-9-]+)/g, (match, slug: string) => {
    const canonical = canonicalizeToolSlug(slug);
    return canonical === slug ? match : `/tools/${canonical}`;
  });
}

export function canonicalizeMarkdownToolLinks(markdown: string | undefined): string | undefined {
  return markdown ? canonicalizeToolPath(markdown) : markdown;
}
