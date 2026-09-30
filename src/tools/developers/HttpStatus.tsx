'use client';

import { useCallback, useMemo, useState } from 'react';
import { CheckCircle, Download, MagnifyingGlass } from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/cn';
import { downloadBlob } from '@/src/utils/exportHelpers';
import { writeClipboardText } from '@/src/utils/clipboard';

type Category = 'info' | 'success' | 'redirect' | 'client' | 'server';

interface StatusCode {
  code: number;
  name: string;
  en: string;
  ru: string;
  category: Category;
  common?: boolean;
  rfc?: string;
}

const STATUS_CODES: StatusCode[] = [
  { code: 100, name: 'Continue', en: 'Continue sending the request body.', ru: 'Продолжайте отправку тела запроса.', category: 'info', rfc: 'RFC 9110' },
  { code: 101, name: 'Switching Protocols', en: 'The server is switching protocols.', ru: 'Сервер переключает протокол.', category: 'info', rfc: 'RFC 9110' },
  { code: 102, name: 'Processing', en: 'WebDAV request is still processing.', ru: 'Запрос WebDAV ещё обрабатывается.', category: 'info', rfc: 'RFC 2518' },
  { code: 103, name: 'Early Hints', en: 'Preliminary headers before the final response.', ru: 'Предварительные заголовки до итогового ответа.', category: 'info', rfc: 'RFC 8297' },
  { code: 200, name: 'OK', en: 'The request succeeded.', ru: 'Запрос выполнен успешно.', category: 'success', common: true, rfc: 'RFC 9110' },
  { code: 201, name: 'Created', en: 'A new resource was created.', ru: 'Создан новый ресурс.', category: 'success', common: true, rfc: 'RFC 9110' },
  { code: 202, name: 'Accepted', en: 'Accepted for asynchronous processing.', ru: 'Запрос принят для асинхронной обработки.', category: 'success', common: true, rfc: 'RFC 9110' },
  { code: 204, name: 'No Content', en: 'Succeeded with no response body.', ru: 'Успешно, но без тела ответа.', category: 'success', common: true, rfc: 'RFC 9110' },
  { code: 206, name: 'Partial Content', en: 'A byte range was returned.', ru: 'Возвращена часть ресурса.', category: 'success', common: true, rfc: 'RFC 9110' },
  { code: 207, name: 'Multi-Status', en: 'WebDAV returns multiple statuses.', ru: 'WebDAV возвращает несколько статусов.', category: 'success', rfc: 'RFC 4918' },
  { code: 301, name: 'Moved Permanently', en: 'The resource has a permanent new URL.', ru: 'У ресурса новый постоянный URL.', category: 'redirect', common: true, rfc: 'RFC 9110' },
  { code: 302, name: 'Found', en: 'Temporary redirect, historically called Found.', ru: 'Временное перенаправление.', category: 'redirect', common: true, rfc: 'RFC 9110' },
  { code: 303, name: 'See Other', en: 'Retrieve the result with GET at another URL.', ru: 'Получите результат методом GET по другому URL.', category: 'redirect', rfc: 'RFC 9110' },
  { code: 304, name: 'Not Modified', en: 'The cached representation is still valid.', ru: 'Кэшированная версия всё ещё актуальна.', category: 'redirect', common: true, rfc: 'RFC 9110' },
  { code: 307, name: 'Temporary Redirect', en: 'Temporary redirect that preserves the method.', ru: 'Временный редирект с сохранением метода.', category: 'redirect', common: true, rfc: 'RFC 9110' },
  { code: 308, name: 'Permanent Redirect', en: 'Permanent redirect that preserves the method.', ru: 'Постоянный редирект с сохранением метода.', category: 'redirect', common: true, rfc: 'RFC 9110' },
  { code: 400, name: 'Bad Request', en: 'The request is malformed or invalid.', ru: 'Запрос составлен неверно.', category: 'client', common: true, rfc: 'RFC 9110' },
  { code: 401, name: 'Unauthorized', en: 'Authentication is required or failed.', ru: 'Требуется аутентификация или она не пройдена.', category: 'client', common: true, rfc: 'RFC 9110' },
  { code: 402, name: 'Payment Required', en: 'Reserved for payment-related use.', ru: 'Зарезервировано для платёжных сценариев.', category: 'client', rfc: 'RFC 9110' },
  { code: 403, name: 'Forbidden', en: 'The server understood but refuses the request.', ru: 'Сервер понял запрос, но отказывает в доступе.', category: 'client', common: true, rfc: 'RFC 9110' },
  { code: 404, name: 'Not Found', en: 'The requested resource was not found.', ru: 'Запрошенный ресурс не найден.', category: 'client', common: true, rfc: 'RFC 9110' },
  { code: 405, name: 'Method Not Allowed', en: 'This HTTP method is not allowed here.', ru: 'Этот HTTP-метод здесь не разрешён.', category: 'client', common: true, rfc: 'RFC 9110' },
  { code: 406, name: 'Not Acceptable', en: 'No representation matches Accept headers.', ru: 'Нет представления, подходящего под Accept.', category: 'client', rfc: 'RFC 9110' },
  { code: 407, name: 'Proxy Authentication Required', en: 'Authentication with the proxy is required.', ru: 'Требуется аутентификация на прокси.', category: 'client', rfc: 'RFC 9110' },
  { code: 408, name: 'Request Timeout', en: 'The server timed out waiting for the request.', ru: 'Сервер не дождался запроса вовремя.', category: 'client', common: true, rfc: 'RFC 9110' },
  { code: 409, name: 'Conflict', en: 'The request conflicts with current state.', ru: 'Запрос конфликтует с текущим состоянием.', category: 'client', common: true, rfc: 'RFC 9110' },
  { code: 410, name: 'Gone', en: 'The resource was permanently removed.', ru: 'Ресурс удалён навсегда.', category: 'client', rfc: 'RFC 9110' },
  { code: 411, name: 'Length Required', en: 'Content-Length is required.', ru: 'Требуется заголовок Content-Length.', category: 'client', rfc: 'RFC 9110' },
  { code: 412, name: 'Precondition Failed', en: 'A request precondition evaluated to false.', ru: 'Предусловие запроса не выполнено.', category: 'client', rfc: 'RFC 9110' },
  { code: 413, name: 'Content Too Large', en: 'The request body is too large.', ru: 'Тело запроса слишком большое.', category: 'client', common: true, rfc: 'RFC 9110' },
  { code: 414, name: 'URI Too Long', en: 'The request URI is too long.', ru: 'URI запроса слишком длинный.', category: 'client', rfc: 'RFC 9110' },
  { code: 415, name: 'Unsupported Media Type', en: 'The content type is unsupported.', ru: 'Тип содержимого не поддерживается.', category: 'client', common: true, rfc: 'RFC 9110' },
  { code: 416, name: 'Range Not Satisfiable', en: 'The requested byte range cannot be served.', ru: 'Запрошенный диапазон байтов недоступен.', category: 'client', rfc: 'RFC 9110' },
  { code: 418, name: "I'm a Teapot", en: 'An intentionally non-serious status code.', ru: 'Намеренно шуточный код статуса.', category: 'client', rfc: 'RFC 2324' },
  { code: 422, name: 'Unprocessable Content', en: 'Syntax is valid, but semantic validation failed.', ru: 'Синтаксис верен, но проверка данных не пройдена.', category: 'client', common: true, rfc: 'RFC 9110' },
  { code: 423, name: 'Locked', en: 'The WebDAV resource is locked.', ru: 'Ресурс WebDAV заблокирован.', category: 'client', rfc: 'RFC 4918' },
  { code: 424, name: 'Failed Dependency', en: 'A dependent WebDAV action failed.', ru: 'Зависимое действие WebDAV завершилось ошибкой.', category: 'client', rfc: 'RFC 4918' },
  { code: 425, name: 'Too Early', en: 'The server rejects a replay-risk request.', ru: 'Сервер отклоняет запрос с риском повторной отправки.', category: 'client', rfc: 'RFC 8470' },
  { code: 426, name: 'Upgrade Required', en: 'The client must switch protocols.', ru: 'Клиент должен сменить протокол.', category: 'client', rfc: 'RFC 9110' },
  { code: 428, name: 'Precondition Required', en: 'The server requires a conditional request.', ru: 'Сервер требует условный запрос.', category: 'client', rfc: 'RFC 6585' },
  { code: 429, name: 'Too Many Requests', en: 'The client exceeded a rate limit.', ru: 'Клиент превысил лимит запросов.', category: 'client', common: true, rfc: 'RFC 6585' },
  { code: 431, name: 'Request Header Fields Too Large', en: 'Request headers are too large.', ru: 'Заголовки запроса слишком большие.', category: 'client', rfc: 'RFC 6585' },
  { code: 451, name: 'Unavailable For Legal Reasons', en: 'Access is blocked for legal reasons.', ru: 'Доступ ограничен по юридическим причинам.', category: 'client', rfc: 'RFC 7725' },
  { code: 500, name: 'Internal Server Error', en: 'The server encountered an unexpected error.', ru: 'На сервере произошла непредвиденная ошибка.', category: 'server', common: true, rfc: 'RFC 9110' },
  { code: 501, name: 'Not Implemented', en: 'The server does not support this functionality.', ru: 'Сервер не поддерживает эту возможность.', category: 'server', rfc: 'RFC 9110' },
  { code: 502, name: 'Bad Gateway', en: 'An upstream server returned an invalid response.', ru: 'Вышестоящий сервер вернул неверный ответ.', category: 'server', common: true, rfc: 'RFC 9110' },
  { code: 503, name: 'Service Unavailable', en: 'The service is temporarily unavailable.', ru: 'Сервис временно недоступен.', category: 'server', common: true, rfc: 'RFC 9110' },
  { code: 504, name: 'Gateway Timeout', en: 'An upstream server did not respond in time.', ru: 'Вышестоящий сервер не ответил вовремя.', category: 'server', common: true, rfc: 'RFC 9110' },
  { code: 505, name: 'HTTP Version Not Supported', en: 'The HTTP version is unsupported.', ru: 'Версия HTTP не поддерживается.', category: 'server', rfc: 'RFC 9110' },
  { code: 506, name: 'Variant Also Negotiates', en: 'Content negotiation has a circular reference.', ru: 'Согласование содержимого зациклено.', category: 'server', rfc: 'RFC 2295' },
  { code: 507, name: 'Insufficient Storage', en: 'WebDAV storage is insufficient.', ru: 'Недостаточно хранилища WebDAV.', category: 'server', rfc: 'RFC 4918' },
  { code: 508, name: 'Loop Detected', en: 'A WebDAV processing loop was detected.', ru: 'Обнаружен цикл обработки WebDAV.', category: 'server', rfc: 'RFC 5842' },
  { code: 511, name: 'Network Authentication Required', en: 'Network authentication is required.', ru: 'Требуется сетевая аутентификация.', category: 'server', rfc: 'RFC 6585' },
];

