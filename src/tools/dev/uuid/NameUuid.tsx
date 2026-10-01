"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { outputLabels } from "@/tools/dev/shared/labels";
import { Opt, OptionsRow, Pane } from "@/tools/dev/shared/Pane";
import { CodeOutput } from "@/ui/code-output";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Switch, Textarea } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { formatUuid, NAMESPACES, parseUuid, uuidNameBased, type NamespaceId } from "./lib/engine";

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
      <Panel className="flex flex-col gap-5 p-4 sm:p-6">
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
          <Field label={t.customLabel} htmlFor={`${id}-c`} error={custom && !nsValid ? t.badNs : undefined}>
            <Input id={`${id}-c`} value={custom} onChange={(e) => setCustom(e.target.value)} className="font-mono" placeholder="6ba7b810-9dad-11d1-80b4-00c04fd430c8" aria-invalid={!!custom && !nsValid} spellCheck={false} />
          </Field>
        )}

        {!bulk && (
          <Pane title={`UUID v${version}`} actions={<CopyButton value={results?.[0] ?? ""} label={t.copy} copiedLabel={t.copied} variant="secondary" compact />}>
            <output className="block px-4 py-4 font-mono text-xl font-semibold tracking-tight break-all text-fg sm:text-2xl" aria-live="polite">
              {results ? results[0] : <span className="text-base font-normal text-fg-3">{t.badNs}</span>}
            </output>
          </Pane>
        )}

        <OptionsRow>
          <Opt label={t.version} group>
            <Segmented
              size="sm"
              label={t.version}
              value={String(version)}
              onChange={(v) => setVersion(Number(v) as 3 | 5)}
              options={[
                { value: "5", label: "v5 (SHA-1)" },
                { value: "3", label: "v3 (MD5)" },
              ]}
            />
          </Opt>
          <Opt label={t.namespace} group>
            <Segmented size="sm" label={t.namespace} value={ns} onChange={setNs} options={[...(Object.keys(NAMESPACES) as NamespaceId[]).map((k) => ({ value: k, label: NS_LABEL[k] })), { value: "custom" as const, label: t.custom }]} />
          </Opt>
          <Switch label={t.bulk} checked={bulk} onChange={(e) => setBulk(e.target.checked)} />
          <Switch label={t.upper} checked={upper} onChange={(e) => setUpper(e.target.checked)} />
        </OptionsRow>
      </Panel>
      {bulk && results && <CodeOutput value={results.join("\n")} title={`UUID v${version}`} filename={`uuid-v${version}.txt`} labels={outputLabels(locale)} />}
    </div>
  );
}
