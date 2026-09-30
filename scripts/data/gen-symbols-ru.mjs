// Rule-based Russian names for regular families of Unicode character names (used by gen-symbols.mjs).
// Every rule returns null when it does not fully understand a name, so the caller can fall back to
// the hand-written dictionary (gen-symbols-names.mjs) or CLDR.

const NUM = {
  ZERO: 0, ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9, TEN: 10, ELEVEN: 11, TWELVE: 12,
  THIRTEEN: 13, FOURTEEN: 14, FIFTEEN: 15, SIXTEEN: 16, SEVENTEEN: 17, EIGHTEEN: 18, NINETEEN: 19, TWENTY: 20, THIRTY: 30, FORTY: 40, FIFTY: 50,
};
/** "TWENTY ONE" → 21 */
function num(words) {
  const w = words.trim().split(/\s+/);
  if (!w.every((x) => x in NUM)) return null;
  return w.reduce((s, x) => s + NUM[x], 0);
}

export const GREEK = {
  ALPHA: "альфа", BETA: "бета", GAMMA: "гамма", DELTA: "дельта", EPSILON: "эпсилон", ZETA: "дзета", ETA: "эта", THETA: "тета",
  IOTA: "йота", KAPPA: "каппа", LAMDA: "лямбда", LAMBDA: "лямбда", MU: "мю", NU: "ню", XI: "кси", OMICRON: "омикрон", PI: "пи", RHO: "ро",
  SIGMA: "сигма", "FINAL SIGMA": "конечная сигма", TAU: "тау", UPSILON: "ипсилон", PHI: "фи", CHI: "хи", PSI: "пси", OMEGA: "омега",
};

const CASE = { CAPITAL: "заглавная", SMALL: "строчная" };

/** Letters with their own names instead of a Latin letter. */
const LATIN_SPECIAL = {
  AE: "лигатура æ (эш)", "SHARP S": "эсцет", ETH: "эт", THORN: "торн", "DOTLESS I": "i без точки", "DOTLESS J": "j без точки", KRA: "кра", ENG: "энг",
  "LONG S": "длинная s", SCHWA: "шва", ESH: "эш", EZH: "эж", GAMMA: "гамма", IOTA: "йота", UPSILON: "ипсилон", PHI: "фи", ALPHA: "альфа",
  OMEGA: "омега", "CLOSED OMEGA": "закрытая омега", "RAMS HORN": "«бараний рог»", LEZH: "лёж", HENG: "хенг", OE: "лигатура œ", IJ: "лигатура ij",
  "BARRED O": "перечёркнутая o", "U BAR": "перечёркнутая u", "SQUAT REVERSED ESH": "приземистая зеркальная эш", "DZ DIGRAPH": "диграф dz",
  "DEZH DIGRAPH": "диграф dʒ", "TS DIGRAPH": "диграф ts", "TESH DIGRAPH": "диграф tʃ", "FENG DIGRAPH": "диграф fŋ", "LS DIGRAPH": "диграф ls",
  "LZ DIGRAPH": "диграф lz", "TC DIGRAPH": "диграф tɕ", "BETA": "бета", "CHI": "хи", "RHO": "ро", "SCRIPT G": "рукописная g",
};
const LATIN_ADJ = {
  TURNED: "перевёрнутая", REVERSED: "зеркальная", OPEN: "открытая", CLOSED: "закрытая", SCRIPT: "рукописная", SQUAT: "приземистая",
  INVERTED: "перевёрнутая", STRETCHED: "растянутая", BARRED: "перечёркнутая", DOTLESS: "без точки",
};
const WITH = {
  GRAVE: "грависом", ACUTE: "акутом", CIRCUMFLEX: "циркумфлексом", TILDE: "тильдой", DIAERESIS: "умлаутом", "RING ABOVE": "кружком",
  CEDILLA: "седилью", CARON: "гачеком", MACRON: "макроном", BREVE: "бреве", OGONEK: "огонэком", "DOT ABOVE": "точкой сверху", STROKE: "чертой",
  "DOUBLE ACUTE": "двойным акутом", "MIDDLE DOT": "точкой посередине", HOOK: "крюком", "RETROFLEX HOOK": "ретрофлексным крюком", TAIL: "хвостом",
  CURL: "завитком", BELT: "поясом", "MIDDLE TILDE": "тильдой посередине", "LONG LEG": "длинной ножкой", FISHHOOK: "крючком",
  "LEFT HOOK": "левым крюком", "CROSSED-TAIL": "перекрещённым хвостом", "COMMA BELOW": "запятой снизу", "DOT BELOW": "точкой снизу",
  "HOOK TOP": "крюком сверху", "PALATAL HOOK": "палатальным крюком",
};
function withPhrase(s) {
  const parts = s.split(" AND ");
  const out = parts.map((p) => WITH[p]);
  return out.every(Boolean) ? `с ${out.join(" и ")}` : null;
}

