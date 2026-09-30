import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "test/microphone": () => import("./MicrophoneTest"),
  "test/webcam": () => import("./WebcamTest"),
  "test/speakers": () => import("./SpeakerTest"),
  "test/keyboard": () => import("./KeyboardTest"),
  "test/mouse": () => import("./MouseTest"),
  "test/click-speed": () => import("./ClickSpeedTest"),
  "test/dead-pixel": () => import("./DeadPixelTest"),
  "test/refresh-rate": () => import("./RefreshRateTest"),
  "test/touch": () => import("./TouchTest"),
  "test/gamepad": () => import("./GamepadTest"),
  "test/typing": () => import("./TypingTest"),
  "test/reaction": () => import("./ReactionTest"),
};
