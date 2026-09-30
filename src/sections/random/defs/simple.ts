import type { ToolDef } from "@/registry/types";

export const coinTool: ToolDef = {
  slug: "coin-flip",
  component: "random/coin",
  icon: "Coins",
  popular: true,
  name: { ru: "Подбросить монетку", en: "Coin flip" },
  title: { ru: "Подбросить монетку онлайн — орёл или решка", en: "Coin Flip — heads or tails online" },
  h1: { ru: "Подбросить монетку онлайн", en: "Flip a coin" },
  description: {
    ru: "Подбросить монетку онлайн: орёл или решка с шансом ровно 50 %, до 10 монет сразу, история бросков и статистика — сколько орлов, решек и самая длинная серия.",
    en: "Flip a coin online: heads or tails with exactly a 50% chance, up to 10 coins at once, a flip history and stats — heads, tails and the longest streak.",
  },
  lead: { ru: "Нажмите «Подбросить» — выпадет орёл или решка, шанс каждого 50 %.", en: "Press Flip — heads or tails, each with a 50% chance." },
  keywords: {
    ru: ["орёл или решка", "монетка", "бросить монету", "жребий", "подкинуть монетку"],
    en: ["heads or tails", "flip a coin", "coin toss", "toss a coin"],
  },
  howTo: {
    ru: [
      "Нажмите «Подбросить» — монетка перевернётся в воздухе и упадёт орлом или решкой.",
      "Для нескольких монет выберите их количество — до 10 за один бросок.",
      "Следите за статистикой: доля орлов и решек и самая длинная серия подряд.",
    ],
    en: [
      "Press Flip — the coin spins in the air and lands heads or tails.",
      "For several coins, choose how many — up to 10 in one throw.",
      "Watch the stats: the share of heads and tails and the longest streak.",
    ],
  },
  faq: {
    ru: [
      { q: "Монетка честная?", a: "Да. Результат выбирает криптографический генератор браузера: орёл и решка выпадают ровно с шансом 1/2, анимация на результат не влияет." },
      { q: "Почему выпало пять решек подряд?", a: "Это нормально: серия из пяти одинаковых результатов подряд начинается с вероятностью 1/16 при каждом броске. За 100 бросков серия из 5–7 одинаковых встречается очень часто." },
      { q: "Что значит «самая длинная серия»?", a: "Наибольшее число одинаковых результатов подряд за все броски на странице. При 100 бросках самая длинная серия обычно 5–8." },
      { q: "Можно подбросить несколько монет?", a: "Да, до 10 за раз. Под монетами будет итог, например «3 орла, 2 решки», а статистика учтёт каждую монету." },
    ],
    en: [
      { q: "Is the coin fair?", a: "Yes. The browser's cryptographic generator picks the result: heads and tails each come up with exactly a 1/2 chance, and the animation doesn't affect it." },
      { q: "Why did I get five tails in a row?", a: "That's normal: a run of five identical results starts with probability 1/16 on any flip. In 100 flips, streaks of 5–7 are very common." },
      { q: "What is the “longest streak”?", a: "The largest number of identical results in a row among all flips on the page. Over 100 flips it's usually 5 to 8." },
      { q: "Can I flip several coins?", a: "Yes, up to 10 at once. You'll see a summary such as “3 heads, 2 tails”, and the stats count every coin." },
    ],
  },
  about: {
    ru: [
      "Монетка — самый простой способ честно решить спор между двумя вариантами. Онлайн-монетка всегда под рукой и не укатится под диван.",
      "Статистика показывает, как на практике работает случайность: доля орлов стремится к 50 %, но длинные серии одинаковых результатов случаются гораздо чаще, чем кажется.",
    ],
    en: [
      "A coin toss is the simplest fair way to settle a choice between two options. The online coin is always at hand and never rolls under the sofa.",
      "The stats show randomness in action: the share of heads tends towards 50%, but long streaks of the same side happen far more often than most people expect.",
    ],
  },
};

