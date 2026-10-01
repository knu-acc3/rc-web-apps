import type { ToolDef } from "@/registry/types";

export const keyboardTool: ToolDef = {
  slug: "keyboard-test",
  component: "test/keyboard",
  icon: "Keyboard",
  popular: true,
  wide: true,
  name: { ru: "Тест клавиатуры", en: "Keyboard test" },
  title: { ru: "Тест клавиатуры онлайн — проверка всех клавиш", en: "Keyboard test online — check every key and rollover" },
  h1: { ru: "Тест клавиатуры онлайн", en: "Keyboard test online" },
  description: {
    ru: "Нажимайте клавиши — они подсветятся на схеме полноразмерной клавиатуры. Левые и правые Shift, Ctrl, Alt, коды key, code, keyCode и тест одновременных нажатий.",
    en: "Press keys and watch them light up on a full-size layout. Tells left from right Shift, Ctrl and Alt, shows key, code and keyCode, and checks N-key rollover.",
  },
  lead: {
    ru: "Нажимайте любые клавиши: зажатые подсвечиваются синим, уже проверенные — зелёным.",
    en: "Press any key: held keys light up blue, keys you have already tested turn green.",
  },
  keywords: {
    ru: ["проверка клавиатуры", "проверить клавиатуру", "тест клавиш", "клавиатура онлайн", "гостинг", "nkro"],
    en: ["keyboard tester", "key test", "check keyboard", "ghosting test", "n-key rollover test"],
  },
  howTo: {
    ru: [
      "Щёлкните по схеме клавиатуры: пока тест в фокусе, пробел, стрелки и Backspace не прокручивают страницу.",
      "Нажмите по очереди все клавиши — проверенные станут зелёными, непроверенные останутся без подсветки.",
      "Зажмите несколько клавиш одновременно — счётчик покажет, сколько нажатий клавиатура передаёт за раз.",
      "Смотрите журнал событий: key, code, keyCode, location и признак автоповтора для каждого нажатия.",
    ],
    en: [
      "Click the keyboard picture: while the test has focus, space, arrows and Backspace won't scroll the page.",
      "Press every key in turn — tested keys turn green, untested ones stay unlit.",
      "Hold several keys at once — the counter shows how many presses the keyboard reports simultaneously.",
      "Watch the event log: key, code, keyCode, location and the auto-repeat flag for every press.",
    ],
  },
  about: {
    ru: [
      "Тест читает события keydown и keyup. Поле code указывает на физическую клавишу независимо от раскладки, поэтому левые и правые Shift, Ctrl, Alt и Win различаются, а подписи QWERTY и ЙЦУКЕН показаны на тех же клавишах.",
      "Число одновременных нажатий (rollover) ограничено самой клавиатурой: многие офисные модели в некоторых сочетаниях теряют третью-четвёртую клавишу — это гостинг. Игровые обычно поддерживают 6KRO или NKRO. Часть сочетаний, например Win+L, перехватывает система, и браузер их не видит.",
      "Fn обрабатывается внутри клавиатуры и в браузер не передаётся, как и мультимедийные кнопки на некоторых моделях. Клавиши, которых нет на схеме (F13–F24, ISO-клавиша у левого Shift, медиаклавиши), появятся списком под ней.",
    ],
    en: [
      "The test listens to keydown and keyup. The code property names the physical key regardless of layout, so left and right Shift, Ctrl, Alt and Win are told apart, and QWERTY and Cyrillic labels can share the same keys.",
      "How many keys register at once (rollover) is limited by the keyboard itself: many office models drop the third or fourth key in certain combinations — that's ghosting. Gaming keyboards usually offer 6KRO or NKRO. Some shortcuts, such as Win+L, are captured by the OS and never reach the browser.",
      "Fn is handled inside the keyboard and is never sent to the browser, and neither are media keys on some models. Keys that aren't on the picture (F13–F24, the ISO key next to left Shift, media keys) are listed below it.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему не подсвечивается клавиша Fn?",
        a: "Fn не формирует собственного кода: клавиатура меняет код другой клавиши (например, F1 превращается в «Громкость −»). Поэтому браузер никогда не получает нажатие самой Fn.",
      },
      {
        q: "Что такое гостинг и NKRO?",
        a: "Гостинг — когда при зажатии нескольких клавиш часть нажатий теряется. NKRO (n-key rollover) — поддержка любого числа одновременных нажатий, 6KRO — до шести клавиш плюс модификаторы. Зажмите 5–10 клавиш и посмотрите на счётчик «Максимум одновременно».",
      },
      {
        q: "Почему не видно Print Screen или сочетаний с Win?",
        a: "Их перехватывает операционная система: Print Screen в Windows 11 может открывать «Ножницы», Win+L блокирует компьютер. В Windows браузер часто получает Print Screen только как keyup — тест засчитывает и его. Это не неисправность клавиатуры.",
      },
      {
        q: "Чем отличаются key, code и keyCode?",
        a: "key — символ или название клавиши с учётом раскладки («й» или «q»), code — физическая клавиша (KeyQ), keyCode — устаревший числовой код, который браузеры сохраняют для совместимости со старыми сайтами.",
      },
      {
        q: "Как понять, что клавиша залипает?",
        a: "Нажмите и отпустите её: если после отпускания клавиша на схеме остаётся синей, событие keyup не пришло — контакт залипает. Признак автоповтора «да» при коротком нажатии тоже говорит о проблеме.",
      },
    ],
    en: [
      {
        q: "Why doesn't the Fn key light up?",
        a: "Fn has no code of its own: the keyboard changes the code of another key instead (F1 becomes Volume Down, for example). So the browser never receives a press of Fn itself.",
      },
      {
        q: "What are ghosting and NKRO?",
        a: "Ghosting is when some presses are lost while several keys are held. NKRO (n-key rollover) means any number of simultaneous keys register; 6KRO means six keys plus modifiers. Hold 5–10 keys and watch the “Max simultaneous” counter.",
      },
      {
        q: "Why don't Print Screen or Win shortcuts show up?",
        a: "The operating system captures them: Print Screen may open the Snipping Tool on Windows 11 and Win+L locks the PC. On Windows the browser often gets Print Screen only as a keyup, which the test still counts. This isn't a keyboard fault.",
      },
      {
        q: "What is the difference between key, code and keyCode?",
        a: "key is the character or key name for the current layout (“q” or “й”), code is the physical key (KeyQ), and keyCode is a deprecated numeric code browsers keep for old websites.",
      },
      {
        q: "How can I tell if a key is sticking?",
        a: "Press and release it: if it stays blue on the picture after release, no keyup arrived — the switch is sticking. An auto-repeat “yes” on a short tap also points to a problem.",
      },
    ],
  },
};

