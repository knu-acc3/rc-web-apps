"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  DownloadSimple,
  Globe,
  ListBullets,
  Warning,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";
import { writeClipboardText } from "@/src/utils/clipboard";
import { downloadBlob } from "@/src/utils/exportHelpers";

type InputMode = "crawl" | "list";
type ChangeFrequency =
  | ""
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

interface SitemapFile {
  filename: string;
  xml: string;
  urlCount: number;
}

interface GenerationResult {
  urls: string[];
  files: SitemapFile[];
  skipped: number;
  scanned?: number;
  limited?: boolean;
  timedOut?: boolean;
  queueLimited?: boolean;
}

interface SitemapOptions {
  lastmod: string;
  changefreq: ChangeFrequency;
  priority: string;
  urlsPerFile: number;
}

const MAX_URLS_PER_FILE = 50_000;
const MAX_XML_BYTES = 50 * 1024 * 1024;
const MAX_CRAWL_PAGES = 2_000;
const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n';
const URLSET_OPEN =
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
const URLSET_CLOSE = "</urlset>\n";
const encoder = new TextEncoder();

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeAbsoluteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2_048) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname || url.username || url.password) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function renderUrlEntry(url: string, options: SitemapOptions) {
  const lines = ["  <url>", `    <loc>${escapeXml(url)}</loc>`];
  if (options.lastmod) {
    lines.push(`    <lastmod>${escapeXml(options.lastmod)}</lastmod>`);
  }
  if (options.changefreq) {
    lines.push(`    <changefreq>${escapeXml(options.changefreq)}</changefreq>`);
  }
  if (options.priority) {
    lines.push(`    <priority>${escapeXml(options.priority)}</priority>`);
  }
  lines.push("  </url>");
  return `${lines.join("\n")}\n`;
}

function renderUrlset(entries: string[]) {
  return `${XML_HEADER}${URLSET_OPEN}${entries.join("")}${URLSET_CLOSE}`;
}

function renderSitemapIndex(origin: string, files: SitemapFile[]) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const file of files) {
    const absoluteLocation = new URL(`/${file.filename}`, origin).toString();
    lines.push("  <sitemap>");
    lines.push(`    <loc>${escapeXml(absoluteLocation)}</loc>`);
    lines.push("  </sitemap>");
  }

  lines.push("</sitemapindex>");
  return `${lines.join("\n")}\n`;
}

function buildSitemapFiles(urls: string[], options: SitemapOptions) {
  const fixedBytes = encoder.encode(
    `${XML_HEADER}${URLSET_OPEN}${URLSET_CLOSE}`,
  ).byteLength;
  const chunks: string[][] = [];
  let currentEntries: string[] = [];
  let currentBytes = fixedBytes;

  for (const url of urls) {
    const entry = renderUrlEntry(url, options);
    const entryBytes = encoder.encode(entry).byteLength;
    const mustSplit =
      currentEntries.length > 0 &&
      (currentEntries.length >= options.urlsPerFile ||
        currentBytes + entryBytes > MAX_XML_BYTES);

    if (mustSplit) {
      chunks.push(currentEntries);
      currentEntries = [];
      currentBytes = fixedBytes;
    }

    currentEntries.push(entry);
    currentBytes += entryBytes;
  }

  if (currentEntries.length > 0) chunks.push(currentEntries);

  if (chunks.length > MAX_URLS_PER_FILE) {
    throw new Error("SITEMAP_INDEX_LIMIT");
  }

  if (chunks.length === 1) {
    return [
      {
        filename: "sitemap.xml",
        xml: renderUrlset(chunks[0]),
        urlCount: urls.length,
      },
    ];
  }

  const childFiles = chunks.map((chunk, index) => ({
    filename: `sitemap-${index + 1}.xml`,
    xml: renderUrlset(chunk),
    urlCount: chunk.length,
  }));
  const origin = new URL(urls[0]).origin;

  return [
    {
      filename: "sitemap.xml",
      xml: renderSitemapIndex(origin, childFiles),
      urlCount: 0,
    },
    ...childFiles,
  ];
}

