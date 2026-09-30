import { base64ToBytes, hexToBytes, utf8Encode } from "@/sections/code/kit/bytes";

export type InputEncoding = "utf8" | "hex" | "base64";

/** Decode user input into bytes according to the chosen encoding. */
export function decodeInput(text: string, enc: InputEncoding): { bytes: Uint8Array } | { error: string } {
  try {
    if (enc === "utf8") return { bytes: utf8Encode(text) };
    if (enc === "hex") return { bytes: hexToBytes(text) };
    return { bytes: base64ToBytes(text) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export const INPUT_ENC_LABEL = {
  ru: { utf8: "Текст (UTF-8)", hex: "Hex", base64: "Base64" },
  en: { utf8: "Text (UTF-8)", hex: "Hex", base64: "Base64" },
} as const;
