export type Proto = "tcp" | "udp" | "sctp";

export type PortCat =
  | "web"
  | "mail"
  | "network-services"
  | "remote-access"
  | "file-sharing"
  | "databases"
  | "messaging"
  | "dev-servers"
  | "devops"
  | "vpn-proxy"
  | "directory"
  | "games"
  | "voip-media"
  | "iot"
  | "printing"
  | "legacy";

type Pair = [ru: string, en: string];

export interface PortDef {
  port: number;
  proto: Proto[];
  /** IANA service name(s), "" when the use is unofficial */
  iana: string;
  /** Assigned by IANA for this use (false = de-facto/unofficial default). */
  official: boolean;
  cat: PortCat;
  /** Short service label: [ru, en] */
  s: Pair;
  /** Description, 1–3 sentences: [ru, en] */
  d: Pair;
  /** Typical software (language-neutral) */
  sw?: string;
  related?: number[];
  /** Port-specific security note: [ru, en] */
  sec?: Pair;
}

/** Compact constructor to keep the data files readable. */
export function P(
  port: number,
  proto: string,
  iana: string,
  official: boolean,
  cat: PortCat,
  s: string | Pair,
  d: Pair,
  sw?: string,
  related?: number[],
  sec?: Pair,
): PortDef {
  return {
    port,
    proto: proto.split(",") as Proto[],
    iana,
    official,
    cat,
    s: typeof s === "string" ? [s, s] : s,
    d,
    sw,
    related,
    sec,
  };
}
