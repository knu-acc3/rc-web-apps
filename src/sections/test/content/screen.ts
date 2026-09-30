import type { ToolDef } from "@/registry/types";

export const deadPixelTool: ToolDef = {
  slug: "dead-pixel-test",
  related: ["screen-resolution", "screen-dpi"],
  component: "test/dead-pixel",
  icon: "Monitor",
  popular: true,
  name: { ru: "Тест битых пикселей", en: "Dead pixel test" },
  title: { ru: "Тест битых пикселей онлайн — проверка монитора и экрана", en: "Dead pixel test — check your screen for stuck pixels" },
  h1: { ru: "Тест битых пикселей", en: "Dead pixel test" },
  description: {
    ru: "Проверьте монитор, ноутбук или телефон на битые и застрявшие пиксели: заливка экрана чёрным, белым, красным, зелёным, синим и серым, переключение клавишами.",
    en: "Check a monitor, laptop or phone for dead and stuck pixels: full-screen black, white, red, green, blue and gray fills, switched by keyboard, click or tap.",
  },
  lead: {
    ru: "Откройте полноэкранную заливку и переключайте цвета — неисправный пиксель выделится точкой другого цвета.",
    en: "Open the full-screen fill and cycle through the colours — a faulty pixel stands out as a dot of the wrong colour.",
  },
  keywords: {
    ru: ["битые пиксели", "проверка монитора", "проверить экран на битые пиксели", "застрявший пиксель", "проверка матрицы"],
    en: ["stuck pixel test", "monitor test", "screen test", "check dead pixels", "pixel checker"],
  },
  howTo: {
    ru: [
      "Протрите экран, чтобы не принять пылинку за битый пиксель, и выставьте яркость на максимум.",
      "Нажмите «Начать тест» или цвет — экран заполнится заливкой в полноэкранном режиме.",
      "Переключайте цвета пробелом, стрелками, кликом или касанием и внимательно осмотрите весь экран, включая углы.",
      "Нажмите Esc или крестик вверху, чтобы выйти. Клавиши 1–6 сразу выбирают нужный цвет.",
    ],
    en: [
      "Wipe the screen so dust isn't mistaken for a dead pixel, and turn brightness up to maximum.",
      "Press “Start test” or a colour — the screen fills with it in full-screen mode.",
      "Switch colours with space, the arrow keys, a click or a tap, and inspect the whole screen including the corners.",
      "Press Esc or the cross at the top to exit. Keys 1–6 jump straight to a colour.",
    ],
  },
  about: {
    ru: [
      "Битый (мёртвый) пиксель не светится совсем и заметен как чёрная точка на белом и цветных фонах. Застрявший, наоборот, всегда горит одним цветом — красным, зелёным или синим — и лучше всего виден на чёрном фоне.",
      "На чёрной заливке ищите светящиеся точки, на белой — тёмные, на красной, зелёной и синей — точки, где не работает один из субпикселей. Серый фон помогает заметить неравномерность подсветки и «грязный экран» — пятна и полосы.",
      "Сайт не «лечит» пиксели. Застрявшие иногда восстанавливаются сами после нескольких часов работы, мёртвые — нет: это аппаратный дефект. Условия замены по гарантии зависят от производителя и магазина.",
    ],
    en: [
      "A dead pixel doesn't light up at all and shows as a black dot on white and coloured backgrounds. A stuck pixel is the opposite: it's always lit in one colour — red, green or blue — and is easiest to spot on black.",
      "On black look for lit dots, on white for dark ones, and on red, green and blue for dots where one subpixel isn't working. Gray helps reveal uneven backlight and the “dirty screen effect” — blotches and bands.",
      "This site doesn't “fix” pixels. Stuck pixels sometimes recover on their own after hours of use; dead ones don't — it's a hardware defect. Warranty replacement terms depend on the manufacturer and the shop.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Чем битый пиксель отличается от застрявшего?",
        a: "Битый пиксель не светится ни одним субпикселем и выглядит чёрной точкой. Застрявший постоянно горит одним цветом (часто красным или зелёным), потому что его транзистор не переключается. Застрявший иногда оживает, битый — нет.",
      },
      {
        q: "Сколько битых пикселей допустимо?",
        a: "Стандарт ISO 9241-307 делит матрицы на классы: в самом строгом дефекты не допускаются, а для массовых мониторов допускается несколько дефектных пикселей на миллион. Конкретное число, при котором монитор примут по гарантии, указано в политике производителя — уточняйте её до покупки.",
      },
      {
        q: "Можно ли вылечить пиксель программой?",
        a: "Мёртвый — нет. Застрявший иногда «оживает» после быстрого мерцания цветов или лёгкого массажа через мягкую ткань, но гарантии нет, а быстрое мерцание опасно для людей с фоточувствительной эпилепсией. Поэтому такой функции здесь нет.",
      },
      {
        q: "Почему на iPhone не открывается полноэкранный режим?",
        a: "Safari на iPhone не поддерживает полноэкранный режим для элементов страницы. Тест растягивает заливку на всё окно; чтобы спрятать панели браузера, поверните телефон горизонтально или добавьте сайт на экран «Домой».",
      },
    ],
    en: [
      {
        q: "What's the difference between a dead and a stuck pixel?",
        a: "A dead pixel has no working subpixels and looks like a black dot. A stuck pixel is permanently lit in one colour (often red or green) because its transistor no longer switches. Stuck pixels sometimes recover; dead ones don't.",
      },
      {
        q: "How many dead pixels are acceptable?",
        a: "ISO 9241-307 groups panels into classes: the strictest allows no defects, while mainstream monitors may have a few faulty pixels per million. The exact number that qualifies for a warranty swap is set by each manufacturer — check it before you buy.",
      },
      {
        q: "Can software fix a pixel?",
        a: "Not a dead one. A stuck pixel sometimes comes back after rapid colour flashing or gentle pressure through a soft cloth, but there's no guarantee, and rapid flashing is dangerous for people with photosensitive epilepsy — so this test doesn't offer it.",
      },
      {
        q: "Why doesn't full screen work on iPhone?",
        a: "Safari on iPhone doesn't support full screen for page elements. The test stretches the fill over the whole window; to hide the browser bars, turn the phone sideways or add the site to your Home Screen.",
      },
    ],
  },
};

