import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { defaultMafia } from "../lib/lots";

const tt = (l: Locale, ru: string, en: string) => (l === "ru" ? ru : en);

const VARIANTS: (VariantDef & { blocks: (l: Locale) => Block[] })[] = [
  {
    slug: "short-straw",
    name: { ru: "Короткая спичка", en: "Short straw" },
    title: { ru: "Тянуть спички онлайн | кто вытянет короткую спичку", en: "Draw Straws Online — Who Gets the Short Straw" },
    h1: { ru: "Тянуть спички онлайн", en: "Draw straws online" },
    description: {
      ru: "Тянуть спички онлайн: укажите число участников и коротких спичек — каждый по очереди тянет свою карточку. Честный жребий, когда спичек под рукой нет.",
      en: "Draw straws online: set the number of players and short straws — each player draws a card in turn. A fair lot when you have no matches at hand.",
    },
    lead: { ru: "Каждый по очереди нажимает на карточку: длинная спичка — повезло, короткая — выпал жребий.", en: "Each player taps a card in turn: a long straw means you're safe, the short one means you're it." },
    props: { mode: "straws" },
    blocks: (l) => [
      {
        type: "facts",
        title: tt(l, "Шансы вытянуть короткую", "Chance of the short straw"),
        rows: [2, 3, 4, 5, 6, 8, 10].map((n) => [tt(l, `${n} участников, 1 короткая`, `${n} players, 1 short`), `${Math.round(1000 / n) / 10} %`.replace(".", l === "ru" ? "," : ".")]),
      },
      { type: "list", title: tt(l, "Где пригодится", "Where it helps"), items: tt(l, "Кто моет посуду или идёт за пиццей.|Кто первым отвечает или выступает.|Решение спора, когда монетки мало — участников больше двух.", "Who does the dishes or goes for pizza.|Who answers or performs first.|Settling a dispute when there are more than two people and a coin won't do.").split("|") },
    ],
  },
  {
    slug: "order",
    name: { ru: "Очерёдность по номерам", en: "Order by numbers" },
    title: { ru: "Жеребьёвка номеров онлайн | порядок выступления по жребию", en: "Draw Numbers Online — Random Order by Lot" },
    h1: { ru: "Жеребьёвка номеров", en: "Draw numbers by lot" },
    description: {
      ru: "Жеребьёвка номеров онлайн: участники тянут карточки с номерами от 1 до N, и порядок выступлений или ходов определяется честным жребием без повторов.",
      en: "Draw numbers online: players pick cards numbered 1 to N, setting the order of performances or turns by a fair lot with no repeats.",
    },
    lead: { ru: "Каждый вытягивает карточку с номером — это его место в очереди. Номера не повторяются.", en: "Everyone draws a numbered card — that's their place in line. Numbers never repeat." },
    props: { mode: "numbers" },
    blocks: (l) => [
      {
        type: "facts",
        title: tt(l, "Сколько всего порядков", "How many orders there are"),
        rows: [3, 4, 5, 6, 8, 10].map((n) => {
          let f = 1;
          for (let i = 2; i <= n; i++) f *= i;
          return [tt(l, `${n} участников`, `${n} players`), f.toLocaleString(l === "ru" ? "ru-RU" : "en-US")];
        }),
      },
      { type: "list", title: tt(l, "Где пригодится", "Where it helps"), items: tt(l, "Порядок выступлений на конкурсе, защите или концерте.|Очерёдность ходов в настольной игре.|Номера стартов и дорожек в соревнованиях.", "Order of performances at a contest, defence or concert.|Turn order in a board game.|Start numbers and lanes in a competition.").split("|") },
    ],
  },
  {
    slug: "mafia",
    name: { ru: "Роли для «Мафии»", en: "Mafia roles" },
    title: { ru: "Раздача ролей для Мафии онлайн | карты мафии на телефоне", en: "Mafia Role Generator — Deal Mafia Cards on a Phone" },
    h1: { ru: "Раздача ролей для «Мафии»", en: "Mafia role dealer" },
    description: {
      ru: "Раздача ролей для игры «Мафия» с одного телефона: мафия, комиссар, доктор и мирные жители. Каждый тайно смотрит свою карту и передаёт телефон дальше.",
      en: "Deal roles for the Mafia party game from one phone: mafia, detective, doctor and civilians. Each player secretly looks at their card and passes the phone on.",
    },
    lead: { ru: "Передавайте телефон по кругу: каждый открывает одну карту, запоминает роль и скрывает её.", en: "Pass the phone around: each player opens one card, memorises the role and hides it." },
    props: { mode: "mafia" },
    blocks: (l) => [
      {
        type: "table",
        title: tt(l, "Сколько мафии на игроков", "How many mafia per players"),
        head: [tt(l, "Игроков", "Players"), tt(l, "Мафия", "Mafia"), tt(l, "Мирных с комиссаром и доктором", "Town incl. detective and doctor")],
        rows: [6, 7, 8, 9, 10, 11, 12, 14, 16].map((n) => [String(n), String(defaultMafia(n)), String(n - defaultMafia(n))]),
      },
      { type: "list", title: tt(l, "Как раздать роли", "How to deal"), items: tt(l, "Укажите число игроков — количество мафии подставится само, его можно изменить.|Включите или уберите комиссара и доктора.|Нажмите «Разложить жребий» и передавайте телефон: после просмотра карта скрывается.", "Set the number of players — the mafia count fills in and can be changed.|Add or remove the detective and doctor.|Press Deal the lots and pass the phone: each card hides after viewing.").split("|") },
    ],
  },
];

