"use client";

import { ChevronDown } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { baseName } from "../data/base-names";
import { DIGITS, divisionSteps, expansionTerms } from "../lib/bases";

const T = {
  ru: {
    title: "Решение по шагам",
    toDec: (b: number) => `Переводим в десятичную: каждая цифра умножается на ${b} в степени её позиции (справа налево, начиная с 0).`,
    fromDec: (b: number) => `Переводим из десятичной: делим на ${b} с остатком, пока частное не станет нулём.`,
    read: "Остатки, прочитанные снизу вверх, дают ответ:",
    dividend: "Делимое",
    quotient: "Частное",
    remainder: "Остаток",
    groupTo: (n: number, b: number) => `Разбиваем двоичное число на группы по ${n} бита справа налево и заменяем каждую группу цифрой ${b === 16 ? "шестнадцатеричной" : "восьмеричной"} системы.`,
    groupFrom: (n: number, b: number) => `Заменяем каждую ${b === 16 ? "шестнадцатеричную" : "восьмеричную"} цифру группой из ${n} бит.`,
    tooLong: "Число слишком длинное, чтобы показывать шаги.",
  },
  en: {
    title: "Step-by-step solution",
    toDec: (b: number) => `To decimal: multiply each digit by ${b} raised to its position (from the right, starting at 0).`,
    fromDec: (b: number) => `From decimal: divide by ${b} with remainder until the quotient is zero.`,
    read: "Reading the remainders from bottom to top gives the answer:",
    dividend: "Dividend",
    quotient: "Quotient",
    remainder: "Remainder",
    groupTo: (n: number, b: number) => `Split the binary number into groups of ${n} bits from the right and replace each group with one ${b === 16 ? "hex" : "octal"} digit.`,
    groupFrom: (n: number, b: number) => `Replace each ${b === 16 ? "hex" : "octal"} digit with a group of ${n} bits.`,
    tooLong: "The number is too long to show the steps.",
  },
} as const;

const bitsPer = (b: number) => (b === 16 ? 4 : b === 8 ? 3 : 0);

export function BaseSteps({ locale, value, from, to, upper }: { locale: Locale; value: bigint; from: number; to: number; upper: boolean }) {
  const t = T[locale];
  if (from === to || value === 0n) return null;
  const cs = (s: string) => (upper ? s.toUpperCase() : s);
  const src = value.toString(from);
  const target = cs(value.toString(to));
  const nf = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US");
  const tooLong = src.length > 40 || value > 2n ** 128n;

  let body: React.ReactNode;
  if (tooLong) body = <p className="text-fg-3">{t.tooLong}</p>;
  else if (from === 2 && bitsPer(to)) {
    const n = bitsPer(to);
    const padded = src.padStart(Math.ceil(src.length / n) * n, "0");
    const groups = padded.match(new RegExp(`.{${n}}`, "g")) ?? [];
    body = (
      <>
        <p>{t.groupTo(n, to)}</p>
        <div className="mt-3 flex flex-wrap gap-2 font-mono">
          {groups.map((g, i) => (
            <span key={i} className="flex flex-col items-center rounded-[0.5rem] bg-surface-2 px-2 py-1">
              <span className="text-fg-2">{g}</span>
              <span className="text-lg font-semibold text-fg">{cs(DIGITS[parseInt(g, 2)])}</span>
            </span>
          ))}
        </div>
      </>
    );
  } else if (to === 2 && bitsPer(from)) {
    const n = bitsPer(from);
    body = (
      <>
        <p>{t.groupFrom(n, from)}</p>
        <div className="mt-3 flex flex-wrap gap-2 font-mono">
          {src.split("").map((d, i) => (
            <span key={i} className="flex flex-col items-center rounded-[0.5rem] bg-surface-2 px-2 py-1">
              <span className="text-lg font-semibold text-fg">{cs(d)}</span>
              <span className="text-fg-2">{parseInt(d, from).toString(2).padStart(n, "0")}</span>
            </span>
          ))}
        </div>
      </>
    );
  } else {
    const terms = from !== 10 ? expansionTerms(src, from) : [];
    const steps = to !== 10 ? divisionSteps(value, to) : [];
    body = (
      <>
        {terms.length > 0 && (
          <div>
            <p>{t.toDec(from)}</p>
            <p className="mt-2 font-mono text-[0.9375rem] leading-relaxed break-words text-fg">
              {terms.map((x, i) => (
                <span key={i}>
                  {i > 0 && " + "}
                  {x.digit}×{from}
                  <sup>{x.power}</sup>
                </span>
              ))}{" "}
              = <strong>{nf.format(value)}</strong>
            </p>
          </div>
        )}
        {steps.length > 0 && (
          <div className={terms.length ? "mt-4" : undefined}>
            <p>{t.fromDec(to)}</p>
            <div tabIndex={0} className="tbl mt-2">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t.dividend}</th>
                    <th scope="col">{t.quotient}</th>
                    <th scope="col">{t.remainder}</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((s, i) => (
                    <tr key={i}>
                      <td className="font-mono">
                        {s.n.toString()} ÷ {to}
                      </td>
                      <td className="font-mono">{s.q.toString()}</td>
                      <td className="font-mono">
                        {s.r}
                        {to > 10 && s.r > 9 ? ` = ${cs(DIGITS[s.r])}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2">
              {t.read} <strong className="font-mono">{target}</strong>
              <sub>{to}</sub>
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <details className="group rounded-[0.75rem] border border-line bg-surface">
      <summary className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-fg">
        <span>
          {t.title}: {baseName(from, locale)} → {baseName(to, locale)}
        </span>
        <ChevronDown className="size-4 shrink-0 text-fg-3 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-line px-4 py-3 text-[0.9375rem] text-fg-2">{body}</div>
    </details>
  );
}