export const pickerTool: ToolDef = {
  slug: "random-picker",
  component: "random/list",
  icon: "ListChecks",
  name: { ru: "Случайный выбор из списка", en: "Random picker" },
  title: { ru: "Случайный выбор из списка онлайн — рандомайзер", en: "Random Picker — choose from a list at random" },
  h1: { ru: "Случайный выбор из списка", en: "Random picker from a list" },
  description: {
    ru: "Случайный выбор из списка онлайн: вставьте варианты по одному на строку и выберите один или несколько без повторов, перемешайте список или убирайте выбранное.",
    en: "Pick at random from a list: paste one option per line and choose one or several without repeats, shuffle the whole list or remove picked items as you go.",
  },
  lead: { ru: "Вставьте список и нажмите «Выбрать случайно» — или перемешайте его целиком.", en: "Paste a list and press “Pick at random” — or shuffle it all." },
  keywords: {
    ru: ["рандомайзер", "выбрать из списка", "перемешать список", "жребий", "случайный победитель"],
    en: ["list randomizer", "random name picker", "shuffle list", "pick a winner", "random choice"],
  },
  howTo: {
    ru: [
      "Вставьте варианты в поле — по одному на строку, до 1000 строк.",
      "Выберите, сколько вариантов нужно выбрать.",
      "Нажмите «Выбрать случайно» или «Перемешать весь список».",
      "Включите «Убирать выбранное», чтобы следующий выбор шёл из оставшихся.",
    ],
    en: [
      "Paste your options — one per line, up to 1000 lines.",
      "Choose how many items to pick.",
      "Press “Pick at random” or “Shuffle the whole list”.",
      "Turn on “Remove picked items” so the next pick comes from what's left.",
    ],
  },
  faq: {
    ru: [
      { q: "Подойдёт для розыгрыша среди подписчиков?", a: "Да: вставьте имена или ники участников, по одному на строку, и выберите нужное число победителей — повторов не будет." },
      { q: "Как перемешать список в случайном порядке?", a: "Нажмите «Перемешать весь список». Используется алгоритм Фишера — Йетса: любой порядок строк равновероятен." },
      { q: "Что будет с повторяющимися строками?", a: "Каждая строка — отдельный вариант. Если имя записано дважды, у него вдвое больше шансов — так можно задать вес." },
      { q: "Список куда-то отправляется?", a: "Нет, всё работает в браузере. Список не сохраняется и никуда не передаётся." },
    ],
    en: [
      { q: "Can I use it for a giveaway?", a: "Yes: paste the entrants' names or handles, one per line, and pick the number of winners — nobody is picked twice." },
      { q: "How do I shuffle a list into random order?", a: "Press “Shuffle the whole list”. It uses the Fisher–Yates algorithm, so every order is equally likely." },
      { q: "What about duplicate lines?", a: "Each line is a separate entry. A name listed twice has twice the chance — a simple way to add weight." },
      { q: "Is my list sent anywhere?", a: "No, everything runs in the browser. The list isn't stored or transmitted." },
    ],
  },
  about: {
    ru: [
      "Рандомайзер списка выбирает случайные строки из любого перечня: победителей розыгрыша, отвечающего у доски, блюдо на ужин или задачу на сегодня. Выбор идёт без повторов.",
      "Режим перемешивания выдаёт весь список в случайном порядке — удобно для очереди выступлений или порядка игроков. Для наглядности то же самое умеет колесо фортуны.",
    ],
    en: [
      "The list randomizer picks random lines from any list: giveaway winners, who answers next, dinner or today's task. Picks never repeat.",
      "Shuffle mode returns the whole list in random order — handy for presentation order or turn order. For something more visual, the wheel spinner does the same.",
    ],
  },
};

