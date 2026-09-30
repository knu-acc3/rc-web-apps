"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Camera,
  Check,
  ClipboardText,
  Eyedropper,
  Trash,
} from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { EXTENDED_IMAGE_ACCEPT, isExtendedImageFile, normalizeImageForBrowser } from "@/src/lib/file-conversion/image-engine";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface HSV {
  h: number;
  s: number;
  v: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rgbToHex({ r, g, b }: RGB): string {
  return `#${[r, g, b]
    .map((channel) =>
      clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

function hexToRgb(value: string): RGB | null {
  const clean = value.trim().replace(/^#/, "");
  if (!/^[\da-f]{6}$/i.test(clean)) return null;
  const parsed = Number.parseInt(clean, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(lightness * 100) };

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;
  if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;
  return {
    h: Math.round((hue / 6) * 360) % 360,
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const hue = (((h % 360) + 360) % 360) / 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  if (saturation === 0) {
    const channel = Math.round(lightness * 255);
    return { r: channel, g: channel, b: channel };
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const hueToChannel = (offset: number) => {
    let position = offset;
    if (position < 0) position += 1;
    if (position > 1) position -= 1;
    if (position < 1 / 6) return p + (q - p) * 6 * position;
    if (position < 1 / 2) return q;
    if (position < 2 / 3) return p + (q - p) * (2 / 3 - position) * 6;
    return p;
  };
  return {
    r: Math.round(hueToChannel(hue + 1 / 3) * 255),
    g: Math.round(hueToChannel(hue) * 255),
    b: Math.round(hueToChannel(hue - 1 / 3) * 255),
  };
}

function rgbToHsv({ r, g, b }: RGB): HSV {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return {
    h: hue,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
}

function hsvToRgb({ h, s, v }: HSV): RGB {
  const saturation = clamp(s, 0, 100) / 100;
  const value = clamp(v, 0, 100) / 100;
  const chroma = value * saturation;
  const section = (((h % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;
  if (section < 1) [red, green] = [chroma, x];
  else if (section < 2) [red, green] = [x, chroma];
  else if (section < 3) [green, blue] = [chroma, x];
  else if (section < 4) [green, blue] = [x, chroma];
  else if (section < 5) [red, blue] = [x, chroma];
  else [red, blue] = [chroma, x];
  const match = value - chroma;
  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}

function rgbToCmyk({ r, g, b }: RGB): string {
  if (r === 0 && g === 0 && b === 0) return "cmyk(0%, 0%, 0%, 100%)";
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const black = 1 - Math.max(red, green, blue);
  const cyan = (1 - red - black) / (1 - black);
  const magenta = (1 - green - black) / (1 - black);
  const yellow = (1 - blue - black) / (1 - black);
  return `cmyk(${Math.round(cyan * 100)}%, ${Math.round(magenta * 100)}%, ${Math.round(yellow * 100)}%, ${Math.round(black * 100)}%)`;
}

function luminance({ r, g, b }: RGB): number {
  const normalize = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
}

function contrastRatio(first: RGB, second: RGB): number {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

function subscribeCapability(): () => void {
  return () => undefined;
}

function eyeDropperSnapshot(): boolean {
  return typeof window !== "undefined" && "EyeDropper" in window;
}

async function writeClipboard(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

export default function ColorPicker() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [rgb, setRgb] = useState<RGB>({ r: 74, g: 144, b: 217 });
  const [hexInput, setHexInput] = useState("#4A90D9");
  const [secondaryHex, setSecondaryHex] = useState("#FFFFFF");
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [eyeDropperActive, setEyeDropperActive] = useState(false);
  const eyeDropperSupported = useSyncExternalStore(
    subscribeCapability,
    eyeDropperSnapshot,
    () => false,
  );

  const svCanvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svPointerRef = useRef<number | null>(null);
  const huePointerRef = useRef<number | null>(null);
  const imagePointerRef = useRef<number | null>(null);

  const hex = useMemo(() => rgbToHex(rgb), [rgb]);
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb]);
  const hsv = useMemo(() => rgbToHsv(rgb), [rgb]);
  const validHexInput = hexToRgb(hexInput) !== null;

  const addToRecent = useCallback((color: string) => {
    setRecentColors((current) =>
      [color, ...current.filter((item) => item !== color)].slice(0, 8),
    );
  }, []);

  const updateRgb = useCallback(
    (next: RGB, save = false) => {
      const normalized = {
        r: clamp(Math.round(next.r), 0, 255),
        g: clamp(Math.round(next.g), 0, 255),
        b: clamp(Math.round(next.b), 0, 255),
      };
      const nextHex = rgbToHex(normalized);
      setRgb(normalized);
      setHexInput(nextHex);
      if (save) addToRecent(nextHex);
    },
    [addToRecent],
  );

  const updateFromHex = useCallback(
    (value: string) => {
      setHexInput(value);
      const parsed = hexToRgb(value);
      if (parsed) updateRgb(parsed);
    },
    [updateRgb],
  );

  useEffect(() => {
    const canvas = svCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const hueColor = hsvToRgb({ h: hsv.h, s: 100, v: 100 });
    context.fillStyle = `rgb(${hueColor.r}, ${hueColor.g}, ${hueColor.b})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const white = context.createLinearGradient(0, 0, canvas.width, 0);
    white.addColorStop(0, "#fff");
    white.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = white;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const black = context.createLinearGradient(0, 0, 0, canvas.height);
    black.addColorStop(0, "rgba(0,0,0,0)");
    black.addColorStop(1, "#000");
    context.fillStyle = black;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const x = (hsv.s / 100) * canvas.width;
    const y = (1 - hsv.v / 100) * canvas.height;
    context.beginPath();
    context.arc(x, y, 9, 0, Math.PI * 2);
    context.strokeStyle = "#fff";
    context.lineWidth = 3;
    context.stroke();
    context.strokeStyle = "#000";
    context.lineWidth = 1;
    context.stroke();
  }, [hsv]);

  useEffect(() => {
    const canvas = hueCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    ["#f00", "#ff0", "#0f0", "#0ff", "#00f", "#f0f", "#f00"].forEach(
      (color, index, colors) =>
        gradient.addColorStop(index / (colors.length - 1), color),
    );
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const y = (hsv.h / 360) * canvas.height;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.strokeStyle = "#fff";
    context.lineWidth = 4;
    context.stroke();
    context.strokeStyle = "#000";
    context.lineWidth = 1;
    context.stroke();
  }, [hsv.h]);

  const rgbFromSvPointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>): RGB => {
      const rect = event.currentTarget.getBoundingClientRect();
      const saturation =
        clamp((event.clientX - rect.left) / rect.width, 0, 1) * 100;
      const value =
        (1 - clamp((event.clientY - rect.top) / rect.height, 0, 1)) * 100;
      return hsvToRgb({ h: hsv.h, s: saturation, v: value });
    },
    [hsv.h],
  );

  const hueFromPointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>): RGB => {
      const rect = event.currentTarget.getBoundingClientRect();
      const hue = clamp((event.clientY - rect.top) / rect.height, 0, 1) * 360;
      return hsvToRgb({ h: hue % 360, s: hsv.s, v: hsv.v });
    },
    [hsv.s, hsv.v],
  );

  const beginSvPointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      svPointerRef.current = event.pointerId;
      updateRgb(rgbFromSvPointer(event));
    },
    [rgbFromSvPointer, updateRgb],
  );

  const moveSvPointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (svPointerRef.current !== event.pointerId) return;
      event.preventDefault();
      updateRgb(rgbFromSvPointer(event));
    },
    [rgbFromSvPointer, updateRgb],
  );

  const endSvPointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (svPointerRef.current !== event.pointerId) return;
      updateRgb(rgbFromSvPointer(event), true);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      svPointerRef.current = null;
    },
    [rgbFromSvPointer, updateRgb],
  );

  const beginHuePointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      huePointerRef.current = event.pointerId;
      updateRgb(hueFromPointer(event));
    },
    [hueFromPointer, updateRgb],
  );

  const moveHuePointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (huePointerRef.current !== event.pointerId) return;
      event.preventDefault();
      updateRgb(hueFromPointer(event));
    },
    [hueFromPointer, updateRgb],
  );

  const endHuePointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (huePointerRef.current !== event.pointerId) return;
      updateRgb(hueFromPointer(event), true);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      huePointerRef.current = null;
    },
    [hueFromPointer, updateRgb],
  );

  const cancelPointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (svPointerRef.current === event.pointerId) svPointerRef.current = null;
      if (huePointerRef.current === event.pointerId)
        huePointerRef.current = null;
      if (imagePointerRef.current === event.pointerId)
        imagePointerRef.current = null;
    },
    [],
  );

  const handleImageFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const sourceFile = event.target.files?.[0];
      if (!sourceFile) return;
      setImageError("");
      if (!isExtendedImageFile(sourceFile)) return;
      let file: File;
      try {
        file = await normalizeImageForBrowser(sourceFile);
      } catch {
        setImageError(isEn ? "This image format could not be opened." : "Не удалось открыть этот формат изображения.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setImageSource(String(reader.result));
      reader.onerror = () =>
        setImageError(
          isEn
            ? "The image could not be read."
            : "Не удалось прочитать изображение.",
        );
      reader.readAsDataURL(file);
    },
    [isEn],
  );

  useEffect(() => {
    const canvas = imageCanvasRef.current;
    if (!imageSource || !canvas) return;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(
        1,
        1600 / Math.max(image.naturalWidth, image.naturalHeight),
      );
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.onerror = () =>
      setImageError(
        isEn
          ? "The image could not be decoded."
          : "Не удалось декодировать изображение.",
      );
    image.src = imageSource;
  }, [imageSource, isEn]);

  const sampleImagePointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>, save = false) => {
      const canvas = event.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = clamp(
        Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width),
        0,
        canvas.width - 1,
      );
      const y = clamp(
        Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height),
        0,
        canvas.height - 1,
      );
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      try {
        const pixel = context.getImageData(x, y, 1, 1).data;
        updateRgb({ r: pixel[0], g: pixel[1], b: pixel[2] }, save);
      } catch {
        setImageError(
          isEn
            ? "This pixel could not be sampled."
            : "Не удалось выбрать этот пиксель.",
        );
      }
    },
    [isEn, updateRgb],
  );

  const beginImagePointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      imagePointerRef.current = event.pointerId;
      sampleImagePointer(event);
    },
    [sampleImagePointer],
  );

  const moveImagePointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (imagePointerRef.current !== event.pointerId) return;
      event.preventDefault();
      sampleImagePointer(event);
    },
    [sampleImagePointer],
  );

  const endImagePointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (imagePointerRef.current !== event.pointerId) return;
      sampleImagePointer(event, true);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      imagePointerRef.current = null;
    },
    [sampleImagePointer],
  );

  const copyHex = useCallback(async () => {
    await writeClipboard(hex);
    setCopyFeedback(true);
    window.setTimeout(() => setCopyFeedback(false), 1400);
  }, [hex]);

  const handleEyeDropper = useCallback(async () => {
    if (!eyeDropperSupported) return;
    setEyeDropperActive(true);
    try {
      const EyeDropperConstructor = (
        window as unknown as {
          EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
        }
      ).EyeDropper;
      const result = await new EyeDropperConstructor().open();
      const next = hexToRgb(result.sRGBHex);
      if (next) updateRgb(next, true);
    } catch {
      // Closing the native eyedropper is not an error state.
    } finally {
      setEyeDropperActive(false);
    }
  }, [eyeDropperSupported, updateRgb]);

  const secondaryRgb = hexToRgb(secondaryHex) ?? { r: 255, g: 255, b: 255 };
  const ratio = contrastRatio(rgb, secondaryRgb);
  const formats = [
    { label: "HEX", value: hex },
    { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: "CMYK", value: rgbToCmyk(rgb) },
  ];
  const relatedColors = [
    hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 }),
    hslToRgb({ ...hsl, h: (hsl.h + 30) % 360 }),
    hslToRgb({ ...hsl, h: (hsl.h + 330) % 360 }),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="p-4 sm:p-6">
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          {isEn
            ? "Drag or tap the field, enter HEX, or choose a pixel from an image."
            : "Проведите или нажмите на поле, введите HEX либо выберите пиксель изображения."}
        </p>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="tool-short-landscape-stage flex min-w-0 gap-3">
            <canvas
              ref={svCanvasRef}
              width={360}
              height={300}
              onPointerDown={beginSvPointer}
              onPointerMove={moveSvPointer}
              onPointerUp={endSvPointer}
              onPointerCancel={cancelPointer}
              className="tool-short-landscape-stage min-w-0 flex-1 cursor-crosshair rounded-[var(--radius-lg)]"
              style={{ aspectRatio: "6 / 5", touchAction: "none" }}
              aria-label={
                isEn ? "Saturation and brightness" : "Насыщенность и яркость"
              }
            />
            <canvas
              ref={hueCanvasRef}
              width={44}
              height={300}
              onPointerDown={beginHuePointer}
              onPointerMove={moveHuePointer}
              onPointerUp={endHuePointer}
              onPointerCancel={cancelPointer}
              className="tool-short-landscape-stage w-11 shrink-0 cursor-row-resize rounded-[var(--radius-lg)]"
              style={{ touchAction: "none" }}
              aria-label={isEn ? "Hue" : "Оттенок"}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div
              className="min-h-28 rounded-[var(--radius-lg)] border border-[var(--color-border)]"
              style={{ background: hex }}
              aria-label={`${isEn ? "Selected color" : "Выбранный цвет"} ${hex}`}
            />
            <label className="block text-sm font-semibold">
              <span className="mb-1.5 block text-[var(--color-text-muted)]">
                HEX
              </span>
              <Input
                value={hexInput}
                onChange={(event) => updateFromHex(event.target.value)}
                onBlur={() => {
                  if (!validHexInput) setHexInput(hex);
                  else addToRecent(hex);
                }}
                className="h-11 font-mono text-base font-bold"
                aria-invalid={!validHexInput}
              />
            </label>
            {!validHexInput ? (
              <div className="text-xs text-[var(--color-danger)]">
                {isEn
                  ? "Use a six-digit HEX value."
                  : "Введите HEX из шести цифр."}
              </div>
            ) : null}
            <Button
              size="lg"
              onClick={copyHex}
              className="tool-primary-action w-full gap-2"
            >
              {copyFeedback ? (
                <Check size={18} weight="bold" />
              ) : (
                <ClipboardText size={18} />
              )}
              {copyFeedback
                ? isEn
                  ? "Copied"
                  : "Скопировано"
                : isEn
                  ? `Copy ${hex}`
                  : `Скопировать ${hex}`}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              data-file-paste-target="true"
              accept={EXTENDED_IMAGE_ACCEPT}
              className="hidden"
              onChange={handleImageFile}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-11 w-full"
            >
              <Camera size={18} />
              {isEn ? "Choose image" : "Выбрать изображение"}
            </Button>
          </div>
        </div>

        {imageError ? (
          <div role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
            {imageError}
          </div>
        ) : null}

        {imageSource ? (
          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold">
              {isEn
                ? "Drag or tap the image to sample a pixel"
                : "Проведите или нажмите на изображение"}
            </div>
            <canvas
              ref={imageCanvasRef}
              onPointerDown={beginImagePointer}
              onPointerMove={moveImagePointer}
              onPointerUp={endImagePointer}
              onPointerCancel={cancelPointer}
              className="block max-h-80 w-full cursor-crosshair rounded-[var(--radius-md)] border border-[var(--color-border)] object-contain"
              style={{ touchAction: "none" }}
              aria-label={
                isEn
                  ? "Uploaded image color sampler"
                  : "Выбор цвета на изображении"
              }
            />
          </div>
        ) : null}

        <AdvancedSettings
          title={isEn ? "Color details" : "Параметры цвета"}
          description={
            isEn
              ? "Channels, formats, contrast and related colors"
              : "Каналы, форматы, контраст и связанные цвета"
          }
          className="mt-5"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold">RGB</h3>
              {(["r", "g", "b"] as const).map((channel) => (
                <label
                  key={channel}
                  className="mb-2 grid min-h-11 grid-cols-[24px_1fr_40px] items-center gap-2 text-sm"
                >
                  <span className="font-bold uppercase">{channel}</span>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={rgb[channel]}
                    onChange={(event) =>
                      updateRgb({
                        ...rgb,
                        [channel]: Number(event.target.value),
                      })
                    }
                    onPointerUp={() => addToRecent(hex)}
                    className="min-h-11 w-full accent-[var(--color-primary)]"
                  />
                  <span className="text-right font-mono text-xs">
                    {rgb[channel]}
                  </span>
                </label>
              ))}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">HSL</h3>
              {(
                [
                  ["h", 360],
                  ["s", 100],
                  ["l", 100],
                ] as const
              ).map(([channel, max]) => (
                <label
                  key={channel}
                  className="mb-2 grid min-h-11 grid-cols-[24px_1fr_44px] items-center gap-2 text-sm"
                >
                  <span className="font-bold uppercase">{channel}</span>
                  <input
                    type="range"
                    min={0}
                    max={max}
                    value={hsl[channel]}
                    onChange={(event) =>
                      updateRgb(
                        hslToRgb({
                          ...hsl,
                          [channel]: Number(event.target.value),
                        }),
                      )
                    }
                    onPointerUp={() => addToRecent(hex)}
                    className="min-h-11 w-full accent-[var(--color-primary)]"
                  />
                  <span className="text-right font-mono text-xs">
                    {hsl[channel]}
                    {channel === "h" ? "°" : "%"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleEyeDropper}
              disabled={!eyeDropperSupported || eyeDropperActive}
              className="min-h-11"
            >
              <Eyedropper size={18} />
              {eyeDropperActive
                ? isEn
                  ? "Picking…"
                  : "Выбор…"
                : isEn
                  ? "Pick from screen"
                  : "Выбрать с экрана"}
            </Button>
            {!eyeDropperSupported ? (
              <span className="self-center text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? "Screen eyedropper is unavailable in this browser."
                  : "Экранная пипетка недоступна в этом браузере."}
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {formats.map((format) => (
              <div key={format.label} className="flex items-end gap-2">
                <label className="min-w-0 flex-1 text-xs font-semibold">
                  <span className="mb-1 block text-[var(--color-text-muted)]">
                    {format.label}
                  </span>
                  <Input
                    value={format.value}
                    readOnly
                    className="h-11 font-mono text-sm"
                  />
                </label>
                <CopyButton text={format.value} />
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
            <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_160px] sm:items-end">
              <label className="text-sm font-semibold">
                <span className="mb-1.5 block text-[var(--color-text-muted)]">
                  {isEn ? "Contrast background" : "Фон для контраста"}
                </span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={hexToRgb(secondaryHex) ? secondaryHex : "#FFFFFF"}
                    onChange={(event) =>
                      setSecondaryHex(event.target.value.toUpperCase())
                    }
                    style={{ minWidth: 44 }}
                    className="h-11 rounded border border-[var(--color-border)] bg-transparent"
                  />
                  <Input
                    value={secondaryHex}
                    onChange={(event) => setSecondaryHex(event.target.value)}
                    className="h-11 font-mono"
                  />
                </div>
              </label>
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  WCAG
                </div>
                <div className="text-2xl font-bold">{ratio.toFixed(2)}:1</div>
                <div className="text-xs font-semibold">
                  {ratio >= 4.5
                    ? isEn
                      ? "AA text passes"
                      : "Текст AA проходит"
                    : isEn
                      ? "AA text fails"
                      : "Текст AA не проходит"}
                </div>
              </div>
            </div>
            <div
              className="flex min-h-24 items-center justify-center rounded-[var(--radius-sm)] px-4 text-center text-lg font-semibold"
              style={{ background: rgbToHex(secondaryRgb), color: hex }}
            >
              Aa · {hex}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold">
              {isEn ? "Related colors" : "Связанные цвета"}
            </div>
            <div className="flex flex-wrap gap-2">
              {relatedColors.map((color) => {
                const relatedHex = rgbToHex(color);
                return (
                  <button
                    key={relatedHex}
                    type="button"
                    onClick={() => updateRgb(color, true)}
                    className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 font-mono text-xs"
                    style={{
                      background: relatedHex,
                      color: luminance(color) > 0.45 ? "#111" : "#fff",
                    }}
                  >
                    {relatedHex}
                  </button>
                );
              })}
            </div>
          </div>

          {recentColors.length > 0 ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {isEn ? "Recent" : "Недавние"}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRecentColors([])}
                  aria-label={
                    isEn ? "Clear recent colors" : "Очистить недавние цвета"
                  }
                >
                  <Trash size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateFromHex(color)}
                    className="h-11 w-11 rounded-[var(--radius-sm)] border border-[var(--color-border)]"
                    style={{ background: color }}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </AdvancedSettings>
      </Card>
    </div>
  );
}
