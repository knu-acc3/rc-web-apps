"use client";

import { useMemo, useState } from "react";
import { Check, Copy, DownloadSimple, Warning } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

type AccessMode = "allow" | "block";

export const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "Anthropic-AI",
  "CCBot",
  "PerplexityBot",
  "Bytespider",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "cohere-ai",
  "Diffbot",
  "FacebookBot",
  "Omgilibot",
];

function toHttpUrl(value: string) {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function ruleLines(value: string) {
  return [
    ...new Set(
      value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) =>
          line.startsWith("/") || line.startsWith("*") ? line : `/${line}`,
        ),
    ),
  ];
}

function downloadRobots(value: string) {
  const url = URL.createObjectURL(
    new Blob([value], { type: "text/plain;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "robots.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function RobotsGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [mode, setMode] = useState<AccessMode>("allow");
  const [siteUrl, setSiteUrl] = useState("");
  const [sitemapOverride, setSitemapOverride] = useState("");
  const [disallowPaths, setDisallowPaths] = useState("");
  const [allowPaths, setAllowPaths] = useState("");
  const [crawlDelay, setCrawlDelay] = useState("");
  const [blockAi, setBlockAi] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsedSite = toHttpUrl(siteUrl);
  const parsedSitemap = toHttpUrl(sitemapOverride);
  const hasInvalidSite = Boolean(siteUrl.trim()) && !parsedSite;
  const hasInvalidSitemap = Boolean(sitemapOverride.trim()) && !parsedSitemap;
  const sitemapUrl =
    parsedSitemap?.toString() ??
    (parsedSite ? new URL("/sitemap.xml", parsedSite).toString() : "");

  const output = useMemo(() => {
    const lines: string[] = ["User-agent: *"];
    if (mode === "block") {
      lines.push("Disallow: /");
    } else {
      const disallowed = ruleLines(disallowPaths);
      const allowed = ruleLines(allowPaths);
      if (!disallowed.length) lines.push("Allow: /");
      for (const path of disallowed) lines.push(`Disallow: ${path}`);
      for (const path of allowed) lines.push(`Allow: ${path}`);
      const delay = Number(crawlDelay);
      if (crawlDelay.trim() && Number.isFinite(delay) && delay >= 0)
        lines.push(`Crawl-delay: ${delay}`);
    }

    if (blockAi) {
      for (const crawler of AI_CRAWLERS)
        lines.push("", `User-agent: ${crawler}`, "Disallow: /");
    }
    if (sitemapUrl) lines.push("", `Sitemap: ${sitemapUrl}`);
    return `${lines.join("\n")}\n`;
  }, [allowPaths, blockAi, crawlDelay, disallowPaths, mode, sitemapUrl]);

  const copyOutput = async () => {
    if (hasInvalidSite || hasInvalidSitemap) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <fieldset>
          <legend className="text-sm font-semibold">
            {isEn ? "Search engine access" : "Доступ поисковых роботов"}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["allow", isEn ? "Allow indexing" : "Разрешить индексацию"],
                ["block", isEn ? "Block the entire site" : "Закрыть весь сайт"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setCopied(false);
                }}
                className={cn(
                  "min-h-12 rounded-[var(--radius-md)] border px-3 py-2 text-sm font-semibold",
                  mode === value
                    ? value === "block"
                      ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                      : "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <Label htmlFor="robots-site-url" className="text-sm font-semibold">
            {isEn ? "Website URL — optional" : "URL сайта — необязательно"}
          </Label>
          <Input
            id="robots-site-url"
            value={siteUrl}
            onChange={(event) => {
              setSiteUrl(event.target.value);
              setCopied(false);
            }}
            placeholder="https://site.test"
            className={cn(
              "mt-2 h-12",
              hasInvalidSite && "border-[var(--color-danger)]",
            )}
            aria-invalid={hasInvalidSite}
          />
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            {isEn
              ? "Used to add the sitemap URL automatically."
              : "Используется, чтобы автоматически добавить URL sitemap."}
          </p>
        </div>

        {mode === "block" ? (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
          >
            <Warning size={19} weight="fill" className="mt-0.5 shrink-0" />
            <span>
              {isEn
                ? "This rule asks compliant crawlers not to visit any page. Use it only when that is intentional."
                : "Это правило просит соблюдающих robots.txt роботов не посещать ни одну страницу. Используйте его только осознанно."}
            </span>
          </div>
        ) : null}
        {hasInvalidSite || hasInvalidSitemap ? (
          <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
            {isEn
              ? "Use a full http or https URL."
              : "Используйте полный URL с http или https."}
          </p>
        ) : null}

        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-code-bg)] p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-code-muted)]">
            robots.txt
          </div>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap font-mono text-sm text-[var(--color-code-text)]">
            <code>{output}</code>
          </pre>
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={hasInvalidSite || hasInvalidSitemap}
          onClick={copyOutput}
          leadingIcon={
            copied ? <Check size={20} weight="bold" /> : <Copy size={20} />
          }
        >
          {copied
            ? isEn
              ? "robots.txt copied"
              : "robots.txt скопирован"
            : isEn
              ? "Copy robots.txt"
              : "Скопировать robots.txt"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Custom rules" : "Свои правила"}
          description={
            isEn
              ? "Paths, sitemap override, crawl delay and optional AI crawler groups"
              : "Пути, отдельный sitemap, задержка и группы AI-роботов"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="robots-disallow">
                {isEn
                  ? "Disallow paths — one per line"
                  : "Запрещённые пути — по одному в строке"}
              </Label>
              <Textarea
                id="robots-disallow"
                rows={5}
                value={disallowPaths}
                disabled={mode === "block"}
                onChange={(event) => {
                  setDisallowPaths(event.target.value);
                  setCopied(false);
                }}
                placeholder={"/admin\n/private"}
                className="mt-1.5 min-h-28 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="robots-allow">
                {isEn
                  ? "Allow exceptions — one per line"
                  : "Разрешённые исключения — по одному в строке"}
              </Label>
              <Textarea
                id="robots-allow"
                rows={5}
                value={allowPaths}
                disabled={mode === "block"}
                onChange={(event) => {
                  setAllowPaths(event.target.value);
                  setCopied(false);
                }}
                placeholder="/public"
                className="mt-1.5 min-h-28 font-mono"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="robots-sitemap">
                {isEn ? "Sitemap URL override" : "Отдельный URL sitemap"}
              </Label>
              <Input
                id="robots-sitemap"
                value={sitemapOverride}
                onChange={(event) => {
                  setSitemapOverride(event.target.value);
                  setCopied(false);
                }}
                placeholder="https://site.test/sitemap.xml"
                className={cn(
                  "mt-1.5 h-11 font-mono",
                  hasInvalidSitemap && "border-[var(--color-danger)]",
                )}
              />
            </div>
            <div>
              <Label htmlFor="robots-delay">Crawl-delay</Label>
              <Input
                id="robots-delay"
                type="number"
                min={0}
                value={crawlDelay}
                disabled={mode === "block"}
                onChange={(event) => {
                  setCrawlDelay(event.target.value);
                  setCopied(false);
                }}
                className="mt-1.5 h-11"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? "Google ignores Crawl-delay; support varies by crawler."
                  : "Google игнорирует Crawl-delay; поддержка зависит от робота."}
              </p>
            </div>
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
            <input
              type="checkbox"
              checked={blockAi}
              onChange={(event) => {
                setBlockAi(event.target.checked);
                setCopied(false);
              }}
              className="size-5 accent-[var(--color-primary)]"
            />
            <span>
              {isEn
                ? "Add voluntary Disallow groups for common AI crawlers"
                : "Добавить добровольный запрет для распространённых AI-роботов"}
            </span>
          </label>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            {isEn
              ? "robots.txt is advisory; it does not enforce access control."
              : "robots.txt носит рекомендательный характер и не заменяет контроль доступа."}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4 min-h-11"
            onClick={() => downloadRobots(output)}
            disabled={hasInvalidSite || hasInvalidSitemap}
          >
            <DownloadSimple size={18} />{" "}
            {isEn ? "Download robots.txt" : "Скачать robots.txt"}
          </Button>
        </AdvancedSettings>
      </section>
    </div>
  );
}
