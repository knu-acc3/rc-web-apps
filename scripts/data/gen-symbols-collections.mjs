// Curated symbol collections for gen-symbols.mjs (not a generator itself: exports data only).
// `chars`  – every character shown in the collection grid and table (single code points).
// `pages`  – characters that get their own page /symbols/{collection}/{slug}; each character has a
//            page in at most one collection (its "home"), other collections link to that page.
// `pairs`  – letter collections: a page covers the lowercase and uppercase forms.
// Characters with default emoji presentation (😀 ♈ ⭐…) never get symbol pages: they link to /emoji.
// Invisible and look-alike characters are written as \u{…} escapes.

/** String of all assigned characters from `a` to `b` (inclusive). */
export const R = (a, b, skip = []) => {
  let s = "";
  for (let c = a; c <= b; c++) if (!skip.includes(c)) s += String.fromCodePoint(c);
  return s;
};

const SPACES =
  "\u{20}\u{A0}\u{2002}\u{2003}\u{2004}\u{2005}\u{2006}\u{2007}\u{2008}\u{2009}\u{200A}\u{202F}\u{205F}\u{3000}\u{1680}\u{2000}\u{2001}" +
  "\u{200B}\u{200C}\u{200D}\u{2060}\u{FEFF}\u{AD}\u{34F}\u{180E}\u{2028}\u{2029}\u{2800}\u{3164}\u{115F}\u{1160}\u{FFA0}";
const SPACE_PAGES = "\u{A0}\u{2002}\u{2003}\u{2009}\u{202F}\u{3000}\u{200B}\u{200C}\u{200D}\u{2060}\u{FEFF}\u{AD}\u{2800}\u{3164}";
// Kelvin, Angstrom, micro and ohm signs look exactly like K, Å, μ and Ω.
const KELVIN = "\u{212A}";
const ANGSTROM = "\u{212B}";
const MICRO = "\u{B5}";
const OHM = "\u{2126}";

