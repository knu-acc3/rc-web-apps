"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { applySymbolic, fromSymbolic, notes, parseOctal, SETGID, SETUID, STICKY, toChmodSymbolic, toOctal, toSymbolic, umask, type Who } from "./chmod";
import { NOTE_TEXT } from "./chmod-text";

const T = {
  ru: {
    mode: "Права (755 или rwxr-xr-x)",
    bad: "Введите 3–4 восьмеричные цифры или 9 символов rwx",
    who: { u: "Владелец", g: "Группа", o: "Остальные" },
    perm: { r: "Чтение", w: "Запись", x: "Запуск" },
    special: { suid: "SUID", sgid: "SGID", sticky: "Sticky" },
    specialTitle: { suid: "setuid — запуск от имени владельца", sgid: "setgid — запуск от группы / наследование группы в каталоге", sticky: "sticky — удалять файлы в каталоге может только их владелец" },
    commands: "Команды",
    apply: "Применить к текущим правам",
    applyPh: "u+x, g-w, a=r, o=u",
    applyBad: "Не удалось разобрать выражение",
    umask: "umask",
    umaskRes: (f: string, d: string) => `новые файлы ${f}, каталоги ${d}`,
    file: "файл",
    dir: "каталог",
  },
  en: {
    mode: "Mode (755 or rwxr-xr-x)",
    bad: "Enter 3–4 octal digits or 9 rwx characters",
    who: { u: "Owner", g: "Group", o: "Others" },
    perm: { r: "Read", w: "Write", x: "Execute" },
    special: { suid: "SUID", sgid: "SGID", sticky: "Sticky" },
    specialTitle: { suid: "setuid — runs as the file owner", sgid: "setgid — runs as the group / new files inherit the directory group", sticky: "sticky — only owners can delete files in the directory" },
    commands: "Commands",
    apply: "Apply to the current mode",
    applyPh: "u+x, g-w, a=r, o=u",
    applyBad: "Couldn't parse the expression",
    umask: "umask",
    umaskRes: (f: string, d: string) => `new files ${f}, directories ${d}`,
    file: "file",
    dir: "directory",
  },
} as const;

const WHO: Who[] = ["u", "g", "o"];
const SH: Record<Who, number> = { u: 6, g: 3, o: 0 };

export default function ChmodTool({ locale, mode: mode0 = "755" }: { locale: Locale; mode?: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(mode0);
  const [mode, setMode] = useState(parseOctal(mode0) ?? 0o755);
  const [expr, setExpr] = useState("");
  const [mask, setMask] = useState("022");

  const parsed = parseOctal(text) ?? fromSymbolic(text);
  const invalid = text.trim() !== "" && parsed === null;

  const update = (m: number) => {
    setMode(m);
    setText(toOctal(m));
  };
  const onText = (v: string) => {
    setText(v);
    const p = parseOctal(v) ?? fromSymbolic(v);
    if (p !== null) setMode(p);
  };

  let applied: number | null = null;
  let applyErr = false;
  if (expr.trim()) {
    try {
      applied = applySymbolic(mode, expr, false);
    } catch {
      applyErr = true;
    }
  }
  const um = parseOctal(mask);
  const octal = toOctal(mode);
  const sym = toSymbolic(mode);
  const cmd1 = `chmod ${octal} file`;
  const cmd2 = `chmod ${toChmodSymbolic(mode)} file`;
  const ns = notes(mode);

  return (
    <Panel className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Field label={t.mode} htmlFor={`${id}-m`} error={invalid ? t.bad : undefined} className="sm:w-64">
          <Input id={`${id}-m`} size="lg" value={text} onChange={(e) => onText(e.target.value)} className="font-mono text-2xl!" inputMode="text" autoComplete="off" spellCheck={false} aria-invalid={invalid} />
        </Field>
        <output className="font-mono text-3xl font-semibold tracking-wider text-fg sm:pb-1" aria-live="polite">
          {sym}
        </output>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-fg-3">
              <th className="py-1.5 pr-2 text-left font-medium" scope="col" />
              {(["r", "w", "x"] as const).map((p) => (
                <th key={p} className="px-2 py-1.5 text-center font-medium" scope="col">
                  {t.perm[p]}
                </th>
              ))}
              <th className="hidden px-2 py-1.5 text-center font-medium tabular sm:table-cell" scope="col">
                octal
              </th>
            </tr>
          </thead>
          <tbody>
            {WHO.map((w) => (
              <tr key={w} className="border-t border-line">
                <th scope="row" className="py-2 pr-2 text-left font-medium text-fg">
                  {t.who[w]}
                </th>
                {([4, 2, 1] as const).map((b, i) => {
                  const bit = b << SH[w];
                  return (
                    <td key={b} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        className="size-[1.125rem] cursor-pointer accent-[var(--accent)]"
                        aria-label={`${t.who[w]}: ${t.perm[(["r", "w", "x"] as const)[i]]}`}
                        checked={!!(mode & bit)}
                        onChange={(e) => update(e.target.checked ? mode | bit : mode & ~bit)}
                      />
                    </td>
                  );
                })}
                <td className="hidden px-2 py-2 text-center font-mono text-fg-2 sm:table-cell">{(mode >> SH[w]) & 7}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-2">
        {([
          ["suid", SETUID],
          ["sgid", SETGID],
          ["sticky", STICKY],
        ] as const).map(([k, bit]) => (
          <label key={k} className="inline-flex cursor-pointer items-center gap-2" title={t.specialTitle[k]}>
            <input type="checkbox" className="size-4 cursor-pointer accent-[var(--accent)]" checked={!!(mode & bit)} onChange={(e) => update(e.target.checked ? mode | bit : mode & ~bit)} />
            {t.special[k]}
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2 rounded-[0.625rem] bg-surface-2 p-3">
        {[cmd1, cmd2].map((c) => (
          <div key={c} className="flex items-center justify-between gap-2">
            <code className="min-w-0 font-mono text-[0.9375rem] break-all text-fg">{c}</code>
            <CopyButton value={c} size="icon-sm" variant="ghost" />
          </div>
        ))}
      </div>

      {ns.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {ns.map((n) => (
            <Notice key={n.code} tone={n.level === "danger" ? "err" : n.level === "warn" ? "warn" : "neutral"}>
              {NOTE_TEXT[n.code][locale]}
            </Notice>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-2">
        <Field label={t.apply} htmlFor={`${id}-e`} error={applyErr ? t.applyBad : undefined} hint={applied !== null ? `${octal} → ${toOctal(applied)} (${toSymbolic(applied)})` : undefined}>
          <div className="flex gap-2">
            <Input id={`${id}-e`} size="sm" value={expr} onChange={(e) => setExpr(e.target.value)} placeholder={t.applyPh} className="font-mono" spellCheck={false} autoComplete="off" />
            <button type="button" className="shrink-0 rounded-[0.5rem] border border-line px-3 text-fg-2 hover:bg-surface-2 disabled:opacity-50" disabled={applied === null}
              onClick={() => {
                if (applied === null) return;
                update(applied);
                setExpr("");
              }}
            >
              OK
            </button>
          </div>
        </Field>
        <Field label={t.umask} htmlFor={`${id}-u`} hint={um !== null ? t.umaskRes(`${toOctal(umask(um).file)} (${toSymbolic(umask(um).file)})`, `${toOctal(umask(um).dir)} (${toSymbolic(umask(um).dir)})`) : undefined}>
          <Input id={`${id}-u`} size="sm" value={mask} onChange={(e) => setMask(e.target.value)} className="w-28 font-mono" inputMode="numeric" />
        </Field>
      </div>
    </Panel>
  );
}
