/**
 * Markdown → sanitized HTML with marked + DOMPurify, loaded lazily.
 * Allowed on purpose: del, hr, task-list checkboxes (input type=checkbox),
 * class on code (language-xxx), table alignment. In the preview, remote images
 * are replaced with a placeholder so the page never makes network requests;
 * the exported HTML keeps them.
 */

export interface MarkdownRenderer {
  /** HTML for the on-page preview (remote images replaced by a placeholder). */
  preview(md: string): string;
  /** HTML for export (images kept, still sanitized). */
  exportHtml(md: string): string;
}

let rendererPromise: Promise<MarkdownRenderer> | null = null;

export function loadMarkdownRenderer(imagePlaceholder: string): Promise<MarkdownRenderer> {
  if (!rendererPromise) {
    rendererPromise = (async () => {
      const [{ Marked }, dompurify] = await Promise.all([import("marked"), import("dompurify")]);
      const DOMPurify = dompurify.default;
      const marked = new Marked({ gfm: true, breaks: false });
      let replaceImages = true;

      DOMPurify.addHook("afterSanitizeAttributes", (node) => {
        const el = node as Element;
        if (el.tagName === "INPUT") {
          if (el.getAttribute("type") !== "checkbox") el.remove();
          else el.setAttribute("disabled", "");
        } else if (el.tagName === "A" && el.getAttribute("href")) {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer nofollow");
        } else if (el.tagName === "IMG" && replaceImages) {
          const src = el.getAttribute("src") ?? "";
          if (!/^data:image\/(png|jpe?g|gif|webp|avif);/i.test(src)) {
            const span = el.ownerDocument.createElement("span");
            span.className = "md-img";
            span.textContent = `🖼 ${imagePlaceholder}: ${el.getAttribute("alt") || src}`;
            el.replaceWith(span);
          }
        }
      });

      const sanitize = (html: string) =>
        DOMPurify.sanitize(html, {
          ADD_TAGS: ["input"],
          ADD_ATTR: ["checked", "disabled", "type", "class", "align", "start", "target"],
          FORBID_TAGS: ["style", "form", "iframe", "object", "embed", "script"],
        });
      const parse = (md: string) => marked.parse(md, { async: false }) as string;

      return {
        // The page already has its own <h1>; in the preview a level-1 heading is an ARIA heading.
        preview: (md) => sanitize(parse(md)).replace(/<h1(\s[^>]*)?>/g, '<div role="heading" aria-level="1" class="md-h1"$1>').replace(/<\/h1>/g, "</div>"),
        exportHtml: (md) => {
          replaceImages = false;
          try {
            return sanitize(parse(md));
          } finally {
            replaceImages = true;
          }
        },
      };
    })();
  }
  return rendererPromise;
}

export function htmlDocument(bodyHtml: string, title: string, lang: string): string {
  const esc = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc}</title>
<style>
body{max-width:760px;margin:40px auto;padding:0 16px;font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1a1a1a}
pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow:auto}code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.92em}
:not(pre)>code{background:#f4f4f4;padding:.1em .3em;border-radius:4px}blockquote{margin:0;padding-left:1em;border-left:3px solid #ddd;color:#555}
table{border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px 10px}img{max-width:100%}hr{border:0;border-top:1px solid #ddd}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}
