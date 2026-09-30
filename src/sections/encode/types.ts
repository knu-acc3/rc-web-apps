/** Shared codec contract. Engines are pure and return structured, localizable errors. */

export type Opts = Record<string, string | number | boolean | undefined>;

export interface CodecError {
  /** Message key, e.g. "b64.char" (see ERRORS in Codec.tsx) */
  code: string;
  /** 0-based character index in the input, when known */
  pos?: number;
  /** Extra detail inserted into the message (a character, a sequence…) */
  detail?: string;
}

export interface CodecResult {
  text: string;
  /** Decoded bytes that are not valid UTF-8 (shown as hex + offered as a download) */
  bytes?: Uint8Array;
  error?: CodecError;
  /** Non-fatal notes (e.g. Kazakh letters sent as Russian ones) */
  notes?: CodecError[];
}

export interface Codec {
  encode(input: string, opts: Opts): CodecResult;
  decode(input: string, opts: Opts): CodecResult;
}

export const ok = (text: string, extra: Partial<CodecResult> = {}): CodecResult => ({ text, ...extra });
export const fail = (code: string, pos?: number, detail?: string): CodecResult => ({ text: "", error: { code, pos, detail } });
