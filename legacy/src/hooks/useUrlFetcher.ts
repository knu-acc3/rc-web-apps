'use client';

import { useState, useCallback } from 'react';

interface UseUrlFetcherResult {
  html: string;
  loading: boolean;
  error: string;
  fetchUrl: (url: string) => Promise<string>;
  /** Extract visible text from fetched HTML (strips scripts, styles, tags) */
  extractText: (rawHtml?: string) => string;
}

export function useUrlFetcher(): UseUrlFetcherResult {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUrl = useCallback(async (url: string): Promise<string> => {
    setLoading(true);
    setError('');
    setHtml('');

    try {
      const resp = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        const msg = data.error || `HTTP ${resp.status}`;
        setError(msg);
        setLoading(false);
        return '';
      }

      setHtml(data.html || '');
      setLoading(false);
      return data.html || '';
    } catch {
      setError('Network error');
      setLoading(false);
      return '';
    }
  }, []);

  const extractText = useCallback((rawHtml?: string): string => {
    const source = rawHtml ?? html;
    if (!source) return '';

    try {
      const parser = new DOMParser();
      const blockTags = 'address|article|aside|blockquote|dd|details|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|td|th|tr|ul';
      const sourceWithBreaks = source
        .replace(/<\s*br\s*\/?\s*>/gi, '\n')
        .replace(new RegExp(`<\\s*(${blockTags})(\\s|>)`, 'gi'), '\n<$1$2')
        .replace(new RegExp(`<\\/\\s*(${blockTags})\\s*>`, 'gi'), '</$1>\n');
      const doc = parser.parseFromString(sourceWithBreaks, 'text/html');

      // Remove scripts, styles, noscript, SVGs
      const remove = doc.querySelectorAll('script, style, noscript, svg, link, meta, head');
      remove.forEach(el => el.remove());

      doc.querySelectorAll('br').forEach((el) => {
        el.replaceWith(doc.createTextNode('\n'));
      });

      doc
        .querySelectorAll('address, article, aside, blockquote, dd, details, div, dl, dt, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, header, hr, li, main, nav, ol, p, pre, section, table, td, th, tr, ul')
        .forEach((el) => {
          el.insertAdjacentText('beforebegin', '\n');
          el.insertAdjacentText('afterend', '\n');
        });

      // Get text content
      const text = doc.body?.textContent || '';

      return text
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/[ \t]*\n[ \t]*/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .join('\n');
    } catch {
      // Fallback: regex-based stripping
      return source
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }, [html]);

  return { html, loading, error, fetchUrl, extractText };
}
