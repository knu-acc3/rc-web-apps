'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CheckCircle,
  ClipboardText,
  Code,
  Download,
  FileText,
  Link as LinkIcon,
  ListChecks,
  Table as TableIcon,
  TextB,
  TextHOne,
  TextItalic,
  Trash,
} from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { cn } from '@/src/lib/cn';
import { downloadBlob } from '@/src/utils/exportHelpers';
import { writeClipboardText } from '@/src/utils/clipboard';
import { sanitizeHtml } from '@/src/utils/htmlSanitization';

type PreviewTheme = 'clean' | 'paper' | 'dark';

const PREVIEW_CSS = `
.markdown-result{font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.65;overflow-wrap:anywhere}
.markdown-result h1,.markdown-result h2,.markdown-result h3,.markdown-result h4{font-weight:750;line-height:1.25;margin:1.4em 0 .55em}
.markdown-result h1{font-size:2em;border-bottom:1px solid currentColor;padding-bottom:.25em}.markdown-result h2{font-size:1.55em}.markdown-result h3{font-size:1.25em}
.markdown-result p{margin:.8em 0}.markdown-result ul,.markdown-result ol{margin:.8em 0;padding-left:1.6em}.markdown-result li{margin:.25em 0}
.markdown-result blockquote{border-left:4px solid #94a3b8;margin:1em 0;padding:.25em 1em;color:#64748b}
.markdown-result pre{background:#111827;color:#f8fafc;border-radius:10px;overflow:auto;padding:1em;margin:1em 0}.markdown-result code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.9em}
.markdown-result :not(pre)>code{background:rgba(148,163,184,.2);border-radius:5px;padding:.12em .35em}.markdown-result a{color:#2563eb;text-decoration:underline;text-underline-offset:2px}
.markdown-result img{display:block;max-width:100%;height:auto;border-radius:10px;margin:1em auto}.markdown-result hr{border:0;border-top:1px solid #cbd5e1;margin:1.5em 0}
.markdown-result table{border-collapse:collapse;display:block;max-width:100%;overflow-x:auto;margin:1em 0}.markdown-result th,.markdown-result td{border:1px solid #cbd5e1;padding:.5em .7em;text-align:left}.markdown-result th{font-weight:700;background:rgba(148,163,184,.12)}
.markdown-result input[type=checkbox]{margin-right:.5em}
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(value: string): string | null {
  const decoded = value.replace(/&amp;/g, '&').trim();
  if (/^(https?:|mailto:)/i.test(decoded) || decoded.startsWith('/') || decoded.startsWith('#')) return decoded;
  return null;
}

function renderInline(value: string): string {
  const placeholders: string[] = [];
  let output = escapeHtml(value);
  output = output.replace(/`([^`\n]+)`/g, (_, code: string) => {
    const index = placeholders.push(`<code>${code}</code>`) - 1;
    return `\u0000${index}\u0000`;
  });
  output = output.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, alt: string, rawUrl: string, title: string | undefined) => {
    const url = safeUrl(rawUrl);
    if (!url || url.startsWith('mailto:')) return `![${escapeHtml(alt)}](${rawUrl})`;
    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : '';
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy"${titleAttribute} />`;
  });
  output = output.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, label: string, rawUrl: string, title: string | undefined) => {
    const url = safeUrl(rawUrl);
    if (!url) return `${escapeHtml(label)} (${rawUrl})`;
    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"${titleAttribute}>${escapeHtml(label)}</a>`;
  });
  output = output
    .replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/___([^_\n]+)___/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')
    .replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  return output.replace(/\u0000(\d+)\u0000/g, (_, index: string) => placeholders[Number(index)] ?? '');
}

