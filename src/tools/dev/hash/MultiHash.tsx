"use client";

import { Check, Copy } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { CodeEditor } from "@/tools/dev/shared/CodeEditor";
import { useLiveTask, useWorkerClient } from "@/tools/dev/shared/hooks";
import { Opt, OptionsRow } from "@/tools/dev/shared/Pane";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { ALGOS, type AlgoId } from "./lib/algorithms";
import { formatDigest, type OutFormat } from "./lib/digest";
import { decodeInput, INPUT_ENC_LABEL, type InputEncoding } from "./lib/input";

const T = {
  ru: { input: "Текст", placeholder: "Введите текст — хэши всех алгоритмов посчитаются сразу", inputEnc: "Ввод", out: "Формат", copy: "Копировать", copied: "Скопировано", fmt: { hex: "hex", HEX: "HEX", base64: "Base64", base64url: "Base64url" } },
  en: { input: "Text", placeholder: "Type text — digests of every algorithm update instantly", inputEnc: "Input", out: "Format", copy: "Copy", copied: "Copied", fmt: { hex: "hex", HEX: "HEX", base64: "Base64", base64url: "Base64url" } },
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
    <Panel className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <CodeEditor id={`${id}-in`} locale={locale} label={t.input} value={text} onChange={setText} placeholder={t.placeholder} rows={5} wrap invalid={"error" in data} />
        {"error" in data && <Notice tone="err">{data.error}</Notice>}
        <OptionsRow>
          <Opt label={t.inputEnc} group>
            <Segmented size="sm" label={t.inputEnc} value={enc} onChange={setEnc} options={(Object.keys(INPUT_ENC_LABEL[locale]) as InputEncoding[]).map((v) => ({ value: v, label: INPUT_ENC_LABEL[locale][v] }))} />
          </Opt>
          <Opt label={t.out} group>
            <Segmented size="sm" label={t.out} value={fmt} onChange={setFmt} options={(Object.keys(t.fmt) as OutFormat[]).map((v) => ({ value: v, label: t.fmt[v] }))} />
          </Opt>
        </OptionsRow>
      </div>
      <ul className={cn("flex min-w-0 flex-col gap-1", live.pending && "[&_code]:text-fg-3")} aria-label={t.out}>
        {ORDER.map((a) => {
          const def = ALGOS.find((x) => x.id === a)!;
          const value = digests?.[a] ? formatDigest(digests[a], fmt) : "";
          const done = copied === a;
          return (
            <li key={a}>
              <button
                type="button"
                disabled={!value}
                title={t.copy}
                onClick={async () => {
                  if (!value || !(await copyText(value))) return;
                  setCopied(a);
                  setTimeout(() => setCopied((c) => (c === a ? null : c)), 1500);
                }}
                className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-[1rem] bg-surface-2 py-2 pl-4 pr-3 text-left transition-[background-color,transform] duration-150 hover:bg-accent-container active:scale-[0.99] sm:grid-cols-[8.5rem_minmax(0,1fr)_auto]"
              >
                <span className="col-span-2 text-[0.8125rem] font-medium text-fg-3 sm:col-span-1">{def.name}</span>
                <code className="min-w-0 font-mono text-[0.875rem] break-all text-fg">{value || "…"}</code>
                <span aria-hidden className={cn("flex size-8 items-center justify-center rounded-full transition-colors", done ? "text-ok" : "text-fg-3 group-hover:text-on-accent-container")}>
                  {done ? <Check className="size-4" /> : <Copy className="size-4" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <span role="status" className="sr-only">
        {copied ? `${t.copied}: ${ALGOS.find((x) => x.id === copied)?.name ?? ""}` : ""}
      </span>
    </Panel>
  );
}
