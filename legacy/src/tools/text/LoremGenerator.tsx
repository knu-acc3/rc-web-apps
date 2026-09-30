"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowsClockwise, DownloadSimple } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cryptoRandomInt } from "@/src/lib/cryptoRandom";
import { downloadBlob } from "@/src/utils/exportHelpers";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

type Language = "latin" | "ru" | "tech";
type OutputMode = "paragraphs" | "sentences" | "words" | "list" | "headings";
type OutputFormat = "plain" | "html" | "markdown";

const WORD_BANKS: Record<Language, string[]> = {
  latin: [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
    "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
    "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
    "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
    "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate", "velit",
    "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat",
    "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt",
    "mollit", "anim", "id", "est", "laborum",
  ],
  ru: [
    "рыба", "текст", "наполнение", "страница", "макет", "верстка", "шрифт", "абзац",
    "предложение", "слово", "дизайн", "контент", "блок", "заголовок", "описание",
    "структура", "читаемость", "типографика", "композиция", "сетка", "модуль",
    "компонент", "секция", "форма", "стиль", "шаблон", "правила", "порядок", "система",
    "визуальный", "гармония", "баланс", "контраст", "ритм", "пропорция", "иерархия",
    "выравнивание", "отступ", "логика", "смысл", "ясность", "краткость", "точность",
    "читатель", "коммуникация", "сообщение", "идея", "концепция",
  ],
  tech: [
    "system", "runtime", "async", "await", "promise", "callback", "closure", "scope",
    "context", "prototype", "module", "import", "export", "default", "function", "class",
    "interface", "type", "generic", "union", "render", "hydrate", "virtual", "dom",
    "state", "effect", "memo", "ref", "reducer", "dispatch", "cache", "queue", "stream",
    "buffer", "heap", "stack", "frame", "thread", "worker", "process", "network",
    "request", "response", "status", "header", "payload", "body", "json", "schema",
    "validation", "auth", "token", "session", "cookie", "encrypt", "hash", "signature",
  ],
};

const STARTERS: Record<Language, string> = {
  latin: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  ru: "Это текст для проверки верстки и предварительного просмотра дизайна.",
  tech: "System initialization complete and ready to handle incoming requests.",
};

const MODE_OPTIONS: Array<{ value: OutputMode; ru: string; en: string }> = [
  { value: "paragraphs", ru: "Абзацы", en: "Paragraphs" },
  { value: "sentences", ru: "Предложения", en: "Sentences" },
  { value: "words", ru: "Слова", en: "Words" },
  { value: "list", ru: "Список", en: "List" },
  { value: "headings", ru: "Секции с заголовками", en: "Heading sections" },
];

function randomItem<T>(items: T[]): T {
  return items[cryptoRandomInt(items.length)];
}

function randomInt(min: number, max: number): number {
  return min + cryptoRandomInt(max - min + 1);
}

function makeSentence(bank: string[], minWords: number, maxWords: number): string {
  const count = randomInt(minWords, maxWords);
  const words = Array.from({ length: count }, () => randomItem(bank));
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  if (words.length > 6) {
    const commaAt = randomInt(2, words.length - 3);
    words[commaAt] += ",";
  }
  return `${words.join(" ")}.`;
}

function makeParagraph(bank: string[], targetWords: number): string {
  const sentences: string[] = [];
  let remaining = targetWords;
  while (remaining >= 3 && sentences.length < 50) {
    const length = Math.min(remaining, randomInt(6, 16));
    if (length < 3) break;
    sentences.push(makeSentence(bank, length, length));
    remaining -= length;
  }
  return sentences.join(" ");
}

