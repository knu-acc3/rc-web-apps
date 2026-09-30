import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const locationsPath = resolve('src/data/time-now/locations.json');
const devicesPath = resolve('src/data/actual-size/devices.json');

// --- 1. Sanitize locations.json ---
let locations = JSON.parse(readFileSync(locationsPath, 'utf8'));

// Filter out scraper artifacts (CONVERTER and loc-converter-*)
locations = locations.filter(loc => {
  if (loc.countryRu === 'CONVERTER' || loc.countryEn === 'CONVERTER') return false;
  if (loc.id && loc.id.startsWith('loc-converter-')) return false;
  if (loc.slug && loc.slug.startsWith('converter-')) return false;
  return true;
});

// Corrections map for Russian cities
const cityCorrections = {
  'ru-kamchatka': {
    nameRu: 'Петропавловск-Камчатский',
    nameEn: 'Petropavlovsk-Kamchatsky',
    timezoneIana: 'Asia/Kamchatka',
    latitude: 53.04,
    longitude: 158.65,
    utcOffsetMinutes: 720,
    hasDst: false,
    continent: 'asia',
  },
  'ru-magadan': {
    nameRu: 'Магадан',
    nameEn: 'Magadan',
    timezoneIana: 'Asia/Magadan',
    latitude: 59.56,
    longitude: 150.80,
    utcOffsetMinutes: 660,
    hasDst: false,
    continent: 'asia',
  },
  'ru-yakutsk': {
    nameRu: 'Якутск',
    nameEn: 'Yakutsk',
    timezoneIana: 'Asia/Yakutsk',
    latitude: 62.03,
    longitude: 129.73,
    utcOffsetMinutes: 540,
    hasDst: false,
    continent: 'asia',
  },
  'ru-vladivostok': {
    nameRu: 'Владивосток',
    nameEn: 'Vladivostok',
    timezoneIana: 'Asia/Vladivostok',
    latitude: 43.11,
    longitude: 131.88,
    utcOffsetMinutes: 600,
    hasDst: false,
    continent: 'asia',
  },
  'ru-kaliningrad': {
    nameRu: 'Калининград',
    nameEn: 'Kaliningrad',
    timezoneIana: 'Europe/Kaliningrad',
    latitude: 54.71,
    longitude: 20.51,
    utcOffsetMinutes: 120,
    hasDst: false,
    continent: 'europe',
  },
  'ru-irkutsk': {
    nameRu: 'Иркутск',
    nameEn: 'Irkutsk',
    timezoneIana: 'Asia/Irkutsk',
    latitude: 52.28,
    longitude: 104.30,
    utcOffsetMinutes: 480,
    hasDst: false,
    continent: 'asia',
  },
  'ru-krasnoyarsk': {
    nameRu: 'Красноярск',
    nameEn: 'Krasnoyarsk',
    timezoneIana: 'Asia/Krasnoyarsk',
    latitude: 56.01,
    longitude: 92.85,
    utcOffsetMinutes: 420,
    hasDst: false,
    continent: 'asia',
  },
  'ru-omsk': {
    nameRu: 'Омск',
    nameEn: 'Omsk',
    timezoneIana: 'Asia/Omsk',
    latitude: 54.99,
    longitude: 73.37,
    utcOffsetMinutes: 360,
    hasDst: false,
    continent: 'asia',
  },
  'ru-samara': {
    nameRu: 'Самара',
    nameEn: 'Samara',
    timezoneIana: 'Europe/Samara',
    latitude: 53.20,
    longitude: 50.15,
    utcOffsetMinutes: 240,
    hasDst: false,
    continent: 'europe',
  },
  'ru-yekaterinburg': {
    nameRu: 'Екатеринбург',
    nameEn: 'Yekaterinburg',
    timezoneIana: 'Asia/Yekaterinburg',
    latitude: 56.84,
    longitude: 60.61,
    utcOffsetMinutes: 300,
    hasDst: false,
    continent: 'asia',
  },
  'ru-moscow': {
    nameRu: 'Москва',
    nameEn: 'Moscow',
    timezoneIana: 'Europe/Moscow',
    latitude: 55.75,
    longitude: 37.61,
    utcOffsetMinutes: 180,
    hasDst: false,
    isCapital: true,
    continent: 'europe',
  },
};

