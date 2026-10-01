"use client";

import { Download } from "lucide-react";
import { useId, useState } from "react";
import { encode } from "uqr";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { downloadBlob, downloadText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { Notice, Panel } from "@/ui/panel";
import { SliderField } from "@/ui/slider-field";
import { buildPayload, DEFAULTS, FIELDS, QR_TYPES, TYPE_NAME, type FieldSpec, type Fields, type QrType } from "./lib/build";
import { CAPACITY, contrastCheck, detectMode, encodeQr, fileSlug, logoBox, modulesPath, payloadUnits, qrPng, qrSvg, QUIET, type Ecc } from "./lib/qr";
import QrBatch from "./ui/QrBatch";
import { ChipChoice } from "@/ui/chip-choice";
import { LookRow, type LookState } from "./ui/kit";

const T = {
  ru: {
    type: "Что закодировать",
    more: "Дополнительные поля",
    empty: "Заполните поля — QR-код появится здесь",
    png: "Скачать PNG",
    svg: "SVG",
    svgTitle: "Скачать SVG",
    look: "Оформление",
    pngSize: "Размер PNG",
    meta: (v: number, n: number, ecc: string, used: string) => `Версия ${v} · ${n}×${n} модулей · уровень ${ecc} · ${used}`,
    bytes: (n: number) => `${formatNumber("ru", n)} байт`,
    chars: (n: number) => `${formatNumber("ru", n)} симв.`,
    tooLong: (used: string, max: string, ecc: Ecc) =>
      `Слишком много данных для одного QR-кода: ${used} при максимуме ${max} на уровне ${ecc}.${ecc !== "L" ? " Выберите уровень L или сократите текст." : " Сократите текст или вынесите его на страницу и закодируйте ссылку."}`,
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
    svgTitle: "Download SVG",
    look: "Look",
    pngSize: "PNG size",
    meta: (v: number, n: number, ecc: string, used: string) => `Version ${v} · ${n}×${n} modules · level ${ecc} · ${used}`,
    bytes: (n: number) => `${formatNumber("en", n)} bytes`,
    chars: (n: number) => `${formatNumber("en", n)} chars`,
    tooLong: (used: string, max: string, ecc: Ecc) =>
      `Too much data for one QR code: ${used} against a maximum of ${max} at level ${ecc}.${ecc !== "L" ? " Choose level L or shorten the text." : " Shorten the text, or put it on a page and encode the link."}`,
    contrast: {
      invalid: "Invalid colour",
      inverted: "Modules must be darker than the background — many scanners can't read a light code on a dark background",
      low: "Contrast between the code and the background is too low — pick a darker colour or a lighter background",
    },
    dense: "This code is dense: print it at least 3×3 cm and test it with a scanner before a print run",
    alt: "QR code preview",
  },
} as const;

function initialFields(): Record<QrType, Fields> {
  const out = {} as Record<QrType, Fields>;
  for (const t of QR_TYPES) out[t] = { ...(DEFAULTS[t] ?? {}) };
  return out;
}

function fileName(type: QrType, f: Fields, payload: string): string {
  const pick =
    type === "wifi"
      ? `wifi-${f.ssid ?? ""}`
      : type === "vcard"
        ? [f.firstName, f.lastName].filter(Boolean).join("-") || f.org || "contact"
        : type === "gost" || type === "epc"
          ? `payment-${f.Name ?? f.name ?? ""}`
          : type === "event"
            ? (f.title ?? "event")
            : payload;
  return `qr-${fileSlug(pick ?? "", type)}`;
}

export default function QrGenerator({ locale, type: initialType = "url" }: { locale: Locale; type?: QrType }) {
  const t = T[locale];
  const id = useId();
  const [type, setType] = useState<QrType>(initialType);
  const [fields, setFields] = useState(initialFields);
  const [look, setLook] = useState<LookState>({ ecc: "M", fg: "#000000", bg: "#ffffff", logo: null });
  const [pngText, setPngText] = useState("1024");
  const typed = /^\d{2,5}$/.test(pngText.trim()) ? Number(pngText.trim()) : 1024;
  const pngSize = Math.min(8192, Math.max(64, typed));
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

  const typeChips = <ChipChoice label={t.type} value={type} onChange={setType} options={QR_TYPES.map((q) => ({ value: q, label: TYPE_NAME[q][locale] }))} />;
  const lookPanel = (
    <Panel className="flex flex-col gap-4 p-4 sm:p-6">
      <h2 className="text-base font-semibold text-fg">{t.look}</h2>
      <LookRow locale={locale} look={look} onChange={setLook} fixed={fixed} />
    </Panel>
  );

  if (type === "bulk") {
    return (
      <div className="flex flex-col gap-4">
        {typeChips}
        <Panel className="p-4 sm:p-6">
          <QrBatch locale={locale} look={look} ecc={ecc} />
        </Panel>
        {lookPanel}
      </div>
    );
  }

  const n = matrix ? matrix.size + QUIET * 2 : 0;
  const lb = matrix && look.logo ? logoBox(matrix.size) : null;

  return (
    <div className="flex flex-col gap-4">
      {typeChips}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        {/* Phones: fields, preview, look (CSS order). From lg the fields and the look share the left column. */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
          <Panel className="order-1 flex min-w-0 flex-col gap-5 p-4 sm:p-6 lg:order-none">
            <FieldGrid specs={primary} f={f} set={set} locale={locale} id={id} />
            {secondary.length > 0 && (
              <Fold variant="inline" title={t.more}>
                <FieldGrid specs={secondary} f={f} set={set} locale={locale} id={`${id}-m`} />
              </Fold>
            )}
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
          </Panel>
          <div className="order-3 min-w-0 lg:order-none">{lookPanel}</div>
        </div>

        <Panel className="order-2 flex min-w-0 flex-col items-center gap-4 p-4 sm:p-6 lg:sticky lg:top-20 lg:order-none">
          <div className={cn("aspect-square w-full max-w-[22rem] overflow-hidden rounded-[1rem]", matrix ? "shadow-elev-1" : "flex items-center justify-center bg-surface-2 p-6 text-center text-sm text-fg-3")}>
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
          <div className="flex w-full max-w-[22rem] gap-2">
            <Button variant="filled" size="lg" className="min-w-0 flex-1" onClick={savePng} disabled={blocked} loading={busy}>
              {!busy && <Download aria-hidden />}
              {t.png}
            </Button>
            <Button variant="outlined" size="lg" onClick={saveSvg} disabled={blocked} title={t.svgTitle}>
              {t.svg}
            </Button>
          </div>
          <SliderField
            id={`${id}-png`}
            label={t.pngSize}
            value={pngText}
            onChange={setPngText}
            parse={(s) => (/^\d{2,5}$/.test(s.trim()) ? Number(s.trim()) : null)}
            format={(v) => String(Math.round(v))}
            min={256}
            max={4096}
            step={128}
            suffix="px"
            inputMode="numeric"
            className="w-full max-w-[22rem]"
          />
        </Panel>
      </div>
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
            <div key={s.key} className={cn("flex items-end", cls)}>
              <Switch label={s.label[locale]} checked={value === "true"} onChange={(e) => set(s.key, e.target.checked ? "true" : "")} />
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
