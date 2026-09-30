"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  DownloadSimple,
  FileMd,
  Sparkle,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";

type ProjectKind = "app" | "library" | "cli" | "api";
type ReadmeLanguage = "ru" | "en";

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function safeFilename(value: string) {
  const normalized = value
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "README";
}

type ReadmeInput = {
  name: string;
  description: string;
  kind: ProjectKind;
  language: ReadmeLanguage;
  installCommand: string;
  runCommand: string;
  usage: string;
  features: string;
  requirements: string;
  environment: string;
  testCommand: string;
  repository: string;
  license: string;
  includeContents: boolean;
  includeContributing: boolean;
};

function buildReadme(input: ReadmeInput) {
  const ru = input.language === "ru";
  const featureItems = lines(input.features);
  const requirementItems = lines(input.requirements);
  const environmentItems = lines(input.environment);
  const sections: string[] = [];

  sections.push(`# ${input.name.trim()}`);
  if (input.description.trim()) sections.push(input.description.trim());

  if (input.includeContents) {
    const contents = [
      ru ? "Установка" : "Installation",
      ru ? "Запуск и использование" : "Run and usage",
      ...(featureItems.length ? [ru ? "Возможности" : "Features"] : []),
      ...(requirementItems.length ? [ru ? "Требования" : "Requirements"] : []),
      ...(environmentItems.length
        ? [ru ? "Переменные окружения" : "Environment variables"]
        : []),
      ...(input.testCommand.trim() ? [ru ? "Тесты" : "Tests"] : []),
      ...(input.includeContributing
        ? [ru ? "Участие в разработке" : "Contributing"]
        : []),
      ...(input.license !== "none" ? [ru ? "Лицензия" : "License"] : []),
    ];
    sections.push(
      `## ${ru ? "Содержание" : "Contents"}\n\n${contents.map((item) => `- [${item}](#${item.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-")})`).join("\n")}`,
    );
  }

  const installBody = input.installCommand.trim()
    ? `\`\`\`bash\n${input.installCommand.trim()}\n\`\`\``
    : ru
      ? "Укажите команду установки для проекта."
      : "Add the installation command for this project.";
  sections.push(`## ${ru ? "Установка" : "Installation"}\n\n${installBody}`);

  const kindIntro: Record<ProjectKind, { ru: string; en: string }> = {
    app: { ru: "Запустите приложение:", en: "Start the application:" },
    library: {
      ru: "Подключите библиотеку в своём проекте:",
      en: "Import the library in your project:",
    },
    cli: { ru: "Запустите команду:", en: "Run the command:" },
    api: { ru: "Запустите API-сервис:", en: "Start the API service:" },
  };
  const runParts = [ru ? kindIntro[input.kind].ru : kindIntro[input.kind].en];
  if (input.runCommand.trim())
    runParts.push(`\`\`\`bash\n${input.runCommand.trim()}\n\`\`\``);
  if (input.usage.trim()) runParts.push(input.usage.trim());
  sections.push(
    `## ${ru ? "Запуск и использование" : "Run and usage"}\n\n${runParts.join("\n\n")}`,
  );

  if (featureItems.length)
    sections.push(
      `## ${ru ? "Возможности" : "Features"}\n\n${featureItems.map((item) => `- ${item}`).join("\n")}`,
    );
  if (requirementItems.length)
    sections.push(
      `## ${ru ? "Требования" : "Requirements"}\n\n${requirementItems.map((item) => `- ${item}`).join("\n")}`,
    );
  if (environmentItems.length) {
    sections.push(
      `## ${ru ? "Переменные окружения" : "Environment variables"}\n\n${environmentItems.map((item) => `- \`${item}\``).join("\n")}`,
    );
  }
  if (input.testCommand.trim())
    sections.push(
      `## ${ru ? "Тесты" : "Tests"}\n\n\`\`\`bash\n${input.testCommand.trim()}\n\`\`\``,
    );

  if (input.includeContributing) {
    sections.push(
      `## ${ru ? "Участие в разработке" : "Contributing"}\n\n${
        ru
          ? "Создайте отдельную ветку, внесите изменения и откройте pull request с описанием результата."
          : "Create a separate branch, make your changes, and open a pull request describing the result."
      }`,
    );
  }

  if (input.repository.trim())
    sections.push(
      `## ${ru ? "Репозиторий" : "Repository"}\n\n${input.repository.trim()}`,
    );
  if (input.license !== "none")
    sections.push(`## ${ru ? "Лицензия" : "License"}\n\n${input.license}`);

  return `${sections.join("\n\n")}\n`;
}

