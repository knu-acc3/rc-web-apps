"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import {
  ToolResult,
  type ToolResultStatus,
} from "@/src/components/tool/workspace/ToolResult";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";

export const USER_AGENT_LIMITS = {
  maximumLength: 4096,
  maximumRawTokens: 80,
} as const;

export interface UserAgentPart {
  family: string;
  version: string;
}

export type UserAgentDeviceClass =
  "desktop" | "mobile" | "tablet" | "bot" | "unknown";

export interface UserAgentBot {
  name: string;
  version: string;
}

export interface ParsedUserAgent {
  browser: UserAgentPart;
  engine: UserAgentPart;
  os: UserAgentPart;
  deviceClass: UserAgentDeviceClass;
  bot: UserAgentBot | null;
  rawTokens: string[];
}

interface BotRule {
  name: string;
  pattern: RegExp;
}

type InputError = "empty" | "too-long";

const UNKNOWN_PART: UserAgentPart = { family: "Unknown", version: "" };
const WHITESPACE_SEPARATOR = /\s+/u;
const TOKEN_SEPARATOR = /[\s();]+/u;

const EDGE_PATTERN = /\b(?:Edg|EdgA|EdgiOS)\/([\d.]+)/iu;
const OPERA_PATTERN = /\b(?:OPR|OPiOS|Opera)\/([\d.]+)/iu;
const VIVALDI_PATTERN = /\bVivaldi\/([\d.]+)/iu;
const YANDEX_PATTERN = /\bYaBrowser\/([\d.]+)/iu;
const SAMSUNG_PATTERN = /\bSamsungBrowser\/([\d.]+)/iu;
const FIREFOX_PATTERN = /\bFirefox\/([\d.]+)/iu;
const FIREFOX_IOS_PATTERN = /\bFxiOS\/([\d.]+)/iu;
const CHROME_PATTERN = /\b(?:Chrome|Chromium)\/([\d.]+)/iu;
const CHROME_IOS_PATTERN = /\bCriOS\/([\d.]+)/iu;
const ANDROID_WEBVIEW_PATTERN = /(?:;\s*wv\)|\bVersion\/4\.0\b.*\bChrome\/)/iu;
const SAFARI_PATTERN = /\bSafari\/([\d.]+)/iu;
const SAFARI_VERSION_PATTERN = /\bVersion\/([\d.]+)/iu;
const IE_PATTERN = /\bMSIE\s+([\d.]+)/iu;
const IE_TRIDENT_VERSION_PATTERN = /\bTrident\/.*\brv:([\d.]+)/iu;

const TRIDENT_ENGINE_PATTERN = /\bTrident\/([\d.]+)/iu;
const GECKO_ENGINE_PATTERN = /\bGecko\/\S+/iu;
const GECKO_VERSION_PATTERN = /\brv:([\d.]+)/iu;
const WEBKIT_ENGINE_PATTERN = /\bAppleWebKit\/([\d.]+)/iu;
const BLINK_CLIENT_PATTERN =
  /\b(?:Chrome|Chromium|Edg|EdgA|OPR|Vivaldi|YaBrowser|SamsungBrowser)\//iu;

const IOS_DEVICE_PATTERN = /\b(?:iPhone|iPad|iPod)\b/iu;
const IOS_VERSION_PATTERN =
  /\b(?:CPU(?:\s+iPhone)?\s+OS|iPhone\s+OS)\s+([\d_]+)/iu;
const ANDROID_PATTERN = /\bAndroid(?:\s+([\d.]+))?/iu;
const WINDOWS_PATTERN = /\bWindows\s+NT\s+([\d.]+)/iu;
const MACOS_PATTERN = /\bMac\s+OS\s+X(?:\s+([\d_]+))?/iu;
const CHROMEOS_PATTERN = /\bCrOS\s+[^;\s)]+\s+([\d.]+)/iu;
const LINUX_PATTERN = /\bLinux\b/iu;
const MOBILE_PATTERN = /\bMobile\b/iu;
const TABLET_PATTERN = /\b(?:Tablet|iPad|Kindle|Silk)\b/iu;

