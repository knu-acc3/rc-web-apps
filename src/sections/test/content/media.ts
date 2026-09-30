import type { ToolDef } from "@/registry/types";

export const microphoneTool: ToolDef = {
  slug: "microphone-test",
  component: "test/microphone",
  icon: "Mic",
  popular: true,
  name: { ru: "Проверка микрофона", en: "Microphone test" },
  title: { ru: "Проверка микрофона онлайн — тест уровня и записи звука", en: "Microphone test online — check mic level and recording" },
  h1: { ru: "Проверка микрофона онлайн", en: "Microphone test online" },
  description: {
    ru: "Проверьте микрофон в браузере: уровень RMS и пик в dBFS, шумовой фон, спектр, запись 10 секунд с прослушиванием и выбор устройства. Звук никуда не отправляется.",
    en: "Test your mic in the browser: RMS and peak level in dBFS, noise floor, spectrum, a 10-second recording to play back and a device picker. Nothing is uploaded.",
  },
  lead: {
    ru: "Нажмите «Включить микрофон» и скажите пару слов — шкала покажет уровень сигнала, а запись даст услышать себя со стороны.",
    en: "Press “Start microphone” and say a few words — the meter shows your signal level, and a short recording lets you hear yourself.",
  },
  keywords: {
    ru: ["проверить микрофон", "тест микрофона", "работает ли микрофон", "проверка звука", "микрофон онлайн"],
    en: ["mic test", "test my microphone", "check mic", "microphone check"],
  },
  howTo: {
    ru: [
      "Нажмите «Включить микрофон» и разрешите доступ во всплывающем окне браузера.",
      "Если микрофонов несколько, выберите нужный в списке — названия устройств появятся после разрешения.",
      "Говорите обычным голосом: средний уровень должен держаться около −30…−15 dBFS, а пики не должны упираться в 0 dBFS.",
      "Помолчите пару секунд, чтобы оценить шумовой фон, затем запишите 10 секунд и прослушайте себя в наушниках.",
    ],
    en: [
      "Press “Start microphone” and allow access in the browser prompt.",
      "If you have several mics, pick one from the list — device names appear once access is granted.",
      "Speak normally: the average level should sit around −30…−15 dBFS and peaks should stay clear of 0 dBFS.",
      "Stay quiet for a couple of seconds to see the noise floor, then record 10 seconds and listen back with headphones.",
    ],
  },
  about: {
    ru: [
      "Тест работает через Web Audio API: сигнал с микрофона разбирает анализатор прямо в браузере, а запись хранится в памяти вкладки и исчезает, когда вы уходите со страницы. На сервер ничего не отправляется.",
      "dBFS — децибелы относительно полной шкалы: 0 dBFS — максимум, после которого сигнал обрезается (клиппинг). Речь на расстоянии 20–30 см обычно даёт −30…−15 dBFS по RMS, тишина в хорошей комнате — ниже −60 dBFS.",
      "Шумоподавление, эхоподавление и автоусиление — обработка, которую браузер применяет к звонкам. Выключите её, чтобы услышать «сырой» сигнал микрофона, или оставьте, чтобы понять, как вас слышат в Zoom, Meet и Discord в браузере.",
    ],
    en: [
      "The test runs on the Web Audio API: an analyser processes the mic signal right in your browser, and the recording lives in the tab's memory until you leave the page. Nothing is sent to a server.",
      "dBFS means decibels relative to full scale: 0 dBFS is the ceiling where the signal clips. Speech at 20–30 cm usually reads −30…−15 dBFS RMS, while silence in a quiet room is below −60 dBFS.",
      "Noise suppression, echo cancellation and auto gain are the processing browsers apply to calls. Turn them off to hear the raw mic signal, or keep them on to hear roughly what people get in browser-based Zoom, Meet or Discord.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему браузер не видит микрофон?",
        a: "Проверьте, что микрофон подключён и не выключен кнопкой на гарнитуре, а доступ разрешён в настройках сайта (значок слева от адреса). В Windows откройте «Параметры → Конфиденциальность и защита → Микрофон», в macOS — «Системные настройки → Конфиденциальность и безопасность → Микрофон» и разрешите доступ браузеру.",
      },
      {
        q: "Как снять запрет доступа к микрофону?",
        a: "В Chrome, Edge и Яндекс Браузере нажмите на значок слева от адреса, откройте настройки сайта и выберите «Разрешить» для микрофона, затем обновите страницу. В Firefox нажмите значок микрофона в адресной строке и снимите блокировку. В Safari: «Safari → Настройки для этого веб-сайта → Микрофон».",
      },
      {
        q: "Какой уровень сигнала считается нормальным?",
        a: "Для речи ориентируйтесь на средний уровень около −20 dBFS и пики −12…−6 dBFS. Если появляется надпись о перегрузке, отодвиньтесь или уменьшите усиление в системе; если речь едва поднимается выше −40 dBFS, микрофон слишком тихий.",
      },
      {
        q: "Записывается ли мой голос на сервер?",
        a: "Нет. Запись создаётся функцией MediaRecorder в памяти браузера и доступна только вам: её можно прослушать или скачать файлом. После закрытия страницы она удаляется.",
      },
      {
        q: "Что показывает шумовой фон?",
        a: "Уровень сигнала, когда вы молчите: гул вентилятора, шум улицы, собственные шумы микрофона. Тест берёт 10-й процентиль уровня за последние секунды. Ниже −60 dBFS — очень тихо, выше −40 dBFS — шум будет хорошо слышен в записи.",
      },
    ],
    en: [
      {
        q: "Why doesn't the browser see my microphone?",
        a: "Check that the mic is plugged in and not muted on the headset, and that the site is allowed to use it (icon to the left of the address). On Windows open Settings → Privacy & security → Microphone, on macOS System Settings → Privacy & Security → Microphone, and allow your browser.",
      },
      {
        q: "How do I unblock microphone access?",
        a: "In Chrome and Edge click the icon left of the address, open site settings and set Microphone to Allow, then reload. In Firefox click the microphone icon in the address bar and remove the block. In Safari use Safari → Settings for This Website → Microphone.",
      },
      {
        q: "What is a good microphone level?",
        a: "For speech aim for an average around −20 dBFS with peaks at −12…−6 dBFS. If the clipping warning appears, move back or lower the input gain; if speech barely rises above −40 dBFS, the mic is too quiet.",
      },
      {
        q: "Is my voice uploaded anywhere?",
        a: "No. The recording is made by MediaRecorder in browser memory and is only available to you to play back or download. It disappears when you close the page.",
      },
      {
        q: "What does the noise floor mean?",
        a: "It is the level while you are silent: fan hum, street noise, the mic's own hiss. The test takes the 10th percentile of recent levels. Below −60 dBFS is very quiet; above −40 dBFS the noise will be clearly audible in recordings.",
      },
    ],
  },
};

