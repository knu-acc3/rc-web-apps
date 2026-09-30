"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { outputLabels } from "@/sections/code/kit/labels";
import { CodeOutput } from "@/ui/code-output";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select, Switch, Textarea } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { formatUuid, NAMESPACES, parseUuid, uuidNameBased, type NamespaceId } from "./engine";

const T = {
  ru: {
    version: "Версия",
    namespace: "Пространство имён",
    custom: "Свой UUID пространства",
    customLabel: "UUID пространства имён",
    name: "Имя",
    names: "Имена (по одному в строке)",
    bulk: "Несколько имён",
    upper: "ЗАГЛАВНЫЕ буквы",
    result: "UUID",
    badNs: "Введите корректный UUID пространства имён",
    same: "Один и тот же набор «пространство + имя» всегда даёт один и тот же UUID.",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    version: "Version",
    namespace: "Namespace",
    custom: "Custom namespace UUID",
    customLabel: "Namespace UUID",
    name: "Name",
    names: "Names (one per line)",
    bulk: "Several names",
    upper: "UPPERCASE",
    result: "UUID",
    badNs: "Enter a valid namespace UUID",
    same: "The same namespace + name pair always produces the same UUID.",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const NS_LABEL: Record<NamespaceId, string> = { dns: "DNS", url: "URL", oid: "OID", x500: "X.500 DN" };

export default function NameUuid({ locale, version: v0 = 5, name: name0 = "example.com", namespace: ns0 = "dns" }: { locale: Locale; version?: 3 | 5; name?: string; namespace?: NamespaceId | "custom" }) {
  const t = T[locale];
  const id = useId();
  const [version, setVersion] = useState<3 | 5>(v0);
  const [ns, setNs] = useState<NamespaceId | "custom">(ns0);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState(name0);
  const [bulk, setBulk] = useState(false);
  const [upper, setUpper] = useState(false);

  const nsUuid = ns === "custom" ? custom.trim() : NAMESPACES[ns];
  const nsValid = ns !== "custom" || parseUuid(custom) !== null;

  const results = useMemo(() => {
    if (!nsValid) return null;
    const list = bulk ? name.split(/\r?\n/).filter((x) => x.length > 0) : [name];
    return list.map((n) => formatUuid(uuidNameBased(version, nsUuid, n), { upper }));
  }, [nsValid, bulk, name, version, nsUuid, upper]);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t.version} htmlFor={`${id}-v`}>
            <Select id={`${id}-v`} value={String(version)} onChange={(e) => setVersion(Number(e.target.value) as 3 | 5)}>
              <option value="5">UUID v5 (SHA-1)</option>
              <option value="3">UUID v3 (MD5)</option>
            </Select>
          </Field>
          <Field label={t.namespace} htmlFor={`${id}-ns`}>
            <Select id={`${id}-ns`} value={ns} onChange={(e) => setNs(e.target.value as NamespaceId | "custom")}>
              {(Object.keys(NAMESPACES) as NamespaceId[]).map((k) => (
                <option key={k} value={k}>
                  {NS_LABEL[k]} — {NAMESPACES[k].slice(0, 8)}…
                </option>
              ))}
              <option value="custom">{t.custom}</option>
            </Select>
          </Field>
          {ns === "custom" && (
            <Field label={t.customLabel} htmlFor={`${id}-c`} error={custom && !nsValid ? t.badNs : undefined}>
              <Input id={`${id}-c`} value={custom} onChange={(e) => setCustom(e.target.value)} className="font-mono" placeholder="6ba7b810-9dad-11d1-80b4-00c04fd430c8" aria-invalid={!!custom && !nsValid} spellCheck={false} />
            </Field>
          )}
        </div>
        <div className="mt-3">
          {bulk ? (
            <Field label={t.names} htmlFor={`${id}-n`}>
              <Textarea id={`${id}-n`} value={name} onChange={(e) => setName(e.target.value)} rows={6} />
            </Field>
          ) : (
            <Field label={t.name} htmlFor={`${id}-n`}>
              <Input id={`${id}-n`} value={name} onChange={(e) => setName(e.target.value)} className="font-mono" spellCheck={false} autoComplete="off" />
            </Field>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <Switch label={t.bulk} checked={bulk} onChange={(e) => setBulk(e.target.checked)} />
          <Switch label={t.upper} checked={upper} onChange={(e) => setUpper(e.target.checked)} />
        </div>

        {!bulk && (
          <div className="mt-4 flex flex-col gap-3 rounded-[10px] bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-fg-2">{t.result}</div>
              <output className="block font-mono text-lg font-semibold break-all text-fg sm:text-xl" aria-live="polite">
                {results ? results[0] : <span className="text-base font-normal text-err">{t.badNs}</span>}
              </output>
            </div>
            <CopyButton value={results?.[0] ?? ""} label={t.copy} copiedLabel={t.copied} />
          </div>
        )}
        <p className="mt-3 text-sm text-fg-3">{t.same}</p>
      </Panel>
      {bulk && results && <CodeOutput value={results.join("\n")} title={`UUID v${version}`} filename={`uuid-v${version}.txt`} labels={outputLabels(locale)} />}
    </div>
  );
}
