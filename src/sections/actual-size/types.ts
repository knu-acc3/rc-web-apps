import type { L10n } from "@/i18n/config";

/** How an object is drawn (SVG art in millimetres, see art.tsx). */
export type Shape =
  | "card"
  | "rect"
  | "paper"
  | "envelope"
  | "photo"
  | "print"
  | "instant"
  | "banknote"
  | "sim"
  | "sd"
  | "microsd"
  | "playing-card"
  | "coin"
  | "bimetal"
  | "cell"
  | "battery"
  | "9v"
  | "plug-usb-a"
  | "plug-usb-c"
  | "plug-micro-usb"
  | "plug-lightning"
  | "plug-hdmi"
  | "jack"
  | "phone"
  | "tablet"
  | "watch"
  | "watch-round"
  | "earbuds"
  | "airtag"
  | "console"
  | "lego"
  | "postit"
  | "disc"
  | "floppy"
  | "cassette"
  | "cube"
  | "ball"
  | "puck";

/** Serializable object passed to the client viewer. All sizes in millimetres. */
export interface ClientObj {
  slug: string;
  name: L10n;
  /** Category id (for grouping in the object selector). */
  cat?: string;
  /** Horizontal size (for round objects: the diameter). */
  w: number;
  /** Vertical size (for round objects: the diameter). */
  h: number;
  /** Thickness / depth. */
  d?: number;
  shape: Shape;
  /** Short text drawn on the object ("A4", "1 €", "AA"). */
  label?: string;
  /** Corner radius, mm. */
  r?: number;
  /** Device details: home button, notch style. */
  home?: boolean;
  notch?: "notch" | "island" | "hole";
  /** LEGO studs, disc hole diameter, console side width… */
  cols?: number;
  rows?: number;
  hole?: number;
  side?: number;
}

/** Devices are listed height × width (× depth), like manufacturer spec sheets. */
export const DEVICE_SHAPES: ReadonlySet<Shape> = new Set<Shape>(["phone", "tablet", "watch", "watch-round"]);

/** Shapes whose w = h = diameter. */
export const ROUND_SHAPES: ReadonlySet<Shape> = new Set<Shape>(["coin", "bimetal", "cell", "jack", "airtag", "disc", "ball", "puck"]);
