#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const CANONICAL_ORIGIN = "https://rcwebapp.com";
const EXPECTED_SLUG_COUNT = 183;
const EXPECTED_GROUP_COUNT = 22;
const EXPECTED_STATIC_REDIRECT_COUNT = 68;
const EXPECTED_CONCRETE_STATIC_REDIRECT_COUNT = 102;
const LOCALES = ["ru", "en"];
const SEGMENT_IDS = ["main", "tools", "kz"];
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_REPORTED_FAILURES = 100;
const DEFAULT_CONCURRENCY = 8;
const MAX_CONCURRENCY = 12;

// These seven country-specific tools may intentionally render Cyrillic or
// Kazakh examples even when the surrounding interface is English.
const EN_CYRILLIC_ALLOWLIST = new Set([
  "iin-validator",
  "kz-phone-formatter",
  "kz-salary-calc",
  "kz-iban-validator",
  "kz-holidays",
  "kz-postal-code",
  "kz-address-format",
]);

const PROXY_REDIRECTS = [
  {
    name: "root locale",
    source: "/",
    target: "/ru",
  },
  {
    name: "retired Kazakhstan city page",
    source: "/ru/kz/almaty",
    target: "/ru/kz",
  },
  {
    name: "legacy conversion value URL",
    source: "/en/kg-to-g/2.1/",
    target: "/en/tools/weight-converter",
  },
  {
    name: "legacy localized conversion pair",
    source: "/en/kg-to-t/",
    target: "/en/tools/weight-converter",
  },
  {
    name: "legacy unlocalized conversion pair",
    source: "/g-to-kg",
    target: "/ru/tools/weight-converter",
  },
  {
    name: "legacy conversion pair without dedicated tool",
    source: "/kohm-to-mohm/",
    target: "/ru/group/converters",
  },
  {
    name: "retired root guide",
    source: "/blog/json-formatter-guide",
    target: "/ru/tools/json-formatter",
  },
  {
    name: "known unlocalized page",
    source: "/privacy",
    target: "/ru/privacy",
  },
  {
    name: "English locale from Accept-Language",
    source: "/terms",
    target: "/en/terms",
    headers: { "accept-language": "en-US,en;q=0.9" },
  },
  {
    name: "English locale from cookie",
    source: "/favorites",
    target: "/en/favorites",
    headers: { cookie: "locale=en" },
  },
  {
    name: "retired root blog index",
    source: "/blog",
    target: "/en",
    headers: { "accept-language": "en" },
  },
  {
    name: "retired localized blog article",
    source: "/ru/blog/json-formatter-guide",
    target: "/ru/tools/json-formatter",
  },
  {
    name: "retired generated guide",
    source: "/en/blog/password-generator-deep-guide-2026",
    target: "/en/tools/password-generator",
  },
  {
    name: "root Kazakhstan city page",
    source: "/kz/astana",
    target: "/en/kz",
    headers: { "accept-language": "en" },
  },
  {
    name: "generic trailing slash",
    source: "/en/privacy/",
    target: "/en/privacy",
  },
];

const FRAMEWORK_ERROR_MARKERS = [
  {
    name: "Next.js error document",
    pattern: /<html[^>]+\bid=["']__next_error__["']/i,
  },
  {
    name: "Next.js error metadata",
    pattern: /<meta[^>]+\bname=["']next-error["']/i,
  },
  {
    name: "client exception fallback",
    pattern: /Application error:\s*a client-side exception/i,
  },
  {
    name: "500 document title",
    pattern:
      /<title>\s*(?:Internal Server Error|500(?:\s*[-:][^<]*)?)\s*<\/title>/i,
  },
  {
    name: "not-found fallback",
    pattern: /This page could not be found\.?\s*<\/h1>/i,
  },
];

const CORRUPTION_MARKERS = [
  {
    name: "Unicode replacement character",
    pattern: /\uFFFD|&#(?:x0*fffd|0*65533);|%EF%BF%BD/iu,
  },
  {
    name: "Latin-1 UTF-8 mojibake",
    pattern:
      /(?:\u00c3[\u0080-\u00ff]|\u00c2[\u0080-\u00ff]|(?:\u00d0.|\u00d1.){2,})/u,
  },
  {
    name: "Windows-1251 UTF-8 mojibake",
    pattern:
      /(?:[\u0420\u0421][\u0080-\u00bf]|(?:[\u0420\u0421][\u0400-\u04ff]){3,}|\u0432(?:\u0402|\u2020|\u045a))/u,
  },
];

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "../..");
const CATALOG_PATH = resolve(PROJECT_ROOT, "src/tools/ux/catalog.ts");
const TOOLS_DATA_PATH = resolve(PROJECT_ROOT, "src/data/tools.ts");
const NEXT_CONFIG_PATH = resolve(PROJECT_ROOT, "next.config.ts");

let failureCount = 0;
const failures = [];

function reportFailure(scope, path, check, detail) {
  failureCount += 1;
  if (failures.length >= MAX_REPORTED_FAILURES) return;

  failures.push({
    scope,
    path,
    check,
    detail: String(detail).replace(/\s+/g, " ").trim().slice(0, 300),
  });
}

function parseBaseUrl(rawBaseUrl) {
  const parsed = new URL(rawBaseUrl);
  if (!new Set(["http:", "https:"]).has(parsed.protocol)) {
    throw new Error(`Base URL must use HTTP or HTTPS: ${rawBaseUrl}`);
  }
  return parsed.origin;
}

function parseConcurrency(rawValue) {
  if (rawValue && !/^\d+$/.test(rawValue)) {
    throw new Error(`QA_CONCURRENCY must be an integer, got ${rawValue}`);
  }
  const parsed = Number.parseInt(rawValue || String(DEFAULT_CONCURRENCY), 10);
  return Math.min(MAX_CONCURRENCY, Math.max(1, parsed));
}

function unwrapTsNode(node) {
  let current = node;
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function tsPropertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text;
  return undefined;
}

function tsPropertyInitializer(object, name) {
  const property = object.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      tsPropertyName(candidate.name) === name,
  );
  return property ? unwrapTsNode(property.initializer) : undefined;
}

function tsStringValue(node, context) {
  if (node && ts.isStringLiteralLike(node)) return node.text;
  throw new Error(`Expected a string at ${context}`);
}

function tsBooleanValue(node, context) {
  if (node?.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node?.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (context) throw new Error(`Expected a boolean at ${context}`);
  return undefined;
}

function tsArrayValue(node, context) {
  const value = unwrapTsNode(node);
  if (value && ts.isArrayLiteralExpression(value)) return value;
  throw new Error(`Expected an array at ${context}`);
}

function tsObjectValue(node, context) {
  const value = unwrapTsNode(node);
  if (value && ts.isObjectLiteralExpression(value)) return value;
  throw new Error(`Expected an object at ${context}`);
}

function findTsVariable(sourceFile, name) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === name &&
        declaration.initializer
      ) {
        return unwrapTsNode(declaration.initializer);
      }
    }
  }
  throw new Error(`Could not find ${name} in ${sourceFile.fileName}`);
}

