"use client";

import { Download } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { downloadBlob, downloadText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Field, Input, Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { ChipChoice } from "../shared/ChipChoice";
import { OptionGroup } from "./ui/kit";
import { JS_FORMAT, LABEL, prepareBarcode, SAMPLE, SYMBOLOGIES, type BarcodeError, type Symbology } from "./lib/barcode";

const T = {
  ru: {
    type: "Тип штрихкода",
    value: "Данные",
    hint: {
      ean13: "12 цифр — контрольная добавится сама, или все 13 для проверки",
      ean8: "7 цифр — контрольная добавится сама, или все 8",
      upca: "11 цифр — контрольная добавится сама, или все 12",
      upce: "6 цифр (или 7 с системной цифрой 0/1), контрольная добавится сама",
      code128: "Латинские буквы, цифры, знаки — до 80 символов",
      code39: "Заглавные латинские буквы, цифры и - . $ / + % пробел",
      itf14: "13 цифр — контрольная добавится сама, или все 14",
      codabar: "Цифры и - $ : / . +; старт/стоп A–D добавятся сами",
      msi: "Только цифры; контрольная цифра mod 10 добавится сама",
    } as Record<Symbology, string>,
    err: {
      empty: "Введите данные для штрихкода",
      digits: "Допустимы только цифры",
      length: "Неверное количество цифр для этого типа",
      check: "Контрольная цифра неверна",
      ascii: "Code 128 кодирует только символы ASCII — кириллицу и эмодзи нельзя",
      code39: "Code 39 поддерживает только заглавные латинские буквы, цифры и - . $ / + % пробел",
      codabar: "Codabar кодирует цифры и символы - $ : / . +",
      upceNs: "UPC-E начинается с системной цифры 0 или 1",
      tooLong: "Слишком длинное значение для этого штрихкода",
    } as Record<BarcodeError, string>,
    expected: (v: string) => `Правильно: ${v}`,
    added: (c: string) => `Контрольная цифра ${c} добавлена`,
    checkOk: (c: string) => `Контрольная цифра ${c} верна`,
    msiCheck: (c: string) => `Контрольная цифра mod 10: ${c}`,
    text: "Цифры под штрихкодом",
    bar: "Толщина штриха",
    png: "Скачать PNG",
    svg: "SVG",
    svgTitle: "Скачать SVG",
    alt: "Штрихкод",
  },
  en: {
    type: "Barcode type",
    value: "Data",
    hint: {
      ean13: "12 digits — the check digit is added, or all 13 to verify",
      ean8: "7 digits — the check digit is added, or all 8",
      upca: "11 digits — the check digit is added, or all 12",
      upce: "6 digits (or 7 with number system 0/1); the check digit is added",
      code128: "Latin letters, digits, punctuation — up to 80 characters",
      code39: "Upper-case Latin letters, digits and - . $ / + % space",
      itf14: "13 digits — the check digit is added, or all 14",
      codabar: "Digits and - $ : / . +; A–D start/stop are added",
      msi: "Digits only; the mod 10 check digit is added",
    } as Record<Symbology, string>,
    err: {
      empty: "Enter the barcode data",
      digits: "Digits only",
      length: "Wrong number of digits for this type",
      check: "Wrong check digit",
      ascii: "Code 128 only encodes ASCII — no Cyrillic or emoji",
      code39: "Code 39 supports only upper-case Latin letters, digits and - . $ / + % space",
      codabar: "Codabar encodes digits and - $ : / . +",
      upceNs: "UPC-E starts with number system 0 or 1",
      tooLong: "Too long for this barcode",
    } as Record<BarcodeError, string>,
    expected: (v: string) => `Correct: ${v}`,
    added: (c: string) => `Check digit ${c} added`,
    checkOk: (c: string) => `Check digit ${c} is correct`,
    msiCheck: (c: string) => `Mod 10 check digit: ${c}`,
    text: "Digits under the bars",
    bar: "Bar width",
    png: "Download PNG",
    svg: "SVG",
    svgTitle: "Download SVG",
    alt: "Barcode",
  },
} as const;

type JsBarcodeFn = typeof import("jsbarcode");

/** JsBarcode options; `k` scales everything by a whole number for crisp high-resolution PNG. */
function renderOptions(sym: Symbology, bar: number, showText: boolean, k: number) {
  return {
    format: JS_FORMAT[sym],
    displayValue: showText,
    width: bar * k,
    height: 90 * k,
    margin: 12 * k,
    fontSize: 18 * k,
    textMargin: 4 * k,
    background: "#ffffff",
    lineColor: "#000000",
    font: "ui-monospace, monospace",
  };
}

export default function BarcodeGenerator({ locale, symbology = "ean13" }: { locale: Locale; symbology?: Symbology }) {
  const t = T[locale];
  const id = useId();
  const [sym, setSym] = useState<Symbology>(symbology);
  const [value, setValue] = useState(SAMPLE[symbology]);
  const [showText, setShowText] = useState(true);
  const [bar, setBar] = useState<"1" | "2" | "3" | "4">("2");
  const [lib, setLib] = useState<JsBarcodeFn | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let alive = true;
    import("jsbarcode").then((m) => alive && setLib(() => m.default));
    return () => {
      alive = false;
    };
  }, []);

  const r = prepareBarcode(sym, value);
  const encoded = r.ok ? r.value : "";

  useEffect(() => {
    const el = svg.current;
    if (!lib || !el || !encoded) return;
    try {
      lib(el, encoded, renderOptions(sym, Number(bar), showText, 1));
      el.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      el.removeAttribute("style");
      el.setAttribute("class", "block h-auto w-full max-w-[27.5rem]");
    } catch {
      // input already validated; ignore renderer edge cases
    }
  }, [lib, encoded, sym, bar, showText]);

  function name() {
    return `barcode-${LABEL[sym].toLowerCase().replace(/\s+/g, "")}-${encoded.replace(/[^\w-]+/g, "")}`.slice(0, 80);
  }
  function saveSvg() {
    if (!svg.current || !encoded) return;
    downloadText(new XMLSerializer().serializeToString(svg.current), `${name()}.svg`, "image/svg+xml");
  }
  function savePng() {
    if (!lib || !encoded) return;
    const c = document.createElement("canvas");
    lib(c, encoded, renderOptions(sym, Number(bar), showText, 3));
    c.toBlob((b) => b && downloadBlob(b, `${name()}.png`), "image/png");
  }

  let status: { tone: "ok" | "err" | "idle"; text: string } = { tone: "idle", text: t.hint[sym] };
  if (!r.ok) status = { tone: "err", text: `${t.err[r.error]}${r.expected ? `. ${t.expected(r.expected)}` : ""}` };
  else if (sym === "msi" && r.check) status = { tone: "ok", text: t.msiCheck(r.check) };
  else if (r.check) status = { tone: "ok", text: r.added ? t.added(r.check) : t.checkOk(r.check) };

  return (
    <div className="flex flex-col gap-4">
      <ChipChoice
        label={t.type}
        value={sym}
        onChange={(v) => {
          setSym(v);
          setValue(SAMPLE[v]);
        }}
        options={SYMBOLOGIES.map((s) => ({ value: s, label: LABEL[s] }))}
      />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
        <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
          <Field label={t.value} htmlFor={`${id}-v`}>
            <Input
              id={`${id}-v`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              size="lg"
              className="font-mono"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode={["code128", "code39", "codabar"].includes(sym) ? "text" : "numeric"}
              aria-invalid={!r.ok}
            />
          </Field>
          <p aria-live="polite" className={cn("-mt-3 text-[0.9375rem]", status.tone === "err" ? "text-err" : status.tone === "ok" ? "text-ok" : "text-fg-3")}>
            {status.text}
          </p>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <OptionGroup id={`${id}-bar`} label={t.bar}>
              <Segmented<"1" | "2" | "3" | "4"> label={t.bar} value={bar} onChange={setBar} options={(["1", "2", "3", "4"] as const).map((v) => ({ value: v, label: v }))} />
            </OptionGroup>
            <Switch label={t.text} checked={showText} onChange={(e) => setShowText(e.target.checked)} />
          </div>
        </Panel>

        <Panel className="flex min-w-0 flex-col items-center gap-4 p-4 sm:p-6">
          <div className={cn("flex min-h-[10rem] w-full items-center justify-center rounded-[1rem] bg-white p-4 shadow-elev-1 transition-opacity", !r.ok && "opacity-40")}>
            <svg ref={svg} role="img" aria-label={`${t.alt} ${LABEL[sym]} ${encoded}`} className="block h-auto w-full max-w-[27.5rem]" />
          </div>
          <div className="flex w-full max-w-[27.5rem] gap-2">
            <Button variant="filled" size="lg" className="min-w-0 flex-1" onClick={savePng} disabled={!r.ok || !lib}>
              <Download aria-hidden />
              {t.png}
            </Button>
            <Button variant="outlined" size="lg" onClick={saveSvg} disabled={!r.ok || !lib} title={t.svgTitle}>
              {t.svg}
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
