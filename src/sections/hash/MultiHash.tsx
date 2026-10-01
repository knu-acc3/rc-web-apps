"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { copyText } from "@/lib/clipboard";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { useLiveTask, useWorkerClient } from "@/sections/code/kit/hooks";
import { Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { ALGOS, type AlgoId } from "./lib/algorithms";
import { formatDigest, type OutFormat } from "./lib/digest";
import { decodeInput, INPUT_ENC_LABEL, type InputEncoding } from "./lib/input";

const T = {
  ru: { input: "Текст", placeholder: "Введите текст — хэши всех алгоритмов появятся ниже", inputEnc: "Ввод", out: "Формат", copyHint: "Нажмите на хэш, чтобы скопировать", copied: "скопировано", fmt: { hex: "hex", HEX: "HEX", base64: "Base64", base64url: "Base64url" } },
  en: { input: "Text", placeholder: "Type text — digests of every algorithm appear below", inputEnc: "Input", out: "Format", copyHint: "Click a hash to copy it", copied: "copied", fmt: { hex: "hex", HEX: "HEX", base64: "Base64", base64url: "Base64url" } },
} as const;

const ORDER: AlgoId[] = [...ALGOS.filter((a) => a.popular), ...ALGOS.filter((a) => !a.popular)].map((a) => a.id);

export default function MultiHash({ locale, sample = "" }: { locale: Locale; sample?: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(sample);
  const [enc, setEnc] = useState<InputEncoding>("utf8");
  const [fmt, setFmt] = useState<OutFormat>("hex");
  const [copied, setCopied] = useState<string | null>(null);
  const client = useWorkerClient(() => new Worker(new URL("./lib/hash.worker.ts", import.meta.url), { type: "module" }));
  const data = decodeInput(text, enc);
  const live = useLiveTask<Record<string, string>>(`${enc}|${text}`, "error" in data ? null : () => client.run("multi", { data: data.bytes, algos: ORDER }), 150);
  const digests = live.value ?? live.stale;

  return (
    <Panel className="p-4 sm:p-6">
      <CodeEditor id={`${id}-in`} locale={locale} label={t.input} value={text} onChange={setText} placeholder={t.placeholder} rows={4} wrap invalid={"error" in data} />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-fg-2">
        <label className="flex items-center gap-2">
          {t.inputEnc}
          <Select value={enc} size="sm" className="w-36" onChange={(e) => setEnc(e.target.value as InputEncoding)}>
            {(Object.keys(INPUT_ENC_LABEL[locale]) as InputEncoding[]).map((v) => (
              <option key={v} value={v}>
                {INPUT_ENC_LABEL[locale][v]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2">
          {t.out}
          <Select value={fmt} size="sm" className="w-32" onChange={(e) => setFmt(e.target.value as OutFormat)}>
            {(Object.keys(t.fmt) as OutFormat[]).map((v) => (
              <option key={v} value={v}>
                {t.fmt[v]}
              </option>
            ))}
          </Select>
        </label>
        <span className="text-fg-3">{"error" in data ? <span className="text-err">{data.error}</span> : t.copyHint}</span>
      </div>
      <dl className={`mt-4 divide-y divide-line overflow-hidden rounded-[0.625rem] border border-line ${live.pending ? "[&_dd_button]:text-fg-3" : ""}`}>
        {ORDER.map((a) => {
          const def = ALGOS.find((x) => x.id === a)!;
          const value = digests?.[a] ? formatDigest(digests[a], fmt) : "";
          return (
            <div key={a} className="grid gap-0.5 px-3 py-2 sm:grid-cols-[8.5rem_1fr] sm:gap-3">
              <dt className="text-[0.8125rem] font-medium text-fg-3 sm:pt-0.5">{def.name}</dt>
              <dd className="min-w-0">
                <button
                  type="button"
                  className="w-full cursor-copy text-left font-mono text-[0.875rem] break-all text-fg hover:text-accent"
                  onClick={async () => {
                    if (value && (await copyText(value))) setCopied(a);
                  }}
                >
                  {value || "…"}
                  {copied === a && <span className="ml-2 font-sans text-[0.75rem] text-ok">{t.copied}</span>}
                </button>
              </dd>
            </div>
          );
        })}
      </dl>
    </Panel>
  );
}
