/** Standard tunings for the tuner (scientific pitch notation, A4 = 440 Hz). */

export type InstrumentId = "chromatic" | "guitar" | "bass" | "ukulele" | "violin" | "balalaika" | "dombra";

interface Instrument {
  id: InstrumentId;
  /** Strings from the lowest-numbered (thickest for guitar) as players name them. */
  strings: string[];
  /** Lowest/highest frequency the detector listens for. */
  range: [number, number];
}

export const INSTRUMENTS: Record<InstrumentId, Instrument> = {
  chromatic: { id: "chromatic", strings: [], range: [30, 4200] },
  guitar: { id: "guitar", strings: ["E2", "A2", "D3", "G3", "B3", "E4"], range: [60, 1400] },
  bass: { id: "bass", strings: ["E1", "A1", "D2", "G2"], range: [30, 500] },
  ukulele: { id: "ukulele", strings: ["G4", "C4", "E4", "A4"], range: [180, 1400] },
  violin: { id: "violin", strings: ["G3", "D4", "A4", "E5"], range: [150, 2600] },
  balalaika: { id: "balalaika", strings: ["E4", "E4", "A4"], range: [250, 1800] },
  dombra: { id: "dombra", strings: ["D3", "G3"], range: [100, 1200] },
};
