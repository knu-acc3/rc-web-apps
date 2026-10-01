import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { SPORTS, type Sport } from "../lib/score";

const tt = (l: Locale, ru: string, en: string) => (l === "ru" ? ru : en);

/* ───────────── scoreboard ───────────── */

interface SportPage {
  sport: Exclude<Sport, "default">;
  ru: { name: string; title: string; h1: string; desc: string; lead: string; rules: [string, string][]; tips: string[] };
  en: { name: string; title: string; h1: string; desc: string; lead: string; rules: [string, string][]; tips: string[] };
}

const SPORT_PAGES: SportPage[] = [
  {
    sport: "basketball",
    ru: {
      name: "Баскетбол",
      title: "Табло для баскетбола онлайн | счёт баскетбольного матча",
      h1: "Баскетбольное табло онлайн",
      desc: "Табло для баскетбола: очки +1, +2, +3 одним нажатием, командные фолы, номер четверти, отмена ошибки и большой счёт на весь экран телефона, планшета или телевизора.",
      lead: "Кнопки +1, +2 и +3 для штрафного, двухочкового и трёхочкового, командные фолы и четверти. На весь экран — как настоящее табло.",
      rules: [
        ["Очки", "1 — штрафной, 2 — бросок с игры, 3 — из-за дуги 6,75 м"],
        ["Время", "4 четверти по 10 минут (в НБА по 12), овертайм — 5 минут"],
        ["Командные фолы", "с 5-го фола команды в четверти соперник бьёт штрафные"],
      ],
      tips: ["Нажмите на счёт команды — добавится 1 очко, кнопки +2 и +3 — под ним.", "Фолы отмечайте маленьким счётчиком, а в новой четверти сбрасывайте их кнопкой −.", "Ошиблись — нажмите «Отменить» или Z: вернётся предыдущий счёт."],
    },
    en: {
      name: "Basketball",
      title: "Basketball Scoreboard Online — Keep Score of a Game",
      h1: "Basketball scoreboard online",
      desc: "A basketball scoreboard: +1, +2 and +3 in one tap, team fouls, the quarter number, undo and a big full-screen score on a phone, tablet or TV.",
      lead: "+1, +2 and +3 buttons for free throws, two- and three-pointers, team fouls and quarters. Full screen looks like a real scoreboard.",
      rules: [
        ["Points", "1 — free throw, 2 — field goal, 3 — beyond the 6.75 m arc"],
        ["Time", "4 quarters of 10 minutes (12 in the NBA), 5-minute overtime"],
        ["Team fouls", "from a team's 5th foul in a quarter the opponent shoots free throws"],
      ],
      tips: ["Tap a team's score to add 1 point; +2 and +3 are right below.", "Track fouls with the small counter and clear them with − in a new quarter.", "Made a mistake? Press Undo or Z to restore the previous score."],
    },
  },
  {
    sport: "volleyball",
    ru: {
      name: "Волейбол",
      title: "Табло для волейбола онлайн | счёт партий и подача",
      h1: "Волейбольное табло онлайн",
      desc: "Табло для волейбола: счёт очков и партий, отметка подачи, автоматическое окончание партии на 25 очках с разницей в 2 (в пятой — 15) и смена сторон.",
      lead: "Считает очки и партии, показывает, чья подача, и сам замечает конец партии: 25 очков с разницей в два, в решающей — 15.",
      rules: [
        ["Партия", "до 25 очков с разницей не меньше 2, пятая — до 15"],
        ["Матч", "до трёх выигранных партий"],
        ["Подача", "переходит к команде, выигравшей розыгрыш"],
      ],
      tips: ["Точка у названия команды показывает подачу — она переходит сама после каждого очка.", "Когда партия выиграна, появится кнопка «Следующая партия»: счёт обнулится, партии прибавятся.", "Кнопкой ⇄ поменяйте стороны после партии — цвета останутся у команд."],
    },
    en: {
      name: "Volleyball",
      title: "Volleyball Scoreboard Online — Points, Sets and Serve",
      h1: "Volleyball scoreboard online",
      desc: "A volleyball scoreboard: points and sets, a serve marker, automatic set end at 25 with a two-point lead (15 in the fifth) and side switching.",
      lead: "Counts points and sets, shows who serves and spots the end of a set: 25 points with a two-point lead, 15 in the decider.",
      rules: [
        ["Set", "to 25 points with a lead of at least 2; the fifth to 15"],
        ["Match", "first to win three sets"],
        ["Serve", "goes to the team that won the rally"],
      ],
      tips: ["The dot next to a team name shows the serve — it moves by itself after each point.", "When a set is won, a Next set button appears: points reset and the set is added.", "Use ⇄ to switch sides after a set — colours stay with the teams."],
    },
  },
  {
    sport: "football",
    ru: {
      name: "Футбол",
      title: "Табло для футбола онлайн | счёт матча на экране",
      h1: "Футбольное табло онлайн",
      desc: "Футбольное табло онлайн: счёт матча крупными цифрами, названия команд, номер тайма и смена сторон. Для дворового матча, турнира в школе или трансляции.",
      lead: "Счёт матча крупными цифрами, названия команд и тайм. Откройте на весь экран на планшете или телевизоре у поля.",
      rules: [
        ["Время", "2 тайма по 45 минут, дополнительное время — 2 по 15"],
        ["Ничья в плей-офф", "серия пенальти по 5 ударов, затем по одному"],
        ["Гол", "1 очко; засчитывается, если мяч полностью пересёк линию ворот"],
      ],
      tips: ["Нажмите на счёт, чтобы добавить гол, проведите вниз — отменить.", "Тайм переключается внизу, под табло.", "Для мини-футбола и футзала подойдёт то же табло."],
    },
    en: {
      name: "Football",
      title: "Football Scoreboard Online — Soccer Score on Screen",
      h1: "Football scoreboard online",
      desc: "An online football (soccer) scoreboard: big score digits, team names, the half and side switching. For a park game, a school tournament or a stream.",
      lead: "The match score in big digits, team names and the half. Open it full screen on a tablet or a TV by the pitch.",
      rules: [
        ["Time", "2 halves of 45 minutes, extra time 2 × 15"],
        ["Knockout draw", "a penalty shoot-out of 5 kicks each, then sudden death"],
        ["Goal", "1 point; counts when the whole ball crosses the goal line"],
      ],
      tips: ["Tap a score to add a goal, swipe down to take it back.", "Switch the half below the board.", "The same board works for five-a-side and futsal."],
    },
  },
  {
    sport: "hockey",
    ru: {
      name: "Хоккей",
      title: "Табло для хоккея онлайн | счёт матча и период",
      h1: "Хоккейное табло онлайн",
      desc: "Хоккейное табло онлайн: счёт шайб крупными цифрами, номер периода, названия команд и отмена ошибки. Подходит для дворового хоккея, турниров и флорбола.",
      lead: "Счёт шайб и номер периода крупно на весь экран. Цвета команд и названия меняются в один клик.",
      rules: [
        ["Время", "3 периода по 20 минут чистого времени"],
        ["Ничья", "овертайм, затем серия буллитов"],
        ["Шайба", "1 очко, засчитывается после полного пересечения линии ворот"],
      ],
      tips: ["Нажмите на счёт — шайба засчитана; провести вниз — отменить.", "Период переключается кнопками − и + под табло.", "Подойдёт и для флорбола, и для хоккея с мячом."],
    },
    en: {
      name: "Hockey",
      title: "Hockey Scoreboard Online — Score and Period",
      h1: "Hockey scoreboard online",
      desc: "An online hockey scoreboard: goals in big digits, the period number, team names and undo. Works for street hockey, tournaments and floorball.",
      lead: "Goals and the period in big digits, full screen. Team colours and names change in one click.",
      rules: [
        ["Time", "3 periods of 20 minutes of play"],
        ["Tie", "overtime, then a shootout"],
        ["Goal", "1 point, counts when the whole puck crosses the goal line"],
      ],
      tips: ["Tap the score to add a goal; swipe down to cancel it.", "Switch the period with − and + below the board.", "Also fits floorball and bandy."],
    },
  },
  {
    sport: "table-tennis",
    ru: {
      name: "Настольный теннис",
      title: "Счёт в настольном теннисе онлайн | табло для пинг-понга",
      h1: "Табло для настольного тенниса",
      desc: "Табло для пинг-понга: очки и партии, автоматическая смена подачи каждые 2 очка и после 10:10 — каждое очко, конец партии на 11 с разницей в два.",
      lead: "Само показывает, кто подаёт: каждые две подачи, а при 10:10 — по одной. Партия до 11 с разницей в два очка.",
      rules: [
        ["Партия", "до 11 очков с разницей не меньше 2"],
        ["Подача", "по 2 подачи, при 10:10 — по одной"],
        ["Матч", "из 5 или 7 партий; в решающей стороны меняют при 5 очках"],
      ],
      tips: ["Нажмите на точку у имени игрока, который подаёт первым, — дальше подача считается сама.", "После партии нажмите «Следующая партия»: первая подача перейдёт к сопернику.", "Положите телефон у сетки и откройте табло на весь экран — его видно обоим."],
    },
    en: {
      name: "Table tennis",
      title: "Table Tennis Scoreboard — Ping Pong Score Keeper",
      h1: "Table tennis scoreboard",
      desc: "A ping pong scoreboard: points and games, automatic serve change every 2 points and every point from 10–10, game end at 11 with a two-point lead.",
      lead: "Shows who serves by itself: two serves each, one each from 10–10. Games are to 11 with a two-point lead.",
      rules: [
        ["Game", "to 11 points with a lead of at least 2"],
        ["Serve", "2 serves each; one each from 10–10"],
        ["Match", "best of 5 or 7 games; ends change at 5 points in the decider"],
      ],
      tips: ["Tap the dot next to the player who serves first — the rest is automatic.", "After a game press Next game: the first serve goes to the opponent.", "Put the phone by the net in full screen so both players see it."],
    },
  },
  {
    sport: "badminton",
    ru: {
      name: "Бадминтон",
      title: "Табло для бадминтона онлайн | счёт геймов и подача",
      h1: "Табло для бадминтона",
      desc: "Табло для бадминтона: счёт до 21 с разницей в 2 очка (не больше 30), геймы, подача у выигравшего розыгрыш и автоматическое окончание гейма.",
      lead: "Гейм до 21 очка с разницей в два, но не дальше 30. Подача переходит к тому, кто выиграл розыгрыш.",
      rules: [
        ["Гейм", "до 21 очка с разницей 2; при 29:29 следующее очко решает"],
        ["Матч", "до двух выигранных геймов"],
        ["Перерыв", "при 11 очках у лидера; в третьем гейме — смена сторон"],
      ],
      tips: ["Точка у имени показывает подачу — она переходит к выигравшему очко.", "После гейма нажмите «Следующий гейм».", "Для парной игры впишите названия пар вместо имён."],
    },
    en: {
      name: "Badminton",
      title: "Badminton Scoreboard Online — Games and Serve",
      h1: "Badminton scoreboard",
      desc: "A badminton scoreboard: to 21 with a two-point lead (capped at 30), games, the serve with the rally winner and automatic game end.",
      lead: "Games are to 21 with a two-point lead, but no further than 30. The serve goes to whoever won the rally.",
      rules: [
        ["Game", "to 21 points with a lead of 2; at 29–29 the next point wins"],
        ["Match", "first to win two games"],
        ["Interval", "when the leader reaches 11; ends change in the third game"],
      ],
      tips: ["The dot next to a name shows the serve — it moves to the rally winner.", "After a game press Next game.", "For doubles, type the pair names instead of player names."],
    },
  },
  {
    sport: "quiz",
    ru: {
      name: "Квиз",
      title: "Табло для квиза онлайн | счёт команд в викторине",
      h1: "Табло для квиза и викторины",
      desc: "Счёт команд в квизе или викторине: кнопки +1, +5 и +10, номер раунда, свои названия команд и большой экран для проектора или телевизора.",
      lead: "Начисляйте +1, +5 или +10 одним нажатием, переключайте раунды и выводите счёт на проектор.",
      rules: [
        ["Очки", "+1, +5 и +10 одним нажатием, отнять — кнопкой −"],
        ["Раунды", "номер раунда показывается под счётом"],
        ["Команды", "свои названия и цвета, до 9999 очков"],
      ],
      tips: ["Подключите ноутбук к проектору и откройте табло на весь экран.", "Для трёх и более команд используйте счётчик со списком — у каждой команды своя строка.", "«Копировать счёт» — готовый итог для чата."],
    },
    en: {
      name: "Quiz",
      title: "Quiz Scoreboard Online — Team Score for Trivia",
      h1: "Quiz and trivia scoreboard",
      desc: "Team scores for a quiz or trivia night: +1, +5 and +10 buttons, the round number, your own team names and a big screen for a projector or TV.",
      lead: "Award +1, +5 or +10 in one tap, switch rounds and show the score on a projector.",
      rules: [
        ["Points", "+1, +5 and +10 in one tap, − to take one off"],
        ["Rounds", "the round number is shown under the score"],
        ["Teams", "your own names and colours, up to 9999 points"],
      ],
      tips: ["Connect a laptop to a projector and open the board full screen.", "For three or more teams use the counter with a list — one row per team.", "Copy score gives a ready summary for a chat."],
    },
  },
];

