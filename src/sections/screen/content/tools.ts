import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { flashesPerSecond, SOS_SECONDS, type FlashMode } from "../lib/flash";
import { PATTERN_TEXT, PATTERNS, type PatternId } from "../lib/patterns";

const tt = (l: Locale, ru: string, en: string) => (l === "ru" ? ru : en);

/** Keep a description within 200 characters by dropping trailing sentences. */
function fitDesc(...sentences: string[]): string {
  let out = sentences[0];
  for (const s of sentences.slice(1)) if (`${out} ${s}`.length <= 200) out = `${out} ${s}`;
  return out;
}

/* ───────────── flashing light ───────────── */

interface FlashVariant {
  mode: FlashMode;
  hz: number;
  ru: { name: string; title: string; h1: string; desc: string; lead: string; uses: string[] };
  en: { name: string; title: string; h1: string; desc: string; lead: string; uses: string[] };
}

const FLASH_VARIANTS: FlashVariant[] = [
  {
    mode: "strobe",
    hz: 3,
    ru: {
      name: "Стробоскоп",
      title: "Стробоскоп онлайн | эффект стробоскопа на экране",
      h1: "Стробоскоп онлайн",
      desc: "Стробоскоп на экране телефона или компьютера: короткие белые вспышки с регулируемой частотой, любой цвет вспышки, полноэкранный режим.",
      lead: "Короткие яркие вспышки на чёрном фоне с настраиваемой частотой — как у настоящего стробоскопа.",
      uses: ["Эффект для вечеринки и танцев в тёмной комнате.", "Сигнальный свет.", "Демонстрация стробоскопического эффекта на уроке физики."],
    },
    en: {
      name: "Strobe",
      title: "Strobe Light Online — Screen Strobe Effect",
      h1: "Strobe light online",
      desc: "A strobe light on your phone or computer screen: short white flashes at an adjustable rate, any flash colour, full screen.",
      lead: "Short bright flashes on black at an adjustable rate — like a real strobe.",
      uses: ["A party or dance effect in a dark room.", "A signal light.", "Showing the stroboscopic effect in a physics lesson."],
    },
  },
  {
    mode: "police",
    hz: 3,
    ru: {
      name: "Полицейская мигалка",
      title: "Полицейская мигалка онлайн | красно-синие вспышки",
      h1: "Полицейская мигалка на экране",
      desc: "Красно-синяя мигалка, как у полиции, на экране телефона или компьютера: двойные вспышки, регулируемая скорость, полноэкранный режим.",
      lead: "Две красные вспышки, две синие — как у полицейской машины. Скорость регулируется.",
      uses: ["Игра в полицейских для детей.", "Тематическая вечеринка или реквизит для видео.", "Яркий сигнал в темноте."],
    },
    en: {
      name: "Police lights",
      title: "Police Lights Online — Red and Blue Flashing Screen",
      h1: "Police lights on your screen",
      desc: "Red and blue police-style lights on your phone or computer screen: double flashes, adjustable speed, full screen.",
      lead: "Two red flashes, two blue ones — like a police car. The speed is adjustable.",
      uses: ["A cops-and-robbers game for kids.", "A theme party or a video prop.", "A bright signal in the dark."],
    },
  },
  {
    mode: "sos",
    hz: 2,
    ru: {
      name: "Сигнал SOS",
      title: "Сигнал SOS фонариком | SOS азбукой Морзе на экране",
      h1: "Сигнал SOS на экране",
      desc: "Сигнал бедствия SOS азбукой Морзе (··· — — — ···) вспышками экрана: три коротких, три длинных, три коротких и пауза. Любой цвет вспышки.",
      lead: "Экран мигает SOS азбукой Морзе: три коротких, три длинных, три коротких вспышки — международный сигнал бедствия.",
      uses: ["Сигнал о помощи в темноте, если нет фонарика.", "Обучение азбуке Морзе.", "Игры в поход и квесты."],
    },
    en: {
      name: "SOS signal",
      title: "SOS Light — SOS in Morse Code on Your Screen",
      h1: "SOS signal on your screen",
      desc: "The SOS distress signal in Morse code (··· — — — ···) flashed by your screen: three short, three long, three short and a pause. Any flash colour.",
      lead: "The screen flashes SOS in Morse code: three short, three long and three short flashes — the international distress signal.",
      uses: ["Signalling for help in the dark without a flashlight.", "Learning Morse code.", "Camping games and quests."],
    },
  },
  {
    mode: "party",
    hz: 2,
    ru: {
      name: "Цветомузыка",
      title: "Цветомузыка онлайн | дискотечный свет на экране",
      h1: "Цветомузыка на экране",
      desc: "Цветомузыка на экране: яркие цвета меняются в такт с выбранной частотой — дискотечный свет для вечеринки на телефоне, планшете или телевизоре.",
      lead: "Экран переливается яркими цветами — дискотечный свет для вечеринки. Частоту смены цветов можно подстроить под музыку.",
      uses: ["Вечеринка и дискотека дома.", "Подсветка для танцевального видео.", "Детский праздник."],
    },
    en: {
      name: "Party lights",
      title: "Party Lights Online — Disco Colour Screen",
      h1: "Party lights on your screen",
      desc: "Party lights on your screen: bright colours change at the rate you choose — disco light for a party on a phone, tablet or TV.",
      lead: "The screen cycles bright colours — disco light for a party. Match the change rate to the music.",
      uses: ["A house party or disco.", "Light for a dance video.", "A kids' party."],
    },
  },
];