export const webcamTool: ToolDef = {
  slug: "webcam-test",
  component: "test/webcam",
  icon: "Camera",
  popular: true,
  name: { ru: "Проверка камеры", en: "Webcam test" },
  title: { ru: "Проверка камеры онлайн — тест веб-камеры, разрешение и FPS", en: "Webcam test online — check camera resolution and FPS" },
  h1: { ru: "Проверка камеры онлайн", en: "Webcam test online" },
  description: {
    ru: "Проверьте веб-камеру в браузере: реальное разрешение и FPS, режимы от 320×240 до 4K, выбор камеры, зеркало и снимок в PNG. Видео никуда не отправляется.",
    en: "Check your webcam in the browser: real resolution and FPS, supported modes from 320×240 to 4K, camera picker, mirror view and PNG snapshot. Nothing is uploaded.",
  },
  lead: {
    ru: "Включите камеру — сразу увидите картинку, её реальное разрешение и частоту кадров.",
    en: "Turn the camera on to see the live picture with its real resolution and frame rate.",
  },
  keywords: {
    ru: ["проверить камеру", "тест веб-камеры", "проверка вебки", "работает ли камера", "камера онлайн"],
    en: ["camera test", "test webcam", "check my camera", "webcam check online"],
  },
  howTo: {
    ru: [
      "Нажмите «Включить камеру» и разрешите доступ во всплывающем окне браузера.",
      "Если камер несколько (встроенная и USB), выберите нужную в списке.",
      "Посмотрите фактическое разрешение и FPS; кнопка «Проверить разрешения» покажет, какие режимы камера реально выдаёт.",
      "Нажмите «Снимок PNG», чтобы сохранить кадр в исходном разрешении.",
    ],
    en: [
      "Press “Start camera” and allow access in the browser prompt.",
      "If you have several cameras (built-in and USB), pick one from the list.",
      "Check the actual resolution and FPS; “Test resolutions” shows which modes the camera really delivers.",
      "Press “PNG snapshot” to save a frame at full resolution.",
    ],
  },
  about: {
    ru: [
      "Камера работает через getUserMedia: изображение выводится только на этой странице и никуда не передаётся. Когда вы нажимаете «Выключить» или закрываете вкладку, камера освобождается и индикатор на ней гаснет.",
      "Браузер сообщает фактические параметры потока — ширину, высоту и частоту кадров, а Chrome и Edge ещё и диапазоны возможностей камеры (getCapabilities). Отдельно тест считает реальные кадры в секунду, которые доходят до страницы.",
      "Проверка разрешений по очереди запрашивает стандартные режимы от 320×240 до 3840×2160. Chrome умеет масштабировать картинку, поэтому для честного результата тест просит режимы без масштабирования, если браузер это поддерживает.",
    ],
    en: [
      "The camera is accessed with getUserMedia: the picture is shown on this page only and never transmitted. When you press “Turn off” or close the tab, the camera is released and its light goes out.",
      "The browser reports the stream's actual width, height and frame rate, and Chrome and Edge also expose the camera's capability ranges (getCapabilities). The test additionally counts the real frames per second that reach the page.",
      "The resolution check requests standard modes from 320×240 to 3840×2160 one by one. Chrome can scale the picture, so for an honest answer the test asks for unscaled modes when the browser supports that.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему вместо картинки чёрный экран?",
        a: "Камеру может занимать другая программа — Zoom, Teams, OBS или Discord: закройте её. Проверьте шторку-заглушку и аппаратный выключатель на ноутбуке (часто это клавиша с перечёркнутой камерой). В Windows доступ должен быть разрешён в «Параметры → Конфиденциальность и защита → Камера».",
      },
      {
        q: "Как разрешить доступ к камере, если я нажал «Блокировать»?",
        a: "Chrome и Edge: значок слева от адреса → настройки сайта → Камера → «Разрешить», затем обновите страницу. Firefox: значок камеры в адресной строке → снять блокировку. Safari на Mac: «Safari → Настройки для этого веб-сайта → Камера». На iPhone: «Настройки → Safari → Камера».",
      },
      {
        q: "Почему FPS ниже заявленного?",
        a: "При слабом освещении многие камеры удлиняют выдержку и снижают частоту до 15–20 кадров/с. FPS падает и на высоких разрешениях через USB 2.0. Добавьте света и выберите 1280×720 — обычно это возвращает 30 кадров/с.",
      },
      {
        q: "Какое разрешение у моей камеры?",
        a: "После включения тест покажет фактическое разрешение потока и максимальные ширину и высоту из возможностей камеры. Встроенные камеры ноутбуков чаще всего снимают в 720p (1280×720) или 1080p (1920×1080).",
      },
      {
        q: "Собеседники видят меня зеркально?",
        a: "Нет. Зеркальный вид включён только для вас, как в зеркале, — так привычнее. Видеосервисы передают собеседникам незеркальное изображение. Снимок здесь сохраняется таким, каким вы его видите на экране.",
      },
    ],
    en: [
      {
        q: "Why do I see a black screen?",
        a: "Another app may be using the camera — Zoom, Teams, OBS or Discord; close it. Check the privacy shutter and any hardware camera switch on the laptop. On Windows access must be allowed in Settings → Privacy & security → Camera.",
      },
      {
        q: "How do I allow camera access after blocking it?",
        a: "Chrome and Edge: icon left of the address → Site settings → Camera → Allow, then reload. Firefox: camera icon in the address bar → remove the block. Safari on Mac: Safari → Settings for This Website → Camera. iPhone: Settings → Safari → Camera.",
      },
      {
        q: "Why is the frame rate lower than advertised?",
        a: "In dim light many webcams lengthen the exposure and drop to 15–20 fps. FPS also falls at high resolutions over USB 2.0. Add light and choose 1280×720 — that usually brings back 30 fps.",
      },
      {
        q: "What resolution is my camera?",
        a: "Once it's on, the test shows the stream's actual resolution and the maximum width and height from the camera's capabilities. Most built-in laptop cameras are 720p (1280×720) or 1080p (1920×1080).",
      },
      {
        q: "Do other people see me mirrored?",
        a: "No. The mirrored view is only for you, like looking in a mirror. Video-call services send the non-mirrored picture. The snapshot here is saved exactly as you see it on screen.",
      },
    ],
  },
};

