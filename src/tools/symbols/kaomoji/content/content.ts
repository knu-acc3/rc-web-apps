import type { L10n, Locale } from "@/i18n/config";
import type { QA } from "@/registry/types";

/** Page texts of a category (server only — not imported by the client component). */
interface CategoryContent {
  /** Main search phrase = h1. */
  h1: L10n;
  /** RU: follows "N японских смайликов …"; EN: adjective before "kaomoji". */
  topic: L10n;
  /** Hand-written questions specific to the category. */
  qa: Record<Locale, QA[]>;
  /** Full title/description for the famous ones (otherwise generated). */
  title?: L10n;
  description?: L10n;
  lead?: L10n;
}

const q = (ru: [string, string][], en: [string, string][]): Record<Locale, QA[]> => ({
  ru: ru.map(([q, a]) => ({ q, a })),
  en: en.map(([q, a]) => ({ q, a })),
});

export const CONTENT: Record<string, CategoryContent> = {
  joy: {
    h1: { ru: "Каомодзи радость", en: "Happy kaomoji" },
    topic: { ru: "про радость и счастье", en: "happy" },
    qa: q(
      [["Как сделать радостный каомодзи самому?", "Возьмите скобки как контур лица, для глаз — ^, ◕ или ≧ ≦, для рта — ▽, ω или ‿. Например, (^▽^) или (◕‿◕). Руки добавляют движение: ヽ(・∀・)ﾉ поднимает их от радости."]],
      [["How do I make my own happy kaomoji?", "Use brackets for the face outline, ^, ◕ or ≧ ≦ for the eyes and ▽, ω or ‿ for the mouth — e.g. (^▽^) or (◕‿◕). Add arms such as ヽ and ﾉ for a cheering pose: ヽ(・∀・)ﾉ."]],
    ),
  },
  love: {
    h1: { ru: "Каомодзи любовь", en: "Love kaomoji" },
    topic: { ru: "про любовь и нежность", en: "love" },
    qa: q(
      [["Какой каомодзи отправить, чтобы признаться в симпатии?", "Подойдут смайлики с сердечками: (♡°▽°♡), (｡♥‿♥｡) или ( ˘⌣˘)♡(˘⌣˘ ) — два лица рядом. Если хочется мягче, выберите (´｡• ᵕ •｡`) ♡ — он скорее про нежность, чем про страсть."]],
      [["Which kaomoji should I send to show I like someone?", "Hearts do the talking: (♡°▽°♡), (｡♥‿♥｡) or ( ˘⌣˘)♡(˘⌣˘ ), two faces side by side. For something softer, (´｡• ᵕ •｡`) ♡ reads as tender rather than intense."]],
    ),
  },
  excited: {
    h1: { ru: "Каомодзи восторг", en: "Excited kaomoji" },
    topic: { ru: "про восторг и ликование", en: "excited" },
    qa: q(
      [["Чем восторг отличается от простой радости?", "В восторженных каомодзи тело в движении: руки подняты — ＼(＾▽＾)／, фигурка трясётся — (((o(*ﾟ▽ﾟ*)o))), глаза сияют звёздами — (☆▽☆). Радостные смайлики спокойнее и чаще состоят из одного лица."]],
      [["What's the difference between excited and happy kaomoji?", "Excited ones move: arms up in ＼(＾▽＾)／, shaking in (((o(*ﾟ▽ﾟ*)o))), starry eyes in (☆▽☆). Happy kaomoji are calmer and usually just a smiling face."]],
    ),
  },
  sad: {
    h1: { ru: "Грустные каомодзи", en: "Sad kaomoji" },
    topic: { ru: "про грусть и печаль", en: "sad" },
    qa: q(
      [["Что значит orz?", "Это человечек, стоящий на коленях и упёршийся руками в пол: o — голова, r — руки, z — ноги. Так в японском интернете показывают отчаяние или поражение; _|￣|○ рисует ту же позу."]],
      [["What does orz mean?", "It is a person on their knees with hands on the floor: o is the head, r the arms and z the legs. In Japanese internet slang it shows despair or defeat; _|￣|○ draws the same pose."]],
    ),
  },
  crying: {
    h1: { ru: "Плачущие каомодзи", en: "Crying kaomoji" },
    topic: { ru: "со слезами", en: "crying" },
    qa: q(
      [["Чем (T_T) отличается от (ಥ﹏ಥ)?", "(T_T) — классический плачущий смайлик: каждая T — глаз с потоком слёз. (ಥ﹏ಥ) выразительнее: буквы каннада изображают глаза, полные слёз, а волнистая ﹏ — дрожащие губы."]],
      [["What's the difference between (T_T) and (ಥ﹏ಥ)?", "(T_T) is the classic crying face: each T is an eye with a stream of tears. (ಥ﹏ಥ) is more dramatic — Kannada letters form eyes brimming with tears and the wavy ﹏ is a trembling mouth."]],
    ),
  },
  angry: {
    h1: { ru: "Злые каомодзи", en: "Angry kaomoji" },
    topic: { ru: "про злость и гнев", en: "angry" },
    qa: q(
      [["Почему в злых каомодзи встречаются 益 и 皿?", "Иероглифы 益 и 皿 («тарелка») похожи на оскаленный рот со стиснутыми зубами, а Д — на рот, открытый в крике. Знак ╬ рисует вздувшуюся вену — манга-символ злости."]],
      [["Why do angry kaomoji use characters like 益 and 皿?", "The kanji 益 and 皿 (dish) look like a mouth with gritted teeth, while Д is a mouth wide open in a shout. The ╬ sign is the throbbing anger vein from manga."]],
    ),
  },
  surprised: {
    h1: { ru: "Каомодзи удивление", en: "Surprised kaomoji" },
    topic: { ru: "про удивление и шок", en: "surprised" },
    qa: q(
      [["Что означает Σ перед каомодзи?", "Греческая Σ рисует резкое движение — будто человек вздрогнул или отшатнулся: Σ(°△°|||). Вертикальные черты ||| — побледнение от шока, приём из манги."]],
      [["What does the Σ in front of a kaomoji mean?", "The Greek Σ draws a sudden jolt, as if the person flinched back: Σ(°△°|||). The ||| lines are the manga way of showing someone turning pale from shock."]],
    ),
  },
  shy: {
    h1: { ru: "Смущённые каомодзи", en: "Shy kaomoji" },
    topic: { ru: "со смущением и румянцем", en: "shy" },
    qa: q(
      [["Как в каомодзи показывают румянец?", "Символами на месте щёк: 〃, //, * или # — (〃▽〃), (//▽//), (#^.^#). Другой приём — ладони у лица: (*/ω＼) прячет глаза, а |ω・) выглядывает из-за стены."]],
      [["How do kaomoji show blushing?", "With marks where the cheeks are: 〃, //, * or # — (〃▽〃), (//▽//), (#^.^#). Another trick is hands over the face: (*/ω＼) hides the eyes, and |ω・) peeks from behind a wall."]],
    ),
  },
  embarrassed: {
    h1: { ru: "Каомодзи неловкость", en: "Embarrassed kaomoji" },
    topic: { ru: "про неловкость и нервную улыбку", en: "embarrassed" },
    qa: q(
      [["Что означает точка с запятой в (^_^;)?", "Это капля пота на виске — манга-символ неловкости или нервной улыбки: «ой, неудобно вышло». То же значат ٥ в (¯―¯٥) и ゞ — рука, почёсывающая затылок."]],
      [["What does the semicolon in (^_^;) mean?", "It's a sweat drop on the temple, the manga sign for awkwardness or a nervous smile — \"oops, that's awkward\". The ٥ in (¯―¯٥) and the ゞ hand scratching the head mean the same."]],
    ),
  },
  confused: {
    h1: { ru: "Каомодзи растерянность", en: "Confused kaomoji" },
    topic: { ru: "про растерянность и недоумение", en: "confused" },
    qa: q(
      [["Что значит (o_O)?", "Один глаз широко раскрыт, другой обычный — так изображают недоумение: «что это сейчас было?». Похожий смысл у (⊙_◎) и (゜-゜)."]],
      [["What does (o_O) mean?", "One eye wide open and the other normal — the look of disbelief, \"wait, what?\". (⊙_◎) and (゜-゜) carry the same meaning."]],
    ),
  },
  thinking: {
    h1: { ru: "Задумчивые каомодзи", en: "Thinking kaomoji" },
    topic: { ru: "про раздумья и идеи", en: "thinking" },
    qa: q(
      [["Что значит .｡oO после каомодзи?", "Это облачко мыслей, как в комиксах: кружочки растут от маленького ｡ к большому O. (￣ー￣).｡oO — персонаж о чём-то мечтает или прикидывает."]],
      [["What does .｡oO after a kaomoji mean?", "It is a comic-style thought bubble: circles grow from a tiny ｡ to a big O. (￣ー￣).｡oO is someone daydreaming or mulling something over."]],
    ),
  },
  tired: {
    h1: { ru: "Уставшие каомодзи", en: "Tired kaomoji" },
    topic: { ru: "про усталость и лень", en: "tired" },
    qa: q(
      [["Что изображает _(:3 」∠)_?", "Человечка, который лежит на полу без сил: (:3 — голова, 」 — рука, ∠ — согнутые ноги, а _ по краям — пол. Его ставят, когда сил не осталось ни на что."]],
      [["What is _(:3 」∠)_?", "A person collapsed on the floor: (:3 is the head, 」 an arm, ∠ bent legs and the underscores are the floor. People post it when they have no energy left."]],
    ),
  },
  sleep: {
    h1: { ru: "Спящие каомодзи", en: "Sleeping kaomoji" },
    topic: { ru: "про сон", en: "sleeping" },
    qa: q(
      [["Как показать, что каомодзи спит?", "Добавьте храп — zzZ или Zzz — к лицу с закрытыми глазами: (－_－) zzZ. Есть и сценки: (¦3[▓▓] — человечек под одеялом, [(－－)]..zzZ — в кровати."]],
      [["How do you show a sleeping kaomoji?", "Add snoring — zzZ or Zzz — to a face with closed eyes: (－_－) zzZ. There are little scenes too: (¦3[▓▓] is someone under a blanket and [(－－)]..zzZ is lying in bed."]],
    ),
  },
  cool: {
    h1: { ru: "Крутые каомодзи", en: "Cool kaomoji" },
    topic: { ru: "в тёмных очках и с жестом «класс»", en: "cool" },
    qa: q(
      [["Что значит (•_•) ( •_•)>⌐■-■ (⌐■_■)?", "Это мини-сценка «deal with it»: персонаж достаёт тёмные очки и надевает их. Так отвечают с нарочитой невозмутимостью — «вот так вот»."]],
      [["What does (•_•) ( •_•)>⌐■-■ (⌐■_■) mean?", "It is the \"deal with it\" mini-scene: the character pulls out sunglasses and puts them on — a smug, unbothered reply."]],
    ),
  },
  evil: {
    h1: { ru: "Каомодзи злодей", en: "Evil kaomoji" },
    topic: { ru: "с коварной ухмылкой", en: "evil" },
    qa: q(
      [["Что за символы ψ по бокам лица?", "Греческая буква пси похожа на вилы, поэтому ψ(｀∇´)ψ — чертёнок. Нахмуренные брови ｀ и ´ добавляют коварства, а (￣ー￣)ニヤリ — это японское «ухмыльнулся»."]],
      [["What are the ψ symbols around the face?", "The Greek letter psi looks like a pitchfork, so ψ(｀∇´)ψ is a little devil. The slanted brows ｀ and ´ make it look scheming, and ニヤリ in (￣ー￣)ニヤリ is Japanese for a sly grin."]],
    ),
  },
  dead: {
    h1: { ru: "Каомодзи в нокауте", en: "Dead kaomoji" },
    topic: { ru: "с крестиками вместо глаз", en: "dead" },
    qa: q(
      [["Что значат крестики вместо глаз?", "Глаза-крестики — (x_x), (×﹏×) — мультяшный знак нокаута или обморока. В переписке это шутливое «я умер»: от смеха, усталости или сложной задачи."]],
      [["What do X eyes mean in kaomoji?", "X eyes — (x_x), (×﹏×) — are the cartoon sign for being knocked out. In chats it's a joking \"I'm dead\": from laughter, exhaustion or a brutal task."]],
    ),
  },
  shrug: {
    h1: { ru: "Смайлик пожимает плечами ¯\\_(ツ)_/¯", en: "Shrug emoticon ¯\\_(ツ)_/¯" },
    topic: { ru: "пожимающих плечами", en: "shrug" },
    title: { ru: "Смайлик пожимает плечами ¯\\_(ツ)_/¯ — скопировать", en: "Shrug emoticon ¯\\_(ツ)_/¯ — copy and paste" },
    description: {
      ru: "¯\\_(ツ)_/¯ и ещё {n}: ┐(´ー｀)┌, ╮(︶▽︶)╭ и другие. Почему в Discord пропадает рука, как её вернуть и из каких символов состоит смайлик.",
      en: "¯\\_(ツ)_/¯ plus {n}: ┐(´ー｀)┌, ╮(︶▽︶)╭ and more. Why the arm disappears in Discord, how to fix it and which characters make up the shrug.",
    },
    lead: { ru: "¯\\_(ツ)_/¯ — «не знаю, ну и ладно». Нажмите, чтобы скопировать.", en: "¯\\_(ツ)_/¯ — \"I don't know, whatever\". Click to copy it." },
    qa: q(
      [
        ["Что означает ¯\\_(ツ)_/¯?", "Пожимание плечами: «не знаю», «ну и ладно», «что поделать». Лицо — японская катакана ツ («цу»), руки — макроны ¯, косые черты и подчёркивания."],
        ["Почему в Discord пропадает левая рука у ¯\\_(ツ)_/¯?", "В Markdown обратная косая черта экранирует следующий символ: \\_ превращается в обычное подчёркивание, и сама черта исчезает. Чтобы смайлик отобразился целиком, напишите ¯\\\\\\_(ツ)\\_/¯ или воспользуйтесь встроенной командой /shrug в Discord. Кнопка на этой странице копирует смайлик без экранирования."],
      ],
      [
        ["What does ¯\\_(ツ)_/¯ mean?", "A shrug: \"I don't know\", \"whatever\", \"oh well\". The face is the Japanese katakana ツ (tsu); the arms are macrons ¯, slashes and underscores."],
        ["Why does the left arm of ¯\\_(ツ)_/¯ disappear in Discord?", "In Markdown a backslash escapes the next character, so \\_ becomes a plain underscore and the backslash itself vanishes. Type ¯\\\\\\_(ツ)\\_/¯ to get the full shrug, or use Discord's built-in /shrug command. The copy button here copies the plain, unescaped kaomoji."],
      ],
    ),
  },
  "table-flip": {
    h1: { ru: "Переворот стола (╯°□°)╯︵ ┻━┻", en: "Table flip (╯°□°)╯︵ ┻━┻" },
    topic: { ru: "с переворотом стола", en: "table flip" },
    title: { ru: "Переворот стола (╯°□°)╯︵ ┻━┻ — скопировать смайлик", en: "Table flip (╯°□°)╯︵ ┻━┻ — copy and paste" },
    description: {
      ru: "(╯°□°)╯︵ ┻━┻ и ещё {n}: двойной переворот, мишка и ┬─┬ノ( º _ ºノ), чтобы вернуть стол на место. Все символы с кодами Юникода.",
      en: "(╯°□°)╯︵ ┻━┻ plus {n}: double flips, a bear flip and ┬─┬ノ( º _ ºノ) to put the table back. Every character with its Unicode code point.",
    },
    lead: { ru: "(╯°□°)╯︵ ┻━┻ — переворот стола от злости. Нажмите, чтобы скопировать.", en: "(╯°□°)╯︵ ┻━┻ — flipping a table in rage. Click to copy it." },
    qa: q(
      [
        ["Что означает (╯°□°)╯︵ ┻━┻?", "Человечек в ярости переворачивает стол — так выражают крайнее, чаще шутливое, раздражение. В Японии этот жест называют «тябудай-гаэси» — опрокинуть низкий обеденный столик."],
        ["Как вернуть стол на место?", "Ответом служит ┬─┬ノ( º _ ºノ): человечек аккуратно ставит стол обратно — «успокойся». В Discord есть встроенные команды /tableflip и /unflip, которые добавляют эти смайлики к сообщению."],
      ],
      [
        ["What does (╯°□°)╯︵ ┻━┻ mean?", "A furious little person flipping a table — extreme, usually playful, frustration. In Japan the gesture is called chabudai-gaeshi, overturning a low dining table."],
        ["How do I put the table back?", "Reply with ┬─┬ノ( º _ ºノ): someone calmly sets the table back down — \"calm down\". Discord has built-in /tableflip and /unflip commands that append these kaomoji to your message."],
      ],
    ),
  },
  "lenny-face": {
    h1: { ru: "Ленни фейс ( \u0361° \u035Cʖ \u0361°)", en: "Lenny face ( \u0361° \u035Cʖ \u0361°)" },
    topic: { ru: "в стиле Ленни", en: "Lenny" },
    title: { ru: "Ленни фейс ( \u0361° \u035Cʖ \u0361°) — скопировать", en: "Lenny face ( \u0361° \u035Cʖ \u0361°) copy and paste" },
    description: {
      ru: "( \u0361° \u035Cʖ \u0361°) и ещё {n}: подмигивающий, грустный, армия Ленни. Откуда взялся Lenny face и из каких символов Юникода он состоит.",
      en: "( \u0361° \u035Cʖ \u0361°) plus {n}: winking, sad, the Lenny army. Where the Lenny face came from and which Unicode characters build it.",
    },
    lead: { ru: "( \u0361° \u035Cʖ \u0361°) — хитрая двусмысленная ухмылка. Нажмите, чтобы скопировать.", en: "( \u0361° \u035Cʖ \u0361°) — a sly, suggestive smirk. Click to copy it." },
    qa: q(
      [
        ["Откуда взялся Ленни фейс?", "Смайлик ( \u0361° \u035Cʖ \u0361°) появился на имиджборде 4chan в 2012 году и быстро разошёлся по форумам, Reddit и Twitch-чатам. Имя Lenny закрепилось за ним в интернет-сообществе; означает он хитрую, двусмысленную ухмылку."],
        ["Почему Ленни фейс выглядит по-разному на разных устройствах?", "Брови и линия улыбки — комбинируемые знаки U+0361 и U+035C: у них нет собственной ширины, они «садятся» на соседний символ. Каждый шрифт размещает их по-своему, поэтому смайлик слегка меняется от устройства к устройству."],
      ],
      [
        ["Where does the Lenny face come from?", "( \u0361° \u035Cʖ \u0361°) first appeared on the 4chan imageboard in 2012 and quickly spread to forums, Reddit and Twitch chat. The name Lenny stuck to it in internet culture; it stands for a sly, suggestive smirk."],
        ["Why does the Lenny face look different on different devices?", "The brows and the smile line are the combining marks U+0361 and U+035C: they have no width of their own and sit on the neighbouring character. Every font positions them slightly differently, so the face shifts from device to device."],
      ],
    ),
  },
  disapproval: {
    h1: { ru: "Взгляд неодобрения ಠ_ಠ", en: "Look of disapproval ಠ_ಠ" },
    topic: { ru: "с неодобрением", en: "disapproval" },
    title: { ru: "Взгляд неодобрения ಠ_ಠ — скопировать каомодзи", en: "Look of disapproval ಠ_ಠ — copy and paste" },
    description: {
      ru: "ಠ_ಠ и ещё {n}: ಠ益ಠ, ಠ_ರ\u0CC3 с моноклем, (¬_¬). Что за буква ಠ (U+0CA0, письменность каннада) и когда отправлять этот взгляд.",
      en: "ಠ_ಠ plus {n}: ಠ益ಠ, the monocle ಠ_ರ\u0CC3, (¬_¬). What the letter ಠ is (U+0CA0, Kannada script) and when to send the look.",
    },
    lead: { ru: "ಠ_ಠ — молчаливое «серьёзно?». Нажмите, чтобы скопировать.", en: "ಠ_ಠ — a silent \"seriously?\". Click to copy it." },
    qa: q(
      [
        ["Что это за символ ಠ?", "Это буква «ттха» (U+0CA0) письменности каннада, на которой пишут в индийском штате Карнатака. В интернете две такие буквы стали глазами «взгляда неодобрения» ಠ_ಠ."],
        ["Когда отправлять ಠ_ಠ?", "Когда собеседник сказал или сделал что-то сомнительное: это молчаливое «серьёзно?». ಠ益ಠ злее, ಠ‿ಠ — с ехидной улыбкой, а ლ(ಠ_ಠ ლ) — «ну почему?!»."],
      ],
      [
        ["What is the ಠ character?", "It is the letter TTHA (U+0CA0) of the Kannada script, used in the Indian state of Karnataka. Online, two of them became the eyes of the \"look of disapproval\" ಠ_ಠ."],
        ["When should I send ಠ_ಠ?", "When someone says or does something questionable — it's a silent \"seriously?\". ಠ益ಠ is angrier, ಠ‿ಠ adds a sly smile and ლ(ಠ_ಠ ლ) says \"but why?!\"."],
      ],
    ),
  },
  cat: {
    h1: { ru: "Каомодзи кот", en: "Cat kaomoji" },
    topic: { ru: "с котиками", en: "cat" },
    qa: q(
      [["Почему у котиков-каомодзи есть знаки = и ω?", "Знаки = по бокам — усы, ^ — уши, а греческая ω напоминает кошачий рот: (=^･ω･^=). Лапки рисуют тайской буквой ฅ: ฅ^•ﻌ•^ฅ."]],
      [["Why do cat kaomoji use = and ω?", "The = signs are whiskers, ^ are ears and the Greek ω looks like a cat's mouth: (=^･ω･^=). Paws are drawn with the Thai letter ฅ: ฅ^•ﻌ•^ฅ."]],
    ),
  },
  dog: {
    h1: { ru: "Каомодзи собака", en: "Dog kaomoji" },
    topic: { ru: "с собачками", en: "dog" },
    qa: q(
      [["Как отличить каомодзи-собачку от котика?", "У собачки висячие уши: ∪ или U по бокам — ∪･ω･∪, U・ᴥ・U, а ▼ — у остроухих. Нос часто рисуют буквой ᴥ, а ʋ с краю — виляющий хвост."]],
      [["How can you tell a dog kaomoji from a cat?", "Dogs have floppy ears: ∪ or U on the sides — ∪･ω･∪, U・ᴥ・U — and ▼ for pointy-eared breeds. The snout is often ᴥ, and a ʋ at the edge is a wagging tail."]],
    ),
  },
  bear: {
    h1: { ru: "Каомодзи медведь", en: "Bear kaomoji" },
    topic: { ru: "с медведями", en: "bear" },
    qa: q(
      [["Из каких символов сделан мишка ʕ•ᴥ•ʔ?", "Уши — буквы международного фонетического алфавита ʕ и ʔ, глаза — точки •, мордочка — фонетическая буква ᴥ. В японском варианте нос рисуют катаканой: (´(ｴ)｀)."]],
      [["What characters make up the bear ʕ•ᴥ•ʔ?", "The ears are the IPA letters ʕ and ʔ, the eyes are bullets • and the snout is the phonetic letter ᴥ. The Japanese-style bear uses katakana for the nose: (´(ｴ)｀)."]],
    ),
  },
  bunny: {
    h1: { ru: "Каомодзи зайчик", en: "Bunny kaomoji" },
    topic: { ru: "с зайчиками", en: "bunny" },
    qa: q(
      [["Как нарисовать зайчика символами?", "Длинные уши — широкие косые черты ／ и ＼ по бокам лица, рот — буква x: ／(^ x ^)＼. Меняя глаза, меняете настроение: ／(T x T)＼ плачет, ／(-x-)＼ дремлет."]],
      [["How do you draw a bunny with symbols?", "Long ears are the fullwidth slashes ／ and ＼ around the face and the mouth is an x: ／(^ x ^)＼. Swap the eyes to change the mood: ／(T x T)＼ cries, ／(-x-)＼ dozes."]],
    ),
  },
  bird: {
    h1: { ru: "Каомодзи птичка", en: "Bird kaomoji" },
    topic: { ru: "с птичками", en: "bird" },
    qa: q(
      [["Какие символы изображают клюв?", "Чаще всего греческая Θ или θ и кириллическая ө: (・Θ・), (・ө・). Крылья дают ʚ и ɞ — ʚ(•Θ•)ɞ, а v посередине превращает лицо в сову: (OvO)."]],
      [["Which characters draw a beak?", "Usually the Greek Θ or θ and the Cyrillic ө: (・Θ・), (・ө・). Wings come from ʚ and ɞ — ʚ(•Θ•)ɞ — and a v in the middle turns the face into an owl: (OvO)."]],
    ),
  },
  pig: {
    h1: { ru: "Каомодзи свинка", en: "Pig kaomoji" },
    topic: { ru: "со свинками", en: "pig" },
    qa: q(
      [["Как сделать свинку из символов?", "Главное — пятачок (oo) или (00) посередине лица: (￣(oo)￣). Остальное как у обычных каомодзи: ^ для радости, T для слёз, > < для зажмуренных глаз."]],
      [["How do you make a pig kaomoji?", "The key is the (oo) or (00) snout in the middle of the face: (￣(oo)￣). The rest works like any kaomoji — ^ for joy, T for tears, > < for squeezed eyes."]],
    ),
  },
  hug: {
    h1: { ru: "Каомодзи обнимашки", en: "Hug kaomoji" },
    topic: { ru: "с объятиями", en: "hug" },
    qa: q(
      [["Какие символы изображают руки для объятий?", "Руки, тянущиеся вперёд, — хирагана っ и つ, а также ⊂ и ⊃: (っ＾▽＾)っ, ⊂(・ω・*⊂). Если руки по обе стороны лица, как в ⊂((・▽・))⊃, смайлик раскрывает объятия."]],
      [["Which characters are the arms in hug kaomoji?", "Reaching arms are the hiragana っ and つ, or ⊂ and ⊃: (っ＾▽＾)っ, ⊂(・ω・*⊂). With arms on both sides, as in ⊂((・▽・))⊃, the face opens up for a hug."]],
    ),
  },
  kiss: {
    h1: { ru: "Каомодзи поцелуй", en: "Kiss kaomoji" },
    topic: { ru: "с поцелуями", en: "kiss" },
    qa: q(
      [["Как в каомодзи рисуют губы для поцелуя?", "Губы трубочкой — это цифра 3, кириллическая з или надстрочная ³: (*^3^)/~☆, (っ´з`)っ, ( ˘ ³˘)♥. Греческая ε тоже подходит: (˘ε˘)."]],
      [["How are kissing lips drawn in kaomoji?", "Puckered lips are the digit 3, the Cyrillic з or a superscript ³: (*^3^)/~☆, (っ´з`)っ, ( ˘ ³˘)♥. The Greek ε works too: (˘ε˘)."]],
    ),
  },
  wink: {
    h1: { ru: "Подмигивающие каомодзи", en: "Winking kaomoji" },
    topic: { ru: "с подмигиванием", en: "winking" },
    qa: q(
      [["Как нарисовать подмигивание?", "Один глаз открыт, другой закрыт: ^ и -, ・ и <, ^ и ~ — (^_-)☆, (・ω<), (^_~). Звёздочка ☆ после лица — «блеск» подмигивания."]],
      [["How do you draw a wink?", "One eye open and one closed: ^ and -, ・ and <, ^ and ~ — (^_-)☆, (・ω<), (^_~). The ☆ after the face is the sparkle of the wink."]],
    ),
  },
  dance: {
    h1: { ru: "Танцующие каомодзи", en: "Dancing kaomoji" },
    topic: { ru: "с танцами", en: "dancing" },
    qa: q(
      [["Как показать движение в танцующих каомодзи?", "Руки меняют положение от смайлика к смайлику: ┌(・。・)┘ и └(＾＾)┐, а волны 〜 рисуют покачивание — (〜￣▽￣)〜. Несколько смайликов подряд дают мини-анимацию."]],
      [["How do dancing kaomoji show movement?", "The arms change position — ┌(・。・)┘ and └(＾＾)┐ — and 〜 waves show swaying: (〜￣▽￣)〜. Post a few in a row and you get a tiny animation."]],
    ),
  },
  music: {
    h1: { ru: "Каомодзи музыка", en: "Music kaomoji" },
    topic: { ru: "про музыку и песни", en: "music" },
    qa: q(
      [["Что значит d(-_-)b?", "Буквы d и b по бокам — наушники, а закрытые глаза — погружение в музыку. Ноты ♪ ♫ ♬ рядом с лицом означают, что персонаж поёт или напевает."]],
      [["What does d(-_-)b mean?", "The d and b on the sides are headphones and the closed eyes show someone lost in the music. Notes ♪ ♫ ♬ next to a face mean the character is singing or humming."]],
    ),
  },
  fight: {
    h1: { ru: "Каомодзи драка", en: "Fighting kaomoji" },
    topic: { ru: "с кулаками и решимостью", en: "fighting" },
    qa: q(
      [["Что за символы ᕦ и ᕤ?", "Это знаки канадского слогового письма, похожие на согнутые руки с бицепсами: ᕦ(ò_óˇ)ᕤ — «я сильный!». Тайская ง по бокам лица — кулаки, поднятые для боя: (ง'\u0300-'\u0301)ง."]],
      [["What are the ᕦ and ᕤ characters?", "They are Canadian Aboriginal syllabics that look like flexed arms: ᕦ(ò_óˇ)ᕤ says \"I'm strong!\". The Thai ง on both sides are fists raised for a fight: (ง'\u0300-'\u0301)ง."]],
    ),
  },
  greeting: {
    h1: { ru: "Каомодзи привет", en: "Hello kaomoji" },
    topic: { ru: "для приветствия", en: "hello" },
    qa: q(
      [["Какой каомодзи подходит для «привет»?", "Любой с поднятой рукой: (・ω・)ノ, (￣▽￣)ノ, ヾ(＾∇＾). Катакана ノ и знак ヾ здесь — ладонь, которой машут, а (￣^￣)ゞ — приветствие в стиле салюта."]],
      [["Which kaomoji works as a \"hi\"?", "Any with a raised hand: (・ω・)ノ, (￣▽￣)ノ, ヾ(＾∇＾). The katakana ノ and the mark ヾ are a waving palm; (￣^￣)ゞ is a salute."]],
    ),
  },
  goodbye: {
    h1: { ru: "Каомодзи пока", en: "Goodbye kaomoji" },
    topic: { ru: "для прощания", en: "goodbye" },
    qa: q(
      [["Что значит ﾉｼ в прощальных каомодзи?", "Это машущая рука: ﾉ — ладонь, ｼ — линии движения, поэтому (・ω・)ﾉｼ читается как «пока-пока». Волнистые ~~ после руки, как в (^_^)/~~, — взмах платком."]],
      [["What does ﾉｼ mean in goodbye kaomoji?", "It's a waving hand: ﾉ is the palm and ｼ the motion lines, so (・ω・)ﾉｼ reads as \"bye-bye\". The ~~ after an arm, as in (^_^)/~~, is a waving handkerchief."]],
    ),
  },
  thanks: {
    h1: { ru: "Каомодзи спасибо", en: "Thank you kaomoji" },
    topic: { ru: "со словами благодарности", en: "thank-you" },
    qa: q(
      [["Что значит 人 в (人´∀`)?", "Иероглиф 人 («человек») похож на сложенные ладони — жест благодарности или просьбы. ｱﾘｶﾞﾄ и ｻﾝｷｭｰ после лица — японские «аригато» и «сэнкью», то есть «спасибо»."]],
      [["What does 人 mean in (人´∀`)?", "The kanji 人 (\"person\") looks like palms pressed together — a gesture of thanks or pleading. ｱﾘｶﾞﾄ and ｻﾝｷｭｰ after a face are the Japanese \"arigato\" and \"thank you\"."]],
    ),
  },
  apology: {
    h1: { ru: "Каомодзи извини", en: "Sorry kaomoji" },
    topic: { ru: "с извинениями и поклоном", en: "sorry" },
    qa: q(
      [["Что значит m(_ _)m?", "Это глубокий поклон: m — руки на полу, (_ _) — опущенная голова. Так в Японии особенно искренне извиняются или благодарят. <(_ _)> — поклон стоя."]],
      [["What does m(_ _)m mean?", "It is a deep bow: the m's are hands on the floor and (_ _) is the lowered head — a sincere apology or a heartfelt thank-you in Japan. <(_ _)> is a standing bow."]],
    ),
  },
  food: {
    h1: { ru: "Каомодзи еда", en: "Food kaomoji" },
    topic: { ru: "про еду и напитки", en: "food" },
    qa: q(
      [["Какие символы изображают еду и напитки?", "Иероглиф 旦 похож на чашку чая, ♨ — на горячее блюдо, c[_] — кружка кофе, 自 — кружка пива, ┌iii┐ — торт со свечами. Арабская буква ڡ рисует облизывающийся рот: (っ˘ڡ˘ς)."]],
      [["Which characters are food and drinks?", "The kanji 旦 is a cup of tea, ♨ a hot dish, c[_] a coffee mug, 自 a beer mug and ┌iii┐ a birthday cake. The Arabic letter ڡ is a licking mouth: (っ˘ڡ˘ς)."]],
    ),
  },
  running: {
    h1: { ru: "Бегущие каомодзи", en: "Running kaomoji" },
    topic: { ru: "про бег и спешку", en: "running" },
    qa: q(
      [["Как показать скорость в каомодзи?", "За бегущим рисуют облачка пыли и линии движения: ε=ε=ε=, 三 или ≡≡≡. Руки ┌ и ┘ работают как у бегуна: ε=ε=┌( >_<)┘."]],
      [["How do kaomoji show speed?", "Dust clouds and speed lines trail behind: ε=ε=ε=, 三 or ≡≡≡. The ┌ and ┘ arms pump like a sprinter's: ε=ε=┌( >_<)┘."]],
    ),
  },
  writing: {
    h1: { ru: "Каомодзи пишет", en: "Writing kaomoji" },
    topic: { ru: "за письмом и учёбой", en: "writing" },
    qa: q(
      [["Почему в пишущих каомодзи есть φ?", "Греческая φ похожа на ручку в руке, поэтому φ(．．) — человек, склонившийся над тетрадью. Японский знак 〆 тоже изображает ручку, а ﾒﾓﾒﾓ — «мемо-мемо», то есть «записываю»."]],
      [["Why do writing kaomoji use φ?", "The Greek φ looks like a pen in hand, so φ(．．) is someone bent over a notebook. The Japanese mark 〆 is a pen too, and ﾒﾓﾒﾓ (\"memo memo\") means \"taking notes\"."]],
    ),
  },
  magic: {
    h1: { ru: "Каомодзи магия", en: "Magic kaomoji" },
    topic: { ru: "с магией и блёстками", en: "magic" },
    qa: q(
      [["Как нарисовать волшебную палочку?", "Палочка — линия ━ или ── со звездой ☆ на конце, искры — россыпь ﾟ.*･｡, а руки ⊃ держат палочку: (∩｀-´)⊃━☆ﾟ.*･｡ﾟ."]],
      [["How do you draw a magic wand?", "The wand is a line ━ or ── with a star ☆ at the tip, the sparkles are scattered ﾟ.*･｡ and the ⊃ arms hold it: (∩｀-´)⊃━☆ﾟ.*･｡ﾟ."]],
    ),
  },
};

