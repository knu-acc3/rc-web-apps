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
    namespace: "Пространство",
    custom: "свой UUID",
    customLabel: "UUID пространства имён",
    name: "Имя",
    names: "Имена, по одному в строке",
    bulk: "Несколько имён",
    upper: "ЗАГЛАВНЫЕ",
    badNs: "Введите корректный UUID пространства имён",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    version: "Version",
    namespace: "Namespace",
    custom: "custom UUID",
    customLabel: "Namespace UUID",
    name: "Name",
    names: "Names, one per line",
    bulk: "Several names",
    upper: "UPPERCASE",
    badNs: "Enter a valid namespace UUID",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const NS_LABEL: Record<NamespaceId, string> = { dns: "DNS", url: "URL", oid: "OID", x500: "X.500" };

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
      <Panel className="p-4 sm:p-6">
        {bulk ? (
          <Field label={t.names} htmlFor={`${id}-n`}>
            <Textarea id={`${id}-n`} value={name} onChange={(e) => setName(e.target.value)} rows={6} />
          </Field>
        ) : (
          <Field label={t.name} htmlFor={`${id}-n`}>
            <Input id={`${id}-n`} size="lg" value={name} onChange={(e) => setName(e.target.value)} className="font-mono" spellCheck={false} autoComplete="off" />
          </Field>
        )}
        {ns === "custom" && (
          <Field className="mt-3" label={t.customLabel} htmlFor={`${id}-c`} error={custom && !nsValid ? t.badNs : undefined}>
            <Input id={`${id}-c`} value={custom} onChange={(e) => setCustom(e.target.value)} className="font-mono" placeholder="6ba7b810-9dad-11d1-80b4-00c04fd430c8" aria-invalid={!!custom && !nsValid} spellCheck={false} />
          </Field>
        )}

        {!bulk && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium text-fg-2">UUID v{version}</div>
              <output className="mt-1 block font-mono text-xl font-semibold tracking-tight break-all text-fg sm:text-[1.625rem]" aria-live="polite">
                {results ? results[0] : <span className="text-base font-normal text-fg-3">{t.badNs}</span>}
              </output>
            </div>
            <CopyButton value={results?.[0] ?? ""} label={t.copy} copiedLabel={t.copied} size="md" variant="outline" className="self-start sm:self-auto" />
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-4 text-sm text-fg-2">
          <label className="flex items-center gap-2">
            {t.version}
            <Select value={String(version)} size="sm" className="w-36" onChange={(e) => setVersion(Number(e.target.value) as 3 | 5)}>
              <option value="5">v5 (SHA-1)</option>
              <option value="3">v3 (MD5)</option>
            </Select>
          </label>
          <label className="flex items-center gap-2">
            {t.namespace}
            <Select value={ns} size="sm" className="w-36" onChange={(e) => setNs(e.target.value as NamespaceId | "custom")}>
              {(Object.keys(NAMESPACES) as NamespaceId[]).map((k) => (
                <option key={k} value={k}>
                  {NS_LABEL[k]}
                </option>
              ))}
              <option value="custom">{t.custom}</option>
            </Select>
          </label>
          <Switch label={t.bulk} checked={bulk} onChange={(e) => setBulk(e.target.checked)} />
          <Switch label={t.upper} checked={upper} onChange={(e) => setUpper(e.target.checked)} />
        </div>
      </Panel>
      {bulk && results && <CodeOutput value={results.join("\n")} title={`UUID v${version}`} filename={`uuid-v${version}.txt`} labels={outputLabels(locale)} />}
    </div>
  );
}
