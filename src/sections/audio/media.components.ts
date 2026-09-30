import type { ComponentMap } from "../types";

export const mediaComponents: ComponentMap = {
  "audio/convert": () => import("@/sections/video/MediaConverter"),
  "audio/editor": () => import("./editors/AudioEditor"),
  "audio/merge": () => import("./editors/AudioMerge"),
  "audio/voice-recorder": () => import("@/sections/video/Recorder"),
};