/** Characters of the famous kaomoji: [char, Unicode name, role ru, role en]. Code points are computed. */
export const ANATOMY: Record<string, { of: string; rows: [string, string, string, string][] }[]> = {
  shrug: [
    {
      of: "¯\\_(ツ)_/¯",
      rows: [
        ["¯", "MACRON", "поднятые кисти рук", "raised hands"],
        ["\\", "REVERSE SOLIDUS", "левая рука", "left arm"],
        ["_", "LOW LINE", "плечи", "shoulders"],
        ["(", "LEFT PARENTHESIS", "контур головы", "head outline"],
        ["ツ", "KATAKANA LETTER TU", "лицо: глаза и улыбка", "face: eyes and smile"],
        [")", "RIGHT PARENTHESIS", "контур головы", "head outline"],
        ["/", "SOLIDUS", "правая рука", "right arm"],
      ],
    },
  ],
  "table-flip": [
    {
      of: "(╯°□°)╯︵ ┻━┻",
      rows: [
        ["╯", "BOX DRAWINGS LIGHT ARC UP AND LEFT", "вскинутые руки", "arms thrown up"],
        ["°", "DEGREE SIGN", "выпученные глаза", "wide eyes"],
        ["□", "WHITE SQUARE", "рот, открытый в крике", "mouth open in a yell"],
        ["︵", "PRESENTATION FORM FOR VERTICAL LEFT PARENTHESIS", "траектория полёта стола", "arc of the flying table"],
        ["┻", "BOX DRAWINGS HEAVY UP AND HORIZONTAL", "ножки перевёрнутого стола", "legs of the upturned table"],
        ["━", "BOX DRAWINGS HEAVY HORIZONTAL", "столешница", "tabletop"],
      ],
    },
    {
      of: "┬─┬ノ( º _ ºノ)",
      rows: [
        ["┬", "BOX DRAWINGS LIGHT DOWN AND HORIZONTAL", "стол, поставленный на ножки", "table standing on its legs"],
        ["─", "BOX DRAWINGS LIGHT HORIZONTAL", "столешница", "tabletop"],
        ["ノ", "KATAKANA LETTER NO", "руки, которые ставят стол", "hands setting the table down"],
        ["º", "MASCULINE ORDINAL INDICATOR", "спокойные глаза", "calm eyes"],
      ],
    },
  ],
  "lenny-face": [
    {
      of: "( \u0361° \u035Cʖ \u0361°)",
      rows: [
        ["\u0361", "COMBINING DOUBLE INVERTED BREVE", "брови", "eyebrows"],
        ["°", "DEGREE SIGN", "глаза", "eyes"],
        ["\u035C", "COMBINING DOUBLE BREVE BELOW", "линия улыбки", "smile line"],
        ["ʖ", "LATIN LETTER INVERTED GLOTTAL STOP", "нос и рот", "nose and mouth"],
      ],
    },
  ],
  disapproval: [
    {
      of: "ಠ_ಠ",
      rows: [
        ["ಠ", "KANNADA LETTER TTHA", "глаза", "eyes"],
        ["_", "LOW LINE", "плотно сжатый рот", "flat, tight mouth"],
      ],
    },
  ],
};