export const speakerTool: ToolDef = {
  slug: "speaker-test",
  component: "test/speakers",
  icon: "Volume2",
  name: { ru: "Проверка динамиков", en: "Speaker test" },
  title: { ru: "Проверка динамиков и наушников онлайн — левый и правый канал", en: "Speaker test online — left and right channel, test tones" },
  h1: { ru: "Проверка динамиков и наушников", en: "Speaker and headphone test" },
  description: {
    ru: "Проверьте колонки и наушники: левый и правый канал, стереопанорама, генератор тона от 20 Гц до 20 кГц и свип по всем частотам. Звук создаётся в браузере.",
    en: "Test speakers and headphones: left and right channels, stereo panning, a 20 Hz – 20 kHz tone generator and a full-range sweep, all synthesised in the browser.",
  },
  lead: {
    ru: "Нажмите «Левый» или «Правый» — звук должен прозвучать только с этой стороны.",
    en: "Press “Left” or “Right” — the sound should come from that side only.",
  },
  keywords: {
    ru: ["проверка звука", "тест наушников", "левый правый канал", "проверка колонок", "генератор частот"],
    en: ["left right audio test", "headphone test", "stereo test", "tone generator", "sound test"],
  },
  howTo: {
    ru: [
      "Установите громкость в системе на 30–50 %: тест начинается с тихого сигнала.",
      "Нажмите «Левый», «Оба» и «Правый» — каждый сигнал должен звучать со своей стороны.",
      "Запустите панораму: звук плавно пройдёт слева направо и обратно без провалов.",
      "В генераторе тона выберите частоту ползунком или кнопками, чтобы проверить басы и высокие частоты, или запустите свип 20 Гц → 20 кГц.",
    ],
    en: [
      "Set the system volume to 30–50 %: the test starts with a quiet signal.",
      "Press “Left”, “Both” and “Right” — each sound should come from its own side.",
      "Start the pan: the sound should glide from left to right and back without dropouts.",
      "In the tone generator pick a frequency with the slider or presets to check bass and treble, or run the 20 Hz → 20 kHz sweep.",
    ],
  },
  about: {
    ru: [
      "Все звуки синтезируются Web Audio API прямо в браузере — никакие аудиофайлы не загружаются. Канал задаёт StereoPannerNode: сигнал уходит полностью влево, полностью вправо или поровну в оба канала.",
      "Если «Левый» звучит справа, перепутаны каналы: проверьте, правильно ли надеты наушники (L/R) и подключены колонки. Если звук одного канала слышен с обеих сторон, в системе включён монозвук.",
      "Человек слышит примерно от 20 Гц до 20 кГц, но с возрастом верхняя граница снижается до 15–16 кГц и ниже. Маленькие динамики ноутбуков и телефонов обычно не воспроизводят частоты ниже 100–150 Гц — это нормально.",
    ],
    en: [
      "All sounds are synthesised with the Web Audio API in your browser — no audio files are loaded. A StereoPannerNode routes each signal fully left, fully right or equally to both channels.",
      "If “Left” plays on the right, the channels are swapped: check that the headphones are on the right way (L/R) and the speakers are wired correctly. If a single channel is heard on both sides, mono audio is switched on in the system.",
      "Human hearing spans roughly 20 Hz to 20 kHz, but the upper limit drops to 15–16 kHz or lower with age. Small laptop and phone speakers usually can't reproduce anything below 100–150 Hz — that's normal.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему звук одного канала идёт из обоих динамиков?",
        a: "В системе включён монозвук. Windows 11: «Параметры → Специальные возможности → Звук → Монофонический звук». macOS: «Универсальный доступ → Аудио». iPhone: «Универсальный доступ → Аудиовизуальный элемент → Моно-аудио». Ещё Bluetooth-гарнитуры в режиме звонка иногда переходят в моно.",
      },
      {
        q: "Не опасен ли генератор тона для слуха и колонок?",
        a: "При разумной громкости — нет. Начинайте с тихого уровня: высокие частоты слышны хуже, и кажется, что нужно прибавить звук, а низкие (ниже 40 Гц) на большой громкости могут повредить маленькие динамики. По умолчанию громкость теста — 25 % ползунка, это примерно −24 дБ.",
      },
      {
        q: "Как узнать, до какой частоты я слышу?",
        a: "Запустите свип 20 Гц → 20 кГц или двигайте ползунок вверх и запомните частоту, на которой звук пропал. Это не медицинская проверка: результат зависит от наушников, громкости и звуковой карты.",
      },
      {
        q: "Звука нет совсем — что проверить?",
        a: "Убедитесь, что вкладка не заглушена, в системе выбрано правильное устройство вывода, а громкость не на нуле. Браузер воспроизводит звук только после нажатия кнопки на странице — просто нажмите «Левый» или «Правый».",
      },
      {
        q: "Можно ли проверить систему 5.1 или 7.1?",
        a: "Тест проверяет стереопару — левый и правый каналы. Внизу показано, сколько каналов вывода сообщает браузер, но раздельной проверки центрального, тыловых динамиков и сабвуфера здесь нет.",
      },
    ],
    en: [
      {
        q: "Why does one channel play from both speakers?",
        a: "Mono audio is on. Windows 11: Settings → Accessibility → Audio → Mono audio. macOS: Accessibility → Audio. iPhone: Accessibility → Audio/Visual → Mono Audio. Bluetooth headsets in call mode can also fall back to mono.",
      },
      {
        q: "Is the tone generator safe for my ears and speakers?",
        a: "At sensible volume, yes. Start quiet: high frequencies sound weaker so you're tempted to turn them up, and very low ones (below 40 Hz) at high volume can damage small speakers. The test volume defaults to 25 % on the slider, about −24 dB.",
      },
      {
        q: "How can I find the highest frequency I can hear?",
        a: "Run the 20 Hz → 20 kHz sweep or move the slider up and note where the sound disappears. This isn't a medical test: the result depends on your headphones, volume and sound card.",
      },
      {
        q: "I hear nothing at all — what should I check?",
        a: "Make sure the tab isn't muted, the right output device is selected in the system and the volume isn't at zero. Browsers only play sound after you press a button on the page — just press “Left” or “Right”.",
      },
      {
        q: "Can I test a 5.1 or 7.1 system?",
        a: "The test checks the stereo pair — left and right. It shows how many output channels the browser reports, but it doesn't test centre, surround or subwoofer channels separately.",
      },
    ],
  },
};
