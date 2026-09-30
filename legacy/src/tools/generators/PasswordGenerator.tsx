"use client";

import { useState } from "react";
import { Check, Key } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

const CHARSET_OPTIONS = [
  {
    id: "lower",
    characters: "abcdefghijklmnopqrstuvwxyz",
    labelEn: "Lowercase",
    labelRu: "Строчные",
  },
  {
    id: "upper",
    characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    labelEn: "Uppercase",
    labelRu: "Прописные",
  },
  {
    id: "digits",
    characters: "0123456789",
    labelEn: "Numbers",
    labelRu: "Цифры",
  },
  {
    id: "symbols",
    characters: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    labelEn: "Symbols",
    labelRu: "Символы",
  },
] as const;

type CharsetId = (typeof CHARSET_OPTIONS)[number]["id"];
type CharsetSelection = Record<CharsetId, boolean>;

type CharacterPool = {
  id: CharsetId;
  characters: string;
};

const INITIAL_CHARSETS: CharsetSelection = {
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
};

function secureRandomIndex(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("Invalid random range");
  }

  const cryptoObject = globalThis.crypto;
  if (!cryptoObject?.getRandomValues) {
    throw new Error("Web Crypto unavailable");
  }

  const values = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;

  do {
    cryptoObject.getRandomValues(values);
  } while (values[0] >= limit);

  return values[0] % maxExclusive;
}

function shuffleCharacters(characters: string[]): string[] {
  const shuffled = [...characters];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = secureRandomIndex(index + 1);
    const currentValue = shuffled[index];
    shuffled[index] = shuffled[target];
    shuffled[target] = currentValue;
  }

  return shuffled;
}

function buildPools(
  selection: CharsetSelection,
  exclusions: string,
): CharacterPool[] {
  const excluded = new Set(Array.from(exclusions));

  return CHARSET_OPTIONS.filter((option) => selection[option.id]).map(
    (option) => ({
      id: option.id,
      characters: Array.from(option.characters)
        .filter((character) => !excluded.has(character))
        .join(""),
    }),
  );
}

function generatePassword(length: number, pools: CharacterPool[]): string {
  const combinedPool = pools.map((pool) => pool.characters).join("");
  const characters = pools.map(
    (pool) => pool.characters[secureRandomIndex(pool.characters.length)],
  );

  while (characters.length < length) {
    characters.push(combinedPool[secureRandomIndex(combinedPool.length)]);
  }

  return shuffleCharacters(characters).join("");
}

function optionSignature(
  lengthInput: string,
  quantityInput: string,
  selection: CharsetSelection,
  exclusions: string,
): string {
  const parsedLength = Number(lengthInput);
  const parsedQuantity = Number(quantityInput);

  return JSON.stringify([
    Number.isFinite(parsedLength) ? parsedLength : lengthInput.trim(),
    Number.isFinite(parsedQuantity) ? parsedQuantity : quantityInput.trim(),
    selection.lower,
    selection.upper,
    selection.digits,
    selection.symbols,
    exclusions,
  ]);
}

function getStrength(
  entropy: number,
  isEn: boolean,
): { label: string; tone: string } {
  if (entropy < 40) {
    return {
      label: isEn ? "Weak" : "Низкая",
      tone: "text-[var(--color-danger)]",
    };
  }
  if (entropy < 60) {
    return {
      label: isEn ? "Moderate" : "Средняя",
      tone: "text-[var(--color-warning)]",
    };
  }
  if (entropy < 80) {
    return {
      label: isEn ? "Strong" : "Высокая",
      tone: "text-[var(--color-success)]",
    };
  }
  return {
    label: isEn ? "Very strong" : "Очень высокая",
    tone: "text-[var(--color-success)]",
  };
}

