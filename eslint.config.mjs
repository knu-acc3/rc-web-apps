import { fixupPluginRules } from "@eslint/compat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-plugin-react and eslint-plugin-import were written for ESLint 9: fixupPluginRules adds back the context
// methods ESLint 10 removed. Each plugin object is wrapped once, so configs that share it still agree.
const fixed = new Map();
const LEGACY = new Set(["react", "import"]);
const fixup = (configs) =>
  configs.map((c) =>
    c.plugins
      ? {
          ...c,
          plugins: Object.fromEntries(
            Object.entries(c.plugins).map(([name, p]) => {
              if (!LEGACY.has(name)) return [name, p];
              if (!fixed.has(p)) fixed.set(p, fixupPluginRules(p));
              return [name, fixed.get(p)];
            }),
          ),
        }
      : c,
  );

const config = [
  { ignores: [".next/**", "node_modules/**", "public/**", "scripts/**", ".claude/**", "next-env.d.ts"] },
  ...fixup(nextVitals),
  ...fixup(nextTs),
  // A fixed React version spares eslint-plugin-react its "detect" lookup, which breaks on ESLint 10.
  { settings: { react: { version: "19.3" } } },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];

export default config;
