/* Shared by the PDF editor UI and the worker; no pdf-lib here, so the page stays light. */

/** Something placed on a page in the editor. Coordinates are fractions of the page as displayed, origin top-left. */
export type EditItem =
  | { kind: "text"; page: number; x: number; y: number; text: string; size: number; color: [number, number, number] }
  | { kind: "box"; page: number; x: number; y: number; w: number; h: number; color: [number, number, number] };

/** Line height used both by the editor's text boxes and in the PDF. */
export const EDIT_LINE_HEIGHT = 1.25;