for (const loc of locations) {
  if (cityCorrections[loc.slug]) {
    Object.assign(loc, cityCorrections[loc.slug]);
  }
}

// Ensure 14 authentic cities are present to guarantee >= 308 high-quality cities
const additionalCities = [
  {
    id: 'loc-ru-saint-petersburg',
    slug: 'ru-saint-petersburg',
    nameRu: 'Санкт-Петербург',
    nameEn: 'Saint Petersburg',
    countryRu: 'Россия',
    countryEn: 'Russia',
    countryCode: 'RU',
    continent: 'europe',
    timezoneIana: 'Europe/Moscow',
    utcOffsetMinutes: 180,
    hasDst: false,
    latitude: 59.93,
    longitude: 30.33,
    isCapital: false,
  },
  {
    id: 'loc-ru-novosibirsk',
    slug: 'ru-novosibirsk',
    nameRu: 'Новосибирск',
    nameEn: 'Novosibirsk',
    countryRu: 'Россия',
    countryEn: 'Russia',
    countryCode: 'RU',
    continent: 'asia',
    timezoneIana: 'Asia/Novosibirsk',
    utcOffsetMinutes: 420,
    hasDst: false,
    latitude: 55.03,
    longitude: 82.92,
    isCapital: false,
  },
  {
    id: 'loc-ru-nizhny-novgorod',
    slug: 'ru-nizhny-novgorod',
    nameRu: 'Нижний Новгород',
    nameEn: 'Nizhny Novgorod',
    countryRu: 'Россия',
    countryEn: 'Russia',
    countryCode: 'RU',
    continent: 'europe',
    timezoneIana: 'Europe/Moscow',
    utcOffsetMinutes: 180,
    hasDst: false,
    latitude: 56.33,
    longitude: 44.00,
    isCapital: false,
  },
  {
    id: 'loc-ru-rostov-na-donu',
    slug: 'ru-rostov-na-donu',
    nameRu: 'Ростов-на-Дону',
    nameEn: 'Rostov-on-Don',
    countryRu: 'Россия',
    countryEn: 'Russia',
    countryCode: 'RU',
    continent: 'europe',
    timezoneIana: 'Europe/Moscow',
    utcOffsetMinutes: 180,
    hasDst: false,
    latitude: 47.24,
    longitude: 39.71,
    isCapital: false,
  },
  {
    id: 'loc-ru-krasnodar',
    slug: 'ru-krasnodar',
    nameRu: 'Краснодар',
    nameEn: 'Krasnodar',
    countryRu: 'Россия',
    countryEn: 'Russia',
    countryCode: 'RU',
    continent: 'europe',
    timezoneIana: 'Europe/Moscow',
    utcOffsetMinutes: 180,
    hasDst: false,
    latitude: 45.04,
    longitude: 38.98,
    isCapital: false,
  },
  {
    id: 'loc-ru-perm',
    slug: 'ru-perm',
    nameRu: 'Пермь',
    nameEn: 'Perm',
    countryRu: 'Россия',
    countryEn: 'Russia',
    countryCode: 'RU',
    continent: 'asia',
    timezoneIana: 'Asia/Yekaterinburg',
    utcOffsetMinutes: 300,
    hasDst: false,
    latitude: 58.01,
    longitude: 56.25,
    isCapital: false,
  },
  {
    id: 'loc-ru-volgograd',
    slug: 'ru-volgograd',
    nameRu: 'Волгоград',
    nameEn: 'Volgograd',
    countryRu: 'Россия',
    countryEn: 'Russia',
    countryCode: 'RU',
    continent: 'europe',
    timezoneIana: 'Europe/Volgograd',
    utcOffsetMinutes: 180,
    hasDst: false,
    latitude: 48.72,
    longitude: 44.50,
    isCapital: false,
  },
  {
    id: 'loc-ru-saratov',
    slug: 'ru-saratov',
    nameRu: 'Саратов',
    nameEn: 'Saratov',
    countryRu: 'Россия',
    countryEn: 'Russia',
    countryCode: 'RU',
    continent: 'europe',
    timezoneIana: 'Europe/Saratov',
    utcOffsetMinutes: 240,
    hasDst: false,
    latitude: 51.54,
    longitude: 46.01,
    isCapital: false,
  },
  {
    id: 'loc-ru-tyumen',
    slug: 'ru-tyumen',
    nameRu: 'Тюмень',
    nameEn: 'Tyumen',
    countryRu: 'Россия',
    countryEn: 'Russia',
    countryCode: 'RU',
    continent: 'asia',
    timezoneIana: 'Asia/Yekaterinburg',
    utcOffsetMinutes: 300,
    hasDst: false,
    latitude: 57.15,
    longitude: 65.54,
    isCapital: false,
  },
  {
    id: 'loc-ru-barnaul',
    slug: 'ru-barnaul',
    nameRu: 'Барнаул',
    nameEn: 'Barnaul',
    countryRu: 'Россия',
    countryEn: 'Russia',
    countryCode: 'RU',
    continent: 'asia',
    timezoneIana: 'Asia/Barnaul',
    utcOffsetMinutes: 420,
    hasDst: false,
    latitude: 53.36,
    longitude: 83.76,
    isCapital: false,
  },
  {
    id: 'loc-ru-khabarovsk',
    slug: 'ru-khabarovsk',
    nameRu: 'Хабаровск',
    nameEn: 'Khabarovsk',
    countryRu: 'Россия',
    countryEn: 'Russia',
    countryCode: 'RU',
    continent: 'asia',
    timezoneIana: 'Asia/Vladivostok',
    utcOffsetMinutes: 600,
    hasDst: false,
    latitude: 48.48,
    longitude: 135.07,
    isCapital: false,
  },
  {
    id: 'loc-kz-astana',
    slug: 'kz-astana',
    nameRu: 'Астана',
    nameEn: 'Astana',
    countryRu: 'Казахстан',
    countryEn: 'Kazakhstan',
    countryCode: 'KZ',
    continent: 'asia',
    timezoneIana: 'Asia/Almaty',
    utcOffsetMinutes: 300,
    hasDst: false,
    latitude: 51.17,
    longitude: 71.45,
    isCapital: true,
  },
  {
    id: 'loc-kz-shymkent',
    slug: 'kz-shymkent',
    nameRu: 'Шымкент',
    nameEn: 'Shymkent',
    countryRu: 'Казахстан',
    countryEn: 'Kazakhstan',
    countryCode: 'KZ',
    continent: 'asia',
    timezoneIana: 'Asia/Almaty',
    utcOffsetMinutes: 300,
    hasDst: false,
    latitude: 42.32,
    longitude: 69.60,
    isCapital: false,
  },
  {
    id: 'loc-kz-karaganda',
    slug: 'kz-karaganda',
    nameRu: 'Караганда',
    nameEn: 'Karaganda',
    countryRu: 'Казахстан',
    countryEn: 'Kazakhstan',
    countryCode: 'KZ',
    continent: 'asia',
    timezoneIana: 'Asia/Almaty',
    utcOffsetMinutes: 300,
    hasDst: false,
    latitude: 49.80,
    longitude: 73.10,
    isCapital: false,
  },
];

