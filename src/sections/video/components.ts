import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "video/convert": () => import("./MediaConverter"),
  "video/compress": () => import("./VideoCompress"),
  "video/trim": () => import("./VideoTrim"),
  "video/to-gif": () => import("./VideoToGif"),
  "video/merge": () => import("./VideoMerge"),
  "video/resize": () => import("./VideoResize"),
  "video/rotate": () => import("./VideoRotate"),
  "video/mute": () => import("./VideoMute"),
  "video/speed": () => import("./VideoSpeed"),
  "video/frames": () => import("./VideoFrames"),
  "video/recorder": () => import("./Recorder"),
};
