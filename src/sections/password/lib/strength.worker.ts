/// <reference lib="webworker" />
import { checkStrength, type StrengthLocale } from "./strength-core";

self.onmessage = (e: MessageEvent<{ id: number; password: string; locale: StrengthLocale }>) => {
  const { id, password, locale } = e.data;
  (self as unknown as Worker).postMessage({ id, result: checkStrength(password, locale) });
};
