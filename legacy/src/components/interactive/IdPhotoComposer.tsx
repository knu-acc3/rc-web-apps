'use client';

import React, { useRef, useState, useEffect } from 'react';

export function IdPhotoComposer() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [format, setFormat] = useState<'3x4' | '3.5x4.5' | '2x2'>('3.5x4.5');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      // 10x15 cm sheet at 300 DPI = 1181 x 1772 px
      canvas.width = 1181;
      canvas.height = 1772;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Single photo dimensions in px at 300 DPI (1 mm = 11.811 px)
      let photoW = 413; // 35mm
      let photoH = 531; // 45mm
      if (format === '3x4') {
        photoW = 354; // 30mm
        photoH = 472; // 40mm
      } else if (format === '2x2') {
        photoW = 600; // 2 inches = 50.8mm
        photoH = 600;
      }

      // Draw 4 photos on sheet
      const cols = format === '2x2' ? 1 : 2;
      const rows = format === '2x2' ? 2 : 3;
      const marginX = Math.floor((canvas.width - cols * photoW) / (cols + 1));
      const marginY = 80;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = marginX + c * (photoW + marginX);
          const y = marginY + r * (photoH + 50);

          // Draw cropped photo maintaining aspect ratio
          const scale = Math.max(photoW / img.width, photoH / img.height);
          const sw = photoW / scale;
          const sh = photoH / scale;
          const sx = (img.width - sw) / 2;
          const sy = (img.height - sh) / 2;

          ctx.drawImage(img, sx, sy, sw, sh, x, y, photoW, photoH);

          // Thin cutting border
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, photoW, photoH);
        }
      }
    };
  }, [imageSrc, format]);

  const handleExport300Dpi = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `id-photo-${format}-300dpi.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto p-4 sm:p-6 border rounded-2xl bg-card">
      <div className="text-center">
        <h3 className="text-2xl font-bold">Фото на документы онлайн (300 DPI)</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Печатный лист 10 × 15 см с точной раскладкой и линиями обреза для фото 3×4, 3.5×4.5 см или 2×2″
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFormat('3.5x4.5')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
            format === '3.5x4.5' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          3.5 × 4.5 см (Паспорт)
        </button>
        <button
          onClick={() => setFormat('3x4')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
            format === '3x4' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          3 × 4 см (Студенческий)
        </button>
        <button
          onClick={() => setFormat('2x2')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
            format === '2x2' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          2 × 2″ (Виза США)
        </button>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="w-full min-h-[44px] p-2 border rounded-xl file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
      />

      {imageSrc && (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="relative border rounded-xl overflow-hidden max-w-xs shadow-md">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>

          <button
            onClick={handleExport300Dpi}
            className="w-full min-h-[48px] bg-primary text-primary-foreground font-bold rounded-xl active:scale-95 transition-all shadow"
          >
            Скачать лист печати 10×15 см (300 DPI)
          </button>
        </div>
      )}
    </div>
  );
}
