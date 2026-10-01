/**
 * Texts for the typing test. Written specifically for this site (no third-party
 * copyrighted material). Only characters that exist on standard ЙЦУКЕН / QWERTY
 * layouts are used; "ё" may be typed as "е".
 */

export type TypingLang = "ru" | "en";

export const TYPING_TEXTS: Record<TypingLang, readonly string[]> = {
  ru: [
    "Утро началось с тумана. Над рекой висела белая дымка, и мост казался бесконечным. Через час солнце пробилось сквозь облака, и город наконец проснулся.",

    "Степь весной совсем не похожа на ту, что видят летом из окна поезда. В апреле она покрывается тюльпанами, и на несколько недель горизонт становится красным и жёлтым. Воздух пахнет полынью, над холмами кружат жаворонки, а по вечерам с гор спускается прохлада. Кто хоть раз видел это цветение, обязательно захочет вернуться.",

    "Свет от Солнца добирается до Земли примерно за восемь минут. Значит, мы всегда видим Солнце таким, каким оно было несколько минут назад. Со звёздами разница ещё заметнее: их свет летит к нам годами, а иногда тысячелетиями. Глядя на ночное небо, мы смотрим в прошлое.",

    "Чтобы испечь хороший хлеб, не нужно много продуктов: мука, вода, соль и немного дрожжей. Главное - время. Тесто должно спокойно подойти в тёплом месте, потом его нужно аккуратно сформовать и дать ему ещё немного постоять. Духовку разогревают заранее, а на дно ставят миску с водой: пар помогает корочке стать тонкой и хрустящей. Самое сложное - дождаться, пока буханка остынет, и не отрезать горячий ломоть сразу.",

    "Раскладка QWERTY появилась в 1870-х годах вместе с одной из первых пишущих машинок. Буквы расположили так, чтобы рычаги реже сталкивались при быстрой печати. Машинки давно уступили место компьютерам, но привычный порядок клавиш сохранился почти без изменений. Русская раскладка ЙЦУКЕН тоже пришла из эпохи пишущих машинок: самые частые буквы в ней собраны в центре, под указательными пальцами.",

    "Большое Алматинское озеро лежит в горах на высоте около двух с половиной тысяч метров. Его вода меняет цвет в течение дня: утром она кажется серо-голубой, а к полудню становится ярко-бирюзовой. Дорога к озеру петляет вдоль горной реки, и чем выше поднимаешься, тем холоднее и прозрачнее воздух.",

    "Вечерний город живёт в своём ритме. В окнах загорается свет, на остановках собираются люди, а у кофейни на углу выстраивается небольшая очередь. Кто-то спешит домой, кто-то только выходит на прогулку. Постепенно шум машин стихает, улицы пустеют, и становятся слышны шаги редких прохожих.",

    "Бег - один из самых простых видов спорта. Для него не нужны ни зал, ни дорогое снаряжение: достаточно удобной обуви и немного свободного времени. Начинать лучше с коротких дистанций и спокойного темпа, при котором можно разговаривать, не задыхаясь. Через несколько недель регулярных тренировок тело привыкнет к нагрузке, дыхание станет ровнее, а пробежка в пять километров перестанет казаться чем-то невозможным. Главное правило - слушать себя и не пытаться сразу побить все рекорды.",

    "Слепой десятипальцевый метод печати основан на простой идее: каждый палец отвечает за свои клавиши и не смотрит на клавиатуру. Указательные пальцы лежат на буквах А и О, на которых есть небольшие выступы. Сначала печать кажется медленной и неудобной, но уже через пару недель занятий руки начинают находить нужные клавиши сами. Скорость приходит позже, а в начале важнее всего точность.",

    "Осенний лес наполнен звуками. Под ногами шуршат листья, где-то стучит дятел, а над верхушками деревьев тянется клин птиц. Воздух прохладный и влажный, пахнет грибами и прелой листвой. В такие дни хорошо идти без цели, просто по тропинке, пока она не выведет к опушке, откуда видно поле и далёкую деревню.",

    "В старой библиотеке время будто течёт медленнее. Высокие стеллажи уходят под самый потолок, на полках стоят книги в выцветших переплётах, а в читальном зале слышен только шелест страниц. Библиотекарь знает, где лежит почти любой том, и может за минуту найти нужную книгу. Здесь можно просидеть весь день, переходя от одной истории к другой, и выйти на улицу, когда уже зажглись фонари.",

    "Международная космическая станция облетает Землю примерно за полтора часа. За сутки экипаж видит около шестнадцати восходов и столько же закатов. Жизнь на борту подчинена строгому расписанию: научные эксперименты, обслуживание оборудования, физические упражнения и сон по графику. Без тренажёров в невесомости быстро слабеют мышцы и кости, поэтому космонавты занимаются спортом каждый день. Воду на станции очищают и используют повторно, а связь с Землёй поддерживают почти круглосуточно.",
  ],
  en: [
    "The morning began with fog. A white haze hung over the river and the bridge seemed to go on forever. An hour later the sun broke through the clouds and the town finally woke up.",

    "The lighthouse stood on a rocky point at the end of a narrow road. For more than a century its light had guided ships past the reef, turning slowly through the night. These days the lamp works on its own, but visitors still climb the spiral stairs to look out over the grey water and imagine the keepers who once lived there.",

    "Light from the Moon reaches us in a little over one second, even though the Moon is about three hundred and eighty thousand kilometres away. Sunlight takes around eight minutes. Light from distant stars may travel for thousands of years, so when we look at the night sky we are really looking into the past.",

    "Good bread needs very few ingredients: flour, water, salt and a little yeast. What it really needs is time. The dough should rise slowly in a warm place, then be shaped gently and left to rest once more. Bakers often put a tray of water in the oven, because the steam helps the crust become thin and crisp. The hardest part is waiting for the loaf to cool before cutting the first slice.",

    "The QWERTY layout appeared in the 1870s together with one of the first commercial typewriters. The letters were arranged so that the metal arms would clash less often during fast typing. Typewriters have long since given way to computers, yet the familiar order of the keys has hardly changed.",

    "Honeybees share information in a surprising way. When a worker finds a good patch of flowers, she returns to the hive and performs a short dance. The angle of the dance shows the direction of the food relative to the sun, and its length hints at the distance. Other bees follow her movements and then fly out to find the flowers on their own.",

    "An octopus has three hearts and blue blood. Two of the hearts pump blood through the gills, while the third sends it around the rest of the body. Most of its neurons are found in the arms rather than the head, which lets each arm taste, touch and react on its own. Octopuses can change the colour and texture of their skin in a fraction of a second, and some have learned to open jars and slip out of tanks.",

    "The city changes after dark. Office windows go out one by one, while cafes and small shops glow along the street. Buses run less often, and the last train of the night carries a handful of tired passengers. By midnight the traffic has thinned, and you can hear footsteps echo between the buildings.",

    "Hiking in the mountains teaches patience. The trail climbs steadily through pine forest, crosses a cold stream and then opens onto a wide meadow full of wild flowers. Near the top the air is thin and every step takes a little more effort. The reward is the view: rows of peaks fading into the distance, a lake far below and the quiet sound of the wind. Experienced hikers always start early, carry more water than they think they need and turn back when the weather changes.",

    "Touch typing is based on a simple idea: each finger is responsible for its own group of keys, and your eyes stay on the screen. The index fingers rest on F and J, which have small bumps you can feel. At first it feels slow and awkward, but after a couple of weeks of practice your hands start to find the keys by themselves. Accuracy comes first; speed follows.",

    "Rain arrived in the afternoon. It started with a few heavy drops on the dusty pavement, and within minutes the whole street was shining. People hurried under shop awnings, a cyclist pulled up his hood, and the air suddenly smelled of wet earth. Half an hour later the clouds moved on, the sun came back and puddles reflected a clean blue sky.",

    "The old library seemed to move at its own pace. Tall shelves rose almost to the ceiling, filled with books in faded covers, and the only sound in the reading room was the turning of pages. The librarian knew where nearly every volume was kept and could find the one you needed in a minute. It was easy to spend a whole day there, drifting from one story to the next, and to step outside only when the street lamps were already on. Many regular visitors had their favourite tables by the tall windows, and some of them had been coming for years.",
  ],
};