function sportBlocks(p: SportPage): (l: Locale) => Block[] {
  return (l) => [
    { type: "facts", title: tt(l, `Правила счёта: ${p.ru.name.toLowerCase()}`, `Scoring rules: ${p.en.name.toLowerCase()}`), rows: p[l].rules },
    { type: "list", title: tt(l, "Как вести счёт", "How to keep score"), items: p[l].tips },
  ];
}

export const scoreboardTool: ToolDef = {
  slug: "scoreboard",
  component: "score/board",
  icon: "Trophy",
  popular: true,
  name: { ru: "Табло для счёта", en: "Scoreboard" },
  title: { ru: "Табло для счёта онлайн | счёт игры на весь экран", en: "Online Scoreboard — Keep Score Full Screen" },
  seoAlt: { ru: "электронное табло", en: "score keeper" },
  h1: { ru: "Табло для счёта онлайн", en: "Online scoreboard" },
  description: {
    ru: "Онлайн-табло для любой игры: счёт двух команд крупными цифрами, названия, цвета, партии, отмена ошибки и режим на весь экран. Счёт сохраняется при перезагрузке.",
    en: "An online scoreboard for any game: two teams' scores in big digits, names, colours, sets, undo and a full-screen mode. The score survives a page reload.",
  },
  lead: { ru: "Нажмите на число — плюс очко, проведите вниз — минус. Откройте на весь экран, чтобы счёт видели все.", en: "Tap a number to add a point, swipe down to take one off. Open it full screen so everyone can see the score." },
  keywords: { ru: ["табло онлайн", "табло для счёта", "счёт игры", "электронное табло", "табло на весь экран"], en: ["online scoreboard", "score keeper", "scoreboard app", "keep score"] },
  howTo: {
    ru: ["Впишите названия команд и, если нужно, название матча.", "Нажимайте на счёт команды, чтобы добавить очко; кнопка − отнимает.", "Нажмите «На весь экран» — табло займёт весь экран, а экран не погаснет."],
    en: ["Type the team names and, if you like, a match title.", "Tap a team's score to add a point; the − button takes one off.", "Press Full screen — the board fills the screen and the display stays on."],
  },
  about: {
    ru: [
      "Табло запоминает счёт, названия и цвета в браузере: если случайно закрыть вкладку или телефон перезагрузится, счёт останется. Каждая ошибка отменяется кнопкой «Отменить» — хоть десять шагов назад.",
      "Для волейбола, настольного тенниса и бадминтона табло само отмечает подачу и видит конец партии; для баскетбола есть кнопки +2 и +3 и командные фолы.",
    ],
    en: [
      "The board remembers the score, names and colours in the browser: close the tab by accident or restart the phone and the score is still there. Undo takes back any mistake — even ten steps back.",
      "For volleyball, table tennis and badminton the board tracks the serve and spots the end of a set; for basketball there are +2 and +3 buttons and team fouls.",
    ],
  },
  faq: {
    ru: [
      { q: "Как вывести табло на телевизор?", a: "Откройте страницу в браузере телевизора или выведите экран ноутбука через HDMI и нажмите «На весь экран». На смарт-ТВ можно управлять счётом пультом: стрелками выберите кнопку и нажмите OK." },
      { q: "Сохранится ли счёт, если закрыть страницу?", a: "Да, счёт хранится в этом браузере на этом устройстве. На другом устройстве табло будет пустым." },
      { q: "Можно ли управлять с клавиатуры?", a: "Да: Q и A — плюс и минус левой команде, P и L — правой, S — поменять стороны, Z — отменить, F — на весь экран. Клавиши работают в любой раскладке." },
      { q: "Как считать больше двух команд?", a: "Откройте счётчик со списком — в нём сколько угодно строк с названиями и общий итог." },
    ],
    en: [
      { q: "How do I show the board on a TV?", a: "Open the page in the TV's browser or connect a laptop over HDMI and press Full screen. On a smart TV you can keep score with the remote: move to a button with the arrows and press OK." },
      { q: "Is the score kept if I close the page?", a: "Yes, it is stored in this browser on this device. On another device the board starts empty." },
      { q: "Can I use the keyboard?", a: "Yes: Q and A add and subtract for the left team, P and L for the right, S swaps sides, Z undoes, F goes full screen. Keys work in any keyboard layout." },
      { q: "How do I count more than two teams?", a: "Use the counter with a list — as many named rows as you need and a total." },
    ],
  },
  related: ["counter", "stopwatch", "timer", "coin-flip", "random-team-generator", "draw-lots"],
  variants: {
    title: { ru: "Виды спорта", en: "Sports" },
    list: (): VariantDef[] =>
      SPORT_PAGES.map((p) => ({
        slug: p.sport,
        name: { ru: p.ru.name, en: p.en.name },
        title: { ru: p.ru.title, en: p.en.title },
        h1: { ru: p.ru.h1, en: p.en.h1 },
        description: { ru: p.ru.desc, en: p.en.desc },
        lead: { ru: p.ru.lead, en: p.en.lead },
        props: { sport: p.sport },
        blocks: sportBlocks(p),
      })),
  },
  blocks: (l) => [
    {
      type: "table",
      title: tt(l, "Что умеет табло в каждом виде спорта", "What the board does for each sport"),
      head: [tt(l, "Вид", "Sport"), tt(l, "Кнопки очков", "Point buttons"), tt(l, "Дополнительно", "Extras")],
      rows: SPORT_PAGES.map((p) => {
        const c = SPORTS[p.sport];
        const extras = [c.small?.[l], c.period?.[l], c.serve ? tt(l, "подача", "serve") : "", c.win ? tt(l, `партия до ${c.win.to}`, `set to ${c.win.to}`) : ""].filter(Boolean).join(", ");
        return [p[l].name, c.steps.map((s) => `+${s}`).join(" "), extras.charAt(0).toUpperCase() + extras.slice(1)];
      }),
    },
  ],
};

