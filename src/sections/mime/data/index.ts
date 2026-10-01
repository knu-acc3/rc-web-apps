/* Server-side MIME reference: curated extensions joined with mime-db. Never import from client code. */
import { MAGIC } from "../sniff";
import { CURATED_DOCS } from "./curated-docs";
import { CURATED_MEDIA } from "./curated-media";
import { CURATED_OTHER } from "./curated-other";
import dbJson from "./db.json";
import type { Curated, MimeCat, TypeSource } from "./types";

type DbRow = [type: string, src: string, compressible: 0 | 1 | null, charset: string | null];
const DB = dbJson as unknown as Record<string, DbRow[]>;
export const MIME_DB_SOURCE = (dbJson as unknown as { _source: string })._source;

export interface TypeInfo {
  type: string;
  src: TypeSource | "";
  compressible: boolean | null;
  charset: string | null;
}

export interface MimeEntry extends Curated {
  types: TypeInfo[];
  /** The type to send in Content-Type. */
  primary: TypeInfo;
  /** Magic bytes shown on the page: [hex, offset, note] */
  magic: { hex: string; offset: number; note?: [string, string] }[];
}

const SRC: Record<string, TypeSource | ""> = { i: "iana", a: "apache", n: "nginx", "": "" };

/** Binary containers whose signature is structural rather than a fixed prefix. */
const STRUCTURAL: Record<string, { hex: string; offset: number; note: [string, string] }[]> = {};
const add = (exts: string[], hex: string, offset: number, note: [string, string]) => exts.forEach((e) => (STRUCTURAL[e] ??= []).push({ hex, offset, note }));
add(["zip", "docx", "xlsx", "pptx", "docm", "xlsm", "xlsb", "pptm", "ppsx", "potx", "dotx", "odt", "ods", "odp", "odg", "epub", "jar", "war", "ear", "apk", "aab", "ipa", "xpi", "kmz", "3mf", "vsdx", "usdz", "cbz", "msix", "appx", "xps", "oxps", "pages", "numbers", "key", "crx"], "50 4B 03 04", 0, ["ZIP-архив («PK»); тип уточняется по файлам внутри", "ZIP archive (“PK”); the type is refined by the files inside"]);
add(["mp4", "m4v", "m4a", "m4b", "mov", "heic", "heif", "avif", "3gp", "3g2", "cr3", "f4v"], "66 74 79 70", 4, ["Бокс «ftyp» ISO BMFF; дальше идёт бренд (isom, qt, heic, avif…)", "ISO BMFF “ftyp” box followed by a brand (isom, qt, heic, avif…)"]);
add(["webp"], "52 49 46 46 ?? ?? ?? ?? 57 45 42 50", 0, ["RIFF … WEBP", "RIFF … WEBP"]);
add(["wav"], "52 49 46 46 ?? ?? ?? ?? 57 41 56 45", 0, ["RIFF … WAVE", "RIFF … WAVE"]);
add(["avi"], "52 49 46 46 ?? ?? ?? ?? 41 56 49 20", 0, ["RIFF … AVI", "RIFF … AVI"]);
add(["ogg", "oga", "ogv", "opus", "ogx"], "4F 67 67 53", 0, ["«OggS»; кодек определяется по первому пакету (Vorbis, Opus, Theora)", "“OggS”; the codec is in the first packet (Vorbis, Opus, Theora)"]);
add(["webm", "mkv", "mka", "weba"], "1A 45 DF A3", 0, ["Заголовок EBML; DocType «webm» или «matroska»", "EBML header; DocType “webm” or “matroska”"]);
add(["aiff", "aif"], "46 4F 52 4D ?? ?? ?? ?? 41 49 46 46", 0, ["FORM … AIFF", "FORM … AIFF"]);
add(["tar", "tgz"], "75 73 74 61 72", 257, ["«ustar» на смещении 257 (для .tgz — после распаковки gzip)", "“ustar” at offset 257 (for .tgz after gunzip)"]);
add(["iso"], "43 44 30 30 31", 32769, ["«CD001» — дескриптор тома ISO 9660", "“CD001” — the ISO 9660 volume descriptor"]);
add(["dmg"], "6B 6F 6C 79", -512, ["«koly» в последних 512 байтах файла", "“koly” in the last 512 bytes of the file"]);
add(["ts", "m2ts", "mts"], "47", 0, ["Байт синхронизации 0x47 каждые 188 байт (192 для M2TS)", "Sync byte 0x47 every 188 bytes (192 for M2TS)"]);
add(["mp3"], "FF FB", 0, ["Или сразу MPEG-кадр без ID3 (FF FB / FF F3 / FF F2)", "Or a bare MPEG frame without ID3 (FF FB / FF F3 / FF F2)"]);
add(["aac"], "FF F1", 0, ["Заголовок кадра ADTS (FF F1 или FF F9)", "ADTS frame header (FF F1 or FF F9)"]);