async function parseTsSource(filePath) {
  const source = await readFile(filePath, "utf8");
  return ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function assertSameSet(actualValues, expectedValues, context) {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  const missing = expectedValues.filter((value) => !actual.has(value));
  const extra = actualValues.filter((value) => !expected.has(value));
  if (missing.length || extra.length) {
    throw new Error(
      `${context} differs: missing ${missing.join(", ") || "none"}; extra ${extra.join(", ") || "none"}`,
    );
  }
}

async function readCatalogInventory() {
  const [catalogSource, toolsSource] = await Promise.all([
    parseTsSource(CATALOG_PATH),
    parseTsSource(TOOLS_DATA_PATH),
  ]);

  const categoryArray = tsArrayValue(
    findTsVariable(catalogSource, "toolUxCatalog"),
    "toolUxCatalog",
  );
  const categoryIds = [];
  const catalogSlugs = [];
  categoryArray.elements.forEach((categoryNode, categoryIndex) => {
    const category = tsObjectValue(
      categoryNode,
      `toolUxCatalog[${categoryIndex}]`,
    );
    categoryIds.push(
      tsStringValue(
        tsPropertyInitializer(category, "categoryId"),
        `toolUxCatalog[${categoryIndex}].categoryId`,
      ),
    );
    const tools = tsArrayValue(
      tsPropertyInitializer(category, "tools"),
      `toolUxCatalog[${categoryIndex}].tools`,
    );
    tools.elements.forEach((toolNode, toolIndex) => {
      const tool = tsObjectValue(
        toolNode,
        `toolUxCatalog[${categoryIndex}].tools[${toolIndex}]`,
      );
      catalogSlugs.push(
        tsStringValue(
          tsPropertyInitializer(tool, "slug"),
          `toolUxCatalog[${categoryIndex}].tools[${toolIndex}].slug`,
        ),
      );
    });
  });

  const groupArray = tsArrayValue(
    findTsVariable(toolsSource, "toolGroups"),
    "toolGroups",
  );
  const groups = groupArray.elements.map((groupNode, groupIndex) => {
    const group = tsObjectValue(groupNode, `toolGroups[${groupIndex}]`);
    return {
      id: tsStringValue(
        tsPropertyInitializer(group, "id"),
        `toolGroups[${groupIndex}].id`,
      ),
      slug: tsStringValue(
        tsPropertyInitializer(group, "slug"),
        `toolGroups[${groupIndex}].slug`,
      ),
    };
  });

  const toolArray = tsArrayValue(findTsVariable(toolsSource, "tools"), "tools");
  const publicSlugs = toolArray.elements.flatMap((toolNode, toolIndex) => {
    const tool = tsObjectValue(toolNode, `tools[${toolIndex}]`);
    const implemented = tsBooleanValue(
      tsPropertyInitializer(tool, "implemented"),
    );
    const hidden = tsBooleanValue(tsPropertyInitializer(tool, "hidden"));
    if (implemented !== true || hidden === true) return [];
    return [
      tsStringValue(
        tsPropertyInitializer(tool, "slug"),
        `tools[${toolIndex}].slug`,
      ),
    ];
  });

  const duplicateSlugs = findDuplicates(catalogSlugs);
  const duplicatePublicSlugs = findDuplicates(publicSlugs);
  const duplicateGroups = findDuplicates(groups.map(({ slug }) => slug));
  const duplicateGroupIds = findDuplicates(groups.map(({ id }) => id));
  const duplicateCategoryIds = findDuplicates(categoryIds);
  if (catalogSlugs.length !== EXPECTED_SLUG_COUNT) {
    throw new Error(
      `Expected exactly ${EXPECTED_SLUG_COUNT} catalog slugs, found ${catalogSlugs.length}`,
    );
  }
  if (groups.length !== EXPECTED_GROUP_COUNT) {
    throw new Error(
      `Expected exactly ${EXPECTED_GROUP_COUNT} tool groups, found ${groups.length}`,
    );
  }
  if (publicSlugs.length !== EXPECTED_SLUG_COUNT) {
    throw new Error(
      `Expected exactly ${EXPECTED_SLUG_COUNT} public tools, found ${publicSlugs.length}`,
    );
  }
  if (
    duplicateSlugs.length ||
    duplicatePublicSlugs.length ||
    duplicateGroups.length ||
    duplicateGroupIds.length ||
    duplicateCategoryIds.length
  ) {
    throw new Error(
      `Duplicate inventory values: catalog tools=${duplicateSlugs.join(", ") || "none"}; public tools=${duplicatePublicSlugs.join(", ") || "none"}; group slugs=${duplicateGroups.join(", ") || "none"}; group ids=${duplicateGroupIds.join(", ") || "none"}; categories=${duplicateCategoryIds.join(", ") || "none"}`,
    );
  }
  assertSameSet(catalogSlugs, publicSlugs, "Catalog and public tool inventory");
  assertSameSet(
    categoryIds,
    groups.map(({ id }) => id),
    "Catalog categories and tool groups",
  );

  return {
    slugs: catalogSlugs,
    groupSlugs: groups.map(({ slug }) => slug),
  };
}

async function readStaticRedirects() {
  const sourceFile = await parseTsSource(NEXT_CONFIG_PATH);
  const configObject = tsObjectValue(
    findTsVariable(sourceFile, "nextConfig"),
    "nextConfig",
  );
  const redirectsMethod = configObject.properties.find(
    (property) =>
      ts.isMethodDeclaration(property) &&
      tsPropertyName(property.name) === "redirects",
  );
  if (!redirectsMethod?.body) {
    throw new Error("Could not find redirects() in next.config.ts");
  }
  const returnStatement = redirectsMethod.body.statements.find((statement) =>
    ts.isReturnStatement(statement),
  );
  const redirectArray = tsArrayValue(
    returnStatement?.expression,
    "nextConfig.redirects() return value",
  );
  const definitions = redirectArray.elements.map((definitionNode, index) => {
    const definition = tsObjectValue(
      definitionNode,
      `nextConfig.redirects()[${index}]`,
    );
    const supportedProperties = new Set(["source", "destination", "permanent"]);
    const unsupportedProperties = definition.properties.flatMap((property) => {
      if (!ts.isPropertyAssignment(property)) return ["non-literal property"];
      const name = tsPropertyName(property.name);
      return name && supportedProperties.has(name)
        ? []
        : [name || "computed property"];
    });
    if (unsupportedProperties.length) {
      throw new Error(
        `Redirect ${index + 1} has unsupported semantics: ${unsupportedProperties.join(", ")}`,
      );
    }
    return {
      source: tsStringValue(
        tsPropertyInitializer(definition, "source"),
        `nextConfig.redirects()[${index}].source`,
      ),
      destination: tsStringValue(
        tsPropertyInitializer(definition, "destination"),
        `nextConfig.redirects()[${index}].destination`,
      ),
      permanent: tsBooleanValue(
        tsPropertyInitializer(definition, "permanent"),
        `nextConfig.redirects()[${index}].permanent`,
      ),
    };
  });
  if (definitions.length !== EXPECTED_STATIC_REDIRECT_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_STATIC_REDIRECT_COUNT} static redirects, found ${definitions.length}`,
    );
  }
  const parameterizedCount = definitions.filter(({ source }) =>
    source.includes("/:locale(ru|en)"),
  ).length;
  const expectedParameterizedCount =
    EXPECTED_CONCRETE_STATIC_REDIRECT_COUNT - EXPECTED_STATIC_REDIRECT_COUNT;
  if (parameterizedCount !== expectedParameterizedCount) {
    throw new Error(
      `Expected ${expectedParameterizedCount} locale-parameterized redirects, found ${parameterizedCount}`,
    );
  }

  const concreteRedirects = definitions.flatMap((definition, index) => {
    if (definition.permanent !== true) {
      throw new Error(`Redirect ${definition.source} is not permanent`);
    }
    const hasLocaleParameter = definition.source.includes("/:locale(ru|en)");
    if (hasLocaleParameter !== definition.destination.includes("/:locale")) {
      throw new Error(
        `Locale parameter mismatch in ${definition.source} -> ${definition.destination}`,
      );
    }
    const locales = hasLocaleParameter ? LOCALES : [undefined];
    return locales.map((locale) => {
      const source = locale
        ? definition.source.replace("/:locale(ru|en)", `/${locale}`)
        : definition.source;
      const target = locale
        ? definition.destination.replace("/:locale", `/${locale}`)
        : definition.destination;
      if (source.includes(":") || target.includes(":")) {
        throw new Error(
          `Unsupported redirect parameter in ${definition.source} -> ${definition.destination}`,
        );
      }
      return {
        name: `next.config redirect ${index + 1}${locale ? ` (${locale})` : ""}`,
        source,
        target,
      };
    });
  });
  const duplicateSources = findDuplicates(
    concreteRedirects.map(({ source }) => source),
  );
  if (
    concreteRedirects.length !== EXPECTED_CONCRETE_STATIC_REDIRECT_COUNT ||
    duplicateSources.length
  ) {
    throw new Error(
      `Expected ${EXPECTED_CONCRETE_STATIC_REDIRECT_COUNT} unique concrete redirects, found ${concreteRedirects.length}; duplicates=${duplicateSources.join(", ") || "none"}`,
    );
  }
  return concreteRedirects;
}

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#([0-9]+);/g, (_, decimal) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTags(markup, tagName) {
  return Array.from(
    markup.matchAll(new RegExp(`<${escapeRegExp(tagName)}\\b[^>]*>`, "gi")),
    (match) => match[0],
  );
}

function parseAttributes(tag) {
  const attributes = new Map();
  const body = tag.replace(/^<[^\s>]+\s*/i, "").replace(/\/?>\s*$/, "");
  const attributePattern =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of body.matchAll(attributePattern)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    attributes.set(name, decodeEntities(value));
  }

  return attributes;
}

function getVisibleText(html) {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || "";
  const withoutNonText = `${title} ${body}`
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(withoutNonText).replace(/\s+/g, " ").trim();
}

function findMarker(value, markers) {
  return markers.find(({ pattern }) => pattern.test(value));
}

function expectedAlternates(pathname) {
  const logicalPath = pathname.replace(/^\/(?:ru|en)(?=\/|$)/, "");
  return {
    ru: `${CANONICAL_ORIGIN}/ru${logicalPath}`,
    en: `${CANONICAL_ORIGIN}/en${logicalPath}`,
    "x-default": `${CANONICAL_ORIGIN}/ru${logicalPath}`,
  };
}

function auditNoIndexHeader(result, scope, path) {
  if (result.headers.has("x-robots-tag")) {
    reportFailure(
      scope,
      path,
      "production indexing header",
      `Unexpected X-Robots-Tag: ${result.headers.get("x-robots-tag")}`,
    );
  }
}

function auditMarkupIntegrity(markup, scope, path) {
  const corruption = findMarker(markup, CORRUPTION_MARKERS);
  if (corruption) {
    reportFailure(scope, path, "encoding integrity", corruption.name);
  }

  const frameworkError = findMarker(markup, FRAMEWORK_ERROR_MARKERS);
  if (frameworkError) {
    reportFailure(scope, path, "framework error marker", frameworkError.name);
  }
}

async function mapWithConcurrency(items, concurrency, worker) {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(1, items.length)) },
    async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        await worker(items[index], index);
      }
    },
  );
  await Promise.all(workers);
}

function createLimiter(concurrency) {
  let activeCount = 0;
  const queue = [];

  function startNext() {
    while (activeCount < concurrency && queue.length > 0) {
      const { task, resolveTask, rejectTask } = queue.shift();
      activeCount += 1;
      Promise.resolve()
        .then(task)
        .then(resolveTask, rejectTask)
        .finally(() => {
          activeCount -= 1;
          startNext();
        });
    }
  }

  return (task) =>
    new Promise((resolveTask, rejectTask) => {
      queue.push({ task, resolveTask, rejectTask });
      startNext();
    });
}

function makeRequester(baseOrigin, concurrency) {
  const limit = createLimiter(concurrency);

  return function request(path, options = {}) {
    return limit(async () => {
      const url = new URL(path, `${baseOrigin}/`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          redirect: "manual",
          signal: controller.signal,
          headers: {
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
            "user-agent": "Ultimate-Tools-Production-QA/1.0",
            ...options.headers,
          },
        });
        let body = "";
        if (options.readBody === false) {
          await response.body?.cancel();
        } else {
          body = await response.text();
        }
        return {
          ok: true,
          url: url.toString(),
          status: response.status,
          headers: response.headers,
          body,
        };
      } catch (error) {
        return {
          ok: false,
          url: url.toString(),
          error:
            error instanceof Error
              ? `${error.name}: ${error.message}`
              : String(error),
        };
      } finally {
        clearTimeout(timer);
      }
    });
  };
}

async function auditToolRoute(request, locale, slug) {
  const path = `/${locale}/tools/${slug}`;
  const result = await request(path);

  if (!result.ok) {
    reportFailure("tool", path, "fetch", result.error);
    return;
  }

  if (result.status !== 200) {
    reportFailure(
      "tool",
      path,
      "HTTP status",
      `Expected 200, got ${result.status}`,
    );
  }
  auditNoIndexHeader(result, "tool", path);
  auditMarkupIntegrity(result.body, "tool", path);
  if (result.status === 200) {
    auditIndexableMetadata(
      result,
      locale,
      path,
      `${CANONICAL_ORIGIN}${path}`,
      "tool",
    );
  }

  const h1Count = (result.body.match(/<h1(?:\s[^>]*)?>/gi) || []).length;
  if (h1Count !== 1) {
    reportFailure(
      "tool",
      path,
      "heading structure",
      `Expected one h1, found ${h1Count}`,
    );
  }

  if (locale === "en" && !EN_CYRILLIC_ALLOWLIST.has(slug)) {
    const visibleText = getVisibleText(result.body);
    const cyrillicMatch = visibleText.match(/.{0,35}[\u0400-\u052f].{0,70}/u);
    if (cyrillicMatch) {
      reportFailure(
        "tool",
        path,
        "English locale text",
        `Unexpected Cyrillic: ${cyrillicMatch[0]}`,
      );
    }
  }
}

function getCanonicalHrefs(markup) {
  return getTags(markup, "link")
    .map(parseAttributes)
    .filter((attributes) =>
      (attributes.get("rel") || "")
        .toLowerCase()
        .split(/\s+/)
        .includes("canonical"),
    )
    .map((attributes) => attributes.get("href") || "");
}

function hasNoindexMeta(markup) {
  return getTags(markup, "meta")
    .map(parseAttributes)
    .filter((attributes) =>
      ["robots", "googlebot"].includes(
        (attributes.get("name") || "").toLowerCase(),
      ),
    )
    .some((attributes) =>
      /(?:^|\s|,)noindex(?:\s|,|$)/i.test(attributes.get("content") || ""),
    );
}

function getMetaValues(markup, key) {
  const normalizedKey = key.toLowerCase();
  return getTags(markup, "meta")
    .map(parseAttributes)
    .filter(
      (attributes) =>
        (attributes.get("name") || "").toLowerCase() === normalizedKey ||
        (attributes.get("property") || "").toLowerCase() === normalizedKey,
    )
    .map((attributes) => (attributes.get("content") || "").trim());
}

function getTitleValues(markup) {
  return Array.from(
    markup.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi),
    (match) =>
      decodeEntities(match[1].replace(/<[^>]+>/g, " "))
        .replace(/\s+/g, " ")
        .trim(),
  );
}

function getHeadBlocks(markup) {
  return Array.from(
    markup.matchAll(/<head\b[^>]*>([\s\S]*?)<\/head>/gi),
    (match) => match[1],
  );
}

function getJsonLdBlocks(markup) {
  const blocks = [];
  for (const match of markup.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
  )) {
    const attributes = parseAttributes(`<script ${match[1]}>`);
    if (
      (attributes.get("type") || "").toLowerCase() === "application/ld+json"
    ) {
      blocks.push(match[2].trim());
    }
  }
  return blocks;
}

function auditSingleMetadataValue(values, scope, path, check, expectedValue) {
  const valid =
    values.length === 1 &&
    values[0].length > 0 &&
    (expectedValue === undefined || values[0] === expectedValue);
  if (!valid) {
    reportFailure(
      scope,
      path,
      check,
      expectedValue === undefined
        ? `Expected one non-empty value; found ${values.join(", ") || "none"}`
        : `Expected only ${expectedValue}; found ${values.join(", ") || "none"}`,
    );
  }
}

function auditIndexableMetadata(
  result,
  locale,
  path,
  expectedCanonical,
  scope,
) {
  if (hasNoindexMeta(result.body)) {
    reportFailure(scope, path, "indexability", "Unexpected noindex meta");
  }

  const htmlTags = getTags(result.body, "html");
  const actualLang =
    htmlTags.length === 1
      ? parseAttributes(htmlTags[0]).get("lang")
      : undefined;
  if (htmlTags.length !== 1 || actualLang !== locale) {
    reportFailure(
      scope,
      path,
      "HTML language",
      `Expected one <html lang="${locale}">, found ${htmlTags.length} with lang=${actualLang || "missing"}`,
    );
  }

  const headBlocks = getHeadBlocks(result.body);
  if (headBlocks.length !== 1) {
    reportFailure(
      scope,
      path,
      "document head",
      `Expected one <head>, found ${headBlocks.length}`,
    );
  }
  const metadataMarkup = headBlocks[0] || result.body;

  auditSingleMetadataValue(
    getTitleValues(metadataMarkup),
    scope,
    path,
    "document title",
  );
  auditSingleMetadataValue(
    getMetaValues(metadataMarkup, "description"),
    scope,
    path,
    "meta description",
  );
  auditSingleMetadataValue(
    getCanonicalHrefs(metadataMarkup),
    scope,
    path,
    "canonical",
    expectedCanonical,
  );

  const alternateLinks = getTags(metadataMarkup, "link")
    .map(parseAttributes)
    .filter(
      (attributes) =>
        (attributes.get("rel") || "")
          .toLowerCase()
          .split(/\s+/)
          .includes("alternate") && attributes.has("hreflang"),
    );
  const alternates = expectedAlternates(path);
  for (const [language, expectedHref] of Object.entries(alternates)) {
    const hrefs = alternateLinks
      .filter(
        (attributes) =>
          (attributes.get("hreflang") || "").toLowerCase() === language,
      )
      .map((attributes) => attributes.get("href") || "");
    auditSingleMetadataValue(
      hrefs,
      scope,
      path,
      `hreflang ${language}`,
      expectedHref,
    );
  }
  const unexpectedHreflangs = alternateLinks
    .map((attributes) => (attributes.get("hreflang") || "").toLowerCase())
    .filter((language) => !Object.hasOwn(alternates, language));
  if (unexpectedHreflangs.length) {
    reportFailure(
      scope,
      path,
      "hreflang inventory",
      `Unexpected language(s): ${[...new Set(unexpectedHreflangs)].join(", ")}`,
    );
  }

  for (const key of ["og:title", "og:description"]) {
    auditSingleMetadataValue(
      getMetaValues(metadataMarkup, key),
      scope,
      path,
      key,
    );
  }
  auditSingleMetadataValue(
    getMetaValues(metadataMarkup, "og:url"),
    scope,
    path,
    "og:url",
    expectedCanonical,
  );
  const ogLocales = getMetaValues(metadataMarkup, "og:locale");
  if (
    ogLocales.length > 0 &&
    (ogLocales.length !== 1 ||
      ogLocales[0] !== (locale === "en" ? "en_US" : "ru_RU"))
  ) {
    reportFailure(
      scope,
      path,
      "og:locale",
      `Expected ${locale === "en" ? "en_US" : "ru_RU"} when present; found ${ogLocales.join(", ")}`,
    );
  }
  const ogImages = getMetaValues(metadataMarkup, "og:image");
  const invalidOgImages = ogImages.filter((value) => {
    try {
      const imageUrl = new URL(value);
      return (
        imageUrl.protocol !== "https:" || imageUrl.origin !== CANONICAL_ORIGIN
      );
    } catch {
      return true;
    }
  });
  if (ogImages.length === 0 || invalidOgImages.length) {
    reportFailure(
      scope,
      path,
      "og:image",
      ogImages.length === 0
        ? "Missing image"
        : `Expected canonical HTTPS image URL(s); invalid ${invalidOgImages.join(", ")}`,
    );
  }

  for (const key of ["twitter:card", "twitter:title", "twitter:description"]) {
    auditSingleMetadataValue(
      getMetaValues(metadataMarkup, key),
      scope,
      path,
      key,
    );
  }
  const twitterCards = getMetaValues(metadataMarkup, "twitter:card");
  if (
    twitterCards.length === 1 &&
    !new Set(["summary", "summary_large_image"]).has(twitterCards[0])
  ) {
    reportFailure(
      scope,
      path,
      "twitter:card",
      `Unexpected card type ${twitterCards[0]}`,
    );
  }
  const twitterImages = getMetaValues(metadataMarkup, "twitter:image");
  for (const image of twitterImages) {
    try {
      const imageUrl = new URL(image);
      if (
        imageUrl.protocol !== "https:" ||
        imageUrl.origin !== CANONICAL_ORIGIN
      ) {
        throw new Error("non-canonical URL");
      }
    } catch {
      reportFailure(scope, path, "twitter:image", `Invalid image URL ${image}`);
    }
  }

  const manifestHrefs = getTags(metadataMarkup, "link")
    .map(parseAttributes)
    .filter((attributes) =>
      (attributes.get("rel") || "")
        .toLowerCase()
        .split(/\s+/)
        .includes("manifest"),
    )
    .map((attributes) => attributes.get("href") || "");
  auditSingleMetadataValue(
    manifestHrefs,
    scope,
    path,
    "manifest link",
    "/manifest.json",
  );

  for (const verificationName of [
    "google-site-verification",
    "yandex-verification",
  ]) {
    auditSingleMetadataValue(
      getMetaValues(metadataMarkup, verificationName),
      scope,
      path,
      verificationName,
    );
  }

  const jsonLdBlocks = getJsonLdBlocks(result.body);
  jsonLdBlocks.forEach((block, index) => {
    try {
      const value = JSON.parse(block);
      const values = Array.isArray(value) ? value : [value];
      if (
        values.length === 0 ||
        values.some(
          (entry) =>
            !entry ||
            typeof entry !== "object" ||
            !entry["@context"] ||
            !entry["@type"],
        )
      ) {
        throw new Error("missing @context or @type");
      }
    } catch (error) {
      reportFailure(
        scope,
        path,
        "structured data",
        `JSON-LD ${index + 1}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });
}

