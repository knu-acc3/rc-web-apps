import { describe, it, expect } from 'vitest';
import {
  buildWebApplicationSchema,
  buildBreadcrumbSchema,
  buildProductDeviceSchema,
  buildPlaceTimeSchema,
  buildFaqSchema,
} from '@/src/lib/seo/schemaGenerator';

describe('Фабрика микроразметки Schema.org (JSON-LD)', () => {
  it('должна формировать валидную разметку WebApplication', () => {
    const schema = buildWebApplicationSchema({
      name: 'PDF Конвертер',
      description: 'Онлайн конвертер PDF файлов',
      url: 'https://rcwebapp.com/ru/tools/pdf-converter',
      category: 'UtilitiesApplication',
    });

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('WebApplication');
    expect(schema.offers.price).toBe('0');
  });

  it('должна формировать валидную цепочку BreadcrumbList', () => {
    const breadcrumbs = [
      { name: 'Главная', url: 'https://rcwebapp.com/ru' },
      { name: 'Мировое время', url: 'https://rcwebapp.com/ru/time-now' },
      { name: 'Москва', url: 'https://rcwebapp.com/ru/time-now/moscow' },
    ];
    const schema = buildBreadcrumbSchema(breadcrumbs);

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement.length).toBe(3);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[2].name).toBe('Москва');
  });

  it('должна формировать валидную разметку Product для устройств', () => {
    const schema = buildProductDeviceSchema({
      name: 'iPhone 16 Pro',
      description: 'Точные размеры 1:1',
      url: 'https://rcwebapp.com/ru/actual-size/iphone-16-pro',
      heightMm: 149.6,
      widthMm: 71.5,
      depthMm: 8.25,
      brand: 'Apple',
    });

    expect(schema['@type']).toBe('Product');
    expect(schema.width.value).toBe(71.5);
    expect(schema.height.value).toBe(149.6);
    expect(schema.depth?.value).toBe(8.25);
  });

  it('должна формировать валидную разметку Place и FAQ', () => {
    const place = buildPlaceTimeSchema({
      cityName: 'Москва',
      countryName: 'Россия',
      url: 'https://rcwebapp.com/ru/time-now/moscow',
      latitude: 55.7558,
      longitude: 37.6173,
      timezoneIana: 'Europe/Moscow',
    });
    expect(place['@type']).toBe('Place');
    expect(place.geo.latitude).toBe(55.7558);

    const faq = buildFaqSchema([
      { question: 'Сколько сейчас времени?', answer: 'Время синхронизировано по атомным часам.' },
    ]);
    expect(faq['@type']).toBe('FAQPage');
    expect(faq.mainEntity.length).toBe(1);
  });
});
