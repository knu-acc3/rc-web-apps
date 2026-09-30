"use client";

import { useState } from "react";
import { Copy, EnvelopeSimple } from "@phosphor-icons/react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

function postalCodeIsValid(value: string) {
  if (!value.trim()) return true;
  const normalized = value.toUpperCase().replace(/[\s-]+/g, "");
  return (
    /^\d{6}$/.test(normalized) || /^[A-Z]\d{2}[A-Z0-9]{4}$/.test(normalized)
  );
}

function normalizedPostalCode(value: string) {
  return value.toUpperCase().replace(/[\s-]+/g, "");
}

export default function KzAddressFormat() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [locality, setLocality] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [apartment, setApartment] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [recipient, setRecipient] = useState("");
  const [district, setDistrict] = useState("");
  const [region, setRegion] = useState("");
  const [includeCountry, setIncludeCountry] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const invalidate = () => {
    setResult("");
    setError("");
    setCopied(false);
    setCopyFailed(false);
  };

  const formatAddress = () => {
    if (!locality.trim() || !street.trim() || !house.trim()) {
      setResult("");
      setError(
        isEn
          ? "Enter the locality, street, and house number."
          : "Укажите населённый пункт, улицу и номер дома.",
      );
      return;
    }
    if (!postalCodeIsValid(postalCode)) {
      setResult("");
      setError(
        isEn
          ? "The postal code must be six digits or a valid seven-character building index."
          : "Индекс должен состоять из шести цифр либо соответствовать семисимвольному формату индекса строения.",
      );
      return;
    }

    const lines = [
      recipient.trim(),
      street.trim() +
        ", " +
        (isEn ? "house " : "дом ") +
        house.trim() +
        (apartment.trim()
          ? ", " + (isEn ? "apartment " : "квартира ") + apartment.trim()
          : ""),
      locality.trim(),
      district.trim(),
      region.trim(),
      includeCountry ? (isEn ? "KAZAKHSTAN" : "КАЗАХСТАН") : "",
      postalCode.trim() ? normalizedPostalCode(postalCode) : "",
    ].filter(Boolean);

    setResult(lines.join("\n"));
    setError("");
    setCopied(false);
    setCopyFailed(false);
  };

  const copyAddress = async () => {
    const success = await copyText(result);
    setCopyFailed(!success);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="kz-address-locality">
              {isEn ? "Locality" : "Населённый пункт"}
            </Label>
            <Input
              id="kz-address-locality"
              value={locality}
              onChange={(event) => {
                setLocality(event.target.value);
                invalidate();
              }}
              placeholder={
                isEn ? "City, town, or village" : "Город, посёлок или село"
              }
              autoComplete="address-level2"
              className="mt-1.5 h-12 text-base"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="kz-address-street">
              {isEn ? "Street or microdistrict" : "Улица или микрорайон"}
            </Label>
            <Input
              id="kz-address-street"
              value={street}
              onChange={(event) => {
                setStreet(event.target.value);
                invalidate();
              }}
              placeholder={
                isEn ? "Write the full name" : "Укажите полное название"
              }
              autoComplete="address-line1"
              className="mt-1.5 h-12 text-base"
            />
          </div>

          <div>
            <Label htmlFor="kz-address-house">{isEn ? "House" : "Дом"}</Label>
            <Input
              id="kz-address-house"
              value={house}
              onChange={(event) => {
                setHouse(event.target.value);
                invalidate();
              }}
              autoComplete="address-line2"
              className="mt-1.5 h-12 text-base"
            />
          </div>
          <div>
            <Label htmlFor="kz-address-apartment">
              {isEn ? "Apartment (optional)" : "Квартира (необязательно)"}
            </Label>
            <Input
              id="kz-address-apartment"
              value={apartment}
              onChange={(event) => {
                setApartment(event.target.value);
                invalidate();
              }}
              className="mt-1.5 h-12 text-base"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="kz-address-postal">
              {isEn
                ? "Postal code (optional)"
                : "Почтовый индекс (необязательно)"}
            </Label>
            <Input
              id="kz-address-postal"
              value={postalCode}
              onChange={(event) => {
                setPostalCode(event.target.value);
                invalidate();
              }}
              placeholder={
                isEn
                  ? "6 digits or 7 building-index characters"
                  : "6 цифр или 7 символов индекса строения"
              }
              autoComplete="postal-code"
              spellCheck={false}
              className="mt-1.5 h-12 font-mono text-base uppercase"
            />
          </div>
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          onClick={formatAddress}
          disabled={!locality.trim() || !street.trim() || !house.trim()}
          leadingIcon={<EnvelopeSimple size={20} aria-hidden="true" />}
        >
          {isEn ? "Format address" : "Сформировать адрес"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the fields" : "Проверьте поля"}
            description={error}
            className="mt-5"
          />
        ) : result ? (
          <ToolResult
            status="success"
            title={isEn ? "Mailing address" : "Почтовый адрес"}
            description={
              isEn
                ? "The lines follow Kazakhstan postal-address order. This formatter does not verify the address in the official registry."
                : "Строки расположены в порядке почтового адреса Казахстана. Форматтер не проверяет адрес в официальном регистре."
            }
            className="mt-5"
            actions={
              <Button
                type="button"
                variant="secondary"
                onClick={() => void copyAddress()}
              >
                <Copy size={18} aria-hidden="true" />
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
            <pre className="whitespace-pre-wrap break-words rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 font-mono text-sm leading-6">
              {result}
            </pre>
            {copyFailed ? (
              <p
                role="alert"
                className="mt-3 text-sm text-[var(--color-danger)]"
              >
                {isEn
                  ? "Clipboard access was denied."
                  : "Браузер запретил доступ к буферу обмена."}
              </p>
            ) : null}
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "Enter the three required address parts; optional details are hidden below."
                : "Введите три обязательные части адреса; необязательные детали скрыты ниже."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={
            isEn ? "Optional address details" : "Необязательные детали адреса"
          }
          description={
            isEn
              ? "Recipient, district, region, and country"
              : "Получатель, район, область и страна"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="kz-address-recipient">
                {isEn ? "Recipient" : "Получатель"}
              </Label>
              <Input
                id="kz-address-recipient"
                value={recipient}
                onChange={(event) => {
                  setRecipient(event.target.value);
                  invalidate();
                }}
                autoComplete="name"
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="kz-address-district">
                {isEn ? "District" : "Район"}
              </Label>
              <Input
                id="kz-address-district"
                value={district}
                onChange={(event) => {
                  setDistrict(event.target.value);
                  invalidate();
                }}
                autoComplete="address-level3"
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="kz-address-region">
                {isEn ? "Region" : "Область"}
              </Label>
              <Input
                id="kz-address-region"
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value);
                  invalidate();
                }}
                autoComplete="address-level1"
                className="mt-1.5 h-11"
              />
            </div>
            <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={includeCountry}
                onChange={(event) => {
                  setIncludeCountry(event.target.checked);
                  invalidate();
                }}
                className="size-5 accent-[var(--color-primary)]"
              />
              {isEn
                ? "Add country for international mail"
                : "Добавить страну для международного отправления"}
            </label>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
            {isEn
              ? "Official order: recipient; street and building; locality; district; region; country for international mail; postal code."
              : "Официальный порядок: получатель; улица и строение; населённый пункт; район; область; страна для международного отправления; почтовый индекс."}
          </p>
          <a
            href="https://adilet.zan.kz/rus/docs/V1600014370"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            {isEn
              ? "Postal service rules"
              : "Правила предоставления услуг почтовой связи"}
          </a>
        </AdvancedSettings>
      </section>
    </div>
  );
}
