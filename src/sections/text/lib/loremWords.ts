/**
 * Word lists for the placeholder text generator. Written for this site
 * (public domain): real words only, grouped by part of speech so that the
 * generator can build grammatical sentences.
 */

/** Classic Lorem Ipsum vocabulary (from Cicero, "De finibus bonorum et malorum", 45 BC). */
export const LATIN = (
  "a ac accumsan ad adipiscing aenean aliquam aliquet amet ante aptent arcu at auctor augue bibendum blandit class commodo condimentum congue " +
  "consectetur consequat conubia convallis cras cubilia curabitur curae cursus dapibus diam dictum dictumst dignissim dis dolor donec dui duis " +
  "efficitur egestas eget eleifend elementum elit enim erat eros est et etiam eu euismod ex facilisi facilisis fames faucibus felis fermentum " +
  "feugiat finibus fringilla fusce gravida habitant habitasse hac hendrerit himenaeos iaculis id imperdiet in inceptos integer interdum ipsum " +
  "justo lacinia lacus laoreet lectus leo libero ligula litora lobortis lorem luctus maecenas magna magnis malesuada massa mattis mauris maximus " +
  "metus mi molestie mollis montes morbi mus nam nascetur natoque nec neque netus nibh nisi nisl non nostra nulla nullam nunc odio orci ornare " +
  "parturient pellentesque penatibus per pharetra phasellus placerat platea porta porttitor posuere potenti praesent pretium primis proin " +
  "pulvinar purus quam quis quisque rhoncus ridiculus risus rutrum sagittis sapien scelerisque sed sem semper senectus sit sociosqu sodales " +
  "sollicitudin suscipit suspendisse taciti tellus tempor tempus tincidunt torquent tortor tristique turpis ullamcorper ultrices ultricies " +
  "urna ut varius vehicula vel velit venenatis vestibulum vitae vivamus viverra volutpat vulputate"
).split(" ");

export const LATIN_OPENING = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

/* ───────────── Russian ───────────── */

/** Inanimate nouns, nominative singular, by gender. */
export const RU_NOUNS: Record<"m" | "f" | "n", string[]> = {
  m: (
    "проект процесс подход результат анализ метод принцип уровень рынок сервис продукт интерфейс опыт контроль баланс вектор формат механизм " +
    "алгоритм ресурс потенциал бюджет план отчёт график стандарт сценарий фактор элемент объём спрос рост прогресс диалог контекст аспект вывод " +
    "выбор запрос доступ профиль модуль каталог маршрут календарь прототип эксперимент инструмент ориентир приоритет компромисс сигнал импульс " +
    "ритм масштаб курс этап шаг темп режим порядок сегмент критерий показатель горизонт ландшафт фундамент каркас дизайн текст смысл образ стиль " +
    "жанр сюжет язык словарь ответ вопрос совет пример итог эффект вклад обмен поиск отбор прогноз запуск релиз выпуск раздел комментарий отзыв " +
    "договор регламент тариф бренд логотип баннер макет шаблон чертёж эскиз вариант случай момент период сезон квартал месяц"
  ).split(" "),
  f: (
    "задача система стратегия структура модель идея концепция команда программа платформа методика практика функция позиция точка цель основа " +
    "среда форма схема линия граница область сфера связь логика динамика гипотеза проблема ошибка версия копия таблица диаграмма карта страница " +
    "статья глава заметка история тема мысль возможность ценность скорость точность гибкость стабильность эффективность ответственность " +
    "инициатива перспектива тенденция аудитория кампания реклама стоимость выгода цена прибыль экономия нагрузка очередь деталь особенность " +
    "специфика композиция палитра интонация пауза волна энергия картина рамка опора мера норма роль дисциплина культура традиция привычка неделя " +
    "минута дорога площадка витрина база архитектура"
  ).split(" "),
  n: (
    "решение развитие направление значение качество пространство внимание взаимодействие понимание исследование изменение обновление сообщение " +
    "предложение событие явление условие правило мнение содержание оформление описание управление планирование обучение производство общество " +
    "приложение устройство средство свойство отношение преимущество соотношение сочетание окружение ощущение впечатление настроение задание " +
    "упражнение соглашение намерение ожидание требование сравнение влияние давление движение звучание продвижение вложение наполнение дело " +
    "слово место время имя поле окно звено число основание начало"
  ).split(" "),
};