for (const city of additionalCities) {
  if (!locations.some(l => l.slug === city.slug)) {
    locations.push(city);
  }
}

writeFileSync(locationsPath, JSON.stringify(locations, null, 2), 'utf8');
console.log(`Sanitized locations.json: ${locations.length} total entries.`);

// --- 2. Sanitize devices.json ---
const devices = JSON.parse(readFileSync(devicesPath, 'utf8'));

for (const dev of devices) {
  // Strip "Реальный размер: " from modelEn
  if (dev.modelEn) {
    dev.modelEn = dev.modelEn.replace(/^Реальный размер:\s*/i, '').trim();
    // Capitalize first letter if needed
    if (dev.modelEn.length > 0) {
      dev.modelEn = dev.modelEn.charAt(0).toUpperCase() + dev.modelEn.slice(1);
    }
  }

  // Strip "Реальный размер: " from modelRu
  if (dev.modelRu) {
    dev.modelRu = dev.modelRu.replace(/^Реальный размер:\s*/i, '').trim();
    if (dev.modelRu.length > 0) {
      dev.modelRu = dev.modelRu.charAt(0).toUpperCase() + dev.modelRu.slice(1);
    }
  }

  // AirPods and AirTag corrections
  if (dev.slug === 'airpods-3') {
    dev.category = 'accessory';
    dev.modelRu = 'AirPods 3';
    dev.modelEn = 'AirPods 3rd Gen';
    dev.widthMm = 54.4;
    dev.heightMm = 46.4;
    dev.thicknessMm = 21.38;
    delete dev.screenDiagonalInches;
    delete dev.screenWidthPx;
    delete dev.screenHeightPx;
  } else if (dev.slug === 'airpods-4') {
    dev.category = 'accessory';
    dev.modelRu = 'AirPods 4';
    dev.modelEn = 'AirPods 4';
    dev.widthMm = 50.1;
    dev.heightMm = 46.2;
    dev.thicknessMm = 21.2;
    delete dev.screenDiagonalInches;
    delete dev.screenWidthPx;
    delete dev.screenHeightPx;
  } else if (dev.slug === 'airpods-pro-3') {
    dev.category = 'accessory';
    dev.modelRu = 'AirPods Pro 2';
    dev.modelEn = 'AirPods Pro 2';
    dev.widthMm = 60.6;
    dev.heightMm = 45.2;
    dev.thicknessMm = 21.7;
    delete dev.screenDiagonalInches;
    delete dev.screenWidthPx;
    delete dev.screenHeightPx;
  } else if (dev.slug === 'airpods-pro') {
    dev.category = 'accessory';
    dev.modelRu = 'AirPods Pro';
    dev.modelEn = 'AirPods Pro';
    dev.widthMm = 60.6;
    dev.heightMm = 45.2;
    dev.thicknessMm = 21.7;
    delete dev.screenDiagonalInches;
    delete dev.screenWidthPx;
    delete dev.screenHeightPx;
  } else if (dev.slug === 'airtag') {
    dev.category = 'accessory';
    dev.modelRu = 'Apple AirTag';
    dev.modelEn = 'Apple AirTag';
    dev.widthMm = 31.9;
    dev.heightMm = 31.9;
    dev.thicknessMm = 8.0;
    delete dev.screenDiagonalInches;
    delete dev.screenWidthPx;
    delete dev.screenHeightPx;
  } else if (dev.slug === 'apple-homepod-mini') {
    dev.category = 'accessory';
    dev.modelRu = 'Apple HomePod mini';
    dev.modelEn = 'Apple HomePod mini';
    dev.widthMm = 97.9;
    dev.heightMm = 84.3;
    dev.thicknessMm = 97.9;
    delete dev.screenDiagonalInches;
    delete dev.screenWidthPx;
    delete dev.screenHeightPx;
  }
}

writeFileSync(devicesPath, JSON.stringify(devices, null, 2), 'utf8');
console.log(`Sanitized devices.json: ${devices.length} total entries.`);
