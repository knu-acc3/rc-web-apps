import type { AlgoId } from "./algorithms";

type L = { ru: string; en: string };

/** Algorithm-specific prose (facts only). */
export const ABOUT: Record<AlgoId, L> = {
  md5: {
    ru: "MD5 придумал Рональд Ривест в 1991 году, стандарт — RFC 1321. С 2004–2005 годов коллизии MD5 находятся за секунды на обычном компьютере, поэтому для подписей, сертификатов и паролей он не подходит. Но для проверки, не повредился ли файл при скачивании, и для ETag MD5 по-прежнему широко используется.",
    en: "MD5 was designed by Ron Rivest in 1991 and specified in RFC 1321. Since 2004–2005 MD5 collisions can be found in seconds on an ordinary computer, so it is unfit for signatures, certificates and passwords. It is still widely used to check that a download isn't corrupted and for ETags.",
  },
  sha1: {
    ru: "SHA-1 разработан АНБ и опубликован в 1995 году. В 2017 году Google и CWI Amsterdam построили первую практическую коллизию (атака SHAttered), и браузеры перестали доверять SHA-1-сертификатам. Git исторически идентифицирует объекты по SHA-1 и переходит на SHA-256; для новых задач выбирайте SHA-256.",
    en: "SHA-1 was designed by the NSA and published in 1995. In 2017 Google and CWI Amsterdam produced the first practical collision (SHAttered), and browsers stopped trusting SHA-1 certificates. Git historically names objects by SHA-1 and is moving to SHA-256; for new work pick SHA-256.",
  },
  sha224: {
    ru: "SHA-224 — вариант SHA-256 с другими начальными значениями, результат обрезается до 224 бит. Он даёт 112 бит стойкости к коллизиям и используется там, где нужен более короткий хэш того же семейства SHA-2.",
    en: "SHA-224 is SHA-256 with different initial values, truncated to 224 bits. It offers 112-bit collision resistance and is used where a shorter SHA-2 digest is needed.",
  },
  sha256: {
    ru: "SHA-256 из семейства SHA-2 — самая распространённая криптографическая хэш-функция: TLS-сертификаты, подписи кода, Bitcoin (двойной SHA-256), Docker-образы (sha256:…) и файлы SHA256SUMS у дистрибутивов Linux. Практических атак на него нет.",
    en: "SHA-256 from the SHA-2 family is the most widely used cryptographic hash: TLS certificates, code signing, Bitcoin (double SHA-256), Docker image digests (sha256:…) and the SHA256SUMS files of Linux distributions. There are no practical attacks on it.",
  },
  sha384: {
    ru: "SHA-384 — это SHA-512 с другими начальными значениями, обрезанный до 384 бит. Его используют шифронаборы TLS 1.3 (TLS_AES_256_GCM_SHA384) и атрибут integrity для скриптов на сайтах (sha384-…); обрезка защищает от атаки удлинения сообщения.",
    en: "SHA-384 is SHA-512 with different initial values, truncated to 384 bits. It is used by TLS 1.3 cipher suites (TLS_AES_256_GCM_SHA384) and Subresource Integrity attributes (sha384-…); truncation also blocks length-extension attacks.",
  },
  sha512: {
    ru: "SHA-512 работает с 64-битными словами, поэтому на 64-битных процессорах он часто быстрее SHA-256. Его использует подпись Ed25519, хэши паролей $6$ в Linux (SHA-crypt) и многие протоколы, где нужен длинный хэш.",
    en: "SHA-512 works on 64-bit words, so on 64-bit CPUs it is often faster than SHA-256. It is used inside Ed25519 signatures, Linux $6$ password hashes (SHA-crypt) and many protocols that need a long digest.",
  },
  "sha512-256": {
    ru: "SHA-512/256 — SHA-512 с собственными начальными значениями, обрезанный до 256 бит. Он даёт тот же уровень стойкости, что SHA-256, но на 64-битных процессорах быстрее и не подвержен атаке удлинения сообщения. Это не то же самое, что просто первые 64 символа SHA-512.",
    en: "SHA-512/256 is SHA-512 with its own initial values, truncated to 256 bits. It matches SHA-256's security, runs faster on 64-bit CPUs and resists length extension. It is not the same as the first 64 characters of SHA-512.",
  },
  "sha3-224": {
    ru: "SHA3-224 — самый короткий вариант SHA-3 (FIPS 202, 2015). SHA-3 построен на конструкции «губка» Keccak и не имеет ничего общего с SHA-2 внутри, поэтому служит запасным стандартом на случай атак на SHA-2.",
    en: "SHA3-224 is the shortest SHA-3 variant (FIPS 202, 2015). SHA-3 uses the Keccak sponge construction and shares nothing internally with SHA-2, so it is a backup standard in case SHA-2 is ever broken.",
  },
  "sha3-256": {
    ru: "SHA3-256 — основной вариант SHA-3 (FIPS 202): 256 бит, как у SHA-256, но совсем другая внутренняя конструкция (губка Keccak). Не путайте его с Keccak-256 из Ethereum: они отличаются байтом дополнения, и хэши получаются разными.",
    en: "SHA3-256 is the main SHA-3 variant (FIPS 202): 256 bits like SHA-256 but a completely different design (the Keccak sponge). Don't confuse it with Ethereum's Keccak-256: the padding byte differs, so the digests differ.",
  },
  "sha3-384": {
    ru: "SHA3-384 — вариант SHA-3 (FIPS 202) с 384-битным результатом и 192 битами стойкости к коллизиям. Применяется там, где требования регулятора предписывают SHA-3 с запасом стойкости.",
    en: "SHA3-384 is the SHA-3 variant (FIPS 202) with a 384-bit output and 192-bit collision resistance, used where regulations call for SHA-3 with extra margin.",
  },
  "sha3-512": {
    ru: "SHA3-512 — самый длинный вариант SHA-3 (FIPS 202): 512 бит, 128 шестнадцатеричных символов. Он медленнее SHA-512, зато основан на независимой от SHA-2 конструкции.",
    en: "SHA3-512 is the longest SHA-3 variant (FIPS 202): 512 bits, 128 hex characters. It is slower than SHA-512 but built on a design independent of SHA-2.",
  },
  "keccak-256": {
    ru: "Keccak-256 — исходный алгоритм Keccak, выигравший конкурс SHA-3, с первоначальным дополнением (байт 0x01). Ethereum выбрал его до выхода FIPS 202: из Keccak-256 получаются адреса кошельков, селекторы функций смарт-контрактов и топики событий. SHA3-256 даёт другой результат.",
    en: "Keccak-256 is the original Keccak that won the SHA-3 competition, with the original padding (byte 0x01). Ethereum adopted it before FIPS 202 was final: wallet addresses, contract function selectors and event topics come from Keccak-256. SHA3-256 gives a different result.",
  },
  blake2b: {
    ru: "BLAKE2b (RFC 7693, 2012) быстрее MD5 и SHA-1, но при этом криптостойкий. Он оптимизирован для 64-битных процессоров, выдаёт от 1 до 64 байт и используется в Argon2, libsodium (crypto_generichash) и утилите b2sum.",
    en: "BLAKE2b (RFC 7693, 2012) is faster than MD5 and SHA-1 while being cryptographically secure. It targets 64-bit CPUs, outputs 1 to 64 bytes and is used by Argon2, libsodium (crypto_generichash) and the b2sum utility.",
  },
  blake2s: {
    ru: "BLAKE2s — вариант BLAKE2 (RFC 7693) для 32-битных и встраиваемых платформ, результат до 256 бит. Именно BLAKE2s использует VPN-протокол WireGuard.",
    en: "BLAKE2s is the BLAKE2 variant (RFC 7693) for 32-bit and embedded platforms with up to 256 bits of output. The WireGuard VPN protocol uses BLAKE2s.",
  },
  blake3: {
    ru: "BLAKE3 (2020) построен как дерево Меркла, поэтому хорошо распараллеливается и на современных процессорах в разы быстрее SHA-256. Длина результата произвольная (по умолчанию 256 бит); для файлов есть утилита b3sum.",
    en: "BLAKE3 (2020) is built as a Merkle tree, so it parallelizes well and runs several times faster than SHA-256 on modern CPUs. Output length is arbitrary (256 bits by default); b3sum hashes files from the command line.",
  },
  ripemd160: {
    ru: "RIPEMD-160 создан в Европе в 1996 году как альтернатива SHA-1. Сегодня он известен в основном по Bitcoin: адрес вида 1… — это RIPEMD-160 от SHA-256 публичного ключа. Для новых систем его не рекомендуют: 160 бит дают лишь 80 бит стойкости к коллизиям.",
    en: "RIPEMD-160 was created in Europe in 1996 as an alternative to SHA-1. Today it is best known from Bitcoin: a 1… address is RIPEMD-160 of the SHA-256 of a public key. It isn't recommended for new systems: 160 bits give only 80-bit collision resistance.",
  },
  crc32: {
    ru: "CRC-32 (полином 0x04C11DB7) — контрольная сумма для обнаружения случайных ошибок при передаче и хранении: её содержат ZIP, gzip, PNG и кадры Ethernet. От намеренной подмены CRC32 не защищает: подобрать данные с нужной суммой легко.",
    en: "CRC-32 (polynomial 0x04C11DB7) is a checksum that detects accidental errors in transmission and storage: ZIP, gzip, PNG and Ethernet frames carry it. It does not protect against deliberate tampering — forging data with a chosen CRC32 is easy.",
  },
  crc32c: {
    ru: "CRC-32C использует полином Кастаньоли (0x1EDC6F41), который лучше обнаруживает ошибки, а современные процессоры считают его аппаратно (инструкция SSE4.2). Его применяют iSCSI, SCTP, ext4, Btrfs и Google Cloud Storage.",
    en: "CRC-32C uses the Castagnoli polynomial (0x1EDC6F41), which detects errors better, and modern CPUs compute it in hardware (the SSE4.2 instruction). It is used by iSCSI, SCTP, ext4, Btrfs and Google Cloud Storage.",
  },
  adler32: {
    ru: "Adler-32 — контрольная сумма из формата zlib (RFC 1950), которую придумал Марк Адлер. Она быстрее CRC32, но хуже обнаруживает ошибки в коротких сообщениях. Результат — 8 шестнадцатеричных символов; для пустых данных он равен 00000001.",
    en: "Adler-32 is the zlib checksum (RFC 1950) designed by Mark Adler. It is faster than CRC32 but detects errors in short messages less reliably. The result is 8 hex characters; for empty input it is 00000001.",
  },
  xxhash32: {
    ru: "xxHash32 — очень быстрый некриптографический хэш Янна Колле для хэш-таблиц, дедупликации и проверки целостности. Он не защищает от подбора, зато работает со скоростью памяти. Здесь используется seed = 0.",
    en: "xxHash32 is a very fast non-cryptographic hash by Yann Collet for hash tables, deduplication and integrity checks. It offers no protection against deliberate forgery but runs at memory speed. Seed 0 is used here.",
  },
  xxhash64: {
    ru: "xxHash64 — 64-битная версия xxHash: быстрее на 64-битных процессорах и с гораздо меньшим шансом случайного совпадения, чем у 32-битной. Её использует, например, формат сжатия Zstandard для контрольной суммы содержимого. Seed = 0.",
    en: "xxHash64 is the 64-bit xxHash: faster on 64-bit CPUs and with far fewer accidental collisions than the 32-bit one. The Zstandard format, for example, uses it for its content checksum. Seed 0.",
  },
  xxh3: {
    ru: "XXH3 — новое поколение xxHash (2020), особенно быстрое на коротких входных данных благодаря векторным инструкциям. Здесь вычисляется 64-битный вариант XXH3 с seed = 0, как у xxhsum -H3.",
    en: "XXH3 is the newer xxHash generation (2020), especially fast on short inputs thanks to vector instructions. This page computes the 64-bit XXH3 variant with seed 0, like xxhsum -H3.",
  },
};

