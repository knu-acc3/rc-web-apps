/* File type detection by content ("magic bytes"). Pure functions — no DOM, unit-tested. */

export interface Magic {
  /** Extensions this signature identifies (first = canonical). */
  exts: string[];
  mime: string;
  /** Hex bytes with spaces; "??" = any byte. */
  hex: string;
  offset?: number;
  name: [ru: string, en: string];
}

/** Simple fixed signatures (checked after the structured formats below). Order matters: longer first. */
export const MAGIC: Magic[] = [
  { exts: ["png"], mime: "image/png", hex: "89 50 4E 47 0D 0A 1A 0A", name: ["Изображение PNG", "PNG image"] },
  { exts: ["jpg", "jpeg", "jfif"], mime: "image/jpeg", hex: "FF D8 FF", name: ["Изображение JPEG", "JPEG image"] },
  { exts: ["gif"], mime: "image/gif", hex: "47 49 46 38 ?? 61", name: ["Изображение GIF", "GIF image"] },
  { exts: ["psd"], mime: "image/vnd.adobe.photoshop", hex: "38 42 50 53", name: ["Документ Photoshop", "Photoshop document"] },
  { exts: ["jxl"], mime: "image/jxl", hex: "00 00 00 0C 4A 58 4C 20 0D 0A 87 0A", name: ["JPEG XL (контейнер)", "JPEG XL (container)"] },
  { exts: ["jxl"], mime: "image/jxl", hex: "FF 0A", name: ["JPEG XL", "JPEG XL"] },
  { exts: ["jp2"], mime: "image/jp2", hex: "00 00 00 0C 6A 50 20 20 0D 0A 87 0A", name: ["JPEG 2000", "JPEG 2000"] },
  { exts: ["tif", "tiff", "dng", "nef", "arw"], mime: "image/tiff", hex: "49 49 2A 00", name: ["TIFF (Intel)", "TIFF (little-endian)"] },
  { exts: ["tif", "tiff"], mime: "image/tiff", hex: "4D 4D 00 2A", name: ["TIFF (Motorola)", "TIFF (big-endian)"] },
  { exts: ["ico"], mime: "image/vnd.microsoft.icon", hex: "00 00 01 00", name: ["Иконка ICO", "ICO icon"] },
  { exts: ["cur"], mime: "image/x-icon", hex: "00 00 02 00", name: ["Курсор CUR", "CUR cursor"] },
  { exts: ["icns"], mime: "image/x-icns", hex: "69 63 6E 73", name: ["Иконка macOS", "macOS icon"] },
  { exts: ["dds"], mime: "image/vnd.ms-dds", hex: "44 44 53 20", name: ["Текстура DDS", "DDS texture"] },
  { exts: ["exr"], mime: "image/aces", hex: "76 2F 31 01", name: ["OpenEXR", "OpenEXR"] },
  { exts: ["xcf"], mime: "image/x-xcf", hex: "67 69 6D 70 20 78 63 66", name: ["Документ GIMP", "GIMP document"] },
  { exts: ["djvu"], mime: "image/vnd.djvu", hex: "41 54 26 54 46 4F 52 4D", name: ["Документ DjVu", "DjVu document"] },
  { exts: ["pdf"], mime: "application/pdf", hex: "25 50 44 46 2D", name: ["Документ PDF", "PDF document"] },
  { exts: ["eps", "ps"], mime: "application/postscript", hex: "25 21 50 53", name: ["PostScript", "PostScript"] },
  { exts: ["rtf"], mime: "application/rtf", hex: "7B 5C 72 74 66", name: ["Документ RTF", "RTF document"] },
  { exts: ["rar"], mime: "application/vnd.rar", hex: "52 61 72 21 1A 07", name: ["Архив RAR", "RAR archive"] },
  { exts: ["7z"], mime: "application/x-7z-compressed", hex: "37 7A BC AF 27 1C", name: ["Архив 7-Zip", "7-Zip archive"] },
  { exts: ["gz", "tgz"], mime: "application/gzip", hex: "1F 8B", name: ["Сжатый файл gzip", "gzip file"] },
  { exts: ["bz2"], mime: "application/x-bzip2", hex: "42 5A 68", name: ["Сжатый файл bzip2", "bzip2 file"] },
  { exts: ["xz"], mime: "application/x-xz", hex: "FD 37 7A 58 5A 00", name: ["Сжатый файл xz", "xz file"] },
  { exts: ["zst"], mime: "application/zstd", hex: "28 B5 2F FD", name: ["Zstandard", "Zstandard"] },
  { exts: ["lz4"], mime: "application/x-lz4", hex: "04 22 4D 18", name: ["LZ4", "LZ4"] },
  { exts: ["lz"], mime: "application/x-lzip", hex: "4C 5A 49 50", name: ["lzip", "lzip"] },
  { exts: ["cab"], mime: "application/vnd.ms-cab-compressed", hex: "4D 53 43 46", name: ["Архив CAB", "CAB archive"] },
  { exts: ["doc", "xls", "ppt", "msi", "msg", "vsd", "pub"], mime: "application/x-ole-storage", hex: "D0 CF 11 E0 A1 B1 1A E1", name: ["Документ OLE2 (Office 97–2003, MSI, MSG)", "OLE2 compound file (Office 97–2003, MSI, MSG)"] },
  { exts: ["deb"], mime: "application/vnd.debian.binary-package", hex: "21 3C 61 72 63 68 3E 0A 64 65 62 69 61 6E", name: ["Пакет Debian", "Debian package"] },
  { exts: ["rpm"], mime: "application/x-redhat-package-manager", hex: "ED AB EE DB", name: ["Пакет RPM", "RPM package"] },
  { exts: ["pkg"], mime: "application/x-xar", hex: "78 61 72 21", name: ["Архив xar (установщик macOS)", "xar archive (macOS installer)"] },
  { exts: ["exe", "dll", "com"], mime: "application/vnd.microsoft.portable-executable", hex: "4D 5A", name: ["Программа Windows (MZ/PE)", "Windows executable (MZ/PE)"] },
  { exts: ["so"], mime: "application/x-elf", hex: "7F 45 4C 46", name: ["Исполняемый файл ELF (Linux)", "ELF executable (Linux)"] },
  { exts: ["wasm"], mime: "application/wasm", hex: "00 61 73 6D", name: ["WebAssembly", "WebAssembly"] },
  { exts: ["dex"], mime: "application/octet-stream", hex: "64 65 78 0A", name: ["Байткод Android DEX", "Android DEX bytecode"] },
  { exts: ["flac"], mime: "audio/flac", hex: "66 4C 61 43", name: ["Аудио FLAC", "FLAC audio"] },
  { exts: ["mp3"], mime: "audio/mpeg", hex: "49 44 33", name: ["Аудио MP3 (ID3)", "MP3 audio (ID3)"] },
  { exts: ["mid", "midi"], mime: "audio/midi", hex: "4D 54 68 64", name: ["MIDI", "MIDI"] },
  { exts: ["amr"], mime: "audio/amr", hex: "23 21 41 4D 52", name: ["Аудио AMR", "AMR audio"] },
  { exts: ["ape"], mime: "audio/x-ape", hex: "4D 41 43 20", name: ["Monkey's Audio", "Monkey's Audio"] },
  { exts: ["wv"], mime: "audio/x-wavpack", hex: "77 76 70 6B", name: ["WavPack", "WavPack"] },
  { exts: ["caf"], mime: "audio/x-caf", hex: "63 61 66 66", name: ["Core Audio Format", "Core Audio Format"] },
  { exts: ["au"], mime: "audio/basic", hex: "2E 73 6E 64", name: ["Аудио AU", "AU audio"] },
  { exts: ["flv"], mime: "video/x-flv", hex: "46 4C 56 01", name: ["Видео FLV", "FLV video"] },
  { exts: ["wmv", "wma", "asf"], mime: "video/x-ms-asf", hex: "30 26 B2 75 8E 66 CF 11", name: ["Контейнер ASF (WMV/WMA)", "ASF container (WMV/WMA)"] },
  { exts: ["mpg", "mpeg", "vob"], mime: "video/mpeg", hex: "00 00 01 BA", name: ["Видео MPEG-PS", "MPEG program stream"] },
  { exts: ["swf"], mime: "application/x-shockwave-flash", hex: "46 57 53", name: ["Flash SWF", "Flash SWF"] },
  { exts: ["swf"], mime: "application/x-shockwave-flash", hex: "43 57 53", name: ["Flash SWF (zlib)", "Flash SWF (zlib)"] },
  { exts: ["swf"], mime: "application/x-shockwave-flash", hex: "5A 57 53", name: ["Flash SWF (LZMA)", "Flash SWF (LZMA)"] },
  { exts: ["woff"], mime: "font/woff", hex: "77 4F 46 46", name: ["Шрифт WOFF", "WOFF font"] },
  { exts: ["woff2"], mime: "font/woff2", hex: "77 4F 46 32", name: ["Шрифт WOFF2", "WOFF2 font"] },
  { exts: ["otf"], mime: "font/otf", hex: "4F 54 54 4F", name: ["Шрифт OpenType (CFF)", "OpenType font (CFF)"] },
  { exts: ["ttf"], mime: "font/ttf", hex: "00 01 00 00 00", name: ["Шрифт TrueType", "TrueType font"] },
  { exts: ["ttc"], mime: "font/collection", hex: "74 74 63 66", name: ["Коллекция шрифтов", "Font collection"] },
  { exts: ["eot"], mime: "application/vnd.ms-fontobject", hex: "4C 50", offset: 34, name: ["Шрифт EOT", "EOT font"] },
  { exts: ["sqlite", "db"], mime: "application/vnd.sqlite3", hex: "53 51 4C 69 74 65 20 66 6F 72 6D 61 74 20 33 00", name: ["База SQLite", "SQLite database"] },
  { exts: ["parquet"], mime: "application/vnd.apache.parquet", hex: "50 41 52 31", name: ["Apache Parquet", "Apache Parquet"] },
  { exts: ["blend"], mime: "application/x-blender", hex: "42 4C 45 4E 44 45 52", name: ["Проект Blender", "Blender project"] },
  { exts: ["kdbx"], mime: "application/x-keepass2", hex: "03 D9 A2 9A 67 FB 4B B5", name: ["База паролей KeePass", "KeePass database"] },
  { exts: ["crx"], mime: "application/x-chrome-extension", hex: "43 72 32 34", name: ["Расширение Chrome", "Chrome extension"] },
  { exts: ["plist"], mime: "application/x-plist", hex: "62 70 6C 69 73 74 30 30", name: ["Двоичный plist", "Binary plist"] },
  { exts: ["lnk"], mime: "application/x-ms-shortcut", hex: "4C 00 00 00 01 14 02 00", name: ["Ярлык Windows", "Windows shortcut"] },
  { exts: ["torrent"], mime: "application/x-bittorrent", hex: "64 38 3A 61 6E 6E 6F 75 6E 63 65", name: ["Торрент-файл", "Torrent file"] },
  { exts: ["bmp"], mime: "image/bmp", hex: "42 4D", name: ["Изображение BMP", "BMP image"] },
];

