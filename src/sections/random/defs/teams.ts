import type { L10n, Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { L } from "./common";

const PERSON_FORMS = { ru: ["участник", "участника", "участников"], en: ["participant", "participants"] };

/** "4, 4, 3" — balanced sizes, largest first. */
function sizesText(people: number, teams: number): string {
  const base = Math.floor(people / teams);
  const extra = people % teams;
  return Array.from({ length: teams }, (_, i) => base + (i < extra ? 1 : 0)).join(", ");
}

interface TeamsPreset {
  teams: number;
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  note: L10n;
  faq: Record<Locale, QA>;
}

const PRESETS: TeamsPreset[] = [
  {
    teams: 2,
    name: { ru: "На 2 команды", en: "2 teams" },
    title: { ru: "Разделить на 2 команды онлайн — случайная жеребьёвка", en: "Split Into 2 Teams — random team picker" },
    h1: { ru: "Разделить на 2 команды", en: "Split into 2 teams" },
    description: {
      ru: "Разделить людей на две команды случайно: вставьте список имён, и жеребьёвка сделает команды равными — при нечётном числе разница ровно в одного человека.",
      en: "Split people into two random teams: paste the names and the draw makes the teams equal — with an odd number of players they differ by exactly one person.",
    },
    lead: { ru: "Вставьте имена — получите две равные случайные команды.", en: "Paste the names — get two equal random teams." },
    note: {
      ru: "Две команды — футбол во дворе, «Что? Где? Когда?», квиз или пейнтбол. При нечётном числе участников лишний игрок достаётся случайной команде, а не всегда первой.",
      en: "Two teams for a kickabout, a pub quiz or paintball. With an odd number of players the extra person goes to a random team, not always the first one.",
    },
    faq: {
      ru: { q: "Что будет, если участников нечётное число?", a: "Одна команда получит на одного человека больше, и какая именно — решает жребий. Например, 11 участников делятся на 6 и 5." },
      en: { q: "What if there's an odd number of people?", a: "One team gets one extra person, and which team that is is decided at random. For example, 11 people split into 6 and 5." },
    },
  },
  {
    teams: 3,
    name: { ru: "На 3 команды", en: "3 teams" },
    title: { ru: "Разделить на 3 команды онлайн — жеребьёвка", en: "Split Into 3 Teams — random team generator" },
    h1: { ru: "Разделить на 3 команды", en: "Split into 3 teams" },
    description: {
      ru: "Разделить участников на три команды случайно: размеры отличаются максимум на одного человека, капитаны и названия команд — по желанию. Результат копируется.",
      en: "Split participants into three random teams: sizes differ by at most one person, with optional captains and team names. Copy the result in one click.",
    },
    lead: { ru: "Вставьте имена — получите три случайные команды почти равного размера.", en: "Paste the names — get three random teams of near-equal size." },
    note: {
      ru: "Три команды удобны для квизов, эстафет и групповых проектов. Если участников не делится на три, одна или две команды будут больше на человека — какие, решает жребий.",
      en: "Three teams suit quizzes, relays and group projects. If the headcount doesn't divide by three, one or two teams get an extra person — chosen at random.",
    },
    faq: {
      ru: { q: "Как разделить 10 человек на 3 команды?", a: "Получится 4, 3 и 3 человека. Какая команда будет из четырёх — решает жребий." },
      en: { q: "How are 10 people split into 3 teams?", a: "You get 4, 3 and 3 people. Which team gets four is decided at random." },
    },
  },
  {
    teams: 4,
    name: { ru: "На 4 команды", en: "4 teams" },
    title: { ru: "Разделить на 4 команды онлайн — жеребьёвка", en: "Split Into 4 Teams — random group maker" },
    h1: { ru: "Разделить на 4 команды", en: "Split into 4 teams" },
    description: {
      ru: "Разделить людей на четыре команды или группы случайно: равные размеры, случайные капитаны и названия. Подходит для турниров, уроков и корпоративных игр.",
      en: "Split people into four random teams or groups: balanced sizes, random captains and team names. Great for tournaments, classrooms and team-building games.",
    },
    lead: { ru: "Вставьте имена — получите четыре случайные команды.", en: "Paste the names — get four random teams." },
    note: {
      ru: "Четыре группы — частый формат для турниров «каждый с каждым» и работы в классе. Список участников можно вставить прямо из таблицы: каждая строка — один человек.",
      en: "Four groups are a common format for round-robin tournaments and classwork. Paste the list straight from a spreadsheet: every line is one person.",
    },
    faq: {
      ru: { q: "Можно ли выбрать капитанов?", a: "Да, включите «Выбрать капитанов» — в каждой команде случайно отметится один капитан." },
      en: { q: "Can it choose captains?", a: "Yes, turn on “Pick captains” and one random member of each team is marked as captain." },
    },
  },
  {
    teams: 5,
    name: { ru: "На 5 команд", en: "5 teams" },
    title: { ru: "Разделить на 5 команд онлайн — случайные группы", en: "Split Into 5 Teams — random groups online" },
    h1: { ru: "Разделить на 5 команд", en: "Split into 5 teams" },
    description: {
      ru: "Разделить участников на пять команд или групп случайно: размеры отличаются максимум на одного, лишние места распределяются по жребию. Для классов и тренингов.",
      en: "Split participants into five random teams or groups: sizes differ by at most one, and extra places are assigned by lot. Ideal for classes and workshops.",
    },
    lead: { ru: "Вставьте имена — получите пять случайных групп.", en: "Paste the names — get five random groups." },
    note: {
      ru: "Пять групп удобно делать на уроке или тренинге с 20–30 участниками: получится по 4–6 человек. Разделение каждый раз новое — нажмите кнопку ещё раз, если нужен другой состав.",
      en: "Five groups work well in a class or workshop of 20–30 people: 4–6 each. Every split is new — press the button again for a different line-up.",
    },
    faq: {
      ru: { q: "Как разделить класс из 27 учеников на 5 групп?", a: "Получится две группы по 6 человек и три по 5. Какие группы будут больше, решает жребий." },
      en: { q: "How is a class of 27 split into 5 groups?", a: "Two groups of 6 and three of 5. Which groups are bigger is decided at random." },
    },
  },
];

function teamsBlocks(p: TeamsPreset, locale: Locale): Block[] {
  const sizes = [p.teams * 2, p.teams * 2 + 1, 10, 12, 15, 16, 20, 25, 30].filter((n, i, a) => n >= p.teams && a.indexOf(n) === i).sort((a, b) => a - b);
  return [
    {
      type: "table",
      title: L(locale, `Сколько человек будет в каждой из ${p.teams} команд`, `Team sizes for ${p.teams} teams`),
      head: [L(locale, "Участников", "Participants"), L(locale, "Размеры команд", "Team sizes")],
      rows: sizes.map((n) => [count(locale, n, PERSON_FORMS[locale]), sizesText(n, p.teams)]),
    },
    { type: "text", paragraphs: [p.note[locale]] },
  ];
}

const FAIR_FAQ: Record<Locale, QA> = {
  ru: { q: "Честно ли распределение?", a: "Да. Список перемешивается алгоритмом Фишера — Йетса на криптографическом генераторе браузера, поэтому любой состав команд равновероятен." },
  en: { q: "Is the split fair?", a: "Yes. The list is shuffled with the Fisher–Yates algorithm driven by the browser's cryptographic generator, so every line-up is equally likely." },
};

function teamsVariant(p: TeamsPreset): VariantDef {
  return {
    slug: `${p.teams}-teams`,
    name: p.name,
    title: p.title,
    h1: p.h1,
    description: p.description,
    lead: p.lead,
    props: { teams: p.teams },
    keywords: {
      ru: ["жеребьёвка", `разделить на ${p.teams} команды`, "деление на команды"],
      en: ["team generator", `split into ${p.teams} teams`, "random groups"],
    },
    blocks: (locale) => teamsBlocks(p, locale),
    faq: { ru: [p.faq.ru, FAIR_FAQ.ru], en: [p.faq.en, FAIR_FAQ.en] },
  };
}

export const teamsTool: ToolDef = {
  slug: "random-team-generator",
  component: "random/teams",
  icon: "Users",
  name: { ru: "Жеребьёвка команд", en: "Random team generator" },
  title: { ru: "Жеребьёвка команд онлайн — разделить на команды случайно", en: "Random Team Generator — split names into teams" },
  h1: { ru: "Жеребьёвка команд онлайн", en: "Random team generator" },
  description: {
    ru: "Жеребьёвка команд онлайн: вставьте имена и разделите людей на 2–20 команд. Размеры отличаются максимум на одного, капитаны и названия команд — по желанию.",
    en: "Random team generator: paste the names and split people into 2 to 20 teams. Sizes differ by at most one, with optional random captains and team names.",
  },
  lead: {
    ru: "Вставьте список участников, выберите число команд и нажмите «Разделить на команды».",
    en: "Paste the participants, choose the number of teams and press “Split into teams”.",
  },
  keywords: {
    ru: ["деление на команды", "разбить на команды", "случайные команды", "распределить по группам"],
    en: ["team picker", "random groups", "team maker", "split into groups"],
  },
  howTo: {
    ru: [
      "Вставьте участников — по одному имени на строку.",
      "Выберите количество команд — от 2 до 20.",
      "При желании включите капитанов и названия команд.",
      "Нажмите «Разделить на команды» и скопируйте результат для чата.",
    ],
    en: [
      "Paste the participants — one name per line.",
      "Choose the number of teams, from 2 to 20.",
      "Optionally turn on captains and team names.",
      "Press “Split into teams” and copy the result into your group chat.",
    ],
  },
  faq: {
    ru: [
      { q: "Команды получаются равными?", a: "Да, размеры отличаются не больше чем на одного человека. Если людей не делится поровну, лишние места достаются случайным командам, а не всегда первой." },
      FAIR_FAQ.ru,
      { q: "Можно ли разделить заново?", a: "Да, нажмите кнопку ещё раз — каждый раз получится новый случайный состав." },
      { q: "Куда отправляются имена?", a: "Никуда: список обрабатывается только в вашем браузере и не сохраняется на сервере." },
    ],
    en: [
      { q: "Are the teams equal?", a: "Yes, sizes differ by at most one person. When the headcount doesn't divide evenly, the extra places go to random teams, not always the first." },
      FAIR_FAQ.en,
      { q: "Can I split again?", a: "Yes, press the button again — you get a fresh random line-up every time." },
      { q: "Where are the names sent?", a: "Nowhere: the list is processed only in your browser and never stored on a server." },
    ],
  },
  about: {
    ru: [
      "Жеребьёвка решает вечный спор «кто с кем играет»: список перемешивается, и участники раскладываются по командам по очереди. Капитаны выбираются случайно внутри каждой команды.",
      "Размеры команд всегда сбалансированы, а при неровном делении случай решает, какие команды получат лишнего человека. Результат можно скопировать и отправить в чат.",
    ],
    en: [
      "The draw settles the eternal “who plays with whom” debate: the list is shuffled and people are dealt into teams in turn. Captains are picked at random within each team.",
      "Team sizes are always balanced, and when the split is uneven, chance decides which teams get the extra person. Copy the result and send it to your chat.",
    ],
  },
  variants: {
    title: { ru: "Сколько команд", en: "Number of teams" },
    list: () => PRESETS.map(teamsVariant),
  },
};

