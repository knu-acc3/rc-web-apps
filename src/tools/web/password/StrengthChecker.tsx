"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/button";
import { Field, Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import type { StrengthResult } from "./lib/strength-core";
import { humanDuration } from "./lib/time";

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
        worker.current = new Worker(new URL("./lib/strength.worker.ts", import.meta.url), { type: "module" });
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
    <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
      <Panel className="flex min-w-0 flex-col gap-3 p-4 sm:p-6">
        <Field label={t.label} htmlFor={`${id}-pw`}>
          <div className="flex items-center gap-2">
            <Input
              id={`${id}-pw`}
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              size="lg"
              className="min-w-0 flex-1 font-mono"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <IconButton variant="tonal" size="lg" onClick={() => setShow((s) => !s)} label={show ? t.hide : t.show} selected={show} icon={show ? <EyeOff aria-hidden /> : <Eye aria-hidden />} />
          </div>
        </Field>
        <p className="text-sm text-fg-3">{t.local}</p>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="min-w-0 rounded-[1.25rem] bg-accent-soft p-5 sm:p-6">
          {!pw ? (
            <p className="text-fg-2">{t.empty}</p>
          ) : !r ? (
            <p className="text-fg-2">{t.loading}</p>
          ) : (
            <div className="motion-safe:animate-[menu-in_200ms_ease-out]">
              <div aria-live="polite" className={cn("text-3xl font-bold tracking-tight sm:text-4xl", TEXT[r.score])}>
                {t.scores[r.score]}
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1.5" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn("h-2 rounded-full transition-colors duration-300", i <= r.score ? TONE[r.score] : "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]")} />
                ))}
              </div>
              <p className="mt-2 text-sm text-fg-2">{t.guesses(formatNumber(locale, Math.round(r.guessesLog10 * 10) / 10))}</p>
              {(r.warning || r.suggestions.length > 0) && (
                <div className="mt-4 text-[0.9375rem] text-fg-2">
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
            </div>
          )}
        </div>

        {r && (
          <Panel className="p-4 sm:p-5">
            <h2 className="mb-2 text-sm font-semibold text-fg">{t.crack}</h2>
            <dl className="divide-y divide-line">
              {(Object.keys(t.rows) as (keyof StrengthResult["seconds"])[]).map((k) => (
                <div key={k} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 text-sm">
                  <dt className="min-w-0 text-fg-2">{t.rows[k]}</dt>
                  <dd className="font-semibold text-fg">{humanDuration(r.seconds[k], locale)}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        )}
      </div>
    </div>
  );
}
