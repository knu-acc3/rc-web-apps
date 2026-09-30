import { flexItem, gridItem, type FlexState, type GridState } from "./layout";

/* ───────────── box-shadow ───────────── */

export interface ShadowPreset {
  slug: string;
  value: string;
  /** Preview page background and box color. */
  surface?: string;
  box?: string;
}

export const MATERIAL_ELEVATION: [number, string][] = [
  [1, "0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)"],
  [2, "0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)"],
  [3, "0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)"],
  [4, "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)"],
  [6, "0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)"],
  [8, "0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)"],
  [12, "0px 7px 8px -4px rgba(0,0,0,0.2), 0px 12px 17px 2px rgba(0,0,0,0.14), 0px 5px 22px 4px rgba(0,0,0,0.12)"],
  [16, "0px 8px 10px -5px rgba(0,0,0,0.2), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 6px 30px 5px rgba(0,0,0,0.12)"],
  [24, "0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)"],
];

/** Tailwind CSS v4 shadow tokens (theme.css of tailwindcss 4.x). */
export const TAILWIND_SHADOWS: Record<string, string> = {
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
};

export const SHADOW_PRESETS: ShadowPreset[] = [
  { slug: "subtle", value: "0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.1)" },
  { slug: "medium", value: "0 6px 16px rgb(0 0 0 / 0.12)" },
  { slug: "large", value: "0 20px 40px -12px rgb(0 0 0 / 0.3)" },
  { slug: "inner", value: "inset 0 2px 6px rgb(0 0 0 / 0.15)" },
  { slug: "neumorphism-light", value: "8px 8px 16px #c5c9d1, -8px -8px 16px #ffffff", surface: "#e4e7ec", box: "#e4e7ec" },
  { slug: "neumorphism-dark", value: "8px 8px 16px #15171b, -8px -8px 16px #2f333b", surface: "#22252b", box: "#22252b" },
  { slug: "glow", value: "0 0 12px rgb(59 130 246 / 0.6), 0 0 32px rgb(59 130 246 / 0.35)", surface: "#0f172a", box: "#1e293b" },
  { slug: "layered", value: "0 1px 1px rgb(0 0 0 / 0.08), 0 2px 2px rgb(0 0 0 / 0.08), 0 4px 4px rgb(0 0 0 / 0.08), 0 8px 8px rgb(0 0 0 / 0.08), 0 16px 16px rgb(0 0 0 / 0.08)" },
  { slug: "card", value: "0 1px 3px rgb(0 0 0 / 0.08), 0 8px 24px -4px rgb(0 0 0 / 0.12)" },
  { slug: "floating", value: "0 30px 60px -12px rgb(50 50 93 / 0.25), 0 18px 36px -18px rgb(0 0 0 / 0.3)" },
  { slug: "material-elevation", value: MATERIAL_ELEVATION[3][1] },
  ...Object.entries(TAILWIND_SHADOWS).map(([k, v]) => ({ slug: `tailwind-${k}`, value: v })),
];

/* ───────────── text-shadow ───────────── */

export interface TextShadowPreset {
  slug: string;
  value: string;
  color: string;
  surface: string;
}

export const TEXT_SHADOW_PRESETS: TextShadowPreset[] = [
  { slug: "neon", value: "0 0 4px #fff, 0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #0ff", color: "#ffffff", surface: "#0b1020" },
  { slug: "glow", value: "0 0 12px rgb(250 204 21 / 0.8)", color: "#fde047", surface: "#1c1917" },
  { slug: "3d", value: "1px 1px 0 #cbd5e1, 2px 2px 0 #b8c2d0, 3px 3px 0 #a5afbe, 4px 4px 0 #939dac, 6px 6px 8px rgb(0 0 0 / 0.35)", color: "#f8fafc", surface: "#64748b" },
  {
    slug: "long-shadow",
    value: Array.from({ length: 12 }, (_, i) => `${i + 1}px ${i + 1}px 0 #1e3a8a`).join(", "),
    color: "#ffffff",
    surface: "#3b82f6",
  },
  { slug: "outline", value: "-1px -1px 0 #111, 1px -1px 0 #111, -1px 1px 0 #111, 1px 1px 0 #111", color: "#ffffff", surface: "#f59e0b" },
  { slug: "retro", value: "3px 3px 0 #f97316, 6px 6px 0 #0ea5e9", color: "#fef3c7", surface: "#1f2937" },
  { slug: "embossed", value: "-1px -1px 0 rgb(255 255 255 / 0.6), 1px 1px 0 rgb(0 0 0 / 0.25)", color: "#d4d4d8", surface: "#d4d4d8" },
  { slug: "letterpress", value: "0 1px 0 rgb(255 255 255 / 0.5)", color: "#52525b", surface: "#d4d4d8" },
  { slug: "fire", value: "0 0 4px #fefcc9, 2px -2px 6px #feec85, -2px -4px 10px #ffae34, 2px -8px 14px #ec760c, -2px -12px 18px #cd4606, 0 -16px 24px #973716", color: "#fefcc9", surface: "#000000" },
  { slug: "soft", value: "0 2px 4px rgb(0 0 0 / 0.25)", color: "#111827", surface: "#f4f4f5" },
];

