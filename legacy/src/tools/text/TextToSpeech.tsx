'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pause,
  Play,
  Stop,
  WarningCircle,
} from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';

type PlaybackState = 'idle' | 'playing' | 'paused';

interface Sentence {
  text: string;
}

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'jr', 'sr', 'vs', 'etc', 'inc', 'no',
  'г', 'ул', 'др', 'т', 'тыс', 'млн', 'млрд',
]);

function splitSentences(input: string): Sentence[] {
  if (!input.trim()) return [];
  const sentences: Sentence[] = [];
  let start = 0;
  let index = 0;
  while (index < input.length) {
    const character = input[index];
    if (character === '.' || character === '!' || character === '?' || character === '…') {
      let end = index + 1;
      while (end < input.length && /[.!?…]/.test(input[end])) end += 1;
      const followedBySpace = end >= input.length || /\s/.test(input[end]);
      let wordStart = index - 1;
      while (wordStart >= start && /[\p{L}\p{N}]/u.test(input[wordStart])) wordStart -= 1;
      const previousWord = input.slice(wordStart + 1, index).toLocaleLowerCase();
      if (followedBySpace && !(character === '.' && ABBREVIATIONS.has(previousWord))) {
        const sentence = input.slice(start, end).trim();
        if (sentence) sentences.push({ text: sentence });
        while (end < input.length && /\s/.test(input[end])) end += 1;
        start = end;
        index = end;
        continue;
      }
    }
    index += 1;
  }
  const remainder = input.slice(start).trim();
  if (remainder) sentences.push({ text: remainder });
  return sentences;
}

function voiceKey(voice: SpeechSynthesisVoice): string {
  return `${voice.voiceURI}|${voice.name}|${voice.lang}`;
}

