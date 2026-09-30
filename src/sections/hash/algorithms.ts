/** Catalogue of hash algorithms (data only — safe to import on the server). */

export type AlgoId =
  | "md5"
  | "sha1"
  | "sha224"
  | "sha256"
  | "sha384"
  | "sha512"
  | "sha512-256"
  | "sha3-224"
  | "sha3-256"
  | "sha3-384"
  | "sha3-512"
  | "keccak-256"
  | "blake2b"
  | "blake2s"
  | "blake3"
  | "ripemd160"
  | "crc32"
  | "crc32c"
  | "adler32"
  | "xxhash32"
  | "xxhash64"
  | "xxh3";

export type Status = "broken" | "legacy" | "secure" | "checksum";

export interface AlgoDef {
  id: AlgoId;
  name: string;
  bits: number;
  /** Adjustable output length (blake2/blake3): allowed bit sizes */
  bitsOptions?: number[];
  block?: number;
  year: number;
  standard: string;
  family: "md" | "sha1" | "sha2" | "sha3" | "blake" | "ripemd" | "crc" | "xxhash";
  status: Status;
  /** Popular = shown first in the multi-hash table */
  popular?: boolean;
}

export const ALGOS: AlgoDef[] = [
  { id: "md5", name: "MD5", bits: 128, block: 512, year: 1992, standard: "RFC 1321", family: "md", status: "broken", popular: true },
  { id: "sha1", name: "SHA-1", bits: 160, block: 512, year: 1995, standard: "FIPS 180-4", family: "sha1", status: "broken", popular: true },
  { id: "sha224", name: "SHA-224", bits: 224, block: 512, year: 2004, standard: "FIPS 180-4", family: "sha2", status: "secure" },
  { id: "sha256", name: "SHA-256", bits: 256, block: 512, year: 2001, standard: "FIPS 180-4", family: "sha2", status: "secure", popular: true },
  { id: "sha384", name: "SHA-384", bits: 384, block: 1024, year: 2001, standard: "FIPS 180-4", family: "sha2", status: "secure" },
  { id: "sha512", name: "SHA-512", bits: 512, block: 1024, year: 2001, standard: "FIPS 180-4", family: "sha2", status: "secure", popular: true },
  { id: "sha512-256", name: "SHA-512/256", bits: 256, block: 1024, year: 2012, standard: "FIPS 180-4", family: "sha2", status: "secure" },
  { id: "sha3-224", name: "SHA3-224", bits: 224, block: 1152, year: 2015, standard: "FIPS 202", family: "sha3", status: "secure" },
  { id: "sha3-256", name: "SHA3-256", bits: 256, block: 1088, year: 2015, standard: "FIPS 202", family: "sha3", status: "secure", popular: true },
  { id: "sha3-384", name: "SHA3-384", bits: 384, block: 832, year: 2015, standard: "FIPS 202", family: "sha3", status: "secure" },
  { id: "sha3-512", name: "SHA3-512", bits: 512, block: 576, year: 2015, standard: "FIPS 202", family: "sha3", status: "secure" },
  { id: "keccak-256", name: "Keccak-256", bits: 256, block: 1088, year: 2011, standard: "Keccak (pre-FIPS 202 padding)", family: "sha3", status: "secure", popular: true },
  { id: "blake2b", name: "BLAKE2b", bits: 512, bitsOptions: [160, 256, 384, 512], block: 1024, year: 2012, standard: "RFC 7693", family: "blake", status: "secure" },
  { id: "blake2s", name: "BLAKE2s", bits: 256, bitsOptions: [128, 160, 224, 256], block: 512, year: 2012, standard: "RFC 7693", family: "blake", status: "secure" },
  { id: "blake3", name: "BLAKE3", bits: 256, bitsOptions: [128, 256, 512], block: 512, year: 2020, standard: "BLAKE3 specification", family: "blake", status: "secure", popular: true },
  { id: "ripemd160", name: "RIPEMD-160", bits: 160, block: 512, year: 1996, standard: "ISO/IEC 10118-3", family: "ripemd", status: "legacy" },
  { id: "crc32", name: "CRC-32", bits: 32, year: 1975, standard: "IEEE 802.3 / ISO-HDLC", family: "crc", status: "checksum", popular: true },
  { id: "crc32c", name: "CRC-32C", bits: 32, year: 1993, standard: "Castagnoli (RFC 3720)", family: "crc", status: "checksum" },
  { id: "adler32", name: "Adler-32", bits: 32, year: 1995, standard: "RFC 1950", family: "crc", status: "checksum" },
  { id: "xxhash32", name: "xxHash32", bits: 32, year: 2012, standard: "xxHash specification", family: "xxhash", status: "checksum" },
  { id: "xxhash64", name: "xxHash64", bits: 64, year: 2014, standard: "xxHash specification", family: "xxhash", status: "checksum" },
  { id: "xxh3", name: "XXH3 (64-bit)", bits: 64, year: 2020, standard: "xxHash specification", family: "xxhash", status: "checksum" },
];

export const ALGO_BY_ID = new Map(ALGOS.map((a) => [a.id, a]));

export type HmacId = "hmac-md5" | "hmac-sha1" | "hmac-sha256" | "hmac-sha512" | "hmac-sha3-256";
export const HMACS: { id: HmacId; algo: AlgoId; name: string; standard: string }[] = [
  { id: "hmac-sha256", algo: "sha256", name: "HMAC-SHA256", standard: "RFC 2104, RFC 4231" },
  { id: "hmac-sha512", algo: "sha512", name: "HMAC-SHA512", standard: "RFC 2104, RFC 4231" },
  { id: "hmac-sha1", algo: "sha1", name: "HMAC-SHA1", standard: "RFC 2104, RFC 2202" },
  { id: "hmac-md5", algo: "md5", name: "HMAC-MD5", standard: "RFC 2104, RFC 2202" },
  { id: "hmac-sha3-256", algo: "sha3-256", name: "HMAC-SHA3-256", standard: "RFC 2104, FIPS 202" },
];

export type KdfId = "bcrypt" | "argon2" | "scrypt" | "pbkdf2";

/** Guess candidate algorithms from the length of a hex digest. */
export function algosForHexLength(len: number): AlgoId[] {
  switch (len) {
    case 8:
      return ["crc32", "crc32c", "adler32", "xxhash32"];
    case 16:
      return ["xxhash64", "xxh3"];
    case 32:
      return ["md5"];
    case 40:
      return ["sha1", "ripemd160"];
    case 56:
      return ["sha224", "sha3-224"];
    case 64:
      return ["sha256", "sha3-256", "blake3", "blake2s", "keccak-256", "sha512-256"];
    case 96:
      return ["sha384", "sha3-384"];
    case 128:
      return ["sha512", "sha3-512", "blake2b"];
    default:
      return [];
  }
}
