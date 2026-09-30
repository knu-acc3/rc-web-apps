import type { Plugin } from "prettier";

export interface HtmlFormatOptions {
  tabWidth: 2 | 4;
  useTabs: boolean;
  printWidth: 80 | 100 | 120;
  singleAttributePerLine: boolean;
}

/** Load Prettier and its HTML/embed parsers only after the user formats. */
export async function formatHtml(
  source: string,
  options: HtmlFormatOptions,
): Promise<string> {
  const [{ format }, htmlModule, babelModule, estreeModule, postcssModule] =
    await Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/html"),
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
      import("prettier/plugins/postcss"),
    ]);

  const plugins: Plugin[] = [
    htmlModule.default,
    babelModule.default,
    estreeModule.default,
    postcssModule.default,
  ];

  return format(source, {
    parser: "html",
    plugins,
    tabWidth: options.tabWidth,
    useTabs: options.useTabs,
    printWidth: options.printWidth,
    singleAttributePerLine: options.singleAttributePerLine,
    htmlWhitespaceSensitivity: "css",
    bracketSameLine: false,
  });
}