function makeHeading(bank: string[]): string {
  return Array.from({ length: randomInt(2, 5) }, () => randomItem(bank))
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function LoremGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [language, setLanguage] = useState<Language>("latin");
  const [mode, setMode] = useState<OutputMode>("paragraphs");
  const [format, setFormat] = useState<OutputFormat>("plain");
  const [count, setCount] = useState(3);
  const [wordsPerUnit, setWordsPerUnit] = useState(50);
  const [startWithStandard, setStartWithStandard] = useState(true);
  const [output, setOutput] = useState("");
  const [processedSignature, setProcessedSignature] = useState("");

  const settingsSignature = [
    language,
    mode,
    format,
    count,
    wordsPerUnit,
    startWithStandard,
  ].join("|");
  const hasFreshOutput =
    output.length > 0 && processedSignature === settingsSignature;

  const generateText = useCallback(() => {
    const bank = WORD_BANKS[language];
    const starter = STARTERS[language];

    if (mode === "words") {
      return Array.from({ length: count }, () => randomItem(bank)).join(" ");
    }
    if (mode === "sentences") {
      return Array.from({ length: count }, (_, index) =>
        index === 0 && startWithStandard ? starter : makeSentence(bank, 8, 16),
      ).join(" ");
    }
    if (mode === "list") {
      const items = Array.from({ length: count }, () =>
        makeSentence(bank, 4, 9).replace(/\.$/, ""),
      );
      if (format === "html") {
        return `<ul>\n${items.map((item) => `  <li>${item}</li>`).join("\n")}\n</ul>`;
      }
      const marker = format === "markdown" ? "-" : "•";
      return items.map((item) => `${marker} ${item}`).join("\n");
    }
    if (mode === "headings") {
      return Array.from({ length: count }, () => {
        const heading = makeHeading(bank);
        const paragraph = makeParagraph(bank, wordsPerUnit);
        if (format === "html") return `<h2>${heading}</h2>\n<p>${paragraph}</p>`;
        if (format === "markdown") return `## ${heading}\n\n${paragraph}`;
        return `${heading}\n\n${paragraph}`;
      }).join("\n\n");
    }

    return Array.from({ length: count }, (_, index) => {
      const paragraph =
        index === 0 && startWithStandard
          ? `${starter} ${makeParagraph(
              bank,
              Math.max(3, wordsPerUnit - starter.split(/\s+/).length),
            )}`.trim()
          : makeParagraph(bank, wordsPerUnit);
      return format === "html" ? `<p>${paragraph}</p>` : paragraph;
    }).join(format === "html" ? "\n" : "\n\n");
  }, [count, format, language, mode, startWithStandard, wordsPerUnit]);

  const stats = useMemo(() => {
    const plain = output.replace(/<[^>]+>/g, " ").replace(/^[-•*#]\s*/gm, "");
    return {
      words: plain.trim() ? plain.trim().split(/\s+/).length : 0,
      characters: output.length,
    };
  }, [output]);

  const countLabel =
    mode === "words"
      ? isEn
        ? "Words"
        : "Слов"
      : mode === "sentences"
        ? isEn
          ? "Sentences"
          : "Предложений"
        : mode === "list"
          ? isEn
            ? "Items"
            : "Пунктов"
          : mode === "headings"
            ? isEn
              ? "Sections"
              : "Секций"
            : isEn
              ? "Paragraphs"
              : "Абзацев";

  const downloadOutput = () => {
    if (!output) return;
    const extension = format === "html" ? "html" : format === "markdown" ? "md" : "txt";
    const mime =
      format === "html"
        ? "text/html;charset=utf-8"
        : format === "markdown"
          ? "text/markdown;charset=utf-8"
          : "text/plain;charset=utf-8";
    downloadBlob(new Blob([output], { type: mime }), `lorem-${mode}.${extension}`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      <Card className="p-4 sm:p-5">
        {/* Quick Presets */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1.5">
            {isEn ? "Quick presets:" : "Быстрые шаблоны:"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { labelRu: "1 абзац", labelEn: "1 paragraph", m: "paragraphs" as OutputMode, c: 1, l: "latin" as Language },
              { labelRu: "3 абзаца", labelEn: "3 paragraphs", m: "paragraphs" as OutputMode, c: 3, l: "latin" as Language },
              { labelRu: "5 предложений", labelEn: "5 sentences", m: "sentences" as OutputMode, c: 5, l: "latin" as Language },
              { labelRu: "Список из 5 пунктов", labelEn: "List of 5 items", m: "list" as OutputMode, c: 5, l: "latin" as Language },
              { labelRu: "Русский текст", labelEn: "Russian text", m: "paragraphs" as OutputMode, c: 3, l: "ru" as Language },
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setMode(preset.m);
                  setCount(preset.c);
                  setLanguage(preset.l);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  mode === preset.m && count === preset.c && language === preset.l
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                    : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                }`}
              >
                {isEn ? preset.labelEn : preset.labelRu}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="mb-1.5 block text-sm">
              {isEn ? "Generate" : "Что создать"}
            </Label>
            <Select value={mode} onValueChange={(value) => setMode(value as OutputMode)}>
              <SelectTrigger aria-label={isEn ? "Text type" : "Тип текста"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {isEn ? option.en : option.ru}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="lorem-count" className="mb-1.5 block text-sm">
              {countLabel}
            </Label>
            <Input
              id="lorem-count"
              type="number"
              min={1}
              max={200}
              value={count}
              onChange={(event) =>
                setCount(Math.max(1, Math.min(200, Number(event.target.value) || 1)))
              }
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">
              {isEn ? "Language" : "Язык"}
            </Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latin">Lorem ipsum</SelectItem>
                <SelectItem value="ru">{isEn ? "Russian" : "Русский"}</SelectItem>
                <SelectItem value="tech">Tech</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">
              {isEn ? "Format" : "Формат"}
            </Label>
            <Select value={format} onValueChange={(value) => setFormat(value as OutputFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plain">Plain text</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button
            type="button"
            data-tool-primary-action=""
            size="md"
            className="h-10 px-6 min-w-[180px] w-auto"
            onClick={() => {
              setOutput(generateText());
              setProcessedSignature(settingsSignature);
            }}
          >
            <ArrowsClockwise size={18} />
            {hasFreshOutput
              ? isEn
                ? "Generate again"
                : "Создать заново"
              : isEn
                ? "Generate text"
                : "Создать текст"}
          </Button>
        </div>

        <AdvancedSettings
          className="mt-4"
          defaultOpen={true}
          title={isEn ? "Text options" : "Параметры текста"}
          description={isEn ? "Standard opening phrase and paragraph length" : "Стандартная начальная фраза и длина абзаца"}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={startWithStandard}
                onChange={(event) => setStartWithStandard(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              {isEn ? "Start with standard opening" : "Начинать со стандартной фразы"}
            </label>
            <div className="flex items-center gap-2">
              <Label htmlFor="lorem-words-per-unit" className="text-xs text-[var(--color-text-muted)]">
                {isEn ? "Words/paragraph:" : "Слов в абзаце:"}
              </Label>
              <Input
                id="lorem-words-per-unit"
                type="number"
                min={10}
                max={200}
                value={wordsPerUnit}
                onChange={(e) =>
                  setWordsPerUnit(Math.max(10, Math.min(200, Number(e.target.value) || 50)))
                }
                className="h-8 w-20 text-xs"
              />
            </div>
          </div>
        </AdvancedSettings>
      </Card>

      {hasFreshOutput && (
        <Card className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{isEn ? "Generated text" : "Готовый текст"}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {stats.words} {isEn ? "words" : "слов"} · {stats.characters} {isEn ? "characters" : "символов"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={output} size="medium" />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={downloadOutput}
                aria-label={isEn ? "Download text" : "Скачать текст"}
              >
                <DownloadSimple size={20} />
              </Button>
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{output}</pre>
          </div>
        </Card>
      )}
    </div>
  );
}
