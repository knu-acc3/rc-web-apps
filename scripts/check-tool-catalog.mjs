import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const dataPath = path.join(rootDir, "src", "data", "tools.ts");
const registryPath = path.join(rootDir, "src", "tools", "registry.ts");
const catalogPath = path.join(rootDir, "src", "tools", "ux", "catalog.ts");
const tsconfigPath = path.join(rootDir, "tsconfig.json");
const toolsRoot = path.join(rootDir, "src", "tools");

const EXPECTED_PUBLIC_TOOL_COUNT = 183;
const VALID_PATTERNS = [
  "transform",
  "generator",
  "calculator",
  "file",
  "timer",
  "canvas",
  "reference",
];
const VALID_STATUSES = new Set(["legacy", "focused"]);
// Language names are the subject of the transliteration tool, not a generic
// country preset. Keep the generic-content guard strict everywhere else.
const LOCALE_COPY_ALLOWED = new Set([
  "transliteration",
  "iin-validator",
  "kz-phone-formatter",
  "kz-salary-calc",
  "kz-iban-validator",
  "kz-holidays",
  "kz-postal-code",
  "kz-address-format",
]);

function unwrap(node) {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text;
  return undefined;
}

function propertyInitializer(object, name) {
  const property = object.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      propertyName(candidate.name) === name,
  );
  return property ? unwrap(property.initializer) : undefined;
}

function stringValue(node, context) {
  if (node && ts.isStringLiteralLike(node)) return node.text;
  throw new Error(`Expected a string at ${context}.`);
}

function booleanValue(node) {
  if (!node) return undefined;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  return undefined;
}

function arrayValue(node, context) {
  const value = node && unwrap(node);
  if (value && ts.isArrayLiteralExpression(value)) return value;
  throw new Error(`Expected an array at ${context}.`);
}

function objectValue(node, context) {
  const value = node && unwrap(node);
  if (value && ts.isObjectLiteralExpression(value)) return value;
  throw new Error(`Expected an object at ${context}.`);
}

function findVariable(sourceFile, name) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === name &&
        declaration.initializer
      ) {
        return unwrap(declaration.initializer);
      }
    }
  }
  throw new Error(`Could not find ${name} in ${sourceFile.fileName}.`);
}

async function parseSource(filePath) {
  const text = await readFile(filePath, "utf8");
  return {
    text,
    sourceFile: ts.createSourceFile(
      filePath,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    ),
  };
}

function parseData(sourceFile) {
  const groupArray = arrayValue(
    findVariable(sourceFile, "toolGroups"),
    "toolGroups",
  );
  const groups = groupArray.elements.map((node, index) => {
    const object = objectValue(node, `toolGroups[${index}]`);
    return stringValue(
      propertyInitializer(object, "id"),
      `toolGroups[${index}].id`,
    );
  });

  const toolArray = arrayValue(findVariable(sourceFile, "tools"), "tools");
  const tools = toolArray.elements.map((node, index) => {
    const object = objectValue(node, `tools[${index}]`);
    return {
      slug: stringValue(
        propertyInitializer(object, "slug"),
        `tools[${index}].slug`,
      ),
      groupId: stringValue(
        propertyInitializer(object, "groupId"),
        `tools[${index}].groupId`,
      ),
      implemented: booleanValue(propertyInitializer(object, "implemented")),
      hidden: booleanValue(propertyInitializer(object, "hidden")),
    };
  });

  return {
    groups,
    publicTools: tools.filter(
      (tool) => tool.implemented === true && tool.hidden !== true,
    ),
  };
}

