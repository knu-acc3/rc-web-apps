import type { L10n } from "@/i18n/config";

/**
 * Curated conversion pairs (variant pages of the video and audio converters).
 * mode: "copy" — usually a remux without re-encoding; "mixed" — copy when the codecs
 * fit, otherwise re-encode; "encode" — always re-encoded.
 */
export interface Pair {
  from: string;
  to: string;
  kind: "video" | "audio";
  mode: "copy" | "mixed" | "encode";
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  note: L10n;
  faq: { q: L10n; a: L10n };
}

export const VIDEO_PAIRS: Pair[] = [
  {
    from: "mov",
    to: "mp4",
    kind: "video",
    mode: "mixed",
    title: { ru: "MOV в MP4 онлайн — конвертер видео с iPhone", en: "MOV to MP4 online — convert iPhone videos" },
    h1: { ru: "Конвертировать MOV в MP4", en: "Convert MOV to MP4" },
    description: {
      ru: "MOV в MP4 прямо в браузере: H.264 и HEVC с iPhone переупаковываются без перекодирования за секунды. Можно перевести HEVC в H.264. Без загрузки на сервер.",
      en: "MOV to MP4 in your browser: H.264 and HEVC from an iPhone are repackaged without re-encoding in seconds, or HEVC converted to H.264. Nothing is uploaded.",
    },
    lead: { ru: "Перетащите MOV — видео H.264 или HEVC перейдёт в MP4 без потери качества за несколько секунд.", en: "Drop a MOV file — H.264 or HEVC video moves into MP4 without quality loss in a few seconds." },
    note: {
      ru: "MOV и MP4 устроены почти одинаково — оба основаны на формате ISO BMFF, поэтому видео H.264 или HEVC и звук AAC просто переносятся в новый контейнер, без перекодирования. Если MP4 нужен для старого компьютера или телевизора, включите в настройках «Максимальная совместимость»: HEVC будет перекодирован в H.264.",
      en: "MOV and MP4 are built almost the same way — both are based on ISO BMFF — so H.264 or HEVC video and AAC audio are simply moved into the new container without re-encoding. If the MP4 is for an older computer or TV, turn on “Maximum compatibility” in the settings to re-encode HEVC to H.264.",
    },
    faq: {
      q: { ru: "Почему видео с iPhone не открывается в Windows?", en: "Why won't my iPhone video open on Windows?" },
      a: {
        ru: "С iOS 11 iPhone по умолчанию снимает в HEVC (H.265). Windows воспроизводит HEVC только с платным расширением «Видео HEVC». Конвертируйте с опцией «Максимальная совместимость» — получится MP4 с H.264, который открывается везде.",
        en: "Since iOS 11 the iPhone records HEVC (H.265) by default, and Windows plays HEVC only with the paid “HEVC Video Extensions”. Convert with “Maximum compatibility” to get an H.264 MP4 that opens everywhere.",
      },
    },
  },
  {
    from: "mkv",
    to: "mp4",
    kind: "video",
    mode: "mixed",
    title: { ru: "MKV в MP4 онлайн — без перекодирования видео", en: "MKV to MP4 online — no video re-encoding" },
    h1: { ru: "Конвертировать MKV в MP4", en: "Convert MKV to MP4" },
    description: {
      ru: "MKV в MP4 в браузере: видео H.264 или HEVC копируется без потерь, звук AC-3 и DTS перекодируется в AAC для телефонов и ТВ. Файл не загружается на сервер.",
      en: "MKV to MP4 in the browser: H.264 or HEVC video is copied losslessly, AC-3 and DTS audio is re-encoded to AAC for phones and TVs. Your file is never uploaded.",
    },
    lead: { ru: "Видео из MKV переносится в MP4 без перекодирования, а неподходящий звук автоматически переводится в AAC.", en: "Video from MKV moves into MP4 without re-encoding; unsuitable audio is converted to AAC automatically." },
    note: {
      ru: "MKV — контейнер-«матрёшка»: внутри обычно H.264 или HEVC со звуком AAC, AC-3 или DTS. Видео переходит в MP4 как есть, а звук AC-3 и DTS, который телефоны и браузеры в MP4 часто не воспроизводят, перекодируется в AAC. Берутся основная видео- и основная звуковая дорожки.",
      en: "MKV is a container that can hold almost anything: usually H.264 or HEVC with AAC, AC-3 or DTS audio. The video goes into MP4 as is, while AC-3 and DTS audio — often unplayable in MP4 on phones and in browsers — is re-encoded to AAC. The main video and main audio tracks are used.",
    },
    faq: {
      q: { ru: "Сохранятся ли субтитры и вторая озвучка?", en: "Are subtitles and extra audio tracks kept?" },
      a: {
        ru: "Нет: в MP4 попадают основная видеодорожка и основная звуковая. Встроенные субтитры MKV (SRT, ASS) не переносятся — если они нужны, сохраните их отдельно, например в MKVToolNix, или смотрите MKV в плеере, который его читает.",
        en: "No: the MP4 gets the main video track and the main audio track. Embedded MKV subtitles (SRT, ASS) are not carried over — extract them separately, e.g. with MKVToolNix, or keep watching the MKV in a player that supports it.",
      },
    },
  },
  {
    from: "webm",
    to: "mp4",
    kind: "video",
    mode: "encode",
    title: { ru: "WebM в MP4 онлайн — конвертер записей экрана", en: "WebM to MP4 online — screen recordings too" },
    h1: { ru: "Конвертировать WebM в MP4", en: "Convert WebM to MP4" },
    description: {
      ru: "WebM в MP4 онлайн: VP8, VP9 и AV1 перекодируются в H.264, звук Opus — в AAC. Кодирует видеокарта через WebCodecs, файл остаётся на вашем компьютере.",
      en: "WebM to MP4 online: VP8, VP9 and AV1 are re-encoded to H.264 and Opus audio to AAC. The GPU does the work via WebCodecs; your file stays on your computer.",
    },
    lead: { ru: "WebM перекодируется в MP4 с H.264 — такой файл открывается на iPhone, в Windows и в любом редакторе.", en: "WebM is re-encoded to an H.264 MP4 that opens on iPhones, on Windows and in any editor." },
    note: {
      ru: "Внутри WebM видео в VP8, VP9 или AV1, а для совместимого MP4 нужен H.264 — поэтому видео перекодируется. В браузерах с WebCodecs это делает аппаратный кодировщик, так что короткие ролики обрабатываются за секунды. Звук Opus или Vorbis переводится в AAC.",
      en: "WebM stores VP8, VP9 or AV1 video, while a compatible MP4 needs H.264, so the video is re-encoded. In browsers with WebCodecs the hardware encoder does it, so short clips take seconds. Opus or Vorbis audio is converted to AAC.",
    },
    faq: {
      q: { ru: "Почему запись экрана в WebM не открывается на iPhone или в редакторе?", en: "Why won't my WebM screen recording open on an iPhone or in an editor?" },
      a: {
        ru: "Chrome и Firefox записывают экран в WebM с кодеком VP8 или VP9. Многие редакторы и старые версии iOS такие файлы не принимают, а MP4 с H.264 понимают все — поэтому запись удобнее один раз сконвертировать.",
        en: "Chrome and Firefox record the screen as WebM with VP8 or VP9. Many editors and older iOS versions don't accept those files, while every app understands H.264 MP4 — so converting once saves trouble.",
      },
    },
  },
  {
    from: "avi",
    to: "mp4",
    kind: "video",
    mode: "encode",
    title: { ru: "AVI в MP4 онлайн — конвертер старых видео", en: "AVI to MP4 online — convert old videos" },
    h1: { ru: "Конвертировать AVI в MP4", en: "Convert AVI to MP4" },
    description: {
      ru: "AVI в MP4 без загрузки на сервер: DivX и Xvid перекодируются в H.264, звук MP3 — в AAC. Если внутри уже H.264, видео копируется без потерь.",
      en: "AVI to MP4 without uploading: DivX and Xvid are re-encoded to H.264 and MP3 audio to AAC. If the AVI already holds H.264, the video is copied losslessly.",
    },
    lead: { ru: "Старый AVI с DivX или Xvid превращается в MP4, который открывается на телефоне и в браузере.", en: "An old DivX or Xvid AVI becomes an MP4 that plays on phones and in browsers." },
    note: {
      ru: "Браузер не умеет читать AVI и декодировать DivX/Xvid, поэтому конвертация идёт через модуль ffmpeg, работающий прямо на странице. Сначала он определяет кодеки: H.264 копируется без перекодирования, а MPEG-4 Part 2 (DivX, Xvid) перекодируется в H.264.",
      en: "Browsers can't read AVI or decode DivX/Xvid, so the conversion runs through the ffmpeg module right on the page. It first checks the codecs: H.264 is copied without re-encoding, while MPEG-4 Part 2 (DivX, Xvid) is re-encoded to H.264.",
    },
    faq: {
      q: { ru: "Почему AVI конвертируется медленнее, чем MOV или MKV?", en: "Why is AVI slower to convert than MOV or MKV?" },
      a: {
        ru: "Для AVI используется ffmpeg в WebAssembly: он работает в одном потоке процессора и без аппаратного ускорения. Короткие ролики обрабатываются быстро, а фильм может занять десятки минут — для длинных файлов удобнее настольный HandBrake.",
        en: "AVI goes through ffmpeg compiled to WebAssembly, which runs on a single CPU thread without hardware acceleration. Short clips are quick, but a full film can take tens of minutes — for long files a desktop app such as HandBrake is handier.",
      },
    },
  },
  {
    from: "wmv",
    to: "mp4",
    kind: "video",
    mode: "encode",
    title: { ru: "WMV в MP4 онлайн — для Mac, iPhone и Android", en: "WMV to MP4 online — for Mac, iPhone, Android" },
    h1: { ru: "Конвертировать WMV в MP4", en: "Convert WMV to MP4" },
    description: {
      ru: "WMV в MP4 онлайн: видео WMV и VC-1 перекодируется в H.264, звук WMA — в AAC. Результат открывается на Mac, iPhone и Android. Файл не покидает браузер.",
      en: "WMV to MP4 online: WMV and VC-1 video is re-encoded to H.264 and WMA audio to AAC. The result opens on Mac, iPhone and Android. Your file never leaves the browser.",
    },
    lead: { ru: "Ролики Windows Media превращаются в MP4, который открывается на любом устройстве.", en: "Windows Media clips become MP4 files that open on any device." },
    note: {
      ru: "WMV — формат Windows Media в контейнере ASF, его не воспроизводят ни браузеры, ни техника Apple. Модуль ffmpeg декодирует видео WMV 7–9 или VC-1 и звук WMA и кодирует их в H.264 и AAC.",
      en: "WMV is Windows Media video in an ASF container; neither browsers nor Apple devices play it. The ffmpeg module decodes WMV 7–9 or VC-1 video and WMA audio and encodes them to H.264 and AAC.",
    },
    faq: {
      q: { ru: "Воспроизведётся ли результат на Mac и iPhone?", en: "Will the result play on a Mac and iPhone?" },
      a: {
        ru: "Да. MP4 с H.264 и AAC — родной формат для техники Apple, тогда как WMV на Mac без сторонних программ не открывается. Файлы WMV с защитой DRM конвертировать нельзя.",
        en: "Yes. H.264 + AAC MP4 is native to Apple devices, whereas WMV doesn't open on a Mac without third-party apps. DRM-protected WMV files can't be converted.",
      },
    },
  },
  {
    from: "flv",
    to: "mp4",
    kind: "video",
    mode: "mixed",
    title: { ru: "FLV в MP4 онлайн — конвертер Flash-видео", en: "FLV to MP4 online — convert Flash video" },
    h1: { ru: "Конвертировать FLV в MP4", en: "Convert FLV to MP4" },
    description: {
      ru: "FLV в MP4 в браузере: если внутри H.264 и AAC, видео переупаковывается без перекодирования; Sorenson Spark и VP6 перекодируются в H.264.",
      en: "FLV to MP4 in the browser: H.264 and AAC inside are repackaged without re-encoding; Sorenson Spark and VP6 are re-encoded to H.264. Nothing is uploaded.",
    },
    lead: { ru: "Старое Flash-видео превращается в обычный MP4 — часто без перекодирования и за секунды.", en: "Old Flash video becomes a regular MP4 — often without re-encoding, in seconds." },
    note: {
      ru: "Flash Player больше не поддерживается (с 2020 года), и FLV-файлы не открываются в браузерах. Модуль ffmpeg определяет кодеки: поздние FLV с H.264 и AAC просто переносятся в MP4, а ранние с Sorenson Spark или On2 VP6 перекодируются.",
      en: "Flash Player has been unsupported since 2020 and FLV files don't open in browsers. The ffmpeg module checks the codecs: later FLVs with H.264 and AAC are simply moved into MP4, earlier ones with Sorenson Spark or On2 VP6 are re-encoded.",
    },
    faq: {
      q: { ru: "Как понять, будет ли FLV перекодирован?", en: "How do I know whether the FLV will be re-encoded?" },
      a: {
        ru: "После конвертации в карточке результата появится отметка «Без перекодирования», если потоки H.264 и AAC были скопированы. Для файлов примерно до 2008 года со старыми кодеками видео перекодируется.",
        en: "After conversion the result shows a “No re-encoding” badge when the H.264 and AAC streams were copied. Files from roughly before 2008 with older codecs are re-encoded.",
      },
    },
  },
  {
    from: "3gp",
    to: "mp4",
    kind: "video",
    mode: "mixed",
    title: { ru: "3GP в MP4 онлайн — видео со старого телефона", en: "3GP to MP4 online — old phone videos" },
    h1: { ru: "Конвертировать 3GP в MP4", en: "Convert 3GP to MP4" },
    description: {
      ru: "3GP в MP4: видео с кнопочных телефонов (H.263, MPEG-4) перекодируется в H.264, звук AMR — в AAC. Если внутри уже H.264 и AAC — просто переупаковка.",
      en: "3GP to MP4: feature-phone video (H.263, MPEG-4) is re-encoded to H.264 and AMR audio to AAC. If it already holds H.264 and AAC, it's just repackaged.",
    },
    lead: { ru: "Видео со старого телефона превращается в MP4, который откроется на любом современном устройстве.", en: "Video from an old phone becomes an MP4 that opens on any modern device." },
    note: {
      ru: "3GP — облегчённая версия MP4 для телефонов начала 2000-х. Видео H.263 или MPEG-4 и речевой звук AMR современные устройства часто не воспроизводят, поэтому они перекодируются в H.264 и AAC; если внутри уже H.264 и AAC, файл просто переупаковывается.",
      en: "3GP is a lightweight MP4 for early-2000s phones. H.263 or MPEG-4 video and AMR speech audio often don't play on modern devices, so they are re-encoded to H.264 and AAC; if the file already holds H.264 and AAC, it is simply repackaged.",
    },
    faq: {
      q: { ru: "Почему у видео со старого телефона глухой звук?", en: "Why does old phone video sound muffled?" },
      a: {
        ru: "Кодек AMR-NB записывает звук с частотой 8 кГц — это полоса телефонного разговора, примерно до 3,4 кГц. Конвертация не добавит утраченных частот, но звук станет воспроизводиться везде.",
        en: "The AMR-NB codec records at 8 kHz — telephone bandwidth, roughly up to 3.4 kHz. Converting can't restore the missing frequencies, but the sound will play everywhere.",
      },
    },
  },
  {
    from: "mts",
    to: "mp4",
    kind: "video",
    mode: "mixed",
    title: { ru: "MTS в MP4 онлайн — видео с камер AVCHD", en: "MTS to MP4 online — AVCHD camcorder video" },
    h1: { ru: "Конвертировать MTS в MP4", en: "Convert MTS to MP4" },
    description: {
      ru: "MTS и M2TS в MP4: видео H.264 с камер Sony, Panasonic и Canon копируется без перекодирования, звук Dolby Digital переводится в AAC. Работает в браузере.",
      en: "MTS and M2TS to MP4: H.264 video from Sony, Panasonic and Canon camcorders is copied without re-encoding and Dolby Digital audio becomes AAC. Runs in your browser.",
    },
    lead: { ru: "Записи камеры AVCHD превращаются в MP4 без перекодирования видео — картинка остаётся исходной.", en: "AVCHD camcorder clips become MP4 without re-encoding the video — the picture stays original." },
    note: {
      ru: "Камеры AVCHD пишут H.264 в транспортный поток MPEG-2 со звуком Dolby Digital (AC-3). Видео переносится в MP4 как есть, а звук AC-3 перекодируется в AAC, чтобы ролик играл на телефонах и в браузерах.",
      en: "AVCHD camcorders write H.264 into an MPEG-2 transport stream with Dolby Digital (AC-3) audio. The video goes into MP4 as is, while the AC-3 audio is re-encoded to AAC so the clip plays on phones and in browsers.",
    },
    faq: {
      q: { ru: "Камера разбила запись на несколько MTS-файлов — как их соединить?", en: "The camera split a recording into several MTS files — how do I join them?" },
      a: {
        ru: "Сконвертируйте каждый файл (00000.MTS, 00001.MTS…) в MP4, затем соедините их инструментом «Склеить видео». Клипы с одинаковыми параметрами склеиваются без перекодирования.",
        en: "Convert each file (00000.MTS, 00001.MTS…) to MP4, then join them with “Merge videos”. Clips with identical settings are joined without re-encoding.",
      },
    },
  },
  {
    from: "m4v",
    to: "mp4",
    kind: "video",
    mode: "copy",
    title: { ru: "M4V в MP4 онлайн — переупаковка за секунды", en: "M4V to MP4 online — repackaged in seconds" },
    h1: { ru: "Конвертировать M4V в MP4", en: "Convert M4V to MP4" },
    description: {
      ru: "M4V в MP4 без перекодирования: M4V — это MP4 от Apple, поэтому видео и звук просто переупаковываются за секунды. Файлы с DRM из iTunes не поддерживаются.",
      en: "M4V to MP4 without re-encoding: M4V is Apple's MP4, so video and audio are simply repackaged in seconds. DRM-protected iTunes purchases aren't supported.",
    },
    lead: { ru: "M4V переупаковывается в MP4 без изменения видео и звука — быстро и без потерь.", en: "M4V is repackaged as MP4 without touching the video or audio — fast and lossless." },
    note: {
      ru: "M4V — вариант MP4, который Apple использует в iTunes и HandBrake по умолчанию. Потоки H.264 или HEVC и AAC копируются в чистый MP4; дорожки AC-3, если есть, перекодируются в AAC.",
      en: "M4V is the MP4 variant Apple uses in iTunes and HandBrake uses by default. H.264 or HEVC and AAC streams are copied into a clean MP4; AC-3 tracks, if any, are re-encoded to AAC.",
    },
    faq: {
      q: { ru: "Можно ли просто переименовать .m4v в .mp4?", en: "Can I just rename .m4v to .mp4?" },
      a: {
        ru: "Часто да — это тот же контейнер. Но если в файле есть звук AC-3, главы или дополнительные дорожки, некоторые плееры запнутся. Конвертер создаёт чистый MP4 с одной видео- и одной звуковой дорожкой.",
        en: "Often yes — it is the same container. But if the file has AC-3 audio, chapters or extra tracks, some players will choke. The converter makes a clean MP4 with one video and one audio track.",
      },
    },
  },
  {
    from: "ts",
    to: "mp4",
    kind: "video",
    mode: "mixed",
    title: { ru: "TS в MP4 онлайн — записи ТВ и HLS", en: "TS to MP4 online — TV and HLS recordings" },
    h1: { ru: "Конвертировать TS в MP4", en: "Convert TS to MP4" },
    description: {
      ru: "TS в MP4 онлайн: H.264 и AAC из транспортного потока копируются без перекодирования, MPEG-2 из старых ТВ-записей перекодируется в H.264.",
      en: "TS to MP4 online: H.264 and AAC from the transport stream are copied without re-encoding; MPEG-2 from older TV recordings is re-encoded to H.264.",
    },
    lead: { ru: "Файл транспортного потока превращается в обычный MP4 — чаще всего без перекодирования.", en: "A transport stream file becomes a regular MP4 — usually without re-encoding." },
    note: {
      ru: "TS (MPEG transport stream) используют цифровое ТВ, IPTV и трансляции HLS. Современные записи содержат H.264 и AAC — они переносятся в MP4 без изменений. Видео MPEG-2 из старых эфиров перекодируется в H.264, звук AC-3 или MP2 — в AAC.",
      en: "TS (MPEG transport stream) is used by digital TV, IPTV and HLS streams. Modern recordings carry H.264 and AAC, which move into MP4 unchanged. MPEG-2 video from older broadcasts is re-encoded to H.264, and AC-3 or MP2 audio to AAC.",
    },
    faq: {
      q: { ru: "Как соединить много .ts-фрагментов одной трансляции?", en: "How do I join many .ts segments of one stream?" },
      a: {
        ru: "Фрагменты одной трансляции идут подряд с одинаковыми параметрами: добавьте их по порядку в «Склеить видео» — они соединятся без перекодирования. Потом при необходимости сконвертируйте результат в MP4.",
        en: "Segments of one stream share the same settings: add them in order to “Merge videos” and they are joined without re-encoding. Convert the result to MP4 afterwards if needed.",
      },
    },
  },
  {
    from: "mpeg",
    to: "mp4",
    kind: "video",
    mode: "encode",
    title: { ru: "MPEG в MP4 онлайн — MPG, Video CD, ТВ-тюнеры", en: "MPEG to MP4 online — MPG, Video CD, TV tuners" },
    h1: { ru: "Конвертировать MPEG в MP4", en: "Convert MPEG to MP4" },
    description: {
      ru: "MPG и MPEG в MP4: видео MPEG-1 и MPEG-2 перекодируется в H.264, файл обычно заметно уменьшается при той же картинке. Обработка идёт в браузере.",
      en: "MPG and MPEG to MP4: MPEG-1 and MPEG-2 video is re-encoded to H.264, which usually makes the file noticeably smaller at the same quality. Processing stays in the browser.",
    },
    lead: { ru: "Файлы MPG из Video CD и ТВ-тюнеров превращаются в компактный MP4 с H.264.", en: "MPG files from Video CDs and TV tuners become compact H.264 MP4s." },
    note: {
      ru: "MPEG-1 и MPEG-2 — кодеки 1990-х: Video CD, DVD, записи ТВ-тюнеров. Браузеры их не декодируют, поэтому работает модуль ffmpeg: видео перекодируется в H.264, звук MP2 или AC-3 — в AAC.",
      en: "MPEG-1 and MPEG-2 are 1990s codecs used on Video CDs, DVDs and TV tuner recordings. Browsers don't decode them, so the ffmpeg module does the work: video is re-encoded to H.264, and MP2 or AC-3 audio to AAC.",
    },
    faq: {
      q: { ru: "Уменьшится ли размер файла?", en: "Will the file get smaller?" },
      a: {
        ru: "Как правило, да: H.264 при сопоставимом качестве требует примерно вдвое меньший битрейт, чем MPEG-2. Для сильного уменьшения используйте «Сжать видео».",
        en: "Usually yes: at comparable quality H.264 needs roughly half the bitrate of MPEG-2. For a bigger reduction use “Compress video”.",
      },
    },
  },
  {
    from: "vob",
    to: "mp4",
    kind: "video",
    mode: "encode",
    title: { ru: "VOB в MP4 онлайн — конвертер файлов DVD", en: "VOB to MP4 online — convert DVD files" },
    h1: { ru: "Конвертировать VOB в MP4", en: "Convert VOB to MP4" },
    description: {
      ru: "VOB в MP4: фильмы и домашние записи с DVD перекодируются из MPEG-2 в H.264, звук AC-3 — в AAC. Загрузите файлы из папки VIDEO_TS — всё обработается локально.",
      en: "VOB to MP4: films and home videos from DVDs are re-encoded from MPEG-2 to H.264 and AC-3 audio to AAC. Load files from the VIDEO_TS folder — all processing is local.",
    },
    lead: { ru: "Файлы VOB с DVD превращаются в MP4, который можно смотреть на телефоне и телевизоре.", en: "VOB files from a DVD become MP4s you can watch on a phone or TV." },
    note: {
      ru: "На DVD видео лежит в папке VIDEO_TS в файлах VTS_01_1.VOB, VTS_01_2.VOB и т. д. по 1 ГБ; VIDEO_TS.VOB — это меню. Модуль ffmpeg перекодирует MPEG-2 в H.264 и звук в AAC; субтитры DVD не переносятся.",
      en: "On a DVD the video sits in the VIDEO_TS folder as VTS_01_1.VOB, VTS_01_2.VOB and so on, 1 GB each; VIDEO_TS.VOB is the menu. The ffmpeg module re-encodes MPEG-2 to H.264 and the audio to AAC; DVD subtitles are not carried over.",
    },
    faq: {
      q: { ru: "Как сконвертировать весь фильм с DVD?", en: "How do I convert a whole DVD film?" },
      a: {
        ru: "Фильм разбит на несколько VOB по 1 ГБ. Сконвертируйте их по очереди в MP4, затем соедините в «Склеить видео». Диски с защитой от копирования (CSS) этот инструмент не читает.",
        en: "The film is split into several 1 GB VOB files. Convert them one by one to MP4, then join them with “Merge videos”. Copy-protected (CSS) discs can't be read by this tool.",
      },
    },
  },
  {
    from: "mp4",
    to: "webm",
    kind: "video",
    mode: "encode",
    title: { ru: "MP4 в WebM онлайн — VP9 и Opus для сайтов", en: "MP4 to WebM online — VP9 and Opus for the web" },
    h1: { ru: "Конвертировать MP4 в WebM", en: "Convert MP4 to WebM" },
    description: {
      ru: "MP4 в WebM в браузере: видео кодируется в VP9 (или VP8), звук — в Opus. Открытый формат без патентных отчислений для фонового видео на сайтах.",
      en: "MP4 to WebM in the browser: video is encoded to VP9 (or VP8) and audio to Opus. An open, royalty-free format for background video on websites.",
    },
    lead: { ru: "MP4 перекодируется в WebM с VP9 и Opus — удобный формат для тега video на сайте.", en: "MP4 is re-encoded to WebM with VP9 and Opus — a handy format for the video tag on a website." },
    note: {
      ru: "WebM требует кодеков VP8, VP9 или AV1, поэтому видео H.264 всегда перекодируется. Конвертер выбирает VP9, если браузер умеет его кодировать, иначе VP8; звук кодируется в Opus.",
      en: "WebM requires VP8, VP9 or AV1, so H.264 video is always re-encoded. The converter picks VP9 when the browser can encode it, otherwise VP8; audio is encoded to Opus.",
    },
    faq: {
      q: { ru: "Зачем переводить MP4 в WebM?", en: "Why convert MP4 to WebM?" },
      a: {
        ru: "VP9 при той же картинке обычно даёт файл легче, чем H.264, а формат открытый и бесплатный. Для сайтов часто кладут оба варианта: WebM для Chrome и Firefox и MP4 как запасной.",
        en: "At the same picture quality VP9 usually gives a smaller file than H.264, and the format is open and free. Websites often ship both: WebM for Chrome and Firefox and MP4 as a fallback.",
      },
    },
  },
  {
    from: "mp4",
    to: "mov",
    kind: "video",
    mode: "copy",
    title: { ru: "MP4 в MOV онлайн — для Final Cut и iMovie", en: "MP4 to MOV online — for Final Cut and iMovie" },
    h1: { ru: "Конвертировать MP4 в MOV", en: "Convert MP4 to MOV" },
    description: {
      ru: "MP4 в MOV без перекодирования: видео H.264 или HEVC и звук AAC переносятся в контейнер QuickTime за секунды — для Final Cut Pro, iMovie и Keynote.",
      en: "MP4 to MOV without re-encoding: H.264 or HEVC video and AAC audio move into a QuickTime container in seconds — for Final Cut Pro, iMovie and Keynote.",
    },
    lead: { ru: "MP4 переупаковывается в MOV за секунды — без перекодирования и без потери качества.", en: "MP4 is repackaged as MOV in seconds — no re-encoding, no quality loss." },
    note: {
      ru: "MP4 и MOV — родственные контейнеры, поэтому H.264, HEVC и AAC просто копируются. Если внутри MP4 оказался AV1 или VP9, которые MOV не принимает, видео перекодируется в H.264.",
      en: "MP4 and MOV are sibling containers, so H.264, HEVC and AAC are simply copied. If the MP4 contains AV1 or VP9, which MOV doesn't accept, the video is re-encoded to H.264.",
    },
    faq: {
      q: { ru: "Станет ли качество лучше в MOV?", en: "Will MOV look better?" },
      a: {
        ru: "Нет: это та же картинка в другом контейнере. MOV нужен, когда программа (например, старые версии Final Cut) ожидает именно его.",
        en: "No: it's the same picture in a different container. MOV is only needed when an app — such as older Final Cut versions — expects it.",
      },
    },
  },
  {
    from: "mp4",
    to: "gif",
    kind: "video",
    mode: "encode",
    title: { ru: "MP4 в GIF онлайн — анимация с палитрой", en: "MP4 to GIF online — animation with a real palette" },
    h1: { ru: "Конвертировать MP4 в GIF", en: "Convert MP4 to GIF" },
    description: {
      ru: "MP4 в GIF онлайн: палитра из 256 цветов подбирается по кадрам, можно задать частоту кадров, ширину и зацикливание. Без водяных знаков и загрузки.",
      en: "MP4 to GIF online: a 256-colour palette is built from the frames; set the frame rate, width and looping. No watermarks, no uploads.",
    },
    lead: { ru: "Выберите фрагмент видео — получите GIF с подобранной палитрой, без водяных знаков.", en: "Pick part of a video and get a GIF with a proper palette and no watermark." },
    note: {
      ru: "В GIF максимум 256 цветов на кадр, поэтому палитра подбирается по самим кадрам: общая для всего GIF (меньше файл, цвета не «прыгают») или своя для каждого кадра (точнее цвета). Задержки кадров считаются в сотых долях секунды без накопления ошибки.",
      en: "GIF allows at most 256 colours per frame, so the palette is built from the frames themselves: one for the whole GIF (smaller file, stable colours) or one per frame (more accurate colours). Frame delays are computed in hundredths of a second without accumulating error.",
    },
    faq: {
      q: { ru: "Почему GIF весит больше исходного MP4?", en: "Why is the GIF larger than the original MP4?" },
      a: {
        ru: "GIF сжимает каждый кадр почти как отдельную картинку, без предсказания движения, как в H.264. Поэтому GIF обычно в разы тяжелее видео — держите его коротким (2–10 секунд) и шириной 320–640 пикселей.",
        en: "GIF compresses each frame almost like a separate image, without H.264-style motion prediction, so GIFs are usually many times heavier than video — keep them short (2–10 seconds) and 320–640 pixels wide.",
      },
    },
  },
  {
    from: "mov",
    to: "gif",
    kind: "video",
    mode: "encode",
    title: { ru: "MOV в GIF онлайн — GIF из видео с iPhone", en: "MOV to GIF online — GIFs from iPhone videos" },
    h1: { ru: "Конвертировать MOV в GIF", en: "Convert MOV to GIF" },
    description: {
      ru: "MOV в GIF: сделайте анимацию из видео или Live Photo с iPhone — выберите фрагмент, частоту кадров и ширину. Палитра до 256 цветов, всё в браузере.",
      en: "MOV to GIF: turn an iPhone video or Live Photo into an animation — pick the part, frame rate and width. Up to 256-colour palette, all in the browser.",
    },
    lead: { ru: "Видео или Live Photo с iPhone превращается в GIF за пару кликов.", en: "An iPhone video or Live Photo becomes a GIF in a couple of clicks." },
    note: {
      ru: "MOV с iPhone обычно в HEVC или H.264 — браузер декодирует его сам, поэтому кадры извлекаются быстро. Для GIF выбирайте 10–15 кадров в секунду и ширину 480 пикселей — так анимация плавная, а файл умеренный.",
      en: "iPhone MOVs are usually HEVC or H.264, which the browser decodes itself, so frames are extracted quickly. For a GIF, 10–15 frames per second and a 480-pixel width give smooth motion at a moderate size.",
    },
    faq: {
      q: { ru: "Как сделать GIF из Live Photo?", en: "How do I make a GIF from a Live Photo?" },
      a: {
        ru: "В приложении «Фото» откройте Live Photo, нажмите «Поделиться» → «Сохранить как видео». Получится короткий MOV — загрузите его сюда и нажмите «Конвертировать».",
        en: "In the Photos app open the Live Photo and tap Share → Save as Video. You'll get a short MOV — load it here and convert.",
      },
    },
  },
  {
    from: "webm",
    to: "gif",
    kind: "video",
    mode: "encode",
    title: { ru: "WebM в GIF онлайн — анимация из записи экрана", en: "WebM to GIF online — animate screen recordings" },
    h1: { ru: "Конвертировать WebM в GIF", en: "Convert WebM to GIF" },
    description: {
      ru: "WebM в GIF онлайн: превратите запись экрана или клип VP8/VP9 в анимацию для чата, документации или README. Выбор фрагмента, fps и ширины.",
      en: "WebM to GIF online: turn a screen recording or VP8/VP9 clip into an animation for chats, docs or a README. Choose the part, fps and width.",
    },
    lead: { ru: "Короткая запись экрана в WebM превращается в GIF, который вставляется куда угодно.", en: "A short WebM screen recording becomes a GIF you can paste anywhere." },
    note: {
      ru: "GIF удобен там, где видео не проигрывается само: в README на GitHub, в документации, в некоторых чатах. Для интерфейсов и схем выбирайте палитру «на кадр» — мелкий текст и линии остаются чёткими.",
      en: "GIFs are handy where video won't autoplay: GitHub READMEs, documentation, some chats. For UI and diagrams choose the per-frame palette so small text and lines stay crisp.",
    },
    faq: {
      q: { ru: "Как сделать GIF из записи экрана?", en: "How do I make a GIF from a screen recording?" },
      a: {
        ru: "Запишите экран инструментом «Запись экрана» (получится WebM или MP4), затем выберите здесь 2–10 секунд, ширину 480–800 пикселей и 10–15 кадров в секунду.",
        en: "Record with the “Screen recorder” (you get WebM or MP4), then choose 2–10 seconds here, a width of 480–800 pixels and 10–15 frames per second.",
      },
    },
  },
  {
    from: "gif",
    to: "mp4",
    kind: "video",
    mode: "encode",
    title: { ru: "GIF в MP4 онлайн — в разы меньше размер", en: "GIF to MP4 online — many times smaller" },
    h1: { ru: "Конвертировать GIF в MP4", en: "Convert GIF to MP4" },
    description: {
      ru: "GIF в MP4: анимация кодируется в H.264 с сохранением задержек кадров. Видео обычно весит в разы меньше GIF и загружается в соцсети, где GIF не принимают.",
      en: "GIF to MP4: the animation is encoded to H.264 keeping frame timing. The video is usually many times smaller than the GIF and uploads where GIFs aren't accepted.",
    },
    lead: { ru: "GIF превращается в лёгкое MP4-видео — с теми же кадрами и скоростью.", en: "A GIF becomes a light MP4 with the same frames and speed." },
    note: {
      ru: "Кадры GIF декодируются браузером (ImageDecoder) вместе с их задержками и кодируются в H.264. H.264 требует чётных размеров, поэтому кадр при необходимости округляется до чётного числа пикселей. Если ImageDecoder недоступен, работает модуль ffmpeg.",
      en: "GIF frames are decoded by the browser (ImageDecoder) together with their delays and encoded to H.264. H.264 needs even dimensions, so the frame is rounded to an even number of pixels if necessary. Without ImageDecoder the ffmpeg module takes over.",
    },
    faq: {
      q: { ru: "Сохранится ли прозрачность?", en: "Is transparency kept?" },
      a: {
        ru: "Нет: H.264 не поддерживает прозрачность, прозрачные области станут белыми. Если прозрачность важна, оставьте GIF или используйте анимированный WebP.",
        en: "No: H.264 has no transparency, so transparent areas become white. If you need transparency, keep the GIF or use animated WebP.",
      },
    },
  },
];

