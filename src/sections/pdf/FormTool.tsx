"use client";

import { FileCheck2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { Checkbox, Field, Input, Select, Textarea } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { fontFor, runPdfJob } from "./engine/client";
import type { FormFieldInfo } from "./engine/pdf-ops";
import { PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { errorText } from "./ui/strings";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";

type Value = string | boolean | string[];

const T = {
  ru: {
    reading: "Поиск полей формы…",
    none: "В этом PDF нет интерактивных полей. Такие формы (например, сканы бланков) заполняются только поверх страницы — попробуйте «Подписать PDF» или «Водяной знак» для надписей.",
    found: (n: number) => `Найдено ${count("ru", n, ["поле", "поля", "полей"])}`,
    flatten: "Сделать поля нередактируемыми («сплющить» форму)",
    flattenHint: "Значения станут обычным текстом страницы: их нельзя будет случайно изменить, и они одинаково выглядят в любой программе.",
    readOnly: "только чтение",
    signature: "поле для цифровой подписи — здесь не заполняется",
    button: "кнопка",
    none_: "— не выбрано —",
    go: "Сохранить заполненный PDF",
  },
  en: {
    reading: "Looking for form fields…",
    none: "This PDF has no interactive fields. Such forms (e.g. scanned blanks) can only be filled on top of the page — try “Sign PDF” or “Watermark” for text.",
    found: (n: number) => `${count("en", n, ["field", "fields"])} found`,
    flatten: "Make fields non-editable (flatten the form)",
    flattenHint: "Values become plain page text: they can't be changed by accident and look the same in every app.",
    readOnly: "read-only",
    signature: "digital signature field — not filled here",
    button: "button",
    none_: "— none —",
    go: "Save filled PDF",
  },
} as const;

export default function FormTool({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const file = pdf.ready[0] ?? null;
  const [fields, setFields] = useState<{ file: string; list: FormFieldInfo[] } | { file: string; error: string } | null>(null);
  const [values, setValues] = useState<Record<string, Value>>({});
  const [flatten, setFlatten] = useState(true);
  const [result, setResult] = useState<OutputItem[] | null>(null);

  useEffect(() => {
    if (!file?.bytes) return;
    const ctrl = new AbortController();
    runPdfJob({ type: "info", source: { bytes: file.bytes.slice(0), password: file.password } }, { signal: ctrl.signal })
      .then((r) => {
        if (ctrl.signal.aborted) return;
        const list = r.fields ?? [];
        setFields({ file: file.id, list });
        setValues(Object.fromEntries(list.map((f) => [f.name, f.value])));
        setResult(null);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setFields({ file: file.id, error: errorText(locale, e) });
      });
    return () => ctrl.abort();
  }, [file, locale]);

  const current = fields && file && fields.file === file.id ? fields : null;
  const list = current && "list" in current ? current.list : null;
  const editable = list?.filter((f) => !f.readOnly && f.type !== "button" && f.type !== "signature" && f.type !== "unknown") ?? [];

  const set = (name: string, v: Value) => {
    setValues((prev) => ({ ...prev, [name]: v }));
    setResult(null);
  };

  async function save() {
    if (!file || !list) return;
    setResult(null);
    const changed = Object.fromEntries(editable.map((f) => [f.name, values[f.name]]));
    const text = Object.values(changed)
      .flatMap((v) => (typeof v === "string" ? [v] : Array.isArray(v) ? v : []))
      .join(" ");
    const out = await job.start(async (ctx) =>
      workerJob({ type: "fill-form", source: { bytes: file.bytes!.slice(0), password: file.password }, values: changed, flatten, font: await fontFor(text) }, ctx),
    );
    if (out) setResult([{ name: `${baseName(file.name)}-filled.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {file && !current && <p className="text-sm text-fg-3">{t.reading}</p>}
      {current && "error" in current && <Notice tone="err">{current.error}</Notice>}
      {list && !editable.length && <Notice tone="warn">{t.none}</Notice>}
      {list && editable.length > 0 && (
        <>
          <Panel className="p-4 sm:p-5">
            <p className="mb-4 text-sm text-fg-3">{t.found(list.length)}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {editable.map((f, i) => {
                const fid = `${id}-${i}`;
                const v = values[f.name];
                if (f.type === "checkbox") return <Checkbox key={f.name} label={f.name} checked={v === true} onChange={(e) => set(f.name, e.target.checked)} className="sm:col-span-2" />;
                if (f.type === "radio" || f.type === "dropdown")
                  return (
                    <Field key={f.name} label={f.name} htmlFor={fid}>
                      <Select id={fid} value={typeof v === "string" ? v : ""} onChange={(e) => set(f.name, e.target.value)}>
                        <option value="">{t.none_}</option>
                        {f.options?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  );
                if (f.type === "optionlist")
                  return (
                    <Field key={f.name} label={f.name} htmlFor={fid}>
                      <select
                        id={fid}
                        multiple={f.multiSelect}
                        className="control min-h-24 py-1.5"
                        value={Array.isArray(v) ? (f.multiSelect ? v : (v[0] ?? "")) : []}
                        onChange={(e) => set(f.name, Array.from(e.target.selectedOptions, (o) => o.value))}
                      >
                        {f.options?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </Field>
                  );
                return (
                  <Field key={f.name} label={f.name} htmlFor={fid} className={f.multiline ? "sm:col-span-2" : undefined}>
                    {f.multiline ? (
                      <Textarea id={fid} value={typeof v === "string" ? v : ""} maxLength={f.maxLength} onChange={(e) => set(f.name, e.target.value)} className="min-h-24 font-sans! text-[0.9375rem]!" />
                    ) : (
                      <Input id={fid} value={typeof v === "string" ? v : ""} maxLength={f.maxLength} onChange={(e) => set(f.name, e.target.value)} autoComplete="off" />
                    )}
                  </Field>
                );
              })}
            </div>
            {list.some((f) => f.type === "signature") && <p className="mt-4 text-sm text-fg-3">{list.filter((f) => f.type === "signature").map((f) => `${f.name}: ${t.signature}`).join("; ")}</p>}
          </Panel>
          <Field hint={t.flattenHint}>
            <Checkbox label={t.flatten} checked={flatten} onChange={(e) => setFlatten(e.target.checked)} />
          </Field>
          <PrimaryButton disabled={job.running} onClick={save}>
            <FileCheck2 aria-hidden />
            {t.go}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
          {result && (
            <ResultCard
              locale={locale}
              items={result}
              onReset={() => {
                setResult(null);
                pdf.clear();
                job.reset();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
