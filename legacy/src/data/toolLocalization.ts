/**
 * Tool Localization Helpers
 * Eliminates the need for 'as any' casting throughout the codebase
 * Provides safe access to bilingual tool properties
 */

import type { Tool, ToolGroup } from '@/src/data/tools';

const META_DESCRIPTION_MAX_LENGTH = 160;

function asSentence(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
  return `${normalized}.`;
}

function trimMetaDescription(value: string): string {
  if (value.length <= META_DESCRIPTION_MAX_LENGTH) return value;

  const boundary = value.lastIndexOf(' ', META_DESCRIPTION_MAX_LENGTH - 1);
  const shortened = value
    .slice(0, boundary > 100 ? boundary : META_DESCRIPTION_MAX_LENGTH - 1)
    .replace(/[\s,;:.!?-]+$/, '');

  return `${shortened}.`;
}

function appendIfItFits(parts: string[], value: string | null): void {
  if (!value) return;
  const candidate = [...parts, value].join(' ');
  if (candidate.length <= META_DESCRIPTION_MAX_LENGTH) parts.push(value);
}

function getEnglishKeywordHint(tool: Tool, description: string): string | null {
  const normalizedDescription = description.toLowerCase();
  const keywords = tool.keywords
    .map(keyword => keyword.trim())
    .filter(
      keyword =>
        keyword.length > 1 &&
        !/[А-Яа-яЁё]/.test(keyword) &&
        !normalizedDescription.includes(keyword.toLowerCase()),
    )
    .slice(0, 3);

  return keywords.length > 0 ? `Supports ${keywords.join(', ')}.` : null;
}

/**
 * Get the name of a tool in the specified language
 * @param tool The tool object
 * @param locale The language ('ru' or 'en')
 * @returns The tool name in the specified language
 */
export function getToolName(tool: Tool, locale: string): string {
  return locale === 'en' ? tool.nameEn || tool.name : tool.name;
}

/**
 * Compact name for visible UI. Parenthetical keyword qualifiers belong in
 * metadata and descriptions, not in every heading and catalog card.
 */
export function getToolDisplayName(tool: Tool, locale: string): string {
  return getToolName(tool, locale).replace(/\s*\([^()]*\)\s*$/, '').trim();
}

/**
 * Get the H1 heading for the tool page
 * Falls back to explicit seoH1/seoH1En or compact display name
 */
export function getToolH1(tool: Tool, locale: string): string {
  if (locale === 'en') {
    return tool.seoH1En || getToolDisplayName(tool, 'en');
  }
  return tool.seoH1 || getToolDisplayName(tool, 'ru');
}

/**
 * Get the description of a tool in the specified language
 * @param tool The tool object
 * @param locale The language ('ru' or 'en')
 * @returns The tool description in the specified language
 */
export function getToolDescription(tool: Tool, locale: string): string {
  return locale === 'en' ? tool.descriptionEn || tool.description : tool.description;
}

const GROUP_TITLE_POSTFIX_RU: Record<string, string> = {
  converters: '— точный перевод величин и форматов',
  math: '— пошаговые формулы, расчет и графики',
  text: '— форматирование, очистка и подсчет',
  developers: '— генерация, валидация и минификация',
  datetime: '— точное время, таймер и часовые пояса',
  images: '— оптимизация и редактирование графики',
  security: '— проверка безопасности и шифрование',
  pdf: '— обработка и объединение PDF документов',
  finance: '— финансовый калькулятор и расчет выгоды',
  kz: '— онлайн-проверка и справочник Казахстана',
  calculators: '— быстрый и точный расчет онлайн',
  units: '— конвертер мер и единиц измерения',
};

const GROUP_DESC_HINT_RU: Record<string, string> = {
  converters: 'Точный перевод с поддержкой популярных единиц измерения.',
  math: 'Мгновенный расчет с наглядным отображением промежуточных шагов.',
  text: 'Инструмент для чистой типографики и быстрой обработки символов.',
  developers: 'Локальная обработка кода без передачи данных на удаленные сервера.',
  datetime: 'Синхронизация по всемирному координированному времени.',
  images: 'Быстрый экспорт и сжатие без потери четкости.',
  security: 'Криптографические алгоритмы выполняются на клиенте.',
  pdf: 'Конфиденциальная работа с документами прямо в памяти браузера.',
  finance: 'Наглядный график платежей и детализация процентов.',
  kz: 'Актуальные формулы и стандарты государственных реестров РК.',
};

/**
 * Get the SEO title of a tool in the specified language
 * @param tool The tool object
 * @param locale The language ('ru' or 'en')
 * @returns The SEO title, or undefined if not set
 */
export function getToolSeoTitle(tool: Tool, locale: string): string {
  if (locale === 'en') {
    return tool.seoTitleEn || `${tool.nameEn || tool.name} — Free Online Tool`;
  }
  if (tool.seoTitle) return tool.seoTitle;
  const postfix = GROUP_TITLE_POSTFIX_RU[tool.groupId] || '— удобный онлайн-инструмент';
  return `${tool.name} ${postfix}`;
}

/**
 * Get the SEO description of a tool in the specified language
 * @param tool The tool object
 * @param locale The language ('ru' or 'en')
 * @returns The SEO description, or undefined if not set
 */
export function getToolSeoDescription(tool: Tool, locale: string): string {
  if (locale === 'en') {
    if (tool.seoDescriptionEn) return tool.seoDescriptionEn;

    const description = asSentence(tool.descriptionEn || tool.description);
    const keywordHint = getEnglishKeywordHint(tool, description);
    const browserHint = `Use ${tool.nameEn || tool.name} free online in your browser.`;
    const parts = [trimMetaDescription(description)];

    appendIfItFits(parts, browserHint);
    appendIfItFits(parts, keywordHint);
    appendIfItFits(parts, 'No installation or account is required.');

    return parts.join(' ');
  }
  if (tool.seoDescription) return tool.seoDescription;
  const desc = asSentence(tool.description);
  const hint = GROUP_DESC_HINT_RU[tool.groupId] || 'Быстрая обработка в один клик.';
  const parts = [trimMetaDescription(desc)];
  appendIfItFits(parts, hint);
  return parts.join(' ');
}

/**
 * Get the display name of a tool group in the specified language
 * @param group The tool group object
 * @param locale The language ('ru' or 'en')
 * @returns The group name in the specified language
 */
export function getGroupName(group: ToolGroup | undefined, locale: string): string {
  if (!group) return '';
  return locale === 'en' ? group.nameEn || group.name : group.name;
}

/**
 * Format Russian plural nouns correctly:
 * 1 инструмент, 2 инструмента, 5 инструментов, 22 инструмента, 183 утилиты
 */
export function formatPluralRu(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${count} ${many}`;
  if (mod10 === 1) return `${count} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} ${few}`;
  return `${count} ${many}`;
}

export function formatToolCount(count: number, locale: string): string {
  if (locale === 'en') {
    return `${count} ${count === 1 ? 'tool' : 'tools'}`;
  }
  return formatPluralRu(count, 'инструмент', 'инструмента', 'инструментов');
}

export function formatUtilityCount(count: number, locale: string): string {
  if (locale === 'en') {
    return `${count} ${count === 1 ? 'utility' : 'utilities'}`;
  }
  return formatPluralRu(count, 'утилита', 'утилиты', 'утилит');
}

