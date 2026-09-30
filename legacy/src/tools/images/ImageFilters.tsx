'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowCounterClockwise,
  Download,
  FileImage,
  Trash,
  UploadSimple,
  X,
} from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { cn } from '@/src/lib/cn';
import { EXTENDED_IMAGE_ACCEPT, isExtendedImageFile, normalizeImageForBrowser } from '@/src/lib/file-conversion/image-engine';
import { downloadCanvas } from '@/src/utils/exportHelpers';

interface FilterState {
  brightness: number;
  contrast: number;
  saturate: number;
  exposure: number;
  hueRotate: number;
  temperature: number;
  tint: number;
  vibrance: number;
  sharpen: number;
  blur: number;
  vignette: number;
  sepia: number;
  grayscale: number;
  invert: number;
  opacity: number;
}

const DEFAULT_FILTERS: FilterState = {
  brightness: 0,
  contrast: 0,
  saturate: 0,
  exposure: 0,
  hueRotate: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  sharpen: 0,
  blur: 0,
  vignette: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  opacity: 100,
};

type PresetId = 'original' | 'vivid' | 'warm' | 'cool' | 'mono' | 'vintage' | 'custom';
type OutputFormat = 'png' | 'jpeg' | 'webp';

interface Preset {
  id: Exclude<PresetId, 'custom'>;
  labelEn: string;
  labelRu: string;
  filters: Partial<FilterState>;
}

interface SliderDefinition {
  key: keyof FilterState;
  labelEn: string;
  labelRu: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

const PRESETS: Preset[] = [
  { id: 'original', labelEn: 'Original', labelRu: 'Оригинал', filters: {} },
  { id: 'vivid', labelEn: 'Vivid', labelRu: 'Яркий', filters: { brightness: 8, contrast: 22, saturate: 42, vibrance: 28, sharpen: 18 } },
  { id: 'warm', labelEn: 'Warm', labelRu: 'Тёплый', filters: { brightness: 6, saturate: 14, temperature: 28 } },
  { id: 'cool', labelEn: 'Cool', labelRu: 'Холодный', filters: { brightness: 4, saturate: -8, temperature: -28 } },
  { id: 'mono', labelEn: 'Black & white', labelRu: 'Чёрно-белый', filters: { grayscale: 100, contrast: 14 } },
  { id: 'vintage', labelEn: 'Vintage', labelRu: 'Винтаж', filters: { sepia: 48, contrast: 10, saturate: -18, vignette: 24 } },
];

const SLIDER_GROUPS: Array<{ titleEn: string; titleRu: string; sliders: SliderDefinition[] }> = [
  {
    titleEn: 'Light and color',
    titleRu: 'Свет и цвет',
    sliders: [
      { key: 'brightness', labelEn: 'Brightness', labelRu: 'Яркость', min: -100, max: 100 },
      { key: 'contrast', labelEn: 'Contrast', labelRu: 'Контраст', min: -100, max: 100 },
      { key: 'saturate', labelEn: 'Saturation', labelRu: 'Насыщенность', min: -100, max: 100 },
      { key: 'exposure', labelEn: 'Exposure', labelRu: 'Экспозиция', min: -100, max: 100 },
      { key: 'temperature', labelEn: 'Temperature', labelRu: 'Температура', min: -50, max: 50 },
      { key: 'tint', labelEn: 'Tint', labelRu: 'Оттенок', min: -50, max: 50 },
      { key: 'vibrance', labelEn: 'Vibrance', labelRu: 'Сочность', min: -100, max: 100 },
      { key: 'hueRotate', labelEn: 'Hue rotation', labelRu: 'Сдвиг тона', min: 0, max: 360, unit: '°' },
    ],
  },
  {
    titleEn: 'Detail and effects',
    titleRu: 'Детали и эффекты',
    sliders: [
      { key: 'sharpen', labelEn: 'Sharpen', labelRu: 'Резкость', min: 0, max: 100, unit: '%' },
      { key: 'blur', labelEn: 'Blur', labelRu: 'Размытие', min: 0, max: 20, step: 0.5, unit: 'px' },
      { key: 'vignette', labelEn: 'Vignette', labelRu: 'Виньетка', min: 0, max: 100, unit: '%' },
      { key: 'sepia', labelEn: 'Sepia', labelRu: 'Сепия', min: 0, max: 100, unit: '%' },
      { key: 'grayscale', labelEn: 'Grayscale', labelRu: 'Чёрно-белое', min: 0, max: 100, unit: '%' },
      { key: 'invert', labelEn: 'Invert', labelRu: 'Инверсия', min: 0, max: 100, unit: '%' },
      { key: 'opacity', labelEn: 'Opacity', labelRu: 'Непрозрачность', min: 0, max: 100, unit: '%' },
    ],
  },
];

function blendPreset(preset: Preset, strength: number): FilterState {
  const target = { ...DEFAULT_FILTERS, ...preset.filters };
  const factor = strength / 100;
  const result = { ...DEFAULT_FILTERS };
  (Object.keys(DEFAULT_FILTERS) as Array<keyof FilterState>).forEach((key) => {
    result[key] = DEFAULT_FILTERS[key] + (target[key] - DEFAULT_FILTERS[key]) * factor;
  });
  return result;
}

function buildCssFilter(filters: FilterState): string {
  return [
    `brightness(${100 + filters.brightness}%)`,
    `contrast(${100 + filters.contrast}%)`,
    `saturate(${100 + filters.saturate}%)`,
    `blur(${filters.blur}px)`,
    `grayscale(${filters.grayscale}%)`,
    `sepia(${filters.sepia}%)`,
    `hue-rotate(${filters.hueRotate}deg)`,
    `invert(${filters.invert}%)`,
    `opacity(${filters.opacity}%)`,
  ].join(' ');
}

function applyPixelAdjustments(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  filters: FilterState,
): void {
  const exposure = 1 + filters.exposure / 100;
  const temperature = filters.temperature * 1.5;
  const tint = filters.tint * 1.5;
  const vibrance = filters.vibrance / 100;
  const vignette = filters.vignette / 100;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.hypot(centerX, centerY);

  for (let y = 0, index = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1, index += 4) {
      let red = data[index] * exposure + temperature + tint * 0.5;
      let green = data[index + 1] * exposure - tint;
      let blue = data[index + 2] * exposure - temperature + tint * 0.5;

      if (vibrance !== 0) {
        const maximum = Math.max(red, green, blue);
        const average = (red + green + blue) / 3;
        const amount = (Math.abs(maximum - average) * 2 / 255) * vibrance;
        if (red !== maximum) red += (maximum - red) * amount;
        if (green !== maximum) green += (maximum - green) * amount;
        if (blue !== maximum) blue += (maximum - blue) * amount;
      }

      if (vignette > 0) {
        const distance = Math.hypot(x - centerX, y - centerY) / maxDistance;
        const factor = 1 - vignette * Math.pow(distance, 2.2);
        red *= factor;
        green *= factor;
        blue *= factor;
      }

      data[index] = Math.max(0, Math.min(255, red));
      data[index + 1] = Math.max(0, Math.min(255, green));
      data[index + 2] = Math.max(0, Math.min(255, blue));
    }
  }
}