export const COLLECTIONS = [
  { id: "hearts", chars: "♥♡❤❥❣❦❧☙ღ🎔💓💔💕💖💗💘💙💚💛💜💝💞💟🖤🤍🤎🧡🩷🩵🩶", pages: "♥♡❤❥❣❦❧☙ღ" },
  { id: "stars", chars: "★☆✦✧✩✪✫✬✭✮✯✰⋆✶✷✸✹✺⍟⚝⛤⛥⛦⛧⭑⭒✡✴✳❂⁂🟉🟊🟋🟌🟍🟎🟏🟐🟑🟒🟓🟔⭐🌟✨💫🌠", pages: "★☆✦✧✩✪✫✬✭✮✯✰✶⛤" },
  { id: "asterisks", chars: "*⁎⁑⁂∗✱✲✳✴✵✶✷✸✹✺✻✼✽✾❃❉❊❋✢✣✤✥٭⚹🞯🞰🞱🞲🞳🞴", pages: "⁎⁑∗✱✲✻✽٭" },
  {
    id: "arrows",
    chars: R(0x2190, 0x21ff) + R(0x27f0, 0x27ff) + R(0x2794, 0x27be, [0x27b0]) + R(0x2934, 0x2935) + R(0x2b00, 0x2b11) + R(0x2b60, 0x2b69),
    pages: "←↑→↓↔↕↖↗↘↙⇐⇑⇒⇓⇔↩↪↺↻⟶⟹➔➜➤➡⬅⬆⬇⇄↵",
  },
  { id: "check-marks", chars: "✓✔☑✅🗸🗹☐☒🗷⮽✗✘❌❎√⍻🗴🗵🗶", pages: "✓✔☑☐☒✗✘" },
  { id: "crosses", chars: "✕✖✗✘❌❎☓⨯×⤫⤬🗙⊗⨂✝✞✟✠✙✚✛✜☦☨☩†‡⸸☥", pages: "✕✖☓✝✞✟✠☦☨☩✚" },
  { id: "bullets", chars: "•◦‣⁃⁌⁍∙⋅·○●◘◙▪▫■□►▸▹➢❖◆◇⦿⦾⁕※⚫⚪⭑⁎⁑🞄⸰", pages: "•◦‣⁃∙▪▫⦿" },
  {
    id: "math",
    chars:
      "+−×÷=≠≈≡<>≤≥±∓√∛∜∞∑∏∐∫∬∭∮∯∂∇∆∈∉∋∌∅∀∃∄∧∨¬⊻∩∪⊂⊃⊆⊇⊄⊅⊊⊋⊕⊖⊗⊘⊙⊥∥∦∠∡∢∟⊾⊿∴∵∶∷∝∼≃≅≇≉≐≔≜≝≟≢≣≦≧≪≫≮≯≰≱≲≳⊢⊣⊤⊨⋀⋁⋂⋃⋄⋅⋆⋯⋮⋰⋱ℵℶℏℕℤℚℝℂℙ∗∘∙⌈⌉⌊⌋⟨⟩′″‴∤∣∔∸⨀⨁⨂⨉ϖ",
    pages: "−×÷≠≈≡≤≥±√∛∞∑∏∫∮∂∇∆∈∉∅∀∃∧∨¬∩∪⊂⊃⊆⊕⊗⊥∥∠∴∵∝≅≪≫ℕℤℚℝ⌊⌈∘⋯",
  },
  {
    id: "greek",
    chars: R(0x391, 0x3a1) + R(0x3a3, 0x3a9) + R(0x3b1, 0x3c9) + "ϐϑϕϖϰϱϵ",
    pages: R(0x3b1, 0x3c1) + R(0x3c3, 0x3c9),
    pairs: true,
  },
  {
    id: "currency",
    chars: "$¢£¤¥" + R(0x20a0, 0x20c0) + "֏؋৳฿៛﷼",
    pages: "$¢£¥€₽₸₴₿₹₩₺₼₾₪₫₱₦₮⃀¤฿₭₲₡֏₣₤",
  },
  { id: "fractions", chars: "½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒↉⅟⁄", pages: "½⅓⅔¼¾⅕⅙⅛⅜⅝⅞⅐⅑⅒⁄" },
  {
    id: "superscript",
    chars: "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱᵃᵇᶜᵈᵉᶠᵍʰʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻᴬᴮᴰᴱᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿᵀᵁⱽᵂᵅᵝᵞᵟᵋᶿᵠᵡ",
    pages: "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ",
  },
  { id: "subscript", chars: "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₔₕₖₗₘₙₚₛₜᵢᵣᵤᵥⱼᵦᵧᵨᵩᵪ", pages: "₀₁₂₃₄₅₆₇₈₉" },
  { id: "roman-numerals", chars: R(0x2160, 0x2188), pages: "ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫⅬⅭⅮⅯ" },
  {
    id: "circled-numbers",
    chars: "⓪" + R(0x2460, 0x2473) + R(0x3251, 0x325f) + R(0x32b1, 0x32bf) + "⓿" + R(0x2776, 0x277f) + R(0x24eb, 0x24f4) + R(0x2780, 0x2793) + R(0x24f5, 0x24fe) + R(0x2474, 0x249b),
    pages: "⓪①②③④⑤⑥⑦⑧⑨⑩❶",
  },
  { id: "circled-letters", chars: R(0x24b6, 0x24e9) + R(0x249c, 0x24b5) + R(0x1f130, 0x1f149) + R(0x1f150, 0x1f169) + R(0x1f170, 0x1f189), pages: "" },
  { id: "digits", chars: R(0xff10, 0xff19) + R(0x1d7ce, 0x1d7ff), pages: "" },
  { id: "zodiac", chars: R(0x2648, 0x2653) + "⛎", pages: "" },
  { id: "astrology", chars: "☉☽☾☿♀♁♂♃♄♅♆♇⛢☊☋☌☍⚳⚴⚵⚶⚷⚸" + R(0x2648, 0x2653), pages: "☉☽☾☿♁♃♄♅♆♇☊☋" },
  { id: "chess", chars: R(0x2654, 0x265f), pages: R(0x2654, 0x265f) },
  { id: "cards", chars: R(0x2660, 0x2667) + R(0x1f0a1, 0x1f0ae) + R(0x1f0b1, 0x1f0be) + R(0x1f0c1, 0x1f0ce) + R(0x1f0d1, 0x1f0df) + "🂠🃏", pages: "♠♣♦♤♧♢" },
  { id: "dice", chars: "⚀⚁⚂⚃⚄⚅⚆⚇⚈⚉⛀⛁⛂⛃🎲", pages: "⚀⚁⚂⚃⚄⚅" },
  { id: "music", chars: "♩♪♫♬♭♮♯𝄀𝄁𝄂𝄃𝄆𝄇𝄋𝄌𝄐𝄑𝄒𝄓𝄔𝄕𝄞𝄟𝄠𝄡𝄢𝄪𝄫𝄻𝄼𝄽𝄾𝄿𝅀𝅁𝅜𝅝", pages: "♩♪♫♬♭♮♯𝄞𝄢𝄐" },
  { id: "weather", chars: "☀☁☂☃☄☼☽☾⛅⛆⛈⛄❄❅❆☔⚡☇☈⛇🌡🌢🌣🌤🌥🌦🌧🌨🌩🌪🌫🌬🌈°℃℉", pages: "☀☁☂☃☄☼❄❅❆" },
  {
    id: "brackets",
    chars: "()[]{}⟨⟩⟦⟧⟪⟫⟬⟭⟮⟯⌈⌉⌊⌋⦃⦄⦅⦆⦇⦈⦉⦊⦋⦌⦍⦎⦏⦐⦑⦒⦓⦔⦕⦖⦗⦘〈〉《》「」『』【】〔〕〖〗〘〙〚〛❨❩❪❫❬❭❮❯❰❱❲❳❴❵⁅⁆⸢⸣⸤⸥⸨⸩",
    pages: "【】「」『』《》⟦⟧",
  },
  { id: "quotes", chars: "\"'«»‹›“”„‟‘’‚‛❛❜❝❞〝〞〟＂⹂🙶🙷🙸", pages: "«»“”„‘’‚‹›" },
  {
    id: "punctuation",
    chars: "!?¡¿‽⸘…‼⁇⁈⁉·‧※⁂¶§†‡‰‱′″‴⁗‸⁁⁊⸮؟،;:,.⁓⸗⁘⁙⁚⁛⁜⁝⁞‖¦|¨´`^~˜¸@&#%/\\",
    pages: "¡¿‽…‼⁉·※⁂†‡‖¦⸮",
  },
  { id: "dashes", chars: "-‐‑‒–—―⁃−⸺⸻﹘﹣－_‾‿⁀⁔⁓〜〰ˉ¯‗", pages: "‐‑‒–—―⸻‾¯" },
  { id: "spaces", chars: SPACES, pages: SPACE_PAGES },
  { id: "lines", chars: R(0x2500, 0x257f), pages: "─│┌┐└┘┼═║╔╗╬" },
  { id: "blocks", chars: R(0x2580, 0x259f), pages: "█▀▄░▒▓" },
  {
    id: "squares",
    chars: "■□▢▣▤▥▦▧▨▩▪▫▬▭▮▯◧◨◩◪◫◰◱◲◳◻◼◽◾⬛⬜⬒⬓⬔⬕❏❐❑❒⧈⊞⊟⊠⊡⬚🞌🞍⯀",
    pages: "■□▢▣◻◼❏❐▬▭",
  },
  { id: "circles", chars: "○◌◍◎●◐◑◒◓◔◕◖◗◯◴◵◶◷⚪⚫⦿⊙⊚⊛⭕⬤⚬❍⭘◉⚆⚇⚈⚉⏺🔴🔵🟠🟡🟢🟣🟤", pages: "○●◎◌◯◐◑⬤◉" },
  {
    id: "triangles",
    chars: "▲△▴▵▶▷▸▹►▻▼▽▾▿◀◁◂◃◄◅◢◣◤◥◬◭◮◸◹◺◿⊿⟁⧊⧋🔺🔻🞀🞁🞂🞃",
    pages: "▲△▼▽▶▷◀◁►◄▸◢",
  },
  { id: "geometric", chars: R(0x25a0, 0x25ff) + "⬟⬠⬡⬢⬣⬥⬦⬧⬨⬩⬪⬫⬬⬭⬮⬯⟐⌬⎔", pages: "◆◇◈◊⬟⬡" },
  {
    id: "keyboard",
    chars: "⌘⌥⇧⌃⎋⌫⌦⏎↵⇥⇤⇪⏏⌤⌧⌨⎇⏻⏼⏽⭘⏾⇞⇟⎈⎉⎊⎄⎌␣⎵␡␈␛⏩⏪⏫⏬⏭⏮⏯⏸⏹⏺🖮🖱",
    pages: "⌘⌥⇧⌃⎋⌫⌦⏎⇥⇪⏏⌨⏻⎇␣",
  },
  { id: "technical", chars: "⌀⌁⌂⌄⌅⌆⌇⌐⌑⌒⌓⌔⌕⌖⌗⌙⌠⌡⌢⌣⌬⌭⌮⌯⌰⌱⌲⌳⌶⍝⍟⎍⎎⎏⎐⎑⎒⎓⎔⎕⎗⎘⎙⎚⏚⏛⏣⏥⏦⏧⏨⌚⌛⏰⏱⏲⏳", pages: "⌀⌂⌐⌒⌖⏚" },
  {
    id: "units",
    chars: `°℃℉${KELVIN}${ANGSTROM}${MICRO}${OHM}℧ℓ№‰‱℮㎎㎏㎍㎜㎝㎞㎟㎠㎡㎢㎣㎤㎥㎦㏄㎖㎗㎘㎐㎑㎒㎓㎾㎿㏀㏁㎳㎲㎱㏈㏑㏒㎈㎉㎅㎆㎇`,
    pages: `°℃℉№${MICRO}${OHM}ℓ℮${KELVIN}${ANGSTROM}‰‱㎡㎥㎏㎞`,
  },
  { id: "legal", chars: "©®™℗℠🄯§¶⁋℡℻℀℁℅℆⅍", pages: "©®™℗℠🄯§¶℅" },
  { id: "gender", chars: "♀♂⚢⚣⚤⚥⚦⚧⚨⚩⚲⚭⚮⚯", pages: "♀♂⚢⚣⚤⚥⚧⚲⚭" },
  { id: "religious", chars: "✝✞✟✠☦☧☨☩☪☫☬☮☯☸✡✙✚✛✜🕉☥۞⛩🕎🛐⸸🔯", pages: "☧☪☬☮☯☸✡☥۞" },
  { id: "flowers", chars: "✿❀❁✾❃❋✽✼❊❉✻❈❇⚘❦❧☙✤✥⚜❖ꕤꕥ✺⁕❂💮🏵🌸🌺", pages: "✿❀❁✾❃❋⚘⚜ꕥ" },
  { id: "dingbats", chars: R(0x2700, 0x27bf), pages: "✁✂✄✆✈✉✍✎✏✒❢" },
  { id: "braille", chars: R(0x2800, 0x28ff), pages: "⣿⠿" },
  {
    id: "latin",
    chars: R(0xc0, 0xd6) + R(0xd8, 0xf6) + R(0xf8, 0xff) + R(0x100, 0x17f) + "ẞ",
    pages: "ßæøœðþıłñçü",
    pairs: true,
  },
  {
    id: "cyrillic",
    chars: "ЁёЇїҐґЄєІіЎўЂђЃѓЅѕЈјЉљЊњЋћЌќЏџѢѣѲѳѴѵѪѫѦѧѠѡѮѯѰѱӀӁӂӔӕҖҗҘҙҠҡҢңҪҫҲҳҴҵҶҷҺһӘәӚӛӜӝӞӟӢӣӤӥӦӧӨөӪӫӬӭӮӯӰӱӲӳӴӵӸӹ",
    pages: "ёїґєўђјљњћџѣѳѵѫѧ",
    pairs: true,
  },
  { id: "kazakh", chars: "ӘәҒғҚқҢңӨөҰұҮүҺһІі", pages: "әғқңөұүһі", pairs: true },
  { id: "ipa", chars: R(0x250, 0x2af) + "ʰʷʲˈˌːˑθðŋçøœæ", pages: "əʃʒŋɛɔʊɪʌʔˈː" },
  { id: "small-caps", chars: "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘꞯʀꜱᴛᴜᴠᴡʏᴢ", pages: "" },
  { id: "smileys", chars: "☺☻☹ツッヅ㋡ಠಥʘ◕◔◡‿ᴥᵔᵕωﾟ益ლᕕᕗ୧୨ʕʔง︶︿﹏", pages: "☺☻☹ツಠლ" },
  { id: "hands", chars: "☚☛☜☝☞☟✌✍🖎🖏🖐🖑🖒🖓🖔🖕🖖👆👇👈👉✋✊👍👎👌", pages: "☚☛☜☝☞☟" },
  { id: "letterlike", chars: R(0x2100, 0x214f), pages: "ℏ℘ℜℑ⅋℞" },
  { id: "warning", chars: "⚠☢☣☠⚡⛔⛌⛍⛒⛐🛇☡⚐⚑⚿⛝⛞⚕⚛☤⚚", pages: "⚠☢☣☠☡⚐⚑⚕⚛☤" },
  { id: "objects", chars: "☎☏✆♨♻♲♳♴♵♶♷♸♹♺♼♽♾⚒⚔⚖⚗⚙⛓⛏⚓⚘⚰⚱⛨⛫⛭⛮⛯⛶☕⌛⏳✈✉✂✏✒☂", pages: "☎☏♨♻♲♾⚒⚔⚖⚗⚙⛓⛏" },
  {
    id: "decorative",
    chars: "꧁꧂༺༻⊱⊰୨୧ʚɞ꒰꒱⟡♱✧⋆˚｡ﾟ⊹❖◈♡✿❀ꕥ❥ღ☾☽ᯓ⌗⸝˖ᰔ✞⸸☥︵︶︹︺⏝⏜",
    pages: "꧁꧂༺༻⊱⊰ʚɞ⟡♱",
  },
];
