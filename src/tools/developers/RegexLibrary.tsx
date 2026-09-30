"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MagnifyingGlass } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

type PatternCategory =
  "web" | "network" | "date" | "number" | "text" | "developer";

type RegexPattern = {
  id: string;
  nameRu: string;
  nameEn: string;
  descriptionRu: string;
  descriptionEn: string;
  pattern: string;
  flags: string;
  category: PatternCategory;
};

const PATTERNS: RegexPattern[] = [
  {
    id: "email",
    nameRu: "Email-адрес",
    nameEn: "Email address",
    descriptionRu:
      "Практичная проверка обычного email без полной RFC-валидации",
    descriptionEn: "Practical common email check, not full RFC validation",
    pattern: "^[\\w.%+-]+@[\\w.-]+\\.[A-Za-z]{2,}$",
    flags: "",
    category: "web",
  },
  {
    id: "url",
    nameRu: "HTTP(S) URL",
    nameEn: "HTTP(S) URL",
    descriptionRu: "Ссылка с обязательным протоколом http или https",
    descriptionEn: "URL with a required http or https protocol",
    pattern: '^https?:\\/\\/[^\\s<>"{}|\\\\^`\\[\\]]+$',
    flags: "i",
    category: "web",
  },
  {
    id: "domain",
    nameRu: "Домен",
    nameEn: "Domain name",
    descriptionRu: "Доменное имя без протокола и пути",
    descriptionEn: "Domain name without protocol or path",
    pattern:
      "^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,63}$",
    flags: "",
    category: "web",
  },
  {
    id: "ipv4",
    nameRu: "IPv4",
    nameEn: "IPv4",
    descriptionRu: "IPv4-адрес с октетами от 0 до 255",
    descriptionEn: "IPv4 address with octets from 0 to 255",
    pattern:
      "^(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)$",
    flags: "",
    category: "network",
  },
  {
    id: "ipv6-full",
    nameRu: "IPv6 — полная форма",
    nameEn: "IPv6 — full form",
    descriptionRu: "Восемь групп IPv6 без сокращения ::",
    descriptionEn: "Eight IPv6 groups without :: compression",
    pattern: "^(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$",
    flags: "",
    category: "network",
  },
  {
    id: "mac",
    nameRu: "MAC-адрес",
    nameEn: "MAC address",
    descriptionRu: "Шесть шестнадцатеричных пар через : или -",
    descriptionEn: "Six hexadecimal pairs separated by : or -",
    pattern: "^(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$",
    flags: "",
    category: "network",
  },
  {
    id: "iso-date",
    nameRu: "Дата YYYY-MM-DD",
    nameEn: "Date YYYY-MM-DD",
    descriptionRu: "Формат даты; календарную корректность проверяйте отдельно",
    descriptionEn: "Date shape; validate calendar correctness separately",
    pattern: "^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$",
    flags: "",
    category: "date",
  },
  {
    id: "time",
    nameRu: "Время HH:MM",
    nameEn: "Time HH:MM",
    descriptionRu: "24-часовое время от 00:00 до 23:59",
    descriptionEn: "24-hour time from 00:00 to 23:59",
    pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$",
    flags: "",
    category: "date",
  },
  {
    id: "iso-datetime",
    nameRu: "ISO дата и время",
    nameEn: "ISO date and time",
    descriptionRu: "Базовая форма ISO 8601 с секундной точностью",
    descriptionEn: "Basic ISO 8601 shape with second precision",
    pattern:
      "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})$",
    flags: "",
    category: "date",
  },
  {
    id: "integer",
    nameRu: "Целое число",
    nameEn: "Integer",
    descriptionRu: "Положительное или отрицательное целое",
    descriptionEn: "Positive or negative integer",
    pattern: "^[+-]?\\d+$",
    flags: "",
    category: "number",
  },
  {
    id: "decimal",
    nameRu: "Десятичное число",
    nameEn: "Decimal number",
    descriptionRu: "Целое или дробное число с точкой",
    descriptionEn: "Integer or decimal using a dot",
    pattern: "^[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)$",
    flags: "",
    category: "number",
  },
  {
    id: "percent",
    nameRu: "Процент",
    nameEn: "Percentage",
    descriptionRu: "Число от 0 до 100 со знаком процента",
    descriptionEn: "Number from 0 to 100 followed by %",
    pattern: "^(?:100(?:\\.0+)?|\\d{1,2}(?:\\.\\d+)?)%$",
    flags: "",
    category: "number",
  },
  {
    id: "scientific",
    nameRu: "Научная запись",
    nameEn: "Scientific notation",
    descriptionRu: "Число с необязательной экспонентой e",
    descriptionEn: "Number with an optional e exponent",
    pattern: "^[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?$",
    flags: "",
    category: "number",
  },
  {
    id: "hex-number",
    nameRu: "Шестнадцатеричное число",
    nameEn: "Hexadecimal number",
    descriptionRu: "Число с префиксом 0x",
    descriptionEn: "Number with a 0x prefix",
    pattern: "^0[xX][0-9A-Fa-f]+$",
    flags: "",
    category: "number",
  },
  {
    id: "hex-color",
    nameRu: "HEX-цвет",
    nameEn: "HEX color",
    descriptionRu: "Цвет #RGB, #RRGGBB или #RRGGBBAA",
    descriptionEn: "Color as #RGB, #RRGGBB or #RRGGBBAA",
    pattern: "^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$",
    flags: "",
    category: "developer",
  },
  {
    id: "uuid",
    nameRu: "UUID",
    nameEn: "UUID",
    descriptionRu: "UUID версий 1–8 с корректным вариантом",
    descriptionEn: "UUID versions 1–8 with a valid variant",
    pattern:
      "^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[1-8][0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$",
    flags: "",
    category: "developer",
  },
  {
    id: "semver",
    nameRu: "Semantic Version",
    nameEn: "Semantic Version",
    descriptionRu: "Версия SemVer 2.0 с prerelease и build",
    descriptionEn: "SemVer 2.0 with prerelease and build metadata",
    pattern:
      "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$",
    flags: "",
    category: "developer",
  },
  {
    id: "jwt-shape",
    nameRu: "Форма JWT",
    nameEn: "JWT shape",
    descriptionRu: "Три Base64URL-сегмента; подпись не проверяется",
    descriptionEn: "Three Base64URL segments; signature is not verified",
    pattern: "^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$",
    flags: "",
    category: "developer",
  },
  {
    id: "base64-shape",
    nameRu: "Форма Base64",
    nameEn: "Base64 shape",
    descriptionRu: "Строка стандартного Base64; содержимое не декодируется",
    descriptionEn: "Standard Base64 shape; content is not decoded",
    pattern: "^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$",
    flags: "",
    category: "developer",
  },
  {
    id: "slug",
    nameRu: "URL slug",
    nameEn: "URL slug",
    descriptionRu: "Строчные латинские слова через дефис",
    descriptionEn: "Lowercase Latin words separated by hyphens",
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    flags: "",
    category: "text",
  },
  {
    id: "username",
    nameRu: "Имя пользователя",
    nameEn: "Username",
    descriptionRu: "3–32 латинских символа, цифры, _ и -",
    descriptionEn: "3–32 Latin letters, digits, _ and -",
    pattern: "^[A-Za-z0-9_-]{3,32}$",
    flags: "",
    category: "text",
  },
  {
    id: "cyrillic",
    nameRu: "Только кириллица и пробелы",
    nameEn: "Cyrillic letters and spaces",
    descriptionRu: "Русские буквы, дефисы и пробелы",
    descriptionEn: "Russian letters, hyphens and spaces",
    pattern: "^[А-Яа-яЁё\\s-]+$",
    flags: "",
    category: "text",
  },
  {
    id: "trailing-space",
    nameRu: "Пробелы в конце строк",
    nameEn: "Trailing whitespace",
    descriptionRu: "Находит пробелы и табы перед концом строки",
    descriptionEn: "Finds spaces and tabs before line endings",
    pattern: "[\\t ]+$",
    flags: "gm",
    category: "text",
  },
  {
    id: "repeated-space",
    nameRu: "Повторяющиеся пробелы",
    nameEn: "Repeated spaces",
    descriptionRu: "Находит два и более горизонтальных пробела",
    descriptionEn: "Finds two or more horizontal spaces",
    pattern: "[^\\S\\r\\n]{2,}",
    flags: "g",
    category: "text",
  },
  {
    id: "html-comment",
    nameRu: "HTML-комментарий",
    nameEn: "HTML comment",
    descriptionRu: "Находит комментарий без вложенной структуры",
    descriptionEn: "Finds a comment without nested structure",
    pattern: "<!--[\\s\\S]*?-->",
    flags: "g",
    category: "developer",
  },
  {
    id: "markdown-link",
    nameRu: "Markdown-ссылка",
    nameEn: "Markdown link",
    descriptionRu: "Текст ссылки и URL без вложенных скобок",
    descriptionEn: "Link text and URL without nested brackets",
    pattern: "\\[([^\\]]+)]\\(([^)]+)\\)",
    flags: "g",
    category: "developer",
  },
  {
    id: "file-extension",
    nameRu: "Расширение файла",
    nameEn: "File extension",
    descriptionRu: "Последнее расширение в имени файла",
    descriptionEn: "Last extension in a file name",
    pattern: "\\.([A-Za-z0-9]+)$",
    flags: "",
    category: "developer",
  },
];

