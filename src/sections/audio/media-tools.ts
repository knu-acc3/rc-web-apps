import type { Block, ToolDef } from "@/registry/types";
import { AUDIO_CONVERT_TARGETS, audioPairVariants } from "@/sections/video/data/pair-pages";

const privacy = (locale: "ru" | "en"): Block => ({
  type: "text",
  title: locale === "ru" ? "Звук не покидает устройство" : "Audio never leaves your device",
  paragraphs: [
    locale === "ru"
      ? "Файлы обрабатываются в браузере: декодирование — встроенными кодеками (WebCodecs), форматы, которых нет в браузере (MP3, FLAC и OGG на выходе, WMA и AMR на входе), обрабатывает модуль ffmpeg прямо на странице. На сервер ничего не загружается."
      : "Files are processed in your browser: decoding uses the built-in codecs (WebCodecs), and formats browsers lack (MP3, FLAC and OGG output, WMA and AMR input) are handled by an ffmpeg module on the page. Nothing is uploaded to a server.",
  ],
});

/** File-based audio tools (convert, trim, merge, volume, speed, reverse, recorder). */
export const mediaTools: ToolDef[] = [
  {
    slug: "audio-converter",
    component: "audio/convert",
    icon: "AudioLines",
    popular: true,
    name: { ru: "Аудиоконвертер", en: "Audio converter" },
    title: { ru: "Аудиоконвертер онлайн — MP3, WAV, M4A, FLAC, OGG", en: "Audio converter online — MP3, WAV, M4A, FLAC, OGG" },
    h1: { ru: "Аудиоконвертер онлайн", en: "Online audio converter" },
    description: {
      ru: "Конвертер аудио в браузере: MP3, WAV, M4A, AAC, FLAC, OGG, Opus, WMA, AMR и звук из видео. Битрейт до 320 кбит/с, частота, моно/стерео, пакетно и без загрузки.",
      en: "Audio converter in your browser: MP3, WAV, M4A, AAC, FLAC, OGG, Opus, WMA, AMR and audio from video. Up to 320 kbit/s, mono or stereo, batches, no uploads.",
    },
    lead: { ru: "Переведите аудио в MP3, WAV, M4A, FLAC, OGG или Opus — или извлеките звук из видео.", en: "Convert audio to MP3, WAV, M4A, FLAC, OGG or Opus — or extract the sound from a video." },
    keywords: { ru: ["аудио конвертер", "конвертировать аудио", "конвертер mp3", "перевести в mp3"], en: ["audio converter", "convert audio", "mp3 converter", "convert to mp3"] },
    props: { kind: "audio", to: "mp3", targets: AUDIO_CONVERT_TARGETS },
    variants: { title: { ru: "Популярные конвертации", en: "Popular conversions" }, list: audioPairVariants },
    howTo: {
      ru: ["Выберите формат: MP3 — самый совместимый, WAV и FLAC — без потерь.", "При необходимости откройте настройки: битрейт, частота, моно или стерео.", "Перетащите аудио- или видеофайлы.", "Нажмите «Конвертировать» и скачайте результат."],
      en: ["Choose a format: MP3 is the most compatible, WAV and FLAC are lossless.", "Open the settings if needed: bitrate, sample rate, mono or stereo.", "Drop audio or video files.", "Click Convert and download the result."],
    },
    about: {
      ru: [
        "Если исходный звук уже в нужном кодеке (например, AAC из MP4 в M4A), он копируется без перекодирования — быстро и без потерь. В остальных случаях звук декодируется браузером и кодируется заново.",
        "WAV, M4A (AAC) и Opus кодирует сам браузер. MP3 (LAME), FLAC и OGG Vorbis кодирует модуль ffmpeg: он загружается с этого сайта при первой необходимости (до 31 МБ) и затем берётся из кэша.",
      ],
      en: [
        "When the source audio is already in the target codec (say, AAC from MP4 into M4A), it's copied without re-encoding — fast and lossless. Otherwise the browser decodes the audio and it's encoded again.",
        "WAV, M4A (AAC) and Opus are encoded by the browser itself. MP3 (LAME), FLAC and OGG Vorbis are encoded by the ffmpeg module, downloaded from this site when first needed (up to 31 MB) and cached afterwards.",
      ],
    },
    faq: {
      ru: [
        { q: "Какой формат выбрать?", a: "MP3 — для максимальной совместимости, M4A (AAC) — лучшее качество при том же размере для техники Apple, FLAC и WAV — без потерь для архива и монтажа, Opus — для речи." },
        { q: "Можно ли вытащить звук из видео?", a: "Да: загрузите MP4, MOV, MKV или WebM — возьмётся только звуковая дорожка. Для извлечения без перекодирования выберите M4A (если в видео звук AAC)." },
        { q: "Что такое битрейт и какой ставить?", a: "Битрейт — сколько килобит занимает секунда звука. Для музыки в MP3 берите 192–320 кбит/с, для речи хватит 64–128 кбит/с." },
        { q: "Почему OGG кодируется медленнее, чем Opus?", a: "Opus кодирует встроенный кодек браузера, а Vorbis для OGG — модуль ffmpeg в WebAssembly. Если нужен просто Ogg-файл с хорошим звуком, выберите Opus." },
      ],
      en: [
        { q: "Which format should I pick?", a: "MP3 for maximum compatibility, M4A (AAC) for better quality at the same size on Apple devices, FLAC and WAV for lossless archives and editing, Opus for speech." },
        { q: "Can I extract audio from a video?", a: "Yes: load an MP4, MOV, MKV or WebM and only the soundtrack is taken. For extraction without re-encoding choose M4A (if the video's audio is AAC)." },
        { q: "What bitrate should I use?", a: "Bitrate is how many kilobits a second of audio takes. For music in MP3 use 192–320 kbit/s; 64–128 kbit/s is enough for speech." },
        { q: "Why is OGG slower to encode than Opus?", a: "Opus is encoded by the browser's built-in codec, while Vorbis for OGG runs in the ffmpeg WebAssembly module. If you just need a good-sounding Ogg file, choose Opus." },
      ],
    },
    related: ["trim-audio", "merge-audio", "increase-audio-volume", "video-converter", "voice-recorder"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "trim-audio",
    component: "audio/editor",
    props: { mode: "trim" },
    icon: "Scissors",
    popular: true,
    name: { ru: "Обрезать аудио", en: "Trim audio" },
    title: { ru: "Обрезать песню онлайн — вырезать фрагмент MP3", en: "Trim audio online — cut an MP3 or any song" },
    h1: { ru: "Обрезать аудио онлайн", en: "Trim audio online" },
    description: {
      ru: "Обрезать MP3 и другие аудио по волне: выделите фрагмент, послушайте, добавьте плавное начало и конец. Без затуханий MP3 режется без перекодирования, без потерь.",
      en: "Trim MP3 and other audio on a waveform: select the part, listen, add a fade in and out. Without fades an MP3 is cut without re-encoding — lossless.",
    },
    lead: { ru: "Вырежьте из песни или записи нужный кусок — для рингтона, нарезки или подкаста.", en: "Cut the part you need from a song or recording — for a ringtone, a clip or a podcast." },
    keywords: { ru: ["обрезать песню", "обрезать mp3", "вырезать фрагмент из песни", "обрезать аудио онлайн"], en: ["trim audio", "cut mp3", "cut a song", "audio cutter"] },
    howTo: {
      ru: ["Загрузите аудио — появится волна.", "Выделите фрагмент маркерами или введите время начала и конца.", "Послушайте фрагмент, при желании добавьте плавное начало и конец.", "Выберите формат и нажмите «Обрезать»."],
      en: ["Load audio — the waveform appears.", "Select the part with the handles or type the start and end times.", "Listen to it and add a fade in or out if you like.", "Choose the format and click Trim audio."],
    },
    about: {
      ru: [
        "Если формат на выходе совпадает с исходным и затухания не нужны, фрагмент вырезается прямо из закодированного потока — без перекодирования и без потери качества. С затуханиями или сменой формата звук перекодируется.",
        "Маркеры двигаются мышью, пальцем и стрелками клавиатуры с шагом 0,05 секунды (с Shift — 0,5 секунды). Время можно ввести как 1:05,5 или 65,5.",
      ],
      en: [
        "If the output format matches the source and no fades are needed, the part is cut straight from the encoded stream — no re-encoding and no quality loss. With fades or a format change the audio is re-encoded.",
        "Handles move with a mouse, a finger or the arrow keys in 0.05-second steps (0.5 seconds with Shift). Times can be typed as 1:05.5 or 65.5.",
      ],
    },
    faq: {
      ru: [
        { q: "Как сделать рингтон из песни?", a: "Выделите 20–30 секунд, добавьте плавное начало и конец по 1 секунде и сохраните: для Android — MP3, для iPhone — M4A (потом переименуйте в .m4r)." },
        { q: "Теряется ли качество при обрезке MP3?", a: "Нет, если оставить формат MP3 и не добавлять затухания: кадры MP3 копируются как есть. Точность разреза — около 26 мс (длина кадра MP3)." },
        { q: "Можно ли вырезать кусок из середины?", a: "Обрежьте файл дважды (до и после ненужного места) и соедините части в «Склеить аудио»." },
      ],
      en: [
        { q: "How do I make a ringtone from a song?", a: "Select 20–30 seconds, add 1-second fades in and out and save: MP3 for Android, M4A for iPhone (then rename it to .m4r)." },
        { q: "Is quality lost when trimming an MP3?", a: "No, if you keep MP3 and add no fades: MP3 frames are copied as is. The cut is accurate to about 26 ms (one MP3 frame)." },
        { q: "Can I remove a part from the middle?", a: "Trim the file twice (before and after the unwanted part) and join the pieces in “Merge audio”." },
      ],
    },
    related: ["merge-audio", "audio-converter", "increase-audio-volume", "trim-video"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "merge-audio",
    component: "audio/merge",
    icon: "Combine",
    name: { ru: "Склеить аудио", en: "Merge audio" },
    title: { ru: "Склеить аудио онлайн — соединить песни и записи в одну", en: "Merge audio online — join songs into one file" },
    h1: { ru: "Склеить аудио онлайн", en: "Merge audio files online" },
    description: {
      ru: "Соединить несколько аудиофайлов в один: MP3, WAV, M4A, OGG и звук из видео в любом порядке, встык или с переходом до 8 секунд. Результат в MP3, WAV, M4A, FLAC.",
      en: "Join several audio files into one: MP3, WAV, M4A, OGG or audio from video in any order, back to back or crossfaded up to 8 seconds. Save as MP3, WAV, M4A, FLAC.",
    },
    lead: { ru: "Соедините треки, куски записи или голосовые сообщения в один файл.", en: "Join tracks, recording fragments or voice messages into one file." },
    keywords: { ru: ["склеить аудио", "соединить mp3", "объединить песни", "склеить музыку онлайн"], en: ["merge audio", "join mp3", "combine songs", "audio joiner"] },
    howTo: {
      ru: ["Добавьте файлы в нужном порядке.", "Поменяйте порядок стрелками, если нужно.", "Выберите переход: встык или с плавным наложением.", "Выберите формат и нажмите «Склеить аудио»."],
      en: ["Add the files in order.", "Reorder them with the arrows if needed.", "Choose the transition: back to back or crossfade.", "Choose the format and click Merge audio."],
    },
    about: {
      ru: [
        "Файлы декодируются, приводятся к частоте дискретизации первого файла и числу каналов самого «широкого» из них, а затем соединяются. Можно склеивать файлы разных форматов и даже звук из видео.",
        "Плавный переход — равномощное наложение: конец одного трека затихает, пока нарастает начало следующего, без провала громкости посередине.",
      ],
      en: [
        "Files are decoded, converted to the first file's sample rate and the widest channel count among them, then joined. You can mix formats and even audio from video.",
        "The crossfade is equal-power: the end of one track fades out while the next fades in, with no dip in loudness in the middle.",
      ],
    },
    faq: {
      ru: [
        { q: "Можно ли склеить MP3 без перекодирования?", a: "Нет, склейка всегда перекодирует звук — зато можно соединять файлы разных форматов и частот. При битрейте 192–320 кбит/с разница не слышна." },
        { q: "Сколько файлов можно соединить?", a: "Ограничения нет, но все файлы распаковываются в память: час стереозвука занимает около 1,3 ГБ, поэтому для очень длинных сборок нужен компьютер с большим объёмом памяти." },
        { q: "Как сделать паузу между треками?", a: "Сейчас паузы не добавляются. Обходной путь — подготовить файл тишины нужной длины и поставить его между треками." },
      ],
      en: [
        { q: "Can MP3s be joined without re-encoding?", a: "No, merging always re-encodes — in exchange you can join different formats and sample rates. At 192–320 kbit/s the difference is inaudible." },
        { q: "How many files can I join?", a: "There's no limit, but all files are decoded into memory: an hour of stereo takes about 1.3 GB, so very long mixes need a computer with plenty of RAM." },
        { q: "How do I add a pause between tracks?", a: "Pauses aren't added automatically. A workaround is to prepare a silent file of the right length and place it between tracks." },
      ],
    },
    related: ["trim-audio", "audio-converter", "merge-videos", "voice-recorder"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "increase-audio-volume",
    component: "audio/editor",
    props: { mode: "volume" },
    icon: "Volume2",
    name: { ru: "Увеличить громкость аудио", en: "Increase audio volume" },
    title: { ru: "Увеличить громкость MP3 онлайн — усилить или нормализовать", en: "Increase audio volume online — boost or normalize MP3" },
    h1: { ru: "Увеличить громкость аудио", en: "Increase audio volume" },
    description: {
      ru: "Сделать запись громче: усиление от −20 до +20 дБ с предпрослушиванием или нормализация пика до −1 dBFS. Показывает пик до и после, предупреждает о клиппинге.",
      en: "Make a quiet recording louder: gain from −20 to +20 dB with a preview, or peak normalization to −1 dBFS. Shows the peak before and after, warns about clipping.",
    },
    lead: { ru: "Усильте тихую запись или выровняйте уровень — без искажений и с предпрослушиванием.", en: "Boost a quiet recording or even out its level — without distortion and with a preview." },
    keywords: { ru: ["увеличить громкость mp3", "усилить звук", "нормализовать звук", "сделать громче аудио"], en: ["increase audio volume", "boost volume mp3", "normalize audio", "make audio louder"] },
    howTo: {
      ru: ["Загрузите аудио — появится волна и текущий пиковый уровень.", "Выберите «Вручную» и задайте усиление или «Нормализовать».", "Послушайте результат кнопкой «Прослушать».", "Нажмите «Применить громкость» и скачайте файл."],
      en: ["Load audio — the waveform and current peak level appear.", "Choose Manual and set the gain, or Normalize.", "Listen with the Listen button.", "Click Apply volume and download the file."],
    },
    about: {
      ru: [
        "Нормализация поднимает громкость так, чтобы самый громкий момент оказался ровно на выбранном уровне (например, −1 dBFS), — это максимальное усиление без искажений. Ручное усиление может вывести пики за 0 dBFS: такие места ограничиваются, и инструмент предупреждает об этом.",
        "+6 дБ — это примерно удвоение амплитуды; на слух громкость кажется в два раза больше примерно при +10 дБ.",
      ],
      en: [
        "Normalization raises the level so the loudest moment lands exactly on the chosen level (say −1 dBFS) — the maximum gain without distortion. Manual gain can push peaks above 0 dBFS: those parts are limited, and the tool warns you.",
        "+6 dB roughly doubles the amplitude; perceived loudness doubles at about +10 dB.",
      ],
    },
    faq: {
      ru: [
        { q: "Почему после нормализации запись стала громче совсем немного?", a: "В записи есть короткий громкий пик (щелчок, удар), и нормализация по пику упирается в него. Обрежьте такой момент или используйте ручное усиление, соглашаясь на небольшое ограничение пиков." },
        { q: "Можно ли сделать тише?", a: "Да: в ручном режиме выберите отрицательное значение, например −6 дБ." },
        { q: "Усилится ли шум вместе с голосом?", a: "Да, усиление поднимает всё одинаково. Шумоподавление здесь не выполняется." },
      ],
      en: [
        { q: "Why did normalization barely make it louder?", a: "The recording has a short loud peak (a click or a knock) and peak normalization stops there. Trim that moment or use manual gain, accepting slight peak limiting." },
        { q: "Can I make it quieter?", a: "Yes: in manual mode choose a negative value such as −6 dB." },
        { q: "Will noise get louder too?", a: "Yes, gain raises everything equally. No noise reduction is done here." },
      ],
    },
    related: ["trim-audio", "audio-converter", "decibel-meter", "merge-audio"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "change-audio-speed",
    component: "audio/editor",
    props: { mode: "speed" },
    icon: "Gauge",
    name: { ru: "Скорость и тональность аудио", en: "Audio speed and pitch" },
    title: { ru: "Изменить скорость и тональность аудио онлайн", en: "Change audio speed and pitch online" },
    h1: { ru: "Изменить скорость и тональность аудио", en: "Change audio speed and pitch" },
    description: {
      ru: "Ускорить или замедлить аудио в 0,5–2 раза с сохранением высоты голоса и сдвинуть тональность на ±12 полутонов без изменения темпа. Скорость слышна сразу.",
      en: "Speed audio up or slow it down 0.5–2× keeping the voice pitch, and shift the key by ±12 semitones without changing tempo. The speed preview plays instantly.",
    },
    lead: { ru: "Замедлите песню для разучивания или сдвиньте тональность под свой голос.", en: "Slow a song down to learn it or shift the key to suit your voice." },
    keywords: { ru: ["изменить скорость аудио", "замедлить песню", "изменить тональность песни", "ускорить аудио"], en: ["change audio speed", "slow down song", "change pitch of song", "speed up audio"] },
    howTo: {
      ru: ["Загрузите песню или запись.", "Выберите скорость — «Прослушать» сразу играет с ней.", "Сдвиньте тональность ползунком, если нужно.", "Нажмите «Изменить скорость» и скачайте файл."],
      en: ["Load a song or recording.", "Choose the speed — Listen plays at it right away.", "Shift the pitch with the slider if needed.", "Click Change speed and download the file."],
    },
    about: {
      ru: [
        "Темп меняется алгоритмом WSOLA: звук режется на короткие перекрывающиеся кусочки, которые сдвигаются так, чтобы волна совпадала, — поэтому высота голоса сохраняется. Без галочки «Сохранить высоту голоса» звук ускоряется как на магнитофоне.",
        "Сдвиг тональности = растяжение по времени + пересэмплирование: длительность остаётся прежней, а все ноты сдвигаются на заданное число полутонов (12 полутонов — октава).",
      ],
      en: [
        "Tempo is changed with the WSOLA algorithm: audio is split into short overlapping pieces that are shifted so the waveform lines up, which preserves the pitch. Without “Keep voice pitch” the audio speeds up like a tape.",
        "Pitch shifting = time stretching + resampling: the duration stays the same while every note moves by the chosen number of semitones (12 semitones is an octave).",
      ],
    },
    faq: {
      ru: [
        { q: "Как замедлить песню, чтобы разучить её на гитаре?", a: "Выберите скорость 0,75 или 0,5 с включённым «Сохранить высоту голоса» — ноты останутся в той же тональности, что и на записи." },
        { q: "Как понизить тональность под свой голос?", a: "Сдвиньте ползунок «Тональность» на −1…−3 полутона. Каждый полутон — это один лад на гитаре." },
        { q: "Почему при сильном замедлении появляется «эхо»?", a: "Растяжение по времени повторяет куски звука; при 0,5× это становится слышно на ударных. Для речи и мелодий результат обычно чистый." },
      ],
      en: [
        { q: "How do I slow a song down to learn it on guitar?", a: "Choose 0.75 or 0.5 speed with “Keep voice pitch” on — notes stay in the same key as the recording." },
        { q: "How do I lower the key to suit my voice?", a: "Move the Pitch slider to −1…−3 semitones. Each semitone is one guitar fret." },
        { q: "Why is there an echo when slowing down a lot?", a: "Time stretching repeats pieces of sound, which becomes audible on drums at 0.5×. Speech and melodies usually stay clean." },
      ],
    },
    related: ["change-video-speed", "trim-audio", "tuner", "metronome"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "reverse-audio",
    component: "audio/editor",
    props: { mode: "reverse" },
    icon: "Undo2",
    name: { ru: "Реверс аудио", en: "Reverse audio" },
    title: { ru: "Развернуть аудио задом наперёд онлайн — реверс звука", en: "Reverse audio online — play a sound backwards" },
    h1: { ru: "Развернуть аудио задом наперёд", en: "Reverse audio" },
    description: {
      ru: "Реверс звука онлайн: песня, голос или эффект проигрываются задом наперёд. Поиск скрытых посланий, звуковые эффекты, игры с друзьями. Сохранение в MP3, WAV, M4A.",
      en: "Reverse audio online: a song, voice or effect plays backwards. Hunt for hidden messages, make sound effects or play games with friends. Save as MP3, WAV or M4A.",
    },
    lead: { ru: "Проиграйте любую запись задом наперёд и сохраните результат.", en: "Play any recording backwards and save the result." },
    keywords: { ru: ["реверс аудио", "звук задом наперёд", "перевернуть песню", "развернуть звук"], en: ["reverse audio", "play audio backwards", "reverse song", "backwards sound"] },
    howTo: {
      ru: ["Загрузите аудиофайл или видео.", "Выберите формат на выходе.", "Нажмите «Развернуть задом наперёд» и скачайте результат."],
      en: ["Load an audio file or a video.", "Choose the output format.", "Click Reverse audio and download the result."],
    },
    about: {
      ru: [
        "Звук декодируется, порядок сэмплов в каждом канале меняется на обратный, и файл кодируется заново. Стерео сохраняется: левый канал остаётся левым.",
        "Популярная игра: запишите фразу диктофоном, разверните, повторите то, что услышали, и разверните уже свою запись — получится исходная фраза со смешным акцентом.",
      ],
      en: [
        "The audio is decoded, the sample order in each channel is reversed and the file is encoded again. Stereo is kept: the left channel stays left.",
        "A popular game: record a phrase, reverse it, imitate what you hear, then reverse your imitation — you get the original phrase with a funny accent.",
      ],
    },
    faq: {
      ru: [
        { q: "Можно ли развернуть только часть записи?", a: "Сначала вырежьте нужный кусок в «Обрезать аудио», затем разверните его здесь." },
        { q: "Как сделать эффект «реверс-реверберации»?", a: "Разверните запись, добавьте к ней реверберацию в любом аудиоредакторе и разверните снова — эхо будет «нарастать» перед звуком." },
        { q: "Сохранится ли качество?", a: "Разворот не меняет звук, но файл кодируется заново; в WAV и FLAC — без потерь, в MP3 и M4A — с обычным сжатием." },
      ],
      en: [
        { q: "Can I reverse only part of a recording?", a: "Cut the part out in “Trim audio” first, then reverse it here." },
        { q: "How do I make a reverse reverb effect?", a: "Reverse the recording, add reverb in any audio editor and reverse it again — the echo will swell up before the sound." },
        { q: "Is quality preserved?", a: "Reversing doesn't change the sound, but the file is encoded again: lossless in WAV and FLAC, with normal compression in MP3 and M4A." },
      ],
    },
    related: ["voice-recorder", "trim-audio", "change-audio-speed", "audio-converter"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "voice-recorder",
    component: "audio/voice-recorder",
    props: { mode: "voice" },
    icon: "Mic",
    popular: true,
    name: { ru: "Диктофон онлайн", en: "Voice recorder" },
    title: { ru: "Диктофон онлайн — записать голос с микрофона", en: "Online voice recorder — record from your microphone" },
    description: {
      ru: "Онлайн-диктофон: запись голоса с микрофона с паузой и осциллограммой, шумоподавление, сохранение в WebM, M4A, MP3 или WAV. Запись не уходит на сервер.",
      en: "Online voice recorder: record your voice with pause and a live waveform, noise suppression, and save as WebM, M4A, MP3 or WAV. Nothing is sent to a server.",
    },
    lead: { ru: "Запишите голос с микрофона и сохраните в MP3 или WAV — без программ и регистрации.", en: "Record your voice from the microphone and save it as MP3 or WAV — no software or sign-up." },
    keywords: { ru: ["диктофон онлайн", "записать голос", "запись с микрофона", "запись голоса онлайн"], en: ["voice recorder", "record voice online", "microphone recorder", "audio recorder"] },
    howTo: {
      ru: ["Нажмите «Начать запись» и разрешите доступ к микрофону.", "Говорите — осциллограмма показывает, что звук идёт; при необходимости ставьте паузу.", "Нажмите «Остановить» и прослушайте запись.", "Скачайте её или сохраните в MP3 или WAV."],
      en: ["Click Start recording and allow microphone access.", "Speak — the waveform shows the input; pause if needed.", "Click Stop and listen back.", "Download it or save it as MP3 or WAV."],
    },
    about: {
      ru: [
        "Запись делает сам браузер (MediaRecorder): Chrome и Firefox пишут WebM с кодеком Opus, Safari — M4A (AAC). Кнопки «Сохранить в MP3» и «Сохранить в WAV» перекодируют запись на вашем устройстве.",
        "Шумоподавление и эхоподавление встроены в браузер и полезны для речи. Для записи музыки или измерений их лучше выключить — тогда звук записывается без обработки.",
      ],
      en: [
        "The browser does the recording (MediaRecorder): Chrome and Firefox record WebM with Opus, Safari records M4A (AAC). “Save as MP3” and “Save as WAV” re-encode the recording on your device.",
        "Noise and echo suppression are built into the browser and help with speech. For music or measurements, turn them off to record unprocessed sound.",
      ],
    },
    faq: {
      ru: [
        { q: "Сколько можно записывать?", a: "Ограничения нет: час речи в Opus занимает примерно 30–60 МБ памяти браузера. Не закрывайте вкладку до сохранения — запись хранится только в ней." },
        { q: "Почему браузер не видит микрофон?", a: "Разрешите доступ к микрофону в настройках сайта (значок замка в адресной строке) и проверьте, что микрофон не занят другой программой." },
        { q: "Можно ли записать звук с компьютера, а не с микрофона?", a: "Для этого используйте «Запись экрана» с галочкой «Звук вкладки или системы» (Chrome, Edge), затем извлеките звук в «Аудиоконвертере»." },
      ],
      en: [
        { q: "How long can I record?", a: "There's no limit: an hour of speech in Opus takes roughly 30–60 MB of browser memory. Don't close the tab before saving — the recording lives only there." },
        { q: "Why doesn't the browser see my microphone?", a: "Allow microphone access in the site settings (the lock icon in the address bar) and make sure no other app is using the microphone." },
        { q: "Can I record computer audio instead of the microphone?", a: "Use the “Screen recorder” with “Tab or system audio” (Chrome, Edge), then extract the audio in the audio converter." },
      ],
    },
    related: ["trim-audio", "audio-converter", "screen-recorder", "webcam-recorder"],
  },
];
