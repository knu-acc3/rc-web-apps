/**
 * Post-build steps that keep the site working on old phones (iOS 14+, old Android WebViews) and render
 * readable, styled pages even on older ones (iOS 9–15.3).
 *
 * 1. SWC bug workaround. Lowering default parameters for Safari < 16.4 turns `function (o = {}) { var o = … }`
 *    (Emscripten glue in the image codecs does this) into `let o = arguments…; var o = …` — a SyntaxError in every
 *    browser. At the top of a function body `var` is equivalent to that `let`, so the `let` is rewritten.
 * 2. Every client script must parse as ES2021 (Safari 14) and contain no regex lookbehind (Safari < 16.4 rejects
 *    the whole file). The build fails otherwise.
 * 3. public/legacy.css — the site CSS for browsers without cascade layers (they drop every @layer block, i.e. the
 *    whole design): layers flattened with specificity preserved, :is()/:where() expanded, one selector per rule
 *    (an unknown pseudo-class in a list kills the whole rule), individual transforms, dvh/min()/clamp() and flex-gap
 *    fallbacks, static colour fallbacks. The layout loads it only when `CSSLayerBlockRule` is missing.
 */
import fs from "node:fs";
import path from "node:path";
import * as acorn from "acorn";
import postcss from "postcss";
import cascadeLayers from "@csstools/postcss-cascade-layers";
import customProperties from "postcss-custom-properties";
import selectorParser from "postcss-selector-parser";
import { transform as lightning, browserslistToTargets } from "lightningcss";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const STATIC = path.join(ROOT, ".next", "static");

