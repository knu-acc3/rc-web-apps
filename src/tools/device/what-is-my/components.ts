import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "what-is-my/browser": () => import("./BrowserInfo"),
  "what-is-my/os": () => import("./OsInfo"),
  "what-is-my/device": () => import("./DeviceInfo"),
  "what-is-my/screen-resolution": () => import("./ScreenInfo"),
  "what-is-my/viewport": () => import("./ViewportInfo"),
  "what-is-my/user-agent": () => import("./UserAgentInfo"),
  "what-is-my/timezone": () => import("./TimezoneInfo"),
  "what-is-my/language": () => import("./LanguageInfo"),
  "what-is-my/cpu": () => import("./CpuInfo"),
  "what-is-my/memory": () => import("./MemoryInfo"),
  "what-is-my/gpu": () => import("./GpuInfo"),
  "what-is-my/dpi": () => import("./DpiInfo"),
  "what-is-my/bitness": () => import("./BitnessInfo"),
  "what-is-my/javascript": () => import("./JavascriptInfo"),
  "what-is-my/cookies": () => import("./CookiesInfo"),
  "what-is-my/privacy": () => import("./PrivacySignals"),
  "what-is-my/features": () => import("./FeaturesInfo"),
  "what-is-my/summary": () => import("./Summary"),
};
