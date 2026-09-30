import type { Plugin } from "prettier";

export type CodeLanguage =
  | "js"
  | "ts"
  | "jsx"
  | "json"
  | "css"
  | "scss"
  | "less";

export interface CodeFormatOptions {
  tabWidth: 2 | 4;
  useTabs: boolean;
  printWidth: 80 | 100 | 120;
  singleQuote: boolean;
  semicolons: boolean;
  trailingComma: boolean;
}

const PARSER_BY_LANGUAGE: Record<CodeLanguage, string> = {
  js: "babel",
  ts: "typescript",
  jsx: "typescript",
  json: "json",
  css: "css",
  scss: "scss",
  less: "less",
};

let workerInstance: Worker | null = null;
let taskIdCounter = 0;

function getWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return null;
  }
  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL("@/src/workers/code-formatter.worker.ts", import.meta.url),
        { type: "module" },
      );
    } catch {
      workerInstance = null;
    }
  }
  return workerInstance;
}

async function formatDirectly(
  source: string,
  language: CodeLanguage,
  options: CodeFormatOptions,
): Promise<string> {
  const { format } = await import("prettier/standalone");
  let plugins: Plugin[];

  if (language === "css" || language === "scss" || language === "less") {
    const postcssModule = await import("prettier/plugins/postcss");
    plugins = [postcssModule.default];
  } else if (language === "ts" || language === "jsx") {
    const [typescriptModule, estreeModule] = await Promise.all([
      import("prettier/plugins/typescript"),
      import("prettier/plugins/estree"),
    ]);
    plugins = [typescriptModule.default, estreeModule.default];
  } else {
    const [babelModule, estreeModule] = await Promise.all([
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
    ]);
    plugins = [babelModule.default, estreeModule.default];
  }

  return format(source, {
    parser: PARSER_BY_LANGUAGE[language],
    plugins,
    tabWidth: options.tabWidth,
    useTabs: options.useTabs,
    printWidth: options.printWidth,
    singleQuote: options.singleQuote,
    semi: options.semicolons,
    trailingComma: options.trailingComma ? "all" : "none",
    bracketSpacing: true,
  });
}

/**
 * Prettier formatting offloaded to Web Worker with fallback to dynamic import.
 */
export async function formatCode(
  source: string,
  language: CodeLanguage,
  options: CodeFormatOptions,
): Promise<string> {
  const worker = getWorker();
  const parser = PARSER_BY_LANGUAGE[language];

  if (!worker) {
    return formatDirectly(source, language, options);
  }

  const taskId = `fmt_${++taskIdCounter}`;
  const prettierOptions = {
    tabWidth: options.tabWidth,
    useTabs: options.useTabs,
    printWidth: options.printWidth,
    singleQuote: options.singleQuote,
    semi: options.semicolons,
    trailingComma: options.trailingComma ? "all" : "none",
  };

  return new Promise<string>((resolve, reject) => {
    const handleMessage = (
      e: MessageEvent<{ taskId?: string; success: boolean; formatted?: string; error?: string }>,
    ) => {
      if (e.data.taskId !== taskId) return;
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      if (e.data.success && typeof e.data.formatted === "string") {
        resolve(e.data.formatted);
      } else {
        reject(new Error(e.data.error || "Formatting failed"));
      }
    };

    const handleError = () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      // Fallback directly if worker execution fails
      formatDirectly(source, language, options).then(resolve, reject);
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    worker.postMessage({ taskId, code: source, parser, options: prettierOptions });
  });
}
