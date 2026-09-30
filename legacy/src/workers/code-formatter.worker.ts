/**
 * Web Worker for heavy Prettier code formatting.
 * Keeps AST parsers out of the main thread and initial bundle.
 */

export interface CodeFormatterPayload {
  taskId?: string;
  code: string;
  parser: string;
  options?: Record<string, unknown>;
}

self.onmessage = async (e: MessageEvent<CodeFormatterPayload>) => {
  const { code, parser, options, taskId } = e.data;
  try {
    const prettier = await import("prettier/standalone");
    let plugins: unknown[] = [];

    if (parser === "css" || parser === "scss" || parser === "less") {
      const postcssModule = await import("prettier/plugins/postcss");
      plugins = [postcssModule.default];
    } else if (parser === "typescript") {
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

    const formatted = await prettier.format(code, {
      parser,
      plugins: plugins as unknown as import("prettier").Plugin[],
      bracketSpacing: true,
      ...options,
    });

    self.postMessage({ taskId, success: true, formatted });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    self.postMessage({ taskId, success: false, error });
  }
};