const STRONG_BOT_RULES: readonly BotRule[] = [
  {
    name: "Googlebot",
    pattern: /\bGooglebot(?:-[A-Za-z]+)?(?:\/([\d.]+))?\b/iu,
  },
  { name: "Bingbot", pattern: /\bbingbot(?:\/([\d.]+))?\b/iu },
  { name: "DuckDuckBot", pattern: /\bDuckDuckBot(?:\/([\d.]+))?\b/iu },
  { name: "Applebot", pattern: /\bApplebot(?:\/([\d.]+))?\b/iu },
  { name: "GPTBot", pattern: /\bGPTBot(?:\/([\d.]+))?\b/iu },
  {
    name: "ChatGPT-User",
    pattern: /\bChatGPT-User(?:\/([\d.]+))?\b/iu,
  },
  {
    name: "OAI-SearchBot",
    pattern: /\bOAI-SearchBot(?:\/([\d.]+))?\b/iu,
  },
  { name: "ClaudeBot", pattern: /\bClaudeBot(?:\/([\d.]+))?\b/iu },
  {
    name: "PerplexityBot",
    pattern: /\bPerplexityBot(?:\/([\d.]+))?\b/iu,
  },
  { name: "CCBot", pattern: /\bCCBot(?:\/([\d.]+))?\b/iu },
] as const;

function part(family: string, version = ""): UserAgentPart {
  return { family, version };
}

function matchedVersion(input: string, pattern: RegExp): string {
  return pattern.exec(input)?.[1] ?? "";
}

export function normalizeUserAgent(input: string): string {
  return input.trim().split(WHITESPACE_SEPARATOR).join(" ");
}

export function extractUserAgentTokens(input: string): string[] {
  const normalized = normalizeUserAgent(input);
  if (!normalized) return [];
  return normalized
    .split(TOKEN_SEPARATOR)
    .filter((token) => token.length > 0)
    .slice(0, USER_AGENT_LIMITS.maximumRawTokens);
}

function detectStrongBot(input: string): UserAgentBot | null {
  for (const rule of STRONG_BOT_RULES) {
    const match = rule.pattern.exec(input);
    if (match) return { name: rule.name, version: match[1] ?? "" };
  }
  return null;
}

function detectBrowser(input: string): UserAgentPart {
  let version = matchedVersion(input, EDGE_PATTERN);
  if (version) return part("Microsoft Edge", version);

  version = matchedVersion(input, OPERA_PATTERN);
  if (version) return part("Opera", version);

  version = matchedVersion(input, VIVALDI_PATTERN);
  if (version) return part("Vivaldi", version);

  version = matchedVersion(input, YANDEX_PATTERN);
  if (version) return part("Yandex Browser", version);

  version = matchedVersion(input, SAMSUNG_PATTERN);
  if (version) return part("Samsung Internet", version);

  version = matchedVersion(input, FIREFOX_IOS_PATTERN);
  if (version) return part("Firefox", version);

  version = matchedVersion(input, FIREFOX_PATTERN);
  if (version) return part("Firefox", version);

  if (ANDROID_WEBVIEW_PATTERN.test(input)) {
    return part("Android WebView", matchedVersion(input, CHROME_PATTERN));
  }

  version = matchedVersion(input, CHROME_IOS_PATTERN);
  if (version) return part("Google Chrome", version);

  version = matchedVersion(input, CHROME_PATTERN);
  if (version) return part("Google Chrome", version);

  if (SAFARI_PATTERN.test(input)) {
    version = matchedVersion(input, SAFARI_VERSION_PATTERN);
    return part("Safari", version);
  }

  version = matchedVersion(input, IE_PATTERN);
  if (version) return part("Internet Explorer", version);

  version = matchedVersion(input, IE_TRIDENT_VERSION_PATTERN);
  if (version) return part("Internet Explorer", version);

  return { ...UNKNOWN_PART };
}

function detectEngine(input: string): UserAgentPart {
  let version = matchedVersion(input, TRIDENT_ENGINE_PATTERN);
  if (version) return part("Trident", version);

  if (GECKO_ENGINE_PATTERN.test(input) && FIREFOX_PATTERN.test(input)) {
    return part("Gecko", matchedVersion(input, GECKO_VERSION_PATTERN));
  }

  version = matchedVersion(input, WEBKIT_ENGINE_PATTERN);
  if (version) {
    const usesBlinkToken = BLINK_CLIENT_PATTERN.test(input);
    const isIosClient = IOS_DEVICE_PATTERN.test(input);
    return usesBlinkToken && !isIosClient
      ? part("Blink")
      : part("WebKit", version);
  }

  return { ...UNKNOWN_PART };
}