/* ───────────── flexbox recipes ───────────── */

const F = (patch: Partial<FlexState>, items: FlexState["items"]): FlexState => ({
  direction: "row",
  wrap: "nowrap",
  justify: "flex-start",
  alignItems: "stretch",
  alignContent: "normal",
  gap: 12,
  minHeight: 0,
  items,
  ...patch,
});

export const FLEX_RECIPES: Record<string, FlexState> = {
  "center-div": F({ justify: "center", alignItems: "center", minHeight: 240 }, [flexItem(1, "Centered")]),
  "navbar-space-between": F({ justify: "space-between", alignItems: "center" }, [flexItem(1, "Logo"), flexItem(2, "Menu"), flexItem(3, "Login")]),
  "sticky-footer": F({ direction: "column", minHeight: 260, gap: 0 }, [flexItem(1, "Header"), flexItem(2, "Main", { grow: 1 }), flexItem(3, "Footer")]),
  "holy-grail": F({ wrap: "wrap" }, [
    flexItem(1, "Header", { basis: "100%" }),
    flexItem(2, "Nav", { basis: "120px" }),
    flexItem(3, "Main", { grow: 1, shrink: 1, basis: "0%" }),
    flexItem(4, "Aside", { basis: "120px" }),
    flexItem(5, "Footer", { basis: "100%" }),
  ]),
  "equal-height-cards": F({}, [
    flexItem(1, "Short card", { grow: 1, shrink: 1, basis: "0%" }),
    flexItem(2, "A card with a lot more text that makes it taller", { grow: 1, shrink: 1, basis: "0%" }),
    flexItem(3, "Medium card text", { grow: 1, shrink: 1, basis: "0%" }),
  ]),
  "wrap-gallery": F({ wrap: "wrap" }, [1, 2, 3, 4, 5, 6, 7].map((n) => flexItem(n, String(n), { grow: 1, basis: "120px" }))),
  sidebar: F({}, [flexItem(1, "Sidebar", { basis: "180px", shrink: 0 }), flexItem(2, "Content", { grow: 1, shrink: 1, basis: "0%" })]),
  "push-last-right": F({ alignItems: "center" }, [flexItem(1, "Home"), flexItem(2, "Docs"), flexItem(3, "Blog"), flexItem(4, "Sign in", { push: true })]),
  "media-object": F({ alignItems: "flex-start", gap: 16 }, [flexItem(1, "Image", { basis: "64px", shrink: 0 }), flexItem(2, "Title and text next to the image", { grow: 1, shrink: 1, basis: "0%" })]),
  "input-group": F({ gap: 0 }, [flexItem(1, "Input", { grow: 1, shrink: 1, basis: "0%" }), flexItem(2, "Button", { shrink: 0 })]),
};

/* ───────────── grid recipes ───────────── */

const G = (patch: Partial<GridState>, items: GridState["items"]): GridState => ({
  columns: "",
  rows: "",
  gap: 12,
  areas: [],
  justifyItems: "stretch",
  alignItems: "stretch",
  items,
  ...patch,
});
const areas = (...rows: string[]) => rows.map((r) => r.trim().split(/\s+/));