/** Adjectives, masculine nominative singular (other forms are derived). */
export const RU_ADJECTIVES = (
  "новый современный важный ключевой основной главный общий простой сложный гибкий надёжный быстрый точный понятный ясный открытый внутренний " +
  "внешний последний следующий первый второй отдельный единый цифровой удобный полезный эффективный стабильный устойчивый долгосрочный " +
  "краткосрочный реальный конкретный практический творческий логический строгий широкий глубокий лёгкий тихий свежий хороший горячий спокойный " +
  "яркий чистый светлый тёплый прозрачный естественный разумный осознанный продуманный дополнительный базовый стандартный уникальный личный " +
  "частный публичный городской летний зимний весенний осенний утренний вечерний дневной ночной будущий прошлый нынешний текущий прежний живой " +
  "заметный существенный значительный небольшой большой крупный малый короткий длинный высокий низкий узкий тяжёлый мягкий твёрдый смелый " +
  "аккуратный внимательный честный независимый совместный гармоничный выразительный минималистичный классический актуальный доступный " +
  "привычный неожиданный очевидный скрытый прямой обратный средний крайний синий зелёный красный белый серый золотой"
).split(" ");

/** Transitive verbs: [3rd person singular, 3rd person plural], present tense. */
export const RU_VERBS: [string, string][] = (
  "определяет:определяют формирует:формируют поддерживает:поддерживают развивает:развивают создаёт:создают открывает:открывают меняет:меняют " +
  "улучшает:улучшают упрощает:упрощают усиливает:усиливают обеспечивает:обеспечивают задаёт:задают отражает:отражают показывает:показывают " +
  "объединяет:объединяют дополняет:дополняют укрепляет:укрепляют ускоряет:ускоряют раскрывает:раскрывают подчёркивает:подчёркивают " +
  "сохраняет:сохраняют учитывает:учитывают предлагает:предлагают описывает:описывают проверяет:проверяют запускает:запускают " +
  "выстраивает:выстраивают направляет:направляют связывает:связывают продвигает:продвигают оценивает:оценивают использует:используют " +
  "анализирует:анализируют планирует:планируют обновляет:обновляют стимулирует:стимулируют вдохновляет:вдохновляют упорядочивает:упорядочивают " +
  "выявляет:выявляют находит:находят получает:получают строит:строят ведёт:ведут несёт:несут видит:видят затрагивает:затрагивают " +
  "освещает:освещают иллюстрирует:иллюстрируют моделирует:моделируют настраивает:настраивают расширяет:расширяют сокращает:сокращают " +
  "снижает:снижают повышает:повышают координирует:координируют согласует:согласуют фиксирует:фиксируют собирает:собирают " +
  "распределяет:распределяют подготавливает:подготавливают дорабатывает:дорабатывают закрепляет:закрепляют отмечает:отмечают " +
  "демонстрирует:демонстрируют формулирует:формулируют обосновывает:обосновывают обсуждает:обсуждают решает:решают преодолевает:преодолевают " +
  "вызывает:вызывают порождает:порождают диктует:диктуют поясняет:поясняют делает:делают даёт:дают предполагает:предполагают " +
  "включает:включают заменяет:заменяют сопровождает:сопровождают принимает:принимают ставит:ставят"
)
  .split(" ")
  .map((p) => p.split(":") as [string, string]);

/** Sentence openers; the ones that need a comma already have it. */
export const RU_OPENERS = [
  "Безусловно,", "Кроме того,", "Таким образом,", "С другой стороны,", "Прежде всего,", "Тем не менее", "В свою очередь,", "Как правило,",
  "При этом", "Со временем", "Разумеется,", "Вместе с тем", "На практике", "В итоге", "По сути,", "Следовательно,", "Иначе говоря,",
  "В первую очередь", "Постепенно", "Сегодня", "Однако", "Поэтому", "Впрочем,", "Более того,", "В результате", "Теперь", "Возможно,",
  "Очевидно,", "Конечно,", "К счастью,", "Как видим,", "Нередко", "Порой", "Иногда", "Всё чаще", "Чаще всего",
];

export const RU_CONJUNCTIONS = [", а", ", и", ", но", ", поэтому", ", тогда как", ", при этом", ", и в то же время"];