/** Command-line equivalents (only commands that really exist). */
export const COMMANDS: Partial<Record<AlgoId, string[]>> = {
  md5: ["md5sum file.iso", "md5 file.iso  # macOS", "certutil -hashfile file.iso MD5", "Get-FileHash file.iso -Algorithm MD5"],
  sha1: ["sha1sum file.iso", "shasum -a 1 file.iso", "certutil -hashfile file.iso SHA1", "Get-FileHash file.iso -Algorithm SHA1"],
  sha224: ["sha224sum file.iso", "shasum -a 224 file.iso", "openssl dgst -sha224 file.iso"],
  sha256: ["sha256sum file.iso", "shasum -a 256 file.iso", "certutil -hashfile file.iso SHA256", "Get-FileHash file.iso"],
  sha384: ["sha384sum file.iso", "shasum -a 384 file.iso", "certutil -hashfile file.iso SHA384", "Get-FileHash file.iso -Algorithm SHA384"],
  sha512: ["sha512sum file.iso", "shasum -a 512 file.iso", "certutil -hashfile file.iso SHA512", "Get-FileHash file.iso -Algorithm SHA512"],
  "sha512-256": ["shasum -a 512256 file.iso", "openssl dgst -sha512-256 file.iso"],
  "sha3-224": ["openssl dgst -sha3-224 file.iso"],
  "sha3-256": ["openssl dgst -sha3-256 file.iso", "rhash --sha3-256 file.iso"],
  "sha3-384": ["openssl dgst -sha3-384 file.iso"],
  "sha3-512": ["openssl dgst -sha3-512 file.iso", "rhash --sha3-512 file.iso"],
  "keccak-256": ["cast keccak 'abc'  # Foundry"],
  blake2b: ["b2sum file.iso", "openssl dgst -blake2b512 file.iso"],
  blake2s: ["openssl dgst -blake2s256 file.iso"],
  blake3: ["b3sum file.iso"],
  ripemd160: ["openssl dgst -ripemd160 file.iso"],
  crc32: ["rhash --crc32 file.iso", "7z h -scrcCRC32 file.iso"],
  crc32c: ["rhash --crc32c file.iso"],
  adler32: ["python3 -c \"import zlib,sys;print('%08x' % zlib.adler32(open(sys.argv[1],'rb').read()))\" file.iso"],
  xxhash32: ["xxhsum -H0 file.iso"],
  xxhash64: ["xxhsum -H1 file.iso"],
  xxh3: ["xxhsum -H3 file.iso"],
};
