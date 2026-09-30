"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import {
  defaultNameLocale,
  generateUniqueNames,
  type GeneratedName,
  type NameGender,
  type NameLocale,
  type ResolvedGender,
} from "./randomNameGenerator";

export default function RandomName() {
  const { locale: interfaceLocale } = useLanguage();
  const isEn = interfaceLocale === "en";
  const [nameLocale, setNameLocale] = useState<NameLocale>(() =>
    defaultNameLocale(interfaceLocale),
  );
  const [gender, setGender] = useState<NameGender>("any");
  const [count, setCount] = useState("1");
  const [includeSurname, setIncludeSurname] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [results, setResults] = useState<GeneratedName[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    root?.setAttribute("data-tool-hydrated", "random-name");
    return () => root?.removeAttribute("data-tool-hydrated");
  }, []);

  const generate = () => {
    const parsedCount = Number(count);
    if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 20) {
      setError(
        isEn
          ? "Count must be a whole number from 1 to 20."
          : "Количество должно быть целым числом от 1 до 20.",
      );
      return;
    }

    const names = generateUniqueNames({
      locale: nameLocale,
      gender,
      includeSurname,
      count: parsedCount,
    });

    setResults(names);
    setError("");
    setCopied(false);
  };

  const copyResults = async () => {
    const value = results.map((result) => result.name).join("\n");
    const success = await copyText(value);
    if (!success) {
      setError(
        isEn
          ? "Clipboard access was denied."
          : "Браузер запретил доступ к буферу обмена.",
      );
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  const localeLabel = (value: NameLocale) => {
    if (value === "ru") return isEn ? "Russian" : "Русский";
    if (value === "es") return isEn ? "Spanish" : "Испанский";
    return isEn ? "English" : "Английский";
  };

  const genderLabel = (value: ResolvedGender) =>
    value === "female"
      ? isEn
        ? "female name set"
        : "набор женских имён"
      : isEn
        ? "male name set"
        : "набор мужских имён";

  return (
    <div
      ref={rootRef}
      className="mx-auto w-full min-w-0 max-w-3xl"
    >
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Create unique synthetic, name-like combinations for prototypes and tests."
            : "Создайте уникальные синтетические комбинации, похожие на имена, для прототипов и тестов."}
        </p>

        <ToolPrimaryAction type="button" className="mt-4" onClick={generate}>
          {isEn ? "Generate synthetic name" : "Создать синтетическое имя"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the settings" : "Проверьте настройки"}
            description={error}
            className="mt-5"
          />
        ) : results.length > 0 ? (
          <ToolResult
            status="success"
            title={isEn ? "Generated result" : "Готовый результат"}
            className="mt-5"
            actions={
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void copyResults()}
              >
                {copied
                  ? isEn
                    ? "Copied"
                    : "Скопировано"
                  : isEn
                    ? "Copy"
                    : "Копировать"}
              </Button>
            }
          >
            {results.length === 1 ? (
              <p className="break-words text-3xl font-black leading-tight text-[var(--color-text)] sm:text-4xl">
                {results[0].name}
              </p>
            ) : (
              <ol className="space-y-2">
                {results.map((result, index) => (
                  <li
                    key={`${index}-${result.name}`}
                    className="flex min-w-0 gap-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-3 py-2.5"
                  >
                    <span className="w-6 shrink-0 text-right text-sm text-[var(--color-text-subtle)]">
                      {index + 1}
                    </span>
                    <span className="min-w-0 break-words text-base font-bold">
                      {result.name}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {showDetails ? (
              <div className="mt-3 space-y-1 text-sm text-[var(--color-text-muted)]">
                {results.map((result, index) => (
                  <p key={`${index}-${result.name}`}>
                    {result.name}: {localeLabel(result.locale)},{" "}
                    {genderLabel(result.gender)}
                  </p>
                ))}
              </div>
            ) : null}
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "The generated name will appear here."
                : "Созданное имя появится здесь."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Name settings" : "Настройки имени"}
          description={
            isEn
              ? "Style, gender, count, surname and result details"
              : "Стиль, пол, количество, фамилия и детали результата"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="random-name-locale">
                {isEn ? "Naming style" : "Стиль имени"}
              </Label>
              <select
                id="random-name-locale"
                value={nameLocale}
                onChange={(event) =>
                  setNameLocale(event.target.value as NameLocale)
                }
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="en">{localeLabel("en")}</option>
                <option value="ru">{localeLabel("ru")}</option>
                <option value="es">{localeLabel("es")}</option>
              </select>
            </div>

            <div className="min-w-0">
              <Label htmlFor="random-name-gender">
                {isEn ? "First-name set" : "Набор имён"}
              </Label>
              <select
                id="random-name-gender"
                value={gender}
                onChange={(event) =>
                  setGender(event.target.value as NameGender)
                }
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="any">{isEn ? "Mixed" : "Смешанный"}</option>
                <option value="female">
                  {isEn ? "Female names" : "Женские имена"}
                </option>
                <option value="male">
                  {isEn ? "Male names" : "Мужские имена"}
                </option>
              </select>
            </div>

            <div className="min-w-0 sm:max-w-48">
              <Label htmlFor="random-name-count">
                {isEn ? "Number of names" : "Количество имён"}
              </Label>
              <Input
                id="random-name-count"
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                step={1}
                value={count}
                onChange={(event) => setCount(event.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium hover:bg-[var(--color-surface-muted)]">
              <input
                type="checkbox"
                checked={includeSurname}
                onChange={(event) => setIncludeSurname(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Include surname" : "Добавить фамилию"}
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium hover:bg-[var(--color-surface-muted)]">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(event) => setShowDetails(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Show generation details" : "Показывать детали"}
            </label>
          </div>
        </AdvancedSettings>

        <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "Synthetic combinations only. They are not verified identities and can coincidentally match a real person."
            : "Только синтетические комбинации. Это не проверенные личности; совпадение с реальным человеком возможно случайно."}
        </p>
      </section>
    </div>
  );
}
