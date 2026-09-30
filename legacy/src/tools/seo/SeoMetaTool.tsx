"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  DownloadSimple,
  Image as ImageIcon,
  MagnifyingGlass,
  Plus,
  Trash,
  Warning,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { CopyButton, copyText } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/cn";
import { downloadBlob } from "@/src/utils/exportHelpers";

type RobotsIndex = "index" | "noindex";
type RobotsFollow = "follow" | "nofollow";
type SchemaType =
  | "WebPage"
  | "Article"
  | "Product"
  | "Recipe"
  | "Event"
  | "Organization"
  | "Person"
  | "FAQPage";

interface HreflangRow {
  id: string;
  lang: string;
  href: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface MetaSettings {
  robotsIndex: RobotsIndex;
  robotsFollow: RobotsFollow;
  canonicalUrl: string;
  ogType: "website" | "article";
  siteName: string;
  imageUrl: string;
  twitterCard: "summary" | "summary_large_image";
  twitterSite: string;
  hreflangs: HreflangRow[];
  schemaEnabled: boolean;
  schemaType: SchemaType;
  articleAuthor: string;
  articlePublished: string;
  articleModified: string;
  productBrand: string;
  productSku: string;
  productPrice: string;
  productCurrency: string;
  recipeYield: string;
  recipePrepTime: string;
  recipeCookTime: string;
  recipeIngredients: string;
  eventStart: string;
  eventEnd: string;
  eventLocation: string;
  eventAddress: string;
  organizationName: string;
  organizationLogo: string;
  organizationPhone: string;
  organizationSameAs: string;
  personName: string;
  personUrl: string;
  faqs: FaqItem[];
}

interface OutputWarning {
  id: string;
  text: string;
}

interface GeneratedOutput {
  code: string;
  warnings: OutputWarning[];
  pageUrl: string | null;
  canonicalUrl: string | null;
  imageUrl: string | null;
}

const DEFAULT_SETTINGS: MetaSettings = {
  robotsIndex: "index",
  robotsFollow: "follow",
  canonicalUrl: "",
  ogType: "website",
  siteName: "",
  imageUrl: "",
  twitterCard: "summary_large_image",
  twitterSite: "",
  hreflangs: [],
  schemaEnabled: false,
  schemaType: "WebPage",
  articleAuthor: "",
  articlePublished: "",
  articleModified: "",
  productBrand: "",
  productSku: "",
  productPrice: "",
  productCurrency: "",
  recipeYield: "",
  recipePrepTime: "",
  recipeCookTime: "",
  recipeIngredients: "",
  eventStart: "",
  eventEnd: "",
  eventLocation: "",
  eventAddress: "",
  organizationName: "",
  organizationLogo: "",
  organizationPhone: "",
  organizationSameAs: "",
  personName: "",
  personUrl: "",
  faqs: [],
};

let localId = 0;

function createId(prefix: string): string {
  localId += 1;
  return prefix + "-" + String(localId);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJsonForHtml(value: unknown): string {
  return JSON.stringify(value, null, 2)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function isValidHreflang(value: string): boolean {
  const normalized = value.trim();
  if (normalized === "x-default") return true;
  return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(normalized);
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSchema(
  title: string,
  description: string,
  pageUrl: string | null,
  canonicalUrl: string | null,
  imageUrl: string | null,
  settings: MetaSettings,
): Record<string, unknown> | null {
  if (!settings.schemaEnabled) return null;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": settings.schemaType,
  };

  const cleanTitle = title.trim();
  const cleanDescription = description.trim();
  const effectiveUrl = canonicalUrl || pageUrl;

  if (cleanTitle) schema.name = cleanTitle;
  if (cleanDescription) schema.description = cleanDescription;
  if (effectiveUrl) schema.url = effectiveUrl;
  if (imageUrl) schema.image = imageUrl;

  if (settings.schemaType === "Article") {
    if (settings.articleAuthor.trim()) {
      schema.author = {
        "@type": "Person",
        name: settings.articleAuthor.trim(),
      };
    }
    if (settings.articlePublished)
      schema.datePublished = settings.articlePublished;
    if (settings.articleModified)
      schema.dateModified = settings.articleModified;
  }

  if (settings.schemaType === "Product") {
    if (settings.productBrand.trim()) {
      schema.brand = {
        "@type": "Brand",
        name: settings.productBrand.trim(),
      };
    }
    if (settings.productSku.trim()) schema.sku = settings.productSku.trim();

    const price = Number(settings.productPrice);
    const currency = settings.productCurrency.trim().toUpperCase();
    if (
      settings.productPrice.trim() &&
      Number.isFinite(price) &&
      price >= 0 &&
      /^[A-Z]{3}$/.test(currency)
    ) {
      schema.offers = {
        "@type": "Offer",
        price: settings.productPrice.trim(),
        priceCurrency: currency,
        url: effectiveUrl || undefined,
      };
    }
  }

  if (settings.schemaType === "Recipe") {
    if (settings.recipeYield.trim())
      schema.recipeYield = settings.recipeYield.trim();
    if (settings.recipePrepTime.trim())
      schema.prepTime = settings.recipePrepTime.trim();
    if (settings.recipeCookTime.trim())
      schema.cookTime = settings.recipeCookTime.trim();
    const ingredients = splitLines(settings.recipeIngredients);
    if (ingredients.length) schema.recipeIngredient = ingredients;
  }

  if (settings.schemaType === "Event") {
    if (settings.eventStart) schema.startDate = settings.eventStart;
    if (settings.eventEnd) schema.endDate = settings.eventEnd;
    if (settings.eventLocation.trim() || settings.eventAddress.trim()) {
      schema.location = {
        "@type": "Place",
        name: settings.eventLocation.trim() || undefined,
        address: settings.eventAddress.trim() || undefined,
      };
    }
  }

  if (settings.schemaType === "Organization") {
    schema.name =
      settings.organizationName.trim() ||
      settings.siteName.trim() ||
      cleanTitle ||
      undefined;
    const logo = normalizeHttpUrl(settings.organizationLogo);
    if (logo) schema.logo = logo;
    if (settings.organizationPhone.trim()) {
      schema.telephone = settings.organizationPhone.trim();
    }
    const sameAs = splitLines(settings.organizationSameAs)
      .map(normalizeHttpUrl)
      .filter((value): value is string => Boolean(value));
    if (sameAs.length) schema.sameAs = sameAs;
  }

  if (settings.schemaType === "Person") {
    schema.name = settings.personName.trim() || cleanTitle || undefined;
    const personUrl = normalizeHttpUrl(settings.personUrl);
    if (personUrl) schema.url = personUrl;
  }

  if (settings.schemaType === "FAQPage") {
    const completeFaqs = settings.faqs.filter(
      (item) => item.question.trim() && item.answer.trim(),
    );
    if (completeFaqs.length) {
      schema.mainEntity = completeFaqs.map((item) => ({
        "@type": "Question",
        name: item.question.trim(),
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer.trim(),
        },
      }));
    }
  }

  return schema;
}

function buildOutput(
  title: string,
  description: string,
  rawPageUrl: string,
  settings: MetaSettings,
  isEn: boolean,
): GeneratedOutput {
  const warnings: OutputWarning[] = [];
  const cleanTitle = title.trim();
  const cleanDescription = description.trim();
  const pageUrl = normalizeHttpUrl(rawPageUrl);
  const canonicalInput = settings.canonicalUrl.trim();
  const explicitCanonical = normalizeHttpUrl(canonicalInput);
  const canonicalUrl = explicitCanonical || pageUrl;
  const imageInput = settings.imageUrl.trim();
  const imageUrl = normalizeHttpUrl(imageInput);

  if (!cleanTitle) {
    warnings.push({
      id: "missing-title",
      text: isEn ? "Title is required." : "Укажите заголовок.",
    });
  } else if (cleanTitle.length > 60) {
    warnings.push({
      id: "long-title",
      text: isEn
        ? "The title is longer than 60 characters and may be truncated in search results."
        : "Заголовок длиннее 60 знаков и может обрезаться в поиске.",
    });
  }

  if (!cleanDescription) {
    warnings.push({
      id: "missing-description",
      text: isEn ? "Description is required." : "Укажите описание.",
    });
  } else if (cleanDescription.length > 160) {
    warnings.push({
      id: "long-description",
      text: isEn
        ? "The description is longer than 160 characters and may be truncated."
        : "Описание длиннее 160 знаков и может обрезаться.",
    });
  }

  if (!rawPageUrl.trim()) {
    warnings.push({
      id: "missing-page-url",
      text: isEn ? "Page URL is required." : "Укажите URL страницы.",
    });
  } else if (!pageUrl) {
    warnings.push({
      id: "invalid-page-url",
      text: isEn
        ? "Page URL must be an absolute http:// or https:// URL."
        : "URL страницы должен быть абсолютным адресом http:// или https://.",
    });
  }

  if (canonicalInput && !explicitCanonical) {
    warnings.push({
      id: "invalid-canonical",
      text: isEn
        ? "Invalid canonical URL was ignored; the page URL is used instead."
        : "Некорректный canonical URL пропущен; используется URL страницы.",
    });
  }

  if (imageInput && !imageUrl) {
    warnings.push({
      id: "invalid-og-image",
      text: isEn
        ? "OG image was omitted. Use an absolute http:// or https:// URL; data:, javascript: and blob: are not allowed."
        : "OG-изображение пропущено. Используйте абсолютный URL http:// или https://; data:, javascript: и blob: запрещены.",
    });
  }

  const validHreflangs = settings.hreflangs.filter((row) => {
    const valid =
      isValidHreflang(row.lang) && Boolean(normalizeHttpUrl(row.href));
    if ((row.lang.trim() || row.href.trim()) && !valid) {
      warnings.push({
        id: "invalid-hreflang-" + row.id,
        text: isEn
          ? "An invalid hreflang row was omitted."
          : "Некорректная строка hreflang пропущена.",
      });
    }
    return valid;
  });

  const normalizedTwitterSite = /^@[A-Za-z0-9_]{1,15}$/.test(
    settings.twitterSite.trim(),
  )
    ? settings.twitterSite.trim()
    : "";

  if (settings.twitterSite.trim() && !normalizedTwitterSite) {
    warnings.push({
      id: "invalid-twitter-site",
      text: isEn
        ? "Twitter/X site handle was omitted. Use @ followed by up to 15 letters, digits or underscores."
        : "Аккаунт Twitter/X пропущен. Используйте @ и до 15 букв, цифр или подчёркиваний.",
    });
  }

  if (
    settings.schemaEnabled &&
    settings.schemaType === "Product" &&
    settings.productPrice.trim()
  ) {
    const price = Number(settings.productPrice);
    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !/^[A-Z]{3}$/.test(settings.productCurrency.trim().toUpperCase())
    ) {
      warnings.push({
        id: "invalid-product-offer",
        text: isEn
          ? "Product offer was omitted. Price must be non-negative and currency must be a three-letter code."
          : "Предложение Product пропущено. Цена должна быть неотрицательной, валюта — трёхбуквенным кодом.",
      });
    }
  }

  if (
    settings.schemaEnabled &&
    settings.organizationLogo.trim() &&
    !normalizeHttpUrl(settings.organizationLogo)
  ) {
    warnings.push({
      id: "invalid-organization-logo",
      text: isEn
        ? "Organization logo was omitted because its URL is not valid http(s)."
        : "Логотип организации пропущен: нужен корректный URL http(s).",
    });
  }

  if (settings.schemaEnabled && settings.organizationSameAs.trim()) {
    const invalidSameAs = splitLines(settings.organizationSameAs).some(
      (value) => !normalizeHttpUrl(value),
    );
    if (invalidSameAs) {
      warnings.push({
        id: "invalid-same-as",
        text: isEn
          ? "Invalid Organization sameAs URLs were omitted."
          : "Некорректные URL Organization sameAs пропущены.",
      });
    }
  }

  if (
    settings.schemaEnabled &&
    settings.schemaType === "Person" &&
    settings.personUrl.trim() &&
    !normalizeHttpUrl(settings.personUrl)
  ) {
    warnings.push({
      id: "invalid-person-url",
      text: isEn
        ? "Person URL was omitted because it is not valid http(s)."
        : "URL Person пропущен: нужен корректный адрес http(s).",
    });
  }

  if (settings.schemaEnabled && settings.schemaType === "FAQPage") {
    const incompleteCount = settings.faqs.filter(
      (item) =>
        (item.question.trim() || item.answer.trim()) &&
        !(item.question.trim() && item.answer.trim()),
    ).length;
    if (incompleteCount > 0) {
      warnings.push({
        id: "incomplete-faq",
        text: isEn
          ? "Incomplete FAQ entries were omitted."
          : "Незаполненные элементы FAQ пропущены.",
      });
    }
  }

  const schema = buildSchema(
    cleanTitle,
    cleanDescription,
    pageUrl,
    canonicalUrl,
    imageUrl,
    settings,
  );

  const lines: string[] = [
    "<!-- Primary metadata -->",
    "<title>" + escapeHtml(cleanTitle) + "</title>",
    '<meta name="description" content="' +
      escapeHtml(cleanDescription) +
      '" />',
    '<meta name="robots" content="' +
      settings.robotsIndex +
      ", " +
      settings.robotsFollow +
      '" />',
  ];

  if (canonicalUrl) {
    lines.push(
      '<link rel="canonical" href="' + escapeHtml(canonicalUrl) + '" />',
    );
  }

  if (validHreflangs.length) {
    lines.push("", "<!-- Alternate languages -->");
    for (const row of validHreflangs) {
      const href = normalizeHttpUrl(row.href);
      if (!href) continue;
      lines.push(
        '<link rel="alternate" hreflang="' +
          escapeHtml(row.lang.trim()) +
          '" href="' +
          escapeHtml(href) +
          '" />',
      );
    }
  }

  lines.push(
    "",
    "<!-- Open Graph -->",
    '<meta property="og:type" content="' + settings.ogType + '" />',
    '<meta property="og:title" content="' + escapeHtml(cleanTitle) + '" />',
    '<meta property="og:description" content="' +
      escapeHtml(cleanDescription) +
      '" />',
  );

  if (pageUrl) {
    lines.push(
      '<meta property="og:url" content="' + escapeHtml(pageUrl) + '" />',
    );
  }
  if (settings.siteName.trim()) {
    lines.push(
      '<meta property="og:site_name" content="' +
        escapeHtml(settings.siteName.trim()) +
        '" />',
    );
  }
  if (imageUrl) {
    lines.push(
      '<meta property="og:image" content="' + escapeHtml(imageUrl) + '" />',
    );
  }

  lines.push(
    "",
    "<!-- Twitter / X -->",
    '<meta name="twitter:card" content="' + settings.twitterCard + '" />',
    '<meta name="twitter:title" content="' + escapeHtml(cleanTitle) + '" />',
    '<meta name="twitter:description" content="' +
      escapeHtml(cleanDescription) +
      '" />',
  );

  if (normalizedTwitterSite) {
    lines.push(
      '<meta name="twitter:site" content="' +
        escapeHtml(normalizedTwitterSite) +
        '" />',
    );
  }
  if (imageUrl) {
    lines.push(
      '<meta name="twitter:image" content="' + escapeHtml(imageUrl) + '" />',
    );
  }

  if (schema) {
    lines.push(
      "",
      "<!-- JSON-LD -->",
      '<script type="application/ld+json">',
      safeJsonForHtml(schema),
      "</script>",
    );
  }

  return {
    code: lines.join("\n"),
    warnings,
    pageUrl,
    canonicalUrl,
    imageUrl,
  };
}

function displayHost(value: string | null): string {
  if (!value) return "site.test";
  try {
    return new URL(value).host;
  } catch {
    return "site.test";
  }
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "url" | "datetime-local";
  inputMode?: "text" | "url" | "decimal";
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode = "text",
}: TextFieldProps) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block text-sm">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11"
      />
    </div>
  );
}