async function auditCanonicalPage(request, location) {
  const expectedUrl = new URL(location);
  const path = `${expectedUrl.pathname}${expectedUrl.search}`;
  const result = await request(path);
  if (!result.ok) {
    reportFailure("page", path, "fetch", result.error);
    return;
  }
  if (result.status !== 200 || result.headers.has("location")) {
    reportFailure(
      "page",
      path,
      "final response",
      `Expected direct 200, got ${result.status}${result.headers.has("location") ? ` -> ${result.headers.get("location")}` : ""}`,
    );
  }
  auditNoIndexHeader(result, "page", path);
  auditMarkupIntegrity(result.body, "page", path);
  const locale = expectedUrl.pathname.split("/")[1];
  if (result.status === 200 && LOCALES.includes(locale)) {
    auditIndexableMetadata(result, locale, path, location, "page");
  } else if (!LOCALES.includes(locale)) {
    reportFailure("page", path, "locale", `Unsupported locale ${locale}`);
  }
}

async function auditNoindexPage(request, path) {
  const result = await request(path);
  if (!result.ok) {
    reportFailure("noindex page", path, "fetch", result.error);
    return;
  }
  if (result.status !== 200 || result.headers.has("location")) {
    reportFailure(
      "noindex page",
      path,
      "direct response",
      `Expected direct 200, got ${result.status}${result.headers.has("location") ? ` -> ${result.headers.get("location")}` : ""}`,
    );
  }
  auditNoIndexHeader(result, "noindex page", path);
  auditMarkupIntegrity(result.body, "noindex page", path);
  if (!hasNoindexMeta(result.body)) {
    reportFailure("noindex page", path, "indexability", "Missing noindex meta");
  }
  const expectedCanonical = `${CANONICAL_ORIGIN}${path}`;
  const canonicalHrefs = getCanonicalHrefs(
    getHeadBlocks(result.body)[0] || result.body,
  );
  if (canonicalHrefs.length !== 1 || canonicalHrefs[0] !== expectedCanonical) {
    reportFailure(
      "noindex page",
      path,
      "canonical",
      `Expected only ${expectedCanonical}; found ${canonicalHrefs.join(", ") || "none"}`,
    );
  }
}