export default function PasswordGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [lengthInput, setLengthInput] = useState("20");
  const [quantityInput, setQuantityInput] = useState("1");
  const [selection, setSelection] =
    useState<CharsetSelection>(INITIAL_CHARSETS);
  const [exclusions, setExclusions] = useState("");
  const [passwords, setPasswords] = useState<string[] | null>(null);
  const [resultSignature, setResultSignature] = useState<string | null>(null);
  const [error, setError] = useState("");

  const currentSignature = optionSignature(
    lengthInput,
    quantityInput,
    selection,
    exclusions,
  );
  const visiblePasswords =
    resultSignature === currentSignature ? passwords : null;
  const currentPools = buildPools(selection, exclusions);
  const combinedPoolSize = currentPools.reduce(
    (total, pool) => total + pool.characters.length,
    0,
  );
  const parsedLength = Number(lengthInput);
  const invalidLength =
    lengthInput.trim() !== "" &&
    (!Number.isInteger(parsedLength) || parsedLength < 4 || parsedLength > 128);
  const estimatedEntropy =
    visiblePasswords && Number.isInteger(parsedLength) && combinedPoolSize > 1
      ? parsedLength * Math.log2(combinedPoolSize)
      : 0;
  const strength = getStrength(estimatedEntropy, isEn);

  const updateCharset = (id: CharsetId) => {
    setSelection((current) => ({
      ...current,
      [id]: !current[id],
    }));
    setError("");
  };

  const createPasswords = () => {
    const length = Number(lengthInput);
    const quantity = Number(quantityInput);

    if (!Number.isInteger(length) || length < 4 || length > 128) {
      setError(
        isEn
          ? "Length must be a whole number from 4 to 128."
          : "Длина должна быть целым числом от 4 до 128.",
      );
      setPasswords(null);
      setResultSignature(null);
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      setError(
        isEn
          ? "Quantity must be a whole number from 1 to 20."
          : "Количество должно быть целым числом от 1 до 20.",
      );
      setPasswords(null);
      setResultSignature(null);
      return;
    }

    const pools = buildPools(selection, exclusions);
    if (pools.length === 0) {
      setError(
        isEn
          ? "Select at least one character set."
          : "Выберите хотя бы один набор символов.",
      );
      setPasswords(null);
      setResultSignature(null);
      return;
    }

    const emptyPool = pools.find((pool) => pool.characters.length === 0);
    if (emptyPool) {
      setError(
        isEn
          ? "The exclusions removed every character from a selected set."
          : "Исключения удалили все символы из выбранного набора.",
      );
      setPasswords(null);
      setResultSignature(null);
      return;
    }

    if (length < pools.length) {
      setError(
        isEn
          ? "Length must be at least the number of selected character sets."
          : "Длина должна быть не меньше числа выбранных наборов.",
      );
      setPasswords(null);
      setResultSignature(null);
      return;
    }

    try {
      const generated = Array.from({ length: quantity }, () =>
        generatePassword(length, pools),
      );
      const normalizedSignature = optionSignature(
        String(length),
        String(quantity),
        selection,
        exclusions,
      );

      setLengthInput(String(length));
      setQuantityInput(String(quantity));
      setPasswords(generated);
      setResultSignature(normalizedSignature);
      setError("");
    } catch {
      setError(
        isEn
          ? "Secure random generation is unavailable in this browser."
          : "Криптографически стойкая генерация недоступна в этом браузере.",
      );
      setPasswords(null);
      setResultSignature(null);
    }
  };

  return (
    <div data-generator-tool="password" className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {isEn ? "Generate a random password" : "Создайте случайный пароль"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Choose the length. Randomness comes from the browser Web Crypto API."
              : "Выберите длину. Случайные данные создаются браузерным Web Crypto API."}
          </p>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            createPasswords();
          }}
        >
          <div className="max-w-52">
            <Label htmlFor="password-length" className="text-sm font-semibold">
              {isEn ? "Password length" : "Длина пароля"}
            </Label>
            <Input
              id="password-length"
              type="number"
              min={4}
              max={128}
              step={1}
              value={lengthInput}
              onChange={(event) => {
                setLengthInput(event.target.value);
                setError("");
              }}
              inputMode="numeric"
              aria-invalid={invalidLength}
              className="mt-2 h-12 text-lg font-bold tabular-nums"
            />
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {isEn ? "4–128 characters" : "От 4 до 128 символов"}
            </p>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 text-sm font-medium text-[var(--color-danger)]"
            >
              {error}
            </p>
          ) : null}

          <ToolPrimaryAction
            type="submit"
            className="mt-4"
            leadingIcon={<Key size={20} weight="bold" />}
          >
            {isEn ? "Generate password" : "Сгенерировать пароль"}
          </ToolPrimaryAction>
        </form>
      </section>

      {visiblePasswords ? (
        <section
          aria-live="polite"
          data-password-result=""
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                {visiblePasswords.length === 1
                  ? isEn
                    ? "Generated password"
                    : "Сгенерированный пароль"
                  : isEn
                    ? "Generated passwords"
                    : "Сгенерированные пароли"}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {isEn ? "Strength estimate: " : "Оценка стойкости: "}
                <span className={"font-bold " + strength.tone}>
                  {strength.label}
                </span>
                {" · "}
                {estimatedEntropy.toFixed(0)} {isEn ? "bits" : "бит"}
              </p>
            </div>
            {visiblePasswords.length > 1 ? (
              <CopyButton
                text={visiblePasswords.join("\n")}
                size="medium"
                tooltip={isEn ? "Copy all passwords" : "Скопировать все пароли"}
                className="shrink-0"
              />
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            {visiblePasswords.map((password, index) => (
              <div
                key={password + "-" + index}
                className="flex min-w-0 items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3"
              >
                <code className="min-w-0 flex-1 break-all text-lg font-bold leading-relaxed text-[var(--color-text)] sm:text-xl">
                  {password}
                </code>
                <CopyButton
                  text={password}
                  size="medium"
                  tooltip={isEn ? "Copy password" : "Скопировать пароль"}
                  className="shrink-0"
                />
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "The estimate uses length and pool size. It does not guarantee account security; storage, reuse and site limits still matter."
              : "Оценка учитывает длину и размер набора. Она не гарантирует безопасность аккаунта: важны также хранение, повторное использование и ограничения сайта."}
          </p>
        </section>
      ) : null}

      <AdvancedSettings
        title={isEn ? "Character options" : "Параметры символов"}
        description={
          isEn
            ? "Character sets, exclusions and quantity"
            : "Наборы символов, исключения и количество"
        }
      >
        <fieldset>
          <legend className="text-sm font-semibold text-[var(--color-text)]">
            {isEn ? "Character sets" : "Наборы символов"}
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {CHARSET_OPTIONS.map((option) => {
              const active = selection[option.id];
              return (
                <Button
                  key={option.id}
                  type="button"
                  variant={active ? "soft" : "outline"}
                  aria-pressed={active}
                  onClick={() => updateCharset(option.id)}
                  className="min-h-11 justify-start"
                >
                  {active ? (
                    <Check size={18} weight="bold" aria-hidden="true" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-[18px] rounded-sm border border-[var(--color-border-strong)]"
                    />
                  )}
                  {isEn ? option.labelEn : option.labelRu}
                </Button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label
              htmlFor="password-exclusions"
              className="text-sm font-semibold"
            >
              {isEn ? "Exclude characters" : "Исключить символы"}
            </Label>
            <Input
              id="password-exclusions"
              value={exclusions}
              onChange={(event) => {
                setExclusions(event.target.value);
                setError("");
              }}
              autoComplete="off"
              spellCheck={false}
              placeholder={
                isEn ? "Characters to avoid" : "Нежелательные символы"
              }
              className="mt-2 h-12 font-mono"
            />
          </div>

          <div>
            <Label
              htmlFor="password-quantity"
              className="text-sm font-semibold"
            >
              {isEn ? "Quantity" : "Количество"}
            </Label>
            <Input
              id="password-quantity"
              type="number"
              min={1}
              max={20}
              step={1}
              value={quantityInput}
              onChange={(event) => {
                setQuantityInput(event.target.value);
                setError("");
              }}
              inputMode="numeric"
              className="mt-2 h-12"
            />
          </div>
        </div>
      </AdvancedSettings>
    </div>
  );
}
