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
  // Tools and pages use the shared controls: Select (a native list in a Material field), NumberInput (− / +
  // instead of spinner arrows) and Slider / SliderField. A plain <select multiple> is the one exception.
  {
    files: ["src/tools/**/*.tsx", "src/site/**/*.tsx", "src/app/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "JSXOpeningElement[name.name='select']:not(:has(JSXAttribute[name.name='multiple']))", message: "Use Select from @/ui/field." },
        { selector: "JSXOpeningElement JSXAttribute[name.name='type'][value.value='number']", message: "Use NumberInput from @/ui/number-input (or SliderField)." },
        { selector: "JSXOpeningElement[name.name='input'] JSXAttribute[name.name='type'][value.value='range']", message: "Use Slider from @/ui/field (or SliderField)." },
      ],
    },
  },
];

export default config;