/** LATIN (CAPITAL|SMALL) LETTER X [WITH Y], LATIN LETTER SMALL CAPITAL X, ligatures. */
function latin(name) {
  let m = /^LATIN (CAPITAL|SMALL) (LETTER|LIGATURE) (.+)$/.exec(name);
  let kase = "";
  let rest;
  let smallCap = false;
  if (m) {
    kase = CASE[m[1]];
    rest = m[3];
  } else if ((m = /^LATIN LETTER SMALL CAPITAL (.+)$/.exec(name))) {
    smallCap = true;
    rest = m[1];
  } else return null;
  let post = "";
  const w = / WITH (.+)$/.exec(rest);
  if (w) {
    post = withPhrase(w[1]);
    if (!post) return null;
    rest = rest.slice(0, w.index);
  }
  const adjs = [];
  let base;
  for (;;) {
    if (LATIN_SPECIAL[rest]) {
      base = LATIN_SPECIAL[rest];
      break;
    }
    if (/^[A-Z]$/.test(rest)) {
      base = kase === "заглавная" || smallCap ? rest : rest.toLowerCase();
      break;
    }
    const sp = rest.indexOf(" ");
    const first = sp < 0 ? rest : rest.slice(0, sp);
    if (!LATIN_ADJ[first] || sp < 0) return null;
    adjs.push(LATIN_ADJ[first]);
    rest = rest.slice(sp + 1);
  }
  const note = adjs.length ? ` (${adjs.join(", ")})` : "";
  const tail = `${note}${post ? ` ${post}` : ""}`;
  const digraph = /^диграф /.exec(base);
  if (digraph) return `латинский ${kase === "заглавная" ? "заглавный" : "строчный"} ${base}${tail}`;
  if (/^лигатура /.test(base)) return `латинская ${kase} ${base}${tail}`;
  return `латинская ${smallCap ? "капительная" : kase} буква ${base}${tail}`;
}

function greek(name) {
  let m = /^GREEK (CAPITAL|SMALL) LETTER (.+)$/.exec(name);
  if (m && GREEK[m[2]]) return `греческая ${CASE[m[1]]} буква ${GREEK[m[2]]}`;
  m = /^GREEK (.+) SYMBOL$/.exec(name);
  if (m && GREEK[m[1]]) return `${GREEK[m[1]]}, вариант начертания`;
  if (name === "GREEK LUNATE EPSILON SYMBOL") return "лунный эпсилон";
  return null;
}

/* ── numbers and letters in circles, brackets, squares ── */
const ENCL = [
  [/^DINGBAT NEGATIVE CIRCLED SANS-SERIF (DIGIT|NUMBER) (.+)$/, "в чёрном кружке (без засечек)"],
  [/^DINGBAT CIRCLED SANS-SERIF (DIGIT|NUMBER) (.+)$/, "в кружке (без засечек)"],
  [/^DINGBAT NEGATIVE CIRCLED (DIGIT|NUMBER) (.+)$/, "в чёрном кружке"],
  [/^NEGATIVE CIRCLED (DIGIT|NUMBER) (.+)$/, "в чёрном кружке"],
  [/^DOUBLE CIRCLED (DIGIT|NUMBER) (.+)$/, "в двойном кружке"],
  [/^CIRCLED (DIGIT|NUMBER) (.+)$/, "в кружке"],
  [/^PARENTHESIZED (DIGIT|NUMBER) (.+)$/, "в скобках"],
];
function enclosedNumber(name) {
  for (const [re, where] of ENCL) {
    const m = re.exec(name);
    if (m) {
      const n = num(m[2]);
      if (n === null) return null;
      return `${n < 10 ? "цифра" : "число"} ${n} ${where}`;
    }
  }
  const m = /^(DIGIT|NUMBER) (.+) FULL STOP$/.exec(name);
  if (m) {
    const n = num(m[2]);
    return n === null ? null : `${n < 10 ? "цифра" : "число"} ${n} с точкой`;
  }
  return null;
}

