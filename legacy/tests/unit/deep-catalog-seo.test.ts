import { describe, it, expect } from 'vitest';
import locationsData from '@/src/data/time-now/locations.json';
import devicesData from '@/src/data/actual-size/devices.json';
import { generateUniqueMeta } from '@/src/lib/seo/uniqueMetaEngine';

describe('Catalog SEO Audit across all subsystems', () => {
  it('samples English generated meta', () => {
    for (let i = 0; i < 5; i++) {
      const loc = locationsData[i];
      const metaEn = generateUniqueMeta({
        path: `/en/time-now/${loc.slug}`,
        category: 'time-now',
        entityRu: `${loc.nameRu} (${loc.countryRu})`,
        entityEn: `${loc.nameEn} (${loc.countryEn})`,
        locale: 'en',
      });
      expect(metaEn.title).toBeTruthy();
      expect(metaEn.description).toBeTruthy();
    }

    for (let i = 0; i < 5; i++) {
      const dev = devicesData[i];
      const metaEn = generateUniqueMeta({
        path: `/en/actual-size/${dev.slug}`,
        category: 'actual-size',
        entityRu: dev.modelRu,
        entityEn: dev.modelEn,
        locale: 'en',
      });
      console.log(`[Actual-size ${dev.slug} EN]: Title: "${metaEn.title}"`);
      console.log(`[Actual-size ${dev.slug} EN]: Desc: "${metaEn.description}"`);
      expect(metaEn.title).toBeTruthy();
      expect(metaEn.description).toBeTruthy();
    }
  });
});