function parseCatalog(sourceFile) {
  const declaredPatternArray = arrayValue(
    findVariable(sourceFile, "TOOL_UX_PATTERNS"),
    "TOOL_UX_PATTERNS",
  );
  const declaredPatterns = declaredPatternArray.elements.map((node, index) =>
    stringValue(unwrap(node), `TOOL_UX_PATTERNS[${index}]`),
  );

  const categoryArray = arrayValue(
    findVariable(sourceFile, "toolUxCatalog"),
    "toolUxCatalog",
  );
  const categories = categoryArray.elements.map(
    (categoryNode, categoryIndex) => {
      const category = objectValue(
        categoryNode,
        `toolUxCatalog[${categoryIndex}]`,
      );
      const categoryId = stringValue(
        propertyInitializer(category, "categoryId"),
        `toolUxCatalog[${categoryIndex}].categoryId`,
      );
      const toolArray = arrayValue(
        propertyInitializer(category, "tools"),
        `toolUxCatalog[${categoryIndex}].tools`,
      );
      const tools = toolArray.elements.map((toolNode, toolIndex) => {
        const context = `toolUxCatalog[${categoryIndex}].tools[${toolIndex}]`;
        const tool = objectValue(toolNode, context);
        const primaryVerb = objectValue(
          propertyInitializer(tool, "primaryVerb"),
          `${context}.primaryVerb`,
        );
        return {
          slug: stringValue(
            propertyInitializer(tool, "slug"),
            `${context}.slug`,
          ),
          pattern: stringValue(
            propertyInitializer(tool, "pattern"),
            `${context}.pattern`,
          ),
          primaryVerb: {
            ru: stringValue(
              propertyInitializer(primaryVerb, "ru"),
              `${context}.primaryVerb.ru`,
            ),
            en: stringValue(
              propertyInitializer(primaryVerb, "en"),
              `${context}.primaryVerb.en`,
            ),
          },
          migrationStatus: stringValue(
            propertyInitializer(tool, "migrationStatus"),
            `${context}.migrationStatus`,
          ),
        };
      });
      return { categoryId, tools };
    },
  );

  return { declaredPatterns, categories };
}

function parseRegistry(text) {
  const entries = [];
  const matcher =
    /["']([^"']+)["']\s*:\s*dyn\(\(\)\s*=>\s*import\(["']@\/src\/tools\/([^"']+)["']\)\)/g;
  for (const match of text.matchAll(matcher)) {
    entries.push({ slug: match[1], module: match[2] });
  }
  return entries;
}

function duplicates(values) {
  const seen = new Set();
  const duplicateSet = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicateSet.add(value);
    seen.add(value);
  }
  return [...duplicateSet];
}

function missingFrom(actual, expected) {
  const actualSet = new Set(actual);
  return expected.filter((value) => !actualSet.has(value));
}

function validateOrdered(actual, expected, label, errors) {
  if (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  ) {
    return;
  }

  const maxLength = Math.max(actual.length, expected.length);
  const mismatchIndex = Array.from({ length: maxLength }).findIndex(
    (_, index) => actual[index] !== expected[index],
  );
  errors.push(
    `${label} differs at position ${mismatchIndex + 1}: expected ${JSON.stringify(expected[mismatchIndex] ?? "<end>")}, got ${JSON.stringify(actual[mismatchIndex] ?? "<end>")}.`,
  );
}

function addDuplicateError(values, label, errors) {
  const found = duplicates(values);
  if (found.length > 0)
    errors.push(`${label} contains duplicates: ${found.join(", ")}.`);
}

function addSetErrors(actual, expected, label, errors) {
  const missing = missingFrom(actual, expected);
  const extra = missingFrom(expected, actual);
  if (missing.length > 0)
    errors.push(`${label} is missing: ${missing.join(", ")}.`);
  if (extra.length > 0)
    errors.push(`${label} has unexpected entries: ${extra.join(", ")}.`);
}

function moduleFile(moduleName) {
  return path.join(toolsRoot, `${moduleName}.tsx`);
}

