"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Field, Input } from "@/ui/field";
import type { StrengthResult } from "./strength-core";
import { humanDuration } from "./time";

const T = {
  ru: {
    label: "Пароль для проверки",
    show: "Показать пароль",
    hide: "Скрыть пароль",
    empty: "Введите пароль — оценка появится сразу",
    loading: "Загружаем словари…",
    scores: ["Очень слабый", "Слабый", "Средний", "Надёжный", "Очень надёжный"],
    guesses: (n: string) => `≈ 10^${n} попыток на подбор`,
    crack: "Сколько займёт подбор",
    rows: {
      onlineThrottled: "Онлайн, с ограничением попыток (100 в час)",
      online: "Онлайн без ограничений (10 в секунду)",
      offlineSlow: "Утечка базы, медленный хеш (10 тыс./с)",
      offlineFast: "Утечка базы, быстрый хеш на GPU (10 млрд/с)",
    },
    tips: "Как улучшить",
    local: "Проверка идёт в вашем браузере библиотекой zxcvbn-ts по словарям популярных паролей, слов и имён. Пароль никуда не отправляется и не сохраняется.",
  },
  en: {
    label: "Password to check",
    show: "Show password",
    hide: "Hide password",
    empty: "Type a password to see the rating instantly",
    loading: "Loading dictionaries…",
    scores: ["Very weak", "Weak", "Fair", "Strong", "Very strong"],
    guesses: (n: string) => `≈ 10^${n} guesses to crack`,
    crack: "Time to crack",
    rows: {
      onlineThrottled: "Online, rate-limited (100 per hour)",
      online: "Online, no limit (10 per second)",
      offlineSlow: "Leaked database, slow hash (10k/s)",
      offlineFast: "Leaked database, fast hash on GPUs (10 billion/s)",
    },
    tips: "How to improve",
    local: "Checked in your browser by zxcvbn-ts against lists of popular passwords, words and names. The password is never sent or stored.",
  },
} as const;

const TONE = ["bg-err", "bg-err", "bg-warn", "bg-ok", "bg-ok"];
const TEXT = ["text-err", "text-err", "text-warn", "text-ok", "text-ok"];

export default function StrengthChecker({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [res, setRes] = useState<{ for: string; r: StrengthResult } | null>(null);
  const worker = useRef<Worker | null>(null);
  const seq = useRef(0);
  const pending = useRef("");

  useEffect(() => {
    return () => {
      worker.current?.terminate();
      worker.current = null;
    };
  }, []);

  // Debounced check in a Web Worker (zxcvbn dictionaries are large and matching can be slow on long input).
  useEffect(() => {
    if (!pw) return;
    const timer = setTimeout(() => {
      if (!worker.current) {
        worker.current = new Worker(new URL("./strength.worker.ts", import.meta.url), { type: "module" });
        worker.current.onmessage = (e: MessageEvent<{ id: number; result: StrengthResult; pw: string }>) => {
          if (e.data.id === seq.current) setRes({ for: pending.current, r: e.data.result });
        };
      }
      seq.current++;
      pending.current = pw;
      worker.current.postMessage({ id: seq.current, password: pw, locale });
    }, 120);
    return () => clearTimeout(timer);
  }, [pw, locale]);

  const r = pw && res?.for === pw ? res.r : null;

  return (
    <div className="flex flex-col gap-4">
      <Field label={t.label} htmlFor={`${id}-pw`}>
        <div className="flex gap-2">
          <Input
            id={`${id}-pw`}
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            size="lg"
            className="font-mono"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button variant="outline" size="icon" className="size-12!" onClick={() => setShow((s) => !s)} aria-label={show ? t.hide : t.show} aria-pressed={show}>
            {show ? <EyeOff /> : <Eye />}
          </Button>
        </div>
      </Field>

      <div className="rounded-[12px] bg-surface-2 px-4 py-4 sm:px-5">
        {!pw ? (
          <p className="text-fg-2">{t.empty}</p>
        ) : !r ? (
          <p className="text-fg-2">{t.loading}</p>
        ) : (
          <>
            <div aria-live="polite" className={cn("text-2xl font-semibold sm:text-3xl", TEXT[r.score])}>
              {t.scores[r.score]}
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className={cn("h-1.5 rounded-full", i <= r.score ? TONE[r.score] : "bg-line")} />
              ))}
            </div>
            <p className="mt-2 text-sm text-fg-2">{t.guesses(formatNumber(locale, Math.round(r.guessesLog10 * 10) / 10))}</p>
            {(r.warning || r.suggestions.length > 0) && (
              <div className="mt-3 text-[15px] text-fg-2">
                {r.warning && <p className="font-medium text-fg">{r.warning}</p>}
                {r.suggestions.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 marker:text-fg-3">
                    {r.suggestions.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {r && (
        <section className="rounded-[12px] border border-line">
          <h2 className="border-b border-line px-4 py-2.5 text-sm font-semibold text-fg-2">{t.crack}</h2>
          <dl className="divide-y divide-line">
            {(Object.keys(t.rows) as (keyof StrengthResult["seconds"])[]).map((k) => (
              <div key={k} className="flex flex-wrap items-baseline justify-between gap-x-4 px-4 py-2 text-sm">
                <dt className="text-fg-2">{t.rows[k]}</dt>
                <dd className="font-medium text-fg">{humanDuration(r.seconds[k], locale)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <p className="text-sm text-fg-3">{t.local}</p>
    </div>
  );
}