export interface Detected {
  ext: string;
  mime: string;
  name: [ru: string, en: string];
  /** Other extensions the same signature is used for. */
  alt?: string[];
  /** Detection strength: container-level (e.g. "some ZIP") is "medium". */
  confidence: "high" | "medium";
}

function parseHex(hex: string): (number | null)[] {
  return hex.split(" ").map((h) => (h === "??" ? null : parseInt(h, 16)));
}
const COMPILED = MAGIC.map((m) => ({ m, bytes: parseHex(m.hex), off: m.offset ?? 0 }));

function matchAt(buf: Uint8Array, off: number, bytes: (number | null)[]): boolean {
  if (buf.length < off + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) if (bytes[i] !== null && buf[off + i] !== bytes[i]) return false;
  return true;
}
const ascii = (buf: Uint8Array, off: number, len: number) => String.fromCharCode(...buf.subarray(off, off + len));
const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const u32le = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const u16le = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);

const D = (ext: string, mime: string, name: [string, string], confidence: Detected["confidence"] = "high", alt?: string[]): Detected => ({ ext, mime, name, confidence, alt });

/* ───── ZIP-based formats ───── */

/** File names in a ZIP: from local headers at the start and the central directory at the end. */
export function zipNames(head: Uint8Array, tail?: Uint8Array): { names: string[]; mimetype?: string } {
  const names: string[] = [];
  let mimetype: string | undefined;
  let o = 0;
  while (o + 30 <= head.length && u32le(head, o) === 0x04034b50) {
    const flags = u16le(head, o + 6);
    const method = u16le(head, o + 8);
    const csize = u32le(head, o + 18);
    const nlen = u16le(head, o + 26);
    const xlen = u16le(head, o + 28);
    if (o + 30 + nlen > head.length) break;
    const name = new TextDecoder().decode(head.subarray(o + 30, o + 30 + nlen));
    names.push(name);
    const dataStart = o + 30 + nlen + xlen;
    if (name === "mimetype" && method === 0 && csize < 200 && dataStart + csize <= head.length) mimetype = ascii(head, dataStart, csize).trim();
    if (flags & 8 && csize === 0) break; // streamed entry: size unknown
    o = dataStart + csize;
  }
  if (tail) {
    // central directory entries (signature 0x02014b50) anywhere in the tail
    for (let i = 0; i + 46 <= tail.length; i++) {
      if (tail[i] !== 0x50 || tail[i + 1] !== 0x4b || tail[i + 2] !== 0x01 || tail[i + 3] !== 0x02) continue;
      const nlen = u16le(tail, i + 28);
      if (i + 46 + nlen > tail.length) break;
      names.push(new TextDecoder().decode(tail.subarray(i + 46, i + 46 + nlen)));
      i += 45 + nlen;
    }
  }
  return { names, mimetype };
}