async function auditOfflinePage(request) {
  const path = "/offline.html";
  const result = await request(path);
  if (!result.ok) {
    reportFailure("offline", path, "fetch", result.error);
    return;
  }
  if (result.status !== 200) {
    reportFailure(
      "offline",
      path,
      "HTTP status",
      `Expected 200, got ${result.status}`,
    );
  }
  auditMarkupIntegrity(result.body, "offline", path);
  const contentType = result.headers.get("content-type") || "";
  if (!/^text\/html\b/i.test(contentType)) {
    reportFailure("offline", path, "content type", contentType || "missing");
  }
  if (!hasNoindexMeta(result.body)) {
    reportFailure("offline", path, "indexability", "Missing noindex meta");
  }
  if (!/noindex/i.test(result.headers.get("x-robots-tag") || "")) {
    reportFailure(
      "offline",
      path,
      "indexability header",
      "Missing X-Robots-Tag noindex",
    );
  }
  const cacheControl = result.headers.get("cache-control") || "";
  if (
    !/\bmax-age=0\b/i.test(cacheControl) ||
    !/\bmust-revalidate\b/i.test(cacheControl)
  ) {
    reportFailure("offline", path, "cache policy", cacheControl || "missing");
  }
}

async function auditNotFound(request, path) {
  const result = await request(path);
  if (!result.ok) {
    reportFailure("not found", path, "fetch", result.error);
    return;
  }
  if (result.status !== 404 || result.headers.has("location")) {
    reportFailure(
      "not found",
      path,
      "HTTP status",
      `Expected direct 404, got ${result.status}${result.headers.has("location") ? ` -> ${result.headers.get("location")}` : ""}`,
    );
  }
  auditMarkupIntegrity(result.body, "not found", path);
  if (
    !hasNoindexMeta(result.body) &&
    !/\bnoindex\b/i.test(result.headers.get("x-robots-tag") || "")
  ) {
    reportFailure(
      "not found",
      path,
      "indexability",
      "Expected noindex meta or X-Robots-Tag",
    );
  }
}