function flashBlocks(v: FlashVariant): (l: Locale) => Block[] {
  return (l) => [
    {
      type: "facts",
      title: tt(l, "Коротко", "Quick facts"),
      rows: [
        [tt(l, "Режим", "Mode"), v[l].name],
        [tt(l, "Вспышек в секунду", "Flashes per second"), v.mode === "sos" ? tt(l, `по азбуке Морзе, сигнал длится ${SOS_SECONDS.toLocaleString("ru")} с`, `Morse timing, one signal lasts ${SOS_SECONDS} s`) : String(flashesPerSecond(v.mode, v.hz))],
        [tt(l, "Безопасный предел", "Safe limit"), tt(l, "до 3 вспышек в секунду", "up to 3 flashes per second")],
      ],
    },
    { type: "list", title: tt(l, "Где пригодится", "Where it helps"), items: v[l].uses },
  ];
}

export const flashingLightTool: ToolDef = {
  slug: "flashing-light",
  component: "screen/flash",
  icon: "Zap",
  name: { ru: "Мигающий свет", en: "Flashing light" },
  title: { ru: "Мигающий свет онлайн | мигающий экран на телефоне", en: "Flashing Light Online — Blinking Screen" },
  seoAlt: { ru: "мигающий экран", en: "blinking screen" },
  h1: { ru: "Мигающий свет онлайн", en: "Flashing light online" },
  description: {
    ru: "Мигающий экран на телефоне или компьютере: мигание, стробоскоп, полицейская мигалка, SOS, цветомузыка. Частота и цвет настраиваются, есть защита от слишком частых вспышек.",
    en: "A flashing screen on a phone or computer: blink, strobe, police lights, SOS and party colours. Adjustable rate and colour, with a guard against rapid flashing.",
  },
  lead: { ru: "Выберите режим и частоту — экран будет мигать на весь экран. Больше 3 вспышек в секунду включается только с подтверждением.", en: "Choose a mode and rate — the whole screen flashes. More than 3 flashes per second needs your confirmation." },
  keywords: { ru: ["мигающий свет", "мигающий экран", "мигалка онлайн", "стробоскоп", "фонарик мигающий"], en: ["flashing light", "blinking screen", "strobe online", "flashing screen"] },
  props: { mode: "blink" },
  howTo: {
    ru: ["Выберите режим: мигание, стробоскоп, мигалка, SOS, дискотека или два своих цвета.", "Настройте частоту и цвет, затем нажмите «Старт на весь экран» или F.", "Стрелки меняют частоту, пробел ставит на паузу, Esc — выход."],
    en: ["Pick a mode: blink, strobe, police, SOS, party or two colours of your own.", "Set the rate and colour, then press Start full screen or F.", "Arrows change the rate, Space pauses, Esc exits."],
  },
  about: {
    ru: [
      "Вспышки рисуются в такт с обновлением экрана, поэтому частота точная: 2 вспышки в секунду — это ровно 2. По умолчанию частота ограничена тремя вспышками в секунду: чаще — опасно для людей со светочувствительной эпилепсией (критерий WCAG 2.3.1). Чтобы увеличить её, нужно отметить подтверждение.",
      "Пока свет мигает, экран не гаснет. Панель управления прячется через пару секунд — коснитесь экрана, чтобы вернуть её.",
    ],
    en: [
      "Flashes are drawn in step with the screen refresh, so the rate is exact: 2 per second means 2. By default the rate is capped at three flashes per second — faster flashing is dangerous for people with photosensitive epilepsy (WCAG 2.3.1). Tick the confirmation to go higher.",
      "The display stays on while it flashes. The control bar hides after a couple of seconds — tap the screen to bring it back.",
    ],
  },
  faq: {
    ru: [
      { q: "Почему нельзя сразу поставить больше 3 вспышек в секунду?", a: "Частые вспышки, особенно красные и с большим контрастом, могут вызвать приступ у людей со светочувствительной эпилепсией. Поэтому быстрые режимы включаются только после подтверждения." },
      { q: "Можно ли сделать фонарик-мигалку на телефоне?", a: "Да: выберите «Мигание» белым цветом и поверните яркость телефона на максимум. Вспышку камеры сайт включать не может — это запрещено браузерам." },
      { q: "Работает ли на телевизоре?", a: "Да, если у телевизора есть браузер: откройте страницу и нажмите «Старт на весь экран». Можно также вывести экран компьютера на телевизор через HDMI." },
    ],
    en: [
      { q: "Why can't I go above 3 flashes per second right away?", a: "Rapid flashes, especially red and high-contrast ones, can trigger seizures in people with photosensitive epilepsy, so fast settings need a confirmation." },
      { q: "Can I make a flashing flashlight on my phone?", a: "Yes: choose Blink in white and turn phone brightness to maximum. Websites can't control the camera flash — browsers don't allow it." },
      { q: "Does it work on a TV?", a: "Yes, if the TV has a browser: open the page and press Start full screen. You can also mirror a computer to the TV over HDMI." },
    ],
  },
  related: ["white-screen", "mirror", "stuck-pixel-fix", "noise-generator"],
  variants: {
    title: { ru: "Режимы", en: "Modes" },
    list: (): VariantDef[] =>
      FLASH_VARIANTS.map((v) => ({
        slug: v.mode,
        name: { ru: v.ru.name, en: v.en.name },
        title: { ru: v.ru.title, en: v.en.title },
        h1: { ru: v.ru.h1, en: v.en.h1 },
        description: { ru: v.ru.desc, en: v.en.desc },
        lead: { ru: v.ru.lead, en: v.en.lead },
        props: { mode: v.mode },
        blocks: flashBlocks(v),
      })),
  },
};

