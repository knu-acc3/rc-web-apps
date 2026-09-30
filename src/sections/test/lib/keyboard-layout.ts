/**
 * Full-size ANSI keyboard geometry (in key units, 1u = one letter key) with
 * US QWERTY and Russian ЙЦУКЕН labels. Keys are identified by KeyboardEvent.code,
 * which names the physical key regardless of the active layout.
 */

export interface KeyDef {
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Label on a US QWERTY keyboard. */
  en: string;
  /** Russian ЙЦУКЕН letter (only where it differs from the Latin one). */
  ru?: string;
  /** Long label (modifiers, named keys) — rendered in a smaller font. */
  named?: boolean;
}

type Item = string | [code: string, w?: number, h?: number] | { gap: number } | { at: number };

const EN: Record<string, string> = {
  Escape: "Esc",
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  Backspace: "Backspace",
  Tab: "Tab",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  CapsLock: "Caps Lock",
  Semicolon: ";",
  Quote: "'",
  Enter: "Enter",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
  Comma: ",",
  Period: ".",
  Slash: "/",
  ControlLeft: "Ctrl",
  ControlRight: "Ctrl",
  MetaLeft: "Win ⌘",
  MetaRight: "Win ⌘",
  AltLeft: "Alt",
  AltRight: "Alt",
  Space: "Space",
  ContextMenu: "Menu",
  PrintScreen: "PrtSc",
  ScrollLock: "ScrLk",
  Pause: "Pause",
  Insert: "Ins",
  Home: "Home",
  PageUp: "PgUp",
  Delete: "Del",
  End: "End",
  PageDown: "PgDn",
  ArrowUp: "↑",
  ArrowLeft: "←",
  ArrowDown: "↓",
  ArrowRight: "→",
  NumLock: "Num",
  NumpadDivide: "/",
  NumpadMultiply: "*",
  NumpadSubtract: "−",
  NumpadAdd: "+",
  NumpadEnter: "Enter",
  NumpadDecimal: ".",
};

const RU: Record<string, string> = {
  Backquote: "Ё",
  KeyQ: "Й",
  KeyW: "Ц",
  KeyE: "У",
  KeyR: "К",
  KeyT: "Е",
  KeyY: "Н",
  KeyU: "Г",
  KeyI: "Ш",
  KeyO: "Щ",
  KeyP: "З",
  BracketLeft: "Х",
  BracketRight: "Ъ",
  KeyA: "Ф",
  KeyS: "Ы",
  KeyD: "В",
  KeyF: "А",
  KeyG: "П",
  KeyH: "Р",
  KeyJ: "О",
  KeyK: "Л",
  KeyL: "Д",
  Semicolon: "Ж",
  Quote: "Э",
  KeyZ: "Я",
  KeyX: "Ч",
  KeyC: "С",
  KeyV: "М",
  KeyB: "И",
  KeyN: "Т",
  KeyM: "Ь",
  Comma: "Б",
  Period: "Ю",
  Slash: ".",
};

const letters = (s: string) => s.split("").map((c) => `Key${c}`);
const digits = "1234567890".split("").map((d) => `Digit${d}`);

const ROWS: { y: number; items: Item[] }[] = [
  {
    y: 0,
    items: [
      "Escape",
      { gap: 1 },
      "F1", "F2", "F3", "F4",
      { gap: 0.5 },
      "F5", "F6", "F7", "F8",
      { gap: 0.5 },
      "F9", "F10", "F11", "F12",
      { at: 15.5 },
      "PrintScreen", "ScrollLock", "Pause",
    ],
  },
  {
    y: 1.5,
    items: [
      "Backquote", ...digits, "Minus", "Equal", ["Backspace", 2],
      { at: 15.5 },
      "Insert", "Home", "PageUp",
      { at: 19 },
      "NumLock", "NumpadDivide", "NumpadMultiply", "NumpadSubtract",
    ],
  },
  {
    y: 2.5,
    items: [
      ["Tab", 1.5], ...letters("QWERTYUIOP"), "BracketLeft", "BracketRight", ["Backslash", 1.5],
      { at: 15.5 },
      "Delete", "End", "PageDown",
      { at: 19 },
      "Numpad7", "Numpad8", "Numpad9", ["NumpadAdd", 1, 2],
    ],
  },
  {
    y: 3.5,
    items: [
      ["CapsLock", 1.75], ...letters("ASDFGHJKL"), "Semicolon", "Quote", ["Enter", 2.25],
      { at: 19 },
      "Numpad4", "Numpad5", "Numpad6",
    ],
  },
  {
    y: 4.5,
    items: [
      ["ShiftLeft", 2.25], ...letters("ZXCVBNM"), "Comma", "Period", "Slash", ["ShiftRight", 2.75],
      { at: 16.5 },
      "ArrowUp",
      { at: 19 },
      "Numpad1", "Numpad2", "Numpad3", ["NumpadEnter", 1, 2],
    ],
  },
  {
    y: 5.5,
    items: [
      ["ControlLeft", 1.25], ["MetaLeft", 1.25], ["AltLeft", 1.25], ["Space", 6.25], ["AltRight", 1.25], ["MetaRight", 1.25], ["ContextMenu", 1.25], ["ControlRight", 1.25],
      { at: 15.5 },
      "ArrowLeft", "ArrowDown", "ArrowRight",
      { at: 19 },
      ["Numpad0", 2], "NumpadDecimal",
    ],
  },
];

function labelFor(code: string): { en: string; named: boolean } {
  if (EN[code]) return { en: EN[code], named: EN[code].length > 2 };
  if (code.startsWith("Key")) return { en: code.slice(3), named: false };
  if (code.startsWith("Digit")) return { en: code.slice(5), named: false };
  if (code.startsWith("Numpad")) return { en: code.slice(6), named: false };
  return { en: code, named: code.length > 2 };
}

function build(): KeyDef[] {
  const out: KeyDef[] = [];
  for (const row of ROWS) {
    let x = 0;
    for (const it of row.items) {
      if (typeof it === "object" && !Array.isArray(it)) {
        if ("gap" in it) x += it.gap;
        else x = it.at;
        continue;
      }
      const [code, w = 1, h = 1] = typeof it === "string" ? [it] : it;
      const { en, named } = labelFor(code);
      out.push({ code, x, y: row.y, w, h, en, ru: RU[code], named });
      x += w;
    }
  }
  return out;
}

export const KEYBOARD: readonly KeyDef[] = build();
export const KEYBOARD_WIDTH = 23;
export const KEYBOARD_HEIGHT = 6.5;
export const KEYBOARD_CODES: ReadonlySet<string> = new Set(KEYBOARD.map((k) => k.code));

/** Keys that scroll or navigate the page; blocked only while the test area has focus and no modifier is held. */
export const NAV_KEYS: ReadonlySet<string> = new Set([
  " ",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "Backspace",
  "/",
  "'",
  "F1",
  "F3",
  "F6",
  "F7",
  "F10",
  "ContextMenu",
]);

/** KeyboardEvent.location names. */
export const KEY_LOCATIONS = ["standard", "left", "right", "numpad"] as const;
