"use client";

import { useState } from "react";
import { ArrowSquareOut, MagnifyingGlass } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

export type PortTransport = "tcp" | "udp";
export type PortTransportFilter = "all" | PortTransport;

interface CommonPortRecord {
  port: number;
  service: string;
  aliases: readonly string[];
  transports: readonly PortTransport[];
  description: { en: string; ru: string };
}

export interface PortMatch {
  port: number;
  service: string;
  transports: PortTransport[];
  description: { en: string; ru: string };
}

export type PortSearchResult =
  | { kind: "empty" }
  | { kind: "invalid-port" }
  | { kind: "matches"; query: string; matches: PortMatch[] };

const IANA_REGISTRY_URL =
  "https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml";

const COMMON_PORTS: readonly CommonPortRecord[] = [
  {
    port: 20,
    service: "FTP data",
    aliases: ["ftp-data"],
    transports: ["tcp"],
    description: {
      en: "Traditional FTP data channel.",
      ru: "Традиционный канал данных FTP.",
    },
  },
  {
    port: 21,
    service: "FTP control",
    aliases: ["ftp"],
    transports: ["tcp"],
    description: {
      en: "Traditional FTP command channel.",
      ru: "Традиционный канал команд FTP.",
    },
  },
  {
    port: 22,
    service: "SSH",
    aliases: ["secure shell", "sftp"],
    transports: ["tcp"],
    description: {
      en: "Encrypted remote shell and related protocols.",
      ru: "Шифрованная удалённая оболочка и связанные протоколы.",
    },
  },
  {
    port: 23,
    service: "Telnet",
    aliases: ["telnet"],
    transports: ["tcp"],
    description: {
      en: "Legacy unencrypted remote terminal protocol.",
      ru: "Устаревший незашифрованный протокол удалённого терминала.",
    },
  },
  {
    port: 25,
    service: "SMTP",
    aliases: ["mail transfer"],
    transports: ["tcp"],
    description: {
      en: "Server-to-server email transfer.",
      ru: "Передача электронной почты между серверами.",
    },
  },
  {
    port: 53,
    service: "DNS",
    aliases: ["domain name system", "domain"],
    transports: ["tcp", "udp"],
    description: {
      en: "Domain name queries and zone-related traffic.",
      ru: "Запросы доменных имён и трафик, связанный с зонами.",
    },
  },
  {
    port: 67,
    service: "DHCP server",
    aliases: ["bootps", "dhcp"],
    transports: ["udp"],
    description: {
      en: "Server side of IPv4 address configuration.",
      ru: "Серверная сторона настройки IPv4-адресов.",
    },
  },
  {
    port: 68,
    service: "DHCP client",
    aliases: ["bootpc", "dhcp"],
    transports: ["udp"],
    description: {
      en: "Client side of IPv4 address configuration.",
      ru: "Клиентская сторона настройки IPv4-адресов.",
    },
  },
  {
    port: 69,
    service: "TFTP",
    aliases: ["trivial file transfer"],
    transports: ["udp"],
    description: {
      en: "Minimal file transfer protocol without authentication.",
      ru: "Минимальный протокол передачи файлов без аутентификации.",
    },
  },
  {
    port: 80,
    service: "HTTP",
    aliases: ["web"],
    transports: ["tcp"],
    description: {
      en: "Unencrypted HTTP web traffic.",
      ru: "Незашифрованный веб-трафик HTTP.",
    },
  },
  {
    port: 110,
    service: "POP3",
    aliases: ["post office protocol"],
    transports: ["tcp"],
    description: {
      en: "Retrieval of email from a mailbox server.",
      ru: "Получение почты с сервера почтовых ящиков.",
    },
  },
  {
    port: 123,
    service: "NTP",
    aliases: ["network time protocol", "time"],
    transports: ["udp"],
    description: {
      en: "Network clock synchronization.",
      ru: "Синхронизация часов по сети.",
    },
  },
  {
    port: 143,
    service: "IMAP",
    aliases: ["internet message access protocol"],
    transports: ["tcp"],
    description: {
      en: "Mailbox access and synchronization.",
      ru: "Доступ к почтовому ящику и синхронизация.",
    },
  },
  {
    port: 161,
    service: "SNMP",
    aliases: ["simple network management protocol"],
    transports: ["udp"],
    description: {
      en: "Network management queries.",
      ru: "Запросы управления сетевыми устройствами.",
    },
  },
  {
    port: 162,
    service: "SNMP trap",
    aliases: ["snmptrap"],
    transports: ["udp"],
    description: {
      en: "Asynchronous network management notifications.",
      ru: "Асинхронные уведомления сетевого управления.",
    },
  },
  {
    port: 389,
    service: "LDAP",
    aliases: ["directory service"],
    transports: ["tcp", "udp"],
    description: {
      en: "Directory access using LDAP.",
      ru: "Доступ к каталогам по протоколу LDAP.",
    },
  },
  {
    port: 443,
    service: "HTTPS",
    aliases: ["secure web", "http3", "http/3", "quic"],
    transports: ["tcp", "udp"],
    description: {
      en: "Encrypted web traffic; HTTP/3 commonly uses UDP.",
      ru: "Шифрованный веб-трафик; HTTP/3 обычно использует UDP.",
    },
  },
  {
    port: 445,
    service: "SMB",
    aliases: ["microsoft-ds", "file sharing"],
    transports: ["tcp"],
    description: {
      en: "SMB file and printer sharing.",
      ru: "Общий доступ SMB к файлам и принтерам.",
    },
  },
  {
    port: 465,
    service: "Message submission over TLS",
    aliases: ["submissions", "smtps"],
    transports: ["tcp"],
    description: {
      en: "Email message submission with implicit TLS.",
      ru: "Отправка почтовых сообщений с неявным TLS.",
    },
  },
  {
    port: 514,
    service: "Syslog",
    aliases: ["system log"],
    transports: ["udp"],
    description: {
      en: "Traditional transport for system log messages.",
      ru: "Традиционный транспорт сообщений системного журнала.",
    },
  },
  {
    port: 587,
    service: "Message submission",
    aliases: ["submission", "smtp submission"],
    transports: ["tcp"],
    description: {
      en: "Authenticated email submission by clients.",
      ru: "Аутентифицированная отправка почты клиентами.",
    },
  },
  {
    port: 631,
    service: "IPP",
    aliases: ["internet printing protocol", "printing"],
    transports: ["tcp"],
    description: {
      en: "Network printing with the Internet Printing Protocol.",
      ru: "Сетевая печать по протоколу Internet Printing Protocol.",
    },
  },
  {
    port: 993,
    service: "IMAPS",
    aliases: ["imap over tls"],
    transports: ["tcp"],
    description: {
      en: "IMAP mailbox access with implicit TLS.",
      ru: "Доступ IMAP к почте с неявным TLS.",
    },
  },
  {
    port: 995,
    service: "POP3S",
    aliases: ["pop3 over tls"],
    transports: ["tcp"],
    description: {
      en: "POP3 mailbox retrieval with implicit TLS.",
      ru: "Получение почты POP3 с неявным TLS.",
    },
  },
  {
    port: 2049,
    service: "NFS",
    aliases: ["network file system"],
    transports: ["tcp", "udp"],
    description: {
      en: "Network File System service.",
      ru: "Служба Network File System.",
    },
  },
  {
    port: 3306,
    service: "MySQL",
    aliases: ["mysql database"],
    transports: ["tcp"],
    description: {
      en: "Common MySQL client connection port.",
      ru: "Распространённый порт клиентских подключений MySQL.",
    },
  },
  {
    port: 3389,
    service: "RDP",
    aliases: ["remote desktop"],
    transports: ["tcp", "udp"],
    description: {
      en: "Remote Desktop Protocol transport.",
      ru: "Транспорт протокола удалённого рабочего стола.",
    },
  },
  {
    port: 5432,
    service: "PostgreSQL",
    aliases: ["postgres", "postgres database"],
    transports: ["tcp"],
    description: {
      en: "Common PostgreSQL client connection port.",
      ru: "Распространённый порт клиентских подключений PostgreSQL.",
    },
  },
  {
    port: 5900,
    service: "VNC",
    aliases: ["remote frame buffer", "rfb"],
    transports: ["tcp"],
    description: {
      en: "Base port commonly associated with VNC remote display.",
      ru: "Базовый порт, обычно связанный с удалённым экраном VNC.",
    },
  },
  {
    port: 6379,
    service: "Redis",
    aliases: ["redis database"],
    transports: ["tcp"],
    description: {
      en: "Common Redis client connection port.",
      ru: "Распространённый порт клиентских подключений Redis.",
    },
  },
  {
    port: 8080,
    service: "HTTP alternate",
    aliases: ["http-alt", "web proxy"],
    transports: ["tcp"],
    description: {
      en: "Common alternate port for HTTP services and proxies.",
      ru: "Распространённый альтернативный порт HTTP-служб и прокси.",
    },
  },
];

