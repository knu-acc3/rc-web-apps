import type { ComponentMap } from "../../types";

export const generatorComponents: ComponentMap = {
  "audio/tone": () => import("./gen/ToneGenerator"),
  "audio/noise": () => import("./gen/NoiseGenerator"),
  "audio/metronome": () => import("./gen/Metronome"),
  "audio/tuner": () => import("./gen/Tuner"),
  "audio/tap-bpm": () => import("./gen/TapBpm"),
  "audio/db-meter": () => import("./gen/DecibelMeter"),
  "audio/speaker-cleaner": () => import("./gen/SpeakerCleaner"),
};