/* ───────────── mirror ───────────── */

export const mirrorTool: ToolDef = {
  slug: "mirror",
  component: "screen/mirror",
  icon: "ScanFace",
  popular: true,
  name: { ru: "Зеркало онлайн", en: "Online mirror" },
  title: { ru: "Зеркало онлайн через камеру | зеркало на весь экран", en: "Online Mirror — Use Your Camera as a Mirror" },
  seoAlt: { ru: "зеркало с подсветкой", en: "mirror with light" },
  h1: { ru: "Зеркало онлайн", en: "Online mirror" },
  description: {
    ru: "Зеркало онлайн через фронтальную камеру: отражение как в настоящем зеркале, приближение, яркость, подсветка лица и стоп-кадр. Ничего не записывается.",
    en: "An online mirror from your front camera: a true mirror image, zoom, brightness, a face light frame and freeze frame. Nothing is recorded.",
  },
  lead: { ru: "Включите камеру — экран станет зеркалом. Можно приблизить, добавить подсветку лица и открыть на весь экран.", en: "Turn on the camera and your screen becomes a mirror. Zoom in, add a face light and go full screen." },
  keywords: { ru: ["зеркало онлайн", "зеркало через камеру", "зеркало на экране", "онлайн зеркало с подсветкой"], en: ["online mirror", "mirror camera", "webcam mirror", "mirror with light"] },
  howTo: {
    ru: ["Нажмите «Включить зеркало» и разрешите доступ к камере.", "Настройте приближение, яркость и подсветку лица.", "Нажмите «На весь экран»; пробел — стоп-кадр, M — отразить, Esc — выход."],
    en: ["Press Turn on the mirror and allow camera access.", "Adjust zoom, brightness and the face light.", "Press Full screen; Space freezes, M flips, Esc exits."],
  },
  about: {
    ru: [
      "Изображение с камеры показывается только на вашем экране: видео не записывается, не сохраняется и никуда не отправляется. После закрытия страницы камера выключается.",
      "Подсветка лица — белая рамка вокруг изображения: экран сам светит на лицо, как кольцевая лампа. Её оттенок можно сделать тёплым или холодным.",
    ],
    en: [
      "The camera image is only shown on your screen: video isn't recorded, saved or sent anywhere. The camera turns off when you close the page.",
      "The face light is a white frame around the picture: the screen itself lights your face like a ring light. Its tone can be warm or cool.",
    ],
  },
  faq: {
    ru: [
      { q: "Почему изображение отражено?", a: "Так выглядит настоящее зеркало: поднимете правую руку — отражение поднимет руку справа. Переключатель «Отражать как в зеркале» показывает, как вас видят другие." },
      { q: "Записывается ли видео?", a: "Нет. Сайт только выводит изображение с камеры на экран — записи и отправки нет. Это можно проверить, отключив интернет: зеркало продолжит работать." },
      { q: "Можно ли использовать заднюю камеру телефона?", a: "Да: если камер несколько, появится кнопка «Другая камера»." },
    ],
    en: [
      { q: "Why is the image flipped?", a: "That's how a real mirror looks: raise your right hand and the reflection raises the hand on the right. The Mirror image switch shows you as others see you." },
      { q: "Is the video recorded?", a: "No. The site only shows the camera image on your screen — nothing is recorded or sent. Switch off the internet to check: the mirror keeps working." },
      { q: "Can I use the phone's back camera?", a: "Yes: if there are several cameras, a Switch camera button appears." },
    ],
  },
  related: ["webcam-test", "white-screen", "screen-recorder"],
};

