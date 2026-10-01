"use client";

import { Download } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { downloadText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Switch, Textarea } from "@/ui/field";
import { Notice, Panel, PanelHeader } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { SliderField } from "@/ui/slider-field";
import { splitEqual, vlsm, type DivideError } from "./lib/divider";
import { cidr4, maskOf, parseV4Input, toDotted, usableHosts, type Cidr4 } from "./lib/ipv4";
import { bigFmt, err4 } from "./ui/shared";

type Mode = "equal" | "vlsm";

const T = {
  ru: {
    network: "Исходная сеть",
    networkHint: "Например 192.168.0.0/24 или 10.0.0.0/16",
    mode: "Способ деления",
    equal: "На N равных частей",
    vlsm: "По числу хостов (VLSM)",
    count: "Количество подсетей",
    reqs: "Подсети и нужное число хостов — по одной в строке",
    reqsHint: "Формат: «название количество», например «Офис 100». Можно только число.",
    p2p: "Для 2 хостов использовать /31 (канал точка-точка, RFC 3021)",
    subnet: "Подсеть",
    name: "Название",
    need: "Нужно",
    range: "Диапазон хостов",
    mask: "Маска",
    hosts: "Хостов",
    broadcast: "Broadcast",
    free: "Свободное место",
    copy: "Копировать таблицу",
    copied: "Скопировано",
    download: "Скачать CSV",
    rounded: (asked: number, made: number, p: number) => `Подсетей должно быть степенью двойки: вместо ${asked} получится ${made} подсетей /${p}.`,
    shown: (n: string) => `Показаны первые 1024 из ${n} подсетей.`,
    errors: {
      "too-many": "Столько подсетей не поместится: префикс получится длиннее /32",
      "no-fit": "Не помещается в исходную сеть",
      "bad-count": "Введите целое число подсетей от 1",
      "bad-hosts": "Число хостов должно быть целым и больше нуля",
    } as Record<DivideError, string>,
    used: (u: string, total: string) => `Занято ${u} из ${total} адресов`,
    hostForms: ["хост", "хоста", "хостов"],
    netForms: ["подсеть", "подсети", "подсетей"],
  },
  en: {
    network: "Network to divide",
    networkHint: "E.g. 192.168.0.0/24 or 10.0.0.0/16",
    mode: "Division method",
    equal: "Into N equal parts",
    vlsm: "By host count (VLSM)",
    count: "Number of subnets",
    reqs: "Subnets and required hosts — one per line",
    reqsHint: "Format: “name count”, e.g. “Office 100”. A bare number works too.",
    p2p: "Use /31 for 2 hosts (point-to-point link, RFC 3021)",
    subnet: "Subnet",
    name: "Name",
    need: "Needed",
    range: "Host range",
    mask: "Mask",
    hosts: "Hosts",
    broadcast: "Broadcast",
    free: "Free space",
    copy: "Copy table",
    copied: "Copied",
    download: "Download CSV",
    rounded: (asked: number, made: number, p: number) => `The number of subnets must be a power of two: ${asked} becomes ${made} subnets of /${p}.`,
    shown: (n: string) => `Showing the first 1024 of ${n} subnets.`,
    errors: {
      "too-many": "That many subnets don't fit: the prefix would be longer than /32",
      "no-fit": "Does not fit into the network",
      "bad-count": "Enter a whole number of subnets, 1 or more",
      "bad-hosts": "Host counts must be whole numbers above zero",
    } as Record<DivideError, string>,
    used: (u: string, total: string) => `${u} of ${total} addresses used`,
    hostForms: ["host", "hosts"],
    netForms: ["subnet", "subnets"],
  },
} as const;

interface Row {
  name?: string;
  need?: number;
  block: Cidr4;
}

function baseOf(text: string): Cidr4 | null {
  const p = parseV4Input(text, 24);
  return p.ok ? { network: (p.value.ip & maskOf(p.value.prefix)) >>> 0, prefix: p.value.prefix } : null;
}

function hostRange(c: Cidr4): string {
  const size = 2 ** (32 - c.prefix);
  if (c.prefix >= 31) return `${toDotted(c.network)} – ${toDotted(c.network + size - 1)}`;
  return `${toDotted(c.network + 1)} – ${toDotted(c.network + size - 2)}`;
}

