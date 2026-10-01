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
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[0.75rem] border border-line bg-line sm:grid-cols-4 lg:grid-cols-6">
            {rows.map(([ch, code]) => (
              <li key={ch} className="bg-surface">
                <button type="button" className="flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left hover:bg-surface-2" onClick={() => player.play(code, { wpm: 15, freq: 600 })}>
                  <span className="font-semibold text-fg">{ch}</span>
                  <span className="font-mono text-[0.9375rem] tracking-wider text-fg-2">{pretty(code)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
