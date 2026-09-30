import { BASE_URL, buildAllSitemapEntries } from '@/src/seo/sitemapEntries';

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'cf5750cd7a2e40fb9839ec29a4ef25c3';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';

export function getIndexNowHost(): string {
  return new URL(BASE_URL).host;
}

export function getIndexNowKeyLocation(): string {
  return `${BASE_URL}/${INDEXNOW_KEY}.txt`;
}

export function getAllIndexableUrls(): string[] {
  const urls = buildAllSitemapEntries().map((entry) => entry.url);
  return Array.from(new Set(urls));
}

export function chunkUrls(urls: string[], chunkSize: number): string[][] {
  if (chunkSize <= 0) return [urls];
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += chunkSize) {
    chunks.push(urls.slice(i, i + chunkSize));
  }
  return chunks;
}