export const lotsTool: ToolDef = {
  slug: "draw-lots",
  component: "random/lots",
  icon: "Ticket",
  name: { ru: "Тянуть жребий", en: "Draw lots" },
  title: { ru: "Тянуть жребий онлайн | жеребьёвка карточками", en: "Draw Lots Online — Pick Cards by Lot" },
  seoAlt: { ru: "жеребьёвка онлайн", en: "drawing lots" },
  h1: { ru: "Тянуть жребий онлайн", en: "Draw lots online" },
  description: {
    ru: "Жребий онлайн: впишите варианты, карточки перемешаются и лягут рубашкой вверх. Каждый тянет свою — открыто или тайно. Спички, номера и роли для «Мафии».",
    en: "Draw lots online: type the options, the cards are shuffled face down and each person draws one — openly or in secret. Straws, numbers and Mafia roles.",
  },
  lead: { ru: "Впишите варианты и нажмите «Разложить жребий». Каждый по очереди открывает свою карточку.", en: "Type the options and press Deal the lots. Everyone takes a turn opening a card." },
  keywords: { ru: ["тянуть жребий", "жребий онлайн", "жеребьёвка", "вытянуть бумажку", "бросить жребий"], en: ["draw lots", "drawing lots online", "lots generator", "pick from a hat"] },
  props: { mode: "custom" },
  howTo: {
    ru: ["Выберите, что тянуть: свои варианты, спички, номера или роли «Мафии».", "Нажмите «Разложить жребий» — карточки перемешаются и лягут рубашкой вверх.", "Каждый по очереди нажимает на карточку. В тайном режиме она скрывается после просмотра."],
    en: ["Choose what to draw: your options, straws, numbers or Mafia roles.", "Press Deal the lots — the cards are shuffled and laid face down.", "Everyone taps a card in turn. In secret mode it hides again after viewing."],
  },
  about: {
    ru: [
      "Это как бумажки в шапке: карточки перемешиваются криптографическим генератором браузера, и положение каждого варианта случайно. Какую карточку ни выбери, шансы одинаковые.",
      "Тайный режим нужен, когда жребий никто не должен видеть, — например, при раздаче ролей. Телефон передают по кругу, и каждый видит только свою карточку.",
    ],
    en: [
      "Like slips of paper in a hat: the browser's cryptographic generator shuffles the cards, so every option's position is random. Whichever card you pick, the odds are the same.",
      "Secret mode is for lots nobody else should see — such as game roles. The phone goes around and each person sees only their own card.",
    ],
  },
  faq: {
    ru: [
      { q: "Жребий честный?", a: "Да. Карточки перемешиваются алгоритмом Фишера — Йетса на crypto.getRandomValues: любой порядок карточек равновероятен, и выбор карточки не влияет на шансы." },
      { q: "Чем отличается от случайного выбора из списка?", a: "Здесь каждый участник сам тянет свою карточку, как бумажку из шапки, и может сделать это тайно. Для одного победителя быстрее выбор из списка или колесо фортуны." },
      { q: "Сколько вариантов можно добавить?", a: "До 100 карточек. Повторяющиеся строки — отдельные карточки: так можно положить несколько одинаковых жребиев." },
    ],
    en: [
      { q: "Is it fair?", a: "Yes. Cards are shuffled with Fisher–Yates on crypto.getRandomValues: every order is equally likely and choosing a card doesn't change the odds." },
      { q: "How is it different from a random picker?", a: "Here each person draws their own card, like a slip from a hat, and can do it in secret. For a single winner a random picker or the wheel is quicker." },
      { q: "How many options can I add?", a: "Up to 100 cards. Duplicate lines are separate cards — a way to put in several identical lots." },
    ],
  },
  related: ["random-picker", "spin-the-wheel", "coin-flip", "random-team-generator", "secret-santa-generator"],
  variants: { title: { ru: "Готовые жребии", en: "Ready-made lots" }, list: () => VARIANTS },
};