export default function SeoMetaTool() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [settings, setSettings] = useState<MetaSettings>(() => ({
    ...DEFAULT_SETTINGS,
    hreflangs: [],
    faqs: [],
  }));
  const [copyAttempt, setCopyAttempt] = useState<{
    signature: string;
    status: "copied" | "failed";
  } | null>(null);

  const generated = useMemo(
    () => buildOutput(title, description, pageUrl, settings, isEn),
    [description, isEn, pageUrl, settings, title],
  );

  const canGenerate =
    Boolean(title.trim()) &&
    Boolean(description.trim()) &&
    Boolean(generated.pageUrl);

  const currentCopyStatus =
    copyAttempt?.signature === generated.code ? copyAttempt.status : null;

  const updateSettings = (patch: Partial<MetaSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  };

  const addHreflang = () => {
    setSettings((current) => ({
      ...current,
      hreflangs: [
        ...current.hreflangs,
        { id: createId("lang"), lang: "", href: "" },
      ],
    }));
  };

  const updateHreflang = (
    id: string,
    patch: Partial<Omit<HreflangRow, "id">>,
  ) => {
    setSettings((current) => ({
      ...current,
      hreflangs: current.hreflangs.map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      ),
    }));
  };

  const removeHreflang = (id: string) => {
    setSettings((current) => ({
      ...current,
      hreflangs: current.hreflangs.filter((row) => row.id !== id),
    }));
  };

  const addFaq = () => {
    setSettings((current) => ({
      ...current,
      faqs: [
        ...current.faqs,
        { id: createId("faq"), question: "", answer: "" },
      ],
    }));
  };

  const updateFaq = (id: string, patch: Partial<Omit<FaqItem, "id">>) => {
    setSettings((current) => ({
      ...current,
      faqs: current.faqs.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const removeFaq = (id: string) => {
    setSettings((current) => ({
      ...current,
      faqs: current.faqs.filter((item) => item.id !== id),
    }));
  };

  const generateAndCopy = async () => {
    if (!canGenerate) return;
    const copied = await copyText(generated.code);
    setCopyAttempt({
      signature: generated.code,
      status: copied ? "copied" : "failed",
    });
  };

  const downloadHtml = () => {
    if (!canGenerate) return;
    downloadBlob(
      new Blob([generated.code], { type: "text/html;charset=utf-8" }),
      "meta-tags.html",
    );
  };

  const previewHost = displayHost(generated.pageUrl);
  const previewTitle =
    title.trim() || (isEn ? "Page title" : "Заголовок страницы");
  const previewDescription =
    description.trim() ||
    (isEn
      ? "Page description appears here."
      : "Здесь появится описание страницы.");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <Label htmlFor="seo-title" className="text-sm">
                {isEn ? "Title" : "Заголовок"}
              </Label>
              <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
                {title.length}
              </span>
            </div>
            <Input
              id="seo-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={isEn ? "Page title" : "Заголовок страницы"}
              className="h-11"
              maxLength={300}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <Label htmlFor="seo-description" className="text-sm">
                {isEn ? "Description" : "Описание"}
              </Label>
              <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
                {description.length}
              </span>
            </div>
            <Textarea
              id="seo-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={
                isEn
                  ? "A concise description of this page"
                  : "Кратко опишите содержимое страницы"
              }
              maxLength={500}
            />
          </div>

          <div>
            <Label htmlFor="seo-page-url" className="mb-1.5 block text-sm">
              {isEn ? "Page URL" : "URL страницы"}
            </Label>
            <Input
              id="seo-page-url"
              type="url"
              inputMode="url"
              value={pageUrl}
              onChange={(event) => setPageUrl(event.target.value)}
              placeholder="https://site.test/page"
              className={cn(
                "h-11",
                pageUrl.trim() &&
                  !generated.pageUrl &&
                  "border-[var(--color-danger)]/60",
              )}
              aria-invalid={
                pageUrl.trim() && !generated.pageUrl ? true : undefined
              }
            />
            {pageUrl.trim() && !generated.pageUrl ? (
              <p className="mt-1.5 text-sm text-[var(--color-danger)]">
                {isEn
                  ? "Use an absolute http:// or https:// URL."
                  : "Укажите абсолютный URL http:// или https://."}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <ToolPrimaryAction
            type="button"
            onClick={() => void generateAndCopy()}
            disabled={!canGenerate}
            leadingIcon={<Copy size={20} />}
          >
            {isEn ? "Generate & copy tags" : "Создать и скопировать"}
          </ToolPrimaryAction>
        </div>

        <div className="mt-2 min-h-5 text-sm" aria-live="polite">
          {currentCopyStatus === "copied" ? (
            <span className="text-[var(--color-success)]">
              {isEn
                ? "Meta tags generated and copied."
                : "Метатеги созданы и скопированы."}
            </span>
          ) : null}
          {currentCopyStatus === "failed" ? (
            <span className="text-[var(--color-warning)]">
              {isEn
                ? "Tags were generated, but clipboard access failed. Copy them from Advanced settings."
                : "Метатеги созданы, но буфер обмена недоступен. Скопируйте код в дополнительных настройках."}
            </span>
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="min-w-0 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <MagnifyingGlass size={18} />
            {isEn ? "Google preview" : "Предпросмотр Google"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs text-[var(--color-text-muted)]">
              {previewHost}
            </div>
            <div className="mt-1 line-clamp-2 break-words text-lg font-medium text-[#1a0dab]">
              {previewTitle}
            </div>
            <p className="mt-1 line-clamp-2 break-words text-sm text-[var(--color-text-muted)]">
              {previewDescription}
            </p>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <div className="flex min-h-28 items-center justify-center gap-2 bg-[var(--color-surface-muted)] px-4 text-sm text-[var(--color-text-muted)]">
            <ImageIcon size={24} />
            {generated.imageUrl
              ? isEn
                ? "Secure image URL attached"
                : "Безопасный URL изображения добавлен"
              : isEn
                ? "Social image"
                : "Изображение для соцсетей"}
          </div>
          <div className="min-w-0 p-4">
            <div className="truncate text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {previewHost}
            </div>
            <div className="mt-1 line-clamp-2 break-words font-semibold">
              {previewTitle}
            </div>
            <p className="mt-1 line-clamp-2 break-words text-sm text-[var(--color-text-muted)]">
              {previewDescription}
            </p>
          </div>
        </Card>
      </div>

      <AdvancedSettings
        title={isEn ? "Advanced metadata" : "Дополнительные метаданные"}
        description={
          isEn
            ? "Robots, canonical, social cards, hreflang, schema and export"
            : "Robots, canonical, соцсети, hreflang, schema и экспорт"
        }
      >
        <div className="space-y-7 [&_button]:min-h-11 [&_input]:min-h-11 [&_select]:min-h-11">
          <section>
            <h3 className="mb-3 text-sm font-semibold">
              {isEn ? "Indexing and canonical" : "Индексация и canonical"}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1.5 block">
                  {isEn ? "Indexing" : "Индексация"}
                </span>
                <select
                  value={settings.robotsIndex}
                  onChange={(event) =>
                    updateSettings({
                      robotsIndex: event.target.value as RobotsIndex,
                    })
                  }
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                >
                  <option value="index">index</option>
                  <option value="noindex">noindex</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block">
                  {isEn ? "Links" : "Ссылки"}
                </span>
                <select
                  value={settings.robotsFollow}
                  onChange={(event) =>
                    updateSettings({
                      robotsFollow: event.target.value as RobotsFollow,
                    })
                  }
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                >
                  <option value="follow">follow</option>
                  <option value="nofollow">nofollow</option>
                </select>
              </label>
            </div>
            <div className="mt-3">
              <TextField
                id="seo-canonical"
                label={
                  isEn
                    ? "Canonical URL (optional)"
                    : "Canonical URL (необязательно)"
                }
                value={settings.canonicalUrl}
                onChange={(value) => updateSettings({ canonicalUrl: value })}
                placeholder="https://site.test/canonical-page"
                type="url"
                inputMode="url"
              />
            </div>
          </section>

          <section className="border-t border-[var(--color-border)] pt-6">
            <h3 className="mb-3 text-sm font-semibold">
              {isEn ? "Open Graph and Twitter / X" : "Open Graph и Twitter / X"}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1.5 block">og:type</span>
                <select
                  value={settings.ogType}
                  onChange={(event) =>
                    updateSettings({
                      ogType: event.target.value as "website" | "article",
                    })
                  }
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                >
                  <option value="website">website</option>
                  <option value="article">article</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block">twitter:card</span>
                <select
                  value={settings.twitterCard}
                  onChange={(event) =>
                    updateSettings({
                      twitterCard: event.target.value as
                        "summary" | "summary_large_image",
                    })
                  }
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                >
                  <option value="summary">summary</option>
                  <option value="summary_large_image">
                    summary_large_image
                  </option>
                </select>
              </label>
              <TextField
                id="seo-site-name"
                label={isEn ? "Site name" : "Название сайта"}
                value={settings.siteName}
                onChange={(value) => updateSettings({ siteName: value })}
              />
              <TextField
                id="seo-twitter-site"
                label={isEn ? "Twitter/X account" : "Аккаунт Twitter/X"}
                value={settings.twitterSite}
                onChange={(value) => updateSettings({ twitterSite: value })}
                placeholder="@site"
              />
            </div>
            <div className="mt-3">
              <TextField
                id="seo-image-url"
                label={isEn ? "OG image URL" : "URL OG-изображения"}
                value={settings.imageUrl}
                onChange={(value) => updateSettings({ imageUrl: value })}
                placeholder="https://site.test/social-card.jpg"
                type="url"
                inputMode="url"
              />
              {settings.imageUrl.trim() && !generated.imageUrl ? (
                <p className="mt-1.5 flex items-start gap-2 text-sm text-[var(--color-danger)]">
                  <Warning size={18} className="mt-0.5 shrink-0" />
                  {isEn
                    ? "Only absolute http:// and https:// URLs are accepted. Unsafe or local URL schemes are never exported."
                    : "Разрешены только абсолютные URL http:// и https://. Небезопасные и локальные схемы никогда не экспортируются."}
                </p>
              ) : null}
            </div>
          </section>

          <section className="border-t border-[var(--color-border)] pt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">hreflang</h3>
              <Button type="button" variant="outline" onClick={addHreflang}>
                <Plus size={18} />
                {isEn ? "Add language" : "Добавить язык"}
              </Button>
            </div>

            {settings.hreflangs.length ? (
              <div className="space-y-2">
                {settings.hreflangs.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 sm:grid-cols-[8rem_minmax(0,1fr)_2.75rem]"
                  >
                    <Input
                      value={row.lang}
                      onChange={(event) =>
                        updateHreflang(row.id, { lang: event.target.value })
                      }
                      placeholder="en"
                      aria-label={isEn ? "Language code" : "Код языка"}
                    />
                    <Input
                      type="url"
                      inputMode="url"
                      value={row.href}
                      onChange={(event) =>
                        updateHreflang(row.id, { href: event.target.value })
                      }
                      placeholder="https://site.test/en"
                      aria-label={
                        isEn ? "Alternate page URL" : "URL языковой версии"
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHreflang(row.id)}
                      aria-label={isEn ? "Remove language" : "Удалить язык"}
                      className="justify-self-end"
                    >
                      <Trash size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                {isEn
                  ? "Add only language versions that have a public absolute URL."
                  : "Добавляйте только языковые версии с публичным абсолютным URL."}
              </p>
            )}
          </section>

          <section className="border-t border-[var(--color-border)] pt-6">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={settings.schemaEnabled}
                onChange={(event) =>
                  updateSettings({ schemaEnabled: event.target.checked })
                }
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Add JSON-LD schema" : "Добавить JSON-LD schema"}
            </label>

            {settings.schemaEnabled ? (
              <div className="mt-4 space-y-4">
                <label className="block text-sm">
                  <span className="mb-1.5 block">
                    {isEn ? "Schema type" : "Тип schema"}
                  </span>
                  <select
                    value={settings.schemaType}
                    onChange={(event) =>
                      updateSettings({
                        schemaType: event.target.value as SchemaType,
                      })
                    }
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:max-w-sm"
                  >
                    <option value="WebPage">WebPage</option>
                    <option value="Article">Article</option>
                    <option value="Product">Product</option>
                    <option value="Recipe">Recipe</option>
                    <option value="Event">Event</option>
                    <option value="Organization">Organization</option>
                    <option value="Person">Person</option>
                    <option value="FAQPage">FAQPage</option>
                  </select>
                </label>

                {settings.schemaType === "Article" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <TextField
                      id="schema-article-author"
                      label={isEn ? "Author" : "Автор"}
                      value={settings.articleAuthor}
                      onChange={(value) =>
                        updateSettings({ articleAuthor: value })
                      }
                    />
                    <TextField
                      id="schema-article-published"
                      label={isEn ? "Published" : "Опубликовано"}
                      value={settings.articlePublished}
                      onChange={(value) =>
                        updateSettings({ articlePublished: value })
                      }
                      type="datetime-local"
                    />
                    <TextField
                      id="schema-article-modified"
                      label={isEn ? "Modified" : "Изменено"}
                      value={settings.articleModified}
                      onChange={(value) =>
                        updateSettings({ articleModified: value })
                      }
                      type="datetime-local"
                    />
                  </div>
                ) : null}

                {settings.schemaType === "Product" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TextField
                      id="schema-product-brand"
                      label={isEn ? "Brand" : "Бренд"}
                      value={settings.productBrand}
                      onChange={(value) =>
                        updateSettings({ productBrand: value })
                      }
                    />
                    <TextField
                      id="schema-product-sku"
                      label="SKU"
                      value={settings.productSku}
                      onChange={(value) =>
                        updateSettings({ productSku: value })
                      }
                    />
                    <TextField
                      id="schema-product-price"
                      label={isEn ? "Price" : "Цена"}
                      value={settings.productPrice}
                      onChange={(value) =>
                        updateSettings({ productPrice: value })
                      }
                      inputMode="decimal"
                    />
                    <TextField
                      id="schema-product-currency"
                      label={isEn ? "Currency code" : "Код валюты"}
                      value={settings.productCurrency}
                      onChange={(value) =>
                        updateSettings({ productCurrency: value })
                      }
                      placeholder="USD"
                    />
                  </div>
                ) : null}

                {settings.schemaType === "Recipe" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <TextField
                        id="schema-recipe-yield"
                        label={isEn ? "Yield" : "Количество порций"}
                        value={settings.recipeYield}
                        onChange={(value) =>
                          updateSettings({ recipeYield: value })
                        }
                      />
                      <TextField
                        id="schema-recipe-prep"
                        label={isEn ? "Prep time" : "Подготовка"}
                        value={settings.recipePrepTime}
                        onChange={(value) =>
                          updateSettings({ recipePrepTime: value })
                        }
                        placeholder="PT15M"
                      />
                      <TextField
                        id="schema-recipe-cook"
                        label={isEn ? "Cook time" : "Приготовление"}
                        value={settings.recipeCookTime}
                        onChange={(value) =>
                          updateSettings({ recipeCookTime: value })
                        }
                        placeholder="PT30M"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="schema-recipe-ingredients"
                        className="mb-1.5 block text-sm"
                      >
                        {isEn
                          ? "Ingredients, one per line"
                          : "Ингредиенты, по одному в строке"}
                      </Label>
                      <Textarea
                        id="schema-recipe-ingredients"
                        rows={4}
                        value={settings.recipeIngredients}
                        onChange={(event) =>
                          updateSettings({
                            recipeIngredients: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {settings.schemaType === "Event" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TextField
                      id="schema-event-start"
                      label={isEn ? "Start" : "Начало"}
                      value={settings.eventStart}
                      onChange={(value) =>
                        updateSettings({ eventStart: value })
                      }
                      type="datetime-local"
                    />
                    <TextField
                      id="schema-event-end"
                      label={isEn ? "End" : "Окончание"}
                      value={settings.eventEnd}
                      onChange={(value) => updateSettings({ eventEnd: value })}
                      type="datetime-local"
                    />
                    <TextField
                      id="schema-event-location"
                      label={isEn ? "Venue" : "Место"}
                      value={settings.eventLocation}
                      onChange={(value) =>
                        updateSettings({ eventLocation: value })
                      }
                    />
                    <TextField
                      id="schema-event-address"
                      label={isEn ? "Address" : "Адрес"}
                      value={settings.eventAddress}
                      onChange={(value) =>
                        updateSettings({ eventAddress: value })
                      }
                    />
                  </div>
                ) : null}

                {settings.schemaType === "Organization" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <TextField
                        id="schema-organization-name"
                        label={
                          isEn ? "Organization name" : "Название организации"
                        }
                        value={settings.organizationName}
                        onChange={(value) =>
                          updateSettings({ organizationName: value })
                        }
                      />
                      <TextField
                        id="schema-organization-phone"
                        label={isEn ? "Phone" : "Телефон"}
                        value={settings.organizationPhone}
                        onChange={(value) =>
                          updateSettings({ organizationPhone: value })
                        }
                        placeholder="+1 555 0100"
                      />
                      <TextField
                        id="schema-organization-logo"
                        label={isEn ? "Logo URL" : "URL логотипа"}
                        value={settings.organizationLogo}
                        onChange={(value) =>
                          updateSettings({ organizationLogo: value })
                        }
                        placeholder="https://site.test/logo.svg"
                        type="url"
                        inputMode="url"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="schema-organization-same-as"
                        className="mb-1.5 block text-sm"
                      >
                        {isEn
                          ? "Public profiles, one http(s) URL per line"
                          : "Публичные профили, по одному URL http(s) в строке"}
                      </Label>
                      <Textarea
                        id="schema-organization-same-as"
                        rows={4}
                        value={settings.organizationSameAs}
                        onChange={(event) =>
                          updateSettings({
                            organizationSameAs: event.target.value,
                          })
                        }
                        placeholder="https://social.test/profile"
                      />
                    </div>
                  </div>
                ) : null}

                {settings.schemaType === "Person" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TextField
                      id="schema-person-name"
                      label={isEn ? "Person name" : "Имя"}
                      value={settings.personName}
                      onChange={(value) =>
                        updateSettings({ personName: value })
                      }
                    />
                    <TextField
                      id="schema-person-url"
                      label={
                        isEn ? "Public profile URL" : "URL публичного профиля"
                      }
                      value={settings.personUrl}
                      onChange={(value) => updateSettings({ personUrl: value })}
                      placeholder="https://site.test/about"
                      type="url"
                      inputMode="url"
                    />
                  </div>
                ) : null}

                {settings.schemaType === "FAQPage" ? (
                  <div className="space-y-3">
                    <Button type="button" variant="outline" onClick={addFaq}>
                      <Plus size={18} />
                      {isEn ? "Add question" : "Добавить вопрос"}
                    </Button>
                    {settings.faqs.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_2.75rem]">
                          <TextField
                            id={"faq-question-" + item.id}
                            label={isEn ? "Question" : "Вопрос"}
                            value={item.question}
                            onChange={(value) =>
                              updateFaq(item.id, { question: value })
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFaq(item.id)}
                            aria-label={
                              isEn ? "Remove question" : "Удалить вопрос"
                            }
                            className="self-end justify-self-end"
                          >
                            <Trash size={18} />
                          </Button>
                        </div>
                        <div className="mt-3">
                          <Label
                            htmlFor={"faq-answer-" + item.id}
                            className="mb-1.5 block text-sm"
                          >
                            {isEn ? "Answer" : "Ответ"}
                          </Label>
                          <Textarea
                            id={"faq-answer-" + item.id}
                            rows={3}
                            value={item.answer}
                            onChange={(event) =>
                              updateFaq(item.id, {
                                answer: event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="border-t border-[var(--color-border)] pt-6">
            <div className="mb-3 flex min-h-11 flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">
                  {isEn ? "Generated code" : "Готовый код"}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {isEn
                    ? "Only validated URLs are included."
                    : "В код попадают только проверенные URL."}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {canGenerate ? (
                  <CopyButton
                    text={generated.code}
                    size="medium"
                    tooltip={
                      isEn ? "Copy generated code" : "Копировать готовый код"
                    }
                  />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled
                    aria-label={
                      isEn
                        ? "Complete required fields first"
                        : "Сначала заполните обязательные поля"
                    }
                  >
                    <Copy size={20} />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadHtml}
                  disabled={!canGenerate}
                >
                  <DownloadSimple size={18} />
                  HTML
                </Button>
              </div>
            </div>

            {generated.warnings.length ? (
              <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[color-mix(in_oklab,var(--color-warning)_6%,transparent)] p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Warning size={18} />
                  {isEn ? "Checks" : "Проверки"}
                </div>
                <ul className="space-y-1 text-sm text-[var(--color-text-muted)]">
                  {generated.warnings.map((warning) => (
                    <li key={warning.id}>• {warning.text}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Textarea
              rows={16}
              value={generated.code}
              readOnly
              className="font-mono text-xs"
              spellCheck={false}
              aria-label={
                isEn ? "Generated metadata code" : "Готовый код метаданных"
              }
            />
          </section>
        </div>
      </AdvancedSettings>

      <output className="sr-only" aria-live="polite">
        {currentCopyStatus === "copied"
          ? isEn
            ? "Meta tags copied"
            : "Метатеги скопированы"
          : ""}
      </output>
    </div>
  );
}