function isBlockStart(lines: string[], index: number): boolean {
  const line = lines[index] ?? '';
  return /^\s*```/.test(line)
    || /^\s{0,3}#{1,6}\s+/.test(line)
    || /^\s*>/.test(line)
    || /^\s*(?:[-+*]|\d+\.)\s+/.test(line)
    || /^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)
    || (line.includes('|') && /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[index + 1] ?? ''));
}

function tableCells(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

function parseMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^\s*```([\w-]*)\s*$/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : '';
      html.push(`<pre><code${language}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2].replace(/\s+#+\s*$/, ''))}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
      html.push('<hr />');
      index += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoted: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quoted.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      html.push(`<blockquote>${parseMarkdown(quoted.join('\n'))}</blockquote>`);
      continue;
    }

    if (line.includes('|') && /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[index + 1] ?? '')) {
      const headers = tableCells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      html.push(`<table><thead><tr>${headers.map((cell) => `<th>${renderInline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${renderInline(row[cellIndex] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }

    const listMatch = line.match(/^\s*(?:([-+*])|(\d+)\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = Boolean(listMatch[2]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*(?:([-+*])|(\d+)\.)\s+(.+)$/);
        if (!item || Boolean(item[2]) !== ordered) break;
        const checkbox = item[3].match(/^\[([ xX])\]\s+(.*)$/);
        items.push(checkbox
          ? `<li><input type="checkbox" disabled${checkbox[1].toLowerCase() === 'x' ? ' checked' : ''} />${renderInline(checkbox[2])}</li>`
          : `<li>${renderInline(item[3])}</li>`);
        index += 1;
      }
      const tag = ordered ? 'ol' : 'ul';
      html.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      paragraph.push(lines[index]);
      index += 1;
    }
    html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }

  return html.join('\n');
}

const TEMPLATES: Record<string, { labelRu: string; labelEn: string; mdRu: string; mdEn: string }> = {
  readme: {
    labelRu: 'README проекта',
    labelEn: 'Project README',
    mdRu: `# Ulti Tools\n\nНабор быстрых и полезных онлайн-инструментов прямо в браузере.\n\n## Возможности\n- ⚡ Мгновенная работа без перезагрузок\n- 🔒 Конфиденциальность: данные не уходят на сервер\n- 📱 Полная адаптивность на смартфонах и ПК\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n### Документация\nПодробнее см. в [каталоге инструментов](/catalog).`,
    mdEn: `# Ulti Tools\n\nA modern suite of web tools running entirely in your browser.\n\n## Features\n- ⚡ Instant zero-latency processing\n- 🔒 Client-side privacy: data stays local\n- 📱 Fully responsive on mobile and desktop\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n### Documentation\nSee full list in our [tool catalog](/catalog).`,
  },
  article: {
    labelRu: 'Статья с таблицей',
    labelEn: 'Article & Table',
    mdRu: `# Обзор веб-технологий 2026\n\nСовременные веб-приложения становятся быстрее и автономнее.\n\n> «Простота — необходимое условие прекрасного.»\n\n### Сравнение подходов\n\n| Критерий | SSR | Client-Only |\n| :--- | :--- | :--- |\n| Первая загрузка | Быстрая | Зависит от JS |\n| Нагрузка на сервер | Высокая | Минимальная |\n| Оффлайн-работа | Сложная | Полная |`,
    mdEn: `# Web Technologies Overview 2026\n\nModern applications are becoming faster, leaner, and more autonomous.\n\n> "Simplicity is prerequisite for reliability."\n\n### Comparison\n\n| Metric | SSR | Client-Only |\n| :--- | :--- | :--- |\n| Initial Load | Fast | JS dependent |\n| Server Load | High | Minimal |\n| Offline support | Complex | Complete |`,
  },
  checklist: {
    labelRu: 'Чеклист задач',
    labelEn: 'Task Checklist',
    mdRu: `# Чеклист подготовки релиза\n\n- [x] Проверить адаптивность всех страниц\n- [x] Убрать лишние спойлеры и скрытые настройки\n- [x] Оптимизировать генерацию мета-тегов SEO\n- [ ] Протестировать экспорт документов\n- [ ] Запустить итоговый билд проекта`,
    mdEn: `# Release Checklist\n\n- [x] Check mobile responsiveness across all pages\n- [x] Eliminate nested spoilers and hidden menus\n- [x] Optimize dynamic SEO meta-tag generation\n- [ ] Test document file export\n- [ ] Run production build verification`,
  },
};

export default function MarkdownPreview() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [markdown, setMarkdown] = useState(TEMPLATES.readme[isEn ? 'mdEn' : 'mdRu']);
  const [theme, setTheme] = useState<PreviewTheme>('clean');
  const [filename, setFilename] = useState('document');
  const [copyStatus, setCopyStatus] = useState('');

  const html = useMemo(() => parseMarkdown(markdown), [markdown]);
  const words = useMemo(() => markdown.trim() ? markdown.trim().split(/\s+/).length : 0, [markdown]);
  const chars = useMemo(() => markdown.length, [markdown]);

  const insertSnippet = useCallback((before: string, after: string = '', defaultText: string = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = markdown.substring(start, end) || defaultText;
    const replacement = `${before}${selected}${after}`;
    const nextValue = markdown.substring(0, start) + replacement + markdown.substring(end);

    setMarkdown(nextValue);
    setCopyStatus('');

    requestAnimationFrame(() => {
      el.focus();
      const newCursorPos = start + before.length + selected.length;
      el.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [markdown]);

  const copyHtml = useCallback(async () => {
    const copied = await writeClipboardText(html);
    setCopyStatus(copied
      ? isEn ? 'HTML copied' : 'HTML скопирован'
      : isEn ? 'Could not copy' : 'Не удалось скопировать');
    setTimeout(() => setCopyStatus(''), 2500);
  }, [html, isEn]);

  const copyMd = useCallback(async () => {
    const copied = await writeClipboardText(markdown);
    setCopyStatus(copied
      ? isEn ? 'Markdown copied' : 'Markdown скопирован'
      : isEn ? 'Could not copy' : 'Не удалось скопировать');
    setTimeout(() => setCopyStatus(''), 2500);
  }, [markdown, isEn]);

  const downloadMarkdown = useCallback(() => {
    downloadBlob(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), `${filename.trim() || 'document'}.md`);
  }, [filename, markdown]);

  const downloadHtml = useCallback(() => {
    const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(filename.trim() || 'Document')}</title><style>${PREVIEW_CSS}body{max-width:820px;margin:40px auto;padding:0 20px;color:#172033;background:#fff}</style></head><body><main class="markdown-result">${html}</main></body></html>`;
    downloadBlob(new Blob([documentHtml], { type: 'text/html;charset=utf-8' }), `${filename.trim() || 'document'}.html`);
  }, [filename, html]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {/* 1-Click Template Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {isEn ? 'Templates:' : 'Шаблоны:'}
        </span>
        {Object.entries(TEMPLATES).map(([key, t]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setMarkdown(t[isEn ? 'mdEn' : 'mdRu']);
              setCopyStatus('');
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
          >
            <FileText size={14} />
            {isEn ? t.labelEn : t.labelRu}
          </button>
        ))}
        {markdown && (
          <button
            type="button"
            onClick={() => {
              setMarkdown('');
              setCopyStatus('');
            }}
            className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-red-500"
          >
            <Trash size={14} />
            {isEn ? 'Clear' : 'Очистить'}
          </button>
        )}
      </div>

      {/* Editor & Preview Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Editor Column */}
        <Card className="flex flex-col p-4 sm:p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2.5">
            <Label htmlFor="markdown-input" className="font-semibold text-sm">
              Markdown
            </Label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title={isEn ? 'Bold' : 'Жирный (**текст**)'}
                onClick={() => insertSnippet('**', '**', isEn ? 'bold text' : 'жирный текст')}
                className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
              >
                <TextB size={16} weight="bold" />
              </button>
              <button
                type="button"
                title={isEn ? 'Italic' : 'Курсив (*текст*)'}
                onClick={() => insertSnippet('*', '*', isEn ? 'italic text' : 'курсив')}
                className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
              >
                <TextItalic size={16} />
              </button>
              <button
                type="button"
                title={isEn ? 'Heading' : 'Заголовок (## )'}
                onClick={() => insertSnippet('\n## ', '\n', isEn ? 'Heading' : 'Заголовок')}
                className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
              >
                <TextHOne size={16} />
              </button>
              <button
                type="button"
                title={isEn ? 'Link' : 'Ссылка ([текст](url))'}
                onClick={() => insertSnippet('[', '](https://site.org)', isEn ? 'Link text' : 'Текст ссылки')}
                className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
              >
                <LinkIcon size={16} />
              </button>
              <button
                type="button"
                title={isEn ? 'Code block' : 'Блок кода'}
                onClick={() => insertSnippet('\n```javascript\n', '\n```\n', '// code here')}
                className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
              >
                <Code size={16} />
              </button>
              <button
                type="button"
                title={isEn ? 'Table' : 'Таблица'}
                onClick={() => insertSnippet('\n| Заголовок 1 | Заголовок 2 |\n| :--- | :--- |\n| Значение 1 | Значение 2 |\n')}
                className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
              >
                <TableIcon size={16} />
              </button>
              <button
                type="button"
                title={isEn ? 'Checklist' : 'Список задач'}
                onClick={() => insertSnippet('\n- [ ] ', '', isEn ? 'New task' : 'Новая задача')}
                className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
              >
                <ListChecks size={16} />
              </button>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              {words} {isEn ? 'words' : 'слов'} · {chars} {isEn ? 'chars' : 'симв.'}
            </span>
          </div>

          <Textarea
            ref={textareaRef}
            id="markdown-input"
            className="tool-short-landscape-editor min-h-[380px] flex-1 resize-y font-mono text-sm leading-relaxed lg:min-h-[520px]"
            value={markdown}
            onChange={(event) => {
              setMarkdown(event.target.value);
              setCopyStatus('');
            }}
            placeholder={isEn ? 'Type Markdown here…' : 'Введите Markdown…'}
            spellCheck={false}
          />
        </Card>

        {/* Preview Column */}
        <Card
          className={cn(
            'flex flex-col overflow-hidden p-4 transition-colors sm:p-5',
            theme === 'paper' && 'bg-[#fffdf7] text-[#332a1f] border-[#e2d9c8]',
            theme === 'dark' && 'bg-[#111827] text-[#f8fafc] border-[#1e293b]',
          )}
        >
          <div className="mb-2 flex min-h-10 items-center justify-between gap-3 border-b border-[var(--color-border)] pb-2.5">
            <div className="text-sm font-semibold">{isEn ? 'Preview' : 'Предпросмотр'}</div>
            {/* Open Theme Switcher */}
            <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 text-xs">
              {([
                ['clean', isEn ? 'Light' : 'Светлая'],
                ['paper', isEn ? 'Paper' : 'Бумага'],
                ['dark', isEn ? 'Dark' : 'Тёмная'],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTheme(val)}
                  className={cn(
                    'rounded-md px-2 py-1 font-medium transition-colors',
                    theme === val
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <style>{PREVIEW_CSS}</style>
          {html ? (
            <article
              className="tool-short-landscape-editor markdown-result min-h-[380px] flex-1 overflow-y-auto lg:min-h-[520px]"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
            />
          ) : (
            <div className="tool-short-landscape-editor flex min-h-[380px] flex-1 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] text-center text-sm text-[var(--color-text-muted)] lg:min-h-[520px]">
              {isEn ? 'The rendered document will appear here.' : 'Здесь появится готовый документ.'}
            </div>
          )}
        </Card>
      </div>

      {/* Action Toolbar */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            data-tool-primary-action=""
            size="md"
            className="w-auto min-w-[170px]"
            onClick={copyHtml}
            disabled={!html}
          >
            {copyStatus.includes('HTML')
              ? <CheckCircle size={18} weight="fill" />
              : <ClipboardText size={18} />}
            {copyStatus.includes('HTML') ? copyStatus : (isEn ? 'Copy HTML' : 'Копировать HTML')}
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-auto"
            onClick={copyMd}
            disabled={!markdown}
          >
            {copyStatus.includes('Markdown')
              ? <CheckCircle size={18} weight="fill" />
              : <ClipboardText size={18} />}
            {copyStatus.includes('Markdown') ? copyStatus : (isEn ? 'Copy Markdown' : 'Копировать MD')}
          </Button>
        </div>
      </Card>

      <AdvancedSettings
        className="mt-4"
        defaultOpen={true}
        title={isEn ? 'Export files' : 'Экспорт файлов'}
        description={isEn ? 'Download Markdown or standalone HTML document' : 'Сохранить как Markdown или готовый HTML-файл'}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="markdown-filename" className="text-xs text-[var(--color-text-muted)]">
              {isEn ? 'Filename:' : 'Имя файла:'}
            </Label>
            <Input
              id="markdown-filename"
              className="h-9 w-36 font-mono text-xs sm:w-44"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="document"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={downloadMarkdown}
            disabled={!markdown}
            title={isEn ? 'Download .md file' : 'Скачать файл .md'}
          >
            <Download size={16} />
            .md
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={downloadHtml}
            disabled={!html}
            title={isEn ? 'Download .html file' : 'Скачать файл .html'}
          >
            <Download size={16} />
            .html
          </Button>
        </div>
      </AdvancedSettings>
    </div>
  );
}