export default function TextToSpeech() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [supported, setSupported] = useState<boolean | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [text, setText] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [playback, setPlayback] = useState<PlaybackState>('idle');
  const [sentenceIndex, setSentenceIndex] = useState(-1);
  const [error, setError] = useState('');

  const sentences = useMemo(() => splitSentences(text), [text]);
  const sentencesRef = useRef(sentences);
  const voicesRef = useRef(voices);
  const selectedVoiceRef = useRef(selectedVoice);
  const rateRef = useRef(rate);
  const pitchRef = useRef(pitch);
  const volumeRef = useRef(volume);
  const intentionalCancelRef = useRef(false);
  const speakAtRef = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    sentencesRef.current = sentences;
    voicesRef.current = voices;
    selectedVoiceRef.current = selectedVoice;
    rateRef.current = rate;
    pitchRef.current = pitch;
    volumeRef.current = volume;
  }, [pitch, rate, selectedVoice, sentences, voices, volume]);

  useEffect(() => {
    const supportTimer = window.setTimeout(() => {
      setSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    }, 0);
    return () => window.clearTimeout(supportTimer);
  }, []);

  useEffect(() => {
    if (!supported) return;
    const synthesis = window.speechSynthesis;
    const loadVoices = () => {
      const available = synthesis.getVoices();
      setVoices(available);
      setSelectedVoice((current) => {
        if (current || available.length === 0) return current;
        const languagePrefix = isEn ? 'en' : 'ru';
        const preferred = available.find((voice) => voice.lang.toLocaleLowerCase().startsWith(languagePrefix))
          ?? available.find((voice) => voice.default)
          ?? available[0];
        return preferred ? voiceKey(preferred) : '';
      });
    };
    const voiceTimer = window.setTimeout(loadVoices, 0);
    synthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.clearTimeout(voiceTimer);
      synthesis.removeEventListener('voiceschanged', loadVoices);
      intentionalCancelRef.current = true;
      synthesis.cancel();
    };
  }, [isEn, supported]);

  const finish = useCallback(() => {
    setPlayback('idle');
    setSentenceIndex(-1);
  }, []);

  const speakAt = useCallback((index: number) => {
    const list = sentencesRef.current;
    if (index < 0 || index >= list.length) {
      finish();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(list[index].text);
    const voice = voicesRef.current.find((item) => voiceKey(item) === selectedVoiceRef.current);
    if (voice) utterance.voice = voice;
    utterance.rate = rateRef.current;
    utterance.pitch = pitchRef.current;
    utterance.volume = volumeRef.current;
    utterance.onend = () => {
      if (intentionalCancelRef.current) return;
      const next = index + 1;
      if (next < sentencesRef.current.length) {
        setSentenceIndex(next);
        speakAtRef.current(next);
      } else {
        finish();
      }
    };
    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      setError(isEn ? `Speech error: ${event.error}` : `Ошибка синтеза речи: ${event.error}`);
      finish();
    };

    setSentenceIndex(index);
    setPlayback('playing');
    window.speechSynthesis.speak(utterance);
  }, [finish, isEn]);

  useEffect(() => {
    speakAtRef.current = speakAt;
  }, [speakAt]);

  const startOrResume = useCallback(() => {
    if (!supported || sentencesRef.current.length === 0) return;
    setError('');
    if (playback === 'paused') {
      window.speechSynthesis.resume();
      setPlayback('playing');
      return;
    }
    intentionalCancelRef.current = true;
    window.speechSynthesis.cancel();
    intentionalCancelRef.current = false;
    speakAtRef.current(0);
  }, [playback, supported]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setPlayback('paused');
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    intentionalCancelRef.current = true;
    window.speechSynthesis.cancel();
    intentionalCancelRef.current = false;
    finish();
  }, [finish, supported]);

  if (supported === null) {
    return (
      <Card role="status" className="mx-auto max-w-3xl p-5 text-center text-sm text-[var(--color-text-muted)]">
        {isEn ? 'Checking speech support…' : 'Проверяем поддержку синтеза речи…'}
      </Card>
    );
  }

  if (!supported) {
    return (
      <Card className="mx-auto max-w-3xl p-5 text-center sm:p-6">
        <WarningCircle size={34} className="mx-auto text-[var(--color-danger)]" weight="fill" />
        <h2 className="mt-3 font-semibold">{isEn ? 'Speech synthesis is unavailable' : 'Синтез речи недоступен'}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {isEn
            ? 'This browser does not expose the Web Speech API. No audio is sent to or generated by this site.'
            : 'Этот браузер не предоставляет Web Speech API. Сайт не отправляет и не генерирует аудио самостоятельно.'}
        </p>
      </Card>
    );
  }

  const activeSentence = sentenceIndex >= 0 ? sentences[sentenceIndex]?.text : '';
  const progress = sentenceIndex >= 0 && sentences.length > 0 ? (sentenceIndex + 1) / sentences.length * 100 : 0;
  const controlsLocked = playback !== 'idle';

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <Label htmlFor="speech-text">{isEn ? 'Text to speak' : 'Текст для озвучивания'}</Label>
        <Textarea
          id="speech-text"
          className="mt-1.5 min-h-44 text-base leading-relaxed"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError('');
          }}
          placeholder={isEn ? 'Type or paste text' : 'Введите или вставьте текст'}
          disabled={controlsLocked}
          maxLength={50000}
          autoFocus
        />

        <div className="mt-4">
          <Label htmlFor="speech-voice">{isEn ? 'Voice' : 'Голос'}</Label>
          <select
            id="speech-voice"
            className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base"
            value={selectedVoice}
            onChange={(event) => setSelectedVoice(event.target.value)}
            disabled={controlsLocked}
          >
            <option value="">{isEn ? 'System default' : 'Системный голос'}</option>
            {voices.map((voice) => (
              <option key={voiceKey(voice)} value={voiceKey(voice)}>{voice.name} · {voice.lang}{voice.default ? (isEn ? ' · default' : ' · по умолчанию') : ''}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {voices.length > 0
              ? isEn ? `${voices.length} voices supplied by this device` : `Голосов на этом устройстве: ${voices.length}`
              : isEn ? 'The browser will use its default voice.' : 'Браузер использует системный голос по умолчанию.'}
          </p>
        </div>

        {error ? <div role="alert" className="mt-3 text-sm text-[var(--color-danger)]">{error}</div> : null}

        <div className="mt-4 grid grid-cols-[1fr_52px] gap-2">
          {playback === 'playing' ? (
            <Button size="lg" data-primary-action="speech-playback" data-primary-state="pause" className="min-h-12" onClick={pause}>
              <Pause size={20} weight="fill" /> {isEn ? 'Pause' : 'Пауза'}
            </Button>
          ) : (
            <Button size="lg" data-primary-action="speech-playback" data-primary-state="play" className="min-h-12" onClick={startOrResume} disabled={!text.trim() || sentences.length === 0}>
              <Play size={20} weight="fill" /> {playback === 'paused' ? (isEn ? 'Resume' : 'Продолжить') : (isEn ? 'Speak' : 'Озвучить')}
            </Button>
          )}
          <Button variant="outline" size="icon" className="min-h-12 min-w-12" onClick={stop} disabled={playback === 'idle'} aria-label={isEn ? 'Stop' : 'Остановить'}>
            <Stop size={20} weight="fill" />
          </Button>
        </div>
      </Card>

      {playback !== 'idle' && activeSentence ? (
        <Card role="status" className="border-[var(--color-primary)]/25 p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
            <span>{isEn ? 'Now speaking' : 'Сейчас звучит'}</span>
            <span>{sentenceIndex + 1}/{sentences.length}</span>
          </div>
          <p className="text-base font-medium leading-relaxed">{activeSentence}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
            <div className="h-full bg-[var(--color-primary)] transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </Card>
      ) : null}

      <AdvancedSettings
        title={isEn ? 'Voice controls and API limits' : 'Параметры голоса и ограничения API'}
        description={isEn ? 'Speed, pitch, volume and browser behavior' : 'Скорость, тон, громкость и особенности браузера'}
      >
        <div className="space-y-4">
          <label className="block text-sm">
            <span>{isEn ? 'Speed' : 'Скорость'}: {rate.toFixed(2)}×</span>
            <input className="mt-1 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={0.5} max={2} step={0.05} value={rate} disabled={controlsLocked} onChange={(event) => setRate(Number(event.target.value))} />
          </label>
          <label className="block text-sm">
            <span>{isEn ? 'Pitch' : 'Тон'}: {pitch.toFixed(1)}</span>
            <input className="mt-1 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={0} max={2} step={0.1} value={pitch} disabled={controlsLocked} onChange={(event) => setPitch(Number(event.target.value))} />
          </label>
          <label className="block text-sm">
            <span>{isEn ? 'Volume' : 'Громкость'}: {Math.round(volume * 100)}%</span>
            <input className="mt-1 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={0} max={1} step={0.05} value={volume} disabled={controlsLocked} onChange={(event) => setVolume(Number(event.target.value))} />
          </label>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-muted)]">
            {isEn
              ? 'Voices and pause behavior come from your browser and operating system. The Web Speech API does not provide audio bytes, so this tool cannot honestly offer MP3 or WAV downloads.'
              : 'Голоса и работа паузы зависят от браузера и операционной системы. Web Speech API не предоставляет аудиоданные, поэтому инструмент не предлагает фиктивное скачивание MP3 или WAV.'}
          </div>
        </div>
      </AdvancedSettings>
    </div>
  );
}
