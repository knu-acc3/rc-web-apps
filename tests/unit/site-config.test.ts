import { describe, it, expect } from 'vitest';
import { siteConfig } from '@/src/config/site.config';

describe('Единое конфигурационное ядро siteConfig', () => {
  it('должно содержать валидный базовый URL с протоколом https://', () => {
    expect(siteConfig.baseUrl).toMatch(/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+/);
    expect(siteConfig.baseUrl.endsWith('/')).toBe(false);
  });

  it('должно иметь синхронизированный домен и baseUrl', () => {
    expect(siteConfig.baseUrl).toBe(`https://${siteConfig.domain}`);
  });

  it('должно предоставлять слоганы на обоих языках', () => {
    expect(siteConfig.brandTagline.ru.length).toBeGreaterThan(10);
    expect(siteConfig.brandTagline.en.length).toBeGreaterThan(10);
  });

  it('должно содержать дефолтную локаль, входящую в список поддерживаемых', () => {
    expect(siteConfig.locales).toContain(siteConfig.defaultLocale);
  });
});