function isInsideDirectory(filePath, directory) {
  const relative = path.relative(directory, filePath);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function collectLocalToolSpecifiers(source, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const specifiers = [];

  const addLiteral = (node) => {
    if (node && ts.isStringLiteralLike(node)) specifiers.push(node.text);
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      addLiteral(node.moduleSpecifier);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      addLiteral(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

function resolveLocalToolSpecifier(specifier, fromFile, actualFiles) {
  let basePath;
  if (specifier.startsWith("@/src/tools/")) {
    basePath = path.resolve(
      toolsRoot,
      specifier.slice("@/src/tools/".length),
    );
  } else if (specifier.startsWith(".")) {
    basePath = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }

  if (basePath !== toolsRoot && !isInsideDirectory(basePath, toolsRoot)) {
    return null;
  }
  const candidates = path.extname(basePath)
    ? [basePath]
    : [
        `${basePath}.ts`,
        `${basePath}.tsx`,
        path.join(basePath, "index.ts"),
        path.join(basePath, "index.tsx"),
      ];
  return candidates.find((candidate) => actualFiles.has(candidate)) ?? basePath;
}

async function validateToolStructure(data, registry, errors) {
  const allowedDirectories = new Set([...data.groups, "ux"]);
  const expectedTopLevelFiles = new Set(["registry.ts"]);
  const rootEntries = await readdir(toolsRoot, { withFileTypes: true });
  const actualDirectories = new Set();

  for (const entry of rootEntries) {
    if (entry.isSymbolicLink()) {
      errors.push(`src/tools/${entry.name} must not be a symbolic link.`);
      continue;
    }
    if (entry.isDirectory()) {
      actualDirectories.add(entry.name);
      if (!allowedDirectories.has(entry.name)) {
        errors.push(`src/tools contains unexpected directory ${entry.name}.`);
      }
      continue;
    }
    if (!entry.isFile() || !expectedTopLevelFiles.has(entry.name)) {
      errors.push(`src/tools contains unexpected top-level file ${entry.name}.`);
    }
  }

  for (const directory of allowedDirectories) {
    if (!actualDirectories.has(directory)) {
      errors.push(`src/tools is missing required directory ${directory}.`);
    }
  }

  const actualFiles = new Set();
  const implementationFiles = new Set();
  const fileNamesByGroup = new Map();
  for (const groupId of data.groups) {
    const groupPath = path.join(toolsRoot, groupId);
    let entries;
    try {
      entries = await readdir(groupPath, { withFileTypes: true });
    } catch {
      continue;
    }
    const fileNames = new Set();
    fileNamesByGroup.set(groupId, fileNames);
    for (const entry of entries) {
      const relative = `${groupId}/${entry.name}`;
      if (entry.isSymbolicLink() || !entry.isFile()) {
        errors.push(`src/tools/${relative} must be a regular file.`);
        continue;
      }
      if (!/\.(?:ts|tsx)$/.test(entry.name)) {
        errors.push(`src/tools/${relative} must be a TypeScript source file.`);
        continue;
      }
      const filePath = path.join(groupPath, entry.name);
      fileNames.add(entry.name);
      actualFiles.add(filePath);
      implementationFiles.add(filePath);
    }
  }

  try {
    const uxEntries = await readdir(path.join(toolsRoot, "ux"), {
      withFileTypes: true,
    });
    for (const entry of uxEntries) {
      if (
        entry.isSymbolicLink() ||
        !entry.isFile() ||
        entry.name !== "catalog.ts"
      ) {
        errors.push(`src/tools/ux contains unexpected entry ${entry.name}.`);
      }
    }
  } catch {
    // The missing directory is already reported above.
  }

  const publicBySlug = new Map(
    data.publicTools.map((tool) => [tool.slug, tool]),
  );
  const registryTargets = new Set();
  const roots = [];
  for (const entry of registry) {
    const tool = publicBySlug.get(entry.slug);
    if (!tool) continue;
    const segments = entry.module.split("/");
    if (
      segments.length !== 2 ||
      segments[0] !== tool.groupId ||
      !/^[A-Za-z][A-Za-z0-9]*$/.test(segments[1]) ||
      entry.module.includes("\\") ||
      entry.module.includes("..") ||
      segments[1] === "index"
    ) {
      errors.push(
        `${entry.slug} registry module must be @/src/tools/${tool.groupId}/<Module>; got @/src/tools/${entry.module}.`,
      );
      continue;
    }
    if (registryTargets.has(entry.module)) {
      errors.push(`Tool registry reuses module ${entry.module}.`);
    }
    registryTargets.add(entry.module);

    const fileName = `${segments[1]}.tsx`;
    if (!fileNamesByGroup.get(tool.groupId)?.has(fileName)) {
      errors.push(
        `${entry.slug} registry target src/tools/${entry.module}.tsx is missing or has incorrect casing.`,
      );
      continue;
    }
    roots.push(moduleFile(entry.module));
  }

  const reachable = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const filePath = queue.pop();
    if (!filePath || reachable.has(filePath)) continue;
    reachable.add(filePath);
    let source;
    try {
      source = await readFile(filePath, "utf8");
    } catch {
      continue;
    }
    for (const specifier of collectLocalToolSpecifiers(source, filePath)) {
      const target = resolveLocalToolSpecifier(specifier, filePath, actualFiles);
      if (!target) continue;
      if (!actualFiles.has(target)) {
        errors.push(
          `${path.relative(rootDir, filePath)} imports missing local tool module ${specifier}.`,
        );
        continue;
      }
      if (!reachable.has(target)) queue.push(target);
    }
  }

  const orphans = [...implementationFiles]
    .filter((filePath) => !reachable.has(filePath))
    .map((filePath) => path.relative(rootDir, filePath))
    .sort();
  if (orphans.length > 0) {
    errors.push(`Tool structure contains orphan files: ${orphans.join(", ")}.`);
  }
}

function jsxAttribute(attributes, name) {
  return attributes.properties.find(
    (property) =>
      ts.isJsxAttribute(property) && property.name.getText() === name,
  );
}

function jsxAttributeSource(attribute, sourceFile) {
  if (!attribute?.initializer) return "";
  if (ts.isStringLiteral(attribute.initializer))
    return attribute.initializer.text;
  if (
    ts.isJsxExpression(attribute.initializer) &&
    attribute.initializer.expression
  ) {
    return attribute.initializer.expression.getText(sourceFile);
  }
  return attribute.initializer.getText(sourceFile);
}

function inspectFocusedSource(source, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const visibleStrings = [];
  const actionMarkers = [];
  const advancedPositions = [];
  let unmarkedLargeButtonCount = 0;
  let advancedSettingsCount = 0;
  let searchControlCount = 0;
  let liveResultCount = 0;

  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(sourceFile);
      if (tagName === "AdvancedSettings") {
        advancedSettingsCount += 1;
        advancedPositions.push(node.getStart(sourceFile));
      }

      const className = jsxAttribute(node.attributes, "className");
      const size = jsxAttribute(node.attributes, "size");
      const variant = jsxAttribute(node.attributes, "variant");
      const id = jsxAttribute(node.attributes, "id");
      const ariaLabel = jsxAttribute(node.attributes, "aria-label");
      const placeholder = jsxAttribute(node.attributes, "placeholder");
      const ariaLive = jsxAttribute(node.attributes, "aria-live");
      const dataPrimary = jsxAttribute(node.attributes, "data-primary-action");
      const dataPrimaryState = jsxAttribute(
        node.attributes,
        "data-primary-state",
      );
      const dataToolPrimary = jsxAttribute(
        node.attributes,
        "data-tool-primary-action",
      );
      const hasPrimaryClass = jsxAttributeSource(
        className,
        sourceFile,
      ).includes("tool-primary-action");
      const isLargeButton =
        tagName === "Button" && jsxAttributeSource(size, sourceFile) === "lg";
      const isPrimaryComponent = tagName === "ToolPrimaryAction";
      const isExplicitPrimary =
        hasPrimaryClass ||
        Boolean(dataPrimary) ||
        Boolean(dataToolPrimary) ||
        isPrimaryComponent;

      // ToolHost already supplies the shared ToolWorkspace shell. A focused
      // implementation only needs one explicit dominant action in its own JSX.
      if (isExplicitPrimary) {
        actionMarkers.push({
          position: node.getStart(sourceFile),
          flow: dataPrimary
            ? jsxAttributeSource(dataPrimary, sourceFile).trim()
            : "",
          state: dataPrimaryState
            ? jsxAttributeSource(dataPrimaryState, sourceFile).trim()
            : "",
        });
      }

      const searchText = [id, ariaLabel, placeholder]
        .map((attribute) => jsxAttributeSource(attribute, sourceFile))
        .join(" ");
      if (tagName === "Input" && /search|поиск/iu.test(searchText)) {
        searchControlCount += 1;
      }
      if (ariaLive) liveResultCount += 1;

      const variantValue = jsxAttributeSource(variant, sourceFile);
      const isSecondaryLargeButton = ["outline", "ghost", "link"].includes(
        variantValue,
      );
      if (isLargeButton && !isExplicitPrimary && !isSecondaryLargeButton) {
        unmarkedLargeButtonCount += 1;
      }
    }

    if (ts.isStringLiteralLike(node) || ts.isJsxText(node)) {
      const value = node.text.trim();
      if (value) visibleStrings.push(value);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  const localeOrExamplePattern =
    /\bkz\b|\bkazakh(?:stan)?\b|қазақ|казах|пример|example|e\.g\.?|напр\./iu;
  const bannedCopy = visibleStrings.find((value) =>
    localeOrExamplePattern.test(value),
  );

  const standaloneMarkers = actionMarkers.filter((marker) => !marker.flow);
  const flowGroups = new Map();
  for (const marker of actionMarkers) {
    if (!marker.flow) continue;
    const group = flowGroups.get(marker.flow) ?? [];
    group.push(marker.state);
    flowGroups.set(marker.flow, group);
  }

  const flowErrors = [];
  for (const [flow, states] of flowGroups) {
    if (states.length < 2) continue;
    if (states.some((state) => !state)) {
      flowErrors.push(
        `primary flow ${JSON.stringify(flow)} has multiple markers without explicit states`,
      );
      continue;
    }
    if (new Set(states).size !== states.length) {
      flowErrors.push(
        `primary flow ${JSON.stringify(flow)} repeats a state marker`,
      );
    }
  }

  const explicitPrimaryActionCount = standaloneMarkers.length + flowGroups.size;
  // A repeated flow is allowed only when each marker declares a distinct,
  // mutually-exclusive UI state. Unmarked default large buttons remain
  // competing actions; outline/ghost controls are secondary by construction.
  const primaryActionCount =
    explicitPrimaryActionCount > 0
      ? explicitPrimaryActionCount + unmarkedLargeButtonCount
      : unmarkedLargeButtonCount;
  const advancedBeforePrimary =
    actionMarkers.length > 0 &&
    advancedPositions.length > 0 &&
    Math.min(...advancedPositions) <
      Math.min(...actionMarkers.map((marker) => marker.position));

  return {
    primaryActionCount,
    advancedSettingsCount,
    advancedBeforePrimary,
    bannedCopy,
    flowErrors,
    searchControlCount,
    liveResultCount,
  };
}

function thinProxyTarget(source, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const component = sourceFile.statements.find(
    (statement) =>
      ts.isFunctionDeclaration(statement) &&
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
      ),
  );
  if (!component?.body || component.body.statements.length !== 1) return null;

  const returnStatement = component.body.statements[0];
  if (!ts.isReturnStatement(returnStatement) || !returnStatement.expression) {
    return null;
  }
  const returned = unwrap(returnStatement.expression);
  if (!ts.isJsxSelfClosingElement(returned)) return null;
  const returnedTag = returned.tagName.getText(sourceFile);

  const importedDefault = sourceFile.statements.find(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      statement.importClause?.name?.text === returnedTag &&
      ts.isStringLiteral(statement.moduleSpecifier),
  );
  if (!importedDefault || !ts.isImportDeclaration(importedDefault)) return null;

  const moduleSpecifier = importedDefault.moduleSpecifier.text;
  const toolsRoot = path.join(rootDir, "src", "tools");
  let target;
  if (moduleSpecifier.startsWith("@/src/tools/")) {
    const moduleName = moduleSpecifier.slice("@/src/tools/".length);
    target = path.resolve(toolsRoot, `${moduleName}.tsx`);
  } else if (moduleSpecifier.startsWith(".")) {
    const resolved = path.resolve(path.dirname(filePath), moduleSpecifier);
    target = path.extname(resolved) ? resolved : `${resolved}.tsx`;
  } else {
    return null;
  }
  if (!target.startsWith(`${toolsRoot}${path.sep}`)) return null;
  return target;
}

async function inspectFocusedFile(source, filePath, visited = new Set()) {
  const evidence = inspectFocusedSource(source, filePath);
  if (
    evidence.primaryActionCount !== 0 ||
    evidence.advancedSettingsCount !== 0
  ) {
    return evidence;
  }

  const target = thinProxyTarget(source, filePath);
  if (!target) return evidence;
  if (visited.has(target)) {
    return {
      ...evidence,
      flowErrors: [
        ...evidence.flowErrors,
        `thin proxy cycle reaches ${path.relative(rootDir, target)}`,
      ],
    };
  }

  const nextVisited = new Set(visited);
  nextVisited.add(filePath);
  let targetSource;
  try {
    targetSource = await readFile(target, "utf8");
  } catch {
    return {
      ...evidence,
      flowErrors: [
        ...evidence.flowErrors,
        `thin proxy target ${path.relative(rootDir, target)} does not exist`,
      ],
    };
  }
  return inspectFocusedFile(targetSource, target, nextVisited);
}

function formatDiagnostic(diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
  if (!diagnostic.file || diagnostic.start === undefined) return message;
  const position = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start,
  );
  return `${path.relative(rootDir, diagnostic.file.fileName)}:${position.line + 1}:${position.character + 1} ${message}`;
}

function typecheckFocusedFiles(rootNames) {
  if (rootNames.length === 0) return [];

  const config = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (config.error) return [formatDiagnostic(config.error)];
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    rootDir,
    {
      noEmit: true,
      incremental: false,
      composite: false,
    },
    tsconfigPath,
  );
  if (parsed.errors.length > 0) return parsed.errors.map(formatDiagnostic);

  const program = ts.createProgram({
    rootNames,
    options: parsed.options,
  });
  return ts.getPreEmitDiagnostics(program).map(formatDiagnostic);
}