const ENCL_LETTER = [
  [/^NEGATIVE CIRCLED LATIN CAPITAL LETTER ([A-Z])$/, "в чёрном кружке"],
  [/^NEGATIVE SQUARED LATIN CAPITAL LETTER ([A-Z])$/, "в чёрном квадрате"],
  [/^SQUARED LATIN CAPITAL LETTER ([A-Z])$/, "в квадрате"],
  [/^CIRCLED LATIN (CAPITAL|SMALL) LETTER ([A-Z])$/, "в кружке"],
  [/^PARENTHESIZED LATIN (CAPITAL|SMALL) LETTER ([A-Z])$/, "в скобках"],
];
function enclosedLetter(name) {
  for (const [re, where] of ENCL_LETTER) {
    const m = re.exec(name);
    if (!m) continue;
    const small = m[1] === "SMALL";
    const letter = m[m.length - 1];
    return `латинская ${small ? "строчная" : "заглавная"} буква ${small ? letter.toLowerCase() : letter} ${where}`;
  }
  return null;
}

const DIGIT_STYLE = {
  FULLWIDTH: "полноширинная",
  "MATHEMATICAL BOLD": "жирная",
  "MATHEMATICAL DOUBLE-STRUCK": "ажурная (двойная)",
  "MATHEMATICAL SANS-SERIF": "рубленая (без засечек)",
  "MATHEMATICAL SANS-SERIF BOLD": "жирная рубленая",
  "MATHEMATICAL MONOSPACE": "моноширинная",
};
function styledDigit(name) {
  const m = /^(.+) DIGIT (\w+)$/.exec(name);
  if (!m || !DIGIT_STYLE[m[1]] || !(m[2] in NUM)) return null;
  return `${DIGIT_STYLE[m[1]]} цифра ${NUM[m[2]]}`;
}

const SIGN = {
  "PLUS SIGN": ["плюс", "m"], MINUS: ["минус", "m"], "EQUALS SIGN": ["знак равенства", "m"], "LEFT PARENTHESIS": ["открывающая скобка", "f"],
  "RIGHT PARENTHESIS": ["закрывающая скобка", "f"],
};
function scripts(name) {
  let m = /^(SUPERSCRIPT|SUBSCRIPT) (.+)$/.exec(name);
  if (m) {
    const sup = m[1] === "SUPERSCRIPT";
    if (m[2] in NUM) return `${sup ? "надстрочная" : "подстрочная"} цифра ${NUM[m[2]]}`;
    if (SIGN[m[2]]) {
      const [w, g] = SIGN[m[2]];
      const adj = sup ? (g === "m" ? "надстрочный" : "надстрочная") : g === "m" ? "подстрочный" : "подстрочная";
      return `${adj} ${w}`;
    }
    const l = /^LATIN SMALL LETTER ([A-Z])$/.exec(m[2]);
    if (l) return `${sup ? "надстрочная" : "подстрочная"} латинская буква ${l[1].toLowerCase()}`;
    return null;
  }
  m = /^(LATIN|GREEK) SUBSCRIPT SMALL LETTER (.+)$/.exec(name);
  if (m) {
    if (m[1] === "GREEK") return GREEK[m[2]] ? `подстрочная греческая буква ${GREEK[m[2]]}` : null;
    if (/^[A-Z]$/.test(m[2])) return `подстрочная латинская буква ${m[2].toLowerCase()}`;
    if (m[2] === "SCHWA") return "подстрочная шва";
    return null;
  }
  m = /^MODIFIER LETTER (CAPITAL|SMALL) (.+)$/.exec(name);
  if (m) {
    const cap = m[1] === "CAPITAL";
    let rest = m[2].replace(/^GREEK /, "");
    if (/^[A-Z]$/.test(rest)) return `надстрочная латинская ${cap ? "заглавная " : ""}буква ${cap ? rest : rest.toLowerCase()}`;
    if (GREEK[rest]) return `надстрочная греческая буква ${GREEK[rest]}`;
    if (rest === "OPEN E") return "надстрочная открытая e";
    rest = LATIN_SPECIAL[rest];
    return rest ? `надстрочная ${rest}` : null;
  }
  return null;
}

