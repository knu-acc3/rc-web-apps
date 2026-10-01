"use client";

import { Download } from "lucide-react";
import { useId, useState } from "react";
import { encode } from "uqr";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { downloadBlob, downloadText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { buildPayload, DEFAULTS, FIELDS, QR_TYPES, TYPE_NAME, type FieldSpec, type Fields, type QrType } from "./lib/build";
import { CAPACITY, contrastCheck, detectMode, encodeQr, fileSlug, logoBox, modulesPath, payloadUnits, qrPng, qrSvg, QUIET, type Ecc } from "./lib/qr";
import QrBatch from "./ui/QrBatch";
import { LookRow, type LookState } from "./ui/kit";

const T = {
  ru: {
    type: "Что закодировать",
    more: "Дополнительные поля",
    empty: "Заполните поля — QR-код появится здесь",
    png: "Скачать PNG",
    svg: "SVG",
    pngSize: "Размер PNG",
    meta: (v: number, n: number, ecc: string, used: string) => `Версия ${v} · ${n}×${n} модулей · уровень ${ecc} · ${used}`,
    bytes: (n: number) => `${formatNumber("ru", n)} байт`,
    chars: (n: number) => `${formatNumber("ru", n)} симв.`,
    tooLong: (used: string, max: string, ecc: Ecc) => `Слишком много данных для одного QR-кода: ${used} при максимуме ${max} на уровне ${ecc}.${ecc !== "L" ? " Выберите уровень L или сократите текст." : " Сократите текст или вынесите его на страницу и закодируйте ссылку."}`,
    contrast: {
      invalid: "Цвет задан неверно",
      inverted: "Модули должны быть темнее фона — многие сканеры не читают светлый код на тёмном фоне",
      low: "Слишком слабый контраст между кодом и фоном — выберите цвет темнее или фон светлее",
    },
    dense: "Код получился плотным: печатайте его не меньше 3×3 см и проверьте сканером перед тиражом",
    alt: "Предпросмотр QR-кода",
  },
  en: {
    type: "What to encode",
    more: "More fields",
    empty: "Fill in the fields — your QR code appears here",
    png: "Download PNG",
    svg: "SVG",
    pngSize: "PNG size",
    meta: (v: number, n: number, ecc: string, used: string) => `Version ${v} · ${n}×${n} modules · level ${ecc} · ${used}`,
    bytes: (n: number) => `${formatNumber("en", n)} bytes`,
    chars: (n: number) => `${formatNumber("en", n)} chars`,
    tooLong: (used: string, max: string, ecc: Ecc) => `Too much data for one QR code: ${used} against a maximum of ${max} at level ${ecc}.${ecc !== "L" ? " Choose level L or shorten the text." : " Shorten the text, or put it on a page and encode the link."}`,
    contrast: {
      invalid: "Invalid colour",
      inverted: "Modules must be darker than the background — many scanners can't read a light code on a dark background",
      low: "Contrast between the code and the background is too low — pick a darker colour or a lighter background",
    },
    dense: "This code is dense: print it at least 3×3 cm and test it with a scanner before a print run",
    alt: "QR code preview",
  },
} as const;

const SIZES = [512, 1024, 2048, 4096];

function initialFields(): Record<QrType, Fields> {
  const out = {} as Record<QrType, Fields>;
  for (const t of QR_TYPES) out[t] = { ...(DEFAULTS[t] ?? {}) };
  return out;
}

function fileName(type: QrType, f: Fields, payload: string): string {
  const pick = type === "wifi" ? `wifi-${f.ssid ?? ""}` : type === "vcard" ? [f.firstName, f.lastName].filter(Boolean).join("-") || f.org || "contact" : type === "gost" || type === "epc" ? `payment-${f.Name ?? f.name ?? ""}` : type === "event" ? f.title ?? "event" : payload;
  return `qr-${fileSlug(pick ?? "", type)}`;
}

export default function QrGenerator({ locale, type: initialType = "url" }: { locale: Locale; type?: QrType }) {
  const t = T[locale];
  const id = useId();
  const [type, setType] = useState<QrType>(initialType);
  const [fields, setFields] = useState(initialFields);
  const [look, setLook] = useState<LookState>({ ecc: "M", fg: "#000000", bg: "#ffffff", logo: null });
  const [pngSize, setPngSize] = useState(1024);
  const [busy, setBusy] = useState(false);

  const f = fields[type];
  const set = (k: string, v: string) => setFields((all) => ({ ...all, [type]: { ...all[type], [k]: v } }));
  const fixed: "H" | "M" | undefined = look.logo ? "H" : type === "epc" ? "M" : undefined;
  const ecc: Ecc = fixed ?? look.ecc;

  const { payload, issues } = buildPayload(type, f, locale);
  const matrix = payload ? encodeQr(encode, payload, ecc) : null;
  const contrast = contrastCheck(look.fg, look.bg);
  const blocked = issues.some((i) => i.level === "error") || !!contrast.issue || !matrix;
  const mode = payload ? detectMode(payload) : "byte";
  const units = payload ? payloadUnits(payload) : 0;
  const usedText = mode === "byte" ? t.bytes(units) : t.chars(units);

  const specs = type === "bulk" ? [] : FIELDS[type].filter((s) => !s.when || s.when(f));
  const primary = specs.filter((s) => !s.more);
  const secondary = specs.filter((s) => s.more);

  async function savePng() {
    if (!matrix || !payload) return;
    setBusy(true);
    try {
      const blob = await qrPng(matrix, look, pngSize);
      downloadBlob(blob, `${fileName(type, f, payload)}.png`);
    } finally {
      setBusy(false);
    }
  }
  function saveSvg() {
    if (!matrix || !payload) return;
    downloadText(qrSvg(matrix, look), `${fileName(type, f, payload)}.svg`, "image/svg+xml");
  }

  const typeSelect = (
    <Field label={t.type} htmlFor={`${id}-type`} className="sm:max-w-xs">
      <Select id={`${id}-type`} value={type} onChange={(e) => setType(e.target.value as QrType)}>
        {QR_TYPES.map((q) => (
          <option key={q} value={q}>
            {TYPE_NAME[q][locale]}
          </option>
        ))}
      </Select>
    </Field>
  );

  if (type === "bulk") {
    return (
      <div className="flex flex-col gap-5">
        {typeSelect}
        <QrBatch locale={locale} look={look} ecc={ecc} />
        <LookRow locale={locale} look={look} onChange={setLook} fixed={fixed} />
      </div>
    );
  }

  const n = matrix ? matrix.size + QUIET * 2 : 0;
  const lb = matrix && look.logo ? logoBox(matrix.size) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {typeSelect}
          <FieldGrid specs={primary} f={f} set={set} locale={locale} id={id} />
          {secondary.length > 0 && (
            <details className="group rounded-[0.75rem] border border-line">
              <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-fg-2 select-none hover:text-fg">{t.more}</summary>
              <div className="px-4 pt-1 pb-4">
                <FieldGrid specs={secondary} f={f} set={set} locale={locale} id={`${id}-m`} />
              </div>
            </details>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 lg:sticky lg:top-20 lg:self-start">
          <div className={cn("aspect-square w-full max-w-[20rem] overflow-hidden rounded-[0.75rem] border border-line", !matrix && "flex items-center justify-center bg-surface-2 p-6 text-center text-sm text-fg-3")}>
            {matrix ? (
              <svg viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" role="img" aria-label={t.alt} className="block size-full">
                <rect width={n} height={n} fill={look.bg} />
                <path d={modulesPath(matrix)} fill={look.fg} />
                {lb && look.logo && (
                  <>
                    <rect x={lb.x} y={lb.y} width={lb.side} height={lb.side} fill={look.bg} />
                    <image href={look.logo} x={lb.x + 0.5} y={lb.y + 0.5} width={lb.side - 1} height={lb.side - 1} preserveAspectRatio="xMidYMid meet" />
                  </>
                )}
              </svg>
            ) : (
              t.empty
            )}
          </div>
          {matrix && <p className="text-center text-[0.8125rem] text-fg-3">{t.meta(matrix.version, matrix.size, ecc, usedText)}</p>}
          <div className="flex w-full max-w-[20rem] gap-2">
            <Button variant="primary" className="flex-1" onClick={savePng} disabled={blocked || busy}>
              <Download className="size-4" aria-hidden />
              {t.png}
            </Button>
            <Button variant="outline" onClick={saveSvg} disabled={blocked}>
              {t.svg}
            </Button>
            <label className="sr-only" htmlFor={`${id}-png`}>
              {t.pngSize}
            </label>
            <Select id={`${id}-png`} value={String(pngSize)} onChange={(e) => setPngSize(Number(e.target.value))} className="w-[7rem]" title={t.pngSize}>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} px
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div aria-live="polite" className="flex flex-col gap-2 empty:hidden">
        {payload && !matrix && <Notice tone="err">{t.tooLong(usedText, mode === "byte" ? t.bytes(CAPACITY.byte[ecc]) : t.chars(CAPACITY[mode][ecc]), ecc)}</Notice>}
        {contrast.issue && <Notice tone="err">{t.contrast[contrast.issue]}</Notice>}
        {issues.map((i) => (
          <Notice key={i.text} tone={i.level === "error" ? "err" : "warn"}>
            {i.text}
          </Notice>
        ))}
        {matrix && matrix.version >= 15 && <Notice tone="neutral">{t.dense}</Notice>}
      </div>

      <LookRow locale={locale} look={look} onChange={setLook} fixed={fixed} />
    </div>
  );
}

function FieldGrid({ specs, f, set, locale, id }: { specs: FieldSpec[]; f: Fields; set: (k: string, v: string) => void; locale: Locale; id: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {specs.map((s) => {
        const fid = `${id}-${s.key}`;
        const cls = s.half ? "" : "sm:col-span-2";
        const value = f[s.key] ?? "";
        if (s.kind === "checkbox")
          return (
            <div key={s.key} className={cn("flex items-end pb-2", cls)}>
              <Checkbox label={s.label[locale]} checked={value === "true"} onChange={(e) => set(s.key, e.target.checked ? "true" : "")} />
            </div>
          );
        return (
          <Field key={s.key} label={s.label[locale]} htmlFor={fid} hint={s.hint?.[locale]} className={cls}>
            {s.kind === "textarea" ? (
              <Textarea id={fid} value={value} onChange={(e) => set(s.key, e.target.value)} placeholder={s.placeholder} rows={3} className={s.mono ? "font-mono" : undefined} />
            ) : s.kind === "select" ? (
              <Select id={fid} value={value || s.options?.[0][0]} onChange={(e) => set(s.key, e.target.value)}>
                {s.options?.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l[locale]}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id={fid}
                type={s.kind === "datetime" ? "datetime-local" : s.kind === "date" ? "date" : "text"}
                value={value}
                onChange={(e) => set(s.key, e.target.value)}
                placeholder={s.placeholder}
                inputMode={s.inputMode}
                autoComplete={s.autoComplete ?? "off"}
                autoCapitalize={s.mono || s.inputMode ? "off" : undefined}
                spellCheck={s.mono || s.inputMode ? false : undefined}
                className={s.mono ? "font-mono" : undefined}
              />
            )}
          </Field>
        );
      })}
    </div>
  );
}