function parseUrlList(value: string) {
  const unique = new Set<string>();
  let skipped = 0;

  for (const line of value.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const normalized = normalizeAbsoluteUrl(line);
    if (!normalized) {
      skipped += 1;
      continue;
    }
    unique.add(normalized);
  }

  return { urls: [...unique], skipped };
}

function formatBytes(bytes: number, isEn: boolean) {
  if (bytes < 1024) return `${bytes} ${isEn ? "B" : "Б"}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SitemapGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [mode, setMode] = useState<InputMode>("crawl");
  const [siteUrl, setSiteUrl] = useState("");
  const [urlList, setUrlList] = useState("");
  const [lastmod, setLastmod] = useState("");
  const [changefreq, setChangefreq] = useState<ChangeFrequency>("");
  const [priority, setPriority] = useState("");
  const [urlsPerFile, setUrlsPerFile] = useState(MAX_URLS_PER_FILE);
  const [crawlLimit, setCrawlLimit] = useState(500);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [selectedFile, setSelectedFile] = useState("sitemap.xml");
  const [error, setError] = useState("");
  const [copyError, setCopyError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const activeFile = useMemo(
    () =>
      result?.files.find((file) => file.filename === selectedFile) ??
      result?.files[0] ??
      null,
    [result, selectedFile],
  );

  const resetOutput = () => {
    setResult(null);
    setError("");
    setCopyError("");
    setCopied(false);
    setSelectedFile("sitemap.xml");
  };

  const options = (): SitemapOptions => ({
    lastmod,
    changefreq,
    priority,
    urlsPerFile: Math.min(
      MAX_URLS_PER_FILE,
      Math.max(1, Math.floor(urlsPerFile || MAX_URLS_PER_FILE)),
    ),
  });

  const validatePriority = () => {
    if (!priority.trim()) return "";
    const numeric = Number(priority);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1) {
      return isEn
        ? "Priority must be between 0.0 and 1.0."
        : "Priority должен быть от 0.0 до 1.0.";
    }
    return numeric.toFixed(1);
  };

  const generate = async () => {
    if (loading) return;
    setError("");
    setCopyError("");
    setCopied(false);

    const normalizedPriority = validatePriority();
    if (priority.trim() && !normalizedPriority) {
      setError(
        isEn
          ? "Priority must be between 0.0 and 1.0."
          : "Priority должен быть от 0.0 до 1.0.",
      );
      return;
    }

    let urls: string[] = [];
    let skipped = 0;
    let crawlMeta: Pick<
      GenerationResult,
      "scanned" | "limited" | "timedOut" | "queueLimited"
    > = {};

    try {
      setLoading(true);

      if (mode === "crawl") {
        const normalizedSiteUrl = normalizeAbsoluteUrl(siteUrl);
        if (!normalizedSiteUrl) {
          throw new Error(
            isEn
              ? "Enter a full website URL starting with http:// or https://."
              : "Введите полный URL сайта с http:// или https://.",
          );
        }

        const response = await fetch("/api/sitemap/crawl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: normalizedSiteUrl,
            maxPages: Math.min(
              MAX_CRAWL_PAGES,
              Math.max(1, Math.floor(crawlLimit || 500)),
            ),
          }),
        });
        const data = (await response.json()) as {
          error?: string;
          urls?: unknown[];
          scanned?: number;
          limited?: boolean;
          timedOut?: boolean;
          queueLimited?: boolean;
        };

        if (!response.ok) {
          throw new Error(
            data.error ||
              (isEn
                ? "The site could not be scanned."
                : "Не удалось просканировать сайт."),
          );
        }

        const parsed = parseUrlList(
          Array.isArray(data.urls) ? data.urls.map(String).join("\n") : "",
        );
        urls = parsed.urls;
        skipped = parsed.skipped;
        crawlMeta = {
          scanned: Number(data.scanned || 0),
          limited: Boolean(data.limited),
          timedOut: Boolean(data.timedOut),
          queueLimited: Boolean(data.queueLimited),
        };
      } else {
        const parsed = parseUrlList(urlList);
        urls = parsed.urls;
        skipped = parsed.skipped;
      }

      if (urls.length === 0) {
        throw new Error(
          isEn
            ? "No valid absolute HTTP(S) URLs were found."
            : "Не найдено ни одного корректного абсолютного HTTP(S) URL.",
        );
      }

      const origins = new Set(urls.map((url) => new URL(url).origin));
      if (origins.size > 1) {
        throw new Error(
          isEn
            ? "All URLs in one sitemap must belong to the same site."
            : "Все URL в одном sitemap должны принадлежать одному сайту.",
        );
      }

      const sitemapOptions = options();
      sitemapOptions.priority = normalizedPriority;
      const files = buildSitemapFiles(urls, sitemapOptions);

      setResult({ urls, files, skipped, ...crawlMeta });
      setSelectedFile("sitemap.xml");
    } catch (caughtError) {
      setResult(null);
      setError(
        caughtError instanceof Error &&
          caughtError.message === "SITEMAP_INDEX_LIMIT"
          ? isEn
            ? "This setup would create more than 50,000 sitemap files. Increase the URLs-per-file limit."
            : "При таких настройках получится больше 50 000 sitemap-файлов. Увеличьте лимит URL в одном файле."
          : caughtError instanceof Error
            ? caughtError.message
            : isEn
              ? "Sitemap could not be created."
              : "Не удалось создать sitemap.",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyXml = async () => {
    if (!activeFile) return;
    const success = await writeClipboardText(activeFile.xml);
    if (!success) {
      setCopyError(
        isEn
          ? "The browser did not allow clipboard access. Select the XML in the preview and copy it manually."
          : "Браузер не разрешил доступ к буферу обмена. Выделите XML в окне просмотра и скопируйте вручную.",
      );
      return;
    }
    setCopyError("");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_600);
  };

  const downloadFiles = async () => {
    if (!result || downloading) return;
    setDownloading(true);

    try {
      if (result.files.length === 1) {
        downloadBlob(
          new Blob([result.files[0].xml], {
            type: "application/xml;charset=utf-8",
          }),
          "sitemap.xml",
        );
        return;
      }

      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const file of result.files) zip.file(file.filename, file.xml);
      downloadBlob(
        await zip.generateAsync({ type: "blob" }),
        "sitemap-package.zip",
      );
    } finally {
      setDownloading(false);
    }
  };

  const crawlWarning =
    result && (result.limited || result.timedOut || result.queueLimited);

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <fieldset className="min-w-0">
          <legend className="text-sm font-semibold">
            {isEn ? "How to add pages" : "Как добавить страницы"}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                [
                  "crawl",
                  isEn ? "Scan a website" : "Сканировать сайт",
                  <Globe key="crawl-icon" size={19} />,
                ],
                [
                  "list",
                  isEn ? "Paste URL list" : "Вставить список URL",
                  <ListBullets key="list-icon" size={19} />,
                ],
              ] as const
            ).map(([value, label, icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  resetOutput();
                }}
                className={cn(
                  "flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-2.5 py-2 text-center text-sm font-semibold transition-colors",
                  mode === value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                <span className="shrink-0">{icon}</span>
                <span className="min-w-0 leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {mode === "crawl" ? (
          <div className="mt-4">
            <Label htmlFor="sitemap-site-url" className="text-sm font-semibold">
              {isEn ? "Website URL" : "URL сайта"}
            </Label>
            <Input
              id="sitemap-site-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              value={siteUrl}
              onChange={(event) => {
                setSiteUrl(event.target.value);
                resetOutput();
              }}
              placeholder="https://your-site.com"
              className="mt-2 h-12"
            />
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "Reads Sitemap declarations from robots.txt, existing sitemap files and same-origin links in server-rendered HTML. It does not apply Disallow rules; JavaScript-only routes may be missed."
                : "Читает объявления Sitemap из robots.txt, существующие sitemap и ссылки того же сайта в серверном HTML. Правила Disallow не применяются; маршруты только через JavaScript могут быть пропущены."}
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <Label htmlFor="sitemap-url-list" className="text-sm font-semibold">
              {isEn
                ? "One absolute URL per line"
                : "По одному абсолютному URL в строке"}
            </Label>
            <Textarea
              id="sitemap-url-list"
              value={urlList}
              onChange={(event) => {
                setUrlList(event.target.value);
                resetOutput();
              }}
              placeholder={
                "https://your-site.com/\nhttps://your-site.com/about"
              }
              rows={7}
              className="mt-2 min-h-40 min-w-0 max-w-full resize-y font-mono text-sm"
            />
            <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
              {isEn
                ? "Only absolute HTTP(S) URLs from one site are included; duplicates are removed."
                : "Добавляются только абсолютные HTTP(S) URL одного сайта; дубликаты удаляются."}
            </p>
          </div>
        )}

        {error ? (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
          >
            <Warning size={19} weight="fill" className="mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        ) : null}

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          onClick={generate}
          loading={loading}
          loadingLabel={isEn ? "Creating sitemap…" : "Создаём sitemap…"}
          disabled={mode === "crawl" ? !siteUrl.trim() : !urlList.trim()}
        >
          {isEn ? "Generate sitemap" : "Создать sitemap"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Advanced settings" : "Расширенные настройки"}
          description={
            isEn
              ? "Metadata, file splitting and crawl limit"
              : "Метаданные, разделение файлов и лимит обхода"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sitemap-lastmod">
                {isEn
                  ? "Last modified — all URLs"
                  : "Дата изменения — для всех URL"}
              </Label>
              <Input
                id="sitemap-lastmod"
                type="date"
                value={lastmod}
                onChange={(event) => {
                  setLastmod(event.target.value);
                  resetOutput();
                }}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="sitemap-changefreq">changefreq</Label>
              <select
                id="sitemap-changefreq"
                value={changefreq}
                onChange={(event) => {
                  setChangefreq(event.target.value as ChangeFrequency);
                  resetOutput();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="">{isEn ? "Do not add" : "Не добавлять"}</option>
                <option value="always">always</option>
                <option value="hourly">hourly</option>
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
                <option value="monthly">monthly</option>
                <option value="yearly">yearly</option>
                <option value="never">never</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sitemap-priority">
                {isEn ? "Priority — optional" : "Priority — необязательно"}
              </Label>
              <Input
                id="sitemap-priority"
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={priority}
                onChange={(event) => {
                  setPriority(event.target.value);
                  resetOutput();
                }}
                placeholder={isEn ? "Do not add" : "Не добавлять"}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="sitemap-file-limit">
                {isEn ? "URLs per file" : "URL в одном файле"}
              </Label>
              <Input
                id="sitemap-file-limit"
                type="number"
                min={1}
                max={MAX_URLS_PER_FILE}
                value={urlsPerFile}
                onChange={(event) => {
                  setUrlsPerFile(Number(event.target.value));
                  resetOutput();
                }}
                className="mt-1.5 h-11"
              />
            </div>
            {mode === "crawl" ? (
              <div>
                <Label htmlFor="sitemap-crawl-limit">
                  {isEn
                    ? "Maximum pages to scan"
                    : "Максимум страниц для обхода"}
                </Label>
                <Input
                  id="sitemap-crawl-limit"
                  type="number"
                  min={1}
                  max={MAX_CRAWL_PAGES}
                  value={crawlLimit}
                  onChange={(event) => {
                    setCrawlLimit(Number(event.target.value));
                    resetOutput();
                  }}
                  className="mt-1.5 h-11"
                />
              </div>
            ) : null}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Every generated sitemap is automatically kept within 50,000 URLs and 50 MB uncompressed. Google ignores changefreq and priority; use lastmod only when the date is accurate. Website scans also stop after 25 seconds or 2,000 pages."
              : "Каждый созданный sitemap автоматически ограничивается 50 000 URL и 50 МБ без сжатия. Google игнорирует changefreq и priority; добавляйте lastmod только с точной датой. Обход сайта также останавливается через 25 секунд или после 2 000 страниц."}
          </p>
        </AdvancedSettings>
      </section>

      {result && activeFile ? (
        <section
          aria-live="polite"
          className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-semibold">
                {isEn ? "Sitemap is ready" : "Sitemap готов"}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {isEn
                  ? `${result.urls.length.toLocaleString()} URLs · ${result.files.length.toLocaleString()} file(s)`
                  : `${result.urls.length.toLocaleString()} URL · файлов: ${result.files.length.toLocaleString()}`}
                {result.scanned !== undefined
                  ? isEn
                    ? ` · ${result.scanned.toLocaleString()} pages requested`
                    : ` · запрошено страниц: ${result.scanned.toLocaleString()}`
                  : ""}
              </p>
              {result.skipped > 0 ? (
                <p className="mt-1 text-xs text-[var(--color-warning)]">
                  {isEn
                    ? `${result.skipped} invalid URL(s) skipped.`
                    : `Пропущено некорректных URL: ${result.skipped}.`}
                </p>
              ) : null}
            </div>

            {result.files.length > 1 ? (
              <div className="w-full min-w-0 sm:w-52">
                <Label htmlFor="sitemap-preview-file" className="sr-only">
                  {isEn ? "Preview file" : "Файл для просмотра"}
                </Label>
                <select
                  id="sitemap-preview-file"
                  value={activeFile.filename}
                  onChange={(event) => {
                    setSelectedFile(event.target.value);
                    setCopied(false);
                  }}
                  className="h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
                >
                  {result.files.map((file) => (
                    <option key={file.filename} value={file.filename}>
                      {file.filename}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {crawlWarning ? (
            <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-3 text-sm text-[var(--color-text)]">
              <Warning
                size={19}
                weight="fill"
                className="mt-0.5 shrink-0 text-[var(--color-warning)]"
              />
              <span>
                {isEn
                  ? "The scan reached a time, page or queue safety limit. The sitemap contains only URLs found before that limit."
                  : "Обход достиг ограничения по времени, числу страниц или очереди. В sitemap вошли только URL, найденные до остановки."}
              </span>
            </div>
          ) : null}

          <div className="mt-4 min-w-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-code-bg)]">
            <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[var(--color-code-border)] px-3 py-2 text-xs text-[var(--color-code-muted)]">
              <span className="min-w-0 truncate font-semibold">
                {activeFile.filename}
              </span>
              <span className="shrink-0">
                {formatBytes(encoder.encode(activeFile.xml).byteLength, isEn)}
              </span>
            </div>
            <pre className="m-0 max-h-80 overflow-auto whitespace-pre p-3 font-mono text-xs leading-relaxed text-[var(--color-code-text)]">
              <code>{activeFile.xml}</code>
            </pre>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 min-w-0 px-2 sm:px-4"
              onClick={copyXml}
            >
              {copied ? <Check size={18} weight="bold" /> : <Copy size={18} />}
              <span className="min-w-0 truncate">
                {copied
                  ? isEn
                    ? "Copied"
                    : "Скопировано"
                  : isEn
                    ? "Copy XML"
                    : "Копировать XML"}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 min-w-0 px-2 sm:px-4"
              onClick={downloadFiles}
              disabled={downloading}
            >
              <DownloadSimple size={18} />
              <span className="min-w-0 truncate">
                {downloading
                  ? isEn
                    ? "Preparing…"
                    : "Подготовка…"
                  : result.files.length > 1
                    ? isEn
                      ? "Download ZIP"
                      : "Скачать ZIP"
                    : isEn
                      ? "Download XML"
                      : "Скачать XML"}
              </span>
            </Button>
          </div>
          {copyError ? (
            <p
              role="alert"
              className="mt-2 text-sm leading-relaxed text-[var(--color-danger)]"
            >
              {copyError}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
