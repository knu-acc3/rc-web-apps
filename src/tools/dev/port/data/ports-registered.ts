import { P, type PortDef } from "./types";

/** Registered (user) ports 1024–9999. */
export const PORTS_REGISTERED: PortDef[] = [
  P(1080, "tcp", "socks", true, "vpn-proxy", ["SOCKS-прокси", "SOCKS proxy"], [
    "Порт 1080 — стандартный порт SOCKS4/SOCKS5-прокси. Его же по умолчанию открывает туннель ssh -D для динамической переадресации.",
    "Port 1080 is the standard SOCKS4/SOCKS5 proxy port. ssh -D dynamic forwarding opens it by default too.",
  ], "Dante, 3proxy, ssh -D, Shadowsocks clients", [3128, 9050, 8118], [
    "SOCKS без пароля, доступный извне, мгновенно используют для спама и атак от вашего имени. Слушайте 127.0.0.1 или требуйте аутентификацию.",
    "An unauthenticated SOCKS proxy reachable from outside is instantly abused for spam and attacks in your name. Bind to 127.0.0.1 or require authentication.",
  ]),
  P(1119, "tcp,udp", "bnetgame", true, "games", ["Battle.net", "Battle.net"], [
    "Порт 1119 использует клиент Battle.net (Blizzard) для входа и игровых сервисов: World of Warcraft, Overwatch, Diablo.",
    "Port 1119 is used by the Blizzard Battle.net client for login and game services: World of Warcraft, Overwatch, Diablo.",
  ], "Battle.net", [3724, 6112]),
  P(5173, "tcp", "", false, "dev-servers", ["Vite (dev-сервер)", "Vite dev server"], [
    "Порт 5173 — dev-сервер Vite по умолчанию (npm run dev в проектах Vue, React, Svelte, SvelteKit). Число выбрано как «VITE» цифрами: 5 — V, 1 — I, 7 — T, 3 — E.",
    "Port 5173 is the Vite dev server default (npm run dev in Vue, React, Svelte and SvelteKit projects). It spells “VITE” in digits: 5-V, 1-I, 7-T, 3-E.",
  ], "Vite, SvelteKit, Vue, React", [4173, 3000, 4200, 8080], [
    "Vite слушает localhost; флаг --host открывает сервер в сеть, и через уязвимости dev-сервера (например, обход server.fs.deny) можно читать файлы проекта. Используйте --host только в доверенной сети.",
    "Vite listens on localhost; --host exposes it to the network, where dev-server flaws (e.g. server.fs.deny bypasses) can leak project files. Use --host only on trusted networks.",
  ]),
  P(8096, "tcp", "", false, "voip-media", ["Jellyfin / Emby", "Jellyfin / Emby"], [
    "Порт 8096 — веб-интерфейс и API медиасерверов Jellyfin и Emby (HTTPS — 8920).",
    "Port 8096 is the Jellyfin and Emby media server web UI and API (HTTPS on 8920).",
  ], "Jellyfin, Emby", [32400, 1900]),
  P(8161, "tcp", "", false, "messaging", ["ActiveMQ Web Console", "ActiveMQ Web Console"], [
    "Порт 8161 — веб-консоль администрирования Apache ActiveMQ (логин по умолчанию admin/admin).",
    "Port 8161 is the Apache ActiveMQ admin web console (default login admin/admin).",
  ], "Apache ActiveMQ", [61616, 61613], [
    "Смените пароль admin/admin и не открывайте консоль в интернет.",
    "Change the admin/admin password and never expose the console.",
  ]),
  P(1194, "udp,tcp", "openvpn", true, "vpn-proxy", ["OpenVPN", "OpenVPN"], [
    "Порт 1194 — OpenVPN по умолчанию (обычно UDP). При блокировках OpenVPN часто переносят на TCP 443.",
    "Port 1194 is OpenVPN's default (usually UDP). Under censorship OpenVPN is often moved to TCP 443.",
  ], "OpenVPN, OpenVPN Access Server, pfSense, MikroTik", [51820, 500, 4500, 443], [
    "Используйте сертификаты и tls-crypt, чтобы сервер не отвечал на пакеты без ключа — так его сложнее обнаружить и атаковать.",
    "Use certificates and tls-crypt so the server ignores packets without the key — making it harder to find and attack.",
  ]),
  P(1337, "tcp", "", false, "dev-servers", ["Strapi (dev)", "Strapi (dev)"], [
    "Порт 1337 по умолчанию использует headless CMS Strapi; также это шуточный «leet»-порт, который любят в примерах и CTF.",
    "Port 1337 is the default for the Strapi headless CMS; it's also the joke “leet” port popular in examples and CTFs.",
  ], "Strapi", [3000, 8080]),
  P(1433, "tcp", "ms-sql-s", true, "databases", ["Microsoft SQL Server", "Microsoft SQL Server"], [
    "Порт 1433 — стандартный экземпляр Microsoft SQL Server (протокол TDS). Именованные экземпляры используют динамические порты, которые сообщает служба SQL Browser на UDP 1434.",
    "Port 1433 is the default Microsoft SQL Server instance (TDS protocol). Named instances use dynamic ports announced by SQL Browser on UDP 1434.",
  ], "Microsoft SQL Server, Azure SQL", [1434, 3306, 5432, 1521], [
    "Открытый MS SQL постоянно подбирают по учётной записи sa и используют для запуска майнеров через xp_cmdshell. Закройте порт, отключите sa и xp_cmdshell.",
    "Exposed MS SQL is constantly brute-forced for the sa account and abused to run miners via xp_cmdshell. Block the port and disable sa and xp_cmdshell.",
  ]),
  P(1434, "udp", "ms-sql-m", true, "databases", ["SQL Server Browser", "SQL Server Browser"], [
    "UDP 1434 — служба SQL Server Browser: сообщает клиентам порт именованного экземпляра SQL Server.",
    "UDP 1434 is SQL Server Browser: it tells clients which port a named SQL Server instance uses.",
  ], "Microsoft SQL Server", [1433], [
    "Через UDP 1434 в 2003 году за 10 минут распространился червь SQL Slammer. Закройте порт снаружи.",
    "The SQL Slammer worm spread through UDP 1434 in ten minutes in 2003. Block it externally.",
  ]),
  P(1494, "tcp", "ica", true, "remote-access", ["Citrix ICA", "Citrix ICA"], [
    "Порт 1494 — протокол Citrix ICA/HDX для доставки опубликованных приложений и рабочих столов. С надёжностью сессий трафик идёт через порт 2598.",
    "Port 1494 is Citrix ICA/HDX for delivering published apps and desktops. With session reliability traffic uses port 2598.",
  ], "Citrix Virtual Apps and Desktops", [2598, 3389, 443]),
  P(1521, "tcp", "", false, "databases", ["Oracle Database (листенер)", "Oracle Database listener"], [
    "Порт 1521 — листенер Oracle Database (TNS). Официально IANA закрепила за Oracle порт 2483, но исторически повсеместно используется 1521.",
    "Port 1521 is the Oracle Database TNS listener. IANA officially assigned 2483 to Oracle, but 1521 is used almost everywhere by tradition.",
  ], "Oracle Database", [1433, 3306, 5432], [
    "Открытый листенер позволяет перебирать SID и учётные записи. Используйте файрвол, валидацию узлов (tcp.validnode_checking) и шифрование Oracle Native Network Encryption.",
    "An exposed listener allows SID and account guessing. Use a firewall, node validation (tcp.validnode_checking) and Oracle native network encryption.",
  ]),
  P(1701, "udp", "l2tp", true, "vpn-proxy", ["L2TP", "L2TP"], [
    "UDP 1701 — L2TP, туннелирующий протокол; как VPN используется в связке L2TP/IPsec (ещё порты 500 и 4500). Встроен в Windows, macOS, iOS и Android старых версий.",
    "UDP 1701 is L2TP, a tunnelling protocol used as a VPN in the L2TP/IPsec combo (with ports 500 and 4500). Built into Windows, macOS, iOS and older Android.",
  ], "strongSwan + xl2tpd, MikroTik, Windows RRAS", [500, 4500, 1723], [
    "L2TP без IPsec ничего не шифрует. Не открывайте 1701 отдельно — только через IPsec.",
    "L2TP without IPsec encrypts nothing. Don't expose 1701 on its own — only inside IPsec.",
  ]),
  P(1719, "udp", "h323gatestat", true, "voip-media", ["H.323 RAS", "H.323 RAS"], [
    "UDP 1719 — регистрация терминалов H.323 на гейткипере (RAS). H.323 — старый стандарт видеоконференций, ещё встречается в переговорных.",
    "UDP 1719 is H.323 RAS, terminals registering with a gatekeeper. H.323 is an old videoconferencing standard still found in meeting rooms.",
  ], "Polycom, Cisco, Avaya", [1720, 5060]),
  P(1720, "tcp", "h323hostcall", true, "voip-media", ["H.323 (установка вызова)", "H.323 call signalling"], [
    "TCP 1720 — сигнализация вызовов H.323 (Q.931): установка и завершение видеозвонков между терминалами и MCU.",
    "TCP 1720 is H.323 call signalling (Q.931): setting up and tearing down video calls between endpoints and MCUs.",
  ], "Polycom, Cisco, Avaya, Asterisk", [1719, 5060], [
    "Открытые H.323-терминалы позволяли подключаться к камерам переговорных без пароля — отключайте автоответ и закрывайте порт снаружи.",
    "Exposed H.323 endpoints have let outsiders dial into meeting-room cameras — disable auto-answer and block the port externally.",
  ]),
  P(1723, "tcp", "pptp", true, "vpn-proxy", ["PPTP VPN", "PPTP VPN"], [
    "Порт 1723 — управляющее соединение PPTP VPN; сами данные идут по протоколу GRE (IP-протокол 47), поэтому одного открытого порта недостаточно.",
    "Port 1723 is the PPTP VPN control connection; data flows over GRE (IP protocol 47), so opening the port alone isn't enough.",
  ], "Windows RRAS, MikroTik, pptpd", [1701, 500, 1194], [
    "PPTP с MS-CHAPv2 взломан: перехваченный вход расшифровывается за часы. Переходите на WireGuard, OpenVPN или IKEv2.",
    "PPTP with MS-CHAPv2 is broken: a captured login can be cracked within hours. Move to WireGuard, OpenVPN or IKEv2.",
  ]),
  P(1801, "tcp,udp", "msmq", true, "messaging", ["MSMQ", "MSMQ"], [
    "Порт 1801 — Microsoft Message Queuing (MSMQ), очередь сообщений Windows; включается, в частности, вместе с Exchange.",
    "Port 1801 is Microsoft Message Queuing (MSMQ), the Windows message queue, enabled for instance alongside Exchange.",
  ], "Windows MSMQ", [135, 445], [
    "Уязвимость QueueJumper (CVE-2023-21554) позволяла выполнить код на Windows с открытым 1801 без аутентификации. Установите обновления и закройте порт снаружи.",
    "The QueueJumper flaw (CVE-2023-21554) allowed unauthenticated code execution on Windows with 1801 open. Patch and block the port externally.",
  ]),
  P(1812, "udp", "radius", true, "directory", ["RADIUS (аутентификация)", "RADIUS authentication"], [
    "UDP 1812 — RADIUS: проверка логина пользователей Wi-Fi WPA2-Enterprise (802.1X), VPN и сетевого оборудования.",
    "UDP 1812 is RADIUS authentication for WPA2-Enterprise Wi-Fi (802.1X), VPN users and network gear.",
  ], "FreeRADIUS, Microsoft NPS, Cisco ISE", [1813, 49, 389], [
    "Классический RADIUS защищён только общим секретом и MD5; атака Blast-RADIUS (2024) позволяла подделывать ответы. Используйте длинные секреты, Message-Authenticator и RadSec (RADIUS over TLS).",
    "Classic RADIUS relies on a shared secret and MD5; the 2024 Blast-RADIUS attack allowed forging replies. Use long secrets, Message-Authenticator and RadSec (RADIUS over TLS).",
  ]),
  P(1813, "udp", "radius-acct", true, "directory", ["RADIUS (учёт)", "RADIUS accounting"], [
    "UDP 1813 — учёт RADIUS (accounting): начало и конец сессий, трафик — для биллинга провайдеров и журналов доступа.",
    "UDP 1813 is RADIUS accounting: session start/stop and traffic — for ISP billing and access logs.",
  ], "FreeRADIUS, Microsoft NPS", [1812]),
  P(1880, "tcp", "", false, "iot", ["Node-RED", "Node-RED"], [
    "Порт 1880 — веб-редактор и HTTP-эндпоинты Node-RED, визуальной среды автоматизации для IoT и умного дома.",
    "Port 1880 serves the Node-RED web editor and HTTP endpoints — a visual automation tool for IoT and smart homes.",
  ], "Node-RED", [1883, 8123], [
    "Редактор Node-RED без пароля позволяет выполнить любой код на сервере. Включите adminAuth и не открывайте порт в интернет.",
    "An unprotected Node-RED editor allows arbitrary code execution. Enable adminAuth and never expose the port.",
  ]),
  P(1883, "tcp", "mqtt", true, "iot", ["MQTT", "MQTT"], [
    "Порт 1883 — MQTT без шифрования: лёгкий протокол публикации и подписки для датчиков, умного дома и IoT. Версия с TLS работает на 8883.",
    "Port 1883 is plain MQTT, a lightweight publish/subscribe protocol for sensors, smart homes and IoT. The TLS version runs on 8883.",
  ], "Mosquitto, EMQX, HiveMQ, Home Assistant", [8883, 5683, 1880], [
    "Брокеры без пароля раскрывают данные датчиков и позволяют управлять устройствами. Отключите анонимный доступ (allow_anonymous false) и используйте 8883 с TLS.",
    "Brokers without passwords leak sensor data and let anyone control devices. Disable anonymous access (allow_anonymous false) and use 8883 with TLS.",
  ]),
  P(1900, "udp", "ssdp", true, "network-services", ["SSDP (UPnP)", "SSDP (UPnP)"], [
    "UDP 1900 — SSDP, обнаружение устройств UPnP в локальной сети: роутеры, телевизоры, медиасерверы и принтеры объявляют о себе.",
    "UDP 1900 is SSDP, UPnP device discovery on a LAN: routers, TVs, media servers and printers announce themselves.",
  ], "MiniUPnP, Windows, DLNA, Smart TV", [5353, 3702, 5351], [
    "SSDP, отвечающий из интернета, даёт DDoS-усиление в десятки раз, а UPnP на роутере позволяет программам открывать порты без спроса. Отключите UPnP на WAN-интерфейсе.",
    "SSDP answering from the Internet amplifies DDoS dozens of times, and UPnP on a router lets software open ports without asking. Disable UPnP on the WAN side.",
  ]),
  P(1911, "tcp", "mtp", true, "iot", ["Niagara Fox", "Niagara Fox"], [
    "Порт 1911 — протокол Fox платформы Tridium Niagara для автоматизации зданий (климат, освещение, доступ).",
    "Port 1911 is the Fox protocol of the Tridium Niagara building automation platform (HVAC, lighting, access).",
  ], "Tridium Niagara", [47808, 502, 4840], [
    "Контроллеры зданий в интернете позволяют управлять климатом и замками. Держите их в изолированной сети.",
    "Building controllers on the Internet let outsiders control HVAC and locks. Keep them on isolated networks.",
  ]),
  P(1935, "tcp", "rtmp", true, "voip-media", ["RTMP (стриминг)", "RTMP (streaming)"], [
    "Порт 1935 — RTMP: отправка видеопотока из OBS на Twitch, YouTube, VK Видео и медиасерверы. Защищённый вариант RTMPS работает поверх TLS на 443.",
    "Port 1935 is RTMP: pushing a live stream from OBS to Twitch, YouTube and media servers. The secure RTMPS variant runs over TLS on 443.",
  ], "OBS, nginx-rtmp, Wowza, SRS", [554, 443]),
  P(2000, "tcp", "cisco-sccp", true, "voip-media", ["Cisco SCCP (Skinny)", "Cisco SCCP (Skinny)"], [
    "Порт 2000 — SCCP (Skinny), протокол IP-телефонов Cisco. Его же MikroTik RouterOS использует для bandwidth-test.",
    "Port 2000 is SCCP (Skinny), the Cisco IP phone protocol. MikroTik RouterOS also uses it for bandwidth tests.",
  ], "Cisco Unified CM, MikroTik", [5060, 8291]),
  P(2049, "tcp,udp", "nfs", true, "file-sharing", ["NFS", "NFS"], [
    "Порт 2049 — NFS, сетевая файловая система Unix/Linux. NFSv4 работает только через 2049, старым версиям нужен ещё rpcbind (111) и динамические порты.",
    "Port 2049 is NFS, the Unix/Linux network file system. NFSv4 needs only 2049; older versions also need rpcbind (111) and dynamic ports.",
  ], "Linux nfsd, NetApp, Synology, AWS EFS", [111, 445, 3260], [
    "NFSv3 доверяет UID клиента: любой, кто подключился, может выдать себя за другого пользователя. Экспортируйте только в доверенные подсети, используйте root_squash и Kerberos (sec=krb5).",
    "NFSv3 trusts the client's UID: anyone who connects can impersonate other users. Export to trusted subnets only, use root_squash and Kerberos (sec=krb5).",
  ]),
  P(2082, "tcp", "", false, "web", ["cPanel (HTTP)", "cPanel (HTTP)"], [
    "Порт 2082 — панель управления хостингом cPanel без шифрования; защищённый вход — на 2083.",
    "Port 2082 is the cPanel hosting control panel without encryption; secure login is on 2083.",
  ], "cPanel", [2083, 2086, 2087, 2095]),
  P(2083, "tcp", "", false, "web", ["cPanel (HTTPS)", "cPanel (HTTPS)"], [
    "Порт 2083 — вход в cPanel по HTTPS: https://ваш-домен:2083. Панель клиента хостинга для сайтов, почты и баз данных.",
    "Port 2083 is cPanel over HTTPS: https://your-domain:2083 — the hosting customer panel for sites, mail and databases.",
  ], "cPanel", [2082, 2087, 2096], [
    "Панель хостинга — лакомая цель для перебора паролей. Включите двухфакторную аутентификацию cPanel и cPHulk.",
    "Hosting panels are prime brute-force targets. Enable cPanel two-factor authentication and cPHulk.",
  ]),
  P(2086, "tcp", "", false, "web", ["WHM (HTTP)", "WHM (HTTP)"], [
    "Порт 2086 — WebHost Manager (WHM), администраторская панель сервера cPanel без шифрования; с HTTPS — 2087.",
    "Port 2086 is WebHost Manager (WHM), the cPanel server admin panel without encryption; HTTPS is 2087.",
  ], "cPanel WHM", [2087, 2083]),
  P(2087, "tcp", "", false, "web", ["WHM (HTTPS)", "WHM (HTTPS)"], [
    "Порт 2087 — WebHost Manager по HTTPS: управление сервером cPanel, аккаунтами и тарифами.",
    "Port 2087 is WebHost Manager over HTTPS: managing a cPanel server, accounts and packages.",
  ], "cPanel WHM", [2086, 2083], [
    "WHM даёт root-доступ к серверу. Ограничьте доступ по IP (Host Access Control) и включите 2FA.",
    "WHM grants root-level control. Restrict it by IP (Host Access Control) and enable 2FA.",
  ]),
  P(2095, "tcp", "", false, "mail", ["cPanel Webmail (HTTP)", "cPanel Webmail (HTTP)"], [
    "Порт 2095 — веб-почта cPanel (Roundcube) без шифрования; защищённый вход — на 2096.",
    "Port 2095 is cPanel webmail (Roundcube) without encryption; secure login is on 2096.",
  ], "cPanel, Roundcube", [2096, 2083]),
  P(2096, "tcp", "", false, "mail", ["cPanel Webmail (HTTPS)", "cPanel Webmail (HTTPS)"], [
    "Порт 2096 — веб-почта cPanel по HTTPS: https://ваш-домен:2096.",
    "Port 2096 is cPanel webmail over HTTPS: https://your-domain:2096.",
  ], "cPanel, Roundcube", [2095, 2083, 993]),
  P(2181, "tcp", "eforward", false, "messaging", ["Apache ZooKeeper", "Apache ZooKeeper"], [
    "Порт 2181 — клиентский порт ZooKeeper: координация распределённых систем, выбор лидера, хранение конфигурации. Исторически нужен Kafka, HBase, Solr и ClickHouse.",
    "Port 2181 is the ZooKeeper client port: coordination, leader election and config storage for distributed systems. Historically required by Kafka, HBase, Solr and ClickHouse.",
  ], "Apache ZooKeeper", [2888, 3888, 9092], [
    "По умолчанию ZooKeeper не требует аутентификации: открытый 2181 позволяет читать и менять конфигурацию кластера. Закройте порт и включите SASL.",
    "By default ZooKeeper requires no authentication: an open 2181 lets anyone read and change cluster config. Block it and enable SASL.",
  ]),
  P(2222, "tcp", "", false, "remote-access", ["Альтернативный SSH", "Alternative SSH"], [
    "Порт 2222 часто выбирают для SSH вместо 22: для второго SSH-сервера, контейнеров (Gitea, GitLab в Docker) или чтобы уменьшить шум от ботов в логах.",
    "Port 2222 is a common alternative for SSH: a second SSH server, containers (Gitea, GitLab in Docker) or just to cut bot noise in logs.",
  ], "OpenSSH, Gitea, GitLab, DirectAdmin", [22, 2375], [
    "Нестандартный порт не защищает от целенаправленного сканирования — применяйте те же меры, что и для 22: ключи, запрет паролей, fail2ban.",
    "A non-standard port doesn't stop a targeted scan — apply the same measures as for 22: keys, no passwords, fail2ban.",
  ]),
  P(2302, "udp", "", false, "games", ["Arma / DayZ", "Arma / DayZ"], [
    "UDP 2302 — игровой порт серверов Arma 2, Arma 3 и DayZ (рядом используются 2303–2306 для Steam-запросов).",
    "UDP 2302 is the game port for Arma 2, Arma 3 and DayZ servers (2303–2306 are used for Steam queries).",
  ], "Arma 3, DayZ", [27015, 7777]),
  P(2323, "tcp", "", false, "remote-access", ["Альтернативный Telnet", "Alternative Telnet"], [
    "Порт 2323 — альтернативный Telnet на роутерах и IoT-устройствах. Его вместе с 23 массово сканировал ботнет Mirai.",
    "Port 2323 is an alternative Telnet port on routers and IoT devices. The Mirai botnet scanned it en masse alongside 23.",
  ], undefined, [23, 22], [
    "Если на устройстве открыт 2323, скорее всего, там Telnet с паролем по умолчанию. Отключите его и смените пароль.",
    "If a device has 2323 open, it's probably Telnet with a default password. Disable it and change the password.",
  ]),
  P(2375, "tcp", "docker", true, "devops", ["Docker API (без TLS)", "Docker API (no TLS)"], [
    "Порт 2375 — Docker Engine API без шифрования. Им управляют контейнерами удалённо: запуск, остановка, образы.",
    "Port 2375 is the Docker Engine API without encryption, used to manage containers remotely: run, stop, images.",
  ], "Docker Engine, Docker Desktop, Portainer", [2376, 2377, 6443], [
    "Открытый 2375 — это root-доступ к серверу для любого: можно запустить контейнер с монтированием / и получить полный контроль. Такие хосты массово заражают майнерами. Используйте Unix-сокет или 2376 с клиентскими сертификатами.",
    "An open 2375 is root access for anyone: run a container mounting / and own the host. Such hosts are mass-infected with miners. Use the Unix socket or 2376 with client certificates.",
  ]),
  P(2376, "tcp", "docker-s", true, "devops", ["Docker API (TLS)", "Docker API (TLS)"], [
    "Порт 2376 — Docker Engine API поверх TLS; клиент подключается с DOCKER_TLS_VERIFY=1 и своими сертификатами.",
    "Port 2376 is the Docker Engine API over TLS; clients connect with DOCKER_TLS_VERIFY=1 and their certificates.",
  ], "Docker Engine, docker-machine", [2375, 2377], [
    "Шифрования мало: проверяйте клиентские сертификаты (tlsverify), иначе доступ получит любой.",
    "TLS alone isn't enough: verify client certificates (tlsverify), or anyone gets in.",
  ]),
  P(2377, "tcp", "swarm", true, "devops", ["Docker Swarm (управление)", "Docker Swarm management"], [
    "Порт 2377 — управление кластером Docker Swarm: узлы-менеджеры принимают на нём подключения рабочих узлов. Ещё Swarm нужны 7946 (TCP/UDP) и 4789/UDP (overlay-сеть).",
    "Port 2377 is Docker Swarm cluster management: managers accept worker connections on it. Swarm also needs 7946 (TCP/UDP) and 4789/UDP (overlay network).",
  ], "Docker Swarm", [7946, 4789, 2376]),
  P(2379, "tcp", "etcd-client", true, "devops", ["etcd (клиенты)", "etcd client API"], [
    "Порт 2379 — клиентский API etcd, распределённого хранилища ключ-значение. В Kubernetes именно там хранится всё состояние кластера, включая Secrets.",
    "Port 2379 is the etcd client API, a distributed key-value store. Kubernetes keeps its entire cluster state there, Secrets included.",
  ], "etcd, Kubernetes", [2380, 6443, 10250], [
    "Доступ к etcd = доступ ко всем секретам Kubernetes. Требуйте клиентские сертификаты (mTLS) и разрешайте подключение только API-серверу.",
    "Access to etcd equals access to every Kubernetes secret. Require client certificates (mTLS) and allow only the API server.",
  ]),
  P(2380, "tcp", "etcd-server", true, "devops", ["etcd (между узлами)", "etcd peer traffic"], [
    "Порт 2380 — обмен между узлами кластера etcd (репликация Raft).",
    "Port 2380 carries peer traffic between etcd cluster members (Raft replication).",
  ], "etcd, Kubernetes", [2379, 6443]),
  P(2404, "tcp", "iec-104", true, "iot", ["IEC 60870-5-104", "IEC 60870-5-104"], [
    "Порт 2404 — протокол телемеханики IEC 104: диспетчерское управление подстанциями и энергосетями.",
    "Port 2404 is IEC 60870-5-104 telecontrol: SCADA for substations and power grids.",
  ], "SCADA, RTU", [20000, 502, 102], [
    "IEC 104 не имеет встроенной аутентификации; его использовали в атаках на энергосистемы (Industroyer). Только изолированные сети.",
    "IEC 104 has no built-in authentication and was used in grid attacks (Industroyer). Isolated networks only.",
  ]),
  P(2456, "udp", "", false, "games", ["Valheim", "Valheim"], [
    "UDP 2456–2458 — порты выделенного сервера Valheim; 2456 — игровой, 2457 — Steam-запросы.",
    "UDP 2456–2458 are Valheim dedicated server ports; 2456 is the game port, 2457 answers Steam queries.",
  ], "Valheim Dedicated Server", [27015, 7777]),
  P(2525, "tcp", "", false, "mail", ["Альтернативный SMTP", "Alternative SMTP"], [
    "Порт 2525 — неофициальный запасной порт SMTP, когда провайдер блокирует 25 и 587. Его предлагают почтовые API: Mailgun, SendGrid, Amazon SES.",
    "Port 2525 is an unofficial fallback SMTP port when an ISP blocks 25 and 587. Mail APIs like Mailgun, SendGrid and Amazon SES offer it.",
  ], "Mailgun, SendGrid, Amazon SES, Postmark", [587, 25, 465]),
  P(2598, "tcp", "citriximaclient", true, "remote-access", ["Citrix CGP (надёжность сессий)", "Citrix CGP (session reliability)"], [
    "Порт 2598 — Citrix Common Gateway Protocol: ICA-трафик с функцией надёжности сессий, которая переподключает сессию при кратковременных сбоях сети.",
    "Port 2598 is Citrix Common Gateway Protocol: ICA traffic with session reliability, reconnecting sessions after brief network drops.",
  ], "Citrix Virtual Apps and Desktops", [1494, 443]),
  P(2888, "tcp", "", false, "messaging", ["ZooKeeper (связь узлов)", "ZooKeeper peer traffic"], [
    "Порт 2888 — обмен данными между узлами ансамбля ZooKeeper (последователи подключаются к лидеру).",
    "Port 2888 carries traffic between ZooKeeper ensemble members (followers connect to the leader).",
  ], "Apache ZooKeeper", [3888, 2181]),
  P(3000, "tcp", "", false, "dev-servers", ["Node.js / React / Grafana", "Node.js / React / Grafana"], [
    "Порт 3000 — популярный порт по умолчанию: Express и другие Node.js-приложения, Create React App, Next.js, Ruby on Rails, а также Grafana и Gitea.",
    "Port 3000 is a popular default: Express and other Node.js apps, Create React App, Next.js, Ruby on Rails, plus Grafana and Gitea.",
  ], "Node.js, Next.js, Rails, Grafana, Gitea", [3001, 5173, 8080, 4200, 9090], [
    "Для Grafana на порту 3000 обязательно смените пароль admin/admin; dev-серверы запускайте на localhost.",
    "For Grafana on 3000, change the default admin/admin password; run dev servers on localhost only.",
  ]),
  P(3001, "tcp", "", false, "dev-servers", ["Второй dev-сервер", "Second dev server"], [
    "Порт 3001 обычно занимает второе приложение, когда 3000 уже используется: Next.js, CRA и Vite предлагают его автоматически. Также здесь по умолчанию работает Uptime Kuma.",
    "Port 3001 is usually taken by a second app when 3000 is busy: Next.js, CRA and Vite pick it automatically. Uptime Kuma also defaults to it.",
  ], "Next.js, Uptime Kuma", [3000, 5173]),
  P(3050, "tcp", "gds-db", true, "databases", ["Firebird", "Firebird"], [
    "Порт 3050 — СУБД Firebird и InterBase. Firebird популярна в учётных программах и старых корпоративных системах.",
    "Port 3050 is the Firebird and InterBase DBMS. Firebird is popular in accounting and legacy enterprise software.",
  ], "Firebird, InterBase", [3306, 5432]),
  P(3074, "tcp,udp", "xbox", true, "games", ["Xbox Live", "Xbox Live"], [
    "Порт 3074 используют Xbox и многие игры для сетевой игры (например, Call of Duty). Для «открытого» типа NAT этот порт должен быть проброшен или открыт через UPnP.",
    "Xbox and many games (e.g. Call of Duty) use port 3074 for online play. For an Open NAT type it must be forwarded or opened via UPnP.",
  ], "Xbox, Call of Duty", [3478, 88, 500]),
  P(3100, "tcp", "", false, "devops", ["Grafana Loki", "Grafana Loki"], [
    "Порт 3100 — HTTP API Grafana Loki, системы сбора логов; сюда Promtail и Grafana Alloy отправляют логи.",
    "Port 3100 is the Grafana Loki HTTP API; Promtail and Grafana Alloy push logs there.",
  ], "Grafana Loki, Promtail", [3000, 9090]),
  P(3128, "tcp", "squid-http", true, "vpn-proxy", ["Squid (HTTP-прокси)", "Squid HTTP proxy"], [
    "Порт 3128 — HTTP-прокси Squid по умолчанию: кеширование, фильтрация и контроль доступа в корпоративных сетях.",
    "Port 3128 is the default for the Squid HTTP proxy: caching, filtering and access control in corporate networks.",
  ], "Squid", [8080, 1080, 8118], [
    "Прокси без ACL становится открытым: через него шлют спам и атакуют других. Разрешайте доступ только своим подсетям.",
    "A proxy without ACLs becomes open and is used for spam and attacks. Allow only your own subnets.",
  ]),
  P(3260, "tcp", "iscsi-target", true, "file-sharing", ["iSCSI", "iSCSI"], [
    "Порт 3260 — iSCSI: блочный доступ к дискам по сети (SAN). Сервер видит удалённый том как локальный диск.",
    "Port 3260 is iSCSI: block-level disk access over the network (SAN). The server sees the remote volume as a local disk.",
  ], "TrueNAS, Synology, Windows iSCSI Target, targetcli", [2049, 445], [
    "Без CHAP любой в сети может подключить том и прочитать данные. Выносите iSCSI в отдельную сеть хранения и включайте CHAP.",
    "Without CHAP anyone on the network can attach the volume and read it. Put iSCSI on a dedicated storage network and enable CHAP.",
  ]),
  P(3268, "tcp", "msft-gc", true, "directory", ["Global Catalog", "Global Catalog"], [
    "Порт 3268 — Global Catalog Active Directory: поиск объектов по всему лесу доменов через LDAP.",
    "Port 3268 is the Active Directory Global Catalog: LDAP searches across the whole forest.",
  ], "Active Directory", [3269, 389, 636]),
  P(3269, "tcp", "msft-gc-ssl", true, "directory", ["Global Catalog (TLS)", "Global Catalog over TLS"], [
    "Порт 3269 — Global Catalog Active Directory поверх TLS.",
    "Port 3269 is the Active Directory Global Catalog over TLS.",
  ], "Active Directory", [3268, 636]),
  P(3283, "tcp,udp", "net-assistant", true, "remote-access", ["Apple Remote Desktop", "Apple Remote Desktop"], [
    "Порт 3283 — Apple Remote Desktop: отчёты и управление компьютерами Mac; удалённый экран идёт через VNC-порт 5900.",
    "Port 3283 is Apple Remote Desktop: reporting and management of Macs; the screen itself goes over VNC port 5900.",
  ], "Apple Remote Desktop, macOS", [5900, 22], [
    "UDP 3283 на Mac с включённым ARD использовали для DDoS с усилением. Не открывайте его наружу.",
    "UDP 3283 on Macs with ARD enabled has been abused for amplification DDoS. Don't expose it.",
  ]),
  P(3306, "tcp", "mysql", true, "databases", ["MySQL / MariaDB", "MySQL / MariaDB"], [
    "Порт 3306 — MySQL и MariaDB по умолчанию. Его же используют совместимые СУБД: Percona Server, Amazon Aurora MySQL; TiDB по умолчанию слушает 4000.",
    "Port 3306 is the default for MySQL and MariaDB, and compatible systems such as Percona Server and Amazon Aurora MySQL; TiDB defaults to 4000.",
  ], "MySQL, MariaDB, Percona Server, phpMyAdmin", [33060, 5432, 1433, 6379], [
    "Открытый 3306 перебирают по учётной записи root, а найденные базы выкачивают с требованием выкупа. Слушайте 127.0.0.1 (bind-address) или частную сеть; для удалённой работы используйте SSH-туннель.",
    "An open 3306 is brute-forced for root, and found databases are dumped for ransom. Listen on 127.0.0.1 (bind-address) or a private network; for remote work use an SSH tunnel.",
  ]),
  P(3389, "tcp,udp", "ms-wbt-server", true, "remote-access", ["RDP (удалённый рабочий стол Windows)", "RDP (Windows Remote Desktop)"], [
    "Порт 3389 — RDP, удалённый рабочий стол Windows и терминальные серверы. По UDP 3389 идёт ускоренный транспорт RDP.",
    "Port 3389 is RDP, Windows Remote Desktop and terminal servers. UDP 3389 carries RDP's faster transport.",
  ], "Windows Remote Desktop, xrdp, FreeRDP, Remmina", [22, 5900, 443, 5985], [
    "Открытый RDP — один из главных входов для шифровальщиков: перебор паролей и уязвимости вроде BlueKeep. Публикуйте RDP только через VPN или RD Gateway, включите NLA и блокировку учётных записей.",
    "Exposed RDP is a leading entry point for ransomware: password guessing and flaws like BlueKeep. Publish RDP only via VPN or RD Gateway, enable NLA and account lockout.",
  ]),
  P(3478, "udp,tcp", "stun", true, "voip-media", ["STUN/TURN", "STUN/TURN"], [
    "Порт 3478 — STUN и TURN: помогают WebRTC-звонкам, видеоконференциям и играм пройти через NAT. Его используют Zoom, Teams, Jitsi, Nextcloud Talk, PlayStation.",
    "Port 3478 is STUN and TURN, helping WebRTC calls, video conferencing and games traverse NAT. Zoom, Teams, Jitsi, Nextcloud Talk and PlayStation use it.",
  ], "coturn, Jitsi, Nextcloud Talk, WebRTC", [5349, 19302, 5060, 3074], [
    "Открытый TURN без авторизации превращается в прокси для чужого трафика. Используйте долгоживущие или временные учётные данные (use-auth-secret) и запретите ретрансляцию во внутренние сети.",
    "An open TURN server without auth becomes a proxy for other people's traffic. Use long-term or time-limited credentials (use-auth-secret) and deny relaying into private networks.",
  ]),
  P(3690, "tcp", "svn", true, "devops", ["Subversion (svnserve)", "Subversion (svnserve)"], [
    "Порт 3690 — svnserve, собственный протокол системы контроля версий Subversion. Часто SVN работает поверх HTTP(S) через Apache.",
    "Port 3690 is svnserve, Subversion's own protocol. SVN often runs over HTTP(S) through Apache instead.",
  ], "Apache Subversion", [9418, 443]),
  P(3702, "udp", "ws-discovery", true, "printing", ["WS-Discovery", "WS-Discovery"], [
    "UDP 3702 — WS-Discovery: Windows находит по нему сетевые принтеры, сканеры и IP-камеры (ONVIF).",
    "UDP 3702 is WS-Discovery: Windows finds network printers, scanners and IP cameras (ONVIF) with it.",
  ], "Windows, ONVIF", [5353, 1900, 9100], [
    "Устройства, отвечающие на WS-Discovery из интернета, используют для DDoS с усилением. Порт должен работать только в локальной сети.",
    "Devices answering WS-Discovery from the Internet are abused for amplification DDoS. Keep it on the LAN.",
  ]),
  P(3724, "tcp,udp", "blizwow", true, "games", ["World of Warcraft", "World of Warcraft"], [
    "Порт 3724 закреплён за World of Warcraft и исторически использовался клиентом Blizzard для входа и загрузок.",
    "Port 3724 is registered to World of Warcraft and was historically used by the Blizzard client for login and downloads.",
  ], "World of Warcraft, Battle.net", [1119, 6112]),
  P(3888, "tcp", "", false, "messaging", ["ZooKeeper (выборы лидера)", "ZooKeeper leader election"], [
    "Порт 3888 — выборы лидера в ансамбле ZooKeeper.",
    "Port 3888 is used for leader election in a ZooKeeper ensemble.",
  ], "Apache ZooKeeper", [2888, 2181]),
  P(4000, "tcp", "", false, "dev-servers", ["Dev-серверы (Jekyll, Phoenix) / TiDB", "Dev servers (Jekyll, Phoenix) / TiDB"], [
    "Порт 4000 по умолчанию занимают генератор сайтов Jekyll, Phoenix LiveDashboard в режиме разработки и СУБД TiDB (MySQL-совместимый протокол). Также его использует NoMachine.",
    "Port 4000 is the default for the Jekyll site generator, some Phoenix setups and the TiDB database (MySQL protocol). NoMachine uses it too.",
  ], "Jekyll, TiDB, NoMachine", [3000, 4200, 3306]),
  P(4040, "tcp", "", false, "dev-servers", ["Spark UI / ngrok", "Spark UI / ngrok"], [
    "Порт 4040 — веб-интерфейс Apache Spark для запущенного приложения и локальная панель инспекции туннеля ngrok (http://localhost:4040).",
    "Port 4040 is the Apache Spark application UI and ngrok's local inspection dashboard (http://localhost:4040).",
  ], "Apache Spark, ngrok", [8080, 3000]),
  P(4173, "tcp", "", false, "dev-servers", ["Vite preview", "Vite preview"], [
    "Порт 4173 — команда vite preview: локальный просмотр production-сборки Vite.",
    "Port 4173 is vite preview: serving a Vite production build locally.",
  ], "Vite", [5173, 3000]),
  P(4190, "tcp", "sieve", true, "mail", ["ManageSieve", "ManageSieve"], [
    "Порт 4190 — ManageSieve: управление правилами фильтрации почты Sieve из почтового клиента (Roundcube, Thunderbird).",
    "Port 4190 is ManageSieve for editing Sieve mail filter rules from a client (Roundcube, Thunderbird).",
  ], "Dovecot Pigeonhole, Cyrus", [993, 143]),
  P(4200, "tcp", "", false, "dev-servers", ["Angular (ng serve)", "Angular (ng serve)"], [
    "Порт 4200 — dev-сервер Angular CLI (ng serve) по умолчанию.",
    "Port 4200 is the default Angular CLI dev server (ng serve).",
  ], "Angular CLI", [3000, 5173, 8080]),
  P(4222, "tcp", "", false, "messaging", ["NATS", "NATS"], [
    "Порт 4222 — клиентские подключения брокера сообщений NATS; 6222 — кластер, 8222 — мониторинг.",
    "Port 4222 is for client connections to the NATS messaging server; 6222 is clustering and 8222 monitoring.",
  ], "NATS, JetStream", [6222, 8222, 9092]),
  P(4317, "tcp", "", false, "devops", ["OpenTelemetry OTLP (gRPC)", "OpenTelemetry OTLP (gRPC)"], [
    "Порт 4317 — приём телеметрии OpenTelemetry по OTLP/gRPC: трассировки, метрики и логи от приложений к коллектору.",
    "Port 4317 receives OpenTelemetry data over OTLP/gRPC: traces, metrics and logs from apps to the collector.",
  ], "OpenTelemetry Collector, Jaeger, Grafana Tempo", [4318, 14268, 9411]),
  P(4318, "tcp", "", false, "devops", ["OpenTelemetry OTLP (HTTP)", "OpenTelemetry OTLP (HTTP)"], [
    "Порт 4318 — OTLP поверх HTTP (Protobuf или JSON); удобен для браузерных SDK и там, где gRPC недоступен.",
    "Port 4318 is OTLP over HTTP (Protobuf or JSON), handy for browser SDKs and where gRPC isn't available.",
  ], "OpenTelemetry Collector, Grafana Alloy", [4317, 9411]),
  P(4369, "tcp", "epmd", true, "messaging", ["Erlang EPMD", "Erlang EPMD"], [
    "Порт 4369 — Erlang Port Mapper Daemon: узлы Erlang (RabbitMQ, CouchDB, ejabberd) находят друг друга через него.",
    "Port 4369 is the Erlang Port Mapper Daemon: Erlang nodes (RabbitMQ, CouchDB, ejabberd) discover each other via it.",
  ], "RabbitMQ, CouchDB, ejabberd", [5672, 25672, 5984], [
    "Доступ к EPMD и порту распределённого Erlang с угаданной erlang-cookie даёт выполнение кода. Закройте эти порты снаружи.",
    "Access to EPMD and the Erlang distribution port with a guessed erlang cookie means code execution. Block them externally.",
  ]),
  P(4444, "tcp", "", false, "legacy", ["Metasploit (listener по умолчанию)", "Metasploit default listener"], [
    "Порт 4444 известен как порт по умолчанию для обратных оболочек Metasploit. Также его используют Selenium Grid (hub) и некоторые легитимные службы.",
    "Port 4444 is best known as Metasploit's default reverse-shell port. Selenium Grid (hub) and some legitimate services also use it.",
  ], "Metasploit, Selenium Grid", [22, 3389], [
    "Неожиданное исходящее соединение на 4444 — повод проверить машину на компрометацию. На своих серверах не держите открытым то, что не знаете.",
    "An unexpected outbound connection to 4444 is a reason to check the machine for compromise. Don't keep unknown listeners on your servers.",
  ]),
  P(4500, "udp", "ipsec-nat-t", true, "vpn-proxy", ["IPsec NAT-T", "IPsec NAT traversal"], [
    "UDP 4500 — IPsec NAT Traversal: когда между VPN-узлами есть NAT, IKE и зашифрованный трафик ESP инкапсулируются в UDP 4500.",
    "UDP 4500 is IPsec NAT traversal: when NAT sits between VPN peers, IKE and ESP traffic are encapsulated in UDP 4500.",
  ], "strongSwan, Windows, iOS, MikroTik, Cisco", [500, 1701]),
  P(4567, "tcp", "", false, "dev-servers", ["Sinatra / Galera", "Sinatra / Galera"], [
    "Порт 4567 — dev-сервер Ruby-фреймворка Sinatra и репликация кластера MariaDB Galera.",
    "Port 4567 is the Sinatra (Ruby) dev server and MariaDB Galera cluster replication.",
  ], "Sinatra, MariaDB Galera", [3306, 3000]),
  P(4569, "udp", "iax", true, "voip-media", ["IAX2 (Asterisk)", "IAX2 (Asterisk)"], [
    "UDP 4569 — IAX2, протокол связи между АТС Asterisk: сигнализация и голос по одному порту, что упрощает прохождение NAT.",
    "UDP 4569 is IAX2, the Asterisk inter-PBX protocol: signalling and media on one port, which eases NAT traversal.",
  ], "Asterisk, FreePBX", [5060, 5061], [
    "Как и SIP, IAX2 атакуют перебором паролей ради звонков за ваш счёт.",
    "Like SIP, IAX2 is brute-forced for toll fraud.",
  ]),
  P(4646, "tcp", "", false, "devops", ["HashiCorp Nomad", "HashiCorp Nomad"], [
    "Порт 4646 — HTTP API и веб-интерфейс HashiCorp Nomad; 4647 — RPC, 4648 — gossip между серверами.",
    "Port 4646 is the HashiCorp Nomad HTTP API and UI; 4647 is RPC and 4648 is server gossip.",
  ], "HashiCorp Nomad", [8500, 8200], [
    "Без ACL Nomad позволяет запускать произвольные задачи на узлах. Включите ACL и TLS.",
    "Without ACLs Nomad lets anyone run arbitrary jobs on nodes. Enable ACLs and TLS.",
  ]),
  P(4789, "udp", "vxlan", true, "devops", ["VXLAN", "VXLAN"], [
    "UDP 4789 — VXLAN: наложенные (overlay) L2-сети поверх IP в дата-центрах, Docker Swarm, VMware NSX и Kubernetes (Calico, Cilium).",
    "UDP 4789 is VXLAN: overlay L2 networks over IP in data centres, Docker Swarm, VMware NSX and Kubernetes (Calico, Cilium).",
  ], "Linux, Docker Swarm, VMware NSX, Cilium", [8472, 6081, 7946], [
    "VXLAN не шифрует и не аутентифицирует пакеты: открытый 4789 позволяет внедрять кадры в чужую overlay-сеть. Пропускайте его только между узлами кластера.",
    "VXLAN neither encrypts nor authenticates: an open 4789 lets attackers inject frames into the overlay. Allow it only between cluster nodes.",
  ]),
  P(4840, "tcp", "opcua-tcp", true, "iot", ["OPC UA", "OPC UA"], [
    "Порт 4840 — OPC UA, современный промышленный протокол обмена данными между контроллерами, SCADA и MES с поддержкой шифрования и сертификатов.",
    "Port 4840 is OPC UA, a modern industrial protocol between PLCs, SCADA and MES, with built-in encryption and certificates.",
  ], "Siemens, Beckhoff, Kepware, open62541", [502, 102, 44818], [
    "Безопасность OPC UA зависит от настроек: режим SecurityPolicy None и анонимный вход отключайте.",
    "OPC UA security depends on configuration: disable SecurityPolicy None and anonymous login.",
  ]),
  P(4899, "tcp", "radmin-port", true, "remote-access", ["Radmin", "Radmin"], [
    "Порт 4899 — Radmin Server, популярная в России и СНГ программа удалённого администрирования Windows.",
    "Port 4899 is Radmin Server, a Windows remote administration tool popular in Russia and the CIS.",
  ], "Radmin", [3389, 5900, 5938], [
    "Открытый Radmin часто находят сканеры; используйте сложный пароль, ограничение по IP и VPN.",
    "Scanners readily find exposed Radmin; use a strong password, IP restrictions and a VPN.",
  ]),
  P(5000, "tcp", "", false, "dev-servers", ["Flask / ASP.NET / Docker Registry / AirPlay", "Flask / ASP.NET / Docker Registry / AirPlay"], [
    "Порт 5000 — порт по умолчанию у Flask, ASP.NET Core (HTTP), Docker Registry и Synology DSM. На macOS 12+ его занимает приёмник AirPlay, из-за чего Flask не запускается — отключите AirPlay Receiver или смените порт.",
    "Port 5000 is the default for Flask, ASP.NET Core (HTTP), Docker Registry and Synology DSM. On macOS 12+ the AirPlay Receiver takes it, so Flask fails to start — disable AirPlay Receiver or change the port.",
  ], "Flask, ASP.NET Core, Docker Registry, Synology DSM, macOS AirPlay", [5001, 3000, 7000, 8000], [
    "Docker Registry без аутентификации раздаёт все ваши образы, часто вместе с секретами внутри. Включите auth и TLS.",
    "A Docker Registry without authentication hands out all your images, often with secrets inside. Enable auth and TLS.",
  ]),
  P(5001, "tcp", "", false, "dev-servers", ["ASP.NET Core (HTTPS) / Synology DSM", "ASP.NET Core (HTTPS) / Synology DSM"], [
    "Порт 5001 — HTTPS-порт ASP.NET Core по умолчанию (dotnet run) и веб-интерфейс Synology DSM по HTTPS; iperf3 использует соседний 5201.",
    "Port 5001 is ASP.NET Core's default HTTPS port (dotnet run) and Synology DSM over HTTPS; iperf3 uses the nearby 5201.",
  ], "ASP.NET Core, Synology DSM", [5000, 443]),
  P(5004, "udp", "avt-profile-1", true, "voip-media", ["RTP (медиа)", "RTP media"], [
    "UDP 5004 (и 5005 для RTCP) — порты RTP по умолчанию для передачи аудио и видео; в SIP-телефонии RTP обычно идёт по диапазону 10000–20000.",
    "UDP 5004 (and 5005 for RTCP) are RTP defaults for audio and video; SIP telephony usually uses the 10000–20000 range for RTP.",
  ], "VLC, ffmpeg, GStreamer", [5060, 554]),
  P(5037, "tcp", "", false, "dev-servers", ["ADB server", "ADB server"], [
    "Порт 5037 — локальный сервер Android Debug Bridge: команды adb подключаются к нему, а он — к устройствам.",
    "Port 5037 is the local Android Debug Bridge server: adb commands talk to it, and it talks to devices.",
  ], "Android SDK Platform Tools", [5555, 8081]),
  P(5044, "tcp", "", false, "devops", ["Logstash Beats input", "Logstash Beats input"], [
    "Порт 5044 — приём данных от Filebeat, Metricbeat и других Beats в Logstash.",
    "Port 5044 is where Logstash receives data from Filebeat, Metricbeat and other Beats.",
  ], "Logstash, Filebeat", [9200, 5601, 9600]),
  P(5060, "udp,tcp", "sip", true, "voip-media", ["SIP", "SIP"], [
    "Порт 5060 — SIP, сигнализация IP-телефонии: регистрация телефонов на АТС, установка и завершение звонков. Голос идёт отдельно по RTP.",
    "Port 5060 is SIP, VoIP signalling: phones registering with a PBX, setting up and ending calls. Voice flows separately over RTP.",
  ], "Asterisk, FreePBX, FreeSWITCH, 3CX, Oktell", [5061, 3478, 4569, 5004], [
    "Открытый SIP-порт сразу атакуют сканеры (SIPVicious) — подбирают пароли к внутренним номерам, чтобы звонить на платные направления за ваш счёт. Нужны сложные пароли, fail2ban и доступ только от доверенных IP.",
    "An open SIP port is immediately hit by scanners (SIPVicious) guessing extension passwords to call premium numbers on your bill. Use strong passwords, fail2ban and trusted IPs only.",
  ]),
  P(5061, "tcp", "sips", true, "voip-media", ["SIP over TLS (SIPS)", "SIP over TLS (SIPS)"], [
    "Порт 5061 — SIP поверх TLS: зашифрованная сигнализация между телефонами, АТС и операторами. Используется Microsoft Teams Direct Routing.",
    "Port 5061 is SIP over TLS: encrypted signalling between phones, PBXs and carriers. Microsoft Teams Direct Routing uses it.",
  ], "Asterisk, FreeSWITCH, Microsoft Teams, 3CX", [5060, 3478]),
  P(5222, "tcp", "xmpp-client", true, "messaging", ["XMPP (клиенты)", "XMPP client connections"], [
    "Порт 5222 — подключение клиентов к серверу XMPP (Jabber). Его также использовали WhatsApp и игровые сервисы на основе XMPP.",
    "Port 5222 is for client connections to an XMPP (Jabber) server. WhatsApp and XMPP-based gaming services used it too.",
  ], "ejabberd, Prosody, Openfire", [5269, 5223, 443]),
  P(5223, "tcp", "hpvirtgrp", false, "messaging", ["Apple Push (APNs, устаревший)", "Apple Push (APNs, legacy)"], [
    "Порт 5223 устройства Apple использовали для постоянного соединения с сервисом push-уведомлений APNs; сейчас APNs работает на 443, а 5223 остаётся резервным. Исторически 5223 — также XMPP поверх TLS.",
    "Apple devices used port 5223 for their persistent connection to APNs push notifications; APNs now works on 443 with 5223 as a fallback. Historically 5223 was also XMPP over TLS.",
  ], "iOS, macOS", [443, 5228, 5222]),
  P(5228, "tcp", "hpvroom", false, "messaging", ["Google FCM (push-уведомления)", "Google FCM (push notifications)"], [
    "Порт 5228 (и 5229, 5230) Android-устройства используют для соединения с Firebase Cloud Messaging — через него приходят push-уведомления. Если порт закрыт в сети, уведомления задерживаются.",
    "Android devices use port 5228 (and 5229, 5230) to connect to Firebase Cloud Messaging for push notifications. If a network blocks it, notifications are delayed.",
  ], "Android, Google Play Services", [5223, 443]),
  P(5269, "tcp", "xmpp-server", true, "messaging", ["XMPP (между серверами)", "XMPP server-to-server"], [
    "Порт 5269 — федерация XMPP: серверы Jabber обмениваются сообщениями пользователей разных доменов.",
    "Port 5269 is XMPP federation: Jabber servers exchange messages for users on different domains.",
  ], "ejabberd, Prosody, Openfire", [5222]),
  P(5349, "tcp,udp", "stuns", true, "voip-media", ["TURN/STUN over TLS", "TURN/STUN over TLS"], [
    "Порт 5349 — TURN и STUN поверх TLS/DTLS: ретрансляция WebRTC-трафика через сети с жёстким файрволом.",
    "Port 5349 is TURN and STUN over TLS/DTLS, relaying WebRTC traffic through strict firewalls.",
  ], "coturn, Jitsi", [3478, 443]),
  P(5351, "udp", "nat-pmp", true, "network-services", ["NAT-PMP / PCP", "NAT-PMP / PCP"], [
    "UDP 5351 — NAT-PMP и PCP: программы в локальной сети просят роутер открыть порт (аналог UPnP от Apple).",
    "UDP 5351 is NAT-PMP and PCP: apps on the LAN ask the router to open a port (Apple's alternative to UPnP).",
  ], "miniupnpd, Apple AirPort, MikroTik", [1900, 5353], [
    "Роутер не должен отвечать на NAT-PMP со стороны интернета — иначе кто угодно откроет порты внутрь вашей сети.",
    "A router must not answer NAT-PMP from the Internet side — or anyone can open ports into your network.",
  ]),
  P(5353, "udp", "mdns", true, "network-services", ["mDNS (Bonjour, Avahi)", "mDNS (Bonjour, Avahi)"], [
    "UDP 5353 — Multicast DNS: имена вида printer.local и обнаружение служб без DNS-сервера. На нём работают Bonjour, AirPrint, AirPlay, Chromecast и Avahi.",
    "UDP 5353 is Multicast DNS: names like printer.local and service discovery without a DNS server. Bonjour, AirPrint, AirPlay, Chromecast and Avahi use it.",
  ], "Bonjour, Avahi, Windows, Chromecast", [5355, 1900, 53, 631], [
    "mDNS рассчитан только на локальную сеть; ответы из интернета используют для DDoS с усилением и разведки.",
    "mDNS is LAN-only; answering from the Internet enables amplification and reconnaissance.",
  ]),
  P(5355, "udp,tcp", "llmnr", true, "network-services", ["LLMNR", "LLMNR"], [
    "Порт 5355 — LLMNR, разрешение имён в локальной сети Windows, когда DNS не ответил.",
    "Port 5355 is LLMNR, Windows local name resolution used when DNS has no answer.",
  ], "Windows, systemd-resolved", [5353, 137], [
    "LLMNR легко подделать (Responder) и перехватить NTLM-хэши паролей. Отключите его групповой политикой, если он не нужен.",
    "LLMNR is easily spoofed (Responder) to capture NTLM password hashes. Disable it via Group Policy if unused.",
  ]),
  P(5432, "tcp", "postgresql", true, "databases", ["PostgreSQL", "PostgreSQL"], [
    "Порт 5432 — PostgreSQL по умолчанию; его же используют совместимые системы: Greenplum, TimescaleDB, Supabase, Amazon Aurora PostgreSQL.",
    "Port 5432 is PostgreSQL's default, also used by compatible systems: Greenplum, TimescaleDB, Supabase, Amazon Aurora PostgreSQL.",
  ], "PostgreSQL, Postgres Pro, pgAdmin", [6432, 3306, 1433, 5433], [
    "Открытый PostgreSQL со слабым паролем используют для запуска майнеров через COPY … FROM PROGRAM. Ограничьте listen_addresses и pg_hba.conf своими адресами, требуйте scram-sha-256 и SSL.",
    "Exposed PostgreSQL with weak passwords is abused to run miners via COPY … FROM PROGRAM. Restrict listen_addresses and pg_hba.conf, require scram-sha-256 and SSL.",
  ]),
  P(5433, "tcp", "", false, "databases", ["Второй экземпляр PostgreSQL / Vertica", "Second PostgreSQL instance / Vertica"], [
    "Порт 5433 обычно занимает второй кластер PostgreSQL на том же сервере (например, при обновлении версии через pg_upgradecluster). Также это порт СУБД Vertica.",
    "Port 5433 is usually a second PostgreSQL cluster on the same host (e.g. during a version upgrade). It's also the Vertica database port.",
  ], "PostgreSQL, Vertica", [5432, 6432]),
  P(5500, "tcp", "", false, "dev-servers", ["VS Code Live Server", "VS Code Live Server"], [
    "Порт 5500 — расширение Live Server для VS Code: локальный сервер с автообновлением страницы.",
    "Port 5500 is the VS Code Live Server extension: a local server with live reload.",
  ], "VS Code Live Server", [3000, 35729]),
  P(5540, "udp", "", false, "iot", ["Matter", "Matter"], [
    "UDP 5540 — порт протокола умного дома Matter (поверх IPv6, Wi-Fi и Thread): устройства разных производителей общаются по нему напрямую.",
    "UDP 5540 is the Matter smart home protocol port (over IPv6, Wi-Fi and Thread): devices from different vendors talk over it directly.",
  ], "Matter, Apple Home, Google Home, Home Assistant", [5353, 8123]),
  P(5555, "tcp", "", false, "dev-servers", ["ADB по сети", "ADB over network"], [
    "Порт 5555 — Android Debug Bridge по TCP (adb tcpip 5555). На многих ТВ-приставках и китайских устройствах он открыт с завода.",
    "Port 5555 is Android Debug Bridge over TCP (adb tcpip 5555). Many TV boxes and cheap devices ship with it open.",
  ], "Android", [5037], [
    "Открытый ADB даёт полный доступ к устройству без пароля — через него распространялись ботнеты-майнеры. Выключите отладку по сети.",
    "Open ADB means full device access without a password — botnets and miners spread this way. Turn off network debugging.",
  ]),
  P(5601, "tcp", "", false, "devops", ["Kibana", "Kibana"], [
    "Порт 5601 — веб-интерфейс Kibana для поиска и визуализации данных Elasticsearch.",
    "Port 5601 is the Kibana web UI for searching and visualising Elasticsearch data.",
  ], "Kibana, OpenSearch Dashboards", [9200, 5044, 3000], [
    "Kibana без аутентификации раскрывает всё содержимое кластера. Включите безопасность Elastic и не открывайте порт наружу.",
    "Kibana without authentication exposes the whole cluster. Enable Elastic security and don't expose the port.",
  ]),
  P(5671, "tcp", "amqps", true, "messaging", ["AMQP over TLS", "AMQP over TLS"], [
    "Порт 5671 — AMQP поверх TLS: зашифрованные подключения к RabbitMQ, Azure Service Bus, Amazon MQ.",
    "Port 5671 is AMQP over TLS: encrypted connections to RabbitMQ, Azure Service Bus, Amazon MQ.",
  ], "RabbitMQ, Azure Service Bus, Qpid", [5672, 15672]),
  P(5672, "tcp", "amqp", true, "messaging", ["AMQP (RabbitMQ)", "AMQP (RabbitMQ)"], [
    "Порт 5672 — AMQP 0-9-1/1.0 без шифрования: подключение приложений к брокеру RabbitMQ и совместимым очередям.",
    "Port 5672 is plain AMQP 0-9-1/1.0: applications connecting to RabbitMQ and compatible brokers.",
  ], "RabbitMQ, Apache Qpid, ActiveMQ", [5671, 15672, 4369, 25672], [
    "Учётная запись guest/guest в RabbitMQ по умолчанию работает только с localhost — не снимайте это ограничение, создайте отдельных пользователей.",
    "RabbitMQ's default guest/guest works only from localhost — keep it that way and create dedicated users.",
  ]),
  P(5678, "tcp", "", false, "dev-servers", ["n8n", "n8n"], [
    "Порт 5678 — веб-интерфейс и вебхуки платформы автоматизации n8n.",
    "Port 5678 serves the n8n automation platform UI and webhooks.",
  ], "n8n", [1880, 3000]),
  P(5683, "udp", "coap", true, "iot", ["CoAP", "CoAP"], [
    "UDP 5683 — CoAP, «лёгкий HTTP» для маломощных IoT-устройств; с DTLS-шифрованием — порт 5684.",
    "UDP 5683 is CoAP, a “lightweight HTTP” for constrained IoT devices; with DTLS encryption it's port 5684.",
  ], "Eclipse Californium, libcoap, Thread", [5684, 1883], [
    "Открытые CoAP-устройства дают DDoS-усиление и раскрывают данные — выставляйте CoAP наружу только с DTLS.",
    "Exposed CoAP devices enable DDoS amplification and leak data — expose CoAP only with DTLS.",
  ]),
  P(5684, "udp", "coaps", true, "iot", ["CoAP over DTLS", "CoAP over DTLS"], [
    "UDP 5684 — CoAP с шифрованием DTLS.",
    "UDP 5684 is CoAP secured with DTLS.",
  ], "Eclipse Californium, libcoap", [5683, 8883]),
  P(5800, "tcp", "", false, "remote-access", ["VNC через браузер", "VNC over HTTP"], [
    "Порт 5800 — встроенный веб-клиент VNC (Java или HTML5), обычно для дисплея :0; дисплею :1 соответствует 5801.",
    "Port 5800 is the built-in VNC web client (Java or HTML5), usually for display :0; display :1 maps to 5801.",
  ], "TightVNC, RealVNC, noVNC", [5900, 5901]),
  P(5900, "tcp", "rfb", true, "remote-access", ["VNC", "VNC"], [
    "Порт 5900 — VNC (протокол RFB), удалённый доступ к рабочему столу; дисплей :1 — 5901, :2 — 5902 и так далее. На нём же работает «Общий экран» macOS.",
    "Port 5900 is VNC (the RFB protocol) for remote desktop; display :1 is 5901, :2 is 5902 and so on. macOS Screen Sharing uses it too.",
  ], "RealVNC, TightVNC, TigerVNC, UltraVNC, macOS Screen Sharing", [5901, 5800, 3389, 22], [
    "Многие VNC-серверы ограничивают пароль 8 символами и не шифруют трафик; в интернете тысячи VNC вообще без пароля. Используйте VNC только через SSH-туннель или VPN.",
    "Many VNC servers cap passwords at 8 characters and don't encrypt; thousands of VNC servers on the Internet have no password at all. Use VNC only through an SSH tunnel or VPN.",
  ]),
  P(5901, "tcp", "", false, "remote-access", ["VNC, дисплей :1", "VNC display :1"], [
    "Порт 5901 — VNC для дисплея :1: так обычно запускают отдельные сеансы vncserver на Linux-серверах.",
    "Port 5901 is VNC display :1, the usual choice for separate vncserver sessions on Linux servers.",
  ], "TigerVNC, TightVNC", [5900, 5800]),
  P(5938, "tcp,udp", "", false, "remote-access", ["TeamViewer", "TeamViewer"], [
    "Порт 5938 TeamViewer использует для соединения с серверами и между компьютерами; если он закрыт, программа переходит на 443 и 80.",
    "TeamViewer uses port 5938 to reach its servers and connect peers; if it's blocked, it falls back to 443 and 80.",
  ], "TeamViewer", [7070, 3389, 443], [
    "Мошенники просят установить TeamViewer или AnyDesk и дать ID — никогда не сообщайте его незнакомцам. В компаниях ограничивайте разрешённые ID.",
    "Scammers ask victims to install TeamViewer or AnyDesk and read out the ID — never share it with strangers. In companies restrict allowed IDs.",
  ]),
  P(5984, "tcp", "couchdb", true, "databases", ["Apache CouchDB", "Apache CouchDB"], [
    "Порт 5984 — HTTP API документной СУБД CouchDB и её веб-консоли Fauxton.",
    "Port 5984 is the HTTP API of the CouchDB document database and its Fauxton console.",
  ], "Apache CouchDB", [4369, 27017], [
    "Открытые CouchDB в «admin party» (без администратора) массово взламывали. Задайте администратора и закройте порт.",
    "CouchDB instances in “admin party” mode (no admin) were mass-compromised. Create an admin and block the port.",
  ]),
  P(5985, "tcp", "wsman", true, "remote-access", ["WinRM (HTTP)", "WinRM (HTTP)"], [
    "Порт 5985 — Windows Remote Management по HTTP: PowerShell Remoting (Enter-PSSession), Ansible для Windows. Сообщения шифруются на уровне Kerberos/NTLM.",
    "Port 5985 is Windows Remote Management over HTTP: PowerShell Remoting (Enter-PSSession), Ansible for Windows. Messages are encrypted at the Kerberos/NTLM layer.",
  ], "Windows WinRM, PowerShell, Ansible", [5986, 3389, 22], [
    "WinRM даёт выполнение команд с правами администратора. Разрешайте его только из сети администрирования.",
    "WinRM gives administrator-level command execution. Allow it only from the admin network.",
  ]),
  P(5986, "tcp", "wsmans", true, "remote-access", ["WinRM (HTTPS)", "WinRM (HTTPS)"], [
    "Порт 5986 — WinRM поверх HTTPS с сертификатом сервера: для удалённого управления Windows вне домена.",
    "Port 5986 is WinRM over HTTPS with a server certificate, for managing Windows outside a domain.",
  ], "Windows WinRM, Ansible", [5985, 3389]),
  P(6000, "tcp", "x11", true, "remote-access", ["X11", "X11"], [
    "Порт 6000 — X Window System, дисплей :0 (дисплей :1 — 6001). Сейчас X по сети почти всегда пробрасывают через SSH (ssh -X), а порт закрыт.",
    "Port 6000 is the X Window System, display :0 (display :1 is 6001). Today X over the network is almost always tunnelled through SSH (ssh -X) with the port closed.",
  ], "Xorg, XQuartz, VcXsrv", [22, 5900], [
    "Открытый X-сервер без авторизации позволяет видеть экран и перехватывать нажатия клавиш. Не слушайте TCP (-nolisten tcp).",
    "An open X server without auth lets anyone watch the screen and capture keystrokes. Keep -nolisten tcp.",
  ]),
  P(6006, "tcp", "", false, "dev-servers", ["Storybook / TensorBoard", "Storybook / TensorBoard"], [
    "Порт 6006 по умолчанию занимают Storybook (каталог UI-компонентов) и TensorBoard (визуализация обучения нейросетей).",
    "Port 6006 is the default for Storybook (UI component explorer) and TensorBoard (training visualisation).",
  ], "Storybook, TensorBoard", [3000, 8888]),
  P(6053, "tcp", "", false, "iot", ["ESPHome API", "ESPHome native API"], [
    "Порт 6053 — нативный API ESPHome: Home Assistant подключается по нему к устройствам на ESP32 и ESP8266.",
    "Port 6053 is the ESPHome native API: Home Assistant connects to ESP32/ESP8266 devices over it.",
  ], "ESPHome, Home Assistant", [8123, 1883]),
  P(6081, "udp", "geneve", true, "devops", ["Geneve", "Geneve"], [
    "UDP 6081 — туннели Geneve для overlay-сетей: Open vSwitch, OVN, VMware NSX-T, AWS Gateway Load Balancer.",
    "UDP 6081 is Geneve tunnelling for overlay networks: Open vSwitch, OVN, VMware NSX-T, AWS Gateway Load Balancer.",
  ], "Open vSwitch, OVN, NSX-T", [4789, 8472]),
  P(6112, "tcp,udp", "", false, "games", ["Battle.net / Warcraft III", "Battle.net / Warcraft III"], [
    "Порт 6112 — сетевая игра Warcraft III, Diablo II и других старых игр Blizzard через Battle.net. Официально IANA закрепила его за службой dtspc (CDE).",
    "Port 6112 is online play for Warcraft III, Diablo II and other classic Blizzard games via Battle.net. IANA officially lists it for dtspc (CDE).",
  ], "Warcraft III, Diablo II, Battle.net", [1119, 3724]),
  P(6222, "tcp", "", false, "messaging", ["NATS (кластер)", "NATS cluster"], [
    "Порт 6222 — маршрутизация между серверами кластера NATS.",
    "Port 6222 is route traffic between NATS cluster servers.",
  ], "NATS", [4222, 8222]),
  P(6379, "tcp", "redis", true, "databases", ["Redis", "Redis"], [
    "Порт 6379 — Redis и совместимые хранилища (Valkey, KeyDB, Dragonfly): кеш, очереди, сессии, pub/sub.",
    "Port 6379 is Redis and compatible stores (Valkey, KeyDB, Dragonfly): cache, queues, sessions, pub/sub.",
  ], "Redis, Valkey, KeyDB, Dragonfly", [26379, 16379, 11211], [
    "Старые версии Redis слушали все интерфейсы без пароля: через CONFIG SET злоумышленники записывали SSH-ключи и cron-задачи. Используйте protected-mode, bind 127.0.0.1, requirepass или ACL.",
    "Old Redis versions listened on all interfaces without a password; attackers used CONFIG SET to plant SSH keys and cron jobs. Use protected-mode, bind 127.0.0.1, requirepass or ACLs.",
  ]),
  P(6432, "tcp", "", false, "databases", ["PgBouncer", "PgBouncer"], [
    "Порт 6432 — пулер соединений PgBouncer перед PostgreSQL; приложения подключаются к нему вместо 5432.",
    "Port 6432 is the PgBouncer connection pooler in front of PostgreSQL; apps connect to it instead of 5432.",
  ], "PgBouncer, Odyssey", [5432, 5433]),
  P(6443, "tcp", "sun-sr-https", false, "devops", ["Kubernetes API", "Kubernetes API server"], [
    "Порт 6443 — API-сервер Kubernetes: через него kubectl, контроллеры и kubelet управляют кластером. Именно этот адрес указан в kubeconfig.",
    "Port 6443 is the Kubernetes API server: kubectl, controllers and kubelets manage the cluster through it. It's the address in your kubeconfig.",
  ], "Kubernetes, k3s, OpenShift, Rancher", [2379, 10250, 443, 2376], [
    "Отключите анонимный доступ (--anonymous-auth=false), используйте RBAC и ограничивайте доступ к API по сети — открытые API-серверы с анонимными правами становились добычей майнеров.",
    "Disable anonymous access (--anonymous-auth=false), use RBAC and restrict network access — API servers with anonymous permissions have been hijacked for mining.",
  ]),
  P(6514, "tcp", "syslog-tls", true, "network-services", ["Syslog over TLS", "Syslog over TLS"], [
    "Порт 6514 — syslog поверх TLS (RFC 5425): зашифрованная и надёжная доставка журналов.",
    "Port 6514 is syslog over TLS (RFC 5425): encrypted, reliable log delivery.",
  ], "rsyslog, syslog-ng", [514]),
  P(6568, "tcp,udp", "", false, "remote-access", ["AnyDesk (прямое подключение)", "AnyDesk direct connections"], [
    "Порт 6568 AnyDesk использует для прямых соединений между компьютерами; к серверам программа подключается через 80, 443 и 6568.",
    "AnyDesk uses port 6568 for direct connections between computers; it reaches its servers via 80, 443 and 6568.",
  ], "AnyDesk", [7070, 5938, 3389]),
  P(6650, "tcp", "", false, "messaging", ["Apache Pulsar", "Apache Pulsar"], [
    "Порт 6650 — бинарный протокол брокера сообщений Apache Pulsar (с TLS — 6651); HTTP-админка — 8080.",
    "Port 6650 is the Apache Pulsar broker binary protocol (6651 with TLS); the HTTP admin API is on 8080.",
  ], "Apache Pulsar", [9092, 8080]),
  P(6667, "tcp", "ircu", true, "messaging", ["IRC", "IRC"], [
    "Порт 6667 — фактический стандарт IRC без шифрования (серверы используют диапазон 6660–6669). Защищённые подключения — на 6697.",
    "Port 6667 is the de-facto IRC port without encryption (servers use 6660–6669). Secure connections use 6697.",
  ], "UnrealIRCd, InspIRCd, HexChat, irssi", [6697, 194, 113], [
    "IRC исторически служил каналом управления ботнетами: неожиданные исходящие подключения к 6667 — признак заражения.",
    "IRC was historically a botnet command channel: unexpected outbound connections to 6667 suggest an infection.",
  ]),
  P(6697, "tcp", "ircs-u", true, "messaging", ["IRC over TLS", "IRC over TLS"], [
    "Порт 6697 — IRC поверх TLS (RFC 7194): сети Libera.Chat, OFTC и другие.",
    "Port 6697 is IRC over TLS (RFC 7194): Libera.Chat, OFTC and other networks.",
  ], "Libera.Chat, OFTC, WeeChat, irssi", [6667, 194]),
  P(6881, "tcp,udp", "", false, "file-sharing", ["BitTorrent", "BitTorrent"], [
    "Порты 6881–6889 исторически использовали клиенты BitTorrent; сегодня клиенты обычно выбирают случайный порт, а DHT работает по UDP.",
    "Ports 6881–6889 were the classic BitTorrent range; modern clients usually pick a random port, and DHT runs over UDP.",
  ], "qBittorrent, Transmission, µTorrent", [51413, 22000]),
  P(7000, "tcp", "afs3-fileserver", false, "databases", ["Cassandra (узлы) / AirPlay", "Cassandra internode / AirPlay"], [
    "Порт 7000 — обмен данными между узлами Apache Cassandra (7001 — с TLS). На macOS 12+ его занимает приёмник AirPlay. Официально IANA закрепила порт за AFS.",
    "Port 7000 is Apache Cassandra inter-node traffic (7001 with TLS). On macOS 12+ the AirPlay Receiver takes it. IANA officially assigns it to AFS.",
  ], "Apache Cassandra, macOS AirPlay", [7001, 9042, 7199, 5000]),
  P(7001, "tcp", "afs3-callback", false, "databases", ["Cassandra (TLS) / WebLogic", "Cassandra (TLS) / WebLogic"], [
    "Порт 7001 — межузловой обмен Cassandra с TLS и HTTP-порт Oracle WebLogic Server по умолчанию.",
    "Port 7001 is Cassandra's TLS inter-node port and Oracle WebLogic Server's default HTTP port.",
  ], "Apache Cassandra, Oracle WebLogic", [7000, 9042], [
    "Консоли WebLogic на 7001 регулярно атакуют через десериализацию (T3, IIOP). Закройте консоль и протокол T3 снаружи.",
    "WebLogic consoles on 7001 are regularly attacked via deserialisation (T3, IIOP). Block the console and T3 externally.",
  ]),
  P(7070, "tcp", "", false, "remote-access", ["AnyDesk", "AnyDesk"], [
    "Порт 7070 AnyDesk использует для прямых подключений в локальной сети и к клиентам; также это порт RealServer/RTSP.",
    "AnyDesk uses port 7070 for direct LAN connections; it's also the old RealServer/RTSP port.",
  ], "AnyDesk", [6568, 5938]),
  P(7199, "tcp", "", false, "databases", ["Cassandra JMX", "Cassandra JMX"], [
    "Порт 7199 — JMX-мониторинг Apache Cassandra (nodetool подключается к нему).",
    "Port 7199 is Apache Cassandra's JMX monitoring port (nodetool connects to it).",
  ], "Apache Cassandra, nodetool", [9042, 7000], [
    "JMX без аутентификации позволяет выполнять код на узле. Слушайте только localhost.",
    "Unauthenticated JMX allows code execution on the node. Bind to localhost only.",
  ]),
  P(7474, "tcp", "", false, "databases", ["Neo4j (HTTP)", "Neo4j HTTP"], [
    "Порт 7474 — HTTP-интерфейс и Neo4j Browser графовой СУБД Neo4j (HTTPS — 7473).",
    "Port 7474 is the Neo4j graph database HTTP API and Neo4j Browser (HTTPS on 7473).",
  ], "Neo4j", [7687]),
  P(7687, "tcp", "", false, "databases", ["Neo4j Bolt", "Neo4j Bolt"], [
    "Порт 7687 — бинарный протокол Bolt для подключения драйверов к Neo4j.",
    "Port 7687 is the Bolt binary protocol for Neo4j drivers.",
  ], "Neo4j", [7474]),
  P(7777, "tcp,udp", "", false, "games", ["Игровые серверы (Terraria, ARK, Unreal)", "Game servers (Terraria, ARK, Unreal)"], [
    "Порт 7777 по умолчанию используют серверы Terraria (TCP), ARK: Survival Evolved (UDP), игры на Unreal Engine и многие другие. Для своего сервера пробросьте его на компьютер с игрой.",
    "Port 7777 is the default for Terraria (TCP), ARK: Survival Evolved (UDP), Unreal Engine games and many others. Forward it to the machine running your server.",
  ], "Terraria, ARK, Unreal Engine, SA-MP", [27015, 25565, 2456]),
  P(7860, "tcp", "", false, "dev-servers", ["Gradio / Stable Diffusion WebUI", "Gradio / Stable Diffusion WebUI"], [
    "Порт 7860 — интерфейсы на Gradio, в том числе AUTOMATIC1111 Stable Diffusion WebUI и многие демо Hugging Face.",
    "Port 7860 serves Gradio apps, including AUTOMATIC1111 Stable Diffusion WebUI and many Hugging Face demos.",
  ], "Gradio, Stable Diffusion WebUI", [8501, 11434, 8888], [
    "Опция --listen или share=True открывает интерфейс всем — с доступом к диску и расширениям. Держите на localhost или ставьте пароль.",
    "--listen or share=True exposes the UI to everyone, with disk and extension access. Keep it on localhost or set a password.",
  ]),
  P(7946, "tcp,udp", "", false, "devops", ["Docker Swarm / Serf gossip", "Docker Swarm / Serf gossip"], [
    "Порт 7946 — обмен сведениями между узлами Docker Swarm (обнаружение узлов, gossip) и библиотеки Serf/memberlist.",
    "Port 7946 carries node discovery and gossip between Docker Swarm nodes and the Serf/memberlist library.",
  ], "Docker Swarm, memberlist", [2377, 4789]),
  P(8000, "tcp", "irdmi", false, "dev-servers", ["Django / python -m http.server / Splunk", "Django / python -m http.server / Splunk"], [
    "Порт 8000 — dev-сервер Django (runserver), python -m http.server, FastAPI через uvicorn в документации, веб-интерфейс Splunk; также SDK-порт камер Hikvision.",
    "Port 8000 is the Django dev server (runserver), python -m http.server, uvicorn in FastAPI docs, the Splunk web UI, and the Hikvision camera SDK port.",
  ], "Django, Python, uvicorn, Splunk, Hikvision", [8080, 3000, 5000, 80], [
    "runserver и http.server не предназначены для продакшена и отдают файлы без ограничений. Не пробрасывайте 8000 на роутере; для камер Hikvision обновляйте прошивку.",
    "runserver and http.server aren't for production and serve files freely. Don't forward 8000; keep Hikvision firmware updated.",
  ]),
  P(8006, "tcp", "", false, "devops", ["Proxmox VE (веб-интерфейс)", "Proxmox VE web UI"], [
    "Порт 8006 — веб-интерфейс и API гипервизора Proxmox Virtual Environment (https://сервер:8006).",
    "Port 8006 is the Proxmox Virtual Environment web UI and API (https://server:8006).",
  ], "Proxmox VE", [8007, 22, 902], [
    "Панель гипервизора даёт контроль над всеми ВМ. Не открывайте её в интернет, включите 2FA.",
    "The hypervisor panel controls every VM. Don't expose it; enable 2FA.",
  ]),
  P(8007, "tcp", "", false, "devops", ["Proxmox Backup Server", "Proxmox Backup Server"], [
    "Порт 8007 — веб-интерфейс и API Proxmox Backup Server.",
    "Port 8007 is the Proxmox Backup Server web UI and API.",
  ], "Proxmox Backup Server", [8006]),
  P(8008, "tcp", "http-alt", true, "web", ["Альтернативный HTTP / Chromecast", "Alternative HTTP / Chromecast"], [
    "Порт 8008 — альтернативный HTTP-порт; его слушают устройства Google Cast (Chromecast, Android TV) для локального API, а также некоторые прокси и серверы Matrix Synapse.",
    "Port 8008 is an alternative HTTP port, used by Google Cast devices (Chromecast, Android TV) for a local API and by Matrix Synapse.",
  ], "Chromecast, Matrix Synapse", [8080, 8443, 5353]),
  P(8080, "tcp", "http-alt", true, "web", ["Альтернативный HTTP (8080)", "Alternative HTTP (8080)"], [
    "Порт 8080 — самый популярный альтернативный HTTP-порт: Apache Tomcat, Jenkins, Jira, прокси-серверы, dev-серверы и приложения в контейнерах, которым не нужен root для порта 80.",
    "Port 8080 is the most popular alternative HTTP port: Apache Tomcat, Jenkins, Jira, proxies, dev servers and containerised apps that don't need root for port 80.",
  ], "Tomcat, Jenkins, Jira, Squid, Traefik, Spring Boot", [80, 8443, 8000, 8081, 3128], [
    "На 8080 часто висят админки (Jenkins, Tomcat Manager) с паролями по умолчанию. Закройте их за reverse proxy с аутентификацией.",
    "Admin panels (Jenkins, Tomcat Manager) with default credentials often sit on 8080. Put them behind an authenticating reverse proxy.",
  ]),
  P(8081, "tcp", "", false, "dev-servers", ["Metro (React Native) / Nexus", "Metro (React Native) / Nexus"], [
    "Порт 8081 — сборщик Metro для React Native (и Expo), репозиторий Sonatype Nexus, а также запасной порт для второго веб-приложения.",
    "Port 8081 is the Metro bundler for React Native (and Expo), Sonatype Nexus Repository, and a fallback port for a second web app.",
  ], "React Native Metro, Expo, Sonatype Nexus", [8080, 3000, 5037]),
  P(8086, "tcp", "", false, "databases", ["InfluxDB", "InfluxDB"], [
    "Порт 8086 — HTTP API базы временных рядов InfluxDB (запись и запросы метрик) и её веб-интерфейс в версии 2.x.",
    "Port 8086 is the InfluxDB time-series database HTTP API (writing and querying metrics) and its 2.x UI.",
  ], "InfluxDB, Telegraf", [3000, 9090, 8125], [
    "InfluxDB 1.x по умолчанию без аутентификации — включите auth-enabled и закройте порт снаружи.",
    "InfluxDB 1.x has no authentication by default — enable auth-enabled and block external access.",
  ]),
  P(8089, "tcp", "", false, "devops", ["Splunk (управление)", "Splunk management"], [
    "Порт 8089 — REST API управления Splunk (splunkd); веб-интерфейс Splunk — на 8000, приём данных от форвардеров — на 9997.",
    "Port 8089 is the Splunk management REST API (splunkd); Splunk Web is on 8000 and forwarder input on 9997.",
  ], "Splunk", [8000, 9997]),
  P(8091, "tcp", "", false, "databases", ["Couchbase", "Couchbase"], [
    "Порт 8091 — веб-консоль и REST API Couchbase Server.",
    "Port 8091 is the Couchbase Server web console and REST API.",
  ], "Couchbase Server", [11211, 27017]),
  P(8118, "tcp", "", false, "vpn-proxy", ["Privoxy", "Privoxy"], [
    "Порт 8118 — фильтрующий HTTP-прокси Privoxy; часто ставится в цепочку перед Tor (9050).",
    "Port 8118 is the Privoxy filtering HTTP proxy, often chained in front of Tor (9050).",
  ], "Privoxy", [9050, 3128, 1080]),
  P(8123, "tcp", "", false, "iot", ["Home Assistant / ClickHouse HTTP", "Home Assistant / ClickHouse HTTP"], [
    "Порт 8123 — веб-интерфейс Home Assistant (http://homeassistant.local:8123) и HTTP-интерфейс СУБД ClickHouse — два популярных, но совсем разных применения.",
    "Port 8123 is the Home Assistant UI (http://homeassistant.local:8123) and the ClickHouse HTTP interface — two popular but unrelated uses.",
  ], "Home Assistant, ClickHouse", [1883, 6053, 9000, 5540], [
    "Для удалённого доступа к Home Assistant используйте Nabu Casa, VPN или reverse proxy с HTTPS и 2FA. У ClickHouse пользователь default без пароля — задайте пароль.",
    "For remote Home Assistant access use Nabu Casa, a VPN or an HTTPS reverse proxy with 2FA. ClickHouse's default user has no password — set one.",
  ]),
  P(8125, "udp", "", false, "devops", ["StatsD", "StatsD"], [
    "UDP 8125 — приём метрик StatsD (счётчики, таймеры) от приложений; используют Datadog Agent, Telegraf, statsd_exporter.",
    "UDP 8125 receives StatsD metrics (counters, timers) from apps; used by the Datadog Agent, Telegraf and statsd_exporter.",
  ], "StatsD, Datadog Agent, Telegraf", [8086, 9090]),
  P(8200, "tcp", "", false, "devops", ["HashiCorp Vault", "HashiCorp Vault"], [
    "Порт 8200 — API и веб-интерфейс HashiCorp Vault, хранилища секретов; 8201 — связь узлов кластера.",
    "Port 8200 is the HashiCorp Vault API and UI; 8201 is cluster traffic.",
  ], "HashiCorp Vault, OpenBao", [8500, 4646], [
    "Vault хранит самые чувствительные данные: всегда TLS, ограничение сети и аудит-журнал.",
    "Vault holds your most sensitive data: always TLS, network restrictions and an audit log.",
  ]),
  P(8211, "udp", "", false, "games", ["Palworld", "Palworld"], [
    "UDP 8211 — порт выделенного сервера Palworld по умолчанию.",
    "UDP 8211 is the default Palworld dedicated server port.",
  ], "Palworld Dedicated Server", [27015, 7777]),
  P(8222, "tcp", "", false, "messaging", ["NATS (мониторинг)", "NATS monitoring"], [
    "Порт 8222 — HTTP-мониторинг сервера NATS (/varz, /connz).",
    "Port 8222 is the NATS server HTTP monitoring endpoint (/varz, /connz).",
  ], "NATS", [4222, 6222]),
  P(8291, "tcp", "", false, "remote-access", ["MikroTik Winbox", "MikroTik Winbox"], [
    "Порт 8291 — Winbox, фирменная утилита управления роутерами MikroTik RouterOS.",
    "Port 8291 is Winbox, the management tool for MikroTik RouterOS routers.",
  ], "MikroTik RouterOS, Winbox", [22, 8728, 2000], [
    "Уязвимость Winbox (CVE-2018-14847) позволяла прочитать пароли с роутера без авторизации; ей заражали сотни тысяч MikroTik. Обновите RouterOS и разрешайте Winbox только из доверенных сетей.",
    "A Winbox flaw (CVE-2018-14847) let attackers read router passwords without auth, infecting hundreds of thousands of MikroTiks. Update RouterOS and allow Winbox only from trusted networks.",
  ]),
  P(8300, "tcp", "", false, "devops", ["Consul RPC", "Consul server RPC"], [
    "Порт 8300 — RPC между серверами и агентами HashiCorp Consul; 8301/8302 — gossip в LAN и WAN.",
    "Port 8300 is HashiCorp Consul server RPC; 8301/8302 are LAN and WAN gossip.",
  ], "HashiCorp Consul", [8500, 8600, 8301]),
  P(8301, "tcp,udp", "", false, "devops", ["Consul LAN gossip", "Consul LAN gossip"], [
    "Порт 8301 — обмен состоянием (gossip) между агентами Consul внутри одного дата-центра.",
    "Port 8301 is gossip between Consul agents within a data centre.",
  ], "HashiCorp Consul", [8300, 8500]),
  P(8384, "tcp", "", false, "file-sharing", ["Syncthing (веб-интерфейс)", "Syncthing web UI"], [
    "Порт 8384 — веб-интерфейс Syncthing (http://127.0.0.1:8384); сама синхронизация идёт через 22000.",
    "Port 8384 is the Syncthing web UI (http://127.0.0.1:8384); syncing itself uses 22000.",
  ], "Syncthing", [22000]),
  P(8443, "tcp", "pcsync-https", false, "web", ["Альтернативный HTTPS (8443)", "Alternative HTTPS (8443)"], [
    "Порт 8443 — альтернативный HTTPS: Tomcat, панель Plesk (https://сервер:8443), контроллер UniFi, дашборд Kubernetes и многие приложения, которым нужен второй HTTPS-порт.",
    "Port 8443 is alternative HTTPS: Tomcat, the Plesk panel (https://server:8443), the UniFi controller, the Kubernetes dashboard and many apps needing a second HTTPS port.",
  ], "Plesk, Tomcat, UniFi Controller, Keycloak", [443, 8080, 8880, 10000], [
    "Обычно это панели управления — закрывайте их по IP или через VPN и включайте 2FA.",
    "It's usually a control panel — restrict it by IP or VPN and enable 2FA.",
  ]),
  P(8472, "udp", "", false, "devops", ["Flannel VXLAN", "Flannel VXLAN"], [
    "UDP 8472 — VXLAN в Linux по умолчанию (номер из ранних черновиков): его используют Flannel (k3s, k8s) и Cilium.",
    "UDP 8472 is the Linux kernel's default VXLAN port (from early drafts), used by Flannel (k3s, k8s) and Cilium.",
  ], "Flannel, k3s, Cilium", [4789, 6443]),
  P(8500, "tcp", "", false, "devops", ["Consul HTTP API", "Consul HTTP API"], [
    "Порт 8500 — HTTP API и веб-интерфейс HashiCorp Consul: каталог сервисов, KV-хранилище, health checks.",
    "Port 8500 is the HashiCorp Consul HTTP API and UI: service catalogue, KV store, health checks.",
  ], "HashiCorp Consul", [8600, 8300, 8200], [
    "Consul без ACL с включёнными скриптовыми проверками позволяет выполнить код на всех узлах. Включите ACL и отключите enable_script_checks.",
    "Consul without ACLs and with script checks enabled allows code execution on every node. Enable ACLs and disable enable_script_checks.",
  ]),
  P(8501, "tcp", "", false, "dev-servers", ["Streamlit", "Streamlit"], [
    "Порт 8501 — Streamlit по умолчанию (streamlit run app.py). Совпадает с HTTPS-портом Consul.",
    "Port 8501 is the Streamlit default (streamlit run app.py). It coincides with Consul's HTTPS port.",
  ], "Streamlit, Consul (HTTPS)", [7860, 8888]),
  P(8529, "tcp", "", false, "databases", ["ArangoDB", "ArangoDB"], [
    "Порт 8529 — HTTP API и веб-интерфейс мультимодельной СУБД ArangoDB.",
    "Port 8529 is the ArangoDB multi-model database HTTP API and web UI.",
  ], "ArangoDB", [27017, 7474]),
  P(8554, "tcp", "", false, "voip-media", ["RTSP (альтернативный)", "Alternative RTSP"], [
    "Порт 8554 — альтернативный RTSP для программных медиасерверов: MediaMTX (rtsp-simple-server), go2rtc, Frigate.",
    "Port 8554 is an alternative RTSP port for software media servers: MediaMTX (rtsp-simple-server), go2rtc, Frigate.",
  ], "MediaMTX, go2rtc, Frigate", [554, 1935]),
  P(8600, "tcp,udp", "", false, "devops", ["Consul DNS", "Consul DNS"], [
    "Порт 8600 — DNS-интерфейс Consul: имена вида web.service.consul разрешаются в адреса здоровых экземпляров.",
    "Port 8600 is Consul's DNS interface: names like web.service.consul resolve to healthy instances.",
  ], "HashiCorp Consul", [8500, 53]),
  P(8728, "tcp", "", false, "remote-access", ["MikroTik API", "MikroTik API"], [
    "Порт 8728 — API RouterOS для скриптов и систем управления (8729 — с TLS).",
    "Port 8728 is the RouterOS API for scripts and management systems (8729 with TLS).",
  ], "MikroTik RouterOS", [8291, 22]),
  P(8787, "tcp", "", false, "dev-servers", ["RStudio Server / Wrangler", "RStudio Server / Wrangler"], [
    "Порт 8787 — RStudio Server и dev-сервер Cloudflare Wrangler (wrangler dev) по умолчанию.",
    "Port 8787 is RStudio Server and the Cloudflare Wrangler dev server (wrangler dev) by default.",
  ], "RStudio Server, Cloudflare Wrangler", [8888, 3000]),
  P(8801, "udp,tcp", "", false, "voip-media", ["Zoom (медиа)", "Zoom media"], [
    "Порты 8801–8810 клиент Zoom использует для аудио и видео конференций; при блокировке переходит на 443.",
    "The Zoom client uses ports 8801–8810 for meeting audio and video, falling back to 443 if blocked.",
  ], "Zoom", [3478, 443]),
  P(8880, "tcp", "cddbp-alt", false, "web", ["Plesk (HTTP)", "Plesk (HTTP)"], [
    "Порт 8880 — вход в панель Plesk без шифрования (с HTTPS — 8443).",
    "Port 8880 is Plesk panel access without encryption (8443 with HTTPS).",
  ], "Plesk", [8443, 2083]),
  P(8883, "tcp", "secure-mqtt", true, "iot", ["MQTT over TLS", "MQTT over TLS"], [
    "Порт 8883 — MQTT поверх TLS: защищённое подключение устройств к брокеру (AWS IoT Core, Azure IoT Hub, Mosquitto с сертификатами).",
    "Port 8883 is MQTT over TLS: secure device connections to a broker (AWS IoT Core, Azure IoT Hub, Mosquitto with certificates).",
  ], "Mosquitto, EMQX, AWS IoT Core, Azure IoT Hub", [1883, 5684]),
  P(8888, "tcp", "", false, "dev-servers", ["Jupyter Notebook", "Jupyter Notebook"], [
    "Порт 8888 — Jupyter Notebook и JupyterLab по умолчанию; также альтернативный HTTP-порт некоторых прокси.",
    "Port 8888 is the Jupyter Notebook and JupyterLab default, and an alternative HTTP port for some proxies.",
  ], "Jupyter, JupyterLab", [8000, 6006, 8787], [
    "Jupyter — это выполнение произвольного кода. Не запускайте его с --ip=0.0.0.0 без токена или пароля.",
    "Jupyter means arbitrary code execution. Never run it with --ip=0.0.0.0 without a token or password.",
  ]),
  P(9000, "tcp", "cslistener", false, "devops", ["PHP-FPM, MinIO, SonarQube и др.", "PHP-FPM, MinIO, SonarQube etc."], [
    "Порт 9000 используют сразу несколько популярных программ: PHP-FPM (FastCGI), MinIO API, SonarQube, Portainer (HTTP) и нативный протокол ClickHouse. Что именно там — зависит от сервера.",
    "Port 9000 is shared by several popular programs: PHP-FPM (FastCGI), the MinIO API, SonarQube, Portainer (HTTP) and ClickHouse's native protocol. What's there depends on the server.",
  ], "PHP-FPM, MinIO, SonarQube, Portainer, ClickHouse", [9001, 9443, 8123, 80], [
    "PHP-FPM, доступный извне, позволяет выполнить любой PHP-код — слушайте 127.0.0.1 или Unix-сокет. Для MinIO смените ключи по умолчанию minioadmin.",
    "An exposed PHP-FPM allows arbitrary PHP execution — listen on 127.0.0.1 or a Unix socket. For MinIO change the default minioadmin keys.",
  ]),
  P(9001, "tcp", "", false, "devops", ["Tor ORPort / MinIO Console / Supervisor", "Tor ORPort / MinIO Console / Supervisor"], [
    "Порт 9001 — ORPort ретрансляторов Tor, веб-консоль MinIO и веб-интерфейс supervisord.",
    "Port 9001 is the Tor relay ORPort, the MinIO web console and the supervisord web UI.",
  ], "Tor, MinIO, supervisord", [9000, 9050]),
  P(9009, "tcp", "", false, "databases", ["ClickHouse (репликация)", "ClickHouse interserver"], [
    "Порт 9009 — обмен данными между репликами ClickHouse (interserver HTTP).",
    "Port 9009 is ClickHouse interserver HTTP traffic between replicas.",
  ], "ClickHouse", [8123, 9000]),
  P(9042, "tcp", "", false, "databases", ["Cassandra CQL", "Cassandra CQL"], [
    "Порт 9042 — нативный протокол CQL: приложения и cqlsh подключаются к Apache Cassandra и ScyllaDB.",
    "Port 9042 is the CQL native protocol: apps and cqlsh connect to Apache Cassandra and ScyllaDB.",
  ], "Apache Cassandra, ScyllaDB, DataStax", [7000, 7199], [
    "Включите PasswordAuthenticator: по умолчанию Cassandra принимает подключения без пароля (или с cassandra/cassandra).",
    "Enable PasswordAuthenticator: by default Cassandra accepts connections without a password (or with cassandra/cassandra).",
  ]),
  P(9050, "tcp", "", false, "vpn-proxy", ["Tor SOCKS", "Tor SOCKS"], [
    "Порт 9050 — SOCKS-прокси службы Tor; Tor Browser использует свой 9150. Приложения направляют трафик в Tor через 127.0.0.1:9050.",
    "Port 9050 is the Tor service SOCKS proxy; Tor Browser uses 9150. Apps route traffic into Tor via 127.0.0.1:9050.",
  ], "Tor", [9051, 9001, 8118, 1080]),
  P(9051, "tcp", "", false, "vpn-proxy", ["Tor Control", "Tor control port"], [
    "Порт 9051 — управляющий порт Tor для программ вроде Nyx и stem.",
    "Port 9051 is the Tor control port used by tools like Nyx and stem.",
  ], "Tor, Nyx", [9050], [
    "Требуйте аутентификацию (CookieAuthentication или HashedControlPassword) — иначе локальное ПО сможет перенастроить Tor.",
    "Require authentication (CookieAuthentication or HashedControlPassword), or local software can reconfigure Tor.",
  ]),
  P(9090, "tcp", "", false, "devops", ["Prometheus / Cockpit", "Prometheus / Cockpit"], [
    "Порт 9090 — сервер метрик Prometheus (веб-интерфейс и API) и веб-консоль управления Linux Cockpit.",
    "Port 9090 is the Prometheus server (UI and API) and the Cockpit Linux web console.",
  ], "Prometheus, Cockpit", [9100, 9093, 3000, 9091], [
    "У Prometheus нет встроенной аутентификации — метрики раскрывают внутренние адреса и версии. Закройте порт или поставьте reverse proxy с паролем.",
    "Prometheus has no built-in authentication — metrics reveal internal hosts and versions. Block the port or add an authenticating reverse proxy.",
  ]),
  P(9091, "tcp", "", false, "devops", ["Prometheus Pushgateway / Transmission", "Prometheus Pushgateway / Transmission"], [
    "Порт 9091 — Prometheus Pushgateway (метрики от коротких задач) и веб-интерфейс торрент-клиента Transmission.",
    "Port 9091 is the Prometheus Pushgateway (metrics from short-lived jobs) and the Transmission torrent web UI.",
  ], "Pushgateway, Transmission", [9090, 51413]),
  P(9092, "tcp", "", false, "messaging", ["Apache Kafka", "Apache Kafka"], [
    "Порт 9092 — брокер Apache Kafka по умолчанию (протокол Kafka). Совместимые системы — Redpanda, Amazon MSK — используют его же.",
    "Port 9092 is the Apache Kafka broker default (Kafka protocol), also used by compatible systems like Redpanda and Amazon MSK.",
  ], "Apache Kafka, Redpanda, Amazon MSK", [9093, 2181, 9094], [
    "По умолчанию listener PLAINTEXT без аутентификации — любой может читать и писать топики. Используйте SASL_SSL и ACL.",
    "The default PLAINTEXT listener has no authentication — anyone can read and write topics. Use SASL_SSL and ACLs.",
  ]),
  P(9093, "tcp", "", false, "devops", ["Alertmanager / Kafka (TLS)", "Alertmanager / Kafka (TLS)"], [
    "Порт 9093 — Prometheus Alertmanager и, по распространённой договорённости, SSL-listener Kafka.",
    "Port 9093 is Prometheus Alertmanager and, by common convention, Kafka's SSL listener.",
  ], "Alertmanager, Apache Kafka", [9090, 9092]),
  P(9094, "tcp", "", false, "messaging", ["Kafka (дополнительный listener)", "Kafka extra listener"], [
    "Порт 9094 часто назначают внешнему listener Kafka (например, в Docker-образах Bitnami) или SASL-подключениям.",
    "Port 9094 is often assigned to Kafka's external listener (e.g. in Bitnami Docker images) or SASL connections.",
  ], "Apache Kafka", [9092, 9093]),
  P(9100, "tcp", "", false, "printing", ["Печать RAW (JetDirect) / node_exporter", "RAW printing (JetDirect) / node_exporter"], [
    "Порт 9100 — «сырая» печать на сетевой принтер (HP JetDirect, AppSocket): данные сразу уходят в очередь печати. Тот же порт по умолчанию у Prometheus node_exporter.",
    "Port 9100 is RAW printing to a network printer (HP JetDirect, AppSocket): data goes straight to the print queue. Prometheus node_exporter uses the same port by default.",
  ], "HP, Brother, Kyocera, Prometheus node_exporter", [631, 515, 9090], [
    "Принтер, отвечающий на 9100 из интернета, распечатает что угодно — были массовые «атаки» с листовками. Отдельно: node_exporter раскрывает сведения о системе.",
    "A printer answering on 9100 from the Internet prints anything — mass flyer-printing stunts have happened. node_exporter, separately, reveals system details.",
  ]),
  P(9200, "tcp", "", false, "databases", ["Elasticsearch / OpenSearch (HTTP)", "Elasticsearch / OpenSearch HTTP"], [
    "Порт 9200 — REST API Elasticsearch и OpenSearch: индексация и поиск документов, логов, метрик.",
    "Port 9200 is the Elasticsearch and OpenSearch REST API: indexing and searching documents, logs and metrics.",
  ], "Elasticsearch, OpenSearch", [9300, 5601, 5044], [
    "Открытые Elasticsearch — источник крупнейших утечек персональных данных. С версии 8 безопасность включена по умолчанию — не отключайте её и закройте порт.",
    "Exposed Elasticsearch clusters are behind some of the largest personal data leaks. Security is on by default since 8.0 — keep it and block the port.",
  ]),
  P(9229, "tcp", "", false, "dev-servers", ["Node.js inspector", "Node.js inspector"], [
    "Порт 9229 — отладчик Node.js (node --inspect): Chrome DevTools и VS Code подключаются к нему по протоколу CDP.",
    "Port 9229 is the Node.js debugger (node --inspect): Chrome DevTools and VS Code attach via CDP.",
  ], "Node.js, Chrome DevTools, VS Code", [3000, 9222], [
    "Доступ к инспектору = выполнение кода в процессе. Никогда не используйте --inspect=0.0.0.0 на сервере.",
    "Inspector access equals code execution in the process. Never use --inspect=0.0.0.0 on a server.",
  ]),
  P(9222, "tcp", "", false, "dev-servers", ["Chrome remote debugging", "Chrome remote debugging"], [
    "Порт 9222 — удалённая отладка Chrome и Chromium (--remote-debugging-port=9222): через него работают Puppeteer, Playwright и DevTools.",
    "Port 9222 is Chrome/Chromium remote debugging (--remote-debugging-port=9222), used by Puppeteer, Playwright and DevTools.",
  ], "Chrome, Chromium, Puppeteer, Playwright", [9229], [
    "Протокол CDP даёт полный доступ к браузеру, включая cookie и сессии. Слушайте только localhost.",
    "CDP gives full browser access, cookies and sessions included. Bind to localhost only.",
  ]),
  P(9300, "tcp", "", false, "databases", ["Elasticsearch (транспорт)", "Elasticsearch transport"], [
    "Порт 9300 — внутренний транспорт Elasticsearch/OpenSearch: связь между узлами кластера.",
    "Port 9300 is the Elasticsearch/OpenSearch transport layer between cluster nodes.",
  ], "Elasticsearch, OpenSearch", [9200]),
  P(9389, "tcp", "adws", true, "directory", ["Active Directory Web Services", "Active Directory Web Services"], [
    "Порт 9389 — Active Directory Web Services: через него работают модуль PowerShell ActiveDirectory и центр администрирования AD.",
    "Port 9389 is Active Directory Web Services, used by the PowerShell ActiveDirectory module and AD Administrative Center.",
  ], "Active Directory", [389, 88, 3268]),
  P(9411, "tcp", "", false, "devops", ["Zipkin", "Zipkin"], [
    "Порт 9411 — приём трассировок и веб-интерфейс Zipkin; совместимый API есть у Jaeger и OpenTelemetry Collector.",
    "Port 9411 receives traces and serves the Zipkin UI; Jaeger and the OpenTelemetry Collector offer a compatible API.",
  ], "Zipkin, Jaeger", [4317, 16686, 14268]),
  P(9418, "tcp", "git", true, "devops", ["Git protocol (git://)", "Git protocol (git://)"], [
    "Порт 9418 — собственный протокол Git (git://, git daemon): быстрое анонимное чтение репозиториев без шифрования и аутентификации.",
    "Port 9418 is the native Git protocol (git://, git daemon): fast anonymous read access with no encryption or authentication.",
  ], "git daemon", [22, 443, 3690], [
    "git:// не проверяет подлинность сервера — GitHub отключил его в 2022 году. Используйте HTTPS или SSH.",
    "git:// doesn't authenticate the server — GitHub turned it off in 2022. Use HTTPS or SSH.",
  ]),
  P(9443, "tcp", "", false, "devops", ["Portainer (HTTPS)", "Portainer HTTPS"], [
    "Порт 9443 — веб-интерфейс Portainer по HTTPS; также альтернативный HTTPS-порт других приложений (VMware vSphere Web Client раньше).",
    "Port 9443 is the Portainer web UI over HTTPS, and an alternative HTTPS port for other apps.",
  ], "Portainer", [9000, 2375, 8443], [
    "Portainer управляет Docker целиком. Не открывайте его без необходимости, используйте сложный пароль.",
    "Portainer controls Docker entirely. Don't expose it unnecessarily; use a strong password.",
  ]),
  P(9600, "tcp", "", false, "devops", ["Logstash API", "Logstash monitoring API"], [
    "Порт 9600 — API мониторинга Logstash (статистика пайплайнов).",
    "Port 9600 is the Logstash monitoring API (pipeline stats).",
  ], "Logstash", [5044, 9200]),
  P(9987, "udp", "", false, "games", ["TeamSpeak 3 (голос)", "TeamSpeak 3 voice"], [
    "UDP 9987 — голосовой порт сервера TeamSpeak 3; 10011 — ServerQuery, 30033 — передача файлов.",
    "UDP 9987 is the TeamSpeak 3 voice port; 10011 is ServerQuery and 30033 file transfer.",
  ], "TeamSpeak 3", [10011, 30033, 64738]),
  P(9993, "udp", "", false, "vpn-proxy", ["ZeroTier", "ZeroTier"], [
    "UDP 9993 — ZeroTier, программная виртуальная сеть (peer-to-peer VPN).",
    "UDP 9993 is ZeroTier, a software-defined peer-to-peer virtual network.",
  ], "ZeroTier", [41641, 51820]),
  P(9997, "tcp", "", false, "devops", ["Splunk (приём от форвардеров)", "Splunk forwarder input"], [
    "Порт 9997 — приём данных от Splunk Universal Forwarder на индексатор.",
    "Port 9997 is where indexers receive data from the Splunk Universal Forwarder.",
  ], "Splunk", [8089, 8000]),
];
