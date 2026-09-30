import { describe, expect, it } from "vitest";
import { touchTitle } from "@/ui/dropzone";

describe("dropzone title on touch screens", () => {
  it.each([
    ["Перетащите PDF-файлы сюда или нажмите, чтобы выбрать", "Нажмите, чтобы выбрать PDF-файлы"],
    ["Перетащите файлы или нажмите, чтобы выбрать", "Нажмите, чтобы выбрать файлы"],
    ["Перетащите изображения сюда, вставьте Ctrl+V или нажмите, чтобы выбрать", "Нажмите, чтобы выбрать изображения"],
    ["Перетащите все части сюда или нажмите, чтобы выбрать (.001, .002 …)", "Нажмите, чтобы выбрать все части (.001, .002 …)"],
    ["Перетащите первое изображение или нажмите", "Нажмите, чтобы выбрать первое изображение"],
    ["Drop files here or click to choose", "Tap to choose files"],
    ["Drop a file here or click to choose", "Tap to choose a file"],
    ["Drop files or click to choose", "Tap to choose files"],
    ["Drop all parts here or click to choose (.001, .002 …)", "Tap to choose all parts (.001, .002 …)"],
  ])("%s", (title, touch) => {
    expect(touchTitle(title)).toBe(touch);
  });

  it("leaves other titles alone", () => {
    expect(touchTitle("Перетащите фото или скриншот с кодом")).toBeNull();
    expect(touchTitle("Choose a video")).toBeNull();
  });
});