/* ───────────── stuck pixel fixer ───────────── */

export const stuckPixelTool: ToolDef = {
  slug: "stuck-pixel-fix",
  component: "screen/stuck-pixel",
  icon: "Sparkles",
  name: { ru: "Исправить застрявший пиксель", en: "Stuck pixel fixer" },
  title: { ru: "Исправить битый пиксель онлайн | оживить застрявший пиксель", en: "Stuck Pixel Fixer — Fix a Stuck Pixel Online" },
  seoAlt: { ru: "лечение битых пикселей", en: "fix stuck pixels" },
  h1: { ru: "Исправление застрявшего пикселя", en: "Stuck pixel fixer" },
  description: {
    ru: "Попробуйте оживить застрявший пиксель: быстрое мерцание цветов в квадрате над дефектом или на весь экран, таймер на 5–60 минут. Работает на мониторе и телефоне.",
    en: "Try to revive a stuck pixel: rapid colour flicker in a square over the defect or on the whole screen, with a 5–60 minute timer. Works on monitors and phones.",
  },
  lead: { ru: "Наведите мерцающий квадрат на застрявший пиксель и оставьте на 10–20 минут. Мёртвые (чёрные) пиксели так не оживают.", en: "Put the flickering square over the stuck pixel and leave it for 10–20 minutes. Dead (black) pixels can't be revived this way." },
  keywords: { ru: ["исправить битый пиксель", "вылечить битый пиксель", "застрявший пиксель", "jscreenfix онлайн", "убрать битый пиксель"], en: ["stuck pixel fixer", "fix stuck pixel", "jscreenfix", "dead pixel fix"] },
  howTo: {
    ru: ["Найдите дефект тестом битых пикселей: застрявший светится цветной точкой на чёрном.", "Отметьте подтверждение и нажмите «Запустить», перетащите квадрат на пиксель.", "Оставьте на 10–20 минут, не глядя на экран, потом проверьте снова."],
    en: ["Find the defect with the dead pixel test: a stuck pixel shows as a coloured dot on black.", "Tick the confirmation, press Start and drag the square onto the pixel.", "Leave it for 10–20 minutes without watching, then test again."],
  },
  about: {
    ru: [
      "Застрявший пиксель горит одним цветом, потому что жидкий кристалл в нём «залип» в одном положении. Быстрое переключение цветов заставляет его много раз менять положение — иногда после этого он снова начинает работать. Гарантии нет: помогает примерно в части случаев, чаще со свежими дефектами.",
      "Мёртвый пиксель (всегда чёрный) не оживает ничем — это обрыв транзистора. Если пиксель не исправился за час, обратитесь по гарантии. Мерцание опасно для людей со светочувствительной эпилепсией, поэтому запуск требует подтверждения.",
    ],
    en: [
      "A stuck pixel stays one colour because its liquid crystal is stuck in one position. Rapid colour changes make it switch many times, and sometimes it starts working again. There's no guarantee: it helps in some cases, more often with fresh defects.",
      "A dead pixel (always black) can't be revived — its transistor has failed. If the pixel isn't fixed within an hour, use the warranty. Flicker is dangerous for people with photosensitive epilepsy, so starting needs a confirmation.",
    ],
  },
  faq: {
    ru: [
      { q: "Как отличить застрявший пиксель от мёртвого?", a: "Застрявший светится красным, зелёным, синим или белым на чёрном фоне. Мёртвый — чёрная точка на белом. Исправлять мерцанием имеет смысл только застрявший." },
      { q: "Сколько времени держать?", a: "Начните с 10–20 минут. Если не помогло, можно повторить несколько раз; дольше часа подряд обычно смысла нет." },
      { q: "Не повредит ли это экрану?", a: "Нет: экран просто быстро показывает разные цвета, как в динамичной игре. Риск есть только для людей со светочувствительной эпилепсией — не смотрите на мерцание." },
    ],
    en: [
      { q: "How do I tell a stuck pixel from a dead one?", a: "A stuck pixel glows red, green, blue or white on black. A dead one is a black dot on white. Flicker only makes sense for stuck pixels." },
      { q: "How long should I run it?", a: "Start with 10–20 minutes. You can repeat a few times; more than an hour in one go rarely helps." },
      { q: "Can it damage the screen?", a: "No: the screen just shows fast-changing colours, like a busy game. The only risk is for people with photosensitive epilepsy — don't watch the flicker." },
    ],
  },
  related: ["dead-pixel-test", "monitor-test", "burn-in-test"],
};

