/**
 * The famous internet kaomoji and their established variants.
 * Combining marks are written as \u escapes so the exact code points are unambiguous:
 *   \u0361 COMBINING DOUBLE INVERTED BREVE, \u035C COMBINING DOUBLE BREVE BELOW,
 *   \u0360 COMBINING DOUBLE TILDE, \u035F COMBINING DOUBLE MACRON BELOW,
 *   \u032F COMBINING INVERTED BREVE BELOW, \u0CBF / \u0CC3 Kannada vowel signs.
 */

/** The canonical forms (tested for exact code points). */
export const SHRUG = "¯\\_(ツ)_/¯";
export const LENNY = "( \u0361° \u035Cʖ \u0361°)";
export const TABLE_FLIP = "(╯°□°)╯︵ ┻━┻";
export const TABLE_BACK = "┬─┬ノ( º _ ºノ)";
export const DISAPPROVAL = "ಠ_ಠ";

export const FAMOUS: Record<string, readonly string[]> = {
  shrug: [
    SHRUG,
    "┐(´ー｀)┌",
    "┐(￣ヘ￣)┌",
    "ヽ(ー_ー)ノ",
    "┐( ˘_˘ )┌",
    "¯\\_(ಠ_ಠ)_/¯",
    "¯\\(°_o)/¯",
    "┐(︶▽︶)┌",
    "ヽ(´ー｀)┌",
    "┐(´∀｀)┌",
    "╮(︶▽︶)╭",
    "╮(￣ω￣;)╭",
    "¯\\_( \u0361° \u035Cʖ \u0361°)_/¯",
    "┐(￣∀￣)┌",
    "╮(╯_╰)╭",
    "┐(´～｀)┌",
    "ヽ(￣～￣)ノ",
    "乁(ツ)ㄏ",
  ],
  "table-flip": [
    TABLE_FLIP,
    "┻━┻ ︵ヽ(`Д´)ﾉ︵ ┻━┻",
    TABLE_BACK,
    "(ノಠ益ಠ)ノ彡┻━┻",
    "(╯°Д°)╯︵ /(.□ . \\)",
    "┬─┬ ノ( ゜-゜ノ)",
    "(┛ಠ_ಠ)┛彡┻━┻",
    "(ノ°Д°)ノ︵ ┻━┻",
    "┻━┻ ︵ ¯\\(ツ)/¯ ︵ ┻━┻",
    "(╯ರ ~ ರ)╯︵ ┻━┻",
    "┬──┬◡ﾉ(° -°ﾉ)",
    "(╯°□°)╯︵ ┻━┻ ︵ ╯(°□° ╯)",
    "(ﾉ≧∇≦)ﾉ ﾐ ┸━┸",
    "(ノ｀Д´)ノ彡┻━┻",
    "(╯‵□′)╯︵┻━┻",
    "ʕノ•ᴥ•ʔノ ︵ ┻━┻",
    "(ノ^_^)ノ┻━┻ ┬─┬ ノ( ^_^ノ)",
    "┻━┻ミ＼(≧ロ≦＼)",
    "(ヘ･_･)ヘ┳━┳",
  ],
  "lenny-face": [
    LENNY,
    "( \u0361~ \u035Cʖ \u0361°)",
    "( \u0360° \u035Fʖ \u0361°)",
    "( \u0361ʘ \u035Cʖ \u0361ʘ)",
    "( \u0361° ʖ\u032F \u0361°)",
    "( \u0361ᵔ \u035Cʖ \u0361ᵔ )",
    "( \u0361°( \u0361° \u035Cʖ( \u0361° \u035Cʖ \u0361°)ʖ \u0361°) \u0361°)",
    "( \u0361≖ \u035Cʖ \u0361≖)",
    "ᕦ( \u0361° \u035Cʖ \u0361°)ᕤ",
    "(つ \u0361° \u035Cʖ \u0361°)つ",
    "( \u0361° \u035Cʖ \u0361°)ﾉ⌐■-■",
    "(ಥ \u035Cʖಥ)",
    "( \u0361◉ \u035Cʖ \u0361◉)",
    "(☞ \u0361° \u035Cʖ \u0361°)☞",
    "( \u0361ಠ ʖ\u032F \u0361ಠ)",
    "( \u0361• \u035Cʖ \u0361• )",
  ],
  disapproval: [
    DISAPPROVAL,
    "ಠ益ಠ",
    "ಠ~ಠ",
    "ಠ╭╮ಠ",
    "(ಠ_ಠ)",
    "ಠ_ರ\u0CC3",
    "ლ(ಠ_ಠ ლ)",
    "ಠ‿ಠ",
    "(¬_¬)",
    "(눈_눈)",
    "(¬､¬)",
    "(ಠ︹ಠ)",
    "(-_-)",
    "ಠ\u0CBF_ಠ",
    "ಠ_ಥ",
    "( ´_ゝ`)",
  ],
};