async function auditStaticEndpoint(request, path, expectedContentType) {
  const result = await request(path);
  if (!result.ok) {
    reportFailure("static", path, "fetch", result.error);
    return;
  }
  if (result.status !== 200) {
    reportFailure(
      "static",
      path,
      "HTTP status",
      `Expected 200, got ${result.status}`,
    );
  }
  const contentType = result.headers.get("content-type") || "";
  if (!expectedContentType.test(contentType)) {
    reportFailure("static", path, "content type", contentType || "missing");
  }
}

function parseCsp(value) {
  const directives = new Map();
  for (const part of value.split(";")) {
    const [name, ...tokens] = part.trim().split(/\s+/);
    if (name) directives.set(name.toLowerCase(), tokens);
  }
  return directives;
}

async function auditSecurityHeaders(request) {
  const path = "/ru";
  const result = await request(path);
  if (!result.ok) {
    reportFailure("headers", path, "fetch", result.error);
    return;
  }
  if (result.status !== 200) {
    reportFailure(
      "headers",
      path,
      "HTTP status",
      `Expected 200, got ${result.status}`,
    );
  }
  auditNoIndexHeader(result, "headers", path);

  const exactHeaders = new Map([
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "DENY"],
    ["x-xss-protection", "0"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["cross-origin-opener-policy", "same-origin"],
  ]);
  for (const [name, expected] of exactHeaders) {
    const actual = result.headers.get(name);
    if (actual !== expected) {
      reportFailure(
        "headers",
        path,
        name,
        `Expected ${expected}, got ${actual || "missing"}`,
      );
    }
  }
  if (result.headers.has("x-powered-by")) {
    reportFailure(
      "headers",
      path,
      "x-powered-by",
      `Unexpected ${result.headers.get("x-powered-by")}`,
    );
  }

  const hsts = result.headers.get("strict-transport-security") || "";
  if (
    !/\bmax-age=31536000\b/i.test(hsts) ||
    !/\bincludesubdomains\b/i.test(hsts)
  ) {
    reportFailure("headers", path, "HSTS", hsts || "missing");
  }
  const permissions = result.headers.get("permissions-policy") || "";
  for (const feature of [
    "camera",
    "microphone",
    "geolocation",
    "payment",
    "usb",
  ]) {
    if (!new RegExp(`(?:^|[,\\s])${feature}=\\(\\)`, "i").test(permissions)) {
      reportFailure(
        "headers",
        path,
        "Permissions-Policy",
        `Missing ${feature}=() in ${permissions || "missing header"}`,
      );
    }
  }

  const cspValue = result.headers.get("content-security-policy") || "";
  const csp = parseCsp(cspValue);
  const requiredDirectives = new Map([
    ["default-src", "'self'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["frame-ancestors", "'none'"],
    ["form-action", "'self'"],
  ]);
  for (const [directive, token] of requiredDirectives) {
    if (!(csp.get(directive) || []).includes(token)) {
      reportFailure(
        "headers",
        path,
        "Content-Security-Policy",
        `Missing ${directive} ${token}`,
      );
    }
  }
  const scriptSources = csp.get("script-src") || [];
  if (scriptSources.length === 0 || scriptSources.includes("'unsafe-eval'")) {
    reportFailure(
      "headers",
      path,
      "production script policy",
      scriptSources.length === 0
        ? "Missing script-src"
        : "script-src contains unsafe-eval",
    );
  }
  const htmlCache = result.headers.get("cache-control") || "";
  if (/\bimmutable\b/i.test(htmlCache)) {
    reportFailure(
      "headers",
      path,
      "HTML cache policy",
      `Unexpected immutable: ${htmlCache}`,
    );
  }
}

function localAssetPath(value, scope, path, check) {
  if (typeof value !== "string" || !value.trim()) {
    reportFailure(scope, path, check, "Missing URL");
    return undefined;
  }
  try {
    const resolved = new URL(value, `${CANONICAL_ORIGIN}/`);
    if (resolved.origin !== CANONICAL_ORIGIN) {
      throw new Error(`cross-origin URL ${resolved.toString()}`);
    }
    return `${resolved.pathname}${resolved.search}`;
  } catch (error) {
    reportFailure(
      scope,
      path,
      check,
      error instanceof Error ? error.message : String(error),
    );
    return undefined;
  }
}

async function auditManifest(request, concurrency) {
  const path = "/manifest.json";
  const result = await request(path);
  if (!result.ok) {
    reportFailure("manifest", path, "fetch", result.error);
    return;
  }
  if (result.status !== 200) {
    reportFailure(
      "manifest",
      path,
      "HTTP status",
      `Expected 200, got ${result.status}`,
    );
  }
  auditNoIndexHeader(result, "manifest", path);
  const contentType = result.headers.get("content-type") || "";
  if (!/application\/(?:manifest\+)?json\b/i.test(contentType)) {
    reportFailure("manifest", path, "content type", contentType || "missing");
  }
  const cacheControl = result.headers.get("cache-control") || "";
  if (
    !/\bmax-age=3600\b/i.test(cacheControl) ||
    !/\bmust-revalidate\b/i.test(cacheControl)
  ) {
    reportFailure("manifest", path, "cache policy", cacheControl || "missing");
  }

  let manifest;
  try {
    manifest = JSON.parse(result.body);
  } catch (error) {
    reportFailure(
      "manifest",
      path,
      "JSON",
      error instanceof Error ? error.message : String(error),
    );
    return;
  }
  for (const field of ["name", "short_name"]) {
    if (typeof manifest[field] !== "string" || !manifest[field].trim()) {
      reportFailure("manifest", path, field, "Missing non-empty string");
    }
  }
  const exactFields = new Map([
    ["start_url", "/ru"],
    ["scope", "/"],
    ["display", "standalone"],
  ]);
  for (const [field, expected] of exactFields) {
    if (manifest[field] !== expected) {
      reportFailure(
        "manifest",
        path,
        field,
        `Expected ${expected}, got ${manifest[field] ?? "missing"}`,
      );
    }
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  for (const size of ["192x192", "512x512"]) {
    for (const purpose of ["any", "maskable"]) {
      const found = icons.some(
        (icon) =>
          typeof icon?.src === "string" &&
          String(icon.sizes || "")
            .split(/\s+/)
            .includes(size) &&
          String(icon.purpose || "any")
            .split(/\s+/)
            .includes(purpose),
      );
      if (!found) {
        reportFailure(
          "manifest",
          path,
          "icon inventory",
          `Missing ${size} ${purpose} icon`,
        );
      }
    }
  }

  const assetPaths = new Set();
  for (const icon of icons) {
    if (typeof icon?.src !== "string") {
      reportFailure("manifest", path, "icon URL", "Missing icon src");
      continue;
    }
    const assetPath = localAssetPath(icon.src, "manifest", path, "icon URL");
    if (assetPath) assetPaths.add(assetPath);
  }
  const shortcuts = Array.isArray(manifest.shortcuts) ? manifest.shortcuts : [];
  for (const shortcut of shortcuts) {
    if (typeof shortcut?.name !== "string" || !shortcut.name.trim()) {
      reportFailure("manifest", path, "shortcut", "Missing shortcut name");
    }
    const shortcutIcons = Array.isArray(shortcut?.icons) ? shortcut.icons : [];
    for (const icon of shortcutIcons) {
      const assetPath = localAssetPath(
        icon?.src,
        "manifest",
        path,
        "shortcut icon URL",
      );
      if (assetPath) assetPaths.add(assetPath);
    }
  }
  await mapWithConcurrency([...assetPaths], concurrency, async (assetPath) => {
    const iconResult = await request(assetPath, { readBody: false });
    if (!iconResult.ok) {
      reportFailure("manifest icon", assetPath, "fetch", iconResult.error);
      return;
    }
    const iconType = iconResult.headers.get("content-type") || "";
    if (iconResult.status !== 200 || !/^image\//i.test(iconType)) {
      reportFailure(
        "manifest icon",
        assetPath,
        "response",
        `Expected 200 image, got ${iconResult.status} ${iconType || "without content type"}`,
      );
    }
  });

  const navigationPaths = new Set();
  const startPath = localAssetPath(
    manifest.start_url,
    "manifest",
    path,
    "start_url",
  );
  if (startPath) navigationPaths.add(startPath);
  for (const shortcut of shortcuts) {
    const shortcutPath = localAssetPath(
      shortcut?.url,
      "manifest",
      path,
      "shortcut URL",
    );
    if (shortcutPath) navigationPaths.add(shortcutPath);
  }
  await mapWithConcurrency(
    [...navigationPaths],
    concurrency,
    async (navigationPath) => {
      const navigationResult = await request(navigationPath);
      if (!navigationResult.ok) {
        reportFailure(
          "manifest navigation",
          navigationPath,
          "fetch",
          navigationResult.error,
        );
        return;
      }
      if (
        navigationResult.status !== 200 ||
        navigationResult.headers.has("location")
      ) {
        reportFailure(
          "manifest navigation",
          navigationPath,
          "direct response",
          `Expected direct 200, got ${navigationResult.status}`,
        );
      }
    },
  );
}

async function auditServiceWorker(request) {
  const path = "/sw.js";
  const result = await request(path);
  if (!result.ok) {
    reportFailure("service worker", path, "fetch", result.error);
    return;
  }
  if (result.status !== 200) {
    reportFailure(
      "service worker",
      path,
      "HTTP status",
      `Expected 200, got ${result.status}`,
    );
  }
  auditNoIndexHeader(result, "service worker", path);
  const contentType = result.headers.get("content-type") || "";
  if (!/(?:application|text)\/javascript\b/i.test(contentType)) {
    reportFailure(
      "service worker",
      path,
      "content type",
      contentType || "missing",
    );
  }
  const cacheControl = result.headers.get("cache-control") || "";
  if (
    !/\bmax-age=0\b/i.test(cacheControl) ||
    !/\bmust-revalidate\b/i.test(cacheControl)
  ) {
    reportFailure(
      "service worker",
      path,
      "cache policy",
      cacheControl || "missing",
    );
  }
  if (result.headers.get("service-worker-allowed") !== "/") {
    reportFailure(
      "service worker",
      path,
      "scope header",
      result.headers.get("service-worker-allowed") || "missing",
    );
  }
  for (const marker of ["install", "activate", "fetch"]) {
    const pattern = new RegExp(`addEventListener\\(\\s*["']${marker}["']`);
    if (!pattern.test(result.body)) {
      reportFailure(
        "service worker",
        path,
        "event handlers",
        `Missing ${marker} handler`,
      );
    }
  }
  if (!result.body.includes("/offline.html")) {
    reportFailure(
      "service worker",
      path,
      "offline fallback",
      "Missing /offline.html reference",
    );
  }
}

async function auditOpenGraphImages(request, slugs) {
  const sampleSlug = slugs[0];
  const paths = [
    "/opengraph-image",
    `/ru/tools/${sampleSlug}/opengraph-image`,
    `/en/tools/${sampleSlug}/opengraph-image`,
  ];
  await Promise.all(
    paths.map(async (path) => {
      const result = await request(path, { readBody: false });
      if (!result.ok) {
        reportFailure("Open Graph image", path, "fetch", result.error);
        return;
      }
      const contentType = result.headers.get("content-type") || "";
      if (result.status !== 200 || !/^image\//i.test(contentType)) {
        reportFailure(
          "Open Graph image",
          path,
          "response",
          `Expected 200 image, got ${result.status} ${contentType || "without content type"}`,
        );
      }
    }),
  );
}

async function auditVerificationEndpoints(request) {
  const bingPath = "/BingSiteAuth.xml";
  const bing = await request(bingPath);
  if (!bing.ok) {
    reportFailure("verification", bingPath, "fetch", bing.error);
  } else {
    const users = Array.from(
      bing.body.matchAll(/<user>\s*([A-F0-9]{32})\s*<\/user>/gi),
      (match) => match[1],
    );
    if (
      bing.status !== 200 ||
      !/xml/i.test(bing.headers.get("content-type") || "") ||
      users.length !== 1
    ) {
      reportFailure(
        "verification",
        bingPath,
        "Bing token",
        `Expected one 32-character token in 200 XML, found ${users.length}`,
      );
    }
  }

  const indexNowPath = "/cf5750cd7a2e40fb9839ec29a4ef25c3.txt";
  const indexNow = await request(indexNowPath);
  if (!indexNow.ok) {
    reportFailure("verification", indexNowPath, "fetch", indexNow.error);
  } else {
    const expectedToken = "cf5750cd7a2e40fb9839ec29a4ef25c3";
    if (
      indexNow.status !== 200 ||
      !/^text\/plain\b/i.test(indexNow.headers.get("content-type") || "") ||
      indexNow.body.trim() !== expectedToken
    ) {
      reportFailure(
        "verification",
        indexNowPath,
        "IndexNow token",
        `Expected exact ${expectedToken}`,
      );
    }
  }
}

function extractXmlLocations(xml) {
  return Array.from(xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi), (match) =>
    decodeEntities(match[1].trim()),
  );
}

function auditExactSet(scope, path, actualValues, expectedValues) {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  const missing = expectedValues.filter((value) => !actual.has(value));
  const extra = actualValues.filter((value) => !expected.has(value));
  const duplicateCount = actualValues.length - actual.size;

  if (missing.length || extra.length || duplicateCount) {
    reportFailure(
      scope,
      path,
      "URL set",
      [
        missing.length ? `missing ${missing.slice(0, 5).join(", ")}` : "",
        extra.length ? `extra ${extra.slice(0, 5).join(", ")}` : "",
        duplicateCount ? `${duplicateCount} duplicate(s)` : "",
      ]
        .filter(Boolean)
        .join("; "),
    );
  }
}

function auditSitemapAlternates(xml, path) {
  const entries = Array.from(
    xml.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/gi),
    (match) => match[1],
  );

  for (const entry of entries) {
    const location = extractXmlLocations(entry)[0];
    if (!location) {
      reportFailure(
        "sitemap",
        path,
        "entry location",
        "A <url> entry has no <loc>",
      );
      continue;
    }

    let pathname;
    try {
      const parsed = new URL(location);
      if (parsed.origin !== CANONICAL_ORIGIN) {
        reportFailure(
          "sitemap",
          path,
          "canonical host",
          `Unexpected location ${location}`,
        );
      }
      pathname = parsed.pathname;
    } catch {
      reportFailure("sitemap", path, "absolute location", location);
      continue;
    }

    const alternateTags = getTags(entry, "xhtml:link").map(parseAttributes);
    const alternates = expectedAlternates(pathname);
    for (const [language, expectedHref] of Object.entries(alternates)) {
      const hrefs = alternateTags
        .filter(
          (attributes) =>
            (attributes.get("rel") || "").toLowerCase() === "alternate" &&
            (attributes.get("hreflang") || "").toLowerCase() === language,
        )
        .map((attributes) => attributes.get("href") || "");
      if (hrefs.length !== 1 || hrefs[0] !== expectedHref) {
        reportFailure(
          "sitemap",
          path,
          `hreflang ${language}`,
          `For ${location}, expected only ${expectedHref}; found ${hrefs.join(", ") || "none"}`,
        );
      }
    }
    const unexpectedHreflangs = alternateTags
      .filter(
        (attributes) =>
          (attributes.get("rel") || "").toLowerCase() === "alternate",
      )
      .map((attributes) => (attributes.get("hreflang") || "").toLowerCase())
      .filter((language) => !Object.hasOwn(alternates, language));
    if (unexpectedHreflangs.length) {
      reportFailure(
        "sitemap",
        path,
        "hreflang inventory",
        `For ${location}, unexpected ${[...new Set(unexpectedHreflangs)].join(", ")}`,
      );
    }
  }

  return entries.length;
}

