import type { L10n } from "@/i18n/config";

/** Curated tone-generator frequencies with facts specific to each one. */
export interface ToneDef {
  hz: number;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  about: L10n;
  faq: { q: L10n; a: L10n };
}

export const TONES: ToneDef[] = [
  {
    hz: 20,
    title: { ru: "Тон 20 Гц онлайн — нижняя граница слуха", en: "20 Hz tone online — the lower limit of hearing" },
    h1: { ru: "Тон 20 Гц", en: "20 Hz tone" },
    description: {
      ru: "Синусоида 20 Гц — нижняя граница слышимого диапазона. Проверка сабвуфера и басовой отдачи наушников; длина волны около 17 метров, период 50 мс.",
      en: "A 20 Hz sine wave — the lower edge of human hearing. Test a subwoofer and headphone bass; the wavelength is about 17 metres and the period 50 ms.",
    },
    lead: { ru: "20 Гц — самый низкий звук, который человек ещё может услышать; его скорее чувствуют телом.", en: "20 Hz is the lowest sound people can still hear — it's felt as much as heard." },
    about: {
      ru: "На 20 Гц слух очень малочувствителен: чтобы звук был едва слышен, нужен уровень порядка 70–80 дБ. Воспроизводят такую частоту сабвуферы и хорошие мониторные наушники; динамики телефонов и ноутбуков — нет.",
      en: "Hearing is very insensitive at 20 Hz: a level of roughly 70–80 dB is needed just to hear it. Subwoofers and good studio headphones reproduce it; phone and laptop speakers don't.",
    },
    faq: {
      q: { ru: "Почему я не слышу 20 Гц?", en: "Why can't I hear 20 Hz?" },
      a: {
        ru: "Скорее всего, его не воспроизводит ваш динамик: маленькие динамики физически не могут качать такой бас. Попробуйте полноразмерные наушники или сабвуфер и увеличивайте громкость осторожно.",
        en: "Most likely your speaker can't play it: small drivers physically can't move that much air. Try over-ear headphones or a subwoofer, and raise the volume carefully.",
      },
    },
  },
  {
    hz: 50,
    title: { ru: "Звук 50 Гц онлайн — частота электросети", en: "50 Hz tone online — the mains frequency" },
    h1: { ru: "Тон 50 Гц", en: "50 Hz tone" },
    description: {
      ru: "Тон 50 Гц — частота электросети в России, Казахстане и Европе: так звучит сетевой гул в колонках. Сравните с фоном в аппаратуре, проверьте басы. Период 20 мс.",
      en: "A 50 Hz tone — the mains frequency in Europe, Russia and most of Asia, heard as hum in speakers. Compare it with hum in your gear or test bass. Period 20 ms.",
    },
    lead: { ru: "50 Гц — частота переменного тока в сети: этот низкий гул знаком по фону в колонках.", en: "50 Hz is the AC mains frequency — the low hum familiar from speaker background noise." },
    about: {
      ru: "В России, Казахстане, Европе и большей части Азии частота сети — 50 Гц, поэтому наводки в звуковой технике слышны на 50 Гц и кратных частотах (100, 150 Гц). Если гул в колонках совпадает с этим тоном, ищите причину в заземлении и кабелях.",
      en: "In Europe, Russia and most of Asia the mains frequency is 50 Hz, so interference in audio gear appears at 50 Hz and its multiples (100, 150 Hz). If the hum in your speakers matches this tone, look at grounding and cables.",
    },
    faq: {
      q: { ru: "Почему колонки гудят?", en: "Why do my speakers hum?" },
      a: {
        ru: "Чаще всего это наводка от сети: «земляная петля» между устройствами, воткнутыми в разные розетки, или плохо экранированный кабель. Помогает подключение всей техники к одной розетке или развязка по земле.",
        en: "Usually it's mains interference: a ground loop between devices on different outlets, or a poorly shielded cable. Plugging everything into one outlet or using a ground-loop isolator helps.",
      },
    },
  },
  {
    hz: 60,
    title: { ru: "Звук 60 Гц онлайн — частота сети в США", en: "60 Hz tone online — the US mains frequency" },
    h1: { ru: "Тон 60 Гц", en: "60 Hz tone" },
    description: {
      ru: "Тон 60 Гц — частота электросети в США, Канаде, Южной Корее и части Японии. Гул техники из этих стран, проверка сабвуфера. Период 16,7 мс, волна около 5,7 м.",
      en: "A 60 Hz tone — the mains frequency in the US, Canada, South Korea and part of Japan. Hum from gear made there, subwoofer tests. Period 16.7 ms, wave 5.7 m.",
    },
    lead: { ru: "60 Гц — частота переменного тока в Северной Америке; басовая нота около си контроктавы.", en: "60 Hz is the North American AC frequency — a bass note near B1." },
    about: {
      ru: "В Северной Америке, Южной Корее, на Тайване и в западной Японии сеть работает на 60 Гц, поэтому гул в записях оттуда звучит чуть выше, чем у нас. Как музыкальная нота 60 Гц — это си контроктавы (B1, 61,7 Гц) минус примерно 49 центов.",
      en: "North America, South Korea, Taiwan and western Japan run their grids at 60 Hz, so hum in recordings from there sounds slightly higher than 50 Hz hum. As a musical note, 60 Hz is about 49 cents below B1 (61.7 Hz).",
    },
    faq: {
      q: { ru: "Где в мире сеть 60 Гц, а где 50 Гц?", en: "Where is the grid 60 Hz and where 50 Hz?" },
      a: {
        ru: "60 Гц — Северная Америка, часть Южной Америки, Южная Корея, Тайвань, Филиппины и западная Япония. 50 Гц — Европа, Россия, Казахстан, большая часть Азии, Африки и Австралия.",
        en: "60 Hz: North America, parts of South America, South Korea, Taiwan, the Philippines and western Japan. 50 Hz: Europe, Russia, Kazakhstan, most of Asia and Africa, and Australia.",
      },
    },
  },
  {
    hz: 100,
    title: { ru: "Тон 100 Гц онлайн — проверка басов", en: "100 Hz tone online — bass test" },
    h1: { ru: "Тон 100 Гц", en: "100 Hz tone" },
    description: {
      ru: "Тон 100 Гц для проверки басов: с этой частоты примерно начинают звучать динамики ноутбуков. Также удвоенная частота сети — гул трансформаторов. Период 10 мс.",
      en: "A 100 Hz tone to test bass: roughly where laptop speakers start to produce sound. It's also twice the mains frequency — transformer hum. Period 10 ms.",
    },
    lead: { ru: "100 Гц — нижний бас: хорошая проверка, насколько низко играют колонки или наушники.", en: "100 Hz is low bass — a good test of how deep your speakers or headphones go." },
    about: {
      ru: "Трансформаторы и дроссели гудят на удвоенной частоте сети — 100 Гц: их магнитный сердечник сжимается дважды за период тока. Динамики ноутбуков и телефонов на 100 Гц обычно очень тихие, а полноразмерные наушники воспроизводят его уверенно.",
      en: "Transformers and chokes hum at twice the mains frequency — 100 Hz — because their core contracts twice per current cycle. Laptop and phone speakers are usually very quiet at 100 Hz, while over-ear headphones reproduce it confidently.",
    },
    faq: {
      q: { ru: "Слышно ли 100 Гц на телефоне?", en: "Can a phone play 100 Hz?" },
      a: {
        ru: "Слабо: маленький динамик почти не отдаёт такую частоту, и если звук есть, вы слышите в основном его искажения — обертоны. Для проверки басов подключите наушники или колонку.",
        en: "Barely: a tiny speaker hardly produces this frequency, and what you hear is mostly distortion overtones. Plug in headphones or a speaker to test bass.",
      },
    },
  },
  {
    hz: 200,
    title: { ru: "Тон 200 Гц онлайн — диапазон голоса", en: "200 Hz tone online — the voice range" },
    h1: { ru: "Тон 200 Гц", en: "200 Hz tone" },
    description: {
      ru: "Тон 200 Гц — область основного тона человеческого голоса: выше мужского, в нижней части женского. Близок к ноте соль малой октавы. Период 5 мс, волна 1,7 м.",
      en: "A 200 Hz tone — the fundamental range of the human voice: above most male voices, low for female ones. Close to the note G3. Period 5 ms, wavelength 1.7 m.",
    },
    lead: { ru: "200 Гц — частота в диапазоне голоса, близкая к соль малой октавы (G3).", en: "200 Hz sits in the voice range, close to the note G3." },
    about: {
      ru: "Основной тон мужской речи обычно около 85–180 Гц, женской — 165–255 Гц, поэтому 200 Гц звучит как невысокий женский или высокий мужской голос. Как нота — соль малой октавы (G3, 196 Гц) плюс 35 центов.",
      en: "The fundamental of male speech is typically about 85–180 Hz and of female speech 165–255 Hz, so 200 Hz sounds like a low female or high male voice. As a note it's G3 (196 Hz) plus 35 cents.",
    },
    faq: {
      q: { ru: "Какая нота ближе всего к 200 Гц?", en: "Which note is closest to 200 Hz?" },
      a: {
        ru: "Соль малой октавы (G3) — 196 Гц. 200 Гц выше неё на 35 центов, то есть примерно на треть полутона.",
        en: "G3 at 196 Hz. 200 Hz is 35 cents — about a third of a semitone — above it.",
      },
    },
  },
  {
    hz: 432,
    title: { ru: "Частота 432 Гц онлайн — «настройка Верди»", en: "432 Hz frequency online — “Verdi tuning”" },
    h1: { ru: "Тон 432 Гц", en: "432 Hz tone" },
    description: {
      ru: "Тон 432 Гц — альтернативная настройка ноты ля, на 32 цента ниже стандарта 440 Гц. Послушайте разницу; заявления о «целебности» научно не подтверждены.",
      en: "A 432 Hz tone — an A tuned 32 cents below the 440 Hz standard. Hear the difference; claims about its healing properties aren't supported by science.",
    },
    lead: { ru: "432 Гц — нота ля, настроенная на 32 цента ниже стандарта 440 Гц.", en: "432 Hz is an A tuned 32 cents below the 440 Hz standard." },
    about: {
      ru: "В XIX веке настройка оркестров сильно различалась, и за 432 Гц в Италии выступал в том числе Джузеппе Верди. Сегодня стандарт — 440 Гц (ISO 16). Утверждения о «природной гармонии» и лечебном действии 432 Гц не подтверждены исследованиями: разница с 440 Гц — меньше трети полутона.",
      en: "In the 19th century orchestral tuning varied widely, and Giuseppe Verdi was among those who advocated 432 Hz in Italy. Today the standard is 440 Hz (ISO 16). Claims of “natural harmony” or healing effects of 432 Hz aren't supported by research: the difference from 440 Hz is less than a third of a semitone.",
    },
    faq: {
      q: { ru: "Правда ли, что музыка в 432 Гц полезнее?", en: "Is music at 432 Hz better for you?" },
      a: {
        ru: "Нет надёжных доказательств. Это та же нота ля, лишь немного ниже; кому-то такая настройка просто нравится больше. Чтобы настроить инструмент на 432 Гц, выберите это значение в тюнере.",
        en: "There's no solid evidence. It's the same A, just slightly lower; some people simply prefer how it sounds. To tune an instrument to 432 Hz, pick that value in the tuner.",
      },
    },
  },
  {
    hz: 440,
    title: { ru: "Тон 440 Гц онлайн — нота ля первой октавы (A4)", en: "440 Hz tone online — the note A4" },
    h1: { ru: "Тон 440 Гц — нота ля", en: "440 Hz tone — the note A" },
    description: {
      ru: "Тон 440 Гц — нота ля первой октавы (A4), международный эталон настройки музыкальных инструментов по стандарту ISO 16. Камертон онлайн: период 2,27 мс.",
      en: "A 440 Hz tone — the note A4, the international tuning reference for musical instruments under ISO 16. An online tuning fork; period 2.27 ms.",
    },
    lead: { ru: "440 Гц — ля первой октавы, по этой ноте настраивают оркестры и инструменты.", en: "440 Hz is A4 — the note orchestras and instruments tune to." },
    about: {
      ru: "Стандарт 440 Гц для ноты ля первой октавы закреплён ISO 16 (1975). По нему звучит классический камертон и настроено большинство записей. Некоторые оркестры строят чуть выше — 442–443 Гц.",
      en: "The 440 Hz standard for A4 is set by ISO 16 (1975). It's the pitch of a classic tuning fork and the tuning of most recordings. Some orchestras tune slightly higher, at 442–443 Hz.",
    },
    faq: {
      q: { ru: "Как настроить гитару по тону 440 Гц?", en: "How do I tune a guitar to 440 Hz?" },
      a: {
        ru: "440 Гц — это первая струна (ми) на 5-м ладу. Подстройте её до совпадения с тоном — пропадут «биения», — затем остальные струны по ладам. Проще воспользоваться тюнером с микрофоном.",
        en: "440 Hz is the first (high E) string at the 5th fret. Tune it until the beating disappears, then tune the other strings by frets. The microphone tuner is even easier.",
      },
    },
  },
  {
    hz: 528,
    title: { ru: "Частота 528 Гц онлайн — «частота сольфеджио»", en: "528 Hz frequency online — the “solfeggio” tone" },
    h1: { ru: "Тон 528 Гц", en: "528 Hz tone" },
    description: {
      ru: "Тон 528 Гц из набора «частот сольфеджио». Близок к до второй октавы (C5). Послушайте чистый тон; заявления о «восстановлении ДНК» не имеют научной основы.",
      en: "A 528 Hz tone from the “solfeggio frequencies” set, close to C5. Listen to a pure tone; claims about “DNA repair” have no scientific basis.",
    },
    lead: { ru: "528 Гц — тон чуть выше ноты до второй октавы (C5, 523,25 Гц).", en: "528 Hz is a tone just above C5 (523.25 Hz)." },
    about: {
      ru: "«Частоты сольфеджио» (396, 417, 528 Гц и др.) популярны в роликах для медитации, но исторически с сольфеджио не связаны, а обещания лечебного эффекта не подтверждены исследованиями. Музыкально 528 Гц — это до второй октавы плюс 16 центов.",
      en: "The “solfeggio frequencies” (396, 417, 528 Hz and others) are popular in meditation videos but have no real link to historical solfège, and promised healing effects aren't supported by research. Musically, 528 Hz is C5 plus 16 cents.",
    },
    faq: {
      q: { ru: "Помогает ли 528 Гц для здоровья?", en: "Does 528 Hz help health?" },
      a: {
        ru: "Доказательств нет. Спокойный тон может помочь расслабиться, как и любой приятный звук, но особых свойств у 528 Гц не обнаружено.",
        en: "There's no evidence. A calm tone can help you relax, like any pleasant sound, but no special properties of 528 Hz have been found.",
      },
    },
  },
  {
    hz: 1000,
    title: { ru: "Тон 1000 Гц онлайн — испытательный сигнал 1 кГц", en: "1000 Hz tone online — the 1 kHz test signal" },
    h1: { ru: "Тон 1000 Гц", en: "1000 Hz tone" },
    description: {
      ru: "Тон 1 кГц — стандартный испытательный сигнал: калибровка уровней, проверка каналов, «писк» цензуры в эфире. Период ровно 1 мс, длина волны 34 см.",
      en: "A 1 kHz tone — the standard test signal: level calibration, channel checks and the broadcast censor “bleep”. Period exactly 1 ms, wavelength 34 cm.",
    },
    lead: { ru: "1000 Гц — эталонный испытательный тон звукотехники: период ровно одна миллисекунда.", en: "1000 Hz is audio engineering's reference test tone: a period of exactly one millisecond." },
    about: {
      ru: "От 1 кГц отсчитывают кривые равной громкости (ISO 226) и калибруют звукоизмерительные приборы. Тон 1 кГц используют для проверки уровней на пультах, «пищат» им на телевидении, заглушая брань, а в этой программе удобно проверить левый и правый каналы.",
      en: "Equal-loudness contours (ISO 226) are referenced to 1 kHz and sound level meters are calibrated at it. 1 kHz tones are used to line up mixing desks and to bleep out swearing on TV — and here, to check left and right channels.",
    },
    faq: {
      q: { ru: "Почему для проверок используют именно 1000 Гц?", en: "Why is 1000 Hz used for testing?" },
      a: {
        ru: "Это удобная круглая частота в середине слышимого диапазона, к которой слух достаточно чувствителен и которую без искажений воспроизводит почти любая техника — от телефона до студийных мониторов.",
        en: "It's a convenient round frequency in the middle of the audible range, where hearing is sensitive and almost any equipment — from phones to studio monitors — reproduces it cleanly.",
      },
    },
  },
  {
    hz: 2000,
    title: { ru: "Тон 2000 Гц онлайн — зона высокой чувствительности слуха", en: "2000 Hz tone online — where hearing is most sensitive" },
    h1: { ru: "Тон 2000 Гц", en: "2000 Hz tone" },
    description: {
      ru: "Тон 2 кГц: с этой области начинается диапазон наибольшей чувствительности слуха (2–5 кГц), поэтому писк на ней кажется громким. Период 0,5 мс, волна 17 см.",
      en: "A 2 kHz tone: the start of the ear's most sensitive range (2–5 kHz), which is why a beep here seems loud. Period 0.5 ms, wavelength 17 cm.",
    },
    lead: { ru: "2 кГц — частота, на которой звук кажется громче, чем на басах той же мощности.", en: "At 2 kHz a sound seems louder than bass of the same power." },
    about: {
      ru: "Слух наиболее чувствителен примерно на 2–5 кГц — частично из-за резонанса слухового прохода около 3 кГц. Поэтому сигналы бытовой техники и будильники часто делают в этом диапазоне, а согласные звуки речи, от которых зависит разборчивость, тоже лежат здесь.",
      en: "Hearing is most sensitive around 2–5 kHz, partly because of the ear canal's resonance near 3 kHz. That's why appliance beeps and alarms often sit in this range, and the consonants that make speech intelligible live here too.",
    },
    faq: {
      q: { ru: "Почему писк 2 кГц так раздражает?", en: "Why is a 2 kHz beep so irritating?" },
      a: {
        ru: "Потому что на этих частотах слух особенно чувствителен: при той же мощности звук кажется заметно громче, чем на 100 Гц. Держите громкость низкой.",
        en: "Because hearing is especially sensitive there: at the same power it sounds much louder than 100 Hz. Keep the volume low.",
      },
    },
  },
  {
    hz: 8000,
    title: { ru: "Тон 8000 Гц онлайн — проверка слуха на высоких частотах", en: "8000 Hz tone online — high-frequency hearing check" },
    h1: { ru: "Тон 8000 Гц", en: "8000 Hz tone" },
    description: {
      ru: "Тон 8 кГц — верхняя частота стандартной аудиометрии (250–8000 Гц). Простая проверка высоких частот наушников и слуха; не заменяет обследование у сурдолога.",
      en: "An 8 kHz tone — the top frequency of standard audiometry (250–8000 Hz). A simple check of headphone treble and hearing; it doesn't replace a real hearing test.",
    },
    lead: { ru: "8 кГц — высокий писк, который слышит большинство людей любого возраста.", en: "8 kHz is a high whistle most people of any age can hear." },
    about: {
      ru: "Стандартная тональная аудиометрия проверяет слух на частотах от 250 до 8000 Гц. Снижение слуха на 4–8 кГц — частый первый признак шумовой и возрастной тугоухости. Звон в ушах (тиннитус) у многих тоже лежит в этом диапазоне.",
      en: "Standard pure-tone audiometry tests hearing from 250 to 8000 Hz. Loss at 4–8 kHz is a common first sign of noise-induced and age-related hearing loss. Tinnitus is often in this range too.",
    },
    faq: {
      q: { ru: "Что значит, если я плохо слышу 8 кГц?", en: "What does it mean if I can barely hear 8 kHz?" },
      a: {
        ru: "Возможно, это признак потери слуха на высоких частотах, но онлайн-тон не точен: влияют наушники и громкость. Для диагностики обратитесь к врачу-сурдологу на аудиометрию.",
        en: "It may be a sign of high-frequency hearing loss, but an online tone isn't precise: headphones and volume matter. See an audiologist for a proper audiogram.",
      },
    },
  },
  {
    hz: 10000,
    title: { ru: "Тон 10000 Гц онлайн — проверка высоких частот", en: "10000 Hz tone online — treble test" },
    h1: { ru: "Тон 10 000 Гц", en: "10,000 Hz tone" },
    description: {
      ru: "Тон 10 кГц — проверка верхних частот акустики и наушников. Большинство взрослых его ещё хорошо слышат; период 0,1 мс, длина волны около 3,4 см.",
      en: "A 10 kHz tone to test the treble of speakers and headphones. Most adults still hear it clearly; the period is 0.1 ms and the wavelength about 3.4 cm.",
    },
    lead: { ru: "10 кГц — очень высокий звон, область «воздуха» и блеска в музыке.", en: "10 kHz is a very high ring — the “air” and sparkle region in music." },
    about: {
      ru: "Около 10 кГц лежит «воздух» записи: призвуки тарелок, придыхание вокала. Если на этой частоте ваши наушники заметно тише, чем на 1 кГц, звук у них тёмный. Динамики с порванным или засорённым твитером на 10 кГц часто молчат.",
      en: "Around 10 kHz lies a recording's “air”: cymbal shimmer and vocal breath. If your headphones are much quieter here than at 1 kHz, they sound dark. Speakers with a damaged or clogged tweeter are often silent at 10 kHz.",
    },
    faq: {
      q: { ru: "Как проверить, работает ли твитер колонки?", en: "How do I check a speaker's tweeter?" },
      a: {
        ru: "Включите тон 10 кГц на небольшой громкости и поднесите ухо к колонке: звук должен идти из маленького высокочастотного динамика. Если его не слышно, а 1 кГц слышно — твитер неисправен.",
        en: "Play 10 kHz at a low volume and put your ear near the speaker: the sound should come from the small high-frequency driver. If you hear 1 kHz but not this, the tweeter is faulty.",
      },
    },
  },
  {
    hz: 12000,
    title: { ru: "Тон 12000 Гц онлайн — возрастная граница слуха", en: "12000 Hz tone online — an age hearing check" },
    h1: { ru: "Тон 12 000 Гц", en: "12,000 Hz tone" },
    description: {
      ru: "Тон 12 кГц — частота, которую с возрастом перестают слышать многие люди старше 50 лет. Проверьте свой слух и высокие частоты наушников; период 0,083 мс.",
      en: "A 12 kHz tone — many people over about 50 stop hearing it as they age. Check your hearing and your headphones' treble; the period is 0.083 ms.",
    },
    lead: { ru: "12 кГц — тонкий писк на границе слуха людей старшего возраста.", en: "12 kHz is a thin whine at the edge of older people's hearing." },
    about: {
      ru: "С возрастом верхняя граница слуха постепенно снижается (пресбиакузис). По популярным тестам слуха 12 кГц обычно слышат люди примерно до 50 лет, но это индивидуально и сильно зависит от наушников и громкости.",
      en: "The upper limit of hearing gradually drops with age (presbycusis). In popular hearing tests 12 kHz is usually heard up to about age 50, but it varies a lot between people and depends on headphones and volume.",
    },
    faq: {
      q: { ru: "Нормально ли не слышать 12 кГц?", en: "Is it normal not to hear 12 kHz?" },
      a: {
        ru: "После 50 лет это частое явление. Если вы моложе и не слышите тон в хороших наушниках при нормальной громкости, стоит пройти аудиометрию.",
        en: "It's common after 50. If you're younger and can't hear it on good headphones at a normal volume, consider a hearing test.",
      },
    },
  },
  {
    hz: 15000,
    title: { ru: "Тон 15000 Гц онлайн — тест слуха", en: "15000 Hz tone online — hearing test" },
    h1: { ru: "Тон 15 000 Гц", en: "15,000 Hz tone" },
    description: {
      ru: "Тон 15 кГц — популярный тест слуха: многие взрослые после 40–50 лет его уже не слышат. Также проверка, воспроизводят ли наушники самые высокие частоты.",
      en: "A 15 kHz tone — a popular hearing test: many adults over 40–50 no longer hear it. It also checks whether headphones reproduce the very top frequencies.",
    },
    lead: { ru: "15 кГц — очень высокий писк; его слышат не все, особенно с возрастом.", en: "15 kHz is a very high whine; not everyone hears it, especially with age." },
    about: {
      ru: "15 кГц — частота строчной развёртки старых кинескопных телевизоров (15,625 кГц в системах PAL/SECAM), которую в детстве многие слышали как писк. Сегодня это удобный тест слуха: по популярным таблицам его слышат примерно до 40–50 лет.",
      en: "15 kHz is close to the line frequency of old CRT TVs (15.625 kHz in PAL/SECAM), which many people heard as a whine as children. Today it's a handy hearing test: popular tables say it's heard up to about age 40–50.",
    },
    faq: {
      q: { ru: "Почему я слышу 15 кГц на одних наушниках и не слышу на других?", en: "Why do I hear 15 kHz on some headphones but not others?" },
      a: {
        ru: "Многие недорогие наушники и почти все динамики ноутбуков на 15 кГц заметно проседают. Проверяйте слух на наушниках, которые точно воспроизводят высокие частоты, и при одной громкости.",
        en: "Many budget headphones and almost all laptop speakers roll off sharply at 15 kHz. Test your hearing on headphones that reproduce treble well, at a fixed volume.",
      },
    },
  },
  {
    hz: 17400,
    title: { ru: "Звук 17400 Гц — москитный звон, который не слышат взрослые", en: "17400 Hz mosquito tone — what adults can't hear" },
    h1: { ru: "Москитный звук 17 400 Гц", en: "17,400 Hz mosquito tone" },
    description: {
      ru: "17,4 кГц — «москитный» звук, который обычно слышат подростки и молодые люди до 25 лет, а взрослые — нет. Проверьте слух; результат зависит от динамика.",
      en: "17.4 kHz — the “mosquito” tone usually heard by teens and young people up to about 25 but not by older adults. Test your hearing; results depend on the speaker.",
    },
    lead: { ru: "17 400 Гц — «звонок, который не слышат учителя»: с возрастом он исчезает из слуха.", en: "17,400 Hz is the “ringtone teachers can't hear” — it fades from hearing with age." },
    about: {
      ru: "На частоте около 17,4 кГц работают устройства «Mosquito», отпугивающие подростков: взрослые их обычно не слышат. По этой же причине такие сигналы ставили на звонок телефона. Многие динамики телефонов и ноутбуков эту частоту почти не воспроизводят, так что отсутствие звука ещё не значит потерю слуха.",
      en: "“Mosquito” devices that deter teenagers work around 17.4 kHz, since adults usually can't hear them; for the same reason such tones became ringtones. Many phone and laptop speakers barely reproduce this frequency, so silence doesn't necessarily mean hearing loss.",
    },
    faq: {
      q: { ru: "До какого возраста слышат 17,4 кГц?", en: "Up to what age do people hear 17.4 kHz?" },
      a: {
        ru: "Ориентировочно до 20–25 лет, но у каждого по-разному: у одних граница снижается раньше, у других позже. Для честной проверки используйте хорошие наушники.",
        en: "Roughly up to 20–25, but it varies: for some the limit drops earlier, for others later. Use good headphones for a fair test.",
      },
    },
  },
  {
    hz: 20000,
    title: { ru: "Тон 20000 Гц онлайн — верхняя граница слуха", en: "20000 Hz tone online — the upper limit of hearing" },
    h1: { ru: "Тон 20 000 Гц", en: "20,000 Hz tone" },
    description: {
      ru: "Тон 20 кГц — теоретическая верхняя граница слуха. Его слышат в основном дети и подростки, а многие динамики не воспроизводят вовсе. Период 0,05 мс.",
      en: "A 20 kHz tone — the theoretical upper limit of hearing. Mostly children and teenagers hear it, and many speakers can't reproduce it at all. Period 0.05 ms.",
    },
    lead: { ru: "20 кГц — граница слышимого диапазона 20 Гц – 20 кГц.", en: "20 kHz is the top of the 20 Hz – 20 kHz audible range." },
    about: {
      ru: "Диапазон 20 Гц – 20 кГц — классическая граница человеческого слуха, поэтому аудио записывают с частотой дискретизации 44,1 или 48 кГц: по теореме Котельникова этого хватает для частот до 22–24 кГц. Взрослые обычно слышат лишь до 14–17 кГц.",
      en: "20 Hz – 20 kHz is the classic range of human hearing, which is why audio is sampled at 44.1 or 48 kHz: by the Nyquist theorem that covers frequencies up to 22–24 kHz. Adults usually hear only up to 14–17 kHz.",
    },
    faq: {
      q: { ru: "Почему я не слышу 20 кГц даже на хороших наушниках?", en: "Why can't I hear 20 kHz even on good headphones?" },
      a: {
        ru: "Это нормально: к 20 годам верхняя граница слуха у большинства уже ниже 20 кГц. К тому же многие наушники и звуковые карты на этой частоте сильно ослабляют сигнал.",
        en: "That's normal: by age 20 most people's upper limit is already below 20 kHz. Many headphones and sound cards also attenuate this frequency strongly.",
      },
    },
  },
];