export const refreshRateTool: ToolDef = {
  slug: "refresh-rate-test",
  related: ["screen-resolution"],
  component: "test/refresh-rate",
  icon: "Activity",
  name: { ru: "Частота обновления экрана", en: "Refresh rate test" },
  title: { ru: "Проверка герцовки монитора — частота обновления экрана в Гц", en: "Refresh rate test — check your monitor Hz online" },
  h1: { ru: "Проверка частоты обновления экрана", en: "Refresh rate test" },
  description: {
    ru: "Узнайте частоту обновления экрана в герцах: замер по requestAnimationFrame, медиана, разброс кадров, пропуски и ближайшая стандартная частота — 60, 120, 144 Гц.",
    en: "Find your screen refresh rate in Hz from requestAnimationFrame timing: median, jitter, dropped frames and the nearest standard rate such as 60, 120 or 144 Hz.",
  },
  lead: {
    ru: "Замер запускается сам и длится 5 секунд — не переключайте вкладку и не двигайте окно.",
    en: "The measurement starts by itself and takes 5 seconds — keep this tab in front and the window still.",
  },
  keywords: {
    ru: ["герцовка монитора", "сколько герц у монитора", "частота обновления", "проверить гц", "144 гц тест"],
    en: ["monitor hz test", "screen refresh rate", "check hz", "144hz test", "fps of monitor"],
  },
  howTo: {
    ru: [
      "Откройте страницу на мониторе, который хотите проверить, и подождите 5 секунд.",
      "Посмотрите частоту в герцах: крупно показана ближайшая стандартная частота, ниже — точное измерение.",
      "Если разброс большой или много пропущенных кадров, закройте тяжёлые вкладки и нажмите «Измерить снова».",
      "Сравните результат с настройками дисплея в системе — частоту можно поднять там же.",
    ],
    en: [
      "Open the page on the monitor you want to check and wait 5 seconds.",
      "Read the rate in hertz: the nearest standard rate is shown large, the exact measurement below it.",
      "If jitter is high or many frames were dropped, close heavy tabs and press “Measure again”.",
      "Compare the result with the display settings in your OS — that's also where you can raise the rate.",
    ],
  },
  about: {
    ru: [
      "Браузер вызывает requestAnimationFrame один раз перед отрисовкой каждого кадра, поэтому интервал между вызовами равен периоду обновления экрана: 16,7 мс при 60 Гц, 8,3 мс при 120 Гц, 6,9 мс при 144 Гц. Тест собирает интервалы за 5 секунд и берёт медиану — она устойчива к единичным задержкам.",
      "Результат показывает частоту, с которой рисует браузер, а не паспортную частоту монитора. Браузеры замедляют отрисовку в фоновых вкладках и в режиме энергосбережения (часто до 30 кадров/с), а Safari по умолчанию может ограничивать страницы 60 кадрами/с даже на экранах 120 Гц. С адаптивной синхронизацией (VRR, G-Sync, FreeSync) частота может «плавать».",
      "Если мониторов несколько, замер относится к тому, на котором находится окно браузера. Перетащите окно на другой экран и нажмите «Измерить снова».",
    ],
    en: [
      "The browser calls requestAnimationFrame once before painting each frame, so the gap between calls equals the display's refresh period: 16.7 ms at 60 Hz, 8.3 ms at 120 Hz, 6.9 ms at 144 Hz. The test collects intervals for 5 seconds and uses the median, which shrugs off occasional hiccups.",
      "The result is the rate the browser paints at, not the monitor's spec sheet. Browsers slow down background tabs and battery-saver modes (often to 30 fps), and Safari may cap pages at 60 fps by default even on 120 Hz screens. With variable refresh (VRR, G-Sync, FreeSync) the rate can drift.",
      "With several monitors, the measurement applies to the one the browser window is on. Drag the window to another screen and press “Measure again”.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему показывает 60 Гц, хотя монитор 144 Гц?",
        a: "Проверьте, что в системе выбрана 144 Гц (Windows: «Параметры → Система → Дисплей → Расширенные параметры дисплея»), кабель поддерживает эту частоту (DisplayPort или HDMI 2.0 и новее), а окно находится на нужном мониторе. В Safari ограничение 60 кадров/с может быть включено по умолчанию.",
      },
      {
        q: "Насколько точен тест?",
        a: "При стабильной работе медиана интервалов совпадает с реальной частотой с точностью до долей герца. Точность падает при высокой нагрузке, в фоновой вкладке и в режиме энергосбережения — тогда тест покажет большой разброс.",
      },
      {
        q: "Что такое пропущенные кадры?",
        a: "Интервалы, которые в полтора раза и более длиннее медианы: браузер не успел нарисовать кадр вовремя. Единичные пропуски нормальны, частые говорят о нагрузке на процессор или видеокарту.",
      },
      {
        q: "Что показывает разброс?",
        a: "Стандартное отклонение интервалов между кадрами в миллисекундах. Меньше 0,5 мс — очень ровно, больше 2 мс — неравномерная отрисовка, анимация может подёргиваться.",
      },
    ],
    en: [
      {
        q: "Why does it say 60 Hz when my monitor is 144 Hz?",
        a: "Make sure 144 Hz is selected in the OS (Windows: Settings → System → Display → Advanced display), the cable supports it (DisplayPort or HDMI 2.0 or newer) and the window is on that monitor. Safari may also cap pages at 60 fps by default.",
      },
      {
        q: "How accurate is the test?",
        a: "On a steady system the median interval matches the real rate to within a fraction of a hertz. Accuracy drops under heavy load, in a background tab and in battery-saver mode — the test then reports high jitter.",
      },
      {
        q: "What are dropped frames?",
        a: "Intervals at least 1.5 times longer than the median: the browser didn't manage to paint a frame on time. The odd drop is normal; frequent drops point to CPU or GPU load.",
      },
      {
        q: "What does jitter show?",
        a: "The standard deviation of frame intervals in milliseconds. Under 0.5 ms is very smooth; above 2 ms the pacing is uneven and animation may stutter.",
      },
    ],
  },
};
