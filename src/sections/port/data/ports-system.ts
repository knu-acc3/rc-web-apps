import { P, type PortDef } from "./types";

/** Well-known (system) ports 0–1023. */
export const PORTS_SYSTEM: PortDef[] = [
  P(0, "tcp,udp", "", false, "legacy", ["Зарезервированный порт", "Reserved port"], [
    "Порт 0 зарезервирован и не используется для обмена данными. В программировании bind() на порт 0 означает «выдай любой свободный порт»: операционная система подставит временный порт из динамического диапазона.",
    "Port 0 is reserved and never carries traffic. In programming, bind() to port 0 means “give me any free port”: the OS picks an ephemeral port from the dynamic range.",
  ], undefined, [65535, 49152], [
    "Пакеты на порт 0 в сети — аномалия: их используют для снятия отпечатков ОС и атак на некорректные реализации стека. Файрволы обычно отбрасывают такой трафик.",
    "Packets to port 0 on the wire are anomalous: they're used for OS fingerprinting and to probe buggy network stacks. Firewalls usually drop them.",
  ]),
  P(7, "tcp,udp", "echo", true, "legacy", ["Echo", "Echo"], [
    "Служба echo возвращает отправителю всё, что получила. Раньше её использовали для проверки связи, сейчас её заменил ping (ICMP).",
    "The echo service sends back whatever it receives. It was once used to test connectivity; ping (ICMP) replaced it.",
  ], "inetd, xinetd", [9, 19, 13], [
    "UDP echo вместе с chargen позволяет устроить бесконечную «петлю» трафика между двумя серверами (атака Fraggle). Отключите службу.",
    "UDP echo together with chargen can create an endless traffic loop between two hosts (the Fraggle attack). Disable it.",
  ]),
  P(9, "tcp,udp,sctp", "discard", true, "legacy", ["Discard", "Discard"], [
    "Discard молча отбрасывает все полученные данные — «чёрная дыра» для тестов. UDP-порт 9 также традиционно используют для пакетов Wake-on-LAN.",
    "Discard silently drops everything it receives — a test “black hole”. UDP port 9 is also the traditional target for Wake-on-LAN magic packets.",
  ], "inetd; Wake-on-LAN", [7, 19]),
  P(13, "tcp,udp", "daytime", true, "legacy", ["Daytime", "Daytime"], [
    "Протокол daytime (RFC 867) возвращает текущие дату и время в текстовом виде. Устарел: время синхронизируют по NTP.",
    "The daytime protocol (RFC 867) returns the current date and time as text. Obsolete: clocks are synced with NTP.",
  ], "inetd", [37, 123]),
  P(17, "tcp,udp", "qotd", true, "legacy", ["Цитата дня (QOTD)", "Quote of the Day (QOTD)"], [
    "Служба «цитата дня» (QOTD, RFC 865) отвечает короткой цитатой. Встречается в основном в учебных задачах и в Windows с компонентом Simple TCP/IP Services.",
    "Quote of the Day (RFC 865) replies with a short quote. Seen mostly in exercises and on Windows with Simple TCP/IP Services installed.",
  ], "Windows Simple TCP/IP Services", [7, 19], [
    "UDP QOTD используется в DDoS-атаках с усилением. Если служба не нужна — отключите её.",
    "UDP QOTD is abused for amplification DDoS. Disable it if you don't need it.",
  ]),
  P(19, "tcp,udp", "chargen", true, "legacy", ["Генератор символов (chargen)", "Character Generator (chargen)"], [
    "Chargen (RFC 864) бесконечно отправляет поток символов — когда-то для тестирования линий связи.",
    "Chargen (RFC 864) sends an endless stream of characters — once used to test lines.",
  ], "inetd", [7, 9, 17], [
    "UDP chargen — классический усилитель DDoS: на маленький запрос с поддельным адресом отвечает большим пакетом. Порт должен быть закрыт.",
    "UDP chargen is a classic amplification vector: a small spoofed request yields a large reply. Keep it closed.",
  ]),
  P(20, "tcp", "ftp-data", true, "file-sharing", ["FTP (данные)", "FTP data"], [
    "Порт 20 — канал данных FTP в активном режиме: сервер сам подключается к клиенту с этого порта, чтобы передать файл. В пассивном режиме вместо него используются случайные порты сервера.",
    "Port 20 is the FTP data channel in active mode: the server connects back to the client from this port to transfer files. Passive mode uses random server ports instead.",
  ], "vsftpd, ProFTPD, FileZilla Server, IIS FTP", [21, 990, 22]),
  P(21, "tcp", "ftp", true, "file-sharing", ["FTP", "FTP"], [
    "Порт 21 — управляющий канал FTP: логин, команды, список файлов. Сами файлы идут по порту 20 (активный режим) или по диапазону пассивных портов.",
    "Port 21 is the FTP control channel: login, commands, directory listings. Files travel over port 20 (active mode) or a passive port range.",
  ], "vsftpd, ProFTPD, Pure-FTPd, FileZilla Server, IIS FTP", [20, 990, 22, 989], [
    "FTP передаёт логин и пароль открытым текстом. Используйте SFTP (порт 22) или FTPS; анонимный FTP с правом записи быстро находят и превращают в склад чужих файлов.",
    "FTP sends usernames and passwords in cleartext. Use SFTP (port 22) or FTPS; anonymous FTP with write access is quickly found and abused as a file dump.",
  ]),
  P(22, "tcp", "ssh", true, "remote-access", ["SSH", "SSH"], [
    "Порт 22 — SSH: защищённый удалённый вход в консоль Linux и сетевых устройств, а также SFTP, SCP, Git по SSH и туннели.",
    "Port 22 is SSH: encrypted remote shell access to Linux and network devices, plus SFTP, SCP, Git over SSH and tunnels.",
  ], "OpenSSH, Dropbear, PuTTY, WinSCP", [2222, 23, 21, 3389], [
    "Открытый SSH непрерывно перебирают боты. Отключите вход по паролю (PasswordAuthentication no) и root-вход, используйте ключи, fail2ban или ограничение по IP. Смена порта уменьшает шум в логах, но не заменяет защиту.",
    "An open SSH port is brute-forced around the clock. Disable password login (PasswordAuthentication no) and root login, use keys, fail2ban or IP allow-lists. Changing the port cuts log noise but isn't real protection.",
  ]),
  P(23, "tcp", "telnet", true, "remote-access", ["Telnet", "Telnet"], [
    "Telnet — старый протокол удалённого доступа к консоли без шифрования. До сих пор встречается на роутерах, камерах и промышленном оборудовании; для проверки портов его клиент тоже используют.",
    "Telnet is an old, unencrypted remote console protocol. It still shows up on routers, cameras and industrial gear; its client is also handy for testing ports.",
  ], "telnetd, BusyBox, Cisco IOS", [22, 2323], [
    "Всё, включая пароль, идёт открытым текстом. Открытый Telnet на IoT-устройствах с паролями по умолчанию — главный источник ботнетов вроде Mirai. Замените на SSH и закройте порт.",
    "Everything, including the password, is sent in cleartext. Open Telnet on IoT devices with default passwords is how botnets like Mirai spread. Replace it with SSH and close the port.",
  ]),
  P(25, "tcp", "smtp", true, "mail", ["SMTP (передача почты между серверами)", "SMTP (server-to-server mail)"], [
    "Порт 25 — SMTP для передачи почты между почтовыми серверами (MTA). Для отправки писем из почтового клиента используйте 587 или 465.",
    "Port 25 is SMTP for relaying mail between mail servers (MTAs). Mail clients should submit on 587 or 465 instead.",
  ], "Postfix, Exim, Sendmail, Microsoft Exchange", [587, 465, 2525, 110, 143], [
    "Многие провайдеры и облака блокируют исходящий порт 25 от клиентов, чтобы заражённые компьютеры не рассылали спам. Неправильно настроенный сервер становится открытым релеем — проверьте, что он не принимает почту для чужих доменов без авторизации.",
    "Many ISPs and clouds block outbound port 25 so infected machines can't spam. A misconfigured server becomes an open relay — make sure it won't relay mail for foreign domains without authentication.",
  ]),
  P(37, "tcp,udp", "time", true, "legacy", ["Time Protocol", "Time Protocol"], [
    "Time Protocol (RFC 868) возвращает время как 32-битное число секунд с 1900 года. Устарел и заменён NTP; счётчик переполнится в 2036 году.",
    "Time Protocol (RFC 868) returns the time as a 32-bit count of seconds since 1900. Superseded by NTP; the counter overflows in 2036.",
  ], "rdate, inetd", [123, 13]),
  P(43, "tcp", "nicname", true, "legacy", ["WHOIS", "WHOIS"], [
    "Порт 43 — протокол WHOIS: запрос сведений о регистрации доменов и IP-адресов у регистраторов и RIR. Постепенно заменяется протоколом RDAP поверх HTTPS.",
    "Port 43 is WHOIS: querying domain and IP registration data from registrars and RIRs. It's being replaced by RDAP over HTTPS.",
  ], "whois, jwhois", [53, 443]),
  P(49, "tcp,udp", "tacacs", true, "directory", ["TACACS+", "TACACS+"], [
    "TACACS+ — протокол аутентификации, авторизации и учёта команд администраторов сетевого оборудования (Cisco, Juniper, Huawei).",
    "TACACS+ handles authentication, authorisation and command accounting for network device administrators (Cisco, Juniper, Huawei).",
  ], "Cisco ISE, tac_plus", [1812, 1813, 389]),
  P(53, "tcp,udp", "domain", true, "network-services", ["DNS", "DNS"], [
    "Порт 53 — DNS: преобразование доменных имён в IP-адреса. Обычные запросы идут по UDP, большие ответы и передача зон (AXFR) — по TCP.",
    "Port 53 is DNS: turning domain names into IP addresses. Queries normally use UDP; large answers and zone transfers (AXFR) use TCP.",
  ], "BIND, Unbound, PowerDNS, dnsmasq, Windows DNS, CoreDNS", [853, 5353, 67, 443], [
    "Открытый рекурсивный DNS-резолвер используют для DDoS с усилением. Разрешайте рекурсию только своим клиентам и запретите передачу зоны (AXFR) посторонним.",
    "Open recursive resolvers are abused for amplification DDoS. Allow recursion only for your own clients and restrict zone transfers (AXFR).",
  ]),
  P(67, "udp", "bootps", true, "network-services", ["DHCP-сервер", "DHCP server"], [
    "На UDP-порту 67 слушает DHCP-сервер, раздающий устройствам IP-адреса, шлюз и DNS. Клиенты отвечают с порта 68.",
    "A DHCP server listens on UDP 67 to hand out IP addresses, gateway and DNS. Clients talk from port 68.",
  ], "ISC Kea, dnsmasq, Windows DHCP, MikroTik", [68, 547, 69], [
    "Посторонний DHCP-сервер в сети (rogue DHCP) может выдать клиентам свой шлюз и DNS и перехватывать трафик. Включите DHCP snooping на коммутаторах.",
    "A rogue DHCP server on the LAN can hand clients its own gateway and DNS and intercept traffic. Enable DHCP snooping on switches.",
  ]),
  P(68, "udp", "bootpc", true, "network-services", ["DHCP-клиент", "DHCP client"], [
    "UDP-порт 68 использует DHCP-клиент: компьютер или телефон получает на него ответы сервера DHCP с настройками сети.",
    "UDP 68 is used by the DHCP client: a computer or phone receives the DHCP server's network settings on it.",
  ], "dhclient, systemd-networkd, Windows", [67, 546]),
  P(69, "udp", "tftp", true, "file-sharing", ["TFTP", "TFTP"], [
    "TFTP — упрощённая передача файлов без аутентификации. Нужен для сетевой загрузки (PXE), прошивки роутеров и IP-телефонов, резервного копирования конфигураций.",
    "TFTP is trivial file transfer with no authentication. It's used for network boot (PXE), flashing routers and IP phones, and backing up configs.",
  ], "tftpd-hpa, dnsmasq, SolarWinds TFTP", [67, 21], [
    "TFTP не проверяет, кто скачивает файлы: открытый в интернет сервер раздаёт конфигурации с паролями. Используйте только в изолированной сети.",
    "TFTP doesn't check who downloads files: an exposed server leaks configs with passwords. Use it only on isolated networks.",
  ]),
  P(70, "tcp", "gopher", true, "legacy", ["Gopher", "Gopher"], [
    "Gopher — текстовый протокол публикации документов, предшественник веба (1991). У него до сих пор есть сообщество энтузиастов.",
    "Gopher is a text-based document protocol that predates the web (1991). It still has an enthusiast community.",
  ], "Gophernicus, Lynx", [80, 79]),
  P(79, "tcp", "finger", true, "legacy", ["Finger", "Finger"], [
    "Finger сообщает сведения о пользователях системы: кто в сети, когда входил. Исторический протокол Unix.",
    "Finger reports information about users on a system: who is logged in and when. A historic Unix protocol.",
  ], "fingerd", [70, 113], [
    "Раскрывает имена учётных записей — удобная подсказка для подбора паролей. Отключите.",
    "It reveals account names — a gift for password guessers. Disable it.",
  ]),
  P(80, "tcp", "http", true, "web", ["HTTP", "HTTP"], [
    "Порт 80 — HTTP, стандартный порт веб-сайтов без шифрования. Сегодня он в основном перенаправляет на HTTPS (443) и нужен для проверки домена при выпуске сертификата Let's Encrypt (HTTP-01).",
    "Port 80 is HTTP, the default port for unencrypted websites. Today it mostly redirects to HTTPS (443) and serves Let's Encrypt HTTP-01 domain validation.",
  ], "nginx, Apache, IIS, Caddy, LiteSpeed", [443, 8080, 8000, 8443], [
    "Всё по HTTP можно подсмотреть и подменить в пути. Держите порт 80 только для редиректа на HTTPS и включите HSTS.",
    "Anything over HTTP can be read and altered in transit. Use port 80 only to redirect to HTTPS and enable HSTS.",
  ]),
  P(81, "tcp", "", false, "web", ["Альтернативный HTTP", "Alternative HTTP"], [
    "Порт 81 часто занимают веб-интерфейсы роутеров, камер и NAS, а также второй сайт на том же сервере, когда 80 занят.",
    "Port 81 is often used by web interfaces of routers, cameras and NAS boxes, or by a second site when 80 is taken.",
  ], undefined, [80, 8080, 8081], [
    "На порту 81 часто висят панели устройств с паролями по умолчанию — их массово находят сканеры. Не пробрасывайте его наружу.",
    "Port 81 often hosts device panels with default passwords, which scanners find en masse. Don't forward it.",
  ]),
  P(88, "tcp,udp", "kerberos", true, "directory", ["Kerberos", "Kerberos"], [
    "Порт 88 — Kerberos: выдача билетов аутентификации (KDC). В сетях Windows его обслуживает контроллер домена Active Directory.",
    "Port 88 is Kerberos: the KDC that issues authentication tickets. On Windows networks it's the Active Directory domain controller.",
  ], "Active Directory, MIT Kerberos, FreeIPA", [464, 389, 636, 3268], [
    "Атаки Kerberoasting и AS-REP roasting добывают хэши паролей сервисных учётных записей. Используйте длинные пароли или gMSA и не открывайте порт наружу.",
    "Kerberoasting and AS-REP roasting extract password hashes of service accounts. Use long passwords or gMSA and don't expose the port.",
  ]),
  P(102, "tcp", "iso-tsap", true, "iot", ["Siemens S7 (ISO-TSAP)", "Siemens S7 (ISO-TSAP)"], [
    "Порт 102 использует протокол S7comm контроллеров Siemens SIMATIC S7 и Microsoft Exchange (устаревший MTA X.400).",
    "Port 102 carries S7comm for Siemens SIMATIC S7 PLCs, and historically the X.400 MTA in Microsoft Exchange.",
  ], "Siemens S7-300/400/1200/1500, TIA Portal", [502, 4840, 44818], [
    "S7comm без защиты позволяет читать и менять программу контроллера. Контроллеры с открытым портом 102 регулярно находят через Shodan — держите их за файрволом.",
    "Unprotected S7comm lets anyone read and change the PLC program. PLCs with port 102 open are regularly found via Shodan — keep them behind a firewall.",
  ]),
  P(110, "tcp", "pop3", true, "mail", ["POP3", "POP3"], [
    "Порт 110 — POP3 без шифрования: почтовый клиент скачивает письма с сервера. Защищённая версия работает на порту 995.",
    "Port 110 is plain POP3: a mail client downloads messages from the server. The encrypted version uses port 995.",
  ], "Dovecot, Courier, Microsoft Exchange", [995, 143, 993, 25], [
    "Без STARTTLS пароль передаётся открытым текстом. Используйте 995 (POP3S) и отключите вход без шифрования.",
    "Without STARTTLS the password is sent in cleartext. Use 995 (POP3S) and disable unencrypted login.",
  ]),
  P(111, "tcp,udp", "sunrpc", true, "file-sharing", ["rpcbind / portmapper", "rpcbind / portmapper"], [
    "rpcbind сообщает клиентам, на каких портах работают RPC-службы Unix, прежде всего NFS (mountd, nlockmgr, statd).",
    "rpcbind tells clients which ports Unix RPC services use — above all NFS (mountd, nlockmgr, statd).",
  ], "rpcbind, NFS", [2049, 135], [
    "Открытый rpcbind раскрывает список служб и используется для DDoS с усилением по UDP. Закройте его снаружи.",
    "An exposed rpcbind reveals running services and is abused for UDP amplification. Block it externally.",
  ]),
  P(113, "tcp", "ident", true, "legacy", ["Ident", "Ident"], [
    "Ident (RFC 1413) сообщает, какой пользователь владеет TCP-соединением. Его до сих пор запрашивают некоторые IRC-серверы.",
    "Ident (RFC 1413) reports which user owns a TCP connection. Some IRC servers still query it.",
  ], "oidentd", [6667, 79]),
  P(119, "tcp", "nntp", true, "legacy", ["NNTP (Usenet)", "NNTP (Usenet)"], [
    "NNTP — протокол групп новостей Usenet: чтение и публикация сообщений. Защищённый вариант — порт 563.",
    "NNTP is the Usenet newsgroup protocol for reading and posting articles. The encrypted variant is port 563.",
  ], "INN, Leafnode, SABnzbd", [563, 25]),
  P(123, "udp", "ntp", true, "network-services", ["NTP", "NTP"], [
    "Порт 123 — NTP, синхронизация времени с точностью до миллисекунд. Серверы, роутеры и компьютеры сверяют часы с pool.ntp.org, time.windows.com и другими.",
    "Port 123 is NTP, keeping clocks synced to milliseconds. Servers, routers and PCs sync with pool.ntp.org, time.windows.com and others.",
  ], "chrony, ntpd, systemd-timesyncd, Windows Time", [37, 53], [
    "Старые ntpd с командой monlist давали усиление трафика в сотни раз — одна из крупнейших DDoS-волн 2014 года. Обновите ntpd или используйте chrony и не отвечайте на запросы управления извне.",
    "Old ntpd with the monlist command amplified traffic hundreds of times — one of the largest DDoS waves of 2014. Update ntpd or use chrony and ignore external control queries.",
  ]),
  P(135, "tcp,udp", "epmap", true, "directory", ["Microsoft RPC", "Microsoft RPC"], [
    "Порт 135 — сопоставитель конечных точек RPC (DCE/RPC endpoint mapper) Windows. Через него работают DCOM, WMI, Active Directory, Exchange; сами службы затем используют динамические порты 49152–65535.",
    "Port 135 is the Windows DCE/RPC endpoint mapper. DCOM, WMI, Active Directory and Exchange start here, then services move to dynamic ports 49152–65535.",
  ], "Windows RPC", [445, 139, 49152, 88], [
    "Через RPC распространялся червь Blaster (2003). Порт 135 никогда не должен быть доступен из интернета.",
    "The Blaster worm (2003) spread through RPC. Port 135 must never be reachable from the Internet.",
  ]),
  P(137, "udp", "netbios-ns", true, "file-sharing", ["NetBIOS Name Service", "NetBIOS Name Service"], [
    "NetBIOS Name Service разрешает NetBIOS-имена компьютеров Windows в локальной сети — старый механизм до повсеместного DNS.",
    "NetBIOS Name Service resolves Windows NetBIOS computer names on a LAN — a legacy mechanism predating universal DNS.",
  ], "Windows, Samba (nmbd)", [138, 139, 445, 5355], [
    "Ответы NetBIOS можно подделать (атака NBT-NS poisoning) и перехватить хэши паролей. Отключите NetBIOS over TCP/IP, если он не нужен.",
    "NetBIOS replies can be spoofed (NBT-NS poisoning) to capture password hashes. Disable NetBIOS over TCP/IP if unused.",
  ]),
  P(138, "udp", "netbios-dgm", true, "file-sharing", ["NetBIOS Datagram Service", "NetBIOS Datagram Service"], [
    "NetBIOS Datagram Service — широковещательные сообщения Windows в локальной сети, например для «Сетевого окружения» (браузер компьютеров).",
    "NetBIOS Datagram Service carries Windows LAN broadcasts, e.g. the legacy Computer Browser service behind “Network Neighborhood”.",
  ], "Windows, Samba (nmbd)", [137, 139, 445]),
  P(139, "tcp", "netbios-ssn", true, "file-sharing", ["NetBIOS Session (SMB поверх NetBIOS)", "NetBIOS Session (SMB over NetBIOS)"], [
    "Порт 139 — SMB поверх NetBIOS: доступ к общим папкам и принтерам Windows по старой схеме. Современные системы используют прямой SMB на порту 445.",
    "Port 139 is SMB over NetBIOS: legacy access to Windows shares and printers. Modern systems use direct SMB on port 445.",
  ], "Windows, Samba (smbd)", [445, 137, 138], [
    "Как и 445, порт должен быть закрыт снаружи: через SMB распространяются черви и шифровальщики.",
    "Like 445, keep it closed externally: worms and ransomware spread through SMB.",
  ]),
  P(143, "tcp", "imap", true, "mail", ["IMAP", "IMAP"], [
    "Порт 143 — IMAP: почтовый клиент работает с письмами прямо на сервере, синхронизируя папки между устройствами. С шифрованием — через STARTTLS или на порту 993.",
    "Port 143 is IMAP: the mail client works with messages on the server, syncing folders across devices. Encryption via STARTTLS or on port 993.",
  ], "Dovecot, Cyrus, Microsoft Exchange", [993, 110, 995, 587], [
    "Разрешайте вход только после STARTTLS или переведите клиентов на 993 — иначе пароли идут открытым текстом.",
    "Allow login only after STARTTLS or move clients to 993 — otherwise passwords travel in cleartext.",
  ]),
  P(161, "udp", "snmp", true, "network-services", ["SNMP", "SNMP"], [
    "Порт 161 — SNMP: система мониторинга опрашивает роутеры, коммутаторы, принтеры и серверы (загрузка, трафик, ошибки).",
    "Port 161 is SNMP: monitoring systems poll routers, switches, printers and servers (load, traffic, errors).",
  ], "Net-SNMP, Zabbix, PRTG, LibreNMS", [162, 514, 10050], [
    "SNMP v1/v2c защищён только «community»-строкой, часто public/private по умолчанию, — по ней можно прочитать, а иногда и изменить конфигурацию. Используйте SNMPv3 и закройте порт снаружи; открытый SNMP ещё и усиливает DDoS.",
    "SNMP v1/v2c is protected only by a community string, often the default public/private, which may allow reading or even changing config. Use SNMPv3 and block external access; open SNMP also amplifies DDoS.",
  ]),
  P(162, "udp", "snmptrap", true, "network-services", ["SNMP trap", "SNMP traps"], [
    "На порт 162 устройства сами отправляют уведомления SNMP (trap) о событиях: падении интерфейса, перегреве, ошибке питания.",
    "Devices send unsolicited SNMP notifications (traps) to port 162: interface down, overheating, power faults.",
  ], "snmptrapd, Zabbix, PRTG", [161, 514]),
  P(179, "tcp", "bgp", true, "network-services", ["BGP", "BGP"], [
    "Порт 179 — BGP, протокол маршрутизации между автономными системами интернета. Также используется в дата-центрах и Kubernetes (Calico, MetalLB).",
    "Port 179 is BGP, the routing protocol between the Internet's autonomous systems. Also used inside data centres and Kubernetes (Calico, MetalLB).",
  ], "FRRouting, BIRD, Cisco, Juniper, Calico", [520], [
    "Принимайте соединения только от известных соседей (ACL, TCP-MD5 или TCP-AO), используйте RPKI для защиты от перехвата маршрутов.",
    "Accept sessions only from known peers (ACLs, TCP-MD5 or TCP-AO) and use RPKI against route hijacks.",
  ]),
  P(194, "tcp", "irc", true, "messaging", ["IRC (официальный порт)", "IRC (official port)"], [
    "IANA закрепила за IRC порт 194, но на практике серверы почти всегда слушают 6667 (без шифрования) и 6697 (TLS), чтобы не требовать прав root.",
    "IANA assigned port 194 to IRC, but in practice servers almost always use 6667 (plain) and 6697 (TLS) so they don't need root.",
  ], "UnrealIRCd, InspIRCd", [6667, 6697]),
  P(389, "tcp,udp", "ldap", true, "directory", ["LDAP", "LDAP"], [
    "Порт 389 — LDAP: запросы к службам каталогов (Active Directory, OpenLDAP, FreeIPA) — пользователи, группы, аутентификация приложений.",
    "Port 389 is LDAP: queries to directory services (Active Directory, OpenLDAP, FreeIPA) for users, groups and app authentication.",
  ], "Active Directory, OpenLDAP, 389 Directory Server, FreeIPA", [636, 3268, 88, 3269], [
    "Простой bind по LDAP передаёт пароль открытым текстом; UDP 389 (CLDAP) используют для DDoS с усилением. Требуйте LDAP signing, StartTLS или LDAPS (636) и закройте порт снаружи.",
    "A simple LDAP bind sends the password in cleartext, and UDP 389 (CLDAP) is abused for amplification. Require LDAP signing, StartTLS or LDAPS (636) and block external access.",
  ]),
  P(427, "tcp,udp", "svrloc", true, "network-services", ["SLP (Service Location Protocol)", "SLP (Service Location Protocol)"], [
    "SLP позволяет устройствам находить службы в локальной сети. Его включают VMware ESXi, некоторые принтеры и NAS.",
    "SLP lets devices discover services on a LAN. VMware ESXi, some printers and NAS boxes enable it.",
  ], "OpenSLP, VMware ESXi", [902, 5353], [
    "Уязвимость OpenSLP в ESXi использовалась в массовой атаке шифровальщика ESXiArgs в 2023 году, а SLP ещё и даёт огромное усиление DDoS. Отключите службу slpd, если она не нужна.",
    "An OpenSLP flaw in ESXi fuelled the mass ESXiArgs ransomware campaign in 2023, and SLP also enables huge DDoS amplification. Disable slpd if unused.",
  ]),
  P(443, "tcp,udp", "https", true, "web", ["HTTPS", "HTTPS"], [
    "Порт 443 — HTTPS, то есть HTTP поверх TLS: стандартный порт защищённых сайтов и API. По UDP 443 работает HTTP/3 (QUIC). На этот же порт часто ставят VPN (OpenVPN TCP, SSTP), чтобы обходить фильтры.",
    "Port 443 is HTTPS, HTTP over TLS: the standard port for secure websites and APIs. HTTP/3 (QUIC) runs on UDP 443. VPNs (OpenVPN TCP, SSTP) often use it too to get through filters.",
  ], "nginx, Apache, IIS, Caddy, HAProxy, Cloudflare", [80, 8443, 853, 1194], [
    "Сам порт открывать нужно, но следите за TLS: отключите TLS 1.0/1.1, используйте актуальные шифры, вовремя продлевайте сертификаты и включите HSTS.",
    "The port is meant to be open, but keep TLS healthy: disable TLS 1.0/1.1, use modern ciphers, renew certificates on time and enable HSTS.",
  ]),
  P(445, "tcp", "microsoft-ds", true, "file-sharing", ["SMB (общие папки Windows)", "SMB (Windows file sharing)"], [
    "Порт 445 — SMB напрямую поверх TCP: общие папки и принтеры Windows, Samba в Linux, сетевые хранилища. Также через него работают удалённое управление и Active Directory.",
    "Port 445 is SMB directly over TCP: Windows shares and printers, Samba on Linux, NAS devices. Remote administration and Active Directory rely on it too.",
  ], "Windows, Samba, Synology, QNAP", [139, 137, 135, 2049], [
    "Через открытый порт 445 в 2017 году распространились WannaCry и NotPetya (эксплойт EternalBlue для SMBv1). Никогда не открывайте его в интернет, отключите SMBv1; многие провайдеры сами блокируют этот порт.",
    "WannaCry and NotPetya spread through open port 445 in 2017 (the EternalBlue exploit for SMBv1). Never expose it to the Internet and disable SMBv1; many ISPs block it outright.",
  ]),
  P(464, "tcp,udp", "kpasswd", true, "directory", ["Kerberos: смена пароля", "Kerberos password change"], [
    "Порт 464 обслуживает смену пароля в Kerberos (kpasswd) — в том числе когда пользователь домена Windows меняет пароль.",
    "Port 464 handles Kerberos password changes (kpasswd), including when a Windows domain user changes their password.",
  ], "Active Directory, MIT Kerberos", [88, 389]),
  P(465, "tcp", "submissions", true, "mail", ["SMTPS (отправка почты с TLS)", "SMTPS (mail submission over TLS)"], [
    "Порт 465 — отправка писем почтовым клиентом через SMTP сразу поверх TLS (implicit TLS). Когда-то считался устаревшим, но RFC 8314 (2018) снова рекомендует его для отправки.",
    "Port 465 is mail submission over SMTP wrapped in TLS from the start (implicit TLS). Once deprecated, it's recommended again by RFC 8314 (2018).",
  ], "Postfix, Exim, Gmail, Yandex Mail, Mail.ru", [587, 25, 993], [
    "Требуйте аутентификацию и ограничивайте частоту отправки, иначе украденная учётная запись быстро превратится в источник спама.",
    "Require authentication and rate-limit sending, or a stolen account quickly becomes a spam source.",
  ]),
  P(500, "udp", "isakmp", true, "vpn-proxy", ["IPsec IKE", "IPsec IKE"], [
    "UDP 500 — IKE (Internet Key Exchange): согласование ключей для IPsec VPN (IKEv1 и IKEv2). Если между узлами есть NAT, обмен переходит на порт 4500.",
    "UDP 500 is IKE (Internet Key Exchange), negotiating keys for IPsec VPNs (IKEv1 and IKEv2). Behind NAT the exchange moves to port 4500.",
  ], "strongSwan, Libreswan, Windows, Cisco, MikroTik", [4500, 1701, 1194, 51820], [
    "Отключите IKEv1 с агрессивным режимом и PSK — он позволяет перебрать общий ключ офлайн. Используйте IKEv2 с сертификатами.",
    "Disable IKEv1 aggressive mode with PSK — it allows offline cracking of the shared key. Use IKEv2 with certificates.",
  ]),
  P(502, "tcp", "mbap", true, "iot", ["Modbus TCP", "Modbus TCP"], [
    "Порт 502 — Modbus TCP, простой и самый распространённый промышленный протокол: SCADA читает и записывает регистры контроллеров, счётчиков, частотников.",
    "Port 502 is Modbus TCP, the simplest and most common industrial protocol: SCADA reads and writes registers of PLCs, meters and drives.",
  ], "PLC, SCADA, Node-RED, Home Assistant", [102, 20000, 4840, 47808], [
    "В Modbus нет аутентификации и шифрования: любой, кто подключился, может изменить уставки оборудования. Порт должен быть доступен только в изолированной технологической сети.",
    "Modbus has no authentication or encryption: anyone who connects can change equipment set-points. Reach it only inside an isolated OT network.",
  ]),
  P(512, "tcp", "exec", true, "legacy", ["rexec", "rexec"], [
    "rexec — старая служба Unix для удалённого выполнения команд с передачей пароля открытым текстом.",
    "rexec is an old Unix service for remote command execution that sends the password in cleartext.",
  ], "inetd", [513, 514, 22], [
    "Устаревшая и небезопасная служба — замените на SSH.",
    "Obsolete and insecure — replace with SSH.",
  ]),
  P(513, "tcp", "login", true, "legacy", ["rlogin", "rlogin"], [
    "rlogin — удалённый вход в Unix-системы без шифрования, с «доверием» по файлу .rhosts. Полностью вытеснен SSH.",
    "rlogin is unencrypted remote login to Unix systems with .rhosts trust. Fully replaced by SSH.",
  ], "inetd", [512, 514, 22], [
    "Доверие по .rhosts легко обмануть подменой адреса. Отключите rlogin.",
    "The .rhosts trust model is easily fooled by address spoofing. Disable rlogin.",
  ]),
  P(514, "tcp,udp", "syslog", true, "network-services", ["Syslog (UDP) / rsh (TCP)", "Syslog (UDP) / rsh (TCP)"], [
    "UDP 514 — syslog: устройства и серверы отправляют журналы на центральный сервер логов. Исторически TCP 514 занимал rsh (удалённая оболочка); сегодня на TCP 514 часто принимают и syslog.",
    "UDP 514 is syslog: devices and servers ship logs to a central log server. Historically TCP 514 belonged to rsh (remote shell); today TCP 514 often receives syslog too.",
  ], "rsyslog, syslog-ng, Graylog, Splunk", [6514, 162, 161], [
    "Syslog по UDP не шифруется и не подтверждает доставку; логи можно подделать. Для передачи через недоверенные сети используйте syslog over TLS (6514).",
    "UDP syslog is unencrypted and unacknowledged; logs can be spoofed. Across untrusted networks use syslog over TLS (6514).",
  ]),
  P(515, "tcp", "printer", true, "printing", ["LPD (печать)", "LPD (printing)"], [
    "LPD/LPR — старый протокол печати Unix, который до сих пор поддерживают почти все сетевые принтеры.",
    "LPD/LPR is the old Unix printing protocol that nearly every network printer still supports.",
  ], "CUPS, Windows LPD, HP, Canon, Kyocera", [631, 9100]),
  P(520, "udp", "router", true, "network-services", ["RIP", "RIP"], [
    "UDP 520 — RIP (Routing Information Protocol), простой протокол динамической маршрутизации для небольших сетей. Для IPv6 используется RIPng на порту 521.",
    "UDP 520 is RIP (Routing Information Protocol), a simple dynamic routing protocol for small networks. RIPng for IPv6 uses port 521.",
  ], "Quagga, FRRouting, MikroTik, Cisco", [179], [
    "RIPv1 и RIPv2 без аутентификации позволяют внедрить ложные маршруты. Включите аутентификацию MD5 или используйте OSPF.",
    "RIPv1 and unauthenticated RIPv2 let attackers inject false routes. Enable MD5 authentication or use OSPF.",
  ]),
  P(546, "udp", "dhcpv6-client", true, "network-services", ["DHCPv6-клиент", "DHCPv6 client"], [
    "UDP 546 — порт клиента DHCPv6: устройство получает IPv6-адрес, DNS или делегированный префикс от провайдера.",
    "UDP 546 is the DHCPv6 client port: the device receives an IPv6 address, DNS or a delegated prefix from the ISP.",
  ], "dhclient, systemd-networkd, Windows", [547, 68]),
  P(547, "udp", "dhcpv6-server", true, "network-services", ["DHCPv6-сервер", "DHCPv6 server"], [
    "UDP 547 — сервер и ретранслятор DHCPv6 для выдачи IPv6-адресов и префиксов.",
    "UDP 547 is the DHCPv6 server and relay port for handing out IPv6 addresses and prefixes.",
  ], "ISC Kea, dnsmasq, Windows DHCP", [546, 67]),
  P(548, "tcp", "afpovertcp", true, "file-sharing", ["AFP (общий доступ Apple)", "AFP (Apple Filing Protocol)"], [
    "AFP — протокол общего доступа к файлам Apple. Устарел: macOS давно использует SMB, а поддержку AFP-сервера Apple удаляет.",
    "AFP is Apple's file sharing protocol. Deprecated: macOS has long used SMB, and Apple is removing AFP server support.",
  ], "macOS, Netatalk, Time Capsule, NAS", [445, 5353]),
  P(554, "tcp,udp", "rtsp", true, "voip-media", ["RTSP (потоковое видео)", "RTSP (streaming video)"], [
    "Порт 554 — RTSP: управление потоковым видео. Его используют IP-камеры и видеорегистраторы — ссылка вида rtsp://камера:554/stream.",
    "Port 554 is RTSP for controlling media streams. IP cameras and NVRs use it — URLs like rtsp://camera:554/stream.",
  ], "Hikvision, Dahua, VLC, ffmpeg, go2rtc", [8554, 1935, 37777, 34567], [
    "Многие камеры отдают RTSP без пароля или с паролем по умолчанию, и их видео можно найти через поисковики устройств. Не пробрасывайте 554 наружу, смотрите камеры через VPN.",
    "Many cameras serve RTSP without a password or with a default one, and their feeds show up in device search engines. Don't forward 554; view cameras over a VPN.",
  ]),
  P(563, "tcp", "nntps", true, "legacy", ["NNTPS (Usenet с TLS)", "NNTPS (Usenet over TLS)"], [
    "NNTPS — доступ к серверам Usenet поверх TLS. Популярные провайдеры Usenet также используют порт 443.",
    "NNTPS is Usenet access over TLS. Popular Usenet providers also offer port 443.",
  ], "SABnzbd, NZBGet, INN", [119]),
  P(587, "tcp", "submission", true, "mail", ["SMTP Submission (отправка из клиента)", "SMTP submission"], [
    "Порт 587 — отправка почты из почтового клиента или приложения на сервер с авторизацией и шифрованием STARTTLS. Именно его указывают в настройках SMTP в Outlook, Thunderbird и сайтах.",
    "Port 587 is mail submission from a client or app to the server with authentication and STARTTLS. It's the SMTP port you put into Outlook, Thunderbird or a website.",
  ], "Postfix, Exim, Gmail, Microsoft 365, Yandex Mail", [465, 25, 993, 2525], [
    "Разрешайте отправку только после STARTTLS и авторизации; ограничивайте число писем на учётную запись.",
    "Allow sending only after STARTTLS and authentication; rate-limit messages per account.",
  ]),
  P(623, "udp", "asf-rmcp", true, "remote-access", ["IPMI (управление сервером)", "IPMI (server management)"], [
    "UDP 623 — IPMI (RMCP+): внеполосное управление сервером через BMC — iDRAC, iLO, IPMI Supermicro: питание, консоль, датчики.",
    "UDP 623 is IPMI (RMCP+): out-of-band server management through the BMC — iDRAC, iLO, Supermicro IPMI: power, console, sensors.",
  ], "Dell iDRAC, HPE iLO, Supermicro IPMI, ipmitool", [22, 443, 5900], [
    "IPMI 2.0 по дизайну позволяет получить хэш пароля без аутентификации (RAKP), а BMC дают полный контроль над железом. Держите интерфейсы управления в отдельной сети.",
    "IPMI 2.0 by design leaks password hashes before authentication (RAKP), and BMCs give full control of the hardware. Keep management interfaces on a separate network.",
  ]),
  P(631, "tcp,udp", "ipp", true, "printing", ["IPP / CUPS", "IPP / CUPS"], [
    "Порт 631 — IPP (Internet Printing Protocol) и веб-интерфейс CUPS в Linux и macOS (http://localhost:631). По UDP 631 cups-browsed принимал объявления о принтерах.",
    "Port 631 is IPP (Internet Printing Protocol) and the CUPS web UI on Linux and macOS (http://localhost:631). UDP 631 was used by cups-browsed for printer announcements.",
  ], "CUPS, AirPrint, Windows", [515, 9100, 5353], [
    "В 2024 году цепочка уязвимостей cups-browsed на UDP 631 позволяла выполнить код через поддельный принтер. Обновите CUPS, отключите cups-browsed, если он не нужен, и закройте порт снаружи.",
    "In 2024 a chain of cups-browsed flaws on UDP 631 allowed code execution via a fake printer. Update CUPS, disable cups-browsed if unused and block the port externally.",
  ]),
  P(636, "tcp", "ldaps", true, "directory", ["LDAPS (LDAP с TLS)", "LDAPS (LDAP over TLS)"], [
    "Порт 636 — LDAP поверх TLS. Приложения используют его для защищённой аутентификации пользователей через Active Directory или OpenLDAP.",
    "Port 636 is LDAP over TLS. Applications use it to authenticate users against Active Directory or OpenLDAP securely.",
  ], "Active Directory, OpenLDAP, FreeIPA", [389, 3269, 88], [
    "Шифрование защищает пароли в пути, но сам каталог по-прежнему не должен быть доступен из интернета.",
    "TLS protects passwords in transit, but the directory itself still shouldn't be reachable from the Internet.",
  ]),
  P(853, "tcp,udp", "domain-s", true, "network-services", ["DNS over TLS (DoT)", "DNS over TLS (DoT)"], [
    "Порт 853 — DNS поверх TLS (RFC 7858): зашифрованные DNS-запросы. На нём работает «Частный DNS» в Android; по UDP 853 — DNS over QUIC.",
    "Port 853 is DNS over TLS (RFC 7858): encrypted DNS queries. Android's “Private DNS” uses it; UDP 853 carries DNS over QUIC.",
  ], "Unbound, Knot Resolver, AdGuard Home, Cloudflare 1.1.1.1, Google 8.8.8.8", [53, 443]),
  P(873, "tcp", "rsync", true, "file-sharing", ["rsync", "rsync"], [
    "Порт 873 — демон rsync для быстрой синхронизации файлов и зеркал. Чаще rsync запускают поверх SSH, и тогда порт 873 не нужен.",
    "Port 873 is the rsync daemon for fast file and mirror sync. More often rsync runs over SSH, in which case 873 isn't needed.",
  ], "rsync, Synology Hyper Backup", [22, 445], [
    "Модули rsyncd без auth users доступны всем — через них утекают резервные копии. Задайте пароли и hosts allow или используйте rsync через SSH.",
    "rsyncd modules without auth users are open to anyone — backups leak this way. Set passwords and hosts allow, or use rsync over SSH.",
  ]),
  P(902, "tcp,udp", "ideafarm-door", false, "devops", ["VMware ESXi (консоль и управление)", "VMware ESXi (console and management)"], [
    "Порт 902 использует VMware: vSphere Client и Workstation подключаются к хостам ESXi для удалённой консоли ВМ и передачи данных (NFC).",
    "VMware uses port 902: vSphere Client and Workstation connect to ESXi hosts for remote VM consoles and data transfer (NFC).",
  ], "VMware ESXi, vCenter, VMware Workstation", [443, 427, 8006], [
    "Интерфейсы управления гипервизором не должны быть доступны из интернета — ESXi массово атаковали шифровальщики.",
    "Hypervisor management must never face the Internet — ESXi hosts have been mass-targeted by ransomware.",
  ]),
  P(989, "tcp", "ftps-data", true, "file-sharing", ["FTPS (данные)", "FTPS data"], [
    "Порт 989 — канал данных FTPS при неявном TLS (implicit FTPS). На практике FTPS чаще работает как явный TLS на порту 21.",
    "Port 989 is the FTPS data channel with implicit TLS. In practice FTPS usually runs as explicit TLS on port 21.",
  ], "FileZilla Server, vsftpd, IIS FTP", [990, 21, 20]),
  P(990, "tcp", "ftps", true, "file-sharing", ["FTPS (неявный TLS)", "FTPS (implicit TLS)"], [
    "Порт 990 — управляющий канал FTPS с неявным TLS: соединение шифруется с первого байта.",
    "Port 990 is the FTPS control channel with implicit TLS: the connection is encrypted from the first byte.",
  ], "FileZilla Server, IIS FTP, Pure-FTPd", [989, 21, 22]),
  P(993, "tcp", "imaps", true, "mail", ["IMAPS (IMAP с TLS)", "IMAPS (IMAP over TLS)"], [
    "Порт 993 — IMAP поверх TLS: основной порт для получения почты в Outlook, Thunderbird, Apple Mail и на телефонах.",
    "Port 993 is IMAP over TLS: the main port for receiving mail in Outlook, Thunderbird, Apple Mail and on phones.",
  ], "Dovecot, Gmail, Microsoft 365, Yandex Mail, Mail.ru", [143, 995, 587, 465], [
    "Шифрование закрывает пароль, но перебор паролей по 993 идёт постоянно — ограничивайте попытки и используйте пароли приложений или OAuth.",
    "TLS protects the password, but brute-forcing on 993 never stops — limit attempts and use app passwords or OAuth.",
  ]),
  P(995, "tcp", "pop3s", true, "mail", ["POP3S (POP3 с TLS)", "POP3S (POP3 over TLS)"], [
    "Порт 995 — POP3 поверх TLS: клиент скачивает письма с сервера по защищённому соединению.",
    "Port 995 is POP3 over TLS: the client downloads mail over an encrypted connection.",
  ], "Dovecot, Gmail, Yandex Mail, Mail.ru", [110, 993, 143]),
];