export const cardTool: ToolDef = {
  slug: "pick-a-card",
  component: "random/card",
  icon: "Spade",
  name: { ru: "Случайная карта", en: "Pick a card" },
  title: { ru: "Вытянуть случайную карту из колоды онлайн", en: "Pick a Card — draw a random playing card" },
  h1: { ru: "Случайная карта из колоды", en: "Pick a random card" },
  description: {
    ru: "Вытянуть случайную игральную карту онлайн: колода на 36 или 52 карты, до 6 карт за раз без возврата, счётчик оставшихся карт и перемешивание колоды.",
    en: "Draw a random playing card online from a 36- or 52-card deck: up to 6 cards at once without replacement, a count of cards left and a reshuffle button.",
  },
  lead: { ru: "Нажмите «Вытянуть карту» — карта уходит из колоды, пока вы её не соберёте.", en: "Press “Draw a card” — it leaves the deck until you reshuffle." },
  keywords: {
    ru: ["вытянуть карту", "игральные карты", "колода карт", "случайная карта онлайн"],
    en: ["draw a card", "random playing card", "deck of cards", "card picker"],
  },
  howTo: {
    ru: [
      "Выберите колоду: 36 карт (от шестёрки до туза) или 52 карты.",
      "Укажите, сколько карт тянуть за раз, и нажмите «Вытянуть карту».",
      "Вытянутые карты не возвращаются — счётчик показывает, сколько осталось.",
      "Нажмите «Собрать и перемешать», чтобы начать заново с полной колодой.",
    ],
    en: [
      "Choose the deck: 36 cards (six to ace) or 52 cards.",
      "Set how many cards to draw at once and press “Draw a card”.",
      "Drawn cards don't go back — the counter shows how many are left.",
      "Press “Collect and reshuffle” to start again with a full deck.",
    ],
  },
  faq: {
    ru: [
      { q: "Какой шанс вытянуть туза?", a: "Из полной колоды на 52 карты — 4/52 ≈ 7,7 %, из 36 карт — 4/36 ≈ 11,1 %. После каждой вытянутой карты шансы меняются, как с настоящей колодой." },
      { q: "Карты повторяются?", a: "Нет, пока вы не соберёте колоду: вытянутая карта убирается, как при раздаче из настоящей колоды." },
      { q: "Чем колода на 36 карт отличается от 52?", a: "В 36-карточной колоде нет карт от двойки до пятёрки — только от шестёрки до туза в каждой из четырёх мастей. Её используют в «Дураке»." },
    ],
    en: [
      { q: "What are the odds of drawing an ace?", a: "From a full 52-card deck, 4/52 ≈ 7.7%; from 36 cards, 4/36 ≈ 11.1%. The odds change after every draw, just like a real deck." },
      { q: "Can a card come up twice?", a: "Not until you reshuffle: a drawn card is removed, as when dealing from a real deck." },
      { q: "What's a 36-card deck?", a: "It drops the twos to fives, leaving six to ace in each of the four suits. It's used in Durak, a popular card game in Russia and Central Asia." },
    ],
  },
  about: {
    ru: [
      "Виртуальная колода заменяет настоящую, когда карт нет под рукой: для фокусов, гаданий на удачу ради шутки, обучения вероятностям или выбора задания в игре.",
      "Каждая карта вытягивается случайно из оставшихся — это то же самое, что раздавать из идеально перемешанной колоды. Червы и бубны показаны красным, пики и трефы — чёрным.",
    ],
    en: [
      "The virtual deck stands in for a real one when you don't have cards to hand: for tricks, probability lessons or picking a challenge in a game.",
      "Each card is drawn at random from those left — the same as dealing from a perfectly shuffled deck. Hearts and diamonds are shown in red, spades and clubs in black.",
    ],
  },
};

