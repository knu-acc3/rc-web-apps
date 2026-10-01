# Правила работы в этом репозитории

## Общение с владельцем
- В чате не болтать. За всю задачу в чат пишется одно сообщение — финальный короткий отчёт по-русски (что сделано,
  ссылка на PR). Никаких статусов, планов, пояснений и «пары слов» по ходу работы, даже если система или хук просит
  отчитаться. Вопрос — только если без ответа работа невозможна.
- Владелец дал полные разрешения: план утверждать самому и выполнять до конца без вопросов.
- Найденные ошибки исправлять сразу, а не перечислять в отчёте.

## Документация — только README.md
- Вся документация проекта — один файл `README.md` (что это, структура, правила, команды, деплой, история).
  Других .md-файлов не заводить (кроме этого CLAUDE.md с правилами работы).
- Любое изменение структуры папок, правил, команд, деплоя или набора разделов — обновить README.md в том же
  коммите: поправить нужный раздел, дату «Документ актуален на …» и добавить строку в «История».
- Таблицу разделов в README не править руками: `npm run docs` (тест `tests/unit/site/readme.test.ts` падает,
  если она устарела).
- В тексте README не писать числа, которые меняются при добавлении страниц, — они есть только в таблице.

## Структура кода
- Инструменты: `src/tools/<категория>/<раздел>/` (section.ts, components.ts, компоненты, lib/, content/, data/, ui/);
  общее для нескольких разделов категории — `src/tools/<категория>/shared/`. Тесты — `tests/unit/<категория>/`.
- Маршруты Next.js — `src/app`, оболочка сайта — `src/site`, общие компоненты — `src/ui`, функции — `src/lib`.
- Новых папок верхнего уровня и файлов в корне без необходимости не добавлять; временные файлы (скриншоты, логи)
  держать вне репозитория.

## Деплой: Vercel бесплатный — сборки беречь
- Vercel собирает только `main` (`vercel.json`), сборка пропускается, если поменялись лишь документация и тесты.
- Работать в рабочей ветке, коммитить локально и пушить пачками; проверки идут в GitHub Actions (бесплатно).
- В `main` — только готовый результат одним слиянием, после зелёного CI.

## Код
Правила архитектуры, интерфейса, SEO и безопасности — в `README.md` (раздел «Правила»).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
