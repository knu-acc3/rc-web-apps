import { describe, it, expect } from 'vitest';
import { buildHreflangLinks } from '@/src/lib/i18n/hreflang';

describe('Построитель Hreflang ссылок', () => {
  it('должен генерировать три ссылки: ru, en и x-default', () => {
    const links = buildHreflangLinks('/tools/pdf-studio');
    expect(links.length).toBe(3);

    const ru = links.find(l => l.hreflang === 'ru');
    const en = links.find(l => l.hreflang === 'en');
    const xDefault = links.find(l => l.hreflang === 'x-default');

    expect(ru?.href).toContain('/ru/tools/pdf-studio');
    expect(en?.href).toContain('/en/tools/pdf-studio');
    expect(xDefault?.href).toContain('/en/tools/pdf-studio');
  });
});
