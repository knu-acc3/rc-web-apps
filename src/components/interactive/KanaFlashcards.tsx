'use client';

import React, { useState } from 'react';

interface KanaChar {
  readonly kana: string;
  readonly romaji: string;
  readonly type: 'hiragana' | 'katakana';
}

const BASIC_KANA: KanaChar[] = [
  { kana: 'あ', romaji: 'a', type: 'hiragana' },
  { kana: 'い', romaji: 'i', type: 'hiragana' },
  { kana: 'う', romaji: 'u', type: 'hiragana' },
  { kana: 'え', romaji: 'e', type: 'hiragana' },
  { kana: 'お', romaji: 'o', type: 'hiragana' },
  { kana: 'か', romaji: 'ka', type: 'hiragana' },
  { kana: 'き', romaji: 'ki', type: 'hiragana' },
  { kana: 'く', romaji: 'ku', type: 'hiragana' },
  { kana: 'け', romaji: 'ke', type: 'hiragana' },
  { kana: 'こ', romaji: 'ko', type: 'hiragana' },
  { kana: 'さ', romaji: 'sa', type: 'hiragana' },
  { kana: 'し', romaji: 'shi', type: 'hiragana' },
  { kana: 'す', romaji: 'su', type: 'hiragana' },
  { kana: 'せ', romaji: 'se', type: 'hiragana' },
  { kana: 'そ', romaji: 'so', type: 'hiragana' },
  { kana: 'ア', romaji: 'a', type: 'katakana' },
  { kana: 'イ', romaji: 'i', type: 'katakana' },
  { kana: 'ウ', romaji: 'u', type: 'katakana' },
  { kana: 'エ', romaji: 'e', type: 'katakana' },
  { kana: 'オ', romaji: 'o', type: 'katakana' },
  { kana: 'カ', romaji: 'ka', type: 'katakana' },
  { kana: 'キ', romaji: 'ki', type: 'katakana' },
  { kana: 'ク', romaji: 'ku', type: 'katakana' },
  { kana: 'ケ', romaji: 'ke', type: 'katakana' },
  { kana: 'コ', romaji: 'ko', type: 'katakana' },
  { kana: 'サ', romaji: 'sa', type: 'katakana' },
  { kana: 'シ', romaji: 'shi', type: 'katakana' },
  { kana: 'ス', romaji: 'su', type: 'katakana' },
  { kana: 'セ', romaji: 'se', type: 'katakana' },
  { kana: 'ソ', romaji: 'so', type: 'katakana' },
];

export function KanaFlashcards() {
  const [kanaType, setKanaType] = useState<'hiragana' | 'katakana'>('hiragana');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const filtered = BASIC_KANA.filter((k) => k.type === kanaType);
  const current = filtered[currentIndex % filtered.length];

  const handleNext = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % filtered.length);
  };

  const handlePrev = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto p-4 sm:p-6 border rounded-2xl bg-card">
      <div className="text-center">
        <h3 className="text-2xl font-bold">Тренажер японской каны</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Интерактивные карточки для запоминания хираганы и катаканы
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setKanaType('hiragana');
            setCurrentIndex(0);
            setShowAnswer(false);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold ${
            kanaType === 'hiragana' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          Хирагана (ひらがな)
        </button>
        <button
          onClick={() => {
            setKanaType('katakana');
            setCurrentIndex(0);
            setShowAnswer(false);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold ${
            kanaType === 'katakana' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          Катакана (カタカナ)
        </button>
      </div>

      {/* Flashcard */}
      <div
        onClick={() => setShowAnswer(!showAnswer)}
        className="w-48 h-56 border-2 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-secondary/30 hover:border-primary transition-all shadow select-none"
      >
        <div className="text-6xl font-bold">{current.kana}</div>
        <div className="mt-4 text-sm font-mono text-muted-foreground">
          {showAnswer ? (
            <span className="text-primary font-bold text-lg">{current.romaji}</span>
          ) : (
            'Нажмите, чтобы увидеть чтение'
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 w-full">
        <button
          onClick={handlePrev}
          className="flex-1 min-h-[44px] border rounded-xl hover:bg-secondary font-semibold"
        >
          ← Назад
        </button>
        <button
          onClick={handleNext}
          className="flex-1 min-h-[44px] bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90"
        >
          Вперед →
        </button>
      </div>
    </div>
  );
}
