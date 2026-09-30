export type CodeClass = "informational" | "success" | "redirection" | "client-error" | "server-error";

export type CodeStatus =
  /** Registered in the IANA HTTP Status Code Registry */
  | "standard"
  /** Registered but deprecated/obsolete/historic */
  | "deprecated"
  /** Registered as "(Unused)" / reserved */
  | "unused"
  /** Temporary IANA registration (draft) */
  | "temporary"
  /** Not registered: used by a specific product */
  | "unofficial";

export interface CodeText {
  /** One-line plain answer (used as lead). */
  s: string;
  /** Meaning in plain words. */
  m: string;
  /** When servers send it. */
  w: string;
  /** Typical causes (errors) or typical uses (other classes). */
  c: string[];
  /** Client-side actions. */
  fc: string[];
  /** Server-side actions. */
  fs: string[];
  /** Retry / idempotency note. */
  r?: string;
  /** Russian/English short translation of the name (ru only meaningful). */
  n: string;
}

export interface HttpCode {
  code: number;
  /** Official reason phrase (RFC 9110 names for standard codes). */
  name: string;
  status: CodeStatus;
  /** Specification or origin, e.g. "RFC 9110, 15.5.5" or "nginx". */
  spec: string;
  /** Heuristically cacheable by default (RFC 9110 §15.1). */
  cacheable?: boolean;
  headers?: string[];
  related: number[];
  ru: CodeText;
  en: CodeText;
  /** Raw HTTP response example (without the body when there is none). */
  example: string;
}

export function classOf(code: number): CodeClass {
  if (code < 200) return "informational";
  if (code < 300) return "success";
  if (code < 400) return "redirection";
  if (code < 500) return "client-error";
  return "server-error";
}

/** Build a raw HTTP/1.1 response for examples. */
export function resp(code: number, reason: string, headers: string[] = [], body?: string): string {
  const lines = [`HTTP/1.1 ${code} ${reason}`, ...headers];
  return body === undefined ? lines.join("\n") : `${lines.join("\n")}\n\n${body}`;
}
