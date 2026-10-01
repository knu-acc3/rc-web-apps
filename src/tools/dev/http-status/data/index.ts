import { CODES_1_3 } from "./codes-1-3";
import { CODES_4 } from "./codes-4";
import { CODES_5 } from "./codes-5";
import { classOf, type CodeClass, type HttpCode } from "./types";

export const CODES: HttpCode[] = [...CODES_1_3, ...CODES_4, ...CODES_5].sort((a, b) => a.code - b.code);
export const CODE_BY_NUM = new Map(CODES.map((c) => [c.code, c]));

export const CLASSES: { id: CodeClass; range: string; ru: string; en: string; ruShort: string; enShort: string }[] = [
  { id: "informational", range: "1xx", ru: "Информационные ответы", en: "Informational responses", ruShort: "Информационные", enShort: "Informational" },
  { id: "success", range: "2xx", ru: "Успешные ответы", en: "Successful responses", ruShort: "Успешные", enShort: "Success" },
  { id: "redirection", range: "3xx", ru: "Перенаправления", en: "Redirection messages", ruShort: "Редиректы", enShort: "Redirection" },
  { id: "client-error", range: "4xx", ru: "Ошибки клиента", en: "Client error responses", ruShort: "Ошибки клиента", enShort: "Client errors" },
  { id: "server-error", range: "5xx", ru: "Ошибки сервера", en: "Server error responses", ruShort: "Ошибки сервера", enShort: "Server errors" },
];
export const CLASS_BY_ID = new Map(CLASSES.map((c) => [c.id, c]));

export function codesOf(cls: CodeClass): HttpCode[] {
  return CODES.filter((c) => classOf(c.code) === cls);
}

/** Human-facing reason phrase (the registry name for reserved codes is not searchable). */
export function displayName(c: HttpCode): string {
  if (c.code === 418) return "I'm a teapot";
  if (c.code === 306) return "Switch Proxy (Unused)";
  return c.name;
}

export { classOf };
export type { CodeClass, HttpCode };