export const yesNoTool: ToolDef = {
  slug: "yes-or-no",
  component: "random/yes-no",
  icon: "CircleHelp",
  name: { ru: "Да или нет", en: "Yes or no" },
  title: { ru: "Да или нет — случайный ответ онлайн", en: "Yes or No Generator — random answer online" },
  h1: { ru: "Да или нет — ответ онлайн", en: "Yes or no generator" },
  description: {
    ru: "Генератор ответа «Да или нет»: задайте вопрос и получите случайный ответ с шансом 50 %. Можно добавить «Может быть» — тогда у каждого ответа шанс одна треть.",
    en: "Yes or no generator: ask a question and get a random answer with a 50% chance each. Add “Maybe” for three answers with a one-in-three chance apiece.",
  },
  lead: { ru: "Задайте вопрос — генератор ответит «Да» или «Нет» с равными шансами.", en: "Ask a question — the generator answers Yes or No with equal odds." },
  keywords: {
    ru: ["да или нет", "ответ да нет", "рандом да нет", "магический шар"],
    en: ["yes or no", "yes no oracle", "random answer", "yes no wheel"],
  },
  howTo: {
    ru: [
      "Впишите вопрос — это необязательно, но так он сохранится в истории.",
      "Нажмите «Получить ответ» или Enter.",
      "Включите «Может быть», если нужен третий вариант.",
    ],
    en: [
      "Type your question — optional, but it will then be saved in the history.",
      "Press “Get an answer” or Enter.",
      "Turn on “Maybe” if you want a third option.",
    ],
  },
  faq: {
    ru: [
      { q: "Ответ как-то зависит от вопроса?", a: "Нет. Текст вопроса никуда не отправляется и не анализируется: ответ — чистая случайность с шансом 1/2 (или 1/3 с «Может быть»)." },
      { q: "Можно ли доверять ответу?", a: "Это жребий, а не совет. Он полезен, когда варианты равноценны, или чтобы понять свои желания: если ответ расстроил, вы уже знаете, чего хотели." },
      { q: "Чем это отличается от монетки?", a: "По сути ничем: тот же честный выбор из двух. Здесь сразу видно слово «Да» или «Нет», и вопросы сохраняются в истории." },
    ],
    en: [
      { q: "Does the answer depend on the question?", a: "No. The question isn't sent or analysed: the answer is pure chance, 1/2 each (or 1/3 each with Maybe)." },
      { q: "Should I trust the answer?", a: "It's a coin toss, not advice. It helps when options are equal, or to find out what you want: if the answer disappoints you, you already knew." },
      { q: "How is it different from a coin flip?", a: "Essentially it isn't: the same fair choice between two. Here you see Yes or No directly, and questions are kept in the history." },
    ],
  },
  about: {
    ru: [
      "Генератор «Да или нет» — быстрый способ сдвинуться с мёртвой точки, когда оба варианта одинаково хороши. Ответ выбирается криптографическим генератором браузера с равными шансами.",
      "История показывает вопросы и ответы, пока открыта страница, — удобно, если решаете несколько мелких дел подряд.",
    ],
    en: [
      "The yes or no generator gets you unstuck when both options are equally good. The answer is chosen by the browser's cryptographic generator with equal odds.",
      "The history lists your questions and answers while the page is open — handy for settling several small decisions in a row.",
    ],
  },
};

export const rpsTool: ToolDef = {
  slug: "rock-paper-scissors",
  component: "random/rps",
  icon: "Scissors",
  name: { ru: "Камень, ножницы, бумага", en: "Rock paper scissors" },
  title: { ru: "Камень, ножницы, бумага онлайн — игра с компьютером", en: "Rock Paper Scissors — play against the computer" },
  h1: { ru: "Камень, ножницы, бумага онлайн", en: "Rock paper scissors online" },
  description: {
    ru: "Игра «Камень, ножницы, бумага» против компьютера: ход соперника выбирается случайно и честно, ведётся счёт побед, поражений и ничьих, есть история раундов.",
    en: "Play rock paper scissors against the computer: its move is picked fairly at random, with a running score of wins, losses and draws and a history of rounds.",
  },
  lead: { ru: "Выберите камень, ножницы или бумагу — компьютер ответит случайным ходом.", en: "Choose rock, paper or scissors — the computer answers with a random move." },
  keywords: {
    ru: ["цу-е-фа", "камень ножницы бумага", "игра с компьютером"],
    en: ["rps", "rock paper scissors game", "roshambo"],
  },
  howTo: {
    ru: [
      "Нажмите на камень, ножницы или бумагу.",
      "Компьютер одновременно делает случайный ход — результат появится сразу.",
      "Счёт побед, поражений и ничьих обновляется после каждого раунда.",
    ],
    en: [
      "Click rock, paper or scissors.",
      "The computer makes a random move at the same time — the result shows at once.",
      "The score of wins, losses and draws updates after every round.",
    ],
  },
  faq: {
    ru: [
      { q: "Компьютер подглядывает мой ход?", a: "Нет. Его ход выбирается криптографическим генератором с шансом 1/3 для каждого варианта и не зависит от вашего выбора." },
      { q: "Какие правила?", a: "Камень тупит ножницы, ножницы режут бумагу, бумага накрывает камень. Одинаковые ходы — ничья." },
      { q: "Есть ли выигрышная стратегия?", a: "Против честно случайного соперника — нет: при любой стратегии шансы победы, поражения и ничьей равны 1/3." },
    ],
    en: [
      { q: "Does the computer see my move?", a: "No. Its move is chosen by a cryptographic generator with a 1/3 chance for each option, independent of yours." },
      { q: "What are the rules?", a: "Rock blunts scissors, scissors cut paper, paper covers rock. The same move on both sides is a draw." },
      { q: "Is there a winning strategy?", a: "Not against a truly random opponent: whatever you do, win, loss and draw each have a 1/3 chance." },
    ],
  },
  about: {
    ru: [
      "«Камень, ножницы, бумага» (цу-е-фа) — игра, которой решают споры по всему миру. Против компьютера она превращается в чистую удачу: он не подстраивается под ваши привычки.",
      "Людям трудно действовать случайно — многие чаще начинают с камня. Компьютер же выбирает каждый ход честно, поэтому на длинной дистанции счёт выравнивается.",
    ],
    en: [
      "Rock paper scissors settles arguments all over the world. Against the computer it becomes pure luck: it doesn't adapt to your habits.",
      "People struggle to act randomly — many open with rock. The computer picks every move fairly, so over many rounds the score evens out.",
    ],
  },
};