export const mouseTool: ToolDef = {
  slug: "mouse-test",
  component: "test/mouse",
  icon: "Mouse",
  name: { ru: "Проверка мыши", en: "Mouse test" },
  title: { ru: "Проверка мыши онлайн — кнопки, колёсико и двойной клик", en: "Mouse test online — buttons, scroll wheel and double click" },
  h1: { ru: "Проверка мыши онлайн", en: "Mouse test online" },
  description: {
    ru: "Проверьте все 5 кнопок мыши, колёсико и его шаг deltaY, двойной клик и ложные срабатывания быстрее 60 мс, а также примерную частоту опроса мыши в герцах.",
    en: "Check all 5 mouse buttons, the scroll wheel and its deltaY step, double clicks and switch chatter under 60 ms, plus an estimated mouse polling rate in Hz.",
  },
  lead: {
    ru: "Кликайте, крутите колёсико и водите мышью в области теста — схема покажет каждую кнопку.",
    en: "Click, scroll and move inside the test area — the diagram shows every button.",
  },
  keywords: {
    ru: ["тест мыши", "проверить мышь", "двойной клик мыши", "частота опроса мыши", "проверка колёсика"],
    en: ["mouse tester", "double click test", "mouse polling rate", "scroll wheel test", "mouse button test"],
  },
  howTo: {
    ru: [
      "Наведите курсор на область теста и нажмите левую, правую и среднюю кнопки — они подсветятся на схеме.",
      "Нажмите боковые кнопки «Назад» и «Вперёд»: внутри области они не переключат страницу.",
      "Покрутите колёсико вверх, вниз и, если оно умеет, вбок — тест покажет deltaY, deltaX и режим прокрутки.",
      "Быстро поводите мышью кругами 2–3 секунды, чтобы оценить частоту опроса.",
    ],
    en: [
      "Hover over the test area and press the left, right and middle buttons — they light up on the diagram.",
      "Press the Back and Forward side buttons: inside the area they won't navigate away.",
      "Scroll the wheel up, down and sideways if it tilts — the test shows deltaY, deltaX and the scroll mode.",
      "Move the mouse quickly in circles for 2–3 seconds to estimate the polling rate.",
    ],
  },
  about: {
    ru: [
      "Кнопки определяются по полю event.button: 0 — левая, 1 — средняя (колёсико), 2 — правая, 3 — «Назад», 4 — «Вперёд». Внутри области отключены контекстное меню, автопрокрутка средней кнопкой и переход по боковым кнопкам.",
      "Если одно нажатие превращается в двойной клик, это дребезг изношенного микропереключателя. Тест отмечает повторные нажатия одной кнопки быстрее 60 мс — пальцем так кликнуть практически невозможно.",
      "Частота опроса оценивается по отметкам времени событий pointermove (с промежуточными событиями getCoalescedEvents, если браузер их отдаёт). Это оценка: браузер может группировать события, а частоты выше 1000 Гц в браузере надёжно не измеряются.",
    ],
    en: [
      "Buttons are identified by event.button: 0 left, 1 middle (wheel), 2 right, 3 Back, 4 Forward. Inside the area the context menu, middle-click autoscroll and side-button navigation are disabled.",
      "If a single press turns into a double click, a worn micro-switch is chattering. The test flags repeated presses of the same button faster than 60 ms — practically impossible to do with a finger.",
      "The polling rate is estimated from pointermove timestamps (including intermediate getCoalescedEvents when the browser provides them). It's an estimate: browsers may batch events, and rates above 1000 Hz can't be measured reliably in a browser.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Мышь делает двойной клик вместо одного — что это?",
        a: "Чаще всего износ микропереключателя: контакт дребезжит и даёт два нажатия за 5–50 мс. Покликайте в области теста: если появляются предупреждения о слишком быстрых повторах, переключатель стоит заменить или сдать мышь по гарантии.",
      },
      {
        q: "Почему частота опроса ниже заявленной?",
        a: "Двигайте мышь быстро и непрерывно: при медленном движении событий меньше. Safari и некоторые браузеры отдают одно событие на кадр, тогда оценка упирается в частоту экрана (60–144 Гц). Беспроводные мыши в режиме экономии тоже снижают частоту.",
      },
      {
        q: "Что означает deltaMode?",
        a: "Единицы прокрутки: 0 — пиксели, 1 — строки, 2 — страницы. Chrome и Edge обычно сообщают пиксели, Firefox иногда строки. Размер шага зависит от браузера, масштаба и настроек системы.",
      },
      {
        q: "Боковые кнопки не срабатывают — почему?",
        a: "Проверьте, не назначены ли им другие действия в программе производителя (Logitech G Hub, Razer Synapse и т. п.). Если в этом тесте кнопки 3 и 4 не загораются, браузер их не получает.",
      },
    ],
    en: [
      {
        q: "My mouse double-clicks on a single click — why?",
        a: "Usually a worn micro-switch: the contact bounces and produces two presses 5–50 ms apart. Click in the test area: if warnings about too-fast repeats appear, the switch needs replacing or the mouse should go back under warranty.",
      },
      {
        q: "Why is the polling rate lower than advertised?",
        a: "Move the mouse quickly and continuously: slow movement produces fewer events. Safari and some browsers deliver one event per frame, so the estimate is capped at your refresh rate (60–144 Hz). Wireless mice in power-saving mode also report less often.",
      },
      {
        q: "What does deltaMode mean?",
        a: "The scroll unit: 0 pixels, 1 lines, 2 pages. Chrome and Edge usually report pixels, Firefox sometimes lines. The step size depends on the browser, zoom level and system settings.",
      },
      {
        q: "Why don't the side buttons work?",
        a: "Check whether they are remapped in the vendor software (Logitech G Hub, Razer Synapse and the like). If buttons 3 and 4 don't light up here, the browser isn't receiving them.",
      },
    ],
  },
};