export function normalizePortQuery(input: string): string {
  return input.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

export function searchCommonPorts(
  input: string,
  transportFilter: PortTransportFilter = "all",
): PortSearchResult {
  const query = normalizePortQuery(input);
  if (!query) return { kind: "empty" };

  const looksNumeric =
    /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(query) ||
    /^(?:nan|infinity)$/i.test(query);
  let matches: readonly CommonPortRecord[];

  if (looksNumeric) {
    if (!/^\d+$/.test(query)) return { kind: "invalid-port" };
    const port = Number(query);
    if (!Number.isSafeInteger(port) || port < 0 || port > 65535) {
      return { kind: "invalid-port" };
    }
    matches = COMMON_PORTS.filter((entry) => entry.port === port);
  } else {
    matches = COMMON_PORTS.filter((entry) => {
      const names = [entry.service, ...entry.aliases].map((name) =>
        name.toLocaleLowerCase("en-US"),
      );
      return names.some((name) => name.includes(query));
    });
  }

  const filteredMatches = matches.flatMap((entry) => {
    const transports =
      transportFilter === "all"
        ? [...entry.transports]
        : entry.transports.filter((transport) => transport === transportFilter);
    if (transports.length === 0) return [];
    return [
      {
        port: entry.port,
        service: entry.service,
        transports,
        description: entry.description,
      },
    ];
  });

  return { kind: "matches", query, matches: filteredMatches };
}

export default function PortList() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [query, setQuery] = useState("");
  const [transportFilter, setTransportFilter] =
    useState<PortTransportFilter>("all");
  const [result, setResult] = useState<PortSearchResult | null>(null);
  const matches = result?.kind === "matches" ? result.matches : [];

  const resultStatus =
    result?.kind === "matches"
      ? matches.length > 0
        ? "success"
        : "empty"
      : "error";

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn ? "Find a common port" : "Найдите распространённый порт"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Search the bundled reference by an exact port number or a service name."
            : "Ищите в локальном справочнике по точному номеру порта или названию службы."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(searchCommonPorts(query, transportFilter));
          }}
        >
          <Label htmlFor="port-list-query">
            {isEn ? "Port or service" : "Порт или служба"}
          </Label>
          <Input
            id="port-list-query"
            type="search"
            inputMode="search"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setResult(null);
            }}
            placeholder={
              isEn ? "Port number or service" : "Номер порта или служба"
            }
            className="mt-2 h-12"
          />

          <ToolPrimaryAction
            type="submit"
            className="mt-4"
            leadingIcon={
              <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
            }
          >
            {isEn ? "Search reference" : "Найти в справочнике"}
          </ToolPrimaryAction>
        </form>

        {result ? (
          <ToolResult
            status={resultStatus}
            title={
              result.kind === "empty"
                ? isEn
                  ? "Enter a port or service"
                  : "Введите порт или службу"
                : result.kind === "invalid-port"
                  ? isEn
                    ? "Invalid port number"
                    : "Некорректный номер порта"
                  : matches.length > 0
                    ? isEn
                      ? "Common port entries"
                      : "Записи о распространённых портах"
                    : isEn
                      ? "No curated match"
                      : "Нет совпадения в подборке"
            }
            description={
              result.kind === "empty"
                ? isEn
                  ? "Enter a whole port number or a service name."
                  : "Введите целый номер порта или название службы."
                : result.kind === "invalid-port"
                  ? isEn
                    ? "A port number must be a whole value from 0 to 65535."
                    : "Номер порта должен быть целым значением от 0 до 65535."
                  : matches.length > 0
                    ? isEn
                      ? `${matches.length} local reference ${matches.length === 1 ? "entry" : "entries"}. No connection or port-state check was performed.`
                      : `Найдено записей в локальном справочнике: ${matches.length}. Подключение и проверка состояния порта не выполнялись.`
                    : isEn
                      ? "The local list has no matching common entry. This does not describe the port’s state on any device."
                      : "В локальном списке нет подходящей распространённой записи. Это ничего не говорит о состоянии порта на устройстве."
            }
            className="mt-5"
            data-port-result-kind={result.kind}
          >
            {matches.length > 0 ? (
              <ul className="space-y-3">
                {matches.map((entry) => (
                  <li
                    key={`${entry.port}-${entry.service}`}
                    className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3"
                  >
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono text-xl font-black tabular-nums text-[var(--color-text)]">
                        {entry.port}
                      </span>
                      <span className="min-w-0 break-words text-sm font-bold text-[var(--color-text)]">
                        {entry.service}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        {entry.transports.map((transport) => (
                          <span
                            key={transport}
                            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs font-semibold uppercase text-[var(--color-text-muted)]"
                          >
                            {transport}
                          </span>
                        ))}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {isEn ? entry.description.en : entry.description.ru}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </ToolResult>
        ) : null}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Transport and source" : "Транспорт и источник"}
          description={
            isEn
              ? "Limit results to TCP or UDP and consult the authoritative registry"
              : "Ограничьте результаты TCP или UDP и сверяйтесь с официальным реестром"
          }
        >
          <Label htmlFor="port-transport-filter">
            {isEn ? "Transport filter" : "Фильтр транспорта"}
          </Label>
          <select
            id="port-transport-filter"
            value={transportFilter}
            onChange={(event) => {
              setTransportFilter(event.target.value as PortTransportFilter);
              setResult(null);
            }}
            className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] sm:max-w-xs"
          >
            <option value="all">{isEn ? "TCP and UDP" : "TCP и UDP"}</option>
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
          </select>

          <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3">
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "This intentionally small local list covers commonly referenced services. For the maintained service-name and port-number registry, use IANA."
                : "Этот намеренно небольшой локальный список охватывает часто упоминаемые службы. Актуальный реестр названий служб и номеров портов ведёт IANA."}
            </p>
            <a
              href={IANA_REGISTRY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
            >
              {isEn ? "IANA service registry" : "Реестр служб IANA"}
              <ArrowSquareOut size={18} aria-hidden="true" />
            </a>
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
