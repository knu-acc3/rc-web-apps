export type MimeCat = "web" | "image" | "audio" | "video" | "font" | "document" | "archive" | "data" | "code" | "app" | "model" | "security";

/** Where a type assignment comes from. */
export type TypeSource =
  /** IANA media types registry */
  | "iana"
  /** Apache httpd mime.types */
  | "apache"
  /** nginx mime.types */
  | "nginx"
  /** freedesktop.org shared-mime-info (Linux desktops) */
  | "fd"
  /** Widely used but not registered anywhere official */
  | "common";

type Pair = [ru: string, en: string];

export interface Curated {
  ext: string;
  cat: MimeCat;
  /** Short format name: [ru, en] */
  name: Pair;
  /** What the format is: [ru, en] */
  d: Pair;
  /** Preferred Content-Type when mime-db lists several. */
  prefer?: string;
  /** Types not present in mime-db for this extension. */
  extra?: { type: string; src: TypeSource }[];
  related?: string[];
}

export function C(ext: string, cat: MimeCat, name: string | Pair, d: Pair, opts: Omit<Curated, "ext" | "cat" | "name" | "d"> = {}): Curated {
  return { ext, cat, name: typeof name === "string" ? [name, name] : name, d, ...opts };
}

export const X = (type: string, src: TypeSource = "common") => ({ type, src });