export const touchTool: ToolDef = {
  slug: "touch-screen-test",
  component: "test/touch",
  icon: "Pointer",
  name: { ru: "Тест сенсорного экрана", en: "Touch screen test" },
  title: { ru: "Тест сенсорного экрана онлайн — проверка мультитача", en: "Touch screen test online — multi-touch checker" },
  h1: { ru: "Тест сенсорного экрана", en: "Touch screen test" },
  description: {
    ru: "Проверьте тачскрин телефона, планшета или ноутбука: каждое касание рисуется своим цветом со следом, счётчик одновременных касаний и значение maxTouchPoints.",
    en: "Check a phone, tablet or laptop touchscreen: each finger gets its own coloured circle and trail, plus live and maximum touch counts and maxTouchPoints.",
  },
  lead: {
    ru: "Коснитесь поля несколькими пальцами — каждое касание отобразится своим цветом.",
    en: "Touch the area with several fingers — each touch appears in its own colour.",
  },
  keywords: {
    ru: ["проверка тачскрина", "тест мультитача", "проверить сенсор", "сколько касаний поддерживает экран"],
    en: ["multitouch test", "touchscreen test", "touch points test", "digitizer test"],
  },
  howTo: {
    ru: [
      "Коснитесь поля одним пальцем и проведите линию — след покажет, нет ли зон, где касание пропадает.",
      "Приложите несколько пальцев одновременно: большое число в центре покажет, сколько касаний распознано.",
      "Проведите пальцем по краям и углам экрана — неработающие зоны чаще всего бывают там.",
      "Нажмите «Во весь экран», чтобы проверить всю поверхность, и «Очистить», чтобы начать заново.",
    ],
    en: [
      "Touch the area with one finger and draw a line — the trail reveals spots where the touch drops out.",
      "Put several fingers down at once: the big number in the centre shows how many touches are recognised.",
      "Run a finger along the edges and corners — dead zones are most common there.",
      "Press “Full screen” to test the whole surface and “Clear” to start again.",
    ],
  },
  about: {
    ru: [
      "Тест использует Pointer Events: у каждого касания свой идентификатор, поэтому пальцы не путаются. В поле отключены прокрутка и масштабирование жестами, чтобы браузер не перехватывал касания.",
      "navigator.maxTouchPoints — сколько одновременных касаний поддерживает устройство по данным браузера; у большинства смартфонов это 5 или 10. Если реально распознаётся меньше, возможна проблема с сенсором или защитным стеклом.",
      "Если линия прерывается в одном и том же месте, на сенсоре есть мёртвая зона. Фантомные касания — точки, которые появляются без пальца, — тоже будут видны на поле.",
    ],
    en: [
      "The test uses Pointer Events: every touch has its own id, so fingers never get mixed up. Scrolling and pinch-zoom are disabled inside the area so the browser doesn't swallow touches.",
      "navigator.maxTouchPoints is how many simultaneous touches the device supports according to the browser; most phones report 5 or 10. If fewer are actually recognised, the digitizer or a screen protector may be at fault.",
      "If a line keeps breaking at the same spot, the sensor has a dead zone. Ghost touches — points that appear with no finger — will also show up on the canvas.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Сколько касаний поддерживает мой телефон?",
        a: "Тест показывает значение maxTouchPoints, которое сообщает браузер. Проверьте на практике: приложите все пальцы, и счётчик «Максимум одновременно» покажет, сколько касаний реально распознано.",
      },
      {
        q: "Почему при нескольких касаниях срабатывают жесты системы?",
        a: "Системные жесты (три пальца в iPadOS, скриншот тремя пальцами на Android) обрабатываются раньше браузера. Отключите их в настройках жестов или используйте меньше пальцев.",
      },
      {
        q: "Работает ли тест со стилусом?",
        a: "Да. Стилус определяется как тип ввода «стилус», и для него показывается сила нажатия, если устройство её передаёт (Apple Pencil, S Pen, перья Windows Ink).",
      },
      {
        q: "Экран не реагирует в одном месте — что делать?",
        a: "Снимите защитное стекло или плёнку и повторите тест: пузыри и трещины часто мешают сенсору. Если мёртвая зона остаётся, это аппаратная неисправность сенсорного слоя (дигитайзера).",
      },
    ],
    en: [
      {
        q: "How many touches does my phone support?",
        a: "The test shows the maxTouchPoints value reported by the browser. Check it in practice: put all your fingers down and the “Max simultaneous” counter shows how many touches are really recognised.",
      },
      {
        q: "Why do system gestures fire with several fingers?",
        a: "OS gestures (three-finger gestures on iPadOS, three-finger screenshots on Android) are handled before the browser sees them. Turn them off in gesture settings or use fewer fingers.",
      },
      {
        q: "Does it work with a stylus?",
        a: "Yes. A stylus is detected as the “stylus” input type, and its pressure is shown when the device provides it (Apple Pencil, S Pen, Windows Ink pens).",
      },
      {
        q: "One spot doesn't respond — what now?",
        a: "Remove the screen protector and test again: bubbles and cracks often confuse the sensor. If the dead zone stays, the digitizer layer itself is faulty.",
      },
    ],
  },
};