export default function GithubReadme() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<ProjectKind>("app");
  const [readmeLanguage, setReadmeLanguage] = useState<ReadmeLanguage>(
    isEn ? "en" : "ru",
  );
  const [installCommand, setInstallCommand] = useState("npm install");
  const [runCommand, setRunCommand] = useState("npm run dev");
  const [usage, setUsage] = useState("");
  const [features, setFeatures] = useState("");
  const [requirements, setRequirements] = useState("");
  const [environment, setEnvironment] = useState("");
  const [testCommand, setTestCommand] = useState("npm test");
  const [repository, setRepository] = useState("");
  const [license, setLicense] = useState("MIT");
  const [includeContents, setIncludeContents] = useState(true);
  const [includeContributing, setIncludeContributing] = useState(true);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const input = useMemo<ReadmeInput>(
    () => ({
      name,
      description,
      kind,
      language: readmeLanguage,
      installCommand,
      runCommand,
      usage,
      features,
      requirements,
      environment,
      testCommand,
      repository,
      license,
      includeContents,
      includeContributing,
    }),
    [
      description,
      environment,
      features,
      includeContents,
      includeContributing,
      installCommand,
      kind,
      license,
      name,
      readmeLanguage,
      repository,
      requirements,
      runCommand,
      testCommand,
      usage,
    ],
  );

  const invalidate = () => {
    setResult("");
    setCopied(false);
    setError("");
  };

  const generate = () => {
    if (!name.trim()) {
      setError(isEn ? "Enter the project name." : "Введите название проекта.");
      return;
    }
    setResult(buildReadme(input));
    setError("");
    setCopied(false);
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob([result], { type: "text/markdown;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(name)}-README.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="readme-name" className="text-sm font-semibold">
              {isEn ? "Project name" : "Название проекта"}
            </Label>
            <Input
              id="readme-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                invalidate();
              }}
              placeholder="acme-dashboard"
              className="mt-2 h-12"
            />
          </div>
          <div>
            <Label htmlFor="readme-kind" className="text-sm font-semibold">
              {isEn ? "Project type" : "Тип проекта"}
            </Label>
            <select
              id="readme-kind"
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as ProjectKind);
                invalidate();
              }}
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            >
              <option value="app">{isEn ? "Application" : "Приложение"}</option>
              <option value="library">{isEn ? "Library" : "Библиотека"}</option>
              <option value="cli">CLI</option>
              <option value="api">API</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="readme-description" className="text-sm font-semibold">
            {isEn ? "One-line description" : "Короткое описание"}
          </Label>
          <Textarea
            id="readme-description"
            rows={3}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              invalidate();
            }}
            placeholder={
              isEn
                ? "What the project does and who it helps"
                : "Что делает проект и кому он помогает"
            }
            className="mt-2 min-h-24 resize-y"
          />
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          onClick={generate}
          leadingIcon={<Sparkle size={20} weight="fill" />}
        >
          {isEn ? "Generate README" : "Создать README"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "README sections" : "Разделы README"}
          description={
            isEn
              ? "Commands, features, requirements and document options"
              : "Команды, возможности, требования и параметры документа"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="readme-language">
                {isEn ? "Document language" : "Язык документа"}
              </Label>
              <select
                id="readme-language"
                value={readmeLanguage}
                onChange={(event) => {
                  setReadmeLanguage(event.target.value as ReadmeLanguage);
                  invalidate();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="ru">{isEn ? "Russian" : "Русский"}</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <Label htmlFor="readme-license">
                {isEn ? "License" : "Лицензия"}
              </Label>
              <select
                id="readme-license"
                value={license}
                onChange={(event) => {
                  setLicense(event.target.value);
                  invalidate();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="MIT">MIT</option>
                <option value="Apache-2.0">Apache-2.0</option>
                <option value="GPL-3.0">GPL-3.0</option>
                <option value="Proprietary">
                  {isEn ? "Proprietary" : "Проприетарная"}
                </option>
                <option value="none">
                  {isEn ? "Do not add" : "Не добавлять"}
                </option>
              </select>
            </div>
            <div>
              <Label htmlFor="readme-install">
                {isEn ? "Install command" : "Команда установки"}
              </Label>
              <Input
                id="readme-install"
                value={installCommand}
                onChange={(event) => {
                  setInstallCommand(event.target.value);
                  invalidate();
                }}
                className="mt-1.5 h-11 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="readme-run">
                {isEn ? "Run command" : "Команда запуска"}
              </Label>
              <Input
                id="readme-run"
                value={runCommand}
                onChange={(event) => {
                  setRunCommand(event.target.value);
                  invalidate();
                }}
                className="mt-1.5 h-11 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="readme-test">
                {isEn ? "Test command" : "Команда тестов"}
              </Label>
              <Input
                id="readme-test"
                value={testCommand}
                onChange={(event) => {
                  setTestCommand(event.target.value);
                  invalidate();
                }}
                className="mt-1.5 h-11 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="readme-repository">
                {isEn ? "Repository URL" : "URL репозитория"}
              </Label>
              <Input
                id="readme-repository"
                value={repository}
                onChange={(event) => {
                  setRepository(event.target.value);
                  invalidate();
                }}
                placeholder="https://github.com/acme/project"
                className="mt-1.5 h-11"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="readme-features">
                {isEn
                  ? "Features — one per line"
                  : "Возможности — по одной в строке"}
              </Label>
              <Textarea
                id="readme-features"
                rows={5}
                value={features}
                onChange={(event) => {
                  setFeatures(event.target.value);
                  invalidate();
                }}
                className="mt-1.5 min-h-28"
              />
            </div>
            <div>
              <Label htmlFor="readme-requirements">
                {isEn
                  ? "Requirements — one per line"
                  : "Требования — по одному в строке"}
              </Label>
              <Textarea
                id="readme-requirements"
                rows={5}
                value={requirements}
                onChange={(event) => {
                  setRequirements(event.target.value);
                  invalidate();
                }}
                className="mt-1.5 min-h-28"
              />
            </div>
            <div>
              <Label htmlFor="readme-usage">
                {isEn ? "Usage notes" : "Использование"}
              </Label>
              <Textarea
                id="readme-usage"
                rows={5}
                value={usage}
                onChange={(event) => {
                  setUsage(event.target.value);
                  invalidate();
                }}
                className="mt-1.5 min-h-28"
              />
            </div>
            <div>
              <Label htmlFor="readme-environment">
                {isEn
                  ? "Environment variable names"
                  : "Названия переменных окружения"}
              </Label>
              <Textarea
                id="readme-environment"
                rows={5}
                value={environment}
                onChange={(event) => {
                  setEnvironment(event.target.value);
                  invalidate();
                }}
                className="mt-1.5 min-h-28 font-mono"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input
                type="checkbox"
                checked={includeContents}
                onChange={(event) => {
                  setIncludeContents(event.target.checked);
                  invalidate();
                }}
                className="size-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Add table of contents" : "Добавить содержание"}
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input
                type="checkbox"
                checked={includeContributing}
                onChange={(event) => {
                  setIncludeContributing(event.target.checked);
                  invalidate();
                }}
                className="size-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Add contributing section" : "Добавить раздел об участии"}
            </label>
          </div>
        </AdvancedSettings>
      </section>

      {result ? (
        <section
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileMd size={21} className="text-[var(--color-primary)]" />
              <h2 className="font-bold">README.md</h2>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={copyResult}
              >
                {copied ? (
                  <Check size={18} weight="bold" />
                ) : (
                  <Copy size={18} />
                )}
                <span className="hidden sm:inline">
                  {copied
                    ? isEn
                      ? "Copied"
                      : "Скопировано"
                    : isEn
                      ? "Copy"
                      : "Копировать"}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={downloadResult}
              >
                <DownloadSimple size={18} />{" "}
                <span className="hidden sm:inline">
                  {isEn ? "Download" : "Скачать"}
                </span>
              </Button>
            </div>
          </div>
          <Textarea
            value={result}
            readOnly
            rows={18}
            className="mt-3 min-h-[24rem] resize-y bg-[var(--color-code-bg)] font-mono text-sm text-[var(--color-code-text)]"
            aria-label="README Markdown"
          />
        </section>
      ) : null}
    </div>
  );
}