/** What common kaomoji characters depict (used to explain the "typical characters" of a category). */
export const GLOSSARY: Record<string, L10n> = {
  "ω": { ru: "греческая омега — «кошачий» рот", en: "Greek omega — a cat-like mouth" },
  "▽": { ru: "треугольник — широко открытый рот", en: "down-pointing triangle — a wide-open mouth" },
  "∀": { ru: "математический знак «для всех» — открытый рот", en: "the \"for all\" sign — an open mouth" },
  "∇": { ru: "знак набла — открытый рот", en: "nabla — an open mouth" },
  "Д": { ru: "кириллическая Д — рот, открытый в крике", en: "Cyrillic De — a mouth open in a shout" },
  "益": { ru: "иероглиф 益 — оскал", en: "the kanji 益 — gritted teeth" },
  "皿": { ru: "иероглиф «тарелка» — стиснутые зубы", en: "the kanji for \"dish\" — clenched teeth" },
  "◕": { ru: "круг с сектором — блестящий глаз", en: "circle with a quadrant — a shiny eye" },
  "‿": { ru: "соединительная дуга — улыбка", en: "undertie — a smile" },
  "ᴥ": { ru: "фонетическая буква — нос и пасть зверька", en: "phonetic letter — an animal snout" },
  "ʕ": { ru: "буква фонетического алфавита — ухо медведя", en: "IPA letter — a bear's ear" },
  "ツ": { ru: "катакана «цу» — лицо целиком", en: "katakana TSU — the whole face" },
  "ಠ": { ru: "буква каннада «ттха» — глаз", en: "Kannada letter TTHA — an eye" },
  "ʖ": { ru: "латинская буква ʖ — нос и рот", en: "Latin letter ʖ — nose and mouth" },
  "°": { ru: "знак градуса — круглый глаз", en: "degree sign — a round eye" },
  "´": { ru: "акут — бровь или прищур", en: "acute accent — an eyebrow or a squint" },
  "｀": { ru: "гравис — бровь или прищур", en: "grave accent — an eyebrow or a squint" },
  "`": { ru: "гравис — бровь или прищур", en: "grave accent — an eyebrow or a squint" },
  "≧": { ru: "знак «больше или равно» — зажмуренный глаз", en: "greater-than-or-equal sign — a tightly shut eye" },
  "╥": { ru: "псевдографика — ручьи слёз", en: "box-drawing character — streams of tears" },
  "ಥ": { ru: "буква каннада — глаз, полный слёз", en: "Kannada letter — an eye full of tears" },
  ";": { ru: "точка с запятой — слеза или капля пота", en: "semicolon — a tear or a sweat drop" },
  "ノ": { ru: "катакана «но» — поднятая рука", en: "katakana NO — a raised arm" },
  "ﾉ": { ru: "катакана «но» — поднятая рука", en: "katakana NO — a raised arm" },
  "ヽ": { ru: "знак повтора катаканы — рука", en: "katakana iteration mark — an arm" },
  "ゞ": { ru: "знак повтора — рука у головы", en: "iteration mark — a hand at the head" },
  "っ": { ru: "хирагана «цу» — рука, тянущаяся вперёд", en: "small hiragana TSU — a reaching arm" },
  "⊂": { ru: "знак подмножества — рука", en: "subset sign — an arm" },
  "⊃": { ru: "знак надмножества — рука", en: "superset sign — an arm" },
  "≦": { ru: "знак «меньше или равно» — зажмуренный глаз", en: "less-than-or-equal sign — a tightly shut eye" },
  "♡": { ru: "сердечко", en: "a heart" },
  "♥": { ru: "сердечко", en: "a heart" },
  "☆": { ru: "звёздочка — блеск", en: "a star — a sparkle" },
  "♪": { ru: "нота", en: "a music note" },
  "┻": { ru: "псевдографика — перевёрнутый стол", en: "box-drawing character — the upturned table" },
  "人": { ru: "иероглиф «человек» — сложенные ладони", en: "the kanji for \"person\" — palms pressed together" },
  "φ": { ru: "греческая фи — ручка", en: "Greek phi — a pen" },
  "〆": { ru: "японский знак «симэ» — ручка", en: "the Japanese shime mark — a pen" },
  "ε": { ru: "эпсилон — облачко пыли или губы", en: "epsilon — a dust cloud or lips" },
  "Θ": { ru: "греческая тета — клюв", en: "Greek theta — a beak" },
  "ө": { ru: "кириллическая ө — клюв", en: "Cyrillic ө — a beak" },
  "x": { ru: "латинская x — рот зайчика или глаз «в отключке»", en: "Latin x — a bunny mouth or a knocked-out eye" },
  "×": { ru: "знак умножения — глаз «в отключке»", en: "multiplication sign — a knocked-out eye" },
  "ڡ": { ru: "арабская буква — облизывающийся рот", en: "Arabic letter — a licking mouth" },
  "ψ": { ru: "греческая пси — вилы", en: "Greek psi — a pitchfork" },
  "¯": { ru: "макрон — поднятая рука", en: "macron — a raised hand" },
  "■": { ru: "чёрный квадрат — стекло тёмных очков", en: "black square — a sunglasses lens" },
  "^": { ru: "циркумфлекс — улыбающийся глаз или ушко", en: "caret — a smiling eye or an ear" },
  "_": { ru: "подчёркивание — рот", en: "underscore — a mouth" },
  "・": { ru: "катаканская точка — маленький глаз", en: "katakana middle dot — a small eye" },
  "･": { ru: "катаканская точка — маленький глаз", en: "katakana middle dot — a small eye" },
  "ェ": { ru: "катакана «э» — мордочка", en: "katakana E — a snout" },
  "ﻌ": { ru: "арабская буква — мордочка", en: "Arabic letter — a snout" },
  "=": { ru: "знак равенства — усы или облачко", en: "equals sign — whiskers or a puff" },
  "∪": { ru: "знак объединения — висячее ухо", en: "union sign — a floppy ear" },
  "／": { ru: "широкая косая черта — ухо зайца", en: "fullwidth slash — a bunny ear" },
  "z": { ru: "латинская z — храп", en: "Latin z — snoring" },
  "ᕦ": { ru: "канадский слоговой знак — согнутая рука", en: "Canadian syllabic — a flexed arm" },
  "ง": { ru: "тайская буква — кулак", en: "Thai letter — a fist" },
  "━": { ru: "жирная горизонтальная линия — стол или волшебная палочка", en: "heavy horizontal line — a table or a magic wand" },
  "o": { ru: "латинская o — глаз или открытый рот", en: "Latin o — an eye or an open mouth" },
  "〜": { ru: "волна — покачивание", en: "wave dash — swaying" },
  "✧": { ru: "сверкание", en: "a sparkle" },
  "ﾟ": { ru: "полуширинный дакутэн — глаз или искорка", en: "halfwidth sound mark — an eye or a sparkle" },
  "￣": { ru: "широкая черта сверху — прикрытый глаз", en: "fullwidth macron — a half-closed eye" },
  "ー": { ru: "знак долготы — прищуренный глаз или ровный рот", en: "long vowel mark — a squint or a flat mouth" },
  "ｰ": { ru: "знак долготы — прищуренный глаз или ровный рот", en: "long vowel mark — a squint or a flat mouth" },
  "﹏": { ru: "волнистая линия — дрожащие губы", en: "wavy low line — trembling lips" },
  "︶": { ru: "дуга — закрытый глаз", en: "arc — a closed eye" },
  "˘": { ru: "бреве — закрытый глаз", en: "breve — a closed eye" },
  "•": { ru: "жирная точка — глаз", en: "bullet — an eye" },
  "-": { ru: "дефис — закрытый глаз", en: "hyphen — a closed eye" },
  "T": { ru: "латинская T — глаз со слезой", en: "Latin T — an eye with a tear" },
  "m": { ru: "латинская m — руки на полу при поклоне", en: "Latin m — hands on the floor in a bow" },
  "♨": { ru: "горячий источник — горячее блюдо", en: "hot springs sign — a hot dish" },
  "旦": { ru: "иероглиф 旦 — чашка чая", en: "the kanji 旦 — a cup of tea" },
  "三": { ru: "иероглиф «три» — линии скорости", en: "the kanji for \"three\" — speed lines" },
  "┌": { ru: "уголок — согнутая рука", en: "box-drawing corner — a bent arm" },
  "3": { ru: "цифра 3 — губы трубочкой", en: "digit 3 — puckered lips" },
  "з": { ru: "кириллическая з — губы трубочкой", en: "Cyrillic ze — puckered lips" },
  "³": { ru: "надстрочная тройка — губы трубочкой", en: "superscript three — puckered lips" },
};
