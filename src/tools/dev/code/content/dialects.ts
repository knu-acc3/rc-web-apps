/** SQL dialect variant pages of /sql-formatter (sql-formatter language ids and page copy). */

type L = { ru: string; en: string };

interface DialectPage {
  slug: string;
  id: string;
  label: string;
  /** Short feature list used in the description and facts. */
  features: L;
  /** A placeholder / parameter style example that the formatter keeps as is ("" = none). */
  params: string;
  example: string;
}

export const DIALECT_PAGES: DialectPage[] = [
  {
    slug: "mysql",
    id: "mysql",
    label: "MySQL",
    features: { ru: "`обратные кавычки`, комментарии #, LIMIT со смещением, ON DUPLICATE KEY UPDATE", en: "`backticks`, # comments, LIMIT with offset, ON DUPLICATE KEY UPDATE" },
    params: "?",
    example: "select `id`, `name` from `users` where `city` = ? limit 10, 20",
  },
  {
    slug: "postgresql",
    id: "postgresql",
    label: "PostgreSQL",
    features: { ru: "приведение ::, тела $$ … $$, RETURNING, ILIKE и JSONB-операторы ->>", en: ":: casts, $$ … $$ bodies, RETURNING, ILIKE and JSONB operators like ->>" },
    params: "$1",
    example: "select id, data->>'name' as name, created_at::date from users where id = $1 returning id",
  },
  {
    slug: "sqlite",
    id: "sqlite",
    label: "SQLite",
    features: { ru: "параметры ?, ?1, :name, @name и $name, INSERT OR REPLACE, PRAGMA", en: "?, ?1, :name, @name and $name parameters, INSERT OR REPLACE, PRAGMA" },
    params: ":name",
    example: "insert or replace into settings (key, value) values (:key, :value)",
  },
  {
    slug: "t-sql",
    id: "transactsql",
    label: "SQL Server (T-SQL)",
    features: { ru: "[квадратные скобки], переменные @, TOP, OUTPUT и MERGE", en: "[square brackets], @variables, TOP, OUTPUT and MERGE" },
    params: "@id",
    example: "select top 10 [Id], [Name] from [dbo].[Users] where [Id] = @id order by [Name]",
  },
  {
    slug: "oracle",
    id: "plsql",
    label: "Oracle PL/SQL",
    features: { ru: "bind-переменные :name, CONNECT BY, MERGE и блоки BEGIN … END", en: ":name bind variables, CONNECT BY, MERGE and BEGIN … END blocks" },
    params: ":id",
    example: "select employee_id, manager_id, level from employees start with manager_id is null connect by prior employee_id = manager_id",
  },
  {
    slug: "bigquery",
    id: "bigquery",
    label: "BigQuery",
    features: { ru: "`project.dataset.table`, STRUCT, ARRAY, QUALIFY и параметры @name", en: "`project.dataset.table`, STRUCT, ARRAY, QUALIFY and @name parameters" },
    params: "@day",
    example: "select user_id, count(*) as events from `proj.analytics.events` where event_date = @day group by user_id qualify row_number() over (order by events desc) <= 10",
  },
  {
    slug: "snowflake",
    id: "snowflake",
    label: "Snowflake",
    features: { ru: "приведение ::, QUALIFY, LATERAL FLATTEN и обращения к VARIANT через :", en: ":: casts, QUALIFY, LATERAL FLATTEN and VARIANT paths with :" },
    params: "",
    example: "select f.value:name::string as name from raw_events e, lateral flatten(input => e.payload:items) f where e.payload:status::string = 'paid'",
  },
  {
    slug: "clickhouse",
    id: "clickhouse",
    label: "ClickHouse",
    features: { ru: "функции вроде toStartOfDay и uniqExact, ARRAY JOIN, FINAL, SAMPLE и параметры {name:Type}", en: "functions like toStartOfDay and uniqExact, ARRAY JOIN, FINAL, SAMPLE and {name:Type} parameters" },
    params: "{day:Date}",
    example: "select toStartOfDay(ts) as day, uniqExact(user_id) as users from events final where toDate(ts) >= {day:Date} group by day order by day",
  },
  {
    slug: "mariadb",
    id: "mariadb",
    label: "MariaDB",
    features: { ru: "`обратные кавычки`, RETURNING, последовательности и системные версии таблиц", en: "`backticks`, RETURNING, sequences and system-versioned tables" },
    params: "?",
    example: "delete from `sessions` where `expires_at` < now() returning `id`",
  },
  {
    slug: "redshift",
    id: "redshift",
    label: "Amazon Redshift",
    features: { ru: "DISTKEY, SORTKEY, COPY и UNLOAD, приведение ::", en: "DISTKEY, SORTKEY, COPY and UNLOAD, :: casts" },
    params: "$1",
    example: "create table sales (id bigint, sold_at timestamp, amount decimal(12,2)) distkey(id) sortkey(sold_at)",
  },
  {
    slug: "spark",
    id: "spark",
    label: "Spark SQL",
    features: { ru: "LATERAL VIEW explode, CLUSTER BY, TABLESAMPLE и функции над массивами", en: "LATERAL VIEW explode, CLUSTER BY, TABLESAMPLE and array functions" },
    params: "${var}",
    example: "select id, tag from posts lateral view explode(tags) t as tag where year = 2024 cluster by id",
  },
  {
    slug: "trino",
    id: "trino",
    label: "Trino / Presto",
    features: { ru: "каталоги catalog.schema.table, UNNEST, лямбды x -> x + 1 и оконные функции", en: "catalog.schema.table names, UNNEST, x -> x + 1 lambdas and window functions" },
    params: "?",
    example: "select o.id, transform(o.items, x -> x.price * 2) as doubled from hive.shop.orders o cross join unnest(o.tags) as t(tag)",
  },
  {
    slug: "duckdb",
    id: "duckdb",
    label: "DuckDB",
    features: { ru: "чтение read_csv и read_parquet, SELECT * EXCLUDE, QUALIFY и списки [1, 2]", en: "read_csv and read_parquet, SELECT * EXCLUDE, QUALIFY and [1, 2] lists" },
    params: "$1",
    example: "select * exclude (raw) from read_parquet('events/*.parquet') where day = $1 qualify row_number() over (partition by user_id order by ts desc) = 1",
  },
  {
    slug: "hive",
    id: "hive",
    label: "Hive",
    features: { ru: "PARTITIONED BY, STORED AS, LATERAL VIEW и INSERT OVERWRITE", en: "PARTITIONED BY, STORED AS, LATERAL VIEW and INSERT OVERWRITE" },
    params: "${hivevar:day}",
    example: "insert overwrite table daily partition (dt = '2024-05-01') select user_id, count(*) from events group by user_id",
  },
  {
    slug: "db2",
    id: "db2",
    label: "IBM Db2",
    features: { ru: "FETCH FIRST n ROWS ONLY, WITH UR, специальные регистры CURRENT DATE", en: "FETCH FIRST n ROWS ONLY, WITH UR and CURRENT DATE special registers" },
    params: "?",
    example: "select empno, lastname from employee where hiredate > current date - 1 year order by lastname fetch first 10 rows only with ur",
  },
];
