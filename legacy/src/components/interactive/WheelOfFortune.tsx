'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { playWheelTick, playSuccessChime } from '@/src/lib/audio/soundSynthesizer';

const DEFAULT_SEGMENTS = ['Вариант 1', 'Вариант 2', 'Вариант 3', 'Вариант 4', 'Вариант 5', 'Вариант 6'];
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export function WheelOfFortune() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [segments, setSegments] = useState<string[]>(DEFAULT_SEGMENTS);
  const [inputText, setInputText] = useState(DEFAULT_SEGMENTS.join('\n'));
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTickIndexRef = useRef(-1);

  const size = 300;

  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = center - 10;
    const arc = (Math.PI * 2) / Math.max(1, segments.length);

    ctx.clearRect(0, 0, size, size);

    for (let i = 0; i < segments.length; i++) {
      const segAngle = angle + i * arc;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, segAngle, segAngle + arc);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Текст сектора
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(segAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(segments[i], radius - 20, 4);
      ctx.restore();
    }

    // Стрелка указателя
    ctx.beginPath();
    ctx.moveTo(center + radius + 8, center);
    ctx.lineTo(center + radius - 12, center - 10);
    ctx.lineTo(center + radius - 12, center + 10);
    ctx.closePath();
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
  }, [segments]);

  useEffect(() => {
    drawWheel(angleRef.current);
  }, [drawWheel]);

  const handleUpdateSegments = (text: string) => {
    setInputText(text);
    const parsed = text
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parsed.length >= 2) {
      setSegments(parsed);
    }
  };

  const spin = () => {
    if (isSpinning || segments.length === 0) return;
    setIsSpinning(true);
    setWinner(null);
    velocityRef.current = Math.random() * 0.25 + 0.35; // Случайная начальная скорость

    const animate = () => {
      velocityRef.current *= 0.985; // Инерционное трение
      angleRef.current += velocityRef.current;

      const arc = (Math.PI * 2) / segments.length;
      const currentTickIndex = Math.floor((angleRef.current % (Math.PI * 2)) / arc);
      if (currentTickIndex !== lastTickIndexRef.current) {
        lastTickIndexRef.current = currentTickIndex;
        playWheelTick();
      }

      drawWheel(angleRef.current);

      if (velocityRef.current > 0.001) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const normalizedAngle =
          (Math.PI * 2 - (angleRef.current % (Math.PI * 2))) % (Math.PI * 2);
        const winIdx = Math.floor(normalizedAngle / arc);
        setWinner(segments[winIdx] || segments[0]);
        playSuccessChime();
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto p-4 border rounded-2xl bg-card">
      <h3 className="text-xl font-bold">Колесо фортуны и выбора</h3>

      <div className="relative flex justify-center">
        <canvas ref={canvasRef} style={{ width: size, height: size }} className="max-w-full" />
      </div>

      {winner && (
        <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 font-bold text-lg">
          🎉 Выбор сделан: {winner}!
        </div>
      )}

      <button
        disabled={isSpinning}
        onClick={spin}
        className="w-full min-h-[48px] bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
      >
        {isSpinning ? 'Колесо вращается...' : 'Вращать колесо'}
      </button>

      <div className="w-full flex flex-col gap-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Список вариантов (по одному на строку):
        </label>
        <textarea
          rows={4}
          value={inputText}
          onChange={(e) => handleUpdateSegments(e.target.value)}
          className="w-full p-2 border rounded-xl bg-card text-xs font-mono"
        />
      </div>
    </div>
  );
}
