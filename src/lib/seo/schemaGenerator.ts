import { siteConfig } from '@/src/config/site.config';

export interface WebApplicationSchemaParams {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly category: string;
  readonly screenshotUrl?: string;
}

export interface ProductDeviceSchemaParams {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly heightMm: number;
  readonly widthMm: number;
  readonly depthMm?: number;
  readonly brand: string;
}

export interface PlaceTimeSchemaParams {
  readonly cityName: string;
  readonly countryName: string;
  readonly url: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timezoneIana: string;
}

export interface BreadcrumbItem {
  readonly name: string;
  readonly url: string;
}

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export function buildWebApplicationSchema(params: WebApplicationSchemaParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: params.name,
    description: params.description,
    url: params.url,
    applicationCategory: params.category,
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: siteConfig.brandName,
      url: siteConfig.baseUrl,
    },
  };
}

export function buildProductDeviceSchema(params: ProductDeviceSchemaParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: params.name,
    description: params.description,
    url: params.url,
    brand: {
      '@type': 'Brand',
      name: params.brand,
    },
    width: {
      '@type': 'QuantitativeValue',
      value: params.widthMm,
      unitCode: 'MMT',
    },
    height: {
      '@type': 'QuantitativeValue',
      value: params.heightMm,
      unitCode: 'MMT',
    },
    ...(params.depthMm !== undefined && {
      depth: {
        '@type': 'QuantitativeValue',
        value: params.depthMm,
        unitCode: 'MMT',
      },
    }),
  };
}

export function buildPlaceTimeSchema(params: PlaceTimeSchemaParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: params.cityName,
    address: {
      '@type': 'PostalAddress',
      addressCountry: params.countryName,
      addressLocality: params.cityName,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: params.latitude,
      longitude: params.longitude,
    },
    url: params.url,
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFaqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