const CATEGORY_META: Record<Category, { en: string; ru: string; tone: string }> = {
  info: { en: 'Informational', ru: 'Информационный', tone: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-950/30' },
  success: { en: 'Success', ru: 'Успех', tone: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/30' },
  redirect: { en: 'Redirect', ru: 'Редирект', tone: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30' },
  client: { en: 'Client error', ru: 'Ошибка клиента', tone: 'text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950/30' },
  server: { en: 'Server error', ru: 'Ошибка сервера', tone: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/30' },
};

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function HttpStatus() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [commonOnly, setCommonOnly] = useState(false);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return STATUS_CODES.filter((status) => {
      if (category !== 'all' && status.category !== category) return false;
      if (commonOnly && !status.common) return false;
      if (!query) return true;
      return String(status.code).includes(query)
        || status.name.toLocaleLowerCase().includes(query)
        || status.en.toLocaleLowerCase().includes(query)
        || status.ru.toLocaleLowerCase().includes(query);
    });
  }, [category, commonOnly, search]);

  const copyStatus = useCallback(async (status: StatusCode) => {
    if (await writeClipboardText(`${status.code} ${status.name}`)) {
      setCopiedCode(status.code);
      window.setTimeout(() => setCopiedCode((current) => current === status.code ? null : current), 1400);
    }
  }, []);

  const downloadCsv = useCallback(() => {
    const rows = [
      ['code', 'name', 'category', 'description', 'rfc'],
      ...filtered.map((status) => [status.code, status.name, status.category, isEn ? status.en : status.ru, status.rfc ?? '']),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    downloadBlob(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }), 'http-status-codes.csv');
  }, [filtered, isEn]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="relative">
          <MagnifyingGlass size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <Input
            id="http-status-search"
            className="h-14 pl-12 text-lg"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isEn ? 'Search code, name or meaning' : 'Код, название или смысл'}
            aria-label={isEn ? 'Search HTTP status codes' : 'Поиск HTTP-кодов'}
            autoFocus
          />
        </div>
        <div className="mt-2 text-xs text-[var(--color-text-muted)]">
          {isEn ? `${filtered.length} matching status codes` : `Найдено кодов: ${filtered.length}`}
        </div>
      </Card>

      <div className="space-y-2" aria-live="polite">
        {filtered.length > 0 ? filtered.map((status) => {
          const meta = CATEGORY_META[status.category];
          return (
            <button
              key={status.code}
              type="button"
              onClick={() => void copyStatus(status)}
              className="flex min-h-16 w-full items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/30 sm:p-4"
            >
              <span className={cn('flex min-w-16 shrink-0 items-center justify-center rounded-[var(--radius-sm)] px-2 py-1 font-mono text-lg font-bold', meta.tone)}>{status.code}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold">{status.name}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{status.rfc}</span>
                </span>
                <span className="mt-1 block text-sm text-[var(--color-text-muted)]">{isEn ? status.en : status.ru}</span>
              </span>
              {copiedCode === status.code ? <CheckCircle size={22} weight="fill" className="shrink-0 text-[var(--color-success)]" /> : null}
            </button>
          );
        }) : (
          <Card className="p-6 text-center text-sm text-[var(--color-text-muted)]">
            {isEn ? 'No status code matches this search.' : 'Подходящий HTTP-код не найден.'}
          </Card>
        )}
      </div>

      <AdvancedSettings
        title={isEn ? 'Filters and CSV export' : 'Фильтры и экспорт CSV'}
        description={isEn ? 'Category, common codes and the current result set' : 'Категория, частые коды и текущая выборка'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="http-status-category" className="text-sm font-medium">{isEn ? 'Category' : 'Категория'}</label>
            <select id="http-status-category" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={category} onChange={(event) => setCategory(event.target.value as Category | 'all')}>
              <option value="all">{isEn ? 'All categories' : 'Все категории'}</option>
              {(Object.keys(CATEGORY_META) as Category[]).map((key) => <option key={key} value={key}>{isEn ? CATEGORY_META[key].en : CATEGORY_META[key].ru}</option>)}
            </select>
          </div>
          <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
            <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={commonOnly} onChange={(event) => setCommonOnly(event.target.checked)} />
            {isEn ? 'Common codes only' : 'Только часто используемые'}
          </label>
          <Button variant="outline" className="min-h-11" onClick={downloadCsv} disabled={filtered.length === 0}>
            <Download size={18} /> {isEn ? 'Download current CSV' : 'Скачать текущий CSV'}
          </Button>
        </div>
      </AdvancedSettings>
    </div>
  );
}
