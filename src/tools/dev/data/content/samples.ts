import type { Fmt } from "../lib/convert";

type L = { ru: string; en: string };

export const SAMPLES: Partial<Record<Fmt, L>> = {
  json: {
    ru: `[
  {"id": 1, "name": "Алия", "city": "Алматы", "tags": ["admin", "dev"], "active": true, "balance": 12345678901234567890},
  {"id": 2, "name": "Иван", "city": "Москва", "tags": ["sales"], "active": false, "manager": {"name": "Ольга", "phone": "+7 701 000 00 00"}}
]`,
    en: `[
  {"id": 1, "name": "Alice", "city": "London", "tags": ["admin", "dev"], "active": true, "balance": 12345678901234567890},
  {"id": 2, "name": "Bob", "city": "Austin", "tags": ["sales"], "active": false, "manager": {"name": "Carol", "phone": "+1 415 555 2671"}}
]`,
  },
  csv: {
    ru: `id;name;city;amount;comment
1;Алия;Алматы;1500,50;"Оплата; первый взнос"
2;Иван;Москва;-320;"Сказал ""перезвоню"""
3;Дана;Астана;0;`,
    en: `id,name,city,amount,comment
1,Alice,London,1500.50,"First payment, part 1"
2,Bob,Austin,-320,"Said ""call me back"""
3,Carol,Denver,0,`,
  },
  tsv: {
    ru: "id\tname\tcity\n1\tАлия\tАлматы\n2\tИван\tМосква\n",
    en: "id\tname\tcity\n1\tAlice\tLondon\n2\tBob\tAustin\n",
  },
  yaml: {
    ru: `# настройки сервиса
service:
  name: orders
  port: 8080
  country: KZ
  debug: no
servers:
  - host: 10.0.0.1
    zone: almaty
  - host: 10.0.0.2
    zone: astana
retries: &r 3
limits:
  read: *r
banner: |
  Добро пожаловать!
  Сервис работает круглосуточно.`,
    en: `# service settings
service:
  name: orders
  port: 8080
  country: NO
  debug: no
servers:
  - host: 10.0.0.1
    zone: eu
  - host: 10.0.0.2
    zone: us
retries: &r 3
limits:
  read: *r
banner: |
  Welcome!
  The service runs around the clock.`,
  },
  xml: {
    ru: `<?xml version="1.0" encoding="UTF-8"?>
<catalog lang="ru">
  <book id="1">
    <title>Мастер и Маргарита</title>
    <author>Михаил Булгаков</author>
    <price currency="KZT">4500</price>
  </book>
  <book id="2">
    <title>Путь Абая</title>
    <author>Мухтар Ауэзов</author>
    <price currency="KZT">5200</price>
  </book>
</catalog>`,
    en: `<?xml version="1.0" encoding="UTF-8"?>
<catalog lang="en">
  <book id="1">
    <title>The Master and Margarita</title>
    <author>Mikhail Bulgakov</author>
    <price currency="USD">12.50</price>
  </book>
  <book id="2">
    <title>War and Peace</title>
    <author>Leo Tolstoy</author>
    <price currency="USD">15.00</price>
  </book>
</catalog>`,
  },
  toml: {
    ru: `title = "Настройки"

[database]
host = "localhost"
port = 5432
max_connections = 100
enabled = true

[[users]]
name = "Алия"
roles = ["admin"]

[[users]]
name = "Иван"
roles = ["viewer"]`,
    en: `title = "Settings"

[database]
host = "localhost"
port = 5432
max_connections = 100
enabled = true

[[users]]
name = "Alice"
roles = ["admin"]

[[users]]
name = "Bob"
roles = ["viewer"]`,
  },
  jsonl: {
    ru: `{"ts": "2025-06-01T10:00:00Z", "level": "info", "msg": "Запуск"}
{"ts": "2025-06-01T10:00:05Z", "level": "warn", "msg": "Медленный запрос", "ms": 1280}
{"ts": "2025-06-01T10:01:00Z", "level": "error", "msg": "Нет соединения"}`,
    en: `{"ts": "2025-06-01T10:00:00Z", "level": "info", "msg": "Started"}
{"ts": "2025-06-01T10:00:05Z", "level": "warn", "msg": "Slow query", "ms": 1280}
{"ts": "2025-06-01T10:01:00Z", "level": "error", "msg": "Connection lost"}`,
  },
  env: {
    ru: `# база данных
DB_HOST=localhost
DB_PORT=5432
export APP_NAME="Мой сервис"
SECRET='a$b#c'
DEBUG=false # только для разработки`,
    en: `# database
DB_HOST=localhost
DB_PORT=5432
export APP_NAME="My service"
SECRET='a$b#c'
DEBUG=false # development only`,
  },
};

export const FORMAT_META: Record<Fmt, { label: string; ext: string; mime: string }> = {
  json: { label: "JSON", ext: "json", mime: "application/json" },
  csv: { label: "CSV", ext: "csv", mime: "text/csv;charset=utf-8" },
  tsv: { label: "TSV", ext: "tsv", mime: "text/tab-separated-values;charset=utf-8" },
  yaml: { label: "YAML", ext: "yaml", mime: "application/yaml" },
  xml: { label: "XML", ext: "xml", mime: "application/xml" },
  toml: { label: "TOML", ext: "toml", mime: "application/toml" },
  jsonl: { label: "JSON Lines", ext: "jsonl", mime: "application/jsonl" },
  env: { label: ".env", ext: "env", mime: "text/plain;charset=utf-8" },
  markdown: { label: "Markdown", ext: "md", mime: "text/markdown;charset=utf-8" },
  html: { label: "HTML", ext: "html", mime: "text/html;charset=utf-8" },
  typescript: { label: "TypeScript", ext: "ts", mime: "text/plain;charset=utf-8" },
  zod: { label: "Zod", ext: "ts", mime: "text/plain;charset=utf-8" },
};
