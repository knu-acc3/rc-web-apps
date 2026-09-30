/// <reference lib="webworker" />
import { replaceText, type ReplaceRequest } from "./lib/replace";

self.onmessage = (e: MessageEvent<{ id: number; req: ReplaceRequest }>) => {
  const { id, req } = e.data;
  self.postMessage({ id, res: replaceText(req) });
};