export default function SubnetDivider({ locale, network = "192.168.0.0/24", mode: m0 = "equal" }: { locale: Locale; network?: string; mode?: Mode }) {
  const t = T[locale];
  const id = useId();
  const [net, setNet] = useState(network);
  const [mode, setMode] = useState<Mode>(m0);
  const [count, setCount] = useState("4");
  const [reqs, setReqs] = useState(locale === "ru" ? "Офис 100\nСклад 50\nWi-Fi гости 25\nСерверы 10\nКанал до филиала 2" : "Office 100\nWarehouse 50\nGuest Wi-Fi 25\nServers 10\nBranch link 2");
  const [p2p, setP2p] = useState(false);

  const parsed = parseV4Input(net, 24);
  const base = baseOf(net);

  const result = useMemo(() => {
    const base = baseOf(net);
    if (!base) return null;
    if (mode === "equal") {
      const n = Number(count);
      const r = splitEqual(base, n);
      if (!r.ok) return { error: t.errors[r.error] };
      const rows: Row[] = r.value.subnets.map((block) => ({ block }));
      const note = r.value.created !== n ? t.rounded(n, r.value.created, r.value.newPrefix) : null;
      const more = r.value.created > rows.length ? t.shown(bigFmt(locale, r.value.created)) : null;
      return { rows, free: [] as Cidr4[], note: [note, more].filter(Boolean).join(" ") || null, used: r.value.created * 2 ** (32 - r.value.newPrefix) };
    }
    const items = reqs
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l, i) => {
        const m = l.match(/^(.*?)[\s:;,]*(\d+)$/);
        return m ? { name: m[1].trim() || `#${i + 1}`, hosts: Number(m[2]) } : { name: l, hosts: NaN };
      });
    const r = vlsm(base, items, p2p);
    if (!r.ok) return { error: `${t.errors[r.error]}${r.name ? `: ${r.name}` : ""}` };
    return { rows: r.value.items.map((i) => ({ name: i.name, need: i.hosts, block: i.block })), free: r.value.free, note: null, used: r.value.used };
  }, [net, mode, count, reqs, p2p, t, locale]);

  const csv = useMemo(() => {
    if (!result || "error" in result) return "";
    const head = [mode === "vlsm" ? t.name : null, mode === "vlsm" ? t.need : null, t.subnet, t.mask, t.range, t.broadcast, t.hosts].filter(Boolean).join(",");
    const lines = result.rows.map((r) =>
      [
        mode === "vlsm" ? `"${(r.name ?? "").replace(/"/g, '""')}"` : null,
        mode === "vlsm" ? r.need : null,
        cidr4(r.block),
        toDotted(maskOf(r.block.prefix)),
        hostRange(r.block),
        r.block.prefix >= 31 ? "" : toDotted(r.block.network + 2 ** (32 - r.block.prefix) - 1),
        usableHosts(r.block.prefix),
      ]
        .filter((x) => x !== null)
        .join(","),
    );
    return [head, ...lines].join("\n");
  }, [result, mode, t]);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
        <div className="grid items-start gap-x-6 gap-y-4 lg:grid-cols-2">
          <Field label={t.network} htmlFor={`${id}-net`} hint={t.networkHint} error={!parsed.ok && net.trim() ? err4(locale, parsed.error) : undefined}>
            <Input id={`${id}-net`} value={net} onChange={(e) => setNet(e.target.value)} size="lg" className="font-mono" autoComplete="off" spellCheck={false} aria-invalid={!parsed.ok} />
          </Field>
          <div className="flex flex-col gap-4">
            <Segmented
              label={t.mode}
              value={mode}
              onChange={setMode}
              options={[
                { value: "equal", label: t.equal },
                { value: "vlsm", label: t.vlsm },
              ]}
            />
            {mode === "equal" ? (
              <SliderField
                id={`${id}-n`}
                label={t.count}
                value={count}
                onChange={setCount}
                parse={(v) => (/^\d{1,9}$/.test(v.trim()) ? Number(v.trim()) : null)}
                format={(n) => String(Math.round(n))}
                min={2}
                max={1024}
                scale="log"
                inputMode="numeric"
              />
            ) : (
              <>
                <Field label={t.reqs} htmlFor={`${id}-r`} hint={t.reqsHint}>
                  <Textarea id={`${id}-r`} value={reqs} onChange={(e) => setReqs(e.target.value)} rows={6} className="font-sans" />
                </Field>
                <Switch label={t.p2p} checked={p2p} onChange={(e) => setP2p(e.target.checked)} />
              </>
            )}
          </div>
        </div>
      </Panel>

      {result && "error" in result && <Notice tone="err">{result.error}</Notice>}
      {result && !("error" in result) && base && (
        <>
          {result.note && <Notice tone="warn">{result.note}</Notice>}
          <Panel>
            <PanelHeader
              title={
                <span aria-live="polite">
                  {`${bigFmt(locale, result.rows.length)} ${plural(locale, result.rows.length, t.netForms)} · ${t.used(bigFmt(locale, result.used), bigFmt(locale, 2 ** (32 - base.prefix)))}`}
                </span>
              }
              actions={
                <>
                  <CopyButton value={csv} label={t.copy} copiedLabel={t.copied} variant="ghost" />
                  <Button variant="ghost" size="sm" onClick={() => downloadText(csv, "subnets.csv", "text/csv;charset=utf-8")}>
                    <Download aria-hidden />
                    {t.download}
                  </Button>
                </>
              }
            />
            <div tabIndex={0} className="tbl rounded-none! border-0!">
              <table>
                <thead>
                  <tr>
                    {mode === "vlsm" && <th scope="col">{t.name}</th>}
                    {mode === "vlsm" && <th scope="col">{t.need}</th>}
                    <th scope="col">{t.subnet}</th>
                    <th scope="col">{t.mask}</th>
                    <th scope="col">{t.range}</th>
                    <th scope="col">{t.hosts}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r) => (
                    <tr key={cidr4(r.block)}>
                      {mode === "vlsm" && <td>{r.name}</td>}
                      {mode === "vlsm" && <td>{r.need}</td>}
                      <td className="font-mono whitespace-nowrap">{cidr4(r.block)}</td>
                      <td className="font-mono whitespace-nowrap">{toDotted(maskOf(r.block.prefix))}</td>
                      <td className="font-mono whitespace-nowrap">{hostRange(r.block)}</td>
                      <td>{bigFmt(locale, usableHosts(r.block.prefix))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          {result.free.length > 0 && (
            <Panel>
              <PanelHeader title={t.free} />
              <p className="px-4 py-3 font-mono text-sm text-fg">{result.free.map(cidr4).join(", ")}</p>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