const CATEGORY_LABELS: Record<PatternCategory, { ru: string; en: string }> = {
  web: { ru: "Веб", en: "Web" },
  network: { ru: "Сеть", en: "Network" },
  date: { ru: "Дата и время", en: "Date & time" },
  number: { ru: "Числа", en: "Numbers" },
  text: { ru: "Текст", en: "Text" },
  developer: { ru: "Разработка", en: "Developer" },
};

export default function RegexLibrary() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PatternCategory | "all">("all");
  const [selectedId, setSelectedId] = useState("email");
  const [testText, setTestText] = useState("");
  const [copied, setCopied] = useState(false);

  const selected =
    PATTERNS.find((item) => item.id === selectedId) ?? PATTERNS[0];
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const matches = PATTERNS.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!normalized) return true;
      return [
        item.nameRu,
        item.nameEn,
        item.descriptionRu,
        item.descriptionEn,
        item.pattern,
      ].some((value) => value.toLocaleLowerCase().includes(normalized));
    });
    return normalized || category !== "all" ? matches : matches.slice(0, 8);
  }, [category, query]);

  const testResult = useMemo(() => {
    if (!testText || !selected) return { matches: [] as string[], error: "" };
    try {
      const flags = selected.flags.includes("g")
        ? selected.flags
        : `${selected.flags}g`;
      const matches = [
        ...testText.matchAll(new RegExp(selected.pattern, flags)),
      ].map((match) => match[0]);
      return { matches: matches.slice(0, 50), error: "" };
    } catch (error) {
      return {
        matches: [],
        error:
          error instanceof Error ? error.message : "Invalid regular expression",
      };
    }
  }, [selected, testText]);

  const literal = `/${selected.pattern}/${selected.flags}`;

  const copyPattern = async () => {
    await navigator.clipboard.writeText(literal);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="regex-search" className="text-sm font-semibold">
          {isEn ? "Find a regular expression" : "Найти регулярное выражение"}
        </Label>
        <div className="relative mt-2">
          <MagnifyingGlass
            size={20}
            className="pointer-events-none absolute left-3 top-3.5 text-[var(--color-text-muted)]"
          />
          <Input
            id="regex-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              isEn ? "Email, URL, date, UUID…" : "Email, URL, дата, UUID…"
            }
            className="h-12 pl-10 text-base"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
              <span>
                {query || category !== "all"
                  ? isEn
                    ? `${filtered.length} found`
                    : `Найдено: ${filtered.length}`
                  : isEn
                    ? "Popular patterns"
                    : "Популярные шаблоны"}
              </span>
              {!query && category === "all" ? (
                <span>
                  {PATTERNS.length} {isEn ? "total" : "всего"}
                </span>
              ) : null}
            </div>
            <div className="max-h-[28rem] space-y-2 overflow-auto pr-1">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full min-h-12 rounded-[var(--radius-md)] border px-3 py-2 text-left transition-colors",
                    selected.id === item.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
                  )}
                >
                  <span className="block text-sm font-semibold">
                    {isEn ? item.nameEn : item.nameRu}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
                    {isEn ? item.descriptionEn : item.descriptionRu}
                  </span>
                </button>
              ))}
              {!filtered.length ? (
                <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                  {isEn ? "No matching patterns" : "Подходящих шаблонов нет"}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              {isEn
                ? CATEGORY_LABELS[selected.category].en
                : CATEGORY_LABELS[selected.category].ru}
            </p>
            <h2 className="mt-1 text-lg font-bold">
              {isEn ? selected.nameEn : selected.nameRu}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {isEn ? selected.descriptionEn : selected.descriptionRu}
            </p>
            <pre className="mt-4 overflow-auto rounded-[var(--radius-md)] bg-[var(--color-code-bg)] p-3 text-sm text-[var(--color-code-text)]">
              <code>{literal}</code>
            </pre>

            <ToolPrimaryAction
              type="button"
              className="mt-4"
              onClick={copyPattern}
              leadingIcon={
                copied ? <Check size={20} weight="bold" /> : <Copy size={20} />
              }
            >
              {copied
                ? isEn
                  ? "Pattern copied"
                  : "Шаблон скопирован"
                : isEn
                  ? "Copy pattern"
                  : "Скопировать шаблон"}
            </ToolPrimaryAction>
          </div>
        </div>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Categories and tester" : "Категории и проверка"}
          description={
            isEn
              ? "Narrow the library or test the selected pattern"
              : "Отфильтруйте библиотеку или проверьте выбранный шаблон"
          }
        >
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] border px-3 text-sm",
                category === "all"
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)]",
              )}
            >
              {isEn ? "All categories" : "Все категории"}
            </button>
            {(Object.keys(CATEGORY_LABELS) as PatternCategory[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] border px-3 text-sm",
                  category === key
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)]",
                )}
              >
                {isEn ? CATEGORY_LABELS[key].en : CATEGORY_LABELS[key].ru}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <Label htmlFor="regex-test-text" className="text-sm font-semibold">
              {isEn ? "Text to test" : "Текст для проверки"}
            </Label>
            <Textarea
              id="regex-test-text"
              rows={6}
              value={testText}
              onChange={(event) => setTestText(event.target.value)}
              placeholder={isEn ? "Enter your own text" : "Введите свой текст"}
              className="mt-2 min-h-32 font-mono text-sm"
            />
            <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
              <div className="text-sm font-semibold">
                {testResult.error
                  ? isEn
                    ? "Pattern error"
                    : "Ошибка шаблона"
                  : isEn
                    ? `Matches: ${testResult.matches.length}`
                    : `Совпадений: ${testResult.matches.length}`}
              </div>
              {testResult.error ? (
                <p className="mt-1 text-sm text-[var(--color-danger)]">
                  {testResult.error}
                </p>
              ) : null}
              {testResult.matches.length ? (
                <ul className="mt-2 max-h-48 space-y-1 overflow-auto font-mono text-xs">
                  {testResult.matches.map((match, index) => (
                    <li
                      key={`${match}-${index}`}
                      className="break-all rounded bg-[var(--color-surface)] px-2 py-1.5"
                    >
                      {match}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
