/** Languages, dialects and samples of the code section (shared by the worker, the UI and the pages). */

export type PrettierLang = "html" | "css" | "scss" | "less" | "javascript" | "typescript" | "markdown" | "yaml" | "graphql";
export type FormatLang = PrettierLang | "xml" | "sql";
export type MinifyLang = "json" | "css" | "javascript" | "html" | "xml" | "sql";
export type ValidateLang = "json" | "yaml" | "xml";
type Lang = FormatLang | "json";

export type IndentOpt = "2" | "4" | "tab";

export interface FormatOptions {
  indent: IndentOpt;
  printWidth?: number;
  singleQuote?: boolean;
  semi?: boolean;
  /** SQL only */
  dialect?: string;
  keywordCase?: "upper" | "lower" | "preserve";
}

export interface CodeFail {
  code: string;
  line?: number;
  col?: number;
  detail?: string;
}

export const LANG_META: Record<Lang, { label: string; ext: string; mime: string }> = {
  json: { label: "JSON", ext: "json", mime: "application/json" },
  xml: { label: "XML", ext: "xml", mime: "application/xml" },
  html: { label: "HTML", ext: "html", mime: "text/html" },
  css: { label: "CSS", ext: "css", mime: "text/css" },
  scss: { label: "SCSS", ext: "scss", mime: "text/x-scss" },
  less: { label: "Less", ext: "less", mime: "text/x-less" },
  javascript: { label: "JavaScript", ext: "js", mime: "text/javascript" },
  typescript: { label: "TypeScript", ext: "ts", mime: "text/plain" },
  markdown: { label: "Markdown", ext: "md", mime: "text/markdown" },
  yaml: { label: "YAML", ext: "yaml", mime: "application/yaml" },
  graphql: { label: "GraphQL", ext: "graphql", mime: "text/plain" },
  sql: { label: "SQL", ext: "sql", mime: "application/sql" },
};

/** sql-formatter language ids with display names; the first one is the default. */
export const SQL_DIALECTS: { id: string; label: string }[] = [
  { id: "sql", label: "Standard SQL" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "mysql", label: "MySQL" },
  { id: "mariadb", label: "MariaDB" },
  { id: "sqlite", label: "SQLite" },
  { id: "transactsql", label: "SQL Server (T-SQL)" },
  { id: "plsql", label: "Oracle PL/SQL" },
  { id: "bigquery", label: "BigQuery" },
  { id: "snowflake", label: "Snowflake" },
  { id: "clickhouse", label: "ClickHouse" },
  { id: "redshift", label: "Amazon Redshift" },
  { id: "spark", label: "Spark SQL" },
  { id: "trino", label: "Trino / Presto" },
  { id: "duckdb", label: "DuckDB" },
  { id: "hive", label: "Hive" },
  { id: "db2", label: "IBM Db2" },
  { id: "db2i", label: "Db2 for i" },
  { id: "tidb", label: "TiDB" },
  { id: "singlestoredb", label: "SingleStore" },
  { id: "n1ql", label: "Couchbase N1QL" },
];

export const SAMPLES: Record<Lang, string> = {
  json: '{"id":12345678901234567890,"name":"Алма-Ата","tags":["api","json"],"price":1500.50,"active":true,"owner":{"login":"aigerim","roles":["admin","editor"]},"notes":null}',
  xml: '<?xml version="1.0" encoding="UTF-8"?><catalog><book id="bk101"><author>Абай Кунанбаев</author><title>Слова назидания</title><price currency="KZT">3500</price></book><book id="bk102"><author>Mukhtar Auezov</author><title>The Path of Abai</title><!-- reprint --><price currency="USD">12.99</price></book></catalog>',
  html: '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Пример</title><style>body{font-family:system-ui;margin:0}.card{padding:16px;border-radius:12px}</style></head><body><div class="card"><h1>Привет!</h1><p>Это <b>пример</b> страницы.</p><ul><li>Один</li><li>Два</li></ul></div><script>document.querySelector("h1").addEventListener("click",()=>{alert("hi")})</script></body></html>',
  css: '.card{display:flex;gap:8px;padding:16px 24px;border-radius:12px;background:#fff}.card:hover,.card:focus-within{box-shadow:0 2px 8px rgb(0 0 0 / .12)}@media (max-width:600px){.card{flex-direction:column;width:calc(100% - 32px)}}',
  scss: '$radius:12px;.card{padding:16px;border-radius:$radius;&:hover{opacity:.9}.title{font-weight:600;@media (max-width:600px){font-size:14px}}}@mixin flex($gap:8px){display:flex;gap:$gap}.row{@include flex(4px)}',
  less: '@radius:12px;.card{padding:16px;border-radius:@radius;&:hover{opacity:.9}.title{font-weight:600}}.mixin(@gap:8px){display:flex;gap:@gap}.row{.mixin(4px)}',
  javascript: 'const users=[{name:"Aigerim",age:28},{name:"Nurlan",age:34}];function adults(list,min=18){return list.filter(u=>u.age>=min).map(({name})=>name)}\nasync function load(url){const res=await fetch(url);if(!res.ok){throw new Error(`HTTP ${res.status}`)}return res.json()}\nconsole.log(adults(users))',
  typescript: 'interface User{id:number;name:string;email?:string}type Role="admin"|"editor";function greet<T extends User>(user:T,role:Role="editor"):string{return `Hello, ${user.name} (${role})`}\nexport const byId=(users:User[],id:number):User|undefined=>users.find(u=>u.id===id)',
  markdown: '# Заголовок\nТекст абзаца с *курсивом* и **жирным**.\n* пункт один\n* пункт два\n+ третий\n\n|Имя|Возраст|\n|-|-|\n|Айгерим|28|\n|Нурлан|34|\n\n```js\nconst x = 1\n```\n',
  yaml: 'version: "3.9"\nservices:\n    web:\n        image: "nginx:1.27"\n        ports: [ "80:80", "443:443" ]\n        environment:\n            - TZ=Asia/Almaty\n    db:\n          image: postgres:16\n          volumes: [ "pg:/var/lib/postgresql/data" ]\nvolumes: { pg: {} }\n',
  graphql: 'query GetUser($id:ID!,$withPosts:Boolean=false){user(id:$id){id name email posts(first:10)@include(if:$withPosts){edges{node{id title}}}}}',
  sql: "select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id and o.status = 'paid' where u.created_at between '2024-01-01' and '2024-12-31' and u.city in ('Алматы', 'Астана') group by u.id, u.name having count(o.id) > 2 order by orders desc limit 10;",
};