function parseRobotsText(body) {
  const groups = [];
  const sitemaps = [];
  let currentGroup;

  for (const rawLine of body.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) {
      if (!rawLine.trim()) currentGroup = undefined;
      continue;
    }
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 1) continue;
    const directive = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (directive === "sitemap") {
      sitemaps.push(value);
      continue;
    }
    if (directive === "user-agent") {
      if (!currentGroup || currentGroup.rules.length > 0) {
        currentGroup = { agents: [], rules: [] };
        groups.push(currentGroup);
      }
      currentGroup.agents.push(value.toLowerCase());
      continue;
    }
    if (currentGroup && (directive === "allow" || directive === "disallow")) {
      currentGroup.rules.push({ directive, value });
    }
  }

  return { groups, sitemaps };
}

async function auditRobots(request) {
  const path = "/robots.txt";
  const result = await request(path);
  if (!result.ok) {
    reportFailure("robots", path, "fetch", result.error);
    return;
  }

  if (result.status !== 200) {
    reportFailure(
      "robots",
      path,
      "HTTP status",
      `Expected 200, got ${result.status}`,
    );
  }
  auditNoIndexHeader(result, "robots", path);
  auditMarkupIntegrity(result.body, "robots", path);

  const contentType = result.headers.get("content-type") || "";
  if (!/^text\/plain\b/i.test(contentType)) {
    reportFailure("robots", path, "content type", contentType || "missing");
  }

  const { groups, sitemaps } = parseRobotsText(result.body);
  auditExactSet("robots", path, sitemaps, [`${CANONICAL_ORIGIN}/sitemap.xml`]);

  const wildcardGroups = groups.filter(({ agents }) => agents.includes("*"));
  if (wildcardGroups.length !== 1) {
    reportFailure(
      "robots",
      path,
      "wildcard group",
      `Expected one User-agent: * group, found ${wildcardGroups.length}`,
    );
    return;
  }

  const wildcardRules = wildcardGroups[0].rules;
  const allows = wildcardRules
    .filter(({ directive }) => directive === "allow")
    .map(({ value }) => value);
  const disallows = wildcardRules
    .filter(({ directive }) => directive === "disallow")
    .map(({ value }) => value);
  if (!allows.includes("/")) {
    reportFailure("robots", path, "crawl policy", "Missing Allow: /");
  }
  for (const requiredPath of ["/api/", "/admin/", "/private/", "/draft/"]) {
    if (!disallows.includes(requiredPath)) {
      reportFailure(
        "robots",
        path,
        "production directive",
        `Missing Disallow: ${requiredPath}`,
      );
    }
  }

  for (const group of groups) {
    const blockingRules = group.rules.filter(
      ({ directive, value }) =>
        directive === "disallow" &&
        (value === "/" || value === "/*" || value.startsWith("/_next")),
    );
    if (blockingRules.length) {
      reportFailure(
        "robots",
        path,
        "crawl policy",
        `${group.agents.join(", ") || "unnamed group"} blocks ${blockingRules.map(({ value }) => value).join(", ")}`,
      );
    }
  }
}

