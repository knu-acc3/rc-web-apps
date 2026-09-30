import { P, type PortDef } from "./types";

/** Registered and dynamic ports 10000–65535. */
export const PORTS_HIGH: PortDef[] = [
  P(10000, "tcp", "ndmp", false, "web", ["Webmin", "Webmin"], [
    "Порт 10000 — веб-панель администрирования Linux-серверов Webmin (https://сервер:10000). Также по умолчанию его используют NDMP для резервного копирования и диапазон RTP в Asterisk начинается с 10000.",
    "Port 10000 is Webmin, the Linux server admin panel (https://server:10000). NDMP backups also default to it, and Asterisk's RTP range starts at 10000.",
  ], "Webmin, Virtualmin, NDMP", [8443, 22, 2087], [
    "Webmin работает с правами root; в 2019 году в его дистрибутиве нашли бэкдор (CVE-2019-15107). Обновляйте панель и ограничьте доступ по IP.",
    "Webmin runs as root, and a backdoor was found in its distribution in 2019 (CVE-2019-15107). Keep it updated and restrict it by IP.",
  ]),
  P(10011, "tcp", "", false, "games", ["TeamSpeak 3 ServerQuery", "TeamSpeak 3 ServerQuery"], [
    "Порт 10011 — текстовый интерфейс администрирования ServerQuery сервера TeamSpeak 3.",
    "Port 10011 is the TeamSpeak 3 ServerQuery text admin interface.",
  ], "TeamSpeak 3", [9987, 30033], [
    "Через ServerQuery можно управлять всем сервером — разрешайте его только с доверенных IP (query_ip_allowlist).",
    "ServerQuery controls the whole server — allow it only from trusted IPs (query_ip_allowlist).",
  ]),
  P(10050, "tcp", "zabbix-agent", true, "devops", ["Zabbix Agent", "Zabbix agent"], [
    "Порт 10050 — Zabbix Agent: сервер мониторинга опрашивает на нём метрики хоста (пассивные проверки).",
    "Port 10050 is the Zabbix agent: the monitoring server polls host metrics on it (passive checks).",
  ], "Zabbix", [10051, 161, 9100], [
    "Разрешайте подключения только от сервера Zabbix (параметр Server=) и не включайте system.run без необходимости.",
    "Allow connections only from the Zabbix server (Server=) and don't enable system.run unless needed.",
  ]),
  P(10051, "tcp", "zabbix-trapper", true, "devops", ["Zabbix Server (trapper)", "Zabbix server trapper"], [
    "Порт 10051 — Zabbix Server и Proxy принимают на нём данные активных агентов и Zabbix sender.",
    "Port 10051 is where Zabbix Server and Proxy receive data from active agents and zabbix_sender.",
  ], "Zabbix", [10050]),
  P(10250, "tcp", "", false, "devops", ["kubelet API", "kubelet API"], [
    "Порт 10250 — API kubelet на каждом узле Kubernetes: API-сервер через него получает логи, выполняет exec и port-forward в подах.",
    "Port 10250 is the kubelet API on every Kubernetes node: the API server uses it for logs, exec and port-forward into pods.",
  ], "Kubernetes kubelet", [6443, 10255, 2379, 10256], [
    "Kubelet с anonymous-auth и режимом авторизации AlwaysAllow позволяет выполнять команды в любом поде узла. Включите webhook-авторизацию и закройте порт снаружи.",
    "A kubelet with anonymous auth and AlwaysAllow lets anyone exec into every pod on the node. Use webhook authorisation and block the port externally.",
  ]),
  P(10255, "tcp", "", false, "devops", ["kubelet read-only (устарел)", "kubelet read-only (deprecated)"], [
    "Порт 10255 — устаревший read-only API kubelet без аутентификации; в современных кластерах отключён (readOnlyPort: 0).",
    "Port 10255 is the deprecated unauthenticated read-only kubelet API, disabled in modern clusters (readOnlyPort: 0).",
  ], "Kubernetes kubelet", [10250], [
    "Раскрывает сведения о подах и узле без пароля — отключите.",
    "It reveals pod and node details without authentication — disable it.",
  ]),
  P(10256, "tcp", "", false, "devops", ["kube-proxy health", "kube-proxy health check"], [
    "Порт 10256 — проверка работоспособности kube-proxy (/healthz); её используют балансировщики облаков.",
    "Port 10256 is the kube-proxy health endpoint (/healthz), used by cloud load balancers.",
  ], "Kubernetes kube-proxy", [10250, 6443]),
  P(10257, "tcp", "", false, "devops", ["kube-controller-manager", "kube-controller-manager"], [
    "Порт 10257 — защищённый HTTPS-порт kube-controller-manager (метрики, healthz).",
    "Port 10257 is the kube-controller-manager secure HTTPS port (metrics, healthz).",
  ], "Kubernetes", [10259, 6443]),
  P(10259, "tcp", "", false, "devops", ["kube-scheduler", "kube-scheduler"], [
    "Порт 10259 — защищённый HTTPS-порт kube-scheduler (метрики, healthz).",
    "Port 10259 is the kube-scheduler secure HTTPS port (metrics, healthz).",
  ], "Kubernetes", [10257, 6443]),
  P(11211, "tcp,udp", "memcache", true, "databases", ["Memcached", "Memcached"], [
    "Порт 11211 — memcached, распределённый кеш в памяти для веб-приложений (PHP, Python, Ruby).",
    "Port 11211 is memcached, the in-memory cache for web applications (PHP, Python, Ruby).",
  ], "memcached, Couchbase", [6379, 8091], [
    "UDP 11211 дал рекордное DDoS-усиление — до 50 000 раз (атака на GitHub в 2018 году, 1,35 Тбит/с). С версии 1.5.6 UDP выключен по умолчанию; слушайте только localhost и не открывайте порт.",
    "UDP 11211 delivered record DDoS amplification — up to 50,000× (the 1.35 Tbps attack on GitHub in 2018). Since 1.5.6 UDP is off by default; listen on localhost and keep the port closed.",
  ]),
  P(11434, "tcp", "", false, "dev-servers", ["Ollama API", "Ollama API"], [
    "Порт 11434 — локальный API Ollama для запуска языковых моделей (http://localhost:11434).",
    "Port 11434 is the local Ollama API for running language models (http://localhost:11434).",
  ], "Ollama, Open WebUI", [7860, 8888], [
    "У API Ollama нет аутентификации: при OLLAMA_HOST=0.0.0.0 кто угодно сможет пользоваться вашей видеокартой и загружать модели. Слушайте localhost или ставьте прокси с паролем.",
    "The Ollama API has no authentication: with OLLAMA_HOST=0.0.0.0 anyone can use your GPU and pull models. Listen on localhost or add a password-protected proxy.",
  ]),
  P(14268, "tcp", "", false, "devops", ["Jaeger collector (HTTP)", "Jaeger collector HTTP"], [
    "Порт 14268 — приём спанов по HTTP коллектором Jaeger (формат Thrift); современные SDK отправляют данные по OTLP на 4317/4318.",
    "Port 14268 is the Jaeger collector's HTTP span intake (Thrift); modern SDKs send OTLP to 4317/4318 instead.",
  ], "Jaeger", [16686, 4317, 9411]),
  P(15672, "tcp", "", false, "messaging", ["RabbitMQ Management", "RabbitMQ Management UI"], [
    "Порт 15672 — веб-интерфейс и HTTP API плагина управления RabbitMQ.",
    "Port 15672 is the RabbitMQ management plugin web UI and HTTP API.",
  ], "RabbitMQ", [5672, 5671, 25672], [
    "Не публикуйте панель наружу и не оставляйте пользователя guest с удалённым доступом.",
    "Don't publish the panel externally and never allow the guest user remote access.",
  ]),
  P(16379, "tcp", "", false, "databases", ["Redis Cluster bus", "Redis Cluster bus"], [
    "Порт 16379 — шина кластера Redis: узлы обмениваются состоянием по порту «основной + 10000».",
    "Port 16379 is the Redis Cluster bus: nodes exchange state on “data port + 10000”.",
  ], "Redis Cluster", [6379, 26379]),
  P(16686, "tcp", "", false, "devops", ["Jaeger UI", "Jaeger UI"], [
    "Порт 16686 — веб-интерфейс и API запросов Jaeger для просмотра распределённых трассировок.",
    "Port 16686 is the Jaeger web UI and query API for viewing distributed traces.",
  ], "Jaeger", [14268, 4317, 9411]),
  P(19132, "udp", "", false, "games", ["Minecraft Bedrock", "Minecraft Bedrock"], [
    "UDP 19132 — сервер Minecraft Bedrock Edition (телефоны, консоли, Windows); для IPv6 — 19133.",
    "UDP 19132 is Minecraft Bedrock Edition servers (phones, consoles, Windows); 19133 for IPv6.",
  ], "Minecraft Bedrock Dedicated Server, Geyser", [25565, 25575]),
  P(19302, "udp", "", false, "voip-media", ["Google STUN", "Google STUN"], [
    "UDP 19302 — публичные STUN-серверы Google (stun.l.google.com:19302), которые многие WebRTC-приложения прописывают по умолчанию для определения внешнего адреса.",
    "UDP 19302 is Google's public STUN servers (stun.l.google.com:19302), which many WebRTC apps use by default to learn their public address.",
  ], "WebRTC, Chrome, Google Meet", [3478, 5349]),
  P(20000, "tcp,udp", "dnp", true, "iot", ["DNP3", "DNP3"], [
    "Порт 20000 — DNP3, протокол телемеханики в электроэнергетике и водоснабжении (связь SCADA с RTU и контроллерами).",
    "Port 20000 is DNP3, the telemetry protocol of power and water utilities (SCADA to RTUs and controllers).",
  ], "SCADA, RTU", [2404, 502, 102], [
    "DNP3 без Secure Authentication позволяет подделывать команды оборудованию. Только изолированные технологические сети.",
    "DNP3 without Secure Authentication allows spoofed commands to equipment. Isolated OT networks only.",
  ]),
  P(22000, "tcp,udp", "", false, "file-sharing", ["Syncthing", "Syncthing"], [
    "Порт 22000 — синхронизация файлов Syncthing между устройствами (TCP и QUIC по UDP); веб-интерфейс — на 8384.",
    "Port 22000 is Syncthing device-to-device file sync (TCP and QUIC over UDP); the web UI is on 8384.",
  ], "Syncthing", [8384, 6881]),
  P(24224, "tcp,udp", "", false, "devops", ["Fluentd forward", "Fluentd forward"], [
    "Порт 24224 — протокол forward сборщиков логов Fluentd и Fluent Bit; его же использует драйвер логов Docker fluentd.",
    "Port 24224 is the Fluentd/Fluent Bit forward protocol, also used by Docker's fluentd logging driver.",
  ], "Fluentd, Fluent Bit", [5044, 514]),
  P(25565, "tcp", "", false, "games", ["Minecraft Java Edition", "Minecraft Java Edition"], [
    "Порт 25565 — сервер Minecraft Java Edition по умолчанию. Чтобы друзья подключились к вашему серверу, пробросьте TCP 25565 на роутере на компьютер с сервером.",
    "Port 25565 is the Minecraft Java Edition server default. For friends to join, forward TCP 25565 on your router to the server machine.",
  ], "Minecraft Server, Paper, Spigot, Forge", [19132, 25575, 7777], [
    "Используйте whitelist и online-mode=true (проверка лицензии), обновляйте сервер и плагины — в 2021 году уязвимость Log4Shell позволяла захватить сервер одним сообщением в чате.",
    "Use a whitelist and online-mode=true, and keep the server and plugins updated — in 2021 Log4Shell let attackers take over servers with one chat message.",
  ]),
  P(25575, "tcp", "", false, "games", ["Minecraft RCON", "Minecraft RCON"], [
    "Порт 25575 — RCON сервера Minecraft: удалённое выполнение консольных команд.",
    "Port 25575 is Minecraft server RCON: remote console commands.",
  ], "Minecraft Server", [25565], [
    "RCON передаёт пароль открытым текстом и даёт права оператора. Не пробрасывайте его наружу.",
    "RCON sends the password in cleartext and grants operator rights. Don't forward it.",
  ]),
  P(25672, "tcp", "", false, "messaging", ["RabbitMQ (межузловой)", "RabbitMQ inter-node"], [
    "Порт 25672 — связь между узлами кластера RabbitMQ и CLI-утилитами (распределённый Erlang, порт AMQP + 20000).",
    "Port 25672 carries RabbitMQ inter-node and CLI traffic (Erlang distribution, AMQP port + 20000).",
  ], "RabbitMQ", [4369, 5672, 15672]),
  P(26257, "tcp", "", false, "databases", ["CockroachDB", "CockroachDB"], [
    "Порт 26257 — SQL-подключения (совместимые с PostgreSQL) и связь узлов CockroachDB; веб-консоль — 8080.",
    "Port 26257 is CockroachDB SQL (PostgreSQL wire-compatible) and inter-node traffic; the console is on 8080.",
  ], "CockroachDB", [5432, 8080]),
  P(26379, "tcp", "", false, "databases", ["Redis Sentinel", "Redis Sentinel"], [
    "Порт 26379 — Redis Sentinel: мониторинг и автоматическое переключение мастера Redis.",
    "Port 26379 is Redis Sentinel: monitoring and automatic Redis failover.",
  ], "Redis Sentinel", [6379, 16379]),
  P(27015, "udp,tcp", "", false, "games", ["Серверы Source / Steam", "Source / Steam game servers"], [
    "Порт 27015 — игровые серверы на движке Source и Steam: Counter-Strike 2, Team Fortress 2, Garry's Mod, Left 4 Dead, а также многие игры с серверным браузером Steam. TCP 27015 — RCON.",
    "Port 27015 is Source and Steam game servers: Counter-Strike 2, Team Fortress 2, Garry's Mod, Left 4 Dead and many games using the Steam server browser. TCP 27015 is RCON.",
  ], "SteamCMD, SRCDS, CS2, TF2, Garry's Mod", [27036, 7777, 2302, 25565]),
  P(27017, "tcp", "", false, "databases", ["MongoDB", "MongoDB"], [
    "Порт 27017 — MongoDB по умолчанию (mongod и mongos); 27018 — шарды, 27019 — config-серверы.",
    "Port 27017 is the MongoDB default (mongod and mongos); 27018 is shards and 27019 config servers.",
  ], "MongoDB, Percona Server for MongoDB, FerretDB", [27018, 27019, 5432, 3306], [
    "Старые MongoDB слушали все интерфейсы без авторизации — десятки тысяч баз были стёрты с требованием выкупа. С версии 3.6 по умолчанию bindIp 127.0.0.1; включите authorization и не открывайте порт.",
    "Old MongoDB listened everywhere without auth — tens of thousands of databases were wiped for ransom. Since 3.6 bindIp defaults to 127.0.0.1; enable authorization and keep the port closed.",
  ]),
  P(27018, "tcp", "", false, "databases", ["MongoDB (шард)", "MongoDB shard"], [
    "Порт 27018 — по умолчанию для mongod, запущенного как шард кластера (--shardsvr).",
    "Port 27018 is the default for mongod running as a shard (--shardsvr).",
  ], "MongoDB", [27017, 27019]),
  P(27019, "tcp", "", false, "databases", ["MongoDB (config-сервер)", "MongoDB config server"], [
    "Порт 27019 — по умолчанию для config-серверов шардированного кластера MongoDB (--configsvr).",
    "Port 27019 is the default for sharded-cluster config servers (--configsvr).",
  ], "MongoDB", [27017, 27018]),
  P(27036, "tcp,udp", "", false, "games", ["Steam Remote Play", "Steam Remote Play"], [
    "Порты 27036–27037 использует Steam Remote Play (домашняя трансляция игр) и обнаружение клиентов Steam в локальной сети.",
    "Ports 27036–27037 are used by Steam Remote Play (in-home streaming) and Steam client discovery on the LAN.",
  ], "Steam", [27015]),
  P(28015, "tcp,udp", "", false, "games", ["Rust (игра) / RethinkDB", "Rust (game) / RethinkDB"], [
    "UDP 28015 — игровой сервер Rust (Facepunch), TCP 28016 — его RCON. TCP 28015 — клиентский порт СУБД RethinkDB.",
    "UDP 28015 is the Rust (Facepunch) game server, with RCON on TCP 28016. TCP 28015 is the RethinkDB client port.",
  ], "Rust Dedicated Server, RethinkDB", [27015, 7777]),
  P(30000, "tcp", "", false, "devops", ["Kubernetes NodePort", "Kubernetes NodePort"], [
    "30000 — начало диапазона NodePort в Kubernetes (30000–32767): сервисы типа NodePort получают порт из него на каждом узле.",
    "30000 starts the Kubernetes NodePort range (30000–32767): NodePort services get a port from it on every node.",
  ], "Kubernetes", [6443, 10250]),
  P(30033, "tcp", "", false, "games", ["TeamSpeak 3 (файлы)", "TeamSpeak 3 file transfer"], [
    "Порт 30033 — передача файлов и аватаров на сервере TeamSpeak 3.",
    "Port 30033 is TeamSpeak 3 file and avatar transfer.",
  ], "TeamSpeak 3", [9987, 10011]),
  P(32400, "tcp", "", false, "voip-media", ["Plex Media Server", "Plex Media Server"], [
    "Порт 32400 — Plex Media Server: веб-интерфейс (http://сервер:32400/web) и удалённый доступ к медиатеке.",
    "Port 32400 is Plex Media Server: the web app (http://server:32400/web) and remote access to your library.",
  ], "Plex", [8096, 1900, 5353]),
  P(33060, "tcp", "", false, "databases", ["MySQL X Protocol", "MySQL X Protocol"], [
    "Порт 33060 — X Protocol MySQL 8 для MySQL Shell и документ-ориентированного X DevAPI.",
    "Port 33060 is MySQL 8's X Protocol for MySQL Shell and the document-oriented X DevAPI.",
  ], "MySQL 8, MySQL Shell", [3306]),
  P(34197, "udp", "", false, "games", ["Factorio", "Factorio"], [
    "UDP 34197 — порт сервера Factorio по умолчанию.",
    "UDP 34197 is the default Factorio server port.",
  ], "Factorio Headless Server", [27015, 7777]),
  P(34567, "tcp", "", false, "voip-media", ["Видеорегистраторы XMEye", "XMEye DVR/NVR"], [
    "Порт 34567 используют дешёвые видеорегистраторы и камеры на платформе Xiongmai (приложение XMEye) для удалённого доступа.",
    "Port 34567 is used by cheap DVRs and cameras on the Xiongmai platform (XMEye app) for remote access.",
  ], "Xiongmai, XMEye", [554, 37777, 8000], [
    "Эти устройства массово взламывали (ботнет Mirai, пароли по умолчанию, уязвимости прошивки). Не пробрасывайте порт — используйте облачный доступ производителя или VPN.",
    "These devices were compromised en masse (Mirai, default passwords, firmware flaws). Don't forward the port — use the vendor cloud or a VPN.",
  ]),
  P(35729, "tcp", "", false, "dev-servers", ["LiveReload", "LiveReload"], [
    "Порт 35729 — сервер LiveReload: браузер получает по нему команду перезагрузить страницу после изменения файлов.",
    "Port 35729 is the LiveReload server that tells the browser to reload when files change.",
  ], "LiveReload, Grunt, Gulp, MkDocs", [5500, 3000]),
  P(37777, "tcp", "", false, "voip-media", ["Видеорегистраторы Dahua", "Dahua DVR/NVR"], [
    "Порт 37777 — служебный порт видеорегистраторов и камер Dahua (и OEM-версий) для клиентов SmartPSS и DMSS.",
    "Port 37777 is the service port of Dahua DVRs and cameras (and OEM rebrands) for SmartPSS and DMSS clients.",
  ], "Dahua, SmartPSS, DMSS", [554, 34567, 8000], [
    "Регистраторы с открытым 37777 часто взламывают из-за старых прошивок. Обновите прошивку и не пробрасывайте порт.",
    "DVRs with 37777 exposed are often hacked through outdated firmware. Update it and don't forward the port.",
  ]),
  P(41641, "udp", "", false, "vpn-proxy", ["Tailscale", "Tailscale"], [
    "UDP 41641 — порт WireGuard-туннелей Tailscale по умолчанию для прямых соединений между устройствами.",
    "UDP 41641 is Tailscale's default WireGuard port for direct device-to-device connections.",
  ], "Tailscale", [51820, 3478, 9993]),
  P(44818, "tcp,udp", "EtherNet-IP-2", true, "iot", ["EtherNet/IP", "EtherNet/IP"], [
    "Порт 44818 — EtherNet/IP (CIP), промышленный протокол контроллеров Rockwell Allen-Bradley и других.",
    "Port 44818 is EtherNet/IP (CIP), the industrial protocol of Rockwell Allen-Bradley and other PLCs.",
  ], "Rockwell Allen-Bradley, Omron", [502, 102, 4840], [
    "CIP позволяет читать и менять программы контроллеров. Держите оборудование в изолированной сети.",
    "CIP allows reading and changing PLC programs. Keep the equipment on an isolated network.",
  ]),
  P(47808, "udp", "bacnet", true, "iot", ["BACnet/IP", "BACnet/IP"], [
    "UDP 47808 (0xBAC0) — BACnet/IP, протокол автоматизации зданий: отопление, вентиляция, освещение.",
    "UDP 47808 (0xBAC0) is BACnet/IP, the building automation protocol for HVAC and lighting.",
  ], "BMS, Tridium Niagara, Siemens Desigo", [1911, 502], [
    "В BACnet нет аутентификации; открытые контроллеры можно отключить или перенастроить удалённо.",
    "BACnet has no authentication; exposed controllers can be switched off or reconfigured remotely.",
  ]),
  P(49152, "tcp,udp", "", false, "legacy", ["Начало динамического диапазона", "Start of the dynamic range"], [
    "49152 — первый порт динамического (эфемерного) диапазона 49152–65535 по RFC 6335. Из него ОС выделяет исходящие порты клиентам, а Windows — динамические порты RPC.",
    "49152 is the first port of the dynamic (ephemeral) range 49152–65535 per RFC 6335. The OS assigns outgoing client ports from it, and Windows uses it for dynamic RPC.",
  ], "Windows, macOS, FreeBSD", [65535, 0, 135]),
  P(50000, "tcp", "", false, "devops", ["Jenkins agents / IBM Db2", "Jenkins agents / IBM Db2"], [
    "Порт 50000 — подключение агентов Jenkins по протоколу JNLP (inbound agents) и порт СУБД IBM Db2 по умолчанию.",
    "Port 50000 is Jenkins inbound (JNLP) agent connections and the IBM Db2 default port.",
  ], "Jenkins, IBM Db2", [8080, 5432]),
  P(51413, "tcp,udp", "", false, "file-sharing", ["Transmission (раздача)", "Transmission peer port"], [
    "Порт 51413 — порт для входящих соединений пиров торрент-клиента Transmission по умолчанию.",
    "Port 51413 is Transmission's default peer port for incoming BitTorrent connections.",
  ], "Transmission", [6881, 9091]),
  P(51820, "udp", "", false, "vpn-proxy", ["WireGuard", "WireGuard"], [
    "UDP 51820 — порт WireGuard по умолчанию (ListenPort в wg0.conf). WireGuard не отвечает на пакеты без правильного ключа, поэтому порт почти невидим для сканеров.",
    "UDP 51820 is WireGuard's default (ListenPort in wg0.conf). WireGuard ignores packets without a valid key, so the port is nearly invisible to scanners.",
  ], "WireGuard, wg-easy, AmneziaWG, Tailscale, MikroTik", [1194, 500, 41641, 443], [
    "Сам порт открывать безопасно; берегите приватные ключи и ограничивайте AllowedIPs у клиентов.",
    "Opening the port is safe; protect the private keys and scope clients' AllowedIPs.",
  ]),
  P(61613, "tcp", "", false, "messaging", ["STOMP", "STOMP"], [
    "Порт 61613 — текстовый протокол сообщений STOMP в ActiveMQ, Artemis и RabbitMQ (плагин).",
    "Port 61613 is the STOMP text messaging protocol in ActiveMQ, Artemis and RabbitMQ (plugin).",
  ], "Apache ActiveMQ, RabbitMQ", [61616, 5672]),
  P(61616, "tcp", "", false, "messaging", ["ActiveMQ OpenWire", "ActiveMQ OpenWire"], [
    "Порт 61616 — протокол OpenWire брокера Apache ActiveMQ (и Artemis по умолчанию для всех протоколов).",
    "Port 61616 is Apache ActiveMQ's OpenWire protocol (and Artemis's default all-protocol acceptor).",
  ], "Apache ActiveMQ, ActiveMQ Artemis", [61613, 5672, 8161], [
    "Уязвимость CVE-2023-46604 в OpenWire позволяла выполнить код без аутентификации и активно использовалась шифровальщиками. Обновите ActiveMQ и закройте порт снаружи.",
    "CVE-2023-46604 in OpenWire allowed unauthenticated code execution and was widely exploited by ransomware. Update ActiveMQ and block the port externally.",
  ]),
  P(62078, "tcp", "", false, "network-services", ["iPhone sync (lockdownd)", "iPhone sync (lockdownd)"], [
    "Порт 62078 слушает служба lockdownd на iPhone и iPad — для синхронизации с Finder/iTunes по Wi-Fi. Его видно при сканировании сети с iOS-устройствами.",
    "Port 62078 is lockdownd on iPhone and iPad, used for Wi-Fi sync with Finder/iTunes. It shows up when scanning a network with iOS devices.",
  ], "iOS, iPadOS", [5353, 7000]),
  P(64738, "tcp,udp", "", false, "games", ["Mumble", "Mumble"], [
    "Порт 64738 — голосовой чат Mumble (сервер Murmur): управление по TCP, голос по UDP.",
    "Port 64738 is Mumble voice chat (Murmur server): control over TCP, voice over UDP.",
  ], "Mumble, Murmur", [9987]),
  P(65535, "tcp,udp", "", false, "legacy", ["Максимальный номер порта", "Highest port number"], [
    "65535 — максимальный номер порта: под номер в заголовках TCP и UDP отведено 16 бит (2¹⁶ − 1). Служб за ним не закреплено.",
    "65535 is the highest port number: TCP and UDP headers use a 16-bit field (2¹⁶ − 1). No service is assigned to it.",
  ], undefined, [0, 49152]),
];
