"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CodeEditor } from "@/tools/dev/shared/CodeEditor";
import { useDebounced } from "@/tools/dev/shared/hooks";
import { outputLabels } from "@/tools/dev/shared/labels";
import { CodeOutput } from "@/ui/code-output";
import { Input, Switch } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { htmlToJsx } from "./lib/htmljsx";

const T = {
  ru: {
    input: "HTML",
    output: "JSX",
    component: "Компонент",
    componentPh: "имя, например Card",
    uncontrolled: "value/checked → defaultValue/defaultChecked",
    events: "Обработчики вроде onclick=\"…\" превращены в стрелочные функции — проверьте их: в React переменная event не определена.",
    script: "Содержимое <script> и <style> перенесено как строка — в React обычно лучше подключать их иначе.",
  },
  en: {
    input: "HTML",
    output: "JSX",
    component: "Component",
    componentPh: "name, e.g. Card",
    uncontrolled: "value/checked → defaultValue/defaultChecked",
    events: "Handlers like onclick=\"…\" became arrow functions — review them: there's no implicit event variable in React.",
    script: "<script> and <style> content was kept as a string — in React you'd usually include them differently.",
  },
} as const;

const SAMPLE = `<div class="card" style="padding: 16px; border-radius: 12px">
  <label for="email">E-mail</label>
  <input id="email" type="email" value="" autofocus tabindex="1">
  <button class="btn" onclick="send()">Отправить</button>
  <!-- icon -->
  <svg viewBox="0 0 24 24" stroke-width="2"><path d="M5 12h14"/></svg>
</div>`;

export default function HtmlToJsx({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [html, setHtml] = useState(SAMPLE);
  const [name, setName] = useState("");
  const [uncontrolled, setUncontrolled] = useState(true);
  const src = useDebounced(html, 120);
  const res = useMemo(() => htmlToJsx(src, { uncontrolled, component: /^[A-Z][A-Za-z0-9_]*$/.test(name) ? name : undefined }), [src, uncontrolled, name]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeEditor id={`${id}-in`} locale={locale} label={t.input} value={html} onChange={setHtml} rows={14} sample={SAMPLE} fileAccept=".html,.htm,.svg,text/html" />
        <CodeOutput value={res.code} title={t.output} filename={`${name || "component"}.jsx`} labels={outputLabels(locale)} minRows={14} />
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-fg-2">
        <label className="flex items-center gap-2" htmlFor={`${id}-c`}>
          {t.component}
          <Input id={`${id}-c`} size="sm" className="w-44 font-mono" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.componentPh} spellCheck={false} />
        </label>
        <Switch label={t.uncontrolled} checked={uncontrolled} onChange={(e) => setUncontrolled(e.target.checked)} />
      </div>
      {res.warnings.includes("events") && <Notice tone="warn">{t.events}</Notice>}
      {(res.warnings.includes("script") || res.warnings.includes("style")) && <Notice tone="warn">{t.script}</Notice>}
    </div>
  );
}
