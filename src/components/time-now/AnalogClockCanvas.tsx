'use client';

import React, { useRef, useEffect } from 'react';

export interface AnalogClockCanvasProps {
  readonly timezoneIana: string;
  readonly size?: number;
  readonly showSeconds?: boolean;
}

export function AnalogClockCanvas({
  timezoneIana,
  size = 220,
  showSeconds = true,
}: AnalogClockCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      const center = size / 2;
      const radius = center - 8;

      ctx.clearRect(0, 0, size, size);

      // Фоновый круг циферблата
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3b82f6';
      ctx.stroke();

      // Деления циферблата (12 часов и 60 минут)
      for (let i = 0; i < 60; i++) {
        const angle = (i * Math.PI) / 30;
        const isHour = i % 5 === 0;
        const tickLength = isHour ? 12 : 5;
        const startX = center + Math.sin(angle) * (radius - tickLength);
        const startY = center - Math.cos(angle) * (radius - tickLength);
        const endX = center + Math.sin(angle) * radius;
        const endY = center - Math.cos(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineWidth = isHour ? 2.5 : 1;
        ctx.strokeStyle = isHour ? '#94a3b8' : '#475569';
        ctx.stroke();
      }

      // Расчет локального времени в целевой зоне
      const now = new Date();
      let h = 0, m = 0, s = 0, ms = 0;
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: timezoneIana,
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          fractionalSecondDigits: 3,
          hour12: false,
        }).formatToParts(now);

        for (const p of parts) {
          if (p.type === 'hour') h = parseInt(p.value, 10);
          if (p.type === 'minute') m = parseInt(p.value, 10);
          if (p.type === 'second') s = parseInt(p.value, 10);
          if (p.type === 'fractionalSecond') ms = parseInt(p.value, 10);
        }
      } catch {
        h = now.getUTCHours();
        m = now.getUTCMinutes();
        s = now.getUTCSeconds();
        ms = now.getUTCMilliseconds();
      }

      const totalSeconds = s + ms / 1000;
      const totalMinutes = m + totalSeconds / 60;
      const totalHours = (h % 12) + totalMinutes / 60;

      // Часовая стрелка
      const hourAngle = (totalHours * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + Math.sin(hourAngle) * (radius * 0.5), center - Math.cos(hourAngle) * (radius * 0.5));
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f8fafc';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Минутная стрелка
      const minAngle = (totalMinutes * Math.PI) / 30;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + Math.sin(minAngle) * (radius * 0.72), center - Math.cos(minAngle) * (radius * 0.72));
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Секундная стрелка (плавный ход)
      if (showSeconds) {
        const secAngle = (totalSeconds * Math.PI) / 30;
        ctx.beginPath();
        ctx.moveTo(center - Math.sin(secAngle) * 15, center + Math.cos(secAngle) * 15);
        ctx.lineTo(center + Math.sin(secAngle) * (radius * 0.85), center - Math.cos(secAngle) * (radius * 0.85));
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ef4444';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Центральная ось секундной стрелки
        ctx.beginPath();
        ctx.arc(center, center, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [timezoneIana, size, showSeconds]);

  return (
    <div className="flex items-center justify-center p-2 min-w-0 max-w-full">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="max-w-full drop-shadow-md"
      />
    </div>
  );
}