function detectOperatingSystem(input: string): UserAgentPart {
  if (IOS_DEVICE_PATTERN.test(input)) {
    return part(
      "iOS",
      matchedVersion(input, IOS_VERSION_PATTERN).replaceAll("_", "."),
    );
  }

  const androidMatch = ANDROID_PATTERN.exec(input);
  if (androidMatch) return part("Android", androidMatch[1] ?? "");

  if (/\bWindows\s+11\b/i.test(input)) {
    return part("Windows", "11");
  }
  const windowsVersion = matchedVersion(input, WINDOWS_PATTERN);
  if (windowsVersion) return part("Windows", windowsVersion);

  const chromeOsMatch = CHROMEOS_PATTERN.exec(input);
  if (chromeOsMatch) return part("Chrome OS", chromeOsMatch[1] ?? "");

  if (MACOS_PATTERN.test(input)) {
    return part(
      "macOS",
      matchedVersion(input, MACOS_PATTERN).replaceAll("_", "."),
    );
  }

  if (LINUX_PATTERN.test(input)) return part("Linux");
  return { ...UNKNOWN_PART };
}

function detectDeviceClass(
  input: string,
  os: UserAgentPart,
  bot: UserAgentBot | null,
): UserAgentDeviceClass {
  if (bot) return "bot";
  if (
    TABLET_PATTERN.test(input) ||
    (ANDROID_PATTERN.test(input) && !MOBILE_PATTERN.test(input))
  ) {
    return "tablet";
  }
  if (IOS_DEVICE_PATTERN.test(input) || MOBILE_PATTERN.test(input)) {
    return "mobile";
  }
  if (["Windows", "macOS", "Linux", "Chrome OS"].includes(os.family)) {
    return "desktop";
  }
  return "unknown";
}

export function parseUserAgent(input: string): ParsedUserAgent {
  const normalized = normalizeUserAgent(input);
  const bot = detectStrongBot(normalized);
  const os = detectOperatingSystem(normalized);

  return {
    browser: detectBrowser(normalized),
    engine: detectEngine(normalized),
    os,
    deviceClass: detectDeviceClass(normalized, os, bot),
    bot,
    rawTokens: extractUserAgentTokens(normalized),
  };
}

function localizedFamily(family: string, isEn: boolean): string {
  if (family !== "Unknown") return family;
  return isEn ? "Unknown" : "Не определено";
}

function formattedPart(value: UserAgentPart, isEn: boolean): string {
  const family = localizedFamily(value.family, isEn);
  return value.version ? `${family} ${value.version}` : family;
}

function localizedDeviceClass(value: UserAgentDeviceClass, isEn: boolean) {
  const labels: Record<UserAgentDeviceClass, { en: string; ru: string }> = {
    desktop: { en: "Desktop", ru: "Компьютер" },
    mobile: { en: "Mobile", ru: "Мобильное устройство" },
    tablet: { en: "Tablet", ru: "Планшет" },
    bot: { en: "Bot", ru: "Бот" },
    unknown: { en: "Unknown", ru: "Не определено" },
  };
  return labels[value][isEn ? "en" : "ru"];
}

function ResultDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-bold leading-6 text-[var(--color-text)]">
        {value}
      </dd>
    </div>
  );
}