/* ───────────── English ───────────── */

export const EN_NOUNS = (
  "project process approach result method principle level market service product interface experience balance vector format mechanism " +
  "algorithm resource budget plan report schedule standard scenario factor element volume demand growth progress dialogue context aspect " +
  "conclusion choice request access profile module catalog route calendar prototype experiment tool landmark priority compromise signal " +
  "rhythm scale course stage step pace mode order segment criterion indicator horizon landscape foundation framework design text meaning " +
  "image style genre story language answer question advice example outcome effect contribution exchange search forecast launch release " +
  "section comment review contract tariff brand logo banner layout template sketch option moment period season quarter month task system " +
  "strategy structure model idea concept team program platform practice function position goal basis environment form scheme line border " +
  "area sphere connection logic dynamic hypothesis problem version table chart map page article chapter note history topic thought " +
  "opportunity value speed accuracy flexibility stability efficiency initiative perspective trend audience campaign cost benefit price profit " +
  "load queue detail feature composition palette pause wave energy picture frame support measure norm role discipline culture tradition habit " +
  "week road venue showcase database architecture solution development direction quality space attention interaction understanding research " +
  "change update message proposal event phenomenon condition rule opinion content description management planning training production society " +
  "application device property relationship advantage ratio combination surrounding impression mood assignment agreement intention expectation " +
  "requirement comparison influence pressure movement promotion investment field window link number beginning"
).split(" ");

export const EN_ADJECTIVES = (
  "new modern important key main general simple complex flexible reliable fast accurate clear open internal external final next first second " +
  "separate unified digital convenient useful effective stable sustainable long-term short-term real specific practical creative logical strict " +
  "wide deep light quiet fresh good warm calm bright clean transparent natural reasonable conscious thoughtful additional basic standard unique " +
  "personal private public urban summer winter spring autumn morning evening daily nightly future past current previous lively noticeable " +
  "essential significant small large major minor short long high low narrow heavy soft solid bold careful attentive honest independent shared " +
  "harmonious expressive minimal classic relevant accessible familiar unexpected obvious hidden direct reverse average extreme blue green red " +
  "white grey golden steady gentle careful precise balanced elegant subtle vivid"
).split(" ");

/** [3rd person singular, base form] */
export const EN_VERBS: [string, string][] = (
  "defines:define shapes:shape supports:support develops:develop creates:create opens:open changes:change improves:improve simplifies:simplify " +
  "strengthens:strengthen ensures:ensure sets:set reflects:reflect shows:show combines:combine complements:complement reinforces:reinforce " +
  "accelerates:accelerate reveals:reveal highlights:highlight preserves:preserve considers:consider offers:offer describes:describe " +
  "checks:check launches:launch builds:build guides:guide connects:connect promotes:promote evaluates:evaluate uses:use analyzes:analyze " +
  "plans:plan updates:update stimulates:stimulate inspires:inspire organizes:organize identifies:identify finds:find receives:receive " +
  "leads:lead carries:carry sees:see touches:touch illustrates:illustrate models:model adjusts:adjust expands:expand reduces:reduce " +
  "lowers:lower raises:raise coordinates:coordinate captures:capture collects:collect distributes:distribute prepares:prepare refines:refine " +
  "secures:secure notes:note demonstrates:demonstrate formulates:formulate justifies:justify discusses:discuss solves:solve overcomes:overcome " +
  "causes:cause generates:generate dictates:dictate explains:explain makes:make gives:give assumes:assume includes:include replaces:replace " +
  "accompanies:accompany accepts:accept frames:frame"
)
  .split(" ")
  .map((p) => p.split(":") as [string, string]);

export const EN_OPENERS = [
  "However,", "In addition,", "As a result,", "On the other hand,", "First of all,", "Nevertheless,", "In turn,", "As a rule,", "At the same time,",
  "Over time,", "Of course,", "In practice,", "In the end,", "In essence,", "Therefore,", "In other words,", "Gradually,", "Today,", "Meanwhile,",
  "Moreover,", "Sometimes,", "Often,", "Fortunately,", "Clearly,", "Perhaps,", "Still,", "Above all,", "By contrast,", "For now,", "In most cases,",
];

export const EN_CONJUNCTIONS = [", and", ", but", ", while", ", so", ", yet", ", and at the same time"];