function roman(name) {
  const m = /^(SMALL )?ROMAN NUMERAL (.+)$/.exec(name);
  if (!m) return null;
  const words = m[2];
  const map = { "ONE HUNDRED": 100, "FIVE HUNDRED": 500, "ONE THOUSAND": 1000 };
  const n = map[words] ?? num(words);
  if (n === null || n === undefined) return null;
  return `${m[1] ? "строчная " : ""}римская цифра ${n}`;
}

function braille(name) {
  if (name === "BRAILLE PATTERN BLANK") return "пустая ячейка шрифта Брайля";
  const m = /^BRAILLE PATTERN DOTS-(\d+)$/.exec(name);
  return m ? `шрифт Брайля, ${m[1].length === 1 ? "точка" : "точки"} ${m[1].split("").join("-")}` : null;
}

const BOX = {
  LIGHT: "тонкая", HEAVY: "жирная", DOUBLE: "двойная", SINGLE: "одинарная", HORIZONTAL: "горизонталь", VERTICAL: "вертикаль", DOWN: "вниз",
  UP: "вверх", LEFT: "влево", RIGHT: "вправо", AND: "и", ARC: "дуга", DIAGONAL: "диагональ", CROSS: "крест", "DOUBLE DASH": "пунктир в 2 штриха",
  "TRIPLE DASH": "пунктир в 3 штриха", "QUADRUPLE DASH": "пунктир в 4 штриха", "UPPER LEFT TO LOWER RIGHT": "сверху слева вниз направо",
  "UPPER RIGHT TO LOWER LEFT": "сверху справа вниз налево",
};
function box(name) {
  const m = /^BOX DRAWINGS (.+)$/.exec(name);
  if (!m) return null;
  let s = m[1];
  const out = [];
  const keys = Object.keys(BOX).sort((a, b) => b.length - a.length);
  while (s) {
    const k = keys.find((x) => s === x || s.startsWith(`${x} `));
    if (!k) return null;
    out.push(BOX[k]);
    s = s.slice(k.length).trim();
  }
  const dash = out.find((x) => x.startsWith("пунктир"));
  const words = out.filter((x) => x !== dash);
  return `псевдографика: ${words.join(" ")}${dash ? `, ${dash}` : ""}`;
}

const RANKS = { ACE: "туз", TWO: "двойка", THREE: "тройка", FOUR: "четвёрка", FIVE: "пятёрка", SIX: "шестёрка", SEVEN: "семёрка", EIGHT: "восьмёрка", NINE: "девятка", TEN: "десятка", JACK: "валет", KNIGHT: "рыцарь", QUEEN: "дама", KING: "король" };
const SUITS = { SPADES: "пик", HEARTS: "червей", DIAMONDS: "бубен", CLUBS: "треф" };
function card(name) {
  const m = /^PLAYING CARD (\w+) OF (\w+)$/.exec(name);
  if (m && RANKS[m[1]] && SUITS[m[2]]) return `игральная карта: ${RANKS[m[1]]} ${SUITS[m[2]]}`;
  if (name === "PLAYING CARD BACK") return "рубашка игральной карты";
  return null;
}