/* ───────────── burn-in ───────────── */

export const burnInTool: ToolDef = {
  slug: "burn-in-test",
  component: "screen/burn-in",
  icon: "ScanEye",
  name: { ru: "Тест выгорания экрана", en: "Screen burn-in test" },
  title: { ru: "Тест выгорания экрана OLED | проверка остаточного изображения", en: "Screen Burn-In Test — Check OLED Image Retention" },
  seoAlt: { ru: "проверка выгорания экрана", en: "OLED burn-in check" },
  h1: { ru: "Тест выгорания экрана", en: "Screen burn-in test" },
  description: {
    ru: "Проверьте телефон или телевизор на выгорание OLED: серые и цветные заливки на весь экран, а для временного остаточного изображения — прогон цветов с таймером.",
    en: "Check a phone or TV for OLED burn-in with full-screen gray and colour fills, and clear temporary image retention with a timed colour cycle.",
  },
  lead: { ru: "На ровном сером фоне выгоревшие места видны как тени от значков и панелей. Временное остаточное изображение можно «смыть» прогоном цветов.", en: "On an even gray, burned-in areas show as shadows of icons and bars. Temporary image retention can be cleared with a colour cycle." },
  keywords: { ru: ["тест выгорания экрана", "проверка выгорания oled", "выгорание экрана телефона", "остаточное изображение на экране"], en: ["burn in test", "oled burn in test", "screen burn in check", "image retention fix"] },
  props: { mode: "check" },
  howTo: {
    ru: ["Выставьте яркость экрана на максимум и откройте «Проверить» на весь экран.", "Листайте заливки и ищите тени от клавиатуры, панели навигации, значков.", "Если тени слабые и пропадают, запустите «Прогнать цвета» на 10–30 минут."],
    en: ["Turn screen brightness to maximum and open Check full screen.", "Step through the fills and look for shadows of the keyboard, navigation bar or icons.", "If the shadows are faint and fading, run Cycle colours for 10–30 minutes."],
  },
  about: {
    ru: [
      "Выгорание (burn-in) — неравномерный износ пикселей OLED: места, где долго показывалась одна и та же картинка (панель навигации, клавиатура, логотип канала), светят слабее. На сером и цветных фонах это видно как тень. Настоящее выгорание необратимо.",
      "Остаточное изображение (image retention) похоже, но временно: оно исчезает само через минуты или часы. Прогон цветов ускоряет это. Он меняет цвет раз в секунду — это безопасно для людей со светочувствительностью.",
    ],
    en: [
      "Burn-in is uneven wear of OLED pixels: areas that showed the same image for long (navigation bar, keyboard, a channel logo) glow weaker. On gray and colour fills it shows as a shadow. Real burn-in is permanent.",
      "Image retention looks similar but is temporary: it fades by itself within minutes or hours, and a colour cycle speeds that up. The cycle changes colour once a second, which is safe for photosensitive people.",
    ],
  },
  faq: {
    ru: [
      { q: "Можно ли вылечить выгорание OLED?", a: "Нет: выгорание — это износ органических светодиодов. Программы могут только скрыть его (некоторые телевизоры выравнивают яркость функцией «обновление пикселей»). Временное остаточное изображение проходит само или после прогона цветов." },
      { q: "На каком цвете лучше видно выгорание?", a: "На сером 50 % и тёмно-сером — тени от значков видны лучше всего. Красный и синий показывают, какие субпиксели износились сильнее." },
      { q: "Бывает ли выгорание у ЖК-экранов?", a: "Классического выгорания у ЖК нет, но бывает временное остаточное изображение — оно проходит после выключения экрана или прогона цветов." },
    ],
    en: [
      { q: "Can OLED burn-in be fixed?", a: "No: burn-in is wear of the organic LEDs. Software can only hide it (some TVs even out brightness with a pixel refresh). Temporary image retention fades by itself or after a colour cycle." },
      { q: "Which colour shows burn-in best?", a: "50% and dark gray show icon shadows best. Red and blue show which subpixels wore more." },
      { q: "Do LCDs get burn-in?", a: "Not classic burn-in, but they can show temporary image retention, which fades after turning the screen off or a colour cycle." },
    ],
  },
  related: ["gray-screen", "dead-pixel-test", "stuck-pixel-fix", "monitor-test"],
  variants: {
    title: { ru: "Ещё", en: "More" },
    list: (): VariantDef[] => [
      {
        slug: "fix",
        name: { ru: "Убрать остаточное изображение", en: "Clear image retention" },
        title: { ru: "Как убрать остаточное изображение на экране | прогон цветов", en: "Clear Screen Image Retention — Colour Cycle Online" },
        h1: { ru: "Убрать остаточное изображение на экране", en: "Clear image retention on your screen" },
        description: {
          ru: "Прогон цветов на весь экран, чтобы убрать временное остаточное изображение на OLED и ЖК: смена цвета раз в секунду и бегущая белая полоса, таймер 5–60 минут.",
          en: "A full-screen colour cycle to clear temporary image retention on OLED and LCD: a colour change every second and a sweeping white bar, with a 5–60 minute timer.",
        },
        lead: { ru: "Запустите прогон на 10–30 минут — временное остаточное изображение обычно исчезает. Настоящее выгорание так не убрать.", en: "Run the cycle for 10–30 minutes — temporary retention usually fades. Real burn-in can't be removed this way." },
        props: { mode: "wash" },
        blocks: (l) => [
          {
            type: "facts",
            title: tt(l, "Как работает прогон", "How the cycle works"),
            rows: [
              [tt(l, "Цвета", "Colours"), tt(l, "красный, зелёный, синий, белый, чёрный", "red, green, blue, white, black")],
              [tt(l, "Смена цвета", "Colour change"), tt(l, "раз в секунду", "once a second")],
              [tt(l, "Белая полоса", "White bar"), tt(l, "проходит по экрану каждые 30 секунд", "sweeps across every 30 seconds")],
              [tt(l, "Длительность", "Duration"), tt(l, "5–60 минут, потом остановится сам", "5–60 minutes, then stops by itself")],
            ],
          },
        ],
      },
    ],
  },
};

