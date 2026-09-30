import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="s xhtml">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Ultimate Tools Sitemap</title>
        <style>
          :root {
            color-scheme: light dark;
            --bg: #eef1f3;
            --surface: #ffffff;
            --muted: #64748b;
            --text: #0f172a;
            --border: #d6dae1;
            --primary: #0f766e;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #06080b;
              --surface: #10141a;
              --muted: #a0a4ad;
              --text: #f3f4f7;
              --border: #24303a;
              --primary: #7dd3fc;
            }
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          main {
            width: min(1120px, 100%);
            margin: 0 auto;
            padding: 24px clamp(12px, 3vw, 32px) 40px;
          }
          header {
            margin-bottom: 18px;
          }
          h1 {
            margin: 0 0 6px;
            font-size: clamp(24px, 5vw, 38px);
            line-height: 1.1;
            letter-spacing: -0.02em;
          }
          p {
            margin: 0;
            color: var(--muted);
          }
          a {
            color: var(--primary);
            text-decoration: none;
            overflow-wrap: anywhere;
          }
          a:hover { text-decoration: underline; }
          .panel {
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 18px;
            background: var(--surface);
          }
          .table-wrap {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          table {
            width: 100%;
            min-width: 760px;
            border-collapse: collapse;
          }
          th, td {
            padding: 12px 14px;
            border-bottom: 1px solid var(--border);
            text-align: left;
            vertical-align: top;
          }
          th {
            color: var(--muted);
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            background: color-mix(in srgb, var(--surface) 86%, var(--border));
          }
          tr:last-child td { border-bottom: 0; }
          code {
            color: var(--muted);
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 12px;
            white-space: nowrap;
          }
          .count {
            display: inline-flex;
            margin-top: 12px;
            border-radius: 999px;
            padding: 5px 10px;
            background: color-mix(in srgb, var(--primary) 12%, transparent);
            color: var(--primary);
            font-weight: 800;
          }
        </style>
      </head>
      <body>
        <main>
          <header>
            <h1>Ultimate Tools Sitemap</h1>
            <xsl:choose>
              <xsl:when test="s:sitemapindex">
                <p>Sitemap index for search engines. Open a segment to inspect URLs.</p>
                <div class="count"><xsl:value-of select="count(s:sitemapindex/s:sitemap)" /> sitemap files</div>
              </xsl:when>
              <xsl:otherwise>
                <p>URL sitemap generated for search engines. The XML remains fully crawlable.</p>
                <div class="count"><xsl:value-of select="count(s:urlset/s:url)" /> URLs</div>
              </xsl:otherwise>
            </xsl:choose>
          </header>

          <section class="panel">
            <div class="table-wrap">
              <xsl:choose>
                <xsl:when test="s:sitemapindex">
                  <table>
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>Last modified</th>
                      </tr>
                    </thead>
                    <tbody>
                      <xsl:for-each select="s:sitemapindex/s:sitemap">
                        <tr>
                          <td><a href="{s:loc}"><xsl:value-of select="s:loc" /></a></td>
                          <td><code><xsl:value-of select="s:lastmod" /></code></td>
                        </tr>
                      </xsl:for-each>
                    </tbody>
                  </table>
                </xsl:when>
                <xsl:otherwise>
                  <table>
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th>Last modified</th>
                        <th>Frequency</th>
                        <th>Priority</th>
                        <th>Alternates</th>
                      </tr>
                    </thead>
                    <tbody>
                      <xsl:for-each select="s:urlset/s:url">
                        <tr>
                          <td><a href="{s:loc}"><xsl:value-of select="s:loc" /></a></td>
                          <td><code><xsl:value-of select="s:lastmod" /></code></td>
                          <td><xsl:value-of select="s:changefreq" /></td>
                          <td><xsl:value-of select="s:priority" /></td>
                          <td><xsl:value-of select="count(xhtml:link)" /></td>
                        </tr>
                      </xsl:for-each>
                    </tbody>
                  </table>
                </xsl:otherwise>
              </xsl:choose>
            </div>
          </section>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

export function GET() {
  return new NextResponse(xsl, {
    status: 200,
    headers: {
      'Content-Type': 'text/xsl; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
