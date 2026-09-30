"use client";

import { useCallback, useMemo, useState } from "react";
import { DownloadSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { useClipboardPaste } from "@/src/hooks/useClipboardPaste";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { sanitizeHtml } from "@/src/utils/htmlSanitization";
import {
  downloadBlob,
  escapeCsvCellForSpreadsheet,
} from "@/src/utils/exportHelpers";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { useUrlState } from "@/src/hooks/useUrlState";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";

type Mode = "match" | "replace" | "split";

interface MatchInfo {
  match: string;
  index: number;
  groups: string[];
  namedGroups: Record<string, string> | null;
}

const COMMON_PATTERNS = [
  { label: "Email", pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}", flags: "gi" },
  { label: "URL", pattern: "https?:\\/\\/[^\\s<>\"]+", flags: "gi" },
  { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
  { label: "International phone", pattern: "\\+?[1-9]\\d{1,14}", flags: "g" },
  { label: "YYYY-MM-DD", pattern: "\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])", flags: "g" },
  { label: "UUID", pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", flags: "gi" },
  { label: "Hex color", pattern: "#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b", flags: "g" },
  { label: "Number", pattern: "-?\\b\\d+(?:\\.\\d+)?\\b", flags: "g" },
] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function csvEscape(value: string): string {
  return escapeCsvCellForSpreadsheet(value);
}

function buildCode(
  language: string,
  pattern: string,
  flags: string,
  mode: Mode,
  replacement: string,
): string {
  const quotedPattern = JSON.stringify(pattern);
  const quotedFlags = JSON.stringify(flags);
  const quotedReplacement = JSON.stringify(replacement);
  if (language === "python") {
    const pythonFlags = [
      flags.includes("i") ? "re.IGNORECASE" : "",
      flags.includes("m") ? "re.MULTILINE" : "",
      flags.includes("s") ? "re.DOTALL" : "",
    ].filter(Boolean);
    const suffix = pythonFlags.length ? `, flags=${pythonFlags.join(" | ")}` : "";
    if (mode === "replace") return `import re\nresult = re.sub(${quotedPattern}, ${quotedReplacement}, text${suffix})`;
    if (mode === "split") return `import re\nparts = re.split(${quotedPattern}, text${suffix})`;
    return `import re\nmatches = re.findall(${quotedPattern}, text${suffix})`;
  }
  if (language === "java") {
    if (mode === "replace") return `String result = text.replaceAll(${quotedPattern}, ${quotedReplacement});`;
    if (mode === "split") return `String[] parts = text.split(${quotedPattern});`;
    return `Matcher matcher = Pattern.compile(${quotedPattern}).matcher(text);`;
  }
  if (language === "go") {
    if (mode === "replace") return `re := regexp.MustCompile(${quotedPattern})\nresult := re.ReplaceAllString(text, ${quotedReplacement})`;
    if (mode === "split") return `re := regexp.MustCompile(${quotedPattern})\nparts := re.Split(text, -1)`;
    return `re := regexp.MustCompile(${quotedPattern})\nmatches := re.FindAllString(text, -1)`;
  }
  if (language === "grep") {
    return `grep -E${flags.includes("i") ? "i" : ""} ${quotedPattern} file.txt`;
  }
  const expression = `new RegExp(${quotedPattern}, ${quotedFlags})`;
  if (mode === "replace") return `const result = text.replace(${expression}, ${quotedReplacement});`;
  if (mode === "split") return `const parts = text.split(${expression});`;
  return flags.includes("g")
    ? `const matches = Array.from(text.matchAll(${expression}));`
    : `const match = text.match(${expression});`;
}

export default function RegexTester() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const { state: urlState, setState: setUrlState } = useUrlState({
    defaultValues: {
      pattern: "",
      testString: "",
      replacement: "",
      mode: "match" as Mode,
    },
    hashKeys: ["testString", "replacement"],
  });

  const pattern = urlState.pattern;
  const testString = urlState.testString;
  const replacement = urlState.replacement;
  const mode = urlState.mode;

  const setPattern = useCallback((val: string) => {
    setUrlState({ pattern: val });
  }, [setUrlState]);
  const setTestString = useCallback((val: string) => {
    setUrlState({ testString: val });
  }, [setUrlState]);
  const setReplacement = useCallback((val: string) => {
    setUrlState({ replacement: val });
  }, [setUrlState]);
  const setMode = useCallback((val: Mode) => {
    setUrlState({ mode: val });
  }, [setUrlState]);

  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false });
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [processedSignature, setProcessedSignature] = useState("");
  const { pasteText, pasting } = useClipboardPaste();

  const flagString = Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag)
    .join("");
  const signature = JSON.stringify([pattern, testString, replacement, flagString, mode]);
  const hasFreshResult = processedSignature === signature;

  const evaluation = useMemo(() => {
    if (!pattern) {
      return {
        error: "",
        matches: [] as MatchInfo[],
        highlighted: escapeHtml(testString),
        replacementResult: testString,
        parts: [] as string[],
      };
    }
    try {
      const expression = new RegExp(pattern, flagString);
      const matches: MatchInfo[] = [];
      if (flags.g) {
        let match: RegExpExecArray | null;
        while ((match = expression.exec(testString)) !== null) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
            namedGroups: match.groups ? { ...match.groups } : null,
          });
          if (match[0].length === 0) expression.lastIndex += 1;
        }
      } else {
        const match = expression.exec(testString);
        if (match) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
            namedGroups: match.groups ? { ...match.groups } : null,
          });
        }
      }

      let highlighted = "";
      let previousEnd = 0;
      matches.forEach((match) => {
        highlighted += escapeHtml(testString.slice(previousEnd, match.index));
        highlighted += `<mark style="background:color-mix(in_oklab,var(--color-primary)_25%,transparent);border-radius:4px;padding:1px 3px">${escapeHtml(match.match)}</mark>`;
        previousEnd = match.index + match.match.length;
      });
      highlighted += escapeHtml(testString.slice(previousEnd));

      return {
        error: "",
        matches,
        highlighted,
        replacementResult: testString.replace(new RegExp(pattern, flagString), replacement),
        parts: testString.split(new RegExp(pattern, flagString)),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Invalid regular expression",
        matches: [] as MatchInfo[],
        highlighted: escapeHtml(testString),
        replacementResult: "",
        parts: [] as string[],
      };
    }
  }, [flagString, flags.g, pattern, replacement, testString]);

  const resultText =
    mode === "replace"
      ? evaluation.replacementResult
      : mode === "split"
        ? evaluation.parts.join("\n")
        : evaluation.matches.map((match) => match.match).join("\n");
  const exportedCode = buildCode(codeLanguage, pattern, flagString, mode, replacement);

  const applyCommonPattern = (value: string) => {
    const selected = COMMON_PATTERNS.find((item) => item.label === value);
    if (!selected) return;
    setPattern(selected.pattern);
    setFlags({
      g: selected.flags.includes("g"),
      i: selected.flags.includes("i"),
      m: selected.flags.includes("m"),
      s: selected.flags.includes("s"),
    });
  };

  const downloadMatches = useCallback(() => {
    if (!hasFreshResult || evaluation.matches.length === 0) return;
    const rows = [
      "index,start,end,match,groups,named_groups",
      ...evaluation.matches.map((match, index) =>
        [
          String(index + 1),
          String(match.index),
          String(match.index + match.match.length),
          csvEscape(match.match),
          csvEscape(match.groups.join(" | ")),
          csvEscape(match.namedGroups ? JSON.stringify(match.namedGroups) : ""),
        ].join(","),
      ),
    ];
    downloadBlob(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }), "regex-matches.csv");
  }, [evaluation.matches, hasFreshResult]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3">
      <Card className="p-4 sm:p-5">
        <Label htmlFor="regex-pattern" className="mb-1.5 block text-sm">
          {isEn ? "Regular expression" : "Регулярное выражение"}
        </Label>
        <div className="mb-4 flex items-center gap-2">
          <span className="font-mono text-lg text-[var(--color-text-muted)]">/</span>
          <Input
            id="regex-pattern"
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder={isEn ? "Enter a pattern" : "Введите паттерн"}
            className="font-mono"
          />
          <span className="font-mono text-sm text-[var(--color-text-muted)]">/{flagString}</span>
        </div>

        <Label htmlFor="regex-text" className="mb-1.5 block text-sm">
          {isEn ? "Text to test" : "Текст для проверки"}
        </Label>
        <Textarea
          id="regex-text"
          rows={8}
          value={testString}
          onChange={(event) => setTestString(event.target.value)}
          placeholder={isEn ? "Paste text here" : "Вставьте текст сюда"}
          className="font-mono text-sm"
        />

        <ToolPrimaryAction
          type="button"
          className="mt-3"
          onClick={() => setProcessedSignature(signature)}
          disabled={!pattern || !testString}
          leadingIcon={<MagnifyingGlass size={20} />}
        >
          {isEn ? "Test regex" : "Проверить выражение"}
        </ToolPrimaryAction>
      </Card>

      {hasFreshResult && evaluation.error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]">
          {isEn ? "Regex error: " : "Ошибка regex: "}{evaluation.error}
        </p>
      )}

      {hasFreshResult && !evaluation.error && (
        <Card className="p-4 sm:p-5" aria-live="polite">
          <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
            <div>
              <div className="font-semibold">
                {mode === "match"
                  ? isEn
                    ? "Matches"
                    : "Совпадения"
                  : mode === "replace"
                    ? isEn
                      ? "Replacement result"
                      : "Результат замены"
                    : isEn
                      ? "Split parts"
                      : "Части"}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {mode === "match" ? evaluation.matches.length : mode === "split" ? evaluation.parts.length : evaluation.matches.length}
              </div>
            </div>
            <CopyButton text={resultText} size="medium" />
          </div>

          {mode === "match" ? (
            <>
              <div
                className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 font-mono text-sm"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(evaluation.highlighted) }}
              />
              {evaluation.matches.length > 0 && (
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {evaluation.matches.map((match, index) => (
                    <div key={`${match.index}-${index}`} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                      <div className="break-all font-mono text-sm">{match.match || (isEn ? "(empty)" : "(пусто)")}</div>
                      <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {match.index}–{match.index + match.match.length}
                        {match.groups.length > 0 ? ` · ${match.groups.length} ${isEn ? "groups" : "групп"}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Textarea
              rows={9}
              value={resultText}
              readOnly
              className="bg-[var(--color-surface-muted)] font-mono text-sm"
            />
          )}
        </Card>
      )}

      <AdvancedSettings
        title={isEn ? "Regex options" : "Дополнительные настройки"}
        description={isEn ? "Mode, flags, patterns and code export" : "Режим, флаги, паттерны и экспорт кода"}
        className="[&_button]:min-h-11 [&_label]:min-h-11 [&_select]:min-h-11"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="regex-mode" className="mb-1.5 block text-sm">{isEn ? "Mode" : "Режим"}</Label>
              <select
                id="regex-mode"
                value={mode}
                onChange={(event) => setMode(event.target.value as Mode)}
                className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="match">{isEn ? "Find matches" : "Найти совпадения"}</option>
                <option value="replace">{isEn ? "Replace" : "Заменить"}</option>
                <option value="split">{isEn ? "Split" : "Разбить"}</option>
              </select>
            </div>
            <div>
              <Label htmlFor="regex-common-pattern" className="mb-1.5 block text-sm">{isEn ? "Common pattern" : "Готовый паттерн"}</Label>
              <select
                id="regex-common-pattern"
                defaultValue=""
                onChange={(event) => applyCommonPattern(event.target.value)}
                className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="" disabled>{isEn ? "Choose" : "Выберите"}</option>
                {COMMON_PATTERNS.map((item) => (
                  <option key={item.label} value={item.label}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(flags) as Array<keyof typeof flags>).map((flag) => (
              <label key={flag} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
                <input
                  type="checkbox"
                  checked={flags[flag]}
                  onChange={() => setFlags((current) => ({ ...current, [flag]: !current[flag] }))}
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                <code className="font-bold">{flag}</code>
              </label>
            ))}
          </div>

          {mode === "replace" && (
            <div>
              <Label htmlFor="regex-replacement" className="mb-1.5 block text-sm">
                {isEn ? "Replace with" : "Заменить на"}
              </Label>
              <Input
                id="regex-replacement"
                value={replacement}
                onChange={(event) => setReplacement(event.target.value)}
                className="font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const value = await pasteText();
                if (value !== null) setTestString(value);
              }}
              disabled={pasting}
            >
              {isEn ? "Paste text" : "Вставить текст"}
            </Button>
            <CopyButton text={`/${pattern}/${flagString}`} size="medium" className="w-full" />
            <Button type="button" variant="outline" onClick={downloadMatches} disabled={!hasFreshResult || evaluation.matches.length === 0}>
              <DownloadSimple size={18} /> CSV
            </Button>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4">
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
              <Label htmlFor="regex-code-language" className="sr-only">
                {isEn ? "Code language" : "Язык кода"}
              </Label>
              <select
                id="regex-code-language"
                value={codeLanguage}
                onChange={(event) => setCodeLanguage(event.target.value)}
                className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="grep">grep</option>
              </select>
              <div className="flex justify-end">
                <CopyButton text={exportedCode} size="medium" />
              </div>
            </div>
            <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 font-mono text-xs leading-relaxed">{exportedCode}</pre>
          </div>
        </div>
      </AdvancedSettings>
    </div>
  );
}