/* ───────────── counter ───────────── */

interface CounterPage {
  preset: "people" | "votes" | "beads";
  ru: { name: string; title: string; h1: string; desc: string; lead: string };
  en: { name: string; title: string; h1: string; desc: string; lead: string };
  blocks: (l: Locale) => Block[];
}

const COUNTER_PAGES: CounterPage[] = [
  {
    preset: "people",
    ru: {
      name: "Счётчик посетителей",
      title: "Счётчик посетителей онлайн | подсчёт людей на входе",
      h1: "Счётчик посетителей",
      desc: "Счётчик людей на входе и выходе: две кнопки «Вошли» и «Вышли», сколько человек внутри прямо сейчас и итог за день. Работает на телефоне без установки.",
      lead: "Отмечайте, кто вошёл и кто вышел, — счётчик покажет, сколько людей внутри сейчас.",
    },
    en: {
      name: "People counter",
      title: "People Counter Online — Count Visitors In and Out",
      h1: "People counter",
      desc: "Count people in and out: In and Out buttons, how many people are inside right now and the day's total. Works on a phone, nothing to install.",
      lead: "Tap when someone comes in or goes out — the counter shows how many people are inside now.",
    },
    blocks: (l) => [
      {
        type: "facts",
        title: tt(l, "Что показывает", "What it shows"),
        rows: [
          [tt(l, "Вошли", "In"), tt(l, "все, кто прошёл внутрь за время подсчёта", "everyone who came in while counting")],
          [tt(l, "Вышли", "Out"), tt(l, "все, кто ушёл", "everyone who left")],
          [tt(l, "Сейчас внутри", "Inside now"), tt(l, "вошли минус вышли — для контроля вместимости", "in minus out — to keep within capacity")],
        ],
      },
      { type: "list", title: tt(l, "Где пригодится", "Where it helps"), items: tt(l, "Вход на мероприятие или выставку.|Контроль вместимости зала, бассейна или магазина.|Подсчёт пассажиров, гостей свадьбы, участников экскурсии.", "Entry to an event or exhibition.|Keeping a hall, pool or shop within capacity.|Counting passengers, wedding guests or tour members.").split("|") },
    ],
  },
  {
    preset: "votes",
    ru: {
      name: "Подсчёт голосов",
      title: "Подсчёт голосов онлайн | счётчик голосования с процентами",
      h1: "Подсчёт голосов онлайн",
      desc: "Подсчёт голосов при голосовании поднятием рук или бюллетенями: свои варианты, кнопки +1, проценты, общий итог и копирование результата одним нажатием.",
      lead: "Впишите варианты и нажимайте «+» за каждый голос — проценты и итог считаются сразу.",
    },
    en: {
      name: "Vote counter",
      title: "Vote Counter Online — Tally Votes with Percentages",
      h1: "Vote counter online",
      desc: "Count votes from a show of hands or paper ballots: your own options, +1 buttons, percentages, a total and one-tap copy of the result.",
      lead: "Type the options and tap + for each vote — percentages and the total update instantly.",
    },
    blocks: (l) => [
      {
        type: "facts",
        title: tt(l, "Как считаются проценты", "How percentages work"),
        rows: [
          [tt(l, "Доля варианта", "Option share"), tt(l, "голоса за вариант ÷ все голоса × 100", "votes for the option ÷ all votes × 100")],
          [tt(l, "Округление", "Rounding"), tt(l, "до десятых: 33,3 %", "to one decimal: 33.3%")],
          [tt(l, "Клавиши", "Keys"), tt(l, "1–9 — голос за вариант с этим номером", "1–9 — a vote for that option")],
        ],
      },
      { type: "list", title: tt(l, "Где пригодится", "Where it helps"), items: tt(l, "Выборы старосты, совета класса, председателя собрания.|Голосование в жюри и на конкурсе.|Подсчёт бюллетеней и опрос поднятием рук.", "Electing a class rep, council or chair.|Jury and contest voting.|Counting ballots or a show of hands.").split("|") },
    ],
  },
  {
    preset: "beads",
    ru: {
      name: "Электронные чётки",
      title: "Электронные чётки онлайн | счётчик молитв и зикра",
      h1: "Электронные чётки",
      desc: "Электронные чётки: счётчик молитв, зикра и мантр с целью 33, 99, 100 или 108, подсчёт кругов, вибрация и тихий режим. Большая кнопка — считать не глядя.",
      lead: "Нажимайте на большую кнопку или на весь экран. После 33 счёт начнётся заново, а круги посчитаются.",
    },
    en: {
      name: "Digital prayer beads",
      title: "Digital Prayer Beads — Tasbih and Mala Counter",
      h1: "Digital prayer beads",
      desc: "Digital prayer beads: a counter for prayers, dhikr and mantras with a goal of 33, 99, 100 or 108, laps, vibration and a silent mode. A big button to count by touch.",
      lead: "Tap the big button or the whole screen. After 33 the count starts over and laps are counted.",
    },
    blocks: (l) => [
      {
        type: "table",
        title: tt(l, "Сколько бусин в чётках", "How many beads"),
        head: [tt(l, "Чётки", "Beads"), tt(l, "Бусин или узелков", "Beads or knots")],
        rows:
          l === "ru"
            ? [
                ["Мусульманский тасбих", "33 или 99"],
                ["Православные чётки (вервица)", "чаще 100, бывают 33, 50 и 150"],
                ["Католический розарий", "59 (5 декад по 10 и ещё 9)"],
                ["Буддийские и индуистские мала", "108"],
              ]
            : [
                ["Muslim tasbih", "33 or 99"],
                ["Orthodox prayer rope", "usually 100; also 33, 50 and 150"],
                ["Catholic rosary", "59 (5 decades of 10 plus 9)"],
                ["Buddhist and Hindu mala", "108"],
              ],
      },
      { type: "list", title: tt(l, "Как удобнее", "Tips"), items: tt(l, "Включите «На весь экран» — тогда считается касание в любом месте.|Цель меняется в поле «Цель»: 33, 99, 100 или 108.|На Android каждое касание отзывается вибрацией, при достижении цели — двойной.", "Turn on Full screen — then a tap anywhere counts.|Change the goal: 33, 99, 100 or 108.|On Android each tap vibrates, with a double buzz at the goal.").split("|") },
    ],
  },
];