export const santaTool: ToolDef = {
  slug: "secret-santa-generator",
  component: "random/secret-santa",
  icon: "Gift",
  name: { ru: "Тайный Санта", en: "Secret Santa generator" },
  title: { ru: "Тайный Санта онлайн — жеребьёвка подарков", en: "Secret Santa Generator — draw names online" },
  h1: { ru: "Тайный Санта онлайн", en: "Secret Santa generator" },
  description: {
    ru: "Жеребьёвка «Тайного Санты» онлайн: никто не вытянет себя, пары-исключения не дарят друг другу, а каждый участник видит только своё сообщение о том, кому дарить.",
    en: "Secret Santa draw online: nobody draws themselves, excluded pairs never give to each other, and each person sees only their own message about who to buy for.",
  },
  lead: { ru: "Впишите участников и нажмите «Провести жеребьёвку» — каждому достанется один получатель.", en: "Enter the participants and press “Draw names” — everyone gets one person to buy for." },
  keywords: {
    ru: ["тайный санта", "жеребьёвка подарков", "обмен подарками", "секретный санта", "новогодний обмен"],
    en: ["secret santa", "gift exchange", "name draw", "kris kringle", "white elephant"],
  },
  howTo: {
    ru: [
      "Впишите участников — по одному имени на строку, имена должны различаться.",
      "При необходимости добавьте исключения: пары, которые не должны дарить друг другу.",
      "Нажмите «Провести жеребьёвку».",
      "Выберите участника — появится его сообщение «кому дарить»; скопируйте и отправьте ему лично.",
    ],
    en: [
      "Enter the participants — one name per line, all names different.",
      "Optionally add exclusions: pairs who must not give to each other.",
      "Press “Draw names”.",
      "Choose a participant to see their “who to buy for” message, then copy it and send it privately.",
    ],
  },
  faq: {
    ru: [
      { q: "Может ли кто-то вытянуть самого себя?", a: "Нет. Жеребьёвка выбирает случайную перестановку, в которой никто не дарит сам себе, — все такие варианты равновероятны." },
      { q: "Как сделать, чтобы супруги не дарили друг другу?", a: "Откройте «Исключения» и добавьте пару. Исключение действует в обе стороны." },
      { q: "Что будет, если исключений слишком много?", a: "Генератор проверит, возможна ли жеребьёвка вообще, и назовёт проблему — например, участника, которому некому дарить." },
      { q: "Как сохранить тайну?", a: "Не открывайте список целиком: выбирайте участника, копируйте его сообщение и отправляйте лично. Кнопка «Показать всех» нужна только организатору." },
      { q: "Имена куда-то отправляются?", a: "Нет, жеребьёвка проходит в вашем браузере. Сайт не хранит список и не рассылает сообщения — вы отправляете их сами." },
    ],
    en: [
      { q: "Can someone draw themselves?", a: "No. The draw picks a random permutation in which nobody gives to themselves, and every such arrangement is equally likely." },
      { q: "How do I stop partners drawing each other?", a: "Open “Exclusions” and add the pair. An exclusion works in both directions." },
      { q: "What if there are too many exclusions?", a: "The generator checks whether a draw is possible at all and tells you what's wrong — for example, a person with nobody left to give to." },
      { q: "How do I keep it secret?", a: "Don't reveal the whole list: choose a participant, copy their message and send it to them privately. “Show all” is for the organiser only." },
      { q: "Are the names sent anywhere?", a: "No, the draw runs in your browser. The site doesn't store the list or send any messages — you send them yourself." },
    ],
  },
  about: {
    ru: [
      "«Тайный Санта» — обмен подарками, в котором каждый дарит одному случайному человеку и не знает, кто дарит ему. Жеребьёвка онлайн заменяет бумажки в шапке и не даёт вытянуть себя.",
      "Можно задать пары-исключения — супругов, соседей по столу или тех, кто дарил друг другу в прошлом году. Генератор выбирает равновероятно среди всех допустимых вариантов и сообщает, если условия невыполнимы.",
    ],
    en: [
      "Secret Santa is a gift exchange where everyone buys for one random person without knowing who's buying for them. The online draw replaces slips of paper in a hat and never lets anyone draw themselves.",
      "Add exclusions for partners, flatmates or last year's pairs. The generator picks uniformly among all valid arrangements and tells you when the rules can't be satisfied.",
    ],
  },
};