/* ───────────── monitor test ───────────── */

export const monitorTestTool: ToolDef = {
  slug: "monitor-test",
  component: "screen/monitor",
  icon: "MonitorCheck",
  popular: true,
  name: { ru: "Тест монитора", en: "Monitor test" },
  title: { ru: "Тест монитора онлайн | проверка экрана: градиенты, гамма, засветы", en: "Monitor Test Online — Gradients, Gamma, Black Level, Bleed" },
  seoAlt: { ru: "проверка монитора", en: "screen test" },
  h1: { ru: "Тест монитора онлайн", en: "Online monitor test" },
  description: {
    ru: "Проверка монитора онлайн: градиенты, уровни чёрного и белого, гамма, чёткость, равномерность подсветки, засветы и цветные полосы — на весь экран.",
    en: "Test your monitor online: gradients, black and white levels, gamma, sharpness, backlight uniformity, bleed and colour bars — in full screen.",
  },
  lead: { ru: "Восемь тестовых картинок с подсказками: что должно быть видно на хорошем экране и что означают отклонения.", en: "Eight test patterns with tips on what a good screen shows and what deviations mean." },
  keywords: { ru: ["тест монитора", "проверка монитора онлайн", "тест экрана", "проверка матрицы монитора", "тест засветов"], en: ["monitor test", "screen test online", "lcd test", "display test"] },
  props: { pattern: "gradient" },
  howTo: {
    ru: ["Выберите тест и откройте его на весь экран (клавиша F).", "Сравните картинку с подсказкой под тестом.", "Стрелками ←/→ переходите к следующему тесту, Esc — выход."],
    en: ["Pick a test and open it full screen (F).", "Compare the picture with the tip below the test.", "Use ←/→ to move to the next test and Esc to exit."],
  },
  about: {
    ru: [
      "Тесты рисуются в реальном разрешении экрана: каждая линия в 1 пиксель — это ровно один пиксель монитора, поэтому видно настоящую чёткость, а не результат масштабирования. Для этого открывайте тест на весь экран.",
      "Уровни чёрного и белого показывают, теряет ли экран детали в тенях и светах; гамма — насколько правильно передаются полутона; градиенты — есть ли полосы; равномерность и засветы — качество подсветки.",
    ],
    en: [
      "Patterns are drawn at the screen's real resolution: every 1-pixel line is exactly one monitor pixel, so you see real sharpness rather than scaling. Open tests full screen for that.",
      "Black and white levels show whether the screen loses shadow and highlight detail; gamma, how midtones look; gradients, whether there's banding; uniformity and bleed, the quality of the backlight.",
    ],
  },
  faq: {
    ru: [
      { q: "Какой тест важнее при покупке монитора?", a: "Битые пиксели, засветы и равномерность подсветки — это дефекты, по которым монитор можно вернуть. Градиенты, гамма и уровни чёрного больше зависят от настроек." },
      { q: "Почему тест на весь экран выглядит иначе, чем в окне?", a: "В окне страница может быть масштабирована (например, 125 % в Windows), и линии в 1 пиксель размываются. На весь экран картинка рисуется по реальным пикселям." },
      { q: "Где проверить битые пиксели?", a: "Для этого есть отдельный тест битых пикселей с заливками чёрным, белым и основными цветами." },
    ],
    en: [
      { q: "Which test matters most when buying a monitor?", a: "Dead pixels, backlight bleed and uniformity are defects you can return a monitor for. Gradients, gamma and black level depend more on settings." },
      { q: "Why does the full-screen test look different from the window?", a: "In a window the page may be scaled (e.g. 125% in Windows) and 1-pixel lines blur. Full screen draws to real pixels." },
      { q: "Where do I check for dead pixels?", a: "There's a separate dead pixel test with black, white and primary colour fills." },
    ],
  },
  related: ["dead-pixel-test", "refresh-rate-test", "screen-resolution", "burn-in-test"],
  variants: {
    title: { ru: "Отдельные тесты", en: "Single tests" },
    list: (): VariantDef[] =>
      PATTERNS.map((id: PatternId) => {
        const [ru, ruTip] = PATTERN_TEXT[id].ru;
        const [en, enTip] = PATTERN_TEXT[id].en;
        const ruH1 = id === "backlight-bleed" ? "Тест засветов монитора" : `Тест монитора: ${ru.toLowerCase()}`;
        const enH1 = id === "backlight-bleed" ? "Backlight bleed test" : `Monitor test: ${en.toLowerCase()}`;
        return {
          slug: id,
          name: { ru, en },
          title: { ru: `${ruH1} | проверка экрана онлайн`, en: `${enH1} — Online Screen Check` },
          h1: { ru: ruH1, en: enH1 },
          description: {
            ru: fitDesc(`${ruH1} на весь экран, в реальном разрешении.`, ruTip, "Работает на мониторе, ноутбуке, телевизоре и телефоне."),
            en: fitDesc(`${enH1} in full screen at the real resolution.`, enTip, "Works on monitors, laptops, TVs and phones."),
          },
          lead: { ru: ruTip, en: enTip },
          props: { pattern: id },
          blocks: (l: Locale) => [{ type: "text", title: tt(l, "Что смотреть", "What to look for"), paragraphs: [l === "ru" ? ruTip : enTip, tt(l, "Откройте тест на весь экран: в окне масштаб страницы может размыть мелкие детали. Остальные тесты — в списке выше.", "Open the test full screen: in a window, page zoom can blur fine detail. The other tests are listed above.")] }],
        };
      }),
  },
};