async function main() {
  const [dataSource, registrySource, catalogSource] = await Promise.all([
    parseSource(dataPath),
    parseSource(registryPath),
    parseSource(catalogPath),
  ]);

  const data = parseData(dataSource.sourceFile);
  const registry = parseRegistry(registrySource.text);
  const catalog = parseCatalog(catalogSource.sourceFile);
  const errors = [];

  validateOrdered(
    catalog.declaredPatterns,
    VALID_PATTERNS,
    "TOOL_UX_PATTERNS",
    errors,
  );
  addDuplicateError(data.groups, "toolGroups", errors);
  addDuplicateError(
    data.publicTools.map((tool) => tool.slug),
    "Public tools data",
    errors,
  );
  addDuplicateError(
    registry.map((entry) => entry.slug),
    "Tool registry",
    errors,
  );
  addDuplicateError(
    catalog.categories.map((category) => category.categoryId),
    "UX catalog categories",
    errors,
  );

  validateOrdered(
    catalog.categories.map((category) => category.categoryId),
    data.groups,
    "UX catalog category order",
    errors,
  );

  const knownGroups = new Set(data.groups);
  for (const tool of data.publicTools) {
    if (!knownGroups.has(tool.groupId)) {
      errors.push(
        `Public tool ${tool.slug} uses unknown category ${tool.groupId}.`,
      );
    }
  }

  const expectedByCategory = new Map(
    data.groups.map((groupId) => [
      groupId,
      data.publicTools
        .filter((tool) => tool.groupId === groupId)
        .map((tool) => tool.slug),
    ]),
  );
  for (const category of catalog.categories) {
    const slugs = category.tools.map((tool) => tool.slug);
    addDuplicateError(
      slugs,
      `UX catalog category ${category.categoryId}`,
      errors,
    );
    validateOrdered(
      slugs,
      expectedByCategory.get(category.categoryId) ?? [],
      `UX catalog order for ${category.categoryId}`,
      errors,
    );
  }

  const expectedSiteOrder = data.groups.flatMap(
    (groupId) => expectedByCategory.get(groupId) ?? [],
  );
  const flatCatalog = catalog.categories.flatMap((category) =>
    category.tools.map((tool) => ({
      ...tool,
      categoryId: category.categoryId,
    })),
  );
  const catalogSlugs = flatCatalog.map((tool) => tool.slug);
  const registrySlugs = registry.map((entry) => entry.slug);

  addDuplicateError(catalogSlugs, "UX catalog", errors);
  addSetErrors(
    catalogSlugs,
    expectedSiteOrder,
    "UX catalog vs public tools data",
    errors,
  );
  addSetErrors(
    registrySlugs,
    expectedSiteOrder,
    "Tool registry vs public tools data",
    errors,
  );
  validateOrdered(
    catalogSlugs,
    expectedSiteOrder,
    "UX catalog public site order",
    errors,
  );

  if (expectedSiteOrder.length !== EXPECTED_PUBLIC_TOOL_COUNT) {
    errors.push(
      `Canonical public tool count changed: expected ${EXPECTED_PUBLIC_TOOL_COUNT}, got ${expectedSiteOrder.length}. Update the migration scope deliberately before changing this guard.`,
    );
  }
  if (catalogSlugs.length !== EXPECTED_PUBLIC_TOOL_COUNT) {
    errors.push(
      `UX catalog must contain ${EXPECTED_PUBLIC_TOOL_COUNT} tools; got ${catalogSlugs.length}.`,
    );
  }
  if (registrySlugs.length !== EXPECTED_PUBLIC_TOOL_COUNT) {
    errors.push(
      `Tool registry must contain ${EXPECTED_PUBLIC_TOOL_COUNT} tools; got ${registrySlugs.length}.`,
    );
  }

  await validateToolStructure(data, registry, errors);

  const registryModules = new Map(
    registry.map((entry) => [entry.slug, entry.module]),
  );
  const focusedFiles = [];
  for (const entry of flatCatalog) {
    if (!VALID_PATTERNS.includes(entry.pattern)) {
      errors.push(
        `${entry.slug} has invalid UX pattern ${JSON.stringify(entry.pattern)}.`,
      );
    }
    if (!VALID_STATUSES.has(entry.migrationStatus)) {
      errors.push(
        `${entry.slug} has invalid migration status ${JSON.stringify(entry.migrationStatus)}.`,
      );
    }
    if (
      entry.primaryVerb.ru.trim().length === 0 ||
      entry.primaryVerb.en.trim().length === 0
    ) {
      errors.push(`${entry.slug} must have non-empty RU and EN primary verbs.`);
    }
    if (entry.migrationStatus !== "focused") continue;

    const moduleName = registryModules.get(entry.slug);
    if (!moduleName) {
      errors.push(`${entry.slug} is focused but has no registry module.`);
      continue;
    }

    const filePath = moduleFile(moduleName);
    let source;
    try {
      source = await readFile(filePath, "utf8");
    } catch {
      errors.push(
        `${entry.slug} is focused but ${path.relative(rootDir, filePath)} does not exist.`,
      );
      continue;
    }

    const evidence = await inspectFocusedFile(source, filePath);
    for (const flowError of evidence.flowErrors) {
      errors.push(`${entry.slug} ${flowError}.`);
    }
    const isImmediateReference =
      entry.pattern === "reference" &&
      evidence.primaryActionCount === 0 &&
      evidence.searchControlCount > 0 &&
      evidence.liveResultCount > 0;
    if (evidence.primaryActionCount !== 1 && !isImmediateReference) {
      errors.push(
        `${entry.slug} is focused but exposes ${evidence.primaryActionCount} primary action markers; expected exactly one.`,
      );
    }
    if (evidence.advancedSettingsCount === 0) {
      errors.push(
        `${entry.slug} is focused but has no AdvancedSettings disclosure for secondary controls.`,
      );
    }
    if (evidence.advancedBeforePrimary) {
      errors.push(
        `${entry.slug} exposes AdvancedSettings before its primary action; move secondary controls after the main CTA.`,
      );
    }
    if (evidence.bannedCopy && !LOCALE_COPY_ALLOWED.has(entry.slug)) {
      errors.push(
        `${entry.slug} is focused but still contains locale-specific or example copy: ${JSON.stringify(evidence.bannedCopy.slice(0, 100))}.`,
      );
    }
    focusedFiles.push(filePath);
  }

  if (errors.length === 0) {
    const diagnostics = typecheckFocusedFiles([...new Set(focusedFiles)]);
    if (diagnostics.length > 0) {
      errors.push(
        `Focused implementations do not typecheck:\n${diagnostics
          .slice(0, 12)
          .map((line) => `    ${line}`)
          .join("\n")}`,
      );
      if (diagnostics.length > 12) {
        errors.push(
          `Focused typecheck has ${diagnostics.length - 12} additional diagnostic(s).`,
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error("Tool UX catalog check failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  const focusedCount = flatCatalog.filter(
    (tool) => tool.migrationStatus === "focused",
  ).length;
  const prefixCount = flatCatalog.findIndex(
    (tool) => tool.migrationStatus !== "focused",
  );
  const completedPrefix = prefixCount === -1 ? flatCatalog.length : prefixCount;
  const nextTool = flatCatalog[completedPrefix];
  const percent = ((focusedCount / flatCatalog.length) * 100).toFixed(1);
  const prefixPercent = ((completedPrefix / flatCatalog.length) * 100).toFixed(
    1,
  );

  console.log(
    `Tool UX catalog OK: ${catalog.categories.length} categories, ${flatCatalog.length} public tools.`,
  );
  console.log(
    `Focused total: ${focusedCount}/${flatCatalog.length} (${percent}%).`,
  );
  console.log(
    `Focused prefix: ${completedPrefix}/${flatCatalog.length} (${prefixPercent}%).`,
  );
  if (nextTool)
    console.log(`Next prefix tool: ${nextTool.categoryId}/${nextTool.slug}.`);
  console.log("Category progress:");
  for (const category of catalog.categories) {
    const categoryFocused = category.tools.filter(
      (tool) => tool.migrationStatus === "focused",
    ).length;
    console.log(
      `  ${category.categoryId.padEnd(14)} ${String(categoryFocused).padStart(2)}/${category.tools.length}`,
    );
  }
}

main().catch((error) => {
  console.error(
    `Tool UX catalog check crashed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