function applySharpen(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number,
): Uint8ClampedArray {
  if (strength <= 0) return source;
  const amount = strength / 100;
  const result = new Uint8ClampedArray(source.length);
  const centerWeight = 1 + 4 * amount;
  const sideWeight = -amount;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        result.set(source.subarray(index, index + 4), index);
        continue;
      }
      for (let channel = 0; channel < 3; channel += 1) {
        const value = source[index + channel] * centerWeight
          + source[index - 4 + channel] * sideWeight
          + source[index + 4 + channel] * sideWeight
          + source[index - width * 4 + channel] * sideWeight
          + source[index + width * 4 + channel] * sideWeight;
        result[index + channel] = Math.max(0, Math.min(255, value));
      }
      result[index + 3] = source[index + 3];
    }
  }
  return result;
}

export default function ImageFilters() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef('');

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
  const [presetId, setPresetId] = useState<PresetId>('original');
  const [strength, setStrength] = useState(100);
  const [dragging, setDragging] = useState(false);
  const [format, setFormat] = useState<OutputFormat>('png');
  const [quality, setQuality] = useState(0.9);
  const [outputName, setOutputName] = useState('filtered');
  const [error, setError] = useState('');

  const currentPreset = useMemo(
    () => PRESETS.find((preset) => preset.id === presetId) ?? null,
    [presetId],
  );

  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.filter = buildCssFilter(filters);
    context.drawImage(image, 0, 0);
    context.filter = 'none';

    const needsPixelPass = filters.exposure !== 0
      || filters.temperature !== 0
      || filters.tint !== 0
      || filters.vibrance !== 0
      || filters.vignette > 0
      || filters.sharpen > 0;
    if (!needsPixelPass) return;

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      applyPixelAdjustments(imageData.data, canvas.width, canvas.height, filters);
      if (filters.sharpen > 0) {
        imageData.data.set(applySharpen(imageData.data, canvas.width, canvas.height, filters.sharpen));
      }
      context.putImageData(imageData, 0, 0);
    } catch {
      setError(isEn ? 'This image could not be processed.' : 'Не удалось обработать это изображение.');
    }
  }, [filters, image, isEn]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(renderImage);
    return () => window.cancelAnimationFrame(frame);
  }, [renderImage]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const selectPreset = useCallback((nextId: PresetId, nextStrength = strength) => {
    setPresetId(nextId);
    if (nextId === 'custom') return;
    const preset = PRESETS.find((item) => item.id === nextId);
    if (preset) setFilters(blendPreset(preset, nextStrength));
  }, [strength]);

  const changeStrength = useCallback((value: number) => {
    setStrength(value);
    if (currentPreset) setFilters(blendPreset(currentPreset, value));
  }, [currentPreset]);

  const loadFile = useCallback(async (rawFile: File) => {
    setError('');
    if (!isExtendedImageFile(rawFile)) {
      setError(isEn ? 'Choose an image file.' : 'Выберите файл изображения.');
      return;
    }
    let file: File;
    try {
      file = await normalizeImageForBrowser(rawFile);
    } catch {
      setError(isEn ? 'This image format could not be decoded.' : 'Не удалось декодировать этот формат изображения.');
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    const nextImage = new Image();
    nextImage.decoding = 'async';
    nextImage.onload = () => {
      setImage(nextImage);
      setFileName(file.name);
      setOutputName(`${file.name.replace(/\.[^.]+$/, '')}_filtered`);
      setPresetId('original');
      setStrength(100);
      setFilters({ ...DEFAULT_FILTERS });
    };
    nextImage.onerror = () => {
      setError(isEn ? 'The image could not be opened.' : 'Не удалось открыть изображение.');
      URL.revokeObjectURL(url);
      if (objectUrlRef.current === url) objectUrlRef.current = '';
    };
    nextImage.src = url;
  }, [isEn]);

  const clearImage = useCallback(() => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = '';
    setImage(null);
    setFileName('');
    setFilters({ ...DEFAULT_FILTERS });
    setPresetId('original');
    setStrength(100);
    setOutputName('filtered');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const downloadResult = useCallback(() => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, {
      baseName: outputName.trim() || 'filtered',
      format,
      quality: format === 'png' ? undefined : quality,
    });
  }, [format, outputName, quality]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <input
        ref={fileInputRef}
        type="file"
        data-file-paste-target="true"
        accept={EXTENDED_IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void loadFile(file);
        }}
      />

      {error ? (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]">
          <span className="flex-1">{error}</span>
          <button type="button" className="min-h-11 min-w-11" onClick={() => setError('')} aria-label={isEn ? 'Dismiss' : 'Закрыть'}>
            <X size={18} className="mx-auto" />
          </button>
        </div>
      ) : null}

      {!image ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void loadFile(file);
          }}
          className={cn(
            'flex min-h-56 w-full flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed p-6 text-center transition-colors',
            dragging
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]',
          )}
        >
          <UploadSimple size={34} className="text-[var(--color-primary)]" />
          <span className="mt-3 font-semibold">{isEn ? 'Upload an image' : 'Загрузите изображение'}</span>
          <span className="mt-1 text-sm text-[var(--color-text-muted)]">
            {isEn ? 'Drop it here or tap to choose a file' : 'Перетащите сюда или нажмите для выбора файла'}
          </span>
        </button>
      ) : (
        <div className="space-y-4">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <FileImage size={24} className="shrink-0 text-[var(--color-primary)]" />
              <div className="min-w-0 flex-1 truncate text-sm font-semibold" title={fileName}>{fileName}</div>
              <Button variant="outline" size="sm" className="min-h-11 min-w-11" onClick={clearImage}>
                <Trash size={17} />
                <span className="hidden sm:inline">{isEn ? 'New image' : 'Другое фото'}</span>
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden p-3 sm:p-4">
            <div className="tool-short-landscape-stage flex min-h-72 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)_0_0/20px_20px]">
              <canvas ref={canvasRef} className="block max-h-[62vh] w-full object-contain" />
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="filter-preset">{isEn ? 'Filter' : 'Фильтр'}</Label>
                <select
                  id="filter-preset"
                  className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base"
                  value={presetId}
                  onChange={(event) => selectPreset(event.target.value as PresetId)}
                >
                  {PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>{isEn ? preset.labelEn : preset.labelRu}</option>
                  ))}
                  {presetId === 'custom' ? <option value="custom">{isEn ? 'Custom' : 'Свои настройки'}</option> : null}
                </select>
              </div>
              <label className="block text-sm">
                <span className="font-medium">{isEn ? 'Strength' : 'Интенсивность'}: {strength}%</span>
                <input
                  className="mt-2 min-h-11 w-full accent-[var(--color-primary)]"
                  type="range"
                  min={0}
                  max={100}
                  value={strength}
                  disabled={!currentPreset}
                  onChange={(event) => changeStrength(Number(event.target.value))}
                />
              </label>
            </div>

            <div className="mt-4 flex justify-start">
              <Button size="lg" className="h-11 w-full sm:w-auto min-w-[220px] px-6 shadow-sm" onClick={downloadResult}>
                <Download size={20} weight="bold" />
                {isEn ? 'Apply and download' : 'Применить и скачать'}
              </Button>
            </div>
          </Card>

          <AdvancedSettings
            title={isEn ? 'Detailed adjustments and export' : 'Точная настройка и экспорт'}
            description={isEn ? 'Light, color, effects, format and filename' : 'Свет, цвет, эффекты, формат и имя файла'}
          >
            <div className="space-y-6">
              {SLIDER_GROUPS.map((group) => (
                <section key={group.titleEn}>
                  <h3 className="mb-3 text-sm font-semibold">{isEn ? group.titleEn : group.titleRu}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {group.sliders.map((slider) => (
                      <label key={slider.key} className="block text-sm">
                        <span className="flex items-center justify-between gap-2">
                          <span>{isEn ? slider.labelEn : slider.labelRu}</span>
                          <span className="font-mono text-xs text-[var(--color-text-muted)]">
                            {filters[slider.key]}{slider.unit ?? ''}
                          </span>
                        </span>
                        <input
                          className="mt-1 min-h-11 w-full accent-[var(--color-primary)]"
                          type="range"
                          min={slider.min}
                          max={slider.max}
                          step={slider.step ?? 1}
                          value={filters[slider.key]}
                          onChange={(event) => {
                            setPresetId('custom');
                            setFilters((current) => ({ ...current, [slider.key]: Number(event.target.value) }));
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </section>
              ))}

              <section className="border-t border-[var(--color-border-subtle)] pt-4">
                <h3 className="mb-3 text-sm font-semibold">{isEn ? 'Export' : 'Экспорт'}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="filter-format">{isEn ? 'Format' : 'Формат'}</Label>
                    <select
                      id="filter-format"
                      className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
                      value={format}
                      onChange={(event) => setFormat(event.target.value as OutputFormat)}
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="filter-name">{isEn ? 'Filename' : 'Имя файла'}</Label>
                    <Input id="filter-name" className="mt-1.5 h-11" value={outputName} onChange={(event) => setOutputName(event.target.value)} />
                  </div>
                </div>
                {format !== 'png' ? (
                  <label className="mt-4 block text-sm">
                    <span>{isEn ? 'Quality' : 'Качество'}: {Math.round(quality * 100)}%</span>
                    <input
                      className="mt-1 min-h-11 w-full accent-[var(--color-primary)]"
                      type="range"
                      min={0.35}
                      max={1}
                      step={0.05}
                      value={quality}
                      onChange={(event) => setQuality(Number(event.target.value))}
                    />
                  </label>
                ) : null}
              </section>

              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => {
                  setPresetId('original');
                  setStrength(100);
                  setFilters({ ...DEFAULT_FILTERS });
                }}
              >
                <ArrowCounterClockwise size={18} /> {isEn ? 'Reset adjustments' : 'Сбросить настройки'}
              </Button>
            </div>
          </AdvancedSettings>
        </div>
      )}
    </div>
  );
}
