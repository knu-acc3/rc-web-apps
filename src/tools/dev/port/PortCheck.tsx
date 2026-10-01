"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { CopyButton } from "@/ui/copy-button";
import { Badge } from "@/ui/panel";
import { Tabs } from "@/ui/tabs";

type Os = "linux" | "macos" | "windows" | "remote";

export interface PortCheckProps {
  locale: Locale;
  port: number;
  protos: string[];
  service: string;
  status: string;
  official: boolean;
}

const T = {
  ru: {
    title: "Как проверить, открыт ли порт",
    tabs: { linux: "Linux", macos: "macOS", windows: "Windows", remote: "С другого компьютера" },
    who: "Какая программа слушает порт",
    alt: "Или",
    remote: "Проверка с другого компьютера",
    udpNote: "UDP не устанавливает соединение, поэтому «открыт» для UDP можно проверить только по ответу службы: nc и nmap часто показывают open|filtered.",
    copy: "Копировать",
    copied: "Скопировано",
    host: "example.com",
  },
  en: {
    title: "How to check if the port is open",
    tabs: { linux: "Linux", macos: "macOS", windows: "Windows", remote: "From another machine" },
    who: "Which program listens on the port",
    alt: "Or",
    remote: "Check from another machine",
    udpNote: "UDP is connectionless, so “open” can only be confirmed by a service reply: nc and nmap often report open|filtered.",
    copy: "Copy",
    copied: "Copied",
    host: "example.com",
  },
} as const;

function commands(os: Os, port: number, protos: string[], locale: Locale): string {
  const t = T[locale];
  const tcp = protos.includes("tcp");
  const udp = protos.includes("udp");
  const c = (s: string) => `# ${s}`;
  const out: string[] = [];
  if (os === "linux") {
    out.push(c(t.who));
    if (tcp) out.push(`sudo ss -ltnp 'sport = :${port}'`);
    if (udp) out.push(`sudo ss -lunp 'sport = :${port}'`);
    out.push("", c(t.alt));
    if (tcp) out.push(`sudo lsof -nP -iTCP:${port} -sTCP:LISTEN`);
    if (udp) out.push(`sudo lsof -nP -iUDP:${port}`);
  } else if (os === "macos") {
    out.push(c(t.who));
    if (tcp) out.push(`sudo lsof -nP -iTCP:${port} -sTCP:LISTEN`);
    if (udp) out.push(`sudo lsof -nP -iUDP:${port}`);
    out.push("", c(t.alt));
    out.push(`netstat -anv | grep '\\.${port} '`);
  } else if (os === "windows") {
    out.push(c(`${t.who} (PowerShell)`));
    if (tcp) out.push(`Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object LocalAddress, OwningProcess, @{n='Process';e={(Get-Process -Id $_.OwningProcess).ProcessName}}`);
    if (udp) out.push(`Get-NetUDPEndpoint -LocalPort ${port} | Select-Object LocalAddress, OwningProcess`);
    out.push("", c(`${t.alt} (cmd)`), `netstat -ano | findstr :${port}`);
  } else {
    out.push(c(t.remote));
    if (tcp) out.push(`nc -zv ${t.host} ${port}`, `nmap -p ${port} ${t.host}`, `Test-NetConnection ${t.host} -Port ${port}`);
    if (udp) out.push(`nc -zvu ${t.host} ${port}`, `sudo nmap -sU -p ${port} ${t.host}`);
  }
  return out.join("\n");
}

/** Focal card of a port page: the number, protocols and copyable check commands per OS. */
export default function PortCheck({ locale, port, protos, service, status, official }: PortCheckProps) {
  const t = T[locale];
  const [os, setOs] = useState<Os>("linux");
  const text = commands(os, port, protos, locale);
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <div className="flex flex-col justify-center rounded-[0.75rem] bg-surface-2 px-5 py-5">
        <div className="font-mono text-6xl font-bold tracking-tight text-accent">{port}</div>
        <div className="mt-2 text-lg font-semibold text-fg">{service}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {protos.map((p) => (
            <Badge key={p} tone="accent">
              {p.toUpperCase()}
            </Badge>
          ))}
          <Badge tone={official ? "ok" : "neutral"}>{status}</Badge>
        </div>
      </div>
      <section className="flex min-w-0 flex-col overflow-hidden rounded-[0.75rem] border border-line bg-surface">
        <div className="flex items-center justify-between gap-2 px-4 pt-2">
          <h2 className="text-sm font-semibold text-fg-2">{t.title}</h2>
          <CopyButton value={text.split("\n").filter((l) => l && !l.startsWith("#")).join("\n")} label={t.copy} copiedLabel={t.copied} variant="ghost" />
        </div>
        <Tabs
          label={t.title}
          value={os}
          onChange={setOs}
          className="px-2"
          items={(["linux", "macos", "windows", "remote"] as Os[]).map((v) => ({ value: v, label: t.tabs[v] }))}
        />
        <pre className="overflow-x-auto px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-fg">
          <code>{text}</code>
        </pre>
        {protos.includes("udp") && <p className="border-t border-line px-4 py-2.5 text-[0.8125rem] text-fg-3">{t.udpNote}</p>}
      </section>
    </div>
  );
}