export const gamepadTool: ToolDef = {
  slug: "gamepad-test",
  component: "test/gamepad",
  icon: "Gamepad2",
  name: { ru: "Проверка геймпада", en: "Gamepad test" },
  title: { ru: "Проверка геймпада онлайн — тест джойстика, стиков и кнопок", en: "Gamepad test online — controller buttons, sticks and drift" },
  h1: { ru: "Проверка геймпада онлайн", en: "Gamepad test online" },
  description: {
    ru: "Проверьте геймпад Xbox, PlayStation или другой контроллер: кнопки, аналоговые курки, стики с оценкой дрифта и вибрация. Несколько геймпадов сразу.",
    en: "Test an Xbox, PlayStation or other controller: buttons, analog triggers, sticks with a drift check and rumble. Several gamepads at once, nothing to install.",
  },
  lead: {
    ru: "Подключите геймпад и нажмите на нём любую кнопку — браузер показывает контроллер только после нажатия.",
    en: "Connect a controller and press any button on it — the browser only reveals a gamepad after an input.",
  },
  keywords: {
    ru: ["тест геймпада", "проверка джойстика", "дрифт стика", "проверить геймпад", "тест контроллера"],
    en: ["gamepad tester", "controller test", "stick drift test", "joystick test", "xbox controller test"],
  },
  howTo: {
    ru: [
      "Подключите геймпад по USB или Bluetooth.",
      "Нажмите на нём любую кнопку — появится карточка контроллера с кнопками, курками и стиками.",
      "Понажимайте кнопки и курки, покрутите стики: проверенные кнопки становятся зелёными.",
      "Отпустите стики и нажмите «Проверить дрифт» — за 3 секунды тест измерит отклонение в покое.",
    ],
    en: [
      "Connect the gamepad over USB or Bluetooth.",
      "Press any button on it — a controller card with buttons, triggers and sticks appears.",
      "Press the buttons and triggers and rotate the sticks: tested buttons turn green.",
      "Let go of the sticks and press “Check drift” — in 3 seconds the test measures the resting offset.",
    ],
  },
  about: {
    ru: [
      "Данные читаются через Gamepad API: страница опрашивает контроллер каждый кадр. Для геймпадов со стандартной раскладкой (Xbox, DualShock 4, DualSense и многие другие в Chrome и Edge) кнопки подписаны в обозначениях Xbox и PlayStation, у остальных показаны номера кнопок и осей.",
      "Дрифт стика — отклонение от центра, когда его никто не трогает. Смещение до 0,05 нормально и прячется в мёртвой зоне игр; значение выше 0,15 обычно заметно — персонаж или камера начинают двигаться сами.",
      "Вибрация работает через vibrationActuator: сейчас в Chrome и Edge для большинства геймпадов Xbox и PlayStation. Если браузер её не поддерживает, кнопка «Вибрация» неактивна.",
    ],
    en: [
      "Data comes from the Gamepad API: the page polls the controller every frame. For standard-mapping pads (Xbox, DualShock 4, DualSense and many others in Chrome and Edge) buttons are labelled with Xbox and PlayStation names; other pads show button and axis numbers.",
      "Stick drift is an offset from centre while nobody touches the stick. Up to 0.05 is normal and hidden by in-game dead zones; above 0.15 is usually noticeable — the character or camera starts moving on its own.",
      "Rumble uses vibrationActuator, currently supported in Chrome and Edge for most Xbox and PlayStation pads. If the browser doesn't support it, the Rumble button is disabled.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему геймпад не появляется?",
        a: "Ради приватности браузер показывает геймпад только после нажатия кнопки на нём, пока вкладка активна. Если не помогает, переподключите контроллер и проверьте, видит ли его система (в Windows — «Настройка USB-игровых контроллеров», команда joy.cpl).",
      },
      {
        q: "Как проверить дрифт стика?",
        a: "Положите геймпад, не трогайте стики и нажмите «Проверить дрифт». За 3 секунды тест запишет максимальное отклонение каждого стика: до 0,05 — дрифта нет, 0,05–0,15 — небольшое смещение, больше 0,15 — выраженный дрифт.",
      },
      {
        q: "Поддерживаются ли DualSense и DualShock?",
        a: "Да. Chrome и Edge распознают их со стандартной раскладкой по USB и Bluetooth. В Firefox раскладка может отличаться — тогда кнопки показываются номерами, но проверить каждую всё равно можно.",
      },
      {
        q: "Можно ли подключить несколько геймпадов?",
        a: "Да, каждый контроллер получает свою карточку. Chrome и Edge обычно показывают до четырёх геймпадов одновременно.",
      },
    ],
    en: [
      {
        q: "Why doesn't my gamepad show up?",
        a: "For privacy, browsers only reveal a gamepad after a button is pressed on it while the tab is active. If that doesn't help, reconnect the controller and check that the system sees it (on Windows run joy.cpl).",
      },
      {
        q: "How do I check for stick drift?",
        a: "Put the pad down, don't touch the sticks and press “Check drift”. In 3 seconds the test records each stick's largest offset: under 0.05 means no drift, 0.05–0.15 a slight offset, above 0.15 clear drift.",
      },
      {
        q: "Are DualSense and DualShock supported?",
        a: "Yes. Chrome and Edge recognise them with the standard mapping over USB and Bluetooth. In Firefox the mapping may differ — buttons are then shown by number, but you can still test every one.",
      },
      {
        q: "Can I connect several gamepads?",
        a: "Yes, each controller gets its own card. Chrome and Edge usually expose up to four gamepads at once.",
      },
    ],
  },
};
