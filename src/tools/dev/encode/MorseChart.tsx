"use client";

import type { Locale } from "@/i18n/config";
import { CYRILLIC_MORSE, DIGIT_MORSE, KAZAKH_SUBST, LATIN_MORSE, PROSIGNS, PUNCT_MORSE } from "./lib/morse";
import { useMorsePlayer } from "./lib/useMorsePlayer";

const T = {
  ru: { latin: "Латинский алфавит", cyr: "Русский алфавит", digits: "Цифры", punct: "Знаки препинания", pro: "Служебные сигналы (просигналы)", kz: "Казахские буквы (коды ближайших русских)", hint: "Нажмите на знак, чтобы услышать его" },
  en: { latin: "Latin alphabet", cyr: "Russian alphabet", digits: "Digits", punct: "Punctuation", pro: "Prosigns", kz: "Kazakh letters (codes of the closest Russian letters)", hint: "Click a character to hear it" },
} as const;

const pretty = (c: string) => c.replace(/\./g, "·").replace(/-/g, "−");

export default function MorseChart({ locale }: { locale: Locale }) {
  const t = T[locale];
  const player = useMorsePlayer();
  const groups: [string, [string, string][]][] = [
    [t.latin, Object.entries(LATIN_MORSE)],
    [t.cyr, [...Object.entries(CYRILLIC_MORSE).slice(0, 6), ["Ё", CYRILLIC_MORSE["Е"]], ...Object.entries(CYRILLIC_MORSE).slice(6)]],
    [t.digits, Object.entries(DIGIT_MORSE)],
    [t.punct, Object.entries(PUNCT_MORSE)],
    [t.pro, Object.entries(PROSIGNS).map(([k, v]) => [`<${k}>`, v])],
    [t.kz, Object.entries(KAZAKH_SUBST).map(([k, v]) => [`${k} (${v})`, CYRILLIC_MORSE[v]])],
  ];
  const ordered = locale === "ru" ? [groups[1], groups[0], ...groups.slice(2)] : groups;
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-fg-3">{t.hint}</p>
      {ordered.map(([title, rows]) => (
        <section key={title}>
          <h2 className="mb-2 text-base font-semibold text-fg">{title}</h2>
          <ul className="panel grid grid-cols-[repeat(auto-fill,minmax(min(100%,8.5rem),1fr))] gap-2 p-3 sm:p-4">
            {rows.map(([ch, code]) => (
              <li key={ch} className="min-w-0">
                <button
                  type="button"
                  className="flex min-h-12 w-full items-baseline justify-between gap-3 rounded-[0.875rem] bg-surface-2 px-3.5 py-2.5 text-left transition-[background-color,color,transform] duration-150 hover:bg-accent-container hover:text-on-accent-container active:bg-accent-container motion-safe:active:scale-[0.97]"
                  onClick={() => player.play(code, { wpm: 15, freq: 600 })}
                >
                  <span className="min-w-0 text-lg font-semibold break-words">{ch}</span>
                  <span className="shrink-0 font-mono text-base font-bold tracking-wider opacity-75">{pretty(code)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