export const GRID_RECIPES: Record<string, GridState> = {
  "12-column": G({ columns: "repeat(12, 1fr)" }, [
    gridItem(1, "span 8", { column: "span 8" }),
    gridItem(2, "span 4", { column: "span 4" }),
    gridItem(3, "span 6", { column: "span 6" }),
    gridItem(4, "span 6", { column: "span 6" }),
    gridItem(5, "span 4", { column: "span 4" }),
    gridItem(6, "span 4", { column: "span 4" }),
    gridItem(7, "span 4", { column: "span 4" }),
  ]),
  "auto-fit-cards": G({ columns: "repeat(auto-fit, minmax(160px, 1fr))" }, [1, 2, 3, 4, 5, 6].map((n) => gridItem(n, `Card ${n}`))),
  "holy-grail-areas": G({ columns: "140px 1fr 140px", rows: "auto 1fr auto", areas: areas("header header header", "nav main aside", "footer footer footer") }, [
    gridItem(1, "Header", { area: "header" }),
    gridItem(2, "Nav", { area: "nav" }),
    gridItem(3, "Main", { area: "main" }),
    gridItem(4, "Aside", { area: "aside" }),
    gridItem(5, "Footer", { area: "footer" }),
  ]),
  dashboard: G({ columns: "200px 1fr 1fr", rows: "auto 1fr 1fr", areas: areas("side top top", "side chart stats", "side table table") }, [
    gridItem(1, "Sidebar", { area: "side" }),
    gridItem(2, "Top bar", { area: "top" }),
    gridItem(3, "Chart", { area: "chart" }),
    gridItem(4, "Stats", { area: "stats" }),
    gridItem(5, "Table", { area: "table" }),
  ]),
  sidebar: G({ columns: "minmax(160px, 240px) 1fr" }, [gridItem(1, "Sidebar"), gridItem(2, "Content")]),
  "two-columns": G({ columns: "repeat(2, 1fr)" }, [1, 2, 3, 4].map((n) => gridItem(n, String(n)))),
  "three-columns": G({ columns: "repeat(3, 1fr)" }, [1, 2, 3, 4, 5, 6].map((n) => gridItem(n, String(n)))),
  "four-columns": G({ columns: "repeat(4, 1fr)" }, [1, 2, 3, 4, 5, 6, 7, 8].map((n) => gridItem(n, String(n)))),
  "full-bleed": G({ columns: "1fr min(60ch, 100% - 2rem) 1fr", gap: 8 }, [
    gridItem(1, "Text column", { column: "2" }),
    gridItem(2, "Full-bleed image", { column: "1 / -1" }),
    gridItem(3, "Text column", { column: "2" }),
  ]),
  bento: G({ columns: "repeat(4, 1fr)", rows: "repeat(3, 90px)" }, [
    gridItem(1, "Feature", { column: "span 2", row: "span 2" }),
    gridItem(2, "Stat", {}),
    gridItem(3, "Stat", {}),
    gridItem(4, "Wide", { column: "span 2" }),
    gridItem(5, "Tall", { row: "span 2" }),
    gridItem(6, "Note", { column: "span 2" }),
    gridItem(7, "Small", {}),
  ]),
  "pancake-stack": G({ rows: "auto 1fr auto", gap: 0 }, [gridItem(1, "Header"), gridItem(2, "Main"), gridItem(3, "Footer")]),
};

/* ───────────── labels of recipe items ───────────── */

const RU_LABELS: Record<string, string> = {
  Centered: "По центру",
  Logo: "Логотип",
  Menu: "Меню",
  Login: "Войти",
  Header: "Шапка",
  Main: "Контент",
  Footer: "Подвал",
  Nav: "Навигация",
  Aside: "Боковая колонка",
  "Short card": "Короткая карточка",
  "A card with a lot more text that makes it taller": "Карточка с гораздо более длинным текстом, из-за которого она выше",
  "Medium card text": "Карточка средней длины",
  Sidebar: "Сайдбар",
  Content: "Контент",
  Home: "Главная",
  Docs: "Документы",
  Blog: "Блог",
  "Sign in": "Войти",
  Image: "Фото",
  "Title and text next to the image": "Заголовок и текст рядом с картинкой",
  Input: "Поле ввода",
  Button: "Кнопка",
  "Top bar": "Верхняя панель",
  Chart: "График",
  Stats: "Показатели",
  Table: "Таблица",
  "Text column": "Колонка текста",
  "Full-bleed image": "Картинка на всю ширину",
  Feature: "Главное",
  Stat: "Цифра",
  Wide: "Широкий",
  Tall: "Высокий",
  Note: "Заметка",
  Small: "Малый",
};

export function localizeLabel(label: string, locale: "ru" | "en"): string {
  if (locale === "en") return label;
  return RU_LABELS[label] ?? label.replace(/^Card (\d+)$/, "Карточка $1");
}

export function flexRecipe(slug: string, locale: "ru" | "en"): FlexState {
  const r = FLEX_RECIPES[slug];
  return { ...r, items: r.items.map((it) => ({ ...it, label: localizeLabel(it.label, locale) })) };
}

export function gridRecipe(slug: string, locale: "ru" | "en"): GridState {
  const r = GRID_RECIPES[slug];
  return { ...r, items: r.items.map((it) => ({ ...it, label: localizeLabel(it.label, locale) })) };
}