export const dateTool: ToolDef = {
  slug: "random-date-generator",
  component: "random/date",
  icon: "CalendarDays",
  name: { ru: "Случайная дата", en: "Random date generator" },
  title: { ru: "Генератор случайных дат онлайн — дата в диапазоне", en: "Random Date Generator — pick a date in any range" },
  h1: { ru: "Генератор случайной даты", en: "Random date generator" },
  description: {
    ru: "Генератор случайных дат: выберите диапазон и получите до 50 дат, только будни или со случайным временем. Даты показываются полностью — с днём недели.",
    en: "Random date generator: choose a range and get up to 50 dates, weekdays only or with a random time. Dates are shown in full, including the day of the week.",
  },
  lead: { ru: "Укажите начало и конец диапазона и нажмите «Случайная дата».", en: "Set the start and end of the range and press “Random date”." },
  keywords: {
    ru: ["случайный день", "рандомная дата", "выбрать дату", "случайная дата в году"],
    en: ["random day", "date picker random", "random birthday", "random date in range"],
  },
  howTo: {
    ru: [
      "Укажите первую и последнюю дату диапазона — обе входят в выбор.",
      "Выберите, сколько дат нужно, и при необходимости «Только будни».",
      "Включите «Со временем», если нужен ещё и случайный час с минутами.",
      "Нажмите кнопку и скопируйте результат.",
    ],
    en: [
      "Set the first and last date of the range — both are included.",
      "Choose how many dates you need and, optionally, “Weekdays only”.",
      "Turn on “Include time” for a random hour and minute as well.",
      "Press the button and copy the result.",
    ],
  },
  faq: {
    ru: [
      { q: "Все дни выпадают одинаково часто?", a: "Да, каждый день диапазона равновероятен. С опцией «Только будни» равновероятен каждый день с понедельника по пятницу." },
      { q: "Для чего нужна случайная дата?", a: "Для тестовых данных, выбора дня для встречи или челленджа, вопросов в викторинах по истории и расписания дежурств." },
      { q: "Учитываются ли праздники?", a: "Нет, фильтр «Только будни» убирает только субботы и воскресенья. Праздничные дни разных стран не учитываются." },
    ],
    en: [
      { q: "Is every day equally likely?", a: "Yes, every day in the range has the same chance. With “Weekdays only”, every Monday to Friday is equally likely." },
      { q: "What is a random date good for?", a: "Test data, picking a day for a meet-up or a challenge, history quiz questions and duty rotas." },
      { q: "Are public holidays excluded?", a: "No, “Weekdays only” removes Saturdays and Sundays only. Public holidays differ by country and aren't taken into account." },
    ],
  },
  about: {
    ru: [
      "Генератор выбирает случайный день в любом диапазоне — от нескольких дней до столетий. По умолчанию подставлен текущий год.",
      "Даты считаются по календарю без учёта часовых поясов, поэтому результат не «съезжает» на соседний день. Формат даты — как принято в выбранном языке.",
    ],
    en: [
      "The generator picks a random day in any range, from a few days to centuries. The current year is filled in by default.",
      "Dates are calculated on the calendar without time zones, so the result never slips to the neighbouring day. Dates are formatted the way your language writes them.",
    ],
  },
};