function buildExpectedSitemapInventory({ slugs, groupSlugs }) {
  const main = LOCALES.flatMap((locale) => [
    `${CANONICAL_ORIGIN}/${locale}`,
    `${CANONICAL_ORIGIN}/${locale}/privacy`,
    `${CANONICAL_ORIGIN}/${locale}/terms`,
    ...groupSlugs.map(
      (groupSlug) => `${CANONICAL_ORIGIN}/${locale}/group/${groupSlug}`,
    ),
  ]);
  const tools = LOCALES.flatMap((locale) =>
    slugs.map((slug) => `${CANONICAL_ORIGIN}/${locale}/tools/${slug}`),
  );
  const kz = LOCALES.map((locale) => `${CANONICAL_ORIGIN}/${locale}/kz`);
  const all = [...main, ...tools, ...kz];
  const duplicates = findDuplicates(all);
  const expectedCounts = {
    main: 50,
    tools: EXPECTED_SLUG_COUNT * LOCALES.length,
    kz: 2,
  };
  if (
    main.length !== expectedCounts.main ||
    tools.length !== expectedCounts.tools ||
    kz.length !== expectedCounts.kz ||
    duplicates.length
  ) {
    throw new Error(
      `Invalid expected sitemap inventory: main=${main.length}, tools=${tools.length}, kz=${kz.length}, duplicates=${duplicates.join(", ") || "none"}`,
    );
  }
  return {
    main,
    tools,
    kz,
    all,
  };
}

async function auditSitemaps(request, expectedInventory, concurrency) {
  const indexPath = "/sitemap.xml";
  const indexResult = await request(indexPath);
  if (!indexResult.ok) {
    reportFailure("sitemap", indexPath, "fetch", indexResult.error);
    return;
  }

  if (indexResult.status !== 200) {
    reportFailure(
      "sitemap",
      indexPath,
      "HTTP status",
      `Expected 200, got ${indexResult.status}`,
    );
  }
  auditNoIndexHeader(indexResult, "sitemap", indexPath);
  auditMarkupIntegrity(indexResult.body, "sitemap", indexPath);
  const indexContentType = indexResult.headers.get("content-type") || "";
  if (!/^(?:application|text)\/xml\b/i.test(indexContentType)) {
    reportFailure(
      "sitemap",
      indexPath,
      "content type",
      indexContentType || "missing",
    );
  }
  if (!/<sitemapindex\b/i.test(indexResult.body)) {
    reportFailure("sitemap", indexPath, "XML root", "Missing <sitemapindex>");
  }
  if (/<lastmod\b/i.test(indexResult.body)) {
    reportFailure(
      "sitemap",
      indexPath,
      "unverified date",
      "Sitemap index must not publish a lastmod without per-URL evidence",
    );
  }

  const expectedIndexLocations = SEGMENT_IDS.map(
    (id) => `${CANONICAL_ORIGIN}/sitemap/${id}.xml`,
  );
  const indexLocations = extractXmlLocations(indexResult.body);
  auditExactSet("sitemap", indexPath, indexLocations, expectedIndexLocations);

  const segmentResults = await Promise.all(
    SEGMENT_IDS.map(async (id) => {
      const path = `/sitemap/${id}.xml`;
      const result = await request(path);
      return { id, path, result };
    }),
  );

  const allLocations = [];
  for (const { id, path, result } of segmentResults) {
    if (!result.ok) {
      reportFailure("sitemap", path, "fetch", result.error);
      continue;
    }
    if (result.status !== 200) {
      reportFailure(
        "sitemap",
        path,
        "HTTP status",
        `Expected 200, got ${result.status}`,
      );
    }
    auditNoIndexHeader(result, "sitemap", path);
    auditMarkupIntegrity(result.body, "sitemap", path);

    const contentType = result.headers.get("content-type") || "";
    if (!/^(?:application|text)\/xml\b/i.test(contentType)) {
      reportFailure("sitemap", path, "content type", contentType || "missing");
    }
    if (!/<urlset\b/i.test(result.body)) {
      reportFailure("sitemap", path, "XML root", "Missing <urlset>");
    }

    const locations = extractXmlLocations(result.body);
    allLocations.push(...locations);
    if (/<(?:lastmod|changefreq|priority)\b/i.test(result.body)) {
      reportFailure(
        "sitemap",
        path,
        "unverified crawl hint",
        "Found lastmod/changefreq/priority without a source-backed value",
      );
    }
    const entryCount = auditSitemapAlternates(result.body, path);
    if (locations.length !== entryCount) {
      reportFailure(
        "sitemap",
        path,
        "entry structure",
        `${locations.length} locations across ${entryCount} URL entries`,
      );
    }

    const expectedLocations = expectedInventory[id];
    const expectedCount = expectedLocations.length;
    if (locations.length !== expectedCount) {
      reportFailure(
        "sitemap",
        path,
        "URL count",
        `Expected ${expectedCount}, found ${locations.length}`,
      );
    }
    auditExactSet("sitemap", path, locations, expectedLocations);
  }

  auditExactSet("sitemap", indexPath, allLocations, expectedInventory.all);
  const nonToolLocations = [...expectedInventory.main, ...expectedInventory.kz];
  await mapWithConcurrency(nonToolLocations, concurrency, (location) =>
    auditCanonicalPage(request, location),
  );
}