export const AUDIO_PAIRS: Pair[] = [
  {
    from: "wav",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "WAV в MP3 онлайн — конвертер без загрузки", en: "WAV to MP3 online — convert without uploading" },
    h1: { ru: "Конвертировать WAV в MP3", en: "Convert WAV to MP3" },
    description: {
      ru: "WAV в MP3 онлайн: несжатый звук кодируется в MP3 на 128–320 кбит/с — файл становится в 4–11 раз меньше. Кодирует LAME прямо в браузере, без загрузки.",
      en: "WAV to MP3 online: uncompressed audio is encoded to 128–320 kbit/s MP3, making the file 4–11 times smaller. LAME encodes right in your browser, nothing is uploaded.",
    },
    lead: { ru: "Перетащите WAV — получите MP3 нужного битрейта, в несколько раз меньше по размеру.", en: "Drop a WAV and get an MP3 at the bitrate you choose — several times smaller." },
    note: {
      ru: "WAV качества CD занимает около 10 МБ на минуту (1411 кбит/с), а MP3 на 192 кбит/с — около 1,4 МБ, примерно в 7 раз меньше. MP3 кодирует библиотека LAME в составе модуля ffmpeg: он загружается с этого сайта один раз и дальше берётся из кэша.",
      en: "A CD-quality WAV takes about 10 MB per minute (1411 kbit/s), while a 192 kbit/s MP3 takes about 1.4 MB — roughly 7 times less. MP3 is encoded by the LAME library inside the ffmpeg module, which is downloaded from this site once and then cached.",
    },
    faq: {
      q: { ru: "Какой битрейт MP3 выбрать?", en: "Which MP3 bitrate should I choose?" },
      a: {
        ru: "192 кбит/с — хороший баланс для музыки, 320 кбит/с — максимум формата. Для речи, лекций и подкастов достаточно 96–128 кбит/с.",
        en: "192 kbit/s is a good balance for music and 320 kbit/s is the format's maximum. For speech, lectures and podcasts 96–128 kbit/s is enough.",
      },
    },
  },
  {
    from: "m4a",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "M4A в MP3 онлайн — iTunes и диктофон iPhone", en: "M4A to MP3 online — iTunes and iPhone memos" },
    h1: { ru: "Конвертировать M4A в MP3", en: "Convert M4A to MP3" },
    description: {
      ru: "M4A в MP3: записи диктофона iPhone и треки iTunes (AAC или ALAC) перекодируются в MP3 на 128–320 кбит/с. Пакетная обработка, файлы не загружаются.",
      en: "M4A to MP3: iPhone Voice Memos and iTunes tracks (AAC or ALAC) are re-encoded to 128–320 kbit/s MP3. Batch processing, and your files are never uploaded.",
    },
    lead: { ru: "M4A из iTunes или диктофона iPhone превращается в MP3, который играет в любом плеере.", en: "M4A from iTunes or iPhone Voice Memos becomes an MP3 that plays in any player." },
    note: {
      ru: "M4A — это звук AAC (или ALAC без потерь) в контейнере MP4. Браузер декодирует его сам, а MP3 кодирует модуль ffmpeg с библиотекой LAME. Файлы M4P с защитой старого iTunes не конвертируются.",
      en: "M4A is AAC (or lossless ALAC) audio in an MP4 container. The browser decodes it, and the ffmpeg module encodes MP3 with the LAME library. Protected M4P files from old iTunes can't be converted.",
    },
    faq: {
      q: { ru: "Улучшится ли качество после перевода M4A в MP3?", en: "Does converting M4A to MP3 improve quality?" },
      a: {
        ru: "Нет. Перекодирование из одного формата с потерями в другой не возвращает утраченное. Выбирайте битрейт не ниже исходного — его видно в сведениях о файле после загрузки.",
        en: "No. Re-encoding from one lossy format to another can't bring back what was lost. Choose a bitrate at least as high as the original — it's shown in the file details after you load it.",
      },
    },
  },
  {
    from: "flac",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "FLAC в MP3 онлайн — для телефона и машины", en: "FLAC to MP3 online — for phone and car" },
    h1: { ru: "Конвертировать FLAC в MP3", en: "Convert FLAC to MP3" },
    description: {
      ru: "FLAC в MP3 онлайн: музыка без потерь кодируется в MP3 на 256–320 кбит/с — файлы в 3–4 раза меньше для телефона, машины и плеера. Работает в браузере.",
      en: "FLAC to MP3 online: lossless music is encoded to 256–320 kbit/s MP3 — files 3–4 times smaller for your phone, car or player. Works in your browser.",
    },
    lead: { ru: "Альбом во FLAC превращается в MP3, который поместится в телефон и заиграет в машине.", en: "A FLAC album becomes MP3 that fits on your phone and plays in the car." },
    note: {
      ru: "FLAC хранит звук без потерь, обычно 700–1000 кбит/с. MP3 на 320 кбит/с большинство слушателей на телефоне и в машине не отличат от оригинала, а занимает он в 3–4 раза меньше места. Теги (исполнитель, альбом) переносятся не всегда — проверьте их после конвертации.",
      en: "FLAC stores audio losslessly, typically at 700–1000 kbit/s. Most listeners can't tell a 320 kbit/s MP3 from the original on a phone or in a car, and it takes 3–4 times less space. Tags (artist, album) aren't always carried over — check them after converting.",
    },
    faq: {
      q: { ru: "Какой битрейт выбрать для перевода FLAC в MP3?", en: "Which bitrate should I use for FLAC to MP3?" },
      a: {
        ru: "Для музыки берите 256–320 кбит/с. Меньший битрейт экономит место, но на хороших наушниках разница с FLAC становится слышна.",
        en: "For music use 256–320 kbit/s. A lower bitrate saves space, but on good headphones the difference from FLAC becomes audible.",
      },
    },
  },
  {
    from: "ogg",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "OGG в MP3 онлайн — Vorbis и Opus в MP3", en: "OGG to MP3 online — Vorbis and Opus to MP3" },
    h1: { ru: "Конвертировать OGG в MP3", en: "Convert OGG to MP3" },
    description: {
      ru: "OGG в MP3 онлайн: Vorbis и Opus из игр, Википедии и голосовых сообщений перекодируются в MP3, который читают автомагнитолы и старые плееры.",
      en: "OGG to MP3 online: Vorbis and Opus from games, Wikipedia and voice messages are re-encoded to MP3 that car stereos and older players can read.",
    },
    lead: { ru: "OGG-файл превращается в MP3, который откроется на любом устройстве.", en: "An OGG file becomes an MP3 that opens on any device." },
    note: {
      ru: "OGG — контейнер Xiph.Org, внутри обычно Vorbis (игры, Википедия) или Opus (голосовые сообщения). Браузер декодирует оба кодека сам, а MP3 кодирует модуль ffmpeg.",
      en: "OGG is a Xiph.Org container that usually holds Vorbis (games, Wikipedia) or Opus (voice messages). The browser decodes both codecs itself, and the ffmpeg module encodes the MP3.",
    },
    faq: {
      q: { ru: "Зачем переводить OGG в MP3, если OGG тоже хороший формат?", en: "Why convert OGG to MP3 if OGG is a good format?" },
      a: {
        ru: "По качеству Vorbis не уступает MP3, но многие автомагнитолы, медиацентры и программы OGG не открывают. MP3 понимают все.",
        en: "Vorbis is as good as MP3 quality-wise, but many car stereos, media centres and apps can't open OGG. Everything understands MP3.",
      },
    },
  },
  {
    from: "webm",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "WebM в MP3 онлайн — звук из WebM-файла", en: "WebM to MP3 online — audio from WebM files" },
    h1: { ru: "Конвертировать WebM в MP3", en: "Convert WebM to MP3" },
    description: {
      ru: "WebM в MP3: звук Opus или Vorbis из WebM-файла или записи браузерного диктофона перекодируется в MP3. Видеодорожка отбрасывается, обработка локальная.",
      en: "WebM to MP3: Opus or Vorbis audio from a WebM file or browser voice recording is re-encoded to MP3. Any video track is dropped; processing stays local.",
    },
    lead: { ru: "Звуковая дорожка WebM сохраняется как MP3 — видео, если оно есть, отбрасывается.", en: "The WebM soundtrack is saved as MP3 — video, if any, is dropped." },
    note: {
      ru: "WebM-файлы со звуком Opus получаются при записи микрофона в Chrome и Firefox; в WebM хранятся и аудиодорожки многих видеосервисов. Декодирование делает браузер, кодирование MP3 — модуль ffmpeg.",
      en: "WebM files with Opus audio come from microphone recordings in Chrome and Firefox; many video services also store audio tracks as WebM. The browser decodes, and the ffmpeg module encodes the MP3.",
    },
    faq: {
      q: { ru: "Почему запись с микрофона сохранилась в WebM?", en: "Why did my microphone recording save as WebM?" },
      a: {
        ru: "Chrome и Firefox записывают звук через MediaRecorder в WebM с кодеком Opus — это их формат по умолчанию. Safari записывает в MP4 (AAC).",
        en: "Chrome and Firefox record through MediaRecorder into WebM with the Opus codec — their default. Safari records to MP4 (AAC).",
      },
    },
  },
  {
    from: "mp4",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "MP4 в MP3 онлайн — извлечь звук из видео", en: "MP4 to MP3 online — extract audio from video" },
    h1: { ru: "Конвертировать MP4 в MP3", en: "Convert MP4 to MP3" },
    description: {
      ru: "MP4 в MP3: звуковая дорожка извлекается из видео и кодируется в MP3 на 128–320 кбит/с. Видео не декодируется, поэтому это быстро. Без загрузки на сервер.",
      en: "MP4 to MP3: the audio track is pulled out of the video and encoded to 128–320 kbit/s MP3. Video isn't decoded, so it's fast. No uploading to a server.",
    },
    lead: { ru: "Вытащите звук из видео в MP3 — музыку из клипа, лекцию или подкаст.", en: "Pull the audio out of a video as MP3 — music from a clip, a lecture or a podcast." },
    note: {
      ru: "Звук в MP4 обычно в AAC. Видеодорожка пропускается без декодирования, а звук перекодируется в MP3 модулем ffmpeg. Если нужен звук без потерь, выберите M4A — AAC скопируется бит в бит.",
      en: "MP4 audio is usually AAC. The video track is skipped without decoding and the audio is re-encoded to MP3 by the ffmpeg module. For lossless extraction pick M4A — the AAC is copied bit for bit.",
    },
    faq: {
      q: { ru: "Можно ли извлечь звук из видео без потерь?", en: "Can I extract audio from a video losslessly?" },
      a: {
        ru: "Да, если не обязательно MP3: выберите формат M4A — дорожка AAC будет скопирована без перекодирования. MP3 всегда означает повторное сжатие.",
        en: "Yes, if it doesn't have to be MP3: choose M4A and the AAC track is copied without re-encoding. MP3 always means compressing again.",
      },
    },
  },
  {
    from: "aac",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "AAC в MP3 онлайн — для старых плееров", en: "AAC to MP3 online — for older players" },
    h1: { ru: "Конвертировать AAC в MP3", en: "Convert AAC to MP3" },
    description: {
      ru: "AAC в MP3 онлайн: поток ADTS из интернет-радио и диктофонов Android перекодируется в MP3 128–320 кбит/с для автомагнитол и старых плееров.",
      en: "AAC to MP3 online: ADTS streams from internet radio and Android recorders are re-encoded to 128–320 kbit/s MP3 for car stereos and older players.",
    },
    lead: { ru: "Файл .aac превращается в MP3, который понимает любое устройство.", en: "An .aac file becomes an MP3 that any device understands." },
    note: {
      ru: "Файлы .aac — это «сырой» поток ADTS без контейнера: их пишут диктофоны Android и интернет-радио. Браузер декодирует AAC, а MP3 кодирует модуль ffmpeg.",
      en: ".aac files are a raw ADTS stream without a container, written by Android recorders and internet radio. The browser decodes the AAC and the ffmpeg module encodes the MP3.",
    },
    faq: {
      q: { ru: "AAC ведь лучше MP3 — зачем конвертировать?", en: "Isn't AAC better than MP3 — why convert?" },
      a: {
        ru: "При том же битрейте AAC обычно звучит лучше, но некоторые автомагнитолы, плееры и программы понимают только MP3. Если совместимость не нужна, оставьте AAC или сохраните в M4A.",
        en: "At the same bitrate AAC usually sounds better, but some car stereos, players and apps only understand MP3. If compatibility isn't an issue, keep the AAC or save it as M4A.",
      },
    },
  },
  {
    from: "opus",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "OPUS в MP3 онлайн — голосовые WhatsApp и Telegram", en: "OPUS to MP3 online — WhatsApp and Telegram voice" },
    h1: { ru: "Конвертировать OPUS в MP3", en: "Convert OPUS to MP3" },
    description: {
      ru: "OPUS в MP3: голосовые сообщения WhatsApp (.opus) и Telegram (.oga) перекодируются в MP3, который откроется на любом компьютере. Файлы не покидают браузер.",
      en: "OPUS to MP3: WhatsApp (.opus) and Telegram (.oga) voice messages are re-encoded to MP3 that opens on any computer. Your files never leave the browser.",
    },
    lead: { ru: "Голосовое сообщение превращается в MP3, который можно открыть где угодно или вставить в монтаж.", en: "A voice message becomes an MP3 you can open anywhere or drop into an edit." },
    note: {
      ru: "WhatsApp и Telegram хранят голосовые в кодеке Opus внутри Ogg — он отлично сжимает речь, но старые программы его не открывают. Для речи в MP3 достаточно 64–96 кбит/с.",
      en: "WhatsApp and Telegram store voice notes as Opus in an Ogg container — excellent for speech, but older apps can't open it. For speech, 64–96 kbit/s MP3 is plenty.",
    },
    faq: {
      q: { ru: "Как сохранить голосовое сообщение WhatsApp в MP3?", en: "How do I save a WhatsApp voice message as MP3?" },
      a: {
        ru: "Сохраните сообщение как файл: на Android голосовые лежат в папке WhatsApp Voice Notes, на iPhone — «Поделиться» → «Сохранить в Файлы». Затем загрузите файл сюда.",
        en: "Save the message as a file: on Android voice notes live in the WhatsApp Voice Notes folder, on iPhone use Share → Save to Files. Then load the file here.",
      },
    },
  },
  {
    from: "wma",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "WMA в MP3 онлайн — музыка Windows Media", en: "WMA to MP3 online — Windows Media music" },
    h1: { ru: "Конвертировать WMA в MP3", en: "Convert WMA to MP3" },
    description: {
      ru: "WMA в MP3: музыка из Windows Media Player (WMA Standard, Pro и Lossless) перекодируется в MP3 для телефонов и Mac. Работает локально через модуль ffmpeg.",
      en: "WMA to MP3: Windows Media Player music (WMA Standard, Pro and Lossless) is re-encoded to MP3 for phones and Macs. Runs locally through the ffmpeg module.",
    },
    lead: { ru: "Старая коллекция WMA превращается в MP3, который играет на iPhone, Android и Mac.", en: "An old WMA collection becomes MP3 that plays on iPhone, Android and Mac." },
    note: {
      ru: "WMA — формат Microsoft в контейнере ASF, браузеры его не читают. Модуль ffmpeg декодирует WMA и кодирует MP3 — это медленнее, чем для MP3 или M4A, но для музыки занимает секунды.",
      en: "WMA is Microsoft's format in an ASF container, which browsers can't read. The ffmpeg module decodes the WMA and encodes MP3 — slower than for MP3 or M4A, but seconds for a song.",
    },
    faq: {
      q: { ru: "Почему некоторые WMA не конвертируются?", en: "Why won't some WMA files convert?" },
      a: {
        ru: "Треки, купленные в старых онлайн-магазинах, бывают защищены DRM Windows Media. Такие файлы не прочитает ни одна сторонняя программа.",
        en: "Tracks bought from old online stores may be protected with Windows Media DRM. No third-party tool can read those files.",
      },
    },
  },
  {
    from: "amr",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "AMR в MP3 онлайн — записи звонков и диктофона", en: "AMR to MP3 online — call and memo recordings" },
    h1: { ru: "Конвертировать AMR в MP3", en: "Convert AMR to MP3" },
    description: {
      ru: "AMR в MP3: записи разговоров и диктофонов старых телефонов (кодек AMR, 8 кГц) перекодируются в MP3, который открывается на компьютере и в мессенджерах.",
      en: "AMR to MP3: call and voice recordings from older phones (AMR codec, 8 kHz) are re-encoded to MP3 that opens on computers and in messengers.",
    },
    lead: { ru: "Запись звонка или диктофона в AMR превращается в обычный MP3.", en: "An AMR call or memo recording becomes a regular MP3." },
    note: {
      ru: "AMR — речевой кодек 3GPP: 8 кГц и 4,75–12,2 кбит/с. Браузеры его не декодируют, поэтому работает модуль ffmpeg. Для такой записи хватит MP3 на 64 кбит/с в моно.",
      en: "AMR is a 3GPP speech codec: 8 kHz at 4.75–12.2 kbit/s. Browsers can't decode it, so the ffmpeg module does. A 64 kbit/s mono MP3 is plenty for such a recording.",
    },
    faq: {
      q: { ru: "Станет ли звук лучше после перевода в MP3?", en: "Will it sound better as MP3?" },
      a: {
        ru: "Нет: AMR хранит только полосу речи примерно до 3,4 кГц, и конвертация её не расширит. Зато MP3 откроется на любом устройстве.",
        en: "No: AMR only keeps the speech band up to about 3.4 kHz, and converting can't widen it. But the MP3 will open on any device.",
      },
    },
  },
  {
    from: "aiff",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "AIFF в MP3 онлайн — из Logic и GarageBand", en: "AIFF to MP3 online — from Logic and GarageBand" },
    h1: { ru: "Конвертировать AIFF в MP3", en: "Convert AIFF to MP3" },
    description: {
      ru: "AIFF в MP3: несжатые файлы из Logic Pro и GarageBand кодируются в MP3 на 128–320 кбит/с — примерно в 4–11 раз меньше. Обработка в браузере.",
      en: "AIFF to MP3: uncompressed files from Logic Pro and GarageBand are encoded to 128–320 kbit/s MP3 — about 4–11 times smaller. Processing stays in the browser.",
    },
    lead: { ru: "Несжатый AIFF с Mac превращается в компактный MP3 для отправки и публикации.", en: "An uncompressed Mac AIFF becomes a compact MP3 for sharing and publishing." },
    note: {
      ru: "AIFF хранит несжатый звук, как WAV. Декодирование и кодирование MP3 выполняет модуль ffmpeg прямо на странице.",
      en: "AIFF stores uncompressed audio, like WAV. The ffmpeg module decodes it and encodes the MP3 right on the page.",
    },
    faq: {
      q: { ru: "Чем AIFF отличается от WAV?", en: "How is AIFF different from WAV?" },
      a: {
        ru: "Оба хранят несжатый PCM и звучат одинаково. AIFF создан Apple (1988), WAV — Microsoft и IBM (1991); отличаются заголовки и порядок байтов в сэмплах.",
        en: "Both hold uncompressed PCM and sound identical. AIFF comes from Apple (1988), WAV from Microsoft and IBM (1991); they differ in headers and sample byte order.",
      },
    },
  },
  {
    from: "mov",
    to: "mp3",
    kind: "audio",
    mode: "encode",
    title: { ru: "MOV в MP3 онлайн — звук из видео iPhone", en: "MOV to MP3 online — audio from iPhone videos" },
    h1: { ru: "Конвертировать MOV в MP3", en: "Convert MOV to MP3" },
    description: {
      ru: "MOV в MP3: звуковая дорожка из видео iPhone или камеры извлекается и кодируется в MP3. Видео не декодируется, поэтому получается быстро. Без загрузки.",
      en: "MOV to MP3: the audio track of an iPhone or camera video is extracted and encoded to MP3. The video isn't decoded, so it's quick. No uploading.",
    },
    lead: { ru: "Сохраните звук из видео с iPhone в MP3 — концерт, лекцию или разговор.", en: "Save the audio of an iPhone video as MP3 — a concert, a lecture or a conversation." },
    note: {
      ru: "Звук в MOV обычно AAC, иногда несжатый PCM. Видеодорожка пропускается, звук кодируется в MP3. Для извлечения без потерь выберите M4A — AAC скопируется как есть.",
      en: "MOV audio is usually AAC, sometimes uncompressed PCM. The video track is skipped and the audio is encoded to MP3. For lossless extraction pick M4A — the AAC is copied as is.",
    },
    faq: {
      q: { ru: "Как вытащить звук из видео на самом iPhone?", en: "How do I get the audio out of a video on the iPhone itself?" },
      a: {
        ru: "Откройте эту страницу в Safari на iPhone, нажмите на область загрузки и выберите видео из «Фото». Готовый MP3 сохранится в «Файлы».",
        en: "Open this page in Safari on the iPhone, tap the upload area and pick the video from Photos. The MP3 is saved to the Files app.",
      },
    },
  },
  {
    from: "mp3",
    to: "wav",
    kind: "audio",
    mode: "encode",
    title: { ru: "MP3 в WAV онлайн — PCM 16 бит для монтажа", en: "MP3 to WAV online — 16-bit PCM for editing" },
    h1: { ru: "Конвертировать MP3 в WAV", en: "Convert MP3 to WAV" },
    description: {
      ru: "MP3 в WAV онлайн: звук декодируется в несжатый PCM 16 бит с исходной частотой — для монтажа, семплеров и программ, которые принимают только WAV.",
      en: "MP3 to WAV online: audio is decoded to uncompressed 16-bit PCM at the original sample rate — for editing, samplers and apps that only accept WAV.",
    },
    lead: { ru: "MP3 превращается в несжатый WAV за секунды, прямо в браузере.", en: "MP3 becomes an uncompressed WAV in seconds, right in the browser." },
    note: {
      ru: "Браузер декодирует MP3, а WAV записывается напрямую: 16 бит, частота и число каналов как в исходнике. В современных браузерах модуль ffmpeg для этого не нужен.",
      en: "The browser decodes the MP3 and the WAV is written directly: 16-bit, same sample rate and channels as the source. Modern browsers need no ffmpeg module for this.",
    },
    faq: {
      q: { ru: "Улучшится ли качество в WAV?", en: "Will WAV sound better?" },
      a: {
        ru: "Нет. WAV просто хранит уже декодированный звук без сжатия: файл станет в 4–11 раз больше, а звучать будет так же, как MP3.",
        en: "No. WAV simply stores the already decoded audio uncompressed: the file becomes 4–11 times larger but sounds the same as the MP3.",
      },
    },
  },
  {
    from: "mp3",
    to: "ogg",
    kind: "audio",
    mode: "encode",
    title: { ru: "MP3 в OGG онлайн — Vorbis для игр и Minecraft", en: "MP3 to OGG online — Vorbis for games and Minecraft" },
    h1: { ru: "Конвертировать MP3 в OGG", en: "Convert MP3 to OGG" },
    description: {
      ru: "MP3 в OGG Vorbis: звуки для Minecraft, Unity и Godot, музыка для Википедии. Битрейт 96–320 кбит/с, моно или стерео. Кодирование в браузере через ffmpeg.",
      en: "MP3 to OGG Vorbis: sounds for Minecraft, Unity and Godot, music for Wikipedia. 96–320 kbit/s, mono or stereo. Encoded in the browser via ffmpeg.",
    },
    lead: { ru: "MP3 перекодируется в OGG Vorbis — формат, который ждут игровые движки и ресурс-паки.", en: "MP3 is re-encoded to OGG Vorbis — the format game engines and resource packs expect." },
    note: {
      ru: "OGG здесь означает Ogg Vorbis — именно его используют Minecraft, многие игровые движки и Википедия. Vorbis кодирует модуль ffmpeg. Если нужен Opus в Ogg, выберите формат «Opus».",
      en: "OGG here means Ogg Vorbis — the format used by Minecraft, many game engines and Wikipedia. Vorbis is encoded by the ffmpeg module. If you need Opus in Ogg, choose the “Opus” format.",
    },
    faq: {
      q: { ru: "Подойдёт ли файл для ресурс-пака Minecraft?", en: "Will the file work in a Minecraft resource pack?" },
      a: {
        ru: "Да: Minecraft использует для звуков Ogg Vorbis. Звуки, которые должны звучать «из точки» в мире, сохраняйте в моно — стерео Minecraft проигрывает без учёта положения.",
        en: "Yes: Minecraft uses Ogg Vorbis for sounds. Save sounds that should come from a point in the world as mono — Minecraft plays stereo without positioning.",
      },
    },
  },
  {
    from: "m4a",
    to: "wav",
    kind: "audio",
    mode: "encode",
    title: { ru: "M4A в WAV онлайн — диктофон iPhone в WAV", en: "M4A to WAV online — iPhone memos to WAV" },
    h1: { ru: "Конвертировать M4A в WAV", en: "Convert M4A to WAV" },
    description: {
      ru: "M4A в WAV: запись диктофона iPhone или трек iTunes декодируется в несжатый WAV 16 бит — для монтажа, расшифровки и программ, которые не читают M4A.",
      en: "M4A to WAV: an iPhone Voice Memo or iTunes track is decoded to uncompressed 16-bit WAV — for editing, transcription and apps that can't read M4A.",
    },
    lead: { ru: "M4A превращается в WAV быстро и прямо в браузере.", en: "M4A becomes WAV quickly, right in the browser." },
    note: {
      ru: "AAC или ALAC из M4A декодируется браузером, а WAV записывается напрямую с исходной частотой. Некоторые сервисы расшифровки и старые программы монтажа принимают только WAV.",
      en: "AAC or ALAC from the M4A is decoded by the browser and the WAV is written directly at the original sample rate. Some transcription services and older editors only accept WAV.",
    },
    faq: {
      q: { ru: "Почему WAV получился таким большим?", en: "Why is the WAV so large?" },
      a: {
        ru: "WAV хранит звук без сжатия: минута стерео 48 кГц 16 бит — около 11 МБ, а в M4A та же минута занимает около 1 МБ. Это нормально.",
        en: "WAV stores audio uncompressed: a minute of 48 kHz 16-bit stereo is about 11 MB, while the same minute in M4A takes about 1 MB. That's expected.",
      },
    },
  },
  {
    from: "flac",
    to: "wav",
    kind: "audio",
    mode: "encode",
    title: { ru: "FLAC в WAV онлайн — без потерь, бит в бит", en: "FLAC to WAV online — lossless, bit for bit" },
    h1: { ru: "Конвертировать FLAC в WAV", en: "Convert FLAC to WAV" },
    description: {
      ru: "FLAC в WAV без потерь: музыка распаковывается в несжатый WAV — для записи CD, старых программ и оборудования, которое не читает FLAC. Всё в браузере.",
      en: "FLAC to WAV losslessly: music is unpacked into uncompressed WAV — for burning CDs, older software and hardware that can't read FLAC. All in the browser.",
    },
    lead: { ru: "FLAC распаковывается в WAV — звук совпадает с оригиналом полностью.", en: "FLAC is unpacked into WAV — the sound matches the original exactly." },
    note: {
      ru: "FLAC — это WAV, сжатый без потерь, поэтому при распаковке звук не меняется. WAV записывается в 16 бит; для 24-битных FLAC обратите внимание, что младшие биты при этом округляются.",
      en: "FLAC is losslessly compressed WAV, so unpacking doesn't change the sound. The WAV is written at 16 bits; note that 24-bit FLACs are rounded to 16 bits in the process.",
    },
    faq: {
      q: { ru: "Будет ли потеря качества?", en: "Is there any quality loss?" },
      a: {
        ru: "Для 16-битных FLAC (качество CD) — нет, звук совпадает бит в бит. WAV займёт примерно в 1,5–2 раза больше места.",
        en: "For 16-bit (CD-quality) FLACs — none, the sound matches bit for bit. The WAV takes about 1.5–2 times more space.",
      },
    },
  },
  {
    from: "wav",
    to: "flac",
    kind: "audio",
    mode: "encode",
    title: { ru: "WAV в FLAC онлайн — сжать без потерь", en: "WAV to FLAC online — compress losslessly" },
    h1: { ru: "Конвертировать WAV в FLAC", en: "Convert WAV to FLAC" },
    description: {
      ru: "WAV во FLAC: звук сжимается без потерь, обычно на 30–60 %, и при распаковке совпадает с оригиналом бит в бит. Для архивов музыки и записей.",
      en: "WAV to FLAC: audio is compressed losslessly, typically by 30–60%, and unpacks bit for bit identical to the original. For music and recording archives.",
    },
    lead: { ru: "WAV сжимается во FLAC без потерь — файл заметно меньше, звук тот же.", en: "WAV is compressed to FLAC losslessly — noticeably smaller, identical sound." },
    note: {
      ru: "FLAC кодирует модуль ffmpeg с уровнем сжатия 5 — стандартный баланс скорости и размера. Метаданные WAV (маркеры, сэмплерные петли) могут не сохраниться.",
      en: "FLAC is encoded by the ffmpeg module at compression level 5 — the standard balance of speed and size. WAV metadata (markers, sampler loops) may not be kept.",
    },
    faq: {
      q: { ru: "Насколько уменьшится файл?", en: "How much smaller will it get?" },
      a: {
        ru: "Обычно на 30–60 %. Сильнее сжимаются тихая и простая музыка и речь, слабее — громкий плотный рок и шум.",
        en: "Typically by 30–60%. Quiet, simple music and speech compress more; loud, dense rock and noise compress less.",
      },
    },
  },
  {
    from: "mp3",
    to: "m4a",
    kind: "audio",
    mode: "encode",
    title: { ru: "MP3 в M4A онлайн — AAC для iPhone и рингтонов", en: "MP3 to M4A online — AAC for iPhone and ringtones" },
    h1: { ru: "Конвертировать MP3 в M4A", en: "Convert MP3 to M4A" },
    description: {
      ru: "MP3 в M4A (AAC): для iPhone, Apple Music и рингтонов. Кодирует встроенный в браузер кодек AAC, битрейт 128–320 кбит/с, файл не загружается.",
      en: "MP3 to M4A (AAC): for iPhone, Apple Music and ringtones. Encoded by the browser's built-in AAC codec at 128–320 kbit/s; your file isn't uploaded.",
    },
    lead: { ru: "MP3 перекодируется в M4A с AAC — родной формат техники Apple.", en: "MP3 is re-encoded to M4A with AAC — the native format of Apple devices." },
    note: {
      ru: "AAC кодирует сам браузер через WebCodecs (в Chrome, Edge и Safari); где такого кодировщика нет — модуль ffmpeg. Для рингтона iPhone сначала обрежьте песню до 30 секунд.",
      en: "AAC is encoded by the browser itself via WebCodecs (Chrome, Edge and Safari); where that encoder is missing, the ffmpeg module steps in. For an iPhone ringtone trim the song to 30 seconds first.",
    },
    faq: {
      q: { ru: "Как сделать рингтон для iPhone?", en: "How do I make an iPhone ringtone?" },
      a: {
        ru: "Обрежьте песню в «Обрезать аудио» (не длиннее 40 секунд), сохраните в M4A и переименуйте файл из .m4a в .m4r. Добавьте его на iPhone через Finder или iTunes.",
        en: "Trim the song in “Trim audio” (40 seconds at most), save it as M4A and rename it from .m4a to .m4r. Add it to the iPhone through Finder or iTunes.",
      },
    },
  },
];