function walk(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

/* ───────────── 1 + 2: scripts ───────────── */

const LOWERED_PARAM = /\blet ([\w$]+)=arguments\.length>(\d+)&&void 0!==arguments\[\2\]\?arguments\[\2\]:/g;
/** Prettier's language plugins use lookbehind; they are only loaded by the code formatters, which therefore need
    Safari 16.4+. Everything else must parse in Safari 14. */
const isPrettier = (code) => code.includes("prettier");
const problems = [];
let patched = 0;
for (const file of walk(STATIC, ".js")) {
  let code = fs.readFileSync(file, "utf8");
  const fixed = code.replace(LOWERED_PARAM, (_m, id, i) => `var ${id}=arguments.length>${i}&&void 0!==arguments[${i}]?arguments[${i}]:`);
  if (fixed !== code) {
    fs.writeFileSync(file, fixed);
    code = fixed;
    patched++;
  }
  const rel = path.relative(ROOT, file);
  try {
    for (const tok of acorn.tokenizer(code, { ecmaVersion: 2021, allowHashBang: true, allowReturnOutsideFunction: true })) {
      if (tok.type.label === "regexp" && /\(\?<[=!]/.test(tok.value.pattern) && !isPrettier(code)) {
        problems.push(`${rel}: regex lookbehind /${tok.value.pattern.slice(0, 60)}/ (Safari < 16.4 cannot parse this file)`);
        break;
      }
    }
    acorn.parse(code, { ecmaVersion: 2021, sourceType: "script", allowHashBang: true, allowReturnOutsideFunction: true });
  } catch (e) {
    try {
      acorn.parse(code, { ecmaVersion: 2021, sourceType: "module", allowHashBang: true });
    } catch {
      problems.push(`${rel}: not valid ES2021 (${e.message})`);
    }
  }
}
console.log(`postbuild: ${patched} script(s) patched`);
if (problems.length) {
  console.error(`postbuild: ${problems.length} client script problem(s):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

/* ───────────── 3: legacy.css ───────────── */

const cssFiles = walk(STATIC, ".css").sort();
let css = cssFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");

// Vendor prefixes, colour-function and `inset` lowering for old Safari.
css = lightning({
  filename: "legacy.css",
  code: Buffer.from(css),
  minify: false,
  errorRecovery: true,
  targets: browserslistToTargets(["safari >= 7", "ios_saf >= 7", "chrome >= 49", "android >= 4.4"]),
}).code.toString();

/** Pseudo-classes old engines don't know: a rule containing them is dropped entirely. */
const UNSUPPORTED = /:popover-open|:open\b|:has\(|::backdrop|:user-(?:valid|invalid)|:modal|:host\b|::details-content|::picker|:state\(/;

/** Expand :is(a, b) / :where(a, b) into a list of plain selectors. */
function expandSelector(sel) {
  const ast = selectorParser().astSync(sel);
  let out = ast.nodes.map((n) => n.toString().trim());
  for (let guard = 0; guard < 8; guard++) {
    let changed = false;
    const next = [];
    for (const s of out) {
      const root = selectorParser().astSync(s);
      let target = null;
      root.walkPseudos((p) => {
        if (!target && (p.value === ":is" || p.value === ":where" || p.value === ":matches")) target = p;
      });
      if (!target) {
        next.push(s);
        continue;
      }
      changed = true;
      const args = target.nodes.map((n) => n.toString().trim());
      for (const a of args) {
        const r2 = selectorParser().astSync(s);
        let t2 = null;
        r2.walkPseudos((p) => {
          if (!t2 && (p.value === ":is" || p.value === ":where" || p.value === ":matches")) t2 = p;
        });
        // A leading combinator-less argument replaces the pseudo in place.
        t2.replaceWith(selectorParser.string({ value: a }));
        next.push(r2.toString().trim());
      }
    }
    out = [...new Set(next)].slice(0, 64);
    if (!changed) break;
  }
  return out;
}

function fallbackValue(value) {
  let v = value;
  v = v.replace(/(\d)(?:d|s|l)v([hwib])/g, "$1v$2");
  v = v.replace(/clamp\(([^(),]+(?:\([^()]*\))?),\s*([^(),]+(?:\([^()]*\))?),\s*([^(),]+(?:\([^()]*\))?)\)/g, "$2");
  v = v.replace(/min\(([^(),]+),\s*([^(),]+)\)/g, (_m, a, b) => (/vw|vh/.test(b) && !/vw|vh/.test(a) ? b : a));
  v = v.replace(/max\(([^(),]+),\s*([^(),]+)\)/g, "$1");
  return v;
}

const legacyPlugin = {
  postcssPlugin: "legacy-fallbacks",
  OnceExit(root) {
    root.walkAtRules("property", (r) => r.remove());
    root.walkRules((rule) => {
      if (rule.parent?.type === "atrule" && /keyframes/.test(rule.parent.name)) return;
      let sels = rule.selectors.flatMap((s) => (/:(?:is|where|matches)\(/.test(s) ? expandSelector(s) : [s]));
      sels = sels
        .map((s) => s.replace(/:focus-visible/g, ":focus").replace(/::file-selector-button/g, "::-webkit-file-upload-button").replace(/:autofill/g, ":-webkit-autofill"))
        .filter((s) => !UNSUPPORTED.test(s));
      if (sels.length === 0) {
        rule.remove();
        return;
      }
      if (sels.length === 1) {
        rule.selector = sels[0];
        return;
      }
      // One selector per rule: an invalid selector must not take the others down with it.
      for (const s of sels) rule.cloneBefore({ selector: s });
      rule.remove();
    });
    root.walkDecls((decl) => {
      const { prop, value } = decl;
      if (prop === "translate" && !/^none$/.test(value)) {
        const parts = value.trim().split(/\s+(?![^(]*\))/);
        decl.cloneBefore({ prop: "-webkit-transform", value: `translate(${parts[0]}, ${parts[1] ?? 0})` });
        decl.cloneBefore({ prop: "transform", value: `translate(${parts[0]}, ${parts[1] ?? 0})` });
      } else if (prop === "scale" && !/^none$/.test(value)) {
        const parts = value.trim().split(/\s+(?![^(]*\))/);
        decl.cloneBefore({ prop: "transform", value: `scale(${parts[0]}, ${parts[1] ?? parts[0]})` });
      } else if (prop === "rotate" && !/^none$/.test(value)) {
        decl.cloneBefore({ prop: "transform", value: `rotate(${value})` });
      } else if (/(?:\d)[dsl]v[hwib]\b|clamp\(|min\(|max\(/.test(value) && !prop.startsWith("--")) {
        const fb = fallbackValue(value);
        if (fb !== value) decl.cloneBefore({ value: fb });
      }
    });
    // Flex gap arrived in Safari 14.1 together with the `translate` property: emulate it with margins before that.
    const gapRules = [];
    root.walkRules((rule) => {
      if (!/^\.[\w\\:[\].-]*gap-[\w\\.[\]-]+$/.test(rule.selector)) return;
      rule.walkDecls(/^(gap|column-gap|row-gap)$/, (d) => gapRules.push({ rule, prop: d.prop, value: d.value }));
    });
    if (gapRules.length) {
      const supports = postcss.atRule({ name: "supports", params: "not (translate: 0)" });
      for (const { rule, prop, value } of gapRules) {
        const col = prop === "row-gap" || prop === "gap";
        const row = prop === "column-gap" || prop === "gap";
        const target = rule.parent?.type === "atrule" && rule.parent.name === "media" ? rule.parent.clone({ nodes: [] }) : null;
        const add = (container) => {
          if (row) container.append(postcss.rule({ selector: `.flex${rule.selector}:not(.flex-col)>*+*`, nodes: [postcss.decl({ prop: "margin-left", value })] }));
          if (row) container.append(postcss.rule({ selector: `.inline-flex${rule.selector}>*+*`, nodes: [postcss.decl({ prop: "margin-left", value })] }));
          if (col) container.append(postcss.rule({ selector: `.flex-col${rule.selector}>*+*`, nodes: [postcss.decl({ prop: "margin-top", value })] }));
        };
        if (target) {
          add(target);
          supports.append(target);
        } else add(supports);
      }
      root.append(supports);
    }
    // Elements the page hides with features old browsers lack (popover, dialog).
    root.append(
      postcss.parse(
        "[popover]{display:none}[popover].is-open{display:block;position:fixed;left:0;right:0;top:56px;bottom:0;overflow-y:auto;z-index:50}" +
          "dialog:not([open]){display:none}body{min-height:100vh}",
      ),
    );
  },
};

const result = await postcss([cascadeLayers(), legacyPlugin, customProperties({ preserve: true })]).process(css, { from: undefined });
// Whitespace-only minification (safe for selectors: "{", "}" and ";" never appear inside them).
const out = result.css
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{};])\s*/g, "$1");
const publicFile = path.join(ROOT, "public", "legacy.css");
fs.writeFileSync(publicFile, `/* Generated by scripts/postbuild.mjs for browsers without cascade layers. */\n${out}`);
console.log(`postbuild: public/legacy.css ${(out.length / 1024).toFixed(0)} KB from ${cssFiles.length} stylesheet(s)`);