async function auditRedirect(request, baseOrigin, redirectCase) {
  const { name, source, target, headers } = redirectCase;
  const sourceUrl = new URL(source, `${baseOrigin}/`);
  sourceUrl.searchParams.set("__qa_redirect", "preserved");
  const sourcePath = `${sourceUrl.pathname}${sourceUrl.search}`;
  const result = await request(sourcePath, { headers });
  if (!result.ok) {
    reportFailure("redirect", sourcePath, "fetch", `${name}: ${result.error}`);
    return;
  }

  if (result.status !== 308) {
    reportFailure(
      "redirect",
      sourcePath,
      "HTTP status",
      `${name}: expected 308, got ${result.status}`,
    );
  }
  auditNoIndexHeader(result, "redirect", sourcePath);

  const location = result.headers.get("location");
  if (!location) {
    reportFailure(
      "redirect",
      sourcePath,
      "Location",
      `${name}: missing Location header`,
    );
    return;
  }

  let resolvedTarget;
  try {
    resolvedTarget = new URL(location, result.url);
  } catch {
    reportFailure(
      "redirect",
      sourcePath,
      "Location",
      `${name}: invalid ${location}`,
    );
    return;
  }

  const expectedTarget = new URL(target, `${baseOrigin}/`);
  expectedTarget.searchParams.set("__qa_redirect", "preserved");
  const sortedParams = (url) =>
    [...url.searchParams.entries()].sort(
      ([leftKey, leftValue], [rightKey, rightValue]) =>
        leftKey === rightKey
          ? leftValue.localeCompare(rightValue)
          : leftKey.localeCompare(rightKey),
    );
  const sameTarget =
    resolvedTarget.origin === baseOrigin &&
    resolvedTarget.pathname === expectedTarget.pathname &&
    JSON.stringify(sortedParams(resolvedTarget)) ===
      JSON.stringify(sortedParams(expectedTarget)) &&
    !resolvedTarget.hash;
  const actualLocalPath = `${resolvedTarget.pathname}${resolvedTarget.search}`;
  if (!sameTarget) {
    reportFailure(
      "redirect",
      sourcePath,
      "redirect target",
      `${name}: expected local ${expectedTarget.pathname}${expectedTarget.search}, got ${resolvedTarget.toString()}`,
    );
    return;
  }

  const finalResult = await request(actualLocalPath);
  if (!finalResult.ok) {
    reportFailure(
      "redirect",
      sourcePath,
      "single hop",
      `${name}: target fetch failed: ${finalResult.error}`,
    );
    return;
  }
  auditNoIndexHeader(finalResult, "redirect target", actualLocalPath);
  auditMarkupIntegrity(finalResult.body, "redirect target", actualLocalPath);
  if (finalResult.status !== 200 || finalResult.headers.has("location")) {
    reportFailure(
      "redirect",
      sourcePath,
      "single hop",
      `${name}: ${target} returned ${finalResult.status}${
        finalResult.headers.has("location")
          ? ` with Location ${finalResult.headers.get("location")}`
          : ""
      }`,
    );
  }
  const expectedCanonical = `${CANONICAL_ORIGIN}${resolvedTarget.pathname}`;
  const canonicalHrefs = getCanonicalHrefs(
    getHeadBlocks(finalResult.body)[0] || finalResult.body,
  );
  if (
    finalResult.status === 200 &&
    (canonicalHrefs.length !== 1 || canonicalHrefs[0] !== expectedCanonical)
  ) {
    reportFailure(
      "redirect",
      sourcePath,
      "target canonical",
      `${name}: expected only ${expectedCanonical}; found ${canonicalHrefs.join(", ") || "none"}`,
    );
  }
}

async function main() {
  const startedAt = Date.now();
  const baseOrigin = parseBaseUrl(process.argv[2] || "http://127.0.0.1:3101");
  const concurrency = parseConcurrency(process.env.QA_CONCURRENCY);
  const [inventory, staticRedirects] = await Promise.all([
    readCatalogInventory(),
    readStaticRedirects(),
  ]);
  const { slugs } = inventory;
  const expectedSitemaps = buildExpectedSitemapInventory(inventory);
  const redirectCases = [...staticRedirects, ...PROXY_REDIRECTS];
  const request = makeRequester(baseOrigin, concurrency);
  const routes = LOCALES.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );

  console.error(
    `[qa] Auditing ${expectedSitemaps.all.length} exact indexable URLs, ${staticRedirects.length} concrete static redirects and ${PROXY_REDIRECTS.length} proxy redirects at ${baseOrigin} (global concurrency ${concurrency})`,
  );

  await Promise.all([
    mapWithConcurrency(routes, concurrency, ({ locale, slug }) =>
      auditToolRoute(request, locale, slug),
    ),
    auditRobots(request),
    auditSitemaps(request, expectedSitemaps, concurrency),
    mapWithConcurrency(
      redirectCases,
      Math.min(4, concurrency),
      (redirectCase) => auditRedirect(request, baseOrigin, redirectCase),
    ),
    mapWithConcurrency(
      LOCALES.map((locale) => `/${locale}/favorites`),
      2,
      (path) => auditNoindexPage(request, path),
    ),
    auditOfflinePage(request),
    mapWithConcurrency(
      [
        "/definitely-not-a-real-route",
        "/ru/definitely-not-a-real-route",
        "/fr",
        "/en/tools/definitely-not-a-real-tool",
        "/ru/group/definitely-not-a-real-group",
        "/en/blog/page/999999",
        "/blog/definitely-not-real-guide",
        "/en/blog/definitely-not-real-deep-guide-2026",
        "/kz/definitely-not-a-city",
      ],
      Math.min(3, concurrency),
      (path) => auditNotFound(request, path),
    ),
    auditSecurityHeaders(request),
    auditManifest(request, concurrency),
    auditServiceWorker(request),
    auditOpenGraphImages(request, slugs),
    auditVerificationEndpoints(request),
    auditStaticEndpoint(request, "/favicon.svg", /image\/svg\+xml/i),
  ]);

  const summary = {
    ok: failureCount === 0,
    baseUrl: baseOrigin,
    catalogSlugs: slugs.length,
    groupSlugs: inventory.groupSlugs.length,
    audited: {
      toolRoutes: routes.length,
      indexableRoutes: expectedSitemaps.all.length,
      staticRedirectDefinitions: EXPECTED_STATIC_REDIRECT_COUNT,
      staticRedirectRoutes: staticRedirects.length,
      proxyRedirects: PROXY_REDIRECTS.length,
      redirects: redirectCases.length,
      noindexRoutes: 3,
      notFoundRoutes: 9,
      seoAndStaticEndpoints: 12,
    },
    concurrency,
    durationMs: Date.now() - startedAt,
    failureCount,
    failures,
    omittedFailures: Math.max(0, failureCount - failures.length),
  };

  console.log(JSON.stringify(summary, null, 2));
  if (failureCount > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.log(
    JSON.stringify(
      {
        ok: false,
        fatal:
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