/* ── arrows ── */
const DIRS = [
  ["LEFT RIGHT", "влево-вправо"], ["UP DOWN", "вверх-вниз"], ["NORTH EAST", "вправо-вверх"], ["NORTH WEST", "влево-вверх"], ["SOUTH EAST", "вправо-вниз"],
  ["SOUTH WEST", "влево-вниз"], ["LEFTWARDS", "влево"], ["RIGHTWARDS", "вправо"], ["UPWARDS", "вверх"], ["DOWNWARDS", "вниз"], ["LEFT", "влево"],
  ["RIGHT", "вправо"], ["UP", "вверх"], ["DOWN", "вниз"], ["ANTICLOCKWISE", "против часовой стрелки"], ["CLOCKWISE", "по часовой стрелке"],
];
const ARROW_ADJ = {
  HEAVY: "жирная", LONG: "длинная", BLACK: "чёрная", WHITE: "белая", DOUBLE: "двойная", TRIPLE: "тройная", QUADRUPLE: "четверная", DASHED: "пунктирная",
  CURVED: "изогнутая", SQUAT: "приземистая", "DRAFTING POINT": "чертёжная", "OPEN-OUTLINED": "контурная", "THREE-D TOP-LIGHTED": "объёмная",
  "THREE-D BOTTOM-LIGHTED": "объёмная затенённая", SQUIGGLE: "волнистая", "GAPPED CIRCLE": "круговая разомкнутая", THREE: "три", PAIRED: "парные",
  "BACK-TILTED SHADOWED WHITE": "белая наклонённая назад с тенью", "FRONT-TILTED SHADOWED WHITE": "белая наклонённая вперёд с тенью",
  "RIGHT-SHADED WHITE": "белая с тенью справа", "LEFT-SHADED WHITE": "белая с тенью слева", "LOWER RIGHT-SHADOWED WHITE": "белая с тенью снизу справа",
  "UPPER RIGHT-SHADOWED WHITE": "белая с тенью сверху справа", NOTCHED: "с вырезом", CIRCLED: "в кружке", "CONCAVE-POINTED": "с вогнутым концом",
};
const ARROW_POST = {
  "TRIANGLE-HEADED": "с треугольным наконечником", "WIDE-HEADED": "с широким наконечником", "ROUND-TIPPED": "с закруглённым концом",
  "OPEN-HEADED": "с открытым наконечником", "WHITE-FEATHERED": "с белым оперением", "BLACK-FEATHERED": "с чёрным оперением",
  "TEARDROP-BARBED": "с каплевидным наконечником", "TEARDROP-SHANKED": "с каплевидным древком", "WEDGE-TAILED": "с клиновидным хвостом",
  "WITH HOOK": "с крючком", "WITH TIP DOWNWARDS": "с поворотом вниз", "WITH TIP UPWARDS": "с поворотом вверх", "FROM BAR": "от черты", "TO BAR": "к черте",
  "FROM WALL": "от стены", "TO CORNER": "к углу", "ON PEDESTAL": "на подставке", "WITH VERTICAL STROKE": "с вертикальной чертой",
  "WITH DOUBLE VERTICAL STROKE": "с двойной вертикальной чертой", "WITH SMALL CIRCLE": "с кружком", "WITH CIRCLED PLUS": "с плюсом в кружке",
  "THEN CURVING UPWARDS": "с поворотом вверх", "THEN CURVING DOWNWARDS": "с поворотом вниз", "WITH HORIZONTAL BAR": "с горизонтальной чертой",
  POINTING: "",
};
function arrow(name) {
  const hm = /\b(ARROWHEAD|ARROWS|ARROW)\b/.exec(name);
  if (!hm) return null;
  const head = hm[1] === "ARROWHEAD" ? "наконечник стрелки" : hm[1] === "ARROWS" ? "стрелки" : "стрелка";
  let s = ` ${name.replace(hm[0], " ")} `.replace(/\s+/g, " ");
  let dir = "";
  for (const [en, ru] of DIRS) {
    if (s.includes(` ${en} `)) {
      dir = ru;
      s = s.replace(` ${en} `, " ");
      break;
    }
  }
  const adjs = [];
  const posts = [];
  const take = (map, into) => {
    for (const k of Object.keys(map).sort((a, b) => b.length - a.length)) {
      if (s.includes(` ${k} `)) {
        if (map[k]) into.push(map[k]);
        s = s.replace(` ${k} `, " ");
        return true;
      }
    }
    return false;
  };
  while (s.trim()) {
    if (take(ARROW_POST, posts)) continue;
    if (take(ARROW_ADJ, adjs)) continue;
    if (/^ AND /.test(s) || s.trim() === "AND") {
      s = s.replace(" AND ", " ");
      continue;
    }
    return null;
  }
  const adjFix = head === "наконечник стрелки" ? adjs.map((a) => a.replace(/ая$/, "ый").replace(/яя$/, "ий")) : head === "стрелки" ? adjs.map((a) => a.replace(/ая$/, "ые")) : adjs;
  return [...adjFix, head, dir, ...posts].filter(Boolean).join(" ").replace(/\s+/g, " ");
}

const RULES = [braille, box, roman, enclosedNumber, enclosedLetter, styledDigit, scripts, card, greek, latin, arrow];

/** Russian name derived from the Unicode name, or null. */
export function patternRu(name) {
  for (const r of RULES) {
    const v = r(name);
    if (v) return v;
  }
  return null;
}