function typesFor(c: Curated): TypeInfo[] {
  const out: TypeInfo[] = (DB[c.ext] ?? []).map(([type, src, comp, charset]) => ({ type, src: SRC[src] ?? "", compressible: comp === null ? null : comp === 1, charset }));
  for (const x of c.extra ?? []) if (!out.some((t) => t.type === x.type)) out.push({ type: x.type, src: x.src, compressible: null, charset: null });
  return out;
}

function pickPrimary(c: Curated, types: TypeInfo[]): TypeInfo {
  if (c.prefer) {
    const p = types.find((t) => t.type === c.prefer);
    if (p) return p;
  }
  return types.find((t) => t.src === "iana") ?? types[0];
}

function magicFor(ext: string): MimeEntry["magic"] {
  const out: MimeEntry["magic"] = [];
  for (const m of MAGIC) if (m.exts.includes(ext)) out.push({ hex: m.hex, offset: m.offset ?? 0 });
  for (const s of STRUCTURAL[ext] ?? []) out.push(s);
  return out;
}

export const ENTRIES: MimeEntry[] = [...CURATED_MEDIA, ...CURATED_DOCS, ...CURATED_OTHER].map((c) => {
  const types = typesFor(c);
  return { ...c, types, primary: pickPrimary(c, types), magic: magicFor(c.ext) };
});
export const ENTRY_BY_EXT = new Map(ENTRIES.map((e) => [e.ext, e]));

/** Is the content textual (charset matters)? */
export function isTextual(type: string): boolean {
  return type.startsWith("text/") || /\+(json|xml)$|\/(json|xml|javascript|ecmascript|x-sh|x-perl|sql|yaml|toml|x-httpd-php|x-subrip|x-ipynb\+json)$/.test(type);
}

const COMPRESSIBLE_BINARY = /^(image\/(svg\+xml|bmp|x-icon|vnd\.microsoft\.icon|vnd\.radiance|aces|x-tga|x-portable-\w+)|font\/(ttf|otf|collection)|application\/(vnd\.ms-fontobject|x-tar|postscript|rtf|wasm|vnd\.sqlite3|x-plist))$/;

/** Should a server gzip/brotli it? mime-db flag first, then a type-based rule of thumb. */
export function compressibleOf(t: TypeInfo): boolean {
  if (t.compressible !== null) return t.compressible;
  return isTextual(t.type) || COMPRESSIBLE_BINARY.test(t.type);
}

interface CatDef {
  id: MimeCat;
  slug: string;
  icon: string;
  ru: { name: string; title: string; h1: string; desc: string; lead: string };
  en: { name: string; title: string; h1: string; desc: string; lead: string };
}