const ODF: Record<string, [string, [string, string]]> = {
  "application/vnd.oasis.opendocument.text": ["odt", ["Текст OpenDocument", "OpenDocument text"]],
  "application/vnd.oasis.opendocument.spreadsheet": ["ods", ["Таблица OpenDocument", "OpenDocument spreadsheet"]],
  "application/vnd.oasis.opendocument.presentation": ["odp", ["Презентация OpenDocument", "OpenDocument presentation"]],
  "application/vnd.oasis.opendocument.graphics": ["odg", ["Рисунок OpenDocument", "OpenDocument drawing"]],
  "application/epub+zip": ["epub", ["Электронная книга EPUB", "EPUB e-book"]],
};

function sniffZip(head: Uint8Array, tail?: Uint8Array): Detected {
  const { names, mimetype } = zipNames(head, tail);
  if (mimetype && ODF[mimetype]) return D(ODF[mimetype][0], mimetype, ODF[mimetype][1]);
  const has = (p: string) => names.some((n) => n === p || n.startsWith(p));
  if (has("[Content_Types].xml") || has("_rels/")) {
    if (has("word/")) return D("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ["Документ Word (DOCX)", "Word document (DOCX)"]);
    if (has("xl/")) return D("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ["Книга Excel (XLSX)", "Excel workbook (XLSX)"]);
    if (has("ppt/")) return D("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", ["Презентация PowerPoint (PPTX)", "PowerPoint presentation (PPTX)"]);
    if (has("visio/")) return D("vsdx", "application/vnd.visio", ["Схема Visio", "Visio drawing"]);
    if (has("3D/")) return D("3mf", "model/3mf", ["Модель 3MF", "3MF model"]);
    if (has("Documents/")) return D("xps", "application/vnd.ms-xpsdocument", ["Документ XPS", "XPS document"]);
    if (has("AppxManifest.xml")) return D("msix", "application/msix", ["Пакет MSIX/APPX", "MSIX/APPX package"], "high", ["appx"]);
  }
  if (has("AndroidManifest.xml")) return D("apk", "application/vnd.android.package-archive", ["Приложение Android (APK)", "Android app (APK)"]);
  if (has("BundleConfig.pb")) return D("aab", "application/octet-stream", ["Android App Bundle", "Android App Bundle"]);
  if (has("Payload/")) return D("ipa", "application/octet-stream", ["Приложение iOS (IPA)", "iOS app (IPA)"]);
  if (has("META-INF/MANIFEST.MF")) {
    if (has("WEB-INF/")) return D("war", "application/java-archive", ["Веб-приложение Java (WAR)", "Java web archive (WAR)"]);
    return D("jar", "application/java-archive", ["Архив Java (JAR)", "Java archive (JAR)"]);
  }
  if (has("manifest.json") && (has("META-INF/mozilla.rsa") || has("META-INF/cose.sig"))) return D("xpi", "application/x-xpinstall", ["Дополнение Firefox", "Firefox add-on"]);
  if (has("doc.kml")) return D("kmz", "application/vnd.google-earth.kmz", ["KMZ (Google Earth)", "KMZ (Google Earth)"]);
  if (names.some((n) => /\.usdc?$/i.test(n))) return D("usdz", "model/vnd.usdz+zip", ["AR-модель USDZ", "USDZ AR model"]);
  return D("zip", "application/zip", ["Архив ZIP", "ZIP archive"], names.length ? "high" : "medium");
}

/* ───── ISO base media (MP4, MOV, HEIC, AVIF…) ───── */

function sniffFtyp(buf: Uint8Array): Detected | null {
  if (buf.length < 12 || ascii(buf, 4, 4) !== "ftyp") return null;
  const size = Math.min(u32be(buf, 0), buf.length);
  const major = ascii(buf, 8, 4);
  const brands = [major];
  for (let o = 16; o + 4 <= size; o += 4) brands.push(ascii(buf, o, 4));
  const any = (...b: string[]) => b.some((x) => brands.includes(x));
  if (major === "avif" || major === "avis") return D("avif", "image/avif", ["Изображение AVIF", "AVIF image"]);
  if (["heic", "heix", "heim", "heis", "hevc", "hevx"].includes(major)) return D("heic", "image/heic", ["Фото HEIC", "HEIC photo"]);
  if (major === "mif1" || major === "msf1") {
    if (any("avif", "avis")) return D("avif", "image/avif", ["Изображение AVIF", "AVIF image"]);
    if (any("heic", "heix")) return D("heic", "image/heic", ["Фото HEIC", "HEIC photo"]);
    return D("heif", "image/heif", ["Изображение HEIF", "HEIF image"]);
  }
  if (major === "crx ") return D("cr3", "image/x-canon-cr3", ["RAW Canon (CR3)", "Canon raw (CR3)"]);
  if (major === "jxl ") return D("jxl", "image/jxl", ["JPEG XL", "JPEG XL"]);
  if (major === "qt  ") return D("mov", "video/quicktime", ["Видео QuickTime", "QuickTime video"]);
  if (major === "M4A ") return D("m4a", "audio/mp4", ["Аудио M4A", "M4A audio"]);
  if (major === "M4B ") return D("m4b", "audio/mp4", ["Аудиокнига M4B", "M4B audiobook"]);
  if (major === "M4V " || major === "M4VH" || major === "M4VP") return D("m4v", "video/x-m4v", ["Видео M4V", "M4V video"]);
  if (major.startsWith("3g2")) return D("3g2", "video/3gpp2", ["Видео 3G2", "3G2 video"]);
  if (major.startsWith("3gp") || major.startsWith("3ge")) return D("3gp", "video/3gpp", ["Видео 3GP", "3GP video"]);
  return D("mp4", "video/mp4", ["Видео MP4", "MP4 video"], "high", ["m4a", "mov"]);
}

/* ───── other structured containers ───── */

function sniffRiff(buf: Uint8Array): Detected | null {
  if (buf.length < 12 || ascii(buf, 0, 4) !== "RIFF") return null;
  const kind = ascii(buf, 8, 4);
  if (kind === "WEBP") return D("webp", "image/webp", ["Изображение WebP", "WebP image"]);
  if (kind === "WAVE") return D("wav", "audio/wav", ["Аудио WAV", "WAV audio"]);
  if (kind === "AVI ") return D("avi", "video/x-msvideo", ["Видео AVI", "AVI video"]);
  if (kind === "ACON") return D("ani", "application/x-navi-animation", ["Анимированный курсор", "Animated cursor"]);
  return D("riff", "application/octet-stream", ["Контейнер RIFF", "RIFF container"], "medium");
}

function sniffOgg(buf: Uint8Array): Detected | null {
  if (!matchAt(buf, 0, parseHex("4F 67 67 53"))) return null;
  const s = ascii(buf, 0, Math.min(buf.length, 128));
  if (s.includes("OpusHead")) return D("opus", "audio/ogg", ["Аудио Opus", "Opus audio"]);
  if (s.includes("theora")) return D("ogv", "video/ogg", ["Видео Ogg Theora", "Ogg Theora video"]);
  if (s.includes("FLAC")) return D("oga", "audio/ogg", ["Аудио FLAC в Ogg", "FLAC in Ogg"]);
  if (s.includes("Speex")) return D("spx", "audio/ogg", ["Аудио Speex", "Speex audio"]);
  return D("ogg", "audio/ogg", ["Аудио Ogg Vorbis", "Ogg Vorbis audio"]);
}

function sniffEbml(buf: Uint8Array): Detected | null {
  if (!matchAt(buf, 0, parseHex("1A 45 DF A3"))) return null;
  const s = ascii(buf, 0, Math.min(buf.length, 64));
  if (s.includes("webm")) return D("webm", "video/webm", ["Видео WebM", "WebM video"], "high", ["weba"]);
  return D("mkv", "video/x-matroska", ["Видео Matroska", "Matroska video"], "high", ["mka"]);
}

function sniffForm(buf: Uint8Array): Detected | null {
  if (buf.length < 12 || ascii(buf, 0, 4) !== "FORM") return null;
  const kind = ascii(buf, 8, 4);
  if (kind === "AIFF" || kind === "AIFC") return D("aiff", "audio/x-aiff", ["Аудио AIFF", "AIFF audio"], "high", ["aif"]);
  return null;
}

function sniffMpegAudio(buf: Uint8Array): Detected | null {
  if (buf.length < 2 || buf[0] !== 0xff) return null;
  const b = buf[1];
  if ((b & 0xf6) === 0xf0) return D("aac", "audio/aac", ["Аудио AAC (ADTS)", "AAC audio (ADTS)"]);
  if ((b & 0xe0) === 0xe0 && (b & 0x06) !== 0) return D("mp3", "audio/mpeg", ["Аудио MPEG (MP3)", "MPEG audio (MP3)"], "medium");
  return null;
}

function sniffTs(buf: Uint8Array): Detected | null {
  if (buf.length >= 377 && buf[0] === 0x47 && buf[188] === 0x47 && buf[376] === 0x47) return D("ts", "video/mp2t", ["Транспортный поток MPEG-TS", "MPEG transport stream"], "high", ["m2ts", "mts"]);
  if (buf.length >= 197 && buf[4] === 0x47 && buf[196] === 0x47) return D("m2ts", "video/mp2t", ["Видео M2TS (Blu-ray/AVCHD)", "M2TS video (Blu-ray/AVCHD)"], "high", ["mts"]);
  return null;
}

function sniffJavaOrMachO(buf: Uint8Array): Detected | null {
  if (!matchAt(buf, 0, parseHex("CA FE BA BE")) || buf.length < 8) return null;
  // Java class files store minor/major version (major ≥ 45); fat Mach-O stores a small arch count.
  return u32be(buf, 4) < 40 ? D("macho", "application/x-mach-binary", ["Универсальный бинарник macOS", "macOS universal binary"]) : D("class", "application/java-vm", ["Байткод Java", "Java bytecode"]);
}

function sniffMachO(buf: Uint8Array): Detected | null {
  const m = buf.length >= 4 ? u32be(buf, 0) : 0;
  if ([0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe].includes(m)) return D("macho", "application/x-mach-binary", ["Программа macOS (Mach-O)", "macOS executable (Mach-O)"]);
  return null;
}

function sniffApng(buf: Uint8Array): boolean {
  // acTL chunk before the first IDAT marks an animated PNG
  const s = ascii(buf, 0, Math.min(buf.length, 4096));
  const a = s.indexOf("acTL");
  const d = s.indexOf("IDAT");
  return a > 0 && (d < 0 || a < d);
}

/* ───── text formats ───── */

function isText(buf: Uint8Array): boolean {
  const n = Math.min(buf.length, 4096);
  if (n === 0) return false;
  let bad = 0;
  for (let i = 0; i < n; i++) {
    const c = buf[i];
    if (c === 0) return false;
    if (c < 9 || (c > 13 && c < 32 && c !== 27)) bad++;
  }
  return bad / n < 0.02;
}

function sniffText(buf: Uint8Array): Detected | null {
  let start = 0;
  if (matchAt(buf, 0, [0xef, 0xbb, 0xbf])) start = 3;
  if (matchAt(buf, 0, [0xff, 0xfe]) || matchAt(buf, 0, [0xfe, 0xff])) return D("txt", "text/plain", ["Текст UTF-16", "UTF-16 text"], "medium");
  const body = buf.subarray(start);
  if (!isText(body)) return null;
  const s = new TextDecoder("utf-8", { fatal: false }).decode(body.subarray(0, 4096)).trimStart();
  const low = s.slice(0, 512).toLowerCase();
  if (low.startsWith("<?xml") || low.startsWith("<svg") || low.startsWith("<!--")) {
    if (low.includes("<svg")) return D("svg", "image/svg+xml", ["Изображение SVG", "SVG image"]);
    if (low.includes("<rss")) return D("rss", "application/rss+xml", ["Лента RSS", "RSS feed"]);
    if (low.includes("<feed")) return D("atom", "application/atom+xml", ["Лента Atom", "Atom feed"]);
    if (low.includes("<plist")) return D("plist", "application/x-plist", ["Property list (XML)", "Property list (XML)"]);
    if (low.includes("<gpx")) return D("gpx", "application/gpx+xml", ["Трек GPX", "GPX track"]);
    if (low.includes("<kml")) return D("kml", "application/vnd.google-earth.kml+xml", ["KML", "KML"]);
    if (low.includes("<fictionbook")) return D("fb2", "application/x-fictionbook+xml", ["Книга FB2", "FB2 e-book"]);
    if (low.includes("<html")) return D("xhtml", "application/xhtml+xml", ["XHTML", "XHTML"]);
    return D("xml", "application/xml", ["XML", "XML"]);
  }
  if (low.startsWith("<!doctype html") || low.startsWith("<html") || /^<(head|body|meta|title|div|p)[\s>]/.test(low)) return D("html", "text/html", ["HTML", "HTML"]);
  if (low.startsWith("begin:vcard")) return D("vcf", "text/vcard", ["Контакт vCard", "vCard contact"]);
  if (low.startsWith("begin:vcalendar")) return D("ics", "text/calendar", ["Календарь iCalendar", "iCalendar"]);
  if (low.startsWith("-----begin pgp")) return D("asc", "application/pgp-keys", ["PGP (ASCII Armor)", "PGP (ASCII armor)"]);
  if (low.startsWith("-----begin certificate request")) return D("csr", "application/pkcs10", ["Запрос на сертификат", "Certificate request"]);
  if (low.startsWith("-----begin")) return D("pem", "application/x-pem-file", ["Сертификат или ключ PEM", "PEM certificate or key"]);
  if (low.startsWith("webvtt")) return D("vtt", "text/vtt", ["Субтитры WebVTT", "WebVTT subtitles"]);
  if (low.startsWith("#extm3u")) return D("m3u8", "application/vnd.apple.mpegurl", ["Плейлист M3U/HLS", "M3U/HLS playlist"], "high", ["m3u"]);
  if (low.startsWith("{\\rtf")) return D("rtf", "application/rtf", ["RTF", "RTF"]);
  if (low.startsWith("%pdf")) return D("pdf", "application/pdf", ["PDF", "PDF"]);
  if (low.startsWith("#!")) {
    const line = low.split("\n")[0];
    if (line.includes("python")) return D("py", "text/x-python", ["Скрипт Python", "Python script"]);
    if (line.includes("node")) return D("js", "text/javascript", ["Скрипт Node.js", "Node.js script"]);
    if (line.includes("perl")) return D("pl", "application/x-perl", ["Скрипт Perl", "Perl script"]);
    return D("sh", "application/x-sh", ["Shell-скрипт", "Shell script"]);
  }
  if (/^\d+\r?\n\d\d:\d\d:\d\d,\d{3} --> /.test(s)) return D("srt", "application/x-subrip", ["Субтитры SRT", "SRT subtitles"]);
  if (s[0] === "{" || s[0] === "[") {
    try {
      JSON.parse(s.length < 4096 ? s : "");
      return D("json", "application/json", ["JSON", "JSON"]);
    } catch {
      if (s.split("\n").slice(0, 3).every((l) => l.trim() === "" || /^\s*[{[]/.test(l))) return D("json", "application/json", ["JSON (или NDJSON)", "JSON (or NDJSON)"], "medium", ["ndjson"]);
    }
  }
  return D("txt", "text/plain", ["Текст", "Plain text"], "medium");
}

/**
 * Detect a file type from its first bytes (head, ideally 64 KB) and optionally its last bytes (tail).
 * Returns null when nothing matches (unknown binary).
 */
export function sniff(head: Uint8Array, tail?: Uint8Array): Detected | null {
  if (head.length === 0) return null;
  if (matchAt(head, 0, parseHex("50 4B 03 04")) || matchAt(head, 0, parseHex("50 4B 05 06"))) return sniffZip(head, tail);
  const structured = sniffFtyp(head) ?? sniffRiff(head) ?? sniffOgg(head) ?? sniffEbml(head) ?? sniffForm(head) ?? sniffJavaOrMachO(head) ?? sniffMachO(head);
  if (structured) return structured;
  if (head.length >= 257 + 5 && ascii(head, 257, 5) === "ustar") return D("tar", "application/x-tar", ["Архив tar", "tar archive"]);
  if (head.length >= 32769 + 5 && ascii(head, 32769, 5) === "CD001") return D("iso", "application/x-iso9660-image", ["Образ диска ISO", "ISO disc image"]);
  if (tail && tail.length >= 512 && ascii(tail, tail.length - 512, 4) === "koly") return D("dmg", "application/x-apple-diskimage", ["Образ диска macOS", "macOS disk image"]);
  for (const { m, bytes, off } of COMPILED) {
    if (!matchAt(head, off, bytes)) continue;
    if (m.exts[0] === "png" && sniffApng(head)) return D("apng", "image/apng", ["Анимированный PNG", "Animated PNG"]);
    if (m.exts[0] === "bmp" && (head.length < 14 || u32le(head, 2) === 0)) continue;
    if (m.exts[0] === "tif" && ascii(head, 8, 2) === "CR") return D("cr2", "image/x-canon-cr2", ["RAW Canon (CR2)", "Canon raw (CR2)"]);
    return D(m.exts[0], m.mime, m.name, m.exts.length > 3 || m.exts[0] === "doc" ? "medium" : "high", m.exts.slice(1));
  }
  return sniffTs(head) ?? sniffMpegAudio(head) ?? sniffText(head);
}

/** Human hex of the first bytes, e.g. "89 50 4E 47". */
export function hexPreview(buf: Uint8Array, n = 16): string {
  return Array.from(buf.subarray(0, n), (b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}