export default function UserAgentParser() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ParsedUserAgent | null>(null);
  const [inputError, setInputError] = useState<InputError | null>(null);

  const parseInput = async () => {
    if (!input.trim()) {
      setResult(null);
      setInputError("empty");
      return;
    }
    if (input.length > USER_AGENT_LIMITS.maximumLength) {
      setResult(null);
      setInputError("too-long");
      return;
    }

    const parsed = parseUserAgent(input);
    if (
      parsed.os.family === "Windows" &&
      (parsed.os.version === "10.0" || parsed.os.version === "10") &&
      typeof navigator !== "undefined" &&
      "userAgentData" in navigator
    ) {
      try {
        const uaData = (navigator as unknown as { userAgentData?: { platform?: string; getHighEntropyValues: (hints: string[]) => Promise<{ platformVersion?: string }> } }).userAgentData;
        if (uaData?.platform === "Windows") {
          const values = await uaData.getHighEntropyValues(["platformVersion"]);
          const majorVersion = parseInt(values.platformVersion?.split(".")[0] || "0", 10);
          if (majorVersion >= 13) {
            parsed.os = { family: "Windows", version: "11" };
          }
        }
      } catch {
        // ignore client hints error
      }
    }

    setResult(parsed);
    setInputError(null);
  };

  let resultStatus: ToolResultStatus = "idle";
  let resultTitle = isEn ? "Ready to parse" : "Готово к разбору";
  let resultDescription = isEn
    ? "Enter one User-Agent string and press Parse."
    : "Введите одну строку User-Agent и нажмите «Разобрать».";

  if (inputError) {
    resultStatus = "error";
    resultTitle = isEn ? "Check the input" : "Проверьте ввод";
    resultDescription =
      inputError === "empty"
        ? isEn
          ? "Enter a User-Agent string."
          : "Введите строку User-Agent."
        : isEn
          ? `The string must be no longer than ${USER_AGENT_LIMITS.maximumLength} characters.`
          : `Строка должна быть не длиннее ${USER_AGENT_LIMITS.maximumLength} символов.`;
  } else if (result) {
    resultStatus = "success";
    resultTitle = isEn ? "User-Agent parsed" : "User-Agent разобран";
    resultDescription = isEn
      ? "These fields are a best-effort interpretation of the submitted text."
      : "Поля ниже — вероятностная интерпретация переданного текста.";
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            parseInput();
          }}
        >
          <Label htmlFor="user-agent-input">User-Agent</Label>
          <Textarea
            id="user-agent-input"
            rows={5}
            maxLength={USER_AGENT_LIMITS.maximumLength}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setResult(null);
              setInputError(null);
            }}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={inputError ? true : undefined}
            aria-describedby={
              inputError
                ? "user-agent-input-hint user-agent-input-error"
                : "user-agent-input-hint"
            }
            placeholder={
              isEn
                ? "Paste one User-Agent string"
                : "Вставьте одну строку User-Agent"
            }
            className="mt-1.5 min-h-32 resize-y font-mono text-sm"
          />
          <p
            id="user-agent-input-hint"
            className="mt-1.5 text-xs text-[var(--color-text-muted)]"
          >
            {isEn
              ? `Up to ${USER_AGENT_LIMITS.maximumLength} characters; processed locally.`
              : `До ${USER_AGENT_LIMITS.maximumLength} символов; обработка выполняется локально.`}
          </p>

          <ToolPrimaryAction
            type="submit"
            className="mt-4"
            leadingIcon={
              <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
            }
          >
            {isEn ? "Parse User-Agent" : "Разобрать User-Agent"}
          </ToolPrimaryAction>
        </form>

        <ToolResult
          id={inputError ? "user-agent-input-error" : undefined}
          status={resultStatus}
          title={resultTitle}
          description={resultDescription}
          className="mt-5"
        >
          {result ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <ResultDetail
                label={isEn ? "Browser" : "Браузер"}
                value={formattedPart(result.browser, isEn)}
              />
              <ResultDetail
                label={isEn ? "Engine" : "Движок"}
                value={formattedPart(result.engine, isEn)}
              />
              <ResultDetail
                label={isEn ? "Operating system" : "Операционная система"}
                value={formattedPart(result.os, isEn)}
              />
              <ResultDetail
                label={isEn ? "Device class" : "Класс устройства"}
                value={localizedDeviceClass(result.deviceClass, isEn)}
              />
              {result.bot ? (
                <ResultDetail
                  label={isEn ? "Bot signature" : "Сигнатура бота"}
                  value={
                    result.bot.version
                      ? `${result.bot.name} ${result.bot.version}`
                      : result.bot.name
                  }
                />
              ) : null}
            </dl>
          ) : null}
        </ToolResult>

        <AdvancedSettings
          className="mt-5"
          title={
            isEn ? "Raw tokens and limits" : "Исходные токены и ограничения"
          }
          description={
            isEn
              ? "Inspect the submitted tokens and parsing scope"
              : "Просмотр токенов и границ разбора"
          }
        >
          <div className="space-y-4 text-sm leading-6 text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "This is local heuristic parsing of a self-reported string. User-Agent values can be reduced or changed. The result does not identify a person, prove an exact device model, create a reliable fingerprint, or verify anything with a server."
                : "Это локальный эвристический разбор строки, которую сообщает сам клиент. User-Agent может быть сокращён или изменён. Результат не определяет человека, не подтверждает точную модель устройства, не создаёт надёжный цифровой отпечаток и ничего не проверяет на сервере."}
            </p>
            <p>
              {isEn
                ? "A bot is shown only when a specific well-known token is present. No bot signature does not prove that the client is human."
                : "Бот показывается только при наличии конкретного известного токена. Отсутствие такой сигнатуры не доказывает, что клиент является человеком."}
            </p>

            <div>
              <h3 className="font-bold text-[var(--color-text)]">
                {isEn ? "Raw tokens" : "Исходные токены"}
              </h3>
              {result ? (
                result.rawTokens.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {result.rawTokens.map((token, index) => (
                      <li
                        key={`${token}-${index}`}
                        className="max-w-full break-all rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] px-2 py-1 font-mono text-xs text-[var(--color-text)]"
                      >
                        {token}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1">
                    {isEn ? "No tokens found." : "Токены не найдены."}
                  </p>
                )
              ) : (
                <p className="mt-1">
                  {isEn
                    ? "Tokens appear after parsing."
                    : "Токены появятся после разбора."}
                </p>
              )}
            </div>
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