export const CATS: CatDef[] = [
  { id: "web", slug: "web", icon: "Globe", ru: { name: "Веб", title: "MIME-типы для сайта: HTML, CSS, JS, WASM, JSON", h1: "MIME-типы веб-файлов", desc: "Content-Type файлов сайта: text/html, text/css, text/javascript для .js и .mjs, application/wasm, application/manifest+json и другие — с настройкой nginx и Apache.", lead: "Какой Content-Type отдавать файлам сайта, чтобы браузер их принял." }, en: { name: "Web", title: "Web MIME Types: HTML, CSS, JS, WASM, JSON", h1: "Web file MIME types", desc: "Content-Type for website files: text/html, text/css, text/javascript for .js and .mjs, application/wasm, web manifests — with nginx and Apache config.", lead: "Which Content-Type to send for website files so browsers accept them." } },
  { id: "image", slug: "images", icon: "Image", ru: { name: "Изображения", title: "MIME-типы изображений: image/jpeg, image/webp, image/avif", h1: "MIME-типы изображений", desc: "Content-Type картинок: image/jpeg, image/png, image/webp, image/avif, image/svg+xml, image/heic и RAW-форматы камер. Сигнатуры файлов и настройка серверов.", lead: "Типы image/* для фото, векторной графики, иконок и RAW." }, en: { name: "Images", title: "Image MIME Types: image/jpeg, image/webp, image/avif", h1: "Image MIME types", desc: "Image Content-Types: image/jpeg, image/png, image/webp, image/avif, image/svg+xml, image/heic and camera RAW formats. File signatures and server setup.", lead: "image/* types for photos, vector graphics, icons and RAW." } },
  { id: "audio", slug: "audio", icon: "Music", ru: { name: "Аудио", title: "MIME-типы аудио: audio/mpeg, audio/ogg, audio/flac", h1: "MIME-типы аудиофайлов", desc: "Content-Type звуковых файлов: audio/mpeg для MP3, audio/mp4 для M4A, audio/ogg, audio/flac, audio/wav, audio/aac и другие. Какой тип понимают браузеры.", lead: "Типы audio/* для MP3, AAC, Opus, FLAC, WAV и MIDI." }, en: { name: "Audio", title: "Audio MIME Types: audio/mpeg, audio/ogg, audio/flac", h1: "Audio file MIME types", desc: "Audio Content-Types: audio/mpeg for MP3, audio/mp4 for M4A, audio/ogg, audio/flac, audio/wav, audio/aac and more. Which types browsers understand.", lead: "audio/* types for MP3, AAC, Opus, FLAC, WAV and MIDI." } },
  { id: "video", slug: "video", icon: "Film", ru: { name: "Видео", title: "MIME-типы видео: video/mp4, video/webm, HLS и субтитры", h1: "MIME-типы видео и субтитров", desc: "Content-Type видеофайлов: video/mp4, video/webm, video/quicktime, video/mp2t для HLS-сегментов, application/vnd.apple.mpegurl для .m3u8, text/vtt для субтитров.", lead: "Типы video/*, плейлисты HLS и DASH, форматы субтитров." }, en: { name: "Video", title: "Video MIME Types: video/mp4, video/webm, HLS and Subtitles", h1: "Video and subtitle MIME types", desc: "Video Content-Types: video/mp4, video/webm, video/quicktime, video/mp2t for HLS segments, application/vnd.apple.mpegurl for .m3u8 and text/vtt for captions.", lead: "video/* types, HLS and DASH playlists, subtitle formats." } },
  { id: "font", slug: "fonts", icon: "Type", ru: { name: "Шрифты", title: "MIME-типы шрифтов: font/woff2, font/woff, font/ttf", h1: "MIME-типы шрифтов", desc: "Content-Type веб-шрифтов по RFC 8081: font/woff2, font/woff, font/ttf, font/otf, font/collection, а также устаревший EOT. Как отдавать шрифты с CORS.", lead: "Типы font/* для веб-шрифтов и настольных шрифтов." }, en: { name: "Fonts", title: "Font MIME Types: font/woff2, font/woff, font/ttf", h1: "Font MIME types", desc: "Web font Content-Types per RFC 8081: font/woff2, font/woff, font/ttf, font/otf, font/collection and the legacy EOT. How to serve fonts with CORS.", lead: "font/* types for web and desktop fonts." } },
  { id: "document", slug: "documents", icon: "FileText", ru: { name: "Документы", title: "MIME-типы документов: PDF, DOCX, XLSX, PPTX, ODT", h1: "MIME-типы документов и книг", desc: "Content-Type документов: application/pdf, типы Office Open XML для DOCX, XLSX и PPTX, OpenDocument, RTF, EPUB и FB2, Markdown. Полные длинные типы Microsoft Office.", lead: "Офисные документы, PDF, электронные книги и письма." }, en: { name: "Documents", title: "Document MIME Types: PDF, DOCX, XLSX, PPTX, ODT", h1: "Document and e-book MIME types", desc: "Document Content-Types: application/pdf, Office Open XML types for DOCX, XLSX and PPTX, OpenDocument, RTF, EPUB, FB2 and Markdown. Full long Office types.", lead: "Office documents, PDF, e-books and email files." } },
  { id: "archive", slug: "archives", icon: "Archive", ru: { name: "Архивы и образы", title: "MIME-типы архивов: ZIP, RAR, 7z, tar.gz, ISO", h1: "MIME-типы архивов и образов дисков", desc: "Content-Type архивов: application/zip, application/vnd.rar, application/x-7z-compressed, application/gzip, application/zstd, образы ISO и DMG. Сигнатуры файлов.", lead: "Архивы, сжатые файлы и образы дисков." }, en: { name: "Archives and images", title: "Archive MIME Types: ZIP, RAR, 7z, tar.gz, ISO", h1: "Archive and disk image MIME types", desc: "Archive Content-Types: application/zip, application/vnd.rar, application/x-7z-compressed, application/gzip, application/zstd, ISO and DMG images. File signatures.", lead: "Archives, compressed files and disk images." } },
  { id: "data", slug: "data-formats", icon: "Braces", ru: { name: "Данные и конфиги", title: "MIME-типы данных: JSON, XML, CSV, YAML, SQLite", h1: "MIME-типы форматов данных", desc: "Content-Type форматов данных: application/json, application/xml, text/csv, application/yaml (RFC 9512), TOML, NDJSON, SQLite, Parquet, vCard, iCalendar.", lead: "Структурированные данные, конфигурации, базы и геоданные." }, en: { name: "Data and config", title: "Data MIME Types: JSON, XML, CSV, YAML, SQLite", h1: "Data format MIME types", desc: "Data Content-Types: application/json, application/xml, text/csv, application/yaml (RFC 9512), TOML, NDJSON, SQL, SQLite, Parquet, vCard, iCalendar, GeoJSON.", lead: "Structured data, configs, databases and geodata." } },
  { id: "code", slug: "source-code", icon: "Code", ru: { name: "Исходный код", title: "MIME-типы исходного кода: Python, PHP, Java, C, Rust", h1: "MIME-типы файлов исходного кода", desc: "Какой Content-Type у исходников: Python, PHP, Ruby, Go, Rust, Java, C/C++, C#, Swift, Kotlin, shell-скрипты, SCSS и Less. Какие из них зарегистрированы, а какие нет.", lead: "Исходный код, скрипты и препроцессоры CSS." }, en: { name: "Source code", title: "Source Code MIME Types: Python, PHP, Java, C, Rust", h1: "Source code MIME types", desc: "Content-Types of source files: Python, PHP, Ruby, Go, Rust, Java, C/C++, C#, Swift, Kotlin, shell scripts, SCSS and Less — which are registered and which aren't.", lead: "Source code, scripts and CSS preprocessors." } },
  { id: "app", slug: "executables", icon: "Package", ru: { name: "Программы и пакеты", title: "MIME-типы программ: EXE, MSI, APK, DEB, RPM, JAR", h1: "MIME-типы программ и установочных пакетов", desc: "Content-Type исполняемых файлов и пакетов: EXE и DLL, MSI, MSIX, APK для Android, IPA, DEB, RPM, JAR, расширения браузеров. Как правильно отдавать их для скачивания.", lead: "Исполняемые файлы, установщики и пакеты приложений." }, en: { name: "Executables and packages", title: "Executable MIME Types: EXE, MSI, APK, DEB, RPM, JAR", h1: "Executable and package MIME types", desc: "Content-Types of executables and packages: EXE and DLL, MSI, MSIX, Android APK, IPA, DEB, RPM, JAR and browser extensions — and how to serve them for download.", lead: "Executables, installers and app packages." } },
  { id: "model", slug: "3d-and-cad", icon: "Box", ru: { name: "3D и САПР", title: "MIME-типы 3D-моделей: STL, OBJ, glTF, STEP, DWG", h1: "MIME-типы 3D-моделей и чертежей", desc: "Content-Type 3D и САПР: model/stl, model/obj, model/gltf-binary для GLB, model/step, image/vnd.dwg, USDZ для AR и 3MF для 3D-печати.", lead: "Модели для 3D-печати, AR, игр и чертежи САПР." }, en: { name: "3D and CAD", title: "3D Model MIME Types: STL, OBJ, glTF, STEP, DWG", h1: "3D model and CAD MIME types", desc: "3D and CAD Content-Types: model/stl, model/obj, model/gltf-binary for GLB, model/step, image/vnd.dwg, USDZ for AR and 3MF for 3D printing.", lead: "Models for 3D printing, AR and games, plus CAD drawings." } },
  { id: "security", slug: "keys-and-certificates", icon: "KeyRound", ru: { name: "Ключи и сертификаты", title: "MIME-типы сертификатов и ключей: PEM, CRT, P12, CSR", h1: "MIME-типы сертификатов, ключей и подписей", desc: "Content-Type криптографических файлов: сертификаты X.509 (PEM, CRT, CER, DER), контейнеры PKCS#12, запросы CSR, подписи PKCS#7 и PGP, база паролей KeePass.", lead: "Сертификаты, закрытые ключи, подписи и зашифрованные файлы." }, en: { name: "Keys and certificates", title: "Certificate and Key MIME Types: PEM, CRT, P12, CSR", h1: "Certificate, key and signature MIME types", desc: "Content-Types of crypto files: X.509 certificates (PEM, CRT, CER, DER), PKCS#12 bundles, CSRs, PKCS#7 and PGP signatures and KeePass databases.", lead: "Certificates, private keys, signatures and encrypted files." } },
];
export const CAT_BY_ID = new Map(CATS.map((c) => [c.id, c]));
export const CAT_BY_SLUG = new Map(CATS.map((c) => [c.slug, c]));
