"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { outputLabels } from "@/sections/code/kit/labels";
import { CodeOutput } from "@/ui/code-output";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { parseCurl, toAxios, toFetch, toPython } from "./curl";

type Target = "fetch" | "axios" | "python";

const T = {
  ru: {
    input: "Команда cURL",
    target: "Язык",
    error: { "not-curl": "Команда должна начинаться с curl", "no-url": "В команде нет адреса", quote: "Незакрытая кавычка" } as Record<string, string>,
    warn: { insecure: "Опция -k (--insecure) отключает проверку сертификата — в браузере так сделать нельзя; в Python добавлен verify=False.", "file-data": "Данные из файла (@file) нужно подставить вручную.", "cookie-file": "Cookie из файла (-b file) не переносятся.", unknown: "Пропущены неизвестные опции:" },
  },
  en: {
    input: "cURL command",
    target: "Language",
    error: { "not-curl": "The command must start with curl", "no-url": "The command has no URL", quote: "Unclosed quote" } as Record<string, string>,
    warn: { insecure: "-k (--insecure) disables certificate checks — browsers can't do that; Python gets verify=False.", "file-data": "Data read from a file (@file) must be filled in by hand.", "cookie-file": "Cookies from a file (-b file) aren't carried over.", unknown: "Skipped unknown options:" },
  },
} as const;

const SAMPLE = `curl 'https://api.example.com/v1/orders?limit=10' \\
  -X POST \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  --data-raw '{"city":"Алматы","items":[{"id":42,"qty":2}]}'`;

export default function CurlConverter({ locale, target: target0 = "fetch" }: { locale: Locale; target?: Target }) {
  const t = T[locale];
  const id = useId();
  const [cmd, setCmd] = useState(SAMPLE);
  const [target, setTarget] = useState<Target>(target0);
  const res = useMemo(() => {
    try {
      const r = parseCurl(cmd);
      return { r, code: target === "fetch" ? toFetch(r) : target === "axios" ? toAxios(r) : toPython(r) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [cmd, target]);

  const unknown = "r" in res && res.r ? res.r.warnings.filter((w) => w.startsWith("unknown:")).map((w) => w.slice(8)) : [];
  const other = "r" in res && res.r ? res.r.warnings.filter((w) => !w.startsWith("unknown:")) : [];

  return (
    <div className="flex flex-col gap-4">
      <CodeEditor id={`${id}-in`} locale={locale} label={t.input} value={cmd} onChange={setCmd} rows={7} sample={SAMPLE} invalid={"error" in res} />
      <Segmented
        label={t.target}
        value={target}
        onChange={setTarget}
        options={[
          { value: "fetch", label: "JavaScript fetch" },
          { value: "axios", label: "axios" },
          { value: "python", label: "Python requests" },
        ]}
      />
      {"error" in res ? (
        <Notice tone="err">{t.error[res.error ?? ""] ?? res.error}</Notice>
      ) : (
        <CodeOutput value={res.code} title={target === "python" ? "Python" : "JavaScript"} filename={target === "python" ? "request.py" : "request.js"} labels={outputLabels(locale)} minRows={12} />
      )}
      {"r" in res && res.r?.insecure && <Notice tone="warn">{t.warn.insecure}</Notice>}
      {other.map((w) => (
        <Notice key={w} tone="warn">
          {t.warn[w as keyof typeof t.warn]}
        </Notice>
      ))}
      {unknown.length > 0 && (
        <Notice tone="neutral">
          {t.warn.unknown} {unknown.join(", ")}
        </Notice>
      )}
    </div>
  );
}