export const counterTool: ToolDef = {
  slug: "counter",
  component: "score/counter",
  icon: "Tally5",
  popular: true,
  name: { ru: "Счётчик нажатий", en: "Tally counter" },
  title: { ru: "Счётчик онлайн | кликер для подсчёта нажатием", en: "Tally Counter Online — Click Counter" },
  seoAlt: { ru: "счётчик кликов", en: "click counter" },
  h1: { ru: "Счётчик онлайн", en: "Online tally counter" },
  description: {
    ru: "Онлайн-счётчик нажатий: большая кнопка «+», шаг 1–10, цель с подсчётом кругов, несколько счётчиков с итогом, звук и вибрация. Значения сохраняются.",
    en: "An online tally counter: a big + button, steps of 1–10, a goal with laps, several counters with a total, sound and vibration. Values are saved.",
  },
  lead: { ru: "Нажимайте «+» или пробел — счётчик запомнит значение даже после перезагрузки.", en: "Press + or Space — the counter keeps its value even after a reload." },
  keywords: { ru: ["счётчик онлайн", "кликер", "счётчик нажатий", "тапалка", "ручной счётчик"], en: ["tally counter", "click counter", "clicker", "online counter"] },
  howTo: {
    ru: ["Нажимайте большую кнопку «+», пробел или стрелку вверх; «−» и стрелка вниз отнимают.", "При необходимости задайте шаг и цель — после цели счётчик может начинать заново и считать круги.", "Нужно считать несколько вещей — нажмите «Ещё счётчик»: появится список с итогом."],
    en: ["Press the big + button, Space or the up arrow; − and the down arrow subtract.", "Set a step and a goal if needed — after the goal the counter can start over and count laps.", "Counting several things? Press Add counter to get a list with a total."],
  },
  about: {
    ru: [
      "Это ручной счётчик-кликер в браузере: им считают людей, повторения, круги на стадионе, птиц на учёте или петли в вязании. Значения хранятся на устройстве и не пропадут, если закрыть вкладку.",
      "Любое нажатие можно отменить. В полноэкранном режиме весь экран становится кнопкой — удобно считать, не глядя на телефон.",
    ],
    en: [
      "A hand tally counter in your browser: count people, reps, laps, birds or knitting rows. Values are stored on your device and survive closing the tab.",
      "Any tap can be undone. In full screen the whole screen becomes the button — handy for counting without looking at the phone.",
    ],
  },
  faq: {
    ru: [
      { q: "Сохранится ли счёт?", a: "Да, значения хранятся в браузере на этом устройстве и остаются после перезагрузки страницы или телефона." },
      { q: "Можно ли считать несколько вещей сразу?", a: "Да: нажмите «Ещё счётчик». У каждой строки своё название и кнопки, внизу — общий итог. Клавиши 1–9 добавляют к строке с этим номером." },
      { q: "Есть ли вибрация и звук?", a: "Вибрация работает на Android при каждом нажатии. Звук щелчка включается кнопкой с динамиком." },
    ],
    en: [
      { q: "Is the count saved?", a: "Yes, values are stored in the browser on this device and stay after reloading the page or restarting the phone." },
      { q: "Can I count several things at once?", a: "Yes: press Add counter. Each row has its own name and buttons, with a total below. Keys 1–9 add to the row with that number." },
      { q: "Is there vibration and sound?", a: "Vibration works on Android on every tap. A click sound is turned on with the speaker button." },
    ],
  },
  related: ["scoreboard", "stopwatch", "timer", "word-counter", "random-number-generator"],
  variants: {
    title: { ru: "Готовые счётчики", en: "Ready-made counters" },
    list: (): VariantDef[] =>
      COUNTER_PAGES.map((p) => ({
        slug: p.preset,
        name: { ru: p.ru.name, en: p.en.name },
        title: { ru: p.ru.title, en: p.en.title },
        h1: { ru: p.ru.h1, en: p.en.h1 },
        description: { ru: p.ru.desc, en: p.en.desc },
        lead: { ru: p.ru.lead, en: p.en.lead },
        props: { preset: p.preset },
        blocks: p.blocks,
      })),
  },
};
